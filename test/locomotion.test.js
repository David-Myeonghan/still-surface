import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moveDir, stepAngle, thirdPersonCam } from '../src/game/locomotion.js';

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

test('moveDir: W at yaw 0 goes -Z', () => {
  const d = moveDir(1, 0, 0);
  near(d.x, 0); near(d.z, -1);
});
test('moveDir: D at yaw 0 goes +X', () => {
  const d = moveDir(0, 1, 0);
  near(d.x, 1); near(d.z, 0);
});
test('moveDir: no input is zero', () => {
  const d = moveDir(0, 0, 1.23);
  near(d.x, 0); near(d.z, 0);
});
test('moveDir: diagonal is normalized to length 1', () => {
  const d = moveDir(1, 1, 0);
  near(Math.hypot(d.x, d.z), 1);
});
test('moveDir: yaw rotates the frame', () => {
  const d = moveDir(1, 0, Math.PI / 2); // forward = (-sin90,-cos90) = (-1, 0)
  near(d.x, -1, 1e-9); near(d.z, 0, 1e-9);
});
test('stepAngle: half-way interpolation', () => {
  near(stepAngle(0, Math.PI / 2, 0.5), Math.PI / 4);
});
test('stepAngle: takes short way across ±π boundary', () => {
  const r = stepAngle(3.10, -3.10, 1); // short path ~0.08 rad across π, not ~6.2 back
  // 결과는 재래핑하지 않으므로(증분 회전용) 이동량이 짧은지로 검증
  assert.ok(Math.abs(r - 3.10) < 0.1, `moved short way, delta=${r - 3.10}`);
  // 래핑 동등성: r 과 target 은 같은 각도
  const wrapDiff = Math.atan2(Math.sin(r - (-3.10)), Math.cos(r - (-3.10)));
  assert.ok(Math.abs(wrapDiff) < 1e-6, `wrapped equal to target, diff=${wrapDiff}`);
});
test('stepAngle: t clamped to [0,1]', () => {
  near(stepAngle(0, 1, 2), 1);
  near(stepAngle(0, 1, -1), 0);
});
test('thirdPersonCam: pitch 0 sits behind (+Z) at target height', () => {
  const c = thirdPersonCam(0, 0, 0, 0, 0, 5);
  near(c.x, 0); near(c.y, 0); near(c.z, 5);
});
test('thirdPersonCam: positive pitch raises camera', () => {
  const c = thirdPersonCam(0, 10, 0, 0, 0.5, 5);
  assert.ok(c.y > 10, `y=${c.y} should exceed target y`);
});
