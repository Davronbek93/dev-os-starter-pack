# Changelog

All notable changes to the DevOS kit. Format: [Keep a Changelog](https://keepachangelog.com/).
Versions are git tags; install a specific one with
`npx github:Davronbek93/dev-os-starter-pack#v0.3.0 install`.

Semver for a methodology kit:

- **MAJOR** — renaming or removing a doc, agent, prompt or command; changing a field name
  or `##` heading in `templates/task-template.md` that the board parser reads; changing
  the task state list, the event/queue record shape, or a `devos.config.json` key.
- **MINOR** — a new doc, agent, prompt, template or command; a new board feature; a new
  config key with a default; an additive task-template field.
- **PATCH** — prose, clarifications, and fixes that change no format or output contract.

## [0.3.0] — 2026-08-19

### Added

- **The board** (`board/`): a local Kanban view over the task files with a live UI, an
  agent-facing CLI, an append-only history, and a pull-based request queue. Docs in
  `docs/18-Board.md`, prompt in `prompts/board.md`, command `/board`.
- **Model tiers** (`docs/17-Model-Tiers.md`): REASONING for the roles whose output decides
  whether other work is correct, BUILD for the roles bounded by documents someone else
  authored; dispatch-time upgrades only.
- **The installer** (`cli/devos.mjs`): `install`, `update`, `status`, `doctor`, `restore`.
  The kit becomes a versioned module instead of a copy-paste. Update never overwrites a
  file you changed — it proposes into `.devos-update/`, or 3-way merges when a baseline
  exists.
- `board/test/` (`node --test`, zero dependencies) and `board/test/corpus.mjs`, which
  checks a real task directory read-only.

### Changed

- `docs/17-Board.md` → `docs/18-Board.md`, so slot 17 is model tiers in every DevOS
  installation.
- `templates/task-template.md` gains a `## Blocker` section and a note that model choice
  is not per-task.
- The board's git policy: history committed, queue ignored via a `.devos/.gitignore` the
  board writes itself.

### Fixed

- The board parses annotated states (`DONE (review APPROVE …, merged to dev)`), messy
  dependency lists, id ranges, and per-track ids; it writes header fields only above the
  first `##`; a task with no Touches is no longer dispatchable; and it resolves to the
  repository's main worktree so parallel worktrees share one board.

### Migration

See [upgrade-notes/v0.3.0.md](upgrade-notes/v0.3.0.md).

## [0.2.0] — 2026-08-11

### Added

- `docs/16-Concurrency-Model.md`: waves, Touches disjointness, serialization points,
  worktree isolation, serialized merges, CI contention.
- The Orchestrator role, `prompts/dispatch.md` and `/dispatch`.

## [0.1.0] — 2026-07-23

### Added

- The initial kit: `docs/01`–`15`, six roles, four prompts, templates and checklists.
