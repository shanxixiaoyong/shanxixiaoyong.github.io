import { existsSync, readFileSync } from "node:fs";

function readOptional(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

const files = {
  html: readFileSync("game-2048.html", "utf8"),
  index: readFileSync("index.html", "utf8"),
  redirect: readFileSync("games.html", "utf8"),
  js: readFileSync("assets/games.js", "utf8"),
  css: readFileSync("assets/world.css", "utf8"),
  loveCss: readOptional("assets/love-2048.css"),
  vfx: readOptional("assets/love-2048-vfx.js"),
  siteValidator: readFileSync("tools/validate-site.mjs", "utf8")
};

const expectations = [
  ["HTML page title uses exact public name", files.html, "<title>心动2048 - 刘勇 / Yong Liu</title>"],
  ["HTML description uses exact public name", files.html, 'content="心动2048：'],
  ["HTML ARIA uses exact public name", files.html, 'aria-label="心动2048"'],
  ["HTML heading uses exact public name", files.html, '<h1 id="game-title">心动2048</h1>'],
  ["HTML page description matches love theme", files.html, "爱心、情侣、桃花"],
  ["HTML loads dedicated Love 2048 CSS", files.html, "assets/love-2048.css"],
  ["HTML loads Love 2048 VFX before games", files.html, "assets/love-2048-vfx.js"],
  ["HTML uses the smooth-motion cache version", files.html, "love-20260710g"],
  ["Game registry uses love theme id", files.js, 'theme: "love-2048"'],
  ["Game registry uses love board class", files.js, 'boardClass: "board-love-2048"'],
  ["Game registry uses exact public name", files.js, 'name: "心动2048"'],
  ["2048 keeps pure tile state", files.js, "let tiles = []"],
  ["2048 tracks best relationship value", files.js, "let bestValue = 2"],
  ["2048 tracks seen relationship stages", files.js, "let seenStageValues = new Set"],
  ["2048 stores current narrative scene", files.js, "let currentScene = null"],
  ["2048 stores story log", files.js, "let storyLog = []"],
  ["2048 defines narrative scene pools", files.js, "const narrativeScenes"],
  ["2048 spawns from top first", files.js, "function addFromTop"],
  ["2048 handles blocked-input spawning", files.js, "spawnOnBlockedInput"],
  ["2048 tracks stage celebration timer", files.js, "let stageCelebrationTimer = 0"],
  ["2048 initializes dedicated visual effects", files.js, "Love2048Vfx.createLoveVfx"],
  ["2048 disables continuous ambient VFX", files.js, "ambient: false"],
  ["2048 identifies its board before shared effects", files.js, 'const isLoveBoard = board.classList.contains("board-love-2048")'],
  ["2048 caps transient board effects", files.js, "isLoveBoard ? 4"],
  ["2048 skips shared board pulse reflows", files.js, "if (!isLoveBoard)"],
  ["2048 plays real tile motion", files.js, "function playTileMotion"],
  ["2048 keeps persistent board cells", files.js, "function ensureBoardCells"],
  ["2048 updates persistent board cells", files.js, "function renderBoardCells"],
  ["2048 chooses scenes only for milestones", files.js, "function pickMilestoneScene"],
  ["2048 derives event backdrop keys", files.js, "function sceneBackdropKey"],
  ["2048 shows milestone full-screen events", files.js, "function playMilestoneScene"],
  ["2048 keeps repeated merges lightweight", files.js, "function playRepeatMerge"],
  ["2048 detects first higher-stage reveal", files.js, "isFirstStageReveal"],
  ["2048 gates cinematics to a new highest stage", files.js, "featured.nextValue > bestValue && !seenStageValues.has(featured.nextValue)"],
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
  ["2048 picks random milestone scenes", files.js, "function pickMilestoneScene"],
  ["2048 applies mood classes", files.js, "function applyMood"],
  ["2048 renders story card", files.js, "function renderStoryCard"],
  ["2048 story card shows current highest only", files.js, "当前最高 "],
  ["2048 toggles memory log", files.js, "function toggleMemory"],
  ["2048 delegates five-cell line slides to the engine", files.js, "engine.slideLine(orientedIndices.map((idx) => tiles[idx]), size)"],
  ["2048 emits lightweight repeat merge effect", files.js, 'triggerCellEffect("love-merge"'],
  ["2048 keeps restart button", files.js, 'button("重遇"'],
  ["2048 keeps memory button", files.js, 'button("回忆"'],
  ["2048 renders svg heart core", files.js, '<svg class="heart-core"'],
  ["2048 renders heart bevel layer", files.js, "heart-bevel"],
  ["2048 renders tile glyph crest", files.js, "tile-glyph"],
  ["2048 renders prominent tile number", files.js, "tile-number"],
  ["2048 renders compact tile label", files.js, "tile-label"],
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
  ["Dedicated CSS defines mobile game surface", files.loveCss, ".solo-game-2048"],
  ["Dedicated CSS defines jewel heart model", files.loveCss, ".heart-bevel"],
  ["Dedicated CSS defines movement ghosts", files.loveCss, ".love-motion-ghost"],
  ["Dedicated CSS defines cinematic scene", files.loveCss, ".love-cinematic-scene"],
  ["Dedicated CSS defines cinematic backdrop", files.loveCss, ".cinematic-backdrop"],
  ["Dedicated CSS defines full cinematic narrative", files.loveCss, ".cinematic-copy p"],
  ["Dedicated CSS maps rainy backdrop", files.loveCss, 'data-backdrop="rain"'],
  ["Dedicated CSS maps cafe backdrop", files.loveCss, 'data-backdrop="cafe"'],
  ["Dedicated CSS maps campus backdrop", files.loveCss, 'data-backdrop="campus"'],
  ["Dedicated CSS maps city backdrop", files.loveCss, 'data-backdrop="city"'],
  ["Dedicated CSS maps home backdrop", files.loveCss, 'data-backdrop="home"'],
  ["Dedicated CSS maps starlight backdrop", files.loveCss, 'data-backdrop="starlight"'],
  ["Dedicated CSS defines repeat merge sparkle", files.loveCss, ".effect-love-merge"],
  ["Dedicated CSS uses short tile travel", files.loveCss, "loveGhostTravel 150ms"],
  ["Dedicated CSS uses short collision feedback", files.loveCss, "loveJewelMerge 220ms"],
  ["Dedicated CSS disables inherited new-cell animation", files.loveCss, ".merge-cell.is-new {\n  animation: none;"],
  ["Dedicated CSS honors reduced motion", files.loveCss, "prefers-reduced-motion"],
  ["VFX module exposes Love2048Vfx", files.vfx, "window.Love2048Vfx"],
  ["VFX module creates one canvas engine", files.vfx, "function createLoveVfx"],
  ["VFX module makes ambient particles opt-in", files.vfx, "const ambientEnabled = options.ambient === true"],
  ["VFX module changes scene mood", files.vfx, "setMood"],
  ["VFX module emits local bursts", files.vfx, "burst"],
  ["VFX module emits stage celebrations", files.vfx, "celebrate"],
  ["VFX module cleans up", files.vfx, "destroy"],
  ["Site validator tracks love theme", files.siteValidator, 'theme: "love-2048"'],
  ["Site validator tracks love board", files.siteValidator, 'board: "board-love-2048"']
];

for (const forbidden of [
  ["Public pages remove old 桃花-prefixed name", `${files.index}\n${files.redirect}\n${files.html}\n${files.js}`, "桃花心动 2048"],
  ["Public pages remove old unspaced 桃花-prefixed name", `${files.index}\n${files.redirect}\n${files.html}\n${files.js}`, "桃花心动2048"],
  ["Public pages remove spaced public name", `${files.index}\n${files.redirect}\n${files.html}\n${files.js}`, "心动 2048"],
  ["2048 removes scene bloom", files.js, "function showSceneBloom"],
  ["2048 removes scene danmaku", files.js, "function showSceneDanmaku"],
  ["2048 removes repeat-memory rewriting", files.js, "function rememberScene"],
  ["2048 removes per-move swipe trace", files.js, "showSwipeTrace(dir)"],
  ["2048 removes per-frame board tilt feedback", files.js, "function enableLoveTouchFeedback"],
  ["2048 removes redundant top-spawn board effects", files.js, 'triggerCellEffect("love-top-spawn"'],
  ["2048 removes touch feedback timer", files.js, "touchFeedbackTimer"],
  ["2048 removes touch animation frame loop", files.js, "touchFrame"],
  ["2048 removes obsolete animation tempo state", files.js, "loveTempo"],
  ["2048 removes obsolete accelerated board state", files.js, "is-accelerated"],
  ["2048 stops writing obsolete tempo variable", files.js, 'setProperty("--tempo"'],
  ["2048 stops writing obsolete movement x variable", files.js, 'setProperty("--move-x"'],
  ["2048 stops writing obsolete movement y variable", files.js, 'setProperty("--move-y"'],
  ["CSS removes dynamic touch x coordinate", files.loveCss, "--touch-x"],
  ["CSS removes dynamic touch y coordinate", files.loveCss, "--touch-y"],
  ["CSS removes dynamic board x tilt", files.loveCss, "--drag-x"],
  ["CSS removes dynamic board y tilt", files.loveCss, "--drag-y"],
  ["CSS removes obsolete movement x variable", files.loveCss, "--move-x"],
  ["CSS removes obsolete movement y variable", files.loveCss, "--move-y"],
  ["CSS removes whole-board release filter", files.loveCss, ".is-touch-release"],
  ["CSS removes whole-board release keyframes", files.loveCss, "loveBoardRelease"],
  ["CSS removes per-tile large blur", files.loveCss, "filter: blur(14px)"],
  ["CSS removes motion-heart drop shadow", files.loveCss, "filter: drop-shadow(0 5px 7px"],
  ["CSS removes merge filter animation", files.loveCss, "filter: brightness(1.34) saturate(1.16)"],
  ["2048 removes danmaku CSS", files.loveCss, ".love-scene-danmaku"]
]) {
  expectations.push([forbidden[0], forbidden[1], forbidden[2], true]);
}

const failures = expectations.filter(([, source, needle, forbidden]) => forbidden ? source.includes(needle) : !source.includes(needle));

if (failures.length) {
  console.error("Love 2048 validation failed:");
  for (const [label, , needle, forbidden] of failures) {
    console.error(`- ${label}: ${forbidden ? "still has" : "missing"} ${JSON.stringify(needle)}`);
  }
  process.exit(1);
}

function functionSource(name) {
  const start = files.js.indexOf(`function ${name}`);
  if (start === -1) return "";
  const next = files.js.indexOf("\n    function ", start + 1);
  return files.js.slice(start, next === -1 ? files.js.length : next);
}

function run2048FunctionSource(name) {
  const scopeStart = files.js.indexOf("  function run2048() {");
  const scope = files.js.slice(scopeStart);
  const start = scope.indexOf(`    function ${name}`);
  if (start === -1) return "";
  const next = scope.indexOf("\n    function ", start + 1);
  return scope.slice(start, next === -1 ? scope.length : next);
}

const legacyGames = [
  { file: "game-tetris.html", title: "熔炉方块", runtime: "runTetris" },
  { file: "game-mines.html", title: "声呐扫雷", runtime: "runMines" },
  { file: "game-sudoku.html", title: "墨格数独", runtime: "runSudoku" },
  { file: "game-snake.html", title: "霓虹列车", runtime: "runSnake" },
  { file: "game-bubble.html", title: "潮汐泡泡", runtime: "runBubble" },
  { file: "game-suika.html", title: "重力果园", runtime: "runSuika" },
  { file: "game-jump.html", title: "月面跳台", runtime: "runJump" },
  { file: "game-tower.html", title: "峡谷塔防", runtime: "runTower" },
  { file: "game-cards.html", title: "星舰卡牌", runtime: "runCards" }
];

const publicGameSurface = `${files.index}\n${files.redirect}\n${files.html}\n${files.js}`;
for (const legacy of legacyGames) {
  if (existsSync(legacy.file) || publicGameSurface.includes(legacy.file)
      || publicGameSurface.includes(legacy.title) || files.js.includes(legacy.runtime)) {
    console.error(`Legacy game surface still present: ${legacy.file} / ${legacy.title} / ${legacy.runtime}`);
    process.exit(1);
  }
}

function validateBackdropRouting() {
  const source = functionSource("sceneBackdropKey").trim();
  if (!source) return ["sceneBackdropKey source is missing"];
  let sceneBackdropKey;
  try {
    sceneBackdropKey = Function(`return (${source});`)();
  } catch (error) {
    return [`sceneBackdropKey could not be evaluated: ${error.message}`];
  }
  const cases = [
    [{ title: "雨夜电话", mood: "chat" }, "rain"],
    [{ title: "第一次晚餐", mood: "date" }, "cafe"],
    [{ title: "图书馆相遇", mood: "meet" }, "campus"],
    [{ title: "厨房日常", mood: "home" }, "home"],
    [{ title: "未来誓言", mood: "vow" }, "starlight"],
    [{ title: "路口重逢", mood: "street" }, "city"]
  ];
  return cases.flatMap(([scene, expected]) => {
    const actual = sceneBackdropKey(scene);
    return actual === expected ? [] : [`${scene.title} routed to ${actual}, expected ${expected}`];
  });
}

const backdropRoutingFailures = validateBackdropRouting();
if (backdropRoutingFailures.length) {
  console.error("Love 2048 backdrop routing validation failed:");
  for (const failure of backdropRoutingFailures) console.error(`- ${failure}`);
  process.exit(1);
}

const milestoneSceneSource = functionSource("playMilestoneScene");
if (!milestoneSceneSource.includes("scene.line") || !milestoneSceneSource.includes("data-backdrop")) {
  console.error("Love 2048 milestone cinematic validation failed:");
  console.error("- playMilestoneScene must render scene.line and a data-backdrop key");
  process.exit(1);
}

const repeatMergeSource = functionSource("playRepeatMerge");
for (const forbidden of ["scene.line", "pushStory", "pickMilestoneScene", "love-cinematic-scene", "loveVfx.burst"]) {
  if (repeatMergeSource.includes(forbidden)) {
    console.error(`Love 2048 repeated merge validation failed: playRepeatMerge contains ${forbidden}`);
    process.exit(1);
  }
}

const renderSource = run2048FunctionSource("render");
if (renderSource.includes("board.innerHTML")) {
  console.error("Love 2048 performance validation failed: render still replaces board.innerHTML");
  process.exit(1);
}

const tileMotionSource = run2048FunctionSource("playTileMotion");
if (!tileMotionSource.includes("window.setTimeout(() => layer.remove(), 190)")) {
  console.error("Love 2048 motion lifetime validation failed:");
  console.error("- playTileMotion must clean up the lightweight layer after 190ms");
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
