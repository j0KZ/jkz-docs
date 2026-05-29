---
deprecated_since: null
description: Module src/publisher
pagefind: true
sidebar:
  label: publisher
  order: 9
title: src/publisher
---

## Module summary

Module src/publisher

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `generatePRBody` | function | no |
| `handleAutoMerge` | function | no |
| `openPR` | function | no |
| `publishFiles` | function | no |

## Detail

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

#### Examples

_None._

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

#### Examples

_None._

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
}): Promise<unknown>
```

#### Params

- `{   githubClient,   owner,   repo,   branch,   title,   body,   logger,   base = 'main', }`

#### Returns

`Promise<unknown>`

#### Examples

_None._

### `publishFiles`

```text
async publishFiles({
  githubClient,
  owner,
  repo,
  files,
  commitMessage,
  hitlRequired,
  dryRun,
  logger,
}): Promise<object>
```

#### Params

- `{   githubClient,   owner,   repo,   files,   commitMessage,   hitlRequired,   dryRun,   logger, }`

#### Returns

`Promise<object>`

#### Examples

_None._
