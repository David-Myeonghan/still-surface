import { cardLines } from '../game/card.js';

// 1200×630 결과 카드 canvas → PNG Blob.
export async function makeCardBlob(stats) {
  const W = 1200, H = 630;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const L = cardLines(stats);
  // 배경: 노을 그라디언트
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#16244d'); g.addColorStop(1, '#d98a5a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 별 몇 점
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  let s = 7;
  const rnd = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
  for (let i = 0; i < 90; i++) ctx.fillRect(rnd() * W, rnd() * H * 0.55, 2, 2);
  // 빛기둥 느낌(중앙 발광 세로줄)
  const beam = ctx.createLinearGradient(0, 0, 0, H);
  beam.addColorStop(0, 'rgba(191,244,255,0.0)'); beam.addColorStop(0.5, 'rgba(191,244,255,0.55)'); beam.addColorStop(1, 'rgba(191,244,255,0.0)');
  ctx.fillStyle = beam; ctx.fillRect(W / 2 - 4, 40, 8, H - 80);
  // 텍스트
  ctx.textAlign = 'center';
  ctx.fillStyle = '#cfe0ff'; ctx.font = '600 34px system-ui, sans-serif';
  ctx.fillText(L.title, W / 2, 120);
  ctx.fillStyle = '#eaf2ff'; ctx.font = '800 140px system-ui, sans-serif';
  ctx.fillText(L.time, W / 2, 350);
  ctx.fillStyle = '#dfe8ff'; ctx.font = '600 30px system-ui, sans-serif';
  ctx.fillText(L.sub, W / 2, 420);
  if (L.best) { ctx.fillStyle = '#7ff4ff'; ctx.font = '800 34px system-ui, sans-serif'; ctx.fillText(L.best, W / 2, 480); }
  ctx.fillStyle = 'rgba(207,224,255,0.7)'; ctx.font = '400 24px system-ui, sans-serif';
  ctx.fillText(L.foot, W / 2, 590);
  return await new Promise((res) => c.toBlob(res, 'image/png'));
}

// 모바일: Web Share(이미지). 데스크톱/폴백: PNG 다운로드 + 링크 복사.
export async function shareCard(stats, url) {
  const blob = await makeCardBlob(stats);
  const file = new File([blob], 'still-surface.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text: `고요한 표면 — ${stats.time}`, url }); return 'shared'; }
    catch { /* 취소/실패 시 폴백 */ }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'still-surface.png';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  try { await navigator.clipboard.writeText(url); } catch { /* noop */ }
  return 'downloaded';
}
