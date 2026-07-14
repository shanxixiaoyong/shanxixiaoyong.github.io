(function (root, factory) {
  const director = factory();
  if (typeof module === "object" && module.exports) module.exports = director;
  else root.RunnerLoveDirector = director;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = 2;
  const LANES = Object.freeze([-1, 0, 1]);
  const PRIORITY = Object.freeze({ ambience: 20, act: 40, interaction: 60, safety: 80, cinematic: 100 });
  const RELATION_ARCS = Object.freeze([
    Object.freeze({ storyId: "first-sight", ruleId: "encounter", verb: "notice", relation: "distant-recognized", mechanic: "detour", worldEffect: "reflection-clear", repairEffect: "retrieve-and-dry" }),
    Object.freeze({ storyId: "familiar-steps", ruleId: "familiar", verb: "adjust", relation: "recognized-in-rhythm", mechanic: "thread", worldEffect: "motif-connect", repairEffect: "wait-and-rejoin" }),
    Object.freeze({ storyId: "first-date", ruleId: "first-date", verb: "keep-promise", relation: "in-rhythm-reliable", mechanic: "deadline", worldEffect: "door-hold", repairEffect: "take-the-long-way" }),
    Object.freeze({ storyId: "heart-spoken", ruleId: "date-night", verb: "move-together", relation: "reliable-mutual", mechanic: "sync", worldEffect: "shared-beat", repairEffect: "find-each-other" }),
    Object.freeze({ storyId: "shared-days", ruleId: "everyday", verb: "notice-the-change", relation: "mutual-misaligned", mechanic: "care", worldEffect: "home-fill", repairEffect: "gather-and-carry" }),
    Object.freeze({ storyId: "rough-weather", ruleId: "after-rain", verb: "repair", relation: "misaligned-listening", mechanic: "repair", worldEffect: "storm-settle", repairEffect: "slow-down-and-listen" }),
    Object.freeze({ storyId: "toward-home", ruleId: "next-stop", verb: "share-the-weight", relation: "listening-together", mechanic: "handoff", worldEffect: "routes-converge", repairEffect: "take-the-weight" })
  ]);

  const ACT_ACTIONS = Object.freeze([
    Object.freeze(["switch", "jump", "slide"]),
    Object.freeze(["switch", "jump", "slide"]),
    Object.freeze(["slide", "switch", "jump"]),
    Object.freeze(["switch", "jump", "slide"]),
    Object.freeze(["switch", "slide", "jump"]),
    Object.freeze(["switch", "slide", "jump"]),
    Object.freeze(["switch", "jump", "slide"])
  ]);
  const STREAK_REWARDS = Object.freeze([
    Object.freeze({ op: "rush", key: "earned-rush", speedBoost: 2.6 }),
    Object.freeze({ op: "cadence", key: "matched-cadence", speedBoost: 0.7 }),
    Object.freeze({ op: "rush", key: "keep-the-promise", speedBoost: 3.1 }),
    Object.freeze({ op: "sync", key: "shared-rhythm", speedBoost: 1.1 }),
    Object.freeze({ op: "carry", key: "careful-carry", speedBoost: 0.35 }),
    Object.freeze({ op: "settle", key: "make-room-to-listen", paceScale: 0.76 }),
    Object.freeze({ op: "handoff", key: "share-the-weight", speedBoost: 0.85 })
  ]);
  const SEMANTIC_CHOREOGRAPHY = Object.freeze([
    Object.freeze([
      Object.freeze({ key: "leave-the-crowd", steps: Object.freeze(["switch", "slide"]), required: 2, axis: "attention", relationshipMode: "absent" }),
      Object.freeze({ key: "protect-the-offering", steps: Object.freeze(["jump", "switch", "slide"]), required: 3, axis: "attention", relationshipMode: "parallel-left" }),
      Object.freeze({ key: "stop-at-the-crossing", steps: Object.freeze(["slide", "switch"]), required: 2, axis: "attention", relationshipMode: "wait-left" })
    ]),
    Object.freeze([
      Object.freeze({ key: "make-room", steps: Object.freeze(["switch", "jump"]), required: 2, axis: "attention", relationshipMode: "parallel-left" }),
      Object.freeze({ key: "match-the-rhythm", steps: Object.freeze(["jump", "slide", "switch"]), required: 3, axis: "mutuality", relationshipMode: "pace-left" }),
      Object.freeze({ key: "hold-the-door", steps: Object.freeze(["switch", "slide"]), required: 2, axis: "mutuality", relationshipMode: "wait-left" })
    ]),
    Object.freeze([
      Object.freeze({ key: "keep-the-route", steps: Object.freeze(["switch", "slide", "jump"]), required: 3, axis: "attention", relationshipMode: "parallel-right" }),
      Object.freeze({ key: "protect-the-promise", steps: Object.freeze(["jump", "slide", "switch"]), required: 3, axis: "mutuality", relationshipMode: "yield-right" }),
      Object.freeze({ key: "arrive-before-dark", steps: Object.freeze(["switch", "jump"]), required: 2, axis: "mutuality", relationshipMode: "handoff-right" })
    ]),
    Object.freeze([
      Object.freeze({ key: "share-the-last-bite", steps: Object.freeze(["switch", "slide", "switch"]), required: 3, axis: "mutuality", relationshipMode: "close-left" }),
      Object.freeze({ key: "move-on-the-chorus", steps: Object.freeze(["jump", "jump", "slide"]), required: 3, axis: "mutuality", relationshipMode: "sync-right" }),
      Object.freeze({ key: "stay-after-the-noise", steps: Object.freeze(["switch", "jump", "slide"]), required: 3, axis: "attention", relationshipMode: "close-left" })
    ]),
    Object.freeze([
      Object.freeze({ key: "carry-both-breakfasts", steps: Object.freeze(["switch", "slide", "switch"]), required: 3, axis: "mutuality", relationshipMode: "routine-right" }),
      Object.freeze({ key: "notice-the-other-clock", steps: Object.freeze(["jump", "switch", "jump"]), required: 3, axis: "attention", relationshipMode: "misalign-left" }),
      Object.freeze({ key: "recognize-the-empty-places", steps: Object.freeze(["slide", "jump", "switch"]), required: 3, axis: "attention", relationshipMode: "missed-right" })
    ]),
    Object.freeze([
      Object.freeze({ key: "release-the-script", steps: Object.freeze(["slide", "jump", "switch"]), required: 3, axis: "repair", relationshipMode: "express-ahead" }),
      Object.freeze({ key: "choose-the-slow-side", steps: Object.freeze(["switch", "slide", "switch"]), required: 3, axis: "repair", relationshipMode: "listen-left" }),
      Object.freeze({ key: "listen-then-move-the-chain", steps: Object.freeze(["slide", "switch", "jump"]), required: 3, axis: "repair", relationshipMode: "clear-obstacle" })
    ]),
    Object.freeze([
      Object.freeze({ key: "handoff-the-weight", steps: Object.freeze(["switch", "slide", "switch"]), required: 3, axis: "mutuality", relationshipMode: "luggage-handoff" }),
      Object.freeze({ key: "six-actions-in-two-lanes", steps: Object.freeze(["switch", "jump", "slide", "switch", "jump", "slide"]), required: 6, axis: "mutuality", relationshipMode: "luggage-left" }),
      Object.freeze({ key: "open-two-locks", steps: Object.freeze(["switch", "slide", "switch"]), required: 3, axis: "repair", relationshipMode: "home-together" })
    ])
  ]);

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.keys(value).forEach((key) => deepFreeze(value[key]));
      Object.freeze(value);
    }
    return value;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, Number(value) || 0));
  }

  function normalizeStage(value) {
    return Math.min(RELATION_ARCS.length - 1, Math.max(0, Math.trunc(Number(value) || 0)));
  }

  function normalizeAct(value) {
    return Math.min(2, Math.max(0, Math.trunc(Number(value) || 0)));
  }

  function emptyState() {
    return {
      version: VERSION,
      stageIndex: 0,
      stageId: RELATION_ARCS[0].storyId,
      actIndex: 0,
      actId: null,
      attemptId: 1,
      spawnOrdinal: 0,
      elapsed: 0,
      actionStreak: 0,
      bestActionStreak: 0,
      cleanActions: 0,
      strainedActions: 0,
      recoveredActions: 0,
      processedFactIds: [],
      resolvedCauseIds: [],
      committedBeatIds: [],
      missedBeatIds: [],
      decisions: {},
      memories: {},
      cargo: [],
      pendingRepair: null,
      commandOrdinal: 0,
      relationAxes: { attention: 0, mutuality: 0, repair: 0 },
      actMilestones: {},
      worldState: { branch: null, actStates: {} },
      flags: [],
      factLog: []
    };
  }

  function normalizeState(input) {
    const base = emptyState();
    const source = input && typeof input === "object" ? clone(input) : {};
    const stageIndex = normalizeStage(source.stageIndex);
    const next = {
      ...base,
      ...source,
      version: VERSION,
      stageIndex,
      stageId: RELATION_ARCS[stageIndex].storyId,
      actIndex: normalizeAct(source.actIndex),
      attemptId: Math.max(1, Math.trunc(Number(source.attemptId) || 1)),
      spawnOrdinal: Math.max(0, Math.trunc(Number(source.spawnOrdinal) || 0)),
      elapsed: Math.max(0, Number(source.elapsed) || 0),
      actionStreak: Math.max(0, Math.trunc(Number(source.actionStreak) || 0)),
      bestActionStreak: Math.max(0, Math.trunc(Number(source.bestActionStreak) || 0)),
      cleanActions: Math.max(0, Math.trunc(Number(source.cleanActions) || 0)),
      strainedActions: Math.max(0, Math.trunc(Number(source.strainedActions) || 0)),
      recoveredActions: Math.max(0, Math.trunc(Number(source.recoveredActions) || 0)),
      processedFactIds: Array.isArray(source.processedFactIds) ? source.processedFactIds.slice(-512) : [],
      resolvedCauseIds: Array.isArray(source.resolvedCauseIds) ? source.resolvedCauseIds.slice(-256) : [],
      committedBeatIds: Array.isArray(source.committedBeatIds) ? [...new Set(source.committedBeatIds)] : [],
      missedBeatIds: Array.isArray(source.missedBeatIds) ? [...new Set(source.missedBeatIds)] : [],
      decisions: source.decisions && typeof source.decisions === "object" ? source.decisions : {},
      memories: source.memories && typeof source.memories === "object" ? source.memories : {},
      cargo: Array.isArray(source.cargo) ? source.cargo.map((entry) => ({ ...entry, integrity: clamp(entry.integrity ?? 100, 0, 100) })).slice(-4) : [],
      relationAxes: {
        attention: Math.max(0, Number(source.relationAxes?.attention) || 0),
        mutuality: Math.max(0, Number(source.relationAxes?.mutuality) || 0),
        repair: Math.max(0, Number(source.relationAxes?.repair) || 0)
      },
      actMilestones: source.actMilestones && typeof source.actMilestones === "object" ? source.actMilestones : {},
      worldState: source.worldState && typeof source.worldState === "object"
        ? source.worldState
        : { branch: null, actStates: {} },
      flags: Array.isArray(source.flags) ? [...new Set(source.flags)] : [],
      factLog: Array.isArray(source.factLog) ? source.factLog.slice(-128) : []
    };
    next.bestActionStreak = Math.max(next.bestActionStreak, next.actionStreak);
    return next;
  }

  function stableFactId(fact, state) {
    if (fact.id !== undefined && fact.id !== null) return String(fact.id);
    if (fact.seq !== undefined && fact.seq !== null) return `engine:${fact.seq}`;
    return `${fact.type || "fact"}:${state.stageIndex}:${state.actIndex}:${fact.causeId || fact.choiceGroup || fact.itemId || state.commandOrdinal + 1}`;
  }

  function createDirector(options = {}) {
    let state = normalizeState(options.state);
    let commands = [];

    function arc() {
      return RELATION_ARCS[state.stageIndex];
    }

    function choreography(stageIndex = state.stageIndex, actIndex = state.actIndex) {
      return SEMANTIC_CHOREOGRAPHY[normalizeStage(stageIndex)][normalizeAct(actIndex)];
    }

    function milestoneKey(stageIndex = state.stageIndex, actIndex = state.actIndex) {
      return `${normalizeStage(stageIndex)}:${normalizeAct(actIndex)}`;
    }

    function ensureMilestone(stageIndex = state.stageIndex, actIndex = state.actIndex) {
      const key = milestoneKey(stageIndex, actIndex);
      const definition = choreography(stageIndex, actIndex);
      if (!state.actMilestones[key]) {
        state.actMilestones[key] = {
          key: definition.key,
          stageIndex: normalizeStage(stageIndex),
          actIndex: normalizeAct(actIndex),
          sequenceIndex: 0,
          matched: 0,
          required: definition.required,
          completed: false,
          attempts: 0
        };
      }
      if (!state.worldState.actStates) state.worldState.actStates = {};
      return state.actMilestones[key];
    }

    function normalizeAction(action) {
      return action === "left" || action === "right" ? "switch" : String(action || "run");
    }

    function dominantAxis() {
      const entries = Object.entries(state.relationAxes).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
      return entries[0]?.[1] > 0 ? entries[0][0] : "attention";
    }

    function stageGatesComplete(stageIndex = state.stageIndex) {
      return SEMANTIC_CHOREOGRAPHY[normalizeStage(stageIndex)].every((_, actIndex) => Boolean(state.actMilestones[milestoneKey(stageIndex, actIndex)]?.completed));
    }

    function issue(channel, op, key, priority, durationMs, payload) {
      state.commandOrdinal += 1;
      const command = {
        id: `${state.stageId}:${state.actId || state.actIndex}:${state.attemptId}:${state.commandOrdinal}:${key}`,
        channel,
        op,
        key,
        priority,
        durationMs: Math.max(0, Math.trunc(Number(durationMs) || 0)),
        payload: clone(payload || {})
      };
      commands.push(command);
      return command;
    }

    function rememberFact(id) {
      state.processedFactIds.push(id);
      if (state.processedFactIds.length > 512) state.processedFactIds.splice(0, state.processedFactIds.length - 512);
    }

    function resolveCause(causeId) {
      if (!causeId) return true;
      const id = String(causeId);
      if (state.resolvedCauseIds.includes(id)) return false;
      state.resolvedCauseIds.push(id);
      if (state.resolvedCauseIds.length > 256) state.resolvedCauseIds.splice(0, state.resolvedCauseIds.length - 256);
      return true;
    }

    function enterStage(detail = {}) {
      state.stageIndex = normalizeStage(detail.stageIndex);
      state.stageId = detail.stageId || RELATION_ARCS[state.stageIndex].storyId;
      state.actIndex = normalizeAct(detail.actIndex);
      state.actId = detail.actId || null;
      state.elapsed = Math.max(0, Number(detail.elapsed) || 0);
      state.actionStreak = 0;
      state.pendingRepair = null;
      state.resolvedCauseIds = [];
      ensureMilestone(state.stageIndex, state.actIndex);
      issue("scene", "set-stage", arc().mechanic, PRIORITY.act, 900, { stageIndex: state.stageIndex, stageId: state.stageId, relation: arc().relation });
      if (state.worldState.branch) issue("scene", "branch-shift", state.worldState.branch.axis, PRIORITY.act, 900, state.worldState.branch);
      issue("audio", "set-stage", arc().verb, PRIORITY.act, 900, { stageIndex: state.stageIndex, relation: arc().relation });
      return drainCommands();
    }

    function enterAct(detail = {}) {
      const nextAct = normalizeAct(detail.actIndex);
      const nextId = detail.actId || `${state.stageId}-act-${nextAct + 1}`;
      if (state.actIndex === nextAct && state.actId === nextId && detail.force !== true) return [];
      state.actIndex = nextAct;
      state.actId = nextId;
      state.resolvedCauseIds = [];
      state.pendingRepair = null;
      const semantic = choreography(state.stageIndex, nextAct);
      ensureMilestone(state.stageIndex, nextAct);
      const beatId = `${state.stageId}:${nextId}:entered`;
      if (!state.committedBeatIds.includes(beatId)) state.committedBeatIds.push(beatId);
      issue("scene", "set-act", arc().worldEffect, PRIORITY.act, 760, { ...detail, stageIndex: state.stageIndex, actIndex: nextAct, mechanic: arc().mechanic });
      issue("camera", "reveal", `${arc().mechanic}-${nextAct + 1}`, PRIORITY.act, 980, {
        maxLaneOffset: 0.35,
        minFov: 55,
        actIndex: nextAct,
        cameraRigKey: detail.director?.cameraRigKey
      });
      issue("audio", "set-act", `${arc().verb}-${nextAct + 1}`, PRIORITY.act, 1200, {
        stageIndex: state.stageIndex,
        actIndex: nextAct,
        actId: nextId,
        bpm: detail.director?.bpm,
        rhythm: detail.director?.rhythm,
        semanticReward: detail.director?.semanticReward
      });
      issue("scene", "relationship-presence", semantic.relationshipMode, PRIORITY.act, 1200, {
        mode: semantic.relationshipMode,
        semanticKey: semantic.key,
        visible: state.stageIndex > 0
      });
      return drainCommands();
    }

    function repairCargo() {
      if (!state.pendingRepair) return;
      const itemId = state.pendingRepair.itemId;
      const cargo = state.cargo.find((entry) => entry.itemId === itemId);
      if (cargo) cargo.integrity = Math.min(100, cargo.integrity + 28);
      state.pendingRepair = null;
      state.recoveredActions += 1;
      state.relationAxes.repair += 1;
      issue("scene", "recover", arc().repairEffect, PRIORITY.interaction, 1100, { itemId, stageIndex: state.stageIndex, actIndex: state.actIndex });
      issue("audio", "resolve", "repair", PRIORITY.interaction, 900, { stageIndex: state.stageIndex });
    }

    function markSemanticAction(fact) {
      const definition = choreography();
      const milestone = ensureMilestone();
      const expected = definition.steps[milestone.sequenceIndex % definition.steps.length];
      const planned = fact.semanticStep ? normalizeAction(fact.semanticStep) : expected;
      const actual = normalizeAction(fact.action || fact.response);
      milestone.attempts += 1;
      if (actual !== planned || planned !== expected) {
        issue("scene", "semantic-hold", definition.key, PRIORITY.interaction, 760, {
          expected,
          actual,
          semanticKey: definition.key,
          stageIndex: state.stageIndex,
          actIndex: state.actIndex
        });
        return { matched: false, definition, milestone, expected, actual };
      }
      milestone.matched += 1;
      milestone.sequenceIndex += 1;
      state.relationAxes[definition.axis] += 1;
      const justCompleted = !milestone.completed && milestone.matched >= definition.required;
      milestone.completed = milestone.matched >= definition.required;
      state.worldState.actStates[milestoneKey()] = {
        key: definition.key,
        matched: milestone.matched,
        required: definition.required,
        completed: milestone.completed,
        lastAction: actual
      };
      issue("scene", "semantic-beat", definition.key, PRIORITY.interaction, justCompleted ? 1500 : 920, {
        semanticKey: definition.key,
        semanticStep: expected,
        matched: milestone.matched,
        required: definition.required,
        completed: milestone.completed,
        relationshipMode: definition.relationshipMode,
        stageIndex: state.stageIndex,
        actIndex: state.actIndex
      });
      issue("audio", "semantic-beat", definition.key, PRIORITY.interaction, justCompleted ? 1500 : 900, {
        semanticStep: expected,
        completed: milestone.completed,
        matched: milestone.matched
      });
      if (justCompleted) {
        const flag = `gate:${milestoneKey()}`;
        if (!state.flags.includes(flag)) state.flags.push(flag);
        issue("scene", "semantic-gate-complete", definition.key, PRIORITY.act, 1800, {
          semanticKey: definition.key,
          relationshipMode: definition.relationshipMode,
          stageIndex: state.stageIndex,
          actIndex: state.actIndex
        });
      }
      return { matched: true, definition, milestone, expected, actual };
    }

    function mayAdvance(fact) {
      if (!Number.isFinite(Number(fact.stageTarget))) return true;
      const progress = Math.max(0, Number(fact.stageProgress) || 0);
      const target = Math.max(1, Number(fact.stageTarget) || 1);
      if (progress < target - 1 || stageGatesComplete()) return true;
      issue("scene", "stage-gate-pending", choreography().key, PRIORITY.safety, 1200, {
        stageIndex: state.stageIndex,
        actIndex: state.actIndex,
        missing: SEMANTIC_CHOREOGRAPHY[state.stageIndex]
          .map((definition, actIndex) => state.actMilestones[milestoneKey(state.stageIndex, actIndex)]?.completed ? null : definition.key)
          .filter(Boolean)
      });
      return false;
    }

    function cleanAction(fact) {
      if (!resolveCause(fact.causeId || fact.patternId || fact.momentId)) return;
      const semantic = markSemanticAction(fact);
      state.cleanActions += 1;
      state.actionStreak = semantic.matched ? state.actionStreak + 1 : 0;
      state.bestActionStreak = Math.max(state.bestActionStreak, state.actionStreak);
      if (semantic.matched && state.pendingRepair) repairCargo();
      issue("scene", "physical-consequence", arc().worldEffect, PRIORITY.interaction, 780, {
        outcome: "clean",
        action: fact.action || fact.response,
        causeId: fact.causeId,
        stageIndex: state.stageIndex,
        actIndex: state.actIndex,
        semanticKey: semantic.definition.key,
        semanticStep: semantic.expected,
        semanticMatched: semantic.matched
      });
      if (state.actionStreak >= 3 && state.actionStreak % 3 === 0) {
        const reward = STREAK_REWARDS[state.stageIndex];
        issue("gameplay", reward.op, reward.key, PRIORITY.interaction, state.stageIndex === 5 ? 2600 : 4600, {
          streak: state.actionStreak,
          speedBoost: reward.speedBoost,
          paceScale: reward.paceScale
        });
        issue("audio", "layer", "mutual-harmony", PRIORITY.interaction, 4600, { strength: Math.min(1, state.actionStreak / 9) });
      }
      if (semantic.matched && fact.progress !== false && !fact.choicePending && mayAdvance(fact)) {
        issue("rules", "progress", "action-earned", PRIORITY.ambience, 0, {
          outcome: state.actionStreak > 1 ? "perfect" : "good",
          causeId: fact.causeId,
          inputSeq: fact.inputSeq,
          nodeId: fact.nodeId || fact.patternId || fact.causeId
        });
      }
    }

    function strainedAction(fact) {
      state.strainedActions += 1;
      state.actionStreak = 0;
      const semantic = choreography();
      state.relationAxes[semantic.axis] = Math.max(0, state.relationAxes[semantic.axis] - 1);
      const cargo = state.cargo.at(-1);
      if (cargo) cargo.integrity = Math.max(0, cargo.integrity - (fact.severity === "heavy" ? 32 : 20));
      state.pendingRepair = {
        id: `repair:${fact.causeId || state.strainedActions}`,
        itemId: cargo?.itemId || null,
        expiresAt: state.elapsed + 14
      };
      issue("scene", "physical-consequence", arc().repairEffect, PRIORITY.safety, 900, {
        outcome: "strained",
        causeId: fact.causeId,
        itemId: cargo?.itemId || null,
        integrity: cargo?.integrity ?? null,
        stageIndex: state.stageIndex,
        actIndex: state.actIndex,
        semanticKey: semantic.key,
        expectedAction: semantic.steps[ensureMilestone().sequenceIndex % semantic.steps.length]
      });
      issue("audio", "duck", "brief-setback", PRIORITY.safety, 680, { lowpass: true, intensity: 0.62 });
    }

    function resolveDecision(fact) {
      const decisionId = String(fact.decisionId || fact.choiceGroup || fact.causeId || fact.itemId || `decision-${Object.keys(state.decisions).length + 1}`);
      if (state.decisions[decisionId]) return;
      const relationshipAxis = ["attention", "mutuality", "repair"].includes(fact.relationshipAxis) ? fact.relationshipAxis : choreography().axis;
      const result = {
        decisionId,
        actId: state.actId,
        itemId: fact.itemId || null,
        alternatives: Array.isArray(fact.alternatives) ? fact.alternatives.slice() : [],
        resolution: fact.resolution || "clean",
        quality: fact.quality || "good",
        effectIds: Array.isArray(fact.effectIds) ? fact.effectIds.slice() : [],
        relationshipAxis
      };
      state.decisions[decisionId] = result;
      if (result.itemId) {
        state.memories[result.itemId] = { decisionId, resolution: result.resolution, actId: state.actId };
        state.cargo.push({ itemId: result.itemId, integrity: 100, acquiredActId: state.actId });
        if (state.cargo.length > 3) state.cargo.shift();
      }
      state.relationAxes[relationshipAxis] += result.quality === "perfect" ? 3 : 2;
      state.worldState.branch = {
        axis: relationshipAxis,
        itemId: result.itemId,
        worldEffect: fact.worldEffect || arc().worldEffect,
        resolution: result.resolution,
        stageIndex: state.stageIndex,
        actIndex: state.actIndex
      };
      issue("scene", "branch-shift", relationshipAxis, PRIORITY.interaction, 2200, state.worldState.branch);
      issue("scene", "use-item", fact.worldEffect || arc().worldEffect, PRIORITY.interaction, 1800, { ...result, stageIndex: state.stageIndex, actIndex: state.actIndex });
      issue("camera", "item-response", fact.gesture || arc().verb, PRIORITY.interaction, 900, { itemId: result.itemId, maxLaneOffset: 0.3, minFov: 55 });
      issue("audio", "motif", fact.musicCue || result.itemId || arc().verb, PRIORITY.interaction, 2200, { itemId: result.itemId, resolution: result.resolution });
      if (mayAdvance(fact)) issue("rules", "progress", "choice-earned", PRIORITY.ambience, 0, { outcome: result.quality, decisionId, itemId: result.itemId });
    }

    function missDecision(fact) {
      const decisionId = String(fact.decisionId || fact.choiceGroup || fact.causeId || "missed-choice");
      if (state.decisions[decisionId]) return;
      state.decisions[decisionId] = { decisionId, actId: state.actId, itemId: null, alternatives: [], resolution: "missed", quality: null, effectIds: [] };
      if (!state.missedBeatIds.includes(decisionId)) state.missedBeatIds.push(decisionId);
      const axis = choreography().axis;
      state.relationAxes[axis] = Math.max(0, state.relationAxes[axis] - 1);
      state.worldState.branch = { axis, itemId: null, worldEffect: arc().repairEffect, resolution: "missed", stageIndex: state.stageIndex, actIndex: state.actIndex };
      state.pendingRepair = { id: `repair:${decisionId}`, itemId: state.cargo.at(-1)?.itemId || null, expiresAt: state.elapsed + 14 };
      issue("scene", "pause", arc().repairEffect, PRIORITY.interaction, 850, { decisionId, stageIndex: state.stageIndex, actIndex: state.actIndex });
      issue("audio", "thin", "route-pauses", PRIORITY.interaction, 850, { decisionId });
    }

    function ingest(fact = {}, context = {}) {
      if (!fact || typeof fact !== "object") throw new TypeError("fact is required");
      if (Number.isFinite(Number(context.elapsed))) state.elapsed = Math.max(state.elapsed, Number(context.elapsed));
      const id = stableFactId(fact, state);
      if (state.processedFactIds.includes(id)) return [];
      rememberFact(id);
      const type = String(fact.type || "");
      if (type === "stage-entered") return enterStage(fact);
      if (type === "act-entered") return enterAct(fact);
      const preState = { actionStreak: state.actionStreak, pendingRepair: clone(state.pendingRepair), cargo: clone(state.cargo), relationAxes: clone(state.relationAxes), actMilestones: clone(state.actMilestones), worldState: clone(state.worldState) };
      if (["obstacle-dodged", "action-clean"].includes(type) || (type === "near-miss" && fact.intentional)) cleanAction(fact);
      else if (["obstacle-hit", "collision", "action-strained"].includes(type)) strainedAction(fact);
      else if (["route-choice", "route-choice-resolved", "story-item"].includes(type)) resolveDecision(fact);
      else if (["route-choice-missed", "story-missed"].includes(type)) missDecision(fact);
      else if (type === "stage-completed") {
        issue("scene", "arrival", arc().worldEffect, PRIORITY.cinematic, 4200, { stageIndex: state.stageIndex, arrival: selectArrival() });
        issue("audio", "arrival", arc().verb, PRIORITY.cinematic, 4200, { stageIndex: state.stageIndex });
      } else if (type === "retry" || type === "resume") {
        state.attemptId += type === "retry" ? 1 : 0;
        state.actionStreak = 0;
        state.pendingRepair = null;
        issue("scene", "reenter-act", arc().mechanic, PRIORITY.cinematic, 1000, { stageIndex: state.stageIndex, actIndex: state.actIndex, safeLeadSeconds: 1.5 });
        issue("audio", "reenter-act", arc().verb, PRIORITY.cinematic, 1000, { stageIndex: state.stageIndex, actIndex: state.actIndex });
      }
      const postState = { actionStreak: state.actionStreak, pendingRepair: clone(state.pendingRepair), cargo: clone(state.cargo), relationAxes: clone(state.relationAxes), actMilestones: clone(state.actMilestones), worldState: clone(state.worldState) };
      state.factLog.push({ id, type, inputSeq: Number(fact.inputSeq) || 0, nodeId: fact.nodeId || fact.patternId || fact.decisionId || null, preState, postState });
      if (state.factLog.length > 128) state.factLog.splice(0, state.factLog.length - 128);
      return drainCommands();
    }

    function tick(seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) throw new TypeError("seconds must be a non-negative finite number");
      state.elapsed += seconds;
      if (state.pendingRepair && state.elapsed >= state.pendingRepair.expiresAt) {
        const repair = state.pendingRepair;
        state.pendingRepair = null;
        issue("scene", "repair-window-closed", arc().repairEffect, PRIORITY.ambience, 650, { itemId: repair.itemId, stageIndex: state.stageIndex });
      }
      return drainCommands();
    }

    function planPattern(context = {}) {
      const ordinal = Math.max(0, Math.trunc(Number(context.ordinal ?? state.spawnOrdinal) || 0));
      state.spawnOrdinal = ordinal + 1;
      const currentLane = LANES.includes(Number(context.currentLane)) ? Number(context.currentLane) : 0;
      const actIndex = normalizeAct(context.actIndex ?? state.actIndex);
      const choiceDue = ordinal % 5 === (state.stageIndex + actIndex + 2) % 5;
      const alternatives = LANES.filter((lane) => lane !== currentLane);
      if ((ordinal + state.stageIndex + actIndex) % 2) alternatives.reverse();
      const semantic = choreography(state.stageIndex, actIndex);
      const milestone = ensureMilestone(state.stageIndex, actIndex);
      const semanticStep = semantic.steps[milestone.sequenceIndex % semantic.steps.length];
      const action = semanticStep || ACT_ACTIONS[state.stageIndex][(ordinal + actIndex) % ACT_ACTIONS[state.stageIndex].length];
      const formations = [
        [0, -1, 0, 1, 0],
        [-1, -1, 0, 1, 1],
        [1, 0, -1, 0, 1]
      ];
      return deepFreeze({
        ordinal,
        stageIndex: state.stageIndex,
        actIndex,
        mechanic: arc().mechanic,
        action,
        semanticStep,
        semanticKey: semantic.key,
        semanticRequired: semantic.required,
        semanticMatched: milestone.matched,
        relationshipMode: semantic.relationshipMode,
        choiceDue,
        choiceLanes: choiceDue ? alternatives : [],
        collectibleLanes: formations[(ordinal + actIndex) % formations.length].slice(),
        causeId: `${state.stageId}:${state.actId || actIndex}:pattern:${ordinal}`
      });
    }

    function selectArrival() {
      const decisions = Object.values(state.decisions);
      const selected = decisions.filter((entry) => entry.itemId && entry.resolution !== "missed");
      const scored = selected.map((entry, index) => {
        const cargo = state.cargo.find((item) => item.itemId === entry.itemId);
        const resolutionScore = entry.resolution === "recovered" ? 4 : entry.resolution === "clean" ? 3 : 2;
        return { entry, score: resolutionScore * 100 + (cargo?.integrity || 0) + index };
      }).sort((left, right) => right.score - left.score);
      const featured = scored[0]?.entry || null;
      const tail = state.relationAxes.repair > 0
        ? "repaired"
        : state.relationAxes.mutuality > state.relationAxes.attention ? "mutual" : "attentive";
      return deepFreeze({
        featuredItemId: featured?.itemId || state.cargo.at(-1)?.itemId || null,
        resolution: featured?.resolution || "arrived",
        tail,
        cargo: clone(state.cargo),
        decisions: clone(state.decisions),
        relationAxes: clone(state.relationAxes),
        actMilestones: clone(state.actMilestones),
        branch: clone(state.worldState.branch),
        gatesComplete: stageGatesComplete(),
        dominantAxis: dominantAxis()
      });
    }

    function drainCommands() {
      if (!commands.length) return [];
      const output = commands
        .splice(0, commands.length)
        .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id));
      return deepFreeze(output);
    }

    function snapshot() {
      return deepFreeze(clone(state));
    }

    function restore(saved) {
      state = normalizeState(saved);
      commands = [];
      return snapshot();
    }

    return Object.freeze({
      enterStage,
      enterAct,
      ingest,
      tick,
      planPattern,
      selectArrival,
      drainCommands,
      snapshot,
      restore
    });
  }

  return deepFreeze({ VERSION, PRIORITY, RELATION_ARCS, SEMANTIC_CHOREOGRAPHY, createDirector });
});
