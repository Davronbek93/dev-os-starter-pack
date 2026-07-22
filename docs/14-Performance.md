# Performance

How DevOS projects handle performance: budgets first, measurement always, optimization only with evidence.

## Budgets

Non-functional requirements in `REQUIREMENTS.md` must state concrete targets, e.g.:

- API latency: p95 under a stated threshold for key endpoints
- Page load / interaction time for key user journeys
- Throughput and expected data volumes (rows, requests/sec, payload sizes)

A performance problem is a deviation from a stated budget — without budgets, "slow" is an opinion.

## Implementation checklist

- [ ] **No N+1 access patterns** — data needed for a collection is fetched in bulk, not per element.
- [ ] **Bounded work per request** — pagination or limits on anything that grows with data volume; no unbounded loops over user-controlled input.
- [ ] **Indexes match query patterns** — new queries on large tables come with the index that serves them.
- [ ] **Heavy work off the hot path** — slow or failable operations (email, exports, third-party calls) run async where the contract allows.
- [ ] **Caching has an invalidation story** — no cache is added without stating when and how it is invalidated.

## Optimization rules

1. **Measure first.** Optimization PRs must include before/after measurements under realistic data volumes. No measurement, no merge.
2. **Fix the biggest cost first.** Profile to find where time actually goes; do not optimize by intuition.
3. **Readability loses only to evidence.** Code is made less clear for speed only when a measurement in the PR justifies it — and the reason is documented at the site.
4. **Regressions are bugs.** A change that blows a stated budget is treated like a failing test, whoever notices it.
