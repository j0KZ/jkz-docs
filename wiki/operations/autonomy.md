---
title: Autonomy & auto-improvement
description: jkz is autonomous where execution is mechanical and human-gated where judgement matters. How the autonomy dial works, which decisions always stay the owner's, how the system proposes its own work through proactive discovery and smart maintenance, and how it sharpens its own prompts over time.
---

jkz is built around a deliberate split: it is **autonomous in execution** and **human-gated at the boundaries**. Inside a pipeline run the agents plan, build, review, and fix without asking permission for every step — that is the whole point of the augmented-engineering model. But the moments that are expensive to get wrong — approving a plan, accepting a review, merging to `main` — stay the owner's call. This page maps where that line sits, how far the dial can be turned, and the three mechanisms that let the system reach *beyond* execution to discover and propose its own work without ever taking the final decision away from you.

## The autonomy dial

Two independent settings control how much the system does on its own. They compose: one governs which *commands* are allowed to run, the other governs whether the pipeline *waits* at its checkpoints.

### Guard levels — what may run

The [`hooks/guard-destructive.sh`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/hooks/guard-destructive.sh) `PreToolUse` hook enforces an autonomy profile set by `JKZ_AUTONOMY_LEVEL` in `.env`. It is a blocklist that fails closed: a blocked command exits non-zero with a machine-parseable `{"blocked":true,…}` line on stderr.

| Level | Blocks | When to use |
|-------|--------|-------------|
| `trusted` (default) | Clearly destructive ops only — force-push to `main`, `git reset --hard`, `rm -rf` outside an allowlist, `DROP`/`TRUNCATE`/unqualified `DELETE`, pipe-to-shell, `gh pr merge`, and merge-gate bypass attempts | Normal development |
| `standard` | Identical to `trusted` today (reserved for future per-project differentiation) | Reserved |
| `restricted` | Everything in `trusted`, **plus** any `git push`, all publishing (`npm publish`, `docker push`, …), and GitHub write operations (`gh issue edit`, `gh pr comment`, `gh api -X POST/PATCH/PUT/DELETE`) | Audit mode, fully autonomous agents |

The `rm -rf` allowlist — `node_modules`, `dist`, `build`, `__pycache__`, `.cache`, `jkz-worktree-*`, `*.pyc` — is always permitted regardless of level, so routine cleanup never trips the guard.

### Auto-approve — whether the pipeline waits

By default the pipeline pauses at its three human checkpoints and waits for an explicit approval (a Telegram reaction or a terminal input). Setting `JKZ_AUTO_APPROVE=true` makes those checkpoints approve themselves and fire an `auto_approved` notification, so a run proceeds end to end after a single invocation.

| Checkpoint | `false` (default) | `true` |
|------------|-------------------|--------|
| Plan | Waits for human approval | Auto-approves |
| Review | Waits for human approval | Auto-approves for all issue types — non-features **never** skip QA |
| QA | Waits for human approval | Auto-approves |
| **Merge** | **Human-only** | **Unchanged — the human still merges manually** |

The two settings are orthogonal: `JKZ_AUTONOMY_LEVEL` decides which commands the guard will run, `JKZ_AUTO_APPROVE` decides whether the checkpoints block. The one thing neither can change is the merge boundary.

## What stays the owner's decision

No combination of flags lets an agent merge to `main`. This is the hard floor of the autonomy model, and it is enforced *server-side* so that a prompt — however it is phrased, and even under `bypassPermissions` — cannot reach production on its own. The merge gate is four layers deep:

| Layer | Mechanism | Bypassable? |
|-------|-----------|-------------|
| `merge-gate.yml` | Sets the commit status to `pending` on every PR | No — server-side |
| `approve-merge.yml` | A `workflow_dispatch` that flips the status to `success`, gated by a `MERGE_PASSPHRASE` held in GitHub Secrets | No — Claude Code cannot read GitHub Secrets |
| `auto-revert.yml` | Detects any merge that lacks `merge-gate=success` and reverts it automatically (~30s) | No — server-side |
| `guard-destructive.sh` | Blocks `gh pr merge`, `gh workflow run approve-merge`, and status-mutating `gh api` calls | Yes, under `bypassPermissions` — which is exactly why layers 1–3 exist |

To merge, the owner runs `approve-merge.yml` with the passphrase from a terminal — outside Claude Code — and then merges. The system iterates internally up to three times per phase, but it never crosses this line. Everything else in this page is about helping the owner decide *what* to work on; this layer guarantees the owner alone decides *when it ships*.

## Proactive task discovery — the system suggests, the human acts

Execution is reactive by design: a pipeline starts when you point it at an issue. Proactive task discovery is the counterweight — it lets the system notice work that *should* be started and surface it, without starting anything itself.

[`scripts/task-discovery.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/task-discovery.js) runs every **30 minutes** (every third monitoring cycle) and scans GitHub issues, open PRs, and local pipeline state for four conditions:

- `jkz:ready` issues with no active pipeline — ready to start.
- Stale PRs open more than 24 hours — informational only.
- Blocked issues whose blocker may have resolved.
- Stale pipelines idle more than 2 hours — candidates to resume.

Each finding carries a suggested `action` (`pipeline`, `quick`, `resume`, or `null` for purely informational items) and is offered through a Telegram inline keyboard. The human taps to act; the system never auto-dispatches. The keyboard uses a `pendingCommands` indirection to stay under Telegram's 64-byte `callback_data` limit. This is the human-in-the-loop pattern in its purest form: **the system finds the work, the owner chooses whether to do it.**

## Smart maintenance — triage by reversibility

Where task discovery surfaces *known* work, smart maintenance hunts for *latent* problems — missing dependencies, stale references, lingering TODOs — and routes each finding by how safe it is to act on automatically.

The on-demand [`claude-maintenance.yml`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/.github/workflows/claude-maintenance.yml) workflow (dispatch only) classifies every finding against one heuristic: **trivial = a deterministic command with no design decision; everything else is complex.**

- **Trivial** findings (a missing dependency, an absent build artifact) are auto-fixed via a PR on a `maint/weekly-*` branch. The fix still flows through the merge gate — it lands in a PR, never directly on `main`.
- **Complex** findings (a stale reference, a TODO that implies a decision) become one issue per finding, each with its own impact analysis, so a human can decide on them individually.

Auto-fix PRs are opened with a fine-grained `MAINTENANCE_PAT` (rotated every 90 days) precisely so the merge gate and CI fire on them the same way they fire on human-authored PRs — the automation gets no shortcut around the gate.

## Sharpening itself — the pattern-learning feedback loop

Beyond discovering work, the system tunes *how it reasons*. Every deliberation feeds a learning loop that makes the next prompt slightly better calibrated.

Patterns extracted from agent deliberations are stored in SQLite via [`scripts/memory-store.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/memory-store.js) and re-injected into future prompts by [`scripts/format-patterns.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/format-patterns.js) under a strict token budget (800 tokens for adversarial roles, 500 for constructive ones). The loop closes through [`scripts/feedback-loop.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/feedback-loop.js):

- When a validator (Inspector, Curator, Lens) marks a finding a **false positive**, the corresponding adversarial pattern is penalised (`increment-ignore`), so a noisy heuristic gradually stops being injected.
- On a **PASS** verdict, the top contributing patterns are reinforced.

Contextual metadata (`--labels`, `--phase`) boosts patterns drawn from *similar* pipeline contexts, so a lesson learned on a security review surfaces preferentially on the next security review. The effect compounds quietly: the agents are not retrained, but the evidence they are handed each run is shaped by what proved useful — and what proved noisy — in the runs before.

## The auto-improvement story

The clearest demonstration of the model is that the pipeline has, in large part, **built itself**. The self-improvement roadmap in [`docs/roadmap-auto-improvement.md`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/docs/roadmap-auto-improvement.md) framed the gap directly: the pipeline executes work excellently but, left alone, *cannot discover work* — it waits to be pointed at an issue. The roadmap's job was to close that gap by layering monitoring and issue-creation capabilities on top, with the human still approving every proposal and every merge.

Each roadmap item was itself fed through the pipeline as an issue, and the tiers are now complete:

| Capability | Tier | What it added |
|------------|------|---------------|
| Agent issue proposals | 1 | Any FAIL verdict can emit a `jkz:propose-issue` marker; the command offers to create a deduplicated follow-up issue. |
| Post-merge workflow | 1 | A `post-merge.sh` that cleans merged worktrees and re-checks health. |
| Deliberation analytics | 2 | `/jkz:insights` over `state/deliberations/*` — agreement, timeline, token usage. |
| Issue decomposition | 2 | The Architect proposes a sub-issue split when a plan crosses complexity thresholds. |
| Continuous monitoring | 3 | A scheduled job that runs health checks on `main` and files `jkz:regression` issues. |
| Cross-issue dependency tracking | 3 | A state-tracked `blocked_by` / `blocks` graph with cycle detection. |
| Notifications + autonomous pipeline | 3 | The notification system and the reaction-driven `/jkz:pipeline` that chains all phases. |

The throughline is consistent with everything above: each capability widened what the system can *propose* — work to start, regressions to fix, splits to consider — while the decisions that matter stayed with the owner. The pipeline got better at finding its own work; it never got the power to ship it unattended.

## Related

- [SLOs & monitoring](/operations/slos-and-monitoring/) — the ten-minute monitoring loop whose cycle counter drives proactive task discovery every third tick.
- [Pattern learning](/subsystems/pattern-learning/) — the deliberation-to-pattern store and feedback loop described here, in full.
- [Memory](/operations/memory/) — the broader memory system the pattern store sits inside.
- [Pipeline](/concepts/pipeline/) — the PLAN → BUILD → REVIEW → QA flow whose checkpoints the autonomy dial governs.
- [`/jkz:status`](/commands/status/) — surfaces pipeline state, SLO compliance, and the merge-gate status on demand.
