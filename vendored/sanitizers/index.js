// Public sanitizer surface. Modules landed:
//   A: path_blocklist        -- `isPathBlocked`
//   B: entropy + log         -- `shannonEntropy`, `logSecretHit`
//   C: secret_sanitizer      -- `scan`, `EXIT_SECRET_DETECTED`
//   D: implementation_sanitizer -- `sanitizeImplementations`, `BODY_LOC_THRESHOLD`
//   E: pii_sanitizer         -- `sanitizePII`, `PII_ALLOWLIST`
//   F: issue_log_sanitizer   -- `sanitizeIssueLog`
//   G: compose               -- `composeAll`, `STAGE_ORDER`
//   H: changelog_subject_sanitizer -- `classifySubject`, `sanitizeSubject`
//
// NOTE: the changelog subject filter's own call sites import the concrete
// module, not this barrel -- `tests/generators/changelog_generator.test.js`
// replaces this file wholesale with a `composeAll`-only mock. It is
// re-exported here so the public surface stays complete.

export { isPathBlocked } from './path_blocklist.js';
export { shannonEntropy } from './entropy.js';
export { logSecretHit } from './log.js';
export { scan, EXIT_SECRET_DETECTED } from './secret_sanitizer.js';
export { PUBLIC_HOST_ALLOWLIST } from './regexes.js';
export {
  sanitizeImplementations,
  BODY_LOC_THRESHOLD,
} from './implementation_sanitizer.js';
export { sanitizePII, PII_ALLOWLIST } from './pii_sanitizer.js';
export { sanitizeIssueLog } from './issue_log_sanitizer.js';
export { composeAll, STAGE_ORDER } from './compose.js';
export {
  classifySubject,
  sanitizeSubject,
  NEUTRAL_SUBJECT,
} from './changelog_subject_sanitizer.js';
