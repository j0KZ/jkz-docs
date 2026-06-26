---
deprecated_since: null
description: Module skills/wiki-generator/src/extractors
pagefind: true
sidebar:
  label: extractors
  order: 6
title: skills/wiki-generator/src/extractors
---

## Module summary

_None._

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `CURSOR_REGEX` | variable | no |
| `ISSUES_QUERY` | variable | no |
| `ISSUE_COMMENTS_QUERY` | variable | no |
| `classifyCommit` | function | no |
| `extractAst` | function | no |
| `extractAstAndJsDoc` | function | no |
| `extractChangelog` | function | no |
| `extractConfigComments` | function | no |
| `extractIssues` | function | no |
| `extractJsDoc` | function | no |
| `extractReadmes` | function | no |
| `notifyParseFailure` | function | no |
| `parseSource` | function | no |
| `readCursor` | function | no |
| `validatePath` | function | no |
| `writeCursor` | function | no |

## Detail

### `CURSOR_REGEX`

```text
CURSOR_REGEX
```

#### Params

_None._

#### Returns

_None._

### `ISSUES_QUERY`

```text
ISSUES_QUERY
```

#### Params

_None._

#### Returns

_None._

### `ISSUE_COMMENTS_QUERY`

```text
ISSUE_COMMENTS_QUERY
```

#### Params

_None._

#### Returns

_None._

### `classifyCommit`

```text
classifyCommit(subject)
```

Pure: classify a single conventional-commit subject line.

#### Params

- `subject: string` — Commit message first line.

#### Returns

`'feat'\|'fix'\|'refactor'\|'chore'\|'docs'\|'test'\|'perf'\|'other'`

### `extractAst`

```text
extractAst({ path, source })
```

#### Params

- `{ path, source }`

#### Returns

_None._

### `extractAstAndJsDoc`

```text
extractAstAndJsDoc({ path, source }): object
```

#### Params

- `{ path, source }`

#### Returns

`object`

### `extractChangelog`

```text
async extractChangelog({ since = '30.days.ago', repoDir = process.cwd() }): Promise<unknown>
```

Run `git log --since=<since>` in `repoDir` and return classified commits.

#### Params

- `{ since = '30.days.ago', repoDir = process.cwd() } = {}`

#### Returns

`Promise<unknown>`

### `extractConfigComments`

```text
async extractConfigComments(rootDir): Promise<object>
```

Extract inline-comment annotations from project config files.

Looked-up files (best-effort -- missing files yield empty maps):
  - `vitest.config.ts` (or `.js`, `.mts`, `.cts`) -- top-level
    keys inside the `test: { ... }` block.
  - `package.json` + sibling `package.scripts.md` -- comment for
    each entry in `scripts`.
  - `.env.example` -- comment for each `KEY=...` line.

#### Params

- `rootDir: string = process.cwd()` — Project root. Default: `process.cwd()`.

#### Returns

`Promise<object>`

### `extractIssues`

```text
async extractIssues({
  owner,
  repo,
  client,
  cursorPath = DEFAULT_CURSOR_PATH,
  pageSize = DEFAULT_PAGE_SIZE,
  maxPages = DEFAULT_MAX_PAGES,
  reset = false,
  now = () => new Date(),
}): Promise<object>
```

Paginated GraphQL extractor for issues. See file header for cursor invariants.

Cursor-invalidation fallback (must_fix_in_build): when the pagination loop is
resuming mid-run (`pageCursor !== null`) and the GraphQL call throws an error
matched by `isCursorError` (explicit "cursor" mention, or pagination-argument
error referencing "after"/"before" with "invalid"), the loop resets
`pageCursor` to `null`, restores `sinceForRun` to the original
`cursor.last_updated_at`, and retries the call once. On retry success, it
immediately persists a cleared end_cursor (`writeCursor` with `end_cursor:
null`) so the stale cursor on disk cannot re-trigger the fallback on the
next run. If the retry also throws, the error propagates. Non-cursor errors
(auth, scope, rate-limit) bypass the retry and propagate immediately.

Per-issue comment pagination (#1391): each matched issue's `comments`
connection is walked via `ISSUE_COMMENTS_QUERY` until `pageInfo.hasNextPage`
is false or `MAX_COMMENTS_PAGES_PER_ISSUE` is hit. Issues with <= 100
comments take the single-fetch path (no extra GraphQL calls). The
`commentsTruncated` stat is true if ANY issue hit the per-issue page cap.

#### Params

- `{   owner,   repo,   client,   cursorPath = DEFAULT_CURSOR_PATH,   pageSize = DEFAULT_PAGE_SIZE,   maxPages = DEFAULT_MAX_PAGES,   reset = false,   now = () => new Date(), }`

#### Returns

`Promise<object>`

### `extractJsDoc`

```text
extractJsDoc({ path, source })
```

#### Params

- `{ path, source }`

#### Returns

_None._

### `extractReadmes`

```text
async extractReadmes(rootDir, opts): Promise<unknown>
```

Walk `rootDir` and collect every README.md in any subdirectory.

#### Params

- `rootDir: string` — Absolute or relative path to the repository root.
- `opts: @param {string[]} [opts.exclude] Extra directory basenames to skip.
 *        Combined with the defaults: `node_modules`, `dist`, `build`,
 *        `.next`, `.cache`, `coverage`, `.git`.
 *  = {}`

#### Returns

`Promise<unknown>`

### `notifyParseFailure`

```text
notifyParseFailure({ path, message }): void
```

#### Params

- `{ path, message }`

#### Returns

`void`

### `parseSource`

```text
parseSource({ path, source }): object
```

#### Params

- `{ path, source }`

#### Returns

`object`

### `readCursor`

```text
readCursor(filePath): object
```

Read the cursor file. Returns safe defaults on any failure path.

Validation rules:
 - Missing file, unreadable file, malformed JSON → defaults.
 - `last_updated_at`: must be a string, must parse via `Date.parse`, and
   must not be in the future. On any failure → coerce to `null` and warn.
 - `end_cursor`: must match `CURSOR_REGEX`. On failure → coerce to `null`.

#### Params

- `filePath: string`

#### Returns

`object`

### `validatePath`

```text
validatePath(rawPath, root, kind)
```

Validate that `rawPath` resolves to a location inside `root`. On any
failure, write a generic error to stderr and call `process.exit(2)`.

#### Params

- `rawPath: string` — The user-supplied path (from CLI argv).
- `root: string` — The allowed root (absolute path, already canonical OR will be canonicalized here).
- `kind: string` — Flag suffix for the stderr line (e.g. `output`).

#### Returns

`string`

### `writeCursor`

```text
writeCursor(filePath, cursor): void
```

Atomically persist the cursor. Always overwrites `updated_at` with the
current ISO timestamp. Creates the parent directory if missing.

#### Params

- `filePath: string`
- `cursor: { last_updated_at: string|null, end_cursor: string|null }`

#### Returns

`void`
