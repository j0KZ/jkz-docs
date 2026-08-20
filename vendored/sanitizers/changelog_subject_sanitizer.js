/**
 * Changelog subject sanitizer: classify a single commit subject / PR title as
 * a "map" -- prose that tells a public reader which security control is broken
 * and where -- and replace it with a fixed neutral line.
 *
 * The four sibling sanitizers all match on *content class* (secret values,
 * PII, stack frames, function bodies). A subject that describes where a
 * control fails contains none of those classes: the leaked information is
 * semantic. This module is the only one that reads the sentence.
 *
 * Decision rule (two signals, no allow-list):
 *   Rule A  a self-sufficient weakness class token (`traversal`, `TOCTOU`,
 *           `bypass`, `unauthorized`, `CSWSH` ...). The token alone is the map.
 *   Rule C  a named security-control artifact (`guard-*.sh`, `source-guard`).
 *           Naming the control is the map regardless of the verb.
 *   Rule B  a weakness verb (`exposing`, `disclosing`, `leaks`) paired with a
 *           named sensitive object (`token`, `credentials`, `JKZ_`, `/proc`).
 *           Neither half is a map alone; the pairing is.
 *
 * A hardening-verb allow-list is deliberately absent: the verb does not
 * separate the classes. 17 of the 30 hand-removed ground-truth entries use a
 * hardening/fix verb, so an allow-list keyed on it would retain more than half
 * of exactly what this module exists to catch. The class x object pairing does
 * separate them, and needs no exemptions: 0 of the 44 explicit-hardening
 * survivors are flagged.
 *
 * Measured over 1709 subjects labelled against the 30 entries removed by hand
 * in jkz-docs#93 (commit a4c432b): TP 30, FN 0, FP 13 (0.77 % of the 1679
 * negatives). Those 13 are pinned in
 * `tests/sanitizers/fixtures/changelog_subjects/collateral.txt`, which holds
 * 14 lines: the 13 measured false positives plus one synthetic
 * `patch CVE-2024-1234` over-trigger, added so the deliberate `/\bCVE-/i`
 * rule is visible in the pinned set rather than only in the rule table.
 *
 * There is no kill-switch and no config key. Disabling the filter republishes
 * the exact corpus jkz-docs#93 removed, and the module's worst failure mode is
 * cosmetic over-neutralization, which never blocks a run. The extension seam
 * is the exported, frozen rule tables -- extended in source, under review,
 * with the adversarial suite as the gate.
 *
 * Pure (no I/O), total over strings. Throws `TypeError` on non-string input.
 */

/**
 * The replacement line. Must not itself be classifiable, or a second pass
 * over generated output would loop (asserted by the idempotence test).
 */
export const NEUTRAL_SUBJECT = 'Security fix';

/**
 * Rule A -- a named weakness class. The token alone is the map: it names the
 * flaw category, which is enough to start looking for it.
 */
export const WEAKNESS_CLASS_STRONG = Object.freeze([
  /\btraversal\b/i,
  /\bTOCTOU\b/,
  /\bbypass(es|ed|ing)?\b/i,
  /\bunauthoriz|\bunauthoris/i,
  /\bCSWSH\b|\bCSRF\b|\bXSS\b|\bSSRF\b|\bRCE\b|\bCVE-/i,
  /\brace condition\b|\bpush race\b/i,
  /\bforg(e|ed|ery|ing)\b/i,
  /\bnever validat|\bnot validat(e|ed|ing)\b/i,
  /\bpasses by coincidence\b/i,
  /\blocalStorage\b/i,
  /\bclear ?text\b|\bplain ?text\b/i,
]);

/**
 * Rule B, half 1 -- a weakness verb that is only a map when it has an object.
 * `expose the new CLI flag` is a feature; `exposing it via /proc` is a map.
 */
export const WEAKNESS_CLASS_WEAK = Object.freeze([
  /\bexpos(e|es|ed|ing|ure)\b/i,
  /\bdisclos(e|es|ed|ing|ure)\b/i,
  /\bleak(s|ed|ing|age)?\b/i,
  /\binert\b/i,
  /\bsuppress(es|ed|ing|ion)?\b/i,
  /\bauthoriz(e|es|ed|ing)\b|\bauthoris(e|es|ed|ing)\b/i,
  /\bredact(s|ed|ing)?\b/i,
  /\bsanitiz(e|es|ed|ing)\b|\bsanitis(e|es|ed|ing)\b/i,
]);

/**
 * Rule B, half 2 -- the sensitive object or control surface the verb acts on.
 */
export const SENSITIVE_OBJECT = Object.freeze([
  /\bsecrets?\b/i, /\bcredentials?\b/i, /\btokens?\b/i, /\bpassword/i,
  /\bapi[ _-]?keys?\b/i, /\bcredential-named\b/i, /\bquery_env\b/i,
  /\bJKZ_/, /\/proc\b/, /\bargv\b/, /\bcommand line\b/i,
  /\bprivate repo/i, /\bguards?\b/i, /\bprobe\b/i, /\bhooks?\b/i,
  /\bsanitizer\b/i, /\bsecret scan\b/i, /\bcallbacks?\b/i, /\bauth\b/i,
]);

/**
 * Rule C -- naming a specific security-control artifact is itself the map,
 * regardless of the verb. Kept deliberately narrow: `merge-gate` and
 * `auto-revert` are NOT here, because 5 survivors name them benignly
 * (e.g. "reapply #1695 merge-gate hardening (4th recovery) (#1724)").
 */
export const NAMED_CONTROL = Object.freeze([
  /\bguard-[a-z-]+\.sh\b/i,
  /\bsource-guard\b/i,
]);

/**
 * @typedef {object} SubjectVerdict
 * @property {boolean} flagged  True when the subject reads as a map.
 * @property {?string} rule     `weakness_class` | `named_control` |
 *                              `weak_with_object`, or null when clean.
 * @property {?string} token    The *regex source* that matched, never a slice
 *                              of the subject. A warning line built from this
 *                              cannot echo the text the filter just removed.
 */

/**
 * Classify a raw commit subject or PR title.
 *
 * Every pattern is applied to the **raw** subject -- before any conventional
 * prefix strip and before the trailing `(#N)` is parsed off -- so a token
 * cannot hide inside `fix(security):` or inside a nested `Revert "..."` quote.
 * The 5 linkless `Revert`/`Reapply` entries in the ground truth are only
 * reachable this way.
 *
 * @param {string} subject
 * @returns {SubjectVerdict}
 * @throws {TypeError} If `subject` is not a string. Thrown rather than
 *   coerced: every call site already narrows to a string, so a non-string
 *   here means the caller changed shape and must be fixed, not papered over.
 */
export function classifySubject(subject) {
  if (typeof subject !== 'string') {
    throw new TypeError('classifySubject: subject must be a string');
  }
  if (subject.length === 0) {
    return { flagged: false, rule: null, token: null };
  }

  for (const re of WEAKNESS_CLASS_STRONG) {
    if (re.test(subject)) {
      return { flagged: true, rule: 'weakness_class', token: String(re) };
    }
  }

  for (const re of NAMED_CONTROL) {
    if (re.test(subject)) {
      return { flagged: true, rule: 'named_control', token: String(re) };
    }
  }

  const weak = WEAKNESS_CLASS_WEAK.find((re) => re.test(subject));
  if (weak && SENSITIVE_OBJECT.some((re) => re.test(subject))) {
    return { flagged: true, rule: 'weak_with_object', token: String(weak) };
  }

  return { flagged: false, rule: null, token: null };
}

/**
 * Resolve a subject to what may be published: the neutral line when flagged,
 * the byte-identical input otherwise.
 *
 * @param {string} subject
 * @returns {{subject: string, flagged: boolean, rule: ?string}}
 * @throws {TypeError} If `subject` is not a string (propagated from
 *   `classifySubject`).
 */
export function sanitizeSubject(subject) {
  const verdict = classifySubject(subject);
  return {
    subject: verdict.flagged ? NEUTRAL_SUBJECT : subject,
    flagged: verdict.flagged,
    rule: verdict.rule,
  };
}
