---
title: Models & invocation
description: How jkz maps each role to a model and invokes it — the four model kinds, the create-challenge-confirm pattern they form, and the endpoint routing that decides which backend runs each role.
---

jkz is deliberately multi-backend. No single model writes the code, reviews it, and signs off on it — that would let one model's blind spots survive end to end. Instead each role is bound to a model chosen for the *kind* of work it does, and the roles are arranged so that one model's output is challenged by a second and confirmed by a third. This page describes that mapping and how each role is actually invoked at runtime. The failure side of the story — what happens when a model 404s or a backend goes dark — lives in [Fallback](/concepts/fallback/).

## Four kinds of model

Every role has a *kind* that determines both which model serves it and where it sits in a deliberation. The kind classification is centralized (`scripts/agent-kind.js`); the pipeline tracks the active kind in its state.

| Kind | Roles | Model | Invocation |
|------|-------|-------|------------|
| `creative` | Architect, Builder, Doctor, Analyst | Claude Opus | Task tool (`model: "opus"`) |
| `adversarial` | Auditor, Judge, Sentinel, Research-Auditor | External, configured per role (**required**) | `resolve-wrapper.sh` → endpoint |
| `validator` | Curator, Inspector, Lens, Research-Reviewer | External (default), local Gemini CLI fallback | `resolve-wrapper.sh` → endpoint or Gemini |
| `utility` | Librarian, Classifier | Claude Haiku | `node scripts/librarian.js`, `node scripts/classify-issue.js` |

The orchestrator is a special case: it has no kind, because the orchestrator *is* Claude Code itself — the runtime that drives every other role. (Analyst is exclusive to the [research pipeline](/commands/research/); it does not run in the development pipeline.)

## The create–challenge–confirm pattern

The kinds are not just a labelling scheme — they form a pipeline shape that repeats in every phase:

1. A **creative** model (Opus) produces the artifact — a plan, an implementation, a fix.
2. An **adversarial** model challenges it — actively trying to find what is wrong.
3. A **validator** model confirms — checking the result holds up.

Planning runs Architect → Auditor → Curator. Review runs Builder → Judge → Inspector. Using *different* model families for the create and challenge steps is the point: an adversarial reviewer that shares the author's training is far more likely to share its mistakes. The asymmetry between adversarial and validator backends (below) follows directly from this — the challenge step is load-bearing, so it is not allowed to silently disappear.

## How each kind is invoked

**Creative roles** run through the Task tool with `model: "opus"`. The prompt is the role's agent definition (`.claude/agents/<role>.md`) plus the task-specific context; Claude Code consumes the agent frontmatter (`effort`, `maxTurns`, `disallowedTools`).

**Adversarial and validator roles** run through a single entry point — `resolve-wrapper.sh`, invoked in the background via `node scripts/run.js`:

```bash
node scripts/run.js resolve-wrapper.sh \
  --role <role> --pr <number> --prompt "$PROMPT"
```

`resolve-wrapper.sh` does not run a model itself. It *routes* the role to the right backend wrapper based on configuration, then that wrapper calls the model and posts the result back to the PR.

**Utility roles** (Haiku) are called directly as Node scripts — the Librarian for fast internal queries, the Classifier for issue-complexity routing. They are not part of any deliberation.

## Endpoint routing

For every adversarial and validator role, `resolve-wrapper.sh` decides the backend by evaluating an endpoint cascade in order:

1. `JKZ_<ROLE>_ENDPOINT` — a per-role OpenAI-compatible endpoint → `api-wrapper.sh`
2. `JKZ_API_ENDPOINT` — a shared global endpoint → `api-wrapper.sh`
3. No endpoint configured — and here the two kinds diverge:
   - **Adversarial** roles (Auditor, Judge, Sentinel, Research-Auditor) **exit 4** with an explicit error. The environment variable is the source of truth; there is no silent CLI fallback. The challenge step must run against a real backend or the pipeline stops and tells you.
   - **Validator** roles (Curator, Inspector, Lens, Research-Reviewer) fall back to the local Gemini CLI (`gemini-wrapper.sh`). This is a backwards-compatibility path — the recommended setup gives every validator role its own `JKZ_<ROLE>_ENDPOINT` — for example an Ollama Cloud endpoint with model `glm-5.1:cloud`.

The model itself is chosen by a parallel cascade: `JKZ_<ROLE>_MODEL` → `JKZ_API_MODEL` → the CLI default. So endpoint and model are configured independently per role, and any role can be pointed at any OpenAI-compatible backend.

One opt-in overrides the whole cascade: setting `JKZ_<ROLE>_BACKEND=codex` short-circuits routing to the Codex CLI (`codex-wrapper.sh`) before the endpoint check runs — useful when an OAuth-authenticated CLI is a more practical credential path than an API key.

> Changing model versions or swapping a backend is a deliberate decision, never an incidental one. The configuration lives in `.env`; do not change it without explicit approval.

## Effort levels

Each role runs at an `effort` level matched to its job. The rule across the pipeline: **at least one agent per phase runs at `high`** — there is always a deep pass somewhere in every phase.

| Role | Effort |
|------|--------|
| Auditor, Research-Auditor | `high` (the adversarial anchor) |
| Architect | `medium` |
| Builder | `low` (a good plan does the heavy lifting) |
| Doctor | `low`, scaling to `high` on the final iteration or a wrong-approach signal |
| Others | `medium` |

## A note on the Judge

The Judge is the adversarial reviewer of the code-review phase. It always runs against its configured endpoint (`JKZ_JUDGE_ENDPOINT`), like any other adversarial role. An older `JKZ_JUDGE_MODE` switch that once selected the Judge's routing is **deprecated** and no longer consulted. The Judge is also distinct from the optional GitHub `@codex` review (`JKZ_CODEX_REVIEW_ENABLED`): that is a separate, PR-level bot review, independent of the adversarial-role routing described here.

## See also

- [Fallback](/concepts/fallback/) — what happens when a model 404s, a backend rate-limits, or a whole service goes down
- [Pipeline](/concepts/pipeline/) — the phases these roles deliberate within
- [Evidence hierarchy](/concepts/evidence-hierarchy/) — the standard the adversarial roles hold arguments to
