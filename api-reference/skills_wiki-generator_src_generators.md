---
deprecated_since: null
description: Module skills/wiki-generator/src/generators
editUrl: null
pagefind: true
sidebar:
  label: generators
  order: 13
title: skills/wiki-generator/src/generators
---

## Module summary

Module skills/wiki-generator/src/generators

## Exports

| Name | Kind | Default |
| --- | --- | --- |
| `__getAtomicWriteFileForTests` | function | no |
| `__resetPromptCacheForTests` | function | no |
| `_getValidator` | function | no |
| `appendEntryToFile` | function | no |
| `bucketOf` | function | no |
| `buildDepGraph` | function | no |
| `crossCheckHallucinations` | function | no |
| `demoteHeadings` | function | no |
| `enforcePromptBudget` | function | no |
| `escapeScalar` | function | no |
| `extractMentionedSymbols` | function | no |
| `formatEntryMarkdown` | function | no |
| `generateApiReference` | function | no |
| `generateArchitectureDoc` | function | no |
| `generateChangelog` | function | no |
| `generateIssueEntries` | function | no |
| `generateLlmsFullTxt` | function | no |
| `generateLlmsTxt` | function | no |
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

### `__getAtomicWriteFileForTests`

```
__getAtomicWriteFileForTests()
```

Test-only seam so a stubbed rename failure can exercise AC-8 without
mocking `node:fs/promises` globally. NOT public API.

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `__resetPromptCacheForTests`

```
__resetPromptCacheForTests()
```

Test-only: reset the cached template so a fresh read can be triggered
after a hot edit. Not part of the public surface.

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `_getValidator`

```
_getValidator()
```

Internal getter so tests can confirm the validator is the same instance.

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `appendEntryToFile`

```
appendEntryToFile(outputPath, formattedMarkdown, category, issueNumber)
```

#### Params

- `outputPath`
- `formattedMarkdown`
- `category`
- `issueNumber`

#### Returns

_None._

#### Examples

_None._

### `bucketOf`

```
bucketOf(dirRel, buckets)
```

Classify a JS-module dirRel into a bucket name. Iterates buckets in
declaration order; first match wins. Returns 'core' as catch-all.

#### Params

- `dirRel`
- `buckets`

#### Returns

_None._

#### Examples

_None._

### `buildDepGraph`

```
async buildDepGraph({ rootDir, globs, buckets })
```

Build the architecture dep graph: JS modules from AST + directory
descriptors from config.buckets.

#### Params

- `{ rootDir, globs, buckets }`

#### Returns

_None._

#### Examples

_None._

### `crossCheckHallucinations`

```
crossCheckHallucinations(llmText, exportNames)
```

Compute the set of mentioned symbols that are neither in `exportNames`
nor in the intrinsics allowlist. A non-empty result is a hallucination.

#### Params

- `llmText`
- `exportNames`

#### Returns

_None._

#### Examples

_None._

### `demoteHeadings`

```
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

- `text`

#### Returns

_None._

#### Examples

_None._

### `enforcePromptBudget`

```
enforcePromptBudget({ userTemplate, vars })
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

_None._

#### Examples

_None._

### `escapeScalar`

```
escapeScalar(s)
```

Quote a YAML scalar string conservatively.

Strings that contain anything that could be misparsed (special YAML chars,
leading/trailing whitespace, leading sigils, or sequences that resemble
other scalar types) are double-quoted with backslash escaping. Otherwise
the value is emitted as a plain scalar.

#### Params

- `s`

#### Returns

_None._

#### Examples

_None._

### `extractMentionedSymbols`

```
extractMentionedSymbols(text)
```

Scan the LLM text for backtick-quoted bare identifiers. Returns the set
of distinct mentioned symbols (excluding strings that span multiple
tokens or contain operators / punctuation).

#### Params

- `text`

#### Returns

_None._

#### Examples

_None._

### `formatEntryMarkdown`

```
formatEntryMarkdown(category, entry, issueNumber)
```

#### Params

- `category`
- `entry`
- `issueNumber`

#### Returns

_None._

#### Examples

_None._

### `generateApiReference`

```
async generateApiReference({ rootDir, config, now })
```

Generate API reference pages, write them to disk, and reconcile
orphans. Returns the run summary and -- for tests -- a counter that
proves no LLM call was made (`__llmCallCount === 0`).

#### Params

- `{ rootDir, config, now }`

#### Returns

_None._

#### Examples

_None._

### `generateArchitectureDoc`

```
async generateArchitectureDoc({ rootDir, config, now, describer })
```

#### Params

- `{ rootDir, config, now, describer }`

#### Returns

_None._

#### Examples

_None._

### `generateChangelog`

```
async generateChangelog({ rootDir, config, now, fetcher, narrator })
```

Generate `wiki/reference/changelog.md`.

#### Params

- `{ rootDir, config, now, fetcher, narrator }`

#### Returns

_None._

#### Examples

_None._

### `generateIssueEntries`

```
async generateIssueEntries({
  issues,
  classify,
  generateEntry,
  sanitize,
  config,
  stateDir,
  rootDir,
})
```

Generate wiki entries from a batch of classified issues.

#### Params

- `{   issues,   classify,   generateEntry,   sanitize,   config,   stateDir,   rootDir, }`

#### Returns

_None._

#### Examples

_None._

### `generateLlmsFullTxt`

```
async generateLlmsFullTxt({ rootDir, config })
```

Generate `llms-full.txt`. See file header for full behaviour.

#### Params

- `{ rootDir, config }`

#### Returns

_None._

#### Examples

_None._

### `generateLlmsTxt`

```
async generateLlmsTxt({ rootDir, config })
```

Generate `llms.txt`. See file header for full behaviour.

#### Params

- `{ rootDir, config }`

#### Returns

_None._

#### Examples

_None._

### `generateModuleDocs`

```
async generateModuleDocs({ rootDir, config })
```

Generate module documentation pages. See file header for the contract.

#### Params

- `{ rootDir, config }`

#### Returns

_None._

#### Examples

_None._

### `generateReferencePages`

```
async generateReferencePages({ rootDir, config, now })
```

Generate the 6 reference pages, write them under
`<rootDir>/<config.paths.wikiOutput>/reference/`, and -- best-effort --
fire a Telegram notification when warnings accumulated.

#### Params

- `{ rootDir, config, now }`

#### Returns

_None._

#### Examples

_None._

### `generateSidebar`

```
async generateSidebar({ rootDir, config, humanizer })
```

Generate `sidebar.json`. See file header for full behaviour.

The optional `humanizer` parameter exists so tests can inject a
deterministic stand-in for `humanizeWithHaiku`. Production callers
omit it; the default uses the real Haiku-backed helper.

#### Params

- `{ rootDir, config, humanizer }`

#### Returns

_None._

#### Examples

_None._

### `generateWorkflowDocs`

```
async generateWorkflowDocs({ rootDir, config, now, _generateGuide })
```

Generate workflow guide pages. See the file header for behaviour.

#### Params

- `{ rootDir, config, now, _generateGuide }`

#### Returns

_None._

#### Examples

_None._

### `groupModules`

```
async groupModules({ rootDir, globs })
```

Expand globs and group matching source files by immediate parent dir.

#### Params

- `{ rootDir, globs }`

#### Returns

_None._

#### Examples

_None._

### `loadModuleHashes`

```
async loadModuleHashes(stateDirAbs)
```

Load the persisted module-hash map. The schema is richer than
`hash_tracker.js` (which only stores string values): each entry is
`{hash, promptVersion, pageWritten}`. Returns an empty plain object if
the file is missing.

#### Params

- `stateDirAbs`

#### Returns

_None._

#### Examples

_None._

### `loadPrompt`

```
loadPrompt(category)
```

Load a prompt template for the given category.

#### Params

- `category`

#### Returns

_None._

#### Examples

_None._

### `loadPromptTemplate`

```
loadPromptTemplate()
```

Load and cache the prompt template, splitting on the three section
headings. Returns `{system, user, version}` where `version` is the
`prompt-version: <n>` numeric value.

#### Params

_None._

#### Returns

_None._

#### Examples

_None._

### `newFileHeader`

```
newFileHeader(category)
```

#### Params

- `category`

#### Returns

_None._

#### Examples

_None._

### `pageNameForDir`

```
pageNameForDir(dirRel)
```

Derive the page filename from a POSIX-relative directory path.

Uses split/join so EVERY `/` becomes `_`, not just the first occurrence.

#### Params

- `dirRel`

#### Returns

_None._

#### Examples

_None._

### `parseFrontmatter`

```
parseFrontmatter(text)
```

Extract the `title` and `description` fields from a frontmatter YAML
block. The parser is intentionally permissive: it accepts unquoted,
double-quoted, and single-quoted scalars and ignores any other keys.

#### Params

- `text`

#### Returns

_None._

#### Examples

_None._

### `renderMermaid`

```
renderMermaid({ nodes, edges, title })
```

Render a Mermaid `graph LR` block from a node + edge set.

Each node renders as `nN["<dirRel> (<fileCount> files)"]` when the
node is a directory-descriptor (non-JS bucket), or `nN["<dirRel>"]`
for a JS-module node. Edges render one per line, sorted lexically.

#### Params

- `{ nodes, edges, title }`

#### Returns

_None._

#### Examples

_None._

### `renderModulePage`

```
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

_None._

#### Examples

_None._

### `renderPage`

```
renderPage({ frontmatter, summary, sections })
```

Compose the full architecture page from a frontmatter block, a
summary paragraph, and an ordered list of sections (each either a
`mermaid` or `table` kind).

#### Params

- `{ frontmatter, summary, sections }`

#### Returns

_None._

#### Examples

_None._

### `renderTable`

```
renderTable({ nodes, edges, title })
```

Render a Markdown table fallback for sub-graphs that exceed the
Mermaid node cap. JS-module nodes use the columns
`Module | Imports From | Imported By`; directory-descriptor nodes
use `Directory | Files | Description`.

#### Params

- `{ nodes, edges, title }`

#### Returns

_None._

#### Examples

_None._

### `resolveOutputPath`

```
resolveOutputPath(rootDir, config, category)
```

#### Params

- `rootDir`
- `config`
- `category`

#### Returns

_None._

#### Examples

_None._

### `saveModuleHashes`

```
async saveModuleHashes(stateDirAbs, hashes)
```

Persist the module-hash map atomically. Keys sorted alphabetically.
Mirrors the tmp+rename pattern from `hash_tracker.saveHashes`.

#### Params

- `stateDirAbs`
- `hashes`

#### Returns

_None._

#### Examples

_None._

### `serializeFrontmatter`

```
serializeFrontmatter(obj)
```

Build, ajv-validate, and deterministically serialize Starlight frontmatter.

Throws an Error tagged with the ajv error path on invalid input.

#### Params

- `obj`

#### Returns

_None._

#### Examples

_None._

### `serializeObject`

```
serializeObject(obj, depth)
```

Serialize an object as YAML at the given indent depth, with sorted keys.

#### Params

- `obj`
- `depth`

#### Returns

_None._

#### Examples

_None._

### `serializeReferenceFrontmatter`

```
serializeReferenceFrontmatter(obj)
```

Variant of serializeFrontmatter for WG-34 reference/catalog pages. Identical
surface and YAML output discipline; the only difference is the underlying
schema, which permits `editUrl: null`. Used by reference_pages_generator
when config.site.repoUrl is unavailable.

#### Params

- `obj`

#### Returns

_None._

#### Examples

_None._

### `serializeScalar`

```
serializeScalar(value)
```

Serialize a single value with stable formatting.

Booleans render unquoted, numbers render verbatim, null renders as bare
`null` (Clarification C4), strings go through escapeScalar.

#### Params

- `value`

#### Returns

_None._

#### Examples

_None._

### `splitSections`

```
splitSections(text)
```

Split the LLM text into the five required sections. Throws a typed
error when a section is missing or out of order.

#### Params

- `text`

#### Returns

_None._

#### Examples

_None._

### `stripFrontmatter`

```
stripFrontmatter(text)
```

Strip a leading frontmatter block (`---\n...\n---\n`). Returns the
post-frontmatter content; if no frontmatter is present, returns the
input unchanged.

#### Params

- `text`

#### Returns

_None._

#### Examples

_None._

### `validateEntry`

```
validateEntry(category, entry)
```

Run the binary rubric against an entry.

#### Params

- `category`
- `entry`

#### Returns

_None._

#### Examples

_None._

### `validateHedges`

```
validateHedges(content)
```

Detect banned hedge phrases (case-insensitive substring match).

#### Params

- `content`

#### Returns

_None._

#### Examples

_None._
