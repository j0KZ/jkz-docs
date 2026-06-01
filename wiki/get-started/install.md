---
title: Install & setup
description: Install jkz on a clean machine — prerequisites, the install command, standalone vs plugin, environment configuration, and the merge gate.
---

This is the from-zero path: what you need installed, how to get jkz onto your
machine, how to wire it into a project, and what to put in `.env`. If you just
want to run a tiny change end-to-end, the [Quickstart](/get-started/quickstart/)
is shorter — come back here when you want the full picture.

## Prerequisites

jkz runs **inside Claude Code** — Claude Code is the orchestrator, not a
dependency you can swap out. Everything else is a CLI it shells out to.

### Required

| Tool | Min version | Why |
| --- | --- | --- |
| **Claude Code** | current | The orchestrator. Install with `npm install -g @anthropic-ai/claude-code` (or the desktop app from Anthropic). |
| **git** | 2.30+ | Source of truth for every handoff. |
| **gh** (GitHub CLI) | 2.0+ | jkz drives issues, labels, and PRs through GitHub. Authenticate with `gh auth login`. |
| **node** | 18+ | Runs the wrappers, state helpers, and MCP server. |

After installing `gh`, confirm you can read and write issues and pull requests on
the repo you'll work against:

```bash
gh auth status
```

### Optional — model backend CLIs

The adversarial and validator roles run on external backends. You can do a first
run without them, but a complete pipeline expects at least an adversarial backend.

| Tool | Roles enabled | Install |
| --- | --- | --- |
| **codex** (OpenAI Codex CLI) | Auditor, Judge, Sentinel | `npm install -g @openai/codex` |
| **gemini** (Google Gemini CLI) | Curator, Inspector, Lens | `npm install -g @google/gemini-cli` |
| **coderabbit** (CodeRabbit CLI) | Pre-scan enrichment | Install per the CodeRabbit CLI docs (Windows: requires WSL) |

:::note[Missing a backend is a degraded run, not a failure]
Without an adversarial backend, the review and security phases are skipped.
Without a validator backend, the validation and Lens (frontend/visual) checks are
skipped. The pipeline tells you which roles it dropped and lets you decide whether
to continue — it does not silently pretend the check ran.
:::

## Install jkz

jkz lives in a **private** repository, so every install path goes through your
authenticated `gh` session. The classic `curl raw.githubusercontent.com … | bash`
one-liner returns `404` for private repos — use the `gh api` form instead.

### Remote installer (recommended)

```bash
# Fetches install.sh through your authenticated gh session
gh api -H "Accept: application/vnd.github.raw" \
  /repos/j0KZ/jkz_Multi-Agent_System/contents/install.sh | bash
```

This downloads jkz to `~/.jkz/`, compiles its dependencies, and adds `jkz` to your
`PATH`. Reopen your terminal so the new `PATH` takes effect, then:

```bash
jkz install        # wizard: API keys, notifications, model/backend choices
```

### From a cloned repo

```bash
gh repo clone j0KZ/jkz_Multi-Agent_System   # gh handles private-repo auth
cd jkz_Multi-Agent_System
npm link                                     # global symlink to ./bin/jkz
jkz install
```

Reverse the symlink with `npm unlink -g jkz-multi-agent-system`.

### Verify the install

```bash
jkz version        # prints the version
jkz help           # lists subcommands: install, init, docker, uninstall
```

:::caution[Windows]
Use **Git Bash**, not native PowerShell. Both install paths work identically
under Git Bash. If `jkz` is not found after `npm link`, close and reopen the
terminal so the `.cmd`/`.ps1` shims are picked up.
:::

## Standalone vs plugin

There are two ways to use jkz, and the difference is *where the runtime lives*.

**Standalone** — you work directly inside the cloned `jkz_Multi-Agent_System`
repo. The scripts, agents, and state all live in one place. This is the right
choice when you're developing jkz itself or trying it out.

**Plugin** — you install jkz *into another project* so that repo gets the full
pipeline (`/jkz:*` commands, merge-gate workflows, local `state/`). From the
target project, or from anywhere once `jkz` is on your `PATH`:

```bash
jkz init [dir]     # default: current directory
```

`jkz init` generates the plugin entrypoints, the GitHub workflows that enforce the
merge gate, and a local `state/` directory for pipeline bookkeeping.

This uses a **dual-root** layout — shared code in one place, per-project state in
another:

- **`JKZ_HOME`** (`~/.jkz/`) — scripts, agents, hooks, MCP server. Shared across
  every project you install the plugin into.
- **`JKZ_TARGET_PROJECT`** (the target dir) — `state/`, deliberations, `.env`, and
  the merge-gate workflows. One per project.

Each command reads `state/.jkz-plugin-env` at startup to resolve these roots, so
you don't set them by hand. Remove the plugin from a project with
`jkz uninstall [dir]` — it strips the generated artifacts but preserves your
`state/`, `.env`, and workflows.

## Configure (`.env`)

Copy the example and edit it:

```bash
cp .env.example .env
```

The defaults are sane; the values you're most likely to touch are the model IDs
for the external backends.

```bash
JKZ_GEMINI_MODEL=gemini-3.5-flash
JKZ_GEMINI_MODEL_FALLBACK=gemini-3.5-flash
JKZ_CODEX_MODEL=gpt-5.4
JKZ_CODEX_MODEL_FALLBACK=gpt-5.3-codex
```

If a primary model returns `404` (model not found), the wrappers retry with the
fallback automatically — a warning goes to stderr and the run continues. You can
override any role individually; the lookup cascades from the role-specific var to
the backend default:

```bash
# Judge uses a distinct model; everything else still uses the Codex default.
JKZ_JUDGE_MODEL=gpt-4.1-codex
# Cascade: JKZ_JUDGE_MODEL → JKZ_CODEX_MODEL → built-in default
```

:::note[Role names are shell identifiers]
A per-role variable name must match `^[a-z0-9][a-z0-9_]*$` — no hyphens, since
they're invalid in shell variable names. See `.env.example` for the complete
cascade, including the shared API-backend vars (`JKZ_API_ENDPOINT`,
`JKZ_API_MODEL`, `JKZ_API_KEY`) for any OpenAI-compatible endpoint.
:::

### The merge gate (required)

jkz never merges for you. A server-side GitHub Actions workflow refuses to merge a
PR without a passphrase that Claude Code cannot read. Set it once per repo:

```bash
gh secret set MERGE_PASSPHRASE
```

When a PR is approved, you merge it from your own terminal:

```bash
gh workflow run approve-merge.yml -f pr=<NUMBER> -f passphrase=<your-passphrase>
```

This is the core safety guarantee — even a session running with
`--permission-mode bypassPermissions`, which skips client-side guard hooks, cannot
push to `main`, because the gate lives on the server.

## First run — verify everything works

From inside Claude Code, the fastest check is the health command:

```text
/jkz:health
```

```text
=== jkz Health ===
[OK] Claude Code CLI         2.1.x
[OK] gh CLI                  authenticated
[OK] Node.js                 22.x
[OK] Plugin commands         loaded (/jkz:* available)
[WARN] Some CLIs have updates available
=== Ready ===
```

`/jkz:health --fix` updates outdated CLIs; `--deep` also checks auth, MCP, and
notifications. If you prefer the shell, the same checks run standalone:

```bash
node scripts/run.js health-check.sh
```

A clean install exits `0` with zero critical issues. Warnings about optional CLIs
(`codex`, `gemini`) are informational — those roles won't run, but the rest of the
pipeline still works.

## Next steps

- [Quickstart](/get-started/quickstart/) — install to first merged PR, end to end.
- [Why jkz?](/get-started/why-jkz/) — the problem it solves and the constraints
  behind the design.
- [How jkz works](/get-started/how-jkz-works/) — the three phases, the twelve
  roles, and the deliberation loop.
- [Architecture](/reference/architecture/) — phase boundaries, roles, and model
  routing for the full picture.
