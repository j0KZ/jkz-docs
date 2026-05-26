---
deprecated_since: null
description: Module skills/wiki-generator/src/utils
editUrl: null
pagefind: true
sidebar:
  label: utils
  order: 18
title: skills/wiki-generator/src/utils
---

## Module summary

Module skills/wiki-generator/src/utils

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `MODEL_PRICING` | variable | no |
| `MONTHLY_COST_TARGET_USD` | variable | no |
| `RecentPRsFetcherError` | class | no |
| `__HARD_PROMPT_CAP` | variable | no |
| `__resetDepsForTests` | function | no |
| `__resetFetchForTests` | function | no |
| `__setClientFactoryForTests` | function | no |
| `__setDepsForTests` | function | no |
| `__setFetchForTests` | function | no |
| `__setSleepForTests` | function | no |
| `aliasModel` | function | no |
| `appendRunRecord` | function | no |
| `calculateCost` | function | no |
| `callLLM` | function | no |
| `classifyWithHaiku` | function | no |
| `createGitHubClient` | function | no |
| `dateKey` | function | no |
| `describeBuckets` | function | no |
| `deterministicDescribe` | function | no |
| `deterministicHumanize` | function | no |
| `fetchRecentMergedPRs` | function | no |
| `formatMonthlySummary` | function | no |
| `formatRunSummary` | function | no |
| `generateEntryWithSonnet` | function | no |
| `generateWorkflowGuide` | function | no |
| `getUsageSnapshot` | function | no |
| `humanizeWithHaiku` | function | no |
| `loadHistory` | function | no |
| `logError` | function | no |
| `logUpdate` | function | no |
| `narrateWhatsNew` | function | no |
| `projectMonth` | function | no |
| `recordUsage` | function | no |
| `reportCost` | function | no |
| `resetUsage` | function | no |
| `summarizeMonth` | function | no |
| `summarizeRun` | function | no |
| `yearMonthKey` | function | no |

## Detail

### `MODEL_PRICING`

```text
MODEL_PRICING
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `MONTHLY_COST_TARGET_USD`

```text
MONTHLY_COST_TARGET_USD
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `RecentPRsFetcherError`

```text
RecentPRsFetcherError
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `__HARD_PROMPT_CAP`

```text
__HARD_PROMPT_CAP
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `__resetDepsForTests`

```text
__resetDepsForTests(): void
```

#### Params

_None._

#### Returns

`void`

#### Examples

_None._

### `__resetFetchForTests`

```text
__resetFetchForTests(): void
```

Test hook: clear the override.

#### Params

_None._

#### Returns

`void`

#### Examples

_None._

### `__setClientFactoryForTests`

```text
__setClientFactoryForTests(factory): void
```

Override the Anthropic client factory. Tests only.

#### Params

- `factory`

#### Returns

`void`

#### Examples

_None._

### `__setDepsForTests`

```text
__setDepsForTests(deps): void
```

Override the Octokit constructor and execFile implementation. Tests only.

#### Params

- `deps`

#### Returns

`void`

#### Examples

_None._

### `__setFetchForTests`

```text
__setFetchForTests(fn): void
```

Test hook: override the fetch implementation.

#### Params

- `fn`

#### Returns

`void`

#### Examples

_None._

### `__setSleepForTests`

```text
__setSleepForTests(impl): void
```

Override the backoff sleeper. Tests only -- pass () => Promise.resolve() to
skip delays entirely.

#### Params

- `impl`

#### Returns

`void`

#### Examples

_None._

### `aliasModel`

```text
aliasModel(name): object
```

Map a friendly alias to the concrete model id and (when applicable) the
extended-thinking configuration. Throws on unknown alias.

#### Params

- `name`

#### Returns

`object`

#### Examples

_None._

### `appendRunRecord`

```text
async appendRunRecord(stateDir, record): unknown
```

Append one run's cost record to `<stateDir>/cost-history.json` and persist
atomically. The record carries the run id, the run's calendar date, the
total tokens, and the total USD.

#### Params

- `stateDir`
- `record`

#### Returns

`unknown`

#### Examples

_None._

### `calculateCost`

```text
calculateCost(usage, model): unknown
```

Calculate cost in USD for a single LLM call.

#### Params

- `usage`
- `model`

#### Returns

`unknown`

#### Examples

_None._

### `callLLM`

```text
async callLLM(opts): object
```

Call the Anthropic Messages API with retries and a normalized response.

#### Params

- `opts`

#### Returns

`object`

#### Examples

_None._

### `classifyWithHaiku`

```text
async classifyWithHaiku({ system, userContent }): unknown
```

Invoke Haiku in JSON mode and return a validated classification result.

#### Params

- `{ system, userContent }`

#### Returns

`unknown`

#### Examples

_None._

### `createGitHubClient`

```text
createGitHubClient(opts): unknown
```

Build a wrapper around Octokit. Token defaults to WIKI_BOT_TOKEN.

#### Params

- `opts = {}`

#### Returns

`unknown`

#### Examples

_None._

### `dateKey`

```text
dateKey(date): unknown
```

Format a `Date` as the `YYYY-MM-DD` calendar-day key.

#### Params

- `date`

#### Returns

`unknown`

#### Examples

_None._

### `describeBuckets`

```text
async describeBuckets(summaries, opts): unknown
```

Single batched Sonnet-medium call describing every architecture
bucket. Returns a Map<bucket, sentence> on success or null on any
failure (caller falls back via deterministicDescribe).

#### Params

- `summaries`
- `opts = {}`

#### Returns

`unknown`

#### Examples

_None._

### `deterministicDescribe`

```text
deterministicDescribe(bucketName): unknown
```

Deterministic per-bucket fallback. Returns a fixed sentence for the
five spec-locked buckets; everything else returns a generic label.

#### Params

- `bucketName`

#### Returns

`unknown`

#### Examples

_None._

### `deterministicHumanize`

```text
deterministicHumanize(raw): unknown
```

Deterministic fallback transform: split on `_`, `-`, and `/`,
capitalize each word, join with spaces.

Pure function, exported so the generator and tests can call it
directly without invoking the LLM.

#### Params

- `raw`

#### Returns

`unknown`

#### Examples

_None._

### `fetchRecentMergedPRs`

```text
async fetchRecentMergedPRs({ sinceIso, repoDir, runner }): unknown
```

Fetch merged PRs since `sinceIso` via `gh pr list --json ...`.

#### Params

- `{ sinceIso, repoDir, runner } = {}`

#### Returns

`unknown`

#### Examples

_None._

### `formatMonthlySummary`

```text
formatMonthlySummary(monthSummary, target): unknown
```

Build the day-1-of-month Telegram summary text for the previous month.

#### Params

- `monthSummary`
- `target = MONTHLY_COST_TARGET_USD`

#### Returns

`unknown`

#### Examples

_None._

### `formatRunSummary`

```text
formatRunSummary({ runId, runSummary, projection }): unknown
```

Build the per-run Telegram summary text: total tokens, total USD, the
per-generator (label) breakdown, and the month-to-date projection.

#### Params

- `{ runId, runSummary, projection }`

#### Returns

`unknown`

#### Examples

_None._

### `generateEntryWithSonnet`

```text
async generateEntryWithSonnet({ system, userContent }): unknown
```

Invoke Sonnet-medium in JSON mode and return the parsed entry object.

#### Params

- `{ system, userContent }`

#### Returns

`unknown`

#### Examples

_None._

### `generateWorkflowGuide`

```text
async generateWorkflowGuide({ topic, signals, system, userContent }): unknown
```

Call Sonnet 4.6 medium (extended-thinking enabled) to produce a
workflow guide. The caller supplies the assembled user message
(`userContent`) and a system prompt; this wrapper does not assemble
either string -- that responsibility lives in the generator so the
prompt template stays close to the topic-grouping logic.

Returns `{content, usage}` on success or `null` on any error.

#### Params

- `{ topic, signals, system, userContent }`

#### Returns

`unknown`

#### Examples

_None._

### `getUsageSnapshot`

```text
getUsageSnapshot(): unknown
```

Return a deep copy of the accumulator entries so callers cannot mutate the
live state.

#### Params

_None._

#### Returns

`unknown`

#### Examples

_None._

### `humanizeWithHaiku`

```text
async humanizeWithHaiku(labels, opts): unknown
```

Attempt to humanize a list of labels by calling Haiku. Returns a
`Map<originalLabel, humanizedLabel>` on success, or `null` on any
failure. Caller decides whether to fall back.

#### Params

- `labels`
- `opts = {}`

#### Returns

`unknown`

#### Examples

_None._

### `loadHistory`

```text
async loadHistory(stateDir): unknown
```

Load the persisted cost history from `<stateDir>/cost-history.json`.
Returns an empty array when the file does not yet exist or is corrupt --
cost history is observability data, never a hard dependency.

#### Params

- `stateDir`

#### Returns

`unknown`

#### Examples

_None._

### `logError`

```text
async logError(event): unknown
```

Log a pipeline error.

#### Params

- `event`

#### Returns

`unknown`

#### Examples

_None._

### `logUpdate`

```text
async logUpdate(event): unknown
```

Log a routine pipeline update.

#### Params

- `event`

#### Returns

`unknown`

#### Examples

_None._

### `narrateWhatsNew`

```text
async narrateWhatsNew(groupedPRs, opts): object
```

Generate the "What's New" narrative section via the LLM client.

#### Params

- `groupedPRs`
- `opts = {}`

#### Returns

`object`

#### Examples

_None._

### `projectMonth`

```text
projectMonth(history, now, target): object
```

Project the current month's total cost from the spend so far.

Month-to-date USD is divided by the number of elapsed days to get a daily
run rate, then multiplied by the number of days in the month. The result
is compared against `target` (default: the $50 WG-29 target).

#### Params

- `history`
- `now`
- `target = MONTHLY_COST_TARGET_USD`

#### Returns

`object`

#### Examples

_None._

### `recordUsage`

```text
recordUsage(entry): void
```

Record one LLM call's token usage into the per-run accumulator.

Called by `callLLM` after every successful Anthropic response. Invalid
input is ignored rather than thrown: cost tracking must never break a
pipeline run. A missing `label` defaults to `model` so the call is still
attributed.

#### Params

- `entry`

#### Returns

`void`

#### Examples

_None._

### `reportCost`

```text
async reportCost({ stateDir, runId, telegramLogger, now, snapshot }): object
```

Orchestrator post-run hook: persist the run's cost record, post the per-run
summary to Telegram (`wiki_updates`), and -- on day 1 of the month -- post
the previous month's aggregate.

Cost reporting is observability, never a hard dependency: any failure is
caught, logged via the Telegram logger, and swallowed so a reporting fault
cannot fail an otherwise-successful pipeline run.

#### Params

- `{ stateDir, runId, telegramLogger, now, snapshot }`

#### Returns

`object`

#### Examples

_None._

### `resetUsage`

```text
resetUsage(): void
```

Clear the per-run usage accumulator. Call at the start of every run.

#### Params

_None._

#### Returns

`void`

#### Examples

_None._

### `summarizeMonth`

```text
summarizeMonth(history, yearMonth): object
```

Aggregate every run record in the given calendar month.

#### Params

- `history`
- `yearMonth`

#### Returns

`object`

#### Examples

_None._

### `summarizeRun`

```text
summarizeRun(snapshot): object
```

Compute tokens + USD for a usage snapshot, broken down per accumulator
entry (one entry per model + call-site label).

An unknown model (not in MODEL_PRICING) cannot be priced; its `usd` is
`null` and it is counted in `unpricedEntries` rather than crashing the
report. `calculateCost` throws on an unknown model, so the call is guarded.

#### Params

- `snapshot`

#### Returns

`object`

#### Examples

_None._

### `yearMonthKey`

```text
yearMonthKey(date): unknown
```

Format a `Date` as the `YYYY-MM` calendar-month key.

#### Params

- `date`

#### Returns

`unknown`

#### Examples

_None._
