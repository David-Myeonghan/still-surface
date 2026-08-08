// 동적 조이스틱 벡터(순수). 화면좌표(아래 +Y). 소비측이 forward = -y 로 매핑.
export function joyVector(baseX, baseY, curX, curY, radius, deadzone = 0.15) {
  const dx = curX - baseX, dy = curY - baseY;
  const mag = Math.min(1, Math.hypot(dx, dy) / radius);
  if (mag < deadzone) return { x: 0, y: 0, mag: 0 };
  const clamp = (v) => Math.max(-1, Math.min(1, v / radius));
  return { x: clamp(dx), y: clamp(dy), mag };
}
