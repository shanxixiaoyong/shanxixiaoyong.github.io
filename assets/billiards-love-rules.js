(function (root, factory) {
  const rules = factory();
  if (typeof module === "object" && module.exports) module.exports = rules;
  else root.BilliardsLoveRules = rules;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const RULES = Object.freeze({
    title: "心动桌球",
    ballRadius: 8.5,
    pocketRadius: 17,
    minPull: 8,
    maxPull: 112,
    minShotSpeed: 3.4,
    maxShotSpeed: 17.2,
    foulPenalty: 80,
    indirectFlatBonus: 60,
    combinationBonus: 75,
    multiPocketBonus: 90,
    maxAimBounces: 2
  });

  const MOMENTS = Object.freeze([
    { id: "umbrella", number: 1, name: "共伞", line: "雨声很近，你把伞悄悄偏向她。", color: "#d95f78", accent: "#ffd1da", points: 120 },
    { id: "last-train", number: 2, name: "末班车", line: "车门合上前，你们同时笑了。", color: "#d7ad55", accent: "#fff0b7", points: 135 },
    { id: "warm-cup", number: 3, name: "热可可", line: "纸杯的温度，沿着指尖停了很久。", color: "#4e9a8f", accent: "#c6fff2", points: 150 },
    { id: "shared-earbuds", number: 4, name: "一半耳机", line: "同一首歌，把两个人的夜晚叠在一起。", color: "#6e78bb", accent: "#dce0ff", points: 165 },
    { id: "film-roll", number: 5, name: "胶片留影", line: "快门落下，她没有躲开你的目光。", color: "#cf7354", accent: "#ffd9c8", points: 180 },
    { id: "midnight-call", number: 6, name: "零点来电", line: "谁都没说晚安，城市就一直亮着。", color: "#ba628f", accent: "#ffd1eb", points: 195 },
    { id: "crosswalk", number: 7, name: "等一盏灯", line: "绿灯已经亮了，你们却走得很慢。", color: "#4f9b71", accent: "#d2ffe2", points: 210 },
    { id: "rooftop-wind", number: 8, name: "天台晚风", line: "风吹乱头发，也吹散了没说完的犹豫。", color: "#4c83a5", accent: "#d2efff", points: 230 },
    { id: "sea-glow", number: 9, name: "海边微光", line: "浪退回去，牵住的手没有松开。", color: "#3b9ca5", accent: "#c8fbff", points: 250 },
    { id: "postcard", number: 10, name: "远方明信片", line: "路很远，但每一行字都在往你这边走。", color: "#b9874f", accent: "#ffe5bd", points: 270 },
    { id: "promise", number: 11, name: "认真约定", line: "没有烟花，只是一句被好好接住的话。", color: "#c6536d", accent: "#ffd0dc", points: 300 },
    { id: "dawn", number: 12, name: "一起天亮", line: "夜色退场时，你们已经站在同一边。", color: "#d8a850", accent: "#fff1b8", points: 340 }
  ].map(Object.freeze));

  const LEVELS = Object.freeze([
    {
      id: "rain-platform",
      chapter: "01",
      title: "雨夜站台",
      subtitle: "第一次并肩",
      scene: "rain",
      goal: 2,
      shots: 6,
      cue: { x: 168, y: 445 },
      moments: [
        { id: "umbrella", x: 168, y: 154 },
        { id: "last-train", x: 147, y: 188 },
        { id: "warm-cup", x: 189, y: 188 }
      ],
      completion: "雨停以前，你们终于走进了同一段路。"
    },
    {
      id: "neon-crossing",
      chapter: "02",
      title: "霓虹路口",
      subtitle: "回应正在靠近",
      scene: "neon",
      goal: 3,
      shots: 7,
      cue: { x: 168, y: 458 },
      moments: [
        { id: "shared-earbuds", x: 168, y: 148 },
        { id: "film-roll", x: 145, y: 184 },
        { id: "midnight-call", x: 191, y: 184 },
        { id: "crosswalk", x: 168, y: 220 }
      ],
      completion: "隔着车流和人群，她还是朝你走来。"
    },
    {
      id: "dawn-rooftop",
      chapter: "03",
      title: "天亮之前",
      subtitle: "答案留到清晨",
      scene: "dawn",
      goal: 4,
      shots: 8,
      cue: { x: 168, y: 462 },
      moments: [
        { id: "rooftop-wind", x: 168, y: 140 },
        { id: "sea-glow", x: 145, y: 176 },
        { id: "postcard", x: 191, y: 176 },
        { id: "promise", x: 133, y: 212 },
        { id: "dawn", x: 203, y: 212 }
      ],
      completion: "城市醒来时，你们不再需要猜测彼此的心意。"
    }
  ].map((level) => Object.freeze({
    ...level,
    cue: Object.freeze(level.cue),
    moments: Object.freeze(level.moments.map((placement) => Object.freeze(placement)))
  })));

  const MOMENT_BY_ID = new Map(MOMENTS.map((moment) => [moment.id, moment]));
  const EPSILON = 1e-7;

  function isRecord(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function assertRecord(value, label) {
    if (!isRecord(value)) throw new TypeError(`${label} must be a plain object`);
  }

  function assertFinite(value, label) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new TypeError(`${label} must be a finite number`);
    }
  }

  function assertInteger(value, label, minimum, maximum) {
    if (!Number.isSafeInteger(value)) throw new TypeError(`${label} must be an integer`);
    if (value < minimum || value > maximum) {
      throw new RangeError(`${label} must be between ${minimum} and ${maximum}`);
    }
  }

  function assertBoolean(value, label) {
    if (typeof value !== "boolean") throw new TypeError(`${label} must be a boolean`);
  }

  function assertPoint(value, label) {
    assertRecord(value, label);
    assertFinite(value.x, `${label}.x`);
    assertFinite(value.y, `${label}.y`);
  }

  function assertBounds(bounds, label = "bounds") {
    assertRecord(bounds, label);
    for (const key of ["left", "right", "top", "bottom"]) assertFinite(bounds[key], `${label}.${key}`);
    if (bounds.left >= bounds.right || bounds.top >= bounds.bottom) {
      throw new RangeError(`${label} must have positive width and height`);
    }
  }

  function clamp(value, minimum, maximum) {
    assertFinite(value, "value");
    assertFinite(minimum, "minimum");
    assertFinite(maximum, "maximum");
    if (minimum > maximum) throw new RangeError("minimum cannot exceed maximum");
    return Math.max(minimum, Math.min(maximum, value));
  }

  function freezePoint(point) {
    return Object.freeze({ x: point.x, y: point.y });
  }

  function momentById(id) {
    if (typeof id !== "string" || !MOMENT_BY_ID.has(id)) throw new RangeError(`Unknown moment: ${id}`);
    return MOMENT_BY_ID.get(id);
  }

  function momentsForLevel(levelIndex) {
    assertInteger(levelIndex, "levelIndex", 0, LEVELS.length - 1);
    return Object.freeze(LEVELS[levelIndex].moments.map((placement) => momentById(placement.id)));
  }

  function computeAimGesture(start, current, options = {}) {
    assertPoint(start, "start");
    assertPoint(current, "current");
    assertRecord(options, "options");
    const minPull = options.minPull === undefined ? RULES.minPull : options.minPull;
    const maxPull = options.maxPull === undefined ? RULES.maxPull : options.maxPull;
    assertFinite(minPull, "minPull");
    assertFinite(maxPull, "maxPull");
    if (minPull < 0 || maxPull <= minPull) throw new RangeError("pull limits are invalid");

    const dx = start.x - current.x;
    const dy = start.y - current.y;
    const distance = Math.hypot(dx, dy);
    const active = distance >= minPull;
    const magnitude = distance > EPSILON ? distance : 1;
    const direction = active ? { x: dx / magnitude, y: dy / magnitude } : { x: 0, y: -1 };
    const linearPower = active ? clamp((distance - minPull) / (maxPull - minPull), 0, 1) : 0;
    const power = linearPower * linearPower * (3 - 2 * linearPower);
    const speed = active
      ? RULES.minShotSpeed + power * (RULES.maxShotSpeed - RULES.minShotSpeed)
      : 0;

    return Object.freeze({
      active,
      pull: Math.min(distance, maxPull),
      rawPull: distance,
      power,
      speed,
      direction: freezePoint(direction)
    });
  }

  function rayCircleDistance(origin, direction, circle, cueRadius) {
    const offsetX = origin.x - circle.x;
    const offsetY = origin.y - circle.y;
    const combinedRadius = circle.radius + cueRadius;
    const projection = offsetX * direction.x + offsetY * direction.y;
    const constant = offsetX * offsetX + offsetY * offsetY - combinedRadius * combinedRadius;
    const discriminant = projection * projection - constant;
    if (discriminant < 0) return Infinity;
    const near = -projection - Math.sqrt(discriminant);
    const far = -projection + Math.sqrt(discriminant);
    if (near > EPSILON) return near;
    return far > EPSILON ? far : Infinity;
  }

  function wallIntersection(origin, direction, bounds) {
    let distance = Infinity;
    let vertical = false;
    let horizontal = false;
    if (Math.abs(direction.x) > EPSILON) {
      const edgeX = direction.x > 0 ? bounds.right : bounds.left;
      const candidate = (edgeX - origin.x) / direction.x;
      const y = origin.y + direction.y * candidate;
      if (candidate > EPSILON && y >= bounds.top - EPSILON && y <= bounds.bottom + EPSILON) {
        distance = candidate;
        vertical = true;
      }
    }
    if (Math.abs(direction.y) > EPSILON) {
      const edgeY = direction.y > 0 ? bounds.bottom : bounds.top;
      const candidate = (edgeY - origin.y) / direction.y;
      const x = origin.x + direction.x * candidate;
      if (candidate > EPSILON && x >= bounds.left - EPSILON && x <= bounds.right + EPSILON) {
        if (candidate < distance - EPSILON) {
          distance = candidate;
          vertical = false;
          horizontal = true;
        } else if (Math.abs(candidate - distance) <= EPSILON) {
          horizontal = true;
        }
      }
    }
    return { distance, vertical, horizontal };
  }

  function traceAimPath(origin, direction, bounds, circles = [], maxBounces = 1, cueRadius = RULES.ballRadius) {
    assertPoint(origin, "origin");
    assertPoint(direction, "direction");
    assertBounds(bounds);
    if (!Array.isArray(circles)) throw new TypeError("circles must be an array");
    assertInteger(maxBounces, "maxBounces", 0, RULES.maxAimBounces);
    assertFinite(cueRadius, "cueRadius");
    if (cueRadius <= 0) throw new RangeError("cueRadius must be positive");

    const magnitude = Math.hypot(direction.x, direction.y);
    if (magnitude <= EPSILON) throw new RangeError("direction cannot be zero");
    let ray = { x: direction.x / magnitude, y: direction.y / magnitude };
    let point = { x: origin.x, y: origin.y };
    const normalizedCircles = circles.map((circle, index) => {
      assertRecord(circle, `circles[${index}]`);
      assertFinite(circle.x, `circles[${index}].x`);
      assertFinite(circle.y, `circles[${index}].y`);
      assertFinite(circle.radius, `circles[${index}].radius`);
      if (circle.radius <= 0) throw new RangeError(`circles[${index}].radius must be positive`);
      if (typeof circle.id !== "string" || circle.id.length === 0) {
        throw new TypeError(`circles[${index}].id must be a non-empty string`);
      }
      return circle;
    });

    const segments = [];
    let hitBallId = null;
    let cushionHits = 0;

    for (let bounce = 0; bounce <= maxBounces; bounce += 1) {
      const wall = wallIntersection(point, ray, bounds);
      let nearestCircle = null;
      let circleDistance = Infinity;
      normalizedCircles.forEach((circle) => {
        const candidate = rayCircleDistance(point, ray, circle, cueRadius);
        if (candidate < circleDistance) {
          circleDistance = candidate;
          nearestCircle = circle;
        }
      });

      if (nearestCircle && circleDistance < wall.distance - EPSILON) {
        const end = {
          x: point.x + ray.x * circleDistance,
          y: point.y + ray.y * circleDistance
        };
        segments.push(Object.freeze({
          start: freezePoint(point),
          end: freezePoint(end),
          type: "ball",
          targetId: nearestCircle.id
        }));
        hitBallId = nearestCircle.id;
        break;
      }

      if (!Number.isFinite(wall.distance)) break;
      const end = {
        x: point.x + ray.x * wall.distance,
        y: point.y + ray.y * wall.distance
      };
      segments.push(Object.freeze({
        start: freezePoint(point),
        end: freezePoint(end),
        type: "cushion",
        targetId: null
      }));
      cushionHits += 1;
      if (bounce === maxBounces) break;
      if (wall.vertical) ray.x *= -1;
      if (wall.horizontal) ray.y *= -1;
      point = { x: end.x + ray.x * 0.001, y: end.y + ray.y * 0.001 };
    }

    return Object.freeze({
      segments: Object.freeze(segments),
      hitBallId,
      cushionHits,
      finalDirection: freezePoint(ray)
    });
  }

  function freezeRunState(state) {
    return Object.freeze({
      levelIndex: state.levelIndex,
      score: state.score,
      totalShots: state.totalShots,
      chapterPockets: state.chapterPockets,
      shotsRemaining: state.shotsRemaining,
      unlockedMomentIds: Object.freeze([...state.unlockedMomentIds]),
      fouls: state.fouls,
      chapterComplete: state.chapterComplete
    });
  }

  function createRunState(levelIndex = 0) {
    assertInteger(levelIndex, "levelIndex", 0, LEVELS.length - 1);
    return freezeRunState({
      levelIndex,
      score: 0,
      totalShots: 0,
      chapterPockets: 0,
      shotsRemaining: LEVELS[levelIndex].shots,
      unlockedMomentIds: [],
      fouls: 0,
      chapterComplete: false
    });
  }

  function assertRunState(state) {
    assertRecord(state, "run state");
    assertInteger(state.levelIndex, "run state levelIndex", 0, LEVELS.length - 1);
    assertFinite(state.score, "run state score");
    if (state.score < 0) throw new RangeError("run state score cannot be negative");
    assertInteger(state.totalShots, "run state totalShots", 0, Number.MAX_SAFE_INTEGER);
    assertInteger(state.chapterPockets, "run state chapterPockets", 0, LEVELS[state.levelIndex].moments.length);
    assertInteger(state.shotsRemaining, "run state shotsRemaining", 0, LEVELS[state.levelIndex].shots);
    assertInteger(state.fouls, "run state fouls", 0, Number.MAX_SAFE_INTEGER);
    assertBoolean(state.chapterComplete, "run state chapterComplete");
    if (!Array.isArray(state.unlockedMomentIds)) throw new TypeError("run state unlockedMomentIds must be an array");
    const unique = new Set();
    state.unlockedMomentIds.forEach((id, index) => {
      if (!Object.prototype.hasOwnProperty.call(state.unlockedMomentIds, index)) {
        throw new TypeError("run state unlockedMomentIds must be dense");
      }
      momentById(id);
      if (unique.has(id)) throw new RangeError("run state unlockedMomentIds must be unique");
      unique.add(id);
    });
    if (state.chapterComplete !== (state.chapterPockets >= LEVELS[state.levelIndex].goal)) {
      throw new RangeError("run state chapter completion is inconsistent");
    }
  }

  function normalizeShot(shot, level, alreadyUnlocked) {
    assertRecord(shot, "shot");
    const firstContactId = shot.firstContactId === undefined ? null : shot.firstContactId;
    if (firstContactId !== null && (typeof firstContactId !== "string" || !level.moments.some((item) => item.id === firstContactId))) {
      throw new RangeError("shot firstContactId must identify a moment on the current table");
    }
    const pottedIds = shot.pottedIds === undefined ? [] : shot.pottedIds;
    if (!Array.isArray(pottedIds)) throw new TypeError("shot pottedIds must be an array");
    const currentIds = new Set(level.moments.map((item) => item.id));
    const unique = new Set();
    pottedIds.forEach((id, index) => {
      if (!Object.prototype.hasOwnProperty.call(pottedIds, index)) throw new TypeError("shot pottedIds must be dense");
      if (typeof id !== "string" || !currentIds.has(id)) throw new RangeError(`shot pottedIds contains an unknown table moment: ${id}`);
      if (unique.has(id) || alreadyUnlocked.has(id)) throw new RangeError(`shot pottedIds contains a duplicate moment: ${id}`);
      unique.add(id);
    });
    const scratch = shot.scratch === undefined ? false : shot.scratch;
    const cueRailBeforeContact = shot.cueRailBeforeContact === undefined ? false : shot.cueRailBeforeContact;
    const combination = shot.combination === undefined ? false : shot.combination;
    assertBoolean(scratch, "shot scratch");
    assertBoolean(cueRailBeforeContact, "shot cueRailBeforeContact");
    assertBoolean(combination, "shot combination");
    const railHits = shot.railHits === undefined ? 0 : shot.railHits;
    assertInteger(railHits, "shot railHits", 0, 1000);
    return { firstContactId, pottedIds: [...pottedIds], scratch, cueRailBeforeContact, combination, railHits };
  }

  function resolveShot(state, shot) {
    assertRunState(state);
    if (state.chapterComplete) throw new RangeError("cannot shoot after the chapter is complete");
    if (state.shotsRemaining === 0) throw new RangeError("cannot shoot without a remaining turn");
    const level = LEVELS[state.levelIndex];
    const alreadyUnlocked = new Set(state.unlockedMomentIds);
    const normalized = normalizeShot(shot, level, alreadyUnlocked);
    const pottedMoments = normalized.pottedIds.map(momentById);
    const foul = normalized.scratch || normalized.firstContactId === null;
    const indirect = !foul && pottedMoments.length > 0 && (
      normalized.cueRailBeforeContact || normalized.combination || normalized.railHits >= 2
    );
    const replyShot = indirect;
    const basePoints = pottedMoments.reduce((total, moment) => total + moment.points, 0);
    const indirectBonus = indirect ? Math.round(basePoints * 0.55) + RULES.indirectFlatBonus : 0;
    const combinationBonus = !foul && normalized.combination && pottedMoments.length > 0 ? RULES.combinationBonus : 0;
    const multiPocketBonus = pottedMoments.length > 1
      ? (pottedMoments.length - 1) * RULES.multiPocketBonus
      : 0;
    const penalty = foul ? RULES.foulPenalty : 0;
    const nextScore = Math.max(0, state.score + basePoints + indirectBonus + combinationBonus + multiPocketBonus - penalty);
    const chapterPockets = state.chapterPockets + pottedMoments.length;
    const chapterComplete = chapterPockets >= level.goal;
    const shotsRemaining = Math.max(0, state.shotsRemaining - (replyShot ? 0 : 1));
    const victory = chapterComplete && state.levelIndex === LEVELS.length - 1;
    const gameOver = !chapterComplete && shotsRemaining === 0;
    const unlockedMomentIds = [...state.unlockedMomentIds, ...normalized.pottedIds];
    const nextState = freezeRunState({
      levelIndex: state.levelIndex,
      score: nextScore,
      totalShots: state.totalShots + 1,
      chapterPockets,
      shotsRemaining,
      unlockedMomentIds,
      fouls: state.fouls + (foul ? 1 : 0),
      chapterComplete
    });

    const milestones = [];
    if (state.unlockedMomentIds.length === 0 && pottedMoments.length > 0) milestones.push("first-approach");
    if (indirect) milestones.push("first-echo");
    if (!foul && normalized.combination && pottedMoments.length > 0) milestones.push("first-combination");
    if (pottedMoments.length > 1) milestones.push("first-double");
    if (chapterComplete) milestones.push(`chapter-${level.id}`);
    if (victory) milestones.push("final-dawn");

    return Object.freeze({
      state: nextState,
      foul,
      scratch: normalized.scratch,
      indirect,
      replyShot,
      levelComplete: chapterComplete,
      victory,
      gameOver,
      basePoints,
      indirectBonus,
      combinationBonus,
      multiPocketBonus,
      penalty,
      scoreDelta: nextScore - state.score,
      pottedMoments: Object.freeze(pottedMoments),
      milestones: Object.freeze(milestones)
    });
  }

  function advanceLevel(state) {
    assertRunState(state);
    if (!state.chapterComplete) throw new RangeError("the current chapter is not complete");
    if (state.levelIndex >= LEVELS.length - 1) throw new RangeError("the final chapter cannot advance");
    const levelIndex = state.levelIndex + 1;
    return freezeRunState({
      levelIndex,
      score: state.score,
      totalShots: state.totalShots,
      chapterPockets: 0,
      shotsRemaining: LEVELS[levelIndex].shots,
      unlockedMomentIds: state.unlockedMomentIds,
      fouls: state.fouls,
      chapterComplete: false
    });
  }

  function findCuePlacement(preferred, balls, bounds, radius = RULES.ballRadius) {
    assertPoint(preferred, "preferred");
    if (!Array.isArray(balls)) throw new TypeError("balls must be an array");
    assertBounds(bounds);
    assertFinite(radius, "radius");
    if (radius <= 0) throw new RangeError("radius must be positive");
    const normalizedBalls = balls.map((ball, index) => {
      assertPoint(ball, `balls[${index}]`);
      assertFinite(ball.radius, `balls[${index}].radius`);
      if (ball.radius <= 0) throw new RangeError(`balls[${index}].radius must be positive`);
      return ball;
    });
    const inner = {
      left: bounds.left + radius + 1,
      right: bounds.right - radius - 1,
      top: bounds.top + radius + 1,
      bottom: bounds.bottom - radius - 1
    };
    if (inner.left > inner.right || inner.top > inner.bottom) throw new RangeError("bounds are too small for the cue ball");
    const clamped = (point) => ({
      x: Math.max(inner.left, Math.min(inner.right, point.x)),
      y: Math.max(inner.top, Math.min(inner.bottom, point.y))
    });
    const isOpen = (point) => normalizedBalls.every((ball) => (
      Math.hypot(point.x - ball.x, point.y - ball.y) >= radius + ball.radius + 2
    ));
    const candidates = [
      clamped(preferred),
      clamped({ x: (bounds.left + bounds.right) / 2, y: bounds.bottom - 58 })
    ];
    const spacing = radius * 2.45;
    for (let ring = 1; ring <= 7; ring += 1) {
      const count = ring * 10;
      for (let index = 0; index < count; index += 1) {
        const angle = -Math.PI / 2 + index * Math.PI * 2 / count;
        candidates.push(clamped({
          x: preferred.x + Math.cos(angle) * spacing * ring,
          y: preferred.y + Math.sin(angle) * spacing * ring
        }));
      }
    }
    const placement = candidates.find(isOpen);
    if (!placement) throw new RangeError("no legal cue-ball placement is available");
    return freezePoint(placement);
  }

  return Object.freeze({
    RULES,
    MOMENTS,
    LEVELS,
    clamp,
    momentById,
    momentsForLevel,
    computeAimGesture,
    traceAimPath,
    createRunState,
    resolveShot,
    advanceLevel,
    findCuePlacement
  });
});
