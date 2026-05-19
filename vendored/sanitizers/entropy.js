/**
 * Shannon entropy of a string in bits per character.
 *
 * Returns 0 for inputs shorter than the length floor (20 characters) so the
 * caller can short-circuit candidate windows without a math call. Above the
 * floor the value is `-Σ p(c) * log2(p(c))` over the multiset of characters.
 *
 * Pure, allocation-bounded (one `Map` keyed by unique characters), no I/O.
 *
 * @param {string} s - Input string to score.
 * @returns {number} Shannon entropy in bits/char, or 0 if `s.length < 20`.
 * @throws {TypeError} If `s` is not a string.
 */
export function shannonEntropy(s) {
  if (typeof s !== 'string') {
    throw new TypeError('shannonEntropy: s must be a string');
  }
  if (s.length < 20) return 0;
  const freq = new Map();
  for (const ch of s) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }
  const n = s.length;
  let h = 0;
  for (const count of freq.values()) {
    const p = count / n;
    h -= p * Math.log2(p);
  }
  return h;
}
