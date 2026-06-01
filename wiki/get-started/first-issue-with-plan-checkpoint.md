---
title: Your first issue with a plan checkpoint
description: A hands-on first run driving the phases yourself — /jkz:plan, then /jkz:build, /jkz:review, /jkz:qa — so you feel the human-in-the-loop control at every phase boundary instead of letting the autonomous pipeline advance for you.
---

The [quickstart](/get-started/quickstart/) hands one issue to `/jkz:pipeline` and lets
it run autonomously, pausing only to approve the plan and the merge. This tutorial
takes the **other** path: you drive each phase by hand — `/jkz:plan`, then
`/jkz:build`, then `/jkz:review`, then `/jkz:qa` — and stop to look around between
them. Same destination, but you hold the wheel the whole way. The point is to feel
where the phase boundaries are and what you get to decide at each one.

It takes a few focused minutes plus some waiting while the agents deliberate. Pick a
small but real change — something that genuinely benefits from a plan, not a one-line
typo. A typo would route to a [lightweight path](/get-started/ad-hoc-fix/); here we
want a change worth planning.

:::note[About the outputs below]
Command outputs are **illustrative**. jkz wraps live models and external backends,
so exact wording, token counts, and timings drift from run to run. The *shape* —
which command you run, which agent speaks, and what gate you hit — is stable. Treat
the snippets as "what you'll roughly see," not byte-for-byte transcripts.
:::

## Before you start

You need the same setup as the quickstart: the **Claude Code CLI** signed in, **`gh`**
authenticated against a repo you can safely open a throwaway PR against, and jkz
installed (`jkz install` then `jkz init`). If you haven't done that yet, run the
[quickstart](/get-started/quickstart/) first — it walks the install end-to-end — then
come back here for the manual route.

For a complete planning loop you'll want an adversarial backend configured (the
Auditor challenges the plan). Without one, the audit is skipped and jkz tells you so;
the run still works, it's just less rigorous.

## Step 1 — Pick a change worth planning

Choose something small but with a real decision in it. Good first targets:

- Add a `--json` output mode to a script that currently prints plain text.
- Add one new optional field to a status command's output.
- Add input validation to a function that currently trusts its caller.

Each of these has *a question to answer* — what shape should the JSON be? what's the
default? — which is exactly what makes the plan checkpoint worth seeing. Avoid the
ambitious refactor; you want one clear decision, not ten.

## Step 2 — Turn it into an issue with `/jkz:start`

`/jkz:start` is the conversational front door. Describe the change in plain language
and let it create the issue:

```text
/jkz:start
```

```text
> Describe what you want to do. It can be a vague idea, a bug, a feature.

you: add a --json flag to the status script so it can print machine-readable output

[triage]     complexity: standard   confidence: high
[duplicates] no open jkz:ready issue matches — creating a new one
[brief]      type: feature · scope: 1 script + tests · adds --json output mode

Created issue #214 — feat: add --json output mode to status script
Recommended: /jkz:pipeline 214   (standard — full pipeline)
```

It recommends `/jkz:pipeline` — the autonomous route. We're going to ignore that
recommendation on purpose and run the phases ourselves, so we see each one as a
separate, deliberate step. Note the issue number; we'll use `214` throughout.

## Step 3 — Plan it with `/jkz:plan`

```text
/jkz:plan 214
```

This runs the **Plan** phase and nothing else. The Architect drafts a strategy, the
Auditor attacks it, and the Curator calibrates the audit — iterating up to three
times on its own — then it stops and prints the full plan for you:

```text
PLAN
  jkz:architect  drafting plan…
  jkz:auditor    challenge: what's the JSON shape? is --json mutually exclusive with --verbose?
  jkz:architect  revised: documents the schema, makes --json suppress human-readable lines
  jkz:curator    PASS — plan is minimal, the schema is specified, edge cases covered

  >>> PLAN CHECKPOINT
  Problem:  status script only prints human text; no machine-readable mode.
  Changes:  add --json flag; when set, emit a documented JSON object and
            suppress the plain-text lines. Add two tests (flag on / flag off).
  Risk:     low — additive flag, existing default output unchanged.

  Approve this plan? (or send feedback for another iteration)
```

**This is the decision the whole tutorial is built around.** The plan is the artifact,
so it's printed in full. Read it. If the JSON shape isn't what you wanted, *don't
approve* — type feedback instead, and the Architect plans again (up to three loops).
This is the human-in-the-loop promise in its purest form: nothing gets built until
the strategy is one you signed off on.

When the plan looks right, approve it. `/jkz:plan` stops here — it does **not** roll
into building. That's the difference from `/jkz:pipeline`: the phase boundary is a
hard stop you cross by typing the next command.

## Step 4 — Build it with `/jkz:build`

```text
/jkz:build 214
```

The Builder implements the approved plan inside an isolated worktree and opens the PR.
A CodeRabbit pre-scan and fix loop clean up the obvious issues, and the pre-push
validators run their deterministic checks (secrets, debug statements, invariants):

```text
BUILD
  jkz:builder    opened PR #215 — feat: add --json output mode (Closes #214)
  coderabbit     pre-scan: 1 finding (missing test for empty input) — fixed
  validators     PASS — no secrets, no debug leftovers, invariants hold
```

Again it stops. You now have a PR with the implementation on it, but no review
verdict yet. Take a look at the diff if you like — `gh pr diff 215` — before moving on.

## Step 5 — Review it with `/jkz:review`

```text
/jkz:review 214
```

The **Judge** reviews the diff against the approved plan, and the **Inspector**
verifies it:

```text
REVIEW
  jkz:judge      PASS — diff matches the plan; JSON schema matches what was approved
  jkz:inspector  PASS — both tests present and meaningful; default output unchanged

  >>> REVIEW CHECKPOINT
  PR #215 passed review. For a feature, QA is required.
  ✅ run QA   ⏭ skip QA   🛑 stop
```

If a reviewer returns **FAIL**, you don't fix it by hand — the Doctor applies a
targeted patch and the review re-runs, up to three times. If it still can't get a
clean pass, it stops at `jkz:blocked` and escalates to you with an honest diagnosis
rather than forcing a fix that hides the problem.

Because this is a `feature`, QA is required — so we run it. (For a `bug`, `refactor`,
or `chore` you could skip QA and go straight to approval here.)

## Step 6 — QA it with `/jkz:qa`

```text
/jkz:qa 214
```

**Lens** (frontend, visual, accessibility) and **Sentinel** (backend, security,
performance) run in parallel:

```text
QA
  jkz:lens       PASS — N/A for a CLI flag; no web surface touched
  jkz:sentinel   PASS — no injection risk in the JSON encoder; no new attack surface

  >>> QA CHECKPOINT
  PR #215 is approved and ready for merge.
```

Same fix loop applies: a FAIL routes to the Doctor, up to three times, before
escalating. When QA passes, the PR is approved.

## Step 7 — Merge it yourself

jkz never merges for you — that's the core promise. Merge through the server-side
gate with your passphrase:

```bash
gh workflow run approve-merge.yml -f pr=215 -f passphrase=<your-passphrase>
```

The merge gate refuses to merge without the passphrase (a GitHub Secret that Claude
Code cannot read), so even a misbehaving agent can't push to `main`. The workflow
verifies the passphrase, the PR merges, and the issue closes automatically via the
`Closes #214` keyword.

## What just happened

- You ran the pipeline **one phase at a time** — `/jkz:plan`, `/jkz:build`,
  `/jkz:review`, `/jkz:qa`, then merge — instead of letting `/jkz:pipeline` advance
  for you. Each command stopped at its phase boundary.
- The **plan checkpoint** was a real decision: you read the strategy and approved it
  before a single line was written. That's the difference between this route and the
  autonomous one — you crossed every boundary deliberately.
- Adversarial and validator backends challenged the work at each phase; the system
  was free to self-correct up to three times, then would have escalated honestly
  rather than hidden a problem.
- Nothing reached `main` without your passphrase through the merge gate.

## When to drive phases by hand vs. autonomously

Running phase-by-phase like this is the right move when you want to **inspect or
intervene between phases** — review the diff before QA, re-plan after seeing the
build, or stop after review for a change that doesn't need QA. Once you trust the
loop and just want the result, `/jkz:pipeline` runs the same phases back-to-back and
only pauses at the plan and the merge. The phases are identical either way; the
difference is how many times *you* get the wheel.

## Next steps

- [An ad-hoc fix without the full pipeline](/get-started/ad-hoc-fix/) — the
  lightweight path for changes too small to plan.
- [Run a pipeline](/build/run-a-pipeline/) — the operator's reference for the
  autonomous `/jkz:pipeline`, with the full phase/checkpoint diagram.
- [How jkz works](/get-started/how-jkz-works/) — the three phases, the twelve roles,
  and the deliberation loop in detail.

Stuck mid-run? `/jkz:status` shows where issue `214` sits right now, and
`/jkz:resume 214` picks a stalled run back up from its last phase.
