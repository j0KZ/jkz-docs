---
deprecated_since: null
description: Module skills/wiki-generator/src/diff
editUrl: "https://github.com/j0KZ/jkz_Multi-Agent_System/edit/main/skills/wiki-generator/src/diff/change_detector.js"
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

```
async addEntry(stateDir, issueNumber)
```

Idempotently add an issue number to the persisted set. Returns whether the
entry was newly added and the resulting total count.

#### Params

- `stateDir`
- `issueNumber`

#### Returns

_None._

#### Examples

_None._

### `detectChanges`

```
detectChanges(prevHashes, nextHashes)
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

_None._

#### Examples

_None._

### `hashContent`

```
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

```
async hashFile(absPath)
```

Read a file from disk and return its SHA-256 hex digest.

#### Params

- `absPath`

#### Returns

_None._

#### Examples

_None._

### `hashModule`

```
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

```
async loadEntries(stateDir)
```

Load the persisted set of documented issue numbers. Returns an empty Set
when the state file does not exist.

#### Params

- `stateDir`

#### Returns

_None._

#### Examples

_None._

### `loadHashes`

```
async loadHashes(stateDir)
```

Load the persisted file-hash map from `<stateDir>/file-hashes.json`.
Returns an empty object when the file does not yet exist.

#### Params

- `stateDir`

#### Returns

_None._

#### Examples

_None._

### `saveEntries`

```
async saveEntries(stateDir, set)
```

Persist the set of documented issue numbers atomically, sorted ascending.

#### Params

- `stateDir`
- `set`

#### Returns

_None._

#### Examples

_None._

### `saveHashes`

```
async saveHashes(stateDir, hashes)
```

Persist the file-hash map atomically. Keys are sorted alphabetically so the
on-disk artifact is deterministic across runs.

#### Params

- `stateDir`
- `hashes`

#### Returns

_None._

#### Examples

_None._
