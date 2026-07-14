"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets/runner-love-audio.js"), "utf8");
const audioApi = require("../assets/runner-love-audio.js");

class FakeAudioParam {
  constructor(value = 0) {
    this.value = value;
    this.events = [];
  }

  setValueAtTime(value, at) {
    this.value = value;
    this.events.push({ type: "set", value, at });
  }

  exponentialRampToValueAtTime(value, at) {
    this.value = value;
    this.events.push({ type: "exponential", value, at });
  }

  setTargetAtTime(value, at, timeConstant) {
    this.value = value;
    this.events.push({ type: "target", value, at, timeConstant });
  }

  cancelScheduledValues(at) {
    this.events.push({ type: "cancel", at });
  }
}

function fakeNode(context, kind) {
  const node = {
    kind,
    connections: [],
    connect(destination) {
      this.connections.push(destination);
      return destination;
    },
    start(at = 0) {
      context.events.push({ action: "start", kind, at, wave: this.type, frequency: this.frequency?.value });
    },
    stop(at = 0) {
      context.events.push({ action: "stop", kind, at });
    }
  };
  if (kind === "gain") node.gain = new FakeAudioParam(1);
  if (kind === "compressor") {
    for (const property of ["threshold", "knee", "ratio", "attack", "release"]) node[property] = new FakeAudioParam();
  }
  if (kind === "filter") {
    node.frequency = new FakeAudioParam();
    node.Q = new FakeAudioParam();
  }
  if (kind === "oscillator") {
    node.frequency = new FakeAudioParam();
    node.detune = new FakeAudioParam();
  }
  if (kind === "panner") node.pan = new FakeAudioParam();
  return node;
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 120;
    this.state = "running";
    this.destination = fakeNode(this, "destination");
    this.events = [];
  }

  createDynamicsCompressor() { return fakeNode(this, "compressor"); }
  createGain() { return fakeNode(this, "gain"); }
  createConvolver() { return fakeNode(this, "convolver"); }
  createBufferSource() { return fakeNode(this, "buffer-source"); }
  createBiquadFilter() { return fakeNode(this, "filter"); }
  createOscillator() { return fakeNode(this, "oscillator"); }
  createStereoPanner() { return fakeNode(this, "panner"); }

  createBuffer(channels, length) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { getChannelData: (channel) => data[channel] };
  }

  suspend() { this.state = "suspended"; return Promise.resolve(); }
  resume() { this.state = "running"; return Promise.resolve(); }
  close() { this.state = "closed"; return Promise.resolve(); }
  advance(seconds) { if (this.state === "running") this.currentTime += seconds; }
}

function withStartedAudio(callback) {
  const previousAudioContext = globalThis.AudioContext;
  globalThis.AudioContext = FakeAudioContext;
  const audio = audioApi.create();
  try {
    audio.start();
    return callback(audio, audio.context);
  } finally {
    audio.dispose();
    if (previousAudioContext === undefined) delete globalThis.AudioContext;
    else globalThis.AudioContext = previousAudioContext;
  }
}

test("provides seven distinct musical palettes without external audio requests", () => {
  assert.equal(audioApi.TEMPOS.length, 7);
  assert.equal(new Set(audioApi.TEMPOS).size, 7);
  assert.equal(audioApi.CHORDS.length, 7);
  assert.ok(audioApi.CHORDS.every((progression) => progression.length === 4));
  assert.deepEqual(Object.keys(audioApi.POWERUP_PROFILES), ["magnet", "shield", "multiplier", "overdrive"]);
  assert.ok(Object.keys(audioApi.MUSIC_PROFILES).length >= 5);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|https?:\/\//);
});

test("exposes stage, flow, action, item, arrival, and lifecycle controls", () => {
  const audio = audioApi.create();
  for (const method of ["start", "setStage", "setFlow", "setArrival", "action", "cue", "tick", "powerup", "interaction", "toggle", "suspend", "resume", "dispose"]) {
    assert.equal(typeof audio[method], "function", method);
  }
  audio.setStage(20, 76, 5);
  audio.setFlow(4);
  audio.setArrival(true);
  assert.equal(audio.stageNumber, 7);
  assert.equal(audio.condition, 76);
  assert.equal(audio.combo, 5);
  assert.equal(audio.flow, 1);
  assert.equal(audio.arrival, true);
  audio.dispose();
});

test("builds a layered procedural score and item-specific interaction cues", () => {
  for (const voice of ["kick", "snare", "hat", "bass", "pad", "pluck", "bell", "noiseHit"]) {
    assert.match(source, new RegExp(`\\b${voice}\\(`), voice);
  }
  for (const kind of ["umbrella", "camera", "record", "flower", "key", "ticket", "plant"]) {
    assert.match(source, new RegExp(`\\b${kind}:`), kind);
  }
  assert.match(source, /this\.flowMix > 0\.62/);
  assert.match(source, /this\.arrival \? 88/);
  for (const token of ["flowTier", "duckMusic", "setTargetAtTime(0.46 + nextFlow * 0.18", "nextTier > previousTier"]) {
    assert.ok(source.includes(token), token);
  }
});

test("smoothly raises tempo, percussion, and high layers from speed, flow, and speed tier", () => {
  withStartedAudio((audio) => {
    for (let frame = 0; frame < 120; frame += 1) audio.tick(1 / 60, 11, true, false, 0, 0);
    const baselineTempo = audio.tempoBpm;
    const baselinePercussion = audio.percussionLevel;
    const baselineHighs = audio.highFrequencyLevel;

    audio.tick(1 / 60, 24, true, false, 0, 0);
    assert.ok(audio.tempoBpm > baselineTempo);
    assert.ok(audio.tempoBpm < audio.tempoTarget, "tempo should approach its target instead of jumping");
    for (let frame = 0; frame < 180; frame += 1) audio.tick(1 / 60, 24, true, false, 0, 0);
    const speedTempo = audio.tempoBpm;

    for (let frame = 0; frame < 180; frame += 1) audio.tick(1 / 60, 24, true, false, 1, 0);
    const flowTempo = audio.tempoBpm;
    for (let frame = 0; frame < 180; frame += 1) {
      audio.tick(1 / 60, { speed: 24, active: true, arrival: false, flow: 1, speedTier: "overdrive" });
    }
    const tierTempo = audio.tempoBpm;

    assert.ok(speedTempo > baselineTempo + 5, `${speedTempo} should exceed ${baselineTempo}`);
    assert.ok(flowTempo > speedTempo + 5, `${flowTempo} should exceed ${speedTempo}`);
    assert.ok(tierTempo > flowTempo + 5, `${tierTempo} should exceed ${flowTempo}`);
    assert.ok(audio.percussionLevel > baselinePercussion + 0.45);
    assert.ok(audio.highFrequencyLevel > baselineHighs + 0.45);
    assert.equal(audio.speedTier, 4);
    assert.ok(audio.rhythm.gain.events.some((event) => event.type === "target" && event.timeConstant > 0));
    assert.ok(audio.highs.gain.events.some((event) => event.type === "target" && event.timeConstant > 0));
  });
});

test("gives every powerup distinct start, sustain, end, and block cues", () => {
  withStartedAudio((audio, context) => {
    const calls = [];
    audio.tone = (...args) => calls.push({ voice: "tone", args });
    audio.noiseHit = (...args) => calls.push({ voice: "noise", args });
    audio.bell = (...args) => calls.push({ voice: "bell", args });
    audio.duckMusic = (...args) => calls.push({ voice: "duck", args });
    const signatures = [];

    for (const type of ["magnet", "shield", "multiplier", "overdrive"]) {
      calls.length = 0;
      context.advance(1);
      assert.equal(audio.powerup(type, "activate"), true);
      assert.ok(audio.activePowerups.has(type));
      signatures.push(calls.map((call) => `${call.voice}:${Math.round(call.args[0] || call.args[2] || 0)}:${call.args[4] || ""}`).join("|"));

      calls.length = 0;
      context.advance(0.5);
      assert.equal(audio.powerup(type, "active"), true);
      assert.ok(calls.length >= 2, `${type} sustain`);

      calls.length = 0;
      context.advance(0.5);
      assert.equal(audio.powerup(type, "block"), true);
      assert.ok(calls.some((call) => call.voice === "duck"), `${type} block`);

      calls.length = 0;
      context.advance(0.5);
      assert.equal(audio.powerup(type, "expire"), true);
      assert.ok(calls.some((call) => call.voice === "tone"), `${type} end`);
      assert.equal(audio.activePowerups.has(type), false);
    }

    assert.equal(new Set(signatures).size, 4);
    assert.equal(audio.powerup("unknown", "start"), false);
  });
});

test("uses profile.music for a timed score color and rewards synergy with harmony", () => {
  withStartedAudio((audio, context) => {
    const calls = [];
    audio.tone = (...args) => calls.push({ voice: "tone", args });
    audio.noiseHit = (...args) => calls.push({ voice: "noise", args });
    audio.pad = (...args) => calls.push({ voice: "pad", args });
    audio.bell = (...args) => calls.push({ voice: "bell", args });
    audio.setStage(2);

    assert.equal(audio.interaction({
      profile: { music: { style: "electric", waveform: "square", motif: [0, 3, 10], brightness: 5100, durationSeconds: 3 } },
      synergy: { active: true, level: 2 }
    }), true);
    assert.equal(audio.interactionMusic.wave, "square");
    assert.deepEqual(audio.interactionMusic.motif, [0, 3, 10]);
    assert.equal(audio.interactionMusic.brightness, 5100);
    assert.equal(audio.interactionMusic.synergy, true);
    assert.ok(calls.some((call) => call.voice === "pad"), "synergy should add a harmony pad");
    assert.equal(calls.filter((call) => call.voice === "bell").length, 3);

    const scheduledPlucks = [];
    audio.pluck = (...args) => scheduledPlucks.push(args);
    audio.scheduleStep(1, context.currentTime + 0.1);
    assert.ok(scheduledPlucks.some((args) => args[5] === "square" && args[6] === 5100));

    audio.suspend();
    context.advance(10);
    assert.ok(audio.currentMusicProfile(), "suspended audio time should preserve the score color");
    audio.resume();
    context.advance(3.1);
    assert.equal(audio.currentMusicProfile(), null);

    calls.length = 0;
    assert.equal(audio.interaction({
      music: { layer: "memory-pulse", timbre: "felt-piano", intensity: 0.56, layers: ["memory-pulse"], timbres: ["felt-piano"] },
      gameplay: { durationMs: 5200 },
      synergy: { active: [], strengthBonus: 0 }
    }), true);
    assert.equal(audio.interactionMusic.name, "warm");
    assert.equal(audio.interactionMusic.synergy, false);
    assert.ok(Math.abs(audio.interactionMusic.expiresAt - context.currentTime - 5.2) < 1e-9);
    assert.equal(calls.some((call) => call.voice === "pad"), false, "empty synergy should not add harmony");
  });
});
