---
title: Quickstart
description: Install jkz, run your first pipeline, and ship a change end-to-end.
---

This is the shortest honest path from "I just installed jkz" to "I shipped a small
change through the full pipeline and merged it myself." It takes a few focused
minutes of your time plus some waiting while the agents deliberate. Pick a tiny,
low-risk change for your first run — the point is to see the pipeline in action, not to ship
something important.

:::note[About the outputs below]
Command outputs are **illustrative**. jkz wraps live models and external backends,
so exact wording, token counts, and timings drift from run to run. The *shape*
(which agent speaks, in what order, and what gates you hit) is stable. Treat the
snippets as "what you'll roughly see," not byte-for-byte transcripts.
:::

## Prerequisites

Three things, honestly:

- **Claude Code CLI**, signed in. jkz runs as a plugin inside Claude Code — it is
  the orchestrator.
- **`gh` (GitHub CLI), authenticated.** Run `gh auth status` and confirm you can
  read and write issues and pull requests on the repo you'll test against. The
  whole pipeline uses GitHub as its source of truth: issues, labels, PR comments.
- **A repo you can safely open a throwaway PR against.** Your own sandbox repo is
  ideal. You need push access and the ability to merge.

You do **not** need every external backend configured to do a first run, but a
complete pipeline expects an adversarial backend (for the Auditor, Judge, and
Sentinel roles). Without one, those reviews are skipped and the system tells you
so — that's a degraded run, not a failure.

## Install and set up jkz

Install once, globally:

```bash
curl -fsSL https://raw.githubusercontent.com/j0KZ/jkz_Multi-Agent_System/main/install.sh | bash
```

Reopen your terminal so `jkz` is on your `PATH`, then run the setup wizard and
drop the plugin into your project:

```bash
jkz install        # wizard: API keys, notifications, model/backend choices
jkz init           # installs the plugin into the current directory
```

`jkz init` generates the plugin entrypoints, the GitHub workflows that enforce the
merge gate, and a local `state/` directory for pipeline bookkeeping.

Verify the install from inside Claude Code:

```text
/jkz:health
```

```text
=== jkz Health ===
[OK] Claude Code CLI         2.1.x
[OK] gh CLI                  authenticated
[OK] Node.js                 22.x
[OK] Plugin commands         loaded (/jkz:* available)
[WARN] Some CLIs have updates available
=== Ready ===
```

If `/jkz:health` reports the commands are loaded and `gh` is authenticated, you're
ready. (`/jkz:health --fix` updates outdated CLIs; `--deep` also checks auth, MCP,
and notifications.)

## Step 1 — Pick a small issue

Choose something genuinely small and reversible. Good first targets:

- Fix a typo in a README or doc comment.
- Add a missing `alt` attribute to one image.
- Rename a single flag or constant for clarity.

The smaller the change, the faster every phase runs and the cheaper the model
calls. Save the ambitious refactor for after you trust the loop.

## Step 2 — Describe it with `/jkz:start`

`/jkz:start` is the conversational front door. Run it with no arguments; it asks
what you want to do, then does the thinking:

```text
/jkz:start
```

```text
> Describe what you want to do. It can be a vague idea, a bug, a feature.

you: the footer logo is missing alt text, screen readers skip it

[triage]     complexity: quick   confidence: high
[duplicates] no open jkz:ready issue matches — creating a new one
[brief]      type: chore · scope: 1 file · adds alt="jkz logo" to footer image

Created issue #128 — chore: add alt text to footer logo
Recommended: /jkz:quick 128   (small, scoped — lightweight pipeline)
```

The orchestrator triages the idea (trivial / quick / standard),
checks for a duplicate open issue, writes a short brief, creates the GitHub issue
with the right type and complexity labels, and recommends a route. Trivial things
it offers to just fix inline — no issue, no ceremony.

For this walkthrough we'll take the **full** pipeline so you see every phase, even
though a one-line change would normally route to `/jkz:quick`.

## Step 3 — Run the pipeline

```text
/jkz:pipeline 128
```

`/jkz:pipeline` runs all three phases autonomously and pauses at exactly two human
checkpoints: **plan approval** and **merge**. Everything between them is the agents
working and checking each other.

```text
PLAN
  jkz:architect  drafting plan… 1 file, add alt attribute
  jkz:auditor    challenge: confirm alt text is descriptive, not just "logo"
  jkz:curator    PASS — plan is minimal and correct

  >>> CHECKPOINT 1: approve the plan?  [the plan is printed in full here]
```

This is your first decision. The plan is the artifact under review, so it's shown
in full — read it, then approve (or send it back for another iteration; planning
loops up to three times on its own). Approve, and the build phase starts:

```text
BUILD
  jkz:builder    opened PR #129 — chore: add alt text to footer logo (Closes #128)
  coderabbit     pre-scan: 0 actionable findings
  jkz:judge      PASS — diff matches the approved plan, alt text is descriptive
  jkz:inspector  PASS — change verified, no regressions

QA
  jkz:lens       PASS — renders correctly, accessibility check passes
  jkz:sentinel   PASS — no security or operational concerns

  >>> CHECKPOINT 2: PR #129 is approved and ready for merge.
```

If a reviewer returns **FAIL**, you don't have to do anything: the Doctor role
applies a fix and the phase re-runs, up to three times. If it still can't get a
clean pass, the pipeline stops at `jkz:blocked` and escalates to you with an
honest diagnosis rather than forcing a fix that hides the problem.

A realistic heads-up on **time and cost**: a standard pipeline makes several model
calls per phase across multiple roles, so a full run takes minutes, not seconds,
and the external backends bill per call. The smaller your change, the less of
both. jkz posts a cost breakdown comment on the PR so you can see what a run
actually cost.

## Step 4 — The human checkpoint and merge

jkz never merges for you. That's the core promise: the system iterates, but the
last step is always yours. When the PR is approved, merge it through the gate:

```bash
gh workflow run approve-merge.yml -f pr=129 -f passphrase=<your-passphrase>
```

The merge gate is a server-side workflow that refuses to merge without your
passphrase — so even a misbehaving agent or a stray command cannot push to `main`.
Run the command, the workflow verifies the passphrase, and the PR merges. The
issue closes automatically via the `Closes #128` keyword in the PR body.

## What just happened

- You described an idea in plain language; `/jkz:start` turned it into a labeled,
  scoped GitHub issue.
- `/jkz:pipeline` drove it through **plan → build → QA**, with an adversarial
  backend trying to break the work and a validator confirming at each phase.
- Every handoff happened through GitHub — the PR, its comments, and labels are the
  full audit trail. Agents never talked to each other directly.
- The system was allowed to iterate and self-correct up to three times per phase,
  but it stopped and asked **you** at the two decisions that matter: approving the
  plan and authorizing the merge.
- Nothing reached `main` without your passphrase through the merge gate.

## Next steps

- [Why jkz?](/get-started/why-jkz/) — the problem it solves and the constraints
  behind the design.
- [How jkz works](/get-started/how-jkz-works/) — the three phases, the twelve
  roles, and the deliberation loop in detail.
- [Run a pipeline](/build/run-a-pipeline/) — the day-to-day once you know the shape.
- [Architecture](/reference/architecture/) — phase boundaries, roles, and model
  routing for the full picture.

Stuck? `/jkz:status` shows where any issue is in the pipeline, and `/jkz:resume`
picks a stalled run back up from where it left off.
