---
description: Implement exactly one READY task to the Definition of Done
argument-hint: [task file path or task ID]
---

Implement exactly one task, following prompts/implementation.md exactly:

Task: $ARGUMENTS

1. Read the task file and the sections of ARCHITECTURE.md, DATA-MODEL.md, and CONTRACTS.md it touches. If the task conflicts with the docs, stop and report the conflict.
2. Restate the goal and acceptance criteria; anything outside them is out of scope.
3. Implement on a feature/<task-slug> branch, matching project style and the contracts exactly.
4. Add tests that fail without your change; run the full lint and test suite (docs/08-Testing-Strategy.md).
5. Update any docs your change invalidates, in the same branch (docs/06-Documentation-Standards.md).
6. Verify each acceptance criterion explicitly and report the evidence per criterion, then prepare the PR per templates/pr-template.md.

Stop when this task meets the Definition of Done (docs/04-Definition-of-Done.md) — do not start another task. If the task turns out too big, a contract needs changing, or a dependency isn't done: stop and report. Unrelated bugs: file them, don't fix them here.
