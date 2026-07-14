(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.RunnerLoveAudio = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const CHORDS = Object.freeze([
    Object.freeze([[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]]),
    Object.freeze([[60, 64, 67], [55, 60, 64], [57, 60, 64], [53, 57, 60]]),
    Object.freeze([[62, 65, 69], [57, 62, 65], [59, 62, 66], [55, 59, 62]]),
    Object.freeze([[64, 67, 71], [59, 64, 67], [60, 64, 67], [57, 60, 64]]),
    Object.freeze([[57, 61, 64], [54, 57, 61], [59, 62, 66], [52, 57, 59]]),
    Object.freeze([[55, 58, 62], [51, 55, 58], [53, 57, 60], [50, 53, 57]]),
    Object.freeze([[60, 64, 67], [57, 60, 64], [55, 60, 64], [53, 57, 60]])
  ]);

  const TEMPOS = Object.freeze([112, 116, 120, 124, 126, 122, 130]);
  const STAGE_MOTIFS = Object.freeze([
    Object.freeze([0, 4, 7, 12]), Object.freeze([0, 7, 9, 12]), Object.freeze([0, 3, 7, 10]),
    Object.freeze([0, 4, 11, 12]), Object.freeze([0, 5, 7, 12]), Object.freeze([0, 3, 5, 10]),
    Object.freeze([0, 7, 12, 16])
  ]);
  const KIND_NOTES = Object.freeze({
    book: 523.25, record: 440, drink: 659.25, coffee: 659.25, ticket: 587.33,
    umbrella: 493.88, flower: 698.46, camera: 783.99, key: 880, plant: 554.37,
    map: 622.25, wristband: 740, groceries: 466.16, note: 570, photo: 784,
    lamp: 830.61, cloth: 622.25, snack: 698.46, packet: 587.33
  });

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function midi(value) { return 440 * Math.pow(2, (value - 69) / 12); }

  class PulseRunAudio {
    constructor() {
      this.context = null;
      this.master = null;
      this.music = null;
      this.sfx = null;
      this.ambience = null;
      this.reverb = null;
      this.noiseBuffer = null;
      this.started = false;
      this.manuallyMuted = false;
      this.schedulerId = 0;
      this.nextStepAt = 0;
      this.step = 0;
      this.bar = 0;
      this.stageNumber = 1;
      this.condition = 100;
      this.combo = 0;
      this.flow = 0;
      this.flowTier = 0;
      this.speed = 11;
      this.arrival = false;
      this.stepClock = 0;
      this.stepSide = 1;
      this.ambientSource = null;
      this.ambientFilter = null;
      this.ambientGain = null;
    }

    start() {
      if (this.started) {
        if (!this.manuallyMuted && this.context?.state === "suspended") this.context.resume();
        return;
      }
      const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext({ latencyHint: "interactive" });

      const limiter = this.context.createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.knee.value = 12;
      limiter.ratio.value = 6;
      limiter.attack.value = 0.004;
      limiter.release.value = 0.2;

      this.master = this.context.createGain();
      this.master.gain.value = 0.46;
      this.music = this.context.createGain();
      this.music.gain.value = 0.58;
      this.sfx = this.context.createGain();
      this.sfx.gain.value = 0.84;
      this.ambience = this.context.createGain();
      this.ambience.gain.value = 0.16;

      this.reverb = this.context.createConvolver();
      this.reverb.buffer = this.makeImpulse(1.8, 2.8);
      const reverbGain = this.context.createGain();
      reverbGain.gain.value = 0.22;
      this.reverb.connect(reverbGain);
      reverbGain.connect(this.master);

      this.music.connect(this.master);
      this.sfx.connect(this.master);
      this.ambience.connect(this.master);
      this.master.connect(limiter);
      limiter.connect(this.context.destination);

      this.noiseBuffer = this.makeNoiseBuffer(2);
      this.startAmbience();
      this.nextStepAt = this.context.currentTime + 0.06;
      this.schedulerId = globalThis.setInterval(() => this.schedule(), 25);
      this.started = true;
    }

    makeNoiseBuffer(seconds) {
      const length = Math.ceil(this.context.sampleRate * seconds);
      const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const channel = buffer.getChannelData(0);
      let brown = 0;
      for (let index = 0; index < length; index += 1) {
        const white = Math.random() * 2 - 1;
        brown = (brown + 0.025 * white) / 1.025;
        channel[index] = white * 0.62 + brown * 0.38;
      }
      return buffer;
    }

    makeImpulse(seconds, decay) {
      const length = Math.ceil(this.context.sampleRate * seconds);
      const buffer = this.context.createBuffer(2, length, this.context.sampleRate);
      for (let channelIndex = 0; channelIndex < 2; channelIndex += 1) {
        const channel = buffer.getChannelData(channelIndex);
        for (let index = 0; index < length; index += 1) {
          channel[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / length, decay);
        }
      }
      return buffer;
    }

    startAmbience() {
      const source = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      source.buffer = this.noiseBuffer;
      source.loop = true;
      filter.type = "lowpass";
      filter.frequency.value = 620;
      filter.Q.value = 0.55;
      gain.gain.value = 0.035;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambience);
      source.start();
      this.ambientSource = source;
      this.ambientFilter = filter;
      this.ambientGain = gain;
    }

    setStage(stageNumber, condition = this.condition, combo = this.combo) {
      this.stageNumber = clamp(Math.trunc(stageNumber) || 1, 1, 7);
      this.condition = clamp(Number(condition) || 0, 0, 100);
      this.combo = Math.max(0, Number(combo) || 0);
      if (!this.context) return;
      const now = this.context.currentTime;
      const storm = this.stageNumber === 6;
      this.ambientFilter?.frequency.setTargetAtTime(storm ? 420 : 620 + this.stageNumber * 70, now, 0.7);
      this.ambientGain?.gain.setTargetAtTime(storm ? 0.075 : 0.026 + this.stageNumber * 0.004, now, 0.7);
    }

    setFlow(value) {
      const nextFlow = clamp(Number(value) || 0, 0, 1);
      const nextTier = nextFlow >= 0.72 ? 2 : nextFlow >= 0.34 ? 1 : 0;
      const previousTier = this.flowTier;
      this.flow = nextFlow;
      this.flowTier = nextTier;
      if (!this.context) return;
      const now = this.context.currentTime;
      this.music?.gain.setTargetAtTime(0.46 + nextFlow * 0.18, now, 0.16);
      this.ambience?.gain.setTargetAtTime(0.13 + nextFlow * 0.055, now, 0.24);
      if (nextTier > previousTier) {
        const chord = CHORDS[this.stageNumber - 1][this.bar % 4];
        const root = midi(chord[0] + (nextTier === 2 ? 12 : 0));
        this.noiseHit(now, 0.72, 2200 + nextTier * 1400, 0.045 + nextTier * 0.015, "highpass", this.sfx);
        [1, 1.25, 1.5].forEach((ratio, index) => {
          this.tone(root * ratio, 0.28 + index * 0.09, 0.025 + nextTier * 0.012, index * 0.07, "triangle", (index - 1) * 0.38, root * ratio * 1.18);
        });
      }
    }

    duckMusic(target = 0.24, release = 0.55) {
      if (!this.context || !this.music) return;
      const at = this.context.currentTime;
      const restore = 0.46 + this.flow * 0.18;
      this.music.gain.cancelScheduledValues(at);
      this.music.gain.setTargetAtTime(target, at, 0.025);
      this.music.gain.setTargetAtTime(restore, at + 0.12, release);
    }

    setArrival(value) {
      const next = Boolean(value);
      if (next === this.arrival) return;
      this.arrival = next;
      if (this.context) this.nextStepAt = this.context.currentTime + 0.04;
    }

    schedule() {
      if (!this.context || this.context.state !== "running") return;
      const horizon = this.context.currentTime + 0.16;
      while (this.nextStepAt < horizon) {
        this.scheduleStep(this.step, this.nextStepAt);
        const tempo = this.arrival ? 88 : TEMPOS[this.stageNumber - 1] + this.flow * 8;
        this.nextStepAt += 60 / tempo / 4;
        this.step = (this.step + 1) % 16;
        if (this.step === 0) this.bar += 1;
      }
    }

    scheduleStep(step, at) {
      const stageIndex = this.stageNumber - 1;
      const progression = CHORDS[stageIndex];
      const chord = progression[this.bar % progression.length];
      if (this.arrival) {
        if (step === 0) this.pad(chord, at, 2.7, 0.052);
        if ([2, 6, 10, 14].includes(step)) this.pluck(midi(chord[(step / 4 | 0) % chord.length] + 12), at, 0.5, 0.026, 0.22);
        if (step === 12) this.bell(midi(chord[2] + 12), at, 0.7, 0.032);
        return;
      }

      const intensity = clamp(0.38 + stageIndex * 0.07 + this.flow * 0.45 + Math.min(0.2, this.combo * 0.018), 0.35, 1);
      if (step === 0) this.pad(chord, at, 2.2, 0.027 + stageIndex * 0.0025);
      if (step === 0 || step === 8 || (intensity > 0.78 && step === 10)) this.kick(at, 0.09 + intensity * 0.045);
      if (step === 4 || step === 12) this.snare(at, 0.05 + intensity * 0.035);
      if (this.flow > 0.72 && (step === 4 || step === 12)) this.kick(at, 0.055 + intensity * 0.028);
      if (step % (intensity > 0.72 ? 1 : 2) === 0) this.hat(at, 0.012 + intensity * 0.012, step % 4 === 2);
      if ([0, 3, 8, 11].includes(step)) {
        const rootOffset = step === 11 ? 7 : step === 3 ? 12 : 0;
        this.bass(midi(chord[0] - 24 + rootOffset), at, 0.28, 0.035 + intensity * 0.018);
      }
      if (this.stageNumber >= 2 && step % 2 === 0) {
        const noteIndex = (step / 2 + this.bar) % chord.length;
        const octave = this.stageNumber >= 4 && step % 8 === 6 ? 24 : 12;
        this.pluck(midi(chord[noteIndex] + octave), at, 0.24, 0.014 + intensity * 0.012, (step / 15) * 1.2 - 0.6);
      }
      if (this.flow > 0.42 && step % 2 === 1) {
        const motif = STAGE_MOTIFS[stageIndex];
        const motifNote = chord[0] + 12 + motif[(step / 2 | 0) % motif.length];
        this.pluck(midi(motifNote), at, 0.16, 0.009 + this.flow * 0.012, step % 4 === 1 ? -0.48 : 0.48);
      }
      if (this.flow > 0.78 && (step === 6 || step === 14)) {
        this.pad(chord.map((note) => note + 12), at, 0.34, 0.018 + this.flow * 0.008);
      }
      if (this.flow > 0.62 && [5, 13].includes(step)) this.bell(midi(chord[2] + 24), at, 0.36, 0.012 + this.flow * 0.012);
    }

    connectVoice(node, gain, pan, wet = 0) {
      if (this.context.createStereoPanner) {
        const panner = this.context.createStereoPanner();
        panner.pan.value = clamp(pan || 0, -1, 1);
        node.connect(gain);
        gain.connect(panner);
        panner.connect(this.music);
        if (wet > 0) panner.connect(this.reverb);
      } else {
        node.connect(gain);
        gain.connect(this.music);
        if (wet > 0) gain.connect(this.reverb);
      }
    }

    pad(notes, at, duration, volume) {
      notes.forEach((note, index) => {
        const oscillator = this.context.createOscillator();
        const filter = this.context.createBiquadFilter();
        const gain = this.context.createGain();
        oscillator.type = index === 1 ? "triangle" : "sine";
        oscillator.frequency.value = midi(note - 12);
        oscillator.detune.value = (index - 1) * 4;
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(720 + this.stageNumber * 85, at);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(volume / notes.length, at + 0.16);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        oscillator.connect(filter);
        this.connectVoice(filter, gain, (index - 1) * 0.36, 0.3);
        oscillator.start(at);
        oscillator.stop(at + duration + 0.04);
      });
    }

    bass(frequency, at, duration, volume) {
      const oscillator = this.context.createOscillator();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      oscillator.type = "sawtooth";
      oscillator.frequency.value = frequency;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(380, at);
      filter.frequency.exponentialRampToValueAtTime(120, at + duration);
      gain.gain.setValueAtTime(volume, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(filter);
      this.connectVoice(filter, gain, 0, 0.04);
      oscillator.start(at);
      oscillator.stop(at + duration + 0.02);
    }

    pluck(frequency, at, duration, volume, pan = 0) {
      const oscillator = this.context.createOscillator();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = frequency;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2600, at);
      filter.frequency.exponentialRampToValueAtTime(620, at + duration);
      gain.gain.setValueAtTime(volume, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(filter);
      this.connectVoice(filter, gain, pan, 0.2);
      oscillator.start(at);
      oscillator.stop(at + duration + 0.02);
    }

    bell(frequency, at, duration, volume, output = this.music) {
      [1, 2.01, 3.96].forEach((multiple, index) => {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency * multiple;
        gain.gain.setValueAtTime(volume / (1 + index * 1.4), at);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + duration / (1 + index * 0.22));
        oscillator.connect(gain);
        gain.connect(output);
        gain.connect(this.reverb);
        oscillator.start(at);
        oscillator.stop(at + duration + 0.03);
      });
    }

    kick(at, volume) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(148, at);
      oscillator.frequency.exponentialRampToValueAtTime(43, at + 0.14);
      gain.gain.setValueAtTime(volume, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
      oscillator.connect(gain);
      gain.connect(this.music);
      oscillator.start(at);
      oscillator.stop(at + 0.22);
    }

    noiseHit(at, duration, frequency, volume, type = "bandpass", output = this.music, pan = 0) {
      const source = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      source.buffer = this.noiseBuffer;
      filter.type = type;
      filter.frequency.value = frequency;
      filter.Q.value = type === "bandpass" ? 0.8 : 0.2;
      gain.gain.setValueAtTime(Math.max(0.0001, volume), at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      source.connect(filter);
      filter.connect(gain);
      if (this.context.createStereoPanner) {
        const panner = this.context.createStereoPanner();
        panner.pan.value = pan;
        gain.connect(panner);
        panner.connect(output);
      } else gain.connect(output);
      source.start(at);
      source.stop(at + duration + 0.02);
    }

    snare(at, volume) {
      this.noiseHit(at, 0.16, 1850, volume, "bandpass");
      this.pluck(174, at, 0.1, volume * 0.22, 0);
    }

    hat(at, volume, open) {
      this.noiseHit(at, open ? 0.12 : 0.045, 7600, volume, "highpass", this.music, (this.step % 4 < 2 ? -0.25 : 0.25));
    }

    tone(frequency, duration, volume, delay = 0, type = "sine", pan = 0, glideTo = null) {
      if (!this.context || !this.sfx) return;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const at = this.context.currentTime + delay;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, at);
      if (glideTo) oscillator.frequency.exponentialRampToValueAtTime(glideTo, at + duration);
      gain.gain.setValueAtTime(Math.max(0.0001, volume), at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(gain);
      if (this.context.createStereoPanner) {
        const panner = this.context.createStereoPanner();
        panner.pan.value = pan;
        gain.connect(panner);
        panner.connect(this.sfx);
      } else gain.connect(this.sfx);
      gain.connect(this.reverb);
      oscillator.start(at);
      oscillator.stop(at + duration + 0.025);
    }

    action(name) {
      if (!this.context) return;
      const at = this.context.currentTime;
      if (name === "left" || name === "right") {
        const pan = name === "left" ? -0.72 : 0.72;
        this.noiseHit(at, 0.13, 1900, 0.07, "bandpass", this.sfx, pan);
        this.tone(250, 0.09, 0.022, 0, "sine", pan, 410);
      } else if (name === "jump") {
        this.noiseHit(at, 0.22, 2500, 0.075, "highpass", this.sfx);
        this.tone(310, 0.18, 0.045, 0, "sine", 0, 620);
      } else if (name === "slide") {
        this.noiseHit(at, 0.34, 620, 0.105, "bandpass", this.sfx);
        this.tone(190, 0.26, 0.032, 0, "triangle", 0, 82);
      }
    }

    cue(name, kind) {
      if (!this.context) return;
      const at = this.context.currentTime;
      if (name === "miss") {
        this.duckMusic(0.18, 0.44);
        this.noiseHit(at, 0.32, 170, 0.18, "bandpass", this.sfx);
        this.tone(128, 0.34, 0.12, 0, "sawtooth", 0, 72);
        return;
      }
      if (name === "near-miss") {
        this.noiseHit(at, 0.26, 3100, 0.09, "highpass", this.sfx);
        this.tone(88, 0.2, 0.08, 0, "sine", 0, 118);
        return;
      }
      if (name === "energy") {
        this.tone(720 + this.flow * 260, 0.11, 0.035, 0, "sine", 0, 980 + this.flow * 320);
        return;
      }
      if (name === "arrival") {
        const root = CHORDS[this.stageNumber - 1][this.bar % 4];
        [0, 1, 2].forEach((index) => this.bell(midi(root[index] + 12), at + index * 0.1, 1.2, 0.055, this.sfx));
        this.noiseHit(at, 0.9, 3200, 0.06, "highpass", this.sfx);
        return;
      }
      const frequency = KIND_NOTES[kind] || (name === "perfect" ? 880 : 659.25);
      this.bell(frequency, at, name === "perfect" ? 0.72 : 0.48, name === "perfect" ? 0.075 : 0.052, this.sfx);
      if (name === "perfect") this.tone(frequency * 1.5, 0.32, 0.045, 0.07, "triangle", 0, frequency * 2);
      if (["camera", "photo"].includes(kind)) {
        this.noiseHit(at, 0.075, 5200, 0.12, "highpass", this.sfx);
        this.noiseHit(at + 0.06, 0.22, 980, 0.07, "bandpass", this.sfx);
      } else if (["record", "wristband"].includes(kind)) {
        this.kick(at + 0.04, 0.16);
        this.hat(at + 0.13, 0.048, true);
      } else if (kind === "umbrella") {
        [0, 0.08, 0.16].forEach((delay, index) => this.noiseHit(at + delay, 0.28, 1500 + index * 780, 0.04, "highpass", this.sfx, index - 1));
      } else if (["key", "lamp"].includes(kind)) {
        [1, 1.25, 1.5].forEach((ratio, index) => this.tone(frequency * ratio, 0.24, 0.04, index * 0.075, "sine", 0, frequency * ratio * 1.22));
      } else if (["coffee", "drink"].includes(kind)) {
        this.tone(1420, 0.08, 0.04, 0.02, "sine", -0.18, 1060);
        this.tone(1810, 0.1, 0.032, 0.08, "sine", 0.18, 1240);
      } else if (["flower", "plant"].includes(kind)) {
        [0, 0.09, 0.18].forEach((delay, index) => this.bell(frequency * (1 + index * 0.25), at + delay, 0.62, 0.026, this.sfx));
      }
    }

    tick(delta, speed, active, arrival, flow = this.flow) {
      if (!this.context || !active) return;
      this.speed = Number(speed) || this.speed;
      this.setFlow(flow);
      this.setArrival(arrival);
      this.stepClock -= delta;
      if (!arrival && this.stepClock <= 0) {
        this.stepSide *= -1;
        const at = this.context.currentTime;
        this.noiseHit(at, 0.055, 210 + Math.min(130, this.speed * 4), 0.035, "bandpass", this.sfx, this.stepSide * 0.22);
        this.stepClock = Math.max(0.17, 0.33 - this.speed * 0.005);
      }
    }

    toggle() {
      this.start();
      if (!this.context) return true;
      if (this.context.state === "running") {
        this.manuallyMuted = true;
        this.context.suspend();
      } else {
        this.manuallyMuted = false;
        this.context.resume();
      }
      return this.manuallyMuted;
    }

    suspend() {
      if (this.context?.state === "running") this.context.suspend();
    }

    resume() {
      if (this.started && !this.manuallyMuted && this.context?.state === "suspended") this.context.resume();
    }

    dispose() {
      if (this.schedulerId) globalThis.clearInterval(this.schedulerId);
      this.schedulerId = 0;
      this.ambientSource?.stop?.();
      this.context?.close?.();
    }
  }

  return Object.freeze({ PulseRunAudio, create: () => new PulseRunAudio(), CHORDS, TEMPOS });
});
