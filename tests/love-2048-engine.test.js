const assert = require("node:assert/strict");
const test = require("node:test");

const {
  TILE,
  createDirectorState,
  slideLine,
  chooseSpawn,
  resolveDestiny,
  repairConflict
} = require("../assets/love-2048-engine.js");

test("slides and merges a five-cell numeric line", () => {
  assert.deepEqual(slideLine([2, 2, 4, 0, 4], 5).cells, [4, 8, 0, 0, 0]);
});

test("merges adjacent fate tiles after compaction but never conflict with ordinary tiles", () => {
  assert.deepEqual(
    slideLine([TILE.FATE, TILE.FATE, 2, TILE.CONFLICT_2, 2], 5).cells,
    [TILE.DESTINY, 2, TILE.CONFLICT_2, 2, 0]
  );
});

function spawnContext(overrides = {}) {
  return {
    highestTile: 2048,
    emptyCount: 4,
    inputBlocked: false,
    fateActive: false,
    conflictActive: false,
    milestoneGraceTurns: 0,
    ...overrides
  };
}

function chooseAfterTurns(turns, context) {
  let state = createDirectorState();
  return chooseTurns(state, turns, context);
}

function chooseTurns(state, turns, context) {
  let result;
  for (let turn = 0; turn < turns; turn += 1) {
    result = chooseSpawn(state, context, () => 1);
    state = result.state;
  }
  return { result, state };
}

test("does not roll or accrue event effort for blocked input or pre-2048 boards", () => {
  const state = createDirectorState();
  const blocked = chooseSpawn(state, spawnContext({ inputBlocked: true }), () => 0);
  const preFate = chooseSpawn(state, spawnContext({ highestTile: 1024 }), () => 0);

  assert.equal(blocked.kind, "normal");
  assert.deepEqual(blocked.state, state);
  assert.equal(preFate.kind, "normal");
  assert.deepEqual(preFate.state, state);
});

test("uses stage-scaled first-fate starts and guarantees", () => {
  const tiers = [
    { highestTile: 2048, start: 10, guarantee: 18 },
    { highestTile: 16384, start: 8, guarantee: 15 },
    { highestTile: 262144, start: 6, guarantee: 12 }
  ];

  for (const tier of tiers) {
    const context = spawnContext({ highestTile: tier.highestTile });
    const beforeStart = chooseAfterTurns(tier.start - 1, context);
    const atStart = chooseSpawn(beforeStart.state, context, () => 0);
    const beforeGuarantee = chooseAfterTurns(tier.guarantee - 1, context);
    const atGuarantee = chooseSpawn(beforeGuarantee.state, context, () => 1);

    assert.equal(beforeStart.result.kind, "normal");
    assert.equal(atStart.kind, "fate");
    assert.equal(beforeGuarantee.result.kind, "normal");
    assert.equal(atGuarantee.kind, "fate");
  }
});

test("guarantees the second fate tile on the fourth eligible turn", () => {
  const context = spawnContext({ fateActive: true });
  let state = chooseAfterTurns(9, spawnContext()).state;
  state = chooseSpawn(state, spawnContext(), () => 0).state;

  const firstThree = chooseTurns(state, 3, context);
  const fourth = chooseSpawn(firstThree.state, context, () => 1);

  assert.equal(firstThree.result.kind, "normal");
  assert.equal(fourth.kind, "fate");
});

test("allows conflicts only when their event gates are open", () => {
  const open = chooseSpawn(createDirectorState(), spawnContext({ emptyCount: 5 }), () => 0);
  assert.equal(open.kind, "conflict");

  for (const context of [
    spawnContext({ emptyCount: 4 }),
    spawnContext({ emptyCount: 5, fateActive: true }),
    spawnContext({ emptyCount: 5, conflictActive: true }),
    spawnContext({ emptyCount: 5, milestoneGraceTurns: 8 })
  ]) {
    assert.equal(chooseSpawn(createDirectorState(), context, () => 0).kind, "normal");
  }
});

test("resolves destiny by upgrading the highest ordinary tile and clearing four low tiles", () => {
  const result = resolveDestiny(
    [TILE.DESTINY, 2, 4, 8, 16, TILE.CONFLICT_2, 0, 0],
    { miracleUsed: false }
  );

  assert.deepEqual(result.tiles, [0, 0, 0, 0, 32, TILE.CONFLICT_2, 0, 0]);
  assert.equal(result.miracle, false);
  assert.deepEqual(result.state, { miracleUsed: false });
});

test("uses miracle cleanup once when destiny resolves with at most one empty cell", () => {
  const crowded = [TILE.DESTINY, 2, 4, 8, 16, 32, 64, TILE.CONFLICT_2];
  const miracle = resolveDestiny(crowded, { miracleUsed: false });
  const afterMiracle = resolveDestiny(crowded, { miracleUsed: true });

  assert.deepEqual(miracle.tiles, [0, 0, 0, 0, 0, 0, 128, TILE.CONFLICT_2]);
  assert.equal(miracle.miracle, true);
  assert.deepEqual(miracle.state, { miracleUsed: true });
  assert.deepEqual(afterMiracle.tiles, [0, 0, 0, 0, 0, 32, 128, TILE.CONFLICT_2]);
  assert.equal(afterMiracle.miracle, false);
});

test("clears a destiny marker even when no ordinary tile remains", () => {
  const result = resolveDestiny([TILE.DESTINY, TILE.CONFLICT_2, 0], { miracleUsed: false });

  assert.deepEqual(result.tiles, [0, TILE.CONFLICT_2, 0]);
  assert.equal(result.upgradedIndex, -1);
});

test("repairs a two-crack conflict after two ordinary numeric merges", () => {
  const tiles = [2, TILE.CONFLICT_2, 4, TILE.CONFLICT_1];

  assert.deepEqual(repairConflict(tiles, 1).tiles, [2, TILE.CONFLICT_1, 4, 0]);
  assert.deepEqual(repairConflict(tiles, 2).tiles, [2, 0, 4, 0]);
});
