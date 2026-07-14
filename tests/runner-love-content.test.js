"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const Content = require("../assets/runner-love-content.js");
const CATALOGS = ["STAGES", "STORY_ITEMS", "STAGE_ITEM_IDS", "ROUTE_SET_PIECES", "ARRIVAL_SCENES", "COLLECTIBLES", "OBSTACLES", "ROAD_MODULES", "STAGE_PERFORMANCES", "STAGE_ENDINGS", "GAMEPLAY_EFFECTS", "INTERACTION_COMBINATIONS"];

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
  assert.equal(Object.keys(Content.INTERACTION_PROFILES).length, Content.STORY_ITEMS.length);
  assertDeepFrozen(Content, "Content");
});

test("gives every story item a concrete queryable six-dimensional interaction profile", () => {
  const seenEffects = new Set();
  const seenEvents = new Set();
  assert.deepEqual(Object.keys(Content.INTERACTION_PROFILES), Content.STORY_ITEMS.map((item) => item.id));

  Content.STORY_ITEMS.forEach((item) => {
    const profile = Content.getInteractionProfile(item.id);
    assert.strictEqual(profile, item.interactionProfile, item.id);
    assert.strictEqual(profile, Content.INTERACTION_PROFILES[item.id], item.id);
    assert.equal(profile.itemId, item.id);
    assert.equal(profile.stage, item.stage);
    assertDeepFrozen(profile, `profile.${item.id}`);

    assert.ok(Content.GAMEPLAY_EFFECTS.includes(profile.gameplay.effect), item.id);
    assert.equal(profile.gameplay.type, profile.gameplay.effect);
    assert.ok(profile.gameplay.strength > 0 && profile.gameplay.strength <= 1, item.id);
    assert.ok(profile.gameplay.durationMs >= 3000, item.id);
    Content.GAMEPLAY_EFFECTS.forEach((effect) => {
      const channel = profile.gameplay[effect];
      assert.equal(channel.active, effect === profile.gameplay.effect, `${item.id}.${effect}`);
      assert.equal(channel.strength, channel.active ? profile.gameplay.strength : 0, `${item.id}.${effect}`);
      assert.equal(channel.durationMs, channel.active ? profile.gameplay.durationMs : 0, `${item.id}.${effect}`);
    });

    assert.ok(profile.world.changeType.length > 3, item.id);
    assert.ok(profile.world.roadChange.length >= 12, item.id);
    assert.ok(profile.world.environmentChange.length >= 12, item.id);
    assert.ok(profile.music.layer.length > 3, item.id);
    assert.ok(profile.music.timbre.length > 3, item.id);
    assert.ok(profile.character.immediateAction.length >= 10, item.id);
    assert.ok(profile.character.emotion.length >= 4, item.id);
    assert.ok(profile.narrative.currentEvent.length >= 16, item.id);
    assert.ok(profile.narrative.laterEcho.length >= 16, item.id);
    assert.ok(profile.narrative.memoryTags.length >= 3, item.id);
    assert.ok(profile.synergy.combinations.length >= 1, item.id);
    profile.synergy.combinations.forEach((combination) => {
      assert.ok(combination.withItemIds.length >= 1, `${item.id}.${combination.id}`);
      combination.withItemIds.forEach((partnerId) => assert.ok(Content.INTERACTION_PROFILES[partnerId], partnerId));
    });

    seenEffects.add(profile.gameplay.effect);
    seenEvents.add(profile.narrative.currentEvent);
  });

  assert.deepEqual([...seenEffects].sort(), [...Content.GAMEPLAY_EFFECTS].sort());
  assert.equal(seenEvents.size, Content.STORY_ITEMS.length);
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

test("resolves collection context deterministically across all interaction dimensions", () => {
  const baseline = Content.resolveCollectionInteraction({
    itemId: "dropped-photo",
    collectedItemIds: [],
    combo: 0,
    stageIndex: 0
  });
  const resolved = Content.resolveCollectionInteraction({
    itemId: "dropped-photo",
    collectedItemIds: ["framed-photo", "warm-can", "framed-photo"],
    combo: 12,
    stageIndex: 0
  });
  const reordered = Content.resolveCollectionInteraction({
    itemId: "dropped-photo",
    collectedItemIds: ["warm-can", "framed-photo"],
    combo: 12,
    stageIndex: 0
  });

  assert.deepEqual(resolved, reordered);
  assertDeepFrozen(resolved, "resolved");
  assert.equal(baseline.synergy.active.length, 0);
  assert.equal(resolved.comboTier, "flow");
  assert.equal(resolved.stageRelation, "current");
  assert.equal(resolved.gameplay.effect, "magnet");
  assert.ok(resolved.gameplay.strength > baseline.gameplay.strength);
  assert.ok(resolved.gameplay.durationMs > baseline.gameplay.durationMs);
  assert.deepEqual(resolved.synergy.active.map((entry) => entry.id), ["photo-home-arc"]);
  assert.deepEqual(resolved.synergy.matchedItemIds, ["framed-photo"]);
  assert.equal(resolved.world.synergyChanges[0].changeType, "memory-gallery");
  assert.deepEqual(resolved.music.layers, ["memory-pulse", "photo-reprise"]);
  assert.equal(resolved.character.synergyActions[0].emotion, "珍惜而笃定");
  assert.ok(resolved.narrative.memoryTags.includes("照片回环"));
  assert.equal(resolved.narrative.synergyEvents[0].id, "photo-home-arc");
});

test("activates every declared combination from either participating item", () => {
  Content.INTERACTION_COMBINATIONS.forEach((combination) => {
    assert.equal(combination.itemIds.length, 2, combination.id);
    const [leftId, rightId] = combination.itemIds;
    const left = Content.resolveCollectionInteraction({ itemId: leftId, collectedItemIds: [rightId], combo: 7, stageIndex: Content.getItem(leftId).stage - 1 });
    const right = Content.resolveCollectionInteraction({ itemId: rightId, collectedItemIds: [leftId], combo: 7, stageIndex: Content.getItem(rightId).stage - 1 });
    assert.ok(left.synergy.active.some((entry) => entry.id === combination.id), `${combination.id} left`);
    assert.ok(right.synergy.active.some((entry) => entry.id === combination.id), `${combination.id} right`);
    assert.ok(left.synergy.strengthBonus > 0, combination.id);
    assert.ok(right.synergy.durationBonusMs > 0, combination.id);
  });
});

test("uses bounded combo and stage context without mutating the base profile", () => {
  const profile = Content.getInteractionProfile("paperback");
  const snapshot = JSON.stringify(profile);
  const current = Content.resolveCollectionInteraction({ itemId: "paperback", collectedItemIds: [], combo: 6, stageIndex: 1 });
  const echo = Content.resolveCollectionInteraction({ itemId: "paperback", collectedItemIds: [], combo: 6, stageIndex: 6 });
  const capped = Content.resolveCollectionInteraction({ itemId: "paperback", collectedItemIds: [], combo: 1000, stageIndex: 1 });
  const capBoundary = Content.resolveCollectionInteraction({ itemId: "paperback", collectedItemIds: [], combo: 30, stageIndex: 1 });

  assert.equal(current.comboTier, "linked");
  assert.equal(current.stageRelation, "current");
  assert.equal(echo.stageRelation, "echo");
  assert.ok(current.gameplay.strength >= echo.gameplay.strength);
  assert.equal(capped.gameplay.strength, capBoundary.gameplay.strength);
  assert.equal(capped.gameplay.durationMs, capBoundary.gameplay.durationMs);
  assert.equal(JSON.stringify(profile), snapshot);
});

test("lookups and selectors reject invalid input", () => {
  assert.strictEqual(Content.getStage(1), Content.STAGES[0]);
  assert.strictEqual(Content.getStage("toward-home"), Content.STAGES[6]);
  assert.strictEqual(Content.getCollectible(1), Content.COLLECTIBLES[0]);
  assert.throws(() => Content.getStage(8), RangeError);
  assert.throws(() => Content.getItem("missing"), RangeError);
  assert.throws(() => Content.getInteractionProfile(null), TypeError);
  assert.throws(() => Content.getInteractionProfile("missing"), RangeError);
  assert.throws(() => Content.getCollectible({}), TypeError);
  assert.throws(() => Content.getEnding("C"), RangeError);
  assert.throws(() => Content.selectStageItem({ stage: 1, seed: 0, excludeIds: "bad" }), TypeError);
  assert.throws(() => Content.selectStageItem({ stage: 1, seed: 0, excludeIds: Content.STAGE_ITEM_IDS[0] }), RangeError);
  assert.throws(() => Content.selectArrival({ stage: 8 }), RangeError);
  assert.throws(() => Content.resolveCollectionInteraction(), TypeError);
  assert.throws(() => Content.resolveCollectionInteraction({ itemId: "paperback", collectedItemIds: "record" }), TypeError);
  assert.throws(() => Content.resolveCollectionInteraction({ itemId: "paperback", collectedItemIds: ["missing"] }), RangeError);
  assert.throws(() => Content.resolveCollectionInteraction({ itemId: "paperback", combo: 1.5 }), TypeError);
  assert.throws(() => Content.resolveCollectionInteraction({ itemId: "paperback", combo: -1 }), RangeError);
  assert.throws(() => Content.resolveCollectionInteraction({ itemId: "paperback", stageIndex: "1" }), TypeError);
  assert.throws(() => Content.resolveCollectionInteraction({ itemId: "paperback", stageIndex: 7 }), RangeError);
});

test("publishes the same deeply frozen API through browser UMD", () => {
  const source = readFileSync(path.join(__dirname, "../assets/runner-love-content.js"), "utf8");
  const browser = { window: {}, globalThis: {} };
  vm.runInNewContext(source, browser, { filename: "runner-love-content.js" });
  assert.ok(browser.window.RunnerLoveContent);
  assert.deepEqual(Object.keys(browser.window.RunnerLoveContent), Object.keys(Content));
  assert.equal(browser.window.RunnerLoveContent.STORY_ITEMS.length, Content.STORY_ITEMS.length);
  assert.ok(Object.isFrozen(browser.window.RunnerLoveContent.ARRIVAL_SCENES));
  const profile = browser.window.RunnerLoveContent.getInteractionProfile("window-lamp");
  const resolved = browser.window.RunnerLoveContent.resolveCollectionInteraction({ itemId: "window-lamp", collectedItemIds: ["riverside-lamp"], combo: 9, stageIndex: 6 });
  assert.equal(profile.music.layer, "window-light");
  assert.equal(resolved.synergy.active[0].id, "lights-toward-home");
  assert.ok(Object.isFrozen(resolved.narrative.memoryTags));
});
