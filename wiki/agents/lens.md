---
title: Lens
description: The QA-phase validator that owns the frontend — visual fidelity, multimodal output, and accessibility. Runs in parallel with Sentinel.
---

Lens is the eyes of QA. While [Sentinel](/agents/sentinel/) guards the backend, Lens owns everything the user actually sees: visual fidelity, layout across viewports, loading and empty states, and accessibility. A pixel off, an inconsistent padding, a missing loading indicator — these are not minor blemishes to Lens, they are signals about the care that went into the work. "Almost right" is not something it accepts.

Lens is a **reviewer, not an implementer**. It never plans, writes, or patches code. Its single output is a QA report with an explicit verdict.

## At a glance

| | |
|------|------|
| **Phase** | QA |
| **Class** | validator |
| **Backend** | Validator backend (Ollama Cloud `glm` by default; local Gemini CLI fallback when no endpoint is configured) |
| **Runs with** | [Sentinel](/agents/sentinel/), in parallel |
| **Fix loop** | A FAIL routes to the [Doctor](/agents/doctor/), up to 3× |
| **Invocation** | `node scripts/run.js resolve-wrapper.sh --role lens --pr <number>` |
| **Can merge** | No. Read-only; posts PR comments. |

The backend is configurable per role through `JKZ_LENS_ENDPOINT` / `JKZ_LENS_MODEL`. As a validator role, Lens falls back to a local Gemini CLI when no endpoint is set — it never blocks for want of a configured provider.

## Mission

Lens performs comprehensive quality assurance focused on **frontend, visual, multimodal, and accessibility** aspects of a pull request. It tests like a user — clicking through the actual flows rather than only reading the code — and treats any accessibility regression as automatically high severity. Its lane is strictly what the user sees and interacts with; backend correctness belongs to Sentinel.

When a change is a script with no frontend, Lens adapts: it assesses script correctness, edge cases, and the acceptance criteria instead of inventing visual findings.

## Inputs

Lens receives every artifact through Git — never a direct message from another agent:

- **PR diff** — all changes in the pull request.
- **Approved plan** — the original plan and its acceptance criteria.
- **Codebase context** — relevant files and the current UI state.
- **Screenshots / recordings** — when e2e visual QA is enabled (`JKZ_VISUAL_QA=1`), the orchestrator passes captured screenshots so Lens can inspect rendering, layout, and UI state natively.

## Outputs

Lens produces a single Markdown QA report, posted as a PR comment, with these sections:

- **TL;DR** — 2–4 bullets: the overall PASS/FAIL verdict plus the key critical, high, and (optionally) medium issues.
- **Frontend Assessment** — UI changes, layout across viewports, responsiveness, interactions, and loading / error / empty states.
- **Accessibility** — keyboard navigation, screen-reader support (ARIA roles and labels), WCAG AA color contrast, and focus management.
- **Visual Consistency** — adherence to the design system, typography, spacing, and theme variables over hardcoded values.
- **Acceptance Criteria** — each criterion marked PASS / FAIL / NOT TESTABLE, with the evidence used to verify it.
- **Issues Found** — per issue: severity, category, description, reproduction steps, expected vs. actual, and visual evidence.

### Verdict

Every report ends with an explicit, machine-parsed verdict:

- **PASS** — no critical or high issues. Ready for human review.
- **FAIL** — issues that must be fixed, listed. Routes to the Doctor.

## Where Lens fits

Lens runs in the QA phase, after the build's Judge → Inspector review passes. It executes alongside Sentinel and reports to the post-QA ambiguity gate before the human merge. See [How jkz works](/get-started/how-jkz-works/) for the QA phase in the context of the full pipeline, and [Sentinel](/agents/sentinel/) for its backend-and-security counterpart.
