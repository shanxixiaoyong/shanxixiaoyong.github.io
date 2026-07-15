"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets/runner-love-game.js"), "utf8");
const RunnerLoveRules = require("../assets/runner-love-rules.js");
const RunnerLoveEngine = require("../assets/runner-love-engine.js");
const RunnerLoveContent = require("../assets/runner-love-content.js");
const RunnerLoveDirector = require("../assets/runner-love-director.js");

class ClassList {
  constructor() { this.values = new Set(); }
  toggle(value, force) {
    const enabled = force === undefined ? !this.values.has(value) : Boolean(force);
    if (enabled) this.values.add(value); else this.values.delete(value);
    return enabled;
  }
}

class Node {
  constructor() {
    this.hidden = false;
    this.textContent = "";
    this.innerHTML = "";
    this.children = [];
    this.listeners = {};
    this.classList = new ClassList();
    this.style = { values: {}, setProperty(name, value) { this.values[name] = value; } };
    this.attributes = {};
  }
  addEventListener(name, listener) { this.listeners[name] = listener; }
  appendChild(node) { this.children.push(node); return node; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  setPointerCapture() {}
  getBoundingClientRect() { return { width: 720, height: 1280 }; }
}

function drawingContext() {
  const gradient = { addColorStop() {} };
  return new Proxy({}, {
    get(target, key) {
      if (key === "createLinearGradient" || key === "createRadialGradient") return () => gradient;
      if (!(key in target)) target[key] = () => {};
      return target[key];
    },
    set(target, key, value) { target[key] = value; return true; }
  });
}

function boot() {
  const nodes = new Map();
  const canvas = new Node();
  canvas.getContext = drawingContext;
  const stageTrack = new Node();
  stageTrack.children = Array.from({ length: 7 }, () => new Node());
  nodes.set("#runner-canvas", canvas);
  nodes.set("[data-stage-track]", stageTrack);
  const querySelector = (selector) => {
    if (!nodes.has(selector)) nodes.set(selector, new Node());
    return nodes.get(selector);
  };
  const values = new Map();
  const localStorage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value))
  };
  const document = { hidden: false, querySelector, createElement: () => new Node(), addEventListener() {} };
  const window = { RunnerLoveRules, RunnerLoveEngine, RunnerLoveContent, RunnerLoveDirector, localStorage, addEventListener() {} };
  let now = 1000;
  const performance = { now: () => now };
  const sandbox = {
    window, document, localStorage, performance, console,
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
    setTimeout: () => 1,
    clearTimeout() {},
    Math
  };
  vm.runInNewContext(source, sandbox, { filename: "runner-love-game.js" });
  return { debug: window.__runnerLoveDebug, nodes, setNow(value) { now = value; } };
}

test("boots the real runtime in intro mode with the long-form seven-stage state", () => {
  const { debug } = boot();
  const state = debug.snapshot();
  assert.equal(state.mode, "intro");
  assert.equal(state.runState.stageIndex, 0);
  assert.equal(state.runState.condition, 100);
  assert.equal(state.runState.stage.expectedSeconds, 180);
  assert.equal(state.motion.stage, RunnerLoveContent.STAGES[0].id);
  assert.deepEqual(Object.keys(debug).sort(), ["beat", "completeStage", "fact", "fail", "finishArrival", "finishStageIntro", "input", "moment", "powerup", "reset", "retry", "save", "snapshot", "spawn", "start", "step"].sort());
});

test("auto-run advances the road but cannot grant relationship progress without intentional input", () => {
  const { debug } = boot();
  debug.start();
  debug.finishStageIntro();
  const state = debug.step(60000);
  assert.equal(state.runState.stage.progress, 0);
  assert.equal(state.runState.stage.items.length, 0);
  assert.equal(state.runState.status, "failed");
  assert.ok(state.motion.distance > 0);
  assert.equal(Object.values(state.director.decisions).filter((decision) => decision.itemId).length, 0);
  assert.equal(state.director.cargo.length, 0);
});

test("accepts swipe-equivalent actions through the fixed-step three-lane engine", () => {
  const { debug } = boot();
  debug.start();
  assert.equal(debug.snapshot().mode, "stage-intro");
  assert.equal(debug.input("left"), false);
  assert.equal(debug.finishStageIntro(), true);
  debug.input("left");
  let state = debug.step(100);
  assert.equal(state.motion.lane, -1);
  debug.input("jump");
  state = debug.step(100);
  assert.equal(state.motion.action, "jump");
});

test("starts a genuinely fresh run without checkpoint-only variables or stale motion", () => {
  const { debug } = boot();
  debug.start();
  debug.finishStageIntro();
  debug.input("left");
  debug.step(500);
  const reset = debug.reset();
  assert.equal(reset.mode, "intro");
  assert.equal(reset.runState.stageIndex, 0);
  assert.equal(reset.motion.lane, 0);
  assert.equal(reset.motion.entities.length, 0);
  assert.equal(reset.scheduler.patternCursor, 0);
});

test("pauses at a destination with the selected physical item before the next route", () => {
  const { debug } = boot();
  debug.start();
  const state = debug.completeStage("perfect");
  assert.equal(state.mode, "arrival");
  assert.equal(state.pausedStage, 0);
  assert.equal(state.runState.stageIndex, 1);
  assert.equal(state.motion.stageIndex, 0);
  assert.equal(state.arrival.venue, "图书馆路口");
  assert.ok(state.arrival.itemIds.includes(state.arrival.itemId));
  assert.ok(state.arrival.items.length >= 1 && state.arrival.items.length <= 3);
  assert.ok(state.runState.stageRecords[0].elapsed >= 0);

  assert.equal(debug.finishArrival(), true);
  let resumed = debug.snapshot();
  assert.equal(resumed.mode, "stage-intro");
  assert.equal(resumed.motion.stageIndex, 1);
  assert.equal(resumed.pausedStage, null);
  assert.equal(resumed.motion.entities.length, 0);
  assert.equal(resumed.stageIntro.stageIndex, 1);
  debug.finishStageIntro();
  resumed = debug.snapshot();
  assert.equal(resumed.mode, "playing");
  assert.equal(resumed.motion.entities.length, 0);
});

test("completes seven arrival films and persists the final rating", () => {
  const { debug } = boot();
  debug.start();
  for (let stage = 0; stage < 7; stage += 1) {
    const state = debug.completeStage("perfect");
    assert.equal(state.mode, "arrival");
    assert.equal(state.arrival.stageIndex, stage);
    debug.finishArrival();
    if (stage < 6) {
      assert.equal(debug.snapshot().mode, "stage-intro");
      debug.finishStageIntro();
    }
  }
  const final = debug.snapshot();
  assert.equal(final.mode, "result");
  assert.equal(final.runState.status, "completed");
  assert.equal(final.runState.grade, "S");
  assert.equal(final.saved.profile.completedRuns, 1);
  assert.equal(final.saved.profile.visitedDestinations.length, 7);
});

test("makes listening, moving the chain, two locks, and the final threshold player-controlled", () => {
  const { debug } = boot();
  debug.start();
  for (let stage = 0; stage < 5; stage += 1) {
    debug.completeStage("perfect");
    debug.finishArrival();
    debug.finishStageIntro();
  }
  let state = debug.completeStage("perfect");
  assert.equal(state.arrival.stageIndex, 5);
  state = debug.step(5000);
  assert.equal(state.mode, "arrival");
  assert.equal(state.arrivalInteraction.prompted, true);
  assert.equal(debug.input("right"), false);
  assert.equal(debug.input("slide"), true);
  assert.equal(debug.input("right"), true);
  assert.equal(debug.snapshot().arrivalInteraction.completed, true);
  debug.step(5000);
  assert.equal(debug.snapshot().mode, "stage-intro");
  debug.finishStageIntro();

  state = debug.completeStage("perfect");
  assert.equal(state.arrival.stageIndex, 6);
  debug.step(5000);
  assert.equal(debug.input("left"), true);
  assert.equal(debug.input("right"), true);
  assert.equal(debug.input("jump"), true);
  debug.step(5000);
  assert.equal(debug.snapshot().mode, "result");
});

test("manual story stages stay synchronized across a route longer than the old engine limit", () => {
  const { debug } = boot();
  debug.start();
  for (let stage = 0; stage < 6; stage += 1) {
    debug.completeStage("perfect");
    debug.finishArrival();
    debug.finishStageIntro();
  }
  const state = debug.snapshot();
  assert.equal(state.runState.stageIndex, 6);
  assert.equal(state.motion.stageIndex, 6);
  assert.equal(state.motion.stage, RunnerLoveContent.STAGES[6].id);
  assert.equal(state.motion.entities.some((entity) => entity.type === "companion-cue"), false);
});

test("retries a failed route from its checkpoint with half the stage time retained", () => {
  const definition = RunnerLoveRules.STAGES[0];
  const { debug } = boot();
  debug.start();
  for (let index = 0; index < definition.checkpoint; index += 1) debug.beat("good");
  while (debug.snapshot().runState.status === "playing") debug.moment({ outcome: "miss", kind: "collision" });
  assert.equal(debug.snapshot().mode, "failure");
  assert.equal(debug.snapshot().conditionBand, "failed");
  debug.retry();
  let state = debug.snapshot();
  assert.equal(state.mode, "stage-intro");
  assert.equal(state.stageIntro.reason, "retry");
  debug.finishStageIntro();
  state = debug.snapshot();
  assert.equal(state.mode, "playing");
  assert.equal(state.runState.stage.progress, definition.checkpoint);
  assert.equal(state.runState.stage.elapsed, 0);
  assert.equal(state.runState.condition, RunnerLoveRules.RULES.retryCondition);
});

test("restores checkpoint entities and scheduler exactly instead of deleting the nearby route", () => {
  const definition = RunnerLoveRules.STAGES[0];
  const { debug } = boot();
  debug.start();
  debug.finishStageIntro();
  debug.spawn({ type: "obstacle", lane: 1, z: 47, avoid: "jump", patternId: "checkpoint-obstacle" });
  for (let index = 0; index < definition.checkpoint; index += 1) debug.beat("good");
  const checkpoint = debug.snapshot();
  const expectedEntity = checkpoint.motion.entities.find((entity) => entity.patternId === "checkpoint-obstacle");
  assert.ok(expectedEntity);
  while (debug.snapshot().runState.status === "playing") debug.moment({ outcome: "miss", kind: "collision" });
  debug.retry();
  let restored = debug.snapshot();
  assert.deepEqual(restored.motion.entities.find((entity) => entity.patternId === "checkpoint-obstacle"), expectedEntity);
  assert.deepEqual(restored.scheduler, checkpoint.scheduler);
  debug.finishStageIntro();
  restored = debug.snapshot();
  assert.deepEqual(restored.motion.entities.find((entity) => entity.patternId === "checkpoint-obstacle"), expectedEntity);
});

test("exposes a reachable failure state with escalating danger and a structured reason", () => {
  const { debug, nodes } = boot();
  debug.start();
  debug.finishStageIntro();
  const failed = debug.fail("collision");
  assert.equal(failed.mode, "failure");
  assert.equal(failed.runState.status, "failed");
  assert.equal(failed.runState.condition, 0);
  assert.equal(failed.runState.failure.code, "condition-depleted");
  assert.equal(nodes.get("[data-failure]").hidden, false);
  assert.equal(nodes.get("[data-result]").hidden, true);
});
