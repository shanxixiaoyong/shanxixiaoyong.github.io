const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = readFileSync(path.join(__dirname, "../assets/billiards-love-game.js"), "utf8");

test("builds a zero-gravity fixed-120Hz Matter table with stable collision settings", () => {
  assert.match(source, /const FIXED_STEP = 1000 \/ 120/);
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
  assert.match(source, /const TABLE = Object\.freeze\(\{ left: 90, right: 630, top: 180, bottom: 1260 \}\)/);
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
  assert.match(source, /const POCKET_MIN_DURATION = 280/);
  assert.match(source, /const POCKET_MAX_DURATION = 450/);
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
  assert.match(source, /const aimedContact = traceAim\(\)\?\.hitBall/);
  assert.match(source, /const inferredTarget = completedShot\.firstContact \|\| completedShot\.declaredBall/);
  assert.match(source, /canvas\.setPointerCapture\?\.\(event\.pointerId\)/);
  assert.match(source, /pointerAim\.power = clamp\(\(pullDistance - MIN_PULL\)/);
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
  assert.match(source, /if \(ball\.speed < NATURAL_STOP_SPEED\)/);
  assert.match(source, /Body\.setVelocity\(ball, \{ x: ball\.velocity\.x \* 0\.86/);
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

test("draws the required first-contact and target-ball prediction lines", () => {
  assert.match(source, /function rayCircleDistance\(/);
  assert.match(source, /function traceAim\(/);
  assert.match(source, /context\.lineTo\(trace\.impact\.x, trace\.impact\.y\)/);
  assert.match(source, /context\.lineTo\(target\.x \+ trace\.targetDirection\.x \* length/);
  assert.match(source, /cachedAvailableTargets\.has\(contactNumber\)/);
});

test("evaluates every settled shot exactly through the pure relationship rules engine", () => {
  assert.match(source, /function finalizeShot\(\)/);
  assert.match(source, /if \(!shotState \|\| resolvingShot\) return/);
  assert.match(source, /outcome = rules\.evaluateShot\(runState, \{/);
  for (const field of ["declaredBall", "firstContact", "pottedNumbers", "cueScratch", "breakShot", "bankedNumbers"]) {
    assert.ok(source.includes(`${field}:`), `missing ${field} shot input`);
  }
  assert.match(source, /runState = outcome\.state/);
  assert.match(source, /processOutcomePerformances\(outcome\)/);
});

test("connects all fifteen micro performances plus confession and proposal cinematics", () => {
  assert.match(source, /content\.selectPerformance\(\{/);
  assert.match(source, /queueMicro\(performance, event\)/);
  assert.match(source, /specialCopy\("confessionSuccess"/);
  assert.match(source, /specialCopy\("feelingsExposed"/);
  assert.match(source, /specialCopy\("proposalSuccess"/);
  assert.match(source, /kind: "confession"/);
  assert.match(source, /kind: "proposal"/);
  assert.match(source, /content\.getEnding\(grade\)/);
  assert.match(source, /"confession-too-early": "confessionTooEarly"/);
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

test("synthesizes three adaptive local music layers and physical sound cues", () => {
  assert.match(source, /window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(source, /this\.baseGain = this\.context\.createGain\(\)/);
  assert.match(source, /this\.warmGain = this\.context\.createGain\(\)/);
  assert.match(source, /this\.futureGain = this\.context\.createGain\(\)/);
  assert.match(source, /setStage\(stageNumber\)/);
  for (const cue of ["strike", "pocket", "scratch", "stage", "confession", "proposal"]) {
    assert.ok(source.includes(`name === "${cue}"`) || source.includes(`cue("${cue}"`), `missing ${cue} audio`);
  }
});

test("does not introduce forbidden balls, AI opponents, power-ups, or physics modifiers", () => {
  for (const forbidden of ["powerUp", "power-up", "movingPocket", "aiOpponent", "jumpShot", "masse", "spinControl", "skillBall"]) {
    assert.equal(source.includes(forbidden), false, `forbidden mechanic present: ${forbidden}`);
  }
});
