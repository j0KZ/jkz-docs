---
title: Why jkz?
description: The problem jkz solves, the design constraints, and where it fits next to other agent frameworks.
---

## The problem

Most agentic coding tools optimize for a single property: throughput. One model reads a task, writes code, and reports success. It feels fast because nothing slows it down — not a second opinion, not a test of its own reasoning, not a human who has to agree. The cost is hidden until it isn't. A single agent fails silently: it asserts that a change works, the assertion is plausible, and the error surfaces three commits later, when it is expensive to trace.

The two popular escapes both make this worse. Generating code without review compounds errors — each unreviewed change becomes the foundation the next one is built on. Handing the agent full autonomy removes the one thing that made the output trustworthy: an accountable human who decided to ship it. Speed without review is just debt that hasn't been invoiced yet.

## The shape of the answer

jkz is built on a different bet: that an explicit, adversarial pipeline with a human at the end produces code you can actually trust, and that the overhead is worth it for work that matters.

The pipeline has three phases — **Plan**, **Build**, and **QA** — and a fixed rhythm inside each: one model proposes, a different model challenges it adversarially, and a third confirms the result. Roles are specialized and named. They never negotiate directly; everything they produce flows through the pull request, which is the only place state lives. At the end of every phase, a human reads the result. For the mechanics — the roles, the phase boundaries, the deliberation loop — see [How jkz works](/get-started/how-jkz-works/).

## What jkz commits to

These are opinions, not features. They constrain the system on purpose:

- **You merge.** The pipeline iterates internally — up to three times per phase — but it never merges on its own. The final decision to ship is always a human's. This is enforced, not merely encouraged.
- **Git is the source of truth.** Agents do not message each other. Every plan, critique, and fix is a commit or a PR comment, so the full reasoning trail is auditable after the fact.
- **One role, one verb, one owner.** There is never ambiguity about which agent did what, or which model is responsible for a given step. Diffuse accountability is how silent failures hide.
- **Shift left.** Errors are caught by the adversarial and validator roles before they reach the human checkpoint. The human arbitrates judgment calls, not typos.

## What jkz does not promise

An honest pitch names its costs:

- **It is not zero-touch.** A human checkpoint at each phase is the design, not a limitation to be removed later. If you want to walk away and return to merged code, this is the wrong tool.
- **It is not faster on trivial work.** For a one-line fix, the full adversarial loop is pure overhead. jkz ships `/jkz:quick` precisely so small changes can skip Plan and QA — but a single-agent loop will still beat it on the truly trivial.
- **It costs more in tokens.** Three models per step is more expensive than one. Adversarial review is not free, and jkz does not pretend otherwise. You are buying a higher floor on correctness, and you pay for it.

## When to use jkz — and when not to

Reach for jkz when the cost of a silent error is high: features with real surface area, changes touching security-sensitive code, refactors where "it still behaves the same" is the entire point, or any work where you want a defensible record of why each decision was made. The adversarial loop earns its overhead exactly when a mistake would be expensive to discover later.

Skip it — or use `/jkz:quick` — when the change is small and self-evidently correct: a typo, a config bump, a one-line fix you could review in the time it takes to read this sentence. Running the full pipeline there buys nothing but latency and tokens.

The honest summary: jkz trades speed and token cost for a correctness floor and an audit trail, with a human as the final arbiter. If that trade fits the work in front of you, start with the [Quickstart](/get-started/quickstart/).
