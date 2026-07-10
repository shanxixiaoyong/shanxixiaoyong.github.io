const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "game-2048.html"), "utf8");
const games = fs.readFileSync(path.join(root, "assets/games.js"), "utf8");

test("loads the Love 2048 engine before VFX and the shared game script", () => {
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1]);
  const engineIndex = scripts.findIndex((source) => source.startsWith("assets/love-2048-engine.js?v="));
  const vfxIndex = scripts.findIndex((source) => source.startsWith("assets/love-2048-vfx.js?v="));
  const gamesIndex = scripts.findIndex((source) => source.startsWith("assets/games.js?v="));

  assert.ok(engineIndex >= 0, "Love 2048 engine script must be present");
  assert.ok(engineIndex < vfxIndex, "engine must load before VFX");
  assert.ok(vfxIndex < gamesIndex, "VFX must load before games.js");

  const versions = [scripts[engineIndex], scripts[vfxIndex], scripts[gamesIndex]]
    .map((source) => new URLSearchParams(source.split("?")[1]).get("v"));
  assert.ok(versions[0], "Love 2048 scripts must use a cache version");
  assert.deepEqual(versions, [versions[0], versions[0], versions[0]]);
});

test("keeps the engine dependency inside a five-by-five run2048 board", () => {
  const run2048Index = games.indexOf("function run2048()");
  const nextGameIndex = games.indexOf("function runMines()", run2048Index);
  const run2048Source = games.slice(run2048Index, nextGameIndex);

  assert.ok(run2048Index >= 0, "run2048 must exist");
  assert.equal(games.slice(0, run2048Index).includes("Love2048Engine"), false);
  assert.match(run2048Source, /const size = 5;/);
  assert.match(run2048Source, /window\.Love2048Engine/);
  assert.match(run2048Source, /Array\.from\(\{ length: size \* size \}/);
  assert.match(run2048Source, /Love2048Engine\.slideLine|engine\.slideLine/);
  assert.match(run2048Source, /Love2048Engine\.canMove|engine\.canMove/);
  assert.match(run2048Source, /Love2048Engine\.chooseSpawn|engine\.chooseSpawn/);
  assert.match(run2048Source, /Love2048Engine\.resolveDestiny|engine\.resolveDestiny/);
  assert.match(run2048Source, /Love2048Engine\.repairConflict|engine\.repairConflict/);
});

test("declares the special tile DOM states and non-modal board effects", () => {
  for (const token of [
    "is-fate",
    "is-conflict",
    "data-special"
  ]) {
    assert.ok(games.includes(token), `missing page contract token: ${token}`);
  }

  assert.match(games, /item\.className = `board-effect effect-\$\{name\}`/);
  for (const effect of ["love-destiny", "love-miracle", "love-conflict", "love-reconcile"]) {
    assert.match(games, new RegExp(`trigger(?:Board|Cell)Effect\\(\\"${effect}\\"`));
  }

  assert.match(games, /data-special[\s\S]{0,240}fate|dataset\.special\s*=\s*"fate"/);
  assert.match(games, /data-special[\s\S]{0,240}conflict|dataset\.special\s*=\s*"conflict"/);
  assert.match(games, /crack/i);
});
