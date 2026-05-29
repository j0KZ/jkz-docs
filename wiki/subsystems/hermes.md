---
title: Hermes
description: Hermes is jkz's always-on agent — a VPS container that runs the project's scheduled background work. How its cron scheduler is driven from a single registry, what the jobs are, and which LLM backends it uses.
---

Most of jkz runs in front of you: an interactive Claude Code session driving a pipeline you approve step by step. Hermes is the part that runs when no one is watching. It is a long-lived container on a VPS that executes jkz's scheduled background work — health checks, security audits, cost reports, cleanup, and autonomous research — and reports the results to Telegram. Think of it as the project's night shift: deterministic, mostly token-free, and independent of any open chat.

## The scheduler model

Hermes is scheduled by the **Linux `cron` daemon running inside the container** — not by a hand-edited crontab, and not by an LLM. The single source of truth is [`config/cron-registry.json`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/config/cron-registry.json) in the main repo. At container start, the entrypoint runs `scripts/hermes/generate-crontab.sh`, which reads the registry, expands the `${HERMES_JKZ_ROOT}` path variable to the container path, and writes `/etc/cron.d/jkz`. The cron daemon then fires each line on its schedule. The generator is idempotent — it overwrites `/etc/cron.d/jkz` on every run — so the registry is always the authority and `/etc/cron.d/jkz` is never edited by hand.

```text
container start
  → entrypoint
    → bash scripts/hermes/generate-crontab.sh
      → reads config/cron-registry.json
      → writes /etc/cron.d/jkz (paths expanded; "runner": "direct" jobs skipped)
    → service cron start
  → cron daemon fires jobs on schedule
    → wrapper saves state/reports/<date>/<job>.json
    → wrapper posts to Telegram (per thread)
```

**Why cron and not Hermes's own LLM scheduler.** jkz's scheduled jobs are deterministic shell commands — run a script, collect its output, post it. Routing them through an LLM scheduler wasted tokens and added latency for no benefit, so they run as plain cron entries. Hermes does have a separate prompt-based LLM scheduler, but it is reserved for prompt-driven jobs and is not used for the registry above.

To pick up a registry change, regenerate without a full restart:

```bash
HERMES_JKZ_ROOT=$(pwd) bash scripts/hermes/generate-crontab.sh --dry-run   # local preview, no root
docker exec hermes-agent bash ${HERMES_JKZ_ROOT}/scripts/hermes/generate-crontab.sh
docker exec hermes-agent service cron reload
```

## The jobs

The registry holds **27 jobs**: 25 run under container cron, and 2 are marked `"runner": "direct"` so the generator skips them — they run from the VPS host crontab instead (currently the autobackup and a DST-adjustment helper). Each job wraps its script with `hermes-report-wrapper.sh`, which persists a JSON report to `state/reports/<date>/<job>.json` and posts a summary to Telegram.

Jobs are organized by Telegram thread:

| Thread | Purpose | Examples |
|--------|---------|----------|
| **29 — System Health** | Operational alerts and the daily digest | `git-sync`, `health-check`, `task-discovery`, `cli-updates`, `slo-check`, `daily-digest`, cost summaries, `research-poll`, `research-bisync` |
| **33 — Maintenance** | Weekly audits, security scans, analytics, cleanup, learning | `entropy-scan`, `doc-sync`, `deps-audit`, `bugs-scan`, `supply-chain`, `quality-scan`, `postmortem`, `memory-curate`, `skill-security-audit`, `state-cleanup`, `learning-digest`, `pagefind-validate` |

Every day at 07:00 CLT, `daily-digest` aggregates the day's reports into a single traffic-light summary (RED / YELLOW / GREEN), and flags any job that was expected to run but did not report. Two operational jobs are worth calling out: `git-sync` hard-resets the VPS working tree to `origin/main` each night so jobs run against merged code (runtime `state/` is gitignored and never clobbered), and `research-poll` drains the `jkz:research-pending` queue — the entry point to Hermes's autonomous research subsystem, which runs headless `/jkz:research` invocations independently of the BUILD/REVIEW/QA pipeline.

## Cost model

Almost every job is a shell command that consumes **zero LLM tokens, zero GPU time, and $0**. Two jobs are deliberate exceptions:

- **`doc-sync`** calls Claude Haiku to detect documentation drift — roughly 1K tokens per run, twice a week.
- **`research-poll`** calls Opus via `claude --print`, but **only when the `jkz:research-pending` queue is non-empty**. Idle ticks cost nothing; an active queue charges one Opus run per pending issue, bounded by the poller's outer 270 s timeout and `JKZ_HERMES_POLL_MAX_DURATION_SEC` (default 3600 s).

## LLM backends

Hermes's *interactive* surfaces — the Telegram bot and CLI — answer through cloud LLM backends, not Claude: **Ollama Cloud** (a paid hosted plan, not a local model and not the free tier) and **Kimi** (Moonshot). Both are cloud-hosted. The only Claude usage on Hermes is the two cron exceptions above, which authenticate through a long-lived `CLAUDE_CODE_OAUTH_TOKEN` stored in the container environment.

## Infrastructure notes

- The container `hermes-agent` runs on the project VPS. Jobs execute as the unprivileged user `hermes` (uid 10000).
- Every job command references `${HERMES_JKZ_ROOT}` (default `/opt/data/jkz`); the generator expands it at write time so `/etc/cron.d/jkz` holds literal paths.
- Docker bind-mounts can create root-owned files in the working tree; correcting ownership to `10000:10000` from the VPS host keeps the `hermes` user able to write.
- A DST-adjustment helper recalculates UTC schedules on Chile's daylight-saving transitions, so the Chile-local times the schedules target stay stable across the clock change.

## Related

- [Pipeline](/concepts/pipeline/) — the interactive BUILD → REVIEW → QA flow Hermes runs *alongside*, not inside.
- [Cross-chat awareness](/concepts/cross-chat/) — how Hermes's `git-sync` and the live sessions share one working tree without colliding.
