---
title: Scripts
description: Catalog of the most-referenced scripts in scripts/ — pipeline core, model wrappers, validators, monitoring, GitHub integration, and observability.
---

The pipeline is a collection of small, single-purpose scripts under `scripts/`. Each one owns a narrow job — a phase transition, a model invocation, a state write — and the orchestrator wires them together. This page catalogs the ones you will reach for most often, grouped by function.

:::note[Source of truth]
This page summarizes the catalog for public reference. The authoritative, always-current version lives in the private repo at `docs/scripts-reference.md`. For the complete list, run `ls scripts/`.
:::

## Pipeline core

| Script | What it does |
|--------|--------------|
| `orchestrate.sh` | Handles phase transitions and global pipeline state. Writes to `state/STATE.json` (active phase, active agent, locks). Invoked by every phase command. Not to be confused with the per-issue `state/pipeline/<issue>.json`. |
| `run.js` | Secure proxy for executing bash scripts inside the Claude Code sandbox. Fixes the fd mismatch on Windows/WSL by spawning bash with correct pipes, and kills stalled scripts after `JKZ_STALL_TIMEOUT_MS`. Always prefer this over `bash script.sh`. |
| `json-helper.js` | Reads and writes per-issue state fields (`state/pipeline/<issue>.json`) without racing on concurrent writes. |
| `worktree.sh` | Creates, manages, and cleans up the per-issue Git worktree (`../jkz-worktree-<issue>`), isolated from the main repo. Tracks stages via `.jkz-checkpoint`. |

```bash
node scripts/run.js orchestrate.sh transition <phase> --issue <N>
node scripts/run.js resolve-wrapper.sh --role judge --pr 42
node scripts/json-helper.js set <field> <value> state/pipeline/<issue>.json
```

## Model wrappers

| Script | What it does |
|--------|--------------|
| `resolve-wrapper.sh` | Entry point for invoking any external agent. Cascade: `JKZ_<ROLE>_ENDPOINT` → `api-wrapper.sh`, then `JKZ_API_ENDPOINT` → `api-wrapper.sh`, then the native model CLI. |
| `codex-wrapper.sh` | Wrapper for the Codex CLI. Per-role session memory, `Accumulated Patterns` extraction, 5-minute stall detection, rate-limit retry with exit 75. |
| `gemini-wrapper.sh` | Wrapper for the Gemini CLI. Streaming JSONL, multi-format parsing, exponential rate-limit retry, format fallback. |
| `api-wrapper.sh` | Wrapper for OpenAI-compatible endpoints. Used when `JKZ_<ROLE>_ENDPOINT` or `JKZ_API_ENDPOINT` are set. |
| `resolve-provider-fallback.sh` | Resolves the fallback provider when a wrapper exits 75 (rate limit). Defaults: `auditor`/`lens` → sonnet; `curator`/`inspector`/`judge`/`sentinel` → opus. |
| `parse-gemini-stream.js` | Normalizes Gemini CLI output to a unified `{response, session_id, tokens, format}` shape. Used internally by `gemini-wrapper.sh`. |

## Validators

| Script | What it does |
|--------|--------------|
| `scripts/validators/run.js` | Pre-validated checks runner. Receives the diff via stdin, returns `{ checks, skipped }`. Output is injected as `=== PRE-VALIDATED CHECKS ===` into Judge and Sentinel prompts. Full reference → [Validators](/reference/validators/). |
| `scripts/validators/config.json` | Rule configuration: `enabled`, `severity` (`fail`/`warn`), `type` (`diff-safe`/`worktree-required`). Toggle rules without touching code. |

## Infrastructure and monitoring

| Script | What it does |
|--------|--------------|
| `health-check.sh` | Full system health check: CLI versions, auth, MCP servers, tests, npm audit, stale worktrees, service status. `--fix` updates outdated CLIs; `--deep` adds auth, MCP, and notifications. |
| `circuit-breaker.js` | Protects the pipeline from downed services. States: `closed` → `open` (after 3 consecutive failures) → `half_open` → `closed`. State in `state/circuit/<service>.json`. |
| `telegram-bot.js` | Monitoring and remote-control bot: 9 health checks every 10 min, task discovery every 30 min, inline commands. Requires `JKZ_NOTIFY_BACKEND=telegram`. |
| `monitoring-checks.js` | The 9 async checks behind the monitoring loop (agent idle, CI status, stale worktrees, rate limits, SLO compliance, groupthink, and more). |
| `slo-check.js` | Evaluates pipelines against the 4 SLOs in `scripts/slos.json` over a 30-day window. |

## Pipeline utilities

| Script | What it does |
|--------|--------------|
| `loop-guard.js` | Detects duplicate Doctor fix attempts via SHA256 (exact) and Jaccard similarity (≥80% near-duplicate). Advisory — injects a warning, does not block. |
| `resume-diagnose.js` | Diagnoses pipeline interruptions (`crash`, `fail`, `blocked`, `running`, `stopped`, `completed`) and determines the resume point. Releases expired locks. |
| `postmortem-generate.js` | Generates a postmortem when the pipeline reaches `jkz:blocked`: event timeline, failure patterns, 5-whys template. |
| `pipeline-cost-report.js` | Builds a cost table by phase/role/iteration from `tokens._runs[]` in pipeline state, priced via `scripts/pricing.json`. |
| `pipeline-notify.sh` | Sends phase-transition notifications. Respects `JKZ_NOTIFY_FORCE_DISABLE=1` for tests. |
| `step-gate.js` | DAG of dependencies between pipeline steps. Commands call `begin`/`complete` to track progress and guard crash recovery. |
| `classify-issue.js` | Hybrid issue complexity classifier (LLM primary via Haiku, deterministic fallback). Outputs `complexity`, `confidence`, `recommended_pipeline`, `reasoning`, `signals`. |
| `agent-kind.js` | Centralized `kind` classification per role: `creative`, `adversarial`, `validator`, `utility`. |

## Memory and patterns

| Script | What it does |
|--------|--------------|
| `memory-store.js` | SQLite client for the patterns system (`state/memory.db`). Operations: `insert`, `reinforce-patterns`, `increment-ignore`, `decay`. |
| `memory-curate.js` | CLI for Claude Code memory files. Actions: `status`, `review`, `promote`, `classify`. |
| `format-patterns.js` | Formats patterns from SQLite for prompt injection. Budget-controlled: 800 tokens adversarial, 500 constructive. |

## GitHub integration

| Script | What it does |
|--------|--------------|
| `adr-extract.js` | Reads the `jkz:adr-json` signal from the Architect's deliberation and generates MADR documents in `docs/decisions/`. |
| `resolve-cr-threads.sh` | Resolves CodeRabbit threads in bulk. Use only for VALID/OUT_OF_SCOPE threads — it does not verify a reply was posted. |
| `minimize-old-comments.sh` | Minimizes outdated comments from previous iterations of the same role on a PR. Invoked automatically by wrappers. |
| `pin-status-comment.sh` | Pins status comments on issues (REST API with GraphQL fallback). Auto-unpins the previous pin. |
| `check-merge-gate.sh` | Verifies the 4 layers of the merge gate before allowing a merge. |
| `post-merge.sh` | Post-merge cleanup: removes the worktree, clears phase labels, archives deliberations. |
| `project-sync.sh` | Syncs the issue to a GitHub Projects board on phase transitions. Requires `JKZ_PROJECT_NUMBER`. Optional. |

## Observability

| Script | What it does |
|--------|--------------|
| `langfuse-trace.js` | Fire-and-forget LangFuse client (zero deps, native fetch, fail-silent). Maps pipeline run → Session, phase+iteration → Trace, agent invocation → Generation, verdict → Score. Flag: `LANGFUSE_ENABLED=true`. |
| `analyze-deliberations.js` | Deliberation analytics: agreement rates, tokens per role, patterns. Backs `/jkz:insights`. |
| `threat-model.js` | Generates `state/threat-model.json` (STRIDE) when the issue carries security labels or keywords. |

## Installation

| Script | What it does |
|--------|--------------|
| `install.sh` | Full system installation. |
| `install-service.sh` | Installs the Telegram bot as a service (launchd/PM2). |
| `add-project.sh` | Registers a project in jkz. |
| `jkz-install.sh` | Installs jkz in plugin mode in another project. |
| `jkz-update.sh` | Updates jkz to the latest version. |
| `jkz-uninstall.sh` | Uninstalls jkz. |

## Related

- [Validators](/reference/validators/) — the pre-validated checks runner in detail.
- [Glossary](/reference/glossary/) — definitions for the terms used above.
- [CLI / commands](/reference/cli/) — the `/jkz:*` commands that orchestrate these scripts.
