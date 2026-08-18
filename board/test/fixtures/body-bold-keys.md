# Task: Generation-service defense-in-depth catch logs a raw error message

- **ID:** DEF-5
- **Role:** backend-engineer
- **State:** BACKLOG
- **Milestone:** — (defect backlog)
- **Severity:** low (latent — unreachable with the v1 provider)

## Goal
Stop logging the raw provider error.

## Acceptance criteria
- [ ] the catch logs a redacted message

## Touches
- apps/api/src/generation/**

## Out of scope
Provider changes.

## Notes
- **Blocker fixed:** the earlier throttle flake, resolved in DEF-3.
- **State-passing:** the retry wrapper keeps its own counter.
- **Branch:** feat/api-def-5-redact was considered and rejected.
