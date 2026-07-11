const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("game-billiards-love.html");
const css = read("assets/billiards-love.css");
const game = read("assets/billiards-love-game.js");
const runtimeCacheVersion = "billiards-love-touch-physics-20260712c";
const styleCacheVersion = "billiards-love-touch-physics-20260712c";

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
  assert.match(topbar, />心绪</);
  assert.match(topbar, /id="hb-interest">安稳</);
  assert.doesNotMatch(topbar, /兴趣值\s*\d|id="hb-interest">\d/);
  assert.match(html, />最终心绪</);
  assert.doesNotMatch(topbar, /hb-pause/);

  for (const id of ["hb-opening", "hb-start", "hb-pause", "hb-pause-sheet", "hb-resume", "hb-restart-pause"]) {
    assert.doesNotMatch(html, new RegExp(`id="${id}"`));
    assert.doesNotMatch(game, new RegExp(`required\\("#${id}"\\)`));
  }
  assert.doesNotMatch(html, /开始这一局|AFTER HOURS|PAUSED|暂停游戏|这一杆可以慢一点/);
  assert.match(game, /root\.dataset\.state = "break";/);
});

test("loads the custom physics and local billiards runtime in exact order", () => {
  assert.deepEqual(linked(html, "link", "href").filter((file) => file.endsWith(".css")), [
    "assets/billiards-love.css"
  ]);
  assert.deepEqual(linked(html, "script", "src"), [
    "assets/billiards-physics.js",
    "assets/billiards-love-rules.js",
    "assets/billiards-love-content.js",
    "assets/billiards-ball-renderer.js",
    "assets/billiards-love-game.js"
  ]);

  assert.deepEqual(references(html, "link", "href").filter((file) => file.includes("billiards-love.css")), [
    `assets/billiards-love.css?v=${styleCacheVersion}`
  ]);
  assert.deepEqual(references(html, "script", "src"), [
    `assets/billiards-physics.js?v=${runtimeCacheVersion}`,
    `assets/billiards-love-rules.js?v=${runtimeCacheVersion}`,
    `assets/billiards-love-content.js?v=${runtimeCacheVersion}`,
    `assets/billiards-ball-renderer.js?v=${runtimeCacheVersion}`,
    `assets/billiards-love-game.js?v=${runtimeCacheVersion}`
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

  for (const selector of [".hb-call", ".hb-micro", ".hb-judgement", ".hb-coach"]) {
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

test("uses project-local recorded billiards and event audio", () => {
  for (const asset of [
    "assets/audio/billiards/cue-strike.ogg",
    "assets/audio/billiards/ball-contact-soft.ogg",
    "assets/audio/billiards/ball-contact-hard.ogg",
    "assets/audio/billiards/rail-contact.ogg",
    "assets/audio/billiards/pocket-drop.ogg",
    "assets/audio/billiards/event-soft.ogg",
    "assets/audio/billiards/stage-rise.ogg"
  ]) {
    assert.equal(fs.existsSync(path.join(root, asset)), true, `${asset} should exist`);
    assert.match(game, new RegExp(escapeRegExp(asset)));
  }
  assert.doesNotMatch(game, /createOscillator|createPeriodicWave|ScriptProcessorNode/);
});

test("fits the complete table in both 432 by 960 and short 432 by 820 portrait viewports", () => {
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
  assert.match(app, /--hb-table-width:\s*min\(\s*96%,\s*calc\(\(100dvh - var\(--hb-header-space\) - var\(--hb-footer-space\) - 16px\) \/ 2\)\s*\);/s);
  assert.match(playfield, /top:\s*var\(--hb-header-space\);/);
  assert.match(playfield, /right:\s*0;/);
  assert.match(playfield, /bottom:\s*var\(--hb-footer-space\);/);
  assert.match(playfield, /left:\s*0;/);
  assert.match(playfield, /min-height:\s*0;/);
  assert.match(playfield, /padding:\s*0 12px;/);
  assert.match(table, /height:\s*auto !important;/);
  assert.match(table, /width:\s*var\(--hb-table-width\) !important;/);
  assert.match(table, /max-width:\s*var\(--hb-table-width\) !important;/);
  assert.match(table, /max-height:\s*calc\(100% - 16px\) !important;/);
  assert.match(table, /aspect-ratio:\s*1 \/ 2 !important;/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(css, /env\(safe-area-inset-/);

  const targetWidth = 432;
  const devicePixelRatio = 10 / 3;
  assert.equal(targetWidth * devicePixelRatio, 1440);
  assert.equal(960 * devicePixelRatio, 3200);

  for (const targetHeight of [960, 820]) {
    const headerSpace = 6 + 44;
    const footerSpace = 5 + 38;
    const playfieldHeight = targetHeight - headerSpace - footerSpace;
    const horizontalPlayfieldPadding = 24;
    const tableSurfaceWidth = Math.min(
      (targetWidth - horizontalPlayfieldPadding) * 0.96,
      (targetHeight - headerSpace - footerSpace - 16) / 2
    );
    const tableSurfaceHeight = tableSurfaceWidth * 2;
    const tableLeft = (targetWidth - tableSurfaceWidth) / 2;
    const tableTop = headerSpace + (playfieldHeight - tableSurfaceHeight) / 2;
    const worldScale = tableSurfaceWidth / 720;
    const pockets = [
      { x: 95, y: 169 }, { x: 625, y: 169 },
      { x: 74, y: 720 }, { x: 646, y: 720 },
      { x: 95, y: 1271 }, { x: 625, y: 1271 }
    ];
    for (const pocket of pockets) {
      assert.ok(tableLeft + (pocket.x - 33) * worldScale >= 0, "pocket left edge must remain visible");
      assert.ok(tableLeft + (pocket.x + 33) * worldScale <= targetWidth, "pocket right edge must remain visible");
      assert.ok(tableTop + (pocket.y - 33) * worldScale >= 0, "pocket top edge must remain visible");
      assert.ok(tableTop + (pocket.y + 33) * worldScale <= targetHeight, "pocket bottom edge must remain visible");
    }

    const tableOuterTop = tableTop + 82 * worldScale;
    const tableOuterBottom = tableTop + 1358 * worldScale;
    const topHudBottom = 6 + 36;
    const relationshipTrackTop = targetHeight - (5 + 29) - 3;
    const bottomHudTop = targetHeight - 4 - 22;
    assert.ok(tableOuterTop > topHudBottom, "top HUD must remain outside the rendered table");
    assert.ok(tableOuterBottom < relationshipTrackTop, "all table pockets must end before relationship progress");
    assert.ok(tableOuterBottom < bottomHudTop, "bottom status must remain outside the rendered table");
    assert.ok(tableSurfaceHeight / targetHeight >= 0.81, "the complete table surface should use most of the portrait height");
    assert.ok((tableOuterBottom - tableOuterTop) / targetHeight >= 0.72, "the playable table should remain visually dominant");
    assert.ok(tableLeft >= 12, "the frame must retain a deliberate side margin");
    assert.ok(tableLeft + tableSurfaceWidth <= targetWidth - 12, "the complete right frame must remain visible");
  }
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

test("keeps the short performance centered, transient, and non-interactive", () => {
  const microHtml = fragment(html, '<div class="hb-micro"', "</div>");
  const micro = rule(".hb-micro");
  const microVisible = rule(".hb-micro:not([hidden])");
  const microTitle = rule(".hb-micro strong");
  const microLine = rule(".hb-micro p");
  const queueMicro = fragment(game, "function queueMicro", "function showNextMicro");

  assert.match(microHtml, /aria-live="polite" aria-atomic="true" hidden/);
  assert.match(microHtml, /id="hb-micro-kicker">1 · 对视</);
  assert.match(microHtml, /id="hb-micro-title">目光停了一秒</);
  assert.match(microHtml, /id="hb-micro-line">人群还在移动，你们却同时记住了彼此。</);
  assert.match(micro, /z-index:\s*12;/);
  assert.match(micro, /top:\s*50%;/);
  assert.match(micro, /left:\s*50%;/);
  assert.match(micro, /pointer-events:\s*none;/);
  assert.match(microVisible, /hb-micro-arrive 1600ms/);
  assert.match(microVisible, /animation-duration:\s*4200ms;/);
  assert.match(microTitle, /font-size:\s*24px;/);
  assert.match(css, /\.hb-micro p\s*\{[^}]*font-size:\s*11px;[^}]*\}/s);
  assert.match(css, /\.hb-micro::before\s*\{[^}]*radial-gradient[^}]*\}/s);
  assert.match(css, /\.hb-micro::after\s*\{[^}]*radial-gradient[^}]*\}/s);
  assert.match(css, /@keyframes hb-micro-halo/);
  assert.match(css, /@keyframes hb-micro-particles/);
  assert.match(game, /clamp\(item\.durationMs \+ 3000, 4200, 5200\)/);
  assert.doesNotMatch(queueMicro, /cinematicActive|root\.dataset\.state/);
});

test("shows a conic-gradient proportional power arc around the cue ball", () => {
  assert.doesNotMatch(html, /id="hb-power"|id="hb-power-fill"|id="hb-power-value"/);
  assert.doesNotMatch(css, /\.hb-power(?:\s|\{|\.)/);
  assert.match(game, /const MAX_PULL = 300;/);
  assert.match(game, /function powerFromPullRatio\(value\)/);
  assert.match(game, /function drawCuePowerGauge\(direction, pullRatio\)/);
  assert.match(game, /const colors = \["#4ed5ad", "#f0bc5b", "#ed6687"\]/);
  assert.match(game, /const zoneBoundaries = \[0, LIGHT_PULL_END, STRONG_PULL_START, 1\]/);
  assert.match(game, /const radius = BALL_RADIUS \+ 22/);
  assert.match(game, /context\.createConicGradient\(arcStart, center\.x, center\.y\)/);
  assert.match(game, /context\.arc\(center\.x, center\.y, radius, arcStart \+ arcSpan \* from, arcStart \+ arcSpan \* to\)/);
  assert.match(game, /const segmentCount = 52/);
  assert.match(game, /const profile = Math\.sin\(Math\.PI \* clamp\(relativeMidpoint, 0, 1\)\)/);
  assert.match(game, /context\.lineWidth = 2\.4 \+ profile \* 2\.1/);
  assert.match(game, /context\.arc\(nodeX, nodeY, 1\.35/);
  assert.match(game, /context\.moveTo\(0, -3\.6\)/);
  assert.doesNotMatch(game, /context\.strokeStyle = "rgba\(2, 8, 7, 0\.72\)"/);
  assert.match(game, /if \(pointerAim\) drawCuePowerGauge\(direction, pointerAim\.pullRatio\)/);
  assert.doesNotMatch(game, /Math\.round\(aimPower \* 100\)|Math\.round\(pointerAim\.pullRatio \* 100\)/);
});

test("separates the physical cushion bands from the cloth with a brighter beveled face", () => {
  assert.match(game, /const tones = material\.kind === "jaw"/);
  assert.match(game, /\["#123a31", "#37866d", "#1b5848"\]/);
  assert.match(game, /context\.strokeStyle = "rgba\(143, 224, 187, 0\.78\)"/);
  assert.match(game, /material\.id === "top"/);
  assert.match(game, /material\.id\.startsWith\("left"\)/);
});

test("keeps the full-screen performance lightweight, centered, and dismissible", () => {
  const cinematicHtml = fragment(html, '<section class="hb-cinematic"', "</section>");
  const layerNames = [
    "hb-cinematic-image", "hb-cinematic-light",
    "hb-cinematic-shade", "hb-cinematic-transition"
  ];
  let previousPosition = -1;
  for (const name of layerNames) {
    const position = cinematicHtml.indexOf(name);
    assert.ok(position > previousPosition, `${name} should preserve scene layer order`);
    previousPosition = position;
  }

  assert.match(cinematicHtml, /data-kind="stage" aria-live="polite" aria-atomic="true" hidden/);
  assert.match(cinematicHtml, /id="hb-cinematic-skip"[^>]*aria-label="略过演出"/);
  assert.match(cinematicHtml, /id="hb-cinematic-title">这一次，心意没有落空</);
  assert.match(cinematicHtml, /id="hb-cinematic-line">她看了你很久，然后轻轻点了点头。</);
  assert.match(cinematicHtml, /id="hb-cinematic-action" type="button" hidden>继续清台</);
  assert.match(rule(".hb-cinematic"), /z-index:\s*50;/);
  assert.match(rule(".hb-cinematic"), /contain:\s*paint;/);
  assert.match(css, /\.hb-cinematic-copy\s*\{[^}]*top:\s*50%;[^}]*text-align:\s*center;[^}]*\}/s);
  assert.match(rule(".hb-cinematic-copy strong"), /font-size:\s*32px;/);
  assert.match(rule(".hb-cinematic-copy p"), /font-size:\s*13px;/);
  assert.match(css, /\.hb-cinematic-transition\s*\{[^}]*z-index:\s*8;[^}]*\}/s);
  assert.match(rule(".hb-cinematic-skip"), /z-index:\s*10;/);
  assert.match(css, /\.hb-result\s*\{[^}]*z-index:\s*60;[^}]*\}/s);
  assert.match(css, /\.hb-cinematic-image,[\s\S]*?\.hb-cinematic-transition\s*\{[\s\S]*?pointer-events:\s*none;/);
  assert.doesNotMatch(cinematicHtml, /hb-cinematic-particles|hb-cinematic-vignette/);
  assert.doesNotMatch(rule(".hb-cinematic-image"), /filter:|animation:/);
  assert.doesNotMatch(rule(".hb-cinematic-light"), /filter:|animation:/);
  assert.match(rule(".hb-cinematic-particles"), /display:\s*none;/);
  assert.match(rule(".hb-cinematic-vignette"), /display:\s*none;/);
  assert.match(css, /\.hb-cinematic-transition\s*\{[^}]*hb-cinematic-simple-reveal 520ms[^}]*\}/s);
  assert.match(game, /autoCloseMs: clamp\(performance\.durationMs \+ 1800, 3400, 4300\)/);
  assert.match(game, /autoCloseMs: 4200/);
  assert.match(css, /@keyframes hb-cinematic-simple-reveal/);
  assert.match(css, /@keyframes hb-cinematic-simple-copy/);
  for (const kind of ["confession", "proposal", "early-success", "rejection"]) {
    assert.match(css, new RegExp(`\\.hb-cinematic\\[data-kind="${kind}"\\]`));
  }
  assert.match(game, /elements\.cinematic\.hidden = false;/);
  assert.match(game, /elements\.cinematic\.hidden = true;/);
  assert.match(game, /elements\.cinematicSkip\.addEventListener\("click", closeCinematic\);/);
  assert.match(game, /elements\.cinematicAction\.addEventListener\("click", closeCinematic\);/);
});

test("presents direct shooting guidance without mandatory selection copy", () => {
  assert.match(html, /在桌面任意位置反向滑动瞄准蓄力，松开击球/);
  assert.match(html, /桌面任意位置向后滑动/);
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
  for (const implementationNote of ["432×960", "DPR", "1.2-2 秒", "光晕/粒子", "自动关闭兼容"]) {
    assert.equal(html.includes(implementationNote), false, `${implementationNote} should not be visible page copy`);
  }
});
