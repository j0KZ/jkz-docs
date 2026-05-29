---
title: /jkz:deslop — AI prose cleanup
description: Clean AI-typical writing patterns from text — filler phrases, hedging, verbose constructions, em-dash overuse, redundant adverbs, and repetitive bullets. Preserves meaning and technical content; removes the fluff.
---

`/jkz:deslop` strips the tells of AI-generated prose from your text files. Filler phrases, hedging words, verbose constructions, and over-used em dashes accumulate quietly in generated documentation; this command finds and removes them while preserving every bit of technical meaning.

## At a glance

| | |
|------|------|
| **Scope** | Modified `.md` files this session, or a file you pass |
| **Targets** | Filler, hedging, verbosity, em-dash overuse, redundant adverbs |
| **Guarantee** | Preserves all technical content and meaning |
| **Usage** | `/jkz:deslop [<file>]` |

## When to use

Run it on documentation, READMEs, or comment-heavy files after a generation pass, before publishing prose you want to read cleanly. With no argument it cleans the `.md` files you changed this session (via `git diff`); pass a file to target one specifically. If nothing modified turns up, it asks which file you mean.

## What it cleans

- **Filler phrases** — "It's worth mentioning", "It should be noted that", "As mentioned earlier", "In this context".
- **Hedging** — "Essentially", "Basically", "Fundamentally", "Significantly", "Effectively".
- **Verbose constructions** — "In order to" → "To", "Utilize" → "Use", "Prior to" → "Before", "Due to the fact that" → "Because".
- **Em-dash overuse** — more than two em dashes in a single paragraph; the extras become commas or periods.
- **Redundant adverbs** — "very unique", "completely eliminate", "absolutely essential".
- **Bullet repetition** — consecutive bullets that all open with the same word pattern.

## Key behavior

The command applies the fixes — removing filler (and fixing the sentence capitalization that follows), swapping verbose constructions for concise alternatives, thinning excess em dashes, dropping redundant adverbs, and varying bullet openings — then reports the changes per file with before/after examples. Technical content and meaning are left untouched.

This is the prose counterpart to [`/jkz:simplify`](/commands/simplify/), which does the same kind of cleanup for code rather than writing.
