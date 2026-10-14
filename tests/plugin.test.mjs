import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { Context } from '@deepseek-ai/cordis';
import { SystemPrompt, renderPrompt } from '@deepseek-ai/dsh-system-prompt';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
// The English baseline extracted from the DSH release by `pnpm sync`.
const english = JSON.parse(readFileSync(new URL('../sources/en.json', import.meta.url), 'utf8')).dictionaries;

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

// The newest and the oldest DSH the peer range admits; every runtime test runs on both.
const RUNTIMES = {
  newest: '@deepseek-ai/dsh-client-locale/client',
  oldest: 'dsh-client-locale-oldest/client',
};
const runtimeVersion = (name) =>
  JSON.parse(readFileSync(require.resolve(`${RUNTIMES[name].split('/client')[0]}/package.json`), 'utf8')).version;

/** The real shipped LocaleRuntime, with React-side dependencies stubbed out. */
function runtime(name) {
  const { exports } = loadBundle(require.resolve(RUNTIMES[name]), {
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

test('the manifest mounts an immediate web client', () => {
  assert.equal(plugin.id, pkg.name);
  assert.equal(pkg.dsh.client.platform, 'web');
  assert.equal(pkg.dsh.client.immediately, true);
  assert.deepEqual([...plugin.exports.inject], ['locale']);
});

for (const name of Object.keys(RUNTIMES)) {
  test(`DSH ${runtimeVersion(name)}: activation adds 日本語; unload removes it and reload restores the saved choice`, async () => {
    const ctx = new Context();
    const locale = runtime(name);
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

  test(`DSH ${runtimeVersion(name)}: missing or empty Japanese entries fall back to English`, () => {
    const locale = runtime(name);
    const dispose = registerJapanese(locale, { common: { cancel: 'キャンセル', loading: '' } });
    locale.setLocale('ja');
    assert.equal(locale.bind('common')('loading'), english.common.loading);
    dispose();
    dispose();
  });

  test(`DSH ${runtimeVersion(name)}: a failed activation rolls back its partial registrations`, () => {
    const locale = runtime(name);
    const existing = locale.register('collision', 'ja', { owned: '既存' });
    assert.throws(() => registerJapanese(locale, { transient: { key: '一時' }, collision: { key: '競合' } }));
    // `transient` was released, so another owner can register it again.
    locale.register('transient', 'ja', { key: '再登録' })();
    existing();
  });
}

test('host entry asks the agent to reply in Japanese only while Japanese is chosen', async () => {
  const host = await import('../lib/index.js');
  const ctx = new Context();
  ctx.plugin(SystemPrompt, {});
  let preference;
  ctx.provide('settings', { describe: () => [{ ns: 'locale', value: { preference } }] });
  const prompt = async () => renderPrompt(await ctx.systemPrompt.assemble());

  const fork = ctx.plugin(host, {});
  await fork;
  assert.match(host.REPLY_INSTRUCTION, /in Japanese/);
  // Left to the browser: the Host cannot see which language the page shows.
  assert.ok(!(await prompt()).includes(host.REPLY_INSTRUCTION));
  preference = 'ja';
  assert.ok((await prompt()).includes(host.REPLY_INSTRUCTION));
  preference = 'en';
  assert.ok(!(await prompt()).includes(host.REPLY_INSTRUCTION));
  preference = 'ja';
  assert.ok((await prompt()).includes(host.REPLY_INSTRUCTION));
  await fork.dispose();
  assert.ok(!(await prompt()).includes(host.REPLY_INSTRUCTION));

  const off = ctx.plugin(host, { replyInUiLanguage: false });
  await off;
  assert.ok(!(await prompt()).includes(host.REPLY_INSTRUCTION));
  await off.dispose();
});

test('host entry loads without a prompt registry or settings', async () => {
  const host = await import('../lib/index.js');
  assert.equal(host.japaneseSelected(undefined), false);
  assert.equal(host.japaneseSelected({ describe() { throw new Error('closed'); } }), false);
  const fork = new Context().plugin(host, {});
  await fork;
  await fork.dispose();
});
