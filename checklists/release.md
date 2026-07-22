# Release Checklist

Run top to bottom for every release. Any failed item aborts the release.

## 1. Tests
- [ ] Full suite (unit, integration, E2E) green on the release commit in CI — not just locally
- [ ] No quarantined/skipped tests hiding a known failure in released paths
- [ ] Acceptance criteria of every task in the release verified (all tasks DONE, none "almost")

## 2. Docs
- [ ] Changelog updated: user-visible changes, breaking changes called out
- [ ] `ARCHITECTURE.md` / `DATA-MODEL.md` / `CONTRACTS.md` match what is being shipped
- [ ] Migration steps (if any) documented, with rollback steps

## 3. Tag
- [ ] Version chosen per semver (breaking → major, feature → minor, fix → patch)
- [ ] Release commit tagged `vX.Y.Z` on `main` ([docs/07-Git-Workflow.md](../docs/07-Git-Workflow.md))

## 4. Deploy
- [ ] Rollback path confirmed **before** deploying (previous artifact deployable; DB migration reversible or safe-forward)
- [ ] Deploy to staging; smoke-test the critical journeys
- [ ] Deploy to production via the pipeline (no manual hot-fixes)
- [ ] Post-deploy: monitor dashboards and error rates against budgets ([docs/14-Performance.md](../docs/14-Performance.md)) until stable
- [ ] Announce the release; close the released tasks (state → RELEASED)
