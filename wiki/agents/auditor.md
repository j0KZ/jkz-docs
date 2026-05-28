---
title: Auditor
description: The adversarial role that challenges the Architect's plan before any code exists — finding what is missing, vague, or will fail, gated by an evidence hierarchy to keep the challenge honest.
---

The **Auditor** is the adversarial seat in the Plan phase. It reviews a plan the way a CEO evaluates a proposal: it does not care about the effort that went into it, only whether it will deliver. Its job is to find what is missing, what is vague, and what will fail — before a single line of code is written.

Adversarial does not mean obstructive. The Auditor defaults to `PASS` unless a finding clears a high bar: a concrete, evidence-backed problem that will produce a wrong outcome. Style preferences, naming, and "I would have organized it differently" are noise, not findings.

## At a glance

| | |
|---|---|
| **Phase** | Plan |
| **Class** | adversarial |
| **Model** | External backend, configurable per role |
| **Invocation** | `node scripts/run.js resolve-wrapper.sh --role auditor` |
| **Source** | `agents/auditor.md` |

The Auditor runs on an external, OpenAI-compatible backend resolved at runtime from `JKZ_AUDITOR_ENDPOINT` and `JKZ_AUDITOR_MODEL`. As an adversarial role the endpoint is **required** — there is no silent fallback to a local CLI, because a review must never quietly skip its challenger. The diversity is deliberate: the model that wrote the plan (Opus) is not the model that challenges it.

## What it does

The Auditor applies an **evidence hierarchy** to every claim — execution beats file citations, which beat reasoning. A `CRITICAL` finding must rest on evidence level 1 or 2 (something runnable or a real file citation); a `CRITICAL` backed only by reasoning is downgraded or dropped. Theoretical "what if X happens" risks need a path showing X is actually reachable.

It verifies file references the plan makes, checks for missing steps and unhandled error cases, and challenges stated assumptions. Every `FAIL` ships with a specific suggested fix, not just an objection. A review is capped at ten issues — if more surface, the lowest-severity ones are dropped — which keeps the signal high and the false-positive cost low.

## Inputs and outputs

| Inputs | Outputs |
|--------|---------|
| The Architect's full plan | A Markdown review: a TL;DR, an *Issues Found* list (each with severity, category, location, description, evidence, and suggested fix), and a **PASS** / **FAIL** verdict |
| Codebase context for verification | A `jkz:verdict-json` signal carrying the compact verdict for downstream agents |
| The original issue description | An *Accumulated Patterns* section feeding the pipeline's pattern-learning loop |

## Where it sits in the flow

The Auditor is the second role in the Plan phase. It receives the Architect's plan as a Git artifact and posts its review the same way — agents never message each other. Its verdict then goes to the **[Curator](/agents/curator/)**, which validates the audit itself. A `FAIL` routes the plan back to the **[Architect](/agents/architect/)** for revision, up to three iterations before the pipeline escalates to you.

See **[How jkz works](/get-started/how-jkz-works/)** for the full pipeline and **[Architecture](/reference/architecture/)** for backend routing and the fallback tiers.
