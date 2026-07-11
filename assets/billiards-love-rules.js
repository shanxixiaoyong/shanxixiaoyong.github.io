(function (root, factory) {
  const rules = factory();
  if (typeof module === "object" && module.exports) module.exports = rules;
  else root.BilliardsLoveRules = rules;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

  function deepFreeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.keys(value).forEach((key) => deepFreeze(value[key]));
      Object.freeze(value);
    }
    return value;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  const STAGES = deepFreeze([
    { index: 0, number: 1, id: "first-contact", name: "初次接触", ballNumbers: [1, 2, 3], idealOrder: null, strictOrder: false },
    { index: 1, number: 2, id: "growing-familiar", name: "逐渐熟悉", ballNumbers: [4, 5], idealOrder: null, strictOrder: false },
    { index: 2, number: 3, id: "intentional-dates", name: "暧昧升温", ballNumbers: [6, 7], idealOrder: [6, 7], strictOrder: false },
    { index: 3, number: 4, id: "spoken-heart", name: "关系转折", ballNumbers: [8], idealOrder: [8], strictOrder: true },
    { index: 4, number: 5, id: "confirmed-love", name: "正式相恋", ballNumbers: [9, 10, 11], idealOrder: [9, 10, 11], strictOrder: false },
    { index: 5, number: 6, id: "learning-together", name: "磨合", ballNumbers: [12, 13], idealOrder: [12, 13], strictOrder: true },
    { index: 6, number: 7, id: "shared-future", name: "共同未来", ballNumbers: [14, 15], idealOrder: [14, 15], strictOrder: true }
  ]);

  const BALL_NAMES = deepFreeze([
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

  const STANDARD_COLORS = deepFreeze([
    { name: "黄", value: "#f2c84b" },
    { name: "蓝", value: "#2877c7" },
    { name: "红", value: "#c74343" },
    { name: "紫", value: "#75479a" },
    { name: "橙", value: "#de7b32" },
    { name: "绿", value: "#3f8b58" },
    { name: "褐红", value: "#8f3941" },
    { name: "黑", value: "#1e2025" }
  ]);

  function stageIndexForNumber(number) {
    return STAGES.findIndex((stage) => stage.ballNumbers.includes(number));
  }

  const BALLS = deepFreeze(BALL_NAMES.map((name, offset) => {
    const number = offset + 1;
    const stageIndex = stageIndexForNumber(number);
    const colorNumber = number > 8 ? number - 8 : number;
    const color = STANDARD_COLORS[colorNumber - 1];
    return {
      number,
      name,
      stageIndex,
      stageId: STAGES[stageIndex].id,
      suit: number < 8 ? "solid" : number === 8 ? "eight" : "stripe",
      colorName: color.name,
      color: color.value,
      critical: number === 8 || number === 15
    };
  }));

  const BALL_BY_NUMBER = Object.create(null);
  BALLS.forEach((ball) => {
    BALL_BY_NUMBER[ball.number] = ball;
  });
  Object.freeze(BALL_BY_NUMBER);

  const RULES = deepFreeze({
    title: "心动桌球",
    version: 1,
    ballCount: 15,
    stageCount: 7,
    criticalNumbers: [8, 15],
    breakRespotNumbers: [8, 15],
    interest: {
      initial: 100,
      minimum: 0,
      maximum: 100,
      secondConsecutiveMiss: -5,
      continuedConsecutiveMiss: -8,
      cueScratch: -10,
      activeNextStage: -8,
      activeMultiStage: -20,
      accidentalMultiStage: -8,
      accidentalConfession: -20,
      accidentalCommitment: -15,
      prematureCommitment: -30,
      currentTargetRecovery: 3,
      currentStageMultiRecovery: 8,
      stageCompleteRecovery: 10,
      bankedPotRecovery: 5
    },
    rhythm: {
      activeNextStage: -10,
      activeMultiStage: -20,
      accidentalNextStage: -3,
      accidentalMultiStage: -8,
      accidentalConfession: -20,
      accidentalCommitment: -15,
      earlyConfession: -30,
      commitmentTooHeavy: -30,
      prematureCommitment: -25,
      dateBeforeMeal: -5,
      embraceBeforeHandholding: -3,
      travelBeforeCloseness: -4,
      reconcileBeforeConflict: -10
    },
    rating: {
      technicalS: 85,
      technicalA: 60,
      rhythmS: 90,
      rhythmA: 70,
      highInterest: 80
    }
  });

  const STATE_KEYS = Object.freeze([
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
  const END_STATE_KEYS = Object.freeze(["ended", "status", "ending", "grade"]);
  const VIOLATION_KEYS = Object.freeze([
    "shot",
    "code",
    "ball",
    "mode",
    "severity",
    "interestDelta",
    "rhythmDelta"
  ]);
  const SHOT_KEYS = Object.freeze([
    "declaredBall",
    "firstContact",
    "pottedNumbers",
    "cueScratch",
    "breakShot",
    "bankedNumbers"
  ]);
  const VIOLATION_CODES = Object.freeze([
    "cue-scratch",
    "active-next-stage",
    "active-multi-stage",
    "early-confession",
    "premature-commitment",
    "commitment-too-heavy",
    "accidental-next-stage",
    "accidental-multi-stage",
    "accidental-confession",
    "accidental-commitment",
    "date-before-meal",
    "embrace-before-handholding",
    "travel-before-closeness",
    "reconcile-before-conflict"
  ]);
  const VIOLATION_CODE_SET = new Set(VIOLATION_CODES);
  const SUCCESS_ENDINGS = Object.freeze({
    S: "mutual-devotion",
    A: "together-at-last",
    B: "bumpy-love"
  });
  const FAILURE_ENDINGS = Object.freeze([
    "confession-too-early",
    "commitment-too-heavy",
    "losing-contact"
  ]);
  const EMPTY_ARRAY = Object.freeze([]);

  function isRecord(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
    if (Object.prototype.toString.call(value) !== "[object Object]") return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || Object.getPrototypeOf(prototype) === null;
  }

  function assertRecord(value, label) {
    if (!isRecord(value)) throw new TypeError(`${label} must be a plain object`);
  }

  function assertExactKeys(value, expected, label) {
    const keys = Object.keys(value);
    if (keys.length !== expected.length || expected.some((key) => !hasOwn(value, key))) {
      throw new TypeError(`${label} has an invalid shape`);
    }
  }

  function assertInteger(value, label, minimum, maximum) {
    if (!Number.isSafeInteger(value)) throw new TypeError(`${label} must be an integer`);
    if (value < minimum || value > maximum) {
      throw new RangeError(`${label} must be between ${minimum} and ${maximum}`);
    }
  }

  function assertBoolean(value, label) {
    if (typeof value !== "boolean") throw new TypeError(`${label} must be a boolean`);
  }

  function assertBallNumber(value, label) {
    assertInteger(value, label, 1, RULES.ballCount);
  }

  function assertNullableBallNumber(value, label) {
    if (value !== null) assertBallNumber(value, label);
  }

  function assertDenseUniqueBallArray(value, label) {
    if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
    if (Object.keys(value).length !== value.length) {
      throw new TypeError(`${label} must contain only dense indexed values`);
    }
    const seen = new Set();
    for (let index = 0; index < value.length; index += 1) {
      if (!hasOwn(value, index)) throw new TypeError(`${label} must be dense`);
      assertBallNumber(value[index], `${label}[${index}]`);
      if (seen.has(value[index])) throw new RangeError(`${label} cannot contain duplicate ball numbers`);
      seen.add(value[index]);
    }
    return seen;
  }

  function ballByNumber(number) {
    assertBallNumber(number, "ball number");
    return BALL_BY_NUMBER[number];
  }

  function stageForBall(number) {
    return STAGES[ballByNumber(number).stageIndex];
  }

  function currentStageIndexFromSet(potted) {
    for (const stage of STAGES) {
      if (stage.ballNumbers.some((number) => !potted.has(number))) return stage.index;
    }
    return null;
  }

  function isStageComplete(stage, potted) {
    return stage.ballNumbers.every((number) => potted.has(number));
  }

  function freezeRunState(state) {
    return Object.freeze({
      version: state.version,
      pottedNumbers: Object.freeze([...state.pottedNumbers]),
      interest: state.interest,
      rhythmScore: state.rhythmScore,
      consecutiveMisses: state.consecutiveMisses,
      shots: state.shots,
      successfulShots: state.successfulShots,
      potStreak: state.potStreak,
      bestPotStreak: state.bestPotStreak,
      cueScratches: state.cueScratches,
      bankedPots: state.bankedPots,
      multiBallShots: state.multiBallShots,
      violations: Object.freeze(state.violations.map((violation) => Object.freeze({ ...violation }))),
      pocketOrder: Object.freeze([...state.pocketOrder]),
      breakCompleted: state.breakCompleted,
      endState: Object.freeze({ ...state.endState })
    });
  }

  function createRunState() {
    if (arguments.length !== 0) throw new TypeError("createRunState does not accept arguments");
    return freezeRunState({
      version: RULES.version,
      pottedNumbers: [],
      interest: RULES.interest.initial,
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
  }

  function violationExists(state, code) {
    return state.violations.some((violation) => violation.code === code);
  }

  function ratingData(state, assumeCompleted) {
    const pottedCount = state.pottedNumbers.length;
    const shotEfficiency = state.shots === 0
      ? 0
      : pottedCount / Math.max(pottedCount, state.shots);
    const successfulShotRate = state.shots === 0 ? 0 : state.successfulShots / state.shots;
    const technicalScore = clamp(Math.round(
      shotEfficiency * 50
      + successfulShotRate * 30
      + Math.min(10, state.bestPotStreak)
      + Math.min(5, state.bankedPots * 2)
      + Math.min(5, state.multiBallShots * 2)
      - state.cueScratches * 8
    ), 0, 100);
    const technicalGrade = technicalScore >= RULES.rating.technicalS
      ? "S"
      : technicalScore >= RULES.rating.technicalA ? "A" : "B";
    const rhythmGrade = state.rhythmScore >= RULES.rating.rhythmS
      ? "S"
      : state.rhythmScore >= RULES.rating.rhythmA ? "A" : "B";
    const commitmentLast = state.pottedNumbers.includes(15)
      ? state.pottedNumbers.length === RULES.ballCount
        && state.pocketOrder[state.pocketOrder.length - 1] === 15
      : null;
    const confessionOnTime = state.pottedNumbers.includes(8)
      ? !violationExists(state, "early-confession") && !violationExists(state, "accidental-confession")
      : null;
    const conflictOrderKept = state.pottedNumbers.includes(13)
      ? !violationExists(state, "reconcile-before-conflict")
      : null;
    const dateOrderKept = state.pottedNumbers.includes(7)
      ? !violationExists(state, "date-before-meal")
      : null;
    const closenessOrderKept = state.pottedNumbers.some((number) => number === 10 || number === 11)
      ? !violationExists(state, "embrace-before-handholding")
        && !violationExists(state, "travel-before-closeness")
      : null;
    const severeActiveViolations = state.violations.filter((violation) => (
      violation.mode === "active" && violation.severity === "severe"
    )).length;
    const completed = assumeCompleted || state.endState.status === "completed";
    let grade = null;
    if (completed) {
      const earnsS = technicalGrade === "S"
        && rhythmGrade === "S"
        && state.interest >= RULES.rating.highInterest
        && confessionOnTime === true
        && conflictOrderKept === true
        && commitmentLast === true
        && dateOrderKept !== false
        && closenessOrderKept !== false
        && severeActiveViolations === 0;
      grade = earnsS ? "S" : rhythmGrade === "B" || severeActiveViolations > 0 ? "B" : "A";
    }
    return {
      grade,
      ending: grade === null ? state.endState.ending : SUCCESS_ENDINGS[grade],
      technical: {
        score: technicalScore,
        grade: technicalGrade,
        shots: state.shots,
        pottedBalls: pottedCount,
        successfulShots: state.successfulShots,
        successfulShotRate: Math.round(successfulShotRate * 100),
        shotEfficiency: Math.round(shotEfficiency * 100),
        ballsPerShot: state.shots === 0 ? 0 : Math.round(pottedCount / state.shots * 100) / 100,
        currentStreak: state.potStreak,
        bestStreak: state.bestPotStreak,
        cueScratches: state.cueScratches,
        bankedPots: state.bankedPots,
        multiBallShots: state.multiBallShots
      },
      rhythm: {
        score: state.rhythmScore,
        grade: rhythmGrade,
        interest: state.interest,
        confessionOnTime,
        dateOrderKept,
        closenessOrderKept,
        conflictOrderKept,
        commitmentLast,
        severeActiveViolations
      }
    };
  }

  function assertRunState(state) {
    assertRecord(state, "state");
    assertExactKeys(state, STATE_KEYS, "state");
    if (state.version !== RULES.version) throw new RangeError("state version is unsupported");

    const pottedSet = assertDenseUniqueBallArray(state.pottedNumbers, "state.pottedNumbers");
    for (let index = 1; index < state.pottedNumbers.length; index += 1) {
      if (state.pottedNumbers[index - 1] >= state.pottedNumbers[index]) {
        throw new RangeError("state.pottedNumbers must be sorted in ascending order");
      }
    }
    const orderSet = assertDenseUniqueBallArray(state.pocketOrder, "state.pocketOrder");
    if (orderSet.size !== pottedSet.size || [...pottedSet].some((number) => !orderSet.has(number))) {
      throw new RangeError("state.pocketOrder must contain the same balls as state.pottedNumbers");
    }

    assertInteger(state.interest, "state.interest", 0, 100);
    assertInteger(state.rhythmScore, "state.rhythmScore", 0, 100);
    assertInteger(state.consecutiveMisses, "state.consecutiveMisses", 0, Number.MAX_SAFE_INTEGER);
    assertInteger(state.shots, "state.shots", 0, Number.MAX_SAFE_INTEGER);
    assertInteger(state.successfulShots, "state.successfulShots", 0, state.shots);
    assertInteger(state.potStreak, "state.potStreak", 0, pottedSet.size);
    assertInteger(state.bestPotStreak, "state.bestPotStreak", state.potStreak, pottedSet.size);
    assertInteger(state.cueScratches, "state.cueScratches", 0, state.shots);
    assertInteger(state.bankedPots, "state.bankedPots", 0, pottedSet.size);
    assertInteger(state.multiBallShots, "state.multiBallShots", 0, state.successfulShots);
    assertBoolean(state.breakCompleted, "state.breakCompleted");
    if (state.consecutiveMisses > Math.max(0, state.shots - 1)) {
      throw new RangeError("state consecutive misses exceed normal shots");
    }
    if ((pottedSet.size === 0) !== (state.successfulShots === 0)) {
      throw new RangeError("state successful shots are inconsistent with potted balls");
    }
    if (state.successfulShots > pottedSet.size) {
      throw new RangeError("state successful shots exceed potted balls");
    }
    if (state.multiBallShots * 2 > pottedSet.size) {
      throw new RangeError("state multi-ball shots exceed potted balls");
    }
    if (state.successfulShots > 0 && state.bestPotStreak === 0) {
      throw new RangeError("state best pot streak is inconsistent with successful shots");
    }
    if (state.consecutiveMisses > 0 && state.potStreak > 0) {
      throw new RangeError("state cannot contain both a miss streak and a pot streak");
    }
    if (state.consecutiveMisses === 0 && pottedSet.size > 0 && state.potStreak === 0) {
      throw new RangeError("state current pot streak is inconsistent with its last shot");
    }
    if (state.shots === 0) {
      if (state.breakCompleted || pottedSet.size > 0 || state.interest !== 100 || state.rhythmScore !== 100) {
        throw new RangeError("an unstarted state is inconsistent");
      }
    } else if (!state.breakCompleted) {
      throw new RangeError("a started state must have completed the break shot");
    }

    if (!Array.isArray(state.violations)) throw new TypeError("state.violations must be an array");
    if (Object.keys(state.violations).length !== state.violations.length) {
      throw new TypeError("state.violations must be dense");
    }
    let expectedRhythm = 100;
    let previousViolationShot = 0;
    let scratchViolations = 0;
    state.violations.forEach((violation, index) => {
      assertRecord(violation, `state.violations[${index}]`);
      assertExactKeys(violation, VIOLATION_KEYS, `state.violations[${index}]`);
      assertInteger(violation.shot, `state.violations[${index}].shot`, 1, state.shots);
      if (violation.shot < previousViolationShot) {
        throw new RangeError("state violations must be ordered by shot");
      }
      previousViolationShot = violation.shot;
      if (!VIOLATION_CODE_SET.has(violation.code)) {
        throw new RangeError(`state.violations[${index}].code is unknown`);
      }
      assertNullableBallNumber(violation.ball, `state.violations[${index}].ball`);
      if (!['active', 'accidental', 'technical'].includes(violation.mode)) {
        throw new RangeError(`state.violations[${index}].mode is unknown`);
      }
      if (!['minor', 'major', 'severe'].includes(violation.severity)) {
        throw new RangeError(`state.violations[${index}].severity is unknown`);
      }
      assertInteger(violation.interestDelta, `state.violations[${index}].interestDelta`, -100, 0);
      assertInteger(violation.rhythmDelta, `state.violations[${index}].rhythmDelta`, -100, 0);
      if (violation.code === "cue-scratch") scratchViolations += 1;
      expectedRhythm += violation.rhythmDelta;
    });
    if (scratchViolations !== state.cueScratches) {
      throw new RangeError("state cue scratches are inconsistent with its violations");
    }
    if (state.rhythmScore !== clamp(expectedRhythm, 0, 100)) {
      throw new RangeError("state.rhythmScore is inconsistent with its violations");
    }

    assertRecord(state.endState, "state.endState");
    assertExactKeys(state.endState, END_STATE_KEYS, "state.endState");
    assertBoolean(state.endState.ended, "state.endState.ended");
    if (!['playing', 'completed', 'failed'].includes(state.endState.status)) {
      throw new RangeError("state.endState.status is unknown");
    }
    if (state.endState.ending !== null && typeof state.endState.ending !== "string") {
      throw new TypeError("state.endState.ending must be null or a string");
    }
    if (state.endState.grade !== null && !['S', 'A', 'B'].includes(state.endState.grade)) {
      throw new RangeError("state.endState.grade is unknown");
    }

    if (state.endState.status === "playing") {
      if (state.endState.ended || state.endState.ending !== null || state.endState.grade !== null) {
        throw new RangeError("a playing end state is inconsistent");
      }
      if (state.interest === 0 || pottedSet.size === RULES.ballCount) {
        throw new RangeError("a finished run cannot remain in playing status");
      }
    } else if (state.endState.status === "completed") {
      if (!state.endState.ended || pottedSet.size !== RULES.ballCount || state.interest === 0) {
        throw new RangeError("a completed end state is inconsistent");
      }
      const expectedGrade = ratingData(state, true).grade;
      if (state.endState.grade !== expectedGrade || state.endState.ending !== SUCCESS_ENDINGS[expectedGrade]) {
        throw new RangeError("state completion rating is inconsistent");
      }
    } else {
      if (!state.endState.ended || state.endState.grade !== null || !FAILURE_ENDINGS.includes(state.endState.ending)) {
        throw new RangeError("a failed end state is inconsistent");
      }
      if (state.endState.ending === "losing-contact" && state.interest !== 0) {
        throw new RangeError("losing-contact requires zero interest");
      }
      if (state.endState.ending === "confession-too-early" && !violationExists(state, "early-confession")) {
        throw new RangeError("confession-too-early requires an early confession violation");
      }
      if (state.endState.ending === "commitment-too-heavy" && !violationExists(state, "commitment-too-heavy")) {
        throw new RangeError("commitment-too-heavy requires its matching violation");
      }
    }
  }

  function validateRunState(state) {
    assertRunState(state);
    return true;
  }

  function currentStage(state) {
    assertRunState(state);
    const index = currentStageIndexFromSet(new Set(state.pottedNumbers));
    return index === null ? null : STAGES[index];
  }

  function availableTargets(state) {
    assertRunState(state);
    if (state.endState.ended) return EMPTY_ARRAY;
    const potted = new Set(state.pottedNumbers);
    const index = currentStageIndexFromSet(potted);
    if (index === null) return EMPTY_ARRAY;
    return Object.freeze(STAGES[index].ballNumbers.filter((number) => !potted.has(number)));
  }

  function remainingNumbers(state) {
    assertRunState(state);
    if (state.endState.ended) return EMPTY_ARRAY;
    const potted = new Set(state.pottedNumbers);
    return Object.freeze(BALLS.map((ball) => ball.number).filter((number) => !potted.has(number)));
  }

  function activeTargetTiming(state, number) {
    const potted = new Set(state.pottedNumbers);
    const currentIndex = currentStageIndexFromSet(potted);
    const stageIndex = BALL_BY_NUMBER[number].stageIndex;
    const stageGap = currentIndex === null ? 0 : stageIndex - currentIndex;
    if (!state.breakCompleted) {
      return { timing: "break-only", stageIndex, currentIndex, stageGap: null, interestDelta: 0, rhythmDelta: 0, failure: null };
    }
    if (number === 8 && [1, 2, 3, 4, 5, 6, 7].some((required) => !potted.has(required))) {
      return {
        timing: "early-confession",
        stageIndex,
        currentIndex,
        stageGap,
        interestDelta: 0,
        rhythmDelta: RULES.rhythm.earlyConfession,
        failure: "confession-too-early"
      };
    }
    if (number === 15) {
      const ready = BALLS.slice(0, 14).every((ball) => potted.has(ball.number));
      if (ready) {
        return { timing: "final-commitment", stageIndex, currentIndex, stageGap, interestDelta: 0, rhythmDelta: 0, failure: null };
      }
      if (stageGap >= 2) {
        return {
          timing: "commitment-too-heavy",
          stageIndex,
          currentIndex,
          stageGap,
          interestDelta: 0,
          rhythmDelta: RULES.rhythm.commitmentTooHeavy,
          failure: "commitment-too-heavy"
        };
      }
      return {
        timing: "premature-commitment",
        stageIndex,
        currentIndex,
        stageGap,
        interestDelta: RULES.interest.prematureCommitment,
        rhythmDelta: RULES.rhythm.prematureCommitment,
        failure: null
      };
    }
    if (stageGap === 0) {
      return { timing: "on-time", stageIndex, currentIndex, stageGap, interestDelta: 0, rhythmDelta: 0, failure: null };
    }
    if (stageGap === 1) {
      return {
        timing: "next-stage",
        stageIndex,
        currentIndex,
        stageGap,
        interestDelta: RULES.interest.activeNextStage,
        rhythmDelta: RULES.rhythm.activeNextStage,
        failure: null
      };
    }
    return {
      timing: "multi-stage",
      stageIndex,
      currentIndex,
      stageGap,
      interestDelta: RULES.interest.activeMultiStage,
      rhythmDelta: RULES.rhythm.activeMultiStage,
      failure: null
    };
  }

  function classifyTarget(state, number) {
    assertRunState(state);
    if (state.endState.ended) throw new RangeError("cannot classify a target after the run has ended");
    assertBallNumber(number, "ball number");
    if (state.pottedNumbers.includes(number)) throw new RangeError(`ball ${number} is already potted`);
    const timing = activeTargetTiming(state, number);
    return deepFreeze({
      number,
      stage: STAGES[timing.stageIndex],
      currentStage: timing.currentIndex === null ? null : STAGES[timing.currentIndex],
      stageGap: timing.stageGap,
      timing: timing.timing,
      interestDelta: timing.interestDelta,
      rhythmDelta: timing.rhythmDelta,
      failure: timing.failure
    });
  }

  function normalizeShot(state, shot) {
    assertRecord(shot, "shot");
    SHOT_KEYS.forEach((key) => {
      if (!hasOwn(shot, key)) throw new TypeError(`shot.${key} is required`);
    });
    assertNullableBallNumber(shot.declaredBall, "shot.declaredBall");
    assertNullableBallNumber(shot.firstContact, "shot.firstContact");
    assertBoolean(shot.cueScratch, "shot.cueScratch");
    assertBoolean(shot.breakShot, "shot.breakShot");
    const pottedNumbers = [...shot.pottedNumbers];
    const bankedNumbers = [...shot.bankedNumbers];
    assertDenseUniqueBallArray(shot.pottedNumbers, "shot.pottedNumbers");
    assertDenseUniqueBallArray(shot.bankedNumbers, "shot.bankedNumbers");

    if (!state.breakCompleted && !shot.breakShot) throw new RangeError("the first shot must be the break shot");
    if (state.breakCompleted && shot.breakShot) throw new RangeError("the break shot has already been completed");
    if (shot.breakShot && shot.declaredBall !== null) throw new RangeError("the break shot cannot declare a target ball");
    if (!shot.breakShot && shot.declaredBall === null) throw new RangeError("a normal shot must declare a target ball");

    const alreadyPotted = new Set(state.pottedNumbers);
    if (shot.declaredBall !== null && alreadyPotted.has(shot.declaredBall)) {
      throw new RangeError(`declared ball ${shot.declaredBall} is already potted`);
    }
    if (shot.firstContact !== null && alreadyPotted.has(shot.firstContact)) {
      throw new RangeError(`first-contact ball ${shot.firstContact} is already potted`);
    }
    pottedNumbers.forEach((number) => {
      if (alreadyPotted.has(number)) throw new RangeError(`potted ball ${number} is already in the run state`);
    });
    const pottedSet = new Set(pottedNumbers);
    bankedNumbers.forEach((number) => {
      if (!pottedSet.has(number)) throw new RangeError(`banked ball ${number} must also be potted`);
    });
    if (pottedNumbers.length > 0 && shot.firstContact === null) {
      throw new RangeError("a shot cannot pot an object ball without a first contact");
    }
    return {
      declaredBall: shot.declaredBall,
      firstContact: shot.firstContact,
      pottedNumbers,
      cueScratch: shot.cueScratch,
      breakShot: shot.breakShot,
      bankedNumbers
    };
  }

  function accidentalTiming(state, number) {
    const potted = new Set(state.pottedNumbers);
    const currentIndex = currentStageIndexFromSet(potted);
    const stageIndex = BALL_BY_NUMBER[number].stageIndex;
    const stageGap = stageIndex - currentIndex;
    if (number === 8 && [1, 2, 3, 4, 5, 6, 7].some((required) => !potted.has(required))) {
      return {
        timing: "accidental-confession",
        interestDelta: RULES.interest.accidentalConfession,
        rhythmDelta: RULES.rhythm.accidentalConfession,
        severity: "major"
      };
    }
    if (number === 15 && BALLS.slice(0, 14).some((ball) => !potted.has(ball.number))) {
      return {
        timing: "accidental-commitment",
        interestDelta: RULES.interest.accidentalCommitment,
        rhythmDelta: RULES.rhythm.accidentalCommitment,
        severity: "major"
      };
    }
    if (stageGap === 0) {
      return { timing: "accidental-surprise", interestDelta: 0, rhythmDelta: 0, severity: null };
    }
    if (stageGap === 1) {
      return {
        timing: "accidental-next-stage",
        interestDelta: 0,
        rhythmDelta: RULES.rhythm.accidentalNextStage,
        severity: "minor"
      };
    }
    return {
      timing: "accidental-multi-stage",
      interestDelta: RULES.interest.accidentalMultiStage,
      rhythmDelta: RULES.rhythm.accidentalMultiStage,
      severity: "major"
    };
  }

  function activeSeverity(timing) {
    if (timing === "next-stage") return "major";
    if (timing === "on-time" || timing === "final-commitment") return null;
    return "severe";
  }

  function activeViolationCode(timing) {
    return {
      "next-stage": "active-next-stage",
      "multi-stage": "active-multi-stage",
      "early-confession": "early-confession",
      "premature-commitment": "premature-commitment",
      "commitment-too-heavy": "commitment-too-heavy"
    }[timing] || null;
  }

  function orderViolation(number, seen, mode) {
    const multiplier = mode === "active" ? 1 : 0.5;
    if (number === 7 && !seen.has(6)) {
      return { code: "date-before-meal", severity: "minor", rhythmDelta: Math.ceil(RULES.rhythm.dateBeforeMeal * multiplier) };
    }
    if (number === 10 && !seen.has(9)) {
      return { code: "embrace-before-handholding", severity: "minor", rhythmDelta: Math.ceil(RULES.rhythm.embraceBeforeHandholding * multiplier) };
    }
    if (number === 11 && (!seen.has(9) || !seen.has(10))) {
      return { code: "travel-before-closeness", severity: "minor", rhythmDelta: Math.ceil(RULES.rhythm.travelBeforeCloseness * multiplier) };
    }
    if (number === 13 && !seen.has(12)) {
      return { code: "reconcile-before-conflict", severity: "major", rhythmDelta: Math.ceil(RULES.rhythm.reconcileBeforeConflict * multiplier) };
    }
    return null;
  }

  function evaluateShot(state, shot) {
    assertRunState(state);
    if (state.endState.ended) throw new RangeError("cannot evaluate a shot after the run has ended");
    const normalized = normalizeShot(state, shot);
    const shotNumber = state.shots + 1;
    const pottedBefore = new Set(state.pottedNumbers);
    const stageBeforeIndex = currentStageIndexFromSet(pottedBefore);
    const stageBefore = stageBeforeIndex === null ? null : STAGES[stageBeforeIndex];
    const protectedOnBreak = new Set(normalized.breakShot ? RULES.breakRespotNumbers : []);
    const respotNumbers = normalized.pottedNumbers.filter((number) => protectedOnBreak.has(number));
    const creditedNumbers = normalized.pottedNumbers.filter((number) => !protectedOnBreak.has(number));
    const creditedSet = new Set(creditedNumbers);
    const effectiveBankedNumbers = normalized.bankedNumbers.filter((number) => creditedSet.has(number));
    const activePottedNumber = normalized.declaredBall !== null
      && normalized.firstContact === normalized.declaredBall
      && creditedSet.has(normalized.declaredBall)
      ? normalized.declaredBall
      : null;
    const accidentalPottedNumbers = creditedNumbers.filter((number) => number !== activePottedNumber);
    const interestChanges = [];
    const addedViolations = [];
    const events = [];
    let directFailure = null;

    function addInterestChange(code, amount, ball) {
      if (amount !== 0) interestChanges.push({ code, amount, ball });
    }

    function addViolation(code, ball, mode, severity, interestDelta, rhythmDelta) {
      addedViolations.push({
        shot: shotNumber,
        code,
        ball,
        mode,
        severity,
        interestDelta,
        rhythmDelta
      });
      addInterestChange(code, interestDelta, ball);
    }

    if (normalized.cueScratch) {
      addViolation("cue-scratch", null, "technical", "minor", RULES.interest.cueScratch, 0);
    }

    if (normalized.breakShot) {
      normalized.pottedNumbers.forEach((number) => {
        const respotted = protectedOnBreak.has(number);
        events.push({
          number,
          mode: "break",
          timing: respotted ? "protected-respot" : "break-pot",
          stageIndex: BALL_BY_NUMBER[number].stageIndex,
          stageGap: null,
          banked: normalized.bankedNumbers.includes(number),
          credited: !respotted,
          interestDelta: 0,
          rhythmDelta: 0
        });
      });
    } else {
      const seen = new Set(state.pottedNumbers);
      creditedNumbers.forEach((number) => {
        const mode = number === activePottedNumber ? "active" : "accidental";
        const timing = mode === "active" ? activeTargetTiming(state, number) : accidentalTiming(state, number);
        let eventInterestDelta = timing.interestDelta;
        let eventRhythmDelta = timing.rhythmDelta;
        if (mode === "active") {
          const code = activeViolationCode(timing.timing);
          if (code) {
            addViolation(code, number, mode, activeSeverity(timing.timing), timing.interestDelta, timing.rhythmDelta);
          }
          if (timing.failure) directFailure = timing.failure;
        } else if (timing.severity) {
          addViolation(timing.timing, number, mode, timing.severity, timing.interestDelta, timing.rhythmDelta);
        }

        const order = orderViolation(number, seen, mode);
        if (order) {
          addViolation(order.code, number, mode, order.severity, 0, order.rhythmDelta);
          eventRhythmDelta += order.rhythmDelta;
        }
        events.push({
          number,
          mode,
          timing: timing.timing,
          stageIndex: BALL_BY_NUMBER[number].stageIndex,
          stageGap: BALL_BY_NUMBER[number].stageIndex - stageBeforeIndex,
          banked: effectiveBankedNumbers.includes(number),
          credited: true,
          interestDelta: eventInterestDelta,
          rhythmDelta: eventRhythmDelta
        });
        seen.add(number);
      });
    }

    const pottedAfter = new Set(state.pottedNumbers);
    creditedNumbers.forEach((number) => pottedAfter.add(number));
    const successfulShot = creditedNumbers.length > 0;
    const consecutiveMisses = normalized.breakShot
      ? 0
      : successfulShot ? 0 : state.consecutiveMisses + 1;
    const potStreak = successfulShot ? state.potStreak + creditedNumbers.length : 0;
    if (!normalized.breakShot && !successfulShot) {
      if (consecutiveMisses === 2) {
        addInterestChange("second-consecutive-miss", RULES.interest.secondConsecutiveMiss, null);
      } else if (consecutiveMisses >= 3) {
        addInterestChange("continued-consecutive-miss", RULES.interest.continuedConsecutiveMiss, null);
      }
    }

    let completedCurrentStage = false;
    if (!normalized.breakShot) {
      const activeEvent = events.find((event) => event.mode === "active");
      if (activeEvent && (activeEvent.timing === "on-time" || activeEvent.timing === "final-commitment")) {
        addInterestChange("current-target-recovery", RULES.interest.currentTargetRecovery, activeEvent.number);
      }
      const currentStagePots = creditedNumbers.filter((number) => BALL_BY_NUMBER[number].stageIndex === stageBeforeIndex);
      if (currentStagePots.length >= 2) {
        addInterestChange("current-stage-multi-recovery", RULES.interest.currentStageMultiRecovery, null);
      }
      completedCurrentStage = stageBefore !== null
        && !isStageComplete(stageBefore, pottedBefore)
        && isStageComplete(stageBefore, pottedAfter);
      if (completedCurrentStage) {
        addInterestChange("stage-complete-recovery", RULES.interest.stageCompleteRecovery, null);
      }
      effectiveBankedNumbers.forEach((number) => {
        addInterestChange("banked-pot-recovery", RULES.interest.bankedPotRecovery, number);
      });
    }

    const rawInterestDelta = interestChanges.reduce((sum, change) => sum + change.amount, 0);
    const rawRhythmDelta = addedViolations.reduce((sum, violation) => sum + violation.rhythmDelta, 0);
    const nextInterest = clamp(state.interest + rawInterestDelta, 0, 100);
    const nextRhythm = clamp(state.rhythmScore + rawRhythmDelta, 0, 100);
    const sortedPottedNumbers = [...pottedAfter].sort((left, right) => left - right);
    const pocketOrder = [...state.pocketOrder, ...creditedNumbers];
    const completedStageIds = STAGES
      .filter((stage) => !isStageComplete(stage, pottedBefore) && isStageComplete(stage, pottedAfter))
      .map((stage) => stage.id);
    const baseState = {
      version: RULES.version,
      pottedNumbers: sortedPottedNumbers,
      interest: nextInterest,
      rhythmScore: nextRhythm,
      consecutiveMisses,
      shots: shotNumber,
      successfulShots: state.successfulShots + (successfulShot ? 1 : 0),
      potStreak,
      bestPotStreak: Math.max(state.bestPotStreak, potStreak),
      cueScratches: state.cueScratches + (normalized.cueScratch ? 1 : 0),
      bankedPots: state.bankedPots + effectiveBankedNumbers.length,
      multiBallShots: state.multiBallShots + (creditedNumbers.length > 1 ? 1 : 0),
      violations: [...state.violations, ...addedViolations],
      pocketOrder,
      breakCompleted: true,
      endState: { ended: false, status: "playing", ending: null, grade: null }
    };

    if (directFailure) {
      baseState.endState = { ended: true, status: "failed", ending: directFailure, grade: null };
    } else if (nextInterest === 0) {
      baseState.endState = { ended: true, status: "failed", ending: "losing-contact", grade: null };
    } else if (sortedPottedNumbers.length === RULES.ballCount) {
      const grade = ratingData(baseState, true).grade;
      baseState.endState = { ended: true, status: "completed", ending: SUCCESS_ENDINGS[grade], grade };
    }

    const nextState = freezeRunState(baseState);
    assertRunState(nextState);
    const stageAfterIndex = currentStageIndexFromSet(pottedAfter);
    const stageAfter = stageAfterIndex === null ? null : STAGES[stageAfterIndex];
    const activeEvent = events.find((event) => event.mode === "active");
    const activeTiming = normalized.breakShot
      ? "break"
      : activeEvent ? activeEvent.timing : successfulShot ? "accidental-only" : "miss";
    const frozenShot = deepFreeze({
      ...normalized,
      pottedNumbers: [...normalized.pottedNumbers],
      bankedNumbers: [...normalized.bankedNumbers]
    });
    return deepFreeze({
      state: nextState,
      shot: frozenShot,
      stageBefore,
      stageAfter,
      pottedNumbers: creditedNumbers,
      respotNumbers,
      declaredPotted: activePottedNumber !== null,
      activePottedNumber,
      accidentalPottedNumbers,
      activeTiming,
      events,
      completedStageIds,
      completedCurrentStage,
      interestChanges,
      rawInterestDelta,
      interestDelta: nextInterest - state.interest,
      rhythmDelta: nextRhythm - state.rhythmScore,
      miss: !successfulShot,
      cueScratch: normalized.cueScratch,
      contactMatched: normalized.declaredBall === null ? null : normalized.firstContact === normalized.declaredBall,
      endState: nextState.endState,
      rating: ratingData(nextState, false)
    });
  }

  function computeRating(state) {
    assertRunState(state);
    return deepFreeze(ratingData(state, false));
  }

  return deepFreeze({
    RULES,
    BALLS,
    STAGES,
    VIOLATION_CODES,
    SUCCESS_ENDINGS,
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
  });
});
