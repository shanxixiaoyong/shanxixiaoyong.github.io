(function (root, factory) {
  const rules = factory();
  if (typeof module === "object" && module.exports) module.exports = rules;
  else root.TetrisLoveRules = rules;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const COLS = 10;
  const VISIBLE_ROWS = 20;
  const HIDDEN_ROWS = 2;
  const BOARD_ROWS = VISIBLE_ROWS + HIDDEN_ROWS;
  const PIECE_TYPES = Object.freeze(["I", "J", "L", "O", "S", "T", "Z"]);
  const VOICES = Object.freeze(["you", "them"]);
  const MAX_UINT32 = 0xffffffff;

  function freezeCells(cells) {
    return Object.freeze(cells.map((cell) => Object.freeze(cell.slice())));
  }

  function freezeRotations(rotations) {
    return Object.freeze(rotations.map(freezeCells));
  }

  const SHAPES = Object.freeze({
    I: freezeRotations([
      [[0, 1], [1, 1], [2, 1], [3, 1]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      [[1, 0], [1, 1], [1, 2], [1, 3]]
    ]),
    J: freezeRotations([
      [[0, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [2, 2]],
      [[1, 0], [1, 1], [0, 2], [1, 2]]
    ]),
    L: freezeRotations([
      [[2, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 2]],
      [[0, 1], [1, 1], [2, 1], [0, 2]],
      [[0, 0], [1, 0], [1, 1], [1, 2]]
    ]),
    O: freezeRotations([
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]]
    ]),
    S: freezeRotations([
      [[1, 0], [2, 0], [0, 1], [1, 1]],
      [[1, 0], [1, 1], [2, 1], [2, 2]],
      [[1, 1], [2, 1], [0, 2], [1, 2]],
      [[0, 0], [0, 1], [1, 1], [1, 2]]
    ]),
    T: freezeRotations([
      [[1, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [2, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [1, 2]],
      [[1, 0], [0, 1], [1, 1], [1, 2]]
    ]),
    Z: freezeRotations([
      [[0, 0], [1, 0], [1, 1], [2, 1]],
      [[2, 0], [1, 1], [2, 1], [1, 2]],
      [[0, 1], [1, 1], [1, 2], [2, 2]],
      [[1, 0], [0, 1], [1, 1], [0, 2]]
    ])
  });

  // SRS offsets converted to canvas coordinates, where positive Y points down.
  const JLSTZ_KICKS = Object.freeze({
    "0>1": freezeCells([[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]]),
    "1>0": freezeCells([[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]),
    "1>2": freezeCells([[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]),
    "2>1": freezeCells([[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]]),
    "2>3": freezeCells([[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]),
    "3>2": freezeCells([[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]),
    "3>0": freezeCells([[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]),
    "0>3": freezeCells([[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]])
  });

  const I_KICKS = Object.freeze({
    "0>1": freezeCells([[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]]),
    "1>0": freezeCells([[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]]),
    "1>2": freezeCells([[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]]),
    "2>1": freezeCells([[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]]),
    "2>3": freezeCells([[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]]),
    "3>2": freezeCells([[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]]),
    "3>0": freezeCells([[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]]),
    "0>3": freezeCells([[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]])
  });

  function assertInteger(value, label, minimum, maximum) {
    if (!Number.isSafeInteger(value)) throw new TypeError(`${label} must be an integer`);
    if (value < minimum || value > maximum) {
      throw new RangeError(`${label} must be between ${minimum} and ${maximum}`);
    }
  }

  function assertBoolean(value, label) {
    if (typeof value !== "boolean") throw new TypeError(`${label} must be a boolean`);
  }

  function assertPieceType(type) {
    if (!PIECE_TYPES.includes(type)) throw new RangeError("piece type is invalid");
  }

  function assertVoice(voice) {
    if (!VOICES.includes(voice)) throw new RangeError("piece voice is invalid");
  }

  function isCell(value) {
    return value !== null
      && typeof value === "object"
      && !Array.isArray(value)
      && PIECE_TYPES.includes(value.type)
      && VOICES.includes(value.voice);
  }

  function assertBoard(board) {
    if (!Array.isArray(board) || board.length !== BOARD_ROWS) {
      throw new RangeError(`board must contain ${BOARD_ROWS} rows`);
    }
    board.forEach((row, y) => {
      if (!Array.isArray(row) || row.length !== COLS) {
        throw new RangeError(`board row ${y} must contain ${COLS} cells`);
      }
      row.forEach((cell, x) => {
        if (cell !== null && !isCell(cell)) throw new TypeError(`board cell ${x},${y} is invalid`);
      });
    });
  }

  function freezeBoard(rows) {
    return Object.freeze(rows.map((row) => Object.freeze(row)));
  }

  function emptyRow() {
    return Array(COLS).fill(null);
  }

  function createEmptyBoard() {
    return freezeBoard(Array.from({ length: BOARD_ROWS }, emptyRow));
  }

  function createPiece(type, voice = "you") {
    assertPieceType(type);
    assertVoice(voice);
    return Object.freeze({ type, voice, x: 3, y: 0, rotation: 0 });
  }

  function assertPiece(piece) {
    if (piece === null || typeof piece !== "object" || Array.isArray(piece)) {
      throw new TypeError("piece must be an object");
    }
    assertPieceType(piece.type);
    assertVoice(piece.voice);
    assertInteger(piece.x, "piece x", -8, COLS + 8);
    assertInteger(piece.y, "piece y", -8, BOARD_ROWS + 8);
    assertInteger(piece.rotation, "piece rotation", 0, 3);
  }

  function getCells(piece) {
    assertPiece(piece);
    return Object.freeze(SHAPES[piece.type][piece.rotation].map(([x, y]) => Object.freeze([
      piece.x + x,
      piece.y + y
    ])));
  }

  function canPlace(board, piece) {
    assertBoard(board);
    assertPiece(piece);
    return getCells(piece).every(([x, y]) => (
      x >= 0
      && x < COLS
      && y < BOARD_ROWS
      && (y < 0 || board[y][x] === null)
    ));
  }

  function movePiece(board, piece, deltaX, deltaY) {
    assertInteger(deltaX, "deltaX", -COLS, COLS);
    assertInteger(deltaY, "deltaY", -BOARD_ROWS, BOARD_ROWS);
    const candidate = Object.freeze({ ...piece, x: piece.x + deltaX, y: piece.y + deltaY });
    return canPlace(board, candidate) ? candidate : null;
  }

  function rotatePiece(board, piece, direction = 1) {
    assertPiece(piece);
    if (direction !== 1 && direction !== -1) throw new RangeError("rotation direction must be 1 or -1");
    const from = piece.rotation;
    const to = (from + direction + 4) % 4;
    const table = piece.type === "I" ? I_KICKS : JLSTZ_KICKS;
    const kicks = piece.type === "O" ? [[0, 0]] : table[`${from}>${to}`];

    for (let index = 0; index < kicks.length; index += 1) {
      const [deltaX, deltaY] = kicks[index];
      const candidate = Object.freeze({
        ...piece,
        x: piece.x + deltaX,
        y: piece.y + deltaY,
        rotation: to
      });
      if (canPlace(board, candidate)) {
        return Object.freeze({ piece: candidate, kickIndex: index, direction });
      }
    }
    return null;
  }

  function hardDropDistance(board, piece) {
    assertBoard(board);
    assertPiece(piece);
    let distance = 0;
    while (movePiece(board, piece, 0, distance + 1) !== null) distance += 1;
    return distance;
  }

  function lockPiece(board, piece) {
    assertBoard(board);
    assertPiece(piece);
    if (!canPlace(board, piece)) throw new RangeError("piece cannot be locked at its current position");
    const rows = board.map((row) => row.slice());
    const cell = Object.freeze({ type: piece.type, voice: piece.voice });
    const lockedCells = getCells(piece);
    let topOut = false;

    lockedCells.forEach(([x, y]) => {
      if (y < HIDDEN_ROWS) topOut = true;
      if (y >= 0) rows[y][x] = cell;
    });

    return Object.freeze({
      board: freezeBoard(rows),
      cells: lockedCells,
      topOut
    });
  }

  function getFullRows(board) {
    assertBoard(board);
    return Object.freeze(board.reduce((rows, row, index) => {
      if (row.every((cell) => cell !== null)) rows.push(index);
      return rows;
    }, []));
  }

  function clearLines(board, fullRows = getFullRows(board)) {
    assertBoard(board);
    if (!Array.isArray(fullRows)) throw new TypeError("fullRows must be an array");
    const seen = new Set();
    fullRows.forEach((row, index) => {
      assertInteger(row, `fullRows[${index}]`, 0, BOARD_ROWS - 1);
      if (seen.has(row)) throw new RangeError("fullRows cannot contain duplicates");
      if (!board[row].every((cell) => cell !== null)) throw new RangeError(`row ${row} is not full`);
      seen.add(row);
    });
    const rows = board.filter((_, index) => !seen.has(index)).map((row) => row.slice());
    while (rows.length < BOARD_ROWS) rows.unshift(emptyRow());
    return freezeBoard(rows);
  }

  function isPerfectClear(board) {
    assertBoard(board);
    return board.every((row) => row.every((cell) => cell === null));
  }

  function detectTSpin(board, piece, lastActionWasRotation) {
    assertBoard(board);
    assertPiece(piece);
    assertBoolean(lastActionWasRotation, "lastActionWasRotation");
    if (piece.type !== "T" || !lastActionWasRotation) return false;
    const centerX = piece.x + 1;
    const centerY = piece.y + 1;
    const corners = [
      [centerX - 1, centerY - 1],
      [centerX + 1, centerY - 1],
      [centerX - 1, centerY + 1],
      [centerX + 1, centerY + 1]
    ];
    const occupied = corners.filter(([x, y]) => (
      x < 0 || x >= COLS || y < 0 || y >= BOARD_ROWS || board[y][x] !== null
    )).length;
    return occupied >= 3;
  }

  function analyzeRows(board, fullRows) {
    assertBoard(board);
    if (!Array.isArray(fullRows)) throw new TypeError("fullRows must be an array");
    let mutualLines = 0;
    let balancedLines = 0;
    fullRows.forEach((rowIndex) => {
      assertInteger(rowIndex, "row index", 0, BOARD_ROWS - 1);
      const row = board[rowIndex];
      if (!row.every((cell) => isCell(cell))) throw new RangeError(`row ${rowIndex} is not full`);
      const you = row.filter((cell) => cell.voice === "you").length;
      const them = COLS - you;
      if (you > 0 && them > 0) mutualLines += 1;
      if (Math.abs(you - them) <= 2) balancedLines += 1;
    });
    return Object.freeze({ mutualLines, balancedLines });
  }

  function findNearMiss(board) {
    assertBoard(board);
    for (let row = BOARD_ROWS - 1; row >= HIDDEN_ROWS; row -= 1) {
      const gaps = [];
      board[row].forEach((cell, x) => {
        if (cell === null) gaps.push(x);
      });
      if (gaps.length === 1) {
        return Object.freeze({ row, gapX: gaps[0], remaining: 3 });
      }
    }
    return null;
  }

  function assertNearMiss(target) {
    if (target === null || typeof target !== "object" || Array.isArray(target)) {
      throw new TypeError("near-miss target must be an object");
    }
    assertInteger(target.row, "near-miss row", HIDDEN_ROWS, BOARD_ROWS - 1);
    assertInteger(target.gapX, "near-miss gapX", 0, COLS - 1);
    assertInteger(target.remaining, "near-miss remaining", 1, 3);
  }

  function resolveNearMiss(target, lockedCells, fullRows) {
    assertNearMiss(target);
    if (!Array.isArray(lockedCells) || !Array.isArray(fullRows)) {
      throw new TypeError("lockedCells and fullRows must be arrays");
    }
    const filledPromise = lockedCells.some(([x, y]) => x === target.gapX && y === target.row);
    return filledPromise && fullRows.includes(target.row);
  }

  function shiftNearMiss(target, fullRows, boardAfterClear) {
    assertNearMiss(target);
    if (!Array.isArray(fullRows)) throw new TypeError("fullRows must be an array");
    assertBoard(boardAfterClear);
    if (fullRows.includes(target.row) || target.remaining <= 1) return null;
    const shiftedRow = target.row + fullRows.filter((row) => row > target.row).length;
    if (shiftedRow >= BOARD_ROWS) return null;
    const row = boardAfterClear[shiftedRow];
    const gapCount = row.filter((cell) => cell === null).length;
    if (gapCount !== 1 || row[target.gapX] !== null) return null;
    return Object.freeze({ row: shiftedRow, gapX: target.gapX, remaining: target.remaining - 1 });
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
    Object.defineProperty(random, "getState", { value: () => state, enumerable: true });
    return Object.freeze(random);
  }

  function makeBag(random) {
    if (typeof random !== "function") throw new TypeError("random must be a function");
    const bag = PIECE_TYPES.slice();
    for (let index = bag.length - 1; index > 0; index -= 1) {
      const value = random();
      if (!Number.isFinite(value) || value < 0 || value >= 1) {
        throw new RangeError("random must return a number in [0, 1)");
      }
      const swap = Math.floor(value * (index + 1));
      [bag[index], bag[swap]] = [bag[swap], bag[index]];
    }
    return Object.freeze(bag);
  }

  function freezeQueue(queue, bag, rngState, size, voiceIndex) {
    return Object.freeze({
      queue: Object.freeze(queue),
      bag: Object.freeze(bag),
      rngState,
      size,
      voiceIndex
    });
  }

  function assertQueue(state) {
    if (state === null || typeof state !== "object" || Array.isArray(state)) {
      throw new TypeError("queue state must be an object");
    }
    assertInteger(state.size, "queue size", 1, 14);
    assertInteger(state.rngState, "queue rngState", 0, MAX_UINT32);
    assertInteger(state.voiceIndex, "queue voiceIndex", 0, Number.MAX_SAFE_INTEGER);
    if (!Array.isArray(state.queue) || state.queue.length !== state.size) {
      throw new RangeError("queue must match its configured size");
    }
    if (!Array.isArray(state.bag) || state.bag.length > PIECE_TYPES.length) {
      throw new RangeError("queue bag is invalid");
    }
    [...state.queue, ...state.bag].forEach(assertPieceType);
  }

  function fillQueue(queue, bag, random, size) {
    while (queue.length < size) {
      if (bag.length === 0) bag.push(...makeBag(random));
      queue.push(bag.shift());
    }
    return bag;
  }

  function createQueue(seed, size = 5) {
    assertInteger(size, "queue size", 1, 14);
    const random = createRng(seed);
    const queue = [];
    const bag = [];
    fillQueue(queue, bag, random, size);
    return freezeQueue(queue, bag, random.getState(), size, 0);
  }

  function peekQueue(state, offset = 0) {
    assertQueue(state);
    assertInteger(offset, "queue offset", 0, state.size - 1);
    return state.queue[offset];
  }

  function takeNext(state) {
    assertQueue(state);
    const random = createRng(state.rngState);
    const queue = state.queue.slice();
    const bag = state.bag.slice();
    const type = queue.shift();
    fillQueue(queue, bag, random, state.size);
    const voice = VOICES[state.voiceIndex % VOICES.length];
    return Object.freeze({
      piece: Object.freeze({ type, voice }),
      state: freezeQueue(queue, bag, random.getState(), state.size, state.voiceIndex + 1)
    });
  }

  function createScoreState() {
    return Object.freeze({
      score: 0,
      lines: 0,
      level: 1,
      combo: -1,
      backToBack: false
    });
  }

  function assertScoreState(state) {
    if (state === null || typeof state !== "object" || Array.isArray(state)) {
      throw new TypeError("score state must be an object");
    }
    assertInteger(state.score, "score", 0, Number.MAX_SAFE_INTEGER);
    assertInteger(state.lines, "lines", 0, Number.MAX_SAFE_INTEGER);
    assertInteger(state.level, "level", 1, 999);
    assertInteger(state.combo, "combo", -1, Number.MAX_SAFE_INTEGER);
    assertBoolean(state.backToBack, "backToBack");
    if (state.level !== Math.floor(state.lines / 10) + 1) {
      throw new RangeError("score level must match cleared lines");
    }
  }

  function scoreLock(state, event) {
    assertScoreState(state);
    if (event === null || typeof event !== "object" || Array.isArray(event)) {
      throw new TypeError("score event must be an object");
    }
    const mutualLines = event.mutualLines === undefined ? 0 : event.mutualLines;
    const balancedLines = event.balancedLines === undefined ? 0 : event.balancedLines;
    const nearMissResolved = event.nearMissResolved === undefined ? false : event.nearMissResolved;
    const perfectClear = event.perfectClear === undefined ? false : event.perfectClear;
    const softDrop = event.softDrop === undefined ? 0 : event.softDrop;
    const hardDrop = event.hardDrop === undefined ? 0 : event.hardDrop;
    assertInteger(event.lines, "cleared lines", 0, 4);
    assertBoolean(event.tSpin, "tSpin");
    if (event.tSpin && event.lines > 3) throw new RangeError("a T-spin cannot clear four lines");
    assertInteger(mutualLines, "mutualLines", 0, event.lines);
    assertInteger(balancedLines, "balancedLines", 0, event.lines);
    assertBoolean(nearMissResolved, "nearMissResolved");
    assertBoolean(perfectClear, "perfectClear");
    assertInteger(softDrop, "softDrop", 0, BOARD_ROWS);
    assertInteger(hardDrop, "hardDrop", 0, BOARD_ROWS);
    if (balancedLines > mutualLines) {
      throw new RangeError("balanced lines must also be mutual lines");
    }

    const ordinary = [0, 100, 300, 500, 800];
    const tSpins = [400, 800, 1200, 1600, 1600];
    const difficult = event.lines === 4 || (event.tSpin && event.lines > 0);
    const base = (event.tSpin ? tSpins[event.lines] : ordinary[event.lines]) * state.level;
    const backToBackBonus = difficult && state.backToBack ? Math.floor(base * 0.5) : 0;
    const combo = event.lines > 0 ? state.combo + 1 : -1;
    const comboBonus = event.lines > 0 && combo > 0 ? 50 * combo * state.level : 0;
    const harmonyBonus = (mutualLines * 35 + balancedLines * 15) * state.level;
    const promiseBonus = nearMissResolved ? 300 * state.level : 0;
    const perfectClearBonus = perfectClear ? 2000 * state.level : 0;
    const dropBonus = softDrop + hardDrop * 2;
    const points = base + backToBackBonus + comboBonus + harmonyBonus
      + promiseBonus + perfectClearBonus + dropBonus;
    const lines = state.lines + event.lines;
    const level = Math.floor(lines / 10) + 1;
    const backToBack = event.lines === 0 ? state.backToBack : difficult;
    const score = state.score + points;
    if (!Number.isSafeInteger(score)) throw new RangeError("score exceeds the supported range");

    return Object.freeze({
      state: Object.freeze({ score, lines, level, combo, backToBack }),
      points,
      base,
      backToBackBonus,
      comboBonus,
      harmonyBonus,
      promiseBonus,
      perfectClearBonus,
      dropBonus,
      difficult,
      backToBackContinued: difficult && state.backToBack,
      comboContinued: combo > 0
    });
  }

  function gravityMs(level) {
    assertInteger(level, "level", 1, 999);
    const base = Math.max(0.1, 0.8 - (level - 1) * 0.007);
    return Math.max(70, Math.round(1000 * Math.pow(base, level - 1)));
  }

  return Object.freeze({
    COLS,
    VISIBLE_ROWS,
    HIDDEN_ROWS,
    BOARD_ROWS,
    PIECE_TYPES,
    VOICES,
    SHAPES,
    createEmptyBoard,
    createPiece,
    getCells,
    canPlace,
    movePiece,
    rotatePiece,
    hardDropDistance,
    lockPiece,
    getFullRows,
    clearLines,
    isPerfectClear,
    detectTSpin,
    analyzeRows,
    findNearMiss,
    resolveNearMiss,
    shiftNearMiss,
    createRng,
    makeBag,
    createQueue,
    peekQueue,
    takeNext,
    createScoreState,
    scoreLock,
    gravityMs
  });
});
