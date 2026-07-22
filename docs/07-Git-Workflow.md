# Git Workflow

## Branches

- `main` is always releasable. Direct pushes to `main` are forbidden; everything lands via PR.
- One branch per task: `feature/<task-slug>`, `fix/<task-slug>`, `chore/<task-slug>`.
- Branches are short-lived — merged or abandoned within days, not weeks. Rebase on `main` before opening the PR.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <imperative summary>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`.

Rules:
- Summary ≤ 72 chars, imperative mood ("add", not "added").
- Each commit compiles and passes tests on its own where practical.
- No mixed commits: a `refactor` commit contains zero behavior change.

## Pull requests

- One task per PR; small diffs ([01-Principles.md](01-Principles.md)).
- Use [templates/pr-template.md](../templates/pr-template.md).
- CI must be green before review is requested.
- Merge strategy: squash-merge by default so `main` history is one commit per task; the squash message follows Conventional Commits.

## Releases

- Tag releases as `vMAJOR.MINOR.PATCH` (semver) from `main`.
- Follow [checklists/release.md](../checklists/release.md).
