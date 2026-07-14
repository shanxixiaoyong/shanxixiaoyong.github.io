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

  const LEGACY_VERSIONS = [5, 6];
  const CHECKPOINT_VERSION = 1;

  const STAGES = deepFreeze([
    { index: 0, number: 1, id: "encounter", name: "再遇见", target: 30, checkpoint: 15, expectedSeconds: 180, destination: "图书馆路口", tolerance: { id: "gentle", collisionLoss: 13, missedActionLoss: 4, streakStep: 2, streakCap: 6, retryCondition: 72 } },
    { index: 1, number: 2, id: "familiar", name: "渐渐熟悉", target: 30, checkpoint: 15, expectedSeconds: 180, destination: "桥下书店", tolerance: { id: "open", collisionLoss: 13, missedActionLoss: 4, streakStep: 2, streakCap: 8, retryCondition: 70 } },
    { index: 2, number: 3, id: "first-date", name: "第一次赴约", target: 31, checkpoint: 15, expectedSeconds: 180, destination: "旧城电影院", tolerance: { id: "nervous", collisionLoss: 14, missedActionLoss: 5, streakStep: 2, streakCap: 8, retryCondition: 70 } },
    { index: 3, number: 4, id: "date-night", name: "约会正发生", target: 31, checkpoint: 15, expectedSeconds: 180, destination: "河岸长椅", tolerance: { id: "focused", collisionLoss: 15, missedActionLoss: 5, streakStep: 2, streakCap: 8, retryCondition: 68 } },
    { index: 4, number: 5, id: "everyday", name: "成为日常", target: 32, checkpoint: 16, expectedSeconds: 180, destination: "亮灯的厨房", tolerance: { id: "warm", collisionLoss: 13, missedActionLoss: 4, streakStep: 2, streakCap: 6, retryCondition: 72 } },
    { index: 5, number: 6, id: "after-rain", name: "雨夜之后", target: 32, checkpoint: 16, expectedSeconds: 180, destination: "河桥雨棚", tolerance: { id: "tense", collisionLoss: 15, missedActionLoss: 5, streakStep: 2, streakCap: 8, retryCondition: 70 } },
    { index: 6, number: 7, id: "next-stop", name: "下一站", target: 32, checkpoint: 16, expectedSeconds: 180, destination: "有灯的家", tolerance: { id: "resolved", collisionLoss: 14, missedActionLoss: 5, streakStep: 2, streakCap: 8, retryCondition: 70 } }
  ]);

  const CONDITION_BANDS = deepFreeze([
    { id: "steady", label: "状态稳定", min: 61, max: 100, isDanger: false, isFailed: false },
    { id: "strained", label: "状态吃紧", min: 36, max: 60, isDanger: false, isFailed: false },
    { id: "danger", label: "进入危险", min: 16, max: 35, isDanger: true, isFailed: false },
    { id: "critical", label: "濒临失约", min: 1, max: 15, isDanger: true, isFailed: false },
    { id: "failed", label: "未能抵达", min: 0, max: 0, isDanger: true, isFailed: true }
  ]);

  const RELATIONSHIP_STYLES = deepFreeze({
    unwritten: { id: "unwritten", label: "尚未定型", axis: null },
    attentive: { id: "attentive", label: "留意型", axis: "attention" },
    supportive: { id: "supportive", label: "互助型", axis: "mutuality" },
    restorative: { id: "restorative", label: "修复型", axis: "repair" },
    balanced: { id: "balanced", label: "同行型", axis: "balanced" }
  });

  const RULES = deepFreeze({
    title: "心动跑酷",
    subtitle: "今晚见",
    version: 7,
    compatibleVersions: [...LEGACY_VERSIONS, 7],
    stageCount: STAGES.length,
    startCondition: 100,
    dangerRange: { min: 1, max: 35 },
    criticalRange: { min: 1, max: 15 },
    collisionLoss: STAGES[0].tolerance.collisionLoss,
    missedActionLoss: STAGES[0].tolerance.missedActionLoss,
    consecutiveLossStep: STAGES[0].tolerance.streakStep,
    consecutiveLossCap: STAGES[0].tolerance.streakCap,
    goodRecovery: 5,
    perfectRecovery: 7,
    stageRecovery: 18,
    retryCondition: STAGES[0].tolerance.retryCondition
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function assertSerializable(value, path = "snapshot", seen = new Set()) {
    if (value === null || typeof value === "string" || typeof value === "boolean") return;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new TypeError(`${path} contains a non-finite number`);
      return;
    }
    if (typeof value !== "object") throw new TypeError(`${path} is not JSON serializable`);
    if (seen.has(value)) throw new TypeError(`${path} contains a circular reference`);
    seen.add(value);
    if (Array.isArray(value)) {
      value.forEach((entry, index) => assertSerializable(entry, `${path}[${index}]`, seen));
    } else {
      Object.keys(value).forEach((key) => assertSerializable(value[key], `${path}.${key}`, seen));
    }
    seen.delete(value);
  }

  function cloneSerializable(value, path = "snapshot") {
    assertSerializable(value, path);
    return clone(value);
  }

  function nonNegativeInteger(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : fallback;
  }

  function getConditionStatus(value) {
    const condition = typeof value === "number" ? value : Number(value?.condition ?? value?.heartbeat);
    if (!Number.isFinite(condition)) throw new TypeError("condition must be a finite number or run state");
    if (condition < 0 || condition > 100) throw new RangeError("condition is out of range");
    const id = condition <= 0 ? "failed" : condition <= 15 ? "critical" : condition <= 35 ? "danger" : condition <= 60 ? "strained" : "steady";
    const band = CONDITION_BANDS.find((candidate) => candidate.id === id);
    return deepFreeze({ condition, ...band });
  }

  function emptyLosses(value) {
    return {
      total: nonNegativeInteger(value?.total),
      collision: nonNegativeInteger(value?.collision),
      missedAction: nonNegativeInteger(value?.missedAction),
      streak: nonNegativeInteger(value?.streak),
      events: nonNegativeInteger(value?.events)
    };
  }

  function emptyStorySnapshot(stageIndex = 0) {
    return {
      version: 1,
      stageIndex,
      actIndex: 0,
      cargo: [],
      objectIntegrity: {},
      decisions: {},
      worldState: {},
      relationAxes: { attention: 0, mutuality: 0, repair: 0 }
    };
  }

  function normalizeStorySnapshot(value, stageIndex = 0) {
    const source = value && typeof value === "object"
      ? cloneSerializable(value, "story snapshot")
      : emptyStorySnapshot(stageIndex);
    const cargo = Array.isArray(source.cargo)
      ? source.cargo.map((entry) => ({
        ...entry,
        integrity: Math.min(100, Math.max(0, Number(entry?.integrity ?? 100) || 0))
      }))
      : [];
    const objectIntegrity = source.objectIntegrity && typeof source.objectIntegrity === "object" && !Array.isArray(source.objectIntegrity)
      ? clone(source.objectIntegrity)
      : {};
    cargo.forEach((entry) => {
      if (entry?.itemId) objectIntegrity[entry.itemId] = entry.integrity;
    });
    const worldState = source.worldState && typeof source.worldState === "object" && !Array.isArray(source.worldState)
      ? clone(source.worldState)
      : source.world && typeof source.world === "object" && !Array.isArray(source.world)
        ? clone(source.world)
        : {};
    return {
      ...source,
      version: Math.max(1, nonNegativeInteger(source.version, 1)),
      stageIndex: Number.isInteger(source.stageIndex) ? source.stageIndex : stageIndex,
      actIndex: nonNegativeInteger(source.actIndex),
      cargo,
      objectIntegrity,
      decisions: source.decisions && typeof source.decisions === "object" && !Array.isArray(source.decisions) ? clone(source.decisions) : {},
      worldState,
      relationAxes: {
        attention: Math.max(0, Number(source.relationAxes?.attention) || 0),
        mutuality: Math.max(0, Number(source.relationAxes?.mutuality) || 0),
        repair: Math.max(0, Number(source.relationAxes?.repair) || 0)
      }
    };
  }

  function calculateRelationshipStyle(value) {
    if (!value || typeof value !== "object") throw new TypeError("state or story snapshot is required");
    const story = value.story && typeof value.story === "object" ? value.story : value;
    const scores = {
      attention: Math.max(0, Number(story.relationAxes?.attention) || 0),
      mutuality: Math.max(0, Number(story.relationAxes?.mutuality) || 0),
      repair: Math.max(0, Number(story.relationAxes?.repair) || 0)
    };
    const total = scores.attention + scores.mutuality + scores.repair;
    let definition = RELATIONSHIP_STYLES.unwritten;
    if (total > 0) {
      const maximum = Math.max(scores.attention, scores.mutuality, scores.repair);
      const leaders = Object.keys(scores).filter((axis) => scores[axis] === maximum);
      definition = leaders.length > 1
        ? RELATIONSHIP_STYLES.balanced
        : leaders[0] === "attention"
          ? RELATIONSHIP_STYLES.attentive
          : leaders[0] === "mutuality"
            ? RELATIONSHIP_STYLES.supportive
            : RELATIONSHIP_STYLES.restorative;
    }
    return deepFreeze({ ...definition, scores, total });
  }

  function normalizeRelationshipStyle(value, story) {
    if (!value || typeof value !== "object" || !RELATIONSHIP_STYLES[value.id]) return clone(calculateRelationshipStyle(story));
    return clone(calculateRelationshipStyle(story));
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
      misses: Math.max(0, Number(carry?.misses) || 0),
      items: Array.isArray(carry?.items) ? [...new Set(carry.items)] : [],
      choices: Array.isArray(carry?.choices) ? [...new Set(carry.choices)] : []
    };
  }

  function createCausalSnapshot(state, kind = "checkpoint") {
    return {
      version: CHECKPOINT_VERSION,
      kind,
      stageIndex: state.stageIndex,
      elapsed: Math.max(0, Number(state.elapsed) || 0),
      stage: clone(state.stage),
      completedStages: clone(state.completedStages),
      arrivals: clone(state.arrivals),
      checkpoints: clone(state.checkpoints),
      collectedItems: clone(state.collectedItems),
      routeChoices: clone(state.routeChoices),
      stageRecords: clone(state.stageRecords),
      story: normalizeStorySnapshot(state.story, state.stageIndex),
      relationshipStyle: clone(calculateRelationshipStyle(state.story))
    };
  }

  function normalizeCausalSnapshot(value, state, sourceVersion) {
    if (value && typeof value === "object") {
      const snapshot = cloneSerializable(value, "checkpoint snapshot");
      const stageIndex = Number.isInteger(snapshot.stageIndex) ? snapshot.stageIndex : state.stageIndex;
      if (stageIndex < 0 || stageIndex >= STAGES.length) throw new RangeError("invalid checkpoint stage index");
      const story = normalizeStorySnapshot(snapshot.story, stageIndex);
      return {
        version: CHECKPOINT_VERSION,
        kind: ["stage-start", "checkpoint", "legacy-anchor"].includes(snapshot.kind) ? snapshot.kind : "checkpoint",
        stageIndex,
        elapsed: Math.max(0, Number(snapshot.elapsed) || 0),
        stage: stageState(stageIndex, snapshot.stage),
        completedStages: Array.isArray(snapshot.completedStages) ? [...snapshot.completedStages] : [],
        arrivals: Array.isArray(snapshot.arrivals) ? [...snapshot.arrivals] : [],
        checkpoints: Array.isArray(snapshot.checkpoints) ? [...snapshot.checkpoints] : [],
        collectedItems: Array.isArray(snapshot.collectedItems) ? [...snapshot.collectedItems] : [],
        routeChoices: Array.isArray(snapshot.routeChoices) ? [...snapshot.routeChoices] : [],
        stageRecords: Array.isArray(snapshot.stageRecords) ? clone(snapshot.stageRecords) : [],
        story,
        relationshipStyle: normalizeRelationshipStyle(snapshot.relationshipStyle, story)
      };
    }

    const definition = STAGES[state.stageIndex];
    const checkpointReached = state.stage.progress >= definition.checkpoint || state.checkpoints.includes(definition.id);
    if (sourceVersion && sourceVersion < RULES.version) {
      const migrated = createCausalSnapshot(state, "legacy-anchor");
      if (!checkpointReached) {
        migrated.stage = stageState(state.stageIndex);
        migrated.elapsed = Math.max(0, state.elapsed - state.stage.elapsed);
        migrated.collectedItems = state.collectedItems.filter((itemId) => !state.stage.items.includes(itemId));
        migrated.routeChoices = state.routeChoices.filter((choiceId) => !state.stage.choices.includes(choiceId));
        migrated.story = emptyStorySnapshot(state.stageIndex);
        migrated.relationshipStyle = clone(calculateRelationshipStyle(migrated.story));
      } else {
        migrated.stage = stageState(state.stageIndex, {
          ...state.stage,
          progress: definition.checkpoint,
          elapsed: Math.min(state.stage.elapsed, definition.expectedSeconds * definition.checkpoint / definition.target)
        });
      }
      return migrated;
    }
    return createCausalSnapshot(state, checkpointReached ? "checkpoint" : "stage-start");
  }

  function restoreCausalSnapshot(next, snapshot) {
    next.stageIndex = snapshot.stageIndex;
    next.elapsed = snapshot.elapsed;
    next.stage = stageState(snapshot.stageIndex, snapshot.stage);
    next.completedStages = clone(snapshot.completedStages);
    next.arrivals = clone(snapshot.arrivals);
    next.checkpoints = clone(snapshot.checkpoints);
    next.collectedItems = clone(snapshot.collectedItems);
    next.routeChoices = clone(snapshot.routeChoices);
    next.stageRecords = clone(snapshot.stageRecords);
    next.story = normalizeStorySnapshot(snapshot.story, snapshot.stageIndex);
    next.relationshipStyle = normalizeRelationshipStyle(snapshot.relationshipStyle, next.story);
  }

  function syncCondition(next) {
    next.condition = Math.min(100, Math.max(0, Number(next.condition) || 0));
    next.heartbeat = next.condition;
    next.conditionBand = getConditionStatus(next.condition).id;
  }

  function failureStage(next) {
    const definition = STAGES[next.stageIndex];
    const checkpointReached = next.stage.progress >= definition.checkpoint || next.checkpoints.includes(definition.id);
    return {
      index: definition.index,
      number: definition.number,
      id: definition.id,
      name: definition.name,
      destination: definition.destination,
      progress: next.stage.progress,
      checkpoint: definition.checkpoint,
      target: definition.target,
      checkpointReached
    };
  }

  function buildFailure(next, legacy = false) {
    const definition = STAGES[next.stageIndex];
    const stage = failureStage(next);
    const lossSource = next.lastLoss?.source || ((next.collisions || 0) > 0 ? "collision" : "missed-action");
    const reason = legacy
      ? "legacy-condition-depleted"
      : next.missStreak > 1 ? "consecutive-misses" : lossSource;
    const messages = {
      "consecutive-misses": "连续失误耗尽了状态",
      collision: "碰撞耗尽了状态",
      "missed-action": "失误耗尽了状态",
      "legacy-condition-depleted": "状态已经耗尽"
    };
    return {
      code: "condition-depleted",
      reason,
      message: messages[reason],
      lossSource,
      condition: 0,
      missStreak: next.missStreak,
      attempt: next.totalAttempts,
      stage,
      loss: next.lastLoss,
      losses: clone(next.losses),
      retry: {
        progress: stage.checkpointReached ? definition.checkpoint : 0,
        condition: definition.tolerance.retryCondition
      }
    };
  }

  function normalizeRunState(state) {
    const next = clone(state);
    const sourceVersion = next.version;
    next.version = RULES.version;
    next.condition = Number(next.condition ?? next.heartbeat);
    next.heartbeat = next.condition;
    next.conditionBand = getConditionStatus(next.condition).id;
    next.missStreak = nonNegativeInteger(next.missStreak);
    next.maxMissStreak = Math.max(next.missStreak, nonNegativeInteger(next.maxMissStreak));
    next.losses = emptyLosses(next.losses);
    next.lastLoss = next.lastLoss && typeof next.lastLoss === "object" ? clone(next.lastLoss) : null;
    next.failure = next.failure && typeof next.failure === "object" ? clone(next.failure) : null;
    next.failureHistory = Array.isArray(next.failureHistory) ? clone(next.failureHistory) : [];
    next.retryCount = nonNegativeInteger(next.retryCount);
    next.stage = stageState(next.stageIndex, {
      ...next.stage,
      misses: next.stage?.misses ?? Math.max(0, (Number(next.stage?.attempts) || 0) - (Number(next.stage?.progress) || 0))
    });
    next.story = normalizeStorySnapshot(next.story, next.stageIndex);
    next.relationshipStyle = normalizeRelationshipStyle(next.relationshipStyle, next.story);
    next.checkpointSnapshot = normalizeCausalSnapshot(next.checkpointSnapshot, next, sourceVersion);
    if (next.status === "failed" && !next.failure) {
      next.failure = buildFailure(next, true);
      next.failureHistory.push(clone(next.failure));
    }
    return next;
  }

  function createRunState(options = {}) {
    const state = {
      version: RULES.version,
      status: "playing",
      stageIndex: 0,
      condition: RULES.startCondition,
      heartbeat: RULES.startCondition,
      conditionBand: getConditionStatus(RULES.startCondition).id,
      combo: 0,
      bestCombo: 0,
      missStreak: 0,
      maxMissStreak: 0,
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
      losses: emptyLosses(),
      lastLoss: null,
      failure: null,
      failureHistory: [],
      retryCount: 0,
      story: emptyStorySnapshot(0),
      checkpointSnapshot: null,
      relationshipStyle: null,
      grade: null,
      ending: null,
      newGamePlus: Boolean(options.newGamePlus)
    };
    state.relationshipStyle = clone(calculateRelationshipStyle(state.story));
    state.checkpointSnapshot = createCausalSnapshot(state, "stage-start");
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
    const current = normalizeRunState(state);
    const attempts = Math.max(1, Number(current.totalAttempts) || 0);
    const accuracy = Math.round((Number(current.successfulMoments) || 0) / attempts * 100);
    const activeProgress = current.status === "completed" ? 0 : (current.stage?.progress || 0) / Math.max(1, current.stage?.target || 1);
    const completion = Math.round(((current.completedStages?.length || 0) + activeProgress) / STAGES.length * 100);
    const completed = completedOverride === undefined ? current.status === "completed" : Boolean(completedOverride);
    let grade = "B";
    if (completed && accuracy >= 90 && (current.collisions || 0) <= 3 && (current.collectedItems?.length || 0) >= 18) grade = "S";
    else if (completed && accuracy >= 72 && (current.condition || current.heartbeat || 0) >= 35) grade = "A";
    return deepFreeze({
      grade,
      completion: Math.min(100, completion),
      accuracy: Math.min(100, accuracy),
      condition: Number(current.condition ?? current.heartbeat) || 0,
      heartbeat: Number(current.condition ?? current.heartbeat) || 0,
      conditionBand: current.conditionBand,
      items: current.collectedItems?.length || 0,
      collisions: current.collisions || 0,
      bestCombo: current.bestCombo || 0,
      arrivals: current.arrivals?.length || 0
    });
  }

  function completeStage(next) {
    const definition = STAGES[next.stageIndex];
    const relationshipStyle = clone(calculateRelationshipStyle(next.story));
    next.completedStages.push(definition.id);
    next.arrivals.push(definition.destination);
    next.stageRecords.push({
      id: definition.id,
      destination: definition.destination,
      items: next.stage.items.slice(),
      choices: next.stage.choices.slice(),
      attempts: next.stage.attempts,
      perfect: next.stage.perfect,
      misses: next.stage.misses,
      elapsed: next.stage.elapsed,
      relationshipStyle
    });
    next.relationshipStyle = relationshipStyle;
    next.condition = Math.min(100, next.condition + RULES.stageRecovery);
    syncCondition(next);
    if (next.stageIndex === STAGES.length - 1) {
      next.status = "completed";
      next.grade = calculateRating(next, true).grade;
      next.ending = next.grade;
      return;
    }
    next.stageIndex += 1;
    next.stage = stageState(next.stageIndex);
    next.checkpointSnapshot = createCausalSnapshot(next, "stage-start");
  }

  function recordMoment(state, value) {
    assertPlaying(state);
    const moment = normalizeMoment(value);
    const outcome = moment.outcome || "good";
    if (!["perfect", "good", "miss"].includes(outcome)) throw new RangeError(`unknown outcome: ${outcome}`);
    const next = normalizeRunState(state);
    next.totalAttempts += 1;
    next.stage.attempts += 1;
    if (outcome === "miss") {
      const definition = STAGES[next.stageIndex];
      const tolerance = definition.tolerance;
      const source = moment.kind === "collision" ? "collision" : "missed-action";
      const baseAmount = source === "collision" ? tolerance.collisionLoss : tolerance.missedActionLoss;
      next.missStreak += 1;
      next.maxMissStreak = Math.max(next.maxMissStreak, next.missStreak);
      next.stage.misses += 1;
      const streakAmount = Math.min((next.missStreak - 1) * tolerance.streakStep, tolerance.streakCap);
      const conditionBefore = next.condition;
      const amount = Math.min(conditionBefore, baseAmount + streakAmount);
      const appliedStreakAmount = Math.max(0, amount - Math.min(amount, baseAmount));
      next.condition = conditionBefore - amount;
      next.combo = 0;
      if (source === "collision") next.collisions += 1;
      next.losses.total += amount;
      next.losses[source === "collision" ? "collision" : "missedAction"] += amount;
      next.losses.streak += appliedStreakAmount;
      next.losses.events += 1;
      next.lastLoss = {
        source,
        amount,
        baseAmount,
        streakAmount: appliedStreakAmount,
        missStreak: next.missStreak,
        conditionBefore,
        conditionAfter: next.condition,
        stageId: definition.id,
        stageIndex: definition.index,
        attempt: next.totalAttempts
      };
      syncCondition(next);
      if (next.condition <= 0) {
        next.status = "failed";
        next.ending = "这次没能准时抵达";
        next.failure = buildFailure(next);
        next.failureHistory.push(clone(next.failure));
      }
      return deepFreeze(next);
    }

    next.successfulMoments += 1;
    next.missStreak = 0;
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
    syncCondition(next);
    if (moment.itemId) {
      if (!next.collectedItems.includes(moment.itemId)) next.collectedItems.push(moment.itemId);
      if (!next.stage.items.includes(moment.itemId)) next.stage.items.push(moment.itemId);
    }
    if (moment.choiceId) {
      if (!next.routeChoices.includes(moment.choiceId)) next.routeChoices.push(moment.choiceId);
      if (!next.stage.choices.includes(moment.choiceId)) next.stage.choices.push(moment.choiceId);
    }
    const definition = STAGES[next.stageIndex];
    if (next.stage.progress >= definition.checkpoint && !next.checkpoints.includes(definition.id)) {
      next.checkpoints.push(definition.id);
      next.checkpointSnapshot = createCausalSnapshot(next, "checkpoint");
    }
    if (next.stage.progress >= definition.target) completeStage(next);
    return deepFreeze(next);
  }

  function recordBeat(state, outcome) {
    return recordMoment(state, { outcome });
  }

  function recordNearMiss(state) {
    assertPlaying(state);
    const next = normalizeRunState(state);
    next.nearMisses += 1;
    next.missStreak = 0;
    next.condition = Math.min(100, next.condition + 1);
    syncCondition(next);
    return deepFreeze(next);
  }

  function advanceTime(state, seconds) {
    assertPlaying(state);
    if (!Number.isFinite(seconds) || seconds < 0) throw new TypeError("seconds must be a non-negative finite number");
    const next = normalizeRunState(state);
    next.elapsed += seconds;
    next.stage.elapsed += seconds;
    return deepFreeze(next);
  }

  function commitStoryState(state, snapshot, options = {}) {
    if (!state || typeof state !== "object") throw new TypeError("state is required");
    if (!snapshot || typeof snapshot !== "object") throw new TypeError("story snapshot is required");
    if (!options || typeof options !== "object") throw new TypeError("options must be an object");
    const next = normalizeRunState(state);
    next.story = normalizeStorySnapshot(snapshot, next.stageIndex);
    next.relationshipStyle = clone(calculateRelationshipStyle(next.story));
    const definition = STAGES[next.stageIndex];
    const atCheckpoint = next.stage.progress === definition.checkpoint && next.checkpoints.includes(definition.id);
    const atStageStart = next.stage.progress === 0 && next.checkpointSnapshot?.kind === "stage-start";
    if (options.checkpoint === true && !atCheckpoint) throw new RangeError("story checkpoint can only be committed at the stage checkpoint");
    if (options.stageStart === true && !atStageStart) throw new RangeError("story stage start can only be committed before stage progress");
    if (options.checkpoint === true || (atCheckpoint && next.checkpointSnapshot?.kind === "checkpoint")) {
      next.checkpointSnapshot = createCausalSnapshot(next, "checkpoint");
    } else if (options.stageStart === true) {
      next.checkpointSnapshot = createCausalSnapshot(next, "stage-start");
    }
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
    const next = normalizeRunState(state);
    const failureHistory = clone(next.failureHistory);
    const retryCount = next.retryCount + 1;
    restoreCausalSnapshot(next, next.checkpointSnapshot);
    const definition = STAGES[next.stageIndex];
    next.status = "playing";
    next.ending = null;
    next.grade = null;
    next.failure = null;
    next.failureHistory = failureHistory;
    next.lastLoss = null;
    next.retryCount = retryCount;
    next.condition = definition.tolerance.retryCondition;
    syncCondition(next);
    next.combo = 0;
    next.missStreak = 0;
    return deepFreeze(next);
  }

  function getFailureInfo(state) {
    if (!state || typeof state !== "object") throw new TypeError("state is required");
    const failure = normalizeRunState(state).failure;
    return failure ? deepFreeze(clone(failure)) : null;
  }

  function checksum(payload) {
    const text = JSON.stringify(payload);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
    return (hash >>> 0).toString(36);
  }

  function validateRelationshipStyleValue(value, story) {
    if (!value || typeof value !== "object" || !RELATIONSHIP_STYLES[value.id]) throw new RangeError("invalid relationship style");
    const expected = calculateRelationshipStyle(story);
    if (JSON.stringify(value) !== JSON.stringify(expected)) throw new RangeError("relationship style does not match story state");
  }

  function validateCausalSnapshot(snapshot, state) {
    if (!snapshot || typeof snapshot !== "object" || snapshot.version !== CHECKPOINT_VERSION) throw new RangeError("invalid checkpoint snapshot");
    if (!["stage-start", "checkpoint", "legacy-anchor"].includes(snapshot.kind)) throw new RangeError("invalid checkpoint kind");
    if (snapshot.stageIndex !== state.stageIndex) throw new RangeError("checkpoint stage mismatch");
    const definition = STAGES[snapshot.stageIndex];
    if (!snapshot.stage || snapshot.stage.id !== definition.id) throw new RangeError("invalid checkpoint stage state");
    if (!Number.isFinite(snapshot.stage.progress) || snapshot.stage.progress < 0 || snapshot.stage.progress > definition.target) throw new RangeError("invalid checkpoint progress");
    for (const key of ["completedStages", "arrivals", "checkpoints", "collectedItems", "routeChoices", "stageRecords"]) {
      if (!Array.isArray(snapshot[key])) throw new RangeError("invalid checkpoint collections");
    }
    try {
      assertSerializable(snapshot.story, "checkpoint story");
    } catch (error) {
      throw new RangeError(error.message);
    }
    validateRelationshipStyleValue(snapshot.relationshipStyle, snapshot.story);
  }

  function validateRunState(state) {
    if (!state || typeof state !== "object" || !RULES.compatibleVersions.includes(state.version)) throw new RangeError("invalid run state version");
    if (!["playing", "failed", "completed"].includes(state.status)) throw new RangeError("invalid run status");
    if (!Number.isInteger(state.stageIndex) || state.stageIndex < 0 || state.stageIndex >= STAGES.length) throw new RangeError("invalid stage index");
    if (!Number.isFinite(state.condition) || state.condition < 0 || state.condition > 100) throw new RangeError("invalid condition");
    if (state.heartbeat !== state.condition) throw new RangeError("condition alias mismatch");
    if (!state.stage || typeof state.stage !== "object") throw new RangeError("invalid stage state");
    const definition = STAGES[state.stageIndex];
    if (!Number.isFinite(state.stage.progress) || state.stage.progress < 0 || state.stage.progress > definition.target) throw new RangeError("invalid stage progress");
    if (!Number.isFinite(state.stage.elapsed) || state.stage.elapsed < 0) throw new RangeError("invalid stage elapsed time");
    for (const key of ["completedStages", "arrivals", "checkpoints", "collectedItems", "routeChoices", "stageRecords"]) {
      if (!Array.isArray(state[key])) throw new RangeError("invalid journey collections");
    }
    if (state.version === RULES.version) {
      if (state.conditionBand !== getConditionStatus(state.condition).id) throw new RangeError("condition band mismatch");
      for (const key of ["missStreak", "maxMissStreak", "retryCount"]) {
        if (!Number.isSafeInteger(state[key]) || state[key] < 0) throw new RangeError(`invalid ${key}`);
      }
      if (state.maxMissStreak < state.missStreak) throw new RangeError("invalid miss streak counters");
      if (!Number.isSafeInteger(state.stage.misses) || state.stage.misses < 0) throw new RangeError("invalid stage misses");
      if (!state.losses || typeof state.losses !== "object") throw new RangeError("invalid loss totals");
      for (const key of ["total", "collision", "missedAction", "streak", "events"]) {
        if (!Number.isSafeInteger(state.losses[key]) || state.losses[key] < 0) throw new RangeError(`invalid loss total: ${key}`);
      }
      if (state.losses.total !== state.losses.collision + state.losses.missedAction || state.losses.streak > state.losses.total) throw new RangeError("inconsistent loss totals");
      if (state.lastLoss !== null && (!state.lastLoss || !["collision", "missed-action"].includes(state.lastLoss.source))) throw new RangeError("invalid last loss");
      if (!Array.isArray(state.failureHistory)) throw new RangeError("invalid failure history");
      if (state.failure !== null && (!state.failure || state.failure.code !== "condition-depleted")) throw new RangeError("invalid failure data");
      if (state.status === "failed" && (state.condition !== 0 || !state.failure)) throw new RangeError("inconsistent failed state");
      if (state.status !== "failed" && state.failure !== null) throw new RangeError("inactive run has active failure data");
      try {
        assertSerializable(state.story, "story snapshot");
      } catch (error) {
        throw new RangeError(error.message);
      }
      validateRelationshipStyleValue(state.relationshipStyle, state.story);
      validateCausalSnapshot(state.checkpointSnapshot, state);
    }
    return true;
  }

  function createSave(state, previous) {
    validateRunState(state);
    const current = normalizeRunState(state);
    validateRunState(current);
    const oldProfile = previous ? loadSave(previous).profile : {};
    const completed = current.status === "completed";
    const profile = {
      completedRuns: (oldProfile.completedRuns || 0) + (completed ? 1 : 0),
      bestGrade: completed ? (["B", "A", "S"].indexOf(current.grade) > ["B", "A", "S"].indexOf(oldProfile.bestGrade) ? current.grade : oldProfile.bestGrade || current.grade) : oldProfile.bestGrade || null,
      discoveredItems: [...new Set([...(oldProfile.discoveredItems || []), ...current.collectedItems])],
      visitedDestinations: [...new Set([...(oldProfile.visitedDestinations || []), ...current.arrivals])],
      newGamePlusUnlocked: Boolean(oldProfile.newGamePlusUnlocked || completed)
    };
    const payload = { version: RULES.version, run: clone(current), profile };
    return deepFreeze({ ...payload, signature: checksum(payload) });
  }

  function validateSave(save) {
    if (!save || typeof save !== "object" || !RULES.compatibleVersions.includes(save.version) || !save.run || !save.profile) throw new RangeError("invalid save");
    if (save.run.version !== save.version) throw new RangeError("save version mismatch");
    const payload = { version: save.version, run: save.run, profile: save.profile };
    if (checksum(payload) !== save.signature) throw new RangeError("save signature mismatch");
    validateRunState(save.run);
    if (!Number.isSafeInteger(save.profile.completedRuns) || save.profile.completedRuns < 0) throw new RangeError("invalid save profile");
    if (!Array.isArray(save.profile.discoveredItems) || !Array.isArray(save.profile.visitedDestinations)) throw new RangeError("invalid save profile collections");
    if (typeof save.profile.newGamePlusUnlocked !== "boolean") throw new RangeError("invalid save profile flags");
    return true;
  }

  function loadSave(save) {
    validateSave(save);
    const payload = { version: RULES.version, run: normalizeRunState(save.run), profile: clone(save.profile) };
    return deepFreeze({ ...payload, signature: checksum(payload) });
  }

  function canStartNewGamePlus(save) {
    return Boolean(loadSave(save).profile.newGamePlusUnlocked);
  }

  function createNewGamePlus(save) {
    if (!canStartNewGamePlus(save)) throw new RangeError("new game plus is locked");
    return createRunState({ newGamePlus: true });
  }

  return deepFreeze({
    RULES,
    STAGES,
    CONDITION_BANDS,
    RELATIONSHIP_STYLES,
    createRunState,
    recordMoment,
    recordBeat,
    recordNearMiss,
    advanceTime,
    commitStoryState,
    getStageProgress,
    getConditionStatus,
    getFailureInfo,
    calculateRating,
    calculateRelationshipStyle,
    retryFromCheckpoint,
    validateRunState,
    createSave,
    validateSave,
    loadSave,
    canStartNewGamePlus,
    createNewGamePlus
  });
});
