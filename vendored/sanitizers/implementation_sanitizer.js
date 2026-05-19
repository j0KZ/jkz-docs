/**
 * Redact function bodies longer than `BODY_LOC_THRESHOLD` lines while
 * preserving the signature and any `@example` JSDoc block (enclosing or
 * in-body).
 *
 * Algorithm: line-walk + brace-walker. Best-effort: strips same-line string
 * literals and trailing `//` comments only. Multi-line strings, block
 * comments containing braces, and template-literal interpolations are not
 * handled (M1 — failure mode is over-redaction).
 *
 * Decision tree (per function body):
 *   1. LOC <= threshold → untouched.
 *   2. In-body @example block(s) present → split-redact around each block:
 *      pre-block lines and post-block lines become `// [redacted: N LOC]`.
 *   3. Enclosing JSDoc has @example (no in-body) → single marker
 *      `// [redacted: N LOC, @example preserved at lines K1..K2]`.
 *   4. Otherwise → single marker `// [redacted: N LOC]`.
 *
 * Idempotency: re-running on the output produces the same string because
 * redaction markers do not match any signature regex.
 *
 * Pure (no I/O). Throws `TypeError` on non-string input, mirroring
 * `secret_sanitizer.js`.
 */

export const BODY_LOC_THRESHOLD = 20;
// Function-signature regexes. The `name` capture is for diagnostics only.
const SIG_FUNCTION_RE =
  /^(\s*)(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/;
const SIG_ARROW_RE =
  /^(\s*)(?:export\s+(?:default\s+)?)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?[(A-Za-z_$]/;
const SIG_METHOD_RE =
  /^(\s*)(?:(?:public|private|protected|static|async|get|set)\s+)*([A-Za-z_$][\w$]*)\s*\(/;
const SIG_PROP_FUNCTION_RE =
  /^(\s*)([A-Za-z_$][\w$]*)\s*:\s*(?:async\s+)?function\s*\*?\s*\(/;

// Keywords that the method-shorthand regex would otherwise match.
const METHOD_KEYWORD_BLOCKLIST = new Set([
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'try', 'catch',
  'finally', 'return', 'throw', 'with', 'new', 'typeof', 'in', 'of',
  'instanceof', 'void', 'delete', 'yield', 'await', 'function', 'class',
  'this', 'super', 'export', 'import', 'default',
]);

const EXAMPLE_TAG_RE = /^\s*\*?\s*@example\b/;
const JSDOC_OPEN_RE = /^\s*\/\*\*/;
const JSDOC_CLOSE_RE = /\*\//;
/** Strip same-line string literals and trailing `//` comments. */
function stripStringsAndLineComments(line) {
  let out = '';
  let i = 0;
  const n = line.length;
  while (i < n) {
    const c = line[i];
    if (c === '/' && line[i + 1] === '/') break;
    if (c === '"' || c === '\'' || c === '`') {
      const q = c;
      i++;
      while (i < n) {
        if (line[i] === '\\') { i += 2; continue; }
        if (line[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Find matching `}` for the `{` at (openIdx, openColumn). Returns line index or -1. */
function findClosingBrace(lines, openIdx, openColumn) {
  let depth = 0;
  const tail = stripStringsAndLineComments(lines[openIdx].slice(openColumn));
  for (const ch of tail) {
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return openIdx; }
  }
  for (let i = openIdx + 1; i < lines.length; i++) {
    const cleaned = stripStringsAndLineComments(lines[i]);
    for (const ch of cleaned) {
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) return i; }
    }
  }
  return -1;
}

/** Map a "cleaned-string" index back to the original column on `line`. */
function cleanedIdxToOriginal(line, cleanedIdx) {
  let j = 0, cleanedCount = 0;
  while (j < line.length) {
    const ch = line[j];
    if (ch === '/' && line[j + 1] === '/') break;
    if (ch === '"' || ch === '\'' || ch === '`') {
      const q = ch;
      j++;
      while (j < line.length) {
        if (line[j] === '\\') { j += 2; continue; }
        if (line[j] === q) { j++; break; }
        j++;
      }
      continue;
    }
    if (cleanedCount === cleanedIdx) return j;
    cleanedCount++;
    j++;
  }
  return -1;
}

/** Match a signature on `lines[idx]` and locate its body-opening `{`. */
function matchSignature(lines, idx) {
  const line = lines[idx];
  let kind = null;
  if (SIG_FUNCTION_RE.test(line)) kind = 'function';
  else if (SIG_PROP_FUNCTION_RE.test(line)) kind = 'prop_function';
  else if (SIG_ARROW_RE.test(line)) kind = 'arrow';
  else {
    const m = SIG_METHOD_RE.exec(line);
    if (m && !METHOD_KEYWORD_BLOCKLIST.has(m[2])) kind = 'method';
  }
  if (!kind) return null;

  // Walk paren depth across lines (handles multiline params). For arrow, `=>`
  // at depth 0 closes the signature; for non-arrow, a `;` before `{` rejects
  // the match (avoids `foo();` followed by a standalone block as false match).
  const maxAhead = 5;
  let depth = 0, closed = false, broken = false;
  for (let i = idx; i < lines.length && i <= idx + maxAhead; i++) {
    const cleaned = stripStringsAndLineComments(lines[i]);
    for (let j = 0; j < cleaned.length; j++) {
      const ch = cleaned[j];
      if (ch === '(') depth++;
      else if (ch === ')') { depth--; if (depth === 0) closed = true; }
      else if (kind === 'arrow' && ch === '=' && cleaned[j + 1] === '>' && depth === 0) closed = true;
      else if (ch === '{' && depth === 0 && closed && !broken) {
        let col = cleanedIdxToOriginal(lines[i], j);
        if (col === -1) col = lines[i].indexOf('{');
        return { openLineIdx: i, openColumn: col };
      } else if (closed && depth === 0 && ch === ';' && kind !== 'arrow') broken = true;
    }
  }
  return null;
}

/** Find the JSDoc immediately preceding `sigLineIdx` (only blanks between). */
function findEnclosingJsDoc(lines, sigLineIdx) {
  let i = sigLineIdx - 1;
  while (i >= 0 && lines[i].trim() === '') i--;
  if (i < 0 || !JSDOC_CLOSE_RE.test(lines[i])) return null;
  const end = i;
  let j = end;
  while (j >= 0 && !JSDOC_OPEN_RE.test(lines[j])) j--;
  if (j < 0) return null;
  const start = j;

  let exampleStart = -1, exampleEnd = -1;
  for (let k = start; k <= end; k++) {
    if (EXAMPLE_TAG_RE.test(lines[k])) {
      exampleStart = k;
      let e = k + 1;
      while (e <= end) {
        if (/^\*?\s*@[A-Za-z]/.test(lines[e].trim())) break;
        if (e === end) break;
        e++;
      }
      exampleEnd = e - 1;
      break;
    }
  }
  return { start, end, hasExample: exampleStart !== -1, exampleStart, exampleEnd };
}

/** Find every JSDoc block inside [bodyStart..bodyEnd] containing @example. */
function findInBodyExampleBlocks(lines, bodyStart, bodyEnd) {
  const out = [];
  let k = bodyStart;
  while (k <= bodyEnd) {
    if (JSDOC_OPEN_RE.test(lines[k])) {
      let m = k;
      while (m <= bodyEnd && !JSDOC_CLOSE_RE.test(lines[m])) m++;
      if (m > bodyEnd) break;
      let hasExample = false;
      for (let p = k; p <= m; p++) {
        if (EXAMPLE_TAG_RE.test(lines[p])) { hasExample = true; break; }
      }
      if (hasExample) out.push({ start: k, end: m });
      k = m + 1;
    } else {
      k++;
    }
  }
  return out;
}

/** Indentation prefix (leading spaces) for redaction markers. */
function bodyIndent(lines, openLineIdx, closeLineIdx) {
  for (let i = openLineIdx + 1; i < closeLineIdx; i++) {
    if (lines[i].trim() === '') continue;
    const m = /^(\s*)/.exec(lines[i]);
    return m ? m[1] : '  ';
  }
  return '  ';
}

/**
 * @param {string} content
 * @returns {string}
 * @throws {TypeError} If `content` is not a string.
 */
export function sanitizeImplementations(content) {
  if (typeof content !== 'string') {
    throw new TypeError('sanitizeImplementations: content must be a string');
  }
  if (content.length === 0) return content;

  const lines = content.split('\n');
  // Pre-scan: discover top-level function bodies (skip nested by jumping
  // past closing brace).
  const bodies = [];
  for (let i = 0; i < lines.length; i++) {
    const sig = matchSignature(lines, i);
    if (!sig) continue;
    const closeIdx = findClosingBrace(lines, sig.openLineIdx, sig.openColumn);
    if (closeIdx === -1) continue;
    bodies.push({ sigLineIdx: i, openLineIdx: sig.openLineIdx, closeLineIdx: closeIdx });
    i = closeIdx;
  }
  if (bodies.length === 0) return content;

  const edits = [];
  for (const body of bodies) {
    const loc = body.closeLineIdx - body.openLineIdx - 1;
    if (loc <= BODY_LOC_THRESHOLD) continue;

    const indent = bodyIndent(lines, body.openLineIdx, body.closeLineIdx);
    const jsdoc = findEnclosingJsDoc(lines, body.sigLineIdx);
    const inBody = findInBodyExampleBlocks(
      lines, body.openLineIdx + 1, body.closeLineIdx - 1,
    );

    if (inBody.length > 0) {
      const segments = [];
      let cursor = body.openLineIdx + 1;
      for (const region of inBody) {
        if (region.start > cursor) {
          segments.push({
            kind: 'redact',
            text: `${indent}// [redacted: ${region.start - cursor} LOC]`,
          });
        }
        segments.push({ kind: 'keep', start: region.start, end: region.end });
        cursor = region.end + 1;
      }
      if (cursor <= body.closeLineIdx - 1) {
        segments.push({
          kind: 'redact',
          text: `${indent}// [redacted: ${body.closeLineIdx - cursor} LOC]`,
        });
      }
      edits.push({ from: body.openLineIdx + 1, to: body.closeLineIdx - 1, segments });
    } else if (jsdoc && jsdoc.hasExample) {
      const k1 = jsdoc.exampleStart + 1;
      const k2 = jsdoc.exampleEnd + 1;
      edits.push({
        from: body.openLineIdx + 1,
        to: body.closeLineIdx - 1,
        single: `${indent}// [redacted: ${loc} LOC, @example preserved at lines ${k1}..${k2}]`,
      });
    } else {
      edits.push({
        from: body.openLineIdx + 1,
        to: body.closeLineIdx - 1,
        single: `${indent}// [redacted: ${loc} LOC]`,
      });
    }
  }
  if (edits.length === 0) return content;

  const out = [];
  let i = 0;
  for (const edit of edits) {
    while (i < edit.from) out.push(lines[i++]);
    if (edit.single !== undefined) {
      out.push(edit.single);
    } else {
      for (const seg of edit.segments) {
        if (seg.kind === 'redact') out.push(seg.text);
        else for (let k = seg.start; k <= seg.end; k++) out.push(lines[k]);
      }
    }
    i = edit.to + 1;
  }
  while (i < lines.length) out.push(lines[i++]);

  return out.join('\n');
}
