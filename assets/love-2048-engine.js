(function (root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  root.Love2048Engine = engine;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const TILE = Object.freeze({
    FATE: "fate",
    DESTINY: "destiny",
    CONFLICT: "conflict",
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

  function unitRandom(random) {
    const value = Number((typeof random === "function" ? random : Math.random)());
    return Math.max(0, Math.min(0.999999, Number.isFinite(value) ? value : 0));
  }

  function createConflictTile(remaining) {
    const count = Math.max(1, Math.min(5, Math.round(Number(remaining) || 1)));
    return `${TILE.CONFLICT}:${count}`;
  }

  function conflictRemaining(value) {
    const match = typeof value === "string" && value.match(/^conflict:([1-5])$/);
    return match ? Number(match[1]) : 0;
  }

  function isConflictTile(value) {
    return conflictRemaining(value) > 0;
  }

  function mergeValue(left, right) {
    if (isOrdinaryTile(left) && left === right) return left * 2;
    if (left === TILE.FATE && right === TILE.FATE) return TILE.DESTINY;
    return null;
  }

  function slideLine(line, size) {
    const sourceCells = line.slice(0, size);
    while (sourceCells.length < size) sourceCells.push(0);
    const cells = Array(size).fill(0);
    const mergedSlots = [];
    const mergedValues = [];
    const motions = [];
    let merged = 0;
    let ordinaryMergeCount = 0;

    function slideSegment(start, end) {
      const values = sourceCells
        .slice(start, end)
        .map((value, offset) => ({ value, source: start + offset }))
        .filter((entry) => entry.value !== 0);
      let destinationOffset = 0;

      for (let index = 0; index < values.length; index += 1) {
        const current = values[index];
        const next = values[index + 1];
        const destination = start + destinationOffset;
        const nextValue = next && mergeValue(current.value, next.value);

        if (nextValue !== null && nextValue !== undefined) {
          cells[destination] = nextValue;
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
          cells[destination] = current.value;
          motions.push({ source: current.source, destination, value: current.value, merged: false });
        }
        destinationOffset += 1;
      }
    }

    let segmentStart = 0;
    for (let index = 0; index <= size; index += 1) {
      if (index < size && !isConflictTile(sourceCells[index])) continue;
      slideSegment(segmentStart, index);
      if (index < size) cells[index] = sourceCells[index];
      segmentStart = index + 1;
    }
    return { cells, merged, ordinaryMergeCount, mergedSlots, mergedValues, motions };
  }

  function canMove(tiles, size) {
    const directions = [
      { vertical: false, reverse: false },
      { vertical: false, reverse: true },
      { vertical: true, reverse: false },
      { vertical: true, reverse: true }
    ];
    for (const direction of directions) {
      const nextTiles = tiles.slice();
      for (let lineIndex = 0; lineIndex < size; lineIndex += 1) {
        const indices = Array.from({ length: size }, (_, offset) => direction.vertical
          ? offset * size + lineIndex
          : lineIndex * size + offset);
        const oriented = direction.reverse ? indices.slice().reverse() : indices;
        const shifted = slideLine(oriented.map((index) => tiles[index]), size);
        shifted.cells.forEach((value, offset) => { nextTiles[oriented[offset]] = value; });
      }
      if (nextTiles.some((value, index) => value !== tiles[index])) return true;
    }
    return false;
  }

  function createConflictProfile(random) {
    const severityRoll = unitRandom(random);
    const config = severityRoll < 0.35
      ? { severity: "minor", minMerges: 2, maxMerges: 3, minEntry: 900, maxEntry: 1250 }
      : severityRoll < 0.8
        ? { severity: "friction", minMerges: 3, maxMerges: 4, minEntry: 1200, maxEntry: 1650 }
        : { severity: "deep", minMerges: 4, maxMerges: 5, minEntry: 1550, maxEntry: 2100 };
    const remaining = config.minMerges
      + Math.floor(unitRandom(random) * (config.maxMerges - config.minMerges + 1));
    return {
      severity: config.severity,
      remaining,
      entryMs: Math.round(config.minEntry + unitRandom(random) * (config.maxEntry - config.minEntry)),
      idleMs: Math.round(1800 + unitRandom(random) * 1300),
      resolveMs: Math.round(800 + unitRandom(random) * 600),
      loosenMs: Math.round(220 + unitRandom(random) * 200)
    };
  }

  function safeConflictIndices(tiles, size, remaining) {
    return tiles.flatMap((value, index) => {
      if (value !== 0) return [];
      const candidate = tiles.slice();
      candidate[index] = createConflictTile(remaining);
      return canMove(candidate, size) ? [index] : [];
    });
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
      return { kind: "conflict", profile: createConflictProfile(nextRandom), state: nextState };
    }
    return { kind: "normal", state: nextState };
  }

  function resolveDestiny(tiles, options = {}) {
    const nextTiles = tiles.slice();
    const destinyIndices = [];
    const ordinaryTiles = [];
    const nextRandom = typeof options.random === "function" ? options.random : Math.random;

    nextTiles.forEach((value, index) => {
      if (value === TILE.DESTINY) destinyIndices.push(index);
      if (isOrdinaryTile(value)) ordinaryTiles.push({ index, value });
    });

    if (!destinyIndices.length) {
      return {
        tiles: nextTiles,
        upgradedIndex: -1,
        upgradedValue: 0,
        previousValue: 0,
        targetWasHighest: false,
        favoredHighest: false,
        clearedIndices: []
      };
    }

    destinyIndices.forEach((index) => { nextTiles[index] = 0; });
    if (!ordinaryTiles.length) {
      return {
        tiles: nextTiles,
        upgradedIndex: -1,
        upgradedValue: 0,
        previousValue: 0,
        targetWasHighest: false,
        favoredHighest: false,
        clearedIndices: destinyIndices
      };
    }
    const highestValue = ordinaryTiles.reduce((highest, tile) => Math.max(highest, tile.value), 0);
    const highestTiles = ordinaryTiles.filter((tile) => tile.value === highestValue);
    const favoredHighest = unitRandom(nextRandom) < 0.3;
    const candidates = favoredHighest ? highestTiles : ordinaryTiles;
    const selected = candidates[Math.floor(unitRandom(nextRandom) * candidates.length)];
    nextTiles[selected.index] = selected.value * 2;
    return {
      tiles: nextTiles,
      upgradedIndex: selected.index,
      upgradedValue: selected.value * 2,
      previousValue: selected.value,
      targetWasHighest: selected.value === highestValue,
      favoredHighest,
      clearedIndices: destinyIndices
    };
  }

  function repairConflict(tiles, ordinaryMergeCount) {
    const mergeCount = Math.max(0, Math.floor(Number(ordinaryMergeCount) || 0));
    const nextTiles = tiles.slice();
    const index = nextTiles.findIndex(isConflictTile);
    if (index < 0 || mergeCount <= 0) {
      const remaining = index < 0 ? 0 : conflictRemaining(nextTiles[index]);
      return {
        tiles: nextTiles,
        index,
        beforeRemaining: remaining,
        remaining,
        resolved: false
      };
    }
    const beforeRemaining = conflictRemaining(nextTiles[index]);
    const remaining = Math.max(0, beforeRemaining - mergeCount);
    nextTiles[index] = remaining ? createConflictTile(remaining) : 0;
    return { tiles: nextTiles, index, beforeRemaining, remaining, resolved: remaining === 0 };
  }

  return {
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
  };
});
