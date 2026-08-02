import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Engine } from './core/Engine.js';
import { Input } from './core/Input.js';
import { Player } from './core/Player.js';
import { height } from './gen/terrain.js';
import { buildTerrain } from './gfx/terrainMesh.js';
import { buildSky } from './gfx/sky.js';
import { buildArtifacts, markScanned } from './gfx/artifactsGfx.js';
import { Avatar } from './gfx/Avatar.js';
import { createDust } from './gfx/dust.js';
import { createBlobShadow } from './gfx/blobShadow.js';
import { placeMotes, collectMotes } from './game/motes.js';
import { buildMotes } from './gfx/motesGfx.js';
import { Post } from './gfx/postfx.js';
import { createGame, tickScan, scanProgress } from './game/state.js';
import { placeArtifacts } from './gen/artifacts.js';
import { HUD } from './ui/HUD.js';
import { Finale } from './game/finale.js';
import { Audio } from './audio/Audio.js';
import lore from '../data/lore.js';

const SEED = 1337;

const engine = new Engine(document.getElementById('scene'));
const { scene, camera } = engine;
scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x3a2c22, 1.0));
const sun = new THREE.DirectionalLight(0xffe6c0, 1.6);
sun.position.set(120, 90, -60);
scene.add(sun);
// 림라이트: 태양 반대쪽에서 실루엣을 배경과 분리(사실감↑).
const rim = new THREE.DirectionalLight(0x88aaff, 0.9);
rim.position.set(-120, 40, 60);
scene.add(rim);
// IBL: PBR 재질(특히 바이저)에 반사 환경. 에셋 없이 RoomEnvironment로 생성.
const pmrem = new THREE.PMREMGenerator(engine.renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35; // 무드 유지: IBL은 은은하게

const sky = buildSky(scene, SEED);
scene.add(buildTerrain(SEED));
const artifactObjs = buildArtifacts(scene, SEED);
const avatar = new Avatar();
avatar.load(`${import.meta.env.BASE_URL}models/astronaut.glb`)
  .then(() => {
    avatar.group.traverse((o) => {
      if (o.isMesh && o.material) { o.material.envMapIntensity = 1.2; o.material.needsUpdate = true; }
    });
    scene.add(avatar.group);
  })
  .catch((e) => console.error('avatar load failed', e));
const dust = createDust(scene);
const blob = createBlobShadow(scene);
const game = createGame(placeArtifacts(SEED), { scanSeconds: 2.5, radius: 7 });
const hud = new HUD();
const motes = placeMotes(SEED, game.artifacts, (x, z) => height(x, z, SEED));
const motesGfx = buildMotes(scene, motes);
let motesCollected = 0;
const finale = new Finale(scene, sky.mat);
const audio = new Audio();

const post = new Post(engine.renderer, scene, camera);

const input = new Input(document.getElementById('scene'));
const player = new Player((x, z) => height(x, z, SEED)); // 지형 접지
player.pos.set(0, 0, 0);

let last = performance.now();
const MAX_DT = 1 / 15;
let started = false;
let endingShown = false;

function tick(now) {
  requestAnimationFrame(tick);
  let dt = (now - last) / 1000; last = now; if (dt > MAX_DT) dt = MAX_DT;
  if (document.hidden) return;
  if (started && finale.active) {
    finale.update(dt, camera);
    for (const o of artifactObjs) o.core.rotation.y += dt * 0.8;
    if (finale.done && !endingShown) { endingShown = true; hud.showEnding(); }
    post.render();
    return;
  }

  if (started) {
    const m = input.consumeMouse();
    player.look(m.x, m.y);
    player.update(dt, input);
    camera.position.copy(player.camPos);
    camera.lookAt(player.headTarget);
    const hs = Math.hypot(player.vel.x, player.vel.z);
    avatar.update(dt, player.pos, player.groundY, player.facing, player.y,
      { speed: hs, running: player.running, grounded: player.grounded });
    blob.update(player.pos.x, player.pos.z, player.groundY, player.y);
    if (player.justJumped) audio.jump();
    if (player.justLanded) { audio.land(); dust.burst(player.pos.x, player.groundY, player.pos.z); }
    dust.update(dt);

    // 에너지 모트 수집(빵부스러기)
    const got = collectMotes(motes, { x: player.pos.x, z: player.pos.z }, 3.5);
    if (got > 0) {
      motesCollected += got;
      for (const m of motes) if (m.collected) motesGfx.collect(m.id);
      audio.mote();
      hud.setMotes(motesCollected);
    }
    motesGfx.update(dt);
    const targetFov = player.running ? 82 : 68;
    if (Math.abs(camera.fov - targetFov) > 0.1) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 6);
      camera.updateProjectionMatrix();
    }

    // 스캔 (F 홀드)
    const holdingF = input.held('KeyF');
    const { justScanned } = tickScan(game, { x: player.pos.x, z: player.pos.z }, holdingF, dt);
    audio.scanTone(game.scanning != null && holdingF, scanProgress(game));
    if (justScanned != null) {
      const obj = artifactObjs.find((o) => o.id === justScanned);
      if (obj) markScanned(obj);
      hud.showLore(lore[justScanned] || '');
      audio.discovery();
      if (game.status === 'complete') {
        finale.start(player.pos.x, player.pos.z, height(player.pos.x, player.pos.z, SEED));
        hud.enterFinale();
        audio.finale();
        avatar.setVisible(false);
        blob.update(0, 0, -9999, 0); // 화면 밖으로
      }
    }
    // 코어 회전(살아있는 느낌)
    const t = performance.now() * 0.001;
    for (const o of artifactObjs) o.core.rotation.y = t * 0.8;

    hud.update(game, player, dt);
  }
  post.render();
}

document.getElementById('bootStart').addEventListener('click', () => {
  document.getElementById('boot').style.display = 'none';
  started = true;
  hud.show();
  audio.start();
});

requestAnimationFrame(tick);

// E2E 디버그 훅
window.__ssGame = game;
window.__ss = () => ({
  pos: { x: player.pos.x, z: player.pos.z },
  locked: input.locked, started,
  scanned: game.scanned, total: game.total, status: game.status,
  motes: motesCollected, motesTotal: motes.length,
  progress: scanProgress(game),
  artifacts: game.artifacts.map((a) => ({ id: a.id, x: a.x, z: a.z, scanned: a.scanned })),
});
window.__teleport = (x, z) => { player.pos.set(x, 0, z); };
window.__motePos = () => motes.map((m) => ({ x: m.x, z: m.z, collected: m.collected }));
window.__lookAt = (x, z) => { player.yaw = Math.atan2(x - player.pos.x, z - player.pos.z); player.pitch = -0.05; };
