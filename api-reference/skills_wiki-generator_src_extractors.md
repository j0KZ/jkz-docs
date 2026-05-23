---
deprecated_since: null
description: Module skills/wiki-generator/src/extractors
editUrl: "https://github.com/j0KZ/jkz_Multi-Agent_System/edit/main/skills/wiki-generator/src/extractors/_notify_parse_failure.js"
pagefind: true
sidebar:
  label: extractors
  order: 12
title: skills/wiki-generator/src/extractors
---

## Module summary

Module skills/wiki-generator/src/extractors

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `CURSOR_REGEX` | variable | no |
| `ISSUES_QUERY` | variable | no |
| `ISSUE_COMMENTS_QUERY` | variable | no |
| `_formatJsDoc` | function | no |
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

```
CURSOR_REGEX
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `ISSUES_QUERY`

```
ISSUES_QUERY
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `ISSUE_COMMENTS_QUERY`

```
ISSUE_COMMENTS_QUERY
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `_formatJsDoc`

```
_formatJsDoc(parsed)
```

#### Params

- `parsed`

#### Returns

_None._

#### Examples

_None._

### `classifyCommit`

```
classifyCommit(subject)
```

Pure: classify a single conventional-commit subject line.

#### Params

- `subject`

#### Returns

_None._

#### Examples

_None._

### `extractAst`

```
extractAst({ path, source })
```

#### Params

- `{ path, source }`

#### Returns

_None._

#### Examples

_None._

### `extractAstAndJsDoc`

```
extractAstAndJsDoc({ path, source })
```

#### Params

- `{ path, source }`

#### Returns

_None._

#### Examples

_None._

### `extractChangelog`

```
async extractChangelog({ since = '30.days.ago', repoDir = process.cwd() })
```

Run `git log --since=<since>` in `repoDir` and return classified commits.

#### Params

- `{ since = '30.days.ago', repoDir = process.cwd() } = {}`

#### Returns

_None._

#### Examples

_None._

### `extractConfigComments`

```
async extractConfigComments(rootDir)
```

Extract inline-comment annotations from project config files.

Looked-up files (best-effort -- missing files yield empty maps):
  - `vitest.config.ts` (or `.js`, `.mts`, `.cts`) -- top-level
    keys inside the `test: { ... }` block.
  - `package.json` + sibling `package.scripts.md` -- comment for
    each entry in `scripts`.
  - `.env.example` -- comment for each `KEY=...` line.

#### Params

- `rootDir = process.cwd()`

#### Returns

_None._

#### Examples

_None._

### `extractIssues`

```
async extractIssues({
  owner,
  repo,
  client,
  cursorPath = DEFAULT_CURSOR_PATH,
  pageSize = DEFAULT_PAGE_SIZE,
  maxPages = DEFAULT_MAX_PAGES,
  reset = false,
  now = () => new Date(),
})
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

_None._

#### Examples

_None._

### `extractJsDoc`

```
extractJsDoc({ path, source })
```

#### Params

- `{ path, source }`

#### Returns

_None._

#### Examples

_None._

### `extractReadmes`

```
async extractReadmes(rootDir, opts)
```

Walk `rootDir` and collect every README.md in any subdirectory.

#### Params

- `rootDir`
- `opts = {}`

#### Returns

_None._

#### Examples

_None._

### `notifyParseFailure`

```
notifyParseFailure({ path, message })
```

#### Params

- `{ path, message }`

#### Returns

_None._

#### Examples

_None._

### `parseSource`

```
parseSource({ path, source })
```

#### Params

- `{ path, source }`

#### Returns

_None._

#### Examples

_None._

### `readCursor`

```
readCursor(filePath)
```

Read the cursor file. Returns safe defaults on any failure path.

Validation rules:
 - Missing file, unreadable file, malformed JSON → defaults.
 - `last_updated_at`: must be a string, must parse via `Date.parse`, and
   must not be in the future. On any failure → coerce to `null` and warn.
 - `end_cursor`: must match `CURSOR_REGEX`. On failure → coerce to `null`.

#### Params

- `filePath`

#### Returns

_None._

#### Examples

_None._

### `validatePath`

```
validatePath(rawPath, root, kind)
```

Validate that `rawPath` resolves to a location inside `root`. On any
failure, write a generic error to stderr and call `process.exit(2)`.

#### Params

- `rawPath`
- `root`
- `kind`

#### Returns

_None._

#### Examples

_None._

### `writeCursor`

```
writeCursor(filePath, cursor)
```

Atomically persist the cursor. Always overwrites `updated_at` with the
current ISO timestamp. Creates the parent directory if missing.

#### Params

- `filePath`
- `cursor`

#### Returns

_None._

#### Examples

_None._
