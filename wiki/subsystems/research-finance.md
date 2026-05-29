---
title: Research & finance pipeline
description: How /jkz:research turns a question into an audited financial deliverable — the four-phase flow, its three dedicated agent roles, the finance MCP data sources it pulls from, and how Hermes runs it unattended.
---

The same pipeline that builds code — one model creates, an adversarial backend challenges, a validator confirms — also drives financial research. `/jkz:research` is that pattern pointed at a question instead of a codebase: an Analyst investigates and writes, a Research-Auditor fact-checks adversarially, and a Research-Reviewer validates the methodology. The output is not a pull request but a set of deliverables — a report, structured data, and a sourced evidence log — that have survived the same kind of scrutiny.

This page covers the flow, the three agent roles, the finance data servers the pipeline pulls from, and how Hermes runs research on a schedule without a human at the keyboard.

## The four phases

`/jkz:research [topic]` runs in four phases. If a `topic` is supplied and a brief already exists, it resumes from the phase the work last reached rather than starting over.

| Phase | Who runs it | What happens |
|-------|-------------|--------------|
| **SCOPE** | Conversational (you + the orchestrator) | Pin down the question: research type, subjects, horizon, deliverables, source priorities. Produces a `brief.md`. |
| **RESEARCH** | Analyst (Opus) | Gather, filter, structure, and draft. Produces three artifacts. |
| **AUDIT** | Research-Auditor + Research-Reviewer, in parallel | Adversarially fact-check and validate the methodology, up to 3 iterations. |
| **OUTPUT** | Deliverable generator | Turn the audited artifacts into Google Workspace documents. |

### SCOPE — frame the question

SCOPE is a short interview. It asks seven priority questions — research type, topic, holding horizon, subjects, deliverables, restrictions, and what specifically matters — and persists the answers to `research/<slug>/brief.md`. Five research types steer the rest of the run: `investment`, `market`, `due-diligence`, `supply-chain`, and `derivative`.

Two gates keep a vague request from becoming a vague report:

- An **intake gate** scores how clearly the question is posed. Above a high-confidence threshold it proceeds; in the middle band it shows you a refined version of the query; below the low threshold it asks clarifying questions before continuing (with a single re-evaluation budget).
- An optional **source-weights** step lets you tell the Analyst which kinds of sources to lean on, recorded in the brief as advisory weights.

For the `derivative` type, SCOPE also resolves the subject company to an exchange ticker — trying Polygon first and falling back to Octagon — so downstream valuation has a concrete instrument to work from.

#### Stage 0: bottom-up CAPM (derivative only)

When the research type is `derivative`, an extra stage runs before the Analyst is invoked: a bottom-up cost-of-equity and WACC computation. It assembles its inputs from the finance servers — the risk-free rate from FRED, a beta regression from Polygon price history (falling back to Yahoo Finance), the equity risk premium from Damodaran's published tables, and fundamentals from Octagon — then computes a defensible cost-of-equity band and pauses for your confirmation. The point is to fix the discount rate **once**, deterministically, so the Analyst never silently re-derives it. The Analyst copies the result verbatim rather than recalculating.

### RESEARCH — the Analyst draughts

The Analyst (Opus) does the actual investigation. It works through a four-step funnel — **gather** raw data, **filter** signal from noise, **restructure** into JSON, then **draft** the report against the type's template — and pulls evidence through a four-level search protocol: finance MCP servers first, then mandatory web sources (Damodaran), then recommended sources, then free web search as a last resort. Every data point carries a confidence tag and a freshness stamp; when a number can't be found, the Analyst declares the omission and the searches it tried rather than inventing a value.

It produces three artifacts:

| Artifact | What it holds |
|----------|---------------|
| `report.md` | The finished report, following the type's template, with confidence and freshness tags and any declared omissions. |
| `analysis-data.json` | Structured data matching the template's spreadsheet schema, including a `contradictions[]` array when sources disagree. |
| `sources-log.json` | An evidence log — for each data point, the tool used, the attempts made, and how it resolved. |

### AUDIT — challenge and validate

AUDIT runs two agents in parallel against the draft, mirroring the main pipeline's adversarial-then-validator split:

- The **Research-Auditor** fact-checks adversarially — recomputing arithmetic, resolving cited URLs, checking that sources actually support the claims, and scoring completeness against the template.
- The **Research-Reviewer** validates the *methodology* — is the analytical framework sound and standard, does the report answer what the brief asked, are the confidence distribution and freshness reasonable.

Both emit a verdict. The Auditor passes only on **zero CRITICAL findings, zero HIGH findings, and completeness ≥ 90%**; the Reviewer passes on a sound-methodology / brief-compliant verdict. If both pass, the audit reports are written and the run proceeds to OUTPUT. If either fails, Doctor (Opus) applies a targeted fix and the audit re-runs — up to **3 iterations**. After the third failure the run proceeds anyway, but the reports are marked unresolved so the gaps are visible rather than hidden. The Reviewer also surfaces `knowledge_gaps[]` — open questions worth a follow-up — which are presented to you at the end.

### OUTPUT — generate deliverables

The audited artifacts are rendered into Google Workspace deliverables — a document, a spreadsheet, slides, and a PDF — with a manifest recording what was produced. Partial generation is reported distinctly from a clean success, so a half-finished export is never mistaken for a complete one.

## The research roles

The research pipeline reuses the main pipeline's three-part structure, with its own dedicated agents. The parallel is exact:

| Research role | Main-pipeline analogue | Kind | Backend |
|---------------|------------------------|------|---------|
| **Analyst** (`.claude/agents/analyst.md`) | Architect / Builder | Creative | Claude Opus |
| **Research-Auditor** (`agents/research-auditor.md`) | Auditor / Judge | Adversarial | External backend (`JKZ_RESEARCH_AUDITOR_ENDPOINT`) — required, no silent fallback |
| **Research-Reviewer** (`agents/research-reviewer.md`) | Curator / Inspector | Validator | External validator backend (default Ollama Cloud), Gemini fallback |

**The Analyst is the creator.** Like the Architect drafting a plan or the Builder writing code, it produces the primary artifact under Opus, with CFA-level rigor as its standing instruction: every claim has a number, every number a source, every source a date.

**The Research-Auditor is the adversary.** Like the Auditor challenging a plan or the Judge challenging a diff, it runs on a required external backend and is told to find what the Analyst would rather not have found — buried miscalculations, sources that don't support their claims, optimistic assumptions dressed as facts. It works from an 8-point checklist (numeric consistency, source verification, cross-referencing, unsupported claims, completeness, accounting consistency, honest gap declaration, contradiction audit), extended to a 21-point checklist for `derivative` valuations. Its output is an errata document graded by severity, plus a machine-readable verdict.

**The Research-Reviewer is the validator.** Like the Curator or Inspector confirming the work holds together, it checks methodology and brief-compliance rather than re-litigating facts — confirming the framework is standard (CAPM/WACC/DCF per Damodaran, structured market sizing, sourced assumptions) and that the report actually answers the question. It also returns the knowledge-gaps list.

The Doctor — the same fix agent used in the code pipeline — closes the loop when the audit fails, applying minimal patches to the report, the data, or the sources log between iterations.

## Finance data sources

The Analyst and the CAPM stage pull market and economic data through the finance MCP servers bundled with jkz. The servers themselves are documented in detail on the [MCP servers page](/subsystems/mcp-servers/); in the research context their roles are:

| Server | Used for |
|--------|----------|
| **fred** | Macroeconomic series — the risk-free rate for CAPM, plus rates, inflation, and employment data. |
| **polygon** | Market data — price history for beta regressions, quotes and aggregates across equities, options, FX, and crypto. |
| **yahoo-finance** | Fallback price history when Polygon coverage is short. |
| **octagon** | Financial research agents, company fundamentals, and prediction-market data; also the fallback for ticker resolution. |

Beyond the MCP servers, the Analyst treats **Damodaran's** published datasets (betas, equity risk premiums) as mandatory web sources, fetching and indexing large documents so it can retrieve only the relevant fragments rather than re-downloading them.

## Running research unattended

Research does not have to be driven from a chat. **Hermes** — jkz's operational layer — can run the pipeline on a schedule. The mechanism is label-driven: an issue tagged `jkz:research-pending` (created directly, via a Telegram `/research <topic>` command, or proposed by a periodic suggestion job) is picked up by a poller that runs every five minutes, processes pending issues FIFO under a single-worker lock, and invokes `/jkz:research` non-interactively.

Each run's deliverables are synced to Google Drive under a per-run folder, with state and logs kept locally. Idle cost is zero — when there is nothing tagged, the poller exits early and no model is invoked. Kill-switches disable the poller, the bisync, or the whole research feature independently. The operational details — folder layout, cron cadence, timeouts, and the issue-body schema — live on the [Hermes page](/subsystems/hermes/).
