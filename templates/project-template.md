# Project Template

Copy this structure into a new project's `docs/` (or root). Each section becomes its own file; delete what a small project genuinely doesn't need, but delete consciously.

## REQUIREMENTS.md
- **Problem** — who has it, what it costs them
- **Users & roles**
- **Functional requirements** — numbered, testable statements
- **Non-functional requirements** — performance budgets, security, availability
- **Out of scope** — explicit list; prevents silent scope creep

## ARCHITECTURE.md
Per [docs/02-Architecture-Guide.md](../docs/02-Architecture-Guide.md):
- Context & constraints
- Component diagram (every arrow labeled)
- Component responsibilities
- Key data flows
- Cross-cutting concerns (auth, logging, errors, config)
- Rejected alternatives

## DATA-MODEL.md
- Entities: fields, types, constraints
- Relations and cardinality
- Invariants ("a paid order always has a payment record")
- Migration/versioning approach

## CONTRACTS.md
- Every endpoint/event: method, path, auth requirement
- Request and response schemas **with example payloads**
- Error shapes and codes
- Versioning policy

## ROADMAP.md
Per [roadmap-template.md](roadmap-template.md).

## Supporting files
- `docs/adr/` — decision records ([docs/09-ADR.md](../docs/09-ADR.md))
- `tasks/` — task files ([task-template.md](task-template.md)), if file-based tracking
- `CLAUDE.md` — project rules for Claude Code
