---
title: /jkz:skill-audit — Skill security audit
description: Scan skill files for security patterns — code injection, prompt injection, data exfiltration, jkz-specific violations, filesystem escape, and secret exposure. Returns a PASS / WARN / FAIL verdict with a per-finding breakdown.
---

`/jkz:skill-audit` scans skill files for security problems. Skills are executable instructions the agents load and follow, so a malicious or careless one is a real attack surface — this command checks them for the patterns that matter.

## At a glance

| | |
|------|------|
| **Runs** | `skill-security-audit.js --json --verbose` |
| **Default scope** | `.claude/skills/` |
| **Custom scope** | Any path passed as an argument |
| **Verdict** | PASS / WARN / FAIL |
| **Usage** | `/jkz:skill-audit [/path/to/skills]` |

## When to use

Run it before installing a third-party skill, after authoring or editing one, or as a periodic check on the skills directory. Point it at a custom path when you want to vet skills that live outside the default `.claude/skills/` location.

## What it scans for

The scanner looks for six categories of risk:

- **Code injection** — patterns that would execute arbitrary code.
- **Prompt injection** — instructions designed to subvert the agent's behavior.
- **Data exfiltration** — attempts to send data off the machine.
- **jkz-specific violations** — actions the framework forbids (for example, anything that would bypass the [merge gate](/concepts/merge-gate/)).
- **Filesystem escape** — access outside the intended scope.
- **Secret exposure** — credentials or tokens left in the open.

## Key behavior

The command runs the scanner and presents a verdict — **PASS**, **WARN**, or **FAIL** — alongside the count of files scanned and findings by severity (critical / high / medium). When findings exist, it lists them in a table (severity, file, line, category, pattern) and gives targeted recommendations: a **FAIL** enumerates the critical findings that must be fixed, a **WARN** lists the high-severity items worth a look, and a **PASS** confirms the skills are clean.

For a broader, non-security sweep of project health, see [`/jkz:quality`](/commands/quality/).
