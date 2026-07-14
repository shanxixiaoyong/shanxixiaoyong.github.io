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
  assert.equal(typeof context.globalThis.RunnerLoveEngine.activatePowerup, "function");
  assert.deepEqual(Array.from(context.globalThis.RunnerLoveEngine.LANES), [-1, 0, 1]);
  assert.deepEqual(Array.from(context.globalThis.RunnerLoveEngine.POWERUP_TYPES), ["magnet", "shield", "multiplier", "overdrive"]);
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

test("applies a bounded temporary rush boost and eases back to cruise speed", () => {
  const run = game({ startSpeed: 10, maxSpeed: 12, acceleration: 0 });
  run.boost(3, 0.5);
  assert.equal(run.state.boostSpeed, 3);
  assert.equal(run.state.boostTime, 0.5);
  assert.ok(run.drainEvents().some((event) => event.type === "boost"));
  run.step(0.1);
  assert.ok(run.state.speed > 10);
  advance(run, 1.5);
  assert.equal(run.state.boostTime, 0);
  assert.equal(run.state.boostSpeed, 0);
  assert.ok(run.state.speed <= 12);
});

test("accelerates smoothly from time and distance while exposing progress and speed tiers", () => {
  const run = game({ duration: 20, finaleSeconds: 0, startSpeed: 10, maxSpeed: 20, acceleration: 1 });
  const speeds = [run.state.speed];
  for (let index = 0; index < 60; index += 1) {
    run.step(0.1);
    speeds.push(run.state.speed);
  }
  assert.ok(speeds.every((speed, index) => index === 0 || speed >= speeds[index - 1]));
  assert.ok(speeds.every((speed, index) => index === 0 || speed - speeds[index - 1] <= 0.25));
  assert.ok(run.state.speed > 15);
  assert.ok(run.state.runProgress > 0.29 && run.state.runProgress < 0.31);
  assert.ok(run.state.speedProgress > 0.5);
  assert.equal(run.state.progress, run.state.speedProgress);
  assert.ok(run.state.speedTier >= 2);

  run.spawn({ type: "obstacle", lane: 0, z: run.state.config.collisionDepth + run.state.speed * 0.1, avoid: "slide" });
  run.step(0.1);
  const collisionSpeed = run.state.speed;
  advance(run, 3);
  assert.ok(run.state.speed > collisionSpeed + 2.5);
});

test("magnet collects only ordinary collectibles in the current or adjacent lane", () => {
  const run = game({ startSpeed: 10, maxSpeed: 10, acceleration: 0 });
  run.state.lane = -1;
  run.state.lanePosition = -1;
  run.activatePowerup("magnet", { duration: 0.3 });
  assert.equal(run.state.powerups.magnet.active, true);
  assert.ok(run.drainEvents().some((event) => event.type === "powerup-start" && event.powerup === "magnet"));

  const adjacent = run.spawn({ type: "collectible", lane: 0, z: 1.5, points: 2 });
  const distant = run.spawn({ type: "collectible", lane: 1, z: 1.5, points: 2 });
  const story = run.spawn({ type: "story-item", lane: 0, z: 1.5, points: 5 });
  run.step(0.1);
  assert.equal(adjacent.collected, true);
  assert.equal(distant.collected, false);
  assert.equal(story.collected, false);
  assert.ok(run.drainEvents().some((event) => event.type === "collect" && event.source === "magnet"));

  advance(run, 0.2);
  assert.equal(run.state.powerups.magnet.active, false);
  assert.ok(run.drainEvents().some((event) => event.type === "powerup-end" && event.powerup === "magnet"));
});

test("shield blocks exactly one collision and emits its consumption lifecycle", () => {
  const run = game({ startSpeed: 10, maxSpeed: 10, acceleration: 0 });
  run.activatePowerup("shield", { duration: 2 });
  run.drainEvents();
  const protectedSpeed = run.state.speed;
  run.spawn({ type: "obstacle", lane: 0, z: 1.5, avoid: "slide" });
  run.step(0.1);
  assert.equal(run.state.hits, 0);
  assert.equal(run.state.speed, protectedSpeed);
  assert.equal(run.state.powerups.shield.active, false);
  const events = run.drainEvents();
  assert.ok(events.some((event) => event.type === "shield-block" && event.remainingCharges === 0));
  assert.ok(events.some((event) => event.type === "powerup-end" && event.reason === "consumed"));

  run.spawn({ type: "obstacle", lane: 0, z: 1.5, avoid: "slide" });
  run.step(0.1);
  assert.equal(run.state.hits, 1);
});

test("multiplier scales score and overdrive accelerates temporarily", () => {
  const run = game({ startSpeed: 10, maxSpeed: 10, acceleration: 0 });
  run.activatePowerup("multiplier", { duration: 0.2, factor: 3 });
  run.spawn({ type: "collectible", lane: 0, z: 1.5, points: 2 });
  run.step(0.1);
  assert.equal(run.state.score, 6);
  run.step(0.1);
  assert.equal(run.state.powerups.multiplier.active, false);
  assert.equal(run.state.powerups.multiplier.factor, 1);

  run.activatePowerup("overdrive", { duration: 0.3, speedBoost: 4 });
  run.drainEvents();
  run.step(0.1);
  assert.ok(run.state.speed > 10);
  assert.equal(run.state.speedTier, 4);
  advance(run, 0.2);
  assert.equal(run.state.powerups.overdrive.active, false);
  assert.equal(run.state.speedTier, 0);
  assert.ok(run.drainEvents().some((event) => event.type === "powerup-end" && event.powerup === "overdrive"));
  advance(run, 1);
  assert.equal(run.state.speed, 10);
});

test("powerup state is JSON serializable and deterministic across fixed updates", () => {
  const original = engine.createState({ fixedStep: 0.1, seed: "powerup-snapshot", duration: 10, finaleSeconds: 0 });
  engine.activatePowerup(original, "magnet", { duration: 0.4 });
  engine.activatePowerup(original, "multiplier", { duration: 0.3, multiplier: 2.5 });
  engine.addEntity(original, { type: "collectible", lane: 1, z: 2.5, points: 4 });
  original.events = [];
  const restored = JSON.parse(JSON.stringify(original));

  for (let index = 0; index < 5; index += 1) {
    engine.fixedUpdate(original);
    engine.fixedUpdate(restored);
  }
  assert.deepEqual(restored, JSON.parse(JSON.stringify(original)));
  assert.throws(() => engine.activatePowerup(original, "unknown"), RangeError);
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

test("manual story stages never advance from elapsed time alone", () => {
  const run = game({ duration: 10, finaleSeconds: 0, manualStages: true, stages: [
    { id: "street", from: 0, modules: ["street"] }, { id: "cinema", from: 0.2, modules: ["cinema"] }
  ] });
  advance(run, 5);
  assert.equal(run.state.stage, "street");
  run.syncStage("cinema");
  advance(run, 1);
  assert.equal(run.state.stage, "cinema");
});

test("selects one physical route item and deactivates its sibling choices", () => {
  const run = game({ startSpeed: 10, maxSpeed: 10, acceleration: 0 });
  ["book", "coffee", "ticket"].forEach((itemId, index) => run.spawn({
    type: "route-choice", lane: index - 1, z: 1.5, itemId,
    choiceGroup: "route-1", choiceId: `route-1-${itemId}`
  }));
  run.step(0.1);
  assert.equal(run.state.routeChoices["route-1"], "route-1-coffee");
  const events = run.drainEvents();
  assert.ok(events.some((event) => event.type === "route-choice" && event.itemId === "coffee"));
  assert.equal(run.state.entities.some((entity) => entity.choiceGroup === "route-1"), false);
});

test("reports a missed story item after it passes the player", () => {
  const run = game({ startSpeed: 10, maxSpeed: 10, acceleration: 0 });
  run.spawn({ type: "story-item", lane: 1, z: 1.5, itemId: "umbrella" });
  const events = [];
  for (let index = 0; index < 8; index += 1) {
    run.step(0.1);
    events.push(...run.drainEvents());
  }
  assert.ok(events.some((event) => event.type === "story-missed" && event.entity.itemId === "umbrella"));
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
