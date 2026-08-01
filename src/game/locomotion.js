// 이동/카메라/각도 순수 수학 (Three 비의존, node:test 대상).

// 카메라 방위 yaw 기준 수평 이동 방향. fwd=+W/-S, str=+D/-A. 크기 1로 정규화.
export function moveDir(fwd, str, yaw) {
  const sy = Math.sin(yaw), cy = Math.cos(yaw);
  let x = -sy * fwd + cy * str;
  let z = -cy * fwd - sy * str;
  const l = Math.hypot(x, z);
  if (l > 1e-9) { x /= l; z /= l; } else { x = 0; z = 0; }
  return { x, z };
}

// cur → target 최단각 보간(계수 t는 0..1로 클램프). ±π 랩 안전.
export function stepAngle(cur, target, t) {
  const k = Math.max(0, Math.min(1, t));
  let d = target - cur;
  d = Math.atan2(Math.sin(d), Math.cos(d)); // (-π, π]
  return cur + d * k;
}

// 타깃점 뒤(yaw 반대)·위(pitch)로 dist 떨어진 카메라 위치.
export function thirdPersonCam(tx, ty, tz, yaw, pitch, dist) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  return {
    x: tx + Math.sin(yaw) * dist * cp,
    y: ty + sp * dist,
    z: tz + Math.cos(yaw) * dist * cp,
  };
}
