export function drainDelta(acc) { const d = { x: acc.x, y: acc.y }; acc.x = 0; acc.y = 0; return d; }

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.locked = false;
    this._acc = { x: 0, y: 0 };
    addEventListener('keydown', (e) => this.keys.add(e.code));
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    canvas.addEventListener('mousedown', (e) => { if (e.button === 0 && !this.locked) canvas.requestPointerLock?.(); });
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === canvas; });
    document.addEventListener('mousemove', (e) => { if (this.locked) { this._acc.x += e.movementX; this._acc.y += e.movementY; } });
  }
  held(code) { return this.keys.has(code); }
  consumeMouse() { return drainDelta(this._acc); }
}
