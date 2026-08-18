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
3. **Check for a wave assignment.** If the task carries a Wave/Branch assignment (dispatched as part of a wave, [docs/16-Concurrency-Model.md](../docs/16-Concurrency-Model.md)): work in the assigned worktree on the assigned branch, and modify only files in the task's Touches set — needing a file outside it is a stop-and-report condition. Without an assignment, work solo; the wave rules do not apply.
4. **Take it on the board.** `node board/cli.mjs state <id> IN_PROGRESS --actor agent:<role> --branch <branch>` ([docs/18-Board.md](../docs/18-Board.md)). You record your own transitions and nothing else: the wave and branch assignment, and everything after the merge, belong to the orchestrator.
5. **Implement** on the task's branch — the Branch field if assigned, otherwise named per [docs/07-Git-Workflow.md](../docs/07-Git-Workflow.md) (project-configurable; DevOS default `feature/<task-slug>` only when the project defines no convention) — matching the project's existing style and the contracts exactly.
6. **Test with the code.** Add tests that fail without your change ([docs/08-Testing-Strategy.md](../docs/08-Testing-Strategy.md)). Apply the security checklist ([docs/13-Security.md](../docs/13-Security.md)). Run the full lint and test suite.
7. **Sync docs.** Update any document your change invalidates, in the same branch ([docs/06-Documentation-Standards.md](../docs/06-Documentation-Standards.md)).
8. **Verify** each acceptance criterion explicitly and report the evidence per criterion.
9. **Hand off on the board** the moment the PR is ready: `node board/cli.mjs state <id> REVIEW --actor agent:<role> --note "PR <link>"`. If you stop and report instead, say why on the card: `node board/cli.mjs block <id> "<reason>" --actor agent:<role>`.

**Stop conditions:**
- Stop when the [Definition of Done](../docs/04-Definition-of-Done.md) items you can satisfy locally are done and the PR is ready. Do not pick up the next task.
- Stop and ask if you discover the task is bigger than a session, a contract needs changing, a dependency task isn't actually done, or (in a wave) a needed file falls outside the Touches set.
- Found an unrelated bug? File it; do not fix it here.
