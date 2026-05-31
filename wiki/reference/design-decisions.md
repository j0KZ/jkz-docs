---
title: Design decisions
description: Architecture decision records for jkz — why the pipeline uses multiple backends, why creative roles are fixed on Opus, why adversarial roles require external backends, the fallback tiers, and the docs site tooling choice.
---

These are the architecture decision records (ADRs) behind jkz. Each captures a choice that is not obvious from the code alone: the alternatives weighed, the decision taken, and what it costs. They live in the public wiki so the rationale that otherwise sits only in the private rules (`CLAUDE.md`, `.claude/rules/`) is preserved for newcomers and for the owner.

## ADR-001: Astro Starlight for the documentation site

**Status:** Accepted — 2026-05-09

**Context.** The wiki-generator epic (#1276) needs a public documentation site to render generated content. Requirements: Markdown-first authoring, dark mode default, mobile responsive, fast static builds, low maintenance, GitHub Actions build triggers, and support for search and sidebar autogeneration in later phases. Candidates: Astro Starlight (Astro framework with a docs theme — built-in dark mode, search hooks, sidebar autogen, MDX), Docusaurus (React-based, larger bundle, slower builds), VitePress (Vue-based, smaller docs community), and MkDocs Material (Python — would split the toolchain).

**Decision.** Use Astro Starlight. The toolchain matches the rest of jkz (Node.js), builds meet the sub-2-minute target, and dark mode plus mobile layout come for free. Content lives in `wiki/` at the repo root (not Starlight's default `src/content/docs/`) so wiki-generator output paths stay consistent with the generator-side contract; the collection loader uses `glob({ pattern: '**/*.md', base: './wiki' })` because the public `docsLoader()` API does not accept a `base` option.

**Consequences.** Positive: a single Node.js toolchain, dark mode and responsive layout without extra CSS, and first-party patterns for search (Pagefind). Negative: Astro version churn requires periodic dependency updates, and the custom loader path means we must track any Starlight default-loader migrations.

## ADR-002: Multi-backend deliberation — create, challenge, confirm

**Status:** Accepted

**Context.** A model that reviews its own work shares its own blind spots. A single-model pipeline — even a strong one — cannot reliably catch the failure modes it is itself prone to, so a self-review tends to ratify rather than challenge.

**Decision.** Every phase runs the same rhythm: **Opus creates → an adversarial backend challenges → a validator backend confirms.** The challenger is deliberately a *different* model family than the author. This is an intentional inverse-Conway choice: structuring the agents around model diversity so a single vendor's systematic bias cannot pass unchallenged through a deliberation.

**Consequences.** Positive: a blind spot in one model is unlikely to be shared by an unrelated model, so more real defects surface before the human checkpoint. Negative: each phase spends tokens across multiple models, and operators must configure and maintain external endpoints rather than running everything on one provider.

## ADR-003: Fixed Opus for creative roles

**Status:** Accepted

**Context.** The creative roles — Architect, Builder, Doctor, Analyst — construct the artifacts the rest of the pipeline operates on: the plan, the code, the fix, the research synthesis. Their output is the floor of overall quality. The adversarial and validator layers can catch and reject weak work, but they cannot turn a poor plan into a good one.

**Decision.** Pin creative roles to Opus rather than making them configurable. They are invoked through the Task tool with `model: "opus"`. The configurability that the adversarial and validator seats expose (per-role endpoints) is intentionally absent here.

**Consequences.** Positive: the deliberation downstream can assume a strong construction baseline, so the adversarial layer spends its budget finding real defects rather than compensating for a weak author. Negative: the highest-cost model sits on the hot path of every phase, and creative work cannot be offloaded to a cheaper backend to save tokens.

## ADR-004: External backends required for adversarial roles

**Status:** Accepted

**Context.** Adversarial roles — Auditor, Judge, Sentinel — exist to attack Opus's output. If they also ran on Opus, the reviewer would share the author's blind spots and the challenge would be theater (see ADR-002).

**Decision.** Route adversarial roles to a configurable, OpenAI-compatible external endpoint (`JKZ_<ROLE>_ENDPOINT` / `JKZ_<ROLE>_MODEL`), and make that endpoint **required**. When it is unset the wrapper exits with code 4 and the pipeline halts — there is no silent fallback to Opus that would quietly let a review skip its challenger. Validator roles (Curator, Inspector, Lens), whose job is to confirm rather than attack, are the forgiving counterpart: they default to an external validator endpoint and fall back to a local Gemini CLI when none is configured.

**Consequences.** Positive: an adversarial verdict is never produced by the same model family that wrote the work, and a missing reviewer fails loudly instead of degrading into a rubber stamp. Negative: jkz cannot run its adversarial phases on Opus alone — an operator must configure at least one external backend before the build/review and QA phases will complete.

## ADR-005: Layered fallback tiers

**Status:** Accepted

**Context.** External backends rate-limit, time out, and go down. The pipeline needs to stay resilient to transient failures without ever silently skipping a reviewer when the failure is not transient.

**Decision.** Use a layered cascade and split it by who decides. *Automatic* layers handle transient faults: a model fallback (`JKZ_<ROLE>_MODEL_FALLBACK`) on a not-found model, then a tier-3 OpenAI-compatible provider fallback for validator roles, then a tier-4 Anthropic Task-tool fallback (per-role default of `opus` or `sonnet`) when the validator backend is exhausted. *Manual* service fallback handles hard outages: if Opus is down the pipeline stops and waits; if an external adversarial or validator endpoint is down the system notifies and the human decides whether to continue. A sentinel record carries `fallback_tier` so each verdict's path is auditable.

**Consequences.** Positive: transient rate limits and model-not-found errors recover on their own, while a genuine backend outage surfaces to the human rather than producing a verdict from a silently substituted reviewer. Negative: the multi-tier cascade is more moving parts to reason about, and operators must understand which faults recover automatically and which pause the pipeline for a decision.
