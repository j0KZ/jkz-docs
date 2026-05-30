---
title: CLI / commands
description: The /jkz:* slash commands — what each does, when to reach for it, and which models run the work behind it.
---

Every jkz workflow is a slash command typed inside Claude Code. The command is the *verb*; the models behind it are the *workers*. One verb, one action, one owner — there is no ambiguity about what a command does or which model executes it.

Across all commands the **orchestrator is Claude Code (Opus)**: it reads your intent, routes the work, and is the only thing that ever talks to you. The roles a command dispatches determine which other models do the actual work, following the pipeline's three model classes:

| Class | Models | Roles |
|-------|--------|-------|
| **creative** | Claude Opus | Architect, Builder, Doctor, Analyst |
| **adversarial** | External backend (configurable per role) | Auditor, Judge, Sentinel, Research-Auditor |
| **validator** | External / Ollama Cloud / Gemini | Curator, Inspector, Lens, Research-Reviewer |
| **utility** | Claude Haiku | Librarian, Classifier |

One model sits outside the class table: **Claude Sonnet** is the execution runtime for `/jkz:e2e`, driving the agent-browser to run the scenarios Opus generates.

The pattern in every phase: **Opus creates → an adversarial backend challenges → a validator backend confirms.** Agents never talk to each other — every handoff is a Git artifact.

:::note[Source of truth]
This page summarizes the commands for public reference. The authoritative, always-current table lives in the private repo at `docs/architecture-reference.md`. Telegram-bot commands and MCP servers are documented there.
:::

## Pipeline — core

The full plan → build → review → QA loop. Each phase iterates on its own up to three times, but only a human merges.

| Command | What it does | When to use | Models |
|---------|--------------|-------------|--------|
| `build` | Builder implements the approved plan in an isolated worktree and opens the PR. | After a plan is approved. | Opus (Builder) |
| `fix` | Doctor applies minimal targeted fixes for a failing verdict (up to 3 retries). | When Judge, Inspector, Lens, or Sentinel returns FAIL. | Opus (Doctor) |
| `pipeline` | Autonomous run: plan → build → review → QA with approval checkpoints. | The default for a standard-complexity issue you want driven end to end. | All roles below |
| `plan` | Planning phase: Architect drafts, Auditor challenges, Curator validates (up to 3x). | Before any code — to design the implementation strategy and reach a human checkpoint. | Opus (Architect), adversarial (Auditor), validator (Curator) |
| `qa` | Lens (frontend / a11y) and Sentinel (backend / security) review in parallel. | Required for `feature` issues; optional for `bug` / `refactor` / `chore`. | Validator (Lens), adversarial (Sentinel) |
| `quick` | Lightweight pipeline: Builder + Judge, no plan or QA. | Trivial / quick-complexity fixes that don't warrant the full loop. | Opus (Builder), adversarial (Judge) |
| `resume` | Diagnoses and resumes an interrupted pipeline (crash, stop, fail). | After a session ends mid-run or a pipeline stalls. | Claude Code (Opus) |
| `review` | CodeRabbit pre-scan, then Judge reviews and Inspector verifies the PR diff. | After the build, before QA. | Adversarial (Judge), validator (Inspector), CodeRabbit |

## Entry & intake

Turn an idea into a routed pipeline, or inspect what's in flight.

| Command | What it does | When to use | Models |
|---------|--------------|-------------|--------|
| `issue` | Creates a GitHub issue from a plan or free text, with type detection. | To scaffold a structured issue body from an existing plan. | Claude Code (Opus), Classifier (Haiku) |
| `refine` | Explores the codebase, asks contextual questions, produces a refined brief. | When an idea needs grounding in the actual code before becoming an issue. | Claude Code (Opus) |
| `start` | Conversation → brief → GitHub issue → pipeline, with complexity-based routing. | Starting from a raw idea rather than an existing issue. | Claude Code (Opus), Classifier (Haiku) |
| `status` | Reports the current pipeline status. | To check which phase an issue is in. | Claude Code (Opus) |

## Code quality

On-demand quality passes over recently changed code. None of these gate the pipeline.

| Command | What it does | When to use | Models |
|---------|--------------|-------------|--------|
| `bugs` | Bug finder at three levels: quick (deterministic), deep (+tests, +Opus), full (+ adversarial). | To hunt for bugs at a depth you choose. | Deterministic / Opus / adversarial |
| `cr-fix` | CodeRabbit CLI loop: fix → re-scan until convergence. | To resolve CodeRabbit findings on a PR. | CodeRabbit, Claude Code (Opus) |
| `deslop` | Removes AI writing patterns from text files. | When prose reads machine-generated. | Claude Code (Opus) |
| `dev-self-review` | Pre-PR self-review for internal consistency across changed files. | Before pushing, to catch cross-file drift. | Claude Code (Opus) |
| `perf-audit` | Performance audit with three strict criteria (needle-moving, isomorphic, clear path). | To evaluate a change's real performance impact. | Claude Code (Opus) |
| `quality` | Project quality scan (code smells, patterns, consistency). | For a broad sweep of the codebase, not a single diff. | Claude Code (Opus) |
| `simplify` | Simplifies recently modified code (reuse, quality, efficiency). | Before opening a PR, to trim accidental complexity. | Claude Code (Opus) |

## Audit, health & analytics

| Command | What it does | When to use | Models |
|---------|--------------|-------------|--------|
| `deps` | Proactive dependency audit (vulnerabilities, outdated, licenses). | Periodically, or before a release. | Claude Code (Opus) |
| `e2e` | E2E tests: Opus generates scenarios, Sonnet executes via agent-browser (advisory). | Manual end-to-end validation of a feature. | Opus (generate), Sonnet (execute) |
| `health` | Health check: CLI versions, changelogs, insights, optional auto-fix. | To verify the toolchain is current and healthy. | Claude Code (Opus) |
| `insights` | Analytics on agent deliberations. | To review how the agents have been deciding over time. | Claude Code (Opus) |

## Research, knowledge & session

| Command | What it does | When to use | Models |
|---------|--------------|-------------|--------|
| `debate` | On-demand adversarial debate between 2–3 models. | To stress-test a decision from multiple model perspectives. | 2–3 configured models |
| `load` | Loads context from the previous session and summarizes it. | When resuming work in a new chat. | Claude Code (Opus) |
| `quit` | Orderly shutdown: runs `/jkz:save` and deregisters the chat. | To end a session cleanly. | Claude Code (Opus) |
| `research` | Financial research pipeline: SCOPE → RESEARCH → AUDIT → OUTPUT. | For quantitative research with cited claims. | Opus (Analyst), adversarial, validator |
| `save` | Saves session context (snapshot + reasoning) for cross-chat continuity. | Before stepping away from a session. | Claude Code (Opus) |
| `vault` | List, search, and display researched ideas. | To park or retrieve ideas for later. | Claude Code (Opus) |

## How issue type changes a command

A command's behavior shifts with the issue's type label:

| Type | Label | Plan focus | Review focus | QA |
|------|-------|-----------|--------------|-----|
| `feature` | (none) | Implementation design | Code quality | Required |
| `bug` | `bug` | Root-cause analysis | Fix correctness | Optional |
| `refactor` | `refactor` | Current → target state | Behavior preserved | Optional |
| `chore` | `chore` | Mechanical change | No behavior shift | Optional |
