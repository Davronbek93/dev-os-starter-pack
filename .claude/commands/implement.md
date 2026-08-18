---
description: Implement exactly one READY task to the Definition of Done
argument-hint: [task file path or task ID]
---

Implement exactly one task, following prompts/implementation.md exactly:

Task: $ARGUMENTS

1. Read the task file and the sections of ARCHITECTURE.md, DATA-MODEL.md, and CONTRACTS.md it touches. If the task conflicts with the docs, stop and report the conflict.
2. Restate the goal and acceptance criteria; anything outside them is out of scope.
3. If the task carries a Wave/Branch assignment (dispatched as part of a wave, docs/16-Concurrency-Model.md): work in the assigned worktree on the assigned branch, and modify only files in the task's Touches set — needing a file outside it is a stop-and-report condition. Without an assignment, work solo; the wave rules do not apply.
4. Take it on the board: `node board/cli.mjs state <id> IN_PROGRESS --actor agent:<role> --branch <branch>` (docs/18-Board.md). Record your own transitions only — the wave/branch assignment and everything after the merge belong to the orchestrator.
5. Implement on the task's branch — the Branch field if assigned, otherwise named per docs/07-Git-Workflow.md (project-configurable; DevOS default feature/<task-slug> only when the project defines no convention) — matching project style and the contracts exactly.
6. Add tests that fail without your change; run the full lint and test suite (docs/08-Testing-Strategy.md). Apply the security checklist (docs/13-Security.md).
7. Update any docs your change invalidates, in the same branch (docs/06-Documentation-Standards.md).
8. Verify each acceptance criterion explicitly and report the evidence per criterion, then prepare the PR per templates/pr-template.md.
9. Hand off on the board when the PR is ready: `node board/cli.mjs state <id> REVIEW --actor agent:<role> --note "PR <link>"`. Stopping to report instead: `node board/cli.mjs block <id> "<reason>" --actor agent:<role>`.

Stop when this task meets the Definition of Done (docs/04-Definition-of-Done.md) — do not start another task. If the task turns out too big, a contract needs changing, a dependency isn't done, or (in a wave) a needed file falls outside the Touches set: stop and report. Unrelated bugs: file them, don't fix them here.
