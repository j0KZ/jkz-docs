---
deprecated_since: null
description: Module src
pagefind: true
sidebar:
  label: src
  order: 1
title: src
---

## Module summary

Module src

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `Orchestrator` | class | no |
| `PHASES` | variable | no |
| `createTelegramLoggerAdapter` | function | no |

## Detail

### `Orchestrator`

```text
Orchestrator
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `PHASES`

```text
PHASES
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `createTelegramLoggerAdapter`

```text
createTelegramLoggerAdapter(impl): object
```

Build an adapter that bridges the orchestrator's structured-event logging
and the `{logUpdate, logError}` string-or-object instance interface the
publisher modules (`git_publisher`, `auto_merge`) require.

`telegram_logger.js` exports module-level `logUpdate(event)`/`logError(event)`
where `event` is `{message, ...meta}`. `git_publisher.publishFiles` calls
`logger.logUpdate('git_publisher: ...')` with a plain string. The adapter
normalizes a string argument to `{message}` so both call shapes reach the
underlying implementation as event objects.

#### Params

- `impl = { logUpdate: realLogUpdate, logError: realLogError }`

#### Returns

`object`

#### Examples

_None._
