---
title: 'ADR-001: Use Astro Starlight for documentation site'
description: Static site generator chosen for the jkz public docs site.
---

# ADR-001: Use Astro Starlight for documentation site

## Status

Accepted -- 2026-05-09

## Context

The wiki-generator epic (#1276) needs a public documentation site to render generated content. Requirements: Markdown-first authoring, dark mode default, mobile responsive, fast static builds, low maintenance overhead, integrates with GitHub Actions for build triggers, supports search and sidebar autogeneration in later phases (WG-25, WG-26).

Candidates considered:

- **Astro Starlight** -- Astro framework with documentation theme; built-in dark mode, search hooks, mobile responsive, sidebar autogen, MDX support.
- **Docusaurus** -- React-based, larger bundle, slower builds, more JS overhead at runtime.
- **VitePress** -- Vue-based; smaller community for documentation tooling than Astro.
- **MkDocs Material** -- Python-based; would split toolchain (Node.js everywhere else).

## Decision

Use Astro Starlight. The toolchain matches the rest of jkz (Node.js), build times are fast (sub-2-minute target met), the theme provides dark mode and mobile layout out of the box, and sidebar autogeneration plus future Pagefind (WG-25) and Giscus (WG-26) integrations are documented patterns.

Content lives in `wiki/` at the repo root (not the Starlight default `src/content/docs/`) so wiki-generator output paths remain consistent with the generator-side contract. The collection loader is configured via `glob({ pattern: '**/*.md', base: './wiki' })` from `astro/loaders` because the public `docsLoader()` API does not accept a `base` option (verified against Starlight current docs).

## Consequences

Positive:

- Single Node.js toolchain.
- Dark mode and mobile responsive without extra CSS.
- Sub-2-minute builds for AC #4.
- Search (Pagefind) and comments (Giscus) have first-party Starlight patterns.

Negative:

- Astro version churn requires periodic dependency updates.
- Custom loader path means we maintain awareness of any Starlight default-loader migrations.
