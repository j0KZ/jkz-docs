---
deprecated_since: null
description: Module src/diff
pagefind: true
sidebar:
  label: diff
  order: 4
title: src/diff
---

## Module summary

Module src/diff

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
async addEntry(stateDir, issueNumber): Promise<object>
```

Idempotently add an issue number to the persisted set. Returns whether the
entry was newly added and the resulting total count.

#### Params

- `stateDir`
- `issueNumber`

#### Returns

`Promise<object>`

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
hashContent(input)
```

SHA-256 hex digest over the given content. Buffers and strings are accepted;
strings are hashed as UTF-8 bytes (matching the on-disk representation).

#### Params

- `input`

#### Returns

_None._

#### Examples

_None._

### `hashFile`

```text
async hashFile(absPath): Promise<unknown>
```

Read a file from disk and return its SHA-256 hex digest.

#### Params

- `absPath`

#### Returns

`Promise<unknown>`

#### Examples

_None._

### `hashModule`

```text
hashModule(parts)
```

Compute the composite SHA-256 module hash from the four input sections.
Changing any single section (AST, JSDoc, adjacent README, adjacent
comments) produces a different hex digest. Same inputs always produce the
same digest.

#### Params

- `parts`

#### Returns

_None._

#### Examples

_None._

### `loadEntries`

```text
async loadEntries(stateDir): Promise<unknown>
```

Load the persisted set of documented issue numbers. Returns an empty Set
when the state file does not exist.

#### Params

- `stateDir`

#### Returns

`Promise<unknown>`

#### Examples

_None._

### `loadHashes`

```text
async loadHashes(stateDir): Promise<object>
```

Load the persisted file-hash map from `<stateDir>/file-hashes.json`.
Returns an empty object when the file does not yet exist.

#### Params

- `stateDir`

#### Returns

`Promise<object>`

#### Examples

_None._

### `saveEntries`

```text
async saveEntries(stateDir, set): Promise<void>
```

Persist the set of documented issue numbers atomically, sorted ascending.

#### Params

- `stateDir`
- `set`

#### Returns

`Promise<void>`

#### Examples

_None._

### `saveHashes`

```text
async saveHashes(stateDir, hashes): Promise<void>
```

Persist the file-hash map atomically. Keys are sorted alphabetically so the
on-disk artifact is deterministic across runs.

#### Params

- `stateDir`
- `hashes`

#### Returns

`Promise<void>`

#### Examples

_None._
