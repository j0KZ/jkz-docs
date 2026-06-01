---
title: The pipeline
description: The three-phase state machine behind jkz — how Plan, Build, and QA map to roles, why each phase iterates up to three times, and when QA is required.
---

jkz is a state machine with three phases (**Plan**, **Build**, and **QA**) and one rule that never bends: a phase advances only when its work has survived a challenge. Every phase runs the same rhythm. One model creates, a second model attacks the result, a third confirms the verdict. The phase moves forward only when the verdict holds.

If you want the gentle, end-to-end tour (the twelve roles, the multi-backend pattern, the mermaid diagram of the whole flow), read [How jkz works](/get-started/how-jkz-works/) first. This page is the mechanical view: the phases as states, the roles mapped onto them, and the loops that gate each transition.

## Three phases, three commands

Each phase is a command, and each command produces exactly one kind of Git artifact. Artifacts are how phases hand off — never direct messages between agents.

| Phase | Command | Produces | Advances on |
|-------|---------|----------|-------------|
| **Plan** | `/jkz:plan` | An approved plan comment on the issue | Human approval at the post-plan checkpoint |
| **Build** | `/jkz:build` → `/jkz:review` | A pull request with a passing review verdict | Judge + Inspector PASS |
| **QA** | `/jkz:qa` | Lens and Sentinel verdicts on the PR | Both PASS, then the post-QA gate |

The phases are sequential and gated. Plan does not start building; build does not self-merge into QA; QA does not merge to `main`. Between Plan and Build sits a human checkpoint. After QA sits another. The merge itself is a third human act — see [the merge gate](/concepts/merge-gate/).

## How roles map to phases

The create → challenge → confirm rhythm assigns three roles per phase: a **creative** role drafts, an **adversarial** role attacks, a **validator** role confirms. The model that wrote the work is never the model that signs it off, so one model's blind spot cannot pass unchallenged.

| Phase | Creates | Challenges | Confirms |
|-------|---------|-----------|----------|
| **Plan** | Architect | Auditor | Curator |
| **Build** | Builder | Judge | Inspector |
| **QA** | (the diff under test) | Sentinel | Lens |

In Plan and Build the triad is clean: one creates, one attacks, one validates. QA is the exception — there is no fresh creative step, because the artifact under test is the diff that Build already produced. Instead **Sentinel** and **Lens** run in parallel: Sentinel attacks the backend, security, performance, and infrastructure; Lens validates the frontend, visual output, and accessibility. A failure in either routes to the Doctor.

The **Doctor** is the cross-phase repair role. It does not belong to a single triad — it is dispatched whenever a verdict fails in Build or QA, applies a minimal targeted patch, and sends the work back through the same challenge. The full catalogue of roles, their model classes, and the configurable backends behind the adversarial and validator seats live in [How jkz works](/get-started/how-jkz-works/).

## Iteration and escalation

A failing verdict does not stop the pipeline. It loops the work back to the role that can fix it (the Architect in Plan, the Doctor in Build and QA) for **up to three attempts**. Each attempt sees the prior failure as context, so the loop converges rather than repeating itself.

Three is a hard ceiling, not a target. Exhaust the attempts without a clean verdict and the pipeline **stops and escalates to you** with an explicit diagnosis. It does not force a fourth fix that merely passes the checks while hiding the real problem. Honest escalation over a silent hack is a first-class outcome here, not a failure mode — a pipeline that stops and tells you *why* has done its job.

## When QA is required

QA is not run on every issue. Whether it is required depends on the issue type:

| Issue type | Label | QA |
|------------|-------|-----|
| `feature` | (none) | **Required** |
| `bug` | `bug` | Optional |
| `refactor` | `refactor` | Optional |
| `chore` | `chore` | Optional |

A feature changes behaviour and earns the full QA pass. A scoped bug fix, refactor, or chore can skip it — the change is small enough that Build's review is sufficient. The issue type also tunes what each phase focuses on: a `bug` plan centres on root-cause analysis, a `refactor` review centres on behaviour preservation.

For changes too small to deserve the full three-phase loop, there is a lighter route entirely. `/jkz:quick` runs just Builder + Judge, skipping the planning checkpoint and QA — see [lightweight routes](/build/lightweight-routes/).

## What this is not

- **Not the role catalogue.** This page maps roles onto phases. For what each role *is* — its model class, its backend, its single responsibility — see [How jkz works](/get-started/how-jkz-works/) and the Agents pages.
- **Not a guarantee of three iterations.** Three is the ceiling. Most phases pass on the first or second attempt; the limit exists to bound failure, not to schedule retries.
- **Not the merge.** The pipeline prepares everything up to `main` but never crosses it. That last step is yours alone.

## Related

- [How jkz works](/get-started/how-jkz-works/) — the full overview: twelve roles, the multi-backend pattern, and the end-to-end diagram.
- [Evidence hierarchy](/concepts/evidence-hierarchy/) — the standard the adversarial roles apply when they challenge a phase.
- [Ambiguity gate](/concepts/ambiguity-gate/) — the human-decision checkpoints that sit between the phases.
- [Merge gate](/concepts/merge-gate/) — why the final step out of the pipeline stays a human-only act.
- [Worktree isolation](/concepts/worktree-isolation/) — where each phase's work is actually built.
