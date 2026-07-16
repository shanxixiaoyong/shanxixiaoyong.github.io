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
  for (const token of ["window.RunnerLoveRules", "window.RunnerLoveEngine", "window.RunnerLoveContent", "window.RunnerLoveDirector", "engineApi.createEngine", "director.ingest", "rules.commitStoryState", "rules.recordMoment", "rules.advanceTime", "content.selectArrival", "content.getEnding", "window.RunnerLoveVisuals.create(canvas)"]) assert.ok(source.includes(token), token);
});

test("routes physical actions through one causal director instead of explaining relationships with pickups", () => {
  assert.match(source, /function recordDirectorFact/);
  assert.match(source, /type: "obstacle-dodged"/);
  assert.match(source, /type: "obstacle-hit"/);
  assert.match(source, /inputSeq:/);
  assert.match(source, /nodeId:/);
  assert.match(source, /visualRuntime\?\.applyDirectorCommand/);
  assert.match(source, /audio\.applyDirectorCommand/);
});

test("connects swipe and keyboard controls to the classic three-lane action set", () => {
  for (const action of ["left", "right", "jump", "slide"]) assert.ok(source.includes(`"${action}"`), action);
  assert.match(source, /pointerdown/);
  assert.match(source, /pointermove/);
  assert.match(source, /pointerup/);
  assert.match(source, /pointercancel/);
  assert.match(source, /lostpointercapture/);
  assert.match(source, /gestureThreshold/);
  assert.match(source, /event\.pointerId !== pointerStart\.id/);
  assert.match(source, /pointerStart\.handled = true;\s*input\(/);
  assert.match(source, /\{ passive: false \}/);
  assert.match(source, /ArrowLeft/);
  assert.match(source, /ArrowUp/);
});

test("paces each route around three minutes without a hard timer gate", () => {
  assert.equal((rules.match(/expectedSeconds:\s*180/g) || []).length, 7);
  assert.doesNotMatch(rules, /progress >= definition\.target && next\.stage\.elapsed/);
  assert.match(source, /Math\.max\(1\.72, 2\.82 - speedRatio \* 1\.02/);
  assert.match(source, /startSpeed:\s*17\.2/);
  assert.match(source, /maxSpeed:\s*36/);
  assert.doesNotMatch(source, /Math\.max\(progressRatio, timeRatio\)/);
  assert.match(source, /director\.planPattern/);
});

test("builds a readable arcade loop with onboarding trails, pickups, streak rewards, and rising pressure", () => {
  assert.match(source, /ONBOARDING_ACTIONS = Object\.freeze\(\["jump", "switch", "slide"\]\)/);
  assert.match(source, /const tokenCount = stageIndex === 0 \? 9 : 12/);
  assert.match(source, /resolveObstacleSemantic/);
  assert.match(source, /clueFamily: stageIndex === 0/);
  assert.match(source, /height: jumpArc/);
  assert.match(source, /type: "powerup"/);
  assert.match(source, /powerupPickup: powerupType/);
  assert.match(source, /function addArcadeCombo/);
  assert.match(source, /Math\.floor\(arcadeCombo \/ 8\)/);
  assert.match(source, /activateArcadePowerup/);
  assert.match(source, /breakArcadeCombo\(\)/);
});

test("rotates solvable obstacle patterns and offers sparse intentional two-lane story choices", () => {
  const patternIds = [...source.matchAll(/Object\.freeze\(\{ id: "([^"]+)", choiceZ:/g)].map((match) => match[1]);
  assert.ok(patternIds.length >= 10, patternIds.join(", "));
  assert.equal(new Set(patternIds).size, patternIds.length);
  for (const subtype of ["barrier", "signal-gate", "service-cart", "train"]) assert.ok(source.includes(`form: "${subtype}"`) || source.includes(`subtype: "${subtype}"`), subtype);
  for (const movement of ["jump", "slide", "switch"]) assert.ok(source.includes(`avoid: "${movement}"`), movement);
  assert.match(source, /directorPlan\.choiceLanes\.forEach\(\(lane, laneOffset\)/);
  assert.match(source, /inputSeqAtSpawn/);
  assert.match(source, /inputSeqAtWindow/);
  assert.match(source, /rewardNearMiss: requiredAction === "switch"/);
  assert.match(source, /type: "route-choice"/);
  assert.match(source, /choiceGroup/);
});

test("lets story rules own stage changes throughout the full long-form run", () => {
  assert.match(source, /duration:\s*3600/);
  assert.match(source, /manualStages:\s*true/);
  assert.match(source, /motion\.seekStage/);
  assert.match(source, /motion\.syncStage/);
  assert.match(source, /if \(arrivalElapsed >= arrivalDuration\) finishArrival\(\)/);
  assert.match(source, /beginStageIntro\("next"\)/);
  assert.match(source, /mode = "stage-intro"/);
  assert.match(source, /clearStageWorld\(\)/);
  assert.match(source, /motion\.clearEntities\?\.\(\{ modules: true \}\)/);
});

test("authors each chapter as three themed world phases instead of recoloring one route", () => {
  for (const token of ["雨后校园", "晨雾书店", "霓虹站前", "夜市河岸", "清晨生活", "暴雨高架", "黎明归途"]) assert.ok(source.includes(token), token);
  assert.match(source, /collectibleKinds/);
  assert.match(source, /obstacleForms/);
  assert.match(source, /worldCue/);
  assert.match(source, /phaseItemIds/);
  assert.match(source, /stageId: content\.STAGES\[stageIndex\]\.id/);
  assert.match(source, /director: segment\.director/);
});

test("surfaces danger, a dedicated failure state, and checkpoint recovery", () => {
  assert.match(source, /function updateConditionFeedback/);
  assert.match(source, /mode = "failure"/);
  assert.match(source, /runState\.failure/);
  assert.match(source, /data-condition-band/);
  assert.match(source, /rules\.retryFromCheckpoint/);
  assert.match(source, /beginStageIntro\("retry"\)/);
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
  assert.match(source, /acceleration:\s*0\.082/);
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
