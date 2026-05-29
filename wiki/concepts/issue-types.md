---
title: Issue types
description: How jkz classifies work into feature, bug, refactor, and chore — and how that one label reshapes the plan focus, the review focus, and whether QA is required.
---

Not all work is the same shape. Adding a feature, fixing a bug, restructuring code, and bumping a dependency each call for a different kind of attention — so jkz tags every issue with one of four types and lets that tag steer the pipeline. The type is not cosmetic: it changes what the Architect plans for, what the reviewers look hardest at, and whether the QA phase runs at all.

## The four types

| Type | Label | Plan focus | Review focus | QA |
|------|-------|-----------|--------------|-----|
| `feature` | *(none)* | Implementation design | Code quality | Required |
| `bug` | `bug` | Root cause analysis | Fix correctness | Optional |
| `refactor` | `refactor` | Current → target state | Behavior preserved | Optional |
| `chore` | `chore` | Mechanical change | No behavior shift | Optional |

A `feature` is new behavior, so the plan is about *design* and the review is about *quality* — and because new behavior can break in ways nothing else catches, QA is mandatory. A `bug` flips the emphasis to *root cause*: a fix that treats the symptom without naming the cause is the most common way a bug comes back. A `refactor` is judged against a single promise — behavior is preserved — so the plan frames the work as a move from a current state to a target state, and the review checks that nothing observable changed. A `chore` (a dependency bump, a config tweak, a mechanical rename) should shift no behavior at all, so both plan and review stay deliberately minimal.

## QA is required only for features

The most consequential difference is the last column. QA runs the deep adversarial and validation pass — and it is **required** for `feature` work but **optional** for `bug`, `refactor`, and `chore`. The reasoning is proportionality: a one-line dependency bump does not warrant the same scrutiny as a new subsystem. You can still opt a bug or refactor into QA when the change earns it; the default just stops the pipeline from over-spending on low-risk work.

## How the type is detected

When an issue is created through `/jkz:start`, jkz asks for the type and sets the matching label. From then on, every command resolves the type through a short cascade, taking the first answer it finds:

1. **Pipeline state** — the persisted `issue_type` from a run already in progress.
2. **Label** — `bug`, `refactor`, or `chore` on the GitHub issue.
3. **Default** — `feature`, when nothing else says otherwise.

Note that `feature` has no label of its own. Its absence *is* the signal: an issue with none of the three type labels is treated as a feature. The resolved type is persisted in the pipeline state file (`state/pipeline/<issue>.json`) under `issue_type`, so later phases agree with earlier ones.

## What the type actually changes

The type is not just metadata sitting on the issue — it is injected into the agents' prompts. A type-specific block is appended to the Architect, Builder, Judge, and Inspector prompts depending on the resolved type, the same mechanism used for conditional security analysis. So a `bug` issue literally tells the Architect to lead with root-cause analysis and tells the Judge to weigh fix correctness above stylistic concerns. The label you set at creation time propagates all the way down to how each model is briefed.

## See also

- [Pipeline](/concepts/pipeline/) — the three phases each type flows through
- [Ambiguity gate](/concepts/ambiguity-gate/) — the human-decision checkpoints
- [Merge gate](/concepts/merge-gate/) — why only a human merges, regardless of type
