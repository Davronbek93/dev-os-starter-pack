# Task: <short imperative title>

- **ID:** <TASK-NNN>
- **Role:** architect | backend | frontend | devops | tester
- **State:** BACKLOG | READY | IN_PROGRESS | REVIEW | TESTING | DONE | RELEASED
- **Milestone:** <phase from ROADMAP.md>
- **Wave:** <optional — assigned at dispatch, see [16-Concurrency-Model.md](../docs/16-Concurrency-Model.md)>
- **Branch:** <optional — per [07-Git-Workflow.md](../docs/07-Git-Workflow.md) / project conventions>

## Goal
One sentence. If you need "and", split the task.

## Context
Links to the relevant sections of `ARCHITECTURE.md` / `CONTRACTS.md` / prior tasks. What the implementer must read first.

## Acceptance criteria
Each criterion independently checkable as pass/fail:

- [ ] <observable behavior 1>
- [ ] <observable behavior 2>
- [ ] <error/edge case behavior>

## Touches
Files/dirs this task will modify — used for the disjointness check in [16-Concurrency-Model.md](../docs/16-Concurrency-Model.md):

- <path/to/file-or-dir>

## Dependencies
Dependencies must be DONE **and merged** before this task is dispatchable.

- <TASK-NNN> — <why>

## Out of scope
What this task deliberately does **not** include (prevents scope creep during implementation).

## Blocker
Why this task cannot move right now, in prose — set when a task is parked ([10-Task-Lifecycle.md](../docs/10-Task-Lifecycle.md)), cleared when it is unblocked. `_none_` otherwise.

_none_

## Notes
Open questions, hints, or constraints for the implementer. Empty is fine.
