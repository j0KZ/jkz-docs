---
title: jkz docs
description: Human-in-the-loop multi-agent engineering — three phases, twelve roles, you as the final arbiter.
template: splash
hero:
  title: jkz
  tagline: Human-in-the-loop multi-agent engineering. You stay the final arbiter.
  actions:
    - text: Run your first pipeline
      link: /get-started/quickstart/
      icon: right-arrow
      variant: primary
    - text: Why jkz?
      link: /get-started/why-jkz/
      icon: open-book
      variant: minimal
---

Most agent tools optimize for autonomy. jkz optimizes for control. Code work runs
through three phases — **plan**, **build**, **QA** — across twelve specialized roles.
In each, Opus drafts, an adversarial backend tries to break the work, and a validator
confirms. Git is the only source of truth; agents never talk to each other directly.
Nothing reaches `main` without you: the system iterates up to three times on its own,
but every merge is a human checkpoint.

:::tip[Get started]
New here? The path from zero to your first merged pull request.

- [Quickstart](/get-started/quickstart/) — your first pipeline, end to end.
- [Why jkz?](/get-started/why-jkz/) — the problem it solves and the constraints behind it.
- [How jkz works](/get-started/how-jkz-works/) — phases, roles, and the deliberation loop.
:::

:::note[Build]
The day-to-day, once you know the shape of a pipeline.

- [Run a pipeline](/build/coming-soon/) — drive a feature from issue to approval.
- [Fix a bug](/build/coming-soon/) — the lighter path for small, scoped changes.
- [Ad-hoc work](/build/coming-soon/) — quick edits outside the full pipeline.
:::

:::note[Reference]
The mechanics, for LLMs and engineers who want the full picture.

- [Architecture](/reference/architecture/) — phase boundaries, roles, model routing.
- [API reference](/api-reference/) — auto-generated module exports and signatures.
- [Design decisions](/reference/design-decisions/) — the ADRs and trade-offs.
:::
