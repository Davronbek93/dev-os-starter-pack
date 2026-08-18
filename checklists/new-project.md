# New Project Checklist

Complete in order. Writing code before this list is done violates [docs/01-Principles.md](../docs/01-Principles.md).

## 1. Requirements
- [ ] `REQUIREMENTS.md` written: problem, users, functional + non-functional requirements
- [ ] **Out of scope** section explicitly filled
- [ ] Requirements reviewed by a second party (human or reviewer agent)

## 2. Architecture
- [ ] `ARCHITECTURE.md`, `DATA-MODEL.md`, `CONTRACTS.md` written per [docs/02-Architecture-Guide.md](../docs/02-Architecture-Guide.md)
- [ ] Trust boundaries and auth model defined ([docs/13-Security.md](../docs/13-Security.md))
- [ ] Performance budgets stated ([docs/14-Performance.md](../docs/14-Performance.md))
- [ ] Initial ADRs written for the major choices ([docs/09-ADR.md](../docs/09-ADR.md))
- [ ] Design reviewed

## 3. Roadmap
- [ ] `ROADMAP.md` written per [templates/roadmap-template.md](../templates/roadmap-template.md); Phase 0 is a walking skeleton
- [ ] Phase 0 + Phase 1 split into tasks ([prompts/planning.md](../prompts/planning.md))

## 4. Repo
- [ ] Repository created; `main` branch protected (PRs only)
- [ ] `CLAUDE.md`, DevOS docs, `.claude/agents/` and `.claude/commands/` copied in and adapted
- [ ] Linter and formatter configured; `.gitignore` and secrets strategy in place (no secrets in repo)
- [ ] README with setup + run + test commands
- [ ] `board/` copied in and configured ([docs/17-Board.md](../docs/17-Board.md)): `node board/server.mjs` shows the Phase 0 tasks, and the board data dir (`.devos/` by default) is committed, not gitignored

## 5. CI
- [ ] CI runs lint + tests + dependency audit on every PR; red blocks merge
- [ ] Build artifact produced; deploy pipeline to a non-production environment works
- [ ] Conventional-commit / PR-template conventions enforced or documented ([docs/07-Git-Workflow.md](../docs/07-Git-Workflow.md))
