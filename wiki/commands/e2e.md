---
title: /jkz:e2e — End-to-end testing
description: Generate and run end-to-end browser tests against a running app. Opus explores the codebase to write scenarios, Sonnet executes them through agent-browser, and the run produces a report with screenshots. Manual and advisory — it never blocks the pipeline.
---

`/jkz:e2e` drives a real browser through your running application. Opus generates test scenarios by exploring the codebase for routes and user flows, then Sonnet executes each scenario step by step via the `agent-browser` CLI. The result is a report — passes, failures, and screenshots — that you read, not a gate the pipeline enforces.

## At a glance

| | |
|------|------|
| **Generates** | Scenarios via an Opus subagent |
| **Executes** | Steps via Sonnet driving `agent-browser` |
| **URL cascade** | `--url` → `JKZ_E2E_BASE_URL` → prompt |
| **Output** | Per-run report and screenshots under `state/e2e/` |
| **Results** | **Advisory** — never block the pipeline |
| **Usage** | `/jkz:e2e [--url <base-url>]` |

## When to use

Run it against a locally running build (or any reachable URL) when you want to exercise critical user flows — navigation, forms, authentication — end to end. It is a manual command: invoke it when you want the coverage, not as part of every pipeline run.

## Prerequisites

`agent-browser` must be installed (`npm install -g agent-browser`); the command stops early if it is missing. The target app must be reachable at the resolved URL — `/jkz:e2e` checks before generating any scenarios and stops if the app is down.

## Key behavior

The base URL is resolved from the `--url` argument, then the `JKZ_E2E_BASE_URL` environment variable, and finally by asking you. Each run gets its own timestamped directory under `state/e2e/` holding the generated `scenarios.json`, per-scenario results, screenshots, and an aggregated `report.md`.

- **Scenario generation** — Opus inspects `package.json`, router configs, page components, and API routes, then emits up to `JKZ_E2E_MAX_TESTS` (default 10) self-contained scenarios as JSON. Each scenario opens its own page and closes the browser at the end.
- **Execution** — Sonnet runs each step through `agent-browser` (`open`, `click`, `fill`, `assert_visible`, and so on), verifying the result before moving on. Screenshots follow `JKZ_E2E_SCREENSHOT_MODE` (default `on-failure`; also `always` or `never`).
- **Report** — results are aggregated into a summary table and failure details.

Because the results are advisory, `/jkz:e2e` complements rather than replaces the gated review in the [QA phase](/commands/qa/) — it tells you whether the app *behaves* correctly in a browser, which static review cannot.
