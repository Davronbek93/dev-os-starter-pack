# Bug Investigation Prompt

## Goal
Find the **root cause** of a defect before any fix is written.

## Required inputs
- The bug report: expected vs actual behavior, reproduction steps if known, environment

## Prompt

Investigate this bug. The deliverable is a diagnosis, not a patch.

1. **Reproduce.** Get a reliable local reproduction first. If you cannot reproduce it, gather more evidence (logs, inputs, versions) — do not guess at fixes.
2. **Trace, don't pattern-match.** Follow the actual data and control flow from symptom back to cause. A hypothesis is confirmed only when you can point to the exact code and state that produce the wrong behavior — and explain why it produces exactly this symptom, not just a similar one.
3. **Widen once.** With the cause found, check whether the same flaw exists elsewhere (copy-pasted logic, sibling code paths) and whether it corrupted any stored data.
4. **Report** the diagnosis:
   - Root cause: file, line, and mechanism
   - Why it wasn't caught: the missing test or check
   - Blast radius: other affected paths or data
   - Proposed fix and the **regression test** that must accompany it ([docs/08-Testing-Strategy.md](../docs/08-Testing-Strategy.md))

**Stop condition:** stop after the diagnosis and proposal. The fix is a separate implementation task ([prompts/implementation.md](implementation.md)) — it starts by writing the failing regression test.
