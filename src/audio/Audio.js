// 무음 WAV 데이터 URI 생성(에셋 없이). iOS 미디어 채널 승격용.
function silentWav(seconds = 0.4, rate = 8000) {
  const n = Math.floor(seconds * rate);
  const bytes = 44 + n * 2;
  const buf = new ArrayBuffer(bytes); const dv = new DataView(buf);
  const wr = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  wr(0, 'RIFF'); dv.setUint32(4, bytes - 8, true); wr(8, 'WAVE'); wr(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true);
  dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); wr(36, 'data'); dv.setUint32(40, n * 2, true);
  let bin = ''; const u8 = new Uint8Array(buf);
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return 'data:audio/wav;base64,' + btoa(bin);
}

// 순수 WebAudio 사운드(무의존). 유저 제스처(탐사 시작) 이후에만 resume.
export class Audio {
  constructor() {
    this.ctx = null; this.master = null; this.drone = null; this._scanOsc = null; this.ready = false;
  }
  // bootStart 탭/클릭(사용자 제스처) 시 호출.
  start() {
    if (this.ready) { this.ctx?.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0;
    this.master.connect(this.ctx.destination);
    this.master.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 2.0);
    this._buildDrone();
    this.ready = true;
    // 모바일(특히 iOS Safari)은 AudioContext가 suspended로 시작 → 제스처 내에서 resume 필수.
    this.ctx.resume?.();
    // iOS 잠금 해제: 무음 버퍼 1회 재생(일부 iOS는 resume만으론 무음).
    try {
      const b = this.ctx.createBuffer(1, 1, 22050);
      const s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination); s.start(0);
    } catch { /* noop */ }
    // iOS 무음 스위치 우회: 무음 루프 오디오 엘리먼트를 미디어 채널로 재생 → WebAudio도 미디어 채널로 승격.
    // (클래스명이 Audio라 전역 충돌 피하려고 createElement 사용)
    if (!this._silentEl) {
      try {
        const el = document.createElement('audio');
        el.src = silentWav();
        el.loop = true; el.volume = 1; el.setAttribute('playsinline', '');
        el.play().catch(() => { /* noop */ });
        this._silentEl = el;
      } catch { /* noop */ }
    }
    // 폴백: 이후 첫 입력에서도 suspended면 재개 + 미디어 엘리먼트 재생.
    const resume = () => {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      if (this._silentEl && this._silentEl.paused) this._silentEl.play().catch(() => {});
    };
    addEventListener('touchstart', resume, { passive: true });
    addEventListener('pointerdown', resume, { passive: true });
    addEventListener('keydown', resume);
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
  // 점프: 짧은 상승 블립.
  jump() {
    if (!this.ready) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(620, t + 0.16);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.24);
  }
  // 착지: 낮은 툭.
  land() {
    if (!this.ready) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.14);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.22);
  }
  // 모트 픽업: 맑은 고음 블립.
  mote() {
    if (!this.ready) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.1, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.16);
  }
}
