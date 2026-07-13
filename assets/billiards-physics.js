(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BilliardsPhysics = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Independent implementation informed by the motion-state and impulse models
  // documented by tailuge/billiards. Velocities use table units per 1/60 second.
  const BASE_STEP_MS = 1000 / 60;
  const SPEED_TO_METERS_PER_SECOND = 0.1262;
  const EPSILON = 1e-8;
  const CONFIG = Object.freeze({
    model: "continuous-spin-impulse",
    reference: "https://github.com/tailuge/billiards",
    ballRestitution: 0.925,
    slidingFriction: 0.126,
    rollingFriction: 0.032,
    rollingSpeedDrag: 0.22,
    cushionRestitutionMin: 0.86,
    cushionRestitutionMax: 0.91,
    cushionFriction: 0.14,
    jawRestitution: 0.79,
    jawFriction: 0.19,
    stopSpeed: 0.045,
    slideToRollSpeed: 0.07,
    maxSubsteps: 10,
    solverIterations: 4
  });

  let nextBodyId = 1;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function magnitude(vector) {
    return Math.hypot(vector.x, vector.y);
  }

  function createPhysicsState() {
    return {
      state: "stationary",
      spinX: 0,
      spinY: 0,
      spinZ: 0,
      rollAngle: 0,
      rollHeading: -Math.PI / 2,
      rollSpeed: 0
    };
  }

  function createBody(shape, x, y, options) {
    const body = {
      id: nextBodyId++,
      shape,
      label: options.label || "body",
      position: { x, y },
      velocity: { x: 0, y: 0 },
      angle: Number(options.angle) || 0,
      angularVelocity: 0,
      isStatic: Boolean(options.isStatic),
      isSensor: Boolean(options.isSensor),
      restitution: Number.isFinite(options.restitution) ? options.restitution : CONFIG.ballRestitution,
      friction: Number.isFinite(options.friction) ? options.friction : 0,
      density: Number.isFinite(options.density) ? options.density : 1,
      plugin: {},
      collisionFilter: { mask: 0xffffffff },
      physics: createPhysicsState()
    };
    Object.defineProperty(body, "speed", {
      enumerable: true,
      get() {
        return magnitude(this.velocity);
      }
    });
    return body;
  }

  const Bodies = Object.freeze({
    circle(x, y, radius, options = {}) {
      const body = createBody("circle", x, y, options);
      body.circleRadius = radius;
      return body;
    },
    rectangle(x, y, width, height, options = {}) {
      const body = createBody("rectangle", x, y, options);
      body.width = width;
      body.height = height;
      return body;
    }
  });

  function assignVelocity(body, velocity, state) {
    body.velocity.x = Number(velocity.x) || 0;
    body.velocity.y = Number(velocity.y) || 0;
    if (body.speed <= CONFIG.stopSpeed) {
      body.velocity.x = 0;
      body.velocity.y = 0;
      body.physics.state = "stationary";
      body.physics.spinX = 0;
      body.physics.spinY = 0;
    } else {
      body.physics.state = state;
      if (state === "rolling") {
        body.physics.spinX = -body.velocity.y / body.circleRadius;
        body.physics.spinY = body.velocity.x / body.circleRadius;
      } else {
        body.physics.spinX = 0;
        body.physics.spinY = 0;
      }
    }
  }

  const Body = Object.freeze({
    setVelocity(body, velocity) {
      assignVelocity(body, velocity, "rolling");
    },
    strike(body, velocity) {
      assignVelocity(body, velocity, "sliding");
      body.physics.spinZ = 0;
    },
    setPosition(body, position) {
      body.position.x = Number(position.x) || 0;
      body.position.y = Number(position.y) || 0;
    },
    setAngularVelocity(body, angularVelocity) {
      body.angularVelocity = Number(angularVelocity) || 0;
      body.physics.spinZ = body.angularVelocity;
      if (body.angularVelocity === 0 && body.speed === 0) {
        body.physics.spinX = 0;
        body.physics.spinY = 0;
        body.physics.state = "stationary";
      }
    },
    setInertia() {}
  });

  function addBody(world, body) {
    if (Array.isArray(body)) {
      body.forEach((entry) => addBody(world, entry));
      return;
    }
    if (!world.bodies.includes(body)) world.bodies.push(body);
  }

  function removeBody(world, body) {
    if (Array.isArray(body)) {
      body.forEach((entry) => removeBody(world, entry));
      return;
    }
    const index = world.bodies.indexOf(body);
    if (index >= 0) world.bodies.splice(index, 1);
  }

  const Composite = Object.freeze({ add: addBody, remove: removeBody });

  const Events = Object.freeze({
    on(engine, name, listener) {
      if (!engine.events[name]) engine.events[name] = [];
      engine.events[name].push(listener);
    }
  });

  function emit(engine, name, payload) {
    (engine.events[name] || []).forEach((listener) => listener(payload));
  }

  function dynamicBallFriction(relativeMetersPerSecond) {
    return 0.01 + 0.108 * Math.exp(-1.088 * relativeMetersPerSecond);
  }

  function setStationary(body) {
    body.velocity.x = 0;
    body.velocity.y = 0;
    body.physics.spinX = 0;
    body.physics.spinY = 0;
    if (Math.abs(body.physics.spinZ) < 0.002) body.physics.spinZ = 0;
    body.physics.state = "stationary";
  }

  function applySurfaceMotion(body, dtSeconds, frameScale) {
    if (body.isStatic || body.isSensor || body.collisionFilter.mask === 0) return;
    const speed = body.speed;
    const physics = body.physics;
    const radius = body.circleRadius;
    if (speed <= CONFIG.stopSpeed) {
      setStationary(body);
      return;
    }

    const surfaceX = body.velocity.x - physics.spinY * radius;
    const surfaceY = body.velocity.y + physics.spinX * radius;
    const surfaceSpeed = Math.hypot(surfaceX, surfaceY);

    if (surfaceSpeed > CONFIG.slideToRollSpeed) {
      physics.state = "sliding";
      const decelerationPerSecond = CONFIG.slidingFriction * 9.8 / SPEED_TO_METERS_PER_SECOND;
      const deltaSpeed = Math.min(surfaceSpeed / 3.5, decelerationPerSecond * dtSeconds);
      const directionX = surfaceX / surfaceSpeed;
      const directionY = surfaceY / surfaceSpeed;
      body.velocity.x -= directionX * deltaSpeed;
      body.velocity.y -= directionY * deltaSpeed;
      physics.spinX += -directionY * (2.5 * deltaSpeed / radius);
      physics.spinY += directionX * (2.5 * deltaSpeed / radius);
    } else {
      physics.state = "rolling";
      const rollingLossPerSecond = CONFIG.rollingFriction * 9.8 / SPEED_TO_METERS_PER_SECOND
        + speed * CONFIG.rollingSpeedDrag;
      const nextSpeed = Math.max(0, speed - rollingLossPerSecond * dtSeconds);
      if (nextSpeed <= CONFIG.stopSpeed) {
        setStationary(body);
        return;
      }
      const scale = nextSpeed / speed;
      body.velocity.x *= scale;
      body.velocity.y *= scale;
      physics.spinX = -body.velocity.y / radius;
      physics.spinY = body.velocity.x / radius;
    }

    physics.spinZ *= Math.exp(-1.55 * dtSeconds);
    physics.rollHeading = Math.atan2(body.velocity.y, body.velocity.x);
    const rollIncrement = Math.hypot(physics.spinX, physics.spinY) * frameScale;
    physics.rollAngle += rollIncrement;
    physics.rollSpeed = rollIncrement / Math.max(dtSeconds, EPSILON);
    body.angularVelocity = physics.spinZ;
  }

  function resolveBallPair(bodyA, bodyB, collisions, seen) {
    if (bodyA.isSensor || bodyB.isSensor
        || bodyA.collisionFilter.mask === 0 || bodyB.collisionFilter.mask === 0) return false;
    const dx = bodyB.position.x - bodyA.position.x;
    const dy = bodyB.position.y - bodyA.position.y;
    const radius = bodyA.circleRadius + bodyB.circleRadius;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared >= radius * radius) return false;

    const distance = Math.sqrt(Math.max(distanceSquared, EPSILON));
    const normal = distance > EPSILON
      ? { x: dx / distance, y: dy / distance }
      : { x: 1, y: 0 };
    const penetration = radius - distance + 0.0001;
    bodyA.position.x -= normal.x * penetration / 2;
    bodyA.position.y -= normal.y * penetration / 2;
    bodyB.position.x += normal.x * penetration / 2;
    bodyB.position.y += normal.y * penetration / 2;

    const relativeNormal = (bodyA.velocity.x - bodyB.velocity.x) * normal.x
      + (bodyA.velocity.y - bodyB.velocity.y) * normal.y;
    if (relativeNormal <= 0) return true;

    const beforeA = { x: bodyA.velocity.x, y: bodyA.velocity.y };
    const beforeB = { x: bodyB.velocity.x, y: bodyB.velocity.y };
    const tangent = { x: -normal.y, y: normal.x };
    const relativeTangent = (bodyA.velocity.x - bodyB.velocity.x) * tangent.x
      + (bodyA.velocity.y - bodyB.velocity.y) * tangent.y
      + bodyA.circleRadius * bodyA.physics.spinZ
      + bodyB.circleRadius * bodyB.physics.spinZ;
    const normalImpulse = (1 + CONFIG.ballRestitution) * relativeNormal / 2;
    const friction = dynamicBallFriction(Math.abs(relativeTangent) * SPEED_TO_METERS_PER_SECOND);
    const tangentialLimit = Math.min(friction * normalImpulse, Math.abs(relativeTangent) / 7);
    const tangentialImpulse = -Math.sign(relativeTangent) * tangentialLimit;

    bodyA.velocity.x += -normal.x * normalImpulse + tangent.x * tangentialImpulse;
    bodyA.velocity.y += -normal.y * normalImpulse + tangent.y * tangentialImpulse;
    bodyB.velocity.x += normal.x * normalImpulse - tangent.x * tangentialImpulse;
    bodyB.velocity.y += normal.y * normalImpulse - tangent.y * tangentialImpulse;
    const spinImpulse = 2.5 * tangentialImpulse / Math.max(bodyA.circleRadius, EPSILON);
    bodyA.physics.spinZ += spinImpulse;
    bodyB.physics.spinZ += spinImpulse;
    bodyA.physics.state = "sliding";
    bodyB.physics.state = "sliding";

    const key = `b:${Math.min(bodyA.id, bodyB.id)}:${Math.max(bodyA.id, bodyB.id)}`;
    if (!seen.has(key)) {
      seen.add(key);
      collisions.push({
        bodyA,
        bodyB,
        collision: {
          normal,
          supports: [{
            x: bodyA.position.x + normal.x * bodyA.circleRadius,
            y: bodyA.position.y + normal.y * bodyA.circleRadius
          }],
          details: {
            model: "frictional-throw",
            incidentSpeed: relativeNormal,
            relativeTangent,
            normalImpulse,
            tangentialImpulse,
            dynamicFriction: friction,
            restitution: CONFIG.ballRestitution,
            incomingA: beforeA,
            incomingB: beforeB,
            outgoingA: { x: bodyA.velocity.x, y: bodyA.velocity.y },
            outgoingB: { x: bodyB.velocity.x, y: bodyB.velocity.y }
          }
        }
      });
    }
    return true;
  }

  function railGeometry(rail) {
    const cached = rail.plugin?.billiardsPhysicsGeometry;
    if (cached) return cached;
    const cosine = Math.cos(rail.angle);
    const sine = Math.sin(rail.angle);
    const halfWidth = rail.width / 2;
    const halfHeight = rail.height / 2;
    const geometry = {
      cosine,
      sine,
      halfWidth,
      halfHeight,
      extentX: Math.abs(cosine) * halfWidth + Math.abs(sine) * halfHeight,
      extentY: Math.abs(sine) * halfWidth + Math.abs(cosine) * halfHeight
    };
    if (rail.plugin) rail.plugin.billiardsPhysicsGeometry = geometry;
    return geometry;
  }

  function ballNearRectangle(ball, rail, margin = 0) {
    const geometry = railGeometry(rail);
    const reach = ball.circleRadius + margin;
    return Math.abs(ball.position.x - rail.position.x) <= geometry.extentX + reach
      && Math.abs(ball.position.y - rail.position.y) <= geometry.extentY + reach;
  }

  function closestPointOnRectangle(ball, rail) {
    const { cosine, sine, halfWidth, halfHeight } = railGeometry(rail);
    const dx = ball.position.x - rail.position.x;
    const dy = ball.position.y - rail.position.y;
    const localX = dx * cosine + dy * sine;
    const localY = -dx * sine + dy * cosine;
    const closestX = clamp(localX, -halfWidth, halfWidth);
    const closestY = clamp(localY, -halfHeight, halfHeight);
    let differenceX = localX - closestX;
    let differenceY = localY - closestY;
    let distance = Math.sqrt(differenceX * differenceX + differenceY * differenceY);
    let penetration;

    if (distance < EPSILON) {
      const gapX = halfWidth - Math.abs(localX);
      const gapY = halfHeight - Math.abs(localY);
      if (gapX < gapY) {
        differenceX = Math.sign(localX) || 1;
        differenceY = 0;
        penetration = ball.circleRadius + gapX;
      } else {
        differenceX = 0;
        differenceY = Math.sign(localY) || 1;
        penetration = ball.circleRadius + gapY;
      }
      distance = 1;
    } else {
      penetration = ball.circleRadius - distance;
    }
    if (penetration <= 0) return null;

    const normalLocalX = differenceX / distance;
    const normalLocalY = differenceY / distance;
    return {
      normal: {
        x: normalLocalX * cosine - normalLocalY * sine,
        y: normalLocalX * sine + normalLocalY * cosine
      },
      penetration
    };
  }

  function resolveRailCollision(ball, rail, collisions, seen) {
    if (ball.isSensor || ball.collisionFilter.mask === 0) return false;
    if (!ballNearRectangle(ball, rail)) return false;
    const contact = closestPointOnRectangle(ball, rail);
    if (!contact) return false;
    const { normal, penetration } = contact;
    ball.position.x += normal.x * (penetration + 0.0001);
    ball.position.y += normal.y * (penetration + 0.0001);
    const normalVelocity = ball.velocity.x * normal.x + ball.velocity.y * normal.y;
    if (normalVelocity >= 0) return true;

    const before = { x: ball.velocity.x, y: ball.velocity.y };
    const material = rail.plugin?.heartbeatRail || {};
    const kind = material.kind || "cushion";
    const incidentSpeed = -normalVelocity;
    const restitution = kind === "jaw"
      ? CONFIG.jawRestitution
      : clamp(CONFIG.cushionRestitutionMax - incidentSpeed * 0.0025,
        CONFIG.cushionRestitutionMin, CONFIG.cushionRestitutionMax);
    const friction = kind === "jaw" ? CONFIG.jawFriction : CONFIG.cushionFriction;
    const normalImpulse = (1 + restitution) * incidentSpeed;
    ball.velocity.x += normal.x * normalImpulse;
    ball.velocity.y += normal.y * normalImpulse;

    const tangent = { x: -normal.y, y: normal.x };
    const contactSlip = ball.velocity.x * tangent.x + ball.velocity.y * tangent.y
      - ball.circleRadius * ball.physics.spinZ;
    const maximumTangentialImpulse = friction * normalImpulse;
    const tangentialImpulse = clamp(-contactSlip / 3.5,
      -maximumTangentialImpulse, maximumTangentialImpulse);
    ball.velocity.x += tangent.x * tangentialImpulse;
    ball.velocity.y += tangent.y * tangentialImpulse;
    ball.physics.spinZ -= 2.5 * tangentialImpulse / Math.max(ball.circleRadius, EPSILON);
    ball.physics.state = "sliding";

    const key = `r:${ball.id}:${rail.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      const outgoingNormal = ball.velocity.x * normal.x + ball.velocity.y * normal.y;
      const outgoingTangent = ball.velocity.x * tangent.x + ball.velocity.y * tangent.y;
      const incomingTangent = before.x * tangent.x + before.y * tangent.y;
      collisions.push({
        bodyA: ball,
        bodyB: rail,
        collision: {
          normal,
          supports: [{
            x: ball.position.x - normal.x * ball.circleRadius,
            y: ball.position.y - normal.y * ball.circleRadius
          }],
          details: {
            model: kind === "jaw" ? "knuckle" : "spin-cushion",
            kind,
            incidentSpeed,
            normalImpulse,
            tangentialImpulse,
            restitution,
            tangentialRetention: Math.abs(incomingTangent) > EPSILON
              ? Math.abs(outgoingTangent / incomingTangent)
              : 1,
            incoming: before,
            outgoing: { x: ball.velocity.x, y: ball.velocity.y },
            outgoingNormalSpeed: outgoingNormal
          }
        }
      });
    }
    return true;
  }

  function updateEngine(engine, deltaMs) {
    const circles = engine.world.bodies.filter((body) => body.shape === "circle" && !body.isStatic);
    const rails = engine.world.bodies.filter((body) => body.shape === "rectangle" && body.isStatic);
    const maximumSpeed = circles.reduce((maximum, body) => Math.max(maximum, body.speed), 0);
    const minimumRadius = circles.reduce((minimum, body) => Math.min(minimum, body.circleRadius), Infinity);
    const frameScale = deltaMs / BASE_STEP_MS;
    const travel = maximumSpeed * frameScale;
    const substeps = Number.isFinite(minimumRadius)
      ? clamp(Math.ceil(travel / Math.max(minimumRadius * 0.34, 1)), 1, CONFIG.maxSubsteps)
      : 1;
    const subFrameScale = frameScale / substeps;
    const subSeconds = deltaMs / 1000 / substeps;
    const collisions = [];
    const seen = new Set();

    for (let step = 0; step < substeps; step += 1) {
      circles.forEach((body) => {
        if (body.isSensor || body.collisionFilter.mask === 0) return;
        body.position.x += body.velocity.x * subFrameScale;
        body.position.y += body.velocity.y * subFrameScale;
      });

      for (let iteration = 0; iteration < CONFIG.solverIterations; iteration += 1) {
        for (let left = 0; left < circles.length; left += 1) {
          for (let right = left + 1; right < circles.length; right += 1) {
            resolveBallPair(circles[left], circles[right], collisions, seen);
          }
        }
        circles.forEach((ball) => {
          rails.forEach((rail) => resolveRailCollision(ball, rail, collisions, seen));
        });
      }

      circles.forEach((body) => applySurfaceMotion(body, subSeconds, subFrameScale));
    }

    engine.timing.timestamp += deltaMs;
    engine.metrics.substeps = substeps;
    engine.metrics.collisionCount += collisions.length;
    if (collisions.length) emit(engine, "collisionStart", { pairs: collisions });
    return engine;
  }

  const Engine = Object.freeze({
    create() {
      return {
        world: { bodies: [] },
        gravity: { x: 0, y: 0, scale: 0 },
        positionIterations: CONFIG.solverIterations,
        velocityIterations: CONFIG.solverIterations,
        constraintIterations: 0,
        timing: { timestamp: 0 },
        metrics: { substeps: 1, collisionCount: 0 },
        events: Object.create(null)
      };
    },
    update: updateEngine
  });

  return Object.freeze({ Engine, Bodies, Body, Composite, Events, CONFIG });
});
