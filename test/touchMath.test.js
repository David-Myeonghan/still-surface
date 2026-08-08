import { test } from 'node:test';
import assert from 'node:assert/strict';
import { joyVector } from '../src/core/touchMath.js';

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

test('joyVector: centered is zero (deadzone)', () => {
  const v = joyVector(100, 100, 100, 100, 60);
  assert.deepEqual(v, { x: 0, y: 0, mag: 0 });
});
test('joyVector: right edge is +x, mag 1', () => {
  const v = joyVector(100, 100, 160, 100, 60);
  near(v.x, 1); near(v.y, 0); near(v.mag, 1);
});
test('joyVector: up is -y (maps to forward)', () => {
  const v = joyVector(100, 100, 100, 40, 60);
  near(v.y, -1); assert.ok(v.mag > 0.9);
});
test('joyVector: beyond radius clamps mag to 1 and axes to [-1,1]', () => {
  const v = joyVector(100, 100, 100 + 200, 100, 60);
  near(v.mag, 1); near(v.x, 1);
});
test('joyVector: inside deadzone returns zero', () => {
  const v = joyVector(100, 100, 105, 100, 60, 0.15); // dist 5, mag .083 < .15
  assert.deepEqual(v, { x: 0, y: 0, mag: 0 });
});
