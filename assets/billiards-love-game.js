(function () {
  "use strict";

  const rules = window.BilliardsLoveRules;
  const content = window.BilliardsLoveContent;
  const Physics = window.BilliardsPhysics;
  if (!rules || !content || !Physics) throw new Error("心动桌球运行依赖未加载");

  const { Engine, Bodies, Body, Composite, Events } = Physics;
  const required = (selector) => {
    const node = document.querySelector(selector);
    if (!node) throw new Error(`缺少心动桌球节点：${selector}`);
    return node;
  };

  const root = required("#heartbeat-billiards");
  const canvas = required("#hb-canvas");
  let context = canvas.getContext("2d", { alpha: true });
  let tableCacheCanvas = null;
  let tableCacheDirty = true;
  let dateMapDarkCanvas = null;
  let dateMapClearCanvas = null;
  const tableWrap = required("#hb-table-wrap");
  const elements = {
    stageKicker: required("#hb-stage-kicker"),
    stageTitle: required("#hb-stage-title"),
    stageTargets: required("#hb-stage-targets"),
    interestWrap: required("#hb-interest-wrap"),
    interest: required("#hb-interest"),
    interestRing: required("#hb-interest-ring"),
    shots: required("#hb-shots"),
    streak: required("#hb-streak"),
    selectedBall: required("#hb-selected-ball"),
    selectedName: required("#hb-selected-name"),
    trackNodes: required("#hb-track-nodes"),
    trackProgress: required("#hb-track-progress"),
    call: required("#hb-call"),
    callLabel: required("#hb-call-label"),
    callTitle: required("#hb-call-title"),
    callHint: required("#hb-call-hint"),
    tableStory: required("#hb-table-story"),
    pocketFocus: required("#hb-pocket-focus"),
    sceneLens: required("#hb-scene-lens"),
    tableMoment: required("#hb-table-moment"),
    tableMomentScene: required("#hb-table-moment-scene"),
    tableMomentTitle: required("#hb-table-moment-title"),
    tableMomentLine: required("#hb-table-moment-line"),
    micro: required("#hb-micro"),
    microKicker: required("#hb-micro-kicker"),
    microTitle: required("#hb-micro-title"),
    microLine: required("#hb-micro-line"),
    judgement: required("#hb-judgement"),
    coach: required("#hb-coach"),
    aimToggle: required("#hb-aim-toggle"),
    sound: required("#hb-sound"),
    cinematic: required("#hb-cinematic"),
    cinematicImage: required("#hb-cinematic-image"),
    cinematicSkip: required("#hb-cinematic-skip"),
    cinematicKicker: required("#hb-cinematic-kicker"),
    cinematicTitle: required("#hb-cinematic-title"),
    cinematicLine: required("#hb-cinematic-line"),
    cinematicAction: required("#hb-cinematic-action"),
    result: required("#hb-result"),
    resultGrade: required("#hb-result-grade"),
    resultTitle: required("#hb-result-title"),
    resultLine: required("#hb-result-line"),
    resultShots: required("#hb-result-shots"),
    resultAccuracy: required("#hb-result-accuracy"),
    resultStreak: required("#hb-result-streak"),
    resultInterest: required("#hb-result-interest"),
    retry: required("#hb-retry")
  };

  const WORLD = Object.freeze({ width: 720, height: 1440 });
  const TABLE = Object.freeze({ left: 58, right: 662, top: 116, bottom: 1324 });
  const TABLE_OUTER = Object.freeze({ left: 2, right: 718, top: 48, bottom: 1392 });
  const BALL_RADIUS = 14.85;
  const BALL_DIAMETER = BALL_RADIUS * 2;
  const POCKET_RADIUS = 37.6;
  const POCKET_MIN_INWARD_SPEED = 0.012;
  const POCKET_MOUTH_DEPTH_TOLERANCE = BALL_RADIUS * 0.08;
  const POCKET_MOUTH_LATERAL_TOLERANCE = BALL_RADIUS * 0.06;
  const POCKET_SHELF_DEPTH_TOLERANCE = BALL_RADIUS * 0.10;
  const POCKET_SHELF_LATERAL_TOLERANCE = BALL_RADIUS * 0.08;
  const POCKET_APPROACH_EXIT_DEPTH = BALL_RADIUS * 0.30;
  const POCKET_LIP_SETTLE_RATIO = 0.88;
  const POCKET_VISUAL_CAPTURE_RATIO = 0.25;
  const CORNER_POCKET_MOUTH = BALL_DIAMETER * 2.28;
  const SIDE_POCKET_MOUTH = BALL_DIAMETER * 2.53;
  const CORNER_POCKET_SHELF = BALL_DIAMETER * 0.65;
  const SIDE_POCKET_SHELF = BALL_DIAMETER * 0.14;
  const CORNER_CUT_ANGLE_DEGREES = 142;
  const SIDE_CUT_ANGLE_DEGREES = 104;
  const CORNER_JAW_OFFSET = (CORNER_CUT_ANGLE_DEGREES - 135) * Math.PI / 180;
  const SIDE_JAW_OFFSET = (SIDE_CUT_ANGLE_DEGREES - 90) * Math.PI / 180;
  const POCKET_JAW_LENGTH = BALL_DIAMETER * 1.75;
  const FIXED_HZ = 120;
  const FIXED_STEP = 1000 / FIXED_HZ;
  const MAX_STEPS_PER_FRAME = 8;
  const MIN_PULL = 14;
  const MAX_PULL = 300;
  const LIGHT_PULL_END = 0.24;
  const STRONG_PULL_START = 0.82;
  const LIGHT_POWER_MAX = 0.30;
  const STRONG_POWER_MIN = 0.76;
  const AIM_LOCK_DELAY_MS = 500;
  const AIM_LOCK_MIN_PULL_RATIO = 0.035;
  const AIM_LOCK_DIRECTION_EPSILON = 0.012;
  const AIM_LOCK_BREAK_ANGLE = 0.055;
  const MIN_SHOT_SPEED = 2.6;
  const MAX_SHOT_SPEED = 42;
  const STOP_SPEED = Physics.CONFIG.stopSpeed;
  const NATURAL_STOP_SPEED = 0.14;
  const POCKET_MIN_DURATION = 280;
  const POCKET_MAX_DURATION = 450;
  const POCKET_STORY_SLOW_MOTION_MS = 460;
  const POCKET_STORY_TIME_SCALE = 0.24;
  const TABLE_MOMENT_DEFAULT_DURATION = 1500;
  const MAX_RENDER_WIDTH = 1440;
  const MAX_RENDER_HEIGHT = 2880;
  const MAX_RENDER_PIXELS = MAX_RENDER_WIDTH * MAX_RENDER_HEIGHT;
  const MAX_BALL_RENDER_SCALE = 3.5;
  const CUE_SPOT = Object.freeze({ x: WORLD.width / 2, y: 1080 });
  const RACK_APEX = Object.freeze({ x: WORLD.width / 2, y: 510 });
  const COACH_KEY = "yl-heartbeat-billiards-coach-v2";
  const SETTINGS_KEY = "yl-heartbeat-billiards-settings-v2";
  const RECORD_KEY = "yl-heartbeat-billiards-record-v2";
  const VIEWED_KEY = "yl-heartbeat-billiards-viewed-v2";
  const BALL_COLORS = Object.freeze({
    1: "#e9c348", 2: "#2676bf", 3: "#c33f40", 4: "#754493",
    5: "#df7b30", 6: "#358553", 7: "#8e3740", 8: "#181b1d",
    9: "#e9c348", 10: "#2676bf", 11: "#c33f40", 12: "#754493",
    13: "#df7b30", 14: "#358553", 15: "#8e3740"
  });
  const DEFAULT_DATE_SCENES = Object.freeze([
    { id: "corner-store", pocketId: "top-left", name: "街角便利店", x: 178, y: 238, focusX: 18, focusY: 8, color: "#d991aa" },
    { id: "coffee-window", pocketId: "top-right", name: "临窗咖啡店", x: 542, y: 238, focusX: 82, focusY: 8, color: "#edbd91" },
    { id: "late-cinema", pocketId: "middle-left", name: "午夜电影院", x: 360, y: 478, focusX: 50, focusY: 28, color: "#e4759a" },
    { id: "river-walk", pocketId: "middle-right", name: "河边步道", x: 360, y: 716, focusX: 50, focusY: 48, color: "#bf8db5" },
    { id: "last-train", pocketId: "bottom-left", name: "末班车站", x: 360, y: 968, focusX: 50, focusY: 69, color: "#b99bc5" },
    { id: "walk-home", pocketId: "bottom-right", name: "回家的街道", x: 360, y: 1192, focusX: 50, focusY: 90, color: "#efc17f" }
  ]);
  const sourceDateScenes = Array.isArray(content.POCKET_DATE_SCENES)
    ? content.POCKET_DATE_SCENES
    : Object.values(content.POCKET_DATE_SCENES || {});
  const DATE_SCENES = Object.freeze(DEFAULT_DATE_SCENES.map((fallback) => Object.freeze({
    ...fallback,
    ...(sourceDateScenes.find((scene) => scene.pocketId === fallback.pocketId) || {}),
    drawType: fallback.id
  })));
  const DATE_SCENE_BY_POCKET = new Map(DATE_SCENES.map((scene) => [scene.pocketId, scene]));
  const FALLBACK_MOTIFS = Object.freeze([
    "rain", "coffee", "ticket", "camera", "lamp", "earphones", "cat", "heart",
    "sunset", "gift", "message", "transit", "star", "umbrella", "home"
  ]);
  const DIAGONAL = Math.SQRT1_2;

  function createPocket({ id, type, mouthX, mouthY, inwardX, inwardY }) {
    const mouth = type === "corner" ? CORNER_POCKET_MOUTH : SIDE_POCKET_MOUTH;
    const shelf = type === "corner" ? CORNER_POCKET_SHELF : SIDE_POCKET_SHELF;
    const cutAngleDegrees = type === "corner" ? CORNER_CUT_ANGLE_DEGREES : SIDE_CUT_ANGLE_DEGREES;
    const jawOffset = type === "corner" ? CORNER_JAW_OFFSET : SIDE_JAW_OFFSET;
    const captureDepth = Math.min(shelf, BALL_RADIUS * POCKET_VISUAL_CAPTURE_RATIO);
    const dropDepth = shelf + BALL_RADIUS;
    return Object.freeze({
      id,
      type,
      mouthX,
      mouthY,
      x: mouthX + inwardX * dropDepth,
      y: mouthY + inwardY * dropDepth,
      captureX: mouthX + inwardX * captureDepth,
      captureY: mouthY + inwardY * captureDepth,
      inwardX,
      inwardY,
      mouth,
      shelf,
      captureDepth,
      cutAngleDegrees,
      jawOffset,
      captureHalfWidth: mouth / 2 - captureDepth * Math.tan(jawOffset)
    });
  }

  const CORNER_MOUTH_AXIS_OFFSET = CORNER_POCKET_MOUTH * DIAGONAL / 2;
  const POCKETS = Object.freeze([
    createPocket({ id: "top-left", type: "corner", mouthX: TABLE.left + CORNER_MOUTH_AXIS_OFFSET, mouthY: TABLE.top + CORNER_MOUTH_AXIS_OFFSET, inwardX: -DIAGONAL, inwardY: -DIAGONAL }),
    createPocket({ id: "top-right", type: "corner", mouthX: TABLE.right - CORNER_MOUTH_AXIS_OFFSET, mouthY: TABLE.top + CORNER_MOUTH_AXIS_OFFSET, inwardX: DIAGONAL, inwardY: -DIAGONAL }),
    createPocket({ id: "middle-left", type: "side", mouthX: TABLE.left, mouthY: WORLD.height / 2, inwardX: -1, inwardY: 0 }),
    createPocket({ id: "middle-right", type: "side", mouthX: TABLE.right, mouthY: WORLD.height / 2, inwardX: 1, inwardY: 0 }),
    createPocket({ id: "bottom-left", type: "corner", mouthX: TABLE.left + CORNER_MOUTH_AXIS_OFFSET, mouthY: TABLE.bottom - CORNER_MOUTH_AXIS_OFFSET, inwardX: -DIAGONAL, inwardY: DIAGONAL }),
    createPocket({ id: "bottom-right", type: "corner", mouthX: TABLE.right - CORNER_MOUTH_AXIS_OFFSET, mouthY: TABLE.bottom - CORNER_MOUTH_AXIS_OFFSET, inwardX: DIAGONAL, inwardY: DIAGONAL })
  ]);
  const RACK = Object.freeze([
    [1],
    [4, 9],
    [2, 8, 10],
    [6, 14, 5, 15],
    [3, 7, 11, 12, 13]
  ]);
  const RELATIONSHIP_SIGHTS = Object.freeze([
    ...[0.25, 0.5, 0.75].map((fraction) => ({
      x: TABLE.left + (TABLE.right - TABLE.left) * fraction,
      y: TABLE.top - 43
    })),
    ...[0.125, 0.25, 0.375, 0.625, 0.75, 0.875].map((fraction) => ({
      x: TABLE.right + 43,
      y: TABLE.top + (TABLE.bottom - TABLE.top) * fraction
    })),
    ...[0.75, 0.5, 0.25].map((fraction) => ({
      x: TABLE.left + (TABLE.right - TABLE.left) * fraction,
      y: TABLE.bottom + 43
    })),
    ...[0.875, 0.75, 0.625, 0.375, 0.25, 0.125].map((fraction) => ({
      x: TABLE.left - 43,
      y: TABLE.top + (TABLE.bottom - TABLE.top) * fraction
    }))
  ]);
  function loadMaterialTexture(source) {
    if (typeof window.Image !== "function") return null;
    const image = new window.Image();
    image.decoding = "async";
    image.addEventListener("load", () => {
      tableCacheDirty = true;
    }, { once: true });
    image.src = source;
    return image;
  }

  const MATERIAL_TEXTURES = Object.freeze({
    cloth: loadMaterialTexture("assets/billiards-textures/worsted-cloth.jpg"),
    walnut: loadMaterialTexture("assets/billiards-textures/dark-walnut.jpg"),
    dateMap: loadMaterialTexture("assets/billiards-scenes/date-map-rose-v3.jpg")
  });

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage is optional; gameplay remains fully local and transient.
    }
  }

  function markViewed(id) {
    if (!id) return;
    const viewed = readStorage(VIEWED_KEY, []);
    if (viewed.includes(id)) return;
    writeStorage(VIEWED_KEY, [...viewed, id]);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function powerFromPullRatio(value) {
    const ratio = clamp(value, 0, 1);
    if (ratio <= LIGHT_PULL_END) {
      return ratio / LIGHT_PULL_END * LIGHT_POWER_MAX;
    }
    if (ratio <= STRONG_PULL_START) {
      const progress = (ratio - LIGHT_PULL_END) / (STRONG_PULL_START - LIGHT_PULL_END);
      return LIGHT_POWER_MAX + progress * (STRONG_POWER_MIN - LIGHT_POWER_MAX);
    }
    const progress = (ratio - STRONG_PULL_START) / (1 - STRONG_PULL_START);
    return STRONG_POWER_MIN + progress * (1 - STRONG_POWER_MIN);
  }

  function distance(left, right) {
    return Math.hypot(left.x - right.x, left.y - right.y);
  }

  function normalize(vector, fallback = { x: 1, y: 0 }) {
    const length = Math.hypot(vector.x, vector.y);
    return length > 1e-7 ? { x: vector.x / length, y: vector.y / length } : { ...fallback };
  }

  function directionAngle(left, right) {
    const dot = clamp(left.x * right.x + left.y * right.y, -1, 1);
    return Math.acos(dot);
  }

  function roundRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawMaterialTexture(image, x, y, width, height, opacity) {
    if (!image || !image.complete || !image.naturalWidth || typeof context.drawImage !== "function") return false;
    context.save();
    context.globalAlpha = opacity;
    context.drawImage(image, x, y, width, height);
    context.restore();
    return true;
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, rect.height);
    const deviceScale = Math.max(1, Number(window.devicePixelRatio) || 1);
    renderScale = Math.min(
      deviceScale,
      MAX_RENDER_WIDTH / cssWidth,
      MAX_RENDER_HEIGHT / cssHeight,
      Math.sqrt(MAX_RENDER_PIXELS / (cssWidth * cssHeight))
    );
    canvas.width = Math.max(1, Math.round(cssWidth * renderScale));
    canvas.height = Math.max(1, Math.round(cssHeight * renderScale));
    resizeBallRenderer();
  }

  function configurePortraitSurface() {
    Object.assign(tableWrap.style, {
      width: "min(calc(100% - 10px), calc((100dvh - 92px) / 2))",
      height: "auto",
      minWidth: "0",
      maxWidth: "100%",
      maxHeight: "100%",
      aspectRatio: "1 / 2"
    });
    Object.assign(canvas.style, {
      position: "static",
      top: "auto",
      left: "auto",
      width: "100%",
      height: "100%",
      transform: "none",
      transformOrigin: "center"
    });
    canvas.setAttribute("aria-label", "在桌面任意位置反向滑动瞄准蓄力，松开击球");
    resizeCanvas();
  }

  const RECORDED_AUDIO_ASSETS = Object.freeze({
    strike: "assets/audio/billiards/cue-strike.ogg",
    contactSoft: "assets/audio/billiards/ball-contact-soft.ogg",
    contactHard: "assets/audio/billiards/ball-contact-hard.ogg",
    rail: "assets/audio/billiards/rail-contact.ogg",
    pocket: "assets/audio/billiards/pocket-drop.ogg",
    event: "assets/audio/billiards/event-soft.ogg",
    stage: "assets/audio/billiards/stage-rise.ogg"
  });

  class HeartbeatPoolAudio {
    constructor() {
      const settings = readStorage(SETTINGS_KEY, {});
      this.enabled = settings.sound !== false;
      this.volume = Number.isFinite(settings.volume) ? clamp(settings.volume, 0.08, 0.8) : 0.54;
      this.context = null;
      this.master = null;
      this.sampleBytes = new Map();
      this.sampleBuffers = new Map();
      this.decodePromises = new Map();
      this.pendingStarts = new Set();
      this.lastCollisionAt = 0;
      this.lastRailAt = 0;
      this.stage = 1;
      this.dateFlow = 0;
      this.dateFlowPaused = false;
      this.musicLayers = [];
      this.prepareSamples();
    }

    prepareSamples() {
      if (typeof window.fetch !== "function") return;
      Object.entries(RECORDED_AUDIO_ASSETS).forEach(([name, url]) => {
        const request = window.fetch(url, { cache: "force-cache" })
          .then((response) => {
            if (!response.ok) throw new Error(`音频加载失败：${url}`);
            return response.arrayBuffer();
          })
          .catch(() => null);
        this.sampleBytes.set(name, request);
      });
    }

    unlock() {
      if (!this.enabled) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (this.context) {
        if (this.context.state === "suspended") this.context.resume().catch(() => {});
        return;
      }
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.context.destination);
      this.startMusicBed();
      this.decodeAllSamples();
    }

    decodeAllSamples() {
      if (!this.context || typeof this.context.decodeAudioData !== "function") return;
      this.sampleBytes.forEach((request, name) => {
        if (this.sampleBuffers.has(name) || this.decodePromises.has(name)) return;
        const decoding = request
          .then((bytes) => bytes ? this.context.decodeAudioData(bytes.slice(0)) : null)
          .then((buffer) => {
            if (buffer) this.sampleBuffers.set(name, buffer);
            return buffer;
          })
          .catch(() => null);
        this.decodePromises.set(name, decoding);
      });
    }

    startBuffer(buffer, gainValue, playbackRate) {
      if (!buffer || !this.enabled || !this.context || !this.master) return false;
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;
      gain.gain.value = clamp(gainValue, 0.02, 1.25);
      source.connect(gain).connect(this.master);
      source.start();
      return true;
    }

    playSample(name, gainValue = 1, playbackRate = 1) {
      if (!this.enabled) return false;
      this.unlock();
      const buffer = this.sampleBuffers.get(name);
      if (buffer) return this.startBuffer(buffer, gainValue, playbackRate);
      const decoding = this.decodePromises.get(name);
      if (!decoding || this.pendingStarts.has(name)) return false;
      const requestedAt = performance.now();
      const maximumDelay = ["event", "stage"].includes(name) ? 900 : 240;
      this.pendingStarts.add(name);
      decoding.then((decoded) => {
        this.pendingStarts.delete(name);
        if (decoded && performance.now() - requestedAt <= maximumDelay) {
          this.startBuffer(decoded, gainValue, playbackRate);
        }
      });
      return false;
    }

    startMusicBed() {
      if (!this.context || this.musicLayers.length || typeof this.context.createOscillator !== "function") return;
      const frequencies = [110, 164.81, 220, 329.63];
      frequencies.forEach((frequency, index) => {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = index < 2 ? "sine" : "triangle";
        oscillator.frequency.value = frequency;
        gain.gain.value = 0.0001;
        oscillator.connect(gain).connect(this.master);
        oscillator.start();
        this.musicLayers.push({ oscillator, gain });
      });
      this.applyDateFlow();
    }

    applyDateFlow() {
      if (!this.context || !this.musicLayers.length) return;
      const levels = this.dateFlowPaused
        ? [0.0022, 0.0001, 0.0001, 0.0001]
        : [0.0036, this.dateFlow >= 2 ? 0.003 : 0.0001, this.dateFlow >= 4 ? 0.002 : 0.0001, this.dateFlow >= 5 ? 0.0012 : 0.0001];
      this.musicLayers.forEach((layer, index) => {
        const target = this.enabled ? levels[index] : 0.0001;
        layer.gain.gain.setTargetAtTime?.(target, this.context.currentTime, 0.42);
      });
    }

    setStage(stage) {
      this.stage = clamp(Number(stage) || 1, 1, 7);
      const transpose = 1 + (this.stage - 1) * 0.012;
      this.musicLayers.forEach((layer, index) => {
        const base = [110, 164.81, 220, 329.63][index];
        layer.oscillator.frequency.setTargetAtTime?.(base * transpose, this.context.currentTime, 0.8);
      });
    }

    setDateFlow(streak, paused = false) {
      this.dateFlow = clamp(Math.trunc(streak || 0), 0, 8);
      this.dateFlowPaused = Boolean(paused);
      this.applyDateFlow();
    }

    cue(name, intensity = 1) {
      if (name === "strike") {
        this.playSample("strike", 0.82 * intensity, 0.98 + intensity * 0.025);
      } else if (name === "pocket") {
        this.playSample("pocket", 0.74 * intensity, 0.98);
      } else if (name === "scratch") {
        this.playSample("pocket", 0.58, 0.9);
      } else if (name === "warning" || name === "miss") {
        this.playSample("event", 0.36 * intensity, name === "warning" ? 0.86 : 0.92);
      } else if (name === "event") {
        this.playSample("event", 0.48 * intensity, 1);
      } else if (name === "streak") {
        this.playSample("event", 0.58 * intensity, 1.06);
      } else if (["stage", "confession", "proposal"].includes(name)) {
        const rate = name === "confession" ? 0.98 : name === "proposal" ? 1.04 : 1;
        this.playSample("stage", name === "proposal" ? 0.78 : 0.68, rate);
      }
    }

    collision(speed) {
      const now = performance.now();
      if (now - this.lastCollisionAt < 18 || speed < 0.32) return;
      this.lastCollisionAt = now;
      const hard = speed >= 6.4;
      this.playSample(hard ? "contactHard" : "contactSoft",
        clamp(0.22 + speed / 17, 0.24, 0.96),
        clamp(0.94 + speed * 0.008, 0.95, 1.07));
    }

    rail(speed) {
      const now = performance.now();
      if (now - this.lastRailAt < 28 || speed < 0.42) return;
      this.lastRailAt = now;
      this.playSample("rail", clamp(0.2 + speed / 20, 0.22, 0.82),
        clamp(0.94 + speed * 0.006, 0.95, 1.05));
    }

    snapshot() {
      return Object.freeze({
        mode: "recorded-samples-with-ambient-bed",
        enabled: this.enabled,
        contextState: this.context?.state || "uninitialized",
        loadedSamples: Object.freeze([...this.sampleBuffers.keys()].sort()),
        expectedSamples: Object.keys(RECORDED_AUDIO_ASSETS).length,
        dateFlow: this.dateFlow,
        musicLayers: this.musicLayers.length
      });
    }

    toggle() {
      this.enabled = !this.enabled;
      const settings = readStorage(SETTINGS_KEY, {});
      writeStorage(SETTINGS_KEY, { ...settings, sound: this.enabled, volume: this.volume });
      if (this.enabled) this.unlock();
      if (this.master && this.context) {
        this.master.gain.setTargetAtTime(this.enabled ? this.volume : 0.0001, this.context.currentTime, 0.04);
      }
      this.applyDateFlow();
      return this.enabled;
    }
  }

  const audio = new HeartbeatPoolAudio();
  const engine = Engine.create({ enableSleeping: false });
  engine.gravity.x = 0;
  engine.gravity.y = 0;
  engine.gravity.scale = 0;

  let rails = [];
  let balls = [];
  let cueBall = null;
  let runState = rules.createRunState();
  let selectedBallNumber = null;
  let shotState = null;
  let pointerAim = null;
  let aimDirection = { x: 0, y: -1 };
  let aimPower = 0;
  let resolvingShot = false;
  let cinematicActive = false;
  let resultVisible = false;
  let aimAssist = readStorage(SETTINGS_KEY, {}).aimAssist !== false;
  let accumulator = 0;
  let lastFrameAt = performance.now();
  let frameHandle = 0;
  let stableSteps = 0;
  let simulationTime = 0;
  let particles = [];
  let pocketBursts = [];
  let storyTrails = [];
  let collisionFeedbacks = [];
  let collisionCount = 0;
  let microQueue = [];
  let microTimer = 0;
  let judgementTimer = 0;
  let cinematicQueue = [];
  let cinematicCurrent = null;
  let cinematicTimer = 0;
  let tableMomentActive = false;
  let tableMomentCurrent = null;
  let tableMomentTimer = 0;
  let sceneLensTimer = 0;
  let sceneLensStartTimer = 0;
  let storySlowMotionUntil = 0;
  let lastStoryOrigin = { x: 50, y: 50 };
  let lastStoryWorldOrigin = { x: WORLD.width / 2, y: WORLD.height / 2 };
  let dateMapState = createDateMapState();
  let finalRevealActive = false;
  let finalRevealTimer = 0;
  let trackNodeMap = new Map();
  let screenFlash = 0;
  let screenShake = 0;
  let coachSeen = Boolean(readStorage(COACH_KEY, false));
  let cachedStageNumber = 1;
  let cachedAvailableTargets = new Set([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15]);
  let renderScale = 1;
  let ballRenderer = null;
  let ballRendererCanvas = null;
  let ballRendererFailed = false;

  function motifForBall(number) {
    const source = content.BALL_DATE_MOTIFS;
    const entry = Array.isArray(source)
      ? source.find((item) => Number(item?.number) === number) ?? source[number - 1]
      : source?.[number];
    if (typeof entry === "string") return entry;
    return entry?.id || entry?.motif || entry?.key || FALLBACK_MOTIFS[number - 1] || "star";
  }

  function createDateMapState() {
    return {
      zones: new Map(DATE_SCENES.map((scene) => [scene.pocketId, {
        ...scene,
        reveal: 0,
        pulse: 0,
        visits: 0,
        motifs: []
      }])),
      routes: [],
      links: [],
      cueStops: [],
      lastPocketId: null,
      activeStreak: 0,
      bestStreak: 0,
      flow: 0,
      stagePulse: 0,
      powerWave: 0,
      completed: false,
      finalProgress: 0,
      ending: null,
      style: { precise: 0, bold: 0, adventurous: 0, playful: 0 }
    };
  }

  function rememberDateMoment(number, detail = {}, options = {}) {
    if (!Number.isInteger(number) || number < 1 || number > 15 || number === 8 && options.ignoreEight) return null;
    if (detail.dateRouteId) {
      return dateMapState.routes.find((route) => route.id === detail.dateRouteId) || null;
    }
    const pocket = POCKETS.find((item) => item.id === detail.pocketId)
      || POCKETS[(number * 5 + runState.shots) % POCKETS.length];
    const scene = DATE_SCENE_BY_POCKET.get(pocket.id) || DATE_SCENES[0];
    const zone = dateMapState.zones.get(scene.pocketId);
    const fallbackStart = dateMapState.cueStops.at(-1) || CUE_SPOT;
    const path = Array.isArray(detail.path) && detail.path.length > 1
      ? detail.path.map((point) => ({ x: point.x, y: point.y }))
      : [
          { x: fallbackStart.x, y: fallbackStart.y },
          { x: (fallbackStart.x + pocket.captureX) / 2, y: (fallbackStart.y + pocket.captureY) / 2 },
          { x: pocket.captureX, y: pocket.captureY }
        ];
    const motif = motifForBall(number);
    const route = {
      id: `date-route-${runState.shots + 1}-${number}-${dateMapState.routes.length}`,
      number,
      physicalNumber: number,
      storyNumber: null,
      motif,
      pocketId: pocket.id,
      sceneId: scene.id,
      color: BALL_COLORS[number] || scene.color,
      path,
      railHits: Number(detail.railHits) || 0,
      jawHits: Number(detail.jawHits) || 0,
      travel: Number(detail.travel) || 0,
      archetype: options.archetype || "direct",
      bornAt: performance.now(),
      glow: 1
    };
    if (detail && typeof detail === "object" && Object.isExtensible(detail)) detail.dateRouteId = route.id;
    dateMapState.routes.push(route);
    if (dateMapState.routes.length > 15) dateMapState.routes.shift();
    if (zone) {
      zone.reveal = clamp(zone.reveal + (zone.visits ? 0.22 : 0.48), 0, 1);
      zone.pulse = 1;
      zone.visits += 1;
      if (!zone.motifs.includes(motif)) zone.motifs.push(motif);
    }
    if (dateMapState.lastPocketId && dateMapState.lastPocketId !== pocket.id) {
      dateMapState.links.push({
        from: dateMapState.lastPocketId,
        to: pocket.id,
        color: scene.color,
        bornAt: performance.now()
      });
      if (dateMapState.links.length > 14) dateMapState.links.shift();
    }
    dateMapState.lastPocketId = pocket.id;
    dateMapState.flow = 1;
    focusBackdropScene(scene, route);
    return route;
  }

  function recordCueStop(completedShot, outcome) {
    const point = completedShot?.cueEnd;
    if (!point || completedShot.cueScratch) return;
    dateMapState.cueStops.push({
      x: point.x,
      y: point.y,
      power: completedShot.launchPower || 0,
      successful: Boolean(outcome?.pottedNumbers?.length),
      bornAt: performance.now()
    });
    if (dateMapState.cueStops.length > 20) dateMapState.cueStops.shift();
  }

  function applyShotStyle(analysis) {
    if (!analysis) return;
    if (["direct", "gentle", "long"].includes(analysis.id)) dateMapState.style.precise += 1;
    if (["power", "multi"].includes(analysis.id)) dateMapState.style.bold += 1;
    if (["bank", "combo"].includes(analysis.id)) dateMapState.style.adventurous += 1;
    if (["rattle", "near"].includes(analysis.id)) dateMapState.style.playful += 1;
    dateMapState.powerWave = analysis.id === "power" ? 1 : dateMapState.powerWave;
  }

  function setDateFlow(streak, paused = false) {
    dateMapState.activeStreak = paused ? 0 : Math.max(0, streak || 0);
    dateMapState.bestStreak = Math.max(dateMapState.bestStreak, streak || 0);
    dateMapState.flow = paused ? 0 : Math.max(dateMapState.flow, streak > 0 ? 1 : 0.28);
    audio.setDateFlow?.(dateMapState.activeStreak, paused);
  }

  function bodyData(body) {
    return body?.plugin?.heartbeatPool || null;
  }

  function ballByNumber(number) {
    return balls.find((ball) => bodyData(ball)?.number === number) || null;
  }

  function isRail(body) {
    return Boolean(body?.plugin?.heartbeatRail);
  }

  function recordRailImpact(ball, rail, collision) {
    const data = bodyData(ball);
    if (!data || data.potted || data.pocketing) return;
    const details = collision?.details || {};
    const incoming = details.incoming || data.preStepVelocity || ball.velocity;
    const outgoing = details.outgoing || ball.velocity;
    const normal = normalize(collision?.normal || {
      x: ball.position.x - rail.position.x,
      y: ball.position.y - rail.position.y
    });
    const material = rail.plugin.heartbeatRail;
    data.lastRailImpact = {
      railId: material.id,
      kind: material.kind,
      model: details.model || "spin-cushion",
      at: simulationTime + FIXED_STEP,
      normalX: normal.x,
      normalY: normal.y,
      incomingX: incoming.x,
      incomingY: incoming.y,
      outgoingX: outgoing.x,
      outgoingY: outgoing.y,
      incomingNormalSpeed: details.incidentSpeed
        ?? Math.abs(incoming.x * normal.x + incoming.y * normal.y),
      outgoingNormalSpeed: details.outgoingNormalSpeed
        ?? Math.abs(outgoing.x * normal.x + outgoing.y * normal.y),
      restitution: details.restitution ?? Physics.CONFIG.cushionRestitutionMin,
      tangentialRetention: details.tangentialRetention ?? 1
    };
  }

  function createRail(x, y, width, height, id, angle = 0, kind = "cushion") {
    const body = Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      label: `hb-rail-${id}`,
      angle,
      restitution: 1,
      friction: 0,
      frictionStatic: 0,
      slop: 0.03
    });
    body.plugin.heartbeatRail = { id, kind, width, height, angle };
    return body;
  }

  function createJaw(start, end, id) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    return createRail(
      (start.x + end.x) / 2,
      (start.y + end.y) / 2,
      length,
      12,
      id,
      Math.atan2(dy, dx),
      "jaw"
    );
  }

  function pocketMouthEndpoint(pocket, side) {
    const tangentX = -pocket.inwardY;
    const tangentY = pocket.inwardX;
    return {
      x: pocket.mouthX + tangentX * pocket.mouth / 2 * side,
      y: pocket.mouthY + tangentY * pocket.mouth / 2 * side
    };
  }

  function createPocketJaw(pocket, side, id) {
    const nose = pocketMouthEndpoint(pocket, side);
    const entryAngle = Math.atan2(pocket.inwardY, pocket.inwardX);
    const heading = entryAngle - side * pocket.jawOffset;
    const end = {
      x: nose.x + Math.cos(heading) * POCKET_JAW_LENGTH,
      y: nose.y + Math.sin(heading) * POCKET_JAW_LENGTH
    };
    const jaw = createJaw(nose, end, id);
    Object.assign(jaw.plugin.heartbeatRail, {
      pocketId: pocket.id,
      pocketType: pocket.type,
      cutAngleDegrees: pocket.cutAngleDegrees,
      headingDegrees: (heading * 180 / Math.PI + 360) % 360,
      mouthSide: side,
      noseX: nose.x,
      noseY: nose.y
    });
    return jaw;
  }

  function buildRails() {
    if (rails.length) Composite.remove(engine.world, rails);
    const mid = WORLD.height / 2;
    const cornerRun = CORNER_POCKET_MOUTH * DIAGONAL;
    const sideHalfMouth = SIDE_POCKET_MOUTH / 2;
    const thickness = 25;
    const horizontalStart = TABLE.left + cornerRun;
    const horizontalEnd = TABLE.right - cornerRun;
    const verticalTopStart = TABLE.top + cornerRun;
    const verticalTopEnd = mid - sideHalfMouth;
    const verticalBottomStart = mid + sideHalfMouth;
    const verticalBottomEnd = TABLE.bottom - cornerRun;
    const topRailY = TABLE.top - thickness / 2;
    const bottomRailY = TABLE.bottom + thickness / 2;
    const leftRailX = TABLE.left - thickness / 2;
    const rightRailX = TABLE.right + thickness / 2;
    const pocket = Object.fromEntries(POCKETS.map((item) => [item.id, item]));
    rails = [
      createRail(WORLD.width / 2, topRailY, horizontalEnd - horizontalStart, thickness, "top"),
      createRail(WORLD.width / 2, bottomRailY, horizontalEnd - horizontalStart, thickness, "bottom"),
      createRail(leftRailX, (verticalTopStart + verticalTopEnd) / 2, thickness, verticalTopEnd - verticalTopStart, "left-top"),
      createRail(leftRailX, (verticalBottomStart + verticalBottomEnd) / 2, thickness, verticalBottomEnd - verticalBottomStart, "left-bottom"),
      createRail(rightRailX, (verticalTopStart + verticalTopEnd) / 2, thickness, verticalTopEnd - verticalTopStart, "right-top"),
      createRail(rightRailX, (verticalBottomStart + verticalBottomEnd) / 2, thickness, verticalBottomEnd - verticalBottomStart, "right-bottom"),

      createPocketJaw(pocket["top-left"], 1, "jaw-top-left-horizontal"),
      createPocketJaw(pocket["top-left"], -1, "jaw-top-left-vertical"),
      createPocketJaw(pocket["top-right"], -1, "jaw-top-right-horizontal"),
      createPocketJaw(pocket["top-right"], 1, "jaw-top-right-vertical"),
      createPocketJaw(pocket["bottom-left"], -1, "jaw-bottom-left-horizontal"),
      createPocketJaw(pocket["bottom-left"], 1, "jaw-bottom-left-vertical"),
      createPocketJaw(pocket["bottom-right"], 1, "jaw-bottom-right-horizontal"),
      createPocketJaw(pocket["bottom-right"], -1, "jaw-bottom-right-vertical"),
      createPocketJaw(pocket["middle-left"], 1, "jaw-middle-left-top"),
      createPocketJaw(pocket["middle-left"], -1, "jaw-middle-left-bottom"),
      createPocketJaw(pocket["middle-right"], -1, "jaw-middle-right-top"),
      createPocketJaw(pocket["middle-right"], 1, "jaw-middle-right-bottom"),

      createRail(WORLD.width / 2, TABLE_OUTER.top - 20, TABLE_OUTER.right - TABLE_OUTER.left + 96, 24, "guard-top", 0, "guard"),
      createRail(WORLD.width / 2, TABLE_OUTER.bottom + 20, TABLE_OUTER.right - TABLE_OUTER.left + 96, 24, "guard-bottom", 0, "guard"),
      createRail(TABLE_OUTER.left - 20, WORLD.height / 2, 24, TABLE_OUTER.bottom - TABLE_OUTER.top + 96, "guard-left", 0, "guard"),
      createRail(TABLE_OUTER.right + 20, WORLD.height / 2, 24, TABLE_OUTER.bottom - TABLE_OUTER.top + 96, "guard-right", 0, "guard")
    ];
    Composite.add(engine.world, rails);
  }

  function createBall(number, x, y) {
    const body = Bodies.circle(x, y, BALL_RADIUS, {
      label: number === 0 ? "hb-cue-ball" : `hb-object-ball-${number}`,
      restitution: Physics.CONFIG.ballRestitution,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      density: 0.0025,
      slop: 0.003,
      sleepThreshold: Infinity
    });
    body.plugin.heartbeatPool = {
      number,
      potted: false,
      shotRailHits: 0,
      shotJawHits: 0,
      shotTravel: 0,
      shotTrail: [],
      pocketMouthEntries: 0,
      pocketing: null,
      pocketApproach: null,
      rollAngle: 0,
      rollVelocity: 0,
      rollHeading: -Math.PI / 2,
      lastPosition: { x, y },
      previousPosition: { x, y },
      preStepVelocity: { x: 0, y: 0 },
      lastSafePosition: { x, y },
      outsideSteps: 0,
      lastRailImpact: null,
      compression: 0,
      impactGlow: 0,
      impactAngle: 0
    };
    Body.setInertia(body, Infinity);
    balls.push(body);
    Composite.add(engine.world, body);
    if (number === 0) cueBall = body;
    return body;
  }

  function clearBalls() {
    balls.slice().forEach((ball) => Composite.remove(engine.world, ball));
    balls = [];
    cueBall = null;
  }

  function rackBalls() {
    clearBalls();
    createBall(0, CUE_SPOT.x, CUE_SPOT.y);
    const spacing = BALL_RADIUS * 2 + 1.3;
    const yStep = spacing * Math.cos(Math.PI / 6);
    RACK.forEach((row, rowIndex) => {
      const y = RACK_APEX.y - rowIndex * yStep;
      row.forEach((number, index) => {
        const x = RACK_APEX.x + (index - rowIndex / 2) * spacing;
        createBall(number, x, y);
      });
    });
  }

  function pointIsOpen(point, radius = BALL_RADIUS) {
    if (point.x < TABLE.left + radius || point.x > TABLE.right - radius
        || point.y < TABLE.top + radius || point.y > TABLE.bottom - radius) return false;
    return balls.every((ball) => bodyData(ball)?.potted || distance(point, ball.position) >= radius + BALL_RADIUS + 2);
  }

  function findOpenSpot(preferred) {
    if (pointIsOpen(preferred)) return preferred;
    const spacing = BALL_RADIUS * 2.6;
    for (let ring = 1; ring <= 14; ring += 1) {
      const samples = Math.max(12, ring * 12);
      for (let index = 0; index < samples; index += 1) {
        const angle = index / samples * Math.PI * 2;
        const point = {
          x: clamp(preferred.x + Math.cos(angle) * spacing * ring, TABLE.left + BALL_RADIUS + 2, TABLE.right - BALL_RADIUS - 2),
          y: clamp(preferred.y + Math.sin(angle) * spacing * ring, TABLE.top + BALL_RADIUS + 2, TABLE.bottom - BALL_RADIUS - 2)
        };
        if (pointIsOpen(point)) return point;
      }
    }
    return { ...CUE_SPOT };
  }

  function respotBall(number) {
    if (ballByNumber(number)) return;
    const preferred = number === 0
      ? CUE_SPOT
      : RACK_APEX;
    const point = findOpenSpot(preferred);
    createBall(number, point.x, point.y);
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

  function resetShotRailHits() {
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (data) {
        data.shotRailHits = 0;
        data.shotJawHits = 0;
        data.shotTravel = 0;
        data.shotTrail = [{ x: ball.position.x, y: ball.position.y }];
        data.pocketMouthEntries = 0;
        data.lastRailImpact = null;
      }
    });
  }

  function resetGame() {
    runState = rules.createRunState();
    selectedBallNumber = null;
    shotState = null;
    pointerAim = null;
    aimDirection = { x: 0, y: -1 };
    aimPower = 0;
    resolvingShot = false;
    cinematicActive = false;
    resultVisible = false;
    accumulator = 0;
    stableSteps = 0;
    simulationTime = 0;
    particles = [];
    pocketBursts = [];
    storyTrails = [];
    collisionFeedbacks = [];
    collisionCount = 0;
    microQueue = [];
    cinematicQueue = [];
    cinematicCurrent = null;
    tableMomentActive = false;
    tableMomentCurrent = null;
    storySlowMotionUntil = 0;
    lastStoryOrigin = { x: 50, y: 50 };
    lastStoryWorldOrigin = { x: WORLD.width / 2, y: WORLD.height / 2 };
    dateMapState = createDateMapState();
    finalRevealActive = false;
    clearTimeout(microTimer);
    clearTimeout(judgementTimer);
    clearTimeout(cinematicTimer);
    clearTimeout(tableMomentTimer);
    clearTimeout(sceneLensTimer);
    clearTimeout(sceneLensStartTimer);
    clearTimeout(finalRevealTimer);
    screenFlash = 0;
    screenShake = 0;
    elements.result.hidden = true;
    elements.cinematic.hidden = true;
    elements.tableMoment.hidden = true;
    elements.pocketFocus.hidden = true;
    elements.sceneLens.classList.remove("is-active");
    elements.micro.hidden = true;
    root.dataset.scene = "night-map";
    root.dataset.motif = "night";
    root.dataset.aimLocked = "false";
    root.style.setProperty("--hb-scene-x", "50%");
    root.style.setProperty("--hb-scene-y", "18%");
    root.style.setProperty("--hb-scene-opacity", "0.12");
    setDateFlow(0, true);
    rackBalls();
    syncUI();
    root.dataset.state = "break";
  }

  function buildTimeline() {
    const fragment = document.createDocumentFragment();
    trackNodeMap = new Map();
    DATE_SCENES.forEach((scene, index) => {
      const item = document.createElement("li");
      item.className = "hb-track-node";
      item.dataset.scene = scene.id;
      const number = document.createElement("i");
      number.textContent = String(index + 1).padStart(2, "0");
      const label = document.createElement("span");
      label.textContent = scene.name;
      item.append(number, label);
      trackNodeMap.set(scene.pocketId, item);
      fragment.append(item);
    });
    elements.trackNodes.replaceChildren(fragment);
  }

  function syncTableStory() {
    const litScenes = [...dateMapState.zones.values()].filter((zone) => zone.visits > 0).length;
    elements.tableStory.dataset.litScenes = String(litScenes);
    elements.tableStory.dataset.flow = String(Math.min(5, dateMapState.activeStreak));
    elements.tableStory.dataset.completed = String(dateMapState.completed);
  }

  function storyOriginForPocket(pocket) {
    const rootRect = root.getBoundingClientRect();
    const tableRect = tableWrap.getBoundingClientRect();
    const rootWidth = Math.max(1, rootRect.width);
    const rootHeight = Math.max(1, rootRect.height);
    return {
      x: clamp((tableRect.left - rootRect.left + pocket.x / WORLD.width * tableRect.width) / rootWidth * 100, 0, 100),
      y: clamp((tableRect.top - rootRect.top + pocket.y / WORLD.height * tableRect.height) / rootHeight * 100, 0, 100)
    };
  }

  function focusBackdropScene(scene, route) {
    if (!scene) return;
    const revealCount = Math.max(1, dateMapState.routes.length);
    const opacity = clamp(0.34 + revealCount * 0.025 + dateMapState.activeStreak * 0.025, 0.34, 0.76);
    root.dataset.scene = scene.id;
    root.dataset.motif = route?.motif || "night";
    root.style.setProperty("--hb-scene-x", `${scene.focusX ?? 50}%`);
    root.style.setProperty("--hb-scene-y", `${scene.focusY ?? 50}%`);
    root.style.setProperty("--hb-scene-color", route?.color || scene.color || "#db91aa");
    root.style.setProperty("--hb-scene-opacity", String(opacity));
  }

  function playSceneLens(scene, route, pocket) {
    if (!scene || !pocket) return;
    const origin = storyOriginForPocket(pocket);
    focusBackdropScene(scene, route);
    root.style.setProperty("--hb-scene-origin-x", `${origin.x}%`);
    root.style.setProperty("--hb-scene-origin-y", `${origin.y}%`);
    clearTimeout(sceneLensTimer);
    elements.sceneLens.dataset.camera = route?.archetype || "direct";
    elements.sceneLens.classList.remove("is-active");
    void elements.sceneLens.offsetWidth;
    elements.sceneLens.classList.add("is-active");
    sceneLensTimer = setTimeout(() => elements.sceneLens.classList.remove("is-active"), 980);
  }

  function beginPocketStoryFocus(pocket, route = null) {
    lastStoryOrigin = storyOriginForPocket(pocket);
    lastStoryWorldOrigin = { x: pocket.x, y: pocket.y };
    const scene = DATE_SCENE_BY_POCKET.get(pocket.id) || DATE_SCENES[0];
    elements.pocketFocus.style.setProperty("--pocket-x", `${pocket.x / WORLD.width * 100}%`);
    elements.pocketFocus.style.setProperty("--pocket-y", `${pocket.y / WORLD.height * 100}%`);
    elements.pocketFocus.hidden = true;
    void elements.pocketFocus.offsetWidth;
    elements.pocketFocus.hidden = false;
    storySlowMotionUntil = performance.now() + POCKET_STORY_SLOW_MOTION_MS;
    clearTimeout(sceneLensStartTimer);
    sceneLensStartTimer = setTimeout(() => playSceneLens(scene, route, pocket), 110);
    setTimeout(() => {
      elements.pocketFocus.hidden = true;
    }, 1080);
  }

  function hideTableMoment() {
    if (!tableMomentActive) return;
    clearTimeout(tableMomentTimer);
    elements.tableMoment.hidden = true;
    tableMomentActive = false;
    tableMomentCurrent = null;
    if (microQueue.length && elements.micro.hidden) showNextMicro();
    else if (cinematicQueue.length && !cinematicActive && elements.micro.hidden) showNextCinematic();
    else if (runState.endState.ended && !cinematicActive && !resultVisible && !finalRevealActive) showResult();
    else if (!shotState && !resolvingShot && !runState.endState.ended) root.dataset.state = "aiming";
  }

  function showTableMoment(story) {
    if (!story) return;
    clearTimeout(tableMomentTimer);
    tableMomentCurrent = story;
    tableMomentActive = true;
    elements.tableMoment.dataset.archetype = story.archetype || "direct";
    elements.tableMoment.dataset.motion = story.visualMode || story.archetype || "straight";
    elements.tableMoment.dataset.scene = story.sceneId || story.stageId || "date-map";
    elements.tableMoment.style.setProperty("--hb-moment-duration", `${story.durationMs || TABLE_MOMENT_DEFAULT_DURATION}ms`);
    elements.tableMomentScene.textContent = story.sceneName || story.scene || story.technique || "约会地图";
    elements.tableMomentTitle.textContent = story.title;
    elements.tableMomentLine.textContent = story.line;
    elements.tableMoment.hidden = true;
    void elements.tableMoment.offsetWidth;
    elements.tableMoment.hidden = false;
    audio.cue(story.archetype === content.SHOT_ARCHETYPES.MULTI ? "streak" : "event", 0.9);
    tableMomentTimer = setTimeout(hideTableMoment, story.durationMs || TABLE_MOMENT_DEFAULT_DURATION);
  }

  function currentStageNumber() {
    return cachedStageNumber;
  }

  function syncUI() {
    const stage = rules.currentStage(runState);
    const progress = rules.stageProgress(runState);
    const interestSignal = rules.interestStatus(runState);
    const stageNumber = stage?.number || 7;
    const targets = rules.availableTargets(runState);
    const litScenes = [...dateMapState.zones.values()].filter((zone) => zone.visits > 0).length;
    const lastScene = DATE_SCENE_BY_POCKET.get(dateMapState.lastPocketId);
    cachedStageNumber = stageNumber;
    cachedAvailableTargets = new Set(targets);
    root.dataset.stage = String(stageNumber);
    elements.stageKicker.textContent = runState.endState.ended
      ? "DATE MAP · 今晚完整显影"
      : `DATE MAP · ${String(runState.pottedNumbers.length).padStart(2, "0")} / 15 笔`;
    elements.stageTitle.textContent = progress?.target === "eight"
      ? "整座夜城，只等最后一笔"
      : lastScene ? `${lastScene.name}正在亮起` : "桌布下藏着一场尚未发生的约会";
    elements.stageTargets.textContent = progress
      ? progress.target === "eight"
        ? "黑 8 将连接整晚留下的全部路线"
        : `任意非黑 8 彩球都能继续显影，还剩 ${15 - runState.pottedNumbers.length} 颗`
      : "所有路线已经回到同一盏灯下";
    const flowLabels = dateMapState.activeStreak >= 5
      ? ["流动", 1]
      : dateMapState.activeStreak >= 3 ? ["鲜活", 0.84]
        : dateMapState.activeStreak >= 1 ? ["亮起", 0.68]
          : runState.consecutiveMisses > 0 ? ["驻足", 0.46] : ["未醒", 0.32];
    elements.interest.textContent = flowLabels[0];
    elements.interestWrap.setAttribute("aria-label", `夜色状态：${flowLabels[0]}`);
    elements.interestWrap.dataset.signal = interestSignal.band;
    elements.interestWrap.classList.toggle("is-low", false);
    elements.interestRing.style.strokeDashoffset = String(113.1 * (1 - flowLabels[1]));
    elements.shots.textContent = String(runState.shots);
    elements.streak.textContent = String(runState.potStreak);
    elements.trackProgress.style.width = `${runState.pottedNumbers.length / 15 * 100}%`;
    trackNodeMap.forEach((node, pocketId) => {
      const zone = dateMapState.zones.get(pocketId);
      node.classList.toggle("is-complete", Boolean(zone?.visits));
      node.classList.toggle("is-current", pocketId === dateMapState.lastPocketId);
      node.classList.toggle("is-danger", false);
    });
    if (!runState.breakCompleted) {
      elements.selectedBall.textContent = "—";
      elements.selectedName.textContent = "今晚尚未落笔";
      elements.callLabel.textContent = "开球";
      elements.callTitle.textContent = "第一杆会唤醒整张地图";
      elements.callHint.textContent = "桌面任意位置向后滑动，松开完成开球";
    } else {
      selectedBallNumber = null;
      elements.selectedBall.textContent = progress?.target === "eight" ? "8" : String(Math.max(0, 15 - runState.pottedNumbers.length));
      elements.selectedName.textContent = progress?.target === "eight" ? "最后一笔 · 黑 8" : `${litScenes} / 6 处夜景已亮`;
      elements.callLabel.textContent = dateMapState.activeStreak > 0 ? `夜色流动 · ${dateMapState.activeStreak}` : "夜色未停";
      elements.callTitle.textContent = progress?.target === "eight"
        ? "整晚的灯光正在等最后一笔"
        : lastScene ? `${lastScene.name}的灯还亮着` : "这场夜游才刚刚开始";
      elements.callHint.textContent = dateMapState.activeStreak >= 3
        ? "两个人影沿着连起的灯光继续向前"
        : lastScene ? "短暂驻足后，他们又看向下一段路" : "第一盏灯正藏在桌布下面";
    }
    elements.aimToggle.setAttribute("aria-pressed", String(aimAssist));
    elements.aimToggle.setAttribute("aria-label", aimAssist ? "关闭瞄准辅助" : "开启瞄准辅助");
    elements.sound.setAttribute("aria-pressed", String(audio.enabled));
    elements.sound.setAttribute("aria-label", audio.enabled ? "关闭声音" : "开启声音");
    audio.setStage(stageNumber);
    if (lastScene) focusBackdropScene(lastScene, dateMapState.routes.at(-1));
    syncTableStory();
  }

  function nearestObjectBall(point, radius = 36) {
    let nearest = null;
    let nearestDistance = radius;
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (!data || data.number === 0 || data.potted) return;
      const candidate = distance(point, ball.position);
      if (candidate <= nearestDistance) {
        nearest = ball;
        nearestDistance = candidate;
      }
    });
    return nearest;
  }

  function clientPointToWorld(clientX, clientY, rect = canvas.getBoundingClientRect()) {
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const displayX = clamp((clientX - rect.left) / width, 0, 1);
    const displayY = clamp((clientY - rect.top) / height, 0, 1);
    return {
      x: displayX * WORLD.width,
      y: displayY * WORLD.height
    };
  }

  function pointerToWorld(event) {
    return clientPointToWorld(event.clientX, event.clientY);
  }

  function canInteract() {
    return !shotState && !pointerAim && !resolvingShot
      && !cinematicActive && !cinematicQueue.length
      && !resultVisible && !runState.endState.ended && cueBall;
  }

  function selectTarget(number) {
    if (!runState.breakCompleted || runState.pottedNumbers.includes(number)) return;
    const target = ballByNumber(number);
    if (target && cueBall) aimDirection = normalize({ x: target.position.x - cueBall.position.x, y: target.position.y - cueBall.position.y });
    hideCoach();
  }

  function hideCoach() {
    if (coachSeen) return;
    coachSeen = true;
    elements.coach.classList.add("is-gone");
    writeStorage(COACH_KEY, true);
  }

  function beginAim(event, point) {
    if (!cueBall) return;
    const now = performance.now();
    pointerAim = {
      id: event.pointerId,
      start: { ...point },
      current: point,
      direction: { ...aimDirection },
      directionAnchor: { ...aimDirection },
      lockedDirection: null,
      directionChangedAt: now,
      lockedAt: 0,
      pullRatio: 0,
      power: 0
    };
    root.dataset.aimLocked = "false";
    canvas.setPointerCapture?.(event.pointerId);
    canvas.setAttribute("aria-label", "正在调整击球力度：轻推");
    elements.call.classList.add("is-quiet");
    hideCoach();
  }

  function refreshAimLock(now = performance.now()) {
    if (!pointerAim || pointerAim.lockedDirection || pointerAim.pullRatio < AIM_LOCK_MIN_PULL_RATIO) {
      return Boolean(pointerAim?.lockedDirection);
    }
    if (now - pointerAim.directionChangedAt < AIM_LOCK_DELAY_MS) return false;
    pointerAim.lockedDirection = { ...pointerAim.directionAnchor };
    pointerAim.direction = { ...pointerAim.lockedDirection };
    pointerAim.lockedAt = now;
    root.dataset.aimLocked = "true";
    if (typeof navigator !== "undefined") navigator.vibrate?.(8);
    return true;
  }

  function updateAim(point, options = {}) {
    if (!pointerAim || !cueBall) return;
    pointerAim.current = point;
    const pull = {
      x: pointerAim.start.x - point.x,
      y: pointerAim.start.y - point.y
    };
    const pullDistance = Math.hypot(pull.x, pull.y);
    if (pullDistance > 5) {
      const candidate = normalize(pull, pointerAim.directionAnchor);
      const now = performance.now();
      if (pointerAim.lockedDirection) {
        const lockedDelta = directionAngle(candidate, pointerAim.lockedDirection);
        if (!options.release && lockedDelta > AIM_LOCK_BREAK_ANGLE) {
          pointerAim.lockedDirection = null;
          pointerAim.lockedAt = 0;
          pointerAim.direction = candidate;
          pointerAim.directionAnchor = { ...candidate };
          pointerAim.directionChangedAt = now;
          root.dataset.aimLocked = "false";
        } else {
          pointerAim.direction = { ...pointerAim.lockedDirection };
        }
      } else {
        const directionDelta = directionAngle(candidate, pointerAim.directionAnchor);
        if (directionDelta > AIM_LOCK_DIRECTION_EPSILON) {
          pointerAim.directionAnchor = { ...candidate };
          pointerAim.directionChangedAt = now;
        }
        pointerAim.direction = { ...pointerAim.directionAnchor };
      }
    }
    pointerAim.pullRatio = clamp((pullDistance - MIN_PULL) / (MAX_PULL - MIN_PULL), 0, 1);
    pointerAim.power = powerFromPullRatio(pointerAim.pullRatio);
    refreshAimLock();
    aimDirection = { ...pointerAim.direction };
    aimPower = pointerAim.power;
    const powerLabel = pointerAim.pullRatio < LIGHT_PULL_END
      ? "轻推"
      : pointerAim.pullRatio < STRONG_PULL_START ? "适中" : pointerAim.pullRatio < 0.96 ? "强力" : "满力";
    canvas.setAttribute("aria-label", `正在调整击球力度：${powerLabel}`);
  }

  function cancelAim() {
    pointerAim = null;
    aimPower = 0;
    root.dataset.aimLocked = "false";
    canvas.setAttribute("aria-label", "在桌面任意位置反向滑动瞄准蓄力，松开击球");
    elements.call.classList.remove("is-quiet");
  }

  function releaseAim(event, shouldShoot) {
    if (!pointerAim || event.pointerId !== pointerAim.id) return;
    refreshAimLock();
    const power = pointerAim.power;
    const direction = { ...(pointerAim.lockedDirection || pointerAim.direction) };
    canvas.releasePointerCapture?.(event.pointerId);
    cancelAim();
    if (shouldShoot && power > 0.015) shoot(direction, power);
  }

  function shoot(direction, power) {
    if (!canInteract()) return false;
    aimDirection = { ...direction };
    const speed = MIN_SHOT_SPEED + clamp(power, 0, 1) * (MAX_SHOT_SPEED - MIN_SHOT_SPEED);
    resetShotRailHits();
    shotState = {
      declaredBall: null,
      firstContact: null,
      pottedNumbers: [],
      cueScratch: false,
      breakShot: !runState.breakCompleted,
      bankedNumbers: [],
      pottedDetails: [],
      objectContactPairs: new Set(),
      objectContacts: 0,
      closestPocketDistance: Infinity,
      launchPower: clamp(power, 0, 1),
      launchSpeed: speed,
      launchDirection: { ...direction },
      storyFocusNumber: null,
      storyShown: false,
      dateRouteIds: [],
      startedAt: simulationTime
    };
    Body.strike(cueBall, { x: direction.x * speed, y: direction.y * speed });
    stableSteps = 0;
    root.dataset.state = "rolling";
    elements.call.classList.add("is-quiet");
    audio.cue("strike", 0.75 + power * 0.5);
    screenShake = Math.max(screenShake, power * 2.2);
    return true;
  }

  function pocketDepth(pocket, point) {
    return (point.x - pocket.mouthX) * pocket.inwardX + (point.y - pocket.mouthY) * pocket.inwardY;
  }

  function pocketLateral(pocket, point) {
    const tangentX = -pocket.inwardY;
    const tangentY = pocket.inwardX;
    return (point.x - pocket.mouthX) * tangentX + (point.y - pocket.mouthY) * tangentY;
  }

  function crossedPocketLine(body, pocket, lineDepth, halfWidth, depthTolerance = 0, lateralTolerance = 0) {
    const data = bodyData(body);
    const previous = data?.previousPosition;
    if (!previous) return null;
    const previousDepth = pocketDepth(pocket, previous) - lineDepth;
    const currentDepth = pocketDepth(pocket, body.position) - lineDepth;
    if (previousDepth > depthTolerance
        || currentDepth < -depthTolerance
        || currentDepth - previousDepth < 1e-7) return null;
    const crossingProgress = clamp(-previousDepth / (currentDepth - previousDepth), 0, 1);
    const crossingX = previous.x + (body.position.x - previous.x) * crossingProgress;
    const crossingY = previous.y + (body.position.y - previous.y) * crossingProgress;
    const lateral = pocketLateral(pocket, { x: crossingX, y: crossingY });
    return Math.abs(lateral) <= halfWidth + lateralTolerance
      ? { x: crossingX, y: crossingY, lateral }
      : null;
  }

  function inwardPocketSpeed(body, pocket) {
    return body.velocity.x * pocket.inwardX + body.velocity.y * pocket.inwardY;
  }

  function enterPocketMouth(body, pocket) {
    const data = bodyData(body);
    if (!data || inwardPocketSpeed(body, pocket) <= POCKET_MIN_INWARD_SPEED) return false;
    const mouthCrossing = crossedPocketLine(
      body,
      pocket,
      0,
      pocket.mouth / 2,
      POCKET_MOUTH_DEPTH_TOLERANCE,
      POCKET_MOUTH_LATERAL_TOLERANCE
    );
    if (!mouthCrossing) return false;
    data.pocketMouthEntries += 1;
    const captureCrossing = crossedPocketLine(
      body,
      pocket,
      pocket.captureDepth,
      pocket.captureHalfWidth,
      POCKET_SHELF_DEPTH_TOLERANCE,
      POCKET_SHELF_LATERAL_TOLERANCE
    );
    data.pocketApproach = {
      pocketId: pocket.id,
      enteredAt: simulationTime,
      mouthCrossX: mouthCrossing.x,
      mouthCrossY: mouthCrossing.y,
      captureCrossed: Boolean(captureCrossing),
      captureCrossX: captureCrossing?.x ?? null,
      captureCrossY: captureCrossing?.y ?? null,
      maximumDepth: pocketDepth(pocket, body.position)
    };
    return true;
  }

  function advancePocketApproach(body, pocket) {
    const data = bodyData(body);
    const approach = data?.pocketApproach;
    if (!approach || approach.pocketId !== pocket.id) return false;
    const currentDepth = pocketDepth(pocket, body.position);
    const currentLateral = Math.abs(pocketLateral(pocket, body.position));
    approach.maximumDepth = Math.max(approach.maximumDepth ?? currentDepth, currentDepth);
    if (currentDepth < -POCKET_APPROACH_EXIT_DEPTH || currentLateral > pocket.mouth / 2 + BALL_RADIUS) {
      data.pocketApproach = null;
      return false;
    }
    if (!approach.captureCrossed) {
      const captureCrossing = crossedPocketLine(
        body,
        pocket,
        pocket.captureDepth,
        pocket.captureHalfWidth,
        POCKET_SHELF_DEPTH_TOLERANCE,
        POCKET_SHELF_LATERAL_TOLERANCE
      );
      if (captureCrossing) {
        approach.captureCrossed = true;
        approach.captureCrossX = captureCrossing.x;
        approach.captureCrossY = captureCrossing.y;
      }
      const settledOverLip = body.speed <= NATURAL_STOP_SPEED
        && approach.maximumDepth >= pocket.captureDepth * POCKET_LIP_SETTLE_RATIO
        && currentLateral <= pocket.captureHalfWidth + POCKET_SHELF_LATERAL_TOLERANCE;
      if (settledOverLip) {
        approach.captureCrossed = true;
        approach.settledOverLip = true;
        approach.captureCrossX = body.position.x;
        approach.captureCrossY = body.position.y;
      }
    }
    const requiredDepth = approach.settledOverLip
      ? pocket.captureDepth * POCKET_LIP_SETTLE_RATIO
      : pocket.captureDepth - POCKET_SHELF_DEPTH_TOLERANCE;
    return approach.captureCrossed
      && approach.enteredAt < simulationTime
      && approach.maximumDepth >= requiredDepth;
  }

  function pocketBall(body, pocket) {
    const data = bodyData(body);
    if (!shotState || !data || data.potted || data.pocketing) return false;
    const speed = body.speed;
    const durationRange = POCKET_MAX_DURATION - POCKET_MIN_DURATION + 1;
    const duration = POCKET_MIN_DURATION + ((data.number * 47 + Math.round(speed * 17)) % durationRange);
    data.pocketing = {
      pocketId: pocket.id,
      targetX: pocket.x,
      targetY: pocket.y,
      startX: body.position.x,
      startY: body.position.y,
      startAngle: data.rollAngle,
      startSpeed: speed,
      elapsed: 0,
      duration,
      scale: 1,
      depth: 0,
      rotation: data.rollAngle
    };
    data.pocketApproach = null;
    body.isSensor = true;
    body.collisionFilter.mask = 0;
    Body.setVelocity(body, { x: 0, y: 0 });
    Body.setAngularVelocity(body, 0);
    data.lastPosition = { x: body.position.x, y: body.position.y };
    if (data.number > 0) {
      const path = data.shotTrail.slice(-48).map((point) => ({ ...point }));
      path.push({ x: pocket.captureX, y: pocket.captureY });
      const detail = {
        number: data.number,
        enteredOrder: shotState.pottedDetails.length,
        pocketId: pocket.id,
        pocketX: pocket.x,
        pocketY: pocket.y,
        entrySpeed: speed,
        railHits: data.shotRailHits,
        jawHits: data.shotJawHits,
        mouthEntries: data.pocketMouthEntries,
        travel: data.shotTravel,
        path
      };
      shotState.pottedDetails.push(detail);
      const pocketAnalysis = content.analyzeShot({
        pottedNumbers: [data.number],
        pottedDetails: [detail],
        bankedNumbers: data.shotRailHits > 0 ? [data.number] : [],
        launchPower: shotState.launchPower,
        objectContacts: shotState.objectContacts
      });
      const dateRoute = rememberDateMoment(data.number, detail, { archetype: pocketAnalysis.id });
      if (dateRoute) shotState.dateRouteIds.push(dateRoute.id);
      storyTrails.push({
        number: data.number,
        path,
        color: BALL_COLORS[data.number] || "#e6c88c",
        life: 1,
        railHits: data.shotRailHits
      });
      if (storyTrails.length > 4) storyTrails.shift();
      if (shotState.storyFocusNumber === null) {
        shotState.storyFocusNumber = data.number;
        beginPocketStoryFocus(pocket, dateRoute);
      }
    }
    audio.cue(data.number === 0 ? "scratch" : "pocket", clamp(0.72 + speed / 30, 0.7, 1.15));
    screenFlash = Math.max(screenFlash, data.number === 8 || data.number === 15 ? 0.36 : 0.12);
    return true;
  }

  function completePocketBall(body) {
    const data = bodyData(body);
    if (!data || data.potted || !data.pocketing) return;
    const pocketing = data.pocketing;
    const number = data.number;
    if (shotState) {
      if (number === 0) {
        shotState.cueScratch = true;
      } else if (!shotState.pottedNumbers.includes(number)) {
        shotState.pottedNumbers.push(number);
        if (data.shotRailHits > 0) shotState.bankedNumbers.push(number);
        beginCompletedPocketStory(number);
      }
    }
    const color = number === 0 ? "#f5f0e7" : BALL_COLORS[number];
    pocketBursts.push({ x: pocketing.targetX, y: pocketing.targetY, color, life: 1, number });
    spawnParticles(pocketing.targetX, pocketing.targetY, number === 0 ? "#e6eee9" : color, number === 0 ? 7 : 12);
    removeBall(body);
  }

  function updatePocketing() {
    balls.slice().forEach((ball) => {
      const data = bodyData(ball);
      const state = data?.pocketing;
      if (!state || data.potted) return;
      state.elapsed = Math.min(state.duration, state.elapsed + FIXED_STEP);
      const progress = clamp(state.elapsed / state.duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const dx = state.targetX - state.startX;
      const dy = state.targetY - state.startY;
      const pathLength = Math.max(1, Math.hypot(dx, dy));
      const curl = Math.sin(progress * Math.PI) * 7 * (data.number % 2 ? 1 : -1);
      Body.setPosition(ball, {
        x: state.startX + dx * eased - dy / pathLength * curl,
        y: state.startY + dy * eased + dx / pathLength * curl
      });
      state.scale = 1 - eased * 0.82;
      state.depth = eased;
      state.rotation = state.startAngle + eased * (Math.PI * 2.4 + state.startSpeed * 0.16);
      data.rollAngle = state.rotation;
      data.rollVelocity = (Math.PI * 2.4 + state.startSpeed * 0.16) / (state.duration / 1000);
      data.lastPosition = { x: ball.position.x, y: ball.position.y };
      if (progress >= 1) completePocketBall(ball);
    });
  }

  function updateRollingState() {
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (!data || data.potted || data.pocketing) return;
      const dx = ball.position.x - data.lastPosition.x;
      const dy = ball.position.y - data.lastPosition.y;
      const travel = Math.hypot(dx, dy);
      data.lastPosition = { x: ball.position.x, y: ball.position.y };
      if (shotState && data.number > 0) {
        data.shotTravel += travel;
        const lastTrailPoint = data.shotTrail[data.shotTrail.length - 1];
        if (!lastTrailPoint || Math.hypot(ball.position.x - lastTrailPoint.x, ball.position.y - lastTrailPoint.y) >= 8) {
          data.shotTrail.push({ x: ball.position.x, y: ball.position.y });
          if (data.shotTrail.length > 64) data.shotTrail.shift();
        }
        const pocketDistance = POCKETS.reduce((minimum, pocket) => Math.min(
          minimum,
          Math.hypot(ball.position.x - pocket.mouthX, ball.position.y - pocket.mouthY)
        ), Infinity);
        shotState.closestPocketDistance = Math.min(shotState.closestPocketDistance, pocketDistance);
      }
      if (ball.physics) {
        data.rollAngle = ball.physics.rollAngle;
        data.rollVelocity = ball.physics.rollSpeed;
        data.rollHeading = ball.physics.rollHeading;
        return;
      }
      if (travel > 0.0001) {
        const sign = Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : Math.sign(dy);
        const angleDelta = travel / BALL_RADIUS * (sign || 1);
        data.rollAngle += angleDelta;
        data.rollVelocity = angleDelta / (FIXED_STEP / 1000);
        data.rollHeading = Math.atan2(dy, dx);
      } else {
        data.rollVelocity *= 0.78;
        if (Math.abs(data.rollVelocity) < 0.002) data.rollVelocity = 0;
      }
    });
  }

  function captureBallPositions() {
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (!data || data.potted || data.pocketing) return;
      data.previousPosition = { x: ball.position.x, y: ball.position.y };
      data.preStepVelocity = { x: ball.velocity.x, y: ball.velocity.y };
    });
  }

  function updatePockets() {
    if (!shotState) return;
    balls.slice().forEach((ball) => {
      const data = bodyData(ball);
      if (!data || data.potted || data.pocketing) return;
      const activePocket = data.pocketApproach
        ? POCKETS.find((pocket) => pocket.id === data.pocketApproach.pocketId)
        : null;
      if (activePocket) {
        if (advancePocketApproach(ball, activePocket)) pocketBall(ball, activePocket);
        if (data.pocketApproach || data.pocketing) return;
      }
      for (const pocket of POCKETS) {
        if (enterPocketMouth(ball, pocket)) break;
      }
    });
  }

  function containLooseBalls() {
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (!data || data.potted || data.pocketing) return;
      const position = ball.position;
      const finite = Number.isFinite(position.x) && Number.isFinite(position.y)
        && Number.isFinite(ball.velocity.x) && Number.isFinite(ball.velocity.y);
      const escaped = !finite
        || position.x < TABLE_OUTER.left - BALL_RADIUS
        || position.x > TABLE_OUTER.right + BALL_RADIUS
        || position.y < TABLE_OUTER.top - BALL_RADIUS
        || position.y > TABLE_OUTER.bottom + BALL_RADIUS;
      if (escaped) {
        const safe = data.lastSafePosition || CUE_SPOT;
        Body.setPosition(ball, safe);
        Body.setVelocity(ball, finite
          ? { x: -ball.velocity.x * 0.32, y: -ball.velocity.y * 0.32 }
          : { x: 0, y: 0 });
        data.previousPosition = { ...safe };
        data.lastPosition = { ...safe };
        data.pocketApproach = null;
        data.outsideSteps = 0;
        return;
      }
      if (data.pocketApproach) {
        data.outsideSteps = ball.speed < NATURAL_STOP_SPEED ? data.outsideSteps + 1 : 0;
        if (data.outsideSteps > 45) {
          const safe = data.lastSafePosition || CUE_SPOT;
          Body.setPosition(ball, safe);
          Body.setVelocity(ball, { x: 0, y: 0 });
          data.previousPosition = { ...safe };
          data.lastPosition = { ...safe };
          data.pocketApproach = null;
          data.outsideSteps = 0;
        }
        return;
      }
      const safelyOnCloth = position.x >= TABLE.left + BALL_RADIUS
        && position.x <= TABLE.right - BALL_RADIUS
        && position.y >= TABLE.top + BALL_RADIUS
        && position.y <= TABLE.bottom - BALL_RADIUS;
      if (safelyOnCloth) {
        data.lastSafePosition = { x: position.x, y: position.y };
        data.outsideSteps = 0;
        return;
      }
      const beyondCushionNose = position.x < TABLE.left - BALL_RADIUS * 0.25
        || position.x > TABLE.right + BALL_RADIUS * 0.25
        || position.y < TABLE.top - BALL_RADIUS * 0.25
        || position.y > TABLE.bottom + BALL_RADIUS * 0.25;
      data.outsideSteps = beyondCushionNose && ball.speed < NATURAL_STOP_SPEED
        ? data.outsideSteps + 1
        : 0;
      if (data.outsideSteps > 45) {
        const safe = data.lastSafePosition || CUE_SPOT;
        Body.setPosition(ball, safe);
        Body.setVelocity(ball, { x: 0, y: 0 });
        data.previousPosition = { ...safe };
        data.lastPosition = { ...safe };
        data.pocketApproach = null;
        data.outsideSteps = 0;
      }
    });
  }

  function settleBalls() {
    let moving = false;
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (data?.pocketing) {
        moving = true;
        return;
      }
      if (ball.speed < STOP_SPEED) {
        Body.setVelocity(ball, { x: 0, y: 0 });
        Body.setAngularVelocity(ball, 0);
        if (data) data.rollVelocity *= 0.7;
      } else {
        moving = true;
        if (ball.speed > MAX_SHOT_SPEED * 1.3) {
          const scale = MAX_SHOT_SPEED * 1.3 / ball.speed;
          Body.setVelocity(ball, { x: ball.velocity.x * scale, y: ball.velocity.y * scale });
        }
      }
    });
    if (shotState) stableSteps = moving ? 0 : stableSteps + 1;
    if (shotState && stableSteps >= 22 && !resolvingShot) finalizeShot();
  }

  function showJudgement(copy) {
    clearTimeout(judgementTimer);
    elements.judgement.textContent = copy;
    elements.judgement.classList.remove("is-visible");
    void elements.judgement.offsetWidth;
    elements.judgement.classList.add("is-visible");
    judgementTimer = setTimeout(() => elements.judgement.classList.remove("is-visible"), 1250);
  }

  function storyNumberForUpcomingPot(number) {
    if (number === 8) return 8;
    const ordinaryPots = runState.pottedNumbers.filter((potted) => potted !== 8).length;
    return clamp(ordinaryPots + 1, 1, 15);
  }

  function analyzeCompletedShot(completedShot, outcome = null) {
    const pottedNumbers = outcome?.pottedNumbers || completedShot?.pottedNumbers || [];
    const cueScratch = outcome?.cueScratch ?? completedShot?.cueScratch ?? false;
    return content.analyzeShot({
      pottedNumbers,
      pottedDetails: completedShot?.pottedDetails || [],
      bankedNumbers: outcome?.shot?.bankedNumbers || completedShot?.bankedNumbers || [],
      cueScratch,
      launchPower: completedShot?.launchPower,
      objectContacts: completedShot?.objectContacts,
      nearMiss: pottedNumbers.length === 0
        && Number.isFinite(completedShot?.closestPocketDistance)
        && completedShot.closestPocketDistance <= POCKET_RADIUS + BALL_RADIUS * 1.15
    });
  }

  function createShotStory(completedShot, outcome = null, preferredNumber = null) {
    const pottedEvents = outcome?.pocketEvents || [];
    const physicalNumbers = outcome?.pottedNumbers || completedShot?.pottedNumbers || [];
    const physicalNumber = preferredNumber
      ?? pottedEvents.find((event) => event.number !== 8)?.number
      ?? physicalNumbers.find((number) => number !== 8)
      ?? null;
    if (physicalNumber === null || physicalNumber === 8) return null;
    const matchingEvent = pottedEvents.find((event) => event.number === physicalNumber);
    const storyNumber = matchingEvent?.storyNumber ?? physicalNumber;
    const stageNumber = matchingEvent?.stageIndex !== undefined
      ? matchingEvent.stageIndex + 1
      : currentStageNumber();
    const physicalDetail = completedShot?.pottedDetails?.find((detail) => detail.number === physicalNumber) || null;
    const performance = content.selectPerformance({
      ballNumber: storyNumber,
      intent: content.INTENTS.ACTIVE,
      timing: content.TIMINGS.RIGHT,
      seed: (runState.shots + 1) * 31 + physicalNumber * 7 + Math.round((completedShot?.launchPower || 0.5) * 100)
    });
    const analysis = analyzeCompletedShot(completedShot, outcome);
    const route = physicalDetail?.dateRouteId
      ? dateMapState.routes.find((item) => item.id === physicalDetail.dateRouteId)
      : null;
    if (route) route.archetype = analysis.id;
    return content.selectShotStory({
      stage: stageNumber,
      storyNumber,
      ballNumber: physicalNumber,
      pocketId: physicalDetail?.pocketId,
      archetype: analysis.id,
      analysis,
      performance,
      seed: (runState.shots + 1) * 31 + physicalNumber * 7
    });
  }

  function updateVisibleTableMoment(story) {
    if (!tableMomentActive || !story) return;
    tableMomentCurrent = story;
    elements.tableMoment.dataset.archetype = story.archetype;
    elements.tableMoment.dataset.motion = story.visualMode || story.archetype || "straight";
    elements.tableMoment.dataset.scene = story.sceneId || story.stageId || "date-map";
    elements.tableMomentScene.textContent = story.sceneName || story.scene || story.technique;
    elements.tableMomentTitle.textContent = story.title;
    elements.tableMomentLine.textContent = story.line;
  }

  function beginCompletedPocketStory(number) {
    if (!shotState || shotState.storyShown || number === 8 || shotState.storyFocusNumber !== number) return;
    const story = createShotStory(shotState, null, number);
    if (!story) return;
    shotState.storyShown = true;
    shotState.story = story;
    showTableMoment(story);
  }

  function queueMicro(item) {
    microQueue.push(item);
    if (elements.micro.hidden) showNextMicro();
  }

  function showNextMicro() {
    if (!microQueue.length) {
      elements.micro.hidden = true;
      if (cinematicQueue.length && !cinematicActive) showNextCinematic();
      else if (runState.endState.ended && !cinematicActive && !resultVisible) showResult();
      return;
    }
    const item = microQueue.shift();
    clearTimeout(microTimer);
    markViewed(item.id);
    elements.micro.dataset.type = item.type || "pocket";
    elements.microKicker.textContent = item.kicker;
    elements.microTitle.textContent = item.title;
    elements.microLine.textContent = item.line;
    elements.micro.hidden = false;
    void elements.micro.offsetWidth;
    audio.cue(item.sound || "event", item.intensity || 1);
    microTimer = setTimeout(() => {
      elements.micro.hidden = true;
      setTimeout(showNextMicro, 70);
    }, clamp(item.durationMs + 900, 2200, 2900));
  }

  function queueStageMicro(stageNumber, eventType, seed, trend) {
    const performance = content.selectStageEvent({ stage: stageNumber, eventType, seed });
    queueMicro({
      id: performance.id,
      type: eventType,
      kicker: performance.kicker,
      title: performance.title,
      line: `${performance.visual} ${performance.line}${trend ? ` ${trend.line}` : ""}`,
      durationMs: performance.durationMs,
      sound: eventType === content.STAGE_EVENT_TYPES.SCRATCH
        ? "warning"
        : eventType === content.STAGE_EVENT_TYPES.MISS ? "miss" : "event",
      intensity: eventType === content.STAGE_EVENT_TYPES.SCRATCH ? 0.9 : 0.72
    });
  }

  function queueCinematic(item) {
    cinematicQueue.push(item);
    if (!cinematicActive && elements.micro.hidden && !microQueue.length) showNextCinematic();
  }

  function showNextCinematic() {
    if (!elements.micro.hidden || microQueue.length) return;
    if (!cinematicQueue.length) {
      cinematicActive = false;
      cinematicCurrent = null;
      elements.cinematic.hidden = true;
      if (runState.endState.ended && !resultVisible) showResult();
      return;
    }
    cinematicCurrent = cinematicQueue.shift();
    cinematicActive = true;
    root.dataset.state = "cinematic";
    markViewed(cinematicCurrent.id);
    elements.cinematic.dataset.kind = cinematicCurrent.kind || "stage";
    elements.cinematic.dataset.scene = cinematicCurrent.stageId || "ending";
    elements.cinematic.style.setProperty("--hb-cinematic-origin-x", `${lastStoryOrigin.x}%`);
    elements.cinematic.style.setProperty("--hb-cinematic-origin-y", `${lastStoryOrigin.y}%`);
    elements.cinematicImage.style.backgroundImage = cinematicCurrent.image
      ? `url("${cinematicCurrent.image}")`
      : "";
    elements.cinematicKicker.textContent = cinematicCurrent.kicker;
    elements.cinematicTitle.textContent = cinematicCurrent.title;
    elements.cinematicLine.textContent = cinematicCurrent.line;
    elements.cinematicAction.hidden = !cinematicCurrent.actionLabel;
    elements.cinematicAction.textContent = cinematicCurrent.actionLabel || "继续";
    elements.cinematic.hidden = false;
    audio.cue(cinematicCurrent.sound || "stage");
    clearTimeout(cinematicTimer);
    if (cinematicCurrent.autoCloseMs) {
      cinematicTimer = setTimeout(closeCinematic, cinematicCurrent.autoCloseMs);
    }
  }

  function closeCinematic() {
    if (!cinematicActive) return;
    clearTimeout(cinematicTimer);
    const completed = cinematicCurrent;
    elements.cinematic.hidden = true;
    cinematicActive = false;
    cinematicCurrent = null;
    completed?.onClose?.();
    if (cinematicQueue.length) setTimeout(showNextCinematic, 70);
    else if (runState.endState.ended && elements.micro.hidden && !microQueue.length && !resultVisible && !finalRevealActive) showResult();
    else root.dataset.state = "aiming";
  }

  function scheduleResultAfterTable(delayMs) {
    finalRevealActive = true;
    clearTimeout(finalRevealTimer);
    finalRevealTimer = setTimeout(() => {
      finalRevealActive = false;
      hideTableMoment();
      if (!resultVisible) showResult();
    }, delayMs);
  }

  function beginFinalDateMapReveal(outcome) {
    const early = Boolean(outcome.earlyEight);
    const success = outcome.state.endState.status === "completed";
    dateMapState.completed = success;
    dateMapState.ending = success ? "complete" : "reckless";
    dateMapState.finalProgress = 0.001;
    dateMapState.stagePulse = 1;
    setDateFlow(success ? Math.max(5, outcome.state.bestPotStreak) : 0, !success);
    root.dataset.state = "map-finale";
    screenFlash = Math.max(screenFlash, success ? 0.46 : 0.16);
    showTableMoment({
      id: `date-map-${success ? "complete" : "interrupted"}-${outcome.state.shots}`,
      archetype: success ? "multi" : "near",
      motion: success ? "city-unite" : "city-pause",
      sceneId: success ? "whole-night" : "crossroads",
      sceneName: success ? "整张约会地图" : "夜路提前转弯",
      title: success
        ? early ? "这条意外的近路，也被她接住了" : "今晚所有走过的路，终于连在一起"
        : "最后的答案来得太早",
      line: success
        ? "六处灯光沿着你的真实球路依次亮起，两个人影从街角走到了同一条归途。"
        : "城市没有熄灭，只是两个人在这个路口选择了不同方向。",
      durationMs: success ? 3000 : 2200
    });
    audio.cue(success ? "proposal" : "warning", success ? 1 : 0.82);
    scheduleResultAfterTable(success ? 7800 : 2500);
  }

  function processOutcomePerformances(outcome, completedShot = {}) {
    const stageTransitions = outcome.newlyCompletedStageIds || outcome.completedStageIds || [];
    const presentPocketMoments = () => {
      outcome.pocketEvents?.forEach((event) => {
        const color = BALL_COLORS[event.number] || "#e4c178";
        const burst = [...pocketBursts].reverse().find((item) => item.number === event.number);
        spawnParticles(burst?.x || WORLD.width / 2, burst?.y || WORLD.height / 2, color, 18);
        const detail = completedShot.pottedDetails?.find((item) => item.number === event.number) || {};
        const route = rememberDateMoment(event.number, detail);
        if (route) route.storyNumber = event.storyNumber;
      });
      const story = createShotStory(completedShot, outcome);
      if (!story) return;
      if (completedShot.storyShown) updateVisibleTableMoment(story);
      else {
        completedShot.storyShown = true;
        completedShot.story = story;
        showTableMoment(story);
      }
    };
    const analysis = analyzeCompletedShot(completedShot, outcome);
    applyShotStyle(analysis);
    recordCueStop(completedShot, outcome);

    if (outcome.earlyEight) {
      presentPocketMoments();
      beginFinalDateMapReveal(outcome);
      return;
    }

    presentPocketMoments();
    if (outcome.miss && !outcome.shot.breakShot) {
      setDateFlow(0, true);
      dateMapState.flow = 0;
    } else if (outcome.cueScratch) {
      setDateFlow(0, true);
      dateMapState.flow = 0.16;
      dateMapState.stagePulse = 0.26;
    } else {
      setDateFlow(outcome.state.potStreak, false);
    }

    if (stageTransitions.length) {
      dateMapState.stagePulse = 1;
      DATE_SCENES.forEach((scene, index) => {
        const zone = dateMapState.zones.get(scene.pocketId);
        if (zone && index < Math.ceil(outcome.state.pottedNumbers.length / 3)) {
          zone.reveal = Math.max(zone.reveal, 0.18);
        }
      });
      audio.cue("stage", 0.58);
    }

    if (outcome.state.endState.ended) {
      beginFinalDateMapReveal(outcome);
      return;
    }
    syncTableStory();
  }

  function orderedPottedNumbers(completedShot) {
    const completed = [...(completedShot?.pottedNumbers || [])];
    const entryOrder = [...(completedShot?.pottedDetails || [])]
      .filter((detail) => completed.includes(detail.number))
      .sort((left, right) => (left.enteredOrder ?? Number.MAX_SAFE_INTEGER) - (right.enteredOrder ?? Number.MAX_SAFE_INTEGER))
      .map((detail) => detail.number);
    return [...entryOrder, ...completed.filter((number) => !entryOrder.includes(number))];
  }

  function finalizeShot() {
    if (!shotState || resolvingShot) return;
    resolvingShot = true;
    const completedShot = shotState;
    completedShot.cueEnd = cueBall && !completedShot.cueScratch
      ? { x: cueBall.position.x, y: cueBall.position.y }
      : null;
    shotState = null;
    stableSteps = 0;
    let outcome;
    try {
      outcome = rules.evaluateShot(runState, {
        pottedNumbers: orderedPottedNumbers(completedShot),
        cueScratch: completedShot.cueScratch,
        breakShot: completedShot.breakShot,
        bankedNumbers: [...new Set(completedShot.bankedNumbers)]
      });
    } catch (error) {
      console.error(error);
      resolvingShot = false;
      showJudgement("这一杆需要重新摆好");
      if (!cueBall) respotBall(0);
      root.dataset.state = "aiming";
      return;
    }
    runState = outcome.state;
    outcome.respotNumbers.forEach(respotBall);
    if (!cueBall && !runState.endState.ended) respotBall(0);
    selectedBallNumber = null;
    elements.call.classList.remove("is-quiet");
    resolvingShot = false;
    processOutcomePerformances(outcome, completedShot);
    syncUI();
    root.dataset.state = runState.endState.ended ? "map-finale" : "aiming";
    if (runState.endState.ended && !cinematicQueue.length && !cinematicActive && !finalRevealActive && elements.micro.hidden) showResult();
  }

  function showResult() {
    resultVisible = true;
    root.dataset.state = "result";
    const rating = rules.computeRating(runState);
    const grade = rating.grade || "B";
    let title;
    let line;
    let kicker;
    if (runState.endState.status === "completed") {
      if (runState.endState.ending === rules.EARLY_SUCCESS_ENDING) {
        kicker = `${grade} · 提前双向奔赴`;
        title = "黑 8 提前落袋，她却没有后退";
        line = "你此前每一次稳定靠近都得到了回应，所以这次冒险没有成为冒犯。";
      } else {
        const ending = content.getEnding(grade);
        kicker = `${grade} · ${ending.title}`;
        title = ending.line;
        line = ending.epilogue;
      }
    } else {
      const failure = {
        "confession-too-early": ["告白过早", "心意先于时机落袋", "不是每一次直球，都适合发生在刚认识的时候。"],
        "commitment-too-heavy": ["承诺过重", "很远的以后来得太早", "这一桌停在这里，下一次可以慢慢清完。"],
        "losing-contact": ["渐渐失去联系", "话题在几次停顿后安静下来", "几次迟疑没有被重新接住，这段关系停在了当前章节。"],
        "reckless-rejection": ["过于鲁莽", "黑 8 在关系成熟前落袋", "她认真听完，却没有接受这份来得太快的承诺。"]
      }[runState.endState.ending] || ["今晚未完", "这一桌停在了这里", "下一次开球，关系轨迹会重新亮起。"];
      [kicker, title, line] = failure;
    }
    elements.resultGrade.textContent = kicker;
    elements.resultTitle.textContent = title;
    elements.resultLine.textContent = line;
    elements.resultShots.textContent = String(rating.technical.shots);
    elements.resultAccuracy.textContent = `${rating.technical.successfulShotRate}%`;
    elements.resultStreak.textContent = String(rating.technical.bestStreak);
    elements.resultInterest.textContent = rules.interestStatus(runState).label;
    elements.result.hidden = false;
    saveRecord(rating);
  }

  function saveRecord(rating) {
    const previous = readStorage(RECORD_KEY, {});
    const grades = { S: 3, A: 2, B: 1 };
    const nextGrade = rating.grade && (!previous.bestGrade || grades[rating.grade] > grades[previous.bestGrade])
      ? rating.grade
      : previous.bestGrade || null;
    const next = {
      bestGrade: nextGrade,
      minShots: runState.endState.status === "completed"
        ? Math.min(previous.minShots || Infinity, runState.shots)
        : previous.minShots || null,
      endings: [...new Set([...(previous.endings || []), runState.endState.ending].filter(Boolean))]
    };
    writeStorage(RECORD_KEY, next);
  }

  function spawnParticles(x, y, color, count) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.PI * 2 * index / count + (index % 3) * 0.12;
      const speed = 0.8 + (index % 5) * 0.42;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: 1.2 + index % 3,
        color
      });
    }
  }

  function updateEffects() {
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.985;
      particle.vy *= 0.985;
      particle.life -= 0.018;
    });
    particles = particles.filter((particle) => particle.life > 0);
    pocketBursts.forEach((burst) => { burst.life -= 0.024; });
    pocketBursts = pocketBursts.filter((burst) => burst.life > 0);
    storyTrails.forEach((trail) => { trail.life -= 0.012; });
    storyTrails = storyTrails.filter((trail) => trail.life > 0);
    dateMapState.zones.forEach((zone) => { zone.pulse *= 0.955; });
    dateMapState.routes.forEach((route) => { route.glow = Math.max(0.46, route.glow * 0.994); });
    dateMapState.stagePulse *= 0.958;
    dateMapState.powerWave *= 0.94;
    if (dateMapState.completed && dateMapState.finalProgress < 1) {
      dateMapState.finalProgress = Math.min(1, dateMapState.finalProgress + 0.009);
    }
    collisionFeedbacks.forEach((feedback) => {
      feedback.life -= 0.115;
      feedback.radius += feedback.speed;
      feedback.speed *= 0.82;
    });
    collisionFeedbacks = collisionFeedbacks.filter((feedback) => feedback.life > 0);
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (!data) return;
      data.compression *= 0.64;
      data.impactGlow *= 0.74;
      if (data.compression < 0.001) data.compression = 0;
      if (data.impactGlow < 0.01) data.impactGlow = 0;
    });
    screenFlash *= 0.9;
    screenShake *= 0.83;
  }

  function rayCircleDistance(origin, direction, center, radius) {
    const ox = origin.x - center.x;
    const oy = origin.y - center.y;
    const projection = ox * direction.x + oy * direction.y;
    const constant = ox * ox + oy * oy - radius * radius;
    const discriminant = projection * projection - constant;
    if (discriminant < 0) return Infinity;
    const near = -projection - Math.sqrt(discriminant);
    return near > 0 ? near : Infinity;
  }

  function rayBoundaryDistance(origin, direction) {
    const distances = [];
    if (direction.x > 0) distances.push((TABLE.right - BALL_RADIUS - origin.x) / direction.x);
    if (direction.x < 0) distances.push((TABLE.left + BALL_RADIUS - origin.x) / direction.x);
    if (direction.y > 0) distances.push((TABLE.bottom - BALL_RADIUS - origin.y) / direction.y);
    if (direction.y < 0) distances.push((TABLE.top + BALL_RADIUS - origin.y) / direction.y);
    return Math.min(...distances.filter((value) => value > 0));
  }

  function traceAim() {
    if (!cueBall) return null;
    const origin = cueBall.position;
    const direction = pointerAim?.direction || aimDirection;
    let hitBall = null;
    let hitDistance = rayBoundaryDistance(origin, direction);
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (!data || data.number === 0 || data.potted) return;
      const candidate = rayCircleDistance(origin, direction, ball.position, BALL_RADIUS * 2);
      if (candidate < hitDistance) {
        hitDistance = candidate;
        hitBall = ball;
      }
    });
    const impact = { x: origin.x + direction.x * hitDistance, y: origin.y + direction.y * hitDistance };
    let targetDirection = null;
    if (hitBall) targetDirection = normalize({ x: hitBall.position.x - impact.x, y: hitBall.position.y - impact.y });
    return { origin, direction, impact, hitBall, targetDirection };
  }

  function drawSolidWoodFrame() {
    context.save();
    context.shadowColor = "rgba(0, 0, 0, 0.66)";
    context.shadowBlur = 34;
    context.shadowOffsetY = 20;
    const wood = context.createLinearGradient(TABLE_OUTER.left, TABLE_OUTER.top, TABLE_OUTER.right, TABLE_OUTER.bottom);
    wood.addColorStop(0, "#190910");
    wood.addColorStop(0.18, "#512132");
    wood.addColorStop(0.42, "#2a101b");
    wood.addColorStop(0.68, "#64283d");
    wood.addColorStop(1, "#14070d");
    context.fillStyle = wood;
    roundRectPath(context, TABLE_OUTER.left, TABLE_OUTER.top, TABLE_OUTER.right - TABLE_OUTER.left, TABLE_OUTER.bottom - TABLE_OUTER.top, 32);
    context.fill();
    context.restore();

    context.save();
    const burl = context.createLinearGradient(TABLE_OUTER.right, TABLE_OUTER.top, TABLE_OUTER.left, TABLE_OUTER.bottom);
    burl.addColorStop(0, "#713046");
    burl.addColorStop(0.16, "#30121e");
    burl.addColorStop(0.5, "#5b2438");
    burl.addColorStop(0.84, "#250d17");
    burl.addColorStop(1, "#79334a");
    context.fillStyle = burl;
    roundRectPath(context, TABLE_OUTER.left + 8, TABLE_OUTER.top + 8, TABLE_OUTER.right - TABLE_OUTER.left - 16, TABLE_OUTER.bottom - TABLE_OUTER.top - 16, 25);
    context.fill();
    roundRectPath(context, TABLE_OUTER.left + 10, TABLE_OUTER.top + 10, TABLE_OUTER.right - TABLE_OUTER.left - 20, TABLE_OUTER.bottom - TABLE_OUTER.top - 20, 23);
    context.clip();
    drawMaterialTexture(MATERIAL_TEXTURES.walnut, TABLE_OUTER.left + 8, TABLE_OUTER.top + 8,
      TABLE_OUTER.right - TABLE_OUTER.left - 16, TABLE_OUTER.bottom - TABLE_OUTER.top - 16, 0.82);
    context.lineWidth = 0.7;
    for (let y = TABLE_OUTER.top + 14, index = 0; y < TABLE_OUTER.bottom - 10; y += 11, index += 1) {
      context.strokeStyle = index % 3 === 0 ? "rgba(248, 184, 193, 0.2)" : "rgba(41, 7, 20, 0.26)";
      context.beginPath();
      context.moveTo(TABLE_OUTER.left + 8, y);
      context.lineTo(TABLE_OUTER.right - 8, y + Math.sin(index * 1.73) * 4);
      context.stroke();
    }
    context.restore();

    context.save();
    context.strokeStyle = "rgba(235, 187, 189, 0.36)";
    context.lineWidth = 1.2;
    roundRectPath(context, TABLE_OUTER.left + 15, TABLE_OUTER.top + 15, TABLE_OUTER.right - TABLE_OUTER.left - 30, TABLE_OUTER.bottom - TABLE_OUTER.top - 30, 20);
    context.stroke();
    context.strokeStyle = "rgba(24, 12, 10, 0.78)";
    context.lineWidth = 5;
    roundRectPath(context, TABLE.left - 43, TABLE.top - 43, TABLE.right - TABLE.left + 86, TABLE.bottom - TABLE.top + 86, 23);
    context.stroke();
    context.restore();
  }

  function drawWoolCloth() {
    context.save();
    const cloth = context.createLinearGradient(TABLE.left, TABLE.top, TABLE.right, TABLE.bottom);
    cloth.addColorStop(0, "#a1516a");
    cloth.addColorStop(0.38, "#823d56");
    cloth.addColorStop(0.72, "#692f48");
    cloth.addColorStop(1, "#4a1e35");
    context.fillStyle = cloth;
    context.fillRect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    context.beginPath();
    context.moveTo(TABLE.left, TABLE.top);
    context.lineTo(TABLE.right, TABLE.top);
    context.lineTo(TABLE.right, TABLE.bottom);
    context.lineTo(TABLE.left, TABLE.bottom);
    context.closePath();
    context.clip();
    const hasClothTexture = drawMaterialTexture(MATERIAL_TEXTURES.cloth, TABLE.left, TABLE.top,
      TABLE.right - TABLE.left, TABLE.bottom - TABLE.top, 0.16);
    context.lineWidth = 0.42;
    for (let y = TABLE.top + 2, index = 0; y < TABLE.bottom; y += 5, index += 1) {
      context.strokeStyle = hasClothTexture
        ? (index % 2 ? "rgba(255, 231, 238, 0.014)" : "rgba(55, 8, 28, 0.026)")
        : (index % 2 ? "rgba(255, 231, 238, 0.042)" : "rgba(55, 8, 28, 0.092)");
      context.beginPath();
      context.moveTo(TABLE.left, y);
      context.lineTo(TABLE.right, y + (index % 4 - 1.5) * 0.35);
      context.stroke();
    }
    context.lineWidth = 0.3;
    for (let x = TABLE.left + 3, index = 0; x < TABLE.right; x += 8, index += 1) {
      context.strokeStyle = hasClothTexture
        ? (index % 3 === 0 ? "rgba(250, 214, 229, 0.012)" : "rgba(50, 5, 24, 0.02)")
        : (index % 3 === 0 ? "rgba(250, 214, 229, 0.036)" : "rgba(50, 5, 24, 0.058)");
      context.beginPath();
      context.moveTo(x, TABLE.top);
      context.lineTo(x + Math.sin(index * 2.1) * 1.2, TABLE.bottom);
      context.stroke();
    }
    const stageWash = ["#c57f9b", "#dda48f", "#dc6f96", "#e0b56f", "#a77ca8", "#936b9c", "#e4ac78"][currentStageNumber() - 1];
    const wash = context.createRadialGradient(WORLD.width * 0.54, WORLD.height * 0.46, 32, WORLD.width * 0.54, WORLD.height * 0.46, 620);
    wash.addColorStop(0, `${stageWash}22`);
    wash.addColorStop(1, "transparent");
    context.fillStyle = wash;
    context.fillRect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    context.restore();
  }

  function drawCushionRubber() {
    context.save();
    rails.forEach((railBody) => {
      const material = railBody.plugin.heartbeatRail;
      if (!material || material.kind === "guard") return;
      context.save();
      context.translate(railBody.position.x, railBody.position.y);
      context.rotate(railBody.angle);
      const horizontal = material.width >= material.height;
      const gradient = horizontal
        ? context.createLinearGradient(0, -material.height / 2, 0, material.height / 2)
        : context.createLinearGradient(-material.width / 2, 0, material.width / 2, 0);
      const reverse = material.id.startsWith("bottom") || material.id.startsWith("right");
      const tones = material.kind === "jaw"
        ? ["#4a1b30", "#9b4a65", "#562037"]
        : ["#42172b", "#a8526e", "#622640"];
      gradient.addColorStop(0, reverse ? tones[2] : tones[0]);
      gradient.addColorStop(0.5, tones[1]);
      gradient.addColorStop(1, reverse ? tones[0] : tones[2]);
      context.fillStyle = gradient;
      roundRectPath(context, -material.width / 2, -material.height / 2, material.width, material.height, material.kind === "jaw" ? 5 : 8);
      context.fill();
      context.strokeStyle = material.kind === "jaw" ? "rgba(221, 133, 164, 0.48)" : "rgba(239, 151, 182, 0.64)";
      context.lineWidth = material.kind === "jaw" ? 1 : 1.35;
      roundRectPath(context, -material.width / 2 + 1, -material.height / 2 + 1, material.width - 2, material.height - 2, material.kind === "jaw" ? 4 : 7);
      context.stroke();
      if (material.kind === "cushion") {
        context.strokeStyle = "rgba(244, 166, 194, 0.8)";
        context.shadowColor = "rgba(47, 7, 25, 0.76)";
        context.shadowBlur = 3;
        context.lineWidth = 1.8;
        context.beginPath();
        if (material.id === "top") {
          context.moveTo(-material.width / 2 + 9, material.height / 2 - 1.4);
          context.lineTo(material.width / 2 - 9, material.height / 2 - 1.4);
        } else if (material.id === "bottom") {
          context.moveTo(-material.width / 2 + 9, -material.height / 2 + 1.4);
          context.lineTo(material.width / 2 - 9, -material.height / 2 + 1.4);
        } else if (material.id.startsWith("left")) {
          context.moveTo(material.width / 2 - 1.4, -material.height / 2 + 9);
          context.lineTo(material.width / 2 - 1.4, material.height / 2 - 9);
        } else {
          context.moveTo(-material.width / 2 + 1.4, -material.height / 2 + 9);
          context.lineTo(-material.width / 2 + 1.4, material.height / 2 - 9);
        }
        context.stroke();
      }
      context.restore();
    });
    context.restore();
  }

  function drawMetalSight(x, y) {
    context.save();
    context.translate(x, y);
    context.rotate(Math.PI / 4);
    context.shadowColor = "rgba(0, 0, 0, 0.6)";
    context.shadowBlur = 3;
    context.shadowOffsetY = 2;
    const metal = context.createLinearGradient(-4, -4, 4, 4);
    metal.addColorStop(0, "#fff2c7");
    metal.addColorStop(0.28, "#ad8b59");
    metal.addColorStop(0.56, "#f2d99d");
    metal.addColorStop(1, "#6f5536");
    context.fillStyle = metal;
    context.fillRect(-4, -4, 8, 8);
    context.fillStyle = "rgba(255, 255, 255, 0.66)";
    context.fillRect(-2.5, -2.5, 2, 2);
    context.restore();
  }

  function drawMetalSights() {
    [0.25, 0.5, 0.75].forEach((fraction) => {
      const x = TABLE.left + (TABLE.right - TABLE.left) * fraction;
      drawMetalSight(x, TABLE.top - 43);
      drawMetalSight(x, TABLE.bottom + 43);
    });
    [0.125, 0.25, 0.375, 0.625, 0.75, 0.875].forEach((fraction) => {
      const y = TABLE.top + (TABLE.bottom - TABLE.top) * fraction;
      drawMetalSight(TABLE.left - 43, y);
      drawMetalSight(TABLE.right + 43, y);
    });
  }

  function drawPocketInnerWall(pocket) {
    const tangentX = -pocket.inwardY;
    const tangentY = pocket.inwardX;
    const mouthHalf = pocket.mouth / 2;
    const dropHalf = POCKET_RADIUS * 0.62;
    const mouthA = { x: pocket.mouthX + tangentX * mouthHalf, y: pocket.mouthY + tangentY * mouthHalf };
    const mouthB = { x: pocket.mouthX - tangentX * mouthHalf, y: pocket.mouthY - tangentY * mouthHalf };
    const dropA = { x: pocket.x + tangentX * dropHalf, y: pocket.y + tangentY * dropHalf };
    const dropB = { x: pocket.x - tangentX * dropHalf, y: pocket.y - tangentY * dropHalf };
    const lining = context.createLinearGradient(pocket.mouthX, pocket.mouthY, pocket.x, pocket.y);
    lining.addColorStop(0, "#4a3025");
    lining.addColorStop(0.4, "#211714");
    lining.addColorStop(1, "#080807");
    context.fillStyle = lining;
    context.beginPath();
    context.moveTo(mouthA.x, mouthA.y);
    context.lineTo(dropA.x, dropA.y);
    context.lineTo(dropB.x, dropB.y);
    context.lineTo(mouthB.x, mouthB.y);
    context.closePath();
    context.fill();
    context.strokeStyle = "rgba(177, 126, 84, 0.4)";
    context.lineWidth = 1.1;
    context.beginPath();
    context.moveTo(mouthA.x, mouthA.y);
    context.lineTo(dropA.x, dropA.y);
    context.moveTo(mouthB.x, mouthB.y);
    context.lineTo(dropB.x, dropB.y);
    context.stroke();
  }

  function drawLeatherPocket(pocket) {
    context.save();
    drawPocketInnerWall(pocket);
    const collarRadius = POCKET_RADIUS + (pocket.type === "side" ? 8 : 6);
    const leather = context.createRadialGradient(pocket.x - 8, pocket.y - 9, 2, pocket.x, pocket.y, collarRadius);
    leather.addColorStop(0, "#8b5b3c");
    leather.addColorStop(0.5, "#3a2119");
    leather.addColorStop(0.78, "#1d1110");
    leather.addColorStop(1, "#0b0808");
    context.fillStyle = leather;
    context.beginPath();
    context.arc(pocket.x, pocket.y, collarRadius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(178, 148, 112, 0.34)";
    context.lineWidth = 0.9;
    context.beginPath();
    context.arc(pocket.x, pocket.y, collarRadius - 4.5, 0, Math.PI * 2);
    context.stroke();
    const depth = context.createRadialGradient(pocket.x - 7, pocket.y - 9, 1, pocket.x, pocket.y, POCKET_RADIUS + 1);
    depth.addColorStop(0, "#101412");
    depth.addColorStop(0.38, "#050706");
    depth.addColorStop(0.72, "#010202");
    depth.addColorStop(1, "#000000");
    context.fillStyle = depth;
    context.shadowColor = "rgba(0, 0, 0, 0.9)";
    context.shadowBlur = 12;
    context.beginPath();
    context.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawTable() {
    drawSolidWoodFrame();
    drawWoolCloth();
    drawCushionRubber();
    drawMetalSights();
    POCKETS.forEach(drawLeatherPocket);
  }

  function rebuildTableCache() {
    const cache = document.createElement("canvas");
    if (typeof cache.getContext !== "function") return false;
    cache.width = WORLD.width * 2;
    cache.height = WORLD.height * 2;
    const cacheContext = cache.getContext("2d", { alpha: true });
    if (!cacheContext) return false;
    const liveContext = context;
    try {
      context = cacheContext;
      context.setTransform(cache.width / WORLD.width, 0, 0, cache.height / WORLD.height, 0, 0);
      context.clearRect(0, 0, WORLD.width, WORLD.height);
      drawTable();
    } finally {
      context = liveContext;
    }
    tableCacheCanvas = cache;
    tableCacheDirty = false;
    return true;
  }

  function drawTableLayer() {
    if ((tableCacheDirty || !tableCacheCanvas) && !rebuildTableCache()) {
      drawTable();
      return;
    }
    context.drawImage(tableCacheCanvas, 0, 0, WORLD.width, WORLD.height);
  }

  function makeDateMapCache(filter, roseVeil) {
    const source = MATERIAL_TEXTURES.dateMap;
    if (!source || !source.complete || !source.naturalWidth) return null;
    const cache = document.createElement("canvas");
    cache.width = WORLD.width;
    cache.height = WORLD.height;
    const cacheContext = cache.getContext("2d", { alpha: true });
    if (!cacheContext) return null;
    cacheContext.save();
    cacheContext.beginPath();
    cacheContext.rect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    cacheContext.clip();
    cacheContext.filter = filter;
    cacheContext.drawImage(source, TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    cacheContext.filter = "none";
    cacheContext.globalCompositeOperation = "source-atop";
    cacheContext.fillStyle = roseVeil;
    cacheContext.fillRect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    cacheContext.restore();
    return cache;
  }

  function ensureDateMapCaches() {
    if (dateMapDarkCanvas && dateMapClearCanvas) return true;
    dateMapDarkCanvas = makeDateMapCache("blur(5px) brightness(0.52) saturate(0.7)", "rgba(82, 20, 47, 0.46)");
    dateMapClearCanvas = makeDateMapCache("brightness(0.82) saturate(0.96) contrast(1.04)", "rgba(111, 30, 59, 0.17)");
    return Boolean(dateMapDarkCanvas && dateMapClearCanvas);
  }

  function drawDateMapPhotoBase(litCount, finalBoost) {
    if (!ensureDateMapCaches()) return false;
    const progress = clamp(litCount / 15, 0, 1);
    context.save();
    context.globalAlpha = 0.58 + progress * 0.12;
    context.drawImage(dateMapDarkCanvas, 0, 0, WORLD.width, WORLD.height);
    const fullClearAlpha = dateMapState.stagePulse * 0.18 + finalBoost * 0.46;
    if (fullClearAlpha > 0.005) {
      context.globalCompositeOperation = "screen";
      context.globalAlpha = fullClearAlpha;
      context.drawImage(dateMapClearCanvas, 0, 0, WORLD.width, WORLD.height);
    }
    context.restore();
    return true;
  }

  function drawScenePhotoReveal(zone, finalBoost) {
    if (!dateMapClearCanvas) return;
    const reveal = clamp(zone.reveal + finalBoost * 0.82, 0, 1);
    const radiusX = 124 + reveal * 68;
    const radiusY = 106 + reveal * 66;
    [1.28, 1.05, 0.82].forEach((scale, index) => {
      const left = clamp(zone.x - radiusX * scale, TABLE.left, TABLE.right);
      const top = clamp(zone.y - radiusY * scale, TABLE.top, TABLE.bottom);
      const right = clamp(zone.x + radiusX * scale, TABLE.left, TABLE.right);
      const bottom = clamp(zone.y + radiusY * scale, TABLE.top, TABLE.bottom);
      const width = Math.max(1, right - left);
      const height = Math.max(1, bottom - top);
      context.save();
      context.beginPath();
      context.ellipse(zone.x, zone.y, radiusX * scale, radiusY * scale, 0, 0, Math.PI * 2);
      context.clip();
      context.globalAlpha = reveal * [0.08, 0.18, 0.42][index];
      context.drawImage(dateMapClearCanvas, left, top, width, height, left, top, width, height);
      context.restore();
    });
  }

  function drawMotifAtmosphere(motif, zone, timestamp, weight) {
    const key = String(motif || "").toLowerCase();
    const alpha = clamp(weight, 0, 1);
    if (!alpha) return;
    context.save();
    context.globalCompositeOperation = "screen";
    if (key.includes("rain") || key.includes("umbrella")) {
      context.strokeStyle = `rgba(190, 224, 230, ${0.12 + alpha * 0.2})`;
      context.lineWidth = 0.8;
      for (let index = 0; index < 12; index += 1) {
        const offsetX = (index * 31 + timestamp * 0.026) % 210 - 105;
        const offsetY = (index * 47 + timestamp * 0.019) % 170 - 85;
        context.beginPath();
        context.moveTo(zone.x + offsetX, zone.y + offsetY - 9);
        context.lineTo(zone.x + offsetX - 5, zone.y + offsetY + 8);
        context.stroke();
      }
    }
    if (key.includes("coffee") || key.includes("home") || key.includes("gift")) {
      const glow = context.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, 112);
      glow.addColorStop(0, `rgba(255, 200, 119, ${0.16 + alpha * 0.19})`);
      glow.addColorStop(1, "rgba(255, 186, 104, 0)");
      context.fillStyle = glow;
      context.fillRect(zone.x - 115, zone.y - 115, 230, 230);
    }
    if (key.includes("coffee")) {
      context.strokeStyle = `rgba(255, 240, 212, ${0.12 + alpha * 0.24})`;
      context.lineWidth = 1.4;
      for (let index = -1; index <= 1; index += 1) {
        const sway = Math.sin(timestamp * 0.0025 + index) * 8;
        context.beginPath();
        context.moveTo(zone.x + index * 14, zone.y + 26);
        context.bezierCurveTo(zone.x + index * 14 - 10, zone.y + 5, zone.x + sway + index * 10, zone.y - 16, zone.x + index * 9, zone.y - 42);
        context.stroke();
      }
    }
    if (key.includes("ticket")) {
      const beam = context.createLinearGradient(zone.x - 125, zone.y - 70, zone.x + 125, zone.y + 70);
      beam.addColorStop(0, "rgba(217, 84, 103, 0)");
      beam.addColorStop(0.5, `rgba(255, 214, 175, ${0.08 + alpha * 0.18})`);
      beam.addColorStop(1, "rgba(217, 84, 103, 0)");
      context.fillStyle = beam;
      context.fillRect(zone.x - 130, zone.y - 76, 260, 152);
    }
    if (key.includes("camera")) {
      const flash = Math.max(zone.pulse, 0) ** 2;
      const bloom = context.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, 92);
      bloom.addColorStop(0, `rgba(255, 251, 232, ${flash * 0.6})`);
      bloom.addColorStop(0.18, `rgba(255, 240, 205, ${flash * 0.26})`);
      bloom.addColorStop(1, "rgba(255, 255, 255, 0)");
      context.fillStyle = bloom;
      context.fillRect(zone.x - 95, zone.y - 95, 190, 190);
    }
    if (key.includes("lamp") || key.includes("sun")) {
      const pulse = 0.88 + Math.sin(timestamp * 0.0022) * 0.12;
      const light = context.createRadialGradient(zone.x, zone.y - 12, 0, zone.x, zone.y - 12, 128);
      light.addColorStop(0, `rgba(255, 198, 104, ${(0.14 + alpha * 0.2) * pulse})`);
      light.addColorStop(1, "rgba(255, 146, 86, 0)");
      context.fillStyle = light;
      context.fillRect(zone.x - 132, zone.y - 144, 264, 264);
    }
    if (key.includes("ear") || key.includes("message")) {
      for (let index = 0; index < 5; index += 1) {
        const phase = (timestamp * 0.0014 + index * 0.19) % 1;
        context.globalAlpha = alpha * (1 - phase) * 0.36;
        context.fillStyle = index % 2 ? "#bfe6df" : "#fff0c9";
        context.beginPath();
        context.arc(zone.x - 64 + index * 32, zone.y + Math.sin(timestamp * 0.003 + index) * 14, 2 + phase * 4, 0, Math.PI * 2);
        context.fill();
      }
    }
    if (key.includes("cat")) {
      const travel = (timestamp * 0.014 + zone.visits * 27) % 170 - 85;
      context.globalAlpha = 0.18 + alpha * 0.26;
      context.fillStyle = "#18211f";
      context.beginPath();
      context.ellipse(zone.x + travel, zone.y + 48, 10, 5, 0, 0, Math.PI * 2);
      context.arc(zone.x + travel + 9, zone.y + 43, 5, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "#18211f";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(zone.x + travel - 8, zone.y + 47);
      context.quadraticCurveTo(zone.x + travel - 22, zone.y + 35, zone.x + travel - 14, zone.y + 28);
      context.stroke();
    }
    if (key.includes("heart")) {
      const heartGlow = context.createRadialGradient(zone.x - 12, zone.y, 0, zone.x, zone.y, 126);
      heartGlow.addColorStop(0, `rgba(238, 132, 157, ${0.1 + alpha * 0.2})`);
      heartGlow.addColorStop(1, "rgba(238, 132, 157, 0)");
      context.fillStyle = heartGlow;
      context.fillRect(zone.x - 130, zone.y - 126, 260, 252);
    }
    if (key.includes("transit")) {
      const scan = (timestamp * 0.045) % 210 - 105;
      const trainLight = context.createLinearGradient(zone.x + scan - 28, 0, zone.x + scan + 28, 0);
      trainLight.addColorStop(0, "rgba(174, 221, 222, 0)");
      trainLight.addColorStop(0.5, `rgba(226, 250, 237, ${0.12 + alpha * 0.28})`);
      trainLight.addColorStop(1, "rgba(174, 221, 222, 0)");
      context.fillStyle = trainLight;
      context.fillRect(zone.x - 112, zone.y - 42, 224, 84);
    }
    if (key.includes("star")) {
      context.fillStyle = "#fff4cc";
      for (let index = 0; index < 13; index += 1) {
        context.globalAlpha = alpha * (0.18 + (Math.sin(timestamp * 0.004 + index) + 1) * 0.15);
        context.beginPath();
        context.arc(zone.x - 90 + (index * 43) % 180, zone.y - 66 + (index * 61) % 132, index % 4 === 0 ? 2.1 : 1.1, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.restore();
  }

  function drawPhotographicScene(zone, timestamp, finalBoost) {
    drawScenePhotoReveal(zone, finalBoost);
    const pocket = POCKETS.find((candidate) => candidate.id === zone.pocketId);
    if (pocket && (zone.pulse > 0.03 || finalBoost > 0)) {
      context.save();
      context.globalCompositeOperation = "screen";
      context.globalAlpha = 0.05 + zone.pulse * 0.2 + finalBoost * 0.16;
      context.strokeStyle = zone.color;
      context.shadowColor = zone.color;
      context.shadowBlur = 16;
      context.lineCap = "round";
      context.lineWidth = 7;
      context.beginPath();
      context.moveTo(pocket.captureX, pocket.captureY);
      context.quadraticCurveTo((pocket.captureX + zone.x) / 2, zone.y, zone.x, zone.y);
      context.stroke();
      context.restore();
    }
    zone.motifs.slice(-3).forEach((motif, index) => {
      drawMotifAtmosphere(motif, zone, timestamp + index * 173, zone.reveal * (1 - index * 0.18) + finalBoost * 0.5);
    });
  }

  function tracePoints(points) {
    if (!points?.length) return;
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
  }

  function drawMotifGlyph(motif, x, y, size, alpha = 1) {
    const key = String(motif || "star").toLowerCase();
    const s = size;
    context.save();
    context.translate(x, y);
    context.globalAlpha *= alpha;
    context.lineWidth = Math.max(1, s * 0.09);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#fff1c9";
    context.fillStyle = "rgba(255, 239, 199, 0.16)";
    context.beginPath();
    if (key.includes("rain") || key.includes("drop")) {
      context.moveTo(0, -s * 0.58); context.lineTo(-s * 0.38, s * 0.12); context.arc(0, s * 0.12, s * 0.38, Math.PI, 0); context.closePath();
    } else if (key.includes("coffee") || key.includes("cup")) {
      context.moveTo(-s * 0.5, -s * 0.22); context.lineTo(-s * 0.38, s * 0.38); context.lineTo(s * 0.3, s * 0.38); context.lineTo(s * 0.42, -s * 0.22); context.closePath();
      context.moveTo(s * 0.42, -s * 0.08); context.arc(s * 0.49, s * 0.08, s * 0.2, -Math.PI / 2, Math.PI / 2);
    } else if (key.includes("ticket") || key.includes("transit") || key.includes("card")) {
      context.moveTo(-s * 0.58, -s * 0.32); context.lineTo(s * 0.58, -s * 0.32); context.lineTo(s * 0.58, s * 0.32); context.lineTo(-s * 0.58, s * 0.32); context.closePath();
      context.moveTo(-s * 0.08, -s * 0.28); context.lineTo(-s * 0.08, s * 0.28);
    } else if (key.includes("camera") || key.includes("photo")) {
      context.moveTo(-s * 0.58, -s * 0.28); context.lineTo(-s * 0.18, -s * 0.28); context.lineTo(-s * 0.08, -s * 0.44); context.lineTo(s * 0.28, -s * 0.44); context.lineTo(s * 0.38, -s * 0.28); context.lineTo(s * 0.58, -s * 0.28); context.lineTo(s * 0.58, s * 0.4); context.lineTo(-s * 0.58, s * 0.4); context.closePath();
      context.moveTo(s * 0.22, 0); context.arc(0, 0, s * 0.25, 0, Math.PI * 2);
    } else if (key.includes("lamp") || key.includes("light")) {
      context.moveTo(0, s * 0.58); context.lineTo(0, -s * 0.28); context.arc(s * 0.18, -s * 0.28, s * 0.18, Math.PI, 0); context.moveTo(-s * 0.28, s * 0.58); context.lineTo(s * 0.28, s * 0.58);
    } else if (key.includes("ear") || key.includes("music")) {
      context.arc(0, 0, s * 0.48, Math.PI * 1.04, Math.PI * 1.96); context.moveTo(-s * 0.48, 0); context.lineTo(-s * 0.48, s * 0.35); context.moveTo(s * 0.48, 0); context.lineTo(s * 0.48, s * 0.35);
    } else if (key.includes("cat")) {
      context.moveTo(-s * 0.46, -s * 0.12); context.lineTo(-s * 0.42, -s * 0.52); context.lineTo(-s * 0.12, -s * 0.3); context.lineTo(s * 0.16, -s * 0.3); context.lineTo(s * 0.44, -s * 0.52); context.lineTo(s * 0.46, -s * 0.08); context.arc(0, 0, s * 0.46, 0, Math.PI); context.closePath();
    } else if (key.includes("heart") || key.includes("message")) {
      context.moveTo(0, s * 0.52); context.lineTo(-s * 0.5, 0); context.arc(-s * 0.25, -s * 0.18, s * 0.25, Math.PI, 0); context.arc(s * 0.25, -s * 0.18, s * 0.25, Math.PI, 0); context.closePath();
    } else if (key.includes("sun")) {
      context.arc(0, 0, s * 0.28, 0, Math.PI * 2); for (let i = 0; i < 8; i += 1) { const a = i * Math.PI / 4; context.moveTo(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42); context.lineTo(Math.cos(a) * s * 0.62, Math.sin(a) * s * 0.62); }
    } else if (key.includes("gift")) {
      context.moveTo(-s * 0.5, -s * 0.18); context.lineTo(s * 0.5, -s * 0.18); context.lineTo(s * 0.42, s * 0.48); context.lineTo(-s * 0.42, s * 0.48); context.closePath(); context.moveTo(0, -s * 0.48); context.lineTo(0, s * 0.48); context.moveTo(-s * 0.5, 0); context.lineTo(s * 0.5, 0);
    } else if (key.includes("umbrella")) {
      context.arc(0, 0, s * 0.56, Math.PI, 0); context.moveTo(0, 0); context.lineTo(0, s * 0.48); context.arc(s * 0.14, s * 0.48, s * 0.14, Math.PI, 0);
    } else if (key.includes("home") || key.includes("key")) {
      context.moveTo(-s * 0.52, -s * 0.02); context.lineTo(0, -s * 0.5); context.lineTo(s * 0.52, -s * 0.02); context.lineTo(s * 0.38, -s * 0.02); context.lineTo(s * 0.38, s * 0.5); context.lineTo(-s * 0.38, s * 0.5); context.lineTo(-s * 0.38, -s * 0.02); context.closePath();
    } else {
      for (let i = 0; i < 10; i += 1) { const a = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 ? s * 0.22 : s * 0.54; const px = Math.cos(a) * r; const py = Math.sin(a) * r; if (i === 0) context.moveTo(px, py); else context.lineTo(px, py); } context.closePath();
    }
    context.fill();
    context.stroke();
    context.restore();
  }

  function drawTinyCouple(x, y, color, timestamp, walking = false) {
    const step = walking ? Math.sin(timestamp * 0.008) * 2.2 : 0;
    context.save();
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 2.2;
    context.shadowColor = color;
    context.shadowBlur = 6;
    [[-7, step], [7, -step]].forEach(([offset, leg]) => {
      context.beginPath(); context.arc(x + offset, y - 13, 3.4, 0, Math.PI * 2); context.fill();
      context.beginPath(); context.moveTo(x + offset, y - 9); context.lineTo(x + offset, y + 4); context.lineTo(x + offset - 3, y + 12 + leg); context.moveTo(x + offset, y + 4); context.lineTo(x + offset + 3, y + 12 - leg); context.stroke();
    });
    context.beginPath(); context.moveTo(x - 3, y - 4); context.lineTo(x + 3, y - 4); context.stroke();
    context.restore();
  }

  function drawSceneArchitecture(zone, timestamp) {
    const x = zone.x;
    const y = zone.y;
    const glow = 0.34 + zone.reveal * 0.66;
    context.save();
    context.globalAlpha = glow;
    context.strokeStyle = zone.color;
    context.fillStyle = colorWithAlpha(zone.color, 0.12 + zone.reveal * 0.1);
    context.lineWidth = 2;
    context.shadowColor = zone.color;
    context.shadowBlur = zone.pulse > 0.04 ? zone.pulse * 18 : 0;
    if (zone.drawType === "corner-store") {
      context.fillRect(x - 62, y - 42, 124, 78); context.strokeRect?.(x - 62, y - 42, 124, 78);
      for (let i = 0; i < 5; i += 1) context.fillRect(x - 58 + i * 24, y - 54, 14, 10);
      context.fillStyle = colorWithAlpha("#f6d99b", 0.18 + zone.reveal * 0.3); context.fillRect(x - 48, y - 25, 42, 48); context.fillRect(x + 9, y - 25, 39, 25);
    } else if (zone.drawType === "coffee-window") {
      context.fillRect(x - 58, y - 45, 116, 84); context.strokeRect?.(x - 58, y - 45, 116, 84);
      context.beginPath(); context.moveTo(x, y - 45); context.lineTo(x, y + 39); context.moveTo(x - 58, y - 5); context.lineTo(x + 58, y - 5); context.stroke();
      drawMotifGlyph("coffee", x - 20, y + 12, 18, 0.84); drawMotifGlyph("coffee", x + 22, y + 12, 18, 0.84);
    } else if (zone.drawType === "late-cinema") {
      context.fillRect(x - 62, y - 38, 124, 72); context.strokeRect?.(x - 62, y - 38, 124, 72);
      context.fillStyle = colorWithAlpha("#f4e6c6", 0.14 + zone.reveal * 0.24); context.fillRect(x - 48, y - 24, 96, 32);
      for (let i = 0; i < 6; i += 1) { context.beginPath(); context.arc(x - 45 + i * 18, y + 23, 2.2, 0, Math.PI * 2); context.fill(); }
    } else if (zone.drawType === "river-walk") {
      for (let row = 0; row < 3; row += 1) { context.beginPath(); for (let i = 0; i < 7; i += 1) { const px = x - 62 + i * 21; const py = y + 11 + row * 11 + Math.sin(timestamp * 0.002 + i) * 3; if (i === 0) context.moveTo(px, py); else context.lineTo(px, py); } context.stroke(); }
      context.beginPath(); context.moveTo(x - 38, y - 5); context.lineTo(x + 38, y - 5); context.moveTo(x - 28, y - 5); context.lineTo(x - 34, y + 13); context.moveTo(x + 28, y - 5); context.lineTo(x + 34, y + 13); context.stroke();
    } else if (zone.drawType === "last-train") {
      context.beginPath(); context.moveTo(x - 67, y - 37); context.lineTo(x + 67, y - 37); context.lineTo(x + 51, y - 18); context.lineTo(x - 51, y - 18); context.closePath(); context.fill(); context.stroke();
      context.fillRect(x - 61, y - 10, 122, 38); context.strokeRect?.(x - 61, y - 10, 122, 38);
      const trainLight = ((timestamp * 0.05) % 90) - 45; context.fillStyle = colorWithAlpha("#f5dfa8", 0.5); context.fillRect(x + trainLight, y - 2, 20, 13);
    } else {
      context.beginPath(); context.moveTo(x - 68, y + 35); context.lineTo(x + 68, y + 35); context.stroke();
      [-45, 42].forEach((offset) => { context.fillRect(x + offset - 18, y - 28, 36, 62); context.strokeRect?.(x + offset - 18, y - 28, 36, 62); context.fillStyle = colorWithAlpha("#f6dc9a", 0.18 + zone.reveal * 0.34); context.fillRect(x + offset - 10, y - 16, 9, 13); context.fillRect(x + offset + 5, y + 3, 9, 13); });
      drawMotifGlyph("lamp", x, y - 3, 27, 0.82);
    }
    if (zone.motifs.some((motif) => String(motif).includes("rain"))) {
      context.save();
      context.globalAlpha = 0.24 + zone.reveal * 0.28;
      context.strokeStyle = "#bde3e5";
      context.lineWidth = 1;
      for (let index = 0; index < 8; index += 1) {
        const offset = (index * 23 + timestamp * 0.018) % 150 - 75;
        context.beginPath(); context.moveTo(x + offset, y - 66); context.lineTo(x + offset - 8, y - 43); context.stroke();
      }
      context.restore();
    }
    if (zone.motifs.some((motif) => String(motif).includes("camera"))) {
      context.save();
      context.globalAlpha = 0.14 + (Math.sin(timestamp * 0.006) + 1) * 0.08;
      context.fillStyle = "#fff8df";
      context.beginPath(); context.arc(x, y, 34, 0, Math.PI * 2); context.fill();
      context.restore();
    }
    if (zone.motifs.some((motif) => String(motif).includes("cat"))) {
      const catX = x - 42 + (timestamp * 0.018 + zone.visits * 17) % 84;
      drawMotifGlyph("cat", catX, y + 40, 10, 0.46 + zone.reveal * 0.28);
    }
    if (zone.motifs.some((motif) => String(motif).includes("sunset"))) {
      context.save();
      context.globalAlpha = 0.1 + zone.reveal * 0.12;
      context.fillStyle = "#ef9b7f";
      context.beginPath(); context.arc(x, y - 22, 58, Math.PI, Math.PI * 2); context.fill();
      context.restore();
    }
    zone.motifs.slice(-3).forEach((motif, index) => {
      drawMotifGlyph(motif, x - 28 + index * 28, y + 58, 12, 0.5 + zone.reveal * 0.42);
    });
    if (dateMapState.bestStreak >= 3 && zone.visits) drawTinyCouple(x, y - 66, "#ffe6b2", timestamp, dateMapState.activeStreak >= 3);
    context.restore();
  }

  function colorWithAlpha(color, alpha) {
    if (!color?.startsWith("#")) return color || `rgba(255,255,255,${alpha})`;
    const hex = color.slice(1);
    const expanded = hex.length === 3 ? hex.split("").map((value) => value + value).join("") : hex;
    const number = Number.parseInt(expanded, 16);
    return `rgba(${number >> 16 & 255},${number >> 8 & 255},${number & 255},${alpha})`;
  }

  function pointAlongDateRoute(path, ratio) {
    if (!path?.length) return null;
    if (path.length === 1) return { ...path[0], dx: 0, dy: -1 };
    const spans = [];
    let total = 0;
    for (let index = 1; index < path.length; index += 1) {
      const from = path[index - 1];
      const to = path[index];
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      spans.push({ from, to, length });
      total += length;
    }
    if (total <= 0.001) return { ...path[0], dx: 0, dy: -1 };
    let remaining = clamp(ratio, 0, 1) * total;
    for (const span of spans) {
      if (remaining <= span.length || span === spans.at(-1)) {
        const local = span.length > 0 ? clamp(remaining / span.length, 0, 1) : 0;
        return {
          x: span.from.x + (span.to.x - span.from.x) * local,
          y: span.from.y + (span.to.y - span.from.y) * local,
          dx: (span.to.x - span.from.x) / Math.max(span.length, 0.001),
          dy: (span.to.y - span.from.y) / Math.max(span.length, 0.001)
        };
      }
      remaining -= span.length;
    }
    return { ...path.at(-1), dx: 0, dy: -1 };
  }

  function drawDateRouteSparkle(x, y, size, alpha, color, prominent = false) {
    context.save();
    context.globalAlpha = alpha;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = prominent ? 1.15 : 0.72;
    if (prominent) {
      context.shadowColor = color;
      context.shadowBlur = size * 2.4;
    }
    context.beginPath();
    context.moveTo(x - size, y);
    context.quadraticCurveTo(x, y - size * 0.12, x + size, y);
    context.moveTo(x, y - size);
    context.quadraticCurveTo(x + size * 0.12, y, x, y + size);
    context.stroke();
    context.beginPath();
    context.arc(x, y, prominent ? 1.5 : 0.8, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawDateRoute(route, timestamp, finalBoost = 0) {
    if (!route.path?.length) return;
    const moving = dateMapState.flow > 0 || finalBoost > 0;
    context.save();
    context.globalCompositeOperation = "screen";
    const seed = Number(route.number || 1) * 1.73 + Number(route.pocketIndex || 0) * 2.31;
    const starCount = Math.min(18, 10 + route.path.length * 2 + (route.railHits ? 2 : 0));
    const baseSize = route.archetype === "power" ? 2.9 : route.archetype === "gentle" ? 1.65 : 2.2;
    for (let index = 0; index < starCount; index += 1) {
      const ratio = (index + 0.52) / starCount;
      const point = pointAlongDateRoute(route.path, ratio);
      if (!point) continue;
      const phase = seed + index * 2.399;
      const sway = Math.sin(phase) * (3.2 + index % 3 * 1.35);
      const drift = Math.cos(phase * 0.71) * 2.1;
      const x = point.x - point.dy * sway + point.dx * drift;
      const y = point.y + point.dx * sway + point.dy * drift;
      const twinkle = 0.58 + Math.sin(timestamp * 0.0032 + phase) * 0.28;
      const alpha = (0.16 + route.glow * 0.12 + finalBoost * 0.24) * twinkle;
      const color = index % 4 === 0 ? "#ffe4b4" : index % 3 === 0 ? "#ffd7e5" : route.color;
      drawDateRouteSparkle(x, y, baseSize + (index % 5 === 0 ? 1.25 : 0), alpha, color, index % 5 === 0);
    }
    if (moving) {
      const progress = (timestamp * (0.00022 + dateMapState.activeStreak * 0.000025)) % 1;
      const point = pointAlongDateRoute(route.path, progress);
      const glint = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, 22);
      glint.addColorStop(0, `rgba(255, 245, 216, ${0.42 + finalBoost * 0.34})`);
      glint.addColorStop(0.22, `rgba(255, 210, 226, ${0.18 + finalBoost * 0.18})`);
      glint.addColorStop(1, "rgba(255, 218, 231, 0)");
      context.fillStyle = glint;
      context.fillRect(point.x - 24, point.y - 24, 48, 48);
      drawDateRouteSparkle(point.x, point.y, 6.2, 0.72 + finalBoost * 0.2, "#fff0c8", true);
    }
    context.restore();
  }

  function drawDateConnections(timestamp) {
    if (dateMapState.bestStreak < 2 && !dateMapState.completed) return;
    dateMapState.links.forEach((link, index) => {
      const from = dateMapState.zones.get(link.from);
      const to = dateMapState.zones.get(link.to);
      if (!from || !to) return;
      const middle = { x: (from.x + to.x) / 2 + (index % 2 ? 28 : -28), y: (from.y + to.y) / 2 };
      context.save();
      context.globalCompositeOperation = "screen";
      context.globalAlpha = dateMapState.flow ? 0.12 : 0.055;
      context.strokeStyle = link.color;
      context.shadowColor = link.color;
      context.shadowBlur = 8;
      context.lineWidth = dateMapState.activeStreak >= 4 ? 2.8 : 1.8;
      context.lineCap = "round";
      context.setLineDash([1.5, dateMapState.activeStreak >= 4 ? 7 : 10]);
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.quadraticCurveTo(middle.x, middle.y, to.x, to.y);
      context.stroke();
      context.restore();
    });
  }

  function drawCueJourney() {
    if (!dateMapState.cueStops.length) return;
    context.save();
    dateMapState.cueStops.forEach((point) => {
      const radius = point.successful ? 24 : 15;
      const pool = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
      pool.addColorStop(0, point.successful ? "rgba(255, 231, 174, 0.18)" : "rgba(176, 205, 197, 0.08)");
      pool.addColorStop(1, "rgba(255, 239, 201, 0)");
      context.fillStyle = pool;
      context.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
    });
    context.restore();
  }

  function drawFinalDateShape(timestamp) {
    if (!dateMapState.ending || dateMapState.finalProgress <= 0) return;
    const progress = clamp(dateMapState.finalProgress, 0, 1);
    if (!dateMapState.completed) {
      context.save();
      context.globalCompositeOperation = "screen";
      context.globalAlpha = 0.14 + progress * 0.34;
      context.strokeStyle = "#94b4c4";
      context.shadowColor = "#6f96aa";
      context.shadowBlur = 10;
      context.lineWidth = 2.4;
      tracePoints([
        { x: WORLD.width / 2, y: 700 },
        { x: WORLD.width / 2 - 38, y: 820 },
        { x: WORLD.width / 2 - 150, y: 1000 },
        { x: TABLE.left + 34, y: TABLE.bottom - 40 }
      ]);
      context.stroke();
      tracePoints([
        { x: WORLD.width / 2, y: 700 },
        { x: WORLD.width / 2 + 38, y: 820 },
        { x: WORLD.width / 2 + 150, y: 1000 },
        { x: TABLE.right - 34, y: TABLE.bottom - 40 }
      ]);
      context.stroke();
      context.restore();
      return;
    }
    const points = [];
    for (let index = 0; index <= 80; index += 1) {
      const t = index / 80 * Math.PI * 2;
      points.push({
        x: WORLD.width / 2 + Math.sin(t) ** 3 * 150,
        y: 760 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 15
      });
    }
    context.save();
    context.globalCompositeOperation = "screen";
    context.globalAlpha = 0.1 + progress * 0.68;
    context.strokeStyle = "#f3c891";
    context.shadowColor = "#ef9aa9";
    context.shadowBlur = 12 + progress * 22;
    context.lineWidth = 2.2 + progress * 2.4;
    context.setLineDash([Math.max(1, progress * 1150), 1150]);
    context.lineDashOffset = 0;
    tracePoints(points);
    context.stroke();
    context.restore();
    drawTinyCouple(WORLD.width / 2, 940, "#fff0c8", timestamp, progress < 0.9);
  }

  function drawDateMap(timestamp) {
    const pendingPots = shotState?.pottedNumbers?.filter((number) => number > 0).length || 0;
    const litCount = Math.min(15, runState.pottedNumbers.length + pendingPots);
    const finalBoost = dateMapState.completed ? clamp(dateMapState.finalProgress, 0, 1) : 0;
    context.save();
    context.beginPath();
    context.moveTo(TABLE.left, TABLE.top);
    context.lineTo(TABLE.right, TABLE.top);
    context.lineTo(TABLE.right, TABLE.bottom);
    context.lineTo(TABLE.left, TABLE.bottom);
    context.closePath();
    context.clip();
    drawDateMapPhotoBase(litCount, finalBoost);
    dateMapState.zones.forEach((zone) => {
      if (!zone.visits && !finalBoost) return;
      drawPhotographicScene(zone, timestamp, finalBoost);
    });
    drawDateConnections(timestamp);
    dateMapState.routes.forEach((route) => drawDateRoute(route, timestamp, finalBoost));
    if (dateMapState.powerWave > 0.02) {
      context.save();
      context.globalCompositeOperation = "screen";
      const waveRadius = 62 + (1 - dateMapState.powerWave) * 250;
      const wave = context.createRadialGradient(lastStoryWorldOrigin.x, lastStoryWorldOrigin.y, waveRadius * 0.16, lastStoryWorldOrigin.x, lastStoryWorldOrigin.y, waveRadius);
      wave.addColorStop(0, "rgba(255, 229, 184, 0)");
      wave.addColorStop(0.72, `rgba(255, 204, 145, ${dateMapState.powerWave * 0.12})`);
      wave.addColorStop(1, "rgba(255, 206, 147, 0)");
      context.fillStyle = wave;
      context.fillRect(lastStoryWorldOrigin.x - waveRadius, lastStoryWorldOrigin.y - waveRadius, waveRadius * 2, waveRadius * 2);
      context.restore();
    }
    drawCueJourney();
    if (dateMapState.activeStreak >= 4 && dateMapClearCanvas) {
      context.save();
      context.globalCompositeOperation = "screen";
      context.globalAlpha = 0.045 + dateMapState.activeStreak * 0.012 + Math.sin(timestamp * 0.0025) * 0.012;
      context.drawImage(dateMapClearCanvas, 0, 0, WORLD.width, WORLD.height);
      context.restore();
    }
    drawFinalDateShape(timestamp);
    context.restore();

    context.save();
    RELATIONSHIP_SIGHTS.slice(0, litCount).forEach((sight, index) => {
      context.globalAlpha = index === litCount - 1 && pendingPots > 0 ? 0.92 : 0.36;
      context.fillStyle = index === litCount - 1 ? "#fff0c6" : "#d3b875";
      context.beginPath(); context.arc(sight.x, sight.y, index === litCount - 1 ? 4.8 : 3.2, 0, Math.PI * 2); context.fill();
    });
    context.restore();
  }

  function drawBall(ball, timestamp) {
    const data = bodyData(ball);
    if (!data || data.potted) return;
    const number = data.number;
    const pocketing = data.pocketing;
    const scale = pocketing?.scale ?? 1;
    const depth = pocketing?.depth ?? 0;
    const x = ball.position.x;
    const y = ball.position.y + depth * 13;
    const compression = data.compression;
    context.save();
    context.globalAlpha = 1 - depth * 0.52;
    context.translate(x, y);
    context.rotate(data.impactAngle);
    context.scale(1 - compression, 1 + compression * 0.52);
    context.rotate(-data.impactAngle);
    context.scale(scale, scale);
    context.shadowColor = "rgba(0, 0, 0, 0.52)";
    context.shadowBlur = 6 * (1 - depth * 0.6);
    context.shadowOffsetX = 3 * (1 - depth);
    context.shadowOffsetY = 5 + depth * 5;
    context.beginPath();
    context.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
    context.clip();
    context.rotate(data.rollAngle);
    if (number === 0) {
      const cueGradient = context.createRadialGradient(-5, -6, 1, 0, 0, BALL_RADIUS * 1.2);
      cueGradient.addColorStop(0, "#ffffff");
      cueGradient.addColorStop(0.58, "#eeeae0");
      cueGradient.addColorStop(1, "#89938d");
      context.fillStyle = cueGradient;
      context.fillRect(-BALL_RADIUS, -BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2);
      context.fillStyle = "rgba(136, 47, 48, 0.72)";
      context.beginPath();
      context.arc(0, -BALL_RADIUS * 0.62, 1.6, 0, Math.PI * 2);
      context.fill();
    } else {
      const color = BALL_COLORS[number];
      const stripe = number > 8;
      context.fillStyle = stripe ? "#f3eee1" : color;
      context.fillRect(-BALL_RADIUS * 1.5, -BALL_RADIUS * 1.5, BALL_RADIUS * 3, BALL_RADIUS * 3);
      if (stripe) {
        context.fillStyle = color;
        context.fillRect(-BALL_RADIUS * 1.5, -BALL_RADIUS * 0.48, BALL_RADIUS * 3, BALL_RADIUS * 0.96);
      }
      const shade = context.createRadialGradient(-5, -6, 1, 2, 3, BALL_RADIUS * 1.22);
      shade.addColorStop(0, "rgba(255,255,255,0.38)");
      shade.addColorStop(0.36, "rgba(255,255,255,0.02)");
      shade.addColorStop(1, "rgba(0,0,0,0.46)");
      context.fillStyle = shade;
      context.fillRect(-BALL_RADIUS, -BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2);
      drawMotifGlyph(motifForBall(number), 0, BALL_RADIUS * 0.62, 3.8, 0.72);
      context.fillStyle = "#f7f2e7";
      context.beginPath();
      context.arc(0, 0, 6.6, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#191c1c";
      context.font = "700 7.2px system-ui, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(number), 0, 0.4);
    }
    const highlight = context.createRadialGradient(-5.5, -6.2, 0.4, -5.5, -6.2, 5.2);
    highlight.addColorStop(0, "rgba(255,255,255,0.92)");
    highlight.addColorStop(0.36, "rgba(255,255,255,0.46)");
    highlight.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = highlight;
    context.beginPath();
    context.arc(-5.5, -6.2, 5.2, 0, Math.PI * 2);
    context.fill();
    context.restore();

    if (data.impactGlow > 0 && !pocketing) {
      context.save();
      context.globalAlpha = data.impactGlow;
      context.strokeStyle = number === 0 ? "#f7f2e7" : BALL_COLORS[number];
      context.lineWidth = 1.5 + data.impactGlow * 1.2;
      context.beginPath();
      context.arc(x, y, BALL_RADIUS + 3 + (1 - data.impactGlow) * 8, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }

    const available = number > 0 && !shotState && !pocketing && cachedAvailableTargets.has(number);
    if (number === selectedBallNumber || available) {
      const pulse = 0.5 + Math.sin(timestamp / 320 + number) * 0.5;
      context.save();
      context.strokeStyle = number === selectedBallNumber ? "rgba(244, 207, 125, 0.95)" : `rgba(126, 204, 185, ${0.38 + pulse * 0.25})`;
      context.lineWidth = number === selectedBallNumber ? 2.4 : 1.4;
      context.beginPath();
      context.arc(x, y, BALL_RADIUS + 5 + pulse * 2, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
  }

  function disableBallRenderer() {
    const failedRenderer = ballRenderer;
    const failedCanvas = ballRendererCanvas;
    ballRenderer = null;
    ballRendererCanvas = null;
    ballRendererFailed = true;
    if (failedCanvas?.style) failedCanvas.style.visibility = "hidden";
    try {
      failedRenderer?.dispose?.();
    } catch {
      // The 2D renderer remains available even if WebGL teardown also fails.
    }
  }

  function resizeBallRenderer() {
    if (!ballRenderer || !ballRendererCanvas) return false;
    try {
      const rect = ballRendererCanvas.getBoundingClientRect();
      const pixelRatio = Math.max(1, Math.min(renderScale, MAX_BALL_RENDER_SCALE));
      ballRenderer.resize(Math.max(1, rect.width), Math.max(1, rect.height), pixelRatio);
      if (ballRenderer.supported === false) throw new Error("BilliardsBallRenderer resize failed");
      return true;
    } catch {
      disableBallRenderer();
      return false;
    }
  }

  function initializeBallRenderer() {
    const Renderer = window.BilliardsBallRenderer;
    const rendererCanvas = document.querySelector("#hb-ball-canvas");
    const factory = typeof Renderer?.create === "function" ? Renderer.create.bind(Renderer) : null;
    if ((!factory && typeof Renderer !== "function") || !rendererCanvas) return false;
    try {
      ballRendererCanvas = rendererCanvas;
      rendererCanvas.style.visibility = "visible";
      const options = {
        canvas: rendererCanvas,
        worldWidth: WORLD.width,
        worldHeight: WORLD.height,
        world: { ...WORLD },
        table: { ...TABLE },
        ballRadius: BALL_RADIUS,
        colors: BALL_COLORS,
        pixelRatio: Math.max(1, Math.min(renderScale, MAX_BALL_RENDER_SCALE))
      };
      ballRenderer = factory ? factory(options) : new Renderer(options);
      if (typeof ballRenderer?.resize !== "function"
          || typeof ballRenderer?.sync !== "function"
          || typeof ballRenderer?.render !== "function"
          || ballRenderer.supported === false) {
        throw new Error("BilliardsBallRenderer adapter is incomplete");
      }
      return resizeBallRenderer();
    } catch {
      disableBallRenderer();
      return false;
    }
  }

  function syncBallRenderer(timestamp) {
    if (!ballRenderer) return false;
    try {
      const renderBalls = balls
        .filter((ball) => !bodyData(ball)?.potted)
        .map((ball) => {
          const data = bodyData(ball);
          return {
            number: data.number,
            x: ball.position.x,
            y: ball.position.y,
            radius: BALL_RADIUS,
            color: data.number === 0 ? "#f5f0e7" : BALL_COLORS[data.number],
            striped: data.number > 8,
            rollAngle: data.rollAngle,
            rollHeading: data.rollHeading,
            scale: data.pocketing?.scale ?? 1,
            depth: data.pocketing?.depth ?? 0,
            compression: data.compression,
            impactAngle: data.impactAngle,
            impactGlow: data.impactGlow,
            selected: data.number === selectedBallNumber,
            available: data.number > 0 && !shotState && cachedAvailableTargets.has(data.number)
          };
        });
      ballRenderer.sync(renderBalls, {
        timestamp,
        world: WORLD,
        table: TABLE,
        ballRadius: BALL_RADIUS
      });
      if (ballRenderer.supported === false) {
        disableBallRenderer();
        return false;
      }
      const rendered = ballRenderer.render(timestamp);
      if (rendered === false || ballRenderer.supported === false) {
        disableBallRenderer();
        return false;
      }
      return true;
    } catch {
      disableBallRenderer();
      return false;
    }
  }

  function drawAim() {
    if (!cueBall || shotState || resolvingShot || cinematicActive || resultVisible) return;
    refreshAimLock();
    const trace = traceAim();
    if (!trace) return;
    const contactNumber = bodyData(trace.hitBall)?.number;
    const correct = !runState.breakCompleted || (contactNumber && cachedAvailableTargets.has(contactNumber));
    if (aimAssist) {
      context.save();
      context.lineWidth = 1.35;
      context.setLineDash([8, 7]);
      context.strokeStyle = correct || !runState.breakCompleted ? "rgba(235, 210, 154, 0.78)" : "rgba(229, 119, 112, 0.62)";
      context.beginPath();
      context.moveTo(trace.origin.x, trace.origin.y);
      context.lineTo(trace.impact.x, trace.impact.y);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = context.strokeStyle;
      context.beginPath();
      context.arc(trace.impact.x, trace.impact.y, 3.2, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
    drawCueStick(trace.direction, pointerAim?.power || 0);
  }

  function drawCueStick(direction, power) {
    if (!cueBall) return;
    const back = { x: -direction.x, y: -direction.y };
    const startDistance = BALL_RADIUS + 9 + power * 44;
    const cueLength = 245;
    const start = { x: cueBall.position.x + back.x * startDistance, y: cueBall.position.y + back.y * startDistance };
    const end = { x: start.x + back.x * cueLength, y: start.y + back.y * cueLength };
    const gradient = context.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, "#e5d0a0");
    gradient.addColorStop(0.68, "#9a6239");
    gradient.addColorStop(1, "#35241c");
    context.save();
    context.strokeStyle = "rgba(0,0,0,0.38)";
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(start.x + 3, start.y + 4);
    context.lineTo(end.x + 3, end.y + 4);
    context.stroke();
    context.strokeStyle = gradient;
    context.lineWidth = 5.5;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    context.restore();
    if (pointerAim) drawCuePowerGauge(direction, pointerAim.pullRatio);
  }

  function drawCuePowerGauge(direction, pullRatio) {
    if (!cueBall) return;
    const colors = ["#d899ba", "#efc37f", "#ed6687"];
    const zoneBoundaries = [0, LIGHT_PULL_END, STRONG_PULL_START, 1];
    const center = cueBall.position;
    const radius = BALL_RADIUS + 22;
    const gapHalfAngle = Math.PI * 0.41;
    const backAngle = Math.atan2(direction.y, direction.x) + Math.PI;
    const arcStart = backAngle + gapHalfAngle;
    const arcSpan = Math.PI * 2 - gapHalfAngle * 2;
    const arcEnd = arcStart + arcSpan;
    const arcFraction = arcSpan / (Math.PI * 2);
    const activeRatio = clamp(pullRatio, 0, 1);
    const gradient = typeof context.createConicGradient === "function"
      ? context.createConicGradient(arcStart, center.x, center.y)
      : context.createLinearGradient(center.x - radius, center.y - radius, center.x + radius, center.y + radius);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(arcFraction * LIGHT_PULL_END, colors[0]);
    gradient.addColorStop(arcFraction * STRONG_PULL_START, colors[1]);
    gradient.addColorStop(arcFraction, colors[2]);
    gradient.addColorStop(1, colors[2]);
    context.save();
    context.lineCap = "round";
    context.globalAlpha = 0.15;
    context.shadowBlur = 0;
    context.strokeStyle = gradient;
    context.lineWidth = 1.35;
    context.beginPath();
    context.arc(center.x, center.y, radius, arcStart, arcEnd);
    context.stroke();

    zoneBoundaries.slice(1, -1).forEach((boundary) => {
      const angle = arcStart + arcSpan * boundary;
      const nodeX = center.x + Math.cos(angle) * radius;
      const nodeY = center.y + Math.sin(angle) * radius;
      context.globalAlpha = boundary <= activeRatio ? 0.82 : 0.34;
      context.fillStyle = boundary < STRONG_PULL_START ? colors[1] : colors[2];
      context.shadowColor = context.fillStyle;
      context.shadowBlur = boundary <= activeRatio ? 4 : 0;
      context.beginPath();
      context.arc(nodeX, nodeY, 1.35, 0, Math.PI * 2);
      context.fill();
    });

    if (activeRatio > 0) {
      const activeEndAngle = arcStart + arcSpan * activeRatio;
      const activeEndX = center.x + Math.cos(activeEndAngle) * radius;
      const activeEndY = center.y + Math.sin(activeEndAngle) * radius;
      const activeColor = activeRatio < LIGHT_PULL_END ? colors[0] : activeRatio < STRONG_PULL_START ? colors[1] : colors[2];
      context.strokeStyle = gradient;
      context.shadowColor = activeColor;
      context.lineCap = "round";
      context.shadowBlur = 2;
      const segmentCount = 52;
      for (let index = 0; index < segmentCount; index += 1) {
        const from = index / segmentCount;
        if (from >= activeRatio) break;
        const to = Math.min(activeRatio, (index + 1.15) / segmentCount);
        const relativeMidpoint = (from + to) / (2 * activeRatio);
        const profile = Math.sin(Math.PI * clamp(relativeMidpoint, 0, 1));
        context.globalAlpha = 0.76 + profile * 0.24;
        context.lineWidth = 2.4 + profile * 2.1;
        context.beginPath();
        context.arc(center.x, center.y, radius, arcStart + arcSpan * from, arcStart + arcSpan * to);
        context.stroke();
      }
      context.shadowBlur = 4;
      context.globalAlpha = 1;
      context.translate(activeEndX, activeEndY);
      context.rotate(activeEndAngle + Math.PI / 4);
      context.fillStyle = activeColor;
      context.strokeStyle = "rgba(255, 248, 231, 0.9)";
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(0, -3.6);
      context.lineTo(2.1, 0);
      context.lineTo(0, 3.6);
      context.lineTo(-2.1, 0);
      context.closePath();
      context.fill();
      context.stroke();
    }
    if (pointerAim?.lockedDirection) {
      context.globalAlpha = 0.92;
      context.strokeStyle = "#f4d59a";
      context.shadowColor = "#f4c978";
      context.shadowBlur = 7;
      context.lineWidth = 1.7;
      context.setLineDash([]);
      context.beginPath();
      context.arc(center.x, center.y, radius + 5, backAngle - 0.24, backAngle + 0.24);
      context.stroke();
      const lockX = center.x + Math.cos(backAngle) * (radius + 5);
      const lockY = center.y + Math.sin(backAngle) * (radius + 5);
      context.fillStyle = "#fff0c8";
      context.beginPath();
      context.arc(lockX, lockY, 2.5, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  function drawEffects() {
    context.save();
    particles.forEach((particle) => {
      context.globalAlpha = particle.life;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
      context.fill();
    });
    pocketBursts.forEach((burst) => {
      context.globalAlpha = burst.life;
      context.strokeStyle = burst.color;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(burst.x, burst.y, 14 + (1 - burst.life) * 35, 0, Math.PI * 2);
      context.stroke();
    });
    collisionFeedbacks.forEach((feedback) => {
      context.globalAlpha = feedback.life * feedback.intensity;
      context.strokeStyle = feedback.color;
      context.lineWidth = 1.2 + feedback.life * 2.2;
      context.beginPath();
      context.arc(feedback.x, feedback.y, feedback.radius, 0, Math.PI * 2);
      context.stroke();
    });
    context.restore();
  }

  function draw(timestamp) {
    context.setTransform(canvas.width / WORLD.width, 0, 0, canvas.height / WORLD.height, 0, 0);
    context.clearRect(0, 0, WORLD.width, WORLD.height);
    context.save();
    if (screenShake > 0.08) context.translate(Math.sin(timestamp * 0.1) * screenShake, Math.cos(timestamp * 0.13) * screenShake * 0.55);
    drawTableLayer();
    drawDateMap(timestamp);
    const renderedByBallRenderer = syncBallRenderer(timestamp);
    if (!renderedByBallRenderer) {
      balls.slice().sort((left, right) => left.position.y - right.position.y).forEach((ball) => drawBall(ball, timestamp));
    }
    drawAim();
    drawEffects();
    context.restore();
    if (screenFlash > 0.01) {
      context.save();
      context.globalAlpha = screenFlash;
      const flash = context.createRadialGradient(
        lastStoryWorldOrigin.x,
        lastStoryWorldOrigin.y,
        0,
        lastStoryWorldOrigin.x,
        lastStoryWorldOrigin.y,
        WORLD.height * 0.42
      );
      flash.addColorStop(0, "rgba(255, 239, 196, 0.98)");
      flash.addColorStop(0.12, "rgba(255, 224, 164, 0.42)");
      flash.addColorStop(0.42, "rgba(222, 169, 113, 0.1)");
      flash.addColorStop(1, "rgba(255, 231, 176, 0)");
      context.fillStyle = flash;
      context.fillRect(0, 0, WORLD.width, WORLD.height);
      context.restore();
    }
  }

  function physicsStep() {
    captureBallPositions();
    Engine.update(engine, FIXED_STEP);
    simulationTime += FIXED_STEP;
    updatePockets();
    updateRollingState();
    updatePocketing();
    containLooseBalls();
    settleBalls();
    updateEffects();
  }

  function frame(timestamp) {
    const delta = Math.min(50, Math.max(0, timestamp - lastFrameAt));
    lastFrameAt = timestamp;
    if (!cinematicActive && !resultVisible) {
      const storyTimeScale = timestamp < storySlowMotionUntil ? POCKET_STORY_TIME_SCALE : 1;
      accumulator += delta * storyTimeScale;
      let steps = 0;
      while (accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
        physicsStep();
        accumulator -= FIXED_STEP;
        steps += 1;
      }
      if (steps === MAX_STEPS_PER_FRAME) accumulator = 0;
    } else {
      accumulator = 0;
      updateEffects();
    }
    // Cinematics cover the table; the result sheet does not. Keep the completed
    // map alive behind the result so the ending remains on the cloth.
    if (!cinematicActive) draw(timestamp);
    frameHandle = requestAnimationFrame(frame);
  }

  function impactBall(body, angle, relativeSpeed) {
    const data = bodyData(body);
    if (!data || data.potted || data.pocketing) return;
    data.impactAngle = angle;
    data.compression = Math.max(data.compression, clamp(relativeSpeed / 62, 0.025, 0.18));
    data.impactGlow = Math.max(data.impactGlow, clamp(relativeSpeed / 24, 0.18, 1));
  }

  Events.on(engine, "collisionStart", (event) => {
    if (!shotState) return;
    event.pairs.forEach(({ bodyA, bodyB, collision }) => {
      const dataA = bodyData(bodyA);
      const dataB = bodyData(bodyB);
      if (dataA && dataB) {
        const relative = collision?.details?.incidentSpeed
          ?? Math.hypot(bodyA.velocity.x - bodyB.velocity.x, bodyA.velocity.y - bodyB.velocity.y);
        const normal = collision?.normal || normalize({ x: bodyB.position.x - bodyA.position.x, y: bodyB.position.y - bodyA.position.y });
        impactBall(bodyA, Math.atan2(normal.y, normal.x), relative);
        impactBall(bodyB, Math.atan2(normal.y, normal.x) + Math.PI, relative);
        collisionCount += 1;
        audio.collision(relative);
        if (shotState.firstContact === null) {
          if (dataA.number === 0 && dataB.number > 0) shotState.firstContact = dataB.number;
          if (dataB.number === 0 && dataA.number > 0) shotState.firstContact = dataA.number;
        }
        if (dataA.number > 0 && dataB.number > 0) {
          const pair = [dataA.number, dataB.number].sort((left, right) => left - right).join(":");
          shotState.objectContactPairs.add(pair);
          shotState.objectContacts = shotState.objectContactPairs.size;
        }
        const contact = collision?.supports?.[0] || {
          x: (bodyA.position.x + bodyB.position.x) / 2,
          y: (bodyA.position.y + bodyB.position.y) / 2
        };
        collisionFeedbacks.push({
          x: contact.x,
          y: contact.y,
          radius: 4,
          speed: 2.4 + Math.min(3.6, relative * 0.08),
          life: 1,
          intensity: clamp(relative / 16, 0.3, 1),
          color: "#e8fff7"
        });
        if (collisionFeedbacks.length > 24) collisionFeedbacks.splice(0, collisionFeedbacks.length - 24);
        spawnParticles(contact.x, contact.y, "#d9ede4", Math.min(4, Math.ceil(relative / 4)));
        screenShake = Math.max(screenShake, Math.min(2.8, relative * 0.06));
      }
      if (dataA && isRail(bodyB)) {
        dataA.shotRailHits += 1;
        if (bodyB.plugin.heartbeatRail.kind === "jaw") dataA.shotJawHits += 1;
        recordRailImpact(bodyA, bodyB, collision);
        const impactSpeed = collision?.details?.incidentSpeed ?? bodyA.speed;
        impactBall(bodyA, Math.atan2(-bodyA.velocity.y, -bodyA.velocity.x), impactSpeed);
        audio.rail(impactSpeed);
      }
      if (dataB && isRail(bodyA)) {
        dataB.shotRailHits += 1;
        if (bodyA.plugin.heartbeatRail.kind === "jaw") dataB.shotJawHits += 1;
        recordRailImpact(bodyB, bodyA, collision);
        const impactSpeed = collision?.details?.incidentSpeed ?? bodyB.speed;
        impactBall(bodyB, Math.atan2(-bodyB.velocity.y, -bodyB.velocity.x), impactSpeed);
        audio.rail(impactSpeed);
      }
    });
  });

  canvas.addEventListener("pointerdown", (event) => {
    audio.unlock();
    if (event.isPrimary === false) return;
    if (!canInteract()) return;
    event.preventDefault();
    const point = pointerToWorld(event);
    beginAim(event, point);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!pointerAim || event.pointerId !== pointerAim.id) return;
    event.preventDefault();
    updateAim(pointerToWorld(event));
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!pointerAim || event.pointerId !== pointerAim.id) return;
    event.preventDefault();
    if (!refreshAimLock()) updateAim(pointerToWorld(event), { release: true });
    releaseAim(event, true);
  });

  canvas.addEventListener("pointercancel", (event) => releaseAim(event, false));
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  window.addEventListener("keydown", (event) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName)) return;
    if (event.key === "Escape") {
      if (cinematicActive) {
        event.preventDefault();
        closeCinematic();
      }
      return;
    }
    if (!canInteract()) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const angle = Math.atan2(aimDirection.y, aimDirection.x) + (event.key === "ArrowLeft" ? -0.035 : 0.035);
      aimDirection = { x: Math.cos(angle), y: Math.sin(angle) };
      return;
    }
    if (event.key === " " && !event.repeat) {
      event.preventDefault();
      shoot(aimDirection, 0.52);
    }
  });

  elements.sound.addEventListener("click", () => {
    audio.toggle();
    syncUI();
  });
  elements.aimToggle.addEventListener("click", () => {
    aimAssist = !aimAssist;
    const settings = readStorage(SETTINGS_KEY, {});
    writeStorage(SETTINGS_KEY, { ...settings, aimAssist });
    syncUI();
  });
  elements.retry.addEventListener("click", () => {
    elements.result.hidden = true;
    resultVisible = false;
    resetGame();
    canvas.focus({ preventScroll: true });
  });
  elements.cinematicSkip.addEventListener("click", closeCinematic);
  elements.cinematicAction.addEventListener("click", closeCinematic);

  function resetFrameTiming() {
    accumulator = 0;
    lastFrameAt = performance.now();
  }

  document.addEventListener("visibilitychange", resetFrameTiming);
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) cancelAnimationFrame(frameHandle);
  });
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    cancelAnimationFrame(frameHandle);
    accumulator = 0;
    lastFrameAt = performance.now();
    resizeCanvas();
    frameHandle = requestAnimationFrame(frame);
  });

  configurePortraitSurface();
  initializeBallRenderer();
  buildRails();
  buildTimeline();
  rackBalls();
  if (coachSeen) elements.coach.classList.add("is-gone");
  syncUI();
  root.dataset.state = "break";
  frameHandle = requestAnimationFrame(frame);

  window.__heartbeatBilliardsDebug = Object.freeze({
    mapClientPoint(clientX, clientY, rect) {
      return Object.freeze(clientPointToWorld(clientX, clientY, rect));
    },
    powerForPullRatio(ratio) {
      return powerFromPullRatio(ratio);
    },
    classifyShot(shot) {
      return content.analyzeShot(shot || {});
    },
    orderPots(shot) {
      return Object.freeze(orderedPottedNumbers(shot || {}));
    },
    visibilityChange() {
      resetFrameTiming();
      return this.snapshot();
    },
    snapshot() {
      return Object.freeze({
        started: true,
        selectedBallNumber,
        runState,
        moving: Boolean(shotState),
        collisionCount,
        collisionFeedbackCount: collisionFeedbacks.length,
        shotPottedNumbers: Object.freeze([...(shotState?.pottedNumbers || [])]),
        shotTelemetry: shotState ? Object.freeze({
          launchPower: shotState.launchPower,
          launchSpeed: shotState.launchSpeed,
          launchDirection: Object.freeze({ ...shotState.launchDirection }),
          objectContacts: shotState.objectContacts,
          closestPocketDistance: shotState.closestPocketDistance,
          pottedDetails: Object.freeze(shotState.pottedDetails.map((detail) => Object.freeze({
            ...detail,
            path: Object.freeze(detail.path.map((point) => Object.freeze({ ...point })))
          })))
        }) : null,
        aim: pointerAim ? Object.freeze({
          start: Object.freeze({ ...pointerAim.start }),
          current: Object.freeze({ ...pointerAim.current }),
          direction: Object.freeze({ ...pointerAim.direction }),
          locked: Boolean(pointerAim.lockedDirection),
          lockedDirection: pointerAim.lockedDirection ? Object.freeze({ ...pointerAim.lockedDirection }) : null,
          directionStableForMs: Math.max(0, performance.now() - pointerAim.directionChangedAt),
          pullRatio: pointerAim.pullRatio,
          power: pointerAim.power
        }) : null,
        input: Object.freeze({
          minPull: MIN_PULL,
          maxPull: MAX_PULL,
          lightPullEnd: LIGHT_PULL_END,
          strongPullStart: STRONG_PULL_START,
          lightPowerMax: LIGHT_POWER_MAX,
          strongPowerMin: STRONG_POWER_MIN,
          aimLockDelayMs: AIM_LOCK_DELAY_MS,
          aimLockBreakAngle: AIM_LOCK_BREAK_ANGLE,
          minShotSpeed: MIN_SHOT_SPEED,
          maxShotSpeed: MAX_SHOT_SPEED
        }),
        presentation: Object.freeze({
          tableMomentActive,
          tableMomentArchetype: tableMomentCurrent?.archetype || null,
          tableMomentScene: elements.tableMomentScene.textContent || null,
          tableMomentTitle: elements.tableMomentTitle.textContent || null,
          storyTrailCount: storyTrails.length,
          dateMap: Object.freeze({
            litScenes: [...dateMapState.zones.values()].filter((zone) => zone.visits > 0).length,
            routes: dateMapState.routes.length,
            links: dateMapState.links.length,
            cueStops: dateMapState.cueStops.length,
            activeStreak: dateMapState.activeStreak,
            completed: dateMapState.completed,
            finalProgress: dateMapState.finalProgress,
            lastPocketId: dateMapState.lastPocketId,
            style: Object.freeze({ ...dateMapState.style })
          }),
          microVisible: !elements.micro.hidden,
          microQueued: microQueue.length,
          microType: elements.micro.dataset.type || null,
          microTitle: elements.microTitle.textContent || null,
          cinematicActive,
          cinematicQueued: cinematicQueue.length,
          nextCinematicStageId: cinematicQueue[0]?.stageId || null,
          cinematicStageId: cinematicCurrent?.stageId || null,
          cinematicTitle: cinematicCurrent?.title || null,
          cinematicImage: elements.cinematicImage.style.backgroundImage || null
        }),
        world: Object.freeze({ ...WORLD }),
        table: Object.freeze({ ...TABLE }),
        physics: Object.freeze({
          model: Physics.CONFIG.model,
          reference: Physics.CONFIG.reference,
          fixedStepMs: FIXED_STEP,
          fixedHz: FIXED_HZ,
          slidingFriction: Physics.CONFIG.slidingFriction,
          rollingFriction: Physics.CONFIG.rollingFriction,
          rollingSpeedDrag: Physics.CONFIG.rollingSpeedDrag,
          ballRestitution: Physics.CONFIG.ballRestitution,
          cushionRestitutionMin: Physics.CONFIG.cushionRestitutionMin,
          cushionRestitutionMax: Physics.CONFIG.cushionRestitutionMax,
          cushionFriction: Physics.CONFIG.cushionFriction,
          jawRestitution: Physics.CONFIG.jawRestitution,
          solverSubsteps: engine.metrics.substeps,
          pocketMouthDepthTolerance: POCKET_MOUTH_DEPTH_TOLERANCE,
          pocketShelfDepthTolerance: POCKET_SHELF_DEPTH_TOLERANCE,
          pocketLipSettleRatio: POCKET_LIP_SETTLE_RATIO,
          pocketVisualCaptureRatio: POCKET_VISUAL_CAPTURE_RATIO,
          pocketMagnetism: false
        }),
        audio: audio.snapshot(),
        wpaPocketSpec: Object.freeze({
          ballDiameter: BALL_DIAMETER,
          cornerMouth: CORNER_POCKET_MOUTH,
          sideMouth: SIDE_POCKET_MOUTH,
          cornerMouthRatio: CORNER_POCKET_MOUTH / BALL_DIAMETER,
          sideMouthRatio: SIDE_POCKET_MOUTH / BALL_DIAMETER,
          cornerShelf: CORNER_POCKET_SHELF,
          sideShelf: SIDE_POCKET_SHELF,
          cornerCutAngleDegrees: CORNER_CUT_ANGLE_DEGREES,
          sideCutAngleDegrees: SIDE_CUT_ANGLE_DEGREES
        }),
        pockets: Object.freeze(POCKETS.map((pocket) => Object.freeze({ ...pocket }))),
        rails: Object.freeze(rails.map((rail) => Object.freeze({
          id: rail.plugin.heartbeatRail.id,
          kind: rail.plugin.heartbeatRail.kind,
          angle: rail.angle,
          isStatic: rail.isStatic,
          x: rail.position.x,
          y: rail.position.y,
          width: rail.plugin.heartbeatRail.width,
          height: rail.plugin.heartbeatRail.height,
          pocketId: rail.plugin.heartbeatRail.pocketId || null,
          cutAngleDegrees: rail.plugin.heartbeatRail.cutAngleDegrees || null,
          headingDegrees: rail.plugin.heartbeatRail.headingDegrees ?? null,
          mouthSide: rail.plugin.heartbeatRail.mouthSide ?? null,
          noseX: rail.plugin.heartbeatRail.noseX ?? null,
          noseY: rail.plugin.heartbeatRail.noseY ?? null
        }))),
        ballRenderer: Object.freeze({
          active: Boolean(ballRenderer),
          failed: ballRendererFailed,
          canvas: Boolean(ballRendererCanvas)
        }),
        render: Object.freeze({ width: canvas.width, height: canvas.height, scale: renderScale }),
        ballNumbers: Object.freeze(balls.map((ball) => bodyData(ball).number).sort((a, b) => a - b)),
        balls: Object.freeze(balls.map((ball) => Object.freeze({
          number: bodyData(ball).number,
          x: ball.position.x,
          y: ball.position.y,
          vx: ball.velocity.x,
          vy: ball.velocity.y,
          motionState: ball.physics?.state || null,
          spinX: ball.physics?.spinX || 0,
          spinY: ball.physics?.spinY || 0,
          spinZ: ball.physics?.spinZ || 0,
          rollAngle: bodyData(ball).rollAngle,
          rollVelocity: bodyData(ball).rollVelocity,
          shotRailHits: bodyData(ball).shotRailHits,
          shotJawHits: bodyData(ball).shotJawHits,
          shotTravel: bodyData(ball).shotTravel,
          pocketMouthEntries: bodyData(ball).pocketMouthEntries,
          outsideSteps: bodyData(ball).outsideSteps,
          pocketApproach: bodyData(ball).pocketApproach ? Object.freeze({
            pocketId: bodyData(ball).pocketApproach.pocketId,
            enteredAt: bodyData(ball).pocketApproach.enteredAt,
            captureCrossed: bodyData(ball).pocketApproach.captureCrossed,
            mouthCrossX: bodyData(ball).pocketApproach.mouthCrossX,
            mouthCrossY: bodyData(ball).pocketApproach.mouthCrossY,
            captureCrossX: bodyData(ball).pocketApproach.captureCrossX,
            captureCrossY: bodyData(ball).pocketApproach.captureCrossY,
            maximumDepth: bodyData(ball).pocketApproach.maximumDepth
          }) : null,
          lastRailImpact: bodyData(ball).lastRailImpact
            ? Object.freeze({ ...bodyData(ball).lastRailImpact })
            : null,
          compression: bodyData(ball).compression,
          impactGlow: bodyData(ball).impactGlow,
          pocketing: bodyData(ball).pocketing ? Object.freeze({
            pocketId: bodyData(ball).pocketing.pocketId,
            elapsedMs: bodyData(ball).pocketing.elapsed,
            durationMs: bodyData(ball).pocketing.duration,
            scale: bodyData(ball).pocketing.scale,
            depth: bodyData(ball).pocketing.depth,
            rotation: bodyData(ball).pocketing.rotation
          }) : null
        }))),
        cue: cueBall ? Object.freeze({ x: cueBall.position.x, y: cueBall.position.y }) : null
      });
    },
    select(number) {
      selectTarget(number);
    },
    shoot(power = 0.5, direction = aimDirection) {
      return shoot(normalize(direction), clamp(power, 0, 1));
    },
    step(count = 1) {
      const steps = clamp(Math.trunc(count), 1, 20000);
      for (let index = 0; index < steps; index += 1) physicsStep();
      return this.snapshot();
    },
    renderFrame(timestamp = simulationTime) {
      draw(timestamp);
      return this.snapshot();
    },
    placeBall(number, point, velocity = { x: 0, y: 0 }) {
      const ball = ballByNumber(number);
      if (!ball) return false;
      const data = bodyData(ball);
      Body.setPosition(ball, { x: point.x, y: point.y });
      Body.setVelocity(ball, { x: velocity.x || 0, y: velocity.y || 0 });
      data.lastPosition = { x: point.x, y: point.y };
      data.previousPosition = { x: point.x, y: point.y };
      data.preStepVelocity = { x: velocity.x || 0, y: velocity.y || 0 };
      data.pocketApproach = null;
      data.lastRailImpact = null;
      if (point.x >= TABLE.left + BALL_RADIUS && point.x <= TABLE.right - BALL_RADIUS
          && point.y >= TABLE.top + BALL_RADIUS && point.y <= TABLE.bottom - BALL_RADIUS) {
        data.lastSafePosition = { x: point.x, y: point.y };
      }
      data.outsideSteps = 0;
      return true;
    },
    isolateBall(number = 0) {
      const ball = ballByNumber(number);
      if (!ball) return false;
      balls.forEach((candidate) => {
        if (candidate !== ball) Composite.remove(engine.world, candidate);
      });
      balls = [ball];
      cueBall = number === 0 ? ball : null;
      return true;
    },
    presentShot(shot) {
      if (shotState || runState.endState.ended) return false;
      const completedShot = {
        pottedNumbers: [...(shot?.pottedNumbers || [])],
        cueScratch: Boolean(shot?.cueScratch),
        breakShot: Boolean(shot?.breakShot),
        bankedNumbers: [...(shot?.bankedNumbers || [])],
        pottedDetails: [...(shot?.pottedDetails || [])],
        objectContacts: Number(shot?.objectContacts) || 0,
        closestPocketDistance: Number.isFinite(shot?.closestPocketDistance) ? shot.closestPocketDistance : Infinity,
        launchPower: Number.isFinite(shot?.launchPower) ? shot.launchPower : 0.52,
        cueEnd: shot?.cueEnd ? { x: shot.cueEnd.x, y: shot.cueEnd.y } : null,
        dateRouteIds: [],
        storyShown: false
      };
      const outcome = rules.evaluateShot(runState, {
        pottedNumbers: orderedPottedNumbers(completedShot),
        cueScratch: completedShot.cueScratch,
        breakShot: completedShot.breakShot,
        bankedNumbers: completedShot.bankedNumbers
      });
      runState = outcome.state;
      processOutcomePerformances(outcome, completedShot);
      syncUI();
      return this.snapshot();
    },
    advancePresentation() {
      if (tableMomentActive) {
        hideTableMoment();
      } else if (!elements.micro.hidden) {
        clearTimeout(microTimer);
        elements.micro.hidden = true;
        showNextMicro();
      } else if (cinematicActive) {
        closeCinematic();
      } else if (microQueue.length) {
        showNextMicro();
      } else if (cinematicQueue.length) {
        showNextCinematic();
      }
      return this.snapshot();
    },
    reset() {
      resetGame();
    }
  });
})();
