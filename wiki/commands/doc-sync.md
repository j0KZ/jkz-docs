---
title: doc-sync
description: Scans project state and compares it against auto-doc markers in the documentation, reporting where the docs have drifted. Optionally opens one issue per drifted doc so unactioned drift doesn't sit silently.
---

`/jkz:doc-sync` checks whether the documentation still matches reality. It scans the current project state and compares it against the auto-doc markers embedded in the docs, then reports each discrepancy — the places where the code moved on and the prose didn't.

## Usage

```
/jkz:doc-sync [--no-llm] [--json] [--file <path>] [--create-issues]
```

| Flag | Effect |
|------|--------|
| *(none)* | Scan and present the discrepancies in Markdown |
| `--no-llm` | Run the deterministic scan only, without the LLM pass |
| `--json` | Emit machine-readable output |
| `--file <path>` | Restrict the check to a single doc |
| `--create-issues` | Open one `jkz:ready` issue per doc whose discrepancy count is greater than zero |

## Key behavior

- **Marker-driven comparison.** The check runs `doc-sync.js`, which reads the auto-doc markers in the documentation and compares them against the scanned project state, surfacing per-doc discrepancies.
- **`--create-issues` turns drift into work.** With this flag, each doc that has drifted gets its own `jkz:ready` issue, deduplicated against existing open issues with the same title. This is how the [Hermes](/reference/architecture/) Mon+Thu cron keeps unactioned drift from sitting silently in otherwise-green reports. The flag is skipped when combined with `--no-llm`.
- **Output you can pipe.** The default presentation is Markdown for a human; `--json` makes it consumable by other tooling.

## When to use it

Run `/jkz:doc-sync` after a change that alters something the docs describe — a renamed flag, a new label, a moved script — to confirm the documentation kept up. On its own it is a read-only report; reach for `--create-issues` when you want the drift converted into tracked work rather than just listed. It pairs naturally with the documentation-sync category of [`/jkz:dev-self-review`](/commands/dev-self-review/), which catches the same class of drift in a single pending diff.
