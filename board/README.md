# DevOS Board

A local Kanban board over your task files. You add tasks; agents refine,
implement, review, and test them; the board shows where everything is and what
already happened. Full model and boundaries: [docs/17-Board.md](../docs/17-Board.md).

## Run

```
node board/server.mjs
```

Node 18+, zero dependencies, bound to `127.0.0.1:4317`. Nothing is installed and
nothing is spawned: the server reads and writes files, and hands agent requests
to the queue that `/board` drains in a Claude Code session.

## Layout

| Path | What |
|---|---|
| `server.mjs` | HTTP API + UI + live updates (SSE) |
| `cli.mjs` | The interface agents use — `node board/cli.mjs help` |
| `ui/` | The board itself (plain HTML/CSS/JS) |
| `lib/` | Task-file parsing, history/queue store, dependency graph |
| `board.config.json` | Where tasks and board data live, port, parallelism cap |

## Data it owns

- `tasks/*.md` — the source of truth, unchanged DevOS task files
- `.devos/events.jsonl` — append-only history behind each card's story
- `.devos/queue.jsonl` — requests waiting for an agent session

All three are text and belong in git. Override the locations with
`board.config.json`, or per-run with `DEVOS_ROOT`, `DEVOS_TASKS_DIR`,
`DEVOS_DATA_DIR`, `PORT`.

## Common commands

```
node board/cli.mjs list                 # every task and its state
node board/cli.mjs show <task-id>       # one task with its full story
node board/cli.mjs wave                 # the next parallel-safe wave (advisory)
node board/cli.mjs queue                # requests waiting for /board
node board/cli.mjs state <id> REVIEW --actor agent:backend-engineer --note "PR #12"
```
