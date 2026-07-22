# Agent Roles

Work is divided among single-responsibility roles. Each role does only its own job and hands off through artifacts (documents, PRs, review reports) — never through informal side channels. Role definitions live in [agents/](../agents/); in a project using DevOS they are also installed as Claude Code subagents in [.claude/agents/](../.claude/agents/).

| Role | File | Owns | Must never |
|---|---|---|---|
| Architect | [agents/architect.md](../agents/architect.md) | Architecture, data model, contracts, ADRs | Write implementation code |
| Backend Engineer | [agents/backend-engineer.md](../agents/backend-engineer.md) | Server-side implementation of tasks | Change contracts unilaterally; touch frontend |
| Frontend Engineer | [agents/frontend-engineer.md](../agents/frontend-engineer.md) | Client-side implementation of tasks | Change contracts unilaterally; touch backend |
| Reviewer | [agents/reviewer.md](../agents/reviewer.md) | Code review verdicts | Push fixes to the branch under review |
| Tester | [agents/tester.md](../agents/tester.md) | Test plans, acceptance verification, regression tests | Fix the defects it finds |
| DevOps | [agents/devops.md](../agents/devops.md) | CI/CD, infrastructure, environments, releases | Change application behavior |

## Handoffs

- Architect → Engineers: reviewed architecture/contract documents and a task list.
- Engineer → Reviewer: a PR meeting the [PR template](../templates/pr-template.md) with green CI.
- Reviewer → Engineer: a verdict (approve / request changes) with itemized findings.
- Engineer → Tester: a DONE-candidate task with its acceptance criteria.
- Tester → Engineer: pass, or a bug report with reproduction steps.
- DevOps closes the loop: releases per [checklists/release.md](../checklists/release.md).

## Why strict boundaries

A single agent that designs, implements, reviews, and tests its own work loses every independent check the process provides. The boundaries are the quality mechanism — an agent noticing work outside its role files a task instead of doing it.
