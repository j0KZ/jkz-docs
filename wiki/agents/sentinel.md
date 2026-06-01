---
title: Sentinel
description: The QA-phase adversary that protects the operation — backend integrity, security, performance, and infrastructure. Runs in parallel with Lens.
---

Sentinel protects the operation. While [Lens](/agents/lens/) owns what the user sees, Sentinel owns what holds it up: backend integrity, security posture, performance, and infrastructure. Nothing ships without its sign-off on the technical foundation. Security vulnerabilities, performance regressions, untested paths — these are not abstract risks to Sentinel, they are real exposures it will not tolerate. It verifies everything, trusts nothing, and demands evidence.

Sentinel is **adversarial** by design, but adversarial is not obstructive. It defaults to PASS and only fails on a concrete, evidence-backed exposure introduced or surfaced by the PR. A false-positive CRITICAL costs a wasted Doctor iteration and a misled human — so it calibrates accordingly.

## At a glance

| | |
|------|------|
| **Phase** | QA |
| **Class** | adversarial |
| **Backend** | External, configurable, **required** — resolved at runtime via `JKZ_SENTINEL_ENDPOINT` / `JKZ_SENTINEL_MODEL` |
| **Runs with** | [Lens](/agents/lens/), in parallel |
| **Fix loop** | A FAIL routes to the [Doctor](/agents/doctor/), up to 3× |
| **Invocation** | `node scripts/run.js resolve-wrapper.sh --role sentinel --pr <number>` |
| **Can merge** | No. Read-only; posts PR comments. |

As an adversarial role, Sentinel's endpoint is **mandatory**: there is no silent fallback to a native CLI. If `JKZ_SENTINEL_ENDPOINT` is unset, the wrapper exits with code 4 and the QA phase halts rather than quietly skipping its challenger. Diversity is the point — the model that wrote the code is never the model that signs off on it.

## Mission

Sentinel performs the security scan completely, methodically, and without shortcuts. Logic correctness was already addressed by the Judge → Doctor cycle in the build phase; Sentinel revisits logic only if the Doctor's fix introduced a new regression. Its focus is the **trust boundary**: for every new function that accepts external input, Sentinel is the final check before it ships.

Its discipline is encoded in a few hard rules:

- **Security issues are always at least HIGH.** Any injection, auth bypass, or data exposure is a blocker.
- **CRITICAL requires execution or file-citation evidence** — a finding backed only by reasoning is downgraded or dropped.
- **Theoretical attacks without a reachable path are not CRITICAL.** "What if an attacker does X" needs a path through the actual diff.
- **Pre-existing exposures are out of scope** — filed as separate `jkz:ready` issues, not used to block the PR.

## Inputs

Sentinel receives every artifact through Git:

- **PR diff** — all changes in the pull request.
- **Approved plan** — the original plan and its acceptance criteria.
- **Codebase context** — relevant backend files, configs, and dependencies.
- **Pre-validated checks** *(optional)* — deterministic validator results (secrets, leftover debug, capability invariants) injected as Level-1 evidence. Sentinel does not re-flag what the validators already caught.
- **Threat model** *(when available)* — STRIDE threats from the Architect's plan; Sentinel verifies each mitigation is implemented and effective, and flags unimplemented ones as HIGH.

## Outputs

Sentinel produces a single Markdown QA report, posted as a PR comment, with these sections:

- **TL;DR** — 2–4 bullets: the PASS/FAIL verdict plus key critical and high findings, with file:line where applicable.
- **Backend Assessment** — API changes, database and migrations, error handling, data validation, and state / concurrency.
- **Security Scan** — attack-surface mapping first, then a category sweep: injection, authentication, authorization (IDOR, privilege escalation), secrets, data exposure, and dependency CVEs with a reachable exploit path.
- **Performance** — N+1 queries, memory and unbounded allocations, latency, and scalability under load.
- **Test Coverage** — whether unit and integration tests exist, cover the right paths, and actually pass — run, not just read.
- **Issues Found** — per issue: severity, category, root cause, evidence, impact, and a specific fix.

### Verdict

Every report ends with an explicit, machine-parsed verdict:

- **PASS** — no critical or high issues. The backend is solid.
- **FAIL** — issues that must be fixed, listed. Routes to the Doctor.

## Where Sentinel fits

Sentinel runs in the QA phase, after the build's Judge → Inspector review passes. It executes alongside Lens and reports to the post-QA ambiguity gate before the human merge. See [How jkz works](/get-started/how-jkz-works/) for the QA phase in the context of the full pipeline, and [Lens](/agents/lens/) for its frontend-and-accessibility counterpart.
