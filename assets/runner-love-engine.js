(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.RunnerLoveEngine = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const LANES = Object.freeze([-1, 0, 1]);
  const ACTIONS = Object.freeze({ LEFT: "left", RIGHT: "right", JUMP: "jump", SLIDE: "slide" });
  const DEFAULT_STAGES = Object.freeze([
    { id: "meet", from: 0, modules: ["campus", "crosswalk"] },
    { id: "together", from: 0.34, modules: ["park", "cafe"] },
    { id: "promise", from: 0.68, modules: ["city", "starlight"] }
  ]);
  const DEFAULTS = Object.freeze({
    fixedStep: 1 / 60, maxFrame: 0.25, duration: 120, finaleSeconds: 20,
    startSpeed: 11, maxSpeed: 22, acceleration: 0.085, moduleLength: 36,
    spawnAhead: 90, despawnBehind: 5, collisionDepth: 0.85,
    laneChangeDuration: 0.16, jumpDuration: 0.76, jumpHeight: 1.9, slideDuration: 0.64,
    stumbleDuration: 0.62, invulnerabilityDuration: 1.05, collisionSpeedLoss: 3.2,
    responseWindow: 4, companionWindow: 2.5, stages: DEFAULT_STAGES
  });

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function lane(value) { return clamp(Math.round(Number(value) || 0), -1, 1); }
  function hashSeed(seed) {
    if (typeof seed === "number" && Number.isFinite(seed)) return seed >>> 0 || 1;
    const text = String(seed === undefined ? "runner-love" : seed);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    return hash >>> 0 || 1;
  }
  function nextRandom(state) {
    let x = state.randomState >>> 0;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    state.randomState = x >>> 0;
    return state.randomState / 4294967296;
  }
  function mergeConfig(options) {
    const config = { ...DEFAULTS, ...(options || {}) };
    config.stages = (options && options.stages ? options.stages : DEFAULT_STAGES).map((item) => ({
      ...item, modules: (item.modules || []).slice()
    })).sort((a, b) => a.from - b.from);
    return config;
  }
  function stageIndexAt(config, elapsed) {
    const playable = Math.max(config.fixedStep, config.duration - config.finaleSeconds);
    const progress = clamp(elapsed / playable, 0, 1);
    let index = 0;
    for (let i = 1; i < config.stages.length; i += 1) {
      const boundary = config.stages[i].from <= 1 ? config.stages[i].from * playable : config.stages[i].from;
      if (elapsed >= boundary) index = i;
    }
    return { index, progress };
  }
  function resolveStageIndex(config, stage) {
    const index = typeof stage === "string" ? config.stages.findIndex((item) => item.id === stage) : Number(stage);
    if (!Number.isInteger(index) || index < 0 || index >= config.stages.length) throw new RangeError("unknown stage");
    return index;
  }
  function createState(options) {
    const config = mergeConfig(options);
    const stage = config.stages[0] || { id: "run", modules: ["road"] };
    return {
      config, seed: options && options.seed !== undefined ? options.seed : "runner-love",
      randomState: hashSeed(options && options.seed), accumulator: 0, ticks: 0, elapsed: 0,
      distance: 0, speed: config.startSpeed, lane: 0, laneFrom: 0, lanePosition: 0,
      laneChangeTime: config.laneChangeDuration, vertical: 0, action: "run",
      actionTime: 0, entities: [], nextEntityId: 1, events: [], inputQueue: [],
      score: 0, collected: 0, hits: 0, dodges: 0, nearMisses: 0,
      stumbleTime: 0, invulnerableTime: 0, response: null, responses: 0,
      companion: { cue: null, synced: 0, missed: 0 }, stageIndex: 0, stage: stage.id,
      moduleIndex: -1, modules: [], nextModuleDistance: 0, finale: false, finished: false
    };
  }
  function emit(state, type, detail) {
    state.events.push({ type, tick: state.ticks, time: state.elapsed, ...(detail || {}) });
  }
  function queueInput(state, action) {
    if (Object.values(ACTIONS).includes(action)) state.inputQueue.push(action);
    return state;
  }
  function performInput(state, action) {
    if (state.finished) return;
    if (action === ACTIONS.LEFT || action === ACTIONS.RIGHT) {
      const before = state.lane;
      state.lane = lane(state.lane + (action === ACTIONS.LEFT ? -1 : 1));
      if (before !== state.lane) {
        state.laneFrom = state.lanePosition;
        state.laneChangeTime = 0;
        emit(state, "lane", { lane: state.lane, from: before });
      }
    } else if (action === ACTIONS.JUMP && state.action === "run") {
      state.action = "jump"; state.actionTime = 0; emit(state, "jump");
    } else if (action === ACTIONS.SLIDE && state.action === "run") {
      state.action = "slide"; state.actionTime = 0; emit(state, "slide");
    }
  }
  function addEntity(state, spec) {
    const entity = {
      id: spec.id === undefined ? state.nextEntityId++ : spec.id,
      type: spec.type || "collectible", lane: lane(spec.lane), z: Number(spec.z),
      active: spec.active !== false, collected: false, hit: false, data: spec.data || null,
      avoid: spec.avoid || (spec.type === "obstacle" ? "jump" : null),
      pairId: spec.pairId || null, responseTo: spec.responseTo || null,
      cue: spec.cue || null, points: Number.isFinite(spec.points) ? spec.points : 1,
      subtype: spec.subtype || null, variant: spec.variant || 0,
      height: Number.isFinite(spec.height) ? spec.height : 0,
      arc: Number.isFinite(spec.arc) ? spec.arc : 0,
      row: Number.isFinite(spec.row) ? spec.row : 0,
      patternId: spec.patternId || null,
      rewardNearMiss: Boolean(spec.rewardNearMiss), nearMissed: false
    };
    if (state.finale && entity.type === "obstacle") entity.active = false;
    if (!Number.isFinite(entity.z)) entity.z = state.config.spawnAhead;
    if (entity.active) state.entities.push(entity);
    return entity;
  }
  function chooseModule(state, stage) {
    const choices = stage.modules.length ? stage.modules : [stage.id];
    return choices[Math.floor(nextRandom(state) * choices.length)];
  }
  function scheduleModules(state) {
    while (state.nextModuleDistance <= state.distance + state.config.spawnAhead) {
      const stage = state.config.stages[state.stageIndex];
      const module = { index: ++state.moduleIndex, id: chooseModule(state, stage), stage: stage.id,
        start: state.nextModuleDistance, length: state.config.moduleLength };
      state.modules.push(module); state.nextModuleDistance += state.config.moduleLength;
      emit(state, "module", { module });
    }
    state.modules = state.modules.filter((item) => item.start + item.length >= state.distance - state.config.despawnBehind);
  }
  function updateAction(state, dt) {
    if (state.action === "run") { state.vertical = 0; return; }
    state.actionTime += dt;
    if (state.action === "jump") {
      const phase = state.actionTime / state.config.jumpDuration;
      state.vertical = phase < 1 ? Math.sin(Math.PI * phase) * state.config.jumpHeight : 0;
      if (phase >= 1) { state.action = "run"; state.actionTime = 0; }
    } else if (state.actionTime >= state.config.slideDuration) {
      state.action = "run"; state.actionTime = 0;
    }
  }
  function updateLane(state, dt) {
    if (state.lanePosition === state.lane) return;
    state.laneChangeTime = Math.min(state.config.laneChangeDuration, state.laneChangeTime + dt);
    const ratio = clamp(state.laneChangeTime / Math.max(0.001, state.config.laneChangeDuration), 0, 1);
    const eased = ratio * ratio * (3 - ratio * 2);
    state.lanePosition = state.laneFrom + (state.lane - state.laneFrom) * eased;
    if (ratio >= 1) state.lanePosition = state.lane;
  }
  function isAvoided(state, entity) {
    if (entity.avoid === "jump") return state.action === "jump" && state.vertical >= 0.48;
    if (entity.avoid === "slide") return state.action === "slide";
    if (entity.avoid === "either") return state.action === "slide" || (state.action === "jump" && state.vertical >= 0.48);
    return false;
  }
  function canCollect(state, entity) {
    if (entity.height < 0.42) return true;
    return state.action === "jump" && state.vertical >= Math.max(0.42, entity.height * 0.5);
  }
  function collect(state, entity) {
    entity.collected = true; entity.active = false; state.collected += 1; state.score += entity.points;
    emit(state, "collect", { entity });
    if (entity.pairId) {
      state.response = { pairId: entity.pairId, expiresAt: state.elapsed + state.config.responseWindow };
      emit(state, "response-open", { pairId: entity.pairId, expiresAt: state.response.expiresAt });
    }
    if (entity.responseTo && state.response && entity.responseTo === state.response.pairId && state.elapsed <= state.response.expiresAt) {
      state.responses += 1; state.response = null; emit(state, "response", { pairId: entity.responseTo });
    }
    if (entity.type === "companion-cue") {
      state.companion.cue = { action: entity.cue || entity.data, expiresAt: state.elapsed + state.config.companionWindow };
      emit(state, "companion-cue", { cue: state.companion.cue });
    }
  }
  function resolveEntities(state, dz) {
    for (const entity of state.entities) {
      if (!entity.active) continue;
      const previous = entity.z; entity.z -= dz;
      const crossed = previous > state.config.collisionDepth && entity.z <= state.config.collisionDepth;
      const laneAligned = Math.abs(entity.lane - state.lanePosition) < 0.42;
      if (crossed && laneAligned) {
        if (entity.type === "obstacle") {
          if (isAvoided(state, entity)) {
            state.dodges += 1;
            emit(state, "dodge", { entity, action: state.action });
          } else if (state.invulnerableTime <= 0) {
            entity.hit = true;
            state.hits += 1;
            state.stumbleTime = state.config.stumbleDuration;
            state.invulnerableTime = state.config.invulnerabilityDuration;
            state.speed = Math.max(state.config.startSpeed * 0.72, state.speed - state.config.collisionSpeedLoss);
            emit(state, "collision", { entity });
          } else {
            emit(state, "protected", { entity });
          }
          entity.active = false;
        } else if (canCollect(state, entity)) collect(state, entity);
      } else if (crossed && entity.type === "obstacle" && entity.rewardNearMiss
          && Math.abs(entity.lane - state.lanePosition) >= 0.42
          && Math.abs(entity.lane - state.lanePosition) <= 1.25 && !entity.nearMissed) {
        entity.nearMissed = true;
        state.nearMisses += 1;
        state.score += 2;
        emit(state, "near-miss", { entity });
      }
      if (entity.z < -state.config.despawnBehind) entity.active = false;
    }
    state.entities = state.entities.filter((entity) => entity.active);
  }
  function setStage(state, stage, emitChange) {
    const index = resolveStageIndex(state.config, stage);
    const changed = index !== state.stageIndex;
    state.stageIndex = index; state.stage = state.config.stages[index].id;
    if (changed && emitChange !== false) emit(state, "stage", { stage: state.stage, stageIndex: index });
    return state;
  }
  function syncStage(state, stage) { return setStage(state, stage, true); }
  function seekStage(state, stage) { return setStage(state, stage, false); }
  function checkWindows(state) {
    if (state.response && state.elapsed > state.response.expiresAt) {
      emit(state, "response-missed", { pairId: state.response.pairId }); state.response = null;
    }
    const cue = state.companion.cue;
    if (!cue) return;
    const matched = (cue.action === state.action) || (cue.action === "left" && state.lane === -1) ||
      (cue.action === "right" && state.lane === 1) || (cue.action === state.lane);
    if (matched) { state.companion.synced += 1; state.companion.cue = null; emit(state, "companion-sync", { action: cue.action }); }
    else if (state.elapsed > cue.expiresAt) { state.companion.missed += 1; state.companion.cue = null; emit(state, "companion-missed", { action: cue.action }); }
  }
  function fixedUpdate(state) {
    const dt = state.config.fixedStep;
    state.ticks += 1; state.elapsed = Math.min(state.config.duration, state.elapsed + dt);
    while (state.inputQueue.length) performInput(state, state.inputQueue.shift());
    updateAction(state, dt); updateLane(state, dt);
    state.stumbleTime = Math.max(0, state.stumbleTime - dt);
    state.invulnerableTime = Math.max(0, state.invulnerableTime - dt);
    const finaleAt = Math.max(0, state.config.duration - state.config.finaleSeconds);
    if (!state.finale && state.elapsed >= finaleAt) {
      state.finale = true;
      state.entities.forEach((entity) => { if (entity.type === "obstacle") entity.active = false; });
      state.entities = state.entities.filter((entity) => entity.active);
      emit(state, "finale");
    }
    const stageInfo = stageIndexAt(state.config, state.elapsed);
    if (stageInfo.index !== state.stageIndex) syncStage(state, stageInfo.index);
    const targetSpeed = Math.min(state.config.maxSpeed, state.config.startSpeed + state.config.acceleration * state.elapsed);
    const recovery = Math.max(1.1, state.config.acceleration * 2.4);
    state.speed = Math.min(targetSpeed, state.speed + recovery * dt);
    const dz = state.speed * dt; state.distance += dz;
    resolveEntities(state, dz); checkWindows(state); scheduleModules(state);
    if (state.elapsed >= state.config.duration) { state.finished = true; emit(state, "finish"); }
  }
  function step(state, delta, actions) {
    state.events = [];
    if (Array.isArray(actions)) actions.forEach((action) => queueInput(state, action));
    else if (actions) queueInput(state, actions);
    if (state.finished) return state;
    const maxCatchUp = Math.min(0.25, Math.max(0, Number(state.config.maxFrame) || 0));
    const frame = clamp(Number(delta) || 0, 0, maxCatchUp);
    state.accumulator = Math.min(state.accumulator + frame, maxCatchUp);
    const maxSteps = Math.ceil(maxCatchUp / state.config.fixedStep);
    let updates = 0;
    while (state.accumulator + 1e-12 >= state.config.fixedStep && updates < maxSteps && !state.finished) {
      state.accumulator -= state.config.fixedStep; fixedUpdate(state);
      updates += 1;
    }
    if (updates === maxSteps && state.accumulator >= state.config.fixedStep) state.accumulator %= state.config.fixedStep;
    return state;
  }
  function createEngine(options) {
    const state = createState(options || {});
    scheduleModules(state); state.events = [];
    return { state, step: (delta, actions) => step(state, delta, actions), input: (action) => queueInput(state, action),
      syncStage: (stage) => syncStage(state, stage), seekStage: (stage) => seekStage(state, stage),
      spawn: (spec) => addEntity(state, spec), drainEvents: () => { const events = state.events.slice(); state.events = []; return events; } };
  }

  return Object.freeze({ LANES, ACTIONS, DEFAULTS, DEFAULT_STAGES, createState, createEngine,
    step, fixedUpdate, queueInput, addEntity, stageIndexAt, syncStage, seekStage, hashSeed });
});
