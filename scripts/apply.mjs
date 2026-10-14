// pnpm apply <file.json>
// Merge reviewed translations ({ namespace: { key: "日本語" } }) into
// translations/ja.json, rejecting unknown keys and placeholder mismatches.
import { readFileSync, writeFileSync } from 'node:fs';
import { audit } from './lib/audit.mjs';
import { sortKeys } from './lib/extract.mjs';

const file = process.argv[2];
if (!file) throw new Error('Usage: pnpm apply <translations.json>');
const english = JSON.parse(readFileSync('sources/en.json', 'utf8')).dictionaries;
const incoming = JSON.parse(readFileSync(file, 'utf8'));
const check = audit(english, incoming);
if (check.stale.length || check.invalid.length) {
  console.error('Rejected. Unknown keys:', check.stale, 'Empty or placeholder mismatch:', check.invalid);
  process.exit(1);
}
const japanese = JSON.parse(readFileSync('translations/ja.json', 'utf8'));
let applied = 0;
for (const [ns, dict] of Object.entries(incoming)) {
  japanese[ns] = { ...japanese[ns], ...dict };
  applied += Object.keys(dict).length;
}
const sorted = sortKeys(Object.fromEntries(Object.entries(japanese).map(([n, d]) => [n, sortKeys(d)])));
writeFileSync('translations/ja.json', `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`Applied ${applied} entries to translations/ja.json`);
