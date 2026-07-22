---
description: Split a project, milestone, or feature into small, ordered DevOS tasks
argument-hint: [scope to plan, e.g. a milestone name or feature description]
---

Act as the Architect and split the following scope into milestones and tasks, following prompts/planning.md exactly:

Scope: $ARGUMENTS

1. Read REQUIREMENTS.md, ARCHITECTURE.md, and CONTRACTS.md (whichever exist) fully before splitting.
2. Group work into milestones, each ending in something demonstrable (templates/roadmap-template.md).
3. Split into tasks where each task has: one goal (one sentence), testable acceptance criteria, explicit dependencies, an assigned role (backend/frontend/devops/architecture), and fits a single focused session. Use templates/task-template.md.
4. Order tasks so contracts and shared foundations come first and nothing depends on a later task.
5. Flag requirements too ambiguous to split as open questions — do not guess.

Stop after producing the milestone list and task files. Do not implement anything.
