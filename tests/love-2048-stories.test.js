const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const Stories = require("../assets/love-2048-stories.js");

const POSITIVE_COUNTS = { near: 10, together: 10, future: 10 };
const CONFLICT_COUNTS = { minor: 8, friction: 8, deep: 8 };
const MOODS = new Set([
  "meet", "campus", "chat", "date", "cafe",
  "rain", "street", "home", "starlight", "vow"
]);
const BACKDROPS = new Set(["rain", "cafe", "campus", "city", "home", "starlight"]);
const ATMOSPHERES = new Set([
  "rain", "cafe", "projector", "transit", "pages",
  "home", "petals", "city", "phone", "travel"
]);

function assertText(value, field, item) {
  assert.equal(typeof value, "string", `${item.id}.${field} must be a string`);
  assert.ok(value.trim(), `${item.id}.${field} must not be empty`);
}

function allCatalogItems() {
  return [
    ...Object.values(Stories.positiveBands).flat(),
    ...Object.values(Stories.conflictBands).flat()
  ];
}

test("exports complete positive bands with routable presentation values", () => {
  assert.deepEqual(Object.keys(Stories.positiveBands), Object.keys(POSITIVE_COUNTS));

  for (const [band, minimum] of Object.entries(POSITIVE_COUNTS)) {
    const items = Stories.positiveBands[band];
    assert.ok(Array.isArray(items));
    assert.ok(items.length >= minimum, `${band} needs at least ${minimum} stories`);

    for (const item of items) {
      assert.deepEqual(
        Object.keys(item).sort(),
        ["atmosphere", "backdrop", "id", "line", "mood", "title"].sort()
      );
      for (const field of ["id", "title", "line", "mood", "backdrop", "atmosphere"]) {
        assertText(item[field], field, item);
      }
      assert.ok(item.line.length >= 40 && item.line.length <= 75, `${item.id}.line length`);
      assert.ok(MOODS.has(item.mood), `${item.id}.mood is routable`);
      assert.ok(BACKDROPS.has(item.backdrop), `${item.id}.backdrop is routable`);
      assert.ok(ATMOSPHERES.has(item.atmosphere), `${item.id}.atmosphere is allowed`);
    }
  }
});

test("exports paired, restrained conflict bands at every severity", () => {
  assert.deepEqual(Object.keys(Stories.conflictBands), Object.keys(CONFLICT_COUNTS));

  for (const [severity, minimum] of Object.entries(CONFLICT_COUNTS)) {
    const items = Stories.conflictBands[severity];
    assert.ok(Array.isArray(items));
    assert.ok(items.length >= minimum, `${severity} needs at least ${minimum} stories`);

    for (const item of items) {
      assert.deepEqual(
        Object.keys(item).sort(),
        ["atmosphere", "backdrop", "id", "line", "mood", "resolution", "severity", "title"].sort()
      );
      for (const field of [
        "id", "title", "line", "resolution", "mood", "backdrop", "atmosphere", "severity"
      ]) {
        assertText(item[field], field, item);
      }
      assert.equal(item.severity, severity, `${item.id}.severity matches its band`);
      assert.ok(item.line.length >= 35 && item.line.length <= 70, `${item.id}.line length`);
      assert.ok(
        item.resolution.length >= 30 && item.resolution.length <= 65,
        `${item.id}.resolution length`
      );
      assert.ok(MOODS.has(item.mood), `${item.id}.mood is routable`);
      assert.ok(BACKDROPS.has(item.backdrop), `${item.id}.backdrop is routable`);
      assert.ok(ATMOSPHERES.has(item.atmosphere), `${item.id}.atmosphere is allowed`);
    }
  }
});

test("uses unique ids and keeps titles free of banned wording", () => {
  const items = allCatalogItems();
  const ids = items.map((item) => item.id);

  assert.equal(new Set(ids).size, ids.length);
  for (const item of items) {
    assert.doesNotMatch(item.title, /缘分|矛盾/, `${item.id}.title`);
  }
});

test("selects deterministically with injected RNG without changing source bands", () => {
  const positiveBefore = Stories.positiveBands.near.slice();
  const conflictBefore = Stories.conflictBands.deep.slice();

  assert.strictEqual(Stories.pickPositive("near", () => 0), Stories.positiveBands.near[0]);
  assert.strictEqual(Stories.pickPositive("near", () => 0.9999), Stories.positiveBands.near.at(-1));
  assert.strictEqual(Stories.pickConflict("deep", () => 0.25), Stories.conflictBands.deep[2]);
  assert.strictEqual(Stories.pickConflict("deep", () => 1), Stories.conflictBands.deep.at(-1));
  assert.deepEqual(Stories.positiveBands.near, positiveBefore);
  assert.deepEqual(Stories.conflictBands.deep, conflictBefore);
});

test("falls back stably for empty and unknown band names", () => {
  for (const band of [undefined, null, "", "missing"]) {
    assert.strictEqual(Stories.pickPositive(band, () => 0.4), Stories.positiveBands.near[4]);
    assert.strictEqual(Stories.pickConflict(band, () => 0.4), Stories.conflictBands.minor[3]);
  }
  assert.strictEqual(Stories.pickPositive("missing", () => Number.NaN), Stories.positiveBands.near[0]);
  assert.strictEqual(Stories.pickConflict("missing", () => -1), Stories.conflictBands.minor[0]);
});

test("publishes the same UMD API on window in a browser context", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "assets", "love-2048-stories.js"),
    "utf8"
  );
  const context = { window: {} };

  vm.runInNewContext(source, context);

  assert.ok(context.window.Love2048Stories);
  assert.deepEqual(
    Object.keys(context.window.Love2048Stories),
    ["positiveBands", "conflictBands", "pickPositive", "pickConflict"]
  );
});
