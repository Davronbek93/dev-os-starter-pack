# Project Lifecycle

The macro-level phases of a project. Within Implementation, work is organized by the pipeline in [02-Architecture-Guide.md](02-Architecture-Guide.md) and the per-task flow in [10-Task-Lifecycle.md](10-Task-Lifecycle.md).

## 1. Idea
Capture the problem statement and expected value in a few sentences. Decide whether it is worth a requirements phase at all.

## 2. Requirements
Produce `REQUIREMENTS.md`: user stories, functional requirements, non-functional requirements (performance, security, availability), and an explicit **out of scope** list. Ambiguity found here costs minutes; found in production it costs weeks.

## 3. Architecture
Produce the architecture, data model, and contracts documents per [02-Architecture-Guide.md](02-Architecture-Guide.md). Run [checklists/new-project.md](../checklists/new-project.md) before writing any code.

## 4. Implementation
Work the roadmap task by task. Every task follows the task lifecycle and the Definition of Done ([04-Definition-of-Done.md](04-Definition-of-Done.md)). Documentation is updated continuously, not at the end.

## 5. Testing
Continuous during implementation (unit, integration), plus a stabilization pass before release: E2E runs, exploratory testing, performance checks against the non-functional requirements. See [08-Testing-Strategy.md](08-Testing-Strategy.md).

## 6. Deployment
Follow [checklists/release.md](../checklists/release.md). Releases are tagged, changelogs updated, and rollback steps known **before** deploying.

## 7. Maintenance
Bugs enter the backlog through the bug workflow ([prompts/bug.md](../prompts/bug.md)): reproduce, find root cause, fix with a regression test. Recurring pain points become refactoring tasks ([15-Refactoring.md](15-Refactoring.md)).
