const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const indexHtml = read("index.html");
const redirectHtml = read("games.html");
const gameHtml = read("game-2048.html");
const gamesSource = read("assets/games.js");
const worldCss = read("assets/world.css");
const validators = ["tools/validate-site.mjs", "tools/validate-love-2048.mjs"];
let gameContract;

test.before(async () => {
  gameContract = await import("../tools/game-contract.mjs");
});

function linkOverlay(sourceDir, targetDir, mutationParts) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const source = path.join(sourceDir, entry.name);
    const target = path.join(targetDir, entry.name);
    if (entry.name !== mutationParts[0]) {
      fs.symlinkSync(source, target, entry.isDirectory() ? "dir" : "file");
    } else if (mutationParts.length > 1) {
      linkOverlay(source, target, mutationParts.slice(1));
    }
  }
}

function assertValidatorsRejectMutation(file, mutate) {
  const overlay = fs.mkdtempSync(path.join(os.tmpdir(), "single-game-contract-"));
  try {
    linkOverlay(root, overlay, file.split("/"));
    const target = path.join(overlay, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, mutate(read(file)));

    for (const validator of validators) {
      const result = childProcess.spawnSync(process.execPath, [path.join(root, validator)], {
        cwd: overlay,
        encoding: "utf8"
      });
      assert.notEqual(result.status, 0, `${validator} accepted mutation in ${file}`);
    }
  } finally {
    fs.rmSync(overlay, { recursive: true, force: true });
  }
}

test("publishes the sole game under the exact name 心动2048", () => {
  assert.match(gameHtml, /<title>心动2048 - 刘勇 \/ Yong Liu<\/title>/);
  assert.match(gameHtml, /<meta name="description" content="心动2048：/);
  assert.match(gameHtml, /<section[^>]+aria-label="心动2048"/);
  assert.match(gameHtml, /<h1 id="game-title">心动2048<\/h1>/);
  assert.match(gamesSource, /name: "心动2048"/);

  for (const file of gameContract.ACTIVE_PUBLIC_FILES) {
    const source = read(file);
    assert.equal(source.includes("桃花心动"), false);
    assert.equal(source.includes("心动 2048"), false);
  }
});

test("homepage has one direct game destination", () => {
  const activeIndexHtml = gameContract.stripHtmlComments(indexHtml);
  const gameLinks = [...activeIndexHtml.matchAll(/href="(game-[^"]+\.html)"/g)].map((match) => match[1]);
  assert.deepEqual(gameLinks, ["game-2048.html"]);
  assert.match(activeIndexHtml, /<a class="portal-door portal-game" href="game-2048\.html"/);
  assert.match(activeIndexHtml, /<strong>心动2048<\/strong>/);
});

test("games.html immediately redirects old bookmarks to 心动2048", () => {
  const activeRedirectHtml = gameContract.stripHtmlComments(redirectHtml);
  assert.match(activeRedirectHtml, /<link rel="canonical" href="game-2048\.html">/);
  assert.match(activeRedirectHtml, /<meta http-equiv="refresh" content="0; url=game-2048\.html">/);
  assert.match(activeRedirectHtml, /<a href="game-2048\.html">心动2048<\/a>/);
  assert.equal(activeRedirectHtml.includes("game-lobby-page"), false);
});

test("the game returns directly to the homepage", () => {
  assert.match(gameHtml, /<a class="solo-back" href="index\.html">首页<\/a>/);
});

test("legacy game pages and executable runtimes are absent", () => {
  assert.equal((gamesSource.match(/\bid:\s*"/g) || []).length, 1);
  assert.equal((gamesSource.match(/\bfunction run\w*\s*\(/g) || []).length, 1);
  assert.match(gamesSource, /function run2048\(\)/);

  for (const legacy of gameContract.LEGACY_GAMES) {
    assert.equal(fs.existsSync(path.join(root, legacy.file)), false, legacy.file);
    assert.equal(fs.existsSync(path.join(root, legacy.asset)), false, legacy.asset);
    assert.equal(gamesSource.includes(legacy.title), false, legacy.title);
    assert.equal(gamesSource.includes(legacy.runtime), false, legacy.runtime);
    assert.equal(worldCss.includes(legacy.asset.replace(/^assets\//, "")), false, legacy.asset);
    assert.equal(indexHtml.includes(legacy.file), false, legacy.file);
    assert.equal(redirectHtml.includes(legacy.file), false, legacy.file);
  }
});

test("validators reject commented requirements and forbidden content across every active surface", () => {
  assertValidatorsRejectMutation("index.html", (source) => source.replace(
    /(<a class="portal-door portal-game" href="game-2048\.html"[\s\S]*?<\/a>)/,
    "<!-- $1 -->"
  ));
  for (const requiredMarkup of [
    /(<meta http-equiv="refresh"[^>]+>)/,
    /(<link rel="canonical"[^>]+>)/,
    /(<a href="game-2048\.html">心动2048<\/a>)/
  ]) {
    assertValidatorsRejectMutation("games.html", (source) => source.replace(requiredMarkup, "<!-- $1 -->"));
  }

  for (const legacy of gameContract.LEGACY_GAMES) {
    assertValidatorsRejectMutation("index.html", (source) => source.replace(
      "</body>",
      `<a href="${legacy.file}">${legacy.title}</a></body>`
    ));
    assertValidatorsRejectMutation(
      "assets/games.js",
      (source) => `${source}\nfunction ${legacy.runtime}() { return "${legacy.title} ${legacy.file}"; }\n`
    );
  }

  const legacy = gameContract.LEGACY_GAMES[0];
  for (const file of gameContract.ACTIVE_PUBLIC_HTML_FILES) {
    assertValidatorsRejectMutation(file, (source) => source.replace(
      "</body>",
      `<a href="${legacy.file}">${legacy.title}</a></body>`
    ));
  }
  for (const file of gameContract.ACTIVE_PUBLIC_JS_FILES) {
    assertValidatorsRejectMutation(
      file,
      (source) => `${source}\nfunction ${legacy.runtime}() { return "${legacy.title} ${legacy.file}"; }\n`
    );
  }

  for (const file of gameContract.ACTIVE_PUBLIC_FILES) {
    const copy = gameContract.LEGACY_LOBBY_COPY.join(" / ");
    assertValidatorsRejectMutation(file, (source) => `${source}\n${copy}\n`);
  }
});
