"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const Director = require("../assets/runner-love-director.js");
const Content = require("../assets/runner-love-content.js");

test("publishes the same DOM-free director API through UMD", () => {
  const source = fs.readFileSync(path.join(__dirname, "../assets/runner-love-director.js"), "utf8");
  const context = { globalThis: {} };
  vm.runInNewContext(source, context);
  assert.equal(context.globalThis.RunnerLoveDirector.VERSION, Director.VERSION);
  assert.equal(typeof context.globalThis.RunnerLoveDirector.createDirector, "function");
});

test("maps all seven authored chapters to distinct relationship verbs", () => {
  assert.equal(Director.RELATION_ARCS.length, 7);
  assert.deepEqual(Director.RELATION_ARCS.map((stage) => stage.storyId), Content.STAGES.map((stage) => stage.id));
  assert.equal(new Set(Director.RELATION_ARCS.map((stage) => stage.verb)).size, 7);
  assert.ok(Object.isFrozen(Director.RELATION_ARCS));
});

test("enters all 21 authored acts through one prioritized command contract", () => {
  const director = Director.createDirector();
  Content.STAGE_BLUEPRINTS.forEach((stage, stageIndex) => {
    const stageCommands = director.enterStage({ stageIndex, stageId: stage.id });
    assert.deepEqual(stageCommands.map((command) => command.channel).sort(), ["audio", "scene"]);
    stage.segments.forEach((act, actIndex) => {
      const commands = director.enterAct({ actIndex, actId: act.id, visual: act.visual });
      assert.deepEqual(commands.map((command) => command.channel).sort(), ["audio", "camera", "scene", "scene"]);
      commands.forEach((command) => {
        assert.match(command.id, new RegExp(`^${stage.id}:`));
        assert.ok(Number.isInteger(command.priority));
      });
    });
  });
});

test("requires an intentional lane change for sparse story choices", () => {
  const director = Director.createDirector();
  director.enterStage({ stageIndex: 0, stageId: "first-sight" });
  const plans = Array.from({ length: 15 }, (_, ordinal) => director.planPattern({ ordinal, currentLane: 0, actIndex: 0 }));
  assert.equal(plans.filter((plan) => plan.choiceDue).length, 3);
  plans.filter((plan) => plan.choiceDue).forEach((plan) => {
    assert.equal(plan.choiceLanes.length, 2);
    assert.ok(!plan.choiceLanes.includes(0));
  });
  const snapshot = director.snapshot();
  assert.equal(Object.keys(snapshot.decisions).length, 0);
  assert.equal(snapshot.cleanActions, 0);
});

test("turns physical obstacle results into idempotent story consequences and earned rush", () => {
  const director = Director.createDirector();
  director.enterStage({ stageIndex: 2, stageId: "first-date" });
  director.enterAct({ actIndex: 1, actId: "last-train-transfer" });
  const actions = Director.SEMANTIC_CHOREOGRAPHY[2][1].steps;
  const first = director.ingest({ id: "dodge-1", type: "obstacle-dodged", causeId: "row-1", action: actions[0], semanticStep: actions[0] });
  assert.ok(first.some((command) => command.channel === "rules" && command.op === "progress"));
  assert.deepEqual(director.ingest({ id: "dodge-1", type: "obstacle-dodged", causeId: "row-1", action: actions[0], semanticStep: actions[0] }), []);
  director.ingest({ id: "dodge-2", type: "obstacle-dodged", causeId: "row-2", action: actions[1], semanticStep: actions[1] });
  const third = director.ingest({ id: "dodge-3", type: "obstacle-dodged", causeId: "row-3", action: actions[2], semanticStep: actions[2] });
  assert.ok(third.some((command) => command.channel === "gameplay" && command.op === "rush"));
  assert.equal(director.snapshot().cleanActions, 3);
});

test("uses relationship-specific streak rewards and slows down to listen in the storm chapter", () => {
  const director = Director.createDirector();
  director.enterStage({ stageIndex: 5, stageId: "rough-weather" });
  director.enterAct({ actIndex: 2, actId: "shelter-approach" });
  const actions = Director.SEMANTIC_CHOREOGRAPHY[5][2].steps;
  director.ingest({ id: "listen-1", type: "obstacle-dodged", causeId: "listen-1", action: actions[0], semanticStep: actions[0], inputSeq: 1 });
  director.ingest({ id: "listen-2", type: "obstacle-dodged", causeId: "listen-2", action: actions[1], semanticStep: actions[1], inputSeq: 2 });
  const commands = director.ingest({ id: "listen-3", type: "obstacle-dodged", causeId: "listen-3", action: actions[2], semanticStep: actions[2], inputSeq: 3 });
  const reward = commands.find((command) => command.channel === "gameplay");
  assert.equal(reward.op, "settle");
  assert.equal(reward.payload.paceScale, 0.76);
  assert.equal(director.snapshot().factLog.at(-1).inputSeq, 3);
});

test("near misses only advance the relationship when correlated with an intentional switch", () => {
  const director = Director.createDirector();
  director.enterStage({ stageIndex: 0, stageId: "first-sight" });
  assert.equal(director.ingest({ id: "passive", type: "near-miss", causeId: "passive" }).some((command) => command.op === "progress"), false);
  assert.equal(director.ingest({ id: "intentional", type: "near-miss", causeId: "intentional", intentional: true, action: "left", semanticStep: "switch", inputSeq: 1 }).some((command) => command.op === "progress"), true);
});

test("requires authored physical choreography before the listening and double-lock gates can complete", () => {
  const director = Director.createDirector();
  director.enterStage({ stageIndex: 5, stageId: "rough-weather" });
  for (let actIndex = 0; actIndex < 3; actIndex += 1) {
    director.enterAct({ actIndex, actId: Content.STAGE_BLUEPRINTS[5].segments[actIndex].id });
    const definition = Director.SEMANTIC_CHOREOGRAPHY[5][actIndex];
    const wrong = director.ingest({ id: `wrong-${actIndex}`, type: "obstacle-dodged", causeId: `wrong-${actIndex}`, action: definition.steps[0] === "jump" ? "slide" : "jump", semanticStep: definition.steps[0] });
    assert.equal(wrong.some((command) => command.op === "progress"), false);
    for (let index = 0; index < definition.required; index += 1) {
      const action = definition.steps[index % definition.steps.length];
      director.ingest({ id: `six-${actIndex}-${index}`, type: "obstacle-dodged", causeId: `six-${actIndex}-${index}`, action, semanticStep: action });
    }
  }
  assert.equal(director.selectArrival().gatesComplete, true);
  assert.equal(director.snapshot().flags.includes("gate:5:2"), true);

  director.enterStage({ stageIndex: 6, stageId: "toward-home" });
  for (let actIndex = 0; actIndex < 3; actIndex += 1) {
    director.enterAct({ actIndex, actId: Content.STAGE_BLUEPRINTS[6].segments[actIndex].id });
    const definition = Director.SEMANTIC_CHOREOGRAPHY[6][actIndex];
    for (let index = 0; index < definition.required; index += 1) {
      const action = definition.steps[index % definition.steps.length];
      director.ingest({ id: `seven-${actIndex}-${index}`, type: "obstacle-dodged", causeId: `seven-${actIndex}-${index}`, action, semanticStep: action });
    }
  }
  assert.equal(director.selectArrival().gatesComplete, true);
  assert.equal(director.snapshot().actMilestones["6:2"].matched, 3);
});

test("persists different relationship and world branches from physical route choices", () => {
  const attentive = Director.createDirector();
  attentive.enterStage({ stageIndex: 5, stageId: "rough-weather" });
  attentive.ingest({ id: "towel", type: "route-choice", decisionId: "storm-choice", itemId: "dry-towel", relationshipAxis: "attention", worldEffect: "storm-cover" });
  assert.equal(attentive.selectArrival().dominantAxis, "attention");
  assert.equal(attentive.snapshot().worldState.branch.worldEffect, "storm-cover");

  const restorative = Director.createDirector();
  restorative.enterStage({ stageIndex: 5, stageId: "rough-weather" });
  restorative.ingest({ id: "note", type: "route-choice", decisionId: "storm-choice", itemId: "folded-note", relationshipAxis: "repair", worldEffect: "clear-words" });
  assert.equal(restorative.selectArrival().dominantAxis, "repair");
  assert.equal(restorative.snapshot().worldState.branch.worldEffect, "clear-words");
  assert.notDeepEqual(restorative.snapshot().relationAxes, attentive.snapshot().relationAxes);
});

test("makes collisions damage a carried object and the next clean action repair it", () => {
  const director = Director.createDirector();
  director.enterStage({ stageIndex: 5, stageId: "rough-weather" });
  director.enterAct({ actIndex: 1, actId: "closure-detour" });
  director.ingest({ id: "choice-note", type: "route-choice", decisionId: "stance", itemId: "folded-note" });
  const hit = director.ingest({ id: "hit-1", type: "obstacle-hit", causeId: "flood-board" });
  assert.ok(hit.some((command) => command.channel === "scene" && command.payload.outcome === "strained"));
  assert.equal(director.snapshot().cargo[0].integrity, 80);
  const recovery = director.ingest({ id: "recover-1", type: "obstacle-dodged", causeId: "dry-board", action: "switch" });
  assert.ok(recovery.some((command) => command.op === "recover"));
  assert.equal(director.snapshot().cargo[0].integrity, 100);
  assert.equal(director.snapshot().relationAxes.repair > 0, true);
});

test("selects arrival props from committed decisions instead of random inventory", () => {
  const director = Director.createDirector();
  director.enterStage({ stageIndex: 0, stageId: "first-sight" });
  director.ingest({ id: "photo", type: "route-choice", decisionId: "first", itemId: "dropped-photo", resolution: "strained" });
  director.ingest({ id: "umbrella", type: "route-choice", decisionId: "second", itemId: "shared-umbrella", resolution: "clean" });
  assert.equal(director.selectArrival().featuredItemId, "shared-umbrella");
});

test("restores a serializable deterministic snapshot without replaying stale commands", () => {
  const director = Director.createDirector();
  director.enterStage({ stageIndex: 6, stageId: "toward-home" });
  director.enterAct({ actIndex: 2, actId: "home-straight" });
  director.ingest({ id: "home-key", type: "route-choice", decisionId: "keys", itemId: "home-key" });
  const saved = JSON.parse(JSON.stringify(director.snapshot()));
  const restored = Director.createDirector({ state: saved });
  assert.deepEqual(restored.snapshot(), director.snapshot());
  assert.deepEqual(restored.drainCommands(), []);
  assert.deepEqual(restored.ingest({ id: "home-key", type: "route-choice", decisionId: "keys", itemId: "home-key" }), []);
});

test("does not invent choices or relationship progress while only time passes", () => {
  const director = Director.createDirector();
  director.enterStage({ stageIndex: 0, stageId: "first-sight" });
  for (let second = 0; second < 30; second += 1) director.tick(1);
  const state = director.snapshot();
  assert.equal(state.cleanActions, 0);
  assert.equal(state.recoveredActions, 0);
  assert.deepEqual(state.decisions, {});
  assert.deepEqual(state.memories, {});
});
