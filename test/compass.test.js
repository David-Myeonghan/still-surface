import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nearestUnscanned } from '../src/game/compass.js';

test('picks nearest unscanned with bearing', () => {
  const s = { artifacts: [{ id: 0, x: 0, z: 10, scanned: false }, { id: 1, x: 3, z: 0, scanned: false }] };
  const r = nearestUnscanned(s, { x: 0, z: 0 });
  assert.equal(r.id, 1); assert.ok(Math.abs(r.dist - 3) < 1e-9);
  assert.ok(Math.abs(r.angle - Math.atan2(3, 0)) < 1e-9);
});
test('null when all scanned', () => {
  assert.equal(nearestUnscanned({ artifacts: [{ id: 0, x: 1, z: 1, scanned: true }] }, { x: 0, z: 0 }), null);
});
