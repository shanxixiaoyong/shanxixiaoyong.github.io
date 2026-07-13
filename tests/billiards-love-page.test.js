const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("game-billiards-love.html");
const css = read("assets/billiards-love.css");
const game = read("assets/billiards-love-game.js");
const surfaceRenderer = read("assets/billiards-surface-renderer.js");
const runtimeCacheVersion = "billiards-coupled-material-20260713b";
const styleCacheVersion = "billiards-coupled-material-20260713b";

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

function implementationOf(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} should exist`);
  const next = source.indexOf("\n  function ", start + marker.length);
  return source.slice(start, next === -1 ? source.length : next);
}

function rule(selector) {
  const match = css.match(new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`, "s"));
  assert.ok(match, `${selector} rule should exist`);
  return match[1];
}

test("publishes the portrait standard-fifteen-ball identity", () => {
  for (const token of [
    "<title>幻彩桌球 · 十五球光谱竞技 - 刘勇 / Yong Liu</title>",
    '<body class="heartbeat-billiards-page">',
    '<main class="hb-app" id="heartbeat-billiards" aria-label="幻彩桌球：十五球光谱竞技"',
    '<canvas id="hb-canvas" width="720" height="1440"',
    'id="hb-relationship-track"',
    'id="hb-interest"',
    'id="hb-selected-ball"'
  ]) {
    assert.match(html, new RegExp(escapeRegExp(token)));
  }
  assert.doesNotMatch(html, /横过来|旋转设备|手机横屏/);
  assert.doesNotMatch(html, /今晚的片段|回忆日志|心动值|剩余回合|桌边物件|约会|恋爱|告白|求婚/);
});

test("opens directly into play without visible opening or pause UI", () => {
  const topbar = fragment(html, '<header class="hb-topbar">', "</header>");
  const topbarButtonIds = [...topbar.matchAll(/<button\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(topbarButtonIds, [
    "hb-surface-toggle", "hb-surface-lava", "hb-surface-galaxy", "hb-surface-circuit",
    "hb-surface-ice", "hb-surface-ink", "hb-sound", "hb-aim-toggle"
  ]);
  for (const token of ["hb-back", "hb-stage-kicker", "hb-stage-title", "hb-interest-wrap", "hb-surface-toggle", "hb-sound", "hb-aim-toggle"]) {
    assert.match(topbar, new RegExp(escapeRegExp(token)));
  }
  assert.match(topbar, /class="hb-sr-only" id="hb-stage-targets"/);
  assert.match(topbar, />光效</);
  assert.match(topbar, /id="hb-interest">待机</);
  assert.doesNotMatch(topbar, /兴趣值\s*\d|id="hb-interest">\d/);
  assert.match(html, />光场强度</);
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
    "assets/billiards-surface-renderer.js",
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
    `assets/billiards-surface-renderer.js?v=${runtimeCacheVersion}`,
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

test("uses a simulated water field without narrative scene photography", () => {
  const activeTableRenderer = implementationOf(game, "drawDateMap");

  assert.match(game, /const BALL_CHROMA_THEMES = Object\.freeze\(\{/);
  assert.match(game, /const POCKET_VFX_PROFILES = Object\.freeze\(\{/);
  assert.match(game, /function createWaterSurface\(/);
  assert.match(game, /function disturbWaterWorld\(/);
  assert.match(game, /function stepWaterSimulation\(/);
  assert.match(game, /function renderWaterSurface\(/);
  assert.match(activeTableRenderer, /renderWaterSurface\(timestamp\)/);
  assert.match(game, /function drawRailLightStrip\(/);
  assert.match(activeTableRenderer, /drawRailLightStrip\(timestamp\)/);
  assert.match(activeTableRenderer, /drawPocketLightPorts\(timestamp\)/);
  assert.doesNotMatch(
    activeTableRenderer,
    /\b(?:drawChroma(?:ThemeField|Cloth|Pattern|RailBursts)|drawRollingChromaTrails)\(/
  );
  assert.match(css, /--hb-backdrop-image:\s*none;/);
  assert.match(css, /radial-gradient\(circle at 72% 18%/);
  assert.doesNotMatch(html + css + game, /date-map-rose|portal-corner|portal-coffee|portal-late|portal-river|portal-last|portal-walk|proposal-dawn/);
  assert.doesNotMatch(html + css, /https?:\/\//);
});

test("couples the photographic cloth and rolling field inside one WebGL material pass", () => {
  assert.match(surfaceRenderer, /getContext\?\.\("webgl2"/);
  assert.match(surfaceRenderer, /uniform sampler2D uBase;/);
  assert.match(surfaceRenderer, /uniform sampler2D uField;/);
  assert.match(surfaceRenderer, /uniform vec2 uBaseTexel;/);
  assert.match(surfaceRenderer, /gl\.texSubImage2D\(/);
  assert.match(surfaceRenderer, /uv \+= heatFlow/);
  assert.match(surfaceRenderer, /vec2 swirl = vec2\(-gradient\.y, gradient\.x\)/);
  assert.match(surfaceRenderer, /float charge = smoothstep/);
  assert.match(surfaceRenderer, /vec2 refractDirection = normalize/);
  assert.match(surfaceRenderer, /color = mix\(center, wet/);
  assert.doesNotMatch(surfaceRenderer, /float stars =|vec3 electric =|float facet =/);
  assert.match(game, /function initializeSurfaceRenderer\(/);
  assert.match(game, /surfaceRenderer\.render\(\{/);
  assert.match(game, /surfaceRenderer \? "webgl2-displaced-texture" : "canvas-field-fallback"/);
});

test("offers five reference-matched persisted cinematic surface materials", () => {
  const expected = [
    ["lava", "熔岩裂境"],
    ["galaxy", "星河引力"],
    ["circuit", "霓虹矩阵"],
    ["ice", "极寒冰域"],
    ["ink", "水墨山河"]
  ];
  assert.match(html, /data-surface-material="lava"/);
  assert.match(html, /id="hb-surface-menu"[^>]*role="menu"/);
  for (const [id, label] of expected) {
    const texture = `assets/billiards-surfaces/${id}.jpg`;
    assert.match(html, new RegExp(`id="hb-surface-${id}"[\\s\\S]*?data-surface-material="${id}"[\\s\\S]*?>${label}<`));
    assert.match(game, new RegExp(`id: "${id}", label: "${label}"`));
    assert.match(game, new RegExp(`${id}: "${escapeRegExp(texture)}"`));
    assert.match(css, new RegExp(`data-surface-material="${id}"`));
    assert.match(css, new RegExp(escapeRegExp(`url("billiards-surfaces/${id}.jpg")`)));
    assert.equal(fs.existsSync(path.join(root, texture)), true, `${texture} should exist`);
    assert.ok(fs.statSync(path.join(root, texture)).size > 500 * 1024, `${texture} should retain high-detail raster data`);
  }
  assert.match(html, /<link rel="preload" href="assets\/billiards-surfaces\/lava\.jpg" as="image" fetchpriority="high">/);
  assert.match(game, /const SURFACE_KEY = "yl-chroma-surface-material-v2"/);
  assert.match(game, /const SURFACE_TEXTURE_SOURCES = Object\.freeze\(\{/);
  assert.match(game, /function selectSurfaceMaterial\(/);
  assert.match(game, /writeStorage\(SURFACE_KEY, material\.id\)/);
  assert.match(game, /materialId === "ink"/);
  assert.match(game, /function ensureSurfaceTexture\(/);
  assert.match(game, /function drawSurfaceTexture\(/);
  assert.match(game, /function createSurfaceArtwork\(/);
  assert.match(game, /function drawMaterialMotionTrails\(/);
  assert.match(game, /paintLavaArtwork/);
  assert.match(game, /paintGalaxyArtwork/);
  assert.match(game, /paintCircuitArtwork/);
  assert.match(game, /paintIceArtwork/);
  assert.match(game, /paintInkArtwork/);
  assert.match(game, /waterSurface\.pigment/);
  assert.match(css, /\.hb-surface-menu\[hidden\]/);
  assert.doesNotMatch(css, /\.hb-surface-menu[\s\S]*?backdrop-filter/);
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
  assert.doesNotMatch(css, /@media\s*\([^)]*(?:orientation|aspect-ratio)[^)]*\)/);
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

test("keeps the six-pocket effect track and compact shot status outside the table", () => {
  const track = rule(".hb-relationship-track");
  const trackNodes = rule(".hb-relationship-track ol");
  const bottom = rule(".hb-bottom-bar");
  const footer = fragment(html, '<footer class="hb-bottom-bar">', "</footer>");

  assert.match(track, /bottom:\s*calc\(max\(5px, var\(--safe-bottom\)\) \+ 29px\);/);
  assert.match(trackNodes, /grid-template-columns:\s*repeat\(6, minmax\(0, 1fr\)\);/);
  assert.match(html, /<ol id="hb-track-nodes" aria-label="六段光域阶段"><\/ol>/);
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

test("integrates shot telemetry, persistent water and rail state, and pocket slow motion", () => {
  const tableStory = fragment(html, '<div class="hb-table-story"', "</div>\n        </div>");
  const activeTableRenderer = implementationOf(game, "drawDateMap");
  const rollingUpdate = implementationOf(game, "updateRollingState");
  const rollingWake = implementationOf(game, "depositRollingWaterWake");
  const railBurst = implementationOf(game, "spawnChromaRailBurst");
  const railLightStrip = implementationOf(game, "drawRailLightStrip");
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
  assert.match(game, /const BALL_CHROMA_THEMES = Object\.freeze\(\{/);
  assert.match(game, /const POCKET_VFX_PROFILES = Object\.freeze\(\{/);
  assert.match(game, /activeTheme: \{ \.\.\.BALL_CHROMA_THEMES\[0\] \}/);
  assert.match(game, /activeEffect: null/);
  assert.match(game, /blackEightBlast: null/);
  assert.match(game, /function createWaterSurface\(/);
  assert.match(game, /function resetWaterSurface\(/);
  assert.match(game, /function disturbWaterWorld\(/);
  assert.match(game, /function stepWaterSimulation\(/);
  assert.match(game, /function renderWaterSurface\(/);
  assert.match(rollingUpdate, /depositRollingWaterWake\(ball, data, dx, dy, travel\)/);
  assert.match(rollingWake, /disturbMaterialWorld\(/);
  assert.match(game, /function railDistanceForContact\(/);
  assert.match(game, /function railPositionFromDistance\(/);
  assert.match(railBurst, /railDistanceForContact\(/);
  assert.match(railLightStrip, /wave\.originS \+ front/);
  assert.match(railLightStrip, /wave\.originS - front/);
  assert.match(railLightStrip, /railPositionFromDistance\(/);
  assert.match(activeTableRenderer, /renderWaterSurface\(timestamp\)/);
  assert.doesNotMatch(
    activeTableRenderer,
    /\b(?:drawChroma(?:ThemeField|Cloth|Pattern|RailBursts)|drawRollingChromaTrails)\(/
  );
  assert.match(game, /function drawPocketLightPorts\(timestamp\)/);
  assert.match(game, /function drawBlackEightLedChoreography\(timestamp\)/);
  assert.match(game, /function drawScenePortalLighting\(timestamp\)/);
  assert.match(game, /drawScenePortalLighting\(/);
  assert.match(game, /spawnChromaRailBurst\(bodyA, bodyB, collision, impactSpeed\)/);
  assert.match(game, /spawnChromaRailBurst\(bodyB, bodyA, collision, impactSpeed\)/);
  assert.match(game, /rememberDateMoment\(0, \{/);
  assert.match(css, /--hb-backdrop-image:\s*none;/);
  assert.match(css, /--hb-scene-image:\s*none;/);
  assert.match(html, /id="hb-scene-lens"/);
  assert.match(css, /\.hb-scene-lens\.is-active/);
  assert.match(css, /@keyframes hb-scene-lens-(?:reveal|dissolve|flash|match-pan|push)/);
  assert.match(game, /sceneLensStartTimer = setTimeout\(\(\) => playSceneLens\(scene, route, pocket\), 110\)/);
  assert.doesNotMatch(game, /loadMaterialTexture\("assets\/billiards-scenes/);
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
  assert.match(game, /\["#0c121c", "#536277", "#172230"\]/);
  assert.match(game, /context\.strokeStyle = "rgba\(199, 230, 255, 0\.82\)"/);
  assert.match(game, /material\.id === "top"/);
  assert.match(game, /material\.id\.startsWith\("left"\)/);
});

test("keeps a compact result dock and reserves the largest effect for black 8", () => {
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
  assert.match(cinematicHtml, /id="hb-cinematic-kicker">黑 8 · 终局序列</);
  assert.match(cinematicHtml, /id="hb-cinematic-title">全谱共振已锁定</);
  assert.match(cinematicHtml, /id="hb-cinematic-line">最后一束色阶正在汇入球桌。</);
  assert.match(rule(".hb-cinematic"), /z-index:\s*50;/);
  assert.match(rule(".hb-cinematic"), /contain:\s*paint;/);
  assert.match(css, /\.hb-result\s*\{[^}]*z-index:\s*60;[^}]*\}/s);
  assert.match(css, /\.hb-result\s*\{[^}]*height:\s*52px;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto;/s);
  assert.doesNotMatch(css, /\.hb-result\s*\{[^}]*(?:backdrop-filter|40dvh)/s);
  assert.match(css, /\.hb-result > p,\s*\.hb-result-grid\s*\{\s*display:\s*none;/s);
  assert.match(html, /id="hb-retry"[^>]*aria-label="再开一局"/);
  assert.match(html, /href="index\.html" aria-label="返回首页"/);
  assert.match(game, /function beginFinalDateMapReveal\(outcome\)/);
  assert.match(game, /dateMapState\.blackEightBlast = \{/);
  assert.match(game, /duration: success \? 4400 : 3200/);
  const railLightStrip = implementationOf(game, "drawRailLightStrip");
  const blackEight = implementationOf(game, "drawBlackEightLedChoreography");
  assert.match(blackEight, /drawRailLightStrip\(timestamp\)/);
  assert.match(blackEight, /drawPocketLightPorts\(timestamp\)/);
  assert.match(railLightStrip, /dateMapState\.blackEightBlast/);
  assert.match(game, /screenShake = Math\.max\(screenShake, success \? 7\.2 : 4\.2\)/);
  assert.match(game, /scheduleResultAfterTable\(success \? 5000 : 3500\)/);
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
