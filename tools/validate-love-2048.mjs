import { readFileSync } from "node:fs";

const files = {
  html: readFileSync("game-2048.html", "utf8"),
  js: readFileSync("assets/games.js", "utf8"),
  css: readFileSync("assets/world.css", "utf8"),
  siteValidator: readFileSync("tools/validate-site.mjs", "utf8")
};

const expectations = [
  ["HTML page title is romantic 2048", files.html, "桃花心动 2048"],
  ["HTML page description matches love theme", files.html, "爱心、情侣、桃花"],
  ["Game registry uses love theme id", files.js, 'theme: "love-2048"'],
  ["Game registry uses love board class", files.js, 'boardClass: "board-love-2048"'],
  ["2048 keeps pure tile state", files.js, "let tiles = []"],
  ["2048 tracks best relationship value", files.js, "let bestValue = 2"],
  ["2048 tracks seen relationship stages", files.js, "let seenStageValues = new Set"],
  ["2048 stores current narrative scene", files.js, "let currentScene = null"],
  ["2048 stores story log", files.js, "let storyLog = []"],
  ["2048 defines narrative scene pools", files.js, "const narrativeScenes"],
  ["2048 spawns from top first", files.js, "function addFromTop"],
  ["2048 handles blocked-input spawning", files.js, "spawnOnBlockedInput"],
  ["2048 tracks scene bloom timer", files.js, "let sceneBloomTimer = 0"],
  ["2048 tracks stage celebration timer", files.js, "let stageCelebrationTimer = 0"],
  ["2048 shows centered scene text bloom", files.js, "function showSceneBloom"],
  ["2048 shows first-stage full-screen celebration", files.js, "function showStageCelebration"],
  ["2048 rewrites repeat stages as memories", files.js, "function rememberScene"],
  ["2048 detects first higher-stage reveal", files.js, "isFirstStageReveal"],
  ["2048 includes first-meet scene pool", files.js, '"初见"'],
  ["2048 includes remember stage", files.js, '"记住"'],
  ["2048 includes testing stage", files.js, '"试探"'],
  ["2048 includes confession-eve stage", files.js, '"告白前夜"'],
  ["2048 includes stable relationship stage", files.js, '"稳定相处"'],
  ["2048 includes marriage discussion stage", files.js, '"谈及婚姻"'],
  ["2048 includes proposal stage", files.js, '"求婚时刻"'],
  ["2048 includes pre-wedding stage", files.js, '"婚礼之前"'],
  ["2048 includes date scene pool", files.js, '"第一次约会"'],
  ["2048 includes future scene pool", files.js, '"未来计划"'],
  ["2048 includes final stage", files.js, '"长久相爱"'],
  ["2048 keeps mutual-romance event", files.js, '"双向奔赴"'],
  ["2048 includes rainy convenience scene", files.js, "雨停便利店"],
  ["2048 includes cafe date scene", files.js, "咖啡馆"],
  ["2048 includes movie date scene", files.js, "电影散场"],
  ["2048 includes rain date scene", files.js, "雨天共享伞"],
  ["2048 includes night market date scene", files.js, "夜市灯火"],
  ["2048 includes home light scene", files.js, "家的灯"],
  ["2048 picks random merge scenes", files.js, "function pickMergeScene"],
  ["2048 applies mood classes", files.js, "function applyMood"],
  ["2048 renders story card", files.js, "function renderStoryCard"],
  ["2048 story card shows current highest only", files.js, "当前最高 "],
  ["2048 toggles memory log", files.js, "function toggleMemory"],
  ["2048 line slide is pure equal-number merge", files.js, "line.filter(Boolean)"],
  ["2048 merge selects narrative by destination value", files.js, "pickMergeScene(nextValue)"],
  ["2048 emits merge story effect", files.js, 'triggerBoardEffect("love-story"'],
  ["2048 emits merge cell effect", files.js, 'triggerCellEffect(scene.effect'],
  ["2048 keeps restart button", files.js, 'button("重遇"'],
  ["2048 keeps memory button", files.js, 'button("回忆"'],
  ["2048 renders svg heart core", files.js, '<svg class="heart-core"'],
  ["2048 renders prominent tile number", files.js, "tile-number"],
  ["2048 renders stage label", files.js, "data-romance"],
  ["2048 removed trust resource", files.js, "let trust =", true],
  ["2048 removed communication resource", files.js, "let communication =", true],
  ["2048 removed freshness resource", files.js, "let freshness =", true],
  ["2048 removed special event state", files.js, "let events = []", true],
  ["2048 removed event aging", files.js, "function ageEvents", true],
  ["2048 removed event spawning", files.js, "function spawnRelationshipEvent", true],
  ["2048 removed special pair resolution", files.js, "function resolvePair", true],
  ["2048 removed communicate action", files.js, 'button("沟通"', true],
  ["2048 removed date action", files.js, 'button("约会"', true],
  ["2048 removed vow action", files.js, 'button("誓约"', true],
  ["2048 removed chapter action", files.js, 'button("章节"', true],
  ["2048 removed duo action", files.js, 'button("双人"', true],
  ["2048 removed task action", files.js, 'button("任务"', true],
  ["2048 removed event cell markup", files.js, "event-cell", true],
  ["2048 removed dialog overlay function", files.js, "showSceneOverlay", true],
  ["2048 removed dialog overlay class", files.js, "love-scene-overlay", true],
  ["2048 removed next-target copy", files.js, "目标 ", true],
  ["CSS defines love theme tokens", files.css, ".love-2048"],
  ["CSS defines love board", files.css, ".board-love-2048"],
  ["CSS defines story card", files.css, ".love-story-card"],
  ["CSS defines memory drawer", files.css, ".love-memory-drawer"],
  ["CSS defines centered scene text bloom", files.css, ".love-scene-bloom"],
  ["CSS defines full-screen stage celebration", files.css, ".love-stage-celebration"],
  ["CSS defines mood meet", files.css, ".board-love-2048.mood-meet"],
  ["CSS defines mood chat", files.css, ".board-love-2048.mood-chat"],
  ["CSS defines mood date", files.css, ".board-love-2048.mood-date"],
  ["CSS defines mood rain", files.css, ".board-love-2048.mood-rain"],
  ["CSS defines mood home", files.css, ".board-love-2048.mood-home"],
  ["CSS defines mood starlight", files.css, ".board-love-2048.mood-starlight"],
  ["CSS defines mood campus", files.css, ".board-love-2048.mood-campus"],
  ["CSS defines mood cafe", files.css, ".board-love-2048.mood-cafe"],
  ["CSS defines mood street", files.css, ".board-love-2048.mood-street"],
  ["CSS defines mood vow", files.css, ".board-love-2048.mood-vow"],
  ["CSS defines story effect", files.css, ".effect-love-story"],
  ["CSS defines petal effect", files.css, ".effect-love-petal"],
  ["CSS defines starlight effect", files.css, ".effect-love-starlight"],
  ["CSS defines 430px mobile layout", files.css, "@media (max-width: 520px)"],
  ["CSS keeps large heart core", files.css, ".board-love-2048 .heart-core"],
  ["CSS keeps prominent tile number", files.css, ".board-love-2048 .tile-number"],
  ["CSS removed event cell styling", files.css, ".board-love-2048 .event-cell", true],
  ["CSS removed negative event styling", files.css, ".board-love-2048 .event-negative", true],
  ["CSS removed dialog overlay styling", files.css, ".love-scene-overlay", true],
  ["CSS removed dialog overlay keyframes", files.css, "loveSceneOverlay", true],
  ["Site validator tracks love theme", files.siteValidator, 'theme: "love-2048"'],
  ["Site validator tracks love board", files.siteValidator, 'board: "board-love-2048"']
];

const failures = expectations.filter(([, source, needle, forbidden]) => forbidden ? source.includes(needle) : !source.includes(needle));

if (failures.length) {
  console.error("Love 2048 validation failed:");
  for (const [label, , needle, forbidden] of failures) {
    console.error(`- ${label}: ${forbidden ? "still has" : "missing"} ${JSON.stringify(needle)}`);
  }
  process.exit(1);
}

const sceneRequirements = new Map([
  [2, 8],
  [4, 8],
  [8, 8],
  [16, 8],
  [32, 8],
  [64, 8],
  [128, 8],
  [256, 6],
  [512, 6],
  [1024, 6],
  [2048, 6],
  [4096, 4],
  [8192, 4],
  [16384, 4],
  [32768, 4],
  [65536, 4],
  [131072, 4],
  [262144, 4],
  [524288, 4],
  [1048576, 4],
  [2097152, 4],
  [4194304, 4]
]);

function countScenesFor(value) {
  const source = files.js;
  const startToken = `${value}: [`;
  const start = source.indexOf(startToken);
  if (start === -1) return 0;
  let depth = 0;
  let inString = false;
  let stringQuote = "";
  let escaped = false;
  for (let i = start + startToken.length - 1; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === stringQuote) inString = false;
      continue;
    }
    if (char === '"' || char === "'") {
      inString = true;
      stringQuote = char;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return (source.slice(start, i).match(/\{\s*title:/g) || []).length;
      }
    }
  }
  return 0;
}

const sceneFailures = [...sceneRequirements.entries()]
  .map(([value, minimum]) => [value, minimum, countScenesFor(value)])
  .filter(([, minimum, actual]) => actual < minimum);

if (sceneFailures.length) {
  console.error("Love 2048 scene density validation failed:");
  for (const [value, minimum, actual] of sceneFailures) {
    console.error(`- ${value}: expected at least ${minimum} scenes, found ${actual}`);
  }
  process.exit(1);
}

console.log("Love 2048 validation passed");
