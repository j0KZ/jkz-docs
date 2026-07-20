---
deprecated_since: null
description: Module skills/wiki-generator/src/generators
pagefind: true
sidebar:
  label: generators
  order: 7
title: skills/wiki-generator/src/generators
---

## Module summary

_None._

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `GENERATOR_OWNED_PREFIXES` | variable | no |
| `GENERATOR_REGISTRY` | variable | no |
| `IGNORE_PATTERNS` | variable | no |
| `KNOWN_GENERATOR_NAMES` | variable | no |
| `SECTION_DIR` | variable | no |
| `appendEntryToFile` | function | no |
| `bucketOf` | function | no |
| `buildDepGraph` | function | no |
| `crossCheckHallucinations` | function | no |
| `demoteHeadings` | function | no |
| `enforcePromptBudget` | function | no |
| `escapeScalar` | function | no |
| `extractMentionedSymbols` | function | no |
| `extractModuleDoc` | function | no |
| `formatEntryMarkdown` | function | no |
| `generateApiReference` | function | no |
| `generateArchitectureDoc` | function | no |
| `generateChangelog` | function | no |
| `generateIssueEntries` | function | no |
| `generateModuleDocs` | function | no |
| `generateReferencePages` | function | no |
| `generateSidebar` | function | no |
| `generateWorkflowDocs` | function | no |
| `groupModules` | function | no |
| `loadModuleHashes` | function | no |
| `loadPrompt` | function | no |
| `loadPromptTemplate` | function | no |
| `newFileHeader` | function | no |
| `pageNameForDir` | function | no |
| `parseFrontmatter` | function | no |
| `renderMermaid` | function | no |
| `renderModulePage` | function | no |
| `renderPage` | function | no |
| `renderTable` | function | no |
| `resolveEnabledGenerators` | function | no |
| `resolveOutputPath` | function | no |
| `saveModuleHashes` | function | no |
| `serializeFrontmatter` | function | no |
| `serializeObject` | function | no |
| `serializeReferenceFrontmatter` | function | no |
| `serializeScalar` | function | no |
| `splitSections` | function | no |
| `stripFrontmatter` | function | no |
| `validateEntry` | function | no |
| `validateHedges` | function | no |

## Detail

### `GENERATOR_OWNED_PREFIXES`

```text
GENERATOR_OWNED_PREFIXES
```

#### Params

_None._

#### Returns

_None._

### `GENERATOR_REGISTRY`

```text
GENERATOR_REGISTRY
```

#### Params

_None._

#### Returns

_None._

### `IGNORE_PATTERNS`

```text
IGNORE_PATTERNS
```

#### Params

_None._

#### Returns

_None._

### `KNOWN_GENERATOR_NAMES`

```text
KNOWN_GENERATOR_NAMES
```

#### Params

_None._

#### Returns

_None._

### `SECTION_DIR`

```text
SECTION_DIR
```

#### Params

_None._

#### Returns

_None._

### `appendEntryToFile`

```text
appendEntryToFile(outputPath, formattedMarkdown, category, issueNumber): object
```

#### Params

- `outputPath`
- `formattedMarkdown`
- `category`
- `issueNumber`

#### Returns

`object`

### `bucketOf`

```text
bucketOf(dirRel, buckets)
```

Classify a JS-module dirRel into a bucket name. Iterates buckets in
declaration order; first match wins. Returns 'core' as catch-all.

#### Params

- `dirRel: string`
- `buckets: Array<{name: string, dir: string | null}>`

#### Returns

`string`

### `buildDepGraph`

```text
async buildDepGraph({ rootDir, globs, buckets }): Promise<object>
```

Build the architecture dep graph: JS modules from AST + directory
descriptors from config.buckets.

#### Params

- `{ rootDir, globs, buckets }`

#### Returns

`Promise<object>`

### `crossCheckHallucinations`

```text
crossCheckHallucinations(llmText, exportNames)
```

Compute the set of mentioned symbols that are neither in `exportNames`
nor in the intrinsics allowlist. A non-empty result is a hallucination.

#### Params

- `llmText: string`
- `exportNames: Set<string>`

#### Returns

`Set<string>`

### `demoteHeadings`

```text
demoteHeadings(text)
```

Demote every ATX heading line (`#`-prefixed) by one level, capped at
`######`. Code fences are tracked so headings inside fenced blocks are
preserved verbatim.

Fence tracking follows CommonMark: a closing fence must use the same
marker character (`` ` `` or `~`) as the opening fence and be at least
as long. A mismatched delimiter inside a fenced block (e.g. a `~~~`
line within a ```` ``` ```` block) is therefore not treated as a close.

#### Params

- `text: string`

#### Returns

`string`

### `enforcePromptBudget`

```text
enforcePromptBudget({ userTemplate, vars }): object
```

Enforce the input prompt budget. If the rendered USER text exceeds
`PROMPT_BUDGET_BYTES`, progressively drop the JSDOC block, clamp README,
then drop EXPORTS, SIGNATURES, and RELATED blocks. If the prompt is still
over budget after every block has been dropped, a final hard clamp
truncates the rendered text to the byte budget so the caller is
guaranteed never to send an oversized prompt. Returns `{prompt,
truncated}` where `truncated` is the array of applied truncations (for
diagnostics in warnings).

#### Params

- `{ userTemplate, vars }`

#### Returns

`object`

### `escapeScalar`

```text
escapeScalar(s)
```

Quote a YAML scalar string conservatively.

Strings that contain anything that could be misparsed (special YAML chars,
leading/trailing whitespace, leading sigils, or sequences that resemble
other scalar types) are double-quoted with backslash escaping. Otherwise
the value is emitted as a plain scalar.

#### Params

- `s: string`

#### Returns

`string`

### `extractMentionedSymbols`

```text
extractMentionedSymbols(text)
```

Scan the LLM text for backtick-quoted bare identifiers. Returns the set
of distinct mentioned symbols (excluding strings that span multiple
tokens or contain operators / punctuation).

#### Params

- `text: string`

#### Returns

`Set<string>`

### `extractModuleDoc`

```text
extractModuleDoc(allJsdocBlocks)
```

Mine the aggregated JSDoc blocks for an explicit module-level summary.
Only blocks carrying an explicit module tag (`@fileoverview`, `@file`,
or `@module`) qualify -- a tag-less function docblock must never be
promoted to the module summary (false-positive guard, #1615 Defect #2).
Returns the first paragraph of the matched tag, with the JSDoc `*`
decoration stripped, or null when no module tag is present.

#### Params

- `allJsdocBlocks: Array<{raw?: string}> | undefined`

#### Returns

`string \| null`

### `formatEntryMarkdown`

```text
formatEntryMarkdown(category, entry, issueNumber)
```

#### Params

- `category`
- `entry`
- `issueNumber`

#### Returns

_None._

### `generateApiReference`

```text
async generateApiReference({ rootDir, config, now }): Promise<object>
```

Generate API reference pages, write them to disk, and reconcile
orphans. Returns the run summary and -- for tests -- a counter that
proves no LLM call was made (`__llmCallCount === 0`).

#### Params

- `{ rootDir, config, now }`

#### Returns

`Promise<object>`

### `generateArchitectureDoc`

```text
async generateArchitectureDoc({ rootDir, config, now, describer }): Promise<object>
```

#### Params

- `{ rootDir, config, now, describer }`

#### Returns

`Promise<object>`

### `generateChangelog`

```text
async generateChangelog({ rootDir, config, now, fetcher, narrator }): Promise<object>
```

Generate `wiki/reference/changelog.md`.

#### Params

- `{ rootDir, config, now, fetcher, narrator }`

#### Returns

`Promise<object>`

### `generateIssueEntries`

```text
async generateIssueEntries({
  issues,
  classify,
  generateEntry,
  sanitize,
  config,
  stateDir,
  rootDir,
}): Promise<object>
```

Generate wiki entries from a batch of classified issues.

#### Params

- `{   issues,   classify,   generateEntry,   sanitize,   config,   stateDir,   rootDir, }`

#### Returns

`Promise<object>`

### `generateModuleDocs`

```text
async generateModuleDocs({ rootDir, config }): Promise<object>
```

Generate module documentation pages. See file header for the contract.

#### Params

- `{ rootDir, config }`

#### Returns

`Promise<object>`

### `generateReferencePages`

```text
async generateReferencePages({ rootDir, config, now }): Promise<object>
```

Generate the 6 reference pages, write them under
`<rootDir>/<config.paths.wikiOutput>/reference/`, and -- best-effort --
fire a Telegram notification when warnings accumulated.

#### Params

- `{ rootDir, config, now }`

#### Returns

`Promise<object>`

### `generateSidebar`

```text
async generateSidebar({ rootDir, config, humanizer }): Promise<object>
```

Generate `sidebar.json`. See file header for full behaviour.

The optional `humanizer` parameter exists so tests can inject a
deterministic stand-in for `humanizeWithHaiku`. Production callers
omit it; the default uses the real Haiku-backed helper.

#### Params

- `{ rootDir, config, humanizer }`

#### Returns

`Promise<object>`

### `generateWorkflowDocs`

```text
async generateWorkflowDocs({ rootDir, config, now, _generateGuide }): Promise<object>
```

Generate workflow guide pages. See the file header for behaviour.

#### Params

- `{ rootDir, config, now, _generateGuide }`

#### Returns

`Promise<object>`

### `groupModules`

```text
async groupModules({ rootDir, globs }): Promise<unknown>
```

Expand globs and group matching source files by immediate parent dir.

#### Params

- `{ rootDir, globs }`

#### Returns

`Promise<unknown>`

### `loadModuleHashes`

```text
async loadModuleHashes(stateDirAbs): Promise<unknown>
```

Load the persisted module-hash map. The schema is richer than
`hash_tracker.js` (which only stores string values): each entry is
`{hash, promptVersion, pageWritten}`. Returns an empty plain object if
the file is missing.

#### Params

- `stateDirAbs: string`

#### Returns

`Promise<unknown>`

### `loadPrompt`

```text
loadPrompt(category): object
```

Load a prompt template for the given category.

#### Params

- `category: string` — category name (no `issue_` prefix, no extension)

#### Returns

`object`

### `loadPromptTemplate`

```text
loadPromptTemplate()
```

Load and cache the prompt template, splitting on the three section
headings. Returns `{system, user, version}` where `version` is the
`prompt-version: <n>` numeric value.

#### Params

_None._

#### Returns

`{system: string, user: string, version: number}`

### `newFileHeader`

```text
newFileHeader(category)
```

#### Params

- `category`

#### Returns

_None._

### `pageNameForDir`

```text
pageNameForDir(dirRel): string
```

Derive the page filename from a POSIX-relative directory path.

Uses split/join so EVERY `/` becomes `_`, not just the first occurrence.

#### Params

- `dirRel: string`

#### Returns

`string`

### `parseFrontmatter`

```text
parseFrontmatter(text): object
```

Extract the `title` and `description` fields from a frontmatter YAML
block. The parser is intentionally permissive: it accepts unquoted,
double-quoted, and single-quoted scalars and ignores any other keys.

#### Params

- `text: string` — full file content

#### Returns

`object`

### `renderMermaid`

```text
renderMermaid({ nodes, edges, title })
```

Render a Mermaid `graph LR` block from a node + edge set.

Each node renders as `nN["<dirRel> (<fileCount> files)"]` when the
node is a directory-descriptor (non-JS bucket), or `nN["<dirRel>"]`
for a JS-module node. Edges render one per line, sorted lexically.

#### Params

- `{ nodes, edges, title }`

#### Returns

`string`

### `renderModulePage`

```text
renderModulePage({
  frontmatter,
  moduleSummary,
  exports,
  signatures,
  jsdocBlocks,
})
```

Render a complete API reference page.

#### Params

- `{   frontmatter,   moduleSummary,   exports,   signatures,   jsdocBlocks, }`

#### Returns

`string`

### `renderPage`

```text
renderPage({ frontmatter, summary, sections })
```

Compose the full architecture page from a frontmatter block, a
summary paragraph, and an ordered list of sections (each either a
`mermaid` or `table` kind).

#### Params

- `{ frontmatter, summary, sections }`

#### Returns

`string`

### `renderTable`

```text
renderTable({ nodes, edges, title })
```

Render a Markdown table fallback for sub-graphs that exceed the
Mermaid node cap. JS-module nodes use the columns
`Module | Imports From | Imported By`; directory-descriptor nodes
use `Directory | Files | Description`.

#### Params

- `{ nodes, edges, title }`

#### Returns

`string`

### `resolveEnabledGenerators`

```text
resolveEnabledGenerators(enabled)
```

Resolve the ordered list of generator entries to run from a config
`enabled` array. Iteration order matches the input array (sequential
dispatch in the orchestrator).

Throws synchronously with a human-readable message on:
  - non-array input (defense in depth; loader already validates shape)
  - an entry that is not a registered generator name

#### Params

- `enabled: string[]` — - the `config.generators.enabled` array.

#### Returns

`Array<{ name: string, fn: Function, buildArgs: Function }>`

### `resolveOutputPath`

```text
resolveOutputPath(rootDir, config, category)
```

#### Params

- `rootDir`
- `config`
- `category`

#### Returns

_None._

### `saveModuleHashes`

```text
async saveModuleHashes(stateDirAbs, hashes): Promise<void>
```

Persist the module-hash map atomically. Keys sorted alphabetically.
Mirrors the tmp+rename pattern from `hash_tracker.saveHashes`.

#### Params

- `stateDirAbs: string`
- `hashes: Record<string, {hash: string, promptVersion: number, pageWritten: boolean}>`

#### Returns

`Promise<void>`

### `serializeFrontmatter`

```text
serializeFrontmatter(obj): string
```

Build, ajv-validate, and deterministically serialize Starlight frontmatter.

Throws an Error tagged with the ajv error path on invalid input.

#### Params

- `obj: Record<string, unknown>`

#### Returns

`string`

### `serializeObject`

```text
serializeObject(obj, depth)
```

Serialize an object as YAML at the given indent depth, with sorted keys.

#### Params

- `obj: Record<string, unknown>`
- `depth: number`

#### Returns

`string`

### `serializeReferenceFrontmatter`

```text
serializeReferenceFrontmatter(obj): string
```

Variant of serializeFrontmatter for WG-34 reference/catalog pages. Identical
surface and YAML output discipline; the only difference is the underlying
schema, which permits `editUrl: null`. Used by reference_pages_generator
when config.site.repoUrl is unavailable.

#### Params

- `obj: Record<string, unknown>`

#### Returns

`string`

### `serializeScalar`

```text
serializeScalar(value)
```

Serialize a single value with stable formatting.

Booleans render unquoted, numbers render verbatim, null renders as bare
`null` (Clarification C4), strings go through escapeScalar.

#### Params

- `value: unknown`

#### Returns

`string`

### `splitSections`

```text
splitSections(text): object
```

Split the LLM text into the five required sections. Throws a typed
error when a section is missing or out of order.

#### Params

- `text: string`

#### Returns

`object`

### `stripFrontmatter`

```text
stripFrontmatter(text)
```

Strip a leading frontmatter block (`---\n...\n---\n`). Returns the
post-frontmatter content; if no frontmatter is present, returns the
input unchanged.

#### Params

- `text: string`

#### Returns

`string`

### `validateEntry`

```text
validateEntry(category, entry): object
```

Run the binary rubric against an entry.

#### Params

- `category: string` — category name; must exist in CATEGORIES
- `entry: object` — the generated entry object

#### Returns

`object`

### `validateHedges`

```text
validateHedges(content): object
```

Detect banned hedge phrases (case-insensitive substring match).

#### Params

- `content: string`

#### Returns

`object`
