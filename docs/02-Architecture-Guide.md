# Architecture Guide

The DevOS pipeline every project follows:

```
Requirements -> Architecture -> Data Model -> Contracts -> Roadmap -> Tasks -> Implementation -> Review -> Release
```

Each stage produces a written artifact. A stage does not begin until the previous stage's artifact exists and has been reviewed.

## Stages and artifacts

| Stage | Artifact | Answers |
|---|---|---|
| Requirements | `REQUIREMENTS.md` | What must the system do? For whom? What is out of scope? |
| Architecture | `ARCHITECTURE.md` | What are the components? How do they communicate? What are the trade-offs? |
| Data Model | `DATA-MODEL.md` | What entities exist? Their fields, relations, and invariants? |
| Contracts | `CONTRACTS.md` | Exact API endpoints, schemas, events, and error shapes |
| Roadmap | `ROADMAP.md` | In what order are features built? (see [roadmap-template](../templates/roadmap-template.md)) |
| Tasks | task files | One goal + acceptance criteria each (see [task-template](../templates/task-template.md)) |

## Writing the architecture document

Include, in this order:

1. **Context** — the problem and constraints (scale, budget, team, deadlines).
2. **Component diagram** — boxes and arrows; every arrow labeled with protocol/format.
3. **Component responsibilities** — one paragraph per component: what it owns, what it must never do.
4. **Data flow** — walk the 2–3 most important user journeys through the components.
5. **Cross-cutting concerns** — auth, logging, error handling, configuration.
6. **Rejected alternatives** — what you considered and why you said no (feeds ADRs, see [09-ADR.md](09-ADR.md)).

## Rules

- Every significant decision gets an ADR ([09-ADR.md](09-ADR.md)).
- The architecture doc is updated in the same PR as any change that invalidates it.
- If implementation reveals the architecture is wrong: stop, update the document, get it re-reviewed, then continue.
