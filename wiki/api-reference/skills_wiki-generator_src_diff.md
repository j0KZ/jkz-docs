---
deprecated_since: null
description: Module skills/wiki-generator/src/diff
editUrl: null
pagefind: true
sidebar:
  label: diff
  order: 10
title: skills/wiki-generator/src/diff
---

## Module summary

Module skills/wiki-generator/src/diff

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `addEntry` | function | no |
| `detectChanges` | function | no |
| `hashContent` | function | no |
| `hashFile` | function | no |
| `hashModule` | function | no |
| `loadEntries` | function | no |
| `loadHashes` | function | no |
| `saveEntries` | function | no |
| `saveHashes` | function | no |

## Detail

### `addEntry`

```text
async addEntry(stateDir, issueNumber): object
```

Idempotently add an issue number to the persisted set. Returns whether the
entry was newly added and the resulting total count.

#### Params

- `stateDir`
- `issueNumber`

#### Returns

`object`

#### Examples

_None._

### `detectChanges`

```text
detectChanges(prevHashes, nextHashes): object
```

Compare two file-hash maps and emit added / modified / deleted / renamed
entries.

Rename heuristic: a path that disappeared from `prev` and a path that
appeared in `next` are paired as a rename when their content hashes match
exactly. The pairing is one-to-one and greedy by sorted `from` path so the
output is deterministic.

#### Params

- `prevHashes`
- `nextHashes`

#### Returns

`object`

#### Examples

_None._

### `hashContent`

```text
hashContent(input): unknown
```

SHA-256 hex digest over the given content. Buffers and strings are accepted;
strings are hashed as UTF-8 bytes (matching the on-disk representation).

#### Params

- `input`

#### Returns

`unknown`

#### Examples

_None._

### `hashFile`

```text
async hashFile(absPath): unknown
```

Read a file from disk and return its SHA-256 hex digest.

#### Params

- `absPath`

#### Returns

`unknown`

#### Examples

_None._

### `hashModule`

```text
hashModule(parts): unknown
```

Compute the composite SHA-256 module hash from the four input sections.
Changing any single section (AST, JSDoc, adjacent README, adjacent
comments) produces a different hex digest. Same inputs always produce the
same digest.

#### Params

- `parts`

#### Returns

`unknown`

#### Examples

_None._

### `loadEntries`

```text
async loadEntries(stateDir): unknown
```

Load the persisted set of documented issue numbers. Returns an empty Set
when the state file does not exist.

#### Params

- `stateDir`

#### Returns

`unknown`

#### Examples

_None._

### `loadHashes`

```text
async loadHashes(stateDir): object
```

Load the persisted file-hash map from `<stateDir>/file-hashes.json`.
Returns an empty object when the file does not yet exist.

#### Params

- `stateDir`

#### Returns

`object`

#### Examples

_None._

### `saveEntries`

```text
async saveEntries(stateDir, set): void
```

Persist the set of documented issue numbers atomically, sorted ascending.

#### Params

- `stateDir`
- `set`

#### Returns

`void`

#### Examples

_None._

### `saveHashes`

```text
async saveHashes(stateDir, hashes): void
```

Persist the file-hash map atomically. Keys are sorted alphabetically so the
on-disk artifact is deterministic across runs.

#### Params

- `stateDir`
- `hashes`

#### Returns

`void`

#### Examples

_None._
