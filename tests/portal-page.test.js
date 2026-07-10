const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");
const css = read("assets/portal.css");
const script = read("assets/portal.js");

test("homepage uses an isolated portal visual system", () => {
  assert.match(html, /<body class="portal-page">/);
  assert.match(html, /assets\/portal\.css\?v=portal-20260710b/);
  assert.match(html, /assets\/portal\.js\?v=portal-20260710b/);
  assert.equal(html.includes('href="assets/world.css"'), false);
  assert.equal(html.includes('class="world-hero"'), false);
  assert.equal(html.includes('class="portal-card"'), false);
});

test("homepage exposes exactly five distinct full-bleed destinations", () => {
  const doors = [...html.matchAll(/<a class="portal-door [^"]+" href="([^"]+)" data-portal-index="(\d)">\s*<img src="([^"]+)"/g)]
    .map((match) => ({ href: match[1], index: Number(match[2]), asset: match[3] }));

  assert.deepEqual(doors, [
    { href: "home.html", index: 0, asset: "assets/portal/academic-workspace.webp" },
    { href: "knowledge.html", index: 1, asset: "assets/portal/knowledge-archive.webp" },
    { href: "tools.html", index: 2, asset: "assets/portal/tool-workbench.webp" },
    { href: "game-2048.html", index: 3, asset: "assets/love-scenes/city-night.webp" },
    { href: "game-watermelon.html", index: 4, asset: "assets/portal/watermelon-summer.webp" }
  ]);
  assert.deepEqual([...html.matchAll(/data-portal-dot="(\d)"/g)].map((match) => Number(match[1])), [0, 1, 2, 3, 4]);
  assert.match(html, /<strong>合成大西瓜<\/strong>/);

  for (const { asset } of doors) {
    assert.ok(html.includes(asset), `${asset} must be rendered by the portal`);
    assert.ok(fs.statSync(path.join(root, asset)).size > 50000, `${asset} must be a substantive image asset`);
  }
});

test("mobile portal is a snap carousel with current and next progress", () => {
  for (const token of [
    "scroll-snap-type: inline mandatory",
    "scroll-snap-align: start",
    "width: calc(100vw - 58px)",
    "width: 20%",
    ".portal-progress-current",
    ".portal-progress-next"
  ]) {
    assert.ok(css.includes(token), `portal CSS missing mobile contract: ${token}`);
  }

  for (const token of [
    "data-portal-current",
    "data-portal-current-name",
    "data-portal-next",
    "data-portal-progress"
  ]) {
    assert.ok(html.includes(token), `portal HTML missing progress contract: ${token}`);
  }

  assert.match(script, /function setActive\(index\)/);
  assert.match(script, /rail\.addEventListener\("scroll"/);
  assert.match(script, /scrollToDoor\(activeIndex/);
});

test("desktop portal uses an asymmetric five-destination matrix", () => {
  assert.match(css, /@media \(min-width: 768px\)/);
  assert.match(css, /grid-template-columns: repeat\(12, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.portal-academic \{[\s\S]*?grid-column: 1 \/ 5;[\s\S]*?grid-row: 1 \/ 3;/);
  assert.match(css, /\.portal-knowledge \{[\s\S]*?grid-column: 5 \/ 10;[\s\S]*?grid-row: 1;/);
  assert.match(css, /\.portal-tools \{[\s\S]*?grid-column: 10 \/ 13;[\s\S]*?grid-row: 1;/);
  assert.match(css, /\.portal-game \{[\s\S]*?grid-column: 5 \/ 9;[\s\S]*?grid-row: 2;/);
  assert.match(css, /\.portal-watermelon \{[\s\S]*?grid-column: 9 \/ 13;[\s\S]*?grid-row: 2;/);
  assert.match(css, /--portal-watermelon-berry: #[0-9a-f]{6}/i);
  assert.match(css, /--portal-watermelon-leaf: #[0-9a-f]{6}/i);
  assert.match(css, /--portal-watermelon-melon: #[0-9a-f]{6}/i);
});
