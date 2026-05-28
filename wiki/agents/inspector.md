---
title: Inspector
description: The validator that calibrates the Judge's review — confirms real bugs, exposes false positives with evidence, and finds what the Judge missed in logic and correctness.
---

The **Inspector** is the precision filter on the [Judge](/agents/judge/)'s chaos-engineering review. The Judge operates with high recall — it assumes a bug exists and hunts aggressively, which is correct but produces false positives. The Inspector separates real signal from noise.

It has two equally important mandates: **confirm real issues** against the actual code with execution or file-level evidence, and **expose false positives** with evidence so an uncontested FP does not waste a Doctor iteration. It also catches what the Judge missed in the logic, correctness, and structure space — but calibration is its primary value-add.

Its rule of last resort: **never mark a real bug as a false positive.** The goal is calibration, not symmetry. If every Judge finding is real, the Inspector confirms them all.

## Model & backend

| Property | Value |
|----------|-------|
| Class | validator |
| Model | External / Ollama Cloud backend by default, with a local Gemini CLI fallback |
| Invocation | `resolve-wrapper.sh --role inspector --pr <number>`, routed via `JKZ_INSPECTOR_ENDPOINT` |
| Endpoint | Optional — validator roles fall back to the local Gemini CLI when no endpoint is configured |
| Access | Read-only; posts findings as PR comments |
| Can merge / push to `main` | No |

## Inputs

- **PR diff** — all changes in the pull request.
- **Judge's review** — the adversarial review with its issues and verdict; this is what the Inspector calibrates.
- **Approved plan** — for reference.
- **Codebase context** — surrounding code, read from the PR worktree so citations are checked against current code.
- **CodeRabbit pre-scan** *(optional)* — used to verify whether the Judge caught what CodeRabbit flagged.

## Outputs

A validation report posted as a PR comment, with a `jkz:verdict-json` block whose `false_positives` field lists every Judge finding ruled an FP. The report contains:

- **TL;DR** — verdict, plus any key false positive, confirmed HIGH/CRITICAL finding, or missed issue.
- **Judge Finding Verdicts** — the primary output: a table issuing an explicit verdict on *every* Judge finding — **CONFIRMED**, **FALSE POSITIVE**, or **DOWNGRADE** — each backed by `file:line` or an execution result. No finding is left unresolved.
- **Review Quality Assessment** — the Judge's thoroughness, accuracy, severity calibration, and false-positive rate.
- **Additional Issues Found** — problems the Judge missed in logic, correctness, and structure (security deep-dives belong to Sentinel in QA).
- **Verdict** — `PASS` (ready for QA after filtering FPs) or `FAIL` (lists only confirmed findings that must change).

## Iteration limits

The Inspector is iteration-aware. On **iteration 1** it verifies the Judge's findings against the diff and completes the Judge Finding Verdicts table. On **iteration 2+** it checks that the Judge reviewed the [Doctor](/agents/doctor/)'s *changes* rather than re-reviewing the original diff, verifies that file citations point to current (post-fix) code, and confirms each previously reported fix is present. It runs inside the same build loop as the Judge — up to **three** fix cycles before escalation.

## See also

- [Judge](/agents/judge/) — the adversarial review the Inspector calibrates.
- [Builder](/agents/builder/) — produces the diff under review.
- [Doctor](/agents/doctor/) — fixes the findings the Inspector confirms.
- [How jkz works](/get-started/how-jkz-works/) — the Build (review) phase in context (the dedicated `/jkz:pipeline` end-to-end page lands in a later wiki pass).
- [CLI / commands](/reference/cli/) — `/jkz:review`, the command that dispatches the Inspector.
