const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const Content = require("../assets/billiards-love-content.js");

const API_KEYS = [
  "INTENTS",
  "TIMINGS",
  "BALLS",
  "STAGES",
  "SPECIAL_EVENTS",
  "ENDINGS",
  "getBall",
  "getStage",
  "getEnding",
  "selectPerformance"
];

const EXPECTED_BALL_NAMES = [
  "对视",
  "主动搭话",
  "交换联系方式",
  "共同话题",
  "频繁聊天",
  "单独吃饭",
  "正式约会",
  "告白",
  "牵手",
  "拥抱",
  "共同旅行",
  "面对分歧",
  "沟通和好",
  "谈论未来",
  "求婚"
];

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

test("exports an immutable 15-ball narrative catalog with three distinct micro performances each", () => {
  assert.deepEqual(Object.keys(Content), API_KEYS);
  assert.equal(Content.BALLS.length, 15);
  assert.deepEqual(
    Content.BALLS.map((ball) => ball.number),
    Array.from({ length: 15 }, (_, index) => index + 1)
  );
  assert.deepEqual(Content.BALLS.map((ball) => ball.name), EXPECTED_BALL_NAMES);
  assert.equal(new Set(Content.BALLS.map((ball) => ball.id)).size, 15);
  assert.equal(new Set(Content.BALLS.map((ball) => ball.name)).size, 15);

  const variantIds = [];
  for (const ball of Content.BALLS) {
    assertText(ball.id, `ball ${ball.number}.id`);
    assertText(ball.name, `ball ${ball.number}.name`);
    assertText(ball.meaning, `ball ${ball.number}.meaning`);
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
      variantIds.push(variant.id);
      assert.ok(Object.isFrozen(variant));
    });
    assert.ok(Object.isFrozen(ball));
    assert.ok(Object.isFrozen(ball.variants));
  }

  assert.equal(new Set(variantIds).size, variantIds.length);
  assert.ok(Object.isFrozen(Content));
  assert.ok(Object.isFrozen(Content.BALLS));
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
    { S: "共度寻常", A: "仍在靠近", B: "各自珍重" }
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

test("validates lookups and selector inputs", () => {
  assert.throws(() => Content.getBall(0), RangeError);
  assert.throws(() => Content.getBall(1.5), TypeError);
  assert.throws(() => Content.getStage("missing"), RangeError);
  assert.throws(() => Content.getEnding("C"), RangeError);
  assert.throws(() => Content.selectPerformance(), TypeError);
  assert.throws(() => Content.selectPerformance({ ballNumber: 16 }), RangeError);
  assert.throws(() => Content.selectPerformance({ ballNumber: 1, intent: "passive" }), RangeError);
  assert.throws(() => Content.selectPerformance({ ballNumber: 1, timing: "soon" }), RangeError);
  assert.throws(() => Content.selectPerformance({ ballNumber: 1, seed: Number.NaN }), TypeError);
  assert.throws(() => Content.selectPerformance({ ballNumber: 1, seed: {} }), TypeError);
});

test("publishes the same API as BilliardsLoveContent in a browser UMD context", () => {
  const source = readFileSync(path.join(__dirname, "../assets/billiards-love-content.js"), "utf8");
  const browser = { window: {} };

  vm.runInNewContext(source, browser, { filename: "billiards-love-content.js" });

  const browserContent = browser.window.BilliardsLoveContent;
  assert.ok(browserContent);
  assert.deepEqual(Object.keys(browserContent), API_KEYS);
  assert.equal(browserContent.BALLS.length, 15);
  assert.equal(browserContent.STAGES.length, 7);
  assert.equal(typeof browserContent.selectPerformance, "function");
  assert.equal(
    browserContent.selectPerformance({ ballNumber: 8, intent: "active", timing: "right", seed: 4 }).eventId,
    "confession-success"
  );
});
