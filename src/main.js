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
import { TouchControls } from './ui/TouchControls.js';
import { nearestUnscanned } from './game/compass.js';
import { Finale } from './game/finale.js';
import { Audio } from './audio/Audio.js';
import lore from '../data/lore.js';
import { dailySeed, parseSeed, formatTime, bestKey } from './game/session.js';

const params = new URLSearchParams(location.search);
const ymd = new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD
let MODE = 'free';
let SEED = Math.floor(Math.random() * 1e9);
if (params.has('daily')) { SEED = dailySeed(ymd); MODE = 'daily'; }
else { const s = parseSeed(params.get('seed')); if (s != null) { SEED = s; MODE = 'seed'; } }
const AUTO_START = params.has('daily') || params.get('seed') != null;
const DASH_COST = 2;

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
scene.environmentIntensity = 0.5; // 무드 유지하되 아머가 읽히게

const sky = buildSky(scene, SEED);
scene.add(buildTerrain(SEED));
const artifactObjs = buildArtifacts(scene, SEED);
const avatar = new Avatar();
avatar.load(`${import.meta.env.BASE_URL}models/astronaut.glb`)
  .then(() => { scene.add(avatar.group); })
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
const touch = new TouchControls(input);
const player = new Player((x, z) => height(x, z, SEED)); // 지형 접지
player.pos.set(0, 0, 0);

let last = performance.now();
const MAX_DT = 1 / 15;
let started = false;
let endingShown = false;
let tStart = null;      // 플레이 시작 시각(ms)
let finishMs = null;    // 완료 시각(ms) — 타이머 정지

function tick(now) {
  requestAnimationFrame(tick);
  let dt = (now - last) / 1000; last = now; if (dt > MAX_DT) dt = MAX_DT;
  if (document.hidden) return;
  if (started && finale.active) {
    finale.update(dt, camera);
    for (const o of artifactObjs) o.core.rotation.y += dt * 0.8;
    if (finale.done && !endingShown) {
      endingShown = true;
      const sec = ((finishMs ?? performance.now()) - tStart) / 1000;
      const time = formatTime(sec);
      let best = null, isBest = false;
      try {
        if (MODE === 'daily') {
          const k = bestKey('daily'); const prev = JSON.parse(localStorage.getItem(k) || 'null');
          const cur = prev && prev.ymd === ymd ? prev.sec : null;
          if (cur == null || sec < cur) { isBest = true; localStorage.setItem(k, JSON.stringify({ ymd, sec })); best = formatTime(sec); }
          else best = formatTime(cur);
        } else {
          const k = bestKey('free'); const prev = parseFloat(localStorage.getItem(k) || 'NaN');
          if (Number.isNaN(prev) || sec < prev) { isBest = true; localStorage.setItem(k, String(sec)); best = time; }
          else best = formatTime(prev);
        }
      } catch { /* localStorage 불가 시 무시 */ }
      hud.showEnding({ time, motes: motesCollected, seed: SEED, best, isBest });
    }
    post.render();
    return;
  }

  if (started) {
    const m = input.consumeLook();
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
    const nu = nearestUnscanned(game, { x: player.pos.x, z: player.pos.z });
    touch.setScanAvailable(!!nu && nu.dist <= game.radius);
    const scanning = input.isScan();
    const { justScanned } = tickScan(game, { x: player.pos.x, z: player.pos.z }, scanning, dt);
    audio.scanTone(game.scanning != null && scanning, scanProgress(game));
    if (justScanned != null) {
      const obj = artifactObjs.find((o) => o.id === justScanned);
      if (obj) markScanned(obj);
      hud.showLore(lore[justScanned] || '');
      audio.discovery();
      if (game.status === 'complete') {
        finale.start(player.pos.x, player.pos.z, height(player.pos.x, player.pos.z, SEED));
        hud.enterFinale();
        audio.finale();
        finishMs = performance.now();
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

function begin() {
  document.getElementById('boot').style.display = 'none';
  started = true;
  tStart = performance.now();
  hud.show();
  audio.start();
}
document.getElementById('bootStart').addEventListener('click', begin);
if (AUTO_START) begin(); // 재시작(시드/데일리)은 부팅 스킵. 오디오는 첫 입력에서 resume.

requestAnimationFrame(tick);

const base = location.pathname;
document.getElementById('againBtn').addEventListener('click', () => {
  location.href = `${base}?seed=${Math.floor(Math.random() * 1e9)}`;
});
document.getElementById('dailyBtn').addEventListener('click', () => {
  location.href = `${base}?daily=1`;
});

// E2E 디버그 훅
window.__ssGame = game;
window.__ss = () => ({
  pos: { x: player.pos.x, z: player.pos.z },
  locked: input.locked, started,
  scanned: game.scanned, total: game.total, status: game.status,
  seed: SEED, mode: MODE,
  motes: motesCollected, motesTotal: motes.length,
  y: player.y, grounded: player.grounded, yaw: player.yaw,
  progress: scanProgress(game),
  artifacts: game.artifacts.map((a) => ({ id: a.id, x: a.x, z: a.z, scanned: a.scanned })),
});
window.__teleport = (x, z) => { player.pos.set(x, 0, z); };
window.__motePos = () => motes.map((m) => ({ x: m.x, z: m.z, collected: m.collected }));
window.__avatar = avatar;
window.__audio = audio;
window.__lookAt = (x, z) => { player.yaw = Math.atan2(x - player.pos.x, z - player.pos.z); player.pitch = -0.05; };
