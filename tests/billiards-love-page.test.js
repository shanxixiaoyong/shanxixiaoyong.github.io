const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("game-billiards-love.html");
const css = read("assets/billiards-love.css");
const game = read("assets/billiards-love-game.js");
const runtimeCacheVersion = "billiards-love-scene-portals-20260712e";
const styleCacheVersion = "billiards-love-scene-portals-20260712e";

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
    "<title>心动桌球 · 一场约会地图 - 刘勇 / Yong Liu</title>",
    '<body class="heartbeat-billiards-page">',
    '<main class="hb-app" id="heartbeat-billiards" aria-label="心动桌球：一场约会地图"',
    '<canvas id="hb-canvas" width="720" height="1440"',
    'id="hb-relationship-track"',
    'id="hb-interest"',
    'id="hb-selected-ball"'
  ]) {
    assert.match(html, new RegExp(escapeRegExp(token)));
  }
  assert.doesNotMatch(html, /横过来|旋转设备|手机横屏/);
  assert.doesNotMatch(html, /今晚的片段|回忆日志|心动值|剩余回合|桌边物件/);
});

test("opens directly into play without visible opening or pause UI", () => {
  const topbar = fragment(html, '<header class="hb-topbar">', "</header>");
  const topbarButtonIds = [...topbar.matchAll(/<button\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(topbarButtonIds, ["hb-sound", "hb-aim-toggle"]);
  for (const token of ["hb-back", "hb-stage-kicker", "hb-stage-title", "hb-interest-wrap", "hb-sound", "hb-aim-toggle"]) {
    assert.match(topbar, new RegExp(escapeRegExp(token)));
  }
  assert.match(topbar, /class="hb-sr-only" id="hb-stage-targets"/);
  assert.match(topbar, />夜色</);
  assert.match(topbar, /id="hb-interest">未醒</);
  assert.doesNotMatch(topbar, /兴趣值\s*\d|id="hb-interest">\d/);
  assert.match(html, />最终(?:心绪|夜色)</);
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

test("uses project-local rose date-map, confession, and proposal art", () => {
  for (const asset of [
    "assets/billiards-scenes/date-map-rose-v3.jpg",
    "assets/billiards-scenes/confession-night.jpg",
    "assets/billiards-scenes/proposal-dawn.jpg",
    "assets/billiards-scenes/portal-corner-store-v1.jpg",
    "assets/billiards-scenes/portal-coffee-window-v1.jpg",
    "assets/billiards-scenes/portal-late-cinema-v1.jpg",
    "assets/billiards-scenes/portal-river-walk-v1.jpg",
    "assets/billiards-scenes/portal-last-train-v1.jpg",
    "assets/billiards-scenes/portal-walk-home-v1.jpg"
  ]) {
    assert.equal(fs.existsSync(path.join(root, asset)), true, `${asset} should exist`);
  }
  for (const reference of [
    'url("billiards-scenes/date-map-rose-v3.jpg")',
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
  assert.match(game, /startMusicBed\(\)/);
  assert.match(game, /setDateFlow\(streak, paused = false\)/);
  assert.doesNotMatch(game, /createPeriodicWave|ScriptProcessorNode/);
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
  assert.match(app, /--hb-footer-space:\s*calc\(max\(5px, var\(--safe-bottom\)\) \+ 52px\);/);
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
    const footerSpace = 5 + 52;
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

test("keeps the six-scene date map and compact shot status outside the table", () => {
  const track = rule(".hb-relationship-track");
  const trackNodes = rule(".hb-relationship-track ol");
  const bottom = rule(".hb-bottom-bar");
  const footer = fragment(html, '<footer class="hb-bottom-bar">', "</footer>");

  assert.match(track, /bottom:\s*calc\(max\(5px, var\(--safe-bottom\)\) \+ 29px\);/);
  assert.match(trackNodes, /grid-template-columns:\s*repeat\(6, minmax\(0, 1fr\)\);/);
  assert.match(html, /<ol id="hb-track-nodes" aria-label="六站约会场景"><\/ol>/);
  assert.match(game, /DATE_SCENES\.forEach\(\(scene, index\) => \{/);
  assert.match(bottom, /height:\s*22px;/);
  assert.match(bottom, /bottom:\s*max\(4px, var\(--safe-bottom\)\);/);
  assert.match(footer, />杆数</);
  assert.match(footer, />连进</);
  assert.doesNotMatch(footer, /本局|连续进球|第一碰球/);
});

test("keeps table moments lightweight and lets misses pause rather than end the map", () => {
  const momentHtml = fragment(html, '<div class="hb-table-moment"', "</div>");
  const canInteract = fragment(game, "function canInteract", "function selectTarget");
  const outcomes = fragment(game, "function processOutcomePerformances", "function finalizeShot");

  for (const id of ["hb-table-moment-scene", "hb-table-moment-title", "hb-table-moment-line"]) {
    assert.match(momentHtml, new RegExp(id));
  }
  assert.match(css, /\.hb-table-moment,\s*\.hb-micro\s*\{[^}]*pointer-events:\s*none;/s);
  assert.match(css, /\.hb-table-moment:not\(\[hidden\]\),\s*\.hb-micro:not\(\[hidden\]\)\s*\{[^}]*hb-table-moment-enter/s);
  assert.doesNotMatch(canInteract, /tableMomentActive/);
  assert.match(outcomes, /setDateFlow\(0, true\)/);
  assert.match(outcomes, /dateMapState\.flow = 0/);
  assert.doesNotMatch(outcomes, /queueStageMicro\(/);
});

test("integrates shot telemetry, persistent date-map routes, and pocket slow motion", () => {
  const tableStory = fragment(html, '<div class="hb-table-story"', "</div>\n        </div>");
  for (const token of ["hb-table-reflection", "hb-pocket-focus"]) {
    assert.match(tableStory, new RegExp(token));
  }
  assert.match(rule(".hb-table-story"), /z-index:\s*3;/);
  assert.match(rule(".hb-table-story"), /pointer-events:\s*none;/);
  assert.match(css, /@keyframes hb-pocket-focus-ring/);
  assert.doesNotMatch(html + css, /hb-companion|hb-memory-rail|hb-memory-token|hb-shot-story/);
  assert.match(game, /const POCKET_STORY_SLOW_MOTION_MS = 460;/);
  assert.match(game, /const POCKET_STORY_TIME_SCALE = 0\.24;/);
  assert.match(game, /shotState\.pottedDetails\.push\(detail\)/);
  assert.match(game, /storySlowMotionUntil = performance\.now\(\) \+ POCKET_STORY_SLOW_MOTION_MS/);
  assert.match(game, /const storyTimeScale = timestamp < storySlowMotionUntil \? POCKET_STORY_TIME_SCALE : 1/);
  assert.match(game, /content\.analyzeShot\(/);
  assert.match(game, /content\.selectShotStory\(/);
  assert.match(game, /function rememberDateMoment\(/);
  assert.match(game, /dateMapState\.routes\.push\(route\)/);
  assert.match(game, /function drawDateMap\(timestamp\)/);
  assert.match(game, /drawDateMap\(timestamp\)/);
  assert.match(game, /function drawScenePortalPhoto\(timestamp\)/);
  assert.match(game, /function drawScenePortalLighting\(timestamp\)/);
  assert.match(game, /drawScenePortalLighting\(/);
  assert.match(game, /DATE_SCENE_VARIANTS/);
  assert.match(game, /STAGE_SCENE_MOODS/);
  assert.match(game, /sceneVariantFor\(zone, number, motif, options\.archetype\)/);
  assert.match(css, /background-image:\s*var\(--hb-backdrop-image\)/);
  assert.match(css, /background-image:\s*var\(--hb-scene-image\)/);
  assert.match(game, /function drawCueJourney\(/);
  assert.match(game, /function drawFinalDateShape\(/);
  assert.match(html, /id="hb-scene-lens"/);
  assert.match(css, /\.hb-scene-lens\.is-active/);
  assert.match(css, /@keyframes hb-scene-lens-(?:reveal|dissolve|flash|match-pan|push)/);
  assert.match(game, /sceneLensStartTimer = setTimeout\(\(\) => playSceneLens\(scene, route, pocket\), 110\)/);
  assert.doesNotMatch(game, /drawSceneArchitecture\(zone, timestamp\);/);
});

test("shows a conic-gradient proportional power arc around the cue ball", () => {
  assert.doesNotMatch(html, /id="hb-power"|id="hb-power-fill"|id="hb-power-value"/);
  assert.doesNotMatch(css, /\.hb-power(?:\s|\{|\.)/);
  assert.match(game, /const MAX_PULL = 300;/);
  assert.match(game, /function powerFromPullRatio\(value\)/);
  assert.match(game, /function drawCuePowerGauge\(direction, pullRatio\)/);
  assert.match(game, /const colors = \["#d899ba", "#efc37f", "#ed6687"\]/);
  assert.match(game, /const zoneBoundaries = \[0, LIGHT_PULL_END, STRONG_PULL_START, 1\]/);
  assert.match(game, /const radius = BALL_RADIUS \+ 22/);
  assert.match(game, /context\.createConicGradient\(arcStart, center\.x, center\.y\)/);
  assert.match(game, /context\.arc\(center\.x, center\.y, radius, arcStart \+ arcSpan \* from, arcStart \+ arcSpan \* to\)/);
  assert.match(game, /const segmentCount = 32/);
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
  assert.match(game, /\["#42172b", "#a8526e", "#622640"\]/);
  assert.match(game, /context\.strokeStyle = "rgba\(244, 166, 194, 0\.8\)"/);
  assert.match(game, /material\.id === "top"/);
  assert.match(game, /material\.id\.startsWith\("left"\)/);
});

test("keeps a dormant result cinematic shell without using it for ordinary pots", () => {
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
  assert.match(css, /\.hb-result\s*\{[^}]*height:\s*52px;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto;/s);
  assert.doesNotMatch(css, /\.hb-result\s*\{[^}]*(?:backdrop-filter|40dvh)/s);
  assert.match(css, /\.hb-result > p,\s*\.hb-result-grid\s*\{\s*display:\s*none;/s);
  assert.match(html, /id="hb-retry"[^>]*aria-label="再遇一次"/);
  assert.match(html, /href="index\.html" aria-label="回到个人天地"/);
  assert.doesNotMatch(rule(".hb-backdrop"), /filter:/);
  assert.doesNotMatch(rule(".hb-scene-lens"), /filter:/);
  assert.match(css, /\.hb-cinematic-image,[\s\S]*?\.hb-cinematic-transition\s*\{[\s\S]*?pointer-events:\s*none;/);
  assert.doesNotMatch(cinematicHtml, /hb-cinematic-particles|hb-cinematic-vignette/);
  assert.doesNotMatch(rule(".hb-cinematic-image"), /filter:|animation:/);
  assert.doesNotMatch(rule(".hb-cinematic-light"), /filter:|animation:/);
  assert.match(rule(".hb-cinematic-particles"), /display:\s*none;/);
  assert.match(rule(".hb-cinematic-vignette"), /display:\s*none;/);
  assert.match(css, /\.hb-cinematic-transition\s*\{[^}]*hb-cinematic-pocket-veil 760ms[^}]*\}/s);
  assert.match(css, /\.hb-cinematic:not\(\[hidden\]\) \.hb-cinematic-image\s*\{[^}]*hb-cinematic-pocket-image 860ms[^}]*\}/s);
  assert.match(css, /@keyframes hb-cinematic-pocket-image/);
  assert.match(css, /@keyframes hb-cinematic-pocket-veil/);
  assert.match(css, /@keyframes hb-cinematic-simple-copy/);
  for (const kind of ["confession", "proposal", "early-success", "rejection"]) {
    assert.match(css, new RegExp(`\\.hb-cinematic\\[data-kind="${kind}"\\]`));
  }
  assert.match(game, /elements\.cinematic\.hidden = false;/);
  assert.match(game, /elements\.cinematic\.hidden = true;/);
  assert.match(game, /--hb-cinematic-origin-x/);
  assert.match(game, /--hb-cinematic-origin-y/);
  assert.match(game, /elements\.cinematicSkip\.addEventListener\("click", closeCinematic\);/);
  assert.match(game, /elements\.cinematicAction\.addEventListener\("click", closeCinematic\);/);
  const outcomes = fragment(game, "function processOutcomePerformances", "function finalizeShot");
  assert.doesNotMatch(outcomes, /queueCinematic\(/);
  assert.match(outcomes, /beginFinalDateMapReveal\(outcome\)/);
});

test("presents direct shooting guidance without mandatory selection copy", () => {
  assert.match(html, /在桌面任意位置反向滑动瞄准蓄力，松手或第二指轻触击球/);
  assert.match(html, /向后拖动，松手或第二指轻触出杆/);
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
