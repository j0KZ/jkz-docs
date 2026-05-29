---
title: State schema
description: What lives under state/ — the pipeline's runtime memory on disk. Pipeline JSON files and their formal contract with the UI server, plus the surrounding store of deliberations, locks, snapshots, circuit breakers, and SQLite databases that keep a run observable and recoverable.
---

Every jkz run leaves a trail on disk. That trail lives in one place — the `state/` directory — and it is the difference between a pipeline that can be observed, resumed, and audited and one that forgets the moment a process exits. `state/` is runtime-only and git-ignored: nothing in it is source code, and everything in it can be regenerated or discarded. But while a run is live, it is the single source of truth for *where each issue is*, *what each agent decided*, and *which resources are held*.

The store is not one format but several, each owned by a different part of the system. The most important — and the only one with a formal, validated contract — is the per-issue pipeline state.

## The pipeline state file

Pipeline state lives in `state/pipeline/<issue_number>.json`, one file per issue. Each file uses a nested wrapper: the issue's data sits under a numeric key matching the issue number, with a few bookkeeping fields as top-level siblings.

```json
{
  "<issue_number>": {
    "current_phase": "building",
    "active_agent": "builder",
    "active_agent_kind": "creative",
    "issue_type": "feature",
    "pr_number": "42",
    "started_at": "2026-04-10T12:48:21.988Z",
    "last_updated": "2026-04-10T13:06:54.627Z",
    "plan_iterations": "1",
    "review_fix_count": "0",
    "qa_fix_count": "0",
    "review_passed": "true",
    "qa_passed": "false",
    "complexity": "standard",
    "pipeline_run_id": "run-42-20260410124821-6b11c423",
    "prompt_rewrite_count": "0",
    "sub_issues": [43, 44],
    "steps": { "plan": { "architect": { "status": "completed" } } },
    "tokens": { "_runs": [] }
  },
  "lastActivity": "2026-04-10T13:06:54.627Z",
  "heartbeat_pid": 47281
}
```

A few characteristics are worth internalising, because they trip up anyone who reads these files expecting a flat object:

- The issue data is **nested under a numeric key**, not at the top level. Reading `current_phase` means going through `data["<N>"].current_phase`.
- All scalar pipeline fields are stored as **strings** — including `pr_number`, the iteration counts, and the booleans (`"true"` / `"false"`). Consumers coerce on read.
- `lastActivity` and `heartbeat_pid` are **top-level siblings**, not inside the issue object.
- `steps` and `tokens` are **opaque record objects** — they carry per-step status and token accounting but are not validated by the UI schema.
- **Unknown fields are preserved.** The schema uses passthrough, so a new field written by a future script survives a round-trip through an older reader.

`pr_number` deserves a special mention: it is the canonical authority for "which PR closes issue #N", and downstream consumers resolve it through a shared cascade that prefers an explicit argument, then an in-shell hint, then this field, before falling back to scanning open PRs.

## From disk to a typed view

The UI server does not consume the raw file. It runs it through `normalizePipelineState()`, which turns the string-heavy, loosely-typed on-disk shape into a typed internal interface. The coercion rules are deterministic:

| On-disk field | Normalized field | Type | Coercion |
|---|---|---|---|
| `current_phase` | `current_phase` | `string` | Default `"unknown"` |
| `active_agent` | `active_agent` | `string \| null` | Empty string → `null` |
| `issue_type` | `issue_type` | `string` | Default `"feature"` |
| `pr_number` | `pr_number` | `number \| null` | `parseInt()`, `NaN` → `null` |
| `started_at` | `started_at` | `string \| null` | Direct passthrough |
| `last_updated` / `lastActivity` | `last_updated` | `string \| null` | Prefers `last_updated`, falls back to `lastActivity` |
| `review_passed` + `qa_passed` | `verdict` | `"PASS" \| "FAIL" \| null` | Both `"true"` → PASS; either `"false"` → FAIL; else `null` |
| (not on disk) | `branch` | `null` | Reserved for future use |

`verdict` and `branch` are internal to the normalized view and are **not** exposed in the public `PipelineIssue` API — they are computed conveniences, not stored fields.

The contract is enforced with Zod schemas defined in `ui/server/schemas/pipeline.ts`:

| Schema | Purpose |
|---|---|
| `PipelineStateOnDiskSchema` | Validates the inner issue object (all fields optional, passthrough) |
| `PipelineFileSchema` | Parses the full file: extracts the numeric key, validates inner data, extracts `lastActivity` |
| `LiveSessionSchema` | Validates `state/live-session.json` (UI server owned) |
| `WatchListSchema` | Validates `state/watch-list.json` (UI server owned) |

## Who writes what

Ownership is strict, and it is what keeps concurrent chats and the UI from corrupting each other's view. The rule of thumb: pipeline scripts write pipeline state; the UI server writes its own session files and never touches pipeline state except to read it.

| File | Owner | Readers |
|---|---|---|
| `state/pipeline/<N>.json` | Pipeline scripts (`json-helper.js`, orchestrator) | UI server (read-only) |
| `state/live-session.json` | UI server | UI frontend (via API) |
| `state/watch-list.json` | UI server | UI frontend (via API) |

## The rest of the store

Pipeline state is the contract, but it is a small fraction of what `state/` holds. The surrounding directories are less formal — most are append-only logs or caches — but they are what make a run observable after the fact and recoverable after a crash.

- **`deliberations/`** — one JSON record per agent invocation, the durable transcript of every verdict. Each record carries `role`, `timestamp`, `status`, the agent's `response`, the `model` and `endpoint` that produced it, the `pr`/`issue`/`phase` it ran against, the `command` that triggered it, `duration_ms`, and a `tokens` accounting block. This is the layer that answers *what did the Judge actually say on iteration 2*.
- **`session-snapshots/`** — one file per chat session (`<session_id>.json`), capturing rich reasoning context — completed work, decisions, gotchas — alongside git state and pipeline status. `/jkz:save` writes them; `/jkz:load` retrieves the most recent from another session. When `CLAUDE_SESSION_ID` is unset, the snapshot is keyed `anonymous`.
- **`locks/`** — worktree and pipeline locks. A lock has a TTL (1800s by default) after which it is considered expired and reclaimable, which is how a crashed run stops blocking the issue it was holding.
- **`circuit/`** — one file per external service (`codex.json`, `gemini.json`, `api-ollama-com.json`, …) recording circuit-breaker state. An open circuit short-circuits calls to a service that has been failing; the breaker half-opens after a cooldown to test recovery.
- **`active-chats/` and `active-worktrees/`** — the cross-chat registry's view of which session owns which issue and worktree, so a second chat can refuse to edit a contested issue.

### The SQLite databases

Four `.db` files hold the structured, queryable state that does not fit a per-run JSON file:

| Database | Holds |
|---|---|
| `memory.db` | The pattern-learning store — patterns mined from deliberations, re-injected into future prompts, with a feedback loop that reinforces what works and penalises noise. By far the largest of the four. |
| `metrics.db` | Pipeline metrics used to evaluate SLOs (completion rate, fix iterations, durations). |
| `cr-history.db` | CodeRabbit review history, used to reconcile and de-duplicate findings across iterations. |
| `chat.db` | The chat registry backing cross-chat awareness — heartbeats, issue ownership, worktree paths. |

## Why it is shaped this way

The split is deliberate. The one piece other processes depend on — pipeline state — has a strict, versioned, passthrough-tolerant contract so the UI server can read it without breaking when the pipeline adds a field. Everything else is append-only logs and caches: cheap to write, safe to lose, and never on the critical path of a transition. A run can be killed at any point and the next session reconstructs *where it was* from the pipeline file and *what happened* from the deliberations, while locks and circuit state make sure a dead run stops holding resources it can no longer use.

When something in a run looks wrong, the [troubleshooting guide](/operations/troubleshooting/) is the companion to this page — it maps symptoms back to the files and scripts that own them.
