---
title: /jkz:debate
description: Run an on-demand adversarial debate between two or three models on any topic. Three phases — constructive, development, crystallization — with early termination on consensus, concession, or decisive evidence.
---

`/jkz:debate <topic or question>` stages a structured argument between models so a hard decision gets pressure-tested from more than one direction before you commit to it. It is the on-demand version of the adversarial deliberation that jkz runs inside the pipeline — except you point it at any question, not just a plan or a diff.

The premise is the same one that drives the whole system: a single model arguing with itself tends toward its own blind spots, while two or three models with different training challenge each other's reasoning. The debate surfaces the disagreement explicitly instead of hiding it inside one confident answer.

## At a glance

| | |
|------|------|
| **Participants** | 2–3 models: Opus + an adversarial backend + a validator backend |
| **Phases** | Constructive → Development → Crystallization |
| **Early exit** | Unanimous consensus, a concession, or decisive execution evidence |
| **Skill** | Runs the `debate-plan` protocol |
| **Output** | A debate summary: positions, consensus, disagreements, recommendation |
| **Usage** | `/jkz:debate <topic>` · `/jkz:debate <topic> --models opus,adversarial` |

## When to use

Reach for `/jkz:debate` when a decision is genuinely contested and the cost of getting it wrong is real — an architectural fork, a trade-off between two viable approaches, a claim you want stress-tested before it lands in a plan. It is deliberately *not* for simple questions or single-model tasks; a question with an obvious answer wastes the deliberation. If the topic is vague, the command asks you to sharpen it first: what question needs answering, what the competing options are, and what context matters.

## Key behavior

By default the debate runs three kinds of model — one creative ([Opus](/agents/architect/)'s tier), one adversarial backend, and one validator backend — each seeing the others' prior arguments. You can narrow the panel with `--models`.

The protocol moves through three phases:

- **Constructive** — each model presents its position with evidence, in sequence, so later speakers see earlier ones.
- **Development** — models challenge each other's positions and defend their own, grounded in evidence rather than assertion.
- **Crystallization** — each model states a final position with a confidence level (HIGH / MEDIUM / LOW) and names the points of consensus and remaining disagreement.

After every iteration the debate checks for an early exit: if the models reach unanimous consensus, if one concedes, or if execution evidence settles the question, the debate ends early and presents the result. The final output is a summary — positions, consensus, disagreements, a synthesized recommendation, and the strongest evidence cited — handed to you for the final decision. As with everything in jkz, the models deliberate; the human decides.
