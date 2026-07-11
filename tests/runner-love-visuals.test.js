"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets/runner-love-visuals.js"), "utf8");
const modulePath = path.join(root, "assets/vendor/three-0.185.1.module.min.js");
const corePath = path.join(root, "assets/vendor/three.core.min.js");
const moduleSource = fs.readFileSync(modulePath, "utf8");

test("vendors the complete local Three.js r185 module graph with its license", () => {
  assert.equal(fs.existsSync(modulePath), true);
  assert.equal(fs.existsSync(corePath), true);
  assert.equal(fs.existsSync(path.join(root, "assets/vendor/three-0.185.1.LICENSE.txt")), true);
  assert.ok(fs.statSync(modulePath).size > 300000);
  assert.ok(fs.statSync(corePath).size > 300000);
  assert.match(moduleSource, /from"\.\/three\.core\.min\.js"/);
  assert.match(source, /from "\.\/vendor\/three-0\.185\.1\.module\.min\.js"/);
  assert.doesNotMatch(source, /https?:\/\//);
});

test("builds a true perspective WebGL scene with physically shaded depth and bounded mobile pixels", () => {
  for (const contract of [
    "new THREE.WebGLRenderer", "new THREE.PerspectiveCamera", "THREE.ACESFilmicToneMapping",
    "new THREE.FogExp2", "THREE.PCFShadowMap", "MAX_RENDER_PIXELS", "renderer.setPixelRatio"
  ]) assert.ok(source.includes(contract), contract);
  assert.match(source, /const SEGMENT_COUNT = 14/);
  assert.match(source, /this\.camera\.lookAt/);
  assert.match(source, /this\.renderer\.render\(this\.scene, this\.camera\)/);
});

test("models seven distinct story environments with local scene art, weather, light and props", () => {
  for (const id of ["first-sight", "familiar-steps", "closer-signals", "spoken-heart", "shared-days", "rough-weather", "toward-home"]) {
    assert.ok(source.includes(`id: "${id}"`), id);
  }
  for (const weather of ["after-rain", "breeze", "neon", "rain", "warm", "storm", "starlight"]) {
    assert.ok(source.includes(`weather: "${weather}"`), weather);
  }
  for (const builder of ["createTree", "createLamp", "createBench", "createRailing", "createBuilding", "createCafe", "createShelter", "createMarket", "createOverpass"]) {
    assert.match(source, new RegExp(`function ${builder}\\(`));
  }
});

test("uses jointed 3D runners, stage objects, obstacles and one-draw-call weather systems", () => {
  for (const token of [
    "createCharacter", "createLimb", "animateCharacter", "createCollectible", "createObstacle",
    "createCompanionCue", "new THREE.LineSegments", "new THREE.Points"
  ]) assert.ok(source.includes(token), token);
  assert.match(source, /parts\.leftLeg\.rotation\.x/);
  assert.match(source, /motion\.action/);
  assert.match(source, /companionAction/);
  assert.match(source, /this\.canvas\.setAttribute\("data-render-calls"/);
});
