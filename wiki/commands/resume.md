---
title: /jkz:resume — Diagnose & resume a pipeline
description: When a pipeline was interrupted — a crash, a stop, an expired lock — /jkz:resume diagnoses exactly where it stalled and what happened, then delegates to the right command to pick up from that point.
---

Pipelines get interrupted: a session crashes, you stop a run mid-flight, a lock expires, a fix cycle fails. `/jkz:resume <issue-number>` is how you get back on track. It **diagnoses** what state the pipeline is in, presents that diagnosis clearly, and — only after you confirm — **delegates** to the correct command to continue from the exact point it stopped.

## Usage

```
/jkz:resume <issue-number>
```

## What it diagnoses

`/jkz:resume` reads the pipeline checkpoint and classifies the interruption into one of six types, each with its own handling:

| Interruption | What it means | Handling |
|--------------|---------------|----------|
| `completed` | Pipeline already finished | Nothing to resume |
| `running` | A lock is active — another session may be processing it | Wait, or inspect with [`/jkz:status`](/commands/status/) |
| `blocked` | The fix cycle exhausted its attempts | Shows the postmortem; offers re-plan / manual fix / close |
| `crash` | An unexpected interruption | Presents the recommended resume point for confirmation |
| `stopped` | The run was stopped deliberately | Presents the recommended resume point for confirmation |
| `fail` | A phase failed | Presents the recommended resume point for confirmation |

For the recoverable types, the diagnosis includes the current phase, the last completed step and the next step, the associated PR and its state, lock status, fix-cycle counts, and the issue's age — so you can see precisely where the pipeline is before deciding.

## The principle: diagnose, then delegate

`/jkz:resume` never auto-executes a recovery. It surfaces a **recommended action** (for example, "re-run review on PR #44" or "re-plan from scratch") and asks you to confirm. On confirmation it releases any expired lock and hands control to the target command (`/jkz:plan`, `/jkz:review`, `/jkz:qa`, `/jkz:pipeline`, …). For a `blocked` pipeline it presents options rather than a single recommendation, because the right move — re-plan, fix manually, or close — is a judgment call.

If there is no pipeline state for the issue at all, `/jkz:resume` tells you so and points you to `/jkz:pipeline <N>` to start fresh.

:::note[Source of truth]
The diagnosis logic lives in `scripts/resume-diagnose.js` and the command flow in `.claude/commands/jkz/resume.md` in the private repo. To inspect a pipeline without resuming, use [`/jkz:status`](/commands/status/).
:::
