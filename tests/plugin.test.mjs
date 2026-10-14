import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { Context } from '@deepseek-ai/cordis';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const english = {
  common: { cancel: 'Cancel', loading: 'Loading…' },
  'settings.locale': { 'language.title': 'Language' },
};

/** Evaluate a DSH ModuleLoader bundle the way the browser would, with no platform module table. */
function loadBundle(filename, dependencies = {}) {
  let record;
  const sandbox = {
    window: { __ModuleLoader__: { load(value) { record = value; } } },
    navigator: { languages: ['en-US'], language: 'en-US' },
    console,
    queueMicrotask,
  };
  vm.runInNewContext(readFileSync(filename, 'utf8'), sandbox, { filename: String(filename) });
  assert.ok(record?.factory, 'bundle registers a ModuleLoader factory');
  const exports = record.factory((id) => {
    if (!(id in dependencies)) throw new Error(`Unexpected runtime dependency: ${id}`);
    return dependencies[id];
  });
  return { id: record.id, exports };
}

/** The real shipped LocaleRuntime, with React-side dependencies stubbed out. */
function runtime() {
  const { exports } = loadBundle(require.resolve('@deepseek-ai/dsh-client-locale/client'), {
    'react/jsx-runtime': {},
    react: {},
    '@deepseek-ai/dsh-client-ui-primitives': {},
    '@deepseek-ai/dsh-client-store': {},
  });
  const locale = new exports.LocaleRuntime(new Context());
  for (const [ns, dictionary] of Object.entries(english)) locale.register(ns, 'en', dictionary);
  return locale;
}

const plugin = loadBundle(new URL('../lib/client.js', import.meta.url));
const localeBuild = await build({
  entryPoints: [fileURLToPath(new URL('../src/locale.ts', import.meta.url))],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
});
const localeModule = { exports: {} };
vm.runInNewContext(localeBuild.outputFiles[0].text, { module: localeModule, exports: localeModule.exports });
const { registerJapanese } = localeModule.exports;

test('host entry is inert and the manifest mounts an immediate web client', async () => {
  const host = await import('../lib/index.js');
  assert.equal(host.apply(), undefined);
  assert.equal(plugin.id, pkg.name);
  assert.equal(pkg.dsh.client.platform, 'web');
  assert.equal(pkg.dsh.client.immediately, true);
  assert.deepEqual([...plugin.exports.inject], ['locale']);
});

test('activation adds 日本語; unload removes it and reload restores the saved choice', async () => {
  const ctx = new Context();
  const locale = runtime();
  ctx.provide('locale', locale);
  const fork = ctx.plugin(plugin.exports);
  await fork;
  assert.equal(locale.getLocale().locales.find((v) => v.id === 'ja')?.label, '日本語');
  locale.setLocale('ja');
  assert.equal(locale.bind('common')('cancel'), 'キャンセル');
  assert.equal(locale.bind('settings.locale')('language.title'), '言語');

  await fork.dispose();
  assert.equal(locale.getLocale().active, 'en');
  assert.ok(!locale.getLocale().locales.some((v) => v.id === 'ja'));

  const again = ctx.plugin(plugin.exports);
  await again;
  assert.equal(locale.getLocale().active, 'ja');
  await again.dispose();
});

test('missing or empty Japanese entries fall back to English', () => {
  const locale = runtime();
  const dispose = registerJapanese(locale, { common: { cancel: 'キャンセル', loading: '' } });
  locale.setLocale('ja');
  assert.equal(locale.bind('common')('loading'), english.common.loading);
  dispose();
  dispose();
});

test('a failed activation rolls back its partial registrations', () => {
  const locale = runtime();
  const existing = locale.register('collision', 'ja', { owned: '既存' });
  assert.throws(() => registerJapanese(locale, { transient: { key: '一時' }, collision: { key: '競合' } }));
  // `transient` was released, so another owner can register it again.
  locale.register('transient', 'ja', { key: '再登録' })();
  existing();
});
