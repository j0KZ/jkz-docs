---
title: An ad-hoc fix without the full pipeline
description: A hands-on first run of the lightweight path — ship a tiny fix with /jkz:quick (Builder + Judge, no plan, no QA), or just edit it inline when it's truly trivial. The fast loop for changes that don't earn an Architect.
---

Not every change deserves an Architect, an Auditor, and a QA pass. A typo, a wrong
error message, a one-line off-by-one — running the full pipeline on those wastes
tokens and your time. This tutorial walks you through the **lightweight path**
hands-on: you'll ship one small fix with `/jkz:quick` (Builder + Judge, no plan, no
QA) and see how much shorter it is than the [full
pipeline](/get-started/first-issue-with-plan-checkpoint/).

It takes only a couple of minutes. Pick something genuinely tiny and reversible — the
whole point is that small changes move fast.

:::note[About the outputs below]
Command outputs are **illustrative**. jkz wraps live models and external backends,
so exact wording, token counts, and timings drift from run to run. The *shape*
(which command you run and which agent speaks) is stable, not the byte-for-byte text.
:::

## Before you start

Same setup as the other tutorials: **Claude Code CLI** signed in, **`gh`**
authenticated against a repo you can safely open a throwaway PR against, and jkz
installed (`jkz install` then `jkz init`). If that's not done yet, the
[quickstart](/get-started/quickstart/) walks the install end-to-end.

## Step 1 — Pick a genuinely small fix

The lightweight path is for changes of roughly 1–10 lines with an obvious approach.
Good first targets:

- Fix a typo in a user-facing string or an error message.
- Correct an off-by-one in a loop bound that you can see is wrong.
- Tweak a default value or a config constant.

If the change has *a decision in it* — a new feature, an architectural choice,
anything touching more than a handful of files — stop and use the
[plan-checkpoint route](/get-started/first-issue-with-plan-checkpoint/) instead. The
plan and QA phases exist precisely for work with design decisions or wide blast
radius; the lightweight path deliberately skips them.

## Step 2 — Let `/jkz:start` size it for you

Describe the fix and let the front door route it:

```text
/jkz:start
```

```text
> Describe what you want to do. It can be a vague idea, a bug, a feature.

you: the retry log says "attemps" — should be "attempts"

[triage]     complexity: quick   confidence: high
[duplicates] no open jkz:ready issue matches — creating a new one
[brief]      type: chore · scope: 1 file · fixes a typo in the retry log message

Created issue #88 — chore: fix "attemps" typo in retry log
Recommended: /jkz:quick 88   (small, scoped — lightweight pipeline)
```

The **Classifier** (Claude Haiku) sized this as `quick` and recommended `/jkz:quick`.
Two things to notice:

- A truly `trivial` change (the classifier's smallest bucket) it offers to **just fix
  inline** — no issue, no PR ceremony. If you'd rather skip even that, you can always
  edit the file directly on a branch; jkz doesn't force a pipeline on you.
- A `standard` result would have recommended the full pipeline instead. `/jkz:quick`
  re-checks the size on the spot and warns you if the change is actually too big for
  it.

Note the issue number — we'll use `88`.

## Step 3 — Run `/jkz:quick`

```text
/jkz:quick 88
```

This is the minimum viable pipeline: **two agents, one reviewer, no plan, no QA.**

```text
jkz:builder    reading issue #88 (the issue body is the plan)
jkz:builder    opened PR #89 — chore: fix "attemps" typo in retry log (Closes #88)
jkz:judge      PASS — one-character fix, matches the issue, no side effects
               CR reconciliation: 0 findings
               jkz:approved
```

What just ran, and what *didn't*:

- **No Architect, no plan.** The issue description *is* the plan. The Builder reads it
  and implements directly in an isolated worktree, then opens the PR.
- **The Judge is the sole reviewer.** No CodeRabbit pre-scan and no Inspector — not
  worth the latency for a one-line change. The Judge calibrates to the small scope.
- **No QA phase.** Lens and Sentinel don't run.

If the Judge returns **FAIL**, the Doctor applies a fix and the Judge re-reviews — up
to three times, then it escalates to you at `jkz:blocked`. Same honest-escalation
rule as the full pipeline; it just has fewer moving parts to begin with.

## Step 4 — Merge it yourself

The lightweight route does **not** weaken the merge gate. Only a human merges, and
only through the server-side workflow with your passphrase:

```bash
gh workflow run approve-merge.yml -f pr=89 -f passphrase=<your-passphrase>
```

The PR merges and issue `88` closes automatically via its `Closes #88` keyword.

## What just happened

- You shipped a fix through a **stripped-down loop** — Builder writes it, the Judge
  reviews it, you merge it. No plan, no QA, far fewer model calls than the full
  pipeline.
- The issue body did the job a plan would do in a bigger change: it *was* the spec.
- Everything that makes jkz trustworthy still held — the change ran in an isolated
  worktree, the PR is the audit trail, and **only your passphrase** got it to `main`.

## Choosing a route next time

| You have… | Reach for… |
|-----------|-----------|
| A typo, a one-line fix, a doc edit | Edit directly, or `/jkz:quick` |
| A small scoped change with a clear direction | `/jkz:quick` |
| A feature or anything with a design decision | The [plan-checkpoint route](/get-started/first-issue-with-plan-checkpoint/) or the full `/jkz:pipeline` |
| A PR a reviewer just failed | `/jkz:fix` (usually automatic) |

## Next steps

- [Your first issue with a plan checkpoint](/get-started/first-issue-with-plan-checkpoint/) —
  the other end of the spectrum: drive every phase by hand with a plan approval up front.
- [Lightweight routes](/build/lightweight-routes/) — the reference for `/jkz:quick`
  and `/jkz:fix`, including how the complexity classifier decides where you land.
- [How jkz works](/get-started/how-jkz-works/) — the full three-phase model behind
  all of this.
