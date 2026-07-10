(function (root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  root.Love2048Engine = engine;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const TILE = Object.freeze({
    FATE: "fate",
    DESTINY: "destiny",
    CONFLICT_2: "conflict:2",
    CONFLICT_1: "conflict:1"
  });
  const FATE_TIERS = [
    { min: 65536, start: 3, guarantee: 7 },
    { min: 8192, start: 4, guarantee: 8 },
    { min: 1024, start: 5, guarantee: 9 },
    { min: 256, start: 6, guarantee: 10 }
  ];
  const FATE_UNLOCK_TILE = 256;
  const CONFLICT_UNLOCK_TILE = 1024;
  const FATE_CHANCE = 0.25;
  const CONFLICT_CHANCE = 0.025;
  const EVENT_COOLDOWN_TURNS = 10;

  function createDirectorState() {
    return {
      firstFateTurns: 0,
      secondFateTurns: 0,
      fatePhase: "none",
      eventCooldown: 0
    };
  }

  function isOrdinaryTile(value) {
    return typeof value === "number" && value > 0;
  }

  function mergeValue(left, right) {
    if (isOrdinaryTile(left) && left === right) return left * 2;
    if (left === TILE.FATE && right === TILE.FATE) return TILE.DESTINY;
    return null;
  }

  function slideLine(line, size) {
    const values = line
      .slice(0, size)
      .map((value, source) => ({ value, source }))
      .filter((entry) => entry.value !== 0);
    const cells = [];
    const mergedSlots = [];
    const mergedValues = [];
    const motions = [];
    let merged = 0;
    let ordinaryMergeCount = 0;

    for (let index = 0; index < values.length; index += 1) {
      const current = values[index];
      const next = values[index + 1];
      const destination = cells.length;
      const nextValue = next && mergeValue(current.value, next.value);

      if (nextValue !== null && nextValue !== undefined) {
        cells.push(nextValue);
        mergedSlots.push(destination);
        mergedValues.push(nextValue);
        motions.push(
          { source: current.source, destination, value: current.value, merged: true },
          { source: next.source, destination, value: next.value, merged: true }
        );
        if (isOrdinaryTile(nextValue)) {
          merged += nextValue;
          ordinaryMergeCount += 1;
        }
        index += 1;
      } else {
        cells.push(current.value);
        motions.push({ source: current.source, destination, value: current.value, merged: false });
      }
    }

    while (cells.length < size) cells.push(0);
    return { cells, merged, ordinaryMergeCount, mergedSlots, mergedValues, motions };
  }

  function canMove(tiles, size) {
    if (tiles.some((value) => value === 0)) return true;
    for (let index = 0; index < tiles.length; index += 1) {
      const column = index % size;
      const row = Math.floor(index / size);
      if (column < size - 1 && mergeValue(tiles[index], tiles[index + 1])) return true;
      if (row < size - 1 && mergeValue(tiles[index], tiles[index + size])) return true;
    }
    return false;
  }

  function fateTier(highestTile) {
    return FATE_TIERS.find((tier) => highestTile >= tier.min) || null;
  }

  function canSpawnConflict(context, fateIsActive) {
    return !fateIsActive
      && Number(context.highestTile || 0) >= CONFLICT_UNLOCK_TILE
      && !context.conflictActive
      && context.emptyCount >= 5
      && !context.milestoneGraceTurns;
  }

  function decrementCooldown(state) {
    if (state.eventCooldown > 0) state.eventCooldown -= 1;
  }

  function chooseSpawn(state, context, random) {
    const nextState = { ...createDirectorState(), ...state };
    const nextRandom = typeof random === "function" ? random : Math.random;
    const highestTile = context.highestTile || 0;
    const inputBlocked = context.inputBlocked || context.blocked || context.changed === false;
    const ordinaryMergeCount = Number(context.ordinaryMergeCount) || 0;

    if (inputBlocked || highestTile < FATE_UNLOCK_TILE || ordinaryMergeCount <= 0) {
      return { kind: "normal", state: nextState };
    }

    const hasFateTile = Boolean(context.fateActive || context.hasFateTile);
    if (nextState.fatePhase !== "none" && !hasFateTile) {
      nextState.fatePhase = "none";
      nextState.secondFateTurns = 0;
    }

    if (nextState.fatePhase === "awaiting-second") {
      decrementCooldown(nextState);
      nextState.secondFateTurns += 1;
      if (nextState.secondFateTurns >= 4 || nextRandom() < FATE_CHANCE) {
        nextState.fatePhase = "awaiting-resolution";
        nextState.secondFateTurns = 0;
        return { kind: "fate", state: nextState };
      }
      return { kind: "normal", state: nextState };
    }

    if (nextState.fatePhase === "awaiting-resolution" || hasFateTile) {
      decrementCooldown(nextState);
      return { kind: "normal", state: nextState };
    }

    if (context.conflictActive) {
      decrementCooldown(nextState);
      return { kind: "normal", state: nextState };
    }

    if (nextState.eventCooldown > 0) {
      decrementCooldown(nextState);
      return { kind: "normal", state: nextState };
    }

    const tier = fateTier(highestTile);
    nextState.firstFateTurns += 1;
    const fateGuaranteed = nextState.firstFateTurns >= tier.guarantee;
    const fateChance = nextState.firstFateTurns >= tier.start ? FATE_CHANCE : 0;
    const conflictEligible = canSpawnConflict(context, false);
    const eventRoll = fateGuaranteed || (!fateChance && !conflictEligible) ? 1 : nextRandom();

    if (fateGuaranteed || eventRoll < fateChance) {
      nextState.firstFateTurns = 0;
      nextState.secondFateTurns = 0;
      nextState.fatePhase = "awaiting-second";
      nextState.eventCooldown = EVENT_COOLDOWN_TURNS;
      return { kind: "fate", state: nextState };
    }

    if (conflictEligible && eventRoll < fateChance + CONFLICT_CHANCE) {
      nextState.eventCooldown = EVENT_COOLDOWN_TURNS;
      return { kind: "conflict", state: nextState };
    }
    return { kind: "normal", state: nextState };
  }

  function resolveDestiny(tiles, options) {
    const nextTiles = tiles.slice();
    const destinyIndices = [];
    const ordinaryTiles = [];
    const emptyCount = nextTiles.filter((value) => value === 0).length;
    const miracleUsed = Boolean(options && options.miracleUsed);

    nextTiles.forEach((value, index) => {
      if (value === TILE.DESTINY) destinyIndices.push(index);
      if (isOrdinaryTile(value)) ordinaryTiles.push({ index, value });
    });

    if (!destinyIndices.length) {
      return {
        tiles: nextTiles,
        miracle: false,
        upgradedIndex: -1,
        upgradedValue: 0,
        clearedIndices: [],
        state: { miracleUsed }
      };
    }

    destinyIndices.forEach((index) => { nextTiles[index] = 0; });
    if (!ordinaryTiles.length) {
      return {
        tiles: nextTiles,
        miracle: false,
        upgradedIndex: -1,
        upgradedValue: 0,
        clearedIndices: [],
        state: { miracleUsed }
      };
    }
    const highest = ordinaryTiles.slice().sort((left, right) => right.value - left.value || left.index - right.index)[0];
    const otherOrdinaryTiles = ordinaryTiles
      .filter((tile) => tile.index !== highest.index)
      .sort((left, right) => left.value - right.value || left.index - right.index);
    const miracle = !miracleUsed && emptyCount <= 1;
    const clearedTiles = miracle ? otherOrdinaryTiles : otherOrdinaryTiles.slice(0, 4);

    nextTiles[highest.index] = highest.value * 2;
    clearedTiles.forEach((tile) => { nextTiles[tile.index] = 0; });
    return {
      tiles: nextTiles,
      miracle,
      upgradedIndex: highest.index,
      upgradedValue: highest.value * 2,
      clearedIndices: clearedTiles.map((tile) => tile.index),
      state: { miracleUsed: miracleUsed || miracle }
    };
  }

  function repairConflict(tiles, ordinaryMergeCount) {
    const mergeCount = Math.max(0, ordinaryMergeCount || 0);
    const nextTiles = tiles.map((tile) => {
      if (tile === TILE.CONFLICT_2) {
        if (mergeCount >= 2) return 0;
        if (mergeCount === 1) return TILE.CONFLICT_1;
      }
      if (tile === TILE.CONFLICT_1 && mergeCount >= 1) return 0;
      return tile;
    });
    return { tiles: nextTiles };
  }

  return {
    TILE,
    createDirectorState,
    slideLine,
    canMove,
    chooseSpawn,
    resolveDestiny,
    repairConflict
  };
});
