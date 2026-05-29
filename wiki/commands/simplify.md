---
title: /jkz:simplify — Code simplification
description: Review recently changed code for reuse opportunities, quality issues, and efficiency improvements, then apply the refinements. It changes HOW the code works, never WHAT it does — and it refuses to over-simplify.
---

`/jkz:simplify` reviews the code you changed for unnecessary complexity, redundancy, and unclear naming, then applies the refinements. Its guiding rule is narrow and strict: change *how* the code reads, never *what* it does.

## At a glance

| | |
|------|------|
| **Scope** | Files changed this session, or a file you pass |
| **Targets** | Reuse, clarity, efficiency, nesting, naming |
| **Guarantee** | Preserves all existing functionality |
| **Usage** | `/jkz:simplify [<file>]` |

## When to use

Run it after writing a feature or fix, when the code works but reads more densely than it should. With no argument it simplifies the files you changed this session (via `git diff`); pass a file to target one specifically. Non-code files — Markdown, config JSON, lockfiles — are skipped.

## Key behavior

For each file in scope the command reviews for unnecessary complexity and nesting, redundant code and abstractions, unclear variable and function names, consolidation opportunities, nested ternaries (preferring `switch`/`if-else`), and overly compact code that sacrifices readability. It then applies the refinements and reports each change with a brief rationale.

The discipline matters as much as the cleanup:

- **Preserve functionality.** Change HOW, never WHAT.
- **Prefer explicit over compact.** Three clear lines beat one clever line.
- **Do not over-simplify.** It will not collapse readable code into something terse just to cut a line.

This is the readability-and-reuse counterpart to [`/jkz:perf-audit`](/commands/perf-audit/), which targets measurable performance rather than clarity. For cleaning up prose rather than code, see [`/jkz:deslop`](/commands/deslop/).
