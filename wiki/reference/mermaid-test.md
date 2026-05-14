---
title: Mermaid rendering test
description: Verifies that astro-mermaid renders flowcharts and sequence diagrams with light/dark theme support.
---

This page exercises the Mermaid integration. Both diagrams below must render as SVG in both light and dark Starlight themes.

## Flowchart

```mermaid
flowchart LR
    A[Issue created] --> B{Has plan?}
    B -- No --> C[/jkz:plan/]
    B -- Yes --> D[/jkz:build/]
    C --> D
    D --> E[/jkz:review/]
    E --> F[/jkz:qa/]
    F --> G[Human merge]
```

## Sequence

```mermaid
sequenceDiagram
    participant U as Human
    participant O as Orchestrator
    participant A as Architect
    participant V as Auditor
    U->>O: /jkz:plan NN
    O->>A: design plan
    A-->>O: plan draft
    O->>V: review plan
    V-->>O: verdict
    O-->>U: checkpoint
```

Toggle the site theme to confirm both diagrams re-render with appropriate colors.
