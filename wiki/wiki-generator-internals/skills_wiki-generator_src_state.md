---
deprecated_since: null
description: Module skills/wiki-generator/src/state
pagefind: true
sidebar:
  label: state
  order: 11
title: skills/wiki-generator/src/state
---

## Module summary

_None._

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `CLEANUP_KEEPLIST` | variable | no |
| `cleanupOrphanPages` | function | no |
| `prune` | function | no |

## Detail

### `CLEANUP_KEEPLIST`

```text
CLEANUP_KEEPLIST
```

#### Params

_None._

#### Returns

_None._

### `cleanupOrphanPages`

```text
async cleanupOrphanPages({ wikiAbs, ownedAbs, keeplist = CLEANUP_KEEPLIST }): Promise<object>
```

Remove orphan `.md` pages from the wiki output tree.

A page is an orphan when its absolute path is NOT in `ownedAbs` AND its
wiki-relative POSIX path is NOT in `keeplist`. Orphans are `unlink`ed.

#### Params

- `{ wikiAbs, ownedAbs, keeplist = CLEANUP_KEEPLIST }`

#### Returns

`Promise<object>`

### `prune`

```text
async prune(opts): Promise<unknown>
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

- `opts: @param {string} opts.stateDir            wiki-generator state directory.
 * @param {Iterable<string>} opts.presentFiles paths currently in the repo.
 * @param {(issueNumber: number) => Promise<boolean> | boolean} opts.issueChecker
 *        async predicate: true=exists, false=404. Throws on transient errors.
 * @param {number} [opts.ttlDays=90]        TTL in whole days.
 * @param {Date} [opts.now=new Date()]      injected clock for tests.
 * @param {boolean} [opts.telemetry=true]   send Telegram telemetry on success.
 *  = {}`

#### Returns

`Promise<unknown>`
