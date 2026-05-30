---
title: memory-review
description: Scan the Claude Code memory files for staleness, overlaps, redundancy against existing rules, and promotion candidates — then suggest concrete curation actions.
---

`/jkz:memory-review [--stale-days N]` is the full audit of your memory directory. Where [`/jkz:memory-status`](/commands/memory-status/) gives you the headline, this command opens the hood: which files have gone stale, which pairs overlap, which memories are already covered by an existing rule, which are missing their structural markers, and which are worth promoting.

The goal is curation. Memory accretes — a healthy directory is one that is periodically pruned of the stale and the redundant, so the signal that remains is the signal that earns its place in context.

## At a glance

| | |
|------|------|
| **Output** | Six sections: stale, overlaps, redundancy, needs-rewrite, promotion candidates, stats |
| **Defaults** | 30-day stale threshold, 0.6 overlap similarity |
| **Tuning** | `--stale-days <N>` to change the stale window |
| **Companions** | [`/jkz:memory-status`](/commands/memory-status/) · [`/jkz:memory-promote`](/commands/memory-promote/) |
| **Usage** | `/jkz:memory-review` · `/jkz:memory-review --stale-days 60` |

## When to use

Run `/jkz:memory-review` when [`/jkz:memory-status`](/commands/memory-status/) reports `needs_review` or `critical`, or on a regular cadence to keep the directory lean. It is the right tool when memory feels noisy, when you suspect duplicate entries, or before deciding whether a particular memory has outlived its usefulness.

## Key behavior

The command runs `memory-curate.js` in review mode and presents the results as six markdown tables:

- **Stale files** — name, age in days, and the date source the age was derived from.
- **Overlapping pairs** — two files and their similarity percentage, candidates for merging.
- **Redundancy analysis** — each memory classified as `new_rule`, `extends_existing`, or `already_covered`, with the matched section and source.
- **Needs rewrite** — files missing the `**Why:**` and/or `**How to apply:**` markers.
- **Promotion candidates** — memories worth scoring with [`/jkz:memory-promote`](/commands/memory-promote/).
- **Stats** — totals, by-type breakdown, and redundancy summary counts.

Each section comes with a suggested action: merge overlaps, archive `already_covered` entries, add missing markers to rewrite candidates, and run [`/jkz:memory-promote`](/commands/memory-promote/) on promotion candidates. The command surfaces findings and recommends — it does not delete or rewrite on its own.
