import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const FADE = 0.25;

// 리깅된 GLTF 아바타 로드 + 상태 기반 애니메이션 크로스페이드.
export class Avatar {
  constructor() {
    this.ready = false;
    this.group = null;
    this.mixer = null;
    this.actions = {};
    this.current = null;
  }
  async load(url) {
    const gltf = await new GLTFLoader().loadAsync(url);
    const model = gltf.scene;
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.frustumCulled = false;
      if (/pistol|gun|weapon|blaster/i.test(o.name)) o.visible = false; // 탐험가엔 무기 불필요
    });
    this.group = model;
    this.mixer = new THREE.AnimationMixer(model);
    for (const clip of gltf.animations) {
      const name = clip.name.split('|').pop(); // "CharacterArmature|Run" -> "Run"
      this.actions[name] = this.mixer.clipAction(clip);
    }
    this.current = this.actions.Idle || Object.values(this.actions)[0];
    if (this.current) this.current.play();
    this.ready = true;
  }
  _setState(name) {
    const next = this.actions[name];
    if (!next || next === this.current) return;
    next.reset().play();
    if (this.current) this.current.crossFadeTo(next, FADE, false);
    this.current = next;
  }
  update(dt, pos, groundY, facing, y, info) {
    if (!this.ready) return;
    const name = !info.grounded ? (this.actions.Jump_Idle ? 'Jump_Idle' : 'Jump')
      : info.speed > 6 ? 'Run'
      : info.speed > 0.3 ? 'Walk'
      : 'Idle';
    this._setState(name);
    this.group.position.set(pos.x, groundY + y, pos.z);
    this.group.rotation.y = facing + Math.PI; // 이 모델의 기본 전방은 +Z
    this.mixer.update(dt);
  }
  setVisible(v) { if (this.group) this.group.visible = v; }
}
