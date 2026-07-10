const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const rules = require("../assets/billiards-love-rules.js");
const {
  RULES,
  MOMENTS,
  LEVELS,
  computeAimGesture,
  traceAimPath,
  createRunState,
  resolveShot,
  advanceLevel,
  findCuePlacement
} = rules;

test("exports an immutable three-chapter romantic table catalog", () => {
  assert.equal(RULES.title, "心动桌球");
  assert.equal(LEVELS.length, 3);
  assert.equal(MOMENTS.length, 12);
  assert.deepEqual(LEVELS.map((level) => level.goal), [2, 3, 4]);
  assert.deepEqual(LEVELS.map((level) => level.shots), [6, 7, 8]);
  assert.deepEqual(MOMENTS.map((moment) => moment.number), Array.from({ length: 12 }, (_, index) => index + 1));
  assert.equal(new Set(MOMENTS.map((moment) => moment.id)).size, MOMENTS.length);
  assert.ok(MOMENTS.every((moment) => moment.points > 0 && moment.line.length > 8));
  assert.ok(Object.isFrozen(rules));
  assert.ok(Object.isFrozen(RULES));
  assert.ok(Object.isFrozen(MOMENTS));
  assert.ok(Object.isFrozen(LEVELS));
  assert.ok(MOMENTS.every(Object.isFrozen));
  assert.ok(LEVELS.every((level) => Object.isFrozen(level) && Object.isFrozen(level.moments)));
});

test("loads as a browser global without CommonJS", () => {
  const source = readFileSync(path.join(__dirname, "../assets/billiards-love-rules.js"), "utf8");
  const browser = {};
  vm.runInNewContext(source, browser, { filename: "billiards-love-rules.js" });

  assert.equal(browser.BilliardsLoveRules.RULES.title, "心动桌球");
  assert.equal(browser.BilliardsLoveRules.LEVELS.length, 3);
  assert.equal(typeof browser.BilliardsLoveRules.resolveShot, "function");
  assert.equal(typeof browser.BilliardsLoveRules.traceAimPath, "function");
});

test("aim gesture turns a backward pull into a clamped deliberate shot", () => {
  const tooShort = computeAimGesture({ x: 100, y: 100 }, { x: 100, y: 94 });
  assert.equal(tooShort.active, false);
  assert.equal(tooShort.power, 0);
  assert.equal(tooShort.speed, 0);

  const upwardShot = computeAimGesture({ x: 100, y: 100 }, { x: 100, y: 200 });
  assert.equal(upwardShot.active, true);
  assert.ok(Math.abs(upwardShot.direction.x) < 1e-12);
  assert.equal(upwardShot.direction.y, -1);
  assert.ok(upwardShot.power > 0.9 && upwardShot.power < 1);
  assert.ok(upwardShot.speed > RULES.minShotSpeed);

  const clamped = computeAimGesture({ x: 0, y: 0 }, { x: -1000, y: 0 });
  assert.equal(clamped.pull, RULES.maxPull);
  assert.equal(clamped.power, 1);
  assert.equal(clamped.speed, RULES.maxShotSpeed);
  assert.equal(clamped.direction.x, 1);
  assert.ok(Object.isFrozen(clamped));
  assert.ok(Object.isFrozen(clamped.direction));
});

test("aim gesture rejects malformed points and pull ranges", () => {
  assert.throws(() => computeAimGesture(null, { x: 0, y: 0 }), TypeError);
  assert.throws(() => computeAimGesture({ x: NaN, y: 0 }, { x: 0, y: 0 }), TypeError);
  assert.throws(() => computeAimGesture({ x: 0, y: 0 }, { x: 0, y: 0 }, { minPull: 10, maxPull: 10 }), RangeError);
  assert.throws(() => computeAimGesture({ x: 0, y: 0 }, { x: 0, y: 0 }, []), TypeError);
});

test("aim trace predicts the first object-ball contact", () => {
  const trace = traceAimPath(
    { x: 50, y: 50 },
    { x: 3, y: 0 },
    { left: 0, right: 100, top: 0, bottom: 100 },
    [
      { id: "near", x: 80, y: 50, radius: 5 },
      { id: "far", x: 95, y: 50, radius: 5 }
    ],
    1,
    5
  );

  assert.equal(trace.hitBallId, "near");
  assert.equal(trace.segments.length, 1);
  assert.equal(trace.segments[0].type, "ball");
  assert.equal(trace.segments[0].end.x, 70);
  assert.equal(trace.segments[0].end.y, 50);
  assert.equal(trace.cushionHits, 0);
  assert.ok(Object.isFrozen(trace));
  assert.ok(Object.isFrozen(trace.segments));
});

test("aim trace reflects from a cushion for an indirect preview", () => {
  const trace = traceAimPath(
    { x: 50, y: 50 },
    { x: 1, y: 0 },
    { left: 0, right: 100, top: 0, bottom: 100 },
    [],
    1,
    5
  );

  assert.equal(trace.hitBallId, null);
  assert.equal(trace.segments.length, 2);
  assert.deepEqual(trace.segments.map((segment) => segment.type), ["cushion", "cushion"]);
  assert.equal(trace.segments[0].end.x, 100);
  assert.equal(trace.segments[1].end.x, 0);
  assert.equal(trace.finalDirection.x, -1);
  assert.equal(trace.cushionHits, 2);
});

test("aim trace validates geometry and bounded bounce counts", () => {
  const bounds = { left: 0, right: 100, top: 0, bottom: 100 };
  assert.throws(() => traceAimPath({ x: 50, y: 50 }, { x: 0, y: 0 }, bounds), RangeError);
  assert.throws(() => traceAimPath({ x: 50, y: 50 }, { x: 1, y: 0 }, { left: 2, right: 1, top: 0, bottom: 2 }), RangeError);
  assert.throws(() => traceAimPath({ x: 50, y: 50 }, { x: 1, y: 0 }, bounds, [{ id: "", x: 1, y: 1, radius: 2 }]), TypeError);
  assert.throws(() => traceAimPath({ x: 50, y: 50 }, { x: 1, y: 0 }, bounds, [], RULES.maxAimBounces + 1), RangeError);
});

test("a direct pocket unlocks a concrete moment and spends one turn", () => {
  const initial = createRunState();
  const result = resolveShot(initial, {
    firstContactId: "umbrella",
    pottedIds: ["umbrella"],
    scratch: false,
    cueRailBeforeContact: false,
    railHits: 0,
    combination: false
  });

  assert.equal(result.foul, false);
  assert.equal(result.indirect, false);
  assert.equal(result.replyShot, false);
  assert.equal(result.basePoints, 120);
  assert.equal(result.scoreDelta, 120);
  assert.equal(result.state.score, 120);
  assert.equal(result.state.shotsRemaining, 5);
  assert.equal(result.state.chapterPockets, 1);
  assert.deepEqual(result.state.unlockedMomentIds, ["umbrella"]);
  assert.deepEqual(result.milestones, ["first-approach"]);
  assert.deepEqual(initial, createRunState());
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.state));
});

test("cushion and combination pockets become an indirect reply that refunds the turn", () => {
  const bank = resolveShot(createRunState(), {
    firstContactId: "umbrella",
    pottedIds: ["umbrella"],
    cueRailBeforeContact: true,
    railHits: 1,
    combination: false
  });

  assert.equal(bank.indirect, true);
  assert.equal(bank.replyShot, true);
  assert.equal(bank.state.shotsRemaining, 6);
  assert.equal(bank.indirectBonus, Math.round(120 * 0.55) + RULES.indirectFlatBonus);
  assert.ok(bank.milestones.includes("first-echo"));

  const combination = resolveShot(createRunState(), {
    firstContactId: "umbrella",
    pottedIds: ["last-train"],
    cueRailBeforeContact: false,
    railHits: 0,
    combination: true
  });
  assert.equal(combination.indirect, true);
  assert.equal(combination.combinationBonus, RULES.combinationBonus);
  assert.ok(combination.milestones.includes("first-combination"));
});

test("scratches and missed contacts are fouls with bounded score penalties", () => {
  const miss = resolveShot(createRunState(), {
    firstContactId: null,
    pottedIds: [],
    scratch: false,
    railHits: 2
  });
  assert.equal(miss.foul, true);
  assert.equal(miss.penalty, RULES.foulPenalty);
  assert.equal(miss.state.score, 0);
  assert.equal(miss.state.fouls, 1);
  assert.equal(miss.state.shotsRemaining, 5);

  const scored = resolveShot(createRunState(), {
    firstContactId: "umbrella",
    pottedIds: ["umbrella"]
  }).state;
  const scratch = resolveShot(scored, {
    firstContactId: "last-train",
    pottedIds: [],
    scratch: true
  });
  assert.equal(scratch.foul, true);
  assert.equal(scratch.scratch, true);
  assert.equal(scratch.state.score, 40);
});

test("chapter completion advances to an escalating fresh table", () => {
  let state = createRunState();
  state = resolveShot(state, { firstContactId: "umbrella", pottedIds: ["umbrella"] }).state;
  const completion = resolveShot(state, { firstContactId: "last-train", pottedIds: ["last-train"] });

  assert.equal(completion.levelComplete, true);
  assert.equal(completion.victory, false);
  assert.equal(completion.state.chapterComplete, true);
  assert.ok(completion.milestones.includes("chapter-rain-platform"));

  const next = advanceLevel(completion.state);
  assert.equal(next.levelIndex, 1);
  assert.equal(next.chapterPockets, 0);
  assert.equal(next.shotsRemaining, 7);
  assert.equal(next.score, completion.state.score);
  assert.deepEqual(next.unlockedMomentIds, ["umbrella", "last-train"]);
  assert.throws(() => advanceLevel(createRunState()), RangeError);
});

test("exhausting turns loses, while completing the final table wins", () => {
  let losing = createRunState();
  let lastMiss;
  for (let index = 0; index < LEVELS[0].shots; index += 1) {
    lastMiss = resolveShot(losing, { firstContactId: null, pottedIds: [] });
    losing = lastMiss.state;
  }
  assert.equal(lastMiss.gameOver, true);
  assert.equal(losing.shotsRemaining, 0);
  assert.throws(() => resolveShot(losing, { firstContactId: null, pottedIds: [] }), RangeError);

  let winning = createRunState(2);
  for (const id of ["rooftop-wind", "sea-glow", "postcard", "promise"]) {
    const result = resolveShot(winning, { firstContactId: id, pottedIds: [id] });
    winning = result.state;
    if (id === "promise") {
      assert.equal(result.victory, true);
      assert.ok(result.milestones.includes("final-dawn"));
    }
  }
  assert.equal(winning.chapterComplete, true);
  assert.throws(() => advanceLevel(winning), RangeError);
});

test("cue-ball respot clamps to the table and avoids occupied balls", () => {
  const bounds = { left: 20, right: 316, top: 20, bottom: 528 };
  const open = findCuePlacement({ x: 168, y: 460 }, [], bounds, RULES.ballRadius);
  assert.deepEqual(open, { x: 168, y: 460 });

  const occupied = findCuePlacement(
    { x: 168, y: 460 },
    [{ x: 168, y: 460, radius: RULES.ballRadius }],
    bounds,
    RULES.ballRadius
  );
  assert.ok(Math.hypot(occupied.x - 168, occupied.y - 460) >= RULES.ballRadius * 2 + 2);
  assert.ok(occupied.x > bounds.left && occupied.x < bounds.right);
  assert.ok(occupied.y > bounds.top && occupied.y < bounds.bottom);
  assert.ok(Object.isFrozen(occupied));
});

test("shot resolution rejects duplicate, foreign, or inconsistent state", () => {
  assert.throws(() => resolveShot({}, { firstContactId: null, pottedIds: [] }), TypeError);
  assert.throws(() => resolveShot(createRunState(), { firstContactId: "unknown", pottedIds: [] }), RangeError);
  assert.throws(() => resolveShot(createRunState(), { firstContactId: "umbrella", pottedIds: ["umbrella", "umbrella"] }), RangeError);
  assert.throws(() => resolveShot(createRunState(), { firstContactId: "umbrella", pottedIds: ["sea-glow"] }), RangeError);
  assert.throws(() => resolveShot(createRunState(), { firstContactId: "umbrella", pottedIds: [], scratch: 1 }), TypeError);
});
