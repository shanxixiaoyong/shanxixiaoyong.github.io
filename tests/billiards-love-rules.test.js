"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const rules = require("../assets/billiards-love-rules.js");
const {
  RULES,
  BALLS,
  STAGES,
  FAILURE_ENDINGS,
  EARLY_SUCCESS_ENDING,
  createRunState,
  validateRunState,
  currentStage,
  stageProgress,
  interestStatus,
  availableTargets,
  remainingNumbers,
  classifyTarget,
  evaluateShot,
  computeRating
} = rules;

function shot(pottedNumbers = [], overrides = {}) {
  return {
    pottedNumbers,
    cueScratch: overrides.cueScratch === true,
    breakShot: overrides.breakShot === true,
    bankedNumbers: overrides.bankedNumbers || []
  };
}

function open(pottedNumbers = [], overrides = {}) {
  return evaluateShot(createRunState(), shot(pottedNumbers, { ...overrides, breakShot: true }));
}

function play(state, pottedNumbers = [], overrides = {}) {
  return evaluateShot(state, shot(pottedNumbers, overrides));
}

const ORDINARY_ORDER = Object.freeze([15, 1, 14, 2, 13, 3, 12, 4, 11, 5, 10, 6, 9, 7]);

function perfectOrdinaryRun(count = 14) {
  let result = open([ORDINARY_ORDER[0]]);
  for (const number of ORDINARY_ORDER.slice(1, count)) result = play(result.state, [number]);
  return result;
}

test("defines arbitrary-ball quotas, hidden stage floors, and black eight as the final gate", () => {
  assert.equal(RULES.title, "心动桌球");
  assert.equal(RULES.interest.initial, 72);
  assert.deepEqual(RULES.criticalNumbers, [8]);
  assert.deepEqual(RULES.breakRespotNumbers, []);
  assert.deepEqual(STAGES.map((stage) => stage.quota), [3, 2, 2, 1, 3, 2, 2]);
  assert.deepEqual(STAGES.map((stage) => stage.ordinaryTarget), [3, 5, 7, 8, 11, 13, 14]);
  assert.deepEqual(STAGES.map((stage) => stage.interestFloor), [38, 36, 34, 32, 30, 28, 26]);
  assert.deepEqual(STAGES.map((stage) => stage.requiresEight), [false, false, false, false, false, false, true]);
  assert.equal(BALLS.length, 15);
  assert.deepEqual(FAILURE_ENDINGS, ["losing-contact", "reckless-rejection"]);
  assert.equal(EARLY_SUCCESS_ENDING, "early-mutual-choice");
  assert.ok(Object.isFrozen(rules));
  assert.ok(STAGES.every((stage) => Object.isFrozen(stage) && Object.isFrozen(stage.ballNumbers)));
});

test("loads the same deeply frozen API through browser UMD", () => {
  const source = readFileSync(path.join(__dirname, "../assets/billiards-love-rules.js"), "utf8");
  const browser = {};
  vm.runInNewContext(source, browser, { filename: "billiards-love-rules.js" });
  assert.equal(browser.BilliardsLoveRules.STAGES.length, 7);
  assert.equal(typeof browser.BilliardsLoveRules.interestStatus, "function");
  assert.ok(Object.isFrozen(browser.BilliardsLoveRules));
  const outcome = browser.BilliardsLoveRules.evaluateShot(
    browser.BilliardsLoveRules.createRunState(),
    shot([8], { breakShot: true })
  );
  assert.equal(outcome.state.endState.ending, "reckless-rejection");
});

test("creates a JSON-safe, immutable state without exposing interest through the presentation API", () => {
  const state = createRunState();
  assert.equal(state.interest, 72);
  assert.equal(validateRunState(state), true);
  assert.deepEqual(interestStatus(state), { band: "steady", label: "自然靠近" });
  assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
  assert.ok(Object.isFrozen(state));
  assert.ok(Object.isFrozen(state.pottedNumbers));
  assert.ok(Object.isFrozen(interestStatus(state)));
  assert.throws(() => state.pottedNumbers.push(1), TypeError);
  assert.throws(() => createRunState(0), TypeError);
});

test("treats every remaining non-eight ball as a valid target and maps pots to story order", () => {
  const initial = createRunState();
  assert.deepEqual(availableTargets(initial), [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15]);
  assert.equal(currentStage(initial).id, "first-contact");
  assert.deepEqual(stageProgress(initial), {
    stage: STAGES[0], completed: 0, remaining: 3, quota: 3, target: "ordinary"
  });
  assert.equal(classifyTarget(initial, 15).storyNumber, 1);
  assert.equal(classifyTarget(initial, 15).stageStatus, "current");
  assert.equal(classifyTarget(initial, 8).stageStatus, "eight-early");

  const first = open([15]);
  assert.equal(first.pocketEvents[0].number, 15);
  assert.equal(first.pocketEvents[0].storyNumber, 1);
  assert.equal(first.pocketEvents[0].stageId, "first-contact");
  assert.equal(classifyTarget(first.state, 2).storyNumber, 2);
  assert.equal(remainingNumbers(first.state).includes(15), false);
  assert.equal(availableTargets(first.state).includes(8), false);
});

test("advances stages by arbitrary pot counts rather than physical ball numbers", () => {
  const firstStage = open([15, 2, 11]);
  assert.deepEqual(firstStage.pocketEvents.map((event) => event.storyNumber), [1, 2, 3]);
  assert.deepEqual(firstStage.newlyCompletedStageIds, ["first-contact"]);
  assert.equal(firstStage.stageAfter.id, "growing-familiar");
  assert.equal(stageProgress(firstStage.state).remaining, 2);

  const secondStage = play(firstStage.state, [1, 14]);
  assert.deepEqual(secondStage.pocketEvents.map((event) => event.storyNumber), [4, 5]);
  assert.deepEqual(secondStage.newlyCompletedStageIds, ["growing-familiar"]);
  assert.equal(secondStage.stageAfter.id, "intentional-dates");
  assert.ok(secondStage.pocketEvents.every((event) => event.completedEarly === false));
});

test("emits one stage-appropriate immutable event for every potted ball", () => {
  const outcome = open([15, 2, 11], { bankedNumbers: [2] });
  assert.equal(outcome.pocketEvents.length, 3);
  assert.deepEqual(outcome.pocketEvents.map((event) => ({
    physical: event.number,
    story: event.storyNumber,
    stage: event.stageId,
    banked: event.banked,
    credited: event.credited
  })), [
    { physical: 15, story: 1, stage: "first-contact", banked: false, credited: true },
    { physical: 2, story: 2, stage: "first-contact", banked: true, credited: true },
    { physical: 11, story: 3, stage: "first-contact", banked: false, credited: true }
  ]);
  assert.equal(outcome.events.filter((event) => event.type === "pocket").length, 3);
  assert.ok(Object.isFrozen(outcome));
  assert.ok(outcome.pocketEvents.every(Object.isFrozen));
  assert.throws(() => outcome.pocketEvents[0].storyNumber = 9, TypeError);
});

test("turns an early black eight into an immediate reckless-rejection ending", () => {
  const outcome = open([8]);
  assert.deepEqual(outcome.respotNumbers, []);
  assert.deepEqual(outcome.state.pottedNumbers, [8]);
  assert.equal(outcome.activeTiming, "eight-too-early");
  assert.equal(outcome.earlyEight.success, false);
  assert.equal(outcome.pocketEvents[0].storyNumber, 15);
  assert.equal(outcome.pocketEvents[0].completedEarly, true);
  assert.deepEqual(outcome.state.endState, {
    ended: true, status: "failed", ending: "reckless-rejection", grade: null
  });
  assert.throws(() => play(outcome.state, [1]), RangeError);
});

test("unlocks the rare early black-eight success only after sustained mutual momentum", () => {
  const perfect = perfectOrdinaryRun(7);
  assert.equal(perfect.state.potStreak, 7);
  assert.equal(perfect.state.interest, 100);
  const success = play(perfect.state, [8]);
  assert.equal(success.earlyEight.success, true);
  assert.equal(success.state.endState.status, "completed");
  assert.equal(success.state.endState.ending, EARLY_SUCCESS_ENDING);
  assert.equal(success.state.pottedNumbers.length, 8);
  assert.equal(computeRating(success.state).ending, EARLY_SUCCESS_ENDING);

  let hesitant = perfectOrdinaryRun(6).state;
  hesitant = play(hesitant, []).state;
  hesitant = play(hesitant, [12]).state;
  assert.equal(hesitant.potStreak, 1);
  const rejected = play(hesitant, [8]);
  assert.equal(rejected.earlyEight.success, false);
  assert.equal(rejected.state.endState.ending, "reckless-rejection");
});

test("requires all fourteen ordinary balls before black eight becomes the normal final target", () => {
  const beforeEight = perfectOrdinaryRun(14);
  assert.equal(beforeEight.state.pottedNumbers.length, 14);
  assert.equal(currentStage(beforeEight.state).id, "shared-future");
  assert.deepEqual(stageProgress(beforeEight.state), {
    stage: STAGES[6], completed: 1, remaining: 1, quota: 2, target: "eight"
  });
  assert.deepEqual(availableTargets(beforeEight.state), [8]);

  const finish = play(beforeEight.state, [8]);
  assert.equal(finish.earlyEight, null);
  assert.equal(finish.pocketEvents[0].storyNumber, 15);
  assert.equal(finish.pocketEvents[0].stageStatus, "current");
  assert.deepEqual(finish.newlyCompletedStageIds, ["shared-future"]);
  assert.equal(finish.state.endState.status, "completed");
  assert.equal(finish.state.endState.ending, "mutual-devotion");
  assert.equal(currentStage(finish.state), null);
  assert.deepEqual(availableTargets(finish.state), []);
});

test("raises hidden interest for consecutive pots and emits qualitative trend signals", () => {
  const first = open([15]);
  assert.equal(first.state.interest, 75);
  assert.equal(first.streakBonus, 0);
  assert.equal(first.interestTrend.direction, "up");

  const second = play(first.state, [1]);
  assert.equal(second.state.potStreak, 2);
  assert.equal(second.streakBonus, 2);
  assert.equal(second.state.interest, 80);
  assert.equal(second.interestSignal.band, "warm");

  const stageClear = play(second.state, [14]);
  assert.equal(stageClear.state.potStreak, 3);
  assert.equal(stageClear.streakBonus, 4);
  assert.deepEqual(stageClear.interestChanges.map((change) => change.code), [
    "current-stage-pot-recovery",
    "stage-complete-recovery",
    "pot-streak-bonus"
  ]);
  assert.equal(stageClear.state.interest, 93);
  assert.equal(stageClear.interestSignal.band, "devoted");
});

test("applies escalating miss losses without ending the date map", () => {
  let state = open().state;
  const losses = [];
  let result;
  for (let index = 0; index < 10; index += 1) {
    result = play(state, []);
    losses.push(result.interestDelta);
    state = result.state;
  }
  assert.deepEqual(losses.slice(0, 7), [-1, -3, -6, -6, -6, -6, -6]);
  assert.equal(state.interest, 20);
  assert.equal(STAGES[0].interestFloor, 38);
  assert.equal(result.interestSignal.band, "lost");
  assert.equal(result.interestTrend.direction, "down");
  assert.equal(state.endState.ended, false);
  assert.equal(state.endState.ending, null);
});

test("combines scratch and miss feedback while preserving exact technical statistics", () => {
  const opening = open([], { cueScratch: true });
  assert.equal(opening.state.interest, 66);
  assert.equal(opening.missEvent.counted, false);
  assert.equal(opening.scratchEvent.interestDelta, -6);
  assert.deepEqual(opening.events.map((event) => event.type), ["scratch", "miss"]);

  const miss = play(opening.state, [], { cueScratch: true });
  assert.equal(miss.interestDelta, -7);
  assert.equal(miss.missEvent.interestDelta, -1);
  assert.equal(miss.scratchEvent.interestDelta, -6);
  assert.equal(miss.state.cueScratches, 2);
  assert.equal(miss.state.consecutiveMisses, 1);
});

test("keeps ratings separate from relationship order and supports arbitrary clear sequences", () => {
  const finish = play(perfectOrdinaryRun(14).state, [8]);
  assert.equal(finish.rating.grade, "S");
  assert.equal(finish.rating.technical.grade, "S");
  assert.equal(finish.rating.rhythm.grade, "S");
  assert.equal(finish.state.pocketOrder[0], 15);
  assert.equal(finish.state.pocketOrder.at(-1), 8);
  assert.deepEqual(finish.state.violations, []);
});

test("does not mutate inputs and deeply freezes every output layer", () => {
  const state = open().state;
  const before = JSON.parse(JSON.stringify(state));
  const input = shot([15, 2], { bankedNumbers: [2] });
  const resultA = evaluateShot(state, input);
  const resultB = evaluateShot(state, input);
  assert.deepEqual(state, before);
  assert.deepEqual(resultA, resultB);
  assert.equal(Object.isFrozen(input), false);
  assert.ok(Object.isFrozen(resultA.state));
  assert.ok(Object.isFrozen(resultA.shot));
  assert.ok(Object.isFrozen(resultA.events));
  assert.ok(Object.isFrozen(resultA.interestSignal));
  assert.ok(Object.isFrozen(resultA.interestTrend));
  assert.throws(() => resultA.events.push({}), TypeError);
});

test("validates JSON round trips and rejects malformed state or shot input", () => {
  const serialized = JSON.parse(JSON.stringify(open([15]).state));
  assert.equal(validateRunState(serialized), true);
  assert.ok(Object.isFrozen(play(serialized, [2]).state));

  const missing = { ...serialized };
  delete missing.interest;
  assert.throws(() => validateRunState(missing), TypeError);
  assert.throws(() => validateRunState({ ...serialized, pottedNumbers: [15, 15] }), RangeError);
  assert.throws(() => validateRunState({ ...serialized, pottedNumbers: [15, 2], pocketOrder: [15, 2] }), RangeError);
  assert.throws(() => evaluateShot(createRunState(), shot([1])), RangeError);
  assert.throws(() => evaluateShot(createRunState(), { ...shot([1], { breakShot: true }), pottedNumbers: [1, 1] }), RangeError);
  assert.throws(() => evaluateShot(createRunState(), { ...shot([], { breakShot: true }), power: 0.5 }), TypeError);
  assert.throws(() => classifyTarget(serialized, 15), RangeError);
});
