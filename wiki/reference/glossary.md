---
title: Glossary
description: Canonical system vocabulary — agents, signals, phases, and pipeline mechanisms, ordered alphabetically.
---

The canonical vocabulary of the system. Terms are ordered alphabetically. When a word in a definition is itself a defined term, you will find it in its own entry.

:::note[Source of truth]
This page summarizes the glossary for public reference. The authoritative version lives in the private repo at `docs/glossary.md`.
:::

## ADR (Architecture Decision Record)

A document that records a design decision with its context, rationale, and consequences. MADR format. Located in `docs/decisions/`.

## adversarial (`kind: adversarial`)

Classification for agents whose function is to challenge and criticize the output of creative agents. Roles in the development pipeline: Auditor, Judge, Sentinel. In the research pipeline: Research-Auditor. Their verdicts require Level&nbsp;1 or Level&nbsp;2 evidence (see *Evidence Hierarchy*). The opposite of `creative`.

## Ambiguity Gate

An inline checkpoint (run by Opus) that classifies plan ambiguities as `TRIVIAL`, `FIX`, or `DECIDE`. Only `DECIDE` requires a human choice. Fail-open: if Opus fails, the pipeline continues.

## Architect

Opus agent (`kind: creative`) responsible for generating the technical plan in the PLAN phase. Emits the `compact-plan` and `jkz:adr-json` signals.

## Auditor

Adversarial agent (`kind: adversarial`) that challenges the Architect's plan in planning. High effort.

## Builder

Opus agent (`kind: creative`) that implements code in an isolated worktree. `xhigh` effort.

## checkpoint

Saved progress state within a phase. Two variants:

- **Worktree checkpoint** (`<worktree>/.jkz-checkpoint`): stage within build — `planning`, `implementing`, `tested`, `committed`, `cr_prepush_complete`, `validators_complete`, `pushed`, `pr_created`.
- **Pipeline checkpoint** (`checkpoint_step` in `state/pipeline/<issue>.json`): the last completed step within the current phase, used by resume to continue without repeating work.

## circuit breaker

A mechanism that stops calling an external service after N consecutive failures. States: `open` (blocked), `half-open` (one test request allowed), `closed` (normal). Auto-resets after 5 minutes. State in `state/circuit/<service>.json`.

## compact-plan

An HTML signal emitted by the Architect inside a PR comment (`<!-- jkz:compact-plan {...} -->`). Carries acceptance criteria and steps in compact form (~250 tokens versus ~700 for the narrative plan), reducing token consumption in later phases.

## complexity

Issue classification that determines pipeline routing.

| Value | Routing |
|-------|---------|
| `trivial` | Direct — Opus resolves in chat without plan/review. |
| `quick` | Builder + Judge (quick pipeline). |
| `standard` | Full pipeline (Plan → Build → Review → QA). |

Calculated by `scripts/classify-issue.js` (LLM primary via Haiku, deterministic fallback). Each result carries a `confidence` level (`high`/`medium`/`low`).

## continuation turn

A condensed prompt sent to the Doctor in iteration 2+ of the fix cycle. Omits low-value sections (similar past fixes, finding history) while retaining all critical context.

## CR (CodeRabbit)

An automatic code-review tool that produces findings categorized by severity. Integrated in the build pre-push scan and in the finding-correction loop. Finding categories: `VALID`, `FALSE_POSITIVE`, `OUT_OF_SCOPE`, `ALREADY_FIXED`, `LOW_SIGNAL`.

## creative (`kind: creative`)

Classification for constructive agents (model: Claude Opus). Roles in development: Architect, Builder, Doctor. In research: Analyst. The opposite of `adversarial`.

## Curator

Validator agent (`kind: validator`) that reviews the Architect's plan after the Auditor in the PLAN phase.

## deliberation

The complete output from an agent, including the verdict-json, TL;DR, and full analysis. Persisted in `state/deliberations/<issue>-<role>-<iter>.json`.

## Doctor

Opus agent (`kind: creative`) that fixes code which failed review or QA. Maximum 3 iterations per phase; iteration 2+ receives a condensed *continuation turn*.

## effort

The level of cognitive effort per role. For Opus, configured in agent frontmatter; for external wrappers, mapped to `model_reasoning_effort`.

| Value | Roles | When |
|-------|-------|------|
| `high` | Architect, Analyst, Auditor, Research-Auditor | Default. |
| `xhigh` | Builder, Doctor | Default. `/jkz:fix` lowers the Doctor to `high` on attempt 3 or `wrong_approach`. |

## Evidence Hierarchy

The framework for evaluating arguments between agents.

| Level | Type | Example |
|-------|------|---------|
| L1 | Execution | Output from tests, linters, commands. |
| L2 | File citation | Code from the repo with path and line. |
| L3 | Reasoning | A logical argument without direct evidence. |

`adversarial` roles require L1 or L2 to issue a PASS.

## Inspector

Validator agent (`kind: validator`) that reviews code in the REVIEW phase, in parallel with the Judge.

## issue_type

The issue type that adjusts pipeline behavior in plan, review, and QA.

| Value | Label | Plan focus |
|-------|-------|------------|
| `feature` | (none) | Implementation design. |
| `bug` | `bug` | Root cause analysis. |
| `refactor` | `refactor` | Current → target state. |

Detection: pipeline state → GitHub label → default `feature`.

## Judge

Adversarial agent (`kind: adversarial`) that reviews code in the REVIEW phase.

## kind

The frontmatter field that classifies each agent's role: `creative`, `adversarial`, `validator`, `utility`. Centralized in `scripts/agent-kind.js`.

## Lens

Validator agent (`kind: validator`) that participates in the QA phase, in parallel with Sentinel.

## loop guard

A mechanism that detects whether the Doctor is repeating the same fix. Compares SHA256 (exact) and Jaccard similarity >80% (near-duplicate) between consecutive diffs. Advisory only — it injects a warning but does not block.

## merge gate

The set of 4 enforcement layers that guarantee only a human can merge PRs: `merge-gate.yml` (pending status), `approve-merge.yml` (passphrase), `auto-revert.yml` (revert in ~30s), and a destructive-action guard hook.

## Orchestrator

Claude Code acting as the pipeline director. It does not generate or evaluate code directly — it coordinates the other agents via commands. Profile: `agents/orchestrator.md`.

## pattern

A reusable observation extracted from previous deliberations. Persisted in `state/memory.db` (SQLite) with a decaying relevance score, then re-injected into future prompts. Budget: 800 tokens for adversarials, 500 for creatives.

## phase

A pipeline stage, represented as a GitHub label:

```text
jkz:ready → jkz:planning → jkz:building → jkz:reviewing ←→ jkz:fixing → jkz:qa ←→ jkz:fixing
                                                                                   ↘ jkz:blocked
                                          jkz:approved ←─────────────────────────── jkz:qa (PASS)
```

`jkz:fixing` is the active state while the Doctor corrects. It transitions from `jkz:reviewing` or `jkz:qa` on FAIL and returns to the origin state after the fix.

## pipeline_run_id

A unique identifier for a complete pipeline run, formatted `run-<issue>-<timestamp>-<hash>`. Used to correlate traces in LangFuse.

## postmortem

A document generated by `scripts/postmortem-generate.js` when the pipeline reaches `jkz:blocked`. Includes an event timeline, failure pattern, and 5-whys template.

## pre-validated checks

Deterministic checks (no AI) that run on the diff before push via `scripts/validators/run.js`, generating L1 evidence for Judge and Sentinel. See [Validators](/reference/validators/).

## prompt rewriting

When the Doctor in iteration 2+ determines `wrong_approach`, the Architect rewrites the plan before the next fix attempt. Maximum 1 rewrite per pipeline.

## resolve-wrapper

The script that routes external agent invocations. Cascade: `JKZ_<ROLE>_ENDPOINT` → `api-wrapper.sh`, otherwise the native CLI. Always invoked via `node scripts/run.js resolve-wrapper.sh`.

## Sentinel

Adversarial agent (`kind: adversarial`) in the QA phase, in parallel with Lens. Always receives the full diff — it needs dependency context for security analysis.

## signal

A structured message emitted by an agent inside an HTML comment in the PR, parseable by the Orchestrator without reading the narrative text.

| Signal | Emitted by | Content |
|--------|------------|---------|
| `jkz:verdict-json` | All adversarial/validator agents | The agent's final verdict. |
| `jkz:compact-plan` | Architect | Compressed plan with acceptance criteria. |
| `jkz:propose-issue` | Any agent | A GitHub issue proposal. |
| `jkz:adr-json` | Architect | An architectural decision to extract as an ADR. |

## smart resume

Automatic diagnosis of pipeline interruptions, classifying state into `crash`, `fail`, `blocked`, `running`, `stopped`, or `completed` and determining the exact resume point. Script: `scripts/resume-diagnose.js`.

## step-gate

A mechanism that verifies dependent steps completed before advancing, preventing crash recovery from skipping mandatory steps. Script: `scripts/step-gate.js`.

## STRIDE

A threat-modeling framework with six categories: Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege. Conditionally injected into Architect and Sentinel prompts when the issue carries security labels or keywords.

## validator (`kind: validator`)

Classification for agents whose function is to validate quality. Roles in development: Curator, Inspector, Lens. In research: Research-Reviewer. It complements `adversarial`: the validator verifies the work meets the criteria; the adversarial actively seeks flaws.

## vault

Persistent storage for future-project ideas. SQLite at `~/.jkz/state/vault.db`, kept separate from the repository so it survives branch changes.

## verdict-json

The primary signal emitted by adversarial and validator agents at the end of their deliberation:

```html
<!-- jkz:verdict-json
{
  "verdict": "PASS|FAIL",
  "issues": [
    {
      "id": "J1",
      "severity": "CRITICAL|HIGH",
      "summary": "<=15 words",
      "location": "path/to/file.ts:42",
      "root_cause": "<classification>",
      "fix_hint": "<=15 words"
    }
  ],
  "must_fix": ["J1"],
  "false_positives": []
}
-->
```

Only CRITICAL and HIGH issues are included in `issues[]`; MEDIUM/LOW are omitted for compactness.

## worktree

An isolated copy of the repository created by `scripts/worktree.sh` so the Builder can work without affecting the main repository. Located at `../jkz-worktree-<issue>`, with its progress checkpoint at `.jkz-checkpoint`.

## Related

- [Scripts](/reference/scripts/) — the scripts named throughout these definitions.
- [Validators](/reference/validators/) — the pre-validated checks in detail.
- [Labels](/reference/labels/) — ownership and transitions for the phase and agent labels above.
