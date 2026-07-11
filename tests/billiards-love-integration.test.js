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
    this.offsetWidth = 640;
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  focus() {}
  setPointerCapture() {}
  releasePointerCapture() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 640 }; }
}

function createDrawingContext() {
  const gradient = () => ({ addColorStop() {} });
  const methods = new Set([
    "save", "restore", "clearRect", "fillRect", "beginPath", "moveTo", "lineTo", "arcTo",
    "closePath", "fill", "stroke", "arc", "clip", "translate", "rotate", "setLineDash", "fillText"
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

function assertFiniteTable(snapshot) {
  for (const ball of snapshot.balls) {
    for (const key of ["x", "y", "vx", "vy"]) assert.equal(Number.isFinite(ball[key]), true, `${ball.number}.${key}`);
    assert.ok(ball.x >= 80 && ball.x <= 1200, `ball ${ball.number} escaped horizontally`);
    assert.ok(ball.y >= 5 && ball.y <= 635, `ball ${ball.number} escaped vertically`);
  }
}

test("boots the real browser runtime with one cue ball and a complete standard rack", () => {
  const debug = bootRuntime();
  debug.reset();
  const snapshot = debug.snapshot();
  assert.deepEqual([...snapshot.ballNumbers], Array.from({ length: 16 }, (_, number) => number));
  assert.equal(snapshot.runState.breakCompleted, false);
  assert.equal(snapshot.runState.interest, 100);
  assertFiniteTable(snapshot);
});

test("inverse-maps a rotated portrait table without DPR or letterbox offset drift", () => {
  const debug = bootRuntime();
  const portrait = { left: 25, top: 140, width: 360, height: 720 };
  const landscape = { left: 10, top: 20, width: 1280, height: 640 };

  assert.deepEqual({ ...debug.mapClientPoint(205, 500, portrait) }, { x: 640, y: 320 });
  assert.deepEqual({ ...debug.mapClientPoint(650, 340, landscape) }, { x: 640, y: 320 });
  assert.deepEqual({ ...debug.mapClientPoint(385, 140, portrait) }, { x: 0, y: 0 });
  assert.deepEqual({ ...debug.mapClientPoint(25, 860, portrait) }, { x: 1280, y: 640 });
});

test("executes and settles a full-power opening break without NaN, tunnelling, or duplicate settlement", () => {
  const debug = bootRuntime();
  debug.reset();
  assert.equal(debug.shoot(0.94, { x: 1, y: 0 }), true);
  const settled = debug.step(6500);
  assert.equal(settled.moving, false);
  assert.equal(settled.runState.breakCompleted, true);
  assert.equal(settled.runState.shots, 1);
  assertFiniteTable(settled);

  const afterIdle = debug.step(600);
  assert.equal(afterIdle.runState.shots, 1, "a settled shot must be evaluated exactly once");
});

test("declares a legal relationship target and settles the next normal shot", () => {
  const debug = bootRuntime();
  debug.reset();
  debug.shoot(0.9, { x: 1, y: 0 });
  let snapshot = debug.step(6500);
  const present = new Set(snapshot.ballNumbers);
  const target = BilliardsLoveRules.availableTargets(snapshot.runState).find((number) => present.has(number));
  assert.ok(target, "at least one current-stage ball should remain selectable");
  debug.select(target);
  assert.equal(debug.snapshot().selectedBallNumber, target);
  assert.equal(debug.shoot(0.44), true);
  snapshot = debug.step(6500);
  assert.equal(snapshot.runState.shots, 2);
  assert.equal(snapshot.moving, false);
  assertFiniteTable(snapshot);
});
