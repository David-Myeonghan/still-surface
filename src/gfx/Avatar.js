import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const FADE = 0.2;

// 클립 이름 정규화: Mixamo("mixamo.com")·"Armature|Run" 등을 표준 상태명으로.
function normalize(rawName, only) {
  const n = rawName.split('|').pop().toLowerCase();
  if (n.includes('jump')) return n.includes('idle') || n.includes('fall') ? 'Jump_Idle' : 'Jump';
  if (n.includes('run')) return 'Run';
  if (n.includes('walk')) return 'Walk';
  if (n.includes('idle')) return 'Idle';
  return only ? 'Run' : rawName; // 클립이 하나뿐이면 Run으로 간주
}

// 상태별 폴백 체인(원하는 클립이 없으면 대체).
const FALLBACK = {
  Run: ['Run', 'Walk', 'Idle'],
  Walk: ['Walk', 'Run', 'Idle'],
  Idle: ['Idle', 'Walk', 'Run'],
  Jump_Idle: ['Jump_Idle', 'Jump', 'Run', 'Idle'],
  Jump: ['Jump', 'Jump_Idle', 'Run', 'Idle'],
};

// 리깅된 GLTF 아바타 로드 + 상태 기반 애니메이션 크로스페이드.
export class Avatar {
  // Idle 클립이 없을 때 Run 클립에서 '서 있는' 느낌에 가장 가까운 정지 프레임(0~1).
  static IDLE_FRAC = 0.0;
  constructor() {
    this.ready = false;
    this.group = null;
    this.mixer = null;
    this.actions = {};
    this.current = null;
    this.currentName = null;
  }
  async load(url) {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url);
    const model = gltf.scene;
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.frustumCulled = false;
      if (/pistol|gun|weapon|blaster/i.test(o.name)) o.visible = false;
      // Mixamo 재질은 metalness 기본 1.0이라 어두운 환경광에서 새까매짐 → 디퓨즈로.
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m) continue;
        m.metalness = 0.25; m.roughness = 0.55; m.envMapIntensity = 1.6; // 아머에 환경 하이라이트
        m.needsUpdate = true;
      }
    });
    this.group = model;
    this.mixer = new THREE.AnimationMixer(model);
    const only = gltf.animations.length === 1;
    for (const clip of gltf.animations) {
      this.actions[normalize(clip.name, only)] = this.mixer.clipAction(clip);
    }
    this.current = this.actions.Idle || this.actions.Run || Object.values(this.actions)[0];
    if (this.current) this.current.play();
    this.ready = true;
  }
  _resolve(name) {
    for (const n of (FALLBACK[name] || [name])) if (this.actions[n]) return n;
    return Object.keys(this.actions)[0];
  }
  _setState(name) {
    const resolved = this._resolve(name);
    if (!resolved || resolved === this.currentName) return { resolved };
    const next = this.actions[resolved];
    next.reset().play();
    if (this.current) this.current.crossFadeTo(next, FADE, false);
    this.current = next; this.currentName = resolved;
    return { resolved };
  }
  update(dt, pos, groundY, facing, y, info) {
    if (!this.ready) return;
    const want = !info.grounded ? 'Jump_Idle'
      : info.speed > 6 ? 'Run'
      : info.speed > 0.3 ? 'Walk'
      : 'Idle';
    const { resolved } = this._setState(want);
    const cur = this.current;
    if (cur) {
      // 진짜 Idle 클립이 없어 Run으로 대체하는 경우: 재생을 멈춰 '가만히 서 있게'.
      const fakingIdle = want === 'Idle' && resolved !== 'Idle';
      if (fakingIdle) {
        cur.paused = true;
        cur.time = Avatar.IDLE_FRAC * cur.getClip().duration;
      } else {
        cur.paused = false;
        cur.timeScale = 1;
      }
    }
    this.group.position.set(pos.x, groundY + y, pos.z);
    this.group.rotation.y = facing + Math.PI; // 이 모델 기본 전방 = +Z → 진행 방향으로 보정
    this.mixer.update(dt);
  }
  setVisible(v) { if (this.group) this.group.visible = v; }
}
