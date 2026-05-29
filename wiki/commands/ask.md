---
title: /jkz:ask
description: Ask an ad-hoc question to an external model (Codex or Gemini) without any pipeline context. Each call is ephemeral — no session carries over between invocations.
---

`/jkz:ask [--model codex|gemini] <question>` routes a one-off question to an external model and hands you back its answer, with no pipeline, PR, phase, or issue attached. It is the quickest way to get a second opinion from a model that is *not* Opus — useful precisely because it sees only what you give it, free of the framing the pipeline would otherwise impose.

Every invocation is independent. Session files are deleted before each call, so there is no carryover from one question to the next — the consultant answers fresh each time, exactly the behavior you want for a throwaway query.

## At a glance

| | |
|------|------|
| **Models** | `codex` (default) or `gemini` — `opus` is not supported |
| **Context** | None — ad-hoc, no PR/issue/phase |
| **Memory** | Ephemeral — session deleted before each call |
| **Backends** | [`consultant-codex`](#the-consultants) and [`consultant-gemini`](#the-consultants) |
| **Usage** | `/jkz:ask <question>` · `/jkz:ask --model gemini <question>` |

## When to use

Reach for `/jkz:ask` when you want a focused answer from an outside model without spinning up the deliberation machinery: a sanity check on an approach, a quick read of an error, a "does this look right?" on a snippet. If you provide code, the consultant analyzes it concretely and cites line numbers and function names; if you don't, it answers from its own knowledge and tells you when it is reasoning without grounded evidence.

For Opus, just ask Claude directly in the conversation — `/jkz:ask` deliberately targets external models only. For a genuinely contested decision that warrants more than one external voice arguing, use [`/jkz:debate`](/commands/debate/) instead.

## Key behavior

You pick the model with `--model` (default `codex`). The remaining text is your question; an empty question is an error. The command writes your prompt to a temp file, deletes any lingering session state to guarantee a clean start, and invokes the backend in the background, polling for the result for up to 30 minutes before timing out.

Because no `--pr` or `--issue` is passed, the consultant writes a deliberation file but no sentinel — nothing is posted to GitHub. The answer is displayed back to you with the model attributed (`[consultant-codex]` or `[consultant-gemini]`).

## The consultants

`/jkz:ask` and [`/jkz:debate`](/commands/debate/) are fronted by two ad-hoc consultant roles. Both are read-only, hold no memory, and never post to a PR or issue — they exist purely to answer the question in front of them, applying the same evidence hierarchy the pipeline's adversarial roles use (execution > file citations > reasoning).

- **`consultant-codex`** — the adversarial backend, selected by `--model codex` (the default). It routes through `resolve-wrapper.sh` to whatever OpenAI-compatible endpoint is configured in `JKZ_CONSULTANT_CODEX_ENDPOINT`; there is no silent fallback, so the endpoint must be set.
- **`consultant-gemini`** — the validator backend (Gemini 3.5 Flash), selected by `--model gemini`. It resolves through the same wrapper and falls back to the local Gemini CLI when no endpoint is configured.

The backend is resolved per call from the `--model` flag → role (`codex` → `consultant-codex`, `gemini` → `consultant-gemini`) → endpoint configuration. To route either consultant through a custom API endpoint, set `JKZ_CONSULTANT_CODEX_ENDPOINT` or `JKZ_CONSULTANT_GEMINI_ENDPOINT` in `.env`.
