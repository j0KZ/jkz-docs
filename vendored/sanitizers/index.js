// Public sanitizer surface. Modules landed:
//   A: path_blocklist        -- `isPathBlocked`
//   B: entropy + log         -- `shannonEntropy`, `logSecretHit`
//   C: secret_sanitizer      -- `scan`, `EXIT_SECRET_DETECTED`
//   D: implementation_sanitizer -- `sanitizeImplementations`, `BODY_LOC_THRESHOLD`
//   E: pii_sanitizer         -- `sanitizePII`, `PII_ALLOWLIST`
//   F: issue_log_sanitizer   -- `sanitizeIssueLog`
//   G: compose               -- `composeAll`, `STAGE_ORDER`

export { isPathBlocked } from './path_blocklist.js';
export { shannonEntropy } from './entropy.js';
export { logSecretHit } from './log.js';
export { scan, EXIT_SECRET_DETECTED } from './secret_sanitizer.js';
export {
  sanitizeImplementations,
  BODY_LOC_THRESHOLD,
} from './implementation_sanitizer.js';
export { sanitizePII, PII_ALLOWLIST } from './pii_sanitizer.js';
export { sanitizeIssueLog } from './issue_log_sanitizer.js';
export { composeAll, STAGE_ORDER } from './compose.js';
