---
deprecated_since: null
description: Module skills/wiki-generator/src/diff/lib
editUrl: "https://github.com/j0KZ/jkz_Multi-Agent_System/edit/main/skills/wiki-generator/src/diff/lib/atomic-write.js"
pagefind: true
sidebar:
  label: lib
  order: 11
title: skills/wiki-generator/src/diff/lib
---

## Module summary

Module skills/wiki-generator/src/diff/lib

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `atomicWriteJson` | function | no |

## Detail

### `atomicWriteJson`

```
async atomicWriteJson(target, value, jsonSpace)
```

Atomic JSON writer shared by wiki-generator diff trackers. Writes the
serialized value to a temp file in the SAME directory as the target,
fsyncs it, then renames into place. Cross-device, permissions, or
ENOSPC errors during rename leave the tmp file cleaned up.

tmp filename format: tmp-<basename(target)>-<pid>-<ts>-<hex4>.

#### Params

- `target`
- `value`
- `jsonSpace = 2`

#### Returns

_None._

#### Examples

_None._
