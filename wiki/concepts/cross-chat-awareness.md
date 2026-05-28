---
title: Cross-chat awareness
description: How jkz keeps multiple Claude Code sessions from colliding on the same project — issue ownership, the contested-issue stop, the heartbeat registry, and session snapshots that hand off context between chats.
---

You can have several Claude Code chats open on the same jkz project at once — one driving a pipeline, one doing an ad-hoc fix, one just reading. That is useful, and it is also a hazard: two sessions editing the same issue, or cleaning up a worktree the other is still using, would corrupt each other's work. jkz coordinates them through a small, file-based **chat registry** and a simple rule — *check before you act*.

## The registry

Every active session writes a heartbeat file under `state/active-chats/<session_id>.json` recording its branch, the issue it is working on, a human description, and the worktree path it owns. The files are written atomically (write-temp-then-rename) so a half-written entry is never read as truth.

A session's identity is resolved in order: an explicit `--session` argument, then the `CLAUDE_SESSION_ID` environment variable, then a best-effort walk up the process tree to match an ancestor PID against a registered entry, and finally an unstable `fallback-<ppid>`.

:::note[Set your session id]
Token attribution and freshness checks both key off the session id. When `CLAUDE_SESSION_ID` is unset, entries collapse onto a shared `anonymous`/`fallback` key, and cross-chat detection becomes unreliable. Export it so each chat is distinct.
:::

Entries expire. A heartbeat is **stale** once it is older than five minutes *and* its recorded PID is no longer alive — both conditions, so a slow-but-live session is never evicted. Stale entries are pruned on the next registry operation, so a crashed chat releases its claims on its own.

## Issue ownership and the contested-issue stop

The core rule: **before starting pipeline work on an issue, check whether another chat already owns it.**

```bash
node "$JKZ_HOME/scripts/chat-registry.js" check-issue --issue <N> --session "$CLAUDE_SESSION_ID"
```

`check-issue` looks for any *other* session whose registered issue equals `<N>`:

- **Exit 0** — no other owner. Proceed.
- **Exit 1** — another chat owns it. The pipeline **stops** and warns you, naming the owning session and its branch. Never edit a contested issue.

The pipeline commands (`/jkz:plan`, `/jkz:build`, `/jkz:qa`, `/jkz:pipeline`, `/jkz:quick`) run this check automatically when they enter the issue worktree. You only need to run it by hand for ad-hoc work *outside* the pipeline. When you start on a new issue or switch tasks, update your claim:

```bash
node "$JKZ_HOME/scripts/chat-registry.js" heartbeat --session "$CLAUDE_SESSION_ID" --issue <N> --desc "working on X"
```

## Protecting worktrees across sessions

The same registry is what makes worktree cleanup safe across chats. Before the batch sweep removes a [worktree](/concepts/worktree-isolation/), it asks the registry whether any live session still references that path:

```bash
node "$JKZ_HOME/scripts/chat-registry.js" is-worktree-active --path <path>
```

This answer is **tri-state**, and callers must respect all three:

| Exit | Meaning | Cleanup action |
|------|---------|----------------|
| `0` | A fresh heartbeat references the path | Active — do **not** delete |
| `1` | No fresh entry references it | Safe to clean |
| `2` | Lookup error (registry unavailable, bad args) | Fail-safe — treat as active, refuse to delete |

"Fresh" means the owning entry's heartbeat is within `JKZ_WORKTREE_ACTIVE_WINDOW_MIN` minutes (default 30). The deliberate asymmetry — only a definitive *no* permits deletion — is what keeps one chat from deleting a worktree another chat is mid-edit on.

## File-conflict awareness

Beyond issue ownership, the session-start banner lists other active chats. If another session is live when you begin, be deliberate about editing files it might also be touching; when in doubt, surface the potential conflict rather than racing.

## Handing off context between chats

Sessions are not just kept apart — they can pass work to one another. Each chat snapshots its context to `state/session-snapshots/<session_id>.json`:

- **`/jkz:save`** captures the reasoning context — completed work, decisions, gotchas — alongside Git state and pipeline status.
- **`/jkz:load`** retrieves the most recent snapshot, including one written by a *different* session, so a new chat can pick up where another left off.
- **`/jkz:quit`** saves first, then deregisters the chat from the active registry for an orderly shutdown.

Orphan snapshots — older than 24h with no live chat — are cleaned on session start.

## Why this matters

Cross-chat awareness is the coordination layer beneath jkz's parallelism. [Worktree isolation](/concepts/worktree-isolation/) gives each issue its own files; the registry decides *who* owns those files and *when* it is safe to reclaim them; and snapshots let a fresh session inherit the thread of work. Together they let you run many chats against one project without any of them quietly overwriting another — the same discipline that keeps the [Merge gate](/concepts/merge-gate/) the only thing standing between a branch and `main`.
