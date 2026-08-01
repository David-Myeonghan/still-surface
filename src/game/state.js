export function createGame(artifacts, opts = {}) {
  return {
    artifacts: artifacts.map((a) => ({ ...a })),
    scanning: null, scanT: 0, scanned: 0,
    total: opts.total ?? artifacts.length,
    scanSeconds: opts.scanSeconds ?? 2.5, radius: opts.radius ?? 5,
    status: 'exploring',
  };
}

export function nearestScannable(state, pos) {
  let best = null, bd = Infinity;
  for (const a of state.artifacts)
    if (!a.scanned) { const d = Math.hypot(a.x - pos.x, a.z - pos.z); if (d <= state.radius && d < bd) { bd = d; best = a; } }
  return best;
}

export function tickScan(state, pos, holding, dt) {
  const target = nearestScannable(state, pos);
  if (holding && target) {
    if (state.scanning !== target.id) { state.scanning = target.id; state.scanT = 0; }
    state.scanT += dt;
    if (state.scanT >= state.scanSeconds) {
      const a = state.artifacts.find((x) => x.id === target.id);
      a.scanned = true; state.scanned += 1; state.scanning = null; state.scanT = 0;
      if (state.scanned >= state.total) state.status = 'complete';
      return { justScanned: a.id };
    }
  } else { state.scanning = null; state.scanT = 0; }
  return { justScanned: null };
}

export function scanProgress(state) { return state.scanning != null ? state.scanT / state.scanSeconds : 0; }
