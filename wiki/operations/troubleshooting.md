---
title: Troubleshooting
description: A symptom-first reference for the jkz pipeline. Find the error message or behavior you are seeing, jump to the cause, and apply the fix — grouped by where the problem lives, from the Claude Code sandbox and Windows quirks to GitHub, phases, the MCP server, and external models.
---

Most pipeline failures have a known cause and a one-line fix. This page is organised symptom-first: find the error message or behavior you are seeing in the index, jump to the entry, and apply the fix. Each entry names the source file where the behavior — and its remedy — actually live, so you can verify rather than trust.

## Symptom index

| Symptom / error | Entry |
|-----------------|-------|
| Guard emits JSON on stderr, scripts break when parsing | [Guard hooks](#guard-emits-json-on-stderr) |
| A guard allows a command it should have blocked | [Fail-open guards](#fail-open-guard-hooks) |
| `'\r': command not found` when running scripts | [CRLF line endings](#crlf-breaking-bash-scripts) |
| `echo`, `cat`, `pwd` fail with cryptic errors | [Bash builtins](#bash-builtins-broken-in-the-sandbox) |
| `Permission denied` or script not found in `scripts/*.sh` | [Script permissions](#windows-script-execution-permissions) |
| Empty or garbled stdin from PowerShell | [PowerShell stdin](#powershell-stdin-pipe-failure) |
| `Argument list too long` when invoking wrappers | [Large prompts](#large-prompts-exceed-cli-argument-limits) |
| `bash -n` reports errors on valid scripts | [bash -n in the sandbox](#bash--n-returns-a-false-exit-code) |
| `Can not approve your own pull request` | [Self-approval](#cannot-approve-your-own-pr) |
| `BLOCKED by jkz guard: gh pr merge` | [Merge blocked](#pr-merge-blocked) |
| `orchestrate.sh transition` rejects the transition | [Phase validation](#phase-validation-fails) |
| Stale worktrees reported by the health check | [Stale worktrees](#stale-worktrees) |
| Judge rate-limited differently than Auditor/Sentinel | [Codex quota](#the-judge-uses-a-separate-quota) |
| Gemini wrapper returns empty or garbled response | [Gemini JSON](#gemini-json-parse-failure) |
| Pipeline stage skipped unexpectedly | [Model fallback](#model-fallback-behavior) |
| `mcpServers` in `settings.json` rejected | [MCP config](#mcp-config-validation-error) |
| `mcp/dist/index.js` not found | [MCP build](#mcp-server-build-fails) |
| Circuit breaker blocks a service that is working | [Circuit breaker](#circuit-breaker-blocks-a-healthy-service) |
| "near-duplicate fix detected" / Doctor in a loop | [Loop guard](#loop-guard-warns-about-duplicate-fix-attempts) |
| Cost report shows "N/A" in the cost column | [Pricing](#cost-report-shows-na-for-pricing) |

## Guard and hooks

### Guard emits JSON on stderr

**Symptom.** Pipeline scripts that parse guard output break, because they receive a JSON line followed by human-readable text instead of plain text.

**Cause.** `hooks/guard-destructive.sh` emits structured JSON on stderr when it blocks a command:

```text
{"blocked":true,"pattern":"<pattern>","level":"<level>"}
BLOCKED by jkz guard: command matches pattern '<pattern>'
```

**Fix.** For pipeline scripts, the simplest reliable signal is the exit code: `2` means blocked, `0` means allowed. If you must inspect the reason, parse the `blocked` field from the first stderr line as JSON.

**Source.** `hooks/guard-destructive.sh`.

### Fail-open guard hooks

**Symptom.** A guard hook occasionally allows a command it should have blocked — rare, and only on parse errors.

**Cause.** This is intentional. Claude Code `PreToolUse` hooks that exit with a code other than `0` or `2` cause infinite retry loops, so the guards trap errors and fail open (`trap 'exit 0' ERR`) rather than risk hanging the session.

**Fix.** None — it is a platform constraint. Judge and Inspector code review are the safety net behind it.

**Source.** `hooks/guard-destructive.sh`, `hooks/guard-worktree.sh`.

## Claude Code sandbox and Windows

### Bash builtins broken in the sandbox

**Symptom.** `echo`, `cat`, `pwd`, `cd`, `test`, `set` fail with cryptic errors inside Claude Code.

**Cause.** Claude Code passes Windows file descriptors that MSYS2 cannot use as POSIX fds. External commands (`node`, `git`, `codex`, `gemini`) are unaffected because they read handles directly.

**Fix.** Run shell scripts through Node, which spawns bash with proper pipes: `node scripts/run.js <script>.sh [args]`.

**Source.** `scripts/run.js`.

### CRLF breaking bash scripts

**Symptom.** `'\r': command not found` when running a script.

**Cause.** The Write tool can create CRLF line endings on Windows.

**Fix.** `sed -i 's/\r$//' scripts/<filename>.sh`.

### Windows script execution permissions

**Symptom.** `Permission denied`, or the script is not found when calling `scripts/<name>.sh` directly.

**Cause.** Git does not preserve execute bits on Windows.

**Fix.** Always invoke through `bash scripts/<name>.sh` (terminal) or `node scripts/run.js <name>.sh` (sandbox).

### PowerShell stdin pipe failure

**Symptom.** Wrapper scripts receive empty or garbled input when piped from PowerShell.

**Cause.** PowerShell cannot reliably pipe stdin to bash scripts.

**Fix.** Use the `--prompt "text"` flag instead of piping, or run from Git Bash. The wrappers support `--prompt` directly.

### Large prompts exceed CLI argument limits

**Symptom.** `Argument list too long` when invoking a wrapper with a large prompt.

**Fix.** Write the prompt to a temp file and pass it with `--stdin-file`:

```bash
node scripts/run.js --stdin-file /tmp/jkz-prompt.txt wrapper.sh --role <role>
```

**Source.** `scripts/run.js`.

### `bash -n` returns a false exit code

**Symptom.** A syntax check (`bash -n <file>`) reports errors on a valid script inside Claude Code.

**Cause.** The same file-descriptor mismatch that breaks bash builtins also affects `bash -n`.

**Fix.** Use Node for reliable syntax checks: `require('child_process').execFileSync('bash', ['-n', file])`.

## GitHub and pull requests

### Cannot approve your own PR

**Symptom.** `GraphQL: Can not approve your own pull request`.

**Cause.** Single-account setup — GitHub prohibits self-approval via `gh pr review --approve`.

**Fix.** Use `gh pr comment` for feedback and `gh pr edit --add-label "jkz:approved"` for state changes. Never use `gh pr review`.

### PR merge blocked

**Symptom.** `BLOCKED by jkz guard: command matches destructive pattern 'gh pr merge'`.

**Cause.** The guard hook blocks all `gh pr merge` calls by design — humans merge, agents never do.

**Fix.** Merge manually from the GitHub UI or CLI, outside Claude Code, once the `jkz:approved` label is set.

**Source.** `hooks/guard-destructive.sh`.

## Pipeline and phases

### Phase validation fails

**Symptom.** `orchestrate.sh transition` rejects the transition and lists failed checks.

**Cause.** A required agent comment or verdict is missing from the PR or issue.

**Fix.** Find which `## jkz:<role>` comment is missing and re-run that agent. If you need to override validation deliberately, pass `--force`.

**Source.** `scripts/validate-phase.sh`.

### Stale worktrees

**Symptom.** The health check or the MCP `health_report` reports worktrees older than four hours.

**Fix.** Confirm the build is genuinely abandoned, then remove it with `scripts/worktree.sh clean <issue-number>`.

**Source.** `scripts/health-check.sh` (four-hour threshold).

### Loop guard warns about duplicate fix attempts

**Symptom.** `/jkz:fix` warns "near-duplicate fix detected" but the Doctor keeps trying the same approach.

**Cause.** The warning is advisory — the Doctor receives it but may still attempt a similar fix. After three attempts the pipeline transitions to `jkz:blocked`.

**Fix.** Inspect the attempt history with `node scripts/json-helper.js read fix_attempts state/pipeline/<issue>.json`. If it is genuinely stuck, give the Doctor a new direction or close the PR and re-plan.

## Models and quotas

### The Judge uses a separate quota

**Symptom.** Judge review fails or is rate-limited differently than the Auditor or Sentinel.

**Cause.** The Judge runs `codex review`, which draws on the separate Code Review quota, not the Engineering quota used by `codex e`.

**Fix.** Check the Code Review quota separately. This is by design — the Judge reviews code, it does not generate it.

**Source.** `scripts/codex-wrapper.sh`.

### Gemini JSON parse failure

**Symptom.** The Gemini wrapper returns an empty or garbled response.

**Cause.** Gemini CLI output can include non-JSON prefix lines (for example "Loaded cached credentials"), and the response field varies (`.response`, `.text`, `.content`).

**Fix.** The wrapper's multi-field fallback handles this automatically. To test manually: `echo "test" | gemini -o json -m "gemini-3.5-flash"`.

**Source.** `scripts/gemini-wrapper.sh`.

### Model fallback behavior

**Symptom.** A pipeline stage is skipped or the run halts unexpectedly.

**Cause.** An external model is unavailable, and the pipeline degrades according to a fixed table rather than failing silently.

| Model down | What happens |
|-----------|-------------|
| Opus | Full pipeline stop — nothing continues. |
| Codex CLI | Review and Sentinel skipped; the human decides. |
| Gemini CLI | Lens and Inspector skipped; the human decides. |
| Claude Code | Everything stops — it is the orchestrator. |

**Details.** `.claude/rules/fallback.md`.

### Circuit breaker blocks a healthy service

**Symptom.** `resolve-wrapper.sh` reports the circuit open for a service you know is working.

**Fix.** Inspect and reset the breaker:

```bash
node scripts/circuit-breaker.js status codex
node scripts/circuit-breaker.js success codex
```

The circuit auto-resets after five minutes (a half-open state allows one test request). State lives in `state/circuit/<service>.json`; deleting the file is a hard reset.

## MCP server

### MCP config validation error

**Symptom.** Claude Code rejects the MCP server configuration with a validation error.

**Cause.** The `mcpServers` key was placed in `.claude/settings.json` instead of `.mcp.json`.

**Fix.** MCP configuration belongs in `.mcp.json` at the project root.

### MCP server build fails

**Symptom.** `mcp/dist/index.js` is missing or outdated after source changes.

**Fix.** Rebuild from the `mcp/` directory:

```bash
cd mcp && npm install && npm run build
```

**Source.** `mcp/package.json`, `mcp/tsconfig.json`.

## Cost reporting

### Cost report shows "N/A" for pricing

**Symptom.** The cost report shows "N/A" in the cost column for some models.

**Fix.** Add the model to `scripts/pricing.json`. Keys are `"in"` and `"out"` (not `"input"`/`"output"`), and prices are per million tokens:

```json
{
  "gpt-5.3-codex": { "in": 0.15, "out": 0.60 },
  "gemini-3.5-flash": { "in": 1.50, "out": 9.00 }
}
```

The report re-reads the file on each run.

---

When the problem is about *where a run's data lives* rather than a specific error, the [state schema](/operations/state-schema/) is the companion to this page — it maps each kind of state to the file and script that owns it.
