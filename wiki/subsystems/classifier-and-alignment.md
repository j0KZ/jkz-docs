---
title: Classifier & Alignment Validator
description: The two entry gatekeepers that decide how an issue is handled before any agent deliberates — the complexity classifier that routes it, and the alignment validator that checks the issue body still matches what the user actually asked for.
---

Two checks run at the very front of the system, before a single agent starts deliberating. They answer different questions about the same incoming issue:

- **How much pipeline does this deserve?** — the [complexity classifier](#issue-complexity-classifier) routes the issue to `trivial`, `quick`, or `standard`.
- **Does the issue body still say what the user asked for?** — the [alignment validator](#issue-alignment-validator) compares the source (a conversation, a brief, or raw input) against the issue body the pipeline will consume, and repairs drift before it propagates.

Both are deliberately defensive: a failure in either one falls back to a safe default rather than blocking the work. They steer and correct, but they never stop the user from getting in.

## Issue complexity classifier

`scripts/classify-issue.js` reads a GitHub issue and decides how much process it warrants. A typo does not need an Architect; a multi-system refactor should not skip planning. The classifier makes that call up front so the routing happens before any model starts working, not halfway through.

### Hybrid by design

The classifier is not a pure LLM call. It combines deterministic signal extraction with a Haiku judgment, and keeps a deterministic scorer in reserve:

- **Signals first.** A deterministic pass extracts ground truth from the issue text: the files mentioned and how many layers they span (`scripts`, `agents`, `docs`, `config`, `code`), whether design or compliance keywords appear, whether the body contains a code block, and how many Acceptance Criteria items it lists. These are facts, not opinions.
- **Haiku decides.** Those signals are handed to Haiku as verified context alongside the full issue body, and the model returns the classification with one sentence of reasoning. The model is configurable via `JKZ_CLASSIFY_MODEL`.
- **Deterministic fallback.** If the LLM is unavailable, a scoring heuristic over the same signals produces a verdict anyway. Design keywords and a layer span of three or more weigh toward `standard`; a present code block weighs toward something simpler; four or more Acceptance Criteria items nudge the score up. The classifier never fails closed.

### What it returns

A single JSON object written to stdout:

| Field | Values |
|-------|--------|
| `complexity` | `trivial` · `quick` · `standard` |
| `confidence` | `high` · `medium` · `low` |
| `recommended_pipeline` | the route to take (`trivial`, `quick`, or `pipeline`) |
| `reasoning` | one sentence on why this tier |
| `signals` | the deterministic facts the decision was built on |

### How the verdict routes the work

| Complexity | Route |
|------------|-------|
| `trivial` | Handle it directly in chat — no pipeline. |
| `quick` | [`/jkz:quick`](/commands/quick/) — Builder + Judge, no plan or QA. |
| `standard` | The full [pipeline](/concepts/pipeline/), planning first. |

The result is cached as a `complexity:*` label on the issue, so the same answer is reused rather than recomputed every time the issue is touched. When confidence is anything below `high`, the recommendation is to read the referenced files before committing to a route — the classifier flags its own uncertainty rather than hiding it.

The classifier is also documented from the agent angle on the [Classifier](/agents/classifier/) page; this section covers it as a subsystem.

## Issue alignment validator

`scripts/validate-issue-alignment.js` guards against a subtler failure: the issue body the pipeline reads slowly drifting away from what the user actually asked for. A long planning conversation gets distilled into a brief, the brief becomes an issue body, and at each hop a constraint can get dropped or an entity quietly renamed. The validator runs adversarial checkpoints at those hops and repairs the drift in place.

### Three checkpoints

| Checkpoint | Where it runs | Compares |
|------------|---------------|----------|
| `conversation_vs_brief` | `/jkz:start`, after the brief is built | conversation → brief |
| `brief_vs_body` | `/jkz:start`, after the issue is created | brief → issue body |
| `input_vs_body` | `/jkz:issue` | raw input → issue body |

### How a checkpoint works

Each checkpoint runs the same adversarial pipeline over a *source* and a *target*:

1. **Extract** (Sonnet, with extended thinking) — pull entities and constraints out of the source text, and entities out of the target.
2. **Challenge** (Opus) — an adversarial pass over the Sonnet extraction, catching entities and constraints the first pass missed. The challenger's findings are merged back into the source extraction.
3. **Compare** — a deterministic entity diff plus a semantic constraint check. The constraint check only calls Sonnet for constraints marked `weight: high`; lower-weight items are recorded as warnings, not gaps. This keeps the gate focused on what matters.
4. **Regenerate** — if there are gaps, regenerate the target (brief or body) to close them.

### The triple gate on regeneration

A regenerated body is only accepted if it passes three independent checks — otherwise the original (v1) is kept untouched:

1. **Length sanity** — the new version must be at least 70% the length of the original (`v2.length >= v1.length * 0.7`), so a regeneration cannot silently truncate the issue.
2. **Hash sanity** — `sha256(v1) !== sha256(v2)`, so an "accepted" regeneration that changed nothing is rejected.
3. **Entity diff** — every entity in the regenerated text must already be present in the source. This is the anti-hallucination gate: the regenerator may close gaps, but it may not invent new entities. A failure here returns `hallucinated_entities` and the original is preserved.

### Outcomes

| Outcome | Meaning | Notification |
|---------|---------|--------------|
| `aligned` | No gaps detected | silent |
| `regenerated` | Gaps closed, the triple gate accepted v2 | warn |
| `regen_suspicious` | Gaps detected but the triple gate rejected v2 (kept v1) | warn |
| `validator_error` | A runtime error in any component | critical |
| `tier_bypass` | `--tier` was `trivial` or `quick` | silent |
| `disabled` | `JKZ_ALIGNMENT_DISABLE=1` | silent |
| `source_unavailable` | The required source file was missing at pre-check | silent |

### Fail-open by contract

The validator never blocks the pipeline by default. Every error path — a missing component, a `gh` failure, an unhandled exception at the top level — resolves to exit 0, and the pipeline carries on with the body it already has. The opt-out for the conversation-persistence path (`JKZ_ALIGNMENT_DISABLE_CONVERSATION_PERSIST=1`) is the expected reason a `source_unavailable` outcome appears: the conversation transcript was deliberately not persisted, so the first checkpoint has nothing to read.

When you want the opposite — a hard gate — `JKZ_ALIGNMENT_REQUIRED=1` flips only the failure paths to fail-closed: `validator_error` and unhandled top-level exceptions exit 1. Every other outcome (including `aligned`, `regenerated`, and `regen_suspicious`) still exits 0.

### Privacy and kill-switches

Notifications carry **hashes, counts, and durations only — never the raw source text**. A Telegram payload looks like `outcome=regenerated checkpoint=brief_vs_body issue=1587 entity_gaps=2 v1=a1b2c3… v2=d4e5f6… duration_ms=8200`, so source content never leaves the machine through the notification channel.

| Kill-switch | Effect |
|-------------|--------|
| `JKZ_ALIGNMENT_DISABLE=1` | Full rollback — every checkpoint returns `disabled` |
| `JKZ_ALIGNMENT_DISABLE_CONVERSATION_PERSIST=1` | Opt the conversation transcript out of persistence (PII opt-out) |
| `JKZ_ALIGNMENT_REQUIRED=1` | Fail-closed on error paths only |

### When alignment is skipped

The `trivial` and `quick` tiers bypass the validator automatically — there is nothing to gate when the issue routes around the full pipeline. Beyond that, a deliberate `--skip-alignment` exists for cases where the issue body is mechanically derived from a verifiable artifact (a scan output, an audit report, a CodeRabbit thread) that is cited inline in the body. The skip has to be earned per use: it is for bodies a reviewer can independently re-read from the cited source, not for free-form conversations redacted into an issue.

## How they fit together

The classifier runs first and decides the route. The alignment validator runs at the intake checkpoints and keeps the issue body honest — and notably, the validator *uses* the classifier's verdict: a `trivial` or `quick` tier short-circuits alignment entirely. Together they make sure that by the time an [Architect](/agents/architect/) or [Builder](/agents/builder/) starts working, the issue has both the right amount of process attached to it and a body that still reflects what the user asked for.
