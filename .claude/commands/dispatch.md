---
description: Execute the next wave of READY tasks in parallel worktrees (orchestrator)
argument-hint: [task ids | milestone]
---

Act as the Orchestrator (agents/orchestrator.md) and execute the next wave of READY tasks in parallel to DONE, following the DevOS concurrency model (docs/16-Concurrency-Model.md) exactly:

Scope: $ARGUMENTS

1. Compute the READY set from the task files and roadmap: every task whose dependencies are all DONE and merged into the integration branch. If $ARGUMENTS names explicit task IDs or a milestone, intersect with it.
2. Verify the wave is safe — this is a hard gate: the co-scheduled tasks must have pairwise-disjoint Touches sets and no two may share a serialization point (schema/migrations, shared contract packages, shared stateful dev services — docs/16-Concurrency-Model.md; the project's own conventions doc names the concrete paths). On any overlap, split the wave — keep a maximal disjoint subset, defer the rest — and report the split and its reason. Never launch overlapping tasks. Respect the parallelism cap (default 3).
3. Launch one agent per task: each in its own git worktree on its own branch (named per docs/07-Git-Workflow.md or the project's conventions), each following /implement with its Wave/Branch assignment recorded on the task file. Each agent runs on its role's default model tier (docs/17-Model-Tiers.md); you may upgrade BUILD → REASONING for one unusually complex task, recording the override and its reason in the task's Notes. Never downgrade, and never take a gate role below REASONING.
4. As branches complete, land them serially in dependency order (ties broken by task ID): rebase on the integration branch, require CI green on the rebased branch, apply the per-task review gate to the rebased diff per /review-task, then merge — per docs/07-Git-Workflow.md. Never merge two siblings concurrently.
5. Record what you decided, not what the agents did (docs/18-Board.md). Yours: the wave/branch assignment at dispatch (`node board/cli.mjs dispatch <id> --wave <wave> --branch <branch>`), `DONE` once the branch is merged, and a written blocker on any member you park. The wave agents record their own IN_PROGRESS and REVIEW — never write those for them.

Failure handling: a failed or blocked wave member is parked, not fixed forward — it keeps its state and gains a written blocker on the task file. Independent siblings continue to review and merge.

Stop when every task in the wave is DONE or parked with a written blocker. Do not compute or start the next wave.
