# Task: `POST /me/phone/verify` — Telegram-verified phone capture

- **ID:** PH-4
- **Role:** backend (agent: backend-engineer)
- **State:** BACKLOG (READY when PH-2 + PH-3 merge)
- **Milestone:** PH / PH-B — Backend claim & verification

## Goal
Validate the signed contact payload and persist the normalized phone.

## Acceptance criteria
- [ ] valid signed contact → phone stored E.164-normalized

## Touches
- apps/api/src/users/**

## Dependencies
- PH-2 — shared schemas merged.
- PH-3 — the column exists.

## Out of scope
Claim endpoints.

## Notes
—
