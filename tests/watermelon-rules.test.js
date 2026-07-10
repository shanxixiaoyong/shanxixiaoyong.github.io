const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const rules = require("../assets/watermelon-rules.js");
const {
  MOMENTS,
  RESPONSE_MARKS,
  EVENT_CATALOGS,
  SCENES,
  RULES,
  createRng,
  createSpawnBag,
  createQueue,
  peekQueue,
  takeNext,
  createScoreState,
  scoreMerge,
  useCourage,
  pickCatalogEvent,
  pickUnlockEvent,
  pickMergeReward,
  pickSecretCombination,
  sceneForTier,
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

function fullCourageState() {
  let state = createScoreState();
  for (let index = 0; index < RULES.maxCourage; index += 1) {
    state = scoreMerge(state, {
      tier: 0,
      timestamp: index * 100,
      marks: ["self", "echo"]
    }).state;
  }
  return state;
}

test("exports an immutable eleven-tier romantic moment chain", () => {
  assert.equal(RULES.title, "心动大西瓜");
  assert.deepEqual(MOMENTS.map((moment) => moment.name), [
    "初见余光",
    "聊天回声",
    "慢慢靠近",
    "同频耳机",
    "电影票根",
    "约会留影",
    "十指相扣",
    "拥抱余温",
    "认真告白",
    "两人的私藏",
    "只给彼此的夜"
  ]);
  assert.deepEqual(MOMENTS.map((moment) => moment.radius), [13, 17, 22, 27, 33, 40, 48, 57, 66, 76, 86]);
  assert.deepEqual(MOMENTS.map((moment) => moment.score), [0, 10, 25, 45, 70, 110, 170, 260, 400, 650, 1000]);
  assert.deepEqual(MOMENTS.map((moment) => moment.tier), Array.from({ length: 11 }, (_, tier) => tier));

  for (const key of ["id", "model", "material", "mergeBehavior", "effect"]) {
    assert.equal(new Set(MOMENTS.map((moment) => moment[key])).size, MOMENTS.length, `${key} must be tier-specific`);
  }
  assert.equal(new Set(MOMENTS.map((moment) => JSON.stringify(moment.physics))).size, MOMENTS.length);
  assert.ok(MOMENTS.every((moment) => moment.palette.length === 3));
  assert.ok(MOMENTS.every((moment) => Object.isFrozen(moment)));
  assert.ok(MOMENTS.every((moment) => Object.isFrozen(moment.palette)));
  assert.ok(MOMENTS.every((moment) => Object.isFrozen(moment.physics)));
  assert.ok(Object.isFrozen(rules));
  assert.ok(Object.isFrozen(MOMENTS));
  assert.ok(Object.isFrozen(RULES));
});

test("defines complementary single-player response marks", () => {
  assert.deepEqual(RESPONSE_MARKS.map((mark) => mark.id), ["self", "echo"]);
  assert.deepEqual(RESPONSE_MARKS.map((mark) => mark.label), ["我的心音", "你的回音"]);
  assert.equal(new Set(RESPONSE_MARKS.map((mark) => mark.color)).size, 2);
  assert.ok(Object.isFrozen(RESPONSE_MARKS));
  assert.ok(RESPONSE_MARKS.every(Object.isFrozen));
});

test("provides meaningful randomized unlock, repeat, and secret catalogs", () => {
  assert.equal(EVENT_CATALOGS.unlocks.length, MOMENTS.length);
  assert.equal(EVENT_CATALOGS.mergeRewards.length, MOMENTS.length);
  assert.deepEqual(EVENT_CATALOGS.unlocks.map((events) => events[0].performance), [
    "glance", "chat", "approach", "earbuds", "ticket", "photo",
    "hands", "embrace", "confession", "memory", "secret"
  ]);
  assert.ok(EVENT_CATALOGS.unlocks.every((events) => events.length >= 2));
  assert.ok(EVENT_CATALOGS.mergeRewards.every((events) => events.length >= 3));
  assert.ok(EVENT_CATALOGS.secretCombinations.length >= 5);

  const everyEvent = [
    ...EVENT_CATALOGS.unlocks.flat(),
    ...EVENT_CATALOGS.mergeRewards.flat(),
    ...EVENT_CATALOGS.secretCombinations
  ];
  assert.equal(new Set(everyEvent.map((event) => event.id)).size, everyEvent.length);
  assert.ok(EVENT_CATALOGS.unlocks.flat().every((event) => event.title.length >= 5 && event.line.length >= 18));
  assert.ok(EVENT_CATALOGS.mergeRewards.flat().every((event) => event.copy.length >= 9));
  assert.ok(EVENT_CATALOGS.secretCombinations.every((event) => (
    event.performance.startsWith("secret-") && event.title.length >= 6 && event.line.length >= 18
  )));
  assert.ok(Object.isFrozen(EVENT_CATALOGS));
  assert.ok(EVENT_CATALOGS.unlocks.every(Object.isFrozen));
  assert.ok(EVENT_CATALOGS.unlocks.flat().every(Object.isFrozen));
});

test("loads as a browser global without CommonJS", () => {
  const source = readFileSync(path.join(__dirname, "../assets/watermelon-rules.js"), "utf8");
  const browser = {};
  vm.runInNewContext(source, browser, { filename: "watermelon-rules.js" });

  assert.equal(browser.WatermelonRules.RULES.title, "心动大西瓜");
  assert.equal(browser.WatermelonRules.MOMENTS.length, 11);
  assert.equal(typeof browser.WatermelonRules.pickSecretCombination, "function");
});

test("seeded RNG is deterministic, resumable, and bounded", () => {
  const first = createRng(20260711);
  const second = createRng(20260711);
  const other = createRng(20260712);
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

test("catalog selection is deterministic and avoids immediate repeats", () => {
  const firstRandom = createRng(77);
  const secondRandom = createRng(77);
  const firstSequence = [];
  const secondSequence = [];
  let previousFirst = null;
  let previousSecond = null;

  for (let index = 0; index < 24; index += 1) {
    const first = pickSecretCombination(firstRandom, previousFirst);
    const second = pickSecretCombination(secondRandom, previousSecond);
    firstSequence.push(first.id);
    secondSequence.push(second.id);
    assert.notEqual(first.id, previousFirst);
    previousFirst = first.id;
    previousSecond = second.id;
  }
  assert.deepEqual(firstSequence, secondSequence);
  assert.ok(new Set(firstSequence).size >= 4);

  const catalog = EVENT_CATALOGS.mergeRewards[3];
  assert.equal(pickCatalogEvent(catalog, () => 0, catalog[0].id).id, catalog[1].id);
  assert.ok(EVENT_CATALOGS.unlocks[6].includes(pickUnlockEvent(6, createRng(3))));
  assert.ok(EVENT_CATALOGS.mergeRewards[8].includes(pickMergeReward(8, createRng(4))));
});

test("catalog selection rejects malformed catalogs and random sources", () => {
  const duplicate = [{ id: "same" }, { id: "same" }];
  const sparse = [];
  sparse[1] = { id: "gap" };
  assert.throws(() => pickCatalogEvent([], Math.random), TypeError);
  assert.throws(() => pickCatalogEvent([null], Math.random), TypeError);
  assert.throws(() => pickCatalogEvent([{ id: "" }], Math.random), TypeError);
  assert.throws(() => pickCatalogEvent(duplicate, Math.random), RangeError);
  assert.throws(() => pickCatalogEvent(sparse, Math.random), TypeError);
  assert.throws(() => pickCatalogEvent([{ id: "a" }], () => 1), RangeError);
  assert.throws(() => pickCatalogEvent([{ id: "a" }], Math.random, ""), TypeError);
  assert.throws(() => pickUnlockEvent(11, Math.random), RangeError);
});

test("scene chapters evolve with intimacy tiers", () => {
  assert.deepEqual(SCENES.map((scene) => scene.id), ["platform", "walk", "cinema", "rain", "room", "midnight"]);
  assert.deepEqual(Array.from({ length: 11 }, (_, tier) => sceneForTier(tier).id), [
    "platform", "platform", "walk", "walk", "cinema", "cinema",
    "rain", "rain", "room", "room", "midnight"
  ]);
  assert.ok(SCENES.every((scene) => Object.isFrozen(scene) && Object.isFrozen(scene.palette)));
  assert.throws(() => sceneForTier(-1), RangeError);
  assert.throws(() => sceneForTier(1.5), TypeError);
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

test("opening queues stay approachable and replay deterministically", () => {
  for (let seed = 0; seed < 100; seed += 1) {
    assert.ok(createQueue(seed).queue.every((tier) => tier <= RULES.openingMaxTier));
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
  assert.equal(peekQueue(opening), opening.queue[0]);
  assert.deepEqual(collectQueue(90210, 80, 4).tiers, collectQueue(90210, 80, 4).tiers);
  assert.notDeepEqual(collectQueue(90210, 80, 4).tiers, collectQueue(90211, 80, 4).tiers);
  assert.ok(Object.isFrozen(state));
});

test("queue helpers reject malformed state and invalid sizes or offsets", () => {
  const valid = createQueue(3);
  const sparseQueue = { ...valid, queue: Array(valid.size) };
  const sparseBag = { ...valid, bag: Array(1) };
  assert.throws(() => createRng(1.5), TypeError);
  assert.throws(() => createSpawnBag(() => NaN), RangeError);
  assert.throws(() => createQueue("3"), TypeError);
  assert.throws(() => createQueue(3, 0), RangeError);
  assert.throws(() => createQueue(3, 20), RangeError);
  assert.throws(() => peekQueue(valid, -1), RangeError);
  assert.throws(() => peekQueue(valid, 3), RangeError);
  assert.throws(() => takeNext({ ...valid, rngState: -1 }), RangeError);
  assert.throws(() => takeNext({ ...valid, bag: [4] }), RangeError);
  assert.throws(() => takeNext(sparseQueue), TypeError);
  assert.throws(() => takeNext(sparseBag), TypeError);
});

test("ordinary merges score the resulting moment and top-tier pairs form a secret", () => {
  const expected = [10, 25, 45, 70, 110, 170, 260, 400, 650, 1000];
  expected.forEach((points, tier) => {
    const result = scoreMerge(createScoreState(), { tier, timestamp: 0 });
    assert.equal(result.points, points);
    assert.equal(result.baseScore, points);
    assert.equal(result.resultTier, tier + 1);
    assert.equal(result.secretCombination, false);
  });

  const secret = scoreMerge(createScoreState(), { tier: 10, timestamp: 0 });
  assert.equal(secret.points, RULES.secretCombinationScore);
  assert.equal(secret.baseScore, RULES.secretCombinationScore);
  assert.equal(secret.resultTier, null);
  assert.equal(secret.secretCombination, true);
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
});

test("precise mutual responses charge courage up to three", () => {
  const input = createScoreState();
  const precise = scoreMerge(input, {
    tier: 0,
    timestamp: 0,
    precise: true,
    marks: ["self", "echo"]
  });

  assert.equal(precise.points, 12.5);
  assert.equal(precise.precisionMultiplier, 1.25);
  assert.equal(precise.mutualResponse, true);
  assert.equal(precise.courageCharged, true);
  assert.equal(precise.label, "彼此回应");
  assert.equal(precise.state.courage, 1);
  assert.deepEqual(input, createScoreState());

  const sameMark = scoreMerge(precise.state, {
    tier: 0,
    timestamp: 100,
    marks: ["self", "self"]
  });
  assert.equal(sameMark.mutualResponse, false);
  assert.equal(sameMark.courageCharged, false);
  assert.equal(sameMark.state.courage, 1);

  let state = sameMark.state;
  for (const timestamp of [200, 300, 400, 500]) {
    state = scoreMerge(state, { tier: 0, timestamp, marks: ["self", "echo"] }).state;
  }
  assert.equal(state.courage, RULES.maxCourage);
  assert.ok(Object.isFrozen(state));
});

test("merge scoring rejects malformed state, events, and backwards time", () => {
  const started = scoreMerge(createScoreState(), { tier: 0, timestamp: 100 }).state;
  assert.throws(() => scoreMerge({}, { tier: 0, timestamp: 0 }), TypeError);
  assert.throws(() => scoreMerge({ score: 0, combo: 1, lastMergeAt: null, courage: 0 }, { tier: 0, timestamp: 0 }), RangeError);
  assert.throws(() => scoreMerge({ score: 0, combo: 0, lastMergeAt: null, courage: 4 }, { tier: 0, timestamp: 0 }), RangeError);
  assert.throws(() => scoreMerge(createScoreState(), { tier: -1, timestamp: 0 }), RangeError);
  assert.throws(() => scoreMerge(createScoreState(), { tier: 11, timestamp: 0 }), RangeError);
  assert.throws(() => scoreMerge(createScoreState(), { tier: 0, timestamp: NaN }), TypeError);
  assert.throws(() => scoreMerge(started, { tier: 0, timestamp: 99 }), RangeError);
  assert.throws(() => scoreMerge(createScoreState(), { tier: 0, timestamp: 0, precise: 1 }), TypeError);
  assert.throws(() => scoreMerge(createScoreState(), { tier: 0, timestamp: 0, marks: ["self"] }), TypeError);
  assert.throws(() => scoreMerge(createScoreState(), { tier: 0, timestamp: 0, marks: Array(2) }), TypeError);
});

test("a full-courage long press advances only source tiers zero through three", () => {
  const charged = fullCourageState();
  const original = JSON.parse(JSON.stringify(charged));
  const advanced = useCourage(charged, 3, true);

  assert.equal(advanced.advanced, true);
  assert.equal(advanced.tier, 4);
  assert.equal(advanced.spentCourage, RULES.maxCourage);
  assert.equal(advanced.state.courage, 0);
  assert.deepEqual(charged, original);

  const tooLarge = useCourage(charged, 4, true);
  assert.equal(tooLarge.advanced, false);
  assert.equal(tooLarge.state.courage, RULES.maxCourage);
  assert.equal(useCourage(charged, 1, false).advanced, false);

  const twoBeats = scoreMerge(
    scoreMerge(createScoreState(), { tier: 0, timestamp: 0, marks: ["self", "echo"] }).state,
    { tier: 0, timestamp: 1, marks: ["self", "echo"] }
  ).state;
  assert.equal(useCourage(twoBeats, 1, true).advanced, false);
  assert.throws(() => useCourage(createScoreState(), 0, "yes"), TypeError);
});

test("contact settling and overflow eligibility require stable physical contact", () => {
  const started = settleContact(null, true, 100, 250);
  const waiting = settleContact(started, true, 349, 250);
  const settled = settleContact(waiting, true, 350, 250);
  const ended = settleContact(settled, false, 351, 250);

  assert.equal(waiting.settled, false);
  assert.equal(settled.settled, true);
  assert.deepEqual(ended, { touching: false, since: null, updatedAt: 351, settled: false });
  const eligible = { released: true, aboveLine: true, held: false, merging: false, removed: false, contact: settled };
  assert.equal(isDangerEligible(eligible), true);
  for (const override of [
    { released: false }, { aboveLine: false }, { held: true },
    { merging: true }, { removed: true }, { contact: started }, { contact: null }
  ]) {
    assert.equal(isDangerEligible({ ...eligible, ...override }), false);
  }
  assert.throws(() => settleContact(started, true, 99, 20), RangeError);
  assert.throws(() => isDangerEligible(null), TypeError);
});

test("safe snapshots round-trip queue, courage, and moment bodies without aliases", () => {
  const snapshot = {
    queue: createQueue(71),
    score: fullCourageState(),
    bodies: [
      { id: "moment-1", tier: 2, x: 101.25, y: 84, mark: "self" },
      { id: "moment-2", tier: 2, x: 121.5, y: 84, mark: "echo" }
    ]
  };
  const serialized = serializeSnapshot(snapshot);
  const restored = parseSnapshot(serialized);

  assert.deepEqual(restored, snapshot);
  assert.notStrictEqual(restored, snapshot);
  assert.notStrictEqual(restored.queue, snapshot.queue);
  assert.ok(Object.isFrozen(restored));
  assert.ok(Object.isFrozen(restored.queue.queue));
  assert.ok(Object.isFrozen(restored.bodies[0]));
  assert.deepEqual(takeNext(restored.queue), takeNext(snapshot.queue));
});

test("safe snapshots reject lossy, executable, cyclic, and pollution-prone values", () => {
  const cycle = {};
  cycle.self = cycle;
  const sparse = [];
  sparse[1] = "gap";
  const accessor = {};
  Object.defineProperty(accessor, "value", { enumerable: true, get: () => 1 });

  assert.throws(() => serializeSnapshot(undefined), TypeError);
  assert.throws(() => serializeSnapshot({ value: NaN }), TypeError);
  assert.throws(() => serializeSnapshot({ value: Infinity }), TypeError);
  assert.throws(() => serializeSnapshot({ value: 1n }), TypeError);
  assert.throws(() => serializeSnapshot({ value: () => 1 }), TypeError);
  assert.throws(() => serializeSnapshot(new Date()), TypeError);
  assert.throws(() => serializeSnapshot(cycle), TypeError);
  assert.throws(() => serializeSnapshot(sparse), TypeError);
  assert.throws(() => serializeSnapshot(accessor), TypeError);
  assert.throws(() => serializeSnapshot(JSON.parse('{"__proto__":{"polluted":true}}')), TypeError);
  assert.throws(() => parseSnapshot('{"constructor":{"prototype":{"polluted":true}}}'), TypeError);
  assert.throws(() => parseSnapshot("{"), SyntaxError);
  assert.throws(() => parseSnapshot(null), TypeError);
  assert.equal({}.polluted, undefined);
});
