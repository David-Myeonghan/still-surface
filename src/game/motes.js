import { mulberry32 } from '../gen/rng.js';

// (0,0)에서 최근접 이웃 순으로 유물을 방문하는 경로.
function tour(artifacts) {
  const rest = artifacts.map((a) => ({ x: a.x, z: a.z }));
  const path = []; let cx = 0, cz = 0;
  while (rest.length) {
    let bi = 0, bd = Infinity;
    for (let k = 0; k < rest.length; k++) {
      const d = (rest[k].x - cx) ** 2 + (rest[k].z - cz) ** 2;
      if (d < bd) { bd = d; bi = k; }
    }
    const n = rest.splice(bi, 1)[0]; path.push(n); cx = n.x; cz = n.z;
  }
  return path;
}

// 유물을 잇는 경로를 따라 step 간격 + 지터로 에너지 모트 배치. 결정론(seed).
export function placeMotes(seed, artifacts, hfn, opts = {}) {
  const step = opts.step ?? 11, jitter = opts.jitter ?? 6, edge = opts.edge ?? 18;
  const rnd = mulberry32(seed >>> 0);
  const pts = tour(artifacts);
  const motes = [];
  let px = 0, pz = 0; let id = 0;
  for (const p of pts) {
    const dx = p.x - px, dz = p.z - pz, len = Math.hypot(dx, dz);
    const ux = dx / (len || 1), uz = dz / (len || 1);
    // 유물 근처는 비워 둠(edge). 세그먼트 안쪽만 채움.
    for (let d = edge; d < len - edge; d += step) {
      const jx = (rnd() - 0.5) * 2 * jitter, jz = (rnd() - 0.5) * 2 * jitter;
      const x = px + ux * d + jx, z = pz + uz * d + jz;
      motes.push({ id: id++, x, z, y: hfn(x, z), collected: false });
    }
    px = p.x; pz = p.z;
  }
  return motes;
}

// pos 반경 내 미수집 모트를 collected 처리, 새로 수집 개수 반환.
export function collectMotes(motes, pos, radius) {
  let n = 0; const r2 = radius * radius;
  for (const m of motes) {
    if (m.collected) continue;
    if ((m.x - pos.x) ** 2 + (m.z - pos.z) ** 2 <= r2) { m.collected = true; n++; }
  }
  return n;
}
