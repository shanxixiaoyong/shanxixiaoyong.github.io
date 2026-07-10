(() => {
  "use strict";

  const root = document.querySelector("#watermelon-game");
  if (!root) return;
  const MatterApi = window.Matter;
  const rules = window.WatermelonRules;
  if (!MatterApi || !rules) throw new Error("Matter.js and WatermelonRules are required");

  const { Engine, Events, Bodies, Body, Composite, Sleeping } = MatterApi;
  const moments = rules.MOMENTS;
  const responseMarks = rules.RESPONSE_MARKS;
  const canvas = document.querySelector("#wm-canvas");
  const stage = document.querySelector("#wm-stage");
  const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
  const scoreNode = document.querySelector("#wm-score");
  const bestNode = document.querySelector("#wm-best");
  const statusNode = document.querySelector("#wm-status");
  const currentNameNode = document.querySelector("#wm-current-name");
  const currentMaterialNode = document.querySelector("#wm-current-material");
  const currentPreview = document.querySelector("#wm-current-moment");
  const nextOnePreview = document.querySelector("#wm-next-one");
  const nextTwoPreview = document.querySelector("#wm-next-two");
  const courageNodes = [...document.querySelectorAll("#wm-courage i")];
  const courageCopy = document.querySelector("#wm-courage-copy");
  const sceneNameNode = document.querySelector("#wm-scene-name");
  const sceneChapterNode = document.querySelector("#wm-scene-chapter");
  const toastNode = document.querySelector("#wm-toast");
  const comboNode = document.querySelector("#wm-combo");
  const pauseSheet = document.querySelector("#wm-pause-sheet");
  const resultSheet = document.querySelector("#wm-result");
  const resultScore = document.querySelector("#wm-result-score");
  const resultCopy = document.querySelector("#wm-result-copy");
  const reviveButton = document.querySelector("#wm-revive");
  const cinematic = document.querySelector("#wm-cinematic");
  const eventCanvas = document.querySelector("#wm-event-canvas");
  const cinematicKicker = document.querySelector("#wm-cinematic-kicker");
  const cinematicTitle = document.querySelector("#wm-cinematic-title");
  const cinematicLine = document.querySelector("#wm-cinematic-line");
  const pauseButton = document.querySelector("#wm-pause");
  const soundButton = document.querySelector("#wm-sound");

  const WORLD_WIDTH = 365;
  const DROP_Y = 57;
  const DANGER_Y = 120;
  const STEP = 1000 / 60;
  const PRECISION_WINDOW = 820;
  const DANGER_HOLD = 1650;
  const CONTACT_SETTLE = 300;
  const COURAGE_HOLD_MS = 620;
  const MAX_FRAME_DELTA = 250;
  const MAX_CATCHUP_STEPS = 8;
  const MAX_BACKLOG = STEP * 15;
  const BEST_KEY = "yl-heart-watermelon-best-v1";
  const SECRET_COUNT_KEY = "yl-heart-watermelon-secrets-v1";
  const DISCOVERY_KEY = "yl-heart-watermelon-discoveries-v1";
  const SECRET_DISCOVERY_KEY = "yl-heart-watermelon-secret-discovered-v1";

  function readStorage(key, fallback = null) {
    try {
      return window.localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      return false;
    }
    return true;
  }

  function readDiscoveries() {
    try {
      const values = JSON.parse(readStorage(DISCOVERY_KEY, "[]"));
      if (!Array.isArray(values)) return new Set();
      return new Set(values.filter((tier) => Number.isInteger(tier) && tier >= 0 && tier < moments.length));
    } catch {
      return new Set();
    }
  }

  function persistDiscoveries() {
    writeStorage(DISCOVERY_KEY, JSON.stringify([...discoveredTiers].sort((left, right) => left - right)));
  }

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
  let momentBodies = [];
  let queueState = null;
  let scoreState = rules.createScoreState();
  let currentTier = 0;
  let currentMark = responseMarks[0].id;
  let markRandom = rules.createRng(1);
  let eventRandom = rules.createRng(2);
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
  let heartbeatAudio = null;
  let pendingPairs = [];
  let particles = [];
  let rings = [];
  let screenFlash = 0;
  let screenShake = 0;
  let cinematicQueue = [];
  let lastRewardIds = Object.create(null);
  let lastSecretEventId = null;
  let highestTier = 0;
  let activeScene = rules.sceneForTier(0);
  let discoveredTiers = readDiscoveries();
  let secretDiscovered = readStorage(SECRET_DISCOVERY_KEY, "0") === "1";
  let secretCount = Number(readStorage(SECRET_COUNT_KEY, "0")) || 0;
  let best = Number(readStorage(BEST_KEY, "0")) || 0;

  bestNode.textContent = String(best);

  function seedForRun() {
    const values = new Uint32Array(1);
    window.crypto?.getRandomValues?.(values);
    return (values[0] || Date.now()) >>> 0;
  }

  function vibrate(pattern) {
    window.navigator?.vibrate?.(pattern);
  }

  function createHeartbeatAudio() {
    const Candidate = window.HeartbeatAudio;
    if (!Candidate) return null;
    if (typeof Candidate !== "function") return Candidate;
    try {
      return new Candidate({ channel: "heart-watermelon", adaptive: true });
    } catch {
      try {
        return new Candidate();
      } catch {
        return null;
      }
    }
  }

  function ensureAudio() {
    if (!soundEnabled) return;
    heartbeatAudio ??= createHeartbeatAudio();
    try {
      heartbeatAudio?.resume?.();
    } catch {
      heartbeatAudio = null;
    }
    if (audioContext) return;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    audioContext = new AudioCtor();
  }

  function dispatchHeartbeat(type, payload) {
    if (!soundEnabled || !heartbeatAudio) return false;
    const handlers = [type, "trigger", "playEvent", "play"];
    for (const handler of handlers) {
      if (typeof heartbeatAudio[handler] !== "function") continue;
      try {
        if (handler === type) heartbeatAudio[handler](payload);
        else heartbeatAudio[handler](type, payload);
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }

  function syncAdaptiveAudio() {
    if (!soundEnabled || !heartbeatAudio) return;
    const intensity = Math.min(1, 0.16 + highestTier * 0.055 + scoreState.courage * 0.08);
    try {
      heartbeatAudio.setScene?.(activeScene.id);
      heartbeatAudio.setIntensity?.(intensity);
    } catch {
      heartbeatAudio = null;
    }
  }

  function tone(frequency, duration = 0.09, type = "sine", gainValue = 0.04, glide = 1.12) {
    if (!soundEnabled) return;
    ensureAudio();
    if (!audioContext) return;
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(70, frequency * glide), now + duration);
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  function playDropAudio(tier) {
    const payload = { tier, scene: activeScene.id, courage: scoreState.courage };
    if (dispatchHeartbeat("drop", payload)) return;
    tone(190 + tier * 17, 0.055, "sine", 0.022, 1.06);
  }

  function playMergeAudio(tier, result) {
    const payload = {
      tier,
      scene: activeScene.id,
      combo: result.state.combo,
      mutual: result.mutualResponse,
      courage: result.state.courage,
      secret: result.secretCombination
    };
    if (dispatchHeartbeat(result.secretCombination ? "secret" : "merge", payload)) return;
    const base = 255 + tier * 29 + Math.min(3, result.state.combo) * 8;
    const special = result.mutualResponse || result.secretCombination;
    tone(base, special ? 0.16 : 0.1, tier > 6 ? "triangle" : "sine", special ? 0.058 : 0.038, 1.16);
    if (special) window.setTimeout(() => tone(base * 1.48, 0.17, "triangle", 0.035, 1.04), 66);
  }

  function playCourageAudio(tier) {
    const payload = { tier, scene: activeScene.id, courage: 0 };
    if (dispatchHeartbeat("courage", payload)) return;
    [330, 440, 590].forEach((frequency, index) => {
      window.setTimeout(() => tone(frequency + tier * 12, 0.11, "triangle", 0.035, 1.08), index * 62);
    });
  }

  function setButtonGlyph(button, glyph) {
    const glyphNode = button.querySelector("span") || button;
    glyphNode.textContent = glyph;
  }

  function showToast(copy, duration = 1350) {
    clearTimeout(toastTimer);
    toastNode.textContent = copy;
    toastNode.classList.remove("is-visible");
    requestAnimationFrame(() => toastNode.classList.add("is-visible"));
    toastTimer = window.setTimeout(() => toastNode.classList.remove("is-visible"), duration);
  }

  function showCombo(result) {
    clearTimeout(comboTimer);
    const combo = result.state.combo;
    comboNode.textContent = result.mutualResponse
      ? `彼此回应 · 勇气 ${result.state.courage}/${rules.RULES.maxCourage}`
      : combo > 1
        ? `心跳 ×${result.comboMultiplier} · +${Math.round(result.points)}`
        : `+${Math.round(result.points)}`;
    comboNode.classList.remove("is-visible");
    requestAnimationFrame(() => comboNode.classList.add("is-visible"));
    comboTimer = window.setTimeout(() => comboNode.classList.remove("is-visible"), 920);
  }

  function cinematicBlocking() {
    return !cinematic.hidden || cinematicQueue.length > 0;
  }

  function renderCinematic(entry) {
    clearTimeout(cinematicTimer);
    cinematic.dataset.performance = entry.event.performance;
    cinematicKicker.textContent = entry.event.kicker;
    cinematicTitle.textContent = entry.event.title;
    cinematicLine.textContent = entry.event.line;
    cinematic.hidden = false;
    drawEventMoment(entry.tier);
    vibrate(entry.secret ? [18, 38, 24, 48, 18] : [12, 28, 14]);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    cinematicTimer = window.setTimeout(finishCinematic, reducedMotion ? 1600 : entry.secret ? 3600 : 3200);
  }

  function queueCinematic(event, tier, secret = false) {
    const entry = { event, tier, secret };
    if (cinematic.hidden && cinematicQueue.length === 0) renderCinematic(entry);
    else cinematicQueue.push(entry);
  }

  function finishCinematic() {
    clearTimeout(cinematicTimer);
    if (cinematicQueue.length > 0) {
      renderCinematic(cinematicQueue.shift());
      return;
    }
    cinematic.hidden = true;
    lastFrameAt = performance.now();
    accumulator = 0;
  }

  function updateHud() {
    const roundedScore = Math.round(scoreState.score);
    scoreNode.textContent = String(roundedScore);
    if (roundedScore > best) {
      best = roundedScore;
      bestNode.textContent = String(best);
      writeStorage(BEST_KEY, best);
    }
    courageNodes.forEach((node, index) => node.classList.toggle("is-lit", index < scoreState.courage));
    courageCopy.textContent = scoreState.courage === rules.RULES.maxCourage
      ? "勇气满格"
      : scoreState.courage === 0 ? "等待回应" : `${scoreState.courage} / ${rules.RULES.maxCourage}`;
    const current = moments[currentTier];
    currentNameNode.textContent = current.name;
    currentMaterialNode.textContent = current.material;
    drawPreviews();
    syncAdaptiveAudio();
  }

  function nextMark() {
    return responseMarks[Math.floor(markRandom() * responseMarks.length)].id;
  }

  function oppositeMark(mark) {
    return responseMarks.find((candidate) => candidate.id !== mark)?.id || responseMarks[0].id;
  }

  function takeCurrent() {
    const taken = rules.takeNext(queueState);
    currentTier = taken.tier;
    queueState = taken.state;
    currentMark = nextMark();
    updateHud();
  }

  function bodyMoment(body) {
    return body?.plugin?.heartMoment || null;
  }

  function createMomentBody(tier, x, y, mark, options = {}) {
    const moment = moments[tier];
    const physics = moment.physics;
    const body = Bodies.circle(x, y, moment.radius, {
      label: `wm-moment-${moment.id}`,
      restitution: physics.restitution,
      friction: 0.08 + tier * 0.003,
      frictionStatic: 0.18,
      frictionAir: physics.frictionAir,
      density: physics.density,
      slop: 0.025,
      sleepThreshold: 48
    });
    body.plugin.heartMoment = {
      id: ++bodySequence,
      tier,
      mark,
      releasedAt: options.releasedAt ?? simulationTime,
      dropId: options.dropId ?? 0,
      firstMomentContact: false,
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

  function removeMoment(body) {
    const index = momentBodies.indexOf(body);
    if (index >= 0) momentBodies.splice(index, 1);
    Composite.remove(engine.world, body);
  }

  function addMoment(body) {
    momentBodies.push(body);
    Composite.add(engine.world, body);
  }

  function rebuildWalls() {
    if (walls.length) Composite.remove(engine.world, walls);
    walls = [
      Bodies.rectangle(-11, worldHeight / 2, 24, 1800, { isStatic: true, label: "wm-wall-left", friction: 0.09 }),
      Bodies.rectangle(WORLD_WIDTH + 11, worldHeight / 2, 24, 1800, { isStatic: true, label: "wm-wall-right", friction: 0.09 }),
      Bodies.rectangle(WORLD_WIDTH / 2, worldHeight + 11, WORLD_WIDTH + 48, 24, { isStatic: true, label: "wm-floor", friction: 0.2 })
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
    const currentRadius = moments[currentTier]?.radius || moments[0].radius;
    dropX = Math.max(currentRadius, Math.min(WORLD_WIDTH - currentRadius, dropX));
    if (changed || !walls.length) {
      rebuildWalls();
      const floorDelta = worldHeight - previousHeight;
      momentBodies.forEach((body) => {
        const data = bodyMoment(body);
        const radius = moments[data.tier].radius;
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
      if (momentBodies.length) safeSnapshot = null;
    }
    drawFrame(performance.now());
  }

  function collisionKey(other) {
    return other.id || other.label;
  }

  function registerContact(body, other) {
    const data = bodyMoment(body);
    if (!data) return;
    data.contacts.add(collisionKey(other));
    const otherMoment = bodyMoment(other);
    if (!otherMoment || data.firstMomentContact || data.dropId <= 0) return;
    data.firstMomentContact = true;
    data.precisionTargetId = otherMoment.tier === data.tier && simulationTime - data.releasedAt <= PRECISION_WINDOW
      ? otherMoment.id
      : null;
  }

  function releaseContact(body, other) {
    bodyMoment(body)?.contacts.delete(collisionKey(other));
  }

  Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
      const first = pair.bodyA;
      const second = pair.bodyB;
      registerContact(first, second);
      registerContact(second, first);
      const firstData = bodyMoment(first);
      const secondData = bodyMoment(second);
      if (firstData && secondData && firstData.tier === secondData.tier && !firstData.merging && !secondData.merging) {
        pendingPairs.push([first, second]);
      }
    });
  });

  Events.on(engine, "collisionEnd", (event) => {
    event.pairs.forEach((pair) => {
      releaseContact(pair.bodyA, pair.bodyB);
      releaseContact(pair.bodyB, pair.bodyA);
    });
  });

  function rememberEvent(key, id) {
    lastRewardIds[key] = id;
  }

  function setAtmosphere(tier, announce = false) {
    highestTier = Math.max(highestTier, tier);
    const nextScene = rules.sceneForTier(highestTier);
    if (nextScene.id === activeScene.id) return;
    activeScene = nextScene;
    const sceneIndex = rules.SCENES.findIndex((scene) => scene.id === activeScene.id);
    stage.dataset.scene = activeScene.id;
    sceneNameNode.textContent = activeScene.name;
    sceneChapterNode.textContent = String(sceneIndex + 1).padStart(2, "0");
    screenFlash = Math.max(screenFlash, 0.18);
    if (announce) statusNode.textContent = `夜色抵达 · ${activeScene.name}`;
    syncAdaptiveAudio();
  }

  function discoverMoment(tier, source = "merge") {
    setAtmosphere(tier, true);
    const moment = moments[tier];
    if (!discoveredTiers.has(tier)) {
      discoveredTiers.add(tier);
      persistDiscoveries();
      const event = rules.pickUnlockEvent(tier, eventRandom);
      queueCinematic(event, tier, false);
      statusNode.textContent = `${moment.name} · 第一次收藏`;
      return true;
    }
    if (source === "merge") {
      const reward = rules.pickMergeReward(tier, eventRandom, lastRewardIds[tier] || null);
      rememberEvent(tier, reward.id);
      showToast(reward.copy);
    }
    return false;
  }

  function revealSecretCombination() {
    const event = rules.pickSecretCombination(eventRandom, lastSecretEventId);
    lastSecretEventId = event.id;
    if (!secretDiscovered) {
      secretDiscovered = true;
      writeStorage(SECRET_DISCOVERY_KEY, "1");
      queueCinematic(event, moments.length - 1, true);
    } else {
      showToast(event.line, 1900);
    }
    statusNode.textContent = `秘密组合 · 第 ${secretCount} 次只属于彼此`;
  }

  function mergeBodies(first, second) {
    const firstData = bodyMoment(first);
    const secondData = bodyMoment(second);
    if (!firstData || !secondData || firstData.merging || secondData.merging || firstData.tier !== secondData.tier) return;
    if (!momentBodies.includes(first) || !momentBodies.includes(second)) return;
    firstData.merging = true;
    secondData.merging = true;
    const tier = firstData.tier;
    const x = (first.position.x + second.position.x) / 2;
    const y = (first.position.y + second.position.y) / 2;
    const precise = firstData.precisionTargetId === secondData.id
      || secondData.precisionTargetId === firstData.id;
    const result = rules.scoreMerge(scoreState, {
      tier,
      timestamp: simulationTime,
      precise,
      marks: [firstData.mark, secondData.mark]
    });
    scoreState = result.state;
    removeMoment(first);
    removeMoment(second);
    const effectTier = result.secretCombination ? tier : result.resultTier;
    createMomentBurst(x, y, effectTier, result.mutualResponse || result.secretCombination, result.secretCombination);
    playMergeAudio(tier, result);
    vibrate(result.secretCombination ? [20, 34, 26, 46, 18] : result.mutualResponse ? [10, 22, 10] : 10);
    showCombo(result);

    if (result.secretCombination) {
      secretCount += 1;
      writeStorage(SECRET_COUNT_KEY, secretCount);
      revealSecretCombination();
    } else {
      const target = moments[result.resultTier];
      const mutual = firstData.mark !== secondData.mark;
      const mark = mutual ? nextMark() : oppositeMark(firstData.mark);
      const velocity = {
        x: (first.velocity.x + second.velocity.x) * 0.32,
        y: Math.min(1.1, (first.velocity.y + second.velocity.y) * 0.2 - target.physics.lift)
      };
      const next = createMomentBody(result.resultTier, x, y, mark, { velocity, bumpMs: 460 });
      const spinDirection = mark === responseMarks[0].id ? 1 : -1;
      Body.setAngularVelocity(next, target.physics.spin * spinDirection);
      addMoment(next);
      discoverMoment(result.resultTier, "merge");
      if (precise && !result.mutualResponse) showToast(`准确相遇 · ${target.mergeBehavior}`);
    }
    updateHud();
  }

  function processPendingMerges() {
    if (!pendingPairs.length) return;
    const pairs = pendingPairs;
    pendingPairs = [];
    const consumed = new Set();
    pairs
      .sort((left, right) => bodyMoment(right[0]).tier - bodyMoment(left[0]).tier)
      .forEach(([first, second]) => {
        if (consumed.has(first.id) || consumed.has(second.id)) return;
        const firstData = bodyMoment(first);
        const secondData = bodyMoment(second);
        if (!firstData || !secondData || firstData.tier !== secondData.tier) return;
        consumed.add(first.id);
        consumed.add(second.id);
        mergeBodies(first, second);
      });
  }

  function updateContactsAndDanger() {
    let longestDanger = 0;
    momentBodies.forEach((body) => {
      const data = bodyMoment(body);
      const touching = data.contacts.size > 0 && body.speed < 0.58 && body.angularSpeed < 0.055;
      data.contactState = rules.settleContact(data.contactState, touching, simulationTime, CONTACT_SETTLE);
      const eligible = rules.isDangerEligible({
        released: true,
        aboveLine: body.bounds.min.y < DANGER_Y,
        held: false,
        merging: data.merging,
        removed: !momentBodies.includes(body),
        contact: data.contactState
      });
      if (eligible) {
        data.dangerSince ??= simulationTime;
        longestDanger = Math.max(longestDanger, simulationTime - data.dangerSince);
      } else {
        data.dangerSince = null;
      }
    });
    if (longestDanger > 0) statusNode.textContent = longestDanger > 900 ? "心事快要装满" : "回忆正在上涌";
    if (longestDanger >= DANGER_HOLD) finishGame();
  }

  function snapshotPayload() {
    return {
      bodies: momentBodies.map((body) => {
        const data = bodyMoment(body);
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
      eventRngState: eventRandom.getState(),
      dropX,
      highestTier,
      lastRewardIds: { ...lastRewardIds },
      lastSecretEventId
    };
  }

  function captureSafeSnapshot() {
    if (simulationTime - lastSnapshotAt < 1100 || gameOver || paused || cinematicBlocking()) return;
    const safe = momentBodies.every((body) => {
      const data = bodyMoment(body);
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
    momentBodies.slice().forEach(removeMoment);
    scoreState = snapshot.scoreState;
    queueState = snapshot.queueState;
    currentTier = snapshot.currentTier;
    currentMark = snapshot.currentMark;
    markRandom = rules.createRng(snapshot.markRngState);
    eventRandom = rules.createRng(snapshot.eventRngState);
    dropX = snapshot.dropX;
    highestTier = snapshot.highestTier;
    lastRewardIds = { ...snapshot.lastRewardIds };
    lastSecretEventId = snapshot.lastSecretEventId;
    snapshot.bodies.forEach((item) => {
      const radius = moments[item.tier].radius;
      addMoment(createMomentBody(
        item.tier,
        Math.max(radius + 2, Math.min(WORLD_WIDTH - radius - 2, item.x)),
        Math.max(DANGER_Y + radius + 12, Math.min(worldHeight - radius - 8, item.y)),
        item.mark,
        { angle: item.angle, releasedAt: simulationTime - 1000 }
      ));
    });
    activeScene = rules.sceneForTier(highestTier);
    const sceneIndex = rules.SCENES.findIndex((scene) => scene.id === activeScene.id);
    stage.dataset.scene = activeScene.id;
    sceneNameNode.textContent = activeScene.name;
    sceneChapterNode.textContent = String(sceneIndex + 1).padStart(2, "0");
    revived = true;
    gameOver = false;
    paused = false;
    dropReady = true;
    resultSheet.hidden = true;
    statusNode.textContent = "上一刻仍然来得及";
    updateHud();
    vibrate([14, 34, 14]);
  }

  function finishGame() {
    if (gameOver) return;
    gameOver = true;
    paused = true;
    const rounded = Math.round(scoreState.score);
    resultScore.textContent = String(rounded);
    resultCopy.textContent = secretCount
      ? `你收藏过 ${secretCount} 次只属于彼此的秘密。`
      : "有些靠近，已经被好好记住。";
    reviveButton.hidden = revived || !safeSnapshot;
    resultSheet.hidden = false;
    statusNode.textContent = "这一夜已经装满";
    vibrate([28, 50, 28]);
    if (!dispatchHeartbeat("overflow", { score: rounded, scene: activeScene.id })) {
      tone(145, 0.3, "triangle", 0.05, 0.78);
    }
  }

  function dropCurrent() {
    if (!dropReady || paused || gameOver || cinematicBlocking()) return;
    const droppedTier = currentTier;
    const droppedMark = currentMark;
    const radius = moments[droppedTier].radius;
    dropX = Math.max(radius + 3, Math.min(WORLD_WIDTH - radius - 3, dropX));
    const body = createMomentBody(droppedTier, dropX, DROP_Y, droppedMark, {
      releasedAt: simulationTime,
      dropId: ++dropSequence
    });
    addMoment(body);
    dropReady = false;
    nextDropAt = simulationTime + 410;
    playDropAudio(droppedTier);
    takeCurrent();
    if (!discoveredTiers.has(droppedTier)) discoverMoment(droppedTier, "drop");
  }

  function advanceHeldMoment() {
    if (!pointerState || pointerState.moved || paused || gameOver || cinematicBlocking()) return;
    const result = rules.useCourage(scoreState, currentTier, true);
    if (!result.advanced) return;
    scoreState = result.state;
    currentTier = result.tier;
    pointerState.advanced = true;
    showToast(`勇气抵达 · ${moments[currentTier].name}`, 1450);
    statusNode.textContent = "这一刻被勇气推近";
    createMomentBurst(dropX, DROP_Y, currentTier, true, false);
    updateHud();
    playCourageAudio(currentTier);
    vibrate([12, 28, 12]);
  }

  function pointerToWorld(event) {
    const rect = canvas.getBoundingClientRect();
    return (event.clientX - rect.left) / canvasScale;
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (paused || gameOver || !dropReady || cinematicBlocking()) return;
    event.preventDefault();
    ensureAudio();
    syncAdaptiveAudio();
    canvas.setPointerCapture?.(event.pointerId);
    const radius = moments[currentTier].radius;
    dropX = Math.max(radius + 3, Math.min(WORLD_WIDTH - radius - 3, pointerToWorld(event)));
    pointerState = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      pressedAt: performance.now(),
      moved: false,
      advanced: false
    };
    clearTimeout(holdTimer);
    holdTimer = window.setTimeout(advanceHeldMoment, COURAGE_HOLD_MS);
  }, { passive: false });

  canvas.addEventListener("pointermove", (event) => {
    if (!pointerState || event.pointerId !== pointerState.id) return;
    event.preventDefault();
    const distance = Math.hypot(event.clientX - pointerState.startX, event.clientY - pointerState.startY);
    if (distance > 8) {
      pointerState.moved = true;
      clearTimeout(holdTimer);
    }
    const radius = moments[currentTier].radius;
    dropX = Math.max(radius + 3, Math.min(WORLD_WIDTH - radius - 3, pointerToWorld(event)));
  }, { passive: false });

  function releasePointer(event, shouldDrop) {
    if (!pointerState || event.pointerId !== pointerState.id) return;
    clearTimeout(holdTimer);
    if (shouldDrop) {
      const radius = moments[currentTier].radius;
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

  canvas.addEventListener("keydown", (event) => {
    if (paused || gameOver || !dropReady || cinematicBlocking()) return;
    const radius = moments[currentTier].radius;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      dropX = Math.max(radius + 3, Math.min(WORLD_WIDTH - radius - 3, dropX + direction * 13));
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      ensureAudio();
      dropCurrent();
    }
  });

  function togglePause(force) {
    if (gameOver) return;
    paused = force === undefined ? !paused : Boolean(force);
    pauseSheet.hidden = !paused;
    setButtonGlyph(pauseButton, paused ? "▶" : "Ⅱ");
    pauseButton.setAttribute("aria-label", paused ? "继续游戏" : "暂停游戏");
    statusNode.textContent = paused ? "这一刻暂停" : activeScene.name;
    if (!paused) {
      lastFrameAt = performance.now();
      accumulator = 0;
    }
  }

  function resetGame() {
    clearTimeout(holdTimer);
    clearTimeout(cinematicTimer);
    cinematicQueue = [];
    momentBodies.slice().forEach(removeMoment);
    runSeed = seedForRun();
    queueState = rules.createQueue(runSeed, 3);
    scoreState = rules.createScoreState();
    markRandom = rules.createRng(runSeed ^ 0x9e3779b9);
    eventRandom = rules.createRng(runSeed ^ 0x7f4a7c15);
    currentTier = 0;
    currentMark = responseMarks[0].id;
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
    particles = [];
    rings = [];
    pendingPairs = [];
    pointerState = null;
    lastRewardIds = Object.create(null);
    lastSecretEventId = null;
    highestTier = 0;
    activeScene = rules.sceneForTier(0);
    stage.dataset.scene = activeScene.id;
    sceneNameNode.textContent = activeScene.name;
    sceneChapterNode.textContent = "01";
    pauseSheet.hidden = true;
    resultSheet.hidden = true;
    cinematic.hidden = true;
    setButtonGlyph(pauseButton, "Ⅱ");
    pauseButton.setAttribute("aria-label", "暂停游戏");
    takeCurrent();
    safeSnapshot = rules.serializeSnapshot(snapshotPayload());
    statusNode.textContent = "故事从一次余光开始";
    updateHud();
  }

  document.querySelector("#wm-restart").addEventListener("click", resetGame);
  document.querySelector("#wm-restart-result").addEventListener("click", resetGame);
  document.querySelector("#wm-resume").addEventListener("click", () => togglePause(false));
  document.querySelector("#wm-event-close").addEventListener("click", finishCinematic);
  reviveButton.addEventListener("click", restoreSnapshot);
  pauseButton.addEventListener("click", () => togglePause());
  soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    setButtonGlyph(soundButton, soundEnabled ? "♪" : "×");
    soundButton.setAttribute("aria-label", soundEnabled ? "关闭声音" : "开启声音");
    try {
      heartbeatAudio?.setMuted?.(!soundEnabled);
    } catch {
      heartbeatAudio = null;
    }
    if (soundEnabled) {
      ensureAudio();
      syncAdaptiveAudio();
      tone(440, 0.08, "sine", 0.03, 1.06);
    }
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

  function momentGradient(ctx, radius, palette) {
    const gradient = ctx.createRadialGradient(-radius * 0.34, -radius * 0.42, radius * 0.06, 0, 0, radius * 1.08);
    gradient.addColorStop(0, palette[2]);
    gradient.addColorStop(0.5, palette[0]);
    gradient.addColorStop(1, palette[1]);
    return gradient;
  }

  function drawMomentBase(ctx, radius, palette) {
    ctx.save();
    ctx.shadowColor = "rgba(5, 8, 14, 0.42)";
    ctx.shadowBlur = Math.max(5, radius * 0.22);
    ctx.shadowOffsetY = Math.max(2, radius * 0.1);
    ctx.fillStyle = momentGradient(ctx, radius, palette);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.94, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
    ctx.lineWidth = Math.max(0.7, radius * 0.022);
    ctx.stroke();
    ctx.restore();
  }

  function drawMaterialTexture(ctx, moment, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = 0.13;
    ctx.strokeStyle = moment.palette[2];
    ctx.fillStyle = moment.palette[2];
    ctx.lineWidth = Math.max(0.55, radius * 0.012);
    if (moment.model === "glance" || moment.model === "approach") {
      for (let index = -4; index <= 4; index += 1) {
        ctx.beginPath();
        ctx.moveTo(-radius, index * radius * 0.22);
        ctx.lineTo(radius, index * radius * 0.22 - radius * 0.55);
        ctx.stroke();
      }
    } else if (moment.model === "chat") {
      for (let index = 0; index < 16; index += 1) {
        const x = ((index * 19) % 13 - 6) * radius * 0.13;
        const y = ((index * 11) % 15 - 7) * radius * 0.12;
        ctx.fillRect(x, y, Math.max(0.7, radius * 0.025), Math.max(0.7, radius * 0.025));
      }
    } else if (moment.model === "earbuds") {
      for (let index = -4; index <= 4; index += 1) {
        ctx.beginPath();
        ctx.moveTo(index * radius * 0.18, -radius);
        ctx.lineTo(index * radius * 0.18 + radius * 0.3, radius);
        ctx.stroke();
      }
    } else if (["ticket", "letter", "photo"].includes(moment.model)) {
      for (let index = -5; index <= 5; index += 1) {
        ctx.beginPath();
        ctx.moveTo(-radius, index * radius * 0.18);
        ctx.quadraticCurveTo(0, index * radius * 0.18 + radius * 0.04, radius, index * radius * 0.18);
        ctx.stroke();
      }
    } else if (["hands", "embrace"].includes(moment.model)) {
      for (let index = -7; index <= 7; index += 1) {
        ctx.beginPath();
        ctx.moveTo(-radius, index * radius * 0.14);
        ctx.lineTo(radius, index * radius * 0.14 + radius * 0.34);
        ctx.stroke();
      }
    } else if (moment.model === "keepsake") {
      for (let index = -5; index <= 5; index += 1) {
        ctx.beginPath();
        ctx.arc(index * radius * 0.2, 0, radius * 0.72, -Math.PI * 0.62, Math.PI * 0.62);
        ctx.stroke();
      }
    } else if (moment.model === "secret") {
      for (let index = 0; index < 14; index += 1) {
        const angle = index * 2.37;
        const distance = radius * (0.18 + (index % 5) * 0.14);
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, Math.max(0.7, radius * 0.014), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawGlance(ctx, radius, palette) {
    ctx.fillStyle = "rgba(248, 250, 239, 0.9)";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.72, 0);
    ctx.quadraticCurveTo(0, -radius * 0.62, radius * 0.72, 0);
    ctx.quadraticCurveTo(0, radius * 0.58, -radius * 0.72, 0);
    ctx.fill();
    ctx.strokeStyle = palette[1];
    ctx.lineWidth = Math.max(0.9, radius * 0.07);
    ctx.stroke();
    ctx.fillStyle = palette[1];
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#172b35";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-radius * 0.09, -radius * 0.1, radius * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawChat(ctx, radius, palette) {
    ctx.fillStyle = "rgba(239, 247, 255, 0.9)";
    roundedRect(ctx, -radius * 0.68, -radius * 0.46, radius * 1.34, radius * 0.92, radius * 0.25);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(radius * 0.26, radius * 0.4);
    ctx.lineTo(radius * 0.5, radius * 0.67);
    ctx.lineTo(radius * 0.54, radius * 0.29);
    ctx.fill();
    ctx.fillStyle = palette[1];
    [-0.31, 0, 0.31].forEach((offset) => {
      ctx.beginPath();
      ctx.arc(offset * radius, -radius * 0.02, radius * 0.09, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawApproach(ctx, radius, palette) {
    ctx.save();
    ctx.setLineDash([radius * 0.08, radius * 0.1]);
    ctx.strokeStyle = "rgba(240, 255, 239, 0.75)";
    ctx.lineWidth = Math.max(1, radius * 0.055);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.62, radius * 0.42);
    ctx.quadraticCurveTo(0, -radius * 0.08, radius * 0.62, radius * 0.42);
    ctx.stroke();
    ctx.restore();
    [[-0.38, -0.2, -0.25], [0.38, -0.2, 0.25]].forEach(([x, y, angle]) => {
      ctx.save();
      ctx.translate(x * radius, y * radius);
      ctx.rotate(angle);
      ctx.fillStyle = "rgba(245, 250, 221, 0.94)";
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.19, radius * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette[1];
      ctx.beginPath();
      ctx.arc(0, -radius * 0.04, radius * 0.055, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawEarbuds(ctx, radius, palette) {
    ctx.strokeStyle = "rgba(239, 245, 249, 0.9)";
    ctx.lineWidth = Math.max(1.3, radius * 0.065);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.36, -radius * 0.45);
    ctx.bezierCurveTo(-radius * 0.6, radius * 0.05, -radius * 0.2, radius * 0.62, 0, radius * 0.68);
    ctx.bezierCurveTo(radius * 0.2, radius * 0.62, radius * 0.6, radius * 0.05, radius * 0.36, -radius * 0.45);
    ctx.stroke();
    [-1, 1].forEach((direction) => {
      ctx.save();
      ctx.translate(direction * radius * 0.36, -radius * 0.39);
      ctx.rotate(direction * 0.18);
      ctx.fillStyle = "rgba(245, 248, 250, 0.96)";
      roundedRect(ctx, -radius * 0.17, -radius * 0.22, radius * 0.34, radius * 0.48, radius * 0.15);
      ctx.fill();
      ctx.fillStyle = palette[1];
      ctx.beginPath();
      ctx.arc(0, -radius * 0.03, radius * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.strokeStyle = palette[2];
    ctx.lineWidth = Math.max(0.8, radius * 0.03);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.18, Math.PI * 0.15, Math.PI * 1.35);
    ctx.stroke();
  }

  function drawTicket(ctx, radius, palette) {
    ctx.save();
    ctx.rotate(-0.12);
    ctx.fillStyle = "rgba(255, 240, 189, 0.95)";
    roundedRect(ctx, -radius * 0.72, -radius * 0.45, radius * 1.44, radius * 0.9, radius * 0.1);
    ctx.fill();
    ctx.fillStyle = palette[1];
    [-0.76, 0.76].forEach((x) => {
      ctx.beginPath();
      ctx.arc(x * radius, 0, radius * 0.17, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.save();
    ctx.setLineDash([radius * 0.07, radius * 0.07]);
    ctx.strokeStyle = palette[1];
    ctx.lineWidth = Math.max(0.8, radius * 0.028);
    ctx.beginPath();
    ctx.moveTo(radius * 0.28, -radius * 0.38);
    ctx.lineTo(radius * 0.28, radius * 0.38);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = palette[1];
    [-0.42, -0.28, -0.14].forEach((y, index) => {
      roundedRect(ctx, -radius * 0.5, y * radius, radius * (0.52 + index * 0.09), radius * 0.075, radius * 0.03);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawPhoto(ctx, radius, palette) {
    ctx.save();
    ctx.rotate(0.08);
    ctx.fillStyle = "rgba(255, 247, 224, 0.96)";
    roundedRect(ctx, -radius * 0.62, -radius * 0.72, radius * 1.24, radius * 1.44, radius * 0.08);
    ctx.fill();
    const picture = ctx.createLinearGradient(0, -radius * 0.58, 0, radius * 0.34);
    picture.addColorStop(0, palette[2]);
    picture.addColorStop(1, palette[0]);
    ctx.fillStyle = picture;
    ctx.fillRect(-radius * 0.5, -radius * 0.58, radius, radius * 0.88);
    [-1, 1].forEach((direction) => {
      ctx.fillStyle = direction < 0 ? palette[1] : "#426b68";
      ctx.beginPath();
      ctx.arc(direction * radius * 0.2, -radius * 0.18, radius * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(direction * radius * 0.2, radius * 0.15, radius * 0.27, radius * 0.32, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = palette[1];
    ctx.lineWidth = Math.max(0.9, radius * 0.025);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.22, radius * 0.52);
    ctx.quadraticCurveTo(0, radius * 0.4, radius * 0.22, radius * 0.52);
    ctx.stroke();
    ctx.restore();
  }

  function drawHands(ctx, radius, palette) {
    ctx.fillStyle = "rgba(87, 76, 103, 0.75)";
    ctx.beginPath();
    ctx.ellipse(-radius * 0.48, radius * 0.34, radius * 0.52, radius * 0.26, 0.45, 0, Math.PI * 2);
    ctx.ellipse(radius * 0.48, radius * 0.34, radius * 0.52, radius * 0.26, -0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 218, 190, 0.96)";
    ctx.beginPath();
    ctx.ellipse(-radius * 0.2, 0, radius * 0.46, radius * 0.25, 0.42, 0, Math.PI * 2);
    ctx.ellipse(radius * 0.2, 0, radius * 0.46, radius * 0.25, -0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = palette[1];
    ctx.lineWidth = Math.max(1, radius * 0.026);
    ctx.lineCap = "round";
    for (let index = -2; index <= 2; index += 1) {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.42, index * radius * 0.07 - radius * 0.05);
      ctx.quadraticCurveTo(0, index * radius * 0.09, radius * 0.42, index * radius * 0.07 + radius * 0.05);
      ctx.stroke();
    }
    ctx.strokeStyle = palette[2];
    ctx.lineWidth = Math.max(1.3, radius * 0.045);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.2, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }

  function drawEmbrace(ctx, radius, palette) {
    const glow = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius * 0.74);
    glow.addColorStop(0, "rgba(255, 232, 220, 0.72)");
    glow.addColorStop(1, "rgba(255, 232, 220, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.82, 0, Math.PI * 2);
    ctx.fill();
    [-1, 1].forEach((direction) => {
      ctx.fillStyle = direction < 0 ? "#77445f" : "#426b70";
      ctx.beginPath();
      ctx.arc(direction * radius * 0.2, -radius * 0.28, radius * 0.19, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(direction * radius * 0.17, radius * 0.21, radius * 0.36, radius * 0.54, direction * -0.14, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = "rgba(255, 224, 205, 0.92)";
    ctx.lineWidth = Math.max(2, radius * 0.085);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, radius * 0.05, radius * 0.48, Math.PI * 0.1, Math.PI * 0.9);
    ctx.arc(0, radius * 0.05, radius * 0.48, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.strokeStyle = palette[2];
    ctx.lineWidth = Math.max(0.8, radius * 0.02);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawLetter(ctx, radius, palette) {
    ctx.save();
    ctx.rotate(-0.05);
    ctx.fillStyle = "rgba(255, 239, 216, 0.96)";
    roundedRect(ctx, -radius * 0.68, -radius * 0.47, radius * 1.36, radius * 0.94, radius * 0.08);
    ctx.fill();
    ctx.strokeStyle = palette[1];
    ctx.lineWidth = Math.max(1, radius * 0.025);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.62, -radius * 0.38);
    ctx.lineTo(0, radius * 0.1);
    ctx.lineTo(radius * 0.62, -radius * 0.38);
    ctx.moveTo(-radius * 0.62, radius * 0.38);
    ctx.lineTo(-radius * 0.12, -radius * 0.02);
    ctx.moveTo(radius * 0.62, radius * 0.38);
    ctx.lineTo(radius * 0.12, -radius * 0.02);
    ctx.stroke();
    ctx.fillStyle = palette[0];
    ctx.beginPath();
    ctx.arc(0, radius * 0.11, radius * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 235, 220, 0.95)";
    ctx.beginPath();
    ctx.moveTo(0, radius * 0.2);
    ctx.bezierCurveTo(-radius * 0.21, radius * 0.06, -radius * 0.16, -radius * 0.07, 0, radius * 0.04);
    ctx.bezierCurveTo(radius * 0.16, -radius * 0.07, radius * 0.21, radius * 0.06, 0, radius * 0.2);
    ctx.fill();
    ctx.restore();
  }

  function drawKeepsake(ctx, radius, palette) {
    ctx.fillStyle = "#6f4f43";
    roundedRect(ctx, -radius * 0.66, -radius * 0.05, radius * 1.32, radius * 0.76, radius * 0.1);
    ctx.fill();
    ctx.save();
    ctx.translate(0, -radius * 0.18);
    ctx.rotate(-0.18);
    ctx.fillStyle = palette[0];
    roundedRect(ctx, -radius * 0.62, -radius * 0.48, radius * 1.24, radius * 0.45, radius * 0.08);
    ctx.fill();
    ctx.strokeStyle = palette[2];
    ctx.lineWidth = Math.max(1, radius * 0.025);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.rotate(0.13);
    ctx.fillStyle = "rgba(255, 244, 218, 0.96)";
    ctx.fillRect(-radius * 0.42, -radius * 0.13, radius * 0.53, radius * 0.61);
    ctx.fillStyle = "#879a9e";
    ctx.fillRect(-radius * 0.36, -radius * 0.07, radius * 0.41, radius * 0.32);
    ctx.restore();
    ctx.save();
    ctx.rotate(-0.18);
    ctx.fillStyle = "#efce78";
    roundedRect(ctx, radius * 0.02, radius * 0.03, radius * 0.48, radius * 0.27, radius * 0.04);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = palette[2];
    ctx.lineWidth = Math.max(1.1, radius * 0.03);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.45, radius * 0.56);
    ctx.quadraticCurveTo(0, radius * 0.68, radius * 0.45, radius * 0.56);
    ctx.stroke();
  }

  function drawSecret(ctx, radius, palette) {
    const doorway = ctx.createLinearGradient(0, -radius * 0.66, 0, radius * 0.64);
    doorway.addColorStop(0, "rgba(243, 216, 149, 0.86)");
    doorway.addColorStop(1, "rgba(99, 77, 117, 0.62)");
    ctx.fillStyle = doorway;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.47, radius * 0.61);
    ctx.lineTo(-radius * 0.47, -radius * 0.12);
    ctx.arc(0, -radius * 0.12, radius * 0.47, Math.PI, 0);
    ctx.lineTo(radius * 0.47, radius * 0.61);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(42, 34, 67, 0.76)";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.45, -radius * 0.5);
    ctx.quadraticCurveTo(-radius * 0.1, -radius * 0.08, -radius * 0.18, radius * 0.62);
    ctx.lineTo(-radius * 0.53, radius * 0.62);
    ctx.closePath();
    ctx.moveTo(radius * 0.45, -radius * 0.5);
    ctx.quadraticCurveTo(radius * 0.1, -radius * 0.08, radius * 0.18, radius * 0.62);
    ctx.lineTo(radius * 0.53, radius * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = palette[2];
    ctx.beginPath();
    ctx.arc(0, radius * 0.02, radius * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-radius * 0.055, radius * 0.08);
    ctx.lineTo(-radius * 0.12, radius * 0.35);
    ctx.lineTo(radius * 0.12, radius * 0.35);
    ctx.lineTo(radius * 0.055, radius * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(57, 45, 76, 0.86)";
    [-1, 1].forEach((direction) => {
      ctx.beginPath();
      ctx.arc(direction * radius * 0.1, radius * 0.43, radius * 0.09, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawResponseMark(ctx, radius, markId) {
    const mark = responseMarks.find((candidate) => candidate.id === markId) || responseMarks[0];
    const direction = mark.id === responseMarks[0].id ? -1 : 1;
    const badgeRadius = Math.min(10, Math.max(2.4, radius * 0.16));
    ctx.save();
    ctx.translate(direction * radius * 0.58, radius * 0.55);
    ctx.fillStyle = mark.color;
    ctx.strokeStyle = "rgba(255, 250, 240, 0.82)";
    ctx.lineWidth = Math.max(0.6, radius * 0.018);
    ctx.beginPath();
    ctx.arc(0, 0, badgeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (radius >= 17) {
      ctx.fillStyle = "#1d1c25";
      ctx.font = `800 ${Math.max(6, Math.min(10, radius * 0.17))}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(mark.glyph, 0, 0.4);
    }
    ctx.restore();
  }

  function drawMomentShape(ctx, tier, radius, mark) {
    const moment = moments[tier];
    drawMomentBase(ctx, radius, moment.palette);
    drawMaterialTexture(ctx, moment, radius);
    ctx.save();
    switch (moment.model) {
      case "glance": drawGlance(ctx, radius, moment.palette); break;
      case "chat": drawChat(ctx, radius, moment.palette); break;
      case "approach": drawApproach(ctx, radius, moment.palette); break;
      case "earbuds": drawEarbuds(ctx, radius, moment.palette); break;
      case "ticket": drawTicket(ctx, radius, moment.palette); break;
      case "photo": drawPhoto(ctx, radius, moment.palette); break;
      case "hands": drawHands(ctx, radius, moment.palette); break;
      case "embrace": drawEmbrace(ctx, radius, moment.palette); break;
      case "letter": drawLetter(ctx, radius, moment.palette); break;
      case "keepsake": drawKeepsake(ctx, radius, moment.palette); break;
      case "secret": drawSecret(ctx, radius, moment.palette); break;
      default: throw new Error(`Unknown moment model: ${moment.model}`);
    }
    ctx.restore();
    const gloss = ctx.createLinearGradient(-radius, -radius, radius, radius);
    gloss.addColorStop(0, "rgba(255,255,255,0.32)");
    gloss.addColorStop(0.3, "rgba(255,255,255,0.04)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.ellipse(-radius * 0.25, -radius * 0.45, radius * 0.23, radius * 0.1, -0.62, 0, Math.PI * 2);
    ctx.fill();
    drawResponseMark(ctx, radius, mark);
  }

  function drawMomentAt(ctx, tier, mark, x, y, radius, angle = 0, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    drawMomentShape(ctx, tier, radius, mark);
    ctx.restore();
  }

  function drawPreview(canvasNode, tier, mark) {
    const ctx = canvasNode.getContext("2d");
    const width = canvasNode.width;
    const height = canvasNode.height;
    ctx.clearRect(0, 0, width, height);
    const radius = Math.min(width, height) * 0.33;
    drawMomentAt(ctx, tier, mark, width / 2, height / 2 + 2, radius, 0, 1);
  }

  function drawPreviews() {
    if (!queueState) return;
    drawPreview(currentPreview, currentTier, currentMark);
    drawPreview(nextOnePreview, rules.peekQueue(queueState, 0), responseMarks[0].id);
    drawPreview(nextTwoPreview, rules.peekQueue(queueState, 1), responseMarks[1].id);
  }

  function drawEventMoment(tier) {
    const ctx = eventCanvas.getContext("2d");
    ctx.clearRect(0, 0, eventCanvas.width, eventCanvas.height);
    const mark = tier % 2 ? responseMarks[1].id : responseMarks[0].id;
    drawMomentAt(ctx, tier, mark, eventCanvas.width / 2, eventCanvas.height / 2, 122, -0.035, 1);
  }

  function createMomentBurst(x, y, tier, strong = false, secret = false) {
    const moment = moments[tier];
    const count = strong ? 24 : 11 + Math.min(9, tier);
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (strong ? 1.6 : 1.05) + Math.random() * (strong ? 2.8 : 1.7);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.75,
        life: 1,
        size: 1.5 + Math.random() * (strong ? 4.6 : 3.1),
        color: moment.palette[index % moment.palette.length],
        kind: secret ? "secret" : moment.effect,
        turn: Math.random() * Math.PI * 2
      });
    }
    rings.push({
      x,
      y,
      radius: moment.radius * 0.42,
      life: 1,
      color: moment.palette[2],
      dashed: ["orbit", "thread", "secret"].includes(moment.effect)
    });
    screenFlash = Math.max(screenFlash, strong ? 0.28 : 0.1);
    screenShake = Math.max(screenShake, secret ? 5.5 : strong ? 3 : tier > 7 ? 2.1 : 1.1);
  }

  function drawParticle(ctx, particle) {
    const size = particle.size;
    ctx.save();
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.turn);
    ctx.fillStyle = particle.color;
    ctx.strokeStyle = particle.color;
    ctx.lineWidth = Math.max(0.7, size * 0.35);
    if (particle.kind === "glint" || particle.kind === "flash") {
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.5);
      ctx.lineTo(size * 0.35, -size * 0.35);
      ctx.lineTo(size * 1.5, 0);
      ctx.lineTo(size * 0.35, size * 0.35);
      ctx.lineTo(0, size * 1.5);
      ctx.lineTo(-size * 0.35, size * 0.35);
      ctx.lineTo(-size * 1.5, 0);
      ctx.lineTo(-size * 0.35, -size * 0.35);
      ctx.closePath();
      ctx.fill();
    } else if (particle.kind === "bubble" || particle.kind === "halo") {
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (particle.kind === "orbit") {
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.5, -0.7, 0.7);
      ctx.stroke();
    } else if (particle.kind === "note") {
      ctx.beginPath();
      ctx.arc(-size * 0.3, size * 0.7, size * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(size * 0.2, size * 0.6);
      ctx.lineTo(size * 0.2, -size * 1.2);
      ctx.lineTo(size * 0.9, -size * 0.8);
      ctx.stroke();
    } else if (["paper", "letter", "memory"].includes(particle.kind)) {
      roundedRect(ctx, -size * 0.85, -size * 0.55, size * 1.7, size * 1.1, size * 0.12);
      ctx.fill();
      if (particle.kind === "letter") {
        ctx.strokeStyle = "rgba(72, 39, 52, 0.5)";
        ctx.beginPath();
        ctx.moveTo(-size * 0.7, -size * 0.4);
        ctx.lineTo(0, size * 0.12);
        ctx.lineTo(size * 0.7, -size * 0.4);
        ctx.stroke();
      }
    } else if (particle.kind === "thread") {
      ctx.beginPath();
      ctx.moveTo(-size * 1.5, 0);
      ctx.bezierCurveTo(-size * 0.5, -size, size * 0.5, size, size * 1.5, 0);
      ctx.stroke();
    } else if (particle.kind === "secret") {
      ctx.beginPath();
      ctx.arc(0, -size * 0.32, size * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-size * 0.3, 0);
      ctx.lineTo(-size * 0.58, size * 1.1);
      ctx.lineTo(size * 0.58, size * 1.1);
      ctx.lineTo(size * 0.3, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles(ctx) {
    particles.forEach((particle) => drawParticle(ctx, particle));
    rings.forEach((ring) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ring.life) * 0.65;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 1.6;
      if (ring.dashed) ctx.setLineDash([4, 5]);
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
      particle.vy += 0.075 * frame;
      particle.vx *= 0.986;
      particle.turn += 0.055 * frame;
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

  function drawDistantCity(ctx, height, horizon, color = "rgba(14, 22, 29, 0.8)") {
    ctx.fillStyle = color;
    const buildings = [
      [0, 48, 42], [36, 70, 64], [91, 40, 52], [126, 59, 78],
      [178, 51, 56], [223, 77, 72], [287, 42, 47], [321, 55, 68]
    ];
    buildings.forEach(([x, width, rise]) => ctx.fillRect(x, horizon - rise, width, rise + height - horizon));
    ctx.fillStyle = "rgba(245, 200, 123, 0.34)";
    buildings.forEach(([x, width, rise], buildingIndex) => {
      for (let row = 0; row < 3; row += 1) {
        const windowY = horizon - rise + 10 + row * 14;
        if (windowY > horizon - 4) continue;
        for (let column = 0; column < 3; column += 1) {
          if ((row + column + buildingIndex) % 3 === 0) continue;
          const windowX = x + 8 + column * Math.max(9, (width - 15) / 3);
          ctx.fillRect(windowX, windowY, 3, 5);
        }
      }
    });
  }

  function drawPlatformScene(ctx, height) {
    const horizon = Math.max(174, height * 0.32);
    drawDistantCity(ctx, height, horizon, "rgba(18, 35, 39, 0.78)");
    ctx.strokeStyle = "rgba(231, 218, 190, 0.33)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 28);
    ctx.quadraticCurveTo(WORLD_WIDTH / 2, 52, WORLD_WIDTH, 24);
    ctx.moveTo(52, 0);
    ctx.lineTo(52, horizon + 18);
    ctx.moveTo(316, 0);
    ctx.lineTo(316, horizon + 18);
    ctx.stroke();
    ctx.fillStyle = "rgba(24, 34, 38, 0.82)";
    ctx.fillRect(35, horizon - 48, 126, 5);
    ctx.fillRect(40, horizon - 45, 5, 73);
    ctx.fillRect(151, horizon - 45, 5, 73);
    ctx.fillStyle = "rgba(190, 225, 221, 0.11)";
    ctx.fillRect(45, horizon - 40, 106, 65);
    ctx.fillStyle = "rgba(238, 196, 116, 0.7)";
    roundedRect(ctx, 66, horizon - 31, 38, 17, 2);
    ctx.fill();
    ctx.fillStyle = "rgba(18, 25, 29, 0.85)";
    ctx.fillRect(213, horizon + 20, 78, 8);
    ctx.fillRect(220, horizon + 27, 5, 25);
    ctx.fillRect(279, horizon + 27, 5, 25);
    ctx.strokeStyle = "rgba(246, 220, 170, 0.45)";
    ctx.beginPath();
    ctx.moveTo(0, horizon + 60);
    ctx.lineTo(WORLD_WIDTH, horizon + 60);
    ctx.stroke();
  }

  function drawWalkScene(ctx, height) {
    const horizon = Math.max(168, height * 0.3);
    drawDistantCity(ctx, height, horizon, "rgba(14, 27, 39, 0.86)");
    ctx.fillStyle = "rgba(11, 19, 28, 0.74)";
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(82, horizon + 18);
    ctx.lineTo(283, horizon + 18);
    ctx.lineTo(WORLD_WIDTH, height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(241, 206, 131, 0.48)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(WORLD_WIDTH / 2, horizon + 44);
    ctx.lineTo(WORLD_WIDTH / 2, height);
    ctx.stroke();
    [52, 312].forEach((x, index) => {
      ctx.strokeStyle = "rgba(34, 45, 48, 0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, horizon - 22);
      ctx.lineTo(x, height * 0.63);
      ctx.stroke();
      ctx.fillStyle = index ? "#efaa67" : "#eed27e";
      ctx.beginPath();
      ctx.arc(x, horizon - 27, 7, 0, Math.PI * 2);
      ctx.fill();
      const glow = ctx.createRadialGradient(x, horizon - 27, 2, x, horizon - 27, 32);
      glow.addColorStop(0, "rgba(246, 202, 116, 0.2)");
      glow.addColorStop(1, "rgba(246, 202, 116, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, horizon - 27, 32, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawCinemaScene(ctx, height) {
    const horizon = Math.max(178, height * 0.33);
    drawDistantCity(ctx, height, horizon, "rgba(21, 17, 31, 0.86)");
    ctx.fillStyle = "rgba(39, 25, 42, 0.93)";
    ctx.fillRect(42, horizon - 104, 281, 128);
    ctx.fillStyle = "rgba(205, 78, 98, 0.88)";
    ctx.fillRect(29, horizon - 102, 307, 25);
    ctx.fillStyle = "rgba(255, 226, 143, 0.9)";
    for (let index = 0; index < 12; index += 1) {
      ctx.beginPath();
      ctx.arc(39 + index * 26, horizon - 90, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(248, 219, 171, 0.75)";
    roundedRect(ctx, 108, horizon - 65, 149, 25, 3);
    ctx.fill();
    ctx.fillStyle = "rgba(31, 27, 39, 0.8)";
    for (let index = 0; index < 5; index += 1) ctx.fillRect(126 + index * 24, horizon - 57, 13, 3);
    ctx.fillStyle = "rgba(123, 168, 169, 0.14)";
    ctx.fillRect(61, horizon - 32, 243, 53);
    ctx.strokeStyle = "rgba(242, 210, 154, 0.22)";
    ctx.lineWidth = 1;
    for (let index = 0; index < 7; index += 1) {
      ctx.beginPath();
      ctx.moveTo(index * 62 - 20, height);
      ctx.lineTo(172, horizon + 24);
      ctx.stroke();
    }
  }

  function drawRainScene(ctx, height) {
    const horizon = Math.max(170, height * 0.31);
    drawDistantCity(ctx, height, horizon, "rgba(12, 27, 38, 0.88)");
    ctx.strokeStyle = "rgba(187, 220, 229, 0.25)";
    ctx.lineWidth = 0.75;
    for (let index = 0; index < 42; index += 1) {
      const x = (index * 53 + simulationTime * 0.07) % (WORLD_WIDTH + 40) - 20;
      const y = (index * 97 + simulationTime * 0.13) % Math.max(1, height - 40);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 5, y + 15);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(18, 25, 31, 0.92)";
    ctx.fillRect(0, horizon - 6, WORLD_WIDTH, 10);
    ctx.strokeStyle = "rgba(232, 214, 192, 0.34)";
    ctx.beginPath();
    ctx.moveTo(0, horizon + 78);
    ctx.quadraticCurveTo(84, horizon + 70, 166, horizon + 78);
    ctx.quadraticCurveTo(252, horizon + 86, WORLD_WIDTH, horizon + 76);
    ctx.stroke();
    ctx.fillStyle = "rgba(205, 102, 116, 0.42)";
    ctx.beginPath();
    ctx.arc(285, horizon + 33, 34, Math.PI, Math.PI * 2);
    ctx.lineTo(319, horizon + 33);
    ctx.closePath();
    ctx.fill();
  }

  function drawRoomScene(ctx, height, midnight = false) {
    ctx.fillStyle = midnight ? "rgba(26, 22, 42, 0.72)" : "rgba(55, 40, 51, 0.65)";
    ctx.fillRect(0, 0, WORLD_WIDTH, height);
    const windowX = 48;
    const windowY = 78;
    const windowWidth = 269;
    const windowHeight = Math.min(178, height * 0.3);
    const windowGradient = ctx.createLinearGradient(0, windowY, 0, windowY + windowHeight);
    windowGradient.addColorStop(0, midnight ? "#302f58" : "#5e536b");
    windowGradient.addColorStop(1, midnight ? "#111426" : "#8a5964");
    ctx.fillStyle = windowGradient;
    ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
    ctx.strokeStyle = "rgba(233, 220, 199, 0.38)";
    ctx.lineWidth = 4;
    ctx.strokeRect(windowX, windowY, windowWidth, windowHeight);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(WORLD_WIDTH / 2, windowY);
    ctx.lineTo(WORLD_WIDTH / 2, windowY + windowHeight);
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.rect(windowX, windowY, windowWidth, windowHeight);
    ctx.clip();
    drawDistantCity(ctx, windowY + windowHeight, windowY + windowHeight, "rgba(12, 16, 29, 0.75)");
    ctx.restore();
    if (midnight) {
      ctx.fillStyle = "rgba(242, 213, 139, 0.86)";
      ctx.beginPath();
      ctx.arc(260, 122, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#38365f";
      ctx.beginPath();
      ctx.arc(269, 115, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(33, 27, 50, 0.92)";
      ctx.beginPath();
      ctx.moveTo(34, 56);
      ctx.quadraticCurveTo(103, 135, 88, 292);
      ctx.lineTo(26, 292);
      ctx.closePath();
      ctx.moveTo(331, 56);
      ctx.quadraticCurveTo(262, 135, 277, 292);
      ctx.lineTo(339, 292);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = midnight ? "rgba(26, 22, 37, 0.94)" : "rgba(45, 34, 41, 0.94)";
    ctx.fillRect(0, windowY + windowHeight + 16, WORLD_WIDTH, height);
    ctx.fillStyle = "rgba(118, 79, 68, 0.84)";
    roundedRect(ctx, 82, height * 0.67, 201, 18, 4);
    ctx.fill();
    ctx.fillRect(96, height * 0.67 + 14, 8, 70);
    ctx.fillRect(261, height * 0.67 + 14, 8, 70);
    if (!midnight) {
      const lampGlow = ctx.createRadialGradient(288, height * 0.57, 3, 288, height * 0.57, 62);
      lampGlow.addColorStop(0, "rgba(245, 201, 125, 0.35)");
      lampGlow.addColorStop(1, "rgba(245, 201, 125, 0)");
      ctx.fillStyle = lampGlow;
      ctx.beginPath();
      ctx.arc(288, height * 0.57, 62, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(242, 193, 112, 0.86)";
      ctx.beginPath();
      ctx.moveTo(273, height * 0.57);
      ctx.lineTo(303, height * 0.57);
      ctx.lineTo(297, height * 0.62);
      ctx.lineTo(279, height * 0.62);
      ctx.closePath();
      ctx.fill();
    }
    [146, 205].forEach((x, index) => {
      ctx.fillStyle = index ? "rgba(127, 190, 183, 0.65)" : "rgba(222, 132, 141, 0.7)";
      roundedRect(ctx, x, height * 0.62, 28, 24, 4);
      ctx.fill();
    });
  }

  function drawScene(ctx, height) {
    const palette = activeScene.palette;
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, palette[0]);
    sky.addColorStop(0.4, palette[1]);
    sky.addColorStop(0.62, palette[2]);
    sky.addColorStop(0.63, palette[3]);
    sky.addColorStop(1, "#0b1016");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WORLD_WIDTH, height);

    if (activeScene.id === "platform") drawPlatformScene(ctx, height);
    else if (activeScene.id === "walk") drawWalkScene(ctx, height);
    else if (activeScene.id === "cinema") drawCinemaScene(ctx, height);
    else if (activeScene.id === "rain") drawRainScene(ctx, height);
    else if (activeScene.id === "room") drawRoomScene(ctx, height, false);
    else drawRoomScene(ctx, height, true);

    const floorShade = ctx.createLinearGradient(0, height * 0.68, 0, height);
    floorShade.addColorStop(0, "rgba(8, 12, 18, 0.02)");
    floorShade.addColorStop(1, "rgba(5, 8, 12, 0.74)");
    ctx.fillStyle = floorShade;
    ctx.fillRect(0, height * 0.68, WORLD_WIDTH, height * 0.32);

    ctx.save();
    ctx.setLineDash([5, 7]);
    ctx.strokeStyle = gameOver ? "rgba(244, 107, 128, 0.78)" : "rgba(246, 213, 174, 0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, DANGER_Y);
    ctx.lineTo(WORLD_WIDTH - 10, DANGER_Y);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "rgba(255, 240, 218, 0.62)";
    ctx.font = "700 7px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("心事线", WORLD_WIDTH - 13, DANGER_Y - 6);

    ctx.strokeStyle = "rgba(220, 232, 230, 0.22)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2, 91);
    ctx.lineTo(2, height - 3);
    ctx.quadraticCurveTo(2, height - 1, 5, height - 1);
    ctx.lineTo(WORLD_WIDTH - 5, height - 1);
    ctx.quadraticCurveTo(WORLD_WIDTH - 2, height - 1, WORLD_WIDTH - 2, height - 4);
    ctx.lineTo(WORLD_WIDTH - 2, 91);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, 94);
    ctx.lineTo(8, height - 8);
    ctx.moveTo(WORLD_WIDTH - 8, 94);
    ctx.lineTo(WORLD_WIDTH - 8, height - 8);
    ctx.stroke();

    const vignette = ctx.createRadialGradient(WORLD_WIDTH / 2, height * 0.45, height * 0.16, WORLD_WIDTH / 2, height * 0.5, height * 0.72);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(2, 4, 8, 0.36)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WORLD_WIDTH, height);
  }

  function drawSuspended(ctx, now) {
    if (!dropReady || paused || gameOver || cinematicBlocking()) return;
    const radius = moments[currentTier].radius;
    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = scoreState.courage === rules.RULES.maxCourage
      ? "rgba(244, 208, 116, 0.76)"
      : "rgba(241, 231, 220, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dropX, DROP_Y + radius + 5);
    ctx.lineTo(dropX, Math.min(worldHeight - 12, DROP_Y + 188));
    ctx.stroke();
    ctx.restore();
    const courageFull = scoreState.courage === rules.RULES.maxCourage;
    const pulse = courageFull ? 1 + Math.sin(now / 145) * 0.035 : 1;
    drawMomentAt(ctx, currentTier, currentMark, dropX, DROP_Y, radius, 0, pulse);
    if (courageFull) {
      const holdProgress = pointerState && !pointerState.moved
        ? Math.min(1, (now - pointerState.pressedAt) / COURAGE_HOLD_MS)
        : 0.08 + (Math.sin(now / 280) + 1) * 0.06;
      ctx.save();
      ctx.strokeStyle = "rgba(249, 210, 113, 0.9)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(dropX, DROP_Y, radius + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * holdProgress);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFrame(now) {
    if (!context || !canvas.width || !canvas.height) return;
    const pixelScale = dpr * canvasScale;
    const shakeX = screenShake ? (Math.random() - 0.5) * screenShake : 0;
    const shakeY = screenShake ? (Math.random() - 0.5) * screenShake : 0;
    context.setTransform(pixelScale, 0, 0, pixelScale, shakeX * pixelScale, shakeY * pixelScale);
    drawScene(context, worldHeight);
    momentBodies
      .slice()
      .sort((left, right) => bodyMoment(left).tier - bodyMoment(right).tier)
      .forEach((body) => {
        const data = bodyMoment(body);
        const bumpProgress = Math.max(0, (data.bumpUntil - simulationTime) / 460);
        const bounce = 1 + Math.sin((1 - bumpProgress) * Math.PI) * bumpProgress * 0.11;
        drawMomentAt(
          context,
          data.tier,
          data.mark,
          body.position.x,
          body.position.y,
          moments[data.tier].radius,
          body.angle,
          bounce
        );
      });
    drawSuspended(context, now);
    drawParticles(context);
    if (screenFlash > 0) {
      context.fillStyle = `rgba(255, 236, 204, ${screenFlash})`;
      context.fillRect(0, 0, WORLD_WIDTH, worldHeight);
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
  }

  function tick(now) {
    const elapsed = Math.max(0, now - lastFrameAt);
    const delta = Math.min(MAX_FRAME_DELTA, elapsed);
    lastFrameAt = now;
    if (!paused && !gameOver && !cinematicBlocking()) {
      accumulator = Math.min(MAX_BACKLOG, accumulator + delta);
      let steps = 0;
      while (accumulator >= STEP && steps < MAX_CATCHUP_STEPS) {
        Engine.update(engine, STEP);
        simulationTime += STEP;
        processPendingMerges();
        accumulator -= STEP;
        steps += 1;
        if (paused || gameOver || cinematicBlocking()) {
          accumulator = 0;
          break;
        }
        updateContactsAndDanger();
        if (paused || gameOver || cinematicBlocking()) {
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
  root.dataset.gameReady = "true";
  frameHandle = requestAnimationFrame(tick);

  let destroyed = false;
  function destroyGame() {
    if (destroyed) return;
    destroyed = true;
    clearTimeout(holdTimer);
    clearTimeout(cinematicTimer);
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
