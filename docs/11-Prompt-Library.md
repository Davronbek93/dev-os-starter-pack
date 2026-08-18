# Prompt Library

Reusable prompts for driving Claude Code through the DevOS workflow. Full texts live in [prompts/](../prompts/); in a project using DevOS they are also available as slash commands from [.claude/commands/](../.claude/commands/).

| Prompt | File | Slash command | Use when |
|---|---|---|---|
| Planning / Task Splitter | [prompts/planning.md](../prompts/planning.md) | `/plan` | Turning requirements or a milestone into a parallelizable graph of small tasks |
| Implementation | [prompts/implementation.md](../prompts/implementation.md) | `/implement` | Executing exactly one READY task end to end |
| Review | [prompts/review.md](../prompts/review.md) | `/review-task` | Reviewing a diff or PR against the review checklist |
| Dispatch | [prompts/dispatch.md](../prompts/dispatch.md) | `/dispatch` | Executing the next wave of READY tasks in parallel worktrees and landing their merges in order |
| Bug Investigation | [prompts/bug.md](../prompts/bug.md) | `/bug` | Diagnosing a defect before any fix is written |
| Board Sync | [prompts/board.md](../prompts/board.md) | `/board` | Draining the board's request queue ([18-Board.md](18-Board.md)) |

## Conventions for adding prompts

- One prompt per file in `prompts/`, named after the activity.
- A prompt defines: the goal, the required inputs (task file, diff, error report), the steps, and the stop condition ("stop after X; do not continue to Y").
- Register new prompts in this table and, if project-facing, add a matching command in `.claude/commands/`.
