# Agent Roles

Work is divided among single-responsibility roles. Each role does only its own job and hands off through artifacts (documents, PRs, review reports) — never through informal side channels. Role definitions live in [agents/](../agents/); in a project using DevOS they are also installed as Claude Code subagents in [.claude/agents/](../.claude/agents/).

| Role | File | Owns | Must never |
|---|---|---|---|
| Architect | [agents/architect.md](../agents/architect.md) | Architecture, data model, contracts, ADRs | Write implementation code |
| Orchestrator | [agents/orchestrator.md](../agents/orchestrator.md) | Dependency graph, wave computation, dispatch, merge sequencing, task-state bookkeeping | Write implementation code; review code; merge unreviewed branches; assign one task to two agents |
| Backend Engineer | [agents/backend-engineer.md](../agents/backend-engineer.md) | Server-side implementation of tasks | Change contracts unilaterally; touch frontend |
| Frontend Engineer | [agents/frontend-engineer.md](../agents/frontend-engineer.md) | Client-side implementation of tasks | Change contracts unilaterally; touch backend |
| Reviewer | [agents/reviewer.md](../agents/reviewer.md) | Code review verdicts | Push fixes to the branch under review |
| Tester | [agents/tester.md](../agents/tester.md) | Test plans, acceptance verification, regression tests | Fix the defects it finds |
| DevOps | [agents/devops.md](../agents/devops.md) | CI/CD, infrastructure, environments, releases | Change application behavior |

The Orchestrator is spec-only: it is realized by the top-level Claude Code session, not installed as a subagent (see [agents/orchestrator.md](../agents/orchestrator.md)).

## Handoffs

- Architect → Engineers: reviewed architecture/contract documents and a task list.
- Orchestrator → Engineers: a wave dispatch with the task files to execute.
- Engineers → Orchestrator: DONE-candidate branches for merge sequencing.
- Engineer → Reviewer: a PR meeting the [PR template](../templates/pr-template.md) with green CI.
- Reviewer → Engineer: a verdict (approve / request changes) with itemized findings.
- Engineer → Tester: a DONE-candidate task with its acceptance criteria.
- Tester → Engineer: pass, or a bug report with reproduction steps.
- DevOps closes the loop: releases per [checklists/release.md](../checklists/release.md).

## Multiple instances of one role

Several instances of the same role (e.g. two Backend Engineers) may run concurrently, each owning exactly one task, and only when dispatched together in a wave per [16-Concurrency-Model.md](16-Concurrency-Model.md) — never by self-assignment.

## Why strict boundaries

A single agent that designs, implements, reviews, and tests its own work loses every independent check the process provides. The boundaries are the quality mechanism — an agent noticing work outside its role files a task instead of doing it. In particular, dispatch and review must not be the same agent: the dispatcher wants branches to land, while the reviewer must be free to reject them.
