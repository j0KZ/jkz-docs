---
title: Merge gate
description: The four-layer, server-side enforcement that keeps merging to main a human-only act — why prompts alone are not enough, and how the passphrase checkpoint works.
---

The single hardest rule in jkz is also the simplest to state: **only a human merges to `main`.** The pipeline iterates on its own up to three times per phase, but it cannot reach `main` — you do that, and only you. This is not a guideline the agents are politely asked to follow. It is enforced in four layers, and three of them live on the server where no session can switch them off.

## Why prompts are not enough

A prompt that says "never merge" is a request, and a sufficiently determined or misconfigured agent can route around a request. This rule exists because past incidents reached production through agent self-merge. So the gate does not rely on the agent's good behavior. It relies on infrastructure the agent cannot reach: a commit status only a GitHub Secret can flip, and a workflow that reverts anything that slips through.

## The four layers

| Layer | Mechanism | Bypassable? |
|-------|-----------|-------------|
| `merge-gate.yml` | Sets the commit status to `pending` on every PR. | No — server-side |
| `approve-merge.yml` | A `workflow_dispatch` with a passphrase (`MERGE_PASSPHRASE`, a GitHub Secret) flips the status to `success`. | No — Claude Code cannot read GitHub Secrets |
| `auto-revert.yml` | Detects any merge lacking `merge-gate=success` and reverts it automatically (~30s). | No — server-side |
| `guard-destructive.sh` | Blocks `gh pr merge`, `gh workflow run approve-merge`, and direct `gh api .../statuses/` calls locally. | Yes, only under `bypassPermissions` — which is precisely why layers 1–3 exist |

The design is deliberately redundant. The local guard (`guard-destructive.sh`) is the friendly first line — it stops the obvious commands inside a session. But because a session run with `--permission-mode bypassPermissions` could disable that guard, the real guarantee is the three server-side layers. The PR sits at `pending` until the passphrase flips it; if something forces a merge anyway, `auto-revert.yml` undoes it within about half a minute. There is no single point you can disable to let an agent merge.

## The passphrase checkpoint

The only way to reach `success` is to run the approval workflow with the right passphrase — and the passphrase is a GitHub Secret, which Claude Code cannot read. That asymmetry is the whole mechanism: the agent can prepare everything up to the merge, but the act that authorizes it requires a value only you hold.

```bash
# 1. Approve — run this from the terminal, not from Claude Code
gh workflow run approve-merge.yml -f pr=<NUMBER> -f passphrase=<your-passphrase>

# 2. Merge from the PR button on GitHub, or:
gh pr merge <NUMBER>
```

`scripts/check-merge-gate.sh --pr <N>` queries the gate status for a PR by its head SHA, and that check is surfaced in `/jkz:status` so you can see at a glance whether a PR is still `pending` or has been approved.

## The CodeRabbit pre-flight gate

The merge gate decides *whether* a merge is authorized. A separate, earlier gate decides whether a PR is even allowed to reach the `jkz:approved` state in the first place. `cr-preflight-gate.sh` blocks the transition to `jkz:approved` while CodeRabbit review threads remain **unresolved without either a human reply or commit coverage**. Its exit codes are explicit:

| Exit | Meaning |
|------|---------|
| `0` | All CR threads have a reply or coverage — or there are no unresolved threads |
| `1` | Blocked — one or more unresolved threads with neither reply nor coverage |
| `2` | Fail-open — a GraphQL/API infra error; the caller continues with a `WARN` |
| `3` | Bad arguments |

The fail-open behavior on exit `2` is intentional: an infrastructure hiccup talking to GitHub should not wedge the pipeline, so the caller logs a warning and proceeds. The gate can be bypassed for genuine emergencies with `--force` or `JKZ_CR_GATE_DISABLE=1` — but that is an explicit, visible choice, not a default.

## What this is not

- **Not a code-quality check.** The merge gate does not read your diff. It enforces *who* merges, not *what* merges — review and QA are the quality gates upstream of it.
- **Not bypassable from inside a session.** The three server-side layers are the point. If a session could turn them off, they would not be a guarantee.
- **Not a substitute for the human checkpoints.** The plan approval and the two ambiguity gates are separate decisions. The merge gate is the last one, not the only one.

## Related

- [How jkz works](/get-started/how-jkz-works/) — where the merge gate sits relative to the plan and QA checkpoints.
- [Cross-chat awareness](/concepts/cross-chat/) — keeping concurrent sessions from racing each other toward the same PR.
- [Worktree isolation](/concepts/worktree-isolation/) — where the branch the gate guards is actually built.
