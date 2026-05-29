---
title: Skills
description: Catalog of the 39 skills in .claude/skills/ — one-line purpose and trigger for each, grouped by framework, QA, model router, and utility.
---

A **skill** is a `SKILL.md` file under `.claude/skills/`. Each one is a focused capability the system can load on demand: some are injected automatically into agent prompts, others are invoked by a slash command, and a handful trigger from natural-language phrases.

This page catalogs all **39 skills**. Two columns matter for every entry:

- **Purpose** — what the skill does, in one line.
- **Trigger** — how it activates. For internal skills this is *where it is injected*; for invocable skills it is the phrase or command that loads it.

> **Internal vs. invocable.** Framework and most QA/model skills are *internal*: the pipeline injects them automatically and you never call them by name. Skills marked **(user-invocable)** can be triggered directly by a phrase or a `/jkz:*` command.

---

## Framework skills

Internal skills that define the system's base behavior. Injected automatically into agent prompts — never invoked directly.

| Skill | Purpose | Injected in |
|-------|---------|-------------|
| `framework-stability-rules` | Stability rules: no repeating rejected approaches, evidence required, explicit deltas per iteration, prompt-injection defense, no fabrication. | All agent prompts |
| `framework-signal-format` | Shared signal formats (Context Protocol, Issue Proposal, Iteration Signal / `verdict-json`) for inter-agent communication. | All agent prompts |
| `framework-evidence-hierarchy` | Evidence hierarchy for evaluating arguments: Execution > File Citations > Reasoning. | Adversarial roles (Auditor, Judge, Sentinel) |
| `framework-agent-grounding` | Grounding and failure-discipline: no invented references, trimmed process narration, fail-fast reporting. | Architect, Builder, Doctor |
| `framework-coderabbit-context` | CodeRabbit integration context for enrichment review (non-gating pre-scan). | Judge, Inspector (review phase) |
| `framework-issue-type-detection` | Issue type classification (bug / feature / refactor / chore) by keyword matching, with an `AskUserQuestion` fallback. | `/jkz:issue`, `/jkz:start` |
| `plan-stride-analysis` | STRIDE threat-modeling template (Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege). | Architect, Sentinel — conditional on security labels or ≥2 security keywords |

---

## QA skills

Quality and security checklists, injected during the QA phase based on the PR's content (frontend, backend, compliance tier).

| Skill | Purpose | Trigger |
|-------|---------|---------|
| `qa-web-a11y` | WCAG 2.1 accessibility checklist (POUR, contrast, keyboard, ARIA, screen readers). | Injected: Lens (QA, web-renderable diff) |
| `qa-web-performance` | Core Web Vitals and performance budgets (JS/CSS/total size). | Injected: Lens (QA, web diff) |
| `qa-web-best-practices` | HTTP security headers, CSP, input sanitization, secure cookies. | Injected: Sentinel (QA, web diff) |
| `qa-compliance-basic` | Tier 1 compliance: dependency pinning, committed lockfile, license, basic security. | Injected: Lens / Sentinel (compliance tier ≥ 1) |
| `qa-compliance-regulated` | Tier 2 compliance: audit trail, PII handling, data residency, SOC2 / HIPAA controls, SBOM. | Injected: Lens / Sentinel (compliance tier ≥ 2) |
| `qa-security-scan` | Red/Blue team security assessment in a single session. | Injected: Sentinel (QA); also on-demand pre-deploy |
| `qa-web-quality-audit` | Full Lighthouse web quality audit (Performance, Accessibility, SEO, Best Practices). | **(user-invocable)** "audit my site", "web quality", "check Lighthouse" |

---

## Model router skills

Skills that route a prompt to a specific model or model class.

| Skill | Purpose | Trigger |
|-------|---------|---------|
| `model-codex-ask` | Route a prompt to the configured adversarial backend for adversarial analysis. | "ask codex", "codex review", "adversarial check", "audit with codex" |
| `model-gemini-ask` | Route a prompt to Gemini for validation analysis. | "ask gemini", "validate with gemini", "gemini check" |
| `model-debate-plan` | Structured adversarial debate between 2–3 models, each defending a position. | Used internally by `/jkz:debate` |
| `model-round-robin-ask` | Serial multi-model consultation where each model sees prior responses. | Used internally for the Architect → Auditor → Curator flow |
| `model-context7-lookup` | Look up external library documentation via Context7 MCP. | **(user-invocable)** library / framework / SDK API questions, version migration, CLI usage |

---

## Utility skills

Everything else: authoring, memory, docs, research, and the idea vault. Most of these are user-invocable.

### Skill & agent authoring

| Skill | Purpose | Trigger |
|-------|---------|---------|
| `create-skill` | Author a new skill or slash command. | "create a skill", "make a command" |
| `create-agent` | Author a new subagent (system prompt + frontmatter). | "create an agent", "build a subagent", "design an autonomous agent" |
| `improve-skill` | Add features or improve an existing skill's effectiveness. | "improve a skill", "make this skill better", "what's missing from this skill" |
| `repair-skill` | Diagnose and fix structural issues in a skill. | "fix my skill", "audit this skill" |
| `skill-security-audit` | Scan skill files for security patterns (code/prompt injection, data exfil, jkz violations, secrets). | "audit skill", "skill security", "scan skills" (`/jkz:skill-audit`) |
| `dev-self-review` | Pre-PR self-review for jkz integration consistency. | "self review", "check my changes", "review before PR" |

### Memory

| Skill | Purpose | Trigger |
|-------|---------|---------|
| `memory-review` | Review memory files for staleness, overlaps, and promotion candidates. | "review memory", "stale memories", "memory cleanup" |
| `memory-promote` | Score a memory file for promotion to a rule or CLAUDE.md section. | "promote memory", "memory to rule", "should this be a rule" |
| `memory-status` | Memory health dashboard (status, counts by type, recent changes). | "memory status", "memory health", "memory dashboard" |
| `extract-learnings` | Persist learnings to memory or maintain existing memories. | "extract learnings", "remember this pattern", "consolidate memories", "dream" |

### Docs & content

| Skill | Purpose | Trigger |
|-------|---------|---------|
| `make-changelog` | Generate or update `CHANGELOG.md` (Keep a Changelog 1.1.0) via parallel Haiku subagents. | "update the changelog", "regenerate changelog" |
| `update-readme` | Propose `README.md` updates via parallel Explore subagents, behind a human approval gate. | "update the README", "refresh README.md" |
| `update-claudemd` | Refresh a stale CLAUDE.md and reconcile diverged `rules/` files. | CLAUDE.md grown stale, `rules/` exceed ~300 lines, content needs promotion/demotion |
| `wiki-generator` | Generate or refresh the public jkz wiki at jkz-docs from the private repo. | "wiki-generator", "regenerate wiki", "publish wiki" (internal pipeline) |
| `convert-to-markdown` | Convert a webpage URL to clean markdown (EzyCopy CLI). | "convert this URL to markdown", "scrape page as markdown", "ezycopy" |
| `repo-to-markdown` | Convert a GitHub repo or local directory to a single structured markdown doc (repo2md). | "read this repo", "convert repo to markdown", "repo2md", a raw GitHub URL |

### Research & recall

| Skill | Purpose | Trigger |
|-------|---------|---------|
| `run-research` | Research a topic or surface what's trending and being discussed recently. | "research a topic", "last30", "what's happening with X", "latest on X" |
| `recall-conversations` | Recall, search, or continue past conversations. | "what did we discuss", "continue where we left off", "remember when" |
| `get-token-insights` | Analyze Claude token usage, cache hit rates, and cost optimization. | token usage, spend, cache hit rate, or cost questions |

### Idea vault

| Skill | Purpose | Trigger |
|-------|---------|---------|
| `vault` | Manage the persistent idea store: save, list, search, and mark ideas done. | "save to vault", "what's in the vault", "ideas backlog", "save this for later" (`/jkz:vault`) |

---

## References

- [CLI / commands](/reference/cli/) — the `/jkz:*` slash commands that drive these skills.
- [Architecture](/reference/architecture/) — how skills fit into the three-phase pipeline.
