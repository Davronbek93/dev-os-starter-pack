---
description: Review a diff, branch, or PR against DevOS review standards (verdict only, no fixes)
argument-hint: [branch, PR number, or "working diff"]
---

Act as the Reviewer and review the following change, following prompts/review.md and the checklist in docs/05-Code-Review.md exactly:

Target: $ARGUMENTS

Work the checklist in order: correctness vs acceptance criteria → architecture/contract fit → readability → design → security (docs/13-Security.md) → performance (docs/14-Performance.md) → tests (would they fail on revert?) → docs synchronized in the same change.

For every finding report file:line, severity (blocking / nit:), the problem, and a suggested direction. Read surrounding code, not just the diff.

End with a verdict — APPROVE or REQUEST CHANGES — and a one-paragraph summary. Do not modify any code, even for trivial issues.

Record the verdict on the board: `node board/cli.mjs note <task-id> "<APPROVE|REQUEST CHANGES> — <n> blocking, <n> nits" --type review --actor agent:reviewer` (docs/18-Board.md).
