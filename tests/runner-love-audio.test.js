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
  context.nodes?.push(node);
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
    this.events = [];
    this.nodes = [];
    this.suspendCalls = 0;
    this.resumeCalls = 0;
    this.destination = fakeNode(this, "destination");
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

  suspend() { this.suspendCalls += 1; this.state = "suspended"; return Promise.resolve(); }
  resume() { this.resumeCalls += 1; this.state = "running"; return Promise.resolve(); }
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
  assert.deepEqual(audioApi.SOUNDSCAPE_PROFILES.map((profile) => profile.id), [
    "campus-rain", "river-pages", "metro-neon", "night-market", "morning-life", "storm-flyover", "dawn-home"
  ]);
  assert.equal(new Set(audioApi.SOUNDSCAPE_PROFILES.map((profile) => profile.texture)).size, 7);
  assert.equal(new Set(audioApi.SOUNDSCAPE_PROFILES.map((profile) => profile.layers.join("|"))).size, 7);
  assert.ok(audioApi.SOUNDSCAPE_PROFILES.every((profile) => Object.isFrozen(profile) && profile.layers.length === 3));
  const acts = audioApi.ACT_AUDIO_PROFILES.flat();
  assert.equal(acts.length, 21);
  assert.equal(new Set(acts.map((act) => act.id)).size, 21);
  assert.ok(acts.every((act) => Number.isFinite(act.bpm) && act.bpm >= 60 && act.bpm <= 180));
  assert.equal(audioApi.SEMANTIC_REWARD_PROFILES.length, 7);
  assert.deepEqual(audioApi.SEMANTIC_REWARD_PROFILES.map((profile) => profile.id), [
    "earned-acceleration", "step-match", "promise-surge", "dual-melody", "daily-layer", "listening-space", "theme-convergence"
  ]);
  assert.deepEqual(Object.keys(audioApi.POWERUP_PROFILES), ["magnet", "shield", "multiplier", "overdrive"]);
  assert.ok(Object.keys(audioApi.MUSIC_PROFILES).length >= 5);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|https?:\/\//);
});

test("exposes stage, flow, action, item, arrival, and lifecycle controls", () => {
  const audio = audioApi.create();
  for (const method of ["start", "setStage", "setAct", "applyDirectorCommand", "stageIntro", "stageBeat", "setDanger", "failure", "setFlow", "setArrival", "action", "cue", "tick", "powerup", "interaction", "toggle", "suspend", "resume", "dispose"]) {
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

test("accepts authored act tempo and rhythm while applying director commands once", () => {
  withStartedAudio((audio, context) => {
    const command = {
      id: "stage-4:act-2:set-act",
      channel: "audio",
      op: "set-act",
      key: "music-crowd",
      durationMs: 1200,
      payload: {
        stageIndex: 3,
        actIndex: 1,
        actId: "music-crowd",
        bpm: 123,
        rhythm: { id: "custom-sync", density: 0.81, pulse: [0, 2, 8, 10], swing: 0.08 },
        semanticReward: "dual-melody"
      }
    };
    const nodeCount = context.nodes.length;
    assert.equal(audio.applyDirectorCommand(command), true);
    assert.equal(audio.stageNumber, 4);
    assert.equal(audio.actIndex, 1);
    assert.equal(audio.actId, "music-crowd");
    assert.equal(audio.actTempoBpm, 123);
    assert.deepEqual(audio.actRhythm, { id: "custom-sync", density: 0.81, pulse: [0, 2, 8, 10], swing: 0.08 });
    assert.equal(audio.semanticMode, "dual-melody");
    assert.equal(context.nodes.length, nodeCount, "act changes must automate the persistent graph");

    const automationCount = audio.rhythm.gain.events.length + audio.highs.gain.events.length;
    assert.equal(audio.applyDirectorCommand(command), false);
    assert.equal(context.nodes.length, nodeCount);
    assert.equal(audio.rhythm.gain.events.length + audio.highs.gain.events.length, automationCount);
    assert.equal(audio.setAct(command.payload), false, "an identical direct act update should also be idempotent");
  });
});

test("keeps director commands idempotent beyond 300 events and across attempts", () => {
  const audio = audioApi.create();
  const applications = [];
  audio.applySemanticReward = (payload) => {
    applications.push(payload.marker);
    return true;
  };
  const command = (attempt, ordinal, marker = `${attempt}-${ordinal}`) => ({
    id: `first-sight:campus-release:${attempt}:${ordinal}:mutual-harmony`,
    channel: "audio",
    op: "layer",
    payload: { marker }
  });
  const legacy = { id: "legacy-director-command", channel: "audio", op: "layer", payload: { marker: "legacy" } };

  assert.equal(audio.applyDirectorCommand(legacy), true);
  for (let ordinal = 1; ordinal <= 320; ordinal += 1) {
    assert.equal(audio.applyDirectorCommand(command(1, ordinal)), true, `attempt 1 ordinal ${ordinal}`);
  }
  assert.equal(applications.length, 321);

  for (const ordinal of [1, 64, 256, 319, 320]) {
    assert.equal(audio.applyDirectorCommand(command(1, ordinal, `replay-${ordinal}`)), false, `replay ${ordinal}`);
  }
  assert.equal(audio.applyDirectorCommand(legacy), false, "legacy ids must not be evicted by sequenced traffic");
  assert.equal(applications.length, 321, "replayed commands must not retrigger audio");

  assert.equal(audio.applyDirectorCommand(command(2, 1, "new-attempt")), true);
  assert.equal(audio.applyDirectorCommand(command(1, 999, "stale-restored-attempt")), false);
  assert.equal(audio.applyDirectorCommand(command(2, 3, "new-attempt-3")), true);
  assert.equal(audio.applyDirectorCommand(command(2, 2, "new-attempt-2")), true, "small delivery reordering remains valid");
  assert.equal(audio.applyDirectorCommand(command(2, 2, "new-attempt-2-replay")), false);
  assert.deepEqual(applications.slice(-3), ["new-attempt", "new-attempt-3", "new-attempt-2"]);

  audio.dispose();
});

test("maps clean-action rewards to seven distinct stage meanings", () => {
  withStartedAudio((audio, context) => {
    const modes = [];
    for (let stageIndex = 0; stageIndex < 7; stageIndex += 1) {
      audio.setAct({ stageIndex, actIndex: 1 });
      const command = {
        id: `semantic-${stageIndex}`,
        channel: "audio",
        op: "layer",
        key: "mutual-harmony",
        durationMs: 2200,
        payload: { stageIndex, strength: 0.8 }
      };
      assert.equal(audio.applyDirectorCommand(command), true);
      modes.push(audio.semanticMode);
      audio.tick(1 / 60, { speed: 20, active: true, flow: 0.7, speedTier: "fast" });
      if (stageIndex === 0 || stageIndex === 2) assert.ok(audio.directorTempoOffset > 0, `stage ${stageIndex + 1} should earn acceleration`);
      if (stageIndex !== 0 && stageIndex !== 2 && stageIndex !== 5) assert.equal(audio.directorTempoOffset, 0);
      context.advance(2.5);
    }
    assert.deepEqual(modes, audioApi.SEMANTIC_REWARD_PROFILES.map((profile) => profile.id));
  });
});

test("turns stage six clean play into listening space instead of acceleration", () => {
  withStartedAudio((audio) => {
    audio.setAct({ stageIndex: 5, actIndex: 2 });
    assert.equal(audio.actTempoBpm, 86);
    for (let frame = 0; frame < 90; frame += 1) {
      audio.tick(1 / 60, { speed: 28, active: true, flow: 1, speedTier: "overdrive" });
    }
    const pressuredTempo = audio.tempoTarget;
    assert.ok(pressuredTempo > audio.actTempoBpm);

    assert.equal(audio.applyDirectorCommand({
      id: "stage-6-listen",
      channel: "audio",
      op: "layer",
      key: "mutual-harmony",
      durationMs: 3200,
      payload: { strength: 1 }
    }), true);
    for (let frame = 0; frame < 180; frame += 1) {
      audio.tick(1 / 60, { speed: 28, active: true, flow: 1, speedTier: "overdrive" });
    }
    assert.equal(audio.semanticMode, "listening-space");
    assert.ok(audio.directorTempoOffset < 0);
    assert.ok(audio.tempoTarget < audio.actTempoBpm, `${audio.tempoTarget} must stay below the authored ${audio.actTempoBpm} BPM`);
    assert.ok(audio.tempoTarget < pressuredTempo - 20);
    assert.ok(audio.directorDensity < 0.3);

    const calls = [];
    for (const voice of ["pad", "bell", "kick", "snare", "hat", "bass"]) audio[voice] = (...args) => calls.push({ voice, args });
    audio.scheduleStep(0, 0.1);
    assert.ok(calls.some((call) => call.voice === "pad"));
    assert.equal(calls.some((call) => ["kick", "snare", "hat", "bass"].includes(call.voice)), false, "the listening hold must leave a real rhythmic silence");
  });
});

test("briefly removes layers on collision and restores the stage motif on repair", () => {
  withStartedAudio((audio, context) => {
    audio.setAct({ stageIndex: 3, actIndex: 1 });
    audio.applyDirectorCommand({ id: "sync-reward", channel: "audio", op: "layer", durationMs: 1800, payload: { strength: 0.82 } });
    const schedulerId = audio.schedulerId;
    assert.equal(audio.applyDirectorCommand({ id: "collision-1", channel: "audio", op: "duck", durationMs: 680, payload: { intensity: 0.7 } }), true);
    assert.ok(audio.directorSetback > 0);
    assert.ok(audio.rhythm.gain.events.some((event) => event.type === "target" && event.value < 0.4));

    const nodeCountBeforeRepair = context.nodes.length;
    assert.equal(audio.applyDirectorCommand({ id: "repair-1", channel: "audio", op: "resolve", key: "repair" }), true);
    assert.equal(audio.directorSetback, 0);
    assert.equal(audio.semanticMode, "dual-melody");
    assert.ok(context.nodes.length > nodeCountBeforeRepair, "repair should replay the current stage's paired motif");
    assert.equal(audio.schedulerId, schedulerId, "director feedback must not create another scheduler");
  });
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

test("reuses a persistent layered ambience graph while switching all seven soundscapes", () => {
  withStartedAudio((audio, context) => {
    const persistentNodes = [
      audio.ambientSource, audio.ambientDetailSource, audio.ambientDrone, audio.dangerOscillator,
      audio.ambientFilter, audio.ambientDetailFilter, audio.ambientDroneFilter, audio.dangerFilter
    ];
    const nodeCount = context.nodes.length;
    const startCount = context.events.filter((event) => event.action === "start").length;
    const signatures = [];

    for (let stage = 1; stage <= 7; stage += 1) {
      audio.setStage(stage);
      const profile = audioApi.SOUNDSCAPE_PROFILES[stage - 1];
      signatures.push([
        audio.ambientFilter.type, audio.ambientFilter.frequency.value,
        audio.ambientDetailFilter.type, audio.ambientDetailFilter.frequency.value,
        audio.ambientDrone.type, audio.ambientDrone.frequency.value,
        profile.score.wave, profile.score.brightness
      ].join("|"));
      assert.deepEqual([
        audio.ambientSource, audio.ambientDetailSource, audio.ambientDrone, audio.dangerOscillator,
        audio.ambientFilter, audio.ambientDetailFilter, audio.ambientDroneFilter, audio.dangerFilter
      ], persistentNodes);
    }

    assert.equal(new Set(signatures).size, 7);
    assert.equal(context.nodes.length, nodeCount, "stage changes should automate persistent nodes instead of rebuilding them");
    assert.equal(context.events.filter((event) => event.action === "start").length, startCount);
  });
});

test("scores chapter intros and content beats with distinct, deduplicated stage textures", () => {
  withStartedAudio((audio, context) => {
    const calls = [];
    for (const voice of ["tone", "noiseHit", "bell", "kick", "pluck"]) {
      audio[voice] = (...args) => calls.push({ voice, args });
    }
    const signatures = [];

    for (let stageIndex = 0; stageIndex < 7; stageIndex += 1) {
      calls.length = 0;
      context.advance(0.8);
      const openingPerformance = { id: `performance-${stageIndex}` };
      assert.equal(audio.stageIntro({ stageIndex, reason: "next", openingPerformance }), true);
      assert.equal(audio.stageNumber, stageIndex + 1);
      assert.equal(audio.soundscape, audioApi.SOUNDSCAPE_PROFILES[stageIndex]);

      const beat = { id: `opening-${stageIndex}`, index: 0 };
      assert.equal(audio.stageBeat({ stageIndex, openingPerformance, beat, beatIndex: 0 }), true);
      const callCount = calls.length;
      assert.equal(audio.stageBeat({ stageIndex, openingPerformance, beat, beatIndex: 0 }), false);
      assert.equal(calls.length, callCount, "a repeated render of the same content beat must stay silent");
      assert.equal(audio.stageBeat({ stageIndex, openingPerformance, beat: { id: `run-${stageIndex}` }, beatIndex: 2 }), true);
      signatures.push(calls.map(({ voice, args }) => `${voice}:${args.slice(0, 7).map((value) => typeof value === "number" ? Math.round(value * 100) / 100 : value?.kind || value).join(":")}`).join("|"));
    }

    assert.equal(new Set(signatures).size, 7);
    assert.equal(audio.stageIntro({ stageId: "rough-weather", reason: "retry" }), true);
    assert.equal(audio.stageNumber, 6);
  });
});

test("updates danger with persistent automation and emits transients only on band changes", () => {
  withStartedAudio((audio, context) => {
    assert.equal(audio.setDanger("danger", 31), true);
    const nodeCountAfterEntry = context.nodes.length;
    const dangerEventsAfterEntry = audio.dangerGain.gain.events.length;
    const automationEventsAfterEntry = audio.dangerOscillator.frequency.events.length + audio.dangerFilter.frequency.events.length;

    for (let frame = 0; frame < 180; frame += 1) audio.setDanger("danger", 31 - (frame % 3));
    assert.equal(context.nodes.length, nodeCountAfterEntry, "same-band updates must not allocate transient voices");
    assert.ok(audio.dangerGain.gain.events.length - dangerEventsAfterEntry < 10, "danger gain automation should be coalesced");
    assert.ok(audio.dangerOscillator.frequency.events.length + audio.dangerFilter.frequency.events.length - automationEventsAfterEntry < 10, "danger filter automation should be coalesced");

    context.advance(0.5);
    assert.equal(audio.setDanger("critical", 12), true);
    assert.equal(audio.dangerRank, 3);
    assert.ok(context.nodes.length > nodeCountAfterEntry);
    assert.equal(audio.setDanger({ band: "steady", condition: 92 }), true);
    assert.equal(audio.dangerBand, "steady");
    assert.equal(audio.condition, 92);
  });
});

test("plays stage-colored failure cues and a hopeful checkpoint tail once", () => {
  withStartedAudio((audio, context) => {
    const calls = [];
    for (const voice of ["tone", "noiseHit", "bell", "duckMusic"]) {
      audio[voice] = (...args) => calls.push({ voice, args });
    }
    const signatures = [];

    for (let stageIndex = 0; stageIndex < 7; stageIndex += 1) {
      audio.stageIntro({ stageIndex, reason: "retry" });
      audio.setDanger("steady", 80);
      calls.length = 0;
      context.advance(0.8);
      assert.equal(audio.failure({ stageIndex, checkpointReached: false }), true);
      assert.equal(audio.failureActive, true);
      assert.equal(audio.failure({ stageIndex, checkpointReached: false }), false);
      signatures.push(calls.map(({ voice, args }) => `${voice}:${Math.round(Number(args[0]) || 0)}:${args[4] || ""}`).join("|"));
    }
    assert.equal(new Set(signatures).size, 7);

    audio.stageIntro({ stageIndex: 2, reason: "retry" });
    audio.setDanger("steady", 75);
    calls.length = 0;
    assert.equal(audio.failure({ stageIndex: 2, checkpointReached: true }), true);
    assert.equal(calls.filter((call) => call.voice === "bell").length, 2);
    calls.length = 0;
    audio.scheduleStep(0, context.currentTime + 0.1);
    assert.equal(calls.length, 0, "the score scheduler should stay silent behind the failure surface");
  });
});

test("limits frame-driven node creation and reanchors the same graph after pause", () => {
  withStartedAudio((audio, context) => {
    const nodeCount = context.nodes.length;
    for (let frame = 0; frame < 300; frame += 1) audio.tick(1 / 60, 18, true, false, 0, 1);
    assert.ok(context.nodes.length - nodeCount < 130, "tick should not build a new soundscape graph per frame");

    const persistentNodes = [audio.ambientSource, audio.ambientDetailSource, audio.ambientDrone, audio.dangerOscillator];
    const startCount = context.events.filter((event) => event.action === "start").length;
    audio.nextStepAt = 1;
    context.currentTime = 12;
    audio.suspend();
    assert.equal(context.state, "suspended");
    audio.resume();
    assert.equal(context.state, "running");
    assert.ok(audio.nextStepAt >= 12.02);
    assert.deepEqual([audio.ambientSource, audio.ambientDetailSource, audio.ambientDrone, audio.dangerOscillator], persistentNodes);
    assert.equal(context.events.filter((event) => event.action === "start").length, startCount);

    assert.equal(audio.toggle(), true);
    assert.equal(context.state, "suspended");
    audio.resume();
    assert.equal(context.state, "suspended", "lifecycle resume must respect a manual mute");
    assert.equal(audio.toggle(), false);
    assert.equal(context.state, "running");
  });
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
