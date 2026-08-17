---
deprecated_since: null
description: Module skills/wiki-generator/src/diff/lib
pagefind: true
sidebar:
  label: lib
  order: 5
title: skills/wiki-generator/src/diff/lib
---

## Module summary

_None._

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `atomicWriteFile` | function | no |
| `atomicWriteJson` | function | no |

## Detail

### `atomicWriteFile`

```text
async atomicWriteFile(target, content): Promise<void>
```

Atomic UTF-8 string writer shared by wiki-generator. Creates the target's
parent directory, writes `content` to a temp file in the SAME directory as
the target, fsyncs it, then renames into place. Cross-device, permissions,
or ENOSPC errors during rename leave the tmp file cleaned up.

This is the single tmp+rename implementation in the skill; every other
atomic writer delegates here.

tmp filename format: tmp-<basename(target)>-<pid>-<ts>-<hex4>.

#### Params

- `target: string` — absolute path
- `content: string` — UTF-8 string

#### Returns

`Promise<void>`

### `atomicWriteJson`

```text
async atomicWriteJson(target, value, jsonSpace): Promise<void>
```

Atomic JSON writer shared by wiki-generator diff trackers. Serializes
`value` and delegates to `atomicWriteFile`, so the durability and cleanup
semantics documented there apply verbatim.

#### Params

- `target`
- `value`
- `jsonSpace = 2`

#### Returns

`Promise<void>`
