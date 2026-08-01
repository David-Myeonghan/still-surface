import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, hash2 } from '../src/gen/rng.js';

test('mulberry32 deterministic', () => { const a = mulberry32(42), b = mulberry32(42); for (let i = 0; i < 10; i++) assert.equal(a(), b()); });
test('mulberry32 in [0,1)', () => { const r = mulberry32(1); for (let i = 0; i < 100; i++) { const v = r(); assert.ok(v >= 0 && v < 1); } });
test('hash2 deterministic + varies by cell', () => {
  assert.equal(hash2(3, 7, 1), hash2(3, 7, 1));
  assert.notEqual(hash2(3, 7, 1), hash2(4, 7, 1));
  const v = hash2(3, 7, 1); assert.ok(v >= 0 && v < 1);
});
