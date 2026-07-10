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
  assert.match(html, /assets\/portal\.css\?v=portal-20260710a/);
  assert.match(html, /assets\/portal\.js\?v=portal-20260710a/);
  assert.equal(html.includes('href="assets/world.css"'), false);
  assert.equal(html.includes('class="world-hero"'), false);
  assert.equal(html.includes('class="portal-card"'), false);
});

test("homepage exposes four distinct full-bleed destinations", () => {
  const links = [...html.matchAll(/<a class="portal-door [^"]+" href="([^"]+)" data-portal-index="(\d)"/g)]
    .map((match) => ({ href: match[1], index: Number(match[2]) }));

  assert.deepEqual(links, [
    { href: "home.html", index: 0 },
    { href: "knowledge.html", index: 1 },
    { href: "tools.html", index: 2 },
    { href: "game-2048.html", index: 3 }
  ]);

  for (const asset of [
    "assets/portal/academic-workspace.webp",
    "assets/portal/knowledge-archive.webp",
    "assets/portal/tool-workbench.webp",
    "assets/love-scenes/city-night.webp"
  ]) {
    assert.ok(html.includes(asset), `${asset} must be rendered by the portal`);
    assert.ok(fs.statSync(path.join(root, asset)).size > 50000, `${asset} must be a substantive image asset`);
  }
});

test("mobile portal is a snap carousel with current and next progress", () => {
  for (const token of [
    "scroll-snap-type: inline mandatory",
    "scroll-snap-align: start",
    "width: calc(100vw - 58px)",
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

test("desktop portal uses an asymmetric four-destination matrix", () => {
  assert.match(css, /@media \(min-width: 768px\)/);
  assert.match(css, /grid-template-columns: repeat\(12, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.portal-academic \{[\s\S]*?grid-column: 1 \/ 6;[\s\S]*?grid-row: 1 \/ 3;/);
  assert.match(css, /\.portal-game \{[\s\S]*?grid-column: 6 \/ 13;[\s\S]*?grid-row: 2;/);
});
