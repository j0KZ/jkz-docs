---
title: SemVer policy
description: How jkz chooses the next version number — which surfaces are part of the public contract and force a MAJOR bump, which are internal and never do, and the MAJOR/MINOR/PATCH and deprecation rules that decide every release.
---

jkz follows semantic versioning, but the policy only works if everyone agrees on *what counts as the public contract*. A version bump is a statement about compatibility, so the first question for any change is: did it touch a stable surface? The lists below draw that line. Picking the next number then follows mechanically from the bump rules, and the [release process](/operations/releasing/) turns that number into a tag.

## Stable surfaces

These are part of the public contract. Backwards-incompatible changes here require a **MAJOR** version bump (vX → v(X+1)).

- **CLI subcommands** — `jkz update`, `jkz init`, `jkz docker`, `jkz uninstall`. Removing a subcommand or its flags is breaking. Adding new flags is non-breaking.
- **Slash commands** — `/jkz:plan`, `/jkz:build`, and the rest. Renaming or removing one is breaking.
- **Agent frontmatter contracts** — the `role`, `kind`, `model`, and `capabilities` field semantics. Changing required fields is breaking.
- **Hook contracts** — scripts in `hooks/` invoked by Claude Code. Renaming a hook file or changing its expected JSON output is breaking.
- **Frozen artifacts** synced to plugin projects — paths, names, and required content. Adding new artifacts is non-breaking; removing or renaming is breaking.
- **`.jkz-version` file format** — line 1 is the version tag.

## Unstable surfaces

Changes here are **MINOR or PATCH** depending on intent — never MAJOR, even when they are visible.

- Internal scripts in `scripts/` not invoked by `bin/jkz` directly.
- Wrapper internals (`codex-wrapper.sh`, `gemini-wrapper.sh`) — the agent invocation contract is stable, the internal flow is not.
- Pipeline state JSON shape (`state/pipeline/<N>.json`) — a read-only debugging artifact with no consumer contract.
- Memory MD file structure under `memory/` — informal.
- Telegram bot internals.

## Bump rules

- **MAJOR (vX.Y.Z → v(X+1).0.0)** — any breaking change to a stable surface above. Requires migration notes in the changelog.
- **MINOR (vX.Y.Z → vX.(Y+1).0)** — a new feature, agent, command, or hook (non-breaking), or a strictly additive behavior change to a stable surface.
- **PATCH (vX.Y.Z → vX.Y.(Z+1))** — a bug fix, a doc-only change, or an internal refactor with no observable effect.

## Pre-releases

Pre-release tags look like `v1.4.0-rc1` or `v1.4.0-beta`. They are tagged like normal releases but excluded from `latest` resolution unless `--include-prerelease` is passed to `jkz update` (future work).

## Deprecation

Anything on the stable list can be deprecated at a MINOR bump. A deprecation must be:

1. Announced in the changelog under a `### Deprecated` section.
2. Logged at runtime when the deprecated surface is used (for example, `[DEPRECATED] /jkz:foo will be removed in v2.0`).
3. Kept for at least one MAJOR cycle before removal.
