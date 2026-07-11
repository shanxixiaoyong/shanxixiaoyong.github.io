(function () {
  "use strict";

  const rules = window.BilliardsLoveRules;
  const content = window.BilliardsLoveContent;
  const Matter = window.Matter;
  if (!rules || !content || !Matter) throw new Error("心动桌球运行依赖未加载");

  const { Engine, Bodies, Body, Composite, Events } = Matter;
  const required = (selector) => {
    const node = document.querySelector(selector);
    if (!node) throw new Error(`缺少心动桌球节点：${selector}`);
    return node;
  };

  const root = required("#heartbeat-billiards");
  const canvas = required("#hb-canvas");
  const context = canvas.getContext("2d", { alpha: true });
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
    power: required("#hb-power"),
    powerFill: required("#hb-power-fill"),
    powerValue: required("#hb-power-value"),
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
  const TABLE = Object.freeze({ left: 74, right: 646, top: 148, bottom: 1292 });
  const TABLE_OUTER = Object.freeze({ left: 12, right: 708, top: 82, bottom: 1358 });
  const BALL_RADIUS = 14.85;
  const BALL_DIAMETER = BALL_RADIUS * 2;
  const POCKET_RADIUS = 33;
  const POCKET_MIN_INWARD_SPEED = 0.12;
  const CORNER_POCKET_MOUTH = BALL_DIAMETER * 2.00;
  const SIDE_POCKET_MOUTH = BALL_DIAMETER * 2.22;
  const CORNER_POCKET_SHELF = BALL_DIAMETER * 0.65;
  const SIDE_POCKET_SHELF = BALL_DIAMETER * 0.14;
  const CORNER_CUT_ANGLE_DEGREES = 142;
  const SIDE_CUT_ANGLE_DEGREES = 104;
  const CORNER_JAW_OFFSET = (CORNER_CUT_ANGLE_DEGREES - 135) * Math.PI / 180;
  const SIDE_JAW_OFFSET = (SIDE_CUT_ANGLE_DEGREES - 90) * Math.PI / 180;
  const POCKET_JAW_LENGTH = BALL_DIAMETER * 1.75;
  const FIXED_STEP = 1000 / 120;
  const MAX_STEPS_PER_FRAME = 8;
  const MIN_PULL = 14;
  const MAX_PULL = 202;
  const MIN_SHOT_SPEED = 8.1;
  const MAX_SHOT_SPEED = 30.9;
  const STOP_SPEED = 0.055;
  const NATURAL_STOP_SPEED = 0.16;
  const POCKET_MIN_DURATION = 280;
  const POCKET_MAX_DURATION = 450;
  const MAX_RENDER_WIDTH = 1440;
  const MAX_RENDER_HEIGHT = 2880;
  const MAX_RENDER_PIXELS = MAX_RENDER_WIDTH * MAX_RENDER_HEIGHT;
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
  const DIAGONAL = Math.SQRT1_2;

  function createPocket({ id, type, mouthX, mouthY, inwardX, inwardY }) {
    const mouth = type === "corner" ? CORNER_POCKET_MOUTH : SIDE_POCKET_MOUTH;
    const shelf = type === "corner" ? CORNER_POCKET_SHELF : SIDE_POCKET_SHELF;
    const cutAngleDegrees = type === "corner" ? CORNER_CUT_ANGLE_DEGREES : SIDE_CUT_ANGLE_DEGREES;
    const jawOffset = type === "corner" ? CORNER_JAW_OFFSET : SIDE_JAW_OFFSET;
    const dropDepth = shelf + BALL_RADIUS;
    return Object.freeze({
      id,
      type,
      mouthX,
      mouthY,
      x: mouthX + inwardX * dropDepth,
      y: mouthY + inwardY * dropDepth,
      captureX: mouthX + inwardX * shelf,
      captureY: mouthY + inwardY * shelf,
      inwardX,
      inwardY,
      mouth,
      shelf,
      cutAngleDegrees,
      jawOffset,
      captureHalfWidth: mouth / 2 - shelf * Math.tan(jawOffset)
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
    "on-time": "时机正好",
    "final-commitment": "刚好走到这里",
    "next-stage": "节奏稍快",
    "multi-stage": "事情发展得太快",
    "early-confession": "告白过早",
    "premature-commitment": "承诺来得太快",
    "commitment-too-heavy": "承诺过重",
    "accidental-surprise": "意外惊喜",
    "accidental-next-stage": "关系突然升温",
    "accidental-multi-stage": "事情忽然快了一点",
    "accidental-confession": "心意意外暴露",
    "accidental-commitment": "承诺意外说出口",
    "break-pot": "开局巧合",
    "protected-respot": "关键时刻还没到"
  });

  function loadMaterialTexture(source) {
    if (typeof window.Image !== "function") return null;
    const image = new window.Image();
    image.decoding = "async";
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
      width: "min(calc(100% - 2px), calc((100dvh - 80px) / 2))",
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
    canvas.setAttribute("aria-label", "从底部白球向后拖动，松开后向上开球");
    resizeCanvas();
  }

  class HeartbeatPoolAudio {
    constructor() {
      const settings = readStorage(SETTINGS_KEY, {});
      this.enabled = settings.sound !== false;
      this.volume = Number.isFinite(settings.volume) ? clamp(settings.volume, 0.08, 0.8) : 0.54;
      this.context = null;
      this.master = null;
      this.baseGain = null;
      this.warmGain = null;
      this.futureGain = null;
      this.nodes = [];
      this.lastCollisionAt = 0;
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
      this.baseGain = this.context.createGain();
      this.warmGain = this.context.createGain();
      this.futureGain = this.context.createGain();
      this.baseGain.gain.value = 0.04;
      this.warmGain.gain.value = 0;
      this.futureGain.gain.value = 0;
      this.baseGain.connect(this.master);
      this.warmGain.connect(this.master);
      this.futureGain.connect(this.master);
      this.addPad([110, 164.81, 220], this.baseGain, "sine", 0.22);
      this.addPad([146.83, 220, 293.66], this.warmGain, "triangle", 0.16);
      this.addPad([196, 293.66, 392], this.futureGain, "sine", 0.11);
    }

    addPad(frequencies, destination, type, detune) {
      frequencies.forEach((frequency, index) => {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        oscillator.detune.value = (index - 1) * detune * 10;
        gain.gain.value = 0.085 / frequencies.length;
        oscillator.connect(gain).connect(destination);
        oscillator.start();
        this.nodes.push(oscillator, gain);
      });
    }

    setStage(stageNumber) {
      if (!this.context) return;
      const now = this.context.currentTime;
      const warm = stageNumber >= 5 ? 0.05 : stageNumber >= 3 ? 0.025 : 0;
      const future = stageNumber >= 7 ? 0.038 : stageNumber >= 6 ? 0.014 : 0;
      this.warmGain.gain.cancelScheduledValues(now);
      this.futureGain.gain.cancelScheduledValues(now);
      this.warmGain.gain.linearRampToValueAtTime(warm, now + 0.8);
      this.futureGain.gain.linearRampToValueAtTime(future, now + 0.8);
    }

    tone(frequency, duration, gainValue, type = "sine", delay = 0) {
      if (!this.enabled) return;
      this.unlock();
      if (!this.context) return;
      const now = this.context.currentTime + delay;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain).connect(this.master);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.03);
    }

    cue(name, intensity = 1) {
      if (!this.enabled) return;
      if (name === "strike") {
        this.tone(92, 0.08, 0.055 * intensity, "triangle");
        this.tone(184, 0.05, 0.018 * intensity, "sine", 0.012);
      } else if (name === "pocket") {
        this.tone(126, 0.22, 0.048 * intensity, "sine");
        this.tone(252, 0.16, 0.025 * intensity, "triangle", 0.025);
      } else if (name === "scratch" || name === "warning") {
        this.tone(128, 0.32, 0.035, "sawtooth");
        this.tone(96, 0.38, 0.025, "triangle", 0.08);
      } else if (name === "stage") {
        [220, 277.18, 329.63, 440].forEach((frequency, index) => this.tone(frequency, 0.45, 0.022, "sine", index * 0.07));
      } else if (name === "confession") {
        [196, 246.94, 293.66, 392].forEach((frequency, index) => this.tone(frequency, 0.72, 0.03, "triangle", index * 0.11));
      } else if (name === "proposal") {
        [196, 246.94, 293.66, 392, 493.88, 587.33].forEach((frequency, index) => this.tone(frequency, 0.92, 0.026, "sine", index * 0.1));
      }
    }

    collision(speed) {
      const now = performance.now();
      if (now - this.lastCollisionAt < 45 || speed < 0.7) return;
      this.lastCollisionAt = now;
      this.tone(180 + Math.min(180, speed * 13), 0.045, Math.min(0.025, speed * 0.0018), "triangle");
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
  engine.positionIterations = 12;
  engine.velocityIterations = 10;
  engine.constraintIterations = 4;

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
  let trackNodeMap = new Map();
  let screenFlash = 0;
  let screenShake = 0;
  let coachSeen = Boolean(readStorage(COACH_KEY, false));
  let cachedStageNumber = 1;
  let cachedAvailableTargets = new Set([1, 2, 3]);
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

  function createRail(x, y, width, height, id, angle = 0, kind = "cushion") {
    const body = Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      label: `hb-rail-${id}`,
      angle,
      restitution: 0.92,
      friction: 0.012,
      frictionStatic: 0,
      slop: 0.004
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
      restitution: 0.965,
      friction: 0.004,
      frictionStatic: 0,
      frictionAir: 0.0095,
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
      lastSafePosition: { x, y },
      outsideSteps: 0,
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
      if (data) data.shotRailHits = 0;
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
    elements.stageTargets.textContent = targets.length
      ? `当前适合：${targets.map((number) => `${number} ${content.getBall(number).name}`).join("、")}`
      : "今晚已经走到最后";
    elements.interest.textContent = String(runState.interest);
    elements.interestWrap.setAttribute("aria-label", `兴趣值 ${runState.interest}`);
    elements.interestWrap.classList.toggle("is-low", runState.interest <= 30);
    elements.interestRing.style.strokeDashoffset = String(113.1 * (1 - runState.interest / 100));
    elements.shots.textContent = String(runState.shots);
    elements.streak.textContent = String(runState.potStreak);
    elements.trackProgress.style.width = `${runState.pottedNumbers.length / 15 * 100}%`;
    const potted = new Set(runState.pottedNumbers);
    const recommended = new Set(targets);
    trackNodeMap.forEach((node, number) => {
      node.classList.toggle("is-complete", potted.has(number));
      node.classList.toggle("is-current", recommended.has(number));
      node.classList.toggle("is-danger", (number === 8 || number === 15) && !recommended.has(number) && !potted.has(number));
    });
    if (!runState.breakCompleted) {
      elements.selectedBall.textContent = "—";
      elements.selectedName.textContent = "开球无需声明";
      elements.callLabel.textContent = "开球";
      elements.callTitle.textContent = "打散今晚的第一束光";
      elements.callHint.textContent = "从白球向后拖动，松开完成开球";
    } else if (selectedBallNumber !== null) {
      const ball = content.getBall(selectedBallNumber);
      const classification = rules.classifyTarget(runState, selectedBallNumber);
      elements.selectedBall.textContent = String(selectedBallNumber);
      elements.selectedName.textContent = `${ball.name} · ${classificationLabel(classification.timing)}`;
      elements.callLabel.textContent = `${selectedBallNumber} · ${ball.name}`;
      elements.callTitle.textContent = classificationLabel(classification.timing);
      elements.callHint.textContent = "从白球向后拖动，松开击球";
    } else {
      elements.selectedBall.textContent = "—";
      elements.selectedName.textContent = "按实际第一碰球判断";
      elements.callLabel.textContent = `STAGE ${String(stageNumber).padStart(2, "0")}`;
      elements.callTitle.textContent = "直接瞄准，第一碰球决定这一杆";
      elements.callHint.textContent = "当前推荐阶段球带有柔和光圈";
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
      && !cinematicActive && !resultVisible && cueBall;
  }

  function selectTarget(number) {
    if (!runState.breakCompleted || runState.pottedNumbers.includes(number)) return;
    selectedBallNumber = number;
    const target = ballByNumber(number);
    if (target && cueBall) aimDirection = normalize({ x: target.position.x - cueBall.position.x, y: target.position.y - cueBall.position.y });
    hideCoach();
    audio.tone(330 + number * 5, 0.08, 0.018, "sine");
    syncUI();
  }

  function hideCoach() {
    if (coachSeen) return;
    coachSeen = true;
    elements.coach.classList.add("is-gone");
    writeStorage(COACH_KEY, true);
  }

  function beginAim(event, point) {
    if (!cueBall) return;
    if (distance(point, cueBall.position) > 54) {
      showJudgement("从白球向后拉动球杆");
      return;
    }
    pointerAim = {
      id: event.pointerId,
      current: point,
      direction: { ...aimDirection },
      power: 0
    };
    canvas.setPointerCapture?.(event.pointerId);
    elements.power.hidden = false;
    elements.call.classList.add("is-quiet");
    hideCoach();
  }

  function updateAim(point) {
    if (!pointerAim || !cueBall) return;
    pointerAim.current = point;
    const pull = { x: cueBall.position.x - point.x, y: cueBall.position.y - point.y };
    const pullDistance = Math.hypot(pull.x, pull.y);
    if (pullDistance > 5) pointerAim.direction = normalize(pull, pointerAim.direction);
    pointerAim.power = clamp((pullDistance - MIN_PULL) / (MAX_PULL - MIN_PULL), 0, 1);
    aimDirection = { ...pointerAim.direction };
    aimPower = pointerAim.power;
    elements.powerFill.style.width = `${Math.round(aimPower * 100)}%`;
    elements.powerValue.textContent = `${Math.round(aimPower * 100)}%`;
  }

  function cancelAim() {
    pointerAim = null;
    aimPower = 0;
    elements.power.hidden = true;
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
    const aimedContact = traceAim()?.hitBall;
    const speed = MIN_SHOT_SPEED + Math.pow(clamp(power, 0, 1), 0.78) * (MAX_SHOT_SPEED - MIN_SHOT_SPEED);
    resetShotRailHits();
    shotState = {
      declaredBall: runState.breakCompleted
        ? selectedBallNumber || bodyData(aimedContact)?.number || null
        : null,
      firstContact: null,
      pottedNumbers: [],
      cueScratch: false,
      breakShot: !runState.breakCompleted,
      bankedNumbers: [],
      startedAt: simulationTime
    };
    Body.setVelocity(cueBall, { x: direction.x * speed, y: direction.y * speed });
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

  function crossedPocketLine(body, pocket, lineDepth, halfWidth) {
    const data = bodyData(body);
    const previous = data?.previousPosition;
    if (!previous) return null;
    const previousDepth = pocketDepth(pocket, previous) - lineDepth;
    const currentDepth = pocketDepth(pocket, body.position) - lineDepth;
    if (previousDepth > 0 || currentDepth < 0 || currentDepth - previousDepth < 1e-7) return null;
    const crossingProgress = clamp(-previousDepth / (currentDepth - previousDepth), 0, 1);
    const crossingX = previous.x + (body.position.x - previous.x) * crossingProgress;
    const crossingY = previous.y + (body.position.y - previous.y) * crossingProgress;
    const lateral = pocketLateral(pocket, { x: crossingX, y: crossingY });
    return Math.abs(lateral) <= halfWidth
      ? { x: crossingX, y: crossingY, lateral }
      : null;
  }

  function inwardPocketSpeed(body, pocket) {
    return body.velocity.x * pocket.inwardX + body.velocity.y * pocket.inwardY;
  }

  function enterPocketMouth(body, pocket) {
    const data = bodyData(body);
    if (!data || inwardPocketSpeed(body, pocket) <= POCKET_MIN_INWARD_SPEED) return false;
    const mouthCrossing = crossedPocketLine(body, pocket, 0, pocket.mouth / 2);
    if (!mouthCrossing) return false;
    const captureCrossing = crossedPocketLine(body, pocket, pocket.shelf, pocket.captureHalfWidth);
    data.pocketApproach = {
      pocketId: pocket.id,
      enteredAt: simulationTime,
      mouthCrossX: mouthCrossing.x,
      mouthCrossY: mouthCrossing.y,
      captureCrossed: Boolean(captureCrossing),
      captureCrossX: captureCrossing?.x ?? null,
      captureCrossY: captureCrossing?.y ?? null
    };
    return true;
  }

  function advancePocketApproach(body, pocket) {
    const data = bodyData(body);
    const approach = data?.pocketApproach;
    if (!approach || approach.pocketId !== pocket.id) return false;
    const currentDepth = pocketDepth(pocket, body.position);
    const currentLateral = Math.abs(pocketLateral(pocket, body.position));
    if (currentDepth < -BALL_RADIUS * 0.15 || currentLateral > pocket.mouth / 2 + BALL_RADIUS) {
      data.pocketApproach = null;
      return false;
    }
    if (inwardPocketSpeed(body, pocket) <= POCKET_MIN_INWARD_SPEED) return false;
    if (!approach.captureCrossed) {
      const captureCrossing = crossedPocketLine(body, pocket, pocket.shelf, pocket.captureHalfWidth);
      if (captureCrossing) {
        approach.captureCrossed = true;
        approach.captureCrossX = captureCrossing.x;
        approach.captureCrossY = captureCrossing.y;
      }
    }
    return approach.captureCrossed
      && approach.enteredAt < simulationTime
      && currentDepth >= pocket.shelf
      && currentLateral <= pocket.captureHalfWidth;
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
        if (ball.speed < NATURAL_STOP_SPEED) {
          Body.setVelocity(ball, { x: ball.velocity.x * 0.86, y: ball.velocity.y * 0.86 });
        }
        if (ball.speed > MAX_SHOT_SPEED * 1.3) {
          const scale = MAX_SHOT_SPEED * 1.3 / ball.speed;
          Body.setVelocity(ball, { x: ball.velocity.x * scale, y: ball.velocity.y * scale });
        }
      }
    });
    if (shotState) stableSteps = moving ? 0 : stableSteps + 1;
    if (shotState && stableSteps >= 22 && !resolvingShot) finalizeShot();
  }

  function mapContentTiming(event) {
    if (!event) return content.TIMINGS.RIGHT;
    if (["on-time", "final-commitment", "accidental-surprise", "break-pot"].includes(event.timing)) return content.TIMINGS.RIGHT;
    if (event.timing.includes("early") || event.timing.includes("next") || event.timing.includes("multi")
        || event.timing.includes("premature") || event.timing.includes("commitment")) return content.TIMINGS.EARLY;
    return content.TIMINGS.LATE;
  }

  function showJudgement(copy) {
    clearTimeout(judgementTimer);
    elements.judgement.textContent = copy;
    elements.judgement.classList.remove("is-visible");
    void elements.judgement.offsetWidth;
    elements.judgement.classList.add("is-visible");
    judgementTimer = setTimeout(() => elements.judgement.classList.remove("is-visible"), 1250);
  }

  function queueMicro(performance, event) {
    microQueue.push({ performance, event });
    if (elements.micro.hidden) showNextMicro();
  }

  function showNextMicro() {
    if (!microQueue.length) {
      elements.micro.hidden = true;
      return;
    }
    const { performance, event } = microQueue.shift();
    clearTimeout(microTimer);
    const ball = content.getBall(performance.ballNumber);
    markViewed(performance.id);
    elements.microKicker.textContent = classificationLabel(event.timing);
    elements.microTitle.textContent = `${performance.ballNumber} · ${ball.name}`;
    elements.microLine.textContent = `${performance.visual} ${performance.line}`;
    elements.micro.hidden = false;
    void elements.micro.offsetWidth;
    microTimer = setTimeout(() => {
      elements.micro.hidden = true;
      setTimeout(showNextMicro, 70);
    }, clamp(performance.durationMs + 250, 900, 2000));
  }

  function specialCopy(key, seed) {
    const special = content.SPECIAL_EVENTS[key];
    if (!special) return null;
    const variant = special.variants[Math.abs(Number(seed) || 0) % special.variants.length];
    return { id: variant.id, kicker: special.title, title: variant.visual, line: variant.line };
  }

  function queueCinematic(item) {
    cinematicQueue.push(item);
    if (!cinematicActive) showNextCinematic();
  }

  function showNextCinematic() {
    if (!cinematicQueue.length) {
      cinematicActive = false;
      cinematicCurrent = null;
      elements.cinematic.hidden = true;
      if (runState.endState.ended && !resultVisible) showResult();
      return;
    }
    cinematicCurrent = cinematicQueue.shift();
    cinematicActive = true;
    markViewed(cinematicCurrent.id);
    elements.cinematic.dataset.kind = cinematicCurrent.kind || "stage";
    elements.cinematicKicker.textContent = cinematicCurrent.kicker;
    elements.cinematicTitle.textContent = cinematicCurrent.title;
    elements.cinematicLine.textContent = cinematicCurrent.line;
    elements.cinematicAction.hidden = !cinematicCurrent.actionLabel;
    elements.cinematicAction.textContent = cinematicCurrent.actionLabel || "继续";
    elements.cinematic.hidden = false;
    audio.cue(cinematicCurrent.sound || "stage");
  }

  function closeCinematic() {
    if (!cinematicActive) return;
    const completed = cinematicCurrent;
    elements.cinematic.hidden = true;
    cinematicActive = false;
    cinematicCurrent = null;
    completed?.onClose?.();
    if (cinematicQueue.length) setTimeout(showNextCinematic, 70);
    else if (runState.endState.ended && !resultVisible) showResult();
    else root.dataset.state = "aiming";
  }

  function stageCopy(stageId) {
    const stage = rules.STAGES.find((entry) => entry.id === stageId);
    if (!stage) return null;
    const narrative = content.getStage(stage.number);
    return {
      kicker: `STAGE ${String(stage.number).padStart(2, "0")} · COMPLETE`,
      title: narrative.completeLine,
      line: stage.number < 7 ? content.getStage(stage.number + 1).enterLine : narrative.completeLine
    };
  }

  function processOutcomePerformances(outcome) {
    outcome.events.filter((event) => event.credited && event.mode !== "break").forEach((event, index) => {
      const performance = content.selectPerformance({
        ballNumber: event.number,
        intent: event.mode === "active" ? content.INTENTS.ACTIVE : content.INTENTS.ACCIDENTAL,
        timing: mapContentTiming(event),
        seed: outcome.state.shots * 31 + event.number * 7 + index
      });
      queueMicro(performance, event);
      showJudgement(`${classificationLabel(event.timing)}${event.banked ? " · 借库入袋" : ""}`);
      const color = BALL_COLORS[event.number] || "#e4c178";
      const burst = [...pocketBursts].reverse().find((item) => item.number === event.number);
      spawnParticles(burst?.x || WORLD.width / 2, burst?.y || WORLD.height / 2, color, 18);
    });

    outcome.completedStageIds.forEach((stageId) => {
      const copy = stageCopy(stageId);
      if (!copy) return;
      audio.cue("stage");
      screenFlash = Math.max(screenFlash, 0.28);
      showJudgement(copy.title);
    });

    const confession = outcome.events.find((event) => event.number === 8 && event.credited);
    if (confession) {
      if (confession.mode === "active" && confession.timing === "on-time") {
        const copy = specialCopy("confessionSuccess", outcome.state.shots) || {
          kicker: "8 · 告白", title: "心意抵达", line: "她认真听完，也认真给出了答案。"
        };
        queueCinematic({ ...copy, kind: "confession", sound: "confession", actionLabel: "继续清台" });
      } else if (confession.mode === "accidental") {
        const copy = specialCopy("feelingsExposed", outcome.state.shots) || {
          kicker: "8 · 心意意外暴露", title: "那句话先一步滚了出去", line: "她没有离开，但这一晚忽然需要更谨慎。"
        };
        queueCinematic({ ...copy, kind: "confession", sound: "warning", actionLabel: "继续" });
      }
    }

    const proposal = outcome.events.find((event) => event.number === 15 && event.credited);
    if (proposal && proposal.mode === "active" && proposal.timing === "final-commitment") {
      const copy = specialCopy("proposalSuccess", outcome.state.shots) || {
        kicker: "15 · 求婚", title: "这一次，答案关于很长的以后", line: "清晨抵达以前，她把手交给了你。"
      };
      queueCinematic({ ...copy, kind: "proposal", sound: "proposal", actionLabel: "看本局结局" });
    }

    if (outcome.endState.status === "failed") {
      const failureMap = {
        "confession-too-early": "confessionTooEarly",
        "commitment-too-heavy": "commitmentTooHeavy",
        "lost-contact": "losingContact"
      };
      const key = failureMap[outcome.endState.ending];
      const copy = specialCopy(key, outcome.state.shots) || {
        kicker: "今晚停在这里", title: "这一幕没有继续发生", line: "重新开球，答案仍可以不同。"
      };
      queueCinematic({ ...copy, kind: outcome.endState.ending === "confession-too-early" ? "confession" : "stage", sound: "warning", actionLabel: "查看结局" });
    } else if (outcome.endState.status === "completed" && !proposal) {
      const ending = content.getEnding(outcome.endState.grade || "B");
      queueCinematic({
        kicker: `${ending.grade} · ${ending.title}`,
        title: ending.line,
        line: ending.epilogue,
        kind: "ending",
        sound: "proposal",
        actionLabel: "看本局结局"
      });
    }
  }

  function finalizeShot() {
    if (!shotState || resolvingShot) return;
    resolvingShot = true;
    const completedShot = shotState;
    shotState = null;
    stableSteps = 0;
    let outcome;
    try {
      const inferredTarget = completedShot.firstContact || completedShot.declaredBall
        || rules.remainingNumbers(runState)[0];
      outcome = rules.evaluateShot(runState, {
        declaredBall: completedShot.breakShot ? null : inferredTarget,
        firstContact: completedShot.firstContact,
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
    if (outcome.cueScratch) showJudgement(`白球落袋 · 兴趣 ${outcome.interestDelta}`);
    else if (outcome.miss && !outcome.shot.breakShot) showJudgement(outcome.interestDelta < 0 ? `话题停了一拍 · 兴趣 ${outcome.interestDelta}` : "这一杆先留作铺垫");
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
      const ending = content.getEnding(grade);
      kicker = `${grade} · ${ending.title}`;
      title = ending.line;
      line = ending.epilogue;
    } else {
      const failure = {
        "confession-too-early": ["告白过早", "心意先于时机落袋", "不是每一次直球，都适合发生在刚认识的时候。"],
        "commitment-too-heavy": ["承诺过重", "很远的以后来得太早", "这一桌停在这里，下一次可以慢慢清完。"],
        "lost-contact": ["渐渐失去联系", "话题在几次停顿后安静下来", "没有现实里的否定，只是这一局需要重新开始。"]
      }[runState.endState.ending] || ["今晚未完", "这一桌停在了这里", "下一次开球，关系轨迹会重新亮起。"];
      [kicker, title, line] = failure;
    }
    elements.resultGrade.textContent = kicker;
    elements.resultTitle.textContent = title;
    elements.resultLine.textContent = line;
    elements.resultShots.textContent = String(rating.technical.shots);
    elements.resultAccuracy.textContent = `${rating.technical.successfulShotRate}%`;
    elements.resultStreak.textContent = String(rating.technical.bestStreak);
    elements.resultInterest.textContent = String(runState.interest);
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
      const rubber = context.createLinearGradient(0, -material.height / 2, 0, material.height / 2);
      rubber.addColorStop(0, material.kind === "jaw" ? "#376d5b" : "#2b6755");
      rubber.addColorStop(0.35, "#174c3f");
      rubber.addColorStop(0.72, "#0b3028");
      rubber.addColorStop(1, "#071f1b");
      context.fillStyle = rubber;
      roundRectPath(context, -material.width / 2, -material.height / 2, material.width, material.height, material.kind === "jaw" ? 5 : 8);
      context.fill();
      context.strokeStyle = "rgba(118, 181, 154, 0.46)";
      context.lineWidth = material.kind === "jaw" ? 1.1 : 1.5;
      roundRectPath(context, -material.width / 2 + 1, -material.height / 2 + 1, material.width - 2, material.height - 2, material.kind === "jaw" ? 4 : 7);
      context.stroke();
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
    context.save();
    context.translate(pocket.mouthX, pocket.mouthY);
    context.rotate(Math.atan2(pocket.inwardY, pocket.inwardX));
    context.scale(0.18, 1);
    const entrance = context.createRadialGradient(-pocket.mouth * 0.08, 0, 1, 0, 0, pocket.mouth / 2);
    entrance.addColorStop(0, "#020303");
    entrance.addColorStop(0.7, "#11100e");
    entrance.addColorStop(1, "#513629");
    context.fillStyle = entrance;
    context.beginPath();
    context.arc(0, 0, pocket.mouth / 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
    context.restore();
  }

  function drawTable() {
    drawSolidWoodFrame();
    drawWoolCloth();
    drawCushionRubber();
    drawMetalSights();
    POCKETS.forEach(drawLeatherPocket);
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
      const pixelRatio = Math.max(1, renderScale);
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
        pixelRatio: Math.max(1, renderScale)
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
    context.save();
    context.lineWidth = 1.35;
    context.setLineDash([8, 7]);
    context.strokeStyle = correct || !runState.breakCompleted ? "rgba(235, 210, 154, 0.78)" : "rgba(229, 119, 112, 0.62)";
    context.beginPath();
    context.moveTo(trace.origin.x, trace.origin.y);
    context.lineTo(trace.impact.x, trace.impact.y);
    context.stroke();
    context.setLineDash([]);
    if (trace.hitBall && aimAssist) {
      const target = trace.hitBall.position;
      const length = 102;
      context.strokeStyle = correct ? "rgba(111, 205, 183, 0.88)" : "rgba(238, 183, 120, 0.68)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(target.x, target.y);
      context.lineTo(target.x + trace.targetDirection.x * length, target.y + trace.targetDirection.y * length);
      context.stroke();
      context.fillStyle = context.strokeStyle;
      context.beginPath();
      context.arc(trace.impact.x, trace.impact.y, 3.2, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
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
    drawTable();
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
    draw(timestamp);
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
        const relative = Math.hypot(bodyA.velocity.x - bodyB.velocity.x, bodyA.velocity.y - bodyB.velocity.y);
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
        impactBall(bodyA, Math.atan2(-bodyA.velocity.y, -bodyA.velocity.x), bodyA.speed);
        audio.collision(bodyA.speed * 0.72);
      }
      if (dataB && isRail(bodyA)) {
        dataB.shotRailHits += 1;
        impactBall(bodyB, Math.atan2(-bodyB.velocity.y, -bodyB.velocity.x), bodyB.speed);
        audio.collision(bodyB.speed * 0.72);
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
    const remaining = rules.remainingNumbers(runState);
    if (event.key === "Tab" && runState.breakCompleted) {
      event.preventDefault();
      const index = selectedBallNumber === null ? -1 : remaining.indexOf(selectedBallNumber);
      selectTarget(remaining[(index + 1) % remaining.length]);
      return;
    }
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
        world: Object.freeze({ ...WORLD }),
        table: Object.freeze({ ...TABLE }),
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
            captureCrossY: bodyData(ball).pocketApproach.captureCrossY
          }) : null,
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
      data.pocketApproach = null;
      if (point.x >= TABLE.left + BALL_RADIUS && point.x <= TABLE.right - BALL_RADIUS
          && point.y >= TABLE.top + BALL_RADIUS && point.y <= TABLE.bottom - BALL_RADIUS) {
        data.lastSafePosition = { x: point.x, y: point.y };
      }
      data.outsideSteps = 0;
      return true;
    },
    reset() {
      resetGame();
    }
  });
})();
