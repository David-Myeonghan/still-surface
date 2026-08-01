import * as THREE from 'three';

// 그라디언트 하늘 돔 + 지수 안개(드로우거리 제한 → 능선 너머 팝인) + 별.
export function buildSky(scene, seed = 1) {
  const top = new THREE.Color(0x16244d), bot = new THREE.Color(0xd98a5a); // 외계 노을
  const geo = new THREE.SphereGeometry(2000, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTop: { value: top }, uBot: { value: bot } },
    vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `varying vec3 vP; uniform vec3 uTop,uBot;
      void main(){ float t=clamp(normalize(vP).y*0.6+0.35,0.0,1.0); gl_FragColor=vec4(mix(uBot,uTop,t),1.0);}`,
  });
  const dome = new THREE.Mesh(geo, mat);
  scene.add(dome);

  scene.fog = new THREE.FogExp2(0xb07a5a, 0.0016);

  // 별
  const N = 1400, pos = new Float32Array(N * 3);
  let s = (seed * 9301 + 49297) >>> 0;
  const rnd = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
  for (let i = 0; i < N; i++) {
    const r = 1900, u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, w = Math.sqrt(1 - u * u);
    pos[i * 3] = r * w * Math.cos(a);
    pos[i * 3 + 1] = r * Math.abs(u) * 0.85 + 40;
    pos[i * 3 + 2] = r * w * Math.sin(a);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfe0ff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.9, fog: false }));
  scene.add(stars);

  return { dome, mat };
}
