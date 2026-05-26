---
deprecated_since: null
description: Module skills/wiki-generator/src/publisher
editUrl: null
pagefind: true
sidebar:
  label: publisher
  order: 15
title: skills/wiki-generator/src/publisher
---

## Module summary

Module skills/wiki-generator/src/publisher

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
}): unknown
```

#### Params

- `{   llmClient,   changedFiles,   sourceCommits,   repoUrl,   dryRun, }`

#### Returns

`unknown`

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
}): object
```

#### Params

- `{   githubClient,   owner,   repo,   pullNumber,   hitlRequired,   dryRun,   logger, }`

#### Returns

`object`

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
}): unknown
```

#### Params

- `{   githubClient,   owner,   repo,   branch,   title,   body,   logger,   base = 'main', }`

#### Returns

`unknown`

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
}): object
```

#### Params

- `{   githubClient,   owner,   repo,   files,   commitMessage,   hitlRequired,   dryRun,   logger, }`

#### Returns

`object`

#### Examples

_None._
