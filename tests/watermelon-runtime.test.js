const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "../assets/watermelon-game.js"), "utf8");

test("reanchors settled fruit and clears stale contacts when the playfield resizes", () => {
  assert.match(source, /const floorDelta = worldHeight - previousHeight/);
  assert.match(source, /body\.position\.y \+ \(settled \? floorDelta : 0\)/);
  assert.match(source, /Sleeping\.set\(body, false\)/);
  assert.match(source, /data\.contacts\.clear\(\)/);
  assert.match(source, /data\.contactState = null/);
});

test("retains bounded fixed-step backlog and stops immediately for modal states", () => {
  assert.match(source, /const MAX_CATCHUP_STEPS = 8/);
  assert.match(source, /accumulator = Math\.min\(MAX_BACKLOG, accumulator \+ delta\)/);
  assert.match(source, /while \(accumulator >= STEP && steps < MAX_CATCHUP_STEPS\)/);
  assert.equal(source.includes("if (steps === 3) accumulator = 0"), false);
  assert.match(source, /if \(paused \|\| gameOver \|\| !cinematic\.hidden\) \{\s*accumulator = 0;\s*break;/);
});

test("awards precision only to a player drop hitting its original target", () => {
  assert.match(source, /data\.dropId <= 0/);
  assert.match(source, /precisionTargetId: null/);
  assert.match(source, /firstData\.precisionTargetId === secondData\.id/);
  assert.match(source, /secondData\.precisionTargetId === firstData\.id/);
  assert.equal(source.includes("firstData.precise || secondData.precise"), false);
});

test("preserves a live engine across BFCache navigation", () => {
  assert.match(source, /window\.addEventListener\("pagehide", \(event\) =>/);
  assert.match(source, /if \(event\.persisted\)/);
  assert.match(source, /window\.addEventListener\("pageshow", \(event\) =>/);
  assert.match(source, /if \(!event\.persisted \|\| destroyed\) return/);
  assert.match(source, /function destroyGame\(\)/);
});
