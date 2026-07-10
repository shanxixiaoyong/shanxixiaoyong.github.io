const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "game-tetris-love.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/tetris-love.css"), "utf8");
const runtime = fs.readFileSync(path.join(root, "assets/tetris-love-game.js"), "utf8");

test("publishes a standalone touch-first game with only its ordered local assets", () => {
  assert.match(html, /<title>心动俄罗斯方块 - 刘勇 \/ Yong Liu<\/title>/);
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"/);
  assert.match(html, /<main class="tl-app" id="tetris-love-game" aria-label="心动俄罗斯方块">/);
  assert.match(html, /href="assets\/tetris-love\.css\?/);
  const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map((match) => match[1].split("?")[0]);
  assert.deepEqual(scripts, ["assets/tetris-love-rules.js", "assets/tetris-love-game.js"]);
  assert.equal(/https?:\/\//.test(html), false);
});

test("keeps the primary mobile surface gesture-first without a directional pad", () => {
  assert.match(html, /id="tl-board"[^>]+tabindex="0"/);
  assert.match(html, /id="tl-coach"/);
  assert.match(html, /↔<\/b> 拖动/);
  assert.match(html, /↻<\/b> 轻点/);
  assert.match(html, /⇊<\/b> 下滑/);
  assert.equal(html.includes("data-action="), false);
  assert.equal(html.includes("tl-controls"), false);
  assert.equal(css.includes(".tl-controls"), false);
  assert.match(css, /\.tl-board-shell[\s\S]*touch-action: none/);
});

test("exposes complete hold, queue, score, pause, result, and milestone states", () => {
  for (const id of [
    "tl-score", "tl-level", "tl-lines", "tl-best", "tl-hold", "tl-hold-canvas",
    "tl-next-canvas", "tl-pause", "tl-pause-sheet", "tl-resume", "tl-restart-pause",
    "tl-result", "tl-restart-result", "tl-milestone", "tl-milestone-skip"
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), id);
  }
  for (const scene of ["morning", "messages", "rain", "starlight", "city", "home"]) {
    assert.match(css, new RegExp(`data-scene="${scene}"`), scene);
  }
  assert.match(css, /width: min\(100%, 393px\)/);
  assert.match(css, /height: min\(100svh, 852px\)/);
});

test("includes accessible focus, reduced-motion, and safe-area behavior", () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /#tl-board:focus-visible/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-modal="true" role="dialog"/);
});

test("runtime implements complete gestures and keyboard fallback", () => {
  assert.match(runtime, /function beginGesture\(event\)/);
  assert.match(runtime, /function continueGesture\(event\)/);
  assert.match(runtime, /function endGesture\(event\)/);
  assert.match(runtime, /gesture\.axis = Math\.abs\(totalX\) >= Math\.abs\(totalY\) \? "horizontal" : "vertical"/);
  assert.match(runtime, /verticalVelocity > 0\.48/);
  assert.match(runtime, /hardDrop\(\)/);
  assert.match(runtime, /"ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space"/);
  assert.match(runtime, /"KeyX", "KeyZ", "KeyC"/);
});

test("runtime owns adaptive audio, persistent firsts, and lifecycle cleanup", () => {
  assert.match(runtime, /window\.HeartbeatAudio/);
  assert.match(runtime, /window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(runtime, /function createHeartbeatSoundscape\(\)/);
  assert.match(runtime, /setIntensity\(Math\.min\(1, danger/);
  assert.match(runtime, /seenMilestones\.add\(id\)/);
  assert.match(runtime, /window\.localStorage\.setItem/);
  assert.match(runtime, /window\.addEventListener\("pagehide"/);
  assert.match(runtime, /if \(event\.persisted\) suspendForCache\(\)/);
  assert.match(runtime, /window\.addEventListener\("pageshow"/);
  assert.match(runtime, /function destroyHeartbeatGame\(\)/);
  assert.match(runtime, /abortController\.abort\(\)/);
  assert.match(runtime, /resizeObserver\?\.disconnect\(\)/);
  assert.match(runtime, /audio\.destroy\(\)/);
});
