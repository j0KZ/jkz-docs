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
  hitlRequired,
  dryRun,
  logger,
}): Promise<object>
```

#### Params

- `{   githubClient,   owner,   repo,   files,   commitMessage,   hitlRequired,   dryRun,   logger, }`

#### Returns

`Promise<object>`
