# Refactoring

Refactoring changes structure while **preserving behavior**. That definition is a hard rule: the moment behavior changes, it is a feature or a fix and belongs in its own task.

## When to refactor

- **Preparatory** — a refactor task that makes an upcoming feature easy, executed *before* the feature task ("make the change easy, then make the easy change").
- **Debt paydown** — a recurring pain point (fragile module, duplicated logic) promoted from a code-review note into a scheduled task.
- **Opportunistic, tightly bounded** — trivial cleanups inside code a task already touches. Anything bigger becomes its own task; it does not ride along in a feature PR.

## Rules

1. **Behavior is frozen.** Tests pass unchanged before and after. If a test must change, either it was testing implementation details (fix the test in its own commit) or the "refactor" changed behavior (stop — reclassify).
2. **Tests come first.** Code without test coverage is characterized first: write tests pinning current behavior — including current bugs — then refactor. Fixing discovered bugs is a separate follow-up task.
3. **Separate PRs.** A refactor PR contains zero behavior change; a feature PR contains zero drive-by refactoring. Mixed diffs are unreviewable ([05-Code-Review.md](05-Code-Review.md)).
4. **Small, reversible steps.** Each commit leaves the suite green. If the refactor can't be done in small steps, split the task.
5. **Docs follow.** If module boundaries or names change, the architecture docs update in the same PR ([06-Documentation-Standards.md](06-Documentation-Standards.md)).
