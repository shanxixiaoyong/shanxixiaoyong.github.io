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
const heartbeatHtml = read("game-2048.html");
const watermelonHtml = read("game-watermelon.html");
const gamesSource = read("assets/games.js");
const validators = [
  "tools/validate-site.mjs",
  "tools/validate-love-2048.mjs",
  "tools/validate-watermelon.mjs"
];
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
  const overlay = fs.mkdtempSync(path.join(os.tmpdir(), "two-game-contract-"));
  try {
    linkOverlay(root, overlay, file.split("/"));
    const target = path.join(overlay, file);
    const mutated = mutate(read(file));
    assert.notEqual(mutated, read(file), `mutation did not change ${file}`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, mutated);

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

test("publishes exactly Heartbeat and Watermelon under their public names", () => {
  assert.deepEqual(gameContract.ACTIVE_GAMES, [
    { file: "game-2048.html", name: "心动2048" },
    { file: "game-watermelon.html", name: "合成大西瓜" }
  ]);

  assert.match(heartbeatHtml, /<title>心动2048 - 刘勇 \/ Yong Liu<\/title>/);
  assert.match(heartbeatHtml, /<meta name="description" content="心动2048：/);
  assert.match(heartbeatHtml, /<section[^>]+aria-label="心动2048"/);
  assert.match(heartbeatHtml, /<h1 id="game-title">心动2048<\/h1>/);
  assert.match(gamesSource, /name: "心动2048"/);

  assert.match(watermelonHtml, /<title>合成大西瓜 - 刘勇 \/ Yong Liu<\/title>/);
  assert.match(watermelonHtml, /<meta name="description" content="合成大西瓜：/);
  assert.match(watermelonHtml, /aria-label="合成大西瓜"/);
  assert.match(watermelonHtml, /<h1>合成大西瓜<\/h1>/);

  for (const file of gameContract.ACTIVE_PUBLIC_FILES) {
    const source = read(file);
    assert.equal(source.includes("桃花心动"), false);
    assert.equal(source.includes("心动 2048"), false);
  }
});

test("homepage has exactly two direct game destinations", () => {
  const activeIndexHtml = gameContract.stripHtmlComments(indexHtml);
  const gameLinks = [...activeIndexHtml.matchAll(/href="(game-[^"]+\.html)"/g)].map((match) => match[1]);
  assert.deepEqual(gameLinks, ["game-2048.html", "game-watermelon.html"]);
  assert.match(activeIndexHtml, /<a class="portal-door portal-game" href="game-2048\.html"/);
  assert.match(activeIndexHtml, /<strong>心动2048<\/strong>/);
  assert.match(activeIndexHtml, /<a class="portal-door portal-watermelon" href="game-watermelon\.html"/);
  assert.match(activeIndexHtml, /<strong>合成大西瓜<\/strong>/);
});

test("games.html immediately redirects old bookmarks to 心动2048", () => {
  const activeRedirectHtml = gameContract.stripHtmlComments(redirectHtml);
  assert.match(activeRedirectHtml, /<link rel="canonical" href="game-2048\.html">/);
  assert.match(activeRedirectHtml, /<meta http-equiv="refresh" content="0; url=game-2048\.html">/);
  assert.match(activeRedirectHtml, /<a href="game-2048\.html">心动2048<\/a>/);
  assert.equal(activeRedirectHtml.includes("game-lobby-page"), false);
});

test("both games return directly to the homepage", () => {
  assert.match(heartbeatHtml, /<a class="solo-back" href="index\.html">首页<\/a>/);
  assert.match(watermelonHtml, /<a class="wm-icon wm-back" href="index\.html"/);
});

test("Watermelon loads only its ordered local runtime", () => {
  const activeWatermelonHtml = gameContract.stripHtmlComments(watermelonHtml);
  const scripts = [...activeWatermelonHtml.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)]
    .map((match) => match[1].split("?")[0]);
  assert.deepEqual(scripts, [
    "assets/vendor/matter-0.20.0.min.js",
    "assets/watermelon-rules.js",
    "assets/watermelon-game.js"
  ]);
  assert.match(activeWatermelonHtml, /href="assets\/watermelon\.css\?/);
  assert.equal(activeWatermelonHtml.includes("assets/games.js"), false);
});

test("assets/games.js stays Heartbeat-only and retired games remain absent", () => {
  assert.equal((gamesSource.match(/\bid:\s*"/g) || []).length, 1);
  assert.equal((gamesSource.match(/\bfunction run\w*\s*\(/g) || []).length, 1);
  assert.match(gamesSource, /function run2048\(\)/);
  assert.equal(gamesSource.includes("合成大西瓜"), false);
  assert.equal(gamesSource.includes("watermelon"), false);

  assert.deepEqual(
    gameContract.LEGACY_GAMES.find(({ file }) => file === "game-suika.html"),
    {
      file: "game-suika.html",
      title: "重力果园",
      runtime: "runSuika",
      asset: "assets/game-art/orchard-suika-ui.jpg"
    }
  );

  for (const legacy of gameContract.LEGACY_GAMES) {
    assert.equal(fs.existsSync(path.join(root, legacy.file)), false, legacy.file);
    assert.equal(fs.existsSync(path.join(root, legacy.asset)), false, legacy.asset);
    for (const file of gameContract.ACTIVE_PUBLIC_FILES) {
      const source = read(file);
      assert.equal(source.includes(legacy.file), false, `${file}: ${legacy.file}`);
      assert.equal(source.includes(legacy.title), false, `${file}: ${legacy.title}`);
      assert.equal(source.includes(legacy.runtime), false, `${file}: ${legacy.runtime}`);
      assert.equal(source.includes(legacy.asset), false, `${file}: ${legacy.asset}`);
      assert.equal(source.includes(legacy.asset.replace(/^assets\//, "")), false, `${file}: ${legacy.asset}`);
    }
  }
});

test("site and focused validators accept the two-game site", () => {
  for (const validator of validators) {
    const result = childProcess.spawnSync(process.execPath, [path.join(root, validator)], {
      cwd: root,
      encoding: "utf8"
    });
    assert.equal(result.status, 0, `${validator} failed:\n${result.stderr || result.stdout}`);
  }
});

test("validators reject commented requirements and forbidden content across every active surface", () => {
  for (const game of gameContract.ACTIVE_GAMES) {
    const escapedFile = game.file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assertValidatorsRejectMutation("index.html", (source) => source.replace(
      new RegExp(`(<a class="portal-door [^"]+" href="${escapedFile}"[\\s\\S]*?<\\/a>)`),
      "<!-- $1 -->"
    ));
  }
  for (const requiredMarkup of [
    /(<meta http-equiv="refresh"[^>]+>)/,
    /(<link rel="canonical"[^>]+>)/,
    /(<a href="game-2048\.html">心动2048<\/a>)/
  ]) {
    assertValidatorsRejectMutation("games.html", (source) => source.replace(requiredMarkup, "<!-- $1 -->"));
  }
  assertValidatorsRejectMutation("game-2048.html", (source) => source.replace(
    /(<a class="solo-back" href="index\.html">首页<\/a>)/,
    "<!-- $1 -->"
  ));
  assertValidatorsRejectMutation("game-watermelon.html", (source) => source.replace(
    /(<a class="wm-icon wm-back" href="index\.html"[\s\S]*?<\/a>)/,
    "<!-- $1 -->"
  ));

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
