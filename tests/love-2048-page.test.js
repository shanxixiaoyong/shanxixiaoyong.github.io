const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const Love2048Engine = require("../assets/love-2048-engine.js");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "game-2048.html"), "utf8");
const gamesSource = fs.readFileSync(path.join(root, "assets/games.js"), "utf8");

class FakeClassList {
  constructor(element) {
    this.element = element;
  }

  values() {
    return new Set(this.element.className.split(/\s+/).filter(Boolean));
  }

  write(values) {
    this.element.className = [...values].join(" ");
  }

  contains(name) {
    return this.values().has(name);
  }

  add(...names) {
    const values = this.values();
    names.forEach((name) => values.add(name));
    this.write(values);
  }

  remove(...names) {
    const values = this.values();
    names.forEach((name) => values.delete(name));
    this.write(values);
  }

  toggle(name, force) {
    const values = this.values();
    const enabled = force === undefined ? !values.has(name) : Boolean(force);
    if (enabled) values.add(name);
    else values.delete(name);
    this.write(values);
    return enabled;
  }
}

class FakeStyle {
  constructor() {
    this.values = new Map();
    this.cssText = "";
  }

  setProperty(name, value) {
    this.values.set(name, String(value));
  }

  removeProperty(name) {
    this.values.delete(name);
  }
}

function dataKey(attribute) {
  return attribute.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function matches(element, selector) {
  if (selector.startsWith(".")) return element.classList.contains(selector.slice(1));
  const dataMatch = selector.match(/^\[data-([a-z-]+)="([^"]*)"\]$/);
  if (dataMatch) return element.dataset[dataKey(`data-${dataMatch[1]}`)] === dataMatch[2];
  return false;
}

class FakeElement {
  constructor(tagName, ownerDocument, fragment = false) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.isFragment = fragment;
    this.children = [];
    this.parentElement = null;
    this.dataset = {};
    this.attributes = new Map();
    this.style = new FakeStyle();
    this.className = "";
    this.classList = new FakeClassList(this);
    this.listeners = new Map();
    this._innerHTML = "";
    this.textContent = "";
    this.clientWidth = 500;
    this.clientHeight = 500;
    this.offsetWidth = 96;
    this.offsetHeight = 96;
    this.offsetLeft = 0;
    this.offsetTop = 0;
  }

  append(...nodes) {
    nodes.forEach((node) => {
      if (node.isFragment) {
        [...node.children].forEach((child) => this.append(child));
        node.children = [];
        return;
      }
      node.remove();
      node.parentElement = this;
      this.children.push(node);
    });
  }

  replaceChildren(...nodes) {
    this.children.forEach((child) => { child.parentElement = null; });
    this.children = [];
    this._innerHTML = "";
    this.append(...nodes);
  }

  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    this.parentElement = null;
  }

  set innerHTML(value) {
    this.children.forEach((child) => { child.parentElement = null; });
    this.children = [];
    this._innerHTML = String(value);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  setAttribute(name, value) {
    const text = String(value);
    this.attributes.set(name, text);
    if (name === "class") this.className = text;
    if (name.startsWith("data-")) this.dataset[dataKey(name)] = text;
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === "style") this.style = new FakeStyle();
    if (name.startsWith("data-")) delete this.dataset[dataKey(name)];
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event) {
    this.listeners.get(event.type)?.forEach((listener) => listener(event));
  }

  descendants() {
    return this.children.flatMap((child) => [child, ...child.descendants()]);
  }

  querySelectorAll(selector) {
    const directMatch = selector.split(",").map((part) => part.trim()).every((part) => part.startsWith(":scope > "));
    const selectors = selector.split(",").map((part) => part.trim().replace(/^:scope > /, ""));
    const candidates = directMatch ? this.children : this.descendants();
    return candidates.filter((candidate) => selectors.some((part) => matches(candidate, part)));
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  focus() {}

  getBoundingClientRect() {
    return { left: this.offsetLeft, top: this.offsetTop, width: this.offsetWidth, height: this.offsetHeight };
  }
}

class FakeDocument {
  constructor() {
    this.listeners = new Map();
    this.byId = new Map();
    this.body = new FakeElement("body", this);
  }

  register(id, element) {
    this.byId.set(id, element);
    element.id = id;
    this.body.append(element);
    return element;
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  createDocumentFragment() {
    return new FakeElement("fragment", this, true);
  }

  querySelector(selector) {
    if (selector.startsWith("#")) return this.byId.get(selector.slice(1)) || null;
    return this.body.querySelector(selector);
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatchKey(key) {
    const event = { type: "keydown", key, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
    this.listeners.get("keydown")?.forEach((listener) => listener(event));
    return event;
  }
}

function createDom() {
  const document = new FakeDocument();
  const soloGame = document.register("solo-game", document.createElement("section"));
  soloGame.dataset.game = "merge2048";
  document.register("game-title", document.createElement("h1"));
  document.register("game-kind", document.createElement("span"));
  document.register("game-score", document.createElement("strong"));
  const status = document.register("game-status", document.createElement("p"));
  const board = document.register("game-board", document.createElement("div"));
  document.register("game-controls", document.createElement("div"));
  document.register("game-meta", document.createElement("div"));
  return { document, board, status };
}

function createHarness(options = {}) {
  const { document, board, status } = createDom();
  const randomValues = [0, 0, 0, 0, 0];
  const chooseCalls = [];
  const chooseResults = [...(options.chooseResults || [])];
  const initialState = { ...Love2048Engine.createDirectorState(), ...(options.initialState || {}) };
  const engine = {
    ...Love2048Engine,
    createDirectorState() {
      return { ...initialState };
    },
    chooseSpawn(state, context) {
      const call = { state: { ...state }, context: { ...context } };
      chooseCalls.push(call);
      const queued = chooseResults.shift();
      const result = queued
        ? queued({ ...state }, { ...context })
        : Love2048Engine.chooseSpawn(state, context, () => 1);
      call.result = { kind: result.kind, state: { ...result.state } };
      return result;
    }
  };
  const storage = new Map();
  const math = Object.create(Math);
  math.random = () => randomValues.length ? randomValues.shift() : 0;
  let timerId = 0;
  const window = {
    document,
    Love2048Engine: engine,
    innerWidth: 430,
    innerHeight: 932,
    requestAnimationFrame(callback) { callback(); },
    requestIdleCallback() { return 0; },
    setTimeout() { timerId += 1; return timerId; },
    clearTimeout() {}
  };
  window.window = window;
  const context = {
    window,
    document,
    Math: math,
    localStorage: {
      getItem(key) { return storage.get(key) || null; },
      setItem(key, value) { storage.set(key, String(value)); }
    },
    Image: class {},
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    setInterval() { timerId += 1; return timerId; },
    clearInterval() {},
    console
  };

  vm.runInNewContext(gamesSource, context, { filename: "assets/games.js" });

  return {
    board,
    document,
    status,
    chooseCalls,
    randomValues,
    press(key) { return document.dispatchKey(key); },
    cells() { return board.children.filter((child) => child.classList.contains("merge-cell")); },
    occupiedCells() { return this.cells().filter((cell) => cell.dataset.value); },
    effects() { return board.children.filter((child) => child.classList.contains("board-effect")); }
  };
}

test("loads the Love 2048 engine before VFX and the shared game script", () => {
  const stylesheet = html.match(/<link\s+rel="stylesheet"\s+href="(assets\/love-2048\.css\?v=[^"]+)"/);
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1]);
  const engineIndex = scripts.findIndex((source) => source.startsWith("assets/love-2048-engine.js?v="));
  const vfxIndex = scripts.findIndex((source) => source.startsWith("assets/love-2048-vfx.js?v="));
  const gamesIndex = scripts.findIndex((source) => source.startsWith("assets/games.js?v="));

  assert.ok(engineIndex >= 0, "Love 2048 engine script must be present");
  assert.ok(engineIndex < vfxIndex, "engine must load before VFX");
  assert.ok(vfxIndex < gamesIndex, "VFX must load before games.js");

  const versions = [scripts[engineIndex], scripts[vfxIndex], scripts[gamesIndex]]
    .map((source) => new URLSearchParams(source.split("?")[1]).get("v"));
  const stylesheetVersion = new URLSearchParams(stylesheet[1].split("?")[1]).get("v");
  assert.ok(versions[0], "Love 2048 scripts must use a cache version");
  assert.deepEqual(versions, [versions[0], versions[0], versions[0]]);
  assert.equal(stylesheetVersion, versions[0], "Love 2048 CSS and scripts must share one cache version");
});

test("initializes 25 stable cells and blocked input adds only a normal tile", () => {
  const harness = createHarness();

  assert.equal(harness.cells().length, 25);
  assert.equal(harness.occupiedCells().length, 2);

  const event = harness.press("ArrowUp");

  assert.equal(event.defaultPrevented, true);
  assert.equal(harness.chooseCalls.length, 0);
  assert.equal(harness.cells().length, 25);
  assert.equal(harness.occupiedCells().length, 3);
  assert.ok(harness.occupiedCells().every((cell) => ["2", "4"].includes(cell.dataset.value)));
});

test("a changed numeric merge calls chooseSpawn once with its merge-pair count", () => {
  const harness = createHarness();

  harness.press("ArrowLeft");

  assert.equal(harness.chooseCalls.length, 1);
  assert.equal(harness.chooseCalls[0].context.ordinaryMergeCount, 1);
  assert.equal(harness.chooseCalls[0].context.inputBlocked, false);
  assert.equal(harness.occupiedCells().length, 2);
});

test("a randomly spawned four does not consume the first merge-to-four cinematic", () => {
  const harness = createHarness();
  harness.randomValues.splice(0, harness.randomValues.length, 0.99, 0.99);

  harness.press("ArrowUp");
  assert.ok(harness.occupiedCells().some((cell) => cell.dataset.value === "4"));
  assert.equal(harness.document.body.querySelector(".love-stage-celebration"), null);

  harness.press("ArrowLeft");
  const cinematic = harness.document.body.querySelector(".love-stage-celebration");
  assert.ok(cinematic, "the first natural merge to four must still unlock its cinematic");
  assert.match(cinematic.innerHTML, /首次解锁 · 记住/);
});

test("fate and conflict decisions replace the normal spawn and render real DOM state", () => {
  const cases = [
    {
      kind: "fate",
      state: { fatePhase: "awaiting-second" },
      special: "fate",
      className: "is-fate",
      label: "缘分",
      status: /两枚缘分.*最高阶段.*进一阶/
    },
    {
      kind: "conflict",
      state: { eventCooldown: 12 },
      special: "conflict",
      className: "is-conflict",
      label: "矛盾",
      status: /还需 2 次普通合并.*化解/
    }
  ];

  for (const scenario of cases) {
    const harness = createHarness({
      chooseResults: [(state) => ({ kind: scenario.kind, state: { ...state, ...scenario.state } })]
    });

    harness.press("ArrowLeft");

    const special = harness.cells().find((cell) => cell.dataset.special === scenario.special);
    assert.equal(harness.occupiedCells().length, 2, `${scenario.kind} must replace the one normal spawn`);
    assert.ok(special, `${scenario.kind} cell must be rendered`);
    assert.equal(special.classList.contains(scenario.className), true);
    assert.equal(special.dataset.special, scenario.special);
    assert.match(special.innerHTML, new RegExp(`<small class="tile-label">${scenario.label}</small>`));
    assert.match(harness.status.textContent, scenario.status);
    assert.equal(harness.document.body.querySelector(".love-special-guide"), null, "special guidance must stay in status text");

    if (scenario.kind === "fate") {
      const effect = harness.effects().find((item) => item.classList.contains("effect-love-special-spawn"));
      assert.ok(effect, "fate spawn effect must be appended to the board");
      assert.equal(effect.parentElement, harness.board);
      assert.equal(effect.getAttribute("aria-hidden"), "true");
    } else {
      assert.match(special.innerHTML, /data-cracks="2">2<\/em>/);
      const effect = harness.effects().find((item) => item.classList.contains("effect-love-conflict"));
      assert.ok(effect, "conflict effect must be appended to the board");
      assert.equal(effect.parentElement, harness.board);
      assert.equal(effect.getAttribute("aria-hidden"), "true");

      harness.press("ArrowUp");
      harness.press("ArrowUp");
      harness.press("ArrowLeft");
      const repairing = harness.cells().find((cell) => cell.dataset.special === "conflict");
      assert.match(repairing.innerHTML, /data-cracks="1">1<\/em>/);
      assert.match(harness.status.textContent, /还需 1 次普通合并.*化解/);

      harness.press("ArrowUp");
      harness.press("ArrowLeft");
      assert.equal(harness.cells().some((cell) => cell.dataset.special === "conflict"), false);
      assert.equal(harness.status.textContent, "滑动合并相同爱心，推进下一段关系");
      assert.ok(harness.effects().some((item) => item.classList.contains("effect-love-reconcile")));
    }
  }
});

test("a new natural milestone resets first-fate effort before chooseSpawn", () => {
  const harness = createHarness({
    initialState: { firstFateTurns: 17 },
    chooseResults: [(state) => state.firstFateTurns >= 17
      ? { kind: "fate", state: { ...state, fatePhase: "awaiting-second" } }
      : { kind: "normal", state: { ...state } }]
  });

  harness.press("ArrowLeft");

  assert.equal(harness.chooseCalls.length, 1);
  assert.equal(harness.chooseCalls[0].state.firstFateTurns, 0);
  assert.equal(harness.chooseCalls[0].result.kind, "normal");
  assert.equal(harness.cells().some((cell) => cell.dataset.special === "fate"), false);
});

test("a fate sequence active at turn start preserves effort through its destiny milestone", () => {
  const fateState = { firstFateTurns: 17, fatePhase: "awaiting-second", secondFateTurns: 0 };
  const resolvingState = { firstFateTurns: 17, fatePhase: "awaiting-resolution", secondFateTurns: 0 };
  const harness = createHarness({
    initialState: { firstFateTurns: 17 },
    chooseResults: [
      (state) => ({ kind: "fate", state: { ...state, ...fateState } }),
      (state) => ({ kind: "fate", state: { ...state, ...resolvingState } }),
      (state) => ({ kind: "normal", state: { ...state } })
    ]
  });

  harness.randomValues.push(0.99, 0);
  harness.press("ArrowLeft");
  harness.randomValues.push(0.99, 0);
  harness.press("ArrowUp");
  harness.randomValues.push(0, 0);
  harness.press("ArrowLeft");
  harness.randomValues.push(0.99, 0);
  harness.press("ArrowUp");
  harness.randomValues.push(0.99, 0);
  harness.press("ArrowUp");
  harness.randomValues.push(0, 0, 0);
  harness.press("ArrowLeft");

  assert.equal(harness.chooseCalls.length, 3);
  assert.equal(harness.chooseCalls[2].state.firstFateTurns, 17);
  assert.ok(harness.effects().some((item) => item.classList.contains("effect-love-destiny")));
  assert.equal(harness.cells().some((cell) => cell.dataset.special === "fate"), false);
  assert.equal(harness.status.textContent, "滑动合并相同爱心，推进下一段关系");
});
