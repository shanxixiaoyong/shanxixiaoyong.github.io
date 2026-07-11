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
  const MIN_SHOT_SPEED = 2.6;
  const MAX_SHOT_SPEED = 42;
  const STOP_SPEED = Physics.CONFIG.stopSpeed;
  const NATURAL_STOP_SPEED = 0.14;
  const POCKET_MIN_DURATION = 280;
  const POCKET_MAX_DURATION = 450;
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
  const STAGE_SCENE_ASSETS = Object.freeze({
    "first-contact": "assets/love-scenes/campus-library.webp",
    "growing-familiar": "assets/love-scenes/cafe-evening.webp",
    "intentional-dates": "assets/love-scenes/city-night.webp",
    "spoken-heart": "assets/billiards-scenes/confession-night.jpg",
    "confirmed-love": "assets/love-scenes/warm-home.webp",
    "learning-together": "assets/love-scenes/rain-night.webp",
    "shared-future": "assets/love-scenes/starlight-vow.webp"
  });
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
  const TIMING_LABELS = Object.freeze({
    "on-time": "本章片段",
    "early-completion": "意外先发生",
    "eight-too-early": "心意还没到时候",
    "break-respot": "黑 8 回置",
    "break-pot": "开局相遇",
    break: "开球",
    miss: "这一杆没有进球"
  });

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
    walnut: loadMaterialTexture("assets/billiards-textures/dark-walnut.jpg")
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

    setStage() {}

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
        mode: "recorded-samples",
        enabled: this.enabled,
        contextState: this.context?.state || "uninitialized",
        loadedSamples: Object.freeze([...this.sampleBuffers.keys()].sort()),
        expectedSamples: Object.keys(RECORDED_AUDIO_ASSETS).length
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
  let collisionFeedbacks = [];
  let collisionCount = 0;
  let microQueue = [];
  let microTimer = 0;
  let judgementTimer = 0;
  let cinematicQueue = [];
  let cinematicCurrent = null;
  let cinematicTimer = 0;
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
    collisionFeedbacks = [];
    collisionCount = 0;
    microQueue = [];
    cinematicQueue = [];
    cinematicCurrent = null;
    clearTimeout(microTimer);
    clearTimeout(judgementTimer);
    clearTimeout(cinematicTimer);
    screenFlash = 0;
    screenShake = 0;
    elements.result.hidden = true;
    elements.cinematic.hidden = true;
    elements.micro.hidden = true;
    rackBalls();
    syncUI();
    root.dataset.state = "break";
  }

  function buildTimeline() {
    const fragment = document.createDocumentFragment();
    trackNodeMap = new Map();
    content.BALLS.forEach((ball) => {
      const item = document.createElement("li");
      item.className = "hb-track-node";
      item.dataset.ball = String(ball.number);
      const number = document.createElement("i");
      number.textContent = String(ball.number);
      const label = document.createElement("span");
      label.textContent = ball.name;
      item.append(number, label);
      trackNodeMap.set(ball.number, item);
      fragment.append(item);
    });
    elements.trackNodes.replaceChildren(fragment);
  }

  function currentStageNumber() {
    return cachedStageNumber;
  }

  function syncUI() {
    const stage = rules.currentStage(runState);
    const progress = rules.stageProgress(runState);
    const interestSignal = rules.interestStatus(runState);
    const stageNumber = stage?.number || 7;
    const narrativeStage = content.getStage(stageNumber);
    const targets = rules.availableTargets(runState);
    cachedStageNumber = stageNumber;
    cachedAvailableTargets = new Set(targets);
    root.dataset.stage = String(stageNumber);
    elements.stageKicker.textContent = stage
      ? `STAGE ${String(stage.number).padStart(2, "0")} · ${stage.name}`
      : "COMPLETE · 共同未来";
    elements.stageTitle.textContent = narrativeStage.enterLine;
    elements.stageTargets.textContent = progress
      ? progress.target === "eight"
        ? "本阶段目标：打进黑 8，完成告白"
        : `任意非黑 8 彩球均可，再进 ${progress.remaining} 颗进入下一阶段`
      : "今晚已经走到最后";
    const interestLabels = {
      devoted: "炽热",
      warm: "升温",
      steady: "安稳",
      uncertain: "摇摆",
      danger: "疏远",
      lost: "熄灭"
    };
    const interestLevels = { devoted: 1, warm: 0.84, steady: 0.66, uncertain: 0.44, danger: 0.2, lost: 0 };
    elements.interest.textContent = interestLabels[interestSignal.band] || "安稳";
    elements.interestWrap.setAttribute("aria-label", `心绪状态：${interestSignal.label}`);
    elements.interestWrap.dataset.signal = interestSignal.band;
    elements.interestWrap.classList.toggle("is-low", ["danger", "lost"].includes(interestSignal.band));
    elements.interestRing.style.strokeDashoffset = String(113.1 * (1 - interestLevels[interestSignal.band]));
    elements.shots.textContent = String(runState.shots);
    elements.streak.textContent = String(runState.potStreak);
    elements.trackProgress.style.width = `${runState.pottedNumbers.length / 15 * 100}%`;
    const completedStoryCount = runState.pottedNumbers.length;
    const recommended = new Set(stage && progress
      ? stage.ballNumbers.slice(progress.completed)
      : []);
    trackNodeMap.forEach((node, number) => {
      node.classList.toggle("is-complete", number <= completedStoryCount);
      node.classList.toggle("is-current", recommended.has(number));
      node.classList.toggle("is-danger", progress?.target === "eight" && number === 15);
    });
    if (!runState.breakCompleted) {
      elements.selectedBall.textContent = "—";
      elements.selectedName.textContent = "开球无需声明";
      elements.callLabel.textContent = "开球";
      elements.callTitle.textContent = "打散今晚的第一束光";
      elements.callHint.textContent = "桌面任意位置向后滑动，松开完成开球";
    } else if (selectedBallNumber !== null) {
      selectedBallNumber = null;
      elements.selectedBall.textContent = String(progress?.remaining || 0);
      elements.selectedName.textContent = progress?.target === "eight" ? "等待黑 8 · 告白" : `${narrativeStage.name} · 还差`;
      elements.callLabel.textContent = `STAGE ${String(stageNumber).padStart(2, "0")}`;
      elements.callTitle.textContent = progress?.target === "eight" ? "这一杆，只等黑 8" : "任意彩球都能推进关系";
      elements.callHint.textContent = progress?.target === "eight" ? "打进黑 8，进入相恋阶段" : `再进 ${progress?.remaining || 0} 颗，进入下一章`;
    } else {
      elements.selectedBall.textContent = String(progress?.remaining || 0);
      elements.selectedName.textContent = progress?.target === "eight" ? "等待黑 8 · 告白" : `${narrativeStage.name} · 还差`;
      elements.callLabel.textContent = `STAGE ${String(stageNumber).padStart(2, "0")}`;
      elements.callTitle.textContent = progress?.target === "eight" ? "这一杆，只等黑 8" : "任意彩球都能推进关系";
      elements.callHint.textContent = progress?.target === "eight" ? "打进黑 8，进入相恋阶段" : `再进 ${progress?.remaining || 0} 颗，进入下一章`;
    }
    elements.aimToggle.setAttribute("aria-pressed", String(aimAssist));
    elements.aimToggle.setAttribute("aria-label", aimAssist ? "关闭瞄准辅助" : "开启瞄准辅助");
    elements.sound.setAttribute("aria-pressed", String(audio.enabled));
    elements.sound.setAttribute("aria-label", audio.enabled ? "关闭声音" : "开启声音");
    audio.setStage(stageNumber);
  }

  function classificationLabel(timing) {
    return TIMING_LABELS[timing] || "这一杆由你决定";
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
    pointerAim = {
      id: event.pointerId,
      start: { ...point },
      current: point,
      direction: { ...aimDirection },
      pullRatio: 0,
      power: 0
    };
    canvas.setPointerCapture?.(event.pointerId);
    canvas.setAttribute("aria-label", "正在调整击球力度：轻推");
    elements.call.classList.add("is-quiet");
    hideCoach();
  }

  function updateAim(point) {
    if (!pointerAim || !cueBall) return;
    pointerAim.current = point;
    const pull = {
      x: pointerAim.start.x - point.x,
      y: pointerAim.start.y - point.y
    };
    const pullDistance = Math.hypot(pull.x, pull.y);
    if (pullDistance > 5) pointerAim.direction = normalize(pull, pointerAim.direction);
    pointerAim.pullRatio = clamp((pullDistance - MIN_PULL) / (MAX_PULL - MIN_PULL), 0, 1);
    pointerAim.power = powerFromPullRatio(pointerAim.pullRatio);
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
    canvas.setAttribute("aria-label", "在桌面任意位置反向滑动瞄准蓄力，松开击球");
    elements.call.classList.remove("is-quiet");
  }

  function releaseAim(event, shouldShoot) {
    if (!pointerAim || event.pointerId !== pointerAim.id) return;
    const power = pointerAim.power;
    const direction = { ...pointerAim.direction };
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
    }, clamp(item.durationMs + 3000, 4200, 5200));
  }

  function queueBallMicro(performance, event, outcome) {
    const ball = content.getBall(event.storyNumber || performance.ballNumber);
    const streaking = outcome.streakBonus > 0;
    queueMicro({
      id: performance.id,
      type: streaking ? "streak" : event.completedEarly ? "early" : "pocket",
      kicker: streaking
        ? `${outcome.state.potStreak} 连进 · ${outcome.interestSignal.label}`
        : classificationLabel(event.timing),
      title: `${event.number}号球 · ${ball.name}`,
      line: `${performance.visual} ${performance.line} ${outcome.interestTrend.line}`,
      durationMs: performance.durationMs,
      sound: streaking ? "streak" : "event",
      intensity: streaking ? clamp(0.82 + outcome.state.potStreak * 0.05, 0.9, 1.25) : 0.86
    });
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
    else if (runState.endState.ended && elements.micro.hidden && !microQueue.length && !resultVisible) showResult();
    else root.dataset.state = "aiming";
  }

  function stageCopy(stageId, seed) {
    const stage = rules.STAGES.find((entry) => entry.id === stageId);
    if (!stage) return null;
    const performance = content.selectStageTransition({ stage: stage.number, seed });
    return {
      ...performance,
      kind: stage.number === 4 ? "confession" : stage.number === 7 ? "proposal" : "stage",
      image: STAGE_SCENE_ASSETS[stage.id],
      sound: stage.number === 4 ? "confession" : stage.number === 7 ? "proposal" : "stage",
      autoCloseMs: clamp(performance.durationMs + 1800, 3400, 4300),
      actionLabel: null
    };
  }

  function earlyEightCopy(outcome) {
    const success = outcome.earlyEight.success;
    return {
      id: `black-eight-${success ? "mutual" : "rejected"}-${outcome.state.shots}`,
      kind: success ? "early-success" : "rejection",
      stageId: success ? "spoken-heart" : "learning-together",
      image: success
        ? "assets/billiards-scenes/confession-night.jpg"
        : "assets/love-scenes/rain-night.webp",
      kicker: success ? "黑 8 · 稀有结局" : "黑 8 · 越过时机",
      title: success ? "冒险提前命中了答案" : "这份承诺来得太快",
      line: success
        ? "此前每一次靠近都得到了回应。黑 8 提前落袋时，她没有后退，而是伸手接住了答案。"
        : "关系还没有走到最后，你却先击中了最重的承诺。她认真听完，然后温柔而明确地拒绝。",
      sound: success ? "proposal" : "scratch",
      autoCloseMs: 4200,
      actionLabel: null
    };
  }

  function processOutcomePerformances(outcome) {
    const stageTransitions = outcome.newlyCompletedStageIds || outcome.completedStageIds || [];
    const queuePocketPerformances = () => {
      outcome.pocketEvents?.forEach((event, index) => {
        const performance = content.selectPerformance({
          ballNumber: event.storyNumber || event.number,
          intent: content.INTENTS.ACTIVE,
          timing: content.TIMINGS.RIGHT,
          seed: outcome.state.shots * 31 + event.number * 7 + index
        });
        queueBallMicro(performance, event, outcome);
        const color = BALL_COLORS[event.number] || "#e4c178";
        const burst = [...pocketBursts].reverse().find((item) => item.number === event.number);
        spawnParticles(burst?.x || WORLD.width / 2, burst?.y || WORLD.height / 2, color, 18);
      });
    };
    const queueTechnicalPerformance = () => {
      if (outcome.cueScratch) {
        queueStageMicro(
          outcome.stageBefore?.number || currentStageNumber(),
          content.STAGE_EVENT_TYPES.SCRATCH,
          outcome.state.shots * 41,
          outcome.interestTrend
        );
      } else if (outcome.miss && !outcome.shot.breakShot) {
        const eventType = outcome.state.consecutiveMisses <= 1
          ? content.STAGE_EVENT_TYPES.SETUP
          : content.STAGE_EVENT_TYPES.MISS;
        queueStageMicro(
          outcome.stageBefore?.number || currentStageNumber(),
          eventType,
          outcome.state.shots * 43,
          outcome.interestTrend
        );
      }
    };

    if (outcome.earlyEight) {
      queuePocketPerformances();
      queueTechnicalPerformance();
      queueCinematic(earlyEightCopy(outcome));
      return;
    }

    if (!stageTransitions.length) {
      queuePocketPerformances();
      queueTechnicalPerformance();
      return;
    }

    queuePocketPerformances();
    queueTechnicalPerformance();
    const copies = stageTransitions.map((stageId, index) => {
      const copy = stageCopy(stageId, outcome.state.shots * 47 + index);
      return copy;
    }).filter(Boolean);
    copies.forEach((copy) => {
      screenFlash = Math.max(screenFlash, 0.34);
      queueCinematic(copy);
    });
  }

  function finalizeShot() {
    if (!shotState || resolvingShot) return;
    resolvingShot = true;
    const completedShot = shotState;
    shotState = null;
    stableSteps = 0;
    let outcome;
    try {
      outcome = rules.evaluateShot(runState, {
        pottedNumbers: [...completedShot.pottedNumbers],
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
    syncUI();
    processOutcomePerformances(outcome);
    root.dataset.state = runState.endState.ended ? "ending" : "aiming";
    if (runState.endState.ended && !cinematicQueue.length && !cinematicActive) showResult();
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
    wood.addColorStop(0, "#160f0d");
    wood.addColorStop(0.18, "#3b261d");
    wood.addColorStop(0.42, "#211512");
    wood.addColorStop(0.68, "#4b3023");
    wood.addColorStop(1, "#120c0b");
    context.fillStyle = wood;
    roundRectPath(context, TABLE_OUTER.left, TABLE_OUTER.top, TABLE_OUTER.right - TABLE_OUTER.left, TABLE_OUTER.bottom - TABLE_OUTER.top, 32);
    context.fill();
    context.restore();

    context.save();
    const burl = context.createLinearGradient(TABLE_OUTER.right, TABLE_OUTER.top, TABLE_OUTER.left, TABLE_OUTER.bottom);
    burl.addColorStop(0, "#5c3b2a");
    burl.addColorStop(0.16, "#261713");
    burl.addColorStop(0.5, "#493024");
    burl.addColorStop(0.84, "#1d1210");
    burl.addColorStop(1, "#62402e");
    context.fillStyle = burl;
    roundRectPath(context, TABLE_OUTER.left + 8, TABLE_OUTER.top + 8, TABLE_OUTER.right - TABLE_OUTER.left - 16, TABLE_OUTER.bottom - TABLE_OUTER.top - 16, 25);
    context.fill();
    roundRectPath(context, TABLE_OUTER.left + 10, TABLE_OUTER.top + 10, TABLE_OUTER.right - TABLE_OUTER.left - 20, TABLE_OUTER.bottom - TABLE_OUTER.top - 20, 23);
    context.clip();
    drawMaterialTexture(MATERIAL_TEXTURES.walnut, TABLE_OUTER.left + 8, TABLE_OUTER.top + 8,
      TABLE_OUTER.right - TABLE_OUTER.left - 16, TABLE_OUTER.bottom - TABLE_OUTER.top - 16, 0.82);
    context.lineWidth = 0.7;
    for (let y = TABLE_OUTER.top + 14, index = 0; y < TABLE_OUTER.bottom - 10; y += 11, index += 1) {
      context.strokeStyle = index % 3 === 0 ? "rgba(246, 184, 117, 0.2)" : "rgba(31, 12, 8, 0.24)";
      context.beginPath();
      context.moveTo(TABLE_OUTER.left + 8, y);
      context.lineTo(TABLE_OUTER.right - 8, y + Math.sin(index * 1.73) * 4);
      context.stroke();
    }
    context.restore();

    context.save();
    context.strokeStyle = "rgba(206, 180, 135, 0.34)";
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
    cloth.addColorStop(0, "#236f58");
    cloth.addColorStop(0.38, "#195a47");
    cloth.addColorStop(0.72, "#124a3b");
    cloth.addColorStop(1, "#0c392e");
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
        ? (index % 2 ? "rgba(226, 246, 233, 0.012)" : "rgba(2, 25, 19, 0.024)")
        : (index % 2 ? "rgba(226, 246, 233, 0.038)" : "rgba(2, 25, 19, 0.09)");
      context.beginPath();
      context.moveTo(TABLE.left, y);
      context.lineTo(TABLE.right, y + (index % 4 - 1.5) * 0.35);
      context.stroke();
    }
    context.lineWidth = 0.3;
    for (let x = TABLE.left + 3, index = 0; x < TABLE.right; x += 8, index += 1) {
      context.strokeStyle = hasClothTexture
        ? (index % 3 === 0 ? "rgba(196, 231, 212, 0.01)" : "rgba(0, 28, 21, 0.018)")
        : (index % 3 === 0 ? "rgba(196, 231, 212, 0.034)" : "rgba(0, 28, 21, 0.055)");
      context.beginPath();
      context.moveTo(x, TABLE.top);
      context.lineTo(x + Math.sin(index * 2.1) * 1.2, TABLE.bottom);
      context.stroke();
    }
    const stageWash = ["#5d9685", "#c19c62", "#c86e83", "#d9b866", "#8f82b4", "#67a2b4", "#d4ad63"][currentStageNumber() - 1];
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
        ? ["#153f34", "#2c735d", "#17483b"]
        : ["#123a31", "#37866d", "#1b5848"];
      gradient.addColorStop(0, reverse ? tones[2] : tones[0]);
      gradient.addColorStop(0.5, tones[1]);
      gradient.addColorStop(1, reverse ? tones[0] : tones[2]);
      context.fillStyle = gradient;
      roundRectPath(context, -material.width / 2, -material.height / 2, material.width, material.height, material.kind === "jaw" ? 5 : 8);
      context.fill();
      context.strokeStyle = material.kind === "jaw" ? "rgba(110, 185, 154, 0.46)" : "rgba(127, 207, 172, 0.62)";
      context.lineWidth = material.kind === "jaw" ? 1 : 1.35;
      roundRectPath(context, -material.width / 2 + 1, -material.height / 2 + 1, material.width - 2, material.height - 2, material.kind === "jaw" ? 4 : 7);
      context.stroke();
      if (material.kind === "cushion") {
        context.strokeStyle = "rgba(143, 224, 187, 0.78)";
        context.shadowColor = "rgba(4, 24, 19, 0.72)";
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
    const colors = ["#76cbb6", "#e3bd72", "#df7889"];
    const zoneBoundaries = [0, LIGHT_PULL_END, STRONG_PULL_START, 1];
    const center = cueBall.position;
    const radius = BALL_RADIUS + 19;
    const gapHalfAngle = Math.PI * 0.36;
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
    context.strokeStyle = "rgba(2, 8, 7, 0.72)";
    context.lineWidth = 11;
    context.beginPath();
    context.arc(center.x, center.y, radius, arcStart, arcEnd);
    context.stroke();

    context.globalAlpha = 0.3;
    context.strokeStyle = gradient;
    context.lineWidth = 5;
    context.beginPath();
    context.arc(center.x, center.y, radius, arcStart, arcEnd);
    context.stroke();

    if (activeRatio > 0) {
      const activeEndAngle = arcStart + arcSpan * activeRatio;
      const activeEndX = center.x + Math.cos(activeEndAngle) * radius;
      const activeEndY = center.y + Math.sin(activeEndAngle) * radius;
      context.globalAlpha = 1;
      context.strokeStyle = gradient;
      context.shadowColor = activeRatio < LIGHT_PULL_END ? colors[0] : activeRatio < STRONG_PULL_START ? colors[1] : colors[2];
      context.shadowBlur = 8;
      context.lineWidth = 6;
      context.beginPath();
      context.arc(center.x, center.y, radius, arcStart, activeEndAngle);
      context.stroke();
      context.shadowBlur = 6;
      context.fillStyle = "#fff4d9";
      context.beginPath();
      context.arc(activeEndX, activeEndY, 3.2, 0, Math.PI * 2);
      context.fill();
    }

    context.globalAlpha = 0.72;
    context.shadowBlur = 0;
    context.strokeStyle = "rgba(255, 247, 226, 0.72)";
    context.lineWidth = 1.15;
    zoneBoundaries.slice(1, -1).forEach((boundary) => {
      const angle = arcStart + arcSpan * boundary;
      const innerRadius = radius - 4.5;
      const outerRadius = radius + 4.5;
      context.beginPath();
      context.moveTo(center.x + Math.cos(angle) * innerRadius, center.y + Math.sin(angle) * innerRadius);
      context.lineTo(center.x + Math.cos(angle) * outerRadius, center.y + Math.sin(angle) * outerRadius);
      context.stroke();
    });
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
      context.fillStyle = "#ffe7b0";
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
      accumulator += delta;
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
    // The full-screen scene completely covers both table canvases. Keeping the
    // high-DPR table frozen here leaves the compositor free for the scene.
    if (!cinematicActive && !resultVisible) draw(timestamp);
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
        recordRailImpact(bodyA, bodyB, collision);
        const impactSpeed = collision?.details?.incidentSpeed ?? bodyA.speed;
        impactBall(bodyA, Math.atan2(-bodyA.velocity.y, -bodyA.velocity.x), impactSpeed);
        audio.rail(impactSpeed);
      }
      if (dataB && isRail(bodyA)) {
        dataB.shotRailHits += 1;
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
    updateAim(pointerToWorld(event));
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
        aim: pointerAim ? Object.freeze({
          start: Object.freeze({ ...pointerAim.start }),
          current: Object.freeze({ ...pointerAim.current }),
          direction: Object.freeze({ ...pointerAim.direction }),
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
          minShotSpeed: MIN_SHOT_SPEED,
          maxShotSpeed: MAX_SHOT_SPEED
        }),
        presentation: Object.freeze({
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
      const outcome = rules.evaluateShot(runState, {
        pottedNumbers: [...(shot?.pottedNumbers || [])],
        cueScratch: Boolean(shot?.cueScratch),
        breakShot: Boolean(shot?.breakShot),
        bankedNumbers: [...(shot?.bankedNumbers || [])]
      });
      runState = outcome.state;
      syncUI();
      processOutcomePerformances(outcome);
      return this.snapshot();
    },
    advancePresentation() {
      if (!elements.micro.hidden) {
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
