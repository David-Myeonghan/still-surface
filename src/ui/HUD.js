import { nearestUnscanned } from '../game/compass.js';
import { scanProgress } from '../game/state.js';

const RING_LEN = 2 * Math.PI * 44; // stroke-dasharray

export class HUD {
  constructor() {
    const g = (id) => document.getElementById(id);
    this.root = g('hud');
    this.progress = g('progress'); this.needle = g('needle'); this.cdist = g('cdist');
    this.prompt = g('prompt'); this.ring = g('ring'); this.rfill = g('rfill');
    this.lore = g('lore'); this.ending = g('ending');
    this.rfill.style.strokeDasharray = `${RING_LEN}`;
    this._loreTimer = 0;
  }
  show() { this.root.classList.add('on'); }
  update(game, player, dt) {
    this.progress.textContent = `${game.scanned} / ${game.total}`;
    // 나침반: 가장 가까운 미스캔 방향을 플레이어 시야 기준으로 회전
    const n = nearestUnscanned(game, { x: player.pos.x, z: player.pos.z });
    if (n) {
      const rel = n.angle - player.yaw; // 화면 기준 각(위=정면)
      this.needle.style.transform = `rotate(${rel}rad)`;
      this.cdist.textContent = `${Math.round(n.dist)}m`;
    } else { this.cdist.textContent = ''; }
    // 프롬프트 (근처 미스캔 유물)
    const near = n && n.dist <= game.radius;
    this.prompt.classList.toggle('on', !!near && game.scanning == null);
    // 스캔 링
    const p = scanProgress(game);
    this.ring.classList.toggle('on', p > 0);
    this.rfill.style.strokeDashoffset = `${RING_LEN * (1 - p)}`;
    // 로어 카드 페이드아웃
    if (this._loreTimer > 0) { this._loreTimer -= dt; if (this._loreTimer <= 0) this.lore.classList.remove('on'); }
  }
  showLore(text) { this.lore.textContent = text; this.lore.classList.add('on'); this._loreTimer = 6; }
  showEnding() { this.ending.classList.add('on'); }
}
