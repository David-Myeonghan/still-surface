// 시드/시간 순수 헬퍼 (비의존, node:test 대상).
export function dailySeed(ymd) {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < ymd.length; i++) { h ^= ymd.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 1000000000;
}
export function parseSeed(str) {
  if (typeof str !== 'string' || !/^\d+$/.test(str)) return null;
  const n = Number(str);
  return Number.isInteger(n) && n >= 0 && n <= 2147483647 ? n : null;
}
export function formatTime(sec) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const rem = s - m * 60;
  const whole = Math.floor(rem);
  const tenth = Math.floor((rem - whole) * 10);
  return `${m}:${String(whole).padStart(2, '0')}.${tenth}`;
}
export function bestKey(mode) { return `ss:best:${mode}`; }
