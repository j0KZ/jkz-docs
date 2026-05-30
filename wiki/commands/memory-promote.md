---
title: memory-promote
description: Score a single memory file across five weighted dimensions and recommend whether to promote it to a rule, keep it, or archive it — behind a mandatory human checkpoint.
---

`/jkz:memory-promote <filename>` evaluates one memory file and answers a focused question: is this worth promoting into a durable rule, should it stay a memory, or has it earned archival? It is the per-file complement to [`/jkz:memory-review`](/commands/memory-review/), which surfaces *which* files are promotion candidates; this command decides what to do with a specific one.

A memory that recurs, is non-obvious, and is not already documented elsewhere is a candidate for promotion to a rule or a CLAUDE.md section, where it carries more weight and applies more consistently. The scoring makes that judgment explicit rather than leaving it to intuition.

## At a glance

| | |
|------|------|
| **Input** | One memory filename (lists available files if omitted) |
| **Score** | Five weighted dimensions, totalled |
| **Recommendation** | `promote` · `keep` · `archive` |
| **Gate** | Human checkpoint — no automatic action |
| **Usage** | `/jkz:memory-promote feedback_checkpoint_context.md` |

## When to use

Run `/jkz:memory-promote` on the candidates that [`/jkz:memory-review`](/commands/memory-review/) flags, or any time you are unsure whether a memory has graduated into something that belongs in the rules. It is a scoring-and-decision tool, not a bulk operation — point it at one file at a time.

## Key behavior

If no filename is supplied, the command lists the available memory files and asks which to evaluate. It then scores the file across five weighted dimensions — document redundancy (×0.30), pattern (×0.20), specificity (×0.20), relevance (×0.15), and uniqueness (×0.15) — and presents the breakdown with a total and a recommendation of **promote**, **keep**, or **archive**.

Crucially, it stops there. The command never acts on its own: promotion, retention, and archival all wait on your decision at a human checkpoint. If you choose to promote, it asks where the content should land — a new rule file, a CLAUDE.md section — and implements it; archival is confirmed before anything is deleted.
