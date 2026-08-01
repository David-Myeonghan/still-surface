import * as THREE from 'three';
import { placeArtifacts } from '../gen/artifacts.js';

// 유물 발광 비콘: 지형 위 발광 코어 + 위로 뻗는 빛기둥(멀리서도 보임 → 유혹).
export function buildArtifacts(scene, seed) {
  const list = placeArtifacts(seed);
  const objs = [];
  for (const a of list) {
    const group = new THREE.Group();
    group.position.set(a.x, a.y, a.z);

    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.6, 0),
      new THREE.MeshStandardMaterial({ color: 0x6ff0ff, emissive: 0x2fd6ff, emissiveIntensity: 3.2, roughness: 0.3, metalness: 0.1 }),
    );
    core.position.y = 2.6;

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 1.4, 140, 14, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x3fe0ff, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, fog: false }),
    );
    beam.position.y = 70;

    const light = new THREE.PointLight(0x4fe0ff, 8, 40, 2);
    light.position.y = 3;

    group.add(core); group.add(beam); group.add(light);
    scene.add(group);
    objs.push({ id: a.id, x: a.x, z: a.z, group, core, beam, light });
  }
  return objs;
}

// 스캔 완료 시 시각 반응: 색을 따뜻하게 바꾸고 밝게 개화.
export function markScanned(obj) {
  obj.core.material.emissive.setHex(0xffd07a);
  obj.core.material.color.setHex(0xffe6b0);
  obj.core.material.emissiveIntensity = 4.5;
  obj.beam.material.color.setHex(0xffcf7a);
  obj.beam.material.opacity = 0.28;
  obj.light.color.setHex(0xffcf7a);
}
