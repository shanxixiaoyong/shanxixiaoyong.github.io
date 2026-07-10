(function () {
  "use strict";

  const rules = window.TetrisLoveRules;
  const root = document.querySelector("#tetris-love-game");
  if (!rules || !root) return;

  const COLORS = Object.freeze({
    I: "#5ad7d8",
    J: "#7897ff",
    L: "#f2a65a",
    O: "#f2c14e",
    S: "#69c58f",
    T: "#e77ab2",
    Z: "#f27570"
  });

  const MOMENTS = Object.freeze([
    Object.freeze({ page: "07:42", text: "你把伞往她那边倾了一格" }),
    Object.freeze({ page: "12:08", text: "两份午餐，在同一张桌上拆开" }),
    Object.freeze({ page: "18:30", text: "忙完各自的今天，刚好一起回家" }),
    Object.freeze({ page: "22:16", text: "晚安之后，又多聊了三分钟" }),
    Object.freeze({ page: "周六", text: "空出来的下午，被写成了见面" }),
    Object.freeze({ page: "站台 2", text: "两班车之间，你们没有错过" }),
    Object.freeze({ page: "未读 1", text: "那句想念，终于落在合适的位置" }),
    Object.freeze({ page: "19:05", text: "她留了灯，你带回一小束花" }),
    Object.freeze({ page: "雨停", text: "绕远的一段路，也变成了同行" }),
    Object.freeze({ page: "第 10 页", text: "普通的一天，因为彼此有了刻度" }),
    Object.freeze({ page: "清晨", text: "醒来的第一条消息，来自同一个人" }),
    Object.freeze({ page: "将来", text: "越来越多的明天，开始写下我们" })
  ]);

  const MILESTONES = Object.freeze({
    firstLine: Object.freeze({
      scene: "morning",
      kicker: "第一次同一行",
      title: "今天，有了共同刻度",
      copy: "两份忙碌，在傍晚空出了同一个位置。"
    }),
    firstRhythm: Object.freeze({
      scene: "messages",
      kicker: "同频发生",
      title: "一句接住下一句",
      copy: "连续的回应没有中断，像两颗光点互相确认。"
    }),
    keptPromise: Object.freeze({
      scene: "rain",
      kicker: "迟到的回信",
      title: "那一格，终于等到你",
      copy: "错开的时间没有消失，它被后来的一次抵达认真补上。"
    }),
    fourLineLetter: Object.freeze({
      scene: "starlight",
      kicker: "四行长信",
      title: "所有碎片同时抵达",
      copy: "四段生活在这一刻严丝合缝，夜空也有了回声。"
    }),
    heldTogether: Object.freeze({
      scene: "city",
      kicker: "连续相守",
      title: "难的时候，也彼此接住",
      copy: "一次高难相遇之后，下一次仍没有松开。"
    }),
    emptyPage: Object.freeze({
      scene: "home",
      kicker: "完整留白",
      title: "房间又亮了起来",
      copy: "所有凌乱都被安放，新的这一页可以从容开始。"
    }),
    futureChapter: Object.freeze({
      scene: "home",
      kicker: "第五章",
      title: "未来也排得下我们",
      copy: "快一点的日子里，你们依然给彼此留下位置。"
    })
  });

  const BEST_KEY = "heartbeat-tetris-love-best-v1";
  const MILESTONE_KEY = "heartbeat-tetris-love-milestones-v1";
  const COACH_KEY = "heartbeat-tetris-love-coach-v1";
  const SOUND_KEY = "heartbeat-tetris-love-sound-v1";
  const LOCK_DELAY = 500;
  const MAX_LOCK_RESETS = 15;
  const CLEAR_FX_DURATION = 360;

  const elements = Object.freeze({
    board: document.querySelector("#tl-board"),
    boardShell: document.querySelector("#tl-board-shell"),
    fx: document.querySelector("#tl-fx"),
    score: document.querySelector("#tl-score"),
    level: document.querySelector("#tl-level"),
    lines: document.querySelector("#tl-lines"),
    best: document.querySelector("#tl-best"),
    moment: document.querySelector("#tl-moment"),
    memory: document.querySelector(".tl-memory"),
    memoryPage: document.querySelector("#tl-memory-page"),
    reward: document.querySelector("#tl-reward"),
    status: document.querySelector("#tl-status"),
    rhythmLabel: document.querySelector("#tl-rhythm-label"),
    rhythmFill: document.querySelector("#tl-rhythm-fill"),
    promiseMark: document.querySelector("#tl-promise-mark"),
    hold: document.querySelector("#tl-hold"),
    holdState: document.querySelector("#tl-hold-state"),
    holdCanvas: document.querySelector("#tl-hold-canvas"),
    nextCanvas: document.querySelector("#tl-next-canvas"),
    coach: document.querySelector("#tl-coach"),
    toast: document.querySelector("#tl-toast"),
    streak: document.querySelector("#tl-streak"),
    sound: document.querySelector("#tl-sound"),
    pause: document.querySelector("#tl-pause"),
    pauseSheet: document.querySelector("#tl-pause-sheet"),
    resume: document.querySelector("#tl-resume"),
    restartPause: document.querySelector("#tl-restart-pause"),
    result: document.querySelector("#tl-result"),
    resultScore: document.querySelector("#tl-result-score"),
    resultLines: document.querySelector("#tl-result-lines"),
    resultBest: document.querySelector("#tl-result-best"),
    resultCopy: document.querySelector("#tl-result-copy"),
    restartResult: document.querySelector("#tl-restart-result"),
    milestone: document.querySelector("#tl-milestone"),
    milestoneKicker: document.querySelector("#tl-milestone-kicker"),
    milestoneTitle: document.querySelector("#tl-milestone-title"),
    milestoneCopy: document.querySelector("#tl-milestone-copy"),
    milestoneSkip: document.querySelector("#tl-milestone-skip")
  });

  if (Object.values(elements).some((element) => !element)) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const abortController = new AbortController();
  const listenerOptions = { signal: abortController.signal };
  const timers = new Set();
  const contexts = {
    board: elements.board.getContext("2d", { alpha: false }),
    hold: elements.holdCanvas.getContext("2d", { alpha: true }),
    next: elements.nextCanvas.getContext("2d", { alpha: true })
  };

  if (!contexts.board || !contexts.hold || !contexts.next) return;

  function readStorage(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // Storage may be disabled in private contexts; gameplay remains in memory.
    }
  }

  function schedule(callback, delay) {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
    return timer;
  }

  function cancelSchedule(timer) {
    if (!timer) return;
    window.clearTimeout(timer);
    timers.delete(timer);
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString("zh-CN");
  }

  function randomSeed() {
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      const seed = new Uint32Array(1);
      window.crypto.getRandomValues(seed);
      return seed[0];
    }
    return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  }

  function createHeartbeatSoundscape() {
    const external = window.HeartbeatAudio;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    let context = null;
    let master = null;
    let music = null;
    let enabled = readStorage(SOUND_KEY, "on") !== "off";
    let active = true;
    let destroyed = false;
    let musicTimer = 0;
    let musicStep = 0;
    let intensity = 0;

    function externalCall(method, ...args) {
      if (!external || typeof external[method] !== "function") return false;
      try {
        external[method](...args);
        return true;
      } catch {
        return false;
      }
    }

    function ensureContext() {
      if (destroyed || !enabled || !AudioCtor) return null;
      if (!context) {
        context = new AudioCtor();
        master = context.createGain();
        music = context.createGain();
        master.gain.value = 0.22;
        music.gain.value = 0.34;
        music.connect(master);
        master.connect(context.destination);
      }
      if (context.state === "suspended") context.resume().catch(() => {});
      return context;
    }

    function synth(frequency, duration, volume, type = "sine", pan = 0, destination = master) {
      const audioContext = ensureContext();
      if (!audioContext || !destination) return;
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const panner = typeof audioContext.createStereoPanner === "function"
        ? audioContext.createStereoPanner()
        : null;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      if (panner) {
        panner.pan.value = pan;
        gain.connect(panner);
        panner.connect(destination);
      } else {
        gain.connect(destination);
      }
      oscillator.start(now);
      oscillator.stop(now + duration + 0.03);
    }

    function scheduleMusic() {
      window.clearTimeout(musicTimer);
      if (destroyed || !enabled || !active || document.hidden) return;
      const audioContext = ensureContext();
      if (!audioContext) return;
      const scale = [0, 7, 4, 11, 2, 9, 4, 12];
      const semitone = scale[musicStep % scale.length] + (intensity > 0.72 && musicStep % 4 === 3 ? 12 : 0);
      const frequency = 196 * Math.pow(2, semitone / 12);
      const side = musicStep % 2 === 0 ? -0.28 : 0.28;
      synth(frequency, 0.24, 0.045 + intensity * 0.018, musicStep % 2 ? "sine" : "triangle", side, music);
      if (musicStep % 4 === 0) synth(frequency / 2, 0.48, 0.018, "sine", -side * 0.4, music);
      musicStep += 1;
      const delay = Math.round(610 - intensity * 155);
      musicTimer = window.setTimeout(scheduleMusic, delay);
    }

    function unlock() {
      if (!enabled || destroyed) return;
      ensureContext();
      externalCall("resume");
      if (!musicTimer) scheduleMusic();
    }

    function setEnabled(next) {
      enabled = Boolean(next);
      writeStorage(SOUND_KEY, enabled ? "on" : "off");
      if (enabled) unlock();
      else {
        window.clearTimeout(musicTimer);
        musicTimer = 0;
        if (context && context.state === "running") context.suspend().catch(() => {});
        externalCall("suspend");
      }
      return enabled;
    }

    function setActive(next) {
      active = Boolean(next);
      if (active) unlock();
      else {
        window.clearTimeout(musicTimer);
        musicTimer = 0;
      }
    }

    function setIntensity(next) {
      intensity = Math.max(0, Math.min(1, Number(next) || 0));
      externalCall("setIntensity", intensity);
    }

    function sfx(name) {
      if (!enabled || destroyed) return;
      if (externalCall("playSfx", `heartbeat-blocks:${name}`)) return;
      if (name === "move") synth(220, 0.045, 0.018, "square", -0.18);
      else if (name === "rotate") {
        synth(330, 0.075, 0.025, "triangle", 0.12);
        schedule(() => synth(440, 0.07, 0.018, "triangle", 0.2), 32);
      } else if (name === "soft") synth(164, 0.035, 0.012, "sine", 0);
      else if (name === "hold") synth(262, 0.12, 0.03, "triangle", -0.22);
      else if (name === "drop") synth(98, 0.16, 0.05, "triangle", 0);
      else if (name === "line") {
        [392, 494, 587].forEach((frequency, index) => schedule(
          () => synth(frequency, 0.18, 0.032, "sine", index - 1),
          index * 42
        ));
      } else if (name === "promise") {
        [294, 440, 587, 880].forEach((frequency, index) => schedule(
          () => synth(frequency, 0.28, 0.038, "triangle", index % 2 ? 0.3 : -0.3),
          index * 58
        ));
      } else if (name === "four") {
        [196, 294, 392, 587].forEach((frequency, index) => schedule(
          () => synth(frequency, 0.42, 0.045, "sine", (index - 1.5) * 0.18),
          index * 70
        ));
      } else if (name === "over") {
        [262, 220, 165].forEach((frequency, index) => schedule(
          () => synth(frequency, 0.34, 0.035, "triangle", 0),
          index * 120
        ));
      }
    }

    function destroy() {
      destroyed = true;
      window.clearTimeout(musicTimer);
      musicTimer = 0;
      externalCall("release", "heartbeat-blocks");
      if (context) context.close().catch(() => {});
      context = null;
    }

    return Object.freeze({
      unlock,
      setEnabled,
      isEnabled: () => enabled,
      setActive,
      setIntensity,
      sfx,
      destroy
    });
  }

  function createHeartbeatEffects(canvas) {
    const context = canvas.getContext("2d", { alpha: true });
    let width = 1;
    let height = 1;
    let dpr = 1;
    let frame = 0;
    let lastTime = 0;
    let destroyed = false;
    let particles = [];

    function resize() {
      const bounds = root.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function scheduleFrame() {
      if (!frame && !destroyed && particles.length) frame = window.requestAnimationFrame(render);
    }

    function render(time) {
      frame = 0;
      const delta = Math.min(34, Math.max(8, time - (lastTime || time))) / 1000;
      lastTime = time;
      context.clearRect(0, 0, width, height);
      particles = particles.filter((particle) => {
        particle.age += delta * 1000;
        if (particle.age >= particle.life) return false;
        particle.vy += particle.gravity * delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.rotation += particle.spin * delta;
        const progress = particle.age / particle.life;
        const alpha = Math.min(1, progress * 6) * Math.min(1, (1 - progress) * 4);
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.globalAlpha = particle.alpha * alpha;
        context.fillStyle = particle.color;
        if (particle.kind === "line") {
          context.fillRect(-particle.size * 1.8, -0.5, particle.size * 3.6, 1);
        } else if (particle.kind === "tick") {
          context.fillRect(-1, -particle.size, 2, particle.size * 2);
        } else {
          context.fillRect(-particle.size * 0.65, -particle.size * 0.23, particle.size * 1.3, particle.size * 0.46);
        }
        context.restore();
        return true;
      });
      if (particles.length) scheduleFrame();
    }

    function burst(config = {}) {
      const bounds = root.getBoundingClientRect();
      const x = Number.isFinite(config.x) ? config.x : bounds.width / 2;
      const y = Number.isFinite(config.y) ? config.y : bounds.height / 2;
      const count = reducedMotion.matches ? 5 : Math.min(34, config.count || 18);
      const palette = config.palette || [COLORS.I, COLORS.Z, COLORS.O, "#fff8e9"];
      for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 32 + Math.random() * (config.force || 130);
        particles.push({
          kind: config.kind || (index % 4 === 0 ? "tick" : "slip"),
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 18,
          gravity: config.gravity ?? 42,
          size: 3 + Math.random() * 7,
          spin: (Math.random() - 0.5) * 5,
          rotation: Math.random() * Math.PI,
          age: 0,
          life: 560 + Math.random() * 720,
          alpha: 0.55 + Math.random() * 0.4,
          color: palette[index % palette.length]
        });
      }
      if (particles.length > 90) particles = particles.slice(-90);
      scheduleFrame();
    }

    function line(row) {
      const rootBounds = root.getBoundingClientRect();
      const boardBounds = elements.board.getBoundingClientRect();
      const x = boardBounds.left - rootBounds.left + boardBounds.width / 2;
      const y = boardBounds.top - rootBounds.top
        + ((row - rules.HIDDEN_ROWS + 0.5) / rules.VISIBLE_ROWS) * boardBounds.height;
      burst({ x, y, count: 22, force: 168, gravity: 18, kind: "line" });
    }

    function clear() {
      particles = [];
      context.clearRect(0, 0, width, height);
    }

    function destroy() {
      destroyed = true;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      clear();
    }

    resize();
    return Object.freeze({ resize, burst, line, clear, destroy });
  }

  const audio = createHeartbeatSoundscape();
  const effects = createHeartbeatEffects(elements.fx);
  let boardMetrics = { width: 1, height: 2, dpr: 1 };
  let holdMetrics = { width: 1, height: 1, dpr: 1 };
  let nextMetrics = { width: 1, height: 1, dpr: 1 };
  let board = rules.createEmptyBoard();
  let queueState = rules.createQueue(randomSeed(), 5);
  let activePiece = null;
  let heldPiece = null;
  let holdAvailable = true;
  let scoreState = rules.createScoreState();
  let bestScore = Math.max(0, Number.parseInt(readStorage(BEST_KEY, "0"), 10) || 0);
  let nearMiss = null;
  let rhythm = 0;
  let memoryIndex = 0;
  let phase = "playing";
  let lastFrameTime = performance.now();
  let dropAccumulator = 0;
  let groundedAt = null;
  let lockResets = 0;
  let lastActionWasRotation = false;
  let softDropCells = 0;
  let hardDropCells = 0;
  let pendingSpawnAt = 0;
  let clearEffect = null;
  let frameId = 0;
  let destroyed = false;
  let toastTimer = 0;
  let memoryTimer = 0;
  let coachTimer = 0;
  let milestoneTimer = 0;
  let milestoneQueue = [];
  let currentMilestone = null;
  let gesture = null;
  let resizeObserver = null;
  let bfcacheSuspended = false;

  function loadSeenMilestones() {
    try {
      const parsed = JSON.parse(readStorage(MILESTONE_KEY, "[]"));
      if (!Array.isArray(parsed)) return new Set();
      return new Set(parsed.filter((value) => Object.hasOwn(MILESTONES, value)));
    } catch {
      return new Set();
    }
  }

  const seenMilestones = loadSeenMilestones();

  function saveSeenMilestones() {
    writeStorage(MILESTONE_KEY, JSON.stringify([...seenMilestones]));
  }

  function fitCanvas(canvas, context) {
    const bounds = canvas.getBoundingClientRect();
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width, height, dpr };
  }

  function resizeCanvases() {
    boardMetrics = fitCanvas(elements.board, contexts.board);
    holdMetrics = fitCanvas(elements.holdCanvas, contexts.hold);
    nextMetrics = fitCanvas(elements.nextCanvas, contexts.next);
    effects.resize();
    drawPreviews();
    drawBoard(performance.now());
  }

  function roundedRect(context, x, y, width, height, radius) {
    const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.lineTo(x + width - safeRadius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    context.lineTo(x + width, y + height - safeRadius);
    context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    context.lineTo(x + safeRadius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    context.lineTo(x, y + safeRadius);
    context.quadraticCurveTo(x, y, x + safeRadius, y);
    context.closePath();
  }

  function drawBlock(context, x, y, width, height, cell, options = {}) {
    const gap = Math.max(1, Math.min(width, height) * 0.06);
    const left = x + gap;
    const top = y + gap;
    const blockWidth = width - gap * 2;
    const blockHeight = height - gap * 2;
    const alpha = options.alpha ?? 1;
    context.save();
    context.globalAlpha = alpha;
    if (options.ghost) {
      context.setLineDash([Math.max(2, width * 0.13), Math.max(2, width * 0.1)]);
      context.lineWidth = Math.max(1, width * 0.055);
      context.strokeStyle = COLORS[cell.type];
      roundedRect(context, left, top, blockWidth, blockHeight, Math.max(1, width * 0.09));
      context.stroke();
      context.globalAlpha = alpha * 0.12;
      context.fillStyle = COLORS[cell.type];
      context.fill();
      context.restore();
      return;
    }

    roundedRect(context, left, top, blockWidth, blockHeight, Math.max(1, width * 0.08));
    context.fillStyle = COLORS[cell.type];
    context.fill();
    context.globalAlpha = alpha * 0.14;
    context.fillStyle = "#ffffff";
    context.fillRect(left + 1, top + 1, Math.max(1, blockWidth - 2), Math.max(1, blockHeight * 0.16));
    context.globalAlpha = alpha * 0.82;
    context.fillStyle = cell.voice === "you" ? "#eaffff" : "#fff0ec";
    const markerX = cell.voice === "you" ? left + blockWidth * 0.18 : left + blockWidth * 0.74;
    context.fillRect(markerX, top + blockHeight * 0.68, Math.max(1, blockWidth * 0.09), blockHeight * 0.18);
    context.globalAlpha = alpha * 0.28;
    context.fillStyle = "#151821";
    context.fillRect(left + blockWidth * 0.18, top + blockHeight * 0.47, blockWidth * 0.64, Math.max(1, blockHeight * 0.055));
    context.restore();
  }

  function drawBoard(time) {
    const context = contexts.board;
    const width = boardMetrics.width;
    const height = boardMetrics.height;
    const cellWidth = width / rules.COLS;
    const cellHeight = height / rules.VISIBLE_ROWS;
    context.save();
    context.setTransform(boardMetrics.dpr, 0, 0, boardMetrics.dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#0f1218";
    context.fillRect(0, 0, width, height);

    for (let row = 0; row < rules.VISIBLE_ROWS; row += 1) {
      if (row % 2 === 1) {
        context.fillStyle = "rgba(255,248,233,0.012)";
        context.fillRect(0, row * cellHeight, width, cellHeight);
      }
    }

    context.strokeStyle = "rgba(255,248,233,0.055)";
    context.lineWidth = 0.6;
    context.beginPath();
    for (let column = 1; column < rules.COLS; column += 1) {
      const x = Math.round(column * cellWidth) + 0.5;
      context.moveTo(x, 0);
      context.lineTo(x, height);
    }
    for (let row = 1; row < rules.VISIBLE_ROWS; row += 1) {
      const y = Math.round(row * cellHeight) + 0.5;
      context.moveTo(0, y);
      context.lineTo(width, y);
    }
    context.stroke();

    const center = width / 2;
    context.setLineDash([3, 6]);
    context.lineWidth = 0.8;
    context.strokeStyle = "rgba(90,215,216,0.18)";
    context.beginPath();
    context.moveTo(center - 1.5, 0);
    context.lineTo(center - 1.5, height);
    context.stroke();
    context.strokeStyle = "rgba(242,117,112,0.16)";
    context.beginPath();
    context.moveTo(center + 1.5, 0);
    context.lineTo(center + 1.5, height);
    context.stroke();
    context.setLineDash([]);

    if (nearMiss) {
      const visibleRow = nearMiss.row - rules.HIDDEN_ROWS;
      if (visibleRow >= 0) {
        const pulse = reducedMotion.matches ? 0.38 : 0.25 + Math.sin(time * 0.006) * 0.12;
        const x = nearMiss.gapX * cellWidth;
        const y = visibleRow * cellHeight;
        context.fillStyle = `rgba(242,193,78,${Math.max(0.08, pulse)})`;
        context.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
        context.strokeStyle = "rgba(255,230,154,0.88)";
        context.lineWidth = 1;
        context.strokeRect(x + 3, y + 3, cellWidth - 6, cellHeight - 6);
      }
    }

    board.forEach((row, internalY) => {
      const visibleY = internalY - rules.HIDDEN_ROWS;
      if (visibleY < 0) return;
      row.forEach((cell, x) => {
        if (cell) drawBlock(context, x * cellWidth, visibleY * cellHeight, cellWidth, cellHeight, cell);
      });
    });

    if (activePiece) {
      const distance = rules.hardDropDistance(board, activePiece);
      const ghost = { ...activePiece, y: activePiece.y + distance };
      rules.getCells(ghost).forEach(([x, y]) => {
        const visibleY = y - rules.HIDDEN_ROWS;
        if (visibleY >= 0) {
          drawBlock(context, x * cellWidth, visibleY * cellHeight, cellWidth, cellHeight, activePiece, {
            ghost: true,
            alpha: 0.58
          });
        }
      });
      rules.getCells(activePiece).forEach(([x, y]) => {
        const visibleY = y - rules.HIDDEN_ROWS;
        if (visibleY >= 0) {
          drawBlock(context, x * cellWidth, visibleY * cellHeight, cellWidth, cellHeight, activePiece, {
            alpha: 1
          });
        }
      });
    }

    if (clearEffect) {
      const progress = Math.min(1, Math.max(0, (time - clearEffect.startedAt) / CLEAR_FX_DURATION));
      const alpha = 1 - progress;
      clearEffect.rows.forEach((row) => {
        const visibleY = row - rules.HIDDEN_ROWS;
        if (visibleY < 0) return;
        clearEffect.snapshot[row].forEach((cell, x) => {
          if (cell) drawBlock(context, x * cellWidth, visibleY * cellHeight, cellWidth, cellHeight, cell, { alpha });
        });
        const spread = width * progress * 0.5;
        context.fillStyle = `rgba(255,248,233,${alpha * 0.86})`;
        context.fillRect(width / 2 - spread, (visibleY + 0.49) * cellHeight, spread * 2, Math.max(1, cellHeight * 0.06));
      });
      if (progress >= 1) clearEffect = null;
    }

    context.restore();
  }

  function pieceBounds(type) {
    const cells = rules.SHAPES[type][0];
    const xs = cells.map(([x]) => x);
    const ys = cells.map(([, y]) => y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  }

  function drawPreviewPiece(context, metrics, type, voice, top, slotHeight, scale = 1) {
    const bounds = pieceBounds(type);
    const columns = bounds.maxX - bounds.minX + 1;
    const rows = bounds.maxY - bounds.minY + 1;
    const cellSize = Math.max(4, Math.min(metrics.width / (columns + 1.2), slotHeight / (rows + 0.9)) * scale);
    const pieceWidth = columns * cellSize;
    const pieceHeight = rows * cellSize;
    const originX = (metrics.width - pieceWidth) / 2 - bounds.minX * cellSize;
    const originY = top + (slotHeight - pieceHeight) / 2 - bounds.minY * cellSize;
    rules.SHAPES[type][0].forEach(([x, y]) => {
      drawBlock(context, originX + x * cellSize, originY + y * cellSize, cellSize, cellSize, { type, voice }, { alpha: 0.94 });
    });
  }

  function drawPreviews() {
    contexts.hold.setTransform(holdMetrics.dpr, 0, 0, holdMetrics.dpr, 0, 0);
    contexts.hold.clearRect(0, 0, holdMetrics.width, holdMetrics.height);
    if (heldPiece) {
      drawPreviewPiece(contexts.hold, holdMetrics, heldPiece.type, heldPiece.voice, 0, holdMetrics.height, 0.9);
    } else {
      contexts.hold.save();
      contexts.hold.strokeStyle = "rgba(255,248,233,0.18)";
      contexts.hold.setLineDash([3, 4]);
      contexts.hold.strokeRect(holdMetrics.width * 0.28, holdMetrics.height * 0.32, holdMetrics.width * 0.44, holdMetrics.height * 0.36);
      contexts.hold.restore();
    }

    contexts.next.setTransform(nextMetrics.dpr, 0, 0, nextMetrics.dpr, 0, 0);
    contexts.next.clearRect(0, 0, nextMetrics.width, nextMetrics.height);
    const count = Math.min(5, queueState.queue.length);
    const slotHeight = nextMetrics.height / count;
    for (let index = 0; index < count; index += 1) {
      if (index > 0) {
        contexts.next.fillStyle = "rgba(255,248,233,0.07)";
        contexts.next.fillRect(nextMetrics.width * 0.18, index * slotHeight, nextMetrics.width * 0.64, 1);
      }
      const voice = rules.VOICES[(queueState.voiceIndex + index) % rules.VOICES.length];
      drawPreviewPiece(
        contexts.next,
        nextMetrics,
        rules.peekQueue(queueState, index),
        voice,
        index * slotHeight,
        slotHeight,
        index === 0 ? 0.92 : 0.78
      );
    }
  }

  function updateSoundButton() {
    const enabled = audio.isEnabled();
    elements.sound.textContent = enabled ? "♪" : "×";
    elements.sound.setAttribute("aria-label", enabled ? "关闭声音" : "开启声音");
    elements.sound.dataset.enabled = String(enabled);
  }

  function updateInterface() {
    elements.score.textContent = formatNumber(scoreState.score);
    elements.level.textContent = String(scoreState.level);
    elements.lines.textContent = String(scoreState.lines);
    elements.best.textContent = formatNumber(Math.max(bestScore, scoreState.score));
    elements.hold.disabled = !holdAvailable || phase !== "playing" || !activePiece;
    elements.holdState.textContent = holdAvailable ? "可暂存" : "下一块可用";
    elements.rhythmFill.style.setProperty("--tl-rhythm", `${Math.round(rhythm)}%`);
    elements.rhythmLabel.textContent = scoreState.combo > 0
      ? `同频 ${scoreState.combo + 1}`
      : scoreState.backToBack
        ? "相守"
        : "默契";
    if (nearMiss) {
      elements.promiseMark.classList.add("is-visible");
      elements.promiseMark.style.setProperty("--tl-promise-x", `${(nearMiss.gapX + 0.5) * 10}%`);
    } else {
      elements.promiseMark.classList.remove("is-visible");
    }
    root.style.setProperty("--tl-rhythm", `${Math.round(rhythm)}%`);
    root.style.setProperty("--tl-promise-x", nearMiss ? `${(nearMiss.gapX + 0.5) * 10}%` : "50%");
    root.style.setProperty("--tl-memory-progress", `${Math.min(1, scoreState.lines / 40)}`);
    drawPreviews();
  }

  function showToast(message, duration = 1300) {
    cancelSchedule(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = schedule(() => {
      elements.toast.classList.remove("is-visible");
      toastTimer = 0;
    }, duration);
  }

  function showStreak(message) {
    elements.streak.textContent = message;
    elements.streak.classList.remove("is-visible");
    void elements.streak.offsetWidth;
    elements.streak.classList.add("is-visible");
  }

  function revealMoment(points, detail) {
    const moment = MOMENTS[memoryIndex % MOMENTS.length];
    memoryIndex += 1;
    elements.memoryPage.textContent = moment.page;
    elements.moment.textContent = moment.text;
    elements.reward.textContent = `+${formatNumber(points)}${detail ? ` · ${detail}` : ""}`;
    elements.memory.classList.remove("is-revealing");
    void elements.memory.offsetWidth;
    elements.memory.classList.add("is-revealing");
    cancelSchedule(memoryTimer);
    memoryTimer = schedule(() => {
      elements.memory.classList.remove("is-revealing");
      elements.reward.textContent = "";
      memoryTimer = 0;
    }, 2500);
  }

  function stackHeight() {
    const first = board.findIndex((row, index) => index >= rules.HIDDEN_ROWS && row.some(Boolean));
    return first < 0 ? 0 : rules.BOARD_ROWS - first;
  }

  function updateAudioIntensity() {
    const danger = stackHeight() / rules.VISIBLE_ROWS;
    const pace = Math.min(1, (scoreState.level - 1) / 12);
    audio.setIntensity(Math.min(1, danger * 0.68 + pace * 0.32));
  }

  function takeQueuePiece() {
    const next = rules.takeNext(queueState);
    queueState = next.state;
    return next.piece;
  }

  function resetPieceTiming() {
    dropAccumulator = 0;
    groundedAt = null;
    lockResets = 0;
    lastActionWasRotation = false;
    softDropCells = 0;
    hardDropCells = 0;
  }

  function spawnPiece(specification = takeQueuePiece()) {
    activePiece = rules.createPiece(specification.type, specification.voice);
    resetPieceTiming();
    pendingSpawnAt = 0;
    holdAvailable = true;
    if (!rules.canPlace(board, activePiece)) {
      activePiece = null;
      finishGame();
      return false;
    }
    updateInterface();
    return true;
  }

  function playable() {
    return phase === "playing" && activePiece !== null && pendingSpawnAt === 0;
  }

  function noteManipulation() {
    if (!activePiece) return;
    if (rules.movePiece(board, activePiece, 0, 1) === null) {
      if (lockResets < MAX_LOCK_RESETS) {
        groundedAt = performance.now();
        lockResets += 1;
      }
    } else {
      groundedAt = null;
    }
  }

  function moveHorizontal(direction) {
    if (!playable()) return false;
    const moved = rules.movePiece(board, activePiece, direction, 0);
    if (!moved) return false;
    activePiece = moved;
    lastActionWasRotation = false;
    noteManipulation();
    audio.sfx("move");
    return true;
  }

  function rotate(direction = 1) {
    if (!playable()) return false;
    const result = rules.rotatePiece(board, activePiece, direction);
    if (!result) return false;
    activePiece = result.piece;
    lastActionWasRotation = true;
    noteManipulation();
    audio.sfx("rotate");
    return true;
  }

  function softDrop() {
    if (!playable()) return false;
    const moved = rules.movePiece(board, activePiece, 0, 1);
    if (!moved) {
      if (groundedAt === null) groundedAt = performance.now();
      return false;
    }
    activePiece = moved;
    softDropCells += 1;
    dropAccumulator = 0;
    groundedAt = null;
    lastActionWasRotation = false;
    audio.sfx("soft");
    return true;
  }

  function hardDrop() {
    if (!playable()) return false;
    const distance = rules.hardDropDistance(board, activePiece);
    if (distance > 0) activePiece = { ...activePiece, y: activePiece.y + distance };
    hardDropCells += distance;
    audio.sfx("drop");
    lockActivePiece(performance.now());
    return true;
  }

  function holdCurrent() {
    if (!playable() || !holdAvailable) return false;
    const current = Object.freeze({ type: activePiece.type, voice: activePiece.voice });
    const replacement = heldPiece || takeQueuePiece();
    heldPiece = current;
    activePiece = rules.createPiece(replacement.type, replacement.voice);
    holdAvailable = false;
    resetPieceTiming();
    if (!rules.canPlace(board, activePiece)) {
      activePiece = null;
      finishGame();
      return false;
    }
    audio.sfx("hold");
    elements.status.textContent = "这一段先留到合适的时候";
    updateInterface();
    return true;
  }

  function enqueueMilestone(id) {
    if (!Object.hasOwn(MILESTONES, id)) return;
    if (seenMilestones.has(id)) {
      effects.burst({ count: 10, force: 74 });
      if (id === "keptPromise") showToast("这一次，也没有错过");
      else if (id === "fourLineLetter") showToast("又一封四行长信");
      else if (id === "heldTogether") showToast("难的时候，仍然接住了");
      return;
    }
    if (!milestoneQueue.includes(id) && currentMilestone !== id) milestoneQueue.push(id);
    showNextMilestone();
  }

  function showNextMilestone() {
    if (currentMilestone || milestoneQueue.length === 0 || phase === "over" || destroyed) return;
    const id = milestoneQueue.shift();
    const milestone = MILESTONES[id];
    currentMilestone = id;
    seenMilestones.add(id);
    saveSeenMilestones();
    phase = "milestone";
    audio.setActive(false);
    elements.milestone.dataset.scene = milestone.scene;
    elements.milestoneKicker.textContent = milestone.kicker;
    elements.milestoneTitle.textContent = milestone.title;
    elements.milestoneCopy.textContent = milestone.copy;
    elements.milestone.hidden = false;
    cancelSchedule(milestoneTimer);
    milestoneTimer = schedule(closeMilestone, reducedMotion.matches ? 1100 : 3100);
  }

  function closeMilestone() {
    if (!currentMilestone) return;
    cancelSchedule(milestoneTimer);
    milestoneTimer = 0;
    elements.milestone.hidden = true;
    currentMilestone = null;
    if (milestoneQueue.length) {
      schedule(showNextMilestone, reducedMotion.matches ? 30 : 160);
      return;
    }
    if (phase === "milestone") phase = "playing";
    lastFrameTime = performance.now();
    audio.setActive(true);
    elements.board.focus({ preventScroll: true });
    updateInterface();
  }

  function relationshipEvents(result, lineCount, nearMissResolved, perfectClear, previousLevel) {
    if (lineCount > 0) enqueueMilestone("firstLine");
    if (result.state.combo > 0) enqueueMilestone("firstRhythm");
    if (nearMissResolved) enqueueMilestone("keptPromise");
    if (lineCount === 4) enqueueMilestone("fourLineLetter");
    if (result.backToBackContinued) enqueueMilestone("heldTogether");
    if (perfectClear) enqueueMilestone("emptyPage");
    if (previousLevel < 5 && result.state.level >= 5) enqueueMilestone("futureChapter");
  }

  function lockActivePiece(time) {
    if (!playable()) return;
    const piece = activePiece;
    const locked = rules.lockPiece(board, piece);
    const fullRows = rules.getFullRows(locked.board);
    const rowAnalysis = rules.analyzeRows(locked.board, fullRows);
    const tSpin = rules.detectTSpin(locked.board, piece, lastActionWasRotation);
    const previousNearMiss = nearMiss;
    const nearMissResolved = previousNearMiss
      ? rules.resolveNearMiss(previousNearMiss, locked.cells, fullRows)
      : false;
    const clearedBoard = rules.clearLines(locked.board, fullRows);
    const perfectClear = fullRows.length > 0 && rules.isPerfectClear(clearedBoard);
    const previousLevel = scoreState.level;
    const result = rules.scoreLock(scoreState, {
      lines: fullRows.length,
      tSpin,
      mutualLines: rowAnalysis.mutualLines,
      balancedLines: rowAnalysis.balancedLines,
      nearMissResolved,
      perfectClear,
      softDrop: softDropCells,
      hardDrop: hardDropCells
    });

    board = clearedBoard;
    scoreState = result.state;
    activePiece = null;
    holdAvailable = true;
    if (scoreState.score > bestScore) {
      bestScore = scoreState.score;
      writeStorage(BEST_KEY, bestScore);
    }

    if (previousNearMiss) {
      nearMiss = nearMissResolved
        ? null
        : rules.shiftNearMiss(previousNearMiss, fullRows, clearedBoard);
    } else {
      nearMiss = rules.findNearMiss(clearedBoard);
    }

    if (nearMissResolved) {
      rhythm = Math.min(100, rhythm + 30);
      elements.status.textContent = "晚到的一格，刚好补上了约定";
      audio.sfx("promise");
      showStreak(`赴约 +${formatNumber(result.promiseBonus)}`);
    } else if (fullRows.length > 0) {
      rhythm = Math.min(100, rhythm + rowAnalysis.mutualLines * 18 + rowAnalysis.balancedLines * 8 + Math.max(0, scoreState.combo) * 7);
      elements.status.textContent = rowAnalysis.mutualLines > 0
        ? `${rowAnalysis.mutualLines} 行里，两种生活都在场`
        : "这一行，先替彼此收好";
    } else {
      rhythm = Math.max(0, rhythm - 7);
      elements.status.textContent = nearMiss
        ? `还剩 ${nearMiss.remaining} 次，把那一格留给后来`
        : "这一段，也会找到自己的位置";
    }

    if (!previousNearMiss && nearMiss) {
      showToast(`第 ${nearMiss.row - rules.HIDDEN_ROWS + 1} 行留着一格 · ${nearMiss.remaining} 次内`);
    }

    if (fullRows.length > 0) {
      clearEffect = {
        rows: fullRows,
        snapshot: locked.board,
        startedAt: time
      };
      fullRows.forEach((row) => effects.line(row));
      audio.sfx(fullRows.length === 4 ? "four" : "line");
      const detail = result.backToBackContinued
        ? "连续接住"
        : scoreState.combo > 0
          ? `同频 ${scoreState.combo + 1}`
          : rowAnalysis.balancedLines > 0
            ? "刚好一半一半"
            : "共同完成";
      revealMoment(result.points, detail);
    }

    if (scoreState.combo > 0) showStreak(`连续 ${scoreState.combo + 1} 次没有断拍`);
    if (result.backToBackContinued) showStreak("两次高难相遇，彼此接住");
    relationshipEvents(result, fullRows.length, nearMissResolved, perfectClear, previousLevel);

    const hiddenOccupied = board.slice(0, rules.HIDDEN_ROWS).some((row) => row.some(Boolean));
    if (locked.topOut && hiddenOccupied) {
      finishGame();
      return;
    }

    pendingSpawnAt = fullRows.length > 0
      ? time + (reducedMotion.matches ? 90 : 230)
      : time;
    updateAudioIntensity();
    updateInterface();
    if (pendingSpawnAt <= time && phase === "playing") spawnPiece();
  }

  function pauseGame() {
    if (phase !== "playing") return false;
    phase = "paused";
    elements.pauseSheet.hidden = false;
    elements.pause.textContent = "▶";
    elements.pause.setAttribute("aria-label", "继续游戏");
    audio.setActive(false);
    gesture = null;
    updateInterface();
    return true;
  }

  function resumeGame() {
    if (phase !== "paused") return false;
    phase = "playing";
    elements.pauseSheet.hidden = true;
    elements.pause.textContent = "Ⅱ";
    elements.pause.setAttribute("aria-label", "暂停游戏");
    lastFrameTime = performance.now();
    audio.unlock();
    audio.setActive(true);
    elements.board.focus({ preventScroll: true });
    updateInterface();
    return true;
  }

  function togglePause() {
    if (phase === "paused") resumeGame();
    else pauseGame();
  }

  function finishGame() {
    if (phase === "over") return;
    phase = "over";
    activePiece = null;
    pendingSpawnAt = 0;
    milestoneQueue = [];
    currentMilestone = null;
    cancelSchedule(milestoneTimer);
    elements.milestone.hidden = true;
    elements.pauseSheet.hidden = true;
    elements.resultScore.textContent = formatNumber(scoreState.score);
    elements.resultLines.textContent = `${scoreState.lines} 行`;
    elements.resultBest.textContent = formatNumber(bestScore);
    elements.resultCopy.textContent = scoreState.lines >= 20
      ? "你们把很多忙乱，认真放进了同一个今天。"
      : scoreState.lines > 0
        ? "已经找到的共同位置，不会因为换页消失。"
        : "有些相遇，换一页仍会继续。";
    elements.result.hidden = false;
    elements.status.textContent = "这一页写满了";
    audio.sfx("over");
    audio.setActive(false);
    effects.burst({ count: 24, force: 86, gravity: 64 });
    updateInterface();
  }

  function restartGame() {
    milestoneQueue = [];
    currentMilestone = null;
    cancelSchedule(milestoneTimer);
    cancelSchedule(toastTimer);
    elements.milestone.hidden = true;
    elements.pauseSheet.hidden = true;
    elements.result.hidden = true;
    elements.toast.classList.remove("is-visible");
    board = rules.createEmptyBoard();
    queueState = rules.createQueue(randomSeed(), 5);
    activePiece = null;
    heldPiece = null;
    holdAvailable = true;
    scoreState = rules.createScoreState();
    nearMiss = null;
    rhythm = 0;
    memoryIndex = 0;
    phase = "playing";
    pendingSpawnAt = 0;
    clearEffect = null;
    elements.memoryPage.textContent = "序章";
    elements.moment.textContent = "两份日程，正在寻找同一行";
    elements.reward.textContent = "";
    elements.status.textContent = "把今天，慢慢放在一起";
    elements.pause.textContent = "Ⅱ";
    elements.pause.setAttribute("aria-label", "暂停游戏");
    effects.clear();
    lastFrameTime = performance.now();
    spawnPiece();
    audio.unlock();
    audio.setActive(true);
    updateAudioIntensity();
    updateInterface();
    elements.board.focus({ preventScroll: true });
  }

  function dismissCoach() {
    cancelSchedule(coachTimer);
    elements.coach.classList.remove("is-visible");
    writeStorage(COACH_KEY, "seen");
  }

  function showCoach() {
    if (readStorage(COACH_KEY, "") === "seen") return;
    coachTimer = schedule(() => {
      if (phase === "playing") elements.coach.classList.add("is-visible");
      coachTimer = schedule(() => elements.coach.classList.remove("is-visible"), 5200);
    }, 620);
  }

  function beginGesture(event) {
    if (phase !== "playing" || event.button > 0) return;
    event.preventDefault();
    audio.unlock();
    dismissCoach();
    elements.board.focus({ preventScroll: true });
    elements.board.setPointerCapture?.(event.pointerId);
    gesture = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastStepX: event.clientX,
      lastStepY: event.clientY,
      startedAt: event.timeStamp,
      axis: null,
      moved: false
    };
  }

  function continueGesture(event) {
    if (!gesture || event.pointerId !== gesture.id || phase !== "playing") return;
    event.preventDefault();
    const totalX = event.clientX - gesture.startX;
    const totalY = event.clientY - gesture.startY;
    if (!gesture.axis && Math.hypot(totalX, totalY) > 9) {
      gesture.axis = Math.abs(totalX) >= Math.abs(totalY) ? "horizontal" : "vertical";
    }
    if (!gesture.axis) return;
    gesture.moved = true;
    const bounds = elements.board.getBoundingClientRect();
    if (gesture.axis === "horizontal") {
      const threshold = Math.max(12, (bounds.width / rules.COLS) * 0.68);
      let delta = event.clientX - gesture.lastStepX;
      while (Math.abs(delta) >= threshold) {
        const direction = delta > 0 ? 1 : -1;
        moveHorizontal(direction);
        gesture.lastStepX += direction * threshold;
        delta = event.clientX - gesture.lastStepX;
      }
    } else if (event.clientY > gesture.lastStepY) {
      const threshold = Math.max(12, (bounds.height / rules.VISIBLE_ROWS) * 0.82);
      let delta = event.clientY - gesture.lastStepY;
      while (delta >= threshold) {
        softDrop();
        gesture.lastStepY += threshold;
        delta = event.clientY - gesture.lastStepY;
      }
    }
  }

  function endGesture(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    event.preventDefault();
    const completed = gesture;
    gesture = null;
    const totalX = event.clientX - completed.startX;
    const totalY = event.clientY - completed.startY;
    const duration = Math.max(1, event.timeStamp - completed.startedAt);
    const distance = Math.hypot(totalX, totalY);
    if (!completed.moved && distance < 12 && duration < 380) {
      rotate(1);
      return;
    }
    const cellHeight = elements.board.getBoundingClientRect().height / rules.VISIBLE_ROWS;
    const verticalVelocity = totalY / duration;
    if (completed.axis === "vertical"
      && totalY > cellHeight * 2
      && (verticalVelocity > 0.48 || (duration < 360 && totalY > cellHeight * 3))) {
      hardDrop();
    }
  }

  function cancelGesture(event) {
    if (gesture && event.pointerId === gesture.id) gesture = null;
  }

  function handleKey(event) {
    const code = event.code;
    const controlled = [
      "ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space",
      "KeyX", "KeyZ", "KeyC", "ShiftLeft", "ShiftRight", "KeyP", "Escape", "KeyR"
    ];
    if (!controlled.includes(code)) return;
    event.preventDefault();
    dismissCoach();
    audio.unlock();
    if (code === "KeyP" || code === "Escape") {
      togglePause();
      return;
    }
    if (code === "KeyR" && (phase === "paused" || phase === "over")) {
      restartGame();
      return;
    }
    if (phase === "over" && code === "Space") {
      restartGame();
      return;
    }
    if (!playable()) return;
    if (code === "ArrowLeft") moveHorizontal(-1);
    else if (code === "ArrowRight") moveHorizontal(1);
    else if (code === "ArrowDown") softDrop();
    else if (code === "ArrowUp" || code === "KeyX") rotate(1);
    else if (code === "KeyZ") rotate(-1);
    else if (code === "Space") hardDrop();
    else if (code === "KeyC" || code === "ShiftLeft" || code === "ShiftRight") holdCurrent();
  }

  function update(time) {
    const delta = Math.min(100, Math.max(0, time - lastFrameTime));
    lastFrameTime = time;
    if (phase !== "playing") return;

    if (pendingSpawnAt > 0 && time >= pendingSpawnAt) {
      spawnPiece();
      return;
    }
    if (!activePiece) return;

    dropAccumulator += delta;
    const interval = rules.gravityMs(scoreState.level);
    while (dropAccumulator >= interval && activePiece) {
      dropAccumulator -= interval;
      const moved = rules.movePiece(board, activePiece, 0, 1);
      if (moved) {
        activePiece = moved;
        if (rules.movePiece(board, activePiece, 0, 1) === null && groundedAt === null) groundedAt = time;
      } else {
        if (groundedAt === null) groundedAt = time;
        break;
      }
    }

    if (activePiece && rules.movePiece(board, activePiece, 0, 1) === null) {
      if (groundedAt === null) groundedAt = time;
      if (time - groundedAt >= LOCK_DELAY) lockActivePiece(time);
    } else {
      groundedAt = null;
    }
  }

  function frame(time) {
    if (destroyed || bfcacheSuspended) return;
    update(time);
    drawBoard(time);
    frameId = window.requestAnimationFrame(frame);
  }

  function suspendForCache() {
    bfcacheSuspended = true;
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
    if (phase === "playing") pauseGame();
    audio.setActive(false);
  }

  function resumeFromCache() {
    if (destroyed) return;
    bfcacheSuspended = false;
    lastFrameTime = performance.now();
    resizeCanvases();
    if (!frameId) frameId = window.requestAnimationFrame(frame);
  }

  function destroyHeartbeatGame() {
    if (destroyed) return;
    destroyed = true;
    abortController.abort();
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.clear();
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
    resizeObserver?.disconnect();
    effects.destroy();
    audio.destroy();
    gesture = null;
  }

  elements.board.addEventListener("pointerdown", beginGesture, listenerOptions);
  elements.board.addEventListener("pointermove", continueGesture, listenerOptions);
  elements.board.addEventListener("pointerup", endGesture, listenerOptions);
  elements.board.addEventListener("pointercancel", cancelGesture, listenerOptions);
  elements.board.addEventListener("contextmenu", (event) => event.preventDefault(), listenerOptions);
  elements.hold.addEventListener("click", () => {
    audio.unlock();
    dismissCoach();
    holdCurrent();
  }, listenerOptions);
  elements.pause.addEventListener("click", () => {
    audio.unlock();
    togglePause();
  }, listenerOptions);
  elements.sound.addEventListener("click", () => {
    audio.setEnabled(!audio.isEnabled());
    updateSoundButton();
  }, listenerOptions);
  elements.resume.addEventListener("click", resumeGame, listenerOptions);
  elements.restartPause.addEventListener("click", restartGame, listenerOptions);
  elements.restartResult.addEventListener("click", restartGame, listenerOptions);
  elements.milestoneSkip.addEventListener("click", closeMilestone, listenerOptions);
  document.addEventListener("keydown", handleKey, listenerOptions);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && phase === "playing") pauseGame();
  }, listenerOptions);
  window.addEventListener("pagehide", (event) => {
    if (event.persisted) suspendForCache();
    else destroyHeartbeatGame();
  }, listenerOptions);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) resumeFromCache();
  }, listenerOptions);

  if (typeof ResizeObserver === "function") {
    resizeObserver = new ResizeObserver(resizeCanvases);
    resizeObserver.observe(root);
    resizeObserver.observe(elements.boardShell);
  } else {
    window.addEventListener("resize", resizeCanvases, listenerOptions);
  }

  window.HeartbeatTetrisLove = Object.freeze({
    pause: pauseGame,
    resume: resumeGame,
    restart: restartGame,
    destroy: destroyHeartbeatGame,
    getState: () => Object.freeze({
      phase,
      score: scoreState.score,
      lines: scoreState.lines,
      level: scoreState.level,
      combo: scoreState.combo,
      backToBack: scoreState.backToBack,
      nearMiss: nearMiss ? Object.freeze({ ...nearMiss }) : null,
      active: activePiece ? Object.freeze({ ...activePiece }) : null,
      held: heldPiece ? Object.freeze({ ...heldPiece }) : null
    })
  });

  updateSoundButton();
  resizeCanvases();
  spawnPiece();
  updateInterface();
  showCoach();
  frameId = window.requestAnimationFrame(frame);
})();
