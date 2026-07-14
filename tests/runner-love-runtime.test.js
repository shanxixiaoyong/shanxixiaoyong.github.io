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
  const window = { RunnerLoveRules, RunnerLoveEngine, RunnerLoveContent, localStorage, addEventListener() {} };
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
  assert.deepEqual(Object.keys(debug).sort(), ["beat", "completeStage", "finishArrival", "input", "moment", "powerup", "reset", "retry", "save", "snapshot", "spawn", "start", "step"].sort());
});

test("accepts swipe-equivalent actions through the fixed-step three-lane engine", () => {
  const { debug } = boot();
  debug.start();
  debug.input("left");
  let state = debug.step(100);
  assert.equal(state.motion.lane, -1);
  debug.input("jump");
  state = debug.step(100);
  assert.equal(state.motion.action, "jump");
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
  const resumed = debug.snapshot();
  assert.equal(resumed.mode, "playing");
  assert.equal(resumed.motion.stageIndex, 1);
  assert.equal(resumed.pausedStage, null);
});

test("completes seven automatic arrival films and persists the final rating", () => {
  const { debug } = boot();
  debug.start();
  for (let stage = 0; stage < 7; stage += 1) {
    const state = debug.completeStage("perfect");
    assert.equal(state.mode, "arrival");
    assert.equal(state.arrival.stageIndex, stage);
    debug.finishArrival();
  }
  const final = debug.snapshot();
  assert.equal(final.mode, "result");
  assert.equal(final.runState.status, "completed");
  assert.equal(final.runState.grade, "S");
  assert.equal(final.saved.profile.completedRuns, 1);
  assert.equal(final.saved.profile.visitedDestinations.length, 7);
});

test("manual story stages stay synchronized across a route longer than the old engine limit", () => {
  const { debug } = boot();
  debug.start();
  for (let stage = 0; stage < 6; stage += 1) {
    debug.completeStage("perfect");
    debug.finishArrival();
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
  assert.equal(debug.snapshot().mode, "result");
  debug.retry();
  const state = debug.snapshot();
  assert.equal(state.mode, "playing");
  assert.equal(state.runState.stage.progress, definition.checkpoint);
  assert.equal(state.runState.stage.elapsed, 90);
  assert.equal(state.runState.condition, RunnerLoveRules.RULES.retryCondition);
});
