---
title: SLOs & monitoring
description: jkz watches its own health on two timescales — four Service Level Objectives that hold the 30-day pipeline quality bar, and a monitoring loop that runs eleven health checks every ten minutes. What each one measures, how it is evaluated, and when it raises an alert.
---

jkz judges its own health on two clocks. The slow clock is a set of **Service Level Objectives (SLOs)** — four quality bars evaluated over a rolling 30-day window that answer "is the pipeline healthy *in aggregate*?" The fast clock is a **monitoring loop** that runs every ten minutes and answers "is anything broken *right now*?" The two are complementary: SLOs catch slow erosion that no single run would reveal, while the loop catches acute failures — a stuck agent, a failing CI run, an exhausted rate limit — fast enough to act on them.

## The four SLOs

The thresholds live in [`scripts/slos.json`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/slos.json), and [`scripts/slo-check.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/slo-check.js) evaluates them against the pipeline state files in `state/pipeline/`. Every SLO uses a 30-day window: only pipelines whose `started_at` falls inside the window are counted.

| SLO | Threshold | Direction | What it measures |
|-----|-----------|-----------|------------------|
| `pipeline_completion_rate` | ≥ 0.80 | higher is better | Share of pipelines that reached a terminal phase (`completed`, `approved`, `qa_approved`, …). |
| `review_first_pass_rate` | ≥ 0.60 | higher is better | Among pipelines that got past the review phase, the share that needed **zero** review fix cycles. |
| `avg_fix_iterations` | ≤ 2.0 | lower is better | Mean fix iterations per pipeline — `review_fix_count + qa_fix_count`, summed and divided by pipeline count. |
| `max_pipeline_duration_hours` | ≤ 2 | lower is better | Longest start-to-finish wall-clock time among **completed** pipelines. |

### How a value becomes a verdict

`slo-check.js` reduces every pipeline state file to a single inner object (the files are `{ "<issue>": { … } }`) and computes the four actuals:

- **Completion rate** counts pipelines whose `current_phase` is terminal and divides by the total in the window.
- **First-pass rate** filters to pipelines that are *past* reviewing, then takes the fraction with `review_fix_count == 0`. With no past-review pipelines the value is `null`.
- **Average fix iterations** sums review and QA fix counts across all pipelines and divides by the count.
- **Max duration** walks the completed pipelines, computes `completed_at − started_at` in hours for each, and keeps the maximum. Pipelines with unparseable or negative durations are skipped.

Each actual is then compared to its threshold. SLOs without a `comparison` field are ratios where **higher is better**, so they record a `violation` when the actual drops *below* the threshold. SLOs with `comparison: "lte"` (`avg_fix_iterations`, `max_pipeline_duration_hours`) flip the test: they violate when the actual rises *above* the threshold. When there is no data for a metric — for example, no completed pipelines yet — the status is `no_data` rather than a pass or a fail.

The result is a structured object with each SLO's `actual`, `threshold`, and `status` (`ok` / `violation` / `no_data`) plus a flat `violations` list. It surfaces in two places: the [`/jkz:status`](/commands/status/) command renders it as a table, and the monitoring loop's `slo_compliance` check (below) turns any violation into a low-severity alert.

## The monitoring loop

The Telegram bot ([`scripts/telegram-bot.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/telegram-bot.js)) drives the fast clock. Every **ten minutes** (`MONITOR_INTERVAL_MS`) it runs one monitoring cycle: it executes a battery of independent, non-blocking checks in parallel, routes any non-`ok` results to alerts, and writes a snapshot of the full result set to `state/bot-monitor-report.json`.

Every check is an `async` function in [`scripts/monitoring-checks.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/monitoring-checks.js) that returns the same shape:

```text
{ status: "ok" | "warn" | "error", check: "<name>", detail: "<human text>", severity?: "S1".."S4" }
```

The checks are **Docker-aware**: when a project runs in a container, shell commands route through `docker exec -w /workspace`, while state-file reads use the native filesystem (the state directory is bind-mounted and readable from the host).

### The eleven checks

The live cycle runs eleven checks. Each is wrapped so a thrown error degrades to a `warn` rather than crashing the cycle.

| Check | Watches for | Worst severity |
|-------|-------------|----------------|
| `active_agents` | Agents idle more than 30 minutes with no stdout activity (`lastActivity` tracking). An idle agent is also cleaned up so it can be re-launched. | S3 |
| `ci_status` | Failing CI on open `jkz:reviewing` / `jkz:qa` PRs (`statusCheckRollup` in `FAILURE`/`ERROR`). | S1 |
| `stale_worktrees` | Secondary worktrees untouched for more than 4 hours. | S3 |
| `deliberation_errors` | Deliberation JSON files with `status: "error"` written in the last 30 minutes. | S1 |
| `github_api` | GitHub core rate limit running low (a warning under 100 requests remaining). | S2 |
| `git_drift` | Local `HEAD` falling behind `origin/main` (git-sync may have failed). | S2 |
| `cli_versions` | Outdated or breaking CLI updates, read from the cached changelog only — no network call. | S2 |
| `slo_compliance` | Any of the four SLOs above in `violation` over the 30-day window. | S4 |
| `worktree_cleanup` | Worktrees of terminal (merged/closed) pipelines that can be reclaimed. | — |
| `quota_restoration` | A previously exhausted Codex quota — probes whether it has recovered and reverts routing if so. | — |
| `stale_locks` | Worktrees locked by an issue that has since been closed (two-cycle confirmed sweep, issue #1376). | — |

`monitoring-checks.js` defines a few more check functions — groupthink detection, blocked-dependency scanning, post-merge outcome tracking — that are exported for other surfaces but are **not** part of this ten-minute cycle.

### Severity and alerting

Checks tag themselves with a severity from **S1** (most urgent — failing CI, deliberation errors) down to **S4** (SLO drift). After every cycle, `routeMonitorAlerts` selects the non-`ok` results worth sending and applies a **30-minute cooldown** (`ALERT_COOLDOWN_MS`) per alert key, so a persistent condition pings the project's Telegram health thread at most twice an hour instead of every cycle. Alerts render with an `ERROR` or `WARN` icon and the check's `detail` text.

### Cadence layered on top of the cycle

A few periodic jobs ride the same ten-minute tick using a cycle counter:

- **Every 3 cycles (30 min):** proactive task discovery plus an automations tick.
- **Every 6 cycles (60 min):** a fire-and-forget refresh of the CLI changelog cache (`changelog-review.js`), which is what keeps the `cli_versions` check's cache-only read meaningful.

## Related

- [Pipeline](/concepts/pipeline/) — the PLAN → BUILD → REVIEW → QA flow whose completion, first-pass, and fix-iteration rates the SLOs measure.
- [Telegram bot](/subsystems/telegram-bot/) — the host process that runs the monitoring loop and delivers its alerts.
- [Worktree isolation](/concepts/worktree-isolation/) — the worktrees that the `stale_worktrees`, `worktree_cleanup`, and `stale_locks` checks keep tidy.
- [`/jkz:status`](/commands/status/) — the command that renders the live SLO table on demand.
