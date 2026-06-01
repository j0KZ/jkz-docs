---
title: perf-audit
description: Audit code for performance improvements against three strict criteria — needle-moving, isomorphic, and clear path. Only optimizations that pass all three are accepted and applied; everything else is rejected with an explanation.
---

`/jkz:perf-audit` looks for performance improvements, but holds every proposal to a deliberately high bar. An optimization is accepted only if it is **measurably impactful, behaviorally identical, and cleanly contained**. That strictness is intentional: it rejects cosmetic micro-optimizations that usually pass as performance work.

## At a glance

| | |
|------|------|
| **Scope** | Files modified this session, or a path you pass |
| **Gate** | Three criteria — all must PASS or the proposal is rejected |
| **Action** | Applies only the accepted proposals |
| **Usage** | `/jkz:perf-audit [<file\|dir>]` |

## The three criteria

Every proposed optimization must pass **all three**. If any one fails, the proposal is rejected.

1. **Needle-moving** — it reduces algorithmic complexity (for example O(n²) → O(n log n)), eliminates redundant I/O, or measurably cuts memory allocation. A cosmetic rename or a "best practice" with no measurable impact fails this test.
2. **Isomorphic** — for all valid inputs the output is identical to the original. Anything that changes observable behavior, error handling, or side effects fails.
3. **Clear path** — the change is contained within the scope files and needs no cascading dependency, test, or interface changes. Touching a public contract fails.

## When to use

Run it after writing or changing hot-path code, or when you suspect a function is doing more work than it needs to. With no argument it audits the files you changed this session (via `git diff`); pass a file or directory to target something specific. Non-code files — Markdown, config JSON, lockfiles — are skipped.

## Key behavior

For each candidate the command profiles algorithmic complexity, I/O patterns, and memory behavior, then evaluates the change against the three criteria with an explicit PASS/FAIL and supporting evidence — a Big-O proof, an I/O-count reduction, or a memory delta. It reports accepted and rejected proposals (the rejected ones with their reason), then **applies only the accepted changes**, preserving existing functionality.

This is the efficiency-focused sibling of [`/jkz:simplify`](/commands/simplify/), which targets readability and reuse rather than raw performance.
