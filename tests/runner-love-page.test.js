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
  assert.deepEqual(scripts, ["assets/runner-love-rules.js", "assets/runner-love-content.js", "assets/runner-love-director.js", "assets/runner-love-engine.js", "assets/runner-love-audio.js", "assets/runner-love-visuals.js", "assets/runner-love-game.js"]);
  assert.match(html, /<script type="module" src="assets\/runner-love-visuals\.js/);
  assert.match(html, /modulepreload[^>]+three-0\.185\.1\.module\.min\.js/);
  assert.match(css, /#runner-canvas\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?inset:\s*0;[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%;/);
  assert.doesNotMatch(game, /getContext\("2d"\)|function drawRunner|function project\(/);
  assert.match(visuals, /new THREE\.WebGLRenderer/);
});

test("renders a compact seven-stage journey HUD without exposing implementation requirements", () => {
  assert.equal((html.match(/<li(?: class="is-current")?>/g) || []).length, 7);
  for (const token of ["data-condition", "data-progress", "data-combo", "data-cargo", "data-destination", "data-speed-state", "data-speed-label", "data-speed-fill", "data-powerup-rack", "data-route-message", "data-stage-intro", "data-danger", "data-arrival", "data-failure", "data-result"]) assert.ok(html.includes(token), token);
  for (const forbidden of ["需求", "实现说明", "GitHub Pages", "调试 API", "子代理", "WebAudio"]) assert.equal(html.includes(forbidden), false, forbidden);
  for (const retired of ["data-performance", "data-handhold", "data-reveal", "data-companion"]) assert.equal(html.includes(retired), false, retired);
  for (const act of ["第一幕 · 靠近", "第二幕 · 同行与错位", "第三幕 · 倾听与共同承担"]) assert.match(game, new RegExp(act));
  assert.match(game, /data-story-act/);
});

test("exposes one reusable cinematic stage intro that closes without taking gameplay input", () => {
  const hooks = [
    "data-stage-intro", "data-stage-intro-index", "data-stage-intro-name", "data-stage-intro-place",
    "data-stage-intro-time", "data-stage-intro-weather", "data-stage-intro-motive",
    "data-stage-intro-copy", "data-stage-intro-progress", "data-stage-intro-skip"
  ];
  for (const hook of hooks) assert.equal((html.match(new RegExp(`\\b${hook}(?=[\\s=>])`, "g")) || []).length, 1, hook);
  assert.match(html, /class="stage-intro" data-stage-intro hidden/);
  assert.match(html, /雨后香樟路/);
  assert.match(html, /赶到图书馆路口，再见她一次/);
  assert.match(css, /--stage-intro-duration:\s*3600ms/);
  assert.match(css, /\.stage-intro:not\(\[hidden\]\)\s*\{[\s\S]*?animation:\s*stage-intro-life var\(--stage-intro-duration\)/);
  assert.match(css, /\.stage-intro\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?overflow:\s*hidden;[\s\S]*?pointer-events:\s*none;/);
  assert.match(css, /\.stage-intro-skip\s*\{[\s\S]*?pointer-events:\s*auto;/);
  assert.match(css, /@keyframes stage-intro-life\s*\{[\s\S]*?100%\s*\{\s*visibility:\s*hidden;\s*opacity:\s*0;/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.stage-intro:not\(\[hidden\]\)[\s\S]*?animation:\s*none !important;/);
  assert.match(game, /if \(stageIntroElapsed >= stageIntroDuration\) finishStageIntro\(\)/);
  assert.match(game, /bind\("\[data-stage-intro-skip\]", "click", finishStageIntro\)/);
});

test("provides restrained danger feedback and a dedicated checkpoint failure surface", () => {
  const dangerHooks = ["data-danger", "data-danger-label", "data-danger-value", "data-danger-copy"];
  const failureHooks = [
    "data-failure", "data-failure-kicker", "data-failure-title", "data-failure-copy",
    "data-failure-checkpoint-panel", "data-failure-checkpoint", "data-failure-progress",
    "data-failure-progress-fill", "data-failure-checkpoint-copy", "data-failure-retry", "data-failure-restart"
  ];
  for (const hook of [...dangerHooks, ...failureHooks]) assert.equal((html.match(new RegExp(`\\b${hook}(?=[\\s=>])`, "g")) || []).length, 1, hook);
  assert.match(html, /data-danger[^>]+hidden[^>]+aria-live="assertive"/);
  assert.match(html, /状态偏低/);
  assert.match(html, /class="runner-overlay runner-failure" data-failure hidden role="dialog"/);
  assert.match(html, /最近检查点/);
  assert.match(html, /从检查点继续/);
  assert.match(css, /\.runner-danger\s*\{[\s\S]*?width:\s*min\(390px, calc\(100% - 56px\)\);/);
  assert.match(css, /\.runner-failure\s*\{[\s\S]*?overflow-x:\s*hidden;/);
  assert.match(css, /\.failure-actions\s*\{[\s\S]*?grid-template-columns:/);
  assert.match(game, /bind\("\[data-failure-retry\]", "click", retryStage\)/);
  assert.match(game, /bind\("\[data-failure-restart\]", "click", restartStage\)/);
});

test("starts with a believable message and lets destination scenes play without a continue dialog", () => {
  assert.match(html, /刚才是不是在香樟路看见你了/);
  assert.match(html, /去见她/);
  assert.match(html, /class="arrival-caption" data-arrival hidden/);
  assert.match(html, /data-arrival-action hidden/);
  assert.doesNotMatch(html, /data-arrival-continue|data-performance-continue|点击继续/);
  assert.match(game, /if \(arrivalElapsed >= arrivalDuration\) finishArrival\(\)/);
  assert.match(game, /content\.selectArrival/);
});

test("keeps the 3D route primary on a 9:16 mobile stage with safe areas", () => {
  assert.match(css, /--runner-width:\s*720px/);
  assert.match(css, /--runner-height:\s*1280px/);
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
  assert.match(html, /assets\/runner-scenes\/01-encounter\.jpg/);
  for (let stage = 1; stage <= 7; stage += 1) assert.match(css, new RegExp(`runner-scenes\\/0${stage}-`));
  assert.match(html, /assets\/runner-models\/runner-player\.glb/);
  assert.match(html, /assets\/runner-models\/runner-city\.glb/);
  const versions = [...html.matchAll(/runner-love-[^"?]+\?v=([^"']+)/g)].map((match) => match[1]);
  assert.ok(versions.length >= 5);
  assert.equal(new Set(versions).size, 1);
  assert.equal(versions[0], "runner-love-campus-20260715i");
});

test("result and checkpoint surfaces preserve route stats and immediate replay", () => {
  for (const token of ["data-stat-completion", "data-stat-accuracy", "data-stat-relationship", "data-stat-items", "data-stat-collisions", "data-retry", "data-restart", "data-new-game-plus"]) assert.ok(html.includes(token), token);
  assert.match(css, /\.result-stats/);
  assert.match(game, /rules\.retryFromCheckpoint/);
  assert.match(game, /profile\?\.newGamePlusUnlocked/);
});
