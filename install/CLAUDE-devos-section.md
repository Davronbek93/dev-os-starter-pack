# DevOS section for your CLAUDE.md

`devos install` never edits your `CLAUDE.md` — it drops this file next to the kit so you
can paste the part you want. Replace the placeholders with your project's values (they
match what you answered at install time, recorded in `devos.config.json`).

---

## DevOS methodology (`<kitDir>/`)

DevOS defines the **process layer**; this project's own docs remain the source of truth
for the **product**. On any conflict, the project docs and this CLAUDE.md win.

- `<kitDir>/docs/` — numbered methodology docs (01–18). Core pipeline (02): Requirements →
  Architecture → Data Model → Contracts → Roadmap → Tasks → Implementation → Review →
  Release. Task states (10): BACKLOG → READY → IN_PROGRESS → REVIEW → TESTING → DONE →
  RELEASED. Waves and the Touches disjointness rule (16). Model tiers (17). The board (18).
- `<kitDir>/agents/` — role specifications; `.claude/agents/` is their executable form.
- `<kitDir>/prompts/` — prompt specifications; `.claude/commands/` is their executable form.
- `<kitDir>/templates/`, `<kitDir>/checklists/` — task/PR/roadmap skeletons and gates.

## Orchestration

1. You are the **orchestrator**. Delegate implementation to the subagents in
   `.claude/agents/`; never implement and review the same change.
2. Concurrent work only as a **wave**: pairwise-disjoint Touches sets, no shared
   serialization point, parallelism cap <parallelismCap> (`<kitDir>/docs/16-…`). Dispatch
   with `/dispatch`.
3. Every agent runs on its role's **model tier** (`<kitDir>/docs/17-Model-Tiers.md`).
   Upgrade at dispatch when a task is unusually hard; never downgrade.
4. The **board** (`<kitDir>/docs/18-Board.md`) is a view and an inbox, rooted at the
   repository's main worktree. Record every transition through `node <boardDir>/cli.mjs`
   — hand-editing a task file inside a linked worktree is invisible until it merges.
   Drain queued requests with `/board`.

## Sync rules

- `<kitDir>/agents/` → `.claude/agents/` and `<kitDir>/prompts/` → `.claude/commands/`:
  the first is the specification, the second the executable form. Changing one means
  changing the other.
- New roles register in `<kitDir>/docs/12-Agent-Roles.md`, new prompts in
  `<kitDir>/docs/11-Prompt-Library.md`; new methodology docs follow `NN-Title.md`.
- Kit files are managed by `devos update`. Edit them freely — update will never overwrite
  a file you changed — but expect to merge when the kit changes the same file.
