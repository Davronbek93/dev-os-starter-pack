# Documentation Standards

Documentation is the source of truth ([01-Principles.md](01-Principles.md)). These rules keep it trustworthy.

## The synchronization rule

Any PR that changes behavior updates the affected documents **in the same PR**:

| You changed... | You must update... |
|---|---|
| Component boundaries, dependencies, tech choices | `ARCHITECTURE.md` (+ an ADR, see [09-ADR.md](09-ADR.md)) |
| Entities, fields, relations, migrations | `DATA-MODEL.md` |
| API endpoints, schemas, events, error shapes | `CONTRACTS.md` |
| Setup, commands, env vars | `README.md` |
| User-visible behavior | changelog |

Reviewers block PRs that skip this ([05-Code-Review.md](05-Code-Review.md)).

## Writing rules

- **State facts, not history.** Docs describe the system as it is now; git history records how it got there. Never write "we recently changed X to Y".
- **One home per fact.** Each fact lives in exactly one document; other documents link to it. Duplicated facts drift.
- **Examples over prose.** A request/response example communicates a contract better than three paragraphs.
- **Delete dead docs.** An outdated document is worse than none — it is confidently wrong. If a doc no longer reflects reality and won't be fixed, delete it.

## Structure

- Project-level docs live at the repo root or in `docs/`, named as in the table above.
- Decisions live in `docs/adr/` as numbered ADRs.
- Task files live wherever the project's tracker is; if file-based, `tasks/` with the [task template](../templates/task-template.md).
