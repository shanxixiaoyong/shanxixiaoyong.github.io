const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = readFileSync(path.join(__dirname, "../assets/billiards-love-game.js"), "utf8");

test("builds a fixed-step zero-gravity Matter billiards table", () => {
  assert.match(source, /const engine = Engine\.create\(\{ enableSleeping: true \}\)/);
  assert.match(source, /engine\.gravity\.y = 0/);
  assert.match(source, /Bodies\.circle\s*\(/);
  assert.match(source, /Bodies\.rectangle\s*\(/);
  assert.match(source, /Composite\.add\(engine\.world/);
  assert.match(source, /Events\.on\(engine, "collisionStart"/);
  assert.match(source, /const MAX_CATCHUP_STEPS = 8/);
  assert.match(source, /accumulator = Math\.min\(MAX_BACKLOG, accumulator \+ delta\)/);
  assert.match(source, /while \(accumulator >= STEP && steps < MAX_CATCHUP_STEPS\)/);
});

test("tracks six pockets, scratches, cushion-first shots, and combinations", () => {
  const pocketEntries = source.match(/\{ x: \d+, y: \d+, radius: [\d.]+, side: "(?:corner|middle)" \}/g) || [];
  assert.equal(pocketEntries.length, 6);
  assert.match(source, /shotState\.scratch = true/);
  assert.match(source, /shotState\.cueRailBeforeContact = true/);
  assert.match(source, /shotState\.combination = true/);
  assert.match(source, /rules\.resolveShot\(runState/);
  assert.match(source, /rules\.findCuePlacement\(/);
  assert.match(source, /if \(outcome\.scratch\) respotCueBall\(\)/);
});

test("implements a complete pull-and-release pointer gesture with trajectory preview", () => {
  for (const event of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) {
    assert.ok(source.includes(`"${event}"`), `missing ${event}`);
  }
  assert.match(source, /canvas\.setPointerCapture\?\.\(event\.pointerId\)/);
  assert.match(source, /rules\.computeAimGesture\(pointerAim\.start, pointerAim\.current\)/);
  assert.match(source, /rules\.traceAimPath\(/);
  assert.match(source, /if \(shouldShoot && gesture\?\.active\)/);
});

test("provides keyboard aiming, power control, and release-to-shoot fallback", () => {
  assert.match(source, /key === "arrowleft" \|\| key === "a"/);
  assert.match(source, /key === "arrowright" \|\| key === "d"/);
  assert.match(source, /key === "arrowup" \|\| key === "w"/);
  assert.match(source, /event\.code === "Space"/);
  assert.match(source, /on\(window, "keyup"/);
  assert.match(source, /shootKeyboard\(\)/);
  assert.match(source, /key === "enter"/);
  assert.match(source, /key === "r"/);
});

test("synthesizes adaptive local music and collision-specific sound effects", () => {
  assert.match(source, /window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(source, /createOscillator\(\)/);
  assert.match(source, /createBiquadFilter\(\)/);
  assert.match(source, /createBuffer\(1, length, this\.context\.sampleRate\)/);
  assert.match(source, /scheduleMusic\(\)/);
  assert.match(source, /setMood\(level, intensity\)/);
  for (const sound of ["shot", "ball", "rail", "pocket", "foul", "reply", "victory"]) {
    assert.ok(source.includes(`name === "${sound}"`) || source.includes(`"${sound}"`), `missing ${sound} sound`);
  }
});

test("renders a high-DPI canvas and caps pathological pixel ratios", () => {
  assert.match(source, /dpr = Math\.min\(3, Math\.max\(1, window\.devicePixelRatio \|\| 1\)\)/);
  assert.match(source, /canvas\.width = Math\.max\(1, Math\.round\(rect\.width \* dpr\)\)/);
  assert.match(source, /canvas\.height = Math\.max\(1, Math\.round\(rect\.height \* dpr\)\)/);
  assert.match(source, /context\.setTransform\(/);
  assert.match(source, /new ResizeObserver\(resizeCanvas\)/);
});

test("first milestone performances persist while repeated events stay lightweight", () => {
  assert.match(source, /const MILESTONE_KEY = "yl-billiards-love-performances"/);
  assert.match(source, /performedMilestones = loadPerformedMilestones\(\)/);
  assert.match(source, /if \(hasPerformed\(scene\.key\)\) \{\s*showToast/s);
  assert.match(source, /markPerformed\(scene\.key\)/);
  for (const scene of ["first-approach", "first-echo", "first-combination", "final-dawn"]) {
    assert.ok(source.includes(`"${scene}"`), `missing milestone ${scene}`);
  }
});

test("pauses safely and tears down every long-lived browser resource", () => {
  assert.match(source, /const lifecycle = new AbortController\(\)/);
  assert.match(source, /document, "visibilitychange"/);
  assert.match(source, /window, "pagehide"/);
  assert.match(source, /if \(event\.persisted\)/);
  assert.match(source, /window, "pageshow"/);
  assert.match(source, /cancelAnimationFrame\(frameHandle\)/);
  assert.match(source, /resizeObserver\?\.disconnect\(\)/);
  assert.match(source, /lifecycle\.abort\(\)/);
  assert.match(source, /Events\.off\(engine\)/);
  assert.match(source, /Engine\.clear\(engine\)/);
  assert.match(source, /audio\.destroy\(\)/);
});
