"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const vm = require("node:vm");
const fs = require("node:fs");
const engine = require("../assets/runner-love-engine.js");

function game(options = {}) { return engine.createEngine({ fixedStep: 0.1, ...options }); }
function advance(run, seconds) {
  for (let elapsed = 0; elapsed < seconds - 1e-9; elapsed += 0.1) run.step(Math.min(0.1, seconds - elapsed));
}

test("exports the same DOM-free UMD API in a browser context", () => {
  const context = { globalThis: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve("../assets/runner-love-engine.js"), "utf8"), context);
  assert.equal(typeof context.globalThis.RunnerLoveEngine.createEngine, "function");
  assert.deepEqual(Array.from(context.globalThis.RunnerLoveEngine.LANES), [-1, 0, 1]);
});

test("uses a fixed step and produces deterministic modules from a seed", () => {
  const a = game({ seed: "same" }); const b = game({ seed: "same" });
  a.step(0.04); a.step(0.06); b.step(0.1);
  assert.equal(a.state.ticks, 1); assert.equal(a.state.distance, b.state.distance);
  assert.deepEqual(a.state.modules, b.state.modules);
});

test("caps catch-up at 0.25 seconds without retaining a death-spiral backlog", () => {
  const run = game({ maxFrame: 2 });
  run.step(10); assert.equal(run.state.ticks, 2); assert.ok(Math.abs(run.state.accumulator - 0.05) < 1e-12);
  run.step(0.05); assert.equal(run.state.ticks, 3); assert.ok(Math.abs(run.state.accumulator) < 1e-12);
});

test("changes only among three lanes and runs jump and slide timers", () => {
  const run = game();
  run.step(0.1, ["left", "left"]); assert.equal(run.state.lane, -1);
  run.step(0.1, "jump"); assert.equal(run.state.action, "jump"); assert.ok(run.state.vertical > 0);
  advance(run, 0.8); assert.equal(run.state.action, "run");
  run.step(0.1, "slide"); assert.equal(run.state.action, "slide");
  advance(run, 0.7); assert.equal(run.state.action, "run");
});

test("eases lane position and requires a jump for elevated collectible arcs", () => {
  const run = game({ startSpeed: 10, maxSpeed: 10, acceleration: 0, laneChangeDuration: 0.3 });
  run.step(0.1, "left");
  assert.equal(run.state.lane, -1);
  assert.ok(run.state.lanePosition < 0 && run.state.lanePosition > -1);
  advance(run, 0.2);
  assert.equal(run.state.lanePosition, -1);

  const high = run.spawn({ type: "collectible", lane: -1, z: 1.5, height: 1.1 });
  run.step(0.1);
  assert.equal(high.collected, false);
  const airborne = run.spawn({ type: "collectible", lane: -1, z: 1.5, height: 1.1 });
  run.step(0.1, "jump");
  assert.equal(airborne.collected, true);
});

test("emits dodge and near-miss rewards and protects consecutive collisions", () => {
  const run = game({ startSpeed: 10, maxSpeed: 10, acceleration: 0 });
  run.spawn({ type: "obstacle", lane: 0, z: 1.5, avoid: "jump" });
  run.step(0.1, "jump");
  assert.equal(run.state.dodges, 1);
  assert.ok(run.drainEvents().some((event) => event.type === "dodge"));

  run.spawn({ type: "obstacle", lane: 1, z: 1.5, avoid: "switch", rewardNearMiss: true });
  run.step(0.1);
  assert.equal(run.state.nearMisses, 1);

  run.spawn({ type: "obstacle", lane: 0, z: 1.5, avoid: "slide" });
  run.step(0.1);
  assert.equal(run.state.hits, 1);
  run.spawn({ type: "obstacle", lane: 0, z: 1.5, avoid: "slide" });
  run.step(0.1);
  assert.equal(run.state.hits, 1);
  assert.ok(run.drainEvents().some((event) => event.type === "protected"));
  const postHitSpeed = run.state.speed;
  advance(run, 3);
  assert.ok(run.state.speed > postHitSpeed + 2.5);
});

test("advances perspective z and resolves obstacles and collectibles", () => {
  const run = game({ startSpeed: 10, maxSpeed: 10, acceleration: 0 });
  const obstacle = run.spawn({ type: "obstacle", lane: 0, z: 1.5, avoid: "slide" });
  run.step(0.1); assert.equal(obstacle.z, 0.5); assert.equal(run.state.hits, 1);
  run.state.lane = -1;
  const heart = run.spawn({ type: "collectible", lane: -1, z: 1.5, points: 3 });
  run.step(0.1); assert.equal(heart.collected, true); assert.equal(run.state.score, 3);
});

test("recycles inactive entities immediately", () => {
  const run = game({ startSpeed: 10, maxSpeed: 10, acceleration: 0 });
  const missed = run.spawn({ lane: 1, z: -4.5 });
  const collected = run.spawn({ lane: 0, z: 1.5 });
  run.step(0.1);
  assert.equal(missed.active, false); assert.equal(collected.collected, true);
  assert.deepEqual(run.state.entities, []);
});

test("syncs stages with events and seeks stages silently without changing randomness", () => {
  const run = game({ seed: "stage-seek", stages: [
    { id: "a", from: 0, modules: ["a"] }, { id: "b", from: 0.5, modules: ["b"] }
  ] });
  const randomState = run.state.randomState;
  run.syncStage("b");
  assert.equal(run.state.stageIndex, 1); assert.equal(run.drainEvents()[0].type, "stage");
  run.seekStage(0);
  assert.equal(run.state.stage, "a"); assert.deepEqual(run.drainEvents(), []);
  assert.equal(run.state.randomState, randomState);
  assert.throws(() => run.seekStage("missing"), RangeError);
});

test("opens and completes paired response windows", () => {
  const run = game({ startSpeed: 10, maxSpeed: 10, acceleration: 0, responseWindow: 1 });
  run.spawn({ pairId: "hello", lane: 0, z: 1.5 }); run.step(0.1);
  assert.equal(run.state.response.pairId, "hello");
  run.spawn({ responseTo: "hello", lane: 0, z: 1.5 }); run.step(0.1);
  assert.equal(run.state.responses, 1); assert.equal(run.state.response, null);
});

test("checks companion cues against matching player actions", () => {
  const run = game({ startSpeed: 10, maxSpeed: 10, acceleration: 0 });
  run.spawn({ type: "companion-cue", cue: "jump", lane: 0, z: 1.5 }); run.step(0.1);
  run.step(0.1, "jump"); assert.equal(run.state.companion.synced, 1);
});

test("switches stage modules and keeps the final twenty seconds obstacle-free", () => {
  const run = game({ duration: 30, finaleSeconds: 20, stages: [
    { id: "a", from: 0, modules: ["a-road"] }, { id: "b", from: 0.5, modules: ["b-road"] }
  ] });
  advance(run, 5.1); assert.equal(run.state.stage, "b");
  const obstacle = run.spawn({ type: "obstacle", lane: 0, z: 80 });
  advance(run, 5); assert.equal(run.state.finale, true);
  assert.equal(run.state.hits, 0); assert.equal(obstacle.active, false);
  assert.equal(run.spawn({ type: "obstacle" }).active, false);
  assert.equal(run.state.entities.some((entity) => entity.type === "obstacle"), false);
});
