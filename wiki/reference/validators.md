---
title: Validators
description: Deterministic pre-validated checks that run against the diff before push — secrets, TODOs, stubs, capability invariants, and AI-writing artifacts.
---

Validators are deterministic checks — no AI involved — that run against the diff before code is pushed. Each one is a small rule that scans the changes for a specific class of problem and returns structured findings. Their output is injected as `=== PRE-VALIDATED CHECKS ===` into the Judge and Sentinel prompts, giving those agents Level&nbsp;1 evidence to reason from.

:::note[Source of truth]
This page summarizes the catalog for public reference. The authoritative version lives in the private repo at `docs/validators-reference.md`, backed by `scripts/validators/run.js` and `scripts/validators/config.json`.
:::

## When they run

1. **Pre-push** (during build, Step 4.6): against the `origin/main..HEAD` diff of the worktree.
2. **Pre-QA** (during QA): optional, against the same diff before invoking Lens and Sentinel.

## Severities

| Severity | Behavior |
|----------|----------|
| `fail` | **Blocks the push.** The Builder must fix it before continuing. |
| `warn` | Logs the warning, allows continuation. |
| `info` | Informational, no action required. |

## Available rules

| Rule | Severity | What it detects |
|------|----------|-----------------|
| `secrets` | `fail` | Hardcoded secrets in added lines: AWS keys (`AKIA…`), generic token assignments (`secret =`, `password =`, `api_key =`), high-entropy strings in suspicious context. |
| `capabilities` | `fail` | Capability invariants in agent frontmatter — `can_merge: false`, `can_push_to_main: false`. Runs against the full worktree. |
| `todos` | `warn` | New `TODO`, `FIXME`, `HACK` comments in the diff. |
| `console-log` | `warn` | `console.log` in `src/` files (excludes `scripts/` and `tests/`). |
| `stubs` | `warn` | Stub or placeholder code: functions that only return `null`/`undefined` or `throw new Error("not implemented")`. |
| `dry-check` | `warn` | Duplication — constants or regexes with the same semantics defined across multiple files in the diff. |
| `test-coverage` | `warn` | Directories with more than 100 LOC of new code but no test files. |
| `pr-size` | `warn` | PRs large enough that they should probably be split. Configurable thresholds. |
| `ai-traces` | `warn` | AI writing artifacts in the diff: curly quotes, em dashes, typographic ellipses. |
| `ai-prose` | `warn` | AI prose patterns in markdown: filler phrases and excessive hedging. |

## Rule types

| Type | What it needs | When it applies |
|------|---------------|-----------------|
| `diff-safe` | Only the diff via stdin | Always (pre-push and pre-QA). |
| `worktree-required` | Access to the full worktree | Only when `--worktree <path>` is available. |

## CLI usage

```bash
# Pre-push: against the worktree diff
git diff origin/main..HEAD | node scripts/validators/run.js --stdin \
  --worktree ../jkz-worktree-667

# Without a worktree (diff-safe rules only)
git diff origin/main..HEAD | node scripts/validators/run.js --stdin

# JSON output
node scripts/validators/run.js --stdin --json < diff.patch
```

## JSON output

```json
{
  "checks": [
    {
      "rule": "secrets",
      "severity": "fail",
      "file": "src/config.js",
      "line": 42,
      "message": "Potential AWS key detected",
      "snippet": "const secret = 'AKIAXXX...'"
    }
  ],
  "skipped": ["test-coverage"]
}
```

`skipped` lists rules omitted because their type required something unavailable (for example, a `worktree-required` rule with no `--worktree`). There is no `summary` field — counts are derived from `checks`.

## Adding a new rule

1. Create `scripts/validators/rules/<name>.js` exporting `{ name, type, severity, check(diff, opts) }`, where `check` returns an array of findings (`{ file, line, message, snippet }`) or `[]`.
2. Add a matching entry to `scripts/validators/config.json` (`type`, `severity`, `enabled`, `description`).
3. `run.js` discovers it automatically by naming convention.

## Related

- [Scripts](/reference/scripts/) — where the validators runner sits in the wider script catalog.
- [Glossary](/reference/glossary/) — see *pre-validated checks* and *Evidence Hierarchy*.
