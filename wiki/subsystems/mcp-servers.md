---
title: MCP servers
description: The Model Context Protocol servers jkz exposes and bundles — the jkz-pipeline server that lets any MCP client query and drive the pipeline, plus the finance data servers wired into the project.
---

jkz speaks the [Model Context Protocol](https://modelcontextprotocol.io) on two fronts. It **exposes** its own server — `jkz-pipeline` — so any MCP-compatible client can read pipeline state and drive transitions without going through a slash command. And it **bundles** a handful of third-party servers, most of them finance data sources, so the same client can pull market and economic data alongside pipeline work.

Every server is declared in `.mcp.json` at the project root. That file is the single source of truth for which servers exist and how they launch; nothing here needs configuring in `.claude/settings.json`.

## The jkz-pipeline server

This is the one server jkz ships itself. It turns the pipeline into a programmable surface: instead of running `/jkz:status` in a chat, a client can call `get_status` and get the same answer as structured data. It is the API behind the CLI.

It exposes **16 tools**, grouped by what they let a caller do:

| Capability | Tools |
|------------|-------|
| **Read** — inspect state, never change it | `get_status`, `get_metrics`, `health_report`, `get_deliberation_state`, `query_env`, `list_sessions`, `list_automations`, `list_vault`, `librarian_query`, `query_governed_patterns` |
| **Write** — change pipeline state | `init_project`, `transition_phase`, `set_agent`, `trigger_automation` |
| **Admin** — session snapshots | `save_session`, `restore_session` |

The grouping is not cosmetic — it maps directly onto the access scopes described below.

### Two transports

The server runs in one of two modes, chosen at launch:

| Transport | When | Audience | Auth |
|-----------|------|----------|------|
| **stdio** | Default | A local client on the same machine (the trusted case) | None |
| **HTTP** | Opt-in | A networked client reaching the server over a port | Required |

Over **stdio** the server trusts its caller — it is a local process the operator already controls — so every tool is available and no credentials are involved. This is the normal mode for a developer's own machine.

Over **HTTP** the server is reachable across a network, so it gates access with a token and a scope. HTTP mode is what makes remote and monitored deployments possible.

### Scopes

When the server runs over HTTP, every tool requires one of three scopes, and the scopes are hierarchical — a higher scope satisfies a lower requirement:

- **`read`** — call any read tool.
- **`write`** — call read and write tools (everything except session snapshots).
- **`admin`** — call everything, including the session snapshot tools.

So an `admin` token can do what a `write` token can, which can do what a `read` token can. A token is granted exactly one scope, and a call that asks for more than the token carries is rejected with an `insufficient_scope` error rather than silently downgraded.

Over stdio there is no scope check at all — the local caller is already trusted, so the scope model simply does not apply.

### Authenticating over HTTP

An HTTP client presents its token as a standard `Authorization: Bearer <token>` header. The server matches the token against its store and reads the scope the token was granted; the call proceeds only if that scope covers the tool.

Two endpoints are deliberately left **outside** the auth gate so they can be reached without credentials:

- **`/health`** — a liveness check.
- **`/metrics`** — Prometheus-format metrics, so a scraper can collect them without being handed a pipeline token.

The `/mcp` endpoint — where the actual tool calls go — always sits behind the auth gate.

## Finance servers

These are third-party servers jkz wires in for market and economic data. They are not part of the pipeline; they ride alongside it so the same client can reach financial data during research and analysis work.

| Server | What it provides |
|--------|------------------|
| **polygon** | Market data across equities, options, ETFs, indices, FX, and crypto — both real-time and historical (quotes, trades, aggregates). |
| **yahoo-finance** | Historical price data for stocks. |
| **fred** | Federal Reserve Economic Data — macroeconomic time series (rates, inflation, employment, and the rest of the FRED catalogue). |
| **octagon** | Financial research agents and prediction-market data. |

`fred` and `octagon` each need an API key (`FRED_API_KEY`, `OCTAGON_API_KEY`) supplied through the environment; `polygon` and `yahoo-finance` run without one.

## Other bundled servers

Three more servers round out the set. They are not finance sources and not the pipeline, but they share the same `.mcp.json` declaration:

- **context-mode** — context indexing and search.
- **codebase-memory-mcp** — the codebase knowledge graph used for code exploration and tracing.
- **playwright** — browser automation for end-to-end and web checks.

## Related

- [How jkz works](/get-started/how-jkz-works/) — the pipeline these tools query and drive.
- [The pipeline](/concepts/pipeline/) — the phases and transitions exposed by `transition_phase` and `get_status`.
- [Architecture](/reference/architecture/) — where the MCP server code sits in the wider project.
