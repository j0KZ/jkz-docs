---
title: Classifier
description: The utility role that reads an incoming issue and decides how much pipeline it deserves (trivial, quick, or standard) so the work is routed before any model starts deliberating.
---

The **Classifier** is the intake triage. Before any phase begins, it reads a GitHub issue and answers one question: how much pipeline does this deserve? A typo does not need an Architect; a multi-system refactor should not skip planning. The Classifier makes that call so the routing happens up front, not halfway through.

| | |
|---|---|
| **Model** | Claude Haiku 4.5 (configurable via `JKZ_CLASSIFY_MODEL`) |
| **Class** | utility |
| **Phase** | Intake — runs before the pipeline starts |
| **Invocation** | `node scripts/classify-issue.js --title "..." --body "..." [--labels "bug,refactor"]` |

## Mission

Classify an issue's complexity into one of three tiers and recommend the route that fits it. The output drives [`/jkz:start`](/reference/cli/), which is where most issues enter the system.

## Hybrid by design

The Classifier is not a pure LLM call. It is deterministic signal extraction *plus* Haiku judgment:

- **Signals first.** A deterministic pass extracts ground truth from the issue text — files mentioned and how many layers they span, design and compliance keywords, code blocks, and the number of Acceptance Criteria items. These are facts, not opinions.
- **Haiku decides.** Those signals are handed to Haiku as verified context, and the model returns the classification with reasoning.
- **Deterministic fallback.** If the LLM is unavailable, a scoring heuristic over the same signals produces a verdict anyway. The Classifier never fails closed.

## What it returns

A single JSON object:

| Field | Values |
|-------|--------|
| `complexity` | `trivial` · `quick` · `standard` |
| `confidence` | `high` · `medium` · `low` |
| `recommended_pipeline` | the route to take |
| `reasoning` | why this tier |
| `signals` | the deterministic facts the decision was built on |

## How the verdict routes the work

| Complexity | Route |
|------------|-------|
| `trivial` | Handle it directly in chat — no pipeline. |
| `quick` | [`/jkz:quick`](/reference/cli/) — Builder + Judge, no plan or QA. |
| `standard` | The full pipeline, planning first. |

The classification is cached as a `complexity:*` label on the issue, so the same answer is reused rather than recomputed each time the issue is touched. When confidence is anything below `high`, the recommendation is to read the referenced files before committing to a route — the Classifier flags its own uncertainty rather than hiding it.
