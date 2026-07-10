const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const AudioSystem = require("../assets/heartbeat-audio.js");

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type, detail = {}) {
    this.listeners.get(type)?.forEach((listener) => listener({ type, ...detail }));
  }

  listenerCount(type) {
    return this.listeners.get(type)?.size || 0;
  }
}

class FakeAudioParam {
  constructor(value = 0) {
    this.value = value;
    this.events = [];
  }

  write(type, value, time) {
    this.value = value;
    this.events.push({ type, value, time });
  }

  setValueAtTime(value, time) {
    this.write("set", value, time);
  }

  exponentialRampToValueAtTime(value, time) {
    this.write("exponential", value, time);
  }

  linearRampToValueAtTime(value, time) {
    this.write("linear", value, time);
  }

  cancelScheduledValues(time) {
    this.events.push({ type: "cancel", time });
  }
}

class FakeAudioNode {
  constructor() {
    this.connections = [];
    this.disconnected = false;
  }

  connect(destination) {
    this.connections.push(destination);
    return destination;
  }

  disconnect() {
    this.disconnected = true;
    this.connections = [];
  }
}

class FakeGainNode extends FakeAudioNode {
  constructor() {
    super();
    this.gain = new FakeAudioParam(1);
  }
}

class FakeFilterNode extends FakeAudioNode {
  constructor() {
    super();
    this.frequency = new FakeAudioParam(350);
    this.Q = new FakeAudioParam(1);
    this.type = "lowpass";
  }
}

class FakeCompressorNode extends FakeAudioNode {
  constructor() {
    super();
    this.threshold = new FakeAudioParam(-24);
    this.knee = new FakeAudioParam(30);
    this.ratio = new FakeAudioParam(12);
    this.attack = new FakeAudioParam(0.003);
    this.release = new FakeAudioParam(0.25);
  }
}

class FakeOscillatorNode extends FakeAudioNode {
  constructor() {
    super();
    this.frequency = new FakeAudioParam(440);
    this.detune = new FakeAudioParam(0);
    this.type = "sine";
    this.onended = null;
    this.startAt = null;
    this.stopAt = null;
    this.cancelled = false;
  }

  start(when) {
    this.startAt = when;
  }

  stop(when) {
    if (arguments.length === 0) this.cancelled = true;
    this.stopAt = when;
  }
}

class FakeAudioContext {
  constructor() {
    this.state = "suspended";
    this.currentTime = 0;
    this.destination = new FakeAudioNode();
    this.oscillators = [];
    this.resumeCalls = 0;
    this.suspendCalls = 0;
    this.closeCalls = 0;
  }

  createGain() {
    return new FakeGainNode();
  }

  createDynamicsCompressor() {
    return new FakeCompressorNode();
  }

  createOscillator() {
    const oscillator = new FakeOscillatorNode();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createBiquadFilter() {
    return new FakeFilterNode();
  }

  resume() {
    this.resumeCalls += 1;
    this.state = "running";
    return Promise.resolve();
  }

  suspend() {
    this.suspendCalls += 1;
    this.state = "suspended";
    return Promise.resolve();
  }

  close() {
    this.closeCalls += 1;
    this.state = "closed";
    return Promise.resolve();
  }
}

function createHarness(options = {}) {
  const document = new FakeEventTarget();
  document.hidden = false;
  const window = new FakeEventTarget();
  const intervals = new Map();
  const contexts = [];
  const values = new Map();
  let intervalId = 0;
  if (options.stored !== undefined) values.set(AudioSystem.STORAGE_KEY, options.stored);

  class Context extends FakeAudioContext {
    constructor() {
      super();
      contexts.push(this);
    }
  }

  window.document = document;
  window.AudioContext = Context;
  window.localStorage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
  window.setInterval = (callback, delay) => {
    intervalId += 1;
    intervals.set(intervalId, { callback, delay });
    return intervalId;
  };
  window.clearInterval = (id) => intervals.delete(id);

  const audio = AudioSystem.createHeartbeatAudio({
    window,
    document,
    ambient: options.ambient !== false
  });

  return { audio, contexts, document, intervals, values, window };
}

async function unlock(harness, eventName = "pointerdown") {
  harness.document.dispatch(eventName);
  return harness.audio.unlock();
}

test("publishes one browser and CommonJS API from the shared module", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "assets", "heartbeat-audio.js"),
    "utf8"
  );
  const context = { window: {} };

  vm.runInNewContext(source, context);

  assert.equal(typeof AudioSystem.createHeartbeatAudio, "function");
  assert.equal(typeof context.window.Love2048Audio.createHeartbeatAudio, "function");
  assert.equal(context.window.Love2048Audio.STORAGE_KEY, AudioSystem.STORAGE_KEY);
});

test("maps every relationship stage to a distinct ascending merge pitch", () => {
  const values = Array.from({ length: 19 }, (_, index) => 2 ** (index + 1));
  const pitches = values.map(AudioSystem.mergeFrequency);

  assert.equal(new Set(pitches).size, pitches.length);
  assert.ok(pitches.every((pitch, index) => index === 0 || pitch > pitches[index - 1]));
});

test("creates and resumes AudioContext only on the first enabled gesture", async () => {
  const harness = createHarness();

  assert.equal(harness.contexts.length, 0);
  assert.equal(harness.document.listenerCount("touchstart"), 1);

  harness.document.dispatch("touchstart");
  assert.equal(harness.contexts.length, 1, "context creation must happen synchronously in the gesture");
  assert.equal(await harness.audio.unlock(), true);
  assert.equal(harness.contexts[0].resumeCalls, 1);
  assert.equal(harness.contexts[0].state, "running");
  assert.equal(harness.intervals.size, 1, "ambient bars use one interval scheduler");
  assert.equal(harness.document.listenerCount("pointerdown"), 0);

  harness.document.dispatch("keydown");
  assert.equal(harness.contexts.length, 1);
  harness.audio.destroy();
});

test("persists mute state and lets the toggle unlock from its own gesture", async () => {
  const harness = createHarness({ stored: "off" });

  harness.document.dispatch("pointerdown");
  assert.equal(harness.contexts.length, 0);
  assert.equal(harness.audio.isEnabled(), false);

  assert.equal(harness.audio.setEnabled(true), true);
  assert.equal(await harness.audio.unlock(), true);
  assert.equal(harness.values.get(AudioSystem.STORAGE_KEY), "on");
  assert.equal(harness.contexts.length, 1);

  assert.equal(harness.audio.toggle(), false);
  assert.equal(harness.values.get(AudioSystem.STORAGE_KEY), "off");
  assert.equal(harness.contexts[0].state, "suspended");
  assert.equal(harness.intervals.size, 0);
  harness.audio.destroy();
});

test("schedules stage pitches, combo flourishes, restrained bumps, and story cues", async () => {
  const harness = createHarness({ ambient: false });
  assert.equal(await unlock(harness), true);
  const context = harness.contexts[0];
  context.oscillators.length = 0;

  harness.audio.cueMerge({ values: [4], combo: 1 });
  assert.equal(context.oscillators.length, 2);
  assert.equal(context.oscillators[0].frequency.value, AudioSystem.mergeFrequency(4));

  context.oscillators.length = 0;
  harness.audio.cueMerge({ values: [8, 16], combo: 2 });
  assert.equal(context.oscillators.length, 7, "two merge voices plus a three-note flourish");

  context.oscillators.length = 0;
  harness.audio.cueBlocked();
  harness.audio.cueBlocked();
  assert.equal(context.oscillators.length, 1, "rapid blocked swipes must not stack");

  context.oscillators.length = 0;
  harness.audio.cueDestiny("reveal");
  harness.audio.cueConflict("entry");
  harness.audio.cueConflict("loosen", 2);
  harness.audio.cueConflict("resolve");
  assert.equal(context.oscillators.length, 11);

  context.oscillators.length = 0;
  harness.audio.cueStage(128);
  harness.audio.cueStage(128);
  assert.equal(context.oscillators.length, 5, "a first-stage motif must play once per journey");
  harness.audio.resetJourney();
  harness.audio.cueStage(128);
  assert.equal(context.oscillators.length, 10);
  harness.audio.destroy();
});

test("suspends on lifecycle changes, resumes once, and tears down every source", async () => {
  const harness = createHarness();
  assert.equal(await unlock(harness), true);
  const context = harness.contexts[0];
  const beforeSuspend = context.oscillators.slice();

  harness.document.hidden = true;
  harness.document.dispatch("visibilitychange");
  assert.equal(context.state, "suspended");
  assert.equal(harness.intervals.size, 0);
  assert.ok(beforeSuspend.every((oscillator) => oscillator.cancelled));

  harness.document.hidden = false;
  harness.document.dispatch("visibilitychange");
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(context.state, "running");
  assert.equal(harness.intervals.size, 1);

  harness.window.dispatch("pagehide", { persisted: true });
  assert.equal(context.state, "suspended", "bfcache navigation must retain a resumable context");
  harness.window.dispatch("pageshow");
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(context.state, "running");

  harness.window.dispatch("pagehide", { persisted: false });
  assert.equal(context.state, "closed");
  assert.equal(context.closeCalls, 1);
  assert.equal(harness.intervals.size, 0);
  assert.ok(context.oscillators.every((oscillator) => oscillator.cancelled));
  assert.equal(harness.document.listenerCount("visibilitychange"), 0);
  assert.equal(harness.window.listenerCount("pagehide"), 0);

  const oscillatorCount = context.oscillators.length;
  harness.audio.cueMerge({ values: [2048], combo: 4 });
  assert.equal(context.oscillators.length, oscillatorCount);
});
