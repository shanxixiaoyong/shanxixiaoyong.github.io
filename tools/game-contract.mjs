export const SOLE_GAME_PAGE = "game-2048.html";

export const ACTIVE_PUBLIC_HTML_FILES = [
  "index.html",
  "home.html",
  "knowledge.html",
  "tools.html",
  "games.html",
  SOLE_GAME_PAGE
];

export const ACTIVE_PUBLIC_JS_FILES = [
  "assets/world.js",
  "assets/portal.js",
  "assets/academic.js",
  "assets/games.js",
  "assets/love-2048-engine.js",
  "assets/love-2048-vfx.js"
];

export const ACTIVE_PUBLIC_STYLE_FILES = [
  "assets/world.css",
  "assets/portal.css"
];

export const ACTIVE_PUBLIC_FILES = [
  ...ACTIVE_PUBLIC_HTML_FILES,
  ...ACTIVE_PUBLIC_JS_FILES,
  ...ACTIVE_PUBLIC_STYLE_FILES
];

export const LEGACY_GAMES = [
  { file: "game-tetris.html", title: "熔炉方块", runtime: "runTetris", asset: "assets/game-art/tetris-forge-ui.jpg" },
  { file: "game-mines.html", title: "声呐扫雷", runtime: "runMines", asset: "assets/game-art/sonar-mines-ui.jpg" },
  { file: "game-sudoku.html", title: "墨格数独", runtime: "runSudoku", asset: "assets/game-art/ink-sudoku-ui.jpg" },
  { file: "game-snake.html", title: "霓虹列车", runtime: "runSnake", asset: "assets/game-art/neon-snake-ui.jpg" },
  { file: "game-bubble.html", title: "潮汐泡泡", runtime: "runBubble", asset: "assets/game-art/tide-bubble-ui.jpg" },
  { file: "game-suika.html", title: "重力果园", runtime: "runSuika", asset: "assets/game-art/orchard-suika-ui.jpg" },
  { file: "game-jump.html", title: "月面跳台", runtime: "runJump", asset: "assets/game-art/lunar-jump-ui.jpg" },
  { file: "game-tower.html", title: "峡谷塔防", runtime: "runTower", asset: "assets/game-art/canyon-tower-ui.jpg" },
  { file: "game-cards.html", title: "星舰卡牌", runtime: "runCards", asset: "assets/game-art/starship-cards-ui.jpg" }
];

export const LEGACY_LOBBY_COPY = [
  "十个独立游戏页面",
  "十款游戏",
  "游戏厅",
  "选择一局进入",
  "游戏列表",
  "Game Lobby",
  "每个游戏都有自己的页面",
  "游戏直达",
  "直接进入游戏"
];

const OLD_PUBLIC_NAMES = ["桃花心动 2048", "桃花心动2048", "心动 2048"];

export function stripHtmlComments(source) {
  return String(source || "").replace(/<!--[\s\S]*?-->/g, "");
}

export function readGameContractSources(readText) {
  return Object.fromEntries(ACTIVE_PUBLIC_FILES.map((file) => {
    try {
      return [file, readText(file)];
    } catch {
      return [file, ""];
    }
  }));
}

export function validateSingleGameContract({ sources, exists = () => false }) {
  const failures = [];
  const source = (file) => String(sources[file] || "");

  for (const file of ACTIVE_PUBLIC_FILES) {
    if (!source(file)) failures.push(`Active public surface is missing or empty: ${file}`);
  }

  const htmlSources = Object.fromEntries(ACTIVE_PUBLIC_HTML_FILES.map((file) => [file, stripHtmlComments(source(file))]));
  const indexHtml = htmlSources["index.html"];
  const redirectHtml = htmlSources["games.html"];
  const gameHtml = htmlSources[SOLE_GAME_PAGE];
  const gamesScript = source("assets/games.js");
  const activePublicSurface = [
    ...ACTIVE_PUBLIC_HTML_FILES.map((file) => htmlSources[file]),
    ...ACTIVE_PUBLIC_JS_FILES.map(source),
    ...ACTIVE_PUBLIC_STYLE_FILES.map(source)
  ].join("\n");

  const homepageGameLinks = [...indexHtml.matchAll(/href="(game-[^"]+\.html)"/g)].map((match) => match[1]);
  if (JSON.stringify(homepageGameLinks) !== JSON.stringify([SOLE_GAME_PAGE])) {
    failures.push(`Homepage must expose exactly one direct game link: ${JSON.stringify(homepageGameLinks)}`);
  }
  if (!indexHtml.includes('<a class="portal-door portal-game" href="game-2048.html"')) {
    failures.push("Homepage game portal must point directly to game-2048.html outside comments");
  }
  if (!indexHtml.includes("<strong>心动2048</strong>")) {
    failures.push("Homepage game portal must display the exact name 心动2048 outside comments");
  }

  for (const token of [
    '<meta http-equiv="refresh" content="0; url=game-2048.html">',
    '<link rel="canonical" href="game-2048.html">',
    '<a href="game-2048.html">心动2048</a>'
  ]) {
    if (!redirectHtml.includes(token)) failures.push(`games.html redirect missing active markup: ${token}`);
  }
  if (redirectHtml.includes('id="game-board"') || redirectHtml.includes("game-lobby-page")) {
    failures.push("games.html must be an immediate redirect, not a game lobby or playable page");
  }

  for (const token of [
    "<title>心动2048 - 刘勇 / Yong Liu</title>",
    'content="心动2048：',
    'aria-label="心动2048"',
    '<h1 id="game-title">心动2048</h1>',
    '<a class="solo-back" href="index.html">首页</a>',
    'class="solo-game-page',
    'id="solo-game"',
    'data-game="merge2048"'
  ]) {
    if (!gameHtml.includes(token)) failures.push(`心动2048 page missing exact contract: ${token}`);
  }

  const registryEntries = gamesScript.match(/\bid:\s*"/g) || [];
  const runtimeFunctions = gamesScript.match(/\bfunction run\w*\s*\(/g) || [];
  if (registryEntries.length !== 1 || runtimeFunctions.length !== 1
      || !gamesScript.includes('name: "心动2048"') || !gamesScript.includes("function run2048()")) {
    failures.push("Game registry and executable runtime must contain only 心动2048");
  }

  for (const oldName of OLD_PUBLIC_NAMES) {
    if (activePublicSurface.includes(oldName)) failures.push(`Legacy game name still public: ${oldName}`);
  }
  for (const copy of LEGACY_LOBBY_COPY) {
    if (activePublicSurface.includes(copy)) failures.push(`Legacy multi-game or lobby copy still public: ${copy}`);
  }
  for (const legacy of LEGACY_GAMES) {
    const relativeAsset = legacy.asset.replace(/^assets\//, "");
    if (exists(legacy.file)) failures.push(`Legacy game page still exists: ${legacy.file}`);
    if (exists(legacy.asset)) failures.push(`Legacy game art still exists: ${legacy.asset}`);
    if (activePublicSurface.includes(legacy.file)) failures.push(`Legacy game link still public: ${legacy.file}`);
    if (activePublicSurface.includes(legacy.asset) || activePublicSurface.includes(relativeAsset)) {
      failures.push(`Legacy game art still referenced: ${legacy.asset}`);
    }
    if (activePublicSurface.includes(legacy.title)) failures.push(`Legacy game title still public: ${legacy.title}`);
    if (activePublicSurface.includes(legacy.runtime)) failures.push(`Legacy game runtime still public: ${legacy.runtime}`);
  }

  return failures;
}
