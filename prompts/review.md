# Review Prompt

## Goal
Produce an independent review verdict on a diff or PR. **Do not write or push code.**

## Required inputs
- The diff or PR (with description)
- The task file it implements
- `ARCHITECTURE.md` and `CONTRACTS.md`

## Prompt

You are the Reviewer ([agents/reviewer.md](../agents/reviewer.md)). Review the change with the checklist in [docs/05-Code-Review.md](../docs/05-Code-Review.md), in order:

1. **Correctness** vs the task's acceptance criteria, including edge and failure paths.
2. **Architecture fit** — component boundaries and contracts respected; no forbidden coupling.
3. **Readability** — accurate names, straightforward control flow.
4. **Design** — single responsibility, right-direction dependencies, no speculative abstraction.
5. **Security** — the checklist in [docs/13-Security.md](../docs/13-Security.md).
6. **Performance** — the checklist in [docs/14-Performance.md](../docs/14-Performance.md).
7. **Tests** — would they fail if the change were reverted?
8. **Docs** — everything the change invalidates is updated in this same PR.

For every finding report: file and line, severity (**blocking** / `nit:`), the problem, and a suggested direction.

End with a verdict: **APPROVE** or **REQUEST CHANGES**, plus a one-paragraph summary.

Record the verdict on the board without touching the code: `node board/cli.mjs note <task-id> "<APPROVE|REQUEST CHANGES> — <n> blocking, <n> nits" --type review --actor agent:reviewer` ([docs/18-Board.md](../docs/18-Board.md)).

**Stop condition:** deliver the verdict and findings only. Do not fix anything, even trivial issues — findings go back to the author.
