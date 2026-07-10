(() => {
  "use strict";

  const root = document.querySelector("#watermelon-game");
  if (!root) return;
  const MatterApi = window.Matter;
  const rules = window.WatermelonRules;
  if (!MatterApi || !rules) throw new Error("Matter.js and WatermelonRules are required");

  const { Engine, Events, Bodies, Body, Composite, Sleeping } = MatterApi;
  const canvas = document.querySelector("#wm-canvas");
  const stage = document.querySelector("#wm-stage");
  const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
  const scoreNode = document.querySelector("#wm-score");
  const bestNode = document.querySelector("#wm-best");
  const statusNode = document.querySelector("#wm-status");
  const currentNameNode = document.querySelector("#wm-current-name");
  const currentPreview = document.querySelector("#wm-current-fruit");
  const nextOnePreview = document.querySelector("#wm-next-one");
  const nextTwoPreview = document.querySelector("#wm-next-two");
  const heartNodes = [...document.querySelectorAll("#wm-hearts i")];
  const affinityCopy = document.querySelector("#wm-affinity-copy");
  const toastNode = document.querySelector("#wm-toast");
  const comboNode = document.querySelector("#wm-combo");
  const coachNode = document.querySelector("#wm-coach");
  const pauseSheet = document.querySelector("#wm-pause-sheet");
  const resultSheet = document.querySelector("#wm-result");
  const resultScore = document.querySelector("#wm-result-score");
  const resultCopy = document.querySelector("#wm-result-copy");
  const reviveButton = document.querySelector("#wm-revive");
  const cinematic = document.querySelector("#wm-cinematic");
  const cinematicKicker = document.querySelector("#wm-cinematic-kicker");
  const cinematicTitle = document.querySelector("#wm-cinematic-title");
  const cinematicLine = document.querySelector("#wm-cinematic-line");
  const pauseButton = document.querySelector("#wm-pause");
  const soundButton = document.querySelector("#wm-sound");

  const WORLD_WIDTH = 365;
  const DROP_Y = 54;
  const DANGER_Y = 116;
  const STEP = 1000 / 60;
  const PRECISION_WINDOW = 800;
  const DANGER_HOLD = 1600;
  const CONTACT_SETTLE = 300;
  const MAX_FRAME_DELTA = 250;
  const MAX_CATCHUP_STEPS = 8;
  const MAX_BACKLOG = STEP * 15;
  const BEST_KEY = "yl-watermelon-best";
  const HARVEST_KEY = "yl-watermelon-harvests";
  const COACH_KEY = "yl-watermelon-coach-seen";
  const marks = ["rose", "gold"];
  const fruitPalette = [
    ["#728cd7", "#313770", "#c7d3ff"],
    ["#e85470", "#821d3c", "#ffb0bd"],
    ["#ee526d", "#98243d", "#ffd0d4"],
    ["#9362b8", "#4e286e", "#d9b3ef"],
    ["#ee9a3c", "#a64c1e", "#ffd28b"],
    ["#df5361", "#8d2636", "#ffabb0"],
    ["#b9cb62", "#66782f", "#edf5a8"],
    ["#ef8580", "#a94858", "#ffd0bc"],
    ["#d8b84e", "#827127", "#f6e281"],
    ["#b7c66d", "#65783d", "#eff5b9"],
    ["#58a35c", "#1d5937", "#a4da7f"]
  ];

  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = 0.92;
  engine.gravity.scale = 0.001;
  engine.positionIterations = 8;
  engine.velocityIterations = 6;
  engine.constraintIterations = 3;

  let worldHeight = 660;
  let canvasScale = 1;
  let dpr = 1;
  let walls = [];
  let fruits = [];
  let queueState = null;
  let scoreState = rules.createScoreState();
  let currentTier = 0;
  let currentMark = "rose";
  let markRandom = rules.createRng(1);
  let runSeed = 1;
  let dropX = WORLD_WIDTH / 2;
  let dropReady = true;
  let nextDropAt = 0;
  let dropSequence = 0;
  let paused = false;
  let gameOver = false;
  let soundEnabled = true;
  let revived = false;
  let safeSnapshot = null;
  let lastSnapshotAt = 0;
  let lastFrameAt = performance.now();
  let accumulator = 0;
  let simulationTime = 0;
  let frameHandle = 0;
  let bodySequence = 0;
  let toastTimer = 0;
  let comboTimer = 0;
  let cinematicTimer = 0;
  let holdTimer = 0;
  let pointerState = null;
  let audioContext = null;
  let pendingPairs = [];
  let particles = [];
  let rings = [];
  let screenFlash = 0;
  let screenShake = 0;
  let harvests = Number(localStorage.getItem(HARVEST_KEY) || 0);
  let best = Number(localStorage.getItem(BEST_KEY) || 0);
  let seenTiers = new Set([0]);

  bestNode.textContent = String(best);
  if (localStorage.getItem(COACH_KEY)) coachNode.classList.add("is-gone");

  function seedForRun() {
    const values = new Uint32Array(1);
    window.crypto?.getRandomValues?.(values);
    return (values[0] || Date.now()) >>> 0;
  }

  function vibrate(pattern) {
    window.navigator?.vibrate?.(pattern);
  }

  function ensureAudio() {
    if (!soundEnabled || audioContext) return;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    audioContext = new AudioCtor();
  }

  function tone(frequency, duration = 0.09, type = "sine", gainValue = 0.045) {
    if (!soundEnabled) return;
    ensureAudio();
    if (!audioContext) return;
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 1.16), now + duration);
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  function playMergeTone(tier, special = false) {
    const base = 280 + tier * 34;
    tone(base, special ? 0.16 : 0.1, tier > 7 ? "triangle" : "sine", special ? 0.07 : 0.045);
    if (special) window.setTimeout(() => tone(base * 1.5, 0.18, "triangle", 0.04), 70);
  }

  function showToast(copy, duration = 1150) {
    clearTimeout(toastTimer);
    toastNode.textContent = copy;
    toastNode.classList.remove("is-visible");
    requestAnimationFrame(() => toastNode.classList.add("is-visible"));
    toastTimer = window.setTimeout(() => toastNode.classList.remove("is-visible"), duration);
  }

  function showCombo(result) {
    clearTimeout(comboTimer);
    const combo = result.state.combo;
    comboNode.textContent = result.mixedMark
      ? `默契合成 · +${Math.round(result.points)}`
      : combo > 1 ? `心跳 ×${result.comboMultiplier} · +${Math.round(result.points)}` : `+${Math.round(result.points)}`;
    comboNode.classList.remove("is-visible");
    requestAnimationFrame(() => comboNode.classList.add("is-visible"));
    comboTimer = window.setTimeout(() => comboNode.classList.remove("is-visible"), 900);
  }

  function showCinematic({ kicker, title, line, duration = 2100 }) {
    clearTimeout(cinematicTimer);
    cinematicKicker.textContent = kicker;
    cinematicTitle.textContent = title;
    cinematicLine.textContent = line;
    cinematic.hidden = false;
    cinematic.setAttribute("data-scene", title.includes("西瓜") ? "watermelon" : "summer");
    vibrate([16, 36, 18]);
    cinematicTimer = window.setTimeout(() => {
      cinematic.hidden = true;
    }, duration);
  }

  function updateHud() {
    const roundedScore = Math.round(scoreState.score);
    scoreNode.textContent = String(roundedScore);
    if (roundedScore > best) {
      best = roundedScore;
      bestNode.textContent = String(best);
      localStorage.setItem(BEST_KEY, String(best));
    }
    heartNodes.forEach((node, index) => node.classList.toggle("is-lit", index < scoreState.heartPips));
    affinityCopy.textContent = scoreState.heartPips === rules.RULES.maxHeartPips
      ? "长按此刻，心意催熟"
      : `${scoreState.heartPips} / ${rules.RULES.maxHeartPips}`;
    currentNameNode.textContent = rules.FRUITS[currentTier].name;
    drawPreviews();
  }

  function nextMark() {
    return marks[Math.floor(markRandom() * marks.length)];
  }

  function takeCurrent() {
    const taken = rules.takeNext(queueState);
    currentTier = taken.tier;
    queueState = taken.state;
    currentMark = nextMark();
    updateHud();
  }

  function bodyFruit(body) {
    return body?.plugin?.watermelon || null;
  }

  function createFruitBody(tier, x, y, mark, options = {}) {
    const fruit = rules.FRUITS[tier];
    const body = Bodies.circle(x, y, fruit.radius, {
      label: `wm-fruit-${tier}`,
      restitution: 0.2 + Math.max(0, 3 - tier) * 0.035,
      friction: 0.08,
      frictionStatic: 0.18,
      frictionAir: 0.007,
      density: 0.00105 + tier * 0.000035,
      slop: 0.025,
      sleepThreshold: 48
    });
    body.plugin.watermelon = {
      id: ++bodySequence,
      tier,
      mark,
      releasedAt: options.releasedAt ?? simulationTime,
      dropId: options.dropId ?? 0,
      firstFruitContact: false,
      precisionTargetId: null,
      contacts: new Set(),
      contactState: null,
      dangerSince: null,
      merging: false,
      bumpUntil: simulationTime + (options.bumpMs ?? 300)
    };
    if (options.angle !== undefined) Body.setAngle(body, options.angle);
    if (options.velocity) Body.setVelocity(body, options.velocity);
    return body;
  }

  function removeFruit(body) {
    const index = fruits.indexOf(body);
    if (index >= 0) fruits.splice(index, 1);
    Composite.remove(engine.world, body);
  }

  function addFruit(body) {
    fruits.push(body);
    Composite.add(engine.world, body);
  }

  function rebuildWalls() {
    if (walls.length) Composite.remove(engine.world, walls);
    walls = [
      Bodies.rectangle(-11, worldHeight / 2, 24, 1800, { isStatic: true, label: "wm-wall-left", friction: 0.08 }),
      Bodies.rectangle(WORLD_WIDTH + 11, worldHeight / 2, 24, 1800, { isStatic: true, label: "wm-wall-right", friction: 0.08 }),
      Bodies.rectangle(WORLD_WIDTH / 2, worldHeight + 11, WORLD_WIDTH + 48, 24, { isStatic: true, label: "wm-floor", friction: 0.18 })
    ];
    Composite.add(engine.world, walls);
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(4, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvasScale = rect.width / WORLD_WIDTH;
    const nextHeight = Math.max(520, rect.height / canvasScale);
    const previousHeight = worldHeight;
    const changed = Math.abs(nextHeight - previousHeight) > 1;
    worldHeight = nextHeight;
    dropX = Math.max(rules.FRUITS[currentTier]?.radius || 13, Math.min(WORLD_WIDTH - (rules.FRUITS[currentTier]?.radius || 13), dropX));
    if (changed || !walls.length) {
      rebuildWalls();
      const floorDelta = worldHeight - previousHeight;
      fruits.forEach((body) => {
        const data = bodyFruit(body);
        const radius = rules.FRUITS[data.tier].radius;
        const settled = body.isSleeping || (data.contacts.size > 0 && body.speed < 0.62);
        const proposedY = body.position.y + (settled ? floorDelta : 0);
        const nextY = Math.max(radius + 2, Math.min(worldHeight - radius - 3, proposedY));
        Body.setPosition(body, { x: body.position.x, y: nextY });
        if (settled || nextY !== proposedY) {
          Body.setVelocity(body, { x: 0, y: 0 });
          Body.setAngularVelocity(body, 0);
        }
        Sleeping.set(body, false);
        data.contacts.clear();
        data.contactState = null;
        data.dangerSince = null;
      });
      if (fruits.length) safeSnapshot = null;
    }
    drawFrame(performance.now());
  }

  function collisionKey(other) {
    return other.id || other.label;
  }

  function registerContact(body, other) {
    const data = bodyFruit(body);
    if (!data) return;
    data.contacts.add(collisionKey(other));
    const otherFruit = bodyFruit(other);
    if (!otherFruit || data.firstFruitContact || data.dropId <= 0) return;
    data.firstFruitContact = true;
    data.precisionTargetId = otherFruit.tier === data.tier && simulationTime - data.releasedAt <= PRECISION_WINDOW
      ? otherFruit.id
      : null;
  }

  function releaseContact(body, other) {
    bodyFruit(body)?.contacts.delete(collisionKey(other));
  }

  Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
      const a = pair.bodyA;
      const b = pair.bodyB;
      registerContact(a, b);
      registerContact(b, a);
      const fruitA = bodyFruit(a);
      const fruitB = bodyFruit(b);
      if (fruitA && fruitB && fruitA.tier === fruitB.tier && !fruitA.merging && !fruitB.merging) {
        pendingPairs.push([a, b]);
      }
    });
  });

  Events.on(engine, "collisionEnd", (event) => {
    event.pairs.forEach((pair) => {
      releaseContact(pair.bodyA, pair.bodyB);
      releaseContact(pair.bodyB, pair.bodyA);
    });
  });

  function createBurst(x, y, tier, strong = false) {
    const palette = fruitPalette[tier];
    const count = strong ? 22 : 10 + Math.min(8, tier);
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (strong ? 1.8 : 1.15) + Math.random() * (strong ? 2.6 : 1.7);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        life: 1,
        size: 1.5 + Math.random() * (strong ? 4.5 : 3),
        color: palette[index % palette.length],
        heart: index % (strong ? 3 : 5) === 0,
        leaf: tier >= 6 && index % 4 === 0
      });
    }
    rings.push({ x, y, radius: rules.FRUITS[tier].radius * 0.45, life: 1, color: palette[2] });
    screenFlash = Math.max(screenFlash, strong ? 0.34 : 0.14);
    screenShake = Math.max(screenShake, strong ? 5 : tier > 6 ? 2.5 : 1.2);
  }

  function mergeBodies(first, second) {
    const firstData = bodyFruit(first);
    const secondData = bodyFruit(second);
    if (!firstData || !secondData || firstData.merging || secondData.merging || firstData.tier !== secondData.tier) return;
    if (!fruits.includes(first) || !fruits.includes(second)) return;
    firstData.merging = true;
    secondData.merging = true;
    const tier = firstData.tier;
    const x = (first.position.x + second.position.x) / 2;
    const y = (first.position.y + second.position.y) / 2;
    const precise = firstData.precisionTargetId === secondData.id
      || secondData.precisionTargetId === firstData.id;
    const velocity = {
      x: (first.velocity.x + second.velocity.x) * 0.34,
      y: Math.min(1.4, (first.velocity.y + second.velocity.y) * 0.22 - 0.55)
    };
    const result = rules.scoreMerge(scoreState, {
      tier,
      timestamp: simulationTime,
      precise,
      marks: [firstData.mark, secondData.mark]
    });
    scoreState = result.state;
    removeFruit(first);
    removeFruit(second);
    createBurst(x, y, Math.min(tier + 1, rules.FRUITS.length - 1), result.harvest || result.mixedMark);
    playMergeTone(tier, result.harvest || result.mixedMark);
    vibrate(result.harvest ? [18, 36, 28] : result.mixedMark ? [10, 22, 10] : 10);
    showCombo(result);

    if (result.harvest) {
      harvests += 1;
      localStorage.setItem(HARVEST_KEY, String(harvests));
      statusNode.textContent = `盛夏相拥 · 已收获 ${harvests} 次`;
      showCinematic({
        kicker: "双瓜相拥 · 盛夏收获",
        title: "这一整个夏天",
        line: "晚风刚好，你们把最甜的一半留给了彼此。"
      });
    } else {
      const mixed = firstData.mark !== secondData.mark;
      const mark = mixed ? marks[Math.floor(markRandom() * marks.length)] : (firstData.mark === "rose" ? "gold" : "rose");
      const next = createFruitBody(result.resultTier, x, y, mark, { velocity, bumpMs: 420 });
      Body.setAngularVelocity(next, (Math.random() - 0.5) * 0.025);
      addFruit(next);
      const fruit = rules.FRUITS[result.resultTier];
      if (!seenTiers.has(result.resultTier)) {
        seenTiers.add(result.resultTier);
        statusNode.textContent = `${fruit.name} · 夏夜又甜了一点`;
        if (result.resultTier === rules.FRUITS.length - 1) {
          showCinematic({
            kicker: "第一次合成 · 大西瓜",
            title: "西瓜熟了",
            line: "你们等过晚风，也等到这一颗盛夏的答案。"
          });
        } else if (result.resultTier >= 7) {
          showToast(`第一次合成 ${fruit.name}`, 1500);
        }
      } else if (result.mixedMark) {
        showToast("两种心意刚好相遇");
      } else if (precise) {
        showToast("精准落果 · 心跳加速");
      }
    }
    updateHud();
  }

  function processPendingMerges() {
    if (!pendingPairs.length) return;
    const pairs = pendingPairs;
    pendingPairs = [];
    const consumed = new Set();
    pairs
      .sort((left, right) => bodyFruit(right[0]).tier - bodyFruit(left[0]).tier)
      .forEach(([first, second]) => {
        if (consumed.has(first.id) || consumed.has(second.id)) return;
        const firstData = bodyFruit(first);
        const secondData = bodyFruit(second);
        if (!firstData || !secondData || firstData.tier !== secondData.tier) return;
        consumed.add(first.id);
        consumed.add(second.id);
        mergeBodies(first, second);
      });
  }

  function updateContactsAndDanger() {
    let longestDanger = 0;
    fruits.forEach((body) => {
      const data = bodyFruit(body);
      const touching = data.contacts.size > 0 && body.speed < 0.58 && body.angularSpeed < 0.055;
      data.contactState = rules.settleContact(data.contactState, touching, simulationTime, CONTACT_SETTLE);
      const eligible = rules.isDangerEligible({
        released: true,
        aboveLine: body.bounds.min.y < DANGER_Y,
        held: false,
        merging: data.merging,
        removed: !fruits.includes(body),
        contact: data.contactState
      });
      if (eligible) {
        data.dangerSince ??= simulationTime;
        longestDanger = Math.max(longestDanger, simulationTime - data.dangerSince);
      } else {
        data.dangerSince = null;
      }
    });
    if (longestDanger > 0) {
      statusNode.textContent = longestDanger > 900 ? "果篮快满了" : "上方有些拥挤";
    }
    if (longestDanger >= DANGER_HOLD) finishGame();
  }

  function snapshotPayload() {
    return {
      bodies: fruits.map((body) => {
        const data = bodyFruit(body);
        return {
          tier: data.tier,
          mark: data.mark,
          x: body.position.x,
          y: body.position.y,
          angle: body.angle
        };
      }),
      scoreState: { ...scoreState },
      queueState: {
        queue: [...queueState.queue],
        bag: [...queueState.bag],
        rngState: queueState.rngState,
        size: queueState.size
      },
      currentTier,
      currentMark,
      markRngState: markRandom.getState(),
      dropX,
      seenTiers: [...seenTiers],
      harvests
    };
  }

  function captureSafeSnapshot() {
    if (simulationTime - lastSnapshotAt < 1100 || gameOver || paused) return;
    const safe = fruits.every((body) => {
      const data = bodyFruit(body);
      return body.bounds.min.y > DANGER_Y + 8
        && body.speed < 0.48
        && data.contacts.size > 0;
    });
    if (!safe || !dropReady) return;
    safeSnapshot = rules.serializeSnapshot(snapshotPayload());
    lastSnapshotAt = simulationTime;
  }

  function restoreSnapshot() {
    if (!safeSnapshot || revived) return;
    const snapshot = rules.parseSnapshot(safeSnapshot);
    fruits.slice().forEach(removeFruit);
    scoreState = snapshot.scoreState;
    queueState = snapshot.queueState;
    currentTier = snapshot.currentTier;
    currentMark = snapshot.currentMark;
    markRandom = rules.createRng(snapshot.markRngState);
    dropX = snapshot.dropX;
    seenTiers = new Set(snapshot.seenTiers);
    harvests = snapshot.harvests;
    snapshot.bodies.forEach((item) => {
      const radius = rules.FRUITS[item.tier].radius;
      addFruit(createFruitBody(
        item.tier,
        Math.max(radius + 2, Math.min(WORLD_WIDTH - radius - 2, item.x)),
        Math.max(DANGER_Y + radius + 12, Math.min(worldHeight - radius - 8, item.y)),
        item.mark,
        { angle: item.angle, releasedAt: simulationTime - 1000 }
      ));
    });
    revived = true;
    gameOver = false;
    paused = false;
    dropReady = true;
    resultSheet.hidden = true;
    statusNode.textContent = "再靠近一次，晚风还在";
    updateHud();
    vibrate([14, 34, 14]);
  }

  function finishGame() {
    if (gameOver) return;
    gameOver = true;
    paused = true;
    const rounded = Math.round(scoreState.score);
    resultScore.textContent = String(rounded);
    resultCopy.textContent = harvests
      ? `你们收获了 ${harvests} 次盛夏相拥。`
      : "果篮装满了，甜意不会消失。";
    reviveButton.hidden = revived || !safeSnapshot;
    resultSheet.hidden = false;
    statusNode.textContent = "果篮已满";
    vibrate([28, 50, 28]);
    tone(150, 0.28, "triangle", 0.055);
  }

  function dropCurrent() {
    if (!dropReady || paused || gameOver || !cinematic.hidden) return;
    const radius = rules.FRUITS[currentTier].radius;
    dropX = Math.max(radius + 3, Math.min(WORLD_WIDTH - radius - 3, dropX));
    const body = createFruitBody(currentTier, dropX, DROP_Y, currentMark, {
      releasedAt: simulationTime,
      dropId: ++dropSequence
    });
    addFruit(body);
    dropReady = false;
    nextDropAt = simulationTime + 410;
    tone(210 + currentTier * 22, 0.055, "sine", 0.025);
    takeCurrent();
  }

  function ripenHeldFruit() {
    if (!pointerState || pointerState.moved || paused || gameOver) return;
    const result = rules.ripenCurrent(scoreState, currentTier, true);
    if (!result.ripened) return;
    scoreState = result.state;
    currentTier = result.tier;
    pointerState.ripened = true;
    showToast(`心意催熟 · ${rules.FRUITS[currentTier].name}`, 1350);
    statusNode.textContent = "心意让此刻提前长大";
    createBurst(dropX, DROP_Y, currentTier, true);
    updateHud();
    playMergeTone(currentTier, true);
    vibrate([12, 28, 12]);
  }

  function pointerToWorld(event) {
    const rect = canvas.getBoundingClientRect();
    return (event.clientX - rect.left) / canvasScale;
  }

  function hideCoach() {
    if (coachNode.classList.contains("is-gone")) return;
    coachNode.classList.add("is-gone");
    localStorage.setItem(COACH_KEY, "1");
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (paused || gameOver || !dropReady || !cinematic.hidden) return;
    event.preventDefault();
    ensureAudio();
    hideCoach();
    canvas.setPointerCapture?.(event.pointerId);
    const x = pointerToWorld(event);
    dropX = Math.max(12, Math.min(WORLD_WIDTH - 12, x));
    pointerState = { id: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false, ripened: false };
    clearTimeout(holdTimer);
    holdTimer = window.setTimeout(ripenHeldFruit, 560);
  }, { passive: false });

  canvas.addEventListener("pointermove", (event) => {
    if (!pointerState || event.pointerId !== pointerState.id) return;
    event.preventDefault();
    const distance = Math.hypot(event.clientX - pointerState.startX, event.clientY - pointerState.startY);
    if (distance > 8) {
      pointerState.moved = true;
      clearTimeout(holdTimer);
    }
    const radius = rules.FRUITS[currentTier].radius;
    dropX = Math.max(radius + 3, Math.min(WORLD_WIDTH - radius - 3, pointerToWorld(event)));
  }, { passive: false });

  function releasePointer(event, shouldDrop) {
    if (!pointerState || event.pointerId !== pointerState.id) return;
    clearTimeout(holdTimer);
    if (shouldDrop) {
      const radius = rules.FRUITS[currentTier].radius;
      dropX = Math.max(radius + 3, Math.min(WORLD_WIDTH - radius - 3, pointerToWorld(event)));
      dropCurrent();
    }
    pointerState = null;
  }

  canvas.addEventListener("pointerup", (event) => {
    event.preventDefault();
    releasePointer(event, true);
  }, { passive: false });
  canvas.addEventListener("pointercancel", (event) => releasePointer(event, false));

  function togglePause(force) {
    if (gameOver) return;
    paused = force === undefined ? !paused : Boolean(force);
    pauseSheet.hidden = !paused;
    pauseButton.textContent = paused ? "▶" : "Ⅱ";
    pauseButton.setAttribute("aria-label", paused ? "继续游戏" : "暂停游戏");
    statusNode.textContent = paused ? "晚风暂停" : "果房重新亮起";
  }

  function resetGame() {
    clearTimeout(holdTimer);
    clearTimeout(cinematicTimer);
    fruits.slice().forEach(removeFruit);
    runSeed = seedForRun();
    queueState = rules.createQueue(runSeed, 3);
    scoreState = rules.createScoreState();
    markRandom = rules.createRng(runSeed ^ 0x9e3779b9);
    currentTier = 0;
    currentMark = "rose";
    dropX = WORLD_WIDTH / 2;
    dropReady = true;
    nextDropAt = 0;
    dropSequence = 0;
    paused = false;
    gameOver = false;
    revived = false;
    safeSnapshot = null;
    lastSnapshotAt = 0;
    simulationTime = 0;
    engine.timing.timestamp = 0;
    seenTiers = new Set([0]);
    particles = [];
    rings = [];
    pendingPairs = [];
    pauseSheet.hidden = true;
    resultSheet.hidden = true;
    cinematic.hidden = true;
    pauseButton.textContent = "Ⅱ";
    pauseButton.setAttribute("aria-label", "暂停游戏");
    takeCurrent();
    safeSnapshot = rules.serializeSnapshot(snapshotPayload());
    statusNode.textContent = "夏夜第一颗果实";
    updateHud();
  }

  document.querySelector("#wm-restart").addEventListener("click", resetGame);
  document.querySelector("#wm-restart-result").addEventListener("click", resetGame);
  document.querySelector("#wm-resume").addEventListener("click", () => togglePause(false));
  reviveButton.addEventListener("click", restoreSnapshot);
  pauseButton.addEventListener("click", () => togglePause());
  soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundButton.textContent = soundEnabled ? "♪" : "×";
    soundButton.setAttribute("aria-label", soundEnabled ? "关闭声音" : "开启声音");
    if (soundEnabled) tone(440, 0.08, "sine", 0.035);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !gameOver) togglePause(true);
  });

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function fruitGradient(ctx, radius, colors) {
    const gradient = ctx.createRadialGradient(-radius * 0.35, -radius * 0.42, radius * 0.08, 0, 0, radius * 1.06);
    gradient.addColorStop(0, colors[2]);
    gradient.addColorStop(0.45, colors[0]);
    gradient.addColorStop(1, colors[1]);
    return gradient;
  }

  function drawLeaf(ctx, x, y, width, height, angle, color = "#619c67") {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(width * 0.55, -height * 0.8, width, 0);
    ctx.quadraticCurveTo(width * 0.48, height * 0.74, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  function drawFace(ctx, radius, mark) {
    if (radius < 15) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(46, 23, 33, 0.78)";
    ctx.lineWidth = Math.max(1.2, radius * 0.045);
    const eyeY = radius * 0.08;
    const eyeX = radius * 0.2;
    ctx.beginPath();
    ctx.arc(-eyeX, eyeY, radius * 0.075, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.arc(eyeX, eyeY, radius * 0.075, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 180, 185, 0.62)";
    ctx.beginPath();
    ctx.ellipse(-radius * 0.34, radius * 0.25, radius * 0.12, radius * 0.065, 0, 0, Math.PI * 2);
    ctx.ellipse(radius * 0.34, radius * 0.25, radius * 0.12, radius * 0.065, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mark === "rose" ? "rgba(255, 224, 231, 0.92)" : "rgba(255, 236, 164, 0.94)";
    ctx.font = `700 ${Math.max(7, radius * 0.22)}px Georgia`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("♥", mark === "rose" ? -radius * 0.54 : radius * 0.54, -radius * 0.1);
    ctx.restore();
  }

  function drawFruitShape(ctx, tier, radius, mark) {
    const colors = fruitPalette[tier];
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.36)";
    ctx.shadowBlur = Math.max(5, radius * 0.22);
    ctx.shadowOffsetY = Math.max(2, radius * 0.1);

    if (tier === 1) {
      ctx.strokeStyle = "#527957";
      ctx.lineWidth = Math.max(1.4, radius * 0.09);
      ctx.beginPath();
      ctx.moveTo(-radius * 0.28, -radius * 0.35);
      ctx.quadraticCurveTo(0, -radius * 1.12, radius * 0.25, -radius * 0.34);
      ctx.stroke();
      ctx.fillStyle = fruitGradient(ctx, radius * 0.72, colors);
      ctx.beginPath();
      ctx.arc(-radius * 0.28, radius * 0.12, radius * 0.58, 0, Math.PI * 2);
      ctx.arc(radius * 0.28, radius * 0.12, radius * 0.58, 0, Math.PI * 2);
      ctx.fill();
    } else if (tier === 2) {
      ctx.fillStyle = fruitGradient(ctx, radius, colors);
      ctx.beginPath();
      ctx.moveTo(0, radius * 0.93);
      ctx.bezierCurveTo(-radius * 0.9, radius * 0.34, -radius * 0.86, -radius * 0.62, 0, -radius * 0.72);
      ctx.bezierCurveTo(radius * 0.86, -radius * 0.62, radius * 0.9, radius * 0.34, 0, radius * 0.93);
      ctx.fill();
      for (let index = 0; index < 10; index += 1) {
        const angle = index * 2.4;
        const distance = radius * (0.2 + (index % 3) * 0.17);
        ctx.fillStyle = "rgba(255, 233, 169, 0.78)";
        ctx.beginPath();
        ctx.ellipse(Math.cos(angle) * distance, Math.sin(angle) * distance * 0.74, 1.1, 2, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      drawLeaf(ctx, -radius * 0.5, -radius * 0.58, radius * 0.55, radius * 0.23, 0.3);
      drawLeaf(ctx, 0, -radius * 0.68, radius * 0.55, radius * 0.23, -0.15);
    } else if (tier === 3) {
      const grapeRadius = radius * 0.31;
      ctx.fillStyle = fruitGradient(ctx, grapeRadius * 1.4, colors);
      [[0, -0.47], [-0.32, -0.2], [0.32, -0.2], [-0.46, 0.14], [0, 0.12], [0.46, 0.14], [-0.27, 0.48], [0.27, 0.48], [0, 0.72]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x * radius, y * radius, grapeRadius, 0, Math.PI * 2);
        ctx.fill();
      });
      drawLeaf(ctx, 0, -radius * 0.72, radius * 0.75, radius * 0.32, -0.45);
    } else if (tier === 6) {
      ctx.fillStyle = fruitGradient(ctx, radius, colors);
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.96);
      ctx.bezierCurveTo(-radius * 0.24, -radius * 0.6, -radius * 0.86, -radius * 0.2, -radius * 0.72, radius * 0.42);
      ctx.bezierCurveTo(-radius * 0.58, radius, radius * 0.58, radius, radius * 0.72, radius * 0.42);
      ctx.bezierCurveTo(radius * 0.86, -radius * 0.2, radius * 0.24, -radius * 0.6, 0, -radius * 0.96);
      ctx.fill();
      drawLeaf(ctx, 0, -radius * 0.88, radius * 0.55, radius * 0.24, -0.4, "#5b8d4e");
    } else if (tier === 8) {
      ctx.fillStyle = fruitGradient(ctx, radius, colors);
      ctx.beginPath();
      ctx.ellipse(0, radius * 0.12, radius * 0.74, radius * 0.84, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(92, 77, 26, 0.44)";
      ctx.lineWidth = Math.max(1, radius * 0.025);
      for (let offset = -0.65; offset <= 0.65; offset += 0.26) {
        ctx.beginPath();
        ctx.moveTo(-radius * 0.62, radius * offset);
        ctx.lineTo(radius * 0.62, radius * (offset + 0.42));
        ctx.moveTo(radius * 0.62, radius * offset);
        ctx.lineTo(-radius * 0.62, radius * (offset + 0.42));
        ctx.stroke();
      }
      for (let index = -2; index <= 2; index += 1) drawLeaf(ctx, 0, -radius * 0.62, radius * 0.9, radius * 0.23, index * 0.28 - 0.1, "#5f9b57");
    } else {
      ctx.fillStyle = fruitGradient(ctx, radius, colors);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.92, 0, Math.PI * 2);
      ctx.fill();

      if (tier === 0) {
        ctx.fillStyle = "#3e4d86";
        ctx.beginPath();
        for (let index = 0; index < 5; index += 1) {
          const angle = -Math.PI / 2 + index * Math.PI * 0.4;
          const x = Math.cos(angle) * radius * 0.32;
          const y = Math.sin(angle) * radius * 0.32 - radius * 0.42;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
      if (tier === 4) {
        ctx.strokeStyle = "rgba(255, 224, 150, 0.38)";
        ctx.lineWidth = Math.max(1, radius * 0.028);
        for (let index = 0; index < 8; index += 1) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(index * Math.PI / 4) * radius * 0.86, Math.sin(index * Math.PI / 4) * radius * 0.86);
          ctx.stroke();
        }
      }
      if (tier === 5) {
        ctx.fillStyle = "rgba(105, 30, 45, 0.42)";
        ctx.beginPath();
        ctx.ellipse(0, -radius * 0.84, radius * 0.2, radius * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        drawLeaf(ctx, 0, -radius * 0.78, radius * 0.68, radius * 0.26, -0.42, "#598c58");
      }
      if (tier === 7) {
        ctx.strokeStyle = "rgba(127, 52, 67, 0.48)";
        ctx.lineWidth = Math.max(1.2, radius * 0.034);
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.84);
        ctx.bezierCurveTo(-radius * 0.14, -radius * 0.3, -radius * 0.14, radius * 0.32, -radius * 0.04, radius * 0.82);
        ctx.stroke();
        drawLeaf(ctx, 0, -radius * 0.82, radius * 0.55, radius * 0.2, -0.48, "#638f58");
      }
      if (tier === 9) {
        ctx.strokeStyle = "rgba(255, 247, 197, 0.26)";
        ctx.lineWidth = Math.max(1, radius * 0.018);
        for (let index = -5; index <= 5; index += 1) {
          ctx.beginPath();
          ctx.arc(index * radius * 0.16, 0, radius * 0.82, -Math.PI * 0.7, Math.PI * 0.7);
          ctx.stroke();
        }
      }
      if (tier === 10) {
        ctx.strokeStyle = "rgba(25, 82, 47, 0.78)";
        ctx.lineWidth = Math.max(2.5, radius * 0.085);
        for (let index = -3; index <= 3; index += 1) {
          ctx.beginPath();
          ctx.arc(index * radius * 0.24, 0, radius * 0.84, -Math.PI * 0.58, Math.PI * 0.58);
          ctx.stroke();
        }
      }
    }

    ctx.shadowColor = "transparent";
    const gloss = ctx.createLinearGradient(-radius, -radius, radius, radius);
    gloss.addColorStop(0, "rgba(255,255,255,0.42)");
    gloss.addColorStop(0.34, "rgba(255,255,255,0.06)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.ellipse(-radius * 0.27, -radius * 0.31, radius * 0.26, radius * 0.13, -0.72, 0, Math.PI * 2);
    ctx.fill();
    drawFace(ctx, radius, mark);
    ctx.restore();
  }

  function drawFruitAt(ctx, tier, mark, x, y, radius, angle = 0, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    drawFruitShape(ctx, tier, radius, mark);
    ctx.restore();
  }

  function drawPreview(canvasNode, tier, mark) {
    const ctx = canvasNode.getContext("2d");
    const width = canvasNode.width;
    const height = canvasNode.height;
    ctx.clearRect(0, 0, width, height);
    const radius = Math.min(width, height) * 0.32;
    drawFruitAt(ctx, tier, mark, width / 2, height / 2 + 2, radius, 0, 1);
  }

  function drawPreviews() {
    drawPreview(currentPreview, currentTier, currentMark);
    drawPreview(nextOnePreview, rules.peekQueue(queueState, 0), "rose");
    drawPreview(nextTwoPreview, rules.peekQueue(queueState, 1), "gold");
  }

  function drawScene(ctx, height) {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#4b3145");
    sky.addColorStop(0.22, "#9a5968");
    sky.addColorStop(0.42, "#d48772");
    sky.addColorStop(0.44, "#527269");
    sky.addColorStop(1, "#111b1c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WORLD_WIDTH, height);

    ctx.fillStyle = "rgba(24, 30, 32, 0.78)";
    const skylineY = Math.max(148, height * 0.28);
    [[0, 52, 36], [35, 78, 54], [86, 43, 62], [143, 68, 42], [186, 54, 70], [252, 82, 40], [289, 56, 76], [341, 39, 55]].forEach(([x, w, h]) => {
      ctx.fillRect(x, skylineY - h, w, h);
    });

    ctx.strokeStyle = "rgba(243, 211, 184, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.2);
    ctx.lineTo(WORLD_WIDTH * 0.5, 2);
    ctx.lineTo(WORLD_WIDTH, height * 0.2);
    ctx.moveTo(WORLD_WIDTH * 0.18, 0);
    ctx.lineTo(WORLD_WIDTH * 0.18, height);
    ctx.moveTo(WORLD_WIDTH * 0.82, 0);
    ctx.lineTo(WORLD_WIDTH * 0.82, height);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 229, 193, 0.36)";
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(18, 31);
    ctx.quadraticCurveTo(WORLD_WIDTH / 2, 50, WORLD_WIDTH - 18, 28);
    ctx.stroke();
    for (let index = 0; index < 9; index += 1) {
      const x = 25 + index * 39;
      const y = 32 + Math.sin(index * 0.75) * 7;
      ctx.fillStyle = index % 2 ? "#f6c86c" : "#f28b91";
      roundedRect(ctx, x - 2.2, y - 1.2, 4.4, 5.5, 1.5);
      ctx.fill();
    }

    const floor = ctx.createLinearGradient(0, height * 0.76, 0, height);
    floor.addColorStop(0, "rgba(18, 42, 37, 0.08)");
    floor.addColorStop(1, "rgba(8, 13, 14, 0.8)");
    ctx.fillStyle = floor;
    ctx.fillRect(0, height * 0.7, WORLD_WIDTH, height * 0.3);

    ctx.save();
    ctx.setLineDash([5, 7]);
    ctx.strokeStyle = gameOver ? "rgba(255, 108, 122, 0.72)" : "rgba(255, 187, 174, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, DANGER_Y);
    ctx.lineTo(WORLD_WIDTH - 10, DANGER_Y);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "rgba(255, 235, 219, 0.56)";
    ctx.font = "700 7px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("拥挤线", WORLD_WIDTH - 13, DANGER_Y - 6);

    ctx.strokeStyle = "rgba(207, 238, 219, 0.24)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2, 87);
    ctx.lineTo(2, height - 3);
    ctx.quadraticCurveTo(2, height - 1, 5, height - 1);
    ctx.lineTo(WORLD_WIDTH - 5, height - 1);
    ctx.quadraticCurveTo(WORLD_WIDTH - 2, height - 1, WORLD_WIDTH - 2, height - 4);
    ctx.lineTo(WORLD_WIDTH - 2, 87);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, 90);
    ctx.lineTo(8, height - 8);
    ctx.moveTo(WORLD_WIDTH - 8, 90);
    ctx.lineTo(WORLD_WIDTH - 8, height - 8);
    ctx.stroke();
  }

  function drawSuspended(ctx) {
    if (!dropReady || paused || gameOver || !cinematic.hidden) return;
    const radius = rules.FRUITS[currentTier].radius;
    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = scoreState.heartPips === rules.RULES.maxHeartPips
      ? "rgba(255, 218, 116, 0.72)"
      : "rgba(255, 225, 215, 0.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dropX, DROP_Y + radius + 4);
    ctx.lineTo(dropX, Math.min(worldHeight - 12, DROP_Y + 185));
    ctx.stroke();
    ctx.restore();
    const pulse = scoreState.heartPips === rules.RULES.maxHeartPips ? 1 + Math.sin(performance.now() / 150) * 0.035 : 1;
    drawFruitAt(ctx, currentTier, currentMark, dropX, DROP_Y, radius, 0, pulse);
  }

  function drawParticles(ctx) {
    particles.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.translate(particle.x, particle.y);
      ctx.rotate(Math.atan2(particle.vy, particle.vx));
      ctx.fillStyle = particle.color;
      if (particle.heart) {
        const size = particle.size;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.7);
        ctx.bezierCurveTo(-size * 1.2, -size * 0.1, -size * 0.8, -size, 0, -size * 0.45);
        ctx.bezierCurveTo(size * 0.8, -size, size * 1.2, -size * 0.1, 0, size * 0.7);
        ctx.fill();
      } else if (particle.leaf) {
        ctx.beginPath();
        ctx.ellipse(0, 0, particle.size * 1.4, particle.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    rings.forEach((ring) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ring.life) * 0.7;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  function updateVisualEffects(delta) {
    const frame = Math.min(2, delta / 16.667);
    particles.forEach((particle) => {
      particle.x += particle.vx * frame;
      particle.y += particle.vy * frame;
      particle.vy += 0.08 * frame;
      particle.vx *= 0.986;
      particle.life -= 0.026 * frame;
    });
    particles = particles.filter((particle) => particle.life > 0);
    rings.forEach((ring) => {
      ring.radius += 1.5 * frame;
      ring.life -= 0.035 * frame;
    });
    rings = rings.filter((ring) => ring.life > 0);
    screenFlash = Math.max(0, screenFlash - 0.025 * frame);
    screenShake = Math.max(0, screenShake - 0.24 * frame);
  }

  function drawFrame(now) {
    if (!context || !canvas.width || !canvas.height) return;
    const pixelScale = dpr * canvasScale;
    const shakeX = screenShake ? (Math.random() - 0.5) * screenShake : 0;
    const shakeY = screenShake ? (Math.random() - 0.5) * screenShake : 0;
    context.setTransform(pixelScale, 0, 0, pixelScale, shakeX * pixelScale, shakeY * pixelScale);
    drawScene(context, worldHeight);
    fruits
      .slice()
      .sort((left, right) => bodyFruit(left).tier - bodyFruit(right).tier)
      .forEach((body) => {
        const data = bodyFruit(body);
        const bumpProgress = Math.max(0, (data.bumpUntil - simulationTime) / 420);
        const squash = 1 + Math.sin((1 - bumpProgress) * Math.PI) * bumpProgress * 0.12;
        drawFruitAt(context, data.tier, data.mark, body.position.x, body.position.y, rules.FRUITS[data.tier].radius, body.angle, squash);
      });
    drawSuspended(context);
    drawParticles(context);
    if (screenFlash > 0) {
      context.fillStyle = `rgba(255, 238, 204, ${screenFlash})`;
      context.fillRect(0, 0, WORLD_WIDTH, worldHeight);
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
  }

  function tick(now) {
    const elapsed = Math.max(0, now - lastFrameAt);
    const delta = Math.min(MAX_FRAME_DELTA, elapsed);
    lastFrameAt = now;
    if (!paused && !gameOver && cinematic.hidden) {
      accumulator = Math.min(MAX_BACKLOG, accumulator + delta);
      let steps = 0;
      while (accumulator >= STEP && steps < MAX_CATCHUP_STEPS) {
        Engine.update(engine, STEP);
        simulationTime += STEP;
        processPendingMerges();
        accumulator -= STEP;
        steps += 1;
        if (paused || gameOver || !cinematic.hidden) {
          accumulator = 0;
          break;
        }
        updateContactsAndDanger();
        if (paused || gameOver || !cinematic.hidden) {
          accumulator = 0;
          break;
        }
        captureSafeSnapshot();
        if (!dropReady && simulationTime >= nextDropAt) dropReady = true;
      }
    }
    updateVisualEffects(Math.min(50, elapsed));
    drawFrame(now);
    frameHandle = requestAnimationFrame(tick);
  }

  const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(resizeCanvas) : null;
  resizeObserver?.observe(stage);
  if (!resizeObserver) window.addEventListener("resize", resizeCanvas, { passive: true });
  rebuildWalls();
  resetGame();
  resizeCanvas();
  frameHandle = requestAnimationFrame(tick);

  let destroyed = false;
  function destroyGame() {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(frameHandle);
    resizeObserver?.disconnect();
    if (!resizeObserver) window.removeEventListener("resize", resizeCanvas);
    Events.off(engine);
    Engine.clear(engine);
    audioContext?.close?.();
  }

  window.addEventListener("pagehide", (event) => {
    if (event.persisted) {
      lastFrameAt = performance.now();
      return;
    }
    destroyGame();
  });
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted || destroyed) return;
    lastFrameAt = performance.now();
    accumulator = 0;
    drawFrame(lastFrameAt);
  });
})();
