# Definition of Done

A task is **DONE** only when every item below is true. Partial completion is IN_PROGRESS, no matter how close.

## Checklist

- [ ] **Acceptance criteria met** — every criterion in the task file is demonstrably satisfied.
- [ ] **Lint passes** — zero errors, zero new warnings, using the project's linter.
- [ ] **Tests pass** — the full test suite is green locally and in CI.
- [ ] **New behavior is tested** — the change includes tests that would fail without it. Bug fixes include a regression test reproducing the bug.
- [ ] **Docs updated** — architecture, data model, contracts, README, or changelog: whichever this change touches is synchronized in the same PR (see [06-Documentation-Standards.md](06-Documentation-Standards.md)).
- [ ] **Reviewed** — at least one approving review per [05-Code-Review.md](05-Code-Review.md); all review comments resolved.
- [ ] **No unrelated changes** — the diff contains only what the task required.

## Notes

- "Done except for tests" is not done.
- If a criterion cannot be met (flaky CI, blocked dependency), the task goes back to the board with a written blocker — not into a half-merged state.
