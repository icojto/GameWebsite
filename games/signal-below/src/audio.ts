/** Small, locally synthesized sound bed. Never starts before a user gesture. */
export class AtmosphereAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private room: GainNode | null = null;
  private hum: OscillatorNode | null = null;
  private enabled = true;
  private visible = true;
  private active = false;
  get on() { return this.enabled; }
  async unlock(): Promise<void> {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0;
        this.master.connect(this.context.destination);
        this.room = this.context.createGain();
        this.room.gain.value = .12;
        this.room.connect(this.master);
        this.hum = this.context.createOscillator();
        this.hum.type = 'sine'; this.hum.frequency.value = 54;
        this.hum.connect(this.room); this.hum.start();
        const overtone = this.context.createOscillator();
        const overtoneGain = this.context.createGain();
        overtone.frequency.value = 109; overtoneGain.gain.value = .022;
        overtone.connect(overtoneGain); overtoneGain.connect(this.master); overtone.start();
        const buffer = this.context.createBuffer(1, this.context.sampleRate * 3, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < data.length; i++) { last = (last + (Math.random() * 2 - 1) * .025) / 1.025; data[i] = last; }
        const noise = this.context.createBufferSource(); noise.buffer = buffer; noise.loop = true;
        const filter = this.context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 420;
        const noiseGain = this.context.createGain(); noiseGain.gain.value = .17;
        noise.connect(filter); filter.connect(noiseGain); noiseGain.connect(this.master); noise.start();
      }
      await this.context.resume(); this.update();
    } catch { /* Audio is optional; narrative and controls remain functional. */ }
  }
  toggle(): void { this.enabled = !this.enabled; this.update(); }
  setActive(active: boolean): void { this.active = active; this.update(); }
  setVisible(visible: boolean): void { this.visible = visible; this.update(); }
  setRoom(index: number): void { this.hum?.frequency.setTargetAtTime([54, 46, 61, 38][index] ?? 54, this.context!.currentTime, .7); }
  private update(): void {
    if (this.context && this.master) this.master.gain.setTargetAtTime(this.enabled && this.visible && this.active ? .34 : 0, this.context.currentTime, .08);
  }
  cue(kind: 'click' | 'signal' | 'clue' | 'silence' | 'answer'): void {
    const context = this.context;
    if (!context || !this.master || !this.enabled || !this.visible) return;
    const oscillator = context.createOscillator(), gain = context.createGain();
    const time = context.currentTime, duration = kind === 'click' ? .07 : kind === 'signal' ? .7 : 1.1;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime({ click: 540, signal: 218, clue: 620, silence: 110, answer: 330 }[kind], time);
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'silence' ? 35 : kind === 'answer' ? 660 : 160, time + duration);
    gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(.13, time + .015); gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    oscillator.connect(gain); gain.connect(this.master); oscillator.start(time); oscillator.stop(time + duration + .02);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
}
