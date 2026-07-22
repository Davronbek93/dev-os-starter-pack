# Development Operating System (DevOS)

A reusable operating system for AI-assisted software development with Claude Code: methodology docs, agent roles, prompts, templates, and checklists you copy into a project and adapt.

## Goals

- Standardize engineering across projects
- Reuse prompts and templates instead of re-inventing them
- Enforce architecture-first development
- Give AI agents strict, single-responsibility roles with real quality gates

## What's inside

| Directory | Contents |
|---|---|
| [docs/](docs/) | The methodology, numbered 01–15: principles, architecture pipeline, lifecycle, Definition of Done, code review, docs standards, git workflow, testing, ADRs, task lifecycle, prompt/agent indexes, security, performance, refactoring |
| [agents/](agents/) | Role definitions: architect, backend/frontend engineer, reviewer, tester, devops — each with a mission, responsibilities, and hard boundaries |
| [prompts/](prompts/) | Reusable prompts: planning, implementation, review, bug investigation |
| [templates/](templates/) | Skeletons: project docs, roadmap, task, PR |
| [checklists/](checklists/) | New-project and release checklists |
| [.claude/agents/](.claude/agents/) | The roles as installable Claude Code **subagents** |
| [.claude/commands/](.claude/commands/) | The prompts as **slash commands**: `/plan`, `/implement`, `/review-task`, `/bug` |

## Using it in a new project

1. Copy this repo's contents (or the parts you need) into your project — at minimum `docs/`, `.claude/`, and `CLAUDE.md`.
2. Adapt `CLAUDE.md` and the templates to the project's stack and commands.
3. Run [checklists/new-project.md](checklists/new-project.md) top to bottom **before writing code**.
4. Drive work through the slash commands: `/plan` a milestone, `/implement` one task at a time, `/review-task` the result, `/bug` when something breaks.

## Core ideas

- **Architecture first** — the pipeline in [docs/02-Architecture-Guide.md](docs/02-Architecture-Guide.md): Requirements → Architecture → Data Model → Contracts → Roadmap → Tasks → Implementation → Review → Release.
- **One task at a time** — tasks move through the states in [docs/10-Task-Lifecycle.md](docs/10-Task-Lifecycle.md); done means the full [Definition of Done](docs/04-Definition-of-Done.md).
- **Documentation is the source of truth** — code changes synchronize docs in the same PR ([docs/06-Documentation-Standards.md](docs/06-Documentation-Standards.md)).
- **Independent checks** — the agent roles in [docs/12-Agent-Roles.md](docs/12-Agent-Roles.md) are deliberately separated so no agent designs, implements, reviews, and tests its own work.

Everything is intentionally stack-agnostic; add stack-specific commands and conventions in the consuming project's own `CLAUDE.md`.
