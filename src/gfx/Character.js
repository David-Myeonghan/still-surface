import * as THREE from 'three';

// Three 프리미티브만으로 조립한 로우폴리 우주인. 기본 자세는 -Z를 바라본다.
export function buildCharacter() {
  const group = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({ color: 0xdfe6f2, roughness: 0.75, metalness: 0.1 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x2a3350, roughness: 0.6 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x0b1020, emissive: 0x5fe8ff, emissiveIntensity: 1.6, roughness: 0.2 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.30, 0.48, 4, 12), suit);
  torso.position.y = 1.12;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), suit);
  head.position.y = 1.68;

  // 바이저: 머리 앞(-Z)에 붙는 발광 구 조각
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 10), visorMat);
  visor.position.set(0, 1.66, -0.14);
  visor.scale.set(1, 0.75, 0.6);

  // 등짐(백팩) — 뒤(+Z)
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.5, 0.2), accent);
  pack.position.set(0, 1.15, 0.24);

  // 어깨/엉덩이에서 회전하는 팔다리 그룹(피벗이 위쪽 끝)
  const limb = (len, r, mat) => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 8), mat);
    m.position.y = -(len / 2 + r); // 피벗을 위 끝으로
    g.add(m);
    return g;
  };
  const legL = limb(0.58, 0.12, suit); legL.position.set(-0.15, 0.70, 0);
  const legR = limb(0.58, 0.12, suit); legR.position.set(0.15, 0.70, 0);
  const armL = limb(0.48, 0.10, suit); armL.position.set(-0.40, 1.38, 0);
  const armR = limb(0.48, 0.10, suit); armR.position.set(0.40, 1.38, 0);

  group.add(torso, head, visor, pack, legL, legR, armL, armR);
  return { group, parts: { torso, head, legL, legR, armL, armR } };
}

// 보폭 위상으로 달리기 사이클. moving=false면 팔다리 중립.
export function animateRun(parts, stride, moving, running) {
  const amp = running ? 0.95 : 0.6;
  const s = moving ? Math.sin(stride) : 0;
  parts.legL.rotation.x = s * amp;
  parts.legR.rotation.x = -s * amp;
  parts.armL.rotation.x = -s * amp * 0.8;
  parts.armR.rotation.x = s * amp * 0.8;
  const lean = running && moving ? 0.22 : moving ? 0.08 : 0;
  parts.torso.rotation.x = lean;
  parts.head.rotation.x = -lean * 0.5;
}
