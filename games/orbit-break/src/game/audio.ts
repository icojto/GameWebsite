import { GAME_CONFIG } from './config';

type AudioContextConstructor = new () => AudioContext;

export class OrbitAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicTimer: number | null = null;
  private beat = 0;

  async unlock(): Promise<void> {
    if (!this.context) {
      const AudioContextClass = window.AudioContext
        ?? (window as typeof window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;

      if (!AudioContextClass) return;

      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = 0.7;
      this.master.connect(this.context.destination);
    }

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  startMusic(): void {
    if (!this.context || this.musicTimer !== null) return;

    const beatMs = (60_000 / GAME_CONFIG.audioBpm) / 2;
    this.playBeat();
    this.musicTimer = window.setInterval(() => this.playBeat(), beatMs);
  }

  startCue(): void {
    this.tone(180, 420, 0.12, GAME_CONFIG.audioSfxVolume, 'sine');
  }

  reverseCue(direction: 1 | -1): void {
    const from = direction === 1 ? 430 : 620;
    const to = direction === 1 ? 620 : 430;
    this.tone(from, to, 0.07, GAME_CONFIG.audioSfxVolume * 0.7, 'square');
  }

  deathCue(): void {
    this.tone(170, 48, 0.42, GAME_CONFIG.audioSfxVolume, 'sawtooth');
  }

  destroy(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    void this.context?.close();
    this.context = null;
    this.master = null;
  }

  private playBeat(): void {
    if (!this.context || this.context.state !== 'running') return;

    const isDownbeat = this.beat % 4 === 0;
    const isMotif = this.beat % 2 === 1;
    this.tone(isDownbeat ? 78 : 62, 42, 0.09, GAME_CONFIG.audioMusicVolume, 'sine');
    if (isMotif) {
      const notes = [110, 123.47, 146.83, 98];
      const note = notes[Math.floor(this.beat / 2) % notes.length];
      this.tone(note, note * 0.99, 0.11, GAME_CONFIG.audioMusicVolume * 0.36, 'triangle');
    }
    this.beat += 1;
  }

  private tone(
    startFrequency: number,
    endFrequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
  ): void {
    if (!this.context || !this.master || this.context.state !== 'running') return;

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }
}
