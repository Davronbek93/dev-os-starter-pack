# Testing Strategy

The test pyramid: many unit tests, fewer integration tests, few E2E tests.

```
Unit -> Integration -> E2E
```

## Unit tests

- Scope: one function/class in isolation; external dependencies replaced with fakes or mocks.
- Fast (milliseconds) and deterministic — no network, no real clock, no shared state between tests.
- Cover: happy path, edge cases (empty, boundary values, invalid input), and error paths.
- Written **with** the code they test, in the same PR — never "later".

## Integration tests

- Scope: several real components together — e.g. service + real database, or two modules across a contract boundary.
- Verify the contracts from `CONTRACTS.md`: request/response shapes, error codes, event payloads.
- Use disposable real dependencies (containers, in-memory servers) over mocks where feasible.

## E2E tests

- Scope: full user journeys through the deployed stack.
- Keep the suite small — only the critical journeys identified in the requirements. E2E tests are slow and brittle; every addition must earn its maintenance cost.

## Rules

- A test that would still pass if the feature were deleted is not a test of that feature — rewrite it.
- Bug fixes start with a failing regression test that reproduces the bug ([prompts/bug.md](../prompts/bug.md)).
- Flaky tests are fixed or quarantined the day they are detected; a red-ish CI trains everyone to ignore red.
- Coverage is a signal, not a goal: use it to find untested branches, never to game a number.
