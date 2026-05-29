---
deprecated_since: null
description: "**scripts** -- Operational and pipeline scripts. **core** -- Core wiki-generator infrastructure."
pagefind: true
sidebar:
  label: Architecture
  order: 0
title: Architecture
---

# Architecture

**scripts** -- Operational and pipeline scripts. **core** -- Core wiki-generator infrastructure.

## scripts

```mermaid
graph LR
  n0["scripts"]
```

Operational and pipeline scripts.

## core

```mermaid
graph LR
  n0["src"]
  n1["src/classifiers"]
  n2["src/config"]
  n3["src/diff"]
  n4["src/diff/lib"]
  n5["src/extractors"]
  n6["src/generators"]
  n7["src/guards"]
  n8["src/publisher"]
  n9["src/sanitizers"]
  n10["src/state"]
  n11["src/utils"]
  n0 --> n2
  n0 --> n3
  n0 --> n5
  n0 --> n6
  n0 --> n8
  n0 --> n9
  n0 --> n10
  n0 --> n11
  n1 --> n11
  n3 --> n4
  n6 --> n1
  n6 --> n3
  n6 --> n5
  n6 --> n9
  n6 --> n11
  n10 --> n3
  n10 --> n11
  n11 --> n1
  n11 --> n4
```

Core wiki-generator infrastructure.
