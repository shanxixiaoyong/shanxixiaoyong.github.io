(function (root, factory) {
  const rules = factory();
  if (typeof module === "object" && module.exports) module.exports = rules;
  else root.RunnerLoveRules = rules;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function deepFreeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.keys(value).forEach((key) => deepFreeze(value[key]));
      Object.freeze(value);
    }
    return value;
  }

  const STAGES = deepFreeze([
    { index: 0, number: 1, id: "encounter", name: "再遇见", target: 30, checkpoint: 15, expectedSeconds: 180, destination: "图书馆路口" },
    { index: 1, number: 2, id: "familiar", name: "渐渐熟悉", target: 30, checkpoint: 15, expectedSeconds: 180, destination: "桥下书店" },
    { index: 2, number: 3, id: "first-date", name: "第一次赴约", target: 31, checkpoint: 15, expectedSeconds: 180, destination: "旧城电影院" },
    { index: 3, number: 4, id: "date-night", name: "约会正发生", target: 31, checkpoint: 15, expectedSeconds: 180, destination: "河岸长椅" },
    { index: 4, number: 5, id: "everyday", name: "成为日常", target: 32, checkpoint: 16, expectedSeconds: 180, destination: "亮灯的厨房" },
    { index: 5, number: 6, id: "after-rain", name: "雨夜之后", target: 32, checkpoint: 16, expectedSeconds: 180, destination: "河桥雨棚" },
    { index: 6, number: 7, id: "next-stop", name: "下一站", target: 32, checkpoint: 16, expectedSeconds: 180, destination: "有灯的家" }
  ]);

  const RULES = deepFreeze({
    title: "心动跑酷",
    subtitle: "今晚见",
    version: 5,
    stageCount: STAGES.length,
    startCondition: 100,
    collisionLoss: 4,
    missedActionLoss: 4,
    goodRecovery: 2,
    perfectRecovery: 4,
    stageRecovery: 18,
    retryCondition: 68
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function stageState(index, carry) {
    const definition = STAGES[index];
    return {
      id: definition.id,
      progress: Math.min(definition.target, Math.max(0, Number(carry?.progress) || 0)),
      target: definition.target,
      expectedSeconds: definition.expectedSeconds,
      elapsed: Math.max(0, Number(carry?.elapsed) || 0),
      attempts: Math.max(0, Number(carry?.attempts) || 0),
      perfect: Math.max(0, Number(carry?.perfect) || 0),
      items: Array.isArray(carry?.items) ? [...new Set(carry.items)] : [],
      choices: Array.isArray(carry?.choices) ? [...new Set(carry.choices)] : []
    };
  }

  function createRunState(options = {}) {
    const state = {
      version: RULES.version,
      status: "playing",
      stageIndex: 0,
      condition: RULES.startCondition,
      heartbeat: RULES.startCondition,
      combo: 0,
      bestCombo: 0,
      totalAttempts: 0,
      successfulMoments: 0,
      perfectMoments: 0,
      collisions: 0,
      nearMisses: 0,
      elapsed: 0,
      stage: stageState(0),
      completedStages: [],
      arrivals: [],
      checkpoints: [],
      collectedItems: [],
      routeChoices: [],
      stageRecords: [],
      grade: null,
      ending: null,
      newGamePlus: Boolean(options.newGamePlus)
    };
    return deepFreeze(state);
  }

  function assertPlaying(state) {
    if (!state || typeof state !== "object") throw new TypeError("state is required");
    if (state.status !== "playing") throw new RangeError("run is not active");
  }

  function normalizeMoment(value) {
    if (typeof value === "string") return { outcome: value };
    if (!value || typeof value !== "object") throw new TypeError("moment is required");
    return value;
  }

  function calculateRating(state, completedOverride) {
    if (!state || typeof state !== "object") throw new TypeError("state is required");
    const attempts = Math.max(1, Number(state.totalAttempts) || 0);
    const accuracy = Math.round((Number(state.successfulMoments) || 0) / attempts * 100);
    const completion = Math.round(((state.completedStages?.length || 0) + (state.status === "playing" ? (state.stage?.progress || 0) / Math.max(1, state.stage?.target || 1) : 0)) / STAGES.length * 100);
    const completed = completedOverride === undefined ? state.status === "completed" : Boolean(completedOverride);
    let grade = "B";
    if (completed && accuracy >= 90 && (state.collisions || 0) <= 3 && (state.collectedItems?.length || 0) >= 18) grade = "S";
    else if (completed && accuracy >= 72 && (state.condition || state.heartbeat || 0) >= 35) grade = "A";
    return deepFreeze({
      grade,
      completion: Math.min(100, completion),
      accuracy: Math.min(100, accuracy),
      condition: Number(state.condition ?? state.heartbeat) || 0,
      heartbeat: Number(state.condition ?? state.heartbeat) || 0,
      items: state.collectedItems?.length || 0,
      collisions: state.collisions || 0,
      bestCombo: state.bestCombo || 0,
      arrivals: state.arrivals?.length || 0
    });
  }

  function completeStage(next) {
    const definition = STAGES[next.stageIndex];
    next.completedStages.push(definition.id);
    next.arrivals.push(definition.destination);
    next.stageRecords.push({
      id: definition.id,
      destination: definition.destination,
      items: next.stage.items.slice(),
      choices: next.stage.choices.slice(),
      attempts: next.stage.attempts,
      perfect: next.stage.perfect,
      elapsed: next.stage.elapsed
    });
    next.condition = Math.min(100, next.condition + RULES.stageRecovery);
    next.heartbeat = next.condition;
    if (next.stageIndex === STAGES.length - 1) {
      next.status = "completed";
      next.grade = calculateRating(next, true).grade;
      next.ending = next.grade;
      return;
    }
    next.stageIndex += 1;
    next.stage = stageState(next.stageIndex);
  }

  function recordMoment(state, value) {
    assertPlaying(state);
    const moment = normalizeMoment(value);
    const outcome = moment.outcome || "good";
    if (!["perfect", "good", "miss"].includes(outcome)) throw new RangeError(`unknown outcome: ${outcome}`);
    const next = clone(state);
    next.totalAttempts += 1;
    next.stage.attempts += 1;
    if (outcome === "miss") {
      const loss = moment.kind === "collision" ? RULES.collisionLoss : RULES.missedActionLoss;
      next.condition = Math.max(0, next.condition - loss);
      next.heartbeat = next.condition;
      next.combo = 0;
      if (moment.kind === "collision") next.collisions += 1;
      if (next.condition <= 0) {
        next.status = "failed";
        next.ending = "这次没能准时抵达";
      }
      return deepFreeze(next);
    }

    next.successfulMoments += 1;
    next.combo += 1;
    next.bestCombo = Math.max(next.bestCombo, next.combo);
    next.stage.progress = Math.min(next.stage.target, next.stage.progress + 1);
    if (outcome === "perfect") {
      next.perfectMoments += 1;
      next.stage.perfect += 1;
      next.condition = Math.min(100, next.condition + RULES.perfectRecovery);
    } else {
      next.condition = Math.min(100, next.condition + RULES.goodRecovery);
    }
    next.heartbeat = next.condition;
    if (moment.itemId) {
      if (!next.collectedItems.includes(moment.itemId)) next.collectedItems.push(moment.itemId);
      if (!next.stage.items.includes(moment.itemId)) next.stage.items.push(moment.itemId);
    }
    if (moment.choiceId) {
      if (!next.routeChoices.includes(moment.choiceId)) next.routeChoices.push(moment.choiceId);
      if (!next.stage.choices.includes(moment.choiceId)) next.stage.choices.push(moment.choiceId);
    }
    const definition = STAGES[next.stageIndex];
    if (next.stage.progress >= definition.checkpoint && !next.checkpoints.includes(definition.id)) next.checkpoints.push(definition.id);
    if (next.stage.progress >= definition.target) completeStage(next);
    return deepFreeze(next);
  }

  function recordBeat(state, outcome) {
    return recordMoment(state, { outcome });
  }

  function recordNearMiss(state) {
    assertPlaying(state);
    const next = clone(state);
    next.nearMisses += 1;
    next.condition = Math.min(100, next.condition + 1);
    next.heartbeat = next.condition;
    return deepFreeze(next);
  }

  function advanceTime(state, seconds) {
    assertPlaying(state);
    if (!Number.isFinite(seconds) || seconds < 0) throw new TypeError("seconds must be a non-negative finite number");
    const next = clone(state);
    next.elapsed += seconds;
    next.stage.elapsed += seconds;
    return deepFreeze(next);
  }

  function getStageProgress(state) {
    if (!state || typeof state !== "object") throw new TypeError("state is required");
    const definition = STAGES[Math.min(STAGES.length - 1, state.stageIndex || 0)];
    return deepFreeze({
      progress: state.stage.progress,
      target: definition.target,
      ratio: Math.min(1, state.stage.progress / definition.target),
      checkpointReached: state.stage.progress >= definition.checkpoint,
      expectedSeconds: definition.expectedSeconds,
      timeRatio: Math.min(1, state.stage.elapsed / definition.expectedSeconds),
      destination: definition.destination
    });
  }

  function retryFromCheckpoint(state) {
    if (!state || state.status !== "failed") throw new RangeError("only a failed run can retry");
    const next = clone(state);
    const definition = STAGES[next.stageIndex];
    next.status = "playing";
    next.ending = null;
    next.grade = null;
    next.condition = RULES.retryCondition;
    next.heartbeat = next.condition;
    next.combo = 0;
    next.stage = stageState(next.stageIndex, {
      progress: next.checkpoints.includes(definition.id) ? definition.checkpoint : 0,
      elapsed: next.checkpoints.includes(definition.id) ? definition.expectedSeconds * 0.5 : 0,
      items: next.stage.items,
      choices: next.stage.choices
    });
    return deepFreeze(next);
  }

  function checksum(payload) {
    const text = JSON.stringify(payload);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
    return (hash >>> 0).toString(36);
  }

  function validateRunState(state) {
    if (!state || typeof state !== "object" || state.version !== RULES.version) throw new RangeError("invalid run state version");
    if (!Number.isInteger(state.stageIndex) || state.stageIndex < 0 || state.stageIndex >= STAGES.length) throw new RangeError("invalid stage index");
    if (!Number.isFinite(state.condition) || state.condition < 0 || state.condition > 100) throw new RangeError("invalid condition");
    if (state.heartbeat !== state.condition) throw new RangeError("condition alias mismatch");
    if (!Array.isArray(state.collectedItems) || !Array.isArray(state.arrivals)) throw new RangeError("invalid journey collections");
    return true;
  }

  function createSave(state, previous) {
    validateRunState(state);
    const oldProfile = previous?.profile || {};
    const completed = state.status === "completed";
    const profile = {
      completedRuns: (oldProfile.completedRuns || 0) + (completed ? 1 : 0),
      bestGrade: completed ? (["B", "A", "S"].indexOf(state.grade) > ["B", "A", "S"].indexOf(oldProfile.bestGrade) ? state.grade : oldProfile.bestGrade || state.grade) : oldProfile.bestGrade || null,
      discoveredItems: [...new Set([...(oldProfile.discoveredItems || []), ...state.collectedItems])],
      visitedDestinations: [...new Set([...(oldProfile.visitedDestinations || []), ...state.arrivals])],
      newGamePlusUnlocked: Boolean(oldProfile.newGamePlusUnlocked || completed)
    };
    const payload = { version: RULES.version, run: clone(state), profile };
    return deepFreeze({ ...payload, signature: checksum(payload) });
  }

  function validateSave(save) {
    if (!save || typeof save !== "object" || save.version !== RULES.version || !save.run || !save.profile) throw new RangeError("invalid save");
    const payload = { version: save.version, run: save.run, profile: save.profile };
    if (checksum(payload) !== save.signature) throw new RangeError("save signature mismatch");
    validateRunState(save.run);
    return true;
  }

  function loadSave(save) {
    validateSave(save);
    return deepFreeze(clone(save));
  }

  function canStartNewGamePlus(save) {
    validateSave(save);
    return Boolean(save.profile.newGamePlusUnlocked);
  }

  function createNewGamePlus(save) {
    if (!canStartNewGamePlus(save)) throw new RangeError("new game plus is locked");
    return createRunState({ newGamePlus: true });
  }

  return deepFreeze({
    RULES,
    STAGES,
    createRunState,
    recordMoment,
    recordBeat,
    recordNearMiss,
    advanceTime,
    getStageProgress,
    calculateRating,
    retryFromCheckpoint,
    validateRunState,
    createSave,
    validateSave,
    loadSave,
    canStartNewGamePlus,
    createNewGamePlus
  });
});
