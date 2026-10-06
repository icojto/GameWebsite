import type { GameConfig } from './config';
import { gameStorage } from '../../../../shared/storage.mjs';
import { loadMute, saveMute } from './mute.ts';

type AudioContextConstructor = new () => AudioContext;

export class OrbitAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicTimer: number | null = null;
  private beat = 0;
  private adSuspended = false;
  settings = { master: 0.7, music: 1, sfx: 1, mute: false };

  constructor(private readonly config: GameConfig) { this.settings.mute = loadMute(gameStorage); }

  setMuted(value: boolean): void { this.settings.mute = value; saveMute(gameStorage, value); this.applySettings(); }
  get effectiveSuspension(): boolean { return this.adSuspended; }

  async unlock(): Promise<void> {
    if (!this.context) {
      const AudioContextClass = window.AudioContext
        ?? (window as typeof window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;

      if (!AudioContextClass) return;

      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.applySettings();
      this.master.connect(this.context.destination);
    }

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  startMusic(): void {
    if (!this.context || this.musicTimer !== null || this.adSuspended) return;

    const beatMs = (60_000 / this.config.audio.bpm) / 2;
    this.playBeat();
    this.musicTimer = window.setInterval(() => this.playBeat(), beatMs);
  }

  pauseMusic(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  startCue(): void {
    this.tone(180, 420, 0.12, this.config.audio.sfxVolume * this.settings.sfx, 'sine');
  }

  reverseCue(direction: 1 | -1): void {
    const from = direction === 1 ? 430 : 620;
    const to = direction === 1 ? 620 : 430;
    this.tone(from, to, 0.07, this.config.audio.sfxVolume * this.settings.sfx * 0.7, 'square');
  }

  deathCue(): void {
    this.tone(170, 48, 0.42, this.config.audio.sfxVolume * this.settings.sfx, 'sawtooth');
  }

  uiCue(): void { this.tone(360, 500, 0.045, this.config.audio.sfxVolume * this.settings.sfx * 0.32, 'sine'); }
  rewardCue(): void { this.tone(420, 760, 0.15, this.config.audio.sfxVolume * this.settings.sfx * 0.55, 'triangle'); }
  levelCue(): void { this.tone(330, 880, 0.3, this.config.audio.sfxVolume * this.settings.sfx * 0.58, 'triangle'); }

  applySettings(): void {
    if (this.master) this.master.gain.value = this.settings.mute || this.adSuspended ? 0 : this.settings.master;
  }

  suspendForAd(value: boolean): void {
    this.adSuspended = value;
    if (value) this.pauseMusic();
    this.applySettings();
  }

  destroy(): void {
    this.pauseMusic();
    void this.context?.close();
    this.context = null;
    this.master = null;
  }

  private playBeat(): void {
    if (!this.context || this.context.state !== 'running') return;

    const isDownbeat = this.beat % 4 === 0;
    const isMotif = this.beat % 2 === 1;
    this.tone(isDownbeat ? 78 : 62, 42, 0.09, this.config.audio.musicVolume * this.settings.music, 'sine');
    if (isMotif) {
      const notes = [110, 123.47, 146.83, 98];
      const note = notes[Math.floor(this.beat / 2) % notes.length];
      this.tone(note, note * 0.99, 0.11, this.config.audio.musicVolume * this.settings.music * 0.36, 'triangle');
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
    if (!this.context || !this.master || this.context.state !== 'running' || this.adSuspended) return;

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
