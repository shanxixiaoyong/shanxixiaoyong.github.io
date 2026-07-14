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
  const ACT_AUDIO_PROFILES = Object.freeze([
    Object.freeze([
      Object.freeze({ id: "campus-release", bpm: 96, rhythm: "measured-rain", density: 0.76, pulse: Object.freeze([0, 4, 8, 12]) }),
      Object.freeze({ id: "sun-shower-lane", bpm: 108, rhythm: "quickening-window", density: 0.9, pulse: Object.freeze([0, 3, 6, 8, 11, 14]) }),
      Object.freeze({ id: "library-crossing", bpm: 88, rhythm: "held-crossing", density: 0.64, pulse: Object.freeze([0, 6, 8, 14]) })
    ]),
    Object.freeze([
      Object.freeze({ id: "misty-levee", bpm: 92, rhythm: "paired-walk", density: 0.7, pulse: Object.freeze([0, 4, 8, 12]) }),
      Object.freeze({ id: "record-alley", bpm: 112, rhythm: "answering-groove", density: 0.88, pulse: Object.freeze([0, 2, 6, 8, 10, 14]) }),
      Object.freeze({ id: "bookstore-threshold", bpm: 84, rhythm: "doorway-pause", density: 0.58, pulse: Object.freeze([0, 7, 8, 15]) })
    ]),
    Object.freeze([
      Object.freeze({ id: "station-rush", bpm: 118, rhythm: "departure-clock", density: 0.9, pulse: Object.freeze([0, 3, 6, 8, 11, 14]) }),
      Object.freeze({ id: "last-train-transfer", bpm: 132, rhythm: "platform-sprint", density: 1, pulse: Object.freeze([0, 2, 4, 6, 8, 10, 12, 14]) }),
      Object.freeze({ id: "marquee-approach", bpm: 124, rhythm: "promise-arrival", density: 0.84, pulse: Object.freeze([0, 3, 7, 8, 11, 15]) })
    ]),
    Object.freeze([
      Object.freeze({ id: "market-taste", bpm: 108, rhythm: "shared-taste", density: 0.82, pulse: Object.freeze([0, 3, 6, 8, 11, 14]) }),
      Object.freeze({ id: "music-crowd", bpm: 126, rhythm: "mirrored-beat", density: 0.98, pulse: Object.freeze([0, 2, 4, 6, 8, 10, 12, 14]) }),
      Object.freeze({ id: "quiet-river", bpm: 78, rhythm: "two-breaths", density: 0.52, pulse: Object.freeze([0, 7, 8, 15]) })
    ]),
    Object.freeze([
      Object.freeze({ id: "breakfast-block", bpm: 100, rhythm: "morning-routine", density: 0.72, pulse: Object.freeze([0, 4, 8, 12]) }),
      Object.freeze({ id: "market-list", bpm: 116, rhythm: "carried-chores", density: 0.86, pulse: Object.freeze([0, 3, 6, 8, 11, 14]) }),
      Object.freeze({ id: "stairway-home", bpm: 92, rhythm: "missed-doorway", density: 0.62, pulse: Object.freeze([0, 5, 8, 13]) })
    ]),
    Object.freeze([
      Object.freeze({ id: "under-flyover", bpm: 120, rhythm: "storm-pressure", density: 0.82, pulse: Object.freeze([0, 3, 6, 8, 11, 14]) }),
      Object.freeze({ id: "closure-detour", bpm: 128, rhythm: "broken-route", density: 0.76, pulse: Object.freeze([0, 2, 7, 8, 10, 15]) }),
      Object.freeze({ id: "shelter-approach", bpm: 86, rhythm: "listening-space", density: 0.44, pulse: Object.freeze([0, 8]) })
    ]),
    Object.freeze([
      Object.freeze({ id: "first-train-platform", bpm: 104, rhythm: "shared-weight", density: 0.74, pulse: Object.freeze([0, 4, 8, 12]) }),
      Object.freeze({ id: "familiar-memory-street", bpm: 116, rhythm: "motif-reprise", density: 0.86, pulse: Object.freeze([0, 3, 6, 8, 11, 14]) }),
      Object.freeze({ id: "home-straight", bpm: 82, rhythm: "themes-converge", density: 0.58, pulse: Object.freeze([0, 6, 8, 14]) })
    ])
  ]);
  const SEMANTIC_REWARD_PROFILES = Object.freeze([
    Object.freeze({ id: "earned-acceleration", tempoDelta: 10, densityScale: 1.08 }),
    Object.freeze({ id: "step-match", tempoDelta: 0, densityScale: 0.92 }),
    Object.freeze({ id: "promise-surge", tempoDelta: 9, densityScale: 1.06 }),
    Object.freeze({ id: "dual-melody", tempoDelta: 0, densityScale: 1 }),
    Object.freeze({ id: "daily-layer", tempoDelta: 0, densityScale: 1.04 }),
    Object.freeze({ id: "listening-space", tempoDelta: -18, densityScale: 0.48 }),
    Object.freeze({ id: "theme-convergence", tempoDelta: 0, densityScale: 1 })
  ]);
  const STAGE_MOTIFS = Object.freeze([
    Object.freeze([0, 4, 7, 12]), Object.freeze([0, 7, 9, 12]), Object.freeze([0, 3, 7, 10]),
    Object.freeze([0, 4, 11, 12]), Object.freeze([0, 5, 7, 12]), Object.freeze([0, 3, 5, 10]),
    Object.freeze([0, 7, 12, 16])
  ]);
  const STAGE_IDS = Object.freeze([
    "first-sight", "familiar-steps", "first-date", "heart-spoken", "shared-days", "rough-weather", "toward-home"
  ]);
  const SOUNDSCAPE_PROFILES = Object.freeze([
    Object.freeze({
      id: "campus-rain", texture: "rain", layers: Object.freeze(["wet-campus", "eave-drops", "distant-bell"]),
      bed: Object.freeze({ type: "lowpass", frequency: 780, q: 0.55, gain: 0.034 }),
      detail: Object.freeze({ type: "highpass", frequency: 3900, q: 0.24, gain: 0.017, pan: -0.28 }),
      drone: Object.freeze({ wave: "sine", frequency: 146.83, cutoff: 980, gain: 0.005 }),
      score: Object.freeze({ wave: "triangle", brightness: 2500 }),
      intro: Object.freeze({ root: 293.66, intervals: Object.freeze([0, 7, 12]) })
    }),
    Object.freeze({
      id: "river-pages", texture: "pages", layers: Object.freeze(["river-wind", "turning-pages", "shop-bell"]),
      bed: Object.freeze({ type: "bandpass", frequency: 520, q: 0.42, gain: 0.03 }),
      detail: Object.freeze({ type: "bandpass", frequency: 1680, q: 0.72, gain: 0.013, pan: 0.32 }),
      drone: Object.freeze({ wave: "sine", frequency: 174.61, cutoff: 1180, gain: 0.006 }),
      score: Object.freeze({ wave: "triangle", brightness: 3100 }),
      intro: Object.freeze({ root: 261.63, intervals: Object.freeze([0, 4, 9]) })
    }),
    Object.freeze({
      id: "metro-neon", texture: "metro", layers: Object.freeze(["rail-rumble", "gate-pulse", "neon-sequence"]),
      bed: Object.freeze({ type: "bandpass", frequency: 910, q: 0.84, gain: 0.028 }),
      detail: Object.freeze({ type: "highpass", frequency: 5300, q: 0.3, gain: 0.009, pan: -0.12 }),
      drone: Object.freeze({ wave: "sawtooth", frequency: 55, cutoff: 430, gain: 0.009 }),
      score: Object.freeze({ wave: "square", brightness: 4200 }),
      intro: Object.freeze({ root: 164.81, intervals: Object.freeze([0, 3, 10]) })
    }),
    Object.freeze({
      id: "night-market", texture: "market", layers: Object.freeze(["market-crowd", "hand-percussion", "stage-beat"]),
      bed: Object.freeze({ type: "bandpass", frequency: 1260, q: 0.48, gain: 0.023 }),
      detail: Object.freeze({ type: "highpass", frequency: 6400, q: 0.2, gain: 0.01, pan: 0.24 }),
      drone: Object.freeze({ wave: "triangle", frequency: 110, cutoff: 720, gain: 0.006 }),
      score: Object.freeze({ wave: "square", brightness: 3600 }),
      intro: Object.freeze({ root: 220, intervals: Object.freeze([0, 7, 10]) })
    }),
    Object.freeze({
      id: "morning-life", texture: "morning", layers: Object.freeze(["waking-street", "kitchen-clatter", "morning-light"]),
      bed: Object.freeze({ type: "lowpass", frequency: 560, q: 0.38, gain: 0.019 }),
      detail: Object.freeze({ type: "bandpass", frequency: 2860, q: 0.66, gain: 0.008, pan: -0.2 }),
      drone: Object.freeze({ wave: "sine", frequency: 220, cutoff: 1320, gain: 0.005 }),
      score: Object.freeze({ wave: "triangle", brightness: 3400 }),
      intro: Object.freeze({ root: 329.63, intervals: Object.freeze([0, 4, 7]) })
    }),
    Object.freeze({
      id: "storm-flyover", texture: "storm", layers: Object.freeze(["heavy-rain", "flyover-rumble", "warning-signal"]),
      bed: Object.freeze({ type: "lowpass", frequency: 390, q: 0.62, gain: 0.072 }),
      detail: Object.freeze({ type: "bandpass", frequency: 1540, q: 0.76, gain: 0.035, pan: 0.16 }),
      drone: Object.freeze({ wave: "sawtooth", frequency: 46.25, cutoff: 290, gain: 0.014 }),
      score: Object.freeze({ wave: "sawtooth", brightness: 1900 }),
      intro: Object.freeze({ root: 73.42, intervals: Object.freeze([0, 3, 6]) })
    }),
    Object.freeze({
      id: "dawn-home", texture: "dawn", layers: Object.freeze(["first-train", "memory-reprise", "sunrise-chimes"]),
      bed: Object.freeze({ type: "bandpass", frequency: 690, q: 0.4, gain: 0.019 }),
      detail: Object.freeze({ type: "highpass", frequency: 3480, q: 0.22, gain: 0.008, pan: 0.26 }),
      drone: Object.freeze({ wave: "sine", frequency: 130.81, cutoff: 1540, gain: 0.007 }),
      score: Object.freeze({ wave: "sine", brightness: 3900 }),
      intro: Object.freeze({ root: 261.63, intervals: Object.freeze([0, 7, 12, 16]) })
    })
  ]);
  const DANGER_BAND_RANK = Object.freeze({ steady: 0, strained: 1, danger: 2, critical: 3, failed: 4 });
  const KIND_NOTES = Object.freeze({
    book: 523.25, record: 440, drink: 659.25, coffee: 659.25, ticket: 587.33,
    umbrella: 493.88, flower: 698.46, camera: 783.99, key: 880, plant: 554.37,
    map: 622.25, wristband: 740, groceries: 466.16, note: 570, photo: 784,
    lamp: 830.61, cloth: 622.25, snack: 698.46, packet: 587.33
  });

  const POWERUP_PROFILES = Object.freeze({
    magnet: Object.freeze({ root: 392, wave: "triangle", start: Object.freeze([1, 1.5, 2.25]), sustain: Object.freeze([1.5, 2]), finish: 0.72, noise: 2380, pan: 0.62 }),
    shield: Object.freeze({ root: 261.63, wave: "sine", start: Object.freeze([1, 2, 3]), sustain: Object.freeze([1, 1.5]), finish: 0.5, noise: 920, pan: 0.18 }),
    multiplier: Object.freeze({ root: 523.25, wave: "square", start: Object.freeze([1, 1.25, 1.5]), sustain: Object.freeze([1.5, 2]), finish: 1.25, noise: 4100, pan: 0.46 }),
    overdrive: Object.freeze({ root: 110, wave: "sawtooth", start: Object.freeze([1, 2, 4]), sustain: Object.freeze([2, 3]), finish: 0.42, noise: 5800, pan: 0.32 })
  });

  const MUSIC_PROFILES = Object.freeze({
    warm: Object.freeze({ wave: "triangle", motif: Object.freeze([0, 4, 7, 11]), brightness: 1850, transpose: 0 }),
    bright: Object.freeze({ wave: "sine", motif: Object.freeze([0, 7, 12, 16]), brightness: 4600, transpose: 12 }),
    dreamy: Object.freeze({ wave: "sine", motif: Object.freeze([0, 2, 7, 9]), brightness: 2450, transpose: 12 }),
    pulse: Object.freeze({ wave: "square", motif: Object.freeze([0, 5, 7, 12]), brightness: 3300, transpose: 0 }),
    electric: Object.freeze({ wave: "sawtooth", motif: Object.freeze([0, 3, 7, 10]), brightness: 3900, transpose: 0 })
  });

  const OSCILLATOR_TYPES = Object.freeze(["sine", "triangle", "square", "sawtooth"]);
  const MUSIC_PROFILE_ALIASES = Object.freeze({
    acoustic: "warm", soft: "warm", gentle: "warm", guitar: "warm",
    sparkle: "bright", bell: "bright", hopeful: "bright",
    ambient: "dreamy", airy: "dreamy", memory: "dreamy",
    rhythmic: "pulse", playful: "pulse", chiptune: "pulse",
    neon: "electric", bold: "electric", synth: "electric"
  });

  const DIRECTOR_COMMAND_REORDER_WINDOW = 32;

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function midi(value) { return 440 * Math.pow(2, (value - 69) / 12); }

  function parseDirectorCommandId(id) {
    const parts = String(id || "").split(":");
    for (let index = parts.length - 2; index >= 1; index -= 1) {
      if (!/^\d+$/.test(parts[index - 1]) || !/^\d+$/.test(parts[index])) continue;
      const attempt = Number(parts[index - 1]);
      const ordinal = Number(parts[index]);
      if (Number.isSafeInteger(attempt) && attempt > 0 && Number.isSafeInteger(ordinal) && ordinal > 0) {
        return { attempt, ordinal };
      }
    }
    return null;
  }

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
      this.flowMix = 0;
      this.flowTier = 0;
      this.speed = 11;
      this.targetSpeed = 11;
      this.speedTier = 0;
      this.speedTierMix = 0;
      this.drive = 0;
      this.tempoBpm = TEMPOS[0];
      this.tempoTarget = TEMPOS[0];
      this.actIndex = 0;
      this.actId = ACT_AUDIO_PROFILES[0][0].id;
      this.actTempoBpm = TEMPOS[0];
      this.actRhythm = {
        id: ACT_AUDIO_PROFILES[0][0].rhythm,
        density: ACT_AUDIO_PROFILES[0][0].density,
        pulse: ACT_AUDIO_PROFILES[0][0].pulse.slice(),
        swing: 0
      };
      this.semanticMode = SEMANTIC_REWARD_PROFILES[0].id;
      this.semanticStrength = 0;
      this.semanticStrengthTarget = 0;
      this.semanticExpiresAt = 0;
      this.directorClock = 0;
      this.directorDensity = this.actRhythm.density;
      this.directorDensityTarget = this.actRhythm.density;
      this.directorTempoOffset = 0;
      this.directorStillnessUntil = 0;
      this.directorSetbackUntil = 0;
      this.directorSetback = 0;
      this.lastActSignature = "";
      this.processedDirectorCommands = new Set();
      this.directorCommandWatermark = { attempt: 0, ordinal: 0 };
      this.directorCommandRecentOrdinals = new Set();
      this.percussionLevel = 0;
      this.highFrequencyLevel = 0;
      this.rhythmGainTarget = 0.62;
      this.highGainTarget = 0.34;
      this.flowGainTarget = null;
      this.arrival = false;
      this.stepClock = 0;
      this.stepSide = 1;
      this.rhythm = null;
      this.highs = null;
      this.interactionMusic = null;
      this.activePowerups = new Set();
      this.powerupLastAt = Object.create(null);
      this.powerupSteps = Object.create(null);
      this.ambientSource = null;
      this.ambientFilter = null;
      this.ambientGain = null;
      this.ambientDetailSource = null;
      this.ambientDetailFilter = null;
      this.ambientDetailGain = null;
      this.ambientDetailPanner = null;
      this.ambientDrone = null;
      this.ambientDroneFilter = null;
      this.ambientDroneGain = null;
      this.dangerOscillator = null;
      this.dangerFilter = null;
      this.dangerGain = null;
      this.soundscape = SOUNDSCAPE_PROFILES[0];
      this.dangerBand = "steady";
      this.dangerRank = 0;
      this.dangerCondition = 100;
      this.dangerMixTarget = 0.0001;
      this.dangerFrequencyTarget = 72;
      this.dangerFilterTarget = 260;
      this.stageIntroActive = false;
      this.lastStageBeatKey = "";
      this.failureActive = false;
      this.lastFailureKey = "";
    }

    start() {
      if (this.started) {
        if (!this.manuallyMuted && this.context?.state === "suspended") this.resume();
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
      this.rhythm = this.context.createGain();
      this.rhythm.gain.value = 0.62;
      this.highs = this.context.createGain();
      this.highs.gain.value = 0.34;
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

      this.rhythm.connect(this.music);
      this.highs.connect(this.music);
      this.music.connect(this.master);
      this.sfx.connect(this.master);
      this.ambience.connect(this.master);
      this.master.connect(limiter);
      limiter.connect(this.context.destination);

      this.noiseBuffer = this.makeNoiseBuffer(2);
      this.startAmbience();
      this.applySoundscape(this.stageNumber, true);
      this.updateDangerGraph(true);
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
      const detailSource = this.context.createBufferSource();
      const detailFilter = this.context.createBiquadFilter();
      const detailGain = this.context.createGain();
      const detailPanner = this.context.createStereoPanner?.() || null;
      const drone = this.context.createOscillator();
      const droneFilter = this.context.createBiquadFilter();
      const droneGain = this.context.createGain();
      const dangerOscillator = this.context.createOscillator();
      const dangerFilter = this.context.createBiquadFilter();
      const dangerGain = this.context.createGain();

      source.buffer = this.noiseBuffer;
      source.loop = true;
      filter.type = "lowpass";
      filter.frequency.value = 620;
      filter.Q.value = 0.55;
      gain.gain.value = 0.035;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambience);

      detailSource.buffer = this.noiseBuffer;
      detailSource.loop = true;
      detailFilter.type = "highpass";
      detailFilter.frequency.value = 3900;
      detailFilter.Q.value = 0.24;
      detailGain.gain.value = 0.017;
      detailSource.connect(detailFilter);
      detailFilter.connect(detailGain);
      if (detailPanner) {
        detailGain.connect(detailPanner);
        detailPanner.connect(this.ambience);
      } else detailGain.connect(this.ambience);

      drone.type = "sine";
      drone.frequency.value = 146.83;
      droneFilter.type = "lowpass";
      droneFilter.frequency.value = 980;
      droneFilter.Q.value = 0.5;
      droneGain.gain.value = 0.005;
      drone.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(this.ambience);
      droneGain.connect(this.reverb);

      dangerOscillator.type = "sine";
      dangerOscillator.frequency.value = 72;
      dangerFilter.type = "lowpass";
      dangerFilter.frequency.value = 260;
      dangerFilter.Q.value = 0.8;
      dangerGain.gain.value = 0.0001;
      dangerOscillator.connect(dangerFilter);
      dangerFilter.connect(dangerGain);
      dangerGain.connect(this.sfx);

      source.start();
      detailSource.start();
      drone.start();
      dangerOscillator.start();
      this.ambientSource = source;
      this.ambientFilter = filter;
      this.ambientGain = gain;
      this.ambientDetailSource = detailSource;
      this.ambientDetailFilter = detailFilter;
      this.ambientDetailGain = detailGain;
      this.ambientDetailPanner = detailPanner;
      this.ambientDrone = drone;
      this.ambientDroneFilter = droneFilter;
      this.ambientDroneGain = droneGain;
      this.dangerOscillator = dangerOscillator;
      this.dangerFilter = dangerFilter;
      this.dangerGain = dangerGain;
    }

    rampParam(param, value, at, timeConstant = 0.5, immediate = false) {
      if (!param) return;
      if (immediate) param.setValueAtTime(value, at);
      else param.setTargetAtTime(value, at, timeConstant);
    }

    applySoundscape(stageNumber = this.stageNumber, immediate = false) {
      const profile = SOUNDSCAPE_PROFILES[clamp(Math.trunc(stageNumber) || 1, 1, 7) - 1];
      this.soundscape = profile;
      if (!this.context) return profile;
      const at = this.context.currentTime;
      this.ambientFilter.type = profile.bed.type;
      this.ambientDetailFilter.type = profile.detail.type;
      this.ambientDrone.type = profile.drone.wave;
      this.rampParam(this.ambientFilter.frequency, profile.bed.frequency, at, 0.72, immediate);
      this.rampParam(this.ambientFilter.Q, profile.bed.q, at, 0.72, immediate);
      this.rampParam(this.ambientGain.gain, profile.bed.gain, at, 0.72, immediate);
      this.rampParam(this.ambientDetailFilter.frequency, profile.detail.frequency, at, 0.6, immediate);
      this.rampParam(this.ambientDetailFilter.Q, profile.detail.q, at, 0.6, immediate);
      this.rampParam(this.ambientDetailGain.gain, profile.detail.gain, at, 0.72, immediate);
      this.rampParam(this.ambientDetailPanner?.pan, profile.detail.pan, at, 0.8, immediate);
      this.rampParam(this.ambientDrone.frequency, profile.drone.frequency, at, 0.85, immediate);
      this.rampParam(this.ambientDroneFilter.frequency, profile.drone.cutoff, at, 0.85, immediate);
      this.rampParam(this.ambientDroneGain.gain, profile.drone.gain, at, 0.85, immediate);
      return profile;
    }

    setStage(stageNumber, condition = this.condition, combo = this.combo) {
      const nextStage = clamp(Math.trunc(stageNumber) || 1, 1, 7);
      const stageChanged = nextStage !== this.stageNumber;
      this.stageNumber = nextStage;
      this.condition = clamp(Number(condition) || 0, 0, 100);
      this.combo = Math.max(0, Number(combo) || 0);
      if (stageChanged) {
        const act = ACT_AUDIO_PROFILES[this.stageNumber - 1][0];
        const reward = SEMANTIC_REWARD_PROFILES[this.stageNumber - 1];
        this.actIndex = 0;
        this.actId = act.id;
        this.actTempoBpm = act.bpm;
        this.actRhythm = { id: act.rhythm, density: act.density, pulse: act.pulse.slice(), swing: 0 };
        this.semanticMode = reward.id;
        this.semanticStrength = 0;
        this.semanticStrengthTarget = 0;
        this.semanticExpiresAt = 0;
        this.directorDensity = act.density;
        this.directorDensityTarget = act.density;
        this.directorTempoOffset = 0;
        this.directorStillnessUntil = 0;
        this.directorSetbackUntil = 0;
        this.directorSetback = 0;
        this.lastActSignature = "";
      }
      this.tempoTarget = this.actTempoBpm + this.drive * 26;
      this.applySoundscape(this.stageNumber);
    }

    resolveStageNumber(data, fallback = this.stageNumber) {
      if (Number.isFinite(Number(data))) return clamp(Math.trunc(Number(data)) || 1, 1, 7);
      const value = data && typeof data === "object" ? data : {};
      const stageIndex = Number(value.stageIndex ?? value.stage?.index);
      if (Number.isFinite(stageIndex)) return clamp(Math.trunc(stageIndex) + 1, 1, 7);
      const stageNumber = Number(value.stageNumber ?? value.stage?.order ?? value.chapterNumber);
      if (Number.isFinite(stageNumber)) return clamp(Math.trunc(stageNumber) || 1, 1, 7);
      const stageId = String(value.stageId ?? value.stage?.id ?? "");
      const idIndex = STAGE_IDS.indexOf(stageId);
      return idIndex >= 0 ? idIndex + 1 : clamp(Math.trunc(fallback) || 1, 1, 7);
    }

    resolveActProfile(stageNumber = this.stageNumber, actIndex = this.actIndex) {
      const stage = clamp(Math.trunc(stageNumber) || 1, 1, 7);
      const act = clamp(Math.trunc(actIndex) || 0, 0, 2);
      return ACT_AUDIO_PROFILES[stage - 1][act];
    }

    normalizeActRhythm(value, fallback) {
      const source = value && typeof value === "object" ? value : {};
      const pulse = Array.isArray(source.pulse)
        ? [...new Set(source.pulse.map((step) => clamp(Math.trunc(step), 0, 15)))].sort((left, right) => left - right)
        : fallback.pulse.slice();
      return {
        id: typeof value === "string" ? value : String(source.id || source.name || fallback.rhythm),
        density: clamp(Number(source.density ?? fallback.density), 0.25, 1.2),
        pulse: pulse.length ? pulse : fallback.pulse.slice(),
        swing: clamp(Number(source.swing) || 0, -0.35, 0.35)
      };
    }

    setAct(stageOrData = {}, actIndex, options = {}) {
      const value = stageOrData && typeof stageOrData === "object"
        ? stageOrData
        : { stageNumber: stageOrData, actIndex, ...(options && typeof options === "object" ? options : {}) };
      const stageNumber = this.resolveStageNumber(value);
      if (stageNumber !== this.stageNumber) this.setStage(stageNumber, value.condition ?? this.condition, value.combo ?? this.combo);
      const nextActIndex = clamp(Math.trunc(Number(value.actIndex ?? value.act?.index ?? actIndex)) || 0, 0, 2);
      const fallback = this.resolveActProfile(stageNumber, nextActIndex);
      const rewardValue = value.semanticReward ?? value.reward ?? value.semanticMode;
      const reward = rewardValue && typeof rewardValue === "object" ? rewardValue : {};
      const semanticMode = String(
        (typeof rewardValue === "string" ? rewardValue : reward.id || reward.mode) ||
        SEMANTIC_REWARD_PROFILES[stageNumber - 1].id
      );
      const bpmValue = Number(value.bpm ?? value.tempoBpm ?? value.tempo ?? value.act?.bpm);
      const bpm = clamp(Number.isFinite(bpmValue) ? bpmValue : fallback.bpm, 60, 180);
      const rhythm = this.normalizeActRhythm(value.rhythm ?? value.act?.rhythm, fallback);
      const actId = String(value.actId || value.id || value.act?.id || fallback.id);
      const signature = [stageNumber, nextActIndex, actId, bpm, rhythm.id, rhythm.density, rhythm.pulse.join(","), rhythm.swing, semanticMode].join("|");
      if (signature === this.lastActSignature && value.force !== true) return false;

      this.actIndex = nextActIndex;
      this.actId = actId;
      this.actTempoBpm = bpm;
      this.actRhythm = rhythm;
      this.semanticMode = semanticMode;
      this.semanticStrength = 0;
      this.semanticStrengthTarget = 0;
      this.semanticExpiresAt = 0;
      this.directorTempoOffset = 0;
      this.directorDensity = rhythm.density;
      this.directorDensityTarget = rhythm.density;
      this.directorStillnessUntil = 0;
      this.directorSetbackUntil = 0;
      this.directorSetback = 0;
      this.lastActSignature = signature;
      this.tempoTarget = bpm;
      if (this.context) this.restoreDirectorLayers(false);
      const initialStrength = Number(reward.strength ?? value.rewardStrength);
      if (Number.isFinite(initialStrength) && initialStrength > 0) {
        this.applySemanticReward({ ...reward, strength: initialStrength }, Number(value.durationMs) || 1800, semanticMode);
      }
      return true;
    }

    directorNow() {
      return Math.max(this.directorClock, Number(this.context?.currentTime) || 0);
    }

    rememberDirectorCommand(id) {
      if (!id) return true;
      const key = String(id);
      const parsed = parseDirectorCommandId(key);
      if (!parsed) {
        if (this.processedDirectorCommands.has(key)) return false;
        this.processedDirectorCommands.add(key);
        return true;
      }

      const watermark = this.directorCommandWatermark;
      if (parsed.attempt < watermark.attempt) return false;
      if (parsed.attempt > watermark.attempt) {
        watermark.attempt = parsed.attempt;
        watermark.ordinal = 0;
        this.directorCommandRecentOrdinals.clear();
      }

      const retiredThrough = Math.max(0, watermark.ordinal - DIRECTOR_COMMAND_REORDER_WINDOW);
      if (parsed.ordinal <= retiredThrough || this.directorCommandRecentOrdinals.has(parsed.ordinal)) return false;

      this.directorCommandRecentOrdinals.add(parsed.ordinal);
      watermark.ordinal = Math.max(watermark.ordinal, parsed.ordinal);
      const nextRetiredThrough = Math.max(0, watermark.ordinal - DIRECTOR_COMMAND_REORDER_WINDOW);
      for (const ordinal of this.directorCommandRecentOrdinals) {
        if (ordinal <= nextRetiredThrough) this.directorCommandRecentOrdinals.delete(ordinal);
      }
      return true;
    }

    playDirectorMotif(mode = this.semanticMode, strength = 0.7, resolution = false) {
      if (!this.context || !this.sfx) return false;
      const at = this.context.currentTime;
      const profile = this.soundscape || SOUNDSCAPE_PROFILES[this.stageNumber - 1];
      const root = profile.intro.root * (resolution ? 2 : 1);
      const volume = 0.018 + clamp(strength, 0, 1) * 0.026;
      if (mode === "step-match") {
        this.pluck(root * 2, at, 0.22, volume, -0.34, "triangle", 2600, this.sfx);
        this.pluck(root * 2, at + 0.07, 0.22, volume, 0.34, "triangle", 2600, this.sfx);
      } else if (mode === "dual-melody") {
        this.tone(root * 2, 0.42, volume, 0, "sine", -0.48, root * 2.5);
        this.tone(root * 2.5, 0.42, volume, 0.08, "triangle", 0.48, root * 3);
      } else if (mode === "daily-layer") {
        this.pluck(root * 2, at, 0.34, volume, -0.22, "triangle", 3300, this.sfx);
        this.noiseHit(at + 0.09, 0.08, 2450, volume * 0.7, "bandpass", this.sfx, 0.22);
      } else if (mode === "listening-space") {
        this.bell(root, at, 0.9, volume * 0.72, this.sfx);
        if (resolution) this.bell(root * 1.5, at + 0.22, 1.1, volume * 0.58, this.sfx);
      } else if (mode === "theme-convergence") {
        this.tone(root * 2, 0.5, volume, 0, "sine", -0.5, root * 2.5);
        this.tone(root * 1.5, 0.58, volume, 0.08, "triangle", 0.5, root * 2);
        if (resolution) this.bell(root * 3, at + 0.2, 1.2, volume, this.sfx);
      } else {
        this.tone(root * 2, 0.3, volume, 0, profile.score.wave, 0, root * 2.5);
        this.noiseHit(at, 0.24, mode === "promise-surge" ? 3900 : 2900, volume * 0.7, "highpass", this.sfx);
      }
      return true;
    }

    applySemanticReward(payload = {}, durationMs = 1800, key = "") {
      const profile = SEMANTIC_REWARD_PROFILES[this.stageNumber - 1];
      const strength = clamp(Number(payload.strength ?? payload.intensity ?? 0.72), 0, 1);
      const requestedMode = payload.semanticReward ?? payload.mode ?? payload.reward;
      this.semanticMode = String((typeof requestedMode === "string" ? requestedMode : requestedMode?.id) || this.semanticMode || profile.id);
      this.semanticStrength = Math.max(this.semanticStrength, strength * 0.68);
      this.semanticStrengthTarget = Math.max(this.semanticStrengthTarget, strength);
      const duration = clamp((Number(payload.durationMs ?? durationMs) || 1800) / 1000, 0.35, 8);
      const now = this.directorNow();
      this.semanticExpiresAt = Math.max(this.semanticExpiresAt, now + duration);
      if (this.semanticMode === "listening-space" || this.stageNumber === 6) {
        this.directorStillnessUntil = Math.max(this.directorStillnessUntil, now + Math.min(1.35, duration * 0.42));
      }
      if (this.context) {
        const at = this.context.currentTime;
        if (this.stageNumber === 6) {
          this.rhythm?.gain.setTargetAtTime(0.12, at, 0.12);
          this.highs?.gain.setTargetAtTime(0.08, at, 0.14);
          this.music?.gain.setTargetAtTime(0.38, at, 0.24);
          this.ambience?.gain.setTargetAtTime(0.2, at, 0.28);
        }
        this.playDirectorMotif(this.semanticMode, strength, false);
      }
      return true;
    }

    applyDirectorSetback(payload = {}, durationMs = 680) {
      const intensity = clamp(Number(payload.intensity ?? 0.62), 0.2, 1);
      const duration = clamp((Number(payload.durationMs ?? durationMs) || 680) / 1000, 0.25, 2.4);
      const now = this.directorNow();
      this.directorSetback = Math.max(this.directorSetback, intensity);
      this.directorSetbackUntil = Math.max(this.directorSetbackUntil, now + duration);
      if (!this.context) return true;
      const at = this.context.currentTime;
      this.rhythm?.gain.cancelScheduledValues(at);
      this.highs?.gain.cancelScheduledValues(at);
      this.rhythm?.gain.setTargetAtTime(Math.max(0.08, this.rhythmGainTarget * (1 - intensity * 0.72)), at, 0.035);
      this.highs?.gain.setTargetAtTime(Math.max(0.05, this.highGainTarget * (1 - intensity * 0.8)), at, 0.035);
      this.rhythm?.gain.setTargetAtTime(this.rhythmGainTarget, at + duration, 0.22);
      this.highs?.gain.setTargetAtTime(this.highGainTarget, at + duration, 0.26);
      this.duckMusic(Math.max(0.12, 0.3 - intensity * 0.14), duration * 0.72);
      return true;
    }

    restoreDirectorLayers(playMotif = true) {
      this.directorSetback = 0;
      this.directorSetbackUntil = 0;
      if (this.context) {
        const at = this.context.currentTime;
        this.rhythm?.gain.cancelScheduledValues(at);
        this.highs?.gain.cancelScheduledValues(at);
        this.rhythm?.gain.setTargetAtTime(this.rhythmGainTarget, at, 0.16);
        this.highs?.gain.setTargetAtTime(this.highGainTarget, at, 0.2);
        this.music?.gain.setTargetAtTime(0.46 + this.flow * 0.18, at, 0.2);
      }
      if (playMotif) this.playDirectorMotif(this.semanticMode, Math.max(0.58, this.semanticStrength), true);
      return true;
    }

    applyDirectorCommand(command = {}) {
      if (!command || typeof command !== "object" || (command.channel && command.channel !== "audio")) return false;
      const supported = new Set(["set-stage", "set-act", "layer", "duck", "thin", "resolve", "motif", "arrival", "reenter-act"]);
      const op = String(command.op || "");
      if (!supported.has(op) || !this.rememberDirectorCommand(command.id)) return false;
      const payload = command.payload && typeof command.payload === "object" ? command.payload : {};
      const durationMs = Number(command.durationMs ?? payload.durationMs) || 0;
      if (op === "set-stage") {
        this.setStage(this.resolveStageNumber(payload), payload.condition ?? this.condition, payload.combo ?? this.combo);
      } else if (op === "set-act") {
        this.setAct({ ...payload, durationMs });
      } else if (op === "layer") {
        this.applySemanticReward(payload, durationMs, command.key);
      } else if (op === "duck" || op === "thin") {
        this.applyDirectorSetback(payload, durationMs);
      } else if (op === "resolve") {
        this.restoreDirectorLayers(true);
      } else if (op === "motif") {
        this.applySemanticReward({ ...payload, semanticReward: payload.semanticReward || this.semanticMode, strength: payload.strength ?? 0.62 }, durationMs || 2200, command.key);
      } else if (op === "arrival") {
        this.setArrival(true);
        this.cue("arrival", payload.itemId);
      } else if (op === "reenter-act") {
        this.setArrival(false);
        this.setAct({ ...payload, force: true });
        this.restoreDirectorLayers(false);
      }
      return true;
    }

    stageIntro(data = {}) {
      const value = data && typeof data === "object" ? data : {};
      const stageNumber = this.resolveStageNumber(value);
      this.setStage(stageNumber, value.condition ?? this.condition, value.combo ?? this.combo);
      this.setArrival(true);
      this.stageIntroActive = true;
      this.failureActive = false;
      this.lastStageBeatKey = "";
      this.lastFailureKey = "";
      if (!this.context || !this.sfx) return false;

      const at = this.context.currentTime;
      const retry = value.reason === "retry";
      const profile = this.soundscape;
      const intervals = retry ? profile.intro.intervals.slice(0, 2) : profile.intro.intervals;
      this.nextStepAt = at + 0.05;
      this.music?.gain.cancelScheduledValues(at);
      this.music?.gain.setTargetAtTime(retry ? 0.36 : 0.42, at, 0.18);
      this.rhythm?.gain.setTargetAtTime(retry ? 0.32 : 0.4, at, 0.2);
      this.highs?.gain.setTargetAtTime(retry ? 0.18 : 0.26, at, 0.22);
      this.ambience?.gain.setTargetAtTime(retry ? 0.14 : 0.18, at, 0.24);
      intervals.forEach((interval, index) => {
        const frequency = profile.intro.root * Math.pow(2, interval / 12);
        this.tone(frequency, retry ? 0.32 : 0.48, (retry ? 0.024 : 0.032) + index * 0.004, index * (retry ? 0.075 : 0.11), profile.score.wave, (index - (intervals.length - 1) / 2) * 0.28, frequency * 1.025);
      });
      return true;
    }

    stageBeat(data = {}) {
      const value = data && typeof data === "object" ? data : {};
      const stageNumber = this.resolveStageNumber(value);
      if (stageNumber !== this.stageNumber) this.setStage(stageNumber);
      const rawBeatIndex = Number(value.beatIndex ?? value.beat?.index ?? value.currentBeat?.index ?? 0);
      const beatIndex = Number.isFinite(rawBeatIndex) ? Math.max(0, Math.trunc(rawBeatIndex)) : 0;
      const performanceId = value.openingPerformance?.id || value.performanceId || value.reason || "intro";
      const beatId = value.beat?.id || value.currentBeat?.id || beatIndex;
      const beatKey = `${stageNumber}:${performanceId}:${beatId}`;
      if (beatKey === this.lastStageBeatKey) return false;
      this.lastStageBeatKey = beatKey;
      if (!this.context || !this.sfx) return false;

      const at = this.context.currentTime;
      const profile = this.soundscape;
      const interval = profile.intro.intervals[beatIndex % profile.intro.intervals.length];
      const frequency = profile.intro.root * Math.pow(2, (interval + 12) / 12);
      const pan = beatIndex % 2 ? 0.32 : -0.32;
      this.tone(frequency, 0.34 + Math.min(2, beatIndex) * 0.07, 0.032 + Math.min(2, beatIndex) * 0.006, 0, profile.score.wave, pan, frequency * (beatIndex >= 2 ? 1.12 : 1.035));
      if (beatIndex >= 2) this.tone(frequency * 1.5, 0.4, 0.026, 0.085, "sine", -pan, frequency * 2);
      this.playStageTexture(profile, at, beatIndex);
      return true;
    }

    playStageTexture(profile, at, beatIndex) {
      if (profile.texture === "rain") {
        [0, 0.08, 0.17].forEach((delay, index) => this.noiseHit(at + delay, 0.12, 3600 + index * 1050, 0.026 - index * 0.004, "highpass", this.sfx, -0.55 + index * 0.5));
      } else if (profile.texture === "pages") {
        this.noiseHit(at, 0.42, beatIndex % 2 ? 1760 : 1180, 0.042, "bandpass", this.sfx, beatIndex % 2 ? 0.65 : -0.65);
        this.bell(1046.5, at + 0.12, 0.52, 0.024, this.sfx);
      } else if (profile.texture === "metro") {
        this.noiseHit(at, 0.48, beatIndex === 1 ? 2650 : 1850, 0.04, "bandpass", this.sfx, beatIndex % 2 ? 0.72 : -0.72);
        this.tone(880 + beatIndex * 110, 0.1, 0.034, 0.045, "square", -0.2, 760 + beatIndex * 80);
      } else if (profile.texture === "market") {
        this.kick(at, 0.13);
        this.noiseHit(at + 0.09, 0.095, 2800 + beatIndex * 260, 0.052, "bandpass", this.sfx, beatIndex % 2 ? 0.4 : -0.4);
      } else if (profile.texture === "morning") {
        this.pluck(659.25 + beatIndex * 110, at, 0.3, 0.033, -0.3, "triangle", 3600, this.sfx);
        this.bell(1318.51, at + 0.11, 0.5, 0.02, this.sfx);
      } else if (profile.texture === "storm") {
        this.noiseHit(at, 0.9, beatIndex === 0 ? 310 : 720, 0.095, "lowpass", this.sfx, beatIndex % 2 ? 0.34 : -0.34);
        this.tone(82.41, 0.72, 0.055, 0.03, "sawtooth", 0, beatIndex >= 2 ? 55 : 68);
      } else {
        this.bell(783.99 + beatIndex * 130.81, at, 0.88, 0.036, this.sfx);
        this.tone(261.63 * Math.pow(2, beatIndex * 7 / 12), 0.46, 0.026, 0.08, "sine", beatIndex % 2 ? 0.3 : -0.3, 523.25 * Math.pow(2, beatIndex * 4 / 12));
      }
    }

    normalizeDangerBand(band, condition) {
      let requestedBand = band;
      let requestedCondition = condition;
      if (band && typeof band === "object") {
        requestedBand = band.band ?? band.level ?? band.name;
        requestedCondition = band.condition ?? band.value ?? condition;
      }
      if (Number.isFinite(Number(requestedBand)) && requestedCondition === undefined) {
        requestedCondition = Number(requestedBand);
        requestedBand = "";
      }
      const nextCondition = clamp(Number.isFinite(Number(requestedCondition)) ? Number(requestedCondition) : this.dangerCondition, 0, 100);
      const aliases = { safe: "steady", low: "strained", warning: "danger", high: "critical", failure: "failed" };
      let name = aliases[String(requestedBand || "").toLowerCase()] || String(requestedBand || "").toLowerCase();
      if (!(name in DANGER_BAND_RANK)) {
        name = nextCondition <= 0 ? "failed" : nextCondition <= 15 ? "critical" : nextCondition <= 35 ? "danger" : nextCondition <= 60 ? "strained" : "steady";
      }
      return { name, condition: nextCondition, rank: DANGER_BAND_RANK[name] };
    }

    updateDangerGraph(immediate = false) {
      if (!this.context || !this.dangerOscillator || !this.dangerGain) return;
      const at = this.context.currentTime;
      const urgency = clamp(1 - this.dangerCondition / 100, 0, 1);
      const target = this.dangerRank >= 4 ? 0.0001 : this.dangerRank === 3 ? 0.014 + urgency * 0.006 : this.dangerRank === 2 ? 0.007 + urgency * 0.004 : this.dangerRank === 1 ? 0.0022 : 0.0001;
      if (immediate || Math.abs(target - this.dangerMixTarget) >= 0.0008) {
        this.dangerMixTarget = target;
        this.rampParam(this.dangerGain.gain, target, at, this.dangerRank >= 3 ? 0.08 : 0.24, immediate);
      }
      const frequencyTarget = 68 + this.dangerRank * 7 + urgency * 12;
      if (immediate || Math.abs(frequencyTarget - this.dangerFrequencyTarget) >= 0.5) {
        this.dangerFrequencyTarget = frequencyTarget;
        this.rampParam(this.dangerOscillator.frequency, frequencyTarget, at, 0.14, immediate);
      }
      const filterTarget = 220 + this.dangerRank * 75 + urgency * 90;
      if (immediate || Math.abs(filterTarget - this.dangerFilterTarget) >= 2.5) {
        this.dangerFilterTarget = filterTarget;
        this.rampParam(this.dangerFilter.frequency, filterTarget, at, 0.18, immediate);
      }
    }

    setDanger(band, value) {
      const next = this.normalizeDangerBand(band, value);
      const previousRank = this.dangerRank;
      const changed = next.name !== this.dangerBand;
      this.dangerBand = next.name;
      this.dangerRank = next.rank;
      this.dangerCondition = next.condition;
      this.condition = next.condition;
      this.updateDangerGraph();
      if (!changed || !this.context || !this.sfx) return changed;

      const at = this.context.currentTime;
      if (next.rank > previousRank) {
        this.duckMusic(next.rank >= 3 ? 0.14 : 0.24, next.rank >= 3 ? 0.62 : 0.4);
        this.noiseHit(at, 0.2 + next.rank * 0.07, next.rank >= 3 ? 520 : 980, 0.04 + next.rank * 0.024, "bandpass", this.sfx);
        this.tone(118 - next.rank * 9, 0.24 + next.rank * 0.06, 0.045 + next.rank * 0.018, 0, "sawtooth", 0, 68 - next.rank * 3);
      } else {
        this.tone(196, 0.24, 0.026, 0, "sine", -0.18, 293.66);
        if (next.rank === 0) this.bell(587.33, at + 0.05, 0.48, 0.018, this.sfx);
      }
      return true;
    }

    failure(data = {}) {
      const value = data && typeof data === "object" ? data : {};
      const stageNumber = this.resolveStageNumber(value);
      const checkpointReached = Boolean(value.checkpointReached ?? value.checkpoint?.reached);
      const failureKey = `${stageNumber}:${checkpointReached ? "checkpoint" : "restart"}`;
      if (this.failureActive && this.lastFailureKey === failureKey) return false;
      this.setStage(stageNumber, 0, 0);
      this.setArrival(true);
      this.stageIntroActive = false;
      this.failureActive = true;
      this.lastFailureKey = failureKey;
      this.setDanger("failed", 0);
      if (!this.context || !this.sfx) return false;

      const at = this.context.currentTime;
      const profile = this.soundscape;
      this.nextStepAt = at + 0.16;
      this.music?.gain.cancelScheduledValues(at);
      this.music?.gain.setTargetAtTime(0.07, at, 0.18);
      this.rhythm?.gain.setTargetAtTime(0.05, at, 0.12);
      this.highs?.gain.setTargetAtTime(0.04, at, 0.12);
      this.ambience?.gain.setTargetAtTime(profile.texture === "storm" ? 0.2 : 0.1, at, 0.35);
      this.noiseHit(at, profile.texture === "storm" ? 1.1 : 0.58, profile.texture === "storm" ? 260 : 480, profile.texture === "storm" ? 0.13 : 0.085, "lowpass", this.sfx);
      [12, 7, 3, 0].forEach((interval, index) => {
        const frequency = profile.intro.root * Math.pow(2, interval / 12);
        this.tone(frequency, 0.38 + index * 0.1, 0.046 - index * 0.006, index * 0.1, index < 2 ? profile.score.wave : "sine", (index - 1.5) * 0.16, frequency * (index === 3 ? 0.72 : 0.94));
      });
      if (checkpointReached) {
        this.bell(profile.intro.root * 2, at + 0.62, 1.1, 0.032, this.sfx);
        this.bell(profile.intro.root * 2.5, at + 0.78, 1.25, 0.022, this.sfx);
      } else this.noiseHit(at + 0.58, 0.72, 180, 0.07, "lowpass", this.sfx);
      return true;
    }

    setFlow(value) {
      const nextFlow = clamp(Number(value) || 0, 0, 1);
      const nextTier = nextFlow >= 0.72 ? 2 : nextFlow >= 0.34 ? 1 : 0;
      const previousTier = this.flowTier;
      this.flow = nextFlow;
      this.flowTier = nextTier;
      if (!this.context) return;
      const now = this.context.currentTime;
      if (this.flowGainTarget === null || Math.abs(nextFlow - this.flowGainTarget) >= 0.002) {
        this.flowGainTarget = nextFlow;
        this.music?.gain.setTargetAtTime(0.46 + nextFlow * 0.18, now, 0.16);
        this.ambience?.gain.setTargetAtTime(0.13 + nextFlow * 0.055, now, 0.24);
      }
      if (nextTier > previousTier) {
        const chord = CHORDS[this.stageNumber - 1][this.bar % 4];
        const root = midi(chord[0] + (nextTier === 2 ? 12 : 0));
        this.noiseHit(now, 0.72, 2200 + nextTier * 1400, 0.045 + nextTier * 0.015, "highpass", this.sfx);
        [1, 1.25, 1.5].forEach((ratio, index) => {
          this.tone(root * ratio, 0.28 + index * 0.09, 0.025 + nextTier * 0.012, index * 0.07, "triangle", (index - 1) * 0.38, root * ratio * 1.18);
        });
      }
    }

    normalizeSpeedTier(value, speed = this.targetSpeed) {
      let tier = value;
      if (tier && typeof tier === "object") tier = tier.level ?? tier.index ?? tier.tier ?? tier.name;
      if (typeof tier === "string") {
        const namedTiers = { calm: 0, cruise: 0, warm: 1, fast: 2, rush: 3, overdrive: 4 };
        tier = namedTiers[tier.toLowerCase()];
      }
      if (!Number.isFinite(Number(tier))) {
        const measuredSpeed = Number(speed) || 0;
        tier = measuredSpeed >= 31 ? 4 : measuredSpeed >= 27 ? 3 : measuredSpeed >= 22 ? 2 : measuredSpeed >= 17 ? 1 : 0;
      }
      return clamp(Number(tier), 0, 4);
    }

    updateDirectorEnvelope(delta) {
      const elapsed = clamp(Number(delta) || 1 / 60, 1 / 240, 0.25);
      this.directorClock += elapsed;
      const now = this.directorNow();
      if (this.semanticExpiresAt > 0 && now >= this.semanticExpiresAt) this.semanticStrengthTarget = 0;
      if (this.directorSetbackUntil > 0 && now >= this.directorSetbackUntil) {
        this.directorSetbackUntil = 0;
        this.directorSetback = 0;
      }
      const blend = 1 - Math.exp(-elapsed / (this.semanticStrengthTarget > this.semanticStrength ? 0.18 : 0.72));
      this.semanticStrength += (this.semanticStrengthTarget - this.semanticStrength) * blend;
      if (this.semanticStrength < 0.002 && this.semanticStrengthTarget === 0) this.semanticStrength = 0;
      const reward = SEMANTIC_REWARD_PROFILES[this.stageNumber - 1];
      const listening = this.stageNumber === 6 || this.semanticMode === "listening-space";
      this.directorTempoOffset = reward.tempoDelta * this.semanticStrength;
      this.directorDensityTarget = clamp(
        this.actRhythm.density * (1 + (reward.densityScale - 1) * this.semanticStrength) * (1 - this.directorSetback * 0.46),
        listening ? 0.2 : 0.32,
        1.16
      );
      const densityBlend = 1 - Math.exp(-elapsed / 0.28);
      this.directorDensity += (this.directorDensityTarget - this.directorDensity) * densityBlend;
    }

    updateDrive(delta, speed, speedTier) {
      const elapsed = clamp(Number(delta) || 1 / 60, 1 / 240, 0.25);
      this.updateDirectorEnvelope(elapsed);
      const blend = 1 - Math.exp(-elapsed / 0.42);
      const tempoBlend = 1 - Math.exp(-elapsed / 0.58);
      const measuredSpeed = clamp(Number(speed) || this.targetSpeed, 0, 42);
      this.targetSpeed = measuredSpeed;
      this.speedTier = this.normalizeSpeedTier(speedTier, measuredSpeed);
      this.speed += (measuredSpeed - this.speed) * blend;
      this.flowMix += (this.flow - this.flowMix) * blend;
      this.speedTierMix += (this.speedTier / 4 - this.speedTierMix) * blend;

      const speedMix = clamp((this.speed - 11) / 19, 0, 1);
      const driveTarget = clamp(speedMix * 0.44 + this.flowMix * 0.34 + this.speedTierMix * 0.22, 0, 1);
      this.drive += (driveTarget - this.drive) * blend;
      const percussionTarget = clamp((0.16 + this.drive * 0.76 + this.speedTierMix * 0.08) * this.directorDensity, 0, 1);
      const highTarget = clamp((0.08 + this.drive * 0.66 + this.flowMix * 0.2 + this.speedTierMix * 0.06) * (0.72 + this.directorDensity * 0.28), 0, 1);
      this.percussionLevel += (percussionTarget - this.percussionLevel) * blend;
      this.highFrequencyLevel += (highTarget - this.highFrequencyLevel) * blend;

      const listeningStrength = this.stageNumber === 6 ? this.semanticStrength : 0;
      const performanceScale = 1 - listeningStrength * 0.88;
      const performanceTempo = (speedMix * 11 + this.flowMix * 8 + this.speedTierMix * 7) * performanceScale;
      this.tempoTarget = this.actTempoBpm + performanceTempo + this.directorTempoOffset;
      this.tempoBpm += (this.tempoTarget - this.tempoBpm) * tempoBlend;
      if (this.context) {
        const now = this.context.currentTime;
        const rhythmTarget = (0.54 + this.percussionLevel * 0.56) * clamp(this.directorDensity, 0.34, 1.08);
        const highTargetGain = (0.26 + this.highFrequencyLevel * 0.78) * clamp(0.6 + this.directorDensity * 0.4, 0.66, 1.06);
        if (Math.abs(rhythmTarget - this.rhythmGainTarget) >= 0.003) {
          this.rhythmGainTarget = rhythmTarget;
          this.rhythm?.gain.setTargetAtTime(rhythmTarget, now, 0.12);
        }
        if (Math.abs(highTargetGain - this.highGainTarget) >= 0.003) {
          this.highGainTarget = highTargetGain;
          this.highs?.gain.setTargetAtTime(highTargetGain, now, 0.16);
        }
      }
    }

    resolveMusicProfile(music) {
      const value = music && typeof music === "object" && !Array.isArray(music) ? music : {};
      const descriptors = [
        value.layer, value.timbre,
        ...(Array.isArray(value.layers) ? value.layers : []),
        ...(Array.isArray(value.timbres) ? value.timbres : [])
      ].filter(Boolean).map(String);
      const requestedName = typeof music === "string"
        ? music.toLowerCase()
        : String(value.id || value.name || value.style || value.palette || descriptors.join("-") || "warm").toLowerCase();
      const alias = MUSIC_PROFILE_ALIASES[requestedName] || requestedName;
      const names = Object.keys(MUSIC_PROFILES);
      let hash = 0;
      for (let index = 0; index < requestedName.length; index += 1) hash = (hash * 31 + requestedName.charCodeAt(index)) >>> 0;
      let profileName = alias;
      if (!MUSIC_PROFILES[profileName]) {
        if (/(distort|synth|sequenc|vinyl|analog)/.test(requestedName)) profileName = "electric";
        else if (/(drum|percussion|woodblock|clap|bottle|brush|rhythm)/.test(requestedName)) profileName = "pulse";
        else if (/(bell|marimba|celesta|vibraphone|kalimba|glass)/.test(requestedName)) profileName = "bright";
        else if (/(piano|guitar|bass|brass|horn|clarinet)/.test(requestedName)) profileName = "warm";
        else if (/(string|pad|tape|harmonica|oboe|airy)/.test(requestedName)) profileName = "dreamy";
        else profileName = names[hash % names.length];
      }
      const base = MUSIC_PROFILES[profileName];
      const requestedWave = value.wave || value.waveform || (OSCILLATOR_TYPES.includes(value.timbre) ? value.timbre : null);
      const wave = OSCILLATOR_TYPES.includes(requestedWave) ? requestedWave : base.wave;
      const requestedMotif = value.motif || value.melody || value.intervals || (Array.isArray(music) ? music : null);
      const motif = Array.isArray(requestedMotif)
        ? requestedMotif.map(Number).filter(Number.isFinite).slice(0, 8).map((note) => clamp(note, -24, 36))
        : base.motif.map((note, index) => index === 0 || descriptors.length === 0 ? note : clamp(note + ((hash >>> (index * 2)) % 3) - 1, -24, 36));
      const rawRoot = Number(value.rootFrequency ?? value.frequency ?? value.root);
      const root = Number.isFinite(rawRoot) && rawRoot > 0 ? (rawRoot <= 127 ? midi(rawRoot) : clamp(rawRoot, 40, 4000)) : null;
      const durationValue = Number(value.durationSeconds ?? value.duration ?? (Number(value.durationMs) / 1000));
      const intensityValue = Number(value.intensity);
      const intensity = Number.isFinite(intensityValue) ? clamp(intensityValue, 0, 1) : 0.6;
      const transposeValue = Number(value.transpose);
      const brightnessValue = Number(value.brightness ?? value.cutoff);
      return {
        name: profileName,
        wave,
        motif: motif.length ? motif : base.motif.slice(),
        brightness: clamp(Number.isFinite(brightnessValue) && brightnessValue > 0 ? brightnessValue : base.brightness * (0.82 + intensity * 0.3), 600, 7200),
        transpose: clamp(Number.isFinite(transposeValue) ? transposeValue : base.transpose, -24, 24),
        duration: clamp(durationValue || 2.8, 0.5, 12),
        intensity,
        layers: descriptors,
        root
      };
    }

    currentMusicProfile(at = this.context?.currentTime || 0) {
      if (!this.interactionMusic) return null;
      if (at < this.interactionMusic.expiresAt) return this.interactionMusic;
      if ((this.context?.currentTime || at) >= this.interactionMusic.expiresAt) this.interactionMusic = null;
      return null;
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
      const leavingPresentation = !next && (this.stageIntroActive || this.failureActive);
      if (leavingPresentation) {
        this.stageIntroActive = false;
        this.failureActive = false;
        if (this.context) {
          const at = this.context.currentTime;
          this.music?.gain.cancelScheduledValues(at);
          this.music?.gain.setTargetAtTime(0.46 + this.flow * 0.18, at, 0.2);
          this.rhythm?.gain.setTargetAtTime(this.rhythmGainTarget, at, 0.18);
          this.highs?.gain.setTargetAtTime(this.highGainTarget, at, 0.2);
          this.ambience?.gain.setTargetAtTime(0.13 + this.flow * 0.055, at, 0.28);
        }
      }
      if (next === this.arrival) return;
      this.arrival = next;
      if (this.context) this.nextStepAt = this.context.currentTime + 0.04;
    }

    schedule() {
      if (!this.context || this.context.state !== "running") return;
      const horizon = this.context.currentTime + 0.16;
      while (this.nextStepAt < horizon) {
        this.scheduleStep(this.step, this.nextStepAt);
        const tempo = this.arrival ? 88 : this.tempoBpm;
        this.nextStepAt += 60 / tempo / 4;
        this.step = (this.step + 1) % 16;
        if (this.step === 0) this.bar += 1;
      }
    }

    scheduleStep(step, at) {
      const stageIndex = this.stageNumber - 1;
      const progression = CHORDS[stageIndex];
      const chord = progression[this.bar % progression.length];
      const interactionMusic = this.currentMusicProfile(at);
      const soundscape = this.soundscape || SOUNDSCAPE_PROFILES[stageIndex];
      if (this.failureActive) return;
      if (this.arrival) {
        if (step === 0) this.pad(chord, at, 2.7, 0.052);
        if ([2, 6, 10, 14].includes(step)) {
          this.pluck(midi(chord[(step / 4 | 0) % chord.length] + 12), at, 0.5, 0.026, 0.22, soundscape.score.wave, soundscape.score.brightness);
        }
        if (step === 12) this.bell(midi(chord[2] + 12), at, 0.7, 0.032);
        return;
      }

      const semanticStrength = this.semanticStrength;
      const density = clamp(this.directorDensity, 0.2, 1.16);
      const pulse = this.actRhythm.pulse.includes(step);
      const listeningStillness = (this.stageNumber === 6 || this.semanticMode === "listening-space") && semanticStrength > 0.08 && at < this.directorStillnessUntil;
      const intensity = clamp(0.36 + stageIndex * 0.06 + this.drive * 0.48 + this.flowMix * 0.16 + Math.min(0.2, this.combo * 0.018), 0.35, 1);
      if (listeningStillness) {
        if (step === 0) this.pad(chord, at, 2.35, 0.018 + semanticStrength * 0.008);
        if (step === 8) this.bell(midi(chord[1] + 12), at, 0.95, 0.012 + semanticStrength * 0.006, this.ambience);
        this.scheduleDangerStep(step, at);
        return;
      }
      if (step === 0) this.pad(chord, at, 2.2, 0.027 + stageIndex * 0.0025);
      if (step === 0 || step === 8 || (this.percussionLevel > 0.68 && step === 10)) this.kick(at, 0.09 + intensity * 0.045);
      if (density >= 0.42 && (step === 4 || step === 12)) this.snare(at, 0.05 + intensity * 0.035);
      if (density >= 0.72 && (this.flowMix > 0.72 || this.percussionLevel > 0.76) && (step === 4 || step === 12)) this.kick(at, 0.055 + intensity * 0.028);
      const hatInterval = density >= 0.82 && this.percussionLevel > 0.46 ? 1 : density >= 0.5 ? 2 : 4;
      if (step % hatInterval === 0 && (pulse || density >= 0.7)) this.hat(at, (0.009 + intensity * 0.011 + this.highFrequencyLevel * 0.006) * density, step % 4 === 2);
      if ((pulse || density >= 0.72) && [0, 3, 8, 11].includes(step)) {
        const rootOffset = step === 11 ? 7 : step === 3 ? 12 : 0;
        this.bass(midi(chord[0] - 24 + rootOffset), at, 0.28, 0.035 + intensity * 0.018);
      }
      if (this.stageNumber >= 2 && step % 2 === 0) {
        const noteIndex = (step / 2 + this.bar) % chord.length;
        const octave = (this.stageNumber >= 4 && step % 8 === 6 ? 24 : 12) + (interactionMusic?.transpose || 0);
        this.pluck(
          midi(chord[noteIndex] + octave), at, 0.24, (0.014 + intensity * 0.012) * (interactionMusic ? 0.78 + interactionMusic.intensity * 0.36 : 1), (step / 15) * 1.2 - 0.6,
          interactionMusic?.wave || soundscape.score.wave, interactionMusic?.brightness || soundscape.score.brightness
        );
      }
      if ((this.flowMix > 0.42 || this.highFrequencyLevel > 0.42 || interactionMusic) && step % 2 === 1) {
        const motif = interactionMusic?.motif || STAGE_MOTIFS[stageIndex];
        const motifNote = chord[0] + 12 + (interactionMusic?.transpose || 0) + motif[(step / 2 | 0) % motif.length];
        this.pluck(
          midi(motifNote), at, 0.16, 0.007 + this.highFrequencyLevel * 0.017 + (interactionMusic?.intensity || 0) * 0.004, step % 4 === 1 ? -0.48 : 0.48,
          interactionMusic?.wave || soundscape.score.wave, interactionMusic?.brightness || soundscape.score.brightness, this.highs || this.music
        );
      }
      if (this.flowMix > 0.78 && (step === 6 || step === 14)) {
        this.pad(chord.map((note) => note + 12), at, 0.34, 0.018 + this.flowMix * 0.008);
      }
      if ((this.flowMix > 0.62 || this.highFrequencyLevel > 0.7) && [5, 13].includes(step)) {
        this.bell(midi(chord[2] + 24), at, 0.36, 0.01 + this.highFrequencyLevel * 0.016, this.highs || this.music);
      }
      if (interactionMusic?.synergy && (step === 2 || step === 10)) {
        const harmonyNote = chord[1] + 24 + interactionMusic.transpose;
        this.pluck(midi(harmonyNote), at, 0.38, 0.014 + interactionMusic.intensity * 0.01, step === 2 ? -0.32 : 0.32, "sine", interactionMusic.brightness, this.highs || this.music);
      }
      this.scheduleSemanticStep(chord, step, at, semanticStrength, soundscape);
      this.scheduleSoundscapeStep(soundscape, chord, step, at, intensity);
      this.scheduleDangerStep(step, at);
    }

    scheduleSemanticStep(chord, step, at, strength, soundscape) {
      if (strength < 0.08) return;
      const root = chord[0];
      const volume = 0.006 + strength * 0.012;
      if (this.semanticMode === "step-match") {
        if (step === 2 || step === 10) {
          this.pluck(midi(root + 12), at, 0.18, volume, -0.42, "triangle", 2500, this.rhythm || this.music);
          this.pluck(midi(root + 12), at + 0.055, 0.18, volume, 0.42, "triangle", 2500, this.rhythm || this.music);
        }
      } else if (this.semanticMode === "dual-melody") {
        if (step === 3 || step === 11) {
          const motif = STAGE_MOTIFS[3];
          const noteIndex = step === 3 ? 1 : 2;
          this.pluck(midi(root + 12 + motif[noteIndex]), at, 0.34, volume, -0.52, "sine", soundscape.score.brightness, this.highs || this.music);
          this.pluck(midi(root + 19 + motif[noteIndex]), at + 0.045, 0.34, volume, 0.52, "triangle", soundscape.score.brightness, this.highs || this.music);
        }
      } else if (this.semanticMode === "daily-layer") {
        if (step === 5 || step === 13) {
          this.pluck(midi(root + (step === 5 ? 16 : 19)), at, 0.28, volume, step === 5 ? -0.28 : 0.28, "triangle", 3200, this.ambience);
        }
      } else if (this.semanticMode === "listening-space") {
        if (step === 0 && at >= this.directorStillnessUntil) this.bell(midi(root), at, 0.8, volume * 0.62, this.ambience);
      } else if (this.semanticMode === "theme-convergence") {
        if (step === 2 || step === 10) {
          const convergence = clamp(strength, 0, 1);
          this.pluck(midi(root + 12 + STAGE_MOTIFS[0][step === 2 ? 1 : 2]), at, 0.38, volume, -0.62 + convergence * 0.34, "triangle", 3400, this.highs || this.music);
          this.pluck(midi(root + 12 + STAGE_MOTIFS[6][step === 2 ? 1 : 2]), at + 0.045, 0.38, volume, 0.62 - convergence * 0.34, "sine", 3900, this.highs || this.music);
        }
      }
    }

    scheduleSoundscapeStep(profile, chord, step, at, intensity) {
      const textureVolume = 0.012 + intensity * 0.008;
      if (profile.texture === "rain") {
        if (step === 3 || step === 11) {
          this.noiseHit(at, 0.075, 4300 + step * 95, textureVolume, "highpass", this.ambience, step === 3 ? -0.58 : 0.42);
        }
        if (step === 14 && this.bar % 2 === 0) this.bell(1174.66, at, 0.42, 0.012, this.ambience);
        return;
      }
      if (profile.texture === "pages") {
        if (step === 2 || step === 10) {
          this.noiseHit(at, 0.24, step === 2 ? 1180 : 1780, textureVolume * 1.15, "bandpass", this.ambience, step === 2 ? -0.62 : 0.62);
        }
        if (step === 14) this.pluck(midi(chord[1] + 24), at, 0.32, 0.015, 0.38, "sine", 2800, this.ambience);
        return;
      }
      if (profile.texture === "metro") {
        if ([2, 6, 10, 14].includes(step)) {
          const gateNote = step === 14 ? chord[2] + 24 : chord[0] + 12 + (step % 8 ? 3 : 0);
          this.pluck(midi(gateNote), at, 0.11, textureVolume * 1.2, step < 8 ? -0.5 : 0.5, "square", 4700, this.highs || this.music);
        }
        if (step === 15 && this.bar % 2 === 1) this.noiseHit(at, 0.55, 2100, 0.019, "bandpass", this.ambience, 0.7);
        return;
      }
      if (profile.texture === "market") {
        if ([2, 6, 10, 14].includes(step)) {
          this.noiseHit(at, 0.065, step % 8 === 2 ? 2350 : 3200, textureVolume * 1.35, "bandpass", this.rhythm || this.music, step < 8 ? -0.36 : 0.36);
        }
        if (step === 7 || step === 15) this.pluck(880, at, 0.08, 0.014, step === 7 ? -0.4 : 0.4, "square", 5200, this.highs || this.music);
        return;
      }
      if (profile.texture === "morning") {
        if (step === 1 || step === 9) this.pluck(step === 1 ? 987.77 : 1318.51, at, 0.24, textureVolume, step === 1 ? -0.46 : 0.46, "sine", 4100, this.ambience);
        if (step === 5) this.noiseHit(at, 0.055, 2760, 0.013, "bandpass", this.ambience, -0.12);
        return;
      }
      if (profile.texture === "storm") {
        if ([2, 6, 10, 14].includes(step)) this.noiseHit(at, 0.18, 980 + (step % 8) * 75, textureVolume * 1.8, "bandpass", this.ambience, step < 8 ? -0.7 : 0.7);
        if (step === 0 && this.bar % 4 === 2) {
          this.pluck(58.27, at, 1.4, 0.052, -0.2, "sawtooth", 360, this.ambience);
          this.noiseHit(at + 0.06, 1.1, 260, 0.065, "lowpass", this.ambience, 0.2);
        }
        return;
      }
      if (step === 2 || step === 10) this.bell(step === 2 ? 783.99 : 1046.5, at, 0.62, textureVolume * 1.25, this.ambience);
      if ((step === 6 || step === 14) && this.bar % 2 === 0) {
        const reprise = STAGE_MOTIFS[(this.bar + (step === 14 ? 3 : 0)) % STAGE_MOTIFS.length];
        this.pluck(midi(chord[0] + 12 + reprise[1]), at, 0.38, 0.014, step === 6 ? -0.34 : 0.34, "sine", 3900, this.highs || this.music);
      }
    }

    scheduleDangerStep(step, at) {
      if (this.dangerRank < 2 || this.dangerRank >= 4) return;
      const interval = this.dangerRank === 3 ? 4 : 8;
      if (step % interval !== 0) return;
      const urgency = clamp(1 - this.dangerCondition / 100, 0, 1);
      const frequency = this.dangerRank === 3 && step % 8 === 4 ? 86 : 72;
      this.pluck(frequency, at, 0.16, 0.022 + urgency * 0.022, 0, "sine", 420, this.sfx);
    }

    connectVoice(node, gain, pan, wet = 0, output = this.music) {
      const destination = output || this.music;
      if (this.context.createStereoPanner) {
        const panner = this.context.createStereoPanner();
        panner.pan.value = clamp(pan || 0, -1, 1);
        node.connect(gain);
        gain.connect(panner);
        panner.connect(destination);
        if (wet > 0) panner.connect(this.reverb);
      } else {
        node.connect(gain);
        gain.connect(destination);
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

    pluck(frequency, at, duration, volume, pan = 0, type = "triangle", brightness = 2600, output = this.music) {
      const oscillator = this.context.createOscillator();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      oscillator.type = OSCILLATOR_TYPES.includes(type) ? type : "triangle";
      oscillator.frequency.value = frequency;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(clamp(brightness, 600, 7200), at);
      filter.frequency.exponentialRampToValueAtTime(620, at + duration);
      gain.gain.setValueAtTime(volume, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(filter);
      this.connectVoice(filter, gain, pan, 0.2, output);
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
      gain.connect(this.rhythm || this.music);
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
      const output = this.rhythm || this.music;
      this.noiseHit(at, 0.16, 1850, volume, "bandpass", output);
      this.pluck(174, at, 0.1, volume * 0.22, 0, "triangle", 1600, output);
    }

    hat(at, volume, open) {
      this.noiseHit(at, open ? 0.12 : 0.045, 7600, volume, "highpass", this.highs || this.music, (this.step % 4 < 2 ? -0.25 : 0.25));
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

    powerup(type, phase = "start") {
      const typeAliases = { boost: "overdrive", turbo: "overdrive", double: "multiplier", "2x": "multiplier" };
      const powerupType = typeAliases[String(type || "").toLowerCase()] || String(type || "").toLowerCase();
      const profile = POWERUP_PROFILES[powerupType];
      if (!profile || !this.context || !this.sfx) return false;
      const phaseAliases = {
        activate: "start", activated: "start", enable: "start", enabled: "start",
        active: "sustain", loop: "sustain", tick: "sustain",
        stop: "end", expire: "end", expired: "end", disable: "end",
        blocked: "block", hit: "block", absorb: "block", absorbed: "block"
      };
      const powerupPhase = phaseAliases[String(phase || "start").toLowerCase()] || String(phase || "start").toLowerCase();
      if (!["start", "sustain", "end", "block"].includes(powerupPhase)) return false;

      const at = this.context.currentTime;
      const pulseStep = this.powerupSteps[powerupType] || 0;
      if (powerupPhase === "sustain") {
        const minimumGap = powerupType === "overdrive" ? 0.14 : powerupType === "magnet" ? 0.22 : 0.34;
        if (at - (this.powerupLastAt[powerupType] ?? -Infinity) < minimumGap) return false;
        this.powerupLastAt[powerupType] = at;
        this.powerupSteps[powerupType] = pulseStep + 1;
      }

      if (powerupPhase === "start") {
        this.activePowerups.add(powerupType);
        this.powerupSteps[powerupType] = 0;
        this.powerupLastAt[powerupType] = -Infinity;
        this.noiseHit(at, powerupType === "overdrive" ? 0.5 : 0.28, profile.noise, powerupType === "overdrive" ? 0.09 : 0.055, "highpass", this.sfx);
        profile.start.forEach((ratio, index) => {
          const pan = (index - 1) * profile.pan;
          this.tone(profile.root * ratio, 0.2 + index * 0.07, 0.04 + index * 0.008, index * 0.055, profile.wave, pan, profile.root * ratio * (1.08 + index * 0.025));
        });
        if (powerupType === "shield") this.bell(profile.root * 2, at + 0.04, 0.85, 0.045, this.sfx);
        return true;
      }

      if (powerupPhase === "sustain") {
        const ratio = profile.sustain[pulseStep % profile.sustain.length];
        const pan = pulseStep % 2 ? profile.pan : -profile.pan;
        this.tone(profile.root * ratio, powerupType === "overdrive" ? 0.12 : 0.18, powerupType === "overdrive" ? 0.035 : 0.026, 0, profile.wave, pan, profile.root * ratio * (powerupType === "magnet" ? 1.16 : 1.03));
        if (powerupType === "magnet") this.noiseHit(at, 0.16, profile.noise + (pulseStep % 3) * 420, 0.026, "bandpass", this.sfx, pan);
        if (powerupType === "shield") this.bell(profile.root * (pulseStep % 2 ? 2 : 1.5), at, 0.34, 0.018, this.sfx);
        if (powerupType === "multiplier") this.tone(profile.root * ratio * 1.25, 0.13, 0.018, 0.045, "sine", -pan);
        if (powerupType === "overdrive") this.noiseHit(at, 0.1, profile.noise, 0.036, "highpass", this.sfx, pan);
        return true;
      }

      if (powerupPhase === "block") {
        this.duckMusic(powerupType === "shield" ? 0.31 : 0.25, 0.28);
        this.noiseHit(at, powerupType === "shield" ? 0.42 : 0.25, profile.noise * 0.72, powerupType === "shield" ? 0.15 : 0.09, "bandpass", this.sfx);
        this.tone(profile.root * 2, 0.3, 0.07, 0, profile.wave, -profile.pan, profile.root * profile.finish);
        this.tone(profile.root * 2.03, 0.22, 0.045, 0.025, "sine", profile.pan, profile.root * 1.02);
        if (powerupType === "shield") this.bell(profile.root * 3, at, 0.72, 0.06, this.sfx);
        return true;
      }

      this.activePowerups.delete(powerupType);
      this.noiseHit(at, 0.24, profile.noise * 0.55, 0.038, powerupType === "overdrive" ? "lowpass" : "bandpass", this.sfx);
      this.tone(profile.root * profile.start[profile.start.length - 1], 0.36, 0.045, 0, profile.wave, 0, profile.root * profile.finish);
      return true;
    }

    hasSynergy(value) {
      if (Array.isArray(value)) return value.length > 0;
      if (!value || typeof value !== "object") return Boolean(value);
      const active = value.active ?? value.enabled;
      if (Array.isArray(active)) return active.length > 0;
      if (active !== undefined) return Boolean(active);
      return Number(value.value ?? value.level ?? value.strengthBonus ?? value.durationBonusMs ?? 0) > 0;
    }

    interaction(result) {
      const interactionResult = result && typeof result === "object" ? result : { music: result };
      const music = interactionResult.profile?.music ?? interactionResult.item?.profile?.music ?? interactionResult.music;
      if (music == null || !this.context || !this.sfx) return false;
      const profile = this.resolveMusicProfile(music);
      const synergyValue = interactionResult.synergy ?? interactionResult.profile?.synergy ?? interactionResult.bonus?.synergy;
      const synergy = this.hasSynergy(synergyValue)
        || Boolean(music?.synergyAccents?.length)
        || Boolean(interactionResult.tags?.includes?.("synergy"));
      const gameplay = interactionResult.gameplay ?? interactionResult.profile?.gameplay ?? interactionResult.item?.profile?.gameplay;
      const requestedDuration = interactionResult.durationSeconds
        ?? interactionResult.duration
        ?? (Number.isFinite(Number(interactionResult.durationMs)) ? Number(interactionResult.durationMs) / 1000 : undefined)
        ?? (Number.isFinite(Number(gameplay?.durationMs)) ? Number(gameplay.durationMs) / 1000 : undefined);
      const resultDuration = Number(requestedDuration);
      const duration = clamp(resultDuration || profile.duration, 0.5, 12);
      const at = this.context.currentTime;
      this.interactionMusic = { ...profile, synergy, expiresAt: at + duration };

      const chord = CHORDS[this.stageNumber - 1][this.bar % 4];
      const root = profile.root || midi(chord[0] + 12 + profile.transpose);
      profile.motif.slice(0, 3).forEach((interval, index) => {
        const frequency = root * Math.pow(2, interval / 12);
        this.tone(frequency, 0.24 + index * 0.05, 0.022 + profile.intensity * 0.018, index * 0.065, profile.wave, (index - 1) * 0.32, frequency * 1.04);
      });
      this.noiseHit(at, 0.24, profile.brightness, 0.016 + profile.intensity * 0.018, "highpass", this.sfx);
      if (synergy) {
        const harmony = chord.map((note) => note + 12 + profile.transpose);
        this.pad(harmony, at + 0.035, 0.92, 0.038 + profile.intensity * 0.022);
        harmony.forEach((note, index) => this.bell(midi(note + 12), at + index * 0.045, 0.76, 0.019 + profile.intensity * 0.014, this.sfx));
      }
      return true;
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

    tick(delta, speed, active = true, arrival = false, flow = this.flow, speedTier) {
      if (speed && typeof speed === "object") {
        const frame = speed;
        speed = frame.speed ?? this.targetSpeed;
        active = frame.active ?? active;
        arrival = frame.arrival ?? arrival;
        flow = frame.flow ?? flow;
        speedTier = frame.speedTier ?? frame.tier ?? speedTier;
      }
      if (flow && typeof flow === "object") {
        speedTier = flow.speedTier ?? flow.tier ?? speedTier;
        flow = flow.flow ?? flow.value ?? this.flow;
      }
      if (!this.context || !active) return;
      this.setFlow(flow);
      this.setArrival(arrival);
      this.updateDrive(delta, arrival ? this.targetSpeed : speed, speedTier);
      this.stepClock -= Number(delta) || 0;
      const listeningStillness = (this.stageNumber === 6 || this.semanticMode === "listening-space") && this.semanticStrength > 0.08 && this.directorNow() < this.directorStillnessUntil;
      if (!arrival && !listeningStillness && this.stepClock <= 0) {
        this.stepSide *= -1;
        const at = this.context.currentTime;
        this.noiseHit(at, 0.055, 210 + Math.min(150, this.speed * 4.4), 0.03 + this.percussionLevel * 0.012, "bandpass", this.sfx, this.stepSide * 0.22);
        if (this.semanticMode === "step-match" && this.semanticStrength > 0.08) {
          this.noiseHit(at + 0.045, 0.05, 225 + Math.min(130, this.speed * 3.8), 0.018 + this.semanticStrength * 0.009, "bandpass", this.sfx, -this.stepSide * 0.22);
        }
        this.stepClock = Math.max(0.15, 0.34 - this.speed * 0.0062);
      }
    }

    toggle() {
      this.start();
      if (!this.context) return true;
      if (this.context.state === "running") {
        this.manuallyMuted = true;
        this.suspend();
      } else {
        this.manuallyMuted = false;
        this.resume();
      }
      return this.manuallyMuted;
    }

    suspend() {
      if (this.context?.state === "running") return this.context.suspend();
      return undefined;
    }

    reanchorScheduler(delay = 0.04) {
      if (!this.context) return;
      this.nextStepAt = this.context.currentTime + Math.max(0.02, Number(delay) || 0.04);
    }

    resume() {
      if (!this.started || this.manuallyMuted || this.context?.state !== "suspended") return undefined;
      this.reanchorScheduler();
      const resumed = this.context.resume();
      if (resumed?.then) return resumed.then(() => this.reanchorScheduler());
      this.reanchorScheduler();
      return resumed;
    }

    dispose() {
      if (this.schedulerId) globalThis.clearInterval(this.schedulerId);
      this.schedulerId = 0;
      [this.ambientSource, this.ambientDetailSource, this.ambientDrone, this.dangerOscillator].forEach((node) => {
        try { node?.stop?.(); } catch (error) { /* Already-stopped Web Audio nodes need no cleanup. */ }
      });
      this.activePowerups.clear();
      this.processedDirectorCommands.clear();
      this.directorCommandWatermark.attempt = 0;
      this.directorCommandWatermark.ordinal = 0;
      this.directorCommandRecentOrdinals.clear();
      this.interactionMusic = null;
      this.stageIntroActive = false;
      this.failureActive = false;
      this.started = false;
      return this.context?.close?.();
    }
  }

  return Object.freeze({
    PulseRunAudio,
    create: () => new PulseRunAudio(),
    CHORDS,
    TEMPOS,
    ACT_AUDIO_PROFILES,
    SEMANTIC_REWARD_PROFILES,
    POWERUP_PROFILES,
    MUSIC_PROFILES,
    SOUNDSCAPE_PROFILES
  });
});
