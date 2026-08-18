# Task: Backend — CRM catalog-write surface (contracts + endpoints + e2e)

- **ID:** SV-5b
- **Role:** backend (agent: backend-engineer)
- **State:** DONE (review APPROVE 2026-08-13, merged to dev)
- **Milestone:** SV — Structured visit lines
- **Wave:** 4 (the wave after SV-5/SV-6 per the Notes section below — SV-5 landed in wave 3)
- **Branch:** `feat/api-sv-crm-catalog-write`

## Goal
Expose the CRM catalog-write surface.

## Acceptance criteria
- [x] endpoints accept the catalog payload
- [ ] e2e covers the rejection paths

## Touches
- apps/api/src/catalog/**

## Dependencies
- SV-5 — the read surface lands first.

## Out of scope
Mini App changes.

## Notes
Parallel-safe with SV-7.
