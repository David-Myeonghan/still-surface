import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { Input } from './core/Input.js';
import { Player } from './core/Player.js';
import { height } from './gen/terrain.js';
import { buildTerrain } from './gfx/terrainMesh.js';
import { buildSky } from './gfx/sky.js';
import { buildArtifacts, markScanned } from './gfx/artifactsGfx.js';
import { Post } from './gfx/postfx.js';
import { createGame, tickScan, scanProgress } from './game/state.js';
import { placeArtifacts } from './gen/artifacts.js';
import lore from '../data/lore.js';

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
const game = createGame(placeArtifacts(SEED), { scanSeconds: 2.5, radius: 7 });

const post = new Post(engine.renderer, scene, camera);

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

    // 스캔 (F 홀드)
    const { justScanned } = tickScan(game, { x: player.pos.x, z: player.pos.z }, input.held('KeyF'), dt);
    if (justScanned != null) {
      const obj = artifactObjs.find((o) => o.id === justScanned);
      if (obj) markScanned(obj);
      onDiscovery(justScanned);
    }
    // 코어 회전(살아있는 느낌) + 스캔 중 강조
    const t = performance.now() * 0.001;
    for (const o of artifactObjs) o.core.rotation.y = t * 0.8;
  }
  post.render();
}

let onDiscovery = (id) => { console.log('discovered', id, lore[id]); };

document.getElementById('bootStart').addEventListener('click', () => {
  document.getElementById('boot').style.display = 'none';
  started = true;
});

requestAnimationFrame(tick);

// E2E 디버그 훅
window.__ssGame = game;
window.__ss = () => ({
  pos: { x: player.pos.x, z: player.pos.z },
  locked: input.locked, started,
  scanned: game.scanned, total: game.total, status: game.status,
  progress: scanProgress(game),
  artifacts: game.artifacts.map((a) => ({ id: a.id, x: a.x, z: a.z, scanned: a.scanned })),
});
window.__teleport = (x, z) => { player.pos.set(x, 0, z); };
window.__lookAt = (x, z) => { player.yaw = Math.atan2(x - player.pos.x, z - player.pos.z); player.pitch = -0.05; };
