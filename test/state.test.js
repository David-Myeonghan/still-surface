import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, nearestScannable, tickScan, scanProgress } from '../src/game/state.js';

const arts = () => [{ id: 0, x: 0, z: 3, y: 0, scanned: false }, { id: 1, x: 100, z: 0, y: 0, scanned: false }];

test('holding near artifact fills progress then scans', () => {
  const s = createGame(arts(), { scanSeconds: 1, radius: 5, total: 2 });
  const pos = { x: 0, z: 0 };
  assert.equal(nearestScannable(s, pos).id, 0);
  let r = tickScan(s, pos, true, 0.5); assert.equal(r.justScanned, null); assert.ok(scanProgress(s) > 0.4);
  r = tickScan(s, pos, true, 0.6); assert.equal(r.justScanned, 0);
  assert.equal(s.artifacts[0].scanned, true); assert.equal(s.scanned, 1);
});
test('releasing resets progress', () => {
  const s = createGame(arts(), { scanSeconds: 1, radius: 5 });
  tickScan(s, { x: 0, z: 0 }, true, 0.5); tickScan(s, { x: 0, z: 0 }, false, 0.1);
  assert.equal(scanProgress(s), 0);
});
test('scanning all sets status complete', () => {
  const s = createGame([{ id: 0, x: 0, z: 1, y: 0, scanned: false }], { scanSeconds: 1, radius: 5 });
  tickScan(s, { x: 0, z: 0 }, true, 1.0);
  assert.equal(s.status, 'complete');
});
test('out of radius does not scan', () => {
  const s = createGame(arts(), { scanSeconds: 1, radius: 5 });
  const r = tickScan(s, { x: 0, z: 50 }, true, 1.0);
  assert.equal(r.justScanned, null);
});
