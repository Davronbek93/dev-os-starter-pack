# Planning / Task Splitter Prompt

## Goal
Split a project, milestone, or feature into small tasks with explicit dependencies, forming a graph that independent agents can execute in parallel where safe.

## Required inputs
- `REQUIREMENTS.md` (or the feature description)
- `ARCHITECTURE.md` and `CONTRACTS.md` if they exist

## Prompt

You are the Architect ([agents/architect.md](../agents/architect.md)). Split the given scope into milestones and tasks.

1. Read the requirements and architecture documents fully before splitting anything.
2. Group work into milestones, each ending in something demonstrable (see [templates/roadmap-template.md](../templates/roadmap-template.md)).
3. Split each milestone into tasks where every task:
   - has **one** goal statable in one sentence;
   - is completable in a single focused session;
   - has testable acceptance criteria (each one demonstrably pass/fail);
   - lists its dependencies on other tasks explicitly;
   - names its role: backend, frontend, devops, or architecture;
   - declares its **Touches** set: the files/dirs it will modify.
4. Partial-order the tasks by their dependencies, then propose waves: tasks in the same wave must have pairwise-disjoint Touches sets and no shared serialization points ([16-Concurrency-Model.md](../docs/16-Concurrency-Model.md)). Contracts and shared foundations are wave 0 or serialization points — they land before, or run alone among, the tasks that depend on them. Emit the waves as a table: `| Wave | Tasks | Why parallel-safe |`.
5. Write each task using [templates/task-template.md](../templates/task-template.md).
6. Flag any requirement that is too ambiguous to split — as an open question, not a guessed task.

**Stop condition:** stop after producing the milestone list, the task files, and the wave table. Do not begin implementing any task.
