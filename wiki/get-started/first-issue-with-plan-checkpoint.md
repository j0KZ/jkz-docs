---
title: Your first issue with a plan checkpoint
description: Drive an issue through jkz one phase at a time — plan, build, review, QA — and learn to read and approve the plan before any code is written.
---

The [Quickstart](/get-started/quickstart/) handed the whole run to `/jkz:pipeline`
and let it drive. This tutorial does the opposite: you run **one phase command at a
time**, and you stop at the plan before a single line of code exists. The point is
to feel the most important checkpoint in jkz — the moment you read a plan and decide
whether the agents understood the problem — instead of letting it flash by inside an
autonomous run.

By the end you'll have shipped a small change by hand through `/jkz:plan` →
`/jkz:build` → `/jkz:review` → `/jkz:qa` → merge, having approved the plan yourself.
Pick a tiny, low-risk change again; the goal is to learn the controls, not to ship
something important.

:::note[About the outputs below]
Command outputs are **illustrative**. jkz wraps live models and external backends,
so exact wording, token counts, and timings drift from run to run. The *shape* —
which agent speaks, in what order, and what gates you hit — is stable. Treat the
snippets as "what you'll roughly see," not byte-for-byte transcripts.
:::

## Before you start

You need the same setup as the [Quickstart](/get-started/quickstart/#prerequisites):
Claude Code signed in with jkz installed, `gh` authenticated against a repo you can
safely open a throwaway PR on, and (ideally) an adversarial backend configured so the
Auditor and Judge actually run. If `/jkz:health` is green, you're ready.

This tutorial assumes you've done a Quickstart run, or at least read it, so the
phases aren't brand new. One thing to keep straight as you go: **`/jkz:plan` and
`/jkz:build` take the issue number; `/jkz:review` and `/jkz:qa` take the PR number**
(the PR that `/jkz:build` opens).

## Step 1 — Create the issue

Every pipeline phase keys off a GitHub issue. Create one the conversational way:

```text
/jkz:start
```

```text
> Describe what you want to do. It can be a vague idea, a bug, a feature.

you: the CONTRIBUTING doc still points at the old `make test` target, it's `npm test` now

[triage]     complexity: quick   confidence: high
[brief]      type: chore · scope: 1 file · fix stale test command in CONTRIBUTING.md

Created issue #214 — chore: fix stale test command in CONTRIBUTING
Recommended: /jkz:quick 214
```

`/jkz:start` triages the idea (trivial / quick / standard), writes a short brief,
creates the labeled GitHub issue, and recommends a route. For something this small it
will usually point you at the lightweight `/jkz:quick`. **Ignore that on purpose** —
we want the full phase-by-phase path so you see the plan checkpoint you'd otherwise
skip. Note the issue number; we'll use `214` throughout.

## Step 2 — Plan it, then read the plan

This is the phase the autonomous pipeline rushes past. Run it on its own:

```text
/jkz:plan 214
```

`/jkz:plan` runs the Architect to draft a plan, an adversarial backend (the Auditor)
to challenge it, and a validator (the Curator) to confirm — looping up to three times
on its own — and then it **stops and shows you the plan in full**:

```text
PLAN
  jkz:architect  drafting plan…
  jkz:auditor    challenge: is CONTRIBUTING the only file with the stale target?
  jkz:architect  revised — grepped the repo, also fixes the CI badge link
  jkz:curator    PASS — scope is correct, change is minimal

  >>> CHECKPOINT: approve the plan?

  Plan for #214
  - Files: CONTRIBUTING.md (2 edits)
  - Change: replace `make test` → `npm test` (line 47); update the CI
    status badge target that referenced the old Makefile job (line 12)
  - Out of scope: the Makefile itself stays; a follow-up issue is suggested
  - Verify: `grep -n "make test" CONTRIBUTING.md` returns nothing; badge
    resolves to the npm-test workflow
```

Don't rubber-stamp it. This is the cheapest place in the whole system to catch a
misunderstanding — nothing has been built yet. Read the plan and ask yourself:

- **Scope** — does it touch only what you intended? Here the Auditor pushed the
  Architect to find a second stale reference. Good catch, but confirm you actually
  want the badge fix in the same change. If not, send it back.
- **Out of scope** — does the "won't do" list match your intent? The plan leaves the
  Makefile alone and suggests a follow-up. That's the right call for a doc fix.
- **Verification** — can you check the result objectively? A plan with a concrete
  `grep` you can run yourself is a plan you can trust.

You have two moves at the checkpoint:

- **Approve** — the plan becomes the contract the Builder and reviewers are held to.
- **Send it back** — reply with what's wrong ("drop the badge fix, that's a separate
  concern") and planning iterates again, up to three times. The loop is the point.

Approve when the plan reads like something you'd have written. Everything downstream
is measured against it.

## Step 3 — Build

With the plan approved, run the build phase against the **issue number**:

```text
/jkz:build 214
```

`/jkz:build` runs the Builder, which implements **exactly the approved plan** in an
isolated worktree, then pushes and opens a PR. CodeRabbit does a pre-scan on the way
out. Build does **not** review the change — that's the next phase.

```text
BUILD
  jkz:builder    implementing approved plan in isolated worktree…
  jkz:builder    opened PR #215 — chore: fix stale test command (Closes #214)
  coderabbit     pre-scan: 0 actionable findings

PR #215 opened. Not reviewed yet — run /jkz:review next.
```

The Builder cannot merge or push to `main`; it only works inside its worktree and
opens the PR. The PR body carries `Closes #214`, which is what auto-closes the issue
when the PR eventually merges. **Note the PR number (`215`) — the next two phases take
the PR, not the issue.**

## Step 4 — Review

Now review the PR. This phase takes the **PR number**:

```text
/jkz:review 215
```

`/jkz:review` runs the Judge to review the PR diff against your approved plan, then
the Inspector to validate the review:

```text
REVIEW
  jkz:judge      PASS — diff matches the approved plan, both edits present
  jkz:inspector  PASS — grep verification holds, no unrelated changes
```

Because the Judge compares the diff to *your* approved plan, "did it build the right
thing?" has an objective answer now. If the Builder had drifted — fixed the Makefile
you explicitly left out of scope — the Judge would catch the mismatch and return
**FAIL**, the Doctor would apply a targeted fix, and the phase would re-run, up to
three times. If review still can't reach a clean pass it stops at `jkz:blocked` and
escalates to you with an honest diagnosis rather than forcing a fix that hides the
problem.

## Step 5 — QA

QA is **required for a `feature` and optional for `bug` / `refactor` / `chore`**.
Our issue is a `chore`, so you could skip this — but running it once teaches you the
last gate. It also takes the **PR number**:

```text
/jkz:qa 215
```

```text
QA
  jkz:lens       PASS — renders correctly, links resolve
  jkz:sentinel   PASS — no security or operational concerns

  >>> CHECKPOINT: PR #215 is approved and ready for merge.
```

Lens and Sentinel run **in parallel** — one validates the change works as described,
the other looks for security and operational fallout. A doc fix sails through; a real
code change is where these two earn their keep. This is the final human checkpoint
before merge.

## Step 6 — Merge it yourself

jkz never merges for you. When the PR is approved, push it through the merge gate:

```bash
gh workflow run approve-merge.yml -f pr=215 -f passphrase=<your-passphrase>
```

The gate is a server-side workflow that refuses to merge without your passphrase, so
no agent and no stray command can reach `main` without you. The workflow verifies the
passphrase, merges the PR, and the issue closes automatically via the `Closes #214`
keyword in the PR body.

## What just happened

- You drove each phase by hand — `/jkz:plan 214`, `/jkz:build 214`, `/jkz:review 215`,
  `/jkz:qa 215` — instead of delegating the whole run to `/jkz:pipeline`. Plan and
  build keyed off the **issue**; review and QA keyed off the **PR** that build opened.
- You stopped at the **plan checkpoint** and approved the plan *before any code
  existed*. That's the cheapest place to catch a misunderstanding, and the autonomous
  pipeline blinks through it.
- Because you approved a concrete plan, the review phase had an objective question to
  answer: the Judge checked the diff against your plan, not against a vibe.
- Nothing reached `main` without your passphrase through the merge gate.

The trade-off is real: phase-by-phase gives you more control and more visibility at
the cost of more commands. Once the plan checkpoint feels familiar, `/jkz:pipeline`
runs these same phases and pauses at the same two decisions — plan and merge — with
less ceremony in between.

## Next steps

- [Run a pipeline](/build/run-a-pipeline/) — the day-to-day phase commands in full.
- [Lightweight routes](/build/lightweight-routes/) — `/jkz:quick` and trivial in-branch
  fixes for when a full plan checkpoint is overkill.
- [How jkz works](/get-started/how-jkz-works/) — the three phases, the twelve roles,
  and why the deliberation loop is shaped this way.

Stuck mid-run? `/jkz:status 214` shows where the issue is, and `/jkz:resume 214` picks
a stalled phase back up from where it left off.
