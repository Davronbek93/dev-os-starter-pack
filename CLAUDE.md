# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

DevOS ("Development Operating System") is a reusable kit for AI-assisted software development with Claude Code: methodology docs, agent role definitions, prompts, templates, checklists, plus installable Claude Code subagents and slash commands. It contains **no application code, no build system, and no tests** — all work here is authoring and maintaining Markdown content that other projects copy and adapt.

## Structure

- `docs/` — Numbered methodology docs (01–16) that define the DevOS process. The core pipeline (docs/02): Requirements → Architecture → Data Model → Contracts → Roadmap → Tasks → Implementation → Review → Release. Task states (docs/10): BACKLOG → READY → IN_PROGRESS → REVIEW → TESTING → DONE → RELEASED. docs/11 and docs/12 are indexes of the prompts and agent roles. docs/16 is the concurrency model: wave-based dispatch, Touches disjointness, worktree isolation, serialized merges.
- `agents/` — Human-readable role definitions (architect, orchestrator, backend-engineer, frontend-engineer, reviewer, tester, devops). Each has a strict mandate, responsibilities, hard boundaries, and inputs → outputs.
- `.claude/agents/` — Six of the roles as installable Claude Code subagents (frontmatter + system prompt). The orchestrator is spec-only — realized by the top-level session, never installed. Keep each installed role in sync with its `agents/` counterpart: `agents/` is the specification, `.claude/agents/` is the executable form.
- `prompts/` — Reusable prompts (planning, implementation, review, dispatch, bug), each with goal, required inputs, steps, and an explicit stop condition.
- `.claude/commands/` — The prompts as slash commands: `/plan`, `/implement`, `/review-task`, `/dispatch`, `/bug`. Same sync rule: `prompts/` is the specification.
- `templates/` — Skeletons for project docs, roadmaps, tasks, and PRs.
- `checklists/` — New-project and release checklists.

## Conventions for Editing

- **Keep the dual forms in sync**: a change to a role in `agents/` propagates to `.claude/agents/`; a change to a prompt in `prompts/` propagates to `.claude/commands/`.
- **Keep the indexes in sync**: new agents register in docs/12-Agent-Roles.md, new prompts in docs/11-Prompt-Library.md. New docs follow the `NN-Title.md` numbering.
- **Stay stack-agnostic**: no npm/pytest/etc. specifics — consuming projects add those in their own CLAUDE.md.
- Files cross-reference each other heavily with relative links; when renaming or moving a file, grep for links to it and fix them.
- Every prompt must state its required inputs and a stop condition; every role must state what it must never do.

## Operating Rules (DevOS methodology)

These are the rules this repo exists to promote; follow them when applying DevOS in a project:

- Read docs before coding; architecture first.
- One task per agent instance; small tasks, small PRs. Agents may run in parallel only when dispatched as a wave with disjoint Touches sets (docs/16).
- Documentation is source of truth — sync it in the same PR.
- Meet the full Definition of Done (docs/04) before calling anything done.
- Git: `feature/*` branches, conventional commits, squash-merge.
