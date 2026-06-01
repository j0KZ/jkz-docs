---
title: Cross-chat awareness
description: How jkz keeps several Claude Code sessions on the same project from colliding — issue ownership, the contested-issue stop, heartbeats, and session snapshots.
---

You will often have more than one Claude Code chat open on this project at once — one planning an issue, another fixing a PR, a third just exploring. They share a filesystem and a git repo, so without coordination two sessions could start the same issue, edit the same files, or delete each other's worktrees. Cross-chat awareness is the lightweight registry that stops that. The model is simple: **before a session touches an issue, it asks whether another session already owns it.**

## The chat registry

Every session writes a small record under `state/active-chats/` describing what it is working on. `chat-registry.js` manages those records:

| Command | What it does |
|---------|--------------|
| `register` | Adds this session to the registry (pid, branch, issue, description). |
| `heartbeat` | Refreshes this session's timestamp — and updates the issue/worktree it owns. |
| `check-issue --issue N` | Asks whether another session already owns issue `#N`. |
| `is-worktree-active --path P` | Tells cleanup whether a worktree is still in live use. |
| `list` | Shows all active sessions and their age. |
| `deregister` | Removes this session on shutdown. |

Records are written atomically (write-to-temp, then rename) so two sessions updating the registry at the same moment never corrupt it. A record goes **stale after five minutes** without a heartbeat — a session that crashed or was closed stops counting as active, and its issues and worktrees free up.

Session identity resolves in order: an explicit `--session` argument, then the `CLAUDE_SESSION_ID` environment variable, then an ancestor-PID lookup, then an unstable fallback. The practical upshot: keep `CLAUDE_SESSION_ID` set, because when it is unset the snapshot and ownership logic can key everything to `anonymous` and lose the per-chat distinction.

## The contested-issue stop

Before running a pipeline command on an issue, jkz checks ownership:

```bash
node scripts/chat-registry.js check-issue --issue <N> --session "$CLAUDE_SESSION_ID"
```

If that returns **exit code 1**, another chat is already working on issue `#N`. The rule is hard: **stop and warn the user — never edit on a contested issue.** The pipeline commands (`/jkz:plan`, `/jkz:build`, `/jkz:qa`, `/jkz:pipeline`, `/jkz:quick`) run this check automatically as they enter the issue worktree, so the protection is built in. A manual check is only needed for ad-hoc work outside the pipeline.

## File-conflict awareness

Ownership is per-issue, but caution is per-file. If the session-start banner shows other active chats, be deliberate about editing files the other session might also be touching. The registry tells you a collision is *possible*; judgment closes the gap. When in doubt, surface the potential conflict rather than racing.

## Heartbeats and worktree cleanup

The heartbeat does double duty. It keeps a session alive in the registry, and it is the signal the worktree cleanup consults before deleting anything. `is-worktree-active` is how `worktree.sh cleanup-merged` decides a merged worktree is still in use: a fresh heartbeat referencing that worktree path means "leave it alone." This is the link between the two concepts — cross-chat heartbeats are one of the safety rails that keep [worktree cleanup](/concepts/worktree-isolation/) from removing live work.

## Session snapshots

When you switch chats (or come back tomorrow), context should travel with you. Snapshots make that possible. They are stored per-chat in `state/session-snapshots/<session_id>.json` and capture more than git state: completed work, decisions made, and gotchas worth carrying forward.

- `/jkz:save` captures a rich snapshot of the current session.
- `/jkz:load` retrieves the most recent snapshot — including one left by *another* session — so a fresh chat can pick up where the last left off.
- `/jkz:quit` runs `/jkz:save` and then deregisters the session cleanly.

Orphan snapshots (more than 24 hours old with no active chat behind them) are cleaned up on session start, so the store does not grow without bound.

## What this is not

- **Not a lock manager.** The registry advises; it does not forcibly prevent a second session from editing. It gives you the information to avoid a collision, and the pipeline commands act on it — but the discipline of stopping on a contested issue is part of the contract.
- **Not durable across crashes by itself.** A five-minute stale window means a crashed session releases its claims automatically. That is a feature for recovery, but it means "owned" is a live signal, not a permanent reservation.

## Related

- [Worktree isolation](/concepts/worktree-isolation/) — the worktrees whose liveness heartbeats protect.
- [Merge gate](/concepts/merge-gate/) — the final human checkpoint that concurrent sessions all converge on.
- [How jkz works](/get-started/how-jkz-works/) — the pipeline these sessions are each running.
