---
deprecated_since: null
description: Module skills/wiki-generator/src/sanitizers
editUrl: null
pagefind: true
sidebar:
  label: sanitizers
  order: 16
title: skills/wiki-generator/src/sanitizers
---

## Module summary

Module skills/wiki-generator/src/sanitizers

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `BODY_LOC_THRESHOLD` | variable | no |
| `ENTROPY_MIN_SCORE` | variable | no |
| `ENTROPY_WINDOW_RE` | variable | no |
| `EXIT_SECRET_DETECTED` | variable | no |
| `HOST_REGEXES` | variable | no |
| `INPUT_BYTE_CAP` | variable | no |
| `MAX_MATCHES` | variable | no |
| `PII_ALLOWLIST` | variable | no |
| `PROVIDER_REGEXES` | variable | no |
| `PUBLIC_HOST_ALLOWLIST` | variable | no |
| `STAGE_ORDER` | variable | no |
| `composeAll` | function | no |
| `isPathBlocked` | function | no |
| `logSecretHit` | function | no |
| `sanitizeImplementations` | function | no |
| `sanitizeIssueLog` | function | no |
| `sanitizePII` | function | no |
| `scan` | function | no |
| `shannonEntropy` | function | no |

## Detail

### `BODY_LOC_THRESHOLD`

```
BODY_LOC_THRESHOLD
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `ENTROPY_MIN_SCORE`

```
ENTROPY_MIN_SCORE
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `ENTROPY_WINDOW_RE`

```
ENTROPY_WINDOW_RE
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `EXIT_SECRET_DETECTED`

```
EXIT_SECRET_DETECTED
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `HOST_REGEXES`

```
HOST_REGEXES
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `INPUT_BYTE_CAP`

```
INPUT_BYTE_CAP
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `MAX_MATCHES`

```
MAX_MATCHES
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `PII_ALLOWLIST`

```
PII_ALLOWLIST
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `PROVIDER_REGEXES`

```
PROVIDER_REGEXES
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `PUBLIC_HOST_ALLOWLIST`

```
PUBLIC_HOST_ALLOWLIST
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `STAGE_ORDER`

```
STAGE_ORDER
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `composeAll`

```
composeAll(content, opts)
```

Run all sanitizers in canonical order on `content`.

#### Params

- `content`
- `opts`

#### Returns

_None._

#### Examples

_None._

### `isPathBlocked`

```
isPathBlocked(absPath)
```

Stateless predicate: does the given absolute path point at content that the
wiki-generator must refuse to read? Fail-closed: ambiguous filesystem errors
(EACCES, ELOOP, etc.) resolve to `true`. ENOENT is the one safe miss because
the on-disk pattern check already ran against the resolved input.

#### Params

- `absPath`

#### Returns

_None._

#### Examples

_None._

### `logSecretHit`

```
logSecretHit(opts)
```

Emit a structured `secret_hit` record to stderr.

#### Params

- `opts`

#### Returns

_None._

#### Examples

_None._

### `sanitizeImplementations`

```
sanitizeImplementations(content)
```

#### Params

- `content`

#### Returns

_None._

#### Examples

_None._

### `sanitizeIssueLog`

```
sanitizeIssueLog(content)
```

#### Params

- `content`

#### Returns

_None._

#### Examples

_None._

### `sanitizePII`

```
sanitizePII(content)
```

#### Params

- `content`

#### Returns

_None._

#### Examples

_None._

### `scan`

```
scan(content, opts)
```

Scan `content` for secret-shaped substrings.

#### Params

- `content`
- `opts`

#### Returns

_None._

#### Examples

_None._

### `shannonEntropy`

```
shannonEntropy(s)
```

Shannon entropy of a string in bits per character.

Returns 0 for inputs shorter than the length floor (20 characters) so the
caller can short-circuit candidate windows without a math call. Above the
floor the value is `-Σ p(c) * log2(p(c))` over the multiset of characters.

Pure, allocation-bounded (one `Map` keyed by unique characters), no I/O.

#### Params

- `s`

#### Returns

_None._

#### Examples

_None._
