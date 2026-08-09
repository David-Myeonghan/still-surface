import * as THREE from 'three';
import { moveDir, stepAngle, thirdPersonCam, integrateVertical } from '../game/locomotion.js';

const HEAD = 1.6, DIST = 5.2, WALK = 4.5, RUN = 9.0;
const GRAVITY = 6.5, JUMP_V = 6.5, COYOTE = 0.12;
const DASH_MULT = 2.4, DASH_DUR = 2.5, DASH_CD = 2.5;
const PITCH_MIN = -0.35, PITCH_MAX = 1.25;

export class Player {
  constructor(groundHeight) {
    this.groundHeight = groundHeight || (() => 0);
    this.pos = new THREE.Vector3(0, 0, 0);
    this.vel = new THREE.Vector3();
    this.groundY = 0;
    this.yaw = 0;          // 카메라 방위(=시야). HUD 나침반이 사용.
    this.pitch = 0.35;     // 카메라 고도(약간 위에서 내려다봄).
    this.facing = 0;       // 몸 방향.
    this.stride = 0;       // 달리기 보폭 위상.
    this.moving = false; this.running = false;
    this.y = 0; this.vy = 0; this.grounded = true; this.coyote = COYOTE;
    this.justJumped = false; this.justLanded = false;
    this.dashTime = 0; this.dashCd = 0;
    this.camPos = new THREE.Vector3(0, HEAD, DIST);
    this.headTarget = new THREE.Vector3();
    this._target = new THREE.Vector3();
  }
  look(dx, dy, sens = 1) {
    this.yaw -= dx * 0.0022 * sens;
    this.pitch = THREE.MathUtils.clamp(this.pitch + dy * 0.0022 * sens, PITCH_MIN, PITCH_MAX);
  }
  canDash() { return this.dashCd <= 0; }
  dash() { if (this.dashCd <= 0) { this.dashTime = DASH_DUR; this.dashCd = DASH_CD; } }
  update(dt, input) {
    this.dashTime = Math.max(0, this.dashTime - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    const mv = input.getMove();
    const run = mv.run;
    let speed = run ? RUN : WALK;
    if (this.dashTime > 0) speed *= DASH_MULT;
    const d = moveDir(mv.forward, mv.strafe, this.yaw);
    this._target.set(d.x * speed, 0, d.z * speed);
    this.vel.lerp(this._target, Math.min(1, dt * 12));
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;

    const h = this.groundHeight(this.pos.x, this.pos.z);
    this.groundY += (h - this.groundY) * Math.min(1, dt * 9);

    const hs = Math.hypot(this.vel.x, this.vel.z);
    this.moving = hs > 0.3;
    this.running = run && this.moving;
    if (this.moving) {
      // 몸이 속도 방향을 향함(전방 = (-sin,-cos) → target = atan2(-vx,-vz))
      const target = Math.atan2(-this.vel.x, -this.vel.z);
      this.facing = stepAngle(this.facing, target, Math.min(1, dt * 10));
    }
    this.stride += dt * (this.moving ? hs * 0.9 + 2 : 0);

    // 저중력 수직 물리 (Space 점프)
    const vr = integrateVertical(
      { y: this.y, vy: this.vy, grounded: this.grounded, coyote: this.coyote },
      dt, input.isJump(), GRAVITY, JUMP_V, COYOTE,
    );
    this.y = vr.y; this.vy = vr.vy; this.grounded = vr.grounded; this.coyote = vr.coyote;
    this.justJumped = vr.justJumped; this.justLanded = vr.justLanded;

    // 카메라 리그
    const ty = this.groundY + HEAD + this.y;
    this.headTarget.set(this.pos.x, ty, this.pos.z);
    const c = thirdPersonCam(this.pos.x, ty, this.pos.z, this.yaw, this.pitch, DIST);
    const floor = this.groundHeight(c.x, c.z) + 0.6; // 지면 관통 방지
    this.camPos.set(c.x, Math.max(c.y, floor), c.z);
  }
}
