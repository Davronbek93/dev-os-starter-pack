# Security

Baseline security requirements for every DevOS project, and the checklist reviewers apply ([05-Code-Review.md](05-Code-Review.md), step 5).

## Design-time (Architect)

- Identify trust boundaries in `ARCHITECTURE.md`: everywhere data crosses from a less-trusted zone (user input, third-party APIs, message queues) into the system.
- Define the auth model in `CONTRACTS.md`: who can call each endpoint, and what happens on failure (401 vs 403, error shapes).
- Decide secrets management up front: where secrets live (env/secret manager), never in code or config files committed to the repo.

## Implementation checklist

- [ ] **Validate at trust boundaries** — every external input is validated for type, length, range, and format before use; validation failures return errors, they don't "fix" the input.
- [ ] **Parameterize, never concatenate** — SQL, shell commands, and query languages take user data only through parameter binding / safe APIs.
- [ ] **Encode output per context** — HTML-escape for HTML, proper encoding for URLs, headers, JSON.
- [ ] **AuthN before AuthZ before action** — every non-public endpoint checks identity, then permission for *this specific resource* (no IDOR: possessing an ID is not authorization).
- [ ] **No secrets in the repo** — no keys, tokens, or passwords in code, config, tests, fixtures, or logs.
- [ ] **Don't leak internals** — error responses to clients exclude stack traces, queries, and file paths; details go to server logs.
- [ ] **Dependencies are current** — new dependencies are justified; known-vulnerable versions are not introduced; an audit tool runs in CI.
- [ ] **Least privilege** — services, DB users, and tokens get only the permissions they need.

## Review triggers

Treat any diff touching these as security-sensitive and review accordingly: auth code, session handling, file uploads, deserialization, shell/process execution, cryptography, CORS or CSP headers, and anything parsing external input.
