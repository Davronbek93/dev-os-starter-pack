# Task: Acceptance gate for the AI track

- **ID:** AI-9
- **Role:** tester/reviewer (agent: qa-reviewer)
- **State:** REVIEW
- **Milestone:** AI

## Goal
Gate the AI track.

## Acceptance criteria
- [ ] the gate reports a verdict

## Touches
- apps/api/evals/**

## Dependencies
- AI-5, AI-6 — the running feature.
- P8-4..P8-17 — the phase they close.
- L2-1..L2-3 — pivot groundwork.
- OQ-AI-3 — a billing-backed OpenAI API key (human action, product owner).
- SV-99 — a task that does not exist on disk.
- None (independent defect).

## Out of scope
Fixing what the gate finds.

## Notes
—
