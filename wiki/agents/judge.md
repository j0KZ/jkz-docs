---
title: Judge
description: The adversarial reviewer that chaos-engineers the PR diff — assumes a bug exists, runs the Fault Injection Checklist, and is the last technical gate before QA.
---

The **Judge** is a chaos engineer whose job is to break the code before it ships. It does not ask "does this look correct?" It asks "how does this fail?" and "what did the Builder forget to handle?" The Judge assumes there is a bug somewhere and hunts for it across every new code path in the diff.

It is the last technical gate before QA. If a fault slips past the Judge, it ships. So the Judge thinks like an attacker, a tired ops engineer at 3am, and a user who does the unexpected — all at once. When it genuinely finds nothing after working through every probe, that is a valid PASS.

Adversarial does not mean obstructive. The Judge defaults to **PASS** unless a finding clears the bar of a concrete, evidence-backed bug that produces a wrong outcome in the diff under review. Style preferences, theoretical attack vectors with no reachable path, and pre-existing issues are not blockers.

## Model & backend

| Property | Value |
|----------|-------|
| Class | adversarial |
| Model | External backend, configurable per role |
| Invocation | `resolve-wrapper.sh --role judge --pr <number>`, routed via `JKZ_JUDGE_ENDPOINT` / `JKZ_JUDGE_MODEL` |
| Endpoint | **Required** — there is no silent fallback to a native CLI; without an endpoint the review is skipped and you decide whether to continue |
| Access | Read-only; posts findings as PR comments |
| Can merge / push to `main` | No |

The Judge runs on a different model than the [Builder](/agents/builder/) that wrote the code. That diversity is the point: a single model's blind spot cannot pass unchallenged.

## Inputs

- **PR diff** — all changes in the pull request; the Judge reviews the diff, not the whole codebase.
- **Approved plan** — what the Builder was supposed to follow, for plan-compliance checking.
- **Codebase context** — surrounding code for the changed files.
- **Builder's notes** — any deviations or decisions the Builder documented.
- **CodeRabbit pre-scan** *(optional)* — automated results for enrichment; the verdict is never anchored to it.
- **Pre-validated checks** *(optional)* — deterministic validator results (secrets, leftover debug, capability invariants), treated as Level 1 evidence and not re-flagged.
- **Threat model / ADR** *(optional)* — open threats to verify, and architectural decisions to confirm the implementation honors.

## Outputs

A Markdown review posted as a PR comment (and a `jkz:<role>` Check Run when the token allows), with a structured `jkz:verdict-json` block. The review contains:

- **TL;DR** — the verdict in 2–4 bullets.
- **Issues Found** — each with severity, category, root-cause classification, `file:line`, evidence, and a specific fix.
- **Fault Injection Checklist** — mandatory for every new code path: what fails, whether the error is handled, whether failure is silent, whether a test exists.
- **Plan Compliance** — which steps were implemented correctly, incorrectly, or missed.
- **Verdict** — `PASS` (ready for QA) or `FAIL` (needs fixes).

Severity maps directly to the verdict: **P1 (CRITICAL/HIGH) → FAIL**; **P2/P3 (MEDIUM/LOW) → PASS** with notes. A review whose highest finding is P2 or P3 must PASS.

## Iteration limits

The Judge is iteration-aware. On **iteration 1** it runs a full review — every changed file, the complete Fault Injection Checklist, full plan compliance. On **iteration 2+** it verifies that the [Doctor](/agents/doctor/)'s fixes resolved the previous findings, runs fault injection only on the new code paths from the fix, and checks whether the fix addressed the root cause or just the symptom. It does not re-flag issues that were already fixed. The build loop allows up to **three** fix cycles before escalation.

## See also

- [Inspector](/agents/inspector/) — the precision filter that calibrates the Judge's findings and exposes false positives.
- [Builder](/agents/builder/) — produces the diff the Judge reviews.
- [Doctor](/agents/doctor/) — fixes the findings on a FAIL.
- [How jkz works](/get-started/how-jkz-works/) — the Build (review) phase in context (the dedicated `/jkz:pipeline` end-to-end page lands in a later wiki pass).
- [CLI / commands](/reference/cli/) — `/jkz:review` and `/jkz:quick`, the commands that dispatch the Judge.
