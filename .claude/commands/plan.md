---
description: Split a project, milestone, or feature into small DevOS tasks forming a parallelizable dependency graph
argument-hint: [scope to plan, e.g. a milestone name or feature description]
---

Act as the Architect and split the following scope into milestones and tasks with explicit dependencies — a graph that independent agents can execute in parallel where safe — following prompts/planning.md exactly:

Scope: $ARGUMENTS

1. Read REQUIREMENTS.md, ARCHITECTURE.md, and CONTRACTS.md (whichever exist) fully before splitting.
2. Group work into milestones, each ending in something demonstrable (templates/roadmap-template.md).
3. Split into tasks where each task has: one goal (one sentence), testable acceptance criteria, explicit dependencies, an assigned role (backend/frontend/devops/architecture), a Touches set (the files/dirs it will modify), and fits a single focused session. Use templates/task-template.md.
4. Partial-order the tasks by their dependencies, then propose waves: tasks in the same wave must have pairwise-disjoint Touches sets and no shared serialization points (docs/16-Concurrency-Model.md). Contracts and shared foundations are wave 0 or serialization points — they land before, or run alone among, the tasks that depend on them. Emit the waves as a table: `| Wave | Tasks | Why parallel-safe |`.
5. Flag requirements too ambiguous to split as open questions — do not guess.

Stop after producing the milestone list, the task files, and the wave table. Do not implement anything.
