(function (root, factory) {
  const rules = factory();
  if (typeof module === "object" && module.exports) module.exports = rules;
  else root.BreakoutLoveRules = rules;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const WORLD_WIDTH = 393;
  const COMBO_WINDOW_MS = 1250;
  const MAX_COMBO = 12;
  const COMBO_MULTIPLIERS = Object.freeze([
    1, 1, 1.15, 1.25, 1.35, 1.5, 1.65, 1.8, 2, 2.2, 2.5, 3
  ]);
  const BRICK_TYPES = Object.freeze({
    "1": Object.freeze({ hp: 1, gift: null }),
    "2": Object.freeze({ hp: 2, gift: null }),
    "3": Object.freeze({ hp: 3, gift: null }),
    w: Object.freeze({ hp: 1, gift: "embrace" }),
    e: Object.freeze({ hp: 1, gift: "echo" }),
    c: Object.freeze({ hp: 1, gift: "courage" })
  });

  const POWER_UPS = deepFreeze({
    embrace: {
      id: "embrace",
      label: "相拥",
      line: "两端的距离忽然近了",
      durationMs: 14000,
      color: "#f08aa2"
    },
    echo: {
      id: "echo",
      label: "回声",
      line: "一句回信，有了三束光",
      durationMs: 0,
      color: "#7fd4d0"
    },
    courage: {
      id: "courage",
      label: "勇气",
      line: "这一次，光不再绕开高墙",
      durationMs: 9000,
      color: "#f4c66f"
    }
  });

  const LEVELS = deepFreeze([
    {
      id: "library-signal",
      number: "01",
      kicker: "未读 · 21:17",
      title: "迟到的回信",
      status: "图书馆那盏灯还亮着",
      scene: "assets/love-scenes/campus-library.webp",
      palette: ["#d95878", "#f0b769", "#77c2c0", "#f6e7cf"],
      pattern: [
        "22222222222",
        "21111111112",
        "21w11111e12",
        ".211111112.",
        "..2111112..",
        "...21112...",
        "....2c2....",
        ".....1....."
      ],
      milestones: [
        {
          id: "opened",
          at: 0.5,
          effect: "signal",
          kicker: "未读信号",
          title: "她看见了",
          line: "灯停在那一页，回信终于穿过沉默。"
        },
        {
          id: "clear",
          at: 1,
          effect: "letters",
          kicker: "初见存档",
          title: "同一页书",
          line: "两张借书卡，在同一个傍晚留下日期。"
        }
      ]
    },
    {
      id: "rain-promise",
      number: "02",
      kicker: "雨夜 · 22:06",
      title: "伞下的空位",
      status: "雨声替谁保守着答案",
      scene: "assets/love-scenes/rain-night.webp",
      palette: ["#75b8c8", "#ed7791", "#edc06f", "#d9e5dd"],
      pattern: [
        ".....2.....",
        "....222....",
        "..2222222..",
        ".221111122.",
        "22w11111e22",
        ".111111111.",
        ".....2.....",
        ".....2.....",
        "....c2....."
      ],
      milestones: [
        {
          id: "opened",
          at: 0.5,
          effect: "rain",
          kicker: "雨幕停格",
          title: "她往左靠了靠",
          line: "伞沿落下的雨，把世界缩成两个人。"
        },
        {
          id: "clear",
          at: 1,
          effect: "umbrella",
          kicker: "并肩时刻",
          title: "路忽然不远",
          line: "同一把伞记住了两种脚步。"
        }
      ]
    },
    {
      id: "city-date",
      number: "03",
      kicker: "晚风 · 19:48",
      title: "穿过整座城",
      status: "每扇窗都像一封亮着的信",
      scene: "assets/love-scenes/city-night.webp",
      palette: ["#efad58", "#6fc4c1", "#e45f7e", "#f3ead8"],
      pattern: [
        "3.2.3.2.3.2",
        "31213121313",
        "22222222222",
        "2e111w111c2",
        "21112121112",
        "21112121112",
        "21112121112",
        "22222222222"
      ],
      milestones: [
        {
          id: "opened",
          at: 0.5,
          effect: "windows",
          kicker: "城市亮起",
          title: "那扇窗是目的地",
          line: "越过人海之后，灯光有了名字。"
        },
        {
          id: "clear",
          at: 1,
          effect: "lanterns",
          kicker: "约会抵达",
          title: "晚风刚刚好",
          line: "所有绕远的路，都在这一刻变得值得。"
        }
      ]
    },
    {
      id: "starlight-vow",
      number: "04",
      kicker: "星夜 · 23:59",
      title: "把明天说出口",
      status: "最后一道防线藏着清晨",
      scene: "assets/love-scenes/starlight-vow.webp",
      palette: ["#f1c66d", "#e76d8d", "#7ec7c4", "#fff1d8"],
      pattern: [
        "..2233322..",
        ".231111132.",
        "23111e11132",
        "21111111112",
        ".2111c1112.",
        "..2111112..",
        "...21112...",
        "....2w2....",
        ".....2....."
      ],
      milestones: [
        {
          id: "opened",
          at: 0.5,
          effect: "constellation",
          kicker: "星图连线",
          title: "原来一直同路",
          line: "散落的光点，终于连成共同的方向。"
        },
        {
          id: "clear",
          at: 1,
          effect: "dawn",
          kicker: "零点以后",
          title: "明天也请回信",
          line: "夜色退场，约定留在第一束晨光里。"
        }
      ]
    }
  ]);

  const COMBO_MOMENTS = Object.freeze({
    4: "句句有回声",
    8: "终于说到同一句",
    12: "这一刻不再躲闪"
  });

  const VOLLEY_MOMENTS = Object.freeze({
    3: "话题还没有结束",
    6: "晚风把回信送了回来",
    10: "这一次谁都没有移开目光",
    16: "整夜都在回应"
  });

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function assertFinite(value, label, minimum = -Infinity) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new TypeError(`${label} must be a finite number`);
    }
    if (value < minimum) throw new RangeError(`${label} must be at least ${minimum}`);
  }

  function assertInteger(value, label, minimum, maximum) {
    if (!Number.isSafeInteger(value)) throw new TypeError(`${label} must be an integer`);
    if (value < minimum || value > maximum) {
      throw new RangeError(`${label} must be between ${minimum} and ${maximum}`);
    }
  }

  function assertRecord(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError(`${label} must be an object`);
    }
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function getLevel(levelIndex) {
    assertInteger(levelIndex, "levelIndex", 0, LEVELS.length - 1);
    return LEVELS[levelIndex];
  }

  function buildBricks(levelIndex, options = {}) {
    const level = getLevel(levelIndex);
    assertRecord(options, "options");
    const worldWidth = options.worldWidth === undefined ? WORLD_WIDTH : options.worldWidth;
    const side = options.side === undefined ? 14 : options.side;
    const top = options.top === undefined ? 58 : options.top;
    const gap = options.gap === undefined ? 4 : options.gap;
    const rowGap = options.rowGap === undefined ? 5 : options.rowGap;
    const height = options.height === undefined ? 20 : options.height;
    [
      [worldWidth, "worldWidth", 1],
      [side, "side", 0],
      [top, "top", 0],
      [gap, "gap", 0],
      [rowGap, "rowGap", 0],
      [height, "height", 1]
    ].forEach(([value, label, minimum]) => assertFinite(value, label, minimum));

    const columns = level.pattern[0].length;
    const width = (worldWidth - side * 2 - gap * (columns - 1)) / columns;
    if (width <= 2) throw new RangeError("brick width must be greater than 2");
    const bricks = [];

    level.pattern.forEach((rowPattern, row) => {
      if (rowPattern.length !== columns) throw new RangeError("level patterns must be rectangular");
      [...rowPattern].forEach((symbol, column) => {
        const type = BRICK_TYPES[symbol];
        if (!type) {
          if (symbol !== ".") throw new RangeError(`unsupported brick symbol: ${symbol}`);
          return;
        }
        bricks.push(Object.freeze({
          id: `${level.id}-${row}-${column}`,
          levelId: level.id,
          row,
          column,
          x: side + column * (width + gap),
          y: top + row * (height + rowGap),
          width,
          height,
          hp: type.hp,
          maxHp: type.hp,
          gift: type.gift
        }));
      });
    });

    return Object.freeze(bricks);
  }

  function createScoreState() {
    return Object.freeze({ score: 0, combo: 0, lastHitAt: null, totalHits: 0 });
  }

  function assertScoreState(state) {
    assertRecord(state, "score state");
    assertFinite(state.score, "score", 0);
    assertInteger(state.combo, "combo", 0, MAX_COMBO);
    assertInteger(state.totalHits, "totalHits", 0, Number.MAX_SAFE_INTEGER);
    if (state.lastHitAt !== null) assertFinite(state.lastHitAt, "lastHitAt", 0);
    if ((state.combo === 0) !== (state.lastHitAt === null)) {
      throw new RangeError("combo and lastHitAt are inconsistent");
    }
  }

  function scoreBrickHit(state, event) {
    assertScoreState(state);
    assertRecord(event, "hit event");
    assertFinite(event.timestamp, "timestamp", 0);
    assertInteger(event.levelIndex, "levelIndex", 0, LEVELS.length - 1);
    if (typeof event.destroyed !== "boolean") throw new TypeError("destroyed must be a boolean");
    if (typeof event.armored !== "boolean") throw new TypeError("armored must be a boolean");
    if (typeof event.piercing !== "boolean") throw new TypeError("piercing must be a boolean");
    if (state.lastHitAt !== null && event.timestamp < state.lastHitAt) {
      throw new RangeError("timestamp cannot move backwards");
    }

    const chained = state.lastHitAt !== null
      && event.timestamp - state.lastHitAt <= COMBO_WINDOW_MS;
    const combo = chained ? Math.min(MAX_COMBO, state.combo + 1) : 1;
    const base = (event.destroyed ? 72 : 24)
      + event.levelIndex * 12
      + (event.armored ? 10 : 0)
      + (event.piercing ? 12 : 0);
    const multiplier = COMBO_MULTIPLIERS[combo - 1];
    const points = Math.round(base * multiplier);
    const nextScore = state.score + points;
    if (!Number.isSafeInteger(nextScore)) throw new RangeError("score exceeds supported range");
    const nextState = Object.freeze({
      score: nextScore,
      combo,
      lastHitAt: event.timestamp,
      totalHits: state.totalHits + 1
    });

    return Object.freeze({
      state: nextState,
      points,
      combo,
      multiplier,
      moment: COMBO_MOMENTS[combo] || null
    });
  }

  function breakCombo(state) {
    assertScoreState(state);
    return Object.freeze({
      score: state.score,
      combo: 0,
      lastHitAt: null,
      totalHits: state.totalHits
    });
  }

  function awardLevelClear(state, levelIndex, lives) {
    assertScoreState(state);
    assertInteger(levelIndex, "levelIndex", 0, LEVELS.length - 1);
    assertInteger(lives, "lives", 0, 9);
    const points = 600 + levelIndex * 250 + lives * 120;
    return Object.freeze({
      points,
      state: Object.freeze({
        score: state.score + points,
        combo: state.combo,
        lastHitAt: state.lastHitAt,
        totalHits: state.totalHits
      })
    });
  }

  function comboMoment(combo) {
    assertInteger(combo, "combo", 0, MAX_COMBO);
    return COMBO_MOMENTS[combo] || null;
  }

  function volleyMoment(returns) {
    assertInteger(returns, "returns", 0, Number.MAX_SAFE_INTEGER);
    return VOLLEY_MOMENTS[returns] || null;
  }

  function crossedMilestones(levelIndex, previousDestroyed, nextDestroyed, total) {
    const level = getLevel(levelIndex);
    assertInteger(total, "total", 1, Number.MAX_SAFE_INTEGER);
    assertInteger(previousDestroyed, "previousDestroyed", 0, total);
    assertInteger(nextDestroyed, "nextDestroyed", previousDestroyed, total);
    return Object.freeze(level.milestones.filter((milestone) => {
      const target = Math.ceil(total * milestone.at);
      return previousDestroyed < target && nextDestroyed >= target;
    }).map((milestone) => Object.freeze({
      ...milestone,
      key: `${level.id}:${milestone.id}`,
      levelId: level.id,
      target: Math.ceil(total * milestone.at)
    })));
  }

  function circleRectCollision(circle, rect) {
    assertRecord(circle, "circle");
    assertRecord(rect, "rect");
    assertFinite(circle.x, "circle.x");
    assertFinite(circle.y, "circle.y");
    assertFinite(circle.radius, "circle.radius", 0);
    assertFinite(rect.x, "rect.x");
    assertFinite(rect.y, "rect.y");
    assertFinite(rect.width, "rect.width", 0);
    assertFinite(rect.height, "rect.height", 0);

    const nearestX = clamp(circle.x, rect.x, rect.x + rect.width);
    const nearestY = clamp(circle.y, rect.y, rect.y + rect.height);
    const deltaX = circle.x - nearestX;
    const deltaY = circle.y - nearestY;
    const distanceSquared = deltaX * deltaX + deltaY * deltaY;
    if (distanceSquared > circle.radius * circle.radius) return null;

    if (distanceSquared > 1e-9) {
      const distance = Math.sqrt(distanceSquared);
      return Object.freeze({
        normalX: deltaX / distance,
        normalY: deltaY / distance,
        penetration: circle.radius - distance
      });
    }

    const edges = [
      { distance: circle.x - rect.x, normalX: -1, normalY: 0 },
      { distance: rect.x + rect.width - circle.x, normalX: 1, normalY: 0 },
      { distance: circle.y - rect.y, normalX: 0, normalY: -1 },
      { distance: rect.y + rect.height - circle.y, normalX: 0, normalY: 1 }
    ].sort((left, right) => left.distance - right.distance);
    return Object.freeze({
      normalX: edges[0].normalX,
      normalY: edges[0].normalY,
      penetration: circle.radius + Math.max(0, edges[0].distance)
    });
  }

  function reflectVelocity(velocityX, velocityY, normalX, normalY, restitution = 1) {
    [
      [velocityX, "velocityX"],
      [velocityY, "velocityY"],
      [normalX, "normalX"],
      [normalY, "normalY"],
      [restitution, "restitution"]
    ].forEach(([value, label]) => assertFinite(value, label));
    const magnitude = Math.hypot(normalX, normalY);
    if (magnitude < 1e-9) throw new RangeError("collision normal cannot be zero");
    const unitX = normalX / magnitude;
    const unitY = normalY / magnitude;
    const dot = velocityX * unitX + velocityY * unitY;
    if (dot >= 0) return Object.freeze({ velocityX, velocityY });
    const impulse = (1 + restitution) * dot;
    return Object.freeze({
      velocityX: velocityX - impulse * unitX,
      velocityY: velocityY - impulse * unitY
    });
  }

  function paddleBounce(hitOffset, speed, english = 0) {
    assertFinite(hitOffset, "hitOffset");
    assertFinite(speed, "speed", 1);
    assertFinite(english, "english");
    const shapedOffset = clamp(hitOffset + english * 0.18, -1, 1);
    const angle = shapedOffset * (Math.PI * 64 / 180);
    return Object.freeze({
      velocityX: Math.sin(angle) * speed,
      velocityY: -Math.max(speed * 0.42, Math.cos(angle) * speed)
    });
  }

  function speedForLevel(levelIndex, destroyedRatio = 0) {
    assertInteger(levelIndex, "levelIndex", 0, LEVELS.length - 1);
    assertFinite(destroyedRatio, "destroyedRatio", 0);
    return 330 + levelIndex * 22 + clamp(destroyedRatio, 0, 1) * 35;
  }

  function createRng(seed) {
    if (!Number.isSafeInteger(seed)) throw new TypeError("seed must be an integer");
    let state = seed >>> 0;
    return function random() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  return Object.freeze({
    WORLD_WIDTH,
    COMBO_WINDOW_MS,
    MAX_COMBO,
    POWER_UPS,
    LEVELS,
    createScoreState,
    scoreBrickHit,
    breakCombo,
    awardLevelClear,
    comboMoment,
    volleyMoment,
    crossedMilestones,
    buildBricks,
    circleRectCollision,
    reflectVelocity,
    paddleBounce,
    speedForLevel,
    createRng,
    getLevel
  });
});
