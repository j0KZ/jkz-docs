---
deprecated_since: null
description: Module skills/wiki-generator/src/guards
pagefind: true
sidebar:
  label: guards
  order: 8
title: skills/wiki-generator/src/guards
---

## Module summary

_None._

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `DOC_RATIO_THRESHOLD` | variable | no |
| `HallucinationGuardError` | class | no |
| `SNAPSHOT_UPDATE_SIGNAL` | variable | no |
| `SOURCE_RATIO_THRESHOLD` | variable | no |
| `checkHallucination` | function | no |
| `main` | function | no |

## Detail

### `DOC_RATIO_THRESHOLD`

```text
DOC_RATIO_THRESHOLD
```

#### Params

_None._

#### Returns

_None._

### `HallucinationGuardError`

```text
HallucinationGuardError
```

#### Params

_None._

#### Returns

_None._

### `SNAPSHOT_UPDATE_SIGNAL`

```text
SNAPSHOT_UPDATE_SIGNAL
```

#### Params

_None._

#### Returns

_None._

### `SOURCE_RATIO_THRESHOLD`

```text
SOURCE_RATIO_THRESHOLD
```

#### Params

_None._

#### Returns

_None._

### `checkHallucination`

```text
checkHallucination(opts): object
```

Run the hallucination guard for one doc/source pair.

Decision table:
 - doc-ratio > 0.20 AND source-ratio < 0.05 -> BLOCK, unless the
   `[snapshot-update]` signal is present, in which case the doc change is
   accepted and the golden snapshot is refreshed.
 - any other combination -> PASS. When the doc differs from its golden
   snapshot and the signal is present, the snapshot is refreshed.

#### Params

- `opts: @param {string} opts.docPath absolute path to the generated doc
 * @param {string} opts.sourcePath absolute path to the source file
 * @param {string} opts.goldenPath absolute path to the golden snapshot
 * @param {string} [opts.docRelPath] doc path relative to `repoDir` for git
 * @param {string} [opts.sourceRelPath] source path relative to `repoDir` for git
 * @param {string} [opts.repoDir] git working directory (default: cwd)
 * @param {string} [opts.commitMessage] commit message to scan for the signal
 * @param {NodeJS.ProcessEnv} [opts.env] env to scan for WG_SNAPSHOT_UPDATE
 * @param {(args: string[], cwd: string) => {stdout: string, stderr: string, code: number}} [opts.gitRunner]
 *   injection seam for tests so the real `git` is never contacted
 *  = {}`

#### Returns

`object`

### `main`

```text
main(argv, io): number
```

CLI entrypoint. Returns the process exit code instead of calling
`process.exit` so it stays unit-testable.

  node hallucination_guard.js \
    --doc <path> --source <path> --golden <path> \
    [--repo-dir <path>] [--commit-message <msg>]

Exit codes: 0 = pass, 1 = blocked (hallucination), 2 = usage / runtime error.

#### Params

- `argv: string[] = process.argv.slice(2)` — argv slice (defaults to process.argv.slice(2))
- `io: {log?: Function, error?: Function, env?: NodeJS.ProcessEnv,
 *   gitRunner?: Function} = {}` — `gitRunner` is an injection seam for tests

#### Returns

`number`
