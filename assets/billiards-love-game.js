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
  let dateMapFramesSinceRebuild = 0;
  let cushionLightFrameCanvas = null;
  let cushionLightFrameContext = null;
  let cushionLightFrameUpdatedAt = -Infinity;
  let cushionLightFrameDirty = true;
  let cushionLightFramesSinceRebuild = 0;
  let cushionLightHadActivity = false;
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
    resultPotted: required("#hb-result-potted"),
    resultBanks: required("#hb-result-banks"),
    resultMulti: required("#hb-result-multi"),
    resultScratches: required("#hb-result-scratches"),
    retry: required("#hb-retry")
  };
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
  const POCKET_LIP_SETTLE_RATIO = 0.72;
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
  const MAX_RENDER_WIDTH = 1080;
  const MAX_RENDER_HEIGHT = 2160;
  const MAX_RENDER_PIXELS = MAX_RENDER_WIDTH * MAX_RENDER_HEIGHT;
  const MIN_BALL_RENDER_SCALE = 0.78;
  const MAX_BALL_RENDER_SCALE = 1.6;
  const BALL_RENDER_SCALE_RATIO = 1;
  const DATE_MAP_REFRESH_MS = 1000 / 30;
  const SCENE_PORTAL_DURATION_MS = 1120;
  const WATER_GRID_WIDTH = 144;
  const WATER_GRID_HEIGHT = 288;
  const WATER_STEP_MS = 1000 / 30;
  const WATER_DAMPING = 0.986;
  const WATER_MAX_HEIGHT = 3.2;
  const MAX_WATER_WAKE_DEPOSITS_PER_STEP = 6;
  const RAIL_LED_SEGMENT_LENGTH = 18;
  const COLLISION_SPRITE_BASE_RADIUS = 72;
  const COLLISION_SPRITE_EXTENT = 132;
  const COLLISION_SPRITE_RENDER_SCALE = 2;
  const COLLISION_SPRITE_CACHE_LIMIT = 9;
  const RAIL_WAVE_LIFETIME_MS = 2100;
  const RAIL_WAVE_SPEED = 920;
  const CUE_SPOT = Object.freeze({ x: WORLD.width / 2, y: 1080 });
  const RACK_APEX = Object.freeze({ x: WORLD.width / 2, y: 510 });
  const COACH_KEY = "yl-heartbeat-billiards-coach-v2";
  const SETTINGS_KEY = "yl-heartbeat-billiards-settings-v2";
  const RECORD_KEY = "yl-heartbeat-billiards-record-v2";
  const VIEWED_KEY = "yl-heartbeat-billiards-viewed-v2";
  const BALL_COLORS = Object.freeze({
    1: "#6d8cff", 2: "#ff6a20", 3: "#8be8ff", 4: "#39e7ff",
    5: "#d5a35d", 6: "#aa74ff", 7: "#ed4dce", 8: "#17120f",
    9: "#d7a84f", 10: "#20dff4", 11: "#a9dfff", 12: "#67f1b6",
    13: "#a9c9df", 14: "#2bd5c8", 15: "#9a6dff"
  });
  const BALL_CHROMA_THEMES = Object.freeze({
    0: Object.freeze({ id: "ink-landscape", label: "水墨风韵", primary: "#e9eee8", secondary: "#53635e", accent: "#a33a2d", deep: "#101816", glow: "#ffffff" }),
    1: Object.freeze({ id: "galactic-vortex", label: "星际漩涡", primary: "#78b8ff", secondary: "#855dff", accent: "#ffc66e", deep: "#070b2c", glow: "#eaf5ff" }),
    2: Object.freeze({ id: "volcanic-rift", label: "熔岩裂域", primary: "#ff6a20", secondary: "#d41712", accent: "#ffd15b", deep: "#210300", glow: "#fff0bb" }),
    3: Object.freeze({ id: "glacier-mirror", label: "冰川裂镜", primary: "#8be8ff", secondary: "#3b86d8", accent: "#ffffff", deep: "#03172d", glow: "#effcff" }),
    4: Object.freeze({ id: "cyber-matrix", label: "赛博矩阵", primary: "#39e7ff", secondary: "#c73cff", accent: "#88ffea", deep: "#02091c", glow: "#e6ffff" }),
    5: Object.freeze({ id: "wind-traces", label: "风之痕迹", primary: "#d5a35d", secondary: "#835426", accent: "#ffe5a8", deep: "#241307", glow: "#fff0ca" }),
    6: Object.freeze({ id: "arcane-array", label: "魔法阵域", primary: "#aa74ff", secondary: "#5731c8", accent: "#e4bd6a", deep: "#0d0824", glow: "#f3e5ff" }),
    7: Object.freeze({ id: "rhythm-pulse", label: "音律律动", primary: "#ed4dce", secondary: "#36cfff", accent: "#f6ce45", deep: "#050713", glow: "#ffffff" }),
    8: Object.freeze({ id: "cursed-codex", label: "墨咒书卷", primary: "#17120f", secondary: "#b99048", accent: "#8d1f22", deep: "#010101", glow: "#ffe8a8" }),
    9: Object.freeze({ id: "chrono-orrery", label: "时间流淌", primary: "#d7a84f", secondary: "#516e9d", accent: "#f2dfaa", deep: "#07101f", glow: "#fff2bd" }),
    10: Object.freeze({ id: "neon-megacity", label: "赛博都市", primary: "#20dff4", secondary: "#f23fc4", accent: "#758cff", deep: "#020918", glow: "#e9ffff" }),
    11: Object.freeze({ id: "mythic-thunder", label: "神话雷霆", primary: "#a9dfff", secondary: "#567dff", accent: "#ffffff", deep: "#020b1b", glow: "#ffffff" }),
    12: Object.freeze({ id: "aurora-realm", label: "极光之境", primary: "#67f1b6", secondary: "#b45cff", accent: "#9fe9ff", deep: "#031423", glow: "#efffff" }),
    13: Object.freeze({ id: "orbital-station", label: "未来宇宙站", primary: "#a9c9df", secondary: "#4b8ed2", accent: "#eaf8ff", deep: "#050b13", glow: "#ffffff" }),
    14: Object.freeze({ id: "tidal-maelstrom", label: "潮汐之舞", primary: "#2bd5c8", secondary: "#147c94", accent: "#e5ffff", deep: "#01181d", glow: "#efffff" }),
    15: Object.freeze({ id: "quantum-vortex", label: "量子漩涡", primary: "#9a6dff", secondary: "#29baf4", accent: "#ffc65b", deep: "#07051b", glow: "#ffffff" })
  });
  const POCKET_VFX_PROFILES = Object.freeze({
    "top-left": Object.freeze({ id: "ripple", label: "液态潮汐", glyph: "rings", primary: "#54d8ff", secondary: "#8a7dff" }),
    "top-right": Object.freeze({ id: "comet", label: "彗星火花", glyph: "burst", primary: "#ffcf5a", secondary: "#ff5d84" }),
    "middle-left": Object.freeze({ id: "prism", label: "棱镜折射", glyph: "prism", primary: "#9af7ff", secondary: "#ef72ff" }),
    "middle-right": Object.freeze({ id: "pulse", label: "量子脉冲", glyph: "segments", primary: "#62ffca", secondary: "#3b78ff" }),
    "bottom-left": Object.freeze({ id: "lightning", label: "电弧裂变", glyph: "bolts", primary: "#d7f7ff", secondary: "#6a5cff" }),
    "bottom-right": Object.freeze({ id: "aurora", label: "极光绸带", glyph: "ribbons", primary: "#68ffc8", secondary: "#d967ff" })
  });
  const POCKET_VFX_BY_ID = Object.freeze(Object.fromEntries(
    Object.values(POCKET_VFX_PROFILES).map((profile) => [profile.id, profile])
  ));
  const SURFACE_MATERIALS = Object.freeze([
    Object.freeze({ id: "gold", label: "时间流淌", rail: "#ddb55f", railSecondary: "#547dae", damping: 0.981, disturbance: 1.24, radius: 0.94, wake: 1.38, tail: 1.46, railSpeed: 0.92, railWidth: 1.24, railGain: 1.34, traceDecay: 0.974, traceDiffuse: 0.026, traceDeposit: 0.38, trailLife: 2900 }),
    Object.freeze({ id: "galaxy", label: "星际漩涡", rail: "#72cfff", railSecondary: "#8d62ff", damping: 0.988, disturbance: 0.96, radius: 1.22, wake: 1.12, tail: 1.82, railSpeed: 0.72, railWidth: 1.42, railGain: 1.12, traceDecay: 0.965, traceDiffuse: 0.032, traceDeposit: 0.25, trailLife: 3200 }),
    Object.freeze({ id: "lava", label: "熔岩裂域", rail: "#ff4b27", railSecondary: "#ffb13d", damping: 0.979, disturbance: 1.28, radius: 0.92, wake: 1.4, tail: 1.48, railSpeed: 0.86, railWidth: 1.28, railGain: 1.32, traceDecay: 0.972, traceDiffuse: 0.024, traceDeposit: 0.38, trailLife: 2800 }),
    Object.freeze({ id: "circuit", label: "赛博矩阵", rail: "#31e8ff", railSecondary: "#d63dff", damping: 0.974, disturbance: 0.9, radius: 0.8, wake: 1.24, tail: 1.02, railSpeed: 1.52, railWidth: 0.82, railGain: 1.3, traceDecay: 0.986, traceDiffuse: 0.01, traceDeposit: 0.32, trailLife: 2500 }),
    Object.freeze({ id: "amber", label: "风之痕迹", rail: "#d7a760", railSecondary: "#806039", damping: 0.982, disturbance: 1.18, radius: 1.08, wake: 1.3, tail: 1.62, railSpeed: 0.82, railWidth: 1.34, railGain: 1.3, traceDecay: 0.968, traceDiffuse: 0.036, traceDeposit: 0.42, trailLife: 3100 }),
    Object.freeze({ id: "emerald", label: "未来宇宙站", rail: "#c5dfef", railSecondary: "#4a8ed0", damping: 0.989, disturbance: 1.04, radius: 1.18, wake: 1.18, tail: 1.58, railSpeed: 0.78, railWidth: 1.36, railGain: 1.18, traceDecay: 0.976, traceDiffuse: 0.04, traceDeposit: 0.36, trailLife: 3300 }),
    Object.freeze({ id: "burgundy", label: "音律律动", rail: "#f04bd1", railSecondary: "#31d6ff", damping: 0.986, disturbance: 1.12, radius: 0.98, wake: 1.28, tail: 1.38, railSpeed: 0.9, railWidth: 1.16, railGain: 1.26, traceDecay: 0.98, traceDiffuse: 0.02, traceDeposit: 0.34, trailLife: 3000 }),
    Object.freeze({ id: "ink", label: "水墨风韵", rail: "#f1f2eb", railSecondary: "#68736e", damping: 0.971, disturbance: 0.82, radius: 1.5, wake: 0.98, tail: 1.58, railSpeed: 0.76, railWidth: 1.42, railGain: 1.02, traceDecay: 0.945, traceDiffuse: 0.048, traceDeposit: 0.56, trailLife: 3900 }),
    Object.freeze({ id: "eclipse", label: "墨咒书卷", rail: "#e7bd6b", railSecondary: "#7e2024", damping: 0.984, disturbance: 1.34, radius: 1.38, wake: 1.52, tail: 1.92, railSpeed: 1.14, railWidth: 1.5, railGain: 1.58, traceDecay: 0.962, traceDiffuse: 0.034, traceDeposit: 0.5, trailLife: 4300 }),
    Object.freeze({ id: "solar-porcelain", label: "魔法阵域", rail: "#b27cff", railSecondary: "#e6bd67", damping: 0.987, disturbance: 1.02, radius: 1.04, wake: 1.2, tail: 1.32, railSpeed: 0.88, railWidth: 1.12, railGain: 1.22, traceDecay: 0.981, traceDiffuse: 0.028, traceDeposit: 0.32, trailLife: 3200 }),
    Object.freeze({ id: "abyss", label: "潮汐之舞", rail: "#31e0d1", railSecondary: "#dffeff", damping: 0.991, disturbance: 1.08, radius: 1.3, wake: 1.34, tail: 1.86, railSpeed: 0.74, railWidth: 1.44, railGain: 1.3, traceDecay: 0.97, traceDiffuse: 0.046, traceDeposit: 0.4, trailLife: 3700 }),
    Object.freeze({ id: "crimson-storm", label: "神话雷霆", rail: "#e7f7ff", railSecondary: "#5c82ff", damping: 0.978, disturbance: 1.32, radius: 0.88, wake: 1.42, tail: 1.54, railSpeed: 1.26, railWidth: 1.06, railGain: 1.48, traceDecay: 0.969, traceDiffuse: 0.022, traceDeposit: 0.44, trailLife: 2900 }),
    Object.freeze({ id: "amethyst", label: "冰川裂镜", rail: "#bdf5ff", railSecondary: "#4d9ce5", damping: 0.992, disturbance: 1.1, radius: 0.84, wake: 1.18, tail: 1.12, railSpeed: 1.04, railWidth: 0.96, railGain: 1.28, traceDecay: 0.984, traceDiffuse: 0.012, traceDeposit: 0.3, trailLife: 3400 }),
    Object.freeze({ id: "copper", label: "赛博都市", rail: "#25dff3", railSecondary: "#f343c5", damping: 0.98, disturbance: 1.24, radius: 1.12, wake: 1.38, tail: 1.72, railSpeed: 0.84, railWidth: 1.32, railGain: 1.38, traceDecay: 0.966, traceDiffuse: 0.038, traceDeposit: 0.46, trailLife: 3300 }),
    Object.freeze({ id: "jade-mist", label: "极光之境", rail: "#72f2b4", railSecondary: "#b75dff", damping: 0.99, disturbance: 1.0, radius: 1.34, wake: 1.24, tail: 1.76, railSpeed: 0.7, railWidth: 1.46, railGain: 1.16, traceDecay: 0.972, traceDiffuse: 0.052, traceDeposit: 0.42, trailLife: 3800 }),
    Object.freeze({ id: "rose-quartz", label: "量子漩涡", rail: "#9d70ff", railSecondary: "#2bc1f2", damping: 0.988, disturbance: 1.12, radius: 0.96, wake: 1.3, tail: 1.44, railSpeed: 0.94, railWidth: 1.18, railGain: 1.3, traceDecay: 0.978, traceDiffuse: 0.024, traceDeposit: 0.38, trailLife: 3300 })
  ]);
  const SURFACE_MATERIAL_BY_ID = Object.freeze(Object.fromEntries(
    SURFACE_MATERIALS.map((material) => [material.id, material])
  ));
  const SURFACE_TEXTURE_SOURCES = Object.freeze({
    ink: "assets/billiards-surfaces/worlds/00-ink-landscape.jpg",
    galaxy: "assets/billiards-surfaces/worlds/01-galactic-vortex.jpg",
    lava: "assets/billiards-surfaces/worlds/02-volcanic-rift.jpg",
    amethyst: "assets/billiards-surfaces/worlds/03-glacier-mirror.jpg",
    circuit: "assets/billiards-surfaces/worlds/04-cyber-matrix.jpg",
    amber: "assets/billiards-surfaces/worlds/05-wind-traces.jpg",
    "solar-porcelain": "assets/billiards-surfaces/worlds/06-arcane-array.jpg",
    burgundy: "assets/billiards-surfaces/worlds/07-rhythm-pulse.jpg",
    eclipse: "assets/billiards-surfaces/worlds/08-cursed-codex.jpg",
    gold: "assets/billiards-surfaces/worlds/09-chrono-orrery.jpg",
    copper: "assets/billiards-surfaces/worlds/10-neon-megacity.jpg",
    "crimson-storm": "assets/billiards-surfaces/worlds/11-mythic-thunder.jpg",
    "jade-mist": "assets/billiards-surfaces/worlds/12-aurora-realm.jpg",
    emerald: "assets/billiards-surfaces/worlds/13-orbital-station.jpg",
    abyss: "assets/billiards-surfaces/worlds/14-tidal-maelstrom.jpg",
    "rose-quartz": "assets/billiards-surfaces/worlds/15-quantum-vortex.jpg"
  });
  const BALL_SURFACE_MATERIALS = Object.freeze({
    0: "ink",
    1: "galaxy",
    2: "lava",
    3: "amethyst",
    4: "circuit",
    5: "amber",
    6: "solar-porcelain",
    7: "burgundy",
    8: "eclipse",
    9: "gold",
    10: "copper",
    11: "crimson-storm",
    12: "jade-mist",
    13: "emerald",
    14: "abyss",
    15: "rose-quartz"
  });
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
  const collisionFeedbackSpriteCache = new Map();
  let pendingMaterialCollision = null;
  let lastMaterialCollisionFlushStep = -1;
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
  let surfaceMaterialId = "ink";
  let dateMapState = createDateMapState();
  let waterSurface = createWaterSurface();
  const surfaceArtworkCache = new Map();
  const surfaceTextureCache = new Map();
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
  let surfaceRenderer = null;
  let surfaceRendererFailed = false;

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
    return SURFACE_MATERIAL_BY_ID[surfaceMaterialId] || SURFACE_MATERIAL_BY_ID.ink;
  }

  function surfaceMaterialForBall(number) {
    return BALL_SURFACE_MATERIALS[number] || "ink";
  }

  function syncSurfaceMaterialUI() {
    const material = activeSurfaceMaterial();
    root.dataset.surfaceMaterial = material.id;
  }

  function spawnSurfaceMaterialWave(material, origin = CUE_SPOT, theme = BALL_CHROMA_THEMES[0]) {
    dateMapState.railBursts.push({
      x: origin.x,
      y: origin.y,
      originS: railDistanceForContact(origin.x, origin.y),
      normalX: 0,
      normalY: 1,
      railId: `surface-${material.id}`,
      effectId: `surface-${material.id}`,
      color: material.rail,
      secondary: material.railSecondary || theme.secondary,
      intensity: 0.92,
      rgb: colorChannels(material.rail),
      speed: RAIL_WAVE_SPEED * material.railSpeed,
      width: 190 * material.railWidth,
      duration: RAIL_WAVE_LIFETIME_MS * (material.id === "ink" || material.id === "jade-mist" ? 1.38 : material.id === "circuit" ? 0.82 : 1.08),
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
    const origin = options.origin || CUE_SPOT;
    const theme = options.theme || dateMapState.activeTheme || BALL_CHROMA_THEMES[0];
    const duration = Number(options.duration) || (id === "ink" ? 1180 : id === "eclipse" ? 1460 : 1040);
    const now = performance.now();
    const shotToken = shotState?.startedAt ?? null;
    const activeTransition = dateMapState.surfaceTransition;
    const mergeWithCurrent = Boolean(
      activeTransition
      && shotToken !== null
      && activeTransition.shotToken === shotToken
      && now - activeTransition.startedAt < Math.max(activeTransition.duration, 1500)
    );
    const nextOrigin = {
      x: origin.x,
      y: origin.y,
      color: theme.primary,
      ballNumber: Number(options.ballNumber) || 0,
      bornAt: now,
      duration
    };
    const origins = mergeWithCurrent
      ? [...(activeTransition.origins || []), nextOrigin].slice(-4)
      : [nextOrigin];
    surfaceMaterialId = material.id;
    dateMapState.previousSurfaceMaterialId = mergeWithCurrent ? activeTransition.from : previous;
    dateMapState.surfaceMaterialId = material.id;
    dateMapState.surfaceTransition = {
      from: mergeWithCurrent ? activeTransition.from : previous,
      to: material.id,
      startedAt: mergeWithCurrent ? activeTransition.startedAt : now,
      duration: mergeWithCurrent
        ? Math.max(activeTransition.duration, now - activeTransition.startedAt + duration)
        : duration,
      originX: origin.x,
      originY: origin.y,
      color: theme.primary,
      ballNumber: Number(options.ballNumber) || 0,
      shotToken,
      origins
    };
    if (previous !== material.id && waterSurface) {
      waterSurface.pigment.fill(0);
      waterSurface.pigmentNext.fill(0);
      waterSurface.revision += 1;
    }
    ensureSurfaceTexture(material.id);
    scheduleCollisionFeedbackPrewarm(material);
    syncSurfaceMaterialUI();
    if (options.animate !== false) {
      const impulse = material.id === "ink" ? -2.35 : material.id === "eclipse" ? -2.72 : material.id === "lava" ? 2.25 : 1.82;
      disturbWaterWorld(origin.x, origin.y, impulse, material.id === "ink" ? 104 : 76);
      disturbMaterialWorld(origin.x, origin.y, impulse * 0.62, 184, 74,
        Math.atan2(origin.y - WORLD.height / 2, origin.x - WORLD.width / 2), Number(options.ballNumber) || 0);
      spawnSurfaceMaterialWave(material, origin, theme);
      lastStoryWorldOrigin = { x: origin.x, y: origin.y };
      screenFlash = Math.max(screenFlash, material.id === "eclipse" ? 0.42 : material.id === "ink" ? 0.24 : 0.18);
      dateMapFrameDirty = true;
      sceneLightingFrameDirty = true;
    }
    return true;
  }

  function transitionSurfaceForBall(number, pocket, theme = BALL_CHROMA_THEMES[number] || BALL_CHROMA_THEMES[0]) {
    const materialId = surfaceMaterialForBall(number);
    return selectSurfaceMaterial(materialId, {
      origin: { x: pocket.captureX, y: pocket.captureY },
      theme,
      ballNumber: number,
      duration: number === 8 ? 1520 : number === 0 ? 1080 : 1180
    });
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
    transitionSurfaceForBall(number, pocket, theme);
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
    const railColor = surface.rail;
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
    const railColor = surface.rail;
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
    pendingMaterialCollision = null;
    lastMaterialCollisionFlushStep = -1;
    collisionCount = 0;
    microQueue = [];
    cinematicQueue = [];
    cinematicCurrent = null;
    tableMomentActive = false;
    tableMomentCurrent = null;
    storySlowMotionUntil = 0;
    lastStoryOrigin = { x: 50, y: 50 };
    lastStoryWorldOrigin = { x: WORLD.width / 2, y: WORLD.height / 2 };
    surfaceMaterialId = "ink";
    dateMapState = createDateMapState();
    resetWaterSurface();
    dateMapFrameDirty = true;
    dateMapFrameUpdatedAt = -Infinity;
    dateMapFramesSinceRebuild = 0;
    cushionLightFrameUpdatedAt = -Infinity;
    cushionLightFrameDirty = true;
    cushionLightFramesSinceRebuild = 0;
    cushionLightHadActivity = false;
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
      const visuallyInsidePocket = body.speed <= NATURAL_STOP_SPEED * 1.6
        && currentDepth >= pocket.captureDepth * 0.55
        && currentLateral <= pocket.captureHalfWidth + POCKET_SHELF_LATERAL_TOLERANCE * 1.35
        && Math.hypot(body.position.x - pocket.x, body.position.y - pocket.y)
          <= POCKET_RADIUS - BALL_RADIUS * 0.08;
      if (settledOverLip || visuallyInsidePocket) {
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
      if (dateRoute) {
        detail.dateRouteId = dateRoute.id;
        shotState.dateRouteIds.push(dateRoute.id);
      }
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
          const previousTrailPoint = data.lastChromaTrailPoint || {
            x: ball.position.x - dx,
            y: ball.position.y - dy
          };
          dateMapState.rollingTrails.push({
            x1: previousTrailPoint.x,
            y1: previousTrailPoint.y,
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
          data.lastChromaTrailPoint = { x: ball.position.x, y: ball.position.y };
          data.lastChromaTrailAt = simulationTime;
          if (dateMapState.rollingTrails.length > 180) {
            dateMapState.rollingTrails.splice(0, dateMapState.rollingTrails.length - 180);
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
    const finishWhenReady = () => {
      if (dateMapState.blackEightBlast) {
        finalRevealTimer = setTimeout(finishWhenReady, 120);
        return;
      }
      finalRevealActive = false;
      hideTableMoment();
      if (!resultVisible) showResult();
    };
    finalRevealTimer = setTimeout(finishWhenReady, delayMs);
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
    elements.resultPotted.textContent = String(rating.technical.pottedBalls);
    elements.resultBanks.textContent = String(rating.technical.bankedPots);
    elements.resultMulti.textContent = String(rating.technical.multiBallShots);
    elements.resultScratches.textContent = String(rating.technical.cueScratches);
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
    if (particles.length > 96) particles.splice(0, particles.length - 96);
  }

  function collisionMaterialFamily(materialId) {
    if (["lava", "gold", "crimson-storm", "copper"].includes(materialId)) return "plasma";
    if (["galaxy", "abyss", "emerald", "jade-mist", "amber"].includes(materialId)) return "fluid";
    if (["amethyst", "burgundy", "rose-quartz", "solar-porcelain"].includes(materialId)) return "crystal";
    if (materialId === "circuit") return "circuit";
    if (materialId === "eclipse") return "eclipse";
    return "ink";
  }

  function spawnMaterialCollisionResponse(contact, normal, relative, numbers = []) {
    const material = activeSurfaceMaterial();
    const family = collisionMaterialFamily(material.id);
    const direction = normalize(normal || { x: 1, y: 0 }, { x: 1, y: 0 });
    const tangent = { x: -direction.y, y: direction.x };
    const intensity = clamp(relative / 15, 0.28, 1);
    const seed = collisionCount * 1.713 + (numbers[0] || 0) * 2.17 + (numbers[1] || 0) * 0.73;
    const heading = Math.atan2(direction.y, direction.x);
    const radius = 58 + intensity * 68;

    disturbWaterWorld(contact.x, contact.y, 0.42 + intensity * 1.12, 28 + intensity * 34);
    if (family === "plasma") {
      for (let branch = 0; branch < 5; branch += 1) {
        const offset = branch - 2;
        const curve = Math.sin(seed + branch * 2.19) * 0.68 + offset * 0.26;
        disturbMaterialWorld(
          contact.x + tangent.x * offset * 13,
          contact.y + tangent.y * offset * 13,
          (branch % 2 ? -0.46 : 0.74) * intensity,
          radius * (1.15 + branch * 0.08),
          18 + branch * 4,
          heading + curve,
          seed + branch * 1.37
        );
      }
    } else if (family === "fluid") {
      [-1, 0, 1].forEach((side, index) => {
        disturbMaterialWorld(
          contact.x + tangent.x * side * (34 + intensity * 24),
          contact.y + tangent.y * side * (34 + intensity * 24),
          (index === 1 ? 0.94 : -0.58) * intensity,
          radius * (1.2 + index * 0.18),
          52 + index * 14,
          heading + Math.PI / 2 + side * 0.62,
          seed + index * 2.11
        );
      });
    } else if (family === "crystal") {
      for (let facet = 0; facet < 6; facet += 1) {
        const angle = heading + facet / 6 * Math.PI * 2 + Math.sin(seed + facet) * 0.27;
        disturbMaterialWorld(
          contact.x + Math.cos(angle) * facet * 2.6,
          contact.y + Math.sin(angle) * facet * 2.6,
          (facet % 2 ? -0.56 : 0.78) * intensity,
          radius * (0.82 + facet * 0.08),
          13 + facet * 2.4,
          angle,
          seed + facet * 1.61
        );
      }
    } else if (family === "circuit") {
      const grid = 30;
      for (let node = -2; node <= 2; node += 1) {
        const x = Math.round((contact.x + tangent.x * node * grid) / grid) * grid;
        const y = Math.round((contact.y + tangent.y * node * grid) / grid) * grid;
        disturbMaterialWorld(x, y, (node % 2 ? -0.5 : 0.8) * intensity, 76, 14, node % 2 ? 0 : Math.PI / 2, seed + node);
      }
    } else if (family === "eclipse") {
      for (let orbit = 0; orbit < 4; orbit += 1) {
        const angle = heading + Math.PI / 2 + orbit * 0.74;
        disturbMaterialWorld(contact.x, contact.y, (orbit % 2 ? -1 : 1) * intensity, radius * (1.4 + orbit * 0.22), 44 + orbit * 12, angle, seed + orbit * 2.4);
      }
    } else {
      for (let wash = 0; wash < 5; wash += 1) {
        const side = wash - 2;
        disturbMaterialWorld(contact.x + tangent.x * side * 17, contact.y + tangent.y * side * 17, (wash % 3 ? -0.4 : 0.68) * intensity, radius * 1.5, 58 + wash * 9, heading + Math.PI / 2 + side * 0.19, seed + wash);
      }
    }

    collisionFeedbacks.push({
      x: contact.x,
      y: contact.y,
      radius: 12,
      speed: 1.2 + intensity * 2.8,
      life: 1,
      duration: 760 + intensity * 360,
      intensity,
      color: material.rail,
      secondary: material.railSecondary || material.rail,
      materialId: material.id,
      family,
      normalX: direction.x,
      normalY: direction.y,
      seed
    });
    if (collisionFeedbacks.length > 12) collisionFeedbacks.splice(0, collisionFeedbacks.length - 12);
  }

  function queueMaterialCollisionResponse(contact, normal, relative, numbers = []) {
    if (pendingMaterialCollision && pendingMaterialCollision.relative >= relative) return;
    pendingMaterialCollision = {
      contact: { x: contact.x, y: contact.y },
      normal: { x: normal.x, y: normal.y },
      relative,
      numbers: [...numbers]
    };
  }

  function flushMaterialCollisionResponse() {
    const flushStep = Math.floor(simulationTime / WATER_STEP_MS);
    if (flushStep === lastMaterialCollisionFlushStep || !pendingMaterialCollision) return;
    lastMaterialCollisionFlushStep = flushStep;
    const pending = pendingMaterialCollision;
    pendingMaterialCollision = null;
    spawnMaterialCollisionResponse(pending.contact, pending.normal, pending.relative, pending.numbers);
  }

  function updateEffects() {
    flushMaterialCollisionResponse();
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
    const trailLifetime = activeSurfaceMaterial().trailLife || ROLL_TRAIL_LIFETIME_MS;
    dateMapState.rollingTrails.forEach((trail) => { trail.life -= FIXED_STEP / trailLifetime; });
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
      feedback.life -= FIXED_STEP / (feedback.duration || 860);
      feedback.radius += feedback.speed;
      feedback.speed *= 0.93;
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

    // The eight physical cushions define the table edge; decorative rings read as render artifacts.
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
    context.save();
    context.globalCompositeOperation = "screen";
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
    const refreshDue = transitionActive && timestamp - sceneLightingFrameUpdatedAt >= DATE_MAP_REFRESH_MS;
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

  function seededSurfaceRandom(seed) {
    let state = seed >>> 0;
    return () => {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function strokeSurfacePolyline(target, points) {
    if (!points.length) return;
    target.beginPath();
    target.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) target.lineTo(points[index].x, points[index].y);
    target.stroke();
  }

  function surfaceCrackPoints(random, startX, startY, angle, length, segments, bend = 0.34) {
    const points = [{ x: startX, y: startY }];
    let heading = angle;
    let x = startX;
    let y = startY;
    for (let index = 1; index <= segments; index += 1) {
      heading += (random() - 0.5) * bend;
      const step = length / segments * (0.72 + random() * 0.56);
      x += Math.cos(heading) * step;
      y += Math.sin(heading) * step;
      points.push({ x, y });
    }
    return points;
  }

  function paintLavaArtwork(target, width, height, random) {
    const base = target.createRadialGradient(width * 0.52, height * 0.42, 12, width * 0.5, height * 0.5, height * 0.72);
    base.addColorStop(0, "#28100a");
    base.addColorStop(0.48, "#100706");
    base.addColorStop(1, "#020202");
    target.fillStyle = base;
    target.fillRect(0, 0, width, height);

    for (let cell = 0; cell < 92; cell += 1) {
      const cx = random() * width;
      const cy = random() * height;
      const radius = 18 + random() * 64;
      const vertices = 6 + Math.floor(random() * 4);
      target.beginPath();
      for (let point = 0; point < vertices; point += 1) {
        const angle = point / vertices * Math.PI * 2;
        const edge = radius * (0.58 + random() * 0.58);
        const x = cx + Math.cos(angle) * edge;
        const y = cy + Math.sin(angle) * edge * (0.62 + random() * 0.35);
        if (point === 0) target.moveTo(x, y); else target.lineTo(x, y);
      }
      target.closePath();
      target.fillStyle = `rgba(${10 + Math.floor(random() * 24)}, ${7 + Math.floor(random() * 13)}, ${5 + Math.floor(random() * 9)}, ${0.24 + random() * 0.34})`;
      target.fill();
      target.strokeStyle = `rgba(154, 55, 21, ${0.05 + random() * 0.1})`;
      target.lineWidth = 0.6 + random() * 1.5;
      target.stroke();
    }

    target.save();
    target.globalCompositeOperation = "screen";
    for (let crack = 0; crack < 26; crack += 1) {
      const edge = crack % 4;
      const internal = crack > 11;
      const startX = internal ? random() * width : edge === 0 ? 0 : edge === 1 ? width : random() * width;
      const startY = internal ? random() * height : edge === 2 ? 0 : edge === 3 ? height : random() * height;
      const angle = internal ? random() * Math.PI * 2
        : edge === 0 ? random() * 1.1 - 0.55
          : edge === 1 ? Math.PI + random() * 1.1 - 0.55
            : edge === 2 ? Math.PI / 2 + random() * 1.1 - 0.55
              : -Math.PI / 2 + random() * 1.1 - 0.55;
      const points = surfaceCrackPoints(random, startX, startY, angle, 95 + random() * 270, 9 + Math.floor(random() * 9), 0.82);
      target.shadowColor = "#ff3109";
      target.shadowBlur = 15 + random() * 16;
      target.strokeStyle = `rgba(255, 45, 5, ${0.32 + random() * 0.34})`;
      target.lineWidth = 3 + random() * 6;
      strokeSurfacePolyline(target, points);
      target.shadowBlur = 7;
      target.strokeStyle = `rgba(255, 126, 18, ${0.62 + random() * 0.28})`;
      target.lineWidth = 1.1 + random() * 2.4;
      strokeSurfacePolyline(target, points);
      target.shadowBlur = 2;
      target.strokeStyle = "rgba(255, 235, 153, 0.82)";
      target.lineWidth = 0.42 + random() * 0.72;
      strokeSurfacePolyline(target, points);
      if (crack % 3 === 0) {
        const branchAt = points[3 + crack % Math.max(1, points.length - 5)];
        const branch = surfaceCrackPoints(random, branchAt.x, branchAt.y, angle + (crack % 2 ? 1 : -1) * (0.55 + random() * 0.5), 45 + random() * 95, 5 + crack % 4, 0.9);
        target.strokeStyle = "rgba(255, 92, 12, 0.62)";
        target.lineWidth = 1 + random() * 1.6;
        strokeSurfacePolyline(target, branch);
      }
    }
    target.shadowBlur = 0;
    for (let ember = 0; ember < 150; ember += 1) {
      const x = random() * width;
      const y = random() * height;
      const radius = 0.3 + random() * 1.6;
      target.globalAlpha = 0.18 + random() * 0.5;
      target.fillStyle = random() > 0.72 ? "#ffd36c" : "#f0440b";
      target.beginPath();
      target.arc(x, y, radius, 0, Math.PI * 2);
      target.fill();
    }
    target.restore();
  }

  function paintGalaxyArtwork(target, width, height, random) {
    const base = target.createRadialGradient(width * 0.48, height * 0.47, 12, width * 0.5, height * 0.5, height * 0.68);
    base.addColorStop(0, "#101c52");
    base.addColorStop(0.46, "#080d31");
    base.addColorStop(1, "#01030f");
    target.fillStyle = base;
    target.fillRect(0, 0, width, height);

    target.save();
    target.globalCompositeOperation = "screen";
    const nebulaColors = ["#3bbdff", "#7b5cff", "#ee63df", "#ffbe64"];
    for (let cloud = 0; cloud < 16; cloud += 1) {
      const x = random() * width;
      const y = random() * height;
      const radius = 70 + random() * 210;
      const glow = target.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, colorWithAlpha(nebulaColors[cloud % nebulaColors.length], 0.13 + random() * 0.09));
      glow.addColorStop(0.42, colorWithAlpha(nebulaColors[(cloud + 1) % nebulaColors.length], 0.05));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      target.fillStyle = glow;
      target.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    const centerX = width * 0.5;
    const centerY = height * 0.52;
    for (let arm = 0; arm < 4; arm += 1) {
      const points = [];
      for (let step = 0; step < 105; step += 1) {
        const ratio = step / 104;
        const turbulence = Math.sin(ratio * 24 + arm * 1.7) * 14 + Math.sin(ratio * 53 + arm) * 5;
        const angle = arm * Math.PI / 2 + ratio * Math.PI * 2.32 + Math.sin(ratio * 9 + arm) * 0.16;
        const radius = 16 + ratio * height * 0.55;
        points.push({
          x: centerX + Math.cos(angle) * radius * 0.56 + Math.cos(angle + Math.PI / 2) * turbulence,
          y: centerY + Math.sin(angle) * radius + Math.sin(angle + Math.PI / 2) * turbulence
        });
      }
      target.strokeStyle = colorWithAlpha(nebulaColors[arm], 0.075);
      target.shadowColor = nebulaColors[arm];
      target.shadowBlur = 30;
      target.lineWidth = 22 - arm * 2;
      strokeSurfacePolyline(target, points);
      target.shadowBlur = 14;
      target.strokeStyle = colorWithAlpha(nebulaColors[(arm + 1) % nebulaColors.length], 0.22);
      target.lineWidth = 3.4;
      strokeSurfacePolyline(target, points);
      target.shadowBlur = 3;
      target.strokeStyle = colorWithAlpha("#f7fbff", 0.3);
      target.lineWidth = 0.55;
      strokeSurfacePolyline(target, points);
    }
    target.shadowBlur = 0;
    for (let star = 0; star < 640; star += 1) {
      const x = random() * width;
      const y = random() * height;
      const rare = random() > 0.965;
      const radius = rare ? 1.7 + random() * 2.4 : 0.25 + random() * 1.05;
      target.globalAlpha = rare ? 0.72 + random() * 0.28 : 0.22 + random() * 0.58;
      target.fillStyle = rare ? nebulaColors[star % nebulaColors.length] : "#d9edff";
      target.beginPath();
      target.arc(x, y, radius, 0, Math.PI * 2);
      target.fill();
      if (rare) {
        target.strokeStyle = target.fillStyle;
        target.lineWidth = 0.6;
        target.beginPath();
        target.moveTo(x - radius * 3, y);
        target.lineTo(x + radius * 3, y);
        target.moveTo(x, y - radius * 3);
        target.lineTo(x, y + radius * 3);
        target.stroke();
      }
    }
    target.restore();
  }

  function paintCircuitArtwork(target, width, height, random) {
    const base = target.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, "#02091d");
    base.addColorStop(0.52, "#07143b");
    base.addColorStop(1, "#020516");
    target.fillStyle = base;
    target.fillRect(0, 0, width, height);

    target.save();
    target.globalCompositeOperation = "screen";
    target.lineWidth = 0.55;
    for (let x = 0; x <= width; x += 24) {
      target.strokeStyle = `rgba(38, 149, 214, ${x % 96 === 0 ? 0.17 : 0.075})`;
      target.beginPath();
      target.moveTo(x, 0);
      target.lineTo(x, height);
      target.stroke();
    }
    for (let y = 0; y <= height; y += 24) {
      target.strokeStyle = `rgba(55, 119, 210, ${y % 96 === 0 ? 0.16 : 0.07})`;
      target.beginPath();
      target.moveTo(0, y);
      target.lineTo(width, y);
      target.stroke();
    }

    const colors = ["#2eeaff", "#685cff", "#f14dff"];
    for (let route = 0; route < 82; route += 1) {
      const startX = Math.round(random() * width / 12) * 12;
      const startY = Math.round(random() * height / 12) * 12;
      const endX = Math.round(random() * width / 12) * 12;
      const endY = Math.round(random() * height / 12) * 12;
      const turnY = Math.round((startY + (endY - startY) * (0.25 + random() * 0.5)) / 12) * 12;
      const color = colors[route % colors.length];
      const points = [{ x: startX, y: startY }, { x: startX, y: turnY }, { x: endX, y: turnY }, { x: endX, y: endY }];
      target.shadowColor = color;
      target.shadowBlur = 10;
      target.strokeStyle = colorWithAlpha(color, 0.19 + random() * 0.2);
      target.lineWidth = 2.2 + random() * 1.8;
      strokeSurfacePolyline(target, points);
      target.shadowBlur = 2;
      target.strokeStyle = colorWithAlpha("#dffeff", 0.38 + random() * 0.3);
      target.lineWidth = 0.55;
      strokeSurfacePolyline(target, points);
      target.fillStyle = colorWithAlpha(color, 0.54);
      [points[0], points.at(-1)].forEach((point) => {
        target.beginPath();
        target.arc(point.x, point.y, 2.2 + random() * 2.6, 0, Math.PI * 2);
        target.fill();
      });
    }

    for (let hud = 0; hud < 20; hud += 1) {
      const x = 40 + random() * (width - 80);
      const y = 60 + random() * (height - 120);
      const radius = 12 + random() * 28;
      const color = colors[hud % colors.length];
      target.strokeStyle = colorWithAlpha(color, 0.22 + random() * 0.2);
      target.lineWidth = 0.8;
      target.setLineDash([3 + random() * 5, 3 + random() * 5]);
      target.beginPath();
      target.arc(x, y, radius, 0, Math.PI * 2);
      target.stroke();
      target.setLineDash([]);
      target.beginPath();
      target.arc(x, y, radius * 0.42, 0, Math.PI * 2);
      target.stroke();
    }
    target.restore();
  }

  function paintIceArtwork(target, width, height, random) {
    const base = target.createRadialGradient(width * 0.54, height * 0.42, 20, width * 0.5, height * 0.5, height * 0.7);
    base.addColorStop(0, "#0c5c8e");
    base.addColorStop(0.44, "#043b68");
    base.addColorStop(1, "#010d20");
    target.fillStyle = base;
    target.fillRect(0, 0, width, height);

    for (let shard = 0; shard < 140; shard += 1) {
      const cx = random() * width;
      const cy = random() * height;
      const radius = 20 + random() * 78;
      const angle = random() * Math.PI * 2;
      target.beginPath();
      target.moveTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      target.lineTo(cx + Math.cos(angle + 2.2) * radius * (0.45 + random() * 0.45), cy + Math.sin(angle + 2.2) * radius * (0.45 + random() * 0.45));
      target.lineTo(cx + Math.cos(angle + 4.3) * radius * (0.5 + random() * 0.6), cy + Math.sin(angle + 4.3) * radius * (0.5 + random() * 0.6));
      target.closePath();
      target.fillStyle = `rgba(${112 + Math.floor(random() * 78)}, ${190 + Math.floor(random() * 55)}, 255, ${0.04 + random() * 0.1})`;
      target.fill();
      target.strokeStyle = `rgba(189, 242, 255, ${0.06 + random() * 0.15})`;
      target.lineWidth = 0.5 + random() * 0.8;
      target.stroke();
    }

    target.save();
    target.globalCompositeOperation = "screen";
    for (let fracture = 0; fracture < 11; fracture += 1) {
      const cx = random() * width;
      const cy = random() * height;
      for (let ray = 0; ray < 7 + fracture % 5; ray += 1) {
        const points = surfaceCrackPoints(random, cx, cy, ray / (7 + fracture % 5) * Math.PI * 2, 75 + random() * 230, 6 + Math.floor(random() * 7), 0.58);
        target.shadowColor = "#6be7ff";
        target.shadowBlur = 9;
        target.strokeStyle = `rgba(104, 229, 255, ${0.16 + random() * 0.25})`;
        target.lineWidth = 2 + random() * 2.8;
        strokeSurfacePolyline(target, points);
        target.shadowBlur = 1.5;
        target.strokeStyle = `rgba(237, 254, 255, ${0.46 + random() * 0.38})`;
        target.lineWidth = 0.42 + random() * 0.65;
        strokeSurfacePolyline(target, points);
      }
      const core = target.createRadialGradient(cx, cy, 0, cx, cy, 24 + random() * 34);
      core.addColorStop(0, "rgba(235,255,255,0.52)");
      core.addColorStop(1, "rgba(88,215,255,0)");
      target.fillStyle = core;
      target.fillRect(cx - 60, cy - 60, 120, 120);
    }
    target.restore();
  }

  function paintInkArtwork(target, width, height, random) {
    const paper = target.createLinearGradient(0, 0, width, height);
    paper.addColorStop(0, "#d8ded3");
    paper.addColorStop(0.48, "#bfcfc7");
    paper.addColorStop(1, "#91aba2");
    target.fillStyle = paper;
    target.fillRect(0, 0, width, height);

    target.save();
    for (let fiber = 0; fiber < 360; fiber += 1) {
      target.globalAlpha = 0.025 + random() * 0.055;
      target.strokeStyle = random() > 0.5 ? "#f7f4e8" : "#3c554e";
      target.lineWidth = 0.35 + random() * 0.55;
      const y = random() * height;
      target.beginPath();
      target.moveTo(0, y);
      target.lineTo(width, y + (random() - 0.5) * 7);
      target.stroke();
    }

    target.globalAlpha = 1;
    const mountainLayers = [
      { baseline: 0.34, color: "rgba(30,55,49,0.2)", peaks: 6, amplitude: 86 },
      { baseline: 0.59, color: "rgba(16,39,34,0.36)", peaks: 7, amplitude: 124 },
      { baseline: 0.84, color: "rgba(7,25,22,0.58)", peaks: 8, amplitude: 168 }
    ];
    mountainLayers.forEach((layer, layerIndex) => {
      const peakFields = Array.from({ length: layer.peaks }, (_, peakIndex) => ({
        center: width * ((peakIndex + 0.35 + random() * 0.3) / layer.peaks),
        spread: width * (0.055 + random() * 0.065),
        height: layer.amplitude * (0.5 + random() * 0.68)
      }));
      const ridge = [];
      for (let step = 0; step <= 112; step += 1) {
        const x = step / 112 * width;
        let rise = 5;
        peakFields.forEach((peak) => {
          const distance = (x - peak.center) / peak.spread;
          rise = Math.max(rise, peak.height * Math.exp(-Math.abs(distance) * 1.38));
        });
        const erosionGain = 0.45 + rise / layer.amplitude * 0.55;
        const erosion = (Math.sin(x * 0.071 + layerIndex * 2.1) * 8
          + Math.sin(x * 0.19 + layerIndex * 0.7) * 4.5
          + Math.sin(x * 0.47 + layerIndex * 1.4) * 2.2) * erosionGain;
        ridge.push({ x, y: height * layer.baseline - rise + erosion });
      }
      target.beginPath();
      target.moveTo(ridge[0].x, ridge[0].y);
      ridge.slice(1).forEach((point) => target.lineTo(point.x, point.y));
      target.lineTo(width, height);
      target.lineTo(0, height);
      target.closePath();
      target.fillStyle = layer.color;
      target.fill();
      target.strokeStyle = `rgba(5, 24, 20, ${0.22 + layerIndex * 0.1})`;
      target.lineWidth = 1.1 + layerIndex * 0.65;
      strokeSurfacePolyline(target, ridge);

      target.save();
      target.globalCompositeOperation = "multiply";
      peakFields.forEach((peak, peakIndex) => {
        for (let wash = 0; wash < 5; wash += 1) {
          const startX = peak.center + (wash - 2) * peak.spread * 0.12;
          const startY = height * layer.baseline - peak.height * (0.72 + wash * 0.045);
          target.globalAlpha = 0.07 + layerIndex * 0.035;
          target.strokeStyle = peakIndex % 2 ? "#203b34" : "#0f2a24";
          target.lineWidth = 1 + wash * 0.8;
          target.beginPath();
          target.moveTo(startX, startY);
          target.quadraticCurveTo(startX + (wash - 2) * 7, startY + peak.height * 0.42, startX + (wash - 2) * 13, height * layer.baseline + 45);
          target.stroke();
        }
      });
      target.restore();
    });

    target.globalCompositeOperation = "source-over";
    [0.45, 0.7].forEach((ratio, index) => {
      const fog = target.createLinearGradient(0, height * ratio - 55, 0, height * ratio + 65);
      fog.addColorStop(0, "rgba(224,232,224,0)");
      fog.addColorStop(0.48, `rgba(224,232,224,${0.2 - index * 0.035})`);
      fog.addColorStop(1, "rgba(224,232,224,0)");
      target.fillStyle = fog;
      target.fillRect(0, height * ratio - 55, width, 120);
    });

    target.globalCompositeOperation = "multiply";
    target.lineCap = "round";
    const river = target.createLinearGradient(width * 0.7, 0, width * 0.28, height);
    river.addColorStop(0, "rgba(15,31,29,0.28)");
    river.addColorStop(0.52, "rgba(5,18,17,0.68)");
    river.addColorStop(1, "rgba(22,39,35,0.34)");
    for (let stroke = 0; stroke < 12; stroke += 1) {
      const offset = (stroke - 5.5) * 4.2;
      target.strokeStyle = river;
      target.globalAlpha = 0.12 + (1 - Math.abs(stroke - 5.5) / 6) * 0.12;
      target.lineWidth = 4 + (stroke % 4) * 2.4;
      target.beginPath();
      target.moveTo(width * 0.66 + offset, -20);
      target.bezierCurveTo(width * 0.2 + offset, height * 0.22, width * 0.84 - offset, height * 0.46, width * 0.35 + offset, height * 0.67);
      target.bezierCurveTo(width * 0.08 + offset, height * 0.8, width * 0.68 - offset, height * 0.91, width * 0.43 + offset, height + 20);
      target.stroke();
    }

    target.globalCompositeOperation = "source-over";
    for (let pine = 0; pine < 54; pine += 1) {
      const x = random() * width;
      const y = height * (0.24 + random() * 0.62);
      const size = 5 + random() * 12;
      target.globalAlpha = 0.28 + random() * 0.42;
      target.strokeStyle = "#0b2520";
      target.lineWidth = 0.75;
      target.beginPath();
      target.moveTo(x, y + size);
      target.lineTo(x, y - size);
      for (let branch = 0; branch < 5; branch += 1) {
        const branchY = y - size + branch * size * 0.35;
        const spread = size * (0.28 + branch * 0.12);
        target.moveTo(x, branchY);
        target.lineTo(x - spread, branchY + size * 0.28);
        target.moveTo(x, branchY);
        target.lineTo(x + spread, branchY + size * 0.28);
      }
      target.stroke();
    }

    target.strokeStyle = "rgba(9,31,27,0.58)";
    target.lineWidth = 1;
    for (let bird = 0; bird < 9; bird += 1) {
      const x = width * 0.12 + random() * width * 0.76;
      const y = height * 0.12 + random() * height * 0.18;
      target.beginPath();
      target.arc(x - 3, y, 3.5, Math.PI * 1.05, Math.PI * 1.86);
      target.arc(x + 3, y, 3.5, Math.PI * 1.14, Math.PI * 1.95);
      target.stroke();
    }
    target.globalAlpha = 0.72;
    target.fillStyle = "#8f2c23";
    target.fillRect(width * 0.08, height * 0.16, 15, 15);
    target.strokeStyle = "rgba(247,225,193,0.72)";
    target.lineWidth = 1;
    target.strokeRect(width * 0.08 + 2, height * 0.16 + 2, 11, 11);
    target.restore();
  }

  function createSurfaceArtwork(materialId) {
    const artwork = document.createElement("canvas");
    if (typeof artwork.getContext !== "function") return null;
    const target = artwork.getContext("2d", { alpha: false });
    if (!target) return null;
    const width = TABLE.right - TABLE.left;
    const height = TABLE.bottom - TABLE.top;
    const scale = 1.25;
    artwork.width = Math.round(width * scale);
    artwork.height = Math.round(height * scale);
    target.setTransform(scale, 0, 0, scale, 0, 0);
    const texture = ensureSurfaceTexture(materialId);
    if (texture?.ready && texture.image.naturalWidth && texture.image.naturalHeight) {
      drawSurfaceTexture(target, texture.image, width, height, materialId);
      return artwork;
    }
    const seed = [...materialId].reduce((total, character) => Math.imul(total ^ character.charCodeAt(0), 16777619), 2166136261);
    const random = seededSurfaceRandom(seed);
    if (["lava", "gold", "amber", "burgundy", "crimson-storm", "copper", "rose-quartz", "solar-porcelain"].includes(materialId)) paintLavaArtwork(target, width, height, random);
    else if (["galaxy", "abyss", "eclipse"].includes(materialId)) paintGalaxyArtwork(target, width, height, random);
    else if (materialId === "circuit") paintCircuitArtwork(target, width, height, random);
    else if (["amethyst", "emerald", "jade-mist"].includes(materialId)) paintIceArtwork(target, width, height, random);
    else paintInkArtwork(target, width, height, random);
    return artwork;
  }

  function ensureSurfaceTexture(materialId) {
    if (surfaceTextureCache.has(materialId)) return surfaceTextureCache.get(materialId);
    const source = SURFACE_TEXTURE_SOURCES[materialId];
    const ImageConstructor = window.Image;
    if (!source || typeof ImageConstructor !== "function") return null;
    const image = new ImageConstructor();
    const record = { image, source, ready: false, failed: false };
    surfaceTextureCache.set(materialId, record);
    image.decoding = "async";
    image.onload = () => {
      record.ready = Boolean(image.naturalWidth && image.naturalHeight);
      record.failed = !record.ready;
      surfaceArtworkCache.delete(materialId);
      dateMapFrameDirty = true;
      sceneLightingFrameDirty = true;
    };
    image.onerror = () => {
      record.failed = true;
      surfaceArtworkCache.delete(materialId);
      dateMapFrameDirty = true;
    };
    image.src = source;
    if (image.complete && image.naturalWidth && image.naturalHeight) record.ready = true;
    return record;
  }

  function preloadSurfaceTextures() {
    ensureSurfaceTexture(surfaceMaterialId);
    const pending = Object.keys(SURFACE_TEXTURE_SOURCES).filter((materialId) => materialId !== surfaceMaterialId);
    const scheduleTimeout = typeof window.setTimeout === "function"
      ? window.setTimeout.bind(window)
      : typeof setTimeout === "function" ? setTimeout : null;
    const queueNext = (delay = 680) => {
      if (!pending.length) return;
      if (scheduleTimeout) scheduleTimeout(requestNext, delay);
      else requestNext();
    };
    const loadOne = () => {
      if (!pending.length) return;
      ensureSurfaceTexture(pending.shift());
      queueNext();
    };
    const requestNext = () => {
      if (!pending.length) return;
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(loadOne, { timeout: 1600 });
      } else {
        loadOne();
      }
    };
    queueNext(420);
  }

  function drawSurfaceTexture(target, image, width, height, materialId) {
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = width / height;
    let sourceX = 0;
    let sourceY = 0;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;
    if (sourceRatio > targetRatio) {
      cropWidth = sourceHeight * targetRatio;
      sourceX = (sourceWidth - cropWidth) / 2;
    } else if (sourceRatio < targetRatio) {
      cropHeight = sourceWidth / targetRatio;
      sourceY = (sourceHeight - cropHeight) / 2;
    }
    target.save();
    target.imageSmoothingEnabled = true;
    target.imageSmoothingQuality = "high";
    target.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, width, height);

    // Preserve each world's authored palette; this neutral veil only keeps balls legible.
    const readability = target.createLinearGradient(0, 0, width, height);
    const brightWorld = ["ink", "amber", "gold", "amethyst"].includes(materialId);
    readability.addColorStop(0, `rgba(0,0,0,${brightWorld ? 0.025 : 0.005})`);
    readability.addColorStop(0.5, `rgba(0,0,0,${brightWorld ? 0.075 : 0.035})`);
    readability.addColorStop(1, `rgba(0,0,0,${brightWorld ? 0.15 : 0.1})`);
    target.fillStyle = readability;
    target.fillRect(0, 0, width, height);

    const vignette = target.createRadialGradient(width / 2, height / 2, width * 0.12, width / 2, height / 2, height * 0.56);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.7, "rgba(0,0,0,0.015)");
    vignette.addColorStop(1, materialId === "ink" ? "rgba(5,12,10,0.17)" : "rgba(0,0,0,0.2)");
    target.fillStyle = vignette;
    target.fillRect(0, 0, width, height);
    target.restore();
  }

  function surfaceArtworkFor(materialId) {
    if (!surfaceArtworkCache.has(materialId)) {
      surfaceArtworkCache.set(materialId, createSurfaceArtwork(materialId));
    }
    return surfaceArtworkCache.get(materialId);
  }

  function drawSurfaceArtwork(materialId) {
    const artwork = surfaceArtworkFor(materialId);
    if (!artwork) return;
    const textureReady = Boolean(surfaceTextureCache.get(materialId)?.ready);
    const opacity = textureReady
      ? materialId === "circuit" ? 0.97 : materialId === "ink" ? 0.96 : 0.95
      : materialId === "ink" ? 0.92 : materialId === "circuit" ? 0.88 : 0.84;
    context.save();
    context.globalAlpha = opacity;
    context.globalCompositeOperation = "source-over";
    context.drawImage(artwork, TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    context.restore();
  }

  function createWaterSurface() {
    const surfaceCanvas = document.createElement("canvas");
    surfaceCanvas.width = WATER_GRID_WIDTH;
    surfaceCanvas.height = WATER_GRID_HEIGHT;
    const surfaceContext = typeof surfaceCanvas.getContext === "function"
      ? surfaceCanvas.getContext("2d", { alpha: true })
      : null;
    const imageData = surfaceContext && typeof surfaceContext.createImageData === "function"
      ? surfaceContext.createImageData(WATER_GRID_WIDTH, WATER_GRID_HEIGHT)
      : null;
    if (imageData) imageData.data.fill(0);
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
      lastBlackEightImpulse: -1,
      lastSurfaceTransitionImpulse: -1,
      revision: 0,
      wakeBudgetStep: -1,
      wakeDepositsThisStep: 0
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
    waterSurface.lastSurfaceTransitionImpulse = -1;
    waterSurface.revision += 1;
    waterSurface.wakeBudgetStep = -1;
    waterSurface.wakeDepositsThisStep = 0;
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
    let changed = false;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const normalizedX = (x - point.x) / radius;
        const normalizedY = (y - point.y) / radius;
        const distanceSquared = normalizedX * normalizedX + normalizedY * normalizedY;
        if (distanceSquared >= 1) continue;
        const distanceRatio = Math.sqrt(distanceSquared);
        const falloff = 0.5 + Math.cos(distanceRatio * Math.PI) * 0.5;
        const index = y * waterSurface.width + x;
        waterSurface.current[index] = clamp(
          waterSurface.current[index] + materialAmplitude * falloff,
          -WATER_MAX_HEIGHT,
          WATER_MAX_HEIGHT
        );
        if (material.traceDeposit > 0) {
          waterSurface.pigment[index] = clamp(
            waterSurface.pigment[index] + Math.abs(materialAmplitude) * falloff * material.traceDeposit,
            0,
            1
          );
        }
        changed = true;
      }
    }
    if (changed) waterSurface.revision += 1;
  }

  function disturbMaterialWorld(worldX, worldY, amplitude, radiusXWorld, radiusYWorld, angle, phase = 0) {
    const material = activeSurfaceMaterial();
    const materialAmplitude = amplitude * material.disturbance;
    const radiusX = Math.max(8, radiusXWorld * material.radius);
    const radiusY = Math.max(8, radiusYWorld * material.radius);
    const reach = Math.max(radiusX, radiusY);
    if (!waterSurface || worldX < TABLE.left - reach || worldX > TABLE.right + reach
      || worldY < TABLE.top - reach || worldY > TABLE.bottom + reach) return;
    waterSurface.energy = Math.max(waterSurface.energy, Math.min(1, Math.abs(materialAmplitude) * 0.64));
    dateMapState.waterEnergy = Math.max(dateMapState.waterEnergy || 0, waterSurface.energy);
    dateMapFrameDirty = true;
    if (!waterSurface.renderable) return;
    const point = waterGridPoint(worldX, worldY);
    const cellWidth = (TABLE.right - TABLE.left) / (waterSurface.width - 1);
    const cellHeight = (TABLE.bottom - TABLE.top) / (waterSurface.height - 1);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const extentX = Math.sqrt(radiusX * radiusX * cosine * cosine + radiusY * radiusY * sine * sine);
    const extentY = Math.sqrt(radiusX * radiusX * sine * sine + radiusY * radiusY * cosine * cosine);
    const minX = Math.max(1, Math.floor(point.x - extentX / cellWidth));
    const maxX = Math.min(waterSurface.width - 2, Math.ceil(point.x + extentX / cellWidth));
    const minY = Math.max(1, Math.floor(point.y - extentY / cellHeight));
    const maxY = Math.min(waterSurface.height - 2, Math.ceil(point.y + extentY / cellHeight));
    let changed = false;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const worldDx = (x - point.x) * cellWidth;
        const worldDy = (y - point.y) * cellHeight;
        const localX = worldDx * cosine + worldDy * sine;
        const localY = -worldDx * sine + worldDy * cosine;
        const normalizedX = localX / radiusX;
        const normalizedY = localY / radiusY;
        const distanceSquared = normalizedX * normalizedX + normalizedY * normalizedY;
        if (distanceSquared >= 1) continue;
        const distanceRatio = Math.sqrt(distanceSquared);
        const baseFalloff = 0.5 + Math.cos(distanceRatio * Math.PI) * 0.5;
        const grain = 0.78
          + Math.sin(localX * 0.075 + phase) * 0.12
          + Math.sin(localY * 0.11 - phase * 1.37) * 0.1;
        const falloff = baseFalloff * clamp(grain, 0.54, 1);
        const index = y * waterSurface.width + x;
        waterSurface.current[index] = clamp(
          waterSurface.current[index] + materialAmplitude * falloff,
          -WATER_MAX_HEIGHT,
          WATER_MAX_HEIGHT
        );
        if (material.traceDeposit > 0) {
          waterSurface.pigment[index] = clamp(
            waterSurface.pigment[index] + Math.abs(materialAmplitude) * falloff * material.traceDeposit,
            0,
            1
          );
        }
        changed = true;
      }
    }
    if (changed) waterSurface.revision += 1;
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
    const amplitude = profile.amplitude * material.wake * (0.32 + speedRatio * 0.96);
    const phase = waterSurface.stepCount * 0.23 + data.number * 1.71;
    const cadence = ["amethyst", "rose-quartz"].includes(material.id) ? 5
      : ["galaxy", "abyss", "eclipse", "ink", "jade-mist"].includes(material.id) ? 4 : 3;
    if ((waterSurface.stepCount + data.number * 7) % cadence !== 0) return;
    if (waterSurface.wakeBudgetStep !== waterSurface.stepCount) {
      waterSurface.wakeBudgetStep = waterSurface.stepCount;
      waterSurface.wakeDepositsThisStep = 0;
    }
    if (waterSurface.wakeDepositsThisStep >= MAX_WATER_WAKE_DEPOSITS_PER_STEP) return;
    waterSurface.wakeDepositsThisStep += 1;
    const heading = Math.atan2(direction.y, direction.x);
    if (material.id === "circuit") {
      const grid = 36;
      const nodeX = Math.round((ball.position.x + normal.x * Math.sin(phase) * 26) / grid) * grid;
      const nodeY = Math.round((ball.position.y + normal.y * Math.sin(phase) * 26) / grid) * grid;
      disturbMaterialWorld(nodeX, nodeY, amplitude * 0.82, 74, 18, (waterSurface.stepCount % 2) * Math.PI / 2, phase);
      disturbMaterialWorld(nodeX + normal.x * grid, nodeY + normal.y * grid, amplitude * 0.46, 44, 15, heading + Math.PI / 2, phase + 1.8);
      disturbMaterialWorld(nodeX - direction.x * grid, nodeY - direction.y * grid, -amplitude * 0.3, 52, 14, heading, phase - 0.9);
      return;
    }
    const sideReach = material.id === "ink" ? 104
      : ["emerald", "jade-mist"].includes(material.id) ? 88
        : ["galaxy", "abyss", "eclipse"].includes(material.id) ? 82
          : ["amber", "copper"].includes(material.id) ? 72
            : ["gold", "solar-porcelain"].includes(material.id) ? 62 : 54;
    const side = Math.sin(phase * 0.74) * sideReach;
    const centerX = ball.position.x - direction.x * (28 + speedRatio * 38) + normal.x * side;
    const centerY = ball.position.y - direction.y * (28 + speedRatio * 38) + normal.y * side;
    if (["lava", "crimson-storm"].includes(material.id)) {
      const growthAngle = heading + Math.sin(phase * 0.83) * 1.18;
      disturbMaterialWorld(centerX, centerY, amplitude * 0.9, 132, 31, growthAngle, phase);
      disturbMaterialWorld(centerX + normal.x * 62, centerY + normal.y * 62, amplitude * 0.52, 92, 22, growthAngle + 1.05, phase + 2.1);
      disturbMaterialWorld(centerX - normal.x * 48, centerY - normal.y * 48, -amplitude * 0.36, 82, 26, growthAngle - 0.72, phase - 1.4);
    } else if (["gold", "solar-porcelain", "copper"].includes(material.id)) {
      const flareAngle = heading + Math.PI / 2 + Math.sin(phase * 0.61) * 0.86;
      disturbMaterialWorld(centerX, centerY, amplitude * 0.84, 164, 46, flareAngle, phase);
      disturbMaterialWorld(centerX + normal.x * 74, centerY + normal.y * 74, amplitude * 0.48, 116, 28, flareAngle + 0.92, phase + 1.8);
      disturbMaterialWorld(centerX - normal.x * 58, centerY - normal.y * 58, -amplitude * 0.31, 104, 24, flareAngle - 0.76, phase - 1.3);
    } else if (["galaxy", "abyss", "eclipse"].includes(material.id)) {
      const orbitAngle = heading + Math.PI / 2 + Math.sin(phase * 0.57) * 0.7;
      disturbMaterialWorld(centerX, centerY, amplitude * 0.78, 178, 72, orbitAngle, phase);
      disturbMaterialWorld(centerX + normal.x * 88, centerY + normal.y * 88, -amplitude * 0.66, 146, 58, orbitAngle + 0.86, phase + 1.7);
      disturbMaterialWorld(centerX - normal.x * 72, centerY - normal.y * 72, amplitude * 0.44, 122, 50, orbitAngle - 0.64, phase - 1.2);
    } else if (["amethyst", "rose-quartz"].includes(material.id)) {
      const stressAngle = heading + Math.sin(phase * 1.13) * 1.46;
      disturbMaterialWorld(centerX, centerY, amplitude * 0.82, 154, 23, stressAngle, phase);
      disturbMaterialWorld(centerX + normal.x * 58, centerY + normal.y * 58, -amplitude * 0.6, 108, 19, stressAngle + 1.24, phase + 2.4);
      disturbMaterialWorld(centerX - direction.x * 52, centerY - direction.y * 52, amplitude * 0.38, 94, 17, stressAngle - 0.92, phase - 1.7);
    } else if (material.id === "amber") {
      const viscousAngle = heading + Math.PI / 2 + Math.sin(phase * 0.43) * 0.58;
      disturbMaterialWorld(centerX, centerY, amplitude * 0.86, 196, 86, viscousAngle, phase);
      disturbMaterialWorld(centerX + normal.x * 92, centerY + normal.y * 92, -amplitude * 0.58, 148, 62, viscousAngle + 0.68, phase + 2.3);
      disturbMaterialWorld(centerX - normal.x * 74, centerY - normal.y * 74, amplitude * 0.4, 132, 54, viscousAngle - 0.55, phase - 1.5);
    } else if (["emerald", "jade-mist"].includes(material.id)) {
      const tideAngle = heading + Math.PI / 2 + Math.sin(phase * 0.51) * 0.76;
      disturbMaterialWorld(centerX, centerY, amplitude * 0.8, 214, 74, tideAngle, phase);
      disturbMaterialWorld(centerX + normal.x * 108, centerY + normal.y * 108, -amplitude * 0.54, 162, 58, tideAngle + 0.9, phase + 1.9);
      disturbMaterialWorld(centerX - normal.x * 96, centerY - normal.y * 96, amplitude * 0.46, 154, 52, tideAngle - 0.82, phase - 1.6);
    } else if (material.id === "burgundy") {
      const crystalAngle = heading + Math.sin(phase * 1.07) * 1.24;
      disturbMaterialWorld(centerX, centerY, amplitude * 0.86, 158, 24, crystalAngle, phase);
      disturbMaterialWorld(centerX + normal.x * 64, centerY + normal.y * 64, -amplitude * 0.58, 122, 18, crystalAngle + 1.18, phase + 2.4);
      disturbMaterialWorld(centerX - normal.x * 58, centerY - normal.y * 58, amplitude * 0.42, 108, 17, crystalAngle - 1.02, phase - 1.9);
    } else if (material.id === "ink") {
      const brushAngle = heading + Math.PI / 2 + Math.sin(phase * 0.49) * 0.9;
      disturbMaterialWorld(centerX, centerY, amplitude * 0.72, 224, 96, brushAngle, phase);
      disturbMaterialWorld(centerX + normal.x * 108, centerY + normal.y * 108, amplitude * 0.44, 168, 70, brushAngle + 0.74, phase + 2.2);
      disturbMaterialWorld(centerX - normal.x * 88, centerY - normal.y * 88, -amplitude * 0.28, 148, 64, brushAngle - 0.58, phase - 1.6);
    } else {
      disturbMaterialWorld(centerX, centerY, amplitude * 0.76, 148, 58, heading + Math.PI / 2, phase);
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
        const pigmentAverage = (pigment[index - 1] + pigment[index + 1]
          + pigment[index - width] + pigment[index + width]) * 0.25;
        pigmentNext[index] = clamp(
          pigment[index] * material.traceDecay + pigmentAverage * material.traceDiffuse,
          0,
          1
        );
        energy += Math.abs(value);
      }
    }
    waterSurface.previous = current;
    waterSurface.current = next;
    waterSurface.next = previous;
    waterSurface.next.fill(0);
    waterSurface.pigment = pigmentNext;
    waterSurface.pigmentNext = pigment;
    waterSurface.pigmentNext.fill(0);
    waterSurface.stepCount += 1;
    waterSurface.revision += 1;
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
      if (dateMapState.surfaceTransition) {
        const transition = dateMapState.surfaceTransition;
        const age = Math.max(0, performance.now() - transition.startedAt);
        const transitionProgress = clamp(age / transition.duration, 0, 1);
        const phase = Math.floor(age / 82);
        const origins = transition.origins?.length ? transition.origins : [transition];
        const impulseKey = `${phase}:${origins.length}`;
        if (impulseKey !== waterSurface.lastSurfaceTransitionImpulse && transitionProgress < 0.96) {
          waterSurface.lastSurfaceTransitionImpulse = impulseKey;
          origins.forEach((transitionOrigin, originIndex) => {
            const originAge = Math.max(0, performance.now() - (transitionOrigin.bornAt || transition.startedAt));
            const originProgress = clamp(originAge / (transitionOrigin.duration || transition.duration), 0, 1);
            const sweep = phase * 2.399963 + (transitionOrigin.ballNumber || 0) * 0.47 + originIndex * 1.37;
            const eased = 1 - Math.pow(1 - originProgress, 2.4);
            const xReach = (TABLE.right - TABLE.left) * 0.76 * eased;
            const yReach = (TABLE.bottom - TABLE.top) * 0.76 * eased;
            const x = transitionOrigin.x + Math.cos(sweep) * xReach;
            const y = transitionOrigin.y + Math.sin(sweep) * yReach;
            const polarity = (phase + originIndex) % 3 === 0 ? -1 : 1;
            disturbMaterialWorld(x, y, polarity * (0.38 + (1 - originProgress) * 0.62), 150, 34, sweep + Math.PI / 2, phase * 0.91 + originIndex);
          });
        }
      }
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

  function drawSurfaceReflectedLight(surfaceMaterialId, width, height) {
    const material = SURFACE_MATERIAL_BY_ID[surfaceMaterialId] || SURFACE_MATERIAL_BY_ID.ink;
    const reflectedLight = context.createLinearGradient(TABLE.left, TABLE.top, TABLE.right, TABLE.bottom);
    reflectedLight.addColorStop(0, colorWithAlpha(material.rail, surfaceMaterialId === "ink" ? 0.08 : 0.065));
    reflectedLight.addColorStop(0.28, colorWithAlpha(material.rail, 0));
    reflectedLight.addColorStop(0.72, colorWithAlpha(material.railSecondary || material.rail, 0.035));
    reflectedLight.addColorStop(1, "rgba(0,0,0,0.16)");
    context.save();
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;
    context.fillStyle = reflectedLight;
    context.fillRect(TABLE.left, TABLE.top, width, height);
    context.restore();
  }

  function renderWaterSurface(timestamp) {
    const theme = dateMapState.activeTheme || BALL_CHROMA_THEMES[0];
    const previousTheme = dateMapState.previousTheme || theme;
    const width = TABLE.right - TABLE.left;
    const height = TABLE.bottom - TABLE.top;
    const surfaceMaterialId = activeSurfaceMaterial().id;
    const artwork = surfaceArtworkFor(surfaceMaterialId);
    root.dataset.surfaceTextureState = surfaceTextureCache.get(surfaceMaterialId)?.ready ? "ready" : "fallback";
    if (surfaceRenderer && artwork) {
      const surfaceTransition = dateMapState.surfaceTransition;
      const transitionOrigins = surfaceTransition
        ? (surfaceTransition.origins?.length ? surfaceTransition.origins : [surfaceTransition]).map((origin) => ({
            ...origin,
            progress: clamp((timestamp - (origin.bornAt || surfaceTransition.startedAt)) / (origin.duration || surfaceTransition.duration), 0, 1)
          }))
        : [];
      const transitionProgress = transitionOrigins.length
        ? Math.max(...transitionOrigins.map((origin) => origin.progress))
        : 1;
      const transitionComplete = transitionOrigins.length > 0
        && transitionOrigins.every((origin) => origin.progress >= 1);
      const previousArtwork = surfaceTransition
        ? surfaceArtworkFor(surfaceTransition.from) || artwork
        : artwork;
      const blast = dateMapState.blackEightBlast;
      const blastProgress = blast ? clamp(blast.ageMs / blast.duration, 0, 1) : 0;
      const blastStrength = blast
        ? Math.sin(blastProgress * Math.PI)
        : 0;
      const blastInward = blast ? smoothStep(0.025, 0.3, blastProgress) : 1;
      const blastWorldX = blast
        ? blast.originX + (WORLD.width / 2 - blast.originX) * blastInward
        : WORLD.width / 2;
      const blastWorldY = blast
        ? blast.originY + (WORLD.height / 2 - blast.originY) * blastInward
        : WORLD.height / 2;
      const renderedSurface = surfaceRenderer.render({
        base: artwork,
        previousBase: previousArtwork,
        materialId: surfaceMaterialId,
        current: waterSurface.current,
        pigment: waterSurface.pigment,
        fieldRevision: waterSurface.revision,
        fieldWidth: waterSurface.width,
        fieldHeight: waterSurface.height,
        width,
        height,
        time: timestamp,
        energy: waterSurface.energy,
        blast: blastStrength,
        blastProgress,
        blastOriginX: clamp((blastWorldX - TABLE.left) / width, 0, 1),
        blastOriginY: 1 - clamp((blastWorldY - TABLE.top) / height, 0, 1),
        transition: surfaceTransition ? {
          progress: transitionProgress,
          originX: clamp((surfaceTransition.originX - TABLE.left) / width, 0, 1),
          originY: 1 - clamp((surfaceTransition.originY - TABLE.top) / height, 0, 1),
          color: colorChannels(surfaceTransition.color || theme.primary).map((channel) => channel / 255),
          origins: transitionOrigins.map((origin) => ({
            originX: clamp((origin.x - TABLE.left) / width, 0, 1),
            originY: 1 - clamp((origin.y - TABLE.top) / height, 0, 1),
            progress: origin.progress,
            color: colorChannels(origin.color || surfaceTransition.color || theme.primary).map((channel) => channel / 255)
          }))
        } : null
      });
      if (renderedSurface) {
        root.dataset.surfaceBackend = "webgl";
        context.save();
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(renderedSurface, TABLE.left, TABLE.top, width, height);
        context.restore();
        drawSurfaceReflectedLight(surfaceMaterialId, width, height);
        if (surfaceTransition && transitionComplete) dateMapState.surfaceTransition = null;
        return;
      }
      surfaceRendererFailed = true;
      surfaceRenderer = null;
    }
    root.dataset.surfaceBackend = "canvas";
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
        const physicalSlope = Math.hypot(gradientX, gradientY);
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

        const traceValue = pigment[index];
        const traceGradient = Math.abs(pigment[index + 1] - pigment[index - 1])
          + Math.abs(pigment[index + waterSurface.width] - pigment[index - waterSurface.width]);
        let responseStrength = 0;
        if (["lava", "gold", "amber", "crimson-storm", "copper", "solar-porcelain"].includes(surfaceMaterialId)) {
          const fissureField = Math.abs(flowA * 0.48 + flowB * 0.34 + flowC * 0.18);
          const fissure = Math.pow(clamp(fissureField + surfaceHeight * 0.035, 0, 1), 8.5);
          const heat = clamp(traceValue * 0.96 + slope * 0.4 + Math.abs(surfaceHeight) * 0.12 + fissure * 0.34, 0, 1);
          const moltenCore = Math.pow(heat, 2.2);
          red = 8 + diffuse * 7 + heat * 190 + moltenCore * 82 + specular * 34;
          green = 4 + diffuse * 3 + heat * 45 + moltenCore * 112 + specular * 14;
          blue = 3 + heat * 6 + moltenCore * 18;
          responseStrength = clamp(traceGradient * 3.4 + physicalSlope * 1.62 + traceValue * 0.12, 0, 1);
        } else if (["galaxy", "abyss", "emerald", "jade-mist", "eclipse"].includes(surfaceMaterialId)) {
          const nebula = clamp(0.5 + flowA * 0.22 + flowB * 0.18 + flowC * 0.14, 0, 1);
          const wake = clamp(traceValue * 0.9 + slope * 0.34 + Math.abs(surfaceHeight) * 0.08, 0, 1);
          red = 3 + nebula * 17 + primaryR * wake * 0.43 + secondaryR * wake * 0.22;
          green = 7 + nebula * 23 + primaryG * wake * 0.42 + secondaryG * wake * 0.18;
          blue = 24 + nebula * 46 + primaryB * wake * 0.55 + secondaryB * wake * 0.3;
          responseStrength = clamp(traceValue * 0.46 + traceGradient * 1.12 + physicalSlope * 1.2 + Math.abs(surfaceHeight) * 0.12, 0, 1);
        } else if (surfaceMaterialId === "circuit") {
          const gridX = Math.pow(clamp(1 - Math.abs(x % 12 - 6) / 6, 0, 1), 18);
          const gridY = Math.pow(clamp(1 - Math.abs(y % 12 - 6) / 6, 0, 1), 18);
          const grid = Math.max(gridX, gridY);
          const charge = clamp(traceValue + slope * 0.48 + Math.abs(surfaceHeight) * 0.09, 0, 1);
          const pulse = 0.64 + Math.sin(time * 5.2 + x * 0.16 + y * 0.07) * 0.36;
          red = 2 + grid * 8 + secondaryR * charge * 0.45 + specular * 22;
          green = 8 + grid * 24 + primaryG * charge * (0.54 + pulse * 0.26) + specular * 45;
          blue = 24 + grid * 48 + primaryB * charge * 0.72 + secondaryB * charge * 0.24 + specular * 68;
          responseStrength = clamp(traceValue * 0.08 + traceGradient * 2.7 + physicalSlope * 1.92, 0, 1);
        } else if (["amethyst", "burgundy", "rose-quartz"].includes(surfaceMaterialId)) {
          const crystal = Math.abs(flowA * 0.5 + flowB * 0.31 + flowC * 0.19 + surfaceHeight * 0.05);
          const facet = Math.pow(clamp(crystal, 0, 1), 7.4);
          const iceEdge = clamp(slope * 0.9 + Math.abs(surfaceHeight) * 0.09 + traceValue * 0.56, 0, 1);
          red = 8 + diffuse * 20 + facet * 46 + iceEdge * 76 + specular * 108;
          green = 33 + diffuse * 32 + facet * 67 + iceEdge * 104 + specular * 132;
          blue = 65 + diffuse * 42 + facet * 92 + iceEdge * 138 + specular * 155;
          responseStrength = clamp(traceGradient * 3.5 + physicalSlope * 2.24 + traceValue * 0.035, 0, 1);
        } else {
          const paperFiber = Math.sin(x * 1.31 + y * 0.17) * 1.8 + Math.sin(y * 0.83 - x * 0.09) * 1.1;
          const pigmentValue = traceValue;
          const pigmentGradient = traceGradient;
          const inkFlow = clamp(pigmentValue * (0.88 + flowC * 0.08)
            + Math.abs(surfaceHeight) * 0.022, 0, 1);
          const inkBody = smoothStep(0.075, 0.58, inkFlow);
          const dryBrush = clamp(pigmentGradient * 2.8 + slope * pigmentValue * 0.24, 0, 1);
          const paper = 205 + paperFiber;
          const inkTone = paper - inkBody * 198 - dryBrush * 34;
          const wetEdge = specular * (8 + inkBody * 18) + pigmentGradient * 32;
          red = inkTone + wetEdge;
          green = inkTone + 5 + wetEdge;
          blue = inkTone + 1 + wetEdge * 0.82;
          responseStrength = clamp(traceValue * 1.08 + physicalSlope * 0.86 + Math.abs(surfaceHeight) * 0.1, 0, 1);
        }

        const blastWave = 0.58 + Math.sin(spectralPhase) * 0.42;
        const blastTint = ["lava", "gold", "amber", "crimson-storm", "copper", "solar-porcelain"].includes(surfaceMaterialId) ? [76, 26, 3]
          : ["galaxy", "abyss", "emerald", "jade-mist", "eclipse"].includes(surfaceMaterialId) ? [34 + blastWave * 20, 38 + (1 - blastWave) * 26, 84]
            : surfaceMaterialId === "circuit" ? [34 + (1 - blastWave) * 52, 78, 82 + blastWave * 28]
              : ["amethyst", "burgundy", "rose-quartz"].includes(surfaceMaterialId) ? [74, 46, 106]
                : [42, 42, 38];
        pixels[offset] = clamp(red * eclipse + spectralStrength * blastTint[0], 0, 255);
        pixels[offset + 1] = clamp(green * eclipse + spectralStrength * blastTint[1], 0, 255);
        pixels[offset + 2] = clamp(blue * eclipse + spectralStrength * blastTint[2], 0, 255);
        const responseAlpha = surfaceMaterialId === "circuit" ? 180
          : ["lava", "gold", "amber", "crimson-storm", "copper", "solar-porcelain"].includes(surfaceMaterialId) ? 220
            : ["amethyst", "burgundy", "rose-quartz"].includes(surfaceMaterialId) ? 168
              : surfaceMaterialId === "ink" ? 196
                : 184;
        pixels[offset + 3] = clamp(
          smoothStep(0.025, surfaceMaterialId === "ink" ? 0.66 : 0.58, responseStrength) * responseAlpha
            + spectralStrength * 235,
          0,
          255
        );
      }
    }
    waterSurface.context.putImageData(waterSurface.imageData, 0, 0);
    context.save();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    drawSurfaceArtwork(surfaceMaterialId);
    if (surfaceMaterialId === "ink") {
      context.globalCompositeOperation = "multiply";
      context.globalAlpha = 0.72;
      context.drawImage(waterSurface.canvas, TABLE.left, TABLE.top, width, height);
    } else {
      context.globalCompositeOperation = "screen";
      if (surfaceMaterialId !== "circuit" && surfaceMaterialId !== "amethyst") {
        context.globalAlpha = ["lava", "crimson-storm", "copper"].includes(surfaceMaterialId) ? 0.16 : 0.13;
        context.filter = "blur(7px)";
        context.drawImage(waterSurface.canvas, TABLE.left, TABLE.top, width, height);
        context.filter = "none";
      }
      context.globalAlpha = ["lava", "crimson-storm", "copper"].includes(surfaceMaterialId) ? 0.72
        : surfaceMaterialId === "circuit" ? 0.48
          : surfaceMaterialId === "amethyst" ? 0.44
            : 0.64;
      context.drawImage(waterSurface.canvas, TABLE.left, TABLE.top, width, height);
    }
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;
    context.restore();
    drawSurfaceReflectedLight(surfaceMaterialId, width, height);
  }

  function railBounds() {
    return {
      left: TABLE.left,
      right: TABLE.right,
      top: TABLE.top,
      bottom: TABLE.bottom
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

  function circularRailDistance(left, right, perimeter = railPerimeterLength()) {
    const direct = Math.abs(left - right) % perimeter;
    return Math.min(direct, perimeter - direct);
  }

  function renderCushionLightResponse(timestamp) {
    const perimeter = railPerimeterLength();
    const surface = activeSurfaceMaterial();
    const baseColor = colorChannels(surface.rail);
    const secondaryColor = colorChannels(surface.railSecondary || surface.rail);
    const blast = dateMapState.blackEightBlast;
    const blastProgress = blast ? clamp(blast.ageMs / blast.duration, 0, 1) : 0;
    let peak = 0;
    context.save();
    context.globalCompositeOperation = "screen";
    const lightRails = rails.filter((rail) => rail.plugin.heartbeatRail?.kind === "cushion");
    lightRails.forEach((rail) => {
      const railShape = rail.plugin.heartbeatRail;
      const horizontal = railShape.width >= railShape.height;
      const length = horizontal ? railShape.width : railShape.height;
      const segmentCount = Math.max(3, Math.ceil(length / RAIL_LED_SEGMENT_LENGTH));
      for (let segment = 0; segment < segmentCount; segment += 1) {
        const centerRatio = (segment + 0.5) / segmentCount;
        const center = horizontal
          ? { x: rail.position.x - railShape.width / 2 + railShape.width * centerRatio, y: rail.position.y }
          : { x: rail.position.x, y: rail.position.y - railShape.height / 2 + railShape.height * centerRatio };
        const centerDistance = railDistanceForContact(center.x, center.y);
        let brightness = 0;
        let red = baseColor[0];
        let green = baseColor[1];
        let blue = baseColor[2];
        dateMapState.railBursts.forEach((wave) => {
          const ageSeconds = wave.ageMs / 1000;
          const front = wave.speed * ageSeconds;
          const clockwise = circularRailDistance(centerDistance, wave.originS + front, perimeter);
          const counterClockwise = circularRailDistance(centerDistance, wave.originS - front, perimeter);
          const distanceToFront = Math.min(clockwise, counterClockwise);
          const waveShape = Math.pow(clamp(1 - distanceToFront / wave.width, 0, 1), 2);
          const echoFront = Math.max(0, front - wave.width * 0.92);
          const echoClockwise = circularRailDistance(centerDistance, wave.originS + echoFront, perimeter);
          const echoCounterClockwise = circularRailDistance(centerDistance, wave.originS - echoFront, perimeter);
          const echoDistance = Math.min(echoClockwise, echoCounterClockwise);
          const echoShape = Math.pow(clamp(1 - echoDistance / (wave.width * 1.55), 0, 1), 3) * 0.34;
          const waveLife = clamp(1 - wave.ageMs / wave.duration, 0, 1);
          const contribution = (waveShape + echoShape) * waveLife * (0.42 + wave.intensity * 0.72);
          if (contribution > brightness) {
            const secondary = colorChannels(wave.secondary || wave.color);
            const spectralMix = 0.16 + echoShape * 0.62;
            red = wave.rgb[0] + (secondary[0] - wave.rgb[0]) * spectralMix;
            green = wave.rgb[1] + (secondary[1] - wave.rgb[1]) * spectralMix;
            blue = wave.rgb[2] + (secondary[2] - wave.rgb[2]) * spectralMix;
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
          brightness += pocketIgnition * 0.08 + chaseWave * 1.18 + climax * 0.92;
          const spectral = centerDistance / perimeter * Math.PI * 2 + blastProgress * 15 + pocketIndex * 0.2;
          const blend = 0.5 + Math.sin(spectral * (surface.id === "circuit" ? 2.6 : 1.2)) * 0.5;
          red = baseColor[0] + (secondaryColor[0] - baseColor[0]) * blend;
          green = baseColor[1] + (secondaryColor[1] - baseColor[1]) * blend;
          blue = baseColor[2] + (secondaryColor[2] - baseColor[2]) * blend;
        }
        brightness = clamp(brightness, 0, 1);
        peak = Math.max(peak, brightness);
        if (brightness < 0.035) return;
        const color = `rgb(${Math.round(clamp(red, 0, 255))},${Math.round(clamp(green, 0, 255))},${Math.round(clamp(blue, 0, 255))})`;
        const segmentLength = length / segmentCount * 1.22;
        const thickness = (horizontal ? railShape.height : railShape.width) * 0.92;
        const glowGradient = horizontal
          ? context.createLinearGradient(center.x - segmentLength / 2, center.y, center.x + segmentLength / 2, center.y)
          : context.createLinearGradient(center.x, center.y - segmentLength / 2, center.x, center.y + segmentLength / 2);
        const rgba = (alpha) => `rgba(${Math.round(red)},${Math.round(green)},${Math.round(blue)},${alpha})`;
        glowGradient.addColorStop(0, rgba(0));
        glowGradient.addColorStop(0.18, rgba(brightness * 0.22));
        glowGradient.addColorStop(0.5, rgba(brightness * 0.76));
        glowGradient.addColorStop(0.82, rgba(brightness * 0.22));
        glowGradient.addColorStop(1, rgba(0));
        context.globalAlpha = 1;
        context.fillStyle = glowGradient;
        context.shadowColor = color;
        context.shadowBlur = 8 + brightness * 24;
        if (horizontal) {
          context.fillRect(center.x - segmentLength / 2, center.y - thickness / 2, segmentLength, thickness);
        } else {
          context.fillRect(center.x - thickness / 2, center.y - segmentLength / 2, thickness, segmentLength);
        }
        const coreGradient = horizontal
          ? context.createLinearGradient(center.x - segmentLength / 2, center.y, center.x + segmentLength / 2, center.y)
          : context.createLinearGradient(center.x, center.y - segmentLength / 2, center.x, center.y + segmentLength / 2);
        coreGradient.addColorStop(0, "rgba(255,255,255,0)");
        coreGradient.addColorStop(0.36, rgba(brightness * 0.52));
        coreGradient.addColorStop(0.5, `rgba(255,255,255,${brightness * 0.82})`);
        coreGradient.addColorStop(0.64, rgba(brightness * 0.52));
        coreGradient.addColorStop(1, "rgba(255,255,255,0)");
        context.shadowBlur = 2 + brightness * 8;
        context.fillStyle = coreGradient;
        const coreThickness = Math.max(1.4, thickness * 0.22);
        if (horizontal) {
          context.fillRect(center.x - segmentLength / 2, center.y - coreThickness / 2, segmentLength, coreThickness);
        } else {
          context.fillRect(center.x - coreThickness / 2, center.y - segmentLength / 2, coreThickness, segmentLength);
        }
      }
    });
    context.shadowBlur = 0;
    dateMapState.railWavePeak = peak;
    context.restore();
  }

  function ensureCushionLightFrameCanvas() {
    if (cushionLightFrameCanvas && cushionLightFrameContext) return true;
    const cache = document.createElement("canvas");
    if (typeof cache.getContext !== "function") return false;
    cache.width = WORLD.width;
    cache.height = WORLD.height;
    const cacheContext = cache.getContext("2d", { alpha: true });
    if (!cacheContext) return false;
    cushionLightFrameCanvas = cache;
    cushionLightFrameContext = cacheContext;
    cushionLightFrameDirty = true;
    return true;
  }

  function rebuildCushionLightFrame(timestamp) {
    if (!ensureCushionLightFrameCanvas()) return false;
    const liveContext = context;
    try {
      context = cushionLightFrameContext;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, WORLD.width, WORLD.height);
      renderCushionLightResponse(timestamp);
    } finally {
      context = liveContext;
    }
    cushionLightFrameUpdatedAt = timestamp;
    cushionLightFrameDirty = false;
    cushionLightFramesSinceRebuild = 0;
    return true;
  }

  function drawCushionLightResponse(timestamp) {
    cushionLightFramesSinceRebuild += 1;
    const active = dateMapState.railBursts.length > 0 || Boolean(dateMapState.blackEightBlast);
    const needsFinalClear = cushionLightHadActivity && !active;
    const refreshDue = timestamp - cushionLightFrameUpdatedAt >= DATE_MAP_REFRESH_MS;
    const frameBudgetReady = cushionLightFramesSinceRebuild >= 2;
    if ((!cushionLightFrameCanvas
        || (active || needsFinalClear || cushionLightFrameDirty) && refreshDue && frameBudgetReady)
        && !rebuildCushionLightFrame(timestamp)) {
      renderCushionLightResponse(timestamp);
      return;
    }
    cushionLightHadActivity = active;
    context.drawImage(cushionLightFrameCanvas, 0, 0, WORLD.width, WORLD.height);
  }

  function drawPocketPortSignature(pocket, profile, level, timestamp, pocketIndex, radius) {
    const phase = timestamp * 0.001 + pocketIndex * 1.37;
    const inwardAngle = Math.atan2(pocket.inwardY, pocket.inwardX);
    context.save();
    context.translate(pocket.x, pocket.y);
    context.rotate(inwardAngle);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.shadowColor = profile.primary;
    context.shadowBlur = 7 + level * 15;
    if (profile.id === "ripple") {
      for (let ring = 0; ring < 4; ring += 1) {
        const spread = radius * (0.84 + ring * 0.2) + (phase * 9 + ring * 8) % 10;
        context.globalAlpha = level * (0.64 - ring * 0.1);
        context.strokeStyle = ring % 2 ? profile.secondary : profile.primary;
        context.lineWidth = 2.4 - ring * 0.28;
        context.beginPath();
        ellipsePath(context, 0, 0, spread, spread * 0.46, 0, -2.7, 2.7);
        context.stroke();
      }
    } else if (profile.id === "comet") {
      for (let ribbon = -2; ribbon <= 2; ribbon += 1) {
        const sway = ribbon * 7 + Math.sin(phase * 2 + ribbon) * 3;
        context.globalAlpha = level * (0.58 - Math.abs(ribbon) * 0.08);
        context.strokeStyle = ribbon % 2 ? profile.secondary : profile.primary;
        context.lineWidth = 1.4 + (2 - Math.abs(ribbon)) * 0.8;
        context.beginPath();
        context.moveTo(radius * 0.68, sway * 0.25);
        context.bezierCurveTo(radius * 1.1, sway, radius * 1.52, -sway * 0.4, radius * (1.94 + ribbon * 0.06), sway * 1.4);
        context.stroke();
      }
    } else if (profile.id === "prism") {
      const colors = [profile.primary, "#ffffff", profile.secondary];
      colors.forEach((color, channel) => {
        const offset = (channel - 1) * 5;
        context.globalAlpha = level * 0.6;
        context.strokeStyle = color;
        context.lineWidth = 1.35;
        context.beginPath();
        context.moveTo(radius * 0.7, offset);
        context.lineTo(radius * 1.2, -radius * 0.68 + offset);
        context.lineTo(radius * 1.62, offset * 1.6);
        context.lineTo(radius * 1.2, radius * 0.68 + offset);
        context.stroke();
      });
    } else if (profile.id === "pulse") {
      context.rotate(phase * 0.32);
      for (let ring = 0; ring < 3; ring += 1) {
        context.setLineDash([5 + ring * 3, 7 + ring * 2]);
        context.lineDashOffset = -phase * (12 + ring * 4);
        context.globalAlpha = level * (0.68 - ring * 0.14);
        context.strokeStyle = ring % 2 ? profile.secondary : profile.primary;
        context.lineWidth = 2.3 - ring * 0.35;
        context.beginPath();
        context.arc(0, 0, radius * (0.92 + ring * 0.22), 0, Math.PI * 2);
        context.stroke();
      }
      context.setLineDash([]);
    } else if (profile.id === "lightning") {
      for (let branch = -2; branch <= 2; branch += 1) {
        const direction = branch * 0.25 + Math.sin(phase * 3 + branch) * 0.08;
        context.globalAlpha = level * (0.72 - Math.abs(branch) * 0.09);
        context.strokeStyle = branch === 0 ? "#ffffff" : branch % 2 ? profile.secondary : profile.primary;
        context.lineWidth = branch === 0 ? 2.4 : 1.25;
        context.beginPath();
        let x = radius * 0.65;
        let y = branch * 4;
        context.moveTo(x, y);
        for (let step = 1; step <= 4; step += 1) {
          x = radius * (0.65 + step * 0.3);
          y += Math.sin(phase * 5 + branch * 2.3 + step * 1.8) * (5 + step * 1.5) + direction * 5;
          context.lineTo(x, y);
        }
        context.stroke();
      }
    } else {
      for (let ribbon = -2; ribbon <= 2; ribbon += 1) {
        const offset = ribbon * 7;
        context.globalAlpha = level * (0.42 - Math.abs(ribbon) * 0.04);
        context.strokeStyle = ribbon % 2 ? profile.secondary : profile.primary;
        context.lineWidth = 4.8 - Math.abs(ribbon) * 0.55;
        context.beginPath();
        context.moveTo(radius * 0.62, offset * 0.25);
        context.bezierCurveTo(
          radius * 1.02, -24 + offset + Math.sin(phase + ribbon) * 7,
          radius * 1.48, 25 + offset - Math.sin(phase * 1.3 + ribbon) * 8,
          radius * 1.94, offset * 0.55
        );
        context.stroke();
      }
    }
    context.restore();
  }

  function drawPocketLightPorts(timestamp) {
    const blast = dateMapState.blackEightBlast;
    const surface = activeSurfaceMaterial();
    const theme = dateMapState.activeTheme || BALL_CHROMA_THEMES[0];
    const blastProgress = blast ? clamp(blast.ageMs / blast.duration, 0, 1) : 0;
    context.save();
    context.globalCompositeOperation = "screen";
    POCKETS.forEach((pocket, pocketIndex) => {
      const profile = POCKET_VFX_PROFILES[pocket.id];
      const active = dateMapState.activeEffect?.pocketId === pocket.id;
      const ignition = blast ? smoothStep(pocketIndex / 8, pocketIndex / 8 + 0.1, blastProgress) : 0;
      const flare = dateMapState.pocketFlares.reduce((peak, item) => item.pocketId === pocket.id ? Math.max(peak, item.life) : peak, 0);
      const level = clamp(0.19 + (active ? 0.28 : 0) + flare * 0.64 + ignition * 0.8, 0, 1);
      const radius = POCKET_RADIUS + 5.5;
      const channels = [theme.glow, surface.rail, surface.railSecondary || theme.secondary];
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
      drawPocketPortSignature(pocket, profile, level, timestamp, pocketIndex, radius);
      if (flare > 0.02) {
        const glowRadius = 48 + (1 - flare) * 92;
        const glow = context.createRadialGradient(pocket.x, pocket.y, POCKET_RADIUS * 0.45, pocket.x, pocket.y, glowRadius);
        const flarePrimary = channels[0];
        const flareSecondary = channels[1];
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

  function collectSurfaceInfluences() {
    const groups = new Map();
    dateMapState.rollingTrails.forEach((trail) => {
      if (trail.life < 0.035) return;
      if (!groups.has(trail.ballNumber)) groups.set(trail.ballNumber, []);
      groups.get(trail.ballNumber).push(trail);
    });
    const influences = [];
    groups.forEach((trails, ballNumber) => {
      const recent = trails.slice(-64);
      const ratios = recent.length > 24 ? [0.24, 0.5, 0.74, 1]
        : recent.length > 12 ? [0.36, 0.68, 1]
          : [1];
      [...new Set(ratios.map((ratio) => Math.max(0, Math.ceil(recent.length * ratio) - 1)))]
        .forEach((index, nodeIndex) => {
          const trail = recent[index];
          const dx = trail.x2 - trail.x1;
          const dy = trail.y2 - trail.y1;
          const length = Math.max(0.001, Math.hypot(dx, dy));
          const directionX = dx / length;
          const directionY = dy / length;
          const normalX = -directionY;
          const normalY = directionX;
          const seed = ballNumber * 1.713 + index * 0.619 + trail.bornAt * 0.00037;
          const side = Math.sin(seed * 2.71 + nodeIndex * 1.9) * (18 + ballNumber % 4 * 5);
          influences.push({
            x: trail.x2 + normalX * side,
            y: trail.y2 + normalY * side,
            directionX,
            directionY,
            normalX,
            normalY,
            angle: Math.atan2(directionY, directionX),
            alpha: clamp(trail.life, 0, 1) ** 1.16,
            seed,
            speed: trail.speed,
            color: trail.color,
            secondary: trail.secondary,
            ballNumber
          });
        });
    });
    return influences
      .sort((left, right) => right.alpha * (0.7 + right.speed * 0.02) - left.alpha * (0.7 + left.speed * 0.02))
      .slice(0, 12);
  }

  function traceOrganicInfluencePath(centerX, centerY, radiusX, radiusY, angle, seed, phase) {
    const points = [];
    for (let index = 0; index < 14; index += 1) {
      const theta = index / 14 * Math.PI * 2;
      const noise = 0.82
        + Math.sin(seed * 2.3 + index * 1.73 + phase) * 0.12
        + Math.sin(seed * 0.91 - index * 2.17) * 0.06;
      const localX = Math.cos(theta) * radiusX * noise;
      const localY = Math.sin(theta) * radiusY * noise;
      points.push({
        x: centerX + localX * Math.cos(angle) - localY * Math.sin(angle),
        y: centerY + localX * Math.sin(angle) + localY * Math.cos(angle)
      });
    }
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.closePath();
  }

  function drawSurfaceArtworkPatch(artwork, centerX, centerY, radius, options = {}) {
    if (!artwork) return;
    const tableWidth = TABLE.right - TABLE.left;
    const tableHeight = TABLE.bottom - TABLE.top;
    const margin = radius * 1.42;
    const localLeft = clamp(centerX - TABLE.left - margin, 0, tableWidth);
    const localTop = clamp(centerY - TABLE.top - margin, 0, tableHeight);
    const localRight = clamp(centerX - TABLE.left + margin, 0, tableWidth);
    const localBottom = clamp(centerY - TABLE.top + margin, 0, tableHeight);
    const localWidth = localRight - localLeft;
    const localHeight = localBottom - localTop;
    if (localWidth <= 0 || localHeight <= 0) return;
    const sourceX = localLeft / tableWidth * artwork.width;
    const sourceY = localTop / tableHeight * artwork.height;
    const sourceWidth = localWidth / tableWidth * artwork.width;
    const sourceHeight = localHeight / tableHeight * artwork.height;
    context.save();
    context.globalAlpha = options.alpha ?? 0.5;
    context.globalCompositeOperation = options.composite || "source-over";
    context.filter = options.filter || "none";
    context.translate(centerX, centerY);
    context.rotate(options.rotation || 0);
    context.scale(options.scale || 1, options.scaleY || options.scale || 1);
    context.translate(-centerX, -centerY);
    context.drawImage(
      artwork,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      TABLE.left + localLeft + (options.offsetX || 0),
      TABLE.top + localTop + (options.offsetY || 0),
      localWidth,
      localHeight
    );
    context.restore();
  }

  function drawMaterialDisplacementFields(timestamp, influences) {
    const artwork = surfaceArtworkCache.get(activeSurfaceMaterial().id);
    if (!artwork || !influences.length) return;
    const materialId = activeSurfaceMaterial().id;
    influences.forEach((node, index) => {
      const phase = node.seed + timestamp * 0.00034;
      const speedGain = clamp(node.speed / 24, 0.18, 1);
      context.save();
      if (["lava", "gold", "amber", "crimson-storm", "copper", "solar-porcelain"].includes(materialId)) {
        const radius = 78 + speedGain * 78;
        const angle = node.angle + Math.sin(phase * 0.73) * 0.72;
        traceOrganicInfluencePath(node.x, node.y, radius, radius * 0.52, angle, node.seed, phase);
        context.clip();
        drawSurfaceArtworkPatch(artwork, node.x, node.y, radius, {
          alpha: node.alpha * 0.66,
          offsetX: node.normalX * Math.sin(phase * 2.1) * 8,
          offsetY: node.normalY * Math.sin(phase * 2.1) * 8,
          rotation: Math.sin(phase) * 0.026,
          scale: 1.018 + speedGain * 0.018,
          filter: "blur(1.3px)"
        });
        const heat = context.createRadialGradient(node.x, node.y, 2, node.x, node.y, radius);
        heat.addColorStop(0, `rgba(255,218,96,${node.alpha * 0.14})`);
        heat.addColorStop(0.44, `rgba(255,83,9,${node.alpha * 0.1})`);
        heat.addColorStop(1, "rgba(255,32,0,0)");
        context.globalCompositeOperation = "screen";
        context.fillStyle = heat;
        context.fillRect(node.x - radius, node.y - radius, radius * 2, radius * 2);
      } else if (["galaxy", "abyss", "emerald", "jade-mist", "eclipse"].includes(materialId)) {
        const radius = 96 + speedGain * 94;
        context.beginPath();
        ellipsePath(context, node.x, node.y, radius, radius * 0.58, node.angle + phase * 0.08, 0, Math.PI * 2);
        context.clip();
        drawSurfaceArtworkPatch(artwork, node.x, node.y, radius, {
          alpha: node.alpha * 0.72,
          rotation: Math.sin(phase * 0.61) * 0.055,
          scale: 1.035 + speedGain * 0.03,
          scaleY: 0.99 + speedGain * 0.016,
          composite: "screen"
        });
      } else if (materialId === "circuit") {
        const grid = 36;
        const centerX = Math.round(node.x / grid) * grid;
        const centerY = Math.round(node.y / grid) * grid;
        const width = grid * (3 + (index + node.ballNumber) % 3);
        const height = grid * (2 + (index + 1) % 2);
        context.beginPath();
        context.moveTo(centerX - width / 2, centerY - height / 2);
        context.lineTo(centerX + width / 2, centerY - height / 2);
        context.lineTo(centerX + width / 2, centerY + height / 2);
        context.lineTo(centerX - width / 2, centerY + height / 2);
        context.closePath();
        context.clip();
        drawSurfaceArtworkPatch(artwork, centerX, centerY, Math.max(width, height), {
          alpha: node.alpha * 0.2,
          offsetX: Math.sin(phase * 4.2) * 4,
          offsetY: Math.cos(phase * 3.7) * 2,
          composite: "source-over"
        });
      } else if (["amethyst", "burgundy", "rose-quartz"].includes(materialId)) {
        const radius = 82 + speedGain * 82;
        for (let facet = 0; facet < 4; facet += 1) {
          const facetAngle = node.seed + facet * 1.67;
          const facetRadius = radius * (0.5 + facet * 0.13);
          context.save();
          context.beginPath();
          context.moveTo(node.x, node.y);
          context.lineTo(node.x + Math.cos(facetAngle - 0.31) * facetRadius, node.y + Math.sin(facetAngle - 0.31) * facetRadius);
          context.lineTo(node.x + Math.cos(facetAngle + 0.42) * facetRadius * 1.18, node.y + Math.sin(facetAngle + 0.42) * facetRadius * 1.18);
          context.closePath();
          context.clip();
          drawSurfaceArtworkPatch(artwork, node.x, node.y, radius, {
            alpha: node.alpha * (0.2 + facet * 0.035),
            offsetX: Math.cos(facetAngle) * (4 + facet * 1.5),
            offsetY: Math.sin(facetAngle) * (4 + facet * 1.5),
            scale: 1.008 + facet * 0.006,
            composite: "source-over"
          });
          context.restore();
        }
      } else {
        const radius = 112 + speedGain * 108;
        const angle = node.angle + Math.PI / 2 + Math.sin(phase * 0.53) * 0.68;
        context.translate(node.x, node.y);
        context.rotate(angle);
        context.scale(1, 0.56);
        const wash = context.createRadialGradient(0, 0, 4, 0, 0, radius);
        wash.addColorStop(0, `rgba(1,11,9,${node.alpha * 0.22})`);
        wash.addColorStop(0.36, `rgba(5,26,21,${node.alpha * 0.13})`);
        wash.addColorStop(0.72, `rgba(18,42,35,${node.alpha * 0.045})`);
        wash.addColorStop(1, "rgba(20,44,36,0)");
        context.globalCompositeOperation = "multiply";
        context.fillStyle = wash;
        context.fillRect(-radius, -radius, radius * 2, radius * 2);
      }
      context.restore();
    });
  }

  function drawPocketMotionSignatures(timestamp) {
    if (!dateMapState.rollingTrails.length) return;
    const latestByBall = new Map();
    dateMapState.rollingTrails.forEach((trail) => {
      if (trail.life > 0.035) latestByBall.set(trail.ballNumber, trail);
    });
    const surface = activeSurfaceMaterial();
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    [...latestByBall.values()].slice(-16).forEach((node, nodeIndex) => {
      const profile = POCKET_VFX_BY_ID[node.effectId] || POCKET_VFX_BY_ID.ripple;
      const dx = node.x2 - node.x1;
      const dy = node.y2 - node.y1;
      const length = Math.max(0.001, Math.hypot(dx, dy));
      const speed = clamp(node.speed / 22, 0.12, 1);
      const alpha = clamp(node.life, 0, 1) * (0.22 + speed * 0.42);
      const heading = Math.atan2(dy, dx);
      const phase = timestamp * 0.0014 + node.ballNumber * 1.73 + nodeIndex * 0.63;
      const reach = 28 + speed * 58;
      context.save();
      context.translate(node.x2, node.y2);
      context.rotate(heading);
      context.globalCompositeOperation = "screen";
      context.shadowColor = surface.rail;
      context.shadowBlur = 4 + speed * 10;
      if (profile.id === "ripple") {
        for (let ring = 0; ring < 3; ring += 1) {
          const radius = reach * (0.46 + ring * 0.32) + (phase * 8 + ring * 9) % 11;
          context.globalAlpha = alpha * (0.58 - ring * 0.12);
          context.strokeStyle = ring % 2 ? profile.secondary : node.color;
          context.lineWidth = 3.2 - ring * 0.62;
          context.beginPath();
          ellipsePath(context, -reach * 0.16, Math.sin(phase + ring) * 8, radius * 1.38, radius * 0.48, -0.18, -2.74, 2.64);
          context.stroke();
        }
      } else if (profile.id === "comet") {
        const plume = context.createRadialGradient(-reach * 0.35, 0, 2, -reach * 0.35, 0, reach * 0.92);
        plume.addColorStop(0, colorWithAlpha("#fff6c8", alpha * 0.34));
        plume.addColorStop(0.24, colorWithAlpha(node.color, alpha * 0.24));
        plume.addColorStop(1, colorWithAlpha(profile.secondary, 0));
        context.globalAlpha = 1;
        context.fillStyle = plume;
        context.fillRect(-reach * 1.4, -reach, reach * 2, reach * 2);
        for (let flame = -2; flame <= 2; flame += 1) {
          context.globalAlpha = alpha * (0.48 - Math.abs(flame) * 0.06);
          context.strokeStyle = flame % 2 ? profile.secondary : surface.rail;
          context.lineWidth = 2.2 + (2 - Math.abs(flame)) * 1.1;
          context.beginPath();
          context.moveTo(reach * 0.2, flame * 4);
          context.bezierCurveTo(-reach * 0.08, flame * 13, -reach * 0.72, -flame * 16 + Math.sin(phase + flame) * 9, -reach * 1.18, flame * 8);
          context.stroke();
        }
      } else if (profile.id === "prism") {
        [profile.primary, node.color, profile.secondary].forEach((color, channel) => {
          const offset = (channel - 1) * 8;
          context.globalAlpha = alpha * 0.52;
          context.strokeStyle = color;
          context.lineWidth = 1.2 + channel * 0.45;
          context.beginPath();
          context.moveTo(-reach * 0.42, offset);
          context.quadraticCurveTo(0, -reach * 0.62 + offset, reach * 0.66, offset * 0.42);
          context.quadraticCurveTo(0, reach * 0.62 + offset, -reach * 0.42, offset);
          context.stroke();
        });
      } else if (profile.id === "pulse") {
        context.rotate(-heading + phase * 0.08);
        for (let ring = 0; ring < 3; ring += 1) {
          const radius = reach * (0.42 + ring * 0.3) + (phase * 10 % 12);
          context.setLineDash([7 + ring * 3, 8 + ring * 4]);
          context.lineDashOffset = -phase * (10 + ring * 5);
          context.globalAlpha = alpha * (0.62 - ring * 0.12);
          context.strokeStyle = ring % 2 ? profile.secondary : node.color;
          context.lineWidth = 2.6 - ring * 0.46;
          context.beginPath();
          context.arc(0, 0, radius, 0, Math.PI * 2);
          context.stroke();
        }
        context.setLineDash([]);
      } else if (profile.id === "lightning") {
        for (let branch = -2; branch <= 2; branch += 1) {
          context.globalAlpha = alpha * (0.72 - Math.abs(branch) * 0.08);
          context.strokeStyle = branch === 0 ? "#ffffff" : branch % 2 ? profile.secondary : node.color;
          context.lineWidth = branch === 0 ? 2.5 : 1.35;
          context.beginPath();
          let x = -reach * 0.62;
          let y = branch * 5;
          context.moveTo(x, y);
          for (let step = 1; step <= 6; step += 1) {
            x += reach * 0.22;
            y += Math.sin(phase * 5 + branch * 1.7 + step * 2.1) * (6 + step * 1.6);
            context.lineTo(x, y);
          }
          context.stroke();
        }
      } else {
        for (let ribbon = -2; ribbon <= 2; ribbon += 1) {
          const offset = ribbon * 9;
          context.globalAlpha = alpha * (0.4 - Math.abs(ribbon) * 0.035);
          context.strokeStyle = ribbon % 2 ? profile.secondary : node.color;
          context.lineWidth = 7 - Math.abs(ribbon) * 0.7;
          context.beginPath();
          context.moveTo(-reach * 0.86, offset * 0.45);
          context.bezierCurveTo(
            -reach * 0.38, -reach * 0.45 + offset + Math.sin(phase + ribbon) * 11,
            reach * 0.24, reach * 0.44 + offset - Math.sin(phase * 1.23 + ribbon) * 12,
            reach * 0.82, offset * 0.3
          );
          context.stroke();
        }
      }
      context.restore();
    });
    context.restore();
  }

  function drawMaterialMotionTrails(timestamp) {
    if (surfaceRenderer) return;
    const displacementInfluences = collectSurfaceInfluences();
    drawMaterialDisplacementFields(timestamp, displacementInfluences);
    const materialId = activeSurfaceMaterial().id;
    const groupedTrails = new Map();
    dateMapState.rollingTrails.forEach((trail) => {
      if (trail.life < 0.025) return;
      if (!groupedTrails.has(trail.ballNumber)) groupedTrails.set(trail.ballNumber, []);
      groupedTrails.get(trail.ballNumber).push(trail);
    });

    const influenceNodes = (trails, ballNumber) => {
      const recent = trails.slice(-42);
      if (!recent.length) return [];
      const indices = recent.length > 12
        ? [Math.floor(recent.length * 0.48), recent.length - 1]
        : [recent.length - 1];
      return [...new Set(indices)].map((index, nodeIndex) => {
        const trail = recent[index];
        const dx = trail.x2 - trail.x1;
        const dy = trail.y2 - trail.y1;
        const length = Math.max(0.001, Math.hypot(dx, dy));
        const directionX = dx / length;
        const directionY = dy / length;
        const normalX = -directionY;
        const normalY = directionX;
        const seed = ballNumber * 1.713 + index * 0.619 + trail.bornAt * 0.00037;
        const side = Math.sin(seed * 3.1 + nodeIndex) * (10 + ballNumber % 4 * 3);
        return {
          x: trail.x2 + normalX * side,
          y: trail.y2 + normalY * side,
          directionX,
          directionY,
          normalX,
          normalY,
          angle: Math.atan2(directionY, directionX),
          alpha: clamp(trail.life, 0, 1) ** 1.22,
          seed,
          color: trail.color,
          secondary: trail.secondary,
          ballNumber
        };
      });
    };

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    [...groupedTrails.entries()].forEach(([ballNumber, trails], groupIndex) => {
      influenceNodes(trails, ballNumber).forEach((node, nodeIndex) => {
        const phase = node.seed + timestamp * 0.00012;
        if (["lava", "gold", "amber", "crimson-storm", "copper", "solar-porcelain"].includes(materialId)) {
          const centerX = node.x + node.normalX * Math.sin(phase * 1.7) * 10;
          const centerY = node.y + node.normalY * Math.sin(phase * 1.7) * 10;
          context.globalCompositeOperation = "screen";
          context.globalAlpha = node.alpha * 0.62;
          context.beginPath();
          for (let branch = 0; branch < 3; branch += 1) {
            let x = centerX;
            let y = centerY;
            const heading = node.angle + (branch - 1) * 0.92 + Math.sin(node.seed + branch * 2.4) * 0.42;
            context.moveTo(x, y);
            for (let step = 1; step <= 5; step += 1) {
              const angle = heading + Math.sin(node.seed * 2.3 + step * 1.91 + branch) * 0.48;
              const distance = 7 + step * 2.5 + node.ballNumber % 3;
              x += Math.cos(angle) * distance;
              y += Math.sin(angle) * distance;
              context.lineTo(x, y);
            }
          }
          context.shadowColor = "#ff3908";
          context.shadowBlur = 4;
          context.strokeStyle = "#ff4b09";
          context.lineWidth = 4.5 + node.alpha * 3.5;
          context.stroke();
          context.shadowBlur = 0;
          context.globalAlpha = node.alpha * 0.86;
          context.strokeStyle = groupIndex % 4 === 0 ? "#fff0a2" : "#ffad2e";
          context.lineWidth = 0.8 + node.alpha * 1.5;
          context.stroke();
        } else if (["galaxy", "abyss", "emerald", "jade-mist", "eclipse"].includes(materialId)) {
          const centerX = node.x + node.normalX * (18 + Math.sin(phase) * 8);
          const centerY = node.y + node.normalY * (18 + Math.sin(phase) * 8);
          context.globalCompositeOperation = "screen";
          [node.color, node.secondary, "#d9f5ff"].forEach((color, orbit) => {
            const radius = 13 + orbit * 8 + (node.ballNumber % 4) * 2;
            context.globalAlpha = node.alpha * [0.48, 0.36, 0.62][orbit];
            context.strokeStyle = color;
            context.lineWidth = [3.6, 2.1, 0.7][orbit];
            context.beginPath();
            ellipsePath(
              context,
              centerX,
              centerY,
              radius * 1.7,
              radius * (0.54 + orbit * 0.08),
              node.angle + phase * (orbit % 2 ? -0.22 : 0.18),
              -Math.PI * 0.2,
              Math.PI * (1.18 + orbit * 0.16)
            );
            context.stroke();
          });
          drawDateRouteSparkle(
            centerX + Math.cos(phase) * 24,
            centerY + Math.sin(phase) * 15,
            1.6 + node.alpha * 2.5,
            node.alpha * 0.78,
            nodeIndex ? "#ffca76" : "#cceeff",
            true
          );
        } else if (materialId === "circuit") {
          const grid = 24;
          const centerX = Math.round((node.x + node.normalX * 13) / grid) * grid;
          const centerY = Math.round((node.y + node.normalY * 13) / grid) * grid;
          context.globalCompositeOperation = "screen";
          context.beginPath();
          for (let branch = 0; branch < 4; branch += 1) {
            const horizontal = (branch + node.ballNumber) % 2 === 0;
            const sign = branch < 2 ? -1 : 1;
            const first = grid * (1 + (branch + node.ballNumber) % 3);
            const second = grid * (1 + (branch * 2 + node.ballNumber) % 2);
            context.moveTo(centerX, centerY);
            context.lineTo(centerX + (horizontal ? sign * first : 0), centerY + (horizontal ? 0 : sign * first));
            context.lineTo(centerX + (horizontal ? sign * first : sign * second), centerY + (horizontal ? sign * second : sign * first));
          }
          context.globalAlpha = node.alpha * 0.66;
          context.shadowColor = groupIndex % 2 ? "#f052ff" : "#39edff";
          context.shadowBlur = 3;
          context.strokeStyle = context.shadowColor;
          context.lineWidth = 3.2;
          context.stroke();
          context.shadowBlur = 0;
          context.globalAlpha = node.alpha * 0.9;
          context.strokeStyle = "#ddfdff";
          context.lineWidth = 0.62;
          context.stroke();
          const pulse = 5 + (timestamp * 0.016 + groupIndex * 3 + nodeIndex * 5) % 14;
          context.globalAlpha = node.alpha * 0.46;
          context.strokeStyle = groupIndex % 2 ? "#f66dff" : "#6cf7ff";
          context.beginPath();
          context.arc(centerX, centerY, pulse, 0, Math.PI * 2);
          context.stroke();
        } else if (["amethyst", "burgundy", "rose-quartz"].includes(materialId)) {
          const centerX = node.x + node.normalX * Math.sin(node.seed * 2.7) * 12;
          const centerY = node.y + node.normalY * Math.sin(node.seed * 2.7) * 12;
          context.globalCompositeOperation = "screen";
          context.beginPath();
          const fractureAngles = [-2.18, -1.04, -0.22, 0.72, 1.61, 2.54];
          fractureAngles.forEach((offset, ray) => {
            const heading = node.angle + offset + Math.sin(node.seed * 1.9 + ray * 1.37) * 0.43;
            let x = centerX;
            let y = centerY;
            context.moveTo(x, y);
            const segments = 2 + (ray + node.ballNumber) % 4;
            for (let step = 1; step <= segments; step += 1) {
              const jitter = Math.sin(node.seed * 4.1 + ray * 2.2 + step * 1.7) * 0.36;
              const reach = 7 + ray % 3 * 4 + step * 2.2 + Math.abs(Math.sin(node.seed + ray)) * 8;
              const nextX = x + Math.cos(heading + jitter) * reach;
              const nextY = y + Math.sin(heading + jitter) * reach;
              const bow = Math.sin(node.seed + ray * 3.1 + step) * 5;
              context.quadraticCurveTo(
                (x + nextX) / 2 + Math.cos(heading + Math.PI / 2) * bow,
                (y + nextY) / 2 + Math.sin(heading + Math.PI / 2) * bow,
                nextX,
                nextY
              );
              x = nextX;
              y = nextY;
              if ((step + ray) % 3 === 1) {
                const branchHeading = heading + (ray % 2 ? -1 : 1) * (0.52 + Math.abs(jitter));
                const branchReach = 8 + step * 3 + ray % 2 * 5;
                context.moveTo(x, y);
                context.quadraticCurveTo(
                  x + Math.cos(branchHeading) * branchReach * 0.46 + node.normalX * 3,
                  y + Math.sin(branchHeading) * branchReach * 0.46 + node.normalY * 3,
                  x + Math.cos(branchHeading) * branchReach,
                  y + Math.sin(branchHeading) * branchReach
                );
                context.moveTo(x, y);
              }
            }
          });
          context.globalAlpha = node.alpha * 0.42;
          context.shadowColor = "#6de6ff";
          context.shadowBlur = 4;
          context.strokeStyle = "#78e8ff";
          context.lineWidth = 2.6;
          context.stroke();
          context.shadowBlur = 0;
          context.globalAlpha = node.alpha * 0.72;
          context.strokeStyle = "#f0feff";
          context.lineWidth = 0.58;
          context.stroke();
          context.globalAlpha = node.alpha * 0.09;
          context.fillStyle = "#c7f7ff";
          for (let shard = 0; shard < 4; shard += 1) {
            const heading = node.seed + shard * 1.71;
            const radius = 12 + shard * 7;
            context.beginPath();
            context.moveTo(centerX + Math.cos(heading) * 4, centerY + Math.sin(heading) * 4);
            context.lineTo(centerX + Math.cos(heading - 0.25) * radius, centerY + Math.sin(heading - 0.25) * radius);
            context.lineTo(centerX + Math.cos(heading + 0.39) * radius * 1.25, centerY + Math.sin(heading + 0.39) * radius * 1.25);
            context.closePath();
            context.fill();
          }
        } else {
          const centerX = node.x + node.normalX * (16 + Math.sin(node.seed) * 10);
          const centerY = node.y + node.normalY * (16 + Math.sin(node.seed) * 10);
          context.globalCompositeOperation = "multiply";
          const wash = context.createRadialGradient(centerX, centerY, 2, centerX, centerY, 44 + node.ballNumber % 4 * 5);
          wash.addColorStop(0, `rgba(2,12,10,${node.alpha * 0.24})`);
          wash.addColorStop(0.46, `rgba(6,23,19,${node.alpha * 0.11})`);
          wash.addColorStop(1, "rgba(9,30,25,0)");
          context.fillStyle = wash;
          context.fillRect(centerX - 64, centerY - 64, 128, 128);
          context.globalAlpha = node.alpha * (node.ballNumber === 0 ? 0.28 : 0.34);
          context.strokeStyle = node.ballNumber === 0 ? "#1f342f" : "#07110f";
          context.lineCap = "round";
          for (let stroke = 0; stroke < 4; stroke += 1) {
            const direction = stroke - 1.5;
            const curl = (stroke % 2 ? -1 : 1) * (20 + stroke * 7);
            const startX = centerX - node.directionX * (11 + stroke * 5) + node.normalX * direction * 5;
            const startY = centerY - node.directionY * (11 + stroke * 5) + node.normalY * direction * 5;
            const endX = centerX + node.directionX * (24 + stroke * 7) + node.normalX * curl;
            const endY = centerY + node.directionY * (24 + stroke * 7) + node.normalY * curl;
            context.globalAlpha = node.alpha * (0.16 + stroke * 0.035);
            context.lineWidth = 3.5 + stroke * 2.25 + node.alpha * 3;
            context.beginPath();
            context.moveTo(startX, startY);
            context.bezierCurveTo(
              centerX + node.normalX * curl * 0.36 - node.directionX * 8,
              centerY + node.normalY * curl * 0.36 - node.directionY * 8,
              centerX + node.normalX * curl * 0.86 + node.directionX * 12,
              centerY + node.normalY * curl * 0.86 + node.directionY * 12,
              endX,
              endY
            );
            context.stroke();
          }
          if (node.ballNumber === 0) {
            context.globalCompositeOperation = "screen";
            context.globalAlpha = node.alpha * 0.16;
            context.strokeStyle = "#f8faf1";
            context.lineWidth = 0.72;
            context.beginPath();
            context.arc(centerX, centerY, 18 + Math.sin(phase) * 4, -0.4, Math.PI * 1.45);
            context.stroke();
          }
          context.globalCompositeOperation = "multiply";
          context.globalAlpha = node.alpha * 0.3;
          context.fillStyle = "#07110f";
          for (let drop = 0; drop < 3; drop += 1) {
            const angle = node.seed + drop * 2.399;
            const radius = 7 + drop * 5;
            context.beginPath();
            context.arc(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius, 1.5 + drop * 0.8, 0, Math.PI * 2);
            context.fill();
          }
        }
      });
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
    const attack = smoothStep(0, 0.16, progress);
    const release = 1 - smoothStep(0.82, 1, progress);
    const intensity = attack * release;
    const inward = smoothStep(0.025, 0.3, progress);
    const x = blast.originX + (WORLD.width / 2 - blast.originX) * inward;
    const y = blast.originY + (WORLD.height / 2 - blast.originY) * inward;
    const success = blast.success !== false;
    const palette = success
      ? ["#fff9d7", "#ffbe4b", "#ad6cff", "#4b1a87"]
      : ["#fff1e4", "#ff5b52", "#9f2f77", "#220613"];
    context.save();
    context.globalCompositeOperation = "screen";
    const focusRadius = 70 + attack * 250;
    const focus = context.createRadialGradient(x, y, 0, x, y, focusRadius);
    focus.addColorStop(0, colorWithAlpha(palette[0], intensity * 0.12));
    focus.addColorStop(0.16, colorWithAlpha(palette[1], intensity * 0.1));
    focus.addColorStop(0.42, colorWithAlpha(palette[2], intensity * 0.055));
    focus.addColorStop(1, colorWithAlpha(palette[3], 0));
    context.fillStyle = focus;
    context.fillRect(x - focusRadius, y - focusRadius, focusRadius * 2, focusRadius * 2);

    const climax = smoothStep(0.42, 0.62, progress) * (1 - smoothStep(0.86, 1, progress));
    if (climax > 0.01) {
      const wash = context.createRadialGradient(WORLD.width / 2, WORLD.height / 2, 0, WORLD.width / 2, WORLD.height / 2, WORLD.height * 0.58);
      wash.addColorStop(0, colorWithAlpha(palette[0], climax * 0.12));
      wash.addColorStop(0.2, colorWithAlpha(palette[1], climax * 0.075));
      wash.addColorStop(0.52, colorWithAlpha(palette[2], climax * 0.045));
      wash.addColorStop(1, colorWithAlpha(palette[3], 0));
      context.globalAlpha = 1;
      context.fillStyle = wash;
      context.fillRect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, TABLE.bottom - TABLE.top);
    }
    const vortex = smoothStep(0.08, 0.36, progress) * (1 - smoothStep(0.86, 1, progress));
    if (vortex > 0.01) {
      context.save();
      context.translate(x, y);
      context.rotate(progress * Math.PI * 1.35);
      context.lineCap = "round";
      for (let ray = 0; ray < 16; ray += 1) {
        const angle = ray / 16 * Math.PI * 2;
        const theme = BALL_CHROMA_THEMES[ray] || BALL_CHROMA_THEMES[0];
        const twist = (ray % 2 ? -1 : 1) * (0.24 + progress * 0.34);
        const reach = 150 + (ray % 5) * 38 + climax * 120;
        context.globalAlpha = vortex * (0.24 + (ray % 4) * 0.045);
        context.strokeStyle = ray === 8 ? "#fff5cd" : theme.primary;
        context.shadowColor = theme.glow;
        context.shadowBlur = 5 + climax * 12;
        context.lineWidth = ray === 8 ? 3.4 : 1.3 + (ray % 3) * 0.55;
        context.beginPath();
        context.moveTo(Math.cos(angle) * 18, Math.sin(angle) * 18);
        context.bezierCurveTo(
          Math.cos(angle + twist) * reach * 0.34,
          Math.sin(angle + twist) * reach * 0.34,
          Math.cos(angle + twist * 1.8) * reach * 0.72,
          Math.sin(angle + twist * 1.8) * reach * 0.72,
          Math.cos(angle + twist * 2.35) * reach,
          Math.sin(angle + twist * 2.35) * reach
        );
        context.stroke();
      }
      context.shadowBlur = 0;
      [0.24, 0.48, 0.72].forEach((ring, ringIndex) => {
        const ringRadius = 52 + ring * 280 + climax * 38;
        context.globalAlpha = vortex * (0.34 - ringIndex * 0.07);
        context.strokeStyle = ringIndex === 1 ? "#a86cff" : "#ffd066";
        context.lineWidth = 1.5 + climax * 1.4;
        context.setLineDash([8 + ringIndex * 4, 12 + ringIndex * 5]);
        context.lineDashOffset = (ringIndex % 2 ? 1 : -1) * timestamp * 0.04;
        context.beginPath();
        context.arc(0, 0, ringRadius, 0, Math.PI * 2);
        context.stroke();
      });
      context.setLineDash([]);
      const coreRadius = 24 + progress * 48 + climax * 34;
      const core = context.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
      core.addColorStop(0, `rgba(0,0,0,${0.9 * vortex})`);
      core.addColorStop(0.42, `rgba(18,5,34,${0.72 * vortex})`);
      core.addColorStop(0.72, `rgba(255,190,70,${0.28 * climax})`);
      core.addColorStop(1, "rgba(255,210,100,0)");
      context.globalAlpha = 1;
      context.fillStyle = core;
      context.fillRect(-coreRadius, -coreRadius, coreRadius * 2, coreRadius * 2);
      context.restore();
    }
    context.restore();
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
    drawMaterialMotionTrails(timestamp);
    drawPocketMotionSignatures(timestamp);
    if (blackEightActive) drawBlackEightBlast(timestamp);
    context.restore();
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
    dateMapFramesSinceRebuild = 0;
    return true;
  }

  function drawDateMapLayer(timestamp) {
    dateMapFramesSinceRebuild += 1;
    const refreshDue = timestamp - dateMapFrameUpdatedAt >= DATE_MAP_REFRESH_MS;
    const frameBudgetReady = dateMapFramesSinceRebuild >= 2;
    if ((!dateMapFrameCanvas || refreshDue && frameBudgetReady) && !rebuildDateMapFrame(timestamp)) {
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
    const worldTheme = BALL_CHROMA_THEMES[number] || BALL_CHROMA_THEMES[0];
    const worldGradient = context.createRadialGradient(-5, -6, 1, 2, 3, BALL_RADIUS * 1.34);
    worldGradient.addColorStop(0, worldTheme.glow);
    worldGradient.addColorStop(0.22, worldTheme.primary);
    worldGradient.addColorStop(0.62, worldTheme.secondary);
    worldGradient.addColorStop(1, worldTheme.deep);
    context.fillStyle = worldGradient;
    context.fillRect(-BALL_RADIUS * 1.5, -BALL_RADIUS * 1.5, BALL_RADIUS * 3, BALL_RADIUS * 3);
    context.globalAlpha = 0.44;
    context.strokeStyle = worldTheme.accent;
    context.lineWidth = number === 0 ? 1.15 : 0.9;
    for (let ring = 0; ring < 3; ring += 1) {
      context.beginPath();
      context.arc(
        Math.sin(number * 1.7 + ring) * BALL_RADIUS * 0.18,
        Math.cos(number * 1.3 + ring) * BALL_RADIUS * 0.16,
        BALL_RADIUS * (0.3 + ring * 0.22),
        number * 0.29 + ring * 0.8,
        number * 0.29 + ring * 0.8 + Math.PI * (0.76 + ring * 0.15)
      );
      context.stroke();
    }
    context.globalAlpha = 1;
    if (number === 0) {
      context.fillStyle = "rgba(147, 43, 35, 0.9)";
      context.beginPath();
      context.arc(0, -BALL_RADIUS * 0.62, 1.8, 0, Math.PI * 2);
      context.fill();
    } else {
      const shade = context.createRadialGradient(-5, -6, 1, 2, 3, BALL_RADIUS * 1.22);
      shade.addColorStop(0, "rgba(255,255,255,0.38)");
      shade.addColorStop(0.36, "rgba(255,255,255,0.02)");
      shade.addColorStop(1, "rgba(0,0,0,0.46)");
      context.fillStyle = shade;
      context.fillRect(-BALL_RADIUS, -BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2);
      drawMotifGlyph(motifForBall(number), 0, BALL_RADIUS * 0.62, 3.8, 0.72);
      context.shadowColor = worldTheme.glow;
      context.shadowBlur = 4;
      context.fillStyle = "rgba(250, 249, 243, 0.96)";
      context.beginPath();
      context.arc(0, 0, 7.3, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      context.fillStyle = "#191c1c";
      context.font = "800 8.2px system-ui, sans-serif";
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
      const pixelRatio = clamp(renderScale * BALL_RENDER_SCALE_RATIO, MIN_BALL_RENDER_SCALE, MAX_BALL_RENDER_SCALE);
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
        pixelRatio: clamp(renderScale * BALL_RENDER_SCALE_RATIO, MIN_BALL_RENDER_SCALE, MAX_BALL_RENDER_SCALE)
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

  function initializeSurfaceRenderer() {
    const factory = window.BilliardsSurfaceRenderer?.create;
    if (typeof factory !== "function") return false;
    try {
      surfaceRenderer = factory({ document });
      if (!surfaceRenderer || typeof surfaceRenderer.render !== "function") {
        throw new Error("BilliardsSurfaceRenderer adapter is incomplete");
      }
      surfaceRendererFailed = false;
      dateMapFrameDirty = true;
      return true;
    } catch {
      surfaceRenderer = null;
      surfaceRendererFailed = true;
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

  function drawCollisionBloom(feedback, alpha, radiusScale = 1.5) {
    const radius = feedback.radius * radiusScale;
    const bloom = context.createRadialGradient(0, 0, 0, 0, 0, radius);
    bloom.addColorStop(0, colorWithAlpha(feedback.color, alpha * 0.34));
    bloom.addColorStop(0.24, colorWithAlpha(feedback.secondary, alpha * 0.16));
    bloom.addColorStop(0.62, colorWithAlpha(feedback.color, alpha * 0.045));
    bloom.addColorStop(1, colorWithAlpha(feedback.secondary, 0));
    context.fillStyle = bloom;
    context.fillRect(-radius, -radius, radius * 2, radius * 2);
  }

  function renderMaterialCollisionFeedback(feedback) {
    const progress = 1 - feedback.life;
    const alpha = feedback.life * feedback.intensity;
    const random = seededSurfaceRandom(Math.floor(feedback.seed * 100003));
    const angle = Math.atan2(feedback.normalY, feedback.normalX);
    context.save();
    context.translate(feedback.x, feedback.y);
    context.rotate(angle);

    if (feedback.family === "ink") {
      context.globalCompositeOperation = "multiply";
      for (let wash = 0; wash < 7; wash += 1) {
        const side = (random() - 0.5) * feedback.radius * 1.4;
        const reach = feedback.radius * (0.7 + random() * 0.82);
        const width = 7 + random() * 15;
        const bloom = context.createRadialGradient(side, 0, 0, side, 0, reach);
        bloom.addColorStop(0, `rgba(3,10,8,${alpha * (0.18 + random() * 0.14)})`);
        bloom.addColorStop(0.48, `rgba(10,28,23,${alpha * 0.11})`);
        bloom.addColorStop(1, "rgba(16,35,29,0)");
        context.save();
        context.translate(side, (random() - 0.5) * feedback.radius * 0.34);
        context.rotate((random() - 0.5) * 1.4);
        context.scale(1.35, width / Math.max(1, reach));
        context.fillStyle = bloom;
        context.fillRect(-reach, -reach, reach * 2, reach * 2);
        context.restore();
      }
    } else if (feedback.family === "fluid") {
      context.globalCompositeOperation = "screen";
      drawCollisionBloom(feedback, alpha * 0.72, 1.72);
      for (let lens = 0; lens < 5; lens += 1) {
        const lensAngle = random() * Math.PI * 2;
        const distance = feedback.radius * (0.36 + random() * 0.74);
        const lensRadius = 2.5 + random() * 5.5;
        context.globalAlpha = alpha * (0.16 + random() * 0.22);
        context.fillStyle = lens % 2 ? feedback.secondary : feedback.color;
        context.beginPath();
        context.ellipse(
          Math.cos(lensAngle) * distance,
          Math.sin(lensAngle) * distance,
          lensRadius * 1.8,
          lensRadius * 0.72,
          lensAngle,
          0,
          Math.PI * 2
        );
        context.fill();
      }
    } else if (feedback.family === "crystal") {
      context.globalCompositeOperation = "screen";
      drawCollisionBloom(feedback, alpha, 1.42);
      for (let shard = 0; shard < 10; shard += 1) {
        const shardAngle = random() * Math.PI * 2;
        const near = feedback.radius * (0.08 + random() * 0.18);
        const far = feedback.radius * (0.46 + random() * 0.72);
        const spread = 0.06 + random() * 0.16;
        context.globalAlpha = alpha * (0.12 + random() * 0.34);
        context.fillStyle = shard % 3 ? feedback.color : feedback.secondary;
        context.beginPath();
        context.moveTo(Math.cos(shardAngle - spread) * near, Math.sin(shardAngle - spread) * near);
        context.quadraticCurveTo(
          Math.cos(shardAngle + spread * 0.3) * far * 0.62,
          Math.sin(shardAngle + spread * 0.3) * far * 0.62,
          Math.cos(shardAngle) * far,
          Math.sin(shardAngle) * far
        );
        context.lineTo(Math.cos(shardAngle + spread) * near, Math.sin(shardAngle + spread) * near);
        context.closePath();
        context.fill();
      }
    } else if (feedback.family === "circuit") {
      context.globalCompositeOperation = "screen";
      context.lineCap = "round";
      drawCollisionBloom(feedback, alpha, 1.35);
      for (let branch = 0; branch < 6; branch += 1) {
        const vertical = branch % 2;
        const sign = branch < 3 ? -1 : 1;
        const reach = feedback.radius * (0.5 + random() * 0.56);
        const turn = feedback.radius * (0.2 + random() * 0.3);
        context.globalAlpha = alpha * (0.24 + random() * 0.28);
        context.strokeStyle = branch % 2 ? feedback.secondary : feedback.color;
        context.shadowColor = context.strokeStyle;
        context.shadowBlur = 7;
        context.lineWidth = 4.2 + random() * 2.4;
        context.beginPath();
        context.moveTo(0, 0);
        if (vertical) {
          context.lineTo(sign * turn, 0);
          context.quadraticCurveTo(sign * (turn + 5), 0, sign * (turn + 5), sign * 5);
          context.lineTo(sign * (turn + 5), sign * reach);
        } else {
          context.lineTo(0, sign * turn);
          context.quadraticCurveTo(0, sign * (turn + 5), sign * 5, sign * (turn + 5));
          context.lineTo(sign * reach, sign * (turn + 5));
        }
        context.stroke();
        context.globalAlpha *= 1.45;
        context.shadowBlur = 2;
        context.lineWidth = 1.1 + random() * 1.1;
        context.stroke();
        const nodeX = vertical ? sign * (turn + 5) : sign * reach;
        const nodeY = vertical ? sign * reach : sign * (turn + 5);
        context.save();
        context.translate(nodeX, nodeY);
        context.rotate(Math.PI / 4);
        context.fillStyle = branch % 2 ? feedback.color : feedback.secondary;
        context.fillRect(-2.8, -2.8, 5.6, 5.6);
        context.restore();
      }
      context.shadowBlur = 0;
    } else if (feedback.family === "eclipse") {
      context.globalCompositeOperation = "screen";
      drawCollisionBloom(feedback, alpha, 1.7);
      for (let cloudIndex = 0; cloudIndex < 7; cloudIndex += 1) {
        const cloudAngle = progress * 1.4 + cloudIndex * Math.PI * 2 / 7;
        const distance = feedback.radius * (0.22 + cloudIndex % 3 * 0.18);
        const cloudX = Math.cos(cloudAngle) * distance;
        const cloudY = Math.sin(cloudAngle) * distance;
        const cloudRadius = feedback.radius * (0.34 + cloudIndex % 2 * 0.18);
        const cloud = context.createRadialGradient(cloudX, cloudY, 0, cloudX, cloudY, cloudRadius);
        cloud.addColorStop(0, colorWithAlpha(cloudIndex % 2 ? feedback.secondary : feedback.color, alpha * 0.2));
        cloud.addColorStop(0.46, colorWithAlpha(feedback.color, alpha * 0.07));
        cloud.addColorStop(1, colorWithAlpha(feedback.secondary, 0));
        context.save();
        context.translate(cloudX, cloudY);
        context.rotate(cloudAngle + Math.PI / 2);
        context.scale(2.1, 0.58);
        context.translate(-cloudX, -cloudY);
        context.fillStyle = cloud;
        context.fillRect(cloudX - cloudRadius, cloudY - cloudRadius, cloudRadius * 2, cloudRadius * 2);
        context.restore();
      }
    } else {
      context.globalCompositeOperation = "screen";
      drawCollisionBloom(feedback, alpha * 0.78, 1.58);
      for (let spark = 0; spark < 7; spark += 1) {
        const sparkAngle = (random() - 0.5) * Math.PI * 1.6;
        const distance = feedback.radius * (0.28 + random() * 0.82);
        const sparkX = Math.cos(sparkAngle) * distance;
        const sparkY = Math.sin(sparkAngle) * distance;
        const sparkRadius = 2.4 + random() * 5.2;
        const sparkColor = spark % 3 ? feedback.color : feedback.secondary;
        const sparkGlow = context.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, sparkRadius);
        sparkGlow.addColorStop(0, colorWithAlpha("#fff7dc", alpha * (0.34 + random() * 0.24)));
        sparkGlow.addColorStop(0.22, colorWithAlpha(sparkColor, alpha * 0.3));
        sparkGlow.addColorStop(1, colorWithAlpha(sparkColor, 0));
        context.save();
        context.translate(sparkX, sparkY);
        context.rotate(sparkAngle);
        context.scale(2.2 + random(), 0.58 + random() * 0.24);
        context.translate(-sparkX, -sparkY);
        context.fillStyle = sparkGlow;
        context.fillRect(sparkX - sparkRadius, sparkY - sparkRadius, sparkRadius * 2, sparkRadius * 2);
        context.restore();
      }
    }
    context.restore();
  }

  function collisionFeedbackIntensityBucket(intensity) {
    if (intensity < 0.46) return 0.38;
    if (intensity < 0.78) return 0.64;
    return 0.92;
  }

  function collisionFeedbackSpriteFor(feedback) {
    const intensity = collisionFeedbackIntensityBucket(feedback.intensity);
    const key = `${feedback.materialId}:${feedback.family}:${intensity}`;
    if (collisionFeedbackSpriteCache.has(key)) {
      const cached = collisionFeedbackSpriteCache.get(key);
      collisionFeedbackSpriteCache.delete(key);
      collisionFeedbackSpriteCache.set(key, cached);
      return cached;
    }
    const sprite = document.createElement("canvas");
    const size = COLLISION_SPRITE_EXTENT * 2;
    sprite.width = Math.ceil(size * COLLISION_SPRITE_RENDER_SCALE);
    sprite.height = Math.ceil(size * COLLISION_SPRITE_RENDER_SCALE);
    const spriteContext = sprite.getContext("2d", { alpha: true });
    if (!spriteContext) return null;
    const liveContext = context;
    try {
      context = spriteContext;
      context.setTransform(
        COLLISION_SPRITE_RENDER_SCALE,
        0,
        0,
        COLLISION_SPRITE_RENDER_SCALE,
        0,
        0
      );
      renderMaterialCollisionFeedback({
        ...feedback,
        x: COLLISION_SPRITE_EXTENT,
        y: COLLISION_SPRITE_EXTENT,
        radius: COLLISION_SPRITE_BASE_RADIUS,
        life: 1,
        intensity,
        normalX: 1,
        normalY: 0,
        seed: [...feedback.materialId].reduce((seed, character) => seed * 31 + character.charCodeAt(0), 17) + intensity * 100
      });
    } finally {
      context = liveContext;
    }
    const cached = Object.freeze({ canvas: sprite, extent: COLLISION_SPRITE_EXTENT });
    collisionFeedbackSpriteCache.set(key, cached);
    while (collisionFeedbackSpriteCache.size > COLLISION_SPRITE_CACHE_LIMIT) {
      collisionFeedbackSpriteCache.delete(collisionFeedbackSpriteCache.keys().next().value);
    }
    return cached;
  }

  function prewarmCollisionFeedbackSprites(material = activeSurfaceMaterial()) {
    const family = collisionMaterialFamily(material.id);
    [0.38, 0.64, 0.92].forEach((intensity) => {
      collisionFeedbackSpriteFor({
        materialId: material.id,
        family,
        intensity,
        color: material.rail,
        secondary: material.railSecondary || material.rail,
        normalX: 1,
        normalY: 0,
        seed: intensity * 100
      });
    });
  }

  function scheduleCollisionFeedbackPrewarm(material = activeSurfaceMaterial()) {
    const warm = () => prewarmCollisionFeedbackSprites(material);
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(warm, { timeout: 160 });
    } else {
      setTimeout(warm, 16);
    }
  }

  function drawMaterialCollisionFeedback(feedback) {
    const sprite = collisionFeedbackSpriteFor(feedback);
    if (!sprite) {
      renderMaterialCollisionFeedback(feedback);
      return;
    }
    const progress = 1 - feedback.life;
    const scale = clamp(feedback.radius / COLLISION_SPRITE_BASE_RADIUS, 0.16, 1.08);
    const extent = sprite.extent * scale;
    context.save();
    context.translate(feedback.x, feedback.y);
    context.rotate(Math.atan2(feedback.normalY, feedback.normalX) + (feedback.family === "eclipse" ? progress * 1.4 : 0));
    context.globalAlpha = feedback.life;
    context.globalCompositeOperation = feedback.family === "ink" ? "multiply" : "screen";
    context.drawImage(sprite.canvas, -extent, -extent, extent * 2, extent * 2);
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
    collisionFeedbacks.forEach(drawMaterialCollisionFeedback);
    context.restore();
  }

  function draw(timestamp) {
    context.setTransform(canvas.width / WORLD.width, 0, 0, canvas.height / WORLD.height, 0, 0);
    context.clearRect(0, 0, WORLD.width, WORLD.height);
    context.save();
    if (screenShake > 0.08) context.translate(Math.sin(timestamp * 0.1) * screenShake, Math.cos(timestamp * 0.13) * screenShake * 0.55);
    drawTableLayer();
    drawDateMapLayer(timestamp);
    drawCushionLightResponse(timestamp);
    POCKETS.forEach(drawLeatherPocket);
    drawPocketLightPorts(timestamp);
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
        queueMaterialCollisionResponse(contact, normal, relative, [dataA.number, dataB.number]);
        spawnParticles(contact.x, contact.y, activeSurfaceMaterial().rail, Math.min(6, Math.ceil(relative / 3.5)));
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
  initializeSurfaceRenderer();
  initializeBallRenderer();
  preloadSurfaceTextures();
  buildRails();
  buildTimeline();
  rackBalls();
  scheduleCollisionFeedbackPrewarm();
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
            surfaceRenderer: surfaceRenderer ? "webgl2-displaced-texture" : "canvas-field-fallback",
            surfaceRendererFailed,
            surfaceMaterialId,
            surfaceMaterialLabel: activeSurfaceMaterial().label,
            surfaceMaterialCount: SURFACE_MATERIALS.length,
            surfaceTextureSource: SURFACE_TEXTURE_SOURCES[surfaceMaterialId],
            surfaceTextureReady: Boolean(surfaceTextureCache.get(surfaceMaterialId)?.ready),
            surfaceTextureReadyCount: [...surfaceTextureCache.values()].filter((record) => record.ready).length,
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
