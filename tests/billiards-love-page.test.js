const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("game-billiards-love.html");
const css = read("assets/billiards-love.css");

function linked(htmlSource, tag, attribute) {
  const expression = new RegExp(`<${tag}\\b[^>]*\\b${attribute}="([^"]+)"[^>]*>`, "g");
  return [...htmlSource.matchAll(expression)].map((match) => match[1].split(/[?#]/, 1)[0]);
}

test("publishes the portrait-first standard-fifteen-ball identity", () => {
  for (const token of [
    "<title>心动桌球 - 刘勇 / Yong Liu</title>",
    '<body class="heartbeat-billiards-page">',
    '<main class="hb-app" id="heartbeat-billiards" aria-label="心动桌球"',
    '<canvas id="hb-canvas" width="1280" height="640"',
    'id="hb-relationship-track"',
    'id="hb-interest"',
    'id="hb-selected-ball"'
  ]) {
    assert.match(html, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(html, /横过来|旋转设备|手机横屏/);
  assert.match(html, /开始这一局/);
  assert.doesNotMatch(html, /今晚的片段|回忆日志|心动值|剩余回合/);
});

test("loads only the local billiards runtime dependencies in exact order", () => {
  assert.deepEqual(linked(html, "link", "href").filter((file) => file.endsWith(".css")), [
    "assets/billiards-love.css"
  ]);
  assert.deepEqual(linked(html, "script", "src"), [
    "assets/vendor/matter-0.20.0.min.js",
    "assets/billiards-love-rules.js",
    "assets/billiards-love-content.js",
    "assets/billiards-love-game.js"
  ]);
});

test("uses project-local lounge, confession, and proposal art", () => {
  for (const asset of [
    "assets/billiards-scenes/lounge-night.jpg",
    "assets/billiards-scenes/confession-night.jpg",
    "assets/billiards-scenes/proposal-dawn.jpg"
  ]) {
    assert.equal(fs.existsSync(path.join(root, asset)), true, `${asset} should exist`);
  }
  for (const reference of [
    'url("billiards-scenes/lounge-night.jpg")',
    'url("billiards-scenes/confession-night.jpg")',
    'url("billiards-scenes/proposal-dawn.jpg")'
  ]) {
    assert.match(css, new RegExp(reference.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(html + css, /https?:\/\//);
});

test("keeps gameplay full-viewport and protects a 9:16 phone portrait layout", () => {
  assert.match(css, /\.hb-app \{[\s\S]*?position: fixed;[\s\S]*?inset: 0;/);
  assert.match(css, /\.hb-table-wrap \{[\s\S]*?aspect-ratio: 2 \/ 1;/);
  assert.match(css, /@media \(max-aspect-ratio: 4 \/ 3\)/);
  assert.match(css, /width: min\(100vw, calc\(100dvh \* 9 \/ 16\)\)/);
  assert.match(css, /\.hb-table-wrap \{[\s\S]*?aspect-ratio: 1 \/ 2;/);
  assert.match(css, /#hb-canvas \{[\s\S]*?transform: rotate\(90deg\)/);
  assert.match(css, /top: calc\(max\(8px, var\(--safe-top\)\) \+ 84px\)/);
  assert.match(css, /bottom: calc\(max\(8px, var\(--safe-bottom\)\) \+ 90px\)/);
  assert.match(css, /calc\(\(100dvh - 190px\) \/ 2\)/);
  assert.doesNotMatch(css, /\.hb-rotate \{[\s\S]*?display: grid/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(css, /env\(safe-area-inset-/);
});

test("presents direct shooting and recommendation guidance without mandatory selection copy", () => {
  assert.match(html, /从白球向后拖动瞄准蓄力，松开击球/);
  assert.match(html, /第一碰球/);
  assert.doesNotMatch(html, /先点击目标球|先选中目标球/);
});

test("does not expose retired game concepts or implementation notes", () => {
  const publicSurface = `${html}\n${css}`;
  for (const retired of [
    "心动大西瓜",
    "心动俄罗斯方块",
    "心动打砖块",
    "回忆球",
    "技能道具",
    "AI对手",
    "第一版原型",
    "产品定位"
  ]) {
    assert.equal(publicSurface.includes(retired), false, `${retired} should not be public copy`);
  }
});
