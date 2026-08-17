---
deprecated_since: null
description: Module skills/wiki-generator/src/publisher
pagefind: true
sidebar:
  label: publisher
  order: 9
title: skills/wiki-generator/src/publisher
---

## Module summary

_None._

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `DRIFT_PR_TITLE_MARKER` | variable | no |
| `buildOpenWikiAutoPrQuery` | function | no |
| `findOpenAutoPublishPR` | function | no |
| `generatePRBody` | function | no |
| `handleAutoMerge` | function | no |
| `openPR` | function | no |
| `publishFiles` | function | no |

## Detail

### `DRIFT_PR_TITLE_MARKER`

```text
DRIFT_PR_TITLE_MARKER
```

#### Params

_None._

#### Returns

_None._

### `buildOpenWikiAutoPrQuery`

```text
buildOpenWikiAutoPrQuery({ owner, repo }): string
```

#### Params

- `{ owner, repo }`

#### Returns

`string`

### `findOpenAutoPublishPR`

```text
async findOpenAutoPublishPR({ githubClient, owner, repo, logger }): Promise<unknown>
```

Search for an already-open auto-publish PR so a re-run refreshes a single PR in
place instead of stacking a fresh `wiki/auto-<date>` PR each run (#1772).

The search is scoped to OPEN PRs on the `wiki/auto-` branch prefix -- the same
prefix the drift sign-off PRs use. The returned node is the FIRST entry that is
OPEN, NOT a draft, and whose title does NOT carry `(sign-off required)`. The
draft + marker filters keep the auto-publish path from ever touching a drift
sign-off PR (which is a draft PR with its own dedup/refresh logic).

Fail-safe: a thrown lookup is logged and surfaced to the caller as null so the
run proceeds to open a fresh PR (never suppress a publish). Mirrors
`drift_pr.findOpenDriftPR`.

#### Params

- `{ githubClient, owner, repo, logger }`

#### Returns

`Promise<unknown>`

### `generatePRBody`

```text
async generatePRBody({
  llmClient,
  changedFiles,
  sourceCommits,
  repoUrl,
  dryRun,
}): Promise<unknown>
```

#### Params

- `{   llmClient,   changedFiles,   sourceCommits,   repoUrl,   dryRun, }`

#### Returns

`Promise<unknown>`

### `handleAutoMerge`

```text
async handleAutoMerge({
  githubClient,
  owner,
  repo,
  pullNumber,
  hitlRequired,
  dryRun,
  logger,
}): Promise<object>
```

#### Params

- `{   githubClient,   owner,   repo,   pullNumber,   hitlRequired,   dryRun,   logger, }`

#### Returns

`Promise<object>`

### `openPR`

```text
async openPR({
  githubClient,
  owner,
  repo,
  branch,
  title,
  body,
  logger,
  base = 'main',
  draft = false,
}): Promise<unknown>
```

#### Params

- `{   githubClient,   owner,   repo,   branch,   title,   body,   logger,   base = 'main',   draft = false, }`

#### Returns

`Promise<unknown>`

### `publishFiles`

```text
async publishFiles({
  githubClient,
  owner,
  repo,
  files,
  commitMessage,
  dryRun,
  logger,
}): Promise<object>
```

#### Params

- `{   githubClient,   owner,   repo,   files,   commitMessage,   dryRun,   logger, }`

#### Returns

`Promise<object>`
