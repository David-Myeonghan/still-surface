import * as THREE from 'three';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(2, devicePixelRatio));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e1a);
const cam = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 2000);
cam.position.set(0, 2, 5);
scene.add(new THREE.HemisphereLight(0x88aaff, 0x223344, 1.0));

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
});

function tick() {
  requestAnimationFrame(tick);
  renderer.render(scene, cam);
}

document.getElementById('bootStart').addEventListener('click', () => {
  document.getElementById('boot').style.display = 'none';
});

tick();
