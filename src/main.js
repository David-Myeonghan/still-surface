import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { Input } from './core/Input.js';
import { Player } from './core/Player.js';
import { height } from './gen/terrain.js';
import { buildTerrain } from './gfx/terrainMesh.js';
import { buildSky } from './gfx/sky.js';
import { buildArtifacts } from './gfx/artifactsGfx.js';

const SEED = 1337;

const engine = new Engine(document.getElementById('scene'));
const { scene, camera } = engine;
scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x3a2c22, 1.0));
const sun = new THREE.DirectionalLight(0xffe6c0, 1.6);
sun.position.set(120, 90, -60);
scene.add(sun);

buildSky(scene, SEED);
scene.add(buildTerrain(SEED));
const artifactObjs = buildArtifacts(scene, SEED);

const input = new Input(document.getElementById('scene'));
const player = new Player((x, z) => height(x, z, SEED)); // 지형 접지
player.pos.set(0, 0, 0);

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
window.__ss = () => ({
  pos: { x: player.pos.x, z: player.pos.z },
  locked: input.locked, started,
  artifacts: artifactObjs.map((o) => ({ id: o.id, x: o.x, z: o.z })),
});
window.__teleport = (x, z) => { player.pos.set(x, 0, z); };
window.__lookAt = (x, z) => { player.yaw = Math.atan2(x - player.pos.x, z - player.pos.z); player.pitch = -0.05; };
