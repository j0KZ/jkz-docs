---
title: Builder
description: The creative role that implements an approved plan inside an isolated worktree and opens the pull request — Claude Opus, worktree-only writes, never merges.
---

The **Builder** is where a plan becomes code. It takes the strategy the [Architect](/agents/architect/) designed and the [Auditor](/agents/auditor/) and [Curator](/agents/curator/) signed off on, and it implements it faithfully inside an isolated worktree — then opens the pull request that every later role reviews.

The Builder does not make architectural decisions. Those were made in planning. Its discipline is execution: implement the plan exactly, match the existing style, and report any deviation honestly rather than quietly improving things it was not asked to touch.

## Model & backend

| Property | Value |
|----------|-------|
| Class | creative |
| Model | Claude Opus |
| Invocation | Task tool (`model: "opus"`) |
| Isolation | Its own worktree — writes are confined to the worktree, never the main checkout |
| Can open a PR | Yes |
| Can merge / push to `main` | No — blocked by capability invariants and the merge gate |

The Builder runs as a creative role: Opus drafts the work, and the adversarial and validator backends downstream challenge and confirm it. The model that writes the code is never the model that signs it off.

## Inputs

The Builder receives a Git-mediated brief, never a conversation with another agent:

- **Approved plan** — the plan that passed Architect → Auditor → Curator review.
- **Codebase context** — the current state of the files it will modify.
- **Issue description** — the original requirements. In [`/jkz:quick`](/reference/cli/) there is no Architect plan: the issue body *is* the plan, and the Builder implements it directly.
- **Worktree path** — the isolated worktree where it works.

## Outputs

- **The implementation** — production code committed in atomic commits, matching existing conventions.
- **A pull request** targeting `main`, with a `Closes #N` (or `Fixes #N`) keyword so the merge auto-closes the issue.
- **A build report** listing every file created, modified, or deleted, plus any deviations from the plan and confirmation that each acceptance criterion is addressed.
- **A structured verdict signal** (`jkz:verdict-json`) the orchestrator parses without reading the prose: `COMPLETE` or `BLOCKED`, the PR number, files changed, deviations, and the error-handling sites it introduced.

When a plan step is impossible (a file was renamed, an API changed, a dependency is missing), the Builder **stops and reports** rather than fabricating success. A `BLOCKED` verdict is a valid outcome, not a failure.

## Iteration limits

The Builder produces the first version of the diff. From there the build loop owns iteration: the [Judge](/agents/judge/) reviews, the [Inspector](/agents/inspector/) calibrates, and on a FAIL the [Doctor](/agents/doctor/) applies the fix — up to **three** fix cycles before the pipeline escalates to a human. The Builder is re-invoked only when an interrupted build needs to resume; it picks up from the first incomplete stage and never redoes committed work.

## See also

- [Judge](/agents/judge/) — reviews the Builder's diff as a chaos engineer.
- [Inspector](/agents/inspector/) — calibrates the Judge's findings on that diff.
- [Doctor](/agents/doctor/) — applies surgical fixes when the diff fails review.
- [How jkz works](/get-started/how-jkz-works/) — the Build phase in the full pipeline flow (the dedicated `/jkz:pipeline` end-to-end page lands in a later wiki pass).
- [CLI / commands](/reference/cli/) — `/jkz:build` and `/jkz:quick`, the commands that dispatch the Builder.
