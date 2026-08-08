export function drainDelta(acc) { const d = { x: acc.x, y: acc.y }; acc.x = 0; acc.y = 0; return d; }

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.locked = false;
    this._acc = { x: 0, y: 0 };
    // 터치 의도(TouchControls가 기록). active=false면 키보드 사용.
    this.touch = { active: false, forward: 0, strafe: 0, run: false, jump: false, scan: false };
    this._dash = false;
    addEventListener('keydown', (e) => { this.keys.add(e.code); if (e.code === 'KeyE' && !e.repeat) this._dash = true; });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    canvas.addEventListener('mousedown', (e) => { if (e.button === 0 && !this.locked) canvas.requestPointerLock?.(); });
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === canvas; });
    document.addEventListener('mousemove', (e) => { if (this.locked) { this._acc.x += e.movementX; this._acc.y += e.movementY; } });
  }
  held(code) { return this.keys.has(code); }
  addLook(dx, dy) { this._acc.x += dx; this._acc.y += dy; }
  consumeLook() { return drainDelta(this._acc); }
  consumeMouse() { return this.consumeLook(); } // 하위 호환 별칭
  getMove() {
    if (this.touch.active) {
      return { forward: this.touch.forward, strafe: this.touch.strafe, run: this.touch.run };
    }
    const forward = (this.held('KeyW') ? 1 : 0) - (this.held('KeyS') ? 1 : 0);
    const strafe = (this.held('KeyD') ? 1 : 0) - (this.held('KeyA') ? 1 : 0);
    return { forward, strafe, run: this.held('ShiftLeft') };
  }
  isJump() { return this.held('Space') || this.touch.jump; }
  isScan() { return this.held('KeyF') || this.touch.scan; }
  dashPulse() { this._dash = true; }
  consumeDash() { const d = this._dash; this._dash = false; return d; }
}
