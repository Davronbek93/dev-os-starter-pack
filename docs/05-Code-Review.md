# Code Review

Review is a quality gate, not a formality. The reviewer's job is to find problems the author cannot see; the author's job is to make the change easy to review.

## Author responsibilities

- Keep the PR small and single-purpose ([01-Principles.md](01-Principles.md)).
- Fill in the PR template ([templates/pr-template.md](../templates/pr-template.md)): what changed, how it was tested, what it impacts.
- Self-review the diff before requesting review.

## Reviewer checklist

Work top-down; a failure at an earlier level makes later levels moot.

1. **Correctness** — Does it satisfy the task's acceptance criteria? Are edge cases (empty input, concurrency, failure paths) handled?
2. **Architecture fit** — Does it respect component boundaries and contracts from the architecture docs? Does it introduce coupling the design forbids?
3. **Readability** — Can you understand each function without the author explaining it? Are names accurate? Is control flow straightforward?
4. **SOLID / design** — Single responsibility per unit; dependencies point in the right direction; no speculative abstraction.
5. **Security** — Input validation at trust boundaries, no injection vectors, no secrets in the diff, correct authorization checks ([13-Security.md](13-Security.md)).
6. **Performance** — No N+1 patterns, unbounded loops over user-controlled data, or heavy work in hot paths ([14-Performance.md](14-Performance.md)).
7. **Tests** — Do the tests actually assert the new behavior? Would they fail if the change were reverted?
8. **Docs** — Are affected documents updated in this PR?

## Review conduct

- Comments state the problem and, when possible, a suggested direction — not just "this is wrong".
- Distinguish blocking issues from nitpicks; prefix nitpicks with `nit:`.
- The author resolves every comment with a change or a reasoned reply; silent dismissal is not resolution.
