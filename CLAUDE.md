# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

DevOS ("Development Operating System") is a reusable kit for AI-assisted software development with Claude Code: methodology docs, agent role definitions, prompts, templates, checklists, plus installable Claude Code subagents and slash commands. Almost all work here is authoring and maintaining Markdown content that other projects copy and adapt: there is **no build system and no test suite**.

The one exception is `board/` — a small, dependency-free Node component (the Kanban board over the task files). It is a shipped part of the kit, not application code for this repo.

## Structure

- `docs/` — Numbered methodology docs (01–18) that define the DevOS process. The core pipeline (docs/02): Requirements → Architecture → Data Model → Contracts → Roadmap → Tasks → Implementation → Review → Release. Task states (docs/10): BACKLOG → READY → IN_PROGRESS → REVIEW → TESTING → DONE → RELEASED. docs/11 and docs/12 are indexes of the prompts and agent roles. docs/16 is the concurrency model: wave-based dispatch, Touches disjointness, worktree isolation, serialized merges. docs/17 is the model-tier policy: REASONING for the gate roles, BUILD for the execution roles, upgrade-only overrides. docs/18 is the board: the Kanban view over the task files, its history/queue files, and the recording protocol agents follow.
- `agents/` — Human-readable role definitions (architect, orchestrator, backend-engineer, frontend-engineer, reviewer, tester, devops). Each has a strict mandate, responsibilities, hard boundaries, and inputs → outputs.
- `.claude/agents/` — Six of the roles as installable Claude Code subagents (frontmatter + system prompt). The orchestrator is spec-only — realized by the top-level session, never installed. Keep each installed role in sync with its `agents/` counterpart: `agents/` is the specification, `.claude/agents/` is the executable form.
- `prompts/` — Reusable prompts (planning, implementation, review, dispatch, board, bug), each with goal, required inputs, steps, and an explicit stop condition.
- `.claude/commands/` — The prompts as slash commands: `/plan`, `/implement`, `/review-task`, `/dispatch`, `/board`, `/bug`. Same sync rule: `prompts/` is the specification.
- `templates/` — Skeletons for project docs, roadmaps, tasks, and PRs.
- `checklists/` — New-project and release checklists.
- `board/` — The board (docs/17): `server.mjs` (HTTP API + UI + SSE), `cli.mjs` (the interface agents record through), `ui/` (plain HTML/CSS/JS), `lib/` (task-file parsing, JSONL history/queue store, dependency graph), `board.config.json`. Node 18+, zero dependencies, binds to `127.0.0.1`. It reads `tasks/*.md` as the source of truth and owns `.devos/events.jsonl` (history) and `.devos/queue.jsonl` (agent requests).

## Conventions for Editing

- **Keep the dual forms in sync**: a change to a role in `agents/` propagates to `.claude/agents/`; a change to a prompt in `prompts/` propagates to `.claude/commands/`.
- **Keep the indexes in sync**: new agents register in docs/12-Agent-Roles.md, new prompts in docs/11-Prompt-Library.md. New docs follow the `NN-Title.md` numbering.
- **Stay stack-agnostic**: no npm/pytest/etc. specifics — consuming projects add those in their own CLAUDE.md.
- Files cross-reference each other heavily with relative links; when renaming or moving a file, grep for links to it and fix them.
- Every prompt must state its required inputs and a stop condition; every role must state what it must never do.
- **Board code follows the templates, not the other way round**: `board/lib/taskfile.mjs` both parses `templates/task-template.md`'s shape (header `- **Field:** value` lines, `##` sections) and writes a skeleton mirroring it in `createTask`. Changing the template's field names or section headings means updating both in the same PR — and the board must degrade gracefully, never rewrite prose it does not understand.
- The board is a view and an inbox: it must never spawn an agent, invent a task state, or become a second source of truth for task data (docs/18-Board.md).

## Operating Rules (DevOS methodology)

These are the rules this repo exists to promote; follow them when applying DevOS in a project:

- Read docs before coding; architecture first.
- One task per agent instance; small tasks, small PRs. Agents may run in parallel only when dispatched as a wave with disjoint Touches sets (docs/16).
- Documentation is source of truth — sync it in the same PR.
- Meet the full Definition of Done (docs/04) before calling anything done.
- Git: `feature/*` branches, conventional commits, squash-merge.
