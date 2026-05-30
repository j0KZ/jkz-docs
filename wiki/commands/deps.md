---
title: deps
description: A proactive dependency audit for the target project. Reports vulnerabilities, optionally applies safe fixes, previews breaking upgrades behind a confirmation gate, and escalates to a full supply-chain audit when the issue's compliance tier demands it.
---

`/jkz:deps` audits the project's dependencies for known vulnerabilities and presents the results as a Markdown report. It can stop at reporting, apply the fixes that carry no breaking-change risk, or — behind an explicit confirmation gate — preview and apply breaking upgrades.

## At a glance

| | |
|------|------|
| **Runs** | `deps-audit.js --dir <project>` |
| **`--create-issue`** | File the findings as a `jkz:ready` issue |
| **`--fix`** | Apply safe (non-breaking) fixes |
| **`--fix --force`** | Preview breaking changes (exit code 2 — does **not** apply) |
| **`--fix --force --confirmed`** | Apply breaking changes after human review |
| **`--preventive`** | Scan multiple directories for vulnerabilities |
| **Usage** | `/jkz:deps [--create-issue]` |

## When to use

Run it on a cadence to stay ahead of advisories, or before a release to make sure no known-vulnerable package is shipping. Use `--fix` to clear the safe vulnerabilities in one pass; reach for `--fix --force` only when a remediation requires a breaking upgrade and you are ready to review the migration.

## Key behavior

The audit reports vulnerabilities found in the dependency tree. The fix modes form a deliberate ladder of risk:

- **`--fix`** applies only safe, non-breaking fixes and reports how many vulnerabilities were resolved and how many remain.
- **`--fix --force`** runs in **preview mode** — it exits with code `2` and prints a table of breaking changes with migration hints, but applies nothing.
- **`--fix --force --confirmed`** applies those breaking changes, and is meant to run only after you have reviewed the preview.
- **`--preventive`** scans several directories at once (optionally scoped with `--preventive-dirs`), skipping any directory without a lockfile.

**Compliance tiers.** When the audit can resolve an issue number (from an argument or the branch name), it reads that issue's compliance tier from pipeline state. Tier 2 auto-activates a full `--supply-chain` audit; tier 1 reports normally but recommends running with `--supply-chain` for the complete picture. This ties the depth of the audit to the regulatory weight of the work — see the [merge gate](/concepts/merge-gate/) for where these tiers come from.

`--create-issue` writes the report to an issue body and files it through `issue-create.js` with the `jkz:ready` label.
