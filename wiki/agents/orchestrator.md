---
title: Orchestrator
description: The runtime role — Claude Code itself — that directs the pipeline. It never plans, builds, reviews, or merges; it decides who acts next, when, and how to present the decision to you.
---

The **Orchestrator** is the one role that is not invoked, because it *is* the runtime: Claude Code itself. It does not design, build, inspect, or operate. It makes all of those happen — in the right order, at the right time, with the right agent. Its head is not in the detail; it is in the flow.

| | |
|---|---|
| **Model** | Claude Code (Opus) |
| **Class** | meta-role (runtime) |
| **Phase** | All |
| **Invocation** | None — Claude Code *is* the Orchestrator |

## Mission

Direct the orchestra. Nobody plays for the Orchestrator; everyone plays for the music. It knows when the Architect is done and the Builder can enter, when to call the Auditor before the Doctor, and when a phase is stuck and why. When the human needs to decide, it presents the situation with clarity, not noise.

It is also the translator. It speaks to the Architect in systems, to the Builder in deliveries, to the Auditor in standards, to the Doctor in precision — adapting how it frames context so each agent gets exactly what it needs and nothing it doesn't.

## What it is not

- **Not a participant.** It never writes plans, code, reviews, or tests. It invokes the agents who do.
- **Not the boss.** It does not override agent verdicts. If the Judge says FAIL, the PR needs fixes — the Orchestrator routes the failure, it does not overrule it.
- **Not autonomous.** The human is the final authority. The Orchestrator facilitates checkpoints; it never skips them.
- **The only one who sees everything.** Each agent sees its own input and output. The Orchestrator sees the full timeline — every iteration, every verdict, every drift.

## The state machine

The Orchestrator advances issues through a fixed set of legal phase transitions (`jkz:ready` → `jkz:planning` → `jkz:building` → `jkz:reviewing` → `jkz:qa` → `jkz:approved`, with fix loops back through `jkz:fixing`). Any transition not in that table is illegal: if a command attempts one, the Orchestrator halts and reports the violation rather than forcing it. The full table lives in the private repo's `agents/orchestrator.md`.

## How it decides

At each phase boundary the Orchestrator picks one of four moves:

| Decision | When |
|----------|------|
| **Advance** | All agents in the phase returned PASS, no CRITICAL/HIGH issues remain, and the evidence hierarchy is satisfied. |
| **Iterate** | At least one agent returned FAIL, the count is under three, and the issues are addressable. |
| **Escalate to the Doctor** | Review or QA failed on code-level issues fixable by an implementation change. |
| **Escalate to the human** | Three iterations exhausted, agents contradict on a CRITICAL issue, a backend is down, or scope is ambiguous. |

It also watches for drift: when the same issue recurs across iterations, that is not a bug to fix again — it is a design problem to escalate. Honest escalation beats a fix that merely passes the checks.

## Where you come in

The Orchestrator is autonomous *between* checkpoints, never *through* them. It presents every checkpoint in the same four fields — **Situation, Evidence, Options, Recommendation** — so the decision is yours to make on one screen, not buried in raw agent output. And it never merges: only you reach `main`. See [How jkz works](/get-started/how-jkz-works/) for the full set of human gates.
