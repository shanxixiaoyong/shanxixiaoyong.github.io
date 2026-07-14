(function () {
  "use strict";

  const rules = window.RunnerLoveRules;
  const engineApi = window.RunnerLoveEngine;
  const content = window.RunnerLoveContent;
  if (!rules || !engineApi || !content) return;

  const $ = (selector) => document.querySelector(selector);
  const root = $("#runner-love");
  const canvas = $("#runner-canvas");
  if (!canvas) return;
  const SAVE_KEY = "runner-love-save-v1";
  const VIEW = { width: 720, height: 1280 };
  const STAGE_SCENE_SOURCES = Object.freeze([
    "assets/runner-scenes/01-encounter.jpg",
    "assets/runner-scenes/02-familiar.jpg",
    "assets/runner-scenes/03-ambiguous.jpg",
    "assets/billiards-scenes/confession-night.jpg",
    "assets/love-scenes/warm-home.webp",
    "assets/love-scenes/rain-night.webp",
    "assets/love-scenes/starlight-vow.webp"
  ]);
  const RUNNER_PATTERNS = Object.freeze([
    Object.freeze({ id: "coin-ribbon", minStage: 0, entities: [
      { type: "collectible", lane: 0, z: 0 }, { type: "collectible", lane: 0, z: 6 },
      { type: "collectible", lane: -1, z: 12 }, { type: "collectible", lane: -1, z: 18 },
      { type: "collectible", lane: 0, z: 24 }, { type: "collectible", lane: 1, z: 30 }
    ] }),
    Object.freeze({ id: "barrier-arc", minStage: 0, entities: [
      { type: "collectible", lane: 0, z: 0 }, { type: "collectible", lane: 0, z: 6, height: 0.55 },
      { type: "obstacle", lane: 0, z: 12, avoid: "jump", subtype: "barrier" },
      { type: "collectible", lane: 0, z: 13, height: 1.15, arc: 1 },
      { type: "collectible", lane: 0, z: 19, height: 0.55 }, { type: "collectible", lane: 0, z: 25 }
    ] }),
    Object.freeze({ id: "lane-slalom", minStage: 0, entities: [
      { type: "collectible", lane: -1, z: 0 }, { type: "collectible", lane: 0, z: 6 },
      { type: "collectible", lane: 1, z: 12 },
      { type: "obstacle", lane: 0, z: 18, avoid: "switch", subtype: "service-cart", rewardNearMiss: true },
      { type: "collectible", lane: 1, z: 19 }, { type: "collectible", lane: 0, z: 25 },
      { type: "collectible", lane: -1, z: 31 }
    ] }),
    Object.freeze({ id: "split-lights", minStage: 0, entities: [
      { type: "collectible", lane: 0, z: 0 }, { type: "collectible", lane: 0, z: 6 },
      { type: "obstacle", lane: -1, z: 13, avoid: "switch", subtype: "barrier" },
      { type: "obstacle", lane: 1, z: 13, avoid: "switch", subtype: "barrier" },
      { type: "collectible", lane: 0, z: 14 }, { type: "collectible", lane: 0, z: 20 },
      { type: "obstacle", lane: 0, z: 27, avoid: "slide", subtype: "signal-gate" },
      { type: "collectible", lane: 0, z: 29 }
    ] }),
    Object.freeze({ id: "hurdle-switch", minStage: 0, entities: [
      { type: "collectible", lane: 0, z: 0 }, { type: "collectible", lane: 0, z: 6, height: 0.52 },
      { type: "obstacle", lane: 0, z: 12, avoid: "jump", subtype: "barrier" },
      { type: "collectible", lane: 0, z: 13, height: 1.12, arc: 1 },
      { type: "collectible", lane: 1, z: 20 },
      { type: "obstacle", lane: 1, z: 27, avoid: "jump", subtype: "barrier" },
      { type: "collectible", lane: -1, z: 28 }, { type: "collectible", lane: -1, z: 34 }
    ] }),
    Object.freeze({ id: "signal-duck", minStage: 1, entities: [
      { type: "collectible", lane: 1, z: 0 }, { type: "collectible", lane: 1, z: 6 },
      { type: "obstacle", lane: 1, z: 13, avoid: "slide", subtype: "signal-gate" },
      { type: "collectible", lane: 1, z: 15 }, { type: "collectible", lane: 1, z: 21 },
      { type: "collectible", lane: 0, z: 28 }
    ] }),
    Object.freeze({ id: "platform-weave", minStage: 1, entities: [
      { type: "collectible", lane: -1, z: 0 }, { type: "collectible", lane: 0, z: 6 },
      { type: "obstacle", lane: -1, z: 12, avoid: "switch", subtype: "service-cart", rewardNearMiss: true },
      { type: "collectible", lane: 1, z: 15 }, { type: "collectible", lane: 0, z: 22 },
      { type: "obstacle", lane: 1, z: 29, avoid: "jump", subtype: "barrier" },
      { type: "collectible", lane: 0, z: 31 }
    ] }),
    Object.freeze({ id: "gate-cascade", minStage: 1, entities: [
      { type: "collectible", lane: -1, z: 0 }, { type: "collectible", lane: -1, z: 6 },
      { type: "obstacle", lane: -1, z: 12, avoid: "slide", subtype: "signal-gate" },
      { type: "collectible", lane: 0, z: 16 },
      { type: "obstacle", lane: 0, z: 22, avoid: "slide", subtype: "signal-gate" },
      { type: "collectible", lane: 1, z: 26 },
      { type: "obstacle", lane: 1, z: 32, avoid: "slide", subtype: "signal-gate" },
      { type: "collectible", lane: 0, z: 35 }
    ] }),
    Object.freeze({ id: "train-switchback", minStage: 1, entities: [
      { type: "collectible", lane: -1, z: 0 }, { type: "collectible", lane: -1, z: 6 },
      { type: "obstacle", lane: 1, z: 14, avoid: "switch", subtype: "train", variant: 1, rewardNearMiss: true },
      { type: "collectible", lane: -1, z: 15 }, { type: "collectible", lane: 0, z: 21 },
      { type: "obstacle", lane: -1, z: 29, avoid: "switch", subtype: "train", variant: 2, rewardNearMiss: true },
      { type: "collectible", lane: 1, z: 30 }, { type: "collectible", lane: 1, z: 36 }
    ] }),
    Object.freeze({ id: "double-train", minStage: 2, entities: [
      { type: "collectible", lane: 1, z: 0 }, { type: "collectible", lane: 1, z: 6 },
      { type: "obstacle", lane: -1, z: 15, avoid: "switch", subtype: "train", variant: 0, rewardNearMiss: true },
      { type: "obstacle", lane: 0, z: 15, avoid: "switch", subtype: "train", variant: 1, rewardNearMiss: true },
      { type: "collectible", lane: 1, z: 15 }, { type: "collectible", lane: 1, z: 22 },
      { type: "collectible", lane: 0, z: 31 }
    ] }),
    Object.freeze({ id: "maintenance-dance", minStage: 2, entities: [
      { type: "collectible", lane: 1, z: 0 }, { type: "collectible", lane: 0, z: 6 },
      { type: "obstacle", lane: 1, z: 13, avoid: "switch", subtype: "service-cart", rewardNearMiss: true },
      { type: "collectible", lane: -1, z: 14 },
      { type: "obstacle", lane: -1, z: 22, avoid: "jump", subtype: "barrier" },
      { type: "collectible", lane: 0, z: 24 },
      { type: "obstacle", lane: 0, z: 31, avoid: "slide", subtype: "signal-gate" },
      { type: "collectible", lane: 1, z: 34 }
    ] }),
    Object.freeze({ id: "crossing-rhythm", minStage: 3, entities: [
      { type: "collectible", lane: -1, z: 0 }, { type: "collectible", lane: -1, z: 6 },
      { type: "obstacle", lane: -1, z: 13, avoid: "jump", subtype: "barrier" },
      { type: "collectible", lane: 0, z: 17 }, { type: "collectible", lane: 1, z: 23 },
      { type: "obstacle", lane: 1, z: 30, avoid: "slide", subtype: "signal-gate" },
      { type: "collectible", lane: 1, z: 32 }
    ] }),
    Object.freeze({ id: "maintenance-gap", minStage: 4, entities: [
      { type: "collectible", lane: 0, z: 0 }, { type: "collectible", lane: 1, z: 6 },
      { type: "obstacle", lane: 0, z: 14, avoid: "switch", subtype: "train", variant: 2, rewardNearMiss: true },
      { type: "obstacle", lane: -1, z: 14, avoid: "slide", subtype: "signal-gate" },
      { type: "collectible", lane: 1, z: 15 }, { type: "collectible", lane: 1, z: 22 },
      { type: "obstacle", lane: 1, z: 30, avoid: "jump", subtype: "barrier" },
      { type: "collectible", lane: 1, z: 31, height: 1.05 }
    ] }),
    Object.freeze({ id: "rush-hour", minStage: 5, entities: [
      { type: "collectible", lane: 0, z: 0 }, { type: "collectible", lane: -1, z: 6 },
      { type: "obstacle", lane: 0, z: 13, avoid: "switch", subtype: "train", variant: 3, rewardNearMiss: true },
      { type: "obstacle", lane: 1, z: 13, avoid: "switch", subtype: "train", variant: 4, rewardNearMiss: true },
      { type: "collectible", lane: -1, z: 15 }, { type: "collectible", lane: 0, z: 23 },
      { type: "obstacle", lane: 0, z: 30, avoid: "slide", subtype: "signal-gate" },
      { type: "collectible", lane: 0, z: 32 }
    ] })
  ]);
  const ui = {
    intro: $("[data-intro]"), performance: $("[data-performance]"), handhold: $("[data-handhold]"),
    reveal: $("[data-reveal]"), result: $("[data-result]"), toast: $("[data-toast]"),
    stageKicker: $("[data-stage-kicker]"), stageName: $("[data-stage-name]"), heartbeat: $("[data-heartbeat]"),
    heartFill: $("[data-heart-fill]"), progress: $("[data-progress]"), progressFill: $("[data-progress-fill]"),
    combo: $("[data-combo]"), stageTrack: $("[data-stage-track]"), announcer: $("[data-announcer]"),
    savedRun: $("[data-saved-run]"), performanceKicker: $("[data-performance-kicker]"),
    performanceTitle: $("[data-performance-title]"), performanceCopy: $("[data-performance-copy]"),
    revealTitle: $("[data-reveal-title]"), revealCopy: $("[data-reveal-copy]"), revealStep: $("[data-reveal-step]"), revealNext: $("[data-reveal-next]"), grade: $("[data-grade]"),
    endingTitle: $("[data-ending-title]"), endingCopy: $("[data-ending-copy]"), holdFill: $("[data-hold-fill]"),
    completion: $("[data-stat-completion]"), accuracy: $("[data-stat-accuracy]"), resultHeartbeat: $("[data-stat-heartbeat]"),
    score: $("[data-score]"), distance: $("[data-distance]"),
    newGamePlus: $("[data-new-game-plus]"), newGameClue: $("[data-new-game-clue]"), stampCount: $("[data-stamp-count]"), retry: $("[data-retry]")
  };

  class HeartbeatAudio {
    constructor() {
      this.context = null; this.master = null; this.baseGain = null; this.warmGain = null; this.futureGain = null;
      this.noiseBuffer = null; this.started = false; this.stepClock = 0; this.musicClock = 0; this.stepSide = 1; this.stageNumber = 1;
    }
    start() {
      if (this.started) { if (this.context && this.context.state === "suspended") this.context.resume(); return; }
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      const compressor = this.context.createDynamicsCompressor();
      compressor.threshold.value = -18; compressor.knee.value = 12; compressor.ratio.value = 5; compressor.attack.value = 0.006; compressor.release.value = 0.22;
      this.master = this.context.createGain(); this.master.gain.value = 0.14; this.master.connect(compressor); compressor.connect(this.context.destination);
      this.baseGain = this.context.createGain(); this.warmGain = this.context.createGain(); this.futureGain = this.context.createGain();
      const ambienceFilter = this.context.createBiquadFilter(); ambienceFilter.type = "lowpass"; ambienceFilter.frequency.value = 520; ambienceFilter.Q.value = 0.7;
      [this.baseGain, this.warmGain, this.futureGain].forEach((gain) => gain.connect(ambienceFilter));
      ambienceFilter.connect(this.master);
      this.baseGain.gain.value = 0.12; this.warmGain.gain.value = 0.025; this.futureGain.gain.value = 0;
      [[110, this.baseGain, "sine"], [164.81, this.warmGain, "triangle"], [220, this.futureGain, "sine"]].forEach(([frequency, gain, type]) => {
        const oscillator = this.context.createOscillator(); oscillator.type = type; oscillator.frequency.value = frequency;
        oscillator.connect(gain); oscillator.start();
      });
      this.noiseBuffer = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * 0.28), this.context.sampleRate);
      const noise = this.noiseBuffer.getChannelData(0);
      for (let index = 0; index < noise.length; index += 1) noise[index] = (Math.random() * 2 - 1) * (1 - index / noise.length);
      this.started = true;
    }
    setStage(stageNumber, heartbeat) {
      if (!this.context) return;
      this.stageNumber = stageNumber;
      const at = this.context.currentTime;
      this.warmGain.gain.setTargetAtTime(0.018 + stageNumber * 0.008, at, 0.45);
      this.futureGain.gain.setTargetAtTime(stageNumber >= 5 ? 0.025 + heartbeat / 4000 : 0, at, 0.6);
    }
    noise(duration, frequency, volume, delay = 0, pan = 0) {
      if (!this.context || !this.noiseBuffer || !this.master) return;
      const source = this.context.createBufferSource(); const filter = this.context.createBiquadFilter(); const gain = this.context.createGain();
      const startAt = this.context.currentTime + delay;
      source.buffer = this.noiseBuffer; filter.type = "bandpass"; filter.frequency.value = frequency; filter.Q.value = 0.82;
      gain.gain.setValueAtTime(Math.max(0.001, volume), startAt); gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
      source.connect(filter); filter.connect(gain);
      if (this.context.createStereoPanner) { const panner = this.context.createStereoPanner(); panner.pan.value = pan; gain.connect(panner); panner.connect(this.master); }
      else gain.connect(this.master);
      source.start(startAt); source.stop(startAt + duration + 0.02);
    }
    action(name) {
      if (!this.context) return;
      if (name === "left" || name === "right") this.noise(0.16, 860, 0.045, 0, name === "left" ? -0.42 : 0.42);
      else if (name === "jump") { this.noise(0.22, 1180, 0.055); this.cue("jump"); }
      else if (name === "slide") this.noise(0.28, 420, 0.075);
    }
    tick(delta, speed, active) {
      if (!this.context || !active) return;
      this.stepClock -= delta; this.musicClock -= delta;
      if (this.stepClock <= 0) {
        this.stepSide *= -1;
        this.noise(0.075, 150 + Math.min(100, speed * 4), 0.032, 0, this.stepSide * 0.18);
        this.stepClock = Math.max(0.19, 0.34 - speed * 0.0052);
      }
      if (this.musicClock <= 0) {
        const notes = [261.63, 329.63, 392, 493.88];
        const note = notes[(Math.floor(this.context.currentTime * 2) + this.stageNumber) % notes.length] * (this.stageNumber >= 6 ? 1.5 : 1);
        const oscillator = this.context.createOscillator(); const filter = this.context.createBiquadFilter(); const gain = this.context.createGain();
        const at = this.context.currentTime;
        oscillator.type = "triangle"; oscillator.frequency.setValueAtTime(note, at);
        filter.type = "lowpass"; filter.frequency.setValueAtTime(1800, at); filter.frequency.exponentialRampToValueAtTime(520, at + 0.24);
        gain.gain.setValueAtTime(0.018, at); gain.gain.exponentialRampToValueAtTime(0.001, at + 0.28);
        oscillator.connect(filter); filter.connect(gain); gain.connect(this.master); oscillator.start(at); oscillator.stop(at + 0.3);
        this.musicClock = 0.42;
      }
    }
    cue(name) {
      if (!this.context) return;
      const profiles = {
        collect: [659.25, 0.12, "sine", 0.07], good: [523.25, 0.16, "triangle", 0.065], jump: [392, 0.12, "sine", 0.045],
        perfect: [880, 0.22, "sine", 0.095], dodge: [392, 0.14, "triangle", 0.06],
        miss: [98, 0.28, "sawtooth", 0.085], stage: [523.25, 0.48, "sine", 0.1],
        hold: [392, 0.3, "sine", 0.075], reveal: [1046.5, 0.52, "sine", 0.085]
      };
      const [frequency, duration, type, volume] = profiles[name] || [330, 0.16, "sine", 0.07];
      const playTone = (pitch, delay, level) => {
        const oscillator = this.context.createOscillator(); const gain = this.context.createGain();
        const startAt = this.context.currentTime + delay;
        oscillator.frequency.setValueAtTime(pitch, startAt); oscillator.type = type;
        gain.gain.setValueAtTime(Math.max(0.001, level), startAt);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
        oscillator.connect(gain); gain.connect(this.master); oscillator.start(startAt); oscillator.stop(startAt + duration + 0.02);
      };
      playTone(frequency, 0, volume);
      if (name === "miss") this.noise(0.22, 130, 0.09);
      if (name === "perfect" || name === "stage" || name === "reveal") playTone(frequency * 1.5, 0.055, volume * 0.58);
    }
    toggle() { this.start(); if (!this.context) return false; if (this.context.state === "running") this.context.suspend(); else this.context.resume(); return this.context.state !== "running"; }
    suspend() { if (this.context && this.context.state === "running") this.context.suspend(); }
    resume() { if (this.started && this.context && this.context.state === "suspended") this.context.resume(); }
  }

  const audio = new HeartbeatAudio();
  let runState = rules.createRunState();
  let motion = createMotion();
  let mode = "intro";
  let pausedStage = null;
  let lastFrameAt = performance.now();
  let frameHandle = 0;
  let spawnClock = 0;
  let patternCursor = 0;
  let beatClock = 0;
  let visualTime = 0;
  let toastTimer = 0;
  let pointerStart = null;
  let holdPointerId = null;
  let holdGeneration = 0;
  let holdStartedAt = 0;
  let holdProgress = 0;
  let completionSaved = false;
  let visualRuntime = null;
  let visualFailure = null;
  let revealShots = [];
  let revealShotIndex = 0;

  function ensureVisualRuntime() {
    if (visualRuntime || visualFailure || !window.RunnerLoveVisuals) return visualRuntime;
    try {
      visualRuntime = window.RunnerLoveVisuals.create(canvas);
      root?.setAttribute("data-renderer", "webgl");
      configureCanvas();
    } catch (error) {
      visualFailure = error;
      root?.setAttribute("data-renderer", "static");
      console.error(error);
    }
    return visualRuntime;
  }

  function stageScene(index) {
    return STAGE_SCENE_SOURCES[index] || STAGE_SCENE_SOURCES[0];
  }

  function createMotion() {
    return engineApi.createEngine({
      seed: "heart-run-2026",
      duration: 720,
      finaleSeconds: 20,
      startSpeed: 13.2,
      maxSpeed: 26.5,
      acceleration: 0.034,
      laneChangeDuration: 0.14,
      jumpDuration: 0.72,
      jumpHeight: 2,
      slideDuration: 0.58,
      stages: content.STAGES.map((stage, index) => ({ id: stage.id, from: index === 6 ? 1 : index / 7, modules: content.ROAD_MODULES.map((item) => item.id) })) });
  }
  function safeLoad() {
    try { const raw = localStorage.getItem(SAVE_KEY); return raw ? rules.loadSave(JSON.parse(raw)) : null; } catch (_) { return null; }
  }
  function persist() {
    if (runState.status === "completed" && completionSaved) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(rules.createSave(runState, safeLoad())));
      if (runState.status === "completed") completionSaved = true;
    } catch (_) {}
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function currentStageIndex() { return Math.min(runState.stageIndex, 6); }
  function visualStageIndex() { return pausedStage === null ? currentStageIndex() : pausedStage; }
  function currentStage() { return content.STAGES[currentStageIndex()]; }
  function syncMotionStage(emitChange) {
    const index = currentStageIndex(); const stage = motion.state.config.stages[index];
    const playable = motion.state.config.duration - motion.state.config.finaleSeconds;
    const boundary = stage.from <= 1 ? stage.from * playable : stage.from;
    if (motion.state.elapsed < boundary) motion.state.elapsed = boundary;
    if (emitChange) motion.syncStage(index); else motion.seekStage(index);
  }
  function show(node, visible) { if (node) node.hidden = !visible; }
  function announce(text) { if (ui.announcer) ui.announcer.textContent = text; }
  function toast(text, duration) {
    if (!ui.toast) return; ui.toast.textContent = text; ui.toast.hidden = false; clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { ui.toast.hidden = true; }, duration || 1100);
  }
  function updateHud() {
    const index = currentStageIndex(); const stage = content.STAGES[index]; const definition = rules.STAGES[index];
    root?.setAttribute("data-stage", String(index + 1));
    if (ui.stageKicker) ui.stageKicker.textContent = `第${"一二三四五六七"[index]}程 · ${stage.name}`;
    if (ui.stageName) ui.stageName.textContent = definition.name;
    if (ui.heartbeat) ui.heartbeat.textContent = runState.heartbeat;
    if (ui.heartFill) ui.heartFill.style.transform = `scaleX(${runState.heartbeat / 100})`;
    const current = runState.status === "playing" ? runState.stage.progress : definition.target;
    if (ui.progress) ui.progress.textContent = `${current} / ${definition.target}`;
    if (ui.progressFill) ui.progressFill.style.transform = `scaleX(${current / definition.target})`;
    if (ui.combo) ui.combo.textContent = `×${Math.max(1, runState.combo)}`;
    if (ui.stampCount) ui.stampCount.textContent = `${runState.heartStamps.length} / 7`;
    if (ui.stageTrack) Array.from(ui.stageTrack.children).forEach((item, itemIndex) => {
      item.classList.toggle("is-done", itemIndex < runState.stageIndex); item.classList.toggle("is-current", itemIndex === index);
    });
    const save = safeLoad(); const unlocked = Boolean(save && save.profile.newGamePlusUnlocked);
    show(ui.newGamePlus, unlocked); show(ui.newGameClue, unlocked); audio.setStage(index + 1, runState.heartbeat);
  }
  function reset(newGamePlus) {
    runState = rules.createRunState({ newGamePlus: Boolean(newGamePlus) }); motion = createMotion(); mode = "intro"; pausedStage = null;
    spawnClock = 0; patternCursor = 0; beatClock = 0; holdProgress = 0; completionSaved = false; [ui.performance, ui.handhold, ui.reveal, ui.result].forEach((node) => show(node, false));
    show(ui.intro, true); updateHud(); return snapshot();
  }
  function start(saved) {
    audio.start(); if (saved && saved.run && saved.run.status === "playing") runState = saved.run;
    syncMotionStage(false);
    mode = "playing"; show(ui.intro, false); updateHud(); announce(`${currentStage().name}，开始`);
  }
  function input(action) { if (mode === "playing") { motion.input(action); audio.start(); audio.action(action); return true; } return false; }
  function spawnPattern() {
    if (mode !== "playing") return false;
    const activeAhead = motion.state.entities.filter((entity) => entity.active && entity.z > 8);
    if (activeAhead.length > 28) return false;
    const farthest = activeAhead.reduce((maximum, entity) => Math.max(maximum, entity.z), 0);
    if (farthest > 58) return false;
    const stageIndex = currentStageIndex();
    const candidates = RUNNER_PATTERNS.filter((pattern) => pattern.minStage <= stageIndex);
    const pattern = candidates[(patternCursor + stageIndex * 2) % candidates.length];
    const baseZ = Math.max(34, farthest + 12);
    pattern.entities.forEach((spec, row) => {
      if (motion.state.finale && spec.type === "obstacle") return;
      motion.spawn({
        ...spec,
        z: baseZ + spec.z,
        row,
        patternId: pattern.id,
        points: spec.type === "collectible" ? 1 : spec.points,
        data: spec.type === "collectible" ? content.COLLECTIBLES[stageIndex].id : spec.data
      });
    });
    if (stageIndex >= 1 && patternCursor % 3 === 1) {
      const cue = patternCursor % 2 ? "jump" : "slide";
      const cueLane = pattern.entities.find((item) => item.type === "collectible")?.lane ?? 0;
      motion.spawn({ type: "companion-cue", lane: cueLane, z: baseZ - 7, cue, patternId: pattern.id });
    }
    patternCursor += 1;
    return true;
  }
  function applyOutcome(outcome) {
    if (runState.status !== "playing") return;
    const before = runState.stageIndex;
    runState = rules.recordBeat(runState, outcome); audio.cue(outcome === "miss" ? "miss" : outcome); updateHud(); persist();
    if (outcome === "miss") toast("失去节拍  -12", 850); else if (outcome === "perfect") toast("PERFECT  +5", 650);
    if (runState.status === "failed") return showFailure();
    if (runState.stageIndex !== before) { syncMotionStage(true); onStageComplete(before); }
  }
  function handleMotionEvents(events) {
    events.forEach((event) => {
      if (event.type === "collect" && event.entity.type === "collectible") {
        const timing = Math.abs((beatClock % 0.72) - 0.36); const outcome = timing < 0.16 ? "perfect" : "good";
        visualRuntime?.effect(outcome, event.entity); applyOutcome(outcome);
      } else if (event.type === "collision") { visualRuntime?.effect("miss", event.entity); applyOutcome("miss"); }
      else if (event.type === "dodge") { visualRuntime?.effect("dodge", event.entity); toast(event.action === "slide" ? "低身穿越" : "飞跃障碍", 620); audio.cue("dodge"); }
      else if (event.type === "near-miss") { visualRuntime?.effect("near-miss", event.entity); toast("惊险擦身  +2", 620); audio.cue("perfect"); }
      else if (event.type === "protected") { visualRuntime?.effect("protected", event.entity); }
      else if (event.type === "companion-cue") { toast("同行提示", 750); announce("同行提示"); }
      else if (event.type === "companion-sync") { visualRuntime?.effect("companion-sync", event); toast("同行默契", 750); audio.cue("collect"); }
      else if (event.type === "companion-missed" || event.type === "response-missed") { toast("错过同行节拍", 850); audio.cue("miss"); announce("同行提示已错过"); }
    });
  }
  function onStageComplete(index) {
    pausedStage = index; audio.cue("stage"); visualRuntime?.effect("stage");
    if (runState.status === "completed") { mode = "handhold"; show(ui.handhold, true); announce("长按牵手"); return; }
    mode = "performance"; const ending = content.STAGE_ENDINGS[index];
    if (ui.performanceKicker) ui.performanceKicker.textContent = `第${"一二三四五六七"[index]}程完成`;
    if (ui.performanceTitle) ui.performanceTitle.textContent = ending.title;
    if (ui.performanceCopy) ui.performanceCopy.textContent = ending.line;
    if (ui.performance) {
      ui.performance.style.backgroundImage = `linear-gradient(180deg,rgba(7,10,12,.04),rgba(7,10,12,.3) 46%,rgba(7,10,12,.96) 100%),url("${stageScene(index)}")`;
      ui.performance.setAttribute("data-stage-scene", String(index + 1));
    }
    show(ui.performance, true); announce(ending.title);
  }
  function continueStage() { if (mode !== "performance") return; show(ui.performance, false); mode = "playing"; pausedStage = null; motion.state.entities.length = 0; spawnClock = 0; patternCursor += 1; updateHud(); }
  function retryStage() {
    if (mode !== "result" || runState.status !== "failed") return;
    runState = rules.retryFromCheckpoint(runState); motion = createMotion(); syncMotionStage(false); mode = "playing"; pausedStage = null;
    show(ui.result, false); spawnClock = 0; beatClock = 0; updateHud(); persist(); announce(`${currentStage().name}，从检查点重试`);
  }
  function showFailure() {
    mode = "result"; const rating = rules.calculateRating(runState, false); const ending = content.STAGE_ENDINGS[currentStageIndex()];
    if (ui.grade) ui.grade.textContent = "B"; if (ui.endingTitle) ui.endingTitle.textContent = runState.ending;
    if (ui.endingCopy) ui.endingCopy.textContent = ending.line; fillStats(rating); show(ui.retry, true); show(ui.result, true); persist();
  }
  function beginHold(event) {
    if (mode !== "handhold" || holdPointerId !== null) return;
    audio.start(); holdPointerId = event && event.pointerId !== undefined ? event.pointerId : 0; holdGeneration += 1;
    if (event && event.currentTarget && event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(holdPointerId);
    holdStartedAt = performance.now();
  }
  function endHold(event) {
    if (holdPointerId === null || (event && event.pointerId !== undefined && event.pointerId !== holdPointerId)) return;
    holdGeneration += 1; holdPointerId = null; holdStartedAt = 0;
    if (holdProgress < 1) holdProgress = Math.max(0, holdProgress - 0.18);
  }
  function updateHold(now) {
    if (!holdStartedAt || mode !== "handhold") return;
    holdProgress = Math.min(1, (now - holdStartedAt) / 1500); if (ui.holdFill) ui.holdFill.style.height = `${holdProgress * 100}%`;
    if (holdProgress >= 1 && holdPointerId !== null) revealBox(holdGeneration);
  }
  function revealBox(generation) {
    if (generation !== undefined && generation !== holdGeneration) return;
    holdStartedAt = 0; holdPointerId = null; holdProgress = 1; audio.cue("hold"); show(ui.handhold, false); mode = "reveal";
    const save = safeLoad(); const hasSevenStamps = runState.heartStamps.length === rules.RULES.stageCount;
    const eligible = hasSevenStamps && (runState.revealEligible || (save && save.profile.revealUnlocked));
    revealShots = eligible
      ? content.BOX_REVEAL.shots.map((shot) => typeof shot === "string" ? { title: content.BOX_REVEAL.title, line: shot } : shot)
      : [{ title: "心章在盒盖上亮起", line: "这段路已经抵达，盒子里的答案留给下一次更完整的奔跑。" }];
    revealShotIndex = 0;
    showRevealShot();
    show(ui.reveal, true); audio.cue("reveal"); persist();
  }
  function showRevealShot() {
    const shot = revealShots[revealShotIndex] || { title: content.BOX_REVEAL.title, line: content.BOX_REVEAL.line };
    if (ui.revealTitle) ui.revealTitle.textContent = shot.title;
    if (ui.revealCopy) ui.revealCopy.textContent = shot.line;
    if (ui.revealStep) ui.revealStep.textContent = `${String(revealShotIndex + 1).padStart(2, "0")} / ${String(revealShots.length).padStart(2, "0")}`;
    if (ui.revealNext) ui.revealNext.textContent = revealShotIndex < revealShots.length - 1 ? "继续" : "走向清晨";
    ui.reveal?.setAttribute("data-shot", String(revealShotIndex + 1));
  }
  function nextRevealShot() {
    if (mode !== "reveal") return;
    if (revealShotIndex >= revealShots.length - 1) { showResult(); return; }
    revealShotIndex += 1;
    showRevealShot();
    audio.cue("collect");
  }
  function fillStats(rating) {
    if (ui.completion) ui.completion.textContent = `${rating.completion}%`; if (ui.accuracy) ui.accuracy.textContent = `${rating.accuracy}%`;
    if (ui.resultHeartbeat) ui.resultHeartbeat.textContent = rating.heartbeat;
  }
  function showResult() {
    if (mode !== "reveal") return; mode = "result"; show(ui.reveal, false); const rating = rules.calculateRating(runState, true);
    const ending = content.getEnding(runState.grade); if (ui.grade) ui.grade.textContent = runState.grade;
    if (ui.endingTitle) ui.endingTitle.textContent = ending.title; if (ui.endingCopy) ui.endingCopy.textContent = `${ending.line} ${ending.coda}`;
    fillStats(rating); show(ui.retry, false); show(ui.result, true); persist(); announce(`${runState.grade}级，${ending.title}`);
  }
  function advanceRulesTime(seconds) {
    if (mode !== "playing" || runState.status !== "playing") return;
    const wasCompensation = runState.stage.compensation; runState = rules.advanceTime(runState, seconds);
    if (!wasCompensation && runState.stage.compensation) toast(`补偿路段 · ${rules.RULES.compensationSeconds}秒`, 1500);
    if (runState.status === "failed") showFailure();
  }
  function update(seconds, now) {
    visualTime += seconds; beatClock += seconds; updateHold(now);
    if (mode !== "playing") return;
    audio.tick(seconds, motion.state.speed, true);
    spawnClock -= seconds;
    if (!motion.state.finale && currentStageIndex() < 6 && spawnClock <= 0) {
      spawnPattern();
      spawnClock = 0.36;
    }
    motion.step(seconds); handleMotionEvents(motion.drainEvents()); syncMotionStage(false); advanceRulesTime(seconds);
    if (ui.score) ui.score.textContent = String(Math.round(motion.state.score + motion.state.distance));
    if (ui.distance) ui.distance.textContent = String(Math.floor(motion.state.distance)) + "m";
  }

  function render() {
    root?.setAttribute("data-state", mode);
    root?.style?.setProperty?.("--speed-aura-opacity", String(Math.min(0.52, 0.2 + Math.max(0, motion.state.speed - 13) * 0.022)));
    const visual = ensureVisualRuntime();
    if (!visual) return;
    visual.render({
      time: visualTime,
      stageIndex: visualStageIndex(),
      mode,
      motion: motion.state,
      runState
    });
  }
  function frame(now) {
    const delta = Math.min(.05, Math.max(0, (now - lastFrameAt) / 1000)); lastFrameAt = now; update(delta, now); render(); frameHandle = requestAnimationFrame(frame);
  }
  function configureCanvas() {
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { width: VIEW.width, height: VIEW.height };
    const width = Math.max(1, rect.width || VIEW.width);
    const height = Math.max(1, rect.height || VIEW.height);
    if (visualRuntime) visualRuntime.resize(width, height, Number(window.devicePixelRatio) || 1);
    else {
      canvas.width = VIEW.width;
      canvas.height = VIEW.height;
    }
  }
  function gestureThreshold() {
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { width: VIEW.width, height: VIEW.height };
    return Math.max(14, Math.min(32, Math.min(rect.width || VIEW.width, rect.height || VIEW.height) * .045));
  }
  function mapKey(key) { return ({ ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowUp: "jump", w: "jump", W: "jump", " ": "jump", ArrowDown: "slide", s: "slide", S: "slide" })[key]; }

  document.addEventListener("keydown", (event) => { const action = mapKey(event.key); if (action) { event.preventDefault(); input(action); } });
  canvas.addEventListener("pointerdown", (event) => {
    if (pointerStart !== null) return;
    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY, at: performance.now() };
    if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId); audio.start();
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!pointerStart || event.pointerId !== pointerStart.id) return; const dx = event.clientX - pointerStart.x; const dy = event.clientY - pointerStart.y; const distance = Math.hypot(dx, dy);
    input(distance < gestureThreshold() ? "jump" : Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "jump" : "slide")); pointerStart = null;
  });
  canvas.addEventListener("pointercancel", (event) => { if (pointerStart && event.pointerId === pointerStart.id) pointerStart = null; });
  const bind = (selector, event, handler) => { const node = $(selector); if (node) node.addEventListener(event, handler); };
  bind("[data-start]", "click", () => start()); bind("[data-continue]", "click", () => start(safeLoad())); bind("[data-new-run]", "click", () => { reset(); start(); });
  bind("[data-performance-next]", "click", continueStage); bind("[data-reveal-next]", "click", nextRevealShot); bind("[data-restart]", "click", () => { const save = safeLoad(); reset(save && save.profile.newGamePlusUnlocked); start(); });
  bind("[data-retry]", "click", retryStage); bind("[data-new-game-plus]", "click", () => { const save = safeLoad(); if (!save || !rules.canStartNewGamePlus(save)) return; reset(true); start(); });
  bind("[data-sound]", "click", (event) => { const muted = audio.toggle(); event.currentTarget.textContent = muted ? "♩" : "♪"; event.currentTarget.setAttribute("aria-label", muted ? "开启声音" : "关闭声音"); });
  bind("[data-hold]", "pointerdown", beginHold); bind("[data-hold]", "pointerup", endHold); bind("[data-hold]", "pointercancel", endHold); bind("[data-hold]", "pointerleave", endHold);
  window.addEventListener("runner-love-visuals-ready", () => { ensureVisualRuntime(); configureCanvas(); render(); });
  function pauseRuntime() { cancelAnimationFrame(frameHandle); frameHandle = 0; audio.suspend(); holdGeneration += 1; holdPointerId = null; holdStartedAt = 0; pointerStart = null; }
  function resumeRuntime() { if (document.hidden || frameHandle) return; lastFrameAt = performance.now(); audio.resume(); frameHandle = requestAnimationFrame(frame); }
  document.addEventListener("visibilitychange", () => { if (document.hidden) pauseRuntime(); else resumeRuntime(); });
  window.addEventListener("pagehide", () => { persist(); pauseRuntime(); });
  window.addEventListener("pageshow", () => { resumeRuntime(); });
  window.addEventListener("resize", () => { configureCanvas(); render(); });

  function debugStep(milliseconds) { const seconds = Math.max(0, Number(milliseconds) || 0) / 1000; for (let left = seconds; left > 1e-9; left -= .05) update(Math.min(.05, left), performance.now() + (seconds - left) * 1000); render(); return snapshot(); }
  function debugTime(milliseconds) { advanceRulesTime(Math.max(0, Number(milliseconds) || 0) / 1000); updateHud(); persist(); return snapshot(); }
  function completeStage(outcome) { const index = runState.stageIndex; while (runState.status === "playing" && runState.stageIndex === index) applyOutcome(outcome || "perfect"); return snapshot(); }
  function debugHold(milliseconds) { if (mode !== "handhold") return false; holdPointerId = 0; holdGeneration += 1; holdStartedAt = performance.now() - Math.max(0, milliseconds || 1500); updateHold(performance.now()); return mode === "reveal"; }
  function snapshot() { return { mode, pausedStage, runState: clone(runState), motion: { stageIndex: motion.state.stageIndex, stage: motion.state.stage, finale: motion.state.finale, lane: motion.state.lane, lanePosition: motion.state.lanePosition, action: motion.state.action, distance: motion.state.distance, speed: motion.state.speed, stumbleTime: motion.state.stumbleTime, dodges: motion.state.dodges, nearMisses: motion.state.nearMisses, entities: clone(motion.state.entities), companion: clone(motion.state.companion) }, visual: visualRuntime?.snapshot?.() || { ready: false, webgl: false, error: visualFailure ? String(visualFailure.message || visualFailure) : null }, holdProgress, saved: safeLoad() }; }
  window.__runnerLoveDebug = Object.freeze({ snapshot, reset, start: () => start(), step: debugStep, time: debugTime, input, spawn: (spec) => motion.spawn(spec), beat: applyOutcome, completeStage, continueStage, retry: retryStage, hold: debugHold, reveal: revealBox, result: showResult, save: persist });

  const saved = safeLoad(); if (saved && saved.run.status === "playing") show(ui.savedRun, true); configureCanvas(); updateHud(); render(); frameHandle = requestAnimationFrame(frame);
})();
