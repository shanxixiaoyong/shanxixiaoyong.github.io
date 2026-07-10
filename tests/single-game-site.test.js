const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const indexHtml = read("index.html");
const redirectHtml = read("games.html");
const gameHtml = read("game-2048.html");
const gamesSource = read("assets/games.js");
const validatorSource = `${read("tools/validate-site.mjs")}\n${read("tools/validate-love-2048.mjs")}`;

const legacyGames = [
  { page: "game-tetris.html", name: "熔炉方块", runtime: "runTetris" },
  { page: "game-mines.html", name: "声呐扫雷", runtime: "runMines" },
  { page: "game-sudoku.html", name: "墨格数独", runtime: "runSudoku" },
  { page: "game-snake.html", name: "霓虹列车", runtime: "runSnake" },
  { page: "game-bubble.html", name: "潮汐泡泡", runtime: "runBubble" },
  { page: "game-suika.html", name: "重力果园", runtime: "runSuika" },
  { page: "game-jump.html", name: "月面跳台", runtime: "runJump" },
  { page: "game-tower.html", name: "峡谷塔防", runtime: "runTower" },
  { page: "game-cards.html", name: "星舰卡牌", runtime: "runCards" }
];

test("publishes the sole game under the exact name 心动2048", () => {
  assert.match(gameHtml, /<title>心动2048 - 刘勇 \/ Yong Liu<\/title>/);
  assert.match(gameHtml, /<meta name="description" content="心动2048：/);
  assert.match(gameHtml, /<section[^>]+aria-label="心动2048"/);
  assert.match(gameHtml, /<h1 id="game-title">心动2048<\/h1>/);
  assert.match(gamesSource, /name: "心动2048"/);

  for (const source of [indexHtml, redirectHtml, gameHtml, gamesSource]) {
    assert.equal(source.includes("桃花心动"), false);
    assert.equal(source.includes("心动 2048"), false);
  }
});

test("homepage has one direct game destination", () => {
  const gameLinks = [...indexHtml.matchAll(/href="(game-[^"]+\.html)"/g)].map((match) => match[1]);
  assert.deepEqual(gameLinks, ["game-2048.html"]);
  assert.match(indexHtml, /<a class="portal-card" href="game-2048\.html">/);
  assert.match(indexHtml, /<h2>心动2048<\/h2>/);
});

test("games.html immediately redirects old bookmarks to 心动2048", () => {
  assert.match(redirectHtml, /<link rel="canonical" href="game-2048\.html">/);
  assert.match(redirectHtml, /<meta http-equiv="refresh" content="0; url=game-2048\.html">/);
  assert.match(redirectHtml, /<a href="game-2048\.html">心动2048<\/a>/);
  assert.equal(redirectHtml.includes("game-lobby-page"), false);
});

test("the game returns directly to the homepage", () => {
  assert.match(gameHtml, /<a class="solo-back" href="index\.html">首页<\/a>/);
});

test("legacy game pages and executable runtimes are absent", () => {
  assert.equal((gamesSource.match(/\bid:\s*"/g) || []).length, 1);
  assert.equal((gamesSource.match(/\bfunction run\w*\s*\(/g) || []).length, 1);
  assert.match(gamesSource, /function run2048\(\)/);

  for (const legacy of legacyGames) {
    assert.equal(fs.existsSync(path.join(root, legacy.page)), false, legacy.page);
    assert.equal(gamesSource.includes(legacy.name), false, legacy.name);
    assert.equal(gamesSource.includes(legacy.runtime), false, legacy.runtime);
    assert.equal(indexHtml.includes(legacy.page), false, legacy.page);
    assert.equal(redirectHtml.includes(legacy.page), false, legacy.page);
  }
});

test("validators explicitly reject every legacy game surface", () => {
  for (const legacy of legacyGames) {
    assert.equal(validatorSource.includes(legacy.page), true, legacy.page);
    assert.equal(validatorSource.includes(legacy.name), true, legacy.name);
    assert.equal(validatorSource.includes(legacy.runtime), true, legacy.runtime);
  }
  assert.match(validatorSource, /Legacy game/);
});
