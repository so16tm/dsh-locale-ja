const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

/**
 * Compare Japanese against an English baseline.
 * - missing: English key with no Japanese text (falls back to English at runtime)
 * - stale:   Japanese key the baseline no longer has
 * - invalid: empty text or placeholder names that differ from English
 */
export function audit(english, japanese, accepted = []) {
  const missing = [];
  const stale = [];
  const invalid = [];
  let total = 0;
  for (const [ns, dict] of Object.entries(english)) {
    for (const [key, en] of Object.entries(dict)) {
      total++;
      const ja = japanese[ns]?.[key];
      if (ja === undefined) {
        if (!accepted.includes(`${ns}.${key}`)) missing.push(`${ns}.${key}`);
      } else if (typeof ja !== 'string' || ja.trim() === '' || placeholders(ja) !== placeholders(en)) {
        invalid.push(`${ns}.${key}`);
      }
    }
  }
  for (const [ns, dict] of Object.entries(japanese)) {
    for (const key of Object.keys(dict)) if (english[ns]?.[key] === undefined) stale.push(`${ns}.${key}`);
  }
  const translated = total - missing.length - invalid.length - accepted.length;
  return { total, translated, missing, stale, invalid };
}

/** English-side changes between two baselines: what a version bump asks of the translation. */
export function diffEnglish(before, after) {
  const added = [];
  const changed = [];
  const removed = [];
  for (const [ns, dict] of Object.entries(after)) {
    for (const [key, en] of Object.entries(dict)) {
      const old = before[ns]?.[key];
      if (old === undefined) added.push(`${ns}.${key}`);
      else if (old !== en) changed.push(`${ns}.${key}`);
    }
  }
  for (const [ns, dict] of Object.entries(before)) {
    for (const key of Object.keys(dict)) if (after[ns]?.[key] === undefined) removed.push(`${ns}.${key}`);
  }
  return { added, changed, removed };
}
