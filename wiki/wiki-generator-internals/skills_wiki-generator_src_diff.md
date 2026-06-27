---
deprecated_since: null
description: Module skills/wiki-generator/src/diff
pagefind: true
sidebar:
  label: diff
  order: 4
title: skills/wiki-generator/src/diff
---

## Module summary

_None._

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `addEntry` | function | no |
| `classifyDrift` | function | no |
| `detectChanges` | function | no |
| `detectDrift` | function | no |
| `hashContent` | function | no |
| `hashFile` | function | no |
| `hashModule` | function | no |
| `loadEntries` | function | no |
| `loadHashes` | function | no |
| `loadPageState` | function | no |
| `markReviewed` | function | no |
| `runDriftCheck` | function | no |
| `saveEntries` | function | no |
| `saveHashes` | function | no |
| `savePageState` | function | no |

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

### `classifyDrift`

```text
classifyDrift(pageSources, currentHashes, reviewState): object
```

Classify drift between reviewed page sources and the current source hashes.

#### Params

- `pageSources: { [pageId: string]: string[] }` — caller-injected map of pageId to its source paths.
- `currentHashes: { [sourcePath: string]: string }` — current sha256 hex per source path; a deleted source is simply absent.
- `reviewState: object` — the map returned by `loadPageState`.

#### Returns

`object`

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

### `detectDrift`

```text
async detectDrift({
  githubClient,
  logger,
  orchestrator,
  generated,
  config,
  owner,
  repo,
}): Promise<object>
```

Detect drift between the would-be generated wiki output and the live docs
repo, scoped to the `wikiOutput` subtree.

The would-be output may be supplied directly via `generated`/`config`/
`owner`/`repo` (used by the tests and by `runDriftCheck`), otherwise it is
produced by `orchestrator.generatePublishFiles()`. The live repo is cloned
into a temp dir via `githubClient.cloneRepo`, compared file-by-file via
SHA-256, and the temp dir is always removed.

#### Params

- `{   githubClient,   logger,   orchestrator,   generated,   config,   owner,   repo, }`

#### Returns

`Promise<object>`

### `hashContent`

```text
hashContent(input): string
```

SHA-256 hex digest over the given content. Buffers and strings are accepted;
strings are hashed as UTF-8 bytes (matching the on-disk representation).

#### Params

- `input`

#### Returns

`string`

### `hashFile`

```text
async hashFile(absPath): Promise<string>
```

Read a file from disk and return its SHA-256 hex digest.

#### Params

- `absPath`

#### Returns

`Promise<string>`

### `hashModule`

```text
hashModule(parts): string
```

Compute the composite SHA-256 module hash from the four input sections.
Changing any single section (AST, JSDoc, adjacent README, adjacent
comments) produces a different hex digest. Same inputs always produce the
same digest.

#### Params

- `parts`

#### Returns

`string`

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

### `loadPageState`

```text
async loadPageState(stateDir): Promise<unknown>
```

Load the persisted per-page review state from
`<stateDir>/page-review-state.json`. Returns a null-prototype map keyed by
pageId when the file does not yet exist. Throws on malformed JSON or shape.

#### Params

- `stateDir`

#### Returns

`Promise<unknown>`

### `markReviewed`

```text
async markReviewed(stateDir, pageId, sources, { now }): Promise<void>
```

Upsert a page's reviewed source snapshot and persist. `now` is injectable so
tests can pin the timestamp; it defaults to the current UTC ISO string.

#### Params

- `stateDir`
- `pageId`
- `sources`
- `{ now } = {}`

#### Returns

`Promise<void>`

### `runDriftCheck`

```text
async runDriftCheck({ githubClient, logger, orchestrator, dryRun }): Promise<object>
```

Run the drift check end to end. When drift is detected (and not a dry run),
publishes the changed pages to a fresh branch and opens a **draft** PR for
owner sign-off. NEVER merges, never auto-merges — the human signs the diff.

#### Params

- `{ githubClient, logger, orchestrator, dryRun }`

#### Returns

`Promise<object>`

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

### `savePageState`

```text
async savePageState(stateDir, state): Promise<void>
```

Persist the per-page review state atomically. Page keys are sorted and each
nested `sources` map's keys are sorted so the on-disk artifact is
deterministic across runs.

#### Params

- `stateDir`
- `state`

#### Returns

`Promise<void>`
