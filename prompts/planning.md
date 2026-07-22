# Planning / Task Splitter Prompt

## Goal
Split a project, milestone, or feature into small, ordered, implementable tasks.

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
   - names its role: backend, frontend, devops, or architecture.
4. Order tasks so that contracts and shared foundations come first and no task depends on a later one.
5. Write each task using [templates/task-template.md](../templates/task-template.md).
6. Flag any requirement that is too ambiguous to split — as an open question, not a guessed task.

**Stop condition:** stop after producing the milestone list and task files. Do not begin implementing any task.
