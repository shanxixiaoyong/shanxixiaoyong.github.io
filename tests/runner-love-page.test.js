"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "game-runner-love.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/runner-love.css"), "utf8");
const game = fs.readFileSync(path.join(root, "assets/runner-love-game.js"), "utf8");
const visuals = fs.readFileSync(path.join(root, "assets/runner-love-visuals.js"), "utf8");

test("publishes the standalone runner with ordered domain modules and one full-screen WebGL canvas", () => {
  assert.match(html, /data-game="runner-love"/);
  assert.match(html, /<canvas id="runner-canvas" width="720" height="1280"/);
  const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)].map((match) => match[1].split("?", 1)[0]);
  assert.deepEqual(scripts, ["assets/runner-love-rules.js", "assets/runner-love-content.js", "assets/runner-love-engine.js", "assets/runner-love-audio.js", "assets/runner-love-visuals.js", "assets/runner-love-game.js"]);
  assert.match(html, /<script type="module" src="assets\/runner-love-visuals\.js/);
  assert.match(html, /modulepreload[^>]+three-0\.185\.1\.module\.min\.js/);
  assert.match(css, /#runner-canvas\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?inset:\s*0;[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%;/);
  assert.doesNotMatch(game, /getContext\("2d"\)|function drawRunner|function project\(/);
  assert.match(visuals, /new THREE\.WebGLRenderer/);
});

test("renders a compact seven-stage journey HUD without exposing implementation requirements", () => {
  assert.equal((html.match(/<li(?: class="is-current")?>/g) || []).length, 7);
  for (const token of ["data-condition", "data-progress", "data-combo", "data-cargo", "data-destination", "data-speed-state", "data-speed-label", "data-speed-fill", "data-powerup-rack", "data-route-message", "data-arrival", "data-result"]) assert.ok(html.includes(token), token);
  for (const forbidden of ["需求", "实现说明", "GitHub Pages", "调试 API", "子代理", "WebAudio"]) assert.equal(html.includes(forbidden), false, forbidden);
  for (const retired of ["data-performance", "data-handhold", "data-reveal", "data-companion"]) assert.equal(html.includes(retired), false, retired);
});

test("starts with a believable message and lets destination scenes play without a continue dialog", () => {
  assert.match(html, /刚才是不是在香樟路看见你了/);
  assert.match(html, /去见她/);
  assert.match(html, /class="arrival-caption" data-arrival hidden/);
  assert.doesNotMatch(html, /data-arrival-continue|data-performance-continue|点击继续/);
  assert.match(game, /if \(arrivalElapsed >= arrivalDuration\) finishArrival\(\)/);
  assert.match(game, /content\.selectArrival/);
});

test("keeps the 3D route primary on a 9:16 mobile stage with safe areas", () => {
  assert.match(css, /aspect-ratio:\s*9 \/ 16/);
  assert.match(css, /place-items:\s*center/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /font-size:\s*[\d.]+vw/);
  for (const edge of ["top", "right", "bottom", "left"]) assert.match(css, new RegExp(`safe-area-inset-${edge}`));
  assert.match(css, /@media \(max-height:\s*620px\)/);
  assert.match(css, /\.runner-hud\s*\{[\s\S]*?pointer-events:\s*none;/);
  assert.match(css, /\.runner-topbar\s*\{[\s\S]*?pointer-events:\s*none;/);
});

test("uses local cinematic scene art, local 3D models, and a cache-consistent release", () => {
  assert.match(html, /assets\/love-scenes\/campus-library\.webp/);
  assert.match(html, /assets\/runner-models\/runner-player\.glb/);
  assert.match(html, /assets\/runner-models\/runner-city\.glb/);
  const versions = [...html.matchAll(/runner-love-[^"?]+\?v=([^"']+)/g)].map((match) => match[1]);
  assert.ok(versions.length >= 5);
  assert.equal(new Set(versions).size, 1);
  assert.equal(versions[0], "runner-love-rush-20260714d");
});

test("result and checkpoint surfaces preserve route stats and immediate replay", () => {
  for (const token of ["data-stat-completion", "data-stat-accuracy", "data-stat-items", "data-stat-collisions", "data-retry", "data-restart", "data-new-game-plus"]) assert.ok(html.includes(token), token);
  assert.match(css, /\.result-stats/);
  assert.match(game, /rules\.retryFromCheckpoint/);
  assert.match(game, /profile\?\.newGamePlusUnlocked/);
});
