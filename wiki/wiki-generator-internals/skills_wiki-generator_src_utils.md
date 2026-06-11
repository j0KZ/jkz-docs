---
deprecated_since: null
description: Module skills/wiki-generator/src/utils
pagefind: true
sidebar:
  label: utils
  order: 12
title: skills/wiki-generator/src/utils
---

## Module summary

_None._

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `ISO_8601` | variable | no |
| `MODEL_PRICING` | variable | no |
| `MONTHLY_COST_TARGET_USD` | variable | no |
| `RecentPRsFetcherError` | class | no |
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

### `ISO_8601`

```text
ISO_8601
```

#### Params

_None._

#### Returns

_None._

### `MODEL_PRICING`

```text
MODEL_PRICING
```

#### Params

_None._

#### Returns

_None._

### `MONTHLY_COST_TARGET_USD`

```text
MONTHLY_COST_TARGET_USD
```

#### Params

_None._

#### Returns

_None._

### `RecentPRsFetcherError`

```text
RecentPRsFetcherError
```

#### Params

_None._

#### Returns

_None._

### `aliasModel`

```text
aliasModel(name): object
```

Map a friendly alias to the concrete model id and (when applicable) the
extended-thinking configuration. Throws on unknown alias.

#### Params

- `name: 'haiku'|'sonnet-medium'`

#### Returns

`object`

### `appendRunRecord`

```text
async appendRunRecord(stateDir, record): Promise<unknown>
```

Append one run's cost record to `<stateDir>/cost-history.json` and persist
atomically. The record carries the run id, the run's calendar date, the
total tokens, and the total USD.

#### Params

- `stateDir: string` — - absolute path to the wiki-generator state dir.
- `record: {runId: string, date: string, tokens: number, usd: number}`

#### Returns

`Promise<unknown>`

### `calculateCost`

```text
calculateCost(usage, model): number
```

Calculate cost in USD for a single LLM call.

#### Params

- `usage: @param {number} usage.input_tokens
 * @param {number} usage.output_tokens
 * @param {number} [usage.cache_read=0]
 * @param {number} [usage.cache_creation=0]
 * `
- `model: string` — - canonical model id, must exist in MODEL_PRICING.

#### Returns

`number`

### `callLLM`

```text
async callLLM(opts): Promise<object>
```

Call the Anthropic Messages API with retries and a normalized response.

#### Params

- `opts: @param {'haiku'|'sonnet-medium'} opts.model
 * @param {Array<{role:'user'|'assistant', content:string}>} opts.messages
 * @param {string} [opts.system]
 * @param {boolean} [opts.jsonMode=false]
 * @param {number} [opts.maxTokens=4096]
 * @param {string} [opts.costLabel] - call-site tag for the WG-29 cost monitor's
 *   per-generator breakdown; defaults to the model alias.
 * `

#### Returns

`Promise<object>`

### `classifyWithHaiku`

```text
async classifyWithHaiku({ system, userContent }): Promise<unknown>
```

Invoke Haiku in JSON mode and return a validated classification result.

#### Params

- `{ system, userContent }`

#### Returns

`Promise<unknown>`

### `createGitHubClient`

```text
createGitHubClient(opts)
```

Build a wrapper around Octokit. Token defaults to WIKI_BOT_TOKEN.

#### Params

- `opts = {}`

#### Returns

_None._

### `dateKey`

```text
dateKey(date)
```

Format a `Date` as the `YYYY-MM-DD` calendar-day key.

#### Params

- `date`

#### Returns

_None._

### `describeBuckets`

```text
async describeBuckets(summaries, opts): Promise<unknown>
```

Single batched Sonnet-medium call describing every architecture
bucket. Returns a Map<bucket, sentence> on success or null on any
failure (caller falls back via deterministicDescribe).

#### Params

- `summaries: Array<object>`
- `opts: object = {}` — reserved for future use

#### Returns

`Promise<unknown>`

### `deterministicDescribe`

```text
deterministicDescribe(bucketName)
```

Deterministic per-bucket fallback. Returns a fixed sentence for the
five spec-locked buckets; everything else returns a generic label.

#### Params

- `bucketName: string`

#### Returns

`string`

### `deterministicHumanize`

```text
deterministicHumanize(raw)
```

Deterministic fallback transform: split on `_`, `-`, and `/`,
capitalize each word, join with spaces.

Pure function, exported so the generator and tests can call it
directly without invoking the LLM.

#### Params

- `raw: string`

#### Returns

`string`

### `fetchRecentMergedPRs`

```text
async fetchRecentMergedPRs({ sinceIso, repoDir, runner }): Promise<unknown>
```

Fetch merged PRs since `sinceIso` via `gh pr list --json ...`.

#### Params

- `{ sinceIso, repoDir, runner } = {}`

#### Returns

`Promise<unknown>`

### `formatMonthlySummary`

```text
formatMonthlySummary(monthSummary, target)
```

Build the day-1-of-month Telegram summary text for the previous month.

#### Params

- `monthSummary: ReturnType<typeof summarizeMonth>`
- `target: number = MONTHLY_COST_TARGET_USD`

#### Returns

`string`

### `formatRunSummary`

```text
formatRunSummary({ runId, runSummary, projection })
```

Build the per-run Telegram summary text: total tokens, total USD, the
per-generator (label) breakdown, and the month-to-date projection.

#### Params

- `{ runId, runSummary, projection }`

#### Returns

`string`

### `generateEntryWithSonnet`

```text
async generateEntryWithSonnet({ system, userContent }): Promise<unknown>
```

Invoke Sonnet-medium in JSON mode and return the parsed entry object.

#### Params

- `{ system, userContent }`

#### Returns

`Promise<unknown>`

### `generateWorkflowGuide`

```text
async generateWorkflowGuide({ topic, signals, system, userContent }): Promise<unknown>
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

`Promise<unknown>`

### `getUsageSnapshot`

```text
getUsageSnapshot()
```

Return a deep copy of the accumulator entries so callers cannot mutate the
live state.

#### Params

_None._

#### Returns

`Array<{model: string, label: string, calls: number,  *   input_tokens: number, output_tokens: number, cache_read: number,  *   cache_creation: number}>`

### `humanizeWithHaiku`

```text
async humanizeWithHaiku(labels, opts): Promise<unknown>
```

Attempt to humanize a list of labels by calling Haiku. Returns a
`Map<originalLabel, humanizedLabel>` on success, or `null` on any
failure. Caller decides whether to fall back.

#### Params

- `labels: string[]` — list of raw labels (deduplicated)
- `opts: {maxLabels?: number} = {}`

#### Returns

`Promise<unknown>`

### `loadHistory`

```text
async loadHistory(stateDir): Promise<unknown>
```

Load the persisted cost history from `<stateDir>/cost-history.json`.
Returns an empty array when the file does not yet exist or is corrupt --
cost history is observability data, never a hard dependency.

#### Params

- `stateDir: string` — - absolute path to the wiki-generator state dir.

#### Returns

`Promise<unknown>`

### `logError`

```text
async logError(event): Promise<unknown>
```

Log a pipeline error.

#### Params

- `event: {message: string, [key: string]: unknown}`

#### Returns

`Promise<unknown>`

### `logUpdate`

```text
async logUpdate(event): Promise<unknown>
```

Log a routine pipeline update.

#### Params

- `event: {message: string, [key: string]: unknown}`

#### Returns

`Promise<unknown>`

### `narrateWhatsNew`

```text
async narrateWhatsNew(groupedPRs, opts): Promise<object>
```

Generate the "What's New" narrative section via the LLM client.

#### Params

- `groupedPRs: Record<string, Array<{number:number,title:string,body:string}>>` — PRs already sanitized and classified, grouped by conventional-commit   type. Keys must match GROUP_ORDER ('feat','fix','refactor','perf','other').
- `opts: {model?: string, maxTokens?: number, repoUrl?: string} = {}`

#### Returns

`Promise<object>`

### `projectMonth`

```text
projectMonth(history, now, target): object
```

Project the current month's total cost from the spend so far.

Month-to-date USD is divided by the number of elapsed days to get a daily
run rate, then multiplied by the number of days in the month. The result
is compared against `target` (default: the $50 WG-29 target).

#### Params

- `history: Array<{date: string, usd: number}>`
- `now: Date` — - current time (injected for testability).
- `target: number = MONTHLY_COST_TARGET_USD`

#### Returns

`object`

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

- `entry: @param {string} entry.model - canonical model id (key into MODEL_PRICING).
 * @param {object} entry.usage - {input_tokens, output_tokens, cache_read,
 *   cache_creation}; missing fields treated as 0.
 * @param {string} [entry.label] - generator/call-site tag for the breakdown.
 `

#### Returns

`void`

### `reportCost`

```text
async reportCost({ stateDir, runId, telegramLogger, now, snapshot }): Promise<object>
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

`Promise<object>`

### `resetUsage`

```text
resetUsage(): void
```

Clear the per-run usage accumulator. Call at the start of every run.

#### Params

_None._

#### Returns

`void`

### `summarizeMonth`

```text
summarizeMonth(history, yearMonth): object
```

Aggregate every run record in the given calendar month.

#### Params

- `history: Array<{date: string, tokens: number, usd: number}>`
- `yearMonth: string` — - `YYYY-MM` key (see `yearMonthKey`).

#### Returns

`object`

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

- `snapshot: Array<object>` — - output of `getUsageSnapshot()`.

#### Returns

`object`

### `yearMonthKey`

```text
yearMonthKey(date): string
```

Format a `Date` as the `YYYY-MM` calendar-month key.

#### Params

- `date`

#### Returns

`string`
