import { hash2 } from './rng.js';

function valueNoise(x, z, seed) {
  const x0 = Math.floor(x), z0 = Math.floor(z);
  const fx = x - x0, fz = z - z0;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const n00 = hash2(x0, z0, seed), n10 = hash2(x0 + 1, z0, seed);
  const n01 = hash2(x0, z0 + 1, seed), n11 = hash2(x0 + 1, z0 + 1, seed);
  const nx0 = n00 + (n10 - n00) * sx, nx1 = n01 + (n11 - n01) * sx;
  return nx0 + (nx1 - nx0) * sz; // [0,1)
}

// 지형 높이(미터). 이 함수가 유일한 진실 — 발밑 접지와 지형 메시 정점 양쪽에 쓰인다.
export function height(x, z, seed = 1337) {
  let amp = 1, freq = 1 / 55, sum = 0, norm = 0;
  for (let o = 0; o < 5; o++) {
    sum += valueNoise(x * freq, z * freq, seed + o * 17) * amp;
    norm += amp; amp *= 0.5; freq *= 2.0;
  }
  return (sum / norm) * 30 - 8;
}
