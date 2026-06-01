---
title: Architect
description: The creative role that designs the implementation strategy in the Plan phase (scope before code) and produces a plan rigorous enough to survive adversarial audit.
---

The **Architect** is the first role the pipeline reaches. It is a *creative* role: it constructs the plan that every later phase is measured against. Its job is to understand the full picture before committing to a single approach. No alternatives, no hedged language: one plan, fully owned.

A good plan is not a checklist. Every step must be specific enough that a Builder can implement it without asking a question, and rigorous enough to survive the Auditor and Curator that come next.

## At a glance

| | |
|---|---|
| **Phase** | Plan |
| **Class** | creative |
| **Model** | Claude Opus |
| **Invocation** | Task tool (`model: "opus"`) |
| **Source** | `.claude/agents/architect.md` |

As a creative role the Architect runs on Claude Opus and is dispatched through the Task tool, the same mechanism that drives the Builder and Doctor. It reasons deeply before drafting rather than optimizing for speed — a shallow plan forces Builder rework and Auditor rejection, which costs more than the upfront thinking.

## What it does

Before drafting, the Architect reasons through the risks and mitigations for its chosen approach, the codebase assumptions that must hold, and the acceptance criteria that would prove success. It analyzes the issue against a 32-dimension spec taxonomy, marking each dimension `DEFINED`, `PARTIAL`, or `ABSENT`, so its design decisions are traceable: a reviewer can see exactly which choices came from the spec and which were the Architect's own. `DEFINED` dimensions are constraints, not suggestions — the plan may fill gaps but never silently contradict what the spec defines.

It never proposes a change to a file it has not read. When the issue omits a file's current state, the Architect reads it first rather than guessing structure from a name.

## Inputs and outputs

| Inputs | Outputs |
|--------|---------|
| Issue description (what to build or change) | A structured Markdown plan: spec adoption map, objective, scope, numbered implementation steps, data-flow paths, files affected, dependencies, a premortem risk table, acceptance criteria, and a testing strategy |
| Research pre-docs, if any | A `jkz:compact-plan` signal — a ~250-token structured summary that downstream agents (Judge, Inspector, Lens, Sentinel) consume instead of the full narrative |
| Codebase context — relevant files, patterns, conventions | An optional `jkz:adr-json` signal for significant architectural decisions, and a `jkz:spec-map` signal recording the dimension analysis |
| Previous-iteration feedback from the Auditor and Curator (on iteration 2–3) | |

## Where it sits in the flow

The Architect opens the Plan phase. Its plan flows as a Git artifact (never a direct message) to the **[Auditor](/agents/auditor/)**, which challenges it, and then to the **[Curator](/agents/curator/)**, which validates the audit. A `FAIL` verdict from either sends the plan back to the Architect to revise, up to three iterations. When the plan clears review it reaches a human checkpoint: you read it and approve before any code is written.

See **[How jkz works](/get-started/how-jkz-works/)** for the full Plan → Build → QA pipeline, and **[Architecture](/reference/architecture/)** for model routing and fallback details.
