---
title: Memory
description: How jkz remembers. Three layers — file-based auto-memory that survives across sessions, per-agent notebooks, and a SQLite pattern-learning store — plus the recall and promotion flow that decides what gets carried forward, and the subagents that keep it honest.
---

A multi-agent pipeline that forgets everything between runs repeats its mistakes forever. jkz remembers on three independent layers, each tuned to a different shape of knowledge:

- **File-based auto-memory** — durable facts about *you* and *this project*, written as plain Markdown and loaded into every session.
- **Agent-memory** — small per-role notebooks where individual agents (Builder, Architect, …) record gotchas they hit on the job.
- **`memory.db`** — a SQLite store that learns *patterns* from the pipeline's own deliberations and re-injects them into future prompts, with a feedback loop that rewards what works and penalises what produces noise.

A fourth, smaller piece — `memory-versions.js` — gives any of these a versioned audit trail. And two subagents, the **memory-auditor** and the **signal-discoverer**, keep the file-based layer accurate over time.

The layers don't talk to each other. Each answers a different question: *who is the user and what is this project* (file-based), *what did this agent learn last time* (agent-memory), and *which review patterns actually hold up* (`memory.db`).

## File-based auto-memory

This is the layer you can read with `cat`. It lives in a per-project memory directory, keyed off the project's absolute path with separators normalised to dashes — so `/home/user/my_repo` resolves to a directory ending in `-home-user-my-repo/memory/`. Inside are two kinds of file:

- **`MEMORY.md`** — a one-line-per-fact index. It is loaded into context at the start of every session, so it must stay terse. Each line is a clickable pointer: `- [Title](file.md) — one-line hook`.
- **Topic files** — one Markdown file per fact, carrying the detail. `MEMORY.md` never holds the content itself, only the pointer.

Each topic file opens with YAML frontmatter that classifies the fact by `type`:

| `type` | What it holds |
|--------|---------------|
| `user` | Who the user is — role, expertise, standing preferences. |
| `feedback` | Guidance on *how to work* — corrections and confirmed approaches, with the reason why. |
| `project` | Ongoing work, goals, or constraints not derivable from the code or git history. |
| `reference` | Pointers to external resources — dashboards, tickets, URLs. |

The body links related facts with `[[wiki-style]]` slugs, so the memory set forms a small graph rather than a flat list.

### What gets written — and what doesn't

The bar for creating a memory is deliberately high, because a noisy memory file costs context on every future session. A fact earns a file only when it is **recurrent** (useful beyond this one task), **not already documented** (absent from `CLAUDE.md`, the rules, or `docs/`), **non-obvious** (a fresh session couldn't infer it from the code), and **actionable** (it says *do X* or *avoid Y*). One-time fixes, restatements of existing rules, and session-specific decisions are explicitly out of scope.

### Recall and promotion

**Recall** is automatic and layered. Global preferences (`~/.claude/CLAUDE.md`), the project's own `CLAUDE.md`, and the working `MEMORY.md` index all load at session start; the heavier topic files are pulled in on demand when a fact becomes relevant. Recalled memories arrive inside `<system-reminder>` blocks — they are background context, not fresh instructions, and they reflect what was true *when written*, so anything they name (a file, a flag, a function) is verified against the live codebase before being acted on.

**Promotion** moves a fact up the hierarchy as its scope widens. A working-memory note that proves it belongs in the project's permanent rules can graduate into `CLAUDE.md` or a `.claude/rules/` file; conversely, a `MEMORY.md` that grows too long has its detail demoted into topic files to keep the index lean. The `memory-promote` skill scores a candidate against weighted criteria — documentation redundancy, whether it captures a reusable pattern, specificity, relevance, and uniqueness — and recommends *promote*, *keep*, or *archive*. The companion `memory-review` and `memory-status` skills surface stale entries (untouched for a long stretch), overlapping pairs, and promotion candidates so the set can be curated rather than left to rot.

## Agent-memory

Where file-based memory is about the user and the project, **agent-memory** is about an individual agent's craft. Each role gets its own notebook under [`.claude/agent-memory/`](https://github.com/j0KZ/jkz_Multi-Agent_System/tree/main/.claude/agent-memory) — for example `.claude/agent-memory/builder/` and `.claude/agent-memory/architect/`. The structure mirrors file-based memory: a local `MEMORY.md` index plus one topic file per fact.

These notes are operational lessons an agent hit while doing its job — the kind of thing that would otherwise be relearned every invocation. A Builder note might record how to recover from a detached HEAD in a shared repo, or that the wiki-generator enforces a per-file test-LOC budget. The notebook is scoped to that role: the Builder's lessons don't leak into the Architect's prompt unless something explicitly references them.

## `memory.db` — the pattern-learning store

The third layer is a SQLite database at [`state/memory.db`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/memory-store.js), managed by [`scripts/memory-store.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/memory-store.js) (~3,500 lines, schema version 22). It opens in WAL mode with a busy timeout for safe concurrent access, and degrades gracefully: if the native `better-sqlite3` binding isn't available, every query returns empty rather than crashing the pipeline.

It stores far more than file-based memory ever could:

- **`deliberations`** — every agent verdict and full response (Judge, Inspector, Sentinel, …), with the extracted verdict, summary, token count, and an optional embedding for similarity search.
- **`patterns`** — learned decision rules distilled from those deliberations. Each pattern carries a role, success and ignore counters, a lifecycle state, and per-project isolation so one repo's lessons don't bleed into another.
- **`fix_memory`** and **`experiment_journal`** — what the Doctor tried on a failing issue, which approaches failed, which succeeded, and across how many iterations.
- **`finding_signatures`** — a cross-pipeline fingerprint of recurring bugs, so the same finding can be tracked as it opens, gets fixed, or regresses.

### The pattern-learning loop

This is what makes `memory.db` more than a log. Patterns extracted from deliberations are **re-injected into future prompts**, and a feedback loop adjusts their standing based on real outcomes.

1. **Injection.** Before an agent runs, [`scripts/format-patterns.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/format-patterns.js) selects that role's top patterns by a decay-weighted score and formats them into the prompt under a strict token budget — roughly 800 tokens for adversarial roles (Auditor, Judge, Sentinel) and 500 for constructive ones. If everything fits, it includes it all; if not, it falls back to a pre-computed summary or greedy truncation, so the budget is never blown.

2. **Reinforcement.** After a verdict, [`scripts/feedback-loop.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/feedback-loop.js) reads the result. On a **PASS** backed by Level 1 or Level 2 evidence — actual execution output, or `file:line` citations, per the [Evidence Hierarchy](/concepts/evidence-hierarchy/) — it reinforces the patterns that informed the decision and draws *informed-by* edges between cross-role patterns. Reasoning-only verdicts don't qualify; the evidence gate keeps the loop grounded.

3. **Penalisation.** When a validator (Inspector, Sentinel, Lens) marks a finding as a false positive, the loop calls `increment-ignore` on the responsible pattern, with a heavier weight for validator roles. Patterns that keep generating noise sink in the ranking and eventually fall out of injection entirely.

Patterns also move through a **lifecycle** — `observed → candidate → verified → active → deprecated` — with transitions driven by how many times, and in how many distinct contexts, a pattern has proved itself. A brand-new observation has to earn its way to *active* before it carries real weight.

A representative slice of the CLI:

```bash
# Record a learned pattern for a role
node scripts/memory-store.js store-pattern --role judge --text "..." --delib-id <id>

# Retrieve the top patterns for a role (decay-ranked)
node scripts/memory-store.js query-patterns --role judge --limit 10

# Penalise a false-positive pattern
node scripts/memory-store.js increment-ignore --role inspector --text "..."

# Reward validated patterns after a PASS
node scripts/memory-store.js reinforce-patterns --role judge --ids 12,34
```

## Versioning — `memory-versions.js`

[`scripts/memory-versions.js`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/scripts/memory-versions.js) is a small standalone library (and CLI) that keeps a version history for individual memory entries — every change to a value is stored with a timestamp, so an entry can be inspected or rolled back. It writes to `~/.hermes/memory_versions.json` by default (overridable via `JKZ_MEMORY_VERSIONS_FILE`), keeps the last 10 versions per key (pruning the oldest beyond that), and writes atomically to stay safe under concurrent updates. A *restore* doesn't overwrite history — it appends a new version pointing back at the old value, so every rollback is itself auditable.

```bash
node scripts/memory-versions.js --action history --key <name>
node scripts/memory-versions.js --action restore --key <name> --version 3
```

It is built as a reusable component rather than a tightly-wired pipeline tool, so other systems (such as the Hermes agent) can adopt it independently.

## Keeping memory honest — the maintenance subagents

File-based memory decays if left alone: facts go stale as the code moves on, duplicates accumulate, and useful lessons from recent sessions never get written down. Two Opus subagents counter that, and the `extract-learnings` skill orchestrates them.

- **memory-auditor** ([`.claude/agents/memory-auditor.md`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/.claude/agents/memory-auditor.md)) validates existing entries against the *current* codebase and git history. It flags memories that are stale, contradicted by the code, redundant with another entry, or carrying a wrong date — and it requires concrete evidence (a Glob, Grep, or `git log` result) for every finding, so it never flags on a hunch.

- **signal-discoverer** ([`.claude/agents/signal-discoverer.md`](https://github.com/j0KZ/jkz_Multi-Agent_System/blob/main/.claude/agents/signal-discoverer.md)) works the other direction: it mines recent session history for knowledge worth persisting — user corrections, architectural decisions, recurring patterns, behavioural preferences — and proposes them as new memories, generalised into reusable principles rather than one-off incidents.

The **`extract-learnings`** skill ties them together into a consolidation pass: it locates the memory directory and reads the existing set, runs the auditor and the discoverer **in parallel**, deduplicates and ranks their combined output down to a handful of high-impact candidates, and presents them with diffs for approval before anything is written. Note that `agents/shared-refinement.md` is an internal shared prompt fragment used by these agents, not a standalone agent in its own right.

## How the layers fit together

| Layer | Backed by | Holds | Loaded |
|-------|-----------|-------|--------|
| File-based auto-memory | `memory/MEMORY.md` + topic files | User, feedback, project, reference facts | Index every session; topics on demand |
| Agent-memory | `.claude/agent-memory/<role>/` | Per-role operational lessons | When the agent runs |
| `memory.db` | `scripts/memory-store.js` (SQLite) | Deliberations, learned patterns, fix history | Patterns injected per-prompt, budget-controlled |
| Versioning | `scripts/memory-versions.js` | Version history of memory entries | On demand (CLI / library) |

Together they give the pipeline a working memory that spans timescales: what was true a moment ago (this run's deliberations), what an agent learned last week (its notebook), and what holds across the whole project's life (the curated file-based set).
