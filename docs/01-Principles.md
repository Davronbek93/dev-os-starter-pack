# Principles

The non-negotiable rules that everything else in DevOS derives from.

## 1. Architecture before implementation
No code is written until the architecture for the affected area is documented and reviewed. Changing a design document is cheap; changing deployed code is expensive.

## 2. Contracts first
Interfaces between components (API schemas, event payloads, module boundaries) are defined and agreed before either side is implemented. Both sides can then be built and tested in parallel against the contract.

## 3. Small tasks
Every task must be completable in a single focused session and produce a reviewable unit of change. If a task cannot be described with one clear goal and testable acceptance criteria, split it (see [10-Task-Lifecycle.md](10-Task-Lifecycle.md)).

## 4. Small PRs
A pull request should do one thing. Prefer several small PRs over one large one — review quality drops sharply with diff size. Refactors, behavior changes, and formatting changes go in separate PRs.

## 5. Documentation is the source of truth
When code and documentation disagree, either the documentation is corrected or the code is — never silently ignored. Every implementation task ends by synchronizing the docs it affects (see [06-Documentation-Standards.md](06-Documentation-Standards.md)).

## 6. Test before merge
Nothing merges without passing lint and tests, and without tests that cover the new behavior. "It works on my machine" is not evidence; CI output is.

## 7. Root cause before fix
Bugs are investigated until the actual cause is understood and reproduced. Patching symptoms creates recurring work.

## 8. One task per agent instance
An agent (human or AI) works on exactly one task from start to done; multiple agents may run concurrently, each holding one task, per [16-Concurrency-Model.md](16-Concurrency-Model.md). Context switching multiplies errors; batching unrelated changes breaks reviewability.
