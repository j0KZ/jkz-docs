---
title: Plugin mode
description: How jkz installs into any project as a plugin — one command to wire up the pipeline, the dual-root layout that keeps source and state separate, and how to remove it without touching your data.
---

jkz does not have to live inside its own repository. It can be installed into any project as a plugin, leaving that project ready to run the full pipeline with a single command. The design keeps a clean separation between jkz's own code and the state it produces in your project, so the same installation can serve many projects without their pipelines colliding.

## Installing

Installation happens in two steps: install jkz once on your machine, then initialize it inside each project you want to use it in.

```bash
# 1. Install jkz once (fetches the installer via your authenticated gh session):
gh api -H "Accept: application/vnd.github.raw" \
  /repos/j0KZ/jkz_Multi-Agent_System/contents/install.sh | bash

# Reopen your terminal, then run the setup wizard (API keys, notifications, models):
jkz install

# 2. Install the plugin into a project (defaults to the current directory):
jkz init [dir]
```

Because jkz lives in a private repository, the install step uses your authenticated GitHub CLI session (`gh auth login`) to fetch the installer — there is no public download.

## What it generates in your project

`jkz init` writes a small set of artifacts into the target project and leaves everything else alone:

```text
target-project/
  .claude-plugin/plugin.json     # entrypoints pointing at your jkz install
  .claude/commands/jkz/          # the /jkz:* commands
  .github/workflows/             # merge-gate, approve-merge, auto-revert
  hooks/post-merge               # delegates to the jkz post-merge script
  state/                         # local pipeline state (gitignored)
    .jkz-plugin-env              # bootstrap: where jkz lives, where state goes
  .env                           # per-project config (gitignored)
```

The GitHub workflows are the important part: they install the server-side [merge gate](/concepts/merge-gate/) into your project so the human-only-merge guarantee travels with the plugin. The `state/` directory and `.env` are gitignored, so your project's history stays clean while each run's pipeline state is kept locally.

## The dual-root layout

The reason one installation can serve many projects is that jkz separates *where its code lives* from *where your state lives*. Two roots:

- **`JKZ_HOME`** — the jkz installation itself: scripts, agents, hooks, and the MCP server. Shared across every project.
- **`JKZ_TARGET_PROJECT`** — your project: its pipeline state, deliberations, `.env`, and workflows. Unique per project.

Node scripts and the `/jkz:*` commands read source from `JKZ_HOME` and read or write state under `JKZ_TARGET_PROJECT`. A small bootstrap file resolves these two roots at the start of every command, so a command run in one project never reaches into another's state.

## Uninstalling

Removing the plugin is symmetric with installing it, and deliberately conservative about your data:

```bash
jkz uninstall [target-dir]
```

This removes the artifacts that `jkz init` generated, but **preserves your data** — `state/`, `.env`, and the workflows stay in place. Uninstalling the plugin does not throw away your pipeline history or your configuration.

## See also

- [Pipeline](/concepts/pipeline/) — what the installed commands actually run
- [Merge gate](/concepts/merge-gate/) — the server-side workflows the plugin installs
- [Cross-chat](/concepts/cross-chat/) — coordinating multiple sessions on one project
