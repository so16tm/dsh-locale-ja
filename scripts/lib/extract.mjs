import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseData } from './static-data.mjs';

/**
 * Read every English dictionary the installed DSH client packages register
 * through `locale.register(...)`. Unknown registration shapes are errors, so
 * a new upstream pattern surfaces instead of silently shrinking the baseline.
 */
export function extractEnglish(scopeDir) {
  const dictionaries = {};
  const packages = {};
  const failures = [];
  const add = (pkg, ns, dict) => {
    if (typeof ns !== 'string' || !dict || Object.values(dict).some((v) => typeof v !== 'string')) {
      throw new Error('Invalid dictionary');
    }
    if (dictionaries[ns] && JSON.stringify(dictionaries[ns]) !== JSON.stringify(dict)) {
      throw new Error(`Conflicting namespace ${ns}`);
    }
    dictionaries[ns] = sortKeys(dict);
    packages[ns] = pkg;
  };

  for (const pkg of readdirSync(scopeDir).filter((p) => p.startsWith('dsh-')).sort()) {
    for (const filename of registeringFiles(join(scopeDir, pkg, 'lib'))) {
    const { source, walk, evaluate, ts, declarations } = parseData(readFileSync(filename, 'utf8'));
    walk(source, (node) => {
      if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return;
      if (node.expression.name.text !== 'register') return;
      if (!/(?:^|\.)locale$/.test(node.expression.expression.getText(source))) return;
      try {
        const ns = evaluate(node.arguments[0]);
        if (node.arguments.length === 2) add(pkg, ns, evaluate(node.arguments[1]).en);
        else if (evaluate(node.arguments[1]) === 'en') add(pkg, ns, evaluate(node.arguments[2]));
      } catch (error) {
        // The directory browser registers from a loop over a static [locale, dict] array.
        if (pkg === 'dsh-client-ui-directory-picker-browse' && declarations.has('dictionaries')) {
          try {
            const ns = evaluate(declarations.get('LOCALE_NS')[0].initializer);
            const pairs = evaluate(declarations.get('dictionaries')[0].initializer);
            add(pkg, ns, pairs.find(([id]) => id === 'en')[1]);
          } catch (inner) {
            failures.push(`${pkg}: ${inner.message}`);
          }
        } else failures.push(`${pkg}: ${error.message}`);
      }
    });
    }
  }
  if (failures.length) throw new Error(`Could not extract:\n${failures.join('\n')}`);
  if (!dictionaries.common || !dictionaries['settings.locale']) throw new Error('Core namespaces were not extracted');
  const version = JSON.parse(readFileSync(join(scopeDir, 'dsh-client-locale', 'package.json'), 'utf8')).version;
  return { version, packages: sortKeys(packages), dictionaries: sortKeys(dictionaries) };
}

/**
 * Every script under a package's lib/ that calls `locale.register(`. Client code is
 * not always in lib/client.js (the inspector registers from lib/client.page.js).
 */
function registeringFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true })
    .map((name) => join(dir, name))
    .filter((file) => /\.[cm]?js$/.test(file) && statSync(file).isFile())
    .filter((file) => readFileSync(file, 'utf8').includes('locale.register('))
    .sort();
}

export function sortKeys(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}
