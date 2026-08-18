# Roadmap Template

Rules: every phase ends in something demonstrable; phases are sequential — a phase starts only when the previous one is DONE — but tasks **within** a phase may run in parallel where the **Depends on** column and Touches disjointness allow (see [16-Concurrency-Model.md](../docs/16-Concurrency-Model.md)); phases are re-cut when reality disagrees with the plan — the roadmap is a living document.

## Phase 0 — Foundations
Goal: a walking skeleton — the thinnest possible end-to-end slice, deployed.

| ID | Task | Role | Depends on |
|---|---|---|---|
| P0-1 | [Repo, CI (lint + tests), environments](tasks/P0-1-repo-ci-environments.md) ([checklists/new-project.md](../checklists/new-project.md)) | devops | — |
| P0-2 | [Skeleton app: one trivial request flows through every architectural layer](tasks/P0-2-walking-skeleton.md) | backend-engineer | P0-1 |
| P0-3 | [Deploy pipeline to a non-production environment](tasks/P0-3-deploy-pipeline.md) | devops | P0-1 |

**Demo:** a deployed "hello" flowing through the real architecture.

## Phase 1 — <Core value>
Goal: the smallest feature set a real user could benefit from.

| ID | Task | Role | Depends on |
|---|---|---|---|
| P1-1 | [<task>](tasks/P1-1-<slug>.md) | <role> | — |
| P1-2 | [<task>](tasks/P1-2-<slug>.md) | <role> | P1-1 |

**Demo:** <the user journey that now works>

## Phase 2 — <Expansion>
Goal: <next increment of value>

| ID | Task | Role | Depends on |
|---|---|---|---|
| P2-1 | [<task>](tasks/P2-1-<slug>.md) | <role> | — |

**Demo:** <what is shown>

---

For each phase list: the goal (one sentence), the task table, and the demo that proves the phase is done. In the table: the **Task** column links to the task file ([task-template.md](task-template.md)); **Role** is the primary owning role (a role, not a person); **Depends on** lists task IDs — `—` means the task may start as soon as the phase opens. The planner **may** additionally annotate tasks with their wave (topological level of the dependency graph, per [16-Concurrency-Model.md](../docs/16-Concurrency-Model.md)) — this is optional output; if omitted, waves are computed from the **Depends on** column at dispatch time. Number further phases as needed; keep "later / maybe" items in a **Backlog** section at the bottom rather than inventing distant phases.

## Backlog
- <ideas not yet committed to a phase>
