---
title: calibrate
description: Promote significant memory-store patterns into validator agents' calibration sections through a three-model tribunal with minority veto, so learned signals sharpen future reviews.
---

`/jkz:calibrate` takes the patterns the pipeline has been accumulating in its memory store and folds the significant ones into the calibration sections of the validator agents — the place where a recurring, validated signal becomes a standing instruction the agent carries into every future review. It is how the system turns "we have seen this kind of issue before" into "watch for this kind of issue."

The promotion is not automatic. Each candidate pattern is judged by a three-model tribunal, and a minority veto can block a pattern even when the majority would admit it — the same adversarial caution the pipeline applies everywhere, pointed inward at its own learning loop.

## At a glance

| | |
|------|------|
| **Purpose** | Promote memory-store patterns into validator calibration sections |
| **Gate** | Three-model tribunal with minority veto |
| **Targets** | Validator agents (e.g. Judge, Inspector, Lens, Curator) |
| **Modes** | `--dry-run` (preview diff) · `--role <name>` (single agent) |
| **Usage** | `/jkz:calibrate` · `/jkz:calibrate --dry-run` · `/jkz:calibrate --role judge` |

## When to use

Run `/jkz:calibrate` after the pipeline has built up enough deliberation history for patterns to be meaningful — typically alongside or after reviewing [`/jkz:insights`](/commands/insights/). It is the deliberate step that converts observed, repeated signals into agent behavior. Start with `--dry-run` to see exactly which patterns would be promoted and how each agent file would change before writing anything.

## Key behavior

By default the command calibrates all validator agents; `--role <name>` scopes it to one. It evaluates candidate patterns per agent, runs each through the tribunal, and reports how many candidates were considered, which were approved versus rejected, and any tribunal failures or vetoes. With `--dry-run` it emits the unified diff without touching agent files; without it, it confirms which agent files were updated. The result is a tightening loop: validated patterns become calibration instructions, which sharpen the next round of reviews.
