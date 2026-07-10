(function (root, factory) {
  const rules = factory();
  if (typeof module === "object" && module.exports) module.exports = rules;
  else root.WatermelonRules = rules;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const NAMES = ["蓝莓", "樱桃", "草莓", "葡萄", "橘子", "苹果", "梨", "桃子", "菠萝", "哈密瓜", "西瓜"];
  const RADII = [13, 17, 22, 27, 33, 40, 48, 57, 66, 76, 86];
  const BASE_SCORES = [0, 10, 25, 45, 70, 110, 170, 260, 400, 650, 1000];
  const SPAWN_WEIGHTS = Object.freeze([10, 6, 3, 1]);
  const COMBO_MULTIPLIERS = Object.freeze([1, 1.5, 2, 2.5, 3]);
  const MAX_UINT32 = 0xffffffff;
  const SNAPSHOT_MAX_DEPTH = 64;
  const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

  const FRUITS = Object.freeze(NAMES.map((name, tier) => Object.freeze({
    tier,
    name,
    radius: RADII[tier],
    score: BASE_SCORES[tier]
  })));

  const RULES = Object.freeze({
    title: "合成大西瓜",
    spawnWeights: SPAWN_WEIGHTS,
    openingMaxTier: 2,
    comboWindowMs: 1000,
    comboMultipliers: COMBO_MULTIPLIERS,
    precisionMultiplier: 1.25,
    mixedMergeLabel: "默契合成",
    maxHeartPips: 3,
    ripenMaxSourceTier: 3,
    watermelonHarvestScore: 2500
  });

  function isRecord(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function assertRecord(value, label) {
    if (!isRecord(value)) throw new TypeError(`${label} must be a plain object`);
  }

  function assertBoolean(value, label) {
    if (typeof value !== "boolean") throw new TypeError(`${label} must be a boolean`);
  }

  function assertFinite(value, label, minimum = -Infinity) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new TypeError(`${label} must be a finite number`);
    }
    if (value < minimum) throw new RangeError(`${label} must be at least ${minimum}`);
  }

  function assertInteger(value, label, minimum, maximum) {
    if (!Number.isSafeInteger(value)) throw new TypeError(`${label} must be an integer`);
    if (value < minimum || value > maximum) {
      throw new RangeError(`${label} must be between ${minimum} and ${maximum}`);
    }
  }

  function assertTier(tier, label = "tier", maximum = FRUITS.length - 1) {
    assertInteger(tier, label, 0, maximum);
  }

  function normalizeSeed(seed) {
    if (!Number.isSafeInteger(seed)) throw new TypeError("seed must be an integer");
    return seed >>> 0;
  }

  function createRng(seed) {
    let state = normalizeSeed(seed);
    const random = function () {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
    Object.defineProperty(random, "getState", {
      value: () => state,
      enumerable: true
    });
    return Object.freeze(random);
  }

  function nextUnit(random) {
    if (typeof random !== "function") throw new TypeError("random must be a function");
    const value = random();
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError("random must return a number in [0, 1)");
    }
    return value;
  }

  function createSpawnBag(random) {
    if (typeof random !== "function") throw new TypeError("random must be a function");
    const bag = [];
    SPAWN_WEIGHTS.forEach((weight, tier) => {
      for (let count = 0; count < weight; count += 1) bag.push(tier);
    });
    for (let index = bag.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(nextUnit(random) * (index + 1));
      [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
    }
    return Object.freeze(bag);
  }

  function freezeQueueState(queue, bag, rngState, size) {
    return Object.freeze({
      queue: Object.freeze(queue),
      bag: Object.freeze(bag),
      rngState,
      size
    });
  }

  function assertQueueState(state) {
    assertRecord(state, "queue state");
    assertInteger(state.size, "queue state size", 1, 19);
    if (!Array.isArray(state.queue) || state.queue.length !== state.size) {
      throw new RangeError("queue state queue must match its size");
    }
    if (!Array.isArray(state.bag) || state.bag.length > 20) {
      throw new RangeError("queue state bag must contain at most 20 tiers");
    }
    for (let index = 0; index < state.queue.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(state.queue, index)) {
        throw new TypeError("queue state queue must be dense");
      }
      assertTier(state.queue[index], `queue state queue[${index}]`, 3);
    }
    for (let index = 0; index < state.bag.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(state.bag, index)) {
        throw new TypeError("queue state bag must be dense");
      }
      assertTier(state.bag[index], `queue state bag[${index}]`, 3);
    }
    assertInteger(state.rngState, "queue state rngState", 0, MAX_UINT32);
  }

  function createQueue(seed, size = 3) {
    assertInteger(size, "size", 1, 19);
    const random = createRng(seed);
    const bag = createSpawnBag(random).slice();

    for (let index = 0; index < size; index += 1) {
      if (bag[index] <= RULES.openingMaxTier) continue;
      const swapIndex = bag.findIndex((tier, candidate) => (
        candidate >= size && tier <= RULES.openingMaxTier
      ));
      [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
    }

    return freezeQueueState(
      bag.slice(0, size),
      bag.slice(size),
      random.getState(),
      size
    );
  }

  function peekQueue(state, offset = 0) {
    assertQueueState(state);
    assertInteger(offset, "offset", 0, state.size - 1);
    return state.queue[offset];
  }

  function takeNext(state) {
    assertQueueState(state);
    const queue = state.queue.slice();
    let bag = state.bag.slice();
    const tier = queue.shift();
    const random = createRng(state.rngState);

    while (queue.length < state.size) {
      if (bag.length === 0) bag = createSpawnBag(random).slice();
      queue.push(bag.shift());
    }

    return Object.freeze({
      tier,
      state: freezeQueueState(queue, bag, random.getState(), state.size)
    });
  }

  function freezeScoreState(score, combo, lastMergeAt, heartPips) {
    return Object.freeze({ score, combo, lastMergeAt, heartPips });
  }

  function createScoreState() {
    return freezeScoreState(0, 0, null, 0);
  }

  function assertScoreState(state) {
    assertRecord(state, "score state");
    assertFinite(state.score, "score state score", 0);
    assertInteger(state.combo, "score state combo", 0, COMBO_MULTIPLIERS.length);
    assertInteger(state.heartPips, "score state heartPips", 0, RULES.maxHeartPips);
    if (state.lastMergeAt !== null) assertFinite(state.lastMergeAt, "score state lastMergeAt", 0);
    if ((state.combo === 0) !== (state.lastMergeAt === null)) {
      throw new RangeError("score state combo and lastMergeAt are inconsistent");
    }
  }

  function normalizeMarks(marks) {
    if (marks === undefined) return [null, null];
    if (!Array.isArray(marks) || marks.length !== 2) {
      throw new TypeError("merge marks must contain exactly two values");
    }
    return [0, 1].map((index) => {
      if (!Object.prototype.hasOwnProperty.call(marks, index)) {
        throw new TypeError("merge marks must be dense");
      }
      const mark = marks[index];
      if (mark === null) return null;
      if (typeof mark !== "string" || mark.length === 0) {
        throw new TypeError(`merge marks[${index}] must be null or a non-empty string`);
      }
      return mark;
    });
  }

  function scoreMerge(state, merge) {
    assertScoreState(state);
    assertRecord(merge, "merge");
    assertTier(merge.tier, "merge tier");
    assertFinite(merge.timestamp, "merge timestamp", 0);
    const precise = merge.precise === undefined ? false : merge.precise;
    assertBoolean(precise, "merge precise");
    const marks = normalizeMarks(merge.marks);

    if (state.lastMergeAt !== null && merge.timestamp < state.lastMergeAt) {
      throw new RangeError("merge timestamp cannot move backwards");
    }

    const chained = state.lastMergeAt !== null
      && merge.timestamp - state.lastMergeAt <= RULES.comboWindowMs;
    const combo = chained ? Math.min(state.combo + 1, COMBO_MULTIPLIERS.length) : 1;
    const comboMultiplier = COMBO_MULTIPLIERS[combo - 1];
    const precisionMultiplier = precise ? RULES.precisionMultiplier : 1;
    const harvest = merge.tier === FRUITS.length - 1;
    const resultTier = harvest ? null : merge.tier + 1;
    const baseScore = harvest ? RULES.watermelonHarvestScore : FRUITS[resultTier].score;
    const points = baseScore * comboMultiplier * precisionMultiplier;
    const mixedMark = marks[0] !== null && marks[1] !== null && marks[0] !== marks[1];
    const heartPips = Math.min(
      RULES.maxHeartPips,
      state.heartPips + (mixedMark ? 1 : 0)
    );
    const nextScore = state.score + points;
    if (!Number.isFinite(nextScore)) throw new RangeError("score exceeds the supported range");
    const nextState = freezeScoreState(nextScore, combo, merge.timestamp, heartPips);

    return Object.freeze({
      state: nextState,
      points,
      baseScore,
      comboMultiplier,
      precisionMultiplier,
      resultTier,
      harvest,
      mixedMark,
      heartCharged: mixedMark && heartPips > state.heartPips,
      label: mixedMark ? RULES.mixedMergeLabel : null
    });
  }

  function ripenCurrent(state, tier, longPress) {
    assertScoreState(state);
    assertTier(tier);
    assertBoolean(longPress, "longPress");
    const ripened = longPress
      && state.heartPips === RULES.maxHeartPips
      && tier <= RULES.ripenMaxSourceTier;
    const nextState = freezeScoreState(
      state.score,
      state.combo,
      state.lastMergeAt,
      ripened ? 0 : state.heartPips
    );
    return Object.freeze({
      state: nextState,
      tier: ripened ? tier + 1 : tier,
      ripened,
      spentPips: ripened ? RULES.maxHeartPips : 0
    });
  }

  function assertContactState(contact, label = "contact state") {
    assertRecord(contact, label);
    assertBoolean(contact.touching, `${label} touching`);
    assertBoolean(contact.settled, `${label} settled`);
    assertFinite(contact.updatedAt, `${label} updatedAt`, 0);
    if (contact.touching) {
      assertFinite(contact.since, `${label} since`, 0);
      if (contact.since > contact.updatedAt) {
        throw new RangeError(`${label} since cannot be after updatedAt`);
      }
    } else if (contact.since !== null || contact.settled) {
      throw new RangeError(`${label} is inconsistent`);
    }
    if (contact.settled && !contact.touching) throw new RangeError(`${label} is inconsistent`);
  }

  function settleContact(previous, touching, timestamp, settleMs) {
    if (previous !== null) assertContactState(previous, "previous contact state");
    assertBoolean(touching, "touching");
    assertFinite(timestamp, "timestamp", 0);
    assertFinite(settleMs, "settleMs", 0);
    if (previous !== null && timestamp < previous.updatedAt) {
      throw new RangeError("contact timestamp cannot move backwards");
    }
    if (!touching) {
      return Object.freeze({ touching: false, since: null, updatedAt: timestamp, settled: false });
    }
    const since = previous !== null && previous.touching ? previous.since : timestamp;
    return Object.freeze({
      touching: true,
      since,
      updatedAt: timestamp,
      settled: timestamp - since >= settleMs
    });
  }

  function optionalBoolean(record, key) {
    if (record[key] === undefined) return false;
    assertBoolean(record[key], `danger candidate ${key}`);
    return record[key];
  }

  function isDangerEligible(candidate) {
    assertRecord(candidate, "danger candidate");
    assertBoolean(candidate.released, "danger candidate released");
    assertBoolean(candidate.aboveLine, "danger candidate aboveLine");
    const held = optionalBoolean(candidate, "held");
    const merging = optionalBoolean(candidate, "merging");
    const removed = optionalBoolean(candidate, "removed");
    if (candidate.contact !== null) assertContactState(candidate.contact, "danger candidate contact");
    return candidate.released
      && candidate.aboveLine
      && !held
      && !merging
      && !removed
      && candidate.contact !== null
      && candidate.contact.touching
      && candidate.contact.settled;
  }

  function safeClone(value, stack, depth, path) {
    if (depth > SNAPSHOT_MAX_DEPTH) throw new RangeError("snapshot exceeds the maximum depth");
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new TypeError(`${path} must contain only finite numbers`);
      return value;
    }
    if (typeof value !== "object") throw new TypeError(`${path} is not JSON-safe`);
    if (stack.has(value)) throw new TypeError("snapshot cannot contain cycles");
    stack.add(value);

    try {
      if (Array.isArray(value)) {
        if (Object.getOwnPropertySymbols(value).length > 0) {
          throw new TypeError(`${path} cannot contain symbol keys`);
        }
        const names = Object.getOwnPropertyNames(value);
        const expectedNames = new Set(["length"]);
        for (let index = 0; index < value.length; index += 1) expectedNames.add(String(index));
        if (names.length !== expectedNames.size || names.some((name) => !expectedNames.has(name))) {
          throw new TypeError(`${path} must be a dense array`);
        }
        const clone = Array.from({ length: value.length }, (_, index) => {
          const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
          if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
            throw new TypeError(`${path}[${index}] must be a data value`);
          }
          return safeClone(descriptor.value, stack, depth + 1, `${path}[${index}]`);
        });
        return Object.freeze(clone);
      }

      if (!isRecord(value)) throw new TypeError(`${path} must contain only plain objects`);
      if (Object.getOwnPropertySymbols(value).length > 0) {
        throw new TypeError(`${path} cannot contain symbol keys`);
      }
      const keys = Object.keys(value);
      if (Object.getOwnPropertyNames(value).length !== keys.length) {
        throw new TypeError(`${path} cannot contain hidden properties`);
      }
      const clone = {};
      keys.forEach((key) => {
        if (UNSAFE_KEYS.has(key)) throw new TypeError(`${path} contains an unsafe key`);
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !("value" in descriptor)) {
          throw new TypeError(`${path}.${key} must be a data value`);
        }
        clone[key] = safeClone(descriptor.value, stack, depth + 1, `${path}.${key}`);
      });
      return Object.freeze(clone);
    } finally {
      stack.delete(value);
    }
  }

  function serializeSnapshot(value) {
    return JSON.stringify(safeClone(value, new WeakSet(), 0, "snapshot"));
  }

  function parseSnapshot(serialized) {
    if (typeof serialized !== "string") throw new TypeError("serialized snapshot must be a string");
    return safeClone(JSON.parse(serialized), new WeakSet(), 0, "snapshot");
  }

  return Object.freeze({
    FRUITS,
    RULES,
    createRng,
    createSpawnBag,
    createQueue,
    peekQueue,
    takeNext,
    createScoreState,
    scoreMerge,
    ripenCurrent,
    settleContact,
    isDangerEligible,
    serializeSnapshot,
    parseSnapshot
  });
});
