import { test } from 'node:test';
import assert from 'node:assert/strict';
import { height } from '../src/gen/terrain.js';

test('deterministic', () => { assert.equal(height(12.3, -4.5, 7), height(12.3, -4.5, 7)); });
test('varies with position and seed', () => {
  assert.notEqual(height(0, 0, 1), height(50, 50, 1));
  assert.notEqual(height(10, 10, 1), height(10, 10, 2));
});
test('bounded and continuous', () => {
  for (let i = 0; i < 200; i++) { const h = height(i * 3.1, i * -2.7, 1); assert.ok(Number.isFinite(h)); assert.ok(h > -40 && h < 60); }
  assert.ok(Math.abs(height(10, 10, 1) - height(10.5, 10, 1)) < 3);
});
