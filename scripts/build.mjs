import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

rmSync('lib', { recursive: true, force: true });
const tsc = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.json'], { stdio: 'inherit' });
if (tsc.status !== 0) process.exit(tsc.status ?? 1);

await build({ entryPoints: ['src/index.ts'], bundle: true, platform: 'node', format: 'esm', outfile: 'lib/index.js' });

const client = await build({
  entryPoints: ['src/client.ts'],
  bundle: true,
  platform: 'browser',
  format: 'cjs',
  target: 'es2022',
  write: false,
});
const code = client.outputFiles[0].text;
// DSH loads the browser half through its module loader; any runtime import would need the platform module table.
if (/\brequire\s*\(/.test(code)) throw new Error('Browser bundle must not contain require() calls');

mkdirSync('lib', { recursive: true });
writeFileSync(
  'lib/client.js',
  `window.__ModuleLoader__.load({id:${JSON.stringify(pkg.name)},factory:()=>{const module={exports:{}};const exports=module.exports;\n${code}\nreturn module.exports;}});\n`,
);
console.log('Built lib/index.js, lib/client.js and declarations');
