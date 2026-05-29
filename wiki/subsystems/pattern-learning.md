---
title: Pattern learning loop
description: How jkz learns from its own deliberations — patterns extracted from agent verdicts are stored in SQLite, scored with time decay, re-injected into future prompts under a token budget, and corrected by validator feedback so the pipeline gets sharper over time instead of repeating itself.
---

Every pipeline run produces deliberations — the Auditor's challenge to a plan, the Judge's read of a diff, the Sentinel's security pass. Most systems throw that reasoning away once the verdict is posted. jkz keeps it. The pattern learning loop turns each deliberation into reusable signal: it extracts the recurring observations an agent makes, scores them by how often they hold up, feeds the best ones back into future prompts, and quietly demotes the ones a validator later calls a false positive. The effect is a pipeline that accumulates judgment across runs rather than starting cold every time.

This is a closed loop with four moving parts — **store**, **score**, **re-inject**, **correct** — and it is scoped per project, so patterns learned on one repository never leak into another. None of it is on the critical path: every step is fail-open, so a missing database or a parse error degrades to "no patterns this run", never a blocked pipeline.

## The four stages

```text
deliberation  ──store──▶  SQLite (patterns table)
                              │
                            score (success rate × time decay × context)
                              │
                          re-inject (token-budgeted) ──▶ next agent prompt
                              │
   validator verdict ──correct──▶ penalize false positives / reinforce on PASS
                              │
                              └──▶ back into the store
```

The three scripts behind it live in the main repo:

- [`scripts/memory-store.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/memory-store.js) — the SQLite store and its CLI (storage, scoring, lifecycle).
- [`scripts/format-patterns.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/format-patterns.js) — budget-controlled formatting for prompt injection.
- [`scripts/feedback-loop.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/feedback-loop.js) — the deterministic correction step that runs after each validator verdict.

## Store

Deliberations and the patterns derived from them live in a local SQLite database (via `better-sqlite3`). The `patterns` table is the heart of it: each row is a short piece of text an agent produced, tagged with the `role` that produced it, a `success_count` and `ignore_count`, the `last_used` timestamp, an optional embedding, and a `lifecycle_state`. Rows are unique on `(text_hash, role)` and stamped with a `project_id`, which is how scoping stays airtight — a query for the Judge's patterns on this project never sees another project's rows.

Patterns are not authored by hand. They are extracted from stored deliberations and classified into categories (an `observation`, a `causal` link, or a hard `rule`), then upserted: if the same text from the same role already exists, its `success_count` is incremented rather than a duplicate created.

## Score

A pattern's worth is not a flat count — it decays. When patterns are queried for injection, each row is scored on the fly:

- **Success rate** — `success_count / (success_count + ignore_weight)`. A pattern that keeps getting validated and never ignored trends toward 1.0; one that validators keep rejecting trends toward 0.
- **Time decay** — multiplied by `exp(−daysSinceUse / 14)`, so a pattern unused for two weeks is worth roughly a third of a fresh one. The exception: a **validated** pattern (reinforced three or more times) is immune to decay — once the pipeline has confirmed it repeatedly, it stops aging.
- **Category weight** — a `rule` is multiplied by 1.3 and a `causal` link by 1.1, because a hard rule is worth surfacing over a loose observation.
- **Context boost** — if the current issue's labels or changed files overlap with the context a pattern was learned in, its score gets a small bump. This is the `--labels` / `--phase` relevance signal: patterns from similar situations float to the top.

When embeddings are available, the final score blends semantic similarity to the query with the decayed score (60/40). Patterns move through a lifecycle as their counts change — `observed` on first sight, `candidate` once seen twice, `validated` after three reinforcements, and eventually `deprecated` if they age out without being used.

## Re-inject

Scored patterns are formatted back into agent prompts by `format-patterns.js`, under a strict token budget — **800 tokens for adversarial roles** (Auditor, Judge, Sentinel) and **500 for everyone else**. The budget is the whole point: historical context is valuable only until it crowds out the actual task, so injection is capped and patterns below a minimum score (0.1) are dropped entirely.

The formatter renders each pattern as one line tagged with its track record — `5x validated`, `-2 net, 3x ignored`, or a raw `score:0.42` for newer patterns — and notes provenance (`via:auditor`) when a pattern came from a different role. If everything fits, it injects the full list; if not, it falls back to a pre-computed summary or, failing that, truncates to the highest-scoring lines. The result lands in the prompt as a `=== HISTORICAL PATTERNS (role) ===` block. If the remaining prompt space is too small to be useful, injection is skipped rather than forced.

## Correct

The loop's discipline comes from the correction step, which runs after a validator finishes. jkz pairs an adversarial role with the validator that checks it — the Curator checks the Auditor in Plan, the Inspector checks the Judge in Review, the Lens and Sentinel check QA. When the validator's verdict (read from its [`verdict-json`](/concepts/signal-format/) block) lists **false positives**, `feedback-loop.js` locates the matching text in the adversarial deliberation — by exact substring, or by fuzzy token overlap as a fallback — and penalizes that pattern with `increment-ignore`.

Two details make the penalty trustworthy:

- **Per-role weight.** High-confidence validators hit harder. An Inspector or Sentinel false-positive call carries weight 1.5; other roles carry 1.0. A pattern the Inspector keeps rejecting decays toward irrelevance fast.
- **Regression marking.** If a pattern that had been *validated* is suddenly ignored, it is flagged as a regression — a previously trusted signal that has started misfiring deserves attention, not a silent demotion.

On a **PASS** verdict the loop reinforces instead of penalizing, but only behind an [evidence gate](/concepts/evidence-hierarchy/): patterns are reinforced only when the adversarial deliberation is grounded in Level-1 (execution output) or Level-2 (file:line citation) evidence. Pure-reasoning verdicts (Level 3) reinforce nothing — otherwise the pipeline would learn to approve by narrative. When reinforcement does fire, the top or file-relevant patterns get a bump and the patterns that *weren't* reinforced are aged a step, so stale signal cleans itself up.

A final, slower signal closes the loop at the end of a run. When a pipeline completes, [`outcome-score`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/memory-store.js) records whether the merged work ultimately passed or failed, so patterns are graded not just on intermediate verdicts but on whether the change they shaped actually held up.

## Why it stays out of the way

The loop is deliberately invisible during normal operation. It writes to a local database, injects a few hundred tokens, and corrects itself — all fail-open. If `better-sqlite3` isn't installed, if a deliberation file is malformed, or if a query times out, every stage swallows the error and returns nothing rather than stalling the [pipeline](/concepts/pipeline/). You feel it only in the aggregate: over many runs, the adversarial roles stop re-raising the false positives a validator has already dismissed, and they keep surfacing the checks that have repeatedly caught real problems.
