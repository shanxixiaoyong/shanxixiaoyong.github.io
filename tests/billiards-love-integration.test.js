const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets/billiards-love-game.js"), "utf8");
const Matter = require("../assets/vendor/matter-0.20.0.min.js");
const BilliardsLoveRules = require("../assets/billiards-love-rules.js");
const BilliardsLoveContent = require("../assets/billiards-love-content.js");
const FIXED_VM_STEP = 1000 / 120;

class FakeClassList {
  constructor() {
    this.values = new Set();
  }
  add(...values) { values.forEach((value) => this.values.add(value)); }
  remove(...values) { values.forEach((value) => this.values.delete(value)); }
  toggle(value, force) {
    if (force === undefined) force = !this.values.has(value);
    if (force) this.values.add(value);
    else this.values.delete(value);
    return force;
  }
  contains(value) { return this.values.has(value); }
}

class FakeNode {
  constructor(tag = "div") {
    this.tagName = tag.toUpperCase();
    this.hidden = false;
    this.textContent = "";
    this.dataset = {};
    this.attributes = {};
    this.children = [];
    this.listeners = new Map();
    this.classList = new FakeClassList();
    this.style = { setProperty(name, value) { this[name] = value; } };
    this.offsetWidth = 360;
    this.rect = { left: 0, top: 0, width: 360, height: 720 };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  focus() {}
  setPointerCapture() {}
  releasePointerCapture() {}
  getBoundingClientRect() { return { ...this.rect }; }
}

function createDrawingContext() {
  const gradient = () => ({ addColorStop() {} });
  const methods = new Set([
    "save", "restore", "clearRect", "fillRect", "beginPath", "moveTo", "lineTo", "arcTo",
    "closePath", "fill", "stroke", "arc", "clip", "translate", "rotate", "scale", "setTransform",
    "setLineDash", "fillText"
  ]);
  return new Proxy({}, {
    get(target, property) {
      if (property === "createLinearGradient" || property === "createRadialGradient") return gradient;
      if (methods.has(property)) return () => {};
      return target[property];
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    }
  });
}

function bootRuntime() {
  const nodes = new Map();
  const drawingContext = createDrawingContext();
  const canvas = new FakeNode("canvas");
  canvas.getContext = () => drawingContext;
  const querySelector = (selector) => {
    if (!nodes.has(selector)) nodes.set(selector, selector === "#hb-canvas" ? canvas : new FakeNode());
    return nodes.get(selector);
  };
  const document = {
    hidden: false,
    querySelector,
    createElement: (tag) => new FakeNode(tag),
    createDocumentFragment: () => new FakeNode("fragment"),
    addEventListener() {}
  };
  const localValues = new Map();
  const localStorage = {
    getItem: (key) => localValues.has(key) ? localValues.get(key) : null,
    setItem: (key, value) => localValues.set(key, String(value))
  };
  const window = {
    Matter,
    BilliardsLoveRules,
    BilliardsLoveContent,
    localStorage,
    devicePixelRatio: 4,
    addEventListener() {}
  };
  const sandbox = {
    window,
    document,
    localStorage,
    console,
    performance,
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
    setTimeout: () => 1,
    clearTimeout() {}
  };
  vm.runInNewContext(source, sandbox, { filename: "billiards-love-game.js" });
  return window.__heartbeatBilliardsDebug;
}

function findBall(snapshot, number) {
  return snapshot.balls.find((ball) => ball.number === number);
}

function assertFiniteTable(snapshot) {
  for (const ball of snapshot.balls) {
    for (const key of ["x", "y", "vx", "vy", "rollAngle", "rollVelocity"]) {
      assert.equal(Number.isFinite(ball[key]), true, `${ball.number}.${key}`);
    }
    assert.ok(ball.x >= 5 && ball.x <= 715, `ball ${ball.number} escaped horizontally`);
    assert.ok(ball.y >= 80 && ball.y <= 1360, `ball ${ball.number} escaped vertically`);
  }
}

test("boots immediately into a playable portrait rack with bounded high-DPR output", () => {
  const debug = bootRuntime();
  const snapshot = debug.snapshot();
  assert.equal(snapshot.started, true);
  assert.equal(Object.hasOwn(snapshot, "paused"), false);
  assert.deepEqual({ ...snapshot.world }, { width: 720, height: 1440 });
  assert.deepEqual([...snapshot.ballNumbers], Array.from({ length: 16 }, (_, number) => number));
  assert.equal(snapshot.runState.breakCompleted, false);
  assert.equal(snapshot.runState.interest, 100);
  assert.ok(snapshot.cue.y > Math.max(...snapshot.balls.filter((ball) => ball.number > 0).map((ball) => ball.y)));
  assert.ok(snapshot.render.width <= 1440);
  assert.ok(snapshot.render.height <= 2880);
  assert.ok(snapshot.render.width * snapshot.render.height <= 1440 * 2880);
  assert.equal(debug.shoot(0.22), true, "the first shot must not wait for a start action");
});

test("maps touch points directly into the portrait world", () => {
  const debug = bootRuntime();
  const portrait = { left: 25, top: 140, width: 360, height: 720 };

  assert.deepEqual({ ...debug.mapClientPoint(205, 500, portrait) }, { x: 360, y: 720 });
  assert.deepEqual({ ...debug.mapClientPoint(25, 140, portrait) }, { x: 0, y: 0 });
  assert.deepEqual({ ...debug.mapClientPoint(385, 860, portrait) }, { x: 720, y: 1440 });
  assert.deepEqual({ ...debug.mapClientPoint(385, 140, portrait) }, { x: 720, y: 0 });
});

test("launches the default opening shot upward and accumulates physical roll", () => {
  const debug = bootRuntime();
  debug.reset();
  const before = findBall(debug.snapshot(), 0);
  assert.equal(debug.shoot(0.94), true);
  const snapshot = debug.step(1);
  const cue = findBall(snapshot, 0);
  assert.ok(cue.vy < 0, `expected upward velocity, received ${cue.vy}`);
  assert.ok(Math.abs(cue.vx) < 1e-9, `expected vertical break, received vx ${cue.vx}`);
  assert.notEqual(cue.rollAngle, before.rollAngle);
  assert.ok(Math.abs(cue.rollVelocity) > 0);
  assert.ok(cue.y < before.y);
});

test("emits compression and an impact ring on a real opening collision", () => {
  const debug = bootRuntime();
  debug.reset();
  debug.shoot(1);
  let impact = null;
  for (let step = 0; step < 180; step += 1) {
    const snapshot = debug.step(1);
    if (snapshot.collisionCount > 0) {
      impact = snapshot;
      break;
    }
  }
  assert.ok(impact, "the cue ball should reach the rack");
  assert.ok(impact.collisionFeedbackCount > 0, "collision ring should be alive on impact");
  assert.ok(impact.balls.some((ball) => ball.compression > 0 && ball.impactGlow > 0));
});

test("settles a full upward opening break without NaN, tunnelling, or duplicate settlement", () => {
  const debug = bootRuntime();
  debug.reset();
  assert.equal(debug.shoot(0.94), true);
  const settled = debug.step(7000);
  assert.equal(settled.moving, false);
  assert.equal(settled.runState.breakCompleted, true);
  assert.equal(settled.runState.shots, 1);
  assert.ok(settled.collisionCount > 0);
  assertFiniteTable(settled);

  const afterIdle = debug.step(600);
  assert.equal(afterIdle.runState.shots, 1, "a settled shot must be evaluated exactly once");
});

test("settles a normal shot directly without selecting a relationship target", () => {
  const debug = bootRuntime();
  debug.reset();
  debug.shoot(0.9);
  let snapshot = debug.step(7000);
  assert.equal(snapshot.selectedBallNumber, null);
  assert.equal(debug.shoot(0.44), true);
  snapshot = debug.step(7000);
  assert.equal(snapshot.runState.shots, 2);
  assert.equal(snapshot.moving, false);
  assertFiniteTable(snapshot);
});

test("keeps an object ball physical until its pocket animation completes, then settles it once", () => {
  const debug = bootRuntime();
  debug.reset();
  debug.shoot(0.18);
  const pocket = debug.snapshot().pockets.find((item) => item.id === "top-left");
  assert.equal(debug.placeBall(1, pocket), true);

  let snapshot = debug.step(1);
  let ball = findBall(snapshot, 1);
  assert.ok(ball.pocketing);
  assert.ok(ball.pocketing.durationMs >= 280 && ball.pocketing.durationMs <= 450);
  assert.ok(ball.pocketing.scale < 1 && ball.pocketing.depth > 0);
  assert.equal(snapshot.ballNumbers.includes(1), true);
  assert.equal(snapshot.shotPottedNumbers.includes(1), false, "settlement must wait for the visual descent");
  assert.equal(snapshot.runState.pottedNumbers.includes(1), false);
  assert.equal(snapshot.runState.shots, 0);

  snapshot = debug.step(10);
  ball = findBall(snapshot, 1);
  assert.ok(ball?.pocketing, "ball should still be descending after less than 100ms");
  assert.ok(ball.pocketing.rotation !== 0);

  const stepsToCompletion = Math.ceil((ball.pocketing.durationMs - ball.pocketing.elapsedMs) / FIXED_VM_STEP);
  snapshot = debug.step(stepsToCompletion - 1);
  ball = findBall(snapshot, 1);
  assert.ok(ball?.pocketing, "ball must remain physical through the final incomplete fixed step");
  assert.ok(ball.pocketing.elapsedMs < ball.pocketing.durationMs);
  assert.equal(snapshot.runState.pottedNumbers.includes(1), false);
  assert.equal(snapshot.runState.shots, 0);

  snapshot = debug.step(1);
  assert.equal(findBall(snapshot, 1), undefined);
  assert.equal(snapshot.shotPottedNumbers.includes(1), true);
  assert.equal(snapshot.runState.pottedNumbers.includes(1), false, "rules settle only after all motion ends");
  assert.equal(snapshot.runState.shots, 0);

  const settled = debug.step(7000);
  assert.equal(settled.runState.pottedNumbers.filter((number) => number === 1).length, 1);
  assert.equal(settled.runState.shots, 1);
  assert.equal(debug.step(600).runState.shots, 1);
});

test("animates a cue scratch before removing and respotting the white ball", () => {
  const debug = bootRuntime();
  debug.reset();
  debug.shoot(0.12);
  const pocket = debug.snapshot().pockets.find((item) => item.id === "bottom-right");
  assert.equal(debug.placeBall(0, pocket), true);

  let snapshot = debug.step(1);
  assert.ok(findBall(snapshot, 0).pocketing);
  snapshot = debug.step(10);
  let cue = findBall(snapshot, 0);
  assert.ok(cue?.pocketing);
  assert.equal(snapshot.runState.cueScratches, 0);

  const stepsToCompletion = Math.ceil((cue.pocketing.durationMs - cue.pocketing.elapsedMs) / FIXED_VM_STEP);
  snapshot = debug.step(stepsToCompletion - 1);
  cue = findBall(snapshot, 0);
  assert.ok(cue?.pocketing);
  assert.ok(cue.pocketing.elapsedMs < cue.pocketing.durationMs);
  assert.equal(snapshot.runState.cueScratches, 0);

  snapshot = debug.step(1);
  assert.equal(findBall(snapshot, 0), undefined);
  assert.equal(snapshot.cue, null);
  assert.equal(snapshot.runState.cueScratches, 0);

  snapshot = debug.step(30);
  assert.ok(snapshot.cue, "the cue ball should be respotted after its descent and shot settlement");
  assert.equal(snapshot.runState.cueScratches, 1);
  assert.equal(snapshot.runState.shots, 1);
  assert.ok(snapshot.cue.y > snapshot.world.height / 2);
});

test("visibility timing resets do not add a pause state or interaction gate", () => {
  const debug = bootRuntime();
  const before = debug.snapshot();
  const after = debug.visibilityChange();
  assert.equal(before.started, true);
  assert.equal(after.started, true);
  assert.equal(Object.hasOwn(after, "paused"), false);
  assert.equal(debug.shoot(0.2), true);
});
