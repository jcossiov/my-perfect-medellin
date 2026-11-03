/**
 * Audio Synthesizer Engine using Web Audio API
 * Generates all 10 user-requested musical notes & effects, plus game SFX
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.5;
  private infiniteDroneOsc: OscillatorNode | null = null;
  private infiniteDroneGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopInfiniteDrone();
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  public setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  // 1. DO Ambientación: Warm, gentle C major ambient pad with soft chord
  public play1_DoAmbientacion() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + 0.3 + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + 2.6);
    });
  }

  // 2. DO Grave leve: Deep, resonant low C (C2 / C3) with warm sub-bass
  public play2_DoGraveLeve() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(65.41, now); // C2
    osc.frequency.exponentialRampToValueAtTime(130.81, now + 0.3); // glide to C3

    gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.25);
  }

  // 3. RE Suspenso Divertido: Playful, quirky staccato D arpeggio (D4 - F#4 - A4 - C5)
  public play3_ReSuspensoDivertido() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [293.66, 369.99, 440.0, 523.25, 587.33]; // D4, F#4, A4, C5, D5
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      gain.gain.setValueAtTime(0.15 * this.masterVolume, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.2);
    });
  }

  // 4. RE Suspenso Divertido Acelerado: Fast, energetic comical trill on Re
  public play4_ReSuspensoDivertidoAcelerado() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [293.66, 329.63, 293.66, 369.99, 440.0, 587.33];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0.12 * this.masterVolume, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.1);
    });
  }

  // 5. DO Suspenso Lento: Mysterious slow C with subtle pitch bend & LFO filter
  public play5_DoSuspensoLento() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130.81, now); // C3
    osc.frequency.linearRampToValueAtTime(127.0, now + 1.2); // slight suspense pitch drop
    osc.frequency.linearRampToValueAtTime(130.81, now + 2.0);

    gain.gain.setValueAtTime(0.05 * this.masterVolume, now);
    gain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 2.45);
  }

  // 6. DO Suspenso Lento Fuerte: Powerful, dramatic orchestral C chord impact with brass buzz
  public play6_DoSuspensoLentoFuerte() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [65.41, 130.81, 196.0, 261.63]; // C2, C3, G3, C4
    freqs.forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now);
      osc.stop(now + 1.85);
    });
  }

  // 7. MI Motivación: Uplifting heroic fanfare starting in E (Mi4 - G#4 - B4 - E5)
  public play7_MiMotivacion() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const fanfare = [
      { f: 329.63, t: 0.0, d: 0.15 }, // E4
      { f: 415.3, t: 0.16, d: 0.15 }, // G#4
      { f: 493.88, t: 0.32, d: 0.15 }, // B4
      { f: 659.25, t: 0.48, d: 0.45 }, // E5
    ];

    fanfare.forEach(item => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.f, now + item.t);

      gain.gain.setValueAtTime(0.25 * this.masterVolume, now + item.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + item.t + item.d);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + item.t);
      osc.stop(now + item.t + item.d + 0.05);
    });
  }

  // 8. MI Miedo: Spooky eerie tremolo drone in E minor with modulation
  public play8_MiMiedo() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(164.81, now); // E3

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(196.0, now); // G3 (minor 3rd dissonance)

    // Tremolo LFO
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(8, now); // 8Hz flutter
    lfoGain.gain.setValueAtTime(0.08, now);

    lfo.connect(lfoGain.gain);
    gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    lfo.start(now);
    osc1.stop(now + 1.85);
    osc2.stop(now + 1.85);
    lfo.stop(now + 1.85);
  }

  // 9. DO Sostenido Infinito: C# (277.18Hz) sustained mystical drone that can loop
  public play9_DoSostenidoInfinito() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    this.stopInfiniteDrone();

    const now = this.ctx.currentTime;
    this.infiniteDroneOsc = this.ctx.createOscillator();
    this.infiniteDroneGain = this.ctx.createGain();

    this.infiniteDroneOsc.type = 'sine';
    this.infiniteDroneOsc.frequency.setValueAtTime(277.18, now); // C#4

    this.infiniteDroneGain.gain.setValueAtTime(0.01, now);
    this.infiniteDroneGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 1.0);

    this.infiniteDroneOsc.connect(this.infiniteDroneGain);
    this.infiniteDroneGain.connect(this.ctx.destination);
    this.infiniteDroneOsc.start(now);

    // Auto-fade after 4s if not stopped
    setTimeout(() => {
      this.stopInfiniteDrone();
    }, 4500);
  }

  // 10. DO Sostenido Infinito Vibrante: C# harmonic pad with shimmering cosmic vibe
  public play10_DoSostenidoInfinitoVibrante() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    this.stopInfiniteDrone();

    const now = this.ctx.currentTime;
    const oscA = this.ctx.createOscillator();
    const oscB = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscA.type = 'triangle';
    oscA.frequency.setValueAtTime(277.18, now); // C#4
    oscB.type = 'sine';
    oscB.frequency.setValueAtTime(554.37, now); // C#5

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.18 * this.masterVolume, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    oscA.connect(gain);
    oscB.connect(gain);
    gain.connect(this.ctx.destination);

    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + 3.6);
    oscB.stop(now + 3.6);
  }

  public stopInfiniteDrone() {
    if (this.infiniteDroneOsc && this.infiniteDroneGain && this.ctx) {
      try {
        this.infiniteDroneGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        this.infiniteDroneOsc.stop(this.ctx.currentTime + 0.35);
      } catch {
        // ignored
      }
      this.infiniteDroneOsc = null;
      this.infiniteDroneGain = null;
    }
  }

  // GAMEPLAY ACTION SOUNDS

  // Clean / Recycle success chime
  public playRecycleSuccess() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.07);
      gain.gain.setValueAtTime(0.18 * this.masterVolume, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.25);
    });
  }

  // Water spray stream
  public playWaterSpray() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.18);
    gain.gain.setValueAtTime(0.1 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // El Basurote vomits trash (squishy burp/splat sound)
  public playBasuroteVomit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.25);
    gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  // Viral Dance celebratory beat (rhythmic paisa party beat)
  public playViralDanceBeat() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const beatPattern = [
      { f: 523.25, t: 0.0 },
      { f: 587.33, t: 0.15 },
      { f: 659.25, t: 0.3 },
      { f: 783.99, t: 0.45 },
      { f: 659.25, t: 0.6 },
      { f: 783.99, t: 0.75 },
      { f: 1046.5, t: 0.9 },
    ];
    beatPattern.forEach(item => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.f, now + item.t);
      gain.gain.setValueAtTime(0.22 * this.masterVolume, now + item.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + item.t + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + item.t);
      osc.stop(now + item.t + 0.16);
    });
  }

  // Black Hole Defeat Vortex sound (dramatic swirling drop into trash abyss)
  public playBlackHoleDefeat() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 1.8);
    gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 2.1);
  }

  // Click UI
  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.1 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }
}

export const soundEngine = new SoundEngine();
