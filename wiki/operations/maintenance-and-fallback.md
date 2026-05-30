---
title: Maintenance & fallback runbook
description: Two operational safety nets — the on-demand maintenance workflow that keeps the repository from rotting, and the fallback chain that keeps the pipeline running when a model 404s, a backend rate-limits, or a whole service goes dark. How to trigger each, what it does, and which failures stop and ask you to decide.
---

Running jkz day to day raises two recurring operational questions: *how do we keep the repository from slowly rotting* — accumulating missing builds, stale dependencies, and dead `CLAUDE.md` references — and *what happens when a model or a backend fails mid-pipeline*. This page is the runbook for both. The first half covers the **smart maintenance** workflow you trigger on demand; the second half is the **fallback runbook** — what recovers automatically, and what stops and asks you to decide. For the conceptual treatment of fallback, see [Fallback](/concepts/fallback/); this page is the operator's view, with the env vars, exit codes, and triggers you actually reach for.

## Smart maintenance

Maintenance is an **on-demand** workflow — [`claude-maintenance.yml`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/.github/workflows/claude-maintenance.yml) is wired to `workflow_dispatch` only, so nothing runs it on a schedule. An operator starts it from the Actions tab (**Run workflow**) or from the terminal:

```bash
gh workflow run claude-maintenance.yml
```

It deliberately checks **only the things the daily monitor does not already cover**. The monitor owns health checks, unit tests, `npm audit`, and regression issues; maintenance fills the gaps the monitor leaves — dependency drift, build rot, stale references, and lingering TODOs.

### What the job does

The workflow runs on `ubuntu-latest` with a 20-minute timeout and a small fixed setup before any analysis happens:

1. Checkout with full history (`fetch-depth: 0`), authenticated with the `MAINTENANCE_PAT` secret.
2. Node 20, then `npm ci --ignore-scripts` for the root dependencies.
3. [`node scripts/deps-audit.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/deps-audit.js) to surface dependency state.
4. The [`anthropics/claude-code-action`](https://github.com/anthropics/claude-code-action) step, driving **Claude Sonnet 4.6** (`--model claude-sonnet-4-6`), runs the scan → classify → act loop below under a tightly scoped permission allow/deny list.

### Scan

The agent collects findings from five checks:

1. `TODO` / `FIXME` / `HACK` comments in source files (excluding `node_modules`, `.git`, `state/`, `dist/`).
2. Outdated dependencies via `npm outdated`.
3. Open issues with no activity in the last 30 days.
4. Spot-checks that `CLAUDE.md` references existing files and commands.
5. A weekly performance audit — recent merged PRs and CI runs cross-referenced against the four SLO thresholds in [`scripts/slos.json`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/slos.json). A complex issue is created **only if** an SLO threshold is breached.

### Classify

Every finding is sorted into one of three buckets. The dividing heuristic is simple: a fix is **trivial** when it is a deterministic command with no design decision behind it; everything else is **complex**.

| Class | Examples | What it triggers |
|-------|----------|------------------|
| **Trivial** | Missing dependency (`npm outdated` shows `MISSING`) → `npm install`; missing build output (`dist/` absent) → `npm install && npm run build` | An auto-fix PR |
| **Complex** | `TODO` / `FIXME` / `HACK` in source; `CLAUDE.md` referencing a nonexistent path | A separate issue per finding |
| **Informational** | Issues idle for 30+ days | No action on its own — see below |

If a trivial fix actually fails when run, it is downgraded to **complex** and reported as an issue rather than silently dropped.

### Act

What happens next depends on which buckets are non-empty:

- **Trivial findings** are applied on a single branch named `maint/weekly-<date>-<run_id>`, committed (`fix: weekly maintenance auto-fix <date>`), pushed, and opened as one PR titled `[Maintenance] Auto-fix - <date>` listing each fix.
- **Complex findings** each become a **separate** issue titled `[Maintenance] <short description> - <date>`, with `## Finding`, `## Impact`, and `## Suggested approach` sections.
- **Informational findings** never get their own issue. They are appended as an `## Informational` section to one of the complex issues — and only if a complex issue is already being created.
- **No findings** → the workflow does nothing. It does not open empty PRs or issues.

### Guardrails

The maintenance agent operates under hard limits enforced by its permission set and prompt:

- It does **not** add labels — the triage workflow owns labelling.
- It does **not** merge PRs — the human merges through the [merge gate](/concepts/merge-gate/).
- It edits files only through `git` operations, never the `Write` or `Edit` tools.
- It does **not** create regression issues — that is the daily monitor's job.
- It never pushes to `main`; only to `maint/weekly-*` branches.

### The maintenance token

The workflow authenticates with `MAINTENANCE_PAT` — a **fine-grained personal access token on a 90-day rotation** — rather than the default `GITHUB_TOKEN`. This is deliberate: a PR opened with the default Actions token does not trigger downstream workflows, so the [merge gate](/concepts/merge-gate/) and CI would never fire on an auto-fix PR. The PAT makes those auto-fix PRs behave like any human-opened PR, gate and all.

## Fallback runbook

A multi-backend pipeline can fail in three escalating ways: a model name that no longer exists, an endpoint that throttles you, or a whole backend that is down. jkz recovers the first two automatically and stops to ask you about the third. The [Fallback concept page](/concepts/fallback/) explains *why* the line is drawn there; what follows is *what to set and what to do*.

### A model 404s — automatic

The smallest failure is a renamed or retired model returning `404 / ModelNotFound`. Each role has a configured fallback model, and the wrapper retries against it without involving you. Set these in `.env`:

- **Gemini:** `JKZ_GEMINI_MODEL` → `JKZ_GEMINI_MODEL_FALLBACK` (default `gemini-3.5-flash`).
- **API (OpenAI-compatible):** `JKZ_API_MODEL` → `JKZ_API_MODEL_FALLBACK`, with a per-role override `JKZ_<ROLE>_MODEL_FALLBACK`.

This applies inside `gemini-wrapper.sh`, `api-wrapper.sh`, and `gemini-invoke.js`. Control flow is unchanged — you simply get a verdict from the fallback model.

### A backend rate-limits — automatic cascade

On `429 / RESOURCE_EXHAUSTED` the wrapper first retries with backoff, then escalates through a two-tier cascade. Each layer stamps the completion record with `fallback_tier` so you can audit which path produced a verdict.

**Tier 3 — an OpenAI-compatible provider.** Applies to validator roles routed through `gemini-wrapper.sh` (`lens`, `curator`, `inspector`, `qa`, `research-reviewer`, `consultant-gemini`). When the retry budget is exhausted and a tier-3 endpoint resolves, the wrapper dispatches one attempt there. The resolver `bash scripts/resolve-provider-fallback.sh endpoint <role>` reads the per-role triple `JKZ_<ROLE>_PROVIDER_FALLBACK_ENDPOINT` / `_MODEL` / `_API_KEY` first, then the global pair `JKZ_PROVIDER_FALLBACK_ENDPOINT` / `_MODEL` (exit 0 = resolved, 1 = partial config, 2 = not configured). On success the verdict is propagated verbatim, the sentinel records `fallback_tier="api"`, and LangFuse logs verdict `TIER3_API`. On failure or missing config it falls through to tier 4.

**Tier 4 — the in-session model.** If tier 3 does not rescue the call, the wrapper exits **75** and writes a sentinel with `status="fallback"`. The command (`plan.md`, `review.md`, `qa.md`) detects this in its polling loop, resolves a provider through a three-level cascade — the sentinel's `fallback_provider`, then `resolve-provider-fallback.sh <role>`, then `sonnet` on script failure — and re-runs the role in-session via the Task tool with `fallback_effort` (default `medium`) and extended thinking when `fallback_thinking="true"`. Per-role defaults when nothing is configured: `auditor`→`sonnet`, `lens`→`sonnet`; `curator`, `inspector`, `judge`, `sentinel`→`opus`.

When you audit a fallback run, keep two fields distinct:

- **`fallback_tier`** — `"api"` if tier 3 was *attempted* (whether it served the verdict or was rejected and handed off to tier 4), or `"task"` if tier 3 was never attempted (no or partial tier-3 config) and the call went straight to tier 4. Records *which path* the run took. Note that a tier-4 hand-off after a rejected tier-3 attempt still carries `fallback_tier="api"`.
- **`fallback_provider`** — `"opus"` / `"sonnet"` / `"haiku"`. *Which model* the tier-4 Task tool dispatched to. Only meaningful when the tier-4 Task tool actually fired.

### A backend is down — manual

The largest failures are not a single call going wrong but a whole backend being unavailable, and the right response depends on judgment the pipeline does not have. Backends are configured per role via `JKZ_<ROLE>_ENDPOINT` (cascade: per-role → `JKZ_API_*`). Adversarial roles **require** an endpoint — if it is missing the wrapper exits **4** and the pipeline halts. Validator roles fall back to a local Gemini CLI when no endpoint is set. The system notifies you and waits:

| Backend down | Behavior |
|--------------|----------|
| **Opus** (creative roles) | Pipeline stops. No other agent codes in its place. System notifies and waits. |
| **Adversarial endpoint** (Auditor, Judge, Sentinel, Research-Auditor) | Review and the Sentinel security pass are skipped. System notifies; you decide whether to continue. |
| **Validator endpoint** (Curator, Inspector, Lens, Research-Reviewer) | QA frontend and Inspector are skipped. System notifies; you decide. |
| **External API endpoint** (any role on `JKZ_<ROLE>_ENDPOINT`) | `api-wrapper.sh` captures the HTTP error and persists error state. Pipeline notifies. |
| **Codex CLI** (`JKZ_<ROLE>_BACKEND=codex`) | Wrapper exits 78 (missing CLI), 76 (auth error), or other internal codes (75 / 77). Pipeline notifies; you decide. |
| **Claude Code** (the orchestrator) | Everything stops — it *is* the runtime that drives every other role. |

The split is deliberate: recoverable failures are handled where they happen, invisibly, while a backend outage is a quality-of-evidence question — running without an adversarial reviewer is a real trade-off — so the system surfaces it and leaves the call to you rather than silently degrading.

## See also

- [Fallback](/concepts/fallback/) — the conceptual model behind this runbook
- [SLOs & monitoring](/operations/slos-and-monitoring/) — the daily monitor that maintenance complements
- [Merge gate](/concepts/merge-gate/) — the human checkpoint the `MAINTENANCE_PAT` lets auto-fix PRs reach
