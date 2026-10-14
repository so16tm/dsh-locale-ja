// pnpm sync [version|dist-tag] [--drop-older]
// Fetch a DSH release from npm, re-extract the English baseline, and report
// what the Japanese dictionary needs. The previous baseline's version stays
// supported: its English that the new baseline lacks or words differently is
// kept in sources/older.json, so its Japanese stays and is checked against both.
// --drop-older ends support for every older version: sources/older.json is
// cleared and Japanese for keys the new baseline no longer has is removed.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { audit, diffEnglish, mergeOlder } from './lib/audit.mjs';
import { extractEnglish, sortKeys } from './lib/extract.mjs';

const args = process.argv.slice(2);
const dropOlder = args.includes('--drop-older');
const spec = args.find((a) => !a.startsWith('--')) ?? 'next';

const CACHE = resolve('.dsh-cache');
const BASELINE = resolve('sources/en.json');
const ACCEPTED = resolve('sources/accepted-fallbacks.json');
const OLDER = resolve('sources/older.json');
const JA = resolve('translations/ja.json');
const readJson = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback);
const writeJson = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

const version = execFileSync('npm', ['view', `@deepseek-ai/dsh@${spec}`, 'version'], { encoding: 'utf8' }).trim();
if (!version) throw new Error(`No DSH release matches ${spec}`);
const installDir = join(CACHE, version);
const scopeDir = join(installDir, 'node_modules', '@deepseek-ai');
if (!existsSync(join(scopeDir, 'dsh-client-locale'))) {
  console.log(`Installing @deepseek-ai/dsh@${version} into ${installDir} (scripts disabled)…`);
  mkdirSync(installDir, { recursive: true });
  writeJson(join(installDir, 'package.json'), { private: true });
  execFileSync(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--omit=optional', `@deepseek-ai/dsh@${version}`],
    { cwd: installDir, stdio: 'inherit' },
  );
}

const previous = readJson(BASELINE, { version: null, dictionaries: {} });
const next = extractEnglish(scopeDir);
const changes = diffEnglish(previous.dictionaries, next.dictionaries);
writeJson(BASELINE, next);

let older = readJson(OLDER, { versions: [], dictionaries: {} });
if (dropOlder) older = { versions: [], dictionaries: {} };
else if (previous.version && previous.version !== next.version) {
  older = {
    versions: [...new Set([...older.versions, previous.version])].filter((v) => v !== next.version),
    dictionaries: mergeOlder(older.dictionaries, previous.dictionaries, next.dictionaries),
  };
}
writeJson(OLDER, { versions: older.versions, dictionaries: sortKeys(Object.fromEntries(Object.entries(older.dictionaries).map(([n, d]) => [n, sortKeys(d)]))) });

const japanese = readJson(JA, {});
const accepted = readJson(ACCEPTED, []);
const pruned = audit(next.dictionaries, japanese, accepted, older.dictionaries).stale;
for (const id of pruned) {
  const ns = Object.keys(japanese).find((n) => id.startsWith(`${n}.`) && japanese[n][id.slice(n.length + 1)] !== undefined);
  delete japanese[ns][id.slice(ns.length + 1)];
  if (Object.keys(japanese[ns]).length === 0) delete japanese[ns];
}
writeJson(JA, sortKeys(Object.fromEntries(Object.entries(japanese).map(([n, d]) => [n, sortKeys(d)]))));
const result = audit(next.dictionaries, japanese, accepted, older.dictionaries);

// Work list for the translator: untranslated keys plus keys whose English changed.
const has = (dicts, n, id) => id.startsWith(`${n}.`) && dicts[n]?.[id.slice(n.length + 1)] !== undefined;
const lookup = (id) => {
  const ns = [...Object.keys(next.dictionaries), ...Object.keys(older.dictionaries)].find(
    (n) => has(next.dictionaries, n, id) || has(older.dictionaries, n, id),
  );
  return [ns, id.slice(ns.length + 1)];
};
const todo = {};
for (const id of new Set([...result.missing, ...result.invalid, ...changes.changed])) {
  const [ns, key] = lookup(id);
  todo[ns] ??= {};
  todo[ns][key] = {
    ...(next.dictionaries[ns]?.[key] !== undefined ? { en: next.dictionaries[ns][key] } : {}),
    // One Japanese text serves every supported version: word it to fit these too.
    ...(older.dictionaries[ns]?.[key] ? { olderEn: older.dictionaries[ns][key] } : {}),
    ...(previous.dictionaries[ns]?.[key] !== undefined && previous.dictionaries[ns][key] !== next.dictionaries[ns][key]
      ? { previousEn: previous.dictionaries[ns][key] }
      : {}),
    ...(japanese[ns]?.[key] !== undefined ? { currentJa: japanese[ns][key] } : {}),
  };
}
mkdirSync(CACHE, { recursive: true });
const report = { from: previous.version, to: version, english: changes, pruned, coverage: result, todo };
writeJson(join(CACHE, 'sync-report.json'), report);

const count = (list) => String(list.length).padStart(5);
console.log(`
DSH ${previous.version ?? '(none)'} → ${version}
  English added     ${count(changes.added)}
  English changed   ${count(changes.changed)}   (existing Japanese needs a re-check)
  English removed   ${count(changes.removed)}
  Japanese pruned   ${count(pruned)}
  Older versions    ${older.versions.join(', ') || '(none)'}
  Coverage          ${result.translated}/${result.total}
  Missing Japanese  ${count(result.missing)}
  Invalid Japanese  ${count(result.invalid)}   (empty or placeholder mismatch)
Work list: ${join('.dsh-cache', 'sync-report.json')} → "todo"`);
