/**
 * Pure content scanner for the wiki-generator sanitizer pipeline.
 *
 * `scan(content, opts?)` returns `{ found, matches }`. Match objects come in
 * four shapes; raw secret values are NEVER placed on any of them.
 *
 *   - Normal hit:        `{ kind, index, length, fingerprint }`
 *   - Entropy hit:       `{ kind: 'high_entropy', index, length, fingerprint, entropy }`
 *                        where `entropy` is `round2(shannonEntropy(window))` — a
 *                        coarse statistic, not invertible to bytes.
 *   - Size-cap sentinel: `{ kind: 'input_too_large', byteLength }` (emitted once;
 *                        no other matches when this fires).
 *   - Cap sentinel:      `{ kind: 'max_matches_exceeded', limit }` (emitted at most
 *                        once after MAX_MATCHES is reached; all loops then abort).
 *
 * `fingerprint` is the first 12 hex chars of `sha256(raw)`.
 *
 * Pipeline (7 stages, in order):
 *   1. Type guard (`content` is a string; `opts` is a plain object or undefined).
 *   2. 1 MiB size cap (short-circuits with `kind: 'input_too_large'`).
 *   3. Provider iteration (6 catalogue entries).
 *   4. Host iteration (4 catalogue entries). The `ipv6_candidate` entry is
 *      the ONLY kind requiring post-regex validation: `node:net`'s `isIPv6()`
 *      is the truth source. Candidates that fail validation are dropped;
 *      validated candidates are pushed with `kind: 'ipv6'`. Host kinds may
 *      overlap byte ranges (e.g. `ipv4` and `url` on the same URL); downstream
 *      redactors must be range-idempotent.
 *   5. Entropy fallback (`shannonEntropy(window) >= 4.5`) with overlap
 *      suppression against existing provider/host hits.
 *   6. `MAX_MATCHES = 1000` sentinel (only `{ kind: 'max_matches_exceeded' }`
 *      after the cap, once, then break out of all scanning loops).
 *   7. Return `{ found, matches }`.
 *
 * `opts` is validated for shape (plain-object-or-undefined) but its keys are
 * currently ignored — reserved for future use (e.g., custom entropy
 * threshold, allowlist patterns). The type guard is forward-compat hardening,
 * not dead code: it prevents callers from silently passing the wrong shape
 * today and being surprised when behavior changes.
 *
 * Purity: no I/O, no `process.exit`, no `console`. `isIPv6` from `node:net`
 * is deterministic and side-effect-free (Node stdlib, stable since v0.4) so
 * calling it does not violate purity.
 */

import { createHash } from 'node:crypto';
import { isIPv6 } from 'node:net';
import { shannonEntropy } from './entropy.js';
import {
  PROVIDER_REGEXES,
  HOST_REGEXES,
  ENTROPY_WINDOW_RE,
  ENTROPY_MIN_SCORE,
} from './regexes.js';

export const EXIT_SECRET_DETECTED = 42;
export const INPUT_BYTE_CAP = 1_048_576; // 1 MiB
export const MAX_MATCHES = 1000;

function fingerprint(raw) {
  return createHash('sha256').update(raw, 'utf8').digest('hex').slice(0, 12);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Scan `content` for secret-shaped substrings.
 *
 * @param {string} content - The text to scan.
 * @param {object|undefined} [opts] - Reserved for future use; validated for
 *   shape but currently ignored.
 * @returns {{ found: boolean, matches: Array<object> }}
 * @throws {TypeError} If `content` is not a string, or `opts` is supplied and
 *   is not a plain object.
 */
export function scan(content, opts) {
  // 1. Type guard.
  if (typeof content !== 'string') {
    throw new TypeError('scan: content must be a string');
  }
  if (opts !== undefined && !isPlainObject(opts)) {
    throw new TypeError('scan: opts must be a plain object or undefined');
  }

  // 2. Size cap (short-circuit before any regex allocates).
  const byteLength = Buffer.byteLength(content, 'utf8');
  if (byteLength > INPUT_BYTE_CAP) {
    return {
      found: true,
      matches: [{ kind: 'input_too_large', byteLength }],
    };
  }

  const matches = [];
  let aborted = false;
  let sentinelPushed = false;

  /**
   * Append a hit. Returns `true` when the caller must abort scanning
   * (MAX_MATCHES reached). On the first overflow we push a single sentinel
   * record so consumers see the cap was hit.
   */
  function push(hit) {
    if (matches.length >= MAX_MATCHES) {
      if (!sentinelPushed) {
        matches.push({ kind: 'max_matches_exceeded', limit: MAX_MATCHES });
        sentinelPushed = true;
      }
      aborted = true;
      return true;
    }
    matches.push(hit);
    return false;
  }

  // 3. Provider iteration.
  for (const { kind, pattern } of PROVIDER_REGEXES) {
    if (aborted) break;
    for (const m of content.matchAll(pattern)) {
      const raw = m[0];
      if (
        push({
          kind,
          index: m.index,
          length: raw.length,
          fingerprint: fingerprint(raw),
        })
      ) {
        break;
      }
    }
  }

  // 4. Host iteration. IPv6 candidate-validation gate is the only kind-
  //    specific code path: regex emits candidates, `isIPv6()` is the truth
  //    source. Other kinds (ipv4, host, url) do not need post-validation.
  for (const { kind, pattern } of HOST_REGEXES) {
    if (aborted) break;
    for (const m of content.matchAll(pattern)) {
      const raw = m[0];
      let finalKind = kind;
      if (kind === 'ipv6_candidate') {
        // IPv6: regex is permissive; isIPv6() is the truth source.
        // Bare "::" is a valid IPv6 (unspecified address) per isIPv6, but it
        // is not a host worth redacting — drop it explicitly.
        if (!raw.includes(':')) continue;
        if (raw === '::') continue;
        if (!isIPv6(raw)) continue;
        finalKind = 'ipv6';
      }
      if (
        push({
          kind: finalKind,
          index: m.index,
          length: raw.length,
          fingerprint: fingerprint(raw),
        })
      ) {
        break;
      }
    }
  }

  // 5. Entropy fallback with overlap suppression. Sort existing hits by
  //    index once so the overlap test is a single linear pointer walk.
  if (!aborted) {
    const existing = matches
      .filter(
        (h) =>
          h.kind !== 'input_too_large' &&
          h.kind !== 'max_matches_exceeded' &&
          typeof h.index === 'number' &&
          typeof h.length === 'number',
      )
      .map((h) => ({ start: h.index, end: h.index + h.length }))
      .sort((a, b) => a.start - b.start);

    let cursor = 0;
    for (const m of content.matchAll(ENTROPY_WINDOW_RE)) {
      if (aborted) break;
      const raw = m[0];
      const wStart = m.index;
      const wEnd = wStart + raw.length;

      // Advance cursor past intervals that end before this window starts.
      while (cursor < existing.length && existing[cursor].end <= wStart) {
        cursor++;
      }
      // Overlap if the interval at `cursor` starts before this window ends.
      const overlaps = cursor < existing.length && existing[cursor].start < wEnd;
      if (overlaps) continue;

      const score = shannonEntropy(raw);
      if (score < ENTROPY_MIN_SCORE) continue;

      if (
        push({
          kind: 'high_entropy',
          index: wStart,
          length: raw.length,
          fingerprint: fingerprint(raw),
          entropy: round2(score),
        })
      ) {
        break;
      }
    }
  }

  // 7. Return.
  return { found: matches.length > 0, matches };
}
