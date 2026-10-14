import assert from 'node:assert/strict';
import { test } from 'node:test';
import { audit, diffEnglish } from '../scripts/lib/audit.mjs';

const en = { common: { cancel: 'Cancel', greet: 'Hello {name}', sep: ' ' } };

test('audit separates missing, stale, invalid and accepted keys', () => {
  const r = audit(en, { common: { cancel: 'キャンセル', greet: 'こんにちは {user}' }, gone: { x: 'x' } }, ['common.sep']);
  assert.deepEqual(r.missing, []);
  assert.deepEqual(r.invalid, ['common.greet']);
  assert.deepEqual(r.stale, ['gone.x']);
  assert.equal(r.translated, 1);
});

test('diffEnglish reports added, changed and removed English keys', () => {
  const next = { common: { cancel: 'Cancel', greet: 'Hi {name}' }, new: { k: 'v' } };
  assert.deepEqual(diffEnglish(en, next), {
    added: ['new.k'],
    changed: ['common.greet'],
    removed: ['common.sep'],
  });
});
