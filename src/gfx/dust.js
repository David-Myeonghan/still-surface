import * as THREE from 'three';

// 착지 먼지: 바닥에 눕힌 링이 커지며 사라진다. 소수 재사용 풀.
export function createDust(scene) {
  const rings = [];
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.5, 24),
      new THREE.MeshBasicMaterial({ color: 0xcaa87a, transparent: true, opacity: 0, depthWrite: false }),
    );
    m.rotation.x = -Math.PI / 2;
    m.visible = false;
    scene.add(m);
    rings.push({ m, t: 0, life: 0 });
  }
  return {
    burst(x, y, z) {
      const r = rings.find((r) => r.life <= 0) || rings[0];
      r.m.position.set(x, y + 0.05, z);
      r.m.scale.setScalar(1);
      r.m.visible = true;
      r.t = 0; r.life = 0.5;
    },
    update(dt) {
      for (const r of rings) {
        if (r.life <= 0) continue;
        r.t += dt; r.life -= dt;
        const p = Math.min(1, r.t / 0.5);
        r.m.scale.setScalar(1 + p * 4);
        r.m.material.opacity = (1 - p) * 0.5;
        if (r.life <= 0) r.m.visible = false;
      }
    },
  };
}
