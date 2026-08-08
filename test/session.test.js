import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dailySeed, parseSeed, formatTime, bestKey } from '../src/game/session.js';

test('dailySeed: deterministic per date, differs across dates', () => {
  assert.equal(dailySeed('2026-08-09'), dailySeed('2026-08-09'));
  assert.notEqual(dailySeed('2026-08-09'), dailySeed('2026-08-10'));
  assert.ok(Number.isInteger(dailySeed('2026-08-09')) && dailySeed('2026-08-09') >= 0);
});
test('parseSeed: valid ints, else null', () => {
  assert.equal(parseSeed('1337'), 1337);
  assert.equal(parseSeed('abc'), null);
  assert.equal(parseSeed(''), null);
  assert.equal(parseSeed('-5'), null);
});
test('formatTime: m:ss.d', () => {
  assert.equal(formatTime(83.42), '1:23.4');
  assert.equal(formatTime(5), '0:05.0');
  assert.equal(formatTime(0), '0:00.0');
});
test('bestKey: namespaced', () => {
  assert.equal(bestKey('daily'), 'ss:best:daily');
});
