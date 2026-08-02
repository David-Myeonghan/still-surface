import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placeMotes, collectMotes } from '../src/game/motes.js';

const flat = () => 0;
const arts = [{ x: 100, z: 0 }, { x: 100, z: 100 }, { x: 0, z: 100 }];

test('placeMotes: deterministic for a seed', () => {
  const a = placeMotes(1337, arts, flat);
  const b = placeMotes(1337, arts, flat);
  assert.deepEqual(a, b);
  assert.ok(a.length > 5, `got ${a.length}`);
});
test('placeMotes: ids are unique and sequential', () => {
  const m = placeMotes(7, arts, flat);
  assert.deepEqual(m.map((x) => x.id), m.map((_, i) => i));
});
test('placeMotes: uses height fn for y', () => {
  const m = placeMotes(7, arts, () => 5);
  assert.ok(m.every((x) => x.y === 5));
});
test('collectMotes: collects within radius, once', () => {
  const m = placeMotes(1, arts, flat);
  const near = m[0];
  const n1 = collectMotes(m, { x: near.x, z: near.z }, 3);
  assert.ok(n1 >= 1);
  const n2 = collectMotes(m, { x: near.x, z: near.z }, 3);
  assert.equal(n2, 0, 'already collected');
});
test('collectMotes: none when far', () => {
  const m = placeMotes(1, arts, flat);
  assert.equal(collectMotes(m, { x: 9999, z: 9999 }, 3), 0);
});
