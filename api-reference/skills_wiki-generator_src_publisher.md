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

```
async generatePRBody({
  llmClient,
  changedFiles,
  sourceCommits,
  repoUrl,
  dryRun,
})
```

#### Params

- `{   llmClient,   changedFiles,   sourceCommits,   repoUrl,   dryRun, }`

#### Returns

_None._

#### Examples

_None._

### `handleAutoMerge`

```
async handleAutoMerge({
  githubClient,
  owner,
  repo,
  pullNumber,
  hitlRequired,
  dryRun,
  logger,
})
```

#### Params

- `{   githubClient,   owner,   repo,   pullNumber,   hitlRequired,   dryRun,   logger, }`

#### Returns

_None._

#### Examples

_None._

### `openPR`

```
async openPR({
  githubClient,
  owner,
  repo,
  branch,
  title,
  body,
  logger,
  base = 'main',
})
```

#### Params

- `{   githubClient,   owner,   repo,   branch,   title,   body,   logger,   base = 'main', }`

#### Returns

_None._

#### Examples

_None._

### `publishFiles`

```
async publishFiles({
  githubClient,
  owner,
  repo,
  files,
  commitMessage,
  hitlRequired,
  dryRun,
  logger,
})
```

#### Params

- `{   githubClient,   owner,   repo,   files,   commitMessage,   hitlRequired,   dryRun,   logger, }`

#### Returns

_None._

#### Examples

_None._
