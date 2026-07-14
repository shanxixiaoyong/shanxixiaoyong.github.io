"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets/runner-love-game.js"), "utf8");
const rules = fs.readFileSync(path.join(root, "assets/runner-love-rules.js"), "utf8");
const visuals = fs.readFileSync(path.join(root, "assets/runner-love-visuals.js"), "utf8");

test("integrates rules, fixed-step motion, authored content, and the independent renderer", () => {
  for (const token of ["window.RunnerLoveRules", "window.RunnerLoveEngine", "window.RunnerLoveContent", "engineApi.createEngine", "rules.recordMoment", "rules.advanceTime", "content.selectArrival", "content.getEnding", "window.RunnerLoveVisuals.create(canvas)"]) assert.ok(source.includes(token), token);
});

test("keeps the runner alone on the route and introduces the other character only at destinations", () => {
  assert.doesNotMatch(source, /companion-sync|companion-missed|response-missed|paired-response/);
  assert.doesNotMatch(source, /type:\s*"companion-cue"/);
  assert.match(visuals, /this\.companion\.visible = arriving/);
  assert.match(visuals, /this\.companion\.visible = false/);
  assert.match(source, /mode = "arrival"/);
});

test("connects swipe and keyboard controls to the classic three-lane action set", () => {
  for (const action of ["left", "right", "jump", "slide"]) assert.ok(source.includes(`"${action}"`), action);
  assert.match(source, /pointerdown/);
  assert.match(source, /pointerup/);
  assert.match(source, /pointercancel/);
  assert.match(source, /gestureThreshold/);
  assert.match(source, /event\.pointerId !== pointerStart\.id/);
  assert.match(source, /ArrowLeft/);
  assert.match(source, /ArrowUp/);
});

test("paces each route around three minutes without a hard timer gate", () => {
  assert.equal((rules.match(/expectedSeconds:\s*180/g) || []).length, 7);
  assert.doesNotMatch(rules, /progress >= definition\.target && next\.stage\.elapsed/);
  assert.match(source, /spawnClock = spawned \? 3\.8 \+ \(patternCursor % 3\) \* 0\.24 : 0\.24/);
  assert.match(source, /Math\.max\(progressRatio, timeRatio\)/);
});

test("rotates solvable obstacle patterns and offers one physical item on every lane", () => {
  const patternIds = [...source.matchAll(/Object\.freeze\(\{ id: "([^"]+)", choiceZ:/g)].map((match) => match[1]);
  assert.ok(patternIds.length >= 10, patternIds.join(", "));
  assert.equal(new Set(patternIds).size, patternIds.length);
  for (const subtype of ["barrier", "signal-gate", "service-cart", "train"]) assert.ok(source.includes(`form: "${subtype}"`) || source.includes(`subtype: "${subtype}"`), subtype);
  for (const movement of ["jump", "slide", "switch"]) assert.ok(source.includes(`avoid: "${movement}"`), movement);
  assert.match(source, /\[-1, 0, 1\]\.forEach\(\(lane, laneOffset\)/);
  assert.match(source, /type: "route-choice"/);
  assert.match(source, /choiceGroup/);
});

test("lets story rules own stage changes throughout the full long-form run", () => {
  assert.match(source, /duration:\s*3600/);
  assert.match(source, /manualStages:\s*true/);
  assert.match(source, /motion\.seekStage/);
  assert.match(source, /motion\.syncStage/);
  assert.match(source, /if \(arrivalElapsed >= arrivalDuration\) finishArrival\(\)/);
});

test("routes gameplay events into carried props, audiovisual feedback, and arrival scenes", () => {
  assert.match(source, /event\.type === "collect"/);
  assert.match(source, /\["story-item", "route-choice"\]\.includes\(event\.entity\.type\)/);
  assert.match(source, /visualRuntime\?\.carry\?\.\(item\)/);
  assert.match(source, /visualRuntime\?\.effect\("story-pickup"/);
  assert.match(source, /motion\.boost\?\.\(/);
  assert.match(source, /addFlow\(/);
  assert.match(source, /visualRuntime\?\.beginArrival\?\.\(arrivalData\)/);
  assert.match(source, /audio\.cue\("arrival"/);
});

test("turns story collections into gameplay powerups, world changes, and later narrative echoes", () => {
  assert.match(source, /content\.resolveCollectionInteraction/);
  assert.match(source, /motion\.activatePowerup\?\./);
  assert.match(source, /spawnInteractionTrail\(effect, interaction\.gameplay\.strength\)/);
  assert.match(source, /scheduleStoryEchoes\(interaction, item\)/);
  assert.match(source, /function processStoryEchoes\(\)/);
  assert.match(source, /visualRuntime\?\.effect\("story-world"/);
  assert.match(source, /visualRuntime\?\.effect\("story-synergy"/);
  assert.match(source, /audio\.interaction\?\.\(interaction\)/);
  for (const powerup of ["magnet", "shield", "multiplier", "overdrive"]) assert.ok(source.includes(`${powerup}: Object.freeze`), powerup);
});

test("surfaces progressive speed tiers and the active powerup lifecycle", () => {
  assert.match(source, /acceleration:\s*0\.018/);
  assert.match(source, /motion\.state\.speedProgress/);
  assert.match(source, /motion\.state\.speedTier/);
  assert.match(source, /function signalSpeedTier\(\)/);
  assert.match(source, /if \(motion\.state\.powerups\?\.overdrive\?\.active\) return/);
  assert.match(source, /function updateRunFeedback\(\)/);
  assert.match(source, /event\.type === "powerup-start"/);
  assert.match(source, /event\.type === "powerup-end"/);
  assert.match(source, /event\.type === "shield-block"/);
  assert.match(source, /audio\.tick\(seconds, motion\.state\.speed, true, false, flowEnergy \/ 100, motion\.state\.speedTier\)/);
});

test("provides local WebAudio, checksummed saves, adaptive resize, and BFCache lifecycle", () => {
  assert.match(source, /window\.RunnerLoveAudio\?\.create\?\.\(\)/);
  assert.match(source, /window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(source, /localStorage\.setItem\(SAVE_KEY/);
  assert.match(source, /rules\.createSave/);
  assert.match(source, /rules\.loadSave/);
  assert.match(source, /window\.addEventListener\("pagehide"/);
  assert.match(source, /window\.addEventListener\("pageshow"/);
  assert.match(source, /visualRuntime\.resize\(width, height, Number\(window\.devicePixelRatio\) \|\| 1\)/);
  assert.match(source, /window\.__runnerLoveDebug = Object\.freeze/);
});
