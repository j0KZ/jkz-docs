---
title: /jkz:status — Pipeline status
description: A read-only snapshot of the jkz pipeline — active issues and their phases, open PRs and their merge-gate state, recent agent activity, worktrees, dependencies, and system health.
---

`/jkz:status` is the dashboard. It is **read-only** — it changes nothing — and answers the question "what is the pipeline doing right now?" across every active issue, or in detail for one.

## Usage

```
/jkz:status                 # all active work
/jkz:status <issue-number>  # detailed status for one issue
```

## What it shows

Run without an argument, `/jkz:status` aggregates the live state of the whole pipeline:

- **Active issues** — every issue carrying a `jkz:` phase label, with its phase, active agent, and last-updated time.
- **Open PRs** — jkz-labeled pull requests with their review status and **merge-gate** state (`pending` / `approved` / `not_found`).
- **Recent agent activity** — live wrapper output from the last couple of minutes, so you can see which agent is working and on what.
- **Worktrees** — the per-issue [isolated worktrees](/concepts/worktree-isolation/) and their branches.
- **Dependencies** — the `blocked_by` / `blocks` graph, showing which issues are clear and which are gated on a blocker.
- **Pipeline mode** — fix-cycle counts and notification backend status for issues running under `/jkz:pipeline`.
- **System health** — reachability of the adversarial and validator backends, the GitHub API, notifications, plus stale-worktree and CLI-freshness counts.

### Detailed view for one issue

Passing an issue number drills in: the full timeline of agent invocations, all deliberation files, the associated PR and its review status, the dependency chain with each blocker's phase, the pipeline checkpoint data (fix counts, timestamps, approval state), recent phase transitions and per-phase durations, and — if it ran — the Sentinel meta-audit verdict.

:::note[Source of truth]
The status assembly lives in `.claude/commands/jkz/status.md` in the private repo. For CLI-version freshness and breaking-change detail, run `/jkz:health`; to *recover* an interrupted pipeline rather than just inspect it, use [`/jkz:resume`](/commands/resume/).
:::
