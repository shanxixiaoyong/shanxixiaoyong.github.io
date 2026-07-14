"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const rules = require("../assets/runner-love-rules.js");

function collect(state, count, outcome = "perfect", prefix = "item") {
  for (let index = 0; index < count; index += 1) {
    state = rules.recordMoment(state, {
      outcome,
      kind: "story-item",
      itemId: `${prefix}-${index % 5}`,
      choiceId: `${prefix}-route-${index}`
    });
  }
  return state;
}

function completeCurrentStage(state, outcome = "perfect") {
  const stage = rules.STAGES[state.stageIndex];
  state = rules.advanceTime(state, stage.expectedSeconds);
  return collect(state, stage.target, outcome, stage.id);
}

function checksum(payload) {
  const text = JSON.stringify(payload);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(36);
}

function legacySave(state, version) {
  const run = JSON.parse(JSON.stringify(state));
  run.version = version;
  delete run.story;
  delete run.checkpointSnapshot;
  delete run.relationshipStyle;
  if (version === 5) {
    delete run.conditionBand;
    delete run.missStreak;
    delete run.maxMissStreak;
    delete run.losses;
    delete run.lastLoss;
    delete run.failure;
    delete run.failureHistory;
    delete run.retryCount;
    delete run.stage.misses;
  }
  const profile = {
    completedRuns: 0,
    bestGrade: null,
    discoveredItems: [],
    visitedDestinations: [],
    newGamePlusUnlocked: false
  };
  const payload = { version, run, profile };
  return { ...payload, signature: checksum(payload) };
}

function legacyV5Save(state) {
  return legacySave(state, 5);
}

function storySnapshot(overrides = {}) {
  return {
    version: 1,
    stageIndex: 0,
    actIndex: 1,
    cargo: [{ itemId: "paper-crane", integrity: 88, acquiredActId: "sun-shower-lane" }],
    decisions: {
      "notice-rain": { decisionId: "notice-rain", itemId: "paper-crane", resolution: "clean" }
    },
    worldState: {
      weather: "sun-shower",
      gate: { id: "library-crossing", open: false },
      routeDebt: 1
    },
    relationAxes: { attention: 3, mutuality: 1, repair: 0 },
    ...overrides
  };
}

test("exports seven deeply frozen rendezvous stages paced around three minutes", () => {
  assert.deepEqual(rules.STAGES.map((stage) => stage.name), ["再遇见", "渐渐熟悉", "第一次赴约", "约会正发生", "成为日常", "雨夜之后", "下一站"]);
  assert.deepEqual(rules.STAGES.map((stage) => stage.destination), ["图书馆路口", "桥下书店", "旧城电影院", "河岸长椅", "亮灯的厨房", "河桥雨棚", "有灯的家"]);
  assert.ok(rules.STAGES.every((stage) => stage.expectedSeconds === 180));
  assert.ok(Object.isFrozen(rules));
  assert.ok(Object.isFrozen(rules.STAGES));
  assert.ok(rules.STAGES.every(Object.isFrozen));
  assert.ok(rules.STAGES.every((stage) => Object.isFrozen(stage.tolerance)));
});

test("publishes the same API as a browser UMD global", () => {
  const source = fs.readFileSync(require.resolve("../assets/runner-love-rules.js"), "utf8");
  const context = {};
  vm.runInNewContext(source, context);
  assert.equal(context.RunnerLoveRules.RULES.subtitle, "今晚见");
  assert.equal(typeof context.RunnerLoveRules.recordMoment, "function");
  assert.equal(typeof context.RunnerLoveRules.getConditionStatus, "function");
  assert.equal(typeof context.RunnerLoveRules.getFailureInfo, "function");
  assert.equal(typeof context.RunnerLoveRules.commitStoryState, "function");
  assert.equal(typeof context.RunnerLoveRules.calculateRelationshipStyle, "function");
});

test("uses three minutes as a pacing estimate rather than a hard completion gate", () => {
  const definition = rules.STAGES[0];
  const state = collect(rules.createRunState(), definition.target, "perfect", "fast-route");
  assert.equal(state.stageIndex, 1);
  assert.equal(state.stageRecords[0].elapsed, 0);
  assert.equal(state.arrivals[0], definition.destination);
  assert.equal(rules.getStageProgress(rules.advanceTime(rules.createRunState(), 90)).timeRatio, 0.5);
  const overtime = rules.advanceTime(rules.createRunState(), definition.expectedSeconds * 20);
  assert.equal(overtime.status, "playing");
  assert.equal(overtime.condition, rules.RULES.startCondition);
});

test("tracks unique carried items, route choices, combo and checkpoint", () => {
  let state = rules.createRunState();
  state = collect(state, rules.STAGES[0].checkpoint, "perfect", "keepsake");
  assert.equal(state.combo, rules.STAGES[0].checkpoint);
  assert.equal(state.bestCombo, rules.STAGES[0].checkpoint);
  assert.deepEqual(state.checkpoints, ["encounter"]);
  assert.equal(state.collectedItems.length, 5);
  assert.equal(state.routeChoices.length, rules.STAGES[0].checkpoint);
  assert.equal(rules.getStageProgress(state).checkpointReached, true);
});

test("publishes explicit low-condition danger bands", () => {
  assert.deepEqual(rules.RULES.dangerRange, { min: 1, max: 35 });
  assert.equal(rules.getConditionStatus(100).id, "steady");
  assert.equal(rules.getConditionStatus(36).isDanger, false);
  assert.equal(rules.getConditionStatus(35.5).id, "strained");
  assert.equal(rules.getConditionStatus(35).id, "danger");
  assert.equal(rules.getConditionStatus(35).isDanger, true);
  assert.equal(rules.getConditionStatus(15).id, "critical");
  assert.equal(rules.getConditionStatus(0.5).id, "critical");
  assert.equal(rules.getConditionStatus(0).id, "failed");
  assert.ok(Object.isFrozen(rules.CONDITION_BANDS));
  assert.ok(rules.CONDITION_BANDS.every(Object.isFrozen));
});

test("stage tolerances vary slightly while keeping a fair recovery envelope", () => {
  const tolerances = rules.STAGES.map((stage) => stage.tolerance);
  const collisionLosses = tolerances.map((value) => value.collisionLoss);
  const missedActionLosses = tolerances.map((value) => value.missedActionLoss);
  assert.ok(Math.max(...collisionLosses) - Math.min(...collisionLosses) <= 2);
  assert.ok(Math.max(...missedActionLosses) - Math.min(...missedActionLosses) <= 2);
  for (const tolerance of tolerances) {
    assert.ok(tolerance.retryCondition > rules.RULES.dangerRange.max);
    let condition = rules.RULES.startCondition;
    let streak = 0;
    let collisions = 0;
    while (condition > 0) {
      streak += 1;
      collisions += 1;
      condition -= tolerance.collisionLoss + Math.min((streak - 1) * tolerance.streakStep, tolerance.streakCap);
    }
    assert.ok(collisions >= 5 && collisions <= 7, `${tolerance.id} depletes after ${collisions} collisions`);
  }
});

test("collisions and consecutive mistakes expose loss details before zero condition fails", () => {
  let state = rules.createRunState();
  state = rules.recordMoment(state, { outcome: "miss", kind: "collision" });
  assert.equal(state.condition, 87);
  assert.equal(state.collisions, 1);
  assert.equal(state.missStreak, 1);
  assert.deepEqual(state.lastLoss, {
    source: "collision",
    amount: 13,
    baseAmount: 13,
    streakAmount: 0,
    missStreak: 1,
    conditionBefore: 100,
    conditionAfter: 87,
    stageId: "encounter",
    stageIndex: 0,
    attempt: 1
  });
  state = rules.recordMoment(state, { outcome: "miss", kind: "collision" });
  assert.equal(state.condition, 72);
  assert.equal(state.lastLoss.streakAmount, 2);
  assert.deepEqual(state.losses, { total: 28, collision: 28, missedAction: 0, streak: 2, events: 2 });
  state = rules.recordNearMiss(state);
  assert.equal(state.condition, 73);
  assert.equal(state.nearMisses, 1);
  assert.equal(state.missStreak, 0);
  while (state.status === "playing") state = rules.recordMoment(state, { outcome: "miss", kind: "collision" });
  assert.equal(state.status, "failed");
  assert.equal(state.condition, 0);
  assert.equal(state.conditionBand, "failed");
  assert.equal(state.ending, "这次没能准时抵达");
  assert.equal(state.failure.code, "condition-depleted");
  assert.equal(state.failure.reason, "consecutive-misses");
  assert.equal(state.failure.lossSource, "collision");
  assert.equal(state.failure.stage.id, "encounter");
  assert.equal(state.failure.stage.index, 0);
  assert.equal(state.failure.loss, state.lastLoss);
  assert.equal(state.failure.retry.progress, 0);
  assert.equal(state.failureHistory.length, 1);
  assert.deepEqual(rules.getFailureInfo(state), state.failure);
  assert.ok(Object.isFrozen(rules.getFailureInfo(state)));
  assert.throws(() => rules.recordMoment(state, { outcome: "good" }), RangeError);
});

test("ordinary misses escalate only while consecutive and successes reset the streak", () => {
  let state = rules.createRunState();
  state = rules.recordBeat(state, "miss");
  assert.equal(state.lastLoss.source, "missed-action");
  assert.equal(state.lastLoss.amount, rules.RULES.missedActionLoss);
  state = rules.recordBeat(state, "miss");
  assert.equal(state.lastLoss.amount, rules.RULES.missedActionLoss + rules.RULES.consecutiveLossStep);
  assert.equal(state.missStreak, 2);

  state = rules.recordBeat(state, "good");
  assert.equal(state.missStreak, 0);
  state = rules.recordBeat(state, "miss");
  assert.equal(state.lastLoss.streakAmount, 0);
  assert.equal(state.maxMissStreak, 2);
});

test("commits serializable director state deterministically and keeps relationship style separate from rating", () => {
  const state = rules.createRunState();
  const snapshot = storySnapshot();
  const first = rules.commitStoryState(state, snapshot);
  const second = rules.commitStoryState(state, JSON.parse(JSON.stringify(snapshot)));

  assert.deepEqual(first, second);
  assert.deepEqual(first.story.worldState, snapshot.worldState);
  assert.equal(first.story.cargo[0].integrity, 88);
  assert.equal(first.story.objectIntegrity["paper-crane"], 88);
  assert.equal(first.relationshipStyle.id, "attentive");
  assert.equal(first.relationshipStyle.label, "留意型");
  assert.equal(Object.hasOwn(rules.calculateRating(first), "relationshipStyle"), false);
  assert.equal(rules.createSave(first).signature, rules.createSave(second).signature);
  assert.ok(Object.isFrozen(first.story.worldState.gate));

  const circular = {};
  circular.self = circular;
  assert.throws(() => rules.commitStoryState(state, circular), TypeError);
  assert.throws(() => rules.commitStoryState(state, storySnapshot({ worldState: { value: Number.NaN } })), TypeError);
});

test("relationship styles are deterministic independent settlements for attention, mutual aid, repair, and balance", () => {
  assert.equal(rules.calculateRelationshipStyle(storySnapshot({ relationAxes: { attention: 5, mutuality: 1, repair: 0 } })).label, "留意型");
  assert.equal(rules.calculateRelationshipStyle(storySnapshot({ relationAxes: { attention: 1, mutuality: 5, repair: 0 } })).label, "互助型");
  assert.equal(rules.calculateRelationshipStyle(storySnapshot({ relationAxes: { attention: 1, mutuality: 2, repair: 6 } })).label, "修复型");
  assert.equal(rules.calculateRelationshipStyle(storySnapshot({ relationAxes: { attention: 4, mutuality: 4, repair: 1 } })).label, "同行型");
  assert.deepEqual(
    rules.calculateRelationshipStyle(storySnapshot({ relationAxes: { attention: 1, mutuality: 2, repair: 6 } })),
    rules.calculateRelationshipStyle(storySnapshot({ relationAxes: { attention: 1, mutuality: 2, repair: 6 } }))
  );
});

test("failed stages retry from an exact causal checkpoint without retaining later items, choices, or story", () => {
  const definition = rules.STAGES[0];
  let state = rules.commitStoryState(rules.createRunState(), storySnapshot());
  state = rules.advanceTime(state, 73.25);
  state = collect(state, definition.checkpoint, "good", "retry");
  const checkpointStory = storySnapshot({
    cargo: [{ itemId: "paper-crane", integrity: 76 }],
    decisions: {
      "notice-rain": { decisionId: "notice-rain", itemId: "paper-crane", resolution: "strained" },
      "hold-door": { decisionId: "hold-door", itemId: null, resolution: "clean" }
    },
    worldState: { weather: "clearing", gate: { id: "library-crossing", open: true }, routeDebt: 0 },
    relationAxes: { attention: 4, mutuality: 2, repair: 5 }
  });
  state = rules.commitStoryState(state, checkpointStory, { checkpoint: true });
  const checkpoint = JSON.parse(JSON.stringify(state.checkpointSnapshot));
  assert.equal(checkpoint.kind, "checkpoint");
  assert.equal(checkpoint.stage.progress, definition.checkpoint);
  assert.equal(checkpoint.stage.elapsed, 73.25);
  assert.equal(checkpoint.story.cargo[0].integrity, 76);
  assert.deepEqual(checkpoint.story.decisions, checkpointStory.decisions);
  assert.deepEqual(checkpoint.story.worldState, checkpointStory.worldState);

  state = rules.recordMoment(state, {
    outcome: "perfect",
    kind: "story-item",
    itemId: "after-checkpoint-ticket",
    choiceId: "after-checkpoint-shortcut"
  });
  state = rules.advanceTime(state, 41);
  state = rules.commitStoryState(state, storySnapshot({
    cargo: [
      { itemId: "paper-crane", integrity: 19 },
      { itemId: "after-checkpoint-ticket", integrity: 44 }
    ],
    decisions: {
      ...checkpointStory.decisions,
      "future-choice": { decisionId: "future-choice", itemId: "after-checkpoint-ticket", resolution: "strained" }
    },
    worldState: { weather: "storm", gate: { id: "library-crossing", open: false }, routeDebt: 4 },
    relationAxes: { attention: 4, mutuality: 2, repair: 9 }
  }));
  while (state.status === "playing") state = rules.recordMoment(state, { outcome: "miss", kind: "collision" });
  const retried = rules.retryFromCheckpoint(state);
  assert.equal(retried.status, "playing");
  assert.equal(retried.stage.progress, definition.checkpoint);
  assert.equal(retried.stage.elapsed, 73.25);
  assert.equal(retried.condition, definition.tolerance.retryCondition);
  assert.equal(rules.getConditionStatus(retried).isDanger, false);
  assert.equal(retried.failure, null);
  assert.equal(retried.failureHistory.length, 1);
  assert.equal(retried.retryCount, 1);
  assert.equal(retried.missStreak, 0);
  assert.equal(retried.lastLoss, null);
  assert.equal(retried.stage.items.length, 5);
  assert.equal(retried.stage.items.includes("after-checkpoint-ticket"), false);
  assert.equal(retried.collectedItems.includes("after-checkpoint-ticket"), false);
  assert.equal(retried.stage.choices.includes("after-checkpoint-shortcut"), false);
  assert.equal(retried.routeChoices.includes("after-checkpoint-shortcut"), false);
  for (const key of ["elapsed", "stage", "completedStages", "arrivals", "checkpoints", "collectedItems", "routeChoices", "stageRecords", "story", "relationshipStyle"]) {
    assert.deepEqual(retried[key], checkpoint[key], key);
  }
  assert.deepEqual(retried.checkpointSnapshot, checkpoint);
  assert.ok(Object.isFrozen(retried.failureHistory[0]));
  assert.throws(() => rules.retryFromCheckpoint(retried), RangeError);
});

test("retry before the midpoint rolls story and collections back to the stage-start anchor", () => {
  let state = rules.commitStoryState(rules.createRunState(), storySnapshot());
  state = rules.recordMoment(state, { outcome: "good", itemId: "too-early", choiceId: "uncommitted-choice" });
  while (state.status === "playing") state = rules.recordMoment(state, { outcome: "miss", kind: "collision" });
  const retried = rules.retryFromCheckpoint(state);
  assert.equal(retried.stage.progress, 0);
  assert.deepEqual(retried.collectedItems, []);
  assert.deepEqual(retried.routeChoices, []);
  assert.deepEqual(retried.story.cargo, []);
  assert.deepEqual(retried.story.decisions, {});
  assert.deepEqual(retried.story.worldState, {});
});

test("refreshes a new stage start anchor after the director enters that chapter", () => {
  let state = rules.createRunState();
  while (state.stageIndex === 0) state = rules.recordMoment(state, { outcome: "good" });
  const story = { ...state.story, stageIndex: 1, actIndex: 0, relationAxes: { attention: 3, mutuality: 2, repair: 0 } };
  state = rules.commitStoryState(state, story, { stageStart: true });
  assert.equal(state.checkpointSnapshot.kind, "stage-start");
  assert.equal(state.checkpointSnapshot.story.stageIndex, 1);
  assert.deepEqual(state.checkpointSnapshot.story.relationAxes, story.relationAxes);
});

test("completes all seven stages, rates S, and unlocks another route", () => {
  let state = rules.createRunState();
  for (const stage of rules.STAGES) state = completeCurrentStage(state, "perfect");
  assert.equal(state.status, "completed");
  assert.equal(state.grade, "S");
  assert.equal(state.completedStages.length, 7);
  assert.equal(state.arrivals.length, 7);
  assert.equal(state.stageRecords.every((record) => record.elapsed >= 180), true);

  const save = rules.createSave(state);
  assert.equal(save.profile.completedRuns, 1);
  assert.equal(save.profile.newGamePlusUnlocked, true);
  assert.equal(rules.canStartNewGamePlus(save), true);
  assert.equal(rules.createNewGamePlus(save).newGamePlus, true);
});

test("rating exposes A and B routes without blocking completion", () => {
  let a = rules.createRunState();
  for (const stage of rules.STAGES) {
    a = rules.advanceTime(a, stage.expectedSeconds);
    for (let index = 0; index < stage.target; index += 1) a = rules.recordBeat(a, "good");
  }
  assert.equal(a.grade, "A");

  let b = rules.createRunState();
  for (const stage of rules.STAGES) {
    b = rules.advanceTime(b, stage.expectedSeconds);
    for (let index = 0; index < stage.target; index += 1) {
      if (index % 2 === 0) b = rules.recordMoment(b, { outcome: "miss" });
      b = rules.recordMoment(b, { outcome: "good", itemId: `${stage.id}-${index % 3}` });
    }
  }
  assert.equal(b.status, "completed");
  assert.equal(b.grade, "B");
});

test("state and checksummed local saves survive JSON and reject tampering", () => {
  const state = collect(rules.createRunState(), 2, "good", "save");
  const save = JSON.parse(JSON.stringify(rules.createSave(state)));
  assert.equal(rules.validateRunState(JSON.parse(JSON.stringify(state))), true);
  assert.equal(rules.validateSave(save), true);
  assert.ok(Object.isFrozen(rules.loadSave(save).run));
  save.run.condition = 99;
  assert.throws(() => rules.validateSave(save), RangeError);
});

test("loads signed v5 and v6 saves, migrates story checkpoints, and re-signs deterministically", () => {
  for (const version of [5, 6]) {
    const current = collect(rules.createRunState(), 2, "good", `legacy-${version}`);
    const legacy = version === 5 ? legacyV5Save(current) : legacySave(current, version);
    assert.equal(rules.validateRunState(legacy.run), true);
    assert.equal(rules.validateSave(legacy), true);

    const loaded = rules.loadSave(legacy);
    const loadedAgain = rules.loadSave(legacy);
    assert.equal(loaded.version, rules.RULES.version);
    assert.equal(loaded.run.version, rules.RULES.version);
    assert.equal(loaded.run.conditionBand, "steady");
    assert.deepEqual(loaded.run.losses, { total: 0, collision: 0, missedAction: 0, streak: 0, events: 0 });
    assert.equal(loaded.run.stage.misses, 0);
    assert.deepEqual(loaded.run.story.cargo, []);
    assert.deepEqual(loaded.run.story.decisions, {});
    assert.deepEqual(loaded.run.story.worldState, {});
    assert.equal(loaded.run.relationshipStyle.id, "unwritten");
    assert.equal(loaded.run.checkpointSnapshot.kind, "legacy-anchor");
    assert.equal(loaded.run.checkpointSnapshot.stage.progress, 0);
    assert.deepEqual(loaded, loadedAgain);
    assert.notEqual(loaded.signature, legacy.signature);
    assert.equal(rules.validateSave(loaded), true);
    assert.ok(Object.isFrozen(loaded.run.losses));
    assert.ok(Object.isFrozen(loaded.run.checkpointSnapshot.story));

    const continued = rules.recordMoment(loaded.run, { outcome: "miss", kind: "collision" });
    assert.equal(continued.totalAttempts, loaded.run.totalAttempts + 1);
    assert.equal(continued.lastLoss.source, "collision");
  }
});

test("failed data survives checksummed JSON saves and remains useful after retry", () => {
  let state = rules.createRunState();
  while (state.status === "playing") state = rules.recordMoment(state, { outcome: "miss", kind: "collision" });
  const save = JSON.parse(JSON.stringify(rules.createSave(state)));
  assert.equal(rules.validateSave(save), true);

  const loaded = rules.loadSave(save);
  assert.equal(loaded.run.failure.reason, "consecutive-misses");
  assert.equal(loaded.run.failure.lossSource, "collision");
  assert.equal(loaded.run.failure.stage.id, "encounter");
  assert.equal(loaded.run.failureHistory.length, 1);
  assert.ok(Object.isFrozen(loaded.run.failure.loss));

  const retried = rules.retryFromCheckpoint(loaded.run);
  assert.equal(retried.status, "playing");
  assert.equal(retried.failure, null);
  assert.equal(retried.failureHistory[0].reason, "consecutive-misses");
  assert.equal(rules.validateRunState(JSON.parse(JSON.stringify(retried))), true);
});

test("does not mutate inputs and returns deeply frozen data", () => {
  const state = JSON.parse(JSON.stringify(rules.createRunState()));
  const before = JSON.stringify(state);
  const next = rules.recordMoment(state, { outcome: "good", itemId: "book" });
  assert.equal(JSON.stringify(state), before);
  assert.ok(Object.isFrozen(next));
  assert.ok(Object.isFrozen(next.stage));
  assert.ok(Object.isFrozen(next.collectedItems));
});
