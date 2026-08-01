import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { Input } from './core/Input.js';
import { Player } from './core/Player.js';

const engine = new Engine(document.getElementById('scene'));
const { scene, camera } = engine;
scene.background = new THREE.Color(0x0a0e1a);
scene.add(new THREE.HemisphereLight(0x88aaff, 0x223344, 1.1));
const sun = new THREE.DirectionalLight(0xfff2d8, 1.4);
sun.position.set(60, 80, 30);
scene.add(sun);

// 임시 참조 큐브들 (이동감 확인용, T9에서 지형으로 교체)
const flat = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x2a3550 }));
flat.rotateX(-Math.PI / 2);
scene.add(flat);
for (let i = 0; i < 40; i++) {
  const c = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({ color: 0x6ff0ff }));
  c.position.set((Math.random() - 0.5) * 200, 1, (Math.random() - 0.5) * 200);
  scene.add(c);
}

const input = new Input(document.getElementById('scene'));
const player = new Player(() => 0); // 평지 (T9에서 terrain 주입)

let last = performance.now();
const MAX_DT = 1 / 15;
let started = false;

function tick(now) {
  requestAnimationFrame(tick);
  let dt = (now - last) / 1000; last = now; if (dt > MAX_DT) dt = MAX_DT;
  if (document.hidden) return;
  if (started) {
    const m = input.consumeMouse();
    player.look(m.x, m.y);
    player.update(dt, input);
    camera.position.copy(player.eye);
    camera.quaternion.copy(player.quat);
  }
  engine.render();
}

document.getElementById('bootStart').addEventListener('click', () => {
  document.getElementById('boot').style.display = 'none';
  started = true;
});

requestAnimationFrame(tick);

// E2E 디버그 훅
window.__ss = () => ({ pos: { x: player.pos.x, z: player.pos.z }, locked: input.locked, started });
