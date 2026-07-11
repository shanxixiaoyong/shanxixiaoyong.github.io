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

function createDrawingContext(calls = []) {
  const gradient = () => ({ addColorStop() {} });
  const methods = new Set([
    "save", "restore", "clearRect", "fillRect", "beginPath", "moveTo", "lineTo", "arcTo",
    "closePath", "fill", "stroke", "arc", "clip", "translate", "rotate", "scale", "setTransform",
    "setLineDash", "fillText"
  ]);
  return new Proxy({}, {
    get(target, property) {
      if (property === "createLinearGradient" || property === "createRadialGradient") {
        return (...args) => {
          calls.push({ method: property, args });
          return gradient();
        };
      }
      if (methods.has(property)) return (...args) => calls.push({ method: property, args });
      return target[property];
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    }
  });
}

function bootRuntime(options = {}) {
  const nodes = new Map();
  const drawingContext = createDrawingContext(options.drawCalls);
  const canvas = new FakeNode("canvas");
  canvas.getContext = () => drawingContext;
  const ballCanvas = new FakeNode("canvas");
  const querySelector = (selector) => {
    if (selector === "#hb-ball-canvas") return options.includeBallCanvas ? ballCanvas : null;
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
  if (options.BilliardsBallRenderer) window.BilliardsBallRenderer = options.BilliardsBallRenderer;
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

function pocketApproach(pocket, inwardDistance = 14, speed = 8) {
  return {
    point: {
      x: pocket.mouthX - pocket.inwardX * inwardDistance,
      y: pocket.mouthY - pocket.inwardY * inwardDistance
    },
    velocity: { x: pocket.inwardX * speed, y: pocket.inwardY * speed }
  };
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
  assert.deepEqual({ ...snapshot.table }, { left: 74, right: 646, top: 148, bottom: 1292 });
  assert.equal((snapshot.table.bottom - snapshot.table.top) / (snapshot.table.right - snapshot.table.left), 2);
  assert.equal(snapshot.wpaPocketSpec.ballDiameter, 14.85 * 2);
  assert.equal(snapshot.wpaPocketSpec.cornerMouthRatio, 2);
  assert.ok(Math.abs(snapshot.wpaPocketSpec.sideMouthRatio - 2.22) < 1e-12);
  assert.ok(Math.abs(snapshot.wpaPocketSpec.cornerShelf / snapshot.wpaPocketSpec.ballDiameter - 0.65) < 1e-12);
  assert.ok(Math.abs(snapshot.wpaPocketSpec.sideShelf / snapshot.wpaPocketSpec.ballDiameter - 0.14) < 1e-12);
  assert.equal(snapshot.wpaPocketSpec.cornerCutAngleDegrees, 142);
  assert.equal(snapshot.wpaPocketSpec.sideCutAngleDegrees, 104);
  for (const pocket of snapshot.pockets) {
    const expectedMouthRatio = pocket.type === "corner" ? 2 : 2.22;
    const expectedShelfRatio = pocket.type === "corner" ? 0.65 : 0.14;
    const dropDepth = (pocket.x - pocket.mouthX) * pocket.inwardX + (pocket.y - pocket.mouthY) * pocket.inwardY;
    const captureDepth = (pocket.captureX - pocket.mouthX) * pocket.inwardX
      + (pocket.captureY - pocket.mouthY) * pocket.inwardY;
    assert.ok(Math.abs(pocket.mouth / snapshot.wpaPocketSpec.ballDiameter - expectedMouthRatio) < 1e-12);
    assert.ok(Math.abs(pocket.shelf / snapshot.wpaPocketSpec.ballDiameter - expectedShelfRatio) < 1e-12);
    assert.ok(dropDepth > pocket.shelf, `${pocket.id} drop center must be beyond its shelf`);
    assert.ok(dropDepth >= pocket.shelf + snapshot.wpaPocketSpec.ballDiameter / 2 - 1e-9,
      `${pocket.id} black-hole center must sit at least one ball radius outside mouth`);
    assert.ok(Math.abs(captureDepth - pocket.shelf) < 1e-9, `${pocket.id} capture line must follow its shelf`);
  }
  assert.deepEqual([...snapshot.ballNumbers], Array.from({ length: 16 }, (_, number) => number));
  assert.equal(snapshot.runState.breakCompleted, false);
  assert.equal(snapshot.runState.interest, 100);
  assert.ok(snapshot.cue.y > Math.max(...snapshot.balls.filter((ball) => ball.number > 0).map((ball) => ball.y)));
  assert.ok(snapshot.render.width <= 1440);
  assert.ok(snapshot.render.height <= 2880);
  assert.ok(snapshot.render.width * snapshot.render.height <= 1440 * 2880);
  assert.equal(debug.shoot(0.22), true, "the first shot must not wait for a start action");
});

test("builds twelve angled static jaws around all six pocket mouths", () => {
  const snapshot = bootRuntime().snapshot();
  const jaws = snapshot.rails.filter((rail) => rail.kind === "jaw");
  const guards = snapshot.rails.filter((rail) => rail.kind === "guard");
  assert.equal(jaws.length, 12);
  assert.equal(guards.length, 4);
  assert.ok(jaws.every((jaw) => jaw.isStatic));
  assert.equal(jaws.filter((jaw) => jaw.cutAngleDegrees === 142).length, 8);
  assert.equal(jaws.filter((jaw) => jaw.cutAngleDegrees === 104).length, 4);
  const pockets = new Map(snapshot.pockets.map((pocket) => [pocket.id, pocket]));
  for (const pocket of snapshot.pockets) {
    const pocketJaws = jaws.filter((jaw) => jaw.pocketId === pocket.id);
    assert.equal(pocketJaws.length, 2);
    assert.ok(Math.abs(Math.hypot(
      pocketJaws[0].noseX - pocketJaws[1].noseX,
      pocketJaws[0].noseY - pocketJaws[1].noseY
    ) - pocket.mouth) < 1e-9, `${pocket.id} jaw noses must preserve WPA mouth width`);
    assert.ok(Math.abs((pocketJaws[0].noseX + pocketJaws[1].noseX) / 2 - pocket.mouthX) < 1e-9);
    assert.ok(Math.abs((pocketJaws[0].noseY + pocketJaws[1].noseY) / 2 - pocket.mouthY) < 1e-9);
  }
  for (const jaw of jaws) {
    const pocket = pockets.get(jaw.pocketId);
    const entryDegrees = (Math.atan2(pocket.inwardY, pocket.inwardX) * 180 / Math.PI + 360) % 360;
    const offset = jaw.cutAngleDegrees - (pocket.type === "corner" ? 135 : 90);
    const expected = (entryDegrees - jaw.mouthSide * offset + 360) % 360;
    const error = Math.abs(((jaw.headingDegrees - expected + 540) % 360) - 180);
    assert.ok(error < 1e-9, `${jaw.id} heading must derive from its WPA cut angle`);
    const physicalHeading = (jaw.angle * 180 / Math.PI + 360) % 360;
    const physicalError = Math.abs(((physicalHeading - jaw.headingDegrees + 540) % 360) - 180);
    assert.ok(physicalError < 1e-9, `${jaw.id} Matter angle must match derived facing`);
  }
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

test("requires mouth entry plus shelf crossing and lets a jaw collision reject a pocket graze", () => {
  const debug = bootRuntime();
  debug.reset();
  debug.shoot(0.12);
  const pocket = debug.snapshot().pockets.find((item) => item.id === "middle-left");

  assert.equal(debug.placeBall(2, pocket), true);
  let snapshot = debug.step(1);
  assert.equal(findBall(snapshot, 2).pocketing, null, "being at the drop center without mouth entry must not pocket a ball");

  const approach = pocketApproach(pocket);
  assert.equal(debug.placeBall(2, approach.point, approach.velocity), true);
  let sawMouthEntry = false;
  for (let step = 0; step < 12 && !findBall(snapshot, 2).pocketing; step += 1) {
    snapshot = debug.step(1);
    const ball = findBall(snapshot, 2);
    if (ball.pocketApproach && !sawMouthEntry) {
      sawMouthEntry = true;
      assert.equal(ball.pocketing, null, "crossing mouth must arm capture without immediately dropping");
    }
  }
  assert.equal(sawMouthEntry, true);
  assert.equal(findBall(snapshot, 2).pocketing?.pocketId, "middle-left");

  const tangent = { x: -pocket.inwardY, y: pocket.inwardX };
  const graze = pocketApproach(pocket);
  graze.point.x += tangent.x * 40;
  graze.point.y += tangent.y * 40;
  assert.equal(debug.placeBall(3, graze.point, graze.velocity), true);
  snapshot = debug.step(24);
  const grazingBall = findBall(snapshot, 3);
  assert.equal(grazingBall.pocketing, null, "crossing outside the WPA mouth width must not pot");
  assert.ok(grazingBall.shotRailHits > 0, "the angled jaw should provide the graze response");
  assert.ok(grazingBall.vx > 0, `the jaw should reflect the leftward graze, received vx ${grazingBall.vx}`);
});

test("keeps a clear delayed capture path through every corner and side mouth", () => {
  for (const pocketId of ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"]) {
    const debug = bootRuntime();
    debug.shoot(0.12);
    const pocket = debug.snapshot().pockets.find((item) => item.id === pocketId);
    const approach = pocketApproach(pocket, 20, 10);
    assert.equal(debug.placeBall(1, approach.point, approach.velocity), true);
    let snapshot = debug.snapshot();
    let mouthStep = -1;
    let pocketStep = -1;
    for (let step = 1; step <= 18 && pocketStep < 0; step += 1) {
      snapshot = debug.step(1);
      const ball = findBall(snapshot, 1);
      if (ball.pocketApproach && mouthStep < 0) {
        mouthStep = step;
        assert.equal(ball.pocketing, null, `${pocketId} must remain physical on mouth entry`);
      }
      if (ball.pocketing) pocketStep = step;
    }
    assert.ok(mouthStep > 0, `${pocketId} should record mouth entry`);
    assert.ok(pocketStep > mouthStep, `${pocketId} must cross shelf after mouth entry before capture`);
    assert.equal(findBall(snapshot, 1).pocketing?.pocketId, pocketId, `${pocketId} should accept a centered inward crossing`);
  }
});

test("recovers a low-speed ball that enters a corner mouth but stalls before the shelf", () => {
  const debug = bootRuntime();
  debug.shoot(0.12);
  const pocket = debug.snapshot().pockets.find((item) => item.id === "top-left");
  const approach = pocketApproach(pocket, 0.5, 0.18);
  assert.equal(debug.placeBall(4, approach.point, approach.velocity), true);
  let snapshot = debug.snapshot();
  let sawMouthEntry = false;
  for (let step = 0; step < 300; step += 1) {
    snapshot = debug.step(1);
    if (findBall(snapshot, 4).pocketApproach) sawMouthEntry = true;
  }
  const ball = findBall(snapshot, 4);
  assert.equal(sawMouthEntry, true);
  assert.equal(ball.pocketing, null);
  assert.equal(ball.pocketApproach, null);
  assert.equal(ball.outsideSteps, 0);
});

test("keeps an object ball physical until its pocket animation completes, then settles it once", () => {
  const debug = bootRuntime();
  debug.reset();
  debug.shoot(0.18);
  const pocket = debug.snapshot().pockets.find((item) => item.id === "middle-left");
  const approach = pocketApproach(pocket);
  assert.equal(debug.placeBall(1, approach.point, approach.velocity), true);

  let snapshot = debug.snapshot();
  for (let step = 0; step < 8 && !findBall(snapshot, 1).pocketing; step += 1) snapshot = debug.step(1);
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
  const pocket = debug.snapshot().pockets.find((item) => item.id === "middle-right");
  const approach = pocketApproach(pocket);
  assert.equal(debug.placeBall(0, approach.point, approach.velocity), true);

  let snapshot = debug.snapshot();
  for (let step = 0; step < 8 && !findBall(snapshot, 0).pocketing; step += 1) snapshot = debug.step(1);
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

test("uses the optional ball renderer for resize, sync, and render while skipping 2D balls", () => {
  const calls = [];
  const drawCalls = [];
  class BallRendererInstance {
    constructor() { this.supported = true; }
    resize(width, height, pixelRatio) { calls.push({ method: "resize", width, height, pixelRatio }); }
    sync(balls, state) { calls.push({ method: "sync", balls, state }); }
    render(timestamp) { calls.push({ method: "render", timestamp }); return true; }
  }
  const BallRenderer = {
    create(options) {
      calls.push({ method: "create", options });
      return new BallRendererInstance();
    }
  };
  const debug = bootRuntime({ BilliardsBallRenderer: BallRenderer, includeBallCanvas: true, drawCalls });
  assert.equal(debug.snapshot().ballRenderer.active, true);
  assert.deepEqual(calls.slice(0, 2).map((call) => call.method), ["create", "resize"]);
  assert.deepEqual(
    { width: calls[0].options.worldWidth, height: calls[0].options.worldHeight, radius: calls[0].options.ballRadius },
    { width: 720, height: 1440, radius: 14.85 }
  );

  debug.renderFrame(1234);
  assert.equal(calls.filter((call) => call.method === "sync").length, 1);
  assert.equal(calls.filter((call) => call.method === "render").length, 1);
  assert.equal(calls.find((call) => call.method === "sync").balls.length, 16);
  assert.equal(drawCalls.some((call) => call.method === "fillText"), false, "2D ball labels should be skipped");
});

test("falls back to 2D balls in the same frame when the optional renderer fails", () => {
  const drawCalls = [];
  const FailingBallRenderer = {
    create() {
      return {
        supported: true,
        resize() {},
        sync() {},
        render() { return false; },
        dispose() { this.supported = false; }
      };
    }
  };
  const debug = bootRuntime({ BilliardsBallRenderer: FailingBallRenderer, includeBallCanvas: true, drawCalls });
  assert.equal(debug.snapshot().ballRenderer.active, true);
  const snapshot = debug.renderFrame(1234);
  assert.deepEqual({ ...snapshot.ballRenderer }, { active: false, failed: true, canvas: false });
  assert.ok(drawCalls.filter((call) => call.method === "fillText").length >= 15, "2D numbered balls should render after failure");
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
