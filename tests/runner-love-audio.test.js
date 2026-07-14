"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets/runner-love-audio.js"), "utf8");
const audioApi = require("../assets/runner-love-audio.js");

test("provides seven distinct musical palettes without external audio requests", () => {
  assert.equal(audioApi.TEMPOS.length, 7);
  assert.equal(new Set(audioApi.TEMPOS).size, 7);
  assert.equal(audioApi.CHORDS.length, 7);
  assert.ok(audioApi.CHORDS.every((progression) => progression.length === 4));
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|https?:\/\//);
});

test("exposes stage, flow, action, item, arrival, and lifecycle controls", () => {
  const audio = audioApi.create();
  for (const method of ["start", "setStage", "setFlow", "setArrival", "action", "cue", "tick", "toggle", "suspend", "resume", "dispose"]) {
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
  assert.match(source, /this\.flow > 0\.62/);
  assert.match(source, /this\.arrival \? 88/);
  for (const token of ["flowTier", "duckMusic", "setTargetAtTime(0.46 + nextFlow * 0.18", "nextTier > previousTier"]) {
    assert.ok(source.includes(token), token);
  }
});
