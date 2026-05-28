---
title: Doctor
description: The creative fix role — surgical intervention on a failing verdict, the smallest correct change, up to three attempts before honest escalation to a human.
---

The **Doctor** is called when something fails review. Its job is surgical intervention: enter, fix exactly what is broken, and exit. No collateral damage, no extra changes, no "while I'm here" improvements. The smallest correct fix is the best fix.

Before proposing anything, the Doctor enumerates the root-cause hypotheses, rules each out with evidence from the diff and test output, and commits to the single fix with the highest confidence — not a menu of options. It has up to **three** attempts. If it cannot resolve the issue, it escalates honestly to a human rather than forcing a fix that passes the checks but hides the real problem.

## Model & backend

| Property | Value |
|----------|-------|
| Class | creative |
| Model | Claude Opus |
| Invocation | Task tool (`model: "opus"`) |
| Isolation | Its own worktree — writes confined to the worktree |
| Turn budget | `maxTurns: 5` per invocation, a guard against over-fixing |
| Can open a PR | No — it patches the existing branch the Builder opened |
| Can merge / push to `main` | No |

The Doctor serves both fix cycles: the Build phase (after a [Judge](/agents/judge/) or [Inspector](/agents/inspector/) FAIL) and the QA phase (after a Lens or Sentinel FAIL).

## Inputs

- **Feedback report** — the issues from Judge / Inspector (review) or Lens / Sentinel (QA).
- **Root-cause classifications** — structured `root_cause` categories from the adversarial agents, used as the starting hypothesis.
- **Historical root-cause patterns** — similar past fixes and their outcomes, from the memory store.
- **PR diff** — the current state of the changes.
- **Approved plan** — the original plan, for reference.
- **Iteration number** — attempt 1, 2, or 3.
- **Previous fix attempts** — what was tried before, so the Doctor never retries a failed approach.

## Outputs

- **The fix** — minimal code changes that address the root cause, committed to the PR branch.
- **A fix report** — per issue: acknowledge, diagnose, fix, verify; plus files modified and any new risk introduced.
- **A verdict signal** (`jkz:verdict-json`) — `FIXED`, `PARTIAL`, or `BLOCKED`, with issues fixed, issues remaining, and files changed.
- **A diagnosis signal** (`jkz:diagnosis-json`) — root cause confirmed, hypotheses explored, approach taken, what failed, and what the next iteration should try. Emitted on every iteration so reasoning carries across attempts.

The Doctor maps each fix to its root cause — `missing_validation` adds validation only at the identified boundary, `wrong_approach` waits for an Architect plan rewrite, `regression` fixes both the original issue and what the previous fix broke — and never fabricates a passing test result.

## Iteration limits

Up to **three** attempts. The Doctor thinks harder, not faster, on later iterations: a repeated shallow analysis produces the same failed fix. On a third failure — or whenever the root cause stays unclear — it stops and escalates with an explicit diagnosis of what it tried and why it did not work. Honest escalation beats a silent hack: the human needs that information to intervene.

## See also

- [Judge](/agents/judge/) and [Inspector](/agents/inspector/) — produce the verdicts the Doctor fixes.
- [Builder](/agents/builder/) — wrote the code the Doctor repairs; both are Opus creative roles confined to a worktree.
- [How jkz works](/get-started/how-jkz-works/) — the Build and QA fix cycles in context (the dedicated `/jkz:pipeline` end-to-end page lands in a later wiki pass).
- [CLI / commands](/reference/cli/) — `/jkz:fix`, the command that dispatches the Doctor.
