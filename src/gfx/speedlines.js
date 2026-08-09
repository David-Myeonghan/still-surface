import * as THREE from 'three';

// 대시 중 캐릭터 뒤·옆으로 흐르는 바람 선(속도감). 얇은 발광 스트릭 풀 — Bloom이 은은히 잡음.
export function createSpeedLines(scene) {
  const N = 16;
  const geo = new THREE.BoxGeometry(0.022, 0.022, 1); // 길이는 scale.z로 조절
  const items = [];
  const group = new THREE.Group();
  for (let i = 0; i < N; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0xcaf4ff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    }));
    m.visible = false;
    group.add(m);
    items.push({ m, life: 0, max: 0.22 });
  }
  scene.add(group);
  let seed = 12345;
  const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };

  return {
    // pos: {x,y,z} 캐릭터(몸통 근처), dir: 수평 진행 방향(정규화 {x,z}).
    emit(pos, dir, count = 1) {
      const yaw = Math.atan2(dir.x, dir.z); // local +Z 를 진행 방향으로
      const perpx = dir.z, perpz = -dir.x;  // 진행 방향의 수직(좌우)
      for (let k = 0; k < count; k++) {
        const it = items.find((s) => s.life <= 0);
        if (!it) break;
        const side = (rnd() - 0.5) * 1.4; // 좌우 분산(살짝)
        const back = 0.4 + rnd() * 1.2;    // 뒤로
        const up = 0.6 + rnd() * 1.3;      // 몸통~머리 높이
        const len = 1.2 + rnd() * 1.6;     // 선 길이
        it.m.position.set(
          pos.x - dir.x * back + perpx * side,
          pos.y + up,
          pos.z - dir.z * back + perpz * side,
        );
        it.m.rotation.set(0, yaw, 0);
        it.m.scale.set(1, 1, len);
        it.m.material.opacity = 0.3 + rnd() * 0.2;
        it.m.visible = true;
        it.life = it.max;
      }
    },
    update(dt) {
      for (const it of items) {
        if (it.life <= 0) continue;
        it.life -= dt;
        it.m.material.opacity = Math.max(0, it.life / it.max) * 0.45;
        if (it.life <= 0) it.m.visible = false;
      }
    },
  };
}
