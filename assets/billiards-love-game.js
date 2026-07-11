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
    opening: required("#hb-opening"),
    start: required("#hb-start"),
    aimToggle: required("#hb-aim-toggle"),
    sound: required("#hb-sound"),
    pause: required("#hb-pause"),
    pauseSheet: required("#hb-pause-sheet"),
    resume: required("#hb-resume"),
    restartPause: required("#hb-restart-pause"),
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

  const WORLD = Object.freeze({ width: 1280, height: 640 });
  const TABLE = Object.freeze({ left: 160, right: 1120, top: 80, bottom: 560 });
  const TABLE_OUTER = Object.freeze({ left: 105, right: 1175, top: 28, bottom: 612 });
  const BALL_RADIUS = 13.2;
  const POCKET_RADIUS = 28;
  const FIXED_STEP = 1000 / 120;
  const MAX_STEPS_PER_FRAME = 8;
  const MIN_PULL = 12;
  const MAX_PULL = 180;
  const MIN_SHOT_SPEED = 7.2;
  const MAX_SHOT_SPEED = 27.5;
  const STOP_SPEED = 0.075;
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
  const POCKETS = Object.freeze([
    { id: "top-left", x: TABLE.left, y: TABLE.top },
    { id: "top-middle", x: WORLD.width / 2, y: TABLE.top - 1 },
    { id: "top-right", x: TABLE.right, y: TABLE.top },
    { id: "bottom-left", x: TABLE.left, y: TABLE.bottom },
    { id: "bottom-middle", x: WORLD.width / 2, y: TABLE.bottom + 1 },
    { id: "bottom-right", x: TABLE.right, y: TABLE.bottom }
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
  let aimDirection = { x: 1, y: 0 };
  let aimPower = 0;
  let started = false;
  let paused = false;
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

  function bodyData(body) {
    return body?.plugin?.heartbeatPool || null;
  }

  function ballByNumber(number) {
    return balls.find((ball) => bodyData(ball)?.number === number) || null;
  }

  function isRail(body) {
    return Boolean(body?.plugin?.heartbeatRail);
  }

  function createRail(x, y, width, height, id) {
    const body = Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      label: `hb-rail-${id}`,
      restitution: 0.92,
      friction: 0.012,
      frictionStatic: 0,
      slop: 0.004
    });
    body.plugin.heartbeatRail = { id };
    return body;
  }

  function buildRails() {
    if (rails.length) Composite.remove(engine.world, rails);
    const mid = WORLD.width / 2;
    const cornerGap = 58;
    const sideGap = 48;
    const thickness = 22;
    const horizontalLeftStart = TABLE.left + cornerGap;
    const horizontalLeftEnd = mid - sideGap;
    const horizontalRightStart = mid + sideGap;
    const horizontalRightEnd = TABLE.right - cornerGap;
    const verticalStart = TABLE.top + cornerGap;
    const verticalEnd = TABLE.bottom - cornerGap;
    rails = [
      createRail((horizontalLeftStart + horizontalLeftEnd) / 2, TABLE.top - thickness / 2, horizontalLeftEnd - horizontalLeftStart, thickness, "top-left"),
      createRail((horizontalRightStart + horizontalRightEnd) / 2, TABLE.top - thickness / 2, horizontalRightEnd - horizontalRightStart, thickness, "top-right"),
      createRail((horizontalLeftStart + horizontalLeftEnd) / 2, TABLE.bottom + thickness / 2, horizontalLeftEnd - horizontalLeftStart, thickness, "bottom-left"),
      createRail((horizontalRightStart + horizontalRightEnd) / 2, TABLE.bottom + thickness / 2, horizontalRightEnd - horizontalRightStart, thickness, "bottom-right"),
      createRail(TABLE.left - thickness / 2, (verticalStart + verticalEnd) / 2, thickness, verticalEnd - verticalStart, "left"),
      createRail(TABLE.right + thickness / 2, (verticalStart + verticalEnd) / 2, thickness, verticalEnd - verticalStart, "right"),
      createRail(WORLD.width / 2, TABLE_OUTER.top - 22, TABLE_OUTER.right - TABLE_OUTER.left + 120, 18, "guard-top"),
      createRail(WORLD.width / 2, TABLE_OUTER.bottom + 22, TABLE_OUTER.right - TABLE_OUTER.left + 120, 18, "guard-bottom"),
      createRail(TABLE_OUTER.left - 24, WORLD.height / 2, 18, TABLE_OUTER.bottom - TABLE_OUTER.top + 120, "guard-left"),
      createRail(TABLE_OUTER.right + 24, WORLD.height / 2, 18, TABLE_OUTER.bottom - TABLE_OUTER.top + 120, "guard-right")
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
      falling: false
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
    createBall(0, 342, WORLD.height / 2);
    const spacing = BALL_RADIUS * 2 + 1.15;
    const xStep = spacing * Math.cos(Math.PI / 6);
    const apexX = 862;
    RACK.forEach((row, rowIndex) => {
      const x = apexX + rowIndex * xStep;
      row.forEach((number, index) => {
        const y = WORLD.height / 2 + (index - rowIndex / 2) * spacing;
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
    return { x: TABLE.left + 120, y: WORLD.height / 2 };
  }

  function respotBall(number) {
    if (ballByNumber(number)) return;
    const preferred = number === 0
      ? { x: 342, y: WORLD.height / 2 }
      : { x: 862, y: WORLD.height / 2 };
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
    aimDirection = { x: 1, y: 0 };
    aimPower = 0;
    paused = false;
    resolvingShot = false;
    cinematicActive = false;
    resultVisible = false;
    accumulator = 0;
    stableSteps = 0;
    particles = [];
    pocketBursts = [];
    microQueue = [];
    cinematicQueue = [];
    cinematicCurrent = null;
    screenFlash = 0;
    screenShake = 0;
    elements.pauseSheet.hidden = true;
    elements.result.hidden = true;
    elements.cinematic.hidden = true;
    elements.micro.hidden = true;
    rackBalls();
    syncUI();
    root.dataset.state = started ? "break" : "ready";
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
      elements.selectedName.textContent = "点击桌上的目标球";
      elements.callLabel.textContent = `STAGE ${String(stageNumber).padStart(2, "0")}`;
      elements.callTitle.textContent = "先选定这一杆想完成的事";
      elements.callHint.textContent = "当前阶段球会带有柔和光圈";
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

  function pointerToWorld(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / Math.max(1, rect.width) * WORLD.width,
      y: (event.clientY - rect.top) / Math.max(1, rect.height) * WORLD.height
    };
  }

  function canInteract() {
    return started && !paused && !shotState && !pointerAim && !resolvingShot
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
    if (runState.breakCompleted && selectedBallNumber === null) {
      showJudgement("先点选这一杆的目标球");
      return;
    }
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
    if (!canInteract() || (runState.breakCompleted && selectedBallNumber === null)) return false;
    const speed = MIN_SHOT_SPEED + Math.pow(clamp(power, 0, 1), 0.78) * (MAX_SHOT_SPEED - MIN_SHOT_SPEED);
    resetShotRailHits();
    shotState = {
      declaredBall: runState.breakCompleted ? selectedBallNumber : null,
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

  function pocketBall(body, pocket) {
    const data = bodyData(body);
    if (!shotState || !data || data.potted || data.falling) return;
    data.falling = true;
    const speed = body.speed;
    const number = data.number;
    if (number === 0) {
      shotState.cueScratch = true;
    } else if (!shotState.pottedNumbers.includes(number)) {
      shotState.pottedNumbers.push(number);
      if (data.shotRailHits > 0) shotState.bankedNumbers.push(number);
    }
    pocketBursts.push({ x: pocket.x, y: pocket.y, color: number === 0 ? "#f5f0e7" : BALL_COLORS[number], life: 1, number });
    spawnParticles(pocket.x, pocket.y, number === 0 ? "#e6eee9" : BALL_COLORS[number], number === 0 ? 7 : 12);
    removeBall(body);
    audio.cue(number === 0 ? "scratch" : "pocket", clamp(0.72 + speed / 30, 0.7, 1.15));
    screenFlash = Math.max(screenFlash, number === 8 || number === 15 ? 0.36 : 0.12);
  }

  function updatePockets() {
    if (!shotState) return;
    balls.slice().forEach((ball) => {
      const data = bodyData(ball);
      if (!data || data.potted) return;
      let nearestPocket = null;
      let nearestDistance = Infinity;
      POCKETS.forEach((pocket) => {
        const candidate = distance(ball.position, pocket);
        if (candidate < nearestDistance) {
          nearestPocket = pocket;
          nearestDistance = candidate;
        }
      });
      if (!nearestPocket) return;
      if (nearestDistance <= POCKET_RADIUS - 2 || (nearestDistance <= POCKET_RADIUS + 4 && ball.speed < 11)) {
        pocketBall(ball, nearestPocket);
        return;
      }
      if (nearestDistance < POCKET_RADIUS + 13) {
        const pull = normalize({ x: nearestPocket.x - ball.position.x, y: nearestPocket.y - ball.position.y });
        Body.applyForce(ball, ball.position, { x: pull.x * 0.00022, y: pull.y * 0.00022 });
      }
    });
  }

  function settleBalls() {
    let moving = false;
    balls.forEach((ball) => {
      if (ball.speed < STOP_SPEED) {
        Body.setVelocity(ball, { x: 0, y: 0 });
        Body.setAngularVelocity(ball, 0);
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
      outcome = rules.evaluateShot(runState, {
        declaredBall: completedShot.declaredBall,
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

  function drawTable() {
    context.save();
    context.shadowColor = "rgba(0, 0, 0, 0.66)";
    context.shadowBlur = 30;
    context.shadowOffsetY = 18;
    const wood = context.createLinearGradient(TABLE_OUTER.left, TABLE_OUTER.top, TABLE_OUTER.right, TABLE_OUTER.bottom);
    wood.addColorStop(0, "#35251d");
    wood.addColorStop(0.3, "#6b4630");
    wood.addColorStop(0.55, "#2b201b");
    wood.addColorStop(0.8, "#71472f");
    wood.addColorStop(1, "#221a17");
    context.fillStyle = wood;
    roundRectPath(context, TABLE_OUTER.left, TABLE_OUTER.top, TABLE_OUTER.right - TABLE_OUTER.left, TABLE_OUTER.bottom - TABLE_OUTER.top, 34);
    context.fill();
    context.restore();

    context.save();
    const rail = context.createLinearGradient(0, TABLE.top - 28, 0, TABLE.bottom + 28);
    rail.addColorStop(0, "#1f4f42");
    rail.addColorStop(0.18, "#163d34");
    rail.addColorStop(0.82, "#0f322b");
    rail.addColorStop(1, "#286151");
    context.fillStyle = rail;
    roundRectPath(context, TABLE.left - 34, TABLE.top - 34, TABLE.right - TABLE.left + 68, TABLE.bottom - TABLE.top + 68, 27);
    context.fill();
    const cloth = context.createLinearGradient(TABLE.left, TABLE.top, TABLE.right, TABLE.bottom);
    cloth.addColorStop(0, "#1d6651");
    cloth.addColorStop(0.42, "#16533f");
    cloth.addColorStop(1, "#0e4234");
    context.fillStyle = cloth;
    context.fillRect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    context.fillStyle = "rgba(255, 255, 255, 0.025)";
    for (let y = TABLE.top + 10; y < TABLE.bottom; y += 18) context.fillRect(TABLE.left + 4, y, TABLE.right - TABLE.left - 8, 1);
    const stageWash = ["#5d9685", "#c19c62", "#c86e83", "#d9b866", "#8f82b4", "#67a2b4", "#d4ad63"][currentStageNumber() - 1];
    const wash = context.createRadialGradient(WORLD.width * 0.56, WORLD.height * 0.46, 40, WORLD.width * 0.56, WORLD.height * 0.46, 520);
    wash.addColorStop(0, `${stageWash}22`);
    wash.addColorStop(1, "transparent");
    context.fillStyle = wash;
    context.fillRect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    context.restore();

    context.save();
    POCKETS.forEach((pocket, index) => {
      const glow = context.createRadialGradient(pocket.x, pocket.y, 3, pocket.x, pocket.y, POCKET_RADIUS + 13);
      glow.addColorStop(0, "#020403");
      glow.addColorStop(0.56, "#020403");
      glow.addColorStop(0.7, "#6f543820");
      glow.addColorStop(1, "transparent");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(pocket.x, pocket.y, POCKET_RADIUS + (index === 1 || index === 4 ? 3 : 0), 0, Math.PI * 2);
      context.fill();
    });
    context.fillStyle = "rgba(230, 199, 137, 0.78)";
    const diamonds = [280, 400, 520, 760, 880, 1000];
    diamonds.forEach((x) => {
      context.save();
      context.translate(x, TABLE.top - 23);
      context.rotate(Math.PI / 4);
      context.fillRect(-3, -3, 6, 6);
      context.restore();
      context.save();
      context.translate(x, TABLE.bottom + 23);
      context.rotate(Math.PI / 4);
      context.fillRect(-3, -3, 6, 6);
      context.restore();
    });
    [200, 260, 380, 440].forEach((y) => {
      context.save();
      context.translate(TABLE.left - 23, y);
      context.rotate(Math.PI / 4);
      context.fillRect(-3, -3, 6, 6);
      context.restore();
      context.save();
      context.translate(TABLE.right + 23, y);
      context.rotate(Math.PI / 4);
      context.fillRect(-3, -3, 6, 6);
      context.restore();
    });
    context.restore();
  }

  function drawBall(ball, timestamp) {
    const data = bodyData(ball);
    if (!data || data.potted) return;
    const { x, y } = ball.position;
    const number = data.number;
    context.save();
    context.translate(x, y);
    context.shadowColor = "rgba(0, 0, 0, 0.52)";
    context.shadowBlur = 6;
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 5;
    context.beginPath();
    context.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
    context.clip();
    if (number === 0) {
      const cueGradient = context.createRadialGradient(-5, -6, 1, 0, 0, BALL_RADIUS * 1.2);
      cueGradient.addColorStop(0, "#ffffff");
      cueGradient.addColorStop(0.58, "#eeeae0");
      cueGradient.addColorStop(1, "#89938d");
      context.fillStyle = cueGradient;
      context.fillRect(-BALL_RADIUS, -BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2);
    } else {
      const color = BALL_COLORS[number];
      const stripe = number > 8;
      context.fillStyle = stripe ? "#f3eee1" : color;
      context.fillRect(-BALL_RADIUS, -BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2);
      if (stripe) {
        context.fillStyle = color;
        context.fillRect(-BALL_RADIUS, -BALL_RADIUS * 0.48, BALL_RADIUS * 2, BALL_RADIUS * 0.96);
      }
      const shade = context.createRadialGradient(-5, -6, 1, 2, 3, BALL_RADIUS * 1.22);
      shade.addColorStop(0, "rgba(255,255,255,0.48)");
      shade.addColorStop(0.36, "rgba(255,255,255,0.02)");
      shade.addColorStop(1, "rgba(0,0,0,0.46)");
      context.fillStyle = shade;
      context.fillRect(-BALL_RADIUS, -BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2);
    }
    context.restore();

    if (number > 0) {
      context.save();
      context.translate(x, y);
      context.fillStyle = "#f7f2e7";
      context.beginPath();
      context.arc(0, 0, 6.1, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#191c1c";
      context.font = "700 6.8px system-ui, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(number), 0, 0.4);
      context.restore();
    }

    const available = number > 0 && !shotState && cachedAvailableTargets.has(number);
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

  function drawAim() {
    if (!cueBall || shotState || resolvingShot || paused || cinematicActive || resultVisible) return;
    if (runState.breakCompleted && selectedBallNumber === null) return;
    const trace = traceAim();
    if (!trace) return;
    const correct = trace.hitBall && bodyData(trace.hitBall)?.number === selectedBallNumber;
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
    context.restore();
  }

  function draw(timestamp) {
    context.clearRect(0, 0, WORLD.width, WORLD.height);
    context.save();
    if (screenShake > 0.08) context.translate(Math.sin(timestamp * 0.1) * screenShake, Math.cos(timestamp * 0.13) * screenShake * 0.55);
    drawTable();
    balls.slice().sort((left, right) => left.position.y - right.position.y).forEach((ball) => drawBall(ball, timestamp));
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
    Engine.update(engine, FIXED_STEP);
    simulationTime += FIXED_STEP;
    updatePockets();
    settleBalls();
    updateEffects();
  }

  function frame(timestamp) {
    const delta = Math.min(50, Math.max(0, timestamp - lastFrameAt));
    lastFrameAt = timestamp;
    if (started && !paused && !cinematicActive && !resultVisible) {
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

  Events.on(engine, "collisionStart", (event) => {
    if (!shotState) return;
    event.pairs.forEach(({ bodyA, bodyB, collision }) => {
      const dataA = bodyData(bodyA);
      const dataB = bodyData(bodyB);
      if (dataA && dataB) {
        const relative = Math.hypot(bodyA.velocity.x - bodyB.velocity.x, bodyA.velocity.y - bodyB.velocity.y);
        audio.collision(relative);
        if (shotState.firstContact === null) {
          if (dataA.number === 0 && dataB.number > 0) shotState.firstContact = dataB.number;
          if (dataB.number === 0 && dataA.number > 0) shotState.firstContact = dataA.number;
        }
        if (collision?.supports?.[0]) spawnParticles(collision.supports[0].x, collision.supports[0].y, "#d9ede4", Math.min(4, Math.ceil(relative / 4)));
      }
      if (dataA && isRail(bodyB)) dataA.shotRailHits += 1;
      if (dataB && isRail(bodyA)) dataB.shotRailHits += 1;
    });
  });

  canvas.addEventListener("pointerdown", (event) => {
    audio.unlock();
    if (event.isPrimary === false) return;
    if (!canInteract()) return;
    event.preventDefault();
    const point = pointerToWorld(event);
    const target = nearestObjectBall(point, 46);
    if (target && runState.breakCompleted) {
      selectTarget(bodyData(target).number);
      return;
    }
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
      event.preventDefault();
      if (cinematicActive) closeCinematic();
      else togglePause();
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

  function togglePause() {
    if (!started || resultVisible || cinematicActive) return;
    paused = !paused;
    elements.pauseSheet.hidden = !paused;
    root.dataset.state = paused ? "paused" : shotState ? "rolling" : "aiming";
    if (!paused) lastFrameAt = performance.now();
  }

  elements.start.addEventListener("click", () => {
    audio.unlock();
    started = true;
    elements.opening.hidden = true;
    resetGame();
    root.dataset.state = "break";
    canvas.focus({ preventScroll: true });
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
  elements.pause.addEventListener("click", togglePause);
  elements.resume.addEventListener("click", togglePause);
  elements.restartPause.addEventListener("click", () => {
    elements.pauseSheet.hidden = true;
    resetGame();
  });
  elements.retry.addEventListener("click", () => {
    elements.result.hidden = true;
    resultVisible = false;
    resetGame();
    canvas.focus({ preventScroll: true });
  });
  elements.cinematicSkip.addEventListener("click", closeCinematic);
  elements.cinematicAction.addEventListener("click", closeCinematic);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && started && !resultVisible && !cinematicActive && !paused) togglePause();
  });
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) cancelAnimationFrame(frameHandle);
  });
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    cancelAnimationFrame(frameHandle);
    accumulator = 0;
    lastFrameAt = performance.now();
    frameHandle = requestAnimationFrame(frame);
  });

  buildRails();
  buildTimeline();
  rackBalls();
  if (coachSeen) elements.coach.classList.add("is-gone");
  syncUI();
  root.dataset.state = "ready";
  frameHandle = requestAnimationFrame(frame);

  window.__heartbeatBilliardsDebug = Object.freeze({
    snapshot() {
      return Object.freeze({
        started,
        paused,
        selectedBallNumber,
        runState,
        moving: Boolean(shotState),
        ballNumbers: Object.freeze(balls.map((ball) => bodyData(ball).number).sort((a, b) => a - b)),
        balls: Object.freeze(balls.map((ball) => Object.freeze({
          number: bodyData(ball).number,
          x: ball.position.x,
          y: ball.position.y,
          vx: ball.velocity.x,
          vy: ball.velocity.y
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
    reset() {
      started = true;
      elements.opening.hidden = true;
      resetGame();
    }
  });
})();
