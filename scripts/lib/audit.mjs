const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

/**
 * Compare Japanese against an English baseline.
 * - missing: English key with no Japanese text (falls back to English at runtime)
 * - stale:   Japanese key that neither the baseline nor an older supported version has
 * - invalid: empty text, or placeholder names that differ from any English the key has
 *
 * `older` holds the English of older supported DSH versions where it is absent
 * from or differs from the baseline (`sources/older.json` dictionaries): one
 * Japanese text serves every supported version, so it must fit all of them.
 */
export function audit(english, japanese, accepted = [], older = {}) {
  const missing = [];
  const stale = [];
  const invalid = [];
  let total = 0;
  const texts = (ns, key) => [...(english[ns]?.[key] === undefined ? [] : [english[ns][key]]), ...(older[ns]?.[key] ?? [])];
  const check = (ns, key, ja) => {
    if (typeof ja !== 'string' || ja.trim() === '' || texts(ns, key).some((en) => placeholders(ja) !== placeholders(en))) {
      invalid.push(`${ns}.${key}`);
    }
  };
  for (const [ns, dict] of Object.entries(english)) {
    for (const key of Object.keys(dict)) {
      total++;
      const ja = japanese[ns]?.[key];
      if (ja === undefined) {
        if (!accepted.includes(`${ns}.${key}`)) missing.push(`${ns}.${key}`);
      } else check(ns, key, ja);
    }
  }
  const baselineInvalid = invalid.length;
  for (const [ns, dict] of Object.entries(japanese)) {
    for (const [key, ja] of Object.entries(dict)) {
      if (english[ns]?.[key] !== undefined) continue;
      if (older[ns]?.[key] === undefined) stale.push(`${ns}.${key}`);
      else check(ns, key, ja);
    }
  }
  const translated = total - missing.length - baselineInvalid - accepted.length;
  return { total, translated, missing, stale, invalid };
}

/**
 * Fold the English a supported version had into the older-version record:
 * every text that is absent from or differs from the new baseline is kept,
 * and texts the new baseline now matches are dropped.
 */
export function mergeOlder(older, previous, next) {
  const merged = {};
  const add = (ns, key, text) => {
    if (next[ns]?.[key] === text) return;
    merged[ns] ??= {};
    merged[ns][key] ??= [];
    if (!merged[ns][key].includes(text)) merged[ns][key].push(text);
  };
  for (const [ns, dict] of Object.entries(older)) for (const [key, list] of Object.entries(dict)) for (const t of list) add(ns, key, t);
  for (const [ns, dict] of Object.entries(previous)) for (const [key, text] of Object.entries(dict)) add(ns, key, text);
  return merged;
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
