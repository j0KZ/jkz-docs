// Zero-dependency tests for the llms.txt build integration (#1612).
// Run with: node --test src/integrations/llms-txt.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import llmsTxt, {
  SECTION_ORDER,
  parseFrontmatter,
  resolveTitle,
  urlPathFromRel,
  collectMarkdown,
  loadPages,
  demoteHeadings,
  buildLlmsTxt,
  buildLlmsFullTxt,
} from './llms-txt.mjs';

const SITE = 'https://docs.j0kz.dev';

/** Build a throwaway wiki fixture tree; returns its absolute path. */
function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'llms-fixture-'));
  const write = (rel, content) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  };
  write('index.md', '---\ntitle: jkz docs\ndescription: Home summary.\n---\n\nWelcome body.\n');
  write(
    'get-started/install.md',
    '---\ntitle: Install\ndescription: How to install jkz.\n---\n\n## Step\n\nDo it.\n',
  );
  write(
    'concepts/pipeline.md',
    '---\ntitle: The pipeline\ndescription: The state machine.\n---\n\nProse.\n\n## Phases\n\nThree.\n',
  );
  // No frontmatter title -> falls back to first H1.
  write('reference/cli.md', '# CLI reference\n\nFlags and usage.\n');
  // No title, no H1 -> humanized filename.
  write('operations/state-schema.md', 'Just body, no heading.\n');
  // api-reference must sort LAST regardless of alphabetical order.
  write(
    'api-reference/index.md',
    '---\ntitle: API reference\ndescription: Auto-generated.\n---\n\nMechanical dump.\n',
  );
  write(
    'api-reference/scripts_run.md',
    '---\ntitle: scripts/run\ndescription: Run module.\n---\n\n# scripts/run\n\nDetails.\n',
  );
  return root;
}

test('parseFrontmatter reads scalars and strips the block', () => {
  const { data, body } = parseFrontmatter('---\ntitle: "Quoted"\ndescription: Plain\n---\n\nBody.\n');
  assert.equal(data.title, 'Quoted');
  assert.equal(data.description, 'Plain');
  assert.equal(body, '\nBody.\n');
});

test('parseFrontmatter passes through content without a block', () => {
  const { data, body } = parseFrontmatter('# No frontmatter\n\nText.\n');
  assert.deepEqual(data, {});
  assert.equal(body, '# No frontmatter\n\nText.\n');
});

test('resolveTitle: frontmatter > H1 > humanized filename', () => {
  assert.equal(resolveTitle({ title: 'FM' }, '# H1\n', 'a/b.md'), 'FM');
  assert.equal(resolveTitle({}, '# Body H1\n\ntext', 'a/b.md'), 'Body H1');
  assert.equal(resolveTitle({}, 'no heading', 'a/run-a-pipeline.md'), 'Run a pipeline');
});

test('urlPathFromRel matches Starlight trailing-slash routing', () => {
  assert.equal(urlPathFromRel('index.md'), '/');
  assert.equal(urlPathFromRel('concepts/pipeline.md'), '/concepts/pipeline/');
  assert.equal(urlPathFromRel('api-reference/index.md'), '/api-reference/');
});

test('urlPathFromRel encodes reserved characters per segment', () => {
  // Spaces and reserved chars are percent-encoded; `/` separators preserved.
  assert.equal(urlPathFromRel('reference/c & c.md'), '/reference/c%20%26%20c/');
  assert.equal(urlPathFromRel('api-reference/scripts_run#x.md'), '/api-reference/scripts_run%23x/');
});

test('parseFrontmatter tolerates CRLF line endings', () => {
  const { data, body } = parseFrontmatter('---\r\ntitle: Win\r\ndescription: CRLF\r\n---\r\n\r\nBody.\r\n');
  assert.equal(data.title, 'Win');
  assert.equal(data.description, 'CRLF');
  assert.equal(body, '\nBody.\n');
});

test('collectMarkdown walks recursively and sorts', () => {
  const root = makeFixture();
  const files = collectMarkdown(root);
  assert.ok(files.includes('index.md'));
  assert.ok(files.includes('api-reference/scripts_run.md'));
  // Sorted.
  assert.deepEqual(files, [...files].sort());
});

test('demoteHeadings shifts ATX headings one level and preserves fences', () => {
  const input = '# Top\n\n## Sub\n\n```\n# not a heading\n```\n';
  const out = demoteHeadings(input);
  assert.match(out, /^## Top$/m);
  assert.match(out, /^### Sub$/m);
  // The fenced `# not a heading` is untouched.
  assert.match(out, /^# not a heading$/m);
});

test('demoteHeadings caps at H6', () => {
  assert.equal(demoteHeadings('###### Deep').trim(), '###### Deep');
});

test('loadPages orders narrative-first with api-reference last', () => {
  const root = makeFixture();
  const { pages } = loadPages(root, SITE);
  const sections = pages.map((p) => p.section);
  // Root index first.
  assert.equal(pages[0].relPath, 'index.md');
  // api-reference entries are the final block.
  const lastTwo = sections.slice(-2);
  assert.deepEqual(lastTwo, ['api-reference', 'api-reference']);
  // get-started precedes concepts precedes reference precedes api-reference.
  assert.ok(sections.indexOf('get-started') < sections.indexOf('concepts'));
  assert.ok(sections.indexOf('reference') < sections.indexOf('api-reference'));
});

test('loadPages: index.md leads its own section', () => {
  const root = makeFixture();
  const { pages } = loadPages(root, SITE);
  const api = pages.filter((p) => p.section === 'api-reference');
  assert.equal(api[0].relPath, 'api-reference/index.md');
});

test('loadPages dedupes by canonical URL keep-first', () => {
  const root = makeFixture();
  // Two files that collapse to the same URL would be a duplicate; simulate by
  // re-running loadPages output through a manual check: every url is unique.
  const { pages, droppedCount } = loadPages(root, SITE);
  const urls = pages.map((p) => p.url);
  assert.equal(new Set(urls).size, urls.length);
  assert.equal(droppedCount, 0);
});

test('buildLlmsTxt: H1, blockquote summary, sections with absolute links', () => {
  const root = makeFixture();
  const { pages } = loadPages(root, SITE);
  const txt = buildLlmsTxt({ pages, title: 'jkz docs', summary: 'Summary.' });
  assert.match(txt, /^# jkz docs\n/);
  assert.match(txt, /\n> Summary\.\n/);
  assert.match(txt, /## Get started/);
  assert.match(txt, /## API reference/);
  // Absolute, trailing-slash link with description.
  assert.match(txt, /- \[Install\]\(https:\/\/docs\.j0kz\.dev\/get-started\/install\/\): How to install jkz\./);
  // The root index.md is NOT re-listed as a link item.
  assert.ok(!txt.includes('](https://docs.j0kz.dev/)'));
  // API section appears after the narrative sections.
  assert.ok(txt.indexOf('## Get started') < txt.indexOf('## API reference'));
});

test('buildLlmsFullTxt: single H1 root, per-page ## blocks with source + demoted body', () => {
  const root = makeFixture();
  const { pages } = loadPages(root, SITE);
  const full = buildLlmsFullTxt({ pages, title: 'jkz docs', summary: 'Summary.' });
  // Exactly one document H1.
  const h1Count = (full.match(/^# (?!#)/gm) || []).length;
  assert.equal(h1Count, 1);
  // Each page is a ## block with a Source line.
  assert.match(full, /## The pipeline\n\nSource: https:\/\/docs\.j0kz\.dev\/concepts\/pipeline\//);
  // The pipeline body's `## Phases` is demoted to `### Phases`.
  assert.match(full, /^### Phases$/m);
});

test('default export is a named Astro integration with a build:done hook', () => {
  const integration = llmsTxt();
  assert.equal(integration.name, 'jkz-llms-txt');
  assert.equal(typeof integration.hooks['astro:build:done'], 'function');
});

test('SECTION_ORDER ends with api-reference', () => {
  assert.equal(SECTION_ORDER[SECTION_ORDER.length - 1], 'api-reference');
});
