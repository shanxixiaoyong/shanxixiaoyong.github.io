import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";
import {
  GAME_CONTRACTS,
  WATERMELON_GAME_PAGE,
  readGameContractSources,
  stripHtmlComments,
  validateFiveGameContract
} from "./game-contract.mjs";

const paths = {
  html: WATERMELON_GAME_PAGE,
  matter: "assets/vendor/matter-0.20.0.min.js",
  rules: "assets/watermelon-rules.js",
  game: "assets/watermelon-game.js",
  css: "assets/watermelon.css"
};

function readOptional(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

const files = Object.fromEntries(Object.entries(paths).map(([key, file]) => [key, readOptional(file)]));
const activeHtml = stripHtmlComments(files.html);
const failures = [];

for (const file of Object.values(paths)) {
  if (!existsSync(file) || !readOptional(file)) failures.push(`Missing or empty Heartmelon public file: ${file}`);
}

const contractSources = readGameContractSources((file) => readFileSync(file, "utf8"));
for (const failure of validateFiveGameContract({ sources: contractSources, exists: existsSync })) {
  failures.push(`Five-game site contract: ${failure}`);
}

for (const token of [
  "<title>心动大西瓜 - 刘勇 / Yong Liu</title>",
  '<meta name="description" content="心动大西瓜：',
  '<main class="wm-app" id="watermelon-game" aria-label="心动大西瓜">',
  "<h1>心动大西瓜</h1>",
  '<a class="wm-icon wm-back" href="index.html"',
  '<canvas id="wm-canvas"',
  'id="wm-courage"',
  'id="wm-cinematic"',
  'id="wm-event-canvas"'
]) {
  if (!activeHtml.includes(token)) failures.push(`Heartmelon HTML missing contract: ${token}`);
}

const contract = GAME_CONTRACTS.find(({ file }) => file === WATERMELON_GAME_PAGE);
const resourcePath = (value) => value.split(/[?#]/, 1)[0];
const scripts = [...activeHtml.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]
  .map((match) => resourcePath(match[1]));
const styles = [...activeHtml.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g)]
  .map((match) => resourcePath(match[1]));
if (JSON.stringify(scripts) !== JSON.stringify(contract.scripts)) {
  failures.push(`Heartmelon scripts are not exact and ordered: ${JSON.stringify(scripts)}`);
}
if (JSON.stringify(styles) !== JSON.stringify(contract.styles)) {
  failures.push(`Heartmelon styles are not exact and ordered: ${JSON.stringify(styles)}`);
}

if (!files.matter.includes("matter-js 0.20.0") || !files.matter.includes("Matter")) {
  failures.push("Local Matter dependency must be the browser build of matter-js 0.20.0");
}

function evaluateRules(source) {
  if (!source) return null;
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  try {
    vm.runInNewContext(source, sandbox, { timeout: 1000 });
  } catch (error) {
    failures.push(`Heartmelon rules module could not be evaluated: ${error.message}`);
    return null;
  }
  if (!sandbox.WatermelonRules || typeof sandbox.WatermelonRules !== "object") {
    failures.push("Heartmelon rules module must expose window.WatermelonRules");
    return null;
  }
  return sandbox.WatermelonRules;
}

const rules = evaluateRules(files.rules);
if (rules?.RULES?.title !== "心动大西瓜") failures.push("Rules must use the exact public name 心动大西瓜");
if (!Array.isArray(rules?.MOMENTS) || rules.MOMENTS.length !== 11) {
  failures.push(`Rules must expose exactly 11 romantic moments, found ${rules?.MOMENTS?.length || 0}`);
}
if (!Array.isArray(rules?.EVENT_CATALOGS?.unlocks) || rules.EVENT_CATALOGS.unlocks.length !== 11) {
  failures.push("Every romantic moment must have a first-unlock event catalog");
}
if (!Array.isArray(rules?.EVENT_CATALOGS?.mergeRewards) || rules.EVENT_CATALOGS.mergeRewards.length !== 11) {
  failures.push("Every romantic moment must have a repeat-merge reward catalog");
}
if (!Array.isArray(rules?.EVENT_CATALOGS?.secretCombinations)
    || rules.EVENT_CATALOGS.secretCombinations.length < 5) {
  failures.push("The top-tier pair must expose at least five randomized secret combinations");
}

if (rules) {
  try {
    let state = rules.createScoreState();
    for (let index = 0; index < rules.RULES.maxCourage; index += 1) {
      const merge = rules.parseSnapshot(JSON.stringify({
        tier: 0,
        timestamp: index * 100,
        marks: ["self", "echo"]
      }));
      state = rules.scoreMerge(state, merge).state;
    }
    const advanced = rules.useCourage(state, 3, true);
    if (!advanced.advanced || advanced.tier !== 4 || advanced.state.courage !== 0) {
      failures.push("Three mutual responses and a long press must advance one early moment");
    }
    const secretMerge = rules.parseSnapshot(JSON.stringify({ tier: 10, timestamp: 0 }));
    const secret = rules.scoreMerge(rules.createScoreState(), secretMerge);
    if (!secret.secretCombination || secret.resultTier !== null || !(secret.points > 0)) {
      failures.push("A matching top-tier pair must resolve into a scored secret combination");
    }
  } catch (error) {
    failures.push(`Heartmelon rules behavior contract failed: ${error.message}`);
  }
}

for (const [label, pattern] of [
  ["Matter engine", /\bEngine\.create\s*\(/],
  ["circular Matter bodies", /\bBodies\.circle\s*\(/],
  ["Matter world insertion", /\bComposite\.add\s*\(/],
  ["Matter collision handling", /\bcollisionStart\b/],
  ["semantic moment drawing", /function drawMomentAt\s*\(/],
  ["first-unlock selection", /rules\.pickUnlockEvent\(/],
  ["lightweight repeat selection", /rules\.pickMergeReward\(/],
  ["secret combination selection", /rules\.pickSecretCombination\(/],
  ["courage long press", /rules\.useCourage\(/],
  ["adaptive audio", /function syncAdaptiveAudio\s*\(/],
  ["fixed-step animation", /requestAnimationFrame\(tick\)/]
]) {
  if (!pattern.test(files.game)) failures.push(`Heartmelon runtime missing ${label}`);
}

if (!["pointerdown", "pointermove", "pointerup"].every((event) => files.game.includes(event))) {
  failures.push("Heartmelon canvas must implement a complete pointer gesture flow");
}
if (!files.css.includes("touch-action: none") || !files.css.includes("prefers-reduced-motion")) {
  failures.push("Heartmelon stylesheet must own touch gestures and reduced motion");
}
for (const performance of [
  "glance", "chat", "approach", "earbuds", "ticket", "photo",
  "hands", "embrace", "confession", "memory"
]) {
  if (!files.css.includes(`[data-performance="${performance}"]`)) {
    failures.push(`Heartmelon cinematic styling missing ${performance}`);
  }
}
if (!files.css.includes('[data-performance^="secret"]')) {
  failures.push("Heartmelon cinematic styling missing secret performances");
}

const ownedSources = [files.html, files.rules, files.game, files.css].join("\n");
for (const [label, pattern] of [
  ["fetch", /\bfetch\s*\(/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["WebSocket", /\bWebSocket\b/],
  ["EventSource", /\bEventSource\b/],
  ["sendBeacon", /\bsendBeacon\s*\(/]
]) {
  if (pattern.test(ownedSources)) failures.push(`Heartmelon static runtime must not use ${label}`);
}
if (/@import\b/i.test(files.css)) failures.push("Heartmelon stylesheet must not import runtime CSS");

if (failures.length) {
  console.error("Heartmelon validation failed:");
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Heartmelon validation passed");
