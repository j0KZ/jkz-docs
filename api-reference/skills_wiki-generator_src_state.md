---
deprecated_since: null
description: Module skills/wiki-generator/src/state
editUrl: null
pagefind: true
sidebar:
  label: state
  order: 17
title: skills/wiki-generator/src/state
---

## Module summary

Module skills/wiki-generator/src/state

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `prune` | function | no |

## Detail

### `prune`

```
async prune(opts)
```

Prune stale entries from `file-hashes.json` and `issue-entries.json`.

Two-pass policy:
  1. Files whose repo-relative path is no longer in `presentFiles` get a
     `missingSince` timestamp; once that timestamp is older than `ttlDays`
     the entry is moved to a monthly archive and removed from the active
     file. Files that come back clear their `missingSince` immediately.
  2. Issue numbers whose `issueChecker(n)` returns false (404) follow the
     same lifecycle. If `issueChecker` throws, the entry is left untouched
     so transient errors (rate limits, network) do not classify a live
     issue as deleted.

#### Params

- `opts = {}`

#### Returns

_None._

#### Examples

_None._
