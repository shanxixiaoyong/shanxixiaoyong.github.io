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
const gamesSource = read("assets/games.js");
const validators = [
  "tools/validate-site.mjs",
  "tools/validate-love-2048.mjs"
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

function assertSiteValidatorRejectsMutation(file, mutate) {
  const overlay = fs.mkdtempSync(path.join(os.tmpdir(), "three-game-contract-"));
  try {
    linkOverlay(root, overlay, file.split("/"));
    const target = path.join(overlay, file);
    const mutated = mutate(read(file));
    assert.notEqual(mutated, read(file), `mutation did not change ${file}`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, read(file));
    const baseline = childProcess.spawnSync(process.execPath, [path.join(root, "tools/validate-site.mjs")], {
      cwd: overlay,
      encoding: "utf8"
    });
    assert.equal(baseline.status, 0, `mutation baseline is invalid:\n${baseline.stderr || baseline.stdout}`);
    fs.writeFileSync(target, mutated);
    const result = childProcess.spawnSync(process.execPath, [path.join(root, "tools/validate-site.mjs")], {
      cwd: overlay,
      encoding: "utf8"
    });
    assert.notEqual(result.status, 0, `validate-site accepted mutation in ${file}`);
  } finally {
    fs.rmSync(overlay, { recursive: true, force: true });
  }
}

test("publishes exactly three independent Heartbeat game contracts", () => {
  assert.deepEqual(gameContract.ACTIVE_GAMES, [
    { file: "game-2048.html", name: "心动2048" },
    { file: "game-billiards-love.html", name: "幻彩桌球" },
    { file: "game-runner-love.html", name: "心动跑酷" }
  ]);

  for (const game of gameContract.ACTIVE_GAMES) {
    if (!fs.existsSync(path.join(root, game.file))) continue;
    const html = gameContract.stripHtmlComments(read(game.file));
    assert.ok(html.includes(game.name), `${game.file} must display ${game.name}`);
    assert.match(html, /href="index\.html"/);
    assert.ok(html.includes("<canvas") || html.includes('id="game-board"'), `${game.file} needs a playable surface`);
  }

  assert.match(read("game-2048.html"), /<title>心动2048 - 刘勇 \/ Yong Liu<\/title>/);
  assert.match(gamesSource, /name: "心动2048"/);
});

test("homepage links directly to all three games in narrative order", () => {
  const activeIndexHtml = gameContract.stripHtmlComments(indexHtml);
  const gameLinks = [...activeIndexHtml.matchAll(/href="(game-[^"]+\.html)"/g)].map((match) => match[1]);
  assert.deepEqual(gameLinks, gameContract.ACTIVE_GAME_PAGES);
  for (const game of gameContract.ACTIVE_GAMES) {
    assert.ok(activeIndexHtml.includes(`href="${game.file}"`), game.file);
    assert.ok(activeIndexHtml.includes(`<strong>${game.name}</strong>`), game.name);
  }
});

test("games.html remains a direct old-bookmark redirect", () => {
  const html = gameContract.stripHtmlComments(redirectHtml);
  assert.match(html, /<link rel="canonical" href="game-2048\.html">/);
  assert.match(html, /<meta http-equiv="refresh" content="0; url=game-2048\.html">/);
  assert.match(html, /<a href="game-2048\.html">心动2048<\/a>/);
  assert.equal(html.includes("game-lobby-page"), false);
});

test("each game owns an isolated ordered runtime", () => {
  for (const contract of gameContract.GAME_CONTRACTS) {
    const page = contract.file;
    if (!fs.existsSync(path.join(root, page))) {
      assert.equal(contract.pending, true, `${page} may be absent only while pending`);
      continue;
    }
    const html = gameContract.stripHtmlComments(read(page));
    const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)]
      .map((match) => match[1].split("?")[0]);
    const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]
      .map((match) => match[1].split("?")[0]);
    assert.deepEqual(scripts, contract.scripts, `${page} script order`);
    assert.deepEqual(styles, contract.styles, `${page} stylesheet order`);
    for (const otherPage of gameContract.ACTIVE_GAME_PAGES) {
      if (otherPage === page) continue;
      const stem = otherPage.replace(/^game-|\.html$/g, "");
      assert.equal(scripts.some((script) => script.includes(stem)), false, `${page} absorbs ${otherPage}`);
    }
  }
});

test("billiards pins the independent physics and ball renderer before the game runtime", () => {
  const billiards = gameContract.GAME_CONTRACTS.find(({ file }) => file === "game-billiards-love.html");

  assert.deepEqual(billiards.scripts, [
    "assets/billiards-physics.js",
    "assets/billiards-love-rules.js",
    "assets/billiards-love-content.js",
    "assets/billiards-ball-renderer.js",
    "assets/billiards-surface-renderer.js",
    "assets/billiards-love-game.js"
  ]);
  assert.equal(billiards.cacheVersion, "billiards-performance-cache-20260714f");
  assert.deepEqual(billiards.pendingFiles, ["assets/billiards-ball-renderer.js", "assets/billiards-surface-renderer.js"]);
  assert.ok(gameContract.PENDING_GAME_FILES.includes("assets/billiards-ball-renderer.js"));
  assert.ok(gameContract.PENDING_GAME_FILES.includes("assets/billiards-surface-renderer.js"));
  assert.equal(gameContract.ACTIVE_PUBLIC_JS_FILES.includes("assets/billiards-ball-renderer.js"), false);
});

test("runner publishes its local Three.js renderer and complete dependency graph", () => {
  const runner = gameContract.GAME_CONTRACTS.find(({ file }) => file === "game-runner-love.html");

  assert.deepEqual(runner.scripts, [
    "assets/runner-love-rules.js",
    "assets/runner-love-content.js",
    "assets/runner-love-director.js",
    "assets/runner-love-engine.js",
    "assets/runner-love-audio.js",
    "assets/runner-love-visuals.js",
    "assets/runner-love-game.js"
  ]);
  assert.equal(runner.cacheVersion, "runner-love-campus-20260715n");
  assert.equal(runner.pending, undefined);
  assert.deepEqual(runner.dependencies, [
    "assets/vendor/three-0.185.1.module.min.js",
    "assets/vendor/three.core.min.js",
    "assets/vendor/three-0.185.1.LICENSE.txt"
  ]);
  for (const dependency of runner.dependencies) {
    assert.ok(gameContract.ACTIVE_PUBLIC_DEPENDENCY_FILES.includes(dependency), dependency);
    assert.ok(fs.existsSync(path.join(root, dependency)), dependency);
  }
});

test("assets/games.js remains Heartbeat-2048-only and retired games remain absent", () => {
  assert.equal((gamesSource.match(/\bid:\s*"/g) || []).length, 1);
  assert.equal((gamesSource.match(/\bfunction run\w*\s*\(/g) || []).length, 1);
  assert.match(gamesSource, /function run2048\(\)/);
  for (const game of gameContract.ACTIVE_GAMES.slice(1)) {
    assert.equal(gamesSource.includes(game.file), false);
    assert.equal(gamesSource.includes(game.name), false);
  }

  for (const legacy of gameContract.LEGACY_GAMES) {
    assert.equal(fs.existsSync(path.join(root, legacy.file)), false, legacy.file);
    assert.equal(fs.existsSync(path.join(root, legacy.asset)), false, legacy.asset);
    for (const file of gameContract.ACTIVE_PUBLIC_FILES) {
      const source = read(file);
      assert.equal(source.includes(legacy.file), false, `${file}: ${legacy.file}`);
      assert.equal(source.includes(legacy.title), false, `${file}: ${legacy.title}`);
      assert.equal(source.includes(legacy.runtime), false, `${file}: ${legacy.runtime}`);
    }
  }

  for (const file of gameContract.RETIRED_GAME_FILES) {
    assert.equal(fs.existsSync(path.join(root, file)), false, file);
  }
  for (const retired of gameContract.RETIRED_GAMES) {
    for (const file of gameContract.ACTIVE_PUBLIC_FILES) {
      const source = read(file);
      assert.equal(source.includes(retired.name), false, `${file}: ${retired.name}`);
      for (const retiredFile of retired.files) {
        assert.equal(source.includes(retiredFile), false, `${file}: ${retiredFile}`);
      }
    }
  }

  const contractSources = gameContract.readGameContractSources(read);
  const reintroduced = gameContract.RETIRED_GAME_FILES[0];
  const failures = gameContract.validateGameContract({
    sources: contractSources,
    exists: (file) => file === reintroduced
  });
  assert.ok(failures.includes(`Retired game file still exists: ${reintroduced}`));
});

test("site and focused validators accept the three-game portal contract", () => {
  for (const validator of validators) {
    const result = childProcess.spawnSync(process.execPath, [path.join(root, validator)], {
      cwd: root,
      encoding: "utf8"
    });
    assert.equal(result.status, 0, `${validator} failed:\n${result.stderr || result.stdout}`);
  }
});

test("site contract rejects hidden portal doors and retired lobby copy", () => {
  const destinations = [
    { file: "home.html", name: "个人主页" },
    { file: "knowledge.html", name: "个人知识库" },
    { file: "tools.html", name: "小工具箱" },
    ...gameContract.ACTIVE_GAMES
  ];
  for (const destination of destinations) {
    const escapedFile = destination.file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assertSiteValidatorRejectsMutation("index.html", (source) => source.replace(
      new RegExp(`(<a class="portal-door [^"]+" href="${escapedFile}"[\\s\\S]*?<\\/a>)`),
      "<!-- $1 -->"
    ));
  }
  const copy = gameContract.LEGACY_LOBBY_COPY.join(" / ");
  assertSiteValidatorRejectsMutation("index.html", (source) => source.replace("</body>", `${copy}</body>`));
});

test("site contract rejects reordered billiards layers and stale renderer cache versions", () => {
  const renderer = '  <script src="assets/billiards-ball-renderer.js?v=billiards-performance-cache-20260714f"></script>';
  const surface = '  <script src="assets/billiards-surface-renderer.js?v=billiards-performance-cache-20260714f"></script>';
  const game = '  <script src="assets/billiards-love-game.js?v=billiards-performance-cache-20260714f"></script>';

  assertSiteValidatorRejectsMutation("game-billiards-love.html", (source) => source.replace(
    `${renderer}\n${surface}\n${game}`,
    `${game}\n${surface}\n${renderer}`
  ));
  assertSiteValidatorRejectsMutation("game-billiards-love.html", (source) => source.replace(
    renderer,
    renderer.replace("billiards-performance-cache-20260714f", "billiards-love-stale")
  ));
  assert.match(read("game-billiards-love.html"), new RegExp(`${surface.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*${game.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
});
