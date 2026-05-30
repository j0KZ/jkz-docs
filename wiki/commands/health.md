---
title: health
description: A full system health check — CLI version freshness, changelog review, relevance insights, and infrastructure status. The --fix flag auto-updates outdated CLIs and cleans stale worktrees; --deep adds auth, MCP, and notification checks.
---

`/jkz:health` is the system's self-diagnostic. It checks the tools jkz depends on, tells you which ones are out of date and *why that matters*, and surfaces the infrastructure signals — stale worktrees, incomplete deliberations, API reachability — that quietly accumulate during real work. It is the interactive surface over the same health data that the session-start banner and the monitoring loop read.

## At a glance

| | |
|------|------|
| **Checks** | CLI versions, changelogs, relevance insights, infrastructure |
| **`--fix`** | Auto-update outdated CLIs and clean stale worktrees |
| **`--deep`** | Add auth, MCP, and notification checks |
| **Reads** | `health-check.sh`, changelog review, desire-path and permission audits |
| **Usage** | `/jkz:health [--fix \| --deep]` |

## When to use

Run `/jkz:health` when the session-start banner flags outdated CLIs or stale data, before a long pipeline run, or whenever something feels off in the toolchain. Use `--fix` when you want it to act on what it finds — updating CLIs and cleaning up stale [worktrees](/concepts/worktree-isolation/) — and `--deep` before relying on auth, MCP servers, or notifications.

## Key behavior

The command runs `health-check.sh` with flags derived from your arguments, then presents the result in sections:

- **CLI versions** — a table of installed-vs-latest for each tool jkz uses, marking which are outdated. The version data is also summarized on the [CLI reference](/reference/cli/) page.
- **Changelog highlights** — for each outdated CLI, the breaking changes (flagged **BREAKING**) and notable features or fixes, plus a relevance analysis that ranks which changes actually matter to jkz and suggests actions.
- **Desire paths** — unknown flags or commands that agents have tried, surfaced so real gaps in the tooling become visible.
- **Frozen artifacts** *(plugin mode only)* — drift between the installed plugin and its frozen artifacts, with an update suggestion when they diverge.
- **Permission audit** — a scan for dangerous `allowedTools` patterns, highlighting critical findings.
- **Infrastructure** — GitHub API reachability, stale worktree count, incomplete deliberations, and — in `--deep` mode — auth, MCP, and notification status.

When `--fix` is not passed but outdated CLIs or stale worktrees are found, the command points you to `/jkz:health --fix` rather than acting silently. The cleanup it offers respects the same safety rules as the rest of the system — it never removes a locked worktree or one with uncommitted changes (see [worktree isolation](/concepts/worktree-isolation/)).
