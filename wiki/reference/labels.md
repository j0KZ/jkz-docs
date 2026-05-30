---
title: Labels
description: GitHub label ownership and transitions — who adds each label, who may remove it, and the legal phase transitions.
---

Every label in the system has an owner: the command or script that adds it. The core rule keeps concurrent agents from stepping on each other:

> **If you didn't add it, don't remove it.** Only the owner — or the Orchestrator — may remove a label.

The one exception: `orchestrate.sh transition` clears all agent labels on every phase change, giving each new phase a clean slate.

:::note[Source of truth]
This page summarizes label ownership for public reference. The authoritative version lives in the private repo at `docs/LABEL-OWNERSHIP.md`.
:::

## Phase labels

| Label | Who adds it | Who removes it | Legal transitions |
|-------|-------------|----------------|-------------------|
| `jkz:ready` | Human or the triage workflow | `orchestrate.sh transition` | → `jkz:planning`, → `jkz:building` (quick mode) |
| `jkz:planning` | Plan command | `orchestrate.sh transition` | → `jkz:planning` (iteration), → `jkz:building`, → `jkz:blocked` (decomposition) |
| `jkz:building` | Build command | `orchestrate.sh transition` | → `jkz:reviewing` |
| `jkz:reviewing` | Build, quick, or fix command | `orchestrate.sh transition` | → `jkz:qa`, → `jkz:approved` (quick mode), → `jkz:fixing` |
| `jkz:qa` | Review command | `orchestrate.sh transition` | → `jkz:approved`, → `jkz:fixing` |
| `jkz:fixing` | Review or QA command | `orchestrate.sh transition` | → `jkz:reviewing`, → `jkz:qa`, → `jkz:blocked` |
| `jkz:approved` | QA command | Human (on merge) | → *(merged)* |
| `jkz:blocked` | Fix or plan command (3 attempts or decomposition) | Human (intervention) | → *(any — human decides)* |
| `jkz:pipeline` | Pipeline command (INIT) | Pipeline command (COMPLETION) | Accompanies the active phase during the autonomous pipeline |

## Agent labels

| Label | Who adds it | Who removes it | Active phase |
|-------|-------------|----------------|--------------|
| `jkz:architect` | Plan command | Plan command or orchestrate transition | PLAN |
| `jkz:auditor` | Plan command | Plan command or orchestrate transition | PLAN |
| `jkz:curator` | Plan command | Plan command or orchestrate transition | PLAN |
| `jkz:builder` | Build command | orchestrate transition | BUILD |
| `jkz:judge` | Review command | Review command or orchestrate transition | REVIEW |
| `jkz:inspector` | Review command | Review command or orchestrate transition | REVIEW |
| `jkz:doctor` | Fix command | Fix command or orchestrate transition | FIX |
| `jkz:lens` | QA command | QA command or orchestrate transition | QA |
| `jkz:sentinel` | QA command | QA command or orchestrate transition | QA |

## Automation labels

| Label | Who adds it | Who removes it | When |
|-------|-------------|----------------|------|
| `jkz:regression` | `monitor.sh` via GitHub Actions (daily cron or push to main) | Human on issue close | When health-check, mcp-build, unit-tests, or npm-audit fail in CI. Created with deduplication; outside the normal pipeline flow. |

## Wiki Generator labels

| Label | Who adds it | Who removes it | When |
|-------|-------------|----------------|------|
| `docs-worthy` | Human (manual triage) | Human | Applied to issues whose body/comments are worth ingesting by the wiki-generator. Read-only from the pipeline's perspective. |

## Research labels

| Label | Who adds it | Who removes it | When |
|-------|-------------|----------------|------|
| `jkz:research-pending` | Human, `research-suggest.js`, or the Telegram bot | The research-label-validate workflow (on rejection) or the research poller (on completion or runtime failure) | Enqueues a research issue for body validation and polling. |
| `jkz:research-rejected` | The research-label-validate workflow | Human | When the issue body fails `jkz:research-pending` format validation. |
| `jkz:research-done` | The research poller | Human | When the research issue is processed successfully. |
| `jkz:research-failed` | The research poller | Human | When research issue processing fails or times out at runtime. |

## Type labels

| Label | Who adds it | Who removes it | When |
|-------|-------------|----------------|------|
| `bug` | Start or issue command | Never (type is immutable) | When the issue is classified as a bug fix. |
| `refactor` | Start or issue command | Never (type is immutable) | When the issue is classified as a refactor. |
| `chore` | Start or issue command | Never (type is immutable) | When the issue is classified as a mechanical change. |

Type labels are set once at issue creation. They flow through the pipeline to bias agent prompts and PR prefixes. When co-labeled, the rule is `chore + X → X wins`: `chore` is the most conservative type, so `bug` or `refactor` overrides it.

## How `orchestrate.sh transition` works

Running `transition <from> <to>`:

1. Validates the postconditions of the source phase (skippable with `--force`).
2. Removes **all** agent labels (clean slate).
3. Removes the `<from>` label.
4. Adds the `<to>` label.
5. Updates `state/STATE.json`.

This guarantees that, on entry to a new phase, no residual agent labels remain.

## A note on PR review

In this single-account system, `gh pr review --approve` is not used — GitHub does not allow approving your own PRs. All feedback flows via PR comments, and state transitions happen through labels.

## Related

- [Glossary](/reference/glossary/) — see *phase* and *merge gate*.
- [CLI / commands](/reference/cli/) — the commands that own these labels.
