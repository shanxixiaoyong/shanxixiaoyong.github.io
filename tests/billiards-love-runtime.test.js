const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = readFileSync(path.join(__dirname, "../assets/billiards-love-game.js"), "utf8");
const physicsSource = readFileSync(path.join(__dirname, "../assets/billiards-physics.js"), "utf8");
const rendererSource = readFileSync(path.join(__dirname, "../assets/billiards-ball-renderer.js"), "utf8");

function implementationOf(sourceText, name) {
  const marker = `function ${name}(`;
  const start = sourceText.indexOf(marker);
  assert.notEqual(start, -1, `${name} should exist`);
  const next = sourceText.indexOf("\n  function ", start + marker.length);
  return sourceText.slice(start, next === -1 ? sourceText.length : next);
}

test("builds a fixed-120Hz custom spin and impulse table without Matter", () => {
  assert.match(source, /const FIXED_HZ = 120/);
  assert.match(source, /const FIXED_STEP = 1000 \/ FIXED_HZ/);
  assert.match(source, /const MAX_STEPS_PER_FRAME = 8/);
  assert.match(source, /const Physics = window\.BilliardsPhysics/);
  assert.match(source, /const engine = Engine\.create\(\{ enableSleeping: false \}\)/);
  assert.match(source, /engine\.gravity\.x = 0/);
  assert.match(source, /engine\.gravity\.y = 0/);
  assert.match(source, /Bodies\.circle\s*\(/);
  assert.match(source, /Bodies\.rectangle\s*\(/);
  assert.match(source, /while \(accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME\)/);
  assert.match(source, /Events\.on\(engine, "collisionStart"/);
  assert.doesNotMatch(source, /window\.Matter|const Matter/);
  assert.match(physicsSource, /model: "continuous-spin-impulse"/);
  assert.match(physicsSource, /ballRestitution: 0\.925/);
  assert.match(physicsSource, /slidingFriction: 0\.126/);
  assert.match(physicsSource, /function dynamicBallFriction\(/);
  assert.match(physicsSource, /function resolveBallPair\(/);
  assert.match(physicsSource, /function resolveRailCollision\(/);
  assert.match(physicsSource, /maxSubsteps: 10/);
});

test("uses one portrait logical world with the cue below a complete upward-facing rack", () => {
  assert.match(source, /const WORLD = Object\.freeze\(\{ width: 720, height: 1440 \}\)/);
  assert.match(source, /const TABLE = Object\.freeze\(\{ left: 58, right: 662, top: 116, bottom: 1324 \}\)/);
  const [, left, right, top, bottom] = source.match(/const TABLE = Object\.freeze\(\{ left: (\d+), right: (\d+), top: (\d+), bottom: (\d+) \}\)/).map(Number);
  const width = right - left;
  const height = bottom - top;
  assert.ok(width / 540 >= 1.11 && width / 540 <= 1.13, "playing width should grow about 12%");
  assert.ok(height / 1080 >= 1.11 && height / 1080 <= 1.13, "playing length should grow about 12%");
  assert.ok(Math.abs(height / width - 2) < 0.01, "playing surface should remain approximately 1:2");
  assert.match(source, /const CUE_SPOT = Object\.freeze\(\{ x: WORLD\.width \/ 2, y: 1080 \}\)/);
  assert.match(source, /const RACK_APEX = Object\.freeze\(\{ x: WORLD\.width \/ 2, y: 510 \}\)/);
  assert.match(source, /const RACK = Object\.freeze\(\[\s*\[1\],\s*\[4, 9\],\s*\[2, 8, 10\]/s);
  assert.match(source, /createBall\(0, CUE_SPOT\.x, CUE_SPOT\.y\)/);
  assert.match(source, /const y = RACK_APEX\.y - rowIndex \* yStep/);
  assert.match(source, /const x = RACK_APEX\.x \+ \(index - rowIndex \/ 2\) \* spacing/);
  assert.match(source, /let aimDirection = \{ x: 0, y: -1 \}/);
  assert.match(source, /number === 0 \? "hb-cue-ball" : `hb-object-ball-\$\{number\}`/);
});

test("implements six portrait pockets and a delayed, duplicate-safe pocket lifecycle", () => {
  for (const pocket of ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"]) {
    assert.ok(source.includes(`id: "${pocket}"`), `missing ${pocket} pocket`);
  }
  assert.match(source, /const BALL_DIAMETER = BALL_RADIUS \* 2/);
  assert.match(source, /const POCKET_RADIUS = 37\.6/);
  assert.match(source, /const CORNER_POCKET_MOUTH = BALL_DIAMETER \* 2\.28/);
  assert.match(source, /const SIDE_POCKET_MOUTH = BALL_DIAMETER \* 2\.53/);
  assert.match(source, /const CORNER_POCKET_SHELF = BALL_DIAMETER \* 0\.65/);
  assert.match(source, /const SIDE_POCKET_SHELF = BALL_DIAMETER \* 0\.14/);
  assert.match(source, /const POCKET_VISUAL_CAPTURE_RATIO = 0\.25/);
  assert.match(source, /const CORNER_CUT_ANGLE_DEGREES = 142/);
  assert.match(source, /const SIDE_CUT_ANGLE_DEGREES = 104/);
  assert.match(source, /const captureDepth = Math\.min\(shelf, BALL_RADIUS \* POCKET_VISUAL_CAPTURE_RATIO\)/);
  assert.match(source, /mouthX,[\s\S]*?mouthY,[\s\S]*?captureX: mouthX \+ inwardX \* captureDepth,[\s\S]*?captureY: mouthY \+ inwardY \* captureDepth/);
  assert.match(source, /x: mouthX \+ inwardX \* dropDepth/);
  assert.match(source, /y: mouthY \+ inwardY \* dropDepth/);
  assert.match(source, /const POCKET_MIN_DURATION = 280/);
  assert.match(source, /const POCKET_MAX_DURATION = 450/);
  assert.match(source, /function crossedPocketLine\(body, pocket, lineDepth, halfWidth, depthTolerance = 0, lateralTolerance = 0\)/);
  assert.match(source, /function enterPocketMouth\(body, pocket\)/);
  assert.match(source, /function advancePocketApproach\(body, pocket\)/);
  assert.match(source, /enteredAt: simulationTime/);
  assert.match(source, /approach\.enteredAt < simulationTime/);
  assert.match(source, /const POCKET_LIP_SETTLE_RATIO = 0\.88/);
  assert.match(source, /const settledOverLip = body\.speed <= NATURAL_STOP_SPEED/);
  assert.match(source, /approach\.maximumDepth >= requiredDepth/);
  assert.match(source, /inwardPocketSpeed\(body, pocket\) <= POCKET_MIN_INWARD_SPEED/);
  assert.doesNotMatch(source, /Body\.applyForce/);
  assert.match(source, /if \(!shotState \|\| !data \|\| data\.potted \|\| data\.pocketing\) return false/);
  assert.match(source, /data\.pocketing = \{/);
  assert.match(source, /function updatePocketing\(\)/);
  assert.match(source, /if \(progress >= 1\) completePocketBall\(ball\)/);
  assert.match(source, /function completePocketBall\(body\)[\s\S]*?removeBall\(body\)/);
  assert.match(source, /if \(number === 0\) \{\s*shotState\.cueScratch = true/);
  assert.match(source, /!shotState\.pottedNumbers\.includes\(number\)/);
  assert.match(source, /if \(data\?\.pocketing\) \{\s*moving = true/);
  assert.match(source, /if \(!cueBall && !runState\.endState\.ended\) respotBall\(0\)/);
});

test("builds physical rotated corner and side-pocket jaws plus containment guards", () => {
  assert.match(source, /function createJaw\(start, end, id\)/);
  assert.match(source, /function createPocketJaw\(pocket, side, id\)/);
  assert.match(source, /const heading = entryAngle - side \* pocket\.jawOffset/);
  assert.match(source, /CORNER_CUT_ANGLE_DEGREES - 135/);
  assert.match(source, /SIDE_CUT_ANGLE_DEGREES - 90/);
  assert.match(source, /kind = "cushion"/);
  assert.match(source, /"jaw"/);
  assert.equal((source.match(/createPocketJaw\(pocket\[/g) || []).length, 12);
  for (const id of ["jaw-top-left-horizontal", "jaw-bottom-right-vertical", "jaw-middle-left-top", "jaw-middle-right-bottom"]) {
    assert.ok(source.includes(`"${id}"`), `missing physical jaw ${id}`);
  }
  assert.equal((source.match(/"guard-(?:top|bottom|left|right)"/g) || []).length, 4);
  assert.match(source, /function containLooseBalls\(\)/);
});

test("renders layered wood, wool, rubber, metal, leather, and deep pocket materials", () => {
  for (const token of [
    "drawSolidWoodFrame", "drawWoolCloth", "drawCushionRubber", "drawMetalSights", "drawPocketInnerWall", "drawLeatherPocket"
  ]) {
    assert.ok(source.includes(`function ${token}`), `missing table material renderer ${token}`);
  }
  assert.match(source, /for \(let y = TABLE_OUTER\.top \+ 14/);
  assert.match(source, /for \(let y = TABLE\.top \+ 2/);
  assert.match(source, /billiards-textures\/worsted-cloth\.jpg/);
  assert.match(source, /billiards-textures\/dark-walnut\.jpg/);
  assert.match(source, /drawMaterialTexture\(MATERIAL_TEXTURES\.cloth/);
  assert.doesNotMatch(source, /context\.setLineDash\(\[2, 3\]\)/);
  assert.match(source, /context\.shadowBlur = 12/);
  assert.match(source, /\["#0c121c", "#536277", "#172230"\]/);
  assert.match(source, /context\.strokeStyle = "rgba\(199, 230, 255, 0\.82\)"/);
  assert.doesNotMatch(source, /context\.translate\(pocket\.mouthX, pocket\.mouthY\)/);
  assert.doesNotMatch(source, /context\.scale\(0\.18, 1\)/);
  assert.match(source, /POCKETS\.forEach\(drawLeatherPocket\)/);
});

test("pre-renders the static material table instead of rebuilding it every frame", () => {
  assert.match(source, /function rebuildTableCache\(\)/);
  assert.match(source, /cache\.width = WORLD\.width \* 2/);
  assert.match(source, /function drawTableLayer\(\)/);
  assert.match(source, /context\.drawImage\(tableCacheCanvas, 0, 0, WORLD\.width, WORLD\.height\)/);
  assert.match(source, /drawTableLayer\(\);/);
});

test("adapts to an optional Three ball renderer and retains a per-frame 2D fallback", () => {
  assert.match(source, /const Renderer = window\.BilliardsBallRenderer/);
  assert.match(source, /document\.querySelector\("#hb-ball-canvas"\)/);
  assert.match(source, /typeof Renderer\?\.create === "function"/);
  assert.match(source, /ballRenderer = factory \? factory\(options\) : new Renderer\(options\)/);
  assert.match(source, /worldWidth: WORLD\.width/);
  assert.match(source, /colors: BALL_COLORS/);
  assert.match(source, /ballRenderer\.resize\(/);
  assert.match(source, /ballRenderer\.sync\(renderBalls/);
  assert.match(source, /ballRenderer\.render\(timestamp\)/);
  assert.match(source, /const pixelRatio = Math\.max\(1, Math\.min\(renderScale, MAX_BALL_RENDER_SCALE\)\)/);
  assert.match(source, /rendered === false \|\| ballRenderer\.supported === false/);
  assert.match(source, /failedCanvas\.style\.visibility = "hidden"/);
  assert.match(source, /const renderedByBallRenderer = syncBallRenderer\(timestamp\)/);
  assert.match(source, /if \(!renderedByBallRenderer\) \{[\s\S]*?drawBall\(ball, timestamp\)/);
  assert.match(source, /catch \{\s*disableBallRenderer\(\)/);
});

test("keeps the 3D ball layer light enough for high-DPR portrait phones", () => {
  assert.match(source, /const MAX_BALL_RENDER_SCALE = 3\.5/);
  assert.match(source, /Math\.min\(renderScale, MAX_BALL_RENDER_SCALE\)/);
  assert.match(rendererSource, /new as\(this\.ballRadius,32,16\)/);
  assert.doesNotMatch(rendererSource, /antialias:!0/);
});

test("maps touch coordinates directly into the portrait world without rotation inversion", () => {
  assert.match(source, /function clientPointToWorld\(clientX, clientY, rect/);
  assert.match(source, /x: displayX \* WORLD\.width/);
  assert.match(source, /y: displayY \* WORLD\.height/);
  assert.doesNotMatch(source, /height > width/);
  assert.doesNotMatch(source, /displayY \* WORLD\.width/);
  assert.doesNotMatch(source, /1 - displayX/);
});

test("overrides the legacy rotated canvas and caps high-DPR rendering work", () => {
  assert.match(source, /aspectRatio: "1 \/ 2"/);
  assert.match(source, /transform: "none"/);
  assert.match(source, /const MAX_RENDER_WIDTH = 1200/);
  assert.match(source, /const MAX_RENDER_HEIGHT = 2400/);
  assert.match(source, /Math\.sqrt\(MAX_RENDER_PIXELS \/ \(cssWidth \* cssHeight\)\)/);
  assert.match(source, /context\.setTransform\(canvas\.width \/ WORLD\.width/);
  assert.match(source, /window\.addEventListener\("resize", resizeCanvas\)/);
});

test("supports direct pull aiming with release and second-pointer strike triggers", () => {
  for (const event of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) {
    assert.ok(source.includes(`"${event}"`), `missing ${event}`);
  }
  assert.doesNotMatch(source, /先点选这一杆的目标球/);
  assert.match(source, /declaredBall: null/);
  assert.doesNotMatch(source, /const inferredTarget/);
  assert.match(source, /canvas\.setPointerCapture\?\.\(event\.pointerId\)/);
  assert.match(source, /const MAX_PULL = 300/);
  assert.match(source, /start: \{ \.\.\.point \}/);
  assert.match(source, /x: pointerAim\.start\.x - point\.x/);
  assert.match(source, /pointerAim\.pullRatio = clamp\(\(pullDistance - MIN_PULL\)/);
  assert.match(source, /pointerAim\.power = powerFromPullRatio\(pointerAim\.pullRatio\)/);
  assert.match(source, /const LIGHT_PULL_END = 0\.24/);
  assert.match(source, /const STRONG_PULL_START = 0\.82/);
  assert.match(source, /const LIGHT_POWER_MAX = 0\.30/);
  assert.match(source, /const STRONG_POWER_MIN = 0\.76/);
  assert.doesNotMatch(source, /AIM_LOCK|aimLocked|lockedDirection|refreshAimLock/);
  assert.match(source, /pointerAim\.direction = normalize\(pull, pointerAim\.direction\)/);
  assert.match(source, /function strikeWithSecondPointer\(event\)/);
  assert.match(source, /if \(pointerAim && event\.pointerId !== pointerAim\.id\) \{/);
  assert.match(source, /strikeWithSecondPointer\(event\)/);
  assert.match(source, /updateAim\(pointerToWorld\(event\)\);\s*releaseAim\(event, true\)/);
  assert.match(source, /secondPointerStrike: true/);
  assert.match(source, /releaseStrike: true/);
  assert.match(source, /const MAX_SHOT_SPEED = 42/);
  assert.doesNotMatch(source, /distance\(point, cueBall\.position\) > 54/);
  assert.match(source, /function drawCuePowerGauge\(direction, pullRatio\)/);
  assert.match(source, /if \(pointerAim\) drawCuePowerGauge\(direction, pointerAim\.pullRatio\)/);
  assert.doesNotMatch(source, /elements\.power(?:Fill|Value|\.hidden)/);
  assert.match(source, /if \(shouldShoot && power > 0\.015\) shoot\(direction, power\)/);
  assert.match(source, /event\.isPrimary === false/);
  assert.match(source, /!shotState && !pointerAim && !resolvingShot/);
});

test("tracks cumulative roll and rotates numbered texture and highlights with it", () => {
  assert.match(source, /rollAngle: 0/);
  assert.match(source, /rollVelocity: 0/);
  assert.match(source, /lastPosition: \{ x, y \}/);
  assert.match(source, /function updateRollingState\(\)/);
  assert.match(source, /data\.rollAngle = ball\.physics\.rollAngle/);
  assert.match(source, /data\.rollVelocity = ball\.physics\.rollSpeed/);
  assert.match(source, /data\.rollHeading = ball\.physics\.rollHeading/);
  assert.match(source, /context\.rotate\(data\.rollAngle\)/);
  assert.match(source, /const highlight = context\.createRadialGradient/);
  assert.match(physicsSource, /physics\.state = "sliding"/);
  assert.match(physicsSource, /physics\.state = "rolling"/);
  assert.match(physicsSource, /const surfaceX = body\.velocity\.x - physics\.spinY \* radius/);
  assert.doesNotMatch(source, /function applyClothDamping\(\)/);
  assert.doesNotMatch(source, /ball\.velocity\.x \* 0\.86/);
});

test("adds physical compression, expanding impact rings, particles, and collision audio", () => {
  assert.match(source, /function impactBall\(body, angle, relativeSpeed\)/);
  assert.match(source, /data\.compression = Math\.max/);
  assert.match(source, /data\.impactGlow = Math\.max/);
  assert.match(source, /context\.scale\(1 - compression, 1 \+ compression \* 0\.52\)/);
  assert.match(source, /collisionFeedbacks\.push\(\{/);
  assert.match(source, /feedback\.radius \+= feedback\.speed/);
  assert.match(source, /audio\.collision\(relative\)/);
  assert.match(source, /spawnParticles\(contact\.x, contact\.y/);
});

test("draws only the cue-ball first-contact guide and removes the second target trajectory", () => {
  assert.match(source, /function rayCircleDistance\(/);
  assert.match(source, /function traceAim\(/);
  assert.match(source, /context\.lineTo\(trace\.impact\.x, trace\.impact\.y\)/);
  assert.doesNotMatch(source, /context\.lineTo\(target\.x \+ trace\.targetDirection\.x \* length/);
  assert.doesNotMatch(source, /const length = 102/);
  assert.match(source, /if \(aimAssist\) \{/);
  assert.match(source, /cachedAvailableTargets\.has\(contactNumber\)/);
});

test("evaluates every settled shot exactly through the pure relationship rules engine", () => {
  assert.match(source, /function finalizeShot\(\)/);
  assert.match(source, /if \(!shotState \|\| resolvingShot\) return/);
  assert.match(source, /outcome = rules\.evaluateShot\(runState, \{/);
  for (const field of ["pottedNumbers", "cueScratch", "breakShot", "bankedNumbers"]) {
    assert.ok(source.includes(`${field}:`), `missing ${field} shot input`);
  }
  assert.doesNotMatch(source, /declaredBall: completedShot/);
  assert.doesNotMatch(source, /firstContact: completedShot/);
  assert.match(source, /runState = outcome\.state/);
  assert.match(source, /processOutcomePerformances\(outcome, completedShot\)/);
  for (const field of ["pottedDetails", "objectContacts", "closestPocketDistance", "launchPower"]) {
    assert.ok(source.includes(field), `missing ${field} physical telemetry`);
  }
});

test("turns physical shots into persistent ball-color and pocket-effect state", () => {
  assert.match(source, /content\.selectPerformance\(\{/);
  assert.match(source, /content\.analyzeShot\(\{/);
  assert.match(source, /content\.selectShotStory\(\{/);
  assert.match(source, /function rememberDateMoment\(/);
  assert.match(source, /dateMapState\.routes\.push\(route\)/);
  assert.match(source, /const BALL_CHROMA_THEMES = Object\.freeze\(\{/);
  assert.match(source, /0: Object\.freeze\(\{ id: "pearl"/);
  assert.match(source, /8: Object\.freeze\(\{ id: "eclipse"/);
  assert.match(source, /15: Object\.freeze\(\{ id: "ruby-stripe"/);
  for (const effect of ["ripple", "comet", "prism", "pulse", "lightning", "aurora"]) {
    assert.match(source, new RegExp(`id: "${effect}"`));
  }
  assert.match(source, /activeTheme: \{ \.\.\.BALL_CHROMA_THEMES\[0\] \}/);
  assert.match(source, /activeEffect: null/);
  assert.match(source, /themeTransition: null/);
  assert.match(source, /pocketFlares: \[\]/);
  assert.match(source, /blackEightBlast: null/);
  assert.match(source, /rememberDateMoment\(0, \{/);
  assert.match(source, /function drawPocketLightPorts\(timestamp\)/);
  assert.match(source, /function drawBlackEightLedChoreography\(timestamp\)/);
  assert.match(source, /function drawDateMapLayer\(timestamp\)/);
  assert.match(source, /const refreshDue = !pointerAim && timestamp - dateMapFrameUpdatedAt >= DATE_MAP_REFRESH_MS/);
  assert.match(source, /scheduleResultAfterTable\(success \? 5000 : 3500\)/);
  assert.doesNotMatch(source, /loadMaterialTexture\("assets\/billiards-scenes/);
  assert.match(source, /content\.getEnding\(grade\)/);
});

test("uses a resettable stepped water surface as the active cloth renderer", () => {
  const activeTableRenderer = implementationOf(source, "drawDateMap");
  const createSurface = implementationOf(source, "createWaterSurface");
  const simulationUpdates = implementationOf(source, "updateEffects");
  const advanceSurface = implementationOf(source, "advanceWaterSurface");
  const resetPath = `${implementationOf(source, "createDateMapState")}\n${implementationOf(source, "resetGame")}`;

  for (const name of [
    "createWaterSurface",
    "resetWaterSurface",
    "disturbWaterWorld",
    "stepWaterSimulation",
    "renderWaterSurface"
  ]) {
    assert.match(source, new RegExp(`function ${name}\\(`), `missing water renderer stage ${name}`);
  }
  assert.ok((source.match(/\bcreateWaterSurface\(/g) || []).length >= 2, "the water surface should be instantiated");
  assert.match(createSurface, /new Float32Array\(/);
  assert.match(resetPath, /\b(?:resetWaterSurface|createWaterSurface)\(/);
  assert.match(simulationUpdates, /\badvanceWaterSurface\(FIXED_STEP\)/);
  assert.match(advanceSurface, /\bstepWaterSimulation\(\)/);
  assert.match(activeTableRenderer, /\brenderWaterSurface\(timestamp\)/);
  assert.doesNotMatch(
    activeTableRenderer,
    /\b(?:drawChroma(?:ThemeField|Cloth|Pattern|RailBursts)|drawRollingChromaTrails)\(/,
    "the retired geometric cloth field must not remain on the active render path"
  );
});

test("drives six tactile material shaders from the same physical height field", () => {
  const surfaceSelection = implementationOf(source, "selectSurfaceMaterial");
  const disturbance = implementationOf(source, "disturbWaterWorld");
  const simulation = implementationOf(source, "stepWaterSimulation");
  const renderer = implementationOf(source, "renderWaterSurface");

  for (const id of ["water", "ink", "mercury", "silk", "plasma", "frost"]) {
    assert.match(source, new RegExp(`id: "${id}"`));
  }
  for (const id of ["ink", "mercury", "silk", "plasma", "frost"]) {
    assert.match(renderer, new RegExp(`surfaceMaterialId === "${id}"`));
  }
  assert.match(source, /const SURFACE_MATERIALS = Object\.freeze\(\[/);
  assert.match(source, /const SURFACE_MATERIAL_BY_ID = Object\.freeze/);
  assert.match(surfaceSelection, /writeStorage\(SURFACE_KEY, material\.id\)/);
  assert.match(surfaceSelection, /spawnSurfaceMaterialWave\(material\)/);
  assert.match(disturbance, /material\.disturbance/);
  assert.match(disturbance, /material\.radius/);
  assert.match(simulation, /material\.damping/);
  assert.match(source, /pigment: new Float32Array/);
  assert.match(source, /pigmentNext: new Float32Array/);
  assert.match(renderer, /const inkBody = smoothStep/);
  assert.match(renderer, /const dryBrush = clamp/);
  assert.match(renderer, /const environmentBand =/);
  assert.match(renderer, /const weavePhase =/);
  assert.match(renderer, /const plasmaCell =/);
  assert.match(renderer, /const crystal =/);
});

test("turns rolling balls into water wakes and rail impacts into bidirectional perimeter waves", () => {
  const rollingUpdate = implementationOf(source, "updateRollingState");
  const rollingWake = implementationOf(source, "depositRollingWaterWake");
  const railBurst = implementationOf(source, "spawnChromaRailBurst");
  const railLightStrip = implementationOf(source, "drawRailLightStrip");
  const activeRendering = `${implementationOf(source, "drawDateMap")}\n${implementationOf(source, "draw")}`;

  assert.match(rollingUpdate, /\bdepositRollingWaterWake\(ball, data, dx, dy, travel\)/);
  assert.match(rollingUpdate, /\btravel\b/);
  assert.match(rollingUpdate, /ball\.speed/);
  assert.match(rollingWake, /\bdisturbWaterWorld\(/);
  assert.match(source, /function railDistanceForContact\(/);
  assert.match(source, /function railPositionFromDistance\(/);
  assert.match(railBurst, /\brailDistanceForContact\(/);
  assert.match(
    railLightStrip,
    /wave\.originS \+ front/,
    "each rail wave should travel clockwise from its contact point"
  );
  assert.match(railLightStrip, /wave\.originS - front/, "each rail wave should also travel counterclockwise");
  assert.match(railLightStrip, /\brailPositionFromDistance\(/);
  assert.match(activeRendering, /\bdrawRailLightStrip\(timestamp/);
});

test("choreographs the black-eight finale through the perimeter light strip", () => {
  const activeTableRenderer = implementationOf(source, "drawDateMap");
  const blackEight = implementationOf(source, "drawBlackEightLedChoreography");
  const railLightStrip = implementationOf(source, "drawRailLightStrip");

  assert.match(activeTableRenderer, /if \(blackEightActive\) drawBlackEightLedChoreography\(timestamp\)/);
  assert.match(blackEight, /\bdrawRailLightStrip\(timestamp\)/);
  assert.match(blackEight, /\bdrawPocketLightPorts\(timestamp\)/);
  assert.match(railLightStrip, /dateMapState\.blackEightBlast/);
  assert.match(railLightStrip, /\bblastProgress\b/);
  assert.match(railLightStrip, /\brailPositionFromDistance\(/);
});
test("freezes full-screen cinematics and preserves the completed canvas without repainting under results", () => {
  assert.match(source, /if \(!cinematicActive && !resultVisible\) draw\(timestamp\);/);
  assert.match(source, /if \(!ballRendererDirty && !hasDynamicBall\) return true/);
});

test("starts immediately with no start gate or pause state", () => {
  const canInteract = source.slice(source.indexOf("function canInteract"), source.indexOf("function selectTarget"));
  assert.equal(source.includes("togglePause"), false);
  for (const selector of ["#hb-opening", "#hb-start", "#hb-pause", "#hb-pause-sheet", "#hb-resume", "#hb-restart-pause"]) {
    assert.equal(source.includes(selector), false, `legacy gate selector remains: ${selector}`);
  }
  assert.doesNotMatch(source, /elements\.(start|pause|resume|restartPause)\.addEventListener/);
  assert.match(canInteract, /return !shotState && !pointerAim && !resolvingShot/);
  assert.doesNotMatch(canInteract, /tableMomentActive|paused/);
  assert.match(source, /root\.dataset\.state = "break"/);
  assert.match(source, /started: true/);
});

test("restores the sole animation loop and frame timing after browser lifecycle events", () => {
  assert.match(source, /window\.addEventListener\("pagehide", \(event\) => \{/);
  assert.match(source, /if \(!event\.persisted\) cancelAnimationFrame\(frameHandle\)/);
  assert.match(source, /window\.addEventListener\("pageshow", \(event\) => \{/);
  assert.match(source, /lastFrameAt = performance\.now\(\)/);
  assert.match(source, /frameHandle = requestAnimationFrame\(frame\)/);
  assert.match(source, /document\.addEventListener\("visibilitychange", resetFrameTiming\)/);
});

test("loads recorded billiards samples and adds streak-controlled ambient music layers", () => {
  assert.match(source, /window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(source, /const RECORDED_AUDIO_ASSETS = Object\.freeze\(\{/);
  assert.match(source, /window\.fetch\(url, \{ cache: "force-cache" \}\)/);
  assert.match(source, /this\.context\.decodeAudioData\(bytes\.slice\(0\)\)/);
  assert.match(source, /this\.context\.createBufferSource\(\)/);
  assert.match(source, /mode: "recorded-samples-with-ambient-bed"/);
  assert.match(source, /rail\(speed\)/);
  assert.match(source, /audio\.rail\(impactSpeed\)/);
  assert.match(source, /audio\.collision\(relative\)/);
  assert.match(source, /startMusicBed\(\)/);
  assert.match(source, /this\.context\.createOscillator\(\)/);
  assert.match(source, /setDateFlow\(streak, paused = false\)/);
  assert.match(source, /this\.dateFlow >= 5/);
  assert.doesNotMatch(source, /function noise\(|ScriptProcessorNode/);
  for (const file of [
    "cue-strike.ogg", "ball-contact-soft.ogg", "ball-contact-hard.ogg",
    "rail-contact.ogg", "pocket-drop.ogg", "event-soft.ogg", "stage-rise.ogg"
  ]) {
    assert.match(source, new RegExp(file.replace(".", "\\.")));
    assert.equal(existsSync(path.join(__dirname, `../assets/audio/billiards/${file}`)), true, file);
  }
});

test("does not introduce forbidden balls, AI opponents, power-ups, or physics modifiers", () => {
  for (const forbidden of ["powerUp", "power-up", "movingPocket", "aiOpponent", "jumpShot", "masse", "spinControl", "skillBall"]) {
    assert.equal(source.includes(forbidden), false, `forbidden mechanic present: ${forbidden}`);
  }
});
