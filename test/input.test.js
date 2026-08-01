import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drainDelta } from '../src/core/Input.js';

test('drainDelta returns accumulated then zeroes', () => {
  const acc = { x: 5, y: -3 };
  assert.deepEqual(drainDelta(acc), { x: 5, y: -3 });
  assert.deepEqual(acc, { x: 0, y: 0 });
});
