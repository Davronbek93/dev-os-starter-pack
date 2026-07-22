# PR: <imperative title, matching the task>

**Task:** <TASK-NNN link>

## Summary
What changed and why — 2–5 sentences. A reviewer should understand the shape of the change before opening the diff.

## Testing
How this was verified. Be concrete:
- [ ] Unit/integration tests added or updated: <which>
- [ ] Full suite green locally and in CI
- [ ] Manual verification performed: <steps, if any>

## Impact
- **Contracts:** unchanged | changed (link the `CONTRACTS.md` update in this PR)
- **Data model / migrations:** none | <describe; include rollback note>
- **Docs updated in this PR:** <files, per [docs/06-Documentation-Standards.md](../docs/06-Documentation-Standards.md)>
- **Risk / rollback:** <what could break; how to revert>

## Checklist
- [ ] One task only; no unrelated changes
- [ ] [Definition of Done](../docs/04-Definition-of-Done.md) items satisfiable pre-merge are done
- [ ] Self-reviewed the diff before requesting review
