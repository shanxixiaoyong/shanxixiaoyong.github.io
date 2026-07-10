const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const Love2048Engine = require("../assets/love-2048-engine.js");
const Love2048Stories = require("../assets/love-2048-stories.js");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "game-2048.html"), "utf8");
const gamesSource = fs.readFileSync(path.join(root, "assets/games.js"), "utf8");
const loveCss = fs.readFileSync(path.join(root, "assets/love-2048.css"), "utf8");

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
  let timerNow = 0;
  const timers = new Map();
  const resizeObservers = new Set();
  const setTimer = (callback, delay = 0) => {
    timerId += 1;
    timers.set(timerId, { callback, due: timerNow + Math.max(0, Number(delay) || 0) });
    return timerId;
  };
  const clearTimer = (id) => timers.delete(id);
  const advance = (duration) => {
    const target = timerNow + Math.max(0, Number(duration) || 0);
    let guard = 0;
    while (guard < 1000) {
      const next = [...timers.entries()]
        .filter(([, timer]) => timer.due <= target)
        .sort((left, right) => left[1].due - right[1].due || left[0] - right[0])[0];
      if (!next) break;
      const [id, timer] = next;
      timers.delete(id);
      timerNow = timer.due;
      timer.callback();
      guard += 1;
    }
    assert.ok(guard < 1000, "fake timers must settle");
    timerNow = target;
  };
  class FakeResizeObserver {
    constructor(callback) {
      this.callback = callback;
      this.targets = new Set();
      resizeObservers.add(this);
    }

    observe(target) {
      this.targets.add(target);
    }

    disconnect() {
      this.targets.clear();
      resizeObservers.delete(this);
    }
  }
  const window = {
    document,
    Love2048Engine: engine,
    Love2048Stories,
    ResizeObserver: FakeResizeObserver,
    innerWidth: 430,
    innerHeight: 932,
    requestAnimationFrame(callback) { callback(); },
    requestIdleCallback() { return 0; },
    setTimeout: setTimer,
    clearTimeout: clearTimer
  };
  if (options.canMoveResult !== undefined) engine.canMove = () => options.canMoveResult;
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
    setTimeout: setTimer,
    clearTimeout: clearTimer,
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
    advance,
    press(key) { return document.dispatchKey(key); },
    resizeCells(width) {
      board.clientWidth = width * 5;
      this.cells().forEach((cell) => { cell.offsetWidth = width; });
      resizeObservers.forEach((observer) => {
        if (observer.targets.has(board)) observer.callback([{ target: board, contentRect: { width: board.clientWidth } }]);
      });
    },
    cells() { return board.children.filter((child) => child.classList.contains("merge-cell")); },
    occupiedCells() { return this.cells().filter((cell) => cell.dataset.value); },
    effects() { return board.children.filter((child) => child.classList.contains("board-effect")); }
  };
}

test("loads the Love 2048 engine before VFX and the shared game script", () => {
  const stylesheet = html.match(/<link\s+rel="stylesheet"\s+href="(assets\/love-2048\.css\?v=[^"]+)"/);
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1]);
  const engineIndex = scripts.findIndex((source) => source.startsWith("assets/love-2048-engine.js?v="));
  const storiesIndex = scripts.findIndex((source) => source.startsWith("assets/love-2048-stories.js?v="));
  const vfxIndex = scripts.findIndex((source) => source.startsWith("assets/love-2048-vfx.js?v="));
  const gamesIndex = scripts.findIndex((source) => source.startsWith("assets/games.js?v="));

  assert.ok(engineIndex >= 0, "Love 2048 engine script must be present");
  assert.ok(engineIndex < storiesIndex, "engine must load before the story catalog");
  assert.ok(storiesIndex < vfxIndex, "story catalog must load before VFX");
  assert.ok(vfxIndex < gamesIndex, "VFX must load before games.js");

  const versions = [scripts[engineIndex], scripts[storiesIndex], scripts[vfxIndex], scripts[gamesIndex]]
    .map((source) => new URLSearchParams(source.split("?")[1]).get("v"));
  const stylesheetVersion = new URLSearchParams(stylesheet[1].split("?")[1]).get("v");
  assert.ok(versions[0], "Love 2048 scripts must use a cache version");
  assert.deepEqual(versions, [versions[0], versions[0], versions[0], versions[0]]);
  assert.equal(stylesheetVersion, versions[0], "Love 2048 CSS and scripts must share one cache version");
});

test("uses a compact nineteen-stage relationship arc ending at 524288", () => {
  const block = gamesSource.match(/const tileStory = \[([\s\S]*?)\n    \];/);
  assert.ok(block, "tileStory must remain a readable stage table");
  const stages = [...block[1].matchAll(/\[(\d+),\s*"[^"]+",\s*"([^"]+)"/g)]
    .map((match) => [Number(match[1]), match[2]]);

  assert.deepEqual(stages, [
    [2, "初见"], [4, "记住"], [8, "有好感"], [16, "试探"], [32, "暧昧"],
    [64, "约见"], [128, "第一次约会"], [256, "频繁联系"], [512, "告白前夜"],
    [1024, "确认关系"], [2048, "热恋期"], [4096, "磨合期"], [8192, "稳定相处"],
    [16384, "共同旅行"], [32768, "同居日常"], [65536, "见过家人"],
    [131072, "谈及婚姻"], [262144, "求婚时刻"], [524288, "长久相爱"]
  ]);
  assert.match(gamesSource, /const narrativeSceneSource = \{/);
  assert.match(gamesSource, /524288: 4194304/);
});

test("optically centers long numbers and fits relationship labels to the heart", () => {
  assert.match(gamesSource, /function measureTypography\(text, cellWidth, kind\)/);
  assert.match(gamesSource, /actualBoundingBoxLeft/);
  assert.match(gamesSource, /actualBoundingBoxRight/);
  assert.match(gamesSource, /item\.dataset\.labelLength = String\(labelLength\)/);
  assert.match(gamesSource, /setProperty\("--number-size", `\$\{numberMetrics\.size\}px`\)/);
  assert.match(gamesSource, /setProperty\("--number-optical-x", `\$\{numberMetrics\.opticalX\}px`\)/);
  assert.match(gamesSource, /setProperty\("--label-size", `\$\{labelMetrics\.size\}px`\)/);
  assert.match(loveCss, /\.board-love-2048 :is\(\.merge-cell, \.love-motion-ghost\) \.tile-number \{/);
  assert.match(loveCss, /\.board-love-2048 :is\(\.merge-cell, \.love-motion-ghost\) \.tile-label \{/);
  assert.match(loveCss, /font-size: var\(--number-size, 24px\)/);
  assert.match(loveCss, /transform: translateX\(var\(--number-optical-x, 0\)\)/);
  assert.match(loveCss, /font-size: var\(--label-size, 8px\)/);
  assert.equal(loveCss.includes("--number-scale"), false);
  assert.equal(loveCss.includes("--label-scale"), false);
  assert.equal(loveCss.includes('[data-digits="4"] .tile-number'), false);
  const labelRule = loveCss.match(/\.board-love-2048 :is\(\.merge-cell, \.love-motion-ghost\) \.tile-label \{([\s\S]*?)\n\}/);
  assert.ok(labelRule);
  assert.equal(labelRule[1].includes("text-overflow: ellipsis"), false);
});

test("reveals concrete foreshadow stories and chains a higher-stage cinematic when the maximum is chosen", () => {
  assert.match(gamesSource, /stories\.pickPositive\(positiveBandFor\(highestBefore\), Math\.random\)/);
  assert.match(gamesSource, /function playForeshadowSequence\(result, stageEvent\)/);
  assert.match(gamesSource, /resolution\?\.targetWasHighest/);
  assert.match(gamesSource, /stageEvent\.continuation \? "关系续章"/);
  assert.match(gamesSource, /function playTargetSelection\(result\)/);
  assert.match(gamesSource, /bufferedSwipeDirection = direction/);
  assert.match(loveCss, /\.foreshadow-letter/);
  assert.match(loveCss, /\.is-foreshadow-chosen/);
  assert.equal(gamesSource.includes("缘分"), false);
});

test("renders one fixed knot with hidden merge lifetime and paired conflict cinematics", () => {
  assert.match(gamesSource, /engine\.safeConflictIndices\(tiles, size, profile\.remaining\)/);
  assert.match(gamesSource, /stories\.pickConflict\(profile\.severity, Math\.random\)/);
  assert.match(gamesSource, /function playConflictEntry\(conflict\)/);
  assert.match(gamesSource, /function playConflictResolution\(conflict, stageEvent\)/);
  assert.match(gamesSource, /class="knot-emblem" data-remaining=/);
  assert.match(loveCss, /\.knot-loops/);
  assert.equal(gamesSource.includes("矛盾"), false);
  assert.equal(gamesSource.includes("conflict-crack-count"), false);
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

test("foreshadow and knot decisions replace the normal spawn with their full visual state", () => {
  const cases = [
    {
      kind: "fate",
      state: { fatePhase: "awaiting-second" },
      special: "foreshadow",
      className: "is-foreshadow",
      label: "伏笔",
      status: /未知好事.*伏笔/
    },
    {
      kind: "conflict",
      state: { eventCooldown: 10 },
      profile: { severity: "minor", remaining: 2, entryMs: 900, idleMs: 1800, resolveMs: 800 },
      special: "knot",
      className: "is-knot",
      label: "心结",
      status: /心结/
    }
  ];

  for (const scenario of cases) {
    const harness = createHarness({
      chooseResults: [(state) => ({ kind: scenario.kind, profile: scenario.profile, state: { ...state, ...scenario.state } })]
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
      assert.ok(effect, "foreshadow spawn effect must be appended to the board");
      assert.equal(effect.parentElement, harness.board);
      assert.equal(effect.getAttribute("aria-hidden"), "true");
      assert.match(special.innerHTML, /class="foreshadow-letter"/);
    } else {
      assert.match(special.innerHTML, /class="knot-emblem" data-remaining="2"/);
      assert.equal(special.innerHTML.includes("conflict-crack-count"), false);
      const effect = harness.effects().find((item) => item.classList.contains("effect-love-knot-arrive"));
      assert.ok(effect, "knot arrival effect must be appended to the board");
      assert.equal(effect.parentElement, harness.board);
      assert.equal(effect.getAttribute("aria-hidden"), "true");

      harness.advance(scenario.profile.entryMs);
      harness.press("ArrowUp");
      harness.press("ArrowUp");
      harness.press("ArrowLeft");
      const repairing = harness.cells().find((cell) => cell.dataset.special === "knot");
      assert.equal(repairing.dataset.index, special.dataset.index, "the knot must remain anchored to one cell");
      assert.match(repairing.innerHTML, /data-remaining="1"/);
      assert.match(harness.status.textContent, /心结/);

      harness.press("ArrowUp");
      harness.press("ArrowLeft");
      assert.equal(harness.cells().some((cell) => cell.dataset.special === "knot"), false);
      assert.equal(harness.status.textContent, "滑动合并相同爱心，推进下一段关系");
      assert.ok(harness.effects().some((item) => item.classList.contains("effect-love-reconcile")));
    }
  }
});

test("buffers keyboard moves until a special cinematic finishes", () => {
  const harness = createHarness({
    chooseResults: [(state) => ({
      kind: "conflict",
      profile: { severity: "minor", remaining: 2, entryMs: 900, idleMs: 1800, resolveMs: 800 },
      state: { ...state, eventCooldown: 10 }
    })]
  });

  harness.press("ArrowLeft");
  const before = harness.cells().map((cell) => cell.dataset.value);
  harness.press("ArrowDown");

  assert.equal(harness.chooseCalls.length, 1, "keyboard input must wait while the scene is active");
  assert.deepEqual(harness.cells().map((cell) => cell.dataset.value), before);

  harness.advance(900);

  assert.equal(harness.chooseCalls.length, 2, "the latest buffered direction must run after the scene");
  assert.notDeepEqual(harness.cells().map((cell) => cell.dataset.value), before);
});

test("recomputes tile typography when the board width changes", () => {
  const harness = createHarness();
  const ordinary = harness.occupiedCells()[0];
  const before = Number.parseFloat(ordinary.style.values.get("--number-size"));

  harness.resizeCells(40);

  const after = Number.parseFloat(ordinary.style.values.get("--number-size"));
  assert.ok(after < before, `number size should shrink after resize (${before} -> ${after})`);
});

test("shows game over before an unresolved knot status", () => {
  const harness = createHarness({
    canMoveResult: false,
    chooseResults: [(state) => ({
      kind: "conflict",
      profile: { severity: "minor", remaining: 2, entryMs: 900, idleMs: 1800, resolveMs: 800 },
      state: { ...state, eventCooldown: 10 }
    })]
  });

  harness.press("ArrowLeft");

  assert.ok(harness.cells().some((cell) => cell.dataset.special === "knot"));
  assert.equal(harness.status.textContent, "棋盘已满，点重遇再开始一段故事");
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
  assert.equal(harness.cells().some((cell) => cell.dataset.special === "foreshadow"), false);
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
  assert.ok(harness.effects().some((item) => item.classList.contains("effect-love-foreshadow-open")));
  assert.equal(harness.cells().some((cell) => cell.dataset.special === "foreshadow"), false);
  assert.equal(harness.status.textContent, "滑动合并相同爱心，推进下一段关系");
});
