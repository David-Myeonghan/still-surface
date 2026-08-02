import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moveDir, stepAngle, thirdPersonCam, integrateVertical } from '../src/game/locomotion.js';

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

test('integrateVertical: jump from ground sets upward velocity and leaves ground', () => {
  const r = integrateVertical({ y: 0, vy: 0, grounded: true, coyote: 0.12 }, 0.016, true, 6.5, 6.5, 0.12);
  assert.ok(r.justJumped, 'justJumped');
  assert.equal(r.grounded, false);
  assert.ok(r.vy > 0, `vy=${r.vy}`);
});
test('integrateVertical: no double jump while airborne', () => {
  const r = integrateVertical({ y: 2, vy: 1, grounded: false, coyote: 0 }, 0.016, true, 6.5, 6.5, 0.12);
  assert.equal(r.justJumped, false);
});
test('integrateVertical: gravity brings the jumper back and lands', () => {
  let v = integrateVertical({ y: 0, vy: 0, grounded: true, coyote: 0.12 }, 0.016, true, 6.5, 6.5, 0.12);
  let landed = false, maxY = 0, guard = 0;
  while (!landed && guard++ < 100000) {
    v = integrateVertical(v, 0.016, false, 6.5, 6.5, 0.12);
    maxY = Math.max(maxY, v.y);
    if (v.justLanded) landed = true;
  }
  assert.ok(landed, 'eventually lands');
  assert.equal(v.y, 0);
  assert.ok(maxY > 2.5 && maxY < 4.0, `peak ${maxY}`);
});
test('integrateVertical: coyote lets you jump shortly after leaving ground', () => {
  const r = integrateVertical({ y: 0, vy: 0, grounded: false, coyote: 0.08 }, 0.016, true, 6.5, 6.5, 0.12);
  assert.ok(r.justJumped, 'coyote jump');
});
