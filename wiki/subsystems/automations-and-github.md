---
title: Automations & GitHub integration
description: jkz treats GitHub as its source of truth and its message bus. A small automations engine reacts to interval and event triggers, while a layer of best-effort integrations keeps labels, issue relationships, Check Runs, pinned comments, and a Projects board in sync with the pipeline — all fail-open, none of them able to block a merge.
---

jkz keeps almost nothing in a private database. The pipeline's state machine lives in GitHub labels, inter-agent feedback flows through pull-request comments, and the verdicts that decide whether code advances are posted as Check Runs. GitHub *is* the bus. Two things make that work: a small **automations engine** that reacts to time and to named events, and a set of **integration scripts** that translate pipeline transitions into GitHub mechanics — labels, issue relationships, status comments, and a Projects board.

One principle runs through all of it: **the integration layer never blocks.** A relationship that fails to register, a Check Run the token isn't allowed to write, a Projects board that isn't configured — none of these stop the pipeline. Each script traps its own errors and exits clean. The merge gate and the adversarial review layer are the real guardrails; everything here is bookkeeping that *should* succeed and is harmless when it doesn't.

## The automations engine

The engine is a trigger-dispatch loop defined in [`scripts/automations/run.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/automations/run.js), driven by a single manifest at [`scripts/automations/config.json`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/automations/config.json). Each entry binds a **trigger** to an **action module**:

```json
{
  "automations": {
    "ci-failure-main": {
      "trigger": { "type": "event", "event": "ci.failure.main" },
      "action":  { "module": "ci-failure-main" },
      "enabled": true
    },
    "stale-cleanup": {
      "trigger": { "type": "interval", "intervalMs": 86400000 },
      "action":  { "module": "stale-cleanup" },
      "enabled": false
    }
  }
}
```

Two trigger types exist. **Interval** triggers fire on a tick (the Telegram bot's monitoring loop calls `run.js --tick` periodically and runs any interval automation whose time has come). **Event** triggers fire by name — `run.js --event <name>` dispatches every enabled automation listening for that event. An action is a plain Node module under [`scripts/automations/actions/`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/automations/actions); if the module named in the manifest is missing, that automation is skipped (`status: action_not_found`) rather than crashing the tick.

The whole engine is gated behind a single flag: every dispatch path returns early unless `JKZ_AUTOMATIONS_ENABLED=true`. Run state — last run timestamp, run count, last result — is persisted to `state/automations.json`.

The currently registered automations:

| Automation | Trigger | Enabled | What it does |
|------------|---------|---------|--------------|
| `ci-failure-main` | event `ci.failure.main` | yes | Auto-creates an issue when CI fails on `main`. |
| `cr-plan-ready` | event `jkz.cr-plan-ready` | yes | Logs when CodeRabbit posts a Coding Plan on an issue. |
| `stale-cleanup` | interval (24h) | no | Code-hygiene scan — stale TODOs, unused exports, orphan tests, dead config. |
| `entropy-scan` | interval (7d) | no | Full-repo scan through the validators (secrets, stubs, `console.log`). Disabled here; runs exclusively from the Hermes cron host to avoid cross-host duplicate issues. |

`stale-cleanup` is the most illustrative action. It runs four scanners — stale TODO/FIXME/HACK comments older than 60 days, `module.exports` with no references, test files with no matching source, and config drift (action modules that don't exist, `.env.example` vars never read) — and files a single deduplicated `jkz:ready` + `refactor` issue if anything turns up. Same-day reruns short-circuit on a dedup marker.

### Triggering automations from MCP

The automations engine is also reachable over the [MCP server](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/mcp/src/index.ts). Two scoped tools wrap the CLI:

- **`list_automations`** (scope `read`) — runs `run.js --list` and returns each automation's name, trigger, enabled flag, last run, run count, and last result.
- **`trigger_automation`** (scope `write`) — takes a `name` and runs `run.js --trigger <name>`.

Scopes follow a three-tier hierarchy (`read` < `write` < `admin`) enforced on the HTTP transport. A read-only dashboard token can inspect automations but cannot fire them; firing requires a `write` token.

## GitHub as the state machine: labels

Every phase of the pipeline is a GitHub label, and the cardinal rule is ownership: **if you didn't add it, don't remove it.** Each label has exactly one owner — the command or script that applies it — and only that owner (or the Orchestrator's `orchestrate.sh transition`, which clears all agent labels on every phase change) may remove it. The full ledger lives in [`docs/LABEL-OWNERSHIP.md`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/docs/LABEL-OWNERSHIP.md); the shape:

| Family | Count | Owner | Notes |
|--------|-------|-------|-------|
| Phase (`jkz:ready` … `jkz:approved`, `jkz:blocked`, `jkz:pipeline`) | 9 | `orchestrate.sh transition` | Mutually exclusive; the transition clears the old one. |
| Agent (`jkz:architect`, `jkz:judge`, `jkz:sentinel`, …) | 9 | The phase command that runs the agent | Cleared on transition. |
| Type (`bug`, `refactor`, `chore`) | 3 | `/jkz:start`, `/jkz:issue` | Immutable once set; no `jkz:` prefix. |
| Automation (`jkz:regression`) | 1 | `monitor.sh` in CI | Created with dedup; not part of the worktree/PR flow. |
| Wiki (`docs-worthy`) | 1 | Human triage | Read-only from the pipeline's perspective. |

Phase transitions are validated against a state machine — illegal transitions are rejected, not silently applied.

## Issue relationships: blocked-by, epic, sub-issue

When an issue body declares a relationship, jkz registers it as a *native* GitHub relationship at creation time — not as prose. Two markers are scanned:

- `**Blocked by:** #N` → a blocked-by relationship, registered via [`scripts/gh-blocked-by.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/gh-blocked-by.js).
- `**Epic:** #N` / `**Parent:** #N` → a parent/child sub-issue relationship, registered via [`scripts/gh-sub-issue.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/gh-sub-issue.js).

The colon after `Epic` / `Parent` is required — without it the line is read as prose, which keeps words like "epicenter" or "parent company" from triggering a false relationship.

Both scripts work the same way: resolve the issue numbers to GraphQL node IDs (cached to avoid redundant lookups), then run the `addBlockedBy` / `addSubIssue` (or `remove…`) GraphQL mutation, with the query written to a temp file to sidestep shell-escaping. And both are strictly **fail-open**: every error is logged to stderr and the script exits `0` regardless. A single kill-switch disables all relationship API calls without a code change:

```bash
JKZ_GH_RELATIONSHIP_DISABLE=1
```

## Verdicts as Check Runs

Adversarial and validator verdicts (Judge, Inspector, Lens, Sentinel) post to the PR as a comment *and* as a GitHub Check Run named `jkz:<role>`. The Check Run is written by [`scripts/github-review.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/github-review.js): a `PASS` verdict maps to conclusion `success`, `FAIL` to `failure`, anything else to `neutral`, with the severity counts (`2C 1H 0M`) in the output summary.

Check Runs are **best-effort, not gating**. If the token lacks `checks:write`, the API call fails and the error is swallowed — the comment still lands, and the pipeline carries on. Branch protection rules, not these Check Runs, control whether a merge is actually allowed.

## Pinned comments and Projects sync

Two more integrations keep the GitHub surface tidy as the pipeline runs:

- **Pinned status comments** — [`scripts/pin-status-comment.sh`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/pin-status-comment.sh) pins milestone status comments (pipeline started, plan checkpoint, pipeline complete/blocked) on the issue and unpins the previous one, so the latest status is always the pinned one. It pins via the REST API and falls back to a GraphQL mutation on a 404.
- **Projects board sync** — [`scripts/project-sync.sh`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/project-sync.sh) moves the issue's card to the column matching the new phase on every transition. It is entirely optional: it reads `JKZ_PROJECT_NUMBER` (plus per-phase option IDs) from `.env`, and if `JKZ_PROJECT_NUMBER` is unset it exits immediately, a no-op.

And on the PR itself, [`scripts/minimize-old-comments.sh`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/minimize-old-comments.sh) collapses superseded agent comments: when a role posts a fresh verdict, the previous comments from that same role are minimized as `OUTDATED` via GraphQL, leaving only the latest visible. A short per-PR-per-role debounce prevents API thrash when several agents post in quick succession.

Like the relationship scripts, all four of these trap their errors and exit `0` — a pinned comment that fails to pin, or a board that isn't configured, never interrupts the run.

## The common thread

Every integration on this page shares the same contract: **observe and record, never block.** The automations engine skips a missing action instead of throwing; the relationship scripts exit clean on any API error; Check Runs degrade to comments when the token is under-scoped; Projects sync is a no-op when unconfigured. That is deliberate. GitHub is where jkz keeps its state and posts its results, but the authority to *stop* a change lives elsewhere — in the [merge gate](/concepts/merge-gate/) and the adversarial review layer of the [pipeline](/concepts/pipeline/). The integration layer's job is to make the state legible, not to enforce it.

## Related

- [Pipeline](/concepts/pipeline/) — the phase flow whose transitions drive labels, Check Runs, pinned comments, and Projects sync.
- [Merge gate](/concepts/merge-gate/) — the real enforcement layer behind the best-effort Check Runs.
- [Issue types](/concepts/issue-types/) — how `bug` / `refactor` / `chore` type labels shape the pipeline.
- [Telegram bot](/subsystems/telegram-bot/) — the monitoring loop that ticks the interval automations.
- [Hermes](/subsystems/hermes/) — the cron host that runs `entropy-scan` and other scheduled jobs.
