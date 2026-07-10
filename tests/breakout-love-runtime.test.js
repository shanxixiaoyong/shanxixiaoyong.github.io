const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("game-breakout-love.html");
const css = read("assets/breakout-love.css");
const source = read("assets/breakout-love-game.js");

test("publishes an independent touch-first Breakout page with only local dependencies", () => {
  assert.match(html, /<title>心动打砖块 - 刘勇 \/ Yong Liu<\/title>/);
  assert.match(html, /aria-label="心动打砖块"/);
  assert.match(html, /id="bl-canvas"[^>]+tabindex="0"/);
  assert.match(html, /id="bl-pause"/);
  assert.match(html, /id="bl-restart"/);
  assert.match(html, /id="bl-result-sheet"/);
  assert.match(html, /id="bl-event"/);
  assert.equal(/https?:\/\//.test(html), false);

  const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)]
    .map((match) => match[1].split("?")[0]);
  assert.deepEqual(scripts, [
    "assets/breakout-love-rules.js",
    "assets/breakout-love-game.js"
  ]);
  assert.match(html, /href="assets\/breakout-love\.css\?/);
  assert.equal(html.includes("assets/games.js"), false);
  assert.equal(html.includes("bl-left"), false);
  assert.equal(html.includes("bl-right"), false);
});

test("locks the premium shell to the 393x852 target and keeps the canvas directly draggable", () => {
  assert.match(css, /width: min\(100vw, 393px\)/);
  assert.match(css, /height: min\(100svh, 852px\)/);
  assert.match(css, /#bl-canvas[\s\S]*?touch-action: none/);
  assert.match(css, /grid-template-rows: auto auto minmax\(0, 1fr\) auto/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.equal((css.match(/letter-spacing:\s*0/g) || []).length >= 2, true);
  assert.equal(/url\(["']?https?:\/\//.test(css), false);
});

test("runs bounded 120 Hz physics with collision helpers and stabilized trajectories", () => {
  assert.match(source, /const FIXED_STEP = 1 \/ 120/);
  assert.match(source, /const MAX_CATCHUP_STEPS = 12/);
  assert.match(source, /accumulator = Math\.min\(MAX_BACKLOG, accumulator \+ delta\)/);
  assert.match(source, /while \(accumulator >= FIXED_STEP && steps < MAX_CATCHUP_STEPS\)/);
  assert.match(source, /rules\.circleRectCollision\(ball, brick\)/);
  assert.match(source, /rules\.reflectVelocity\(/);
  assert.match(source, /rules\.paddleBounce\(/);
  assert.match(source, /function stabilizeBall\(ball\)/);
});

test("uses direct pointer capture and keeps keyboard input as a fallback", () => {
  assert.match(source, /canvas\.setPointerCapture\?\.\(event\.pointerId\)/);
  assert.match(source, /paddle\.targetX = clamp\(pointerToWorldX\(event\)/);
  assert.match(source, /canvas\.addEventListener\("pointermove", onPointerMove/);
  assert.match(source, /\["ArrowLeft", "ArrowRight", "a", "A", "d", "D"\]/);
  assert.match(source, /key === " " \|\| key === "Spacebar"/);
  assert.match(source, /key === "p" \|\| key === "P" \|\| key === "Escape"/);
});

test("renders local scenes into a crisp DPR-aware responsive canvas", () => {
  assert.match(source, /window\.devicePixelRatio \|\| 1/);
  assert.match(source, /canvas\.width = Math\.max\(1, Math\.round\(rect\.width \* dpr\)\)/);
  assert.match(source, /pixelScale = canvas\.width \/ WORLD_WIDTH/);
  assert.match(source, /context\.setTransform\(pixelScale, 0, 0, pixelScale, 0, 0\)/);
  assert.match(source, /const resizeObserver = typeof ResizeObserver === "function"/);
  assert.match(source, /image\.src = level\.scene/);
  assert.match(source, /function drawSceneReveal\(\)/);
});

test("gives first milestone clears full performances and repeats an in-play light effect", () => {
  assert.match(source, /const seenMilestones = readSeenMilestones\(\)/);
  assert.match(source, /const firstPerformance = !seenMilestones\.has\(milestone\.key\)/);
  assert.match(source, /showFullEvent\(milestone, levelComplete\)/);
  assert.match(source, /playRepeatLight\(milestone\)/);
  assert.match(source, /persistSeenMilestones\(\)/);
  for (const effect of [
    "signal",
    "letters",
    "rain",
    "umbrella",
    "windows",
    "lanterns",
    "constellation",
    "dawn"
  ]) {
    assert.match(css, new RegExp(`data-effect="${effect}"`));
  }
});

test("includes fiction-bound powers, emotional rallies, complete outcomes, and adaptive audio", () => {
  assert.match(source, /powerId === "embrace"/);
  assert.match(source, /powerId === "courage"/);
  assert.match(source, /powerId === "echo"/);
  assert.match(source, /rules\.volleyMoment\(rallyReturns\)/);
  assert.match(source, /if \(outcome\.moment\) showMoment\(outcome\.moment\)/);
  assert.match(source, /showResult\(false\)/);
  assert.match(source, /showResult\(true\)/);
  assert.match(source, /window\.HeartbeatAudio \|\| null/);
  assert.match(source, /window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(source, /scheduleMusic\(\)/);
  assert.match(source, /setIntensity\(combo, ballCount, currentLevel\)/);
});

test("pauses on lifecycle changes and tears down retained resources", () => {
  assert.match(source, /document\.addEventListener\("visibilitychange", onVisibilityChange\)/);
  assert.match(source, /function onPageHide\(event\)[\s\S]*?if \(event\.persisted\)/);
  assert.match(source, /function onPageShow\(event\)[\s\S]*?if \(!event\.persisted \|\| gameDestroyed\) return/);
  assert.match(source, /function destroyGame\(\)/);
  assert.match(source, /resizeObserver\?\.disconnect\(\)/);
  assert.match(source, /managedTimers\.forEach\(\(timer\) => window\.clearTimeout\(timer\)\)/);
  assert.match(source, /audio\.destroy\(\)/);
  assert.match(source, /reducedMotionQuery\?\.removeEventListener\?\.\("change", onMotionPreferenceChange\)/);
});
