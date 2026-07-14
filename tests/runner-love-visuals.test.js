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
    "new THREE.FogExp2", "THREE.PCFShadowMap", "MAX_RENDER_PIXELS", "renderer.setPixelRatio",
    "makeRunnerEnvironmentTexture", "data-render-fps"
  ]) assert.ok(source.includes(contract), contract);
  assert.match(source, /const SEGMENT_COUNT = 12/);
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
  for (const builder of ["createTree", "createLamp", "createBench", "createRailing", "createBuilding", "createCafe", "createShelter", "createMarket", "createOverpass", "createStation", "createTunnel", "createGantry"]) {
    assert.match(source, new RegExp(`function ${builder}\\(`));
  }
});

test("builds seven authored metro districts instead of recoloring one repeated track", () => {
  for (const district of ["campus-line", "glass-station", "neon-river", "date-market", "home-quarter", "storm-bridge", "sunrise-terminal"]) {
    assert.ok(source.includes(`district: "${district}"`), district);
  }
  for (const builder of ["createSkyDome", "createMetroSkyline", "createDistrictGateway", "createAmbientTrain", "updateDistrictWorld"]) {
    assert.match(source, new RegExp(`${builder}\\(`), builder);
  }
  assert.match(source, /new THREE\.ShaderMaterial/);
  assert.match(source, /new THREE\.InstancedMesh/);
});

test("ships a local CC0 city kit and batches each mobile district and rail bed", () => {
  const cityModel = path.join(root, "assets/runner-models/runner-city.glb");
  assert.equal(fs.existsSync(cityModel), true);
  assert.ok(fs.statSync(cityModel).size > 1000000);
  assert.equal(fs.existsSync(path.join(root, "assets/runner-models/KENNEY-CC0-LICENSE.txt")), true);
  for (const token of ["DISTRICT_CITY_LAYOUTS", "createPremiumDistrict", "loadPremiumCity", "roadBatches", "roadBaseGroup", "kenney-instanced"]) {
    assert.ok(source.includes(token), token);
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

test("uses an authored toon runner silhouette with readable gear and grounded motion feedback", () => {
  for (const token of ["characterMaterial", "roundedPanelGeometry", "createRunnerFootTrail", "updateRunnerFootTrail", "jacketHem", "backpackFlap"]) {
    assert.ok(source.includes(token), token);
  }
  assert.match(source, /new THREE\.MeshToonMaterial/);
  assert.match(source, /landingPulse/);
  assert.match(source, /lateralVelocity/);
});

test("renders collectible chains and obstacle silhouettes as gameplay-first 3D props", () => {
  for (const token of ["createHeartGeometry", "createStageTokenGeometry", "STAGE_TOKEN_COLORS", "makeWarningStripeTexture", "pickupTrail", "headlights", "warningBeacons", "districtGate"]) {
    assert.ok(source.includes(token), token);
  }
  assert.match(source, /data-render-quality/);
});

test("renders metro-scale trains and reuses obstacle meshes for sustained mobile play", () => {
  for (const token of ["createTrain", "createJumpBarrier", "createSignalGate", "createServiceCart", "new THREE.InstancedMesh", "entityPool", "WORLD_Z_SCALE"]) {
    assert.ok(source.includes(token), token);
  }
  assert.match(source, /entity\.subtype, entity\.variant/);
  assert.match(source, /motion\.lanePosition/);
});
