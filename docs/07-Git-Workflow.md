# Git Workflow

## Branches

- `main` is always releasable. Direct pushes to `main` are forbidden; everything lands via PR.
- The **integration branch** is where task branches merge. Default: `main`. A project may designate another (e.g. a `dev` branch that releases to `main` via a separate PR).
- One branch per task. Naming is **project-configurable**: the project's own conventions doc wins; the DevOS default `feature/<task-slug>` (`fix/<task-slug>`, `chore/<task-slug>`) applies only when the project defines none.
- Branches are short-lived — merged or abandoned within days, not weeks. Rebase on the integration branch before opening the PR.

## Sibling branches in flight

When several task branches exist concurrently, the policy is defined in
[16-Concurrency-Model.md](16-Concurrency-Model.md); this section carries the git mechanics.

- **One worktree per parallel agent.** Each concurrently running agent works in its own git worktree (`git worktree add <path> <branch>`) or separate checkout, on its own branch. The shared clone is never the workspace of two concurrent agents.
- **Merges are serialized, in dependency order.** Siblings merge into the integration branch one at a time, dependent tasks after their dependencies; ties are broken by task ID (lowest first).
- **Rebase cadence.** After each sibling lands, every remaining sibling rebases on the updated integration branch before its own merge.
- **CI re-greens per merge.** CI must pass on the rebased branch before each merge — a green run from before the previous sibling landed does not count.
- **Review the rebased diff.** The review gate ([05-Code-Review.md](05-Code-Review.md)) applies to the post-rebase diff; conflict resolutions made during the rebase are part of the reviewed change.

### Worked example

Three tasks T1, T2, T3; one dependency edge T1→T3; T2 independent.

1. T1 and T2 run in parallel — separate worktrees, separate branches. T3 waits on T1.
2. T1 finishes first. Rebase on the integration branch, CI green, review the rebased diff, squash-merge.
3. T1 is merged, so T3 may start; its agent branches from the updated integration branch in its own worktree.
4. T2 finishes. Rebase on the integration branch (which now contains T1), CI re-greens on the rebased branch, review the rebased diff, squash-merge.
5. T3 finishes. Rebase (integration branch now contains T1 and T2), CI re-greens, review the rebased diff, squash-merge.
6. Had T2 and T3 been ready to merge simultaneously — no edge between them — task ID breaks the tie: T2 first, T3 rebases after it lands.

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
