---
title: bugs
description: Scan the codebase for bugs at three levels of depth — a fast deterministic pass, a deeper run that adds the test suite and cross-file analysis, and a full run that layers adversarial review on top. Advisory; it reports, it does not gate.
---

`/jkz:bugs` scans the codebase for bugs and reports what it finds. It runs at three levels of depth, so you can pick between a five-second sanity check and a slower, adversarial sweep depending on how much you want to spend.

## At a glance

| | |
|------|------|
| **`quick`** *(default)* | Deterministic scan only (~5s) |
| **`deep`** | Adds the test suite, a dependency audit, and cross-file analysis |
| **`full`** | Adds adversarial review, anti-pattern detection, and stale-state checks |
| **Runs** | `bugs-scan.js` for the deterministic pass |
| **Usage** | `/jkz:bugs [quick \| deep \| full]` |

## When to use

Reach for `quick` when you want a fast read on whether the tree is in obvious trouble — it runs deterministic checks (syntax, validators) and returns in a few seconds. Use `deep` before a larger change when you want the test suite and dependency audit folded in. Use `full` when the cost of a missed bug is high and you want a second, adversarial opinion on top of the automated findings.

The results are **advisory**: `/jkz:bugs` is a standalone scan, not a pipeline gate. For the gated review of a specific change, that is the [Judge](/agents/judge/) and the QA phase.

## Key behavior

The command parses its argument to pick a level, then runs the deterministic scanner and presents findings as a Markdown table grouped by severity (high first), with a per-severity summary at the end. If nothing turns up, it says so plainly.

- **`deep` and `full`** also run the test suite and report totals (passed / failed), plus a dependency audit and cross-file analysis.
- **`deep` and `full`** dispatch an Opus subagent to analyze the raw findings in context — separating real bugs from false positives, giving root-cause analysis for high-severity items, and suggesting fixes.
- **`full`** additionally launches an adversarial review via the [Sentinel](/agents/sentinel/) role to catch logic errors, race conditions, and edge cases the deterministic scanner missed.

For a broader, category-by-category sweep of project health rather than a bug hunt, see [`/jkz:quality`](/commands/quality/).
