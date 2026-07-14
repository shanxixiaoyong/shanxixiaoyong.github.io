export const HEARTBEAT_GAME_PAGE = "game-2048.html";
export const BILLIARDS_GAME_PAGE = "game-billiards-love.html";
export const RUNNER_GAME_PAGE = "game-runner-love.html";

export const GAME_CONTRACTS = [
  {
    file: HEARTBEAT_GAME_PAGE,
    name: "心动2048",
    portalAsset: "assets/portal/heartbeat-2048-portrait-hd.jpg",
    portalDesktopAsset: "assets/portal/heartbeat-2048-hd.jpg",
    styles: ["assets/world.css", "assets/love-2048.css"],
    scripts: [
      "assets/love-2048-engine.js",
      "assets/love-2048-stories.js",
      "assets/love-2048-vfx.js",
      "assets/heartbeat-audio.js",
      "assets/games.js"
    ]
  },
  {
    file: BILLIARDS_GAME_PAGE,
    name: "幻彩桌球",
    portalAsset: "assets/portal/billiards-chroma-portrait-hd.jpg",
    portalDesktopAsset: "assets/portal/billiards-chroma-hd.jpg",
    cacheVersion: "billiards-performance-cache-20260713e",
    pendingFiles: ["assets/billiards-ball-renderer.js", "assets/billiards-surface-renderer.js"],
    styles: ["assets/billiards-love.css"],
    scripts: [
      "assets/billiards-physics.js",
      "assets/billiards-love-rules.js",
      "assets/billiards-love-content.js",
      "assets/billiards-ball-renderer.js",
      "assets/billiards-surface-renderer.js",
      "assets/billiards-love-game.js"
    ]
  },
  {
    file: RUNNER_GAME_PAGE,
    name: "心动跑酷",
    portalAsset: "assets/portal/heartbeat-runner.png",
    cacheVersion: "runner-love-metro-20260714d",
    styles: ["assets/runner-love.css"],
    scripts: [
      "assets/runner-love-rules.js",
      "assets/runner-love-content.js",
      "assets/runner-love-engine.js",
      "assets/runner-love-visuals.js",
      "assets/runner-love-game.js"
    ],
    dependencies: [
      "assets/vendor/three-0.185.1.module.min.js",
      "assets/vendor/three.core.min.js",
      "assets/vendor/three-0.185.1.LICENSE.txt"
    ]
  }
];

export const ACTIVE_GAMES = GAME_CONTRACTS.map(({ file, name }) => ({ file, name }));

export const ACTIVE_GAME_PAGES = ACTIVE_GAMES.map(({ file }) => file);

export const PENDING_GAME_FILES = [...new Set(GAME_CONTRACTS
  .flatMap(({ pending, pendingFiles = [], dependencies = [], file, portalAsset, portalDesktopAsset, styles, scripts }) => [
    ...pendingFiles,
    ...(pending ? [file, portalAsset, portalDesktopAsset, ...styles, ...scripts, ...dependencies].filter(Boolean) : [])
  ]))];

export const ACTIVE_PUBLIC_HTML_FILES = [
  "index.html",
  "home.html",
  "knowledge.html",
  "tools.html",
  "games.html",
  ...GAME_CONTRACTS.filter(({ pending }) => !pending).map(({ file }) => file)
];

export const ACTIVE_PUBLIC_JS_FILES = [...new Set([
  "assets/world.js",
  "assets/portal.js",
  "assets/academic.js",
  ...GAME_CONTRACTS
    .filter(({ pending }) => !pending)
    .flatMap(({ scripts }) => scripts.filter((file) => !PENDING_GAME_FILES.includes(file)))
])];

export const ACTIVE_PUBLIC_STYLE_FILES = [...new Set([
  "assets/world.css",
  "assets/portal.css",
  "assets/academic-v2.css",
  ...GAME_CONTRACTS.filter(({ pending }) => !pending).flatMap(({ styles }) => styles)
])];

export const ACTIVE_PUBLIC_DEPENDENCY_FILES = [...new Set(
  GAME_CONTRACTS
    .filter(({ pending }) => !pending)
    .flatMap(({ dependencies = [] }) => dependencies)
)];

export const ACTIVE_PUBLIC_DOCUMENT_FILES = ["README.md"];

export const ACTIVE_PUBLIC_FILES = [
  ...ACTIVE_PUBLIC_HTML_FILES,
  ...ACTIVE_PUBLIC_JS_FILES,
  ...ACTIVE_PUBLIC_STYLE_FILES,
  ...ACTIVE_PUBLIC_DEPENDENCY_FILES,
  ...ACTIVE_PUBLIC_DOCUMENT_FILES
];

export const RETIRED_GAMES = [
  {
    file: "game-watermelon.html",
    name: "心动大西瓜",
    files: [
      "game-watermelon.html",
      "assets/watermelon.css",
      "assets/watermelon-rules.js",
      "assets/watermelon-game.js",
      "assets/portal/heartmelon-memories.png",
      "assets/portal/watermelon-summer.webp",
      "tests/watermelon-rules.test.js",
      "tests/watermelon-runtime.test.js",
      "tools/validate-watermelon.mjs"
    ]
  },
  {
    file: "game-tetris-love.html",
    name: "心动俄罗斯方块",
    files: [
      "game-tetris-love.html",
      "assets/tetris-love.css",
      "assets/tetris-love-rules.js",
      "assets/tetris-love-game.js",
      "assets/portal/tetris-rhythm.png",
      "tests/tetris-love-page.test.js",
      "tests/tetris-love-rules.test.js"
    ]
  },
  {
    file: "game-breakout-love.html",
    name: "心动打砖块",
    files: [
      "game-breakout-love.html",
      "assets/breakout-love.css",
      "assets/breakout-love-rules.js",
      "assets/breakout-love-game.js",
      "assets/portal/breakout-reply.png",
      "tests/breakout-love-rules.test.js",
      "tests/breakout-love-runtime.test.js"
    ]
  }
];

export const RETIRED_GAME_FILES = [...new Set(RETIRED_GAMES.flatMap(({ files }) => files))];

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

const OLD_PUBLIC_NAMES = ["桃花心动 2048", "桃花心动2048", "心动 2048", "合成大西瓜"];

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

function hasHomepageLink(indexHtml, game) {
  const anchors = indexHtml.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) || [];
  return anchors.some((anchor) => (
    /class="[^"]*\bportal-door\b[^"]*"/.test(anchor)
    && anchor.includes(`href="${game.file}"`)
    && anchor.includes(`<strong>${game.name}</strong>`)
    && anchor.includes(`src="${game.portalAsset}"`)
    && (!game.portalDesktopAsset || anchor.includes(`srcset="${game.portalDesktopAsset}"`))
  ));
}

function resourcePath(value) {
  return String(value || "").split(/[?#]/, 1)[0];
}

function linkedStyleReferences(html) {
  return [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g)]
    .map((match) => match[1]);
}

function linkedScriptReferences(html) {
  return [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]
    .map((match) => match[1]);
}

function linkedStyles(html) {
  return linkedStyleReferences(html).map(resourcePath);
}

function linkedScripts(html) {
  return linkedScriptReferences(html).map(resourcePath);
}

function versionedResource(file, game) {
  const version = game.assetVersions?.[file] || game.cacheVersion;
  return version ? `${file}?v=${version}` : file;
}

export function validateGameContract({ sources, exists = () => false }) {
  const failures = [];
  const source = (file) => String(sources[file] || "");

  for (const file of ACTIVE_PUBLIC_FILES) {
    if (!source(file)) failures.push(`Active public surface is missing or empty: ${file}`);
  }

  const htmlSources = Object.fromEntries(ACTIVE_PUBLIC_HTML_FILES.map((file) => [file, stripHtmlComments(source(file))]));
  const indexHtml = htmlSources["index.html"];
  const redirectHtml = htmlSources["games.html"];
  const gamesScript = source("assets/games.js");
  const activePublicSurface = [
    ...ACTIVE_PUBLIC_HTML_FILES.map((file) => htmlSources[file]),
    ...ACTIVE_PUBLIC_JS_FILES.map(source),
    ...ACTIVE_PUBLIC_STYLE_FILES.map(source),
    ...ACTIVE_PUBLIC_DOCUMENT_FILES.map(source)
  ].join("\n");

  const homepageGameLinks = [...indexHtml.matchAll(/href="(game-[^"]+\.html)"/g)].map((match) => match[1]);
  if (JSON.stringify(homepageGameLinks) !== JSON.stringify(ACTIVE_GAME_PAGES)) {
    failures.push(`Homepage must expose exactly three direct game links in public order: ${JSON.stringify(homepageGameLinks)}`);
  }
  for (const game of GAME_CONTRACTS) {
    if (!hasHomepageLink(indexHtml, game)) {
      failures.push(`Homepage must expose the ${game.name} portal at ${game.file}`);
    }
  }

  for (const token of [
    '<meta http-equiv="refresh" content="0; url=game-2048.html">',
    '<link rel="canonical" href="game-2048.html">',
    '<a href="game-2048.html">心动2048</a>'
  ]) {
    if (!redirectHtml.includes(token)) failures.push(`games.html Heartbeat redirect missing active markup: ${token}`);
  }
  if (redirectHtml.includes('id="game-board"') || redirectHtml.includes("game-lobby-page")) {
    failures.push("games.html must remain an immediate bookmark redirect, not a lobby");
  }

  for (const game of GAME_CONTRACTS) {
    if (game.pending && !source(game.file)) continue;
    const gameHtml = htmlSources[game.file];
    for (const token of [game.name, 'href="index.html"']) {
      if (!gameHtml.includes(token)) failures.push(`${game.name} page missing public contract: ${token}`);
    }
    if (!gameHtml.includes("<canvas") && !gameHtml.includes('id="game-board"')) {
      failures.push(`${game.name} page must expose a playable board or canvas`);
    }
    const actualStyles = linkedStyles(gameHtml);
    if (JSON.stringify(actualStyles) !== JSON.stringify(game.styles)) {
      failures.push(`${game.name} styles must be exact and ordered: ${JSON.stringify(actualStyles)}`);
    }
    const actualScripts = linkedScripts(gameHtml);
    if (JSON.stringify(actualScripts) !== JSON.stringify(game.scripts)) {
      failures.push(`${game.name} scripts must be exact and ordered: ${JSON.stringify(actualScripts)}`);
    }
    if (game.cacheVersion) {
      const actualStyleReferences = linkedStyleReferences(gameHtml);
      const expectedStyleReferences = game.styles.map((file) => versionedResource(file, game));
      if (JSON.stringify(actualStyleReferences) !== JSON.stringify(expectedStyleReferences)) {
        failures.push(`${game.name} stylesheet cache versions must be exact: ${JSON.stringify(actualStyleReferences)}`);
      }
      const actualScriptReferences = linkedScriptReferences(gameHtml);
      const expectedScriptReferences = game.scripts.map((file) => versionedResource(file, game));
      if (JSON.stringify(actualScriptReferences) !== JSON.stringify(expectedScriptReferences)) {
        failures.push(`${game.name} script cache versions must be exact and ordered: ${JSON.stringify(actualScriptReferences)}`);
      }
    }
  }

  const heartbeatHtml = htmlSources[HEARTBEAT_GAME_PAGE];
  for (const token of [
    "<title>心动2048 - 刘勇 / Yong Liu</title>",
    'aria-label="心动2048"',
    '<h1 id="game-title">心动2048</h1>',
    'class="solo-game-page',
    'id="solo-game"',
    'data-game="merge2048"'
  ]) {
    if (!heartbeatHtml.includes(token)) failures.push(`心动2048 page missing exact contract: ${token}`);
  }

  const registryEntries = gamesScript.match(/\bid:\s*"/g) || [];
  const runtimeFunctions = gamesScript.match(/\bfunction run\w*\s*\(/g) || [];
  if (registryEntries.length !== 1 || runtimeFunctions.length !== 1
      || !gamesScript.includes('name: "心动2048"') || !gamesScript.includes("function run2048()")) {
    failures.push("assets/games.js registry and executable runtime must remain Heartbeat-2048-only");
  }
  for (const game of ACTIVE_GAMES.slice(1)) {
    for (const token of [game.file, game.name]) {
      if (gamesScript.includes(token)) failures.push(`assets/games.js must not absorb ${game.name}: ${token}`);
    }
  }

  for (const oldName of OLD_PUBLIC_NAMES) {
    if (activePublicSurface.includes(oldName)) failures.push(`Retired public game name still present: ${oldName}`);
  }
  for (const copy of LEGACY_LOBBY_COPY) {
    if (activePublicSurface.includes(copy)) failures.push(`Legacy lobby copy still public: ${copy}`);
  }
  for (const retired of RETIRED_GAMES) {
    if (activePublicSurface.includes(retired.name)) {
      failures.push(`Retired game name still public: ${retired.name}`);
    }
    for (const file of retired.files) {
      const relativeAsset = file.replace(/^assets\//, "");
      if (exists(file)) failures.push(`Retired game file still exists: ${file}`);
      if (activePublicSurface.includes(file) || (relativeAsset !== file && activePublicSurface.includes(relativeAsset))) {
        failures.push(`Retired game file still referenced publicly: ${file}`);
      }
    }
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
