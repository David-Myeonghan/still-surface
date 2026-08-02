import * as THREE from 'three';

// 발광 에너지 모트(작은 팔면체) + 수집 시 반짝임. Bloom이 발광을 잡는다.
export function buildMotes(scene, motes) {
  const geo = new THREE.OctahedronGeometry(0.35, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x6ff0ff, emissive: 0x39e6ff, emissiveIntensity: 3.5, roughness: 0.3 });
  const group = new THREE.Group();
  const meshes = new Map();
  for (const m of motes) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(m.x, m.y + 1.1, m.z);
    mesh.userData.baseY = m.y + 1.1;
    group.add(mesh); meshes.set(m.id, mesh);
  }
  scene.add(group);

  // 수집 반짝임(짧게 확장·페이드하는 스프라이트풀)
  const sparks = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xbff6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.visible = false; scene.add(s); sparks.push({ s, life: 0 });
  }
  let t = 0;
  return {
    collect(id) {
      const mesh = meshes.get(id); if (!mesh || !mesh.visible) return;
      mesh.visible = false;
      const sp = sparks.find((x) => x.life <= 0) || sparks[0];
      sp.s.position.copy(mesh.position); sp.s.scale.setScalar(1); sp.s.visible = true; sp.life = 0.4;
    },
    update(dt) {
      t += dt;
      for (const mesh of meshes.values()) {
        if (!mesh.visible) continue;
        mesh.rotation.y += dt * 1.5;
        mesh.position.y = mesh.userData.baseY + Math.sin(t * 2 + mesh.position.x) * 0.15;
      }
      for (const sp of sparks) {
        if (sp.life <= 0) continue;
        sp.life -= dt; const p = 1 - sp.life / 0.4;
        sp.s.scale.setScalar(1 + p * 3); sp.s.material.opacity = (1 - p) * 0.8;
        if (sp.life <= 0) sp.s.visible = false;
      }
    },
  };
}
