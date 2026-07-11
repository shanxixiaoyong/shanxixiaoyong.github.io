const assert = require("node:assert/strict");
const test = require("node:test");

const physics = require("../assets/billiards-physics.js");

const STEP = 1000 / 120;

function createMovingBall(speed, direction = { x: 1, y: 0 }) {
  const engine = physics.Engine.create();
  const ball = physics.Bodies.circle(0, 0, 14.85);
  physics.Composite.add(engine.world, ball);
  physics.Body.strike(ball, {
    x: direction.x * speed,
    y: direction.y * speed
  });
  return { engine, ball };
}

test("publishes the custom continuous spin impulse engine", () => {
  assert.equal(physics.CONFIG.model, "continuous-spin-impulse");
  assert.equal(physics.CONFIG.reference, "https://github.com/tailuge/billiards");
  assert.equal(physics.CONFIG.ballRestitution, 0.925);
  assert.equal(physics.CONFIG.slidingFriction, 0.126);
  assert.equal(physics.CONFIG.rollingFriction, 0.032);
  assert.equal(physics.CONFIG.rollingSpeedDrag, 0.22);
  for (const api of ["Engine", "Bodies", "Body", "Composite", "Events"]) {
    assert.ok(physics[api], `${api} should be exported`);
  }
});

test("separates initial cloth sliding from rolling and settles deterministically", () => {
  const run = () => {
    const { engine, ball } = createMovingBall(8);
    const states = new Set();
    let steps = 0;
    while (ball.speed > 0 && steps < 2000) {
      physics.Engine.update(engine, STEP);
      states.add(ball.physics.state);
      steps += 1;
    }
    return {
      steps,
      distance: ball.position.x,
      states: [...states],
      rollAngle: ball.physics.rollAngle
    };
  };

  const first = run();
  const repeat = run();
  assert.deepEqual(repeat, first);
  assert.ok(first.states.includes("sliding"));
  assert.ok(first.states.includes("rolling"));
  assert.equal(first.states.at(-1), "stationary");
  assert.ok(first.steps >= 235 && first.steps <= 265, first.steps);
  assert.ok(first.distance >= 370 && first.distance <= 420, first.distance);
  assert.ok(first.rollAngle > 20);
});

test("uses restitution, dynamic contact friction, throw, and spin in ball collisions", () => {
  const engine = physics.Engine.create();
  const cue = physics.Bodies.circle(0, 0, 14.85);
  const object = physics.Bodies.circle(32, 0, 14.85);
  physics.Composite.add(engine.world, [cue, object]);
  physics.Body.setVelocity(cue, { x: 8, y: 2 });
  let collision = null;
  physics.Events.on(engine, "collisionStart", (event) => {
    collision ||= event.pairs.find((pair) => pair.collision.details.model === "frictional-throw");
  });

  for (let step = 0; step < 20 && !collision; step += 1) physics.Engine.update(engine, STEP);
  assert.ok(collision, "the swept substeps should find the ball collision");
  const details = collision.collision.details;
  assert.equal(details.restitution, 0.925);
  assert.ok(details.dynamicFriction > 0.01 && details.dynamicFriction < 0.118);
  assert.ok(details.normalImpulse > 0);
  assert.ok(details.tangentialImpulse < 0);
  assert.ok(details.outgoingB.x > 7);
  assert.ok(details.outgoingB.y > 0, "contact friction should create visible throw");
  assert.ok(Math.abs(cue.physics.spinZ) > 0);
  assert.ok(Math.abs(object.physics.spinZ) > 0);
});

test("models cushion restitution separately from tangential cushion grip", () => {
  const engine = physics.Engine.create();
  const ball = physics.Bodies.circle(100, 100, 14.85);
  const rail = physics.Bodies.rectangle(140, 100, 20, 200, { isStatic: true });
  rail.plugin.heartbeatRail = { id: "right", kind: "cushion" };
  physics.Composite.add(engine.world, [ball, rail]);
  physics.Body.setVelocity(ball, { x: 10, y: 2 });
  let collision = null;
  physics.Events.on(engine, "collisionStart", (event) => {
    collision ||= event.pairs.find((pair) => pair.collision.details.model === "spin-cushion");
  });

  for (let step = 0; step < 20 && !collision; step += 1) physics.Engine.update(engine, STEP);
  assert.ok(collision);
  const details = collision.collision.details;
  assert.ok(details.restitution >= 0.86 && details.restitution <= 0.91);
  assert.ok(details.tangentialRetention > 0.65 && details.tangentialRetention < 0.9);
  assert.ok(ball.velocity.x < 0);
  assert.ok(Math.abs(ball.physics.spinZ) > 0);
});

test("substeps a maximum-speed shot so balls cannot tunnel through each other", () => {
  const engine = physics.Engine.create();
  const cue = physics.Bodies.circle(0, 0, 14.85);
  const object = physics.Bodies.circle(48, 0, 14.85);
  physics.Composite.add(engine.world, [cue, object]);
  physics.Body.setVelocity(cue, { x: 42, y: 0 });
  let collisionCount = 0;
  physics.Events.on(engine, "collisionStart", (event) => {
    collisionCount += event.pairs.length;
  });

  physics.Engine.update(engine, 1000 / 60);
  assert.ok(engine.metrics.substeps >= 5);
  assert.ok(collisionCount > 0);
  assert.ok(cue.position.x < object.position.x);
  assert.ok(object.velocity.x > cue.velocity.x);
});
