import assert from 'node:assert/strict';
import { test } from 'node:test';
import { audit, diffEnglish, mergeOlder } from '../scripts/lib/audit.mjs';

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

test('audit keeps Japanese for older supported versions and checks it against their English', () => {
  const older = { common: { greet: ['Hello {name}!'], old: ['Old {n}'] } };
  const r = audit(en, { common: { cancel: 'キャンセル', greet: 'こんにちは{name}', old: '旧' } }, ['common.sep'], older);
  assert.deepEqual(r.stale, []);
  assert.deepEqual(r.invalid, ['common.old']);
  assert.equal(r.translated, 2);
});

test('mergeOlder keeps English the new baseline lacks or words differently', () => {
  const next = { common: { cancel: 'Cancel', greet: 'Hi {name}' } };
  assert.deepEqual(mergeOlder({ common: { greet: ['Hi {name}', 'Yo {name}'] } }, en, next), {
    common: { greet: ['Yo {name}', 'Hello {name}'], sep: [' '] },
  });
});
