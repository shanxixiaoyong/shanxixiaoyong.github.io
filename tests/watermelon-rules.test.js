const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const rules = require("../assets/watermelon-rules.js");
const {
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
} = rules;

function collectQueue(seed, count, size = 3) {
  let state = createQueue(seed, size);
  const tiers = [];
  for (let index = 0; index < count; index += 1) {
    const next = takeNext(state);
    tiers.push(next.tier);
    state = next.state;
  }
  return { tiers, state };
}

function fullHeartState() {
  let state = createScoreState();
  for (let index = 0; index < 3; index += 1) {
    state = scoreMerge(state, {
      tier: 0,
      timestamp: index * 100,
      marks: ["rose", "star"]
    }).state;
  }
  return state;
}

test("exports the exact immutable eleven-tier fruit catalog", () => {
  assert.equal(RULES.title, "合成大西瓜");
  assert.deepEqual(FRUITS.map((fruit) => fruit.name), [
    "蓝莓", "樱桃", "草莓", "葡萄", "橘子", "苹果", "梨", "桃子", "菠萝", "哈密瓜", "西瓜"
  ]);
  assert.deepEqual(FRUITS.map((fruit) => fruit.radius), [13, 17, 22, 27, 33, 40, 48, 57, 66, 76, 86]);
  assert.deepEqual(FRUITS.map((fruit) => fruit.score), [0, 10, 25, 45, 70, 110, 170, 260, 400, 650, 1000]);
  assert.deepEqual(FRUITS.map((fruit) => fruit.tier), Array.from({ length: 11 }, (_, tier) => tier));
  assert.ok(Object.isFrozen(rules));
  assert.ok(Object.isFrozen(FRUITS));
  assert.ok(FRUITS.every(Object.isFrozen));
  assert.ok(Object.isFrozen(RULES));
  assert.ok(Object.isFrozen(RULES.spawnWeights));
  assert.ok(Object.isFrozen(RULES.comboMultipliers));
});

test("loads as a browser global without CommonJS", () => {
  const source = readFileSync(path.join(__dirname, "../assets/watermelon-rules.js"), "utf8");
  const browser = {};
  vm.runInNewContext(source, browser, { filename: "watermelon-rules.js" });

  assert.equal(browser.WatermelonRules.RULES.title, "合成大西瓜");
  assert.equal(browser.WatermelonRules.FRUITS.length, 11);
  assert.equal(typeof browser.WatermelonRules.scoreMerge, "function");
});

test("seeded RNG is deterministic, resumable, and bounded", () => {
  const first = createRng(20260710);
  const second = createRng(20260710);
  const other = createRng(20260711);
  const firstSequence = Array.from({ length: 12 }, () => first());
  const secondSequence = Array.from({ length: 12 }, () => second());
  const otherSequence = Array.from({ length: 12 }, () => other());

  assert.deepEqual(firstSequence, secondSequence);
  assert.notDeepEqual(firstSequence, otherSequence);
  assert.ok(firstSequence.every((value) => value >= 0 && value < 1));

  const resumable = createRng(-7);
  resumable();
  resumable();
  const savedState = resumable.getState();
  const expectedNext = resumable();
  assert.equal(createRng(savedState)(), expectedNext);
  assert.ok(Object.isFrozen(resumable));
});

test("seeded RNG and bag generation reject invalid randomness", () => {
  assert.throws(() => createRng(1.5), TypeError);
  assert.throws(() => createRng("1"), TypeError);
  assert.throws(() => createRng(Number.MAX_VALUE), TypeError);
  assert.throws(() => createSpawnBag(), TypeError);
  assert.throws(() => createSpawnBag(() => 1), RangeError);
  assert.throws(() => createSpawnBag(() => -0.01), RangeError);
  assert.throws(() => createSpawnBag(() => NaN), RangeError);
});

test("spawn bags are deterministic shuffled copies with exact weights", () => {
  const first = createSpawnBag(createRng(51));
  const second = createSpawnBag(createRng(51));
  const other = createSpawnBag(createRng(52));
  const counts = first.reduce((totals, tier) => {
    totals[tier] += 1;
    return totals;
  }, [0, 0, 0, 0]);

  assert.deepEqual(counts, [10, 6, 3, 1]);
  assert.deepEqual(first, second);
  assert.notDeepEqual(first, other);
  assert.ok(Object.isFrozen(first));
});

test("opening queues exclude tier three while preserving the first bag weights", () => {
  for (let seed = 0; seed < 100; seed += 1) {
    assert.ok(createQueue(seed).queue.every((tier) => tier <= 2));
  }

  const opening = createQueue(84);
  const original = JSON.parse(JSON.stringify(opening));
  const { tiers, state } = collectQueue(84, 20);
  const counts = tiers.reduce((totals, tier) => {
    totals[tier] += 1;
    return totals;
  }, [0, 0, 0, 0]);

  assert.deepEqual(counts, [10, 6, 3, 1]);
  assert.deepEqual(opening, original);
  assert.ok(Object.isFrozen(opening));
  assert.ok(Object.isFrozen(opening.queue));
  assert.ok(Object.isFrozen(opening.bag));
  assert.ok(Object.isFrozen(state));
});

test("queue helpers peek, advance, refill, and replay deterministically", () => {
  const initial = createQueue(90210, 4);
  const before = JSON.parse(JSON.stringify(initial));
  const next = takeNext(initial);

  assert.equal(next.tier, peekQueue(initial));
  assert.equal(peekQueue(initial, 3), initial.queue[3]);
  assert.equal(next.state.queue.length, 4);
  assert.deepEqual(initial, before);
  assert.notStrictEqual(next.state, initial);
  assert.notStrictEqual(next.state.queue, initial.queue);
  assert.deepEqual(collectQueue(90210, 80, 4).tiers, collectQueue(90210, 80, 4).tiers);
  assert.notDeepEqual(collectQueue(90210, 80, 4).tiers, collectQueue(90211, 80, 4).tiers);
});

test("queue helpers reject malformed state and invalid sizes or offsets", () => {
  const valid = createQueue(3);
  const sparseQueue = { ...valid, queue: Array(valid.size) };
  const sparseBag = { ...valid, bag: Array(1) };
  assert.throws(() => createQueue("3"), TypeError);
  assert.throws(() => createQueue(3, 0), RangeError);
  assert.throws(() => createQueue(3, 20), RangeError);
  assert.throws(() => peekQueue(valid, -1), RangeError);
  assert.throws(() => peekQueue(valid, 3), RangeError);
  assert.throws(() => peekQueue(valid, 0.5), TypeError);
  assert.throws(() => takeNext(null), TypeError);
  assert.throws(() => takeNext({ ...valid, rngState: -1 }), RangeError);
  assert.throws(() => takeNext({ ...valid, queue: [0] }), RangeError);
  assert.throws(() => takeNext({ ...valid, bag: [4] }), RangeError);
  assert.throws(() => takeNext(sparseQueue), TypeError);
  assert.throws(() => takeNext(sparseBag), TypeError);
});

test("every ordinary tier scores from the resulting fruit and watermelons harvest 2500", () => {
  const expected = [10, 25, 45, 70, 110, 170, 260, 400, 650, 1000];
  expected.forEach((points, tier) => {
    const result = scoreMerge(createScoreState(), { tier, timestamp: 0 });
    assert.equal(result.points, points);
    assert.equal(result.baseScore, points);
    assert.equal(result.resultTier, tier + 1);
    assert.equal(result.harvest, false);
  });

  const harvest = scoreMerge(createScoreState(), { tier: 10, timestamp: 0 });
  assert.equal(harvest.points, 2500);
  assert.equal(harvest.baseScore, 2500);
  assert.equal(harvest.resultTier, null);
  assert.equal(harvest.harvest, true);
});

test("combo scoring uses the inclusive one-second window and caps at 3x", () => {
  let state = createScoreState();
  const multipliers = [];
  const points = [];
  for (const timestamp of [0, 200, 400, 600, 800, 1000]) {
    const result = scoreMerge(state, { tier: 0, timestamp });
    multipliers.push(result.comboMultiplier);
    points.push(result.points);
    state = result.state;
  }

  assert.deepEqual(multipliers, [1, 1.5, 2, 2.5, 3, 3]);
  assert.deepEqual(points, [10, 15, 20, 25, 30, 30]);
  assert.equal(state.combo, 5);

  const exactStart = scoreMerge(createScoreState(), { tier: 0, timestamp: 50 });
  const exactBoundary = scoreMerge(exactStart.state, { tier: 0, timestamp: 1050 });
  const expired = scoreMerge(exactBoundary.state, { tier: 0, timestamp: 2050.001 });
  assert.equal(exactBoundary.comboMultiplier, 1.5);
  assert.equal(expired.comboMultiplier, 1);
  assert.equal(expired.state.combo, 1);
});

test("precision multiplies by 1.25 and mixed marks charge hearts up to three", () => {
  const input = createScoreState();
  const precise = scoreMerge(input, {
    tier: 0,
    timestamp: 0,
    precise: true,
    marks: ["rose", "star"]
  });

  assert.equal(precise.points, 12.5);
  assert.equal(precise.precisionMultiplier, 1.25);
  assert.equal(precise.mixedMark, true);
  assert.equal(precise.heartCharged, true);
  assert.equal(precise.label, "默契合成");
  assert.equal(precise.state.heartPips, 1);
  assert.deepEqual(input, createScoreState());

  const sameMark = scoreMerge(precise.state, {
    tier: 0,
    timestamp: 100,
    marks: ["rose", "rose"]
  });
  assert.equal(sameMark.mixedMark, false);
  assert.equal(sameMark.heartCharged, false);
  assert.equal(sameMark.state.heartPips, 1);

  let state = sameMark.state;
  for (const timestamp of [200, 300, 400]) {
    state = scoreMerge(state, {
      tier: 0,
      timestamp,
      marks: ["rose", "star"]
    }).state;
  }
  const capped = scoreMerge(state, {
    tier: 0,
    timestamp: 500,
    marks: ["rose", "star"]
  });
  assert.equal(state.heartPips, 3);
  assert.equal(capped.state.heartPips, 3);
  assert.equal(capped.heartCharged, false);
  assert.ok(Object.isFrozen(capped));
  assert.ok(Object.isFrozen(capped.state));

  const boostedHarvest = scoreMerge(createScoreState(), {
    tier: 10,
    timestamp: 0,
    precise: true
  });
  assert.equal(boostedHarvest.points, 3125);
});

test("merge scoring rejects malformed state, events, and backwards time", () => {
  const started = scoreMerge(createScoreState(), { tier: 0, timestamp: 100 }).state;
  assert.throws(() => scoreMerge({}, { tier: 0, timestamp: 0 }), TypeError);
  assert.throws(() => scoreMerge({ score: 0, combo: 1, lastMergeAt: null, heartPips: 0 }, { tier: 0, timestamp: 0 }), RangeError);
  assert.throws(() => scoreMerge({ score: 0, combo: 0, lastMergeAt: null, heartPips: 4 }, { tier: 0, timestamp: 0 }), RangeError);
  assert.throws(() => scoreMerge(createScoreState(), null), TypeError);
  assert.throws(() => scoreMerge(createScoreState(), { tier: -1, timestamp: 0 }), RangeError);
  assert.throws(() => scoreMerge(createScoreState(), { tier: 11, timestamp: 0 }), RangeError);
  assert.throws(() => scoreMerge(createScoreState(), { tier: 1.5, timestamp: 0 }), TypeError);
  assert.throws(() => scoreMerge(createScoreState(), { tier: 0, timestamp: NaN }), TypeError);
  assert.throws(() => scoreMerge(started, { tier: 0, timestamp: 99 }), RangeError);
  assert.throws(() => scoreMerge(createScoreState(), { tier: 0, timestamp: 0, precise: 1 }), TypeError);
  assert.throws(() => scoreMerge(createScoreState(), { tier: 0, timestamp: 0, marks: ["rose"] }), TypeError);
  assert.throws(() => scoreMerge(createScoreState(), { tier: 0, timestamp: 0, marks: Array(2) }), TypeError);
  assert.throws(() => scoreMerge(createScoreState(), { tier: 0, timestamp: 0, marks: ["rose", ""] }), TypeError);
  assert.throws(() => scoreMerge(createScoreState(), { tier: 0, timestamp: 0, marks: ["rose", 2] }), TypeError);
});

test("a full-heart long press ripens only source tiers zero through three", () => {
  const charged = fullHeartState();
  const original = JSON.parse(JSON.stringify(charged));
  const ripened = ripenCurrent(charged, 3, true);

  assert.equal(ripened.ripened, true);
  assert.equal(ripened.tier, 4);
  assert.equal(ripened.spentPips, 3);
  assert.equal(ripened.state.heartPips, 0);
  assert.deepEqual(charged, original);

  const tooLarge = ripenCurrent(charged, 4, true);
  assert.equal(tooLarge.ripened, false);
  assert.equal(tooLarge.tier, 4);
  assert.equal(tooLarge.state.heartPips, 3);

  const shortPress = ripenCurrent(charged, 1, false);
  assert.equal(shortPress.ripened, false);
  assert.equal(shortPress.state.heartPips, 3);

  const twoPips = scoreMerge(
    scoreMerge(createScoreState(), { tier: 0, timestamp: 0, marks: ["a", "b"] }).state,
    { tier: 0, timestamp: 1, marks: ["a", "b"] }
  ).state;
  assert.equal(ripenCurrent(twoPips, 1, true).ripened, false);
});

test("ripening rejects invalid tiers, state, and gesture flags", () => {
  assert.throws(() => ripenCurrent({}, 0, true), TypeError);
  assert.throws(() => ripenCurrent(createScoreState(), -1, true), RangeError);
  assert.throws(() => ripenCurrent(createScoreState(), 11, true), RangeError);
  assert.throws(() => ripenCurrent(createScoreState(), 0, "yes"), TypeError);
});

test("contact settling requires continuous contact for the requested duration", () => {
  const started = settleContact(null, true, 100, 250);
  const waiting = settleContact(started, true, 349, 250);
  const settled = settleContact(waiting, true, 350, 250);
  const ended = settleContact(settled, false, 351, 250);

  assert.deepEqual(started, { touching: true, since: 100, updatedAt: 100, settled: false });
  assert.equal(waiting.settled, false);
  assert.equal(settled.settled, true);
  assert.deepEqual(ended, { touching: false, since: null, updatedAt: 351, settled: false });
  assert.equal(settleContact(null, true, 20, 0).settled, true);
  assert.ok(Object.isFrozen(settled));
  assert.equal(started.updatedAt, 100);
});

test("danger requires a released, settled contact above the line", () => {
  const contact = settleContact(settleContact(null, true, 0, 100), true, 100, 100);
  const eligible = {
    released: true,
    aboveLine: true,
    held: false,
    merging: false,
    removed: false,
    contact
  };

  assert.equal(isDangerEligible(eligible), true);
  for (const override of [
    { released: false },
    { aboveLine: false },
    { held: true },
    { merging: true },
    { removed: true },
    { contact: settleContact(null, true, 100, 100) },
    { contact: null }
  ]) {
    assert.equal(isDangerEligible({ ...eligible, ...override }), false);
  }
});

test("contact and danger helpers reject invalid temporal or flag inputs", () => {
  const started = settleContact(null, true, 100, 20);
  assert.throws(() => settleContact({}, true, 100, 20), TypeError);
  assert.throws(() => settleContact(null, 1, 100, 20), TypeError);
  assert.throws(() => settleContact(null, true, -1, 20), RangeError);
  assert.throws(() => settleContact(null, true, 1, -1), RangeError);
  assert.throws(() => settleContact(started, true, 99, 20), RangeError);
  assert.throws(() => isDangerEligible(null), TypeError);
  assert.throws(() => isDangerEligible({ released: true, aboveLine: "yes", contact: null }), TypeError);
  assert.throws(() => isDangerEligible({ released: true, aboveLine: true, held: 0, contact: null }), TypeError);
  assert.throws(() => isDangerEligible({ released: true, aboveLine: true, contact: {} }), TypeError);
});

test("safe snapshots round-trip queue, score, and physics data without aliases", () => {
  const snapshot = {
    queue: createQueue(71),
    score: fullHeartState(),
    bodies: [
      { id: "fruit-1", tier: 2, x: 101.25, y: 84, mark: "rose" },
      { id: "fruit-2", tier: 2, x: 121.5, y: 84, mark: "star" }
    ]
  };
  const serialized = serializeSnapshot(snapshot);
  const restored = parseSnapshot(serialized);

  assert.deepEqual(restored, snapshot);
  assert.notStrictEqual(restored, snapshot);
  assert.notStrictEqual(restored.queue, snapshot.queue);
  assert.ok(Object.isFrozen(restored));
  assert.ok(Object.isFrozen(restored.queue));
  assert.ok(Object.isFrozen(restored.queue.queue));
  assert.ok(Object.isFrozen(restored.bodies));
  assert.ok(Object.isFrozen(restored.bodies[0]));
  assert.deepEqual(takeNext(restored.queue), takeNext(snapshot.queue));

  const mutable = { nested: { value: 1 } };
  const captured = serializeSnapshot(mutable);
  mutable.nested.value = 2;
  assert.equal(parseSnapshot(captured).nested.value, 1);
});

test("safe snapshots reject lossy, executable, cyclic, and pollution-prone values", () => {
  const cycle = {};
  cycle.self = cycle;
  const sparse = [];
  sparse[1] = "gap";
  const disguisedSparse = [];
  disguisedSparse.length = 2;
  disguisedSparse[1] = "gap";
  disguisedSparse.extra = "not an index";
  const accessor = {};
  Object.defineProperty(accessor, "value", { enumerable: true, get: () => 1 });
  const symbolKey = { value: 1 };
  symbolKey[Symbol("hidden")] = 2;

  assert.throws(() => serializeSnapshot(undefined), TypeError);
  assert.throws(() => serializeSnapshot({ value: NaN }), TypeError);
  assert.throws(() => serializeSnapshot({ value: Infinity }), TypeError);
  assert.throws(() => serializeSnapshot({ value: 1n }), TypeError);
  assert.throws(() => serializeSnapshot({ value: () => 1 }), TypeError);
  assert.throws(() => serializeSnapshot(new Date()), TypeError);
  assert.throws(() => serializeSnapshot(cycle), TypeError);
  assert.throws(() => serializeSnapshot(sparse), TypeError);
  assert.throws(() => serializeSnapshot(disguisedSparse), TypeError);
  assert.throws(() => serializeSnapshot(accessor), TypeError);
  assert.throws(() => serializeSnapshot(symbolKey), TypeError);
  assert.throws(() => serializeSnapshot(JSON.parse('{"__proto__":{"polluted":true}}')), TypeError);
  assert.throws(() => parseSnapshot('{"constructor":{"prototype":{"polluted":true}}}'), TypeError);
  assert.throws(() => parseSnapshot("{"), SyntaxError);
  assert.throws(() => parseSnapshot(null), TypeError);
  assert.equal({}.polluted, undefined);
});
