---
title: Signal format
description: How agents communicate without talking to each other — the Context Protocol that feeds them, the verdict-json block that carries every PASS/FAIL decision, and the issue-proposal marker for out-of-scope work.
---

The agents in a jkz pipeline never talk to each other directly. Everything an agent needs flows in through a structured prompt, and everything it decides flows out through structured markers the orchestrator can parse. This is what keeps the system auditable: every verdict is a machine-readable block in the pull request, not an opinion exchanged in a side channel. Three signal shapes carry almost all of that traffic.

## Context Protocol — how agents receive their inputs

Agents do not fetch their own context; the orchestrator gives it to them. *How* it does so depends on the kind of agent.

For **in-session model agents** (invoked through the Task tool), the orchestrator passes a list of file paths, not file contents:

```xml
<files_to_read>
  <required>
    <file>src/auth/middleware.ts</file>
    <file>state/pipeline/42-compact-plan.json</file>
  </required>
  <optional>
    <file>state/briefs/42-brief.md</file>
  </optional>
</files_to_read>
```

The agent reads the `required` files before acting (and reports a blocker if one is missing), reads the `optional` ones if they exist, and otherwise proceeds. Passing paths instead of contents keeps the orchestrator's own context window light while still giving the agent full-fidelity data.

For **wrapper-based agents** (the external adversarial and validator backends), the orchestrator inlines the actual content as a budgeted "context pack":

```text
=== CONTEXT PACK ===
--- PR DIFF (max 50KB) ---
<full diff>
--- PLAN (max 10KB) ---
<compact plan>
--- CODEBASE (max 20KB) ---
<relevant files>
--- PRIOR FEEDBACK (max 5KB) ---
<previous agent verdict>
=== END CONTEXT PACK ===
```

The sections are ordered by priority, and the budgets are hard caps — if the pack is too large, it is truncated from the bottom up, so the diff is the last thing to be cut.

## verdict-json — the primary signal

Every agent that renders a decision ends its report with a `verdict-json` block: an HTML comment the orchestrator parses to decide what happens next. It is emitted on *every* verdict, including a clean PASS (where the issues array is simply empty).

```html
<!-- jkz:verdict-json
{
  "verdict": "PASS|FAIL",
  "issues": [
    {
      "id": "J1",
      "severity": "CRITICAL|HIGH",
      "summary": "≤15 words",
      "location": "path/to/file.ts:42 or section name",
      "root_cause": "implementation_bug",
      "fix_hint": "≤15 words"
    }
  ],
  "must_fix": ["J1"],
  "false_positives": ["A1"]
}
-->
```

A few rules make these blocks reliable:

- **Only CRITICAL and HIGH** issues appear in `issues[]`. MEDIUM and LOW are omitted to keep the block compact.
- **A FAIL must name at least one `must_fix` id.** A FAIL with an empty `must_fix` is contradictory, and the orchestrator treats it as a PASS.
- **`false_positives` requires evidence** and is only meaningful for validator roles — it lets a validator flag findings from the prior adversarial agent that turned out to be noise.
- The block **must stay inside the HTML comment.** If it leaks outside, it shows up as visible text in the PR and breaks parsing.

The `id` carries a one-letter role prefix (`J` for Judge, `I` for Inspector, `L` for Lens, `S` for Sentinel) so a finding can always be traced back to who raised it. The optional `root_cause` classifies *why* something failed (an implementation bug, a missing validation, a security vulnerability, a test gap, and so on) rather than just what it looks like; when unsure, an agent omits it rather than guessing.

Why a compact block at all? Because it lets the orchestrator carry a roughly 200-token summary of each iteration into the next one, instead of re-feeding an entire prose review.

## Issue proposal — capturing out-of-scope work

Sometimes an agent spots a real problem that does not belong to the current pull request. Rather than expand the PR's scope, it drops a single proposal marker:

```html
<!-- jkz:propose-issue: Short actionable title | Optional description with references -->
```

The orchestrator turns that into a new tracked issue. The discipline around it is narrow on purpose: at most one marker per response, only on FAIL verdicts, with a title that starts with a verb and never contains a `|` (which separates the title from the optional description). It is for systemic follow-up work worth tracking separately — not for restating the current failure.

## See also

- [Pipeline](/concepts/pipeline/) — the phases that emit and consume these signals
- [Evidence hierarchy](/concepts/evidence-hierarchy/) — what makes a finding's evidence valid
- [Context management](/concepts/context-management/) — how oversized signals are truncated
