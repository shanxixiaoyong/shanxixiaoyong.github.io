const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const rules = require("../assets/tetris-love-rules.js");

function mutableBoard() {
  return Array.from({ length: rules.BOARD_ROWS }, () => Array(rules.COLS).fill(null));
}

function cell(type = "I", voice = "you") {
  return { type, voice };
}

function collect(seed, count) {
  let state = rules.createQueue(seed, 5);
  const pieces = [];
  for (let index = 0; index < count; index += 1) {
    const next = rules.takeNext(state);
    pieces.push(next.piece);
    state = next.state;
  }
  return pieces;
}

test("exports an immutable 10 by 20 rules contract in CommonJS and browsers", () => {
  assert.equal(rules.COLS, 10);
  assert.equal(rules.VISIBLE_ROWS, 20);
  assert.equal(rules.HIDDEN_ROWS, 2);
  assert.equal(rules.BOARD_ROWS, 22);
  assert.deepEqual(rules.PIECE_TYPES, ["I", "J", "L", "O", "S", "T", "Z"]);
  assert.deepEqual(rules.VOICES, ["you", "them"]);
  assert.ok(Object.isFrozen(rules));
  assert.ok(Object.isFrozen(rules.SHAPES));
  assert.ok(Object.values(rules.SHAPES).every(Object.isFrozen));

  const source = fs.readFileSync(path.join(__dirname, "../assets/tetris-love-rules.js"), "utf8");
  const browser = {};
  vm.runInNewContext(source, browser, { filename: "tetris-love-rules.js" });
  assert.equal(browser.TetrisLoveRules.COLS, 10);
  assert.equal(typeof browser.TetrisLoveRules.scoreLock, "function");
});

test("seven-bag queues are deterministic and alternate the two life threads", () => {
  const first = collect(20260711, 21);
  const replay = collect(20260711, 21);
  const other = collect(20260712, 21);
  assert.deepEqual(first, replay);
  assert.notDeepEqual(first, other);

  for (let offset = 0; offset < 21; offset += 7) {
    assert.deepEqual(
      first.slice(offset, offset + 7).map(({ type }) => type).sort(),
      [...rules.PIECE_TYPES].sort()
    );
  }
  assert.deepEqual(
    first.slice(0, 8).map(({ voice }) => voice),
    ["you", "them", "you", "them", "you", "them", "you", "them"]
  );

  const state = rules.createQueue(42);
  const snapshot = JSON.parse(JSON.stringify(state));
  const next = rules.takeNext(state);
  assert.equal(next.piece.type, rules.peekQueue(state));
  assert.deepEqual(state, snapshot);
  assert.ok(Object.isFrozen(state));
  assert.ok(Object.isFrozen(state.queue));
  assert.ok(Object.isFrozen(next.piece));
});

test("queue and random helpers reject malformed input", () => {
  assert.throws(() => rules.createRng(1.5), TypeError);
  assert.throws(() => rules.createQueue("7"), TypeError);
  assert.throws(() => rules.createQueue(7, 0), RangeError);
  assert.throws(() => rules.createQueue(7, 15), RangeError);
  assert.throws(() => rules.makeBag(), TypeError);
  assert.throws(() => rules.makeBag(() => 1), RangeError);
  assert.throws(() => rules.peekQueue(rules.createQueue(2), 5), RangeError);
  assert.throws(() => rules.takeNext({}), TypeError);
});

test("movement, ghost distance, locking, and collision preserve board state", () => {
  const board = rules.createEmptyBoard();
  const piece = rules.createPiece("I", "you");
  const original = JSON.parse(JSON.stringify(board));
  assert.equal(rules.canPlace(board, piece), true);
  assert.equal(rules.hardDropDistance(board, piece), 20);

  let left = piece;
  for (let index = 0; index < 3; index += 1) left = rules.movePiece(board, left, -1, 0);
  assert.equal(left.x, 0);
  assert.equal(rules.movePiece(board, left, -1, 0), null);

  const landed = { ...piece, y: piece.y + rules.hardDropDistance(board, piece) };
  const locked = rules.lockPiece(board, landed);
  assert.equal(locked.topOut, false);
  assert.equal(locked.cells.every(([, y]) => y === rules.BOARD_ROWS - 1), true);
  assert.equal(locked.board[rules.BOARD_ROWS - 1].filter(Boolean).length, 4);
  assert.equal(rules.canPlace(locked.board, landed), false);
  assert.deepEqual(board, original);
  assert.ok(Object.isFrozen(locked.board));
  assert.ok(locked.board.every(Object.isFrozen));
});

test("SRS rotation kicks an I piece away from the left wall", () => {
  const board = rules.createEmptyBoard();
  const verticalAtWall = { type: "I", voice: "them", x: -2, y: 4, rotation: 1 };
  assert.equal(rules.canPlace(board, verticalAtWall), true);
  const result = rules.rotatePiece(board, verticalAtWall, 1);
  assert.ok(result);
  assert.equal(result.piece.rotation, 2);
  assert.equal(result.piece.x, 0);
  assert.equal(result.kickIndex, 2);
  assert.equal(rules.canPlace(board, result.piece), true);
});

test("full rows report both life threads and clear without mutation", () => {
  const board = mutableBoard();
  board[rules.BOARD_ROWS - 1] = Array.from({ length: rules.COLS }, (_, index) => (
    cell(index % 2 ? "Z" : "I", index % 2 ? "them" : "you")
  ));
  const before = JSON.parse(JSON.stringify(board));
  const rows = rules.getFullRows(board);
  assert.deepEqual(rows, [rules.BOARD_ROWS - 1]);
  assert.deepEqual(rules.analyzeRows(board, rows), { mutualLines: 1, balancedLines: 1 });
  const cleared = rules.clearLines(board, rows);
  assert.equal(rules.isPerfectClear(cleared), true);
  assert.deepEqual(board, before);
});

test("three occupied T corners recognize a rotation finish", () => {
  const board = mutableBoard();
  board[5][3] = cell("J", "you");
  board[5][5] = cell("L", "them");
  board[7][3] = cell("S", "you");
  const piece = { type: "T", voice: "them", x: 3, y: 5, rotation: 0 };
  assert.equal(rules.detectTSpin(board, piece, true), true);
  assert.equal(rules.detectTSpin(board, piece, false), false);
  assert.equal(rules.detectTSpin(board, { ...piece, type: "L" }, true), false);
});

test("near-miss promises target one exact gap and follow shifted rows", () => {
  const board = mutableBoard();
  board[21] = Array.from({ length: rules.COLS }, (_, x) => (
    x === 4 ? null : cell(x % 2 ? "T" : "S", x % 2 ? "them" : "you")
  ));
  const target = rules.findNearMiss(board);
  assert.deepEqual(target, { row: 21, gapX: 4, remaining: 3 });
  assert.equal(rules.resolveNearMiss(target, [[4, 21]], [21]), true);
  assert.equal(rules.resolveNearMiss(target, [[3, 21]], [21]), false);

  const shifting = mutableBoard();
  shifting[20] = Array.from({ length: rules.COLS }, (_, x) => (
    x === 3 ? null : cell("J", x % 2 ? "them" : "you")
  ));
  shifting[21] = Array.from({ length: rules.COLS }, (_, x) => cell("O", x % 2 ? "them" : "you"));
  const afterClear = rules.clearLines(shifting, [21]);
  assert.deepEqual(
    rules.shiftNearMiss({ row: 20, gapX: 3, remaining: 3 }, [21], afterClear),
    { row: 21, gapX: 3, remaining: 2 }
  );
  assert.equal(rules.shiftNearMiss({ row: 20, gapX: 3, remaining: 1 }, [21], afterClear), null);
});

test("scoring couples harmony, combo, difficult clears, promises, and drop effort", () => {
  const first = rules.scoreLock(rules.createScoreState(), {
    lines: 1,
    tSpin: false,
    mutualLines: 1,
    balancedLines: 1
  });
  assert.equal(first.points, 150);
  assert.equal(first.state.combo, 0);
  assert.equal(first.state.backToBack, false);

  const four = rules.scoreLock(first.state, {
    lines: 4,
    tSpin: false,
    mutualLines: 4,
    balancedLines: 4
  });
  assert.equal(four.points, 1050);
  assert.equal(four.comboBonus, 50);
  assert.equal(four.harmonyBonus, 200);
  assert.equal(four.state.backToBack, true);

  const repeated = rules.scoreLock(four.state, {
    lines: 4,
    tSpin: false,
    mutualLines: 4,
    balancedLines: 4
  });
  assert.equal(repeated.points, 1500);
  assert.equal(repeated.backToBackBonus, 400);
  assert.equal(repeated.backToBackContinued, true);
  assert.equal(repeated.state.combo, 2);

  const pause = rules.scoreLock(repeated.state, {
    lines: 0,
    tSpin: false,
    softDrop: 2,
    hardDrop: 3
  });
  assert.equal(pause.points, 8);
  assert.equal(pause.state.combo, -1);
  assert.equal(pause.state.backToBack, true);

  const promise = rules.scoreLock(rules.createScoreState(), {
    lines: 1,
    tSpin: false,
    nearMissResolved: true,
    perfectClear: true
  });
  assert.equal(promise.promiseBonus, 300);
  assert.equal(promise.perfectClearBonus, 2000);
  assert.equal(promise.points, 2400);
});

test("levels advance every ten lines and gravity remains bounded", () => {
  const levelUp = rules.scoreLock({ score: 0, lines: 9, level: 1, combo: -1, backToBack: false }, {
    lines: 1,
    tSpin: false
  });
  assert.equal(levelUp.state.lines, 10);
  assert.equal(levelUp.state.level, 2);

  const intervals = Array.from({ length: 20 }, (_, index) => rules.gravityMs(index + 1));
  assert.equal(intervals[0], 1000);
  assert.ok(intervals.every((value) => value >= 70));
  assert.ok(intervals.every((value, index) => index === 0 || value <= intervals[index - 1]));
});

test("scoring rejects impossible or weakly typed events", () => {
  const state = rules.createScoreState();
  assert.throws(() => rules.scoreLock({}, { lines: 0, tSpin: false }), TypeError);
  assert.throws(() => rules.scoreLock(state, { lines: 5, tSpin: false }), RangeError);
  assert.throws(() => rules.scoreLock(state, { lines: 4, tSpin: true }), RangeError);
  assert.throws(() => rules.scoreLock(state, { lines: 1, tSpin: false, mutualLines: 2 }), RangeError);
  assert.throws(() => rules.scoreLock(state, { lines: 1, tSpin: false, nearMissResolved: 1 }), TypeError);
  assert.throws(() => rules.scoreLock(state, { lines: 1, tSpin: false, balancedLines: 1 }), RangeError);
  assert.throws(() => rules.gravityMs(0), RangeError);
});
