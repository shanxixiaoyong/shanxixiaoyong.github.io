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

test("racks one cue ball and all fifteen standard numbered balls with the eight in the center", () => {
  assert.match(source, /const RACK = Object\.freeze\(\[\s*\[1\],\s*\[4, 9\],\s*\[2, 8, 10\]/s);
  assert.match(source, /createBall\(0, 342, WORLD\.height \/ 2\)/);
  assert.match(source, /RACK\.forEach\(\(row, rowIndex\)/);
  assert.match(source, /const stripe = number > 8/);
  assert.match(source, /number === 0 \? "hb-cue-ball" : `hb-object-ball-\$\{number\}`/);
});

test("implements six fixed pockets, natural pocket capture, cue scratches, and respots", () => {
  for (const pocket of ["top-left", "top-middle", "top-right", "bottom-left", "bottom-middle", "bottom-right"]) {
    assert.ok(source.includes(`id: "${pocket}"`), `missing ${pocket} pocket`);
  }
  assert.match(source, /shotState\.cueScratch = true/);
  assert.match(source, /shotState\.pottedNumbers\.push\(number\)/);
  assert.match(source, /shotState\.bankedNumbers\.push\(number\)/);
  assert.match(source, /outcome\.respotNumbers\.forEach\(respotBall\)/);
  assert.match(source, /if \(!cueBall && !runState\.endState\.ended\) respotBall\(0\)/);
});

test("supports direct pull-direction-and-power touch aiming without target selection", () => {
  for (const event of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) {
    assert.ok(source.includes(`"${event}"`), `missing ${event}`);
  }
  assert.doesNotMatch(source, /先点选这一杆的目标球/);
  assert.doesNotMatch(source, /if \(!canInteract\(\) \|\| \(runState\.breakCompleted && selectedBallNumber === null\)\)/);
  assert.match(source, /const aimedContact = traceAim\(\)\?\.hitBall/);
  assert.match(source, /const inferredTarget = completedShot\.firstContact \|\| completedShot\.declaredBall/);
  assert.match(source, /canvas\.setPointerCapture\?\.\(event\.pointerId\)/);
  assert.match(source, /pointerAim\.power = clamp\(\(pullDistance - MIN_PULL\)/);
  assert.match(source, /if \(shouldShoot && power > 0\.015\) shoot\(direction, power\)/);
  assert.match(source, /event\.isPrimary === false/);
  assert.match(source, /!shotState && !pointerAim && !resolvingShot/);
  assert.match(source, /!pointerAim \|\| event\.pointerId !== pointerAim\.id/);
});

test("maps portrait and landscape pointer coordinates into the same physics world", () => {
  assert.match(source, /function clientPointToWorld\(clientX, clientY, rect/);
  assert.match(source, /if \(height > width\)/);
  assert.match(source, /x: displayY \* WORLD\.width/);
  assert.match(source, /y: \(1 - displayX\) \* WORLD\.height/);
  assert.match(source, /mapClientPoint\(clientX, clientY, rect\)/);
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
  assert.doesNotMatch(source, /confession-too-soon/);
});

test("restores the sole animation loop when a mobile browser returns from BFCache", () => {
  assert.match(source, /window\.addEventListener\("pagehide", \(event\) => \{/);
  assert.match(source, /if \(!event\.persisted\) cancelAnimationFrame\(frameHandle\)/);
  assert.match(source, /window\.addEventListener\("pageshow", \(event\) => \{/);
  assert.match(source, /if \(!event\.persisted\) return/);
  assert.match(source, /lastFrameAt = performance\.now\(\)/);
  assert.match(source, /frameHandle = requestAnimationFrame\(frame\)/);
});

test("resets frame timing across visibility changes without pausing gameplay", () => {
  assert.match(source, /function resetFrameTiming\(\) \{\s*accumulator = 0;\s*lastFrameAt = performance\.now\(\);\s*\}/);
  assert.match(source, /document\.addEventListener\("visibilitychange", resetFrameTiming\)/);
  assert.doesNotMatch(source, /document\.hidden[\s\S]{0,120}togglePause\(\)/);
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
  for (const forbidden of ["powerUp", "power-up", "movingPocket", "aiOpponent", "jumpShot", "masse", "spinControl", "skillBall"] ) {
    assert.equal(source.includes(forbidden), false, `forbidden mechanic present: ${forbidden}`);
  }
});
