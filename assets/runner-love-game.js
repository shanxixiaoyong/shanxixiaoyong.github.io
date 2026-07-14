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

  const SAVE_KEY = "runner-love-tonight-v5";
  const VIEW = Object.freeze({ width: 720, height: 1280 });

  const PATTERN_BLUEPRINTS = Object.freeze([
    Object.freeze({ id: "street-vault", choiceZ: 31, obstacles: [
      { lane: 0, z: 10, avoid: "jump", form: "barrier" },
      { lane: -1, z: 21, avoid: "switch", form: "service-cart", rewardNearMiss: true },
      { lane: 1, z: 43, avoid: "slide", form: "signal-gate" }
    ] }),
    Object.freeze({ id: "closing-route", choiceZ: 35, obstacles: [
      { lane: -1, z: 11, avoid: "slide", form: "signal-gate" },
      { lane: 1, z: 11, avoid: "slide", form: "signal-gate" },
      { lane: 0, z: 24, avoid: "jump", form: "barrier" },
      { lane: -1, z: 48, avoid: "switch", form: "service-cart", rewardNearMiss: true }
    ] }),
    Object.freeze({ id: "city-slalom", choiceZ: 39, obstacles: [
      { lane: 1, z: 9, avoid: "switch", form: "service-cart", rewardNearMiss: true },
      { lane: 0, z: 20, avoid: "slide", form: "signal-gate" },
      { lane: -1, z: 29, avoid: "jump", form: "barrier" },
      { lane: 1, z: 51, avoid: "switch", form: "service-cart" }
    ] }),
    Object.freeze({ id: "station-rush", choiceZ: 33, obstacles: [
      { lane: -1, z: 12, avoid: "switch", form: "train", rewardNearMiss: true },
      { lane: 0, z: 12, avoid: "switch", form: "train", rewardNearMiss: true },
      { lane: 1, z: 24, avoid: "jump", form: "barrier" },
      { lane: 0, z: 47, avoid: "slide", form: "signal-gate" }
    ] }),
    Object.freeze({ id: "market-weave", choiceZ: 37, obstacles: [
      { lane: 0, z: 10, avoid: "switch", form: "service-cart", rewardNearMiss: true },
      { lane: 1, z: 22, avoid: "jump", form: "barrier" },
      { lane: -1, z: 29, avoid: "slide", form: "signal-gate" },
      { lane: 0, z: 50, avoid: "jump", form: "barrier" }
    ] }),
    Object.freeze({ id: "underpass-hop", choiceZ: 41, obstacles: [
      { lane: -1, z: 9, avoid: "jump", form: "barrier" },
      { lane: 0, z: 20, avoid: "switch", form: "service-cart", rewardNearMiss: true },
      { lane: 1, z: 31, avoid: "slide", form: "signal-gate" },
      { lane: -1, z: 52, avoid: "switch", form: "service-cart" }
    ] }),
    Object.freeze({ id: "delivery-crossing", choiceZ: 34, obstacles: [
      { lane: 1, z: 10, avoid: "jump", form: "barrier" },
      { lane: -1, z: 18, avoid: "switch", form: "service-cart", rewardNearMiss: true },
      { lane: 0, z: 28, avoid: "slide", form: "signal-gate" },
      { lane: 1, z: 46, avoid: "switch", form: "service-cart" }
    ] }),
    Object.freeze({ id: "festival-gates", choiceZ: 38, obstacles: [
      { lane: -1, z: 11, avoid: "slide", form: "signal-gate" },
      { lane: 0, z: 22, avoid: "jump", form: "barrier" },
      { lane: 1, z: 33, avoid: "switch", form: "service-cart", rewardNearMiss: true },
      { lane: 0, z: 51, avoid: "slide", form: "signal-gate" }
    ] }),
    Object.freeze({ id: "river-curve", choiceZ: 36, obstacles: [
      { lane: 0, z: 9, avoid: "jump", form: "barrier" },
      { lane: 1, z: 18, avoid: "switch", form: "service-cart" },
      { lane: -1, z: 30, avoid: "switch", form: "service-cart", rewardNearMiss: true },
      { lane: 1, z: 49, avoid: "slide", form: "signal-gate" }
    ] }),
    Object.freeze({ id: "late-platform", choiceZ: 43, obstacles: [
      { lane: 1, z: 12, avoid: "switch", form: "train", rewardNearMiss: true },
      { lane: -1, z: 23, avoid: "jump", form: "barrier" },
      { lane: 0, z: 34, avoid: "slide", form: "signal-gate" },
      { lane: -1, z: 54, avoid: "switch", form: "train", rewardNearMiss: true }
    ] })
  ]);

  const STAGE_OBSTACLE_FORMS = Object.freeze([
    Object.freeze({ barrier: "barrier", cart: "service-cart", gate: "signal-gate", train: "service-cart" }),
    Object.freeze({ barrier: "barrier", cart: "service-cart", gate: "signal-gate", train: "service-cart" }),
    Object.freeze({ barrier: "barrier", cart: "service-cart", gate: "signal-gate", train: "train" }),
    Object.freeze({ barrier: "barrier", cart: "service-cart", gate: "signal-gate", train: "service-cart" }),
    Object.freeze({ barrier: "barrier", cart: "service-cart", gate: "signal-gate", train: "service-cart" }),
    Object.freeze({ barrier: "barrier", cart: "service-cart", gate: "signal-gate", train: "train" }),
    Object.freeze({ barrier: "barrier", cart: "service-cart", gate: "signal-gate", train: "train" })
  ]);

  const ui = {
    intro: $("[data-intro]"), result: $("[data-result]"), arrival: $("[data-arrival]"), toast: $("[data-toast]"),
    stageKicker: $("[data-stage-kicker]"), stageName: $("[data-stage-name]"), condition: $("[data-condition]"),
    conditionFill: $("[data-condition-fill]"), progress: $("[data-progress]"), progressFill: $("[data-progress-fill]"),
    combo: $("[data-combo]"), stageTrack: $("[data-stage-track]"), announcer: $("[data-announcer]"),
    savedRun: $("[data-saved-run]"), cargo: $("[data-cargo]"), destination: $("[data-destination]"),
    routeMessage: $("[data-route-message]"), routeCopy: $("[data-route-copy]"), routeTime: $("[data-route-time]"),
    arrivalKicker: $("[data-arrival-kicker]"), arrivalTitle: $("[data-arrival-title]"), arrivalCopy: $("[data-arrival-copy]"),
    grade: $("[data-grade]"), endingTitle: $("[data-ending-title]"), endingCopy: $("[data-ending-copy]"),
    completion: $("[data-stat-completion]"), accuracy: $("[data-stat-accuracy]"), resultItems: $("[data-stat-items]"),
    resultCollisions: $("[data-stat-collisions]"), score: $("[data-score]"), distance: $("[data-distance]"),
    newGamePlus: $("[data-new-game-plus]"), retry: $("[data-retry]")
  };

  class CityRunAudio {
    constructor() {
      this.context = null;
      this.master = null;
      this.ambience = null;
      this.melody = null;
      this.noiseBuffer = null;
      this.started = false;
      this.stepClock = 0;
      this.musicClock = 0;
      this.stepSide = 1;
      this.stageNumber = 1;
    }

    start() {
      if (this.started) {
        if (this.context?.state === "suspended") this.context.resume();
        return;
      }
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      const compressor = this.context.createDynamicsCompressor();
      compressor.threshold.value = -17;
      compressor.knee.value = 16;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.008;
      compressor.release.value = 0.24;
      this.master = this.context.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(compressor);
      compressor.connect(this.context.destination);
      this.ambience = this.context.createGain();
      this.melody = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 760;
      this.ambience.connect(filter);
      this.melody.connect(filter);
      filter.connect(this.master);
      this.ambience.gain.value = 0.055;
      this.melody.gain.value = 0.028;
      [[82.41, this.ambience, "sine"], [164.81, this.melody, "triangle"]].forEach(([frequency, gain, type]) => {
        const oscillator = this.context.createOscillator();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        oscillator.start();
      });
      this.noiseBuffer = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * 0.34), this.context.sampleRate);
      const noise = this.noiseBuffer.getChannelData(0);
      for (let index = 0; index < noise.length; index += 1) noise[index] = (Math.random() * 2 - 1) * (1 - index / noise.length);
      this.started = true;
    }

    setStage(stageNumber, condition) {
      if (!this.context) return;
      this.stageNumber = stageNumber;
      const at = this.context.currentTime;
      this.melody.gain.setTargetAtTime(0.018 + stageNumber * 0.005 + condition / 10000, at, 0.5);
    }

    noise(duration, frequency, volume, delay = 0, pan = 0) {
      if (!this.context || !this.noiseBuffer || !this.master) return;
      const source = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      const startAt = this.context.currentTime + delay;
      source.buffer = this.noiseBuffer;
      filter.type = "bandpass";
      filter.frequency.value = frequency;
      filter.Q.value = 0.9;
      gain.gain.setValueAtTime(Math.max(0.001, volume), startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
      source.connect(filter);
      filter.connect(gain);
      if (this.context.createStereoPanner) {
        const panner = this.context.createStereoPanner();
        panner.pan.value = pan;
        gain.connect(panner);
        panner.connect(this.master);
      } else gain.connect(this.master);
      source.start(startAt);
      source.stop(startAt + duration + 0.02);
    }

    tone(frequency, duration, volume, delay = 0, type = "sine") {
      if (!this.context || !this.master) return;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const at = this.context.currentTime + delay;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(Math.max(0.001, volume), at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
      oscillator.connect(gain);
      gain.connect(this.master);
      oscillator.start(at);
      oscillator.stop(at + duration + 0.02);
    }

    action(name) {
      if (!this.context) return;
      if (name === "left" || name === "right") this.noise(0.14, 910, 0.04, 0, name === "left" ? -0.45 : 0.45);
      else if (name === "jump") { this.noise(0.2, 1280, 0.055); this.tone(392, 0.12, 0.035); }
      else if (name === "slide") this.noise(0.3, 390, 0.068);
    }

    cue(name, kind) {
      if (!this.context) return;
      if (name === "miss") {
        this.tone(104, 0.28, 0.085, 0, "sawtooth");
        this.noise(0.24, 150, 0.075);
        return;
      }
      if (name === "arrival") {
        [392, 493.88, 659.25, 783.99].forEach((note, index) => this.tone(note, 0.5, 0.065 - index * 0.006, index * 0.08, "sine"));
        return;
      }
      const kindNotes = { book: 523.25, record: 440, drink: 659.25, coffee: 659.25, ticket: 587.33, umbrella: 493.88, flower: 698.46, camera: 783.99, key: 880, plant: 554.37, map: 622.25 };
      const frequency = kindNotes[kind] || (name === "perfect" ? 880 : 659.25);
      this.tone(frequency, name === "perfect" ? 0.28 : 0.18, name === "perfect" ? 0.09 : 0.065, 0, "sine");
      if (name === "perfect") this.tone(frequency * 1.5, 0.24, 0.045, 0.055, "triangle");
    }

    tick(delta, speed, active, arrival) {
      if (!this.context || !active) return;
      this.stepClock -= delta;
      this.musicClock -= delta;
      if (!arrival && this.stepClock <= 0) {
        this.stepSide *= -1;
        this.noise(0.07, 165 + Math.min(100, speed * 4), 0.03, 0, this.stepSide * 0.16);
        this.stepClock = Math.max(0.18, 0.34 - speed * 0.005);
      }
      if (this.musicClock <= 0) {
        const progressions = [[261.63, 329.63, 392], [293.66, 369.99, 440], [329.63, 415.3, 493.88]];
        const chord = progressions[(this.stageNumber - 1) % progressions.length];
        const note = chord[Math.floor(this.context.currentTime * 1.7) % chord.length];
        this.tone(note, arrival ? 0.52 : 0.24, arrival ? 0.035 : 0.015, 0, "triangle");
        this.musicClock = arrival ? 0.34 : 0.48;
      }
    }

    toggle() {
      this.start();
      if (!this.context) return false;
      if (this.context.state === "running") this.context.suspend();
      else this.context.resume();
      return this.context.state !== "running";
    }
    suspend() { if (this.context?.state === "running") this.context.suspend(); }
    resume() { if (this.started && this.context?.state === "suspended") this.context.resume(); }
  }

  const audio = new CityRunAudio();
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
  let routeMessageTimer = 0;
  let pointerStart = null;
  let visualRuntime = null;
  let visualFailure = null;
  let completionSaved = false;
  let arrivalElapsed = 0;
  let arrivalDuration = 0;
  let arrivalData = null;
  let routePhase = -1;

  function createMotion() {
    return engineApi.createEngine({
      seed: "tonight-see-you-2026",
      duration: 3600,
      finaleSeconds: 0,
      manualStages: true,
      startSpeed: 13.4,
      maxSpeed: 25.5,
      acceleration: 0.026,
      laneChangeDuration: 0.135,
      jumpDuration: 0.7,
      jumpHeight: 2,
      slideDuration: 0.56,
      moduleLength: 42,
      spawnAhead: 105,
      stages: content.STAGES.map((stage, index) => ({
        id: stage.id,
        from: index / 7,
        modules: content.ROAD_MODULES.filter((item) => item.stage === stage.order).map((item) => item.id)
      }))
    });
  }

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

  function safeLoad() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? rules.loadSave(JSON.parse(raw)) : null;
    } catch (_) {
      return null;
    }
  }

  function persist() {
    if (runState.status === "completed" && completionSaved) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(rules.createSave(runState, safeLoad())));
      if (runState.status === "completed") completionSaved = true;
    } catch (_) {}
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function currentStageIndex() { return Math.min(runState.stageIndex, content.STAGES.length - 1); }
  function visualStageIndex() { return pausedStage === null ? currentStageIndex() : pausedStage; }
  function currentStage() { return content.STAGES[currentStageIndex()]; }
  function show(node, visible) { if (node) node.hidden = !visible; }
  function announce(text) { if (ui.announcer) ui.announcer.textContent = text; }

  function toast(text, duration = 1150) {
    if (!ui.toast) return;
    ui.toast.textContent = text;
    ui.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { ui.toast.hidden = true; }, duration);
  }

  function showRouteMessage(stage, duration = 2800) {
    if (!ui.routeMessage || !ui.routeCopy) return;
    const clock = ["18:12", "10:06", "19:21", "21:44", "08:03", "22:17", "06:38"][stage.order - 1] || "NOW";
    if (ui.routeTime) ui.routeTime.textContent = clock;
    ui.routeCopy.textContent = stage.opening;
    ui.routeMessage.hidden = false;
    clearTimeout(routeMessageTimer);
    routeMessageTimer = setTimeout(() => { ui.routeMessage.hidden = true; }, duration);
  }

  function syncMotionStage(emitChange) {
    const index = currentStageIndex();
    if (emitChange) motion.syncStage(index);
    else motion.seekStage(index);
  }

  function updateCargoHud() {
    if (!ui.cargo) return;
    const items = runState.stage.items.slice(-3).map((id) => content.getItem(id));
    ui.cargo.innerHTML = "";
    items.forEach((item) => {
      const node = document.createElement("span");
      node.textContent = item.name;
      node.setAttribute("data-kind", item.kind);
      ui.cargo.appendChild(node);
    });
    ui.cargo.hidden = items.length === 0;
  }

  function updateRoutePhase(force = false) {
    const definition = rules.STAGES[currentStageIndex()];
    const progressRatio = runState.stage.progress / Math.max(1, definition.target);
    const timeRatio = runState.stage.elapsed / Math.max(1, definition.expectedSeconds || 180);
    const ratio = Math.min(0.999, Math.max(progressRatio, timeRatio));
    const nextPhase = Math.min(2, Math.floor(ratio * 3));
    if (!force && nextPhase === routePhase) return;
    routePhase = nextPhase;
    const route = content.getRoute(currentStageIndex() + 1);
    const venue = route.venues[nextPhase] || currentStage().destination;
    if (ui.destination) ui.destination.textContent = nextPhase === 2 ? `接近 ${currentStage().destination}` : `途经 ${venue}`;
    root?.setAttribute("data-route-phase", String(nextPhase + 1));
    visualRuntime?.setRoutePhase?.(nextPhase);
    if (!force && mode === "playing") toast(venue, 1500);
  }

  function syncCarryFromState() {
    visualRuntime?.clearCarry?.();
    runState.stage.items.slice(-3).forEach((id) => visualRuntime?.carry?.(content.getItem(id)));
  }

  function updateHud() {
    const index = currentStageIndex();
    const stage = content.STAGES[index];
    const definition = rules.STAGES[index];
    root?.setAttribute("data-stage", String(index + 1));
    if (ui.stageKicker) ui.stageKicker.textContent = `第${"一二三四五六七"[index]}程 · ${stage.name}`;
    if (ui.stageName) ui.stageName.textContent = stage.destination;
    if (ui.destination) ui.destination.textContent = `去 ${stage.destination}`;
    if (ui.condition) ui.condition.textContent = runState.condition;
    if (ui.conditionFill) ui.conditionFill.style.transform = `scaleX(${runState.condition / 100})`;
    const current = runState.status === "completed" ? definition.target : runState.stage.progress;
    if (ui.progress) ui.progress.textContent = `${current} / ${definition.target}`;
    if (ui.progressFill) ui.progressFill.style.transform = `scaleX(${Math.min(1, current / definition.target)})`;
    if (ui.combo) ui.combo.textContent = runState.combo > 1 ? `连贯 ×${runState.combo}` : "";
    if (ui.stageTrack) Array.from(ui.stageTrack.children).forEach((item, itemIndex) => {
      item.classList.toggle("is-done", itemIndex < runState.stageIndex);
      item.classList.toggle("is-current", itemIndex === index);
    });
    const save = safeLoad();
    show(ui.newGamePlus, Boolean(save?.profile?.newGamePlusUnlocked));
    updateCargoHud();
    updateRoutePhase(true);
    audio.setStage(index + 1, runState.condition);
  }

  function reset(newGamePlus) {
    runState = rules.createRunState({ newGamePlus: Boolean(newGamePlus) });
    motion = createMotion();
    mode = "intro";
    pausedStage = null;
    spawnClock = 0;
    patternCursor = 0;
    beatClock = 0;
    arrivalElapsed = 0;
    arrivalDuration = 0;
    arrivalData = null;
    routePhase = -1;
    completionSaved = false;
    clearTimeout(routeMessageTimer);
    show(ui.routeMessage, false);
    show(ui.arrival, false);
    show(ui.result, false);
    show(ui.intro, true);
    visualRuntime?.clearCarry?.();
    updateHud();
    return snapshot();
  }

  function start(saved) {
    audio.start();
    if (saved?.run?.status === "playing") runState = saved.run;
    syncMotionStage(false);
    mode = "playing";
    show(ui.intro, false);
    show(ui.result, false);
    updateHud();
    syncCarryFromState();
    showRouteMessage(currentStage());
    announce(`${currentStage().destination}，出发`);
  }

  function input(action) {
    if (mode !== "playing") return false;
    motion.input(action);
    audio.start();
    audio.action(action);
    return true;
  }

  function obstacleSubtype(stageIndex, form) {
    const mapping = STAGE_OBSTACLE_FORMS[stageIndex] || STAGE_OBSTACLE_FORMS[0];
    if (form === "train") return mapping.train;
    if (form === "service-cart") return mapping.cart;
    if (form === "signal-gate") return mapping.gate;
    return mapping.barrier;
  }

  function spawnPattern() {
    if (mode !== "playing") return false;
    const activeAhead = motion.state.entities.filter((entity) => entity.active && entity.z > 8);
    if (activeAhead.length > 24) return false;
    const farthest = activeAhead.reduce((maximum, entity) => Math.max(maximum, entity.z), 0);
    if (farthest > 72) return false;
    const stageIndex = currentStageIndex();
    const blueprint = PATTERN_BLUEPRINTS[(patternCursor + stageIndex * 2) % PATTERN_BLUEPRINTS.length];
    const baseZ = Math.max(38, farthest + 16);
    const patternId = `${content.STAGES[stageIndex].id}-${blueprint.id}-${patternCursor}`;
    blueprint.obstacles.forEach((spec, row) => {
      const subtype = obstacleSubtype(stageIndex, spec.form);
      motion.spawn({
        type: "obstacle",
        lane: spec.lane,
        z: baseZ + spec.z,
        avoid: spec.avoid,
        subtype,
        variant: (patternCursor + row + stageIndex) % 5,
        rewardNearMiss: spec.rewardNearMiss,
        patternId,
        momentId: `${patternId}-obstacle-${row}`,
        data: { venue: content.getRoute(stageIndex + 1).venues[Math.min(2, patternCursor % 3)] }
      });
    });

    const itemIds = content.STAGE_ITEM_IDS[stageIndex];
    const choiceGroup = `${patternId}-route`;
    [-1, 0, 1].forEach((lane, laneOffset) => {
      const itemId = itemIds[(patternCursor + laneOffset + stageIndex) % itemIds.length];
      const item = content.getItem(itemId);
      motion.spawn({
        type: "route-choice",
        lane,
        z: baseZ + blueprint.choiceZ,
        itemId,
        choiceGroup,
        choiceId: `${choiceGroup}-${itemId}`,
        patternId,
        points: 12 + stageIndex * 2,
        interaction: item.action,
        label: item.name,
        data: {
          itemId,
          choiceGroup,
          choiceId: `${choiceGroup}-${itemId}`,
          interaction: item.action,
          kind: item.kind,
          color: item.color,
          label: item.name,
          line: item.line
        }
      });
    });
    patternCursor += 1;
    return true;
  }

  function applyMoment(moment) {
    if (runState.status !== "playing") return;
    const before = runState.stageIndex;
    const beforeItems = runState.stage.items.slice();
    runState = rules.recordMoment(runState, moment);
    updateHud();
    persist();
    if (runState.status === "failed") {
      showFailure();
      return;
    }
    if (runState.stageIndex !== before || runState.status === "completed") {
      const record = runState.stageRecords.find((item) => item.id === rules.STAGES[before].id);
      beginArrival(before, record?.items?.length ? record.items : beforeItems);
    }
  }

  function collectStoryItem(entity) {
    const item = content.getItem(entity.itemId || entity.data?.itemId);
    const timing = Math.abs((beatClock % 0.78) - 0.39);
    const outcome = timing < 0.14 ? "perfect" : "good";
    visualRuntime?.effect("story-pickup", { ...entity, item });
    visualRuntime?.carry?.(item);
    audio.cue(outcome, item.kind);
    toast(item.name, 1000);
    applyMoment({
      outcome,
      kind: "story-item",
      itemId: item.id,
      choiceId: entity.choiceId || entity.data?.choiceId
    });
  }

  function handleMotionEvents(events) {
    events.forEach((event) => {
      if (event.type === "collect" && ["story-item", "route-choice"].includes(event.entity.type)) {
        collectStoryItem(event.entity);
      } else if (event.type === "collision") {
        visualRuntime?.effect("miss", event.entity);
        audio.cue("miss");
        toast("脚步乱了一下", 900);
        applyMoment({ outcome: "miss", kind: "collision" });
      } else if (event.type === "dodge") {
        visualRuntime?.effect("dodge", event.entity);
        audio.cue("good");
      } else if (event.type === "near-miss") {
        visualRuntime?.effect("near-miss", event.entity);
        if (runState.status === "playing") runState = rules.recordNearMiss(runState);
        updateHud();
      } else if (event.type === "story-missed") {
        visualRuntime?.effect("story-missed", event.entity);
      }
    });
  }

  function beginArrival(stageIndex, itemIds) {
    pausedStage = stageIndex;
    arrivalData = content.selectArrival({
      stage: stageIndex + 1,
      itemIds,
      seed: `${patternCursor}-${runState.bestCombo}-${itemIds.join("|")}`
    });
    const featuredItem = content.getItem(arrivalData.itemId);
    const supportingItems = itemIds.filter((id) => id !== featuredItem.id).slice(-2).map((id) => content.getItem(id));
    const stagedItems = supportingItems.length > 1
      ? [supportingItems[0], featuredItem, supportingItems[1]]
      : supportingItems.length ? [featuredItem, supportingItems[0]] : [featuredItem];
    arrivalData = {
      ...arrivalData,
      stageIndex,
      itemIds: itemIds.slice(),
      items: stagedItems,
      final: runState.status === "completed"
    };
    arrivalDuration = arrivalData.durationMs / 1000;
    arrivalElapsed = 0;
    mode = "arrival";
    clearTimeout(routeMessageTimer);
    show(ui.routeMessage, false);
    motion.state.entities.length = 0;
    if (ui.stageKicker) ui.stageKicker.textContent = `第${"一二三四五六七"[stageIndex]}程 · ${content.STAGES[stageIndex].name}`;
    if (ui.stageName) ui.stageName.textContent = arrivalData.venue;
    if (ui.arrivalKicker) ui.arrivalKicker.textContent = arrivalData.venue;
    if (ui.arrivalTitle) ui.arrivalTitle.textContent = arrivalData.itemName;
    if (ui.arrivalCopy) ui.arrivalCopy.textContent = arrivalData.line;
    show(ui.arrival, true);
    root?.setAttribute("data-arrival-stage", String(stageIndex + 1));
    visualRuntime?.beginArrival?.(arrivalData);
    audio.cue("arrival", content.getItem(arrivalData.itemId).kind);
    announce(`${arrivalData.venue}，${arrivalData.line}`);
  }

  function finishArrival() {
    if (mode !== "arrival") return;
    const completed = runState.status === "completed";
    show(ui.arrival, false);
    visualRuntime?.endArrival?.();
    visualRuntime?.clearCarry?.();
    arrivalElapsed = 0;
    arrivalDuration = 0;
    arrivalData = null;
    pausedStage = null;
    if (completed) {
      showResult();
      return;
    }
    motion.state.entities.length = 0;
    syncMotionStage(false);
    spawnClock = 0;
    mode = "playing";
    updateHud();
    showRouteMessage(currentStage());
    announce(`${currentStage().destination}，继续出发`);
  }

  function showFailure() {
    mode = "result";
    const rating = rules.calculateRating(runState, false);
    if (ui.grade) ui.grade.textContent = "—";
    if (ui.endingTitle) ui.endingTitle.textContent = runState.ending;
    if (ui.endingCopy) ui.endingCopy.textContent = "城市还在继续。调整一下呼吸，就从最近的路口重新出发。";
    fillStats(rating);
    show(ui.retry, true);
    show(ui.result, true);
    persist();
  }

  function fillStats(rating) {
    if (ui.completion) ui.completion.textContent = `${rating.completion}%`;
    if (ui.accuracy) ui.accuracy.textContent = `${rating.accuracy}%`;
    if (ui.resultItems) ui.resultItems.textContent = String(rating.items);
    if (ui.resultCollisions) ui.resultCollisions.textContent = String(rating.collisions);
  }

  function showResult() {
    mode = "result";
    const rating = rules.calculateRating(runState, true);
    const ending = content.getEnding(rating.grade);
    if (ui.grade) ui.grade.textContent = rating.grade;
    if (ui.endingTitle) ui.endingTitle.textContent = ending.title;
    if (ui.endingCopy) ui.endingCopy.textContent = `${ending.line} ${ending.coda}`;
    fillStats(rating);
    show(ui.retry, false);
    show(ui.result, true);
    persist();
    announce(`${rating.grade}级，${ending.title}`);
  }

  function retryStage() {
    if (mode !== "result" || runState.status !== "failed") return;
    runState = rules.retryFromCheckpoint(runState);
    motion = createMotion();
    syncMotionStage(false);
    mode = "playing";
    pausedStage = null;
    show(ui.result, false);
    spawnClock = 0;
    beatClock = 0;
    visualRuntime?.clearCarry?.();
    syncCarryFromState();
    updateHud();
    persist();
  }

  function advanceRulesTime(seconds) {
    if (mode !== "playing" || runState.status !== "playing") return;
    runState = rules.advanceTime(runState, seconds);
  }

  function update(seconds) {
    visualTime += seconds;
    beatClock += seconds;
    if (mode === "arrival") {
      arrivalElapsed = Math.min(arrivalDuration, arrivalElapsed + seconds);
      audio.tick(seconds, 0, true, true);
      if (arrivalElapsed >= arrivalDuration) finishArrival();
      return;
    }
    if (mode !== "playing") return;
    audio.tick(seconds, motion.state.speed, true, false);
    spawnClock -= seconds;
    if (spawnClock <= 0) {
      const spawned = spawnPattern();
      spawnClock = spawned ? 5.35 + (patternCursor % 3) * 0.38 : 0.35;
    }
    motion.step(seconds);
    handleMotionEvents(motion.drainEvents());
    if (mode === "playing") {
      syncMotionStage(false);
      advanceRulesTime(seconds);
      updateRoutePhase();
    }
    if (ui.score) ui.score.textContent = String(Math.round(motion.state.score + motion.state.distance + runState.successfulMoments * 40));
    if (ui.distance) ui.distance.textContent = `${Math.floor(motion.state.distance)}m`;
  }

  function render() {
    root?.setAttribute("data-state", mode);
    root?.style?.setProperty?.("--speed-aura-opacity", String(Math.min(0.48, 0.14 + Math.max(0, motion.state.speed - 13) * 0.018)));
    const visual = ensureVisualRuntime();
    if (!visual) return;
    visual.render({
      time: visualTime,
      stageIndex: visualStageIndex(),
      mode,
      motion: motion.state,
      runState,
      arrival: arrivalData ? {
        ...arrivalData,
        progress: Math.min(1, arrivalElapsed / Math.max(0.001, arrivalDuration))
      } : null,
      routePhase
    });
  }

  function frame(now) {
    const delta = Math.min(0.05, Math.max(0, (now - lastFrameAt) / 1000));
    lastFrameAt = now;
    update(delta);
    render();
    frameHandle = requestAnimationFrame(frame);
  }

  function configureCanvas() {
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { width: VIEW.width, height: VIEW.height };
    const width = Math.max(1, rect.width || VIEW.width);
    const height = Math.max(1, rect.height || VIEW.height);
    if (visualRuntime) visualRuntime.resize(width, height, Number(window.devicePixelRatio) || 1);
    else { canvas.width = VIEW.width; canvas.height = VIEW.height; }
  }

  function gestureThreshold() {
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { width: VIEW.width, height: VIEW.height };
    return Math.max(14, Math.min(32, Math.min(rect.width || VIEW.width, rect.height || VIEW.height) * 0.045));
  }

  function mapKey(key) {
    return ({ ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowUp: "jump", w: "jump", W: "jump", " ": "jump", ArrowDown: "slide", s: "slide", S: "slide" })[key];
  }

  document.addEventListener("keydown", (event) => {
    const action = mapKey(event.key);
    if (!action) return;
    event.preventDefault();
    input(action);
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (pointerStart !== null) return;
    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
    audio.start();
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!pointerStart || event.pointerId !== pointerStart.id) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    const distance = Math.hypot(dx, dy);
    const action = distance < gestureThreshold() ? "jump" : Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "jump" : "slide");
    input(action);
    pointerStart = null;
  });
  canvas.addEventListener("pointercancel", (event) => { if (pointerStart?.id === event.pointerId) pointerStart = null; });

  const bind = (selector, event, handler) => {
    const node = $(selector);
    if (node) node.addEventListener(event, handler);
  };
  bind("[data-start]", "click", () => start());
  bind("[data-continue]", "click", () => start(safeLoad()));
  bind("[data-new-run]", "click", () => { reset(); start(); });
  bind("[data-restart]", "click", () => { reset(Boolean(safeLoad()?.profile?.newGamePlusUnlocked)); start(); });
  bind("[data-retry]", "click", retryStage);
  bind("[data-new-game-plus]", "click", () => { const save = safeLoad(); if (save && rules.canStartNewGamePlus(save)) { reset(true); start(); } });
  bind("[data-sound]", "click", (event) => {
    const muted = audio.toggle();
    event.currentTarget.textContent = muted ? "♩" : "♪";
    event.currentTarget.setAttribute("aria-label", muted ? "开启声音" : "关闭声音");
  });

  window.addEventListener("runner-love-visuals-ready", () => { ensureVisualRuntime(); configureCanvas(); render(); });
  function pauseRuntime() {
    cancelAnimationFrame(frameHandle);
    frameHandle = 0;
    audio.suspend();
    pointerStart = null;
  }
  function resumeRuntime() {
    if (document.hidden || frameHandle) return;
    lastFrameAt = performance.now();
    audio.resume();
    frameHandle = requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden) pauseRuntime(); else resumeRuntime(); });
  window.addEventListener("pagehide", () => { persist(); pauseRuntime(); });
  window.addEventListener("pageshow", resumeRuntime);
  window.addEventListener("resize", () => { configureCanvas(); render(); });

  function debugStep(milliseconds) {
    const seconds = Math.max(0, Number(milliseconds) || 0) / 1000;
    for (let left = seconds; left > 1e-9; left -= 0.05) update(Math.min(0.05, left));
    render();
    return snapshot();
  }
  function completeStage(outcome = "perfect") {
    const index = runState.stageIndex;
    while (runState.status === "playing" && runState.stageIndex === index) {
      const itemId = content.STAGE_ITEM_IDS[index][runState.stage.progress % content.STAGE_ITEM_IDS[index].length];
      applyMoment({ outcome, kind: "story-item", itemId, choiceId: `debug-${index}-${runState.stage.progress}` });
    }
    return snapshot();
  }
  function finishArrivalDebug() {
    if (mode !== "arrival") return false;
    arrivalElapsed = arrivalDuration;
    finishArrival();
    return true;
  }
  function snapshot() {
    return {
      mode,
      pausedStage,
      arrival: arrivalData ? clone(arrivalData) : null,
      runState: clone(runState),
      routePhase,
      motion: {
        stageIndex: motion.state.stageIndex,
        stage: motion.state.stage,
        lane: motion.state.lane,
        lanePosition: motion.state.lanePosition,
        action: motion.state.action,
        distance: motion.state.distance,
        speed: motion.state.speed,
        stumbleTime: motion.state.stumbleTime,
        dodges: motion.state.dodges,
        nearMisses: motion.state.nearMisses,
        entities: clone(motion.state.entities),
        routeChoices: clone(motion.state.routeChoices)
      },
      visual: visualRuntime?.snapshot?.() || { ready: false, webgl: false, error: visualFailure ? String(visualFailure.message || visualFailure) : null },
      saved: safeLoad()
    };
  }

  window.__runnerLoveDebug = Object.freeze({
    snapshot,
    reset,
    start: () => start(),
    step: debugStep,
    input,
    spawn: (spec) => motion.spawn(spec),
    moment: applyMoment,
    beat: (outcome) => applyMoment({ outcome }),
    completeStage,
    finishArrival: finishArrivalDebug,
    retry: retryStage,
    save: persist
  });

  const saved = safeLoad();
  if (saved?.run?.status === "playing") show(ui.savedRun, true);
  configureCanvas();
  updateHud();
  render();
  frameHandle = requestAnimationFrame(frame);
})();
