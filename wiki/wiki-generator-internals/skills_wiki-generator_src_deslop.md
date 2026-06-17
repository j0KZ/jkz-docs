---
deprecated_since: null
description: Module skills/wiki-generator/src/deslop
pagefind: true
sidebar:
  label: deslop
  order: 3
title: skills/wiki-generator/src/deslop
---

## Module summary

_None._

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `DESLOP_RULES` | variable | no |
| `composeDeslop` | function | no |
| `deslopWithLLM` | function | no |
| `limitEmDashesPerParagraph` | function | no |
| `reassemble` | function | no |
| `removeFillerPhrases` | function | no |
| `removeHedging` | function | no |
| `removeRedundantAdverbs` | function | no |
| `replaceVerboseConstructions` | function | no |
| `segmentMarkdown` | function | no |

## Detail

### `DESLOP_RULES`

```text
DESLOP_RULES
```

#### Params

_None._

#### Returns

_None._

### `composeDeslop`

```text
composeDeslop(content, opts): object
```

Run the deterministic deslop rules over the prose of `content`.

#### Params

- `content: string` — - The markdown document to clean.
- `opts: object` — - Reserved for future options; must be a plain object when supplied. Currently unused.

#### Returns

`object`

### `deslopWithLLM`

```text
async deslopWithLLM({ content, llmClient, costLabel = 'deslop_llm' }): Promise<unknown>
```

Run the opt-in LLM deslop pass. Always returns a string; on any rejection
path it returns the input `content` unchanged (fail-open).

#### Params

- `{ content, llmClient, costLabel = 'deslop_llm' }`

#### Returns

`Promise<unknown>`

### `limitEmDashesPerParagraph`

```text
limitEmDashesPerParagraph(prose)
```

Limit em dashes to at most 2 per paragraph. Paragraphs are split on blank
lines, with the separators captured and re-joined so spacing round-trips.
Within a paragraph: count em dashes; if <= 2, leave unchanged; if > 2,
replace the 3rd-and-subsequent occurrences only -- a space-flanked dash
becomes ", " (collapsing the leading space), otherwise ".".

#### Params

- `prose`

#### Returns

_None._

### `reassemble`

```text
reassemble(segments)
```

Re-join segments into the original string. Pure inverse of `segmentMarkdown`
(and of any transform that only rewrites 'prose' segment text).

#### Params

- `segments: Array<{type: string, text: string}>`

#### Returns

`string`

### `removeFillerPhrases`

```text
removeFillerPhrases(prose)
```

Remove filler phrases plus surrounding glue (a leading or trailing ", ").
CAPITALIZATION RULE: re-capitalize the new sentence start ONLY when the
removed phrase was sentence-initial (at string start or after sentence
punctuation); mid-sentence removals leave the following words untouched.

Done in one replace per phrase so recapitalization is scoped exactly to the
removal site -- prose that merely begins lowercase (with no removal) is never
touched.

#### Params

- `prose`

#### Returns

_None._

### `removeHedging`

```text
removeHedging(prose)
```

Strip sentence-initial hedging adverbs ("Essentially, ...") and re-capitalize
the following word. Sentence-initial only (string start or after sentence
punctuation), matching the filler-phrase capitalization rule.

#### Params

- `prose`

#### Returns

_None._

### `removeRedundantAdverbs`

```text
removeRedundantAdverbs(prose)
```

Remove redundant intensifying adverbs ("unique" -> "unique"),
preserving the casing of the retained word. Case-insensitive, word-anchored.

#### Params

- `prose`

#### Returns

_None._

### `replaceVerboseConstructions`

```text
replaceVerboseConstructions(prose)
```

Replace verbose constructions with concise equivalents, case-insensitively,
preserving the leading-capital of the matched span. Word-boundary anchored.

#### Params

- `prose`

#### Returns

_None._

### `segmentMarkdown`

```text
segmentMarkdown(content)
```

Partition markdown into ordered, lossless segments.

#### Params

- `content: string`

#### Returns

`Array<{type: 'frontmatter'\|'fence'\|'inlinecode'\|'prose', text: string}>`
