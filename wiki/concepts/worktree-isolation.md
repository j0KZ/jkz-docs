---
title: Worktree isolation
description: Why every issue and every agent gets its own git worktree, the two-layer layout, the lifecycle from ensure to cleanup, and the safety rails that stop cleanup from eating live work.
---

jkz runs many things at once — several pipelines across several issues, and within a single pipeline several agents that all write code. If they shared one working tree they would clobber each other's branches, files, and `node_modules`. So jkz never lets them. Every issue gets its own git worktree, and every parallel-writing agent gets one too. Isolation is the default, not an optimization you turn on.

## Two layers of worktree

The system uses two distinct kinds of worktree, and keeping them straight is the key to understanding everything else on this page.

| Layer | Where | Lifetime | Created by | Branch |
|-------|-------|----------|------------|--------|
| **Issue worktree** | `../jkz-worktree-<N>` (sibling of the repo) | Long-lived — one per issue | `issue-worktree.js ensure` | `jkz/issue-<N>` |
| **Agent worktree** | `.claude/worktrees/agent-*` | Ephemeral — one per dispatch | Claude Code's Task tool (`isolation: "worktree"`) | `worktree-agent-<id>` |

An **issue worktree** is the desk a pipeline works at. It is created once when work on issue `#N` begins, lives as long as the issue is in flight, and is reused across the plan, build, review, and QA phases. The path convention is deterministic: a sibling directory named `jkz-worktree-<N>`, branched from `main`.

An **agent worktree** is scratch space. When Claude Code dispatches a subagent with `isolation: "worktree"` — the Builder and the Doctor, the roles that mutate files — it spins up a throwaway worktree under `.claude/worktrees/`, lets the agent work in it, and tears it down afterward. These are the reason a quick-mode PR often lands on a `worktree-agent-<id>` branch rather than `jkz/issue-<N>`.

## The lifecycle

A pipeline command does not just `cd` into a directory. It runs a precise sequence so the session itself moves into the isolated tree and back out again:

```text
issue-worktree.js ensure  →  EnterWorktree  →  ...work...  →  ExitWorktree(keep)  →  (optional) issue-worktree.js cleanup
```

`ensure` is **idempotent**: if the worktree already exists it is reused, if not it is created from the base branch. The same session then switches into it via `EnterWorktree` — no second Claude Code window required — does the phase's work, and switches back out with `ExitWorktree` keeping the tree in place for the next phase.

### The skip guard

The pipeline must not nest a worktree inside a worktree. Before entering, it checks two conditions and skips the worktree steps if either holds:

- The current git root is already a `jkz-worktree-*` directory (the pipeline is re-entering its own tree), or
- `JKZ_USE_CC_WORKTREES=1` (the default) **and** the git root path contains `/.claude/worktrees/` — meaning Claude Code has *already* isolated the session through Agent View or a Task dispatch.

The second case is the system deferring to Claude Code's own isolation rather than stacking a redundant jkz worktree on top. Set `JKZ_USE_CC_WORKTREES=0` to force jkz sibling worktrees in every context.

## Cleanup is conservative by design

With pipelines finishing all day, merged worktrees pile up. Cleanup exists — but it is built to never delete live work. `worktree.sh cleanup-merged` is **dry-run by default**; nothing is removed until you pass `--apply`.

Even with `--apply`, the cleanup refuses any worktree that is:

- jkz-locked,
- carrying uncommitted changes, or
- referenced by a fresh chat-registry heartbeat (another session is using it).

And what it does remove, it does not destroy. Deleted worktrees are **moved to `state/worktree-trash/`**, not `rm -rf`'d. They stay registered as git worktrees on a detached HEAD, so moving the directory back restores them. The kill-switch `JKZ_WORKTREE_CLEANUP_DISABLE=1` makes cleanup a no-op even with `--apply`.

A second sweep handles the harder case: a worktree left **locked** by a pipeline that never finished. The stale-lock sweep recovers locked worktrees whose owning issue has been *closed* for at least 24 hours, and it confirms across two monitoring cycles before acting. Its safety is tri-state: only an explicit "not active" signal from the chat registry counts as safe to unlock — both "active" and "lookup failed" fail safe and leave the lock alone. Kill-switch: `JKZ_STALE_LOCK_SWEEP_DISABLE=1`.

## What this buys you

- **Parallelism without collisions.** Two issues build at the same time on separate branches in separate directories. Within a build, the Builder and Doctor never fight over the same files.
- **A clean blast radius.** A failed or abandoned attempt is one directory. Trash it; the rest of the project is untouched.
- **Recoverability over destruction.** The cleanup path prefers `mv` to `rm` precisely because an over-eager delete is the one mistake you cannot undo.

## What this is not

- **Not free at scale.** Worktrees share the repo's `node_modules` by symlink, but they still accumulate. Past hundreds of stale worktrees git contention shows up — which is exactly why the cleanup sweeps exist.
- **Not a place to hand-edit.** You drive the pipeline; the pipeline drives the worktree. Manually invoking the isolation gate or editing inside an agent worktree fights the lifecycle rather than using it.

## Related

- [Cross-chat awareness](/concepts/cross-chat/) — how the chat registry decides a worktree is "active" and which session owns an issue.
- [Merge gate](/concepts/merge-gate/) — what happens to the branch after the worktree's PR is ready.
- [How jkz works](/get-started/how-jkz-works/) — where worktree isolation sits in the full pipeline.
