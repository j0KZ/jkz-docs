---
title: insights
description: Analyze the deliberation history and surface pipeline metrics — pass rates, agent agreement, token usage, SLO status, groupthink signals, and optional skill-discovery candidates.
---

`/jkz:insights` reads the deliberation record in `state/deliberations/` and turns it into pipeline analytics: how often each role passes, how much agents agree within a phase, how many tokens they burn, and whether the run is staying inside its SLOs. It is the command for stepping back from any single run and asking how the deliberation system as a whole is behaving over time.

Alongside the headline metrics it runs a groupthink monitor, because the entire premise of jkz — adversarial models challenging each other — fails quietly if the validators start rubber-stamping the adversarials. The insights surface that drift before it hides inside a confident-looking pass rate.

## At a glance

| | |
|------|------|
| **Source** | Deliberation history in `state/deliberations/` + `state/memory.db` |
| **Core metrics** | Pass rates, agent agreement, token usage, SLO status |
| **Groupthink** | Agreement rate, directional asymmetry, validator novelty |
| **Optional** | `--skills` (candidate skills) · `--trends` (14d vs prior 14d) |
| **Usage** | `/jkz:insights` · `/jkz:insights --trends` · `/jkz:insights --role judge` |

## When to use

Run `/jkz:insights` periodically once a pipeline has accumulated history — patterns become reliable after roughly ten real runs. It is the right tool when a role seems to be failing too often, when you suspect validators are no longer adding independent signal, or when you want to confirm the pipeline is operating within its defined SLOs before trusting its verdicts.

## Key behavior

The command runs two scripts and presents both: `analyze-deliberations.js` for the core metrics and `groupthink-monitor.js` for independence signals. It accepts filters — `--role`, `--phase`, `--json` — and two analytical add-ons: `--trends` compares the last 14 days against the prior 14 (improving, declining, or stable per role), and `--skills` runs skill discovery to cluster recurring patterns into candidate skills.

Each metric comes with an interpretation. A role under 50% pass rate across two or more real runs flags its agent definition for review; agreement below 70% suggests prompts that need aligning, while above 90% signals strong calibration. On the groupthink side, an agreement rate above 85% or validators consistently more lenient than adversarials are the warnings that the panel has lost its edge. Where data is thin — fewer than ten runs, or pre-enrichment records showing `phase: unknown` — the command says so rather than over-reading the numbers.
