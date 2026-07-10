(function (root, factory) {
  const rules = factory();
  if (typeof module === "object" && module.exports) module.exports = rules;
  else root.WatermelonRules = rules;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const MOMENT_DATA = [
    {
      id: "first-glance",
      name: "初见余光",
      shortName: "余光",
      radius: 13,
      score: 0,
      model: "glance",
      material: "镜面微光",
      mergeBehavior: "交叠闪光",
      effect: "glint",
      palette: ["#b8ecf1", "#4d8f9a", "#f8e7b2"],
      physics: { restitution: 0.31, frictionAir: 0.011, density: 0.00102, lift: 0.68, spin: 0.018 }
    },
    {
      id: "chat-echo",
      name: "聊天回声",
      shortName: "回声",
      radius: 17,
      score: 10,
      model: "chat",
      material: "磨砂屏光",
      mergeBehavior: "气泡回弹",
      effect: "bubble",
      palette: ["#8fc7ff", "#4868a8", "#dceaff"],
      physics: { restitution: 0.28, frictionAir: 0.01, density: 0.00104, lift: 0.74, spin: -0.022 }
    },
    {
      id: "moving-closer",
      name: "慢慢靠近",
      shortName: "靠近",
      radius: 22,
      score: 25,
      model: "approach",
      material: "夜雾玻璃",
      mergeBehavior: "双轨相吸",
      effect: "orbit",
      palette: ["#9ad7c0", "#3f796c", "#e8f5cc"],
      physics: { restitution: 0.25, frictionAir: 0.009, density: 0.00106, lift: 0.82, spin: 0.026 }
    },
    {
      id: "shared-earbuds",
      name: "同频耳机",
      shortName: "同频",
      radius: 27,
      score: 45,
      model: "earbuds",
      material: "软胶与银线",
      mergeBehavior: "声波同频",
      effect: "note",
      palette: ["#d5d8e1", "#636b7f", "#8de0d1"],
      physics: { restitution: 0.22, frictionAir: 0.008, density: 0.00108, lift: 0.92, spin: -0.029 }
    },
    {
      id: "ticket-stub",
      name: "电影票根",
      shortName: "票根",
      radius: 33,
      score: 70,
      model: "ticket",
      material: "纤维票纸",
      mergeBehavior: "票屑翻飞",
      effect: "paper",
      palette: ["#f2c86e", "#9c623e", "#fff0bd"],
      physics: { restitution: 0.2, frictionAir: 0.0075, density: 0.0011, lift: 1.02, spin: 0.034 }
    },
    {
      id: "date-photo",
      name: "约会留影",
      shortName: "留影",
      radius: 40,
      score: 110,
      model: "photo",
      material: "暖调相纸",
      mergeBehavior: "快门定格",
      effect: "flash",
      palette: ["#ef967f", "#8d4d5e", "#ffe0bd"],
      physics: { restitution: 0.18, frictionAir: 0.007, density: 0.00112, lift: 1.12, spin: -0.037 }
    },
    {
      id: "held-hands",
      name: "十指相扣",
      shortName: "牵手",
      radius: 48,
      score: 170,
      model: "hands",
      material: "温润肌理",
      mergeBehavior: "掌纹连线",
      effect: "thread",
      palette: ["#f1b69f", "#a75e70", "#ffe6ca"],
      physics: { restitution: 0.16, frictionAir: 0.0065, density: 0.00115, lift: 1.2, spin: 0.032 }
    },
    {
      id: "warm-embrace",
      name: "拥抱余温",
      shortName: "相拥",
      radius: 57,
      score: 260,
      model: "embrace",
      material: "柔绒织物",
      mergeBehavior: "余温扩散",
      effect: "halo",
      palette: ["#c883a1", "#713e68", "#f6c7d4"],
      physics: { restitution: 0.14, frictionAir: 0.006, density: 0.00118, lift: 1.3, spin: -0.025 }
    },
    {
      id: "confession-letter",
      name: "认真告白",
      shortName: "告白",
      radius: 66,
      score: 400,
      model: "letter",
      material: "信笺与火漆",
      mergeBehavior: "信笺展开",
      effect: "letter",
      palette: ["#df6578", "#833345", "#ffe5ce"],
      physics: { restitution: 0.12, frictionAir: 0.0055, density: 0.00121, lift: 1.42, spin: 0.021 }
    },
    {
      id: "keepsake-box",
      name: "两人的私藏",
      shortName: "私藏",
      radius: 76,
      score: 650,
      model: "keepsake",
      material: "木盒与相片",
      mergeBehavior: "旧日浮现",
      effect: "memory",
      palette: ["#b98a62", "#5f493f", "#f2d9ad"],
      physics: { restitution: 0.1, frictionAir: 0.005, density: 0.00125, lift: 1.54, spin: -0.016 }
    },
    {
      id: "hidden-intimacy",
      name: "只给彼此的夜",
      shortName: "秘密",
      radius: 86,
      score: 1000,
      model: "secret",
      material: "丝绒与月光",
      mergeBehavior: "暗门相合",
      effect: "secret",
      palette: ["#796fa8", "#302b50", "#f5d892"],
      physics: { restitution: 0.08, frictionAir: 0.0045, density: 0.00129, lift: 1.68, spin: 0.012 }
    }
  ];

  const MOMENTS = Object.freeze(MOMENT_DATA.map((moment, tier) => Object.freeze({
    ...moment,
    tier,
    palette: Object.freeze([...moment.palette]),
    physics: Object.freeze({ ...moment.physics })
  })));

  const RESPONSE_MARKS = Object.freeze([
    Object.freeze({ id: "self", label: "我的心音", glyph: "我", color: "#f18aa0" }),
    Object.freeze({ id: "echo", label: "你的回音", glyph: "你", color: "#7fd5cc" })
  ]);

  function freezeEvent(event) {
    return Object.freeze({ ...event });
  }

  function freezeGroups(groups) {
    return Object.freeze(groups.map((group) => Object.freeze(group.map(freezeEvent))));
  }

  const UNLOCK_EVENTS = freezeGroups([
    [
      { id: "glance-window", performance: "glance", kicker: "第一次收藏", title: "目光停了一秒", line: "隔着车窗的倒影，你悄悄把那一眼留了下来。" },
      { id: "glance-stairs", performance: "glance", kicker: "第一次收藏", title: "人群忽然安静", line: "楼梯转角只剩那道余光，像秘密先认出了你。" }
    ],
    [
      { id: "chat-late-reply", performance: "chat", kicker: "聊天回声", title: "对话框又亮了", line: "你把一句普通的晚安，反复读成了很多种靠近。" },
      { id: "chat-typing", performance: "chat", kicker: "聊天回声", title: "正在输入的三秒", line: "三个小点亮了又暗，心跳替你等完了那几秒。" }
    ],
    [
      { id: "approach-shoulder", performance: "approach", kicker: "距离变短", title: "肩膀只差一点", line: "并肩的影子先碰到一起，你们还装作没有发现。" },
      { id: "approach-crosswalk", performance: "approach", kicker: "距离变短", title: "同一个绿灯", line: "你放慢半步，想让这一段路比平时更长。" }
    ],
    [
      { id: "earbud-song", performance: "earbuds", kicker: "同频发生", title: "一首歌分成两半", line: "左耳和右耳之间，是谁都没有说破的亲密。" },
      { id: "earbud-bus", performance: "earbuds", kicker: "同频发生", title: "耳机线轻轻晃", line: "末班车拐过街角，你们仍听着同一段副歌。" }
    ],
    [
      { id: "ticket-afterglow", performance: "ticket", kicker: "票根入藏", title: "电影散场以后", line: "电影已经结束，你却舍不得把并排的座位撕开。" },
      { id: "ticket-back-row", performance: "ticket", kicker: "票根入藏", title: "灯光慢慢暗下", line: "银幕亮起之前，你先记住了身边人的侧脸。" }
    ],
    [
      { id: "date-camera", performance: "photo", kicker: "约会留影", title: "快门替你承认", line: "相片里的距离，比你们嘴上说的更诚实。" },
      { id: "date-cafe", performance: "photo", kicker: "约会留影", title: "两杯饮料的水印", line: "桌面留下两个圆圈，像这一天私下盖过的章。" }
    ],
    [
      { id: "hands-crossing", performance: "hands", kicker: "掌心回应", title: "这次没有松开", line: "过马路的人潮很快，牵住的理由却刚刚好。" },
      { id: "hands-pocket", performance: "hands", kicker: "掌心回应", title: "指尖找到指尖", line: "夜风很凉，你们把温度藏进同一个口袋。" }
    ],
    [
      { id: "embrace-rain", performance: "embrace", kicker: "余温停留", title: "雨声退到很远", line: "被拥住的那一刻，世界只剩两个人的呼吸。" },
      { id: "embrace-platform", performance: "embrace", kicker: "余温停留", title: "离开以前再近一点", line: "告别被延长成一个拥抱，谁都没有先数秒。" }
    ],
    [
      { id: "confession-rooftop", performance: "confession", kicker: "心意抵达", title: "答案终于说出口", line: "风替你吹乱句子，对方却听懂了每一个停顿。" },
      { id: "confession-note", performance: "confession", kicker: "心意抵达", title: "信笺被轻轻展开", line: "写了很多遍的名字，终于在今晚有了回音。" }
    ],
    [
      { id: "keepsake-drawer", performance: "memory", kicker: "两人的私藏", title: "抽屉里都是证据", line: "票根、照片和小纸条，替你们记得每一次靠近。" },
      { id: "keepsake-box", performance: "memory", kicker: "两人的私藏", title: "时间被好好收起", line: "那些没人知道的细节，在盒子里慢慢变得珍贵。" }
    ],
    [
      { id: "secret-curtain", performance: "secret", kicker: "只给彼此", title: "窗帘合上以后", line: "月光停在门外，房间里只留下熟悉的呼吸。" },
      { id: "secret-key", performance: "secret", kicker: "只给彼此", title: "心事有了同一把钥匙", line: "不必向任何人解释，这是你们默契守住的夜。" }
    ]
  ]);

  const MERGE_REWARDS = freezeGroups([
    [
      { id: "glint-crossed", copy: "两道余光恰好在此刻交叠" },
      { id: "glint-returned", copy: "那一眼终于有了认真回望" },
      { id: "glint-kept", copy: "人群里又认出了彼此" }
    ],
    [
      { id: "chat-replied", copy: "一句话接住了另一句" },
      { id: "chat-lingered", copy: "晚安之后又多聊了一会儿" },
      { id: "chat-same-time", copy: "两条消息在同一秒同时抵达" }
    ],
    [
      { id: "approach-step", copy: "两个人都悄悄慢了一步" },
      { id: "approach-shadow", copy: "两道影子先悄悄靠在了一起" },
      { id: "approach-seat", copy: "空着的位置终于有人坐近" }
    ],
    [
      { id: "earbud-chorus", copy: "副歌在两边耳朵同时响起" },
      { id: "earbud-loop", copy: "喜欢的那一段又循环一次" },
      { id: "earbud-static", copy: "耳机线碰到时心跳漏拍" }
    ],
    [
      { id: "ticket-kept", copy: "并排的座位被完整留下" },
      { id: "ticket-scene", copy: "散场后还在讨论同一幕" },
      { id: "ticket-date", copy: "票根替这一天写下日期" }
    ],
    [
      { id: "photo-focus", copy: "镜头终于对准两个人" },
      { id: "photo-smile", copy: "同一张照片里笑得很像" },
      { id: "photo-light", copy: "那天的光又被冲洗出来" }
    ],
    [
      { id: "hands-warm", copy: "掌心把答案握得更紧" },
      { id: "hands-crossed", copy: "十指找到了自己的位置" },
      { id: "hands-promise", copy: "没有说出口的都被牵住" }
    ],
    [
      { id: "embrace-breath", copy: "两种呼吸终于慢慢合拍" },
      { id: "embrace-longer", copy: "这一次谁都没有先松开" },
      { id: "embrace-warmth", copy: "余温绕着肩膀停了下来" }
    ],
    [
      { id: "confession-heard", copy: "藏了很久的话被认真听见" },
      { id: "confession-answer", copy: "喜欢终于得到完整回答" },
      { id: "confession-name", copy: "名字被写进同一句以后" }
    ],
    [
      { id: "memory-opened", copy: "旧日细节从盒子里亮起" },
      { id: "memory-shared", copy: "只有你们记得的版本重合了" },
      { id: "memory-layered", copy: "照片下面还压着一张票根" }
    ],
    [
      { id: "secret-locked", copy: "门外的声音被轻轻关上" },
      { id: "secret-known", copy: "不用解释也知道下一秒" },
      { id: "secret-midnight", copy: "午夜替你们保守了答案" }
    ]
  ]);

  const SECRET_COMBINATIONS = Object.freeze([
    freezeEvent({ id: "secret-rain-key", performance: "secret-rain", kicker: "秘密组合", title: "雨夜备用钥匙", line: "门锁轻响，淋湿的外套和想念一起留在玄关。" }),
    freezeEvent({ id: "secret-midnight-song", performance: "secret-song", kicker: "秘密组合", title: "凌晨两点的那首歌", line: "没有开灯，你们靠得很近，听完了最后一段呼吸。" }),
    freezeEvent({ id: "secret-drawer-note", performance: "secret-note", kicker: "秘密组合", title: "抽屉最里面的纸条", line: "只有彼此知道那句话为什么会让人脸红。" }),
    freezeEvent({ id: "secret-curtain-moon", performance: "secret-moon", kicker: "秘密组合", title: "窗帘缝里的月光", line: "城市还醒着，这个房间却只属于两个人。" }),
    freezeEvent({ id: "secret-slow-morning", performance: "secret-morning", kicker: "秘密组合", title: "舍不得起身的清晨", line: "闹钟响过一遍，你们把时间又藏进被角里。" })
  ]);

  const SCENES = Object.freeze([
    Object.freeze({ id: "platform", name: "站台暮色", minTier: 0, palette: Object.freeze(["#294b54", "#d78178", "#eecb82", "#17262b"]) }),
    Object.freeze({ id: "walk", name: "并肩夜路", minTier: 2, palette: Object.freeze(["#233e55", "#69939b", "#f2b86b", "#121b27"]) }),
    Object.freeze({ id: "cinema", name: "散场街角", minTier: 4, palette: Object.freeze(["#31253e", "#bb5c70", "#f2ce77", "#17131f"]) }),
    Object.freeze({ id: "rain", name: "屋檐雨夜", minTier: 6, palette: Object.freeze(["#20394a", "#607f91", "#e58d85", "#111d26"]) }),
    Object.freeze({ id: "room", name: "灯亮的房间", minTier: 8, palette: Object.freeze(["#3a2e45", "#a86c72", "#efc684", "#19151f"]) }),
    Object.freeze({ id: "midnight", name: "只属于我们的夜", minTier: 10, palette: Object.freeze(["#25233f", "#6d6797", "#e6bf7b", "#11101b"]) })
  ]);

  const SPAWN_WEIGHTS = Object.freeze([10, 6, 3, 1]);
  const COMBO_MULTIPLIERS = Object.freeze([1, 1.5, 2, 2.5, 3]);
  const MAX_UINT32 = 0xffffffff;
  const SNAPSHOT_MAX_DEPTH = 64;
  const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

  const RULES = Object.freeze({
    title: "心动大西瓜",
    spawnWeights: SPAWN_WEIGHTS,
    openingMaxTier: 2,
    comboWindowMs: 1000,
    comboMultipliers: COMBO_MULTIPLIERS,
    precisionMultiplier: 1.25,
    mutualResponseLabel: "彼此回应",
    maxCourage: 3,
    courageMaxSourceTier: 3,
    secretCombinationScore: 2500
  });

  const EVENT_CATALOGS = Object.freeze({
    unlocks: UNLOCK_EVENTS,
    mergeRewards: MERGE_REWARDS,
    secretCombinations: SECRET_COMBINATIONS
  });

  function isRecord(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function assertRecord(value, label) {
    if (!isRecord(value)) throw new TypeError(`${label} must be a plain object`);
  }

  function assertBoolean(value, label) {
    if (typeof value !== "boolean") throw new TypeError(`${label} must be a boolean`);
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

  function assertTier(tier, label = "tier", maximum = MOMENTS.length - 1) {
    assertInteger(tier, label, 0, maximum);
  }

  function normalizeSeed(seed) {
    if (!Number.isSafeInteger(seed)) throw new TypeError("seed must be an integer");
    return seed >>> 0;
  }

  function createRng(seed) {
    let state = normalizeSeed(seed);
    const random = function () {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
    Object.defineProperty(random, "getState", {
      value: () => state,
      enumerable: true
    });
    return Object.freeze(random);
  }

  function nextUnit(random) {
    if (typeof random !== "function") throw new TypeError("random must be a function");
    const value = random();
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError("random must return a number in [0, 1)");
    }
    return value;
  }

  function createSpawnBag(random) {
    if (typeof random !== "function") throw new TypeError("random must be a function");
    const bag = [];
    SPAWN_WEIGHTS.forEach((weight, tier) => {
      for (let count = 0; count < weight; count += 1) bag.push(tier);
    });
    for (let index = bag.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(nextUnit(random) * (index + 1));
      [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
    }
    return Object.freeze(bag);
  }

  function freezeQueueState(queue, bag, rngState, size) {
    return Object.freeze({
      queue: Object.freeze(queue),
      bag: Object.freeze(bag),
      rngState,
      size
    });
  }

  function assertQueueState(state) {
    assertRecord(state, "queue state");
    assertInteger(state.size, "queue state size", 1, 19);
    if (!Array.isArray(state.queue) || state.queue.length !== state.size) {
      throw new RangeError("queue state queue must match its size");
    }
    if (!Array.isArray(state.bag) || state.bag.length > 20) {
      throw new RangeError("queue state bag must contain at most 20 tiers");
    }
    for (let index = 0; index < state.queue.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(state.queue, index)) {
        throw new TypeError("queue state queue must be dense");
      }
      assertTier(state.queue[index], `queue state queue[${index}]`, 3);
    }
    for (let index = 0; index < state.bag.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(state.bag, index)) {
        throw new TypeError("queue state bag must be dense");
      }
      assertTier(state.bag[index], `queue state bag[${index}]`, 3);
    }
    assertInteger(state.rngState, "queue state rngState", 0, MAX_UINT32);
  }

  function createQueue(seed, size = 3) {
    assertInteger(size, "size", 1, 19);
    const random = createRng(seed);
    const bag = createSpawnBag(random).slice();

    for (let index = 0; index < size; index += 1) {
      if (bag[index] <= RULES.openingMaxTier) continue;
      const swapIndex = bag.findIndex((tier, candidate) => (
        candidate >= size && tier <= RULES.openingMaxTier
      ));
      [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
    }

    return freezeQueueState(
      bag.slice(0, size),
      bag.slice(size),
      random.getState(),
      size
    );
  }

  function peekQueue(state, offset = 0) {
    assertQueueState(state);
    assertInteger(offset, "offset", 0, state.size - 1);
    return state.queue[offset];
  }

  function takeNext(state) {
    assertQueueState(state);
    const queue = state.queue.slice();
    let bag = state.bag.slice();
    const tier = queue.shift();
    const random = createRng(state.rngState);

    while (queue.length < state.size) {
      if (bag.length === 0) bag = createSpawnBag(random).slice();
      queue.push(bag.shift());
    }

    return Object.freeze({
      tier,
      state: freezeQueueState(queue, bag, random.getState(), state.size)
    });
  }

  function freezeScoreState(score, combo, lastMergeAt, courage) {
    return Object.freeze({ score, combo, lastMergeAt, courage });
  }

  function createScoreState() {
    return freezeScoreState(0, 0, null, 0);
  }

  function assertScoreState(state) {
    assertRecord(state, "score state");
    assertFinite(state.score, "score state score", 0);
    assertInteger(state.combo, "score state combo", 0, COMBO_MULTIPLIERS.length);
    assertInteger(state.courage, "score state courage", 0, RULES.maxCourage);
    if (state.lastMergeAt !== null) assertFinite(state.lastMergeAt, "score state lastMergeAt", 0);
    if ((state.combo === 0) !== (state.lastMergeAt === null)) {
      throw new RangeError("score state combo and lastMergeAt are inconsistent");
    }
  }

  function normalizeMarks(marks) {
    if (marks === undefined) return [null, null];
    if (!Array.isArray(marks) || marks.length !== 2) {
      throw new TypeError("merge marks must contain exactly two values");
    }
    return [0, 1].map((index) => {
      if (!Object.prototype.hasOwnProperty.call(marks, index)) {
        throw new TypeError("merge marks must be dense");
      }
      const mark = marks[index];
      if (mark === null) return null;
      if (typeof mark !== "string" || mark.length === 0) {
        throw new TypeError(`merge marks[${index}] must be null or a non-empty string`);
      }
      return mark;
    });
  }

  function scoreMerge(state, merge) {
    assertScoreState(state);
    assertRecord(merge, "merge");
    assertTier(merge.tier, "merge tier");
    assertFinite(merge.timestamp, "merge timestamp", 0);
    const precise = merge.precise === undefined ? false : merge.precise;
    assertBoolean(precise, "merge precise");
    const marks = normalizeMarks(merge.marks);

    if (state.lastMergeAt !== null && merge.timestamp < state.lastMergeAt) {
      throw new RangeError("merge timestamp cannot move backwards");
    }

    const chained = state.lastMergeAt !== null
      && merge.timestamp - state.lastMergeAt <= RULES.comboWindowMs;
    const combo = chained ? Math.min(state.combo + 1, COMBO_MULTIPLIERS.length) : 1;
    const comboMultiplier = COMBO_MULTIPLIERS[combo - 1];
    const precisionMultiplier = precise ? RULES.precisionMultiplier : 1;
    const secretCombination = merge.tier === MOMENTS.length - 1;
    const resultTier = secretCombination ? null : merge.tier + 1;
    const baseScore = secretCombination ? RULES.secretCombinationScore : MOMENTS[resultTier].score;
    const points = baseScore * comboMultiplier * precisionMultiplier;
    const mutualResponse = marks[0] !== null && marks[1] !== null && marks[0] !== marks[1];
    const courage = Math.min(
      RULES.maxCourage,
      state.courage + (mutualResponse ? 1 : 0)
    );
    const nextScore = state.score + points;
    if (!Number.isFinite(nextScore)) throw new RangeError("score exceeds the supported range");
    const nextState = freezeScoreState(nextScore, combo, merge.timestamp, courage);

    return Object.freeze({
      state: nextState,
      points,
      baseScore,
      comboMultiplier,
      precisionMultiplier,
      resultTier,
      secretCombination,
      mutualResponse,
      courageCharged: mutualResponse && courage > state.courage,
      label: mutualResponse ? RULES.mutualResponseLabel : null
    });
  }

  function useCourage(state, tier, longPress) {
    assertScoreState(state);
    assertTier(tier);
    assertBoolean(longPress, "longPress");
    const advanced = longPress
      && state.courage === RULES.maxCourage
      && tier <= RULES.courageMaxSourceTier;
    const nextState = freezeScoreState(
      state.score,
      state.combo,
      state.lastMergeAt,
      advanced ? 0 : state.courage
    );
    return Object.freeze({
      state: nextState,
      tier: advanced ? tier + 1 : tier,
      advanced,
      spentCourage: advanced ? RULES.maxCourage : 0
    });
  }

  function assertCatalog(catalog) {
    if (!Array.isArray(catalog) || catalog.length === 0) {
      throw new TypeError("event catalog must be a non-empty array");
    }
    const ids = new Set();
    for (let index = 0; index < catalog.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(catalog, index)) {
        throw new TypeError("event catalog must be dense");
      }
      const event = catalog[index];
      assertRecord(event, `event catalog[${index}]`);
      if (typeof event.id !== "string" || event.id.length === 0) {
        throw new TypeError(`event catalog[${index}].id must be a non-empty string`);
      }
      if (ids.has(event.id)) throw new RangeError("event catalog ids must be unique");
      ids.add(event.id);
    }
  }

  function pickCatalogEvent(catalog, random, previousId = null) {
    assertCatalog(catalog);
    if (previousId !== null && (typeof previousId !== "string" || previousId.length === 0)) {
      throw new TypeError("previousId must be null or a non-empty string");
    }
    const candidates = previousId !== null && catalog.length > 1
      ? catalog.filter((event) => event.id !== previousId)
      : catalog;
    const index = Math.floor(nextUnit(random) * candidates.length);
    return candidates[index];
  }

  function pickUnlockEvent(tier, random, previousId = null) {
    assertTier(tier);
    return pickCatalogEvent(UNLOCK_EVENTS[tier], random, previousId);
  }

  function pickMergeReward(tier, random, previousId = null) {
    assertTier(tier);
    return pickCatalogEvent(MERGE_REWARDS[tier], random, previousId);
  }

  function pickSecretCombination(random, previousId = null) {
    return pickCatalogEvent(SECRET_COMBINATIONS, random, previousId);
  }

  function sceneForTier(tier) {
    assertTier(tier);
    for (let index = SCENES.length - 1; index >= 0; index -= 1) {
      if (tier >= SCENES[index].minTier) return SCENES[index];
    }
    return SCENES[0];
  }

  function assertContactState(contact, label = "contact state") {
    assertRecord(contact, label);
    assertBoolean(contact.touching, `${label} touching`);
    assertBoolean(contact.settled, `${label} settled`);
    assertFinite(contact.updatedAt, `${label} updatedAt`, 0);
    if (contact.touching) {
      assertFinite(contact.since, `${label} since`, 0);
      if (contact.since > contact.updatedAt) {
        throw new RangeError(`${label} since cannot be after updatedAt`);
      }
    } else if (contact.since !== null || contact.settled) {
      throw new RangeError(`${label} is inconsistent`);
    }
    if (contact.settled && !contact.touching) throw new RangeError(`${label} is inconsistent`);
  }

  function settleContact(previous, touching, timestamp, settleMs) {
    if (previous !== null) assertContactState(previous, "previous contact state");
    assertBoolean(touching, "touching");
    assertFinite(timestamp, "timestamp", 0);
    assertFinite(settleMs, "settleMs", 0);
    if (previous !== null && timestamp < previous.updatedAt) {
      throw new RangeError("contact timestamp cannot move backwards");
    }
    if (!touching) {
      return Object.freeze({ touching: false, since: null, updatedAt: timestamp, settled: false });
    }
    const since = previous !== null && previous.touching ? previous.since : timestamp;
    return Object.freeze({
      touching: true,
      since,
      updatedAt: timestamp,
      settled: timestamp - since >= settleMs
    });
  }

  function optionalBoolean(record, key) {
    if (record[key] === undefined) return false;
    assertBoolean(record[key], `danger candidate ${key}`);
    return record[key];
  }

  function isDangerEligible(candidate) {
    assertRecord(candidate, "danger candidate");
    assertBoolean(candidate.released, "danger candidate released");
    assertBoolean(candidate.aboveLine, "danger candidate aboveLine");
    const held = optionalBoolean(candidate, "held");
    const merging = optionalBoolean(candidate, "merging");
    const removed = optionalBoolean(candidate, "removed");
    if (candidate.contact !== null) assertContactState(candidate.contact, "danger candidate contact");
    return candidate.released
      && candidate.aboveLine
      && !held
      && !merging
      && !removed
      && candidate.contact !== null
      && candidate.contact.touching
      && candidate.contact.settled;
  }

  function safeClone(value, stack, depth, path) {
    if (depth > SNAPSHOT_MAX_DEPTH) throw new RangeError("snapshot exceeds the maximum depth");
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new TypeError(`${path} must contain only finite numbers`);
      return value;
    }
    if (typeof value !== "object") throw new TypeError(`${path} is not JSON-safe`);
    if (stack.has(value)) throw new TypeError("snapshot cannot contain cycles");
    stack.add(value);

    try {
      if (Array.isArray(value)) {
        if (Object.getOwnPropertySymbols(value).length > 0) {
          throw new TypeError(`${path} cannot contain symbol keys`);
        }
        const names = Object.getOwnPropertyNames(value);
        const expectedNames = new Set(["length"]);
        for (let index = 0; index < value.length; index += 1) expectedNames.add(String(index));
        if (names.length !== expectedNames.size || names.some((name) => !expectedNames.has(name))) {
          throw new TypeError(`${path} must be a dense array`);
        }
        const clone = Array.from({ length: value.length }, (_, index) => {
          const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
          if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
            throw new TypeError(`${path}[${index}] must be a data value`);
          }
          return safeClone(descriptor.value, stack, depth + 1, `${path}[${index}]`);
        });
        return Object.freeze(clone);
      }

      if (!isRecord(value)) throw new TypeError(`${path} must contain only plain objects`);
      if (Object.getOwnPropertySymbols(value).length > 0) {
        throw new TypeError(`${path} cannot contain symbol keys`);
      }
      const keys = Object.keys(value);
      if (Object.getOwnPropertyNames(value).length !== keys.length) {
        throw new TypeError(`${path} cannot contain hidden properties`);
      }
      const clone = {};
      keys.forEach((key) => {
        if (UNSAFE_KEYS.has(key)) throw new TypeError(`${path} contains an unsafe key`);
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !("value" in descriptor)) {
          throw new TypeError(`${path}.${key} must be a data value`);
        }
        clone[key] = safeClone(descriptor.value, stack, depth + 1, `${path}.${key}`);
      });
      return Object.freeze(clone);
    } finally {
      stack.delete(value);
    }
  }

  function serializeSnapshot(value) {
    return JSON.stringify(safeClone(value, new WeakSet(), 0, "snapshot"));
  }

  function parseSnapshot(serialized) {
    if (typeof serialized !== "string") throw new TypeError("serialized snapshot must be a string");
    return safeClone(JSON.parse(serialized), new WeakSet(), 0, "snapshot");
  }

  return Object.freeze({
    MOMENTS,
    RESPONSE_MARKS,
    EVENT_CATALOGS,
    SCENES,
    RULES,
    createRng,
    createSpawnBag,
    createQueue,
    peekQueue,
    takeNext,
    createScoreState,
    scoreMerge,
    useCourage,
    pickCatalogEvent,
    pickUnlockEvent,
    pickMergeReward,
    pickSecretCombination,
    sceneForTier,
    settleContact,
    isDangerEligible,
    serializeSnapshot,
    parseSnapshot
  });
});
