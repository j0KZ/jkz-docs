---
title: vault
description: A persistent store for researched ideas. List, show, search, and manage vault items across the project and global scopes, with FTS5 full-text search and status tracking.
---

`/jkz:vault` is the backlog for ideas you are not ready to act on yet. When research surfaces something worth keeping — a feature worth building later, an approach worth revisiting, a finding that does not belong in the current task — the vault holds it so it is not lost between sessions. It is a deliberate "leave it for later" store, separate from issues and separate from memory.

## At a glance

| | |
|------|------|
| **Purpose** | Persistent store for researched ideas, across sessions |
| **Scopes** | Project (auto-detected) and global |
| **Search** | FTS5 full-text search |
| **State** | Items carry a status you can change; triggers can surface them |
| **Backed by** | `scripts/vault.js` |
| **Usage** | `/jkz:vault [show \| search \| global \| status \| triggers] ...` |

## When to use

Use `/jkz:vault` whenever an idea is worth keeping but not worth doing now — "save this for later", "what do we have pending", "mark this as ready". It is the natural companion to [`/jkz:research`](/commands/research/): research produces ideas, the vault retains them, and a status change promotes one when its time comes.

## Key behavior

The command dispatches to a small set of subcommands, each a thin wrapper over `scripts/vault.js`:

- **(no argument)** — list every item, project and global, as a table.
- **`show <slug>`** — display the full contents of a single vault item.
- **`search <query>`** — FTS5 full-text search, scoped to the current project.
- **`global`** — list only the global-scope items.
- **`status <slug> <new-status>`** — change an item's status (for example, mark a saved idea as ready to work).
- **`triggers`** — list all triggers, the conditions that resurface vault items at the right moment.

Project scope is detected automatically, so items stay associated with the project they came from while global items remain available everywhere. When there is nothing to show, the command says so plainly rather than returning an empty table.
