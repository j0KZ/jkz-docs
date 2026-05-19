/**
 * Personally-identifiable-information (PII) sanitizer for the wiki-generator
 * pipeline.
 *
 * Redacts three classes of PII to deterministic placeholders:
 *   - email addresses (TLD-validated) → `[redacted:email]`
 *   - absolute paths containing a username segment (`/home/<user>/...`,
 *     `/Users/<user>/...`) → the prefix through the username is replaced
 *     with `[redacted:abs-path]`
 *   - private IPv4 addresses (10.0.0.0/8, 172.16-31.0.0/12, 192.168.0.0/16)
 *     → `[redacted:private-ip]`
 *
 * `PII_ALLOWLIST` is the exact spec set of values that survive untouched:
 * `example.com` (as an email domain), `localhost`, and `127.0.0.1`. The
 * allowlist is intentionally narrow; widening it requires a spec change.
 *
 * Failure mode is over-redaction: a code block containing an email-shaped
 * string still gets the marker. Acceptable for a defense-in-depth gate.
 *
 * Pure (no I/O). Throws `TypeError` on non-string input.
 */

export const PII_ALLOWLIST = new Set(['example.com', 'localhost', '127.0.0.1']);

// Email: localpart@domain.tld where tld is 2..24 ASCII letters. Domain may
// contain dots, digits, and hyphens. Word-boundary on both sides.
const EMAIL_RE =
  /\b[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,24}\b/g;

// Abs-path-with-username (Unix). Captures `/home/<user>` or `/Users/<user>`
// as a single chunk; the trailing `(?=\/|$)` is enforced via the
// `[A-Za-z0-9._-]+` greedy match terminating at `/` or end-of-line.
const ABS_PATH_UNIX_RE =
  /(?<![A-Za-z0-9._-])\/(?:home|Users)\/[A-Za-z0-9._-]+(?=\/|$|\s)/g;

// Abs-path-with-username (Windows). `C:\Users\<user>` style. Case-insensitive
// because Windows itself treats drive letters and directory names that way.
const ABS_PATH_WIN_RE =
  /(?<![A-Za-z0-9._-])[A-Za-z]:\\Users\\[A-Za-z0-9._-]+(?=[\\/]|$|\s)/gi;

// Private IPv4 ranges, anchored to word boundaries.
//   10.0.0.0/8        : 10.x.x.x
//   172.16.0.0/12     : 172.16.x.x .. 172.31.x.x
//   192.168.0.0/16    : 192.168.x.x
const PRIVATE_IPV4_RE =
  /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g;

/** Lowercase the host portion of an email match for allowlist comparison. */
function emailDomain(match) {
  const at = match.lastIndexOf('@');
  return match.slice(at + 1).toLowerCase();
}

/**
 * @param {string} content
 * @returns {string}
 * @throws {TypeError} If `content` is not a string.
 */
export function sanitizePII(content) {
  if (typeof content !== 'string') {
    throw new TypeError('sanitizePII: content must be a string');
  }
  if (content.length === 0) return content;

  let out = content;

  // 1. Emails. Allowlist check on the domain.
  out = out.replace(EMAIL_RE, (m) => {
    if (PII_ALLOWLIST.has(emailDomain(m))) return m;
    return '[redacted:email]';
  });

  // 2. Abs paths with username (Unix + Windows). Allowlist does not apply
  //    (paths are not in the spec allowlist set).
  out = out.replace(ABS_PATH_UNIX_RE, '[redacted:abs-path]');
  out = out.replace(ABS_PATH_WIN_RE, '[redacted:abs-path]');

  // 3. Private IPv4. The 127.0.0.1 loopback is not in any private range
  //    (it's 127.0.0.0/8, not 10/172/192.168). It survives by virtue of
  //    not matching the regex. The allowlist check is a belt-and-braces
  //    guard in case the regex is widened later.
  out = out.replace(PRIVATE_IPV4_RE, (m) => {
    if (PII_ALLOWLIST.has(m)) return m;
    return '[redacted:private-ip]';
  });

  return out;
}
