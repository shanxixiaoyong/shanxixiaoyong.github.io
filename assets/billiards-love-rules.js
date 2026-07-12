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
    { index: 0, number: 1, id: "first-contact", name: "初次接触", ballNumbers: [1, 2, 3], quota: 3, ordinaryTarget: 3, requiresEight: false, interestFloor: 38 },
    { index: 1, number: 2, id: "growing-familiar", name: "逐渐熟悉", ballNumbers: [4, 5], quota: 2, ordinaryTarget: 5, requiresEight: false, interestFloor: 36 },
    { index: 2, number: 3, id: "intentional-dates", name: "暧昧升温", ballNumbers: [6, 7], quota: 2, ordinaryTarget: 7, requiresEight: false, interestFloor: 34 },
    { index: 3, number: 4, id: "spoken-heart", name: "关系转折", ballNumbers: [8], quota: 1, ordinaryTarget: 8, requiresEight: false, interestFloor: 32 },
    { index: 4, number: 5, id: "confirmed-love", name: "正式相恋", ballNumbers: [9, 10, 11], quota: 3, ordinaryTarget: 11, requiresEight: false, interestFloor: 30 },
    { index: 5, number: 6, id: "learning-together", name: "磨合", ballNumbers: [12, 13], quota: 2, ordinaryTarget: 13, requiresEight: false, interestFloor: 28 },
    { index: 6, number: 7, id: "shared-future", name: "共同未来", ballNumbers: [14, 15], quota: 2, ordinaryTarget: 14, requiresEight: true, interestFloor: 26 }
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
    criticalNumbers: [8],
    breakRespotNumbers: [],
    interest: {
      initial: 72,
      minimum: 0,
      maximum: 100,
      firstConsecutiveMiss: -1,
      secondConsecutiveMiss: -3,
      continuedConsecutiveMiss: -6,
      cueScratch: -6,
      currentStagePotRecovery: 3,
      stageCompleteRecovery: 6,
      streakTwo: 2,
      streakThree: 4,
      streakFourPlus: 6
    },
    earlyEight: {
      minimumOrdinaryPots: 7,
      minimumInterest: 90,
      minimumStreak: 4
    },
    rating: {
      technicalS: 85,
      technicalA: 60,
      relationshipS: 80,
      relationshipA: 50
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
  const REQUIRED_SHOT_KEYS = Object.freeze([
    "pottedNumbers",
    "cueScratch",
    "breakShot",
    "bankedNumbers"
  ]);
  const LEGACY_SHOT_KEYS = Object.freeze(["declaredBall", "firstContact"]);
  const ALLOWED_SHOT_KEYS = new Set([...REQUIRED_SHOT_KEYS, ...LEGACY_SHOT_KEYS]);
  const VIOLATION_CODES = Object.freeze(["cue-scratch"]);
  const LEGACY_VIOLATION_CODES = Object.freeze([
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
  const KNOWN_VIOLATION_CODES = new Set([...VIOLATION_CODES, ...LEGACY_VIOLATION_CODES]);
  const SUCCESS_ENDINGS = Object.freeze({
    S: "mutual-devotion",
    A: "together-at-last",
    B: "bumpy-love"
  });
  const FAILURE_ENDINGS = Object.freeze(["losing-contact", "reckless-rejection"]);
  const EARLY_SUCCESS_ENDING = "early-mutual-choice";
  const LEGACY_FAILURE_ENDINGS = Object.freeze(["confession-too-early", "commitment-too-heavy"]);
  const EMPTY_ARRAY = Object.freeze([]);

  function isRecord(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
    if (Object.prototype.toString.call(value) !== "[object Object]") return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || Object.getPrototypeOf(prototype) === null;
  }

  function assertRecord(value, label) {
    if (!isRecord(value)) throw new TypeError(label + " must be a plain object");
  }

  function assertExactKeys(value, expected, label) {
    const keys = Object.keys(value);
    if (keys.length !== expected.length || expected.some((key) => !hasOwn(value, key))) {
      throw new TypeError(label + " has an invalid shape");
    }
  }

  function assertInteger(value, label, minimum, maximum) {
    if (!Number.isSafeInteger(value)) throw new TypeError(label + " must be an integer");
    if (value < minimum || value > maximum) {
      throw new RangeError(label + " must be between " + minimum + " and " + maximum);
    }
  }

  function assertBoolean(value, label) {
    if (typeof value !== "boolean") throw new TypeError(label + " must be a boolean");
  }

  function assertBallNumber(value, label) {
    assertInteger(value, label, 1, RULES.ballCount);
  }

  function assertNullableBallNumber(value, label) {
    if (value !== null) assertBallNumber(value, label);
  }

  function assertDenseUniqueBallArray(value, label) {
    if (!Array.isArray(value)) throw new TypeError(label + " must be an array");
    if (Object.keys(value).length !== value.length) {
      throw new TypeError(label + " must contain only dense indexed values");
    }
    const seen = new Set();
    for (let index = 0; index < value.length; index += 1) {
      if (!hasOwn(value, index)) throw new TypeError(label + " must be dense");
      assertBallNumber(value[index], label + "[" + index + "]");
      if (seen.has(value[index])) {
        throw new RangeError(label + " cannot contain duplicate ball numbers");
      }
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

  function ordinaryPotCount(potted) {
    let count = 0;
    potted.forEach((number) => {
      if (number !== 8) count += 1;
    });
    return count;
  }

  function storyNumberForPocket(number, potted) {
    if (number === 8) return 15;
    return ordinaryPotCount(potted) + 1;
  }

  function isStageComplete(stage, potted) {
    return ordinaryPotCount(potted) >= stage.ordinaryTarget
      && (!stage.requiresEight || potted.has(8));
  }

  function completedStageCountFromSet(potted) {
    let count = 0;
    while (count < STAGES.length && isStageComplete(STAGES[count], potted)) count += 1;
    return count;
  }

  function currentStageIndexFromSet(potted) {
    const completedCount = completedStageCountFromSet(potted);
    return completedCount === STAGES.length ? null : completedCount;
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
    const relationshipGrade = state.interest >= RULES.rating.relationshipS
      ? "S"
      : state.interest >= RULES.rating.relationshipA ? "A" : "B";
    const completed = assumeCompleted || state.endState.status === "completed";
    let grade = null;
    if (completed) {
      grade = technicalGrade === "S" && relationshipGrade === "S"
        ? "S"
        : technicalGrade === "B" || relationshipGrade === "B" ? "B" : "A";
    }
    return {
      grade,
      ending: state.endState.ending === EARLY_SUCCESS_ENDING
        ? EARLY_SUCCESS_ENDING
        : grade === null ? state.endState.ending : SUCCESS_ENDINGS[grade],
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
        score: state.interest,
        grade: relationshipGrade,
        interest: state.interest
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
      if (state.breakCompleted || pottedSet.size > 0 || state.interest !== RULES.interest.initial || state.rhythmScore !== 100) {
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
      const label = "state.violations[" + index + "]";
      assertRecord(violation, label);
      assertExactKeys(violation, VIOLATION_KEYS, label);
      assertInteger(violation.shot, label + ".shot", 1, state.shots);
      if (violation.shot < previousViolationShot) {
        throw new RangeError("state violations must be ordered by shot");
      }
      previousViolationShot = violation.shot;
      if (!KNOWN_VIOLATION_CODES.has(violation.code)) {
        throw new RangeError(label + ".code is unknown");
      }
      assertNullableBallNumber(violation.ball, label + ".ball");
      if (!["active", "accidental", "technical"].includes(violation.mode)) {
        throw new RangeError(label + ".mode is unknown");
      }
      if (!["minor", "major", "severe"].includes(violation.severity)) {
        throw new RangeError(label + ".severity is unknown");
      }
      assertInteger(violation.interestDelta, label + ".interestDelta", -100, 0);
      assertInteger(violation.rhythmDelta, label + ".rhythmDelta", -100, 0);
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
    if (!["playing", "completed", "failed"].includes(state.endState.status)) {
      throw new RangeError("state.endState.status is unknown");
    }
    if (state.endState.ending !== null && typeof state.endState.ending !== "string") {
      throw new TypeError("state.endState.ending must be null or a string");
    }
    if (state.endState.grade !== null && !["S", "A", "B"].includes(state.endState.grade)) {
      throw new RangeError("state.endState.grade is unknown");
    }

    if (state.endState.status === "playing") {
      if (state.endState.ended || state.endState.ending !== null || state.endState.grade !== null) {
        throw new RangeError("a playing end state is inconsistent");
      }
      if (pottedSet.size === RULES.ballCount) {
        throw new RangeError("a finished run cannot remain in playing status");
      }
    } else if (state.endState.status === "completed") {
      const earlySuccess = state.endState.ending === EARLY_SUCCESS_ENDING;
      if (!state.endState.ended
          || (!earlySuccess && pottedSet.size !== RULES.ballCount)
          || (earlySuccess && (!pottedSet.has(8) || pottedSet.size >= RULES.ballCount))) {
        throw new RangeError("a completed end state is inconsistent");
      }
      const expectedGrade = ratingData(state, true).grade;
      const expectedEnding = earlySuccess ? EARLY_SUCCESS_ENDING : SUCCESS_ENDINGS[expectedGrade];
      if (state.endState.grade !== expectedGrade || state.endState.ending !== expectedEnding) {
        throw new RangeError("state completion rating is inconsistent");
      }
    } else {
      const knownFailure = FAILURE_ENDINGS.includes(state.endState.ending)
        || LEGACY_FAILURE_ENDINGS.includes(state.endState.ending);
      if (!state.endState.ended || state.endState.grade !== null || !knownFailure) {
        throw new RangeError("a failed end state is inconsistent");
      }
      if (state.endState.ending === "losing-contact" && state.interest > activeInterestFloor(pottedSet)) {
        throw new RangeError("losing-contact requires interest below the active stage threshold");
      }
      if (state.endState.ending === "reckless-rejection" && !pottedSet.has(8)) {
        throw new RangeError("reckless-rejection requires an early eight ball");
      }
      if (state.endState.ending === "confession-too-early" && !violationExists(state, "early-confession")) {
        throw new RangeError("confession-too-early requires its historical violation");
      }
      if (state.endState.ending === "commitment-too-heavy" && !violationExists(state, "commitment-too-heavy")) {
        throw new RangeError("commitment-too-heavy requires its historical violation");
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

  function activeInterestFloor(potted) {
    const index = currentStageIndexFromSet(potted);
    return STAGES[index === null ? STAGES.length - 1 : index].interestFloor;
  }

  function interestStatusData(interest, potted) {
    const margin = interest - activeInterestFloor(potted);
    if (margin <= 0) return { band: "lost", label: "回应熄灭" };
    if (margin <= 8) return { band: "danger", label: "正在疏远" };
    if (margin <= 18) return { band: "uncertain", label: "有些动摇" };
    if (interest >= RULES.earlyEight.minimumInterest) return { band: "devoted", label: "双向炽热" };
    if (interest >= 78) return { band: "warm", label: "明显升温" };
    return { band: "steady", label: "自然靠近" };
  }

  function interestStatus(state) {
    assertRunState(state);
    return deepFreeze(interestStatusData(state.interest, new Set(state.pottedNumbers)));
  }

  function stageProgress(state) {
    assertRunState(state);
    const potted = new Set(state.pottedNumbers);
    const index = currentStageIndexFromSet(potted);
    if (index === null) return null;
    const stage = STAGES[index];
    const previousOrdinaryTarget = index === 0 ? 0 : STAGES[index - 1].ordinaryTarget;
    const completedOrdinary = clamp(ordinaryPotCount(potted) - previousOrdinaryTarget, 0, stage.quota);
    const completed = completedOrdinary + (stage.requiresEight && potted.has(8) ? 1 : 0);
    return deepFreeze({
      stage,
      completed,
      remaining: stage.quota - completed,
      quota: stage.quota,
      target: stage.requiresEight && ordinaryPotCount(potted) >= stage.ordinaryTarget ? "eight" : "ordinary"
    });
  }

  function availableTargets(state) {
    assertRunState(state);
    if (state.endState.ended) return EMPTY_ARRAY;
    const potted = new Set(state.pottedNumbers);
    const index = currentStageIndexFromSet(potted);
    if (index === null) return EMPTY_ARRAY;
    if (index === 6 && ordinaryPotCount(potted) >= STAGES[6].ordinaryTarget) {
      return potted.has(8) ? EMPTY_ARRAY : Object.freeze([8]);
    }
    return Object.freeze(BALLS
      .map((ball) => ball.number)
      .filter((number) => number !== 8 && !potted.has(number)));
  }

  function remainingNumbers(state) {
    assertRunState(state);
    if (state.endState.ended) return EMPTY_ARRAY;
    const potted = new Set(state.pottedNumbers);
    return Object.freeze(BALLS.map((ball) => ball.number).filter((number) => !potted.has(number)));
  }

  function classifyTarget(state, number) {
    assertRunState(state);
    if (state.endState.ended) throw new RangeError("cannot classify a target after the run has ended");
    assertBallNumber(number, "ball number");
    if (state.pottedNumbers.includes(number)) {
      throw new RangeError("ball " + number + " is already potted");
    }
    const potted = new Set(state.pottedNumbers);
    const currentIndex = currentStageIndexFromSet(potted);
    const storyNumber = storyNumberForPocket(number, potted);
    const stageIndex = BALL_BY_NUMBER[storyNumber].stageIndex;
    const stageGap = currentIndex === null ? null : stageIndex - currentIndex;
    const current = number === 8
      ? currentIndex === 6 && ordinaryPotCount(potted) >= STAGES[6].ordinaryTarget
      : true;
    return deepFreeze({
      number,
      storyNumber,
      stage: STAGES[stageIndex],
      currentStage: currentIndex === null ? null : STAGES[currentIndex],
      stageGap: state.breakCompleted ? stageGap : null,
      stageStatus: current ? "current" : "eight-early",
      completedEarly: !current,
      timing: !state.breakCompleted ? "break-only" : current ? "on-time" : number === 8 ? "eight-too-early" : "early-completion",
      interestDelta: state.breakCompleted && current ? RULES.interest.currentStagePotRecovery : 0,
      rhythmDelta: 0,
      failure: null
    });
  }

  function normalizeShot(state, shot) {
    assertRecord(shot, "shot");
    REQUIRED_SHOT_KEYS.forEach((key) => {
      if (!hasOwn(shot, key)) throw new TypeError("shot." + key + " is required");
    });
    Object.keys(shot).forEach((key) => {
      if (!ALLOWED_SHOT_KEYS.has(key)) throw new TypeError("shot." + key + " is not supported");
    });
    if (hasOwn(shot, "declaredBall")) {
      assertNullableBallNumber(shot.declaredBall, "shot.declaredBall");
    }
    if (hasOwn(shot, "firstContact")) {
      assertNullableBallNumber(shot.firstContact, "shot.firstContact");
    }
    assertBoolean(shot.cueScratch, "shot.cueScratch");
    assertBoolean(shot.breakShot, "shot.breakShot");
    assertDenseUniqueBallArray(shot.pottedNumbers, "shot.pottedNumbers");
    assertDenseUniqueBallArray(shot.bankedNumbers, "shot.bankedNumbers");
    const pottedNumbers = [...shot.pottedNumbers];
    const bankedNumbers = [...shot.bankedNumbers];

    if (!state.breakCompleted && !shot.breakShot) {
      throw new RangeError("the first shot must be the break shot");
    }
    if (state.breakCompleted && shot.breakShot) {
      throw new RangeError("the break shot has already been completed");
    }

    const alreadyPotted = new Set(state.pottedNumbers);
    pottedNumbers.forEach((number) => {
      if (alreadyPotted.has(number)) {
        throw new RangeError("potted ball " + number + " is already in the run state");
      }
    });
    const pottedSet = new Set(pottedNumbers);
    bankedNumbers.forEach((number) => {
      if (!pottedSet.has(number)) {
        throw new RangeError("banked ball " + number + " must also be potted");
      }
    });

    return {
      declaredBall: null,
      firstContact: null,
      pottedNumbers,
      cueScratch: shot.cueScratch,
      breakShot: shot.breakShot,
      bankedNumbers
    };
  }

  function evaluateShot(state, shot) {
    assertRunState(state);
    if (state.endState.ended) throw new RangeError("cannot evaluate a shot after the run has ended");
    const normalized = normalizeShot(state, shot);
    const shotNumber = state.shots + 1;
    const pottedBefore = new Set(state.pottedNumbers);
    const completedCountBefore = completedStageCountFromSet(pottedBefore);
    const stageBeforeIndex = currentStageIndexFromSet(pottedBefore);
    const stageBefore = stageBeforeIndex === null ? null : STAGES[stageBeforeIndex];
    const creditedNumbers = [];
    const respotNumbers = [];
    const pocketDrafts = [];
    const pottedAfter = new Set(pottedBefore);
    normalized.pottedNumbers.forEach((number) => {
      const currentIndexAtPot = currentStageIndexFromSet(pottedAfter);
      const storyNumber = storyNumberForPocket(number, pottedAfter);
      const storyBall = BALL_BY_NUMBER[storyNumber];
      const earlyEight = number === 8
        && !(currentIndexAtPot === 6 && ordinaryPotCount(pottedAfter) >= STAGES[6].ordinaryTarget);
      const current = !earlyEight && storyBall.stageIndex === currentIndexAtPot;
      creditedNumbers.push(number);
      pottedAfter.add(number);
      pocketDrafts.push({
        number,
        storyNumber,
        stageId: storyBall.stageId,
        stageIndex: storyBall.stageIndex,
        stageStatus: current ? "current" : "eight-early",
        completedEarly: earlyEight,
        mode: normalized.breakShot ? "break" : current ? "active" : "accidental",
        timing: earlyEight ? "eight-too-early" : normalized.breakShot ? "break-pot" : "on-time",
        stageGap: currentIndexAtPot === null ? null : storyBall.stageIndex - currentIndexAtPot,
        credited: true,
        respotted: false,
        interestDelta: current ? RULES.interest.currentStagePotRecovery : 0
      });
    });
    const creditedSet = new Set(creditedNumbers);
    const effectiveBankedNumbers = normalized.bankedNumbers.filter((number) => creditedSet.has(number));
    const currentStagePottedEvents = pocketDrafts.filter((event) => event.credited && !event.completedEarly);
    const earlyPottedNumbers = pocketDrafts
      .filter((event) => event.completedEarly)
      .map((event) => event.number);
    const completedCountAfter = completedStageCountFromSet(pottedAfter);
    const newlyCompletedStages = STAGES.slice(completedCountBefore, completedCountAfter);
    const newlyCompletedStageIds = newlyCompletedStages.map((stage) => stage.id);
    const newlyEarlyCompletedStageIds = STAGES
      .filter((stage) => (
        stage.index > stageBeforeIndex
        && !isStageComplete(stage, pottedBefore)
        && isStageComplete(stage, pottedAfter)
      ))
      .map((stage) => stage.id);
    const earlyCompletedStageIds = STAGES
      .filter((stage) => stage.index >= completedCountAfter && isStageComplete(stage, pottedAfter))
      .map((stage) => stage.id);

    const successfulShot = creditedNumbers.length > 0;
    const madePhysicalPot = normalized.pottedNumbers.length > 0;
    const consecutiveMisses = normalized.breakShot
      ? 0
      : madePhysicalPot ? 0 : state.consecutiveMisses + 1;
    const potStreak = successfulShot ? state.potStreak + creditedNumbers.length : 0;
    const interestChanges = [];
    const addedViolations = [];

    function addInterestChange(code, amount, ball, stageId) {
      if (amount === 0) return;
      interestChanges.push({ code, amount, ball, stageId });
    }

    let scratchDelta = 0;
    if (normalized.cueScratch) {
      scratchDelta = RULES.interest.cueScratch;
      addedViolations.push({
        shot: shotNumber,
        code: "cue-scratch",
        ball: null,
        mode: "technical",
        severity: "minor",
        interestDelta: scratchDelta,
        rhythmDelta: 0
      });
      addInterestChange("cue-scratch", scratchDelta, null, null);
    }

    let missCode = null;
    let missDelta = 0;
    if (!normalized.breakShot && !madePhysicalPot) {
      if (consecutiveMisses === 1) {
        missCode = "first-consecutive-miss";
        missDelta = RULES.interest.firstConsecutiveMiss;
      } else if (consecutiveMisses === 2) {
        missCode = "second-consecutive-miss";
        missDelta = RULES.interest.secondConsecutiveMiss;
      } else if (consecutiveMisses >= 3) {
        missCode = "continued-consecutive-miss";
        missDelta = RULES.interest.continuedConsecutiveMiss;
      }
      if (missCode) addInterestChange(missCode, missDelta, null, null);
    }

    currentStagePottedEvents.forEach((event) => {
      addInterestChange(
        "current-stage-pot-recovery",
        RULES.interest.currentStagePotRecovery,
        event.number,
        event.stageId
      );
    });
    newlyCompletedStages.forEach((stage) => {
      addInterestChange(
        "stage-complete-recovery",
        RULES.interest.stageCompleteRecovery,
        null,
        stage.id
      );
    });

    let streakBonus = 0;
    if (successfulShot && potStreak >= 2) {
      streakBonus = potStreak >= 4
        ? RULES.interest.streakFourPlus
        : potStreak === 3 ? RULES.interest.streakThree : RULES.interest.streakTwo;
      addInterestChange("pot-streak-bonus", streakBonus, null, stageBefore?.id || null);
    }

    const rawInterestDelta = interestChanges.reduce((sum, change) => sum + change.amount, 0);
    const nextInterest = clamp(state.interest + rawInterestDelta, 0, 100);
    const nextRhythm = state.rhythmScore;
    const sortedPottedNumbers = [...pottedAfter].sort((left, right) => left - right);
    const pocketOrder = [...state.pocketOrder, ...creditedNumbers];
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

    const earlyEightEvent = pocketDrafts.find((event) => event.number === 8 && event.completedEarly) || null;
    const earlyEightSuccess = Boolean(earlyEightEvent
      && ordinaryPotCount(pottedBefore) >= RULES.earlyEight.minimumOrdinaryPots
      && state.interest >= RULES.earlyEight.minimumInterest
      && state.potStreak >= RULES.earlyEight.minimumStreak);
    if (earlyEightEvent) {
      if (earlyEightSuccess) {
        const grade = ratingData(baseState, true).grade;
        baseState.endState = { ended: true, status: "completed", ending: EARLY_SUCCESS_ENDING, grade };
      } else {
        baseState.endState = { ended: true, status: "failed", ending: "reckless-rejection", grade: null };
      }
    } else if (sortedPottedNumbers.length === RULES.ballCount) {
      const grade = ratingData(baseState, true).grade;
      baseState.endState = { ended: true, status: "completed", ending: SUCCESS_ENDINGS[grade], grade };
    }

    const nextState = freezeRunState(baseState);
    assertRunState(nextState);
    const stageAfterIndex = currentStageIndexFromSet(pottedAfter);
    const stageAfter = stageAfterIndex === null ? null : STAGES[stageAfterIndex];
    const pocketEvents = pocketDrafts.map((draft) => ({
        type: "pocket",
        shot: shotNumber,
        ...draft,
        banked: draft.credited && effectiveBankedNumbers.includes(draft.number),
        rhythmDelta: 0
      }));
    const stageEvents = newlyCompletedStages.map((stage) => ({
      type: "stage-complete",
      shot: shotNumber,
      stageId: stage.id,
      stageIndex: stage.index,
      cascaded: stage.index > stageBeforeIndex,
      completedEarly: stage.index > stageBeforeIndex,
      precompleted: isStageComplete(stage, pottedBefore),
      interestDelta: RULES.interest.stageCompleteRecovery,
      rhythmDelta: 0,
      credited: false
    }));
    const scratchEvent = normalized.cueScratch
      ? {
          type: "scratch",
          shot: shotNumber,
          code: "cue-scratch",
          interestDelta: scratchDelta,
          rhythmDelta: 0,
          credited: false
        }
      : null;
    const missEvent = !madePhysicalPot
      ? {
          type: "miss",
          shot: shotNumber,
          code: missCode || "miss",
          breakShot: normalized.breakShot,
          counted: !normalized.breakShot,
          consecutiveMisses,
          interestDelta: missDelta,
          rhythmDelta: 0,
          credited: false
        }
      : null;
    const events = [
      ...pocketEvents,
      ...stageEvents,
      ...(scratchEvent ? [scratchEvent] : []),
      ...(missEvent ? [missEvent] : [])
    ];
    const activeTiming = earlyEightEvent
      ? "eight-too-early"
      : normalized.breakShot ? "break"
      : currentStagePottedEvents.length > 0
        ? "on-time"
        : madePhysicalPot
          ? earlyEightEvent ? "eight-too-early" : "early-completion"
          : "miss";
    const frozenShot = deepFreeze({
      ...normalized,
      pottedNumbers: [...normalized.pottedNumbers],
      bankedNumbers: [...normalized.bankedNumbers]
    });

    const signal = interestStatusData(nextInterest, pottedAfter);
    const interestTrend = {
      direction: rawInterestDelta > 0 ? "up" : rawInterestDelta < 0 ? "down" : "steady",
      band: signal.band,
      label: signal.label,
      line: rawInterestDelta > 0
        ? streakBonus > 0 ? "连续命中让回应明显变热。" : "这一次靠近得自然，她的回应更明亮。"
        : rawInterestDelta < 0
          ? ["danger", "lost"].includes(signal.band) ? "几次停顿叠在一起，她正在慢慢退远。" : "气氛有了一点迟疑，下一杆最好重新接住。"
          : "关系仍在观察，没有更近，也没有走远。"
    };

    return deepFreeze({
      state: nextState,
      shot: frozenShot,
      stageBefore,
      stageAfter,
      pottedNumbers: creditedNumbers,
      respotNumbers,
      declaredPotted: false,
      activePottedNumber: null,
      accidentalPottedNumbers: earlyPottedNumbers,
      activeTiming,
      events,
      pocketEvents,
      stageEvents,
      missEvent,
      scratchEvent,
      completedStageIds: newlyCompletedStageIds,
      newlyCompletedStageIds,
      newlyEarlyCompletedStageIds,
      earlyCompletedStageIds,
      completedCurrentStage: newlyCompletedStageIds.includes(stageBefore && stageBefore.id),
      interestChanges,
      streakBonus,
      interestSignal: signal,
      interestTrend,
      earlyEight: earlyEightEvent ? { success: earlyEightSuccess, event: earlyEightEvent } : null,
      rawInterestDelta,
      interestDelta: nextInterest - state.interest,
      rhythmDelta: nextRhythm - state.rhythmScore,
      miss: !madePhysicalPot,
      cueScratch: normalized.cueScratch,
      contactMatched: null,
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
    EARLY_SUCCESS_ENDING,
    FAILURE_ENDINGS,
    ballByNumber,
    stageForBall,
    createRunState,
    validateRunState,
    currentStage,
    interestStatus,
    stageProgress,
    availableTargets,
    remainingNumbers,
    classifyTarget,
    evaluateShot,
    computeRating
  });
});
