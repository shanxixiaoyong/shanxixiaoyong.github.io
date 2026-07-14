"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const rules = require("../assets/runner-love-rules.js");

function hit(state, count, outcome = "perfect") {
  for (let index = 0; index < count; index += 1) state = rules.recordBeat(state, outcome);
  return state;
}

test("exports seven deeply frozen relationship stages", () => {
  assert.deepEqual(rules.STAGES.map((stage) => stage.name), ["勇气", "共鸣", "回应", "默契", "信任", "理解", "约定"]);
  assert.ok(Object.isFrozen(rules));
  assert.ok(Object.isFrozen(rules.STAGES));
  assert.ok(rules.STAGES.every(Object.isFrozen));
  assert.equal(JSON.parse(JSON.stringify(rules.createRunState())).stageIndex, 0);
});

test("publishes the same API as a browser UMD global", () => {
  const source = fs.readFileSync(require.resolve("../assets/runner-love-rules.js"), "utf8");
  const context = {};
  vm.runInNewContext(source, context);
  assert.equal(context.RunnerLoveRules.RULES.title, "心动跑酷");
  assert.equal(typeof context.RunnerLoveRules.recordBeat, "function");
});

test("tracks heartbeat, progress, combo, checkpoint and 90 percent perfect stage", () => {
  let state = rules.createRunState();
  state = hit(state, rules.STAGES[0].checkpoint);
  assert.equal(state.heartbeat, 100);
  assert.equal(state.combo, rules.STAGES[0].checkpoint);
  assert.equal(state.bestCombo, rules.STAGES[0].checkpoint);
  assert.deepEqual(state.checkpoints, ["courage"]);
  assert.equal(rules.getStageProgress(state).checkpointReached, true);
  state = hit(state, rules.STAGES[0].target - rules.STAGES[0].checkpoint);
  assert.equal(state.stageIndex, 1);
  assert.deepEqual(state.perfectStages, ["courage"]);
  assert.deepEqual(state.completedStages, ["courage"]);
});

test("a stage with at least 90 percent perfect successful beats earns its marker", () => {
  let state = hit(rules.createRunState(), rules.STAGES[0].target);
  const target = rules.STAGES[1].target;
  const perfects = Math.ceil(target * 0.9);
  state = hit(state, perfects, "perfect");
  state = hit(state, target - perfects, "good");
  assert.equal(state.stageIndex, 2);
  assert.deepEqual(state.perfectStages, ["courage", "resonance"]);
});

test("checkpoint grants one fixed 20 second compensation segment", () => {
  let state = hit(rules.createRunState(), rules.STAGES[0].checkpoint);
  state = rules.advanceTime(state, rules.STAGES[0].duration);
  assert.equal(state.stage.compensation, true);
  assert.equal(state.stage.compensationRemaining, 20);
  assert.equal(state.usedCompensation, true);
  state = rules.advanceTime(state, 19.5);
  assert.equal(state.status, "playing");
  state = rules.advanceTime(state, 0.5);
  assert.equal(state.status, "failed");
  assert.equal(state.ending, rules.STAGES[0].failEnding);
});

test("missing checkpoint produces the current stage failure ending immediately", () => {
  const state = rules.advanceTime(rules.createRunState(), rules.STAGES[0].duration);
  assert.equal(state.status, "failed");
  assert.equal(state.grade, null);
  assert.equal(state.ending, "未能迈出第一步");
  assert.throws(() => rules.recordBeat(state, "perfect"), RangeError);
});

test("completes all stages, rates S, and grants final reveal and new game plus", () => {
  let state = rules.createRunState();
  for (const stage of rules.STAGES) state = hit(state, stage.target);
  assert.equal(state.status, "completed");
  assert.equal(state.grade, "S");
  assert.equal(state.revealEligible, true);
  assert.equal(rules.calculateRating(state).grade, "S");

  const save = rules.createSave(state);
  assert.equal(save.profile.completedRuns, 1);
  assert.equal(save.profile.revealUnlocked, true);
  assert.equal(rules.canStartNewGamePlus(save), true);
  assert.equal(rules.createNewGamePlus(save).newGamePlus, true);
  assert.deepEqual(state.heartStamps, rules.STAGES.map((stage) => stage.id));
  assert.deepEqual(save.profile.collectedHeartStamps, state.heartStamps);
});

test("heart stamps are unique and failed stages retry from their reached checkpoint", () => {
  let state = hit(rules.createRunState(), rules.STAGES[0].target);
  assert.deepEqual(state.heartStamps, ["courage"]);
  state = hit(state, rules.STAGES[1].checkpoint, "good"); state = rules.advanceTime(state, rules.STAGES[1].duration + rules.RULES.compensationSeconds);
  const retried = rules.retryFromCheckpoint(state);
  assert.equal(retried.status, "playing"); assert.equal(retried.stageIndex, 1); assert.equal(retried.stage.progress, rules.STAGES[1].checkpoint);
  assert.deepEqual(retried.heartStamps, ["courage"]); assert.throws(() => rules.retryFromCheckpoint(retried), RangeError);
});

test("rating exposes S, A and B thresholds", () => {
  let a = rules.createRunState();
  for (const stage of rules.STAGES) a = hit(a, stage.target, "good");
  assert.equal(a.grade, "A");

  let b = rules.createRunState();
  for (const stage of rules.STAGES) {
    for (let index = 0; index < stage.target; index += 1) {
      if (index % 4 === 0) b = rules.recordBeat(b, "miss");
      b = rules.recordBeat(b, "good");
    }
  }
  assert.equal(b.status, "completed");
  assert.equal(b.grade, "B");
});

test("state and verified local saves survive JSON and reject tampering", () => {
  const state = hit(rules.createRunState(), 2);
  const save = JSON.parse(JSON.stringify(rules.createSave(state)));
  assert.equal(rules.validateRunState(JSON.parse(JSON.stringify(state))), true);
  assert.equal(rules.validateSave(save), true);
  assert.ok(Object.isFrozen(rules.loadSave(save).run));
  save.run.heartbeat = 99;
  assert.throws(() => rules.validateSave(save), RangeError);
});

test("does not mutate inputs and returns deeply frozen data", () => {
  const state = JSON.parse(JSON.stringify(rules.createRunState()));
  const before = JSON.stringify(state);
  const next = rules.recordBeat(state, "good");
  assert.equal(JSON.stringify(state), before);
  assert.ok(Object.isFrozen(next));
  assert.ok(Object.isFrozen(next.stage));
  assert.ok(Object.isFrozen(next.checkpoints));
});
