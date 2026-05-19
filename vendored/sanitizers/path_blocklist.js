import path from 'node:path';
import fs from 'node:fs';

const BLOCKED_SEGMENTS = new Set(['.claude', 'state', 'secrets']);
const BASENAME_DOTENV_RE = /^\.env($|[^/\\]*$)/;
const BASENAME_LOCAL_RE = /^.+\.local(\.[^.]+)+$/;

function matchesPatterns(absResolved) {
  // A1: split via path.sep (current platform), not a regex over both separators.
  const segments = absResolved.split(path.sep).filter(Boolean);
  for (const seg of segments) {
    if (BLOCKED_SEGMENTS.has(seg)) return true;
  }
  const base = segments[segments.length - 1] ?? '';
  if (BASENAME_DOTENV_RE.test(base)) return true;
  if (BASENAME_LOCAL_RE.test(base)) return true;
  return false;
}

/**
 * Stateless predicate: does the given absolute path point at content that the
 * wiki-generator must refuse to read? Fail-closed: ambiguous filesystem errors
 * (EACCES, ELOOP, etc.) resolve to `true`. ENOENT is the one safe miss because
 * the on-disk pattern check already ran against the resolved input.
 *
 * @param {string} absPath - Absolute (or normalizable-to-absolute) filesystem path.
 * @returns {boolean} `true` if the path is blocked, `false` otherwise.
 * @throws {TypeError} If `absPath` is not a non-empty string.
 */
export function isPathBlocked(absPath) {
  if (typeof absPath !== 'string' || absPath.length === 0) {
    throw new TypeError('isPathBlocked: absPath must be a non-empty string');
  }
  const resolved = path.resolve(absPath);
  if (!path.isAbsolute(resolved)) return true; // fail-closed
  if (matchesPatterns(resolved)) return true;
  let real;
  try {
    real = fs.realpathSync(resolved);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // safe to return false: matchesPatterns(resolved) already ran at step 1
      return false;
    }
    return true; // fail-closed on EACCES / ELOOP / other
  }
  return matchesPatterns(real);
}
