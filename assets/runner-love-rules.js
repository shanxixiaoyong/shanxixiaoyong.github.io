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
    { index: 0, number: 1, id: "courage", name: "勇气", target: 8, checkpoint: 5, duration: 35, perfectWindow: 90, failEnding: "未能迈出第一步" },
    { index: 1, number: 2, id: "resonance", name: "共鸣", target: 10, checkpoint: 6, duration: 40, perfectWindow: 90, failEnding: "频率渐行渐远" },
    { index: 2, number: 3, id: "response", name: "回应", target: 12, checkpoint: 7, duration: 45, perfectWindow: 90, failEnding: "心意没有回音" },
    { index: 3, number: 4, id: "rapport", name: "默契", target: 14, checkpoint: 9, duration: 50, perfectWindow: 90, failEnding: "脚步错开彼此" },
    { index: 4, number: 5, id: "trust", name: "信任", target: 16, checkpoint: 10, duration: 55, perfectWindow: 90, failEnding: "信任停在半途" },
    { index: 5, number: 6, id: "understanding", name: "理解", target: 18, checkpoint: 11, duration: 60, perfectWindow: 90, failEnding: "没能读懂真心" },
    { index: 6, number: 7, id: "promise", name: "约定", target: 20, checkpoint: 13, duration: 65, perfectWindow: 90, failEnding: "约定未能抵达" }
  ]);

  const RULES = deepFreeze({
    title: "心动跑酷",
    version: 1,
    saveVersion: 1,
    stageCount: 7,
    initialHeartbeat: 60,
    minimumHeartbeat: 0,
    maximumHeartbeat: 100,
    compensationSeconds: 20,
    perfectThreshold: 0.9,
    revealMinimumGrade: "A",
    heartbeat: { perfect: 5, good: 3, miss: -12, comboStep: 5, comboBonus: 1, comboBonusCap: 5 },
    rating: { sScore: 90, aScore: 85, completionWeight: 45, accuracyWeight: 35, heartbeatWeight: 20 }
  });

  const OUTCOMES = deepFreeze(["perfect", "good", "miss"]);
  const GRADES = deepFreeze(["S", "A", "B"]);

  function isRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || Object.getPrototypeOf(prototype) === null;
  }

  function integer(value, label, min, max) {
    if (!Number.isSafeInteger(value)) throw new TypeError(label + " must be an integer");
    if (value < min || value > max) throw new RangeError(label + " is out of range");
  }

  function finite(value, label, min, max) {
    if (!Number.isFinite(value)) throw new TypeError(label + " must be finite");
    if (value < min || value > max) throw new RangeError(label + " is out of range");
  }

  function exactKeys(value, keys, label) {
    if (!isRecord(value) || Object.keys(value).length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(value, key))) {
      throw new TypeError(label + " has an invalid shape");
    }
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function round(value) { return Math.round(value * 1000) / 1000; }
  function cloneFreeze(value) { return deepFreeze(JSON.parse(JSON.stringify(value))); }
  function currentDefinition(state) { return state.stageIndex < STAGES.length ? STAGES[state.stageIndex] : null; }

  function freshStage() {
    return { progress: 0, elapsed: 0, compensation: false, compensationRemaining: 0, hits: 0, perfects: 0, misses: 0 };
  }

  function createRunState(options) {
    if (options === undefined) options = {};
    exactKeys(options, Object.keys(options).filter((key) => key === "newGamePlus"), "options");
    const newGamePlus = options.newGamePlus === undefined ? false : options.newGamePlus;
    if (typeof newGamePlus !== "boolean") throw new TypeError("options.newGamePlus must be boolean");
    return deepFreeze({
      version: RULES.version, status: "playing", stageIndex: 0, stage: freshStage(), heartbeat: RULES.initialHeartbeat,
      combo: 0, bestCombo: 0, totalBeats: 0, perfectBeats: 0, goodBeats: 0, misses: 0,
      perfectStages: [], checkpoints: [], completedStages: [], heartStamps: [], usedCompensation: false,
      newGamePlus, ending: null, grade: null, revealEligible: false
    });
  }

  const STATE_KEYS = ["version", "status", "stageIndex", "stage", "heartbeat", "combo", "bestCombo", "totalBeats", "perfectBeats", "goodBeats", "misses", "perfectStages", "checkpoints", "completedStages", "heartStamps", "usedCompensation", "newGamePlus", "ending", "grade", "revealEligible"];
  const STAGE_KEYS = ["progress", "elapsed", "compensation", "compensationRemaining", "hits", "perfects", "misses"];

  function validateRunState(state) {
    exactKeys(state, STATE_KEYS, "state");
    if (state.version !== RULES.version) throw new RangeError("unsupported state version");
    if (!["playing", "completed", "failed"].includes(state.status)) throw new RangeError("invalid state status");
    integer(state.stageIndex, "state.stageIndex", 0, STAGES.length);
    exactKeys(state.stage, STAGE_KEYS, "state.stage");
    const target = currentDefinition(state) ? currentDefinition(state).target : 0;
    integer(state.stage.progress, "state.stage.progress", 0, target);
    finite(state.stage.elapsed, "state.stage.elapsed", 0, Number.MAX_SAFE_INTEGER);
    if (typeof state.stage.compensation !== "boolean") throw new TypeError("state.stage.compensation must be boolean");
    finite(state.stage.compensationRemaining, "state.stage.compensationRemaining", 0, RULES.compensationSeconds);
    ["hits", "perfects", "misses"].forEach((key) => integer(state.stage[key], "state.stage." + key, 0, Number.MAX_SAFE_INTEGER));
    integer(state.heartbeat, "state.heartbeat", 0, 100);
    ["combo", "bestCombo", "totalBeats", "perfectBeats", "goodBeats", "misses"].forEach((key) => integer(state[key], "state." + key, 0, Number.MAX_SAFE_INTEGER));
    if (state.bestCombo < state.combo || state.perfectBeats + state.goodBeats + state.misses !== state.totalBeats) throw new RangeError("inconsistent beat counters");
    for (const key of ["perfectStages", "checkpoints", "completedStages", "heartStamps"]) {
      if (!Array.isArray(state[key]) || new Set(state[key]).size !== state[key].length) throw new TypeError("state." + key + " must be a unique array");
      state[key].forEach((id) => { if (!STAGES.some((stage) => stage.id === id)) throw new RangeError("unknown stage id"); });
    }
    if (typeof state.usedCompensation !== "boolean" || typeof state.newGamePlus !== "boolean" || typeof state.revealEligible !== "boolean") throw new TypeError("invalid boolean state field");
    if (state.grade !== null && !GRADES.includes(state.grade)) throw new RangeError("invalid grade");
    if (state.ending !== null && typeof state.ending !== "string") throw new TypeError("invalid ending");
    if (state.status === "playing" && (state.stageIndex === STAGES.length || state.grade !== null || state.ending !== null)) throw new RangeError("inconsistent playing state");
    if (state.status === "completed" && (state.stageIndex !== STAGES.length || state.completedStages.length !== STAGES.length || state.grade === null)) throw new RangeError("inconsistent completed state");
    if (state.status === "failed" && (!state.ending || state.grade !== null)) throw new RangeError("inconsistent failed state");
    return true;
  }

  function calculateRating(state, completed) {
    validateRunState(state);
    const complete = completed === true || state.status === "completed";
    const progress = (state.completedStages.length + (currentDefinition(state) ? state.stage.progress / currentDefinition(state).target : 0)) / STAGES.length;
    const accuracy = state.totalBeats ? (state.perfectBeats + state.goodBeats * 0.6) / state.totalBeats : 0;
    const score = clamp(Math.round(progress * RULES.rating.completionWeight + accuracy * RULES.rating.accuracyWeight + state.heartbeat / 100 * RULES.rating.heartbeatWeight), 0, 100);
    const grade = complete ? (score >= RULES.rating.sScore ? "S" : score >= RULES.rating.aScore ? "A" : "B") : null;
    return deepFreeze({ score, grade, completion: Math.round(progress * 100), accuracy: Math.round(accuracy * 100), heartbeat: state.heartbeat, perfectStageCount: state.perfectStages.length, usedCompensation: state.usedCompensation });
  }

  function finishStage(next) {
    const definition = STAGES[next.stageIndex];
    const ratio = next.stage.hits ? next.stage.perfects / next.stage.hits : 0;
    next.completedStages.push(definition.id);
    if (!next.heartStamps.includes(definition.id)) next.heartStamps.push(definition.id);
    if (ratio >= RULES.perfectThreshold) next.perfectStages.push(definition.id);
    next.stageIndex += 1;
    next.stage = freshStage();
    if (next.stageIndex === STAGES.length) {
      next.status = "completed";
      next.grade = "B";
      const provisional = deepFreeze({ ...next, perfectStages: [...next.perfectStages], checkpoints: [...next.checkpoints], completedStages: [...next.completedStages], heartStamps: [...next.heartStamps] });
      const rating = calculateRating(provisional, true);
      next.grade = rating.grade;
      next.revealEligible = rating.grade === "S" || rating.grade === "A";
      next.ending = rating.grade === "S" ? "心动如约而至" : rating.grade === "A" ? "并肩奔向明天" : "跌撞也算抵达";
    }
  }

  function recordBeat(state, outcome) {
    validateRunState(state);
    if (state.status !== "playing") throw new RangeError("run has ended");
    if (!OUTCOMES.includes(outcome)) throw new RangeError("outcome must be perfect, good, or miss");
    const next = JSON.parse(JSON.stringify(state));
    next.totalBeats += 1;
    next.stage.hits += 1;
    if (outcome === "miss") {
      next.misses += 1; next.stage.misses += 1; next.combo = 0;
      next.heartbeat = clamp(next.heartbeat + RULES.heartbeat.miss, 0, 100);
    } else {
      if (outcome === "perfect") { next.perfectBeats += 1; next.stage.perfects += 1; } else next.goodBeats += 1;
      next.combo += 1; next.bestCombo = Math.max(next.bestCombo, next.combo); next.stage.progress += 1;
      const bonus = Math.min(RULES.heartbeat.comboBonusCap, Math.floor(next.combo / RULES.heartbeat.comboStep) * RULES.heartbeat.comboBonus);
      next.heartbeat = clamp(next.heartbeat + RULES.heartbeat[outcome] + bonus, 0, 100);
      const definition = currentDefinition(next);
      if (next.stage.progress >= definition.checkpoint && !next.checkpoints.includes(definition.id)) next.checkpoints.push(definition.id);
      if (next.stage.progress >= definition.target) finishStage(next);
    }
    if (next.status === "playing" && next.heartbeat === 0) {
      next.status = "failed"; next.ending = STAGES[next.stageIndex].failEnding; next.combo = 0;
    }
    return cloneFreeze(next);
  }

  function advanceTime(state, seconds) {
    validateRunState(state);
    if (state.status !== "playing") throw new RangeError("run has ended");
    finite(seconds, "seconds", 0, Number.MAX_SAFE_INTEGER);
    const next = JSON.parse(JSON.stringify(state));
    const definition = currentDefinition(next);
    if (next.stage.compensation) {
      next.stage.compensationRemaining = round(Math.max(0, next.stage.compensationRemaining - seconds));
      if (next.stage.compensationRemaining === 0) { next.status = "failed"; next.ending = definition.failEnding; next.combo = 0; }
    } else {
      next.stage.elapsed = round(next.stage.elapsed + seconds);
      if (next.stage.elapsed >= definition.duration) {
        next.stage.elapsed = definition.duration;
        if (next.stage.progress >= definition.checkpoint) {
          next.stage.compensation = true; next.stage.compensationRemaining = RULES.compensationSeconds; next.usedCompensation = true;
          const overflow = seconds - (definition.duration - state.stage.elapsed);
          if (overflow > 0) next.stage.compensationRemaining = round(Math.max(0, RULES.compensationSeconds - overflow));
          if (next.stage.compensationRemaining === 0) { next.status = "failed"; next.ending = definition.failEnding; next.combo = 0; }
        } else { next.status = "failed"; next.ending = definition.failEnding; next.combo = 0; }
      }
    }
    return cloneFreeze(next);
  }

  function getStageProgress(state) {
    validateRunState(state);
    const definition = currentDefinition(state);
    if (!definition) return deepFreeze({ stage: null, current: 0, target: 0, percent: 100, checkpointReached: true });
    return deepFreeze({ stage: definition, current: state.stage.progress, target: definition.target, percent: Math.round(state.stage.progress / definition.target * 100), checkpointReached: state.stage.progress >= definition.checkpoint });
  }

  function retryFromCheckpoint(state) {
    validateRunState(state);
    if (state.status !== "failed") throw new RangeError("run has not failed");
    const next = JSON.parse(JSON.stringify(state));
    const definition = currentDefinition(next);
    next.status = "playing"; next.ending = null; next.combo = 0;
    next.heartbeat = Math.max(RULES.initialHeartbeat, next.heartbeat);
    next.stage = freshStage();
    if (state.checkpoints.includes(definition.id)) next.stage.progress = definition.checkpoint;
    return cloneFreeze(next);
  }

  function hashPayload(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function createSave(state, previousSave) {
    validateRunState(state);
    let prior = null;
    if (previousSave !== undefined && previousSave !== null) prior = loadSave(previousSave);
    const completedRuns = (prior ? prior.profile.completedRuns : 0) + (state.status === "completed" ? 1 : 0);
    const bestGrade = [state.grade, prior && prior.profile.bestGrade].filter(Boolean).sort((a, b) => GRADES.indexOf(a) - GRADES.indexOf(b))[0] || null;
    const collectedHeartStamps = [...new Set([...(prior ? prior.profile.collectedHeartStamps : []), ...state.heartStamps])];
    const profile = { completedRuns, bestGrade, revealUnlocked: Boolean((prior && prior.profile.revealUnlocked) || state.revealEligible), newGamePlusUnlocked: completedRuns > 0, collectedHeartStamps };
    const payload = { version: RULES.saveVersion, run: JSON.parse(JSON.stringify(state)), profile };
    return deepFreeze({ ...payload, checksum: hashPayload(JSON.stringify(payload)) });
  }

  function validateSave(save) {
    exactKeys(save, ["version", "run", "profile", "checksum"], "save");
    if (save.version !== RULES.saveVersion) throw new RangeError("unsupported save version");
    exactKeys(save.profile, ["completedRuns", "bestGrade", "revealUnlocked", "newGamePlusUnlocked", "collectedHeartStamps"], "save.profile");
    integer(save.profile.completedRuns, "save.profile.completedRuns", 0, Number.MAX_SAFE_INTEGER);
    if (save.profile.bestGrade !== null && !GRADES.includes(save.profile.bestGrade)) throw new RangeError("invalid best grade");
    if (typeof save.profile.revealUnlocked !== "boolean" || typeof save.profile.newGamePlusUnlocked !== "boolean") throw new TypeError("invalid profile flags");
    if (!Array.isArray(save.profile.collectedHeartStamps) || new Set(save.profile.collectedHeartStamps).size !== save.profile.collectedHeartStamps.length) throw new TypeError("save.profile.collectedHeartStamps must be unique");
    save.profile.collectedHeartStamps.forEach((id) => { if (!STAGES.some((stage) => stage.id === id)) throw new RangeError("unknown heart stamp"); });
    validateRunState(save.run);
    const payload = { version: save.version, run: save.run, profile: save.profile };
    if (save.checksum !== hashPayload(JSON.stringify(payload))) throw new RangeError("save checksum mismatch");
    return true;
  }

  function loadSave(save) { validateSave(save); return cloneFreeze(save); }
  function canStartNewGamePlus(save) { return loadSave(save).profile.newGamePlusUnlocked; }
  function createNewGamePlus(save) { if (!canStartNewGamePlus(save)) throw new RangeError("new game plus is locked"); return createRunState({ newGamePlus: true }); }

  return deepFreeze({ RULES, STAGES, OUTCOMES, GRADES, deepFreeze, createRunState, createState: createRunState, validateRunState, recordBeat, applyBeat: recordBeat, advanceTime, getStageProgress, retryFromCheckpoint, calculateRating, computeRating: calculateRating, createSave, validateSave, loadSave, canStartNewGamePlus, createNewGamePlus });
});
