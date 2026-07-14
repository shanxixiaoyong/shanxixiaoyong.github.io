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
const content = require("../assets/runner-love-content.js");

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

test("gives every chapter a distinct world, road, obstacle, particle, and depth identity", () => {
  for (const token of [
    "rain-campus", "river-bookstore", "neon-cinema", "night-market-river", "lived-in-neighborhood", "storm-old-bridge", "dawn-station",
    "crowned-campus", "riverside-boardwalk", "tram-canyon", "market-cobbles", "neighborhood-patchwork", "bridge-grating", "terminal-platforms",
    "campus-commute", "bookstore-delivery", "cinema-transit", "market-stalls", "daily-delivery", "storm-maintenance", "station-departure",
    "leaf-drips", "paper-pages", "neon-dust", "lantern-embers", "kitchen-steam", "storm-spray", "dawn-sparks",
    "campus-canopy", "river-depth", "cinema-canyon", "market-river", "home-rooftops", "storm-bridge", "terminal-dawn"
  ]) assert.ok(source.includes(`"${token}"`), token);
  for (const builder of [
    "createRainCampusWorld", "createRiverBookstoreWorld", "createNeonCinemaWorld", "createNightMarketWorld",
    "createNeighborhoodWorld", "createStormBridgeWorld", "createDawnStationWorld", "createStageRoadProfile", "decorateObstacleForStage"
  ]) assert.match(source, new RegExp(`function ${builder}\\(`));
  for (const obstacleBuilder of [
    "createCampusCycleObstacle", "createBookTrolleyObstacle", "createCinemaProjectorObstacle", "createMarketStallObstacle",
    "createCargoBikeObstacle", "createStormRigObstacle", "createLuggageTrolleyObstacle"
  ]) assert.match(source, new RegExp(`function ${obstacleBuilder}\\(`));
  assert.match(source, /const STAGE_OBSTACLE_PALETTES = Object\.freeze\(\[/);
  assert.match(source, /function stageObstacleSurfaceTexture\(/);
  assert.match(source, /function addObstacleContactShadow\(/);
  assert.match(source, /this\.roadTextures = STAGE_CONFIGS\.map\(\(_, stageIndex\) => makeRoadTexture\(stageIndex\)\)/);
  assert.equal(content.STAGE_BLUEPRINTS.length, 7);
  content.STAGE_BLUEPRINTS.forEach((stage) => {
    assert.ok(stage.world.sceneMood && stage.world.timeWeather && stage.world.colorPalette, stage.id);
    assert.equal(stage.world.landmarks.length, 3, stage.id);
    assert.ok(stage.world.roadDesign.identity, stage.id);
    assert.ok(stage.obstacleDesign.obstacles.length >= 3, stage.id);
  });
});

test("prefers structured content world and theme fields with legacy fallbacks", () => {
  for (const token of [
    "resolveStageVisualConfig", "contentStageAt", "globalThis.RunnerLoveContent?.STAGES", "explicitStage.world", "explicitStage.theme",
    "sceneMood", "timeWeather", "colorPalette", "roadDesign", "obstacleDesign", "stageContentRef", "setStageContent(stageContent"
  ]) assert.ok(source.includes(token), token);
  assert.match(source, /const road = \{ \.\.\.fallback\.world\.road, \.\.\.objectValue\(world\.roadDesign\), \.\.\.objectValue\(world\.road\) \}/);
  assert.match(source, /landmarks: Array\.isArray\(world\.landmarks\)/);
  assert.match(source, /frame\.stageContent/);
});

test("enforces camera-frustum and track clearance before installing scenery", () => {
  for (const token of [
    "TRACK_CLEARANCE", "frustumClearanceAt", "constrainTracksidePlacement", "fitTracksideObject", "decorBoundsVisible",
    "validateModelEnvelope", "viewFrustum", "projectionViewMatrix", "intersectsSphere", "clearancePlacements"
  ]) assert.ok(source.includes(token), token);
  assert.match(source, /TRACK_CLEARANCE\.premiumNearZ - halfDepth - Math\.max\(0, parallaxTravel\)/);
  assert.match(source, /instances\.computeBoundingBox\(\)/);
  assert.match(source, /instances\.computeBoundingSphere\(\)/);
  assert.match(source, /const runnerEnvelope = \{ width: 3\.2, height: 3\.6, depth: 3\.4 \}/);
  assert.match(source, /validateModelEnvelope\(riggedPlayer, runnerEnvelope\)/);
  assert.match(source, /while \(z > nearLimit\) z -= entry\.span/);
  const cityLoadStart = source.indexOf("  loadPremiumCity() {");
  const cityLoadEnd = source.indexOf("\n  buildRoad()", cityLoadStart);
  const cityLoad = source.slice(cityLoadStart, cityLoadEnd);
  assert.ok(cityLoadStart > 0 && cityLoadEnd > cityLoadStart);
  assert.match(cityLoad, /loadToken !== this\.cityLoadToken/);
  assert.doesNotMatch(cityLoad, /setStage\(this\.stageIndex/);
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
  assert.match(source, /this\.companion\.visible = arriving \|\| relationshipVisible/);
  assert.match(source, /updateRelationshipPresence\(delta, time, speed, arriving, introActive\)/);
  const sources = fs.readFileSync(path.join(root, "assets/runner-models/SOURCES.md"), "utf8");
  assert.match(sources, /cartoon-city-massive-pack-characters/);
});

test("directs all twenty-one acts as unique spaces rather than palette swaps", () => {
  const start = source.indexOf("const ACT_VISUAL_DIRECTIONS");
  const end = source.indexOf("const RELATIONSHIP_MODES", start);
  const block = source.slice(start, end);
  const expectedActs = content.STAGE_BLUEPRINTS.flatMap((stage) => stage.segments.map((segment) => segment.id));
  const ids = [...block.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
  const topologies = [...block.matchAll(/topology: "([^"]+)"/g)].map((match) => match[1]);
  const goals = [...block.matchAll(/goal: "([^"]+)"/g)].map((match) => match[1]);
  const cameras = [...block.matchAll(/cameraRig: "([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(ids, expectedActs);
  assert.equal(new Set(topologies).size, 21);
  assert.equal(new Set(goals).size, 21);
  assert.equal(new Set(cameras).size, 21);
  for (const token of ["width", "curve", "split", "goalX", "fog", "rain", "edge", "relation"]) assert.match(block, new RegExp(`${token}:`));
  assert.match(source, /configureDirectorVisualRig\(this\.directorVisualRig, profile/);
  assert.match(source, /function normalizeGoalVisualKey\(value\)/);
  for (const authoredGoal of ["campus-bell-rope", "vending-change-slot", "crossing-countdown", "departure-flipboard", "market-scale-bell", "shelter-drip-chain", "home-entry-tray"]) {
    const semantic = authoredGoal.split("-").at(-1);
    assert.ok(source.includes(semantic), authoredGoal);
  }
  assert.match(source, /this\.canvas\.setAttribute\("data-route-topology", profile\.topology\)/);
});

test("accepts director commands as persistent visual state with duplicate protection", () => {
  assert.match(source, /  applyDirectorCommand\(command = \{\}\)/);
  for (const op of [
    "set-stage", "set-act", "reenter-act", "reveal", "physical-consequence", "recover", "relationship-presence", "use-item",
    "semantic-beat", "semantic-gate-complete", "semantic-hold", "stage-gate-pending", "branch-shift"
  ]) {
    assert.ok(source.includes(`op === "${op}"`), op);
  }
  for (const field of ["processedCommandIds", "commandHighWater", "revealStrength", "consequenceStrength", "recoverStrength", "backgroundTarget", "fogTarget", "accentTarget"]) {
    assert.ok(source.includes(field), field);
  }
  assert.match(source, /state\.processedCommandIds\.has\(id\)/);
  assert.match(source, /stamp\.ordinal <= \(state\.commandHighWater\.get\(stamp\.scope\) \|\| 0\)/);
  assert.doesNotMatch(source, /lastCommandIds\.length > 64/);
  assert.match(source, /this\.setRoutePhase\(nextAct, phaseContent\)/);
});

test("stages the companion as embodied relationship action from chapter two onward", () => {
  for (const mode of [
    "parallel-left", "yield-right", "wait-left", "misalign-left", "missed-right",
    "express-ahead", "listen-left", "clear-obstacle", "luggage-left", "luggage-handoff", "home-together"
  ]) assert.ok(source.includes(`"${mode}"`), mode);
  for (const token of ["relationshipParcel", "sharedObstacle", "relationAction", "RELATION_FACE_PLAYER", "RELATION_LINK_MODES", "RELATION_SHARED_MODES"]) {
    assert.ok(source.includes(token), token);
  }
  assert.match(source, /this\.directorState\.stageIndex > 0/);
  assert.match(source, /mode === "misalign-left"/);
  assert.match(source, /mode === "missed-right"/);
  assert.match(source, /mode === "listen-left"/);
  assert.match(source, /mode === "clear-obstacle"/);
  assert.match(source, /relation\.weight === "handoff"/);
  assert.match(source, /Math\.max\(55, Number\(camera\[5\]\)/);
  assert.match(source, /const COMPANION_SHOULDER_X = ROAD_WIDTH \/ 2 - 0\.38/);
  assert.match(source, /targetX \+= shoulderSide \* this\.companionHazardProximity \* 0\.82/);
  assert.match(source, /companionHazard = Math\.max/);
});

test("keeps chapter two's central sightline clear for hazards and goals", () => {
  assert.match(source, /const preserveCenterSightline = this\.stageIndex === 1/);
  assert.match(source, /!preserveCenterSightline && index < 10 && spanningType/);
  assert.match(source, /!preserveCenterSightline && index % Math\.max/);
  assert.match(source, /preserveCenterSightline \? 6\.7 : 5\.95/);
  assert.match(source, /const stageTwoSightlineClear = this\.stageIndex !== 1/);
  assert.match(source, /Math\.abs\(entry\.baseX\) >= 6\.2/);
});

test("keeps three lanes readable while route phases rebuild the surrounding city", () => {
  assert.match(source, /laneGuides:\s*new THREE\.InstancedMesh/);
  for (const batch of ["laneTicks", "crosswalks", "drains", "roadPatches", "manholes", "edgePosts", "planterBases", "planterLeaves"]) assert.ok(source.includes(`${batch}: new THREE.InstancedMesh`), batch);
  assert.match(source, /setRoutePhase\(value, phaseContent = null\)/);
  assert.match(source, /const phase = this\.routePhase \|\| 0/);
  assert.match(source, /this\.rebuildDecor\(\)/);
  assert.match(source, /this\.roadBatches\.laneGuides\.visible = !railRoute/);
  assert.match(source, /frame\.phaseDefinition \|\| null/);
  assert.match(source, /visual\.collectibleVisualKey/);
  assert.match(source, /createPhaseTokenGeometry\(this\.stageIndex, nextPhase\)/);
  assert.match(source, /entity\.data\?\.collectibleKind/);
  assert.match(source, /batches\.hearts\.setColorAt/);
  assert.match(source, /INTRO_CAMERA_CUES/);
  assert.match(source, /this\.stageIntroState\.cameraCue/);
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
  assert.match(source, /\.\.\.this\.arrivalStageTextures/);
  assert.match(source, /disposedTextures\.has\(texture\)/);
});

test("uses adaptive quality telemetry and reuses entity meshes for a sustained mobile run", () => {
  for (const token of ["entityPool", "SHARED_GEOMETRIES", "sharedTexture", "data-render-calls", "data-render-triangles", "data-render-quality", "frameAverage", "qualityElapsed", "QUALITY_PROFILES", "targetDrawCalls", "decorStride", "syncQualityVisibility"]) assert.ok(source.includes(token), token);
  assert.match(source, /estimatedFps < 48/);
  assert.match(source, /estimatedFps > 57/);
  assert.match(source, /key: "balanced", targetDrawCalls: 90/);
  assert.match(source, /drawCalls > profile\.targetDrawCalls \+ 12/);
  assert.match(source, /effectiveDecorStride > 0/);
  assert.match(source, /index % Math\.max\(effectiveDecorStride, cadenceStride\) === 0/);
  assert.match(source, /this\.activeEntityIds/);
  assert.match(source, /const ENTITY_POOL_LIMIT = 5/);
  assert.match(source, /bucket\.length < ENTITY_POOL_LIMIT/);
  assert.match(source, /if \(!SHARED_GEOMETRIES\.has\(item\)\) item\.dispose/);
});

test("enforces the 720x1280 mobile draw-call budget with real scene suppression", () => {
  assert.match(source, /key: "performance", targetDrawCalls: 92, decorStride: 3, worldLayers: 2, premiumCity: true, shadows: false/);
  assert.match(source, /this\.mobilePerformance = cssWidth <= 800 && cssHeight >= 1000 && cssHeight > cssWidth/);
  assert.match(source, /this\.applyQualityProfile\("performance"\)/);
  assert.match(source, /const premiumStageAllowed = !this\.mobilePerformance/);
  assert.match(source, /const suppressFallback = this\.mobilePerformance \|\| profile\.premiumCity/);
  assert.match(source, /this\.roadBatches\.edgePosts\.visible = !arriving && detail > 0/);
  assert.match(source, /this\.roadBatches\.laneGuides\.visible = !arriving && !railRoute/);
  assert.match(source, /const effectiveDecorStride = railRoute && this\.qualityProfile\?\.key === "performance"/);
  assert.match(source, /const visibleWorldLayers = railRoute && profile\.key === "performance" \? 1 : profile\.worldLayers/);
  assert.match(source, /train\.visible = !this\.mobilePerformance/);
  assert.match(source, /object\.position\.z >= -this\.qualityProfile\.entityRange/);
  assert.match(source, /applyEntityQuality\(object, this\.qualityProfile\.entityMeshBudget\)/);
  assert.match(source, /applyCharacterRenderQuality\(this\.player, profile\.key === "performance", profile\.shadows\)/);
  assert.match(source, /!this\.mobilePerformance && this\.qualityGoodWindows >= 4/);
});

test("uses every act cadence for scenery spacing, world motion, effects, and camera rhythm", () => {
  assert.match(source, /cadence: clamp\(Number\(director\.cadence \?\? phaseContent\?\.cadence \?\? base\.cadence\)/);
  assert.match(source, /const cadenceStride = Math\.max\(1, Math\.round\(cadence \/ 2\.2\)\)/);
  assert.match(source, /const cadenceRate = Math\.PI \* 2 \/ cadence/);
  assert.match(source, /this\.cadencePhase = cadencePhase/);
  assert.match(source, /const cadenceMotion = clamp\(4\.2 \/ cadence/);
  assert.match(source, /const cadenceCamera = Math\.sin\(this\.cadencePhase\)/);
});

test("disposes all material texture slots and self-disposes late asynchronous assets", () => {
  for (const slot of ["normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "transmissionMap", "clearcoatNormalMap"]) {
    assert.ok(source.includes(`"${slot}"`), slot);
  }
  assert.match(source, /function disposeGltf\(gltf\)/);
  assert.match(source, /if \(this\.disposed \|\| loadToken !== this\.runnerLoadToken\) \{[\s\S]*disposeGltf\(playerGltf\)/);
  assert.match(source, /if \(this\.disposed \|\| loadToken !== this\.cityLoadToken\) \{[\s\S]*disposeGltf\(cityGltf\)/);
  assert.match(source, /if \(this\.disposed\) \{[\s\S]*texture\.dispose\(\)/);
  assert.match(source, /disposeObject\(this\.scene\)/);
  assert.match(source, /this\.renderer\.renderLists\?\.dispose\(\)/);
});

test("pools transient particles and rings instead of allocating GPU resources per event", () => {
  for (const token of ["TRANSIENT_BURST_POOL_SIZE", "TRANSIENT_RING_POOL_SIZE", "createTransientEffectPool", "burstPoolCursor", "ringPoolCursor"]) {
    assert.ok(source.includes(token), token);
  }
  const effectStart = source.indexOf("  effect(type, detail = {}) {");
  const renderStart = source.indexOf("\n  render(frame = {}) {", effectStart);
  const eventPath = source.slice(effectStart, renderStart);
  assert.ok(effectStart > 0 && renderStart > effectStart);
  assert.doesNotMatch(eventPath, /new THREE\./);
  assert.doesNotMatch(eventPath, /new Float32Array/);
  assert.match(eventPath, /this\.transientEffects\.bursts\[this\.burstPoolCursor/);
  assert.match(eventPath, /this\.transientEffects\.rings\[this\.ringPoolCursor/);
  assert.match(source, /burst\.points\.visible = false/);
  assert.match(source, /ring\.mesh\.visible = false/);
});

test("turns semantic, branch, choice, and arrival contracts into physical world feedback", () => {
  for (const type of ["choice-window", "arrival-interaction"]) assert.ok(source.includes(`type === "${type}"`), type);
  for (const field of ["semanticStrength", "gatePendingStrength", "branchMarkers", "branchMaterial", "choiceWindowState", "arrivalInteractionState"]) {
    assert.ok(source.includes(field), field);
  }
  assert.match(source, /targetZ -= state\.semanticStrength \* 1\.35/);
  assert.match(source, /state\.branch\.target = 1/);
  assert.match(source, /side \* \(COMPANION_SHOULDER_X \+ 0\.32\)/);
  assert.match(source, /this\.streetGlowMaterial\.color\.copy\(state\.accentTarget\)\.lerp\(state\.branch\.color/);
  assert.match(source, /arrivalInteraction \* 5\.5/);
});

test("updates director and relationship animation without allocating Three resources per frame", () => {
  const relationshipStart = source.indexOf("  updateRelationshipPresence(delta, time, speed, arriving, introActive) {");
  const directorEnd = source.indexOf("\n  resize(width, height", relationshipStart);
  assert.ok(relationshipStart > 0 && directorEnd > relationshipStart);
  const hotPath = source.slice(relationshipStart, directorEnd);
  assert.doesNotMatch(hotPath, /new THREE\./);
  assert.match(hotPath, /instanceMatrix\.needsUpdate = true/);
  assert.match(hotPath, /rig\.dummy/);
  assert.match(source, /activeIds\.clear\(\)/);
});

test("resets pooled models by stage generation and restores every mutable node", () => {
  for (const token of ["capturePoolBaseline", "resetPooledObject", "resetEntityPoolForStage", "poolStage", "poolGeneration", "data-pool-generation"]) {
    assert.ok(source.includes(token), token);
  }
  assert.match(source, /entry\.node\.position\.copy\(entry\.position\)/);
  assert.match(source, /entry\.node\.quaternion\.copy\(entry\.quaternion\)/);
  assert.match(source, /entry\.node\.scale\.copy\(entry\.scale\)/);
  assert.match(source, /object\.userData\.poolStage !== this\.stageIndex \|\| object\.userData\.poolGeneration !== this\.poolGeneration/);
  assert.match(source, /if \(stageChanged \|\| structuredContentChanged\) this\.resetEntityPoolForStage\(nextIndex\)/);
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
  assert.match(source, /this\.edgeLight\.intensity = config\.world\.lighting\.edgeIntensity \+ overdriveStrength/);
  assert.match(source, /new THREE\.InstancedMesh\(speedWaveGeometry, speedWaveMaterial, 6\)/);
  assert.match(source, /new THREE\.InstancedMesh\(edgeFlowGeometry, edgeFlowMaterial, 20\)/);
});

test("exposes stage-intro beats plus low-state and failure visual APIs", () => {
  for (const method of [
    "beginStageIntro", "stageIntro", "stageIntroBeat", "endStageIntro", "updateStageIntroVisual",
    "setStatusVisual", "setLowStateVisual", "setDanger", "setFailureVisual", "showFailure", "clearFailure", "clearStatusVisual"
  ]) assert.match(source, new RegExp(`  ${method}\\(`));
  for (const event of ["stage-intro", "failure", "low-state", "status-visual"]) assert.ok(source.includes(`type === "${event}"`), event);
  assert.match(source, /const LOW_STATE_THRESHOLD = 34/);
  assert.match(source, /runState\.status === "failed" \? "failed" : condition <= LOW_STATE_THRESHOLD \? "low" : "normal"/);
  assert.match(source, /Number\(detail\.openingPerformance\?\.durationMs\) \/ 1000/);
  assert.match(source, /this\.statusVisuals\.vignetteMaterial\.opacity/);
  assert.match(source, /blending: THREE\.MultiplyBlending, premultipliedAlpha: true/);
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
