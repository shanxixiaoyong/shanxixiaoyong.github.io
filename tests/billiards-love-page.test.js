const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("game-billiards-love.html");
const css = read("assets/billiards-love.css");
const game = read("assets/billiards-love-game.js");
const cacheVersion = "billiards-love-three-layer-20260711b";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function references(htmlSource, tag, attribute) {
  const expression = new RegExp(`<${tag}\\b[^>]*\\b${attribute}="([^"]+)"[^>]*>`, "g");
  return [...htmlSource.matchAll(expression)].map((match) => match[1]);
}

function linked(htmlSource, tag, attribute) {
  return references(htmlSource, tag, attribute).map((reference) => reference.split(/[?#]/, 1)[0]);
}

function fragment(source, opening, closing) {
  const start = source.indexOf(opening);
  assert.notEqual(start, -1, `${opening} should exist`);
  const end = source.indexOf(closing, start);
  assert.notEqual(end, -1, `${closing} should exist after ${opening}`);
  return source.slice(start, end + closing.length);
}

function rule(selector) {
  const match = css.match(new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`, "s"));
  assert.ok(match, `${selector} rule should exist`);
  return match[1];
}

test("publishes the portrait standard-fifteen-ball identity", () => {
  for (const token of [
    "<title>心动桌球 - 刘勇 / Yong Liu</title>",
    '<body class="heartbeat-billiards-page">',
    '<main class="hb-app" id="heartbeat-billiards" aria-label="心动桌球"',
    '<canvas id="hb-canvas" width="720" height="1440"',
    'id="hb-relationship-track"',
    'id="hb-interest"',
    'id="hb-selected-ball"'
  ]) {
    assert.match(html, new RegExp(escapeRegExp(token)));
  }
  assert.doesNotMatch(html, /横过来|旋转设备|手机横屏/);
  assert.doesNotMatch(html, /今晚的片段|回忆日志|心动值|剩余回合/);
});

test("opens directly into play without visible opening or pause UI", () => {
  const topbar = fragment(html, '<header class="hb-topbar">', "</header>");
  const topbarButtonIds = [...topbar.matchAll(/<button\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(topbarButtonIds, ["hb-sound", "hb-aim-toggle"]);
  for (const token of ["hb-back", "hb-stage-kicker", "hb-stage-title", "hb-interest-wrap", "hb-sound", "hb-aim-toggle"]) {
    assert.match(topbar, new RegExp(escapeRegExp(token)));
  }
  assert.match(topbar, /class="hb-sr-only" id="hb-stage-targets"/);
  assert.doesNotMatch(topbar, /hb-pause/);

  for (const id of ["hb-opening", "hb-start", "hb-pause", "hb-pause-sheet", "hb-resume", "hb-restart-pause"]) {
    assert.doesNotMatch(html, new RegExp(`id="${id}"`));
    assert.doesNotMatch(game, new RegExp(`required\\("#${id}"\\)`));
  }
  assert.doesNotMatch(html, /开始这一局|AFTER HOURS|PAUSED|暂停游戏|这一杆可以慢一点/);
  assert.match(game, /root\.dataset\.state = "break";/);
});

test("loads only the local billiards runtime dependencies in exact order", () => {
  assert.deepEqual(linked(html, "link", "href").filter((file) => file.endsWith(".css")), [
    "assets/billiards-love.css"
  ]);
  assert.deepEqual(linked(html, "script", "src"), [
    "assets/vendor/matter-0.20.0.min.js",
    "assets/billiards-love-rules.js",
    "assets/billiards-love-content.js",
    "assets/billiards-ball-renderer.js",
    "assets/billiards-love-game.js"
  ]);

  assert.deepEqual(references(html, "link", "href").filter((file) => file.includes("billiards-love.css")), [
    `assets/billiards-love.css?v=${cacheVersion}`
  ]);
  assert.deepEqual(references(html, "script", "src"), [
    "assets/vendor/matter-0.20.0.min.js?v=0.20.0",
    `assets/billiards-love-rules.js?v=${cacheVersion}`,
    `assets/billiards-love-content.js?v=${cacheVersion}`,
    `assets/billiards-ball-renderer.js?v=${cacheVersion}`,
    `assets/billiards-love-game.js?v=${cacheVersion}`
  ]);
});

test("stacks a transparent non-interactive ball canvas over the game canvas", () => {
  const canvases = [...html.matchAll(/<canvas\b[^>]*><\/canvas>/g)].map((match) => match[0]);
  const sharedCanvas = rule(".hb-table-wrap > canvas");
  const gameCanvas = rule("#hb-canvas");
  const ballCanvas = rule("#hb-ball-canvas");

  assert.equal(canvases.length, 2);
  assert.match(canvases[0], /^<canvas id="hb-canvas" width="720" height="1440"/);
  assert.equal(canvases[1], '<canvas id="hb-ball-canvas" width="720" height="1440" aria-hidden="true"></canvas>');
  assert.match(html, new RegExp(`${escapeRegExp(canvases[0])}\\s*${escapeRegExp(canvases[1])}`));
  assert.match(sharedCanvas, /position:\s*absolute !important;/);
  assert.match(sharedCanvas, /inset:\s*0 !important;/);
  assert.match(sharedCanvas, /width:\s*100% !important;/);
  assert.match(sharedCanvas, /height:\s*100% !important;/);
  assert.match(sharedCanvas, /transform:\s*none !important;/);
  assert.match(gameCanvas, /z-index:\s*1;/);
  assert.match(ballCanvas, /z-index:\s*2;/);
  assert.match(ballCanvas, /background:\s*transparent !important;/);
  assert.match(ballCanvas, /pointer-events:\s*none !important;/);
  assert.doesNotMatch(ballCanvas, /rotate/);

  for (const selector of [".hb-call", ".hb-power", ".hb-micro", ".hb-judgement", ".hb-coach"]) {
    const zIndex = Number(rule(selector).match(/z-index:\s*(\d+);/)?.[1]);
    assert.ok(zIndex > 2, `${selector} must remain above the ball canvas`);
  }
});

test("uses project-local lounge, confession, and proposal art", () => {
  for (const asset of [
    "assets/billiards-scenes/lounge-night.jpg",
    "assets/billiards-scenes/confession-night.jpg",
    "assets/billiards-scenes/proposal-dawn.jpg"
  ]) {
    assert.equal(fs.existsSync(path.join(root, asset)), true, `${asset} should exist`);
  }
  for (const reference of [
    'url("billiards-scenes/lounge-night.jpg")',
    'url("billiards-scenes/confession-night.jpg")',
    'url("billiards-scenes/proposal-dawn.jpg")'
  ]) {
    assert.match(css, new RegExp(escapeRegExp(reference)));
  }
  assert.doesNotMatch(html + css, /https?:\/\//);
});

test("uses local premium cloth and walnut material textures", () => {
  for (const asset of [
    "assets/billiards-textures/worsted-cloth.jpg",
    "assets/billiards-textures/dark-walnut.jpg"
  ]) {
    assert.equal(fs.existsSync(path.join(root, asset)), true, `${asset} should exist`);
    assert.ok(html.includes(asset) || game.includes(asset), `${asset} should be referenced locally`);
  }
});

test("uses the full 1440 by 3200 phone viewport and keeps the table dominant", () => {
  const app = rule(".hb-app");
  const playfield = rule(".hb-playfield");
  const table = rule(".hb-table-wrap");

  assert.match(app, /position:\s*fixed;/);
  assert.match(app, /width:\s*100vw;/);
  assert.match(app, /height:\s*100dvh;/);
  assert.match(app, /max-width:\s*1440px;/);
  assert.match(app, /max-height:\s*3200px;/);
  assert.match(app, /--hb-header-space:\s*calc\(max\(6px, var\(--safe-top\)\) \+ 44px\);/);
  assert.match(app, /--hb-footer-space:\s*calc\(max\(5px, var\(--safe-bottom\)\) \+ 38px\);/);
  assert.match(playfield, /top:\s*var\(--hb-header-space\);/);
  assert.match(playfield, /right:\s*0;/);
  assert.match(playfield, /bottom:\s*var\(--hb-footer-space\);/);
  assert.match(playfield, /left:\s*0;/);
  assert.match(playfield, /min-height:\s*72%;/);
  assert.match(table, /height:\s*auto;/);
  assert.match(table, /width:\s*min\(100%, calc\(\(min\(100dvh, 3200px\) - var\(--hb-header-space\) - var\(--hb-footer-space\)\) \/ 2\)\) !important;/);
  assert.match(table, /max-width:\s*100% !important;/);
  assert.match(table, /aspect-ratio:\s*1 \/ 2 !important;/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(css, /env\(safe-area-inset-/);

  const targetWidth = 1440;
  const targetHeight = 3200;
  const headerSpace = 6 + 44;
  const footerSpace = 5 + 38;
  const playfieldHeight = targetHeight - headerSpace - footerSpace;
  const tableSurfaceWidth = Math.min(targetWidth, playfieldHeight / 2);
  const tableSurfaceHeight = tableSurfaceWidth * 2;
  const tableTop = headerSpace + (playfieldHeight - tableSurfaceHeight) / 2;
  const tableBottom = tableTop + tableSurfaceHeight;
  const topHudBottom = 6 + 36;
  const bottomHudTop = targetHeight - (5 + 29) - 3;
  assert.ok(tableSurfaceHeight / targetHeight >= 0.9, "table canvas should dominate the target height");
  assert.ok(tableSurfaceWidth / targetWidth >= 0.999, "table canvas should be full width at the target viewport");
  assert.ok(tableTop > topHudBottom, "top HUD must not cover the table");
  assert.ok(tableBottom < bottomHudTop, "bottom HUD must not cover the table");
});

test("uses a native portrait canvas without a CSS rotation layout", () => {
  const canvases = rule(".hb-table-wrap > canvas");

  assert.match(canvases, /width:\s*100% !important;/);
  assert.match(canvases, /height:\s*100% !important;/);
  assert.match(canvases, /transform:\s*none !important;/);
  assert.doesNotMatch(canvases, /rotate/);
  assert.doesNotMatch(css, /aspect-ratio:\s*2 \/ 1/);
  assert.doesNotMatch(css, /@media\s*\([^)]*(?:orientation|aspect-ratio|width|height)[^)]*\)/);
  assert.match(game, /const WORLD = Object\.freeze\(\{ width: 720, height: 1440 \}\);/);
  assert.match(game, /x:\s*displayX \* WORLD\.width/);
  assert.match(game, /y:\s*displayY \* WORLD\.height/);
  assert.match(game, /context\.setTransform\(canvas\.width \/ WORLD\.width, 0, 0, canvas\.height \/ WORLD\.height, 0, 0\)/);
  assert.doesNotMatch(game, /if \(height > width\)/);
});

test("keeps all six portrait-table pockets in the native world", () => {
  for (const pocket of ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"]) {
    assert.match(game, new RegExp(`id: "${pocket}"`));
  }
});

test("keeps bottom information minimal and outside the table", () => {
  const track = rule(".hb-relationship-track");
  const trackNodes = rule(".hb-relationship-track ol");
  const bottom = rule(".hb-bottom-bar");
  const footer = fragment(html, '<footer class="hb-bottom-bar">', "</footer>");

  assert.match(track, /bottom:\s*calc\(max\(5px, var\(--safe-bottom\)\) \+ 29px\);/);
  assert.match(trackNodes, /display:\s*none;/);
  assert.match(bottom, /height:\s*22px;/);
  assert.match(bottom, /bottom:\s*max\(4px, var\(--safe-bottom\)\);/);
  assert.match(footer, />杆数</);
  assert.match(footer, />连进</);
  assert.doesNotMatch(footer, /本局|连续进球|第一碰球/);
});

test("presents direct shooting guidance without mandatory selection copy", () => {
  assert.match(html, /从白球向后拖动瞄准蓄力，松开击球/);
  assert.doesNotMatch(html, /先点击目标球|先选中目标球/);
});

test("does not expose retired game concepts or implementation notes", () => {
  const publicSurface = `${html}\n${css}`;
  for (const retired of [
    "心动大西瓜",
    "心动俄罗斯方块",
    "心动打砖块",
    "回忆球",
    "技能道具",
    "AI对手",
    "第一版原型",
    "产品定位"
  ]) {
    assert.equal(publicSurface.includes(retired), false, `${retired} should not be public copy`);
  }
});
