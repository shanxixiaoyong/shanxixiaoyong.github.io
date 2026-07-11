"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets/runner-love-game.js"), "utf8");

test("integrates rules, fixed-step motion and content rather than duplicating domain data", () => {
  for (const token of ["window.RunnerLoveRules", "window.RunnerLoveEngine", "window.RunnerLoveContent", "engineApi.createEngine", "rules.recordBeat", "rules.advanceTime", "content.STAGE_ENDINGS", "content.getEnding"]) assert.ok(source.includes(token), token);
});

test("connects swipe, keyboard, companion cues, scene changes and BFCache lifecycle", () => {
  for (const action of ["left", "right", "jump", "slide"]) assert.ok(source.includes(`\"${action}\"`), action);
  assert.match(source, /pointerdown/); assert.match(source, /pointerup/); assert.match(source, /companion-sync/);
  assert.match(source, /01-encounter\.jpg/); assert.match(source, /02-familiar\.jpg/); assert.match(source, /03-ambiguous\.jpg/);
  assert.match(source, /window\.addEventListener\("pagehide"/); assert.match(source, /window\.addEventListener\("pageshow"/);
});

test("closes finale, stage-sync, pointer cancellation and lifecycle integration gaps", () => {
  assert.match(source, /finaleSeconds:\s*20/); assert.match(source, /!motion\.state\.finale && currentStageIndex\(\) < 6/); assert.match(source, /motion\.seekStage/);
  assert.match(source, /event\.entity\.type === "collectible"/); assert.match(source, /companion-missed/); assert.match(source, /response-missed/);
  assert.match(source, /gestureThreshold/); assert.match(source, /event\.pointerId !== pointerStart\.id/); assert.match(source, /pointercancel/);
  assert.match(source, /audio\.suspend\(\)/); assert.match(source, /cancelAnimationFrame\(frameHandle\)/); assert.match(source, /Math\.min\(2, Number\(window\.devicePixelRatio\)/);
});

test("provides layered local WebAudio, checksummed local saves and one debug surface", () => {
  for (const gain of ["baseGain", "warmGain", "futureGain"]) assert.ok(source.includes(`this.${gain}`), gain);
  assert.match(source, /window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(source, /localStorage\.setItem\(SAVE_KEY/); assert.match(source, /rules\.createSave/); assert.match(source, /rules\.loadSave/);
  assert.match(source, /window\.__runnerLoveDebug = Object\.freeze/);
});
