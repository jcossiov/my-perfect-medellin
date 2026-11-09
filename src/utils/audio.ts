// Efectos de sonido sintetizados con Web Audio (sin archivos: carga instantánea).
// Un solo AudioContext + un nodo de volumen maestro, y límite de sonidos simultáneos
// para que nunca se sature ni cause lag.

type Wave = OscillatorType;

class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private active = 0;
  private lastPlayed: Record<string, number> = {};

  constructor() {
    try {
      this.muted = localStorage.getItem('mpm_muted') === '1';
    } catch {
      /* noop */
    }
  }

  private ensure(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Llamar en el primer toque/click para desbloquear el audio en iOS/Chrome. */
  unlock() {
    this.ensure();
  }

  isMuted() {
    return this.muted;
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem('mpm_muted', m ? '1' : '0');
    } catch {
      /* noop */
    }
    if (m && this.ctx) void this.ctx.suspend();
    if (!m) this.ensure();
  }

  private tone(freq: number, start: number, dur: number, type: Wave = 'sine', vol = 0.3, slideTo?: number) {
    const ctx = this.ctx!;
    if (this.active > 24) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(this.master!);
    this.active++;
    osc.onended = () => {
      this.active--;
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  /** Evita repetir el mismo sonido demasiado seguido (antispam). */
  private gate(name: string, ms: number) {
    const now = performance.now();
    if (now - (this.lastPlayed[name] ?? 0) < ms) return false;
    this.lastPlayed[name] = now;
    return true;
  }

  click() {
    const c = this.ensure();
    if (!c || !this.gate('click', 40)) return;
    this.tone(660, c.currentTime, 0.08, 'triangle', 0.2);
  }

  pickup() {
    const c = this.ensure();
    if (!c || !this.gate('pickup', 60)) return;
    const t = c.currentTime;
    this.tone(520, t, 0.08, 'square', 0.12);
    this.tone(780, t + 0.06, 0.1, 'square', 0.12);
  }

  correct() {
    const c = this.ensure();
    if (!c || !this.gate('correct', 80)) return;
    const t = c.currentTime;
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, t + i * 0.07, 0.18, 'triangle', 0.25));
  }

  wrong() {
    const c = this.ensure();
    if (!c || !this.gate('wrong', 200)) return;
    const t = c.currentTime;
    this.tone(330, t, 0.18, 'sawtooth', 0.12, 220);
    this.tone(220, t + 0.16, 0.25, 'sawtooth', 0.12, 160);
  }

  splash() {
    const c = this.ensure();
    if (!c || !this.gate('splash', 90)) return;
    this.tone(900, c.currentTime, 0.12, 'sine', 0.15, 300);
  }

  hit() {
    const c = this.ensure();
    if (!c || !this.gate('hit', 80)) return;
    const t = c.currentTime;
    this.tone(300, t, 0.1, 'square', 0.15, 600);
  }

  bump() {
    const c = this.ensure();
    if (!c || !this.gate('bump', 300)) return;
    this.tone(160, c.currentTime, 0.25, 'triangle', 0.3, 80);
  }

  drop() {
    const c = this.ensure();
    if (!c || !this.gate('drop', 400)) return;
    this.tone(200, c.currentTime, 0.2, 'sawtooth', 0.08, 120);
  }

  magic() {
    const c = this.ensure();
    if (!c || !this.gate('magic', 120)) return;
    const t = c.currentTime;
    [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, t + i * 0.05, 0.15, 'sine', 0.18));
  }

  win() {
    const c = this.ensure();
    if (!c) return;
    const t = c.currentTime;
    const notes = [523, 659, 784, 659, 784, 1046];
    notes.forEach((f, i) => this.tone(f, t + i * 0.13, 0.25, 'triangle', 0.28));
    this.tone(262, t, 0.8, 'sine', 0.15);
  }

  lose() {
    const c = this.ensure();
    if (!c) return;
    const t = c.currentTime;
    [392, 349, 330, 262].forEach((f, i) => this.tone(f, t + i * 0.2, 0.3, 'triangle', 0.22));
  }

  coin() {
    const c = this.ensure();
    if (!c || !this.gate('coin', 60)) return;
    const t = c.currentTime;
    this.tone(988, t, 0.07, 'square', 0.1);
    this.tone(1319, t + 0.07, 0.15, 'square', 0.1);
  }

  tick() {
    const c = this.ensure();
    if (!c || !this.gate('tick', 500)) return;
    this.tone(1200, c.currentTime, 0.05, 'square', 0.08);
  }
}

export const sound = new Sound();

