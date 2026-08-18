# Task Lifecycle

Every task moves through these states, in order, never skipping:

```
BACKLOG -> READY -> IN_PROGRESS -> REVIEW -> TESTING -> DONE -> RELEASED
```

## States and transition criteria

| State | Meaning | Exits when |
|---|---|---|
| **BACKLOG** | Captured but not refined | Task file is complete per the [task template](../templates/task-template.md): one goal, testable acceptance criteria, dependencies listed |
| **READY** | Refined and unblocked | An agent picks it up (all dependencies DONE) |
| **IN_PROGRESS** | Being implemented on its own branch | PR opened, CI green, self-review done |
| **REVIEW** | Under code review ([05-Code-Review.md](05-Code-Review.md)) | Approved with all comments resolved |
| **TESTING** | Verification against acceptance criteria | Every criterion demonstrated to pass |
| **DONE** | Merged; Definition of Done ([04](04-Definition-of-Done.md)) fully met | Included in a release |
| **RELEASED** | Shipped in a tagged release | — |

## Rules

- **One owner per task.** Ownership changes are explicit handoffs, with state noted.
- **One task IN_PROGRESS per agent** ([01-Principles.md](01-Principles.md)). Multiple agents may each hold one task IN_PROGRESS concurrently — legal only when dispatched as a wave ([16-Concurrency-Model.md](16-Concurrency-Model.md)).
- **Backward moves are allowed and honest**: review rejection returns the task to IN_PROGRESS; a failed acceptance check returns it to IN_PROGRESS with a note. Never "fix forward" inside REVIEW.
- **Blocked is not a state — it's a flag.** A blocked task keeps its state, gains a written blocker description, and its owner escalates rather than starting a second task silently.
- **Every transition is recorded.** Moving a task means editing its State field *and* leaving a line in the board's history ([18-Board.md](18-Board.md)) — one command does both: `node board/cli.mjs state <id> <STATE> --actor agent:<role>`. A transition nobody can reconstruct afterwards did not happen.
- If a task turns out too big mid-flight, close it, split it ([prompts/planning.md](../prompts/planning.md)), and start fresh — don't let one branch absorb three tasks.
