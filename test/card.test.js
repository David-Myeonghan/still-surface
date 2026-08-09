import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardLines } from '../src/game/card.js';

test('cardLines: base fields', () => {
  const c = cardLines({ time: '1:23.4', motes: 12, seed: 7, mode: 'seed', best: '1:20.0', isBest: false });
  assert.equal(c.title, '고요한 표면 · Still Surface');
  assert.equal(c.time, '1:23.4');
  assert.ok(c.sub.includes('12') && c.sub.includes('#7'));
  assert.equal(c.best, '최고 1:20.0');
  assert.ok(c.foot.includes('still-surface'));
});
test('cardLines: daily suffix', () => {
  const c = cardLines({ time: '0:59.9', motes: 3, seed: 42, mode: 'daily', best: null, isBest: true });
  assert.ok(c.sub.includes('오늘'));
});
test('cardLines: new record label', () => {
  const c = cardLines({ time: '0:59.9', motes: 3, seed: 42, mode: 'free', best: '0:59.9', isBest: true });
  assert.equal(c.best, '새 기록!');
});
test('cardLines: no best → empty', () => {
  const c = cardLines({ time: '1:00.0', motes: 0, seed: 1, mode: 'free', best: null, isBest: false });
  assert.equal(c.best, '');
});
