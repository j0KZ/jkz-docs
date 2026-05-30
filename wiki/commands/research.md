---
title: research
description: Orchestrate a four-phase financial research pipeline — SCOPE → RESEARCH → AUDIT → OUTPUT — with an Analyst that gathers evidence, an adversarial audit loop, and generated deliverables. Resumable per topic.
---

`/jkz:research [topic]` runs a financial research pipeline that mirrors the rest of jkz: one model produces, an adversarial pair challenges, and the work iterates before it is delivered. Instead of code, the artifact is a researched report with sources, data, and deliverables — and instead of a PR, the deliberation gate is an audit loop that has to pass before output is generated.

## At a glance

| | |
|------|------|
| **Phases** | SCOPE → RESEARCH → AUDIT (up to 3×) → OUTPUT |
| **Research** | Analyst (Opus) gathers evidence and produces the draft |
| **Audit** | Research-Auditor (adversarial) + Research-Reviewer (validator) |
| **Types** | `investment` · `market` · `due-diligence` · `supply-chain` · `derivative` |
| **Resumable** | Yes — resumes from existing artifacts under `research/<topic>/` |
| **Usage** | `/jkz:research [topic]` |

## When to use

Use `/jkz:research` when you need a structured, evidence-backed financial deliverable rather than a quick answer — an investment thesis, a market sizing, a due-diligence risk matrix, a supply-chain map, or a catalyst-driven derivative valuation. The pipeline is built for work that benefits from an adversarial audit before you trust the conclusions. For a one-off lookup, a chat question is faster; `/jkz:research` earns its cost when the output needs to withstand scrutiny.

## Key behavior

The pipeline moves through four phases, each persisting state so a run can be resumed from where it stopped:

- **SCOPE** *(conversational)* — if no brief exists, the command asks a short series of questions: the research type, the topic (sanitized to a kebab-case slug), and the priority questions that shape the work. The output is a research brief.
- **RESEARCH** — the Analyst, running on Opus, gathers evidence and produces three artifacts: the report draft, the analysis data, and a sources log. Research MCP servers are invoked on demand during gathering, with a graceful fallback when a server is unavailable.
- **AUDIT** — an adversarial Research-Auditor and a validator Research-Reviewer challenge the draft, iterating up to three times. The audit is the deliberation gate: output is not generated until it completes.
- **OUTPUT** — the deliverables are generated from the audited draft.

Resumption is automatic: pass a `topic` and the command detects which artifacts already exist under `research/<topic>/` and restarts from the right phase — brief present means resume at RESEARCH, a complete audit means resume at OUTPUT, and existing deliverables mean the run is already done. Each research type (`investment`, `market`, `due-diligence`, `supply-chain`, `derivative`) shapes the questions, the analysis, and the deliverables; the `derivative` type adds a bottom-up CAPM stage with an explicit confirmation gate.
