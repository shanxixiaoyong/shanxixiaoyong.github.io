const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = readFileSync(path.join(__dirname, "../assets/billiards-love-game.js"), "utf8");

test("builds a zero-gravity fixed-120Hz Matter table with stable collision settings", () => {
  assert.match(source, /const FIXED_HZ = 120/);
  assert.match(source, /const FIXED_STEP = 1000 \/ FIXED_HZ/);
  assert.match(source, /const MAX_STEPS_PER_FRAME = 8/);
  assert.match(source, /const engine = Engine\.create\(\{ enableSleeping: false \}\)/);
  assert.match(source, /engine\.gravity\.x = 0/);
  assert.match(source, /engine\.gravity\.y = 0/);
  assert.match(source, /engine\.positionIterations = 12/);
  assert.match(source, /Bodies\.circle\s*\(/);
  assert.match(source, /Bodies\.rectangle\s*\(/);
  assert.match(source, /while \(accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME\)/);
  assert.match(source, /Events\.on\(engine, "collisionStart"/);
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
  assert.match(source, /const CORNER_POCKET_MOUTH = BALL_DIAMETER \* 2\.00/);
  assert.match(source, /const SIDE_POCKET_MOUTH = BALL_DIAMETER \* 2\.22/);
  assert.match(source, /const CORNER_POCKET_SHELF = BALL_DIAMETER \* 0\.65/);
  assert.match(source, /const SIDE_POCKET_SHELF = BALL_DIAMETER \* 0\.14/);
  assert.match(source, /const CORNER_CUT_ANGLE_DEGREES = 142/);
  assert.match(source, /const SIDE_CUT_ANGLE_DEGREES = 104/);
  assert.match(source, /mouthX,[\s\S]*?mouthY,[\s\S]*?captureX:[\s\S]*?captureY:/);
  assert.match(source, /x: mouthX \+ inwardX \* dropDepth/);
  assert.match(source, /y: mouthY \+ inwardY \* dropDepth/);
  assert.match(source, /const POCKET_MIN_DURATION = 280/);
  assert.match(source, /const POCKET_MAX_DURATION = 450/);
  assert.match(source, /function crossedPocketLine\(body, pocket, lineDepth, halfWidth, depthTolerance = 0, lateralTolerance = 0\)/);
  assert.match(source, /function enterPocketMouth\(body, pocket\)/);
  assert.match(source, /function advancePocketApproach\(body, pocket\)/);
  assert.match(source, /enteredAt: simulationTime/);
  assert.match(source, /approach\.enteredAt < simulationTime/);
  assert.match(source, /approach\.maximumDepth >= pocket\.shelf - POCKET_SHELF_DEPTH_TOLERANCE/);
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
  assert.match(source, /context\.translate\(pocket\.mouthX, pocket\.mouthY\)/);
  assert.match(source, /context\.scale\(0\.18, 1\)/);
  assert.match(source, /POCKETS\.forEach\(drawLeatherPocket\)/);
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
  assert.match(source, /const pixelRatio = Math\.max\(1, renderScale\)/);
  assert.match(source, /rendered === false \|\| ballRenderer\.supported === false/);
  assert.match(source, /failedCanvas\.style\.visibility = "hidden"/);
  assert.match(source, /const renderedByBallRenderer = syncBallRenderer\(timestamp\)/);
  assert.match(source, /if \(!renderedByBallRenderer\) \{[\s\S]*?drawBall\(ball, timestamp\)/);
  assert.match(source, /catch \{\s*disableBallRenderer\(\)/);
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

test("supports direct pull-direction-and-power touch aiming without target selection", () => {
  for (const event of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) {
    assert.ok(source.includes(`"${event}"`), `missing ${event}`);
  }
  assert.doesNotMatch(source, /先点选这一杆的目标球/);
  assert.match(source, /declaredBall: null/);
  assert.doesNotMatch(source, /const inferredTarget/);
  assert.match(source, /canvas\.setPointerCapture\?\.\(event\.pointerId\)/);
  assert.match(source, /const MAX_PULL = 300/);
  assert.match(source, /pointerAim\.power = clamp\(\(pullDistance - MIN_PULL\)/);
  assert.match(source, /elements\.powerValue\.textContent = ""/);
  assert.doesNotMatch(source, /elements\.powerValue\.textContent = `\$\{Math\.round\(aimPower \* 100\)\}%`/);
  assert.match(source, /if \(shouldShoot && power > 0\.015\) shoot\(direction, power\)/);
  assert.match(source, /event\.isPrimary === false/);
  assert.match(source, /!shotState && !pointerAim && !resolvingShot/);
});

test("tracks cumulative roll and rotates numbered texture and highlights with it", () => {
  assert.match(source, /rollAngle: 0/);
  assert.match(source, /rollVelocity: 0/);
  assert.match(source, /lastPosition: \{ x, y \}/);
  assert.match(source, /function updateRollingState\(\)/);
  assert.match(source, /data\.rollAngle \+= angleDelta/);
  assert.match(source, /data\.rollVelocity = angleDelta \/ \(FIXED_STEP \/ 1000\)/);
  assert.match(source, /context\.rotate\(data\.rollAngle\)/);
  assert.match(source, /const highlight = context\.createRadialGradient/);
  assert.match(source, /function applyClothDamping\(\)/);
  assert.match(source, /const speedLoss = CLOTH_LINEAR_SPEED_LOSS \+ ball\.speed \* CLOTH_SPEED_DRAG/);
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
  assert.match(source, /processOutcomePerformances\(outcome\)/);
});

test("connects per-pot center beats, streak feedback, seven stage performances, and black-eight endings", () => {
  assert.match(source, /content\.selectPerformance\(\{/);
  assert.match(source, /content\.selectStageEvent\(\{/);
  assert.match(source, /content\.selectStageTransition\(\{/);
  assert.match(source, /queueBallMicro\(performance, event, outcome\)/);
  assert.match(source, /queueStageMicro\(/);
  assert.match(source, /queueCinematic\(copy\)/);
  assert.match(source, /STAGE_SCENE_ASSETS/);
  assert.match(source, /stage\.number === 4 \? "confession" : stage\.number === 7 \? "proposal" : "stage"/);
  assert.match(source, /autoCloseMs: clamp\(performance\.durationMs \+ 3200, 5000, 6500\)/);
  assert.match(source, /function earlyEightCopy\(outcome\)/);
  assert.match(source, /outcome\.streakBonus > 0/);
  assert.match(source, /outcome\.interestTrend\.line/);
  assert.match(source, /clamp\(item\.durationMs \+ 3000, 4200, 5200\)/);
  assert.match(source, /audio\.cue\(item\.sound \|\| "event"/);
  assert.match(source, /content\.getEnding\(grade\)/);
  assert.doesNotMatch(source, /specialCopy\("confessionTooEarly"/);
});

test("starts immediately with no start gate or pause state", () => {
  assert.equal(source.includes("paused"), false);
  assert.equal(source.includes("togglePause"), false);
  for (const selector of ["#hb-opening", "#hb-start", "#hb-pause", "#hb-pause-sheet", "#hb-resume", "#hb-restart-pause"]) {
    assert.equal(source.includes(selector), false, `legacy gate selector remains: ${selector}`);
  }
  assert.doesNotMatch(source, /elements\.(start|pause|resume|restartPause)\.addEventListener/);
  assert.match(source, /return !shotState && !pointerAim && !resolvingShot/);
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

test("synthesizes adaptive music plus distinct ball, rail, pocket, event, and streak cues", () => {
  assert.match(source, /window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(source, /this\.baseGain = this\.context\.createGain\(\)/);
  assert.match(source, /this\.warmGain = this\.context\.createGain\(\)/);
  assert.match(source, /this\.futureGain = this\.context\.createGain\(\)/);
  assert.match(source, /setStage\(stageNumber\)/);
  assert.match(source, /noise\(duration, gainValue, frequency/);
  assert.match(source, /rail\(speed\)/);
  assert.match(source, /audio\.rail\(bodyA\.speed\)/);
  assert.match(source, /audio\.collision\(relative\)/);
  for (const cue of ["strike", "pocket", "scratch", "event", "streak", "miss", "stage", "confession", "proposal"]) {
    assert.ok(source.includes(`name === "${cue}"`) || source.includes(`cue("${cue}"`), `missing ${cue} audio`);
  }
});

test("does not introduce forbidden balls, AI opponents, power-ups, or physics modifiers", () => {
  for (const forbidden of ["powerUp", "power-up", "movingPocket", "aiOpponent", "jumpShot", "masse", "spinControl", "skillBall"]) {
    assert.equal(source.includes(forbidden), false, `forbidden mechanic present: ${forbidden}`);
  }
});
