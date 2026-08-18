# Concurrency Model

How multiple agents work in parallel without giving up the guarantees the rest
of DevOS provides. This document is the single source of truth for parallel
execution; [01-Principles.md](01-Principles.md), [02-Architecture-Guide.md](02-Architecture-Guide.md),
[07-Git-Workflow.md](07-Git-Workflow.md), [10-Task-Lifecycle.md](10-Task-Lifecycle.md),
and [12-Agent-Roles.md](12-Agent-Roles.md) defer to it rather than restate it.

The unit of parallelism is the **task** ([task template](../templates/task-template.md)).
Each agent instance still owns exactly one task from start to done
([01-Principles.md](01-Principles.md) §8); concurrency means several agents each
holding one task at the same time — never one agent juggling several.

## Waves

Tasks are dispatched in **waves** — topological levels of the task dependency
graph:

- **Wave 0** is every task with no unfinished dependencies; wave N+1 is every
  task whose dependencies all sit in waves ≤ N.
- A wave is dispatched together and acts as a barrier: the next wave is not
  computed until the current wave's tasks are DONE or parked with a written
  blocker.
- **Eager fill** is the one softening: a task from the next wave may start early
  if and only if *all* of its dependencies are DONE **and merged** into the
  integration branch, and it passes the disjointness check against every task
  still in flight.

Worked example — five tasks, edges `T1→T2`, `T1→T3`, `T2→T4`, `T3→T4`, `T5` free:

```
Wave A: T1, T5        (no dependencies)
Wave B: T2, T3        (need T1 merged)
Wave C: T4            (needs T2 and T3 merged)
```

If T1 merges while T5 is still running, eager fill lets T2 and T3 start —
provided their Touches sets are disjoint from T5's and from each other's.

## Touches and the disjointness rule

Every task declares a **Touches** set — the files and directories it will
modify (task template field). Two rules make a wave safe:

1. **Disjointness.** Tasks in the same wave (or co-scheduled via eager fill)
   must have pairwise-disjoint Touches sets. Overlap means they do not share a
   wave — the planner or dispatcher splits them, never "coordinates" them.
2. **Serialization points.** Some resources serialize regardless of file
   disjointness: database schema and migration directories (concurrent
   migrations conflict by construction), shared contract packages (both sides
   of every contract depend on them), and shared stateful dev services (one
   database, one object store). Each project names its concrete serialization
   points in its own conventions doc or `CLAUDE.md`. Two tasks touching the
   same serialization point never co-schedule, and a contract or schema task
   runs alone in its wave slot — it is wave 0 by nature
   ([01-Principles.md](01-Principles.md) §2).

An agent that discovers mid-task it needs a file outside its Touches set stops
and reports to the orchestrator ([12-Agent-Roles.md](12-Agent-Roles.md)) — it
does not silently expand its footprint.

## Isolation and merging

- **One worktree per parallel agent.** Each concurrently running agent works in
  its own git worktree on its own branch; the shared clone is never the
  workspace of two agents at once. Mechanics in
  [07-Git-Workflow.md](07-Git-Workflow.md).
- **Merges are serialized** even though implementation is parallel: sibling
  branches merge in dependency order (ties broken by task ID), each rebasing on
  the integration branch after the previous sibling lands, with CI green and the
  per-task review gate ([05-Code-Review.md](05-Code-Review.md)) applied to the
  rebased diff. Full policy in [07-Git-Workflow.md](07-Git-Workflow.md).

## Limits and failure

- **Parallelism cap: 3** concurrent tasks by default. Beyond that, review and
  merge become the bottleneck and the queue idles agents; raise it only with a
  reason written into the plan.
- **A blocked or failed wave member is parked**, not fixed forward: it keeps its
  state, gains a written blocker ([10-Task-Lifecycle.md](10-Task-Lifecycle.md)),
  and the orchestrator is told. Independent siblings continue to review and
  merge; the wave closes when every member is DONE or parked.

## CI contention

Parallel task branches contend for CI in ways a serial process never surfaces;
the project's CI configuration should account for both:

- **Superseded runs.** Give each branch/ref its own CI concurrency group with
  cancel-in-progress semantics, so a force-push cancels the now-stale run
  instead of stacking it.
- **Shared caches.** Build caches keyed loosely (e.g. by lockfile only) can let
  concurrent runs restore a sibling's half-warm cache; include the commit or
  branch in the cache key.
- **Shared stateful dev services** (one dev database, one object store) are
  serialization points (above): tasks that reset, migrate, or reseed them never
  co-schedule with anything that reads them.

The concrete CI syntax is stack-specific — document the chosen configuration in
the project's own conventions doc.

## Non-goal: continuous scheduling

Dispatching any READY task the moment its dependencies finish — a rolling
scheduler instead of waves — is deliberately out of scope. Task state lives in
markdown files, which cannot express race-free claims: two dispatch decisions
can read the same READY task before either records ownership. Waves keep every
dispatch decision explicit, auditable, and made in one place. Eager fill (above)
recovers most of the lost throughput without giving up single-point dispatch.
