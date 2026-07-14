"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const Content = require("../assets/runner-love-content.js");
const CATALOGS = ["STAGES", "STORY_ITEMS", "STAGE_ITEM_IDS", "STAGE_BLUEPRINTS", "STAGE_SEGMENTS", "STAGE_DIRECTOR_SEGMENTS", "STAGE_COLLECTION_PHASES", "STAGE_PROPS", "STAGE_OBSTACLES", "STAGE_OBSTACLE_COMBINATIONS", "ROUTE_SET_PIECES", "ARRIVAL_SCENES", "COLLECTIBLES", "OBSTACLES", "ROAD_MODULES", "STAGE_PERFORMANCES", "STAGE_ENDINGS", "GAMEPLAY_EFFECTS", "INTERACTION_COMBINATIONS"];

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

test("models seven materially distinct, linked, and directly consumable stage blueprints", () => {
  const roadIdentities = new Set();
  const roadMaterials = new Set();
  const paletteDescriptions = new Set();
  const timeWeatherScripts = new Set();
  const landmarkIds = new Set();
  const obstacleIds = new Set();
  const combinationIds = new Set();

  Content.STAGE_BLUEPRINTS.forEach((blueprint, index) => {
    const stage = Content.STAGES[index];
    const expectedPreviousId = index > 0 ? Content.STAGES[index - 1].id : null;
    const expectedNextId = index < Content.STAGES.length - 1 ? Content.STAGES[index + 1].id : null;
    assert.strictEqual(Content.getStageBlueprint(stage.id), blueprint);
    assert.equal(blueprint.order, stage.order);
    assert.equal(blueprint.story.openingLine, stage.opening);
    assert.equal(blueprint.story.arrivalLine, stage.arrival);
    assert.equal(blueprint.story.continuity.previousStageId, expectedPreviousId);
    assert.equal(blueprint.story.continuity.nextStageId, expectedNextId);
    assert.ok(blueprint.story.continuity.fromPrevious.length >= 20);
    assert.ok(blueprint.story.continuity.chapterTurn.length >= 20);
    assert.ok(blueprint.story.continuity.toNext.length >= 20);
    assert.match(blueprint.visual.sceneFactoryKey, /^[a-z0-9-]+$/);
    assert.match(blueprint.visual.roadMaterialKey, /^[a-z0-9-]+$/);
    assert.match(blueprint.visual.roadProfileKey, /^[a-z0-9-]+$/);
    assert.equal(blueprint.visual.collectibleVisualKeys.length, 3);
    assert.equal(blueprint.visual.phaseWorldKeys.length, 3);
    assert.ok(blueprint.visual.introCueSequence.length >= 3);

    const opening = blueprint.openingPerformance;
    assert.ok(opening.durationMs >= 6000);
    assert.ok(opening.trigger.length >= 14);
    assert.ok(opening.beats.length >= 3);
    assert.equal(opening.beats[0].atMs, 0);
    opening.beats.forEach((beat, beatIndex) => {
      assert.ok(beat.camera.length >= 10, `${stage.id}.${beat.id}`);
      assert.ok(beat.action.length >= 16, `${stage.id}.${beat.id}`);
      assert.ok(beat.line.length >= 4, `${stage.id}.${beat.id}`);
      if (beatIndex > 0) assert.equal(beat.atMs, opening.beats[beatIndex - 1].atMs + opening.beats[beatIndex - 1].durationMs);
    });
    const lastBeat = opening.beats.at(-1);
    assert.equal(lastBeat.atMs + lastBeat.durationMs, opening.durationMs);

    const world = blueprint.world;
    assert.ok(world.sceneMood.mood.length >= 12);
    assert.ok(world.sceneMood.ambience.length >= 12);
    assert.match(world.timeWeather.start, /^\d{2}:\d{2}$/);
    assert.match(world.timeWeather.end, /^\d{2}:\d{2}$/);
    assert.ok(world.timeWeather.progression.length >= 20);
    assert.ok(world.colorPalette.transition.length >= 14);
    assert.ok(world.roadDesign.structure.length >= 20);
    assert.ok(world.roadDesign.movement.length >= 16);
    roadIdentities.add(world.roadDesign.identity);
    roadMaterials.add(world.roadDesign.material);
    paletteDescriptions.add(world.colorPalette.description);
    timeWeatherScripts.add(`${world.timeWeather.timeOfDay}|${world.timeWeather.condition}|${world.timeWeather.progression}`);

    assert.ok(world.landmarks.length >= 3);
    world.landmarks.forEach((landmark) => {
      assert.ok(!landmarkIds.has(landmark.id), landmark.id);
      landmarkIds.add(landmark.id);
      assert.ok(blueprint.segments.some((segment) => segment.id === landmark.segmentId));
      assert.ok(landmark.storyRole.length >= 8);
    });

    assert.ok(blueprint.obstacleDesign.obstacles.length >= 3);
    assert.ok(blueprint.obstacleDesign.combinations.length >= 3);
    const stageObstacleIds = new Set(blueprint.obstacleDesign.obstacles.map((obstacle) => obstacle.id));
    blueprint.obstacleDesign.obstacles.forEach((obstacle) => {
      assert.ok(!obstacleIds.has(obstacle.id), obstacle.id);
      obstacleIds.add(obstacle.id);
      assert.ok(["switch", "jump", "slide"].includes(obstacle.response));
      assert.ok(obstacle.meaning.length >= 10);
    });
    blueprint.obstacleDesign.combinations.forEach((combination) => {
      assert.ok(!combinationIds.has(combination.id), combination.id);
      combinationIds.add(combination.id);
      assert.ok(combination.obstacleIds.length >= 2);
      combination.obstacleIds.forEach((obstacleId) => assert.ok(stageObstacleIds.has(obstacleId), obstacleId));
      assert.ok(combination.storyMeaning.length >= 12);
    });

    assert.equal(blueprint.segments.length, 3);
    assert.equal(blueprint.segments[0].progress[0], 0);
    assert.equal(blueprint.segments.at(-1).progress[1], 1);
    const introducedItemIds = new Set();
    blueprint.segments.forEach((segment, segmentIndex) => {
      assert.strictEqual(Content.getStageSegment({ stage: stage.id, progress: segment.progress[0] }), segment);
      if (segmentIndex > 0) assert.equal(segment.progress[0], blueprint.segments[segmentIndex - 1].progress[1]);
      assert.ok(segment.worldChange.length >= 16);
      assert.ok(segment.roadChange.length >= 14);
      assert.ok(segment.collectibleItemIds.length >= 2);
      assert.equal(segment.visual.worldKey, blueprint.visual.phaseWorldKeys[segmentIndex]);
      assert.equal(segment.visual.collectibleVisualKey, blueprint.visual.collectibleVisualKeys[segmentIndex]);
      assert.equal(segment.visual.roadMaterialKey, blueprint.visual.roadMaterialKey);
      segment.collectibleItemIds.forEach((itemId) => introducedItemIds.add(itemId));
    });
    assert.deepEqual([...introducedItemIds].sort(), [...Content.STAGE_ITEM_IDS[index]].sort());
    const fullStageRepeats = Content.STAGE_ITEM_IDS[index].filter((itemId) => blueprint.segments.every((segment) => segment.collectibleItemIds.includes(itemId)));
    assert.deepEqual(fullStageRepeats, []);

    assert.equal(blueprint.collectionPlan.mode, "progressive-segment-pools");
    assert.equal(blueprint.collectionPlan.phases.length, blueprint.segments.length);
    blueprint.collectionPlan.phases.forEach((phase) => {
      assert.strictEqual(Content.getStageCollectionPool({ stage: stage.order, progress: phase.progress[0] }), phase);
      assert.equal(phase.props.length, phase.propIds.length);
      assert.ok(phase.props.length >= 1);
      phase.items.forEach((item) => {
        assert.ok(Content.GAMEPLAY_EFFECTS.includes(item.immediateImpact.gameplay.effect));
        assert.ok(item.immediateImpact.story.length >= 16);
        assert.ok(item.immediateImpact.world.roadChange.length >= 12);
        assert.ok(item.laterEcho.story.length >= 16);
        assert.ok(item.laterEcho.memoryTags.length >= 3);
      });
    });
    assert.equal(blueprint.props.length, 3);
    blueprint.props.forEach((prop) => {
      assert.ok(prop.storyUse.length >= 16);
      assert.ok(prop.worldResponse.length >= 10);
    });
    assert.equal(blueprint.destination.name, stage.destination);
    assert.equal(blueprint.destination.nextStageId, expectedNextId);
    assert.ok(world.landmarks.some((landmark) => landmark.id === blueprint.destination.landmarkId));
    assert.ok(blueprint.destination.storyPayoff.length >= 20);
  });

  assert.equal(roadIdentities.size, 7);
  assert.equal(roadMaterials.size, 7);
  assert.equal(paletteDescriptions.size, 7);
  assert.equal(timeWeatherScripts.size, 7);
  assert.equal(Content.STAGE_SEGMENTS.length, 21);
  assert.equal(Content.STAGE_COLLECTION_PHASES.length, 21);
  assert.equal(Content.STAGE_PROPS.length, 21);
  assert.equal(Content.STAGE_OBSTACLE_COMBINATIONS.length, 21);
});

test("publishes a complete frozen director contract for all twenty-one acts", () => {
  const requiredKeys = ["timeWindowSec", "visibleGoal", "actionGoal", "routeTopologyKey", "cameraRigKey", "rhythm", "bpm", "nextSegmentId", "storyVerb", "physicalState", "worldState"];
  const expectedRouteTopologyKeys = [
    "arcade-squeeze", "root-undulation", "crossing-converge",
    "levee-outer-curve", "bridge-groove-split", "bookstore-step-funnel",
    "station-braid", "platform-arc", "marquee-release",
    "market-slalom", "music-crowd-ring", "river-singletrack",
    "breakfast-chicane", "market-grid", "stair-switchback",
    "flyover-zigzag", "detour-boardwalk-fork", "shelter-funnel",
    "platform-paired", "memory-material-bands", "home-converge"
  ];
  const expectedCameraRigKeys = [
    "follow-column", "shoulder-beacon", "tele-crossing",
    "river-offset", "portal-low", "door-lock",
    "clock-pressure", "platform-tele", "marquee-dolly",
    "market-weave", "beat-crane", "river-breath-cam",
    "window-glance", "market-high", "stair-tilt",
    "storm-low", "fork-overhead", "shelter-tele",
    "train-parallel", "memory-match", "home-dolly"
  ];
  const flattenedSegments = Content.STAGE_BLUEPRINTS.flatMap((blueprint) => blueprint.segments);

  assert.equal(Content.STAGE_DIRECTOR_SEGMENTS.length, 21);
  assert.deepEqual(Content.STAGE_DIRECTOR_SEGMENTS.map((entry) => entry.routeTopologyKey), expectedRouteTopologyKeys);
  assert.deepEqual(Content.STAGE_DIRECTOR_SEGMENTS.map((entry) => entry.cameraRigKey), expectedCameraRigKeys);
  assert.equal(new Set(Content.STAGE_DIRECTOR_SEGMENTS.map((entry) => entry.segmentId)).size, 21);
  assert.equal(new Set(expectedRouteTopologyKeys).size, 21);
  assert.equal(new Set(expectedCameraRigKeys).size, 21);
  assertDeepFrozen(Content.STAGE_DIRECTOR_SEGMENTS, "STAGE_DIRECTOR_SEGMENTS");

  Content.STAGE_DIRECTOR_SEGMENTS.forEach((director, index) => {
    const stage = Content.STAGES[director.stage - 1];
    const stageSegment = stage.segments.find((segment) => segment.id === director.segmentId);
    const flatSegment = Content.STAGE_SEGMENTS.find((segment) => segment.id === director.segmentId);
    const blueprintSegment = flattenedSegments.find((segment) => segment.id === director.segmentId);
    requiredKeys.forEach((key) => assert.ok(Object.hasOwn(director, key), `${director.segmentId}.${key}`));
    assert.strictEqual(stageSegment.director, director, director.segmentId);
    assert.strictEqual(flatSegment.director, director, director.segmentId);
    assert.strictEqual(blueprintSegment.director, director, director.segmentId);
    assert.strictEqual(Content.getStageSegment({ stage: director.stageId, progress: blueprintSegment.progress[0] }).director, director);
    assert.equal(stage.stageProps.some((prop) => prop.id === director.visibleGoal && prop.segmentId === director.segmentId), true, director.visibleGoal);
    assert.match(director.actionGoal, /^[a-z0-9-]+$/);
    assert.match(director.storyVerb, /^[a-z0-9-]+$/);
    assert.ok(director.bpm >= 70 && director.bpm <= 140, director.segmentId);
    assert.equal(director.nextSegmentId, Content.STAGE_DIRECTOR_SEGMENTS[index + 1]?.segmentId || null);
    [director.physicalState, director.worldState].forEach((state) => {
      assert.equal(typeof state, "object");
      Object.values(state).forEach((value) => assert.match(value, /^[a-z0-9-]+$/));
    });
  });

  Content.STAGE_BLUEPRINTS.forEach((blueprint) => {
    assert.deepEqual(blueprint.segments.map((segment) => segment.director.timeWindowSec), [[0, blueprint.segments[0].director.timeWindowSec[1]], [blueprint.segments[0].director.timeWindowSec[1], blueprint.segments[1].director.timeWindowSec[1]], [blueprint.segments[1].director.timeWindowSec[1], 180]]);
  });
});

test("encodes the misalignment, listening, and shared-responsibility arc as physical consequences", () => {
  const stageFive = Content.getStageBlueprint("shared-days");
  const stageSix = Content.getStageBlueprint("rough-weather");
  const stageSeven = Content.getStageBlueprint("toward-home");

  assert.deepEqual(stageFive.segments.map((segment) => segment.director.physicalState.invariant), [
    "both-schedules-change", "key-handover-also-valid", "destinations-remain-empty"
  ]);
  stageFive.segments.forEach((segment) => {
    assert.notEqual(segment.director.worldState.onSuccess, segment.director.worldState.onStrain, segment.id);
    assert.ok(segment.director.worldState.persistent, segment.id);
  });
  assert.match(stageFive.story.arrivalLine, /厨房.*没有人.*交房点/);
  assert.match(stageFive.destination.arrivalAction, /厨房与交房点|厨房.*交房点/);
  assert.match(stageFive.destination.storyPayoff, /没有人失约/);

  assert.equal(stageSix.segments[0].director.physicalState.invariant, "ink-becomes-unreadable");
  assert.equal(stageSix.segments[1].director.actionGoal, "switch-to-shelter-side-and-hold-slow-line");
  assert.equal(stageSix.segments[2].director.actionGoal, "wait-for-partner-signal-then-move-chain-together");
  assert.equal(stageSix.segments[2].director.worldState.persistent, "repair-begun-not-resolved");
  assert.match(stageSix.destination.arrivalAction, /等待.*两个人各握一侧/);
  assert.match(stageSix.destination.storyPayoff, /没有立刻和好/);

  assert.equal(stageSeven.segments[0].director.actionGoal, "handoff-heavy-luggage-on-adjacent-lane");
  assert.equal(stageSeven.segments[0].director.physicalState.invariant, "luggage-weight-affects-stride");
  assert.equal(stageSeven.segments[2].director.actionGoal, "open-paired-locks-then-converge");
  assert.equal(stageSeven.segments[2].director.physicalState.invariant, "one-key-cannot-open-both");
  assert.match(stageSeven.destination.arrivalAction, /左锁.*右锁.*交换行李/);
  assert.deepEqual(new Set(Content.STORY_ITEMS.map((item) => item.relationshipAxis)), new Set(["attention", "mutuality", "repair"]));
  assert.equal(Content.getItem("folded-note").relationshipAxis, "repair");
  assert.equal(Content.getItem("home-key").relationshipAxis, "mutuality");
});

test("rotates collectible pools with stage progress and selects from them deterministically", () => {
  const poolSignatures = new Set();
  Content.STAGE_BLUEPRINTS.forEach((blueprint) => {
    const [early, middle, late] = blueprint.collectionPlan.phases;
    const earlyItems = new Set(early.itemIds);
    const middleItems = new Set(middle.itemIds);
    const lateItems = new Set(late.itemIds);
    assert.notDeepEqual(early.itemIds, middle.itemIds, blueprint.id);
    assert.notDeepEqual(middle.itemIds, late.itemIds, blueprint.id);
    assert.deepEqual([...earlyItems].filter((itemId) => middleItems.has(itemId) && lateItems.has(itemId)), []);

    blueprint.collectionPlan.phases.forEach((phase) => {
      const signature = phase.itemIds.join("|");
      assert.ok(!poolSignatures.has(signature), signature);
      poolSignatures.add(signature);
      const progress = (phase.progress[0] + phase.progress[1]) / 2;
      const options = { stage: blueprint.id, progress, seed: "same-run" };
      const selected = Content.selectStageProgressItem(options);
      assert.strictEqual(selected, Content.selectStageProgressItem({ ...options }));
      assert.strictEqual(selected, Content.selectStageItem({ ...options }));
      assert.ok(phase.itemIds.includes(selected.id));
      assertDeepFrozen(Content.getStageCollectionPool(options), `pool.${phase.id}`);
    });
    assert.equal(Content.getStageSegment({ stage: blueprint.id, progress: 1 }).id, blueprint.segments.at(-1).id);
  });
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
  assert.throws(() => Content.getStageBlueprint("missing"), RangeError);
  assert.throws(() => Content.getStageSegment(), TypeError);
  assert.throws(() => Content.getStageSegment({ stage: 1, progress: "0.5" }), TypeError);
  assert.throws(() => Content.getStageSegment({ stage: 1, progress: Number.NaN }), TypeError);
  assert.throws(() => Content.getStageSegment({ stage: 1, progress: -0.01 }), RangeError);
  assert.throws(() => Content.getStageCollectionPool({ stage: 1, progress: 1.01 }), RangeError);
  assert.throws(() => Content.getItem("missing"), RangeError);
  assert.throws(() => Content.getInteractionProfile(null), TypeError);
  assert.throws(() => Content.getInteractionProfile("missing"), RangeError);
  assert.throws(() => Content.getCollectible({}), TypeError);
  assert.throws(() => Content.getEnding("C"), RangeError);
  assert.throws(() => Content.selectStageItem({ stage: 1, seed: 0, excludeIds: "bad" }), TypeError);
  assert.throws(() => Content.selectStageItem({ stage: 1, seed: 0, excludeIds: Content.STAGE_ITEM_IDS[0] }), RangeError);
  assert.throws(() => Content.selectStageProgressItem({ stage: 1, progress: 0, excludeIds: "bad" }), TypeError);
  assert.throws(() => Content.selectStageProgressItem({ stage: 1, progress: 0, excludeIds: Content.STAGE_COLLECTION_PHASES[0].itemIds }), RangeError);
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
  assert.equal(browser.window.RunnerLoveContent.STAGE_BLUEPRINTS.length, 7);
  assert.ok(Object.isFrozen(browser.window.RunnerLoveContent.ARRIVAL_SCENES));
  const segment = browser.window.RunnerLoveContent.getStageSegment({ stage: "heart-spoken", progress: 0.5 });
  const pool = browser.window.RunnerLoveContent.getStageCollectionPool({ stage: "heart-spoken", progress: 0.5 });
  const profile = browser.window.RunnerLoveContent.getInteractionProfile("window-lamp");
  const resolved = browser.window.RunnerLoveContent.resolveCollectionInteraction({ itemId: "window-lamp", collectedItemIds: ["riverside-lamp"], combo: 9, stageIndex: 6 });
  assert.equal(profile.music.layer, "window-light");
  assert.equal(segment.id, "music-crowd");
  assert.ok(pool.itemIds.includes("instant-camera"));
  assert.ok(Object.isFrozen(pool.items[0].immediateImpact));
  assert.equal(resolved.synergy.active[0].id, "lights-toward-home");
  assert.ok(Object.isFrozen(resolved.narrative.memoryTags));
});
