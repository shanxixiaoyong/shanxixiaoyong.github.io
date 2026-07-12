const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = readFileSync(path.join(__dirname, "../assets/billiards-love-game.js"), "utf8");
const physicsSource = readFileSync(path.join(__dirname, "../assets/billiards-physics.js"), "utf8");
const rendererSource = readFileSync(path.join(__dirname, "../assets/billiards-ball-renderer.js"), "utf8");

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
  assert.match(source, /\["#123a31", "#37866d", "#1b5848"\]/);
  assert.match(source, /context\.strokeStyle = "rgba\(143, 224, 187, 0\.78\)"/);
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
  assert.match(source, /const MAX_RENDER_WIDTH = 1440/);
  assert.match(source, /const MAX_RENDER_HEIGHT = 2880/);
  assert.match(source, /Math\.sqrt\(MAX_RENDER_PIXELS \/ \(cssWidth \* cssHeight\)\)/);
  assert.match(source, /context\.setTransform\(canvas\.width \/ WORLD\.width/);
  assert.match(source, /window\.addEventListener\("resize", resizeCanvas\)/);
});

test("supports direct pull-direction-and-power touch aiming with a stable release lock", () => {
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
  assert.match(source, /const AIM_LOCK_DELAY_MS = 500/);
  assert.match(source, /const AIM_LOCK_BREAK_ANGLE = 0\.055/);
  assert.match(source, /function refreshAimLock\(now = performance\.now\(\)\)/);
  assert.match(source, /pointerAim\.lockedDirection = \{ \.\.\.pointerAim\.directionAnchor \}/);
  assert.match(source, /if \(!refreshAimLock\(\)\) updateAim\(pointerToWorld\(event\), \{ release: true \}\)/);
  assert.match(source, /pointerAim\.lockedDirection \|\| pointerAim\.direction/);
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

test("turns physical shots into a persistent six-pocket date map", () => {
  assert.match(source, /content\.selectPerformance\(\{/);
  assert.match(source, /content\.analyzeShot\(\{/);
  assert.match(source, /content\.selectShotStory\(\{/);
  assert.match(source, /beginCompletedPocketStory\(number\)/);
  assert.match(source, /showTableMoment\(story\)/);
  assert.match(source, /updateVisibleTableMoment\(story\)/);
  assert.match(source, /function rememberDateMoment\(/);
  assert.match(source, /dateMapState\.routes\.push\(route\)/);
  assert.match(source, /function drawDateMap\(timestamp\)/);
  assert.match(source, /function drawDateMapPhotoBase\(/);
  assert.match(source, /function drawPhotographicScene\(/);
  assert.match(source, /function drawMotifAtmosphere\(/);
  assert.match(source, /date-map-night-v2\.jpg/);
  assert.match(source, /function playSceneLens\(/);
  assert.match(source, /function drawDateConnections\(/);
  assert.match(source, /function drawCueJourney\(/);
  assert.match(source, /function drawFinalDateShape\(/);
  assert.match(source, /function beginFinalDateMapReveal\(outcome\)/);
  assert.match(source, /beginFinalDateMapReveal\(outcome\)/);
  assert.doesNotMatch(source, /STAGE_SCENE_ASSETS|MEMORY_MILESTONES|showLiveMemory|setCompanionGesture/);
  const outcomes = source.slice(source.indexOf("function processOutcomePerformances"), source.indexOf("function finalizeShot"));
  assert.doesNotMatch(outcomes, /queueCinematic\(|queueStageMicro\(/);
  assert.match(outcomes, /setDateFlow\(0, true\)/);
  assert.match(source, /content\.getEnding\(grade\)/);
});

test("freezes only full-screen cinematics and keeps the completed map alive behind results", () => {
  assert.match(source, /if \(!cinematicActive\) draw\(timestamp\);/);
  assert.doesNotMatch(source, /if \(!cinematicActive && !resultVisible\) draw\(timestamp\);/);
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
