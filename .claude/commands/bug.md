---
description: Investigate a bug to root cause (diagnosis only, no fix)
argument-hint: [bug description or report]
---

Investigate this bug to root cause, following prompts/bug.md exactly. The deliverable is a diagnosis, not a patch.

Bug: $ARGUMENTS

1. Reproduce it reliably first. If you cannot, gather more evidence — do not guess at fixes.
2. Trace the actual data and control flow from symptom back to cause. The hypothesis is confirmed only when you can point to the exact code and state producing exactly this symptom.
3. Widen once: check for the same flaw elsewhere and for corrupted stored data.
4. Report: root cause (file:line + mechanism), why it wasn't caught (the missing test), blast radius, proposed fix, and the regression test that must accompany it.

Stop after the diagnosis and proposal. The fix is a separate /implement task that starts with the failing regression test.
