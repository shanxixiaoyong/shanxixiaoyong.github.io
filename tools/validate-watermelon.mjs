import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";
import {
  readGameContractSources,
  stripHtmlComments,
  validateTwoGameContract
} from "./game-contract.mjs";

const paths = {
  html: "game-watermelon.html",
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
  if (!existsSync(file) || !readOptional(file)) failures.push(`Missing or empty Watermelon public file: ${file}`);
}

const gameContractSources = readGameContractSources((file) => readFileSync(file, "utf8"));
for (const failure of validateTwoGameContract({ sources: gameContractSources, exists: existsSync })) {
  failures.push(`Two-game site contract: ${failure}`);
}

const exactHtmlTokens = [
  "<title>合成大西瓜 - 刘勇 / Yong Liu</title>",
  '<meta name="description" content="合成大西瓜：',
  '<main class="wm-app" id="watermelon-game" aria-label="合成大西瓜">',
  "<h1>合成大西瓜</h1>",
  '<a class="wm-icon wm-back" href="index.html"',
  '<canvas id="wm-canvas"',
  'id="wm-cinematic"',
  "长按催熟"
];

for (const token of exactHtmlTokens) {
  if (!activeHtml.includes(token)) failures.push(`Watermelon HTML missing exact public contract: ${token}`);
}

const resourcePath = (value) => value.split(/[?#]/, 1)[0];
const scripts = [...activeHtml.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]
  .map((match) => resourcePath(match[1]));
const expectedScripts = [paths.matter, paths.rules, paths.game];
if (JSON.stringify(scripts) !== JSON.stringify(expectedScripts)) {
  failures.push(`Watermelon scripts must be exactly local and ordered Matter, rules, game: ${JSON.stringify(scripts)}`);
}

const styles = [...activeHtml.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g)]
  .map((match) => resourcePath(match[1]));
if (JSON.stringify(styles) !== JSON.stringify([paths.css])) {
  failures.push(`Watermelon must load exactly its local stylesheet: ${JSON.stringify(styles)}`);
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
    failures.push(`Watermelon rules module could not be evaluated: ${error.message}`);
    return null;
  }
  const api = sandbox.WatermelonRules;
  if (!api || typeof api !== "object") {
    failures.push("Watermelon rules module must expose window.WatermelonRules");
    return null;
  }
  return api;
}

const rules = evaluateRules(files.rules);
const tierCount = Array.isArray(rules?.FRUITS) ? rules.FRUITS.length : 0;
if (tierCount !== 11) failures.push(`Watermelon rules must expose exactly 11 fruit tiers, found ${tierCount}`);
if (rules?.RULES?.title !== "合成大西瓜") failures.push("Watermelon rules must use the exact public name 合成大西瓜");

if (rules) {
  try {
    let scoreState = rules.createScoreState();
    for (let index = 0; index < 3; index += 1) {
      const merge = rules.parseSnapshot(JSON.stringify({
        tier: 0,
        timestamp: index * 100,
        marks: ["rose", "star"]
      }));
      scoreState = rules.scoreMerge(scoreState, merge).state;
    }
    const ripened = rules.ripenCurrent(scoreState, 0, true);
    if (!ripened.ripened || ripened.tier !== 1 || ripened.spentPips !== 3 || ripened.state.heartPips !== 0) {
      failures.push("Three charged hearts and a long press must ripen the current fruit by one tier");
    }

    const harvestMerge = rules.parseSnapshot(JSON.stringify({ tier: 10, timestamp: 0 }));
    const harvest = rules.scoreMerge(rules.createScoreState(), harvestMerge);
    if (!harvest.harvest || harvest.resultTier !== null || !(harvest.points > 0)) {
      failures.push("A matching top-tier pair must harvest for points instead of creating a twelfth tier");
    }
  } catch (error) {
    failures.push(`Watermelon rules behavior contract failed: ${error.message}`);
  }
}

const matterContracts = [
  ["creates a Matter engine", /\bEngine\.create\s*\(/],
  ["creates circular Matter bodies", /\bBodies\.circle\s*\(/],
  ["adds bodies to the Matter world", /\b(?:Composite|World)\.add\s*\(/],
  ["handles Matter collision pairs", /\bcollisionStart\b/]
];
for (const [label, pattern] of matterContracts) {
  if (!pattern.test(files.game)) failures.push(`Watermelon game ${label}`);
}

const hasPointerFlow = ["pointerdown", "pointermove", "pointerup"].every((event) => files.game.includes(event));
const hasTouchFlow = ["touchstart", "touchmove", "touchend"].every((event) => files.game.includes(event));
if (!hasPointerFlow && !hasTouchFlow) {
  failures.push("Watermelon canvas must implement a complete pointer or touch input flow");
}
if (!files.css.includes("touch-action: none")) {
  failures.push("Watermelon canvas stylesheet must reserve touch gestures for play");
}
if (!/\b(?:getContext\s*\(\s*["']2d["']|Render\.create\s*\()/.test(files.game)) {
  failures.push("Watermelon game must render through its canvas");
}

const customRuntime = `${files.rules}\n${files.game}`;
const runtimeContracts = [
  ["rules module wiring", /\bWatermelonRules\b/],
  ["long-press interaction", /(?:long.?press|press(?:Timer|Start|Duration|Threshold)|hold(?:Timer|Start|Duration))/i],
  ["heart resource", /heart/i],
  ["fruit ripening", /\bripenCurrent\b/],
  ["pair scoring", /\bscoreMerge\b/],
  ["pair harvest", /harvest/i]
];
for (const [label, pattern] of runtimeContracts) {
  if (!pattern.test(files.game)) failures.push(`Watermelon runtime missing ${label} contract`);
}

const heartIcons = activeHtml.match(/<div id="wm-hearts"[^>]*>([\s\S]*?)<\/div>/)?.[1].match(/<i><\/i>/g) || [];
if (heartIcons.length !== 3) failures.push(`Watermelon ripening control must expose exactly three hearts, found ${heartIcons.length}`);

for (const [label, source, token] of [
  ["HTML", activeHtml, 'id="wm-cinematic"'],
  ["CSS", files.css, ".wm-cinematic"],
  ["runtime", files.game, "cinematic"]
]) {
  if (!source.toLowerCase().includes(token.toLowerCase())) failures.push(`Watermelon cinematic missing from ${label}`);
}

const ownedSources = [
  [paths.html, activeHtml],
  [paths.rules, files.rules],
  [paths.game, files.game],
  [paths.css, files.css]
];
for (const [file, source] of ownedSources) {
  if (/https?:\/\//i.test(source) || /["'`]\/\/[a-z0-9]/i.test(source)) {
    failures.push(`Watermelon public source must not contain an external URL: ${file}`);
  }
}

for (const reference of activeHtml.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
  const value = reference[1];
  if (/^(?:[a-z]+:)?\/\//i.test(value) || /^[a-z][a-z0-9+.-]*:/i.test(value)) {
    failures.push(`Watermelon page resource must be local: ${value}`);
  }
}

for (const [label, pattern] of [
  ["fetch", /\bfetch\s*\(/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["WebSocket", /\bWebSocket\b/],
  ["EventSource", /\bEventSource\b/],
  ["sendBeacon", /\bsendBeacon\s*\(/]
]) {
  if (pattern.test(customRuntime)) failures.push(`Watermelon static runtime must not use ${label}`);
}
if (/\@import\b/i.test(files.css)) failures.push("Watermelon stylesheet must not import remote or runtime CSS");

if (failures.length) {
  console.error("Watermelon validation failed:");
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Watermelon validation passed");
