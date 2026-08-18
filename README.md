# Development Operating System (DevOS)

A reusable operating system for AI-assisted software development with Claude Code:
methodology docs, agent roles, prompts, templates, checklists, and a local board —
copied into a project and adapted, not installed.

DevOS exists to make agent work **predictable**: architecture before code, one task
per agent, an independent review gate, parallelism only where it is provably safe,
and a written record of everything that happened.

## What you get

| | |
|---|---|
| **A methodology** | 17 numbered docs ([docs/](docs/)) covering the pipeline from requirements to release, and the rules that make each step checkable |
| **Roles with hard boundaries** | Seven single-responsibility roles ([agents/](agents/)), six of them installable as Claude Code subagents — no agent designs, implements, reviews, and tests its own work |
| **Prompts as slash commands** | `/plan`, `/dispatch`, `/implement`, `/review-task`, `/board`, `/bug` — each with required inputs, steps, and an explicit stop condition |
| **A board** | A local Kanban view over your task files ([board/](board/)): you add tasks, agents do the rest, and each card carries the story of what happened |

Everything is stack-agnostic. Stack-specific commands (how to lint, test, build,
deploy) belong in the consuming project's own `CLAUDE.md`.

## Quick start

### In a new project

```bash
# 1. copy DevOS in (at minimum: docs/, .claude/, board/, CLAUDE.md)
cp -R dev-os-starter-pack/{docs,agents,prompts,templates,checklists,board,.claude,CLAUDE.md} my-project/

# 2. in my-project: adapt CLAUDE.md to the stack, then work the checklist
#    checklists/new-project.md — requirements, architecture, roadmap, repo, CI

# 3. open the board and leave it next to your Claude Code session
node board/server.mjs        # → http://127.0.0.1:4317
```

Then drive the work from a Claude Code session at the project root:

```
/plan Phase 1                  split a milestone into a dependency graph of tasks
/dispatch                      run the next parallel-safe wave to DONE
/implement T-014               take exactly one READY task to the Definition of Done
/review-task T-014             independent verdict on the diff — no fixes
/board                         drain the requests you queued from the board
/bug "500 on POST /orders"     root-cause a defect, diagnosis only
```

### Just to see the board

```bash
node board/server.mjs
```

Node 18+, zero dependencies, bound to `127.0.0.1`. It reads `tasks/*.md` — an
empty or missing task directory is fine, the board starts empty and offers
**+ New task**.

## The loop

```
    you                board                Claude Code                 agents
     │                   │                       │                         │
     │  + New task ─────►│                       │                         │
     │                   │── BACKLOG card        │                         │
     │                   │── /plan request ─────►│                         │
     │  /board ─────────────────────────────────►│  drains the queue       │
     │                   │                       │───► architect: refine ──┤
     │                   │                       │───► orchestrator: wave ─┤
     │                   │                       │───► engineers ──────────┤
     │                   │                       │───► reviewer, tester ───┤
     │                   │◄── state + story ◄────┴─────────────────────────┘
     │◄── card moves ────│
```

Two rules hold this together:

- **The board never starts an agent.** It writes task files and queues requests;
  every session is started by a human. Nothing runs while you are away.
- **The task file is the source of truth.** The board's history is derived from
  it — an agent that edits a task file directly is reconciled and recorded, not
  ignored.

## Slash commands

| Command | Prompt | What it does | Stops when |
|---|---|---|---|
| [`/plan`](.claude/commands/plan.md) | [planning.md](prompts/planning.md) | Splits a scope into small tasks with dependencies, Touches sets, and a wave table | The task files and wave table exist — no implementation |
| [`/dispatch`](.claude/commands/dispatch.md) | [dispatch.md](prompts/dispatch.md) | Runs the next parallel-safe wave: one agent, one worktree, one branch each; merges serially | Every wave member is DONE or parked with a written blocker |
| [`/implement`](.claude/commands/implement.md) | [implementation.md](prompts/implementation.md) | Takes exactly one READY task to the Definition of Done, tests and docs included | The PR is ready — it never picks up a second task |
| [`/review-task`](.claude/commands/review-task.md) | [review.md](prompts/review.md) | Independent review of a diff, branch, or PR against the review checklist | The verdict is delivered — it fixes nothing, even nits |
| [`/board`](.claude/commands/board.md) | [board.md](prompts/board.md) | Drains the board's request queue through the prompts above | The queue is empty, or a request needs a human decision |
| [`/bug`](.claude/commands/bug.md) | [bug.md](prompts/bug.md) | Root-causes a defect | The root cause is identified — the fix is a separate task |

## Roles

| Role | Owns | Must never |
|---|---|---|
| [Architect](agents/architect.md) | Architecture, data model, contracts, ADRs, task splitting | Write implementation code |
| [Orchestrator](agents/orchestrator.md) | Dependency graph, waves, dispatch, merge order, board bookkeeping | Write or review code |
| [Backend Engineer](agents/backend-engineer.md) | Server-side implementation of one task | Change contracts unilaterally; touch frontend |
| [Frontend Engineer](agents/frontend-engineer.md) | Client-side implementation of one task | Change contracts unilaterally; touch backend |
| [Reviewer](agents/reviewer.md) | Review verdicts | Push fixes to the branch under review |
| [Tester](agents/tester.md) | Test plans, acceptance verification, regression tests | Fix the defects it finds |
| [DevOps](agents/devops.md) | CI/CD, infrastructure, environments, releases | Change application behavior |

Six are installed as Claude Code subagents in [.claude/agents/](.claude/agents/).
The Orchestrator is spec-only — it is the top-level session itself, which cannot
delegate dispatch to a subagent of its own.

## The board

```
BACKLOG ─► READY ─► IN_PROGRESS ─► REVIEW ─► TESTING ─► DONE ─► RELEASED
  you     orchestr.   engineer     reviewer   tester   orchestr.  devops
```

Columns are exactly the task states — the board adds none of its own. Each card
shows what the concurrency model needs to stay auditable: wave, branch, unmet
dependencies, Touches overlap with tasks in flight, blocker flag, and the share
of acceptance criteria met. Click a card for its **story**: every state change,
dispatch, review verdict, and blocker, with who did it and when.

| File | Role |
|---|---|
| `tasks/*.md` | Source of truth — ordinary DevOS task files |
| `.devos/events.jsonl` | Append-only history behind each card's story |
| `.devos/queue.jsonl` | Requests waiting for `/board` to pick them up |

All three are text and belong in git. Setup, configuration, CLI and HTTP
reference: [board/README.md](board/README.md). The model and its boundaries:
[docs/17-Board.md](docs/17-Board.md).

## How work is structured

- **Task lifecycle** ([docs/10](docs/10-Task-Lifecycle.md)) — `BACKLOG → READY →
  IN_PROGRESS → REVIEW → TESTING → DONE → RELEASED`, never skipping. Backward
  moves are allowed and honest; *blocked* is a flag with a written reason, not a
  state.
- **Waves** ([docs/16](docs/16-Concurrency-Model.md)) — tasks are dispatched in
  topological levels. Co-scheduled tasks must have pairwise-disjoint **Touches**
  sets and share no serialization point (schema/migrations, shared contract
  packages, shared stateful dev services). Default parallelism cap: 3.
- **Isolation** ([docs/07](docs/07-Git-Workflow.md)) — one worktree and one
  branch per parallel agent; merges are serialized in dependency order, each
  rebased, re-tested, and re-reviewed before it lands.
- **Done** ([docs/04](docs/04-Definition-of-Done.md)) — acceptance criteria
  demonstrated, tests written, docs synchronized in the same PR, review passed.

## Repository layout

| Path | Contents |
|---|---|
| [docs/](docs/) | The methodology, `NN-Title.md`, 01–17 |
| [agents/](agents/) | Role definitions — the specification |
| [.claude/agents/](.claude/agents/) | The same roles as installable subagents — the executable form |
| [prompts/](prompts/) | Reusable prompts — the specification |
| [.claude/commands/](.claude/commands/) | The same prompts as slash commands — the executable form |
| [templates/](templates/) | Project docs, roadmap, task, PR skeletons |
| [checklists/](checklists/) | New-project and release checklists |
| [board/](board/) | The board: server, agent CLI, UI, task-file parsing |

## Documentation index

| # | Doc | What it settles |
|---|---|---|
| 01 | [Principles](docs/01-Principles.md) | The non-negotiables the rest of DevOS derives from |
| 02 | [Architecture Guide](docs/02-Architecture-Guide.md) | The pipeline: Requirements → Architecture → Data Model → Contracts → Roadmap → Tasks → Implementation → Review → Release |
| 03 | [Project Lifecycle](docs/03-Project-Lifecycle.md) | Phases of a project and what ends each one |
| 04 | [Definition of Done](docs/04-Definition-of-Done.md) | What "done" means, checkably |
| 05 | [Code Review](docs/05-Code-Review.md) | The review checklist and verdicts |
| 06 | [Documentation Standards](docs/06-Documentation-Standards.md) | The synchronization rule: docs change with the code |
| 07 | [Git Workflow](docs/07-Git-Workflow.md) | Branches, worktrees, conventional commits, merge policy |
| 08 | [Testing Strategy](docs/08-Testing-Strategy.md) | What to test at which level, and what a test must prove |
| 09 | [ADR](docs/09-ADR.md) | Recording decisions that are expensive to reverse |
| 10 | [Task Lifecycle](docs/10-Task-Lifecycle.md) | Task states, transition criteria, blockers |
| 11 | [Prompt Library](docs/11-Prompt-Library.md) | Index of prompts and their slash commands |
| 12 | [Agent Roles](docs/12-Agent-Roles.md) | Index of roles, handoffs, why the boundaries are strict |
| 13 | [Security](docs/13-Security.md) | The checklist every implementation applies |
| 14 | [Performance](docs/14-Performance.md) | Budgets and the checklist that defends them |
| 15 | [Refactoring](docs/15-Refactoring.md) | When refactoring is allowed and how it stays behavior-free |
| 16 | [Concurrency Model](docs/16-Concurrency-Model.md) | Waves, Touches disjointness, serialization points, CI contention |
| 17 | [Board](docs/17-Board.md) | The board's data model, recording protocol, and boundaries |

## Requirements

- **Claude Code** — for the subagents and slash commands
- **git** — worktrees are how parallel agents stay isolated
- **Node 18+** — only for the board; nothing else in DevOS runs code

## Extending DevOS

- **Keep the dual forms in sync**: `agents/` → `.claude/agents/`, `prompts/` →
  `.claude/commands/`. The first is the specification, the second the executable
  form.
- **Keep the indexes in sync**: new roles register in
  [docs/12](docs/12-Agent-Roles.md), new prompts in
  [docs/11](docs/11-Prompt-Library.md), new docs follow the `NN-Title.md`
  numbering.
- **Every prompt states its required inputs and stop condition; every role states
  what it must never do.** A prompt without a stop condition is how an agent ends
  up doing three tasks in one branch.
- **Stay stack-agnostic** — no npm/pytest/gradle specifics in this repo.
