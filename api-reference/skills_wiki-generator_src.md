---
deprecated_since: null
description: Module skills/wiki-generator/src
editUrl: null
pagefind: true
sidebar:
  label: src
  order: 7
title: skills/wiki-generator/src
---

## Module summary

Module skills/wiki-generator/src

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `Orchestrator` | class | no |
| `PHASES` | variable | no |
| `createTelegramLoggerAdapter` | function | no |

## Detail

### `Orchestrator`

```
Orchestrator
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `PHASES`

```
PHASES
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `createTelegramLoggerAdapter`

```
createTelegramLoggerAdapter(impl)
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

_None._

#### Examples

_None._
