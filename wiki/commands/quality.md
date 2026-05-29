---
title: /jkz:quality — Project quality scan
description: An on-demand quality scan across thirteen categories — formatting, linting, security, dead code, TODOs, dependencies, coverage, and more. Optionally auto-fixes formatting and linting, files findings as an issue, or narrows to a single category.
---

`/jkz:quality` runs a broad quality scan over the target project and presents the results as a Markdown report. Where [`/jkz:bugs`](/commands/bugs/) hunts for defects, `/jkz:quality` takes the wider view: formatting, linting, security, dead code, and the slow-accumulating debt that does not break the build but erodes the codebase.

## At a glance

| | |
|------|------|
| **Runs** | `quality-scan.js --dir <project>` |
| **`--fix`** | Auto-fix formatting and linting only (with confirmation) |
| **`--create-issue`** | File the findings as a `jkz:ready` issue |
| **`--category <name>`** | Scan a single category |
| **`--quick`** | Run only the original five categories |
| **Usage** | `/jkz:quality [--fix] [--create-issue] [--category <name>] [--quick]` |

## When to use

Run it periodically to take the project's pulse, before a release, or whenever you want a categorized picture of code health rather than a list of bugs. Pass `--create-issue` when the findings warrant tracked follow-up work, and `--category` when you only care about one dimension (say, `deadcode` or `security`).

## Key behavior

The default run scans all **thirteen** categories: `formatting`, `linting`, `security`, `ai`, `deadcode`, `todos`, `deps`, `crlf`, `config`, `coverage`, `console-log`, `stubs`, and `dry-check`. `--quick` restricts the run to the original five — `formatting`, `linting`, `security`, `ai`, `deadcode`.

- **`--fix`** auto-fixes only the safe categories — **formatting and linting** — and confirms which ones before touching anything, then reports what it changed. It does not auto-fix security, dead code, or anything that requires judgment.
- **`--create-issue`** writes the full report to an issue body and files it through `issue-create.js` with the `jkz:ready` label, so the findings enter the normal workflow.
- **`--category <name>`** filters the scan to one of the categories above.

For a vulnerability-focused audit of third-party packages specifically, use [`/jkz:deps`](/commands/deps/) instead — it goes deeper on the dependency tree than the `deps` category here.
