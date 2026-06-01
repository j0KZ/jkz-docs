---
title: pipeline
description: "Run the full pipeline autonomously — Plan → Build → Review → QA → Completion. Plan approval is pre-flight; inside the loop you intervene three times: review approval, QA approval, and the manual merge."
---

`/jkz:pipeline <issue-number>` runs the complete jkz pipeline end to end with minimal intervention. It is the route for `standard`-complexity work — a feature that spans layers, a refactor with design decisions, anything where the plan deserves a checkpoint before code is written and QA deserves a checkpoint before merge.

The pipeline is autonomous, not unattended. Plan approval happens **pre-flight**, before the loop starts. Then, inside the loop, you intervene at exactly three points: the review approval, the QA approval, and the final manual merge. Everything between those gates — agent dispatch, iteration, fix cycles — runs on its own.

## At a glance

| | |
|------|------|
| **Phases** | Plan → Build → Review → QA → Completion |
| **Human checkpoints** | 3: review approval, QA approval, manual merge |
| **Plan approval** | Pre-flight (before the loop) |
| **Best for** | `standard` complexity — multi-layer features, refactors with design decisions |
| **Worktree** | Auto-enters an isolated per-issue worktree |
| **Usage** | `/jkz:pipeline <issue-number> [--resume] [--from <phase>] [--silent]` |

## When to use

Reach for `/jkz:pipeline` when the [complexity classifier](/build/lightweight-routes/) sizes an issue as `standard`: the work touches multiple system layers, carries non-obvious implications, or needs a design decision before implementation. If the change is a one-liner, a typo, or a scoped fix, the [lightweight routes](/build/lightweight-routes/) (`/jkz:quick`, `/jkz:fix`) are the better fit — running a full Plan → Build → Review → QA loop on a trivial change wastes both tokens and your time.

## Key behavior

The pipeline walks every phase of the [full pipeline](/get-started/how-jkz-works/), reusing each phase command's steps and overriding only the checkpoint behavior:

- **Plan** — [Architect](/agents/architect/) → [Auditor](/agents/auditor/) → [Curator](/agents/curator/), iterating up to 3×, then a human approval checkpoint *before* the loop continues.
- **Build** — [Builder](/agents/builder/) implements inside the worktree and opens a PR, followed by the review's prescan and fix loop.
- **Review** — [Judge](/agents/judge/) → [Inspector](/agents/inspector/), with the [Doctor](/agents/doctor/) fixing failures (up to 3×), then your review approval.
- **QA** — [Lens](/agents/lens/) and [Sentinel](/agents/sentinel/) run in parallel; the Doctor fixes any failure. QA is required for features and optional for `bug` / `refactor` / `chore`.
- **Completion** — the PR is left ready for the human merge. The pipeline never merges on its own — that gate is enforced server-side by the [merge gate](/concepts/merge-gate/).

Each phase runs inside an isolated [per-issue worktree](/concepts/worktree-isolation/), so parallel pipelines on different issues never collide. The run is resumable: `--resume` continues from the persisted `current_phase`, and `--from <phase>` starts at a specific phase. `--silent` collapses status notifications to terse one-liners for unattended runs.

## Where it fits

`/jkz:pipeline` is the orchestrated superset of the individual phase commands (`/jkz:plan`, `/jkz:build`, `/jkz:review`, `/jkz:qa`). Use those when you want to drive a single phase by hand; use `/jkz:pipeline` when you want the whole thing to run with three checkpoints. See [How jkz works](/get-started/how-jkz-works/) for the phases in full context.
