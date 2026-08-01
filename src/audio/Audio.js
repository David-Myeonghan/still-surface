// 순수 WebAudio 사운드(무의존). 유저 제스처(탐사 시작) 이후에만 resume.
export class Audio {
  constructor() {
    this.ctx = null; this.master = null; this.drone = null; this._scanOsc = null; this.ready = false;
  }
  // bootStart 클릭 시 호출 — AudioContext는 제스처 이후 생성/resume해야 함.
  start() {
    if (this.ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0;
    this.master.connect(this.ctx.destination);
    this.master.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 2.0);
    this._buildDrone();
    this.ready = true;
  }
  _buildDrone() {
    const ctx = this.ctx;
    const bus = ctx.createGain(); bus.gain.value = 0.16; bus.connect(this.master);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 0.6; lp.connect(bus);
    // 저역 드론 3음(살짝 디튠) — 외계 바람 같은 지속음
    for (const [f, d] of [[55, 0], [55, 0.4], [82.5, -0.3]]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d * 10;
      const g = ctx.createGain(); g.gain.value = 0.5; o.connect(g); g.connect(lp); o.start();
    }
    // 느린 LFO로 필터 흔들기(살아있는 느낌)
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
    const lg = ctx.createGain(); lg.gain.value = 120; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    this.drone = bus;
  }
  // 스캔 중: progress(0..1)에 따라 상승하는 톤. holding=false면 정지.
  scanTone(holding, progress) {
    if (!this.ready) return;
    const ctx = this.ctx;
    if (holding && !this._scanOsc) {
      const o = ctx.createOscillator(); o.type = 'triangle';
      const g = ctx.createGain(); g.gain.value = 0.0;
      o.connect(g); g.connect(this.master);
      o.start(); g.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.08);
      this._scanOsc = { o, g };
    }
    if (this._scanOsc) {
      if (holding) {
        this._scanOsc.o.frequency.setTargetAtTime(330 + progress * 550, ctx.currentTime, 0.05);
      } else {
        const { o, g } = this._scanOsc; this._scanOsc = null;
        g.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        o.stop(ctx.currentTime + 0.3);
      }
    }
  }
  // 발견 차임: 따뜻한 3화음 아르페지오.
  discovery() {
    if (!this.ready) return;
    const ctx = this.ctx, t0 = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); const t = t0 + i * 0.09;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 1.0);
    });
  }
  // 피날레 스웰: 밝은 화음이 서서히 부풀어오름.
  finale() {
    if (!this.ready) return;
    const ctx = this.ctx, t0 = ctx.currentTime;
    const bus = ctx.createGain(); bus.gain.value = 0; bus.connect(this.master);
    bus.gain.linearRampToValueAtTime(0.4, t0 + 4);
    [261.63, 329.63, 392.0, 523.25].forEach((f) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = 0.25; o.connect(g); g.connect(bus); o.start(t0);
    });
  }
}
