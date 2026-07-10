const assert = require("node:assert/strict");
const test = require("node:test");

const {
  TILE,
  createDirectorState,
  createConflictTile,
  conflictRemaining,
  createConflictProfile,
  safeConflictIndices,
  slideLine,
  canMove,
  chooseSpawn,
  resolveDestiny,
  repairConflict
} = require("../assets/love-2048-engine.js");

test("slides and merges a five-cell numeric line", () => {
  assert.deepEqual(slideLine([2, 2, 4, 0, 4], 5).cells, [4, 8, 0, 0, 0]);
});

test("merges adjacent fate tiles while a conflict remains fixed", () => {
  assert.deepEqual(
    slideLine([TILE.FATE, TILE.FATE, 2, TILE.CONFLICT_2, 2], 5).cells,
    [TILE.DESTINY, 2, 0, TILE.CONFLICT_2, 2]
  );
});

test("keeps a temporary conflict fixed and slides each side independently", () => {
  const knot = createConflictTile(4);
  const result = slideLine([2, 0, knot, 2, 2], 5);

  assert.deepEqual(result.cells, [2, 0, knot, 4, 0]);
  assert.equal(result.ordinaryMergeCount, 1);
  assert.equal(result.motions.some((motion) => motion.value === knot), false);
});

test("creates two-to-five merge conflict profiles with bounded random animation timing", () => {
  const minorRolls = [0, 0, 0, 0, 0];
  const deepRolls = [0.99, 0.99, 0.99, 0.99, 0.99];
  const minor = createConflictProfile(() => minorRolls.shift());
  const deep = createConflictProfile(() => deepRolls.shift());

  assert.deepEqual(
    { severity: minor.severity, remaining: minor.remaining },
    { severity: "minor", remaining: 2 }
  );
  assert.deepEqual(
    { severity: deep.severity, remaining: deep.remaining },
    { severity: "deep", remaining: 5 }
  );
  assert.ok(minor.entryMs >= 900 && minor.entryMs <= 1250);
  assert.ok(deep.entryMs >= 1550 && deep.entryMs <= 2100);
  assert.ok(deep.idleMs >= 1800 && deep.idleMs <= 3100);
  assert.ok(deep.resolveMs >= 800 && deep.resolveMs <= 1400);
  assert.ok(deep.loosenMs >= 220 && deep.loosenMs <= 420);
});

test("encodes conflict lifetime in one fixed tile and exposes only safe spawn cells", () => {
  assert.equal(conflictRemaining(createConflictTile(2)), 2);
  assert.equal(conflictRemaining(createConflictTile(5)), 5);
  assert.equal(conflictRemaining(2048), 0);

  const deadBoard = Array.from({ length: 25 }, (_, index) => 2 ** (index + 1));
  deadBoard[12] = 0;
  assert.deepEqual(safeConflictIndices(deadBoard, 5, 3), []);

  const liveBoard = deadBoard.slice();
  liveBoard[0] = liveBoard[1];
  assert.ok(safeConflictIndices(liveBoard, 5, 3).includes(12));
});

function spawnContext(overrides = {}) {
  return {
    highestTile: 1024,
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

test("does not roll or accrue event effort for blocked input or pre-256 boards", () => {
  const state = createDirectorState();
  const blocked = chooseSpawn(state, spawnContext({ inputBlocked: true }), () => 0);
  const preFate = chooseSpawn(state, spawnContext({ highestTile: 128 }), () => 0);

  assert.equal(blocked.kind, "normal");
  assert.deepEqual(blocked.state, state);
  assert.equal(preFate.kind, "normal");
  assert.deepEqual(preFate.state, state);
});

test("advances fate effort and the second-fate guarantee only after ordinary merges", () => {
  const firstFateState = { ...createDirectorState(), firstFateTurns: 4 };
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
  assert.equal(movementOnly.state.firstFateTurns, 4);
  assert.equal(firstFate.kind, "fate");
  assert.equal(secondMovementOnly.kind, "normal");
  assert.equal(secondMovementOnly.state.secondFateTurns, 3);
  assert.equal(secondFate.kind, "fate");
});

test("counts a multi-merge swipe as one eligible relationship turn", () => {
  const cooldownResult = chooseSpawn(
    { ...createDirectorState(), firstFateTurns: 2, eventCooldown: 5 },
    spawnContext({ ordinaryMergeCount: 4 }),
    () => 1
  );

  assert.equal(cooldownResult.kind, "normal");
  assert.equal(cooldownResult.state.firstFateTurns, 2);
  assert.equal(cooldownResult.state.eventCooldown, 4);

  const openResult = chooseSpawn(
    { ...createDirectorState(), firstFateTurns: 2 },
    spawnContext({ ordinaryMergeCount: 4 }),
    () => 1
  );
  assert.equal(openResult.state.firstFateTurns, 3);
});

test("uses stage-scaled first-fate starts and guarantees", () => {
  const tiers = [
    { highestTile: 256, start: 6, guarantee: 10 },
    { highestTile: 1024, start: 5, guarantee: 9 },
    { highestTile: 8192, start: 4, guarantee: 8 },
    { highestTile: 65536, start: 3, guarantee: 7 }
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

test("completes a guaranteed fate pair within fourteen eligible turns at 256", () => {
  const firstContext = spawnContext({ highestTile: 256 });
  const firstFate = chooseAfterTurns(10, firstContext);
  const secondContext = spawnContext({ highestTile: 256, fateActive: true });
  const secondFate = chooseTurns(firstFate.state, 4, secondContext);

  assert.equal(firstFate.result.kind, "fate");
  assert.equal(secondFate.result.kind, "fate");
  assert.equal(secondFate.state.fatePhase, "awaiting-resolution");
});

test("guarantees the second fate tile on the fourth eligible turn", () => {
  const context = spawnContext({ fateActive: true });
  let state = chooseAfterTurns(4, spawnContext()).state;
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
    spawnContext({ highestTile: 512, emptyCount: 5 }),
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

test("keeps the conflict window at exactly 2.5 percent once fate rolls begin", () => {
  const state = { ...createDirectorState(), firstFateTurns: 4 };
  const context = spawnContext({ emptyCount: 5 });

  assert.equal(chooseSpawn(state, context, () => 0.2499).kind, "fate");
  assert.equal(chooseSpawn(state, context, () => 0.25).kind, "conflict");
  assert.equal(chooseSpawn(state, context, () => 0.2749).kind, "conflict");
  assert.equal(chooseSpawn(state, context, () => 0.275).kind, "normal");
});

test("paces first-fate and conflict events with a ten-turn cooldown", () => {
  const firstFate = chooseSpawn(
    { ...createDirectorState(), firstFateTurns: 4 },
    spawnContext(),
    () => 0
  );

  assert.equal(firstFate.kind, "fate");
  assert.equal(firstFate.state.eventCooldown, 10);

  let state = chooseSpawn(createDirectorState(), spawnContext({ emptyCount: 5 }), () => 0).state;
  assert.equal(state.eventCooldown, 10);

  for (let turn = 0; turn < 10; turn += 1) {
    const result = chooseSpawn(state, spawnContext({ emptyCount: 5, conflictActive: true }), () => 0);
    assert.equal(result.kind, "normal");
    state = result.state;
  }
  assert.equal(state.eventCooldown, 0);
  assert.equal(chooseSpawn(state, spawnContext({ emptyCount: 5 }), () => 0).kind, "conflict");

  const secondFate = chooseSpawn(
    { ...createDirectorState(), fatePhase: "awaiting-second", secondFateTurns: 3, eventCooldown: 10 },
    spawnContext({ fateActive: true }),
    () => 1
  );
  assert.equal(secondFate.kind, "fate");
});

test("does not spawn first fate while conflict is active but retains accumulated effort", () => {
  const state = { ...createDirectorState(), firstFateTurns: 4 };
  const blockedByConflict = chooseSpawn(state, spawnContext({ conflictActive: true }), () => 0);
  const afterConflict = chooseSpawn(blockedByConflict.state, spawnContext(), () => 0);

  assert.equal(blockedByConflict.kind, "normal");
  assert.equal(blockedByConflict.state.firstFateTurns, 4);
  assert.equal(afterConflict.kind, "fate");
});

test("unlocks helpful fate at 256 but keeps conflict locked until 1024", () => {
  const fate = chooseSpawn(
    { ...createDirectorState(), firstFateTurns: 5 },
    spawnContext({ highestTile: 256 }),
    () => 0
  );
  const earlyConflict = chooseSpawn(
    createDirectorState(),
    spawnContext({ highestTile: 512, emptyCount: 5 }),
    () => 0
  );
  const unlockedConflict = chooseSpawn(
    createDirectorState(),
    spawnContext({ highestTile: 1024, emptyCount: 5 }),
    () => 0
  );

  assert.equal(fate.kind, "fate");
  assert.equal(earlyConflict.kind, "normal");
  assert.equal(unlockedConflict.kind, "conflict");
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

test("resolves a positive reveal by favoring a highest tile without clearing ordinary tiles", () => {
  const result = resolveDestiny(
    [TILE.DESTINY, 2, 4, 8, 16, TILE.CONFLICT_2, 0, 0],
    { random: () => 0 }
  );

  assert.deepEqual(result.tiles, [0, 2, 4, 8, 32, TILE.CONFLICT_2, 0, 0]);
  assert.equal(result.previousValue, 16);
  assert.equal(result.upgradedValue, 32);
  assert.equal(result.targetWasHighest, true);
  assert.equal(result.favoredHighest, true);
  assert.deepEqual(result.clearedIndices, [0]);
});

test("can select any ordinary tile while retaining a thirty-percent highest preference", () => {
  const rolls = [0.9, 0];
  const result = resolveDestiny(
    [TILE.DESTINY, 2, 4, 8, 16, 32, 64, TILE.CONFLICT_2],
    { random: () => rolls.shift() }
  );

  assert.deepEqual(result.tiles, [0, 4, 4, 8, 16, 32, 64, TILE.CONFLICT_2]);
  assert.equal(result.previousValue, 2);
  assert.equal(result.targetWasHighest, false);
  assert.equal(result.favoredHighest, false);
});

test("clears a destiny marker even when no ordinary tile remains", () => {
  const result = resolveDestiny([TILE.DESTINY, TILE.CONFLICT_2, 0], { random: () => 0 });

  assert.deepEqual(result.tiles, [0, TILE.CONFLICT_2, 0]);
  assert.equal(result.upgradedIndex, -1);
});

test("loosens one fixed conflict by every ordinary merge pair and clears it once", () => {
  const tiles = [2, createConflictTile(5), 4, 8];
  const loosened = repairConflict(tiles, 2);
  const resolved = repairConflict(loosened.tiles, 3);

  assert.deepEqual(loosened.tiles, [2, createConflictTile(3), 4, 8]);
  assert.equal(loosened.remaining, 3);
  assert.equal(loosened.resolved, false);
  assert.deepEqual(resolved.tiles, [2, 0, 4, 8]);
  assert.equal(resolved.remaining, 0);
  assert.equal(resolved.resolved, true);
});
