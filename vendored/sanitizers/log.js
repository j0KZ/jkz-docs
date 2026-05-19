/**
 * Structured secret-hit logger. The signature physically excludes raw secret
 * values: the only accepted keys are `path`, `kind`, and `fingerprint`, and
 * `fingerprint` is constrained to 12 lowercase hex characters (the caller
 * must SHA-256-hash the raw value first and truncate). Any other key on the
 * options object throws `TypeError` at the entry boundary.
 *
 * Output is a single line of JSON terminated by `\n`, written directly to
 * `process.stderr` (not `console.error`, which may format objects).
 */

const ALLOWED_KEYS = new Set(['path', 'kind', 'fingerprint']);
const FINGERPRINT_RE = /^[0-9a-f]{12}$/;

/**
 * Emit a structured `secret_hit` record to stderr.
 *
 * @param {{path: string, kind: string, fingerprint: string}} opts
 * @throws {TypeError} If `opts` is not a plain object, if any key is not in
 *   `{path, kind, fingerprint}`, or if any value fails its type/shape check.
 */
export function logSecretHit(opts) {
  if (opts === null || typeof opts !== 'object' || Array.isArray(opts)) {
    throw new TypeError('logSecretHit: opts must be a plain object');
  }
  for (const key of Object.keys(opts)) {
    if (!ALLOWED_KEYS.has(key)) {
      throw new TypeError(`logSecretHit: unexpected key "${key}"`);
    }
  }
  const { path, kind, fingerprint } = opts;
  if (typeof path !== 'string' || path.length === 0) {
    throw new TypeError('logSecretHit: path must be a non-empty string');
  }
  if (typeof kind !== 'string' || kind.length === 0) {
    throw new TypeError('logSecretHit: kind must be a non-empty string');
  }
  if (typeof fingerprint !== 'string' || !FINGERPRINT_RE.test(fingerprint)) {
    throw new TypeError('logSecretHit: fingerprint must be 12 lowercase hex chars');
  }
  const record = {
    ts: new Date().toISOString(),
    event: 'secret_hit',
    path,
    kind,
    fingerprint,
  };
  process.stderr.write(JSON.stringify(record) + '\n');
}
