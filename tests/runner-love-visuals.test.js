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

test("builds a perspective WebGL scene with physically shaded depth and bounded mobile pixels", () => {
  for (const contract of [
    "new THREE.WebGLRenderer", "new THREE.PerspectiveCamera", "THREE.ACESFilmicToneMapping",
    "new THREE.FogExp2", "THREE.PCFShadowMap", "MAX_RENDER_PIXELS", "renderer.setPixelRatio",
    "makeRunnerEnvironmentTexture", "data-render-fps"
  ]) assert.ok(source.includes(contract), contract);
  assert.match(source, /const MAX_RENDER_PIXELS = 1_850_000/);
  assert.match(source, /Math\.sqrt\(MAX_RENDER_PIXELS \/ \(cssWidth \* cssHeight\)\)/);
  assert.match(source, /this\.renderer\.render\(this\.scene, this\.camera\)/);
});

test("authors seven visually distinct districts with local cinematic backdrops", () => {
  for (const id of ["first-sight", "familiar-steps", "closer-signals", "spoken-heart", "shared-days", "rough-weather", "toward-home"]) assert.ok(source.includes(`id: "${id}"`), id);
  for (const weather of ["after-rain", "breeze", "neon", "rain", "warm", "storm", "starlight"]) assert.ok(source.includes(`weather: "${weather}"`), weather);
  for (const asset of ["campus-library.webp", "cafe-evening.webp", "city-night.webp", "rain-night.webp", "warm-home.webp", "starlight-vow.webp"]) assert.ok(source.includes(asset), asset);
  for (const district of ["campus-line", "glass-station", "neon-river", "date-market", "home-quarter", "storm-bridge", "sunrise-terminal"]) assert.ok(source.includes(`district: "${district}"`), district);
});

test("ships local city runners and a batched CC0 city instead of flat 2D runners", () => {
  for (const model of ["runner-player.glb", "runner-companion.glb", "runner-motion.glb", "runner-city.glb"]) assert.ok(source.includes(model), model);
  assert.equal(fs.existsSync(path.join(root, "assets/runner-models/runner-city.glb")), true);
  assert.equal(fs.existsSync(path.join(root, "assets/runner-models/KENNEY-CC0-LICENSE.txt")), true);
  assert.equal(fs.existsSync(path.join(root, "assets/runner-models/RG-POLY-CC0-LICENSE.txt")), true);
  for (const model of ["runner-player.glb", "runner-companion.glb"]) {
    assert.ok(fs.statSync(path.join(root, "assets/runner-models", model)).size > 700000, model);
  }
  assert.ok(fs.statSync(path.join(root, "assets/runner-models/runner-motion.glb")).size > 1500000);
  for (const token of ["createRiggedRunner", "animateRiggedRunner", "createPremiumDistrict", "new THREE.InstancedMesh", "kenney-instanced", "layers", "Runing_A", "Jump_B_Full", "FightM_Hit_C", "normalMap", "roughnessMap"]) assert.ok(source.includes(token), token);
  assert.match(source, /this\.companion\.visible = arriving/);
  assert.doesNotMatch(source, /companionAction/);
  const sources = fs.readFileSync(path.join(root, "assets/runner-models/SOURCES.md"), "utf8");
  assert.match(sources, /cartoon-city-massive-pack-characters/);
});

test("keeps three lanes readable while route phases rebuild the surrounding city", () => {
  assert.match(source, /laneGuides:\s*new THREE\.InstancedMesh/);
  for (const batch of ["laneTicks", "crosswalks", "drains", "roadPatches", "manholes", "edgePosts", "planterBases", "planterLeaves"]) assert.ok(source.includes(`${batch}: new THREE.InstancedMesh`), batch);
  assert.match(source, /setRoutePhase\(value\)/);
  assert.match(source, /const phase = this\.routePhase \|\| 0/);
  assert.match(source, /this\.rebuildDecor\(\)/);
  assert.match(source, /this\.roadBatches\.laneGuides\.visible = !railRoute/);
});

test("models carried story objects as interaction-specific 3D props", () => {
  for (const kind of ["book", "record", "drink", "coffee", "ticket", "umbrella", "flower", "camera", "key", "plant", "map", "cloth"]) assert.ok(source.includes(`case "${kind}"`) || source.includes(`"${kind}"`), kind);
  for (const token of ["createStoryProp", "createArrivalItemDisplay", "interactionFx", "handoffArc", "sparkles", "fxLight"]) assert.ok(source.includes(token), token);
  assert.match(source, /\["coffee", "drink"\]/);
  assert.match(source, /\["camera", "photo"\]/);
  assert.match(source, /\["flower", "plant"\]/);
});

test("stages story objects as lane-aware interactions with an animated pickup handoff", () => {
  for (const token of ["approachRibbon", "approachComets", "storyFocusTarget", "createPickupBridge", "quadraticPoint", "bridgeFade", "glintProgress", "impactProgress"]) assert.ok(source.includes(token), token);
  assert.match(source, /const alignment = clamp\(1 - Math\.abs\(object\.position\.x - this\.currentLaneX\)/);
  assert.match(source, /this\.scene\.add\(bridge, aura, prop\)/);
  assert.match(source, /this\.storyFocus \* 6/);
});

test("stages all seven destination films inside the same 3D world", () => {
  for (const builder of ["createShelter", "createBench", "createRailing", "createCinemaFront", "createMarket", "createStringLights", "createRendezvousSet"]) assert.match(source, new RegExp(`function ${builder}\\(`));
  assert.match(source, /this\.arrivalBackdropMaterial\.map = this\.arrivalStageTextures/);
  assert.match(source, /this\.roadGroup\.visible = !arriving/);
  assert.match(source, /this\.arrivalBackdrop\.visible = arriving/);
  assert.match(source, /this\.camera\.lookAt\(0\.02, 1\.38, -0\.72\)/);
  assert.match(source, /this\.arrivalStageTextures\.forEach\(\(texture\) => texture\?\.dispose\(\)\)/);
});

test("uses adaptive quality telemetry and reuses entity meshes for a sustained mobile run", () => {
  for (const token of ["entityPool", "SHARED_GEOMETRIES", "sharedTexture", "data-render-calls", "data-render-triangles", "data-render-quality", "frameAverage", "qualityElapsed"]) assert.ok(source.includes(token), token);
  assert.match(source, /estimatedFps < 48/);
  assert.match(source, /estimatedFps > 57/);
  assert.match(source, /bucket\.length < 5/);
  assert.match(source, /if \(!SHARED_GEOMETRIES\.has\(item\)\) item\.dispose/);
});

test("accepts event and render-state powerup contracts with missing-field fallbacks", () => {
  for (const event of ["powerup-start", "powerup-end", "shield-block", "story-world", "story-synergy"]) {
    assert.ok(source.includes(`type === "${event}"`), event);
  }
  for (const powerup of ["magnet", "shield", "multiplier", "overdrive"]) {
    assert.ok(source.includes(`${powerup}: { remaining: 0, duration: 0 }`), powerup);
  }
  for (const alias of ["attraction", "guard", "score-multiplier", "x2", "turbo"]) assert.ok(source.includes(`${alias.includes("-") ? `"${alias}"` : alias}:`), alias);
  assert.match(source, /readPowerupSnapshot\(powerups, target\)/);
  assert.match(source, /if \(powerups === undefined \|\| powerups === null\) return false/);
  assert.match(source, /this\.syncPowerupState\(motion\.powerups, delta\)/);
  assert.match(source, /detail\.duration \?\? detail\.remaining \?\? detail\.timeLeft/);
});

test("renders each powerup as a lane-readable persistent visual", () => {
  for (const token of [
    "createPowerupVisualRig", "magnetArcs", "magnetBend", "shieldShell", "shieldRings",
    "afterimages", "scorePulses", "ground-speed-wave", "speedWaves", "edgeFlow"
  ]) assert.ok(source.includes(token), token);
  assert.match(source, /x = THREE\.MathUtils\.lerp\(baseX, this\.currentLaneX, magnetBend\)/);
  assert.match(source, /this\.camera\.position\.z[\s\S]*this\.powerupStrengths\.overdrive \* 0\.42/);
  assert.match(source, /this\.edgeLight\.intensity = 1\.75 \+ overdriveStrength/);
  assert.match(source, /new THREE\.InstancedMesh\(speedWaveGeometry, speedWaveMaterial, 6\)/);
  assert.match(source, /new THREE\.InstancedMesh\(edgeFlowGeometry, edgeFlowMaterial, 20\)/);
});

test("pools block impacts and does not allocate Three.js resources during powerup updates", () => {
  assert.match(source, /const POWERUP_IMPACT_POOL_SIZE = 4/);
  assert.match(source, /this\.powerupEffectPool\[this\.powerupEffectCursor % this\.powerupEffectPool\.length\]/);
  assert.match(source, /new THREE\.InstancedMesh\(impactShardGeometry, shardMaterial, 12\)/);
  assert.match(source, /slot\.group\.visible = false/);
  const updateStart = source.indexOf("  updatePowerupVisuals(delta, time, speed, arriving) {");
  const updateEnd = source.indexOf("\n  preloadBackdrops()", updateStart);
  assert.ok(updateStart > 0 && updateEnd > updateStart);
  assert.doesNotMatch(source.slice(updateStart, updateEnd), /new THREE\./);
  assert.match(source, /powerupGeometryCache/);
  assert.match(source, /SHARED_GEOMETRIES\.add\(geometry\)/);
});

test("turns story collection and synergy into local, short-lived scene reactions", () => {
  for (const token of [
    "triggerStoryWorld", "storyRoadPatches", "localWeather", "storyWorldInfluence",
    "triggerStorySynergy", "synergyWaves", "synergyInfluence"
  ]) assert.ok(source.includes(token), token);
  assert.match(source, /new THREE\.PointLight\(accent, 0, 8, 2\)/);
  assert.match(source, /world\.changeType \|\| interaction\.changeType \|\| gameplay\.effect/);
  assert.match(source, /const character = interaction\.character/);
  assert.match(source, /character\.immediateAction \|\| character\.action/);
  assert.match(source, /this\.storyWorldState\.gesture === "surge"/);
  assert.match(source, /this\.storyWorldInfluence > 0\.001/);
  assert.match(source, /interaction\.duration \?\? world\.duration \?\? gameplay\.durationMs/);
  assert.match(source, /this\.storyWorldState\.kind === "umbrella"/);
  assert.match(source, /this\.rain\.material\.opacity \*= 1 - this\.storyWorldInfluence/);
  assert.match(source, /this\.flash = Math\.max\(this\.flash, 0\.34\)/);
  assert.match(source, /this\.shake = Math\.max\(this\.shake, 0\.24\)/);
  assert.match(source, /this\.speedPulse = Math\.max\(this\.speedPulse, 1\.18\)/);
});
