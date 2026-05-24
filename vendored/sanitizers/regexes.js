/**
 * Frozen catalogue of secret-shape regexes used by `secret_sanitizer.js`.
 *
 * Every regex must satisfy the following invariants (enforced by code review;
 * a `ReDoS` budget test in the suite enforces them at runtime against the
 * union of all regexes):
 *
 *   - Bounded quantifiers only (`{n,m}`); never `.*`, never unbounded `+`/`*`.
 *   - Explicit lookbehind+lookahead boundaries -- no character-class boundary
 *     repetition that could backtrack.
 *   - No nested quantifiers.
 *
 * IPv6 is the one exception to the "regex is final" rule. JS regex does not
 * support variable-length lookbehind, so no fixed-width anchor can distinguish
 * `2001:db8::a3:42` (valid, byte before `::` is hex `8`) from
 * `deadbeef::a3:42morehex` (invalid, byte before `::` is also hex `f`). The
 * IPv6 catalogue entry is therefore a **permissive candidate detector**: it
 * emits substrings that *might* be IPv6, and `secret_sanitizer.js` delegates
 * the truth question to `node:net`'s `isIPv6()`. See ADR-2 in the iter 3 plan.
 */

// --- Provider regexes (6) ------------------------------------------------

const ANTHROPIC_RE = /(?<![A-Za-z0-9_-])sk-ant-[A-Za-z0-9_-]{20,200}(?![A-Za-z0-9_-])/g;
const OPENAI_RE = /(?<![A-Za-z0-9_-])sk-proj-[A-Za-z0-9_-]{20,200}(?![A-Za-z0-9_-])/g;
const GITHUB_CLASSIC_RE = /(?<![A-Za-z0-9_])ghp_[A-Za-z0-9]{36}(?![A-Za-z0-9_])/g;
const GITHUB_FINE_GRAINED_RE = /(?<![A-Za-z0-9_])github_pat_[A-Za-z0-9_]{82}(?![A-Za-z0-9_])/g;
const AWS_ACCESS_KEY_RE = /(?<![A-Z0-9])AKIA[0-9A-Z]{16}(?![0-9A-Z])/g;
const TELEGRAM_BOT_TOKEN_RE = /(?<![A-Za-z0-9_-])\d{8,12}:[A-Za-z0-9_-]{30,40}(?![A-Za-z0-9_-])/g;

export const PROVIDER_REGEXES = Object.freeze([
  Object.freeze({ kind: 'anthropic_api_key', pattern: ANTHROPIC_RE }),
  Object.freeze({ kind: 'openai_api_key', pattern: OPENAI_RE }),
  Object.freeze({ kind: 'github_classic_pat', pattern: GITHUB_CLASSIC_RE }),
  Object.freeze({ kind: 'github_fine_grained_pat', pattern: GITHUB_FINE_GRAINED_RE }),
  Object.freeze({ kind: 'aws_access_key_id', pattern: AWS_ACCESS_KEY_RE }),
  Object.freeze({ kind: 'telegram_bot_token', pattern: TELEGRAM_BOT_TOKEN_RE }),
]);

// --- Host regexes (4) ---------------------------------------------------

const IPV4_RE =
  /(?<![0-9.])(?:(?:25[0-5]|2[0-4][0-9]|1?[0-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1?[0-9]?[0-9])(?![0-9.])/g;

// IPv6: permissive candidate detector. Final validity delegated to
// `node:net`'s `isIPv6()` in `secret_sanitizer.js`. The internal kind label
// `ipv6_candidate` is renamed to `ipv6` only after that validation passes.
//
// Length bounds:
//   - Lower: 2 chars (allows `::` alone -- caller's gate drops non-colon-bearing matches)
//   - Upper: 39 chars (max uncompressed IPv6 = `ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff`)
const IPV6_CANDIDATE_RE = /(?<![0-9A-Fa-f:])[0-9A-Fa-f:]{2,39}(?![0-9A-Fa-f:])/g;

const URL_RE =
  /(?<![A-Za-z0-9])(?:https?|ftp|smtp):\/\/[A-Za-z0-9.-]{3,253}(?::[0-9]{1,5})?(?:\/[A-Za-z0-9._~\/-]{0,200})?/g;

const HOST_FQDN_RE =
  /(?<![A-Za-z0-9.-])(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,62}[A-Za-z0-9])?\.){2,5}(?:internal|corp|local|lan|intranet|acme|prod|dev|staging|qa)(?:\.[A-Za-z]{2,24})?(?:[:][0-9]{1,5})?(?![A-Za-z0-9.-])/g;

export const HOST_REGEXES = Object.freeze([
  Object.freeze({ kind: 'ipv4', pattern: IPV4_RE }),
  Object.freeze({ kind: 'ipv6_candidate', pattern: IPV6_CANDIDATE_RE }),
  Object.freeze({ kind: 'url', pattern: URL_RE }),
  Object.freeze({ kind: 'host', pattern: HOST_FQDN_RE }),
]);

// --- Public-host allowlist (CI-gate exemption) ---
// Hosts considered safe to cite inline in public documentation. A url/host
// match whose hostname is (or is a subdomain of) an entry here is NOT
// reported by scan(). Membership is by exact host or registrable-suffix
// match. Widening this set is a deliberate spec change -- keep it narrow.
export const PUBLIC_HOST_ALLOWLIST = Object.freeze(new Set([
  'github.com',
  'docs.github.com',
  'raw.githubusercontent.com',
  'docs.anthropic.com',
  'www.anthropic.com',
]));

// --- Entropy fallback ---------------------------------------------------

export const ENTROPY_WINDOW_RE = /[A-Za-z0-9+/=_\-]{20,200}/g;
export const ENTROPY_MIN_SCORE = 4.5;
