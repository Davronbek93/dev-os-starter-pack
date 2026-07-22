# Architecture Decision Records

An ADR captures one significant decision: the context that forced it, the options considered, the choice, and its consequences. ADRs make "why is it built this way?" answerable years later.

## When to write one

Write an ADR when a decision is expensive to reverse or shapes future work: choosing a database or framework, defining a service boundary, picking an auth strategy, adopting or dropping a major dependency. Skip ADRs for decisions a refactor could undo in an afternoon.

## Storage

`docs/adr/NNNN-short-title.md`, numbered sequentially. ADRs are immutable once accepted — a reversal is a **new** ADR that supersedes the old one (update the old ADR's status to `Superseded by NNNN`).

## Template

```markdown
# NNNN. <Title — the decision as a short sentence>

Date: YYYY-MM-DD
Status: Proposed | Accepted | Deprecated | Superseded by NNNN

## Context
What situation forces a decision? Constraints, requirements, prior art.

## Decision
The choice made, stated actively: "We will use X for Y."

## Alternatives considered
Each rejected option with the concrete reason it lost.

## Consequences
What becomes easier, what becomes harder, what new obligations exist —
including the negative consequences. An ADR with no downsides listed
is incomplete.
```
