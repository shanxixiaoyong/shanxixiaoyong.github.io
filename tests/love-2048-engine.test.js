const assert = require("node:assert/strict");
const test = require("node:test");

const {
  TILE,
  createDirectorState,
  slideLine,
  canMove,
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
    ordinaryMergeCount: 1,
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

test("advances fate effort and the second-fate guarantee only after ordinary merges", () => {
  const firstFateState = { ...createDirectorState(), firstFateTurns: 9 };
  const movementOnly = chooseSpawn(firstFateState, spawnContext({ ordinaryMergeCount: 0 }), () => 0);
  const firstFate = chooseSpawn(movementOnly.state, spawnContext(), () => 0);
  const secondFateState = {
    ...createDirectorState(),
    fatePhase: "awaiting-second",
    secondFateTurns: 3
  };
  const secondMovementOnly = chooseSpawn(
    secondFateState,
    spawnContext({ fateActive: true, ordinaryMergeCount: 0 }),
    () => 0
  );
  const secondFate = chooseSpawn(secondMovementOnly.state, spawnContext({ fateActive: true }), () => 1);

  assert.equal(movementOnly.kind, "normal");
  assert.equal(movementOnly.state.firstFateTurns, 9);
  assert.equal(firstFate.kind, "fate");
  assert.equal(secondMovementOnly.kind, "normal");
  assert.equal(secondMovementOnly.state.secondFateTurns, 3);
  assert.equal(secondFate.kind, "fate");
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

test("uses an exact 2.5 percent conflict roll", () => {
  const context = spawnContext({ emptyCount: 5 });

  assert.equal(chooseSpawn(createDirectorState(), context, () => 0.0249).kind, "conflict");
  assert.equal(chooseSpawn(createDirectorState(), context, () => 0.025).kind, "normal");
});

test("paces first-fate and conflict events with a twelve-merge cooldown", () => {
  const firstFate = chooseSpawn(
    { ...createDirectorState(), firstFateTurns: 9 },
    spawnContext(),
    () => 0
  );

  assert.equal(firstFate.kind, "fate");
  assert.equal(firstFate.state.eventCooldown, 12);

  let state = chooseSpawn(createDirectorState(), spawnContext({ emptyCount: 5 }), () => 0).state;
  assert.equal(state.eventCooldown, 12);

  for (let turn = 0; turn < 12; turn += 1) {
    const result = chooseSpawn(state, spawnContext({ emptyCount: 5, conflictActive: true }), () => 0);
    assert.equal(result.kind, "normal");
    state = result.state;
  }
  assert.equal(state.eventCooldown, 0);
  assert.equal(chooseSpawn(state, spawnContext({ emptyCount: 5 }), () => 0).kind, "conflict");

  const secondFate = chooseSpawn(
    { ...createDirectorState(), fatePhase: "awaiting-second", secondFateTurns: 3, eventCooldown: 12 },
    spawnContext({ fateActive: true }),
    () => 1
  );
  assert.equal(secondFate.kind, "fate");
});

test("does not spawn first fate while conflict is active but retains accumulated effort", () => {
  const state = { ...createDirectorState(), firstFateTurns: 9 };
  const blockedByConflict = chooseSpawn(state, spawnContext({ conflictActive: true }), () => 0);
  const afterConflict = chooseSpawn(blockedByConflict.state, spawnContext(), () => 0);

  assert.equal(blockedByConflict.kind, "normal");
  assert.equal(blockedByConflict.state.firstFateTurns, 9);
  assert.equal(afterConflict.kind, "fate");
});

test("canMove recognizes only empty cells and valid ordinary or fate pairs", () => {
  const fullBoard = Array.from({ length: 25 }, (_, index) => 2 ** (index + 1));
  const ordinaryPair = fullBoard.slice();
  const fatePair = fullBoard.slice();
  const conflictPair = fullBoard.slice();
  ordinaryPair[1] = ordinaryPair[0];
  fatePair[0] = TILE.FATE;
  fatePair[1] = TILE.FATE;
  conflictPair[0] = TILE.CONFLICT_2;
  conflictPair[1] = TILE.CONFLICT_2;

  assert.equal(canMove([...fullBoard.slice(0, 24), 0], 5), true);
  assert.equal(canMove(ordinaryPair, 5), true);
  assert.equal(canMove(fatePair, 5), true);
  assert.equal(canMove(fullBoard, 5), false);
  assert.equal(canMove(conflictPair, 5), false);
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
