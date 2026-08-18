# Dispatch Prompt

## Goal
Act as the Orchestrator ([agents/orchestrator.md](../agents/orchestrator.md)) and execute the next wave of READY tasks in parallel to DONE, per the concurrency model ([docs/16-Concurrency-Model.md](../docs/16-Concurrency-Model.md)).

## Required inputs
- The task directory and/or roadmap
- Optionally an explicit subset of task IDs to consider
- A parallelism cap (default 3, per [docs/16-Concurrency-Model.md](../docs/16-Concurrency-Model.md))

## Prompt

1. Compute the READY set: every task whose dependencies are all DONE **and merged** into the integration branch. If an explicit task-ID subset was given, intersect with it.
2. Verify the wave is safe — this is a **hard gate**: the co-scheduled tasks must have pairwise-disjoint Touches sets and no two may share a serialization point (schema/migrations, shared contract packages, shared stateful dev services — see [docs/16-Concurrency-Model.md](../docs/16-Concurrency-Model.md)). On any overlap, split the wave — keep a maximal disjoint subset, defer the rest to a later wave — and report the split and its reason. Never launch overlapping tasks. Respect the parallelism cap.
3. Launch one agent per task in the wave: each in its own git worktree on its own branch (mechanics in [docs/07-Git-Workflow.md](../docs/07-Git-Workflow.md)), each following the implementation prompt ([implementation.md](implementation.md)) with its Wave/Branch assignment recorded on the task.
4. As branches complete, land them **serially in dependency order** (ties broken by task ID): rebase the branch on the integration branch, require CI green on the rebased branch, apply the per-task review gate to the rebased diff per the review prompt ([review.md](review.md)), then merge — per [docs/07-Git-Workflow.md](../docs/07-Git-Workflow.md). Never merge two siblings concurrently.
5. Update task states as tasks move ([docs/10-Task-Lifecycle.md](../docs/10-Task-Lifecycle.md)) and record wave assignments (the task **Wave** field) so the dispatch is auditable.

**Failure handling:** a failed or blocked wave member is parked, not fixed forward — it keeps its state and gains a written blocker on the task file. Independent siblings continue to review and merge.

**Stop condition:** stop when every task in the wave is DONE or parked with a written blocker. Do not compute or start the next wave.
