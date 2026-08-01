export function nearestUnscanned(state, pos) {
  let best = null, bd = Infinity;
  for (const a of state.artifacts)
    if (!a.scanned) { const d = Math.hypot(a.x - pos.x, a.z - pos.z); if (d < bd) { bd = d; best = a; } }
  if (!best) return null;
  return { id: best.id, dist: bd, angle: Math.atan2(best.x - pos.x, best.z - pos.z) };
}
