---
title: Hooks
description: jkz's hooks extend the Claude Code lifecycle with two distinct families — guard hooks that block dangerous actions before they run, and lifecycle hooks that react to session events for state-keeping and observability. How they are wired, why they fail open, and what the hook server does.
---

Claude Code fires events throughout a session: before a tool runs, after it finishes, when a session starts or ends, when the conversation is about to be compacted. jkz attaches small scripts — **hooks** — to those events. They are fast, deterministic, and mostly invisible until something needs to be stopped or recorded.

Two families do very different jobs, and the line between them is the key to understanding the system:

- **Guard hooks** run *before* a tool executes (`PreToolUse`). They can **block** an action — refuse a destructive shell command, a credential read, an edit outside the active worktree. A guard is the only kind of hook that can say "no."
- **Lifecycle hooks** run *around* session and tool events (`SessionStart`, `SessionEnd`, `PreCompact`, `Stop`, `SubagentStop`, and friends). They never block; they keep state in sync, snapshot context, and feed observability. A lifecycle hook only ever observes and reacts.

## The fail-open contract

Every jkz hook follows one non-negotiable rule: **a hook must never crash the session.** Claude Code treats a `PreToolUse` hook that exits with code `1` (or any unexpected non-zero) as a signal to retry — which produces an infinite retry loop. So the contract is strict:

- **Exit `2`** — block the action. This is the *only* way to deny.
- **Exit `0`** — allow. This is the default for success *and* for every error.

Bash guards open with `trap 'exit 0' ERR`: if anything unexpected happens — malformed JSON, a missing dependency, a parser crash — the guard fails *open* and lets the action through. The safety net is downstream: the Judge and Inspector review every change before merge, so a guard that bails out never silently corrupts the pipeline.

The Node dispatcher [`hooks/hook-runner.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/hooks/hook-runner.js) enforces this mapping centrally. It spawns the real hook with the resolved dual-root environment (`JKZ_HOME`, `JKZ_TARGET_PROJECT`, `JKZ_STATE_DIR`) and then collapses the child's exit code: child exit `2` propagates as `2` (block); *everything else* becomes `0` (allow). It also rejects any hook name containing `/`, `\`, or `..` to prevent path traversal.

```text
PreToolUse event
  → hook-runner.js (or run-from-git-root.sh)
    → spawn guard with dual-root env
      → guard exits 2  → BLOCK the tool call
      → guard exits 0  → ALLOW (success)
      → guard errors   → ALLOW (fail-open via ERR trap)
```

## Guard hooks

Guards are matched to specific tools. The same guard can be attached to several tools, and several guards can stack on one tool — they run in order, and the first `exit 2` wins.

| Guard | Tools matched | What it blocks |
|-------|---------------|----------------|
| [`guard-destructive.sh`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/hooks/guard-destructive.sh) | `Bash` | Commands that could destroy work — force pushes, history rewrites, mass deletions — gated by the session's autonomy level. |
| [`guard-credentials.sh`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/hooks/guard-credentials.sh) | `Bash`, `Read`, `Edit`, `Write` | Any access (read, write, edit, execute) to credential paths. Zero-access model: it blocks outright, with no confirmation prompt. |
| [`guard-injection.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/hooks/guard-injection.js) | `Edit`, `Write`, `MultiEdit` | Prompt-injection payloads written into files — zero-width characters, RTL/LTR overrides, ANSI escape sequences in the new content. |
| [`guard-velocity.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/hooks/guard-velocity.js) | `Bash` | Runaway agents: rate-limits Bash calls within a sliding window. Disabled by default (`JKZ_VELOCITY_LIMIT` is unset → `Infinity`). |
| [`guard-worktree.sh`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/hooks/guard-worktree.sh) | `Edit`, `Write`, `MultiEdit` | Edits to protected pipeline infrastructure (`scripts/`, `hooks/`, `agents/`, `mcp/`, `.claude/`) from outside the active worktree during a build. |
| [`guard-issue-create.sh`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/hooks/guard-issue-create.sh) | `Bash` | Raw `gh issue create` against this repo, so every issue goes through the `issue-create.js` pipeline (label + type + complexity + alignment). |

Two guards have escape hatches for emergencies: `JKZ_ISSUE_GUARD_DISABLE=1` skips the issue-create guard, and the velocity guard stays inert unless `JKZ_VELOCITY_LIMIT` is set. Guards intentionally do *not* try to catch every bypass — a `Bash` `echo > file` can sidestep `guard-worktree.sh`. That is by design: guards stop the obvious foot-guns cheaply, and the adversarial review layer (Judge / Inspector) catches what slips through.

## Lifecycle hooks

Lifecycle hooks fire on session and tool events. None of them can block; they exist to keep jkz's state and observability coherent across a session's life.

| Event | Hook | Role |
|-------|------|------|
| `SessionStart` | [`on-session-start.sh`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/hooks/on-session-start.sh) | Interactive init: prerequisite checks, pipeline-state GC, worktree summary, vault/memory health, git-hook install. |
| `SessionEnd` | [`on-session-end.sh`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/hooks/on-session-end.sh) | Cleanup and warnings about active worktrees / in-progress builds; prunes old snapshots. |
| `InstructionsLoaded` | `on-instructions-loaded.js` | Injects active-pipeline context as a `system-reminder` when `CLAUDE.md`/rules load. |
| `PreCompact` | [`on-pre-compact.sh`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/hooks/on-pre-compact.sh) | Snapshots `STATE.json` so an active pipeline can be recovered after the conversation is compacted. |
| `Stop` | `on-stop-context-check.js`, `on-stop-message-counter.js`, `memory-sync.py` | Context-budget check, message accounting, and memory sync when a turn ends. |
| `StopFailure` | [`on-stop-failure.sh`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/hooks/on-stop-failure.sh) | Records unrecoverable errors and infers whether the failure happened inside a subagent. |
| `SubagentStart` / `SubagentStop` | `on-subagent-start.sh`, `on-subagent-stop.sh` | Log Task-tool agent lifecycle to `state/subagent-log.jsonl` (and LangFuse). |
| `PostToolUseFailure` | `on-tool-failure.sh` | Appends failed tool calls to `state/tool-errors.jsonl`. |
| `Notification` | `on-notification.sh`, `on-notification-sound.sh` | Routes notifications (Telegram); plays a sound on idle/permission prompts. |
| `PostToolUse` | `context-monitor.js`, `post-crlf-fix.js`, `post-wrapper-validate.js`, `step-audit.js`, `post-pr-capture.js`, `post-task-token-track.js`, `post-memory-audit.js` | After-the-fact bookkeeping: context monitoring, CRLF normalization, wrapper-output validation, step auditing, PR-number capture, token tracking, memory audit. |

### The session-start fast path

`on-session-start.sh` does roughly 20 seconds of interactive work — fine for a human starting a session, wasteful for the headless `claude --print` invocations that jkz scripts spawn constantly. It short-circuits those: when `CLAUDE_CODE_ENTRYPOINT=sdk-cli` (the value Claude Code sets for non-interactive `--print` runs), the hook runs only three essential steps (environment validation, expired-lock release, idempotent git-hook install) then exits before the banner. Detection is whitelist-only (only the exact value `sdk-cli` triggers it), so the default interactive path is unchanged. Kill-switch: `JKZ_SESSION_FASTPATH_DISABLE=1` forces the full path.

### The CRLF safety net

`post-crlf-fix.js` strips carriage returns from `.sh` files after a Write/Edit. Newer Claude Code versions no longer inject CRLF, but the hook stays as defense in depth: it is a 15-line no-op when no `\r` is present, and it still protects plugin-mode installs running on older CLI versions where the Edit tool may differ.

## The hook server

Several lifecycle hooks need to *record* events without slowing the session down. They post to [`hooks/hook-server.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/hooks/hook-server.js) — a small local HTTP server for observability. It routes `POST /hooks/event` by `event_type`:

- `subagent_stop` → append to `state/subagent-log.jsonl` + LangFuse trace
- `notification` → spawn `notify.sh` (skips idle notifications)
- `tool_failure` → append to `state/tool-errors.jsonl`
- `stop_failure` → append to `state/subagent-log.jsonl` with StopFailure context

The server **always returns HTTP 200** — it is observability-only and fail-open. On startup it writes its port to `state/hook-server.port` and its PID to `state/hook-server.pid`, and deletes both on exit. Hooks reach it through `hook-server-client.sh`'s `post_hook_event`, which reads the port file and `curl`s the event with a 2-second timeout; if the server is unreachable, the helper simply returns `0`.

Startup is guarded by [`hook-server-lock.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/hooks/hook-server-lock.js), a cross-platform `mkdir`-based atomic lock that is held until the server has actually written its port file. That closes the TOCTOU race where two sessions would otherwise both try to start a server: the lock proves readiness before it is released, so only one server binds a port.

## How hooks are registered

There are two registration surfaces, and they serve different runtimes:

- **[`.claude/settings.json`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/.claude/settings.json)** is the live Claude Code configuration for this repo. Each entry runs through `run-from-git-root.sh`, which resolves the git root and the dual-root environment before invoking the hook. This is the authoritative wiring — every guard and lifecycle hook above is listed here, grouped by event and tool matcher.
- **[`hooks/hooks.json`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/hooks/hooks.json)** is the plugin-mode manifest. When jkz is installed as a plugin in another project, this compact manifest registers the core hooks through `hook-runner.js`. It is a curated subset of the full `settings.json` wiring.

Both paths converge on the same fail-open contract and the same dual-root resolution, so a hook behaves identically whether jkz is the host repo or an installed plugin.

## Related

- [Worktree isolation](/concepts/worktree-isolation/) — what `guard-worktree.sh` protects, and why edits are scoped to the active worktree during a build.
- [Cross-chat awareness](/concepts/cross-chat/) — how `on-session-start.sh` and `on-session-end.sh` keep multiple sessions from colliding.
- [Context management](/concepts/context-management/) — how `on-pre-compact.sh` and the `Stop` hooks preserve state across compaction.
- [Pipeline](/concepts/pipeline/) — the BUILD → REVIEW → QA flow whose adversarial review layer is the safety net behind every fail-open guard.
