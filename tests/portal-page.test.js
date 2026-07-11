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
  assert.match(html, /assets\/portal\.css\?v=portal-20260711b/);
  assert.match(html, /assets\/portal\.js\?v=portal-20260711b/);
  assert.equal(html.includes('href="assets/world.css"'), false);
  assert.equal(html.includes('class="world-hero"'), false);
  assert.equal(html.includes('class="portal-card"'), false);
});

test("homepage exposes six distinct full-bleed destinations", () => {
  const doors = [...html.matchAll(/<a class="portal-door [^"]+" href="([^"]+)" data-portal-index="(\d)">\s*<img src="([^"]+)"/g)]
    .map((match) => ({ href: match[1], index: Number(match[2]), asset: match[3] }));

  assert.deepEqual(doors, [
    { href: "home.html", index: 0, asset: "assets/portal/academic-workspace.webp" },
    { href: "knowledge.html", index: 1, asset: "assets/portal/knowledge-archive.webp" },
    { href: "tools.html", index: 2, asset: "assets/portal/tool-workbench.webp" },
    { href: "game-2048.html", index: 3, asset: "assets/portal/heartbeat-2048.png" },
    { href: "game-billiards-love.html", index: 4, asset: "assets/portal/billiards-night.png" },
    { href: "game-runner-love.html", index: 5, asset: "assets/portal/heartbeat-runner.png" }
  ]);
  assert.equal(html.includes("data-portal-dot"), false, "progress must not ship hidden dead controls");
  for (const title of ["心动2048", "心动桌球", "心动跑酷"]) {
    assert.ok(html.includes(`<strong>${title}</strong>`), `${title} must have a direct homepage entry`);
  }

  for (const { asset } of doors) {
    assert.ok(html.includes(asset), `${asset} must be rendered by the portal`);
    if (fs.existsSync(path.join(root, asset))) {
      assert.ok(fs.statSync(path.join(root, asset)).size > 20000, `${asset} must be a substantive image asset`);
    }
  }
});

test("mobile portal is a snap carousel with current and next progress", () => {
  for (const token of [
    "scroll-snap-type: inline mandatory",
    "scroll-snap-align: center",
    "width: calc(100vw - 48px)",
    "width: calc(100% / 6)",
    "grid-template-rows: auto minmax(0, 1fr)",
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
  assert.match(script, /const railCenter = railBounds\.left \+ railBounds\.width \/ 2/);
  assert.match(script, /const centeredLeft = rail\.scrollLeft/);
  assert.match(script, /rail\.addEventListener\("scroll"/);
  assert.match(script, /scrollToDoor\(activeIndex/);
});

test("desktop portal uses a focused six-destination matrix", () => {
  assert.match(css, /@media \(min-width: 768px\)/);
  assert.match(css, /grid-template-columns: repeat\(18, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.portal-academic \{[\s\S]*?grid-column: 1 \/ 7;[\s\S]*?grid-row: 1 \/ 3;/);
  assert.match(css, /\.portal-knowledge \{[\s\S]*?grid-column: 7 \/ 13;[\s\S]*?grid-row: 1;/);
  assert.match(css, /\.portal-tools \{[\s\S]*?grid-column: 13 \/ 19;[\s\S]*?grid-row: 1;/);
  assert.match(css, /\.portal-game \{[\s\S]*?grid-column: 7 \/ 11;[\s\S]*?grid-row: 2;/);
  assert.match(css, /\.portal-billiards \{[\s\S]*?grid-column: 11 \/ 15;[\s\S]*?grid-row: 2;/);
  assert.match(css, /\.portal-runner \{[\s\S]*?grid-column: 15 \/ 19;[\s\S]*?grid-row: 2;/);
});
