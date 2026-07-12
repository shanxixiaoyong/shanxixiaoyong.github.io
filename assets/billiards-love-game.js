(function () {
  "use strict";

  const rules = window.BilliardsLoveRules;
  const content = window.BilliardsLoveContent;
  const Physics = window.BilliardsPhysics;
  if (!rules || !content || !Physics) throw new Error("幻彩桌球运行依赖未加载");

  const { Engine, Bodies, Body, Composite, Events } = Physics;
  const required = (selector) => {
    const node = document.querySelector(selector);
    if (!node) throw new Error(`缺少幻彩桌球节点：${selector}`);
    return node;
  };

  const root = required("#heartbeat-billiards");
  const canvas = required("#hb-canvas");
  let context = canvas.getContext("2d", { alpha: true });
  let tableCacheCanvas = null;
  let tableCacheDirty = true;
  let dateMapDarkCanvas = null;
  let dateMapClearCanvas = null;
  let dateMapFrameCanvas = null;
  let dateMapFrameContext = null;
  let dateMapFrameUpdatedAt = -Infinity;
  let dateMapFrameDirty = true;
  let sceneLightingFrameCanvas = null;
  let sceneLightingFrameContext = null;
  let sceneLightingFrameUpdatedAt = -Infinity;
  let sceneLightingFrameDirty = true;
  const tableWrap = required("#hb-table-wrap");
  const elements = {
    stageKicker: required("#hb-stage-kicker"),
    stageTitle: required("#hb-stage-title"),
    stageTargets: required("#hb-stage-targets"),
    interestWrap: required("#hb-interest-wrap"),
    interest: required("#hb-interest"),
    interestRing: required("#hb-interest-ring"),
    shots: required("#hb-shots"),
    streak: required("#hb-streak"),
    selectedBall: required("#hb-selected-ball"),
    selectedName: required("#hb-selected-name"),
    trackNodes: required("#hb-track-nodes"),
    trackProgress: required("#hb-track-progress"),
    call: required("#hb-call"),
    callLabel: required("#hb-call-label"),
    callTitle: required("#hb-call-title"),
    callHint: required("#hb-call-hint"),
    tableStory: required("#hb-table-story"),
    pocketFocus: required("#hb-pocket-focus"),
    sceneLens: required("#hb-scene-lens"),
    tableMoment: required("#hb-table-moment"),
    tableMomentScene: required("#hb-table-moment-scene"),
    tableMomentTitle: required("#hb-table-moment-title"),
    tableMomentLine: required("#hb-table-moment-line"),
    micro: required("#hb-micro"),
    microKicker: required("#hb-micro-kicker"),
    microTitle: required("#hb-micro-title"),
    microLine: required("#hb-micro-line"),
    judgement: required("#hb-judgement"),
    coach: required("#hb-coach"),
    surfaceToggle: required("#hb-surface-toggle"),
    surfaceIcon: required("#hb-surface-icon"),
    surfaceMenu: required("#hb-surface-menu"),
    aimToggle: required("#hb-aim-toggle"),
    sound: required("#hb-sound"),
    cinematic: required("#hb-cinematic"),
    cinematicImage: required("#hb-cinematic-image"),
    cinematicSkip: required("#hb-cinematic-skip"),
    cinematicKicker: required("#hb-cinematic-kicker"),
    cinematicTitle: required("#hb-cinematic-title"),
    cinematicLine: required("#hb-cinematic-line"),
    cinematicAction: required("#hb-cinematic-action"),
    result: required("#hb-result"),
    resultGrade: required("#hb-result-grade"),
    resultTitle: required("#hb-result-title"),
    resultLine: required("#hb-result-line"),
    resultShots: required("#hb-result-shots"),
    resultAccuracy: required("#hb-result-accuracy"),
    resultStreak: required("#hb-result-streak"),
    resultInterest: required("#hb-result-interest"),
    retry: required("#hb-retry")
  };
  const surfaceOptionNodes = Object.freeze([
    required("#hb-surface-water"),
    required("#hb-surface-ink"),
    required("#hb-surface-mercury"),
    required("#hb-surface-silk"),
    required("#hb-surface-plasma"),
    required("#hb-surface-frost")
  ]);

  const WORLD = Object.freeze({ width: 720, height: 1440 });
  const TABLE = Object.freeze({ left: 58, right: 662, top: 116, bottom: 1324 });
  const TABLE_OUTER = Object.freeze({ left: 2, right: 718, top: 48, bottom: 1392 });
  const BALL_RADIUS = 14.85;
  const BALL_DIAMETER = BALL_RADIUS * 2;
  const POCKET_RADIUS = 37.6;
  const POCKET_MIN_INWARD_SPEED = 0.012;
  const POCKET_MOUTH_DEPTH_TOLERANCE = BALL_RADIUS * 0.08;
  const POCKET_MOUTH_LATERAL_TOLERANCE = BALL_RADIUS * 0.06;
  const POCKET_SHELF_DEPTH_TOLERANCE = BALL_RADIUS * 0.10;
  const POCKET_SHELF_LATERAL_TOLERANCE = BALL_RADIUS * 0.08;
  const POCKET_APPROACH_EXIT_DEPTH = BALL_RADIUS * 0.30;
  const POCKET_LIP_SETTLE_RATIO = 0.88;
  const POCKET_VISUAL_CAPTURE_RATIO = 0.25;
  const CORNER_POCKET_MOUTH = BALL_DIAMETER * 2.28;
  const SIDE_POCKET_MOUTH = BALL_DIAMETER * 2.53;
  const CORNER_POCKET_SHELF = BALL_DIAMETER * 0.65;
  const SIDE_POCKET_SHELF = BALL_DIAMETER * 0.14;
  const CORNER_CUT_ANGLE_DEGREES = 142;
  const SIDE_CUT_ANGLE_DEGREES = 104;
  const CORNER_JAW_OFFSET = (CORNER_CUT_ANGLE_DEGREES - 135) * Math.PI / 180;
  const SIDE_JAW_OFFSET = (SIDE_CUT_ANGLE_DEGREES - 90) * Math.PI / 180;
  const POCKET_JAW_LENGTH = BALL_DIAMETER * 1.75;
  const FIXED_HZ = 120;
  const FIXED_STEP = 1000 / FIXED_HZ;
  const MAX_STEPS_PER_FRAME = 8;
  const MIN_PULL = 14;
  const MAX_PULL = 300;
  const LIGHT_PULL_END = 0.24;
  const STRONG_PULL_START = 0.82;
  const LIGHT_POWER_MAX = 0.30;
  const STRONG_POWER_MIN = 0.76;
  const MIN_SHOT_SPEED = 2.6;
  const MAX_SHOT_SPEED = 42;
  const STOP_SPEED = Physics.CONFIG.stopSpeed;
  const NATURAL_STOP_SPEED = 0.14;
  const POCKET_MIN_DURATION = 280;
  const POCKET_MAX_DURATION = 450;
  const POCKET_STORY_SLOW_MOTION_MS = 460;
  const POCKET_STORY_TIME_SCALE = 0.24;
  const TABLE_MOMENT_DEFAULT_DURATION = 1500;
  const MAX_RENDER_WIDTH = 1200;
  const MAX_RENDER_HEIGHT = 2400;
  const MAX_RENDER_PIXELS = MAX_RENDER_WIDTH * MAX_RENDER_HEIGHT;
  const MAX_BALL_RENDER_SCALE = 3.5;
  const DATE_MAP_REFRESH_MS = 1000 / 30;
  const SCENE_PORTAL_DURATION_MS = 1120;
  const WATER_GRID_WIDTH = 144;
  const WATER_GRID_HEIGHT = 288;
  const WATER_STEP_MS = 1000 / 30;
  const WATER_DAMPING = 0.986;
  const WATER_MAX_HEIGHT = 3.2;
  const RAIL_LED_INSET = 10;
  const RAIL_LED_SEGMENTS = 168;
  const RAIL_WAVE_LIFETIME_MS = 2100;
  const RAIL_WAVE_SPEED = 920;
  const CUE_SPOT = Object.freeze({ x: WORLD.width / 2, y: 1080 });
  const RACK_APEX = Object.freeze({ x: WORLD.width / 2, y: 510 });
  const COACH_KEY = "yl-heartbeat-billiards-coach-v2";
  const SETTINGS_KEY = "yl-heartbeat-billiards-settings-v2";
  const SURFACE_KEY = "yl-chroma-surface-material-v1";
  const RECORD_KEY = "yl-heartbeat-billiards-record-v2";
  const VIEWED_KEY = "yl-heartbeat-billiards-viewed-v2";
  const BALL_COLORS = Object.freeze({
    1: "#e9c348", 2: "#2676bf", 3: "#c33f40", 4: "#754493",
    5: "#df7b30", 6: "#358553", 7: "#8e3740", 8: "#181b1d",
    9: "#e9c348", 10: "#2676bf", 11: "#c33f40", 12: "#754493",
    13: "#df7b30", 14: "#358553", 15: "#8e3740"
  });
  const BALL_CHROMA_THEMES = Object.freeze({
    0: Object.freeze({ id: "pearl", label: "极光白", primary: "#eefaff", secondary: "#9ec9ff", accent: "#ffb9ef", deep: "#102130", glow: "#ffffff" }),
    1: Object.freeze({ id: "solar", label: "日冕金", primary: "#ffd85d", secondary: "#ff8f2f", accent: "#fff1a8", deep: "#3a1d08", glow: "#fff7c4" }),
    2: Object.freeze({ id: "cobalt", label: "电光蓝", primary: "#3aa8ff", secondary: "#3157ff", accent: "#9eeaff", deep: "#071c4a", glow: "#d4f7ff" }),
    3: Object.freeze({ id: "crimson", label: "脉冲红", primary: "#ff4f68", secondary: "#b5144c", accent: "#ffb29f", deep: "#3d0717", glow: "#ffd7cf" }),
    4: Object.freeze({ id: "nebula", label: "星云紫", primary: "#b96cff", secondary: "#6437d9", accent: "#ff9ae8", deep: "#210b48", glow: "#f2d5ff" }),
    5: Object.freeze({ id: "molten", label: "熔光橙", primary: "#ff9b3e", secondary: "#ef4428", accent: "#ffd27d", deep: "#421407", glow: "#ffe3a8" }),
    6: Object.freeze({ id: "emerald", label: "生物绿", primary: "#3ee6a0", secondary: "#087c6b", accent: "#b7ff98", deep: "#042c27", glow: "#d8ffd0" }),
    7: Object.freeze({ id: "ruby", label: "深红晶", primary: "#e93673", secondary: "#6f173d", accent: "#ff9dba", deep: "#310717", glow: "#ffd1df" }),
    8: Object.freeze({ id: "eclipse", label: "黑曜日蚀", primary: "#11131d", secondary: "#612caa", accent: "#ffcc62", deep: "#010208", glow: "#ffffff" }),
    9: Object.freeze({ id: "solar-stripe", label: "日冕流金", primary: "#ffd85d", secondary: "#fff6d0", accent: "#ff8f2f", deep: "#3a1d08", glow: "#ffffff" }),
    10: Object.freeze({ id: "cobalt-stripe", label: "电光冰蓝", primary: "#3aa8ff", secondary: "#edf8ff", accent: "#755dff", deep: "#071c4a", glow: "#ffffff" }),
    11: Object.freeze({ id: "crimson-stripe", label: "脉冲银红", primary: "#ff4f68", secondary: "#fff1ed", accent: "#d01a57", deep: "#3d0717", glow: "#ffffff" }),
    12: Object.freeze({ id: "nebula-stripe", label: "星云银紫", primary: "#b96cff", secondary: "#f7ecff", accent: "#ff82d8", deep: "#210b48", glow: "#ffffff" }),
    13: Object.freeze({ id: "molten-stripe", label: "熔光银橙", primary: "#ff9b3e", secondary: "#fff4df", accent: "#ef4428", deep: "#421407", glow: "#ffffff" }),
    14: Object.freeze({ id: "emerald-stripe", label: "生物银绿", primary: "#3ee6a0", secondary: "#effff8", accent: "#28b46c", deep: "#042c27", glow: "#ffffff" }),
    15: Object.freeze({ id: "ruby-stripe", label: "深红银晶", primary: "#e93673", secondary: "#fff0f5", accent: "#92214f", deep: "#310717", glow: "#ffffff" })
  });
  const POCKET_VFX_PROFILES = Object.freeze({
    "top-left": Object.freeze({ id: "ripple", label: "液态潮汐", glyph: "rings", primary: "#54d8ff", secondary: "#8a7dff" }),
    "top-right": Object.freeze({ id: "comet", label: "彗星火花", glyph: "burst", primary: "#ffcf5a", secondary: "#ff5d84" }),
    "middle-left": Object.freeze({ id: "prism", label: "棱镜折射", glyph: "prism", primary: "#9af7ff", secondary: "#ef72ff" }),
    "middle-right": Object.freeze({ id: "pulse", label: "量子脉冲", glyph: "segments", primary: "#62ffca", secondary: "#3b78ff" }),
    "bottom-left": Object.freeze({ id: "lightning", label: "电弧裂变", glyph: "bolts", primary: "#d7f7ff", secondary: "#6a5cff" }),
    "bottom-right": Object.freeze({ id: "aurora", label: "极光绸带", glyph: "ribbons", primary: "#68ffc8", secondary: "#d967ff" })
  });
  const SURFACE_MATERIALS = Object.freeze([
    Object.freeze({ id: "water", label: "深水镜", icon: "≈", rail: "#7eefff", damping: 0.986, disturbance: 1, radius: 1, wake: 1, tail: 1, railSpeed: 1, railWidth: 1, railGain: 1 }),
    Object.freeze({ id: "ink", label: "黑白墨韵", icon: "墨", rail: "#f2f2ec", damping: 0.971, disturbance: 0.62, radius: 1.72, wake: 0.68, tail: 1.64, railSpeed: 0.78, railWidth: 1.42, railGain: 0.92 }),
    Object.freeze({ id: "mercury", label: "液态金属", icon: "◉", rail: "#d8f8ff", damping: 0.993, disturbance: 0.78, radius: 0.72, wake: 0.82, tail: 0.72, railSpeed: 1.22, railWidth: 0.66, railGain: 1.2 }),
    Object.freeze({ id: "silk", label: "极光绸", icon: "〰", rail: "#ef8fff", damping: 0.964, disturbance: 0.52, radius: 1.58, wake: 0.58, tail: 1.45, railSpeed: 0.72, railWidth: 1.58, railGain: 0.84 }),
    Object.freeze({ id: "plasma", label: "离子流体", icon: "✦", rail: "#8d72ff", damping: 0.979, disturbance: 1.24, radius: 0.86, wake: 1.28, tail: 1.18, railSpeed: 1.48, railWidth: 0.8, railGain: 1.28 }),
    Object.freeze({ id: "frost", label: "晶霜", icon: "❄", rail: "#d8f9ff", damping: 0.996, disturbance: 0.9, radius: 0.6, wake: 0.88, tail: 0.62, railSpeed: 1.05, railWidth: 0.54, railGain: 1.12 })
  ]);
  const SURFACE_MATERIAL_BY_ID = Object.freeze(Object.fromEntries(
    SURFACE_MATERIALS.map((material) => [material.id, material])
  ));
  const CHROMA_TRANSITION_MS = 1180;
  const ROLL_TRAIL_LIFETIME_MS = 980;
  const RAIL_BURST_LIFETIME_MS = 780;
  const DATE_SCENE_STYLES = Object.freeze({
    "corner-store": Object.freeze({
      asset: null,
      primary: "#54d8ff",
      secondary: "#8a7dff",
      rail: "#d7f8ff"
    }),
    "coffee-window": Object.freeze({
      asset: null,
      primary: "#ffcf5a",
      secondary: "#ff5d84",
      rail: "#fff3bf"
    }),
    "late-cinema": Object.freeze({
      asset: null,
      primary: "#9af7ff",
      secondary: "#ef72ff",
      rail: "#efffff"
    }),
    "river-walk": Object.freeze({
      asset: null,
      primary: "#62ffca",
      secondary: "#3b78ff",
      rail: "#d7fff2"
    }),
    "last-train": Object.freeze({
      asset: null,
      primary: "#d7f7ff",
      secondary: "#6a5cff",
      rail: "#ffffff"
    }),
    "walk-home": Object.freeze({
      asset: null,
      primary: "#68ffc8",
      secondary: "#d967ff",
      rail: "#eafff8"
    })
  });
  const STAGE_SCENE_MOODS = Object.freeze([
    Object.freeze({ id: "ignition", label: "原色点火", primary: "#5ff6ff", secondary: "#4878ff", tint: "#173c59", imageAlpha: 0.72, light: 0.44 }),
    Object.freeze({ id: "dispersion", label: "色散展开", primary: "#ffce61", secondary: "#ff6e45", tint: "#743f22", imageAlpha: 0.75, light: 0.52 }),
    Object.freeze({ id: "refraction", label: "棱镜折射", primary: "#db70ff", secondary: "#5e7aff", tint: "#482a7a", imageAlpha: 0.78, light: 0.61 }),
    Object.freeze({ id: "pulse", label: "脉冲同步", primary: "#63ffca", secondary: "#3978ff", tint: "#155c54", imageAlpha: 0.82, light: 0.72 }),
    Object.freeze({ id: "overdrive", label: "光场过载", primary: "#ff5b7c", secondary: "#ffb43f", tint: "#70233b", imageAlpha: 0.84, light: 0.79 }),
    Object.freeze({ id: "spectrum", label: "全谱共振", primary: "#75eaff", secondary: "#d967ff", tint: "#39376f", imageAlpha: 0.82, light: 0.72 }),
    Object.freeze({ id: "eclipse", label: "黑曜日蚀", primary: "#ffffff", secondary: "#7d55ff", tint: "#171126", imageAlpha: 0.9, light: 0.94 })
  ]);
  const DATE_SCENE_VARIANTS = Object.freeze([
    Object.freeze({ name: "全景", zoom: 1, focusX: 0.5, focusY: 0.5, backdropX: 50, backdropY: 50 }),
    Object.freeze({ name: "靠窗", zoom: 1.13, focusX: 0.34, focusY: 0.42, backdropX: 38, backdropY: 43 }),
    Object.freeze({ name: "并肩", zoom: 1.19, focusX: 0.64, focusY: 0.57, backdropX: 64, backdropY: 57 }),
    Object.freeze({ name: "灯下", zoom: 1.25, focusX: 0.5, focusY: 0.3, backdropX: 50, backdropY: 34 }),
    Object.freeze({ name: "归途", zoom: 1.09, focusX: 0.48, focusY: 0.72, backdropX: 48, backdropY: 70 })
  ]);
  const MOTIF_SCENE_PALETTES = Object.freeze({
    raindrop: Object.freeze({ primary: "#83cfe3", secondary: "#9e8fe5", tint: "#4b718d" }),
    coffee: Object.freeze({ primary: "#f1ae66", secondary: "#d67272", tint: "#a85f45" }),
    "movie-ticket": Object.freeze({ primary: "#d84063", secondary: "#d9ad61", tint: "#8f304d" }),
    camera: Object.freeze({ primary: "#f4e7d4", secondary: "#b8cde7", tint: "#69798f" }),
    streetlamp: Object.freeze({ primary: "#f0c46f", secondary: "#eb8a75", tint: "#a66e41" }),
    earphones: Object.freeze({ primary: "#5fc5b8", secondary: "#b78be3", tint: "#417f7c" }),
    cat: Object.freeze({ primary: "#e0a777", secondary: "#8978b0", tint: "#685064" }),
    "heart-eight": Object.freeze({ primary: "#ed5d84", secondary: "#f0c477", tint: "#9d345a" }),
    sunset: Object.freeze({ primary: "#f17e66", secondary: "#f2c16d", tint: "#ba604f" }),
    gift: Object.freeze({ primary: "#e95678", secondary: "#d7a369", tint: "#9c3958" }),
    message: Object.freeze({ primary: "#74c8e7", secondary: "#d680c4", tint: "#4b7fa6" }),
    "bus-card": Object.freeze({ primary: "#42c2c5", secondary: "#8f8ddd", tint: "#357e88" }),
    star: Object.freeze({ primary: "#d2c6ff", secondary: "#80b9ec", tint: "#6963a1" }),
    umbrella: Object.freeze({ primary: "#72aee5", secondary: "#e283ad", tint: "#576f9d" }),
    homeward: Object.freeze({ primary: "#f29b79", secondary: "#f1d07c", tint: "#b76f5d" }),
    night: Object.freeze({ primary: "#d991aa", secondary: "#8dcfd5", tint: "#704058" })
  });
  const DEFAULT_DATE_SCENES = Object.freeze([
    { id: "corner-store", pocketId: "top-left", name: "液态涟漪", x: 178, y: 238, focusX: 18, focusY: 8, color: "#54d8ff" },
    { id: "coffee-window", pocketId: "top-right", name: "彗星火花", x: 542, y: 238, focusX: 82, focusY: 8, color: "#ffcf5a" },
    { id: "late-cinema", pocketId: "middle-left", name: "棱镜折射", x: 360, y: 478, focusX: 50, focusY: 28, color: "#9af7ff" },
    { id: "river-walk", pocketId: "middle-right", name: "量子脉冲", x: 360, y: 716, focusX: 50, focusY: 48, color: "#62ffca" },
    { id: "last-train", pocketId: "bottom-left", name: "电弧裂变", x: 360, y: 968, focusX: 50, focusY: 69, color: "#d7f7ff" },
    { id: "walk-home", pocketId: "bottom-right", name: "极光绸带", x: 360, y: 1192, focusX: 50, focusY: 90, color: "#68ffc8" }
  ]);
  const sourceDateScenes = Array.isArray(content.POCKET_DATE_SCENES)
    ? content.POCKET_DATE_SCENES
    : Object.values(content.POCKET_DATE_SCENES || {});
  const DATE_SCENES = Object.freeze(DEFAULT_DATE_SCENES.map((fallback) => Object.freeze({
    ...fallback,
    ...(sourceDateScenes.find((scene) => scene.pocketId === fallback.pocketId) || {}),
    drawType: fallback.id
  })));
  const DATE_SCENE_BY_POCKET = new Map(DATE_SCENES.map((scene) => [scene.pocketId, scene]));
  const FALLBACK_MOTIFS = Object.freeze([
    "rain", "coffee", "ticket", "camera", "lamp", "earphones", "cat", "heart",
    "sunset", "gift", "message", "transit", "star", "umbrella", "home"
  ]);
  const DIAGONAL = Math.SQRT1_2;

  function createPocket({ id, type, mouthX, mouthY, inwardX, inwardY }) {
    const mouth = type === "corner" ? CORNER_POCKET_MOUTH : SIDE_POCKET_MOUTH;
    const shelf = type === "corner" ? CORNER_POCKET_SHELF : SIDE_POCKET_SHELF;
    const cutAngleDegrees = type === "corner" ? CORNER_CUT_ANGLE_DEGREES : SIDE_CUT_ANGLE_DEGREES;
    const jawOffset = type === "corner" ? CORNER_JAW_OFFSET : SIDE_JAW_OFFSET;
    const captureDepth = Math.min(shelf, BALL_RADIUS * POCKET_VISUAL_CAPTURE_RATIO);
    const dropDepth = shelf + BALL_RADIUS;
    return Object.freeze({
      id,
      type,
      mouthX,
      mouthY,
      x: mouthX + inwardX * dropDepth,
      y: mouthY + inwardY * dropDepth,
      captureX: mouthX + inwardX * captureDepth,
      captureY: mouthY + inwardY * captureDepth,
      inwardX,
      inwardY,
      mouth,
      shelf,
      captureDepth,
      cutAngleDegrees,
      jawOffset,
      captureHalfWidth: mouth / 2 - captureDepth * Math.tan(jawOffset)
    });
  }

  const CORNER_MOUTH_AXIS_OFFSET = CORNER_POCKET_MOUTH * DIAGONAL / 2;
  const POCKETS = Object.freeze([
    createPocket({ id: "top-left", type: "corner", mouthX: TABLE.left + CORNER_MOUTH_AXIS_OFFSET, mouthY: TABLE.top + CORNER_MOUTH_AXIS_OFFSET, inwardX: -DIAGONAL, inwardY: -DIAGONAL }),
    createPocket({ id: "top-right", type: "corner", mouthX: TABLE.right - CORNER_MOUTH_AXIS_OFFSET, mouthY: TABLE.top + CORNER_MOUTH_AXIS_OFFSET, inwardX: DIAGONAL, inwardY: -DIAGONAL }),
    createPocket({ id: "middle-left", type: "side", mouthX: TABLE.left, mouthY: WORLD.height / 2, inwardX: -1, inwardY: 0 }),
    createPocket({ id: "middle-right", type: "side", mouthX: TABLE.right, mouthY: WORLD.height / 2, inwardX: 1, inwardY: 0 }),
    createPocket({ id: "bottom-left", type: "corner", mouthX: TABLE.left + CORNER_MOUTH_AXIS_OFFSET, mouthY: TABLE.bottom - CORNER_MOUTH_AXIS_OFFSET, inwardX: -DIAGONAL, inwardY: DIAGONAL }),
    createPocket({ id: "bottom-right", type: "corner", mouthX: TABLE.right - CORNER_MOUTH_AXIS_OFFSET, mouthY: TABLE.bottom - CORNER_MOUTH_AXIS_OFFSET, inwardX: DIAGONAL, inwardY: DIAGONAL })
  ]);
  const RACK = Object.freeze([
    [1],
    [4, 9],
    [2, 8, 10],
    [6, 14, 5, 15],
    [3, 7, 11, 12, 13]
  ]);
  const RELATIONSHIP_SIGHTS = Object.freeze([
    ...[0.25, 0.5, 0.75].map((fraction) => ({
      x: TABLE.left + (TABLE.right - TABLE.left) * fraction,
      y: TABLE.top - 43
    })),
    ...[0.125, 0.25, 0.375, 0.625, 0.75, 0.875].map((fraction) => ({
      x: TABLE.right + 43,
      y: TABLE.top + (TABLE.bottom - TABLE.top) * fraction
    })),
    ...[0.75, 0.5, 0.25].map((fraction) => ({
      x: TABLE.left + (TABLE.right - TABLE.left) * fraction,
      y: TABLE.bottom + 43
    })),
    ...[0.875, 0.75, 0.625, 0.375, 0.25, 0.125].map((fraction) => ({
      x: TABLE.left - 43,
      y: TABLE.top + (TABLE.bottom - TABLE.top) * fraction
    }))
  ]);
  function loadMaterialTexture(source) {
    if (typeof window.Image !== "function") return null;
    const image = new window.Image();
    image.decoding = "async";
    image.addEventListener("load", () => {
      tableCacheDirty = true;
      dateMapFrameDirty = true;
      sceneLightingFrameDirty = true;
    }, { once: true });
    image.src = source;
    return image;
  }

  const MATERIAL_TEXTURES = Object.freeze({
    cloth: loadMaterialTexture("assets/billiards-textures/worsted-cloth.jpg"),
    walnut: loadMaterialTexture("assets/billiards-textures/dark-walnut.jpg"),
    dateMap: null
  });
  const DATE_SCENE_TEXTURES = Object.freeze({});

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage is optional; gameplay remains fully local and transient.
    }
  }

  function markViewed(id) {
    if (!id) return;
    const viewed = readStorage(VIEWED_KEY, []);
    if (viewed.includes(id)) return;
    writeStorage(VIEWED_KEY, [...viewed, id]);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function powerFromPullRatio(value) {
    const ratio = clamp(value, 0, 1);
    if (ratio <= LIGHT_PULL_END) {
      return ratio / LIGHT_PULL_END * LIGHT_POWER_MAX;
    }
    if (ratio <= STRONG_PULL_START) {
      const progress = (ratio - LIGHT_PULL_END) / (STRONG_PULL_START - LIGHT_PULL_END);
      return LIGHT_POWER_MAX + progress * (STRONG_POWER_MIN - LIGHT_POWER_MAX);
    }
    const progress = (ratio - STRONG_PULL_START) / (1 - STRONG_PULL_START);
    return STRONG_POWER_MIN + progress * (1 - STRONG_POWER_MIN);
  }

  function distance(left, right) {
    return Math.hypot(left.x - right.x, left.y - right.y);
  }

  function normalize(vector, fallback = { x: 1, y: 0 }) {
    const length = Math.hypot(vector.x, vector.y);
    return length > 1e-7 ? { x: vector.x / length, y: vector.y / length } : { ...fallback };
  }

  function roundRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function ellipsePath(ctx, x, y, radiusX, radiusY, rotation = 0, start = 0, end = Math.PI * 2) {
    if (typeof ctx.ellipse === "function") {
      ctx.ellipse(x, y, radiusX, radiusY, rotation, start, end);
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(radiusX, radiusY);
    ctx.arc(0, 0, 1, start, end);
    ctx.restore();
  }

  function bezierPath(ctx, controlX1, controlY1, controlX2, controlY2, x, y) {
    if (typeof ctx.bezierCurveTo === "function") {
      ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, x, y);
    } else if (typeof ctx.quadraticCurveTo === "function") {
      ctx.quadraticCurveTo((controlX1 + controlX2) / 2, (controlY1 + controlY2) / 2, x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  function drawMaterialTexture(image, x, y, width, height, opacity) {
    if (!image || !image.complete || !image.naturalWidth || typeof context.drawImage !== "function") return false;
    context.save();
    context.globalAlpha = opacity;
    context.drawImage(image, x, y, width, height);
    context.restore();
    return true;
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, rect.height);
    const deviceScale = Math.max(1, Number(window.devicePixelRatio) || 1);
    renderScale = Math.min(
      deviceScale,
      MAX_RENDER_WIDTH / cssWidth,
      MAX_RENDER_HEIGHT / cssHeight,
      Math.sqrt(MAX_RENDER_PIXELS / (cssWidth * cssHeight))
    );
    canvas.width = Math.max(1, Math.round(cssWidth * renderScale));
    canvas.height = Math.max(1, Math.round(cssHeight * renderScale));
    resizeBallRenderer();
  }

  function configurePortraitSurface() {
    Object.assign(tableWrap.style, {
      width: "min(calc(100% - 10px), calc((100dvh - 92px) / 2))",
      height: "auto",
      minWidth: "0",
      maxWidth: "100%",
      maxHeight: "100%",
      aspectRatio: "1 / 2"
    });
    Object.assign(canvas.style, {
      position: "static",
      top: "auto",
      left: "auto",
      width: "100%",
      height: "100%",
      transform: "none",
      transformOrigin: "center"
    });
    canvas.setAttribute("aria-label", "在桌面任意位置反向滑动瞄准蓄力，松手或第二指轻触击球");
    resizeCanvas();
  }

  const RECORDED_AUDIO_ASSETS = Object.freeze({
    strike: "assets/audio/billiards/cue-strike.ogg",
    contactSoft: "assets/audio/billiards/ball-contact-soft.ogg",
    contactHard: "assets/audio/billiards/ball-contact-hard.ogg",
    rail: "assets/audio/billiards/rail-contact.ogg",
    pocket: "assets/audio/billiards/pocket-drop.ogg",
    event: "assets/audio/billiards/event-soft.ogg",
    stage: "assets/audio/billiards/stage-rise.ogg"
  });

  class HeartbeatPoolAudio {
    constructor() {
      const settings = readStorage(SETTINGS_KEY, {});
      this.enabled = settings.sound !== false;
      this.volume = Number.isFinite(settings.volume) ? clamp(settings.volume, 0.08, 0.8) : 0.54;
      this.context = null;
      this.master = null;
      this.sampleBytes = new Map();
      this.sampleBuffers = new Map();
      this.decodePromises = new Map();
      this.pendingStarts = new Set();
      this.lastCollisionAt = 0;
      this.lastRailAt = 0;
      this.stage = 1;
      this.dateFlow = 0;
      this.dateFlowPaused = false;
      this.musicLayers = [];
      this.prepareSamples();
    }

    prepareSamples() {
      if (typeof window.fetch !== "function") return;
      Object.entries(RECORDED_AUDIO_ASSETS).forEach(([name, url]) => {
        const request = window.fetch(url, { cache: "force-cache" })
          .then((response) => {
            if (!response.ok) throw new Error(`音频加载失败：${url}`);
            return response.arrayBuffer();
          })
          .catch(() => null);
        this.sampleBytes.set(name, request);
      });
    }

    unlock() {
      if (!this.enabled) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (this.context) {
        if (this.context.state === "suspended") this.context.resume().catch(() => {});
        return;
      }
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.context.destination);
      this.startMusicBed();
      this.decodeAllSamples();
    }

    decodeAllSamples() {
      if (!this.context || typeof this.context.decodeAudioData !== "function") return;
      this.sampleBytes.forEach((request, name) => {
        if (this.sampleBuffers.has(name) || this.decodePromises.has(name)) return;
        const decoding = request
          .then((bytes) => bytes ? this.context.decodeAudioData(bytes.slice(0)) : null)
          .then((buffer) => {
            if (buffer) this.sampleBuffers.set(name, buffer);
            return buffer;
          })
          .catch(() => null);
        this.decodePromises.set(name, decoding);
      });
    }

    startBuffer(buffer, gainValue, playbackRate) {
      if (!buffer || !this.enabled || !this.context || !this.master) return false;
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;
      gain.gain.value = clamp(gainValue, 0.02, 1.25);
      source.connect(gain).connect(this.master);
      source.start();
      return true;
    }

    playSample(name, gainValue = 1, playbackRate = 1) {
      if (!this.enabled) return false;
      this.unlock();
      const buffer = this.sampleBuffers.get(name);
      if (buffer) return this.startBuffer(buffer, gainValue, playbackRate);
      const decoding = this.decodePromises.get(name);
      if (!decoding || this.pendingStarts.has(name)) return false;
      const requestedAt = performance.now();
      const maximumDelay = ["event", "stage"].includes(name) ? 900 : 240;
      this.pendingStarts.add(name);
      decoding.then((decoded) => {
        this.pendingStarts.delete(name);
        if (decoded && performance.now() - requestedAt <= maximumDelay) {
          this.startBuffer(decoded, gainValue, playbackRate);
        }
      });
      return false;
    }

    startMusicBed() {
      if (!this.context || this.musicLayers.length || typeof this.context.createOscillator !== "function") return;
      const frequencies = [110, 164.81, 220, 329.63];
      frequencies.forEach((frequency, index) => {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = index < 2 ? "sine" : "triangle";
        oscillator.frequency.value = frequency;
        gain.gain.value = 0.0001;
        oscillator.connect(gain).connect(this.master);
        oscillator.start();
        this.musicLayers.push({ oscillator, gain });
      });
      this.applyDateFlow();
    }

    applyDateFlow() {
      if (!this.context || !this.musicLayers.length) return;
      const levels = this.dateFlowPaused
        ? [0.0022, 0.0001, 0.0001, 0.0001]
        : [0.0036, this.dateFlow >= 2 ? 0.003 : 0.0001, this.dateFlow >= 4 ? 0.002 : 0.0001, this.dateFlow >= 5 ? 0.0012 : 0.0001];
      this.musicLayers.forEach((layer, index) => {
        const target = this.enabled ? levels[index] : 0.0001;
        layer.gain.gain.setTargetAtTime?.(target, this.context.currentTime, 0.42);
      });
    }

    setStage(stage) {
      this.stage = clamp(Number(stage) || 1, 1, 7);
      const transpose = 1 + (this.stage - 1) * 0.012;
      this.musicLayers.forEach((layer, index) => {
        const base = [110, 164.81, 220, 329.63][index];
        layer.oscillator.frequency.setTargetAtTime?.(base * transpose, this.context.currentTime, 0.8);
      });
    }

    setDateFlow(streak, paused = false) {
      this.dateFlow = clamp(Math.trunc(streak || 0), 0, 8);
      this.dateFlowPaused = Boolean(paused);
      this.applyDateFlow();
    }

    cue(name, intensity = 1) {
      if (name === "strike") {
        this.playSample("strike", 0.82 * intensity, 0.98 + intensity * 0.025);
      } else if (name === "pocket") {
        this.playSample("pocket", 0.74 * intensity, 0.98);
      } else if (name === "scratch") {
        this.playSample("pocket", 0.58, 0.9);
      } else if (name === "warning" || name === "miss") {
        this.playSample("event", 0.36 * intensity, name === "warning" ? 0.86 : 0.92);
      } else if (name === "event") {
        this.playSample("event", 0.48 * intensity, 1);
      } else if (name === "streak") {
        this.playSample("event", 0.58 * intensity, 1.06);
      } else if (["stage", "confession", "proposal"].includes(name)) {
        const rate = name === "confession" ? 0.98 : name === "proposal" ? 1.04 : 1;
        this.playSample("stage", name === "proposal" ? 0.78 : 0.68, rate);
      }
    }

    collision(speed) {
      const now = performance.now();
      if (now - this.lastCollisionAt < 18 || speed < 0.32) return;
      this.lastCollisionAt = now;
      const hard = speed >= 6.4;
      this.playSample(hard ? "contactHard" : "contactSoft",
        clamp(0.22 + speed / 17, 0.24, 0.96),
        clamp(0.94 + speed * 0.008, 0.95, 1.07));
    }

    rail(speed) {
      const now = performance.now();
      if (now - this.lastRailAt < 28 || speed < 0.42) return;
      this.lastRailAt = now;
      this.playSample("rail", clamp(0.2 + speed / 20, 0.22, 0.82),
        clamp(0.94 + speed * 0.006, 0.95, 1.05));
    }

    snapshot() {
      return Object.freeze({
        mode: "recorded-samples-with-ambient-bed",
        enabled: this.enabled,
        contextState: this.context?.state || "uninitialized",
        loadedSamples: Object.freeze([...this.sampleBuffers.keys()].sort()),
        expectedSamples: Object.keys(RECORDED_AUDIO_ASSETS).length,
        dateFlow: this.dateFlow,
        musicLayers: this.musicLayers.length
      });
    }

    toggle() {
      this.enabled = !this.enabled;
      const settings = readStorage(SETTINGS_KEY, {});
      writeStorage(SETTINGS_KEY, { ...settings, sound: this.enabled, volume: this.volume });
      if (this.enabled) this.unlock();
      if (this.master && this.context) {
        this.master.gain.setTargetAtTime(this.enabled ? this.volume : 0.0001, this.context.currentTime, 0.04);
      }
      this.applyDateFlow();
      return this.enabled;
    }
  }

  const audio = new HeartbeatPoolAudio();
  const engine = Engine.create({ enableSleeping: false });
  engine.gravity.x = 0;
  engine.gravity.y = 0;
  engine.gravity.scale = 0;

  let rails = [];
  let balls = [];
  let cueBall = null;
  let runState = rules.createRunState();
  let selectedBallNumber = null;
  let shotState = null;
  let pointerAim = null;
  let aimDirection = { x: 0, y: -1 };
  let aimPower = 0;
  let resolvingShot = false;
  let cinematicActive = false;
  let resultVisible = false;
  let aimAssist = readStorage(SETTINGS_KEY, {}).aimAssist !== false;
  let accumulator = 0;
  let lastFrameAt = performance.now();
  let frameHandle = 0;
  let stableSteps = 0;
  let simulationTime = 0;
  let particles = [];
  let pocketBursts = [];
  let storyTrails = [];
  let collisionFeedbacks = [];
  let collisionCount = 0;
  let microQueue = [];
  let microTimer = 0;
  let judgementTimer = 0;
  let cinematicQueue = [];
  let cinematicCurrent = null;
  let cinematicTimer = 0;
  let tableMomentActive = false;
  let tableMomentCurrent = null;
  let tableMomentTimer = 0;
  let sceneLensTimer = 0;
  let sceneLensStartTimer = 0;
  let backdropCommitTimer = 0;
  let storySlowMotionUntil = 0;
  let lastStoryOrigin = { x: 50, y: 50 };
  let lastStoryWorldOrigin = { x: WORLD.width / 2, y: WORLD.height / 2 };
  let surfaceMaterialId = SURFACE_MATERIAL_BY_ID[readStorage(SURFACE_KEY, "water")]
    ? readStorage(SURFACE_KEY, "water")
    : "water";
  let surfaceMenuOpen = false;
  let dateMapState = createDateMapState();
  let waterSurface = createWaterSurface();
  let finalRevealActive = false;
  let finalRevealTimer = 0;
  let trackNodeMap = new Map();
  let screenFlash = 0;
  let screenShake = 0;
  let coachSeen = Boolean(readStorage(COACH_KEY, false));
  let cachedStageNumber = 1;
  let cachedAvailableTargets = new Set([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15]);
  let renderScale = 1;
  let ballRenderer = null;
  let ballRendererCanvas = null;
  let ballRendererFailed = false;
  let ballRendererDirty = true;

  function motifForBall(number) {
    const source = content.BALL_DATE_MOTIFS;
    const entry = Array.isArray(source)
      ? source.find((item) => Number(item?.number) === number) ?? source[number - 1]
      : source?.[number];
    if (typeof entry === "string") return entry;
    return entry?.id || entry?.motif || entry?.key || FALLBACK_MOTIFS[number - 1] || "star";
  }

  function motifScenePalette(motif) {
    return MOTIF_SCENE_PALETTES[motif] || MOTIF_SCENE_PALETTES.night;
  }

  function stageSceneMood(stageNumber = currentStageNumber()) {
    return STAGE_SCENE_MOODS[clamp(Number(stageNumber) || 1, 1, STAGE_SCENE_MOODS.length) - 1];
  }

  function sceneVariantFor(zone, number, motif, archetype) {
    const motifSeed = [...String(motif)].reduce((total, character) => total + character.charCodeAt(0), 0);
    const archetypeSeed = [...String(archetype || "direct")].reduce((total, character) => total + character.charCodeAt(0), 0);
    let index = (number * 3 + zone.visits * 2 + motifSeed + archetypeSeed) % DATE_SCENE_VARIANTS.length;
    if (index === zone.lastVariantIndex) index = (index + 1 + zone.visits) % DATE_SCENE_VARIANTS.length;
    zone.lastVariantIndex = index;
    return { index, ...DATE_SCENE_VARIANTS[index] };
  }

  function createDateMapState() {
    return {
      zones: new Map(DATE_SCENES.map((scene) => [scene.pocketId, {
        ...scene,
        reveal: 0,
        pulse: 0,
        visits: 0,
        motifs: [],
        lastVariantIndex: -1
      }])),
      routes: [],
      links: [],
      cueStops: [],
      lastPocketId: null,
      activeStreak: 0,
      bestStreak: 0,
      flow: 0,
      stagePulse: 0,
      powerWave: 0,
      activeScene: null,
      previousScene: null,
      sceneTransition: null,
      sceneHistory: [],
      completed: false,
      finalProgress: 0,
      ending: null,
      style: { precise: 0, bold: 0, adventurous: 0, playful: 0 },
      activeBallNumber: null,
      activeTheme: { ...BALL_CHROMA_THEMES[0] },
      previousTheme: null,
      activeEffect: null,
      themeTransition: null,
      surfaceMaterialId,
      previousSurfaceMaterialId: null,
      surfaceTransition: null,
      rollingTrails: [],
      railBursts: [],
      pocketFlares: [],
      blackEightBlast: null,
      waterEnergy: 0,
      railWavePeak: 0
    };
  }

  function activeSurfaceMaterial() {
    return SURFACE_MATERIAL_BY_ID[surfaceMaterialId] || SURFACE_MATERIAL_BY_ID.water;
  }

  function setSurfaceMenuOpen(open) {
    surfaceMenuOpen = Boolean(open);
    elements.surfaceMenu.hidden = !surfaceMenuOpen;
    elements.surfaceToggle.setAttribute("aria-expanded", String(surfaceMenuOpen));
  }

  function syncSurfaceMaterialUI() {
    const material = activeSurfaceMaterial();
    root.dataset.surfaceMaterial = material.id;
    elements.surfaceIcon.textContent = material.icon;
    elements.surfaceToggle.setAttribute("aria-label", `切换桌面材质，当前为${material.label}`);
    elements.surfaceToggle.setAttribute("title", `桌面材质 · ${material.label}`);
    surfaceOptionNodes.forEach((node) => {
      node.setAttribute("aria-checked", String(node.dataset.surfaceMaterial === material.id));
    });
  }

  function spawnSurfaceMaterialWave(material) {
    const theme = dateMapState.activeTheme || BALL_CHROMA_THEMES[0];
    dateMapState.railBursts.push({
      x: TABLE.left,
      y: TABLE.top,
      originS: railPerimeterLength() * 0.08,
      normalX: 0,
      normalY: 1,
      railId: `surface-${material.id}`,
      effectId: `surface-${material.id}`,
      color: material.rail,
      secondary: theme.secondary,
      intensity: 0.92,
      rgb: colorChannels(material.rail),
      speed: RAIL_WAVE_SPEED * material.railSpeed,
      width: 190 * material.railWidth,
      duration: RAIL_WAVE_LIFETIME_MS * (material.id === "frost" ? 1.38 : material.id === "plasma" ? 0.82 : 1.08),
      ageMs: 0,
      bornAt: performance.now(),
      life: 1
    });
    if (dateMapState.railBursts.length > 36) {
      dateMapState.railBursts.splice(0, dateMapState.railBursts.length - 36);
    }
  }

  function selectSurfaceMaterial(id, options = {}) {
    const material = SURFACE_MATERIAL_BY_ID[id];
    if (!material) return false;
    const previous = surfaceMaterialId;
    surfaceMaterialId = material.id;
    dateMapState.previousSurfaceMaterialId = previous;
    dateMapState.surfaceMaterialId = material.id;
    dateMapState.surfaceTransition = {
      from: previous,
      to: material.id,
      startedAt: performance.now(),
      duration: 720
    };
    if (material.id === "ink" && previous !== material.id && waterSurface) {
      waterSurface.pigment.fill(0);
      waterSurface.pigmentNext.fill(0);
    }
    if (options.persist !== false) writeStorage(SURFACE_KEY, material.id);
    syncSurfaceMaterialUI();
    setSurfaceMenuOpen(false);
    if (options.animate !== false && previous !== material.id) {
      const centerX = (TABLE.left + TABLE.right) / 2;
      const centerY = (TABLE.top + TABLE.bottom) / 2;
      disturbWaterWorld(centerX, centerY, material.id === "ink" ? -1.3 : 1.2, 112);
      disturbWaterWorld(TABLE.left + 90, TABLE.top + 220, 0.58, 70);
      disturbWaterWorld(TABLE.right - 92, TABLE.bottom - 250, -0.52, 76);
      spawnSurfaceMaterialWave(material);
      lastStoryWorldOrigin = { x: centerX, y: centerY };
      screenFlash = Math.max(screenFlash, material.id === "plasma" ? 0.12 : 0.075);
      dateMapFrameDirty = true;
      sceneLightingFrameDirty = true;
    }
    return true;
  }

  function rememberDateMoment(number, detail = {}, options = {}) {
    if (!Number.isInteger(number) || number < 0 || number > 15 || number === 8 && options.ignoreEight) return null;
    if (detail.dateRouteId) {
      return dateMapState.routes.find((route) => route.id === detail.dateRouteId) || null;
    }
    const pocket = POCKETS.find((item) => item.id === detail.pocketId)
      || POCKETS[(number * 5 + runState.shots) % POCKETS.length];
    const scene = DATE_SCENE_BY_POCKET.get(pocket.id) || DATE_SCENES[0];
    const zone = dateMapState.zones.get(scene.pocketId);
    const fallbackStart = dateMapState.cueStops.at(-1) || CUE_SPOT;
    const path = Array.isArray(detail.path) && detail.path.length > 1
      ? detail.path.map((point) => ({ x: point.x, y: point.y }))
      : [
          { x: fallbackStart.x, y: fallbackStart.y },
          { x: (fallbackStart.x + pocket.captureX) / 2, y: (fallbackStart.y + pocket.captureY) / 2 },
          { x: pocket.captureX, y: pocket.captureY }
        ];
    const now = performance.now();
    const theme = BALL_CHROMA_THEMES[number] || BALL_CHROMA_THEMES[0];
    const effect = POCKET_VFX_PROFILES[pocket.id] || POCKET_VFX_PROFILES["top-left"];
    const stageNumber = clamp(currentStageNumber(), 1, 7);
    const route = {
      id: `chroma-route-${runState.shots + 1}-${number}-${dateMapState.routes.length}`,
      number,
      physicalNumber: number,
      storyNumber: null,
      motif: theme.id,
      pocketId: pocket.id,
      sceneId: effect.id,
      sceneName: effect.label,
      sceneAsset: null,
      stageNumber,
      stageMood: theme.id,
      variantIndex: POCKETS.indexOf(pocket),
      variantName: effect.label,
      backdropX: pocket.x / WORLD.width * 100,
      backdropY: pocket.y / WORLD.height * 100,
      zoom: 1,
      color: theme.primary,
      path,
      railHits: Number(detail.railHits) || 0,
      jawHits: Number(detail.jawHits) || 0,
      travel: Number(detail.travel) || 0,
      archetype: options.archetype || "direct",
      bornAt: now,
      glow: 1
    };
    if (detail && typeof detail === "object" && Object.isExtensible(detail)) detail.dateRouteId = route.id;
    dateMapState.routes.push(route);
    if (dateMapState.routes.length > 15) dateMapState.routes.shift();
    dateMapFrameDirty = true;
    sceneLightingFrameDirty = true;
    if (zone) {
      zone.reveal = clamp(zone.reveal + (zone.visits ? 0.22 : 0.48), 0, 1);
      zone.pulse = 1;
      zone.visits += 1;
      if (!zone.motifs.includes(theme.id)) zone.motifs.push(theme.id);
    }
    dateMapState.previousTheme = dateMapState.activeTheme ? { ...dateMapState.activeTheme } : null;
    dateMapState.activeTheme = { ...theme, number };
    dateMapState.activeBallNumber = number;
    dateMapState.activeEffect = { ...effect, pocketId: pocket.id };
    dateMapState.themeTransition = {
      from: dateMapState.previousTheme,
      to: dateMapState.activeTheme,
      originX: pocket.captureX,
      originY: pocket.captureY,
      startedAt: now,
      duration: CHROMA_TRANSITION_MS
    };
    dateMapState.previousScene = dateMapState.activeScene ? { ...dateMapState.activeScene } : null;
    dateMapState.activeScene = {
      sceneId: effect.id,
      sceneName: effect.label,
      pocketId: pocket.id,
      number,
      motif: theme.id,
      archetype: route.archetype,
      stageNumber,
      variantIndex: route.variantIndex,
      variantName: effect.label,
      asset: null,
      primary: theme.primary,
      secondary: theme.secondary,
      rail: effect.primary,
      originX: pocket.captureX,
      originY: pocket.captureY,
      bornAt: now
    };
    dateMapState.sceneTransition = {
      from: dateMapState.previousScene,
      to: dateMapState.activeScene,
      startedAt: now,
      duration: SCENE_PORTAL_DURATION_MS
    };
    dateMapState.sceneHistory.push({ ...dateMapState.activeScene });
    if (dateMapState.sceneHistory.length > 15) dateMapState.sceneHistory.shift();
    dateMapState.pocketFlares.push({
      x: pocket.x,
      y: pocket.y,
      pocketId: pocket.id,
      effectId: effect.id,
      color: theme.primary,
      secondary: effect.secondary,
      bornAt: now,
      life: 1
    });
    if (dateMapState.pocketFlares.length > 12) dateMapState.pocketFlares.shift();
    disturbWaterWorld(pocket.captureX, pocket.captureY, number === 8 ? -2.8 : 1.35, number === 8 ? 92 : 52);
    spawnPocketRailWave(pocket, theme, effect, number === 8 ? 1 : 0.76);
    if (number === 8) {
      dateMapState.blackEightBlast = {
        startedAt: now,
        ageMs: 0,
        duration: 3900,
        pocketId: pocket.id,
        originX: pocket.x,
        originY: pocket.y,
        life: 1
      };
    }
    if (dateMapState.lastPocketId && dateMapState.lastPocketId !== pocket.id) {
      dateMapState.links.push({
        from: dateMapState.lastPocketId,
        to: pocket.id,
        color: scene.color,
        bornAt: performance.now()
      });
      if (dateMapState.links.length > 14) dateMapState.links.shift();
    }
    dateMapState.lastPocketId = pocket.id;
    dateMapState.flow = 1;
    lastStoryWorldOrigin = { x: pocket.x, y: pocket.y };
    focusBackdropScene(scene, route, { commit: false });
    return route;
  }

  function recordCueStop(completedShot, outcome) {
    const point = completedShot?.cueEnd;
    if (!point || completedShot.cueScratch) return;
    dateMapState.cueStops.push({
      x: point.x,
      y: point.y,
      power: completedShot.launchPower || 0,
      successful: Boolean(outcome?.pottedNumbers?.length),
      bornAt: performance.now()
    });
    if (dateMapState.cueStops.length > 20) dateMapState.cueStops.shift();
  }

  function applyShotStyle(analysis) {
    if (!analysis) return;
    if (["direct", "gentle", "long"].includes(analysis.id)) dateMapState.style.precise += 1;
    if (["power", "multi"].includes(analysis.id)) dateMapState.style.bold += 1;
    if (["bank", "combo"].includes(analysis.id)) dateMapState.style.adventurous += 1;
    if (["rattle", "near"].includes(analysis.id)) dateMapState.style.playful += 1;
    dateMapState.powerWave = analysis.id === "power" ? 1 : dateMapState.powerWave;
  }

  function setDateFlow(streak, paused = false) {
    dateMapState.activeStreak = paused ? 0 : Math.max(0, streak || 0);
    dateMapState.bestStreak = Math.max(dateMapState.bestStreak, streak || 0);
    dateMapState.flow = paused ? 0 : Math.max(dateMapState.flow, streak > 0 ? 1 : 0.28);
    sceneLightingFrameDirty = true;
    audio.setDateFlow?.(dateMapState.activeStreak, paused);
  }

  function bodyData(body) {
    return body?.plugin?.heartbeatPool || null;
  }

  function ballByNumber(number) {
    return balls.find((ball) => bodyData(ball)?.number === number) || null;
  }

  function isRail(body) {
    return Boolean(body?.plugin?.heartbeatRail);
  }

  function recordRailImpact(ball, rail, collision) {
    const data = bodyData(ball);
    if (!data || data.potted || data.pocketing) return;
    const details = collision?.details || {};
    const incoming = details.incoming || data.preStepVelocity || ball.velocity;
    const outgoing = details.outgoing || ball.velocity;
    const normal = normalize(collision?.normal || {
      x: ball.position.x - rail.position.x,
      y: ball.position.y - rail.position.y
    });
    const material = rail.plugin.heartbeatRail;
    data.lastRailImpact = {
      railId: material.id,
      kind: material.kind,
      model: details.model || "spin-cushion",
      at: simulationTime + FIXED_STEP,
      normalX: normal.x,
      normalY: normal.y,
      incomingX: incoming.x,
      incomingY: incoming.y,
      outgoingX: outgoing.x,
      outgoingY: outgoing.y,
      incomingNormalSpeed: details.incidentSpeed
        ?? Math.abs(incoming.x * normal.x + incoming.y * normal.y),
      outgoingNormalSpeed: details.outgoingNormalSpeed
        ?? Math.abs(outgoing.x * normal.x + outgoing.y * normal.y),
      restitution: details.restitution ?? Physics.CONFIG.cushionRestitutionMin,
      tangentialRetention: details.tangentialRetention ?? 1
    };
  }

  function spawnChromaRailBurst(ball, rail, collision, impactSpeed) {
    const data = bodyData(ball);
    const effect = dateMapState.activeEffect || POCKET_VFX_PROFILES["top-left"];
    if (!data || data.potted || data.pocketing || impactSpeed < 0.42) return;
    const contact = collision?.supports?.[0] || { x: ball.position.x, y: ball.position.y };
    const normal = normalize(collision?.normal || {
      x: ball.position.x - rail.position.x,
      y: ball.position.y - rail.position.y
    });
    const theme = BALL_CHROMA_THEMES[data.number] || dateMapState.activeTheme || BALL_CHROMA_THEMES[0];
    const waveProfiles = {
      ripple: { speed: 650, width: 190, duration: 2400 },
      comet: { speed: 1260, width: 105, duration: 1700 },
      prism: { speed: 900, width: 150, duration: 2200 },
      pulse: { speed: 780, width: 118, duration: 2000 },
      lightning: { speed: 1500, width: 74, duration: 1450 },
      aurora: { speed: 560, width: 240, duration: 2700 }
    };
    const profile = waveProfiles[effect.id] || { speed: RAIL_WAVE_SPEED, width: 150, duration: RAIL_WAVE_LIFETIME_MS };
    const surface = activeSurfaceMaterial();
    const railColor = surface.id === "ink" || surface.id === "mercury" || surface.id === "frost"
      ? surface.rail
      : theme.primary;
    dateMapState.railBursts.push({
      x: contact.x,
      y: contact.y,
      originS: railDistanceForContact(contact.x, contact.y),
      normalX: normal.x,
      normalY: normal.y,
      railId: rail.plugin.heartbeatRail?.id || "rail",
      effectId: effect.id,
      color: railColor,
      secondary: effect.secondary,
      intensity: clamp(impactSpeed / 18 * surface.railGain, 0.25, 1),
      rgb: colorChannels(railColor),
      speed: profile.speed * surface.railSpeed * (0.82 + clamp(impactSpeed / 30, 0, 1) * 0.36),
      width: profile.width * surface.railWidth,
      duration: profile.duration,
      ageMs: 0,
      bornAt: performance.now(),
      life: 1
    });
    if (dateMapState.railBursts.length > 36) {
      dateMapState.railBursts.splice(0, dateMapState.railBursts.length - 36);
    }
    disturbWaterWorld(contact.x - normal.x * 10, contact.y - normal.y * 10,
      clamp(impactSpeed / 16, 0.32, 1.35), 20 + clamp(impactSpeed, 0, 22));
    dateMapFrameDirty = true;
    sceneLightingFrameDirty = true;
  }

  function spawnPocketRailWave(pocket, theme, effect, intensity = 0.75) {
    if (!pocket || !theme || !effect) return;
    const surface = activeSurfaceMaterial();
    const railColor = surface.id === "ink" || surface.id === "mercury" || surface.id === "frost"
      ? surface.rail
      : theme.primary;
    dateMapState.railBursts.push({
      x: pocket.x,
      y: pocket.y,
      originS: railDistanceForContact(pocket.x, pocket.y),
      normalX: -pocket.inwardX,
      normalY: -pocket.inwardY,
      railId: `pocket-${pocket.id}`,
      effectId: effect.id,
      color: railColor,
      secondary: effect.secondary,
      intensity: clamp(intensity * surface.railGain, 0, 1),
      rgb: colorChannels(railColor),
      speed: RAIL_WAVE_SPEED * surface.railSpeed * (effect.id === "lightning" ? 1.45 : effect.id === "aurora" ? 0.68 : 1),
      width: (effect.id === "aurora" ? 260 : effect.id === "lightning" ? 88 : 172) * surface.railWidth,
      duration: effect.id === "aurora" ? 2850 : RAIL_WAVE_LIFETIME_MS,
      ageMs: 0,
      bornAt: performance.now(),
      life: 1
    });
    if (dateMapState.railBursts.length > 36) {
      dateMapState.railBursts.splice(0, dateMapState.railBursts.length - 36);
    }
  }

  function createRail(x, y, width, height, id, angle = 0, kind = "cushion") {
    const body = Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      label: `hb-rail-${id}`,
      angle,
      restitution: 1,
      friction: 0,
      frictionStatic: 0,
      slop: 0.03
    });
    body.plugin.heartbeatRail = { id, kind, width, height, angle };
    return body;
  }

  function createJaw(start, end, id) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    return createRail(
      (start.x + end.x) / 2,
      (start.y + end.y) / 2,
      length,
      12,
      id,
      Math.atan2(dy, dx),
      "jaw"
    );
  }

  function pocketMouthEndpoint(pocket, side) {
    const tangentX = -pocket.inwardY;
    const tangentY = pocket.inwardX;
    return {
      x: pocket.mouthX + tangentX * pocket.mouth / 2 * side,
      y: pocket.mouthY + tangentY * pocket.mouth / 2 * side
    };
  }

  function createPocketJaw(pocket, side, id) {
    const nose = pocketMouthEndpoint(pocket, side);
    const entryAngle = Math.atan2(pocket.inwardY, pocket.inwardX);
    const heading = entryAngle - side * pocket.jawOffset;
    const end = {
      x: nose.x + Math.cos(heading) * POCKET_JAW_LENGTH,
      y: nose.y + Math.sin(heading) * POCKET_JAW_LENGTH
    };
    const jaw = createJaw(nose, end, id);
    Object.assign(jaw.plugin.heartbeatRail, {
      pocketId: pocket.id,
      pocketType: pocket.type,
      cutAngleDegrees: pocket.cutAngleDegrees,
      headingDegrees: (heading * 180 / Math.PI + 360) % 360,
      mouthSide: side,
      noseX: nose.x,
      noseY: nose.y
    });
    return jaw;
  }

  function buildRails() {
    if (rails.length) Composite.remove(engine.world, rails);
    const mid = WORLD.height / 2;
    const cornerRun = CORNER_POCKET_MOUTH * DIAGONAL;
    const sideHalfMouth = SIDE_POCKET_MOUTH / 2;
    const thickness = 25;
    const horizontalStart = TABLE.left + cornerRun;
    const horizontalEnd = TABLE.right - cornerRun;
    const verticalTopStart = TABLE.top + cornerRun;
    const verticalTopEnd = mid - sideHalfMouth;
    const verticalBottomStart = mid + sideHalfMouth;
    const verticalBottomEnd = TABLE.bottom - cornerRun;
    const topRailY = TABLE.top - thickness / 2;
    const bottomRailY = TABLE.bottom + thickness / 2;
    const leftRailX = TABLE.left - thickness / 2;
    const rightRailX = TABLE.right + thickness / 2;
    const pocket = Object.fromEntries(POCKETS.map((item) => [item.id, item]));
    rails = [
      createRail(WORLD.width / 2, topRailY, horizontalEnd - horizontalStart, thickness, "top"),
      createRail(WORLD.width / 2, bottomRailY, horizontalEnd - horizontalStart, thickness, "bottom"),
      createRail(leftRailX, (verticalTopStart + verticalTopEnd) / 2, thickness, verticalTopEnd - verticalTopStart, "left-top"),
      createRail(leftRailX, (verticalBottomStart + verticalBottomEnd) / 2, thickness, verticalBottomEnd - verticalBottomStart, "left-bottom"),
      createRail(rightRailX, (verticalTopStart + verticalTopEnd) / 2, thickness, verticalTopEnd - verticalTopStart, "right-top"),
      createRail(rightRailX, (verticalBottomStart + verticalBottomEnd) / 2, thickness, verticalBottomEnd - verticalBottomStart, "right-bottom"),

      createPocketJaw(pocket["top-left"], 1, "jaw-top-left-horizontal"),
      createPocketJaw(pocket["top-left"], -1, "jaw-top-left-vertical"),
      createPocketJaw(pocket["top-right"], -1, "jaw-top-right-horizontal"),
      createPocketJaw(pocket["top-right"], 1, "jaw-top-right-vertical"),
      createPocketJaw(pocket["bottom-left"], -1, "jaw-bottom-left-horizontal"),
      createPocketJaw(pocket["bottom-left"], 1, "jaw-bottom-left-vertical"),
      createPocketJaw(pocket["bottom-right"], 1, "jaw-bottom-right-horizontal"),
      createPocketJaw(pocket["bottom-right"], -1, "jaw-bottom-right-vertical"),
      createPocketJaw(pocket["middle-left"], 1, "jaw-middle-left-top"),
      createPocketJaw(pocket["middle-left"], -1, "jaw-middle-left-bottom"),
      createPocketJaw(pocket["middle-right"], -1, "jaw-middle-right-top"),
      createPocketJaw(pocket["middle-right"], 1, "jaw-middle-right-bottom"),

      createRail(WORLD.width / 2, TABLE_OUTER.top - 20, TABLE_OUTER.right - TABLE_OUTER.left + 96, 24, "guard-top", 0, "guard"),
      createRail(WORLD.width / 2, TABLE_OUTER.bottom + 20, TABLE_OUTER.right - TABLE_OUTER.left + 96, 24, "guard-bottom", 0, "guard"),
      createRail(TABLE_OUTER.left - 20, WORLD.height / 2, 24, TABLE_OUTER.bottom - TABLE_OUTER.top + 96, "guard-left", 0, "guard"),
      createRail(TABLE_OUTER.right + 20, WORLD.height / 2, 24, TABLE_OUTER.bottom - TABLE_OUTER.top + 96, "guard-right", 0, "guard")
    ];
    Composite.add(engine.world, rails);
  }

  function createBall(number, x, y) {
    const body = Bodies.circle(x, y, BALL_RADIUS, {
      label: number === 0 ? "hb-cue-ball" : `hb-object-ball-${number}`,
      restitution: Physics.CONFIG.ballRestitution,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      density: 0.0025,
      slop: 0.003,
      sleepThreshold: Infinity
    });
    body.plugin.heartbeatPool = {
      number,
      potted: false,
      shotRailHits: 0,
      shotJawHits: 0,
      shotTravel: 0,
      shotTrail: [],
      pocketMouthEntries: 0,
      pocketing: null,
      pocketApproach: null,
      rollAngle: 0,
      rollVelocity: 0,
      rollHeading: -Math.PI / 2,
      lastPosition: { x, y },
      previousPosition: { x, y },
      preStepVelocity: { x: 0, y: 0 },
      lastSafePosition: { x, y },
      outsideSteps: 0,
      lastRailImpact: null,
      lastChromaTrailAt: -Infinity,
      compression: 0,
      impactGlow: 0,
      impactAngle: 0
    };
    Body.setInertia(body, Infinity);
    balls.push(body);
    Composite.add(engine.world, body);
    if (number === 0) cueBall = body;
    return body;
  }

  function clearBalls() {
    balls.slice().forEach((ball) => Composite.remove(engine.world, ball));
    balls = [];
    cueBall = null;
  }

  function rackBalls() {
    clearBalls();
    createBall(0, CUE_SPOT.x, CUE_SPOT.y);
    const spacing = BALL_RADIUS * 2 + 1.3;
    const yStep = spacing * Math.cos(Math.PI / 6);
    RACK.forEach((row, rowIndex) => {
      const y = RACK_APEX.y - rowIndex * yStep;
      row.forEach((number, index) => {
        const x = RACK_APEX.x + (index - rowIndex / 2) * spacing;
        createBall(number, x, y);
      });
    });
  }

  function pointIsOpen(point, radius = BALL_RADIUS) {
    if (point.x < TABLE.left + radius || point.x > TABLE.right - radius
        || point.y < TABLE.top + radius || point.y > TABLE.bottom - radius) return false;
    return balls.every((ball) => bodyData(ball)?.potted || distance(point, ball.position) >= radius + BALL_RADIUS + 2);
  }

  function findOpenSpot(preferred) {
    if (pointIsOpen(preferred)) return preferred;
    const spacing = BALL_RADIUS * 2.6;
    for (let ring = 1; ring <= 14; ring += 1) {
      const samples = Math.max(12, ring * 12);
      for (let index = 0; index < samples; index += 1) {
        const angle = index / samples * Math.PI * 2;
        const point = {
          x: clamp(preferred.x + Math.cos(angle) * spacing * ring, TABLE.left + BALL_RADIUS + 2, TABLE.right - BALL_RADIUS - 2),
          y: clamp(preferred.y + Math.sin(angle) * spacing * ring, TABLE.top + BALL_RADIUS + 2, TABLE.bottom - BALL_RADIUS - 2)
        };
        if (pointIsOpen(point)) return point;
      }
    }
    return { ...CUE_SPOT };
  }

  function respotBall(number) {
    if (ballByNumber(number)) return;
    const preferred = number === 0
      ? CUE_SPOT
      : RACK_APEX;
    const point = findOpenSpot(preferred);
    createBall(number, point.x, point.y);
  }

  function removeBall(body) {
    const data = bodyData(body);
    if (!data || data.potted) return;
    data.potted = true;
    const index = balls.indexOf(body);
    if (index >= 0) balls.splice(index, 1);
    Composite.remove(engine.world, body);
    if (body === cueBall) cueBall = null;
  }

  function resetShotRailHits() {
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (data) {
        data.shotRailHits = 0;
        data.shotJawHits = 0;
        data.shotTravel = 0;
        data.shotTrail = [{ x: ball.position.x, y: ball.position.y }];
        data.pocketMouthEntries = 0;
        data.lastRailImpact = null;
        data.lastChromaTrailAt = -Infinity;
      }
    });
  }

  function resetGame() {
    runState = rules.createRunState();
    selectedBallNumber = null;
    shotState = null;
    pointerAim = null;
    aimDirection = { x: 0, y: -1 };
    aimPower = 0;
    resolvingShot = false;
    cinematicActive = false;
    resultVisible = false;
    accumulator = 0;
    stableSteps = 0;
    simulationTime = 0;
    particles = [];
    pocketBursts = [];
    storyTrails = [];
    collisionFeedbacks = [];
    collisionCount = 0;
    microQueue = [];
    cinematicQueue = [];
    cinematicCurrent = null;
    tableMomentActive = false;
    tableMomentCurrent = null;
    storySlowMotionUntil = 0;
    lastStoryOrigin = { x: 50, y: 50 };
    lastStoryWorldOrigin = { x: WORLD.width / 2, y: WORLD.height / 2 };
    dateMapState = createDateMapState();
    resetWaterSurface();
    setSurfaceMenuOpen(false);
    dateMapFrameDirty = true;
    dateMapFrameUpdatedAt = -Infinity;
    sceneLightingFrameDirty = true;
    sceneLightingFrameUpdatedAt = -Infinity;
    ballRendererDirty = true;
    finalRevealActive = false;
    clearTimeout(microTimer);
    clearTimeout(judgementTimer);
    clearTimeout(cinematicTimer);
    clearTimeout(tableMomentTimer);
    clearTimeout(sceneLensTimer);
    clearTimeout(sceneLensStartTimer);
    clearTimeout(backdropCommitTimer);
    clearTimeout(finalRevealTimer);
    screenFlash = 0;
    screenShake = 0;
    elements.result.hidden = true;
    elements.cinematic.hidden = true;
    elements.tableMoment.hidden = true;
    elements.pocketFocus.hidden = true;
    elements.sceneLens.classList.remove("is-active");
    elements.micro.hidden = true;
    root.dataset.scene = "spectrum";
    root.dataset.motif = "pearl";
    root.dataset.sceneVariant = "0";
    root.style.setProperty("--hb-scene-x", "50%");
    root.style.setProperty("--hb-scene-y", "18%");
    root.style.setProperty("--hb-scene-opacity", "0.32");
    root.style.setProperty("--hb-scene-scale", "1");
    root.style.setProperty("--hb-scene-color", BALL_CHROMA_THEMES[0].primary);
    root.style.setProperty("--hb-scene-secondary", BALL_CHROMA_THEMES[0].secondary);
    root.style.setProperty("--hb-backdrop-image", "none");
    root.style.setProperty("--hb-scene-image", "none");
    setDateFlow(0, true);
    rackBalls();
    syncUI();
    root.dataset.state = "break";
  }

  function buildTimeline() {
    const fragment = document.createDocumentFragment();
    trackNodeMap = new Map();
    DATE_SCENES.forEach((scene, index) => {
      const item = document.createElement("li");
      item.className = "hb-track-node";
      item.dataset.scene = scene.id;
      const number = document.createElement("i");
      number.textContent = String(index + 1).padStart(2, "0");
      const label = document.createElement("span");
      label.textContent = scene.name;
      item.append(number, label);
      trackNodeMap.set(scene.pocketId, item);
      fragment.append(item);
    });
    elements.trackNodes.replaceChildren(fragment);
  }

  function syncTableStory() {
    const litScenes = [...dateMapState.zones.values()].filter((zone) => zone.visits > 0).length;
    elements.tableStory.dataset.litScenes = String(litScenes);
    elements.tableStory.dataset.flow = String(Math.min(5, dateMapState.activeStreak));
    elements.tableStory.dataset.completed = String(dateMapState.completed);
  }

  function storyOriginForPocket(pocket) {
    const rootRect = root.getBoundingClientRect();
    const tableRect = tableWrap.getBoundingClientRect();
    const rootWidth = Math.max(1, rootRect.width);
    const rootHeight = Math.max(1, rootRect.height);
    return {
      x: clamp((tableRect.left - rootRect.left + pocket.x / WORLD.width * tableRect.width) / rootWidth * 100, 0, 100),
      y: clamp((tableRect.top - rootRect.top + pocket.y / WORLD.height * tableRect.height) / rootHeight * 100, 0, 100)
    };
  }

  function cssSceneImage(asset) {
    return `url(\"/${String(asset || "").replace(/^\/+/, "")}\")`;
  }

  function focusBackdropScene(scene, route, options = {}) {
    const theme = dateMapState.activeTheme || BALL_CHROMA_THEMES[0];
    const effect = dateMapState.activeEffect || POCKET_VFX_PROFILES[route?.pocketId] || POCKET_VFX_PROFILES["top-left"];
    root.dataset.scene = effect.id;
    root.dataset.motif = theme.id;
    root.dataset.sceneVariant = String(route?.variantIndex ?? 0);
    root.dataset.sceneMood = theme.id;
    root.style.setProperty("--hb-scene-image", "none");
    root.style.setProperty("--hb-backdrop-image", "none");
    root.style.setProperty("--hb-scene-x", `${route?.backdropX ?? 50}%`);
    root.style.setProperty("--hb-scene-y", `${route?.backdropY ?? 50}%`);
    root.style.setProperty("--hb-scene-scale", "1");
    root.style.setProperty("--hb-scene-color", theme.primary);
    root.style.setProperty("--hb-scene-secondary", theme.secondary);
    root.style.setProperty("--hb-stage-scene-primary", effect.primary);
    root.style.setProperty("--hb-stage-scene-secondary", effect.secondary);
    root.style.setProperty("--hb-scene-opacity", String(clamp(0.38 + dateMapState.activeStreak * 0.045, 0.38, 0.72)));
  }

  function playSceneLens(scene, route, pocket) {
    if (!scene || !pocket) return;
    const origin = storyOriginForPocket(pocket);
    focusBackdropScene(scene, route);
    root.style.setProperty("--hb-scene-origin-x", `${origin.x}%`);
    root.style.setProperty("--hb-scene-origin-y", `${origin.y}%`);
    clearTimeout(sceneLensTimer);
    elements.sceneLens.dataset.camera = route?.archetype || "direct";
    elements.sceneLens.classList.remove("is-active");
    void elements.sceneLens.offsetWidth;
    elements.sceneLens.classList.add("is-active");
    sceneLensTimer = setTimeout(() => elements.sceneLens.classList.remove("is-active"), SCENE_PORTAL_DURATION_MS + 120);
  }

  function beginPocketStoryFocus(pocket, route = null) {
    lastStoryOrigin = storyOriginForPocket(pocket);
    lastStoryWorldOrigin = { x: pocket.x, y: pocket.y };
    const scene = DATE_SCENE_BY_POCKET.get(pocket.id) || DATE_SCENES[0];
    elements.pocketFocus.style.setProperty("--pocket-x", `${pocket.x / WORLD.width * 100}%`);
    elements.pocketFocus.style.setProperty("--pocket-y", `${pocket.y / WORLD.height * 100}%`);
    elements.pocketFocus.hidden = true;
    void elements.pocketFocus.offsetWidth;
    elements.pocketFocus.hidden = false;
    storySlowMotionUntil = performance.now() + POCKET_STORY_SLOW_MOTION_MS;
    clearTimeout(sceneLensStartTimer);
    sceneLensStartTimer = setTimeout(() => playSceneLens(scene, route, pocket), 110);
    setTimeout(() => {
      elements.pocketFocus.hidden = true;
    }, 1080);
  }

  function hideTableMoment() {
    if (!tableMomentActive) return;
    clearTimeout(tableMomentTimer);
    elements.tableMoment.hidden = true;
    tableMomentActive = false;
    tableMomentCurrent = null;
    if (microQueue.length && elements.micro.hidden) showNextMicro();
    else if (cinematicQueue.length && !cinematicActive && elements.micro.hidden) showNextCinematic();
    else if (runState.endState.ended && !cinematicActive && !resultVisible && !finalRevealActive) showResult();
    else if (!shotState && !resolvingShot && !runState.endState.ended) root.dataset.state = "aiming";
  }

  function showTableMoment(story) {
    if (!story) return;
    clearTimeout(tableMomentTimer);
    tableMomentCurrent = story;
    tableMomentActive = true;
    elements.tableMoment.dataset.archetype = story.archetype || "direct";
    elements.tableMoment.dataset.motion = story.visualMode || story.archetype || "straight";
    elements.tableMoment.dataset.scene = story.sceneId || story.stageId || "date-map";
    elements.tableMoment.style.setProperty("--hb-moment-duration", `${story.durationMs || TABLE_MOMENT_DEFAULT_DURATION}ms`);
    elements.tableMomentScene.textContent = story.sceneName || story.scene || story.technique || "幻彩球台";
    elements.tableMomentTitle.textContent = story.title;
    elements.tableMomentLine.textContent = story.line;
    elements.tableMoment.hidden = true;
    void elements.tableMoment.offsetWidth;
    elements.tableMoment.hidden = false;
    audio.cue(story.archetype === content.SHOT_ARCHETYPES.MULTI ? "streak" : "event", 0.9);
    tableMomentTimer = setTimeout(hideTableMoment, story.durationMs || TABLE_MOMENT_DEFAULT_DURATION);
  }

  function currentStageNumber() {
    return cachedStageNumber;
  }

  function syncUI() {
    const stage = rules.currentStage(runState);
    const progress = rules.stageProgress(runState);
    const interestSignal = rules.interestStatus(runState);
    const stageNumber = stage?.number || 7;
    const targets = rules.availableTargets(runState);
    const litScenes = [...dateMapState.zones.values()].filter((zone) => zone.visits > 0).length;
    const lastScene = DATE_SCENE_BY_POCKET.get(dateMapState.lastPocketId);
    const lastRoute = dateMapState.routes.at(-1);
    const activeTheme = dateMapState.activeTheme || BALL_CHROMA_THEMES[0];
    const activeEffect = dateMapState.activeEffect;
    if (stageNumber !== cachedStageNumber) tableCacheDirty = true;
    cachedStageNumber = stageNumber;
    cachedAvailableTargets = new Set(targets);
    dateMapFrameDirty = true;
    ballRendererDirty = true;
    root.dataset.stage = String(stageNumber);
    elements.stageKicker.textContent = runState.endState.ended
      ? "幻彩清台 · 能量闭环"
      : `色谱进度 · ${String(runState.pottedNumbers.length).padStart(2, "0")} / 15`;
    elements.stageTitle.textContent = progress?.target === "eight"
      ? "黑曜日蚀已经进入最终轨道"
      : activeEffect ? `${activeTheme.label} × ${activeEffect.label}` : "第一颗落袋球将重构整张球台";
    elements.stageTargets.textContent = progress
      ? progress.target === "eight"
        ? "击入黑 8，触发六种袋口效果同时爆发"
        : `球色控制桌布色谱，袋口控制滚动与碰库特效 · 还剩 ${15 - runState.pottedNumbers.length} 颗`
      : "全部能量已经汇入黑曜核心";
    const flowLabels = dateMapState.activeStreak >= 5
      ? ["超载", 1]
      : dateMapState.activeStreak >= 3 ? ["共振", 0.84]
        : dateMapState.activeStreak >= 1 ? ["激活", 0.68]
          : runState.consecutiveMisses > 0 ? ["降频", 0.46] : ["待机", 0.32];
    elements.interest.textContent = flowLabels[0];
    elements.interestWrap.setAttribute("aria-label", `能量状态：${flowLabels[0]}`);
    elements.interestWrap.dataset.signal = interestSignal.band;
    elements.interestWrap.classList.toggle("is-low", false);
    elements.interestRing.style.strokeDashoffset = String(113.1 * (1 - flowLabels[1]));
    elements.shots.textContent = String(runState.shots);
    elements.streak.textContent = String(runState.potStreak);
    elements.trackProgress.style.width = `${runState.pottedNumbers.length / 15 * 100}%`;
    trackNodeMap.forEach((node, pocketId) => {
      const zone = dateMapState.zones.get(pocketId);
      node.classList.toggle("is-complete", Boolean(zone?.visits));
      node.classList.toggle("is-current", pocketId === dateMapState.lastPocketId);
      node.classList.toggle("is-danger", false);
    });
    if (!runState.breakCompleted) {
      elements.selectedBall.textContent = "—";
      elements.selectedName.textContent = "色谱尚未激活";
      elements.callLabel.textContent = "开球";
      elements.callTitle.textContent = "第一杆将点燃整张球台";
      elements.callHint.textContent = "向后拖动，松手或第二指轻触出杆";
    } else {
      selectedBallNumber = null;
      elements.selectedBall.textContent = progress?.target === "eight" ? "8" : String(Math.max(0, 15 - runState.pottedNumbers.length));
      elements.selectedName.textContent = progress?.target === "eight" ? "最终核心 · 黑 8" : `${litScenes} / 6 种袋口已触发`;
      elements.callLabel.textContent = dateMapState.activeStreak > 0 ? `能量连锁 · ${dateMapState.activeStreak}` : "色谱运行中";
      elements.callTitle.textContent = progress?.target === "eight"
        ? "日蚀核心正在等待最终一击"
        : activeEffect ? `${activeTheme.label}正在以${activeEffect.label}运行` : "下一次落袋将定义视觉法则";
      elements.callHint.textContent = dateMapState.activeStreak >= 3
        ? "保持连进，轨迹、边条与环境光会持续升档"
        : activeEffect ? "下一颗球会换色，下一处袋口会换特效" : "六个袋口各自携带不同运动效果";
    }
    syncSurfaceMaterialUI();
    elements.aimToggle.setAttribute("aria-pressed", String(aimAssist));
    elements.aimToggle.setAttribute("aria-label", aimAssist ? "关闭瞄准辅助" : "开启瞄准辅助");
    elements.sound.setAttribute("aria-pressed", String(audio.enabled));
    elements.sound.setAttribute("aria-label", audio.enabled ? "关闭声音" : "开启声音");
    audio.setStage(stageNumber);
    if (lastScene) focusBackdropScene(lastScene, lastRoute);
    syncTableStory();
  }

  function nearestObjectBall(point, radius = 36) {
    let nearest = null;
    let nearestDistance = radius;
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (!data || data.number === 0 || data.potted) return;
      const candidate = distance(point, ball.position);
      if (candidate <= nearestDistance) {
        nearest = ball;
        nearestDistance = candidate;
      }
    });
    return nearest;
  }

  function clientPointToWorld(clientX, clientY, rect = canvas.getBoundingClientRect()) {
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const displayX = clamp((clientX - rect.left) / width, 0, 1);
    const displayY = clamp((clientY - rect.top) / height, 0, 1);
    return {
      x: displayX * WORLD.width,
      y: displayY * WORLD.height
    };
  }

  function pointerToWorld(event) {
    return clientPointToWorld(event.clientX, event.clientY);
  }

  function canInteract() {
    return !shotState && !pointerAim && !resolvingShot
      && !cinematicActive && !cinematicQueue.length
      && !resultVisible && !runState.endState.ended && cueBall;
  }

  function selectTarget(number) {
    if (!runState.breakCompleted || runState.pottedNumbers.includes(number)) return;
    const target = ballByNumber(number);
    if (target && cueBall) aimDirection = normalize({ x: target.position.x - cueBall.position.x, y: target.position.y - cueBall.position.y });
    hideCoach();
  }

  function hideCoach() {
    if (coachSeen) return;
    coachSeen = true;
    elements.coach.classList.add("is-gone");
    writeStorage(COACH_KEY, true);
  }

  function beginAim(event, point) {
    if (!cueBall) return;
    pointerAim = {
      id: event.pointerId,
      pointerType: event.pointerType || "touch",
      start: { ...point },
      current: point,
      direction: { ...aimDirection },
      pullRatio: 0,
      power: 0
    };
    canvas.setPointerCapture?.(event.pointerId);
    canvas.setAttribute("aria-label", "正在调整击球力度：轻推");
    elements.call.classList.add("is-quiet");
    hideCoach();
  }

  function updateAim(point) {
    if (!pointerAim || !cueBall) return;
    pointerAim.current = point;
    const pull = {
      x: pointerAim.start.x - point.x,
      y: pointerAim.start.y - point.y
    };
    const pullDistance = Math.hypot(pull.x, pull.y);
    if (pullDistance > 5) {
      pointerAim.direction = normalize(pull, pointerAim.direction);
    }
    pointerAim.pullRatio = clamp((pullDistance - MIN_PULL) / (MAX_PULL - MIN_PULL), 0, 1);
    pointerAim.power = powerFromPullRatio(pointerAim.pullRatio);
    aimDirection = { ...pointerAim.direction };
    aimPower = pointerAim.power;
    const powerLabel = pointerAim.pullRatio < LIGHT_PULL_END
      ? "轻推"
      : pointerAim.pullRatio < STRONG_PULL_START ? "适中" : pointerAim.pullRatio < 0.96 ? "强力" : "满力";
    canvas.setAttribute("aria-label", `正在调整击球力度：${powerLabel}`);
  }

  function cancelAim() {
    pointerAim = null;
    aimPower = 0;
    canvas.setAttribute("aria-label", "在桌面任意位置反向滑动瞄准蓄力，松手或第二指轻触击球");
    elements.call.classList.remove("is-quiet");
  }

  function releaseAim(event, shouldShoot) {
    if (!pointerAim || event.pointerId !== pointerAim.id) return;
    const power = pointerAim.power;
    const direction = { ...pointerAim.direction };
    canvas.releasePointerCapture?.(event.pointerId);
    cancelAim();
    if (shouldShoot && power > 0.015) shoot(direction, power);
  }

  function strikeWithSecondPointer(event) {
    if (!pointerAim || event.pointerId === pointerAim.id) return false;
    const firstPointerId = pointerAim.id;
    const power = pointerAim.power;
    const direction = { ...pointerAim.direction };
    canvas.releasePointerCapture?.(firstPointerId);
    cancelAim();
    if (power > 0.015) shoot(direction, power);
    return true;
  }

  function shoot(direction, power) {
    if (!canInteract()) return false;
    aimDirection = { ...direction };
    const speed = MIN_SHOT_SPEED + clamp(power, 0, 1) * (MAX_SHOT_SPEED - MIN_SHOT_SPEED);
    resetShotRailHits();
    shotState = {
      declaredBall: null,
      firstContact: null,
      pottedNumbers: [],
      cueScratch: false,
      breakShot: !runState.breakCompleted,
      bankedNumbers: [],
      pottedDetails: [],
      objectContactPairs: new Set(),
      objectContacts: 0,
      closestPocketDistance: Infinity,
      launchPower: clamp(power, 0, 1),
      launchSpeed: speed,
      launchDirection: { ...direction },
      storyFocusNumber: null,
      storyShown: false,
      dateRouteIds: [],
      startedAt: simulationTime
    };
    Body.strike(cueBall, { x: direction.x * speed, y: direction.y * speed });
    stableSteps = 0;
    root.dataset.state = "rolling";
    elements.call.classList.add("is-quiet");
    audio.cue("strike", 0.75 + power * 0.5);
    screenShake = Math.max(screenShake, power * 2.2);
    return true;
  }

  function pocketDepth(pocket, point) {
    return (point.x - pocket.mouthX) * pocket.inwardX + (point.y - pocket.mouthY) * pocket.inwardY;
  }

  function pocketLateral(pocket, point) {
    const tangentX = -pocket.inwardY;
    const tangentY = pocket.inwardX;
    return (point.x - pocket.mouthX) * tangentX + (point.y - pocket.mouthY) * tangentY;
  }

  function crossedPocketLine(body, pocket, lineDepth, halfWidth, depthTolerance = 0, lateralTolerance = 0) {
    const data = bodyData(body);
    const previous = data?.previousPosition;
    if (!previous) return null;
    const previousDepth = pocketDepth(pocket, previous) - lineDepth;
    const currentDepth = pocketDepth(pocket, body.position) - lineDepth;
    if (previousDepth > depthTolerance
        || currentDepth < -depthTolerance
        || currentDepth - previousDepth < 1e-7) return null;
    const crossingProgress = clamp(-previousDepth / (currentDepth - previousDepth), 0, 1);
    const crossingX = previous.x + (body.position.x - previous.x) * crossingProgress;
    const crossingY = previous.y + (body.position.y - previous.y) * crossingProgress;
    const lateral = pocketLateral(pocket, { x: crossingX, y: crossingY });
    return Math.abs(lateral) <= halfWidth + lateralTolerance
      ? { x: crossingX, y: crossingY, lateral }
      : null;
  }

  function inwardPocketSpeed(body, pocket) {
    return body.velocity.x * pocket.inwardX + body.velocity.y * pocket.inwardY;
  }

  function enterPocketMouth(body, pocket) {
    const data = bodyData(body);
    if (!data || inwardPocketSpeed(body, pocket) <= POCKET_MIN_INWARD_SPEED) return false;
    const mouthCrossing = crossedPocketLine(
      body,
      pocket,
      0,
      pocket.mouth / 2,
      POCKET_MOUTH_DEPTH_TOLERANCE,
      POCKET_MOUTH_LATERAL_TOLERANCE
    );
    if (!mouthCrossing) return false;
    data.pocketMouthEntries += 1;
    const captureCrossing = crossedPocketLine(
      body,
      pocket,
      pocket.captureDepth,
      pocket.captureHalfWidth,
      POCKET_SHELF_DEPTH_TOLERANCE,
      POCKET_SHELF_LATERAL_TOLERANCE
    );
    data.pocketApproach = {
      pocketId: pocket.id,
      enteredAt: simulationTime,
      mouthCrossX: mouthCrossing.x,
      mouthCrossY: mouthCrossing.y,
      captureCrossed: Boolean(captureCrossing),
      captureCrossX: captureCrossing?.x ?? null,
      captureCrossY: captureCrossing?.y ?? null,
      maximumDepth: pocketDepth(pocket, body.position)
    };
    return true;
  }

  function advancePocketApproach(body, pocket) {
    const data = bodyData(body);
    const approach = data?.pocketApproach;
    if (!approach || approach.pocketId !== pocket.id) return false;
    const currentDepth = pocketDepth(pocket, body.position);
    const currentLateral = Math.abs(pocketLateral(pocket, body.position));
    approach.maximumDepth = Math.max(approach.maximumDepth ?? currentDepth, currentDepth);
    if (currentDepth < -POCKET_APPROACH_EXIT_DEPTH || currentLateral > pocket.mouth / 2 + BALL_RADIUS) {
      data.pocketApproach = null;
      return false;
    }
    if (!approach.captureCrossed) {
      const captureCrossing = crossedPocketLine(
        body,
        pocket,
        pocket.captureDepth,
        pocket.captureHalfWidth,
        POCKET_SHELF_DEPTH_TOLERANCE,
        POCKET_SHELF_LATERAL_TOLERANCE
      );
      if (captureCrossing) {
        approach.captureCrossed = true;
        approach.captureCrossX = captureCrossing.x;
        approach.captureCrossY = captureCrossing.y;
      }
      const settledOverLip = body.speed <= NATURAL_STOP_SPEED
        && approach.maximumDepth >= pocket.captureDepth * POCKET_LIP_SETTLE_RATIO
        && currentLateral <= pocket.captureHalfWidth + POCKET_SHELF_LATERAL_TOLERANCE;
      if (settledOverLip) {
        approach.captureCrossed = true;
        approach.settledOverLip = true;
        approach.captureCrossX = body.position.x;
        approach.captureCrossY = body.position.y;
      }
    }
    const requiredDepth = approach.settledOverLip
      ? pocket.captureDepth * POCKET_LIP_SETTLE_RATIO
      : pocket.captureDepth - POCKET_SHELF_DEPTH_TOLERANCE;
    return approach.captureCrossed
      && approach.enteredAt < simulationTime
      && approach.maximumDepth >= requiredDepth;
  }

  function pocketBall(body, pocket) {
    const data = bodyData(body);
    if (!shotState || !data || data.potted || data.pocketing) return false;
    const speed = body.speed;
    const durationRange = POCKET_MAX_DURATION - POCKET_MIN_DURATION + 1;
    const duration = POCKET_MIN_DURATION + ((data.number * 47 + Math.round(speed * 17)) % durationRange);
    data.pocketing = {
      pocketId: pocket.id,
      targetX: pocket.x,
      targetY: pocket.y,
      startX: body.position.x,
      startY: body.position.y,
      startAngle: data.rollAngle,
      startSpeed: speed,
      elapsed: 0,
      duration,
      scale: 1,
      depth: 0,
      rotation: data.rollAngle
    };
    data.pocketApproach = null;
    body.isSensor = true;
    body.collisionFilter.mask = 0;
    Body.setVelocity(body, { x: 0, y: 0 });
    Body.setAngularVelocity(body, 0);
    data.lastPosition = { x: body.position.x, y: body.position.y };
    if (data.number > 0) {
      const path = data.shotTrail.slice(-48).map((point) => ({ ...point }));
      path.push({ x: pocket.captureX, y: pocket.captureY });
      const detail = {
        number: data.number,
        enteredOrder: shotState.pottedDetails.length,
        pocketId: pocket.id,
        pocketX: pocket.x,
        pocketY: pocket.y,
        entrySpeed: speed,
        railHits: data.shotRailHits,
        jawHits: data.shotJawHits,
        mouthEntries: data.pocketMouthEntries,
        travel: data.shotTravel,
        path
      };
      shotState.pottedDetails.push(detail);
      const pocketAnalysis = content.analyzeShot({
        pottedNumbers: [data.number],
        pottedDetails: [detail],
        bankedNumbers: data.shotRailHits > 0 ? [data.number] : [],
        launchPower: shotState.launchPower,
        objectContacts: shotState.objectContacts
      });
      const dateRoute = rememberDateMoment(data.number, detail, { archetype: pocketAnalysis.id });
      if (dateRoute) shotState.dateRouteIds.push(dateRoute.id);
      storyTrails.push({
        number: data.number,
        path,
        color: BALL_COLORS[data.number] || "#e6c88c",
        life: 1,
        railHits: data.shotRailHits
      });
      if (storyTrails.length > 4) storyTrails.shift();
      if (shotState.storyFocusNumber === null) {
        shotState.storyFocusNumber = data.number;
        beginPocketStoryFocus(pocket, dateRoute);
      }
    } else {
      const cuePath = data.shotTrail?.slice(-48).map((point) => ({ ...point })) || [];
      cuePath.push({ x: pocket.captureX, y: pocket.captureY });
      const cueRoute = rememberDateMoment(0, {
        pocketId: pocket.id,
        pocketX: pocket.x,
        pocketY: pocket.y,
        entrySpeed: speed,
        railHits: data.shotRailHits,
        jawHits: data.shotJawHits,
        travel: data.shotTravel,
        path: cuePath
      }, { archetype: "scratch" });
      beginPocketStoryFocus(pocket, cueRoute);
    }
    audio.cue(data.number === 0 ? "scratch" : "pocket", clamp(0.72 + speed / 30, 0.7, 1.15));
    screenFlash = Math.max(screenFlash, data.number === 8 ? 0.62 : data.number === 0 ? 0.24 : 0.14);
    return true;
  }

  function completePocketBall(body) {
    const data = bodyData(body);
    if (!data || data.potted || !data.pocketing) return;
    const pocketing = data.pocketing;
    const number = data.number;
    if (shotState) {
      if (number === 0) {
        shotState.cueScratch = true;
      } else if (!shotState.pottedNumbers.includes(number)) {
        shotState.pottedNumbers.push(number);
        if (data.shotRailHits > 0) shotState.bankedNumbers.push(number);
        beginCompletedPocketStory(number);
      }
    }
    const color = number === 0 ? "#f5f0e7" : BALL_COLORS[number];
    pocketBursts.push({ x: pocketing.targetX, y: pocketing.targetY, color, life: 1, number });
    spawnParticles(pocketing.targetX, pocketing.targetY, number === 0 ? "#e6eee9" : color, number === 0 ? 7 : 12);
    removeBall(body);
  }

  function updatePocketing() {
    balls.slice().forEach((ball) => {
      const data = bodyData(ball);
      const state = data?.pocketing;
      if (!state || data.potted) return;
      state.elapsed = Math.min(state.duration, state.elapsed + FIXED_STEP);
      const progress = clamp(state.elapsed / state.duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const dx = state.targetX - state.startX;
      const dy = state.targetY - state.startY;
      const pathLength = Math.max(1, Math.hypot(dx, dy));
      const curl = Math.sin(progress * Math.PI) * 7 * (data.number % 2 ? 1 : -1);
      Body.setPosition(ball, {
        x: state.startX + dx * eased - dy / pathLength * curl,
        y: state.startY + dy * eased + dx / pathLength * curl
      });
      state.scale = 1 - eased * 0.82;
      state.depth = eased;
      state.rotation = state.startAngle + eased * (Math.PI * 2.4 + state.startSpeed * 0.16);
      data.rollAngle = state.rotation;
      data.rollVelocity = (Math.PI * 2.4 + state.startSpeed * 0.16) / (state.duration / 1000);
      data.lastPosition = { x: ball.position.x, y: ball.position.y };
      if (progress >= 1) completePocketBall(ball);
    });
  }

  function updateRollingState() {
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (!data || data.potted || data.pocketing) return;
      const dx = ball.position.x - data.lastPosition.x;
      const dy = ball.position.y - data.lastPosition.y;
      const travel = Math.hypot(dx, dy);
      data.lastPosition = { x: ball.position.x, y: ball.position.y };
      if (shotState) {
        if (data.number > 0) data.shotTravel += travel;
        const lastTrailPoint = data.shotTrail[data.shotTrail.length - 1];
        if (!lastTrailPoint || Math.hypot(ball.position.x - lastTrailPoint.x, ball.position.y - lastTrailPoint.y) >= 8) {
          data.shotTrail.push({ x: ball.position.x, y: ball.position.y });
          if (data.shotTrail.length > 64) data.shotTrail.shift();
        }
        if (data.number > 0) {
          const pocketDistance = POCKETS.reduce((minimum, pocket) => Math.min(
            minimum,
            Math.hypot(ball.position.x - pocket.mouthX, ball.position.y - pocket.mouthY)
          ), Infinity);
          shotState.closestPocketDistance = Math.min(shotState.closestPocketDistance, pocketDistance);
        }
      }
      if (travel > 0.55 && ball.speed > 0.16) {
        const lastSampleAt = data.lastChromaTrailAt ?? -Infinity;
        if (simulationTime - lastSampleAt >= WATER_STEP_MS) {
          const theme = BALL_CHROMA_THEMES[data.number] || BALL_CHROMA_THEMES[0];
          depositRollingWaterWake(ball, data, dx, dy, travel);
          dateMapState.rollingTrails.push({
            x1: ball.position.x - dx,
            y1: ball.position.y - dy,
            x2: ball.position.x,
            y2: ball.position.y,
            speed: ball.speed,
            ballNumber: data.number,
            effectId: dateMapState.activeEffect?.id || "ripple",
            color: theme.primary,
            secondary: dateMapState.activeEffect?.secondary || theme.secondary,
            kind: "water-wake",
            bornAt: performance.now(),
            life: 1
          });
          data.lastChromaTrailAt = simulationTime;
          if (dateMapState.rollingTrails.length > 96) {
            dateMapState.rollingTrails.splice(0, dateMapState.rollingTrails.length - 96);
          }
          dateMapFrameDirty = true;
        }
      }
      if (ball.physics) {
        data.rollAngle = ball.physics.rollAngle;
        data.rollVelocity = ball.physics.rollSpeed;
        data.rollHeading = ball.physics.rollHeading;
        return;
      }
      if (travel > 0.0001) {
        const sign = Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : Math.sign(dy);
        const angleDelta = travel / BALL_RADIUS * (sign || 1);
        data.rollAngle += angleDelta;
        data.rollVelocity = angleDelta / (FIXED_STEP / 1000);
        data.rollHeading = Math.atan2(dy, dx);
      } else {
        data.rollVelocity *= 0.78;
        if (Math.abs(data.rollVelocity) < 0.002) data.rollVelocity = 0;
      }
    });
  }

  function captureBallPositions() {
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (!data || data.potted || data.pocketing) return;
      data.previousPosition = { x: ball.position.x, y: ball.position.y };
      data.preStepVelocity = { x: ball.velocity.x, y: ball.velocity.y };
    });
  }

  function updatePockets() {
    if (!shotState) return;
    balls.slice().forEach((ball) => {
      const data = bodyData(ball);
      if (!data || data.potted || data.pocketing) return;
      const activePocket = data.pocketApproach
        ? POCKETS.find((pocket) => pocket.id === data.pocketApproach.pocketId)
        : null;
      if (activePocket) {
        if (advancePocketApproach(ball, activePocket)) pocketBall(ball, activePocket);
        if (data.pocketApproach || data.pocketing) return;
      }
      for (const pocket of POCKETS) {
        if (enterPocketMouth(ball, pocket)) break;
      }
    });
  }

  function containLooseBalls() {
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (!data || data.potted || data.pocketing) return;
      const position = ball.position;
      const finite = Number.isFinite(position.x) && Number.isFinite(position.y)
        && Number.isFinite(ball.velocity.x) && Number.isFinite(ball.velocity.y);
      const escaped = !finite
        || position.x < TABLE_OUTER.left - BALL_RADIUS
        || position.x > TABLE_OUTER.right + BALL_RADIUS
        || position.y < TABLE_OUTER.top - BALL_RADIUS
        || position.y > TABLE_OUTER.bottom + BALL_RADIUS;
      if (escaped) {
        const safe = data.lastSafePosition || CUE_SPOT;
        Body.setPosition(ball, safe);
        Body.setVelocity(ball, finite
          ? { x: -ball.velocity.x * 0.32, y: -ball.velocity.y * 0.32 }
          : { x: 0, y: 0 });
        data.previousPosition = { ...safe };
        data.lastPosition = { ...safe };
        data.pocketApproach = null;
        data.outsideSteps = 0;
        return;
      }
      if (data.pocketApproach) {
        data.outsideSteps = ball.speed < NATURAL_STOP_SPEED ? data.outsideSteps + 1 : 0;
        if (data.outsideSteps > 45) {
          const safe = data.lastSafePosition || CUE_SPOT;
          Body.setPosition(ball, safe);
          Body.setVelocity(ball, { x: 0, y: 0 });
          data.previousPosition = { ...safe };
          data.lastPosition = { ...safe };
          data.pocketApproach = null;
          data.outsideSteps = 0;
        }
        return;
      }
      const safelyOnCloth = position.x >= TABLE.left + BALL_RADIUS
        && position.x <= TABLE.right - BALL_RADIUS
        && position.y >= TABLE.top + BALL_RADIUS
        && position.y <= TABLE.bottom - BALL_RADIUS;
      if (safelyOnCloth) {
        data.lastSafePosition = { x: position.x, y: position.y };
        data.outsideSteps = 0;
        return;
      }
      const beyondCushionNose = position.x < TABLE.left - BALL_RADIUS * 0.25
        || position.x > TABLE.right + BALL_RADIUS * 0.25
        || position.y < TABLE.top - BALL_RADIUS * 0.25
        || position.y > TABLE.bottom + BALL_RADIUS * 0.25;
      data.outsideSteps = beyondCushionNose && ball.speed < NATURAL_STOP_SPEED
        ? data.outsideSteps + 1
        : 0;
      if (data.outsideSteps > 45) {
        const safe = data.lastSafePosition || CUE_SPOT;
        Body.setPosition(ball, safe);
        Body.setVelocity(ball, { x: 0, y: 0 });
        data.previousPosition = { ...safe };
        data.lastPosition = { ...safe };
        data.pocketApproach = null;
        data.outsideSteps = 0;
      }
    });
  }

  function settleBalls() {
    let moving = false;
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (data?.pocketing) {
        moving = true;
        return;
      }
      if (ball.speed < STOP_SPEED) {
        Body.setVelocity(ball, { x: 0, y: 0 });
        Body.setAngularVelocity(ball, 0);
        if (data) data.rollVelocity *= 0.7;
      } else {
        moving = true;
        if (ball.speed > MAX_SHOT_SPEED * 1.3) {
          const scale = MAX_SHOT_SPEED * 1.3 / ball.speed;
          Body.setVelocity(ball, { x: ball.velocity.x * scale, y: ball.velocity.y * scale });
        }
      }
    });
    if (shotState) stableSteps = moving ? 0 : stableSteps + 1;
    if (shotState && stableSteps >= 22 && !resolvingShot) finalizeShot();
  }

  function showJudgement(copy) {
    clearTimeout(judgementTimer);
    elements.judgement.textContent = copy;
    elements.judgement.classList.remove("is-visible");
    void elements.judgement.offsetWidth;
    elements.judgement.classList.add("is-visible");
    judgementTimer = setTimeout(() => elements.judgement.classList.remove("is-visible"), 1250);
  }

  function storyNumberForUpcomingPot(number) {
    if (number === 8) return 8;
    const ordinaryPots = runState.pottedNumbers.filter((potted) => potted !== 8).length;
    return clamp(ordinaryPots + 1, 1, 15);
  }

  function analyzeCompletedShot(completedShot, outcome = null) {
    const pottedNumbers = outcome?.pottedNumbers || completedShot?.pottedNumbers || [];
    const cueScratch = outcome?.cueScratch ?? completedShot?.cueScratch ?? false;
    return content.analyzeShot({
      pottedNumbers,
      pottedDetails: completedShot?.pottedDetails || [],
      bankedNumbers: outcome?.shot?.bankedNumbers || completedShot?.bankedNumbers || [],
      cueScratch,
      launchPower: completedShot?.launchPower,
      objectContacts: completedShot?.objectContacts,
      nearMiss: pottedNumbers.length === 0
        && Number.isFinite(completedShot?.closestPocketDistance)
        && completedShot.closestPocketDistance <= POCKET_RADIUS + BALL_RADIUS * 1.15
    });
  }

  function createShotStory(completedShot, outcome = null, preferredNumber = null) {
    const pottedEvents = outcome?.pocketEvents || [];
    const physicalNumbers = outcome?.pottedNumbers || completedShot?.pottedNumbers || [];
    const physicalNumber = preferredNumber
      ?? pottedEvents.find((event) => event.number !== 8)?.number
      ?? physicalNumbers.find((number) => number !== 8)
      ?? null;
    if (physicalNumber === null || physicalNumber === 8) return null;
    const matchingEvent = pottedEvents.find((event) => event.number === physicalNumber);
    const storyNumber = matchingEvent?.storyNumber ?? physicalNumber;
    const stageNumber = matchingEvent?.stageIndex !== undefined
      ? matchingEvent.stageIndex + 1
      : currentStageNumber();
    const physicalDetail = completedShot?.pottedDetails?.find((detail) => detail.number === physicalNumber) || null;
    const performance = content.selectPerformance({
      ballNumber: storyNumber,
      intent: content.INTENTS.ACTIVE,
      timing: content.TIMINGS.RIGHT,
      seed: (runState.shots + 1) * 31 + physicalNumber * 7 + Math.round((completedShot?.launchPower || 0.5) * 100)
    });
    const analysis = analyzeCompletedShot(completedShot, outcome);
    const route = physicalDetail?.dateRouteId
      ? dateMapState.routes.find((item) => item.id === physicalDetail.dateRouteId)
      : null;
    if (route) route.archetype = analysis.id;
    return content.selectShotStory({
      stage: stageNumber,
      storyNumber,
      ballNumber: physicalNumber,
      pocketId: physicalDetail?.pocketId,
      archetype: analysis.id,
      analysis,
      performance,
      seed: (runState.shots + 1) * 31 + physicalNumber * 7
    });
  }

  function updateVisibleTableMoment(story) {
    if (!tableMomentActive || !story) return;
    tableMomentCurrent = story;
    elements.tableMoment.dataset.archetype = story.archetype;
    elements.tableMoment.dataset.motion = story.visualMode || story.archetype || "straight";
    elements.tableMoment.dataset.scene = story.sceneId || story.stageId || "date-map";
    elements.tableMomentScene.textContent = story.sceneName || story.scene || story.technique;
    elements.tableMomentTitle.textContent = story.title;
    elements.tableMomentLine.textContent = story.line;
  }

  function beginCompletedPocketStory(number) {
    if (!shotState || shotState.storyShown || number === 8 || shotState.storyFocusNumber !== number) return;
    const story = createShotStory(shotState, null, number);
    if (!story) return;
    shotState.storyShown = true;
    shotState.story = story;
    showTableMoment(story);
  }

  function queueMicro(item) {
    microQueue.push(item);
    if (elements.micro.hidden) showNextMicro();
  }

  function showNextMicro() {
    if (!microQueue.length) {
      elements.micro.hidden = true;
      if (cinematicQueue.length && !cinematicActive) showNextCinematic();
      else if (runState.endState.ended && !cinematicActive && !resultVisible && !finalRevealActive) showResult();
      return;
    }
    const item = microQueue.shift();
    clearTimeout(microTimer);
    markViewed(item.id);
    elements.micro.dataset.type = item.type || "pocket";
    elements.microKicker.textContent = item.kicker;
    elements.microTitle.textContent = item.title;
    elements.microLine.textContent = item.line;
    elements.micro.hidden = false;
    void elements.micro.offsetWidth;
    audio.cue(item.sound || "event", item.intensity || 1);
    microTimer = setTimeout(() => {
      elements.micro.hidden = true;
      setTimeout(showNextMicro, 70);
    }, clamp(item.durationMs + 900, 2200, 2900));
  }

  function queueStageMicro(stageNumber, eventType, seed, trend) {
    const performance = content.selectStageEvent({ stage: stageNumber, eventType, seed });
    queueMicro({
      id: performance.id,
      type: eventType,
      kicker: performance.kicker,
      title: performance.title,
      line: `${performance.visual} ${performance.line}${trend ? ` ${trend.line}` : ""}`,
      durationMs: performance.durationMs,
      sound: eventType === content.STAGE_EVENT_TYPES.SCRATCH
        ? "warning"
        : eventType === content.STAGE_EVENT_TYPES.MISS ? "miss" : "event",
      intensity: eventType === content.STAGE_EVENT_TYPES.SCRATCH ? 0.9 : 0.72
    });
  }

  function queueCinematic(item) {
    cinematicQueue.push(item);
    if (!cinematicActive && elements.micro.hidden && !microQueue.length) showNextCinematic();
  }

  function showNextCinematic() {
    if (!elements.micro.hidden || microQueue.length) return;
    if (!cinematicQueue.length) {
      cinematicActive = false;
      cinematicCurrent = null;
      elements.cinematic.hidden = true;
      if (runState.endState.ended && !resultVisible && !finalRevealActive) showResult();
      return;
    }
    cinematicCurrent = cinematicQueue.shift();
    cinematicActive = true;
    root.dataset.state = "cinematic";
    markViewed(cinematicCurrent.id);
    elements.cinematic.dataset.kind = cinematicCurrent.kind || "stage";
    elements.cinematic.dataset.scene = cinematicCurrent.stageId || "ending";
    elements.cinematic.style.setProperty("--hb-cinematic-origin-x", `${lastStoryOrigin.x}%`);
    elements.cinematic.style.setProperty("--hb-cinematic-origin-y", `${lastStoryOrigin.y}%`);
    elements.cinematicImage.style.backgroundImage = cinematicCurrent.image
      ? `url("${cinematicCurrent.image}")`
      : "";
    elements.cinematicKicker.textContent = cinematicCurrent.kicker;
    elements.cinematicTitle.textContent = cinematicCurrent.title;
    elements.cinematicLine.textContent = cinematicCurrent.line;
    elements.cinematicAction.hidden = !cinematicCurrent.actionLabel;
    elements.cinematicAction.textContent = cinematicCurrent.actionLabel || "继续";
    elements.cinematic.hidden = false;
    audio.cue(cinematicCurrent.sound || "stage");
    clearTimeout(cinematicTimer);
    if (cinematicCurrent.autoCloseMs) {
      cinematicTimer = setTimeout(closeCinematic, cinematicCurrent.autoCloseMs);
    }
  }

  function closeCinematic() {
    if (!cinematicActive) return;
    clearTimeout(cinematicTimer);
    const completed = cinematicCurrent;
    elements.cinematic.hidden = true;
    cinematicActive = false;
    cinematicCurrent = null;
    completed?.onClose?.();
    if (cinematicQueue.length) setTimeout(showNextCinematic, 70);
    else if (runState.endState.ended && elements.micro.hidden && !microQueue.length && !resultVisible && !finalRevealActive) showResult();
    else root.dataset.state = "aiming";
  }

  function scheduleResultAfterTable(delayMs) {
    finalRevealActive = true;
    clearTimeout(finalRevealTimer);
    finalRevealTimer = setTimeout(() => {
      finalRevealActive = false;
      hideTableMoment();
      if (!resultVisible) showResult();
    }, delayMs);
  }

  function beginFinalDateMapReveal(outcome) {
    const early = Boolean(outcome.earlyEight);
    const success = outcome.state.endState.status === "completed";
    dateMapState.completed = success;
    dateMapState.ending = success ? "eclipse-clear" : "eclipse-break";
    dateMapState.finalProgress = 0.001;
    dateMapState.stagePulse = 1;
    const eightRoute = [...dateMapState.routes].reverse().find((route) => route.number === 8);
    const eightPocket = POCKETS.find((pocket) => pocket.id === eightRoute?.pocketId)
      || POCKETS.find((pocket) => pocket.id === dateMapState.lastPocketId)
      || POCKETS[0];
    dateMapState.blackEightBlast = {
      startedAt: performance.now(),
      ageMs: 0,
      duration: success ? 4400 : 3200,
      pocketId: eightPocket.id,
      originX: eightPocket.x,
      originY: eightPocket.y,
      life: 1,
      success
    };
    dateMapFrameDirty = true;
    sceneLightingFrameDirty = true;
    setDateFlow(success ? Math.max(5, outcome.state.bestPotStreak) : 0, !success);
    root.dataset.state = "map-finale";
    screenFlash = Math.max(screenFlash, success ? 0.78 : 0.5);
    screenShake = Math.max(screenShake, success ? 7.2 : 4.2);
    showTableMoment({
      id: `eclipse-${success ? "complete" : "interrupted"}-${outcome.state.shots}`,
      archetype: success ? "multi" : "near",
      motion: success ? "eclipse-supernova" : "eclipse-fracture",
      sceneId: "eclipse",
      sceneName: "黑 8 · 日蚀核心",
      title: success
        ? early ? "极限抢攻，日蚀提前引爆" : "黑曜日蚀，全场超载"
        : "核心失稳，能量链断裂",
      line: success
        ? "六种袋口效应同时点火，整张球台进入最终色谱。"
        : "黑 8 的冲击仍然炸开了全场，但本局能量未能闭环。",
      durationMs: success ? 2100 : 1700
    });
    audio.cue(success ? "proposal" : "warning", success ? 1 : 0.82);
    scheduleResultAfterTable(success ? 5000 : 3500);
  }

  function processOutcomePerformances(outcome, completedShot = {}) {
    const stageTransitions = outcome.newlyCompletedStageIds || outcome.completedStageIds || [];
    const presentPocketMoments = () => {
      outcome.pocketEvents?.forEach((event) => {
        const color = BALL_COLORS[event.number] || "#e4c178";
        const burst = [...pocketBursts].reverse().find((item) => item.number === event.number);
        spawnParticles(burst?.x || WORLD.width / 2, burst?.y || WORLD.height / 2, color, 18);
        const detail = completedShot.pottedDetails?.find((item) => item.number === event.number) || {};
        const route = rememberDateMoment(event.number, detail);
        if (route) route.storyNumber = event.storyNumber;
      });
      const story = createShotStory(completedShot, outcome);
      if (!story) return;
      if (completedShot.storyShown) updateVisibleTableMoment(story);
      else {
        completedShot.storyShown = true;
        completedShot.story = story;
        showTableMoment(story);
      }
    };
    const analysis = analyzeCompletedShot(completedShot, outcome);
    applyShotStyle(analysis);
    recordCueStop(completedShot, outcome);

    if (outcome.earlyEight) {
      presentPocketMoments();
      beginFinalDateMapReveal(outcome);
      return;
    }

    presentPocketMoments();
    if (outcome.miss && !outcome.shot.breakShot) {
      setDateFlow(0, true);
      dateMapState.flow = 0;
    } else if (outcome.cueScratch) {
      setDateFlow(0, true);
      dateMapState.flow = 0.16;
      dateMapState.stagePulse = 0.26;
    } else {
      setDateFlow(outcome.state.potStreak, false);
    }

    if (stageTransitions.length) {
      dateMapState.stagePulse = 1;
      DATE_SCENES.forEach((scene, index) => {
        const zone = dateMapState.zones.get(scene.pocketId);
        if (zone && index < Math.ceil(outcome.state.pottedNumbers.length / 3)) {
          zone.reveal = Math.max(zone.reveal, 0.18);
        }
      });
      audio.cue("stage", 0.58);
    }

    if (outcome.state.endState.ended) {
      beginFinalDateMapReveal(outcome);
      return;
    }
    syncTableStory();
  }

  function orderedPottedNumbers(completedShot) {
    const completed = [...(completedShot?.pottedNumbers || [])];
    const entryOrder = [...(completedShot?.pottedDetails || [])]
      .filter((detail) => completed.includes(detail.number))
      .sort((left, right) => (left.enteredOrder ?? Number.MAX_SAFE_INTEGER) - (right.enteredOrder ?? Number.MAX_SAFE_INTEGER))
      .map((detail) => detail.number);
    return [...entryOrder, ...completed.filter((number) => !entryOrder.includes(number))];
  }

  function finalizeShot() {
    if (!shotState || resolvingShot) return;
    resolvingShot = true;
    const completedShot = shotState;
    completedShot.cueEnd = cueBall && !completedShot.cueScratch
      ? { x: cueBall.position.x, y: cueBall.position.y }
      : null;
    shotState = null;
    stableSteps = 0;
    let outcome;
    try {
      outcome = rules.evaluateShot(runState, {
        pottedNumbers: orderedPottedNumbers(completedShot),
        cueScratch: completedShot.cueScratch,
        breakShot: completedShot.breakShot,
        bankedNumbers: [...new Set(completedShot.bankedNumbers)]
      });
    } catch (error) {
      console.error(error);
      resolvingShot = false;
      showJudgement("这一杆需要重新摆好");
      if (!cueBall) respotBall(0);
      root.dataset.state = "aiming";
      return;
    }
    runState = outcome.state;
    outcome.respotNumbers.forEach(respotBall);
    if (!cueBall && !runState.endState.ended) respotBall(0);
    selectedBallNumber = null;
    elements.call.classList.remove("is-quiet");
    resolvingShot = false;
    processOutcomePerformances(outcome, completedShot);
    syncUI();
    root.dataset.state = runState.endState.ended ? "map-finale" : "aiming";
    if (runState.endState.ended && !cinematicQueue.length && !cinematicActive && !finalRevealActive && elements.micro.hidden) showResult();
  }

  function showResult() {
    resultVisible = true;
    root.dataset.state = "result";
    const rating = rules.computeRating(runState);
    const grade = rating.grade || "B";
    let title;
    let line;
    let kicker;
    if (runState.endState.status === "completed") {
      if (runState.endState.ending === rules.EARLY_SUCCESS_ENDING) {
        kicker = `${grade} · 极限抢攻`;
        title = "黑 8 提前引爆，色谱仍然完成闭环";
        line = "此前积累的高能连锁撑住了这次冒险，六种袋口效应同时点火。";
      } else {
        const ending = content.getEnding(grade);
        kicker = `${grade} · ${ending.title}`;
        title = ending.line;
        line = ending.epilogue;
      }
    } else {
      const failure = {
        "confession-too-early": ["核心抢跑", "黑 8 提前切断了能量链", "重启后先完成更多色谱，再挑战最终核心。"],
        "commitment-too-heavy": ["负载过高", "核心在闭环前进入过载", "这一局停在这里，下一次可以更稳地完成清台。"],
        "losing-contact": ["能量耗尽", "连续失误让色谱停止运转", "重新开球即可再次激活六种袋口效果。"],
        "reckless-rejection": ["日蚀失控", "黑 8 在能量不足时提前落袋", "冲击已经炸开全场，但这次未能形成最终闭环。"]
      }[runState.endState.ending] || ["本局中止", "色谱停在当前状态", "重新开球，整张桌面会再次被点亮。"];
      [kicker, title, line] = failure;
    }
    elements.resultGrade.textContent = kicker;
    elements.resultTitle.textContent = title;
    elements.resultLine.textContent = line;
    elements.resultShots.textContent = String(rating.technical.shots);
    elements.resultAccuracy.textContent = `${rating.technical.successfulShotRate}%`;
    elements.resultStreak.textContent = String(rating.technical.bestStreak);
    const energyLabels = {
      lost: "能量耗尽",
      danger: "能量告急",
      uncertain: "输出波动",
      devoted: "峰值超载",
      warm: "高频共振",
      steady: "稳定运行"
    };
    elements.resultInterest.textContent = energyLabels[rules.interestStatus(runState).band] || "稳定运行";
    elements.result.hidden = false;
    saveRecord(rating);
  }

  function saveRecord(rating) {
    const previous = readStorage(RECORD_KEY, {});
    const grades = { S: 3, A: 2, B: 1 };
    const nextGrade = rating.grade && (!previous.bestGrade || grades[rating.grade] > grades[previous.bestGrade])
      ? rating.grade
      : previous.bestGrade || null;
    const next = {
      bestGrade: nextGrade,
      minShots: runState.endState.status === "completed"
        ? Math.min(previous.minShots || Infinity, runState.shots)
        : previous.minShots || null,
      endings: [...new Set([...(previous.endings || []), runState.endState.ending].filter(Boolean))]
    };
    writeStorage(RECORD_KEY, next);
  }

  function spawnParticles(x, y, color, count) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.PI * 2 * index / count + (index % 3) * 0.12;
      const speed = 0.8 + (index % 5) * 0.42;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: 1.2 + index % 3,
        color
      });
    }
  }

  function updateEffects() {
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.985;
      particle.vy *= 0.985;
      particle.life -= 0.018;
    });
    particles = particles.filter((particle) => particle.life > 0);
    pocketBursts.forEach((burst) => { burst.life -= 0.024; });
    pocketBursts = pocketBursts.filter((burst) => burst.life > 0);
    storyTrails.forEach((trail) => { trail.life -= 0.012; });
    storyTrails = storyTrails.filter((trail) => trail.life > 0);
    dateMapState.zones.forEach((zone) => { zone.pulse *= 0.955; });
    dateMapState.routes.forEach((route) => { route.glow = Math.max(0.46, route.glow * 0.994); });
    dateMapState.stagePulse *= 0.958;
    dateMapState.powerWave *= 0.94;
    dateMapState.rollingTrails.forEach((trail) => { trail.life -= FIXED_STEP / ROLL_TRAIL_LIFETIME_MS; });
    dateMapState.rollingTrails = dateMapState.rollingTrails.filter((trail) => trail.life > 0);
    dateMapState.railBursts.forEach((burst) => {
      burst.ageMs = (burst.ageMs || 0) + FIXED_STEP;
      burst.life = clamp(1 - burst.ageMs / (burst.duration || RAIL_WAVE_LIFETIME_MS), 0, 1);
    });
    dateMapState.railBursts = dateMapState.railBursts.filter((burst) => burst.life > 0);
    dateMapState.pocketFlares.forEach((flare) => { flare.life -= FIXED_STEP / 1500; });
    dateMapState.pocketFlares = dateMapState.pocketFlares.filter((flare) => flare.life > 0);
    if (dateMapState.blackEightBlast) {
      dateMapState.blackEightBlast.ageMs += FIXED_STEP;
      dateMapState.blackEightBlast.life = clamp(1 - dateMapState.blackEightBlast.ageMs / dateMapState.blackEightBlast.duration, 0, 1);
      if (dateMapState.blackEightBlast.life <= 0) dateMapState.blackEightBlast = null;
    }
    advanceWaterSurface(FIXED_STEP);
    if (dateMapState.completed && dateMapState.finalProgress < 1) {
      dateMapState.finalProgress = Math.min(1, dateMapState.finalProgress + 0.009);
    }
    collisionFeedbacks.forEach((feedback) => {
      feedback.life -= 0.115;
      feedback.radius += feedback.speed;
      feedback.speed *= 0.82;
    });
    collisionFeedbacks = collisionFeedbacks.filter((feedback) => feedback.life > 0);
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (!data) return;
      data.compression *= 0.64;
      data.impactGlow *= 0.74;
      if (data.compression < 0.001) data.compression = 0;
      if (data.impactGlow < 0.01) data.impactGlow = 0;
    });
    screenFlash *= 0.9;
    screenShake *= 0.83;
  }

  function rayCircleDistance(origin, direction, center, radius) {
    const ox = origin.x - center.x;
    const oy = origin.y - center.y;
    const projection = ox * direction.x + oy * direction.y;
    const constant = ox * ox + oy * oy - radius * radius;
    const discriminant = projection * projection - constant;
    if (discriminant < 0) return Infinity;
    const near = -projection - Math.sqrt(discriminant);
    return near > 0 ? near : Infinity;
  }

  function rayBoundaryDistance(origin, direction) {
    const distances = [];
    if (direction.x > 0) distances.push((TABLE.right - BALL_RADIUS - origin.x) / direction.x);
    if (direction.x < 0) distances.push((TABLE.left + BALL_RADIUS - origin.x) / direction.x);
    if (direction.y > 0) distances.push((TABLE.bottom - BALL_RADIUS - origin.y) / direction.y);
    if (direction.y < 0) distances.push((TABLE.top + BALL_RADIUS - origin.y) / direction.y);
    return Math.min(...distances.filter((value) => value > 0));
  }

  function traceAim() {
    if (!cueBall) return null;
    const origin = cueBall.position;
    const direction = pointerAim?.direction || aimDirection;
    let hitBall = null;
    let hitDistance = rayBoundaryDistance(origin, direction);
    balls.forEach((ball) => {
      const data = bodyData(ball);
      if (!data || data.number === 0 || data.potted) return;
      const candidate = rayCircleDistance(origin, direction, ball.position, BALL_RADIUS * 2);
      if (candidate < hitDistance) {
        hitDistance = candidate;
        hitBall = ball;
      }
    });
    const impact = { x: origin.x + direction.x * hitDistance, y: origin.y + direction.y * hitDistance };
    let targetDirection = null;
    if (hitBall) targetDirection = normalize({ x: hitBall.position.x - impact.x, y: hitBall.position.y - impact.y });
    return { origin, direction, impact, hitBall, targetDirection };
  }

  function drawSolidWoodFrame() {
    context.save();
    context.shadowColor = "rgba(0, 0, 0, 0.66)";
    context.shadowBlur = 34;
    context.shadowOffsetY = 20;
    const wood = context.createLinearGradient(TABLE_OUTER.left, TABLE_OUTER.top, TABLE_OUTER.right, TABLE_OUTER.bottom);
    wood.addColorStop(0, "#05070b");
    wood.addColorStop(0.18, "#202735");
    wood.addColorStop(0.42, "#090c13");
    wood.addColorStop(0.68, "#2c3442");
    wood.addColorStop(1, "#040609");
    context.fillStyle = wood;
    roundRectPath(context, TABLE_OUTER.left, TABLE_OUTER.top, TABLE_OUTER.right - TABLE_OUTER.left, TABLE_OUTER.bottom - TABLE_OUTER.top, 32);
    context.fill();
    context.restore();

    context.save();
    const burl = context.createLinearGradient(TABLE_OUTER.right, TABLE_OUTER.top, TABLE_OUTER.left, TABLE_OUTER.bottom);
    burl.addColorStop(0, "#394252");
    burl.addColorStop(0.16, "#0b1019");
    burl.addColorStop(0.5, "#222a38");
    burl.addColorStop(0.84, "#080b12");
    burl.addColorStop(1, "#465064");
    context.fillStyle = burl;
    roundRectPath(context, TABLE_OUTER.left + 8, TABLE_OUTER.top + 8, TABLE_OUTER.right - TABLE_OUTER.left - 16, TABLE_OUTER.bottom - TABLE_OUTER.top - 16, 25);
    context.fill();
    roundRectPath(context, TABLE_OUTER.left + 10, TABLE_OUTER.top + 10, TABLE_OUTER.right - TABLE_OUTER.left - 20, TABLE_OUTER.bottom - TABLE_OUTER.top - 20, 23);
    context.clip();
    drawMaterialTexture(MATERIAL_TEXTURES.walnut, TABLE_OUTER.left + 8, TABLE_OUTER.top + 8,
      TABLE_OUTER.right - TABLE_OUTER.left - 16, TABLE_OUTER.bottom - TABLE_OUTER.top - 16, 0.28);
    context.lineWidth = 0.7;
    for (let y = TABLE_OUTER.top + 14, index = 0; y < TABLE_OUTER.bottom - 10; y += 11, index += 1) {
      context.strokeStyle = index % 3 === 0 ? "rgba(181, 214, 255, 0.12)" : "rgba(0, 0, 0, 0.28)";
      context.beginPath();
      context.moveTo(TABLE_OUTER.left + 8, y);
      context.lineTo(TABLE_OUTER.right - 8, y + Math.sin(index * 1.73) * 4);
      context.stroke();
    }
    context.restore();

    context.save();
    context.strokeStyle = "rgba(193, 220, 255, 0.34)";
    context.lineWidth = 1.2;
    roundRectPath(context, TABLE_OUTER.left + 15, TABLE_OUTER.top + 15, TABLE_OUTER.right - TABLE_OUTER.left - 30, TABLE_OUTER.bottom - TABLE_OUTER.top - 30, 20);
    context.stroke();
    context.strokeStyle = "rgba(1, 3, 8, 0.88)";
    context.lineWidth = 5;
    roundRectPath(context, TABLE.left - 43, TABLE.top - 43, TABLE.right - TABLE.left + 86, TABLE.bottom - TABLE.top + 86, 23);
    context.stroke();
    context.restore();
  }

  function drawWoolCloth() {
    context.save();
    const cloth = context.createLinearGradient(TABLE.left, TABLE.top, TABLE.right, TABLE.bottom);
    cloth.addColorStop(0, "#132b35");
    cloth.addColorStop(0.38, "#0c2029");
    cloth.addColorStop(0.72, "#081820");
    cloth.addColorStop(1, "#050e14");
    context.fillStyle = cloth;
    context.fillRect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    context.beginPath();
    context.moveTo(TABLE.left, TABLE.top);
    context.lineTo(TABLE.right, TABLE.top);
    context.lineTo(TABLE.right, TABLE.bottom);
    context.lineTo(TABLE.left, TABLE.bottom);
    context.closePath();
    context.clip();
    const hasClothTexture = drawMaterialTexture(MATERIAL_TEXTURES.cloth, TABLE.left, TABLE.top,
      TABLE.right - TABLE.left, TABLE.bottom - TABLE.top, 0.16);
    context.lineWidth = 0.42;
    for (let y = TABLE.top + 2, index = 0; y < TABLE.bottom; y += 5, index += 1) {
      context.strokeStyle = hasClothTexture
        ? (index % 2 ? "rgba(205, 241, 255, 0.014)" : "rgba(0, 7, 14, 0.028)")
        : (index % 2 ? "rgba(205, 241, 255, 0.042)" : "rgba(0, 7, 14, 0.092)");
      context.beginPath();
      context.moveTo(TABLE.left, y);
      context.lineTo(TABLE.right, y + (index % 4 - 1.5) * 0.35);
      context.stroke();
    }
    context.lineWidth = 0.3;
    for (let x = TABLE.left + 3, index = 0; x < TABLE.right; x += 8, index += 1) {
      context.strokeStyle = hasClothTexture
        ? (index % 3 === 0 ? "rgba(201, 238, 255, 0.012)" : "rgba(0, 8, 16, 0.02)")
        : (index % 3 === 0 ? "rgba(201, 238, 255, 0.036)" : "rgba(0, 8, 16, 0.058)");
      context.beginPath();
      context.moveTo(x, TABLE.top);
      context.lineTo(x + Math.sin(index * 2.1) * 1.2, TABLE.bottom);
      context.stroke();
    }
    const wash = context.createRadialGradient(WORLD.width * 0.54, WORLD.height * 0.46, 32, WORLD.width * 0.54, WORLD.height * 0.46, 620);
    wash.addColorStop(0, "rgba(86, 181, 204, 0.11)");
    wash.addColorStop(1, "transparent");
    context.fillStyle = wash;
    context.fillRect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    context.restore();
  }

  function drawCushionRubber() {
    context.save();
    rails.forEach((railBody) => {
      const material = railBody.plugin.heartbeatRail;
      if (!material || material.kind === "guard") return;
      context.save();
      context.translate(railBody.position.x, railBody.position.y);
      context.rotate(railBody.angle);
      const horizontal = material.width >= material.height;
      const gradient = horizontal
        ? context.createLinearGradient(0, -material.height / 2, 0, material.height / 2)
        : context.createLinearGradient(-material.width / 2, 0, material.width / 2, 0);
      const reverse = material.id.startsWith("bottom") || material.id.startsWith("right");
      const tones = material.kind === "jaw"
        ? ["#111722", "#48566a", "#182130"]
        : ["#0c121c", "#536277", "#172230"];
      gradient.addColorStop(0, reverse ? tones[2] : tones[0]);
      gradient.addColorStop(0.5, tones[1]);
      gradient.addColorStop(1, reverse ? tones[0] : tones[2]);
      context.fillStyle = gradient;
      roundRectPath(context, -material.width / 2, -material.height / 2, material.width, material.height, material.kind === "jaw" ? 5 : 8);
      context.fill();
      context.strokeStyle = material.kind === "jaw" ? "rgba(168, 204, 234, 0.46)" : "rgba(188, 223, 255, 0.64)";
      context.lineWidth = material.kind === "jaw" ? 1 : 1.35;
      roundRectPath(context, -material.width / 2 + 1, -material.height / 2 + 1, material.width - 2, material.height - 2, material.kind === "jaw" ? 4 : 7);
      context.stroke();
      if (material.kind === "cushion") {
        context.strokeStyle = "rgba(199, 230, 255, 0.82)";
        context.shadowColor = "rgba(0, 5, 12, 0.84)";
        context.shadowBlur = 3;
        context.lineWidth = 1.8;
        context.beginPath();
        if (material.id === "top") {
          context.moveTo(-material.width / 2 + 9, material.height / 2 - 1.4);
          context.lineTo(material.width / 2 - 9, material.height / 2 - 1.4);
        } else if (material.id === "bottom") {
          context.moveTo(-material.width / 2 + 9, -material.height / 2 + 1.4);
          context.lineTo(material.width / 2 - 9, -material.height / 2 + 1.4);
        } else if (material.id.startsWith("left")) {
          context.moveTo(material.width / 2 - 1.4, -material.height / 2 + 9);
          context.lineTo(material.width / 2 - 1.4, material.height / 2 - 9);
        } else {
          context.moveTo(-material.width / 2 + 1.4, -material.height / 2 + 9);
          context.lineTo(-material.width / 2 + 1.4, material.height / 2 - 9);
        }
        context.stroke();
      }
      context.restore();
    });
    context.restore();
  }

  function drawMetalSight(x, y) {
    context.save();
    context.translate(x, y);
    context.rotate(Math.PI / 4);
    context.shadowColor = "rgba(0, 0, 0, 0.6)";
    context.shadowBlur = 3;
    context.shadowOffsetY = 2;
    const metal = context.createLinearGradient(-4, -4, 4, 4);
    metal.addColorStop(0, "#fff2c7");
    metal.addColorStop(0.28, "#ad8b59");
    metal.addColorStop(0.56, "#f2d99d");
    metal.addColorStop(1, "#6f5536");
    context.fillStyle = metal;
    context.fillRect(-4, -4, 8, 8);
    context.fillStyle = "rgba(255, 255, 255, 0.66)";
    context.fillRect(-2.5, -2.5, 2, 2);
    context.restore();
  }

  function drawMetalSights() {
    [0.25, 0.5, 0.75].forEach((fraction) => {
      const x = TABLE.left + (TABLE.right - TABLE.left) * fraction;
      drawMetalSight(x, TABLE.top - 43);
      drawMetalSight(x, TABLE.bottom + 43);
    });
    [0.125, 0.25, 0.375, 0.625, 0.75, 0.875].forEach((fraction) => {
      const y = TABLE.top + (TABLE.bottom - TABLE.top) * fraction;
      drawMetalSight(TABLE.left - 43, y);
      drawMetalSight(TABLE.right + 43, y);
    });
  }

  function drawPocketInnerWall(pocket) {
    const tangentX = -pocket.inwardY;
    const tangentY = pocket.inwardX;
    const mouthHalf = pocket.mouth / 2;
    const dropHalf = POCKET_RADIUS * 0.62;
    const mouthA = { x: pocket.mouthX + tangentX * mouthHalf, y: pocket.mouthY + tangentY * mouthHalf };
    const mouthB = { x: pocket.mouthX - tangentX * mouthHalf, y: pocket.mouthY - tangentY * mouthHalf };
    const dropA = { x: pocket.x + tangentX * dropHalf, y: pocket.y + tangentY * dropHalf };
    const dropB = { x: pocket.x - tangentX * dropHalf, y: pocket.y - tangentY * dropHalf };
    const lining = context.createLinearGradient(pocket.mouthX, pocket.mouthY, pocket.x, pocket.y);
    lining.addColorStop(0, "#4a3025");
    lining.addColorStop(0.4, "#211714");
    lining.addColorStop(1, "#080807");
    context.fillStyle = lining;
    context.beginPath();
    context.moveTo(mouthA.x, mouthA.y);
    context.lineTo(dropA.x, dropA.y);
    context.lineTo(dropB.x, dropB.y);
    context.lineTo(mouthB.x, mouthB.y);
    context.closePath();
    context.fill();
    context.strokeStyle = "rgba(177, 126, 84, 0.4)";
    context.lineWidth = 1.1;
    context.beginPath();
    context.moveTo(mouthA.x, mouthA.y);
    context.lineTo(dropA.x, dropA.y);
    context.moveTo(mouthB.x, mouthB.y);
    context.lineTo(dropB.x, dropB.y);
    context.stroke();
  }

  function drawLeatherPocket(pocket) {
    context.save();
    drawPocketInnerWall(pocket);
    const collarRadius = POCKET_RADIUS + (pocket.type === "side" ? 8 : 6);
    const leather = context.createRadialGradient(pocket.x - 8, pocket.y - 9, 2, pocket.x, pocket.y, collarRadius);
    leather.addColorStop(0, "#8b5b3c");
    leather.addColorStop(0.5, "#3a2119");
    leather.addColorStop(0.78, "#1d1110");
    leather.addColorStop(1, "#0b0808");
    context.fillStyle = leather;
    context.beginPath();
    context.arc(pocket.x, pocket.y, collarRadius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(178, 148, 112, 0.34)";
    context.lineWidth = 0.9;
    context.beginPath();
    context.arc(pocket.x, pocket.y, collarRadius - 4.5, 0, Math.PI * 2);
    context.stroke();
    const depth = context.createRadialGradient(pocket.x - 7, pocket.y - 9, 1, pocket.x, pocket.y, POCKET_RADIUS + 1);
    depth.addColorStop(0, "#101412");
    depth.addColorStop(0.38, "#050706");
    depth.addColorStop(0.72, "#010202");
    depth.addColorStop(1, "#000000");
    context.fillStyle = depth;
    context.shadowColor = "rgba(0, 0, 0, 0.9)";
    context.shadowBlur = 12;
    context.beginPath();
    context.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawTable() {
    drawSolidWoodFrame();
    drawWoolCloth();
    drawCushionRubber();
    drawMetalSights();
    POCKETS.forEach(drawLeatherPocket);
  }

  function rebuildTableCache() {
    const cache = document.createElement("canvas");
    if (typeof cache.getContext !== "function") return false;
    cache.width = WORLD.width * 2;
    cache.height = WORLD.height * 2;
    const cacheContext = cache.getContext("2d", { alpha: true });
    if (!cacheContext) return false;
    const liveContext = context;
    try {
      context = cacheContext;
      context.setTransform(cache.width / WORLD.width, 0, 0, cache.height / WORLD.height, 0, 0);
      context.clearRect(0, 0, WORLD.width, WORLD.height);
      drawTable();
    } finally {
      context = liveContext;
    }
    tableCacheCanvas = cache;
    tableCacheDirty = false;
    return true;
  }

  function drawTableLayer() {
    if ((tableCacheDirty || !tableCacheCanvas) && !rebuildTableCache()) {
      drawTable();
      return;
    }
    context.drawImage(tableCacheCanvas, 0, 0, WORLD.width, WORLD.height);
  }

  function makeDateMapCache(filter, roseVeil) {
    const source = MATERIAL_TEXTURES.dateMap;
    if (!source || !source.complete || !source.naturalWidth) return null;
    const cache = document.createElement("canvas");
    cache.width = WORLD.width;
    cache.height = WORLD.height;
    const cacheContext = cache.getContext("2d", { alpha: true });
    if (!cacheContext) return null;
    cacheContext.save();
    cacheContext.beginPath();
    cacheContext.rect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    cacheContext.clip();
    cacheContext.filter = filter;
    cacheContext.drawImage(source, TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    cacheContext.filter = "none";
    cacheContext.globalCompositeOperation = "source-atop";
    cacheContext.fillStyle = roseVeil;
    cacheContext.fillRect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    cacheContext.restore();
    return cache;
  }

  function ensureDateMapCaches() {
    if (dateMapDarkCanvas && dateMapClearCanvas) return true;
    dateMapDarkCanvas = makeDateMapCache("blur(5px) brightness(0.52) saturate(0.7)", "rgba(82, 20, 47, 0.46)");
    dateMapClearCanvas = makeDateMapCache("brightness(0.82) saturate(0.96) contrast(1.04)", "rgba(111, 30, 59, 0.17)");
    return Boolean(dateMapDarkCanvas && dateMapClearCanvas);
  }

  function sceneTransitionProgress(timestamp) {
    const transition = dateMapState.sceneTransition;
    if (!transition) return 1;
    return clamp((timestamp - transition.startedAt) / transition.duration, 0, 1);
  }

  function drawSceneImage(sceneState, alpha = 1) {
    if (!sceneState) return false;
    const image = DATE_SCENE_TEXTURES[sceneState.sceneId];
    if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return false;
    const variant = DATE_SCENE_VARIANTS[sceneState.variantIndex ?? 0] || DATE_SCENE_VARIANTS[0];
    const destinationWidth = TABLE.right - TABLE.left;
    const destinationHeight = TABLE.bottom - TABLE.top;
    const destinationAspect = destinationWidth / destinationHeight;
    const sourceAspect = image.naturalWidth / image.naturalHeight;
    let sourceWidth = sourceAspect > destinationAspect ? image.naturalHeight * destinationAspect : image.naturalWidth;
    let sourceHeight = sourceAspect > destinationAspect ? image.naturalHeight : image.naturalWidth / destinationAspect;
    const zoom = clamp(variant.zoom || 1, 1, 1.28);
    sourceWidth /= zoom;
    sourceHeight /= zoom;
    const sourceX = clamp((image.naturalWidth - sourceWidth) * variant.focusX, 0, image.naturalWidth - sourceWidth);
    const sourceY = clamp((image.naturalHeight - sourceHeight) * variant.focusY, 0, image.naturalHeight - sourceHeight);
    context.save();
    context.globalAlpha = clamp(alpha, 0, 1);
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      TABLE.left,
      TABLE.top,
      destinationWidth,
      destinationHeight
    );
    context.restore();
    return true;
  }

  function drawSceneGrade(sceneState) {
    if (!sceneState) return;
    const mood = stageSceneMood(sceneState.stageNumber);
    const style = DATE_SCENE_STYLES[sceneState.sceneId] || DATE_SCENE_STYLES["corner-store"];
    const motifPalette = motifScenePalette(sceneState.motif);
    context.save();
    context.globalCompositeOperation = "color";
    context.globalAlpha = 0.2 + mood.light * 0.08;
    context.fillStyle = motifPalette.tint || mood.tint;
    context.fillRect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    context.globalCompositeOperation = "soft-light";
    context.globalAlpha = 0.1 + mood.light * 0.05;
    context.fillStyle = mood.tint;
    context.fillRect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    context.globalCompositeOperation = "screen";
    const originGlow = context.createRadialGradient(
      sceneState.originX,
      sceneState.originY,
      0,
      sceneState.originX,
      sceneState.originY,
      WORLD.height * 0.58
    );
    originGlow.addColorStop(0, colorWithAlpha(style.rail, 0.22 + mood.light * 0.08));
    originGlow.addColorStop(0.28, colorWithAlpha(motifPalette.primary, 0.16 + mood.light * 0.06));
    originGlow.addColorStop(1, colorWithAlpha(motifPalette.secondary, 0));
    context.fillStyle = originGlow;
    context.fillRect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    context.globalCompositeOperation = "multiply";
    const depth = context.createLinearGradient(0, TABLE.top, 0, TABLE.bottom);
    depth.addColorStop(0, "rgba(24, 5, 14, 0.04)");
    depth.addColorStop(0.55, "rgba(24, 5, 14, 0)");
    depth.addColorStop(1, "rgba(24, 5, 14, 0.2)");
    context.fillStyle = depth;
    context.fillRect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    context.restore();
  }

  function drawScenePortalPhoto(timestamp) {
    const active = dateMapState.activeScene;
    if (!active) return false;
    const transition = dateMapState.sceneTransition;
    const progress = sceneTransitionProgress(timestamp);
    if (transition?.from) drawSceneImage(transition.from, stageSceneMood(transition.from.stageNumber).imageAlpha);
    if (!transition || progress >= 0.998) {
      drawSceneImage(active, stageSceneMood(active.stageNumber).imageAlpha);
    } else {
      const eased = progress * progress * (3 - 2 * progress);
      const farthestRadius = Math.max(
        Math.hypot(active.originX - TABLE.left, active.originY - TABLE.top),
        Math.hypot(active.originX - TABLE.right, active.originY - TABLE.top),
        Math.hypot(active.originX - TABLE.left, active.originY - TABLE.bottom),
        Math.hypot(active.originX - TABLE.right, active.originY - TABLE.bottom)
      );
      [
        { scale: 1.14, alpha: 0.2 },
        { scale: 1.03, alpha: 0.44 },
        { scale: 0.9, alpha: 0.94 }
      ].forEach((layer) => {
        context.save();
        context.beginPath();
        context.arc(active.originX, active.originY, Math.max(5, farthestRadius * eased * layer.scale), 0, Math.PI * 2);
        context.clip();
        drawSceneImage(active, stageSceneMood(active.stageNumber).imageAlpha * layer.alpha);
        context.restore();
      });
    }
    drawSceneGrade(active);
    return true;
  }

  function drawSceneVariantAtmosphere(timestamp) {
    const active = dateMapState.activeScene;
    if (!active) return;
    const variant = DATE_SCENE_VARIANTS[active.variantIndex] || DATE_SCENE_VARIANTS[0];
    const focus = {
      x: TABLE.left + (TABLE.right - TABLE.left) * variant.focusX,
      y: TABLE.top + (TABLE.bottom - TABLE.top) * variant.focusY,
      visits: dateMapState.zones.get(active.pocketId)?.visits || 1
    };
    drawMotifAtmosphere(active.motif, focus, timestamp, 0.72 + stageSceneMood(active.stageNumber).light * 0.2);
    drawMotifCinematicProps(active, timestamp);
  }

  function drawMotifCinematicProps(active, timestamp) {
    const motif = String(active.motif || "night");
    const palette = motifScenePalette(motif);
    const width = TABLE.right - TABLE.left;
    const height = TABLE.bottom - TABLE.top;
    const centerX = WORLD.width / 2;
    const lowerY = TABLE.top + height * 0.64;
    context.save();
    context.globalCompositeOperation = "screen";
    context.strokeStyle = colorWithAlpha(palette.primary, 0.34);
    context.fillStyle = colorWithAlpha(palette.secondary, 0.12);
    context.shadowColor = palette.primary;
    context.shadowBlur = 9;
    context.lineWidth = 2;
    if (motif === "coffee") {
      [-45, 45].forEach((offset, index) => {
        context.globalAlpha = 0.58 - index * 0.08;
        roundRectPath(context, centerX + offset - 24, lowerY - 8, 48, 34, 8);
        context.fill();
        context.stroke();
        context.beginPath();
        context.arc(centerX + offset + (offset < 0 ? 27 : -27), lowerY + 8, 10, -Math.PI / 2, Math.PI / 2);
        context.stroke();
        for (let line = -1; line <= 1; line += 1) {
          const sway = Math.sin(timestamp * 0.002 + line + index) * 7;
          context.beginPath();
          context.moveTo(centerX + offset + line * 7, lowerY - 12);
          bezierPath(context, centerX + offset - 9, lowerY - 34, centerX + offset + sway, lowerY - 48, centerX + offset + line * 5, lowerY - 67);
          context.stroke();
        }
      });
    } else if (motif === "movie-ticket") {
      [-18, 18].forEach((offset, index) => {
        context.save();
        context.translate(centerX + offset, lowerY);
        context.rotate(index ? 0.12 : -0.1);
        context.globalAlpha = 0.46;
        roundRectPath(context, -72, -28, 144, 56, 8);
        context.fill();
        context.stroke();
        context.setLineDash([4, 6]);
        context.beginPath();
        context.moveTo(35, -25);
        context.lineTo(35, 25);
        context.stroke();
        context.restore();
      });
    } else if (motif === "camera") {
      context.globalAlpha = 0.52 + Math.sin(timestamp * 0.006) * 0.08;
      const marginX = 92;
      const marginY = 188;
      const corner = 52;
      [[TABLE.left + marginX, TABLE.top + marginY, 1, 1], [TABLE.right - marginX, TABLE.top + marginY, -1, 1], [TABLE.left + marginX, TABLE.bottom - marginY, 1, -1], [TABLE.right - marginX, TABLE.bottom - marginY, -1, -1]].forEach(([x, y, sx, sy]) => {
        context.beginPath();
        context.moveTo(x + sx * corner, y);
        context.lineTo(x, y);
        context.lineTo(x, y + sy * corner);
        context.stroke();
      });
    } else if (motif === "streetlamp" || motif === "sunset") {
      [0.2, 0.5, 0.8].forEach((fraction, index) => {
        const x = TABLE.left + width * fraction;
        const y = TABLE.top + height * (0.24 + index * 0.22);
        const glow = context.createRadialGradient(x, y, 0, x, y, 110);
        glow.addColorStop(0, colorWithAlpha(palette.primary, 0.25));
        glow.addColorStop(1, colorWithAlpha(palette.secondary, 0));
        context.fillStyle = glow;
        context.fillRect(x - 112, y - 112, 224, 224);
      });
    } else if (motif === "bus-card") {
      const sweep = TABLE.left - 180 + (timestamp * 0.055 % (width + 360));
      const train = context.createLinearGradient(sweep, 0, sweep + 180, 0);
      train.addColorStop(0, colorWithAlpha(palette.primary, 0));
      train.addColorStop(0.5, colorWithAlpha(palette.primary, 0.34));
      train.addColorStop(1, colorWithAlpha(palette.secondary, 0));
      context.fillStyle = train;
      context.fillRect(TABLE.left, lowerY - 62, width, 124);
    } else if (motif === "umbrella") {
      context.globalAlpha = 0.34;
      context.beginPath();
      context.arc(centerX, lowerY - 20, 126, Math.PI, Math.PI * 2);
      context.quadraticCurveTo(centerX + 85, lowerY - 4, centerX + 62, lowerY - 20);
      context.quadraticCurveTo(centerX, lowerY + 4, centerX - 62, lowerY - 20);
      context.quadraticCurveTo(centerX - 85, lowerY - 4, centerX - 126, lowerY - 20);
      context.stroke();
      context.beginPath();
      context.moveTo(centerX, lowerY - 146);
      context.lineTo(centerX, lowerY + 64);
      context.quadraticCurveTo(centerX, lowerY + 92, centerX + 24, lowerY + 78);
      context.stroke();
    } else if (motif === "homeward") {
      const doorGlow = context.createRadialGradient(centerX, lowerY, 0, centerX, lowerY, 170);
      doorGlow.addColorStop(0, colorWithAlpha(palette.secondary, 0.3));
      doorGlow.addColorStop(1, colorWithAlpha(palette.primary, 0));
      context.fillStyle = doorGlow;
      context.fillRect(centerX - 175, lowerY - 180, 350, 360);
      context.globalAlpha = 0.42;
      roundRectPath(context, centerX - 54, lowerY - 104, 108, 208, 3);
      context.stroke();
    }
    context.restore();
  }

  function drawScenePortalLightingFrame(timestamp) {
    const active = dateMapState.activeScene;
    const theme = dateMapState.activeTheme;
    const effect = dateMapState.activeEffect;
    if (!active || !theme || !effect) return;
    const progress = sceneTransitionProgress(timestamp);
    const pulse = dateMapState.sceneTransition && progress < 1 ? 1 - progress : 0;
    context.save();
    context.globalCompositeOperation = "screen";
    context.globalAlpha = 0.1 + pulse * 0.22 + Math.min(5, dateMapState.activeStreak) * 0.014;
    rails.forEach((railBody, index) => {
      const material = railBody.plugin.heartbeatRail;
      if (!material || material.kind === "guard") return;
      context.save();
      context.translate(railBody.position.x, railBody.position.y);
      context.rotate(railBody.angle);
      context.fillStyle = index % 3 === 0 ? effect.secondary : index % 2 ? theme.primary : theme.secondary;
      roundRectPath(context, -material.width / 2, -material.height / 2, material.width, material.height, material.kind === "jaw" ? 5 : 8);
      context.fill();
      context.globalAlpha = 0.58;
      context.strokeStyle = effect.primary;
      context.lineWidth = material.kind === "jaw" ? 0.8 : 1.25;
      context.stroke();
      context.restore();
    });
    context.restore();
    const perimeter = context.createLinearGradient(TABLE.left, TABLE.top, TABLE.right, TABLE.bottom);
    perimeter.addColorStop(0, effect.primary);
    perimeter.addColorStop(0.48, theme.primary);
    perimeter.addColorStop(1, effect.secondary);
    context.save();
    context.globalCompositeOperation = "screen";
    context.strokeStyle = perimeter;
    context.shadowColor = effect.secondary;
    context.shadowBlur = 7 + pulse * 22;
    context.globalAlpha = 0.12 + pulse * 0.42;
    context.lineWidth = 3.2 + pulse * 5.8;
    roundRectPath(context, TABLE.left - 15, TABLE.top - 15, TABLE.right - TABLE.left + 30, TABLE.bottom - TABLE.top + 30, 22);
    context.stroke();
    context.globalAlpha = 0.15 + pulse * 0.55;
    context.lineWidth = 1.4 + pulse * 2.2;
    context.setLineDash([22, 18]);
    context.lineDashOffset = -timestamp * 0.075;
    roundRectPath(context, TABLE.left - 24, TABLE.top - 24, TABLE.right - TABLE.left + 48, TABLE.bottom - TABLE.top + 48, 25);
    context.stroke();
    context.setLineDash([]);
    const waveRadius = 56 + progress * WORLD.height * 0.7;
    const wave = context.createRadialGradient(active.originX, active.originY, Math.max(0, waveRadius - 64), active.originX, active.originY, waveRadius);
    wave.addColorStop(0, colorWithAlpha(theme.primary, 0));
    wave.addColorStop(0.78, colorWithAlpha(effect.primary, 0.02 + pulse * 0.34));
    wave.addColorStop(1, colorWithAlpha(effect.secondary, 0));
    context.fillStyle = wave;
    context.fillRect(TABLE_OUTER.left, TABLE_OUTER.top, TABLE_OUTER.right - TABLE_OUTER.left, TABLE_OUTER.bottom - TABLE_OUTER.top);
    RELATIONSHIP_SIGHTS.forEach((sight, index) => {
      const shimmer = 0.55 + Math.sin(timestamp * 0.004 + index * 0.72) * 0.45;
      context.globalAlpha = (0.09 + pulse * 0.25) * shimmer;
      context.fillStyle = index % 3 === 0 ? effect.primary : index % 2 ? theme.primary : theme.secondary;
      context.shadowColor = context.fillStyle;
      context.shadowBlur = 5 + pulse * 9;
      context.beginPath();
      context.arc(sight.x, sight.y, 2.2 + pulse * 1.8, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  }

  function ensureSceneLightingFrameCanvas() {
    if (sceneLightingFrameCanvas && sceneLightingFrameContext) return true;
    const cache = document.createElement("canvas");
    if (typeof cache.getContext !== "function") return false;
    cache.width = WORLD.width;
    cache.height = WORLD.height;
    const cacheContext = cache.getContext("2d", { alpha: true });
    if (!cacheContext) return false;
    sceneLightingFrameCanvas = cache;
    sceneLightingFrameContext = cacheContext;
    sceneLightingFrameDirty = true;
    return true;
  }

  function rebuildSceneLightingFrame(timestamp) {
    if (!ensureSceneLightingFrameCanvas()) return false;
    const liveContext = context;
    try {
      context = sceneLightingFrameContext;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, WORLD.width, WORLD.height);
      drawScenePortalLightingFrame(timestamp);
    } finally {
      context = liveContext;
    }
    sceneLightingFrameUpdatedAt = timestamp;
    sceneLightingFrameDirty = false;
    return true;
  }

  function drawScenePortalLighting(timestamp) {
    if (!dateMapState.activeScene) return;
    const transitionActive = dateMapState.sceneTransition && sceneTransitionProgress(timestamp) < 1;
    const refreshDue = !pointerAim && transitionActive && timestamp - sceneLightingFrameUpdatedAt >= DATE_MAP_REFRESH_MS;
    if ((sceneLightingFrameDirty || refreshDue || !sceneLightingFrameCanvas) && !rebuildSceneLightingFrame(timestamp)) {
      drawScenePortalLightingFrame(timestamp);
      return;
    }
    context.drawImage(sceneLightingFrameCanvas, 0, 0, WORLD.width, WORLD.height);
  }

  function drawDateMapPhotoBase(litCount, finalBoost, timestamp) {
    if (!ensureDateMapCaches()) return false;
    const progress = clamp(litCount / 15, 0, 1);
    context.save();
    context.globalAlpha = 0.58 + progress * 0.12;
    context.drawImage(dateMapDarkCanvas, 0, 0, WORLD.width, WORLD.height);
    drawScenePortalPhoto(timestamp);
    const fullClearAlpha = dateMapState.stagePulse * 0.18 + finalBoost * 0.46;
    if (fullClearAlpha > 0.005) {
      context.globalCompositeOperation = "screen";
      context.globalAlpha = fullClearAlpha;
      context.drawImage(dateMapClearCanvas, 0, 0, WORLD.width, WORLD.height);
    }
    context.restore();
    return true;
  }

  function drawScenePhotoReveal(zone, finalBoost) {
    if (!dateMapClearCanvas) return;
    const reveal = clamp(zone.reveal + finalBoost * 0.82, 0, 1);
    const radiusX = 124 + reveal * 68;
    const radiusY = 106 + reveal * 66;
    [1.28, 1.05, 0.82].forEach((scale, index) => {
      const left = clamp(zone.x - radiusX * scale, TABLE.left, TABLE.right);
      const top = clamp(zone.y - radiusY * scale, TABLE.top, TABLE.bottom);
      const right = clamp(zone.x + radiusX * scale, TABLE.left, TABLE.right);
      const bottom = clamp(zone.y + radiusY * scale, TABLE.top, TABLE.bottom);
      const width = Math.max(1, right - left);
      const height = Math.max(1, bottom - top);
      context.save();
      context.beginPath();
      ellipsePath(context, zone.x, zone.y, radiusX * scale, radiusY * scale, 0, 0, Math.PI * 2);
      context.clip();
      context.globalAlpha = reveal * [0.08, 0.18, 0.42][index];
      context.drawImage(dateMapClearCanvas, left, top, width, height, left, top, width, height);
      context.restore();
    });
  }

  function drawMotifAtmosphere(motif, zone, timestamp, weight) {
    const key = String(motif || "").toLowerCase();
    const alpha = clamp(weight, 0, 1);
    if (!alpha) return;
    context.save();
    context.globalCompositeOperation = "screen";
    if (key.includes("rain") || key.includes("umbrella")) {
      context.strokeStyle = `rgba(190, 224, 230, ${0.12 + alpha * 0.2})`;
      context.lineWidth = 0.8;
      for (let index = 0; index < 12; index += 1) {
        const offsetX = (index * 31 + timestamp * 0.026) % 210 - 105;
        const offsetY = (index * 47 + timestamp * 0.019) % 170 - 85;
        context.beginPath();
        context.moveTo(zone.x + offsetX, zone.y + offsetY - 9);
        context.lineTo(zone.x + offsetX - 5, zone.y + offsetY + 8);
        context.stroke();
      }
    }
    if (key.includes("coffee") || key.includes("home") || key.includes("gift")) {
      const glow = context.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, 112);
      glow.addColorStop(0, `rgba(255, 200, 119, ${0.16 + alpha * 0.19})`);
      glow.addColorStop(1, "rgba(255, 186, 104, 0)");
      context.fillStyle = glow;
      context.fillRect(zone.x - 115, zone.y - 115, 230, 230);
    }
    if (key.includes("coffee")) {
      context.strokeStyle = `rgba(255, 240, 212, ${0.12 + alpha * 0.24})`;
      context.lineWidth = 1.4;
      for (let index = -1; index <= 1; index += 1) {
        const sway = Math.sin(timestamp * 0.0025 + index) * 8;
        context.beginPath();
        context.moveTo(zone.x + index * 14, zone.y + 26);
        bezierPath(context, zone.x + index * 14 - 10, zone.y + 5, zone.x + sway + index * 10, zone.y - 16, zone.x + index * 9, zone.y - 42);
        context.stroke();
      }
    }
    if (key.includes("ticket")) {
      const beam = context.createLinearGradient(zone.x - 125, zone.y - 70, zone.x + 125, zone.y + 70);
      beam.addColorStop(0, "rgba(217, 84, 103, 0)");
      beam.addColorStop(0.5, `rgba(255, 214, 175, ${0.08 + alpha * 0.18})`);
      beam.addColorStop(1, "rgba(217, 84, 103, 0)");
      context.fillStyle = beam;
      context.fillRect(zone.x - 130, zone.y - 76, 260, 152);
    }
    if (key.includes("camera")) {
      const flash = Math.max(zone.pulse, 0) ** 2;
      const bloom = context.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, 92);
      bloom.addColorStop(0, `rgba(255, 251, 232, ${flash * 0.6})`);
      bloom.addColorStop(0.18, `rgba(255, 240, 205, ${flash * 0.26})`);
      bloom.addColorStop(1, "rgba(255, 255, 255, 0)");
      context.fillStyle = bloom;
      context.fillRect(zone.x - 95, zone.y - 95, 190, 190);
    }
    if (key.includes("lamp") || key.includes("sun")) {
      const pulse = 0.88 + Math.sin(timestamp * 0.0022) * 0.12;
      const light = context.createRadialGradient(zone.x, zone.y - 12, 0, zone.x, zone.y - 12, 128);
      light.addColorStop(0, `rgba(255, 198, 104, ${(0.14 + alpha * 0.2) * pulse})`);
      light.addColorStop(1, "rgba(255, 146, 86, 0)");
      context.fillStyle = light;
      context.fillRect(zone.x - 132, zone.y - 144, 264, 264);
    }
    if (key.includes("ear") || key.includes("message")) {
      for (let index = 0; index < 5; index += 1) {
        const phase = (timestamp * 0.0014 + index * 0.19) % 1;
        context.globalAlpha = alpha * (1 - phase) * 0.36;
        context.fillStyle = index % 2 ? "#bfe6df" : "#fff0c9";
        context.beginPath();
        context.arc(zone.x - 64 + index * 32, zone.y + Math.sin(timestamp * 0.003 + index) * 14, 2 + phase * 4, 0, Math.PI * 2);
        context.fill();
      }
    }
    if (key.includes("cat")) {
      const travel = (timestamp * 0.014 + zone.visits * 27) % 170 - 85;
      context.globalAlpha = 0.18 + alpha * 0.26;
      context.fillStyle = "#18211f";
      context.beginPath();
      ellipsePath(context, zone.x + travel, zone.y + 48, 10, 5, 0, 0, Math.PI * 2);
      context.arc(zone.x + travel + 9, zone.y + 43, 5, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "#18211f";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(zone.x + travel - 8, zone.y + 47);
      context.quadraticCurveTo(zone.x + travel - 22, zone.y + 35, zone.x + travel - 14, zone.y + 28);
      context.stroke();
    }
    if (key.includes("heart")) {
      const heartGlow = context.createRadialGradient(zone.x - 12, zone.y, 0, zone.x, zone.y, 126);
      heartGlow.addColorStop(0, `rgba(238, 132, 157, ${0.1 + alpha * 0.2})`);
      heartGlow.addColorStop(1, "rgba(238, 132, 157, 0)");
      context.fillStyle = heartGlow;
      context.fillRect(zone.x - 130, zone.y - 126, 260, 252);
    }
    if (key.includes("transit")) {
      const scan = (timestamp * 0.045) % 210 - 105;
      const trainLight = context.createLinearGradient(zone.x + scan - 28, 0, zone.x + scan + 28, 0);
      trainLight.addColorStop(0, "rgba(174, 221, 222, 0)");
      trainLight.addColorStop(0.5, `rgba(226, 250, 237, ${0.12 + alpha * 0.28})`);
      trainLight.addColorStop(1, "rgba(174, 221, 222, 0)");
      context.fillStyle = trainLight;
      context.fillRect(zone.x - 112, zone.y - 42, 224, 84);
    }
    if (key.includes("star")) {
      context.fillStyle = "#fff4cc";
      for (let index = 0; index < 13; index += 1) {
        context.globalAlpha = alpha * (0.18 + (Math.sin(timestamp * 0.004 + index) + 1) * 0.15);
        context.beginPath();
        context.arc(zone.x - 90 + (index * 43) % 180, zone.y - 66 + (index * 61) % 132, index % 4 === 0 ? 2.1 : 1.1, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.restore();
  }

  function drawPhotographicScene(zone, timestamp, finalBoost) {
    drawScenePhotoReveal(zone, finalBoost);
    const pocket = POCKETS.find((candidate) => candidate.id === zone.pocketId);
    if (pocket && (zone.pulse > 0.03 || finalBoost > 0)) {
      context.save();
      context.globalCompositeOperation = "screen";
      context.globalAlpha = 0.05 + zone.pulse * 0.2 + finalBoost * 0.16;
      context.strokeStyle = zone.color;
      context.shadowColor = zone.color;
      context.shadowBlur = 16;
      context.lineCap = "round";
      context.lineWidth = 7;
      context.beginPath();
      context.moveTo(pocket.captureX, pocket.captureY);
      context.quadraticCurveTo((pocket.captureX + zone.x) / 2, zone.y, zone.x, zone.y);
      context.stroke();
      context.restore();
    }
    zone.motifs.slice(-3).forEach((motif, index) => {
      drawMotifAtmosphere(motif, zone, timestamp + index * 173, zone.reveal * (1 - index * 0.18) + finalBoost * 0.5);
    });
  }

  function tracePoints(points) {
    if (!points?.length) return;
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
  }

  function drawMotifGlyph(motif, x, y, size, alpha = 1) {
    const key = String(motif || "star").toLowerCase();
    const s = size;
    context.save();
    context.translate(x, y);
    context.globalAlpha *= alpha;
    context.lineWidth = Math.max(1, s * 0.09);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#fff1c9";
    context.fillStyle = "rgba(255, 239, 199, 0.16)";
    context.beginPath();
    if (key.includes("rain") || key.includes("drop")) {
      context.moveTo(0, -s * 0.58); context.lineTo(-s * 0.38, s * 0.12); context.arc(0, s * 0.12, s * 0.38, Math.PI, 0); context.closePath();
    } else if (key.includes("coffee") || key.includes("cup")) {
      context.moveTo(-s * 0.5, -s * 0.22); context.lineTo(-s * 0.38, s * 0.38); context.lineTo(s * 0.3, s * 0.38); context.lineTo(s * 0.42, -s * 0.22); context.closePath();
      context.moveTo(s * 0.42, -s * 0.08); context.arc(s * 0.49, s * 0.08, s * 0.2, -Math.PI / 2, Math.PI / 2);
    } else if (key.includes("ticket") || key.includes("transit") || key.includes("card")) {
      context.moveTo(-s * 0.58, -s * 0.32); context.lineTo(s * 0.58, -s * 0.32); context.lineTo(s * 0.58, s * 0.32); context.lineTo(-s * 0.58, s * 0.32); context.closePath();
      context.moveTo(-s * 0.08, -s * 0.28); context.lineTo(-s * 0.08, s * 0.28);
    } else if (key.includes("camera") || key.includes("photo")) {
      context.moveTo(-s * 0.58, -s * 0.28); context.lineTo(-s * 0.18, -s * 0.28); context.lineTo(-s * 0.08, -s * 0.44); context.lineTo(s * 0.28, -s * 0.44); context.lineTo(s * 0.38, -s * 0.28); context.lineTo(s * 0.58, -s * 0.28); context.lineTo(s * 0.58, s * 0.4); context.lineTo(-s * 0.58, s * 0.4); context.closePath();
      context.moveTo(s * 0.22, 0); context.arc(0, 0, s * 0.25, 0, Math.PI * 2);
    } else if (key.includes("lamp") || key.includes("light")) {
      context.moveTo(0, s * 0.58); context.lineTo(0, -s * 0.28); context.arc(s * 0.18, -s * 0.28, s * 0.18, Math.PI, 0); context.moveTo(-s * 0.28, s * 0.58); context.lineTo(s * 0.28, s * 0.58);
    } else if (key.includes("ear") || key.includes("music")) {
      context.arc(0, 0, s * 0.48, Math.PI * 1.04, Math.PI * 1.96); context.moveTo(-s * 0.48, 0); context.lineTo(-s * 0.48, s * 0.35); context.moveTo(s * 0.48, 0); context.lineTo(s * 0.48, s * 0.35);
    } else if (key.includes("cat")) {
      context.moveTo(-s * 0.46, -s * 0.12); context.lineTo(-s * 0.42, -s * 0.52); context.lineTo(-s * 0.12, -s * 0.3); context.lineTo(s * 0.16, -s * 0.3); context.lineTo(s * 0.44, -s * 0.52); context.lineTo(s * 0.46, -s * 0.08); context.arc(0, 0, s * 0.46, 0, Math.PI); context.closePath();
    } else if (key.includes("heart") || key.includes("message")) {
      context.moveTo(0, s * 0.52); context.lineTo(-s * 0.5, 0); context.arc(-s * 0.25, -s * 0.18, s * 0.25, Math.PI, 0); context.arc(s * 0.25, -s * 0.18, s * 0.25, Math.PI, 0); context.closePath();
    } else if (key.includes("sun")) {
      context.arc(0, 0, s * 0.28, 0, Math.PI * 2); for (let i = 0; i < 8; i += 1) { const a = i * Math.PI / 4; context.moveTo(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42); context.lineTo(Math.cos(a) * s * 0.62, Math.sin(a) * s * 0.62); }
    } else if (key.includes("gift")) {
      context.moveTo(-s * 0.5, -s * 0.18); context.lineTo(s * 0.5, -s * 0.18); context.lineTo(s * 0.42, s * 0.48); context.lineTo(-s * 0.42, s * 0.48); context.closePath(); context.moveTo(0, -s * 0.48); context.lineTo(0, s * 0.48); context.moveTo(-s * 0.5, 0); context.lineTo(s * 0.5, 0);
    } else if (key.includes("umbrella")) {
      context.arc(0, 0, s * 0.56, Math.PI, 0); context.moveTo(0, 0); context.lineTo(0, s * 0.48); context.arc(s * 0.14, s * 0.48, s * 0.14, Math.PI, 0);
    } else if (key.includes("home") || key.includes("key")) {
      context.moveTo(-s * 0.52, -s * 0.02); context.lineTo(0, -s * 0.5); context.lineTo(s * 0.52, -s * 0.02); context.lineTo(s * 0.38, -s * 0.02); context.lineTo(s * 0.38, s * 0.5); context.lineTo(-s * 0.38, s * 0.5); context.lineTo(-s * 0.38, -s * 0.02); context.closePath();
    } else {
      for (let i = 0; i < 10; i += 1) { const a = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 ? s * 0.22 : s * 0.54; const px = Math.cos(a) * r; const py = Math.sin(a) * r; if (i === 0) context.moveTo(px, py); else context.lineTo(px, py); } context.closePath();
    }
    context.fill();
    context.stroke();
    context.restore();
  }

  function drawTinyCouple(x, y, color, timestamp, walking = false) {
    const step = walking ? Math.sin(timestamp * 0.008) * 2.2 : 0;
    context.save();
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 2.2;
    context.shadowColor = color;
    context.shadowBlur = 6;
    [[-7, step], [7, -step]].forEach(([offset, leg]) => {
      context.beginPath(); context.arc(x + offset, y - 13, 3.4, 0, Math.PI * 2); context.fill();
      context.beginPath(); context.moveTo(x + offset, y - 9); context.lineTo(x + offset, y + 4); context.lineTo(x + offset - 3, y + 12 + leg); context.moveTo(x + offset, y + 4); context.lineTo(x + offset + 3, y + 12 - leg); context.stroke();
    });
    context.beginPath(); context.moveTo(x - 3, y - 4); context.lineTo(x + 3, y - 4); context.stroke();
    context.restore();
  }

  function drawSceneArchitecture(zone, timestamp) {
    const x = zone.x;
    const y = zone.y;
    const glow = 0.34 + zone.reveal * 0.66;
    context.save();
    context.globalAlpha = glow;
    context.strokeStyle = zone.color;
    context.fillStyle = colorWithAlpha(zone.color, 0.12 + zone.reveal * 0.1);
    context.lineWidth = 2;
    context.shadowColor = zone.color;
    context.shadowBlur = zone.pulse > 0.04 ? zone.pulse * 18 : 0;
    if (zone.drawType === "corner-store") {
      context.fillRect(x - 62, y - 42, 124, 78); context.strokeRect?.(x - 62, y - 42, 124, 78);
      for (let i = 0; i < 5; i += 1) context.fillRect(x - 58 + i * 24, y - 54, 14, 10);
      context.fillStyle = colorWithAlpha("#f6d99b", 0.18 + zone.reveal * 0.3); context.fillRect(x - 48, y - 25, 42, 48); context.fillRect(x + 9, y - 25, 39, 25);
    } else if (zone.drawType === "coffee-window") {
      context.fillRect(x - 58, y - 45, 116, 84); context.strokeRect?.(x - 58, y - 45, 116, 84);
      context.beginPath(); context.moveTo(x, y - 45); context.lineTo(x, y + 39); context.moveTo(x - 58, y - 5); context.lineTo(x + 58, y - 5); context.stroke();
      drawMotifGlyph("coffee", x - 20, y + 12, 18, 0.84); drawMotifGlyph("coffee", x + 22, y + 12, 18, 0.84);
    } else if (zone.drawType === "late-cinema") {
      context.fillRect(x - 62, y - 38, 124, 72); context.strokeRect?.(x - 62, y - 38, 124, 72);
      context.fillStyle = colorWithAlpha("#f4e6c6", 0.14 + zone.reveal * 0.24); context.fillRect(x - 48, y - 24, 96, 32);
      for (let i = 0; i < 6; i += 1) { context.beginPath(); context.arc(x - 45 + i * 18, y + 23, 2.2, 0, Math.PI * 2); context.fill(); }
    } else if (zone.drawType === "river-walk") {
      for (let row = 0; row < 3; row += 1) { context.beginPath(); for (let i = 0; i < 7; i += 1) { const px = x - 62 + i * 21; const py = y + 11 + row * 11 + Math.sin(timestamp * 0.002 + i) * 3; if (i === 0) context.moveTo(px, py); else context.lineTo(px, py); } context.stroke(); }
      context.beginPath(); context.moveTo(x - 38, y - 5); context.lineTo(x + 38, y - 5); context.moveTo(x - 28, y - 5); context.lineTo(x - 34, y + 13); context.moveTo(x + 28, y - 5); context.lineTo(x + 34, y + 13); context.stroke();
    } else if (zone.drawType === "last-train") {
      context.beginPath(); context.moveTo(x - 67, y - 37); context.lineTo(x + 67, y - 37); context.lineTo(x + 51, y - 18); context.lineTo(x - 51, y - 18); context.closePath(); context.fill(); context.stroke();
      context.fillRect(x - 61, y - 10, 122, 38); context.strokeRect?.(x - 61, y - 10, 122, 38);
      const trainLight = ((timestamp * 0.05) % 90) - 45; context.fillStyle = colorWithAlpha("#f5dfa8", 0.5); context.fillRect(x + trainLight, y - 2, 20, 13);
    } else {
      context.beginPath(); context.moveTo(x - 68, y + 35); context.lineTo(x + 68, y + 35); context.stroke();
      [-45, 42].forEach((offset) => { context.fillRect(x + offset - 18, y - 28, 36, 62); context.strokeRect?.(x + offset - 18, y - 28, 36, 62); context.fillStyle = colorWithAlpha("#f6dc9a", 0.18 + zone.reveal * 0.34); context.fillRect(x + offset - 10, y - 16, 9, 13); context.fillRect(x + offset + 5, y + 3, 9, 13); });
      drawMotifGlyph("lamp", x, y - 3, 27, 0.82);
    }
    if (zone.motifs.some((motif) => String(motif).includes("rain"))) {
      context.save();
      context.globalAlpha = 0.24 + zone.reveal * 0.28;
      context.strokeStyle = "#bde3e5";
      context.lineWidth = 1;
      for (let index = 0; index < 8; index += 1) {
        const offset = (index * 23 + timestamp * 0.018) % 150 - 75;
        context.beginPath(); context.moveTo(x + offset, y - 66); context.lineTo(x + offset - 8, y - 43); context.stroke();
      }
      context.restore();
    }
    if (zone.motifs.some((motif) => String(motif).includes("camera"))) {
      context.save();
      context.globalAlpha = 0.14 + (Math.sin(timestamp * 0.006) + 1) * 0.08;
      context.fillStyle = "#fff8df";
      context.beginPath(); context.arc(x, y, 34, 0, Math.PI * 2); context.fill();
      context.restore();
    }
    if (zone.motifs.some((motif) => String(motif).includes("cat"))) {
      const catX = x - 42 + (timestamp * 0.018 + zone.visits * 17) % 84;
      drawMotifGlyph("cat", catX, y + 40, 10, 0.46 + zone.reveal * 0.28);
    }
    if (zone.motifs.some((motif) => String(motif).includes("sunset"))) {
      context.save();
      context.globalAlpha = 0.1 + zone.reveal * 0.12;
      context.fillStyle = "#ef9b7f";
      context.beginPath(); context.arc(x, y - 22, 58, Math.PI, Math.PI * 2); context.fill();
      context.restore();
    }
    zone.motifs.slice(-3).forEach((motif, index) => {
      drawMotifGlyph(motif, x - 28 + index * 28, y + 58, 12, 0.5 + zone.reveal * 0.42);
    });
    if (dateMapState.bestStreak >= 3 && zone.visits) drawTinyCouple(x, y - 66, "#ffe6b2", timestamp, dateMapState.activeStreak >= 3);
    context.restore();
  }

  function colorWithAlpha(color, alpha) {
    if (!color?.startsWith("#")) return color || `rgba(255,255,255,${alpha})`;
    const hex = color.slice(1);
    const expanded = hex.length === 3 ? hex.split("").map((value) => value + value).join("") : hex;
    const number = Number.parseInt(expanded, 16);
    return `rgba(${number >> 16 & 255},${number >> 8 & 255},${number & 255},${alpha})`;
  }

  function colorChannels(color) {
    const hex = String(color || "#000000").replace("#", "");
    const expanded = hex.length === 3 ? hex.split("").map((value) => value + value).join("") : hex;
    const number = Number.parseInt(expanded, 16) || 0;
    return [number >> 16 & 255, number >> 8 & 255, number & 255];
  }

  function smoothStep(edge0, edge1, value) {
    const ratio = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
    return ratio * ratio * (3 - 2 * ratio);
  }

  function createWaterSurface() {
    const surfaceCanvas = document.createElement("canvas");
    surfaceCanvas.width = WATER_GRID_WIDTH;
    surfaceCanvas.height = WATER_GRID_HEIGHT;
    const surfaceContext = typeof surfaceCanvas.getContext === "function"
      ? surfaceCanvas.getContext("2d", { alpha: false })
      : null;
    const imageData = surfaceContext && typeof surfaceContext.createImageData === "function"
      ? surfaceContext.createImageData(WATER_GRID_WIDTH, WATER_GRID_HEIGHT)
      : null;
    if (imageData) {
      for (let offset = 3; offset < imageData.data.length; offset += 4) imageData.data[offset] = 255;
    }
    return {
      width: WATER_GRID_WIDTH,
      height: WATER_GRID_HEIGHT,
      current: new Float32Array(WATER_GRID_WIDTH * WATER_GRID_HEIGHT),
      previous: new Float32Array(WATER_GRID_WIDTH * WATER_GRID_HEIGHT),
      next: new Float32Array(WATER_GRID_WIDTH * WATER_GRID_HEIGHT),
      pigment: new Float32Array(WATER_GRID_WIDTH * WATER_GRID_HEIGHT),
      pigmentNext: new Float32Array(WATER_GRID_WIDTH * WATER_GRID_HEIGHT),
      canvas: surfaceCanvas,
      context: surfaceContext,
      imageData,
      renderable: Boolean(surfaceContext && imageData),
      accumulatorMs: 0,
      stepCount: 0,
      energy: 0,
      lastBlackEightImpulse: -1
    };
  }

  function resetWaterSurface() {
    if (!waterSurface) {
      waterSurface = createWaterSurface();
      return;
    }
    waterSurface.current.fill(0);
    waterSurface.previous.fill(0);
    waterSurface.next.fill(0);
    waterSurface.pigment.fill(0);
    waterSurface.pigmentNext.fill(0);
    waterSurface.accumulatorMs = 0;
    waterSurface.stepCount = 0;
    waterSurface.energy = 0;
    waterSurface.lastBlackEightImpulse = -1;
    const centerX = TABLE.left + (TABLE.right - TABLE.left) * 0.5;
    const centerY = TABLE.top + (TABLE.bottom - TABLE.top) * 0.56;
    disturbWaterWorld(centerX, centerY, 0.14, 84);
  }

  function waterGridPoint(worldX, worldY) {
    return {
      x: clamp((worldX - TABLE.left) / (TABLE.right - TABLE.left) * (waterSurface.width - 1), 1, waterSurface.width - 2),
      y: clamp((worldY - TABLE.top) / (TABLE.bottom - TABLE.top) * (waterSurface.height - 1), 1, waterSurface.height - 2)
    };
  }

  function disturbWaterWorld(worldX, worldY, amplitude = 0.6, radiusWorld = 22) {
    const material = activeSurfaceMaterial();
    const materialAmplitude = amplitude * material.disturbance;
    const materialRadius = radiusWorld * material.radius;
    if (!waterSurface || worldX < TABLE.left - materialRadius || worldX > TABLE.right + materialRadius
      || worldY < TABLE.top - materialRadius || worldY > TABLE.bottom + materialRadius) return;
    waterSurface.energy = Math.max(waterSurface.energy, Math.min(1, Math.abs(materialAmplitude) * 0.55));
    dateMapState.waterEnergy = Math.max(dateMapState.waterEnergy || 0, waterSurface.energy);
    dateMapFrameDirty = true;
    if (!waterSurface.renderable) return;
    const point = waterGridPoint(worldX, worldY);
    const cellScale = ((TABLE.right - TABLE.left) / waterSurface.width
      + (TABLE.bottom - TABLE.top) / waterSurface.height) / 2;
    const radius = clamp(materialRadius / Math.max(1, cellScale), 1.25, 18);
    const minX = Math.max(1, Math.floor(point.x - radius));
    const maxX = Math.min(waterSurface.width - 2, Math.ceil(point.x + radius));
    const minY = Math.max(1, Math.floor(point.y - radius));
    const maxY = Math.min(waterSurface.height - 2, Math.ceil(point.y + radius));
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const distanceRatio = Math.hypot(x - point.x, y - point.y) / radius;
        if (distanceRatio >= 1) continue;
        const falloff = 0.5 + Math.cos(distanceRatio * Math.PI) * 0.5;
        const index = y * waterSurface.width + x;
        waterSurface.current[index] = clamp(
          waterSurface.current[index] + materialAmplitude * falloff,
          -WATER_MAX_HEIGHT,
          WATER_MAX_HEIGHT
        );
        if (material.id === "ink") {
          waterSurface.pigment[index] = clamp(
            waterSurface.pigment[index] + Math.abs(materialAmplitude) * falloff * 0.9,
            0,
            1
          );
        }
      }
    }
  }

  function depositRollingWaterWake(ball, data, dx, dy, travel) {
    if (!waterSurface || travel < 0.18 || ball.speed < 0.12) return;
    const effectId = dateMapState.activeEffect?.id || "ripple";
    const profiles = {
      ripple: { amplitude: 0.54, radius: 27, tail: 2, spread: 0.9 },
      comet: { amplitude: 0.72, radius: 17, tail: 4, spread: 1.25 },
      prism: { amplitude: 0.48, radius: 20, tail: 3, spread: 1.5 },
      pulse: { amplitude: 0.65, radius: 24, tail: 2, spread: 1.1 },
      lightning: { amplitude: 0.82, radius: 13, tail: 4, spread: 1.8 },
      aurora: { amplitude: 0.44, radius: 32, tail: 3, spread: 1.2 }
    };
    const profile = profiles[effectId] || profiles.ripple;
    const material = activeSurfaceMaterial();
    const direction = normalize({ x: dx, y: dy }, { x: 0, y: -1 });
    const normal = { x: -direction.y, y: direction.x };
    const speedRatio = clamp(ball.speed / 24, 0.12, 1);
    const amplitude = profile.amplitude * material.wake * (0.22 + speedRatio * 0.78);
    const tailCount = Math.max(1, Math.round(profile.tail * material.tail));
    disturbWaterWorld(ball.position.x, ball.position.y, amplitude, profile.radius);
    for (let step = 1; step <= tailCount; step += 1) {
      const tailDistance = step * (8 + speedRatio * 11);
      const side = Math.sin((waterSurface.stepCount + step * 7 + data.number * 13) * 0.31)
        * profile.spread * step;
      disturbWaterWorld(
        ball.position.x - direction.x * tailDistance + normal.x * side,
        ball.position.y - direction.y * tailDistance + normal.y * side,
        -amplitude * (0.36 / step),
        profile.radius * (0.72 + step * 0.08)
      );
    }
  }

  function stepWaterSimulation() {
    if (!waterSurface?.renderable) return;
    const { width, height, current, previous, next, pigment, pigmentNext } = waterSurface;
    const material = activeSurfaceMaterial();
    const damping = material.damping || WATER_DAMPING;
    let energy = 0;
    for (let y = 1; y < height - 1; y += 1) {
      const row = y * width;
      for (let x = 1; x < width - 1; x += 1) {
        const index = row + x;
        const neighborAverage = (current[index - 1] + current[index + 1]
          + current[index - width] + current[index + width]) * 0.5;
        const value = clamp((neighborAverage - previous[index]) * damping, -WATER_MAX_HEIGHT, WATER_MAX_HEIGHT);
        next[index] = value;
        if (material.id === "ink") {
          const pigmentAverage = (pigment[index - 1] + pigment[index + 1]
            + pigment[index - width] + pigment[index + width]) * 0.25;
          pigmentNext[index] = clamp(pigment[index] * 0.942 + pigmentAverage * 0.055, 0, 1);
        }
        energy += Math.abs(value);
      }
    }
    waterSurface.previous = current;
    waterSurface.current = next;
    waterSurface.next = previous;
    waterSurface.next.fill(0);
    if (material.id === "ink") {
      waterSurface.pigment = pigmentNext;
      waterSurface.pigmentNext = pigment;
      waterSurface.pigmentNext.fill(0);
    }
    waterSurface.stepCount += 1;
    waterSurface.energy = clamp(energy / (width * height * 0.34), 0, 1);
    dateMapState.waterEnergy = waterSurface.energy;
  }

  function advanceWaterSurface(deltaMs) {
    if (!waterSurface) return;
    if (!waterSurface.renderable) {
      waterSurface.energy *= 0.985;
      dateMapState.waterEnergy = waterSurface.energy;
      return;
    }
    waterSurface.accumulatorMs += deltaMs;
    while (waterSurface.accumulatorMs >= WATER_STEP_MS) {
      waterSurface.accumulatorMs -= WATER_STEP_MS;
      if (dateMapState.blackEightBlast) {
        const blast = dateMapState.blackEightBlast;
        const phase = Math.floor(blast.ageMs / 105);
        if (phase !== waterSurface.lastBlackEightImpulse) {
          waterSurface.lastBlackEightImpulse = phase;
          const progress = clamp(blast.ageMs / blast.duration, 0, 1);
          const sweep = phase * 2.399963;
          const radius = 34 + progress * 270;
          disturbWaterWorld(
            WORLD.width / 2 + Math.cos(sweep) * radius * 0.58,
            WORLD.height / 2 + Math.sin(sweep) * radius,
            progress < 0.24 ? -1.1 : 0.78 + Math.sin(phase) * 0.2,
            34 + progress * 36
          );
        }
      }
      stepWaterSimulation();
    }
  }

  function waterThemeTransitionMix(timestamp, gridX, gridY, heightValue, transitionState) {
    if (!transitionState) return 1;
    const dx = (gridX - transitionState.origin.x) / waterSurface.width;
    const dy = (gridY - transitionState.origin.y) / waterSurface.height;
    const distanceFromOrigin = Math.hypot(dx, dy);
    const turbulentEdge = Math.sin(gridX * 0.17 + gridY * 0.071 + timestamp * 0.0011) * 0.028
      + Math.sin(gridY * 0.13 - timestamp * 0.0008) * 0.018
      + heightValue * 0.012;
    return smoothStep(distanceFromOrigin - 0.12, distanceFromOrigin + 0.08,
      transitionState.progress * 1.34 + turbulentEdge);
  }

  function renderWaterSurface(timestamp) {
    const theme = dateMapState.activeTheme || BALL_CHROMA_THEMES[0];
    const previousTheme = dateMapState.previousTheme || theme;
    const width = TABLE.right - TABLE.left;
    const height = TABLE.bottom - TABLE.top;
    if (!waterSurface?.context || !waterSurface.imageData || typeof waterSurface.context.putImageData !== "function") {
      const fallback = context.createLinearGradient(TABLE.left, TABLE.top, TABLE.right, TABLE.bottom);
      fallback.addColorStop(0, theme.deep);
      fallback.addColorStop(0.46, colorWithAlpha(theme.primary, 0.62));
      fallback.addColorStop(1, theme.deep);
      context.fillStyle = fallback;
      context.fillRect(TABLE.left, TABLE.top, width, height);
      return;
    }
    const current = waterSurface.current;
    const pigment = waterSurface.pigment;
    const pixels = waterSurface.imageData.data;
    const targetDeep = colorChannels(theme.deep);
    const targetPrimary = colorChannels(theme.primary);
    const targetSecondary = colorChannels(theme.secondary);
    const sourceDeep = colorChannels(previousTheme.deep);
    const sourcePrimary = colorChannels(previousTheme.primary);
    const sourceSecondary = colorChannels(previousTheme.secondary);
    const blast = dateMapState.blackEightBlast;
    const blastProgress = blast ? clamp(blast.ageMs / blast.duration, 0, 1) : 0;
    const spectralStrength = blast
      ? smoothStep(0.18, 0.46, blastProgress) * (1 - smoothStep(0.82, 1, blastProgress))
      : 0;
    const surfaceMaterial = activeSurfaceMaterial();
    const surfaceMaterialId = surfaceMaterial.id;
    const specularGain = blast ? 104 : 66;
    const transition = dateMapState.themeTransition;
    const transitionState = transition ? {
      progress: clamp((timestamp - transition.startedAt) / transition.duration, 0, 1),
      origin: waterGridPoint(transition.originX, transition.originY)
    } : null;
    const time = timestamp * 0.001;
    for (let y = 1; y < waterSurface.height - 1; y += 1) {
      const v = y / (waterSurface.height - 1);
      for (let x = 1; x < waterSurface.width - 1; x += 1) {
        const index = y * waterSurface.width + x;
        const offset = index * 4;
        const surfaceHeight = current[index];
        const gradientX = current[index + 1] - current[index - 1];
        const gradientY = current[index + waterSurface.width] - current[index - waterSurface.width];
        const microX = Math.sin(x * 0.37 + Math.sin(y * 0.061 - time * 0.74) * 2.1 + time * 1.26) * 0.032
          + Math.cos((x - y) * 0.093 - time * 0.81) * 0.018;
        const microY = Math.cos(y * 0.29 + Math.sin(x * 0.052 + time * 0.67) * 2.4 - time * 1.08) * 0.03
          + Math.sin((x + y) * 0.071 + time * 0.58) * 0.016;
        const waterGradientX = gradientX + microX;
        const waterGradientY = gradientY + microY;
        const slope = Math.hypot(waterGradientX, waterGradientY);
        const diffuse = clamp(0.46 - waterGradientX * 0.36 - waterGradientY * 0.18, 0.08, 0.94);
        const specular = Math.pow(clamp(0.78 - waterGradientX * 0.62 - waterGradientY * 0.28, 0, 1), 15);
        const flowA = Math.sin(x * 0.231 + Math.sin(y * 0.059 - time * 0.62) * 2.2 + time * 0.86);
        const flowB = Math.cos(y * 0.187 + Math.sin(x * 0.047 + time * 0.54) * 2.5 - time * 0.72);
        const flowC = Math.sin((x - y) * 0.113 + Math.sin((x + y) * 0.031 + time * 0.33) * 2.8);
        const causticField = 0.5 + (flowA * flowB * 0.68 + flowC * 0.32) * 0.5 + surfaceHeight * 0.055;
        const caustic = Math.pow(clamp(causticField, 0, 1), 11) * (0.16 + slope * 0.58);
        const mix = waterThemeTransitionMix(timestamp, x, y, surfaceHeight, transitionState);
        const deepR = sourceDeep[0] + (targetDeep[0] - sourceDeep[0]) * mix;
        const deepG = sourceDeep[1] + (targetDeep[1] - sourceDeep[1]) * mix;
        const deepB = sourceDeep[2] + (targetDeep[2] - sourceDeep[2]) * mix;
        const primaryR = sourcePrimary[0] + (targetPrimary[0] - sourcePrimary[0]) * mix;
        const primaryG = sourcePrimary[1] + (targetPrimary[1] - sourcePrimary[1]) * mix;
        const primaryB = sourcePrimary[2] + (targetPrimary[2] - sourcePrimary[2]) * mix;
        const secondaryR = sourceSecondary[0] + (targetSecondary[0] - sourceSecondary[0]) * mix;
        const secondaryG = sourceSecondary[1] + (targetSecondary[1] - sourceSecondary[1]) * mix;
        const secondaryB = sourceSecondary[2] + (targetSecondary[2] - sourceSecondary[2]) * mix;
        const depthShade = clamp(0.38 + diffuse * 0.42 + surfaceHeight * 0.035, 0.18, 0.82);
        const edgeShade = 1 - Math.pow(Math.abs(v - 0.5) * 1.42, 2) * 0.2;
        const spectralPhase = x * 0.083 + y * 0.039
          + Math.sin(y * 0.043 - time * 0.5) * 2.1
          + Math.sin(x * 0.031 + time * 0.42) * 1.7
          + time * 1.45 + surfaceHeight;
        const eclipse = blast ? 1 - smoothStep(0, 0.2, blastProgress) * 0.5 + smoothStep(0.7, 0.84, blastProgress) * 0.45 : 1;
        const themedRed = (deepR * 0.72 + primaryR * 0.18 + secondaryR * 0.05) * depthShade * edgeShade;
        const themedGreen = (deepG * 0.72 + primaryG * 0.18 + secondaryG * 0.05) * depthShade * edgeShade;
        const themedBlue = (deepB * 0.72 + primaryB * 0.18 + secondaryB * 0.05) * depthShade * edgeShade;
        let red;
        let green;
        let blue;

        if (surfaceMaterialId === "ink") {
          const paperFiber = Math.sin(x * 1.31 + y * 0.17) * 1.8 + Math.sin(y * 0.83 - x * 0.09) * 1.1;
          const pigmentValue = pigment[index];
          const pigmentGradient = Math.abs(pigment[index + 1] - pigment[index - 1])
            + Math.abs(pigment[index + waterSurface.width] - pigment[index - waterSurface.width]);
          const inkFlow = clamp(pigmentValue * (0.88 + flowC * 0.08)
            + Math.abs(surfaceHeight) * 0.022, 0, 1);
          const inkBody = smoothStep(0.012, 0.5, inkFlow);
          const dryBrush = clamp(pigmentGradient * 2.8 + slope * pigmentValue * 0.24, 0, 1);
          const paper = 218 + paperFiber;
          const inkTone = paper - inkBody * 198 - dryBrush * 34;
          const wetEdge = specular * (8 + inkBody * 18) + pigmentGradient * 32;
          red = inkTone + wetEdge;
          green = inkTone - 2 + wetEdge;
          blue = inkTone - 6 + wetEdge * 0.82;
        } else if (surfaceMaterialId === "mercury") {
          const environmentBand = 0.5 + Math.sin(v * 4.2 + flowA * 2.1 + flowB * 1.35
            + flowC * 0.72 + surfaceHeight * 1.45 + time * 0.28) * 0.5;
          const chrome = Math.pow(Math.abs(environmentBand - 0.5) * 2, 3.2);
          const metal = 12 + diffuse * 24 + specular * 174 + chrome * 82 + caustic * 25;
          red = metal + primaryR * 0.055 + secondaryR * 0.025;
          green = metal * 1.04 + primaryG * 0.065 + secondaryG * 0.03;
          blue = metal * 1.1 + primaryB * 0.08 + secondaryB * 0.04;
        } else if (surfaceMaterialId === "silk") {
          const weavePhase = y * 0.017 + Math.sin(x * 0.019 + time * 0.18) * 1.15
            + flowA * 0.24 + flowB * 0.13 - time * 0.13;
          const anisotropic = clamp(0.5 - waterGradientY * 0.72 - waterGradientX * 0.2
            + Math.sin(weavePhase) * 0.16, 0, 1);
          const sheen = smoothStep(0.56, 0.91, anisotropic);
          const reverseSheen = smoothStep(0.61, 0.94, 1 - anisotropic);
          const pearlR = 10 + Math.sin(weavePhase) * 8;
          const pearlG = 10 + Math.sin(weavePhase + 2.094) * 8;
          const pearlB = 10 + Math.sin(weavePhase + 4.188) * 8;
          red = themedRed * 0.9 + primaryR * sheen * 0.3 + secondaryR * reverseSheen * 0.13 + pearlR + specular * 38;
          green = themedGreen * 0.9 + primaryG * sheen * 0.3 + secondaryG * reverseSheen * 0.13 + pearlG + specular * 42;
          blue = themedBlue * 0.94 + primaryB * sheen * 0.34 + secondaryB * reverseSheen * 0.16 + pearlB + specular * 52;
        } else if (surfaceMaterialId === "plasma") {
          const plasmaCell = clamp(0.5 + flowA * 0.24 + flowB * 0.16 + flowC * 0.1 + surfaceHeight * 0.075, 0, 1);
          const charge = clamp(Math.pow(plasmaCell, 2.6) + slope * 0.52 + Math.abs(surfaceHeight) * 0.055, 0, 1);
          const hotCore = Math.pow(clamp(charge, 0, 1), 3.2) * 104;
          red = themedRed * 0.7 + primaryR * charge * 0.52 + secondaryR * (1 - plasmaCell) * 0.19 + hotCore;
          green = themedGreen * 0.67 + primaryG * charge * 0.48 + secondaryG * (1 - plasmaCell) * 0.17 + hotCore * 1.08;
          blue = themedBlue * 0.82 + primaryB * charge * 0.62 + secondaryB * (1 - plasmaCell) * 0.24 + hotCore * 1.22;
        } else if (surfaceMaterialId === "frost") {
          const crystal = Math.abs(flowA * 0.5 + flowB * 0.31 + flowC * 0.19 + surfaceHeight * 0.05);
          const facet = Math.pow(clamp(crystal, 0, 1), 7.4);
          const iceEdge = clamp(slope * 0.86 + Math.abs(surfaceHeight) * 0.085, 0, 1);
          red = 19 + themedRed * 0.28 + diffuse * 26 + facet * 52 + iceEdge * 75 + specular * 112;
          green = 31 + themedGreen * 0.3 + diffuse * 31 + facet * 62 + iceEdge * 88 + specular * 128;
          blue = 46 + themedBlue * 0.34 + diffuse * 38 + facet * 78 + iceEdge * 108 + specular * 148;
        } else {
          red = themedRed + specular * specularGain + caustic * 48;
          green = themedGreen + specular * (specularGain + 10) + caustic * 54;
          blue = themedBlue + specular * (specularGain + 22) + caustic * 64;
        }

        const materialSpectralStrength = surfaceMaterialId === "ink" ? 0 : spectralStrength;
        const monochromeBlast = surfaceMaterialId === "ink" ? spectralStrength * 34 : 0;
        pixels[offset] = clamp(red * eclipse + materialSpectralStrength * (22 + Math.sin(spectralPhase) * 18) + monochromeBlast, 0, 255);
        pixels[offset + 1] = clamp(green * eclipse + materialSpectralStrength * (22 + Math.sin(spectralPhase + 2.094) * 18) + monochromeBlast, 0, 255);
        pixels[offset + 2] = clamp(blue * eclipse + materialSpectralStrength * (22 + Math.sin(spectralPhase + 4.188) * 18) + monochromeBlast, 0, 255);
        pixels[offset + 3] = 255;
      }
    }
    waterSurface.context.putImageData(waterSurface.imageData, 0, 0);
    context.save();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(waterSurface.canvas, TABLE.left, TABLE.top, width, height);
    const reflectedLight = context.createLinearGradient(TABLE.left, TABLE.top, TABLE.right, TABLE.bottom);
    if (surfaceMaterialId === "ink") {
      reflectedLight.addColorStop(0, "rgba(255,255,248,0.16)");
      reflectedLight.addColorStop(0.28, "rgba(255,255,248,0)");
      reflectedLight.addColorStop(0.74, "rgba(0,0,0,0.035)");
      reflectedLight.addColorStop(1, "rgba(0,0,0,0.17)");
    } else if (surfaceMaterialId === "mercury") {
      reflectedLight.addColorStop(0, "rgba(255,255,255,0.18)");
      reflectedLight.addColorStop(0.16, "rgba(255,255,255,0.015)");
      reflectedLight.addColorStop(0.52, "rgba(190,230,240,0.07)");
      reflectedLight.addColorStop(1, "rgba(0,0,0,0.38)");
    } else if (surfaceMaterialId === "silk") {
      reflectedLight.addColorStop(0, colorWithAlpha(theme.accent, 0.13));
      reflectedLight.addColorStop(0.34, "rgba(255,255,255,0.025)");
      reflectedLight.addColorStop(0.72, colorWithAlpha(theme.secondary, 0.09));
      reflectedLight.addColorStop(1, "rgba(0,0,0,0.26)");
    } else if (surfaceMaterialId === "plasma") {
      reflectedLight.addColorStop(0, colorWithAlpha(theme.glow, 0.1));
      reflectedLight.addColorStop(0.26, colorWithAlpha(theme.primary, 0.035));
      reflectedLight.addColorStop(0.7, colorWithAlpha(theme.secondary, 0.12));
      reflectedLight.addColorStop(1, "rgba(0,0,0,0.3)");
    } else if (surfaceMaterialId === "frost") {
      reflectedLight.addColorStop(0, "rgba(245,255,255,0.18)");
      reflectedLight.addColorStop(0.22, "rgba(205,245,255,0.025)");
      reflectedLight.addColorStop(0.76, "rgba(126,205,232,0.07)");
      reflectedLight.addColorStop(1, "rgba(3,20,31,0.28)");
    } else {
      reflectedLight.addColorStop(0, "rgba(255,255,255,0.08)");
      reflectedLight.addColorStop(0.18, "rgba(255,255,255,0)");
      reflectedLight.addColorStop(0.7, colorWithAlpha(theme.secondary, 0.055));
      reflectedLight.addColorStop(1, "rgba(0,0,0,0.24)");
    }
    context.fillStyle = reflectedLight;
    context.fillRect(TABLE.left, TABLE.top, width, height);
    context.restore();
  }

  function railBounds() {
    return {
      left: TABLE.left - RAIL_LED_INSET,
      right: TABLE.right + RAIL_LED_INSET,
      top: TABLE.top - RAIL_LED_INSET,
      bottom: TABLE.bottom + RAIL_LED_INSET
    };
  }

  function railPerimeterLength() {
    const bounds = railBounds();
    return 2 * ((bounds.right - bounds.left) + (bounds.bottom - bounds.top));
  }

  function railDistanceForContact(x, y) {
    const bounds = railBounds();
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    const candidates = [
      { distance: Math.abs(y - bounds.top), value: clamp(x - bounds.left, 0, width) },
      { distance: Math.abs(x - bounds.right), value: width + clamp(y - bounds.top, 0, height) },
      { distance: Math.abs(y - bounds.bottom), value: width + height + clamp(bounds.right - x, 0, width) },
      { distance: Math.abs(x - bounds.left), value: width * 2 + height + clamp(bounds.bottom - y, 0, height) }
    ];
    candidates.sort((left, right) => left.distance - right.distance);
    return candidates[0].value;
  }

  function railPositionFromDistance(distanceAlongRail) {
    const bounds = railBounds();
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    const perimeter = 2 * (width + height);
    let distance = ((distanceAlongRail % perimeter) + perimeter) % perimeter;
    if (distance <= width) return { x: bounds.left + distance, y: bounds.top, nx: 0, ny: 1 };
    distance -= width;
    if (distance <= height) return { x: bounds.right, y: bounds.top + distance, nx: -1, ny: 0 };
    distance -= height;
    if (distance <= width) return { x: bounds.right - distance, y: bounds.bottom, nx: 0, ny: -1 };
    distance -= width;
    return { x: bounds.left, y: bounds.bottom - distance, nx: 1, ny: 0 };
  }

  function circularRailDistance(left, right, perimeter = railPerimeterLength()) {
    const direct = Math.abs(left - right) % perimeter;
    return Math.min(direct, perimeter - direct);
  }

  function drawRailLightStrip(timestamp) {
    const perimeter = railPerimeterLength();
    const segmentLength = perimeter / RAIL_LED_SEGMENTS;
    const theme = dateMapState.activeTheme || BALL_CHROMA_THEMES[0];
    const effect = dateMapState.activeEffect || POCKET_VFX_PROFILES["top-left"];
    const surface = activeSurfaceMaterial();
    const monochromeSurface = surface.id === "ink" || surface.id === "mercury" || surface.id === "frost";
    const baseColor = colorChannels(monochromeSurface ? surface.rail : theme.primary);
    const secondaryColor = colorChannels(effect.secondary);
    const blast = dateMapState.blackEightBlast;
    const blastProgress = blast ? clamp(blast.ageMs / blast.duration, 0, 1) : 0;
    let peak = 0;
    context.save();
    context.lineCap = "round";
    context.globalCompositeOperation = "source-over";
    context.strokeStyle = "rgba(1, 4, 9, 0.92)";
    context.lineWidth = 11;
    roundRectPath(context, TABLE.left - RAIL_LED_INSET, TABLE.top - RAIL_LED_INSET,
      TABLE.right - TABLE.left + RAIL_LED_INSET * 2, TABLE.bottom - TABLE.top + RAIL_LED_INSET * 2, 7);
    context.stroke();
    for (let index = 0; index < RAIL_LED_SEGMENTS; index += 1) {
      const centerDistance = (index + 0.5) * segmentLength;
      let brightness = blast ? 0.012 : 0.052 + Math.min(4, dateMapState.activeStreak) * 0.012;
      let red = baseColor[0];
      let green = baseColor[1];
      let blue = baseColor[2];
      if (surface.id === "plasma") {
        brightness += Math.max(0, Math.sin(timestamp * 0.012 + index * 1.71)) * 0.026;
      } else if (surface.id === "frost") {
        brightness += Math.max(0, Math.sin(timestamp * 0.0022 + index * 0.43)) * 0.014;
      }
      dateMapState.railBursts.forEach((wave) => {
        const ageSeconds = wave.ageMs / 1000;
        const front = wave.speed * ageSeconds;
        const clockwise = circularRailDistance(centerDistance, wave.originS + front, perimeter);
        const counterClockwise = circularRailDistance(centerDistance, wave.originS - front, perimeter);
        const distanceToFront = Math.min(clockwise, counterClockwise);
        const waveShape = Math.pow(clamp(1 - distanceToFront / wave.width, 0, 1), 2);
        const waveLife = clamp(1 - wave.ageMs / wave.duration, 0, 1);
        const contribution = waveShape * waveLife * (0.42 + wave.intensity * 0.72);
        if (contribution > brightness) {
          red = wave.rgb[0];
          green = wave.rgb[1];
          blue = wave.rgb[2];
        }
        brightness += contribution;
      });
      if (blast) {
        const pocketIndex = Math.floor(blastProgress * 7.5);
        const nearestPocketIndex = POCKETS.reduce((best, pocket, pocketPosition) => {
          const pocketDistance = circularRailDistance(centerDistance, railDistanceForContact(pocket.x, pocket.y), perimeter);
          return pocketDistance < best.distance ? { distance: pocketDistance, index: pocketPosition } : best;
        }, { distance: Infinity, index: 0 }).index;
        const pocketIgnition = smoothStep(nearestPocketIndex / 8, nearestPocketIndex / 8 + 0.1, blastProgress);
        const chase = smoothStep(0.18, 0.36, blastProgress) * (1 - smoothStep(0.78, 0.92, blastProgress));
        const chaseFront = (timestamp * 0.8 + blastProgress * perimeter * 2.4) % perimeter;
        const chaseDistance = Math.min(
          circularRailDistance(centerDistance, chaseFront, perimeter),
          circularRailDistance(centerDistance, perimeter - chaseFront, perimeter)
        );
        const chaseWave = Math.pow(clamp(1 - chaseDistance / 150, 0, 1), 2) * chase;
        const climax = smoothStep(0.68, 0.82, blastProgress) * (1 - smoothStep(0.9, 1, blastProgress));
        brightness += pocketIgnition * 0.16 + chaseWave * 1.18 + climax * 0.88;
        const spectral = centerDistance / perimeter * Math.PI * 2 + blastProgress * 15 + pocketIndex * 0.2;
        if (surface.id === "ink") {
          const inkFlash = 154 + Math.sin(spectral * 1.7) * 96;
          red = inkFlash;
          green = inkFlash;
          blue = inkFlash - 5;
        } else {
          red = 132 + Math.sin(spectral) * 110;
          green = 132 + Math.sin(spectral + 2.094) * 110;
          blue = 132 + Math.sin(spectral + 4.188) * 110;
        }
      }
      brightness = clamp(brightness, 0, 1);
      peak = Math.max(peak, brightness);
      const from = railPositionFromDistance(index * segmentLength + segmentLength * 0.12);
      const to = railPositionFromDistance((index + 1) * segmentLength - segmentLength * 0.12);
      const color = `rgb(${Math.round(clamp(red, 0, 255))},${Math.round(clamp(green, 0, 255))},${Math.round(clamp(blue, 0, 255))})`;
      if (brightness > 0.32) {
        context.globalAlpha = brightness * 0.22;
        context.strokeStyle = color;
        context.lineWidth = 10 + brightness * 4;
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
      }
      context.globalAlpha = 0.14 + brightness * 0.86;
      context.strokeStyle = color;
      context.lineWidth = 1.7 + brightness * 2.6;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
    }
    dateMapState.railWavePeak = peak;
    context.restore();
  }

  function drawPocketLightPorts(timestamp) {
    const blast = dateMapState.blackEightBlast;
    const surface = activeSurfaceMaterial();
    const blastProgress = blast ? clamp(blast.ageMs / blast.duration, 0, 1) : 0;
    context.save();
    context.globalCompositeOperation = "screen";
    POCKETS.forEach((pocket, pocketIndex) => {
      const profile = POCKET_VFX_PROFILES[pocket.id];
      const active = dateMapState.activeEffect?.pocketId === pocket.id;
      const ignition = blast ? smoothStep(pocketIndex / 8, pocketIndex / 8 + 0.1, blastProgress) : 0;
      const flare = dateMapState.pocketFlares.reduce((peak, item) => item.pocketId === pocket.id ? Math.max(peak, item.life) : peak, 0);
      const level = clamp(0.12 + (active ? 0.22 : 0) + flare * 0.66 + ignition * 0.8, 0, 1);
      const radius = POCKET_RADIUS + 5.5;
      const channels = surface.id === "ink"
        ? ["#fafaf3", "#777a78", "#d9d9d2"]
        : surface.id === "mercury" || surface.id === "frost"
          ? [surface.rail, "#7d98a2", "#ffffff"]
          : [profile.primary, profile.secondary, dateMapState.activeTheme?.primary || "#ffffff"];
      for (let segment = 0; segment < 18; segment += 1) {
        const start = segment / 18 * Math.PI * 2 + timestamp * (active ? 0.00016 : 0.00004);
        const end = start + Math.PI * 2 / 18 * 0.72;
        const shimmer = 0.64 + Math.sin(timestamp * 0.004 + segment * 0.91 + pocketIndex) * 0.36;
        context.globalAlpha = level * (0.34 + shimmer * 0.66);
        context.strokeStyle = channels[(segment + pocketIndex) % channels.length];
        context.lineWidth = 1.6 + level * 2.4;
        context.beginPath();
        context.arc(pocket.x, pocket.y, radius, start, end);
        context.stroke();
      }
      if (flare > 0.02) {
        const glowRadius = 48 + (1 - flare) * 92;
        const glow = context.createRadialGradient(pocket.x, pocket.y, POCKET_RADIUS * 0.45, pocket.x, pocket.y, glowRadius);
        const flarePrimary = surface.id === "ink" ? "#f7f7ef" : surface.id === "mercury" || surface.id === "frost" ? surface.rail : profile.primary;
        const flareSecondary = surface.id === "ink" ? "#6f706e" : surface.id === "mercury" || surface.id === "frost" ? "#7897a5" : profile.secondary;
        glow.addColorStop(0, colorWithAlpha(flarePrimary, flare * 0.34));
        glow.addColorStop(0.42, colorWithAlpha(flareSecondary, flare * 0.12));
        glow.addColorStop(1, colorWithAlpha(flareSecondary, 0));
        context.globalAlpha = 1;
        context.fillStyle = glow;
        context.fillRect(pocket.x - glowRadius, pocket.y - glowRadius, glowRadius * 2, glowRadius * 2);
      }
    });
    context.restore();
  }

  function pointAlongDateRoute(path, ratio) {
    if (!path?.length) return null;
    if (path.length === 1) return { ...path[0], dx: 0, dy: -1 };
    const spans = [];
    let total = 0;
    for (let index = 1; index < path.length; index += 1) {
      const from = path[index - 1];
      const to = path[index];
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      spans.push({ from, to, length });
      total += length;
    }
    if (total <= 0.001) return { ...path[0], dx: 0, dy: -1 };
    let remaining = clamp(ratio, 0, 1) * total;
    for (const span of spans) {
      if (remaining <= span.length || span === spans.at(-1)) {
        const local = span.length > 0 ? clamp(remaining / span.length, 0, 1) : 0;
        return {
          x: span.from.x + (span.to.x - span.from.x) * local,
          y: span.from.y + (span.to.y - span.from.y) * local,
          dx: (span.to.x - span.from.x) / Math.max(span.length, 0.001),
          dy: (span.to.y - span.from.y) / Math.max(span.length, 0.001)
        };
      }
      remaining -= span.length;
    }
    return { ...path.at(-1), dx: 0, dy: -1 };
  }

  function drawDateRouteSparkle(x, y, size, alpha, color, prominent = false) {
    context.save();
    context.globalAlpha = alpha;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = prominent ? 1.15 : 0.72;
    if (prominent) {
      context.shadowColor = color;
      context.shadowBlur = size * 2.4;
    }
    context.beginPath();
    context.moveTo(x - size, y);
    context.quadraticCurveTo(x, y - size * 0.12, x + size, y);
    context.moveTo(x, y - size);
    context.quadraticCurveTo(x + size * 0.12, y, x, y + size);
    context.stroke();
    context.beginPath();
    context.arc(x, y, prominent ? 1.5 : 0.8, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawDateRoute(route, timestamp, finalBoost = 0) {
    if (!route.path?.length) return;
    const moving = dateMapState.flow > 0 || finalBoost > 0;
    context.save();
    context.globalCompositeOperation = "screen";
    const seed = Number(route.number || 1) * 1.73 + Number(route.pocketIndex || 0) * 2.31;
    const starCount = Math.min(18, 10 + route.path.length * 2 + (route.railHits ? 2 : 0));
    const baseSize = route.archetype === "power" ? 2.9 : route.archetype === "gentle" ? 1.65 : 2.2;
    for (let index = 0; index < starCount; index += 1) {
      const ratio = (index + 0.52) / starCount;
      const point = pointAlongDateRoute(route.path, ratio);
      if (!point) continue;
      const phase = seed + index * 2.399;
      const sway = Math.sin(phase) * (3.2 + index % 3 * 1.35);
      const drift = Math.cos(phase * 0.71) * 2.1;
      const x = point.x - point.dy * sway + point.dx * drift;
      const y = point.y + point.dx * sway + point.dy * drift;
      const twinkle = 0.58 + Math.sin(timestamp * 0.0032 + phase) * 0.28;
      const alpha = (0.16 + route.glow * 0.12 + finalBoost * 0.24) * twinkle;
      const color = index % 4 === 0 ? "#ffe4b4" : index % 3 === 0 ? "#ffd7e5" : route.color;
      drawDateRouteSparkle(x, y, baseSize + (index % 5 === 0 ? 1.25 : 0), alpha, color, index % 5 === 0);
    }
    if (moving) {
      const progress = (timestamp * (0.00022 + dateMapState.activeStreak * 0.000025)) % 1;
      const point = pointAlongDateRoute(route.path, progress);
      const glint = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, 22);
      glint.addColorStop(0, `rgba(255, 245, 216, ${0.42 + finalBoost * 0.34})`);
      glint.addColorStop(0.22, `rgba(255, 210, 226, ${0.18 + finalBoost * 0.18})`);
      glint.addColorStop(1, "rgba(255, 218, 231, 0)");
      context.fillStyle = glint;
      context.fillRect(point.x - 24, point.y - 24, 48, 48);
      drawDateRouteSparkle(point.x, point.y, 6.2, 0.72 + finalBoost * 0.2, "#fff0c8", true);
    }
    context.restore();
  }

  function drawDateConnections(timestamp) {
    if (dateMapState.bestStreak < 2 && !dateMapState.completed) return;
    dateMapState.links.forEach((link, index) => {
      const from = dateMapState.zones.get(link.from);
      const to = dateMapState.zones.get(link.to);
      if (!from || !to) return;
      const middle = { x: (from.x + to.x) / 2 + (index % 2 ? 28 : -28), y: (from.y + to.y) / 2 };
      context.save();
      context.globalCompositeOperation = "screen";
      context.globalAlpha = dateMapState.flow ? 0.12 : 0.055;
      context.strokeStyle = link.color;
      context.shadowColor = link.color;
      context.shadowBlur = 8;
      context.lineWidth = dateMapState.activeStreak >= 4 ? 2.8 : 1.8;
      context.lineCap = "round";
      context.setLineDash([1.5, dateMapState.activeStreak >= 4 ? 7 : 10]);
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.quadraticCurveTo(middle.x, middle.y, to.x, to.y);
      context.stroke();
      context.restore();
    });
  }

  function drawCueJourney() {
    if (!dateMapState.cueStops.length) return;
    context.save();
    dateMapState.cueStops.forEach((point) => {
      const radius = point.successful ? 24 : 15;
      const pool = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
      pool.addColorStop(0, point.successful ? "rgba(255, 231, 174, 0.18)" : "rgba(176, 205, 197, 0.08)");
      pool.addColorStop(1, "rgba(255, 239, 201, 0)");
      context.fillStyle = pool;
      context.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
    });
    context.restore();
  }

  function drawFinalDateShape(timestamp) {
    if (!dateMapState.ending || dateMapState.finalProgress <= 0) return;
    const progress = clamp(dateMapState.finalProgress, 0, 1);
    if (!dateMapState.completed) {
      context.save();
      context.globalCompositeOperation = "screen";
      context.globalAlpha = 0.14 + progress * 0.34;
      context.strokeStyle = "#94b4c4";
      context.shadowColor = "#6f96aa";
      context.shadowBlur = 10;
      context.lineWidth = 2.4;
      tracePoints([
        { x: WORLD.width / 2, y: 700 },
        { x: WORLD.width / 2 - 38, y: 820 },
        { x: WORLD.width / 2 - 150, y: 1000 },
        { x: TABLE.left + 34, y: TABLE.bottom - 40 }
      ]);
      context.stroke();
      tracePoints([
        { x: WORLD.width / 2, y: 700 },
        { x: WORLD.width / 2 + 38, y: 820 },
        { x: WORLD.width / 2 + 150, y: 1000 },
        { x: TABLE.right - 34, y: TABLE.bottom - 40 }
      ]);
      context.stroke();
      context.restore();
      return;
    }
    const points = [];
    for (let index = 0; index <= 80; index += 1) {
      const t = index / 80 * Math.PI * 2;
      points.push({
        x: WORLD.width / 2 + Math.sin(t) ** 3 * 150,
        y: 760 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 15
      });
    }
    context.save();
    context.globalCompositeOperation = "screen";
    context.globalAlpha = 0.1 + progress * 0.68;
    context.strokeStyle = "#f3c891";
    context.shadowColor = "#ef9aa9";
    context.shadowBlur = 12 + progress * 22;
    context.lineWidth = 2.2 + progress * 2.4;
    context.setLineDash([Math.max(1, progress * 1150), 1150]);
    context.lineDashOffset = 0;
    tracePoints(points);
    context.stroke();
    context.restore();
    drawTinyCouple(WORLD.width / 2, 940, "#fff0c8", timestamp, progress < 0.9);
  }

  function drawChromaThemeField(theme, timestamp, alpha = 1) {
    const width = TABLE.right - TABLE.left;
    const height = TABLE.bottom - TABLE.top;
    const drift = Math.sin(timestamp * 0.00042) * 0.08;
    context.save();
    context.globalAlpha = alpha;
    const field = context.createLinearGradient(
      TABLE.left + width * (0.08 + drift),
      TABLE.top,
      TABLE.right - width * (0.12 - drift),
      TABLE.bottom
    );
    field.addColorStop(0, theme.deep);
    field.addColorStop(0.28, colorWithAlpha(theme.primary, 0.86));
    field.addColorStop(0.56, colorWithAlpha(theme.deep, 0.96));
    field.addColorStop(0.82, colorWithAlpha(theme.secondary, 0.82));
    field.addColorStop(1, theme.deep);
    context.fillStyle = field;
    context.fillRect(TABLE.left, TABLE.top, width, height);

    context.globalCompositeOperation = "screen";
    [
      { x: 0.22, y: 0.2, radius: 0.46, color: theme.primary, phase: 0 },
      { x: 0.78, y: 0.52, radius: 0.5, color: theme.secondary, phase: 2.1 },
      { x: 0.34, y: 0.84, radius: 0.42, color: theme.accent, phase: 4.2 }
    ].forEach((source) => {
      const x = TABLE.left + width * (source.x + Math.sin(timestamp * 0.0003 + source.phase) * 0.04);
      const y = TABLE.top + height * (source.y + Math.cos(timestamp * 0.00026 + source.phase) * 0.025);
      const radius = width * source.radius;
      const glow = context.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, colorWithAlpha(source.color, 0.21));
      glow.addColorStop(0.45, colorWithAlpha(source.color, 0.075));
      glow.addColorStop(1, colorWithAlpha(source.color, 0));
      context.fillStyle = glow;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });
    context.restore();
  }

  function drawChromaCloth(timestamp) {
    const theme = dateMapState.activeTheme || BALL_CHROMA_THEMES[0];
    const transition = dateMapState.themeTransition;
    const progress = transition
      ? clamp((timestamp - transition.startedAt) / transition.duration, 0, 1)
      : 1;
    if (!transition || progress >= 0.999) {
      drawChromaThemeField(theme, timestamp, 0.92);
      return;
    }
    drawChromaThemeField(transition.from || BALL_CHROMA_THEMES[0], timestamp, 0.92);
    const eased = 1 - Math.pow(1 - progress, 3);
    const farthest = Math.max(
      Math.hypot(transition.originX - TABLE.left, transition.originY - TABLE.top),
      Math.hypot(transition.originX - TABLE.right, transition.originY - TABLE.top),
      Math.hypot(transition.originX - TABLE.left, transition.originY - TABLE.bottom),
      Math.hypot(transition.originX - TABLE.right, transition.originY - TABLE.bottom)
    );
    [1.16, 1.02, 0.88].forEach((scale, index) => {
      context.save();
      context.beginPath();
      context.arc(transition.originX, transition.originY, Math.max(4, farthest * eased * scale), 0, Math.PI * 2);
      context.clip();
      drawChromaThemeField(theme, timestamp + index * 61, [0.18, 0.42, 0.96][index]);
      context.restore();
    });
    context.save();
    context.globalCompositeOperation = "screen";
    context.strokeStyle = theme.glow;
    context.globalAlpha = (1 - progress) * 0.5;
    context.lineWidth = 2 + (1 - progress) * 8;
    context.shadowColor = theme.primary;
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(transition.originX, transition.originY, farthest * eased, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  function drawChromaPattern(timestamp) {
    const theme = dateMapState.activeTheme || BALL_CHROMA_THEMES[0];
    const baseId = theme.id.replace("-stripe", "");
    const width = TABLE.right - TABLE.left;
    const height = TABLE.bottom - TABLE.top;
    context.save();
    context.globalCompositeOperation = "screen";
    context.strokeStyle = colorWithAlpha(theme.accent, 0.13);
    context.fillStyle = colorWithAlpha(theme.primary, 0.06);
    context.lineWidth = 1.4;
    if (baseId === "solar" || baseId === "molten") {
      const centerX = TABLE.left + width * 0.46;
      const centerY = TABLE.top + height * 0.52;
      for (let index = 0; index < 11; index += 1) {
        context.globalAlpha = 0.24 + index * 0.025;
        context.beginPath();
        ellipsePath(context, centerX, centerY, 70 + index * 38, 120 + index * 58, Math.sin(timestamp * 0.00022) * 0.16, 0, Math.PI * 2);
        context.stroke();
      }
    } else if (baseId === "cobalt" || baseId === "pearl") {
      for (let row = 0; row < 13; row += 1) {
        const y = TABLE.top + height * (row + 0.5) / 13;
        context.beginPath();
        for (let step = 0; step <= 12; step += 1) {
          const x = TABLE.left + width * step / 12;
          const waveY = y + Math.sin(step * 0.8 + row * 0.72 + timestamp * 0.0012) * (9 + row % 3 * 4);
          if (step === 0) context.moveTo(x, waveY); else context.lineTo(x, waveY);
        }
        context.stroke();
      }
    } else if (baseId === "crimson" || baseId === "ruby") {
      for (let index = 0; index < 9; index += 1) {
        const y = TABLE.top + height * (index + 1) / 10;
        context.beginPath();
        context.moveTo(TABLE.left, y);
        for (let step = 1; step <= 16; step += 1) {
          const x = TABLE.left + width * step / 16;
          const spike = step % 4 === 2 ? -22 : step % 4 === 3 ? 16 : 0;
          context.lineTo(x, y + spike + Math.sin(timestamp * 0.001 + index) * 5);
        }
        context.stroke();
      }
    } else if (baseId === "nebula") {
      const centerX = WORLD.width / 2;
      const centerY = WORLD.height / 2;
      for (let arm = 0; arm < 4; arm += 1) {
        context.beginPath();
        for (let step = 0; step <= 48; step += 1) {
          const ratio = step / 48;
          const angle = arm * Math.PI / 2 + ratio * Math.PI * 2.1 + timestamp * 0.00016;
          const radius = 20 + ratio * 330;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius * 1.75;
          if (step === 0) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.stroke();
      }
    } else if (baseId === "emerald") {
      for (let index = 0; index < 18; index += 1) {
        const x = TABLE.left + 35 + (index * 83) % Math.max(1, width - 70);
        const y = TABLE.top + 70 + (index * 137) % Math.max(1, height - 140);
        const radius = 18 + index % 4 * 12;
        context.globalAlpha = 0.32;
        context.beginPath();
        context.arc(x, y, radius + Math.sin(timestamp * 0.0015 + index) * 4, 0, Math.PI * 2);
        context.stroke();
      }
    } else if (baseId === "eclipse") {
      const centerX = WORLD.width / 2;
      const centerY = WORLD.height / 2;
      for (let index = 0; index < 8; index += 1) {
        context.globalAlpha = 0.2 + index * 0.025;
        context.beginPath();
        ellipsePath(context, centerX, centerY, 72 + index * 28, 118 + index * 46, timestamp * 0.00006 + index * 0.18, 0, Math.PI * 2);
        context.stroke();
      }
    }
    if (Number(dateMapState.activeBallNumber) > 8) {
      context.globalAlpha = 0.12;
      context.strokeStyle = "#ffffff";
      context.lineWidth = 18;
      for (let index = -3; index < 7; index += 1) {
        context.beginPath();
        context.moveTo(TABLE.left - 120, TABLE.top + index * 210 + (timestamp * 0.008 % 210));
        context.lineTo(TABLE.right + 120, TABLE.top + index * 210 + 320 + (timestamp * 0.008 % 210));
        context.stroke();
      }
    }
    context.restore();

    context.save();
    context.fillStyle = "rgba(1, 6, 12, 0.3)";
    context.fillRect(TABLE.left, TABLE.top, width, height);
    const vignette = context.createRadialGradient(WORLD.width / 2, WORLD.height / 2, 90, WORLD.width / 2, WORLD.height / 2, height * 0.58);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0.02)");
    vignette.addColorStop(0.62, "rgba(0, 0, 0, 0.08)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.5)");
    context.fillStyle = vignette;
    context.fillRect(TABLE.left, TABLE.top, width, height);
    context.restore();
  }

  function drawRollingChromaTrails(timestamp) {
    context.save();
    context.globalCompositeOperation = "screen";
    dateMapState.rollingTrails.forEach((trail, index) => {
      const alpha = clamp(trail.life, 0, 1) ** 1.35;
      if (alpha < 0.02) return;
      const dx = trail.x2 - trail.x1;
      const dy = trail.y2 - trail.y1;
      const length = Math.max(0.001, Math.hypot(dx, dy));
      const nx = -dy / length;
      const ny = dx / length;
      const wobble = Math.sin(index * 1.83 + trail.bornAt * 0.009) * 4.4;
      const midX = (trail.x1 + trail.x2) / 2 + nx * wobble;
      const midY = (trail.y1 + trail.y2) / 2 + ny * wobble;
      context.globalAlpha = alpha * 0.68;
      context.lineCap = "round";
      if (trail.effectId === "ripple") {
        const radius = 4 + (1 - alpha) * 25;
        context.strokeStyle = trail.color;
        context.lineWidth = 1.2 + alpha * 1.4;
        context.beginPath();
        ellipsePath(context, trail.x2, trail.y2, radius, radius * 0.46, Math.atan2(dy, dx), 0, Math.PI * 2);
        context.stroke();
      } else if (trail.effectId === "comet") {
        context.strokeStyle = trail.color;
        context.lineWidth = 1.2 + alpha * 4;
        context.beginPath();
        context.moveTo(trail.x1, trail.y1);
        context.quadraticCurveTo(midX, midY, trail.x2, trail.y2);
        context.stroke();
        if (index % 3 === 0) drawDateRouteSparkle(trail.x2 + nx * 5, trail.y2 + ny * 5, 2 + alpha * 3, alpha * 0.82, trail.secondary, true);
      } else if (trail.effectId === "prism") {
        [trail.color, trail.secondary, "#70e8ff"].forEach((color, channel) => {
          const offset = (channel - 1) * 3;
          context.strokeStyle = color;
          context.lineWidth = 1.1 + alpha;
          context.beginPath();
          context.moveTo(trail.x1 + nx * offset, trail.y1 + ny * offset);
          context.quadraticCurveTo(midX + nx * offset, midY + ny * offset, trail.x2 + nx * offset, trail.y2 + ny * offset);
          context.stroke();
        });
      } else if (trail.effectId === "pulse") {
        context.strokeStyle = trail.color;
        context.lineWidth = 1.3 + alpha * 1.6;
        context.setLineDash([5, 6]);
        context.lineDashOffset = -timestamp * 0.03;
        context.beginPath();
        context.arc(trail.x2, trail.y2, 5 + (1 - alpha) * 22, 0, Math.PI * 2);
        context.stroke();
        context.setLineDash([]);
      } else if (trail.effectId === "lightning") {
        context.strokeStyle = index % 2 ? trail.color : trail.secondary;
        context.lineWidth = 0.9 + alpha * 2.1;
        context.beginPath();
        context.moveTo(trail.x1, trail.y1);
        context.lineTo(midX + nx * 5, midY + ny * 5);
        context.lineTo(midX - nx * 3 + dx * 0.18, midY - ny * 3 + dy * 0.18);
        context.lineTo(trail.x2, trail.y2);
        context.stroke();
      } else {
        context.strokeStyle = trail.color;
        context.lineWidth = 2 + alpha * 3.4;
        context.beginPath();
        context.moveTo(trail.x1, trail.y1);
        bezierPath(context, midX + nx * 12, midY + ny * 12, midX - nx * 12, midY - ny * 12, trail.x2, trail.y2);
        context.stroke();
        context.globalAlpha *= 0.52;
        context.strokeStyle = trail.secondary;
        context.lineWidth = 1.1;
        context.stroke();
      }
    });
    context.restore();
  }

  function drawChromaRailBursts(timestamp) {
    context.save();
    context.globalCompositeOperation = "screen";
    dateMapState.railBursts.forEach((burst, index) => {
      const life = clamp(burst.life, 0, 1);
      const tangentX = -burst.normalY;
      const tangentY = burst.normalX;
      const radius = 8 + (1 - life) * (36 + burst.intensity * 22);
      context.globalAlpha = life * (0.34 + burst.intensity * 0.54);
      context.strokeStyle = burst.color;
      context.fillStyle = burst.secondary;
      context.lineWidth = 1 + burst.intensity * 3;
      if (burst.effectId === "ripple" || burst.effectId === "pulse") {
        context.setLineDash(burst.effectId === "pulse" ? [5, 5] : []);
        context.beginPath();
        ellipsePath(context, burst.x, burst.y, radius, radius * 0.38, Math.atan2(tangentY, tangentX), 0, Math.PI * 2);
        context.stroke();
        context.setLineDash([]);
      } else if (burst.effectId === "comet") {
        for (let ray = -3; ray <= 3; ray += 1) {
          context.beginPath();
          context.moveTo(burst.x, burst.y);
          context.lineTo(
            burst.x + tangentX * ray * 6 + burst.normalX * radius,
            burst.y + tangentY * ray * 6 + burst.normalY * radius
          );
          context.stroke();
        }
      } else if (burst.effectId === "prism") {
        [burst.color, burst.secondary, "#75eaff"].forEach((color, channel) => {
          context.strokeStyle = color;
          context.beginPath();
          context.moveTo(burst.x + tangentX * (channel - 1) * 5, burst.y + tangentY * (channel - 1) * 5);
          context.lineTo(burst.x + burst.normalX * radius + tangentX * (channel - 1) * 15, burst.y + burst.normalY * radius + tangentY * (channel - 1) * 15);
          context.stroke();
        });
      } else if (burst.effectId === "lightning") {
        context.beginPath();
        context.moveTo(burst.x - tangentX * 18, burst.y - tangentY * 18);
        context.lineTo(burst.x + burst.normalX * 7 + tangentX * 3, burst.y + burst.normalY * 7 + tangentY * 3);
        context.lineTo(burst.x - burst.normalX * 4 - tangentX * 2, burst.y - burst.normalY * 4 - tangentY * 2);
        context.lineTo(burst.x + tangentX * 20, burst.y + tangentY * 20);
        context.stroke();
      } else {
        context.beginPath();
        context.moveTo(burst.x - tangentX * 22, burst.y - tangentY * 22);
        bezierPath(context,
          burst.x + burst.normalX * radius + tangentX * 12,
          burst.y + burst.normalY * radius + tangentY * 12,
          burst.x + burst.normalX * radius - tangentX * 12,
          burst.y + burst.normalY * radius - tangentY * 12,
          burst.x + tangentX * 22,
          burst.y + tangentY * 22
        );
        context.stroke();
      }
      if (index % 2 === 0 && life > 0.5) drawDateRouteSparkle(burst.x, burst.y, 3 + burst.intensity * 4, life, burst.secondary, true);
    });
    context.restore();
  }

  function drawPocketGlyph(pocket, profile, timestamp, active) {
    const pulse = active ? 0.74 + Math.sin(timestamp * 0.006) * 0.18 : 0.22 + Math.sin(timestamp * 0.002 + POCKETS.indexOf(pocket)) * 0.05;
    const radius = POCKET_RADIUS + (active ? 13 : 9);
    context.save();
    context.translate(pocket.x, pocket.y);
    context.globalCompositeOperation = "screen";
    context.globalAlpha = pulse;
    context.strokeStyle = active ? profile.primary : colorWithAlpha(profile.primary, 0.66);
    context.fillStyle = profile.secondary;
    context.lineWidth = active ? 2.4 : 1.15;
    context.shadowColor = profile.secondary;
    context.shadowBlur = active ? 16 : 5;
    if (profile.id === "ripple") {
      [0.84, 1.08, 1.32].forEach((scale) => {
        context.beginPath();
        ellipsePath(context, 0, 0, radius * scale, radius * scale * 0.52, 0, 0, Math.PI * 2);
        context.stroke();
      });
    } else if (profile.id === "comet") {
      for (let ray = 0; ray < 12; ray += 1) {
        const angle = ray * Math.PI / 6 + timestamp * 0.00045;
        context.beginPath();
        context.moveTo(Math.cos(angle) * radius * 0.8, Math.sin(angle) * radius * 0.8);
        context.lineTo(Math.cos(angle) * radius * (1.14 + ray % 3 * 0.12), Math.sin(angle) * radius * (1.14 + ray % 3 * 0.12));
        context.stroke();
      }
    } else if (profile.id === "prism") {
      context.rotate(timestamp * 0.0003);
      [1, 1.24].forEach((scale) => {
        context.beginPath();
        for (let point = 0; point < 3; point += 1) {
          const angle = -Math.PI / 2 + point * Math.PI * 2 / 3;
          const x = Math.cos(angle) * radius * scale;
          const y = Math.sin(angle) * radius * scale;
          if (point === 0) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.closePath();
        context.stroke();
      });
    } else if (profile.id === "pulse") {
      context.setLineDash([8, 7]);
      context.lineDashOffset = -timestamp * 0.04;
      [0.94, 1.28].forEach((scale) => {
        context.beginPath();
        context.arc(0, 0, radius * scale, 0, Math.PI * 2);
        context.stroke();
      });
      context.setLineDash([]);
    } else if (profile.id === "lightning") {
      for (let bolt = 0; bolt < 8; bolt += 1) {
        const angle = bolt * Math.PI / 4;
        context.save();
        context.rotate(angle);
        context.beginPath();
        context.moveTo(radius * 0.72, 0);
        context.lineTo(radius * 0.94, -5);
        context.lineTo(radius * 1.02, 4);
        context.lineTo(radius * 1.34, 0);
        context.stroke();
        context.restore();
      }
    } else {
      for (let ribbon = 0; ribbon < 3; ribbon += 1) {
        context.rotate(Math.PI * 2 / 3);
        context.beginPath();
        context.moveTo(-radius * 0.9, 0);
        bezierPath(context, -radius * 0.3, -radius * 0.9, radius * 0.3, radius * 0.9, radius * 0.95, 0);
        context.stroke();
      }
    }
    context.restore();
  }

  function drawPocketVfx(timestamp) {
    POCKETS.forEach((pocket) => {
      const profile = POCKET_VFX_PROFILES[pocket.id];
      drawPocketGlyph(pocket, profile, timestamp, dateMapState.activeEffect?.pocketId === pocket.id);
    });
    context.save();
    context.globalCompositeOperation = "screen";
    dateMapState.pocketFlares.forEach((flare) => {
      const radius = 34 + (1 - flare.life) * 210;
      const glow = context.createRadialGradient(flare.x, flare.y, 0, flare.x, flare.y, radius);
      glow.addColorStop(0, colorWithAlpha(flare.color, flare.life * 0.5));
      glow.addColorStop(0.35, colorWithAlpha(flare.secondary, flare.life * 0.18));
      glow.addColorStop(1, colorWithAlpha(flare.secondary, 0));
      context.fillStyle = glow;
      context.fillRect(flare.x - radius, flare.y - radius, radius * 2, radius * 2);
    });
    context.restore();
  }

  function drawBlackEightBlast(timestamp) {
    const blast = dateMapState.blackEightBlast;
    if (!blast) return;
    const progress = clamp(blast.ageMs / blast.duration, 0, 1);
    const attack = clamp(progress / 0.12, 0, 1);
    const release = 1 - clamp((progress - 0.38) / 0.62, 0, 1);
    const intensity = attack * release;
    const inward = 1 - Math.pow(1 - clamp(progress / 0.11, 0, 1), 3);
    const x = blast.originX + (WORLD.width / 2 - blast.originX) * inward;
    const y = blast.originY + (WORLD.height / 2 - blast.originY) * inward;
    context.save();
    const voidRadius = 40 + attack * 520;
    const voidField = context.createRadialGradient(x, y, 0, x, y, voidRadius);
    voidField.addColorStop(0, `rgba(0, 0, 0, ${0.96 * intensity})`);
    voidField.addColorStop(0.36, `rgba(5, 3, 18, ${0.7 * intensity})`);
    voidField.addColorStop(0.7, `rgba(40, 8, 76, ${0.24 * intensity})`);
    voidField.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = voidField;
    context.fillRect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    context.globalCompositeOperation = "screen";
    const rainbow = ["#63e9ff", "#8d6bff", "#ff5ac8", "#ffbb4d", "#f4ff8c", "#63ffc6"];
    const coreRadius = 80 + attack * 420;
    const core = context.createRadialGradient(x, y, 0, x, y, coreRadius);
    core.addColorStop(0, `rgba(255, 255, 255, ${0.44 * intensity})`);
    core.addColorStop(0.06, `rgba(255, 230, 149, ${0.28 * intensity})`);
    core.addColorStop(0.2, `rgba(220, 101, 255, ${0.17 * intensity})`);
    core.addColorStop(0.54, `rgba(90, 201, 255, ${0.08 * intensity})`);
    core.addColorStop(1, "rgba(90, 201, 255, 0)");
    context.fillStyle = core;
    context.fillRect(x - coreRadius, y - coreRadius, coreRadius * 2, coreRadius * 2);
    [0.5, 0.76, 1].forEach((scale, index) => {
      const radius = (70 + attack * 620) * scale;
      context.globalAlpha = intensity * [0.72, 0.5, 0.32][index];
      context.strokeStyle = rainbow[(index + 1) % rainbow.length];
      context.lineWidth = 7 - index * 1.7;
      context.shadowColor = context.strokeStyle;
      context.shadowBlur = 8;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.stroke();
    });
    context.shadowBlur = 0;
    rainbow.forEach((color, index) => {
      const angle = index * Math.PI / 3 + progress * 1.8;
      const radius = 72 + attack * (210 + index * 24);
      context.globalAlpha = intensity * 0.82;
      context.strokeStyle = color;
      context.lineWidth = 2.4 + (1 - progress) * 5.6;
      context.shadowColor = color;
      context.shadowBlur = 16;
      context.beginPath();
      ellipsePath(context, x, y, radius, radius * 0.56, angle, 0, Math.PI * 2);
      context.stroke();
    });
    for (let ray = 0; ray < 18; ray += 1) {
      const angle = ray * Math.PI * 2 / 18 + Math.sin(ray * 2.3) * 0.08;
      const length = (250 + (ray % 5) * 92) * attack;
      context.globalAlpha = intensity * (0.36 + ray % 3 * 0.1);
      context.strokeStyle = rainbow[ray % rainbow.length];
      context.lineWidth = ray % 4 === 0 ? 3.2 : 1.2;
      context.beginPath();
      context.moveTo(x + Math.cos(angle) * 28, y + Math.sin(angle) * 28);
      context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      context.stroke();
    }
    for (let spark = 0; spark < 30; spark += 1) {
      const angle = spark * 2.399963 + progress * (spark % 3 ? 0.8 : -0.6);
      const radius = attack * (90 + (spark * 67) % 480);
      const size = spark % 7 === 0 ? 3.4 : 1.2 + spark % 3 * 0.6;
      context.globalAlpha = intensity * (0.28 + spark % 5 * 0.09);
      context.fillStyle = rainbow[spark % rainbow.length];
      context.beginPath();
      context.arc(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * 1.45, size, 0, Math.PI * 2);
      context.fill();
    }
    POCKETS.forEach((pocket, index) => {
      context.globalAlpha = intensity * 0.54;
      context.strokeStyle = rainbow[index];
      context.lineWidth = 2.8;
      context.setLineDash([3, 9]);
      context.lineDashOffset = -timestamp * 0.06;
      context.beginPath();
      context.moveTo(x, y);
      context.quadraticCurveTo(WORLD.width / 2 + (index % 2 ? 120 : -120), WORLD.height / 2 + (index - 2.5) * 36, pocket.x, pocket.y);
      context.stroke();
    });
    context.setLineDash([]);
    context.restore();
  }

  function drawBlackEightLedChoreography(timestamp) {
    drawRailLightStrip(timestamp);
    drawPocketLightPorts(timestamp);
  }

  function drawDateMap(timestamp) {
    const blackEightActive = Boolean(dateMapState.blackEightBlast);
    context.save();
    context.beginPath();
    context.moveTo(TABLE.left, TABLE.top);
    context.lineTo(TABLE.right, TABLE.top);
    context.lineTo(TABLE.right, TABLE.bottom);
    context.lineTo(TABLE.left, TABLE.bottom);
    context.closePath();
    context.clip();
    renderWaterSurface(timestamp);
    context.restore();
    if (blackEightActive) drawBlackEightLedChoreography(timestamp);
    else {
      drawRailLightStrip(timestamp);
      drawPocketLightPorts(timestamp);
    }
  }

  function ensureDateMapFrameCanvas() {
    if (dateMapFrameCanvas && dateMapFrameContext) return true;
    const cache = document.createElement("canvas");
    if (typeof cache.getContext !== "function") return false;
    cache.width = WORLD.width;
    cache.height = WORLD.height;
    const cacheContext = cache.getContext("2d", { alpha: true });
    if (!cacheContext) return false;
    dateMapFrameCanvas = cache;
    dateMapFrameContext = cacheContext;
    dateMapFrameDirty = true;
    return true;
  }

  function rebuildDateMapFrame(timestamp) {
    if (!ensureDateMapFrameCanvas()) return false;
    const liveContext = context;
    try {
      context = dateMapFrameContext;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, WORLD.width, WORLD.height);
      drawDateMap(timestamp);
    } finally {
      context = liveContext;
    }
    dateMapFrameUpdatedAt = timestamp;
    dateMapFrameDirty = false;
    return true;
  }

  function drawDateMapLayer(timestamp) {
    const refreshDue = !pointerAim && timestamp - dateMapFrameUpdatedAt >= DATE_MAP_REFRESH_MS;
    if ((dateMapFrameDirty || refreshDue || !dateMapFrameCanvas) && !rebuildDateMapFrame(timestamp)) {
      drawDateMap(timestamp);
      return;
    }
    context.drawImage(dateMapFrameCanvas, 0, 0, WORLD.width, WORLD.height);
  }

  function drawBall(ball, timestamp) {
    const data = bodyData(ball);
    if (!data || data.potted) return;
    const number = data.number;
    const pocketing = data.pocketing;
    const scale = pocketing?.scale ?? 1;
    const depth = pocketing?.depth ?? 0;
    const x = ball.position.x;
    const y = ball.position.y + depth * 13;
    const compression = data.compression;
    context.save();
    context.globalAlpha = 1 - depth * 0.52;
    context.translate(x, y);
    context.rotate(data.impactAngle);
    context.scale(1 - compression, 1 + compression * 0.52);
    context.rotate(-data.impactAngle);
    context.scale(scale, scale);
    context.shadowColor = "rgba(0, 0, 0, 0.52)";
    context.shadowBlur = 6 * (1 - depth * 0.6);
    context.shadowOffsetX = 3 * (1 - depth);
    context.shadowOffsetY = 5 + depth * 5;
    context.beginPath();
    context.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
    context.clip();
    context.rotate(data.rollAngle);
    if (number === 0) {
      const cueGradient = context.createRadialGradient(-5, -6, 1, 0, 0, BALL_RADIUS * 1.2);
      cueGradient.addColorStop(0, "#ffffff");
      cueGradient.addColorStop(0.58, "#eeeae0");
      cueGradient.addColorStop(1, "#89938d");
      context.fillStyle = cueGradient;
      context.fillRect(-BALL_RADIUS, -BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2);
      context.fillStyle = "rgba(136, 47, 48, 0.72)";
      context.beginPath();
      context.arc(0, -BALL_RADIUS * 0.62, 1.6, 0, Math.PI * 2);
      context.fill();
    } else {
      const color = BALL_COLORS[number];
      const stripe = number > 8;
      context.fillStyle = stripe ? "#f3eee1" : color;
      context.fillRect(-BALL_RADIUS * 1.5, -BALL_RADIUS * 1.5, BALL_RADIUS * 3, BALL_RADIUS * 3);
      if (stripe) {
        context.fillStyle = color;
        context.fillRect(-BALL_RADIUS * 1.5, -BALL_RADIUS * 0.48, BALL_RADIUS * 3, BALL_RADIUS * 0.96);
      }
      const shade = context.createRadialGradient(-5, -6, 1, 2, 3, BALL_RADIUS * 1.22);
      shade.addColorStop(0, "rgba(255,255,255,0.38)");
      shade.addColorStop(0.36, "rgba(255,255,255,0.02)");
      shade.addColorStop(1, "rgba(0,0,0,0.46)");
      context.fillStyle = shade;
      context.fillRect(-BALL_RADIUS, -BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2);
      drawMotifGlyph(motifForBall(number), 0, BALL_RADIUS * 0.62, 3.8, 0.72);
      context.fillStyle = "#f7f2e7";
      context.beginPath();
      context.arc(0, 0, 6.6, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#191c1c";
      context.font = "700 7.2px system-ui, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(number), 0, 0.4);
    }
    const highlight = context.createRadialGradient(-5.5, -6.2, 0.4, -5.5, -6.2, 5.2);
    highlight.addColorStop(0, "rgba(255,255,255,0.92)");
    highlight.addColorStop(0.36, "rgba(255,255,255,0.46)");
    highlight.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = highlight;
    context.beginPath();
    context.arc(-5.5, -6.2, 5.2, 0, Math.PI * 2);
    context.fill();
    context.restore();

    if (data.impactGlow > 0 && !pocketing) {
      context.save();
      context.globalAlpha = data.impactGlow;
      context.strokeStyle = number === 0 ? "#f7f2e7" : BALL_COLORS[number];
      context.lineWidth = 1.5 + data.impactGlow * 1.2;
      context.beginPath();
      context.arc(x, y, BALL_RADIUS + 3 + (1 - data.impactGlow) * 8, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }

    const available = number > 0 && !shotState && !pocketing && cachedAvailableTargets.has(number);
    if (number === selectedBallNumber || available) {
      const pulse = 0.5 + Math.sin(timestamp / 320 + number) * 0.5;
      context.save();
      context.strokeStyle = number === selectedBallNumber ? "rgba(244, 207, 125, 0.95)" : `rgba(126, 204, 185, ${0.38 + pulse * 0.25})`;
      context.lineWidth = number === selectedBallNumber ? 2.4 : 1.4;
      context.beginPath();
      context.arc(x, y, BALL_RADIUS + 5 + pulse * 2, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
  }

  function disableBallRenderer() {
    const failedRenderer = ballRenderer;
    const failedCanvas = ballRendererCanvas;
    ballRenderer = null;
    ballRendererCanvas = null;
    ballRendererFailed = true;
    if (failedCanvas?.style) failedCanvas.style.visibility = "hidden";
    try {
      failedRenderer?.dispose?.();
    } catch {
      // The 2D renderer remains available even if WebGL teardown also fails.
    }
  }

  function resizeBallRenderer() {
    if (!ballRenderer || !ballRendererCanvas) return false;
    try {
      const rect = ballRendererCanvas.getBoundingClientRect();
      const pixelRatio = Math.max(1, Math.min(renderScale, MAX_BALL_RENDER_SCALE));
      ballRenderer.resize(Math.max(1, rect.width), Math.max(1, rect.height), pixelRatio);
      if (ballRenderer.supported === false) throw new Error("BilliardsBallRenderer resize failed");
      ballRendererDirty = true;
      return true;
    } catch {
      disableBallRenderer();
      return false;
    }
  }

  function initializeBallRenderer() {
    const Renderer = window.BilliardsBallRenderer;
    const rendererCanvas = document.querySelector("#hb-ball-canvas");
    const factory = typeof Renderer?.create === "function" ? Renderer.create.bind(Renderer) : null;
    if ((!factory && typeof Renderer !== "function") || !rendererCanvas) return false;
    try {
      ballRendererCanvas = rendererCanvas;
      rendererCanvas.style.visibility = "visible";
      const options = {
        canvas: rendererCanvas,
        worldWidth: WORLD.width,
        worldHeight: WORLD.height,
        world: { ...WORLD },
        table: { ...TABLE },
        ballRadius: BALL_RADIUS,
        colors: BALL_COLORS,
        pixelRatio: Math.max(1, Math.min(renderScale, MAX_BALL_RENDER_SCALE))
      };
      ballRenderer = factory ? factory(options) : new Renderer(options);
      if (typeof ballRenderer?.resize !== "function"
          || typeof ballRenderer?.sync !== "function"
          || typeof ballRenderer?.render !== "function"
          || ballRenderer.supported === false) {
        throw new Error("BilliardsBallRenderer adapter is incomplete");
      }
      ballRendererDirty = true;
      return resizeBallRenderer();
    } catch {
      disableBallRenderer();
      return false;
    }
  }

  function syncBallRenderer(timestamp) {
    if (!ballRenderer) return false;
    const hasDynamicBall = Boolean(shotState || resolvingShot || balls.some((ball) => {
      const data = bodyData(ball);
      return data?.pocketing || data?.compression > 0.001 || data?.impactGlow > 0.01 || ball.speed > NATURAL_STOP_SPEED;
    }));
    if (!ballRendererDirty && !hasDynamicBall) return true;
    try {
      const renderBalls = balls
        .filter((ball) => !bodyData(ball)?.potted)
        .map((ball) => {
          const data = bodyData(ball);
          return {
            number: data.number,
            x: ball.position.x,
            y: ball.position.y,
            radius: BALL_RADIUS,
            color: data.number === 0 ? "#f5f0e7" : BALL_COLORS[data.number],
            striped: data.number > 8,
            rollAngle: data.rollAngle,
            rollHeading: data.rollHeading,
            scale: data.pocketing?.scale ?? 1,
            depth: data.pocketing?.depth ?? 0,
            compression: data.compression,
            impactAngle: data.impactAngle,
            impactGlow: data.impactGlow,
            selected: data.number === selectedBallNumber,
            available: data.number > 0 && !shotState && cachedAvailableTargets.has(data.number)
          };
        });
      ballRenderer.sync(renderBalls, {
        timestamp,
        world: WORLD,
        table: TABLE,
        ballRadius: BALL_RADIUS
      });
      if (ballRenderer.supported === false) {
        disableBallRenderer();
        return false;
      }
      const rendered = ballRenderer.render(timestamp);
      if (rendered === false || ballRenderer.supported === false) {
        disableBallRenderer();
        return false;
      }
      ballRendererDirty = false;
      return true;
    } catch {
      disableBallRenderer();
      return false;
    }
  }

  function drawAim() {
    if (!cueBall || shotState || resolvingShot || cinematicActive || resultVisible) return;
    const trace = traceAim();
    if (!trace) return;
    const contactNumber = bodyData(trace.hitBall)?.number;
    const correct = !runState.breakCompleted || (contactNumber && cachedAvailableTargets.has(contactNumber));
    if (aimAssist) {
      context.save();
      context.lineWidth = 1.35;
      context.setLineDash([8, 7]);
      context.strokeStyle = correct || !runState.breakCompleted ? "rgba(235, 210, 154, 0.78)" : "rgba(229, 119, 112, 0.62)";
      context.beginPath();
      context.moveTo(trace.origin.x, trace.origin.y);
      context.lineTo(trace.impact.x, trace.impact.y);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = context.strokeStyle;
      context.beginPath();
      context.arc(trace.impact.x, trace.impact.y, 3.2, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
    drawCueStick(trace.direction, pointerAim?.power || 0);
  }

  function drawCueStick(direction, power) {
    if (!cueBall) return;
    const back = { x: -direction.x, y: -direction.y };
    const startDistance = BALL_RADIUS + 9 + power * 44;
    const cueLength = 245;
    const start = { x: cueBall.position.x + back.x * startDistance, y: cueBall.position.y + back.y * startDistance };
    const end = { x: start.x + back.x * cueLength, y: start.y + back.y * cueLength };
    const gradient = context.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, "#e5d0a0");
    gradient.addColorStop(0.68, "#9a6239");
    gradient.addColorStop(1, "#35241c");
    context.save();
    context.strokeStyle = "rgba(0,0,0,0.38)";
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(start.x + 3, start.y + 4);
    context.lineTo(end.x + 3, end.y + 4);
    context.stroke();
    context.strokeStyle = gradient;
    context.lineWidth = 5.5;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    context.restore();
    if (pointerAim) drawCuePowerGauge(direction, pointerAim.pullRatio);
  }

  function drawCuePowerGauge(direction, pullRatio) {
    if (!cueBall) return;
    const colors = ["#d899ba", "#efc37f", "#ed6687"];
    const zoneBoundaries = [0, LIGHT_PULL_END, STRONG_PULL_START, 1];
    const center = cueBall.position;
    const radius = BALL_RADIUS + 22;
    const gapHalfAngle = Math.PI * 0.41;
    const backAngle = Math.atan2(direction.y, direction.x) + Math.PI;
    const arcStart = backAngle + gapHalfAngle;
    const arcSpan = Math.PI * 2 - gapHalfAngle * 2;
    const arcEnd = arcStart + arcSpan;
    const arcFraction = arcSpan / (Math.PI * 2);
    const activeRatio = clamp(pullRatio, 0, 1);
    const gradient = typeof context.createConicGradient === "function"
      ? context.createConicGradient(arcStart, center.x, center.y)
      : context.createLinearGradient(center.x - radius, center.y - radius, center.x + radius, center.y + radius);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(arcFraction * LIGHT_PULL_END, colors[0]);
    gradient.addColorStop(arcFraction * STRONG_PULL_START, colors[1]);
    gradient.addColorStop(arcFraction, colors[2]);
    gradient.addColorStop(1, colors[2]);
    context.save();
    context.lineCap = "round";
    context.globalAlpha = 0.15;
    context.shadowBlur = 0;
    context.strokeStyle = gradient;
    context.lineWidth = 1.35;
    context.beginPath();
    context.arc(center.x, center.y, radius, arcStart, arcEnd);
    context.stroke();

    zoneBoundaries.slice(1, -1).forEach((boundary) => {
      const angle = arcStart + arcSpan * boundary;
      const nodeX = center.x + Math.cos(angle) * radius;
      const nodeY = center.y + Math.sin(angle) * radius;
      context.globalAlpha = boundary <= activeRatio ? 0.82 : 0.34;
      context.fillStyle = boundary < STRONG_PULL_START ? colors[1] : colors[2];
      context.shadowColor = context.fillStyle;
      context.shadowBlur = boundary <= activeRatio ? 4 : 0;
      context.beginPath();
      context.arc(nodeX, nodeY, 1.35, 0, Math.PI * 2);
      context.fill();
    });

    if (activeRatio > 0) {
      const activeEndAngle = arcStart + arcSpan * activeRatio;
      const activeEndX = center.x + Math.cos(activeEndAngle) * radius;
      const activeEndY = center.y + Math.sin(activeEndAngle) * radius;
      const activeColor = activeRatio < LIGHT_PULL_END ? colors[0] : activeRatio < STRONG_PULL_START ? colors[1] : colors[2];
      context.strokeStyle = gradient;
      context.shadowColor = activeColor;
      context.lineCap = "round";
      context.shadowBlur = 2;
      const segmentCount = 32;
      for (let index = 0; index < segmentCount; index += 1) {
        const from = index / segmentCount;
        if (from >= activeRatio) break;
        const to = Math.min(activeRatio, (index + 1.15) / segmentCount);
        const relativeMidpoint = (from + to) / (2 * activeRatio);
        const profile = Math.sin(Math.PI * clamp(relativeMidpoint, 0, 1));
        context.globalAlpha = 0.76 + profile * 0.24;
        context.lineWidth = 2.4 + profile * 2.1;
        context.beginPath();
        context.arc(center.x, center.y, radius, arcStart + arcSpan * from, arcStart + arcSpan * to);
        context.stroke();
      }
      context.shadowBlur = 4;
      context.globalAlpha = 1;
      context.translate(activeEndX, activeEndY);
      context.rotate(activeEndAngle + Math.PI / 4);
      context.fillStyle = activeColor;
      context.strokeStyle = "rgba(255, 248, 231, 0.9)";
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(0, -3.6);
      context.lineTo(2.1, 0);
      context.lineTo(0, 3.6);
      context.lineTo(-2.1, 0);
      context.closePath();
      context.fill();
      context.stroke();
    }
    context.restore();
  }

  function drawEffects() {
    context.save();
    particles.forEach((particle) => {
      context.globalAlpha = particle.life;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
      context.fill();
    });
    pocketBursts.forEach((burst) => {
      context.globalAlpha = burst.life;
      context.strokeStyle = burst.color;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(burst.x, burst.y, 14 + (1 - burst.life) * 35, 0, Math.PI * 2);
      context.stroke();
    });
    collisionFeedbacks.forEach((feedback) => {
      context.globalAlpha = feedback.life * feedback.intensity;
      context.strokeStyle = feedback.color;
      context.lineWidth = 1.2 + feedback.life * 2.2;
      context.beginPath();
      context.arc(feedback.x, feedback.y, feedback.radius, 0, Math.PI * 2);
      context.stroke();
    });
    context.restore();
  }

  function draw(timestamp) {
    context.setTransform(canvas.width / WORLD.width, 0, 0, canvas.height / WORLD.height, 0, 0);
    context.clearRect(0, 0, WORLD.width, WORLD.height);
    context.save();
    if (screenShake > 0.08) context.translate(Math.sin(timestamp * 0.1) * screenShake, Math.cos(timestamp * 0.13) * screenShake * 0.55);
    drawTableLayer();
    drawDateMapLayer(timestamp);
    const renderedByBallRenderer = syncBallRenderer(timestamp);
    if (!renderedByBallRenderer) {
      balls.slice().sort((left, right) => left.position.y - right.position.y).forEach((ball) => drawBall(ball, timestamp));
    }
    drawAim();
    drawEffects();
    context.restore();
    if (screenFlash > 0.01) {
      context.save();
      context.globalAlpha = screenFlash;
      const flashTheme = dateMapState.activeTheme || BALL_CHROMA_THEMES[0];
      const flash = context.createRadialGradient(
        lastStoryWorldOrigin.x,
        lastStoryWorldOrigin.y,
        0,
        lastStoryWorldOrigin.x,
        lastStoryWorldOrigin.y,
        WORLD.height * 0.42
      );
      flash.addColorStop(0, colorWithAlpha(flashTheme.glow, 0.98));
      flash.addColorStop(0.12, colorWithAlpha(flashTheme.primary, 0.44));
      flash.addColorStop(0.42, colorWithAlpha(flashTheme.secondary, 0.12));
      flash.addColorStop(1, colorWithAlpha(flashTheme.secondary, 0));
      context.fillStyle = flash;
      context.fillRect(0, 0, WORLD.width, WORLD.height);
      context.restore();
    }
  }

  function physicsStep() {
    captureBallPositions();
    Engine.update(engine, FIXED_STEP);
    simulationTime += FIXED_STEP;
    updatePockets();
    updateRollingState();
    updatePocketing();
    containLooseBalls();
    settleBalls();
    updateEffects();
  }

  function frame(timestamp) {
    const delta = Math.min(50, Math.max(0, timestamp - lastFrameAt));
    lastFrameAt = timestamp;
    if (!cinematicActive && !resultVisible) {
      const storyTimeScale = timestamp < storySlowMotionUntil ? POCKET_STORY_TIME_SCALE : 1;
      accumulator += delta * storyTimeScale;
      let steps = 0;
      while (accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
        physicsStep();
        accumulator -= FIXED_STEP;
        steps += 1;
      }
      if (steps === MAX_STEPS_PER_FRAME) accumulator = 0;
    } else {
      accumulator = 0;
      updateEffects();
    }
    // The completed canvas remains visible without repainting beneath the result dock.
    if (!cinematicActive && !resultVisible) draw(timestamp);
    frameHandle = requestAnimationFrame(frame);
  }

  function impactBall(body, angle, relativeSpeed) {
    const data = bodyData(body);
    if (!data || data.potted || data.pocketing) return;
    data.impactAngle = angle;
    data.compression = Math.max(data.compression, clamp(relativeSpeed / 62, 0.025, 0.18));
    data.impactGlow = Math.max(data.impactGlow, clamp(relativeSpeed / 24, 0.18, 1));
  }

  Events.on(engine, "collisionStart", (event) => {
    if (!shotState) return;
    event.pairs.forEach(({ bodyA, bodyB, collision }) => {
      const dataA = bodyData(bodyA);
      const dataB = bodyData(bodyB);
      if (dataA && dataB) {
        const relative = collision?.details?.incidentSpeed
          ?? Math.hypot(bodyA.velocity.x - bodyB.velocity.x, bodyA.velocity.y - bodyB.velocity.y);
        const normal = collision?.normal || normalize({ x: bodyB.position.x - bodyA.position.x, y: bodyB.position.y - bodyA.position.y });
        impactBall(bodyA, Math.atan2(normal.y, normal.x), relative);
        impactBall(bodyB, Math.atan2(normal.y, normal.x) + Math.PI, relative);
        collisionCount += 1;
        audio.collision(relative);
        if (shotState.firstContact === null) {
          if (dataA.number === 0 && dataB.number > 0) shotState.firstContact = dataB.number;
          if (dataB.number === 0 && dataA.number > 0) shotState.firstContact = dataA.number;
        }
        if (dataA.number > 0 && dataB.number > 0) {
          const pair = [dataA.number, dataB.number].sort((left, right) => left - right).join(":");
          shotState.objectContactPairs.add(pair);
          shotState.objectContacts = shotState.objectContactPairs.size;
        }
        const contact = collision?.supports?.[0] || {
          x: (bodyA.position.x + bodyB.position.x) / 2,
          y: (bodyA.position.y + bodyB.position.y) / 2
        };
        collisionFeedbacks.push({
          x: contact.x,
          y: contact.y,
          radius: 4,
          speed: 2.4 + Math.min(3.6, relative * 0.08),
          life: 1,
          intensity: clamp(relative / 16, 0.3, 1),
          color: "#e8fff7"
        });
        if (collisionFeedbacks.length > 24) collisionFeedbacks.splice(0, collisionFeedbacks.length - 24);
        disturbWaterWorld(contact.x, contact.y, clamp(relative / 13, 0.28, 1.4), 18 + clamp(relative, 0, 24));
        spawnParticles(contact.x, contact.y, "#d9ede4", Math.min(4, Math.ceil(relative / 4)));
        screenShake = Math.max(screenShake, Math.min(2.8, relative * 0.06));
      }
      if (dataA && isRail(bodyB)) {
        dataA.shotRailHits += 1;
        if (bodyB.plugin.heartbeatRail.kind === "jaw") dataA.shotJawHits += 1;
        recordRailImpact(bodyA, bodyB, collision);
        const impactSpeed = collision?.details?.incidentSpeed ?? bodyA.speed;
        impactBall(bodyA, Math.atan2(-bodyA.velocity.y, -bodyA.velocity.x), impactSpeed);
        spawnChromaRailBurst(bodyA, bodyB, collision, impactSpeed);
        audio.rail(impactSpeed);
      }
      if (dataB && isRail(bodyA)) {
        dataB.shotRailHits += 1;
        if (bodyA.plugin.heartbeatRail.kind === "jaw") dataB.shotJawHits += 1;
        recordRailImpact(bodyB, bodyA, collision);
        const impactSpeed = collision?.details?.incidentSpeed ?? bodyB.speed;
        impactBall(bodyB, Math.atan2(-bodyB.velocity.y, -bodyB.velocity.x), impactSpeed);
        spawnChromaRailBurst(bodyB, bodyA, collision, impactSpeed);
        audio.rail(impactSpeed);
      }
    });
  });

  canvas.addEventListener("pointerdown", (event) => {
    audio.unlock();
    if (pointerAim && event.pointerId !== pointerAim.id) {
      event.preventDefault();
      strikeWithSecondPointer(event);
      return;
    }
    if (event.isPrimary === false) return;
    if (!canInteract()) return;
    event.preventDefault();
    const point = pointerToWorld(event);
    beginAim(event, point);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!pointerAim || event.pointerId !== pointerAim.id) return;
    event.preventDefault();
    updateAim(pointerToWorld(event));
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!pointerAim || event.pointerId !== pointerAim.id) return;
    event.preventDefault();
    updateAim(pointerToWorld(event));
    releaseAim(event, true);
  });

  canvas.addEventListener("pointercancel", (event) => releaseAim(event, false));
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  window.addEventListener("keydown", (event) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName)) return;
    if (event.key === "Escape") {
      if (surfaceMenuOpen) {
        event.preventDefault();
        setSurfaceMenuOpen(false);
        elements.surfaceToggle.focus();
        return;
      }
      if (cinematicActive) {
        event.preventDefault();
        closeCinematic();
      }
      return;
    }
    if (!canInteract()) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const angle = Math.atan2(aimDirection.y, aimDirection.x) + (event.key === "ArrowLeft" ? -0.035 : 0.035);
      aimDirection = { x: Math.cos(angle), y: Math.sin(angle) };
      return;
    }
    if (event.key === " " && !event.repeat) {
      event.preventDefault();
      shoot(aimDirection, 0.52);
    }
  });

  elements.sound.addEventListener("click", () => {
    audio.toggle();
    syncUI();
  });
  elements.surfaceToggle.addEventListener("click", () => {
    setSurfaceMenuOpen(!surfaceMenuOpen);
  });
  surfaceOptionNodes.forEach((node) => {
    node.addEventListener("click", () => {
      selectSurfaceMaterial(node.dataset.surfaceMaterial);
      canvas.focus({ preventScroll: true });
    });
  });
  elements.aimToggle.addEventListener("click", () => {
    aimAssist = !aimAssist;
    const settings = readStorage(SETTINGS_KEY, {});
    writeStorage(SETTINGS_KEY, { ...settings, aimAssist });
    syncUI();
  });
  elements.retry.addEventListener("click", () => {
    elements.result.hidden = true;
    resultVisible = false;
    resetGame();
    canvas.focus({ preventScroll: true });
  });
  elements.cinematicSkip.addEventListener("click", closeCinematic);
  elements.cinematicAction.addEventListener("click", closeCinematic);

  function resetFrameTiming() {
    accumulator = 0;
    lastFrameAt = performance.now();
  }

  document.addEventListener("visibilitychange", resetFrameTiming);
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) cancelAnimationFrame(frameHandle);
  });
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    cancelAnimationFrame(frameHandle);
    accumulator = 0;
    lastFrameAt = performance.now();
    resizeCanvas();
    frameHandle = requestAnimationFrame(frame);
  });

  configurePortraitSurface();
  initializeBallRenderer();
  buildRails();
  buildTimeline();
  rackBalls();
  if (coachSeen) elements.coach.classList.add("is-gone");
  syncUI();
  root.dataset.state = "break";
  frameHandle = requestAnimationFrame(frame);

  window.__heartbeatBilliardsDebug = Object.freeze({
    mapClientPoint(clientX, clientY, rect) {
      return Object.freeze(clientPointToWorld(clientX, clientY, rect));
    },
    powerForPullRatio(ratio) {
      return powerFromPullRatio(ratio);
    },
    classifyShot(shot) {
      return content.analyzeShot(shot || {});
    },
    orderPots(shot) {
      return Object.freeze(orderedPottedNumbers(shot || {}));
    },
    visibilityChange() {
      resetFrameTiming();
      return this.snapshot();
    },
    snapshot() {
      return Object.freeze({
        started: true,
        selectedBallNumber,
        runState,
        moving: Boolean(shotState),
        collisionCount,
        collisionFeedbackCount: collisionFeedbacks.length,
        shotPottedNumbers: Object.freeze([...(shotState?.pottedNumbers || [])]),
        shotTelemetry: shotState ? Object.freeze({
          launchPower: shotState.launchPower,
          launchSpeed: shotState.launchSpeed,
          launchDirection: Object.freeze({ ...shotState.launchDirection }),
          objectContacts: shotState.objectContacts,
          closestPocketDistance: shotState.closestPocketDistance,
          pottedDetails: Object.freeze(shotState.pottedDetails.map((detail) => Object.freeze({
            ...detail,
            path: Object.freeze(detail.path.map((point) => Object.freeze({ ...point })))
          })))
        }) : null,
        aim: pointerAim ? Object.freeze({
          start: Object.freeze({ ...pointerAim.start }),
          current: Object.freeze({ ...pointerAim.current }),
          direction: Object.freeze({ ...pointerAim.direction }),
          pointerType: pointerAim.pointerType,
          pullRatio: pointerAim.pullRatio,
          power: pointerAim.power
        }) : null,
        input: Object.freeze({
          minPull: MIN_PULL,
          maxPull: MAX_PULL,
          lightPullEnd: LIGHT_PULL_END,
          strongPullStart: STRONG_PULL_START,
          lightPowerMax: LIGHT_POWER_MAX,
          strongPowerMin: STRONG_POWER_MIN,
          secondPointerStrike: true,
          releaseStrike: true,
          minShotSpeed: MIN_SHOT_SPEED,
          maxShotSpeed: MAX_SHOT_SPEED
        }),
        presentation: Object.freeze({
          tableMomentActive,
          tableMomentArchetype: tableMomentCurrent?.archetype || null,
          tableMomentScene: elements.tableMomentScene.textContent || null,
          tableMomentTitle: elements.tableMomentTitle.textContent || null,
          storyTrailCount: storyTrails.length,
          dateMap: Object.freeze({
            litScenes: [...dateMapState.zones.values()].filter((zone) => zone.visits > 0).length,
            routes: dateMapState.routes.length,
            links: dateMapState.links.length,
            cueStops: dateMapState.cueStops.length,
            activeStreak: dateMapState.activeStreak,
            completed: dateMapState.completed,
            finalProgress: dateMapState.finalProgress,
            lastPocketId: dateMapState.lastPocketId,
            activeSceneId: dateMapState.activeScene?.sceneId || null,
            activeVariantIndex: dateMapState.activeScene?.variantIndex ?? null,
            activeStageNumber: dateMapState.activeScene?.stageNumber ?? null,
            sceneHistory: dateMapState.sceneHistory.length,
            activeBallNumber: dateMapState.activeBallNumber,
            activeThemeId: dateMapState.activeTheme?.id || null,
            activeThemeLabel: dateMapState.activeTheme?.label || null,
            activeEffectId: dateMapState.activeEffect?.id || null,
            rollingTrailCount: dateMapState.rollingTrails.length,
            railBurstCount: dateMapState.railBursts.length,
            railWaveCount: dateMapState.railBursts.length,
            railWavePeak: dateMapState.railWavePeak,
            pocketFlareCount: dateMapState.pocketFlares.length,
            waterGridWidth: waterSurface?.width || 0,
            waterGridHeight: waterSurface?.height || 0,
            waterEnergy: dateMapState.waterEnergy,
            waterRenderer: "height-field-caustics",
            surfaceMaterialId,
            surfaceMaterialLabel: activeSurfaceMaterial().label,
            surfaceMaterialCount: SURFACE_MATERIALS.length,
            surfaceTransitionTo: dateMapState.surfaceTransition?.to || null,
            blackEightBlast: Boolean(dateMapState.blackEightBlast),
            blackEightBlastLife: dateMapState.blackEightBlast?.life ?? 0,
            blackEightBlastDuration: dateMapState.blackEightBlast?.duration ?? 0,
            blackEightBlastAge: dateMapState.blackEightBlast
              ? dateMapState.blackEightBlast.ageMs
              : null,
            style: Object.freeze({ ...dateMapState.style })
          }),
          microVisible: !elements.micro.hidden,
          microQueued: microQueue.length,
          microType: elements.micro.dataset.type || null,
          microTitle: elements.microTitle.textContent || null,
          cinematicActive,
          cinematicQueued: cinematicQueue.length,
          nextCinematicStageId: cinematicQueue[0]?.stageId || null,
          cinematicStageId: cinematicCurrent?.stageId || null,
          cinematicTitle: cinematicCurrent?.title || null,
          cinematicImage: elements.cinematicImage.style.backgroundImage || null
        }),
        world: Object.freeze({ ...WORLD }),
        table: Object.freeze({ ...TABLE }),
        physics: Object.freeze({
          model: Physics.CONFIG.model,
          reference: Physics.CONFIG.reference,
          fixedStepMs: FIXED_STEP,
          fixedHz: FIXED_HZ,
          slidingFriction: Physics.CONFIG.slidingFriction,
          rollingFriction: Physics.CONFIG.rollingFriction,
          rollingSpeedDrag: Physics.CONFIG.rollingSpeedDrag,
          ballRestitution: Physics.CONFIG.ballRestitution,
          cushionRestitutionMin: Physics.CONFIG.cushionRestitutionMin,
          cushionRestitutionMax: Physics.CONFIG.cushionRestitutionMax,
          cushionFriction: Physics.CONFIG.cushionFriction,
          jawRestitution: Physics.CONFIG.jawRestitution,
          solverSubsteps: engine.metrics.substeps,
          pocketMouthDepthTolerance: POCKET_MOUTH_DEPTH_TOLERANCE,
          pocketShelfDepthTolerance: POCKET_SHELF_DEPTH_TOLERANCE,
          pocketLipSettleRatio: POCKET_LIP_SETTLE_RATIO,
          pocketVisualCaptureRatio: POCKET_VISUAL_CAPTURE_RATIO,
          pocketMagnetism: false
        }),
        audio: audio.snapshot(),
        wpaPocketSpec: Object.freeze({
          ballDiameter: BALL_DIAMETER,
          cornerMouth: CORNER_POCKET_MOUTH,
          sideMouth: SIDE_POCKET_MOUTH,
          cornerMouthRatio: CORNER_POCKET_MOUTH / BALL_DIAMETER,
          sideMouthRatio: SIDE_POCKET_MOUTH / BALL_DIAMETER,
          cornerShelf: CORNER_POCKET_SHELF,
          sideShelf: SIDE_POCKET_SHELF,
          cornerCutAngleDegrees: CORNER_CUT_ANGLE_DEGREES,
          sideCutAngleDegrees: SIDE_CUT_ANGLE_DEGREES
        }),
        pockets: Object.freeze(POCKETS.map((pocket) => Object.freeze({ ...pocket }))),
        rails: Object.freeze(rails.map((rail) => Object.freeze({
          id: rail.plugin.heartbeatRail.id,
          kind: rail.plugin.heartbeatRail.kind,
          angle: rail.angle,
          isStatic: rail.isStatic,
          x: rail.position.x,
          y: rail.position.y,
          width: rail.plugin.heartbeatRail.width,
          height: rail.plugin.heartbeatRail.height,
          pocketId: rail.plugin.heartbeatRail.pocketId || null,
          cutAngleDegrees: rail.plugin.heartbeatRail.cutAngleDegrees || null,
          headingDegrees: rail.plugin.heartbeatRail.headingDegrees ?? null,
          mouthSide: rail.plugin.heartbeatRail.mouthSide ?? null,
          noseX: rail.plugin.heartbeatRail.noseX ?? null,
          noseY: rail.plugin.heartbeatRail.noseY ?? null
        }))),
        ballRenderer: Object.freeze({
          active: Boolean(ballRenderer),
          failed: ballRendererFailed,
          canvas: Boolean(ballRendererCanvas)
        }),
        render: Object.freeze({ width: canvas.width, height: canvas.height, scale: renderScale }),
        ballNumbers: Object.freeze(balls.map((ball) => bodyData(ball).number).sort((a, b) => a - b)),
        balls: Object.freeze(balls.map((ball) => Object.freeze({
          number: bodyData(ball).number,
          x: ball.position.x,
          y: ball.position.y,
          vx: ball.velocity.x,
          vy: ball.velocity.y,
          motionState: ball.physics?.state || null,
          spinX: ball.physics?.spinX || 0,
          spinY: ball.physics?.spinY || 0,
          spinZ: ball.physics?.spinZ || 0,
          rollAngle: bodyData(ball).rollAngle,
          rollVelocity: bodyData(ball).rollVelocity,
          shotRailHits: bodyData(ball).shotRailHits,
          shotJawHits: bodyData(ball).shotJawHits,
          shotTravel: bodyData(ball).shotTravel,
          pocketMouthEntries: bodyData(ball).pocketMouthEntries,
          outsideSteps: bodyData(ball).outsideSteps,
          pocketApproach: bodyData(ball).pocketApproach ? Object.freeze({
            pocketId: bodyData(ball).pocketApproach.pocketId,
            enteredAt: bodyData(ball).pocketApproach.enteredAt,
            captureCrossed: bodyData(ball).pocketApproach.captureCrossed,
            mouthCrossX: bodyData(ball).pocketApproach.mouthCrossX,
            mouthCrossY: bodyData(ball).pocketApproach.mouthCrossY,
            captureCrossX: bodyData(ball).pocketApproach.captureCrossX,
            captureCrossY: bodyData(ball).pocketApproach.captureCrossY,
            maximumDepth: bodyData(ball).pocketApproach.maximumDepth
          }) : null,
          lastRailImpact: bodyData(ball).lastRailImpact
            ? Object.freeze({ ...bodyData(ball).lastRailImpact })
            : null,
          compression: bodyData(ball).compression,
          impactGlow: bodyData(ball).impactGlow,
          pocketing: bodyData(ball).pocketing ? Object.freeze({
            pocketId: bodyData(ball).pocketing.pocketId,
            elapsedMs: bodyData(ball).pocketing.elapsed,
            durationMs: bodyData(ball).pocketing.duration,
            scale: bodyData(ball).pocketing.scale,
            depth: bodyData(ball).pocketing.depth,
            rotation: bodyData(ball).pocketing.rotation
          }) : null
        }))),
        cue: cueBall ? Object.freeze({ x: cueBall.position.x, y: cueBall.position.y }) : null
      });
    },
    select(number) {
      selectTarget(number);
    },
    setSurfaceMaterial(id) {
      return selectSurfaceMaterial(id);
    },
    shoot(power = 0.5, direction = aimDirection) {
      return shoot(normalize(direction), clamp(power, 0, 1));
    },
    step(count = 1) {
      const steps = clamp(Math.trunc(count), 1, 20000);
      for (let index = 0; index < steps; index += 1) physicsStep();
      return this.snapshot();
    },
    renderFrame(timestamp = simulationTime) {
      draw(timestamp);
      return this.snapshot();
    },
    placeBall(number, point, velocity = { x: 0, y: 0 }) {
      const ball = ballByNumber(number);
      if (!ball) return false;
      const data = bodyData(ball);
      Body.setPosition(ball, { x: point.x, y: point.y });
      Body.setVelocity(ball, { x: velocity.x || 0, y: velocity.y || 0 });
      data.lastPosition = { x: point.x, y: point.y };
      data.previousPosition = { x: point.x, y: point.y };
      data.preStepVelocity = { x: velocity.x || 0, y: velocity.y || 0 };
      data.pocketApproach = null;
      data.lastRailImpact = null;
      if (point.x >= TABLE.left + BALL_RADIUS && point.x <= TABLE.right - BALL_RADIUS
          && point.y >= TABLE.top + BALL_RADIUS && point.y <= TABLE.bottom - BALL_RADIUS) {
        data.lastSafePosition = { x: point.x, y: point.y };
      }
      data.outsideSteps = 0;
      return true;
    },
    isolateBall(number = 0) {
      const ball = ballByNumber(number);
      if (!ball) return false;
      balls.forEach((candidate) => {
        if (candidate !== ball) Composite.remove(engine.world, candidate);
      });
      balls = [ball];
      cueBall = number === 0 ? ball : null;
      return true;
    },
    presentShot(shot) {
      if (shotState || runState.endState.ended) return false;
      const completedShot = {
        pottedNumbers: [...(shot?.pottedNumbers || [])],
        cueScratch: Boolean(shot?.cueScratch),
        breakShot: Boolean(shot?.breakShot),
        bankedNumbers: [...(shot?.bankedNumbers || [])],
        pottedDetails: [...(shot?.pottedDetails || [])],
        objectContacts: Number(shot?.objectContacts) || 0,
        closestPocketDistance: Number.isFinite(shot?.closestPocketDistance) ? shot.closestPocketDistance : Infinity,
        launchPower: Number.isFinite(shot?.launchPower) ? shot.launchPower : 0.52,
        cueEnd: shot?.cueEnd ? { x: shot.cueEnd.x, y: shot.cueEnd.y } : null,
        dateRouteIds: [],
        storyShown: false
      };
      const outcome = rules.evaluateShot(runState, {
        pottedNumbers: orderedPottedNumbers(completedShot),
        cueScratch: completedShot.cueScratch,
        breakShot: completedShot.breakShot,
        bankedNumbers: completedShot.bankedNumbers
      });
      runState = outcome.state;
      processOutcomePerformances(outcome, completedShot);
      syncUI();
      return this.snapshot();
    },
    advancePresentation() {
      if (tableMomentActive) {
        hideTableMoment();
      } else if (!elements.micro.hidden) {
        clearTimeout(microTimer);
        elements.micro.hidden = true;
        showNextMicro();
      } else if (cinematicActive) {
        closeCinematic();
      } else if (microQueue.length) {
        showNextMicro();
      } else if (cinematicQueue.length) {
        showNextCinematic();
      }
      return this.snapshot();
    },
    reset() {
      resetGame();
    }
  });
})();
