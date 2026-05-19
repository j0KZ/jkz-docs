/**
 * Issue-log sanitizer: normalize stack-trace frame paths to basename and
 * strip auth-header values.
 *
 * Operations (in order — independent regions, ordering chosen for
 * determinism):
 *   1. Path-in-frame collapse. For lines of the form
 *      `... at <funcName> (/abs/path/to/file.ext:LINE:COL)` (or Windows
 *      `C:\\path\\to\\file.ext:LINE:COL`), keep `at <funcName> (` and
 *      `:LINE:COL)`, replacing the path with its basename. Frame ordering
 *      and function names survive byte-equal.
 *   2. Authorization header strip: `Authorization: <value>` →
 *      `Authorization: [redacted]`.
 *   3. X-API-Key header strip: `X-API-Key: <value>` →
 *      `X-API-Key: [redacted]`.
 *   4. Bearer token strip: `Bearer <token>` → `Bearer [redacted]`.
 *
 * Pure (no I/O). Throws `TypeError` on non-string input.
 */

// Capture group breakdown for FRAME_PATH_RE:
//   1: `at <funcDescriptor> (` prefix (preserved). `<funcDescriptor>` may
//      contain spaces or bracketed aliases, e.g. `Layer.handle [as
//      handle_request]`, so we use non-greedy `[^(\n]+?` instead of `\S+`.
//   2: the path (replaced with basename)
//   3: `:LINE:COL)` suffix (preserved)
const FRAME_PATH_RE =
  /(at\s+[^(\n]+?\s+\()(\/[^):]+|[A-Za-z]:\\[^):]+)(:\d+:\d+\))/g;

// Authorization header (case-insensitive, multiline). Captures the
// `Authorization:` prefix + whitespace so we can preserve it exactly.
const AUTHZ_HEADER_RE = /^(\s*Authorization:\s*).+$/gim;
const APIKEY_HEADER_RE = /^(\s*X-API-Key:\s*).+$/gim;

// Inline JSON-shaped X-API-Key (e.g. `"X-API-Key": "abc"`). The header
// pattern above is line-anchored, so a JSON object literal on a log line
// would slip through. Match the key/value pair and redact the value.
const APIKEY_JSON_RE = /(["']X-API-Key["']\s*:\s*)["'][^"']+["']/gi;

// Standalone Bearer token (not anchored to a header). Matches `Bearer ` +
// a non-whitespace token of length 1+.
const BEARER_RE = /\bBearer\s+\S+/g;

/**
 * @param {string} content
 * @returns {string}
 * @throws {TypeError} If `content` is not a string.
 */
export function sanitizeIssueLog(content) {
  if (typeof content !== 'string') {
    throw new TypeError('sanitizeIssueLog: content must be a string');
  }
  if (content.length === 0) return content;

  let out = content;

  // 1. Path-in-frame: collapse to basename.
  out = out.replace(FRAME_PATH_RE, (_match, prefix, p, suffix) => {
    // Path may use `/` (Unix) or `\` (Windows). Pick the last segment
    // after either separator.
    const sepIdx = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
    const basename = sepIdx === -1 ? p : p.slice(sepIdx + 1);
    return `${prefix}${basename}${suffix}`;
  });

  // 2. Authorization + X-API-Key (line-anchored header form).
  out = out.replace(AUTHZ_HEADER_RE, '$1[redacted]');
  out = out.replace(APIKEY_HEADER_RE, '$1[redacted]');

  // 3. JSON-shaped X-API-Key inside a log line. Run AFTER the line-anchored
  //    rules so we do not double-process.
  out = out.replace(APIKEY_JSON_RE, '$1"[redacted]"');

  // 4. Standalone Bearer token (covers headers that did not match the
  //    line-anchored Authorization rule, e.g. `> Authorization: Bearer X`
  //    after the line-anchored rule already redacted the full line value).
  //    Idempotent: `Bearer [redacted]` is also matched and replaced with
  //    itself.
  out = out.replace(BEARER_RE, 'Bearer [redacted]');

  return out;
}
