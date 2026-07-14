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
  assert.deepEqual(scripts, ["assets/runner-love-rules.js", "assets/runner-love-content.js", "assets/runner-love-engine.js", "assets/runner-love-visuals.js", "assets/runner-love-game.js"]);
  assert.match(html, /<script type="module" src="assets\/runner-love-visuals\.js/);
  assert.match(html, /modulepreload[^>]+three-0\.185\.1\.module\.min\.js/);
  assert.match(css, /#runner-canvas\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?inset:\s*0;[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%;/);
  assert.doesNotMatch(game, /getContext\("2d"\)|function drawRunner|function project\(/);
  assert.match(visuals, /new THREE\.WebGLRenderer/);
});

test("renders a seven-stage HUD and complete in-game overlays without requirement copy", () => {
  assert.equal((html.match(/<li(?: class="is-current")?>/g) || []).length, 7);
  for (const token of ["data-heartbeat", "data-progress", "data-combo", "data-performance", "data-handhold", "data-reveal", "data-result"]) assert.ok(html.includes(token), token);
  for (const forbidden of ["需求", "实现说明", "GitHub Pages", "调试 API", "WebAudio"]) assert.equal(html.includes(forbidden), false, forbidden);
});

test("keeps the arcade HUD compact so the 3D route remains the primary mobile surface", () => {
  assert.match(css, /\.stage-track span\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?clip:/);
  assert.match(css, /\.runner-shell\[data-state="playing"\] \.runner-hud/);
  assert.match(css, /\.runner-speed-aura/);
  assert.match(html, /class="runner-speed-aura"/);
});

test("keeps a stable portrait stage with mobile safe areas, desktop centering and reduced motion", () => {
  assert.match(css, /aspect-ratio:\s*9 \/ 16/);
  assert.match(css, /place-items:\s*center/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /font-size:\s*[\d.]+vw/);
  for (const edge of ["top", "right", "bottom", "left"]) assert.match(css, new RegExp(`safe-area-inset-${edge}`));
  assert.match(css, /@media \(max-height:\s*620px\)/); assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /\.runner-hud\s*\{[\s\S]*?pointer-events:\s*none;/);
  assert.match(css, /\.runner-topbar\s*\{[\s\S]*?pointer-events:\s*none;/);
});

test("exposes persistent new-game-plus clues, heart stamps and checkpoint retry controls", () => {
  for (const token of ["data-new-game-plus", "data-new-game-clue", "data-stamp-count", "data-retry"]) assert.ok(html.includes(token), token);
});

test("uses a four-shot reality reveal instead of a decorative fake box", () => {
  for (const token of ["data-reveal-step", "data-reveal-title", "data-reveal-copy", "data-reveal-next"]) assert.ok(html.includes(token), token);
  assert.doesNotMatch(html, /class="reveal-box"/);
  assert.match(css, /url\("runner-scenes\/08-reveal\.jpg"\)/);
  assert.match(game, /function showRevealShot\(\)/);
  assert.match(game, /function nextRevealShot\(\)/);
});
