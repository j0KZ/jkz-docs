---
title: Librarian
description: The utility role that indexes and retrieves project knowledge with source citations — it makes what we already decided findable, and never invents.
---

The **Librarian** is jkz's memory desk. It does not create knowledge — it makes existing knowledge findable. When an agent or a human asks "what did we decide about X?" or "where is the pattern for Y?", the Librarian answers with a citation back to the source, never a guess.

| | |
|---|---|
| **Model** | Claude Haiku 4.5 |
| **Class** | utility |
| **Phase** | Any — a cross-phase support role |
| **Invocation** | `node scripts/librarian.js <subcommand>`, or the MCP tool `librarian_query` |

## Mission

Index, organize, and retrieve. The Librarian is read-only by design: it never modifies a source file, opens a PR, or posts a comment. Its single job is recall — turning the project's accumulated history into a searchable answer with a source attached.

## What it reads

The knowledge base is built from four sources:

1. **Memory files** — `MEMORY.md`, project instructions, `CLAUDE.md`.
2. **Deliberations** — past agent responses, verdicts, ADRs, and accumulated patterns.
3. **Pipeline state** — phase transitions, issue types, iteration counts.
4. **Cross-chat registry** — knowledge from other sessions, when available.

## How retrieval works

Two phases. First, an FTS5 BM25 search runs locally and fast — it returns the top-ranked matches in well under a second. Then Haiku synthesizes those matches into a concise answer with the sources cited inline. If Haiku is unavailable, the raw FTS5 results are returned directly rather than nothing at all.

Indexing is incremental by default: the `index-latest` subcommand only processes files changed since the last run, which is what the session hooks call.

## The rules it lives by

- **Read-only.** It never changes source files, creates PRs, or posts comments.
- **Always cite.** Every answer references the file or deliberation it came from.
- **No fabrication.** If the knowledge base has no answer, it says so. It never invents one.

That last rule is the point of the role. A search engine that occasionally makes things up is worse than no search engine — so the Librarian would rather return "not found" than a plausible fiction. It is the same evidence discipline the rest of the pipeline runs on, applied to recall.
