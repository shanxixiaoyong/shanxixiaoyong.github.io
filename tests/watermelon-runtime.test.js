const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("game-watermelon.html");
const rulesSource = read("assets/watermelon-rules.js");
const gameSource = read("assets/watermelon-game.js");
const css = read("assets/watermelon.css");

test("publishes the exact 心动大西瓜 page identity", () => {
  assert.match(html, /<title>心动大西瓜 - 刘勇 \/ Yong Liu<\/title>/);
  assert.match(html, /<meta name="description" content="心动大西瓜：/);
  assert.match(html, /<main class="wm-app" id="watermelon-game" aria-label="心动大西瓜">/);
  assert.match(html, /<h1>心动大西瓜<\/h1>/);
});

test("keeps a touch-first game shell without an instruction-note panel", () => {
  assert.match(html, /id="wm-current-moment"/);
  assert.match(html, /id="wm-courage"[^>]*><i><\/i><i><\/i><i><\/i>/);
  assert.match(html, /id="wm-scene-name"/);
  assert.match(html, /id="wm-event-canvas"/);
  assert.equal(html.includes("wm-coach"), false);
  assert.equal(html.includes("左右拖动"), false);
  assert.equal(html.includes("长按"), false);
  assert.equal(css.includes(".wm-coach"), false);
  assert.match(css, /#wm-canvas\s*\{[\s\S]*?touch-action:\s*none/);
  assert.match(css, /width:\s*min\(100%,\s*430px\)/);
  assert.match(css, /grid-template-rows:\s*calc\(62px \+ env\(safe-area-inset-top\)\) 72px minmax\(0, 1fr\)/);
});

test("loads only local Matter, semantic rules, and game runtime in order", () => {
  const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)]
    .map((match) => match[1].split("?")[0]);
  assert.deepEqual(scripts, [
    "assets/vendor/matter-0.20.0.min.js",
    "assets/watermelon-rules.js",
    "assets/watermelon-game.js"
  ]);
  assert.doesNotThrow(() => new vm.Script(rulesSource));
  assert.doesNotThrow(() => new vm.Script(gameSource));
  assert.equal(/https?:\/\//.test(`${html}\n${rulesSource}\n${gameSource}\n${css}`), false);
  assert.equal(/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/.test(`${rulesSource}\n${gameSource}`), false);
});

test("uses Matter.js circles while storing semantic moment metadata", () => {
  assert.match(gameSource, /Engine\.create\(\{ enableSleeping: true \}\)/);
  assert.match(gameSource, /Bodies\.circle\(x, y, moment\.radius/);
  assert.match(gameSource, /body\.plugin\.heartMoment/);
  assert.match(gameSource, /Composite\.add\(engine\.world, body\)/);
  assert.match(gameSource, /Events\.on\(engine, "collisionStart"/);
  assert.match(gameSource, /firstData\.tier === secondData\.tier/);
  assert.equal(/蓝莓|樱桃|草莓|葡萄|橘子|苹果|菠萝|哈密瓜/.test(`${html}\n${rulesSource}\n${gameSource}`), false);
});

test("renders a distinct canvas model and material effect for every tier", () => {
  const models = [
    "glance", "chat", "approach", "earbuds", "ticket", "photo",
    "hands", "embrace", "letter", "keepsake", "secret"
  ];
  for (const model of models) {
    assert.match(gameSource, new RegExp(`case "${model}"`));
  }
  const rendererNames = [
    "drawGlance", "drawChat", "drawApproach", "drawEarbuds", "drawTicket",
    "drawPhoto", "drawHands", "drawEmbrace", "drawLetter", "drawKeepsake", "drawSecret"
  ];
  for (const renderer of rendererNames) assert.match(gameSource, new RegExp(`function ${renderer}\\(`));
  assert.match(gameSource, /function drawMaterialTexture\(/);
  assert.match(gameSource, /kind: secret \? "secret" : moment\.effect/);
});

test("persists first discoveries and gives repeats lightweight randomized rewards", () => {
  assert.match(gameSource, /const DISCOVERY_KEY = "yl-heart-watermelon-discoveries-v1"/);
  assert.match(gameSource, /let discoveredTiers = readDiscoveries\(\)/);
  assert.match(gameSource, /if \(!discoveredTiers\.has\(tier\)\)/);
  assert.match(gameSource, /rules\.pickUnlockEvent\(tier, eventRandom\)/);
  assert.match(gameSource, /queueCinematic\(event, tier, false\)/);
  assert.match(gameSource, /rules\.pickMergeReward\(tier, eventRandom, lastRewardIds\[tier\] \|\| null\)/);
  assert.match(gameSource, /showToast\(reward\.copy\)/);
  assert.match(gameSource, /cinematicQueue/);
});

test("provides varied full-screen performances for every romantic stage", () => {
  const performances = [
    "glance", "chat", "approach", "earbuds", "ticket", "photo",
    "hands", "embrace", "confession", "memory"
  ];
  for (const performance of performances) {
    assert.match(css, new RegExp(`data-performance="${performance}"`));
  }
  assert.match(css, /data-performance\^="secret"/);
  assert.match(gameSource, /cinematic\.dataset\.performance = entry\.event\.performance/);
  assert.match(gameSource, /drawEventMoment\(entry\.tier\)/);
  assert.match(html, /class="wm-event-atmosphere"[^>]*><i><\/i><i><\/i><i><\/i><i><\/i><i><\/i><i><\/i><i><\/i><i><\/i>/);
});

test("charges courage from mutual responses and spends it on a long press", () => {
  assert.match(gameSource, /const COURAGE_HOLD_MS = 620/);
  assert.match(gameSource, /rules\.useCourage\(scoreState, currentTier, true\)/);
  assert.match(gameSource, /window\.setTimeout\(advanceHeldMoment, COURAGE_HOLD_MS\)/);
  assert.match(gameSource, /scoreState\.courage === rules\.RULES\.maxCourage/);
  assert.match(gameSource, /marks: \[firstData\.mark, secondData\.mark\]/);
  assert.match(gameSource, /彼此回应 · 勇气/);
  assert.match(gameSource, /function oppositeMark\(mark\)/);
});

test("combines matching top-tier memories into persisted randomized secrets", () => {
  assert.match(gameSource, /if \(result\.secretCombination\)/);
  assert.match(gameSource, /rules\.pickSecretCombination\(eventRandom, lastSecretEventId\)/);
  assert.match(gameSource, /const SECRET_DISCOVERY_KEY = "yl-heart-watermelon-secret-discovered-v1"/);
  assert.match(gameSource, /writeStorage\(SECRET_COUNT_KEY, secretCount\)/);
  assert.match(gameSource, /queueCinematic\(event, moments\.length - 1, true\)/);
  assert.match(gameSource, /showToast\(event\.line, 1900\)/);
});

test("evolves atmosphere and adaptive audio without requiring HeartbeatAudio", () => {
  assert.match(gameSource, /const Candidate = window\.HeartbeatAudio/);
  assert.match(gameSource, /return new Candidate\(\{ channel: "heart-watermelon", adaptive: true \}\)/);
  assert.match(gameSource, /heartbeatAudio\.setScene\?\.\(activeScene\.id\)/);
  assert.match(gameSource, /heartbeatAudio\.setIntensity\?\.\(intensity\)/);
  assert.match(gameSource, /const AudioCtor = window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(gameSource, /if \(dispatchHeartbeat\("drop", payload\)\) return/);
  assert.match(gameSource, /tone\(190 \+ tier \* 17/);
  for (const scene of ["platform", "walk", "cinema", "rain", "room", "midnight"]) {
    assert.match(gameSource, new RegExp(`activeScene\\.id === "${scene}"|else drawRoomScene`));
  }
});

test("reanchors settled moments and clears stale contacts on resize", () => {
  assert.match(gameSource, /const floorDelta = worldHeight - previousHeight/);
  assert.match(gameSource, /body\.position\.y \+ \(settled \? floorDelta : 0\)/);
  assert.match(gameSource, /Sleeping\.set\(body, false\)/);
  assert.match(gameSource, /data\.contacts\.clear\(\)/);
  assert.match(gameSource, /data\.contactState = null/);
  assert.match(gameSource, /data\.dangerSince = null/);
});

test("retains bounded fixed-step backlog and stops for modal states", () => {
  assert.match(gameSource, /const MAX_CATCHUP_STEPS = 8/);
  assert.match(gameSource, /accumulator = Math\.min\(MAX_BACKLOG, accumulator \+ delta\)/);
  assert.match(gameSource, /while \(accumulator >= STEP && steps < MAX_CATCHUP_STEPS\)/);
  assert.match(gameSource, /if \(paused \|\| gameOver \|\| cinematicBlocking\(\)\) \{\s*accumulator = 0;\s*break;/);
  assert.equal(gameSource.includes("if (steps === 3) accumulator = 0"), false);
});

test("awards precision only to a player drop hitting its original target", () => {
  assert.match(gameSource, /data\.dropId <= 0/);
  assert.match(gameSource, /precisionTargetId: null/);
  assert.match(gameSource, /firstData\.precisionTargetId === secondData\.id/);
  assert.match(gameSource, /secondData\.precisionTargetId === firstData\.id/);
  assert.equal(gameSource.includes("firstData.precise || secondData.precise"), false);
});

test("preserves a live engine across BFCache navigation", () => {
  assert.match(gameSource, /window\.addEventListener\("pagehide", \(event\) =>/);
  assert.match(gameSource, /if \(event\.persisted\)/);
  assert.match(gameSource, /window\.addEventListener\("pageshow", \(event\) =>/);
  assert.match(gameSource, /if \(!event\.persisted \|\| destroyed\) return/);
  assert.match(gameSource, /function destroyGame\(\)/);
});
