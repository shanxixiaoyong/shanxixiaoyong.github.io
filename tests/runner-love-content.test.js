const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const Content = require("../assets/runner-love-content.js");

const CATALOGS = ["STAGES", "COLLECTIBLES", "OBSTACLES", "ROAD_MODULES", "TOPIC_CATEGORIES", "DATE_ROUTES", "COMPANION_ACTIONS", "STAGE_PERFORMANCES", "COMPENSATION_SEGMENTS", "STAGE_ENDINGS", "NEW_GAME_PLUS_CLUES"];

function assertDeepFrozen(value, label) {
  if (typeof value === "function") return;
  assert.ok(Object.isFrozen(value), `${label} must be frozen`);
  if (value && typeof value === "object") {
    Reflect.ownKeys(value).forEach((key) => assertDeepFrozen(value[key], `${label}.${String(key)}`));
  }
}

test("exports complete, deeply frozen seven-stage content catalogs", () => {
  assert.equal(Content.STAGES.length, 7);
  assert.deepEqual(Content.STAGES.map((stage) => stage.order), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(Content.COLLECTIBLES.length, 7);
  assert.equal(Content.STAGE_PERFORMANCES.length, 7);
  assert.equal(Content.STAGE_ENDINGS.length, 7);
  assert.equal(Content.NEW_GAME_PLUS_CLUES.length, 7);
  CATALOGS.forEach((key) => assert.ok(Content[key].length > 0, `${key} must not be empty`));
  assert.deepEqual(Object.keys(Content.FINAL_ENDINGS), ["S", "A", "B"]);
  assertDeepFrozen(Content, "Content");
});

test("links collectibles, performances, short endings, obstacles, and clues to valid stages", () => {
  const stageOrders = new Set(Content.STAGES.map((stage) => stage.order));
  for (const item of [...Content.COLLECTIBLES, ...Content.STAGE_PERFORMANCES, ...Content.STAGE_ENDINGS, ...Content.NEW_GAME_PLUS_CLUES]) {
    assert.ok(stageOrders.has(item.stage), `${item.id} has a valid stage`);
  }
  for (const obstacle of Content.OBSTACLES) obstacle.stages.forEach((stage) => assert.ok(stageOrders.has(stage)));
  assert.equal(new Set(Content.COLLECTIBLES.map((item) => item.id)).size, 7);
  assert.deepEqual(Content.BOX_REVEAL.requires, Content.COLLECTIBLES.map((item) => item.id));
});

test("covers road, conversation, date, companion, compensation, endings, and final reveal contracts", () => {
  assert.ok(Content.ROAD_MODULES.length >= 7);
  assert.ok(Content.TOPIC_CATEGORIES.length >= 5);
  assert.ok(Content.DATE_ROUTES.length >= 4);
  assert.ok(Content.COMPANION_ACTIONS.length >= 6);
  assert.ok(Content.COMPENSATION_SEGMENTS.length >= 4);
  Content.DATE_ROUTES.forEach((route) => route.topicIds.forEach((id) => assert.ok(Content.TOPIC_CATEGORIES.some((topic) => topic.id === id))));
  Content.COMPENSATION_SEGMENTS.forEach((segment) => assert.ok(Content.ROAD_MODULES.some((module) => module.id === segment.moduleId)));
  for (const grade of ["S", "A", "B"]) assert.strictEqual(Content.getEnding(grade.toLowerCase()), Content.FINAL_ENDINGS[grade]);
  assert.equal(Content.BOX_REVEAL.boundary, "post-reveal");
  assert.ok(Content.BOX_REVEAL.shots.length >= 4);
  assert.match(Content.BOX_REVEAL.restraint, /不补充病因/);
});

test("keeps all pre-reveal copy in present-tense language without exposure words", () => {
  const source = readFileSync(path.join(__dirname, "../assets/runner-love-content.js"), "utf8");
  const preReveal = source.slice(0, source.indexOf("const BOX_REVEAL"));
  assert.doesNotMatch(preReveal, /回忆|曾经|从前|那一年/);
  assert.doesNotMatch(preReveal, /那时|当年|多年前|已经去世|遗物|追忆/);
  assert.doesNotMatch(source, /Math\.random/);
});

test("selectors are deterministic, seeded, and return canonical frozen entries where applicable", () => {
  const topicOptions = { categoryId: "interests", seed: "day-8" };
  assert.deepEqual(Content.selectTopic(topicOptions), Content.selectTopic({ ...topicOptions }));
  assert.notEqual(Content.selectTopic({ categoryId: "interests", seed: 0 }).prompt, Content.selectTopic({ categoryId: "interests", seed: 1 }).prompt);

  const route = Content.selectDateRoute({ stage: 3, topicId: "interests", seed: 2 });
  assert.strictEqual(route, Content.selectDateRoute({ stage: 3, topicId: "interests", seed: 2 }));
  assert.ok(route.topicIds.includes("interests"));

  const road = Content.selectRoadModule({ stage: 4, seed: "rain", excludeIds: ["straight", "fork"] });
  assert.strictEqual(road, Content.selectRoadModule({ stage: 4, seed: "rain", excludeIds: ["straight", "fork"] }));
  assert.ok(!["straight", "fork"].includes(road.id));
});

test("lookups and selectors reject invalid input", () => {
  assert.strictEqual(Content.getStage(1), Content.STAGES[0]);
  assert.strictEqual(Content.getStage("toward-home"), Content.STAGES[6]);
  assert.strictEqual(Content.getCollectible(1), Content.COLLECTIBLES[0]);
  assert.throws(() => Content.getStage(8), RangeError);
  assert.throws(() => Content.getCollectible({}), TypeError);
  assert.throws(() => Content.getEnding("C"), RangeError);
  assert.throws(() => Content.selectTopic({ categoryId: "missing", seed: 0 }), RangeError);
  assert.throws(() => Content.selectTopic({ categoryId: "daily", seed: {} }), TypeError);
  assert.throws(() => Content.selectDateRoute({ stage: 2, topicId: "daily", seed: 0 }), RangeError);
  assert.throws(() => Content.selectRoadModule({ stage: 1, excludeIds: "straight" }), TypeError);
  assert.throws(() => Content.selectRoadModule({ stage: 1, excludeIds: Content.ROAD_MODULES.map((item) => item.id) }), RangeError);
});

test("publishes the same deeply frozen API through browser UMD", () => {
  const source = readFileSync(path.join(__dirname, "../assets/runner-love-content.js"), "utf8");
  const browser = { window: {} };
  vm.runInNewContext(source, browser, { filename: "runner-love-content.js" });
  assert.ok(browser.window.RunnerLoveContent);
  assert.deepEqual(Object.keys(browser.window.RunnerLoveContent), Object.keys(Content));
  assert.equal(browser.window.RunnerLoveContent.STAGES.length, 7);
  assert.ok(Object.isFrozen(browser.window.RunnerLoveContent.BOX_REVEAL));
});
