---
deprecated_since: null
description: Module skills/wiki-generator/src/sanitizers
pagefind: true
sidebar:
  label: sanitizers
  order: 10
title: skills/wiki-generator/src/sanitizers
---

## Module summary

_None._

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

```text
BODY_LOC_THRESHOLD
```

#### Params

_None._

#### Returns

_None._

### `ENTROPY_MIN_SCORE`

```text
ENTROPY_MIN_SCORE
```

#### Params

_None._

#### Returns

_None._

### `ENTROPY_WINDOW_RE`

```text
ENTROPY_WINDOW_RE
```

#### Params

_None._

#### Returns

_None._

### `EXIT_SECRET_DETECTED`

```text
EXIT_SECRET_DETECTED
```

#### Params

_None._

#### Returns

_None._

### `HOST_REGEXES`

```text
HOST_REGEXES
```

#### Params

_None._

#### Returns

_None._

### `INPUT_BYTE_CAP`

```text
INPUT_BYTE_CAP
```

#### Params

_None._

#### Returns

_None._

### `MAX_MATCHES`

```text
MAX_MATCHES
```

#### Params

_None._

#### Returns

_None._

### `PII_ALLOWLIST`

```text
PII_ALLOWLIST
```

#### Params

_None._

#### Returns

_None._

### `PROVIDER_REGEXES`

```text
PROVIDER_REGEXES
```

#### Params

_None._

#### Returns

_None._

### `PUBLIC_HOST_ALLOWLIST`

```text
PUBLIC_HOST_ALLOWLIST
```

#### Params

_None._

#### Returns

_None._

### `STAGE_ORDER`

```text
STAGE_ORDER
```

#### Params

_None._

#### Returns

_None._

### `composeAll`

```text
composeAll(content, opts): object
```

Run all sanitizers in canonical order on `content`.

#### Params

- `content: string` — - The text to sanitize.
- `opts: {path?: string, hostAllowlist?: string[]}` — - Optional. `opts.path` is the absolute filesystem path the content was read from; when supplied it gates the pipeline via `isPathBlocked`. `opts.hostAllowlist` is an array of bare hostnames forwarded to the secret detector as per-call additions to its static `PUBLIC_HOST_ALLOWLIST` (matches the host exactly OR any subdomain of it). Use for the project's own configured public hosts (e.g. the docs site, the publish-target repo host).

#### Returns

`object`

### `isPathBlocked`

```text
isPathBlocked(absPath): boolean
```

Stateless predicate: does the given absolute path point at content that the
wiki-generator must refuse to read? Fail-closed: ambiguous filesystem errors
(EACCES, ELOOP, etc.) resolve to `true`. ENOENT is the one safe miss because
the on-disk pattern check already ran against the resolved input.

#### Params

- `absPath: string` — - Absolute (or normalizable-to-absolute) filesystem path.

#### Returns

`boolean`

### `logSecretHit`

```text
logSecretHit(opts): void
```

Emit a structured `secret_hit` record to stderr.

#### Params

- `opts: {path: string, kind: string, fingerprint: string}`

#### Returns

`void`

### `sanitizeImplementations`

```text
sanitizeImplementations(content)
```

#### Params

- `content: string`

#### Returns

`string`

### `sanitizeIssueLog`

```text
sanitizeIssueLog(content)
```

#### Params

- `content: string`

#### Returns

`string`

### `sanitizePII`

```text
sanitizePII(content)
```

#### Params

- `content: string`

#### Returns

`string`

### `scan`

```text
scan(content, opts): object
```

Scan `content` for secret-shaped substrings.

#### Params

- `content: string` — - The text to scan.
- `opts: object|undefined` — - Optional. `opts.hostAllowlist` is an array of bare hostnames (e.g. `['docs.j0kz.dev']`) that supplement the static `PUBLIC_HOST_ALLOWLIST` for url/host matches in this call only. Comparison is case-insensitive and matches the exact host OR any subdomain of it. Non-string entries are ignored.

#### Returns

`object`

### `shannonEntropy`

```text
shannonEntropy(s)
```

Shannon entropy of a string in bits per character.

Returns 0 for inputs shorter than the length floor (20 characters) so the
caller can short-circuit candidate windows without a math call. Above the
floor the value is `-Σ p(c) * log2(p(c))` over the multiset of characters.

Pure, allocation-bounded (one `Map` keyed by unique characters), no I/O.

#### Params

- `s: string` — - Input string to score.

#### Returns

`number`
