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
  VIOLATION_CODES,
  FAILURE_ENDINGS,
  ballByNumber,
  stageForBall,
  createRunState,
  validateRunState,
  currentStage,
  availableTargets,
  remainingNumbers,
  classifyTarget,
  evaluateShot,
  computeRating
} = rules;

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function makeShot(pottedNumbers = [], overrides = {}) {
  const shot = {
    pottedNumbers,
    cueScratch: overrides.cueScratch === true,
    breakShot: overrides.breakShot === true,
    bankedNumbers: overrides.bankedNumbers || []
  };
  if (hasOwn(overrides, "declaredBall")) shot.declaredBall = overrides.declaredBall;
  if (hasOwn(overrides, "firstContact")) shot.firstContact = overrides.firstContact;
  return shot;
}

function openingShot(pottedNumbers = [], overrides = {}) {
  return makeShot(pottedNumbers, { ...overrides, breakShot: true });
}

function normalShot(pottedNumbers = [], overrides = {}) {
  return makeShot(pottedNumbers, { ...overrides, breakShot: false });
}

function begin(pottedNumbers = [], overrides = {}) {
  return evaluateShot(createRunState(), openingShot(pottedNumbers, overrides)).state;
}

function play(state, pottedNumbers = [], overrides = {}) {
  return evaluateShot(state, normalShot(pottedNumbers, overrides));
}

function finishFreeOrder(options = {}) {
  let state = begin([3, 2, 1]);
  const groups = [
    [5, 4],
    [7, 6],
    [8],
    [11, 10, 9],
    [13, 12],
    [15, 14]
  ];
  let result = null;
  groups.forEach((group) => {
    if (options.missBeforeEach) state = play(state, []).state;
    result = play(state, group);
    state = result.state;
  });
  return result;
}

test("exports seven free-order relationship groups covering all 15 balls", () => {
  assert.equal(RULES.title, "心动桌球");
  assert.equal(RULES.version, 1);
  assert.equal(RULES.ballCount, 15);
  assert.equal(RULES.stageCount, 7);
  assert.deepEqual(RULES.breakRespotNumbers, []);
  assert.equal(RULES.rhythm, undefined);
  assert.deepEqual(VIOLATION_CODES, ["cue-scratch"]);
  assert.deepEqual(FAILURE_ENDINGS, ["losing-contact"]);
  assert.equal(BALLS.length, 15);
  assert.deepEqual(STAGES.map((stage) => stage.ballNumbers), [
    [1, 2, 3],
    [4, 5],
    [6, 7],
    [8],
    [9, 10, 11],
    [12, 13],
    [14, 15]
  ]);
  assert.deepEqual(STAGES.flatMap((stage) => stage.ballNumbers), [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
  ]);
  assert.ok(STAGES.every((stage) => !hasOwn(stage, "idealOrder") && !hasOwn(stage, "strictOrder")));
  assert.deepEqual(BALLS.map((ball) => ball.name), [
    "对视",
    "主动搭话",
    "交换联系方式",
    "找到共同话题",
    "频繁聊天",
    "单独吃饭",
    "正式约会",
    "告白",
    "第一次牵手",
    "拥抱",
    "共同旅行",
    "面对分歧",
    "沟通与和好",
    "谈论未来",
    "求婚"
  ]);
  assert.deepEqual(BALLS.map((ball) => ball.suit), [
    ...Array(7).fill("solid"),
    "eight",
    ...Array(7).fill("stripe")
  ]);
  assert.equal(ballByNumber(8).colorName, "黑");
  assert.equal(stageForBall(13).id, "learning-together");
  assert.ok(Object.isFrozen(rules));
  assert.ok(Object.isFrozen(RULES.interest));
  assert.ok(BALLS.every(Object.isFrozen));
  assert.ok(STAGES.every((stage) => Object.isFrozen(stage) && Object.isFrozen(stage.ballNumbers)));
});

test("loads as an equivalent frozen browser UMD global", () => {
  const source = readFileSync(path.join(__dirname, "../assets/billiards-love-rules.js"), "utf8");
  const browser = {};
  vm.runInNewContext(source, browser, { filename: "billiards-love-rules.js" });
  const browserRules = browser.BilliardsLoveRules;

  assert.equal(browserRules.BALLS.length, 15);
  assert.equal(browserRules.STAGES.length, 7);
  assert.equal(typeof browserRules.evaluateShot, "function");
  assert.ok(Object.isFrozen(browserRules));

  const result = browserRules.evaluateShot(
    browserRules.createRunState(),
    openingShot([8, 15])
  );
  assert.deepEqual(Array.from(result.respotNumbers), []);
  assert.deepEqual(Array.from(result.state.pottedNumbers), [8, 15]);
  assert.equal(result.state.endState.status, "playing");
});

test("keeps the version-one runtime state sequence JSON-compatible and deeply frozen", () => {
  const state = createRunState();
  assert.deepEqual(Object.keys(state), [
    "version",
    "pottedNumbers",
    "interest",
    "rhythmScore",
    "consecutiveMisses",
    "shots",
    "successfulShots",
    "potStreak",
    "bestPotStreak",
    "cueScratches",
    "bankedPots",
    "multiBallShots",
    "violations",
    "pocketOrder",
    "breakCompleted",
    "endState"
  ]);
  assert.deepEqual(state, {
    version: 1,
    pottedNumbers: [],
    interest: 100,
    rhythmScore: 100,
    consecutiveMisses: 0,
    shots: 0,
    successfulShots: 0,
    potStreak: 0,
    bestPotStreak: 0,
    cueScratches: 0,
    bankedPots: 0,
    multiBallShots: 0,
    violations: [],
    pocketOrder: [],
    breakCompleted: false,
    endState: { ended: false, status: "playing", ending: null, grade: null }
  });
  assert.equal(validateRunState(state), true);
  assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
  assert.ok(Object.isFrozen(state));
  assert.ok(Object.isFrozen(state.pottedNumbers));
  assert.ok(Object.isFrozen(state.violations));
  assert.ok(Object.isFrozen(state.endState));
  assert.throws(() => state.pottedNumbers.push(1), TypeError);
  assert.throws(() => createRunState(0), TypeError);
});

test("reports only the current group as available while future balls remain legal", () => {
  const initial = createRunState();
  assert.equal(currentStage(initial).id, "first-contact");
  assert.deepEqual(availableTargets(initial), [1, 2, 3]);
  assert.equal(remainingNumbers(initial).length, 15);
  assert.deepEqual(classifyTarget(initial, 1), {
    number: 1,
    stage: STAGES[0],
    currentStage: STAGES[0],
    stageGap: null,
    stageStatus: "current",
    completedEarly: false,
    timing: "break-only",
    interestDelta: 0,
    rhythmDelta: 0,
    failure: null
  });

  const opened = begin();
  assert.equal(classifyTarget(opened, 3).timing, "on-time");
  assert.equal(classifyTarget(opened, 3).interestDelta, RULES.interest.currentStagePotRecovery);
  const future = classifyTarget(opened, 15);
  assert.equal(future.stageGap, 6);
  assert.equal(future.stageStatus, "future");
  assert.equal(future.completedEarly, true);
  assert.equal(future.timing, "early-completion");
  assert.equal(future.interestDelta, 0);
  assert.equal(future.rhythmDelta, 0);
  assert.equal(future.failure, null);

  const partial = play(opened, [3]).state;
  assert.deepEqual(availableTargets(partial), [1, 2]);
  assert.deepEqual(remainingNumbers(partial), [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  assert.ok(Object.isFrozen(availableTargets(partial)));
});

test("credits 8 and 15 on the break without respotting or special consequences", () => {
  const result = evaluateShot(createRunState(), openingShot(
    [8, 1, 15, 4],
    { bankedNumbers: [8, 4] }
  ));

  assert.deepEqual(result.respotNumbers, []);
  assert.deepEqual(result.pottedNumbers, [8, 1, 15, 4]);
  assert.deepEqual(result.state.pottedNumbers, [1, 4, 8, 15]);
  assert.deepEqual(result.state.pocketOrder, [8, 1, 15, 4]);
  assert.equal(result.state.endState.status, "playing");
  assert.equal(result.state.interest, 100);
  assert.equal(result.state.rhythmScore, 100);
  assert.equal(result.state.violations.length, 0);
  assert.equal(result.state.bankedPots, 2);
  assert.equal(result.state.multiBallShots, 1);
  assert.equal(result.pocketEvents.find((event) => event.number === 8).completedEarly, true);
  assert.equal(result.pocketEvents.find((event) => event.number === 15).credited, true);
  assert.ok(result.pocketEvents.every((event) => event.type === "pocket" && event.mode === "break"));
  assert.deepEqual(result.newlyCompletedStageIds, []);
  assert.deepEqual(result.newlyEarlyCompletedStageIds, ["spoken-heart"]);
  assert.equal(currentStage(result.state).id, "first-contact");
  assert.deepEqual(availableTargets(result.state), [2, 3]);
});

test("accepts declaration-free shots and ignores legacy declaration and contact values", () => {
  const opened = begin();
  const simple = play(opened, [1]);
  const legacy = evaluateShot(opened, normalShot([1], {
    declaredBall: 15,
    firstContact: 8
  }));

  assert.deepEqual(legacy.state, simple.state);
  assert.deepEqual(legacy.pocketEvents, simple.pocketEvents);
  assert.equal(legacy.shot.declaredBall, null);
  assert.equal(legacy.shot.firstContact, null);
  assert.equal(legacy.declaredPotted, false);
  assert.equal(legacy.activePottedNumber, null);
  assert.equal(legacy.contactMatched, null);
  assert.equal(legacy.endState.status, "playing");

  const continued = evaluateShot(simple.state, normalShot([2], {
    declaredBall: 1,
    firstContact: 1
  }));
  assert.deepEqual(continued.state.pottedNumbers, [1, 2]);
});

test("emits explicit pocket, scratch, and unified performance events", () => {
  const result = play(begin(), [1, 4], {
    cueScratch: true,
    bankedNumbers: [4]
  });

  assert.deepEqual(result.pocketEvents.map((event) => ({
    type: event.type,
    number: event.number,
    stageId: event.stageId,
    stageStatus: event.stageStatus,
    completedEarly: event.completedEarly,
    mode: event.mode,
    timing: event.timing,
    banked: event.banked,
    interestDelta: event.interestDelta
  })), [
    {
      type: "pocket",
      number: 1,
      stageId: "first-contact",
      stageStatus: "current",
      completedEarly: false,
      mode: "active",
      timing: "on-time",
      banked: false,
      interestDelta: 3
    },
    {
      type: "pocket",
      number: 4,
      stageId: "growing-familiar",
      stageStatus: "future",
      completedEarly: true,
      mode: "accidental",
      timing: "early-completion",
      banked: true,
      interestDelta: 0
    }
  ]);
  assert.deepEqual(result.accidentalPottedNumbers, [4]);
  assert.equal(result.missEvent, null);
  assert.deepEqual(result.scratchEvent, {
    type: "scratch",
    shot: 2,
    code: "cue-scratch",
    interestDelta: -10,
    rhythmDelta: 0,
    credited: false
  });
  assert.deepEqual(result.events.map((event) => event.type), ["pocket", "pocket", "scratch"]);
  assert.equal(result.rawInterestDelta, -7);
  assert.equal(result.state.interest, 93);
  assert.equal(result.state.rhythmScore, 100);
  assert.deepEqual(result.state.violations.map((violation) => violation.code), ["cue-scratch"]);
});

test("banks future stages and continuously advances once preceding stages clear", () => {
  let state = begin([], { cueScratch: true });
  assert.equal(state.interest, 90);
  const early = play(state, [5, 4, 7, 6, 8]);
  state = early.state;

  assert.equal(early.rawInterestDelta, 0);
  assert.equal(state.interest, 90);
  assert.equal(currentStage(state).id, "first-contact");
  assert.deepEqual(early.newlyCompletedStageIds, []);
  assert.deepEqual(early.newlyEarlyCompletedStageIds, [
    "growing-familiar",
    "intentional-dates",
    "spoken-heart"
  ]);
  assert.deepEqual(early.earlyCompletedStageIds, [
    "growing-familiar",
    "intentional-dates",
    "spoken-heart"
  ]);
  assert.ok(early.pocketEvents.every((event) => event.completedEarly));
  assert.equal(early.endState.status, "playing");

  const unlocked = play(state, [3, 1, 2]);
  assert.deepEqual(unlocked.newlyCompletedStageIds, [
    "first-contact",
    "growing-familiar",
    "intentional-dates",
    "spoken-heart"
  ]);
  assert.deepEqual(unlocked.completedStageIds, unlocked.newlyCompletedStageIds);
  assert.deepEqual(unlocked.stageEvents.map((event) => event.stageId), unlocked.newlyCompletedStageIds);
  assert.deepEqual(unlocked.stageEvents.map((event) => event.precompleted), [false, true, true, true]);
  assert.deepEqual(unlocked.stageEvents.map((event) => event.cascaded), [false, true, true, true]);
  assert.equal(unlocked.completedCurrentStage, true);
  assert.equal(unlocked.rawInterestDelta, 49);
  assert.equal(unlocked.state.interest, 100);
  assert.equal(unlocked.stageAfter.id, "confirmed-love");
  assert.equal(currentStage(unlocked.state).id, "confirmed-love");
  assert.deepEqual(unlocked.earlyCompletedStageIds, []);
});

test("allows every within-stage order and does not require 8 or 15 to be last", () => {
  const result = finishFreeOrder();

  assert.equal(result.state.endState.status, "completed");
  assert.equal(result.state.endState.grade, "S");
  assert.equal(result.state.endState.ending, "mutual-devotion");
  assert.equal(result.state.pocketOrder.at(-2), 15);
  assert.equal(result.state.pocketOrder.at(-1), 14);
  assert.equal(result.state.rhythmScore, 100);
  assert.deepEqual(result.state.violations, []);
  assert.deepEqual(availableTargets(result.state), []);
  assert.equal(currentStage(result.state), null);

  const earlyMilestones = play(begin(), [15, 8]);
  assert.equal(earlyMilestones.endState.status, "playing");
  assert.equal(earlyMilestones.state.interest, 100);
  assert.deepEqual(earlyMilestones.state.violations, []);
  assert.ok(earlyMilestones.pocketEvents.every((event) => event.timing === "early-completion"));
  assert.ok(earlyMilestones.pocketEvents.every((event) => event.completedEarly));
});

test("changes interest only for technical mistakes and current-stage recovery", () => {
  let state = begin([], { cueScratch: true });
  assert.equal(state.interest, 90);

  const futureBank = play(state, [4], { bankedNumbers: [4] });
  state = futureBank.state;
  assert.equal(futureBank.rawInterestDelta, 0);
  assert.deepEqual(futureBank.interestChanges, []);
  assert.equal(state.interest, 90);
  assert.equal(state.bankedPots, 1);

  const currentMulti = play(state, [2, 1], { bankedNumbers: [1] });
  state = currentMulti.state;
  assert.equal(currentMulti.rawInterestDelta, 6);
  assert.equal(state.interest, 96);
  assert.deepEqual(currentMulti.interestChanges.map((change) => change.code), [
    "current-stage-pot-recovery",
    "current-stage-pot-recovery"
  ]);

  const completion = play(state, [3]);
  assert.equal(completion.rawInterestDelta, 13);
  assert.equal(completion.interestDelta, 4);
  assert.equal(completion.state.interest, 100);
  assert.deepEqual(completion.interestChanges.map((change) => change.code), [
    "current-stage-pot-recovery",
    "stage-complete-recovery"
  ]);
  assert.deepEqual(completion.newlyCompletedStageIds, ["first-contact"]);
  assert.equal(currentStage(completion.state).id, "growing-familiar");
  assert.deepEqual(availableTargets(completion.state), [5]);
});

test("emits miss and scratch events with exact consecutive-miss losses", () => {
  let state = begin([], { cueScratch: true });
  const openingOutcome = evaluateShot(createRunState(), openingShot([], { cueScratch: true }));
  assert.equal(openingOutcome.state.interest, 90);
  assert.equal(openingOutcome.state.consecutiveMisses, 0);
  assert.equal(openingOutcome.miss, true);
  assert.equal(openingOutcome.missEvent.counted, false);
  assert.equal(openingOutcome.missEvent.interestDelta, 0);
  assert.deepEqual(openingOutcome.events.map((event) => event.type), ["scratch", "miss"]);

  const firstMiss = play(state, []);
  state = firstMiss.state;
  assert.equal(firstMiss.missEvent.code, "miss");
  assert.equal(firstMiss.missEvent.counted, true);
  assert.equal(firstMiss.state.consecutiveMisses, 1);
  assert.equal(firstMiss.interestDelta, 0);

  const secondMiss = play(state, []);
  state = secondMiss.state;
  assert.equal(secondMiss.missEvent.code, "second-consecutive-miss");
  assert.equal(secondMiss.missEvent.interestDelta, RULES.interest.secondConsecutiveMiss);
  assert.equal(secondMiss.state.interest, 85);

  const thirdMissAndScratch = play(state, [], { cueScratch: true });
  state = thirdMissAndScratch.state;
  assert.equal(thirdMissAndScratch.missEvent.code, "continued-consecutive-miss");
  assert.equal(thirdMissAndScratch.missEvent.interestDelta, RULES.interest.continuedConsecutiveMiss);
  assert.equal(thirdMissAndScratch.scratchEvent.interestDelta, RULES.interest.cueScratch);
  assert.deepEqual(thirdMissAndScratch.events.map((event) => event.type), ["scratch", "miss"]);
  assert.equal(state.interest, 67);
  assert.equal(state.consecutiveMisses, 3);
  assert.equal(state.cueScratches, 2);
  assert.equal(state.rhythmScore, 100);

  const recovered = play(state, [2]);
  assert.equal(recovered.state.consecutiveMisses, 0);
  assert.equal(recovered.state.potStreak, 1);
  assert.equal(recovered.state.interest, 70);
});

test("rates technique and interest without numerical-order criteria", () => {
  const ideal = finishFreeOrder();
  assert.equal(ideal.rating.grade, "S");
  assert.equal(ideal.rating.technical.grade, "S");
  assert.equal(ideal.rating.rhythm.grade, "S");
  assert.deepEqual(Object.keys(ideal.rating.rhythm), ["score", "grade", "interest"]);

  const ordinary = finishFreeOrder({ missBeforeEach: true });
  assert.equal(ordinary.state.endState.status, "completed");
  assert.equal(ordinary.state.endState.grade, "A");
  assert.equal(ordinary.state.endState.ending, "together-at-last");
  assert.equal(ordinary.rating.technical.grade, "A");
  assert.equal(ordinary.rating.rhythm.grade, "S");
  assert.equal(ordinary.state.interest, 100);

  let state = begin();
  state = play(state, [15, 8]).state;
  for (const group of [[1, 2, 3], [4, 5], [6, 7], [9, 10, 11], [12, 13], [14]]) {
    state = play(state, group).state;
  }
  const earlyFinishRating = computeRating(state);
  assert.equal(state.endState.status, "completed");
  assert.equal(state.pocketOrder[0], 15);
  assert.equal(state.pocketOrder.at(-1), 14);
  assert.equal(earlyFinishRating.grade, "S");
  assert.equal(earlyFinishRating.ending, "mutual-devotion");
});

test("fails only when accumulated technical interest losses reach zero", () => {
  let state = begin([], { cueScratch: true });
  let result = null;
  while (!state.endState.ended) {
    result = play(state, [], { cueScratch: true });
    state = result.state;
  }

  assert.equal(state.interest, 0);
  assert.equal(state.endState.status, "failed");
  assert.equal(state.endState.ending, "losing-contact");
  assert.equal(state.endState.grade, null);
  assert.deepEqual(FAILURE_ENDINGS, ["losing-contact"]);
  assert.ok(result.scratchEvent);
  assert.ok(result.missEvent);
  assert.throws(() => play(state, [1]), RangeError);
});

test("does not mutate inputs and deeply freezes all state and performance layers", () => {
  const state = begin();
  const before = JSON.parse(JSON.stringify(state));
  const shot = normalShot([3, 2, 1, 4], {
    cueScratch: true,
    bankedNumbers: [4],
    declaredBall: 15,
    firstContact: 8
  });
  const resultA = evaluateShot(state, shot);
  const resultB = evaluateShot(state, shot);

  assert.deepEqual(state, before);
  assert.deepEqual(resultA, resultB);
  assert.equal(Object.isFrozen(shot), false);
  assert.equal(Object.isFrozen(shot.pottedNumbers), false);
  assert.ok(Object.isFrozen(resultA));
  assert.ok(Object.isFrozen(resultA.state));
  assert.ok(Object.isFrozen(resultA.shot));
  assert.ok(Object.isFrozen(resultA.shot.pottedNumbers));
  assert.ok(Object.isFrozen(resultA.events));
  assert.ok(resultA.events.every(Object.isFrozen));
  assert.ok(Object.isFrozen(resultA.pocketEvents));
  assert.ok(resultA.pocketEvents.every(Object.isFrozen));
  assert.ok(Object.isFrozen(resultA.stageEvents));
  assert.ok(resultA.stageEvents.every(Object.isFrozen));
  assert.ok(Object.isFrozen(resultA.scratchEvent));
  assert.ok(Object.isFrozen(resultA.interestChanges));
  assert.ok(resultA.interestChanges.every(Object.isFrozen));
  assert.ok(Object.isFrozen(resultA.newlyCompletedStageIds));
  assert.strictEqual(resultA.events[0], resultA.pocketEvents[0]);
  assert.throws(() => resultA.events.push({}), TypeError);
  assert.throws(() => resultA.pocketEvents[0].number = 9, TypeError);
  assert.throws(() => resultA.state.pocketOrder.push(9), TypeError);

  const dry = play(resultA.state, []);
  assert.ok(Object.isFrozen(dry.missEvent));
});

test("accepts JSON round trips and rejects forged or malformed runtime states", () => {
  const serialized = JSON.parse(JSON.stringify(play(begin(), [1]).state));
  assert.equal(validateRunState(serialized), true);
  const continued = play(serialized, [2]);
  assert.ok(Object.isFrozen(continued.state));

  const missing = { ...serialized };
  delete missing.interest;
  assert.throws(() => validateRunState(missing), TypeError);

  const extra = { ...serialized, currentStageIndex: 0 };
  assert.throws(() => validateRunState(extra), TypeError);

  const duplicate = { ...serialized, pottedNumbers: [1, 1] };
  assert.throws(() => validateRunState(duplicate), RangeError);

  const unsorted = { ...serialized, pottedNumbers: [2, 1], pocketOrder: [1, 2] };
  assert.throws(() => validateRunState(unsorted), RangeError);

  const wrongOrderSet = { ...serialized, pocketOrder: [2] };
  assert.throws(() => validateRunState(wrongOrderSet), RangeError);

  const forgedRhythm = { ...serialized, rhythmScore: 99 };
  assert.throws(() => validateRunState(forgedRhythm), RangeError);

  const forgedSuccessCount = { ...begin(), successfulShots: 1 };
  assert.throws(() => validateRunState(forgedSuccessCount), RangeError);

  const forgedScratchCount = { ...serialized, cueScratches: 1 };
  assert.throws(() => validateRunState(forgedScratchCount), RangeError);

  const excessiveInterest = { ...serialized, interest: 101 };
  assert.throws(() => validateRunState(excessiveInterest), RangeError);

  const mutableEnd = JSON.parse(JSON.stringify(serialized));
  mutableEnd.endState = { ended: true, status: "completed", ending: "mutual-devotion", grade: "S" };
  assert.throws(() => validateRunState(mutableEnd), RangeError);
  assert.throws(() => validateRunState(new Date()), TypeError);
});

test("strictly validates simplified and legacy-compatible shot inputs", () => {
  const initial = createRunState();
  const opened = begin();
  assert.throws(() => evaluateShot(initial, normalShot([1])), RangeError);
  assert.throws(() => evaluateShot(opened, openingShot()), RangeError);
  assert.throws(() => evaluateShot(initial, { ...openingShot(), cueScratch: 1 }), TypeError);
  assert.throws(() => evaluateShot(initial, { ...openingShot(), breakShot: "yes" }), TypeError);
  assert.throws(() => evaluateShot(initial, { ...openingShot(), pottedNumbers: [1, 1] }), RangeError);
  assert.throws(() => evaluateShot(initial, { ...openingShot(), pottedNumbers: [1, , 2] }), TypeError);
  assert.throws(() => evaluateShot(initial, { ...openingShot(), pottedNumbers: [16] }), RangeError);
  assert.throws(() => evaluateShot(initial, { ...openingShot(), bankedNumbers: [2] }), RangeError);
  assert.throws(() => evaluateShot(initial, { ...openingShot(), declaredBall: 0 }), RangeError);
  assert.throws(() => evaluateShot(initial, { ...openingShot(), firstContact: "1" }), TypeError);
  assert.throws(() => evaluateShot(initial, { ...openingShot(), power: 0.5 }), TypeError);
  assert.throws(() => evaluateShot(initial, new Date()), TypeError);

  const missingField = normalShot([1]);
  delete missingField.bankedNumbers;
  assert.throws(() => evaluateShot(opened, missingField), TypeError);

  const pottedOne = play(opened, [1]).state;
  assert.throws(() => play(pottedOne, [1]), RangeError);
  assert.throws(() => classifyTarget(pottedOne, 1), RangeError);
  assert.throws(() => ballByNumber(0), RangeError);
  assert.throws(() => stageForBall(1.5), TypeError);

  const noCallOrContact = evaluateShot(opened, {
    pottedNumbers: [2],
    cueScratch: false,
    breakShot: false,
    bankedNumbers: []
  });
  assert.deepEqual(noCallOrContact.state.pottedNumbers, [2]);
  assert.equal(noCallOrContact.shot.declaredBall, null);
  assert.equal(noCallOrContact.shot.firstContact, null);
});
