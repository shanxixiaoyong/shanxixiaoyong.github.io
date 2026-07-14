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

test("exports seven deeply frozen rendezvous stages paced around three minutes", () => {
  assert.deepEqual(rules.STAGES.map((stage) => stage.name), ["再遇见", "渐渐熟悉", "第一次赴约", "约会正发生", "成为日常", "雨夜之后", "下一站"]);
  assert.deepEqual(rules.STAGES.map((stage) => stage.destination), ["图书馆路口", "桥下书店", "旧城电影院", "河岸长椅", "亮灯的厨房", "河桥雨棚", "有灯的家"]);
  assert.ok(rules.STAGES.every((stage) => stage.expectedSeconds === 180));
  assert.ok(Object.isFrozen(rules));
  assert.ok(Object.isFrozen(rules.STAGES));
  assert.ok(rules.STAGES.every(Object.isFrozen));
});

test("publishes the same API as a browser UMD global", () => {
  const source = fs.readFileSync(require.resolve("../assets/runner-love-rules.js"), "utf8");
  const context = {};
  vm.runInNewContext(source, context);
  assert.equal(context.RunnerLoveRules.RULES.subtitle, "今晚见");
  assert.equal(typeof context.RunnerLoveRules.recordMoment, "function");
});

test("uses three minutes as a pacing estimate rather than a hard completion gate", () => {
  const definition = rules.STAGES[0];
  const state = collect(rules.createRunState(), definition.target, "perfect", "fast-route");
  assert.equal(state.stageIndex, 1);
  assert.equal(state.stageRecords[0].elapsed, 0);
  assert.equal(state.arrivals[0], definition.destination);
  assert.equal(rules.getStageProgress(rules.advanceTime(rules.createRunState(), 90)).timeRatio, 0.5);
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

test("collisions reduce condition, near misses recover one point, and zero condition fails", () => {
  let state = rules.createRunState();
  state = rules.recordMoment(state, { outcome: "miss", kind: "collision" });
  assert.equal(state.condition, 96);
  assert.equal(state.collisions, 1);
  state = rules.recordNearMiss(state);
  assert.equal(state.condition, 97);
  assert.equal(state.nearMisses, 1);
  while (state.status === "playing") state = rules.recordMoment(state, { outcome: "miss", kind: "collision" });
  assert.equal(state.status, "failed");
  assert.equal(state.ending, "这次没能准时抵达");
  assert.throws(() => rules.recordMoment(state, { outcome: "good" }), RangeError);
});

test("failed stages retry from their reached checkpoint and half of the route time", () => {
  const definition = rules.STAGES[0];
  let state = collect(rules.createRunState(), definition.checkpoint, "good", "retry");
  while (state.status === "playing") state = rules.recordMoment(state, { outcome: "miss", kind: "collision" });
  const retried = rules.retryFromCheckpoint(state);
  assert.equal(retried.status, "playing");
  assert.equal(retried.stage.progress, definition.checkpoint);
  assert.equal(retried.stage.elapsed, definition.expectedSeconds * 0.5);
  assert.equal(retried.condition, rules.RULES.retryCondition);
  assert.throws(() => rules.retryFromCheckpoint(retried), RangeError);
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

test("does not mutate inputs and returns deeply frozen data", () => {
  const state = JSON.parse(JSON.stringify(rules.createRunState()));
  const before = JSON.stringify(state);
  const next = rules.recordMoment(state, { outcome: "good", itemId: "book" });
  assert.equal(JSON.stringify(state), before);
  assert.ok(Object.isFrozen(next));
  assert.ok(Object.isFrozen(next.stage));
  assert.ok(Object.isFrozen(next.collectedItems));
});
