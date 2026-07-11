"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "game-runner-love.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/runner-love.css"), "utf8");

test("publishes the standalone runner with ordered pure modules and one canvas runtime", () => {
  assert.match(html, /data-game="runner-love"/);
  assert.match(html, /<canvas id="runner-canvas" width="720" height="1280"/);
  const scripts = [...html.matchAll(/<script src="([^"]+)/g)].map((match) => match[1].split("?", 1)[0]);
  assert.deepEqual(scripts, ["assets/runner-love-rules.js", "assets/runner-love-content.js", "assets/runner-love-engine.js", "assets/runner-love-game.js"]);
});

test("renders a seven-stage HUD and complete in-game overlays without requirement copy", () => {
  assert.equal((html.match(/<li(?: class="is-current")?>/g) || []).length, 7);
  for (const token of ["data-heartbeat", "data-progress", "data-combo", "data-performance", "data-handhold", "data-reveal", "data-result"]) assert.ok(html.includes(token), token);
  for (const forbidden of ["需求", "实现说明", "GitHub Pages", "调试 API", "WebAudio"]) assert.equal(html.includes(forbidden), false, forbidden);
});

test("keeps a stable portrait stage with mobile safe areas, desktop centering and reduced motion", () => {
  assert.match(css, /aspect-ratio:9\/16/);
  assert.match(css, /place-items:center/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(css, /font-size:\s*[\d.]+vw/);
  for (const edge of ["top", "right", "bottom", "left"]) assert.match(css, new RegExp(`safe-area-inset-${edge}`));
  assert.match(css, /@media \(max-height:620px\)/); assert.match(css, /overflow-y:auto/); assert.match(css, /\.runner-hud,\.runner-topbar\{pointer-events:none\}/);
});

test("exposes persistent new-game-plus clues, heart stamps and checkpoint retry controls", () => {
  for (const token of ["data-new-game-plus", "data-new-game-clue", "data-stamp-count", "data-retry"]) assert.ok(html.includes(token), token);
});
