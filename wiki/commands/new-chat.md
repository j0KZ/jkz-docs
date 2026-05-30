---
title: new-chat
description: Spin up a git worktree as a sibling directory on a fresh branch, so a second Claude Code window can work the same project without file or branch conflicts with your current session.
---

`/jkz:new-chat` creates an isolated workspace for a **second Claude Code window** on the same project — without file or branch collisions with your current session. It builds a git [worktree](/concepts/worktree-isolation/) as a sibling directory of the repo, on a fresh branch, and copies the config the new session needs to start immediately.

## Usage

```
/jkz:new-chat <slug> [--from <branch>]
```

- `<slug>` — a short descriptor matching `[a-z0-9][a-z0-9-]{0,30}` (e.g. `docs-audit`, `pr-921`, `spike-eval`). Required.
- `--from <branch>` — base the new worktree on `<branch>` instead of `main`. Optional; rarely needed — prefer branching from `main` unless you're deliberately stacking on in-flight work.

## What it does

The new worktree:

- lives as a **sibling directory** of the repo,
- sits on a **fresh branch** based on `origin/main` by default (or `--from <branch>`),
- has its own working tree and its own `HEAD`,
- inherits `.env` and `.claude/settings.local.json`, so the new session is ready to go.

On success you'll see the worktree path, the new branch name, and which config files were copied. Then **open a new Claude Code window** with that path as the working directory. Your current session stays put, on its own branch in the original repo.

## Cleanup

When the parallel session is done, from any clone:

```bash
git worktree remove <path>
git branch -D chat/<slug>-<ts>   # if the branch is no longer needed
```

:::note[new-chat vs. pipeline worktrees]
`/jkz:new-chat` is for *you* — a deliberate second window for parallel exploration. It is distinct from the per-issue worktrees the pipeline creates automatically when you run [`/jkz:quick`](/commands/quick/) or [`/jkz:pipeline`](/commands/pipeline/). See [worktree isolation](/concepts/worktree-isolation/) for how the two layouts differ.
:::

## Related

- [Worktree isolation](/concepts/worktree-isolation/) — the isolation model behind parallel chats.
- [Cross-chat awareness](/concepts/cross-chat/) — coordinating multiple sessions on one project.
