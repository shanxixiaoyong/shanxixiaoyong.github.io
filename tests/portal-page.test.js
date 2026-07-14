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
  assert.match(html, /assets\/portal\.css\?v=portal-gallery-20260714a/);
  assert.match(html, /assets\/portal\.js\?v=portal-gallery-20260714a/);
  assert.equal(html.includes('href="assets/world.css"'), false);
  assert.equal(html.includes('class="world-hero"'), false);
  assert.equal(html.includes('class="portal-card"'), false);
});

test("homepage exposes six distinct full-bleed destinations", () => {
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
    { href: "game-2048.html", index: 3, asset: "assets/portal/heartbeat-2048-portrait-hd.jpg" },
    { href: "game-billiards-love.html", index: 4, asset: "assets/portal/billiards-chroma-portrait-hd.jpg" },
    { href: "game-runner-love.html", index: 5, asset: "assets/portal/heartbeat-runner.png" }
  ]);
  assert.equal(html.includes("data-portal-dot"), false, "progress must not ship hidden dead controls");
  for (const title of ["心动2048", "幻彩桌球", "心动跑酷"]) {
    assert.ok(html.includes(`<strong>${title}</strong>`), `${title} must have a direct homepage entry`);
  }

  for (const { asset } of doors) {
    assert.ok(html.includes(asset), `${asset} must be rendered by the portal`);
    if (fs.existsSync(path.join(root, asset))) {
      assert.ok(fs.statSync(path.join(root, asset)).size > 20000, `${asset} must be a substantive image asset`);
    }
  }
  for (const desktopAsset of ["assets/portal/heartbeat-2048-hd.jpg", "assets/portal/billiards-chroma-hd.jpg"]) {
    assert.ok(html.includes(`srcset="${desktopAsset}"`));
    assert.ok(fs.statSync(path.join(root, desktopAsset)).size > 20000);
  }
});

test("mobile portal is a snap carousel with current and next progress", () => {
  for (const token of [
    "scroll-snap-type: inline mandatory",
    "scroll-snap-align: center",
    "width: calc(100vw - 54px)",
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

test("desktop portal uses a focused expanding image gallery", () => {
  assert.match(css, /@media \(min-width: 760px\)/);
  assert.match(css, /\.portal-door\.is-active \{[\s\S]*?flex: 4\.75 1 0;/);
  assert.match(css, /\.portal-door:not\(\.is-active\) \.portal-door-copy strong \{[\s\S]*?writing-mode: vertical-rl;/);
  assert.match(css, /\.portal-rail \{[\s\S]*?gap: 1px;[\s\S]*?overflow: hidden;/);
  assert.match(script, /door\.classList\.toggle\("is-active", current\)/);
  assert.match(script, /document\.documentElement\.style\.setProperty\("--portal-active", accent\)/);
  assert.match(script, /door\.addEventListener\("pointerenter"/);
});
