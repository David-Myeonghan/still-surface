import * as THREE from 'three';
import { height } from '../gen/terrain.js';

// 지형 메시. 정점 높이를 CPU height()로 직접 구워 발밑(접지)과 픽셀이 완전히 일치.
export function buildTerrain(seed, { size = 900, seg = 300 } = {}) {
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2); // XZ 평면
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, height(x, z, seed));
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();

  // 고도에 따라 색을 섞는 간단 버텍스 컬러 (모래→바위)
  const colors = new Float32Array(p.count * 3);
  const low = new THREE.Color(0x7a5c3a), high = new THREE.Color(0x9a8b73);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const t = THREE.MathUtils.clamp((p.getY(i) + 8) / 30, 0, 1);
    c.copy(low).lerp(high, t);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}
