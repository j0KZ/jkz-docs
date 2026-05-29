---
title: /jkz:memory-status
description: A quick health dashboard for the Claude Code memory directory — total files, stale count, overlap pairs, and a by-type breakdown, with a one-line next step.
---

`/jkz:memory-status` is the at-a-glance view of your memory directory's health. It answers a single question fast: is the memory in good shape, or does it need attention? Run it when you want the headline numbers without the full audit.

It is the lightest of the three memory commands — a dashboard, not an investigation. When it flags trouble, it points you at [`/jkz:memory-review`](/commands/memory-review/) for the details.

## At a glance

| | |
|------|------|
| **Output** | Health verdict + key metrics + by-type breakdown |
| **Metrics** | Total files, stale (>30d), overlap pairs |
| **Verdict** | `good` · `needs_review` · `critical` |
| **Companions** | [`/jkz:memory-review`](/commands/memory-review/) · [`/jkz:memory-promote`](/commands/memory-promote/) |
| **Usage** | `/jkz:memory-status` |

## When to use

Run `/jkz:memory-status` as a periodic pulse check on the memory directory, or whenever a session start warns that memory may be drifting. It does no analysis of its own beyond surfacing the counts — its job is to tell you, quickly, whether deeper curation is warranted.

## Key behavior

The command runs `memory-curate.js` in status mode and renders a compact dashboard: a health verdict, a metrics table (total files, stale files older than 30 days, overlap pairs), and a by-type breakdown. The verdict drives the next step — `good` means no action; `needs_review` and `critical` both send you to [`/jkz:memory-review`](/commands/memory-review/) to identify what needs fixing.
