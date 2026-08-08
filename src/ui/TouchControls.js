import { joyVector } from '../core/touchMath.js';

const RADIUS = 55;      // 조이스틱 반경(px)
const RUN_MAG = 0.7;    // 이 이상이면 달리기

export function isTouchDevice() {
  return (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches)
    || (typeof window !== 'undefined' && 'ontouchstart' in window);
}

// DOM 터치 제스처 → Input.touch 의도. 터치 기기에서만 활성.
export class TouchControls {
  constructor(input) {
    this.input = input;
    this.enabled = isTouchDevice();
    if (!this.enabled) return;
    this.moveId = null; this.lookId = null; this.lookLast = null;
    this.baseX = 0; this.baseY = 0;
    this._build();
    this._bind();
  }
  _build() {
    const root = document.createElement('div');
    root.id = 'touch';
    root.innerHTML =
      '<div id="tJoy" class="t-joy"><div id="tThumb" class="t-thumb"></div></div>'
      + '<button id="tJump" class="t-btn t-jump">JUMP</button>'
      + '<button id="tScan" class="t-btn t-scan">SCAN</button>';
    document.body.appendChild(root);
    this.joy = root.querySelector('#tJoy');
    this.thumb = root.querySelector('#tThumb');
    this.jumpBtn = root.querySelector('#tJump');
    this.scanBtn = root.querySelector('#tScan');
    this.scanBtn.style.display = 'none';
  }
  _isBtn(tc) { return tc && tc.target && tc.target.closest && tc.target.closest('.t-btn'); }
  _bind() {
    const t = this.input.touch;
    addEventListener('touchstart', (e) => {
      for (const tc of e.changedTouches) {
        if (this._isBtn(tc)) continue; // 버튼 터치는 자체 핸들러가 처리
        const left = tc.clientX < innerWidth / 2;
        if (left && this.moveId === null) {
          this.moveId = tc.identifier; this.baseX = tc.clientX; this.baseY = tc.clientY;
          this.joy.style.display = 'block';
          this.joy.style.left = this.baseX + 'px'; this.joy.style.top = this.baseY + 'px';
          this.thumb.style.transform = 'translate(-50%,-50%)';
          t.active = true;
        } else if (!left && this.lookId === null) {
          this.lookId = tc.identifier; this.lookLast = { x: tc.clientX, y: tc.clientY };
        }
      }
    }, { passive: true });
    addEventListener('touchmove', (e) => {
      for (const tc of e.changedTouches) {
        if (tc.identifier === this.moveId) {
          const v = joyVector(this.baseX, this.baseY, tc.clientX, tc.clientY, RADIUS);
          t.forward = -v.y; t.strafe = v.x; t.run = v.mag >= RUN_MAG;
          this.thumb.style.transform = 'translate(calc(-50% + ' + (v.x * RADIUS) + 'px), calc(-50% + ' + (v.y * RADIUS) + 'px))';
        } else if (tc.identifier === this.lookId && this.lookLast) {
          this.input.addLook(tc.clientX - this.lookLast.x, tc.clientY - this.lookLast.y);
          this.lookLast = { x: tc.clientX, y: tc.clientY };
        }
      }
    }, { passive: true });
    const end = (e) => {
      for (const tc of e.changedTouches) {
        if (tc.identifier === this.moveId) {
          this.moveId = null; t.active = false; t.forward = 0; t.strafe = 0; t.run = false;
          this.joy.style.display = 'none';
        } else if (tc.identifier === this.lookId) { this.lookId = null; this.lookLast = null; }
      }
    };
    addEventListener('touchend', end, { passive: true });
    addEventListener('touchcancel', end, { passive: true });
    this.jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); t.jump = true; }, { passive: false });
    this.jumpBtn.addEventListener('touchend', (e) => { e.preventDefault(); t.jump = false; }, { passive: false });
    this.scanBtn.addEventListener('touchstart', (e) => { e.preventDefault(); t.scan = true; }, { passive: false });
    this.scanBtn.addEventListener('touchend', (e) => { e.preventDefault(); t.scan = false; }, { passive: false });
  }
  setScanAvailable(v) {
    if (!this.enabled) return;
    this.scanBtn.style.display = v ? 'block' : 'none';
    if (!v) this.input.touch.scan = false;
  }
}
