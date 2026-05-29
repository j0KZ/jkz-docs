---
title: CodeRabbit & Notifications
description: Two cross-cutting subsystems — the CodeRabbit review bot that adds an independent review pass on every PR, and the notification layer that mirrors agent activity to Discord, Telegram, and GitHub and accepts approvals from your phone.
---

Most of jkz is about getting code right before a human sees it. Two subsystems sit across the whole pipeline to make that work without slowing you down. **CodeRabbit** is an external AI reviewer that comments on every pull request, giving the pipeline a second, independent opinion alongside its own agents. The **notification layer** mirrors what those agents are doing to your chat tools and lets you approve, reject, or stop a run from anywhere — so the human-in-the-loop checkpoint does not require you to be sitting at the terminal.

## CodeRabbit integration

CodeRabbit is an AI code-review bot that comments on GitHub pull requests. jkz treats it as an additional adversarial reviewer that runs *alongside* the pipeline's own agents (Judge, Inspector, Sentinel) — not as a replacement for them. The pipeline never merges on CodeRabbit's say-so; its findings are triaged like any other signal and folded into the same human checkpoint.

### Where it runs

CodeRabbit shows up at three points in a pipeline run:

- **PLAN** — `cr-plan-iterate.js` feeds CodeRabbit's comments on the plan PR back into the planning loop, catching design problems before any code is written. Informational and non-blocking.
- **BUILD** — CodeRabbit pre-scans the diff, then the **CR fix loop** addresses its findings before the Judge reviews. Pre-push validators run afterward.
- **Post-PASS** — once the Judge returns PASS, **CR reconciliation** (`cr-reconcile.js`) catches any findings that landed after the last review iteration, so nothing slips through between the final review and approval.

### Triage discipline

Every CodeRabbit finding is classified before any action is taken, and every classification is checked against the **actual diff** — many findings target pre-existing code or rest on a misreading of the change.

| Classification | Meaning | Action |
|----------------|---------|--------|
| **VALID** | Correct, and affects code introduced by this PR | Fix the code |
| **FALSE_POSITIVE** | Incorrect or based on a misunderstanding | Reply with a file citation, then resolve |
| **OUT_OF_SCOPE** | Valid, but affects pre-existing code rather than this PR | Open a follow-up issue |
| **ALREADY_FIXED** | Addressed in an earlier commit | Reply noting it is fixed, then resolve |

A `FALSE_POSITIVE` dismissal **requires a file citation** (`path/to/file.ext:LINE`) as evidence — a dismissal without one is re-classified as `VALID` or `OUT_OF_SCOPE`. This keeps the bot's findings honest in both directions: real issues get fixed, and spurious ones get dismissed only with a reason a reviewer can re-check.

### The tools

- **`/jkz:cr-fix`** — triage and address multiple findings in one pass.
- **`coderabbit:autofix`** — apply a single committable suggestion with per-change approval.
- **`cr-reconcile.js`** — fetches CodeRabbit findings as structured JSON for the Orchestrator to triage. It deliberately does **not** classify; classification is the Orchestrator's job, so the rule above is applied with full pipeline context.
- **`cr-resolve.sh`** — atomically replies to a review thread **and** resolves it. The two steps must happen together; the script reserves exit code `2` for the "reply posted but resolve failed" case so a thread is never silently left replied-but-unresolved.
- **`minimize-old-comments.sh`** — collapses a role's outdated comments when a new review iteration posts, keeping the PR conversation readable.

### The pre-flight gate

`cr-preflight-gate.sh` blocks the transition to `jkz:approved` while any CodeRabbit thread is still unresolved. A thread counts as addressed if it has a dismissal reply **or** is covered by a commit pushed after the comment was created. The gate is part of the merge defenses, not a substitute for them — it is bypassable with `--force` or the `JKZ_CR_GATE_DISABLE=1` kill-switch (emergency use only).

Finding history is persisted across runs by the `cr-history-*` scripts (ingest, store, query), so the pipeline can see how similar findings were triaged before.

## Notifications

A single dispatcher, `notify.sh`, mirrors pipeline activity to one or more backends and surfaces the human checkpoints for approval. It is built to be invisible when healthy and impossible to let block a run.

### Backends

Notifications are multi-backend, selected via `JKZ_NOTIFY_BACKEND` (comma-separated for more than one):

- **Discord** — threaded posts with pre-seeded reaction emojis for approvals.
- **Telegram** — a long-polling daemon (`telegram-bot.js`) with inline-keyboard buttons and full pipeline control from your phone.
- **GitHub** — checkpoint state mirrored to the issue for the GitHub approval poller.

`notify.sh` **never blocks the pipeline**: it traps errors to `exit 0`, caps every network call with `curl --max-time 5`, and degrades gracefully — if notifications are disabled entirely, a plan-approval checkpoint falls back to a terminal prompt instead.

### Levels and events

Verbosity is controlled by `JKZ_NOTIFY_LEVEL` — `all`, `checkpoint`, or `critical` — and is overridable per backend, so you can get every agent post in Discord while Telegram only pings you at checkpoints. The dispatcher formats distinct events — `agent-posted`, `phase-transition`, `checkpoint`, `pipeline_complete`, `pipeline_blocked`, `ci_failed`, and pipeline-stuck escalations — each tagged with a model badge and a verdict icon.

### Approvals and feedback

At a human checkpoint the pipeline posts approval controls — Discord reactions (✅ ❌ 🛑) or Telegram inline buttons (`[✅ Approve]`, `[❌ Reject]`, `[🛑 Stop]`). Only users listed in `JKZ_APPROVER_IDS` can approve. Replies are captured as bidirectional feedback and consumed at the next checkpoint via `state/threads.json`, which is file-locked (`flock`, with a portable shim on macOS) so concurrent writers never corrupt it.

The Telegram bot also runs a monitoring loop with periodic health checks and proactive task discovery, surfacing suggestions as inline buttons — it suggests, and the human acts.

The hard kill-switch `JKZ_NOTIFY_FORCE_DISABLE=1` disables all notifications regardless of `.env`; the test suite sets it so a run never sends a real message. The full setup guide — Discord and Telegram credentials, the bot service, and command reference — lives in `docs/notifications.md` in the main repo.

## Related

- [Pipeline](/concepts/pipeline/) — the BUILD → REVIEW → QA flow where CodeRabbit and the checkpoints fire.
- [Merge gate](/concepts/merge-gate/) — the merge defenses the CodeRabbit pre-flight gate complements.
- [Hermes](/subsystems/hermes/) — the always-on agent that reports its scheduled jobs through the same Telegram layer.
