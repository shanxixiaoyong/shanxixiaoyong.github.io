"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const Content = require("../assets/runner-love-content.js");
const CATALOGS = ["STAGES", "STORY_ITEMS", "STAGE_ITEM_IDS", "ROUTE_SET_PIECES", "ARRIVAL_SCENES", "COLLECTIBLES", "OBSTACLES", "ROAD_MODULES", "STAGE_PERFORMANCES", "STAGE_ENDINGS"];

function assertDeepFrozen(value, label) {
  if (typeof value === "function") return;
  assert.ok(Object.isFrozen(value), `${label} must be frozen`);
  if (value && typeof value === "object") Reflect.ownKeys(value).forEach((key) => assertDeepFrozen(value[key], `${label}.${String(key)}`));
}

test("exports a complete deeply frozen seven-stage rendezvous journey", () => {
  assert.equal(Content.STAGES.length, 7);
  assert.deepEqual(Content.STAGES.map((stage) => stage.order), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(Content.STAGES.map((stage) => stage.destination), ["图书馆路口", "桥下书店", "旧城电影院", "河岸长椅", "亮灯的厨房", "河桥雨棚", "有灯的家"]);
  CATALOGS.forEach((key) => assert.ok(Content[key].length > 0, `${key} must not be empty`));
  assert.deepEqual(Object.keys(Content.FINAL_ENDINGS), ["S", "A", "B"]);
  assertDeepFrozen(Content, "Content");
});

test("gives every stage a distinct route, destination performance, and at least five physical story items", () => {
  assert.ok(Content.STORY_ITEMS.length >= 41);
  assert.equal(new Set(Content.STORY_ITEMS.map((item) => item.id)).size, Content.STORY_ITEMS.length);
  for (const stage of Content.STAGES) {
    const index = stage.order - 1;
    const ids = Content.STAGE_ITEM_IDS[index];
    assert.ok(ids.length >= 5, stage.id);
    assert.equal(Content.ROUTE_SET_PIECES[index].venues.length, 3);
    assert.equal(Content.ROUTE_SET_PIECES[index].venues.at(-1), stage.destination);
    assert.equal(Content.ARRIVAL_SCENES[index].venue, stage.destination);
    ids.forEach((id) => assert.equal(Content.getItem(id).stage, stage.order));
  }
});

test("maps obstacles, road modules, performances, and endings to valid stages", () => {
  const stageOrders = new Set(Content.STAGES.map((stage) => stage.order));
  Content.STORY_ITEMS.forEach((item) => assert.ok(stageOrders.has(item.stage)));
  Content.OBSTACLES.forEach((obstacle) => obstacle.stages.forEach((stage) => assert.ok(stageOrders.has(stage))));
  Content.ROAD_MODULES.forEach((module) => assert.ok(stageOrders.has(module.stage)));
  Content.STAGE_PERFORMANCES.forEach((performance) => {
    assert.ok(stageOrders.has(performance.stage));
    assert.ok(performance.durationMs >= 4000);
    assert.equal(typeof performance.camera, "string");
  });
  for (const grade of ["S", "A", "B"]) assert.strictEqual(Content.getEnding(grade.toLowerCase()), Content.FINAL_ENDINGS[grade]);
});

test("keeps public copy inside the fiction and avoids implementation notes", () => {
  const source = readFileSync(path.join(__dirname, "../assets/runner-love-content.js"), "utf8");
  assert.doesNotMatch(source, /子代理|前端要求|实现说明|调试 API|GitHub Pages/);
  assert.doesNotMatch(source, /Math\.random/);
  Content.STAGES.forEach((stage) => {
    assert.ok(stage.opening.length >= 18);
    assert.ok(stage.arrival.length >= 20);
    assert.ok(stage.objective.length >= 16);
  });
});

test("selectors are deterministic and arrival details depend on carried items", () => {
  const options = { stage: 4, seed: "night-route", excludeIds: ["single-flower"] };
  assert.strictEqual(Content.selectStageItem(options), Content.selectStageItem({ ...options }));
  assert.notEqual(Content.selectStageItem({ stage: 4, seed: 0 }).id, Content.selectStageItem({ stage: 4, seed: 1 }).id);

  const itemIds = Content.STAGE_ITEM_IDS[3].slice(0, 3);
  const arrival = Content.selectArrival({ stage: 4, itemIds, seed: 2 });
  assert.ok(itemIds.includes(arrival.itemId));
  assert.equal(arrival.venue, "河岸长椅");
  assert.equal(arrival.line, Content.getItem(arrival.itemId).line);
});

test("lookups and selectors reject invalid input", () => {
  assert.strictEqual(Content.getStage(1), Content.STAGES[0]);
  assert.strictEqual(Content.getStage("toward-home"), Content.STAGES[6]);
  assert.strictEqual(Content.getCollectible(1), Content.COLLECTIBLES[0]);
  assert.throws(() => Content.getStage(8), RangeError);
  assert.throws(() => Content.getItem("missing"), RangeError);
  assert.throws(() => Content.getCollectible({}), TypeError);
  assert.throws(() => Content.getEnding("C"), RangeError);
  assert.throws(() => Content.selectStageItem({ stage: 1, seed: 0, excludeIds: "bad" }), TypeError);
  assert.throws(() => Content.selectStageItem({ stage: 1, seed: 0, excludeIds: Content.STAGE_ITEM_IDS[0] }), RangeError);
  assert.throws(() => Content.selectArrival({ stage: 8 }), RangeError);
});

test("publishes the same deeply frozen API through browser UMD", () => {
  const source = readFileSync(path.join(__dirname, "../assets/runner-love-content.js"), "utf8");
  const browser = { window: {}, globalThis: {} };
  vm.runInNewContext(source, browser, { filename: "runner-love-content.js" });
  assert.ok(browser.window.RunnerLoveContent);
  assert.deepEqual(Object.keys(browser.window.RunnerLoveContent), Object.keys(Content));
  assert.equal(browser.window.RunnerLoveContent.STORY_ITEMS.length, Content.STORY_ITEMS.length);
  assert.ok(Object.isFrozen(browser.window.RunnerLoveContent.ARRIVAL_SCENES));
});
