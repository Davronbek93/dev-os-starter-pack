# Model Tiers

Not every agent needs the same model. This document defines how a DevOS
project assigns an LLM tier to each agent role — the single source of truth
for model selection; [12-Agent-Roles.md](12-Agent-Roles.md) and the dispatch
prompt defer to it rather than restate it. The kit stays stack-agnostic:
**no concrete model names appear here** — a project binds tiers to real
models in an ADR ([Binding](#binding)).

## Tiers

- **REASONING** — the strongest model available to the project. For roles
  accountable for open-ended judgment that gates other work: architecture and
  contracts, task splitting, review verdicts, dispatch decisions.
- **BUILD** — a fast, capable implementation model. For roles accountable for
  executing work against an already-fixed spec, contract, or written
  acceptance criteria.

Two tiers are deliberate. A third "mechanical" tier (cheapest models for
trivial, judgment-free edits) is a non-goal until a project can show a role
whose work is genuinely judgment-free — adopting one is a new ADR, not a
quiet frontmatter edit.

## Mapping principle

The tier follows what the role is **accountable for**, not how large its
diffs are. A role whose output *decides* whether other work is correct or
what work exists (unbounded design space) runs at REASONING; a role whose
output is *bounded* by documents someone else authored — contracts, data
models, acceptance criteria, checklists — runs at BUILD. By that principle,
the kit's roles map as:

| Role | Tier | Bounded by |
|---|---|---|
| Orchestrator | REASONING | nothing — its dispatch decisions gate every wave |
| Architect | REASONING | nothing — it authors the documents that bound everyone else |
| Reviewer | REASONING | the checklist, but its verdict is the merge gate |
| Backend / Frontend Engineer | BUILD | contracts, architecture docs, the task file |
| Tester | BUILD | written acceptance criteria |
| DevOps | BUILD | documented conventions and checklists |

Project-specific agents that have no kit role here map by the same principle
in the project's binding ADR.

## Defaults and overrides

- **Default = role binding.** The binding ADR's table is installed in the
  executable agent definitions (in Claude Code: the subagent's `model`
  frontmatter). An agent launched without ceremony runs on its role's tier.
- **Dispatch-time upgrade only.** The orchestrator may upgrade a BUILD-tier
  agent to REASONING for one unusually complex task, recording the override
  and its reason on the task file (Notes) at dispatch — auditable, like wave
  assignments ([16-Concurrency-Model.md](16-Concurrency-Model.md)).
- **Never downgrade.** No agent runs below its role's tier; gate roles
  (orchestrator, architect, reviewer) never leave REASONING. The
  orchestrator's own tier is the one no agent definition can bind — it is
  enforced only by the session's model choice, recorded as a recommendation
  in the binding ADR.
- **The planner does not choose models.** There is no per-task model field in
  the [task template](../templates/task-template.md): model authority is the
  role binding plus the orchestrator's dispatch-time upgrade, nothing else.
- **Fallbacks are decided in the ADR.** The binding ADR names the fallback
  binding for when a tier's model is unavailable; a value the runtime rejects
  falls back to the tool's inherit behavior and is filed as a defect.
- **Blanket overrides stay off.** Environment-level model overrides that
  outrank agent definitions (in Claude Code: `CLAUDE_CODE_SUBAGENT_MODEL`)
  silently flatten every tier and must stay unset in project environments.

## Why

Parallel execution multiplied agent-hours
([16-Concurrency-Model.md](16-Concurrency-Model.md)): a wave of three
implementers at top tier costs three top-tier sessions. Under this model the
implementation majority runs on BUILD — cheaper and faster per wave — while
every decision that can reject or reshape that work keeps the strongest
model. The quality mechanism of [12-Agent-Roles.md](12-Agent-Roles.md)
(independent gates) is exactly what makes BUILD-tier first-pass quality
acceptable: the gates catch it.

## Deferred (non-goals for now)

- A FAST/mechanical tier (above).
- Reasoning-effort tiering — an orthogonal knob; no evidence yet which roles
  would benefit.

## Binding

Concrete models are a project decision with cost and billing consequences —
they live in a project ADR that covers every installed agent (including
project-specific ones), the fallback binding, and closure of any open
questions. Name that ADR here when the project writes it: the kit ships the
policy, the project ships the binding.
