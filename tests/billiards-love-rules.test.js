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

function breakShot(overrides = {}) {
  const pottedNumbers = overrides.pottedNumbers || [];
  return {
    declaredBall: null,
    firstContact: overrides.firstContact === undefined ? (pottedNumbers[0] || 1) : overrides.firstContact,
    pottedNumbers,
    cueScratch: overrides.cueScratch || false,
    breakShot: true,
    bankedNumbers: overrides.bankedNumbers || []
  };
}

function normalShot(declaredBall, pottedNumbers = [declaredBall], overrides = {}) {
  return {
    declaredBall,
    firstContact: overrides.firstContact === undefined ? declaredBall : overrides.firstContact,
    pottedNumbers,
    cueScratch: overrides.cueScratch || false,
    breakShot: false,
    bankedNumbers: overrides.bankedNumbers || []
  };
}

function begin(overrides = {}) {
  return evaluateShot(createRunState(), breakShot(overrides)).state;
}

function play(state, declaredBall, pottedNumbers = [declaredBall], overrides = {}) {
  return evaluateShot(state, normalShot(declaredBall, pottedNumbers, overrides));
}

function advance(state, groups) {
  let next = state;
  for (const group of groups) next = play(next, group[0], group).state;
  return next;
}

function stateAtAdjustment() {
  return advance(begin({ pottedNumbers: [1, 2, 3], firstContact: 1 }), [
    [4, 5],
    [6, 7],
    [8],
    [9, 10, 11]
  ]);
}

function finishIdeal(options = {}) {
  let state = begin({ pottedNumbers: [1, 2, 3], firstContact: 1 });
  const groups = [[4, 5], [6, 7], [8], [9, 10, 11], [12, 13], [14], [15]];
  let finalResult = null;
  for (const group of groups) {
    if (options.missBeforeEach) state = play(state, group[0], []).state;
    finalResult = play(state, group[0], group);
    state = finalResult.state;
  }
  return finalResult;
}

test("exports the frozen standard 15-ball relationship catalog and seven stages", () => {
  assert.equal(RULES.title, "心动桌球");
  assert.equal(RULES.ballCount, 15);
  assert.equal(BALLS.length, 15);
  assert.equal(STAGES.length, 7);
  assert.deepEqual(STAGES.map((stage) => stage.ballNumbers), [
    [1, 2, 3],
    [4, 5],
    [6, 7],
    [8],
    [9, 10, 11],
    [12, 13],
    [14, 15]
  ]);
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
  assert.deepEqual(BALLS.filter((ball) => ball.critical).map((ball) => ball.number), [8, 15]);
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
  assert.equal(typeof browserRules.computeRating, "function");
  assert.ok(Object.isFrozen(browserRules));

  const result = browserRules.evaluateShot(browserRules.createRunState(), breakShot({
    pottedNumbers: [8, 1, 15],
    firstContact: 1
  }));
  assert.deepEqual(Array.from(result.respotNumbers), [8, 15]);
  assert.deepEqual(Array.from(result.state.pottedNumbers), [1]);
});

test("creates a JSON-serializable deeply immutable initial state", () => {
  const state = createRunState();
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

test("reports the current stage, suggested targets, remaining balls, and target timing", () => {
  const initial = createRunState();
  assert.equal(currentStage(initial).id, "first-contact");
  assert.deepEqual(availableTargets(initial), [1, 2, 3]);
  assert.equal(remainingNumbers(initial).length, 15);
  assert.equal(classifyTarget(initial, 1).timing, "break-only");

  const opened = begin();
  assert.equal(classifyTarget(opened, 1).timing, "on-time");
  assert.equal(classifyTarget(opened, 4).timing, "next-stage");
  assert.equal(classifyTarget(opened, 6).timing, "multi-stage");
  assert.deepEqual(classifyTarget(opened, 8), {
    number: 8,
    stage: STAGES[3],
    currentStage: STAGES[0],
    stageGap: 3,
    timing: "early-confession",
    interestDelta: 0,
    rhythmDelta: RULES.rhythm.earlyConfession,
    failure: "confession-too-early"
  });
  assert.equal(classifyTarget(opened, 15).failure, "commitment-too-heavy");

  const partial = play(opened, 3).state;
  assert.deepEqual(availableTargets(partial), [1, 2]);
  assert.deepEqual(remainingNumbers(partial), [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  assert.ok(Object.isFrozen(availableTargets(partial)));
});

test("protects 8 and 15 on the opening break and skips relationship timing", () => {
  const result = evaluateShot(createRunState(), breakShot({
    pottedNumbers: [8, 1, 15, 4],
    firstContact: 1,
    bankedNumbers: [8, 4]
  }));

  assert.deepEqual(result.respotNumbers, [8, 15]);
  assert.deepEqual(result.pottedNumbers, [1, 4]);
  assert.deepEqual(result.state.pottedNumbers, [1, 4]);
  assert.deepEqual(result.state.pocketOrder, [1, 4]);
  assert.equal(result.state.interest, 100);
  assert.equal(result.state.rhythmScore, 100);
  assert.equal(result.state.violations.length, 0);
  assert.equal(result.state.bankedPots, 1);
  assert.equal(result.state.multiBallShots, 1);
  assert.equal(result.events.find((event) => event.number === 8).timing, "protected-respot");
  assert.equal(result.events.find((event) => event.number === 15).credited, false);
  assert.equal(currentStage(result.state).id, "first-contact");
  assert.deepEqual(availableTargets(result.state), [2, 3]);

  const emptyBreak = evaluateShot(createRunState(), breakShot());
  assert.equal(emptyBreak.miss, true);
  assert.equal(emptyBreak.state.consecutiveMisses, 0);
  assert.equal(emptyBreak.state.interest, 100);
  assert.throws(() => evaluateShot(result.state, breakShot()), RangeError);
});

test("distinguishes active, accidental-next, and accidental-multi-stage pots", () => {
  const mixed = play(begin(), 1, [1, 4, 6]);
  assert.equal(mixed.declaredPotted, true);
  assert.equal(mixed.activePottedNumber, 1);
  assert.deepEqual(mixed.accidentalPottedNumbers, [4, 6]);
  assert.deepEqual(mixed.events.map((event) => [event.number, event.mode, event.timing]), [
    [1, "active", "on-time"],
    [4, "accidental", "accidental-next-stage"],
    [6, "accidental", "accidental-multi-stage"]
  ]);
  assert.equal(mixed.state.interest, 95);
  assert.equal(mixed.state.rhythmScore, 89);
  assert.deepEqual(mixed.state.violations.map((violation) => violation.code), [
    "accidental-next-stage",
    "accidental-multi-stage"
  ]);

  const next = play(begin(), 4);
  assert.equal(next.activeTiming, "next-stage");
  assert.equal(next.state.interest, 92);
  assert.equal(next.state.rhythmScore, 90);

  const multi = play(begin(), 6);
  assert.equal(multi.activeTiming, "multi-stage");
  assert.equal(multi.state.interest, 80);
  assert.equal(multi.state.rhythmScore, 80);
});

test("fails an actively declared early 8 but lets an accidental 8 continue in danger", () => {
  const early = play(begin(), 8);
  assert.equal(early.endState.status, "failed");
  assert.equal(early.endState.ending, "confession-too-early");
  assert.equal(early.activeTiming, "early-confession");
  assert.deepEqual(early.state.pottedNumbers, [8]);
  assert.throws(() => play(early.state, 1), RangeError);

  const accidental = play(begin(), 1, [8]);
  assert.equal(accidental.declaredPotted, false);
  assert.equal(accidental.events[0].timing, "accidental-confession");
  assert.equal(accidental.state.interest, 80);
  assert.equal(accidental.state.rhythmScore, 80);
  assert.equal(accidental.state.endState.status, "playing");
  assert.deepEqual(availableTargets(accidental.state), [1, 2, 3]);
});

test("treats a declared ball potted after the wrong first contact as accidental", () => {
  const outcome = evaluateShot(begin(), normalShot(8, [8], { firstContact: 1 }));
  assert.equal(outcome.contactMatched, false);
  assert.equal(outcome.declaredPotted, false);
  assert.equal(outcome.activePottedNumber, null);
  assert.deepEqual(outcome.accidentalPottedNumbers, [8]);
  assert.equal(outcome.events[0].mode, "accidental");
  assert.equal(outcome.events[0].timing, "accidental-confession");
  assert.equal(outcome.endState.status, "playing");
});

test("fails a two-stage early active 15, heavily penalizes one-stage early 15, and softens accidents", () => {
  const severe = play(begin(), 15);
  assert.equal(severe.endState.status, "failed");
  assert.equal(severe.endState.ending, "commitment-too-heavy");
  assert.equal(severe.activeTiming, "commitment-too-heavy");

  const adjustment = stateAtAdjustment();
  assert.equal(currentStage(adjustment).id, "learning-together");
  const oneStageEarly = play(adjustment, 15);
  assert.equal(oneStageEarly.activeTiming, "premature-commitment");
  assert.equal(oneStageEarly.state.interest, 70);
  assert.equal(oneStageEarly.state.rhythmScore, 75);
  assert.equal(oneStageEarly.state.endState.status, "playing");
  assert.equal(oneStageEarly.state.violations.at(-1).severity, "severe");
  const recoveredFromPremature = play(
    play(play(oneStageEarly.state, 12).state, 13).state,
    14
  );
  assert.equal(recoveredFromPremature.state.endState.grade, "B");
  assert.equal(recoveredFromPremature.rating.rhythm.commitmentLast, false);

  const finalStage = play(play(adjustment, 12).state, 13).state;
  assert.equal(currentStage(finalStage).id, "shared-future");
  const beforeFourteen = play(finalStage, 15);
  assert.equal(beforeFourteen.activeTiming, "premature-commitment");
  assert.equal(beforeFourteen.state.endState.status, "playing");

  const accident = play(begin(), 1, [15]);
  assert.equal(accident.events[0].timing, "accidental-commitment");
  assert.equal(accident.state.interest, 85);
  assert.equal(accident.state.rhythmScore, 85);
  assert.equal(accident.state.endState.status, "playing");
});

test("keeps free-order stages free while scoring the preferred and required internal orders", () => {
  let free = begin({ pottedNumbers: [3, 1, 2], firstContact: 3 });
  assert.equal(currentStage(free).id, "growing-familiar");
  free = play(free, 5).state;
  free = play(free, 4).state;
  assert.equal(free.rhythmScore, 100);

  const warming = advance(begin({ pottedNumbers: [1, 2, 3], firstContact: 1 }), [[4, 5]]);
  const dateFirst = play(warming, 7);
  assert.equal(dateFirst.state.endState.status, "playing");
  assert.equal(dateFirst.state.rhythmScore, 95);
  assert.equal(dateFirst.state.violations.at(-1).code, "date-before-meal");

  const adjustment = stateAtAdjustment();
  const reconcileFirst = play(adjustment, 13);
  assert.equal(reconcileFirst.state.endState.status, "playing");
  assert.equal(reconcileFirst.state.rhythmScore, 90);
  assert.equal(reconcileFirst.state.violations.at(-1).code, "reconcile-before-conflict");

  const inLove = advance(begin({ pottedNumbers: [1, 2, 3], firstContact: 1 }), [[4, 5], [6, 7], [8]]);
  const embraceFirst = play(inLove, 10);
  assert.equal(embraceFirst.state.violations.at(-1).code, "embrace-before-handholding");
  const travelFirst = play(inLove, 11);
  assert.equal(travelFirst.state.violations.at(-1).code, "travel-before-closeness");
});

test("applies exact consecutive-miss and cue-scratch interest losses", () => {
  let state = begin();
  const firstMiss = play(state, 1, []);
  assert.equal(firstMiss.state.consecutiveMisses, 1);
  assert.equal(firstMiss.state.interest, 100);

  const secondMiss = play(firstMiss.state, 1, []);
  assert.equal(secondMiss.state.consecutiveMisses, 2);
  assert.equal(secondMiss.interestDelta, RULES.interest.secondConsecutiveMiss);
  assert.equal(secondMiss.state.interest, 95);

  const thirdMiss = play(secondMiss.state, 1, []);
  assert.equal(thirdMiss.state.consecutiveMisses, 3);
  assert.equal(thirdMiss.interestDelta, RULES.interest.continuedConsecutiveMiss);
  assert.equal(thirdMiss.state.interest, 87);

  const recoveredStreak = play(thirdMiss.state, 1);
  assert.equal(recoveredStreak.state.consecutiveMisses, 0);
  assert.equal(recoveredStreak.state.potStreak, 1);

  const scratch = evaluateShot(createRunState(), breakShot({ cueScratch: true }));
  assert.equal(scratch.state.interest, 90);
  assert.equal(scratch.state.cueScratches, 1);
  assert.equal(scratch.state.violations[0].code, "cue-scratch");
});

test("restores interest for a current target, current-stage multi-pot, stage completion, and banks", () => {
  let state = evaluateShot(createRunState(), breakShot({ cueScratch: true })).state;
  state = play(state, 1, [], { cueScratch: true }).state;
  assert.equal(state.interest, 80);

  const multiBank = play(state, 1, [1, 2], { bankedNumbers: [1] });
  assert.equal(multiBank.rawInterestDelta, 16);
  assert.equal(multiBank.state.interest, 96);
  assert.equal(multiBank.state.bankedPots, 1);
  assert.equal(multiBank.state.multiBallShots, 1);
  assert.equal(multiBank.state.potStreak, 2);
  assert.deepEqual(multiBank.interestChanges.map((change) => change.code), [
    "current-target-recovery",
    "current-stage-multi-recovery",
    "banked-pot-recovery"
  ]);

  const completion = play(multiBank.state, 3);
  assert.equal(completion.completedCurrentStage, true);
  assert.deepEqual(completion.completedStageIds, ["first-contact"]);
  assert.equal(completion.rawInterestDelta, 13);
  assert.equal(completion.interestDelta, 4);
  assert.equal(completion.state.interest, 100);
  assert.equal(currentStage(completion.state).id, "growing-familiar");
});

test("tracks technical performance separately from relationship rhythm", () => {
  let state = begin({ pottedNumbers: [1, 2], firstContact: 1, bankedNumbers: [2] });
  state = play(state, 3).state;
  state = play(state, 4, []).state;
  state = play(state, 4, [4, 5]).state;
  const rating = computeRating(state);

  assert.equal(state.shots, 4);
  assert.equal(state.successfulShots, 3);
  assert.equal(state.potStreak, 2);
  assert.equal(state.bestPotStreak, 3);
  assert.equal(state.bankedPots, 1);
  assert.equal(state.multiBallShots, 2);
  assert.equal(rating.grade, null);
  assert.equal(rating.technical.shots, 4);
  assert.equal(rating.technical.successfulShotRate, 75);
  assert.equal(rating.rhythm.score, state.rhythmScore);
  assert.notEqual(rating.technical.score, rating.rhythm.score);
  assert.ok(Object.isFrozen(rating));
  assert.ok(Object.isFrozen(rating.technical));
  assert.ok(Object.isFrozen(rating.rhythm));
});

test("awards S for an ideal efficient clear and leaves 15 as the final ball", () => {
  const result = finishIdeal();
  assert.equal(result.state.endState.status, "completed");
  assert.equal(result.state.endState.grade, "S");
  assert.equal(result.state.endState.ending, "mutual-devotion");
  assert.equal(result.state.pocketOrder.at(-1), 15);
  assert.equal(result.rating.grade, "S");
  assert.equal(result.rating.technical.grade, "S");
  assert.equal(result.rating.rhythm.grade, "S");
  assert.equal(result.rating.rhythm.confessionOnTime, true);
  assert.equal(result.rating.rhythm.conflictOrderKept, true);
  assert.equal(result.rating.rhythm.commitmentLast, true);
  assert.deepEqual(availableTargets(result.state), []);
  assert.equal(currentStage(result.state), null);
  assert.throws(() => play(result.state, 1), RangeError);
});

test("awards A to natural relationship pacing even when table technique is ordinary", () => {
  const result = finishIdeal({ missBeforeEach: true });
  assert.equal(result.state.endState.status, "completed");
  assert.equal(result.state.endState.grade, "A");
  assert.equal(result.state.endState.ending, "together-at-last");
  assert.equal(result.rating.rhythm.grade, "S");
  assert.equal(result.rating.technical.grade, "A");
  assert.equal(result.state.interest, 100);
});

test("awards B when repeated active stage skips damage relationship rhythm", () => {
  let state = begin();
  state = play(state, 6).state;
  state = play(state, 4).state;
  state = play(state, 5).state;
  state = play(state, 1, [1, 2, 3]).state;
  state = play(state, 7).state;
  state = play(state, 8).state;
  state = play(state, 9, [9, 10, 11]).state;
  state = play(state, 12, [12, 13]).state;
  state = play(state, 14).state;
  const result = play(state, 15);

  assert.equal(result.state.rhythmScore, 60);
  assert.equal(result.state.endState.status, "completed");
  assert.equal(result.state.endState.grade, "B");
  assert.equal(result.state.endState.ending, "bumpy-love");
  assert.equal(result.rating.technical.grade, "S");
  assert.equal(result.rating.rhythm.grade, "B");
});

test("ends with losing-contact exactly when accumulated interest reaches zero", () => {
  let state = begin();
  let result = null;
  for (let index = 0; index < 7; index += 1) {
    result = play(state, 1, [], { cueScratch: true });
    state = result.state;
  }

  assert.equal(state.interest, 0);
  assert.equal(state.endState.status, "failed");
  assert.equal(state.endState.ending, "losing-contact");
  assert.equal(state.endState.grade, null);
  assert.deepEqual(FAILURE_ENDINGS, ["confession-too-early", "commitment-too-heavy", "losing-contact"]);
  assert.throws(() => play(state, 1), RangeError);
});

test("does not mutate state or shot inputs and deeply freezes every result layer", () => {
  const state = begin();
  const before = JSON.parse(JSON.stringify(state));
  const shot = normalShot(1, [1, 2], { bankedNumbers: [2] });
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
  assert.ok(Object.isFrozen(resultA.interestChanges));
  assert.ok(resultA.interestChanges.every(Object.isFrozen));
  assert.ok(Object.isFrozen(resultA.state.violations));
  assert.ok(resultA.state.violations.every(Object.isFrozen));
  assert.throws(() => resultA.events.push({}), TypeError);
  assert.throws(() => resultA.state.pocketOrder.push(9), TypeError);
});

test("accepts a valid JSON round trip and rejects forged or malformed states", () => {
  const serialized = JSON.parse(JSON.stringify(play(begin(), 1).state));
  assert.equal(validateRunState(serialized), true);
  const continued = play(serialized, 2);
  assert.ok(Object.isFrozen(continued.state));

  const missing = { ...serialized };
  delete missing.interest;
  assert.throws(() => validateRunState(missing), TypeError);

  const duplicate = { ...serialized, pottedNumbers: [1, 1] };
  assert.throws(() => validateRunState(duplicate), RangeError);

  const wrongOrderSet = { ...serialized, pocketOrder: [2] };
  assert.throws(() => validateRunState(wrongOrderSet), RangeError);

  const forgedRhythm = { ...serialized, rhythmScore: 99 };
  assert.throws(() => validateRunState(forgedRhythm), RangeError);

  const forgedSuccessCount = { ...begin(), successfulShots: 1 };
  assert.throws(() => validateRunState(forgedSuccessCount), RangeError);

  const forgedScratchCount = { ...serialized, cueScratches: 1 };
  assert.throws(() => validateRunState(forgedScratchCount), RangeError);

  const mutableEnd = JSON.parse(JSON.stringify(serialized));
  mutableEnd.endState = { ended: true, status: "completed", ending: "mutual-devotion", grade: "S" };
  assert.throws(() => validateRunState(mutableEnd), RangeError);
  assert.throws(() => validateRunState(new Date()), TypeError);
});

test("strictly validates shot shape, types, uniqueness, and physical consistency", () => {
  const initial = createRunState();
  const opened = begin();
  assert.throws(() => evaluateShot(initial, normalShot(1)), RangeError);
  assert.throws(() => evaluateShot(initial, { ...breakShot(), declaredBall: 1 }), RangeError);
  assert.throws(() => evaluateShot(initial, { ...breakShot(), cueScratch: 1 }), TypeError);
  assert.throws(() => evaluateShot(initial, { ...breakShot(), pottedNumbers: [1, 1] }), RangeError);
  assert.throws(() => evaluateShot(initial, { ...breakShot(), bankedNumbers: [2] }), RangeError);
  assert.throws(() => evaluateShot(initial, { ...breakShot({ pottedNumbers: [1] }), firstContact: null }), RangeError);
  assert.throws(() => evaluateShot(initial, { ...breakShot(), pottedNumbers: [1, , 2] }), TypeError);
  assert.throws(() => evaluateShot(opened, { ...normalShot(1), bankedNumbers: [2] }), RangeError);
  assert.throws(() => evaluateShot(opened, { ...normalShot(1), pottedNumbers: [16] }), RangeError);
  assert.throws(() => evaluateShot(opened, { ...normalShot(1), declaredBall: null }), RangeError);
  assert.throws(() => evaluateShot(opened, { ...normalShot(1), firstContact: "1" }), TypeError);

  const missingField = normalShot(1);
  delete missingField.bankedNumbers;
  assert.throws(() => evaluateShot(opened, missingField), TypeError);

  const pottedOne = play(opened, 1).state;
  assert.throws(() => play(pottedOne, 1), RangeError);
  assert.throws(() => evaluateShot(pottedOne, normalShot(2, [1])), RangeError);
  assert.throws(() => classifyTarget(pottedOne, 1), RangeError);
  assert.throws(() => ballByNumber(0), RangeError);
  assert.throws(() => stageForBall(1.5), TypeError);
});
