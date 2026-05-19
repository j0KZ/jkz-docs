/**
 * Composer for the wiki-generator sanitizer pipeline.
 *
 * `composeAll(content, opts?)` runs five stages in canonical order:
 *
 *   STAGE_ORDER = ['path_blocklist', 'secret', 'implementation', 'pii', 'issue_log']
 *
 * Branches:
 *   - `opts.path` provided AND `isPathBlocked(opts.path)` → short-circuit.
 *     Return `{content: '', report}` where `report.stages[0]` is
 *     `{name:'path_blocklist', blocked:true, mutated:true}` and
 *     `stages[1..4]` each `{name:..., skipped:true, mutated:false}`. (M2)
 *   - `opts.path` absent → `stages[0]` is
 *     `{name:'path_blocklist', skipped:true, mutated:false, reason:'no_path'}`
 *     and downstream stages execute normally. (M2)
 *   - Path supplied but not blocked → `stages[0]` records the check; the
 *     four content sanitizers run.
 *
 * Secret detection is record-only: `composeAll` NEVER throws on
 * `scan().found === true`. The orchestrator owns the abort policy via
 * `secret_sanitizer.EXIT_SECRET_DETECTED`. (Locked decision from iter 1
 * Auditor review.)
 *
 * `report.stages` is always a 5-entry array. Order matches `STAGE_ORDER`.
 * Each entry carries `{name, mutated}` plus stage-specific fields:
 *   - path_blocklist: `{blocked?:bool, skipped?:bool, reason?:string}`
 *   - secret: `{found:bool, matchCount:number}` (mutated is always false —
 *     scan is a detector, never modifies content)
 *   - implementation, pii, issue_log: `{mutated: bool}`
 *
 * Pure (no I/O). Throws `TypeError` on invalid input.
 */

import { isPathBlocked } from './path_blocklist.js';
import { scan } from './secret_sanitizer.js';
import { sanitizeImplementations } from './implementation_sanitizer.js';
import { sanitizePII } from './pii_sanitizer.js';
import { sanitizeIssueLog } from './issue_log_sanitizer.js';

export const STAGE_ORDER = Object.freeze([
  'path_blocklist',
  'secret',
  'implementation',
  'pii',
  'issue_log',
]);

// True only for `{}`-style objects: rejects arrays, Date, Map, Set, and class
// instances. The public `composeAll` API documents `opts` as a plain object, so
// passing anything else is a programmer error and must throw.
function isPlainObject(v) {
  if (v === null || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

/** Build a uniform 5-entry skipped-report for the blocked-path branch. */
function buildBlockedReport() {
  return {
    stages: [
      { name: 'path_blocklist', blocked: true, mutated: true },
      { name: 'secret', skipped: true, mutated: false },
      { name: 'implementation', skipped: true, mutated: false },
      { name: 'pii', skipped: true, mutated: false },
      { name: 'issue_log', skipped: true, mutated: false },
    ],
  };
}

/**
 * Run all sanitizers in canonical order on `content`.
 *
 * @param {string} content - The text to sanitize.
 * @param {{path?: string}} [opts] - Optional. `opts.path` is the absolute
 *   filesystem path the content was read from; when supplied it gates the
 *   pipeline via `isPathBlocked`.
 * @returns {{content: string, report: {stages: Array<object>}}} The
 *   sanitized content and a uniform 5-entry stage report.
 * @throws {TypeError} If `content` is not a string, `opts` is supplied and
 *   is not a plain object, or `opts.path` is supplied and is not a
 *   non-empty string.
 */
export function composeAll(content, opts) {
  // 1. Type guards.
  if (typeof content !== 'string') {
    throw new TypeError('composeAll: content must be a string');
  }
  if (opts !== undefined && !isPlainObject(opts)) {
    throw new TypeError('composeAll: opts must be a plain object or undefined');
  }
  if (opts !== undefined && opts.path !== undefined) {
    if (typeof opts.path !== 'string' || opts.path.length === 0) {
      throw new TypeError('composeAll: opts.path must be a non-empty string');
    }
  }

  const pathProvided = opts !== undefined && opts.path !== undefined;

  // 2. Path-blocklist gate.
  if (pathProvided) {
    if (isPathBlocked(opts.path)) {
      // Short-circuit: empty content, uniform 5-stage skipped report.
      return { content: '', report: buildBlockedReport() };
    }
  }

  // 3. Build the report scaffold (will be populated as stages run).
  const stages = [];
  if (pathProvided) {
    stages.push({
      name: 'path_blocklist',
      blocked: false,
      mutated: false,
    });
  } else {
    stages.push({
      name: 'path_blocklist',
      skipped: true,
      mutated: false,
      reason: 'no_path',
    });
  }

  // 4. Secret detector. Record-only; never throws on `found`.
  const secretResult = scan(content);
  stages.push({
    name: 'secret',
    mutated: false,
    found: secretResult.found,
    matchCount: secretResult.matches.length,
  });

  // 5. Implementation sanitizer.
  let current = content;
  const afterImpl = sanitizeImplementations(current);
  stages.push({
    name: 'implementation',
    mutated: afterImpl !== current,
  });
  current = afterImpl;

  // 6. PII sanitizer.
  const afterPii = sanitizePII(current);
  stages.push({
    name: 'pii',
    mutated: afterPii !== current,
  });
  current = afterPii;

  // 7. Issue-log sanitizer.
  const afterIssueLog = sanitizeIssueLog(current);
  stages.push({
    name: 'issue_log',
    mutated: afterIssueLog !== current,
  });
  current = afterIssueLog;

  return { content: current, report: { stages } };
}
