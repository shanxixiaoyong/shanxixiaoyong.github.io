const assert = require("node:assert/strict");
const test = require("node:test");

const rules = require("../assets/breakout-love-rules.js");

test("ships four rectangular scene-backed levels with guarded layers and every power-up", () => {
  assert.equal(rules.WORLD_WIDTH, 393);
  assert.equal(rules.LEVELS.length, 4);
  assert.equal(new Set(rules.LEVELS.map(({ id }) => id)).size, rules.LEVELS.length);

  const effects = [];
  rules.LEVELS.forEach((level, levelIndex) => {
    assert.match(level.scene, /^assets\/love-scenes\/[a-z-]+\.webp$/);
    assert.equal(level.pattern.length >= 8, true);
    assert.deepEqual(new Set(level.pattern.map((row) => row.length)), new Set([11]));
    assert.deepEqual(level.milestones.map(({ at }) => at), [0.5, 1]);
    effects.push(...level.milestones.map(({ effect }) => effect));

    const bricks = rules.buildBricks(levelIndex);
    assert.equal(Object.isFrozen(bricks), true);
    assert.equal(bricks.length >= 40, true);
    assert.equal(bricks.some(({ maxHp }) => maxHp >= 2), true);
    assert.deepEqual(
      new Set(bricks.map(({ gift }) => gift).filter(Boolean)),
      new Set(["embrace", "echo", "courage"])
    );
    bricks.forEach((brick) => {
      assert.equal(Object.isFrozen(brick), true);
      assert.equal(brick.x >= 0, true);
      assert.equal(brick.x + brick.width <= rules.WORLD_WIDTH + Number.EPSILON, true);
      assert.equal(brick.width > 2, true);
      assert.equal(brick.height > 0, true);
    });
  });

  assert.equal(new Set(effects).size, 8, "every first-clear performance should have its own atmosphere");
  assert.equal(Object.isFrozen(rules.LEVELS), true);
  assert.equal(Object.isFrozen(rules.LEVELS[0].pattern), true);
});

test("buildBricks honors custom geometry while preserving gifts and durability", () => {
  const bricks = rules.buildBricks(0, {
    worldWidth: 330,
    side: 10,
    top: 70,
    gap: 3,
    rowGap: 4,
    height: 18
  });
  assert.equal(bricks[0].x, 10);
  assert.equal(bricks[0].y, 70);
  assert.equal(bricks[0].height, 18);
  assert.equal(bricks[0].maxHp, 2);
  assert.equal(bricks.some(({ gift }) => gift === "courage"), true);
  assert.throws(() => rules.buildBricks(0, { worldWidth: 20 }), /brick width/);
  assert.throws(() => rules.buildBricks(99), /levelIndex/);
});

test("combo scoring chains in-window hits, emits emotional beats, and resets cleanly", () => {
  let state = rules.createScoreState();
  const outcomes = [];
  for (let index = 0; index < 4; index += 1) {
    const outcome = rules.scoreBrickHit(state, {
      timestamp: 1000 + index * 180,
      levelIndex: 1,
      destroyed: true,
      armored: index % 2 === 0,
      piercing: false
    });
    outcomes.push(outcome);
    state = outcome.state;
  }

  assert.deepEqual(outcomes.map(({ combo }) => combo), [1, 2, 3, 4]);
  assert.equal(outcomes[3].moment, "句句有回声");
  assert.equal(outcomes[3].points > outcomes[0].points, true);
  assert.equal(state.totalHits, 4);

  const resetOutcome = rules.scoreBrickHit(state, {
    timestamp: state.lastHitAt + rules.COMBO_WINDOW_MS + 1,
    levelIndex: 1,
    destroyed: false,
    armored: true,
    piercing: false
  });
  assert.equal(resetOutcome.combo, 1);
  const broken = rules.breakCombo(resetOutcome.state);
  assert.equal(broken.combo, 0);
  assert.equal(broken.lastHitAt, null);
  assert.equal(broken.score, resetOutcome.state.score);

  assert.throws(() => rules.scoreBrickHit(state, {
    timestamp: 1,
    levelIndex: 0,
    destroyed: true,
    armored: false,
    piercing: false
  }), /backwards/);
});

test("clear bonuses preserve the active chain and reward remaining lives", () => {
  const hit = rules.scoreBrickHit(rules.createScoreState(), {
    timestamp: 10,
    levelIndex: 2,
    destroyed: true,
    armored: false,
    piercing: true
  });
  const healthy = rules.awardLevelClear(hit.state, 2, 3);
  const lastLife = rules.awardLevelClear(hit.state, 2, 1);
  assert.equal(healthy.points - lastLife.points, 240);
  assert.equal(healthy.state.combo, hit.state.combo);
  assert.equal(healthy.state.totalHits, hit.state.totalHits);
  assert.equal(healthy.state.score, hit.state.score + healthy.points);
});

test("milestones fire only when their threshold is crossed", () => {
  const half = rules.crossedMilestones(0, 4, 5, 10);
  assert.equal(half.length, 1);
  assert.equal(half[0].id, "opened");
  assert.equal(half[0].target, 5);
  assert.equal(half[0].key, "library-signal:opened");

  const clear = rules.crossedMilestones(0, 9, 10, 10);
  assert.equal(clear.length, 1);
  assert.equal(clear[0].id, "clear");
  assert.deepEqual(rules.crossedMilestones(0, 5, 6, 10), []);
  assert.throws(() => rules.crossedMilestones(0, 8, 7, 10), /nextDestroyed/);
});

test("circle collisions resolve faces, corners, and embedded centers", () => {
  const rect = { x: 10, y: 10, width: 20, height: 10 };
  assert.equal(rules.circleRectCollision({ x: 4, y: 4, radius: 3 }, rect), null);

  const top = rules.circleRectCollision({ x: 20, y: 7, radius: 4 }, rect);
  assert.equal(top.normalX, 0);
  assert.equal(top.normalY, -1);
  assert.equal(top.penetration, 1);

  const corner = rules.circleRectCollision({ x: 8, y: 8, radius: 3 }, rect);
  assert.equal(Math.abs(corner.normalX + Math.SQRT1_2) < 1e-9, true);
  assert.equal(Math.abs(corner.normalY + Math.SQRT1_2) < 1e-9, true);

  const embedded = rules.circleRectCollision({ x: 20, y: 15, radius: 4 }, rect);
  assert.equal(embedded.normalY, -1);
  assert.equal(embedded.penetration, 9);
});

test("reflection and paddle shaping keep the returning light moving upward", () => {
  assert.deepEqual(rules.reflectVelocity(3, 5, 0, -1), {
    velocityX: 3,
    velocityY: -5
  });
  assert.deepEqual(rules.reflectVelocity(3, -5, 0, -1), {
    velocityX: 3,
    velocityY: -5
  });

  const left = rules.paddleBounce(-1, 300);
  const center = rules.paddleBounce(0, 300);
  const right = rules.paddleBounce(1, 300);
  assert.equal(left.velocityX < 0, true);
  assert.equal(right.velocityX > 0, true);
  assert.equal(center.velocityX, 0);
  assert.equal(center.velocityY, -300);
  [left, center, right].forEach((bounce) => assert.equal(bounce.velocityY < 0, true));
});

test("volley beats and seeded launches are deterministic", () => {
  assert.equal(rules.volleyMoment(3), "话题还没有结束");
  assert.equal(rules.volleyMoment(4), null);
  assert.equal(rules.comboMoment(8), "终于说到同一句");

  const first = rules.createRng(20260711);
  const second = rules.createRng(20260711);
  assert.deepEqual(
    Array.from({ length: 8 }, () => first()),
    Array.from({ length: 8 }, () => second())
  );
});
