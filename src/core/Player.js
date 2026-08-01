import * as THREE from 'three';

const EYE = 1.7, WALK = 4.5, RUN = 8.0;

export class Player {
  constructor(groundHeight) {
    this.groundHeight = groundHeight || (() => 0);
    this.pos = new THREE.Vector3(0, 0, 0);
    this.vel = new THREE.Vector3();
    this.groundY = 0;
    this.yaw = 0; this.pitch = 0; this.bob = 0;
    this.eye = new THREE.Vector3();
    this.quat = new THREE.Quaternion();
    this._e = new THREE.Euler(0, 0, 0, 'YXZ');
    this._target = new THREE.Vector3();
  }
  look(dx, dy, sens = 1) {
    this.yaw -= dx * 0.0022 * sens;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.0022 * sens, -1.3, 1.3);
  }
  update(dt, input) {
    const run = input.held('ShiftLeft');
    const speed = run ? RUN : WALK;
    const fwd = (input.held('KeyW') ? 1 : 0) - (input.held('KeyS') ? 1 : 0);
    const str = (input.held('KeyD') ? 1 : 0) - (input.held('KeyA') ? 1 : 0);
    const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    let vx = -sy * fwd + cy * str, vz = -cy * fwd - sy * str;
    const l = Math.hypot(vx, vz); if (l > 1) { vx /= l; vz /= l; }
    this._target.set(vx * speed, 0, vz * speed);
    this.vel.lerp(this._target, Math.min(1, dt * 12));
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;
    const h = this.groundHeight(this.pos.x, this.pos.z);
    this.groundY += (h - this.groundY) * Math.min(1, dt * 9);
    const moving = Math.hypot(this.vel.x, this.vel.z) > 0.3;
    this.bob += dt * (moving ? speed * 1.4 : 0);
    this.eye.set(this.pos.x, this.groundY + EYE + Math.sin(this.bob * 2) * 0.02 * (moving ? 1 : 0), this.pos.z);
    this._e.set(this.pitch, this.yaw, 0);
    this.quat.setFromEuler(this._e);
  }
}
