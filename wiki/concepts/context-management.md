---
title: Context management
description: How jkz keeps a long-running pipeline inside the context window — snapshotting state before a compaction, compressing oversized context sections, and smart-truncating wrapper output without losing the verdict.
---

A pipeline that runs for an hour across a dozen roles generates far more text than a context window can hold. jkz manages this on three fronts: it snapshots critical state *before* the conversation is compacted so nothing is lost, it compresses bulky context sections while protecting the parts that matter, and it truncates oversized model output intelligently rather than blindly cutting from the end. The common thread is that compaction is treated as expected, not exceptional — and the irreplaceable signals are guarded at every step.

## Snapshotting before compaction

Claude Code compacts a long conversation to stay within its window. The risk is that an active pipeline's state could be summarized away. jkz defends against this with a PreCompact hook: just before a compaction happens, it writes a JSON snapshot of the pipeline state to a timestamped file under `state/`, so an in-progress run can be recovered afterward.

```text
state/pre-compact-<timestamp>-<pid>.json
```

The snapshot captures the event and the full pipeline state at that moment. The same hook also nudges the session-memory record forward. These files are cleaned up automatically after about a week, so they accumulate during active work and disappear once they are no longer useful.

There is a deliberate contract for what survives a compaction. The things that are always preserved are the decision-critical ones: the approved plan, the current pipeline phase and iteration, active agent verdicts, any pending human-decision items, the git state, and the failure context for the current fix cycle. The things safe to drop are the bulky-but-recoverable ones: file contents already committed, intermediate search results, verbose tool output, and resolved review findings.

## Compressing context sections

Some context blocks are simply large — a long diff, an accumulated set of patterns. `compress-context.js` shrinks these, but it never compresses blindly. It recognizes the section structure of the context and protects the blocks that carry irreplaceable signal:

- `verdict-json` decisions
- TL;DR summaries
- Accumulated Patterns
- compact-plan and plan-digest blocks

Everything else is fair game for compression. When a section exceeds its threshold, the tool can offload the full content to disk (under `state/context-offload/`) and keep only a head excerpt inline, so the detail is still retrievable without sitting in the live window.

## Smart truncation of wrapper output

The external backends can return very large responses, and feeding all of it into the orchestrator's context would be wasteful. Wrapper stdout is therefore piped through `truncate-output.js`, which caps the size while preserving the parts a verdict actually depends on.

The size cap adapts to the situation:

| Mode | Default cap |
|------|-------------|
| Primary | 300 KB |
| Fallback model | 100 KB |
| Agent mode | 80 KB |

Any of these can be overridden with the `JKZ_MAX_OUTPUT_BYTES` environment variable (where `0` disables truncation entirely).

Two things make the truncation *smart* rather than crude. First, it extracts and re-inserts the protected blocks (the verdict, the compact-plan, the TL;DR, the Accumulated Patterns) so they survive even when the surrounding prose is cut. Second, when it does have to cut, it keeps a head *and* a tail rather than just lopping off the end, because the conclusion of a review is often as important as its opening. The head/tail split is role-aware: a security reviewer whose conclusions land at the end keeps more of its tail, while a role with front-loaded findings keeps more of its head.

One important exception: the full, untruncated output is always preserved where fidelity matters — the complete deliberation record and the PR comment receive the unabridged text. Truncation protects the *live context window*, not the audit trail.

## See also

- [Pipeline](/concepts/pipeline/) — the long-running flow this keeps inside the window
- [Signal format](/concepts/signal-format/) — the verdict blocks that truncation protects
- [Cross-chat](/concepts/cross-chat/) — recovering and sharing state across sessions
