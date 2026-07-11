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
  toggle(value, force) { if (force) this.values.add(value); else this.values.delete(value); return force; }
}
class Node {
  constructor() { this.hidden = false; this.textContent = ""; this.children = []; this.listeners = {}; this.classList = new ClassList(); this.style = {}; this.attributes = {}; }
  addEventListener(name, listener) { this.listeners[name] = listener; }
  setAttribute(name, value) { this.attributes[name] = value; }
  setPointerCapture() {}
}
function drawingContext() {
  const gradient = { addColorStop() {} };
  return new Proxy({}, { get(target, key) { if (key === "createLinearGradient" || key === "createRadialGradient") return () => gradient; if (!(key in target)) target[key] = () => {}; return target[key]; }, set(target, key, value) { target[key] = value; return true; } });
}
function boot() {
  const nodes = new Map(); const canvas = new Node(); canvas.getContext = drawingContext;
  const stageTrack = new Node(); stageTrack.children = Array.from({ length: 7 }, () => new Node());
  nodes.set("#runner-canvas", canvas); nodes.set("[data-stage-track]", stageTrack);
  const querySelector = (selector) => { if (!nodes.has(selector)) nodes.set(selector, new Node()); return nodes.get(selector); };
  const values = new Map(); const localStorage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)) };
  const document = { hidden: false, querySelector, addEventListener() {} };
  const window = { RunnerLoveRules, RunnerLoveEngine, RunnerLoveContent, localStorage, addEventListener() {} };
  let now = 1000; const performance = { now: () => now };
  const sandbox = { window, document, localStorage, performance, console, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, setTimeout: () => 1, clearTimeout() {}, Math };
  vm.runInNewContext(source, sandbox, { filename: "runner-love-game.js" });
  return { debug: window.__runnerLoveDebug, nodes, setNow(value) { now = value; } };
}

test("boots the real runtime in intro mode with a valid seven-stage rule state", () => {
  const { debug } = boot(); const state = debug.snapshot();
  assert.equal(state.mode, "intro"); assert.equal(state.runState.stageIndex, 0); assert.equal(state.runState.heartbeat, 60);
  assert.deepEqual(Object.keys(debug).sort(), ["beat", "completeStage", "continueStage", "hold", "input", "reset", "result", "retry", "reveal", "save", "snapshot", "spawn", "start", "step", "time"].sort());
});

test("accepts keyboard-equivalent actions through the fixed-step three-lane engine", () => {
  const { debug } = boot(); debug.start(); debug.input("left"); let state = debug.step(100);
  assert.equal(state.motion.lane, -1); debug.input("jump"); state = debug.step(100); assert.equal(state.motion.action, "jump");
});

test("pauses for each stage performance and reaches the final long-hold reveal", () => {
  const { debug } = boot(); debug.start();
  for (let stage = 0; stage < 7; stage += 1) {
    let state = debug.completeStage("perfect");
    if (stage < 6) { assert.equal(state.mode, "performance"); debug.continueStage(); }
    else assert.equal(state.mode, "handhold");
  }
  assert.equal(debug.hold(1600), true); assert.equal(debug.snapshot().mode, "reveal"); debug.result();
  const final = debug.snapshot(); assert.equal(final.mode, "result"); assert.equal(final.runState.grade, "S"); assert.equal(final.saved.profile.completedRuns, 1);
});

test("enters a compensation segment at a reached checkpoint and persists it", () => {
  const { debug } = boot(); debug.start(); for (let i = 0; i < 5; i += 1) debug.beat("good");
  const state = debug.time(35100); assert.equal(state.runState.stage.compensation, true); assert.equal(state.runState.usedCompensation, true);
});

test("keeps the engine stage synchronized while a completed stage performance stays paused", () => {
  const { debug } = boot(); debug.start(); const state = debug.completeStage("perfect");
  assert.equal(state.runState.stageIndex, 1); assert.equal(state.motion.stageIndex, 1); assert.equal(state.pausedStage, 0);
  debug.continueStage(); assert.equal(debug.snapshot().pausedStage, null);
});

test("retries a failed run from the current stage checkpoint", () => {
  const { debug } = boot(); debug.start(); for (let index = 0; index < 5; index += 1) debug.beat("good");
  debug.time(55100); assert.equal(debug.snapshot().runState.status, "failed"); debug.retry();
  const state = debug.snapshot(); assert.equal(state.mode, "playing"); assert.equal(state.runState.stage.progress, 5); assert.ok(state.runState.heartbeat >= 60);
});

test("enters the engine finale for stage seven and does not create final-stage obstacles", () => {
  const { debug } = boot(); debug.start();
  for (let stage = 0; stage < 6; stage += 1) { debug.completeStage("perfect"); debug.continueStage(); }
  let state = debug.step(20); assert.equal(state.runState.stageIndex, 6); assert.equal(state.motion.finale, true);
  state = debug.step(1400); assert.equal(state.motion.entities.some((entity) => entity.type === "obstacle"), false);
});
