import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placeArtifacts } from '../src/gen/artifacts.js';
import { height } from '../src/gen/terrain.js';

test('places 7, deterministic', () => {
  const a = placeArtifacts(3), b = placeArtifacts(3);
  assert.equal(a.length, 7);
  assert.deepEqual(a.map((p) => [p.x, p.z]), b.map((p) => [p.x, p.z]));
});
test('min gap and min start distance respected', () => {
  const a = placeArtifacts(5);
  for (const p of a) assert.ok(Math.hypot(p.x, p.z) >= 60, 'away from start');
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++)
    assert.ok(Math.hypot(a[i].x - a[j].x, a[i].z - a[j].z) >= 70, 'pairwise gap');
});
test('sits on terrain, unscanned', () => {
  for (const p of placeArtifacts(9)) { assert.equal(p.y, height(p.x, p.z, 9)); assert.equal(p.scanned, false); }
});
