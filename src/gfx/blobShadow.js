import * as THREE from 'three';

// 발밑 접지 그림자(방사형 그라디언트 평면). 에셋 없이 캔버스로 텍스처 생성.
export function createBlobShadow(scene) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
  g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.2),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 2;
  scene.add(mesh);
  return {
    update(x, z, groundY, y) {
      mesh.position.set(x, groundY + 0.03, z);
      const k = Math.max(0.2, 1 - y * 0.12); // 점프하면 작아지고 옅어짐
      mesh.scale.setScalar(k);
      mesh.material.opacity = k;
    },
  };
}
