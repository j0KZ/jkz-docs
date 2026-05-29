---
title: Fallback
description: What happens when a model or a backend goes down — the automatic model retries and rate-limit cascade that recover silently, and the service-level failures that stop and ask a human to decide.
---

A multi-backend pipeline has more moving parts than a single-model one, and any of them can fail: a model name can 404, an endpoint can rate-limit you, a whole backend can go dark. jkz draws a sharp line between failures it can recover from on its own and failures that need a human in the loop. The first kind retries silently; the second kind stops and asks you.

## Model fallback (automatic)

The smallest failure is a model that simply is not there — a renamed or retired model name returns `404 / ModelNotFound`. The wrappers handle this without involving you: each role has a configured fallback model, and the wrapper retries against it.

- **Gemini:** `JKZ_GEMINI_MODEL` → `JKZ_GEMINI_MODEL_FALLBACK`
- **API (OpenAI-compatible):** `JKZ_API_MODEL` → `JKZ_API_MODEL_FALLBACK`, with a per-role override `JKZ_<ROLE>_MODEL_FALLBACK`

This is a straight swap of one model for another. Nothing about the pipeline's control flow changes — you get a verdict from the fallback model instead of the primary one.

## Rate-limit fallback (cascade)

A busier failure is rate limiting: `429 / RESOURCE_EXHAUSTED`. Here the wrapper first retries with exponential backoff, and only when that budget is exhausted does it escalate through a two-tier cascade. Each layer stamps the completion record with which path served the verdict, so you can always audit how an answer was produced.

### Tier 3 — an OpenAI-compatible provider

For validator roles, the first escalation is a different OpenAI-compatible endpoint. If one is configured for the role (or globally), the wrapper dispatches a single attempt there. On success the verdict is propagated verbatim and the run is marked as having used the API tier. On failure — or if no such endpoint is configured — it falls through to the next tier.

### Tier 4 — the in-session model

If tier 3 does not rescue the call, the wrapper hands the work back to the orchestrator's own model. The command detects the fallback signal, resolves which model to use, and re-runs the role's analysis in-session. This is the last automatic layer: it keeps the phase moving even when every external backend is throttled.

Throughout the cascade, two distinct facts are recorded and should not be confused:

- which **tier** fired (an external API endpoint, or the in-session model), and
- which **model** the in-session tier dispatched to.

The first tells you *which layer* recovered the call; the second tells you *what produced* the answer when the in-session tier was the one that did.

## Service fallback (manual)

The largest failures are not a single call going wrong — they are a whole backend being unavailable. These are not recovered silently, because the right response depends on judgment you have and the pipeline does not. The system notifies you and waits for your decision.

| Backend down | Behavior |
|--------------|----------|
| **Opus** (the creative roles) | The pipeline stops. No other agent writes code in its place. The system notifies you and waits. |
| **Adversarial backend** (Auditor, Judge, Sentinel) | Review and the security pass are skipped. The system notifies you; you decide whether to continue without them. |
| **Validator backend** (Curator, Inspector, Lens) | The validation frontend is skipped. The system notifies you; you decide. |
| **Claude Code** (the orchestrator) | Everything stops — it *is* the runtime that drives every other role. |

The pattern is deliberate. Recoverable failures (a missing model, a rate limit) are handled where they happen, invisibly. A backend outage is a quality-of-evidence question — running the pipeline without its adversarial reviewer is a real trade-off — so the system surfaces it and leaves the call to you rather than quietly degrading.

## See also

- [Pipeline](/concepts/pipeline/) — the phases the fallbacks protect
- [Evidence hierarchy](/concepts/evidence-hierarchy/) — why skipping a reviewer is a real trade-off
- [Merge gate](/concepts/merge-gate/) — the human checkpoint at the end of every run
