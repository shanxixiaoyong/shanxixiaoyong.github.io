(() => {
  "use strict";

  const root = document.querySelector("#breakout-love-game");
  if (!root) return;
  const rules = window.BreakoutLoveRules;
  if (!rules) throw new Error("BreakoutLoveRules is required");

  const required = (selector) => {
    const node = document.querySelector(selector);
    if (!node) throw new Error(`Missing Breakout Love element: ${selector}`);
    return node;
  };

  const canvas = required("#bl-canvas");
  const stage = required("#bl-stage");
  const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
  if (!context) throw new Error("A 2D canvas context is required");

  const scoreNode = required("#bl-score");
  const bestNode = required("#bl-best");
  const levelNode = required("#bl-level");
  const kickerNode = required("#bl-kicker");
  const sceneNumberNode = required("#bl-scene-number");
  const sceneStatusNode = required("#bl-scene-status");
  const livesNode = required("#bl-lives");
  const lifeMarks = [...livesNode.querySelectorAll("i")];
  const statusNode = required("#bl-status");
  const momentNode = required("#bl-moment");
  const toastNode = required("#bl-toast");
  const charmsNode = required("#bl-charms");
  const soundButton = required("#bl-sound");
  const pauseButton = required("#bl-pause");
  const pauseSheet = required("#bl-pause-sheet");
  const resultSheet = required("#bl-result-sheet");
  const resultKicker = required("#bl-result-kicker");
  const resultTitle = required("#bl-result-title");
  const resultScore = required("#bl-result-score");
  const resultLine = required("#bl-result-line");
  const eventNode = required("#bl-event");
  const eventScene = required("#bl-event-scene");
  const eventKicker = required("#bl-event-kicker");
  const eventTitle = required("#bl-event-title");
  const eventLine = required("#bl-event-line");

  const WORLD_WIDTH = rules.WORLD_WIDTH;
  const FIXED_STEP = 1 / 120;
  const MAX_FRAME_DELTA = 0.08;
  const MAX_CATCHUP_STEPS = 12;
  const MAX_BACKLOG = FIXED_STEP * MAX_CATCHUP_STEPS;
  const PADDLE_BASE_WIDTH = 88;
  const PADDLE_EMBRACE_WIDTH = 132;
  const PADDLE_HEIGHT = 13;
  const PADDLE_BOTTOM = 37;
  const PADDLE_KEYBOARD_SPEED = 510;
  const BALL_RADIUS = 6;
  const BEST_KEY = "yl-breakout-love-best";
  const MILESTONE_KEY = "yl-breakout-love-seen-events";
  const SOUND_KEY = "yl-breakout-love-sound";
  const EVENT_DURATION = 2500;

  const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let reducedMotion = Boolean(reducedMotionQuery?.matches);
  let worldHeight = 620;
  let pixelScale = 1;
  let dpr = 1;
  let levelIndex = 0;
  let bricks = [];
  let totalBricks = 0;
  let destroyedBricks = 0;
  let balls = [];
  let drops = [];
  let particles = [];
  let floaters = [];
  let lightWaves = [];
  let sceneRect = { x: 10, y: 50, width: WORLD_WIDTH - 20, height: 230 };
  let scoreState = rules.createScoreState();
  let lives = 3;
  let best = readStoredNumber(BEST_KEY);
  let mode = "playing";
  let gameClock = 0;
  let launchAt = 0;
  let frameHandle = 0;
  let lastFrameAt = performance.now();
  let accumulator = 0;
  let ballSequence = 0;
  let runSequence = 0;
  let activePointerId = null;
  let activePointer = false;
  let rallyReturns = 0;
  let brickHitsThisVolley = 0;
  let screenFlash = 0;
  let screenShake = 0;
  let lightSweep = 0;
  let gameDestroyed = false;
  let suspendedForCache = false;
  let toastTimer = 0;
  let momentTimer = 0;
  let eventTimer = 0;
  let transitionTimer = 0;
  let charmRefreshAt = 0;
  let rng = rules.createRng(seedForRun());

  const keysDown = new Set();
  const managedTimers = new Set();
  const seenMilestones = readSeenMilestones();
  const sceneImages = new Map();
  const powerState = {
    embraceUntil: 0,
    courageUntil: 0
  };
  const paddle = {
    x: WORLD_WIDTH / 2,
    targetX: WORLD_WIDTH / 2,
    previousX: WORLD_WIDTH / 2,
    velocityX: 0,
    width: PADDLE_BASE_WIDTH,
    targetWidth: PADDLE_BASE_WIDTH,
    height: PADDLE_HEIGHT,
    y: worldHeight - PADDLE_BOTTOM
  };

  class LoveLetterAudio {
    constructor() {
      this.enabled = readStoredString(SOUND_KEY) !== "off";
      this.context = null;
      this.master = null;
      this.musicGain = null;
      this.sfxGain = null;
      this.scheduler = 0;
      this.nextNoteAt = 0;
      this.noteIndex = 0;
      this.intensity = 0;
      this.level = 0;
      this.musicPaused = false;
      this.bridge = window.HeartbeatAudio || null;
    }

    unlock() {
      if (!this.enabled) return;
      try {
        this.bridge?.unlock?.();
      } catch {
        this.bridge = null;
      }
      if (!this.context) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return;
        this.context = new AudioCtor();
        const compressor = this.context.createDynamicsCompressor();
        compressor.threshold.value = -18;
        compressor.knee.value = 14;
        compressor.ratio.value = 5;
        compressor.attack.value = 0.004;
        compressor.release.value = 0.22;
        this.master = this.context.createGain();
        this.musicGain = this.context.createGain();
        this.sfxGain = this.context.createGain();
        this.master.gain.value = 0.72;
        this.musicGain.gain.value = 0.05;
        this.sfxGain.gain.value = 0.22;
        this.musicGain.connect(compressor);
        this.sfxGain.connect(compressor);
        compressor.connect(this.master);
        this.master.connect(this.context.destination);
        this.nextNoteAt = this.context.currentTime + 0.05;
        this.scheduler = window.setInterval(() => this.scheduleMusic(), 45);
      }
      if (this.context.state === "suspended") this.context.resume().catch(() => {});
    }

    setEnabled(enabled) {
      this.enabled = Boolean(enabled);
      writeStoredString(SOUND_KEY, this.enabled ? "on" : "off");
      if (this.master && this.context) {
        this.master.gain.setTargetAtTime(this.enabled ? 0.72 : 0.0001, this.context.currentTime, 0.02);
      }
      if (this.enabled) this.unlock();
      else this.bridge?.pause?.("breakout-love");
    }

    setPaused(paused) {
      this.musicPaused = Boolean(paused);
      if (!this.context || !this.musicGain) return;
      const target = this.musicPaused || !this.enabled ? 0.0001 : 0.05;
      this.musicGain.gain.setTargetAtTime(target, this.context.currentTime, 0.04);
      if (!this.musicPaused) this.nextNoteAt = Math.max(this.nextNoteAt, this.context.currentTime + 0.05);
    }

    setIntensity(combo, ballCount, currentLevel) {
      this.intensity = Math.min(1, combo / 10 + Math.max(0, ballCount - 1) * 0.14);
      this.level = currentLevel;
    }

    scheduleMusic() {
      if (!this.enabled || !this.context || this.context.state !== "running" || this.musicPaused) return;
      const horizon = this.context.currentTime + 0.14;
      const bpm = 72 + this.intensity * 28 + this.level * 2;
      const step = 60 / bpm / 2;
      const roots = [220, 196, 233.08, 207.65];
      const scale = [0, 3, 5, 7, 10, 12, 15, 17];
      while (this.nextNoteAt < horizon) {
        const rootFrequency = roots[this.level % roots.length];
        const interval = scale[(this.noteIndex * 3 + this.level) % scale.length];
        const frequency = rootFrequency * (2 ** (interval / 12));
        const accented = this.noteIndex % 4 === 0;
        this.tone(frequency, this.nextNoteAt, accented ? 0.28 : 0.18, "triangle", accented ? 0.022 : 0.014, this.musicGain);
        if (this.noteIndex % 8 === 0) {
          this.tone(rootFrequency / 2, this.nextNoteAt, step * 5, "sine", 0.018, this.musicGain);
        }
        if (this.intensity > 0.62 && this.noteIndex % 2 === 1) {
          this.tone(frequency * 2, this.nextNoteAt, 0.08, "sine", 0.008, this.musicGain);
        }
        this.nextNoteAt += step;
        this.noteIndex += 1;
      }
    }

    tone(frequency, start, duration, type, gainValue, destination, endFrequency = null) {
      if (!this.context || !destination || !this.enabled) return;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(Math.max(30, frequency), start);
      if (endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), start + duration);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), start + Math.min(0.018, duration * 0.2));
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    }

    cue(name, amount = 0.5) {
      if (!this.enabled) return;
      this.unlock();
      try {
        this.bridge?.play?.(`breakout-love:${name}`, { intensity: amount });
      } catch {
        this.bridge = null;
      }
      if (!this.context || !this.sfxGain) return;
      const now = this.context.currentTime;
      if (name === "wall") {
        this.tone(250 + amount * 80, now, 0.045, "sine", 0.025, this.sfxGain, 310 + amount * 90);
      } else if (name === "paddle") {
        this.tone(178, now, 0.075, "triangle", 0.04, this.sfxGain, 268);
      } else if (name === "guard") {
        this.tone(320 + amount * 120, now, 0.07, "square", 0.025, this.sfxGain, 210);
      } else if (name === "break") {
        this.tone(430 + amount * 180, now, 0.09, "triangle", 0.045, this.sfxGain, 720 + amount * 100);
        this.tone(860, now + 0.025, 0.07, "sine", 0.018, this.sfxGain, 1080);
      } else if (name === "power") {
        [0, 4, 7, 12].forEach((semitone, index) => {
          this.tone(330 * (2 ** (semitone / 12)), now + index * 0.055, 0.15, "sine", 0.04, this.sfxGain);
        });
      } else if (name === "miss") {
        this.tone(240, now, 0.32, "triangle", 0.055, this.sfxGain, 82);
      } else if (name === "milestone") {
        [0, 3, 7, 10].forEach((semitone, index) => {
          this.tone(246.94 * (2 ** (semitone / 12)), now + index * 0.075, 0.48, "sine", 0.052, this.sfxGain);
        });
      } else if (name === "level") {
        [0, 5, 9, 12].forEach((semitone, index) => {
          this.tone(220 * (2 ** (semitone / 12)), now + index * 0.07, 0.24, "triangle", 0.04, this.sfxGain);
        });
      } else if (name === "victory") {
        [0, 4, 7, 11, 12, 16].forEach((semitone, index) => {
          this.tone(196 * (2 ** (semitone / 12)), now + index * 0.1, 0.55, "sine", 0.055, this.sfxGain);
        });
      }
    }

    suspend() {
      this.setPaused(true);
      this.context?.suspend?.().catch(() => {});
    }

    resume() {
      if (!this.enabled) return;
      this.unlock();
      this.setPaused(false);
    }

    destroy() {
      if (this.scheduler) window.clearInterval(this.scheduler);
      this.scheduler = 0;
      try {
        this.bridge?.stop?.("breakout-love");
      } catch {
        this.bridge = null;
      }
      this.context?.close?.().catch(() => {});
      this.context = null;
    }
  }

  const audio = new LoveLetterAudio();

  function seedForRun() {
    const values = new Uint32Array(1);
    window.crypto?.getRandomValues?.(values);
    return (values[0] || Date.now()) >>> 0;
  }

  function readStoredString(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeStoredString(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // Storage is optional; gameplay remains fully local to this page session.
    }
  }

  function readStoredNumber(key) {
    const value = Number(readStoredString(key) || 0);
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  }

  function readSeenMilestones() {
    try {
      const parsed = JSON.parse(readStoredString(MILESTONE_KEY) || "[]");
      return new Set(Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : []);
    } catch {
      return new Set();
    }
  }

  function persistSeenMilestones() {
    writeStoredString(MILESTONE_KEY, JSON.stringify([...seenMilestones].slice(-64)));
  }

  function managedDelay(callback, duration) {
    const timer = window.setTimeout(() => {
      managedTimers.delete(timer);
      callback();
    }, duration);
    managedTimers.add(timer);
    return timer;
  }

  function clearManagedTimer(timer) {
    if (!timer) return 0;
    window.clearTimeout(timer);
    managedTimers.delete(timer);
    return 0;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function formatScore(value) {
    return String(Math.max(0, Math.round(value))).padStart(6, "0");
  }

  function vibrate(pattern) {
    window.navigator?.vibrate?.(pattern);
  }

  function preloadScenes() {
    rules.LEVELS.forEach((level) => {
      const image = new Image();
      image.decoding = "async";
      image.addEventListener("load", () => render(performance.now()), { once: true });
      image.src = level.scene;
      sceneImages.set(level.id, image);
    });
  }

  function resizeCanvas() {
    const rect = stage.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const previousHeight = worldHeight;
    dpr = clamp(window.devicePixelRatio || 1, 1, 3);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    pixelScale = canvas.width / WORLD_WIDTH;
    worldHeight = canvas.height / pixelScale;
    const floorDelta = worldHeight - previousHeight;
    paddle.y = worldHeight - PADDLE_BOTTOM;
    paddle.x = clamp(paddle.x, paddle.width / 2 + 5, WORLD_WIDTH - paddle.width / 2 - 5);
    paddle.targetX = clamp(paddle.targetX, paddle.width / 2 + 5, WORLD_WIDTH - paddle.width / 2 - 5);
    balls.forEach((ball) => {
      if (ball.attached) {
        ball.x = paddle.x;
        ball.y = paddle.y - ball.radius - 3;
      } else {
        const floorInfluence = clamp((ball.y - 280) / Math.max(1, previousHeight - 280), 0, 1);
        ball.y = clamp(ball.y + floorDelta * floorInfluence, ball.radius, worldHeight + ball.radius);
      }
    });
    drops.forEach((drop) => {
      drop.y = clamp(drop.y + floorDelta * 0.35, 0, worldHeight + 20);
    });
    render(performance.now());
  }

  function setScore(valueState = scoreState) {
    scoreNode.textContent = formatScore(valueState.score);
    if (valueState.score > best) {
      best = valueState.score;
      writeStoredString(BEST_KEY, best);
    }
    bestNode.textContent = formatScore(best);
  }

  function setLives() {
    lifeMarks.forEach((mark, index) => mark.classList.toggle("is-spent", index >= lives));
    livesNode.setAttribute("aria-label", `剩余${lives}次回信`);
  }

  function setLevelCopy() {
    const level = rules.getLevel(levelIndex);
    kickerNode.textContent = level.kicker;
    levelNode.textContent = `${level.number} · ${level.title}`;
    sceneNumberNode.textContent = `SCENE ${level.number}`;
    sceneStatusNode.textContent = level.status;
    document.title = `心动打砖块 · ${level.title}`;
  }

  function setStatus(copy) {
    statusNode.textContent = copy;
  }

  function showToast(copy) {
    toastTimer = clearManagedTimer(toastTimer);
    toastNode.classList.remove("is-visible");
    toastNode.textContent = copy;
    void toastNode.offsetWidth;
    toastNode.classList.add("is-visible");
    toastTimer = managedDelay(() => {
      toastNode.classList.remove("is-visible");
      toastTimer = 0;
    }, reducedMotion ? 180 : 1260);
  }

  function showMoment(copy) {
    momentTimer = clearManagedTimer(momentTimer);
    momentNode.classList.remove("is-visible");
    momentNode.textContent = copy;
    void momentNode.offsetWidth;
    momentNode.classList.add("is-visible");
    momentTimer = managedDelay(() => {
      momentNode.classList.remove("is-visible");
      momentTimer = 0;
    }, reducedMotion ? 180 : 1080);
  }

  function updateCharms(force = false) {
    if (!force && gameClock < charmRefreshAt) return;
    charmRefreshAt = gameClock + 250;
    const fragment = document.createDocumentFragment();
    [
      ["embrace", powerState.embraceUntil],
      ["courage", powerState.courageUntil]
    ].forEach(([powerId, until]) => {
      if (until <= gameClock) return;
      const power = rules.POWER_UPS[powerId];
      const node = document.createElement("span");
      node.className = "bl-charm";
      node.style.setProperty("--charm-color", power.color);
      node.textContent = `${power.label} ${Math.ceil((until - gameClock) / 1000)}s`;
      fragment.append(node);
    });
    charmsNode.replaceChildren(fragment);
  }

  function createBall(attached = true) {
    ballSequence += 1;
    return {
      id: ballSequence,
      x: paddle.x,
      y: paddle.y - BALL_RADIUS - 3,
      radius: BALL_RADIUS,
      velocityX: 0,
      velocityY: 0,
      attached,
      alive: true,
      trail: [],
      hitCooldown: new Map()
    };
  }

  function launchBall(ball, angleOffset = 0) {
    if (!ball.attached) return;
    const speed = rules.speedForLevel(levelIndex, destroyedBricks / Math.max(1, totalBricks));
    const direction = rng() < 0.5 ? -1 : 1;
    const angle = (0.38 + rng() * 0.16) * direction + angleOffset;
    ball.attached = false;
    ball.velocityX = Math.sin(angle) * speed;
    ball.velocityY = -Math.cos(angle) * speed;
    audio.cue("paddle", 0.25);
  }

  function launchAttachedBalls() {
    balls.forEach((ball, index) => launchBall(ball, (index - (balls.length - 1) / 2) * 0.08));
    launchAt = Number.POSITIVE_INFINITY;
  }

  function loadLevel(nextLevelIndex) {
    levelIndex = nextLevelIndex;
    const levelBricks = rules.buildBricks(levelIndex);
    bricks = levelBricks.map((brick) => ({
      ...brick,
      hp: brick.maxHp,
      alive: true,
      hitPulse: 0
    }));
    totalBricks = bricks.length;
    destroyedBricks = 0;
    const top = Math.min(...bricks.map((brick) => brick.y)) - 8;
    const bottom = Math.max(...bricks.map((brick) => brick.y + brick.height)) + 8;
    sceneRect = { x: 10, y: top, width: WORLD_WIDTH - 20, height: bottom - top };
    balls = [createBall(true)];
    drops = [];
    particles = [];
    floaters = [];
    rallyReturns = 0;
    brickHitsThisVolley = 0;
    powerState.embraceUntil = 0;
    powerState.courageUntil = 0;
    paddle.width = PADDLE_BASE_WIDTH;
    paddle.targetWidth = PADDLE_BASE_WIDTH;
    paddle.x = WORLD_WIDTH / 2;
    paddle.targetX = paddle.x;
    paddle.y = worldHeight - PADDLE_BOTTOM;
    launchAt = gameClock + 1050;
    mode = "playing";
    setLevelCopy();
    setLives();
    updateCharms(true);
    setStatus(rules.getLevel(levelIndex).status);
    audio.level = levelIndex;
    audio.setPaused(false);
    lightSweep = reducedMotion ? 0.18 : 0.72;
    lightWaves.push({ x: WORLD_WIDTH / 2, y: paddle.y - 80, radius: 8, life: 1, color: "#79c7c4" });
  }

  function resetGame() {
    runSequence += 1;
    rng = rules.createRng((seedForRun() + runSequence) >>> 0);
    eventTimer = clearManagedTimer(eventTimer);
    transitionTimer = clearManagedTimer(transitionTimer);
    eventNode.hidden = true;
    pauseSheet.hidden = true;
    resultSheet.hidden = true;
    scoreState = rules.createScoreState();
    lives = 3;
    gameClock = 0;
    accumulator = 0;
    screenFlash = 0;
    screenShake = 0;
    setScore();
    loadLevel(0);
    updatePauseButton();
    root.dataset.state = "playing";
  }

  function spawnMultiball() {
    const source = balls.find((ball) => ball.alive);
    if (!source) return;
    if (source.attached) launchBall(source);
    const sourceAngle = Math.atan2(source.velocityY, source.velocityX);
    const speed = Math.hypot(source.velocityX, source.velocityY);
    [-0.36, 0.36].forEach((offset) => {
      if (balls.length >= 5) return;
      const ball = createBall(false);
      const angle = sourceAngle + offset;
      ball.x = source.x;
      ball.y = source.y;
      ball.velocityX = Math.cos(angle) * speed;
      ball.velocityY = Math.sin(angle) * speed;
      balls.push(ball);
    });
  }

  function applyPower(powerId) {
    const power = rules.POWER_UPS[powerId];
    if (!power) return;
    if (powerId === "embrace") {
      powerState.embraceUntil = Math.max(powerState.embraceUntil, gameClock) + power.durationMs;
      paddle.targetWidth = PADDLE_EMBRACE_WIDTH;
    } else if (powerId === "courage") {
      powerState.courageUntil = Math.max(powerState.courageUntil, gameClock) + power.durationMs;
    } else if (powerId === "echo") {
      spawnMultiball();
    }
    audio.cue("power", 0.8);
    vibrate([10, 24, 12]);
    showMoment(power.label);
    showToast(power.line);
    screenFlash = reducedMotion ? 0.08 : 0.38;
    lightWaves.push({ x: paddle.x, y: paddle.y, radius: 8, life: 1, color: power.color });
    updateCharms(true);
  }

  function createPowerDrop(brick) {
    if (!brick.gift) return;
    drops.push({
      x: brick.x + brick.width / 2,
      y: brick.y + brick.height / 2,
      velocityY: 88,
      size: 8,
      type: brick.gift,
      rotation: rng() * Math.PI * 2,
      alive: true
    });
  }

  function hexToRgba(hex, alpha) {
    const value = Number.parseInt(hex.slice(1), 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  function brickColor(brick) {
    const palette = rules.getLevel(levelIndex).palette;
    return palette[(brick.row * 2 + brick.column) % palette.length];
  }

  function spawnBrickParticles(brick, color, strong = false) {
    const count = reducedMotion ? 3 : strong ? 14 : 8;
    for (let index = 0; index < count; index += 1) {
      particles.push({
        x: brick.x + brick.width * (0.2 + rng() * 0.6),
        y: brick.y + brick.height * (0.25 + rng() * 0.5),
        velocityX: (rng() - 0.5) * (strong ? 190 : 120),
        velocityY: -30 - rng() * (strong ? 160 : 90),
        life: 0.42 + rng() * 0.42,
        maxLife: 0.84,
        size: 1.5 + rng() * 3.5,
        color,
        rotation: rng() * Math.PI
      });
    }
  }

  function addFloater(x, y, text, color) {
    floaters.push({ x, y, text, color, life: 0.8, maxLife: 0.8 });
  }

  function stabilizeBall(ball) {
    const speed = Math.max(1, Math.hypot(ball.velocityX, ball.velocityY));
    const desiredSpeed = rules.speedForLevel(levelIndex, destroyedBricks / Math.max(1, totalBricks));
    const targetSpeed = clamp(speed, desiredSpeed * 0.92, desiredSpeed * 1.08);
    ball.velocityX = ball.velocityX / speed * targetSpeed;
    ball.velocityY = ball.velocityY / speed * targetSpeed;
    const minimumVertical = targetSpeed * 0.24;
    if (Math.abs(ball.velocityY) < minimumVertical) {
      const sign = ball.velocityY >= 0 ? 1 : -1;
      ball.velocityY = sign * minimumVertical;
      const horizontal = Math.sqrt(Math.max(0, targetSpeed * targetSpeed - minimumVertical * minimumVertical));
      ball.velocityX = (ball.velocityX >= 0 ? 1 : -1) * horizontal;
    }
  }

  function hitBrick(brick, ball, piercing) {
    const previousDestroyed = destroyedBricks;
    const armored = brick.maxHp > 1;
    brick.hp = piercing ? 0 : brick.hp - 1;
    brick.hitPulse = 1;
    const destroyedNow = brick.hp <= 0;
    const outcome = rules.scoreBrickHit(scoreState, {
      timestamp: Math.round(gameClock),
      levelIndex,
      destroyed: destroyedNow,
      armored,
      piercing
    });
    scoreState = outcome.state;
    setScore();
    addFloater(
      brick.x + brick.width / 2,
      brick.y + brick.height / 2,
      `+${outcome.points}${outcome.combo > 1 ? `  ×${outcome.combo}` : ""}`,
      brickColor(brick)
    );
    if (outcome.moment) showMoment(outcome.moment);

    if (destroyedNow) {
      brick.alive = false;
      destroyedBricks += 1;
      brickHitsThisVolley += 1;
      const color = brickColor(brick);
      spawnBrickParticles(brick, color, piercing || brick.maxHp >= 3);
      createPowerDrop(brick);
      audio.cue("break", outcome.combo / rules.MAX_COMBO);
      screenShake = reducedMotion ? 0 : Math.min(5, 1.4 + outcome.combo * 0.16);

      if (destroyedBricks === totalBricks) {
        const clearAward = rules.awardLevelClear(scoreState, levelIndex, lives);
        scoreState = clearAward.state;
        setScore();
        addFloater(WORLD_WIDTH / 2, sceneRect.y + sceneRect.height / 2, `+${clearAward.points}`, "#f4c66f");
      }

      const milestones = rules.crossedMilestones(
        levelIndex,
        previousDestroyed,
        destroyedBricks,
        totalBricks
      );
      if (milestones.length) {
        const milestone = milestones[milestones.length - 1];
        playMilestone(milestone, destroyedBricks === totalBricks);
      }
    } else {
      spawnBrickParticles(brick, brickColor(brick), false);
      audio.cue("guard", brick.hp / brick.maxHp);
    }
  }

  function updatePaddle(delta) {
    paddle.previousX = paddle.x;
    const leftPressed = keysDown.has("ArrowLeft") || keysDown.has("a") || keysDown.has("A");
    const rightPressed = keysDown.has("ArrowRight") || keysDown.has("d") || keysDown.has("D");
    const direction = Number(rightPressed) - Number(leftPressed);
    if (!activePointer && direction !== 0) {
      paddle.targetX += direction * PADDLE_KEYBOARD_SPEED * delta;
    }
    paddle.width += (paddle.targetWidth - paddle.width) * Math.min(1, delta * 11);
    const edge = paddle.width / 2 + 5;
    paddle.targetX = clamp(paddle.targetX, edge, WORLD_WIDTH - edge);
    paddle.x += (paddle.targetX - paddle.x) * Math.min(1, delta * (activePointer ? 45 : 18));
    paddle.x = clamp(paddle.x, edge, WORLD_WIDTH - edge);
    paddle.velocityX = clamp((paddle.x - paddle.previousX) / Math.max(delta, 0.001), -900, 900);
  }

  function updateBall(ball, delta) {
    if (ball.attached) {
      ball.x = paddle.x;
      ball.y = paddle.y - ball.radius - 3;
      ball.trail.length = 0;
      if (gameClock >= launchAt) launchBall(ball);
      return;
    }

    const previousY = ball.y;
    ball.x += ball.velocityX * delta;
    ball.y += ball.velocityY * delta;
    ball.trail.unshift({ x: ball.x, y: ball.y });
    if (ball.trail.length > (reducedMotion ? 3 : 9)) ball.trail.length = reducedMotion ? 3 : 9;

    if (ball.x - ball.radius < 2) {
      ball.x = 2 + ball.radius;
      ball.velocityX = Math.abs(ball.velocityX);
      audio.cue("wall", 0.16);
    } else if (ball.x + ball.radius > WORLD_WIDTH - 2) {
      ball.x = WORLD_WIDTH - 2 - ball.radius;
      ball.velocityX = -Math.abs(ball.velocityX);
      audio.cue("wall", 0.16);
    }
    if (ball.y - ball.radius < 2) {
      ball.y = 2 + ball.radius;
      ball.velocityY = Math.abs(ball.velocityY);
      audio.cue("wall", 0.28);
    }

    const paddleRect = {
      x: paddle.x - paddle.width / 2,
      y: paddle.y,
      width: paddle.width,
      height: paddle.height
    };
    if (ball.velocityY > 0 && previousY + ball.radius <= paddle.y + 3) {
      const collision = rules.circleRectCollision(ball, paddleRect);
      if (collision) {
        const speed = Math.max(
          rules.speedForLevel(levelIndex, destroyedBricks / Math.max(1, totalBricks)),
          Math.hypot(ball.velocityX, ball.velocityY)
        );
        const hitOffset = clamp((ball.x - paddle.x) / (paddle.width / 2), -1, 1);
        const bounced = rules.paddleBounce(hitOffset, speed, paddle.velocityX / 720);
        ball.y = paddle.y - ball.radius - 0.25;
        ball.velocityX = bounced.velocityX;
        ball.velocityY = bounced.velocityY;
        rallyReturns += 1;
        const volleyCopy = rules.volleyMoment(rallyReturns);
        if (volleyCopy) {
          showMoment(volleyCopy);
          showToast(`第 ${rallyReturns} 次回信 · ${brickHitsThisVolley || "仍在等待"}`);
        }
        brickHitsThisVolley = 0;
        audio.cue("paddle", Math.abs(hitOffset));
        vibrate(6);
        lightWaves.push({ x: ball.x, y: paddle.y, radius: 4, life: 0.46, color: "#79c7c4" });
      }
    }

    const piercing = gameClock < powerState.courageUntil;
    for (const brick of bricks) {
      if (!brick.alive) continue;
      const lastHit = ball.hitCooldown.get(brick.id) || -Infinity;
      if (gameClock - lastHit < 72) continue;
      const collision = rules.circleRectCollision(ball, brick);
      if (!collision) continue;
      ball.hitCooldown.set(brick.id, gameClock);
      if (!piercing) {
        ball.x += collision.normalX * (collision.penetration + 0.2);
        ball.y += collision.normalY * (collision.penetration + 0.2);
        const reflected = rules.reflectVelocity(
          ball.velocityX,
          ball.velocityY,
          collision.normalX,
          collision.normalY
        );
        ball.velocityX = reflected.velocityX;
        ball.velocityY = reflected.velocityY;
        stabilizeBall(ball);
      }
      hitBrick(brick, ball, piercing);
      if (!piercing || mode !== "playing") break;
    }

    if (ball.y - ball.radius > worldHeight + 8) ball.alive = false;
  }

  function updateDrops(delta) {
    const paddleTop = paddle.y;
    drops.forEach((drop) => {
      drop.y += drop.velocityY * delta;
      drop.rotation += delta * 2.6;
      const caught = drop.y + drop.size >= paddleTop
        && drop.y - drop.size <= paddleTop + paddle.height
        && Math.abs(drop.x - paddle.x) <= paddle.width / 2 + drop.size;
      if (caught) {
        drop.alive = false;
        applyPower(drop.type);
      } else if (drop.y - drop.size > worldHeight) {
        drop.alive = false;
      }
    });
    drops = drops.filter((drop) => drop.alive);
  }

  function handleMiss() {
    lives -= 1;
    setLives();
    scoreState = rules.breakCombo(scoreState);
    rallyReturns = 0;
    brickHitsThisVolley = 0;
    powerState.embraceUntil = 0;
    powerState.courageUntil = 0;
    paddle.targetWidth = PADDLE_BASE_WIDTH;
    drops = [];
    updateCharms(true);
    audio.cue("miss", 1);
    vibrate([18, 34, 18]);
    screenFlash = reducedMotion ? 0.04 : 0.18;
    if (lives <= 0) {
      showResult(false);
      return;
    }
    balls = [createBall(true)];
    launchAt = gameClock + 1050;
    const copies = [
      "晚风把它送回来了",
      "光落下，但方向还在",
      "下一封会穿过夜色"
    ];
    setStatus(copies[(3 - lives) % copies.length]);
    showToast(`还剩 ${lives} 封回信`);
  }

  function updateGame(delta) {
    gameClock += delta * 1000;
    updatePaddle(delta);
    if (powerState.embraceUntil <= gameClock) paddle.targetWidth = PADDLE_BASE_WIDTH;
    balls.forEach((ball) => {
      if (mode === "playing" && ball.alive) updateBall(ball, delta);
    });
    balls = balls.filter((ball) => ball.alive);
    if (mode !== "playing") return;
    updateDrops(delta);
    if (balls.length === 0) handleMiss();
    if (scoreState.combo > 0
        && scoreState.lastHitAt !== null
        && gameClock - scoreState.lastHitAt > rules.COMBO_WINDOW_MS) {
      scoreState = rules.breakCombo(scoreState);
    }
    updateCharms();
    bricks.forEach((brick) => {
      brick.hitPulse = Math.max(0, brick.hitPulse - delta * 5.5);
    });
    audio.setIntensity(scoreState.combo, balls.length, levelIndex);
  }

  function updateVisuals(delta) {
    const visualDelta = Math.min(delta, 0.05);
    particles.forEach((particle) => {
      particle.x += particle.velocityX * visualDelta;
      particle.y += particle.velocityY * visualDelta;
      particle.velocityY += 250 * visualDelta;
      particle.rotation += visualDelta * 4;
      particle.life -= visualDelta;
    });
    particles = particles.filter((particle) => particle.life > 0);
    floaters.forEach((floater) => {
      floater.y -= 29 * visualDelta;
      floater.life -= visualDelta;
    });
    floaters = floaters.filter((floater) => floater.life > 0);
    lightWaves.forEach((wave) => {
      wave.radius += 150 * visualDelta;
      wave.life -= visualDelta * 1.45;
    });
    lightWaves = lightWaves.filter((wave) => wave.life > 0);
    screenFlash = Math.max(0, screenFlash - visualDelta * 1.8);
    screenShake = Math.max(0, screenShake - visualDelta * 12);
    lightSweep = Math.max(0, lightSweep - visualDelta * 0.75);
  }

  function populateEventScene(effect) {
    const fragment = document.createDocumentFragment();
    const denseEffects = new Set(["rain", "umbrella", "constellation"]);
    const count = reducedMotion ? 7 : denseEffects.has(effect) ? 34 : 22;
    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement("i");
      particle.className = "bl-event-particle";
      particle.style.setProperty("--x", `${Math.round(rng() * 100)}%`);
      particle.style.setProperty("--y", `${Math.round(5 + rng() * 78)}%`);
      particle.style.setProperty("--delay", `${Math.round(-rng() * 1700)}ms`);
      particle.style.setProperty("--duration", `${Math.round(1200 + rng() * 1300)}ms`);
      particle.style.setProperty("--scale", (0.55 + rng() * 1.25).toFixed(2));
      fragment.append(particle);
    }
    eventScene.replaceChildren(fragment);
  }

  function playMilestone(milestone, levelComplete) {
    const firstPerformance = !seenMilestones.has(milestone.key);
    if (firstPerformance) {
      seenMilestones.add(milestone.key);
      persistSeenMilestones();
      showFullEvent(milestone, levelComplete);
      return;
    }
    playRepeatLight(milestone);
    if (levelComplete) {
      mode = "transition";
      root.dataset.state = "transition";
      audio.setPaused(true);
      transitionTimer = clearManagedTimer(transitionTimer);
      transitionTimer = managedDelay(() => {
        transitionTimer = 0;
        advanceLevel();
      }, reducedMotion ? 180 : 760);
    }
  }

  function showFullEvent(milestone, levelComplete) {
    mode = "event";
    root.dataset.state = "event";
    audio.setPaused(true);
    audio.cue("milestone", 1);
    vibrate([12, 36, 16, 50, 20]);
    eventTimer = clearManagedTimer(eventTimer);
    eventNode.hidden = false;
    eventNode.dataset.effect = milestone.effect;
    eventKicker.textContent = milestone.kicker;
    eventTitle.textContent = milestone.title;
    eventLine.textContent = milestone.line;
    populateEventScene(milestone.effect);
    void eventNode.offsetWidth;
    eventTimer = managedDelay(() => {
      eventTimer = 0;
      eventNode.hidden = true;
      eventNode.removeAttribute("data-effect");
      if (levelComplete) advanceLevel();
      else {
        mode = "playing";
        root.dataset.state = "playing";
        audio.setPaused(false);
        lastFrameAt = performance.now();
      }
    }, reducedMotion ? 520 : EVENT_DURATION);
  }

  function playRepeatLight(milestone) {
    lightSweep = reducedMotion ? 0.28 : 1;
    screenFlash = reducedMotion ? 0.06 : 0.34;
    const colors = ["#f4c66f", "#79c7c4", "#e56483"];
    colors.forEach((color, index) => {
      lightWaves.push({
        x: WORLD_WIDTH / 2,
        y: sceneRect.y + sceneRect.height / 2,
        radius: 10 + index * 18,
        life: 0.75 + index * 0.14,
        color
      });
    });
    showMoment(milestone.title);
    showToast(`${milestone.kicker} · ${milestone.line}`);
    audio.cue("milestone", 0.7);
  }

  function advanceLevel() {
    eventNode.hidden = true;
    if (levelIndex >= rules.LEVELS.length - 1) {
      showResult(true);
      return;
    }
    audio.cue("level", 0.8);
    loadLevel(levelIndex + 1);
    showToast(`第 ${rules.getLevel(levelIndex).number} 幕 · ${rules.getLevel(levelIndex).title}`);
    updatePauseButton();
  }

  function showResult(victory) {
    mode = victory ? "victory" : "gameover";
    root.dataset.state = mode;
    pauseSheet.hidden = true;
    resultSheet.hidden = false;
    resultKicker.textContent = victory ? "所有防线已经透亮" : "信号中断";
    resultTitle.textContent = victory ? "回信抵达明天" : "这一封没有抵达";
    resultScore.textContent = formatScore(scoreState.score);
    resultLine.textContent = victory
      ? "雨夜、晚风与星光，都记住了同一个答案。"
      : "但晚风还记得来时的方向。";
    setStatus(victory ? "明天仍会亮起新的信号" : "夜色还没有写完结尾");
    audio.setPaused(true);
    audio.cue(victory ? "victory" : "miss", 1);
    if (scoreState.score > best) {
      best = scoreState.score;
      writeStoredString(BEST_KEY, best);
      bestNode.textContent = formatScore(best);
    }
    updatePauseButton();
  }

  function pauseGame(source = "manual") {
    if (mode !== "playing") return;
    mode = "paused";
    root.dataset.state = "paused";
    pauseSheet.hidden = false;
    setStatus(source === "lifecycle" ? "夜色替你收好了这一刻" : "回信停在半空");
    audio.setPaused(true);
    updatePauseButton();
  }

  function resumeGame() {
    if (mode !== "paused") return;
    mode = "playing";
    root.dataset.state = "playing";
    pauseSheet.hidden = true;
    setStatus(rules.getLevel(levelIndex).status);
    accumulator = 0;
    lastFrameAt = performance.now();
    audio.resume();
    updatePauseButton();
    canvas.focus({ preventScroll: true });
  }

  function updatePauseButton() {
    const paused = mode === "paused";
    pauseButton.querySelector("span").textContent = paused ? "▶" : "Ⅱ";
    pauseButton.setAttribute("aria-label", paused ? "继续游戏" : "暂停游戏");
    pauseButton.title = paused ? "继续" : "暂停";
  }

  function pointerToWorldX(event) {
    const rect = canvas.getBoundingClientRect();
    return clamp((event.clientX - rect.left) / Math.max(1, rect.width) * WORLD_WIDTH, 0, WORLD_WIDTH);
  }

  function movePaddleToPointer(event) {
    const edge = paddle.width / 2 + 5;
    paddle.targetX = clamp(pointerToWorldX(event), edge, WORLD_WIDTH - edge);
    if (activePointer) paddle.x = paddle.targetX;
  }

  function onPointerDown(event) {
    if (mode !== "playing") return;
    event.preventDefault();
    audio.unlock();
    activePointerId = event.pointerId;
    activePointer = true;
    canvas.setPointerCapture?.(event.pointerId);
    movePaddleToPointer(event);
    launchAttachedBalls();
    canvas.focus({ preventScroll: true });
  }

  function onPointerMove(event) {
    if (!activePointer || event.pointerId !== activePointerId || mode !== "playing") return;
    event.preventDefault();
    movePaddleToPointer(event);
  }

  function releasePointer(event) {
    if (event.pointerId !== activePointerId) return;
    activePointer = false;
    activePointerId = null;
    canvas.releasePointerCapture?.(event.pointerId);
  }

  function onKeyDown(event) {
    const key = event.key;
    const movementKey = ["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(key);
    if (movementKey || key === " " || key === "Spacebar") event.preventDefault();
    if (event.repeat && !movementKey) return;
    audio.unlock();
    if (movementKey) keysDown.add(key);
    if (key === "p" || key === "P" || key === "Escape") {
      if (mode === "paused") resumeGame();
      else pauseGame();
    } else if (key === "r" || key === "R") {
      resetGame();
    } else if (key === " " || key === "Spacebar") {
      if (mode === "paused") resumeGame();
      else if (mode === "playing") launchAttachedBalls();
    }
  }

  function onKeyUp(event) {
    keysDown.delete(event.key);
  }

  function onVisibilityChange() {
    if (document.hidden) {
      pauseGame("lifecycle");
      audio.suspend();
    }
  }

  function onMotionPreferenceChange(event) {
    reducedMotion = event.matches;
    if (reducedMotion) {
      screenShake = 0;
      balls.forEach((ball) => {
        if (ball.trail.length > 3) ball.trail.length = 3;
      });
    }
  }

  function onPageHide(event) {
    if (event.persisted) {
      suspendedForCache = true;
      pauseGame("lifecycle");
      audio.suspend();
      if (frameHandle) cancelAnimationFrame(frameHandle);
      frameHandle = 0;
      return;
    }
    destroyGame();
  }

  function onPageShow(event) {
    if (!event.persisted || gameDestroyed) return;
    suspendedForCache = false;
    resizeCanvas();
    lastFrameAt = performance.now();
    if (!frameHandle) frameHandle = requestAnimationFrame(frame);
  }

  function roundRectPath(ctx, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + safeRadius, y);
    ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
    ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
    ctx.arcTo(x, y + height, x, y, safeRadius);
    ctx.arcTo(x, y, x + width, y, safeRadius);
    ctx.closePath();
  }

  function drawImageCover(image, destination, focusY = 0.42) {
    if (!image || !image.complete || !image.naturalWidth) return false;
    const destinationRatio = destination.width / destination.height;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = image.naturalWidth;
    let sourceHeight = image.naturalHeight;
    if (imageRatio > destinationRatio) {
      sourceWidth = image.naturalHeight * destinationRatio;
      sourceX = (image.naturalWidth - sourceWidth) / 2;
    } else {
      sourceHeight = image.naturalWidth / destinationRatio;
      sourceY = (image.naturalHeight - sourceHeight) * focusY;
    }
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      destination.x,
      destination.y,
      destination.width,
      destination.height
    );
    return true;
  }

  function drawBackground(now) {
    const level = rules.getLevel(levelIndex);
    const gradient = context.createLinearGradient(0, 0, WORLD_WIDTH, worldHeight);
    gradient.addColorStop(0, "#171015");
    gradient.addColorStop(0.48, "#0c0c0f");
    gradient.addColorStop(1, "#071012");
    context.fillStyle = gradient;
    context.fillRect(0, 0, WORLD_WIDTH, worldHeight);

    const image = sceneImages.get(level.id);
    context.save();
    context.globalAlpha = 0.105;
    drawImageCover(image, { x: 0, y: 0, width: WORLD_WIDTH, height: worldHeight }, 0.4);
    context.restore();

    context.save();
    context.strokeStyle = "rgba(255, 241, 221, 0.035)";
    context.lineWidth = 0.7;
    for (let y = sceneRect.y + sceneRect.height + 34; y < worldHeight; y += 42) {
      context.beginPath();
      context.moveTo(8, y);
      context.lineTo(WORLD_WIDTH - 8, y);
      context.stroke();
    }
    for (let x = 24; x < WORLD_WIDTH; x += 58) {
      const drift = Math.sin(now * 0.00022 + x) * 5;
      context.fillStyle = x % 116 === 24 ? "rgba(121, 199, 196, 0.09)" : "rgba(239, 189, 103, 0.07)";
      context.fillRect(x + drift, sceneRect.y + sceneRect.height + 24, 1, Math.max(0, worldHeight - sceneRect.y - sceneRect.height - 88));
    }
    context.restore();
  }

  function drawSceneReveal() {
    const level = rules.getLevel(levelIndex);
    const image = sceneImages.get(level.id);
    const focusPoints = [0.27, 0.4, 0.45, 0.32];
    context.save();
    roundRectPath(context, sceneRect.x, sceneRect.y, sceneRect.width, sceneRect.height, 6);
    context.clip();
    const painted = drawImageCover(image, sceneRect, focusPoints[levelIndex]);
    if (!painted) {
      const fallback = context.createLinearGradient(sceneRect.x, sceneRect.y, sceneRect.x + sceneRect.width, sceneRect.y + sceneRect.height);
      fallback.addColorStop(0, hexToRgba(level.palette[0], 0.72));
      fallback.addColorStop(0.5, "#171116");
      fallback.addColorStop(1, hexToRgba(level.palette[2], 0.58));
      context.fillStyle = fallback;
      context.fillRect(sceneRect.x, sceneRect.y, sceneRect.width, sceneRect.height);
    }
    const remaining = 1 - destroyedBricks / Math.max(1, totalBricks);
    context.fillStyle = `rgba(7, 6, 9, ${0.2 + remaining * 0.36})`;
    context.fillRect(sceneRect.x, sceneRect.y, sceneRect.width, sceneRect.height);
    const light = context.createLinearGradient(sceneRect.x, 0, sceneRect.x + sceneRect.width, 0);
    light.addColorStop(0, "rgba(229, 100, 131, 0.15)");
    light.addColorStop(0.5, "rgba(255, 241, 221, 0.02)");
    light.addColorStop(1, "rgba(121, 199, 196, 0.14)");
    context.fillStyle = light;
    context.fillRect(sceneRect.x, sceneRect.y, sceneRect.width, sceneRect.height);
    context.restore();
    context.strokeStyle = "rgba(255, 241, 221, 0.16)";
    context.lineWidth = 0.8;
    roundRectPath(context, sceneRect.x, sceneRect.y, sceneRect.width, sceneRect.height, 6);
    context.stroke();
  }

  function drawGiftMark(brick) {
    if (!brick.gift) return;
    const centerX = brick.x + brick.width / 2;
    const centerY = brick.y + brick.height / 2;
    context.save();
    context.strokeStyle = "rgba(255, 249, 231, 0.82)";
    context.fillStyle = "rgba(255, 249, 231, 0.7)";
    context.lineWidth = 1;
    if (brick.gift === "embrace") {
      context.beginPath();
      context.arc(centerX - 2.4, centerY, 2.7, -0.9, 0.9);
      context.arc(centerX + 2.4, centerY, 2.7, Math.PI - 0.9, Math.PI + 0.9);
      context.stroke();
    } else if (brick.gift === "echo") {
      [-3, 0, 3].forEach((offset, index) => {
        context.globalAlpha = 0.5 + index * 0.2;
        context.beginPath();
        context.arc(centerX + offset, centerY, 1, 0, Math.PI * 2);
        context.fill();
      });
    } else {
      context.translate(centerX, centerY);
      context.rotate(Math.PI / 4);
      context.strokeRect(-3, -3, 6, 6);
    }
    context.restore();
  }

  function drawBrick(brick) {
    if (!brick.alive) return;
    const color = brickColor(brick);
    const damageRatio = brick.hp / brick.maxHp;
    const pulse = brick.hitPulse;
    context.save();
    if (pulse > 0) {
      context.shadowColor = color;
      context.shadowBlur = 12 * pulse;
    }
    roundRectPath(context, brick.x, brick.y, brick.width, brick.height, 3);
    const gradient = context.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
    gradient.addColorStop(0, hexToRgba(color, 0.96));
    gradient.addColorStop(0.48, hexToRgba(color, 0.72 + damageRatio * 0.16));
    gradient.addColorStop(1, "rgba(20, 12, 17, 0.94)");
    context.fillStyle = gradient;
    context.fill();
    context.strokeStyle = `rgba(255, 244, 222, ${0.18 + damageRatio * 0.28})`;
    context.lineWidth = brick.maxHp >= 3 ? 1.5 : 0.8;
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = "rgba(255, 255, 255, 0.14)";
    roundRectPath(context, brick.x + 2, brick.y + 2, brick.width - 4, 2.2, 1);
    context.fill();

    if (brick.maxHp >= 2) {
      context.strokeStyle = brick.hp < brick.maxHp ? "rgba(8, 6, 9, 0.68)" : "rgba(255, 241, 221, 0.24)";
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(brick.x + brick.width * 0.36, brick.y + 2);
      context.lineTo(brick.x + brick.width * 0.48, brick.y + brick.height - 2);
      context.stroke();
    }
    if (brick.maxHp >= 3) {
      context.beginPath();
      context.arc(brick.x + brick.width * 0.72, brick.y + brick.height * 0.5, 3, 0, Math.PI * 2);
      context.fillStyle = "rgba(76, 23, 39, 0.82)";
      context.fill();
      context.strokeStyle = "rgba(244, 198, 111, 0.62)";
      context.stroke();
    }
    drawGiftMark(brick);
    context.restore();
  }

  function drawPaddle() {
    const x = paddle.x - paddle.width / 2;
    const courage = gameClock < powerState.courageUntil;
    context.save();
    context.shadowColor = courage ? "#f4c66f" : "#e56483";
    context.shadowBlur = courage ? 18 : 11;
    roundRectPath(context, x, paddle.y, paddle.width, paddle.height, 6);
    const gradient = context.createLinearGradient(x, paddle.y, x + paddle.width, paddle.y);
    gradient.addColorStop(0, "#7ac8c4");
    gradient.addColorStop(0.37, "#fff0d6");
    gradient.addColorStop(0.52, "#f1bd67");
    gradient.addColorStop(1, "#e56483");
    context.fillStyle = gradient;
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = "rgba(255, 255, 255, 0.54)";
    context.lineWidth = 0.9;
    context.stroke();
    context.fillStyle = "rgba(38, 17, 25, 0.84)";
    context.beginPath();
    context.arc(paddle.x, paddle.y + paddle.height / 2, 3.4, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(244, 198, 111, 0.86)";
    context.stroke();
    context.restore();
  }

  function drawBallTrail(ball, courage) {
    if (ball.trail.length < 2) return;
    context.save();
    context.lineCap = "round";
    for (let index = ball.trail.length - 1; index > 0; index -= 1) {
      const from = ball.trail[index];
      const to = ball.trail[index - 1];
      const alpha = (1 - index / ball.trail.length) * 0.42;
      context.strokeStyle = courage ? `rgba(244, 198, 111, ${alpha})` : `rgba(121, 199, 196, ${alpha})`;
      context.lineWidth = Math.max(0.5, ball.radius * (1 - index / ball.trail.length) * 0.72);
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
    }
    context.restore();
  }

  function drawBall(ball) {
    const courage = gameClock < powerState.courageUntil;
    drawBallTrail(ball, courage);
    context.save();
    context.shadowColor = courage ? "#f4c66f" : "#79c7c4";
    context.shadowBlur = courage ? 22 : 16;
    const glow = context.createRadialGradient(
      ball.x - 2,
      ball.y - 2,
      1,
      ball.x,
      ball.y,
      ball.radius
    );
    glow.addColorStop(0, "#fff9e9");
    glow.addColorStop(0.42, courage ? "#f4c66f" : "#9ce2dd");
    glow.addColorStop(1, courage ? "#b95b39" : "#c54b71");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = "rgba(53, 21, 32, 0.72)";
    context.lineWidth = 0.7;
    context.beginPath();
    context.moveTo(ball.x - 3, ball.y - 1.8);
    context.lineTo(ball.x, ball.y + 0.6);
    context.lineTo(ball.x + 3, ball.y - 1.8);
    context.stroke();
    context.restore();
  }

  function drawDrop(drop, now) {
    const power = rules.POWER_UPS[drop.type];
    const pulse = 1 + Math.sin(now * 0.008 + drop.x) * 0.08;
    context.save();
    context.translate(drop.x, drop.y);
    context.rotate(drop.rotation);
    context.scale(pulse, pulse);
    context.shadowColor = power.color;
    context.shadowBlur = 16;
    context.fillStyle = hexToRgba(power.color, 0.82);
    context.strokeStyle = "rgba(255, 249, 232, 0.86)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, -drop.size);
    context.lineTo(drop.size, 0);
    context.lineTo(0, drop.size);
    context.lineTo(-drop.size, 0);
    context.closePath();
    context.fill();
    context.stroke();
    context.rotate(-drop.rotation);
    context.fillStyle = "rgba(21, 12, 17, 0.78)";
    context.beginPath();
    context.arc(0, 0, 2.2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawParticlesAndFloaters() {
    particles.forEach((particle) => {
      context.save();
      context.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillStyle = particle.color;
      context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.62);
      context.restore();
    });
    floaters.forEach((floater) => {
      context.save();
      context.globalAlpha = clamp(floater.life / floater.maxLife, 0, 1);
      context.fillStyle = floater.color;
      context.font = "700 9px SFMono-Regular, Consolas, monospace";
      context.textAlign = "center";
      context.shadowColor = "#000";
      context.shadowBlur = 5;
      context.fillText(floater.text, floater.x, floater.y);
      context.restore();
    });
  }

  function drawLightEffects() {
    context.save();
    context.globalCompositeOperation = "lighter";
    lightWaves.forEach((wave) => {
      context.globalAlpha = clamp(wave.life, 0, 1) * 0.72;
      context.strokeStyle = wave.color;
      context.lineWidth = 1.2 + wave.life * 2;
      context.beginPath();
      context.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      context.stroke();
    });
    if (lightSweep > 0) {
      const progress = 1 - lightSweep;
      const sweepX = -90 + progress * (WORLD_WIDTH + 180);
      const gradient = context.createLinearGradient(sweepX - 70, 0, sweepX + 70, 0);
      gradient.addColorStop(0, "rgba(121, 199, 196, 0)");
      gradient.addColorStop(0.5, `rgba(255, 241, 221, ${lightSweep * 0.28})`);
      gradient.addColorStop(1, "rgba(229, 100, 131, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, WORLD_WIDTH, worldHeight);
    }
    context.restore();
  }

  function drawVignette() {
    const vignette = context.createRadialGradient(
      WORLD_WIDTH / 2,
      worldHeight * 0.46,
      worldHeight * 0.12,
      WORLD_WIDTH / 2,
      worldHeight * 0.48,
      worldHeight * 0.72
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.54)");
    context.fillStyle = vignette;
    context.fillRect(0, 0, WORLD_WIDTH, worldHeight);
    if (screenFlash > 0) {
      context.fillStyle = `rgba(255, 237, 201, ${screenFlash * 0.34})`;
      context.fillRect(0, 0, WORLD_WIDTH, worldHeight);
    }
  }

  function render(now) {
    if (!canvas.width || !canvas.height) return;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = "#09080b";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
    context.save();
    if (screenShake > 0 && !reducedMotion) {
      context.translate((rng() - 0.5) * screenShake, (rng() - 0.5) * screenShake);
    }
    drawBackground(now);
    drawSceneReveal();
    bricks.forEach(drawBrick);
    drops.forEach((drop) => drawDrop(drop, now));
    drawPaddle();
    balls.forEach(drawBall);
    drawParticlesAndFloaters();
    drawLightEffects();
    drawVignette();
    context.restore();
  }

  function frame(now) {
    frameHandle = 0;
    if (gameDestroyed || suspendedForCache) return;
    const delta = Math.min(MAX_FRAME_DELTA, Math.max(0, (now - lastFrameAt) / 1000));
    lastFrameAt = now;
    updateVisuals(delta);
    if (mode === "playing") {
      accumulator = Math.min(MAX_BACKLOG, accumulator + delta);
      let steps = 0;
      while (accumulator >= FIXED_STEP && steps < MAX_CATCHUP_STEPS) {
        updateGame(FIXED_STEP);
        accumulator -= FIXED_STEP;
        steps += 1;
        if (mode !== "playing") {
          accumulator = 0;
          break;
        }
      }
    } else {
      accumulator = 0;
    }
    render(now);
    frameHandle = requestAnimationFrame(frame);
  }

  function destroyGame() {
    if (gameDestroyed) return;
    gameDestroyed = true;
    if (frameHandle) cancelAnimationFrame(frameHandle);
    frameHandle = 0;
    managedTimers.forEach((timer) => window.clearTimeout(timer));
    managedTimers.clear();
    resizeObserver?.disconnect();
    if (!resizeObserver) window.removeEventListener("resize", resizeCanvas);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", releasePointer);
    canvas.removeEventListener("pointercancel", releasePointer);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    reducedMotionQuery?.removeEventListener?.("change", onMotionPreferenceChange);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
    audio.destroy();
  }

  preloadScenes();
  bestNode.textContent = formatScore(best);
  soundButton.classList.toggle("is-muted", !audio.enabled);
  soundButton.setAttribute("aria-pressed", String(audio.enabled));
  soundButton.setAttribute("aria-label", audio.enabled ? "关闭声音" : "开启声音");

  canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
  canvas.addEventListener("pointermove", onPointerMove, { passive: false });
  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("visibilitychange", onVisibilityChange);
  reducedMotionQuery?.addEventListener?.("change", onMotionPreferenceChange);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);

  soundButton.addEventListener("click", () => {
    audio.setEnabled(!audio.enabled);
    soundButton.classList.toggle("is-muted", !audio.enabled);
    soundButton.setAttribute("aria-pressed", String(audio.enabled));
    soundButton.setAttribute("aria-label", audio.enabled ? "关闭声音" : "开启声音");
  });
  pauseButton.addEventListener("click", () => {
    audio.unlock();
    if (mode === "paused") resumeGame();
    else pauseGame();
  });
  required("#bl-resume").addEventListener("click", resumeGame);
  required("#bl-restart").addEventListener("click", resetGame);
  required("#bl-restart-pause").addEventListener("click", resetGame);
  required("#bl-restart-result").addEventListener("click", resetGame);

  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(resizeCanvas)
    : null;
  if (resizeObserver) resizeObserver.observe(stage);
  else window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
  resetGame();
  root.dataset.ready = "true";
  frameHandle = requestAnimationFrame(frame);
})();
