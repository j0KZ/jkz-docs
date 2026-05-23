---
deprecated_since: null
description: Module skills/wiki-generator/src/utils
editUrl: "https://github.com/j0KZ/jkz_Multi-Agent_System/edit/main/skills/wiki-generator/src/utils/architecture_describer.js"
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

```
MODEL_PRICING
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `MONTHLY_COST_TARGET_USD`

```
MONTHLY_COST_TARGET_USD
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `RecentPRsFetcherError`

```
RecentPRsFetcherError
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `__HARD_PROMPT_CAP`

```
__HARD_PROMPT_CAP
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `__resetDepsForTests`

```
__resetDepsForTests()
```

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `__resetFetchForTests`

```
__resetFetchForTests()
```

Test hook: clear the override.

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `__setClientFactoryForTests`

```
__setClientFactoryForTests(factory)
```

Override the Anthropic client factory. Tests only.

#### Params

- `factory`

#### Returns

_None._

#### Examples

_None._

### `__setDepsForTests`

```
__setDepsForTests(deps)
```

Override the Octokit constructor and execFile implementation. Tests only.

#### Params

- `deps`

#### Returns

_None._

#### Examples

_None._

### `__setFetchForTests`

```
__setFetchForTests(fn)
```

Test hook: override the fetch implementation.

#### Params

- `fn`

#### Returns

_None._

#### Examples

_None._

### `__setSleepForTests`

```
__setSleepForTests(impl)
```

Override the backoff sleeper. Tests only -- pass () => Promise.resolve() to
skip delays entirely.

#### Params

- `impl`

#### Returns

_None._

#### Examples

_None._

### `aliasModel`

```
aliasModel(name)
```

Map a friendly alias to the concrete model id and (when applicable) the
extended-thinking configuration. Throws on unknown alias.

#### Params

- `name`

#### Returns

_None._

#### Examples

_None._

### `appendRunRecord`

```
async appendRunRecord(stateDir, record)
```

Append one run's cost record to `<stateDir>/cost-history.json` and persist
atomically. The record carries the run id, the run's calendar date, the
total tokens, and the total USD.

#### Params

- `stateDir`
- `record`

#### Returns

_None._

#### Examples

_None._

### `calculateCost`

```
calculateCost(usage, model)
```

Calculate cost in USD for a single LLM call.

#### Params

- `usage`
- `model`

#### Returns

_None._

#### Examples

_None._

### `callLLM`

```
async callLLM(opts)
```

Call the Anthropic Messages API with retries and a normalized response.

#### Params

- `opts`

#### Returns

_None._

#### Examples

_None._

### `classifyWithHaiku`

```
async classifyWithHaiku({ system, userContent })
```

Invoke Haiku in JSON mode and return a validated classification result.

#### Params

- `{ system, userContent }`

#### Returns

_None._

#### Examples

_None._

### `createGitHubClient`

```
createGitHubClient(opts)
```

Build a wrapper around Octokit. Token defaults to WIKI_BOT_TOKEN.

#### Params

- `opts = {}`

#### Returns

_None._

#### Examples

_None._

### `dateKey`

```
dateKey(date)
```

Format a `Date` as the `YYYY-MM-DD` calendar-day key.

#### Params

- `date`

#### Returns

_None._

#### Examples

_None._

### `describeBuckets`

```
async describeBuckets(summaries, opts)
```

Single batched Sonnet-medium call describing every architecture
bucket. Returns a Map<bucket, sentence> on success or null on any
failure (caller falls back via deterministicDescribe).

#### Params

- `summaries`
- `opts = {}`

#### Returns

_None._

#### Examples

_None._

### `deterministicDescribe`

```
deterministicDescribe(bucketName)
```

Deterministic per-bucket fallback. Returns a fixed sentence for the
five spec-locked buckets; everything else returns a generic label.

#### Params

- `bucketName`

#### Returns

_None._

#### Examples

_None._

### `deterministicHumanize`

```
deterministicHumanize(raw)
```

Deterministic fallback transform: split on `_`, `-`, and `/`,
capitalize each word, join with spaces.

Pure function, exported so the generator and tests can call it
directly without invoking the LLM.

#### Params

- `raw`

#### Returns

_None._

#### Examples

_None._

### `fetchRecentMergedPRs`

```
async fetchRecentMergedPRs({ sinceIso, repoDir, runner })
```

Fetch merged PRs since `sinceIso` via `gh pr list --json ...`.

#### Params

- `{ sinceIso, repoDir, runner } = {}`

#### Returns

_None._

#### Examples

_None._

### `formatMonthlySummary`

```
formatMonthlySummary(monthSummary, target)
```

Build the day-1-of-month Telegram summary text for the previous month.

#### Params

- `monthSummary`
- `target = MONTHLY_COST_TARGET_USD`

#### Returns

_None._

#### Examples

_None._

### `formatRunSummary`

```
formatRunSummary({ runId, runSummary, projection })
```

Build the per-run Telegram summary text: total tokens, total USD, the
per-generator (label) breakdown, and the month-to-date projection.

#### Params

- `{ runId, runSummary, projection }`

#### Returns

_None._

#### Examples

_None._

### `generateEntryWithSonnet`

```
async generateEntryWithSonnet({ system, userContent })
```

Invoke Sonnet-medium in JSON mode and return the parsed entry object.

#### Params

- `{ system, userContent }`

#### Returns

_None._

#### Examples

_None._

### `generateWorkflowGuide`

```
async generateWorkflowGuide({ topic, signals, system, userContent })
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

_None._

#### Examples

_None._

### `getUsageSnapshot`

```
getUsageSnapshot()
```

Return a deep copy of the accumulator entries so callers cannot mutate the
live state.

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `humanizeWithHaiku`

```
async humanizeWithHaiku(labels, opts)
```

Attempt to humanize a list of labels by calling Haiku. Returns a
`Map<originalLabel, humanizedLabel>` on success, or `null` on any
failure. Caller decides whether to fall back.

#### Params

- `labels`
- `opts = {}`

#### Returns

_None._

#### Examples

_None._

### `loadHistory`

```
async loadHistory(stateDir)
```

Load the persisted cost history from `<stateDir>/cost-history.json`.
Returns an empty array when the file does not yet exist or is corrupt --
cost history is observability data, never a hard dependency.

#### Params

- `stateDir`

#### Returns

_None._

#### Examples

_None._

### `logError`

```
async logError(event)
```

Log a pipeline error.

#### Params

- `event`

#### Returns

_None._

#### Examples

_None._

### `logUpdate`

```
async logUpdate(event)
```

Log a routine pipeline update.

#### Params

- `event`

#### Returns

_None._

#### Examples

_None._

### `narrateWhatsNew`

```
async narrateWhatsNew(groupedPRs, opts)
```

Generate the "What's New" narrative section via the LLM client.

#### Params

- `groupedPRs`
- `opts = {}`

#### Returns

_None._

#### Examples

_None._

### `projectMonth`

```
projectMonth(history, now, target)
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

_None._

#### Examples

_None._

### `recordUsage`

```
recordUsage(entry)
```

Record one LLM call's token usage into the per-run accumulator.

Called by `callLLM` after every successful Anthropic response. Invalid
input is ignored rather than thrown: cost tracking must never break a
pipeline run. A missing `label` defaults to `model` so the call is still
attributed.

#### Params

- `entry`

#### Returns

_None._

#### Examples

_None._

### `reportCost`

```
async reportCost({ stateDir, runId, telegramLogger, now, snapshot })
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

_None._

#### Examples

_None._

### `resetUsage`

```
resetUsage()
```

Clear the per-run usage accumulator. Call at the start of every run.

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `summarizeMonth`

```
summarizeMonth(history, yearMonth)
```

Aggregate every run record in the given calendar month.

#### Params

- `history`
- `yearMonth`

#### Returns

_None._

#### Examples

_None._

### `summarizeRun`

```
summarizeRun(snapshot)
```

Compute tokens + USD for a usage snapshot, broken down per accumulator
entry (one entry per model + call-site label).

An unknown model (not in MODEL_PRICING) cannot be priced; its `usd` is
`null` and it is counted in `unpricedEntries` rather than crashing the
report. `calculateCost` throws on an unknown model, so the call is guarded.

#### Params

- `snapshot`

#### Returns

_None._

#### Examples

_None._

### `yearMonthKey`

```
yearMonthKey(date)
```

Format a `Date` as the `YYYY-MM` calendar-month key.

#### Params

- `date`

#### Returns

_None._

#### Examples

_None._
