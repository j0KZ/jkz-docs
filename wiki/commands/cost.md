---
title: /jkz:cost
description: Report the API-equivalent cost of a pipeline issue at any point — broken down by phase, role, and iteration, with CodeRabbit-driven rows flagged so you can see CR overhead at a glance.
---

`/jkz:cost [<issue>] [--phase <name>] [--json]` tells you what a pipeline run cost, in API-equivalent dollars, broken down by phase, role, and iteration. The number is computed from `scripts/pricing.json` regardless of whether the run used OAuth or a metered API key — it is a relative-comparison figure, the right lens for spotting which agent or phase is eating the budget.

Rows that ran while CodeRabbit was active — a review with CR findings injected, or the QA pass-gate loop — are flagged with `(CR)`, so the CodeRabbit overhead is visible without digging.

## At a glance

| | |
|------|------|
| **Scope** | One pipeline issue (defaults to the active issue in `STATE.json`) |
| **Breakdown** | Phase × role × iteration, `(CR)`-flagged where applicable |
| **Pricing** | API-equivalent from `scripts/pricing.json` (OAuth or API) |
| **Modes** | Standard report · `--attribute <PR>` orchestrator-token capture |
| **Usage** | `/jkz:cost 1167` · `/jkz:cost --phase reviewing` · `/jkz:cost --json` |

## When to use

Run `/jkz:cost` whenever you want to understand where a pipeline's tokens went — after a run that felt expensive, when tuning effort levels, or when deciding whether CodeRabbit is earning its keep. The interpretation notes call out the patterns worth acting on: CR overhead above 30% of the grand total, a single role consuming more than half a phase, or repeated iterations on the same role that hint the upstream Builder or Architect plan needs more effort.

## Key behavior

With no argument the command resolves the active issue from `state/STATE.json`; pass an issue number to target a specific run, `--phase` to narrow to one phase (`planning`, `build`, `reviewing`, `qa`, `fixing`, `ad-hoc`), or `--json` for the raw data instead of the markdown table. Coverage comes from the `token_usage` table in `state/metrics.db`: Opus subagents via the subagent-stop hook, adversarial/validator/API agents via wrapper post-processing, and orchestrator tokens captured manually through `--attribute`.

## `--attribute` mode

A PR written entirely inside a Claude Code orchestrator session — no Task subagents, no `/jkz:*` commands — leaves no rows in `token_usage`, because the per-role hooks never fire for the orchestrator itself. `--attribute <PR>` is the manual opt-in that closes that gap: it reads the session JSONL transcripts in the PR's window, aggregates per-model token totals, and writes them under `phase=ad-hoc`, `role=orchestrator`.

Two guards keep the numbers honest. A **refusal gate** aborts if any turn contains a `Task` block or a `/jkz:*` command marker — those tokens are already captured by the pipeline hooks, and double-attributing them would inflate the cost. **Anti-double-counting** subtracts overlapping rows already present for the same issue and model inside the window. The write is an idempotent UPSERT: re-running with the same window replaces rather than accumulates, so the totals stay stable. Use `--dry-run` to preview the planned rows as JSON before committing them.
