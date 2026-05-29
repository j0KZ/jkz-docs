---
title: Telegram bot
description: The always-on observability layer for jkz — an eleven-check monitoring loop every ten minutes, proactive task discovery, debounced alerts, and human-in-the-loop inline keyboards.
---

The pipeline runs unattended for long stretches: a `/jkz:pipeline` invocation can spend an hour cycling through plan, build, and QA without anyone watching the terminal. The Telegram bot is the layer that watches for you. It runs a fixed set of health checks on a timer, surfaces anything that has gone wrong, and proposes work that is waiting to start — but it never acts on its own. Every suggestion lands as a button you press. The bot observes and recommends; you decide.

Two loops drive it: a **monitoring loop** that samples system health, and a **task discovery loop** that scans GitHub for actionable work. Both report to the project's Telegram chat.

## The monitoring loop

Every ten minutes the bot runs eleven health checks concurrently and folds their results into one report. Each check returns a status — `ok`, `warn`, or `error` — and a short detail string. The checks are independent and isolated: a check that throws is caught and downgraded to a `warn` rather than taking the whole loop down.

| Check | What it watches |
|-------|-----------------|
| `active_agents` | Agents that have gone idle, via `lastActivity` tracking |
| `ci_status` | The health of the latest CI runs |
| `stale_worktrees` | Worktrees lingering past their expected lifetime |
| `deliberation_errors` | Errors recorded in agent deliberation logs |
| `github_api` | Remaining headroom on the GitHub API rate limit |
| `git_drift` | Whether local `HEAD` has fallen behind `origin/main` (a sign git-sync failed) |
| `cli_versions` | Outdated CLIs and breaking changes — read from cache, never the network |
| `slo_compliance` | Pipeline SLOs evaluated over a rolling window |
| `worktree_cleanup` | Removes worktrees for issues that have reached a terminal state |
| `quota_restoration` | Probes whether an exhausted Codex quota has recovered |
| `stale_locks` | Recovers worktree locks whose owning issue is already closed |

The report is persisted to `state/bot-monitor-report.json` after every cycle, so the most recent system snapshot is always available on disk even between Telegram messages.

The bot is Docker-aware: when the project runs inside a container it issues shell commands through the container and reads state files natively from the mounted workspace.

:::note
The on-demand `/health` command in the bot runs a smaller subset of these checks (the eight that are cheap and side-effect-free) for a quick status readout. The full eleven-check sweep — including the cleanup and lock-recovery checks that mutate state — only runs on the timed loop.
:::

## Alerts and debouncing

Health findings do not flood the chat. Each distinct alert is debounced with a **thirty-minute cooldown**: once an alert fires, the same alert stays silent for thirty minutes even if the underlying condition persists across loop cycles. This keeps a single ongoing problem (a rate-limit warning, a stuck agent) from posting every ten minutes.

## Background refreshes

A few maintenance tasks ride the same ten-minute clock but run on longer intervals, counted in cycles:

| Task | Cadence | Trigger |
|------|---------|---------|
| Monitoring loop | every cycle | 10 min |
| Task discovery | every 3rd cycle | 30 min |
| Changelog cache refresh | every 6th cycle | 60 min |

The changelog refresh is fire-and-forget: it kicks off `changelog-review.js` in the background to keep the CLI-version cache warm, so the `cli_versions` check stays fast (it only ever reads the cache).

## Proactive task discovery

Every thirty minutes — every third monitoring cycle — the bot scans GitHub for work that is ready but idle. It looks for four conditions:

- **`jkz:ready` issues with no active pipeline** — work that is queued but unstarted.
- **Stale PRs open longer than 24 hours** — surfaced as informational, not as a problem to fix.
- **Blocked issues** — issues waiting on an unresolved dependency.
- **Stale pipelines older than two hours** — a run that has stalled mid-phase.

Each finding is offered as a Telegram inline keyboard: a message with buttons the human can tap to act. The system suggests; the human acts. Nothing starts a pipeline, merges a PR, or unblocks an issue automatically.

### Staying under the callback limit

Telegram caps `callback_data` — the payload attached to an inline button — at 64 bytes. A jkz command with an issue number and context easily exceeds that. The bot works around the limit with a `pendingCommands` pattern: the full command is stored server-side and the button carries only a short key that points to it. When the button is pressed, the bot looks up the real command by its key. This keeps every button well under the 64-byte ceiling regardless of how long the underlying command is.

## Where this lives

The checks themselves are defined in `scripts/monitoring-checks.js`; task discovery lives in `scripts/task-discovery.js`; and the bot that schedules both loops, debounces alerts, and renders the inline keyboards is `scripts/telegram-bot.js`.
