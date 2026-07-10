const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = readFileSync(path.join(root, "game-billiards-love.html"), "utf8");
const css = readFileSync(path.join(root, "assets/billiards-love.css"), "utf8");
const rules = readFileSync(path.join(root, "assets/billiards-love-rules.js"), "utf8");
const game = readFileSync(path.join(root, "assets/billiards-love-game.js"), "utf8");

function resourcePath(value) {
  return value.split(/[?#]/, 1)[0];
}

test("standalone page exposes the exact romantic billiards identity", () => {
  for (const token of [
    "<title>心动桌球 - 刘勇 / Yong Liu</title>",
    '<meta name="description" content="心动桌球：',
    '<body class="solo-game-billiards-love">',
    '<main class="bl-app" id="billiards-love-game" aria-label="心动桌球">',
    "<h1>心动桌球</h1>",
    'href="index.html"',
    'id="bl-canvas"',
    'id="bl-cinematic"',
    'id="bl-pause-sheet"',
    'id="bl-result"',
    'id="bl-journal-sheet"'
  ]) {
    assert.ok(html.includes(token), `missing page identity token: ${token}`);
  }
});

test("page loads only the dedicated stylesheet and ordered local scripts", () => {
  const styles = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g)]
    .map((match) => resourcePath(match[1]));
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]
    .map((match) => resourcePath(match[1]));

  assert.deepEqual(styles, ["assets/billiards-love.css"]);
  assert.deepEqual(scripts, [
    "assets/vendor/matter-0.20.0.min.js",
    "assets/billiards-love-rules.js",
    "assets/billiards-love-game.js"
  ]);
});

test("touch-first shell includes complete controls and accessible live state", () => {
  for (const id of [
    "bl-sound",
    "bl-pause",
    "bl-restart",
    "bl-resume",
    "bl-retry",
    "bl-new-night",
    "bl-journal",
    "bl-journal-close",
    "bl-scene-skip",
    "bl-scene-action"
  ]) {
    assert.match(html, new RegExp(`<button[^>]+id="${id}"`), `missing button ${id}`);
  }
  assert.match(html, /<canvas id="bl-canvas"[^>]+tabindex="0"[^>]+aria-label=/);
  assert.match(html, /id="bl-toast" role="status" aria-live="polite"/);
  assert.match(html, /id="bl-cinematic"[^>]+aria-live="polite"/);
  assert.match(html, /viewport-fit=cover/);
});

test("stylesheet locks the mobile canvas, honors safe areas, and reduces motion", () => {
  assert.match(css, /#bl-canvas\s*\{[^}]*touch-action:\s*none/s);
  assert.match(css, /\.bl-app\s*\{[^}]*height:\s*100svh/s);
  assert.match(css, /width:\s*min\(100%,\s*430px\)/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /aspect-ratio:\s*336\s*\/\s*548/);
  assert.equal(/@import\b/i.test(css), false);
});

test("all owned production sources remain static and remote-free", () => {
  for (const [file, source] of [
    ["game-billiards-love.html", html],
    ["assets/billiards-love.css", css],
    ["assets/billiards-love-rules.js", rules],
    ["assets/billiards-love-game.js", game]
  ]) {
    assert.equal(/https?:\/\//i.test(source), false, `${file} contains an external URL`);
    assert.equal(/["'`]\/\/[a-z0-9]/i.test(source), false, `${file} contains a protocol-relative URL`);
  }
  for (const networkPattern of [
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bsendBeacon\s*\(/
  ]) {
    assert.equal(networkPattern.test(`${rules}\n${game}`), false);
  }
});
