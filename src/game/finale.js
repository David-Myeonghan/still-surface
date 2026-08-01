import * as THREE from 'three';

// 7개 완료 시 피날레: 카메라가 상승하며 하늘이 밝게 열리고 빛의 문이 나타난다.
export class Finale {
  constructor(scene, skyMat) {
    this.scene = scene; this.skyMat = skyMat;
    this.active = false; this.done = false; this.t = 0; this.DUR = 8;
    this._skyTop0 = skyMat ? skyMat.uniforms.uTop.value.clone() : null;
    this._skyBot0 = skyMat ? skyMat.uniforms.uBot.value.clone() : null;
    // 빛의 문 (발광 링) — 시작 시 씬에 추가
    this.gate = new THREE.Mesh(
      new THREE.TorusGeometry(18, 1.6, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0xbff4ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.gate.visible = false;
  }
  start(centerX, centerZ, groundY) {
    if (this.active) return;
    this.active = true; this.t = 0;
    this.gate.position.set(centerX, groundY + 40, centerZ);
    this.gate.rotation.x = Math.PI / 2;
    this.gate.visible = true;
    this.scene.add(this.gate);
  }
  // 카메라를 제어(상승·문 응시). 정규화 시간 p로 보간.
  update(dt, camera) {
    if (!this.active) return;
    this.t += dt;
    const p = Math.min(1, this.t / this.DUR);
    // 하늘 개화: 밝은 청백으로 보간
    if (this.skyMat) {
      this.skyMat.uniforms.uTop.value.copy(this._skyTop0).lerp(new THREE.Color(0x9fe8ff), p * 0.9);
      this.skyMat.uniforms.uBot.value.copy(this._skyBot0).lerp(new THREE.Color(0xffffff), p * 0.7);
    }
    // 문: 커지고 밝아지며 회전
    const gp = THREE.MathUtils.smoothstep(p, 0.1, 0.8);
    this.gate.material.opacity = gp;
    this.gate.scale.setScalar(0.4 + gp * 2.2);
    this.gate.rotation.z += dt * 0.4;
    // 카메라 상승하며 문을 바라봄
    const c = this.gate.position;
    const eyeY = 2 + p * 60;
    camera.position.set(c.x - Math.sin(this.t * 0.2) * 30, c.y - 40 + eyeY, c.z + 40 - p * 20);
    camera.lookAt(c);
    if (p >= 1) this.done = true;
  }
}
