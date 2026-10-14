// pnpm coverage [--strict]
// Audit translations/ja.json against sources/en.json. Stale keys and invalid
// text always fail; missing keys fail only with --strict. Keys kept for older
// supported DSH versions (sources/older.json) are not stale, and their Japanese
// is checked against that English as well.
import { existsSync, readFileSync } from 'node:fs';
import { audit } from './lib/audit.mjs';

const baseline = JSON.parse(readFileSync('sources/en.json', 'utf8'));
const japanese = JSON.parse(readFileSync('translations/ja.json', 'utf8'));
const accepted = JSON.parse(readFileSync('sources/accepted-fallbacks.json', 'utf8'));
const older = existsSync('sources/older.json') ? JSON.parse(readFileSync('sources/older.json', 'utf8')).dictionaries : {};
const r = audit(baseline.dictionaries, japanese, accepted, older);
console.log(`DSH ${baseline.version}: ${r.translated}/${r.total} translated, ${r.missing.length} missing`);
if (r.stale.length) console.error('Stale keys:\n  ' + r.stale.join('\n  '));
if (r.invalid.length) console.error('Empty or placeholder mismatch:\n  ' + r.invalid.join('\n  '));
if (r.stale.length || r.invalid.length || (process.argv.includes('--strict') && r.missing.length)) process.exitCode = 1;
