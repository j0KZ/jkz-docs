// llms-txt.mjs -- jkz-docs build-time integration that emits `/llms.txt` and
// `/llms-full.txt` at the site root, per https://llmstxt.org (#1612).
//
// Why this lives here (and not in the wiki-generator):
//   The source-repo wiki-generator only ever sees the cleaned, generated-only
//   subtree -- its orchestrator deletes every non-produced `.md` before the
//   aggregators run, so the auto-generated llms.txt could only ever index the
//   ~14 api-reference + reference stubs and never the ~110-page narrative layer
//   (get-started, concepts, build, commands, agents, subsystems, operations).
//   By contrast jkz-docs holds the FULL merged tree under `./wiki` (narrative +
//   generated), so a build-time walk here indexes every published page.
//
// Behaviour:
//   - Walks the configured content directory (`./wiki`) for every `.md` file.
//   - Maps each file to its canonical Starlight URL (trailing-slash, matching
//     the live site routing): `index.md` -> `/`, `<dir>/index.md` -> `/<dir>/`,
//     `<path>.md` -> `/<path>/`.
//   - Groups pages by their top-level section and emits them narrative-first
//     with `api-reference` last (see SECTION_ORDER).
//   - `llms.txt`: H1 (site title) + blockquote (site summary) + one `##`
//     section per group, each a bullet list of `[Title](url): description`.
//   - `llms-full.txt`: the same header, then every page concatenated as a `##`
//     block (title + source URL + body, frontmatter stripped and headings
//     demoted one level so the document keeps a single H1 root).
//   - Dedupes by canonical URL (keep-first) and logs the dropped count.
//
// Title resolution order: frontmatter `title:` -> first body `# H1` -> a
// humanized filename. Description: frontmatter `description:` (optional).
//
// Zero runtime dependencies: only `node:fs` / `node:path`. The pure builders
// (`buildLlmsTxt` / `buildLlmsFullTxt`) are exported for the test suite; the
// default export is the Astro integration that wires them to `astro:build:done`.

import fs from 'node:fs';
import path from 'node:path';

/**
 * Section dispatch order for the index and the full concatenation. Narrative
 * sections first (mirrors the sidebar IA in astro.config.mjs); `api-reference`
 * -- the mechanical, auto-generated module dump -- always renders LAST so the
 * human-authored prose leads. A section dir not listed here is appended after
 * these, alphabetically, BEFORE api-reference is forced to the very end.
 */
export const SECTION_ORDER = [
  'get-started',
  'concepts',
  'build',
  'commands',
  'agents',
  'subsystems',
  'operations',
  'reference',
  'api-reference',
];

/** Human-readable labels for known sections; unknown sections are humanized. */
const SECTION_LABELS = {
  'get-started': 'Get started',
  concepts: 'Concepts',
  build: 'Build',
  commands: 'Commands',
  agents: 'Agents',
  subsystems: 'Subsystems',
  operations: 'Operations',
  reference: 'Reference',
  'api-reference': 'API reference',
};

const DEFAULT_TITLE = 'jkz docs';
const DEFAULT_SUMMARY =
  'Human-in-the-loop multi-agent engineering — three phases, twelve roles, you as the final arbiter.';

/**
 * Parse a leading YAML frontmatter block. Permissive scalar reader -- handles
 * `key: value`, single/double quoted values, and ignores nested/sequence keys.
 * Returns `{ data, body }` where `body` is the content after the block (or the
 * whole input when no frontmatter is present).
 *
 * @param {string} text
 * @returns {{ data: Record<string, string>, body: string }}
 */
export function parseFrontmatter(text) {
  // Tolerate CRLF endings: normalize before matching so files authored on
  // Windows still yield their frontmatter (otherwise the `\n`-anchored regex
  // misses and title/description silently fall back to H1/filename).
  const normalized = text.replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(normalized);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const rawLine of m[1].split('\n')) {
    // Only top-level `key: value` scalars; skip indented (nested/sequence)
    // lines and comments.
    const lm = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(rawLine);
    if (!lm) continue;
    let v = lm[2].trim();
    if (v === '' || v === '|' || v === '>') continue; // block scalar / empty
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    data[lm[1]] = v;
  }
  return { data, body: normalized.slice(m[0].length) };
}

/**
 * Humanize a filename stem into a title: `run-a-pipeline` -> `Run a pipeline`.
 *
 * @param {string} stem
 * @returns {string}
 */
function humanizeStem(stem) {
  const words = stem.replace(/[-_]+/g, ' ').trim();
  if (!words) return stem;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Resolve a page title: frontmatter `title` -> first body `# H1` -> humanized
 * filename stem.
 *
 * @param {Record<string, string>} data - parsed frontmatter
 * @param {string} body - content after frontmatter
 * @param {string} relPath - wiki-relative path (POSIX)
 * @returns {string}
 */
export function resolveTitle(data, body, relPath) {
  if (data.title) return data.title;
  const h1 = /^#[ \t]+(.+?)[ \t]*$/m.exec(body);
  if (h1) return h1[1].trim();
  const stem = path.basename(relPath, '.md');
  return humanizeStem(stem === 'index' ? path.basename(path.dirname(relPath)) || 'Home' : stem);
}

/**
 * Map a wiki-relative `.md` path to its canonical Starlight URL path
 * (trailing-slash). `index.md` -> `/`, `<dir>/index.md` -> `/<dir>/`,
 * `<path>.md` -> `/<path>/`.
 *
 * @param {string} relPath - POSIX path relative to the wiki dir
 * @returns {string}
 */
export function urlPathFromRel(relPath) {
  let slug = relPath.replace(/\.md$/, '');
  if (slug === 'index') return '/';
  if (slug.endsWith('/index')) slug = slug.slice(0, -'/index'.length);
  // Encode each path segment so filenames with reserved characters (spaces,
  // `#`, `%`, ...) produce valid URLs; `/` separators are preserved.
  const encoded = slug.split('/').map(encodeURIComponent).join('/');
  return `/${encoded}/`;
}

/** Top-level section for a wiki-relative path; '' for root-level files. */
function sectionOf(relPath) {
  const idx = relPath.indexOf('/');
  return idx === -1 ? '' : relPath.slice(0, idx);
}

/**
 * Recursively collect every `.md` file under `wikiDir`, returned as
 * wiki-relative POSIX paths, sorted for deterministic output.
 *
 * @param {string} wikiDir - absolute path to the content root
 * @returns {string[]}
 */
export function collectMarkdown(wikiDir) {
  const out = [];
  const walk = (absDir, relDir) => {
    if (!fs.existsSync(absDir)) return;
    const entries = fs.readdirSync(absDir, { withFileTypes: true });
    for (const entry of entries) {
      const childAbs = path.join(absDir, entry.name);
      const childRel = relDir ? `${relDir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(childAbs, childRel);
      else if (entry.isFile() && entry.name.endsWith('.md')) out.push(childRel);
    }
  };
  walk(wikiDir, '');
  out.sort();
  return out;
}

/**
 * Read + parse every collected page into a page record, ordered by section
 * (SECTION_ORDER, api-reference last) then by path within a section. Dedupes
 * by canonical URL (keep-first); the dropped count is returned for logging.
 *
 * @param {string} wikiDir - absolute content root
 * @param {string} site - site origin, e.g. `https://docs.j0kz.dev`
 * @returns {{ pages: Array<{relPath:string,url:string,absUrl:string,title:string,description:string,section:string,body:string}>, droppedCount: number, droppedUrls: string[] }}
 */
export function loadPages(wikiDir, site) {
  const origin = site.replace(/\/$/, '');
  const rel = collectMarkdown(wikiDir);

  const sectionRank = (s) => {
    const i = SECTION_ORDER.indexOf(s);
    // Unknown sections sort after the known narrative list but before the
    // forced-last api-reference; '' (root) sorts first.
    if (s === '') return -1;
    if (i !== -1) return i;
    return SECTION_ORDER.length - 1.5; // between 'reference' and 'api-reference'
  };

  const records = rel.map((relPath) => {
    const text = fs.readFileSync(path.join(wikiDir, relPath), 'utf8');
    const { data, body } = parseFrontmatter(text);
    const section = sectionOf(relPath);
    const url = urlPathFromRel(relPath);
    return {
      relPath,
      url,
      absUrl: `${origin}${url}`,
      title: resolveTitle(data, body, relPath),
      description: data.description || '',
      section,
      body: body.trim(),
    };
  });

  records.sort((a, b) => {
    const ra = sectionRank(a.section);
    const rb = sectionRank(b.section);
    if (ra !== rb) return ra - rb;
    // index.md leads its section; then alphabetical by path.
    const ai = a.relPath.endsWith('/index.md') || a.relPath === 'index.md' ? 0 : 1;
    const bi = b.relPath.endsWith('/index.md') || b.relPath === 'index.md' ? 0 : 1;
    if (ai !== bi) return ai - bi;
    return a.relPath < b.relPath ? -1 : a.relPath > b.relPath ? 1 : 0;
  });

  const seen = new Set();
  const pages = [];
  const droppedUrls = [];
  for (const rec of records) {
    if (seen.has(rec.url)) {
      droppedUrls.push(rec.url);
      continue;
    }
    seen.add(rec.url);
    pages.push(rec);
  }
  return { pages, droppedCount: droppedUrls.length, droppedUrls };
}

/** Display label for a section key. */
function sectionLabel(section) {
  return SECTION_LABELS[section] || humanizeStem(section);
}

/**
 * Demote every ATX heading in a markdown body by one level (`#`->`##`, capped
 * at H6) so an embedded page nests cleanly under a `##` page heading without
 * introducing a second document H1. Code fences are preserved verbatim.
 *
 * @param {string} body
 * @returns {string}
 */
export function demoteHeadings(body) {
  const lines = body.split('\n');
  let inFence = false;
  let fence = '';
  return lines
    .map((line) => {
      const fenceMatch = /^(\s*)(`{3,}|~{3,})/.exec(line);
      if (fenceMatch) {
        const marker = fenceMatch[2][0];
        if (!inFence) {
          inFence = true;
          fence = marker;
        } else if (marker === fence) {
          inFence = false;
          fence = '';
        }
        return line;
      }
      if (inFence) return line;
      const h = /^(#{1,6})([ \t].*)$/.exec(line);
      if (!h) return line;
      const level = Math.min(h[1].length + 1, 6);
      return '#'.repeat(level) + h[2];
    })
    .join('\n');
}

/**
 * Build the `llms.txt` index body (string). Pure -- no I/O.
 *
 * @param {{ pages: Array<object>, title: string, summary: string }} args
 * @returns {string}
 */
export function buildLlmsTxt({ pages, title, summary }) {
  const out = [`# ${title}`, '', `> ${summary}`, ''];
  // Group in the already-sorted page order.
  const bySection = new Map();
  for (const p of pages) {
    // The root index.md is the site home; it is described by the blockquote
    // above, so it is not re-listed as a link item.
    if (p.relPath === 'index.md') continue;
    if (!bySection.has(p.section)) bySection.set(p.section, []);
    bySection.get(p.section).push(p);
  }
  for (const [section, items] of bySection) {
    out.push(`## ${sectionLabel(section)}`, '');
    for (const p of items) {
      const desc = p.description ? `: ${p.description}` : '';
      out.push(`- [${p.title}](${p.absUrl})${desc}`);
    }
    out.push('');
  }
  return out.join('\n').replace(/\n+$/, '\n');
}

/**
 * Build the `llms-full.txt` concatenation body (string). Pure -- no I/O.
 *
 * @param {{ pages: Array<object>, title: string, summary: string }} args
 * @returns {string}
 */
export function buildLlmsFullTxt({ pages, title, summary }) {
  const out = [`# ${title}`, '', `> ${summary}`, ''];
  for (const p of pages) {
    out.push(`## ${p.title}`, '', `Source: ${p.absUrl}`, '');
    const body = demoteHeadings(p.body).trim();
    if (body) out.push(body, '');
  }
  return out.join('\n').replace(/\n+$/, '\n');
}

/**
 * Resolve the site title + summary from the root `index.md` frontmatter,
 * falling back to the jkz defaults when absent.
 *
 * @param {string} wikiDir
 * @returns {{ title: string, summary: string }}
 */
function resolveSiteMeta(wikiDir) {
  const indexAbs = path.join(wikiDir, 'index.md');
  if (!fs.existsSync(indexAbs)) return { title: DEFAULT_TITLE, summary: DEFAULT_SUMMARY };
  const { data } = parseFrontmatter(fs.readFileSync(indexAbs, 'utf8'));
  return {
    title: data.title || DEFAULT_TITLE,
    summary: data.description || DEFAULT_SUMMARY,
  };
}

/**
 * Astro integration. Emits `llms.txt` and `llms-full.txt` into the build output
 * directory (served at the site root) on `astro:build:done`.
 *
 * @param {{ wikiDir?: string }} [options] - `wikiDir` overrides the content
 *   root (default `./wiki`, resolved against the Astro root).
 * @returns {import('astro').AstroIntegration}
 */
export default function llmsTxt(options = {}) {
  return {
    name: 'jkz-llms-txt',
    hooks: {
      'astro:build:done': async ({ dir, logger, config }) => {
        const root = config?.root ? new URL('.', config.root).pathname : process.cwd();
        const wikiDir = path.resolve(root, options.wikiDir || './wiki');
        const site = config?.site ? String(config.site) : 'https://docs.j0kz.dev';

        const { pages, droppedCount, droppedUrls } = loadPages(wikiDir, site);
        if (pages.length === 0) {
          logger.warn(`no markdown pages found under ${wikiDir} — skipping llms.txt`);
          return;
        }
        const { title, summary } = resolveSiteMeta(wikiDir);

        const llmsTxtBody = buildLlmsTxt({ pages, title, summary });
        const llmsFullBody = buildLlmsFullTxt({ pages, title, summary });

        const outDir = new URL('.', dir).pathname;
        fs.writeFileSync(path.join(outDir, 'llms.txt'), llmsTxtBody);
        fs.writeFileSync(path.join(outDir, 'llms-full.txt'), llmsFullBody);

        logger.info(
          `wrote llms.txt (${pages.length} pages) and llms-full.txt (${Buffer.byteLength(llmsFullBody, 'utf8')} bytes)`,
        );
        if (droppedCount > 0) {
          logger.warn(
            `dropped ${droppedCount} duplicate-URL page(s): ${droppedUrls.join(', ')}`,
          );
        }
      },
    },
  };
}
