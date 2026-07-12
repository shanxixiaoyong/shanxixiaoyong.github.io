const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const Content = require("../assets/billiards-love-content.js");

const API_KEYS = [
  "INTENTS",
  "TIMINGS",
  "STAGE_EVENT_TYPES",
  "SHOT_ARCHETYPES",
  "SHOT_ARCHETYPE_META",
  "POCKET_DATE_SCENES",
  "BALL_DATE_MOTIFS",
  "BALLS",
  "STAGES",
  "STAGE_TRANSITIONS",
  "STAGE_EVENTS",
  "SPECIAL_EVENTS",
  "ENDINGS",
  "getBall",
  "getStage",
  "getStageTransition",
  "getStageEvents",
  "getEnding",
  "createSeededRng",
  "selectPerformance",
  "selectStageTransition",
  "selectStageEvent",
  "analyzeShot",
  "composeTableMoment",
  "selectShotStory"
];

const EXPECTED_BALL_NAMES = [
  "雨滴",
  "咖啡",
  "电影票",
  "相机",
  "路灯",
  "耳机",
  "猫",
  "心意（黑8）",
  "晚霞",
  "礼物",
  "短信",
  "公交卡",
  "星星",
  "雨伞",
  "归途"
];

const EXPECTED_POCKET_SCENES = {
  "top-left": "街角便利店",
  "top-right": "咖啡店",
  "middle-left": "电影院",
  "middle-right": "河边步道",
  "bottom-left": "地铁站",
  "bottom-right": "回家街道"
};

const OFF_TABLE_SCENES = /图书馆|家中|旅行|旅店|酒店|展馆|天台|厨房|列车|CG|场外/;

const EXPECTED_STAGE_BALLS = [
  [1, 2, 3],
  [4, 5],
  [6, 7],
  [8],
  [9, 10, 11],
  [12, 13],
  [14, 15]
];

function assertText(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string`);
  assert.ok(value.trim(), `${label} must not be empty`);
}

function assertMicroPerformance(variant, label) {
  for (const field of ["id", "camera", "visual", "line"]) {
    assertText(variant[field], `${label}.${field}`);
  }
  assert.equal(Number.isInteger(variant.durationMs), true, `${label}.durationMs must be an integer`);
  assert.ok(
    variant.durationMs >= 500 && variant.durationMs <= 2000,
    `${label}.durationMs must be between 0.5 and 2 seconds`
  );
}

function assertDeepFrozen(value, label, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  assert.ok(Object.isFrozen(value), `${label} must be frozen`);
  for (const [key, child] of Object.entries(value)) {
    assertDeepFrozen(child, `${label}.${key}`, seen);
  }
}

function assertStagePerformance(variant, label) {
  for (const field of ["id", "camera", "title", "visual", "line", "impact", "sound", "tone"]) {
    assertText(variant[field], `${label}.${field}`);
  }
  assert.equal(Number.isInteger(variant.durationMs), true, `${label}.durationMs must be an integer`);
  assert.ok(
    variant.durationMs >= 1200 && variant.durationMs <= 2000,
    `${label}.durationMs must be between 1.2 and 2 seconds`
  );
}

test("exports an immutable 15-ball date-map catalog with three table-bound performances each", () => {
  assert.deepEqual(Object.keys(Content), API_KEYS);
  assert.equal(Content.BALLS.length, 15);
  assert.equal(Content.BALL_DATE_MOTIFS.length, 15);
  assert.deepEqual(
    Content.BALLS.map((ball) => ball.number),
    Array.from({ length: 15 }, (_, index) => index + 1)
  );
  assert.deepEqual(Content.BALLS.map((ball) => ball.name), EXPECTED_BALL_NAMES);
  assert.deepEqual(Content.BALL_DATE_MOTIFS.map((motif) => motif.name), EXPECTED_BALL_NAMES);
  assert.deepEqual(Content.BALL_DATE_MOTIFS.map((motif) => motif.ballNumber), Content.BALLS.map((ball) => ball.number));
  assert.deepEqual(Content.BALL_DATE_MOTIFS.map((motif) => motif.number), Content.BALLS.map((ball) => ball.number));
  assert.equal(new Set(Content.BALLS.map((ball) => ball.id)).size, 15);
  assert.equal(new Set(Content.BALLS.map((ball) => ball.name)).size, 15);

  const variantIds = [];
  for (const [ballIndex, ball] of Content.BALLS.entries()) {
    const motif = Content.BALL_DATE_MOTIFS[ballIndex];
    assertText(ball.id, `ball ${ball.number}.id`);
    assertText(ball.name, `ball ${ball.number}.name`);
    assertText(ball.meaning, `ball ${ball.number}.meaning`);
    assert.equal(ball.id, motif.id);
    assert.equal(ball.name, motif.name);
    assert.equal(ball.meaning, motif.meaning);
    assert.doesNotMatch(JSON.stringify({ ball, motif }), OFF_TABLE_SCENES);
    assert.ok(ball.stage >= 1 && ball.stage <= 7, `ball ${ball.number}.stage`);
    assert.equal(Content.getStage(ball.stage).id, ball.stageId);
    assert.ok(ball.variants.length >= 3, `ball ${ball.number} needs at least three variants`);
    assert.equal(
      new Set(ball.variants.map((variant) => variant.line)).size,
      ball.variants.length,
      `ball ${ball.number} lines must be unique`
    );
    assert.equal(
      new Set(ball.variants.map((variant) => variant.camera)).size,
      ball.variants.length,
      `ball ${ball.number} shots must be unique`
    );

    ball.variants.forEach((variant, index) => {
      assertMicroPerformance(variant, `ball ${ball.number}.variants[${index}]`);
      for (const field of ["pocketId", "scene", "motif", "motion"]) {
        assertText(variant[field], `ball ${ball.number}.variants[${index}].${field}`);
      }
      assert.equal(variant.scene, EXPECTED_POCKET_SCENES[variant.pocketId]);
      assert.equal(variant.motif, ball.name);
      assert.match(variant.visual, /同一张球桌/);
      assert.doesNotMatch(`${variant.visual}${variant.line}${variant.motion}`, OFF_TABLE_SCENES);
      variantIds.push(variant.id);
      assert.ok(Object.isFrozen(variant));
    });
    assert.ok(Object.isFrozen(ball));
    assert.ok(Object.isFrozen(ball.variants));
  }

  assert.equal(new Set(variantIds).size, variantIds.length);
  assert.deepEqual(
    Object.fromEntries(Content.POCKET_DATE_SCENES.map((scene) => [scene.pocketId, scene.name])),
    EXPECTED_POCKET_SCENES
  );
  assert.equal(Content.POCKET_DATE_SCENES.length, 6);
  assert.equal(new Set(Content.POCKET_DATE_SCENES.map((scene) => scene.pocketId)).size, 6);
  for (const scene of Content.POCKET_DATE_SCENES) {
    for (const field of ["id", "name", "tableZone", "light", "detail"]) {
      assertText(scene[field], `${scene.pocketId}.${field}`);
    }
  }
  assert.ok(Object.isFrozen(Content));
  assert.ok(Object.isFrozen(Content.BALLS));
  assertDeepFrozen(Content, "Content");
});

test("covers all 15 balls exactly once across seven fully described stages", () => {
  assert.equal(Content.STAGES.length, 7);
  assert.deepEqual(Content.STAGES.map((stage) => stage.order), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(Content.STAGES.map((stage) => stage.ballNumbers), EXPECTED_STAGE_BALLS);
  assert.deepEqual(
    Content.STAGES.flatMap((stage) => stage.ballNumbers),
    Array.from({ length: 15 }, (_, index) => index + 1)
  );

  for (const stage of Content.STAGES) {
    for (const field of ["id", "name", "environment", "lighting", "enterLine", "completeLine"]) {
      assertText(stage[field], `stage ${stage.order}.${field}`);
    }
    assertText(stage.poses.player, `stage ${stage.order}.poses.player`);
    assertText(stage.poses.partner, `stage ${stage.order}.poses.partner`);
    assert.ok(stage.musicLayers.length >= 2, `stage ${stage.order} needs layered music`);
    stage.musicLayers.forEach((layer, index) => assertText(layer, `stage ${stage.order}.musicLayers[${index}]`));
    assert.match(`${stage.environment}${stage.poses.player}${stage.poses.partner}`, /球桌|桌面|台呢|桌边/);
    assert.doesNotMatch(JSON.stringify(stage), OFF_TABLE_SCENES);
    assert.strictEqual(Content.getStage(stage.order), stage);
    assert.strictEqual(Content.getStage(stage.id), stage);
    for (const ballNumber of stage.ballNumbers) {
      const ball = Content.getBall(ballNumber);
      assert.equal(ball.stage, stage.order);
      assert.equal(ball.stageId, stage.id);
    }
    assert.ok(Object.isFrozen(stage));
    assert.ok(Object.isFrozen(stage.poses));
    assert.ok(Object.isFrozen(stage.musicLayers));
  }
});

test("preserves physical shot telemetry classification for table-map motion", () => {
  const cases = [
    ["gentle", { pottedNumbers: [1], pottedDetails: [{ entrySpeed: 2, travel: 120, railHits: 0, jawHits: 0, mouthEntries: 1 }], launchPower: 0.24 }],
    ["power", { pottedNumbers: [1], pottedDetails: [{ entrySpeed: 8, travel: 180, railHits: 0, jawHits: 0, mouthEntries: 1 }], launchPower: 0.9 }],
    ["bank", { pottedNumbers: [1], pottedDetails: [{ entrySpeed: 5, travel: 240, railHits: 1, jawHits: 0, mouthEntries: 1 }], launchPower: 0.55 }],
    ["long", { pottedNumbers: [1], pottedDetails: [{ entrySpeed: 5, travel: 440, railHits: 0, jawHits: 0, mouthEntries: 1 }], launchPower: 0.55 }],
    ["combo", { pottedNumbers: [1], pottedDetails: [{ entrySpeed: 5, travel: 220, railHits: 0, jawHits: 0, mouthEntries: 1 }], objectContacts: 2, launchPower: 0.55 }],
    ["rattle", { pottedNumbers: [1], pottedDetails: [{ entrySpeed: 3, travel: 180, railHits: 2, jawHits: 2, mouthEntries: 1 }], launchPower: 0.5 }],
    ["multi", { pottedNumbers: [1, 2], launchPower: 0.5 }],
    ["near", { nearMiss: true }],
    ["scratch", { cueScratch: true }]
  ];

  for (const [expected, telemetry] of cases) {
    const analysis = Content.analyzeShot(telemetry);
    assert.equal(analysis.id, expected);
    assertText(analysis.label, `${expected}.label`);
    assertText(analysis.gesture, `${expected}.gesture`);
    assert.equal(Object.isFrozen(analysis), true);
    assert.equal(Object.isFrozen(analysis.modifiers), true);
  }
});

test("composes deterministic pocket scenes and table-only shot interactions", () => {
  const momentOptions = {
    ballNumber: 4,
    pocketId: "middle-right",
    archetype: "bank",
    stage: 2,
    seed: "same-table"
  };
  const moment = Content.composeTableMoment(momentOptions);
  assert.deepEqual(moment, Content.composeTableMoment(momentOptions));
  assert.equal(moment.scene, "河边步道");
  assert.equal(moment.motif, "相机");
  assert.equal(moment.pocketId, "middle-right");
  assert.equal(moment.archetype, "bank");
  assert.equal(moment.stageId, "growing-familiar");
  for (const field of ["title", "line", "scene", "motif", "motion", "interaction", "camera"]) {
    assertText(moment[field], `moment.${field}`);
  }
  assert.match(`${moment.line}${moment.motion}${moment.interaction}`, /桌面|球桌|台呢|袋口|库边/);
  assert.doesNotMatch(JSON.stringify(moment), OFF_TABLE_SCENES);
  assert.ok(moment.durationMs >= 1200 && moment.durationMs <= 1800);
  assert.equal(Object.hasOwn(moment, "prop"), false);
  assertDeepFrozen(moment, "moment");

  const seededMoments = [0, 1, 2].map((seed) => Content.composeTableMoment({
    ...momentOptions,
    seed
  }));
  assert.equal(new Set(seededMoments.map((item) => item.variantIndex)).size, 3);
  assert.equal(new Set(seededMoments.map((item) => item.line)).size, 3);

  for (const archetype of Object.values(Content.SHOT_ARCHETYPES)) {
    const item = Content.composeTableMoment({ ...momentOptions, archetype });
    assert.ok(item.durationMs >= 1200 && item.durationMs <= 1800, `${archetype}.durationMs`);
  }

  const performance = Content.selectPerformance({ ballNumber: 4, seed: 1 });
  const early = Content.selectShotStory({
    stage: 1,
    storyNumber: 4,
    pocketId: "middle-right",
    archetype: "bank",
    performance
  });
  const familiar = Content.selectShotStory({
    stage: 2,
    storyNumber: 4,
    pocketId: "middle-right",
    archetype: "bank",
    performance
  });

  assert.equal(early.archetype, "bank");
  assert.equal(early.technique, "借库入袋 · 绕路抵达");
  assert.equal(early.gesture, "reach");
  assert.equal(familiar.title, "河边步道 · 相机");
  assert.equal(familiar.scene, "河边步道");
  assert.equal(familiar.motif, "相机");
  assert.equal(Object.hasOwn(familiar, "prop"), false);
  assert.notEqual(early.emotionLine, familiar.emotionLine);
  assert.ok(familiar.durationMs >= 1200 && familiar.durationMs <= 1800);
  assert.equal(Object.isFrozen(familiar), true);
});

test("provides four richly specified full-screen transitions for every stage", () => {
  const expectedNextStageIds = Content.STAGES.map((stage, index) => Content.STAGES[index + 1]?.id || null);
  const transitionIds = [];

  assert.equal(Content.STAGE_TRANSITIONS.length, 7);
  assert.deepEqual(Content.STAGE_TRANSITIONS.map((item) => item.stage), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(Content.STAGE_TRANSITIONS.map((item) => item.stageId), Content.STAGES.map((stage) => stage.id));
  assert.deepEqual(Content.STAGE_TRANSITIONS.map((item) => item.nextStageId), expectedNextStageIds);

  for (const transition of Content.STAGE_TRANSITIONS) {
    const label = `stage ${transition.stage} transition`;
    assert.strictEqual(Content.getStageTransition(transition.stage), transition);
    assert.strictEqual(Content.getStageTransition(transition.stageId), transition);
    assert.ok(transition.variants.length >= 4, `${label} needs at least four variants`);
    assert.equal(new Set(transition.variants.map((variant) => variant.title)).size, transition.variants.length);
    assert.equal(new Set(transition.variants.map((variant) => variant.line)).size, transition.variants.length);

    transition.variants.forEach((variant, index) => {
      const variantLabel = `${label}.variants[${index}]`;
      for (const field of ["id", "scene", "kicker", "title", "line", "visual", "sound", "tone"]) {
        assertText(variant[field], `${variantLabel}.${field}`);
      }
      assert.equal(Number.isInteger(variant.durationMs), true, `${variantLabel}.durationMs`);
      assert.ok(variant.durationMs >= 1200 && variant.durationMs <= 2000, `${variantLabel} duration`);
      assert.ok(variant.backgroundKeywords.length >= 3, `${variantLabel} needs background keywords`);
      variant.backgroundKeywords.forEach((keyword, keywordIndex) => {
        assertText(keyword, `${variantLabel}.backgroundKeywords[${keywordIndex}]`);
      });
      transitionIds.push(variant.id);
    });
    assertDeepFrozen(transition, label);
  }

  assert.equal(transitionIds.length, 28);
  assert.equal(new Set(transitionIds).size, transitionIds.length);
  assertDeepFrozen(Content.STAGE_TRANSITIONS, "STAGE_TRANSITIONS");
});

test("covers misses, cue-ball scratches, and setup beats in every relationship stage", () => {
  const expectedTypes = Object.values(Content.STAGE_EVENT_TYPES);
  const eventIds = [];
  let eventCount = 0;

  assert.deepEqual(Content.STAGE_EVENT_TYPES, { MISS: "miss", SCRATCH: "scratch", SETUP: "setup" });
  assert.equal(Content.STAGE_EVENTS.length, 7);
  assert.deepEqual(Content.STAGE_EVENTS.map((item) => item.stage), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(Content.STAGE_EVENTS.map((item) => item.stageId), Content.STAGES.map((stage) => stage.id));

  for (const catalog of Content.STAGE_EVENTS) {
    const label = `stage ${catalog.stage} events`;
    assert.strictEqual(Content.getStageEvents(catalog.stage), catalog);
    assert.strictEqual(Content.getStageEvents(catalog.stageId), catalog);
    assert.deepEqual(Object.keys(catalog.events), expectedTypes);
    assert.ok(catalog.events.miss.length >= 4, `${label} needs four miss beats`);
    assert.ok(catalog.events.scratch.length >= 3, `${label} needs three scratch beats`);
    assert.ok(catalog.events.setup.length >= 3, `${label} needs three setup beats`);

    for (const eventType of expectedTypes) {
      const variants = catalog.events[eventType];
      assert.equal(new Set(variants.map((variant) => variant.line)).size, variants.length);
      assert.equal(new Set(variants.map((variant) => variant.impact)).size, variants.length);
      variants.forEach((variant, index) => {
        assertStagePerformance(variant, `${label}.${eventType}[${index}]`);
        assert.doesNotMatch(
          `${variant.title}${variant.visual}${variant.line}${variant.impact}`,
          /你应该|你必须|务必|切记|正确做法/,
          `${variant.id} must stay observational rather than preachy`
        );
        eventIds.push(variant.id);
        eventCount += 1;
      });
    }
    assertDeepFrozen(catalog, label);
  }

  assert.equal(eventCount, 70);
  assert.equal(new Set(eventIds).size, eventIds.length);
  assertDeepFrozen(Content.STAGE_EVENTS, "STAGE_EVENTS");
});

test("contains every required relationship branch and restrained S, A, and B endings", () => {
  const expectedEvents = {
    confessionSuccess: "告白成功",
    confessionTooEarly: "告白过早",
    feelingsExposed: "心意意外暴露",
    proposalSuccess: "求婚成功",
    commitmentTooHeavy: "承诺过重",
    losingContact: "渐渐失去联系"
  };
  assert.deepEqual(Object.keys(Content.SPECIAL_EVENTS), Object.keys(expectedEvents));
  assert.deepEqual(Content.SPECIAL_EVENTS.confessionSuccess.ballNumbers, [8]);
  assert.deepEqual(Content.SPECIAL_EVENTS.confessionTooEarly.ballNumbers, [8]);
  assert.deepEqual(Content.SPECIAL_EVENTS.feelingsExposed.ballNumbers, [8]);
  assert.deepEqual(Content.SPECIAL_EVENTS.proposalSuccess.ballNumbers, [15]);
  assert.deepEqual(Content.SPECIAL_EVENTS.commitmentTooHeavy.ballNumbers, [15]);
  assert.deepEqual(Content.SPECIAL_EVENTS.losingContact.ballNumbers, [11, 12, 13, 14]);

  const eventVariantIds = [];
  for (const [key, title] of Object.entries(expectedEvents)) {
    const event = Content.SPECIAL_EVENTS[key];
    assert.equal(event.title, title);
    assertText(event.id, `${key}.id`);
    assertText(event.kind, `${key}.kind`);
    assert.ok(event.ballNumbers.length > 0, `${key}.ballNumbers`);
    assert.ok(event.variants.length >= 3, `${key} needs variants`);
    event.variants.forEach((variant, index) => {
      assertMicroPerformance(variant, `${key}.variants[${index}]`);
      eventVariantIds.push(variant.id);
    });
    assert.ok(Object.isFrozen(event));
  }
  assert.equal(new Set(eventVariantIds).size, eventVariantIds.length);

  assert.deepEqual(Object.keys(Content.ENDINGS), ["S", "A", "B"]);
  assert.deepEqual(
    Object.fromEntries(Object.entries(Content.ENDINGS).map(([grade, ending]) => [grade, ending.title])),
    { S: "灯火长明", A: "并肩归途", B: "慢慢走完" }
  );
  for (const grade of ["S", "A", "B"]) {
    const ending = Content.ENDINGS[grade];
    assert.equal(ending.grade, grade);
    for (const field of ["id", "title", "scene", "line", "epilogue"]) {
      assertText(ending[field], `ending ${grade}.${field}`);
    }
    assert.ok(ending.musicLayers.length >= 2);
    assert.strictEqual(Content.getEnding(grade.toLowerCase()), ending);
    assert.ok(Object.isFrozen(ending));
  }
});

test("routes confession, proposal, and fading-contact beats from intent and timing", () => {
  const select = (ballNumber, intent, timing) => Content.selectPerformance({
    ballNumber,
    intent,
    timing,
    seed: "route-check"
  });

  assert.equal(select(8, "active", "right").eventId, "confession-success");
  assert.equal(select(8, "active", "early").eventId, "confession-too-early");
  assert.equal(select(8, "accidental", "right").eventId, "feelings-exposed");
  assert.equal(select(15, "active", "right").eventId, "proposal-success");
  assert.equal(select(15, "active", "early").eventId, "commitment-too-heavy");
  assert.equal(select(15, "accidental", "late").eventId, "commitment-too-heavy");
  assert.equal(select(13, "accidental", "late").eventId, "losing-contact");
  assert.equal(select(13, "active", "late").eventId, null);
  assert.equal(select(5, "accidental", "right").eventId, null);
});

test("selects deterministically without Math.random and lets seed rotate variants", () => {
  const options = {
    ballNumber: 5,
    intent: Content.INTENTS.ACTIVE,
    timing: Content.TIMINGS.RIGHT,
    seed: "same-night"
  };
  const source = readFileSync(path.join(__dirname, "../assets/billiards-love-content.js"), "utf8");
  assert.doesNotMatch(source, /Math\.random/);
  assert.deepEqual(Content.selectPerformance(options), Content.selectPerformance({ ...options }));

  const selected = [0, 1, 2].map((seed) => Content.selectPerformance({
    ballNumber: 5,
    intent: "active",
    timing: "right",
    seed
  }));
  assert.equal(new Set(selected.map((performance) => performance.id)).size, 3);
  selected.forEach((performance) => {
    assert.equal(performance.ballNumber, 5);
    assert.equal(performance.stage, 2);
    assertMicroPerformance(performance, `selected ${performance.id}`);
    assert.ok(Object.isFrozen(performance));
  });

  const activeEarly = Content.selectPerformance({ ballNumber: 4, intent: "active", timing: "early", seed: 0 });
  const accidentalEarly = Content.selectPerformance({ ballNumber: 4, intent: "accidental", timing: "early", seed: 0 });
  const activeRight = Content.selectPerformance({ ballNumber: 4, intent: "active", timing: "right", seed: 0 });
  assert.notEqual(activeEarly.id, accidentalEarly.id);
  assert.notEqual(activeEarly.id, activeRight.id);
});

test("selects stage transitions and stage events reproducibly from a seed or injected RNG", () => {
  for (const stage of Content.STAGES) {
    const transitionCatalog = Content.getStageTransition(stage.order);
    const transitions = transitionCatalog.variants.map((_, seed) => Content.selectStageTransition({
      stage: stage.id,
      seed
    }));
    assert.equal(new Set(transitions.map((variant) => variant.id)).size, transitionCatalog.variants.length);
    assert.deepEqual(
      Content.selectStageTransition({ stage: stage.id, seed: "chapter-night" }),
      Content.selectStageTransition({ stage: stage.order, seed: "chapter-night" })
    );
    transitions.forEach((variant) => {
      assert.equal(variant.kind, "stage-transition");
      assert.equal(variant.stage, stage.order);
      assert.equal(variant.stageId, stage.id);
      assertText(variant.kicker, `${variant.id}.kicker`);
      assertDeepFrozen(variant, `selected ${variant.id}`);
    });

    for (const eventType of Object.values(Content.STAGE_EVENT_TYPES)) {
      const variants = Content.getStageEvents(stage.order).events[eventType];
      const selected = variants.map((_, seed) => Content.selectStageEvent({
        stage: stage.order,
        eventType,
        seed
      }));
      assert.equal(new Set(selected.map((variant) => variant.id)).size, variants.length);
      assert.deepEqual(
        Content.selectStageEvent({ stage: stage.order, eventType, seed: "same-shot" }),
        Content.selectStageEvent({ stage: stage.id, type: eventType, seed: "same-shot" })
      );
      selected.forEach((variant) => {
        assert.equal(variant.kind, "stage-event");
        assert.equal(variant.eventType, eventType);
        assert.equal(variant.stageId, stage.id);
        assertText(variant.kicker, `${variant.id}.kicker`);
        assertStagePerformance(variant, `selected ${variant.id}`);
        assertDeepFrozen(variant, `selected ${variant.id}`);
      });
    }
  }

  const rngA = Content.createSeededRng("one-complete-run");
  const rngB = Content.createSeededRng("one-complete-run");
  const run = (rng) => Array.from({ length: 14 }, (_, index) => Content.selectStageEvent({
    stage: index % 7 + 1,
    eventType: index % 2 ? Content.STAGE_EVENT_TYPES.SETUP : Content.STAGE_EVENT_TYPES.MISS,
    rng
  }).id);
  assert.deepEqual(run(rngA), run(rngB));
  assert.ok(Object.isFrozen(rngA));
  assert.ok(Object.isFrozen(rngB));

  assert.equal(Content.selectPerformance({ ballNumber: 5, rng: () => 0 }).id, Content.BALLS[4].variants[0].id);
  assert.equal(
    Content.selectStageTransition({ stage: 1, rng: () => 0.999999 }).id,
    Content.STAGE_TRANSITIONS[0].variants.at(-1).id
  );
  assert.equal(
    Content.selectStageEvent({ stage: 1, eventType: "scratch", rng: () => 0 }).id,
    Content.STAGE_EVENTS[0].events.scratch[0].id
  );
});

test("validates lookups and selector inputs", () => {
  assert.throws(() => Content.getBall(0), RangeError);
  assert.throws(() => Content.getBall(1.5), TypeError);
  assert.throws(() => Content.getStage("missing"), RangeError);
  assert.throws(() => Content.getStageTransition("missing"), RangeError);
  assert.throws(() => Content.getStageEvents(8), RangeError);
  assert.throws(() => Content.getEnding("C"), RangeError);
  assert.throws(() => Content.createSeededRng(Number.NaN), TypeError);
  assert.throws(() => Content.createSeededRng({}), TypeError);
  assert.throws(() => Content.selectPerformance(), TypeError);
  assert.throws(() => Content.selectPerformance({ ballNumber: 16 }), RangeError);
  assert.throws(() => Content.selectPerformance({ ballNumber: 1, intent: "passive" }), RangeError);
  assert.throws(() => Content.selectPerformance({ ballNumber: 1, timing: "soon" }), RangeError);
  assert.throws(() => Content.selectPerformance({ ballNumber: 1, seed: Number.NaN }), TypeError);
  assert.throws(() => Content.selectPerformance({ ballNumber: 1, seed: {} }), TypeError);
  assert.throws(() => Content.selectPerformance({ ballNumber: 1, seed: 0, rng: () => 0 }), TypeError);
  assert.throws(() => Content.selectPerformance({ ballNumber: 1, rng: null }), TypeError);
  assert.throws(() => Content.selectPerformance({ ballNumber: 1, rng: () => 1 }), RangeError);
  assert.throws(() => Content.selectStageTransition(), TypeError);
  assert.throws(() => Content.selectStageTransition({ stage: "missing" }), RangeError);
  assert.throws(() => Content.selectStageTransition({ stage: 1, seed: 0, rng: () => 0 }), TypeError);
  assert.throws(() => Content.selectStageEvent(), TypeError);
  assert.throws(() => Content.selectStageEvent({ stage: 1 }), RangeError);
  assert.throws(() => Content.selectStageEvent({ stage: 1, eventType: "foul" }), RangeError);
  assert.throws(() => Content.selectStageEvent({ stage: 1, eventType: "miss", rng: () => -0.1 }), RangeError);
  assert.throws(() => Content.selectStageEvent({ stage: 1, eventType: "miss", rng: () => Number.NaN }), RangeError);
  assert.throws(() => Content.analyzeShot([]), TypeError);
  assert.throws(() => Content.composeTableMoment([]), TypeError);
  assert.throws(() => Content.composeTableMoment({ ballNumber: 0 }), RangeError);
  assert.throws(() => Content.composeTableMoment({ ballNumber: 1, pocketId: 1 }), TypeError);
  assert.throws(() => Content.composeTableMoment({ ballNumber: 1, pocketId: "center" }), RangeError);
  assert.throws(() => Content.composeTableMoment({ ballNumber: 1, archetype: "trick" }), RangeError);
  assert.throws(() => Content.composeTableMoment({ ballNumber: 1, stage: "missing" }), RangeError);
  assert.throws(() => Content.composeTableMoment({ ballNumber: 1, seed: Number.NaN }), TypeError);
  assert.throws(() => Content.selectShotStory([]), TypeError);
  assert.throws(() => Content.selectShotStory({ stage: 1, archetype: "trick", storyNumber: 1 }), RangeError);
  assert.throws(() => Content.selectShotStory({ stage: 1, archetype: "bank", storyNumber: 16 }), RangeError);
  assert.throws(() => Content.selectShotStory({ stage: 1, archetype: "bank", storyNumber: 1, pocketId: "center" }), RangeError);
  assert.throws(() => Content.selectShotStory({ stage: 1, archetype: "bank", storyNumber: 1, seed: Number.NaN }), TypeError);
});

test("publishes the same API as BilliardsLoveContent in a browser UMD context", () => {
  const source = readFileSync(path.join(__dirname, "../assets/billiards-love-content.js"), "utf8");
  const browser = { window: {} };

  vm.runInNewContext(source, browser, { filename: "billiards-love-content.js" });

  const browserContent = browser.window.BilliardsLoveContent;
  assert.ok(browserContent);
  assert.deepEqual(Object.keys(browserContent), API_KEYS);
  assert.equal(browserContent.BALLS.length, 15);
  assert.equal(browserContent.BALL_DATE_MOTIFS.length, 15);
  assert.equal(browserContent.POCKET_DATE_SCENES.length, 6);
  assert.equal(browserContent.STAGES.length, 7);
  assert.equal(browserContent.STAGE_TRANSITIONS.length, 7);
  assert.equal(browserContent.STAGE_EVENTS.length, 7);
  assert.equal(typeof browserContent.selectPerformance, "function");
  assert.equal(typeof browserContent.selectStageTransition, "function");
  assert.equal(typeof browserContent.selectStageEvent, "function");
  assert.equal(typeof browserContent.analyzeShot, "function");
  assert.equal(typeof browserContent.composeTableMoment, "function");
  assert.equal(typeof browserContent.selectShotStory, "function");
  assert.equal(
    browserContent.composeTableMoment({
      ballNumber: 14,
      pocketId: "bottom-right",
      archetype: "gentle",
      stage: 7,
      seed: 0
    }).scene,
    "回家街道"
  );
  assert.equal(
    browserContent.selectPerformance({ ballNumber: 8, intent: "active", timing: "right", seed: 4 }).eventId,
    "confession-success"
  );
  assert.equal(browserContent.selectStageTransition({ stage: 7, seed: 0 }).stageId, "shared-future");
  assert.equal(browserContent.selectStageEvent({ stage: 2, eventType: "miss", seed: 0 }).eventType, "miss");
});
