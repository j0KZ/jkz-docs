---
deprecated_since: null
description: Module src/guards
pagefind: true
sidebar:
  label: guards
  order: 8
title: src/guards
---

## Module summary

Module src/guards

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

#### Examples

_None._

### `HallucinationGuardError`

```text
HallucinationGuardError
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `SNAPSHOT_UPDATE_SIGNAL`

```text
SNAPSHOT_UPDATE_SIGNAL
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `SOURCE_RATIO_THRESHOLD`

```text
SOURCE_RATIO_THRESHOLD
```

#### Params

_None._

#### Returns

_None._

#### Examples

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

- `opts = {}`

#### Returns

`object`

#### Examples

_None._

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

- `argv = process.argv.slice(2)`
- `io = {}`

#### Returns

`number`

#### Examples

_None._
