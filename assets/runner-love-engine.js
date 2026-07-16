(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.RunnerLoveEngine = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const LANES = Object.freeze([-1, 0, 1]);
  const ACTIONS = Object.freeze({ LEFT: "left", RIGHT: "right", JUMP: "jump", SLIDE: "slide" });
  const POWERUP_TYPES = Object.freeze(["magnet", "shield", "multiplier", "overdrive"]);
  const DEFAULT_STAGES = Object.freeze([
    { id: "meet", from: 0, modules: ["campus", "crosswalk"] },
    { id: "together", from: 0.34, modules: ["park", "cafe"] },
    { id: "promise", from: 0.68, modules: ["city", "starlight"] }
  ]);
  const DEFAULTS = Object.freeze({
    fixedStep: 1 / 60, maxFrame: 0.25, duration: 120, finaleSeconds: 20, manualStages: false,
    startSpeed: 11, maxSpeed: 22, acceleration: 0.085, moduleLength: 36,
    spawnAhead: 90, despawnBehind: 5, collisionDepth: 0.85,
    laneChangeDuration: 0.16, jumpDuration: 0.76, jumpHeight: 1.9, slideDuration: 0.64,
    stumbleDuration: 0.62, invulnerabilityDuration: 1.05, collisionSpeedLoss: 3.2,
    magnetDuration: 6, shieldDuration: 8, multiplierDuration: 6, overdriveDuration: 2.5,
    scoreMultiplier: 2, overdriveSpeed: 5, overdriveAcceleration: 10, speedEaseOut: 5.5,
    inputBufferDuration: 0.14, paceEase: 3.8,
    choiceReadDistance: 14,
    stages: DEFAULT_STAGES
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
  function createPowerups() {
    return {
      magnet: { active: false, remaining: 0, duration: 0, laneRange: 1 },
      shield: { active: false, remaining: 0, duration: 0, charges: 0 },
      multiplier: { active: false, remaining: 0, duration: 0, factor: 1 },
      overdrive: { active: false, remaining: 0, duration: 0, speed: 0 }
    };
  }
  function ensurePowerups(state) {
    if (!state.powerups || typeof state.powerups !== "object") state.powerups = {};
    const defaults = createPowerups();
    for (const type of POWERUP_TYPES) {
      if (!state.powerups[type] || typeof state.powerups[type] !== "object") state.powerups[type] = defaults[type];
    }
    return state.powerups;
  }
  function createState(options) {
    const config = mergeConfig(options);
    const stage = config.stages[0] || { id: "run", modules: ["road"] };
    return {
      config, seed: options && options.seed !== undefined ? options.seed : "runner-love",
      randomState: hashSeed(options && options.seed), accumulator: 0, ticks: 0, elapsed: 0,
      distance: 0, runProgress: 0, progress: 0, speed: config.startSpeed, speedProgress: 0, speedTier: 0,
      lane: 0, laneFrom: 0, lanePosition: 0,
      laneChangeTime: config.laneChangeDuration, vertical: 0, action: "run",
      actionTime: 0, bufferedAction: null, bufferedActionTime: 0,
      inputSeq: 0, lastInput: null, entities: [], nextEntityId: 1, events: [], eventSeq: 0, inputQueue: [],
      score: 0, collected: 0, hits: 0, dodges: 0, nearMisses: 0,
      boostSpeed: 0, boostTime: 0, paceScale: 1, paceTime: 0, powerups: createPowerups(),
      stumbleTime: 0, invulnerableTime: 0, routeChoices: {}, stageIndex: 0, stage: stage.id,
      moduleIndex: -1, modules: [], nextModuleDistance: 0, finale: false, finished: false
    };
  }
  function emit(state, type, detail) {
    state.eventSeq = Math.max(0, Number(state.eventSeq) || 0) + 1;
    state.events.push({ type, seq: state.eventSeq, tick: state.ticks, time: state.elapsed, ...(detail || {}) });
  }
  function queueInput(state, action) {
    if (Object.values(ACTIONS).includes(action)) state.inputQueue.push(action);
    return state;
  }
  function acceptInput(state, action) {
    state.inputSeq += 1;
    state.lastInput = { seq: state.inputSeq, action, time: state.elapsed, tick: state.ticks };
    return state.inputSeq;
  }
  function performInput(state, action, allowBuffer = true) {
    if (state.finished) return false;
    if (action === ACTIONS.LEFT || action === ACTIONS.RIGHT) {
      const before = state.lane;
      state.lane = lane(state.lane + (action === ACTIONS.LEFT ? -1 : 1));
      if (before !== state.lane) {
        const inputSeq = acceptInput(state, action);
        state.laneFrom = state.lanePosition;
        state.laneChangeTime = 0;
        emit(state, "lane", { lane: state.lane, from: before, action, inputSeq });
        return true;
      }
    } else if (action === ACTIONS.JUMP && state.action === "run") {
      const inputSeq = acceptInput(state, action);
      state.action = "jump"; state.actionTime = 0; emit(state, "jump", { action, inputSeq });
      return true;
    } else if (action === ACTIONS.SLIDE && state.action === "run") {
      const inputSeq = acceptInput(state, action);
      state.action = "slide"; state.actionTime = 0; emit(state, "slide", { action, inputSeq });
      return true;
    } else if (allowBuffer && (action === ACTIONS.JUMP || action === ACTIONS.SLIDE)) {
      state.bufferedAction = action;
      state.bufferedActionTime = Math.max(state.config.fixedStep, Number(state.config.inputBufferDuration) || 0);
      emit(state, "input-buffered", { action, expiresIn: state.bufferedActionTime });
    }
    return false;
  }
  function addEntity(state, spec) {
    const entity = {
      id: spec.id === undefined ? state.nextEntityId++ : spec.id,
      type: spec.type || "collectible", lane: lane(spec.lane), z: Number(spec.z),
      active: spec.active !== false, collected: false, hit: false, data: spec.data || null,
      avoid: spec.avoid || (spec.type === "obstacle" ? "jump" : null),
      points: Number.isFinite(spec.points) ? spec.points : 1,
      subtype: spec.subtype || null, variant: spec.variant || 0,
      itemId: spec.itemId || spec.data?.itemId || null,
      choiceGroup: spec.choiceGroup || spec.data?.choiceGroup || null,
      choiceId: spec.choiceId || spec.data?.choiceId || null,
      momentId: spec.momentId || spec.data?.momentId || null,
      interaction: spec.interaction || spec.data?.interaction || null,
      label: spec.label || spec.data?.label || null,
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
    if (state.powerups?.overdrive?.active) return true;
    if (entity.avoid === "jump") return state.action === "jump" && state.vertical >= 0.48;
    if (entity.avoid === "slide") return state.action === "slide";
    if (entity.avoid === "either") return state.action === "slide" || (state.action === "jump" && state.vertical >= 0.48);
    return false;
  }
  function canCollect(state, entity) {
    if (state.powerups?.overdrive?.active) return true;
    if (entity.height < 0.42) return true;
    return state.action === "jump" && state.vertical >= Math.max(0.42, entity.height * 0.5);
  }
  function scoreFactor(state) {
    const multiplier = state.powerups?.multiplier;
    return multiplier?.active ? clamp(Number(multiplier.factor) || 1, 1, 10) : 1;
  }
  function awardScore(state, points) {
    const base = Number(points) || 0;
    const multiplier = scoreFactor(state);
    const awarded = base * multiplier;
    state.score += awarded;
    return { awarded, multiplier };
  }
  function collect(state, entity, source) {
    entity.collected = true; entity.active = false; state.collected += 1;
    const reward = awardScore(state, entity.points);
    emit(state, "collect", { entity, points: reward.awarded, multiplier: reward.multiplier, source: source || "contact" });
    if (entity.choiceGroup) {
      state.routeChoices[entity.choiceGroup] = entity.choiceId || entity.itemId || entity.id;
      state.entities.forEach((candidate) => {
        if (candidate.id !== entity.id && candidate.choiceGroup === entity.choiceGroup) candidate.active = false;
      });
      emit(state, "route-choice", {
        group: entity.choiceGroup,
        choiceId: entity.choiceId || entity.itemId || entity.id,
        itemId: entity.itemId,
        entity
      });
    }
  }
  function powerupEventDetail(type, effect, detail) {
    return {
      powerup: type, powerupType: type,
      powerupState: { ...effect },
      ...(detail || {})
    };
  }
  function endPowerup(state, type, reason) {
    const effect = ensurePowerups(state)[type];
    if (!effect.active) return false;
    effect.active = false; effect.remaining = 0;
    if (type === "shield") effect.charges = 0;
    if (type === "multiplier") effect.factor = 1;
    if (type === "overdrive") effect.speed = 0;
    emit(state, "powerup-end", powerupEventDetail(type, effect, { reason: reason || "expired" }));
    return true;
  }
  function blockWithShield(state, entity) {
    const shield = state.powerups?.shield;
    if (!shield?.active || shield.charges <= 0) return false;
    shield.charges -= 1;
    emit(state, "shield-block", powerupEventDetail("shield", shield, { entity, remainingCharges: shield.charges }));
    if (shield.charges <= 0) endPowerup(state, "shield", "consumed");
    return true;
  }
  function magnetReaches(state, entity) {
    const magnet = state.powerups?.magnet;
    return entity.type === "collectible" && magnet?.active
      && Math.abs(entity.lane - state.lane) <= clamp(Number(magnet.laneRange) || 0, 0, 1) + 1e-9;
  }
  function resolveEntities(state, dz) {
    for (const entity of state.entities) {
      if (!entity.active) continue;
      const previous = entity.z; entity.z -= dz;
      if ((entity.type === "story-item" || entity.type === "route-choice")
          && !entity.choiceWindowOpened
          && previous > state.config.choiceReadDistance
          && entity.z <= state.config.choiceReadDistance) {
        entity.choiceWindowOpened = true;
        entity.data = entity.data && typeof entity.data === "object" ? entity.data : {};
        entity.data.inputSeqAtWindow = state.inputSeq;
        entity.data.choiceWindowOpenedAt = state.elapsed;
        emit(state, "choice-window", { entity, inputSeq: state.inputSeq });
      }
      const crossed = previous > state.config.collisionDepth && entity.z <= state.config.collisionDepth;
      const laneAligned = Math.abs(entity.lane - state.lanePosition) < 0.42;
      const magnetCollect = crossed && magnetReaches(state, entity);
      if (crossed && entity.type === "obstacle" && laneAligned) {
        if (isAvoided(state, entity)) {
          state.dodges += 1;
          emit(state, "dodge", { entity, action: state.action, inputSeq: state.lastInput?.seq || 0, input: state.lastInput });
        } else if (state.invulnerableTime <= 0) {
          if (!blockWithShield(state, entity)) {
            entity.hit = true;
            state.hits += 1;
            state.stumbleTime = state.config.stumbleDuration;
            state.invulnerableTime = state.config.invulnerabilityDuration;
            state.speed = Math.max(state.config.startSpeed * 0.72, state.speed - state.config.collisionSpeedLoss);
            emit(state, "collision", { entity, inputSeq: state.lastInput?.seq || 0, input: state.lastInput });
          }
        } else {
          emit(state, "protected", { entity });
        }
        entity.active = false;
      } else if (crossed && entity.type !== "obstacle"
          && (magnetCollect || (laneAligned && canCollect(state, entity)))) {
        collect(state, entity, magnetCollect && !laneAligned ? "magnet" : "contact");
      } else if (crossed && entity.type === "obstacle" && entity.rewardNearMiss
          && Math.abs(entity.lane - state.lanePosition) >= 0.42
          && Math.abs(entity.lane - state.lanePosition) <= 1.25 && !entity.nearMissed) {
        entity.nearMissed = true;
        state.nearMisses += 1;
        const reward = awardScore(state, 2);
        emit(state, "near-miss", { entity, points: reward.awarded, multiplier: reward.multiplier, inputSeq: state.lastInput?.seq || 0, input: state.lastInput });
      }
      if (entity.z < -state.config.despawnBehind) {
        if ((entity.type === "story-item" || entity.type === "route-choice") && !entity.collected) {
          emit(state, "story-missed", { entity });
        }
        entity.active = false;
      }
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
  function clearEntities(state, options) {
    const settings = options && typeof options === "object" ? options : {};
    state.entities.length = 0;
    state.events.length = 0;
    state.inputQueue.length = 0;
    state.routeChoices = {};
    if (settings.modules) {
      state.modules.length = 0;
      state.nextModuleDistance = state.distance;
      scheduleModules(state);
      state.events.length = 0;
    }
    return state;
  }
  function applyBoost(state, amount, duration) {
    state.boostSpeed = Math.max(state.boostSpeed || 0, clamp(Number(amount) || 0, 0, 5));
    state.boostTime = Math.max(state.boostTime || 0, clamp(Number(duration) || 0, 0, 3));
    if (state.boostSpeed > 0) emit(state, "boost", { amount: state.boostSpeed, duration: state.boostTime });
    return state;
  }
  function applyPace(state, scale, duration) {
    state.paceScale = clamp(Number(scale) || 1, 0.58, 1.18);
    state.paceTime = Math.max(state.config.fixedStep, Number(duration) || state.config.fixedStep);
    emit(state, "pace", { scale: state.paceScale, duration: state.paceTime });
    return state;
  }
  function optionNumber(options, names, fallback) {
    for (const name of names) {
      if (options[name] !== undefined && Number.isFinite(Number(options[name]))) return Number(options[name]);
    }
    return fallback;
  }
  function activatePowerup(state, type, options) {
    if (!POWERUP_TYPES.includes(type)) throw new RangeError("unknown powerup");
    const settings = options && typeof options === "object" ? options : {};
    const powerups = ensurePowerups(state);
    const effect = powerups[type];
    const configuredDuration = Number(state.config[`${type}Duration`]) || state.config.fixedStep;
    const requestedDuration = optionNumber(settings, ["duration"], configuredDuration);
    const duration = Math.max(state.config.fixedStep, requestedDuration);
    const refreshed = effect.active;
    effect.active = true;
    effect.remaining = Math.max(Number(effect.remaining) || 0, duration);
    effect.duration = effect.remaining;
    if (type === "magnet") {
      effect.laneRange = clamp(optionNumber(settings, ["laneRange", "range"], 1), 0, 1);
    } else if (type === "shield") {
      effect.charges = 1;
    } else if (type === "multiplier") {
      const factor = clamp(optionNumber(settings, ["factor", "multiplier", "value", "amount"], state.config.scoreMultiplier), 1, 10);
      effect.factor = refreshed ? Math.max(Number(effect.factor) || 1, factor) : factor;
    } else if (type === "overdrive") {
      const speed = clamp(optionNumber(settings, ["speed", "speedBoost", "boost", "amount"], state.config.overdriveSpeed), 0, 12);
      effect.speed = refreshed ? Math.max(Number(effect.speed) || 0, speed) : speed;
    }
    emit(state, "powerup-start", powerupEventDetail(type, effect, { duration: effect.remaining, refreshed }));
    return state;
  }
  function updatePowerups(state, dt) {
    const powerups = ensurePowerups(state);
    for (const type of POWERUP_TYPES) {
      const effect = powerups[type];
      if (!effect.active) continue;
      effect.remaining = Math.max(0, (Number(effect.remaining) || 0) - dt);
      if (effect.remaining <= 1e-12) endPowerup(state, type, "expired");
    }
  }
  function cruiseSpeedAt(state) {
    const startSpeed = Number(state.config.startSpeed) || 0;
    const maxSpeed = Math.max(startSpeed, Number(state.config.maxSpeed) || 0);
    const acceleration = Math.max(0, Number(state.config.acceleration) || 0);
    const distanceTime = state.distance / Math.max(1, Math.abs(startSpeed));
    const paceTime = state.elapsed * 0.65 + distanceTime * 0.35;
    return Math.min(maxSpeed, startSpeed + acceleration * paceTime);
  }
  function approach(value, target, amount) {
    if (value < target) return Math.min(target, value + amount);
    if (value > target) return Math.max(target, value - amount);
    return target;
  }
  function updateSpeedMetrics(state) {
    state.runProgress = stageIndexAt(state.config, state.elapsed).progress;
    const span = Math.max(0, state.config.maxSpeed - state.config.startSpeed);
    state.speedProgress = span > 1e-9 ? clamp((state.speed - state.config.startSpeed) / span, 0, 1) : 0;
    state.progress = state.speedProgress;
    state.speedTier = state.powerups?.overdrive?.active ? 4 : Math.min(4, Math.floor(state.speedProgress * 5));
  }
  function fixedUpdate(state) {
    const dt = state.config.fixedStep;
    state.ticks += 1; state.elapsed = Math.min(state.config.duration, state.elapsed + dt);
    while (state.inputQueue.length) performInput(state, state.inputQueue.shift());
    updateAction(state, dt); updateLane(state, dt);
    if (state.bufferedAction && state.action === "run" && state.bufferedActionTime > 0) {
      const buffered = state.bufferedAction;
      state.bufferedAction = null;
      state.bufferedActionTime = 0;
      performInput(state, buffered, false);
    } else {
      state.bufferedActionTime = Math.max(0, (state.bufferedActionTime || 0) - dt);
      if (state.bufferedActionTime <= 0) state.bufferedAction = null;
    }
    state.stumbleTime = Math.max(0, state.stumbleTime - dt);
    state.invulnerableTime = Math.max(0, state.invulnerableTime - dt);
    state.boostTime = Math.max(0, (state.boostTime || 0) - dt);
    if (state.boostTime <= 0) state.boostSpeed = Math.max(0, (state.boostSpeed || 0) - dt * 4.5);
    state.paceTime = Math.max(0, (state.paceTime || 0) - dt);
    if (state.paceTime <= 0) state.paceScale = approach(state.paceScale || 1, 1, Math.max(0.1, Number(state.config.paceEase) || 0) * dt);
    const finaleAt = Math.max(0, state.config.duration - state.config.finaleSeconds);
    if (!state.finale && state.elapsed >= finaleAt) {
      state.finale = true;
      state.entities.forEach((entity) => { if (entity.type === "obstacle") entity.active = false; });
      state.entities = state.entities.filter((entity) => entity.active);
      emit(state, "finale");
    }
    if (!state.config.manualStages) {
      const stageInfo = stageIndexAt(state.config, state.elapsed);
      if (stageInfo.index !== state.stageIndex) syncStage(state, stageInfo.index);
    }
    const overdrive = state.powerups?.overdrive;
    const overdriveSpeed = overdrive?.active ? Number(overdrive.speed) || 0 : 0;
    const cruiseSpeed = cruiseSpeedAt(state);
    const boostedSpeed = Math.min(state.config.maxSpeed + 3.5, cruiseSpeed + (state.boostSpeed || 0));
    const targetSpeed = (boostedSpeed + overdriveSpeed) * clamp(state.paceScale || 1, 0.58, 1.18);
    const recovery = Math.max(1.1, state.config.acceleration * 2.4);
    const rise = overdrive?.active ? Math.max(recovery, Number(state.config.overdriveAcceleration) || 0) : recovery;
    const fall = Math.max(recovery, Number(state.config.speedEaseOut) || 0);
    state.speed = approach(state.speed, targetSpeed, (state.speed < targetSpeed ? rise : fall) * dt);
    const dz = state.speed * dt; state.distance += dz;
    resolveEntities(state, dz); scheduleModules(state);
    updatePowerups(state, dt); updateSpeedMetrics(state);
    if (state.elapsed >= state.config.duration) { state.finished = true; emit(state, "finish"); }
  }
  function step(state, delta, actions) {
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
      clearEntities: (options) => clearEntities(state, options),
      boost: (amount, duration) => applyBoost(state, amount, duration),
      pace: (scale, duration) => applyPace(state, scale, duration),
      activatePowerup: (type, options) => activatePowerup(state, type, options),
      spawn: (spec) => addEntity(state, spec), drainEvents: () => state.events.splice(0, state.events.length) };
  }

  return Object.freeze({ LANES, ACTIONS, POWERUP_TYPES, DEFAULTS, DEFAULT_STAGES, createState, createEngine,
    step, fixedUpdate, queueInput, addEntity, stageIndexAt, syncStage, seekStage, clearEntities,
    applyBoost, applyPace, activatePowerup, hashSeed });
});
