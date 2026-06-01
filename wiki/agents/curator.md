---
title: Curator
description: The validator role that reviews the Auditor's audit — calibrating severity, catching false positives and missed gaps, and acting as the mandatory tiebreaker that closes the Plan phase.
---

The **Curator** closes the Plan phase. It is a *validator*, and its subject is not the plan directly but the **Auditor's review of it**. It looks for anomalies in the audit: a false positive, a miscalibrated severity, a gap the Auditor missed. If the Auditor missed something obvious, the rest of the review is suspect; if it flagged something unreal, it has wasted an iteration cycle.

## At a glance

| | |
|---|---|
| **Phase** | Plan |
| **Class** | validator |
| **Model** | External validator backend (default Ollama Cloud); local Gemini CLI fallback |
| **Invocation** | `node scripts/run.js resolve-wrapper.sh --role curator` |
| **Source** | `agents/curator.md` |

The Curator runs on a validator backend resolved from `JKZ_CURATOR_ENDPOINT` / `JKZ_CURATOR_MODEL`, defaulting to Ollama Cloud (`glm-5.1:cloud`). Unlike adversarial roles, a validator does not require a configured endpoint: when none is set, it falls back to a local Gemini CLI. This keeps the validator seat filled even in a minimal setup.

## What it does

The Curator must act as **tiebreaker**. When the Architect and Auditor disagree, it never defers the decision back — it provides a reasoned judgment with evidence from the codebase. It protects in both directions: against false `FAIL`s from an overly aggressive Auditor that waste iteration cycles, and against false `PASS`es from a lazy one that lets a bad plan through. It re-checks the Auditor's file citations, since a hallucinated reference invalidates the finding that rests on it.

It also runs a spec-fidelity meta-check: when the Architect's plan defines spec dimensions, the Curator confirms the Auditor actually verified the plan against them, flagging a missed check when the Auditor issued a `PASS` without it.

## Inputs and outputs

| Inputs | Outputs |
|--------|---------|
| The Architect's original plan | A Markdown validation report: a TL;DR, an *Audit Quality Assessment* scoring coverage, accuracy, severity calibration, and constructiveness |
| The Auditor's review (issues and verdict) | *Issues with the Audit* (missed issues, false positives, wrong severities) and *Additional Issues Found* the Auditor missed |
| Codebase context for verification | A **PASS** / **FAIL** verdict with a `jkz:verdict-json` signal, plus an *Accumulated Patterns* section |
| The original issue description | |

## Where it sits in the flow

The Curator is the final role in the Plan phase. It reads the plan and the Auditor's review as Git artifacts and posts its own report the same way. A `PASS` advances the plan to the human checkpoint — where you approve before any build begins. A `FAIL` sends the plan back to the **[Architect](/agents/architect/)**, with the **[Auditor](/agents/auditor/)** re-challenging the revision, for up to three iterations.

See **[How jkz works](/get-started/how-jkz-works/)** for the full Plan → Build → QA pipeline and **[Architecture](/reference/architecture/)** for validator routing and the fallback tiers.
