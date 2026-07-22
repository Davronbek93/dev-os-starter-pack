# Implementation Prompt

## Goal
Implement exactly one READY task, end to end, to the Definition of Done.

## Required inputs
- One task file (goal, acceptance criteria, dependencies)
- Project docs: `ARCHITECTURE.md`, `DATA-MODEL.md`, `CONTRACTS.md`

## Prompt

You are implementing **one task only** ([docs/10-Task-Lifecycle.md](../docs/10-Task-Lifecycle.md)).

1. **Read first.** Read the task file and the sections of the architecture, data-model, and contract docs it touches. If the task conflicts with the docs, stop and report the conflict — do not improvise.
2. **Confirm scope.** Restate the goal and acceptance criteria in your own words. Anything you'd need to build that isn't in the criteria is out of scope.
3. **Implement** on a `feature/<task-slug>` branch, matching the project's existing style and the contracts exactly.
4. **Test with the code.** Add tests that fail without your change ([docs/08-Testing-Strategy.md](../docs/08-Testing-Strategy.md)). Run the full lint and test suite.
5. **Sync docs.** Update any document your change invalidates, in the same branch ([docs/06-Documentation-Standards.md](../docs/06-Documentation-Standards.md)).
6. **Verify** each acceptance criterion explicitly and report the evidence per criterion.

**Stop conditions:**
- Stop when the [Definition of Done](../docs/04-Definition-of-Done.md) items you can satisfy locally are done and the PR is ready. Do not pick up the next task.
- Stop and ask if you discover the task is bigger than a session, a contract needs changing, or a dependency task isn't actually done.
- Found an unrelated bug? File it; do not fix it here.
