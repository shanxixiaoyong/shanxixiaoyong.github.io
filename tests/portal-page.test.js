const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");
const css = read("assets/portal.css");
const script = read("assets/portal.js");

test("homepage uses an isolated editorial portal visual system", () => {
  assert.match(html, /<body class="portal-page">/);
  assert.match(html, /assets\/portal\.css\?v=portal-index-20260717a/);
  assert.match(html, /assets\/portal\.js\?v=portal-index-20260717a/);
  assert.equal(html.includes('href="assets/world.css"'), false);
  assert.equal(html.includes('class="world-hero"'), false);
  assert.equal(html.includes('class="portal-card"'), false);
  assert.equal(html.includes("portal-progress"), false);
  assert.equal(html.includes("aria-roledescription=\"carousel\""), false);
});

test("homepage exposes six distinct image-led destinations", () => {
  const doors = [...html.matchAll(/<a class="portal-door [^"]+" href="([^"]+)" data-portal-index="(\d)"[^>]*>([\s\S]*?)<\/a>/g)]
    .map((match) => ({
      href: match[1],
      index: Number(match[2]),
      asset: match[3].match(/<img src="([^"]+)"/)[1]
    }));

  assert.deepEqual(doors, [
    { href: "home.html", index: 0, asset: "assets/portal/academic-workspace.webp" },
    { href: "knowledge.html", index: 1, asset: "assets/portal/knowledge-archive.webp" },
    { href: "tools.html", index: 2, asset: "assets/portal/tool-workbench.webp" },
    { href: "game-2048.html", index: 3, asset: "assets/portal/heartbeat-2048-cover-v2.jpg" },
    { href: "game-billiards-love.html", index: 4, asset: "assets/portal/billiards-chroma-cover-v2.jpg" },
    { href: "game-runner-love.html", index: 5, asset: "assets/portal/heartbeat-runner-cover-v2.jpg" }
  ]);

  for (const title of ["个人主页", "个人知识库", "小工具箱", "心动2048", "幻彩桌球", "心动跑酷"]) {
    assert.ok(html.includes(`<strong>${title}</strong>`), `${title} must have a direct homepage entry`);
  }

  for (const { asset } of doors) {
    assert.ok(fs.existsSync(path.join(root, asset)), `${asset} must exist`);
    assert.ok(fs.statSync(path.join(root, asset)).size > 20000, `${asset} must be a substantive image asset`);
  }
});

test("mobile portal uses a compact editorial mosaic", () => {
  for (const token of [
    "grid-template-columns: repeat(2, minmax(0, 1fr))",
    ".portal-academic",
    "grid-column: 1 / -1",
    "aspect-ratio: 16 / 11",
    ".portal-knowledge",
    "aspect-ratio: 4 / 5",
    ".portal-runner",
    "aspect-ratio: 16 / 9"
  ]) {
    assert.ok(css.includes(token), `portal CSS missing mobile mosaic contract: ${token}`);
  }

  assert.equal(css.includes("scroll-snap-type"), false);
  assert.equal(css.includes("writing-mode: vertical-rl"), false);
});

test("desktop portal separates work hierarchy from the three-game gallery", () => {
  assert.match(css, /@media \(min-width: 760px\)/);
  assert.match(css, /\.portal-rail \{[\s\S]*?grid-template-columns: repeat\(12, minmax\(0, 1fr\)\);/);
  assert.match(css, /\.portal-academic \{[\s\S]*?grid-column: span 7;[\s\S]*?grid-row: span 2;/);
  assert.match(css, /\.portal-knowledge,[\s\S]*?\.portal-tools \{[\s\S]*?grid-column: span 5;/);
  assert.match(css, /\.portal-game-grid \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
  assert.match(html, /id="work-title">研究与日常</);
  assert.match(html, /id="play-title">独立游戏</);
});

test("portal motion is subtle, optional and input-safe", () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.portal-door:focus-visible/);
  assert.match(script, /document\.querySelectorAll\("\.portal-door"\)/);
  assert.match(script, /door\.addEventListener\("pointermove"/);
  assert.match(script, /requestAnimationFrame/);
  assert.match(script, /prefers-reduced-motion: reduce/);
  assert.equal(script.includes("scrollTo"), false);
});
