(() => {
  "use strict";

  const root = document.querySelector("#billiards-love-game");
  if (!root) return;
  const MatterApi = window.Matter;
  const rules = window.BilliardsLoveRules;
  if (!MatterApi || !rules) throw new Error("Matter.js and BilliardsLoveRules are required");

  const { Engine, Events, Bodies, Body, Composite, Sleeping } = MatterApi;
  const canvas = document.querySelector("#bl-canvas");
  const stage = document.querySelector("#bl-stage");
  const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
  const scoreNode = document.querySelector("#bl-score");
  const chapterNumberNode = document.querySelector("#bl-chapter-number");
  const chapterTitleNode = document.querySelector("#bl-chapter-title");
  const chapterSubtitleNode = document.querySelector("#bl-chapter-subtitle");
  const memoryPipsNode = document.querySelector("#bl-memory-pips");
  const turnCountNode = document.querySelector("#bl-turn-count");
  const turnTotalNode = document.querySelector("#bl-turn-total");
  const statusNode = document.querySelector("#bl-status");
  const pulseFillNode = document.querySelector("#bl-pulse-fill");
  const coachNode = document.querySelector("#bl-coach");
  const aimHudNode = document.querySelector("#bl-aim-hud");
  const powerFillNode = document.querySelector("#bl-power-fill");
  const powerCopyNode = document.querySelector("#bl-power-copy");
  const toastNode = document.querySelector("#bl-toast");
  const shotCalloutNode = document.querySelector("#bl-shot-callout");
  const pauseSheet = document.querySelector("#bl-pause-sheet");
  const resultSheet = document.querySelector("#bl-result");
  const journalSheet = document.querySelector("#bl-journal-sheet");
  const journalListNode = document.querySelector("#bl-journal-list");
  const pauseButton = document.querySelector("#bl-pause");
  const soundButton = document.querySelector("#bl-sound");
  const cinematic = document.querySelector("#bl-cinematic");
  const sceneKickerNode = document.querySelector("#bl-scene-kicker");
  const sceneTitleNode = document.querySelector("#bl-scene-title");
  const sceneLineNode = document.querySelector("#bl-scene-line");
  const sceneActionButton = document.querySelector("#bl-scene-action");
  const resultKickerNode = document.querySelector("#bl-result-kicker");
  const resultTitleNode = document.querySelector("#bl-result-title");
  const resultCopyNode = document.querySelector("#bl-result-copy");
  const resultScoreNode = document.querySelector("#bl-result-score");
  const resultMemoriesNode = document.querySelector("#bl-result-memories");
  const resultEchoesNode = document.querySelector("#bl-result-echoes");

  const WORLD_WIDTH = 336;
  const WORLD_HEIGHT = 548;
  const BALL_RADIUS = rules.RULES.ballRadius;
  const PLAY_BOUNDS = Object.freeze({ left: 27, right: 309, top: 27, bottom: 521 });
  const AIM_BOUNDS = Object.freeze({
    left: PLAY_BOUNDS.left + BALL_RADIUS,
    right: PLAY_BOUNDS.right - BALL_RADIUS,
    top: PLAY_BOUNDS.top + BALL_RADIUS,
    bottom: PLAY_BOUNDS.bottom - BALL_RADIUS
  });
  const POCKETS = Object.freeze([
    { x: 25, y: 25, radius: 18.5, side: "corner" },
    { x: 311, y: 25, radius: 18.5, side: "corner" },
    { x: 21, y: 274, radius: 17.5, side: "middle" },
    { x: 315, y: 274, radius: 17.5, side: "middle" },
    { x: 25, y: 523, radius: 18.5, side: "corner" },
    { x: 311, y: 523, radius: 18.5, side: "corner" }
  ]);
  const STEP = 1000 / 60;
  const MAX_FRAME_DELTA = 180;
  const MAX_CATCHUP_STEPS = 8;
  const MAX_BACKLOG = STEP * 14;
  const STOP_SPEED = 0.14;
  const STOP_FRAMES = 18;
  const SHOT_TIMEOUT = 12000;
  const COACH_KEY = "yl-billiards-love-coach-seen";
  const MILESTONE_KEY = "yl-billiards-love-performances";

  const lifecycle = new AbortController();
  const timers = new Set();
  const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let reducedMotion = Boolean(reducedMotionQuery?.matches);

  function on(target, type, handler, options = {}) {
    target.addEventListener(type, handler, { ...options, signal: lifecycle.signal });
  }

  function later(handler, delay) {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      handler();
    }, delay);
    timers.add(timer);
    return timer;
  }

  function cancelLater(timer) {
    if (!timer) return;
    window.clearTimeout(timer);
    timers.delete(timer);
  }

  function readStorage(key, fallback = null) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Private browsing may make storage unavailable; gameplay does not depend on it.
    }
  }

  function loadPerformedMilestones() {
    try {
      const parsed = JSON.parse(readStorage(MILESTONE_KEY, "[]"));
      return new Set(Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []);
    } catch {
      return new Set();
    }
  }

  function vibrate(pattern) {
    window.navigator?.vibrate?.(pattern);
  }

  class BilliardsAudio {
    constructor() {
      this.enabled = true;
      this.context = null;
      this.master = null;
      this.music = null;
      this.filter = null;
      this.timer = 0;
      this.nextNoteAt = 0;
      this.beat = 0;
      this.level = 0;
      this.intensity = 0.2;
      this.noiseBuffer = null;
    }

    ensure() {
      if (!this.enabled || this.context) return;
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      this.context = new AudioCtor();
      this.master = this.context.createGain();
      this.music = this.context.createGain();
      this.filter = this.context.createBiquadFilter();
      this.master.gain.value = 0.76;
      this.music.gain.value = 0.16;
      this.filter.type = "lowpass";
      this.filter.frequency.value = 920;
      this.filter.Q.value = 0.7;
      this.music.connect(this.filter).connect(this.master);
      this.master.connect(this.context.destination);
      this.nextNoteAt = this.context.currentTime + 0.08;
      this.timer = window.setInterval(() => this.scheduleMusic(), 160);
    }

    resume() {
      if (!this.enabled) return;
      this.ensure();
      if (this.context?.state === "suspended") this.context.resume().catch(() => {});
    }

    pause() {
      if (this.context?.state === "running") this.context.suspend().catch(() => {});
    }

    setEnabled(enabled) {
      this.enabled = Boolean(enabled);
      if (this.enabled) {
        this.resume();
        this.play("open", 0.7);
      } else if (this.master && this.context) {
        this.master.gain.setTargetAtTime(0.0001, this.context.currentTime, 0.025);
        later(() => this.pause(), 100);
      }
    }

    setMood(level, intensity) {
      this.level = Math.max(0, Math.min(2, level));
      this.intensity = Math.max(0, Math.min(1, intensity));
      if (!this.context || !this.music || !this.filter) return;
      const now = this.context.currentTime;
      this.music.gain.setTargetAtTime(0.105 + this.intensity * 0.085, now, 0.3);
      this.filter.frequency.setTargetAtTime(720 + this.level * 190 + this.intensity * 430, now, 0.4);
    }

    scheduleTone(frequency, when, duration, gainValue, type = "sine", destination = this.music) {
      if (!this.context || !destination) return;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, when);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), when + Math.min(0.08, duration * 0.22));
      gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      oscillator.connect(gain).connect(destination);
      oscillator.start(when);
      oscillator.stop(when + duration + 0.03);
    }

    scheduleMusic() {
      if (!this.enabled || !this.context || this.context.state !== "running") return;
      const chords = [
        [[146.83, 174.61, 220], [130.81, 164.81, 196], [164.81, 196, 246.94], [123.47, 146.83, 185]],
        [[138.59, 174.61, 207.65], [155.56, 185, 233.08], [130.81, 164.81, 207.65], [146.83, 185, 220]],
        [[146.83, 185, 233.08], [164.81, 207.65, 246.94], [174.61, 220, 261.63], [130.81, 174.61, 220]]
      ];
      const lookAhead = this.context.currentTime + 0.48;
      while (this.nextNoteAt < lookAhead) {
        const chord = chords[this.level][Math.floor(this.beat / 4) % 4];
        const note = chord[this.beat % chord.length];
        if (this.beat % 4 === 0) {
          this.scheduleTone(chord[0] / 2, this.nextNoteAt, 1.8, 0.028 + this.intensity * 0.009, "sine");
        }
        this.scheduleTone(note * 2, this.nextNoteAt, 0.62, 0.008 + this.intensity * 0.006, "triangle");
        if (this.level === 2 && this.beat % 8 === 6) {
          this.scheduleTone(chord[2] * 2, this.nextNoteAt + 0.17, 0.8, 0.006, "sine");
        }
        this.beat += 1;
        this.nextNoteAt += 0.68;
      }
    }

    makeNoiseBuffer() {
      if (!this.context || this.noiseBuffer) return this.noiseBuffer;
      const length = Math.floor(this.context.sampleRate * 0.09);
      const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let index = 0; index < length; index += 1) {
        channel[index] = (Math.random() * 2 - 1) * (1 - index / length);
      }
      this.noiseBuffer = buffer;
      return buffer;
    }

    noise(when, duration, gainValue, cutoff) {
      if (!this.context || !this.master) return;
      const source = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      source.buffer = this.makeNoiseBuffer();
      filter.type = "bandpass";
      filter.frequency.value = cutoff;
      filter.Q.value = 1.4;
      gain.gain.setValueAtTime(gainValue, when);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      source.connect(filter).connect(gain).connect(this.master);
      source.start(when);
      source.stop(when + duration + 0.02);
    }

    play(name, strength = 1) {
      if (!this.enabled) return;
      this.resume();
      if (!this.context || !this.master) return;
      const now = this.context.currentTime;
      const amount = Math.max(0.25, Math.min(1.4, strength));
      if (name === "shot") {
        this.noise(now, 0.055, 0.055 * amount, 1200);
        this.scheduleTone(176, now, 0.09, 0.052 * amount, "triangle", this.master);
      } else if (name === "ball") {
        this.scheduleTone(620 + amount * 120, now, 0.045, 0.018 * amount, "sine", this.master);
      } else if (name === "rail") {
        this.noise(now, 0.04, 0.027 * amount, 760);
        this.scheduleTone(238, now, 0.055, 0.021 * amount, "triangle", this.master);
      } else if (name === "pocket") {
        this.scheduleTone(430, now, 0.2, 0.046, "sine", this.master);
        this.scheduleTone(286, now + 0.055, 0.25, 0.035, "triangle", this.master);
      } else if (name === "foul") {
        this.scheduleTone(154, now, 0.3, 0.048, "sawtooth", this.master);
        this.scheduleTone(116, now + 0.08, 0.34, 0.032, "triangle", this.master);
      } else if (name === "reply") {
        [293.66, 369.99, 440].forEach((frequency, index) => {
          this.scheduleTone(frequency, now + index * 0.07, 0.36, 0.034, "triangle", this.master);
        });
      } else if (name === "chapter" || name === "victory") {
        const notes = name === "victory" ? [220, 277.18, 329.63, 440, 554.37] : [196, 246.94, 293.66, 392];
        notes.forEach((frequency, index) => {
          this.scheduleTone(frequency, now + index * 0.1, 0.72, 0.035, index % 2 ? "triangle" : "sine", this.master);
        });
      } else if (name === "open") {
        this.scheduleTone(440, now, 0.12, 0.026, "sine", this.master);
      }
    }

    destroy() {
      if (this.timer) window.clearInterval(this.timer);
      this.timer = 0;
      this.context?.close?.().catch(() => {});
      this.context = null;
    }
  }

  const audio = new BilliardsAudio();
  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.x = 0;
  engine.gravity.y = 0;
  engine.gravity.scale = 0;
  engine.positionIterations = 10;
  engine.velocityIterations = 8;
  engine.constraintIterations = 3;

  let rails = [];
  let balls = [];
  let cueBall = null;
  let runState = rules.createRunState();
  let shotState = null;
  let paused = false;
  let journalOpen = false;
  let resultVisible = false;
  let sceneActive = false;
  let sceneQueue = [];
  let currentScene = null;
  let sceneTimer = 0;
  let pointerAim = null;
  let aimAngle = -Math.PI / 2;
  let keyboardPower = 0.36;
  let keyboardCharging = false;
  let keyboardAimVisible = true;
  let canvasScaleX = 1;
  let canvasScaleY = 1;
  let dpr = 1;
  let lastFrameAt = performance.now();
  let accumulator = 0;
  let simulationTime = 0;
  let frameHandle = 0;
  let stableFrames = 0;
  let particles = [];
  let pocketAnimations = [];
  let screenFlash = 0;
  let screenShake = 0;
  let toastTimer = 0;
  let calloutTimer = 0;
  let totalEchoes = 0;
  let collisionSoundAt = 0;
  let performedMilestones = loadPerformedMilestones();
  let destroyed = false;

  if (readStorage(COACH_KEY)) coachNode.classList.add("is-gone");

  function bodyData(body) {
    return body?.plugin?.billiardsLove || null;
  }

  function isRail(body) {
    return typeof body?.label === "string" && body.label.startsWith("bl-rail");
  }

  function createRail(x, y, width, height, label, angle = 0) {
    return Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      label,
      angle,
      restitution: 0.91,
      friction: 0.015,
      frictionStatic: 0,
      slop: 0.008
    });
  }

  function buildRails() {
    if (rails.length) Composite.remove(engine.world, rails);
    rails = [
      createRail(168, 20, 232, 14, "bl-rail-top"),
      createRail(168, 528, 232, 14, "bl-rail-bottom"),
      createRail(20, 150, 14, 190, "bl-rail-left-top"),
      createRail(20, 398, 14, 190, "bl-rail-left-bottom"),
      createRail(316, 150, 14, 190, "bl-rail-right-top"),
      createRail(316, 398, 14, 190, "bl-rail-right-bottom"),
      createRail(-15, WORLD_HEIGHT / 2, 18, WORLD_HEIGHT + 80, "bl-guard-left"),
      createRail(WORLD_WIDTH + 15, WORLD_HEIGHT / 2, 18, WORLD_HEIGHT + 80, "bl-guard-right"),
      createRail(WORLD_WIDTH / 2, -15, WORLD_WIDTH + 80, 18, "bl-guard-top"),
      createRail(WORLD_WIDTH / 2, WORLD_HEIGHT + 15, WORLD_WIDTH + 80, 18, "bl-guard-bottom")
    ];
    Composite.add(engine.world, rails);
  }

  function createBall(kind, x, y, moment = null) {
    const body = Bodies.circle(x, y, BALL_RADIUS, {
      label: kind === "cue" ? "bl-cue-ball" : `bl-moment-${moment.id}`,
      restitution: 0.935,
      friction: 0.006,
      frictionStatic: 0,
      frictionAir: 0.0125,
      density: 0.00225,
      slop: 0.006,
      sleepThreshold: 46
    });
    body.plugin.billiardsLove = {
      id: kind === "cue" ? "cue" : moment.id,
      kind,
      moment,
      potted: false
    };
    Body.setAngle(body, kind === "cue" ? 0 : moment.number * 0.43);
    balls.push(body);
    Composite.add(engine.world, body);
    return body;
  }

  function removeBall(body) {
    const data = bodyData(body);
    if (!data || data.potted) return;
    data.potted = true;
    const index = balls.indexOf(body);
    if (index >= 0) balls.splice(index, 1);
    Composite.remove(engine.world, body);
    if (body === cueBall) cueBall = null;
  }

  function clearBalls() {
    balls.slice().forEach((body) => Composite.remove(engine.world, body));
    balls = [];
    cueBall = null;
  }

  function objectBalls() {
    return balls.filter((body) => bodyData(body)?.kind === "moment");
  }

  function currentLevel() {
    return rules.LEVELS[runState.levelIndex];
  }

  function setStatus(copy) {
    statusNode.textContent = copy;
  }

  function updateJournal() {
    journalListNode.replaceChildren();
    if (!runState.unlockedMomentIds.length) {
      const empty = document.createElement("p");
      empty.className = "bl-journal-empty";
      empty.textContent = "第一段回忆，还在球桌上等你。";
      journalListNode.append(empty);
      return;
    }
    runState.unlockedMomentIds.forEach((id) => {
      const moment = rules.momentById(id);
      const entry = document.createElement("article");
      entry.className = "bl-journal-entry";
      entry.style.setProperty("--moment-color", moment.color);
      const number = document.createElement("i");
      number.textContent = String(moment.number);
      const copy = document.createElement("p");
      const title = document.createElement("strong");
      title.textContent = moment.name;
      const line = document.createElement("small");
      line.textContent = moment.line;
      copy.append(title, line);
      const score = document.createElement("b");
      score.textContent = `+${moment.points}`;
      entry.append(number, copy, score);
      journalListNode.append(entry);
    });
  }

  function updateHud() {
    const level = currentLevel();
    scoreNode.textContent = String(Math.round(runState.score));
    chapterNumberNode.textContent = `CHAPTER ${level.chapter}`;
    chapterTitleNode.textContent = level.title;
    chapterSubtitleNode.textContent = level.subtitle;
    turnCountNode.textContent = String(runState.shotsRemaining);
    turnTotalNode.textContent = `/ ${level.shots}`;
    memoryPipsNode.replaceChildren();
    for (let index = 0; index < level.goal; index += 1) {
      const pip = document.createElement("i");
      pip.classList.toggle("is-lit", index < runState.chapterPockets);
      memoryPipsNode.append(pip);
    }
    memoryPipsNode.setAttribute("aria-label", `已收下 ${runState.chapterPockets} / ${level.goal} 个片段`);
    pulseFillNode.style.width = `${Math.min(100, runState.chapterPockets / level.goal * 100)}%`;
    updateJournal();
    audio.setMood(runState.levelIndex, Math.min(1, runState.chapterPockets / level.goal + (shotState ? 0.22 : 0)));
  }

  function setupLevel() {
    clearBalls();
    const level = currentLevel();
    level.moments.forEach((placement) => {
      if (runState.unlockedMomentIds.includes(placement.id)) return;
      createBall("moment", placement.x, placement.y, rules.momentById(placement.id));
    });
    cueBall = createBall("cue", level.cue.x, level.cue.y);
    shotState = null;
    stableFrames = 0;
    pointerAim = null;
    keyboardCharging = false;
    keyboardPower = 0.36;
    keyboardAimVisible = true;
    aimAngle = -Math.PI / 2;
    pocketAnimations = [];
    particles = [];
    setAimHud(0, false);
    updateHud();
    setStatus(`${level.title} · 还差 ${level.goal} 个片段`);
    canvas.focus({ preventScroll: true });
  }

  function startNight(levelIndex = 0) {
    cancelLater(sceneTimer);
    sceneTimer = 0;
    sceneQueue = [];
    currentScene = null;
    sceneActive = false;
    cinematic.hidden = true;
    pauseSheet.hidden = true;
    resultSheet.hidden = true;
    journalSheet.hidden = true;
    paused = false;
    journalOpen = false;
    resultVisible = false;
    runState = rules.createRunState(levelIndex);
    totalEchoes = 0;
    simulationTime = 0;
    engine.timing.timestamp = 0;
    accumulator = 0;
    setupLevel();
    pauseButton.textContent = "Ⅱ";
    pauseButton.setAttribute("aria-label", "暂停游戏");
    audio.resume();
  }

  function hideCoach() {
    if (coachNode.classList.contains("is-gone")) return;
    coachNode.classList.add("is-gone");
    writeStorage(COACH_KEY, "1");
  }

  function showToast(copy, duration = 1250) {
    cancelLater(toastTimer);
    toastNode.textContent = copy;
    toastNode.classList.remove("is-visible");
    requestAnimationFrame(() => toastNode.classList.add("is-visible"));
    toastTimer = later(() => toastNode.classList.remove("is-visible"), duration);
  }

  function showCallout(copy) {
    cancelLater(calloutTimer);
    shotCalloutNode.textContent = copy;
    shotCalloutNode.classList.remove("is-visible");
    requestAnimationFrame(() => shotCalloutNode.classList.add("is-visible"));
    calloutTimer = later(() => shotCalloutNode.classList.remove("is-visible"), 1080);
  }

  function setAimHud(power, visible) {
    aimHudNode.hidden = !visible;
    const percentage = Math.round(Math.max(0, Math.min(1, power)) * 100);
    powerFillNode.style.width = `${percentage}%`;
    powerCopyNode.textContent = `${percentage}%`;
  }

  function hasPerformed(key) {
    return performedMilestones.has(key);
  }

  function markPerformed(key) {
    performedMilestones.add(key);
    writeStorage(MILESTONE_KEY, JSON.stringify([...performedMilestones]));
  }

  function queueScene(scene) {
    if (hasPerformed(scene.key)) {
      showToast(scene.repeat || scene.title, 1450);
      if (scene.onAction) later(scene.onAction, reducedMotion ? 180 : 850);
      return;
    }
    markPerformed(scene.key);
    sceneQueue.push(scene);
    if (!sceneActive) showNextScene();
  }

  function showNextScene() {
    if (!sceneQueue.length) return;
    currentScene = sceneQueue.shift();
    sceneActive = true;
    cinematic.dataset.scene = currentScene.scene;
    sceneKickerNode.textContent = currentScene.kicker;
    sceneTitleNode.textContent = currentScene.title;
    sceneLineNode.textContent = currentScene.line;
    sceneActionButton.hidden = !currentScene.onAction;
    sceneActionButton.textContent = currentScene.actionLabel || "继续今晚";
    cinematic.hidden = false;
    accumulator = 0;
    audio.setMood(runState.levelIndex, 0.92);
    audio.play(currentScene.sound || "chapter");
    vibrate(reducedMotion ? 12 : [14, 34, 18]);
    cancelLater(sceneTimer);
    if (!currentScene.onAction) {
      sceneTimer = later(() => closeScene(false), reducedMotion ? 800 : 2350);
    }
  }

  function closeScene(invokeAction) {
    if (!sceneActive) return;
    cancelLater(sceneTimer);
    sceneTimer = 0;
    const action = currentScene?.onAction;
    cinematic.hidden = true;
    sceneActive = false;
    currentScene = null;
    if (invokeAction && action) action();
    if (sceneQueue.length) later(showNextScene, 60);
    else audio.setMood(runState.levelIndex, runState.chapterPockets / currentLevel().goal);
  }

  function advanceChapter() {
    if (!runState.chapterComplete || runState.levelIndex >= rules.LEVELS.length - 1) return;
    runState = rules.advanceLevel(runState);
    setupLevel();
    showToast(`下一幕 · ${currentLevel().title}`, 1500);
  }

  function showResult(victory) {
    resultVisible = true;
    resultSheet.hidden = false;
    resultKickerNode.textContent = victory ? "AFTER HOURS · END CREDITS" : "今晚未完";
    resultTitleNode.textContent = victory ? "和你一起天亮" : "差一点抵达";
    resultCopyNode.textContent = victory
      ? "所有绕行都有回应，所有靠近都有了答案。"
      : "有些心意，需要再认真瞄准一次。";
    resultScoreNode.textContent = String(Math.round(runState.score));
    resultMemoriesNode.textContent = String(runState.unlockedMomentIds.length);
    resultEchoesNode.textContent = String(totalEchoes);
    setStatus(victory ? "今晚的故事，写到了天亮" : "回合用完了，再靠近一次");
    audio.play(victory ? "victory" : "foul");
  }

  function presentMeaningfulOutcome(outcome) {
    const level = currentLevel();
    const firstMoment = outcome.pottedMoments[0];
    if (outcome.victory) {
      queueScene({
        key: "final-dawn",
        scene: "dawn",
        kicker: "FINAL TABLE · 一起天亮",
        title: "这次，答案没有绕开",
        line: level.completion,
        repeat: "天亮时，她依然站在你身边",
        actionLabel: "收下今晚",
        onAction: () => showResult(true),
        sound: "victory"
      });
      return;
    }
    if (outcome.levelComplete) {
      queueScene({
        key: `chapter-${level.id}`,
        scene: level.scene,
        kicker: `CHAPTER ${level.chapter} · COMPLETE`,
        title: level.title,
        line: level.completion,
        repeat: `${level.title} · 再次抵达`,
        actionLabel: "进入下一幕",
        onAction: advanceChapter,
        sound: "chapter"
      });
      return;
    }

    const candidates = [
      outcome.milestones.includes("first-combination") ? {
        key: "first-combination",
        scene: "train",
        kicker: "COMBINATION · 同频",
        title: "你的心意，被她接力送达",
        line: "两次碰撞没有让方向散开，反而把没说完的话推得更近。",
        repeat: "组合球 · 心意接力",
        sound: "reply"
      } : null,
      outcome.milestones.includes("first-echo") ? {
        key: "first-echo",
        scene: "echo",
        kicker: "CUSHION ECHO · 间接回应",
        title: "绕了一点路，还是抵达",
        line: "桌沿替你转过那个弯，她把这一杆轻轻还给了你。",
        repeat: "桌沿回声 · 她还了你一杆",
        sound: "reply"
      } : null,
      outcome.milestones.includes("first-double") ? {
        key: "first-double",
        scene: "neon",
        kicker: "DOUBLE POCKET · 两段同频",
        title: "这一秒，城市同时亮起",
        line: "两个片段在同一杆落袋，像你们恰好说出了相同的答案。",
        repeat: "双球落袋 · 同一秒心动",
        sound: "reply"
      } : null,
      outcome.milestones.includes("first-approach") && firstMoment ? {
        key: "first-approach",
        scene: "rain",
        kicker: `第一次落袋 · ${firstMoment.name}`,
        title: "雨声靠近了一点",
        line: firstMoment.line,
        repeat: `${firstMoment.name} · 再次收下`,
        sound: "chapter"
      } : null
    ].filter(Boolean);
    const unseen = candidates.find((candidate) => !hasPerformed(candidate.key));
    if (unseen) queueScene(unseen);
  }

  function canAim() {
    return !paused
      && !journalOpen
      && !resultVisible
      && !sceneActive
      && !shotState
      && !runState.chapterComplete
      && runState.shotsRemaining > 0
      && Boolean(cueBall);
  }

  function pointerToWorld(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * WORLD_WIDTH / Math.max(1, rect.width),
      y: (event.clientY - rect.top) * WORLD_HEIGHT / Math.max(1, rect.height)
    };
  }

  function currentPointerGesture() {
    if (!pointerAim) return null;
    return rules.computeAimGesture(pointerAim.start, pointerAim.current);
  }

  function shoot(direction, speed, power) {
    if (!canAim() || !direction || speed <= 0) return false;
    hideCoach();
    audio.resume();
    Sleeping.set(cueBall, false);
    Body.setVelocity(cueBall, { x: direction.x * speed, y: direction.y * speed });
    Body.setAngularVelocity(cueBall, (direction.x - direction.y) * 0.018);
    shotState = {
      startedAt: simulationTime,
      firstContactId: null,
      cueRailBeforeContact: false,
      railHits: 0,
      combination: false,
      pottedIds: [],
      scratch: false,
      touchedObjects: new Set()
    };
    stableFrames = 0;
    pointerAim = null;
    keyboardCharging = false;
    keyboardAimVisible = false;
    setAimHud(0, false);
    setStatus("这一杆正在靠近");
    audio.play("shot", 0.7 + power * 0.5);
    audio.setMood(runState.levelIndex, 0.72 + power * 0.2);
    vibrate(power > 0.75 ? [12, 20, 8] : 10);
    return true;
  }

  function shootKeyboard() {
    const power = Math.max(0.16, keyboardPower);
    const speed = rules.RULES.minShotSpeed + power * (rules.RULES.maxShotSpeed - rules.RULES.minShotSpeed);
    const direction = { x: Math.cos(aimAngle), y: Math.sin(aimAngle) };
    return shoot(direction, speed, power);
  }

  on(canvas, "pointerdown", (event) => {
    if (!canAim()) return;
    event.preventDefault();
    audio.resume();
    hideCoach();
    canvas.setPointerCapture?.(event.pointerId);
    const point = pointerToWorld(event);
    pointerAim = { id: event.pointerId, start: point, current: point };
    keyboardAimVisible = false;
    setAimHud(0, true);
  }, { passive: false });

  on(canvas, "pointermove", (event) => {
    if (!pointerAim || pointerAim.id !== event.pointerId) return;
    event.preventDefault();
    pointerAim.current = pointerToWorld(event);
    const gesture = currentPointerGesture();
    if (gesture?.active) aimAngle = Math.atan2(gesture.direction.y, gesture.direction.x);
    setAimHud(gesture?.power || 0, true);
  }, { passive: false });

  function releasePointer(event, shouldShoot) {
    if (!pointerAim || pointerAim.id !== event.pointerId) return;
    if (shouldShoot) pointerAim.current = pointerToWorld(event);
    const gesture = currentPointerGesture();
    pointerAim = null;
    setAimHud(0, false);
    if (shouldShoot && gesture?.active) {
      shoot(gesture.direction, gesture.speed, gesture.power);
    } else if (shouldShoot) {
      keyboardAimVisible = true;
      showToast("再拉开一点，才足够抵达");
    }
  }

  on(canvas, "pointerup", (event) => {
    event.preventDefault();
    releasePointer(event, true);
  }, { passive: false });
  on(canvas, "pointercancel", (event) => releasePointer(event, false));
  on(canvas, "contextmenu", (event) => event.preventDefault());

  function isTypingTarget(target) {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
  }

  on(window, "keydown", (event) => {
    if (isTypingTarget(event.target)) return;
    const key = event.key.toLowerCase();
    if (key === "escape") {
      event.preventDefault();
      if (journalOpen) closeJournal();
      else if (!resultVisible && !sceneActive) togglePause();
      return;
    }
    if (key === "r" && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      startNight(0);
      return;
    }
    if (!canAim()) return;
    const angleStep = event.shiftKey ? 0.025 : 0.055;
    if (key === "arrowleft" || key === "a") {
      event.preventDefault();
      aimAngle -= angleStep;
      keyboardAimVisible = true;
    } else if (key === "arrowright" || key === "d") {
      event.preventDefault();
      aimAngle += angleStep;
      keyboardAimVisible = true;
    } else if (key === "arrowup" || key === "w") {
      event.preventDefault();
      keyboardPower = Math.min(1, keyboardPower + 0.08);
      keyboardAimVisible = true;
      setAimHud(keyboardPower, true);
    } else if (key === "arrowdown" || key === "s") {
      event.preventDefault();
      keyboardPower = Math.max(0.12, keyboardPower - 0.08);
      keyboardAimVisible = true;
      setAimHud(keyboardPower, true);
    } else if (event.code === "Space") {
      event.preventDefault();
      if (!event.repeat) {
        audio.resume();
        hideCoach();
        keyboardCharging = true;
        keyboardPower = Math.max(0.15, keyboardPower);
        keyboardAimVisible = true;
        setAimHud(keyboardPower, true);
      }
    } else if (key === "enter") {
      event.preventDefault();
      shootKeyboard();
    }
  });

  on(window, "keyup", (event) => {
    if (event.code !== "Space" || !keyboardCharging) return;
    event.preventDefault();
    keyboardCharging = false;
    shootKeyboard();
  });

  Events.on(engine, "collisionStart", (event) => {
    if (!shotState) return;
    event.pairs.forEach((pair) => {
      const first = pair.bodyA;
      const second = pair.bodyB;
      const firstData = bodyData(first);
      const secondData = bodyData(second);
      const relativeSpeed = Math.hypot(
        (first.velocity?.x || 0) - (second.velocity?.x || 0),
        (first.velocity?.y || 0) - (second.velocity?.y || 0)
      );

      if (firstData && secondData) {
        if (simulationTime - collisionSoundAt > 42 && relativeSpeed > 0.45) {
          collisionSoundAt = simulationTime;
          audio.play("ball", Math.min(1.25, relativeSpeed / 7));
        }
        const cueData = firstData.kind === "cue" ? firstData : secondData.kind === "cue" ? secondData : null;
        const momentData = firstData.kind === "moment" ? firstData : secondData.kind === "moment" ? secondData : null;
        if (cueData && momentData) {
          if (shotState.firstContactId === null) shotState.firstContactId = momentData.id;
          shotState.touchedObjects.add(momentData.id);
        } else if (firstData.kind === "moment" && secondData.kind === "moment" && shotState.firstContactId !== null) {
          shotState.combination = true;
        }
      }

      const railBody = isRail(first) ? first : isRail(second) ? second : null;
      const ballBody = firstData ? first : secondData ? second : null;
      if (railBody && ballBody) {
        shotState.railHits += 1;
        if (bodyData(ballBody).kind === "cue" && shotState.firstContactId === null) {
          shotState.cueRailBeforeContact = true;
        }
        if (simulationTime - collisionSoundAt > 48 && ballBody.speed > 0.5) {
          collisionSoundAt = simulationTime;
          audio.play("rail", Math.min(1.25, ballBody.speed / 7));
        }
      }
    });
  });

  function nearestPocket(body) {
    let match = null;
    let nearest = Infinity;
    POCKETS.forEach((pocket) => {
      const distance = Math.hypot(body.position.x - pocket.x, body.position.y - pocket.y);
      if (distance < pocket.radius && distance < nearest) {
        match = pocket;
        nearest = distance;
      }
    });
    return match;
  }

  function createPocketBurst(x, y, color, strong = false) {
    const count = reducedMotion ? 4 : strong ? 20 : 12;
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.65 + Math.random() * (strong ? 2.1 : 1.35);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: 1.2 + Math.random() * 2.2,
        color,
        heart: index % 4 === 0
      });
    }
    screenFlash = Math.max(screenFlash, strong ? 0.2 : 0.11);
    screenShake = reducedMotion ? 0 : Math.max(screenShake, strong ? 3.2 : 1.6);
  }

  function pocketBall(body, pocket) {
    if (!shotState) return;
    const data = bodyData(body);
    if (!data || data.potted) return;
    pocketAnimations.push({
      x: pocket.x,
      y: pocket.y,
      life: 1,
      angle: body.angle,
      kind: data.kind,
      moment: data.moment
    });
    if (data.kind === "cue") {
      shotState.scratch = true;
      createPocketBurst(pocket.x, pocket.y, "#f5efe4", true);
      vibrate([18, 34, 18]);
    } else {
      shotState.pottedIds.push(data.id);
      createPocketBurst(pocket.x, pocket.y, data.moment.accent, shotState.pottedIds.length > 1);
      showToast(`${data.moment.name} · 落袋`, 950);
      vibrate(14);
    }
    removeBall(body);
    audio.play("pocket");
  }

  function checkPockets() {
    if (!shotState) return;
    balls.slice().forEach((body) => {
      const pocket = nearestPocket(body);
      if (pocket) pocketBall(body, pocket);
    });
  }

  function stopAllBalls() {
    balls.forEach((body) => {
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
      Sleeping.set(body, true);
    });
  }

  function respotCueBall() {
    if (cueBall) return;
    const level = currentLevel();
    const occupied = objectBalls().map((body) => ({
      x: body.position.x,
      y: body.position.y,
      radius: BALL_RADIUS
    }));
    let placement;
    try {
      placement = rules.findCuePlacement(level.cue, occupied, PLAY_BOUNDS, BALL_RADIUS);
    } catch {
      placement = { x: WORLD_WIDTH / 2, y: PLAY_BOUNDS.bottom - 54 };
    }
    cueBall = createBall("cue", placement.x, placement.y);
    createPocketBurst(placement.x, placement.y, "#f4eadb", false);
  }

  function resolveActiveShot() {
    if (!shotState) return;
    stopAllBalls();
    const completedShot = shotState;
    shotState = null;
    stableFrames = 0;
    const outcome = rules.resolveShot(runState, {
      firstContactId: completedShot.firstContactId,
      pottedIds: completedShot.pottedIds,
      scratch: completedShot.scratch,
      cueRailBeforeContact: completedShot.cueRailBeforeContact,
      railHits: completedShot.railHits,
      combination: completedShot.combination
    });
    runState = outcome.state;
    if (outcome.indirect) totalEchoes += 1;
    if (outcome.scratch) respotCueBall();
    keyboardAimVisible = true;
    keyboardPower = 0.36;
    updateHud();

    if (outcome.foul) {
      const copy = outcome.scratch ? "白球落袋 · 心意走偏" : "没有碰到她的片段";
      showCallout(copy);
      setStatus(`${copy} · -${outcome.penalty}`);
      audio.play("foul");
    } else if (outcome.indirect) {
      showCallout("绕过桌沿 · 她回了这一杆");
      setStatus(`间接回应 · 回合返还 · +${outcome.scoreDelta}`);
      audio.play("reply");
    } else if (outcome.pottedMoments.length > 1) {
      showCallout(`同频落袋 ×${outcome.pottedMoments.length}`);
      setStatus(`同时收下 ${outcome.pottedMoments.length} 个片段 · +${outcome.scoreDelta}`);
      audio.play("reply");
    } else if (outcome.pottedMoments.length === 1) {
      const moment = outcome.pottedMoments[0];
      showCallout(`收下 · ${moment.name}`);
      setStatus(`${moment.line} · +${outcome.scoreDelta}`);
    } else {
      showCallout("这一杆停在夜色里");
      setStatus(`还剩 ${runState.shotsRemaining} 个回合`);
    }

    if (outcome.gameOver) {
      later(() => showResult(false), reducedMotion ? 180 : 950);
    } else {
      presentMeaningfulOutcome(outcome);
    }
  }

  function updateShotResolution() {
    if (!shotState) return;
    const elapsed = simulationTime - shotState.startedAt;
    const moving = balls.some((body) => body.speed > STOP_SPEED || body.angularSpeed > 0.018);
    stableFrames = !moving && elapsed > 320 ? stableFrames + 1 : 0;
    if (stableFrames >= STOP_FRAMES || elapsed >= SHOT_TIMEOUT) resolveActiveShot();
  }

  function togglePause(force) {
    if (resultVisible || sceneActive) return;
    paused = force === undefined ? !paused : Boolean(force);
    pauseSheet.hidden = !paused;
    pauseButton.textContent = paused ? "▶" : "Ⅱ";
    pauseButton.setAttribute("aria-label", paused ? "继续游戏" : "暂停游戏");
    if (paused) {
      pointerAim = null;
      keyboardCharging = false;
      accumulator = 0;
      setAimHud(0, false);
      setStatus("雨声暂停在这一秒");
      audio.pause();
    } else {
      lastFrameAt = performance.now();
      setStatus(shotState ? "这一杆正在靠近" : "球房重新亮起");
      audio.resume();
    }
  }

  function openJournal() {
    if (shotState || sceneActive || resultVisible) {
      showToast("等这一杆停稳，再翻开回忆");
      return;
    }
    journalOpen = true;
    journalSheet.hidden = false;
    updateJournal();
    accumulator = 0;
  }

  function closeJournal() {
    journalOpen = false;
    journalSheet.hidden = true;
    lastFrameAt = performance.now();
    canvas.focus({ preventScroll: true });
  }

  on(document.querySelector("#bl-restart"), "click", () => startNight(0));
  on(document.querySelector("#bl-restart-pause"), "click", () => startNight(0));
  on(document.querySelector("#bl-resume"), "click", () => togglePause(false));
  on(document.querySelector("#bl-retry"), "click", () => startNight(runState.levelIndex));
  on(document.querySelector("#bl-new-night"), "click", () => startNight(0));
  on(document.querySelector("#bl-journal"), "click", openJournal);
  on(document.querySelector("#bl-journal-close"), "click", closeJournal);
  on(pauseButton, "click", () => togglePause());
  on(soundButton, "click", () => {
    audio.setEnabled(!audio.enabled);
    soundButton.textContent = audio.enabled ? "♪" : "×";
    soundButton.setAttribute("aria-label", audio.enabled ? "关闭声音" : "开启声音");
  });
  on(document.querySelector("#bl-scene-skip"), "click", () => closeScene(Boolean(currentScene?.onAction)));
  on(sceneActionButton, "click", () => closeScene(true));

  on(document, "visibilitychange", () => {
    if (document.hidden) {
      if (!paused && !resultVisible && !sceneActive) togglePause(true);
      else audio.pause();
    }
  });

  if (reducedMotionQuery) {
    on(reducedMotionQuery, "change", (event) => {
      reducedMotion = event.matches;
      if (reducedMotion) screenShake = 0;
    });
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const value = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + value, y);
    ctx.arcTo(x + width, y, x + width, y + height, value);
    ctx.arcTo(x + width, y + height, x, y + height, value);
    ctx.arcTo(x, y + height, x, y, value);
    ctx.arcTo(x, y, x + width, y, value);
    ctx.closePath();
  }

  function drawTable(ctx) {
    ctx.fillStyle = "#070b0d";
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const wood = ctx.createLinearGradient(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    wood.addColorStop(0, "#231216");
    wood.addColorStop(0.36, "#562a2c");
    wood.addColorStop(0.68, "#2f181c");
    wood.addColorStop(1, "#171015");
    ctx.fillStyle = wood;
    roundedRect(ctx, 4, 3, WORLD_WIDTH - 8, WORLD_HEIGHT - 6, 28);
    ctx.fill();
    ctx.strokeStyle = "rgba(229, 185, 103, 0.55)";
    ctx.lineWidth = 1.2;
    roundedRect(ctx, 8, 7, WORLD_WIDTH - 16, WORLD_HEIGHT - 14, 24);
    ctx.stroke();

    const felt = ctx.createLinearGradient(0, 18, WORLD_WIDTH, WORLD_HEIGHT - 18);
    felt.addColorStop(0, "#1b5550");
    felt.addColorStop(0.43, "#133f3d");
    felt.addColorStop(1, "#092b2c");
    ctx.fillStyle = felt;
    roundedRect(ctx, 16, 15, WORLD_WIDTH - 32, WORLD_HEIGHT - 30, 20);
    ctx.fill();

    ctx.save();
    roundedRect(ctx, 16, 15, WORLD_WIDTH - 32, WORLD_HEIGHT - 30, 20);
    ctx.clip();
    const reflection = ctx.createLinearGradient(20, 0, WORLD_WIDTH - 20, 0);
    reflection.addColorStop(0, "rgba(207, 229, 219, 0)");
    reflection.addColorStop(0.46, "rgba(207, 229, 219, 0.055)");
    reflection.addColorStop(0.5, "rgba(242, 190, 112, 0.11)");
    reflection.addColorStop(0.54, "rgba(207, 229, 219, 0.055)");
    reflection.addColorStop(1, "rgba(207, 229, 219, 0)");
    ctx.fillStyle = reflection;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.strokeStyle = "rgba(204, 231, 225, 0.035)";
    ctx.lineWidth = 1;
    for (let offset = -WORLD_HEIGHT; offset < WORLD_WIDTH; offset += 34) {
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset + WORLD_HEIGHT * 0.34, WORLD_HEIGHT);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(238, 187, 104, 0.035)";
    for (let row = 0; row < 6; row += 1) {
      ctx.fillRect(52 + (row % 2) * 168, 66 + row * 73, 31, 5);
    }
    ctx.restore();

    const drawCushion = (x, y, width, height) => {
      const cushion = ctx.createLinearGradient(x, y, x + width, y + height);
      cushion.addColorStop(0, "#1f625b");
      cushion.addColorStop(0.48, "#0f4744");
      cushion.addColorStop(1, "#092d2f");
      ctx.fillStyle = cushion;
      roundedRect(ctx, x, y, width, height, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(217, 179, 101, 0.33)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    };
    drawCushion(52, 16, 232, 12);
    drawCushion(52, 520, 232, 12);
    drawCushion(16, 55, 12, 190);
    drawCushion(16, 303, 12, 190);
    drawCushion(308, 55, 12, 190);
    drawCushion(308, 303, 12, 190);

    ctx.fillStyle = "rgba(241, 209, 139, 0.58)";
    for (let index = 0; index < 5; index += 1) {
      const x = 78 + index * 45;
      ctx.beginPath();
      ctx.arc(x, 9.8, 1.25, 0, Math.PI * 2);
      ctx.arc(x, WORLD_HEIGHT - 9.8, 1.25, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let index = 0; index < 8; index += 1) {
      const y = 73 + index * 57;
      ctx.beginPath();
      ctx.arc(9.7, y, 1.25, 0, Math.PI * 2);
      ctx.arc(WORLD_WIDTH - 9.7, y, 1.25, 0, Math.PI * 2);
      ctx.fill();
    }

    POCKETS.forEach((pocket) => {
      const rim = ctx.createRadialGradient(pocket.x - 3, pocket.y - 3, 1, pocket.x, pocket.y, pocket.radius + 4);
      rim.addColorStop(0, "#030506");
      rim.addColorStop(0.58, "#020304");
      rim.addColorStop(0.72, "#26181a");
      rim.addColorStop(1, "rgba(218, 175, 93, 0.7)");
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pocket.radius + 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(250, 224, 168, 0.14)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.save();
    ctx.globalAlpha = 0.11;
    ctx.strokeStyle = "#edc77a";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 16, Math.PI * 0.16, Math.PI * 0.84);
    ctx.arc(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 16, Math.PI * 1.16, Math.PI * 1.84);
    ctx.stroke();
    ctx.restore();
  }

  function drawHeart(ctx, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.72);
    ctx.bezierCurveTo(-size * 1.08, size * 0.05, -size * 0.78, -size * 0.78, 0, -size * 0.36);
    ctx.bezierCurveTo(size * 0.78, -size * 0.78, size * 1.08, size * 0.05, 0, size * 0.72);
    ctx.fill();
  }

  function drawBall(ctx, body, alpha = 1, scale = 1) {
    const data = bodyData(body);
    if (!data) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.scale(scale, scale);
    ctx.shadowColor = "rgba(0, 0, 0, 0.48)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 3;

    if (data.kind === "cue") {
      const pearl = ctx.createRadialGradient(-3.4, -4.2, 0.5, 0, 0, BALL_RADIUS + 1);
      pearl.addColorStop(0, "#ffffff");
      pearl.addColorStop(0.55, "#f2efe5");
      pearl.addColorStop(1, "#aebbb7");
      ctx.fillStyle = pearl;
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.save();
      ctx.translate(0, 0.2);
      drawHeart(ctx, 2.1, "rgba(194, 74, 103, 0.78)");
      ctx.restore();
    } else {
      const moment = data.moment;
      const gradient = ctx.createRadialGradient(-3.2, -4, 0.6, 0, 0, BALL_RADIUS + 1);
      gradient.addColorStop(0, moment.accent);
      gradient.addColorStop(0.32, moment.color);
      gradient.addColorStop(1, "#172328");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = "transparent";
      if (moment.number % 2 === 0) {
        ctx.strokeStyle = "rgba(249, 240, 219, 0.72)";
        ctx.lineWidth = 3.1;
        ctx.beginPath();
        ctx.arc(0, 0, BALL_RADIUS - 1.6, Math.PI * 0.18, Math.PI * 0.82);
        ctx.arc(0, 0, BALL_RADIUS - 1.6, Math.PI * 1.18, Math.PI * 1.82);
        ctx.stroke();
      }
      ctx.fillStyle = "#f9f2e6";
      ctx.beginPath();
      ctx.arc(0, 0, 3.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#172126";
      ctx.font = `900 ${moment.number > 9 ? 4.6 : 5.4}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(moment.number), 0, 0.2);
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, BALL_RADIUS - 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function aimPreview() {
    if (!canAim() || !cueBall) return null;
    const pointerGesture = currentPointerGesture();
    if (pointerGesture?.active) return pointerGesture;
    if (!keyboardAimVisible && !keyboardCharging) return null;
    const power = Math.max(0.12, keyboardPower);
    return {
      active: true,
      pull: power * rules.RULES.maxPull,
      power,
      speed: rules.RULES.minShotSpeed + power * (rules.RULES.maxShotSpeed - rules.RULES.minShotSpeed),
      direction: { x: Math.cos(aimAngle), y: Math.sin(aimAngle) }
    };
  }

  function drawAim(ctx) {
    const preview = aimPreview();
    if (!preview || !cueBall) return;
    const circles = objectBalls().map((body) => ({
      id: bodyData(body).id,
      x: body.position.x,
      y: body.position.y,
      radius: BALL_RADIUS
    }));
    const trace = rules.traceAimPath(
      cueBall.position,
      preview.direction,
      AIM_BOUNDS,
      circles,
      1,
      BALL_RADIUS
    );

    ctx.save();
    ctx.lineCap = "round";
    trace.segments.forEach((segment, index) => {
      ctx.setLineDash(index === 0 ? [4, 4] : [2, 5]);
      ctx.strokeStyle = index === 0
        ? `rgba(247, 218, 157, ${0.42 + preview.power * 0.34})`
        : "rgba(91, 194, 181, 0.48)";
      ctx.lineWidth = index === 0 ? 1.2 : 0.9;
      ctx.beginPath();
      ctx.moveTo(segment.start.x, segment.start.y);
      ctx.lineTo(segment.end.x, segment.end.y);
      ctx.stroke();
      if (segment.type === "cushion") {
        ctx.fillStyle = "rgba(245, 199, 111, 0.72)";
        ctx.beginPath();
        ctx.arc(segment.end.x, segment.end.y, 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.setLineDash([]);
    if (trace.hitBallId) {
      const target = objectBalls().find((body) => bodyData(body).id === trace.hitBallId);
      if (target) {
        ctx.strokeStyle = "rgba(245, 211, 139, 0.76)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(target.position.x, target.position.y, BALL_RADIUS + 3.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const pull = 15 + preview.power * 20;
    const backX = cueBall.position.x - preview.direction.x * (BALL_RADIUS + pull);
    const backY = cueBall.position.y - preview.direction.y * (BALL_RADIUS + pull);
    const tailX = cueBall.position.x - preview.direction.x * (91 + pull);
    const tailY = cueBall.position.y - preview.direction.y * (91 + pull);
    const cueGradient = ctx.createLinearGradient(backX, backY, tailX, tailY);
    cueGradient.addColorStop(0, "#f0d5a0");
    cueGradient.addColorStop(0.08, "#7fb4ab");
    cueGradient.addColorStop(0.12, "#e2bc75");
    cueGradient.addColorStop(1, "#5c2b28");
    ctx.strokeStyle = cueGradient;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(backX, backY);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(backX, backY);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();
    ctx.restore();
  }

  function drawEffects(ctx) {
    pocketAnimations.forEach((animation) => {
      const fakeBody = {
        position: { x: animation.x, y: animation.y },
        angle: animation.angle,
        plugin: { billiardsLove: { kind: animation.kind, moment: animation.moment } }
      };
      drawBall(ctx, fakeBody, Math.max(0, animation.life), Math.max(0.18, animation.life));
    });
    particles.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.translate(particle.x, particle.y);
      if (particle.heart) drawHeart(ctx, particle.size, particle.color);
      else {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function updateEffects(delta) {
    const frame = Math.min(2.4, delta / 16.667);
    particles.forEach((particle) => {
      particle.x += particle.vx * frame;
      particle.y += particle.vy * frame;
      particle.vx *= 0.982;
      particle.vy = particle.vy * 0.982 + 0.018 * frame;
      particle.life -= 0.032 * frame;
    });
    particles = particles.filter((particle) => particle.life > 0);
    pocketAnimations.forEach((animation) => {
      animation.life -= 0.048 * frame;
    });
    pocketAnimations = pocketAnimations.filter((animation) => animation.life > 0);
    screenFlash = Math.max(0, screenFlash - 0.028 * frame);
    screenShake = Math.max(0, screenShake - 0.3 * frame);
  }

  function drawFrame() {
    if (!context || !canvas.width || !canvas.height) return;
    const shakeX = screenShake ? (Math.random() - 0.5) * screenShake : 0;
    const shakeY = screenShake ? (Math.random() - 0.5) * screenShake : 0;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(
      dpr * canvasScaleX,
      0,
      0,
      dpr * canvasScaleY,
      shakeX * dpr * canvasScaleX,
      shakeY * dpr * canvasScaleY
    );
    drawTable(context);
    drawAim(context);
    balls
      .slice()
      .sort((first, second) => bodyData(first).kind === "cue" ? 1 : bodyData(second).kind === "cue" ? -1 : 0)
      .forEach((body) => drawBall(context, body));
    drawEffects(context);
    if (screenFlash > 0) {
      context.fillStyle = `rgba(255, 235, 190, ${screenFlash})`;
      context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvasScaleX = rect.width / WORLD_WIDTH;
    canvasScaleY = rect.height / WORLD_HEIGHT;
    drawFrame();
  }

  function tick(now) {
    const elapsed = Math.max(0, now - lastFrameAt);
    const delta = Math.min(MAX_FRAME_DELTA, elapsed);
    lastFrameAt = now;

    if (keyboardCharging && canAim()) {
      keyboardPower = Math.min(1, keyboardPower + elapsed * 0.00048);
      setAimHud(keyboardPower, true);
    }

    if (!paused && !journalOpen && !resultVisible && !sceneActive) {
      accumulator = Math.min(MAX_BACKLOG, accumulator + delta);
      let steps = 0;
      while (accumulator >= STEP && steps < MAX_CATCHUP_STEPS) {
        Engine.update(engine, STEP);
        simulationTime += STEP;
        checkPockets();
        updateShotResolution();
        accumulator -= STEP;
        steps += 1;
        if (paused || journalOpen || resultVisible || sceneActive) {
          accumulator = 0;
          break;
        }
      }
    } else {
      accumulator = 0;
    }

    updateEffects(Math.min(50, elapsed));
    drawFrame();
    frameHandle = requestAnimationFrame(tick);
  }

  const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(resizeCanvas) : null;
  resizeObserver?.observe(stage);
  if (!resizeObserver) on(window, "resize", resizeCanvas, { passive: true });

  buildRails();
  startNight(0);
  resizeCanvas();
  frameHandle = requestAnimationFrame(tick);

  function destroyGame() {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(frameHandle);
    resizeObserver?.disconnect();
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.clear();
    lifecycle.abort();
    Events.off(engine);
    Engine.clear(engine);
    audio.destroy();
  }

  on(window, "pagehide", (event) => {
    if (event.persisted) {
      audio.pause();
      lastFrameAt = performance.now();
      accumulator = 0;
      return;
    }
    destroyGame();
  });

  on(window, "pageshow", (event) => {
    if (!event.persisted || destroyed) return;
    lastFrameAt = performance.now();
    accumulator = 0;
    if (!paused && !resultVisible) audio.resume();
    drawFrame();
  });
})();
