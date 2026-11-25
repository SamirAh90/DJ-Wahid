// Lightweight Web Audio API electronic groove generator for interactive podcast previews.
class ClubAudioEngine {
  private ctx: AudioContext | null = null;
  private timerId: number | null = null;
  private step = 0;

  start(bpm: number, rootHz: number) {
    this.stop();
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }

    const stepMs = (60 / bpm / 4) * 1000;
    this.step = 0;

    const triggerStep = () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Four-on-the-floor kick
      if (this.step % 4 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);
        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
      }

      // Off-beat synth bass
      if (this.step % 2 === 1) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        const pattern = [1, 1, 1.189, 1.335, 1, 1.5, 1.189, 1];
        const mult = pattern[Math.floor(this.step / 2) % pattern.length] ?? 1;
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(rootHz * mult, now);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(460, now);
        gain.gain.setValueAtTime(0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }

      this.step = (this.step + 1) % 16;
    };

    triggerStep();
    this.timerId = window.setInterval(triggerStep, stepMs);
  }

  stop() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export const clubAudio = new ClubAudioEngine();