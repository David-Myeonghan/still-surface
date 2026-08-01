import { mulberry32 } from './rng.js';
import { height } from './terrain.js';

// 시드로 유물 count개를 지형 위에 흩뿌린다. 시작점·서로 최소거리 보장.
export function placeArtifacts(seed, count = 7, opts = {}) {
  const rng = mulberry32(seed);
  const spread = opts.spread ?? 360, minGap = opts.minGap ?? 70, minStart = opts.minStart ?? 60;
  const pts = [];
  let guard = 0;
  while (pts.length < count && guard++ < 20000) {
    const ang = rng() * Math.PI * 2;
    const r = minStart + rng() * (spread - minStart);
    const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
    if (pts.some((p) => Math.hypot(p.x - x, p.z - z) < minGap)) continue;
    pts.push({ id: pts.length, x, z, y: height(x, z, seed), scanned: false });
  }
  return pts;
}
