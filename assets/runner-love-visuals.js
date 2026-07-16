import * as THREE from "./vendor/three-0.185.1.module.min.js";
import { GLTFLoader } from "./vendor/three-addons/GLTFLoader.js";
import { mergeGeometries } from "./vendor/three-addons/BufferGeometryUtils.js";

const STAGE_CONFIGS = Object.freeze([
  {
    id: "first-sight",
    district: "campus-line",
    asset: "assets/runner-scenes/01-encounter.jpg",
    sky: 0x8ed8f2,
    skyTop: 0x349bd8,
    skyBottom: 0xe9f6f5,
    fog: 0xcfe8e8,
    fogDensity: 0.0032,
    key: 0xffcf8d,
    ambient: 0xbcd7cf,
    ground: 0x75927f,
    road: 0x9ca7a8,
    curb: 0xdce2da,
    accent: 0xffc454,
    weather: "after-rain",
    routeStyle: "promenade",
    destination: "library-crossing",
    props: ["campus", "lamp", "signal", "graffiti"],
    world: {
      scene: "rain-campus",
      landmarks: ["library-arcade", "glass-corridor", "camphor-grove"],
      road: { geometry: "crowned-campus", material: "wet-asphalt", shoulders: "brick-walk", markings: "campus-crossing" },
      obstacles: { style: "campus-commute", signatures: ["puddle-barricade", "bicycle-rack", "glass-gate"] },
      lighting: { keyIntensity: 4.35, edgeIntensity: 1.15, warmIntensity: 10, environmentIntensity: 0.88, keyPosition: [-9, 16, 8], edgePosition: [8, 8, -5], warmPosition: [0, 5.2, -5] },
      weather: { kind: "after-rain", rain: 0.045, wind: 0.45 },
      particles: { kind: "leaf-drips", opacity: 0.3, size: 0.12 },
      horizon: { kind: "campus-canopy", layers: ["library-roof", "tree-line", "water-tower"], parallax: [0.05, 0.16, 0.32] }
    },
    theme: { surface: "cool-wet", landmark: 0xd9e4d3, shadow: 0x183236, highlight: 0xffd28a }
  },
  {
    id: "familiar-steps",
    district: "glass-station",
    asset: "assets/runner-scenes/02-familiar.jpg",
    sky: 0x395b7d,
    skyTop: 0x182d55,
    skyBottom: 0xd7917c,
    fog: 0x536779,
    fogDensity: 0.0065,
    key: 0xffc07e,
    ambient: 0xb8d4dc,
    ground: 0x1d2d34,
    road: 0x4d5260,
    curb: 0x9d8776,
    accent: 0xffa866,
    weather: "breeze",
    routeStyle: "riverside",
    destination: "bridge-bookstore",
    props: ["station", "railing", "bench", "tree"],
    world: {
      scene: "river-bookstore",
      landmarks: ["arched-river-bridge", "sunken-bookstore", "embankment-steps"],
      road: { geometry: "riverside-boardwalk", material: "mist-concrete", shoulders: "timber-deck", markings: "book-spines" },
      obstacles: { style: "bookstore-delivery", signatures: ["bicycle-wheel", "book-cart", "canvas-awning"] },
      lighting: { keyIntensity: 3.05, edgeIntensity: 1.2, warmIntensity: 10.5, environmentIntensity: 0.76, keyPosition: [-4, 11, 5], edgePosition: [9, 4, -10], warmPosition: [-3, 3, -12] },
      weather: { kind: "river-mist", rain: 0, wind: 0.72 },
      particles: { kind: "paper-pages", opacity: 0.38, size: 0.15 },
      horizon: { kind: "river-depth", layers: ["opposite-bank", "bridge-arch", "mist-towers"], parallax: [0.035, 0.12, 0.28] }
    },
    theme: { surface: "paper-concrete", landmark: 0xe6e1cf, shadow: 0x173438, highlight: 0xb9f1df }
  },
  {
    id: "closer-signals",
    district: "neon-river",
    asset: "assets/runner-scenes/03-ambiguous.jpg",
    sky: 0x121c3f,
    skyTop: 0x080c26,
    skyBottom: 0x68345e,
    fog: 0x213252,
    fogDensity: 0.01,
    key: 0xffa66f,
    ambient: 0x7cc7d3,
    ground: 0x0a1022,
    road: 0x30445f,
    curb: 0x4d5270,
    accent: 0x42e7f5,
    weather: "neon",
    routeStyle: "metro",
    destination: "old-cinema",
    props: ["building", "cafe", "neon-sign", "signal"],
    world: {
      scene: "neon-cinema",
      landmarks: ["cinema-marquee", "metro-portals", "elevated-signage"],
      road: { geometry: "tram-canyon", material: "neon-rail", shoulders: "platform-granite", markings: "ticket-stubs" },
      obstacles: { style: "cinema-transit", signatures: ["velvet-barrier", "service-tram", "marquee-gate"] },
      lighting: { keyIntensity: 2.55, edgeIntensity: 3.1, warmIntensity: 20, environmentIntensity: 0.94, keyPosition: [6, 12, 3], edgePosition: [-8, 7, -4], warmPosition: [2, 3, -8] },
      weather: { kind: "neon-haze", rain: 0.025, wind: 0.28 },
      particles: { kind: "neon-dust", opacity: 0.68, size: 0.17 },
      horizon: { kind: "cinema-canyon", layers: ["rail-viaduct", "marquee-row", "neon-towers"], parallax: [0.04, 0.14, 0.38] }
    },
    theme: { surface: "electric-wet", landmark: 0x41385f, shadow: 0x080d23, highlight: 0xff8a71 }
  },
  {
    id: "spoken-heart",
    district: "date-market",
    asset: "assets/runner-scenes/04-night-market.jpg",
    sky: 0x24172f,
    skyTop: 0x100d23,
    skyBottom: 0xa24669,
    fog: 0x382742,
    fogDensity: 0.012,
    key: 0xffa777,
    ambient: 0x85aeca,
    ground: 0x180f21,
    road: 0x4d3e58,
    curb: 0x77536d,
    accent: 0xff6f91,
    weather: "rain",
    routeStyle: "market",
    destination: "riverside-bench",
    props: ["tunnel", "lamp", "shelter", "graffiti"],
    world: {
      scene: "night-market-river",
      landmarks: ["lantern-market", "music-square", "river-jetty"],
      road: { geometry: "market-cobbles", material: "oily-stone", shoulders: "stall-thresholds", markings: "lantern-path" },
      obstacles: { style: "market-stalls", signatures: ["basket-barrier", "food-cart", "striped-canopy"] },
      lighting: { keyIntensity: 2.35, edgeIntensity: 2.2, warmIntensity: 24, environmentIntensity: 0.86, keyPosition: [-2, 8, 2], edgePosition: [8, 5, -12], warmPosition: [-3, 2.6, -5] },
      weather: { kind: "river-night", rain: 0.13, wind: 0.82 },
      particles: { kind: "lantern-embers", opacity: 0.55, size: 0.19 },
      horizon: { kind: "market-river", layers: ["river-reflections", "stall-roofs", "apartment-lights"], parallax: [0.025, 0.2, 0.34] }
    },
    theme: { surface: "market-stone", landmark: 0x774456, shadow: 0x160f20, highlight: 0xffbe72 }
  },
  {
    id: "shared-days",
    district: "home-quarter",
    asset: "assets/runner-scenes/05-neighborhood.jpg",
    sky: 0x8fc9df,
    skyTop: 0x5da7d0,
    skyBottom: 0xffd99f,
    fog: 0xb8d5cf,
    fogDensity: 0.0048,
    key: 0xffdf9f,
    ambient: 0xd7dec4,
    ground: 0x50635b,
    road: 0x8e9990,
    curb: 0xd2c5a9,
    accent: 0xffbf4f,
    weather: "warm",
    routeStyle: "neighborhood",
    destination: "warm-kitchen",
    props: ["market", "station", "home", "tree"],
    world: {
      scene: "lived-in-neighborhood",
      landmarks: ["breakfast-corner", "balcony-houses", "lit-kitchen-window"],
      road: { geometry: "neighborhood-patchwork", material: "dry-asphalt", shoulders: "doorstep-brick", markings: "morning-crossing" },
      obstacles: { style: "daily-delivery", signatures: ["grocery-crates", "delivery-bike", "laundry-gate"] },
      lighting: { keyIntensity: 4.05, edgeIntensity: 1.05, warmIntensity: 18, environmentIntensity: 0.7, keyPosition: [-10, 12, 10], edgePosition: [6, 5, -6], warmPosition: [2, 3, -3] },
      weather: { kind: "window-morning", rain: 0, wind: 0.2 },
      particles: { kind: "kitchen-steam", opacity: 0.42, size: 0.23 },
      horizon: { kind: "home-rooftops", layers: ["garden-walls", "tile-roofs", "water-tanks"], parallax: [0.05, 0.18, 0.3] }
    },
    theme: { surface: "lived-in-asphalt", landmark: 0xc5b58c, shadow: 0x21372f, highlight: 0xffd58c }
  },
  {
    id: "rough-weather",
    district: "storm-bridge",
    asset: "assets/runner-scenes/06-storm-bridge.jpg",
    sky: 0x18243a,
    skyTop: 0x080e1f,
    skyBottom: 0x59667a,
    fog: 0x26364d,
    fogDensity: 0.016,
    key: 0xc3d0db,
    ambient: 0x8497ab,
    ground: 0x0e1723,
    road: 0x37475a,
    curb: 0x5c6673,
    accent: 0xff5f63,
    weather: "storm",
    routeStyle: "bridge",
    destination: "bridge-shelter",
    props: ["maintenance", "warning", "signal", "tunnel"],
    world: {
      scene: "storm-old-bridge",
      landmarks: ["steel-truss", "flood-pylons", "bridge-shelter"],
      road: { geometry: "bridge-grating", material: "flooded-steel", shoulders: "maintenance-walk", markings: "broken-warning" },
      obstacles: { style: "storm-maintenance", signatures: ["flood-barrier", "maintenance-rig", "fallen-truss"] },
      lighting: { keyIntensity: 1.7, edgeIntensity: 2.65, warmIntensity: 8, environmentIntensity: 0.82, keyPosition: [3, 14, 5], edgePosition: [-9, 6, -8], warmPosition: [0, 2, -12] },
      weather: { kind: "violent-storm", rain: 0.64, wind: 3.4 },
      particles: { kind: "storm-spray", opacity: 0.74, size: 0.11 },
      horizon: { kind: "storm-bridge", layers: ["flood-water", "truss-repeat", "lightning-clouds"], parallax: [0.02, 0.18, 0.26] }
    },
    theme: { surface: "storm-steel", landmark: 0x637184, shadow: 0x0b1422, highlight: 0xff6669 }
  },
  {
    id: "toward-home",
    district: "sunrise-terminal",
    asset: "assets/runner-scenes/07-dawn-home.jpg",
    sky: 0x343d6d,
    skyTop: 0x171d49,
    skyBottom: 0xf3a47b,
    fog: 0x4f5674,
    fogDensity: 0.0055,
    key: 0xffd791,
    ambient: 0xaab7df,
    ground: 0x151c31,
    road: 0x465575,
    curb: 0x827f91,
    accent: 0xffd36b,
    weather: "starlight",
    routeStyle: "terminal",
    destination: "lit-home",
    props: ["terminal", "home", "lamp", "tree"],
    world: {
      scene: "dawn-station",
      landmarks: ["platform-clock", "glass-concourse", "departures-canopy"],
      road: { geometry: "terminal-platforms", material: "dawn-rail", shoulders: "platform-tiles", markings: "departure-lines" },
      obstacles: { style: "station-departure", signatures: ["luggage-stack", "platform-cart", "departure-gate"] },
      lighting: { keyIntensity: 3.2, edgeIntensity: 2.35, warmIntensity: 16, environmentIntensity: 0.92, keyPosition: [-6, 10, -2], edgePosition: [8, 8, -14], warmPosition: [0, 4, -9] },
      weather: { kind: "dawn-clear", rain: 0, wind: 0.38 },
      particles: { kind: "dawn-sparks", opacity: 0.7, size: 0.16 },
      horizon: { kind: "terminal-dawn", layers: ["rail-yard", "station-roof", "sunrise-city"], parallax: [0.035, 0.16, 0.33] }
    },
    theme: { surface: "dawn-platform", landmark: 0xb8b8c9, shadow: 0x151c34, highlight: 0xffd780 }
  }
]);

const SEGMENT_LENGTH = 16;
const SEGMENT_COUNT = 12;
const ROAD_WIDTH = 8.8;
const LANE_WIDTH = 2.35;
const WORLD_Z_SCALE = 1.62;
const PLAYER_Z = 1.65;
const COLLISION_Z = 0.85;
const FOG_SCALE = 0.52;
const MAX_RENDER_PIXELS = 1_850_000;
const CITY_BUILDING_COUNT = 54;
const BACKDROP_OPACITY = 0;
const STAGE_COLLECTIBLE_COLORS = Object.freeze([0xffc34d, 0x68ead3, 0x67e8ff, 0xff6688, 0xffb74f, 0xff6a70, 0xffd85a]);
const STAGE_TOKEN_COLORS = Object.freeze([0xffefb0, 0xf4fff9, 0xffe1a0, 0xfff4e6, 0xfff0a6, 0xffedf0, 0xffffff]);
const STAGE_TRACKSIDE_PROPS = Object.freeze([
  Object.freeze(["campus", "tree", "lamp", "shelter"]),
  Object.freeze(["bookstore", "railing", "bench", "shelter"]),
  Object.freeze(["neon-sign", "signal", "lamp", "railing"]),
  Object.freeze(["shelter", "lamp", "neon-sign", "bench"]),
  Object.freeze(["home", "market", "tree", "bench"]),
  Object.freeze(["maintenance", "warning", "signal", "railing"]),
  Object.freeze(["lamp", "shelter", "railing", "home"])
]);
const DISTRICT_LABELS = Object.freeze({
  "campus-line": "CAMPUS LINE",
  "glass-station": "GLASS STATION",
  "neon-river": "RIVER NIGHT",
  "date-market": "NIGHT MARKET",
  "home-quarter": "HOME QUARTER",
  "storm-bridge": "STORM BRIDGE",
  "sunrise-terminal": "SUNRISE TERMINAL"
});
const DISTRICT_CITY_LAYOUTS = Object.freeze([
  Object.freeze({ sources: [4, 5, 6, 7, 8], counts: [5, 4, 4, 3, 10], minHeight: 4.6, heightRange: 3.8, offset: 7.9, spacing: 9.4 }),
  Object.freeze({ sources: [0, 1, 3], counts: [8, 7, 6], minHeight: 7.2, heightRange: 6.8, offset: 7.8, spacing: 8.2 }),
  Object.freeze({ sources: [1, 2, 3], counts: [8, 6, 7], minHeight: 10.2, heightRange: 9.5, offset: 7.7, spacing: 7.5 }),
  Object.freeze({ sources: [0, 2, 7], counts: [7, 5, 7], minHeight: 6.2, heightRange: 5.2, offset: 7.8, spacing: 8.2 }),
  Object.freeze({ sources: [4, 5, 6, 7, 8], counts: [5, 5, 5, 4, 12], minHeight: 4.2, heightRange: 4.2, offset: 8.1, spacing: 9.6 }),
  Object.freeze({ sources: [9, 10, 11, 12], counts: [7, 7, 6, 12], minHeight: 8.4, heightRange: 7.6, offset: 7.9, spacing: 8.4 }),
  Object.freeze({ sources: [1, 3, 5, 8], counts: [6, 6, 5, 10], minHeight: 6.8, heightRange: 6.4, offset: 8, spacing: 8.8 })
]);
const POWERUP_TYPES = Object.freeze(["magnet", "shield", "multiplier", "overdrive"]);
const POWERUP_ALIASES = Object.freeze({
  magnet: "magnet",
  magnetic: "magnet",
  attraction: "magnet",
  shield: "shield",
  guard: "shield",
  barrier: "shield",
  multiplier: "multiplier",
  multiply: "multiplier",
  "score-multiplier": "multiplier",
  "score_multiplier": "multiplier",
  x2: "multiplier",
  overdrive: "overdrive",
  boost: "overdrive",
  turbo: "overdrive",
  rush: "overdrive"
});
const POWERUP_COLORS = Object.freeze({
  magnet: 0x69e8ff,
  shield: 0x8fdcff,
  multiplier: 0xff79a8,
  overdrive: 0xffd166
});
const POWERUP_IMPACT_POOL_SIZE = 4;
const TRACK_CLEARANCE = Object.freeze({
  halfWidth: ROAD_WIDTH / 2 + 1.08,
  decorNearZ: -3.6,
  decorFarZ: -62,
  premiumNearZ: -5.4,
  premiumSway: 0.18,
  overheadY: 4.35,
  cameraZ: 10.9
});
const ENTITY_POOL_LIMIT = 5;
const LOW_STATE_THRESHOLD = 34;
const COMPANION_SHOULDER_X = ROAD_WIDTH / 2 - 0.38;
const COMPANION_HAZARD_Z = 4.8;
const TRANSIENT_BURST_POOL_SIZE = 6;
const TRANSIENT_RING_POOL_SIZE = 10;
const TRANSIENT_PARTICLE_CAPACITY = 54;
const PLANT_STORY_KINDS = new Set(["flower", "plant"]);
const MUSIC_STORY_KINDS = new Set(["record", "wristband"]);
const LIGHT_STORY_KINDS = new Set(["key", "lamp"]);
const DARK_WEATHER_KINDS = new Set(["neon", "rain", "storm", "starlight"]);
const BRANCH_COLORS = Object.freeze({ attention: 0x67e8ff, mutuality: 0xff86a9, repair: 0x8df0bd });
const MATERIAL_TEXTURE_SLOTS = Object.freeze([
  "alphaMap", "aoMap", "anisotropyMap", "bumpMap", "clearcoatMap", "clearcoatNormalMap",
  "clearcoatRoughnessMap", "displacementMap", "emissiveMap", "envMap", "gradientMap",
  "iridescenceMap", "iridescenceThicknessMap", "lightMap", "map", "matcap", "metalnessMap",
  "normalMap", "roughnessMap", "sheenColorMap", "sheenRoughnessMap", "specularColorMap",
  "specularIntensityMap", "specularMap", "thicknessMap", "transmissionMap"
]);
const ROAD_SURFACE_SETTINGS = Object.freeze({
  "wet-asphalt": Object.freeze({ roughness: 0.38, metalness: 0.04, clearcoat: 0.62, clearcoatRoughness: 0.2 }),
  "mist-concrete": Object.freeze({ roughness: 0.82, metalness: 0.02, clearcoat: 0.16, clearcoatRoughness: 0.58 }),
  "neon-rail": Object.freeze({ roughness: 0.3, metalness: 0.22, clearcoat: 0.72, clearcoatRoughness: 0.18 }),
  "oily-stone": Object.freeze({ roughness: 0.58, metalness: 0.03, clearcoat: 0.44, clearcoatRoughness: 0.3 }),
  "dry-asphalt": Object.freeze({ roughness: 0.9, metalness: 0.01, clearcoat: 0.08, clearcoatRoughness: 0.7 }),
  "flooded-steel": Object.freeze({ roughness: 0.32, metalness: 0.34, clearcoat: 0.74, clearcoatRoughness: 0.16 }),
  "dawn-rail": Object.freeze({ roughness: 0.48, metalness: 0.24, clearcoat: 0.38, clearcoatRoughness: 0.26 })
});
const INTRO_CAMERA_CUES = Object.freeze({
  wide: Object.freeze({ x: 0, y: 5.92, z: 11.48, lookY: 0.72, lookZ: -21.5, fov: 61, action: "run" }),
  pan: Object.freeze({ x: -1.12, y: 5.58, z: 10.92, lookY: 0.82, lookZ: -18.5, fov: 59, action: "run" }),
  close: Object.freeze({ x: 0.72, y: 3.92, z: 8.28, lookY: 1.18, lookZ: -6.4, fov: 50, action: "idle" }),
  follow: Object.freeze({ x: 0, y: 4.82, z: 9.72, lookY: 0.72, lookZ: -14.8, fov: 57, action: "run" }),
  surge: Object.freeze({ x: 0, y: 4.56, z: 10.82, lookY: 0.58, lookZ: -19.8, fov: 64, action: "run" }),
  weave: Object.freeze({ x: 0.84, y: 4.72, z: 10.08, lookY: 0.68, lookZ: -16.8, fov: 61, action: "run" })
});

const QUALITY_PROFILES = Object.freeze([
  Object.freeze({ key: "cinematic", targetDrawCalls: 106, decorStride: 1, worldLayers: 3, premiumCity: true, shadows: true, particleScale: 1, entityRange: 58, entityMeshBudget: 12, roadDetail: 2 }),
  Object.freeze({ key: "balanced", targetDrawCalls: 90, decorStride: 2, worldLayers: 2, premiumCity: true, shadows: true, particleScale: 0.82, entityRange: 42, entityMeshBudget: 7, roadDetail: 1 }),
  Object.freeze({ key: "performance", targetDrawCalls: 92, decorStride: 3, worldLayers: 2, premiumCity: true, shadows: false, particleScale: 0.56, entityRange: 32, entityMeshBudget: 7, roadDetail: 1 })
]);

// Each act owns a spatial grammar. The collision lanes stay dependable while the
// road silhouette, destination landmark, camera and relationship blocking change.
const ACT_VISUAL_DIRECTIONS = Object.freeze([
  Object.freeze([
    Object.freeze({ id: "campus-release", topology: "arcade-squeeze", goal: "bell-rope", cameraRig: "follow-column", camera: [0, 5.18, 10.34, 0.72, -20.5, 54], tint: 0xb7d8d0, tintMix: 0.06, fog: 0.86, rain: 0.66, edge: 0.94, width: 0.98, curve: 0.06, split: 0, cadence: 4.5, goalX: -4.55, relation: "absent" }),
    Object.freeze({ id: "sun-shower-lane", topology: "root-undulation", goal: "vending-slot", cameraRig: "shoulder-beacon", camera: [0.16, 4.94, 10.02, 0.68, -18.8, 53], tint: 0xffd69b, tintMix: 0.1, fog: 0.78, rain: 0.42, edge: 1.06, width: 1.04, curve: 0.28, split: 0.08, cadence: 3.7, goalX: 4.48, relation: "absent" }),
    Object.freeze({ id: "library-crossing", topology: "crossing-converge", goal: "crossing-clock", cameraRig: "tele-crossing", camera: [-0.12, 5.34, 10.72, 0.82, -24, 55], tint: 0xffc776, tintMix: 0.08, fog: 0.82, rain: 0.24, edge: 1.12, width: 1.1, curve: 0.04, split: -0.18, cadence: 5.2, goalX: 4.4, relation: "absent" })
  ]),
  Object.freeze([
    Object.freeze({ id: "misty-levee", topology: "levee-outer-curve", goal: "route-board", cameraRig: "river-offset", camera: [-0.28, 5.48, 10.82, 0.7, -19.5, 59], tint: 0x8ed5cf, tintMix: 0.1, fog: 1.12, rain: 0, edge: 0.82, width: 0.92, curve: 0.45, split: 0.08, cadence: 5.8, goalX: 4.72, relation: "parallel-left" }),
    Object.freeze({ id: "record-alley", topology: "bridge-groove-split", goal: "listening-post", cameraRig: "portal-low", camera: [0.24, 4.72, 9.92, 0.62, -15.5, 56], tint: 0x74d5d5, tintMix: 0.12, fog: 0.92, rain: 0, edge: 1.1, width: 1.06, curve: 0.16, split: 0.34, cadence: 3.4, goalX: -4.66, relation: "yield-right" }),
    Object.freeze({ id: "bookstore-threshold", topology: "bookstore-step-funnel", goal: "cat-bell", cameraRig: "door-lock", camera: [-0.16, 5.22, 10.3, 0.82, -16.2, 57], tint: 0xf5d9a7, tintMix: 0.15, fog: 0.82, rain: 0, edge: 1.18, width: 1.14, curve: 0.04, split: -0.28, cadence: 4.1, goalX: -4.58, relation: "wait-left" })
  ]),
  Object.freeze([
    Object.freeze({ id: "station-rush", topology: "station-braid", goal: "departure-board", cameraRig: "clock-pressure", camera: [0, 4.82, 10.76, 0.52, -20.8, 64], tint: 0x365bc4, tintMix: 0.15, fog: 1.08, rain: 0.08, edge: 1.35, width: 0.9, curve: 0.18, split: 0.46, cadence: 2.8, goalX: 4.68, relation: "parallel-right" }),
    Object.freeze({ id: "last-train-transfer", topology: "platform-arc", goal: "call-box", cameraRig: "platform-tele", camera: [-0.2, 5.02, 10.4, 0.64, -17.5, 61], tint: 0xc24d9c, tintMix: 0.14, fog: 0.98, rain: 0.12, edge: 1.42, width: 1.02, curve: 0.5, split: 0.14, cadence: 3.2, goalX: -4.6, relation: "pace-left" }),
    Object.freeze({ id: "marquee-approach", topology: "marquee-release", goal: "letter-box", cameraRig: "marquee-dolly", camera: [0.18, 4.78, 9.88, 0.84, -14.8, 57], tint: 0xffac6e, tintMix: 0.18, fog: 0.82, rain: 0, edge: 1.55, width: 1.15, curve: 0.06, split: -0.18, cadence: 4.7, goalX: 4.48, relation: "handoff-right" })
  ]),
  Object.freeze([
    Object.freeze({ id: "market-taste", topology: "market-slalom", goal: "stall-sign", cameraRig: "market-weave", camera: [0.3, 5.22, 10.18, 0.66, -16.8, 60], tint: 0xffa43c, tintMix: 0.16, fog: 0.9, rain: 0, edge: 1.28, width: 0.94, curve: 0.52, split: 0.08, cadence: 3.1, goalX: -4.52, relation: "parallel-left" }),
    Object.freeze({ id: "music-crowd", topology: "music-crowd-ring", goal: "light-console", cameraRig: "beat-crane", camera: [-0.26, 5.92, 11.2, 0.72, -20.2, 63], tint: 0xeb4f87, tintMix: 0.18, fog: 0.96, rain: 0, edge: 1.62, width: 1.02, curve: 0.2, split: 0.48, cadence: 2.5, goalX: 4.62, relation: "sync-right" }),
    Object.freeze({ id: "quiet-river", topology: "river-singletrack", goal: "coin-lamp", cameraRig: "river-breath-cam", camera: [0, 5.58, 10.7, 0.8, -18.2, 58], tint: 0x6f8fc0, tintMix: 0.15, fog: 0.8, rain: 0, edge: 0.78, width: 0.86, curve: 0.28, split: -0.36, cadence: 6.2, goalX: -4.7, relation: "close-left" })
  ]),
  Object.freeze([
    Object.freeze({ id: "breakfast-block", topology: "breakfast-chicane", goal: "order-clips", cameraRig: "window-glance", camera: [0.16, 5.08, 10.12, 0.72, -16.6, 57], tint: 0xffd598, tintMix: 0.14, fog: 0.76, rain: 0, edge: 0.92, width: 0.98, curve: 0.38, split: 0.08, cadence: 4.2, goalX: 4.5, relation: "routine-right" }),
    Object.freeze({ id: "market-list", topology: "market-grid", goal: "market-scale", cameraRig: "market-high", camera: [-0.18, 5.88, 11.28, 0.68, -21.2, 61], tint: 0x9bbb78, tintMix: 0.1, fog: 0.86, rain: 0, edge: 1.04, width: 1.1, curve: 0.06, split: 0.42, cadence: 3.6, goalX: -4.62, relation: "misalign-left" }),
    Object.freeze({ id: "stairway-home", topology: "stair-switchback", goal: "doorbell", cameraRig: "stair-tilt", camera: [0.28, 5.38, 10.48, 0.9, -17.4, 58], tint: 0x7d8498, tintMix: 0.16, fog: 1.02, rain: 0.14, edge: 0.72, width: 0.9, curve: 0.62, split: 0.22, cadence: 3.9, goalX: 4.7, relation: "missed-right" })
  ]),
  Object.freeze([
    Object.freeze({ id: "under-flyover", topology: "flyover-zigzag", goal: "pump-shutter", cameraRig: "storm-low", camera: [-0.18, 4.68, 10.2, 0.58, -16.6, 58], tint: 0x344a66, tintMix: 0.22, fog: 1.32, rain: 1.26, edge: 0.82, width: 0.9, curve: 0.46, split: 0.22, cadence: 2.9, goalX: -4.6, relation: "express-ahead" }),
    Object.freeze({ id: "closure-detour", topology: "detour-boardwalk-fork", goal: "route-lamp", cameraRig: "fork-overhead", camera: [0.24, 5.82, 11.1, 0.72, -20.4, 61], tint: 0x546d87, tintMix: 0.2, fog: 1.18, rain: 1.08, edge: 1.14, width: 1.06, curve: 0.34, split: 0.58, cadence: 3.5, goalX: 4.72, relation: "listen-left" }),
    Object.freeze({ id: "shelter-approach", topology: "shelter-funnel", goal: "drip-chain", cameraRig: "shelter-tele", camera: [0, 5.18, 10.4, 0.82, -16.2, 56], tint: 0xd7b879, tintMix: 0.13, fog: 0.94, rain: 0.44, edge: 1.3, width: 1.16, curve: 0.04, split: -0.38, cadence: 5.4, goalX: -4.55, relation: "clear-obstacle" })
  ]),
  Object.freeze([
    Object.freeze({ id: "first-train-platform", topology: "platform-paired", goal: "train-board", cameraRig: "train-parallel", camera: [-0.16, 5.22, 10.38, 0.68, -18.2, 59], tint: 0x6ca5cf, tintMix: 0.13, fog: 0.82, rain: 0, edge: 1.22, width: 1.02, curve: 0.12, split: 0.34, cadence: 4.4, goalX: 4.66, relation: "luggage-left" }),
    Object.freeze({ id: "familiar-memory-street", topology: "memory-material-bands", goal: "post-box", cameraRig: "memory-match", camera: [0.2, 5.52, 10.62, 0.74, -18.8, 60], tint: 0xd8a8d2, tintMix: 0.14, fog: 0.84, rain: 0.08, edge: 1.36, width: 1.08, curve: 0.3, split: 0.26, cadence: 3.8, goalX: -4.54, relation: "luggage-handoff" }),
    Object.freeze({ id: "home-straight", topology: "home-converge", goal: "entry-tray", cameraRig: "home-dolly", camera: [0, 5.72, 11.1, 0.88, -21.8, 60], tint: 0xffd589, tintMix: 0.17, fog: 0.7, rain: 0, edge: 1.5, width: 1.18, curve: 0, split: -0.48, cadence: 6.4, goalX: 4.45, relation: "home-together" })
  ])
]);

const THEMED_ROUTE_MODULES = Object.freeze([
  Object.freeze([
    Object.freeze({ id: "camphor-arcade", surface: "rain-darkened-campus-stone", motif: "stone", shoulder: "arcade", rail: false, width: 0.9, curve: 0.16, walk: 1.08 }),
    Object.freeze({ id: "sunshower-garden", surface: "root-broken-garden-path", motif: "leaf", shoulder: "garden", rail: false, width: 0.92, curve: 0.34, walk: 1.12 }),
    Object.freeze({ id: "library-crossing", surface: "library-crosswalk-plaza", motif: "crossing", shoulder: "campus", rail: false, width: 0.94, curve: 0.08, walk: 1.16 })
  ]),
  Object.freeze([
    Object.freeze({ id: "mist-levee-boardwalk", surface: "river-timber-boardwalk", motif: "boardwalk", shoulder: "river", rail: false, width: 0.92, curve: 0.42, walk: 0.76 }),
    Object.freeze({ id: "record-alley-groove", surface: "record-shop-groove-stone", motif: "groove", shoulder: "storefront", rail: false, width: 1.02, curve: 0.25, walk: 0.9 }),
    Object.freeze({ id: "bookstore-threshold", surface: "book-spine-threshold-paving", motif: "bookspine", shoulder: "bookstore", rail: false, width: 1.1, curve: 0.09, walk: 1.04 })
  ]),
  Object.freeze([
    Object.freeze({ id: "station-braid", surface: "wet-metro-track-bed", motif: "rail", shoulder: "platform", rail: true, width: 0.92, curve: 0.14, walk: 1.05 }),
    Object.freeze({ id: "last-train-platform", surface: "tactile-platform-arc", motif: "tactile", shoulder: "platform", rail: true, width: 1, curve: 0.32, walk: 1.12 }),
    Object.freeze({ id: "cinema-marquee", surface: "cinema-neon-forecourt", motif: "marquee", shoulder: "cinema", rail: false, width: 1.14, curve: 0.08, walk: 1.08 })
  ]),
  Object.freeze([
    Object.freeze({ id: "market-cobble-run", surface: "lantern-market-cobble", motif: "cobble", shoulder: "stalls", rail: false, width: 0.94, curve: 0.4, walk: 0.82 }),
    Object.freeze({ id: "music-square-pulse", surface: "music-square-inlay", motif: "pulse", shoulder: "stage", rail: false, width: 1.06, curve: 0.2, walk: 0.98 }),
    Object.freeze({ id: "quiet-river-promenade", surface: "moonlit-river-promenade", motif: "wave", shoulder: "river", rail: false, width: 0.9, curve: 0.3, walk: 0.78 })
  ]),
  Object.freeze([
    Object.freeze({ id: "breakfast-shop-lane", surface: "breakfast-shop-checker", motif: "checker", shoulder: "shop", rail: false, width: 0.98, curve: 0.28, walk: 0.92 }),
    Object.freeze({ id: "morning-market-grid", surface: "morning-market-tile-grid", motif: "grid", shoulder: "market", rail: false, width: 1.1, curve: 0.12, walk: 1.02 }),
    Object.freeze({ id: "home-stairway", surface: "residential-step-paving", motif: "steps", shoulder: "homes", rail: false, width: 0.92, curve: 0.42, walk: 0.8 })
  ]),
  Object.freeze([
    Object.freeze({ id: "flyover-drain-line", surface: "flooded-flyover-steel", motif: "drain", shoulder: "truss", rail: false, width: 0.92, curve: 0.32, walk: 0.72 }),
    Object.freeze({ id: "storm-detour-deck", surface: "storm-detour-boardwalk", motif: "detour", shoulder: "warning", rail: false, width: 1.04, curve: 0.44, walk: 0.88 }),
    Object.freeze({ id: "shelter-dry-funnel", surface: "shelter-dry-stone", motif: "dryline", shoulder: "shelter", rail: false, width: 1.12, curve: 0.1, walk: 1.06 })
  ]),
  Object.freeze([
    Object.freeze({ id: "dawn-platform", surface: "dawn-tactile-platform", motif: "terminal", shoulder: "terminal", rail: true, width: 1, curve: 0.14, walk: 1.12 }),
    Object.freeze({ id: "memory-material-street", surface: "six-memory-material-bands", motif: "memory", shoulder: "promenade", rail: false, width: 1.08, curve: 0.3, walk: 0.96 }),
    Object.freeze({ id: "home-threshold", surface: "warm-home-threshold", motif: "threshold", shoulder: "home", rail: false, width: 1.16, curve: 0.06, walk: 1.1 })
  ])
]);

const PHASE_TRACKSIDE_PROPS = Object.freeze([
  Object.freeze([Object.freeze(["tree", "lamp", "tree"]), Object.freeze(["tree", "lamp", "bench"]), Object.freeze(["signal", "tree", "lamp"])]),
  Object.freeze([Object.freeze(["railing", "bench", "tree"]), Object.freeze(["bookstore", "lamp", "bench"]), Object.freeze(["bookstore", "shelter", "railing"])]),
  Object.freeze([Object.freeze(["station", "signal", "neon-sign"]), Object.freeze(["station", "shelter", "neon-sign"]), Object.freeze(["cinema", "neon-sign", "lamp"])]),
  Object.freeze([Object.freeze(["market", "lamp", "shelter"]), Object.freeze(["market", "neon-sign", "lamp"]), Object.freeze(["railing", "bench", "lamp"])]),
  Object.freeze([Object.freeze(["market", "home", "lamp"]), Object.freeze(["market", "tree", "bench"]), Object.freeze(["home", "tree", "lamp"])]),
  Object.freeze([Object.freeze(["maintenance", "warning", "signal"]), Object.freeze(["warning", "shelter", "railing"]), Object.freeze(["shelter", "lamp", "railing"])]),
  Object.freeze([Object.freeze(["terminal", "station", "signal"]), Object.freeze(["home", "lamp", "tree"]), Object.freeze(["home", "lamp", "bench"])])
]);

const ROUTE_VARIATION_ORDER = Object.freeze([0, 4, 1, 7, 3, 9, 2, 11, 5, 8, 6, 10]);

function routeModuleAt(stageIndex, phaseIndex, serial = 0) {
  const safeStage = clamp(Math.trunc(Number(stageIndex) || 0), 0, THEMED_ROUTE_MODULES.length - 1);
  const safePhase = clamp(Math.trunc(Number(phaseIndex) || 0), 0, 2);
  const base = THEMED_ROUTE_MODULES[safeStage][safePhase];
  const safeSerial = Math.max(0, Math.trunc(Number(serial) || 0));
  if (safeStage === 0) {
    return {
      ...base,
      serial: safeSerial,
      variant: 0,
      center: 0,
      widthScale: 0.94,
      walkScale: 1.12
    };
  }
  const variant = ROUTE_VARIATION_ORDER[(safeSerial + safeStage * 5 + safePhase * 3) % ROUTE_VARIATION_ORDER.length];
  const widthOffset = ((variant % 5) - 2) * 0.014;
  const center = Math.sin((safeSerial + 1) * 0.72 + safeStage * 0.61 + safePhase) * base.curve;
  return {
    ...base,
    serial: safeSerial,
    variant,
    center,
    widthScale: clamp(base.width + widthOffset, 0.88, 1.18),
    walkScale: clamp(base.walk + ((variant % 3) - 1) * 0.035, 0.68, 1.18)
  };
}

function routeShoulderTone(module, fallback) {
  const tones = {
    arcade: 0x4b463f, garden: 0x435543, campus: 0x625e52,
    river: 0x38535a, storefront: 0x55463d, bookstore: 0x68533f,
    platform: 0x343b4d, cinema: 0x3b2747, stalls: 0x6c4138,
    stage: 0x322c48, shop: 0x6a5845, market: 0x56614b,
    homes: 0x625b50, truss: 0x364451, warning: 0x554f49,
    shelter: 0x4d5658, terminal: 0x3e4b64, promenade: 0x4f5060,
    home: 0x715c49
  };
  return tones[module?.shoulder] || fallback;
}

function routeAccentTone(module, fallback) {
  const tones = {
    stone: 0xb9d7c5, leaf: 0xc9dc86, crossing: 0xf3c778,
    boardwalk: 0xd8b778, groove: 0x79d5c9, bookspine: 0xe6b46f,
    rail: 0x4ee2f0, tactile: 0xf3cc58, marquee: 0xff70c7,
    cobble: 0xf0a05f, pulse: 0xff6da9, wave: 0x77d3e0,
    checker: 0xe9be72, grid: 0xb8d38a, steps: 0xe4c38d,
    drain: 0x8bc9d9, detour: 0xe5b45d, dryline: 0xe1c486,
    terminal: 0xf1c55d, memory: 0xe2a5ce, threshold: 0xf2ce8b
  };
  return tones[module?.motif] || fallback;
}

const ROUTE_LANE_MARK_MOTIFS = new Set(["stone", "crossing", "checker", "grid", "drain", "dryline", "memory"]);
const ROUTE_PATCH_MOTIFS = new Set(["stone", "leaf", "cobble", "checker", "grid", "steps", "drain", "detour"]);
const ROUTE_PLANTED_SHOULDERS = new Set(["arcade", "garden", "campus", "bookstore", "shop", "market", "homes", "home"]);
const ROUTE_LIT_SHOULDERS = new Set(["river", "platform", "cinema", "stalls", "stage", "truss", "warning", "shelter", "terminal", "promenade"]);
const ROUTE_MOTIF_INSTANCES = new Set(["leaf", "groove", "cobble", "pulse", "wave", "tactile", "terminal", "memory"]);
const ROUTE_UTILITY_MOTIFS = new Set(["stone", "checker", "grid", "drain"]);
const ROUTE_DRAIN_MOTIFS = new Set(["stone", "leaf", "drain", "detour", "dryline"]);

const RELATIONSHIP_MODES = Object.freeze({
  absent: Object.freeze({ visible: false, lane: 0, z: -9, action: "run", weight: "none" }),
  "parallel-left": Object.freeze({ visible: true, lane: -1, z: -5.8, action: "run", weight: "none" }),
  "parallel-right": Object.freeze({ visible: true, lane: 1, z: -5.4, action: "run", weight: "none" }),
  "yield-right": Object.freeze({ visible: true, lane: 1, z: -3.7, action: "run", weight: "none" }),
  "wait-left": Object.freeze({ visible: true, lane: -1, z: -7.2, action: "idle", weight: "none" }),
  "pace-left": Object.freeze({ visible: true, lane: -1, z: -4.6, action: "run", weight: "none" }),
  "handoff-right": Object.freeze({ visible: true, lane: 1, z: -3.8, action: "run", weight: "handoff" }),
  "sync-right": Object.freeze({ visible: true, lane: 1, z: -4.1, action: "run", weight: "none" }),
  "close-left": Object.freeze({ visible: true, lane: -1, z: -2.9, action: "run", weight: "none" }),
  "routine-right": Object.freeze({ visible: true, lane: 1, z: -5, action: "run", weight: "none" }),
  "misalign-left": Object.freeze({ visible: true, lane: -1, z: -10.5, action: "run", weight: "none" }),
  "missed-right": Object.freeze({ visible: true, lane: 1, z: -15.5, action: "run", weight: "none" }),
  "express-ahead": Object.freeze({ visible: true, lane: 1, z: -7.8, action: "idle", weight: "none" }),
  "listen-left": Object.freeze({ visible: true, lane: -1, z: -4.2, action: "idle", weight: "none" }),
  "clear-obstacle": Object.freeze({ visible: true, lane: 1, z: -2.8, action: "idle", weight: "shared" }),
  "luggage-left": Object.freeze({ visible: true, lane: -1, z: -4.4, action: "run", weight: "companion" }),
  "luggage-handoff": Object.freeze({ visible: true, lane: 1, z: -3.2, action: "run", weight: "handoff" }),
  "home-together": Object.freeze({ visible: true, lane: 1, z: -3.6, action: "run", weight: "shared" })
});
const RELATION_FACE_PLAYER = new Set(["wait-left", "express-ahead", "listen-left", "clear-obstacle"]);
const RELATION_LINK_MODES = new Set(["handoff-right", "sync-right", "close-left", "listen-left", "clear-obstacle", "luggage-handoff", "home-together"]);
const RELATION_SHARED_MODES = new Set(["clear-obstacle", "home-together"]);

function introCameraCue(value) {
  const cue = String(value || "follow").toLowerCase();
  if (cue.includes("close")) return INTRO_CAMERA_CUES.close;
  if (cue.includes("surge")) return INTRO_CAMERA_CUES.surge;
  if (cue.includes("weave")) return INTRO_CAMERA_CUES.weave;
  if (cue.includes("wide")) return INTRO_CAMERA_CUES.wide;
  if (cue.includes("pan")) return INTRO_CAMERA_CUES.pan;
  return INTRO_CAMERA_CUES.follow;
}

function actDirectionAt(stageIndex, actIndex, phaseContent = null) {
  const safeStage = clamp(Math.trunc(Number(stageIndex) || 0), 0, ACT_VISUAL_DIRECTIONS.length - 1);
  const safeAct = clamp(Math.trunc(Number(actIndex) || 0), 0, 2);
  const base = ACT_VISUAL_DIRECTIONS[safeStage][safeAct];
  const director = objectValue(phaseContent?.director);
  const camera = Array.isArray(director.camera) && director.camera.length >= 6 ? director.camera.slice(0, 6) : base.camera;
  return {
    ...base,
    id: phaseContent?.id || director.actId || base.id,
    topology: director.routeTopologyKey || director.topology || base.topology,
    goal: director.visibleGoal || director.visibleGoalKey || base.goal,
    cameraRig: director.cameraRigKey || base.cameraRig,
    camera,
    relation: director.relationshipMode || director.relationshipPresence || base.relation,
    cadence: clamp(Number(director.cadence ?? phaseContent?.cadence ?? base.cadence) || base.cadence, 2.2, 7)
  };
}

function relationshipMode(value) {
  const key = String(value || "absent");
  return { key, ...(RELATIONSHIP_MODES[key] || RELATIONSHIP_MODES.absent) };
}

function directorCommandStamp(id, channel = "scene") {
  const match = /^([^:]+):([^:]+):(\d+):(\d+):/.exec(id);
  if (!match) return null;
  return { scope: `${match[1]}:${match[2]}:${match[3]}:${channel}`, ordinal: Number(match[4]) };
}

function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function colorValue(value, fallback) {
  if (Number.isFinite(Number(value))) return Number(value);
  if (typeof value === "string" && /^(#|0x|rgb\(|rgba\(|hsl\(|hsla\()/i.test(value.trim())) {
    try { return new THREE.Color(value).getHex(); } catch (_) {}
  }
  return fallback;
}

function contentStageAt(index, explicitStage = null) {
  if (explicitStage && typeof explicitStage === "object") return explicitStage;
  const stages = globalThis.RunnerLoveContent?.STAGES;
  return Array.isArray(stages) ? stages[index] || null : null;
}

function resolveStageVisualConfig(index, explicitStage = null) {
  const fallback = STAGE_CONFIGS[clamp(Math.trunc(Number(index) || 0), 0, STAGE_CONFIGS.length - 1)];
  const contentStage = contentStageAt(index, explicitStage);
  const declaredVisual = objectValue(contentStage?.visual);
  const declaredWorld = objectValue(contentStage?.world);
  const world = {
    ...declaredWorld,
    sceneMood: firstDefined(declaredWorld.sceneMood, contentStage?.sceneMood),
    timeWeather: firstDefined(declaredWorld.timeWeather, contentStage?.timeWeather),
    colorPalette: firstDefined(declaredWorld.colorPalette, contentStage?.colorPalette),
    landmarks: firstDefined(declaredWorld.landmarks, contentStage?.landmarks),
    roadDesign: firstDefined(declaredWorld.roadDesign, contentStage?.roadDesign),
    segments: firstDefined(declaredWorld.segments, contentStage?.segments)
  };
  const declaredTheme = objectValue(contentStage?.theme);
  const theme = {
    ...declaredTheme,
    colorPalette: firstDefined(declaredTheme.colorPalette, world.colorPalette, contentStage?.colorPalette)
  };
  const colors = { ...objectValue(theme.colorPalette), ...objectValue(theme.palette), ...objectValue(theme.colors) };
  const background = objectValue(world.background);
  const road = { ...fallback.world.road, ...objectValue(world.roadDesign), ...objectValue(world.road) };
  const roadMaterialKey = ROAD_SURFACE_SETTINGS[declaredVisual.roadMaterialKey]
    ? declaredVisual.roadMaterialKey
    : ROAD_SURFACE_SETTINGS[road.material] ? road.material : fallback.world.road.material;
  road.material = roadMaterialKey;
  road.geometry = declaredVisual.roadProfileKey || road.geometry || fallback.world.road.geometry;
  const lighting = { ...fallback.world.lighting, ...objectValue(world.lighting), ...objectValue(theme.lighting) };
  const authoredWeather = objectValue(world.timeWeather);
  const weather = typeof world.weather === "string"
    ? { ...fallback.world.weather, ...authoredWeather, kind: world.weather }
    : { ...fallback.world.weather, ...authoredWeather, ...objectValue(world.weather) };
  const particles = { ...fallback.world.particles, ...objectValue(world.particles) };
  const horizon = { ...fallback.world.horizon, ...objectValue(world.horizon), ...objectValue(world.depth) };
  const obstacleTheme = { ...fallback.world.obstacles, ...objectValue(contentStage?.obstacleDesign), ...objectValue(world.obstacles) };
  obstacleTheme.style = declaredVisual.obstacleVisualKey || obstacleTheme.style || fallback.world.obstacles.style;
  const resolvedWorld = {
    ...fallback.world,
    ...world,
    road,
    lighting,
    weather,
    particles,
    horizon,
    obstacles: obstacleTheme,
    scene: declaredVisual.sceneFactoryKey || world.scene || fallback.world.scene,
    landmarks: Array.isArray(world.landmarks) ? world.landmarks.slice(0, 8) : fallback.world.landmarks
  };
  return {
    ...fallback,
    id: contentStage?.id || fallback.id,
    asset: firstDefined(background.asset, world.asset, theme.backdrop, fallback.asset),
    district: contentStage?.district || world.district || fallback.district,
    destination: contentStage?.destination?.name || contentStage?.destination || world.destination?.name || world.destination || fallback.destination,
    routeStyle: firstDefined(road.routeStyle, world.routeStyle, fallback.routeStyle),
    weather: firstDefined(typeof world.weather === "string" ? world.weather : weather.preset, theme.weather, fallback.weather),
    sky: colorValue(firstDefined(colors.sky, theme.sky, background.sky), fallback.sky),
    skyTop: colorValue(firstDefined(colors.skyTop, theme.skyTop, background.top), fallback.skyTop),
    skyBottom: colorValue(firstDefined(colors.skyBottom, theme.skyBottom, background.bottom), fallback.skyBottom),
    fog: colorValue(firstDefined(colors.fog, theme.fog, background.fog), fallback.fog),
    fogDensity: clamp(Number(firstDefined(background.fogDensity, theme.fogDensity, fallback.fogDensity)) || fallback.fogDensity, 0.001, 0.04),
    key: colorValue(firstDefined(colors.key, theme.key), fallback.key),
    ambient: colorValue(firstDefined(colors.ambient, theme.ambient), fallback.ambient),
    ground: colorValue(firstDefined(colors.ground, theme.ground), fallback.ground),
    road: colorValue(firstDefined(colors.road, theme.road, road.color), fallback.road),
    curb: colorValue(firstDefined(colors.curb, theme.curb, road.curb), fallback.curb),
    accent: colorValue(firstDefined(colors.accent, theme.accent), fallback.accent),
    world: resolvedWorld,
    theme: { ...fallback.theme, ...theme, colors },
    visual: {
      sceneFactoryKey: declaredVisual.sceneFactoryKey || fallback.world.scene,
      roadMaterialKey,
      roadProfileKey: road.geometry,
      obstacleVisualKey: obstacleTheme.style,
      collectibleVisualKeys: Array.isArray(declaredVisual.collectibleVisualKeys) ? declaredVisual.collectibleVisualKeys.slice(0, 3) : [],
      introCueSequence: Array.isArray(declaredVisual.introCueSequence) ? declaredVisual.introCueSequence.slice(0, 4) : []
    }
  };
}

function frustumClearanceAt(z, halfExtent = 0) {
  const nearPressure = clamp((Number(z) + 24) / (TRACK_CLEARANCE.cameraZ + 24), 0, 1);
  return TRACK_CLEARANCE.halfWidth + halfExtent + nearPressure * 0.48;
}

function constrainTracksidePlacement(side, requestedX, requestedZ, halfWidth = 0, halfDepth = 0, parallaxTravel = 0) {
  const direction = side < 0 ? -1 : 1;
  const z = Math.min(Number(requestedZ) || TRACK_CLEARANCE.premiumNearZ, TRACK_CLEARANCE.premiumNearZ - halfDepth - Math.max(0, parallaxTravel));
  const x = direction * Math.max(Math.abs(Number(requestedX) || 0), frustumClearanceAt(z, halfWidth + TRACK_CLEARANCE.premiumSway));
  return { x, z };
}

function decorSegmentVisible(z) {
  return z <= TRACK_CLEARANCE.decorNearZ && z >= TRACK_CLEARANCE.decorFarZ;
}

function decorBoundsVisible(segmentZ, minZ, maxZ) {
  return decorSegmentVisible(segmentZ + Math.max(0, Number(maxZ) || 0))
    || (segmentZ + (Number(maxZ) || 0) <= TRACK_CLEARANCE.decorNearZ
      && segmentZ + (Number(minZ) || 0) >= TRACK_CLEARANCE.decorFarZ);
}

function fitTracksideObject(object, side, requestedX, requestedZ) {
  object.position.set(Number(requestedX) || 0, object.position.y, Number(requestedZ) || 0);
  object.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object);
  if (bounds.isEmpty()) return object;
  const innerEdge = side < 0 ? bounds.max.x : bounds.min.x;
  const requiredEdge = (side < 0 ? -1 : 1) * frustumClearanceAt(bounds.max.z);
  if (side < 0 && innerEdge > requiredEdge) object.position.x -= innerEdge - requiredEdge;
  if (side > 0 && innerEdge < requiredEdge) object.position.x += requiredEdge - innerEdge;
  object.updateMatrixWorld(true);
  bounds.setFromObject(object);
  object.userData.trackClearance = {
    side: side < 0 ? -1 : 1,
    innerEdge: side < 0 ? bounds.max.x : bounds.min.x,
    nearZ: bounds.max.z
  };
  return object;
}

function capturePoolBaseline(object) {
  const nodes = [];
  object.traverse((node) => {
    nodes.push({
      node,
      position: node.position.clone(),
      quaternion: node.quaternion.clone(),
      scale: node.scale.clone(),
      visible: node.visible,
      opacity: node.material?.opacity,
      emissiveIntensity: node.material?.emissiveIntensity
    });
  });
  object.userData.poolBaseline = nodes;
}

function resetPooledObject(object) {
  object.userData.poolBaseline?.forEach((entry) => {
    entry.node.position.copy(entry.position);
    entry.node.quaternion.copy(entry.quaternion);
    entry.node.scale.copy(entry.scale);
    entry.node.visible = entry.visible;
    if (entry.opacity !== undefined && entry.node.material) entry.node.material.opacity = entry.opacity;
    if (entry.emissiveIntensity !== undefined && entry.node.material) entry.node.material.emissiveIntensity = entry.emissiveIntensity;
  });
  object.visible = false;
  object.matrixAutoUpdate = true;
  object.updateMatrixWorld(true);
}

function validateModelEnvelope(object, limits) {
  object.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object);
  if (bounds.isEmpty()) return false;
  const size = bounds.getSize(new THREE.Vector3());
  return [size.x, size.y, size.z].every(Number.isFinite)
    && size.x <= limits.width
    && size.y <= limits.height
    && size.z <= limits.depth;
}

function normalizePowerup(value) {
  const candidate = value && typeof value === "object"
    ? value.powerup ?? value.type ?? value.id ?? value.kind ?? value.name
    : value;
  if (candidate === undefined || candidate === null) return null;
  return POWERUP_ALIASES[String(candidate).trim().toLowerCase()] || null;
}

function powerupDuration(value, fallback = 6) {
  const duration = Number(value);
  if (!Number.isFinite(duration) || duration <= 0) return fallback;
  return clamp(duration > 100 ? duration / 1000 : duration, 0.1, 60);
}

function powerupValueActive(value) {
  if (value && typeof value === "object") {
    if (value.active !== undefined) return Boolean(value.active);
    if (value.enabled !== undefined) return Boolean(value.enabled);
    if (value.remaining !== undefined) return Number(value.remaining) > 0;
    if (value.timeLeft !== undefined) return Number(value.timeLeft) > 0;
    return true;
  }
  if (typeof value === "number") return value > 0;
  return Boolean(value);
}

function readPowerupSnapshot(powerups, target) {
  POWERUP_TYPES.forEach((type) => { target[type] = false; });
  if (powerups === undefined || powerups === null) return false;
  const apply = (candidate, value = true) => {
    const type = normalizePowerup(candidate);
    if (type && powerupValueActive(value)) target[type] = true;
  };
  if (Array.isArray(powerups)) {
    powerups.forEach((entry) => apply(entry, entry));
    return true;
  }
  if (typeof powerups === "string") {
    apply(powerups);
    return true;
  }
  if (typeof powerups !== "object") return true;
  apply(powerups, powerups);
  if (Array.isArray(powerups.active)) powerups.active.forEach((entry) => apply(entry, entry));
  for (const key in powerups) {
    if (key === "active") continue;
    const value = powerups[key];
    const directType = normalizePowerup(key);
    if (directType) target[directType] = powerupValueActive(value);
    else if (value && typeof value === "object") apply(value, value);
  }
  return true;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function damp(current, target, smoothing, delta) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * delta));
}

function quadraticPoint(target, start, control, end, progress) {
  const inverse = 1 - progress;
  target.set(
    inverse * inverse * start.x + 2 * inverse * progress * control.x + progress * progress * end.x,
    inverse * inverse * start.y + 2 * inverse * progress * control.y + progress * progress * end.y,
    inverse * inverse * start.z + 2 * inverse * progress * control.z + progress * progress * end.z
  );
  return target;
}

const SHARED_GEOMETRIES = new WeakSet();
const SHARED_TEXTURES = new WeakSet();

function disposeObject(object) {
  if (!object?.traverse) return;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const sharedTextures = new Set();
  object.traverse((child) => {
    if (child.userData?.sharedTexture?.isTexture) sharedTextures.add(child.userData.sharedTexture);
    if (child.geometry) geometries.add(child.geometry);
    if (child.userData?.qualityMaterials) {
      for (let index = 0; index < child.userData.qualityMaterials.length; index += 1) {
        materials.add(child.userData.qualityMaterials[index]);
      }
    }
    if (!child.material || child.userData?.sharedMaterial) return;
    const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
    for (let index = 0; index < childMaterials.length; index += 1) materials.add(childMaterials[index]);
  });
  if (object.userData?.sharedTexture?.isTexture) sharedTextures.add(object.userData.sharedTexture);
  materials.forEach((item) => {
    for (let index = 0; index < MATERIAL_TEXTURE_SLOTS.length; index += 1) {
      const texture = item[MATERIAL_TEXTURE_SLOTS[index]];
      if (texture?.isTexture && !sharedTextures.has(texture) && !SHARED_TEXTURES.has(texture)) textures.add(texture);
    }
    if (item.uniforms) {
      for (const key in item.uniforms) {
        const texture = item.uniforms[key]?.value;
        if (texture?.isTexture && !sharedTextures.has(texture) && !SHARED_TEXTURES.has(texture)) textures.add(texture);
      }
    }
    item.dispose?.();
  });
  textures.forEach((item) => item.dispose?.());
  geometries.forEach((item) => { if (!SHARED_GEOMETRIES.has(item)) item.dispose?.(); });
  const runner = object.userData?.modelRunner;
  if (runner?.layers) {
    for (let index = 0; index < runner.layers.length; index += 1) {
      const layer = runner.layers[index];
      layer.mixer.stopAllAction();
      layer.mixer.uncacheRoot(layer.model);
    }
  }
}

function disposeGltf(gltf) {
  if (!gltf) return;
  const scenes = Array.isArray(gltf.scenes) && gltf.scenes.length ? gltf.scenes : gltf.scene ? [gltf.scene] : [];
  for (let index = 0; index < scenes.length; index += 1) disposeObject(scenes[index]);
}

function prepareEntityQuality(object) {
  const entries = [];
  object.traverse((child) => {
    if ((!child.isMesh && !child.isSkinnedMesh) || child.isInstancedMesh) return;
    if (!child.geometry.boundingSphere) child.geometry.computeBoundingSphere();
    const radius = child.geometry.boundingSphere?.radius || 0;
    const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
    let luminous = false;
    for (let index = 0; index < childMaterials.length; index += 1) {
      if ((Number(childMaterials[index]?.emissiveIntensity) || 0) > 0.7) luminous = true;
    }
    entries.push({ node: child, baselineVisible: child.visible, score: radius + (luminous ? 4 : 0), luminous });
  });
  entries.sort((left, right) => Number(right.luminous) - Number(left.luminous) || right.score - left.score);
  object.userData.qualityMeshes = entries;
}

function applyEntityQuality(object, meshBudget) {
  const entries = object.userData.qualityMeshes;
  if (!entries?.length) return;
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    entry.node.visible = entry.baselineVisible && (index < meshBudget || entry.luminous && index < meshBudget + 2);
  }
}

function applyCharacterRenderQuality(character, performanceMode, shadows) {
  character.traverse((child) => {
    if (!child.isMesh && !child.isSkinnedMesh) return;
    child.castShadow = shadows;
    child.receiveShadow = shadows;
    if (!child.userData.qualityMaterials) return;
    child.material = performanceMode
      ? child.userData.performanceMaterial
      : child.userData.qualityMaterials;
  });
}

function canvasTexture(width, height, painter) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  painter(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

let toonGradientTexture = null;
let campusToonGradientTexture = null;
let campusToonBrickTexture = null;
let campusToonPuddleTexture = null;
let campusLeafTexture = null;
let campusCloudTexture = null;
let campusLightMoteTexture = null;
let campusObstacleLeafTexture = null;
let campusMistTexture = null;
let campusCanopyArtTexture = null;
const roundedGeometryCache = new Map();
let heartGeometry = null;
let foliageClusterGeometry = null;
const stageTokenGeometryCache = new Map();
const phaseTokenGeometryCache = new Map();
const collectibleVisualStyleCache = new Map();
const campusStoryTextureCache = new Map();

function getToonGradientTexture() {
  if (toonGradientTexture) return toonGradientTexture;
  toonGradientTexture = canvasTexture(5, 1, (context) => {
    ["#394148", "#71808a", "#b9c3c6", "#edf0e9", "#ffffff"].forEach((color, index) => {
      context.fillStyle = color;
      context.fillRect(index, 0, 1, 1);
    });
  });
  toonGradientTexture.minFilter = THREE.NearestFilter;
  toonGradientTexture.magFilter = THREE.NearestFilter;
  SHARED_TEXTURES.add(toonGradientTexture);
  return toonGradientTexture;
}

function getCampusToonGradientTexture() {
  if (campusToonGradientTexture) return campusToonGradientTexture;
  campusToonGradientTexture = canvasTexture(5, 1, (context) => {
    ["#39474a", "#65777a", "#9eaaa5", "#d7ded2", "#fff1cf"].forEach((color, index) => {
      context.fillStyle = color;
      context.fillRect(index, 0, 1, 1);
    });
  });
  campusToonGradientTexture.minFilter = THREE.NearestFilter;
  campusToonGradientTexture.magFilter = THREE.NearestFilter;
  SHARED_TEXTURES.add(campusToonGradientTexture);
  return campusToonGradientTexture;
}

function campusToonMaterial(color, options = {}) {
  const toonMaterial = new THREE.MeshToonMaterial({
    color,
    map: options.map || null,
    gradientMap: getCampusToonGradientTexture(),
    emissive: options.emissive ?? new THREE.Color(color).multiplyScalar(0.025),
    emissiveIntensity: options.emissiveIntensity ?? 0.24,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    alphaTest: options.alphaTest ?? 0,
    side: options.side ?? THREE.FrontSide,
    depthWrite: options.depthWrite ?? true
  });
  toonMaterial.name = options.name || "campus-ink-toon";
  toonMaterial.userData.campusRenderStyle = "ink-toon-baked";
  return toonMaterial;
}

function campusInkMaterial(color = 0x25383a, opacity = 1) {
  const inkMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    side: THREE.BackSide,
    depthWrite: opacity >= 1,
    toneMapped: false
  });
  inkMaterial.name = "campus-selective-ink-outline";
  return inkMaterial;
}

function characterMaterial(color, options = {}) {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: getToonGradientTexture(),
    emissive: options.emissive ?? new THREE.Color(color).multiplyScalar(0.035),
    emissiveIntensity: options.emissiveIntensity ?? 0.32,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1
  });
}

function roundedPanelGeometry(width, height, depth, radius = 0.1) {
  const key = `${width}:${height}:${depth}:${radius}`;
  if (roundedGeometryCache.has(key)) return roundedGeometryCache.get(key);
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: Math.min(radius * 0.45, depth * 0.35),
    bevelThickness: Math.min(radius * 0.35, depth * 0.3),
    curveSegments: 5
  });
  geometry.center();
  SHARED_GEOMETRIES.add(geometry);
  roundedGeometryCache.set(key, geometry);
  return geometry;
}

function createRoadPatchGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.7, -0.42);
  shape.lineTo(-0.3, -0.86);
  shape.lineTo(0.26, -0.8);
  shape.lineTo(0.74, -0.38);
  shape.lineTo(0.62, 0.18);
  shape.lineTo(0.31, 0.76);
  shape.lineTo(-0.24, 0.88);
  shape.lineTo(-0.78, 0.36);
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  SHARED_GEOMETRIES.add(geometry);
  return geometry;
}

function createFoliageClusterGeometry() {
  if (foliageClusterGeometry) return foliageClusterGeometry;
  const lobes = [
    [-0.2, 0.02, 0.02, 0.74],
    [0.22, 0.05, -0.05, 0.68],
    [0, 0.25, 0.02, 0.82],
    [0.02, -0.08, 0.16, 0.62]
  ].map(([x, y, z, scale]) => {
    const lobe = new THREE.IcosahedronGeometry(0.47, 1);
    lobe.applyMatrix4(new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion(),
      new THREE.Vector3(scale, scale * 0.92, scale)
    ));
    return lobe;
  });
  foliageClusterGeometry = mergeGeometries(lobes, false);
  lobes.forEach((lobe) => lobe.dispose());
  foliageClusterGeometry.computeVertexNormals();
  SHARED_GEOMETRIES.add(foliageClusterGeometry);
  return foliageClusterGeometry;
}

function createHeartGeometry() {
  if (heartGeometry) return heartGeometry;
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.3);
  shape.bezierCurveTo(-0.52, -0.02, -0.62, 0.35, -0.3, 0.52);
  shape.bezierCurveTo(-0.08, 0.64, 0, 0.44, 0, 0.31);
  shape.bezierCurveTo(0, 0.44, 0.08, 0.64, 0.3, 0.52);
  shape.bezierCurveTo(0.62, 0.35, 0.52, -0.02, 0, -0.3);
  heartGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.045,
    bevelThickness: 0.04,
    curveSegments: 14
  });
  heartGeometry.center();
  SHARED_GEOMETRIES.add(heartGeometry);
  return heartGeometry;
}

function createStageTokenGeometry(stageIndex) {
  if (stageTokenGeometryCache.has(stageIndex)) return stageTokenGeometryCache.get(stageIndex);
  if (stageIndex === 0) {
    const geometry = createHeartGeometry().clone();
    geometry.scale(0.52, 0.52, 0.72);
    SHARED_GEOMETRIES.add(geometry);
    stageTokenGeometryCache.set(stageIndex, geometry);
    return geometry;
  }
  const shape = new THREE.Shape();
  if (stageIndex === 1) {
    shape.moveTo(-0.48, -0.3);
    shape.lineTo(-0.28, -0.3);
    shape.lineTo(-0.4, -0.5);
    shape.lineTo(-0.08, -0.3);
    shape.lineTo(0.48, -0.3);
    shape.lineTo(0.48, 0.34);
    shape.lineTo(-0.48, 0.34);
  } else if (stageIndex === 2) {
    shape.moveTo(-0.52, 0.4);
    shape.lineTo(0.54, 0);
    shape.lineTo(-0.52, -0.4);
    shape.lineTo(-0.26, 0);
  } else if (stageIndex === 3) {
    shape.moveTo(-0.5, -0.34);
    shape.lineTo(-0.36, -0.48);
    shape.lineTo(0.36, -0.48);
    shape.lineTo(0.5, -0.34);
    shape.lineTo(0.5, 0.34);
    shape.lineTo(0.36, 0.48);
    shape.lineTo(-0.36, 0.48);
    shape.lineTo(-0.5, 0.34);
  } else if (stageIndex === 4) {
    shape.moveTo(-0.48, -0.46);
    shape.lineTo(0.48, -0.46);
    shape.lineTo(0.48, 0.08);
    shape.lineTo(0, 0.52);
    shape.lineTo(-0.48, 0.08);
  } else if (stageIndex === 5) {
    shape.moveTo(0, 0.54);
    shape.lineTo(0.48, 0.18);
    shape.lineTo(0.3, -0.46);
    shape.lineTo(-0.3, -0.46);
    shape.lineTo(-0.48, 0.18);
  } else {
    const points = 10;
    for (let index = 0; index < points; index += 1) {
      const radius = index % 2 ? 0.23 : 0.52;
      const angle = Math.PI / 2 + index * Math.PI / 5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.04,
    bevelThickness: 0.035,
    curveSegments: 8
  });
  geometry.center();
  geometry.scale(0.58, 0.58, 0.72);
  SHARED_GEOMETRIES.add(geometry);
  stageTokenGeometryCache.set(stageIndex, geometry);
  return geometry;
}

function createPhaseTokenGeometry(stageIndex, phaseIndex = 0) {
  const phase = clamp(Math.trunc(Number(phaseIndex) || 0), 0, 2);
  const key = `${stageIndex}:${phase}`;
  if (phaseTokenGeometryCache.has(key)) return phaseTokenGeometryCache.get(key);
  const geometry = createStageTokenGeometry(stageIndex).clone();
  if (phase === 1) {
    geometry.rotateZ(Math.PI / 7);
    geometry.scale(0.92, 1.08, 1);
  } else if (phase === 2) {
    geometry.rotateZ(-Math.PI / 10);
    geometry.scale(1.08, 0.94, 1.08);
  }
  SHARED_GEOMETRIES.add(geometry);
  phaseTokenGeometryCache.set(key, geometry);
  return geometry;
}

function collectibleVisualStyle(kind, stageIndex, phaseIndex) {
  const normalized = String(kind || "stage-token").toLowerCase();
  const phase = clamp(Math.trunc(Number(phaseIndex) || 0), 0, 2);
  const key = `${stageIndex}:${phase}:${normalized}`;
  if (collectibleVisualStyleCache.has(key)) return collectibleVisualStyleCache.get(key);
  const base = new THREE.Color(STAGE_COLLECTIBLE_COLORS[stageIndex] || 0xffffff);
  let target = new THREE.Color(STAGE_TOKEN_COLORS[stageIndex] || 0xffffff);
  let scaleX = 1;
  let scaleY = 1;
  let tilt = 0;
  if (/rain|river|umbrella|water|soda/.test(normalized)) {
    target.setHex(0x75e8ff);
    scaleX = 0.86;
    scaleY = 1.12;
    tilt = -0.16;
  } else if (/music|record|vinyl|headphone|beat|wristband/.test(normalized)) {
    target.setHex(0xd986ff);
    scaleX = 1.12;
    scaleY = 0.9;
    tilt = 0.24;
  } else if (/coffee|bread|snack|drink|warm|cocoa|breakfast/.test(normalized)) {
    target.setHex(0xffb85c);
    scaleX = 1.08;
    scaleY = 1.02;
    tilt = -0.08;
  } else if (/photo|ticket|postcard|map|film|camera/.test(normalized)) {
    target.setHex(0xffedbd);
    scaleX = 1.16;
    scaleY = 0.84;
    tilt = 0.12;
  } else if (/plant|leaf|flower|grocery/.test(normalized)) {
    target.setHex(0x87e887);
    scaleX = 0.92;
    scaleY = 1.14;
    tilt = 0.2;
  } else if (/key|home|window|lamp|light|star/.test(normalized)) {
    target.setHex(0xffd76a);
    scaleX = 1.04;
    scaleY = 1.08;
    tilt = -0.2;
  } else if (/message|note|book|page|bookmark|word/.test(normalized)) {
    target.setHex(0xaeb8ff);
    scaleX = 1.14;
    scaleY = 0.9;
    tilt = 0.18;
  }
  const style = Object.freeze({
    color: base.lerp(target, 0.46 + phase * 0.08).getHex(),
    scaleX: scaleX * (phase === 1 ? 0.96 : 1),
    scaleY: scaleY * (phase === 2 ? 1.05 : 1),
    tilt: tilt + (phase - 1) * 0.08
  });
  collectibleVisualStyleCache.set(key, style);
  return style;
}

const STORY_PROP_COLORS = Object.freeze({
  ivory: 0xfff5df,
  cyan: 0x75e7ed,
  amber: 0xffb44d,
  coral: 0xff7568,
  violet: 0x9d72ff,
  lime: 0xcce85d,
  rose: 0xff6688,
  crimson: 0xd9334f,
  cream: 0xffe6bb,
  blue: 0x4d8fff,
  magenta: 0xef58dc,
  green: 0x59b87a,
  gold: 0xf6c75a
});

function storyPropColor(item, fallback) {
  return STORY_PROP_COLORS[item?.color] || fallback || 0xffd36b;
}

function campusStoryTokenTexture(item, fallback) {
  const kind = String(item?.kind || "note");
  const color = storyPropColor(item, fallback);
  const cacheKey = `${kind}:${color}`;
  if (campusStoryTextureCache.has(cacheKey)) return campusStoryTextureCache.get(cacheKey);
  const accent = `#${new THREE.Color(color).getHexString()}`;
  const texture = canvasTexture(256, 256, (context, width, height) => {
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(width / 2, height / 2);
    context.shadowColor = "rgba(22,42,40,.34)";
    context.shadowBlur = 18;
    context.shadowOffsetY = 8;
    if (["photo", "note", "ticket", "map"].includes(kind)) {
      const cardWidth = kind === "ticket" ? 150 : 126;
      const cardHeight = kind === "ticket" ? 70 : 146;
      context.rotate(kind === "photo" ? -0.08 : 0.045);
      context.fillStyle = "rgba(255,252,240,.98)";
      context.beginPath();
      context.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 10);
      context.fill();
      context.shadowBlur = 0;
      if (kind === "photo") {
        const sky = context.createLinearGradient(0, -54, 0, 34);
        sky.addColorStop(0, "#8cd4ef");
        sky.addColorStop(0.56, "#d9f0eb");
        sky.addColorStop(1, "#789979");
        context.fillStyle = sky;
        context.fillRect(-49, -55, 98, 88);
        context.fillStyle = "rgba(64,112,74,.8)";
        context.beginPath();
        context.arc(-31, 6, 24, Math.PI, 0);
        context.arc(28, 10, 26, Math.PI, 0);
        context.fill();
        context.fillStyle = accent;
        context.fillRect(-32, 48, 64, 4);
      } else if (kind === "ticket") {
        context.fillStyle = accent;
        context.globalAlpha = 0.88;
        context.fillRect(-54, -18, 108, 8);
        context.globalAlpha = 1;
        context.strokeStyle = "rgba(54,68,66,.45)";
        context.lineWidth = 2;
        context.setLineDash([5, 5]);
        context.beginPath();
        context.moveTo(24, -30);
        context.lineTo(24, 30);
        context.stroke();
        context.setLineDash([]);
        context.fillStyle = "rgba(44,62,60,.72)";
        context.fillRect(-54, 5, 54, 3);
      } else {
        const leaf = context.createLinearGradient(-36, -48, 26, 54);
        leaf.addColorStop(0, "#d8df78");
        leaf.addColorStop(1, "#8fa758");
        context.fillStyle = leaf;
        context.beginPath();
        context.moveTo(0, -49);
        context.bezierCurveTo(39, -24, 33, 24, 0, 53);
        context.bezierCurveTo(-32, 24, -37, -24, 0, -49);
        context.fill();
        context.strokeStyle = "rgba(255,255,224,.72)";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(0, -40);
        context.lineTo(0, 45);
        context.stroke();
      }
    } else if (kind === "umbrella") {
      context.rotate(-0.08);
      const canopy = context.createLinearGradient(-76, -54, 78, 34);
      canopy.addColorStop(0, "rgba(223,251,248,.96)");
      canopy.addColorStop(0.45, `${accent}cc`);
      canopy.addColorStop(1, "rgba(112,192,202,.78)");
      context.fillStyle = canopy;
      context.beginPath();
      context.arc(0, -9, 78, Math.PI, Math.PI * 2);
      context.quadraticCurveTo(52, 12, 26, -6);
      context.quadraticCurveTo(0, 17, -26, -6);
      context.quadraticCurveTo(-52, 12, -78, -9);
      context.closePath();
      context.fill();
      context.shadowBlur = 0;
      context.strokeStyle = "rgba(248,255,250,.72)";
      context.lineWidth = 3;
      for (const x of [-52, -26, 0, 26, 52]) {
        context.beginPath();
        context.moveTo(0, -83);
        context.quadraticCurveTo(x * 0.54, -32, x, -9);
        context.stroke();
      }
      context.strokeStyle = "#d6bd7b";
      context.lineWidth = 6;
      context.beginPath();
      context.moveTo(0, -80);
      context.lineTo(0, 72);
      context.quadraticCurveTo(0, 102, 24, 88);
      context.stroke();
    } else if (["drink", "coffee"].includes(kind)) {
      const can = context.createLinearGradient(-48, 0, 54, 0);
      can.addColorStop(0, "#d5e8df");
      can.addColorStop(0.42, accent);
      can.addColorStop(0.7, "#f7e7bd");
      can.addColorStop(1, "#708e87");
      context.fillStyle = can;
      context.beginPath();
      context.roundRect(-44, -76, 88, 152, 18);
      context.fill();
      context.shadowBlur = 0;
      context.fillStyle = "rgba(255,255,255,.62)";
      context.fillRect(-27, -58, 8, 116);
      context.strokeStyle = "rgba(44,65,61,.48)";
      context.lineWidth = 3;
      context.beginPath();
      context.ellipse(0, -72, 35, 8, 0, 0, Math.PI * 2);
      context.stroke();
    } else {
      const wrapper = context.createLinearGradient(-70, -40, 70, 48);
      wrapper.addColorStop(0, "#fff2c7");
      wrapper.addColorStop(0.5, accent);
      wrapper.addColorStop(1, "#fff7df");
      context.fillStyle = wrapper;
      context.beginPath();
      context.moveTo(-78, 0);
      context.lineTo(-108, -38);
      context.lineTo(-92, 38);
      context.closePath();
      context.moveTo(78, 0);
      context.lineTo(108, -38);
      context.lineTo(92, 38);
      context.closePath();
      context.fill();
      context.beginPath();
      context.roundRect(-78, -46, 156, 92, 38);
      context.fill();
    }
    context.restore();
  });
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  SHARED_TEXTURES.add(texture);
  campusStoryTextureCache.set(cacheKey, texture);
  return texture;
}

function createCampusStoryToken(item = {}, accent = 0xffd36b, particleTexture = null) {
  const group = new THREE.Group();
  const color = storyPropColor(item, accent);
  const storyModel = createStoryProp(item, accent, particleTexture, false);
  storyModel.scale.setScalar(0.72);
  storyModel.position.y = -0.02;
  storyModel.traverse((child) => {
    if (!child.isMesh || !child.material || child.material.isMeshBasicMaterial) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const converted = materials.map((source) => campusToonMaterial(source.color || color, {
      map: source.map || null,
      emissive: source.emissive || new THREE.Color(color).multiplyScalar(0.04),
      emissiveIntensity: Math.min(0.62, Number(source.emissiveIntensity) || 0.18),
      transparent: source.transparent,
      opacity: source.opacity,
      side: source.side,
      depthWrite: source.depthWrite,
      name: `campus-story-${item.kind || "keepsake"}`
    }));
    materials.forEach((source) => source.dispose?.());
    child.material = Array.isArray(child.material) ? converted : converted[0];
    child.castShadow = false;
    child.receiveShadow = false;
  });
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: getCampusLightMoteTexture(),
    color,
    transparent: true,
    opacity: 0.54,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  }));
  halo.scale.set(1.34, 1.34, 1);
  halo.position.z = -0.08;
  const approachComets = new THREE.Group();
  if (particleTexture) {
    for (let index = 0; index < 5; index += 1) {
      const comet = new THREE.Sprite(new THREE.SpriteMaterial({
        map: getCampusLightMoteTexture(),
        color,
        transparent: true,
        opacity: 0.34,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      }));
      comet.scale.set(0.15, 0.15, 1);
      comet.userData.offset = index / 5;
      approachComets.add(comet);
    }
  }
  group.add(halo, storyModel, approachComets);
  group.userData.kind = "story-item";
  group.userData.halo = halo;
  group.userData.approachComets = approachComets;
  group.userData.storyModel = storyModel;
  group.userData.campusStoryItem = true;
  group.userData.sharedTexture = particleTexture;
  return group;
}

function createStoryProp(item = {}, accent = 0xffd36b, particleTexture = null, carried = false) {
  const group = new THREE.Group();
  const color = storyPropColor(item, accent);
  const primary = material(color, { roughness: 0.34, metalness: 0.08, emissive: color, emissiveIntensity: carried ? 0.06 : 0.22 });
  const pale = material(0xfff7e8, { roughness: 0.72, metalness: 0.01 });
  const dark = material(0x1b252b, { roughness: 0.46, metalness: 0.28 });
  const gold = material(0xe6b84e, { roughness: 0.24, metalness: 0.82, emissive: 0x6d4310, emissiveIntensity: 0.18 });
  const glass = material(new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.38), {
    roughness: 0.08,
    metalness: 0.02,
    transparent: true,
    opacity: 0.56
  });
  const kind = item.kind || "packet";

  if (["photo", "note", "ticket", "map"].includes(kind)) {
    const width = kind === "ticket" ? 0.82 : kind === "map" ? 0.9 : 0.68;
    const height = kind === "ticket" ? 0.34 : 0.54;
    const paper = mesh(roundedPanelGeometry(width, height, 0.045, 0.035), pale, true);
    paper.rotation.x = -0.08;
    const ink = mesh(new THREE.PlaneGeometry(width * 0.72, height * 0.18), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    ink.position.set(0, kind === "photo" ? -0.13 : 0.05, 0.03);
    const stamp = mesh(new THREE.CircleGeometry(0.08, 18), new THREE.MeshBasicMaterial({ color: kind === "photo" ? 0x4b7184 : color, side: THREE.DoubleSide }));
    stamp.position.set(width * 0.27, height * 0.25, 0.032);
    group.add(paper, ink, stamp);
    if (kind === "map") {
      [-0.2, 0.2].forEach((x) => {
        const fold = mesh(new THREE.PlaneGeometry(0.012, height * 0.85), new THREE.MeshBasicMaterial({ color: 0x9b8e78, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
        fold.position.set(x, 0, 0.034);
        group.add(fold);
      });
    }
  } else if (kind === "book") {
    const cover = mesh(roundedPanelGeometry(0.68, 0.88, 0.13, 0.045), primary, true);
    cover.rotation.x = -0.16;
    const pages = mesh(new THREE.BoxGeometry(0.59, 0.76, 0.11), pale, true);
    pages.position.z = 0.02;
    const band = mesh(new THREE.BoxGeometry(0.12, 0.8, 0.145), gold, true);
    band.position.x = -0.17;
    group.add(cover, pages, band);
  } else if (kind === "record") {
    const disc = mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.055, 36), dark, true);
    disc.rotation.x = Math.PI / 2;
    const label = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.062, 28), primary, true);
    label.rotation.x = Math.PI / 2;
    const hole = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.07, 16), pale);
    hole.rotation.x = Math.PI / 2;
    group.add(disc, label, hole);
  } else if (["drink", "coffee"].includes(kind)) {
    const cup = mesh(new THREE.CylinderGeometry(0.23, 0.19, 0.58, 24), kind === "coffee" ? pale : glass, true);
    const sleeve = mesh(new THREE.CylinderGeometry(0.235, 0.215, 0.2, 24), primary, true);
    sleeve.position.y = -0.04;
    const lid = mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.055, 24), dark, true);
    lid.position.y = 0.305;
    const straw = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.36, 10), pale, true);
    straw.position.set(0.07, 0.49, 0);
    straw.rotation.z = -0.12;
    group.add(cup, sleeve, lid, straw);
  } else if (kind === "umbrella") {
    const canopy = mesh(new THREE.SphereGeometry(0.52, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), glass, true);
    canopy.scale.y = 0.58;
    canopy.position.y = 0.18;
    const shaft = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.92, 10), gold, true);
    shaft.position.y = -0.18;
    const handle = mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18, Math.PI), gold, true);
    handle.rotation.z = Math.PI;
    handle.position.set(0.1, -0.64, 0);
    group.add(canopy, shaft, handle);
  } else if (kind === "flower") {
    const stem = mesh(new THREE.CylinderGeometry(0.018, 0.025, 0.88, 9), material(0x3f9b61, { roughness: 0.8 }), true);
    stem.position.y = -0.12;
    stem.rotation.z = -0.22;
    const center = mesh(new THREE.SphereGeometry(0.12, 18, 12), gold, true);
    center.position.set(-0.1, 0.33, 0);
    group.add(stem, center);
    for (let index = 0; index < 7; index += 1) {
      const angle = index / 7 * Math.PI * 2;
      const petal = mesh(new THREE.SphereGeometry(0.13, 14, 10), primary, true);
      petal.scale.set(1.2, 0.68, 0.45);
      petal.position.set(-0.1 + Math.cos(angle) * 0.17, 0.33 + Math.sin(angle) * 0.17, 0);
      petal.rotation.z = angle;
      group.add(petal);
    }
  } else if (kind === "camera") {
    const body = mesh(roundedPanelGeometry(0.72, 0.52, 0.28, 0.08), pale, true);
    const lens = mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.22, 28), dark, true);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.2;
    const glassLens = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.225, 24), glass, true);
    glassLens.rotation.x = Math.PI / 2;
    glassLens.position.z = 0.22;
    const shutter = mesh(new THREE.BoxGeometry(0.12, 0.07, 0.08), primary, true);
    shutter.position.set(0.24, 0.28, 0);
    group.add(body, lens, glassLens, shutter);
  } else if (kind === "key") {
    const ring = mesh(new THREE.TorusGeometry(0.2, 0.045, 10, 28), gold, true);
    const shaft = mesh(new THREE.BoxGeometry(0.08, 0.48, 0.07), gold, true);
    shaft.position.y = -0.31;
    const tooth = mesh(new THREE.BoxGeometry(0.22, 0.08, 0.07), gold, true);
    tooth.position.set(0.07, -0.53, 0);
    group.add(ring, shaft, tooth);
  } else if (kind === "plant") {
    const pot = mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.34, 20), material(0xb96b48, { roughness: 0.78 }), true);
    pot.position.y = -0.22;
    for (let index = 0; index < 6; index += 1) {
      const leaf = mesh(new THREE.SphereGeometry(0.17, 14, 10), material(index % 2 ? 0x5dbb72 : 0x2f8654, { roughness: 0.72 }), true);
      leaf.scale.set(0.55, 1.35, 0.45);
      leaf.position.set(Math.sin(index * 2.1) * 0.18, 0.12 + (index % 3) * 0.13, Math.cos(index * 2.1) * 0.12);
      leaf.rotation.z = Math.sin(index) * 0.42;
      group.add(leaf);
    }
    group.add(pot);
  } else if (kind === "lamp") {
    const base = mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.16, 20), gold, true);
    base.position.y = -0.42;
    const stem = mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.54, 10), gold, true);
    stem.position.y = -0.12;
    const shade = mesh(new THREE.ConeGeometry(0.34, 0.4, 28, 1, true), glass, true);
    shade.position.y = 0.23;
    const bulb = mesh(new THREE.SphereGeometry(0.1, 16, 12), material(color, { emissive: color, emissiveIntensity: 3 }), true);
    bulb.position.y = 0.17;
    group.add(base, stem, shade, bulb);
  } else if (kind === "wristband") {
    const band = mesh(new THREE.TorusGeometry(0.31, 0.065, 10, 32), primary, true);
    band.rotation.x = 0.32;
    const tag = mesh(roundedPanelGeometry(0.26, 0.15, 0.07, 0.04), pale, true);
    tag.position.set(0.3, 0.02, 0);
    group.add(band, tag);
  } else if (kind === "cloth") {
    const towel = mesh(roundedPanelGeometry(0.78, 0.58, 0.16, 0.08), primary, true);
    towel.rotation.set(-0.16, 0.08, -0.12);
    const fold = mesh(new THREE.BoxGeometry(0.7, 0.035, 0.18), pale, true);
    fold.position.set(0.02, 0.02, 0.1);
    const stitch = mesh(new THREE.BoxGeometry(0.5, 0.025, 0.185), gold, true);
    stitch.position.set(0.02, -0.17, 0.11);
    group.add(towel, fold, stitch);
  } else {
    const bagColor = ["groceries", "snack", "packet"].includes(kind) ? primary : pale;
    const bag = mesh(roundedPanelGeometry(0.62, 0.72, 0.27, 0.055), bagColor, true);
    bag.position.y = -0.08;
    [-0.18, 0.18].forEach((x) => {
      const handle = mesh(new THREE.TorusGeometry(0.17, 0.022, 8, 18, Math.PI), dark, true);
      handle.rotation.z = Math.PI;
      handle.position.set(x, 0.34, 0);
      group.add(handle);
    });
    if (kind === "groceries") {
      [0x5cab6a, 0xe55f4d, 0xf0d16d].forEach((vegetableColor, index) => {
        const vegetable = mesh(new THREE.SphereGeometry(0.11, 12, 8), material(vegetableColor, { roughness: 0.8 }), true);
        vegetable.position.set((index - 1) * 0.16, 0.35 + (index % 2) * 0.08, 0);
        group.add(vegetable);
      });
    }
    group.add(bag);
  }

  if (!carried && particleTexture) {
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: particleTexture,
      color,
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    }));
    halo.scale.set(1.5, 1.5, 1);
    halo.position.z = -0.12;
    group.add(halo);
    group.userData.halo = halo;

    const markerMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.52,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false
    });
    const markerRing = mesh(new THREE.TorusGeometry(0.62, 0.034, 8, 42), markerMaterial);
    markerRing.rotation.x = Math.PI / 2;
    markerRing.position.y = -0.98;
    const markerOrbit = new THREE.Group();
    [-1, 1].forEach((direction, orbitIndex) => {
      const points = [];
      for (let index = 0; index <= 20; index += 1) {
        const ratio = index / 20;
        const angle = ratio * Math.PI * 1.7 * direction + orbitIndex * 1.35;
        const radius = 0.58 + Math.sin(ratio * Math.PI) * 0.14;
        points.push(new THREE.Vector3(Math.cos(angle) * radius, -0.12 + ratio * 0.62, Math.sin(angle) * radius * 0.56));
      }
      const orbitMaterial = markerMaterial.clone();
      orbitMaterial.opacity = orbitIndex ? 0.3 : 0.45;
      const orbit = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.018, 5, false), orbitMaterial);
      orbit.userData.spin = direction * (0.44 + orbitIndex * 0.16);
      markerOrbit.add(orbit);
    });
    const approachRibbon = new THREE.Group();
    [-1, 1].forEach((direction, ribbonIndex) => {
      const points = [];
      for (let index = 0; index <= 26; index += 1) {
        const ratio = index / 26;
        const wave = Math.sin(ratio * Math.PI * 2.2 + ribbonIndex * 1.8) * (0.08 + ratio * 0.18);
        points.push(new THREE.Vector3(
          direction * (0.23 + ratio * 0.18) + wave,
          -0.96 + Math.sin(ratio * Math.PI) * 0.035,
          0.08 + ratio * 3.15
        ));
      }
      const ribbonMaterial = markerMaterial.clone();
      ribbonMaterial.opacity = 0.2;
      const ribbon = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 28, 0.017, 5, false), ribbonMaterial);
      ribbon.userData.phase = ribbonIndex * Math.PI;
      approachRibbon.add(ribbon);
    });
    const approachComets = new THREE.Group();
    for (let index = 0; index < 6; index += 1) {
      const comet = new THREE.Sprite(new THREE.SpriteMaterial({
        map: particleTexture,
        color,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      }));
      comet.scale.set(0.22, 0.22, 1);
      comet.userData.offset = index / 6;
      approachComets.add(comet);
    }
    group.add(markerRing, markerOrbit, approachRibbon, approachComets);
    group.userData.markerRing = markerRing;
    group.userData.markerOrbit = markerOrbit;
    group.userData.approachRibbon = approachRibbon;
    group.userData.approachComets = approachComets;
  }
  group.userData.kind = "story-item";
  group.userData.storyKind = kind;
  group.userData.itemId = item.id || null;
  group.userData.storyColor = color;
  group.scale.setScalar(carried ? 0.58 : 1.24);
  return group;
}

function createCarryRig(accent) {
  const group = new THREE.Group();
  const shellColor = new THREE.Color(0x173143).lerp(new THREE.Color(accent), 0.08);
  const shell = mesh(roundedPanelGeometry(0.58, 0.46, 0.24, 0.08), material(shellColor, {
    roughness: 0.6,
    metalness: 0.08,
    transparent: true,
    opacity: 0.94
  }), true);
  shell.position.y = -0.07;
  const face = mesh(roundedPanelGeometry(0.49, 0.31, 0.025, 0.06), material(new THREE.Color(accent).lerp(new THREE.Color(0xffffff), 0.12), {
    emissive: accent,
    emissiveIntensity: 0.22,
    roughness: 0.38,
    metalness: 0.14
  }), true);
  face.position.set(0, -0.08, 0.14);
  const handle = mesh(new THREE.TorusGeometry(0.2, 0.026, 8, 28, Math.PI), material(0xe9c878, {
    roughness: 0.3,
    metalness: 0.72,
    emissive: 0x6a4315,
    emissiveIntensity: 0.12
  }), true);
  handle.position.set(0, 0.23, 0.01);
  handle.rotation.z = Math.PI;
  const clasp = mesh(createHeartGeometry(), material(accent, { emissive: accent, emissiveIntensity: 0.72, roughness: 0.26 }), true);
  clasp.scale.setScalar(0.13);
  clasp.position.set(0, -0.02, 0.17);
  group.add(shell, face, handle, clasp);
  group.userData.clasp = clasp;
  return group;
}

function createPickupAura(kind, color, particleTexture) {
  const group = new THREE.Group();
  const fadeMaterials = [];
  const addFxMaterial = (options = {}) => {
    const fxMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: options.opacity ?? 0.86,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false
    });
    fxMaterial.userData.maxOpacity = fxMaterial.opacity;
    fadeMaterials.push(fxMaterial);
    return fxMaterial;
  };

  for (let ribbonIndex = 0; ribbonIndex < 3; ribbonIndex += 1) {
    const direction = ribbonIndex % 2 ? -1 : 1;
    const phase = ribbonIndex * 1.9;
    const points = [];
    for (let index = 0; index <= 28; index += 1) {
      const ratio = index / 28;
      const angle = phase + ratio * Math.PI * (2.2 + ribbonIndex * 0.45) * direction;
      const radius = 0.18 + Math.sin(ratio * Math.PI) * (0.72 + ribbonIndex * 0.12);
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        -0.58 + ratio * 1.42 + Math.sin(angle * 0.5) * 0.12,
        Math.sin(angle) * radius * 0.5
      ));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const ribbon = mesh(new THREE.TubeGeometry(curve, 28, 0.014 + ribbonIndex * 0.003, 5, false), addFxMaterial({ opacity: 0.52 - ribbonIndex * 0.09 }));
    ribbon.userData.spin = direction * (0.35 + ribbonIndex * 0.16);
    group.add(ribbon);
  }

  const motif = new THREE.Group();
  const motifMaterial = addFxMaterial({ opacity: 0.88 });
  if (kind === "umbrella") {
    for (let index = 0; index < 4; index += 1) {
      const ripple = mesh(new THREE.TorusGeometry(0.3 + index * 0.15, 0.018, 7, 42), motifMaterial.clone());
      ripple.material.userData.maxOpacity = 0.7 - index * 0.1;
      fadeMaterials.push(ripple.material);
      ripple.rotation.x = Math.PI / 2;
      ripple.position.y = -0.55 + index * 0.05;
      ripple.userData.pulseOffset = index * 0.16;
      motif.add(ripple);
    }
  } else if (["camera", "photo"].includes(kind)) {
    [[-0.56, 0.4], [0.56, 0.4], [-0.56, -0.4], [0.56, -0.4]].forEach(([x, y], index) => {
      const corner = new THREE.Group();
      const horizontal = mesh(new THREE.BoxGeometry(0.24, 0.025, 0.02), motifMaterial.clone());
      const vertical = mesh(new THREE.BoxGeometry(0.025, 0.24, 0.02), motifMaterial.clone());
      fadeMaterials.push(horizontal.material, vertical.material);
      horizontal.position.x = x > 0 ? -0.1 : 0.1;
      vertical.position.y = y > 0 ? -0.1 : 0.1;
      corner.position.set(x, y, 0.1);
      corner.rotation.z = index % 2 ? 0.04 : -0.04;
      corner.add(horizontal, vertical);
      motif.add(corner);
    });
  } else if (["record", "wristband"].includes(kind)) {
    for (let index = 0; index < 4; index += 1) {
      const wave = mesh(new THREE.TorusGeometry(0.3 + index * 0.17, 0.02, 8, 48), motifMaterial.clone());
      fadeMaterials.push(wave.material);
      wave.rotation.set(Math.PI / 2 + index * 0.2, index * 0.38, 0);
      wave.userData.spin = index % 2 ? -1 : 1;
      motif.add(wave);
    }
  } else if (["flower", "plant"].includes(kind)) {
    for (let index = 0; index < 10; index += 1) {
      const angle = index / 10 * Math.PI * 2;
      const petal = mesh(new THREE.SphereGeometry(0.105, 10, 7), motifMaterial.clone());
      fadeMaterials.push(petal.material);
      petal.scale.set(1.5, 0.48, 0.26);
      petal.position.set(Math.cos(angle) * 0.52, Math.sin(angle) * 0.52, 0);
      petal.rotation.z = angle;
      petal.userData.spin = index % 2 ? -0.7 : 0.7;
      motif.add(petal);
    }
  } else if (kind === "key") {
    const lockRing = mesh(new THREE.TorusGeometry(0.45, 0.032, 8, 46), motifMaterial);
    motif.add(lockRing);
    for (let index = 0; index < 12; index += 1) {
      const angle = index / 12 * Math.PI * 2;
      const ray = mesh(new THREE.BoxGeometry(0.022, 0.22, 0.018), addFxMaterial({ opacity: 0.66 }));
      ray.position.set(Math.cos(angle) * 0.7, Math.sin(angle) * 0.7, 0);
      ray.rotation.z = angle - Math.PI / 2;
      motif.add(ray);
    }
  } else if (["book", "ticket", "note", "map"].includes(kind)) {
    for (let index = 0; index < 7; index += 1) {
      const page = mesh(roundedPanelGeometry(0.2, 0.12, 0.012, 0.018), addFxMaterial({ opacity: 0.58 }));
      const angle = index / 7 * Math.PI * 2;
      page.position.set(Math.cos(angle) * 0.58, Math.sin(angle) * 0.42, Math.sin(angle * 2) * 0.16);
      page.rotation.set(angle * 0.13, angle, angle + 0.4);
      page.userData.spin = index % 2 ? -0.8 : 0.8;
      motif.add(page);
    }
  } else {
    for (let index = 0; index < 3; index += 1) {
      const halo = mesh(new THREE.TorusGeometry(0.34 + index * 0.18, 0.022, 8, 44), addFxMaterial({ opacity: 0.74 - index * 0.13 }));
      halo.rotation.set(Math.PI / 2 + index * 0.35, index * 0.6, 0);
      halo.userData.spin = index % 2 ? -0.8 : 0.8;
      motif.add(halo);
    }
  }
  group.add(motif);

  const flash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: particleTexture,
    color,
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  }));
  flash.material.userData.maxOpacity = 0.46;
  fadeMaterials.push(flash.material);
  flash.scale.set(1.75, 1.75, 1);
  group.add(flash);
  group.userData.motif = motif;
  group.userData.fadeMaterials = fadeMaterials;
  return group;
}

function createPickupBridge(start, control, end, color, particleTexture) {
  const group = new THREE.Group();
  const materials = [];
  const basePoints = [];
  const point = new THREE.Vector3();
  for (let index = 0; index <= 34; index += 1) {
    const ratio = index / 34;
    quadraticPoint(point, start, control, end, ratio);
    basePoints.push(point.clone());
  }
  [-1, 1].forEach((direction, ribbonIndex) => {
    const points = basePoints.map((entry, index) => {
      const ratio = index / (basePoints.length - 1);
      const width = Math.sin(ratio * Math.PI) * (0.08 + ribbonIndex * 0.045);
      return entry.clone().add(new THREE.Vector3(
        direction * width + Math.sin(ratio * Math.PI * 4 + ribbonIndex) * 0.025,
        Math.cos(ratio * Math.PI * 3 + ribbonIndex) * 0.025,
        0
      ));
    });
    const ribbonMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: ribbonIndex ? 0.48 : 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });
    ribbonMaterial.userData.maxOpacity = ribbonMaterial.opacity;
    materials.push(ribbonMaterial);
    group.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 34, ribbonIndex ? 0.016 : 0.026, 5, false), ribbonMaterial));
  });
  const glints = [];
  for (let index = 0; index < 7; index += 1) {
    const glint = new THREE.Sprite(new THREE.SpriteMaterial({
      map: particleTexture,
      color: index % 2 ? color : 0xffffff,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    }));
    glint.scale.setScalar(0.18 + (index % 3) * 0.04);
    glint.userData.offset = index / 7;
    group.add(glint);
    glints.push(glint);
  }
  const impactMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const impact = mesh(new THREE.RingGeometry(0.12, 0.2, 32), impactMaterial);
  impact.position.copy(end);
  impact.rotation.x = Math.PI / 2;
  group.add(impact);
  group.userData.materials = materials;
  group.userData.glints = glints;
  group.userData.impact = impact;
  group.userData.sharedTexture = particleTexture;
  return group;
}

function makeWarningStripeTexture(accent) {
  const color = new THREE.Color(accent);
  return canvasTexture(384, 128, (context, width, height) => {
    context.fillStyle = "#151b22";
    context.fillRect(0, 0, width, height);
    context.save();
    context.translate(-80, 0);
    context.rotate(-0.58);
    for (let x = -height; x < width * 1.5; x += 62) {
      context.fillStyle = `rgb(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)})`;
      context.fillRect(x, -height, 28, height * 3);
    }
    context.restore();
    const shine = context.createLinearGradient(0, 0, 0, height);
    shine.addColorStop(0, "rgba(255,255,255,.32)");
    shine.addColorStop(0.42, "rgba(255,255,255,0)");
    shine.addColorStop(1, "rgba(0,0,0,.28)");
    context.fillStyle = shine;
    context.fillRect(0, 0, width, height);
  });
}

function makeSkylineFacadeTexture() {
  const texture = canvasTexture(384, 512, (context, width, height) => {
    const wall = context.createLinearGradient(0, 0, width, height);
    wall.addColorStop(0, "#81939b");
    wall.addColorStop(0.48, "#50646d");
    wall.addColorStop(1, "#283941");
    context.fillStyle = wall;
    context.fillRect(0, 0, width, height);
    for (let column = 0; column < 7; column += 1) {
      for (let row = 0; row < 12; row += 1) {
        const x = 22 + column * 52;
        const y = 20 + row * 40;
        const lit = (column * 13 + row * 7) % 6 < 2;
        context.fillStyle = lit ? "rgba(255,226,151,.82)" : "rgba(15,35,44,.74)";
        context.fillRect(x, y, 27, 19);
        context.fillStyle = "rgba(255,255,255,.14)";
        context.fillRect(x + 2, y + 2, 2, 15);
      }
    }
    context.fillStyle = "rgba(14,24,31,.32)";
    for (let x = 0; x < width; x += 52) context.fillRect(x, 0, 5, height);
    const topLight = context.createLinearGradient(0, 0, 0, 92);
    topLight.addColorStop(0, "rgba(255,255,255,.28)");
    topLight.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = topLight;
    context.fillRect(0, 0, width, 92);
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createSkyDome(config) {
  const uniforms = {
    topColor: { value: new THREE.Color(config.skyTop) },
    bottomColor: { value: new THREE.Color(config.skyBottom) },
    accentColor: { value: new THREE.Color(config.accent) },
    time: { value: 0 }
  };
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms,
    vertexShader: `varying vec3 vWorld; varying vec2 vUvSky; void main(){vUvSky=uv; vec4 world=modelMatrix*vec4(position,1.0); vWorld=world.xyz; gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader: `varying vec3 vWorld; varying vec2 vUvSky; uniform vec3 topColor; uniform vec3 bottomColor; uniform vec3 accentColor; uniform float time; void main(){float h=smoothstep(.05,.82,vUvSky.y); vec3 color=mix(bottomColor,topColor,h); float glow=exp(-pow((vUvSky.y-.26)*8.0,2.0)); color+=accentColor*glow*.10; float grain=sin(vWorld.x*.12+time*.03)*sin(vWorld.z*.09)*.012; gl_FragColor=vec4(color+grain,1.0);}`
  });
  const dome = mesh(new THREE.SphereGeometry(176, 32, 18), skyMaterial);
  dome.position.y = -18;
  dome.userData.uniforms = uniforms;
  return dome;
}

function createMetroSkyline(config) {
  const group = new THREE.Group();
  const profiles = {
    "campus-line": { minHeight: 3.6, heightRange: 6.8, offset: 11.5, spread: 8, spacing: 7.4, widthScale: 1.15 },
    "glass-station": { minHeight: 6, heightRange: 11, offset: 10.5, spread: 10, spacing: 6.6, widthScale: 0.9 },
    "neon-river": { minHeight: 10, heightRange: 16, offset: 9.8, spread: 13, spacing: 5.8, widthScale: 0.82 },
    "date-market": { minHeight: 4.4, heightRange: 8, offset: 10.2, spread: 7, spacing: 6.2, widthScale: 1.25 },
    "home-quarter": { minHeight: 3.2, heightRange: 5.6, offset: 11.8, spread: 9, spacing: 7.8, widthScale: 1.35 },
    "storm-bridge": { minHeight: 8, heightRange: 12, offset: 11.2, spread: 12, spacing: 6.8, widthScale: 0.95 },
    "sunrise-terminal": { minHeight: 5.8, heightRange: 9, offset: 10.8, spread: 10, spacing: 7, widthScale: 1.05 }
  };
  const profile = profiles[config.district] || profiles["glass-station"];
  const buildingMaterial = material(new THREE.Color(config.ground).lerp(new THREE.Color(config.skyTop), 0.28), { roughness: 0.78, metalness: 0.12 });
  buildingMaterial.map = makeSkylineFacadeTexture();
  const buildings = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), buildingMaterial, CITY_BUILDING_COUNT);
  const matrix = new THREE.Matrix4();
  const windows = [];
  const buildingData = [];
  for (let index = 0; index < CITY_BUILDING_COUNT; index += 1) {
    const side = index % 2 ? 1 : -1;
    const row = Math.floor(index / 2);
    const width = (2.8 + (index * 17 % 28) / 10) * profile.widthScale;
    const height = profile.minHeight + (index * 29 % Math.round(profile.heightRange * 10)) / 10;
    const depth = 3.6 + (index * 11 % 34) / 10;
    const x = side * (profile.offset + (index * 7 % profile.spread));
    const z = 8 - row * profile.spacing;
    buildingData.push({ x, z, height });
    matrix.compose(new THREE.Vector3(x, height / 2 - 0.2, z), new THREE.Quaternion(), new THREE.Vector3(width, height, depth));
    buildings.setMatrixAt(index, matrix);
    for (let floor = 1; floor < Math.floor(height / 2); floor += 2) {
      windows.push(x - side * (width / 2 + 0.03), floor * 1.6, z + depth * 0.28);
      windows.push(x - side * (width / 2 + 0.03), floor * 1.6, z - depth * 0.22);
    }
  }
  buildings.instanceMatrix.needsUpdate = true;
  buildings.receiveShadow = false;
  const antennaCount = 18;
  const antennas = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.055, 0.085, 1, 7), material(0x87949b, { roughness: 0.42, metalness: 0.8 }), antennaCount);
  for (let index = 0; index < antennaCount; index += 1) {
    const { x, z, height } = buildingData[index];
    matrix.compose(new THREE.Vector3(x, height + 0.65, z), new THREE.Quaternion(), new THREE.Vector3(1, 1.3, 1));
    antennas.setMatrixAt(index, matrix);
  }
  antennas.instanceMatrix.needsUpdate = true;
  const windowGeometry = new THREE.BufferGeometry();
  windowGeometry.setAttribute("position", new THREE.Float32BufferAttribute(windows, 3));
  const windowLights = new THREE.Points(windowGeometry, new THREE.PointsMaterial({
    map: makeParticleTexture(),
    color: config.accent,
    size: 0.32,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  group.add(buildings, antennas, windowLights);
  group.userData.buildings = buildings;
  group.userData.windowLights = windowLights;
  group.userData.district = config.district;
  return group;
}

function extractCityAsset(scene) {
  scene.updateMatrixWorld(true);
  let sourceMesh = null;
  scene.traverse((child) => {
    if (!sourceMesh && child.isMesh) sourceMesh = child;
  });
  if (!sourceMesh) return null;
  const geometry = sourceMesh.geometry.clone();
  geometry.applyMatrix4(sourceMesh.matrixWorld);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  geometry.translate(0, -box.min.y, 0);
  geometry.computeBoundingBox();
  const materialSource = Array.isArray(sourceMesh.material) ? sourceMesh.material[0] : sourceMesh.material;
  const sourceMaterial = materialSource.clone();
  sourceMaterial.roughness = 0.62;
  sourceMaterial.metalness = Math.min(0.18, sourceMaterial.metalness || 0);
  sourceMaterial.side = THREE.FrontSide;
  return {
    geometry,
    material: sourceMaterial,
    height: Math.max(0.01, geometry.boundingBox.max.y - geometry.boundingBox.min.y)
  };
}

function createPremiumDistrict(config, stageIndex, cityAssets) {
  const layout = DISTRICT_CITY_LAYOUTS[stageIndex];
  const group = new THREE.Group();
  const districtMaterials = [];
  const windowPositions = [];
  const clearancePlacements = [];
  const transform = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  const cityTints = [0xf4dfb9, 0xd7efed, 0x8fa8ff, 0xffb6c7, 0xf1d8a9, 0x8d9eb7, 0xffd5a6];
  const tint = new THREE.Color(cityTints[stageIndex]);

  layout.sources.forEach((sourceIndex, sourceSlot) => {
    const source = cityAssets[sourceIndex];
    if (!source) return;
    const count = layout.counts[sourceSlot];
    const sourceMaterial = source.material.clone();
    if (sourceIndex === 8) sourceMaterial.color.setHex(0x42664f);
    else sourceMaterial.color
      .setHex(config.theme.shadow)
      .lerp(new THREE.Color(config.theme.landmark), 0.48)
      .lerp(tint, 0.08);
    sourceMaterial.envMapIntensity = 0.58;
    sourceMaterial.emissive = new THREE.Color(config.accent).multiplyScalar(stageIndex === 2 || stageIndex === 5 ? 0.11 : 0.035);
    sourceMaterial.emissiveIntensity = stageIndex === 2 ? 0.62 : stageIndex === 5 ? 0.32 : 0.18;
    const instances = new THREE.InstancedMesh(source.geometry, sourceMaterial, count);
    instances.castShadow = false;
    instances.receiveShadow = false;
    instances.frustumCulled = true;
    for (let index = 0; index < count; index += 1) {
      const side = (index + sourceSlot) % 2 ? 1 : -1;
      const row = Math.floor(index / 2) + (sourceSlot % 2) * 2;
      const isTree = sourceIndex === 8;
      const isTank = sourceIndex === 12;
      const desiredHeight = isTree
        ? 3.4 + ((index * 7 + sourceSlot) % 9) * 0.15
        : isTank
          ? 2.1 + (index % 3) * 0.32
          : layout.minHeight + ((index * 19 + sourceSlot * 13) % Math.round(layout.heightRange * 10)) / 10;
      const uniformScale = desiredHeight / source.height;
      scale.setScalar(uniformScale);
      const sideVariation = isTree ? 0.8 + (index % 3) * 1.15 : ((index * 5 + sourceSlot * 3) % 5) * 0.55;
      const sourceBounds = source.geometry.boundingBox;
      const radialExtent = Math.max(
        Math.abs(sourceBounds.min.x), Math.abs(sourceBounds.max.x),
        Math.abs(sourceBounds.min.z), Math.abs(sourceBounds.max.z)
      ) * uniformScale;
      const halfWidth = radialExtent + 0.18;
      const halfDepth = radialExtent;
      const requestedX = side * (isTree ? 6.7 + sideVariation : isTank ? 8.4 + sideVariation * 0.4 : layout.offset + sideVariation);
      const requestedZ = -10 - row * layout.spacing - sourceSlot * 1.45;
      const placement = constrainTracksidePlacement(side, requestedX, requestedZ, halfWidth, halfDepth, layout.spacing);
      position.set(placement.x, -0.04, placement.z);
      rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), side > 0 ? -Math.PI / 2 : Math.PI / 2);
      transform.compose(position, rotation, scale);
      instances.setMatrixAt(index, transform);
      clearancePlacements.push({ side, x: position.x, z: position.z, halfWidth, halfDepth });
      const instanceTint = isTree
        ? new THREE.Color(0x315e4c).lerp(new THREE.Color(config.accent), 0.06 + (index % 3) * 0.018)
        : new THREE.Color(config.theme.shadow)
          .lerp(new THREE.Color(config.theme.landmark), 0.38 + (index % 3) * 0.055)
          .lerp(tint, 0.08);
      instances.setColorAt(index, instanceTint);
      if (!isTree && !isTank) {
        const windowRows = Math.max(2, Math.floor(desiredHeight / 2.2));
        for (let floor = 1; floor <= windowRows; floor += 2) {
          windowPositions.push(
            position.x - side * 0.2,
            1.1 + floor * 1.4,
            position.z + ((index + floor) % 3 - 1) * 0.8
          );
        }
      }
    }
    instances.instanceMatrix.needsUpdate = true;
    if (instances.instanceColor) instances.instanceColor.needsUpdate = true;
    instances.computeBoundingBox();
    instances.computeBoundingSphere();
    instances.userData.trackClearance = true;
    districtMaterials.push(sourceMaterial);
    group.add(instances);
  });

  const windowGeometry = new THREE.BufferGeometry();
  windowGeometry.setAttribute("position", new THREE.Float32BufferAttribute(windowPositions, 3));
  const windowLights = new THREE.Points(windowGeometry, new THREE.PointsMaterial({
    map: makeParticleTexture(),
    color: config.accent,
    size: 0.3,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  group.add(windowLights);
  group.userData.materials = districtMaterials;
  group.userData.windowLights = windowLights;
  group.userData.district = config.district;
  group.userData.premium = true;
  group.userData.spacing = layout.spacing;
  group.userData.baseX = 0;
  group.userData.clearancePlacements = clearancePlacements;
  group.userData.trackClearance = true;
  return group;
}

function createDistrictGateway(config) {
  const group = new THREE.Group();
  const frameMaterial = material(0x15252e, { roughness: 0.3, metalness: 0.82 });
  const edgeMaterial = material(config.accent, { emissive: config.accent, emissiveIntensity: 1.8, roughness: 0.22, metalness: 0.48 });
  const label = DISTRICT_LABELS[config.district] || "CITY RUN";
  const labelTexture = makeSignTexture(label, config.accent);
  [-5.66, 5.66].forEach((x) => {
    const post = mesh(new THREE.BoxGeometry(0.16, 5.7, 0.22), frameMaterial);
    post.position.set(x, 2.85, 0);
    const edge = mesh(new THREE.BoxGeometry(0.035, 5.42, 0.235), edgeMaterial);
    edge.position.set(x - Math.sign(x) * 0.075, 2.8, 0.01);
    group.add(post, edge);
  });
  const bridge = mesh(new THREE.BoxGeometry(11.5, 0.16, 0.24), frameMaterial);
  bridge.position.y = 5.65;
  const bridgeGlow = mesh(new THREE.BoxGeometry(11.18, 0.035, 0.26), edgeMaterial);
  bridgeGlow.position.y = 5.56;
  const sign = mesh(new THREE.PlaneGeometry(3.16, 0.7), new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true }));
  sign.position.set(0, 5.15, 0.14);
  group.add(bridge, bridgeGlow, sign);
  group.name = "districtGate";
  group.userData.districtGate = true;
  return group;
}

function createAmbientTrain(accent, side = 1) {
  const train = createTrain(accent, side > 0 ? 1 : 0);
  train.scale.set(0.86, 0.86, 1.35);
  train.position.x = side * 7.15;
  train.userData.ambient = true;
  train.userData.side = side;
  return train;
}

function createRunnerFootTrail(color) {
  const count = 28;
  const positions = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    map: makeParticleTexture(),
    color,
    size: 0.14,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  points.frustumCulled = false;
  points.userData.cursor = 0;
  return points;
}

function updateRunnerFootTrail(points, player, time, speed, delta) {
  const positions = points.geometry.attributes.position.array;
  for (let index = 0; index < positions.length / 3; index += 1) {
    positions[index * 3 + 2] += delta * speed * 0.78;
    positions[index * 3 + 1] -= delta * 0.06;
    if (positions[index * 3 + 2] > 6.5 || positions[index * 3 + 1] < -0.2) {
      const phase = (index * 17 + Math.floor(time * 18)) % 29;
      positions[index * 3] = player.position.x + (phase % 5 - 2) * 0.05;
      positions[index * 3 + 1] = 0.08 + (phase % 3) * 0.025;
      positions[index * 3 + 2] = player.position.z - 0.2 - (phase / 29) * 4.5;
    }
  }
  points.geometry.attributes.position.needsUpdate = true;
  points.material.opacity = damp(points.material.opacity, clamp((speed - 9) / 18, 0.22, 0.62), 5, delta);
}

function paintRoutePhaseTexture(context, width, height, stageIndex, phaseIndex, highlight) {
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  const pale = "rgba(238,244,235,.17)";
  const dark = "rgba(9,16,18,.2)";
  const accent = `${highlight}46`;
  if (stageIndex === 0 && phaseIndex === 0) {
    [128, 384].forEach((x) => {
      const shade = context.createLinearGradient(x - 72, 0, x + 72, 0);
      shade.addColorStop(0, "rgba(4,11,12,0)");
      shade.addColorStop(0.5, "rgba(4,11,12,.14)");
      shade.addColorStop(1, "rgba(4,11,12,0)");
      context.fillStyle = shade;
      context.fillRect(x - 72, 0, 144, height);
    });
    context.strokeStyle = "rgba(228,239,235,.11)";
    context.lineWidth = 3;
    for (let line = 0; line < 5; line += 1) {
      context.beginPath();
      context.moveTo(38 + line * 105, 0);
      context.bezierCurveTo(30 + line * 106, 164, 52 + line * 102, 348, 42 + line * 105, height);
      context.stroke();
    }
  } else if (stageIndex === 0 && phaseIndex === 1) {
    context.strokeStyle = "rgba(217,237,187,.22)";
    context.lineWidth = 8;
    for (let line = 0; line < 5; line += 1) {
      context.beginPath();
      context.moveTo(-20, 70 + line * 98);
      context.bezierCurveTo(130 + line * 16, 10 + line * 92, 300 - line * 13, 145 + line * 78, 540, 42 + line * 103);
      context.stroke();
    }
    context.fillStyle = "rgba(238,247,208,.13)";
    for (let index = 0; index < 22; index += 1) {
      context.beginPath();
      context.ellipse((index * 83) % width, (index * 137) % height, 15 + index % 4 * 5, 7 + index % 3 * 3, index * 0.48, 0, Math.PI * 2);
      context.fill();
    }
  } else if (stageIndex === 0) {
    context.fillStyle = "rgba(239,239,218,.24)";
    for (let row = 0; row < 9; row += 1) context.fillRect(36, 26 + row * 58, width - 72, 24);
    context.strokeStyle = accent;
    context.lineWidth = 8;
    context.strokeRect(18, 12, width - 36, height - 24);
  } else if (stageIndex === 1 && phaseIndex === 0) {
    for (let y = 0; y < height; y += 30) {
      context.fillStyle = y % 60 ? "rgba(226,213,174,.16)" : dark;
      context.fillRect(0, y, width, 3);
      context.fillStyle = "rgba(15,39,39,.18)";
      context.fillRect((y / 30 % 4) * 128, y, 3, 30);
    }
    context.strokeStyle = accent;
    context.lineWidth = 5;
    context.strokeRect(20, 0, width - 40, height);
  } else if (stageIndex === 1 && phaseIndex === 1) {
    context.strokeStyle = "rgba(35,57,53,.32)";
    for (let radius = 44; radius < 280; radius += 24) {
      context.lineWidth = radius % 48 ? 2 : 4;
      context.beginPath();
      context.arc(width * 0.52, height * 0.48, radius, 0, Math.PI * 2);
      context.stroke();
    }
    context.strokeStyle = accent;
    context.lineWidth = 4;
    context.beginPath();
    context.arc(width * 0.52, height * 0.48, 108, 0.15, Math.PI * 1.76);
    context.stroke();
  } else if (stageIndex === 1) {
    const spineColors = ["rgba(234,194,137,.2)", "rgba(119,177,171,.18)", "rgba(184,111,98,.17)"];
    for (let group = 0; group < 6; group += 1) {
      for (let spine = 0; spine < 7; spine += 1) {
        context.fillStyle = spineColors[(group + spine) % spineColors.length];
        context.fillRect(20 + spine * 68 + group % 2 * 16, group * 86 + 8, 34 + spine % 3 * 7, 68);
      }
    }
    context.fillStyle = "rgba(244,226,184,.21)";
    context.fillRect(0, height - 48, width, 48);
  } else if (stageIndex === 2 && phaseIndex === 0) {
    [92, 164, 256, 348, 420].forEach((x, index) => {
      context.fillStyle = index === 2 ? "rgba(242,112,211,.24)" : "rgba(67,222,244,.2)";
      context.fillRect(x - 4, 0, 8, height);
    });
    for (let y = 0; y < height; y += 44) {
      context.fillStyle = "rgba(188,218,229,.2)";
      context.fillRect(44, y, width - 88, 4);
    }
  } else if (stageIndex === 2 && phaseIndex === 1) {
    context.fillStyle = "rgba(255,211,90,.24)";
    for (let y = 0; y < height; y += 42) {
      for (let x = 36; x < width - 20; x += 28) {
        context.beginPath();
        context.arc(x, y + 20, 4.2, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.strokeStyle = accent;
    context.lineWidth = 5;
    context.strokeRect(28, 0, width - 56, height);
  } else if (stageIndex === 2) {
    context.strokeStyle = accent;
    context.lineWidth = 7;
    for (let ray = 0; ray < 9; ray += 1) {
      context.beginPath();
      context.moveTo(width / 2, height + 20);
      context.lineTo(-80 + ray * 84, 0);
      context.stroke();
    }
    context.fillStyle = "rgba(255,238,195,.17)";
    for (let y = 28; y < height; y += 86) context.fillRect(40, y, width - 80, 26);
  } else if (stageIndex === 3 && phaseIndex === 0) {
    for (let row = 0; row < 12; row += 1) {
      for (let column = -1; column < 8; column += 1) {
        context.strokeStyle = row % 2 ? "rgba(240,180,126,.2)" : "rgba(171,111,105,.17)";
        context.lineWidth = 3;
        context.beginPath();
        context.ellipse(column * 74 + row % 2 * 38, row * 46, 39, 23, 0, 0, Math.PI * 2);
        context.stroke();
      }
    }
  } else if (stageIndex === 3 && phaseIndex === 1) {
    for (let bar = 0; bar < 17; bar += 1) {
      const barHeight = 70 + (bar * 47 % 190);
      context.fillStyle = bar % 3 === 0 ? "rgba(255,112,167,.24)" : bar % 3 === 1 ? "rgba(87,222,231,.2)" : "rgba(255,201,102,.18)";
      context.fillRect(12 + bar * 30, height / 2 - barHeight / 2, 16, barHeight);
    }
    context.strokeStyle = accent;
    context.lineWidth = 5;
    context.beginPath();
    context.arc(width / 2, height / 2, 188, 0, Math.PI * 2);
    context.stroke();
  } else if (stageIndex === 3) {
    context.strokeStyle = "rgba(131,191,219,.24)";
    context.lineWidth = 7;
    for (let wave = 0; wave < 7; wave += 1) {
      context.beginPath();
      context.moveTo(-20, 34 + wave * 78);
      context.bezierCurveTo(140, -28 + wave * 82, 354, 116 + wave * 70, 540, 30 + wave * 78);
      context.stroke();
    }
  } else if (stageIndex === 4 && phaseIndex === 0) {
    for (let y = 0; y < height; y += 64) {
      for (let x = 0; x < width; x += 64) {
        context.fillStyle = (x + y) / 64 % 2 ? "rgba(230,194,132,.15)" : "rgba(43,69,54,.15)";
        context.fillRect(x, y, 60, 60);
      }
    }
  } else if (stageIndex === 4 && phaseIndex === 1) {
    context.strokeStyle = "rgba(219,202,150,.18)";
    context.lineWidth = 3;
    for (let x = 0; x < width; x += 72) context.strokeRect(x, 0, 68, height);
    for (let y = 0; y < height; y += 72) context.strokeRect(0, y, width, 68);
    context.fillStyle = accent;
    for (let index = 0; index < 12; index += 1) context.fillRect((index * 101) % width, (index * 163) % height, 54, 18);
  } else if (stageIndex === 4) {
    for (let step = 0; step < 9; step += 1) {
      context.fillStyle = step % 2 ? "rgba(30,45,39,.2)" : "rgba(224,196,153,.16)";
      context.fillRect(18 + step * 4, step * 58, width - 36 - step * 8, 48);
    }
    context.strokeStyle = accent;
    context.lineWidth = 8;
    context.strokeRect(76, height - 116, width - 152, 104);
  } else if (stageIndex === 5 && phaseIndex === 0) {
    context.strokeStyle = "rgba(170,205,220,.22)";
    context.lineWidth = 4;
    for (let y = 0; y < height; y += 68) context.strokeRect(8, y + 4, width - 16, 58);
    context.fillStyle = "rgba(12,25,35,.34)";
    [92, 420].forEach((x) => context.fillRect(x, 0, 22, height));
  } else if (stageIndex === 5 && phaseIndex === 1) {
    context.strokeStyle = "rgba(220,190,127,.22)";
    context.lineWidth = 9;
    for (let line = -6; line < 12; line += 1) {
      context.beginPath();
      context.moveTo(line * 64, 0);
      context.lineTo(line * 64 + 310, height);
      context.stroke();
    }
    context.fillStyle = "rgba(255,111,88,.2)";
    for (let y = 20; y < height; y += 116) context.fillRect(42, y, width - 84, 16);
  } else if (stageIndex === 5) {
    const dry = context.createLinearGradient(0, 0, width, 0);
    dry.addColorStop(0, "rgba(197,218,226,.04)");
    dry.addColorStop(0.35, "rgba(236,215,167,.2)");
    dry.addColorStop(0.65, "rgba(236,215,167,.2)");
    dry.addColorStop(1, "rgba(197,218,226,.04)");
    context.fillStyle = dry;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = accent;
    context.lineWidth = 5;
    context.strokeRect(146, 0, width - 292, height);
  } else if (stageIndex === 6 && phaseIndex === 0) {
    context.fillStyle = "rgba(246,202,92,.22)";
    [58, 454].forEach((x) => context.fillRect(x, 0, 12, height));
    for (let y = 0; y < height; y += 48) {
      context.fillStyle = "rgba(212,226,238,.14)";
      context.fillRect(0, y, width, 4);
      for (let x = 28; x < width; x += 32) {
        context.beginPath();
        context.arc(x, y + 18, 3.2, 0, Math.PI * 2);
        context.fill();
      }
    }
  } else if (stageIndex === 6 && phaseIndex === 1) {
    const bandColors = ["rgba(104,167,198,.16)", "rgba(217,157,194,.15)", "rgba(232,194,115,.16)", "rgba(107,186,159,.15)", "rgba(159,131,204,.15)", "rgba(224,128,107,.14)"];
    bandColors.forEach((color, index) => {
      context.fillStyle = color;
      context.fillRect(0, index * height / bandColors.length, width, height / bandColors.length - 5);
    });
    context.strokeStyle = accent;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(24, height - 38);
    context.bezierCurveTo(140, 372, 344, 190, width - 24, 28);
    context.stroke();
  } else {
    const warmth = context.createRadialGradient(width / 2, height, 18, width / 2, height, width * 0.72);
    warmth.addColorStop(0, "rgba(255,214,140,.28)");
    warmth.addColorStop(1, "rgba(255,214,140,0)");
    context.fillStyle = warmth;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(244,220,173,.23)";
    context.lineWidth = 8;
    context.strokeRect(74, 24, width - 148, height - 48);
    context.fillStyle = accent;
    context.fillRect(118, height - 70, width - 236, 26);
  }
  context.restore();
}

function makeCampusToonRoadTexture(phaseIndex = 0) {
  const phases = [
    { edge: "#344c5b", base: "#526d79", mid: "#78939c", sky: "#c6e7ed", warm: "#f1c47b", shadow: "#233c45" },
    { edge: "#3e5660", base: "#637a80", mid: "#8ba09d", sky: "#d4e9df", warm: "#f5d482", shadow: "#29453f" },
    { edge: "#4e5c63", base: "#727f82", mid: "#9aa4a1", sky: "#e3ece4", warm: "#efb47d", shadow: "#36484c" }
  ];
  const palette = phases[phaseIndex] || phases[0];
  const texture = canvasTexture(512, 512, (context, width, height) => {
    const asphalt = context.createLinearGradient(0, 0, width, 0);
    asphalt.addColorStop(0, palette.edge);
    asphalt.addColorStop(0.12, palette.base);
    asphalt.addColorStop(0.34, palette.mid);
    asphalt.addColorStop(0.5, palette.base);
    asphalt.addColorStop(0.72, palette.mid);
    asphalt.addColorStop(0.9, palette.base);
    asphalt.addColorStop(1, palette.edge);
    context.fillStyle = asphalt;
    context.fillRect(0, 0, width, height);

    const reflectedSky = context.createLinearGradient(width * 0.08, 0, width * 0.92, 0);
    reflectedSky.addColorStop(0, "rgba(217,239,241,0)");
    reflectedSky.addColorStop(0.23, "rgba(217,239,241,.08)");
    reflectedSky.addColorStop(0.48, "rgba(237,250,247,.2)");
    reflectedSky.addColorStop(0.7, "rgba(196,226,232,.08)");
    reflectedSky.addColorStop(1, "rgba(196,226,232,0)");
    context.fillStyle = reflectedSky;
    context.fillRect(0, 0, width, height);

    // Long painterly edge washes preserve depth without exposing the repeating road tile.
    context.fillStyle = "rgba(25,52,57,.15)";
    context.beginPath();
    context.moveTo(-24, -12);
    context.bezierCurveTo(88, 78, 38, 186, 104, 278);
    context.bezierCurveTo(146, 352, 72, 430, 126, 530);
    context.lineTo(-24, 530);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(width + 24, -12);
    context.bezierCurveTo(420, 96, 474, 210, 402, 302);
    context.bezierCurveTo(360, 372, 446, 442, 386, 530);
    context.lineTo(width + 24, 530);
    context.closePath();
    context.fill();

    const washes = phaseIndex === 0
      ? [[128, 72, 98, 34], [344, 204, 122, 42], [218, 394, 142, 47]]
      : phaseIndex === 1
        ? [[116, 118, 114, 38], [370, 282, 126, 45], [232, 448, 150, 42]]
        : [[118, 82, 118, 38], [382, 224, 132, 44], [252, 410, 148, 48]];
    washes.forEach(([x, y, radiusX, radiusY], index) => {
      const water = context.createRadialGradient(x, y, 2, x, y, radiusX);
      water.addColorStop(0, index === 1 ? "rgba(248,222,166,.2)" : "rgba(222,244,247,.25)");
      water.addColorStop(0.48, index === 1 ? "rgba(241,196,123,.08)" : "rgba(190,226,233,.1)");
      water.addColorStop(1, "rgba(205,235,239,0)");
      context.save();
      context.translate(x, y);
      context.scale(1, radiusY / radiusX);
      context.fillStyle = water;
      context.beginPath();
      context.arc(0, 0, radiusX, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });

    context.strokeStyle = "rgba(232,248,248,.08)";
    context.lineCap = "round";
    [82, 205, 326, 442].forEach((x, index) => {
      context.lineWidth = index % 2 ? 2.2 : 1.4;
      context.beginPath();
      context.moveTo(x, -18);
      context.bezierCurveTo(x + 22, 112, x - 25, 300, x + 12, 530);
      context.stroke();
    });

    let seed = 2309 + phaseIndex * 977;
    for (let index = 0; index < 170; index += 1) {
      seed = seed * 1664525 + 1013904223 | 0;
      const x = Math.abs(seed) % width;
      seed = seed * 1664525 + 1013904223 | 0;
      const y = Math.abs(seed) % height;
      const alpha = 0.025 + (index % 5) * 0.009;
      context.fillStyle = index % 4 === 0 ? `rgba(229,244,243,${alpha})` : `rgba(22,45,51,${alpha})`;
      context.fillRect(x, y, 1 + index % 3, 1 + (index + 1) % 2);
    }

    if (phaseIndex === 0) {
      context.fillStyle = "rgba(20,49,48,.15)";
      [[-20, 44], [426, 76]].forEach(([x, size]) => {
        for (let leaf = 0; leaf < 15; leaf += 1) {
          context.beginPath();
          context.ellipse(x + leaf * 9, 44 + leaf % 5 * 78, size * 0.48, size * 0.19, -0.42 + leaf * 0.08, 0, Math.PI * 2);
          context.fill();
        }
      });
      const amberReflection = context.createLinearGradient(54, 0, 174, 0);
      amberReflection.addColorStop(0, "rgba(255,213,145,0)");
      amberReflection.addColorStop(0.5, "rgba(255,213,145,.09)");
      amberReflection.addColorStop(1, "rgba(255,213,145,0)");
      context.fillStyle = amberReflection;
      context.fillRect(54, 0, 120, height);
    } else if (phaseIndex === 1) {
      context.fillStyle = "rgba(26,62,51,.17)";
      for (let leaf = 0; leaf < 34; leaf += 1) {
        const x = leaf % 2 ? 35 + leaf * 7 : width - 42 - leaf * 6;
        const y = leaf * 37 % height;
        context.beginPath();
        context.ellipse(x, y, 30 + leaf % 4 * 5, 11 + leaf % 3 * 3, leaf % 2 ? 0.45 : -0.48, 0, Math.PI * 2);
        context.fill();
      }
      context.strokeStyle = "rgba(255,226,147,.27)";
      context.lineWidth = 11;
      context.beginPath();
      context.moveTo(-28, 456);
      context.bezierCurveTo(138, 366, 336, 174, 550, 66);
      context.stroke();
    } else {
      context.fillStyle = "rgba(250,248,225,.4)";
      for (let row = 0; row < 5; row += 1) {
        const y = 32 + row * 104;
        const stripe = context.createLinearGradient(34, y, width - 34, y);
        stripe.addColorStop(0, "rgba(250,248,225,0)");
        stripe.addColorStop(0.15, "rgba(250,248,225,.44)");
        stripe.addColorStop(0.85, "rgba(250,248,225,.44)");
        stripe.addColorStop(1, "rgba(250,248,225,0)");
        context.fillStyle = stripe;
        context.fillRect(34, y, width - 68, 21);
      }
      context.strokeStyle = "rgba(239,113,91,.32)";
      context.lineWidth = 9;
      context.beginPath();
      context.moveTo(25, -10);
      context.bezierCurveTo(18, 150, 40, 352, 27, 522);
      context.stroke();
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1.08);
  texture.anisotropy = 4;
  return texture;
}

function makeRoadTexture(stageIndex = 0, phaseIndex = 0) {
  if (stageIndex === 0) return makeCampusToonRoadTexture(phaseIndex);
  const palettes = [
    [["#586468", "#768388", "#c8d7d5"], ["#52625c", "#748178", "#d1d7a9"], ["#666864", "#85877f", "#eee7cf"]],
    [["#65523f", "#8a7658", "#d4b979"], ["#3f4945", "#68716a", "#b8d4ca"], ["#6a5944", "#947a58", "#e5c48b"]],
    [["#121a31", "#283755", "#4ce1ef"], ["#202842", "#3e4967", "#f1c857"], ["#30203e", "#593560", "#ff78c8"]],
    [["#4c3438", "#704e4e", "#ed9a64"], ["#27243d", "#4e3e61", "#fb639c"], ["#253748", "#42596b", "#78c7d9"]],
    [["#685641", "#8a7557", "#e2bf7c"], ["#485443", "#6c765e", "#b8ca83"], ["#55544e", "#77746a", "#e0bf83"]],
    [["#273541", "#415362", "#89c4d4"], ["#41474c", "#62686a", "#e1b35e"], ["#4a5355", "#707878", "#d8bd82"]],
    [["#34445f", "#536784", "#f2c45f"], ["#4b4b5c", "#6d6875", "#e6a6cf"], ["#655345", "#8a725a", "#f0cd88"]]
  ];
  const [base, mid, highlight] = palettes[stageIndex]?.[phaseIndex] || palettes[0][0];
  const texture = canvasTexture(512, 512, (context, width, height) => {
    const ground = context.createLinearGradient(0, 0, width, 0);
    ground.addColorStop(0, base);
    ground.addColorStop(0.5, mid);
    ground.addColorStop(1, base);
    context.fillStyle = ground;
    context.fillRect(0, 0, width, height);
    let seed = 971 + stageIndex * 547 + phaseIndex * 911;
    for (let index = 0; index < 5600; index += 1) {
      seed = (seed * 48271) % 2147483647;
      const x = seed % width;
      seed = (seed * 48271) % 2147483647;
      const y = seed % height;
      const light = 118 + seed % 90;
      context.fillStyle = `rgba(${light},${light + 4},${light + 2},${0.035 + seed % 17 / 400})`;
      context.fillRect(x, y, 1 + seed % 3, 1 + seed % 2);
    }
    if (stageIndex === 0) {
      context.fillStyle = "rgba(19,31,34,.1)";
      for (let y = 0; y < height; y += 76) context.fillRect(0, y, width, 1.5);
      context.fillStyle = "rgba(238,243,235,.12)";
      for (let index = 0; index < 72; index += 1) {
        const radius = 0.8 + index % 4 * 0.55;
        context.beginPath();
        context.arc((index * 83) % width, (index * 131) % height, radius, 0, Math.PI * 2);
        context.fill();
      }
      const wet = context.createLinearGradient(170, 0, 350, 0);
      wet.addColorStop(0, "rgba(255,255,255,0)");
      wet.addColorStop(0.5, "rgba(193,231,224,.18)");
      wet.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = wet;
      context.fillRect(0, 0, width, height);
      const shadowTexture = makeCampusShadowTexture();
      const shadows = shadowTexture.image;
      context.globalAlpha = 0.82;
      context.drawImage(shadows, 0, 0, width, height);
      shadowTexture.dispose();
      context.globalAlpha = 1;
      const sunLane = context.createLinearGradient(0, 0, width, height);
      sunLane.addColorStop(0, "rgba(255,255,255,.14)");
      sunLane.addColorStop(0.46, "rgba(255,255,255,.035)");
      sunLane.addColorStop(1, "rgba(255,239,192,.12)");
      context.fillStyle = sunLane;
      context.fillRect(0, 0, width, height);
    } else if (stageIndex === 1) {
      for (let y = 0; y < height; y += 28) {
        context.fillStyle = y % 56 ? "rgba(255,255,255,.08)" : "rgba(22,31,29,.18)";
        context.fillRect(0, y, width, 2);
        for (let x = (y / 28 % 2) * 76; x < width; x += 152) {
          context.fillStyle = "rgba(24,34,31,.14)";
          context.fillRect(x, y, 2, 28);
        }
      }
    } else if (stageIndex === 2) {
      context.shadowBlur = 14;
      [112, 256, 400].forEach((x, index) => {
        context.strokeStyle = index === 1 ? "rgba(255,102,209,.52)" : "rgba(72,231,247,.48)";
        context.shadowColor = context.strokeStyle;
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x + (index - 1) * 18, height);
        context.stroke();
      });
      context.shadowBlur = 0;
      for (let y = 0; y < height; y += 64) {
        context.fillStyle = "rgba(94,208,232,.14)";
        context.fillRect(0, y, width, 2);
      }
    } else if (stageIndex === 3) {
      for (let row = 0; row < 11; row += 1) {
        for (let column = -1; column < 8; column += 1) {
          const x = column * 72 + (row % 2) * 36;
          const y = row * 50;
          context.strokeStyle = "rgba(246,196,152,.14)";
          context.lineWidth = 2;
          context.beginPath();
          context.ellipse(x, y, 38, 25, 0, 0, Math.PI * 2);
          context.stroke();
        }
      }
    } else if (stageIndex === 4) {
      for (let index = 0; index < 18; index += 1) {
        const x = (index * 97) % width;
        const y = (index * 157) % height;
        context.fillStyle = index % 2 ? "rgba(218,194,146,.1)" : "rgba(26,42,34,.16)";
        context.beginPath();
        context.roundRect(x - 44, y - 18, 88 + index % 3 * 16, 36 + index % 4 * 8, 12);
        context.fill();
      }
    } else if (stageIndex === 5) {
      for (let y = 0; y < height; y += 58) {
        context.strokeStyle = "rgba(172,203,214,.22)";
        context.lineWidth = 3;
        context.strokeRect(4, y + 3, width - 8, 52);
        for (let x = 22; x < width; x += 52) {
          context.fillStyle = "rgba(210,228,232,.34)";
          context.beginPath();
          context.arc(x, y + 12, 2.2, 0, Math.PI * 2);
          context.fill();
        }
      }
    } else {
      for (let y = 0; y < height; y += 74) {
        context.fillStyle = "rgba(226,232,239,.13)";
        context.fillRect(0, y, width, 3);
      }
      [86, 426].forEach((x) => {
        context.fillStyle = "rgba(239,190,94,.42)";
        context.fillRect(x, 0, 7, height);
      });
    }
    paintRoutePhaseTexture(context, width, height, stageIndex, phaseIndex, highlight);
    const centerSheen = context.createLinearGradient(0, 0, width, 0);
    centerSheen.addColorStop(0, "rgba(0,0,0,.16)");
    centerSheen.addColorStop(0.5, `${highlight}24`);
    centerSheen.addColorStop(1, "rgba(0,0,0,.16)");
    context.fillStyle = centerSheen;
    context.fillRect(0, 0, width, height);
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.08, 1.18);
  return texture;
}

function makePlatformTexture() {
  const texture = canvasTexture(256, 256, (context, width, height) => {
    const base = context.createLinearGradient(0, 0, width, 0);
    base.addColorStop(0, "#222a2d");
    base.addColorStop(0.5, "#465154");
    base.addColorStop(1, "#1f272a");
    context.fillStyle = base;
    context.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 32) {
      context.fillStyle = y % 64 ? "rgba(255,255,255,.055)" : "rgba(0,0,0,.14)";
      context.fillRect(0, y, width, 2);
    }
    const safety = context.createLinearGradient(0, 0, width, 0);
    safety.addColorStop(0, "#b99430");
    safety.addColorStop(0.5, "#f8db68");
    safety.addColorStop(1, "#ad8627");
    context.fillStyle = safety;
    context.fillRect(0, 17, width, 12);
    for (let x = 0; x < width; x += 18) {
      context.fillStyle = "rgba(45,43,30,.42)";
      context.beginPath();
      context.arc(x + 8, 23, 2.2, 0, Math.PI * 2);
      context.fill();
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);
  return texture;
}

function makeGraffitiTexture(accent, seed = 0) {
  const color = new THREE.Color(accent);
  return canvasTexture(512, 256, (context, width, height) => {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#13191d");
    gradient.addColorStop(1, "#252b30");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.globalAlpha = 0.84;
    context.lineCap = "round";
    for (let line = 0; line < 11; line += 1) {
      const hueShift = (line * 37 + seed * 19) % 90;
      context.strokeStyle = line % 3 === 0
        ? `rgb(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)})`
        : `hsl(${175 + hueShift},72%,${50 + line % 4 * 6}%)`;
      context.lineWidth = 7 + line % 4 * 3;
      context.beginPath();
      const y = 42 + (line * 31) % 172;
      context.moveTo(-20, y);
      context.bezierCurveTo(90 + line * 7, y - 48, 270 - line * 4, y + 58, 540, y - 10);
      context.stroke();
    }
    context.globalAlpha = 1;
    context.fillStyle = "rgba(248,246,235,.9)";
    context.font = "900 74px system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(seed % 2 ? "NIGHT RUN" : "CITY FLOW", width / 2, height / 2);
    context.strokeStyle = "rgba(255,255,255,.28)";
    context.lineWidth = 3;
    context.strokeRect(12, 12, width - 24, height - 24);
  });
}

function makeTrainWindowTexture(accent, variant = 0) {
  const color = new THREE.Color(accent);
  return canvasTexture(512, 256, (context, width, height) => {
    context.fillStyle = variant % 2 ? "#e6e8e5" : "#d8dedc";
    context.fillRect(0, 0, width, height);
    context.fillStyle = `rgb(${Math.round(color.r * 190)},${Math.round(color.g * 190)},${Math.round(color.b * 190)})`;
    context.fillRect(0, height * 0.66, width, height * 0.17);
    for (let index = 0; index < 5; index += 1) {
      const x = 18 + index * 100;
      const windowGradient = context.createLinearGradient(x, 28, x + 78, 142);
      windowGradient.addColorStop(0, "#81b2c2");
      windowGradient.addColorStop(0.4, "#1c3543");
      windowGradient.addColorStop(1, "#07131b");
      context.fillStyle = windowGradient;
      context.fillRect(x, 30, 72, 105);
      context.fillStyle = "rgba(255,255,255,.18)";
      context.fillRect(x + 7, 36, 4, 86);
    }
    context.fillStyle = "#333a3d";
    context.fillRect(0, height - 28, width, 28);
  });
}

function makeParticleTexture() {
  return canvasTexture(64, 64, (context, width, height) => {
    const gradient = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.25, "rgba(255,248,220,.9)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  });
}

function getCampusLightMoteTexture() {
  if (campusLightMoteTexture) return campusLightMoteTexture;
  campusLightMoteTexture = canvasTexture(128, 128, (context, width, height) => {
    context.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;
    const halo = context.createRadialGradient(cx, cy, 0, cx, cy, width * 0.48);
    halo.addColorStop(0, "rgba(255,255,247,1)");
    halo.addColorStop(0.08, "rgba(255,243,188,.98)");
    halo.addColorStop(0.25, "rgba(255,210,105,.52)");
    halo.addColorStop(0.62, "rgba(255,190,72,.13)");
    halo.addColorStop(1, "rgba(255,190,72,0)");
    context.fillStyle = halo;
    context.fillRect(0, 0, width, height);
    context.save();
    context.translate(cx, cy);
    context.globalCompositeOperation = "screen";
    const ray = context.createLinearGradient(-width * 0.34, 0, width * 0.34, 0);
    ray.addColorStop(0, "rgba(255,255,255,0)");
    ray.addColorStop(0.5, "rgba(255,250,220,.72)");
    ray.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = ray;
    context.fillRect(-width * 0.34, -1, width * 0.68, 2);
    context.rotate(Math.PI / 2);
    context.globalAlpha = 0.52;
    context.fillRect(-width * 0.24, -1, width * 0.48, 2);
    context.restore();
  });
  campusLightMoteTexture.minFilter = THREE.LinearMipmapLinearFilter;
  campusLightMoteTexture.magFilter = THREE.LinearFilter;
  SHARED_TEXTURES.add(campusLightMoteTexture);
  return campusLightMoteTexture;
}

function getCampusObstacleLeafTexture() {
  if (campusObstacleLeafTexture) return campusObstacleLeafTexture;
  campusObstacleLeafTexture = canvasTexture(96, 128, (context, width, height) => {
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(width / 2, height / 2);
    context.rotate(-0.16);
    context.shadowColor = "rgba(14,38,22,.42)";
    context.shadowBlur = 7;
    const leafGradient = context.createLinearGradient(-24, -46, 28, 48);
    leafGradient.addColorStop(0, "#d8ed9f");
    leafGradient.addColorStop(0.34, "#77a95c");
    leafGradient.addColorStop(0.72, "#3f7650");
    leafGradient.addColorStop(1, "#244f3f");
    context.fillStyle = leafGradient;
    context.beginPath();
    context.moveTo(0, -52);
    context.bezierCurveTo(35, -32, 36, 20, 0, 52);
    context.bezierCurveTo(-36, 20, -35, -32, 0, -52);
    context.closePath();
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = "rgba(232,246,185,.68)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, -43);
    context.quadraticCurveTo(-2, 4, 0, 53);
    context.stroke();
    context.strokeStyle = "rgba(218,239,167,.34)";
    context.lineWidth = 1;
    for (let y = -30; y <= 30; y += 15) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(19, y - 12);
      context.moveTo(0, y + 4);
      context.lineTo(-19, y - 8);
      context.stroke();
    }
    context.restore();
  });
  campusObstacleLeafTexture.minFilter = THREE.LinearMipmapLinearFilter;
  campusObstacleLeafTexture.magFilter = THREE.LinearFilter;
  SHARED_TEXTURES.add(campusObstacleLeafTexture);
  return campusObstacleLeafTexture;
}

function getCampusMistTexture() {
  if (campusMistTexture) return campusMistTexture;
  campusMistTexture = canvasTexture(192, 96, (context, width, height) => {
    context.clearRect(0, 0, width, height);
    const haze = context.createRadialGradient(width / 2, height / 2, 2, width / 2, height / 2, width * 0.48);
    haze.addColorStop(0, "rgba(225,250,244,.72)");
    haze.addColorStop(0.3, "rgba(189,235,226,.34)");
    haze.addColorStop(0.74, "rgba(156,216,210,.09)");
    haze.addColorStop(1, "rgba(150,210,205,0)");
    context.fillStyle = haze;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = "screen";
    context.strokeStyle = "rgba(255,255,255,.42)";
    context.lineWidth = 1.5;
    for (let index = 0; index < 5; index += 1) {
      context.beginPath();
      context.moveTo(16, 34 + index * 7);
      context.bezierCurveTo(54, 18 + index * 5, 124, 67 - index * 4, 178, 29 + index * 8);
      context.stroke();
    }
  });
  campusMistTexture.minFilter = THREE.LinearMipmapLinearFilter;
  campusMistTexture.magFilter = THREE.LinearFilter;
  SHARED_TEXTURES.add(campusMistTexture);
  return campusMistTexture;
}

function getCampusCanopyArtTexture() {
  if (campusCanopyArtTexture) return campusCanopyArtTexture;
  campusCanopyArtTexture = new THREE.TextureLoader().load("assets/runner-scenes/props/camphor-bough.png");
  campusCanopyArtTexture.colorSpace = THREE.SRGBColorSpace;
  campusCanopyArtTexture.minFilter = THREE.LinearMipmapLinearFilter;
  campusCanopyArtTexture.magFilter = THREE.LinearFilter;
  campusCanopyArtTexture.anisotropy = 8;
  SHARED_TEXTURES.add(campusCanopyArtTexture);
  return campusCanopyArtTexture;
}

function makeWorldParticleTexture(kind, accent) {
  return canvasTexture(48, 48, (context, width, height) => {
    context.clearRect(0, 0, width, height);
    context.translate(width / 2, height / 2);
    context.fillStyle = `#${new THREE.Color(accent).getHexString()}`;
    context.strokeStyle = context.fillStyle;
    context.lineWidth = 3;
    if (kind === "leaf-drips") {
      context.rotate(-0.55);
      context.beginPath();
      context.moveTo(0, -17);
      context.quadraticCurveTo(15, -4, 0, 17);
      context.quadraticCurveTo(-15, -4, 0, -17);
      context.fill();
    } else if (kind === "paper-pages") {
      context.rotate(0.18);
      context.fillRect(-14, -10, 28, 20);
      context.clearRect(5, -10, 9, 7);
    } else if (kind === "neon-dust") {
      context.fillRect(-3, -18, 6, 36);
      context.fillRect(-18, -3, 36, 6);
    } else if (kind === "lantern-embers") {
      context.beginPath();
      context.ellipse(0, 0, 10, 16, 0, 0, Math.PI * 2);
      context.fill();
    } else if (kind === "kitchen-steam") {
      context.globalAlpha = 0.72;
      context.beginPath();
      context.arc(-7, 5, 9, 0, Math.PI * 2);
      context.arc(5, 0, 12, 0, Math.PI * 2);
      context.arc(0, -10, 9, 0, Math.PI * 2);
      context.fill();
    } else if (kind === "storm-spray") {
      context.rotate(-0.72);
      context.fillRect(-2, -20, 4, 40);
    } else {
      context.beginPath();
      for (let point = 0; point < 10; point += 1) {
        const radius = point % 2 ? 6 : 18;
        const angle = point / 10 * Math.PI * 2 - Math.PI / 2;
        context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      context.closePath();
      context.fill();
    }
  });
}

function makeRunnerEnvironmentTexture() {
  const texture = canvasTexture(512, 256, (context, width, height) => {
    const sky = context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#bfe9f5");
    sky.addColorStop(0.42, "#789aaa");
    sky.addColorStop(0.58, "#34434b");
    sky.addColorStop(1, "#111719");
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);
    [[0.18, "rgba(255,219,151,.92)"], [0.5, "rgba(188,234,255,.7)"], [0.82, "rgba(255,162,126,.72)"]].forEach(([position, color]) => {
      const glow = context.createRadialGradient(width * position, height * 0.34, 0, width * position, height * 0.34, width * 0.19);
      glow.addColorStop(0, color);
      glow.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
    });
  });
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

function makeFacadeTexture(accent, seed) {
  const color = new THREE.Color(accent);
  return canvasTexture(192, 256, (context, width, height) => {
    context.fillStyle = "#1c2227";
    context.fillRect(0, 0, width, height);
    for (let row = 0; row < 7; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        const lit = ((row * 11 + column * 7 + seed) % 5) < 2;
        context.fillStyle = lit
          ? `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},.82)`
          : "rgba(89,112,126,.2)";
        context.fillRect(17 + column * 43, 18 + row * 33, 22, 17);
        context.fillStyle = "rgba(255,255,255,.08)";
        context.fillRect(17 + column * 43, 18 + row * 33, 22, 2);
      }
    }
  });
}

function makeCampusFacadeTexture(seed = 0) {
  const texture = canvasTexture(768, 768, (context, width, height) => {
    const skyReflection = context.createLinearGradient(0, 0, width, height);
    skyReflection.addColorStop(0, "#eefaff");
    skyReflection.addColorStop(0.22, "#bce8f7");
    skyReflection.addColorStop(0.58, "#6eafc8");
    skyReflection.addColorStop(1, "#345f75");
    context.fillStyle = skyReflection;
    context.fillRect(0, 0, width, height);

    const columns = 7;
    const rows = 9;
    const frame = 10;
    const margin = 18;
    const cellWidth = (width - margin * 2 - frame * (columns - 1)) / columns;
    const cellHeight = (height - margin * 2 - frame * (rows - 1)) / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = margin + column * (cellWidth + frame);
        const y = margin + row * (cellHeight + frame);
        const interior = context.createLinearGradient(x, y, x, y + cellHeight);
        interior.addColorStop(0, row % 2 ? "rgba(207,239,248,.88)" : "rgba(226,248,253,.92)");
        interior.addColorStop(0.3, "rgba(116,176,198,.9)");
        interior.addColorStop(1, "rgba(42,82,102,.96)");
        context.fillStyle = interior;
        context.fillRect(x, y, cellWidth, cellHeight);
        context.fillStyle = "rgba(255,255,255,.44)";
        context.fillRect(x + 3, y + 3, Math.max(3, cellWidth * 0.075), cellHeight - 6);
        context.fillStyle = "rgba(17,50,66,.2)";
        context.fillRect(x, y + cellHeight * 0.72, cellWidth, cellHeight * 0.28);
        if ((row * 11 + column * 5 + seed) % 9 === 0) {
          context.fillStyle = "rgba(255,232,170,.32)";
          context.fillRect(x + 6, y + cellHeight * 0.56, cellWidth - 12, cellHeight * 0.22);
        }
      }
    }
    context.strokeStyle = "rgba(236,248,248,.58)";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(width * 0.05, height * 0.34);
    context.bezierCurveTo(width * 0.32, height * 0.12, width * 0.55, height * 0.42, width * 0.94, height * 0.11);
    context.stroke();
    const sunWash = context.createRadialGradient(width * 0.16, height * 0.08, 0, width * 0.16, height * 0.08, width * 0.72);
    sunWash.addColorStop(0, "rgba(255,255,238,.62)");
    sunWash.addColorStop(0.42, "rgba(255,255,255,.12)");
    sunWash.addColorStop(1, "rgba(46,101,126,0)");
    context.fillStyle = sunWash;
    context.fillRect(0, 0, width, height);
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function makeCampusLeafTexture() {
  if (campusLeafTexture) return campusLeafTexture;
  campusLeafTexture = canvasTexture(768, 576, (context, width, height) => {
    context.clearRect(0, 0, width, height);
    context.lineCap = "round";
    context.strokeStyle = "rgba(45,67,38,.72)";
    context.lineWidth = 7;
    [[384,540,164,248], [384,540,316,174], [384,540,474,194], [384,540,650,292], [384,540,98,366], [384,540,548,370]].forEach(([x1,y1,x2,y2]) => {
      context.beginPath();
      context.moveTo(x1,y1);
      context.quadraticCurveTo((x1+x2)/2, (y1+y2)/2+28, x2,y2);
      context.stroke();
    });
    let seed = 173;
    for (let index = 0; index < 620; index += 1) {
      seed = seed * 16807 % 2147483647;
      const angle = seed % 628 / 100;
      seed = seed * 16807 % 2147483647;
      const radial = 72 + seed % 285;
      const x = width / 2 + Math.cos(angle) * radial * (0.9 + index % 7 * 0.018);
      const y = height * 0.56 + Math.sin(angle) * radial * 0.58 - (seed % 76);
      const leafWidth = 5 + seed % 9;
      const leafHeight = 12 + seed % 17;
      const palette = ["#174b31", "#24653a", "#337b43", "#4b9550", "#68ac58", "#8fc45f", "#bedb76"];
      context.fillStyle = palette[(index + Math.floor(x / 86) + Math.floor(y / 64)) % palette.length];
      context.beginPath();
      context.ellipse(x, y, leafWidth, leafHeight, angle + index % 4 * 0.3, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "rgba(249,255,194,.22)";
      context.beginPath();
      context.ellipse(x - leafWidth * 0.22, y - leafHeight * 0.24, leafWidth * 0.28, leafHeight * 0.38, angle, 0, Math.PI * 2);
      context.fill();
    }
    const glow = context.createRadialGradient(236, 124, 0, 236, 124, 330);
    glow.addColorStop(0, "rgba(244,255,174,.25)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
  });
  SHARED_TEXTURES.add(campusLeafTexture);
  return campusLeafTexture;
}

function makeCampusCloudTexture() {
  if (campusCloudTexture) return campusCloudTexture;
  campusCloudTexture = canvasTexture(768, 384, (context, width, height) => {
    context.clearRect(0, 0, width, height);
    context.save();
    context.filter = "blur(3px)";
    const puffs = [
      [94,242,102,46], [168,190,126,72], [268,218,152,76], [376,168,142,82],
      [492,194,154,76], [612,232,112,52], [348,252,246,54], [238,274,188,42]
    ];
    puffs.forEach(([x, y, rx, ry], index) => {
      const cloud = context.createRadialGradient(x - rx * 0.18, y - ry * 0.34, 2, x, y, rx);
      cloud.addColorStop(0, "rgba(255,255,255,.98)");
      cloud.addColorStop(0.48, index % 2 ? "rgba(249,253,255,.9)" : "rgba(255,255,255,.93)");
      cloud.addColorStop(0.78, "rgba(202,229,241,.5)");
      cloud.addColorStop(1, "rgba(179,216,235,0)");
      context.fillStyle = cloud;
      context.beginPath();
      context.ellipse(x, y, rx, ry, -0.04 + index * 0.01, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
    const sunEdge = context.createLinearGradient(0, 80, width, 280);
    sunEdge.addColorStop(0, "rgba(255,250,220,.34)");
    sunEdge.addColorStop(0.4, "rgba(255,255,255,.08)");
    sunEdge.addColorStop(1, "rgba(188,221,238,0)");
    context.fillStyle = sunEdge;
    context.fillRect(0, 0, width, height);
  });
  SHARED_TEXTURES.add(campusCloudTexture);
  return campusCloudTexture;
}

function makeCampusShadowTexture() {
  return canvasTexture(512, 512, (context, width, height) => {
    context.clearRect(0, 0, width, height);
    let seed = 92821;
    for (let side = 0; side < 2; side += 1) {
      const direction = side ? -1 : 1;
      const originX = side ? width * 0.95 : width * 0.05;
      context.strokeStyle = "rgba(22,38,34,.13)";
      context.lineWidth = 6;
      for (let branch = 0; branch < 5; branch += 1) {
        context.beginPath();
        context.moveTo(originX, branch * 116 - 24);
        context.bezierCurveTo(originX + direction * 62, branch * 116 + 12, originX + direction * 128, branch * 116 + 32, originX + direction * (176 + branch * 8), branch * 116 + 88);
        context.stroke();
      }
      for (let index = 0; index < 96; index += 1) {
        seed = seed * 16807 % 2147483647;
        const reach = 24 + seed % 218;
        seed = seed * 16807 % 2147483647;
        const y = seed % height;
        seed = seed * 16807 % 2147483647;
        const x = originX + direction * reach + (seed % 29 - 14);
        const leafWidth = 7 + seed % 18;
        const leafHeight = 3 + seed % 9;
        context.fillStyle = `rgba(20,34,30,${0.15 + seed % 11 / 100})`;
        context.beginPath();
        context.ellipse(x, y, leafWidth, leafHeight, direction * -0.46 + index % 5 * 0.12, 0, Math.PI * 2);
        context.fill();
      }
    }
  });
}

function makeCampusAuthoredShadowTexture(canopyImage) {
  const texture = canvasTexture(1024, 1024, (context, width, height) => {
    context.clearRect(0, 0, width, height);
    context.filter = "brightness(0) blur(3px)";
    context.globalAlpha = 0.3;
    const paintCanopy = (x, y, drawWidth, drawHeight, rotation, flip = 1) => {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.scale(flip, 1);
      context.drawImage(canopyImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      context.restore();
    };
    paintCanopy(-32, 150, 700, 610, 0.28);
    paintCanopy(width + 28, 438, 760, 650, -0.31, -1);
    paintCanopy(-72, 790, 690, 590, 0.2);
    paintCanopy(width + 82, 1000, 720, 620, -0.24, -1);
    context.filter = "none";
    context.globalAlpha = 1;
  });
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1.45);
  texture.anisotropy = 4;
  return texture;
}

function createCampusRoadShadowLayer() {
  const shadowTexture = makeCampusShadowTexture();
  shadowTexture.wrapS = THREE.ClampToEdgeWrapping;
  shadowTexture.wrapT = THREE.RepeatWrapping;
  shadowTexture.repeat.set(1, 1.7);
  const shadow = mesh(new THREE.PlaneGeometry(8.35, 180), new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    toneMapped: false
  }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.072, -73);
  shadow.renderOrder = 2;
  shadow.userData.shadowTexture = shadowTexture;
  return shadow;
}

function createSoftGroundShadow(width, depth, opacity = 0.18) {
  const texture = canvasTexture(256, 128, (context, canvasWidth, canvasHeight) => {
    const shadow = context.createRadialGradient(canvasWidth / 2, canvasHeight / 2, 4, canvasWidth / 2, canvasHeight / 2, canvasWidth / 2);
    shadow.addColorStop(0, `rgba(28,63,53,${opacity})`);
    shadow.addColorStop(0.58, `rgba(28,63,53,${opacity * 0.52})`);
    shadow.addColorStop(1, "rgba(28,63,53,0)");
    context.fillStyle = shadow;
    context.fillRect(0, 0, canvasWidth, canvasHeight);
  });
  const shadow = mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    color: 0xffffff,
    toneMapped: false
  }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  shadow.renderOrder = -1;
  return shadow;
}

function makeSignTexture(label, accent) {
  const color = new THREE.Color(accent);
  return canvasTexture(256, 96, (context, width, height) => {
    context.fillStyle = "rgba(9,14,18,.94)";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = `rgb(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)})`;
    context.lineWidth = 3;
    context.strokeRect(5, 5, width - 10, height - 10);
    context.fillStyle = "#f8f1df";
    context.font = "600 38px system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, width / 2, height / 2 + 2);
  });
}

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.7,
    metalness: options.metalness ?? 0.02,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide,
    depthWrite: options.depthWrite ?? true
  });
}

function mesh(geometry, meshMaterial, castShadow = false, receiveShadow = false) {
  const item = new THREE.Mesh(geometry, meshMaterial);
  item.castShadow = castShadow;
  item.receiveShadow = receiveShadow;
  return item;
}

const powerupGeometryCache = new Map();

function powerupGeometry(key, factory) {
  if (powerupGeometryCache.has(key)) return powerupGeometryCache.get(key);
  const geometry = factory();
  SHARED_GEOMETRIES.add(geometry);
  powerupGeometryCache.set(key, geometry);
  return geometry;
}

function powerupMaterial(color, opacity = 0) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false
  });
}

function createPowerupVisualRig(particleTexture, accent) {
  const root = new THREE.Group();
  root.name = "powerupVisualRig";
  root.userData.sharedTexture = particleTexture;

  const arcGeometry = powerupGeometry("magnet-arc", () => new THREE.TorusGeometry(1, 0.026, 6, 44, Math.PI * 1.48));
  const magnetMaterial = powerupMaterial(POWERUP_COLORS.magnet);
  const magnet = new THREE.Group();
  const magnetArcs = [];
  for (let index = 0; index < 3; index += 1) {
    const arc = mesh(arcGeometry, magnetMaterial);
    arc.scale.set(0.72 + index * 0.25, 1.04 + index * 0.31, 1);
    arc.rotation.z = -Math.PI * 0.74 + index * 0.08;
    arc.renderOrder = 4;
    magnet.add(arc);
    magnetArcs.push(arc);
  }
  magnet.visible = false;
  root.add(magnet);

  const shield = new THREE.Group();
  const shieldMaterial = powerupMaterial(POWERUP_COLORS.shield);
  shieldMaterial.side = THREE.BackSide;
  const shieldShell = mesh(
    powerupGeometry("shield-shell", () => new THREE.SphereGeometry(1, 20, 14)),
    shieldMaterial
  );
  shieldShell.position.y = 1.35;
  shieldShell.scale.set(0.84, 1.42, 0.68);
  shieldShell.renderOrder = 3;
  const shieldRingMaterial = powerupMaterial(0xd9f7ff);
  const shieldRingGeometry = powerupGeometry("shield-ring", () => new THREE.TorusGeometry(0.82, 0.022, 6, 36));
  const shieldRings = [0.52, 1.44].map((height, index) => {
    const ring = mesh(shieldRingGeometry, shieldRingMaterial);
    ring.position.y = height;
    ring.rotation.x = Math.PI / 2 + (index ? -0.18 : 0.16);
    ring.scale.z = 0.76;
    shield.add(ring);
    return ring;
  });
  shield.add(shieldShell);
  shield.visible = false;
  root.add(shield);

  const afterimageGeometry = powerupGeometry("runner-afterimage", () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
      0, 0.08, 0, 0, 1.78, 0,
      0, 1.78, 0, -0.36, 1.35, 0,
      0, 1.78, 0, 0.36, 1.35, 0,
      0, 1.15, 0, -0.3, 0.2, 0,
      0, 1.15, 0, 0.3, 0.2, 0,
      -0.22, 2.05, 0, 0.22, 2.05, 0,
      -0.22, 2.05, 0, 0, 2.34, 0,
      0.22, 2.05, 0, 0, 2.34, 0
    ]), 3));
    return geometry;
  });
  const multiplier = new THREE.Group();
  const afterimages = [0, 1].map((index) => {
    const lineMaterial = new THREE.LineBasicMaterial({
      color: index ? accent : POWERUP_COLORS.multiplier,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const afterimage = new THREE.LineSegments(afterimageGeometry, lineMaterial);
    afterimage.renderOrder = 2;
    multiplier.add(afterimage);
    return afterimage;
  });
  const scorePulseMaterial = powerupMaterial(POWERUP_COLORS.multiplier);
  const scorePulseGeometry = powerupGeometry("score-pulse", () => new THREE.TorusGeometry(0.62, 0.024, 6, 36));
  const scorePulses = [0, 1].map((index) => {
    const pulse = mesh(scorePulseGeometry, scorePulseMaterial);
    pulse.position.y = 1.24;
    pulse.rotation.x = Math.PI / 2 + index * 0.36;
    multiplier.add(pulse);
    return pulse;
  });
  multiplier.visible = false;
  root.add(multiplier);

  const overdrive = new THREE.Group();
  const speedWaveMaterial = powerupMaterial(POWERUP_COLORS.overdrive);
  const speedWaveGeometry = powerupGeometry("ground-speed-wave", () => new THREE.RingGeometry(0.76, 0.84, 30, 1, 0.18, Math.PI * 1.64));
  const speedWaves = new THREE.InstancedMesh(speedWaveGeometry, speedWaveMaterial, 6);
  speedWaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  speedWaves.frustumCulled = false;
  speedWaves.count = 0;
  overdrive.add(speedWaves);
  const edgeFlowMaterial = powerupMaterial(0xfff0a1);
  const edgeFlowGeometry = powerupGeometry("edge-flow", () => new THREE.BoxGeometry(0.075, 0.018, 1.18));
  const edgeFlow = new THREE.InstancedMesh(edgeFlowGeometry, edgeFlowMaterial, 20);
  edgeFlow.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  edgeFlow.frustumCulled = false;
  edgeFlow.count = 0;
  overdrive.add(edgeFlow);
  overdrive.visible = false;
  root.add(overdrive);

  const storyWorld = new THREE.Group();
  const storyRoadMaterial = powerupMaterial(accent);
  const storyRoadGeometry = powerupGeometry("story-road-patch", () => new THREE.RingGeometry(0.54, 0.63, 28));
  const storyRoadPatches = new THREE.InstancedMesh(storyRoadGeometry, storyRoadMaterial, 5);
  storyRoadPatches.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  storyRoadPatches.frustumCulled = false;
  storyRoadPatches.count = 0;
  storyWorld.add(storyRoadPatches);
  const localWeatherPositions = new Float32Array(36 * 3);
  for (let index = 0; index < 36; index += 1) {
    const angle = index * 2.39996;
    const radius = 0.35 + (index % 9) * 0.16;
    localWeatherPositions[index * 3] = Math.cos(angle) * radius;
    localWeatherPositions[index * 3 + 1] = 0.18 + (index % 12) * 0.19;
    localWeatherPositions[index * 3 + 2] = Math.sin(angle) * radius * 0.72;
  }
  const localWeatherGeometry = new THREE.BufferGeometry();
  localWeatherGeometry.setAttribute("position", new THREE.BufferAttribute(localWeatherPositions, 3));
  const localWeatherMaterial = new THREE.PointsMaterial({
    map: particleTexture,
    color: accent,
    size: 0.13,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  });
  const localWeather = new THREE.Points(localWeatherGeometry, localWeatherMaterial);
  localWeather.frustumCulled = false;
  storyWorld.add(localWeather);
  const storyLight = new THREE.PointLight(accent, 0, 8, 2);
  storyLight.position.y = 1.25;
  storyWorld.add(storyLight);
  storyWorld.visible = false;
  root.add(storyWorld);

  const synergy = new THREE.Group();
  const synergyMaterials = [powerupMaterial(accent), powerupMaterial(0xffffff)];
  const synergyGeometry = powerupGeometry("synergy-wave", () => new THREE.TorusGeometry(0.72, 0.035, 7, 42));
  const synergyWaves = synergyMaterials.map((waveMaterial, index) => {
    const wave = mesh(synergyGeometry, waveMaterial);
    wave.position.y = index ? 1.36 : 0.05;
    wave.rotation.x = Math.PI / 2 + index * 0.42;
    synergy.add(wave);
    return wave;
  });
  const synergyLight = new THREE.PointLight(accent, 0, 12, 2);
  synergyLight.position.y = 1.4;
  synergy.add(synergyLight);
  synergy.visible = false;
  root.add(synergy);

  const impactRippleGeometry = powerupGeometry("shield-impact-ripple", () => new THREE.TorusGeometry(0.46, 0.035, 7, 36));
  const impactShardGeometry = powerupGeometry("shield-impact-shard", () => new THREE.TetrahedronGeometry(0.09, 0));
  const impacts = [];
  for (let slotIndex = 0; slotIndex < POWERUP_IMPACT_POOL_SIZE; slotIndex += 1) {
    const group = new THREE.Group();
    const rippleMaterial = powerupMaterial(POWERUP_COLORS.shield);
    const ripple = mesh(impactRippleGeometry, rippleMaterial);
    ripple.rotation.x = Math.PI / 2;
    group.add(ripple);
    const shardMaterial = powerupMaterial(0xdff9ff);
    const shards = new THREE.InstancedMesh(impactShardGeometry, shardMaterial, 12);
    shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    shards.frustumCulled = false;
    shards.count = 0;
    group.add(shards);
    group.visible = false;
    root.add(group);
    impacts.push({
      group,
      ripple,
      shards,
      life: 0,
      duration: 0.56,
      positions: new Float32Array(12 * 3),
      velocities: new Float32Array(12 * 3)
    });
  }

  return {
    root,
    magnet: { group: magnet, arcs: magnetArcs, material: magnetMaterial },
    shield: { group: shield, shell: shieldShell, shellMaterial: shieldMaterial, rings: shieldRings, ringMaterial: shieldRingMaterial },
    multiplier: { group: multiplier, afterimages, scorePulses, scorePulseMaterial },
    overdrive: { group: overdrive, speedWaves, speedWaveMaterial, edgeFlow, edgeFlowMaterial },
    storyWorld: { group: storyWorld, roadPatches: storyRoadPatches, roadMaterial: storyRoadMaterial, localWeather, localWeatherMaterial, light: storyLight },
    synergy: { group: synergy, waves: synergyWaves, materials: synergyMaterials, light: synergyLight },
    impacts,
    scratch: {
      matrix: new THREE.Matrix4(),
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      scale: new THREE.Vector3(),
      euler: new THREE.Euler(),
      color: new THREE.Color()
    }
  };
}

function createTree(accent) {
  const group = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.13, 0.2, 2.4, 8), material(0x544137, { roughness: 1 }));
  trunk.position.y = 1.2;
  group.add(trunk);
  const leafMaterial = material(new THREE.Color(accent).lerp(new THREE.Color(0x347549), 0.9), { roughness: 0.94 });
  [[0, 2.75, 0, 0.95], [-0.5, 2.45, 0.05, 0.72], [0.48, 2.5, -0.08, 0.78]].forEach(([x, y, z, scale]) => {
    const crown = mesh(new THREE.SphereGeometry(scale, 14, 9), leafMaterial);
    crown.scale.set(1.08, 0.82, 0.94);
    crown.position.set(x, y, z);
    group.add(crown);
  });
  const leafTexture = makeCampusLeafTexture();
  const leafCardMaterial = new THREE.MeshBasicMaterial({
    map: leafTexture,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: false,
    side: THREE.DoubleSide,
    color: 0xe9ffd6,
    toneMapped: true
  });
  [[0, 2.72, 0.34, 2.55, 2.25, 0], [0, 2.72, -0.34, 2.55, 2.25, Math.PI / 2]].forEach(([x, y, z, width, height, rotationY]) => {
    const card = mesh(new THREE.PlaneGeometry(width, height), leafCardMaterial);
    card.position.set(x, y, z);
    card.rotation.y = rotationY;
    group.add(card);
  });
  group.userData.leafTexture = leafTexture;
  return group;
}

function createLamp(accent) {
  const group = new THREE.Group();
  const dark = material(0x202629, { roughness: 0.42, metalness: 0.62 });
  const pole = mesh(new THREE.CylinderGeometry(0.055, 0.075, 4.2, 10), dark);
  pole.position.y = 2.1;
  const arm = mesh(new THREE.BoxGeometry(0.72, 0.07, 0.07), dark);
  arm.position.set(0.3, 4.1, 0);
  const glow = material(accent, { emissive: accent, emissiveIntensity: 4.5, roughness: 0.2 });
  const bulb = mesh(new THREE.SphereGeometry(0.14, 12, 8), glow);
  bulb.position.set(0.64, 3.98, 0);
  group.add(pole, arm, bulb);
  return group;
}

function createBench() {
  const group = new THREE.Group();
  const wood = material(0x7a5136, { roughness: 0.84 });
  const iron = material(0x252a2c, { roughness: 0.45, metalness: 0.55 });
  const seat = mesh(new THREE.BoxGeometry(1.8, 0.12, 0.48), wood);
  seat.position.y = 0.58;
  const back = mesh(new THREE.BoxGeometry(1.8, 0.68, 0.1), wood);
  back.position.set(0, 0.94, 0.2);
  [-0.68, 0.68].forEach((x) => {
    const leg = mesh(new THREE.BoxGeometry(0.08, 0.62, 0.38), iron);
    leg.position.set(x, 0.3, 0);
    group.add(leg);
  });
  group.add(seat, back);
  return group;
}

function createRailing() {
  const group = new THREE.Group();
  const railMaterial = material(0x737f84, { roughness: 0.34, metalness: 0.72 });
  [0.72, 1.22].forEach((y) => {
    const rail = mesh(new THREE.BoxGeometry(5.2, 0.06, 0.06), railMaterial);
    rail.position.y = y;
    group.add(rail);
  });
  for (let index = -2; index <= 2; index += 1) {
    const post = mesh(new THREE.BoxGeometry(0.06, 1.35, 0.06), railMaterial);
    post.position.set(index * 1.22, 0.68, 0);
    group.add(post);
  }
  return group;
}

function createBuilding(accent, seed = 0, home = false) {
  const group = new THREE.Group();
  const height = 5.8 + (seed % 4) * 1.15;
  const width = 3.6 + (seed % 3) * 0.7;
  const body = mesh(new THREE.BoxGeometry(width, height, 3.1), material(home ? 0x6c5c4c : 0x343d44, { roughness: 0.86 }));
  body.position.y = height / 2;
  group.add(body);
  const facadeTexture = makeFacadeTexture(accent, seed);
  facadeTexture.colorSpace = THREE.SRGBColorSpace;
  const facadeMaterial = new THREE.MeshBasicMaterial({ map: facadeTexture, transparent: true, opacity: home ? 0.96 : 0.78 });
  const facade = mesh(new THREE.PlaneGeometry(width * 0.82, height * 0.85), facadeMaterial);
  facade.position.set(0, height * 0.52, 1.56);
  facade.userData.disposeMaterial = true;
  group.add(facade);
  return group;
}

function createCafe(accent) {
  const group = createBuilding(accent, 2);
  group.scale.set(0.72, 0.72, 0.72);
  const awning = mesh(new THREE.BoxGeometry(3.15, 0.18, 1.05), material(accent, { roughness: 0.58 }));
  awning.position.set(0, 2.25, 1.9);
  awning.rotation.x = -0.16;
  group.add(awning);
  const signTexture = makeSignTexture("CAFE", accent);
  const sign = mesh(new THREE.PlaneGeometry(1.9, 0.72), new THREE.MeshBasicMaterial({ map: signTexture, transparent: true }));
  sign.position.set(0, 3.35, 1.58);
  sign.userData.disposeMaterial = true;
  group.add(sign);
  return group;
}

function createBookstoreFront(accent) {
  const group = createBuilding(accent, 1, true);
  group.scale.set(0.76, 0.76, 0.76);
  const timber = material(0x543b2f, { roughness: 0.82, metalness: 0.02 });
  const window = mesh(roundedPanelGeometry(2.72, 1.72, 0.08, 0.08), material(0x294e56, {
    emissive: accent,
    emissiveIntensity: 0.18,
    roughness: 0.12,
    metalness: 0.2
  }), true);
  window.position.set(0, 1.54, 1.63);
  const shelves = createInstancedObstacleParts(new THREE.BoxGeometry(2.28, 0.07, 0.12), timber, [
    { y: 1.06, z: 1.71 }, { y: 1.52, z: 1.71 }, { y: 1.98, z: 1.71 }
  ]);
  const spines = createInstancedObstacleParts(
    roundedPanelGeometry(0.12, 0.32, 0.07, 0.018),
    material(0xd6b77f, { roughness: 0.86 }),
    Array.from({ length: 12 }, (_, index) => ({
      x: -1.02 + index % 6 * 0.41,
      y: index < 6 ? 1.28 : 1.74,
      z: 1.78,
      sy: 0.78 + index % 3 * 0.11,
      rz: (index % 3 - 1) * 0.04
    }))
  );
  const awning = mesh(roundedPanelGeometry(3.18, 0.18, 0.94, 0.07), material(0x745b43, { roughness: 0.72 }), true);
  awning.position.set(0, 2.62, 1.92);
  awning.rotation.x = -0.14;
  const signTexture = makeSignTexture("BOOKS", accent);
  const sign = mesh(new THREE.PlaneGeometry(1.84, 0.54), new THREE.MeshBasicMaterial({ map: signTexture, transparent: true }));
  sign.position.set(0, 3.25, 1.61);
  sign.userData.disposeMaterial = true;
  group.add(window, shelves, spines, awning, sign);
  return group;
}

function createShelter(accent) {
  const group = new THREE.Group();
  const frame = material(0x3c474d, { roughness: 0.36, metalness: 0.62 });
  const glass = material(0x8fb8c4, { transparent: true, opacity: 0.24, roughness: 0.12, metalness: 0.08, depthWrite: false, side: THREE.DoubleSide });
  const roof = mesh(new THREE.BoxGeometry(3.4, 0.12, 1.35), frame);
  roof.position.y = 2.35;
  const pane = mesh(new THREE.PlaneGeometry(3.2, 2.1), glass);
  pane.position.set(0, 1.18, 0.58);
  [-1.55, 1.55].forEach((x) => {
    const post = mesh(new THREE.BoxGeometry(0.08, 2.35, 0.08), frame);
    post.position.set(x, 1.18, 0.6);
    group.add(post);
  });
  const sign = mesh(new THREE.BoxGeometry(0.85, 0.45, 0.06), material(accent, { emissive: accent, emissiveIntensity: 1.7 }));
  sign.position.set(1.05, 1.86, 0.63);
  group.add(roof, pane, sign);
  return group;
}

function createCampus(accent) {
  const group = new THREE.Group();
  const wall = mesh(new THREE.BoxGeometry(4.7, 3.6, 2.4), material(0xb3a487, { roughness: 0.92 }));
  wall.position.y = 1.8;
  group.add(wall);
  const windows = makeFacadeTexture(accent, 8);
  const facade = mesh(new THREE.PlaneGeometry(3.9, 2.8), new THREE.MeshBasicMaterial({ map: windows, transparent: true, opacity: 0.66 }));
  facade.position.set(0, 1.92, 1.22);
  facade.userData.disposeMaterial = true;
  group.add(facade);
  return group;
}

function createMarket(accent) {
  const group = new THREE.Group();
  const frame = material(0x5d4432, { roughness: 0.88 });
  const roof = mesh(new THREE.BoxGeometry(3.4, 0.16, 2), material(accent, { roughness: 0.72 }));
  roof.position.y = 2.35;
  const table = mesh(new THREE.BoxGeometry(3.1, 0.16, 1.1), frame);
  table.position.y = 0.92;
  [-1.42, 1.42].forEach((x) => {
    const post = mesh(new THREE.BoxGeometry(0.1, 2.4, 0.1), frame);
    post.position.set(x, 1.2, 0);
    group.add(post);
  });
  for (let index = 0; index < 7; index += 1) {
    const crate = mesh(new THREE.BoxGeometry(0.38, 0.27, 0.42), material(index % 2 ? 0xc27647 : 0x718f59, { roughness: 0.96 }));
    crate.position.set(-1.1 + index * 0.36, 1.14, (index % 2) * 0.24 - 0.12);
    group.add(crate);
  }
  group.add(roof, table);
  return group;
}

function createWarning(accent) {
  const group = new THREE.Group();
  const frame = material(0x373d40, { roughness: 0.45, metalness: 0.42 });
  const board = mesh(new THREE.BoxGeometry(2.6, 1.05, 0.12), material(accent, { emissive: accent, emissiveIntensity: 0.7, roughness: 0.48 }));
  board.position.y = 1.4;
  [-0.95, 0.95].forEach((x) => {
    const leg = mesh(new THREE.BoxGeometry(0.1, 1.45, 0.1), frame);
    leg.position.set(x, 0.72, 0);
    group.add(leg);
  });
  group.add(board);
  return group;
}

function createOverpass() {
  const group = new THREE.Group();
  const concrete = material(0x4d565c, { roughness: 0.95 });
  const deck = mesh(new THREE.BoxGeometry(15, 0.65, 3.1), concrete);
  deck.position.y = 5.3;
  [-5.6, 5.6].forEach((x) => {
    const pillar = mesh(new THREE.BoxGeometry(0.72, 5.3, 0.72), concrete);
    pillar.position.set(x, 2.65, 0);
    group.add(pillar);
  });
  group.add(deck);
  return group;
}

function createSignal(accent) {
  const group = new THREE.Group();
  const steel = material(0x273038, { roughness: 0.42, metalness: 0.72 });
  const housing = material(0x111719, { roughness: 0.34, metalness: 0.58 });
  const pole = mesh(new THREE.CylinderGeometry(0.07, 0.1, 4.8, 10), steel);
  pole.position.y = 2.4;
  const box = mesh(new THREE.BoxGeometry(0.62, 1.72, 0.42), housing);
  box.position.set(0, 4.05, 0);
  group.add(pole, box);
  [0xff3f43, 0xf3c84b, accent].forEach((color, index) => {
    const bezel = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 18), housing);
    bezel.rotation.x = Math.PI / 2;
    bezel.position.set(0, 4.55 - index * 0.5, 0.25);
    const lens = mesh(new THREE.CircleGeometry(0.13, 18), material(color, {
      emissive: color,
      emissiveIntensity: index === 2 ? 4.8 : 0.35,
      roughness: 0.18
    }));
    lens.position.set(0, 4.55 - index * 0.5, 0.318);
    group.add(bezel, lens);
  });
  return group;
}

function createGraffiti(accent, seed) {
  const group = new THREE.Group();
  const wall = mesh(new THREE.BoxGeometry(5.6, 2.8, 0.34), material(0x343b3f, { roughness: 0.92 }));
  wall.position.y = 1.4;
  const texture = makeGraffitiTexture(accent, seed);
  const artwork = mesh(new THREE.PlaneGeometry(5.25, 2.46), new THREE.MeshBasicMaterial({ map: texture }));
  artwork.position.set(0, 1.42, 0.18);
  group.add(wall, artwork);
  return group;
}

function createStation(accent) {
  const group = new THREE.Group();
  const steel = material(0x3a464c, { roughness: 0.38, metalness: 0.66 });
  const roofMaterial = material(0x69767a, { roughness: 0.54, metalness: 0.38 });
  const glass = material(0x8dcbd6, { transparent: true, opacity: 0.22, roughness: 0.12, depthWrite: false, side: THREE.DoubleSide });
  const platform = mesh(new THREE.BoxGeometry(4.6, 0.36, 7.6), material(0x777e7c, { roughness: 0.92 }));
  platform.position.y = 0.18;
  const roof = mesh(new THREE.BoxGeometry(4.5, 0.16, 6.8), roofMaterial);
  roof.position.y = 3.55;
  group.add(platform, roof);
  [-1.75, 1.75].forEach((x) => {
    [-2.3, 0, 2.3].forEach((z) => {
      const pillar = mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.4, 10), steel);
      pillar.position.set(x, 1.82, z);
      group.add(pillar);
    });
  });
  const pane = mesh(new THREE.PlaneGeometry(3.5, 1.65), glass);
  pane.position.set(0, 1.45, 0);
  group.add(pane);
  const signTexture = makeSignTexture("HEART LINE", accent);
  const sign = mesh(new THREE.PlaneGeometry(2.45, 0.7), new THREE.MeshBasicMaterial({ map: signTexture }));
  sign.position.set(0, 3.02, 0.12);
  group.add(sign);
  return group;
}

function createTunnel(accent) {
  const group = new THREE.Group();
  const concrete = material(0x333b40, { roughness: 0.96 });
  const trim = material(accent, { emissive: accent, emissiveIntensity: 1.4, roughness: 0.42 });
  const top = mesh(new THREE.BoxGeometry(13.4, 0.62, 2.4), concrete);
  top.position.y = 5.4;
  const left = mesh(new THREE.BoxGeometry(1.15, 5.3, 2.4), concrete);
  const right = left.clone();
  left.position.set(-6.15, 2.65, 0);
  right.position.set(6.15, 2.65, 0);
  group.add(top, left, right);
  [-4.85, 4.85].forEach((x) => {
    const strip = mesh(new THREE.BoxGeometry(0.08, 0.08, 2.05), trim);
    strip.position.set(x, 4.94, 0);
    group.add(strip);
  });
  return group;
}

function createNeonSign(accent, seed) {
  const group = new THREE.Group();
  const frame = mesh(new THREE.BoxGeometry(3.9, 1.5, 0.22), material(0x12171c, { roughness: 0.38, metalness: 0.54 }));
  frame.position.y = 2.5;
  const texture = makeSignTexture(seed % 2 ? "NEXT STOP" : "RUN CITY", accent);
  const sign = mesh(new THREE.PlaneGeometry(3.55, 1.16), new THREE.MeshBasicMaterial({ map: texture }));
  sign.position.set(0, 2.5, 0.12);
  group.add(frame, sign);
  return group;
}

function createMaintenance(accent, seed) {
  const group = createGraffiti(accent, seed);
  const pipeMaterial = material(0x778086, { roughness: 0.4, metalness: 0.7 });
  [-1.8, -1.35, 1.55].forEach((x, index) => {
    const pipe = mesh(new THREE.CylinderGeometry(0.08 + index * 0.015, 0.08 + index * 0.015, 4.2, 10), pipeMaterial);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(x * 0.3, 2.4 + index * 0.26, 0.3);
    group.add(pipe);
  });
  return group;
}

function createTerminal(accent) {
  const group = new THREE.Group();
  const archMaterial = material(0xc2c8c5, { roughness: 0.42, metalness: 0.52 });
  for (let index = -2; index <= 2; index += 1) {
    const rib = mesh(new THREE.TorusGeometry(5.72, 0.08, 8, 40, Math.PI), archMaterial);
    rib.position.set(0, 0.2, index * 1.35);
    group.add(rib);
  }
  const signTexture = makeSignTexture("TO THE FUTURE", accent);
  const sign = mesh(new THREE.PlaneGeometry(3.7, 0.82), new THREE.MeshBasicMaterial({ map: signTexture }));
  sign.position.set(0, 4.82, 0.15);
  group.add(sign);
  return group;
}

function createGantry(accent, compact = false) {
  const group = new THREE.Group();
  const steel = material(0x4f5c63, { roughness: 0.34, metalness: 0.76 });
  const cable = material(0x1b252a, { roughness: 0.52, metalness: 0.72 });
  [-5.66, 5.66].forEach((x) => {
    const height = compact ? 5.35 : 6.2;
    const post = mesh(new THREE.BoxGeometry(0.16, height, 0.16), steel);
    post.position.set(x, height / 2, 0);
    group.add(post);
  });
  const beamY = compact ? 5.2 : 6.05;
  const beam = mesh(new THREE.BoxGeometry(11.5, 0.15, 0.18), steel);
  beam.position.y = beamY;
  group.add(beam);
  [-2.35, 0, 2.35].forEach((x, index) => {
    const drop = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.72, 6), cable);
    drop.position.set(x, beamY - 0.42, 0);
    const insulator = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 8), material(accent, {
      emissive: accent,
      emissiveIntensity: index === 1 ? 1.25 : 0.38,
      roughness: 0.28
    }));
    insulator.position.set(x, beamY - 0.82, 0);
    group.add(drop, insulator);
  });
  return group;
}

function createStageSpan(stageIndex, accent, seed = 0) {
  const group = new THREE.Group();
  const steel = material(stageIndex === 5 ? 0x5c6876 : 0x34454e, { roughness: 0.32, metalness: 0.78 });
  const glow = material(accent, { emissive: accent, emissiveIntensity: 2.6, roughness: 0.18, metalness: 0.34 });
  if (stageIndex === 2 || stageIndex === 6) {
    const archCount = stageIndex === 6 ? 3 : 2;
    for (let index = 0; index < archCount; index += 1) {
      const arch = mesh(new THREE.TorusGeometry(5.7, 0.065 + index * 0.012, 8, 42, Math.PI), index % 2 ? steel : glow);
      arch.position.set(0, 0.18, -index * 0.34);
      group.add(arch);
    }
    const signTexture = makeSignTexture(stageIndex === 6 ? "SUNRISE" : "NIGHT LINE", accent);
    const sign = mesh(new THREE.PlaneGeometry(2.25, 0.62), new THREE.MeshBasicMaterial({ map: signTexture }));
    sign.position.set(0, 4.75, 0.08);
    group.add(sign);
  } else if (stageIndex === 3 || stageIndex === 4) {
    const cable = mesh(new THREE.CylinderGeometry(0.022, 0.022, 11.4, 6), steel);
    cable.rotation.z = Math.PI / 2;
    cable.position.y = 4.72;
    group.add(cable);
    for (let index = 0; index < 9; index += 1) {
      const bulbColor = index % 2 ? accent : 0xffd884;
      const bulb = mesh(new THREE.SphereGeometry(stageIndex === 3 ? 0.13 : 0.1, 10, 8), material(bulbColor, {
        emissive: bulbColor,
        emissiveIntensity: 4.2,
        roughness: 0.16
      }));
      bulb.position.set(-5 + index * 1.25, 4.56 - Math.sin(index / 8 * Math.PI) * 0.38, 0);
      group.add(bulb);
    }
  } else if (stageIndex === 5) {
    const top = mesh(new THREE.BoxGeometry(11.5, 0.16, 0.22), steel);
    top.position.y = 5.32;
    group.add(top);
    for (let index = -4; index <= 4; index += 2) {
      const brace = mesh(new THREE.BoxGeometry(2.6, 0.08, 0.12), index === 0 ? glow : steel);
      brace.position.set(index * 0.9, 4.34, 0);
      brace.rotation.z = (index / 2 + seed) % 2 ? 0.72 : -0.72;
      group.add(brace);
    }
  } else {
    const top = mesh(new THREE.BoxGeometry(11.5, 0.11, 0.16), steel);
    top.position.y = 5.18;
    const highlight = mesh(new THREE.BoxGeometry(11.18, 0.025, 0.18), glow);
    highlight.position.y = 5.08;
    group.add(top, highlight);
    [-5.66, 5.66].forEach((x) => {
      const post = mesh(new THREE.CylinderGeometry(0.055, 0.075, 5.1, 8), steel);
      post.position.set(x, 2.55, 0);
      group.add(post);
    });
  }
  group.userData.stageSpan = true;
  return group;
}

function createProp(type, accent, seed) {
  if (type === "tree") return createTree(accent);
  if (type === "lamp") return createLamp(accent);
  if (type === "bench") return createBench();
  if (type === "railing") return createRailing();
  if (type === "building") return createBuilding(accent, seed);
  if (type === "home") return createBuilding(accent, seed, true);
  if (type === "cafe") return createCafe(accent);
  if (type === "bookstore") return createBookstoreFront(accent);
  if (type === "cinema") return createCinemaFront(accent);
  if (type === "shelter") return createShelter(accent);
  if (type === "campus") return createCampus(accent);
  if (type === "market") return createMarket(accent);
  if (type === "warning") return createWarning(accent);
  if (type === "overpass") return createOverpass();
  if (type === "signal") return createSignal(accent);
  if (type === "graffiti") return createGraffiti(accent, seed);
  if (type === "station") return createStation(accent);
  if (type === "tunnel") return createTunnel(accent);
  if (type === "neon-sign") return createNeonSign(accent, seed);
  if (type === "maintenance") return createMaintenance(accent, seed);
  if (type === "terminal") return createTerminal(accent);
  if (type === "gantry") return createGantry(accent);
  return createLamp(accent);
}

function createWorldRoot(config) {
  const root = new THREE.Group();
  const parallax = Array.isArray(config.world.horizon.parallax) ? config.world.horizon.parallax : [0.04, 0.16, 0.3];
  const layers = ["far", "mid", "near"].map((name, index) => {
    const group = new THREE.Group();
    group.name = `${config.world.scene}-${name}`;
    root.add(group);
    return { group, parallax: Number(parallax[index]) || 0, span: 112 - index * 8 };
  });
  root.name = `world-${config.world.scene}`;
  root.userData.layers = layers;
  root.userData.scenery = [];
  root.userData.scene = config.world.scene;
  return root;
}

function addWorldScenery(root, layerIndex, object, options) {
  const layer = root.userData.layers[layerIndex];
  const side = options.side === 0 ? 0 : options.side < 0 ? -1 : 1;
  object.position.y = Number(options.y) || 0;
  if (options.scale) object.scale.setScalar(options.scale);
  object.rotation.y = Number(options.rotationY) || 0;
  if (side === 0) object.position.set(Number(options.x) || 0, object.position.y, Number(options.z) || -32);
  else fitTracksideObject(object, side, side * Math.abs(options.x), options.z);
  layer.group.add(object);
  object.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object);
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  const entry = {
    object,
    baseX: object.position.x,
    baseZ: object.position.z,
    parallax: Number.isFinite(options.parallax) ? options.parallax : layer.parallax,
    span: options.span || layer.span,
    drift: Number(options.drift) || 0,
    side,
    nearLimit: Number.isFinite(options.nearLimit) ? options.nearLimit : null,
    depthCull: options.depthCull !== false,
    centerOffset: sphere.center.clone().sub(object.position),
    sphere,
    nearOffset: bounds.max.z - object.position.z,
    farOffset: bounds.min.z - object.position.z
  };
  object.userData.worldScenery = entry;
  root.userData.scenery.push(entry);
  return object;
}

function beamBetween2D(startX, startY, endX, endY, thickness, beamMaterial) {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.hypot(dx, dy);
  const beam = mesh(new THREE.BoxGeometry(thickness, length, thickness), beamMaterial);
  beam.position.set((startX + endX) / 2, (startY + endY) / 2, 0);
  beam.rotation.z = -Math.atan2(dx, dy);
  return beam;
}

function beamBetween3D(start, end, radius, beamMaterial, radialSegments = 10) {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const beam = mesh(new THREE.CylinderGeometry(radius * 0.78, radius, length, radialSegments), beamMaterial);
  beam.position.copy(start).add(end).multiplyScalar(0.5);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return beam;
}

function createCampusCanopyTree(accent, seed = 0) {
  const group = new THREE.Group();
  const trunkMaterial = material(seed % 2 ? 0x65503d : 0x594638, { roughness: 0.96 });
  const trunk = mesh(new THREE.CylinderGeometry(0.24, 0.38, 4.8, 12), trunkMaterial, true, true);
  trunk.position.y = 2.4;
  group.add(trunk);

  const branchTips = [
    [-1.48, 4.95, -0.22], [-0.82, 5.65, 0.34], [0.86, 5.58, -0.38],
    [1.54, 4.86, 0.28], [-1.18, 4.42, 0.74], [1.08, 4.48, -0.82]
  ];
  branchTips.forEach(([x, y, z], index) => {
    const start = new THREE.Vector3(0, 3.25 + index % 3 * 0.28, 0);
    const end = new THREE.Vector3(x, y, z);
    group.add(beamBetween3D(start, end, 0.13 - index % 2 * 0.018, trunkMaterial, 9));
  });

  const leafColors = [0x2f7546, 0x4e9557, 0x83b85f];
  const leafMaterials = leafColors.map((color, index) => material(
    new THREE.Color(color).lerp(new THREE.Color(accent), index === 2 ? 0.045 : 0.015),
    { roughness: 0.94 }
  ));
  const crowns = [
    [-1.42, 5.22, -0.15, 0.82, 0], [-0.58, 5.72, 0.22, 0.92, 2], [0.68, 5.7, -0.28, 0.94, 2],
    [1.46, 5.14, 0.2, 0.8, 1], [-0.96, 4.76, 0.74, 0.72, 1], [0.88, 4.7, -0.78, 0.74, 0],
    [0, 6.18, 0.08, 0.78, 2], [-1.82, 5.52, 0.16, 0.68, 1], [1.84, 5.48, -0.1, 0.66, 2]
  ];
  crowns.slice(0, 3).forEach(([x, y, z, scale, materialIndex], index) => {
    const crown = mesh(new THREE.SphereGeometry(scale, 16, 11), leafMaterials[materialIndex], true, true);
    crown.scale.set(1.08 + index % 2 * 0.06, 0.48 + index % 3 * 0.04, 0.68);
    crown.position.set(x, y, z);
    group.add(crown);
  });

  const leafCardMaterial = new THREE.SpriteMaterial({
    map: makeCampusLeafTexture(),
    color: 0xf5ffdc,
    transparent: true,
    alphaTest: 0.06,
    depthWrite: false,
    toneMapped: true
  });
  [[0, 5.55, 0.82, 6.6, 4.45], [-1.12, 5.22, 0.18, 4.65, 3.3], [1.15, 5.3, -0.1, 4.7, 3.25]].forEach(([x, y, z, width, height]) => {
    const card = new THREE.Sprite(leafCardMaterial.clone());
    card.position.set(x, y, z);
    card.scale.set(width, height, 1);
    group.add(card);
  });
  const shadow = createSoftGroundShadow(5.8, 4.2, 0.24);
  group.add(shadow);
  group.rotation.y = seed * 0.71;
  group.userData.kind = "campus-canopy-tree";
  return group;
}

function createCampusSidewalkGarden(seed = 0) {
  const group = new THREE.Group();
  const pavement = material(seed % 2 ? 0xd9dfdb : 0xe4e6df, { roughness: 0.9, metalness: 0.01 });
  const curbMaterial = material(0xb8c2bd, { roughness: 0.86 });
  const soilMaterial = material(0x4a4637, { roughness: 1 });
  const sidewalk = mesh(new THREE.BoxGeometry(3.35, 0.16, 20), pavement, false, true);
  sidewalk.position.y = 0.08;
  const curb = mesh(new THREE.BoxGeometry(0.24, 0.32, 20), curbMaterial, false, true);
  curb.position.set(-1.56, 0.16, 0);
  const seams = createInstancedObstacleParts(
    new THREE.BoxGeometry(3.1, 0.012, 0.035),
    material(0x9da9a4, { roughness: 0.96 }),
    Array.from({ length: 11 }, (_, index) => ({ y: 0.168, z: -9.5 + index * 1.9 }))
  );
  const planterShell = material(0x95a29b, { roughness: 0.9 });
  const planters = createInstancedObstacleParts(
    new THREE.BoxGeometry(1.32, 0.54, 2.55),
    planterShell,
    [-6.1, 0, 6.1].map((z) => ({ x: 0.58, y: 0.27, z }))
  );
  const soil = createInstancedObstacleParts(
    new THREE.BoxGeometry(1.08, 0.06, 2.28),
    soilMaterial,
    [-6.1, 0, 6.1].map((z) => ({ x: 0.58, y: 0.57, z }))
  );
  const flowerMaterial = material(seed % 2 ? 0xf2a7bd : 0xf4c1d0, { roughness: 0.82 });
  const flowers = createInstancedObstacleParts(
    new THREE.SphereGeometry(0.13, 9, 6),
    flowerMaterial,
    Array.from({ length: 36 }, (_, index) => ({
      x: 0.15 + index % 4 * 0.26,
      y: 0.68 + index % 3 * 0.05,
      z: [-6.1, 0, 6.1][Math.floor(index / 12)] + (Math.floor(index / 4) % 3 - 1) * 0.48
    }))
  );
  group.add(sidewalk, curb, seams, planters, soil, flowers);
  return group;
}

function createCampusGlassLift(accent) {
  const group = new THREE.Group();
  const steel = material(0x596b73, { roughness: 0.28, metalness: 0.72 });
  const concrete = material(0xc7d1cd, { roughness: 0.78, metalness: 0.04 });
  const glass = material(0x9ed5e5, {
    transparent: true,
    opacity: 0.82,
    roughness: 0.16,
    metalness: 0.08,
    depthWrite: true,
    side: THREE.DoubleSide
  });
  glass.envMapIntensity = 0.86;
  const glow = material(accent, { emissive: accent, emissiveIntensity: 1.2, roughness: 0.24 });
  const base = mesh(new THREE.BoxGeometry(3.3, 0.28, 3.2), concrete);
  base.position.y = 0.14;
  const glassCore = mesh(new THREE.BoxGeometry(2.9, 6.8, 2.82), glass);
  glassCore.position.y = 3.68;
  const frameTransforms = [];
  [-1.5, 1.5].forEach((x) => [-1.42, 1.42].forEach((z) => frameTransforms.push({ x, y: 3.68, z })));
  const frames = createInstancedObstacleParts(new THREE.BoxGeometry(0.1, 6.9, 0.1), steel, frameTransforms);
  const bands = createInstancedObstacleParts(
    new THREE.BoxGeometry(3.08, 0.075, 0.1),
    steel,
    Array.from({ length: 8 }, (_, index) => ({ y: 0.62 + index * 0.86, z: 1.46 }))
      .concat(Array.from({ length: 8 }, (_, index) => ({ y: 0.62 + index * 0.86, z: -1.46 })))
  );
  const cabin = mesh(new THREE.BoxGeometry(1.72, 2.3, 1.72), material(0xd6ecef, {
    emissive: accent,
    emissiveIntensity: 0.08,
    roughness: 0.34,
    metalness: 0.18
  }));
  cabin.position.y = 2.1;
  const beacon = mesh(new THREE.BoxGeometry(2.25, 0.12, 0.14), glow);
  beacon.position.set(0, 7.02, 1.5);
  group.add(base, glassCore, frames, bands, cabin, beacon);

  const stairGroup = new THREE.Group();
  const stepTransforms = Array.from({ length: 14 }, (_, index) => ({
    x: 2.1 + index * 0.32,
    y: 0.18 + index * 0.25,
    z: 0,
    sx: 1,
    sy: 1,
    sz: 1
  }));
  const steps = createInstancedObstacleParts(new THREE.BoxGeometry(0.72, 0.18, 2.5), concrete, stepTransforms);
  const leftRail = beamBetween2D(1.85, 0.75, 6.42, 4.3, 0.07, steel);
  leftRail.position.z = -1.32;
  const rightRail = leftRail.clone();
  rightRail.position.z = 1.32;
  stairGroup.add(steps, leftRail, rightRail);
  group.add(stairGroup);
  return group;
}

function createCampusFootbridge(accent) {
  const group = new THREE.Group();
  const steel = material(0x697a80, { roughness: 0.3, metalness: 0.68 });
  const deckMaterial = material(0xb9c3c0, { roughness: 0.72, metalness: 0.08 });
  const glass = material(0xc4e8ee, { transparent: true, opacity: 0.76, roughness: 0.17, metalness: 0.08, depthWrite: true, side: THREE.DoubleSide });
  glass.envMapIntensity = 0.9;
  const deck = mesh(new THREE.BoxGeometry(15.2, 0.34, 2.25), deckMaterial);
  deck.position.y = 5.05;
  const underside = mesh(new THREE.BoxGeometry(15.6, 0.12, 2.38), steel);
  underside.position.y = 4.82;
  const northGlass = mesh(new THREE.PlaneGeometry(14.7, 1.22), glass);
  northGlass.position.set(0, 5.75, -1.08);
  const southGlass = northGlass.clone();
  southGlass.position.z = 1.08;
  const posts = createInstancedObstacleParts(
    new THREE.BoxGeometry(0.08, 1.45, 0.08),
    steel,
    Array.from({ length: 18 }, (_, index) => ({ x: -7.15 + index * 0.84, y: 5.74, z: -1.1 }))
      .concat(Array.from({ length: 18 }, (_, index) => ({ x: -7.15 + index * 0.84, y: 5.74, z: 1.1 })))
  );
  const pillars = createInstancedObstacleParts(new THREE.BoxGeometry(0.48, 4.95, 0.56), deckMaterial, [
    { x: -6.6, y: 2.46, z: 0 }, { x: 6.6, y: 2.46, z: 0 }
  ]);
  const edgeLight = mesh(new THREE.BoxGeometry(14.6, 0.035, 0.07), material(accent, { emissive: accent, emissiveIntensity: 0.72, roughness: 0.22 }));
  edgeLight.position.set(0, 4.7, 1.17);
  group.add(deck, underside, northGlass, southGlass, posts, pillars, edgeLight);
  group.userData.overheadClearance = TRACK_CLEARANCE.overheadY;
  return group;
}

function createCampusTransitPavilion(accent) {
  const group = new THREE.Group();
  const steel = material(0x526169, { roughness: 0.3, metalness: 0.7 });
  const glass = material(0xc4e8ed, { transparent: true, opacity: 0.8, roughness: 0.16, metalness: 0.08, depthWrite: true, side: THREE.DoubleSide });
  glass.envMapIntensity = 0.92;
  const stone = material(0xadb8b5, { roughness: 0.82 });
  const platform = mesh(new THREE.BoxGeometry(4.9, 0.24, 7.4), stone);
  platform.position.y = 0.12;
  const ribs = createInstancedObstacleParts(
    new THREE.TorusGeometry(2.22, 0.075, 8, 28, Math.PI),
    steel,
    Array.from({ length: 6 }, (_, index) => ({ y: 1.65, z: -3 + index * 1.2 }))
  );
  const canopy = mesh(new THREE.BoxGeometry(4.45, 0.08, 6.3), glass);
  canopy.position.y = 3.7;
  const sideGlass = mesh(new THREE.PlaneGeometry(6.1, 2.65), glass);
  sideGlass.rotation.y = Math.PI / 2;
  sideGlass.position.set(2.12, 1.55, 0);
  const rearGlass = sideGlass.clone();
  rearGlass.position.x = -2.12;
  const bench = createBench();
  bench.position.set(0, 0.05, 0.8);
  bench.rotation.y = Math.PI;
  const sign = mesh(new THREE.BoxGeometry(1.5, 0.5, 0.08), material(accent, { emissive: accent, emissiveIntensity: 1.45, roughness: 0.2 }));
  sign.position.set(2.18, 2.25, -1.7);
  group.add(platform, ribs, canopy, sideGlass, rearGlass, bench, sign);
  return group;
}

function createCampusAcademicBlock(accent, seed = 0) {
  const group = new THREE.Group();
  const width = 5.8 + seed % 2 * 1.3;
  const height = 6.2 + seed % 3 * 1.1;
  const depth = 7.2;
  const concrete = material(seed % 2 ? 0xe6ece8 : 0xd5e2e1, { roughness: 0.74, metalness: 0.03 });
  const steel = material(0x71858c, { roughness: 0.24, metalness: 0.62 });
  const facadeTexture = makeCampusFacadeTexture(seed);
  const glass = material(0xc7edf4, { roughness: 0.16, metalness: 0.14 });
  glass.map = facadeTexture;
  glass.envMapIntensity = 1.05;
  const body = mesh(new THREE.BoxGeometry(width, height, depth), concrete);
  body.position.y = height / 2;
  const facade = mesh(new THREE.PlaneGeometry(width * 0.88, height * 0.82), glass);
  facade.position.set(0, height * 0.52, depth / 2 + 0.012);
  const mullions = createInstancedObstacleParts(new THREE.BoxGeometry(0.07, height * 0.76, 0.08), steel,
    Array.from({ length: 7 }, (_, index) => ({ x: -width * 0.36 + index * width * 0.12, y: height * 0.52, z: depth / 2 + 0.06 })));
  const floorBands = createInstancedObstacleParts(new THREE.BoxGeometry(width * 0.82, 0.08, 0.08), steel,
    Array.from({ length: 6 }, (_, index) => ({ y: 0.85 + index * (height - 1.3) / 5, z: depth / 2 + 0.065 })));
  const roofLine = mesh(new THREE.BoxGeometry(width + 0.2, 0.18, depth + 0.2), material(0xf0f3ec, { emissive: accent, emissiveIntensity: 0.035, roughness: 0.52 }));
  roofLine.position.y = height + 0.08;
  const shadow = createSoftGroundShadow(width * 1.35, depth * 1.18, 0.22);
  shadow.position.z = depth * 0.12;
  group.add(body, facade, mullions, floorBands, roofLine, shadow);
  group.userData.facadeTexture = facadeTexture;
  return group;
}

function createCampusBoulevardPlanting(accent, seed = 0) {
  const group = new THREE.Group();
  const trunkMaterial = material(0x5e4938, { roughness: 1 });
  const leafMaterial = material(new THREE.Color(0x4d8b55).lerp(new THREE.Color(accent), 0.035), { roughness: 0.96 });
  const planterMaterial = material(0xa9b6af, { roughness: 0.9 });
  const treeCount = 6;
  const trunks = createInstancedObstacleParts(new THREE.CylinderGeometry(0.12, 0.18, 2.45, 10), trunkMaterial,
    Array.from({ length: treeCount }, (_, index) => ({ x: index % 2 * 1.8, y: 1.33, z: -Math.floor(index / 2) * 5.6 })));
  const crowns = createInstancedObstacleParts(new THREE.SphereGeometry(0.92, 12, 8), leafMaterial,
    Array.from({ length: treeCount * 3 }, (_, index) => {
      const tree = Math.floor(index / 3);
      const lobe = index % 3;
      return {
        x: tree % 2 * 1.8 + (lobe - 1) * 0.42,
        y: 2.85 + (lobe === 1 ? 0.34 : 0),
        z: -Math.floor(tree / 2) * 5.6 + (lobe % 2 ? 0.18 : -0.14),
        sx: 1.08,
        sy: 0.82,
        sz: 0.96
      };
    }));
  const planters = createInstancedObstacleParts(new THREE.BoxGeometry(2.4, 0.48, 1.24), planterMaterial,
    Array.from({ length: 3 }, (_, index) => ({ x: 0.9, y: 0.24, z: -index * 5.6 })));
  const flowers = createInstancedObstacleParts(new THREE.SphereGeometry(0.12, 8, 6), material(seed % 2 ? 0xf0a7b8 : 0xf7cf8e, { roughness: 0.86 }),
    Array.from({ length: 18 }, (_, index) => ({ x: 0.25 + index % 6 * 0.25, y: 0.58 + index % 2 * 0.06, z: -Math.floor(index / 6) * 5.6 + (index % 3 - 1) * 0.22 })));
  const leafTexture = makeCampusLeafTexture();
  const leafCards = new THREE.Group();
  const leafCardMaterial = new THREE.MeshBasicMaterial({ map: leafTexture, color: 0xf1ffdc, transparent: true, alphaTest: 0.08, depthWrite: false, side: THREE.DoubleSide });
  for (let tree = 0; tree < treeCount; tree += 1) {
    const card = mesh(new THREE.PlaneGeometry(2.45, 2.15), leafCardMaterial);
    card.position.set(tree % 2 * 1.8, 2.82, -Math.floor(tree / 2) * 5.6 + 0.38);
    card.rotation.y = tree % 2 ? -0.18 : 0.18;
    leafCards.add(card);
  }
  const shadow = createSoftGroundShadow(4.4, 14.6, 0.16);
  shadow.position.set(0.9, 0.012, -5.6);
  group.add(trunks, crowns, planters, flowers, leafCards, shadow);
  group.userData.leafTexture = leafTexture;
  return group;
}

function makeCampusPavingTexture() {
  const texture = canvasTexture(512, 512, (context, width, height) => {
    const base = context.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, "#eef1ed");
    base.addColorStop(0.55, "#d8dfdc");
    base.addColorStop(1, "#c6d0cd");
    context.fillStyle = base;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(88,105,104,.22)";
    context.lineWidth = 3;
    for (let x = 0; x <= width; x += 128) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y <= height; y += 96) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    let seed = 1297;
    for (let index = 0; index < 420; index += 1) {
      seed = seed * 16807 % 2147483647;
      const x = seed % width;
      seed = seed * 16807 % 2147483647;
      const y = seed % height;
      context.fillStyle = `rgba(65,83,82,${0.018 + seed % 5 / 250})`;
      context.fillRect(x, y, 1 + seed % 3, 1 + seed % 2);
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.2, 34);
  SHARED_TEXTURES.add(texture);
  return texture;
}

function makeCampusLawnTexture() {
  const texture = canvasTexture(384, 384, (context, width, height) => {
    context.fillStyle = "#557b57";
    context.fillRect(0, 0, width, height);
    let seed = 8713;
    for (let index = 0; index < 2200; index += 1) {
      seed = seed * 16807 % 2147483647;
      const x = seed % width;
      seed = seed * 16807 % 2147483647;
      const y = seed % height;
      const green = 78 + seed % 62;
      context.strokeStyle = `rgba(${40 + seed % 25},${green},${48 + seed % 34},${0.16 + seed % 22 / 100})`;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x, y + 3);
      context.lineTo(x + (seed % 5 - 2), y - 3 - seed % 5);
      context.stroke();
    }
    const light = context.createLinearGradient(0, 0, width, height);
    light.addColorStop(0, "rgba(226,247,163,.18)");
    light.addColorStop(0.5, "rgba(255,255,255,0)");
    light.addColorStop(1, "rgba(26,58,40,.18)");
    context.fillStyle = light;
    context.fillRect(0, 0, width, height);
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 42);
  SHARED_TEXTURES.add(texture);
  return texture;
}

function makeCampusConcreteTexture(seed = 0) {
  const texture = canvasTexture(512, 512, (context, width, height) => {
    const wash = context.createLinearGradient(0, 0, width, height);
    wash.addColorStop(0, seed % 2 ? "#f4f5ef" : "#edf2ef");
    wash.addColorStop(0.48, seed % 2 ? "#dde2dd" : "#d9e2df");
    wash.addColorStop(1, seed % 2 ? "#c4cdc9" : "#c8d3d0");
    context.fillStyle = wash;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(78,96,96,.16)";
    context.lineWidth = 2;
    for (let x = 0; x <= width; x += 128) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y <= height; y += 128) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    let random = 373 + seed * 991;
    for (let index = 0; index < 1600; index += 1) {
      random = random * 16807 % 2147483647;
      const x = random % width;
      random = random * 16807 % 2147483647;
      const y = random % height;
      const alpha = 0.012 + random % 11 / 600;
      context.fillStyle = `rgba(${random % 2 ? 48 : 255},${random % 2 ? 66 : 255},${random % 2 ? 64 : 255},${alpha})`;
      context.fillRect(x, y, 1 + random % 2, 1 + random % 2);
    }
    const bounce = context.createLinearGradient(0, 0, width, 0);
    bounce.addColorStop(0, "rgba(255,255,245,.26)");
    bounce.addColorStop(0.36, "rgba(255,255,255,.04)");
    bounce.addColorStop(1, "rgba(63,86,86,.14)");
    context.fillStyle = bounce;
    context.fillRect(0, 0, width, height);
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.4, 1.4);
  texture.anisotropy = 8;
  return texture;
}

function makeCampusBarkTexture(seed = 0) {
  const texture = canvasTexture(256, 512, (context, width, height) => {
    const bark = context.createLinearGradient(0, 0, width, 0);
    bark.addColorStop(0, "#4a382c");
    bark.addColorStop(0.28, seed % 2 ? "#765842" : "#6b503b");
    bark.addColorStop(0.62, "#87664a");
    bark.addColorStop(1, "#3d3028");
    context.fillStyle = bark;
    context.fillRect(0, 0, width, height);
    let random = 713 + seed * 419;
    for (let index = 0; index < 190; index += 1) {
      random = random * 16807 % 2147483647;
      const x = random % width;
      const y = random * 31 % height;
      context.strokeStyle = index % 3 ? "rgba(34,24,20,.28)" : "rgba(220,185,134,.16)";
      context.lineWidth = 1 + random % 3;
      context.beginPath();
      context.moveTo(x, y);
      context.bezierCurveTo(x - 8, y + 24, x + 7, y + 48, x - 2, y + 88 + random % 42);
      context.stroke();
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 3.2);
  texture.anisotropy = 4;
  return texture;
}

function createCampusSurfaceRibbon() {
  const group = new THREE.Group();
  const pavingTexture = makeCampusPavingTexture();
  const lawnTexture = makeCampusLawnTexture();
  const pavingMaterial = new THREE.MeshStandardMaterial({
    map: pavingTexture,
    color: 0xf2f4ef,
    roughness: 0.86,
    metalness: 0.015,
    envMapIntensity: 0.62
  });
  const lawnMaterial = new THREE.MeshStandardMaterial({
    map: lawnTexture,
    color: 0xcde4b5,
    roughness: 0.98,
    metalness: 0,
    envMapIntensity: 0.28
  });
  const curbMaterial = material(0xdce3df, { roughness: 0.82, metalness: 0.02 });
  [-1, 1].forEach((side) => {
    const sidewalk = mesh(new THREE.PlaneGeometry(3.15, 230), pavingMaterial, false, true);
    sidewalk.rotation.x = -Math.PI / 2;
    sidewalk.position.set(side * 6.12, 0.045, -99);
    const lawn = mesh(new THREE.PlaneGeometry(12.5, 230), lawnMaterial, false, true);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(side * 13.92, -0.012, -99);
    const curb = mesh(new THREE.BoxGeometry(0.3, 0.28, 230), curbMaterial, false, true);
    curb.position.set(side * 4.56, 0.13, -99);
    group.add(sidewalk, lawn, curb);
  });
  group.userData.scrollTextures = (distance) => {
    pavingTexture.offset.y = distance * WORLD_Z_SCALE / 230 * pavingTexture.repeat.y;
    lawnTexture.offset.y = distance * WORLD_Z_SCALE / 230 * lawnTexture.repeat.y;
  };
  group.userData.sharedTextures = [pavingTexture, lawnTexture];
  return group;
}

function createCampusCloudField() {
  const group = new THREE.Group();
  const skyArtMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
    toneMapped: false
  });
  const skyArt = mesh(new THREE.PlaneGeometry(240, 135), skyArtMaterial);
  skyArt.position.set(0, 67.5, -220);
  skyArt.renderOrder = -8;
  group.add(skyArt);
  const sunTexture = canvasTexture(256, 256, (context, width, height) => {
    const glow = context.createRadialGradient(width / 2, height / 2, 2, width / 2, height / 2, width / 2);
    glow.addColorStop(0, "rgba(255,255,238,1)");
    glow.addColorStop(0.12, "rgba(255,246,184,.98)");
    glow.addColorStop(0.38, "rgba(255,224,127,.42)");
    glow.addColorStop(1, "rgba(255,218,116,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
  });
  SHARED_TEXTURES.add(sunTexture);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sunTexture,
    color: 0xfff4bf,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  }));
  sun.position.set(-18, 15.8, -76);
  sun.scale.set(5.8, 5.8, 1);
  group.add(sun);
  const cloudLobes = [];
  const cloudAnchors = [
    [-23, 19, -96, 5.8], [18, 24, -122, 7.2], [-7, 17, -155, 6.2],
    [31, 15, -182, 7.8], [-35, 26, -205, 8.4]
  ];
  cloudAnchors.forEach(([x, y, z, size], cloudIndex) => {
    const lobeLayout = [[-0.82, 0, 0.76], [-0.24, 0.2, 1], [0.42, 0.04, 0.88], [0.96, -0.08, 0.62]];
    lobeLayout.forEach(([offset, lift, scale], lobeIndex) => cloudLobes.push({
      x: x + offset * size,
      y: y + lift * size,
      z: z - lobeIndex * 0.22,
      sx: size * scale,
      sy: size * scale * 0.34,
      sz: size * scale * 0.28,
      phase: cloudIndex * 1.37
    }));
  });
  const cloudBatch = createCampusInstancedBatch(
    new THREE.IcosahedronGeometry(1, 2),
    new THREE.MeshBasicMaterial({ color: 0xe9f1ef, fog: false, toneMapped: false }),
    cloudLobes
  );
  cloudBatch.userData.baseMatrices = cloudLobes.map((entry) => ({ ...entry }));
  group.add(cloudBatch);
  group.userData.skyArt = skyArt;
  group.userData.proceduralSky = [sun, cloudBatch];
  group.userData.animate = (time) => {
    const transform = new THREE.Matrix4();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    cloudBatch.userData.baseMatrices.forEach((entry, index) => {
      const drift = Math.sin(time * 0.025 + entry.phase) * 1.2;
      transform.compose(
        new THREE.Vector3(entry.x + drift, entry.y, entry.z),
        rotation,
        scale.set(entry.sx, entry.sy, entry.sz)
      );
      cloudBatch.setMatrixAt(index, transform);
    });
    cloudBatch.instanceMatrix.needsUpdate = true;
  };
  return group;
}

function createCampusTreeAvenue(side, seed = 0) {
  const group = new THREE.Group();
  const count = 25;
  const barkTexture = makeCampusBarkTexture(seed);
  const trunkMaterial = new THREE.MeshStandardMaterial({ map: barkTexture, color: 0xf0ddc7, roughness: 0.98, metalness: 0 });
  const branchMaterial = new THREE.MeshStandardMaterial({ map: barkTexture, color: 0xd8c2aa, roughness: 1, metalness: 0 });
  const trunkTransforms = [];
  const branchTransforms = [];
  const leafCards = [];
  const blossomTransforms = [];
  for (let index = 0; index < count; index += 1) {
    const z = 108 - index * 8.45;
    const x = side * (7.62 + ((index * 7 + seed) % 5 - 2) * 0.12);
    const height = 4.55 + (index * 17 + seed * 5) % 14 / 10;
    trunkTransforms.push({ x, y: height * 0.47, z, sy: height / 3.6, sx: 0.96 + index % 3 * 0.045, sz: 0.94 });
    branchTransforms.push({ x: x - side * 0.5, y: height * 0.84, z, rz: side * 0.66, sy: 1.3 });
    branchTransforms.push({ x: x + side * 0.38, y: height * 0.9, z: z - 0.22, rz: side * -0.58, sy: 1.12 });
    branchTransforms.push({ x: x - side * 0.1, y: height * 0.96, z: z + 0.1, rz: side * 0.22, rx: 0.38, sy: 0.98 });
    const gatewaySightline = index >= 11 && index <= 14;
    if (!gatewaySightline) {
      leafCards.push({ x: x - side * 1.7, y: height + 1.46, z: z + 0.5, sx: 5.65, sy: 4.18, ry: side * 0.18 });
      leafCards.push({ x: x - side * 0.96, y: height + 1.16, z: z - 0.32, sx: 5.15, sy: 3.82, ry: side * -0.34 });
      leafCards.push({ x: x - side * 1.22, y: height + 1.22, z: z - 1.08, sx: 4.75, sy: 3.55, ry: side * 0.58 });
      leafCards.push({ x: x + side * 0.42, y: height + 1.22, z: z + 0.12, sx: 4.4, sy: 3.45, ry: side * 1.12 });
    } else {
      leafCards.push({ x: x + side * 0.55, y: height + 1.15, z, sx: 3.4, sy: 2.65, ry: side * 0.72 });
    }
    if (index % 3 === 0 && !gatewaySightline) {
      leafCards.push({ x: side * 4.25, y: height + 2.48, z: z - 0.3, sx: 6.9, sy: 3.9, ry: side * -0.08, rz: side * 0.08 });
    }
    if ((index + seed) % 4 === 1) {
      for (let blossom = 0; blossom < 12; blossom += 1) {
        blossomTransforms.push({
          x: x - side * (0.72 + blossom % 4 * 0.32),
          y: height + 1.18 + blossom % 5 * 0.17,
          z: z - 0.92 + blossom * 0.17,
          sx: 0.82 + blossom % 2 * 0.18,
          sy: 0.68,
          sz: 0.76
        });
      }
    }
  }
  const trunks = createInstancedObstacleParts(new THREE.CylinderGeometry(0.2, 0.33, 3.6, 12), trunkMaterial, trunkTransforms);
  const branches = createInstancedObstacleParts(new THREE.CylinderGeometry(0.085, 0.17, 2.35, 9), branchMaterial, branchTransforms);
  const cardMaterial = new THREE.MeshStandardMaterial({
    map: makeCampusLeafTexture(),
    color: seed % 2 ? 0xe6f7cf : 0xf0ffdb,
    transparent: true,
    alphaTest: 0.12,
    depthWrite: true,
    side: THREE.DoubleSide,
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0.42
  });
  const cards = createInstancedObstacleParts(new THREE.PlaneGeometry(1, 1), cardMaterial, leafCards);
  cards.castShadow = false;
  const blossoms = createInstancedObstacleParts(
    new THREE.SphereGeometry(0.16, 8, 6),
    material(seed % 2 ? 0xf2a8c5 : 0xf6bfd0, { roughness: 0.88 }),
    blossomTransforms
  );
  blossoms.castShadow = false;
  const shadow = createSoftGroundShadow(7.4, 216, 0.18);
  shadow.position.set(side * 6.58, 0.012, 3.2);
  group.add(shadow, trunks, branches, cards, blossoms);
  group.userData.canopy = cards;
  group.userData.barkTexture = barkTexture;
  return group;
}

function createCampusForegroundCanopy(seed = 0) {
  const group = new THREE.Group();
  const canopyMaterial = new THREE.MeshStandardMaterial({
    map: makeCampusLeafTexture(),
    color: 0xf7ffe8,
    transparent: true,
    alphaTest: 0.1,
    depthWrite: true,
    side: THREE.DoubleSide,
    roughness: 0.94,
    metalness: 0,
    envMapIntensity: 0.38
  });
  const placements = [
    { x: -5.95, y: 7.15, z: -1.2, sx: 10.6, sy: 7.5, ry: 0.16, rz: -0.08 },
    { x: 6.05, y: 7.3, z: -2.2, sx: 10.8, sy: 7.7, ry: -0.18, rz: 0.09 },
    { x: -5.35, y: 8.8, z: -15.6, sx: 8.8, sy: 5.9, ry: 0.12, rz: 0.04 },
    { x: 5.5, y: 8.95, z: -17.2, sx: 9, sy: 6.1, ry: -0.13, rz: -0.04 }
  ];
  const cards = createInstancedObstacleParts(new THREE.PlaneGeometry(1, 1), canopyMaterial, placements);
  cards.castShadow = false;
  cards.receiveShadow = false;
  cards.renderOrder = 2;
  group.add(cards);
  group.userData.canopy = cards;
  group.userData.canopyPhase = seed * 0.73;
  return group;
}

function createCampusAuthoredStreetscape(side) {
  const group = new THREE.Group();
  const leftSide = side < 0;
  const height = leftSide ? 11.8 : 12.1;
  const aspect = leftSide ? 941 / 1672 : 847 / 1857;
  const streetscapeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    alphaTest: 0.045,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const card = mesh(new THREE.PlaneGeometry(height * aspect, height), streetscapeMaterial);
  card.position.set(leftSide ? -5.85 : 5.8, height * 0.5 - 0.08, 0);
  card.rotation.y = leftSide ? 0.025 : -0.025;
  card.renderOrder = 3;
  card.castShadow = false;
  card.receiveShadow = false;
  card.frustumCulled = false;
  group.add(card);
  group.userData.streetscapeArt = { side, card };
  return group;
}

function createCampusAcademicWing(accent, seed = 0) {
  const group = new THREE.Group();
  const width = 7.2 + seed % 3 * 1.25;
  const height = 7.6 + seed % 4 * 1.05;
  const depth = 10.4 + seed % 2 * 2.2;
  const concrete = material(seed % 2 ? 0xe7ece8 : 0xd6e0df, { roughness: 0.74, metalness: 0.025 });
  const stone = material(0xb7c3bf, { roughness: 0.82, metalness: 0.04 });
  const steel = material(0x60747c, { roughness: 0.28, metalness: 0.72 });
  const glass = new THREE.MeshPhysicalMaterial({
    map: makeCampusFacadeTexture(seed),
    color: 0xc8edf3,
    roughness: 0.16,
    metalness: 0.12,
    clearcoat: 0.72,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.05
  });
  const body = mesh(new THREE.BoxGeometry(width, height, depth), concrete, true, true);
  body.position.y = height / 2;
  const recessedGlass = mesh(new THREE.PlaneGeometry(width * 0.82, height * 0.82), glass);
  recessedGlass.position.set(0, height * 0.53, depth / 2 + 0.016);
  const podium = mesh(new THREE.BoxGeometry(width + 0.8, 0.54, depth + 0.65), stone, true, true);
  podium.position.y = 0.27;
  const roof = mesh(new THREE.BoxGeometry(width + 0.36, 0.22, depth + 0.38), steel, true, true);
  roof.position.y = height + 0.11;
  const fins = createInstancedObstacleParts(
    new THREE.BoxGeometry(0.09, height * 0.86, 0.34),
    steel,
    Array.from({ length: 9 }, (_, index) => ({
      x: -width * 0.39 + index * width * 0.0975,
      y: height * 0.53,
      z: depth / 2 + 0.19
    }))
  );
  const floorBands = createInstancedObstacleParts(
    new THREE.BoxGeometry(width * 0.84, 0.075, 0.26),
    steel,
    Array.from({ length: 7 }, (_, index) => ({
      y: 0.9 + index * (height - 1.45) / 6,
      z: depth / 2 + 0.18
    }))
  );
  const entrance = mesh(new THREE.BoxGeometry(width * 0.46, 0.22, 2.2), material(0xf0f5f1, { roughness: 0.56, metalness: 0.08 }), true, true);
  entrance.position.set(0, 2.55, depth / 2 + 1.02);
  const entranceGlass = mesh(new THREE.PlaneGeometry(width * 0.34, 2.25), new THREE.MeshPhysicalMaterial({
    color: 0xaed9e5,
    roughness: 0.1,
    metalness: 0.22,
    transparent: true,
    opacity: 0.78,
    depthWrite: true,
    side: THREE.DoubleSide
  }));
  entranceGlass.position.set(0, 1.4, depth / 2 + 1.14);
  const sunStrip = mesh(new THREE.BoxGeometry(width * 0.78, 0.055, 0.12), material(accent, {
    emissive: accent,
    emissiveIntensity: 0.22,
    roughness: 0.34
  }));
  sunStrip.position.set(0, height - 0.3, depth / 2 + 0.28);
  group.add(body, podium, roof, recessedGlass, fins, floorBands, entrance, entranceGlass, sunStrip);
  return group;
}

function createCampusBuildingRow(side, accent, seed = 0) {
  const group = new THREE.Group();
  const count = 11;
  const concreteTexture = makeCampusConcreteTexture(seed);
  const concrete = new THREE.MeshStandardMaterial({
    map: concreteTexture,
    color: seed % 2 ? 0xf5f3e9 : 0xf0f6f2,
    roughness: 0.72,
    metalness: 0.018,
    envMapIntensity: 0.62
  });
  const podiumMaterial = new THREE.MeshStandardMaterial({
    map: concreteTexture,
    color: 0xc9d2cc,
    roughness: 0.86,
    metalness: 0.015,
    envMapIntensity: 0.42
  });
  const steel = material(0x5d727b, { roughness: 0.26, metalness: 0.74 });
  const glass = new THREE.MeshStandardMaterial({
    map: makeCampusFacadeTexture(seed),
    color: 0xf2fcff,
    roughness: 0.24,
    metalness: 0.08,
    emissive: 0x224b5c,
    emissiveIntensity: 0.12,
    envMapIntensity: 1.28,
    side: THREE.DoubleSide
  });
  const bodies = [];
  const podiums = [];
  const roofs = [];
  const facades = [];
  const endFacades = [];
  const mullions = [];
  const bands = [];
  const canopies = [];
  const balconySlabs = [];
  const facadePiers = [];
  const roofBlocks = [];
  const sunStrips = [];
  for (let index = 0; index < count; index += 1) {
    const z = 112 - index * 23.2;
    const frontage = 15.2 + (index * 17 + seed * 3) % 46 / 10;
    const depth = 6.8 + (index * 11 + seed) % 28 / 10;
    const height = 8.2 + (index * 23 + seed * 7) % 44 / 10;
    const innerX = side * (9.6 + index % 3 * 0.46);
    const centerX = innerX + side * depth / 2;
    bodies.push({ x: centerX, y: height / 2, z, sx: depth, sy: height, sz: frontage });
    podiums.push({ x: centerX, y: 0.28, z, sx: depth + 0.7, sy: 0.56, sz: frontage + 0.7 });
    roofs.push({ x: centerX, y: height + 0.12, z, sx: depth + 0.32, sy: 0.24, sz: frontage + 0.36 });
    facades.push({
      x: innerX - side * 0.018,
      y: height * 0.54,
      z,
      sx: frontage * 0.9,
      sy: height * 0.82,
      ry: -side * Math.PI / 2
    });
    endFacades.push({ x: centerX, y: height * 0.54, z: z - frontage / 2 - 0.018, sx: depth * 0.84, sy: height * 0.78 });
    endFacades.push({ x: centerX, y: height * 0.54, z: z + frontage / 2 + 0.018, sx: depth * 0.84, sy: height * 0.78 });
    for (let column = 0; column < 10; column += 1) {
      mullions.push({
        x: innerX - side * 0.08,
        y: height * 0.54,
        z: z - frontage * 0.405 + column * frontage * 0.09,
        sx: 0.09,
        sy: height * 0.82,
        sz: 0.09
      });
    }
    for (let floor = 0; floor < 6; floor += 1) {
      bands.push({
        x: innerX - side * 0.09,
        y: 1.05 + floor * (height - 1.7) / 5,
        z,
        sx: 0.11,
        sy: 0.09,
        sz: frontage * 0.91
      });
    }
    facadePiers.push({ x: innerX - side * 0.22, y: height * 0.5, z: z - frontage * 0.47, sx: 0.42, sy: height, sz: 0.66 });
    facadePiers.push({ x: innerX - side * 0.22, y: height * 0.5, z: z + frontage * 0.47, sx: 0.42, sy: height, sz: 0.66 });
    balconySlabs.push({ x: innerX - side * 0.48, y: 3.04, z: z + frontage * 0.18, sx: 1.06, sy: 0.16, sz: frontage * 0.28 });
    canopies.push({ x: innerX - side * 0.92, y: 2.74, z: z + frontage * 0.18, sx: 1.92, sy: 0.16, sz: frontage * 0.3 });
    roofBlocks.push({ x: centerX, y: height + 0.72, z: z - frontage * 0.18, sx: depth * 0.42, sy: 1.2, sz: frontage * 0.18 });
    sunStrips.push({ x: innerX - side * 0.12, y: height - 0.3, z, sx: 0.08, sy: 0.055, sz: frontage * 0.82 });
  }
  const bodyMesh = createInstancedObstacleParts(new THREE.BoxGeometry(1, 1, 1), concrete, bodies);
  const podiumMesh = createInstancedObstacleParts(new THREE.BoxGeometry(1, 1, 1), podiumMaterial, podiums);
  const roofMesh = createInstancedObstacleParts(new THREE.BoxGeometry(1, 1, 1), steel, roofs);
  const facadeMesh = createInstancedObstacleParts(new THREE.PlaneGeometry(1, 1), glass, facades);
  const endFacadeMesh = createInstancedObstacleParts(new THREE.PlaneGeometry(1, 1), glass, endFacades);
  const mullionMesh = createInstancedObstacleParts(new THREE.BoxGeometry(1, 1, 1), steel, mullions);
  const bandMesh = createInstancedObstacleParts(new THREE.BoxGeometry(1, 1, 1), steel, bands);
  const canopyMesh = createInstancedObstacleParts(new THREE.BoxGeometry(1, 1, 1), podiumMaterial, canopies);
  const balconyMesh = createInstancedObstacleParts(new THREE.BoxGeometry(1, 1, 1), concrete, balconySlabs);
  const pierMesh = createInstancedObstacleParts(new THREE.BoxGeometry(1, 1, 1), concrete, facadePiers);
  const roofBlockMesh = createInstancedObstacleParts(new THREE.BoxGeometry(1, 1, 1), concrete, roofBlocks);
  const glowMaterial = material(accent, { emissive: accent, emissiveIntensity: 0.16, roughness: 0.3 });
  const stripMesh = createInstancedObstacleParts(new THREE.BoxGeometry(1, 1, 1), glowMaterial, sunStrips);
  [podiumMesh, roofMesh, facadeMesh, endFacadeMesh, mullionMesh, bandMesh, canopyMesh, balconyMesh, pierMesh, roofBlockMesh, stripMesh]
    .forEach((item) => { item.castShadow = false; });
  group.add(bodyMesh, podiumMesh, roofMesh, facadeMesh, endFacadeMesh, mullionMesh, bandMesh, canopyMesh, balconyMesh, pierMesh, roofBlockMesh, stripMesh);
  group.userData.concreteTexture = concreteTexture;
  group.userData.facadeParts = [facadeMesh, endFacadeMesh];
  group.userData.proceduralFacadeGrid = [mullionMesh, bandMesh];
  return group;
}

function createCampusBridgeStairs(side, steel, concrete) {
  const group = new THREE.Group();
  const transforms = [];
  for (let index = 0; index < 18; index += 1) {
    transforms.push({
      x: side * (7.1 + index * 0.31),
      y: 0.17 + index * 0.27,
      z: 0,
      sx: 1,
      sy: 1,
      sz: 1
    });
  }
  const steps = createInstancedObstacleParts(new THREE.BoxGeometry(0.68, 0.22, 2.55), concrete, transforms);
  const bottom = new THREE.Vector3(side * 6.85, 0.72, -1.34);
  const top = new THREE.Vector3(side * 12.45, 5.45, -1.34);
  const outsideBottom = bottom.clone();
  outsideBottom.z = 1.34;
  const outsideTop = top.clone();
  outsideTop.z = 1.34;
  group.add(steps, beamBetween3D(bottom, top, 0.055, steel, 8), beamBetween3D(outsideBottom, outsideTop, 0.055, steel, 8));
  return group;
}

function createCampusGlassElevator(accent) {
  const group = new THREE.Group();
  const steel = material(0x50656f, { roughness: 0.24, metalness: 0.78 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xbce7ee,
    roughness: 0.08,
    metalness: 0.12,
    transmission: 0.2,
    transparent: true,
    opacity: 0.7,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    side: THREE.DoubleSide,
    depthWrite: true
  });
  const shaft = mesh(new THREE.BoxGeometry(3.1, 7.2, 3.25), glass, false, true);
  shaft.position.y = 3.62;
  const posts = createInstancedObstacleParts(new THREE.BoxGeometry(0.11, 7.35, 0.11), steel, [
    { x: -1.5, y: 3.65, z: -1.56 }, { x: -1.5, y: 3.65, z: 1.56 },
    { x: 1.5, y: 3.65, z: -1.56 }, { x: 1.5, y: 3.65, z: 1.56 }
  ]);
  const bands = createInstancedObstacleParts(new THREE.BoxGeometry(3.02, 0.08, 0.1), steel,
    Array.from({ length: 9 }, (_, index) => ({ y: 0.48 + index * 0.82, z: 1.62 }))
      .concat(Array.from({ length: 9 }, (_, index) => ({ y: 0.48 + index * 0.82, z: -1.62 }))));
  const cabin = mesh(new THREE.BoxGeometry(1.86, 2.4, 1.9), material(0xe4f2f2, {
    emissive: accent,
    emissiveIntensity: 0.055,
    roughness: 0.28,
    metalness: 0.16
  }), true, true);
  cabin.position.y = 2.05;
  const cap = mesh(new THREE.BoxGeometry(3.48, 0.22, 3.62), steel, true, true);
  cap.position.y = 7.34;
  group.add(shaft, posts, bands, cabin, cap);
  return group;
}

function createCampusCurvedPavilion(accent) {
  const group = new THREE.Group();
  const steel = material(0x4e616a, { roughness: 0.25, metalness: 0.76 });
  const shell = material(0xe9eeea, { roughness: 0.52, metalness: 0.04, envMapIntensity: 0.66 });
  const stone = material(0xb8c3bf, { roughness: 0.82, metalness: 0.02 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x78b8cb,
    roughness: 0.08,
    metalness: 0.12,
    transmission: 0.28,
    transparent: true,
    opacity: 0.58,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const platform = mesh(new THREE.BoxGeometry(5.4, 0.25, 8.2), stone, false, true);
  platform.position.y = 0.12;
  const canopy = mesh(new THREE.CylinderGeometry(2.62, 2.62, 7.65, 48, 1, true, 0, Math.PI), shell);
  canopy.rotation.x = Math.PI / 2;
  canopy.position.y = 1.48;
  canopy.scale.y = 0.82;
  const ribs = createInstancedObstacleParts(new THREE.TorusGeometry(2.64, 0.055, 8, 40, Math.PI), steel,
    Array.from({ length: 5 }, (_, index) => ({ y: 1.48, z: -3.2 + index * 1.6, sy: 0.82 })));
  const backGlass = mesh(new THREE.PlaneGeometry(7.4, 2.72), glass);
  backGlass.rotation.y = Math.PI / 2;
  backGlass.position.set(2.5, 1.5, 0);
  const frontGlass = backGlass.clone();
  frontGlass.position.x = -2.5;
  const bench = createBench();
  bench.position.set(0, 0.04, 0.65);
  bench.rotation.y = Math.PI;
  const marker = mesh(new THREE.BoxGeometry(1.7, 0.08, 0.08), material(accent, {
    emissive: accent,
    emissiveIntensity: 0.58,
    roughness: 0.2
  }));
  marker.position.set(2.58, 2.28, -2.25);
  group.add(platform, canopy, ribs, backGlass, frontGlass, bench, marker);
  return group;
}

function createCampusGateway(accent) {
  const group = new THREE.Group();
  const steel = material(0x586c75, { roughness: 0.26, metalness: 0.76 });
  const bridgeTexture = makeCampusConcreteTexture(9);
  const concrete = new THREE.MeshStandardMaterial({ map: bridgeTexture, color: 0xe9eeea, roughness: 0.72, metalness: 0.025, envMapIntensity: 0.58 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xa6dbe8,
    roughness: 0.06,
    metalness: 0.1,
    transmission: 0.32,
    transparent: true,
    opacity: 0.48,
    clearcoat: 0.94,
    clearcoatRoughness: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const deck = mesh(new THREE.BoxGeometry(19.25, 0.26, 2.35), concrete, true, true);
  deck.position.y = 5.14;
  const underside = mesh(new THREE.BoxGeometry(19.65, 0.1, 2.52), steel, true, true);
  underside.position.y = 4.96;
  const panes = [
    mesh(new THREE.PlaneGeometry(18.75, 1.18), glass),
    mesh(new THREE.PlaneGeometry(18.75, 1.18), glass)
  ];
  panes[0].position.set(0, 5.83, -1.14);
  panes[1].position.set(0, 5.83, 1.14);
  const posts = createInstancedObstacleParts(new THREE.BoxGeometry(0.08, 1.55, 0.08), steel,
    Array.from({ length: 20 }, (_, index) => ({ x: -9.02 + index * 0.95, y: 5.82, z: -1.17, sy: 0.82 }))
      .concat(Array.from({ length: 20 }, (_, index) => ({ x: -9.02 + index * 0.95, y: 5.82, z: 1.17, sy: 0.82 }))));
  const topRails = createInstancedObstacleParts(new THREE.BoxGeometry(18.9, 0.065, 0.07), steel, [
    { y: 6.43, z: -1.17 }, { y: 6.43, z: 1.17 }
  ]);
  const pillars = createInstancedObstacleParts(new THREE.BoxGeometry(0.42, 4.96, 0.52), concrete, [
    { x: -7.75, y: 2.48 }, { x: 7.75, y: 2.48 }
  ]);
  const lift = createCampusGlassElevator(accent);
  lift.position.set(-8.85, 0, 0.1);
  const stairs = createCampusBridgeStairs(-1, steel, concrete);
  const pavilion = createCampusCurvedPavilion(accent);
  pavilion.position.set(7.18, 0, -4.3);
  pavilion.rotation.y = -0.08;
  const edgeHighlight = mesh(new THREE.BoxGeometry(19.1, 0.045, 0.07), material(accent, {
    emissive: accent,
    emissiveIntensity: 0.36,
    roughness: 0.2
  }));
  edgeHighlight.position.set(0, 4.88, 1.34);
  const landmarkMaterial = () => new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    alphaTest: 0.055,
    depthWrite: true,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const leftLandmark = mesh(new THREE.PlaneGeometry(15.2, 10.13), landmarkMaterial());
  leftLandmark.position.set(-6.05, 5.07, 1.52);
  leftLandmark.renderOrder = 4;
  leftLandmark.frustumCulled = false;
  const rightLandmark = mesh(new THREE.PlaneGeometry(10.4, 6.93), landmarkMaterial());
  rightLandmark.position.set(6.95, 3.47, 1.78);
  rightLandmark.renderOrder = 5;
  rightLandmark.frustumCulled = false;
  group.add(deck, underside, ...panes, posts, topRails, pillars, lift, stairs, pavilion, edgeHighlight, leftLandmark, rightLandmark);
  group.userData.overheadClearance = 4.72;
  group.userData.bridgeTexture = bridgeTexture;
  group.userData.landmarkArt = { left: leftLandmark, right: rightLandmark };
  group.userData.proceduralLandmarks = [lift, stairs, pavilion];
  return group;
}

function createCampusStreetFurniture(side, accent, seed = 0) {
  const group = new THREE.Group();
  const steel = material(0x4f5f65, { roughness: 0.34, metalness: 0.68 });
  const planter = material(0xabb7b1, { roughness: 0.9, metalness: 0.015 });
  const shrub = material(seed % 2 ? 0x4f9156 : 0x5a9d5c, { roughness: 0.96 });
  const blossom = material(seed % 2 ? 0xf3a8c0 : 0xf4c57b, { roughness: 0.86 });
  const lampTransforms = [];
  const armTransforms = [];
  const planterTransforms = [];
  const shrubTransforms = [];
  const blossomTransforms = [];
  const flowerCardTransforms = [];
  for (let index = 0; index < 26; index += 1) {
    const z = 98 - index * 8.8;
    lampTransforms.push({ x: side * 6.96, y: 2.35, z });
    armTransforms.push({ x: side * 6.55, y: 4.35, z, rz: side * Math.PI / 2, sy: 0.92 });
    planterTransforms.push({ x: side * 6.92, y: 0.28, z: z - 2.6, sx: 1.08, sz: 2.3 });
    if (index % 2 === 0) {
      flowerCardTransforms.push({
        x: side * 6.72,
        y: 1.02,
        z: z - 2.58,
        sx: 4.2,
        sy: 2.18,
        ry: side * 0.1
      });
    }
    for (let plant = 0; plant < 5; plant += 1) {
      shrubTransforms.push({
          x: side * (6.62 + plant % 2 * 0.34),
        y: 0.65 + plant % 3 * 0.08,
        z: z - 3.18 + plant * 0.31,
        sx: 0.72,
        sy: 0.56,
        sz: 0.68
      });
      blossomTransforms.push({
          x: side * (6.58 + plant % 3 * 0.24),
        y: 0.92 + plant % 2 * 0.08,
        z: z - 3.05 + plant * 0.27,
        sx: 0.9,
        sy: 0.62,
        sz: 0.9
      });
    }
  }
  const poles = createInstancedObstacleParts(new THREE.CylinderGeometry(0.055, 0.085, 4.55, 9), steel, lampTransforms);
  const arms = createInstancedObstacleParts(new THREE.CylinderGeometry(0.04, 0.05, 0.86, 8), steel, armTransforms);
  const lampMaterial = material(0xfff1c5, { emissive: 0xffd98b, emissiveIntensity: 0.88, roughness: 0.24 });
  const lamps = createInstancedObstacleParts(new THREE.SphereGeometry(0.12, 10, 7), lampMaterial,
    lampTransforms.map((entry) => ({ x: entry.x - side * 0.8, y: 4.35, z: entry.z, sx: 1.4, sy: 0.72, sz: 1.1 })));
  const planters = createInstancedObstacleParts(new THREE.BoxGeometry(1.45, 0.56, 1.4), planter, planterTransforms);
  const shrubs = createInstancedObstacleParts(new THREE.SphereGeometry(0.52, 10, 7), shrub, shrubTransforms);
  const blossoms = createInstancedObstacleParts(new THREE.SphereGeometry(0.085, 8, 6), blossom, blossomTransforms);
  const flowerCards = createInstancedObstacleParts(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({
    map: makeCampusLeafTexture(),
    color: 0xf4ffd9,
    transparent: true,
    alphaTest: 0.1,
    depthWrite: true,
    side: THREE.DoubleSide,
    roughness: 0.94,
    metalness: 0
  }), flowerCardTransforms);
  flowerCards.castShadow = false;
  [poles, arms, lamps, planters, shrubs, blossoms].forEach((item) => { item.castShadow = false; });
  group.add(poles, arms, lamps, planters, shrubs, blossoms, flowerCards);
  group.userData.lamps = lamps;
  group.userData.baseEmissive = 0.88;
  group.userData.flowerCards = flowerCards;
  group.userData.proceduralFlowerbed = [shrubs, blossoms];
  return group;
}

function createCampusDistantCity(accent) {
  const group = new THREE.Group();
  const buildingCount = 30;
  const concrete = material(0xc6d6d8, { roughness: 0.72, metalness: 0.05 });
  const glass = material(0x7fb4c8, { roughness: 0.2, metalness: 0.18 });
  const buildings = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), concrete, buildingCount);
  const facades = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), glass, buildingCount);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  for (let index = 0; index < buildingCount; index += 1) {
    const side = index % 2 ? 1 : -1;
    const row = Math.floor(index / 2);
    const width = 3.8 + (index * 13 % 28) / 10;
    const height = 8 + (index * 29 % 85) / 10;
    const depth = 4.5 + (index * 17 % 34) / 10;
    const x = side * (16 + (index * 7 % 9));
    const z = 36 - row * 10.5;
    matrix.compose(new THREE.Vector3(x, height / 2, z), quaternion, new THREE.Vector3(width, height, depth));
    buildings.setMatrixAt(index, matrix);
    matrix.compose(new THREE.Vector3(x - side * (width / 2 + 0.08), height * 0.54, z), quaternion,
      new THREE.Vector3(0.1, height * 0.74, depth * 0.82));
    facades.setMatrixAt(index, matrix);
  }
  buildings.instanceMatrix.needsUpdate = true;
  facades.instanceMatrix.needsUpdate = true;
  const horizonGlow = mesh(new THREE.PlaneGeometry(34, 14), new THREE.MeshBasicMaterial({
    color: new THREE.Color(accent).lerp(new THREE.Color(0xffffff), 0.82),
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    fog: false,
    toneMapped: false
  }));
  horizonGlow.position.set(0, 7, -72);
  group.add(buildings, facades, horizonGlow);
  return group;
}

function makeCampusToonBrickTexture() {
  if (campusToonBrickTexture) return campusToonBrickTexture;
  campusToonBrickTexture = canvasTexture(256, 512, (context, width, height) => {
    const wash = context.createLinearGradient(0, 0, width, height);
    wash.addColorStop(0, "#b8c2bc");
    wash.addColorStop(0.5, "#9eaaa7");
    wash.addColorStop(1, "#829596");
    context.fillStyle = wash;
    context.fillRect(0, 0, width, height);
    for (let row = 0; row < 16; row += 1) {
      const y = row * 32;
      const offset = row % 2 ? 32 : 0;
      context.strokeStyle = "rgba(52,72,75,.25)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
      for (let x = -offset; x < width; x += 64) {
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x, y + 32);
        context.stroke();
      }
    }
    const wet = context.createLinearGradient(0, 0, width, 0);
    wet.addColorStop(0, "rgba(206,238,223,0)");
    wet.addColorStop(0.42, "rgba(206,238,223,.2)");
    wet.addColorStop(0.58, "rgba(255,236,190,.12)");
    wet.addColorStop(1, "rgba(206,238,223,0)");
    context.fillStyle = wet;
    context.fillRect(0, 0, width, height);
  });
  campusToonBrickTexture.wrapS = THREE.RepeatWrapping;
  campusToonBrickTexture.wrapT = THREE.RepeatWrapping;
  campusToonBrickTexture.repeat.set(2.4, 28);
  campusToonBrickTexture.anisotropy = 4;
  SHARED_TEXTURES.add(campusToonBrickTexture);
  return campusToonBrickTexture;
}

function makeCampusToonPuddleTexture() {
  if (campusToonPuddleTexture) return campusToonPuddleTexture;
  campusToonPuddleTexture = canvasTexture(128, 64, (context, width, height) => {
    context.clearRect(0, 0, width, height);
    const water = context.createRadialGradient(width / 2, height / 2, 2, width / 2, height / 2, width * 0.46);
    water.addColorStop(0, "rgba(228,247,239,.46)");
    water.addColorStop(0.55, "rgba(116,166,166,.28)");
    water.addColorStop(0.86, "rgba(48,84,86,.12)");
    water.addColorStop(1, "rgba(48,84,86,0)");
    context.fillStyle = water;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(255,238,192,.38)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.ellipse(width * 0.43, height * 0.42, width * 0.24, height * 0.16, -0.12, 0, Math.PI * 2);
    context.stroke();
  });
  SHARED_TEXTURES.add(campusToonPuddleTexture);
  return campusToonPuddleTexture;
}

function createCampusInstancedBatch(geometry, batchMaterial, transforms, colors = null) {
  const batch = createInstancedObstacleParts(geometry, batchMaterial, transforms);
  batch.castShadow = false;
  batch.receiveShadow = false;
  batch.frustumCulled = true;
  if (colors?.length) {
    transforms.forEach((_, index) => batch.setColorAt(index, new THREE.Color(colors[index % colors.length])));
    batch.instanceColor.needsUpdate = true;
  }
  return batch;
}

function createCampusToonSurfaceRibbon() {
  const group = new THREE.Group();
  const brickTexture = makeCampusToonBrickTexture();
  const brick = campusToonMaterial(0xb9aca1, { map: brickTexture, name: "campus-wet-brick-atlas" });
  const lawn = campusToonMaterial(0x4e7655, { emissive: 0x10261a, emissiveIntensity: 0.1, name: "campus-baked-verge" });
  const curb = campusToonMaterial(0xbec9c2, { name: "campus-curb-toon" });
  const curbInk = new THREE.MeshBasicMaterial({ color: 0x34494a, toneMapped: false });
  [-1, 1].forEach((side) => {
    const sidewalk = mesh(new THREE.PlaneGeometry(3.35, 230), brick);
    sidewalk.rotation.x = -Math.PI / 2;
    sidewalk.position.set(side * 6.1, 0.045, -99);
    const verge = mesh(new THREE.PlaneGeometry(12.8, 230), lawn);
    verge.rotation.x = -Math.PI / 2;
    verge.position.set(side * 14.05, -0.025, -99);
    const curbTop = mesh(new THREE.BoxGeometry(0.28, 0.25, 230), curb);
    curbTop.position.set(side * 4.55, 0.105, -99);
    const inkLine = mesh(new THREE.BoxGeometry(0.055, 0.04, 230), curbInk);
    inkLine.position.set(side * 4.39, 0.245, -99);
    group.add(sidewalk, verge, curbTop, inkLine);
  });
  const puddleTransforms = Array.from({ length: 24 }, (_, index) => ({
    x: (index % 2 ? 1 : -1) * (4.9 + index % 4 * 0.62),
    y: 0.068,
    z: 8 - index * 8.6,
    sx: 1.15 + index % 3 * 0.38,
    sy: 0.54 + index % 4 * 0.11,
    rz: index % 2 ? 0.16 : -0.12,
    rx: -Math.PI / 2
  }));
  const puddleMaterial = new THREE.MeshBasicMaterial({
    map: makeCampusToonPuddleTexture(),
    color: 0xdaf4ef,
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide
  });
  const puddles = createCampusInstancedBatch(new THREE.PlaneGeometry(1.7, 0.84), puddleMaterial, puddleTransforms);
  puddles.renderOrder = 2;
  group.add(puddles);
  group.userData.puddles = puddles;
  group.userData.scrollTextures = (distance) => {
    brickTexture.offset.y = distance * WORLD_Z_SCALE / 230 * brickTexture.repeat.y;
  };
  return group;
}

function createCampusToonBuildingRow(side, seed = 0) {
  const group = new THREE.Group();
  const bodies = [];
  const facadeTransforms = [];
  const roofs = [];
  const windowBands = [];
  const windowLights = [];
  const mullions = [];
  const arcadeRoofs = [];
  const arcadeColumns = [];
  const inkEdges = [];
  const bodyColors = [0xd8ddd5, 0xc7d0cb, 0xe1ded2];
  for (let index = 0; index < 10; index += 1) {
    const z = 102 - index * 22.4;
    const height = 6.3 + (index * 7 + seed) % 4 * 0.72;
    const frontage = 13.5 + (index + seed) % 3 * 2.2;
    const depth = 6.4 + (index * 5 + seed) % 3 * 0.72;
    const innerFace = 9.15 + index % 2 * 0.24;
    const centerX = side * (innerFace + depth / 2);
    bodies.push({ x: centerX, y: height / 2, z, sx: depth, sy: height, sz: frontage });
    facadeTransforms.push({
      x: side * (innerFace - 0.018),
      y: height * 0.5,
      z,
      sx: frontage,
      sy: height,
      ry: -side * Math.PI / 2
    });
    facadeTransforms.push({
      x: centerX,
      y: height * 0.5,
      z: z + frontage * 0.5 + 0.018,
      sx: depth,
      sy: height
    });
    roofs.push({ x: centerX, y: height + 0.14, z, sx: depth + 0.36, sy: 0.28, sz: frontage + 0.42 });
    inkEdges.push({ x: side * (innerFace - 0.08), y: height - 0.1, z, sx: 0.12, sy: 0.16, sz: frontage + 0.2 });
    for (let floor = 0; floor < 4; floor += 1) {
      const y = 1.18 + floor * (height - 1.68) / 3;
      windowBands.push({ x: side * (innerFace - 0.055), y, z, sx: 0.1, sy: 0.82, sz: frontage * 0.83 });
      if ((index + floor + seed) % 5 === 1) {
        windowLights.push({ x: side * (innerFace - 0.11), y, z: z - frontage * 0.18, sx: 0.12, sy: 0.55, sz: frontage * 0.18 });
      }
    }
    for (let bay = -3; bay <= 3; bay += 1) {
      mullions.push({ x: side * (innerFace - 0.12), y: height * 0.51, z: z + bay * frontage * 0.105, sx: 0.14, sy: height * 0.74, sz: 0.055 });
    }
    arcadeRoofs.push({ x: side * 7.96, y: 3.2, z, sx: 2.2, sy: 0.2, sz: frontage + 0.4 });
    for (let bay = -3; bay <= 3; bay += 1) {
      arcadeColumns.push({ x: side * 7.2, y: 1.58, z: z + bay * frontage / 7, sx: 0.22, sy: 3.16, sz: 0.22 });
    }
  }
  const bodyBatch = createCampusInstancedBatch(new THREE.BoxGeometry(1, 1, 1), campusToonMaterial(0xd6ddd7, { name: "campus-classroom-walls" }), bodies, bodyColors);
  const facadeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, side: THREE.DoubleSide });
  const facadeBatch = createCampusInstancedBatch(new THREE.PlaneGeometry(1, 1), facadeMaterial, facadeTransforms);
  facadeBatch.visible = false;
  const roofBatch = createCampusInstancedBatch(new THREE.BoxGeometry(1, 1, 1), campusToonMaterial(0x506469, { name: "campus-slate-eaves" }), roofs);
  const windowBatch = createCampusInstancedBatch(new THREE.BoxGeometry(1, 1, 1), campusToonMaterial(0x7eabb2, { emissive: 0x143b43, emissiveIntensity: 0.16, name: "campus-window-bands" }), windowBands, [0x7eabb2, 0x97bfc0, 0x658f9a]);
  const litBatch = createCampusInstancedBatch(new THREE.BoxGeometry(1, 1, 1), campusToonMaterial(0xffdaa0, { emissive: 0xffb85e, emissiveIntensity: 0.5, name: "campus-window-warmth" }), windowLights);
  const mullionBatch = createCampusInstancedBatch(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x30484c, toneMapped: false }), mullions);
  const arcadeRoofBatch = createCampusInstancedBatch(new THREE.BoxGeometry(1, 1, 1), campusToonMaterial(0xb8c3bd, { name: "campus-rain-arcade-roof" }), arcadeRoofs);
  const columnBatch = createCampusInstancedBatch(new THREE.BoxGeometry(1, 1, 1), campusToonMaterial(0xe2e2d7, { name: "campus-rain-arcade-columns" }), arcadeColumns);
  const inkBatch = createCampusInstancedBatch(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x2d4144, toneMapped: false }), inkEdges);
  group.add(bodyBatch, facadeBatch, roofBatch, windowBatch, litBatch, mullionBatch, arcadeRoofBatch, columnBatch, inkBatch);
  group.userData.windowLights = litBatch;
  group.userData.facadeParts = [facadeBatch];
  group.userData.proceduralFacadeGrid = [windowBatch, litBatch, mullionBatch];
  return group;
}

function createCampusToonTreeAvenue(side, seed = 0) {
  const group = new THREE.Group();
  const trunks = [];
  const branches = [];
  const crowns = [];
  const outlines = [];
  const foliageFront = [];
  const foliageCross = [];
  const flowerTransforms = [];
  const crownColors = [0x5d8f58, 0x739f61, 0x88aa65, 0xa6bd72];
  for (let index = 0; index < 15; index += 1) {
    const z = 106 - index * 15.4;
    const x = side * (7.45 + (index % 3 - 1) * 0.34);
    const height = 4.8 + (index * 11 + seed) % 8 * 0.14;
    trunks.push({ x, y: height * 0.48, z, sx: 0.72, sy: height / 3.7, sz: 0.7 });
    branches.push({ x: x - side * 0.42, y: height * 0.78, z, rz: side * 0.62, sy: 1.12, sx: 0.62, sz: 0.62 });
    branches.push({ x: x + side * 0.36, y: height * 0.84, z: z - 0.15, rz: side * -0.55, sy: 0.94, sx: 0.56, sz: 0.56 });
    const lobes = [
      [-side * 0.82, 0.95, 0.15, 1.82, 1.34, 1.48],
      [-side * 0.08, 1.35, -0.2, 1.72, 1.28, 1.4],
      [side * 0.72, 0.9, 0.28, 1.62, 1.18, 1.32]
    ];
    lobes.forEach(([dx, dy, dz, sx, sy, sz], lobeIndex) => {
      const entry = { x: x + dx, y: height + dy, z: z + dz, sx, sy, sz, ry: side * (lobeIndex - 1.5) * 0.16 };
      crowns.push(entry);
      outlines.push({ ...entry, sx: sx * 1.055, sy: sy * 1.055, sz: sz * 1.055 });
    });
    const cardWidth = 6.2 + (index + seed) % 3 * 0.45;
    const cardHeight = 6.1 + (index * 3 + seed) % 4 * 0.34;
    foliageFront.push({ x: x - side * 0.16, y: height + 1.46, z, sx: cardWidth, sy: cardHeight });
    foliageCross.push({
      x: x + side * 0.18,
      y: height + 1.34,
      z: z - 0.2,
      sx: cardWidth * 0.92,
      sy: cardHeight * 0.92,
      ry: side * 0.48
    });
    if (index % 2 === 0) flowerTransforms.push({
      x: side * 6.6,
      y: 0.68,
      z: z - 4.2,
      sx: 2.7,
      sy: 1.35,
      ry: side * 0.16
    });
  }
  const trunkGeometry = new THREE.CylinderGeometry(0.25, 0.39, 3.7, 8);
  const branchGeometry = new THREE.CylinderGeometry(0.12, 0.2, 2.35, 7);
  const crownGeometry = new THREE.IcosahedronGeometry(1, 1);
  const trunkBatch = createCampusInstancedBatch(trunkGeometry, campusToonMaterial(0x765746, { name: "campus-camphor-bark" }), trunks, [0x765746, 0x654b40, 0x87614a]);
  const branchBatch = createCampusInstancedBatch(branchGeometry, campusToonMaterial(0x6a5042, { name: "campus-camphor-branches" }), branches);
  const outlineBatch = createCampusInstancedBatch(crownGeometry, campusInkMaterial(0x183d31, 0.9), outlines);
  outlineBatch.renderOrder = -1;
  const crownBatch = createCampusInstancedBatch(crownGeometry, campusToonMaterial(0x4f8950, { name: "campus-camphor-crowns" }), crowns, crownColors);
  const foliageMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    alphaTest: 0.12,
    depthWrite: true,
    toneMapped: false,
    side: THREE.DoubleSide
  });
  const foliageFrontBatch = createCampusInstancedBatch(new THREE.PlaneGeometry(1, 1), foliageMaterial, foliageFront);
  const foliageCrossBatch = createCampusInstancedBatch(new THREE.PlaneGeometry(1, 1), foliageMaterial, foliageCross);
  foliageFrontBatch.visible = false;
  foliageCrossBatch.visible = false;
  const flowerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    alphaTest: 0.1,
    depthWrite: true,
    toneMapped: false,
    side: THREE.DoubleSide
  });
  const flowerBatch = createCampusInstancedBatch(new THREE.PlaneGeometry(1, 1), flowerMaterial, flowerTransforms);
  flowerBatch.visible = false;
  const shadow = createSoftGroundShadow(7.8, 220, 0.14);
  shadow.position.set(side * 6.55, 0.012, -3.5);
  group.add(shadow, trunkBatch, branchBatch, outlineBatch, crownBatch, foliageFrontBatch, foliageCrossBatch, flowerBatch);
  group.userData.canopy = crownBatch;
  group.userData.foliageCards = [foliageFrontBatch, foliageCrossBatch];
  group.userData.flowerCards = flowerBatch;
  group.userData.proceduralCanopy = [outlineBatch, crownBatch];
  group.userData.swayPhase = seed * 0.7;
  return group;
}

function createCampusToonStreetDetails(side, seed = 0) {
  const group = new THREE.Group();
  const poles = [];
  const arms = [];
  const lamps = [];
  const benches = [];
  const bikeLoops = [];
  for (let index = 0; index < 18; index += 1) {
    const z = 92 - index * 12.2;
    const x = side * 5.7;
    poles.push({ x, y: 2.05, z, sy: 1.08 });
    arms.push({ x: x - side * 0.34, y: 3.84, z, rz: side * 0.78 });
    lamps.push({ x: x - side * 0.67, y: 4.08, z, sx: 1.25, sy: 0.7, sz: 1.1 });
    if ((index + seed) % 3 === 1) benches.push({ x: side * 6.3, y: 0.43, z: z - 3.8, sx: 1.65, sy: 0.22, sz: 0.52 });
    if ((index + seed) % 4 === 2) {
      for (let loop = 0; loop < 3; loop += 1) bikeLoops.push({ x: side * (6.15 + loop * 0.34), y: 0.54, z: z + 2.1, ry: Math.PI / 2 });
    }
  }
  const metal = campusToonMaterial(0x4b6065, { name: "campus-painted-metal" });
  const lamp = campusToonMaterial(0xffe5a7, { emissive: 0xffc66b, emissiveIntensity: 0.76, name: "campus-lamp-warm" });
  const polesBatch = createCampusInstancedBatch(new THREE.CylinderGeometry(0.06, 0.085, 3.8, 8), metal, poles);
  const armsBatch = createCampusInstancedBatch(new THREE.CylinderGeometry(0.04, 0.05, 0.88, 7), metal, arms);
  const lampBatch = createCampusInstancedBatch(new THREE.SphereGeometry(0.12, 8, 6), lamp, lamps);
  const benchBatch = createCampusInstancedBatch(new THREE.BoxGeometry(1, 1, 1), campusToonMaterial(0x9d7656, { name: "campus-wood-benches" }), benches);
  const bikeBatch = createCampusInstancedBatch(new THREE.TorusGeometry(0.42, 0.045, 6, 18), metal, bikeLoops);
  group.add(polesBatch, armsBatch, lampBatch, benchBatch, bikeBatch);
  group.userData.lamps = lampBatch;
  group.userData.baseEmissive = 0.76;
  return group;
}

function makeCampusWorldSignTexture(title, subtitle, accent = "#f27b69") {
  const texture = canvasTexture(512, 192, (context, width, height) => {
    context.fillStyle = "#314649";
    context.fillRect(0, 0, width, height);
    context.fillStyle = accent;
    context.fillRect(0, 0, 14, height);
    context.fillStyle = "#fff3dc";
    context.font = "700 62px system-ui, sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(title, 42, 76);
    context.fillStyle = "rgba(228,241,232,.78)";
    context.font = "500 25px system-ui, sans-serif";
    context.fillText(subtitle, 44, 138);
  });
  SHARED_TEXTURES.add(texture);
  return texture;
}

function createCampusArcadeLandmark() {
  const group = new THREE.Group();
  const wall = campusToonMaterial(0xe4e6df, { name: "campus-old-arcade-wall" });
  const frame = campusToonMaterial(0x526c72, { name: "campus-glass-frame" });
  const ink = new THREE.MeshBasicMaterial({ color: 0x31494e, toneMapped: false });
  const glass = campusToonMaterial(0xaedbe2, { emissive: 0x1d6472, emissiveIntensity: 0.14, name: "campus-clear-glass" });
  glass.transparent = true;
  glass.opacity = 0.72;

  const elevatorCore = mesh(new THREE.BoxGeometry(2.42, 7.25, 2.4), glass);
  elevatorCore.position.set(-7.72, 3.62, -4.1);
  const elevatorFrames = createCampusInstancedBatch(new THREE.BoxGeometry(0.12, 1, 0.12), frame, [
    ...[-1, 1].flatMap((xSign) => [-1, 1].map((zSign) => ({ x: -7.72 + xSign * 1.18, y: 3.62, z: -4.1 + zSign * 1.16, sy: 7.38 }))),
    ...[0.12, 2.18, 4.24, 6.3].flatMap((y) => [-1, 1].map((zSign) => ({ x: -7.72, y, z: -4.1 + zSign * 1.19, sx: 2.4, sy: 0.12 })))
  ]);
  const elevatorDoor = mesh(new THREE.BoxGeometry(1.32, 2.25, 0.08), campusToonMaterial(0x6ea9b6, { emissive: 0x153f49, emissiveIntensity: 0.12 }));
  elevatorDoor.position.set(-7.72, 1.18, -2.86);

  const stairSteps = createCampusInstancedBatch(new THREE.BoxGeometry(1, 1, 1), wall,
    Array.from({ length: 15 }, (_, index) => ({
      x: -9.1 + index * 0.245,
      y: 0.12 + index * 0.245,
      z: -0.92,
      sx: 0.31,
      sy: 0.24,
      sz: 2.15
    })));
  const stairRails = createCampusInstancedBatch(new THREE.CylinderGeometry(0.035, 0.045, 4.25, 8), frame, [
    { x: -7.35, y: 2.0, z: 0.2, rz: -0.78 }, { x: -7.35, y: 2.0, z: -2.04, rz: -0.78 }
  ]);

  const bridgeFloor = mesh(new THREE.BoxGeometry(14.6, 0.34, 2.15), campusToonMaterial(0xcbd6d4));
  bridgeFloor.position.set(0, 4.02, -4.0);
  const bridgeGlass = createCampusInstancedBatch(new THREE.BoxGeometry(14.4, 1.18, 0.08), glass, [
    { x: 0, y: 4.78, z: -2.94 }, { x: 0, y: 4.78, z: -5.06 }
  ]);
  const bridgePosts = createCampusInstancedBatch(new THREE.BoxGeometry(0.08, 1.36, 0.1), frame,
    [-1, 1].flatMap((zSign) => Array.from({ length: 11 }, (_, index) => ({
      x: -7.0 + index * 1.4,
      y: 4.78,
      z: -4.0 + zSign * 1.07
    }))));
  const bridgeCap = createCampusInstancedBatch(new THREE.BoxGeometry(14.6, 0.09, 0.12), frame, [
    { x: 0, y: 5.41, z: -2.94 }, { x: 0, y: 5.41, z: -5.06 }
  ]);

  const shelterGlass = mesh(new THREE.BoxGeometry(3.7, 2.7, 6.2), glass);
  shelterGlass.position.set(7.25, 1.38, -3.25);
  const shelterFrames = createCampusInstancedBatch(new THREE.BoxGeometry(0.08, 2.78, 0.1), frame,
    [-1, 1].flatMap((xSign) => [-5.9, -3.95, -2.0, -0.15].map((z) => ({ x: 7.25 + xSign * 1.78, y: 1.4, z }))));
  const shelterArches = createCampusInstancedBatch(new THREE.TorusGeometry(1.92, 0.11, 8, 28, Math.PI), frame,
    [-5.95, -4.0, -2.05, -0.1].map((z) => ({ x: 7.25, y: 2.72, z, sx: 1, sy: 0.62 })));
  const shelterRoof = mesh(new THREE.BoxGeometry(3.86, 0.13, 6.34), campusToonMaterial(0x69878c));
  shelterRoof.position.set(7.25, 3.82, -3.02);
  const planterBases = createCampusInstancedBatch(new THREE.BoxGeometry(2.7, 0.58, 0.72), campusToonMaterial(0x7c8785), [
    { x: -6.18, y: 0.29, z: 2.15 }, { x: 6.3, y: 0.29, z: 1.5 }
  ]);
  const flowerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    alphaTest: 0.1,
    depthWrite: true,
    toneMapped: false,
    side: THREE.DoubleSide
  });
  const flowerCards = createCampusInstancedBatch(new THREE.PlaneGeometry(1, 1), flowerMaterial, [
    { x: -6.18, y: 0.86, z: 2.5, sx: 3.2, sy: 1.45 },
    { x: 6.3, y: 0.86, z: 1.85, sx: 3.2, sy: 1.45 }
  ]);
  flowerCards.visible = false;

  const signMaterial = new THREE.MeshBasicMaterial({ map: makeCampusWorldSignTexture("西区教学楼", "雨廊 · 放学以后"), toneMapped: false });
  const sign = mesh(new THREE.PlaneGeometry(3.2, 1.2), signMaterial);
  sign.position.set(-5.05, 2.8, -1.9);
  sign.rotation.y = Math.PI / 2;
  group.add(
    elevatorCore, elevatorFrames, elevatorDoor, stairSteps, stairRails,
    bridgeFloor, bridgeGlass, bridgePosts, bridgeCap,
    shelterGlass, shelterFrames, shelterArches, shelterRoof, planterBases, flowerCards, sign
  );
  group.userData.flowerCards = flowerCards;
  group.userData.phaseName = "rain-arcade";
  return group;
}

function createCampusVendingLandmark() {
  const group = new THREE.Group();
  const shell = campusToonMaterial(0xe8e6d8, { name: "campus-vending-shell" });
  const cold = campusToonMaterial(0x9de4e0, { emissive: 0x67dfdc, emissiveIntensity: 0.92, name: "campus-vending-cool-light" });
  const ink = new THREE.MeshBasicMaterial({ color: 0x294247, toneMapped: false });
  const body = mesh(new THREE.BoxGeometry(1.6, 2.9, 0.92), shell);
  body.position.set(6.22, 1.45, 0);
  const display = mesh(new THREE.BoxGeometry(1.32, 1.65, 0.08), cold);
  display.position.set(6.22, 1.83, 0.49);
  const slots = createCampusInstancedBatch(new THREE.BoxGeometry(0.3, 0.22, 0.06), campusToonMaterial(0xffd594, { emissive: 0xffbb63, emissiveIntensity: 0.35 }),
    Array.from({ length: 9 }, (_, index) => ({ x: 5.78 + index % 3 * 0.44, y: 1.42 + Math.floor(index / 3) * 0.44, z: 0.55 })));
  const base = mesh(new THREE.BoxGeometry(1.72, 0.12, 1.05), ink);
  base.position.set(6.22, 0.06, 0);
  const coolHalo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeParticleTexture(), color: 0xa9f2e8, transparent: true, opacity: 0.34,
    depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false
  }));
  coolHalo.position.set(6.1, 1.65, 0.75);
  coolHalo.scale.set(3.7, 4.6, 1);
  const shelterRoof = mesh(new THREE.BoxGeometry(3.8, 0.16, 1.85), campusToonMaterial(0x5b7776));
  shelterRoof.position.set(5.62, 3.25, -0.1);
  shelterRoof.rotation.z = -0.08;
  const shelterPosts = createCampusInstancedBatch(new THREE.CylinderGeometry(0.055, 0.07, 3.15, 8), campusToonMaterial(0x405a5d), [
    { x: 4.18, y: 1.57, z: -0.68 }, { x: 7.05, y: 1.57, z: -0.68 }
  ]);
  group.add(coolHalo, body, display, slots, base, shelterRoof, shelterPosts);
  group.userData.coolHalo = coolHalo;
  group.userData.phaseName = "camphor-vending-light";
  return group;
}

function createCampusLibraryCrossingLandmark() {
  const group = new THREE.Group();
  const stone = campusToonMaterial(0xd8d8ca, { name: "campus-library-stone" });
  const shadow = campusToonMaterial(0x58696b, { name: "campus-library-slate" });
  const glass = campusToonMaterial(0x7fa7ad, { emissive: 0x173a43, emissiveIntensity: 0.13, name: "campus-library-glass" });
  glass.transparent = true;
  glass.opacity = 0.88;
  const ink = new THREE.MeshBasicMaterial({ color: 0x263d41, toneMapped: false });
  const leftWing = mesh(new THREE.BoxGeometry(4.8, 6.5, 4.2), stone);
  leftWing.position.set(-7.05, 3.25, 0);
  const rightWing = mesh(new THREE.BoxGeometry(4.8, 6.5, 4.2), stone);
  rightWing.position.set(7.05, 3.25, 0);
  const wingWindows = createCampusInstancedBatch(new THREE.BoxGeometry(0.92, 1.02, 0.08), glass, [
    ...[-1, 1].flatMap((side) => [0, 1, 2, 3].flatMap((floor) => [-1, 1].map((bay) => ({
      x: side * 7.05 + bay * 1.12,
      y: 1.12 + floor * 1.38,
      z: 2.14
    }))))
  ]);
  const wingBands = createCampusInstancedBatch(new THREE.BoxGeometry(4.95, 0.12, 0.1), shadow, [
    ...[-1, 1].flatMap((side) => [1.78, 3.16, 4.54, 5.92].map((y) => ({ x: side * 7.05, y, z: 2.2 })))
  ]);
  const bridge = mesh(new THREE.BoxGeometry(9.4, 1.08, 2.1), glass);
  bridge.position.set(0, 5.4, 0);
  const bridgeMullions = createCampusInstancedBatch(new THREE.BoxGeometry(0.08, 1.15, 0.08), ink,
    Array.from({ length: 9 }, (_, index) => ({ x: -4.25 + index * 1.06, y: 5.4, z: 1.08 })));
  const bridgeRoof = mesh(new THREE.BoxGeometry(9.8, 0.22, 2.36), shadow);
  bridgeRoof.position.set(0, 6.02, 0);
  const clockTower = mesh(new THREE.BoxGeometry(2.65, 8.8, 2.65), stone);
  clockTower.position.set(-7.05, 7.35, 0);
  const clockOutline = mesh(new THREE.TorusGeometry(0.82, 0.1, 8, 32), ink);
  clockOutline.position.set(-7.05, 8.35, 2.72);
  const clockFace = mesh(new THREE.CircleGeometry(0.75, 32), new THREE.MeshBasicMaterial({ color: 0xffefd0, toneMapped: false }));
  clockFace.position.set(-7.05, 8.35, 2.73);
  const handMaterial = new THREE.MeshBasicMaterial({ color: 0x354549, toneMapped: false });
  const hourHand = mesh(new THREE.BoxGeometry(0.055, 0.43, 0.04), handMaterial);
  hourHand.position.set(-7.05, 8.54, 2.77);
  hourHand.rotation.z = -0.42;
  const minuteHand = mesh(new THREE.BoxGeometry(0.05, 0.58, 0.04), handMaterial);
  minuteHand.position.set(-6.82, 8.35, 2.78);
  minuteHand.rotation.z = Math.PI / 2;
  const signalPole = mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.8, 8), shadow);
  signalPole.position.set(5.0, 1.9, 2.25);
  const redSignal = mesh(new THREE.SphereGeometry(0.18, 10, 7), campusToonMaterial(0xf36f63, { emissive: 0xf34e46, emissiveIntensity: 1.2 }));
  redSignal.position.set(5.0, 3.45, 2.25);
  const sign = mesh(new THREE.PlaneGeometry(3.7, 1.38), new THREE.MeshBasicMaterial({
    map: makeCampusWorldSignTexture("图书馆路口", "钟楼 · 17:16", "#f3ad5e"), toneMapped: false
  }));
  sign.position.set(0, 5.38, 1.1);
  group.add(leftWing, rightWing, wingWindows, wingBands, bridge, bridgeMullions, bridgeRoof, clockTower, clockOutline, clockFace, hourHand, minuteHand, signalPole, redSignal, sign);
  group.userData.redSignal = redSignal;
  group.userData.phaseName = "library-clock-crossing";
  return group;
}

function createCampusNarrativeLandmarks() {
  const root = new THREE.Group();
  const phaseGroups = [createCampusArcadeLandmark(), createCampusVendingLandmark(), createCampusLibraryCrossingLandmark()];
  phaseGroups.forEach((phaseGroup, index) => {
    phaseGroup.visible = index === 0;
    root.add(phaseGroup);
  });
  root.userData.phaseGroups = phaseGroups;
  root.userData.narrativeFlowerCards = phaseGroups.map((phaseGroup) => phaseGroup.userData.flowerCards).filter(Boolean);
  root.userData.setPhase = (phaseIndex) => {
    phaseGroups.forEach((phaseGroup, index) => { phaseGroup.visible = index === phaseIndex; });
  };
  return root;
}

function createCampusToonHorizon() {
  const group = new THREE.Group();
  const silhouettes = [];
  const rooftops = [];
  for (let index = 0; index < 28; index += 1) {
    const side = index % 2 ? 1 : -1;
    const row = Math.floor(index / 2);
    const width = 4.5 + index % 4 * 0.8;
    const height = 5.5 + (index * 5) % 7 * 0.72;
    const depth = 5 + index % 3 * 0.9;
    const x = side * (14 + index % 5 * 1.7);
    const z = 18 - row * 11.5;
    silhouettes.push({ x, y: height / 2, z, sx: width, sy: height, sz: depth });
    rooftops.push({ x, y: height + 0.2, z, sx: width + 0.3, sy: 0.4, sz: depth + 0.3 });
  }
  const buildings = createCampusInstancedBatch(new THREE.BoxGeometry(1, 1, 1), campusToonMaterial(0x9fafaa, { name: "campus-depth-buildings" }), silhouettes, [0x9fafaa, 0xaeb9b0, 0x899d9d]);
  const roofBatch = createCampusInstancedBatch(new THREE.BoxGeometry(1, 1, 1), campusToonMaterial(0x536a6e), rooftops);
  const haze = mesh(new THREE.PlaneGeometry(54, 17), new THREE.MeshBasicMaterial({
    color: 0xe7dfc5, transparent: true, opacity: 0.18, depthWrite: false, fog: false, toneMapped: false
  }));
  haze.position.set(0, 7.5, -78);
  group.add(buildings, roofBatch, haze);
  return group;
}

function createRainCampusWorld(config) {
  const root = createWorldRoot(config);
  root.name = "world-rain-campus-ink-toon";
  root.userData.fullThreeDimensional = true;
  root.userData.renderStyle = "ink-toon-baked";

  const surface = createCampusToonSurfaceRibbon();
  root.add(surface);
  const clouds = createCampusCloudField();
  root.userData.campusCloudField = clouds;
  root.userData.layers[0].group.add(clouds);

  const horizon = createCampusToonHorizon();
  addWorldScenery(root, 0, horizon, {
    side: 0,
    x: 0,
    z: -108,
    span: 214,
    parallax: 0.26,
    nearLimit: 10,
    depthCull: false
  });

  [-1, 1].forEach((side) => {
    const buildings = createCampusToonBuildingRow(side, side < 0 ? 1 : 4);
    buildings.userData.campusPhaseMask = [0, 1, 2];
    addWorldScenery(root, 1, buildings, {
      side: 0,
      x: 0,
      z: -70,
      span: 148,
      parallax: 1,
      nearLimit: 13,
      depthCull: false
    });

    const trees = createCampusToonTreeAvenue(side, side < 0 ? 2 : 5);
    trees.userData.campusPhaseMask = [0, 1];
    addWorldScenery(root, 2, trees, {
      side: 0,
      x: 0,
      z: -54,
      span: 118,
      parallax: 1,
      nearLimit: 15,
      depthCull: false
    });

    const furniture = createCampusToonStreetDetails(side, side < 0 ? 3 : 6);
    furniture.userData.campusPhaseMask = [0, 1, 2];
    addWorldScenery(root, 2, furniture, {
      side: 0,
      x: 0,
      z: -52,
      span: 118,
      parallax: 1,
      nearLimit: 15,
      depthCull: false
    });
  });

  const landmarks = createCampusNarrativeLandmarks();
  addWorldScenery(root, 2, landmarks, {
    side: 0,
    x: 0,
    z: -58,
    span: 126,
    parallax: 1,
    nearLimit: 10,
    depthCull: false
  });
  root.userData.campusLandmarks = landmarks;

  root.userData.setCampusPhase = (phaseIndex) => {
    const safePhase = clamp(Math.trunc(Number(phaseIndex) || 0), 0, 2);
    root.userData.campusPhase = safePhase;
    landmarks.userData.setPhase(safePhase);
    clouds.userData.skyArt.material.color.setHex([0xb8c8c6, 0xffffff, 0xffe0bd][safePhase]);
    clouds.userData.skyArt.material.opacity = [0.86, 1, 0.92][safePhase];
  };
  root.userData.setCampusPhase(0);

  root.userData.updateCampusWorld = (time, distance, phaseIndex = 0) => {
    if (root.userData.campusPhase !== phaseIndex) root.userData.setCampusPhase(phaseIndex);
    surface.userData.scrollTextures(distance);
    clouds.userData.animate(time);
    const travelPulse = 0.82 + Math.sin(time * 1.1) * 0.1;
    root.userData.scenery.forEach((entry, index) => {
      const lamps = entry.object.userData.lamps;
      if (lamps?.material?.emissiveIntensity !== undefined) {
        lamps.material.emissiveIntensity = entry.object.userData.baseEmissive * travelPulse;
      }
      const canopy = entry.object.userData.canopy;
      if (canopy) canopy.rotation.z = Math.sin(time * 0.48 + index) * 0.012;
    });
    const activeLandmark = landmarks.userData.phaseGroups[root.userData.campusPhase];
    if (activeLandmark?.userData.coolHalo) {
      activeLandmark.userData.coolHalo.material.opacity = 0.3 + Math.sin(time * 2.1) * 0.06;
    }
    if (activeLandmark?.userData.redSignal) {
      activeLandmark.userData.redSignal.material.emissiveIntensity = 1.05 + Math.sin(time * 4.2) * 0.28;
    }
  };

  root.traverse((child) => {
    if (!child.isMesh && !child.isInstancedMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;
  });
  return root;
}

function createRiverBookstoreWorld(config) {
  const root = createWorldRoot(config);
  const riverMaterial = new THREE.MeshPhysicalMaterial({ color: 0x4e98a6, roughness: 0.18, metalness: 0.08, clearcoat: 0.75, transparent: true, opacity: 0.72 });
  const river = mesh(new THREE.PlaneGeometry(9, 112), riverMaterial);
  river.rotation.x = -Math.PI / 2;
  addWorldScenery(root, 0, river, { side: 1, x: 10.4, z: -48, y: -0.22 });
  const bridge = new THREE.Group();
  const bridgeMaterial = material(0xa9b5ad, { roughness: 0.74, metalness: 0.18 });
  for (let index = 0; index < 3; index += 1) {
    const arch = mesh(new THREE.TorusGeometry(3.4 + index * 0.16, 0.14, 8, 36, Math.PI), bridgeMaterial);
    arch.position.z = -index * 0.42;
    bridge.add(arch);
  }
  addWorldScenery(root, 0, bridge, { side: 1, x: 10.2, z: -76, y: 0.2, scale: 1.25 });
  const bookstore = createCafe(config.accent);
  const shelfMaterial = material(0x5c3829, { roughness: 0.92 });
  for (let index = 0; index < 9; index += 1) {
    const spine = mesh(new THREE.BoxGeometry(0.12 + index % 3 * 0.035, 0.58 + index % 2 * 0.18, 0.12), material(index % 2 ? 0xc76d5e : 0xe8d49a, { roughness: 0.82 }));
    spine.position.set(-1 + index * 0.24, 1.25, 1.72);
    bookstore.add(spine);
  }
  const shelf = mesh(new THREE.BoxGeometry(2.5, 0.1, 0.2), shelfMaterial);
  shelf.position.set(0, 0.94, 1.68);
  bookstore.add(shelf);
  addWorldScenery(root, 2, bookstore, { side: -1, x: 7.3, z: -25, scale: 1.18, rotationY: Math.PI / 2 });
  const steps = new THREE.Group();
  for (let index = 0; index < 6; index += 1) {
    const step = mesh(new THREE.BoxGeometry(3.8, 0.16, 0.62), bridgeMaterial);
    step.position.set(0, index * 0.14, index * 0.48);
    steps.add(step);
  }
  addWorldScenery(root, 1, steps, { side: 1, x: 7.3, z: -45, rotationY: -Math.PI / 2 });
  return root;
}

function createNeonCinemaWorld(config) {
  const root = createWorldRoot(config);
  const cinema = createCinemaFront(config.accent);
  addWorldScenery(root, 2, cinema, { side: -1, x: 7.4, z: -24, scale: 1.12, rotationY: Math.PI / 2 });
  const portals = new THREE.Group();
  const portalMaterial = material(config.accent, { emissive: config.accent, emissiveIntensity: 2.8, roughness: 0.2, metalness: 0.55 });
  for (let index = 0; index < 4; index += 1) {
    const portal = mesh(new THREE.TorusGeometry(1.55, 0.1, 8, 28, Math.PI), portalMaterial);
    portal.position.set((index % 2) * 3.5, 0.12, -Math.floor(index / 2) * 3.8);
    portals.add(portal);
  }
  addWorldScenery(root, 1, portals, { side: 1, x: 8.2, z: -48, scale: 1.2 });
  const signs = new THREE.Group();
  for (let index = 0; index < 5; index += 1) {
    const sign = createNeonSign(index % 2 ? 0xff668f : config.accent, index);
    sign.position.set((index % 2) * 2.5, index * 1.15, -index * 2.2);
    signs.add(sign);
  }
  addWorldScenery(root, 0, signs, { side: -1, x: 12.5, z: -78, scale: 1.15 });
  return root;
}

function createNightMarketWorld(config) {
  const root = createWorldRoot(config);
  const stalls = new THREE.Group();
  for (let index = 0; index < 3; index += 1) {
    const stall = createMarket(index % 2 ? 0xffb04f : config.accent);
    stall.position.set(index * 3.7, 0, -index * 1.5);
    stalls.add(stall);
  }
  const lights = createStringLights(config.accent, 10, 4.2);
  lights.position.set(3.7, 0, 0.2);
  stalls.add(lights);
  addWorldScenery(root, 2, stalls, { side: -1, x: 8.4, z: -26, rotationY: Math.PI / 2 });
  const stage = new THREE.Group();
  const stageDeck = mesh(new THREE.CylinderGeometry(2.8, 3.1, 0.45, 12), material(0x312536, { roughness: 0.55, metalness: 0.35 }));
  stageDeck.position.y = 0.22;
  stage.add(stageDeck, createStringLights(0xffcf74, 5.6, 3.8));
  addWorldScenery(root, 1, stage, { side: 1, x: 8.8, z: -50 });
  const river = mesh(new THREE.PlaneGeometry(8, 112), new THREE.MeshPhysicalMaterial({ color: 0x202f4d, roughness: 0.2, clearcoat: 0.8, transparent: true, opacity: 0.78 }));
  river.rotation.x = -Math.PI / 2;
  addWorldScenery(root, 0, river, { side: 1, x: 11.5, z: -50, y: -0.18 });
  return root;
}

function createNeighborhoodWorld(config) {
  const root = createWorldRoot(config);
  const homes = new THREE.Group();
  for (let index = 0; index < 3; index += 1) {
    const home = createBuilding(index === 1 ? config.accent : 0xffc87a, index + 2, true);
    home.scale.setScalar(0.72 + index * 0.05);
    home.position.x = index * 4.2;
    const roof = mesh(new THREE.ConeGeometry(2.5, 1.2, 4), material(index % 2 ? 0x8f5c4b : 0x516b5a, { roughness: 0.94 }));
    roof.rotation.y = Math.PI / 4;
    roof.position.set(index * 4.2, 5.25 + index * 0.35, 0);
    homes.add(home, roof);
  }
  addWorldScenery(root, 1, homes, { side: -1, x: 8.5, z: -44, rotationY: Math.PI / 2 });
  const breakfast = createMarket(0xffc45e);
  const steamMaterial = new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0.28, depthWrite: false });
  for (let index = 0; index < 5; index += 1) {
    const steam = mesh(new THREE.TorusGeometry(0.18 + index * 0.05, 0.018, 5, 16, Math.PI), steamMaterial);
    steam.position.set(-0.8 + index * 0.4, 1.5 + index * 0.16, 0.4);
    breakfast.add(steam);
  }
  addWorldScenery(root, 2, breakfast, { side: 1, x: 7.3, z: -24, scale: 1.08, rotationY: -Math.PI / 2 });
  const kitchen = createBuilding(0xffd487, 4, true);
  addWorldScenery(root, 0, kitchen, { side: 1, x: 12.5, z: -78, scale: 1.25, rotationY: -Math.PI / 2 });
  return root;
}

function createStormBridgeWorld(config) {
  const root = createWorldRoot(config);
  const truss = new THREE.Group();
  const steel = material(0x596878, { roughness: 0.34, metalness: 0.82 });
  [-1, 1].forEach((side) => {
    const sideTruss = new THREE.Group();
    sideTruss.position.x = side * 5.8;
    for (let index = 0; index < 4; index += 1) {
      const post = mesh(new THREE.BoxGeometry(0.18, 5.6, 0.2), steel);
      post.position.set(0, 2.8, -6 + index * 4);
      sideTruss.add(post);
      if (index < 3) {
        const diagonal = mesh(new THREE.BoxGeometry(0.14, 6.1, 0.14), steel);
        diagonal.position.set(0, 2.8, -4 + index * 4);
        diagonal.rotation.x = (index + (side > 0 ? 1 : 0)) % 2 ? 0.72 : -0.72;
        sideTruss.add(diagonal);
      }
    }
    [0.55, 5.05].forEach((y) => {
      const rail = mesh(new THREE.BoxGeometry(0.18, 0.18, 12.2), steel);
      rail.position.set(0, y, 0);
      sideTruss.add(rail);
    });
    truss.add(sideTruss);
  });
  truss.userData.trackClearance = true;
  addWorldScenery(root, 2, truss, { side: 0, x: 0, z: -34, span: 92 });
  const shelter = createShelter(config.accent);
  addWorldScenery(root, 1, shelter, { side: -1, x: 7.5, z: -56, scale: 1.25, rotationY: Math.PI / 2 });
  const flood = mesh(new THREE.PlaneGeometry(12, 118), new THREE.MeshPhysicalMaterial({ color: 0x17283f, roughness: 0.15, clearcoat: 0.9, transparent: true, opacity: 0.82 }));
  flood.rotation.x = -Math.PI / 2;
  addWorldScenery(root, 0, flood, { side: 1, x: 13, z: -52, y: -1.25 });
  return root;
}

function createDawnStationWorld(config) {
  const root = createWorldRoot(config);
  const terminal = createTerminal(config.accent);
  addWorldScenery(root, 1, terminal, { side: 1, x: 8.4, z: -48, scale: 1.1, rotationY: -Math.PI / 2 });
  const station = createStation(config.accent);
  addWorldScenery(root, 2, station, { side: -1, x: 7.7, z: -25, scale: 1.12, rotationY: Math.PI / 2 });
  const clock = new THREE.Group();
  const clockFace = mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.16, 32), material(0xf0eadb, { roughness: 0.5, metalness: 0.12 }));
  clockFace.rotation.x = Math.PI / 2;
  clock.add(clockFace);
  const handMaterial = material(0x253148, { roughness: 0.46, metalness: 0.5 });
  const hour = mesh(new THREE.BoxGeometry(0.08, 0.72, 0.08), handMaterial);
  hour.position.set(0.22, 0.16, 0.11);
  hour.rotation.z = -0.62;
  const minute = mesh(new THREE.BoxGeometry(0.06, 1.02, 0.08), handMaterial);
  minute.position.set(-0.33, 0.31, 0.12);
  minute.rotation.z = 0.76;
  clock.add(hour, minute);
  addWorldScenery(root, 0, clock, { side: 1, x: 12, z: -78, y: 4.8, scale: 1.35 });
  return root;
}

function createStageWorld(config, stageIndex) {
  return [
    createRainCampusWorld,
    createRiverBookstoreWorld,
    createNeonCinemaWorld,
    createNightMarketWorld,
    createNeighborhoodWorld,
    createStormBridgeWorld,
    createDawnStationWorld
  ][stageIndex](config);
}

function createRepeatedRoadDetail(geometry, detailMaterial, count, compose) {
  const batch = new THREE.InstancedMesh(geometry, detailMaterial, count);
  const transform = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  for (let index = 0; index < count; index += 1) {
    compose(index, position, quaternion, scale);
    transform.compose(position, quaternion, scale);
    batch.setMatrixAt(index, transform);
  }
  batch.instanceMatrix.needsUpdate = true;
  batch.frustumCulled = true;
  batch.computeBoundingBox();
  batch.computeBoundingSphere();
  return batch;
}

function createStageRoadProfile(config, stageIndex, phaseIndex = 0) {
  const root = new THREE.Group();
  const route = THEMED_ROUTE_MODULES[stageIndex]?.[phaseIndex] || THEMED_ROUTE_MODULES[0][0];
  const accent = routeAccentTone(route, config.accent);
  const accentMaterial = material(accent, {
    emissive: accent,
    emissiveIntensity: ["rail", "marquee", "pulse", "terminal"].includes(route.motif) ? 1.65 : 0.46,
    roughness: 0.34,
    transparent: true,
    opacity: 0.76
  });
  const surfaceMaterial = material(routeShoulderTone(route, config.theme.landmark), {
    roughness: ["boardwalk", "bookspine", "checker", "steps", "threshold"].includes(route.motif) ? 0.84 : 0.58,
    metalness: ["rail", "drain", "terminal"].includes(route.motif) ? 0.48 : 0.08
  });
  const insetMaterial = material(new THREE.Color(config.theme.shadow).lerp(new THREE.Color(accent), 0.12).getHex(), {
    roughness: 0.72,
    metalness: ["rail", "drain", "terminal"].includes(route.motif) ? 0.42 : 0.06
  });
  const down = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const add = (geometry, detailMaterial, count, compose) => root.add(createRepeatedRoadDetail(geometry, detailMaterial, count, compose));
  const laneX = (index) => (index % 3 - 1) * LANE_WIDTH;
  const rowZ = (index, columns, spacing, start = 5) => start - Math.floor(index / columns) * spacing;

  if (route.motif === "stone") {
    add(new THREE.CircleGeometry(0.44, 18), accentMaterial, 34, (index, position, quaternion, scale) => {
      position.set(laneX(index) + ((index * 7) % 5 - 2) * 0.16, 0.055, rowZ(index, 3, 8.1));
      quaternion.copy(down);
      scale.set(0.6 + index % 4 * 0.16, 0.34 + index % 3 * 0.13, 1);
    });
  } else if (route.motif === "leaf") {
    add(new THREE.TorusGeometry(0.72, 0.035, 5, 24, Math.PI * 1.35), surfaceMaterial, 32, (index, position, quaternion, scale) => {
      position.set(laneX(index) + (index % 2 ? 0.38 : -0.38), 0.052, rowZ(index, 3, 7.4));
      quaternion.copy(down);
      scale.set(0.8 + index % 4 * 0.18, 0.5 + index % 3 * 0.16, 1);
    });
    add(new THREE.CircleGeometry(0.16, 12), accentMaterial, 42, (index, position, quaternion, scale) => {
      position.set(laneX(index) + Math.sin(index * 1.7) * 0.52, 0.058, rowZ(index, 3, 5.9, 2));
      quaternion.copy(down);
      scale.set(1.7, 0.62, 1);
    });
  } else if (route.motif === "crossing") {
    add(new THREE.BoxGeometry(7.6, 0.026, 0.42), surfaceMaterial, 30, (index, position, quaternion, scale) => {
      const crossing = Math.floor(index / 6);
      position.set(0, 0.058, 3 - crossing * 38 - index % 6 * 0.74);
      quaternion.identity();
      scale.set(1 - crossing % 2 * 0.08, 1, 1);
    });
  } else if (route.motif === "boardwalk") {
    add(new THREE.BoxGeometry(8.25, 0.03, 0.12), surfaceMaterial, 82, (index, position, quaternion, scale) => {
      position.set(0, 0.052, 6 - index * 2.38);
      quaternion.identity();
      scale.set(0.96 - index % 4 * 0.018, 1, 1);
    });
  } else if (route.motif === "groove") {
    add(new THREE.RingGeometry(0.62, 0.7, 28), insetMaterial, 42, (index, position, quaternion, scale) => {
      position.set(laneX(index), 0.055, rowZ(index, 3, 6.9));
      quaternion.copy(down);
      const size = 0.78 + index % 5 * 0.2;
      scale.set(size, size, 1);
    });
  } else if (route.motif === "bookspine") {
    add(new THREE.BoxGeometry(1.54, 0.026, 0.7), surfaceMaterial, 72, (index, position, quaternion, scale) => {
      position.set(laneX(index) + (index % 3 - 1) * 0.08, 0.056, rowZ(index, 3, 7.2));
      quaternion.identity();
      scale.set(0.72 + index % 4 * 0.11, 1, 0.72 + index % 3 * 0.2);
    });
    add(new THREE.BoxGeometry(0.12, 0.029, 0.88), accentMaterial, 36, (index, position, quaternion, scale) => {
      position.set(laneX(index) - 0.72, 0.06, rowZ(index, 3, 14.4));
      quaternion.identity();
      scale.set(1, 1, 0.72 + index % 4 * 0.16);
    });
  } else if (route.motif === "rail") {
    add(new THREE.CylinderGeometry(0.11, 0.11, 0.024, 16), accentMaterial, 54, (index, position, quaternion, scale) => {
      position.set(laneX(index), 0.225, rowZ(index, 3, 9.8));
      quaternion.identity();
      scale.set(1 + index % 3 * 0.24, 1, 1 + index % 3 * 0.24);
    });
  } else if (route.motif === "tactile") {
    add(new THREE.SphereGeometry(0.09, 8, 5), accentMaterial, 108, (index, position, quaternion, scale) => {
      const side = index % 2 ? 1 : -1;
      const row = Math.floor(index / 2);
      position.set(side * (ROAD_WIDTH * 0.46 - row % 3 * 0.24), 0.245, 5 - row * 3.65);
      quaternion.identity();
      scale.set(1, 0.42, 1);
    });
  } else if (route.motif === "marquee") {
    add(new THREE.BoxGeometry(0.09, 0.026, 4.8), accentMaterial, 42, (index, position, quaternion, scale) => {
      position.set(laneX(index), 0.058, rowZ(index, 3, 13.2));
      quaternion.setFromEuler(new THREE.Euler(0, (index % 3 - 1) * 0.34, 0));
      scale.set(1, 1, 0.72 + index % 4 * 0.14);
    });
  } else if (route.motif === "cobble") {
    add(new THREE.CylinderGeometry(0.42, 0.42, 0.026, 6), surfaceMaterial, 126, (index, position, quaternion, scale) => {
      const row = Math.floor(index / 7);
      position.set(-3.15 + index % 7 * 1.05 + row % 2 * 0.5, 0.05, 5 - row * 5.3);
      quaternion.identity();
      scale.set(1, 1, 1.28);
    });
  } else if (route.motif === "pulse") {
    add(new THREE.BoxGeometry(0.36, 0.028, 1), accentMaterial, 90, (index, position, quaternion, scale) => {
      const row = Math.floor(index / 9);
      position.set(-3.3 + index % 9 * 0.82, 0.058, 4 - row * 18.4);
      quaternion.identity();
      scale.set(0.72 + index % 3 * 0.22, 1, 0.45 + (index * 5 % 9) * 0.22);
    });
  } else if (route.motif === "wave") {
    add(new THREE.RingGeometry(0.46, 0.55, 30, 1, 0.28, Math.PI * 1.46), accentMaterial, 48, (index, position, quaternion, scale) => {
      position.set(laneX(index) + Math.sin(index * 0.8) * 0.25, 0.058, rowZ(index, 3, 6.5));
      quaternion.copy(down);
      const size = 1.1 + index % 5 * 0.32;
      scale.set(size * 1.55, size, 1);
    });
  } else if (route.motif === "checker") {
    add(new THREE.BoxGeometry(1.05, 0.025, 1.05), surfaceMaterial, 126, (index, position, quaternion, scale) => {
      const row = Math.floor(index / 7);
      position.set(-3.15 + index % 7 * 1.05, 0.054, 5 - row * 5.35);
      quaternion.identity();
      const visible = (index + row) % 2 ? 1 : 0.12;
      scale.set(visible, 1, visible);
    });
  } else if (route.motif === "grid") {
    add(new THREE.BoxGeometry(8.1, 0.024, 0.07), surfaceMaterial, 44, (index, position, quaternion, scale) => {
      position.set(0, 0.054, 5 - index * 4.5);
      quaternion.identity();
      scale.set(0.94, 1, 1);
    });
    add(new THREE.BoxGeometry(0.07, 0.026, 192), accentMaterial, 8, (index, position, quaternion, scale) => {
      position.set(-3.5 + index, 0.056, -90);
      quaternion.identity();
      scale.set(1, 1, 1);
    });
  } else if (route.motif === "steps") {
    add(new THREE.BoxGeometry(8.05, 0.035, 0.36), surfaceMaterial, 54, (index, position, quaternion, scale) => {
      position.set(0, 0.052 + index % 3 * 0.007, 5 - index * 3.58);
      quaternion.identity();
      scale.set(1 - index % 6 * 0.035, 1, 1);
    });
  } else if (route.motif === "drain") {
    add(new THREE.BoxGeometry(8.05, 0.026, 0.1), insetMaterial, 72, (index, position, quaternion, scale) => {
      position.set(0, 0.056, 5 - index * 2.68);
      quaternion.identity();
      scale.set(index % 5 ? 0.9 : 1, 1, 1);
    });
  } else if (route.motif === "detour") {
    add(new THREE.BoxGeometry(1.45, 0.028, 0.18), accentMaterial, 90, (index, position, quaternion, scale) => {
      position.set(laneX(index), 0.058, rowZ(index, 3, 6.2));
      quaternion.setFromEuler(new THREE.Euler(0, index % 2 ? 0.58 : -0.58, 0));
      scale.set(1.1 + index % 3 * 0.18, 1, 1);
    });
  } else if (route.motif === "dryline") {
    add(new THREE.BoxGeometry(3.05, 0.024, 2.25), surfaceMaterial, 74, (index, position, quaternion, scale) => {
      position.set((index % 2 ? 1 : -1) * 1.55, 0.056, rowZ(index, 2, 5.25));
      quaternion.identity();
      scale.set(0.9 + index % 4 * 0.04, 1, 0.92);
    });
  } else if (route.motif === "terminal") {
    add(new THREE.BoxGeometry(1.72, 0.026, 0.28), accentMaterial, 72, (index, position, quaternion, scale) => {
      position.set(laneX(index), 0.235, rowZ(index, 3, 8.1));
      quaternion.identity();
      scale.set(index % 2 ? 0.58 : 1, 1, 1);
    });
  } else if (route.motif === "memory") {
    add(new THREE.BoxGeometry(7.9, 0.027, 1.15), surfaceMaterial, 54, (index, position, quaternion, scale) => {
      position.set(0, 0.056, 5 - index * 3.58);
      quaternion.identity();
      scale.set(0.92 - index % 6 * 0.035, 1, 0.72 + index % 3 * 0.14);
    });
  } else {
    add(new THREE.BoxGeometry(7.9, 0.028, 0.22), accentMaterial, 48, (index, position, quaternion, scale) => {
      position.set(0, 0.058, 5 - index * 4.05);
      quaternion.identity();
      scale.set(1 - index % 6 * 0.08, 1, 1);
    });
  }
  root.name = `road-profile-${route.id}`;
  root.userData.roadGeometry = config.world.road.geometry;
  root.userData.routeModuleId = route.id;
  root.userData.routeSurfaceFamily = route.surface;
  return root;
}

function createLimb(limbMaterial, upperLength, lowerLength, radius) {
  const pivot = new THREE.Group();
  const upper = mesh(new THREE.CylinderGeometry(radius, radius * 0.88, upperLength, 8), limbMaterial, true);
  upper.position.y = -upperLength / 2;
  const joint = new THREE.Group();
  joint.position.y = -upperLength;
  const lower = mesh(new THREE.CylinderGeometry(radius * 0.82, radius * 0.7, lowerLength, 8), limbMaterial, true);
  lower.position.y = -lowerLength / 2;
  joint.add(lower);
  pivot.add(upper, joint);
  pivot.userData.joint = joint;
  return pivot;
}

function createCharacter(options) {
  const root = new THREE.Group();
  const skin = characterMaterial(options.skin, { emissiveIntensity: 0.2 });
  const cloth = characterMaterial(options.cloth);
  const clothDark = characterMaterial(options.clothDark);
  const hair = characterMaterial(options.hair, { emissiveIntensity: 0.12 });
  const shoeMaterial = characterMaterial(0xf5f2e8, { emissiveIntensity: 0.2 });
  const soleMaterial = characterMaterial(0x20272c, { emissiveIntensity: 0.08 });
  const accentColor = options.accent || 0xf2c96d;
  const detailMaterial = characterMaterial(accentColor, { emissive: accentColor, emissiveIntensity: 0.55 });
  const zipperMaterial = new THREE.MeshBasicMaterial({ color: 0xfff5d0 });

  const pelvis = mesh(new THREE.CapsuleGeometry(0.235, 0.24, 5, 12), clothDark, true);
  pelvis.scale.set(options.feminine ? 0.94 : 1, 0.72, 0.76);
  pelvis.position.y = 1.2;
  const torso = mesh(new THREE.CapsuleGeometry(0.315, 0.5, 6, 16), cloth, true);
  torso.scale.set(options.feminine ? 0.88 : 0.96, 1.04, 0.7);
  torso.position.y = 1.73;
  const jacketHem = mesh(new THREE.CylinderGeometry(0.31, options.feminine ? 0.37 : 0.4, 0.32, 16), cloth, true);
  jacketHem.scale.z = 0.72;
  jacketHem.position.y = 1.43;
  const waistBand = mesh(new THREE.TorusGeometry(0.335, 0.033, 7, 24), detailMaterial, true);
  waistBand.scale.set(1, 0.78, 0.72);
  waistBand.rotation.x = Math.PI / 2;
  waistBand.position.y = 1.28;
  const neck = mesh(new THREE.CylinderGeometry(0.085, 0.105, 0.17, 10), skin, true);
  neck.position.y = 2.19;
  const head = mesh(new THREE.SphereGeometry(0.265, 22, 18), skin, true);
  head.scale.set(0.92, 1.08, 0.94);
  head.position.y = 2.45;
  const hairCap = mesh(new THREE.SphereGeometry(0.278, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.66), hair, true);
  hairCap.position.set(0, 2.55, 0.018);
  hairCap.rotation.x = -0.09;
  root.add(pelvis, torso, jacketHem, waistBand, neck, head, hairCap);

  const collar = mesh(new THREE.TorusGeometry(0.22, 0.038, 8, 24), clothDark, true);
  collar.scale.set(1, 0.78, 0.78);
  collar.position.y = 2.08;
  collar.rotation.x = Math.PI / 2;
  const hood = mesh(new THREE.TorusGeometry(0.255, 0.065, 8, 24, Math.PI * 1.58), clothDark, true);
  hood.position.set(0, 2.05, 0.16);
  hood.rotation.set(Math.PI / 2, 0, -Math.PI * 0.79);
  const backpack = mesh(roundedPanelGeometry(0.54, 0.68, 0.23, 0.14), clothDark, true);
  backpack.position.set(0, 1.69, 0.37);
  const backpackFlap = mesh(roundedPanelGeometry(0.45, 0.23, 0.055, 0.07), detailMaterial, true);
  backpackFlap.position.set(0, 1.82, 0.515);
  backpackFlap.rotation.x = -0.08;
  const zipper = mesh(new THREE.BoxGeometry(0.024, 0.44, 0.018), zipperMaterial);
  zipper.position.set(0, 1.57, 0.52);
  const zipperPull = mesh(new THREE.TorusGeometry(0.035, 0.009, 6, 12), zipperMaterial);
  zipperPull.position.set(0, 1.79, 0.545);
  root.add(collar, hood, backpack, backpackFlap, zipper, zipperPull);

  [-1, 1].forEach((side) => {
    const ear = mesh(new THREE.SphereGeometry(0.055, 10, 8), skin, true);
    ear.scale.set(0.58, 1, 0.66);
    ear.position.set(side * 0.25, 2.45, 0);
    root.add(ear);
    const strap = mesh(new THREE.TorusGeometry(0.31, 0.022, 6, 22, Math.PI * 0.76), detailMaterial);
    strap.position.set(side * 0.15, 1.72, 0.29);
    strap.rotation.set(Math.PI / 2, 0, side > 0 ? 1.92 : -0.35);
    root.add(strap);
  });

  const fringe = mesh(roundedPanelGeometry(0.36, 0.12, 0.07, 0.035), hair, true);
  fringe.position.set(0, 2.65, -0.2);
  fringe.rotation.x = -0.22;
  root.add(fringe);

  if (options.feminine) {
    const ponytailPivot = new THREE.Group();
    ponytailPivot.position.set(0, 2.55, 0.18);
    const ponytail = mesh(new THREE.CapsuleGeometry(0.095, 0.34, 5, 10), hair, true);
    ponytail.position.y = -0.24;
    ponytail.rotation.z = 0.12;
    ponytailPivot.add(ponytail);
    root.add(ponytailPivot);
    root.userData.ponytail = ponytailPivot;
  }

  const leftArm = createLimb(cloth, 0.5, 0.47, 0.082);
  const rightArm = createLimb(cloth, 0.5, 0.47, 0.082);
  leftArm.position.set(-0.34, 1.98, 0);
  rightArm.position.set(0.34, 1.98, 0);
  const leftLeg = createLimb(clothDark, 0.64, 0.64, 0.112);
  const rightLeg = createLimb(clothDark, 0.64, 0.64, 0.112);
  leftLeg.position.set(-0.15, 1.26, 0);
  rightLeg.position.set(0.15, 1.26, 0);
  [leftArm, rightArm].forEach((arm) => {
    const hand = mesh(new THREE.SphereGeometry(0.095, 10, 8), skin, true);
    hand.position.y = -0.48;
    arm.userData.joint.add(hand);
  });
  [leftLeg, rightLeg].forEach((leg, index) => {
    const knee = mesh(new THREE.SphereGeometry(0.12, 10, 8), clothDark, true);
    leg.userData.joint.add(knee);
    const shoe = mesh(roundedPanelGeometry(0.215, 0.14, 0.45, 0.055), shoeMaterial, true);
    shoe.position.set(0, -0.64, -0.115);
    shoe.rotation.x = 0.08;
    const sole = mesh(roundedPanelGeometry(0.225, 0.045, 0.47, 0.025), soleMaterial, true);
    sole.position.set(0, -0.72, -0.105);
    const heelGlow = mesh(new THREE.BoxGeometry(0.12, 0.025, 0.09), detailMaterial);
    heelGlow.position.set(0, -0.696, 0.08);
    leg.userData.joint.add(shoe, sole, heelGlow);
    leg.userData.shoe = shoe;
    leg.userData.side = index ? 1 : -1;
  });
  root.add(leftArm, rightArm, leftLeg, rightLeg);

  const shadow = mesh(
    new THREE.CircleGeometry(0.68, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.24, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.018;
  root.add(shadow);
  root.userData.parts = { pelvis, torso, head, hairCap, jacketHem, backpack, backpackFlap, leftArm, rightArm, leftLeg, rightLeg, shadow };
  root.userData.baseScale = options.scale || 1;
  root.scale.setScalar(root.userData.baseScale);
  return root;
}

function animateCharacter(character, time, action, vertical, intensity, phaseOffset = 0, lateral = 0, stumble = 0) {
  const parts = character.userData.parts;
  const phase = time * (9.4 + intensity * 2.4) + phaseOffset;
  const stride = Math.sin(phase);
  const rebound = Math.abs(Math.cos(phase)) * 0.052;
  const strideScale = 0.78 + intensity * 0.18;
  parts.leftArm.rotation.x = stride * 0.9 * strideScale - 0.12;
  parts.rightArm.rotation.x = -stride * 0.9 * strideScale - 0.12;
  parts.leftLeg.rotation.x = -stride * 0.98 * strideScale;
  parts.rightLeg.rotation.x = stride * 0.98 * strideScale;
  parts.leftLeg.userData.joint.rotation.x = Math.max(0, stride) * 1.05;
  parts.rightLeg.userData.joint.rotation.x = Math.max(0, -stride) * 1.05;
  parts.leftArm.userData.joint.rotation.x = -0.2 - Math.max(0, -stride) * 0.56;
  parts.rightArm.userData.joint.rotation.x = -0.2 - Math.max(0, stride) * 0.56;
  parts.pelvis.rotation.y = stride * 0.12;
  parts.torso.rotation.y = -stride * 0.075;
  parts.torso.rotation.z = -stride * 0.032 - lateral * 0.025;
  parts.head.rotation.z = stride * 0.015;
  parts.jacketHem.rotation.z = stride * 0.025;
  parts.jacketHem.rotation.x = -0.04 + Math.abs(stride) * 0.035;
  parts.backpack.rotation.x = 0.04 + Math.abs(stride) * 0.025;
  parts.backpackFlap.rotation.x = -0.08 - Math.abs(stride) * 0.1;
  character.rotation.x = 0.075;
  character.rotation.z = clamp(-lateral * 0.12, -0.18, 0.18);
  character.scale.setScalar(character.userData.baseScale || 1);
  character.position.y = rebound + vertical * 0.72;
  parts.shadow.material.opacity = clamp(0.24 - vertical * 0.11, 0.08, 0.24);
  parts.shadow.scale.setScalar(1 + vertical * 0.2);

  if (action === "idle") {
    parts.leftArm.rotation.x = -0.08;
    parts.rightArm.rotation.x = -0.08;
    parts.leftLeg.rotation.x = 0;
    parts.rightLeg.rotation.x = 0;
    parts.leftLeg.userData.joint.rotation.x = 0;
    parts.rightLeg.userData.joint.rotation.x = 0;
    parts.pelvis.rotation.y = 0;
    parts.torso.rotation.y = 0;
    character.position.y = Math.sin(time * 1.6 + phaseOffset) * 0.012;
    character.rotation.x = 0;
  } else if (action === "jump") {
    character.rotation.x = -0.04;
    parts.leftLeg.rotation.x = -0.48;
    parts.rightLeg.rotation.x = 0.34;
    parts.leftLeg.userData.joint.rotation.x = 1.15;
    parts.rightLeg.userData.joint.rotation.x = 0.92;
    parts.leftArm.rotation.x = 0.72;
    parts.rightArm.rotation.x = 0.46;
  } else if (action === "slide") {
    character.position.y = 0.14;
    character.rotation.x = -0.86;
    const baseScale = character.userData.baseScale || 1;
    character.scale.set(baseScale, baseScale * 0.82, baseScale);
    parts.leftLeg.rotation.x = -1.2;
    parts.rightLeg.rotation.x = -0.9;
    parts.leftArm.rotation.x = 0.84;
    parts.rightArm.rotation.x = 0.58;
  }
  if (stumble > 0) {
    character.rotation.z += Math.sin(time * 34) * 0.14 * stumble;
    character.rotation.x += 0.24 * stumble;
    parts.leftArm.rotation.z = 0.8 * stumble;
    parts.rightArm.rotation.z = -0.8 * stumble;
  } else {
    parts.leftArm.rotation.z = 0;
    parts.rightArm.rotation.z = 0;
  }
  if (character.userData.ponytail) character.userData.ponytail.rotation.x = -0.18 + stride * 0.2;
}

function smoothGeometryNormals(sourceGeometry) {
  const geometry = sourceGeometry.clone();
  if (!geometry.attributes.position) return geometry;
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  const positions = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const buckets = new Map();
  for (let index = 0; index < positions.count; index += 1) {
    const key = `${Math.round(positions.getX(index) * 1000)}:${Math.round(positions.getY(index) * 1000)}:${Math.round(positions.getZ(index) * 1000)}`;
    const bucket = buckets.get(key) || { x: 0, y: 0, z: 0, indices: [] };
    bucket.x += normals.getX(index);
    bucket.y += normals.getY(index);
    bucket.z += normals.getZ(index);
    bucket.indices.push(index);
    buckets.set(key, bucket);
  }
  buckets.forEach((bucket) => {
    const length = Math.hypot(bucket.x, bucket.y, bucket.z) || 1;
    const x = bucket.x / length;
    const y = bucket.y / length;
    const z = bucket.z / length;
    bucket.indices.forEach((index) => normals.setXYZ(index, x, y, z));
  });
  normals.needsUpdate = true;
  return geometry;
}

function createRunnerFashion(accent = 0xff654f, companion = false, replaceHead = false) {
  const group = new THREE.Group();
  const accentColor = new THREE.Color(accent);
  const darkColor = companion ? 0x492d4d : 0x14283a;
  const jacketColor = companion ? 0xa3486f : 0x176b82;
  const fabric = material(darkColor, { roughness: 0.7, metalness: 0.02 });
  const jacketFabric = material(jacketColor, {
    roughness: 0.58,
    metalness: 0.06,
    clearcoat: 0.1,
    clearcoatRoughness: 0.64
  });
  const trim = material(accent, {
    emissive: accent,
    emissiveIntensity: 0.72,
    roughness: 0.28,
    metalness: 0.14
  });

  const headGroup = new THREE.Group();
  const skin = characterMaterial(companion ? 0xe0ad8c : 0xc98c6b, { emissiveIntensity: 0.11 });
  const hair = characterMaterial(companion ? 0x34212b : 0x21171a, { emissiveIntensity: 0.08 });
  const head = mesh(new THREE.SphereGeometry(0.225, 24, 18), skin, true);
  head.scale.set(0.92, 1.07, 0.94);
  const hairCap = mesh(new THREE.SphereGeometry(0.238, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.68), hair, true);
  hairCap.position.set(0, 0.075, 0.014);
  hairCap.rotation.x = -0.08;
  [-1, 0, 1].forEach((side, index) => {
    const lock = mesh(new THREE.CapsuleGeometry(0.035 + index * 0.004, 0.12 + Math.abs(side) * 0.03, 4, 8), hair, true);
    lock.position.set(side * 0.12, -0.04 - Math.abs(side) * 0.015, 0.19);
    lock.rotation.z = side * 0.22;
    headGroup.add(lock);
  });
  [-1, 1].forEach((side) => {
    const ear = mesh(new THREE.SphereGeometry(0.045, 12, 9), skin, true);
    ear.scale.set(0.62, 1, 0.72);
    ear.position.x = side * 0.213;
    headGroup.add(ear);
  });
  headGroup.position.set(0, 2.54, 0.01);
  headGroup.add(head, hairCap);

  const rearShell = mesh(roundedPanelGeometry(companion ? 0.56 : 0.62, 0.72, 0.055, 0.11), jacketFabric, true);
  rearShell.position.set(0, 1.72, 0.238);
  const frontShell = mesh(roundedPanelGeometry(companion ? 0.55 : 0.61, 0.7, 0.05, 0.11), jacketFabric, true);
  frontShell.position.set(0, 1.72, -0.225);
  const backPanel = mesh(roundedPanelGeometry(0.31, 0.28, 0.024, 0.065), fabric, true);
  backPanel.position.set(0, 1.72, 0.276);
  [-1, 1].forEach((side) => {
    const sidePanel = mesh(roundedPanelGeometry(0.11, 0.58, 0.03, 0.04), fabric, true);
    sidePanel.position.set(side * (companion ? 0.285 : 0.315), 1.68, 0);
    sidePanel.rotation.y = Math.PI / 2;
    group.add(sidePanel);
  });
  const collar = mesh(new THREE.TorusGeometry(0.25, 0.045, 8, 28), fabric, true);
  collar.scale.z = 0.72;
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 2.23, 0.005);
  const waist = mesh(new THREE.TorusGeometry(0.34, 0.032, 7, 28), fabric, true);
  waist.scale.z = 0.68;
  waist.rotation.x = Math.PI / 2;
  waist.position.set(0, 1.24, 0.01);
  const seam = mesh(roundedPanelGeometry(0.032, 0.38, 0.014, 0.014), trim, true);
  seam.position.set(0, 1.67, 0.304);
  const emblem = new THREE.Group();
  [-1, 1].forEach((side) => {
    const stripe = mesh(roundedPanelGeometry(0.035, 0.18, 0.014, 0.012), trim, true);
    stripe.position.set(side * 0.047, 1.76, 0.294);
    stripe.rotation.z = side * 0.58;
    emblem.add(stripe);
  });

  const hemMaterial = material(new THREE.Color(darkColor).lerp(accentColor, 0.14), {
    roughness: 0.76,
    side: THREE.DoubleSide
  });
  const leftHem = mesh(roundedPanelGeometry(0.17, 0.24, 0.022, 0.045), hemMaterial, true);
  const rightHem = mesh(roundedPanelGeometry(0.17, 0.24, 0.022, 0.045), hemMaterial, true);
  leftHem.position.set(-0.095, 1.27, 0.22);
  rightHem.position.set(0.095, 1.27, 0.22);
  leftHem.rotation.z = 0.04;
  rightHem.rotation.z = -0.04;

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeParticleTexture(),
    color: accent,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  }));
  glow.position.set(0, 1.58, 0.1);
  glow.scale.set(0.88, 1.54, 1);
  if (replaceHead) group.add(headGroup);
  group.add(rearShell, frontShell, backPanel, collar, waist, seam, emblem, leftHem, rightHem, glow);
  group.userData.leftHem = leftHem;
  group.userData.rightHem = rightHem;
  group.userData.head = replaceHead ? headGroup : null;
  group.userData.emblem = emblem;
  group.userData.glow = glow;
  return group;
}

function createRiggedRunner(gltf, options, animationClips = gltf.animations, headGltf = null, accessoryGltfs = []) {
  const wrapper = new THREE.Group();
  const model = gltf.scene;
  let referenceSkinMaterial = null;
  headGltf?.scene?.traverse((child) => {
    if (referenceSkinMaterial || (!child.isMesh && !child.isSkinnedMesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    referenceSkinMaterial = materials.find((entry) => /Superhero_(?:Male|Female)/i.test(entry?.name || "")) || null;
  });
  const prepareModel = (sourceModel, applyOutfitTint = false, applyHairTint = false) => {
    sourceModel.rotation.y = options.rotationY ?? Math.PI;
    sourceModel.traverse((child) => {
      if (child.name === "Sword") child.visible = false;
      if (options.replaceHead && child.name === "Casual2_Head") {
        child.visible = false;
        return;
      }
      if (!child.isMesh && !child.isSkinnedMesh) return;
      child.geometry = smoothGeometryNormals(child.geometry);
      child.castShadow = true;
      child.receiveShadow = true;
      if (!child.material) return;
      const convertMaterial = (inputMaterial) => {
        const sourceMaterial = inputMaterial.clone();
        const materialName = sourceMaterial.name || "";
        const skinLike = /Skin|Eye|Eyebrow|Regular_(?:Male|Female)|Superhero_(?:Male|Female)/i.test(materialName);
        const hairLike = /Hair|LightBrown/i.test(materialName) && !options.outfitMaterial?.test?.(materialName);
        if (skinLike && referenceSkinMaterial && /Regular_(?:Male|Female)/i.test(materialName)) {
          sourceMaterial.color.copy(referenceSkinMaterial.color);
          sourceMaterial.map = referenceSkinMaterial.map || sourceMaterial.map;
          sourceMaterial.normalMap = referenceSkinMaterial.normalMap || sourceMaterial.normalMap;
          sourceMaterial.roughnessMap = referenceSkinMaterial.roughnessMap || sourceMaterial.roughnessMap;
        }
        options.recolor?.forEach(([pattern, color]) => {
          if (pattern.test(materialName)) sourceMaterial.color.setHex(color);
        });
        if (!skinLike && applyOutfitTint && options.outfitTint?.pattern?.test?.(materialName)) {
          sourceMaterial.color.multiply(new THREE.Color(options.outfitTint.color));
        }
        if (!skinLike && applyOutfitTint && options.partTints?.length) {
          const partTint = options.partTints.find(([pattern]) => pattern.test(child.name || ""));
          if (partTint) sourceMaterial.color.multiply(new THREE.Color(partTint[1]));
        }
        if (applyHairTint && options.hairTint) sourceMaterial.color.multiply(new THREE.Color(options.hairTint));
        return new THREE.MeshPhysicalMaterial({
          name: materialName,
          color: sourceMaterial.color,
          map: sourceMaterial.map || null,
          normalMap: sourceMaterial.normalMap || null,
          normalScale: sourceMaterial.normalScale?.clone?.() || new THREE.Vector2(1, 1),
          roughnessMap: sourceMaterial.roughnessMap || null,
          metalnessMap: sourceMaterial.metalnessMap || null,
          aoMap: sourceMaterial.aoMap || null,
          emissiveMap: sourceMaterial.emissiveMap || null,
          emissive: sourceMaterial.emissive || new THREE.Color(0x000000),
          roughness: Number.isFinite(sourceMaterial.roughness)
            ? sourceMaterial.roughness
            : skinLike ? 0.58 : hairLike ? 0.42 : 0.68,
          metalness: Number.isFinite(sourceMaterial.metalness) ? sourceMaterial.metalness : 0.015,
          clearcoat: hairLike ? 0.24 : skinLike ? 0.06 : 0.13,
          clearcoatRoughness: hairLike ? 0.35 : 0.62,
          sheen: skinLike ? 0.08 : 0.24,
          sheenColor: new THREE.Color(options.accent || 0xff654f).multiplyScalar(skinLike ? 0.22 : 0.38),
          sheenRoughness: 0.7,
          envMapIntensity: skinLike ? 0.55 : 0.9
        });
      };
      const convertedMaterials = Array.isArray(child.material)
        ? child.material.map(convertMaterial)
        : convertMaterial(child.material);
      child.material = convertedMaterials;
      if (Array.isArray(convertedMaterials) && convertedMaterials.length > 1) {
        child.userData.qualityMaterials = convertedMaterials;
        child.userData.performanceMaterial = convertedMaterials.find((entry) => /Skin|Regular|Superhero/i.test(entry.name || ""))
          || convertedMaterials[0];
      }
    });
  };
  prepareModel(model, true);
  const initialBox = new THREE.Box3().setFromObject(model);
  const naturalHeight = Math.max(0.01, initialBox.max.y - initialBox.min.y);
  const modelScale = (options.height || 2.72) / naturalHeight;
  model.scale.set(
    modelScale * (options.widthScale || 0.9),
    modelScale * 1.035,
    modelScale * (options.depthScale || 0.92)
  );
  const scaledBox = new THREE.Box3().setFromObject(model);
  model.position.y = -scaledBox.min.y;
  wrapper.add(model);

  const models = [model];
  if (headGltf?.scene) {
    const headModel = headGltf.scene;
    prepareModel(headModel, false);
    headModel.scale.copy(model.scale);
    headModel.position.copy(model.position);
    wrapper.add(headModel);
    models.push(headModel);
  }
  accessoryGltfs.filter((entry) => entry?.scene).forEach((entry) => {
    const accessoryModel = entry.scene;
    prepareModel(accessoryModel, false, true);
    accessoryModel.scale.copy(model.scale);
    accessoryModel.position.copy(model.position);
    wrapper.add(accessoryModel);
    models.push(accessoryModel);
  });

  const fashion = options.fashion === false
    ? new THREE.Group()
    : createRunnerFashion(
      options.accent || options.backpackTrim || 0xff654f,
      Boolean(options.companion),
      Boolean(options.replaceHead)
    );
  wrapper.add(fashion);

  const shadow = mesh(
    new THREE.CircleGeometry(0.58, 28),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.27, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.018;
  wrapper.add(shadow);

  const createAnimationLayer = (layerModel) => {
    const mixer = new THREE.AnimationMixer(layerModel);
    const availableTargets = new Set();
    layerModel.traverse((child) => availableTargets.add(THREE.PropertyBinding.sanitizeNodeName(child.name)));
    const findClip = (...names) => {
      const sourceClip = animationClips.find((clip) => names.some((name) => (
        clip.name === name || clip.name.endsWith(`|${name}`)
      )));
      if (!sourceClip) throw new Error(`Runner animation missing: ${names.join(", ")}`);
      const clip = sourceClip.clone();
      clip.tracks = clip.tracks.filter((track) => {
        const target = track.name.split(".", 1)[0];
        return !["Body", "PTL", "PTR"].includes(target) && availableTargets.has(target);
      });
      return clip;
    };
    const actions = {
      idle: mixer.clipAction(findClip("Idle_A", "Idle_B", "Idle_Loop", "Idle_Neutral")),
      run: mixer.clipAction(findClip("Runing_A", "Runing_B", "Sprint_Loop", "Run")),
      jump: mixer.clipAction(findClip("Jump_B_Full", "Jump_A_InAir", "Jump_Loop", "Jump_Start")),
      slide: mixer.clipAction(findClip("Jump_A_Landing", "FightM_Pose", "FightM_Combo_A", "Roll")),
      stumble: mixer.clipAction(findClip("FightM_Hit_C", "FightM_Hit_A", "Hit_Chest", "HitRecieve"))
    };
    Object.values(actions).forEach((runnerAction) => {
      runnerAction.enabled = true;
      runnerAction.setEffectiveWeight(1);
    });
    actions.run.play();
    return { model: layerModel, mixer, actions };
  };
  const layers = models.map(createAnimationLayer);
  const primaryLayer = layers[0];
  wrapper.userData.modelRunner = {
    model,
    mixer: primaryLayer.mixer,
    actions: primaryLayer.actions,
    layers,
    currentAction: "run",
    shadow,
    fashion
  };
  return wrapper;
}

function animateRiggedRunner(character, delta, action, vertical, intensity, lateral = 0, stumble = 0) {
  const runner = character.userData.modelRunner;
  const nextAction = stumble > 0.15 ? "stumble"
    : action === "idle" ? "idle"
      : action === "slide" ? "slide"
        : vertical > 0.08 ? "jump" : "run";
  if (nextAction !== runner.currentAction) {
    runner.layers.forEach((layer) => {
      layer.actions[runner.currentAction]?.fadeOut(0.12);
      layer.actions[nextAction]?.reset().fadeIn(0.12).play();
    });
    runner.currentAction = nextAction;
  }
  const runScale = clamp(0.98 + intensity * 0.42, 1.02, 1.78);
  runner.layers.forEach((layer) => {
    layer.actions.run.setEffectiveTimeScale(runScale);
    layer.actions.jump.setEffectiveTimeScale(1.08 + intensity * 0.08);
    layer.actions.slide.setEffectiveTimeScale(1.32);
    layer.mixer.update(delta);
  });
  const sliding = action === "slide";
  character.position.y = vertical * 0.72 + (sliding ? 0.025 : 0);
  character.rotation.x = sliding ? -0.68 : 0.035;
  character.rotation.z = clamp(-lateral * 0.09, -0.16, 0.16);
  character.scale.set(sliding ? 1.06 : 1, sliding ? 0.62 : 1, sliding ? 1.2 : 1);
  runner.shadow.material.opacity = clamp(0.27 - vertical * 0.11, 0.08, 0.27);
  runner.shadow.scale.setScalar(1 + vertical * 0.24);
  const fashion = runner.fashion?.userData;
  if (fashion?.leftHem && fashion?.rightHem) {
    const phase = runner.mixer.time * 9.4;
    const wind = clamp(intensity, 0.2, 1.65);
    fashion.leftHem.rotation.x = -0.08 - wind * 0.07 + Math.sin(phase) * 0.055;
    fashion.rightHem.rotation.x = -0.08 - wind * 0.07 - Math.sin(phase) * 0.055;
    fashion.leftHem.rotation.z = 0.04 + Math.sin(phase * 0.52) * 0.075 - lateral * 0.025;
    fashion.rightHem.rotation.z = -0.04 - Math.sin(phase * 0.52) * 0.075 - lateral * 0.025;
    if (fashion.head) {
      fashion.head.rotation.z = Math.sin(phase * 0.5) * 0.012 - lateral * 0.012;
      fashion.head.position.y = 2.54 + Math.abs(Math.sin(phase)) * 0.012;
    }
    if (fashion.emblem) fashion.emblem.rotation.z = Math.sin(phase * 0.5) * 0.035;
    if (fashion.glow) fashion.glow.material.opacity = 0.08 + clamp(intensity - 0.55, 0, 1) * 0.16;
  }
}

function createCollectible(stageIndex, accent, particleTexture) {
  const group = new THREE.Group();
  const heartColor = STAGE_COLLECTIBLE_COLORS[stageIndex] || accent;
  const glowMaterial = new THREE.MeshBasicMaterial({ color: heartColor, toneMapped: false });
  const rimMaterial = material(new THREE.Color(heartColor).multiplyScalar(0.34), {
    emissive: heartColor,
    emissiveIntensity: 0.34,
    roughness: 0.24,
    metalness: 0.62
  });
  const medallion = mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 28), rimMaterial, true);
  medallion.rotation.x = Math.PI / 2;
  const heart = mesh(createHeartGeometry(), glowMaterial, true);
  heart.scale.setScalar(0.72);
  heart.position.z = 0.105;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: particleTexture,
    color: heartColor,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  }));
  halo.scale.set(0.94, 0.94, 1);
  halo.position.z = -0.02;
  group.add(halo, medallion, heart);

  const trailPositions = new Float32Array([
    -0.13, -0.28, 0.02,
    0.12, -0.41, 0.03,
    -0.08, -0.54, 0.01,
    0.07, -0.67, 0
  ]);
  const pickupTrailGeometry = new THREE.BufferGeometry();
  pickupTrailGeometry.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
  const pickupTrail = new THREE.Points(pickupTrailGeometry, new THREE.PointsMaterial({
    map: particleTexture,
    color: heartColor,
    size: 0.18,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  }));
  pickupTrail.name = "pickupTrail";
  pickupTrail.userData.stageIndex = stageIndex;
  group.userData.pickupTrail = pickupTrail;
  group.add(pickupTrail);
  return group;
}

function createCollectibleBatches(particleTexture, accent) {
  const capacity = 48;
  const rimMaterial = material(new THREE.Color(accent).lerp(new THREE.Color(0xffffff), 0.26), {
    emissive: accent,
    emissiveIntensity: 0.42,
    roughness: 0.18,
    metalness: 0.78
  });
  const rims = new THREE.InstancedMesh(new THREE.TorusGeometry(0.48, 0.055, 8, 28), rimMaterial, capacity);
  rims.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rims.count = 0;
  rims.castShadow = true;
  rims.frustumCulled = false;
  const tokenColor = STAGE_TOKEN_COLORS[0];
  const heartMaterial = material(tokenColor, {
    emissive: tokenColor,
    emissiveIntensity: 0.7,
    roughness: 0.18,
    metalness: 0.48,
    side: THREE.DoubleSide
  });
  const hearts = new THREE.InstancedMesh(createStageTokenGeometry(0), heartMaterial, capacity);
  hearts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  hearts.count = 0;
  hearts.castShadow = true;
  hearts.frustumCulled = false;
  const initialColor = new THREE.Color(accent);
  for (let index = 0; index < capacity; index += 1) {
    rims.setColorAt(index, initialColor);
    hearts.setColorAt(index, initialColor);
  }
  rims.instanceColor.setUsage(THREE.DynamicDrawUsage);
  hearts.instanceColor.setUsage(THREE.DynamicDrawUsage);

  const glowGeometry = new THREE.BufferGeometry();
  glowGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(capacity * 3), 3));
  glowGeometry.setDrawRange(0, 0);
  const glows = new THREE.Points(glowGeometry, new THREE.PointsMaterial({
    map: particleTexture,
    color: accent,
    size: 0.36,
    transparent: true,
    opacity: 0.58,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  }));
  glows.frustumCulled = false;

  const pickupTrailGeometry = new THREE.BufferGeometry();
  pickupTrailGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(capacity * 2 * 3), 3));
  pickupTrailGeometry.setDrawRange(0, 0);
  const pickupTrail = new THREE.Points(pickupTrailGeometry, new THREE.PointsMaterial({
    map: particleTexture,
    color: accent,
    size: 0.14,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  }));
  pickupTrail.name = "pickupTrailBatch";
  pickupTrail.frustumCulled = false;

  const campusWispGeometry = new THREE.BufferGeometry();
  campusWispGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(capacity * 3 * 3), 3));
  campusWispGeometry.setDrawRange(0, 0);
  const campusWisps = new THREE.Points(campusWispGeometry, new THREE.PointsMaterial({
    map: getCampusLightMoteTexture(),
    color: 0xffd889,
    size: 0.28,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    toneMapped: false
  }));
  campusWisps.name = "campusCourageWisps";
  campusWisps.frustumCulled = false;
  return { capacity, rims, hearts, glows, pickupTrail, campusWisps };
}

function createTrain(accent, variant = 0) {
  const group = new THREE.Group();
  const bodyColor = variant % 2 ? 0xe5e7e4 : 0xd4d9d7;
  const bodyMaterial = material(bodyColor, { roughness: 0.34, metalness: 0.36 });
  const dark = material(0x172027, { roughness: 0.28, metalness: 0.54 });
  const stripe = material(accent, { emissive: accent, emissiveIntensity: 0.42, roughness: 0.38 });
  const body = mesh(roundedPanelGeometry(1.92, 2.72, 5.75, 0.18), bodyMaterial, true);
  body.position.y = 1.62;
  const roof = mesh(roundedPanelGeometry(1.78, 0.26, 5.45, 0.1), dark, true);
  roof.position.y = 3.08;
  const nose = mesh(new THREE.SphereGeometry(1, 18, 12), bodyMaterial, true);
  nose.scale.set(0.96, 1.22, 0.36);
  nose.position.set(0, 1.72, 2.84);
  const stripeBand = mesh(new THREE.BoxGeometry(1.955, 0.28, 5.82), stripe, true);
  stripeBand.position.y = 0.82;
  group.add(body, roof, nose, stripeBand);

  const windowTexture = makeTrainWindowTexture(accent, variant);
  [-1, 1].forEach((side) => {
    const windows = mesh(new THREE.PlaneGeometry(5.25, 1.25), new THREE.MeshBasicMaterial({ map: windowTexture }));
    windows.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    windows.position.set(side * 0.966, 2.02, -0.08);
    group.add(windows);
  });
  const windshield = mesh(new THREE.PlaneGeometry(1.34, 0.82), new THREE.MeshPhysicalMaterial({
    color: 0x173544,
    roughness: 0.08,
    metalness: 0.18,
    transmission: 0.08,
    transparent: true,
    opacity: 0.94
  }));
  windshield.position.set(0, 2.18, 3.185);
  const rearWindow = windshield.clone();
  rearWindow.material = windshield.material.clone();
  rearWindow.material.side = THREE.DoubleSide;
  rearWindow.position.set(0, 2.12, -3.185);
  rearWindow.rotation.y = Math.PI;
  group.add(windshield, rearWindow);
  const headlights = [];
  [-0.58, 0.58].forEach((x) => {
    const lamp = mesh(new THREE.CircleGeometry(0.13, 18), material(0xfff1bc, { emissive: 0xffe29a, emissiveIntensity: 6, roughness: 0.12 }));
    lamp.position.set(x, 1.25, 3.19);
    const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeParticleTexture(), color: 0xffe7a8, transparent: true, opacity: 0.74, blending: THREE.AdditiveBlending, depthWrite: false }));
    flare.position.set(x, 1.25, 3.23);
    flare.scale.set(0.72, 0.72, 1);
    headlights.push(lamp, flare);
    group.add(lamp);
    group.add(flare);
  });
  [-0.68, 0.68].forEach((x) => {
    [-1.85, 1.7].forEach((z) => {
      const wheel = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.18, 16), dark, true);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.34, z);
      group.add(wheel);
    });
  });
  [-0.54, 0.54].forEach((x) => {
    const tailLight = mesh(new THREE.CircleGeometry(0.105, 16), material(0xff3d4f, { emissive: 0xff1d3c, emissiveIntensity: 5.2, roughness: 0.16, side: THREE.DoubleSide }));
    tailLight.position.set(x, 1.08, -3.19);
    tailLight.rotation.y = Math.PI;
    group.add(tailLight);
  });
  const destinationTexture = makeSignTexture(variant % 2 ? "EXPRESS" : "CITY", accent);
  const destination = mesh(new THREE.PlaneGeometry(0.92, 0.3), new THREE.MeshBasicMaterial({ map: destinationTexture }));
  destination.position.set(0, 2.82, 3.2);
  group.add(destination);
  group.userData.kind = "train";
  group.userData.headlights = headlights;
  return group;
}

function createCampusPuddleMaterial(accent) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAccent: { value: new THREE.Color(accent).lerp(new THREE.Color(0x8bd9e1), 0.72) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uAccent;
      varying vec2 vUv;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 345.45));
        p += dot(p, p + 34.345);
        return fract(p.x * p.y);
      }

      void main() {
        vec2 centered = vUv - 0.5;
        centered.y *= 1.5;
        float radius = length(centered);
        float organic = sin(centered.x * 16.0 + sin(centered.y * 12.0) * 1.5) * 0.018;
        organic += sin(centered.y * 22.0 - centered.x * 7.0) * 0.012;
        float mask = 1.0 - smoothstep(0.37 + organic, 0.49 + organic, radius);
        float edge = smoothstep(0.35, 0.46, radius) * mask;
        float rings = sin(radius * 72.0 - uTime * 4.2 + sin(atan(centered.y, centered.x) * 3.0));
        rings = pow(max(0.0, rings), 10.0) * smoothstep(0.38, 0.04, radius);
        float breeze = sin((centered.x * 1.5 + centered.y) * 42.0 - uTime * 2.3) * 0.5 + 0.5;
        breeze *= smoothstep(0.28, 0.03, abs(centered.y + centered.x * 0.16));
        float grain = hash21(floor(vUv * vec2(92.0, 64.0)));
        vec3 deep = mix(vec3(0.10, 0.22, 0.24), uAccent * 0.54, 0.42);
        vec3 sky = mix(vec3(0.47, 0.77, 0.83), vec3(0.92, 0.98, 0.94), vUv.y * 0.6 + 0.18);
        vec3 color = mix(deep, sky, 0.34 + breeze * 0.18);
        color += (rings * 0.62 + edge * 0.28 + grain * 0.025) * vec3(0.82, 1.0, 0.97);
        float alpha = mask * (0.44 + breeze * 0.11 + rings * 0.36) + edge * 0.18;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    toneMapped: false
  });
}

function createCampusPuddleObstacle(accent, variant = 0) {
  const group = new THREE.Group();
  const puddleMaterial = createCampusPuddleMaterial(accent);
  const puddle = mesh(new THREE.PlaneGeometry(2.72, 1.72, 1, 1), puddleMaterial);
  puddle.rotation.x = -Math.PI / 2;
  puddle.rotation.z = (variant % 3 - 1) * 0.12;
  puddle.position.y = 0.028;
  puddle.renderOrder = 3;

  const glint = new THREE.Sprite(new THREE.SpriteMaterial({
    map: getCampusMistTexture(),
    color: 0xd8fbf5,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  }));
  glint.scale.set(2.3, 0.66, 1);
  glint.position.set(-0.18, 0.13, 0.08);
  glint.renderOrder = 4;

  const leafMaterial = new THREE.MeshBasicMaterial({
    map: getCampusObstacleLeafTexture(),
    color: 0x8caf68,
    transparent: true,
    alphaTest: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: true
  });
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.2, 0.3), leafMaterial, 6);
  const transform = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  for (let index = 0; index < 6; index += 1) {
    quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, -0.78 + index * 0.61));
    scale.setScalar(0.76 + index % 3 * 0.13);
    transform.compose(
      new THREE.Vector3(-0.92 + index * 0.37, 0.052, (index % 2 ? 0.34 : -0.28) + Math.sin(index * 2.3) * 0.11),
      quaternion,
      scale
    );
    leaves.setMatrixAt(index, transform);
  }
  leaves.instanceMatrix.needsUpdate = true;
  leaves.renderOrder = 5;
  group.add(puddle, glint, leaves);
  group.userData.kind = "campus-puddle";
  group.userData.obstacleSignature = "rain-puddle";
  group.userData.campusEffect = { kind: "puddle", puddleMaterial, glint };
  return group;
}

function createCampusLeafGustObstacle(accent, variant = 0) {
  const group = new THREE.Group();
  const leafCount = 26;
  const leafBases = [];
  const leafMaterial = new THREE.MeshStandardMaterial({
    map: getCampusObstacleLeafTexture(),
    color: new THREE.Color(accent).lerp(new THREE.Color(0x729b60), 0.78),
    roughness: 0.82,
    metalness: 0,
    transparent: true,
    opacity: 0.96,
    alphaTest: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: true
  });
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.3, 0.46), leafMaterial, leafCount);
  leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const leafDummy = new THREE.Object3D();
  const leafColor = new THREE.Color();
  for (let index = 0; index < leafCount; index += 1) {
    const ratio = index / Math.max(1, leafCount - 1);
    const phase = index * 2.399 + variant * 0.81;
    const base = {
      x: -1.18 + ratio * 2.36 + Math.sin(phase) * 0.21,
      y: 0.18 + Math.sin(ratio * Math.PI) * 1.44 + Math.cos(phase * 0.78) * 0.22,
      z: Math.cos(phase) * 0.42 + (ratio - 0.5) * 0.24,
      phase,
      scale: 0.7 + index % 5 * 0.095
    };
    leafBases.push(base);
    leafDummy.position.set(base.x, base.y, base.z);
    leafDummy.rotation.set(phase * 0.37, phase * 0.61, -0.72 + phase * 0.23);
    leafDummy.scale.setScalar(base.scale);
    leafDummy.updateMatrix();
    leaves.setMatrixAt(index, leafDummy.matrix);
    leafColor.setHex(index % 5 === 0 ? 0xc7d984 : index % 3 === 0 ? 0x527d4d : 0x86ad63);
    leaves.setColorAt(index, leafColor);
  }
  leaves.instanceMatrix.needsUpdate = true;
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  leaves.frustumCulled = false;

  const wakeMaterial = new THREE.SpriteMaterial({
    map: getCampusMistTexture(),
    color: 0xc9ebe1,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  });
  const wakes = [];
  for (let index = 0; index < 3; index += 1) {
    const wake = new THREE.Sprite(wakeMaterial.clone());
    wake.scale.set(2.1 - index * 0.25, 0.62 + index * 0.12, 1);
    wake.position.set((index - 1) * 0.42, 0.56 + index * 0.38, -0.12 + index * 0.09);
    wake.material.opacity = 0.12 + index * 0.035;
    wakes.push(wake);
    group.add(wake);
  }
  group.add(leaves);
  group.userData.kind = "campus-leaf-gust";
  group.userData.obstacleSignature = "camphor-leaf-gust";
  group.userData.campusEffect = {
    kind: "leaf-gust",
    leaves,
    wakes,
    leafBases,
    leafDummy
  };
  return group;
}

function createCampusCanopyObstacle(accent, variant = 0) {
  const group = new THREE.Group();
  const branchSide = variant % 2 ? -1 : 1;
  const canopyMaterial = new THREE.MeshBasicMaterial({
    map: getCampusCanopyArtTexture(),
    color: 0xffffff,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const canopy = mesh(new THREE.PlaneGeometry(5.55, 4.84), canopyMaterial);
  canopy.position.set(branchSide * 1.12, 2.65, 0);
  canopy.scale.x = branchSide;
  canopy.renderOrder = 7;

  const dropletGeometry = new THREE.BufferGeometry();
  const dropletPositions = new Float32Array(14 * 3);
  for (let index = 0; index < 14; index += 1) {
    dropletPositions[index * 3] = -1.58 + index / 13 * 3.16 + Math.sin(index * 2.4) * 0.1;
    dropletPositions[index * 3 + 1] = 1.08 + index % 4 * 0.2;
    dropletPositions[index * 3 + 2] = Math.cos(index * 1.8) * 0.26;
  }
  dropletGeometry.setAttribute("position", new THREE.BufferAttribute(dropletPositions, 3));
  const droplets = new THREE.Points(dropletGeometry, new THREE.PointsMaterial({
    map: getCampusLightMoteTexture(),
    color: 0xc7f2ed,
    size: 0.1,
    transparent: true,
    opacity: 0.62,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  }));
  group.add(canopy, droplets);
  group.userData.kind = "campus-canopy";
  group.userData.obstacleSignature = "low-camphor-canopy";
  group.userData.campusEffect = { kind: "canopy", canopy, droplets, baseY: canopy.position.y };
  return group;
}

function createCampusStudentStreamObstacle(accent, variant = 0) {
  const group = new THREE.Group();
  const skin = campusToonMaterial(0xe1b18c, { name: "campus-student-skin" });
  const hair = campusToonMaterial(variant % 2 ? 0x3b2b2a : 0x25272d, { name: "campus-student-hair" });
  const uniform = campusToonMaterial(0x526a82, { name: "campus-student-uniform" });
  const shirt = campusToonMaterial(0xe9eee8, { name: "campus-student-shirt" });
  const bag = campusToonMaterial(0xa9685e, { name: "campus-student-bag" });
  const ink = new THREE.MeshBasicMaterial({ color: 0x26383d, toneMapped: false });
  const studentX = [-0.5, 0.5];
  const studentZ = [0.12, -0.12];
  const torsos = createCampusInstancedBatch(
    roundedPanelGeometry(0.48, 0.72, 0.28, 0.1),
    uniform,
    studentX.map((x, index) => ({ x, y: 1.3, z: studentZ[index], rz: index ? -0.07 : 0.07 })),
    [0x536f89, 0x765f82]
  );
  const shirtPanels = createCampusInstancedBatch(
    roundedPanelGeometry(0.28, 0.19, 0.045, 0.04),
    shirt,
    studentX.map((x, index) => ({ x, y: 1.48, z: studentZ[index] + 0.17 }))
  );
  const heads = createCampusInstancedBatch(
    new THREE.SphereGeometry(0.235, 16, 12),
    skin,
    studentX.map((x, index) => ({ x, y: 1.96, z: studentZ[index], sx: 0.92, sy: 1.04, sz: 0.94 }))
  );
  const hairCaps = createCampusInstancedBatch(
    new THREE.SphereGeometry(0.25, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.69),
    hair,
    studentX.map((x, index) => ({ x, y: 2.04, z: studentZ[index] + 0.005, sx: index ? 0.96 : 1, sy: 1.04, sz: 0.98 })),
    [0x292a32, 0x4a302d]
  );
  const legs = createCampusInstancedBatch(
    new THREE.CapsuleGeometry(0.075, 0.49, 4, 8),
    ink,
    studentX.flatMap((x, index) => [
      { x: x - 0.11, y: 0.5, z: studentZ[index], rz: index ? -0.15 : 0.2 },
      { x: x + 0.11, y: 0.5, z: studentZ[index], rz: index ? 0.18 : -0.12 }
    ])
  );
  const shoes = createCampusInstancedBatch(
    roundedPanelGeometry(0.16, 0.11, 0.29, 0.04),
    ink,
    studentX.flatMap((x, index) => [
      { x: x - 0.13, y: 0.18, z: studentZ[index] + 0.08, rz: index ? -0.1 : 0.14 },
      { x: x + 0.13, y: 0.18, z: studentZ[index] + 0.08, rz: index ? 0.14 : -0.08 }
    ])
  );
  const arms = createCampusInstancedBatch(
    new THREE.CapsuleGeometry(0.05, 0.42, 4, 8),
    skin,
    studentX.flatMap((x, index) => [
      { x: x - 0.28, y: 1.25, z: studentZ[index], rz: index ? 0.22 : 0.34 },
      { x: x + 0.28, y: 1.25, z: studentZ[index], rz: index ? -0.34 : -0.22 }
    ])
  );
  const backpacks = createCampusInstancedBatch(
    roundedPanelGeometry(0.36, 0.44, 0.15, 0.08),
    bag,
    studentX.map((x, index) => ({ x, y: 1.28, z: studentZ[index] - 0.24, rz: index ? -0.06 : 0.06 })),
    [0xc28a5d, 0x9d5e68]
  );
  const skirt = mesh(roundedPanelGeometry(0.5, 0.27, 0.29, 0.06), campusToonMaterial(0x394f68, { name: "campus-student-skirt" }));
  skirt.position.set(-0.5, 0.91, 0.12);
  const trousers = mesh(roundedPanelGeometry(0.46, 0.31, 0.28, 0.06), campusToonMaterial(0x42545d, { name: "campus-student-trousers" }));
  trousers.position.set(0.5, 0.9, -0.12);
  const ponytail = mesh(new THREE.CapsuleGeometry(0.09, 0.28, 4, 8), hair);
  ponytail.position.set(-0.5, 1.83, -0.2);
  ponytail.rotation.x = 0.28;

  const umbrellaFabric = campusToonMaterial(0xb7d8d8, { name: "campus-folded-umbrella" });
  const umbrella = mesh(new THREE.ConeGeometry(0.12, 0.88, 10), umbrellaFabric);
  umbrella.position.set(-0.86, 0.78, 0.08);
  umbrella.rotation.z = -0.22;
  const umbrellaStem = mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.08, 6), ink);
  umbrellaStem.position.set(-0.76, 1.08, 0.08);
  umbrellaStem.rotation.z = -0.22;
  group.add(
    torsos, shirtPanels, heads, hairCaps, legs, shoes, arms, backpacks,
    skirt, trousers, ponytail, umbrella, umbrellaStem
  );
  group.userData.kind = "campus-student-stream";
  group.userData.obstacleSignature = "departing-student-stream";
  group.userData.campusEffect = { kind: "student-stream", students: group.children };
  return group;
}

function createCampusRootPuddleObstacle(accent, variant = 0) {
  const group = createCampusPuddleObstacle(accent, variant);
  const rootMaterial = campusToonMaterial(0x694d3d, { name: "campus-raised-root" });
  const rootInk = new THREE.MeshBasicMaterial({ color: 0x283b3b, toneMapped: false });
  const root = mesh(new THREE.TorusGeometry(1.02, 0.13, 7, 22, Math.PI * 1.08), rootMaterial);
  root.rotation.set(Math.PI / 2, 0.08, -0.08);
  root.scale.set(1.12, 0.76, 1);
  root.position.set(-0.12, 0.15, 0.08);
  const rootShadow = mesh(new THREE.TorusGeometry(1.05, 0.17, 7, 22, Math.PI * 1.08), rootInk);
  rootShadow.rotation.copy(root.rotation);
  rootShadow.scale.copy(root.scale).multiplyScalar(1.035);
  rootShadow.position.copy(root.position);
  rootShadow.position.y = 0.105;
  group.add(rootShadow, root);
  group.userData.kind = "campus-root-puddle";
  group.userData.obstacleSignature = "camphor-root-puddle";
  group.userData.campusEffect.kind = "root-puddle";
  return group;
}

function createCampusDeliveryRailObstacle(accent, variant = 0) {
  const group = new THREE.Group();
  const railMaterial = campusToonMaterial(0x6e7d7f, { name: "campus-library-delivery-rail" });
  const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0x283b40, toneMapped: false });
  const warning = campusToonMaterial(0xf0b45f, { emissive: 0xdf7c3f, emissiveIntensity: 0.46, name: "campus-rail-reflector" });
  [-1.03, 1.03].forEach((x) => {
    const post = mesh(new THREE.BoxGeometry(0.16, 2.28, 0.18), railMaterial);
    post.position.set(x, 1.14, 0);
    const foot = mesh(new THREE.BoxGeometry(0.5, 0.1, 0.6), edgeMaterial);
    foot.position.set(x, 0.06, 0);
    group.add(post, foot);
  });
  const beam = mesh(new THREE.BoxGeometry(2.2, 0.22, 0.24), railMaterial);
  beam.position.y = 1.72;
  const inkBeam = mesh(new THREE.BoxGeometry(2.3, 0.055, 0.28), edgeMaterial);
  inkBeam.position.y = 1.84;
  [-0.72, 0, 0.72].forEach((x) => {
    const reflector = mesh(new THREE.BoxGeometry(0.2, 0.08, 0.05), warning);
    reflector.position.set(x, 1.72, 0.15);
    group.add(reflector);
  });
  const bookCart = mesh(new THREE.BoxGeometry(0.86, 0.52, 0.7), campusToonMaterial(variant % 2 ? 0x8b6d58 : 0x6f806c, { name: "campus-book-cart" }));
  bookCart.position.set(0.72, 0.36, -0.24);
  const books = createCampusInstancedBatch(new THREE.BoxGeometry(0.32, 0.07, 0.48), campusToonMaterial(0xd18a67), [
    { x: 0.6, y: 0.68, z: -0.22, ry: 0.08 },
    { x: 0.8, y: 0.76, z: -0.2, ry: -0.12 },
    { x: 0.68, y: 0.84, z: -0.18, ry: 0.04 }
  ], [0xd18a67, 0xe1c381, 0x6d9a91]);
  group.add(beam, inkBeam, bookCart, books);
  group.userData.kind = "campus-delivery-rail";
  group.userData.obstacleSignature = "library-delivery-rail";
  group.userData.campusEffect = { kind: "delivery-rail", warning };
  return group;
}

function createCampusEnvironmentObstacle(avoid, accent, variant = 0, semantic = "") {
  const key = String(semantic || "").toLowerCase();
  if (/student|crowd|stream/.test(key)) return createCampusStudentStreamObstacle(accent, variant);
  if (/root|puddle/.test(key)) return createCampusRootPuddleObstacle(accent, variant);
  if (/delivery|rail|barrier/.test(key)) return createCampusDeliveryRailObstacle(accent, variant);
  if (avoid === "slide") return createCampusDeliveryRailObstacle(accent, variant);
  if (avoid === "switch") return createCampusStudentStreamObstacle(accent, variant);
  return createCampusRootPuddleObstacle(accent, variant);
}

function createJumpBarrier(accent, stageIndex = 0) {
  const group = new THREE.Group();
  const palette = STAGE_OBSTACLE_PALETTES[stageIndex] || STAGE_OBSTACLE_PALETTES[0];
  const steel = material(palette.metal, { roughness: 0.4, metalness: 0.58 });
  const stripeTexture = makeWarningStripeTexture(accent);
  const board = mesh(roundedPanelGeometry(2.05, 0.72, 0.2, 0.1), texturedObstacleMaterial(stageIndex, palette.primary, { roughness: 0.52, metalness: stageIndex === 2 || stageIndex === 5 ? 0.42 : 0.16 }), true);
  board.position.y = 0.72;
  const face = mesh(new THREE.PlaneGeometry(1.8, 0.5), new THREE.MeshBasicMaterial({ map: stripeTexture }));
  face.position.set(0, 0.72, 0.105);
  group.add(board, face);
  const warningBeacons = [];
  [-0.78, 0.78].forEach((x) => {
    const leg = mesh(new THREE.BoxGeometry(0.11, 1.05, 0.16), steel, true);
    leg.position.set(x, 0.5, 0);
    const foot = mesh(new THREE.BoxGeometry(0.42, 0.1, 0.52), steel, true);
    foot.position.set(x, 0.08, 0);
    const beacon = mesh(new THREE.SphereGeometry(0.095, 12, 8), material(0xffc44d, { emissive: 0xff9c2f, emissiveIntensity: 4.5, roughness: 0.2 }));
    beacon.position.set(x, 1.18, 0);
    warningBeacons.push(beacon);
    group.add(leg, foot, beacon);
  });
  group.userData.kind = "barrier";
  group.userData.warningBeacons = warningBeacons;
  return group;
}

function createSignalGate(accent, stageIndex = 0) {
  const group = new THREE.Group();
  const palette = STAGE_OBSTACLE_PALETTES[stageIndex] || STAGE_OBSTACLE_PALETTES[0];
  const steel = material(palette.metal, { roughness: 0.36, metalness: 0.72 });
  [-1.02, 1.02].forEach((x) => {
    const post = mesh(new THREE.BoxGeometry(0.12, 2.45, 0.16), steel, true);
    post.position.set(x, 1.22, 0);
    const foot = mesh(new THREE.BoxGeometry(0.46, 0.1, 0.5), steel, true);
    foot.position.set(x, 0.06, 0);
    group.add(post, foot);
  });
  const warningTexture = makeWarningStripeTexture(accent);
  const beam = mesh(roundedPanelGeometry(2.22, 0.58, 0.22, 0.1), texturedObstacleMaterial(stageIndex, palette.primary, { roughness: 0.44, metalness: 0.46 }), true);
  beam.position.y = 1.92;
  const face = mesh(new THREE.PlaneGeometry(1.92, 0.42), new THREE.MeshBasicMaterial({ map: warningTexture }));
  face.position.set(0, 1.92, 0.116);
  const arrowMaterial = material(accent, { emissive: accent, emissiveIntensity: 3.8, roughness: 0.18 });
  const warningBeacons = [];
  [-0.68, 0, 0.68].forEach((x) => {
    const beacon = mesh(new THREE.ConeGeometry(0.1, 0.22, 3), arrowMaterial);
    beacon.rotation.z = Math.PI;
    beacon.position.set(x, 1.9, 0.17);
    warningBeacons.push(beacon);
    group.add(beacon);
  });
  group.add(beam, face);
  group.userData.kind = "signal-gate";
  group.userData.warningBeacons = warningBeacons;
  return group;
}

const STAGE_OBSTACLE_PALETTES = Object.freeze([
  Object.freeze({ primary: 0x426b70, secondary: 0xd5c7a8, metal: 0x233238, soft: 0xa9d4d3 }),
  Object.freeze({ primary: 0x805741, secondary: 0xe0c897, metal: 0x24363a, soft: 0x9dc7bc }),
  Object.freeze({ primary: 0x292448, secondary: 0xb96ad3, metal: 0x171828, soft: 0x67dff2 }),
  Object.freeze({ primary: 0xa35139, secondary: 0xf0c36f, metal: 0x433128, soft: 0xe58d62 }),
  Object.freeze({ primary: 0x6c8157, secondary: 0xd3b07b, metal: 0x38443b, soft: 0xb8c69d }),
  Object.freeze({ primary: 0x44586d, secondary: 0xc8d3d8, metal: 0x202b35, soft: 0x7cc9db }),
  Object.freeze({ primary: 0x64728e, secondary: 0xc79e78, metal: 0x303748, soft: 0x9ecbe0 })
]);
const obstacleSurfaceTextureCache = new Map();
let obstacleContactShadowTexture = null;

function stageObstacleSurfaceTexture(stageIndex) {
  if (obstacleSurfaceTextureCache.has(stageIndex)) return obstacleSurfaceTextureCache.get(stageIndex);
  const texture = canvasTexture(192, 192, (context, width, height) => {
    const bases = ["#688388", "#7d5a44", "#25284d", "#9b543d", "#71815e", "#4b6073", "#6c7894"];
    context.fillStyle = bases[stageIndex] || bases[0];
    context.fillRect(0, 0, width, height);
    let seed = 1931 + stageIndex * 277;
    for (let index = 0; index < 900; index += 1) {
      seed = seed * 48271 % 2147483647;
      const x = seed % width;
      seed = seed * 48271 % 2147483647;
      const y = seed % height;
      const alpha = 0.025 + seed % 18 / 260;
      context.fillStyle = seed % 3 ? `rgba(255,255,255,${alpha})` : `rgba(7,12,15,${alpha})`;
      context.fillRect(x, y, 1 + seed % 5, 1);
    }
    if (stageIndex === 0) {
      for (let y = 16; y < height; y += 38) {
        context.strokeStyle = "rgba(210,240,235,.18)";
        context.beginPath();
        context.arc(24 + y % 29, y, 11, 0.1, Math.PI * 1.65);
        context.stroke();
      }
    } else if (stageIndex === 1 || stageIndex === 3 || stageIndex === 4) {
      for (let y = 0; y < height; y += 24) {
        context.strokeStyle = stageIndex === 3 ? "rgba(255,204,129,.12)" : "rgba(49,26,17,.18)";
        context.beginPath();
        context.moveTo(0, y + Math.sin(y) * 2);
        context.bezierCurveTo(48, y - 4, 132, y + 5, width, y - 1);
        context.stroke();
      }
    } else if (stageIndex === 2) {
      context.strokeStyle = "rgba(89,232,246,.44)";
      context.lineWidth = 2;
      for (let y = 18; y < height; y += 42) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(52, y);
        context.lineTo(67, y + 14);
        context.lineTo(width, y + 14);
        context.stroke();
      }
    } else if (stageIndex === 5) {
      for (let y = 12; y < height; y += 34) {
        context.fillStyle = "rgba(220,235,240,.16)";
        context.fillRect(0, y, width, 2);
        for (let x = 14; x < width; x += 32) {
          context.beginPath();
          context.arc(x, y - 5, 2, 0, Math.PI * 2);
          context.fill();
        }
      }
    } else {
      for (let x = 0; x < width; x += 18) {
        context.fillStyle = x % 36 ? "rgba(255,255,255,.07)" : "rgba(12,20,34,.09)";
        context.fillRect(x, 0, 2, height);
      }
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.4, 1.4);
  SHARED_TEXTURES.add(texture);
  obstacleSurfaceTextureCache.set(stageIndex, texture);
  return texture;
}

function texturedObstacleMaterial(stageIndex, color, options = {}) {
  const obstacleMaterial = material(color, options);
  obstacleMaterial.map = stageObstacleSurfaceTexture(stageIndex);
  obstacleMaterial.envMapIntensity = stageIndex === 2 || stageIndex === 5 ? 0.96 : 0.58;
  return obstacleMaterial;
}

function paletteObstacleMaterial(palette, color, options = {}) {
  return texturedObstacleMaterial(Math.max(0, STAGE_OBSTACLE_PALETTES.indexOf(palette)), color, options);
}

function obstacleShadowTexture() {
  if (obstacleContactShadowTexture) return obstacleContactShadowTexture;
  obstacleContactShadowTexture = canvasTexture(128, 128, (context, width, height) => {
    const shadow = context.createRadialGradient(width / 2, height / 2, 4, width / 2, height / 2, width / 2);
    shadow.addColorStop(0, "rgba(0,0,0,.68)");
    shadow.addColorStop(0.52, "rgba(0,0,0,.32)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = shadow;
    context.fillRect(0, 0, width, height);
  });
  SHARED_TEXTURES.add(obstacleContactShadowTexture);
  return obstacleContactShadowTexture;
}

function addObstacleContactShadow(group) {
  const shadow = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.35, 1.65), new THREE.MeshBasicMaterial({
    map: obstacleShadowTexture(),
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    toneMapped: false
  }), 1);
  const transform = new THREE.Matrix4().compose(
    new THREE.Vector3(0, 0.018, 0),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
    new THREE.Vector3(1, 1, 1)
  );
  shadow.setMatrixAt(0, transform);
  shadow.instanceMatrix.needsUpdate = true;
  shadow.renderOrder = 1;
  shadow.userData.sharedTexture = obstacleContactShadowTexture;
  group.add(shadow);
  return group;
}

function createInstancedObstacleParts(geometry, partMaterial, transforms) {
  const parts = new THREE.InstancedMesh(geometry, partMaterial, transforms.length);
  const transform = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  transforms.forEach((entry, index) => {
    quaternion.setFromEuler(new THREE.Euler(entry.rx || 0, entry.ry || 0, entry.rz || 0));
    scale.set(entry.sx || 1, entry.sy || 1, entry.sz || 1);
    transform.compose(new THREE.Vector3(entry.x || 0, entry.y || 0, entry.z || 0), quaternion, scale);
    parts.setMatrixAt(index, transform);
  });
  parts.instanceMatrix.needsUpdate = true;
  parts.castShadow = true;
  parts.receiveShadow = true;
  return parts;
}

function finishStageServiceObstacle(group, accent, warningBeacons = []) {
  group.userData.kind = "service-cart";
  group.userData.warningBeacons = warningBeacons;
  const glowMaterial = material(accent, { emissive: accent, emissiveIntensity: 4.8, roughness: 0.16, metalness: 0.12 });
  [-0.62, 0.62].forEach((x) => {
    const beacon = mesh(new THREE.SphereGeometry(0.085, 12, 8), glowMaterial);
    beacon.position.set(x, 2.18, 0.16);
    warningBeacons.push(beacon);
    group.add(beacon);
  });
  return group;
}

function createCampusCycleObstacle(accent, palette) {
  const group = new THREE.Group();
  const metal = material(0x53666a, { roughness: 0.34, metalness: 0.72 });
  const frame = paletteObstacleMaterial(palette, 0x5f999b, { roughness: 0.4, metalness: 0.38 });
  const rubber = material(0x273235, { roughness: 0.82, metalness: 0.02 });
  const wheels = createInstancedObstacleParts(new THREE.TorusGeometry(0.48, 0.058, 10, 32), rubber, [
    { x: -0.62, y: 0.56 }, { x: 0.62, y: 0.56 }
  ]);
  const spokeTransforms = [];
  [-0.62, 0.62].forEach((x) => {
    for (let index = 0; index < 8; index += 1) {
      spokeTransforms.push({ x, y: 0.56, rz: index * Math.PI / 4, sy: 0.94 });
    }
  });
  const spokes = createInstancedObstacleParts(new THREE.BoxGeometry(0.014, 0.88, 0.014), material(0x9aa8a8, { roughness: 0.3, metalness: 0.82 }), spokeTransforms);
  const rearTube = beamBetween2D(-0.54, 0.62, 0.08, 1.32, 0.072, frame);
  const frontTube = beamBetween2D(0.08, 1.32, 0.57, 0.64, 0.072, frame);
  const chainStay = beamBetween2D(-0.54, 0.62, 0.57, 0.64, 0.066, frame);
  const downTube = beamBetween2D(-0.54, 0.62, 0.24, 0.92, 0.066, frame);
  const seatTube = beamBetween2D(0.24, 0.92, 0.08, 1.32, 0.062, frame);
  const fork = beamBetween2D(0.57, 0.64, 0.5, 1.56, 0.055, metal);
  const handleStem = beamBetween2D(0.5, 1.56, 0.64, 1.74, 0.05, metal);
  const seatPost = beamBetween2D(0.08, 1.32, -0.02, 1.57, 0.045, metal);
  const handlebar = mesh(new THREE.BoxGeometry(0.54, 0.045, 0.18), metal, true);
  handlebar.position.set(0.64, 1.75, 0.02);
  const seat = mesh(roundedPanelGeometry(0.42, 0.1, 0.22, 0.04), material(0x513f36, { roughness: 0.78 }), true);
  seat.position.set(-0.05, 1.6, 0);
  seat.rotation.z = -0.06;
  const crank = mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 24), metal, true);
  crank.position.set(0.24, 0.92, 0.07);
  const pedal = mesh(new THREE.BoxGeometry(0.42, 0.035, 0.06), metal, true);
  pedal.position.set(0.24, 0.92, 0.09);
  pedal.rotation.z = -0.48;
  const fenders = createInstancedObstacleParts(new THREE.TorusGeometry(0.5, 0.022, 7, 28, Math.PI * 1.08), material(0xaeb8b6, { roughness: 0.34, metalness: 0.72 }), [
    { x: -0.62, y: 0.56, rz: -0.12 }, { x: 0.62, y: 0.56, rz: -0.12 }
  ]);
  const basketMaterial = material(0xb99d72, { roughness: 0.72, metalness: 0.14 });
  const basketBars = createInstancedObstacleParts(new THREE.BoxGeometry(0.035, 0.38, 0.035), basketMaterial, Array.from({ length: 5 }, (_, index) => ({
    x: 0.38 + index * 0.12,
    y: 1.49,
    z: 0.08
  })));
  const basketRim = mesh(roundedPanelGeometry(0.64, 0.06, 0.38, 0.025), basketMaterial, true);
  basketRim.position.set(0.62, 1.7, 0.08);
  const reflector = mesh(new THREE.CircleGeometry(0.055, 14), material(0xffbd52, { emissive: 0xff9f38, emissiveIntensity: 2.2, side: THREE.DoubleSide }));
  reflector.position.set(-0.62, 1.22, 0.08);
  group.add(wheels, spokes, rearTube, frontTube, chainStay, downTube, seatTube, fork, handleStem, seatPost, handlebar, seat, crank, pedal, fenders, basketBars, basketRim, reflector);
  group.rotation.y = -0.08;
  group.userData.kind = "service-cart";
  group.userData.warningBeacons = [reflector];
  return group;
}

function createBookTrolleyObstacle(accent, palette) {
  const group = new THREE.Group();
  const frame = material(palette.metal, { roughness: 0.4, metalness: 0.66 });
  const wood = paletteObstacleMaterial(palette, palette.primary, { roughness: 0.78, metalness: 0.04 });
  const shelf = createInstancedObstacleParts(roundedPanelGeometry(1.72, 0.14, 0.72, 0.05), wood, [
    { y: 0.48 }, { y: 1.06 }, { y: 1.64 }
  ]);
  const rails = createInstancedObstacleParts(new THREE.BoxGeometry(0.08, 1.72, 0.08), frame, [
    { x: -0.76, y: 1.08, z: -0.28 }, { x: 0.76, y: 1.08, z: -0.28 },
    { x: -0.76, y: 1.08, z: 0.28 }, { x: 0.76, y: 1.08, z: 0.28 }
  ]);
  const bookMaterial = material(palette.secondary, { roughness: 0.82, metalness: 0.01 });
  const books = createInstancedObstacleParts(roundedPanelGeometry(0.18, 0.48, 0.5, 0.025), bookMaterial, Array.from({ length: 9 }, (_, index) => ({
    x: -0.61 + index % 5 * 0.3,
    y: index < 5 ? 0.77 : 1.35,
    z: 0.02,
    rz: (index % 3 - 1) * 0.06,
    sy: 0.82 + index % 3 * 0.09
  })));
  const wheels = createInstancedObstacleParts(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 14), material(0x202326, { roughness: 0.78 }), [
    { x: -0.66, y: 0.2, z: -0.28, rz: Math.PI / 2 }, { x: 0.66, y: 0.2, z: -0.28, rz: Math.PI / 2 },
    { x: -0.66, y: 0.2, z: 0.28, rz: Math.PI / 2 }, { x: 0.66, y: 0.2, z: 0.28, rz: Math.PI / 2 }
  ]);
  group.add(shelf, rails, books, wheels);
  return finishStageServiceObstacle(group, accent);
}

function createCinemaProjectorObstacle(accent, palette) {
  const group = new THREE.Group();
  const shell = paletteObstacleMaterial(palette, palette.primary, { roughness: 0.28, metalness: 0.58, emissive: accent, emissiveIntensity: 0.08 });
  const body = mesh(roundedPanelGeometry(1.58, 1.3, 1.02, 0.18), shell, true);
  body.position.y = 0.9;
  const reelMaterial = material(palette.secondary, { roughness: 0.3, metalness: 0.72 });
  const reels = createInstancedObstacleParts(new THREE.TorusGeometry(0.3, 0.055, 8, 24), reelMaterial, [
    { x: -0.34, y: 1.78, z: 0.52 }, { x: 0.34, y: 1.78, z: 0.52, sx: 0.82, sy: 0.82 }
  ]);
  const lens = mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.42, 18), material(palette.soft, { emissive: accent, emissiveIntensity: 2.8, roughness: 0.12, metalness: 0.34 }), true);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 1.12, 0.68);
  const stand = mesh(roundedPanelGeometry(1.78, 0.14, 1.18, 0.05), material(palette.metal, { roughness: 0.36, metalness: 0.72 }), true);
  stand.position.y = 0.2;
  group.add(body, reels, lens, stand);
  return finishStageServiceObstacle(group, accent);
}

function createMarketStallObstacle(accent, palette) {
  const group = new THREE.Group();
  const lacquer = paletteObstacleMaterial(palette, palette.primary, { roughness: 0.58, metalness: 0.06 });
  const dark = material(palette.metal, { roughness: 0.5, metalness: 0.4 });
  const base = mesh(roundedPanelGeometry(1.78, 1.02, 1.2, 0.14), lacquer, true);
  base.position.y = 0.64;
  const counter = mesh(roundedPanelGeometry(2.02, 0.18, 1.42, 0.06), material(palette.secondary, { roughness: 0.82 }), true);
  counter.position.y = 1.22;
  const canopy = mesh(new THREE.ConeGeometry(1.34, 0.64, 4), material(palette.soft, { roughness: 0.72 }), true);
  canopy.rotation.y = Math.PI / 4;
  canopy.position.y = 2.42;
  const posts = createInstancedObstacleParts(new THREE.BoxGeometry(0.075, 1.3, 0.075), dark, [
    { x: -0.82, y: 1.78, z: -0.42 }, { x: 0.82, y: 1.78, z: -0.42 },
    { x: -0.82, y: 1.78, z: 0.42 }, { x: 0.82, y: 1.78, z: 0.42 }
  ]);
  const baskets = createInstancedObstacleParts(new THREE.CylinderGeometry(0.23, 0.19, 0.28, 10), material(0xc98a4e, { roughness: 0.92 }), [
    { x: -0.52, y: 1.48, z: 0.12 }, { y: 1.48, z: 0.12 }, { x: 0.52, y: 1.48, z: 0.12 }
  ]);
  group.add(base, counter, canopy, posts, baskets);
  return finishStageServiceObstacle(group, accent);
}

function createCargoBikeObstacle(accent, palette) {
  const group = createCampusCycleObstacle(accent, palette);
  const crate = mesh(roundedPanelGeometry(0.92, 0.72, 0.82, 0.08), paletteObstacleMaterial(palette, palette.secondary, { roughness: 0.9, metalness: 0.01 }), true);
  crate.position.set(-0.58, 1.28, 0.02);
  const canvas = mesh(roundedPanelGeometry(0.8, 0.12, 0.7, 0.04), material(0xe9dfc8, { roughness: 0.96 }), true);
  canvas.position.set(-0.58, 1.68, 0.02);
  group.add(crate, canvas);
  return group;
}

function createStormRigObstacle(accent, palette) {
  const group = new THREE.Group();
  const steel = material(palette.metal, { roughness: 0.32, metalness: 0.76 });
  const frame = createInstancedObstacleParts(new THREE.BoxGeometry(0.1, 1.86, 0.1), steel, [
    { x: -0.78, y: 1.05, z: -0.44 }, { x: 0.78, y: 1.05, z: -0.44 },
    { x: -0.78, y: 1.05, z: 0.44 }, { x: 0.78, y: 1.05, z: 0.44 }
  ]);
  const deck = mesh(roundedPanelGeometry(1.82, 0.18, 1.18, 0.05), paletteObstacleMaterial(palette, palette.primary, { roughness: 0.38, metalness: 0.62 }), true);
  deck.position.y = 0.32;
  const tank = mesh(new THREE.CylinderGeometry(0.52, 0.52, 1.24, 18), material(palette.secondary, { roughness: 0.3, metalness: 0.58 }), true);
  tank.rotation.z = Math.PI / 2;
  tank.position.y = 1.12;
  const hose = mesh(new THREE.TorusGeometry(0.46, 0.055, 8, 28, Math.PI * 1.7), material(palette.soft, { roughness: 0.5, metalness: 0.2 }), true);
  hose.position.set(0, 1.35, 0.56);
  group.add(frame, deck, tank, hose);
  return finishStageServiceObstacle(group, accent);
}

function createLuggageTrolleyObstacle(accent, palette) {
  const group = new THREE.Group();
  const frame = material(palette.metal, { roughness: 0.34, metalness: 0.76 });
  const platform = mesh(roundedPanelGeometry(1.72, 0.14, 1.05, 0.05), frame, true);
  platform.position.y = 0.28;
  const handle = createInstancedObstacleParts(new THREE.BoxGeometry(0.08, 1.84, 0.08), frame, [
    { x: -0.72, y: 1.2, z: -0.42 }, { x: 0.72, y: 1.2, z: -0.42 }
  ]);
  const luggageMaterial = paletteObstacleMaterial(palette, palette.primary, { roughness: 0.58, metalness: 0.12 });
  const luggage = createInstancedObstacleParts(roundedPanelGeometry(0.62, 0.76, 0.42, 0.1), luggageMaterial, [
    { x: -0.42, y: 0.74, z: 0.05 }, { x: 0.34, y: 0.82, z: 0.02, sy: 1.18 }, { x: -0.1, y: 1.47, z: -0.02, sx: 0.82, sy: 0.76 }
  ]);
  const wheels = createInstancedObstacleParts(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 14), material(0x1d2024, { roughness: 0.82 }), [
    { x: -0.62, y: 0.14, z: -0.34, rz: Math.PI / 2 }, { x: 0.62, y: 0.14, z: -0.34, rz: Math.PI / 2 },
    { x: -0.62, y: 0.14, z: 0.34, rz: Math.PI / 2 }, { x: 0.62, y: 0.14, z: 0.34, rz: Math.PI / 2 }
  ]);
  group.add(platform, handle, luggage, wheels);
  return finishStageServiceObstacle(group, accent);
}

function createServiceCart(accent, stageIndex = 0) {
  const palette = STAGE_OBSTACLE_PALETTES[stageIndex] || STAGE_OBSTACLE_PALETTES[0];
  return [
    createCampusCycleObstacle,
    createBookTrolleyObstacle,
    createCinemaProjectorObstacle,
    createMarketStallObstacle,
    createCargoBikeObstacle,
    createStormRigObstacle,
    createLuggageTrolleyObstacle
  ][stageIndex](accent, palette);
}

function decorateObstacleForStage(group, stageIndex, subtype, avoid, accent) {
  const glow = material(accent, { emissive: accent, emissiveIntensity: 2.6, roughness: 0.22, metalness: 0.18 });
  const dark = material([0x345052, 0x564436, 0x241d36, 0x50303f, 0x486044, 0x333c48, 0x3e465c][stageIndex], { roughness: 0.62, metalness: stageIndex === 5 || stageIndex === 6 ? 0.52 : 0.16 });
  if (stageIndex === 0) {
    const puddle = mesh(new THREE.RingGeometry(0.52, 0.82, 22), new THREE.MeshBasicMaterial({ color: 0x9fdce2, transparent: true, opacity: 0.52, depthWrite: false, side: THREE.DoubleSide }));
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.y = 0.025;
    const leaf = mesh(new THREE.ConeGeometry(0.14, 0.42, 5), glow);
    leaf.position.set(0, avoid === "slide" ? 1.72 : 1.34, 0.18);
    leaf.rotation.z = -0.72;
    group.add(puddle, leaf);
    group.userData.obstacleSignature = "puddle-barricade";
  } else if (stageIndex === 1) {
    if (subtype === "service-cart") {
      for (let index = 0; index < 5; index += 1) {
        const book = mesh(new THREE.BoxGeometry(0.54, 0.1, 0.72), material(index % 2 ? 0xc9695d : 0xe6d59d, { roughness: 0.86 }));
        book.position.set((index % 2 ? 0.22 : -0.18), 2.16 + index * 0.105, -0.18 + index % 3 * 0.16);
        book.rotation.y = (index - 2) * 0.08;
        group.add(book);
      }
    } else {
      [-0.55, 0.55].forEach((x) => {
        const wheel = mesh(new THREE.TorusGeometry(0.34, 0.045, 7, 20), dark);
        wheel.position.set(x, 0.48, 0.12);
        group.add(wheel);
      });
    }
    group.userData.obstacleSignature = subtype === "service-cart" ? "book-cart" : avoid === "slide" ? "canvas-awning" : "bicycle-wheel";
  } else if (stageIndex === 2) {
    const ticket = mesh(roundedPanelGeometry(1.08, 0.48, 0.08, 0.08), glow);
    ticket.position.set(0, subtype === "train" ? 2.42 : 2.28, subtype === "train" ? 3.62 : 1.18);
    for (let index = -2; index <= 2; index += 1) {
      const bulb = mesh(new THREE.SphereGeometry(0.045, 8, 6), material(index % 2 ? accent : 0xff8a78, { emissive: index % 2 ? accent : 0xff8a78, emissiveIntensity: 3.8 }));
      bulb.position.set(index * 0.23, ticket.position.y + 0.2, ticket.position.z + 0.06);
      group.add(bulb);
    }
    group.add(ticket);
    group.userData.obstacleSignature = subtype === "train" ? "service-tram" : "marquee-gate";
  } else if (stageIndex === 3) {
    if (avoid === "slide") {
      const canopy = mesh(new THREE.ConeGeometry(1.32, 0.72, 4), material(0xff9d61, { roughness: 0.75 }));
      canopy.rotation.y = Math.PI / 4;
      canopy.position.y = 2.45;
      group.add(canopy);
    } else {
      for (let index = 0; index < 3; index += 1) {
        const basket = mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.36, 10), material(index % 2 ? 0xc47e43 : 0x739857, { roughness: 0.95 }));
        basket.position.set((index - 1) * 0.52, 1.4 + index % 2 * 0.24, 1.12);
        group.add(basket);
      }
    }
    const lantern = mesh(new THREE.SphereGeometry(0.13, 10, 8), glow);
    lantern.scale.y = 1.35;
    lantern.position.set(0, 2.68, 0.2);
    group.add(lantern);
    group.userData.obstacleSignature = avoid === "slide" ? "striped-canopy" : subtype === "service-cart" ? "food-cart" : "basket-barrier";
  } else if (stageIndex === 4) {
    for (let index = 0; index < 4; index += 1) {
      const crate = mesh(new THREE.BoxGeometry(0.58, 0.42, 0.5), material(index % 2 ? 0x78905a : 0xc58a52, { roughness: 0.94 }));
      crate.position.set((index % 2 ? 0.34 : -0.34), 1.3 + Math.floor(index / 2) * 0.43, 1.08);
      group.add(crate);
    }
    if (avoid === "slide") {
      const cloth = mesh(new THREE.PlaneGeometry(1.55, 0.58), new THREE.MeshStandardMaterial({ color: 0xe7d7bd, roughness: 0.92, side: THREE.DoubleSide }));
      cloth.position.set(0, 1.85, 0.18);
      group.add(cloth);
    }
    group.userData.obstacleSignature = avoid === "slide" ? "laundry-gate" : subtype === "service-cart" ? "delivery-bike" : "grocery-crates";
  } else if (stageIndex === 5) {
    [-0.62, 0.62].forEach((x, index) => {
      const brace = mesh(new THREE.BoxGeometry(0.1, 1.72, 0.12), index ? glow : dark);
      brace.position.set(x, 1.56, 0.96);
      brace.rotation.z = index ? -0.72 : 0.72;
      group.add(brace);
    });
    const floodMark = mesh(new THREE.RingGeometry(0.28, 0.42, 18), new THREE.MeshBasicMaterial({ color: 0xffd7d2, transparent: true, opacity: 0.78, side: THREE.DoubleSide }));
    floodMark.position.set(0, 1.75, 1.2);
    group.add(floodMark);
    group.userData.obstacleSignature = subtype === "train" ? "maintenance-rig" : avoid === "slide" ? "fallen-truss" : "flood-barrier";
  } else {
    if (subtype === "service-cart" || avoid === "switch") {
      for (let index = 0; index < 3; index += 1) {
        const caseMesh = mesh(roundedPanelGeometry(0.52, 0.62 + index * 0.1, 0.32, 0.08), material(index % 2 ? 0x8f6b78 : 0x6b7991, { roughness: 0.68, metalness: 0.08 }));
        caseMesh.position.set((index - 1) * 0.5, 1.42 + index * 0.2, 1.12);
        group.add(caseMesh);
      }
    }
    const departureRing = mesh(new THREE.TorusGeometry(0.34, 0.045, 8, 24), glow);
    departureRing.position.set(0, 2.42, subtype === "train" ? 3.6 : 1.16);
    group.add(departureRing);
    group.userData.obstacleSignature = subtype === "train" ? "platform-cart" : avoid === "slide" ? "departure-gate" : "luggage-stack";
  }
  group.userData.obstacleStyle = STAGE_CONFIGS[stageIndex].world.obstacles.style;
  return group;
}

function resolveObstacleBaseSubtype(subtype, avoid) {
  const semantic = String(subtype || "").toLowerCase();
  if (/train|tram|metro|transfer/.test(semantic)) return "train";
  if (/gate|awning|canopy|shelf|truss|arch|laundry/.test(semantic) || avoid === "slide") return "signal-gate";
  if (/barrier|puddle|root|flood|warning|crate|grid|step|cable/.test(semantic) || avoid === "jump") return "barrier";
  if (/cart|bike|bicycle|crowd|basket|luggage|stall|delivery|market|rig/.test(semantic)) return "service-cart";
  return avoid === "switch" ? "service-cart" : "barrier";
}

function createObstacle(stageIndex, avoid, accent, subtype = null, variant = 0) {
  if (stageIndex === 0) {
    const campusObstacle = createCampusEnvironmentObstacle(avoid, accent, variant, subtype);
    campusObstacle.userData.obstacleSemantic = subtype || avoid || "campus-route";
    campusObstacle.userData.obstacleVisualSubtype = campusObstacle.userData.kind;
    campusObstacle.userData.obstacleStyle = STAGE_CONFIGS[0].world.obstacles.style;
    return campusObstacle;
  }
  const semanticSubtype = subtype;
  const visualSubtype = resolveObstacleBaseSubtype(subtype, avoid);
  let obstacle;
  if (visualSubtype === "train") obstacle = createTrain(accent, variant);
  else if (visualSubtype === "service-cart") obstacle = createServiceCart(accent, stageIndex);
  else if (visualSubtype === "signal-gate") obstacle = createSignalGate(accent, stageIndex);
  else if (visualSubtype === "barrier") obstacle = createJumpBarrier(accent, stageIndex);
  else obstacle = createServiceCart(accent, stageIndex);
  obstacle = decorateObstacleForStage(obstacle, stageIndex, visualSubtype, avoid, accent);
  obstacle = addObstacleContactShadow(obstacle);
  obstacle.userData.obstacleSemantic = semanticSubtype || visualSubtype;
  obstacle.userData.obstacleVisualSubtype = visualSubtype;
  return obstacle;
}

function createStringLights(accent, width = 7.4, y = 3.6) {
  const group = new THREE.Group();
  const cablePoints = [];
  const bulbs = [];
  const bulbMaterial = material(accent, { emissive: accent, emissiveIntensity: 3.8, roughness: 0.18 });
  for (let index = 0; index <= 12; index += 1) {
    const ratio = index / 12;
    const x = -width / 2 + ratio * width;
    const sag = Math.sin(ratio * Math.PI) * 0.42;
    cablePoints.push(new THREE.Vector3(x, y - sag, 0));
    if (index % 2 === 0) {
      const bulb = mesh(new THREE.SphereGeometry(0.045, 10, 7), bulbMaterial);
      bulb.position.set(x, y - sag - 0.1, 0);
      bulbs.push(bulb);
      group.add(bulb);
    }
  }
  const cable = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cablePoints), new THREE.LineBasicMaterial({ color: 0x202326 }));
  group.add(cable);
  group.userData.bulbs = bulbs;
  return group;
}

function createCinemaFront(accent) {
  const group = new THREE.Group();
  const canopy = mesh(new THREE.BoxGeometry(7.2, 0.2, 1.15), material(0x1a1720, { roughness: 0.32, metalness: 0.62 }), true);
  canopy.position.set(0, 4.15, 0);
  const marquee = mesh(roundedPanelGeometry(3.9, 0.78, 0.18, 0.1), material(0x241d28, { emissive: accent, emissiveIntensity: 0.22, roughness: 0.32, metalness: 0.34 }), true);
  marquee.position.set(0, 4.56, 0.14);
  const signTexture = makeSignTexture("TONIGHT  19:40", accent);
  const sign = mesh(new THREE.PlaneGeometry(3.5, 0.58), new THREE.MeshBasicMaterial({ map: signTexture, transparent: true, toneMapped: false }));
  sign.position.set(0, 4.56, 0.245);
  const bulbMaterial = material(0xffe0a5, { emissive: accent, emissiveIntensity: 3.2, roughness: 0.16 });
  for (let index = 0; index < 11; index += 1) {
    const bulb = mesh(new THREE.SphereGeometry(0.055, 10, 7), bulbMaterial);
    bulb.position.set(-3.25 + index * 0.65, 4.02, 0.54);
    group.add(bulb);
  }
  [-2.75, 2.75].forEach((x, index) => {
    const poster = mesh(roundedPanelGeometry(1.02, 1.65, 0.08, 0.05), material(index ? 0x276a83 : 0x84354d, { emissive: index ? 0x123d52 : 0x4e1c2c, emissiveIntensity: 0.48, roughness: 0.38 }), true);
    poster.position.set(x, 2.42, 0.1);
    group.add(poster);
  });
  group.add(canopy, marquee, sign);
  group.userData.sign = marquee;
  return group;
}

function createArrivalItemDisplay(items, accent, stageIndex) {
  const group = new THREE.Group();
  const selected = Array.isArray(items) ? items.slice(-3) : [];
  const featured = selected[Math.floor(selected.length / 2)] || selected[0] || { kind: "note", color: "gold" };
  const entries = selected.map((item, index) => {
    const prop = createStoryProp(item, accent, null, true);
    const offset = index - (selected.length - 1) / 2;
    const elevated = item.kind === "umbrella" ? 1.06 : item.kind === "lamp" ? 0.38 : 0;
    prop.position.set(offset * 0.95, 1.03 + elevated, 2.18 + Math.abs(offset) * 0.08);
    prop.rotation.set(-0.08, offset * -0.22, offset * 0.08);
    prop.scale.setScalar(0.001);
    const halo = mesh(new THREE.RingGeometry(0.26, 0.38, 36), new THREE.MeshBasicMaterial({
      color: storyPropColor(item, accent),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false
    }));
    halo.position.copy(prop.position);
    halo.position.z -= 0.12;
    halo.scale.setScalar(0.001);
    group.add(prop, halo);
    return { item, prop, halo, revealOrder: Math.round(Math.abs(offset) * 2) };
  });

  const handoffCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.9, 1.18, 2.25),
    new THREE.Vector3(-0.35, 1.88, 2.1),
    new THREE.Vector3(0.35, 1.88, 2.1),
    new THREE.Vector3(0.9, 1.18, 2.2)
  );
  const handoffArc = mesh(new THREE.TubeGeometry(handoffCurve, 36, 0.018, 6, false), new THREE.MeshBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  }));
  group.add(handoffArc);

  const sparklePositions = new Float32Array(22 * 3);
  for (let index = 0; index < 22; index += 1) {
    const angle = index / 22 * Math.PI * 2;
    sparklePositions[index * 3] = Math.cos(angle) * (1.3 + (index % 4) * 0.22);
    sparklePositions[index * 3 + 1] = 0.45 + (index % 7) * 0.32;
    sparklePositions[index * 3 + 2] = 1.8 + Math.sin(angle) * 0.4;
  }
  const sparkleGeometry = new THREE.BufferGeometry();
  sparkleGeometry.setAttribute("position", new THREE.BufferAttribute(sparklePositions, 3));
  const sparkles = new THREE.Points(sparkleGeometry, new THREE.PointsMaterial({
    color: accent,
    size: stageIndex === 6 ? 0.1 : 0.075,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  }));
  group.add(sparkles);

  const interactionFx = new THREE.Group();
  const fxMaterials = [];
  const fxColor = storyPropColor(featured, accent);
  const addFxMaterial = (maxOpacity = 0.64) => {
    const fxMaterial = new THREE.MeshBasicMaterial({
      color: fxColor,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false
    });
    fxMaterials.push({ material: fxMaterial, maxOpacity });
    return fxMaterial;
  };
  const featuredKind = featured.kind || "note";
  if (["coffee", "drink"].includes(featuredKind)) {
    [-0.16, 0, 0.16].forEach((x, index) => {
      const steamCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, 1.38, 2.2),
        new THREE.Vector3(x + 0.08, 1.62, 2.2),
        new THREE.Vector3(x - 0.06, 1.88, 2.2),
        new THREE.Vector3(x + 0.05, 2.12 + index * 0.04, 2.2)
      ]);
      interactionFx.add(mesh(new THREE.TubeGeometry(steamCurve, 20, 0.012, 5, false), addFxMaterial(0.5)));
    });
  } else if (["record", "wristband"].includes(featuredKind)) {
    [0.38, 0.6, 0.82].forEach((radius, index) => {
      const wave = mesh(new THREE.TorusGeometry(radius, 0.014, 6, 48), addFxMaterial(0.5 - index * 0.08));
      wave.position.set(0, 1.1, 2.05);
      interactionFx.add(wave);
    });
  } else if (featuredKind === "umbrella") {
    [0.78, 0.98, 1.18].forEach((radius, index) => {
      const canopy = mesh(new THREE.TorusGeometry(radius, 0.012 + index * 0.003, 5, 48, Math.PI), addFxMaterial(0.18 - index * 0.035));
      canopy.position.set(0, 2.02 + index * 0.055, 2.08 - index * 0.035);
      interactionFx.add(canopy);
    });
    [-1.16, -0.92, -0.68, 0.68, 0.92, 1.16].forEach((x, index) => {
      const rainCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, 2.24 - (index % 2) * 0.18, 2.06),
        new THREE.Vector3(x - 0.08, 1.72 - (index % 3) * 0.12, 2.08),
        new THREE.Vector3(x - 0.16, 1.08 - (index % 2) * 0.1, 2.1)
      ]);
      interactionFx.add(mesh(new THREE.TubeGeometry(rainCurve, 10, 0.009, 4, false), addFxMaterial(0.13)));
    });
    [-0.78, 0.78].forEach((x, sideIndex) => {
      [0.18, 0.29].forEach((radius, ringIndex) => {
        const ripple = mesh(new THREE.RingGeometry(radius, radius + 0.018, 32), addFxMaterial(0.15 - ringIndex * 0.035));
        ripple.rotation.x = -Math.PI / 2;
        ripple.position.set(x, 0.04 + sideIndex * 0.004, 2.14 + ringIndex * 0.06);
        interactionFx.add(ripple);
      });
    });
  } else if (["camera", "photo"].includes(featuredKind)) {
    const flash = mesh(new THREE.PlaneGeometry(1.28, 1.28), addFxMaterial(0.74));
    flash.position.set(0, 1.28, 2.08);
    flash.rotation.z = Math.PI / 4;
    interactionFx.add(flash);
  } else if (["key", "lamp"].includes(featuredKind)) {
    const keyRing = mesh(new THREE.TorusGeometry(0.64, 0.025, 8, 56), addFxMaterial(0.68));
    keyRing.position.set(0, 1.18, 2.08);
    interactionFx.add(keyRing);
  } else if (["flower", "plant"].includes(featuredKind)) {
    for (let index = 0; index < 8; index += 1) {
      const angle = index / 8 * Math.PI * 2;
      const petal = mesh(new THREE.SphereGeometry(0.08, 10, 7), addFxMaterial(0.58));
      petal.scale.set(1.4, 0.58, 0.38);
      petal.position.set(Math.cos(angle) * 0.54, 1.28 + Math.sin(angle) * 0.54, 2.08);
      petal.rotation.z = angle;
      interactionFx.add(petal);
    }
  } else {
    const revealFrame = mesh(roundedPanelGeometry(0.98, 0.68, 0.02, 0.08), addFxMaterial(0.34));
    revealFrame.position.set(0, 1.2, 2.04);
    interactionFx.add(revealFrame);
  }
  const fxLight = ["key", "lamp", "flower", "plant"].includes(featuredKind)
    ? new THREE.PointLight(fxColor, 0, 6, 2)
    : null;
  if (fxLight) {
    fxLight.position.set(0, 1.45, 2.4);
    interactionFx.add(fxLight);
  }
  group.add(interactionFx);
  group.userData.entries = entries;
  group.userData.handoffArc = handoffArc;
  group.userData.sparkles = sparkles;
  group.userData.interactionFx = interactionFx;
  group.userData.fxMaterials = fxMaterials;
  group.userData.fxLight = fxLight;
  group.userData.featuredKind = featuredKind;
  return group;
}

function createRendezvousSet(stageIndex, accent, items = []) {
  const group = new THREE.Group();
  const floorColor = new THREE.Color(0x11191c).lerp(new THREE.Color(accent), 0.055);
  const floor = mesh(new THREE.CircleGeometry(8.2, 48), new THREE.MeshBasicMaterial({ color: floorColor, transparent: true, opacity: 0.72 }), false, false);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.012;
  group.add(floor);
  const animated = [];

  if (stageIndex === 0) {
    const shelter = createShelter(accent);
    shelter.scale.setScalar(1.06);
    shelter.position.set(0.8, 0, -1.8);
    const bench = createBench();
    bench.position.set(0.7, 0, -0.5);
    const tree = createTree(accent);
    tree.position.set(-3.6, 0, -1.2);
    const lamp = createLamp(accent);
    lamp.position.set(3.6, 0, -1.3);
    group.add(shelter, bench, tree, lamp);
  } else if (stageIndex === 1) {
    const bench = createBench();
    bench.position.set(-1.9, 0, -0.6);
    const railing = createRailing();
    railing.position.set(0, 0, -2.7);
    const lights = createStringLights(accent, 8, 4.3);
    lights.position.z = -0.3;
    const displayBook = createStoryProp({ kind: "book", color: "coral" }, accent, null, true);
    displayBook.scale.setScalar(0.72);
    displayBook.position.set(2.5, 1.05, -0.9);
    displayBook.rotation.set(-0.12, -0.28, 0.08);
    animated.push(...lights.userData.bulbs);
    group.add(bench, railing, lights, displayBook);
  } else if (stageIndex === 2) {
    const cinema = createCinemaFront(accent);
    cinema.scale.setScalar(0.72);
    cinema.position.set(0, 0, -3.25);
    const lights = createStringLights(accent, 8.2, 5.75);
    lights.scale.setScalar(0.82);
    lights.position.set(0, 0, -2.35);
    animated.push(cinema.userData.sign, ...lights.userData.bulbs);
    group.add(cinema, lights);
  } else if (stageIndex === 3) {
    const marketLeft = createMarket(0xff657f);
    marketLeft.scale.setScalar(0.78);
    marketLeft.position.set(-3.4, 0, -2.5);
    marketLeft.rotation.y = 0.12;
    const marketRight = createMarket(0xffb04c);
    marketRight.scale.setScalar(0.78);
    marketRight.position.set(3.4, 0, -2.5);
    marketRight.rotation.y = -0.12;
    const railing = createRailing();
    railing.position.set(0, 0, -3);
    const bench = createBench();
    bench.position.set(0.5, 0, -1.05);
    const lights = createStringLights(accent, 9, 4.1);
    animated.push(...lights.userData.bulbs);
    group.add(marketLeft, marketRight, railing, bench, lights);
  } else if (stageIndex === 4) {
    const kitchenTable = new THREE.Group();
    const tableTop = mesh(new THREE.BoxGeometry(3.5, 0.14, 1.35), material(0x765139, { roughness: 0.72 }), true);
    tableTop.position.set(0.4, 1.02, -1.85);
    [-1.25, 1.25].forEach((x) => {
      const leg = mesh(new THREE.BoxGeometry(0.13, 1, 0.13), material(0x3b2d27, { roughness: 0.82 }), true);
      leg.position.set(0.4 + x, 0.5, -1.85);
      kitchenTable.add(leg);
    });
    const tableGlow = new THREE.PointLight(0xffc67b, 7, 8, 2);
    tableGlow.position.set(0.4, 2.1, -1.3);
    kitchenTable.add(tableTop, tableGlow);
    const plant = createStoryProp({ kind: "plant", color: "green" }, accent, null, true);
    plant.scale.setScalar(0.9);
    plant.position.set(2.45, 1.25, -1.45);
    group.add(kitchenTable, plant);
  } else if (stageIndex === 5) {
    const shelter = createShelter(accent);
    shelter.scale.set(1.12, 1.05, 1.1);
    shelter.position.set(0, 0, -2.4);
    const railing = createRailing();
    railing.scale.x = 1.65;
    railing.position.set(0, 0, -2.8);
    const warningLeft = createWarning(accent);
    warningLeft.scale.setScalar(0.7);
    warningLeft.position.set(-4.2, 0, -1.6);
    const warningRight = createWarning(accent);
    warningRight.scale.setScalar(0.7);
    warningRight.position.set(4.2, 0, -1.6);
    const lamp = createLamp(0xffc785);
    lamp.position.set(3.5, 0, -2.1);
    group.add(shelter, railing, warningLeft, warningRight, lamp);
  } else {
    const tree = createTree(0x8db884);
    tree.position.set(-4.2, 0, -1.7);
    const lamp = createLamp(0xffd28b);
    lamp.position.set(4.25, 0, -1.6);
    const pathLights = createStringLights(0xffd28b, 8.8, 5.1);
    pathLights.position.z = -0.9;
    animated.push(...pathLights.userData.bulbs);
    group.add(tree, lamp, pathLights);
  }

  const keyLight = new THREE.PointLight(accent, stageIndex === 5 ? 7 : 9, 18, 2);
  keyLight.position.set(-1.8, 4.2, 2.2);
  group.add(keyLight);
  const itemDisplay = createArrivalItemDisplay(items, accent, stageIndex);
  group.add(itemDisplay);
  group.userData.animated = animated;
  group.userData.itemDisplay = itemDisplay;
  group.userData.keyLight = keyLight;
  group.userData.stageIndex = stageIndex;
  group.position.set(0, 0, -2.2);
  return group;
}

function createStageIntroVisual(particleTexture, accent) {
  const root = new THREE.Group();
  root.position.set(0, 2.05, -8.6);
  root.visible = false;
  const ringMaterial = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const rings = [0, 1, 2].map((index) => {
    const ring = mesh(new THREE.TorusGeometry(1.25 + index * 0.48, 0.025 + index * 0.012, 7, 42), ringMaterial.clone());
    ring.rotation.set(Math.PI / 2, index * 0.32, index * 0.18);
    root.add(ring);
    return ring;
  });
  const tokenMaterial = material(0xffffff, { emissive: accent, emissiveIntensity: 2.8, roughness: 0.2, metalness: 0.18, transparent: true, opacity: 0 });
  const token = mesh(createStageTokenGeometry(0), tokenMaterial);
  token.scale.setScalar(0.72);
  root.add(token);
  const rayMaterial = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const rays = [];
  for (let index = 0; index < 8; index += 1) {
    const ray = mesh(new THREE.PlaneGeometry(0.05, 2.4), rayMaterial.clone());
    const angle = index / 8 * Math.PI * 2;
    ray.position.set(Math.cos(angle) * 2.25, Math.sin(angle) * 2.25, 0.1);
    ray.rotation.z = angle;
    root.add(ray);
    rays.push(ray);
  }
  const positions = new Float32Array(36 * 3);
  for (let index = 0; index < 36; index += 1) {
    const angle = index / 36 * Math.PI * 2;
    const radius = 1.35 + (index * 17 % 19) / 10;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = Math.sin(angle) * radius;
    positions[index * 3 + 2] = 0.2 + index % 3 * 0.08;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ map: particleTexture, color: accent, size: 0.18, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  particles.frustumCulled = false;
  root.add(particles);
  const light = new THREE.PointLight(accent, 0, 12, 2);
  root.add(light);
  return { root, rings, token, tokenMaterial, rays, particles, light };
}

function normalizeGoalVisualKey(value) {
  const kind = String(value || "").toLowerCase();
  if (kind.includes("cat-bell")) return "cat-bell";
  if (kind.includes("bell-rope")) return "bell-rope";
  if (kind.includes("vending")) return "vending-slot";
  if (kind.includes("countdown") || kind.includes("clock")) return "crossing-clock";
  if (kind.includes("route-board")) return "route-board";
  if (kind.includes("listening")) return "listening-post";
  if (kind.includes("departure") || kind.includes("flipboard") || kind.includes("train-board")) return "train-board";
  if (kind.includes("call-box")) return "call-box";
  if (kind.includes("letter-box")) return "letter-box";
  if (kind.includes("stall-sign")) return "stall-sign";
  if (kind.includes("console")) return "light-console";
  if (kind.includes("coin-lamp")) return "coin-lamp";
  if (kind.includes("order-clips")) return "order-clips";
  if (kind.includes("scale")) return "market-scale";
  if (kind.includes("doorbell")) return "doorbell";
  if (kind.includes("shutter")) return "pump-shutter";
  if (kind.includes("route-lamp")) return "route-lamp";
  if (kind.includes("drip-chain")) return "drip-chain";
  if (kind.includes("post-box")) return "post-box";
  if (kind.includes("entry-tray") || kind.includes("tray")) return "entry-tray";
  return kind;
}

function goalPieceLayout(value) {
  const kind = normalizeGoalVisualKey(value);
  const pieces = [];
  const add = (x, y, sx, sy, rotation = 0, z = 0) => pieces.push([x, y, z, sx, sy, 1, rotation]);
  const box = (width = 1.8, height = 1.2) => {
    add(0, height / 2, width, 0.12);
    add(0, -height / 2, width, 0.12);
    add(-width / 2, 0, 0.12, height);
    add(width / 2, 0, 0.12, height);
  };
  const ring = (radius = 0.82, count = 12) => {
    for (let index = 0; index < count; index += 1) {
      const angle = index / count * Math.PI * 2;
      add(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.3, 0.1, angle);
    }
  };
  if (kind === "cat-bell") {
    ring(0.62, 10);
    add(-0.42, 0.66, 0.48, 0.12, -0.72);
    add(0.42, 0.66, 0.48, 0.12, 0.72);
    add(0, -0.68, 0.12, 0.58);
    add(0, -0.92, 0.26, 0.2);
  } else if (kind === "bell-rope" || kind === "drip-chain") {
    for (let index = 0; index < 8; index += 1) add(Math.sin(index * 0.8) * 0.08, 1.25 - index * 0.31, 0.1, 0.24, index * 0.08);
    ring(0.34, 8);
  } else if (["crossing-clock", "coin-lamp"].includes(kind)) {
    ring(0.84, 14);
    add(0, 0.18, 0.08, 0.58, -0.5);
    add(0.2, -0.02, 0.08, 0.72, 1.05);
    if (kind === "coin-lamp") add(0, -1.12, 0.13, 1.1);
  } else if (["vending-slot", "call-box", "letter-box", "doorbell", "post-box"].includes(kind)) {
    box(kind === "vending-slot" ? 1.35 : 1.65, kind === "doorbell" ? 2.15 : 1.45);
    add(0, 0.16, 1.05, 0.12);
    add(kind === "doorbell" ? 0.42 : -0.36, -0.22, 0.18, 0.18);
    if (kind === "post-box") ring(0.72, 7);
  } else if (["route-board", "departure-board", "stall-sign", "train-board"].includes(kind)) {
    box(kind === "train-board" ? 2.35 : 1.9, 0.86);
    add(-0.52, 0, 0.08, 0.56);
    add(0.1, 0, 0.08, 0.56);
    add(0.68, 0, 0.08, 0.56);
    add(0, -1.05, 0.14, 1.05);
  } else if (kind === "market-scale") {
    add(0, -0.05, 0.14, 2.1);
    add(0, 0.76, 2.2, 0.12);
    add(-0.82, 0.12, 0.08, 1.08, -0.22);
    add(0.82, 0.12, 0.08, 1.08, 0.22);
    add(-0.84, -0.5, 0.74, 0.1);
    add(0.84, -0.5, 0.74, 0.1);
  } else if (["listening-post", "route-lamp"].includes(kind)) {
    add(0, -0.15, 0.15, 2.4);
    add(0, 0.88, 1.35, 0.1);
    add(-0.52, 0.54, 0.72, 0.1, 0.6);
    add(0.52, 0.54, 0.72, 0.1, -0.6);
    ring(0.33, 7);
  } else if (["light-console", "pump-shutter"].includes(kind)) {
    box(2.15, 1.3);
    for (let index = 0; index < 5; index += 1) add(-0.72 + index * 0.36, 0.18 + Math.sin(index) * 0.22, 0.2, 0.2, index * 0.2);
    add(0, -0.92, 1.5, 0.12);
  } else if (kind === "order-clips") {
    add(0, 0.82, 2.2, 0.1);
    for (let index = 0; index < 6; index += 1) {
      add(-0.88 + index * 0.35, 0.38, 0.08, 0.58);
      add(-0.88 + index * 0.35, -0.02, 0.25, 0.08);
    }
  } else if (kind === "entry-tray") {
    add(0, -0.58, 2.2, 0.14);
    add(-1.02, -0.16, 0.14, 0.82);
    add(1.02, -0.16, 0.14, 0.82);
    add(-0.42, -0.1, 0.38, 0.12, 0.42);
    add(0.34, -0.02, 0.42, 0.12, -0.36);
  } else {
    ring(0.72, 10);
    add(0, 0, 1.45, 0.12, 0.62);
    add(0, 0, 1.45, 0.12, -0.62);
  }
  return pieces.slice(0, 28);
}

function createDirectorVisualRig(particleTexture) {
  const root = new THREE.Group();
  root.name = "director-visual-rig";
  root.userData.sharedTexture = particleTexture;
  const routeRoot = new THREE.Group();
  const contourMaterial = material(0x7de6dd, { emissive: 0x7de6dd, emissiveIntensity: 1.15, roughness: 0.34, transparent: true, opacity: 0.68 });
  const inlayMaterial = material(0xffffff, { emissive: 0x7de6dd, emissiveIntensity: 0.72, roughness: 0.56, transparent: true, opacity: 0.42 });
  const goalMaterial = material(0xffd281, { emissive: 0xffd281, emissiveIntensity: 2.2, roughness: 0.24, metalness: 0.34, transparent: true, opacity: 0.9 });
  const contour = new THREE.InstancedMesh(new THREE.BoxGeometry(0.095, 0.045, 2.7), contourMaterial, 40);
  const inlays = new THREE.InstancedMesh(new THREE.BoxGeometry(0.72, 0.024, 0.13), inlayMaterial, 30);
  const goalPieces = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 0.1), goalMaterial, 28);
  [contour, inlays, goalPieces].forEach((batch) => {
    batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    batch.frustumCulled = false;
    batch.castShadow = false;
    batch.receiveShadow = false;
  });
  routeRoot.add(contour, inlays);
  const goalAnchor = new THREE.Group();
  const goalCoreMaterial = new THREE.MeshBasicMaterial({ color: 0xffefc8, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
  const goalCore = mesh(new THREE.SphereGeometry(0.18, 12, 9), goalCoreMaterial);
  const goalHaloMaterial = new THREE.PointsMaterial({ map: particleTexture, color: 0xffd281, size: 0.18, transparent: true, opacity: 0.64, depthWrite: false, blending: THREE.AdditiveBlending });
  const goalHaloGeometry = new THREE.BufferGeometry();
  const haloPositions = new Float32Array(18 * 3);
  for (let index = 0; index < 18; index += 1) {
    const angle = index / 18 * Math.PI * 2;
    haloPositions[index * 3] = Math.cos(angle) * (1.1 + index % 3 * 0.15);
    haloPositions[index * 3 + 1] = Math.sin(angle) * (0.9 + index % 2 * 0.14);
    haloPositions[index * 3 + 2] = index % 2 * 0.08;
  }
  goalHaloGeometry.setAttribute("position", new THREE.BufferAttribute(haloPositions, 3));
  const goalHalo = new THREE.Points(goalHaloGeometry, goalHaloMaterial);
  goalAnchor.add(goalPieces, goalCore, goalHalo);

  const consequenceMaterial = new THREE.MeshBasicMaterial({ color: 0xff8e72, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const consequenceRings = new THREE.InstancedMesh(new THREE.TorusGeometry(0.34, 0.025, 7, 28), consequenceMaterial, 10);
  consequenceRings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  consequenceRings.frustumCulled = false;
  const relationshipMaterial = new THREE.MeshBasicMaterial({ color: 0xffd59d, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const relationshipBeads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 8, 6), relationshipMaterial, 14);
  relationshipBeads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  relationshipBeads.frustumCulled = false;
  const branchMaterial = new THREE.MeshBasicMaterial({ color: 0x67e8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const branchMarkers = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.075, 0), branchMaterial, 18);
  branchMarkers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  branchMarkers.frustumCulled = false;

  const parcelMaterial = material(0x805b4e, { roughness: 0.72, metalness: 0.12 });
  const parcelAccent = material(0xffd281, { emissive: 0xffd281, emissiveIntensity: 0.72, roughness: 0.28, metalness: 0.42 });
  const relationshipParcel = new THREE.Group();
  relationshipParcel.add(mesh(roundedPanelGeometry(0.56, 0.42, 0.2, 0.08), parcelMaterial));
  const parcelHandle = mesh(new THREE.TorusGeometry(0.16, 0.025, 7, 16, Math.PI), parcelAccent);
  parcelHandle.position.y = 0.25;
  relationshipParcel.add(parcelHandle);
  relationshipParcel.visible = false;

  const sharedObstacle = new THREE.Group();
  const obstacleMaterial = material(0x6b7580, { roughness: 0.44, metalness: 0.62 });
  const obstacleGlow = material(0xffd281, { emissive: 0xffd281, emissiveIntensity: 1.3, roughness: 0.3 });
  const obstacleBar = mesh(new THREE.BoxGeometry(3.1, 0.18, 0.18), obstacleMaterial);
  obstacleBar.rotation.z = -0.2;
  const obstacleLamp = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 10), obstacleGlow);
  obstacleLamp.position.set(1.18, 0.12, 0);
  sharedObstacle.add(obstacleBar, obstacleLamp);
  sharedObstacle.visible = false;

  root.add(routeRoot, goalAnchor, consequenceRings, relationshipBeads, branchMarkers, relationshipParcel, sharedObstacle);
  const dummy = new THREE.Object3D();
  const colorScratch = new THREE.Color();
  return {
    root,
    routeRoot,
    contour,
    inlays,
    goalAnchor,
    goalPieces,
    goalCore,
    goalHalo,
    consequenceRings,
    relationshipBeads,
    branchMarkers,
    relationshipParcel,
    sharedObstacle,
    materials: { contourMaterial, inlayMaterial, goalMaterial, goalCoreMaterial, goalHaloMaterial, consequenceMaterial, relationshipMaterial, branchMaterial, parcelAccent, obstacleGlow },
    dummy,
    colorScratch,
    profile: null
  };
}

function configureDirectorVisualRig(rig, profile, accent) {
  rig.profile = profile;
  const color = rig.colorScratch.setHex(accent);
  rig.materials.contourMaterial.color.copy(color);
  rig.materials.contourMaterial.emissive.copy(color);
  rig.materials.inlayMaterial.emissive.copy(color);
  rig.materials.goalMaterial.color.copy(color).lerp(new THREE.Color(0xffffff), 0.22);
  rig.materials.goalMaterial.emissive.copy(color);
  rig.materials.goalCoreMaterial.color.copy(color).lerp(new THREE.Color(0xffffff), 0.56);
  rig.materials.goalHaloMaterial.color.copy(color);
  rig.materials.relationshipMaterial.color.copy(color).lerp(new THREE.Color(0xffe3c0), 0.42);
  rig.materials.parcelAccent.color.copy(color);
  rig.materials.parcelAccent.emissive.copy(color);
  rig.materials.obstacleGlow.color.copy(color);
  rig.materials.obstacleGlow.emissive.copy(color);
  const dummy = rig.dummy;
  const routeSeed = [...String(profile.topology)].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 19;
  for (let index = 0; index < 20; index += 1) {
    const t = index / 19;
    const z = -3.5 - index * 4.45;
    const phase = t * Math.PI * 2 * (1.1 + routeSeed % 4 * 0.17);
    const center = Math.sin(phase + routeSeed * 0.21) * profile.curve;
    const spread = profile.split * (t - 0.35) * 1.55;
    const halfWidth = ROAD_WIDTH * 0.5 * profile.width + spread;
    for (let sideIndex = 0; sideIndex < 2; sideIndex += 1) {
      const side = sideIndex ? 1 : -1;
      dummy.position.set(center + side * halfWidth, 0.04, z);
      dummy.rotation.set(0, -Math.cos(phase) * profile.curve * 0.08, 0);
      dummy.scale.set(1, 1, 0.76 + (index + routeSeed) % 3 * 0.18);
      dummy.updateMatrix();
      rig.contour.setMatrixAt(index * 2 + sideIndex, dummy.matrix);
    }
  }
  rig.contour.instanceMatrix.needsUpdate = true;
  for (let index = 0; index < 30; index += 1) {
    const lane = index % 3 - 1;
    const row = Math.floor(index / 3);
    const t = row / 9;
    const phase = t * Math.PI * 2 + routeSeed * 0.2;
    const center = Math.sin(phase) * profile.curve * 0.62;
    const spread = profile.split * (t - 0.25) * 0.62;
    dummy.position.set(center + lane * (LANE_WIDTH + spread), 0.062, -5 - row * 8.7 - lane * 0.35);
    dummy.rotation.set(0, Math.sin(phase) * profile.curve * 0.08, 0);
    const rhythm = 0.72 + ((row + routeSeed + lane + 4) % 4) * 0.18;
    dummy.scale.set(rhythm, 1, profile.topology.includes("singletrack") && lane !== 0 ? 0.001 : 1);
    dummy.updateMatrix();
    rig.inlays.setMatrixAt(index, dummy.matrix);
  }
  rig.inlays.instanceMatrix.needsUpdate = true;
  for (let index = 0; index < 18; index += 1) {
    const side = index % 2 ? 1 : -1;
    const row = Math.floor(index / 2);
    const z = -5.5 - row * (6.2 + profile.cadence * 0.18);
    dummy.position.set(side * (COMPANION_SHOULDER_X + 0.32), 0.12 + (row % 3) * 0.035, z);
    dummy.rotation.set(row * 0.21, row * 0.35, side * 0.18);
    dummy.scale.setScalar(0.82 + (row % 3) * 0.2);
    dummy.updateMatrix();
    rig.branchMarkers.setMatrixAt(index, dummy.matrix);
  }
  rig.branchMarkers.instanceMatrix.needsUpdate = true;
  const pieces = goalPieceLayout(profile.goal);
  for (let index = 0; index < 28; index += 1) {
    const piece = pieces[index];
    if (piece) {
      dummy.position.set(piece[0], piece[1], piece[2]);
      dummy.rotation.set(0, 0, piece[6]);
      dummy.scale.set(piece[3], piece[4], piece[5]);
    } else {
      dummy.position.set(0, 0, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(0.001);
    }
    dummy.updateMatrix();
    rig.goalPieces.setMatrixAt(index, dummy.matrix);
  }
  rig.goalPieces.instanceMatrix.needsUpdate = true;
  rig.goalAnchor.position.set(profile.goalX, 1.58, -28);
  rig.root.visible = true;
}

function createStatusVisualRig() {
  const vignetteTexture = canvasTexture(128, 128, (context, width, height) => {
    const gradient = context.createRadialGradient(width / 2, height / 2, width * 0.18, width / 2, height / 2, width * 0.7);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.56, "rgba(255,255,255,.04)");
    gradient.addColorStop(1, "rgba(255,255,255,.95)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  });
  const vignetteMaterial = new THREE.SpriteMaterial({ map: vignetteTexture, color: 0xff765f, transparent: true, opacity: 0, depthWrite: false, blending: THREE.MultiplyBlending, premultipliedAlpha: true });
  const vignette = new THREE.Sprite(vignetteMaterial);
  vignette.position.set(0, 0, -0.82);
  vignette.scale.set(2.3, 4.2, 1);
  const root = new THREE.Group();
  root.visible = false;
  const rings = [0, 1, 2].map((index) => {
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xff765f, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const ring = mesh(new THREE.RingGeometry(0.42 + index * 0.24, 0.47 + index * 0.24, 32, 1, index * 0.48, Math.PI * 1.55), ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    root.add(ring);
    return ring;
  });
  const guideLight = new THREE.PointLight(0xff765f, 0, 7, 2);
  guideLight.position.y = 0.5;
  root.add(guideLight);
  return { root, rings, guideLight, vignette, vignetteMaterial, vignetteTexture };
}

function createTransientEffectPool(particleTexture) {
  const root = new THREE.Group();
  root.name = "transient-effect-pool";
  root.userData.sharedTexture = particleTexture;
  const bursts = [];
  for (let index = 0; index < TRANSIENT_BURST_POOL_SIZE; index += 1) {
    const positions = new Float32Array(TRANSIENT_PARTICLE_CAPACITY * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);
    const material = new THREE.PointsMaterial({
      map: particleTexture,
      color: 0xffffff,
      size: 0.16,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geometry, material);
    points.visible = false;
    root.add(points);
    bursts.push({ points, positions, velocities: new Float32Array(TRANSIENT_PARTICLE_CAPACITY * 3), count: 0, life: 0, duration: 0 });
  }
  const ringGeometry = new THREE.TorusGeometry(0.45, 0.035, 8, 36);
  const rings = [];
  for (let index = 0; index < TRANSIENT_RING_POOL_SIZE; index += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const ring = mesh(ringGeometry, material);
    ring.visible = false;
    root.add(ring);
    rings.push({ mesh: ring, life: 0, duration: 0, spin: 0, baseScale: 1 });
  }
  return { root, bursts, rings };
}

function installCampusDepthFade(depthMaterial, start = 58, end = 108) {
  const enabled = { value: 0 };
  depthMaterial.userData.campusDepthFade = {
    enabled,
    opacity: depthMaterial.opacity,
    transparent: depthMaterial.transparent,
    depthWrite: depthMaterial.depthWrite
  };
  depthMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uCampusFadeEnabled = enabled;
    shader.uniforms.uCampusFadeStart = { value: start };
    shader.uniforms.uCampusFadeEnd = { value: end };
    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      "uniform float uCampusFadeEnabled; uniform float uCampusFadeStart; uniform float uCampusFadeEnd;\nvoid main() {"
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      "if (uCampusFadeEnabled > 0.5) { diffuseColor.a *= 1.0 - smoothstep(uCampusFadeStart, uCampusFadeEnd, -vViewPosition.z); }\n#include <opaque_fragment>"
    );
  };
  depthMaterial.customProgramCacheKey = () => "campus-depth-fade-v2";
}

function setCampusDepthFade(depthMaterial, active) {
  const fade = depthMaterial.userData.campusDepthFade;
  if (!fade) return;
  fade.enabled.value = active ? 1 : 0;
  const nextOpacity = active ? 0.18 : fade.opacity;
  const nextTransparent = active ? true : fade.transparent;
  const nextDepthWrite = fade.depthWrite;
  if (depthMaterial.opacity !== nextOpacity || depthMaterial.transparent !== nextTransparent || depthMaterial.depthWrite !== nextDepthWrite) {
    depthMaterial.opacity = nextOpacity;
    depthMaterial.transparent = nextTransparent;
    depthMaterial.depthWrite = nextDepthWrite;
    depthMaterial.needsUpdate = true;
  }
}

class CinematicRunnerRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.canvas.setAttribute("data-three-version", "0.185.1");
    this.canvas.setAttribute("data-render-quality", "balanced");
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(STAGE_CONFIGS[0].sky, 1);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(STAGE_CONFIGS[0].sky);
    this.environmentTexture = makeRunnerEnvironmentTexture();
    this.scene.environment = this.environmentTexture;
    this.scene.environmentIntensity = 0.72;
    this.scene.fog = new THREE.FogExp2(STAGE_CONFIGS[0].fog, STAGE_CONFIGS[0].fogDensity * FOG_SCALE);
    this.camera = new THREE.PerspectiveCamera(57, 9 / 16, 0.1, 280);
    this.camera.position.set(0, 5.08, 9.72);
    this.camera.lookAt(0, 0.56, -13.8);
    this.scene.add(this.camera);

    this.skyDome = createSkyDome(STAGE_CONFIGS[0]);
    this.metroDistricts = STAGE_CONFIGS.map((config, index) => {
      const district = createMetroSkyline(config);
      district.visible = index === 0;
      return district;
    });
    this.premiumDistricts = null;
    this.metroSkyline = this.metroDistricts[0];
    this.ambientTrains = [createAmbientTrain(STAGE_CONFIGS[0].accent, -1), createAmbientTrain(STAGE_CONFIGS[0].accent, 1)];
    this.ambientTrains[0].position.z = -42;
    this.ambientTrains[1].position.z = -86;
    this.scene.add(this.skyDome, ...this.metroDistricts, ...this.ambientTrains);

    this.textureLoader = new THREE.TextureLoader();
    this.roadTextures = STAGE_CONFIGS.map(() => [null, null, null]);
    this.roadTextures[0] = [0, 1, 2].map((phaseIndex) => makeRoadTexture(0, phaseIndex));
    this.roadTexture = this.roadTextures[0][0];
    this.platformTexture = makePlatformTexture();
    this.particleTexture = makeParticleTexture();
    this.stageTextures = Array(STAGE_CONFIGS.length).fill(null);
    this.arrivalStageTextures = Array(STAGE_CONFIGS.length).fill(null);
    this.backdropMaterials = [0, 1].map(() => new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      fog: false,
      color: 0xffffff,
      toneMapped: false
    }));
    this.backdrops = this.backdropMaterials.map((backdropMaterial, index) => {
      const backdrop = mesh(new THREE.PlaneGeometry(76, 136), backdropMaterial);
      backdrop.position.set(0, 9, -138 - index * 0.2);
      backdrop.renderOrder = -4 + index;
      this.scene.add(backdrop);
      return backdrop;
    });
    this.activeBackdrop = 0;
    this.backdropBlend = 1;
    this.arrivalBackdropMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false
    });
    this.arrivalBackdrop = mesh(new THREE.PlaneGeometry(17.2, 27), this.arrivalBackdropMaterial);
    this.arrivalBackdrop.position.set(0, 6.8, -8.6);
    this.arrivalBackdrop.renderOrder = -1;
    this.arrivalBackdrop.visible = false;
    this.scene.add(this.arrivalBackdrop);

    this.hemisphere = new THREE.HemisphereLight(0xcfe8e2, 0x1d2925, 1.65);
    this.keyLight = new THREE.DirectionalLight(STAGE_CONFIGS[0].key, 3.8);
    this.keyLight.position.set(-8, 14, 8);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.left = -8;
    this.keyLight.shadow.camera.right = 8;
    this.keyLight.shadow.camera.top = 12;
    this.keyLight.shadow.camera.bottom = -3;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 42;
    this.keyLight.shadow.bias = -0.0008;
    this.edgeLight = new THREE.DirectionalLight(0x8fcbd4, 1.75);
    this.edgeLight.position.set(8, 7, -4);
    this.warmLight = new THREE.PointLight(STAGE_CONFIGS[0].accent, 18, 28, 2);
    this.warmLight.position.set(0, 4.4, -4);
    this.warmLightBasePosition = this.warmLight.position.clone();
    this.runnerFillLight = new THREE.PointLight(0xffe8cc, 8.5, 14, 2);
    this.runnerFillLight.position.set(-2.8, 3.2, -4.2);
    this.camera.add(this.runnerFillLight);
    this.scene.add(this.hemisphere, this.keyLight, this.edgeLight, this.warmLight);

    this.groundMaterial = material(STAGE_CONFIGS[0].ground, { roughness: 1 });
    this.roadPhysicalMaterial = new THREE.MeshPhysicalMaterial({
      map: this.roadTexture,
      color: new THREE.Color(STAGE_CONFIGS[0].road).lerp(new THREE.Color(0xffffff), 0.08),
      roughness: 0.66,
      metalness: 0.04,
      clearcoat: 0.28,
      clearcoatRoughness: 0.42,
      envMapIntensity: 0.72
    });
    this.campusRoadMaterial = campusToonMaterial(0xffffff, {
      map: this.roadTexture,
      emissive: 0x142b3a,
      emissiveIntensity: 0.07,
      name: "campus-baked-wet-road"
    });
    this.roadMaterial = this.campusRoadMaterial;
    this.curbMaterial = material(STAGE_CONFIGS[0].curb, { roughness: 0.88 });
    this.platformStandardMaterial = new THREE.MeshStandardMaterial({ map: this.platformTexture, color: 0x687475, roughness: 0.7, metalness: 0.08, envMapIntensity: 0.52 });
    this.campusPlatformMaterial = campusToonMaterial(0xc9c4b7, { name: "campus-brick-shoulder" });
    this.campusPlatformMaterial.roughness = 0.9;
    this.campusPlatformMaterial.metalness = 0;
    this.platformMaterial = this.campusPlatformMaterial;
    this.railMaterial = material(0x879496, { roughness: 0.27, metalness: 0.88 });
    this.railSideMaterial = material(0x596165, { roughness: 0.5, metalness: 0.72 });
    this.sleeperMaterial = material(0x4a3b31, { roughness: 0.96 });
    this.powerRailMaterial = material(new THREE.Color(STAGE_CONFIGS[0].accent).multiplyScalar(0.42), { emissive: STAGE_CONFIGS[0].accent, emissiveIntensity: 0.16, roughness: 0.48 });
    this.safetyLineMaterial = material(0xe3c953, { emissive: 0x8b7224, emissiveIntensity: 0.28, roughness: 0.62 });
    this.laneGuideMaterial = material(0xc9e5df, {
      emissive: STAGE_CONFIGS[0].accent,
      emissiveIntensity: 0.28,
      transparent: true,
      opacity: 0.72,
      roughness: 0.5
    });
    this.roadMarkMaterial = material(0xe9eee6, {
      emissive: STAGE_CONFIGS[0].accent,
      emissiveIntensity: 0.08,
      transparent: true,
      opacity: 0.52,
      roughness: 0.72
    });
    this.routeBandMaterial = material(STAGE_CONFIGS[0].accent, {
      emissive: STAGE_CONFIGS[0].accent,
      emissiveIntensity: 0.34,
      transparent: true,
      opacity: 0.46,
      roughness: 0.56,
      metalness: 0.12
    });
    this.routeMotifMaterial = material(0xdceadf, {
      emissive: STAGE_CONFIGS[0].accent,
      emissiveIntensity: 0.18,
      transparent: true,
      opacity: 0.32,
      roughness: 0.68,
      metalness: 0.08
    });
    this.roadInsetMaterial = material(0x263238, { roughness: 0.32, metalness: 0.58 });
    this.roadPatchMaterial = material(0x435154, { roughness: 0.94, transparent: true, opacity: 0.34 });
    this.roadUtilityMaterial = material(0x29383c, { roughness: 0.38, metalness: 0.54 });
    this.streetFurnitureMaterial = material(0x526068, { roughness: 0.44, metalness: 0.5 });
    this.streetGlowMaterial = material(STAGE_CONFIGS[0].accent, {
      emissive: STAGE_CONFIGS[0].accent,
      emissiveIntensity: 1.35,
      roughness: 0.24,
      metalness: 0.26
    });
    this.streetPlanterMaterial = material(0x39484b, { roughness: 0.76, metalness: 0.16 });
    this.streetFoliageMaterial = material(0x5f8e65, { roughness: 0.9 });
    installCampusDepthFade(this.roadMaterial, 24, 62);
    installCampusDepthFade(this.roadPhysicalMaterial, 24, 62);
    installCampusDepthFade(this.platformMaterial, 20, 54);
    installCampusDepthFade(this.platformStandardMaterial, 20, 54);
    installCampusDepthFade(this.safetyLineMaterial, 22, 58);
    installCampusDepthFade(this.laneGuideMaterial, 26, 64);
    this.ground = mesh(new THREE.PlaneGeometry(86, 410), this.groundMaterial, false, true);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.set(0, -0.075, -120);
    this.scene.add(this.ground);

    this.roadSegments = [];
    this.roadGroup = new THREE.Group();
    this.roadBatchTransform = new THREE.Matrix4();
    this.roadBatchScale = new THREE.Vector3();
    this.roadBatchList = [];
    this.scene.add(this.roadGroup);
    this.buildRoad();
    this.campusRoadShadow = createCampusRoadShadowLayer();
    this.roadBaseGroup.add(this.campusRoadShadow);

    this.player = createCharacter({ skin: 0xc98c6b, cloth: 0x1d8790, clothDark: 0x143b52, hair: 0x24201f, accent: 0xffcb54, feminine: false, scale: 0.92 });
    this.companion = createCharacter({ skin: 0xe0ad8c, cloth: 0xdf6074, clothDark: 0x733247, hair: 0x2b211f, accent: 0xffd28c, feminine: true, scale: 0.84 });
    this.player.position.set(0, 0, PLAYER_Z);
    this.companion.position.set(-2.7, 0, -19);
    this.companion.visible = false;
    this.playerTrail = createRunnerFootTrail(STAGE_CONFIGS[0].accent);
    this.landingRing = mesh(new THREE.RingGeometry(0.22, 0.31, 32), new THREE.MeshBasicMaterial({
      color: STAGE_CONFIGS[0].accent,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    }));
    this.landingRing.rotation.x = -Math.PI / 2;
    this.landingRing.position.set(0, 0.035, PLAYER_Z);
    this.carryGroup = new THREE.Group();
    this.carryRig = createCarryRig(STAGE_CONFIGS[0].accent);
    this.carryGroup.add(this.carryRig);
    this.carriedItems = [];
    this.arrivalSet = null;
    this.arrivalData = null;
    this.arrivalProgress = 0;
    this.scene.add(this.playerTrail, this.landingRing, this.player, this.companion, this.carryGroup);

    this.entityObjects = new Map();
    this.entityPool = new Map();
    this.activeEntityIds = new Set();
    this.collectibleBatches = createCollectibleBatches(this.particleTexture, STAGE_COLLECTIBLE_COLORS[0]);
    this.collectibleMatrix = new THREE.Matrix4();
    this.collectibleQuaternion = new THREE.Quaternion();
    this.collectibleEuler = new THREE.Euler();
    this.collectibleScale = new THREE.Vector3(0.54, 0.54, 0.54);
    this.collectiblePosition = new THREE.Vector3();
    this.collectibleColor = new THREE.Color();
    this.scene.add(
      this.collectibleBatches.glows,
      this.collectibleBatches.pickupTrail,
      this.collectibleBatches.campusWisps,
      this.collectibleBatches.rims,
      this.collectibleBatches.hearts
    );
    this.transientEffects = createTransientEffectPool(this.particleTexture);
    this.scene.add(this.transientEffects.root);
    this.bursts = [];
    this.rings = [];
    this.burstPoolCursor = 0;
    this.ringPoolCursor = 0;
    this.pickupSequences = [];
    this.itemPulse = null;
    this.flow = 0;
    this.storyFocus = 0;
    this.storyFocusTarget = 0;
    this.shake = 0;
    this.flash = 0;
    this.speedPulse = 0;
    this.lastTime = 0;
    this.lastRenderMode = "";
    this.frameAverage = 1 / 60;
    this.qualityElapsed = 0;
    this.qualityGoodWindows = 0;
    this.qualityProfileIndex = 1;
    this.qualityProfile = QUALITY_PROFILES[this.qualityProfileIndex];
    this.frameSnapshot = { powerups: { magnet: 0, shield: 0, multiplier: 0, overdrive: 0 }, carriedItems: [] };
    this.cssWidth = 1;
    this.cssHeight = 1;
    this.maxPixelRatio = 1;
    this.stageIndex = -1;
    this.stageVisualConfigs = STAGE_CONFIGS.map((_, index) => resolveStageVisualConfig(index));
    this.stageConfig = this.stageVisualConfigs[0];
    this.stageWorlds = this.stageVisualConfigs.map((config, index) => {
      const world = createStageWorld(config, index);
      world.visible = false;
      this.scene.add(world);
      return world;
    });
    this.stageRoadProfiles = this.stageVisualConfigs.map((config, stageIndex) => [0, 1, 2].map((phaseIndex) => {
      const profile = createStageRoadProfile(config, stageIndex, phaseIndex);
      profile.visible = false;
      this.roadBaseGroup.add(profile);
      return profile;
    }));
    this.activeStageWorld = this.stageWorlds[0];
    this.routePhase = 0;
    this.roadCycle = -1;
    this.phaseContentRef = null;
    this.poolGeneration = 0;
    this.viewFrustum = new THREE.Frustum();
    this.projectionViewMatrix = new THREE.Matrix4();
    this.stageElapsed = 0;
    this.currentDistance = 0;
    this.currentLaneX = 0;
    this.previousLaneX = 0;
    this.lateralVelocity = 0;
    this.previousVertical = 0;
    this.landingPulse = 0;
    this.companionHazardProximity = 0;
    this.cadencePhase = 0;
    this.targetExposure = 1.08;
    this.targetBackground = new THREE.Color(STAGE_CONFIGS[0].sky);
    this.targetFog = new THREE.Color(STAGE_CONFIGS[0].fog);
    this.targetFogDensity = STAGE_CONFIGS[0].fogDensity * FOG_SCALE;

    this.flashMaterial = new THREE.SpriteMaterial({ color: 0xff665f, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    this.flashSprite = new THREE.Sprite(this.flashMaterial);
    this.flashSprite.position.set(0, 0, -1);
    this.flashSprite.scale.set(2.3, 4.2, 1);
    this.camera.add(this.flashSprite);

    this.buildWeather();
    this.powerupStrengths = { magnet: 0, shield: 0, multiplier: 0, overdrive: 0 };
    this.powerupTargets = { magnet: 0, shield: 0, multiplier: 0, overdrive: 0 };
    this.powerupSnapshot = { magnet: false, shield: false, multiplier: false, overdrive: false };
    this.powerupEvents = {
      magnet: { remaining: 0, duration: 0 },
      shield: { remaining: 0, duration: 0 },
      multiplier: { remaining: 0, duration: 0 },
      overdrive: { remaining: 0, duration: 0 }
    };
    this.powerupVisuals = createPowerupVisualRig(this.particleTexture, STAGE_CONFIGS[0].accent);
    this.powerupEffectPool = this.powerupVisuals.impacts;
    this.powerupEffectCursor = 0;
    this.scorePulse = 0;
    this.storyWorldInfluence = 0;
    this.synergyInfluence = 0;
    this.storyWorldState = { life: 0, duration: 0, elapsed: 0, intensity: 1, kind: "", gesture: "focus", emotion: "", color: STAGE_CONFIGS[0].accent };
    this.synergyState = { life: 0, duration: 0, elapsed: 0, intensity: 1, color: STAGE_CONFIGS[0].accent };
    this.scene.add(this.powerupVisuals.root);
    this.directorVisualRig = createDirectorVisualRig(this.particleTexture);
    this.directorState = {
      stageIndex: 0,
      actIndex: 0,
      act: actDirectionAt(0, 0),
      elapsed: 0,
      revealLife: 0,
      revealStrength: 0,
      consequenceLife: 0,
      consequenceStrength: 0,
      consequenceOutcome: "clean",
      recoverLife: 0,
      recoverStrength: 0,
      semanticLife: 0,
      semanticStrength: 0,
      semanticOutcome: "idle",
      semanticStep: "",
      semanticMatched: 0,
      semanticRequired: 0,
      gatePendingLife: 0,
      gatePendingStrength: 0,
      branch: { axis: null, itemId: null, worldEffect: null, strength: 0, target: 0, color: new THREE.Color(BRANCH_COLORS.attention) },
      relationship: relationshipMode("absent"),
      relationshipStrength: 0,
      processedCommandIds: new Set(),
      commandHighWater: new Map(),
      backgroundTarget: new THREE.Color(STAGE_CONFIGS[0].sky),
      fogTarget: new THREE.Color(STAGE_CONFIGS[0].fog),
      accentTarget: new THREE.Color(STAGE_CONFIGS[0].accent),
      camera: { x: 0, y: 5.55, z: 10.65, lookY: 0.7, lookZ: -18.5, fov: 59, maxLaneOffset: 0.35 }
    };
    this.directorScratchColor = new THREE.Color();
    this.choiceWindowState = { life: 0, duration: 0, lane: 0, strength: 0 };
    this.arrivalInteractionState = { life: 0, duration: 0, strength: 0, outcome: "idle", completed: false };
    this.scene.add(this.directorVisualRig.root);
    this.stageIntroVisual = createStageIntroVisual(this.particleTexture, STAGE_CONFIGS[0].accent);
    this.stageIntroState = {
      active: false,
      elapsed: 0,
      duration: 2.4,
      stageIndex: 0,
      intensity: 0,
      beatIndex: 0,
      beatElapsed: 0,
      cameraCue: "street-wide",
      actionCue: "run"
    };
    this.scene.add(this.stageIntroVisual.root);
    this.statusVisuals = createStatusVisualRig();
    this.statusVisualState = { mode: "normal", target: 0, strength: 0, condition: 100, pulse: 0 };
    this.camera.add(this.statusVisuals.vignette);
    this.scene.add(this.statusVisuals.root);
    this.disposed = false;
    this.loadedCitySources = [];
    this.preloadBackdrops();
    this.setStage(0, true);
    this.applyQualityProfile("balanced", true);
    this.modelLoader = new GLTFLoader();
    this.runnerLoadToken = 0;
    this.cityLoadToken = 0;
    this.campusMaterialLoadToken = 0;
    this.campusArtLoadToken = 0;
    this.campusRoadMaps = null;
    this.campusCanopyTexture = null;
    this.campusSkyTexture = null;
    this.campusFacadeTexture = null;
    this.campusFlowerbedTexture = null;
    this.campusLeftLandmarkTexture = null;
    this.campusRightLandmarkTexture = null;
    this.campusLeftStreetscapeTexture = null;
    this.campusRightStreetscapeTexture = null;
    this.campusRoadShadowTexture = null;
    this.loadRiggedCharacters();
    this.loadPremiumCity();
    this.loadCampusArtMaterials();
    this.canvas.setAttribute("data-campus-material", "toon-atlas-baked");
    this.canvas.setAttribute("data-campus-assets", "batched-modular-3d");
  }

  loadRiggedCharacters() {
    const loadToken = ++this.runnerLoadToken;
    Promise.all([
      this.modelLoader.loadAsync("assets/runner-models/runner-player.glb"),
      this.modelLoader.loadAsync("assets/runner-models/runner-companion.glb"),
      this.modelLoader.loadAsync("assets/runner-models/runner-motion.glb")
    ])
      .then(([playerGltf, companionGltf, motionGltf]) => {
        if (this.disposed || loadToken !== this.runnerLoadToken) {
          disposeGltf(playerGltf);
          disposeGltf(companionGltf);
          disposeGltf(motionGltf);
          return;
        }
        let riggedPlayer = null;
        let riggedCompanion = null;
        try {
          riggedPlayer = createRiggedRunner(playerGltf, {
            height: 2.18,
            accent: 0xff7866,
            widthScale: 0.76,
            depthScale: 0.82,
            rotationY: 0,
            fashion: false
          }, motionGltf.animations);
          riggedCompanion = createRiggedRunner(companionGltf, {
            height: 2.12,
            accent: 0xff668f,
            companion: true,
            widthScale: 0.79,
            depthScale: 0.84,
            rotationY: 0,
            fashion: false
          }, motionGltf.animations);
        } catch (error) {
          if (riggedPlayer) disposeObject(riggedPlayer);
          else disposeGltf(playerGltf);
          if (riggedCompanion) disposeObject(riggedCompanion);
          else disposeGltf(companionGltf);
          throw error;
        } finally {
          disposeGltf(motionGltf);
        }
        // The authored run pose extends the hands beyond the idle silhouette.
        // Keep it inside one lane without rejecting the correctly normalized rig.
        const runnerEnvelope = { width: 3.2, height: 3.6, depth: 3.4 };
        if (!validateModelEnvelope(riggedPlayer, runnerEnvelope)
          || !validateModelEnvelope(riggedCompanion, runnerEnvelope)) {
          disposeObject(riggedPlayer);
          disposeObject(riggedCompanion);
          throw new Error("runner model violates the foreground envelope");
        }
        riggedPlayer.position.copy(this.player.position);
        riggedCompanion.position.copy(this.companion.position);
        riggedCompanion.visible = Boolean(this.arrivalData) || Boolean(this.directorState?.relationship?.visible);
        const oldPlayer = this.player;
        const oldCompanion = this.companion;
        this.scene.remove(oldPlayer, oldCompanion);
        disposeObject(oldPlayer);
        disposeObject(oldCompanion);
        this.player = riggedPlayer;
        this.companion = riggedCompanion;
        this.scene.add(this.player, this.companion);
        const characterShadows = this.qualityProfile.shadows && this.stageIndex !== 0 && !this.mobilePerformance;
        applyCharacterRenderQuality(this.player, this.qualityProfile.key === "performance", characterShadows);
        applyCharacterRenderQuality(this.companion, this.qualityProfile.key === "performance", characterShadows);
        this.canvas.setAttribute("data-runner-model", "rg-poly-rigged");
      })
      .catch((error) => {
        if (this.disposed || loadToken !== this.runnerLoadToken) return;
        console.error("Unable to initialize rigged runner models", error);
        this.canvas.setAttribute("data-runner-model", "procedural-fallback");
        this.canvas.setAttribute("data-runner-model-error", error?.message || "unknown");
      });
  }

  loadPremiumCity() {
    const loadToken = ++this.cityLoadToken;
    this.modelLoader.loadAsync("assets/runner-models/runner-city.glb")
      .then((cityGltf) => {
        if (this.disposed || loadToken !== this.cityLoadToken) {
          disposeGltf(cityGltf);
          return;
        }
        const cityAssets = cityGltf.scenes.map((scene) => extractCityAsset(scene));
        const premiumDistricts = this.stageVisualConfigs.map((config, stageIndex) => {
          const district = createPremiumDistrict(config, stageIndex, cityAssets);
          district.visible = false;
          return district;
        });
        if (this.disposed || loadToken !== this.cityLoadToken) {
          premiumDistricts.forEach(disposeObject);
          disposeGltf(cityGltf);
          return;
        }
        this.premiumDistricts?.forEach((district) => {
          this.scene.remove(district);
          disposeObject(district);
        });
        for (let index = 0; index < this.loadedCitySources.length; index += 1) disposeObject(this.loadedCitySources[index]);
        this.loadedCitySources = cityGltf.scenes.slice();
        this.premiumDistricts = premiumDistricts;
        this.metroDistricts.forEach((district) => { district.visible = false; });
        this.scene.add(...premiumDistricts);
        premiumDistricts.forEach((district, districtIndex) => {
          district.visible = this.stageIndex !== 0 && districtIndex === this.stageIndex;
        });
        this.metroSkyline = premiumDistricts[this.stageIndex];
        const config = this.stageConfig || this.stageVisualConfigs[this.stageIndex];
        this.metroSkyline.userData.windowLights?.material.color.setHex(config.accent);
        this.canvas.setAttribute("data-city-model", "kenney-instanced");
        this.syncQualityVisibility(false);
      })
      .catch(() => {
        if (this.disposed || loadToken !== this.cityLoadToken) return;
        this.canvas.setAttribute("data-city-model", "procedural-fallback");
      });
  }

  loadCampusSurfaceMaterials() {
    const loadToken = ++this.campusMaterialLoadToken;
    Promise.all([
      this.textureLoader.loadAsync("assets/runner-textures/campus/asphalt-diffuse.jpg"),
      this.textureLoader.loadAsync("assets/runner-textures/campus/asphalt-normal.jpg"),
      this.textureLoader.loadAsync("assets/runner-textures/campus/asphalt-roughness.jpg")
    ])
      .then(([diffuse, normal, roughness]) => {
        if (this.disposed || loadToken !== this.campusMaterialLoadToken) {
          diffuse.dispose();
          normal.dispose();
          roughness.dispose();
          return;
        }
        const campusCanvas = document.createElement("canvas");
        campusCanvas.width = diffuse.image.naturalWidth || diffuse.image.width || 1024;
        campusCanvas.height = diffuse.image.naturalHeight || diffuse.image.height || 1024;
        const campusContext = campusCanvas.getContext("2d");
        campusContext.filter = "grayscale(1) brightness(1.24) contrast(.84)";
        campusContext.drawImage(diffuse.image, 0, 0, campusCanvas.width, campusCanvas.height);
        const campusDiffuse = new THREE.CanvasTexture(campusCanvas);
        campusDiffuse.colorSpace = THREE.SRGBColorSpace;
        diffuse.dispose();
        [campusDiffuse, normal, roughness].forEach((texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(4, 11);
          texture.anisotropy = this.mobilePerformance ? 4 : 8;
        });
        this.campusRoadMaps = { diffuse: campusDiffuse, normal, roughness };
        this.applyStageRoadSurfaceMaps();
        this.canvas.setAttribute("data-campus-material", "poly-haven-pbr");
      })
      .catch((error) => {
        if (this.disposed || loadToken !== this.campusMaterialLoadToken) return;
        this.canvas.setAttribute("data-campus-material", "procedural-fallback");
        this.canvas.setAttribute("data-campus-material-error", error?.message || "unknown");
      });
  }

  loadCampusArtMaterials() {
    const loadToken = ++this.campusArtLoadToken;
    Promise.all([
      this.textureLoader.loadAsync("assets/runner-textures/campus/camphor-canopy.png"),
      this.textureLoader.loadAsync("assets/runner-textures/campus/summer-sky.png"),
      this.textureLoader.loadAsync("assets/runner-textures/campus/academic-facade.png"),
      this.textureLoader.loadAsync("assets/runner-textures/campus/flowerbed.png")
    ])
      .then(([texture, skyTexture, facadeTexture, flowerbedTexture]) => {
        if (this.disposed || loadToken !== this.campusArtLoadToken) {
          texture.dispose();
          skyTexture.dispose();
          facadeTexture.dispose();
          flowerbedTexture.dispose();
          return;
        }
        [texture, skyTexture, facadeTexture, flowerbedTexture].forEach((assetTexture, index) => {
          assetTexture.colorSpace = THREE.SRGBColorSpace;
          assetTexture.anisotropy = this.mobilePerformance ? (index === 1 ? 2 : 4) : (index === 1 ? 4 : 8);
          assetTexture.minFilter = THREE.LinearMipmapLinearFilter;
          assetTexture.magFilter = THREE.LinearFilter;
        });
        this.campusCanopyTexture?.dispose();
        this.campusCanopyTexture = texture;
        this.campusSkyTexture?.dispose();
        this.campusSkyTexture = skyTexture;
        this.campusFacadeTexture?.dispose();
        this.campusFacadeTexture = facadeTexture;
        this.campusFlowerbedTexture?.dispose();
        this.campusFlowerbedTexture = flowerbedTexture;

        const authoredRoadShadow = makeCampusAuthoredShadowTexture(texture.image);
        this.campusRoadShadowTexture?.dispose();
        const previousRoadShadow = this.campusRoadShadow?.material?.map;
        this.campusRoadShadowTexture = authoredRoadShadow;
        if (this.campusRoadShadow?.material) {
          this.campusRoadShadow.material.map = authoredRoadShadow;
          this.campusRoadShadow.material.opacity = 0.56;
          this.campusRoadShadow.material.needsUpdate = true;
        }
        if (previousRoadShadow && previousRoadShadow !== authoredRoadShadow && !SHARED_TEXTURES.has(previousRoadShadow)) previousRoadShadow.dispose();
        let canopyCount = 0;
        let facadeCount = 0;
        let flowerbedCount = 0;
        const campusWorld = this.stageWorlds[0];
        campusWorld?.userData?.scenery?.forEach((entry) => {
          const foliageCards = entry.object?.userData?.foliageCards || [];
          foliageCards.forEach((card) => {
            card.material.map = texture;
            card.material.color.setHex(0xffffff);
            card.material.alphaTest = 0.12;
            card.material.needsUpdate = true;
            card.visible = true;
            canopyCount += 1;
          });
          if (foliageCards.length) entry.object?.userData?.proceduralCanopy?.forEach((part) => { part.visible = false; });
          const facadeParts = entry.object?.userData?.facadeParts || [];
          facadeParts.forEach((part) => {
            part.material.map = facadeTexture;
            part.material.color.setHex(0xffffff);
            part.material.needsUpdate = true;
            part.visible = true;
            facadeCount += 1;
          });
          if (facadeParts.length) entry.object?.userData?.proceduralFacadeGrid?.forEach((part) => { part.visible = false; });
          const flowerCardSets = [
            entry.object?.userData?.flowerCards,
            ...(entry.object?.userData?.narrativeFlowerCards || [])
          ].filter(Boolean);
          flowerCardSets.forEach((flowerCards) => {
            if (!flowerCards?.material) return;
            flowerCards.material.map = flowerbedTexture;
            flowerCards.material.color.setHex(0xffffff);
            flowerCards.material.alphaTest = 0.1;
            flowerCards.material.needsUpdate = true;
            flowerCards.visible = true;
            flowerbedCount += 1;
          });
        });
        const cloudField = campusWorld?.userData?.campusCloudField;
        if (cloudField?.userData?.skyArt?.material) {
          cloudField.userData.skyArt.material.map = skyTexture;
          cloudField.userData.skyArt.material.needsUpdate = true;
          cloudField.userData.skyArt.visible = true;
          cloudField.userData.proceduralSky?.forEach((item) => { item.visible = false; });
        }
        campusWorld?.userData?.setCampusPhase?.(this.routePhase);
        this.canvas.setAttribute("data-campus-canopy", canopyCount ? "cross-card-handpainted" : "procedural-fallback");
        this.canvas.setAttribute("data-campus-sky", cloudField?.userData?.skyArt ? "handpainted-sky" : "procedural-fallback");
        this.canvas.setAttribute("data-campus-facade", facadeCount ? "baked-facade-on-3d" : "procedural-fallback");
        this.canvas.setAttribute("data-campus-flowerbed", flowerbedCount ? "handpainted-cards" : "procedural-fallback");
        this.canvas.setAttribute("data-campus-art-pipeline", "3d-form-handpainted-surface");
      })
      .catch((error) => {
        if (this.disposed || loadToken !== this.campusArtLoadToken) return;
        this.canvas.setAttribute("data-campus-canopy", "procedural-fallback");
        this.canvas.setAttribute("data-campus-canopy-error", error?.message || "unknown");
      });
  }

  selectStageRoadMaterials() {
    const campusStage = this.stageIndex === 0;
    this.roadMaterial = campusStage ? this.campusRoadMaterial : this.roadPhysicalMaterial;
    this.platformMaterial = campusStage ? this.campusPlatformMaterial : this.platformStandardMaterial;
    if (this.roadBatches) {
      this.roadBatches.ballast.material = this.roadMaterial;
      this.roadBatches.walks.material = this.platformMaterial;
    }
  }

  applyStageRoadSurfaceMaps() {
    this.selectStageRoadMaterials();
    this.roadMaterial.map = this.roadTexture;
    if (this.roadMaterial.isMeshPhysicalMaterial) {
      this.roadMaterial.normalMap = null;
      this.roadMaterial.roughnessMap = null;
      this.roadMaterial.normalScale.set(1, 1);
    }
    this.platformMaterial.map = this.stageIndex === 0 ? null : this.platformTexture;
    this.roadMaterial.needsUpdate = true;
    this.platformMaterial.needsUpdate = true;
  }

  buildRoad() {
    this.roadBaseGroup = new THREE.Group();
    this.roadGroup.add(this.roadBaseGroup);
    this.roadBatches = {
      ballast: new THREE.InstancedMesh(new THREE.BoxGeometry(ROAD_WIDTH, 0.2, SEGMENT_LENGTH), this.roadMaterial, SEGMENT_COUNT),
      sleepers: new THREE.InstancedMesh(new THREE.BoxGeometry(1.95, 0.11, 0.24), this.sleeperMaterial, SEGMENT_COUNT * 42),
      rails: new THREE.InstancedMesh(new THREE.BoxGeometry(0.085, 0.105, SEGMENT_LENGTH), this.railMaterial, SEGMENT_COUNT * 6),
      thirdRails: new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.075, SEGMENT_LENGTH), this.powerRailMaterial, SEGMENT_COUNT * 3),
      walks: new THREE.InstancedMesh(new THREE.BoxGeometry(2.45, 0.34, SEGMENT_LENGTH), this.platformMaterial, SEGMENT_COUNT * 2),
      safetyLines: new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.025, SEGMENT_LENGTH), this.safetyLineMaterial, SEGMENT_COUNT * 2),
      laneGuides: new THREE.InstancedMesh(new THREE.BoxGeometry(0.045, 0.024, 0.82), this.laneGuideMaterial, SEGMENT_COUNT * 24),
      laneTicks: new THREE.InstancedMesh(new THREE.BoxGeometry(1.12, 0.022, 0.12), this.roadMarkMaterial, SEGMENT_COUNT * 12),
      crosswalks: new THREE.InstancedMesh(new THREE.BoxGeometry(7.45, 0.024, 0.34), this.roadMarkMaterial, SEGMENT_COUNT * 5),
      drains: new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.026, 0.74), this.roadInsetMaterial, SEGMENT_COUNT * 4),
      roadPatches: new THREE.InstancedMesh(createRoadPatchGeometry(), this.roadPatchMaterial, SEGMENT_COUNT * 9),
      manholes: new THREE.InstancedMesh(new THREE.CylinderGeometry(0.34, 0.34, 0.026, 18), this.roadUtilityMaterial, SEGMENT_COUNT * 3),
      edgePosts: new THREE.InstancedMesh(new THREE.CylinderGeometry(0.055, 0.075, 0.72, 8), this.streetFurnitureMaterial, SEGMENT_COUNT * 8),
      edgePostLights: new THREE.InstancedMesh(new THREE.SphereGeometry(0.095, 8, 6), this.streetGlowMaterial, SEGMENT_COUNT * 8),
      planterBases: new THREE.InstancedMesh(new THREE.BoxGeometry(0.72, 0.5, 0.92), this.streetPlanterMaterial, SEGMENT_COUNT * 4),
      planterLeaves: new THREE.InstancedMesh(createFoliageClusterGeometry(), this.streetFoliageMaterial, SEGMENT_COUNT * 4),
      themeBands: new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.025, 1), this.routeBandMaterial, SEGMENT_COUNT * 6),
      themeMotifs: new THREE.InstancedMesh(new THREE.CylinderGeometry(0.42, 0.42, 0.026, 10), this.routeMotifMaterial, SEGMENT_COUNT * 6)
    };
    this.roadBatchList = Object.values(this.roadBatches);
    this.roadBatchList.forEach((batch) => {
      batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      batch.castShadow = false;
      batch.receiveShadow = true;
      batch.frustumCulled = false;
      this.roadBaseGroup.add(batch);
    });
    for (let index = 0; index < SEGMENT_COUNT; index += 1) {
      const segment = new THREE.Group();
      const decor = new THREE.Group();
      decor.name = "decor";
      segment.add(decor);
      segment.userData.decor = decor;
      this.roadSegments.push(segment);
      this.roadGroup.add(segment);
    }
    this.updateRoadBatches();
  }

  updateRoadBatches(roadCycle = 0) {
    const transform = this.roadBatchTransform;
    const scale = this.roadBatchScale;
    const stageIndex = clamp(Math.trunc(Number(this.stageIndex) || 0), 0, THEMED_ROUTE_MODULES.length - 1);
    const phaseIndex = clamp(Math.trunc(Number(this.routePhase) || 0), 0, 2);
    const hide = (batch, index) => {
      transform.makeScale(0.001, 0.001, 0.001);
      batch.setMatrixAt(index, transform);
    };
    let railRoute = false;
    this.roadSegments.forEach((segment, segmentIndex) => {
      const serial = segmentIndex;
      const module = routeModuleAt(stageIndex, phaseIndex, serial);
      const z = 7 - segmentIndex * SEGMENT_LENGTH;
      const roadWidth = ROAD_WIDTH * module.widthScale;
      const roadHalfWidth = roadWidth / 2;
      const walkWidth = 2.45 * module.walkScale;
      const center = module.center * clamp(segmentIndex / 3, 0, 1);
      railRoute ||= module.rail;
      segment.userData.routeModule = module;

      transform.makeScale(module.widthScale, 1, 1.008);
      transform.setPosition(center, -0.08, z);
      this.roadBatches.ballast.setMatrixAt(segmentIndex, transform);

      let sleeperOffset = segmentIndex * 42;
      [-1, 0, 1].forEach((lane) => {
        for (let row = 0; row < 14; row += 1) {
          if (module.rail) {
            transform.makeTranslation(lane * LANE_WIDTH + center * 0.3, 0.065, z - 7.45 + row * 1.14);
            this.roadBatches.sleepers.setMatrixAt(sleeperOffset, transform);
          } else hide(this.roadBatches.sleepers, sleeperOffset);
          sleeperOffset += 1;
        }
      });
      let railOffset = segmentIndex * 6;
      [-1, 0, 1].forEach((lane) => {
        [-0.53, 0.53].forEach((railX) => {
          if (module.rail) {
            transform.makeTranslation(lane * LANE_WIDTH + railX + center * 0.3, 0.155, z);
            this.roadBatches.rails.setMatrixAt(railOffset, transform);
          } else hide(this.roadBatches.rails, railOffset);
          railOffset += 1;
        });
      });
      [-1, 0, 1].forEach((lane, laneIndex) => {
        const index = segmentIndex * 3 + laneIndex;
        if (module.rail) {
          transform.makeTranslation(lane * LANE_WIDTH + 0.82 + center * 0.3, 0.12, z);
          this.roadBatches.thirdRails.setMatrixAt(index, transform);
        } else hide(this.roadBatches.thirdRails, index);
      });

      [-1, 1].forEach((side, sideIndex) => {
        let sideWalkScale = module.walkScale;
        if (module.shoulder === "river") sideWalkScale *= side > 0 ? 0.46 : 1.12;
        else if (["storefront", "bookstore", "cinema", "shop", "market", "homes", "home"].includes(module.shoulder)) sideWalkScale *= sideIndex === module.variant % 2 ? 1.14 : 0.76;
        else if (["truss", "warning"].includes(module.shoulder)) sideWalkScale *= 0.62;
        const sideWalkWidth = 2.45 * sideWalkScale;
        const walkX = center + side * (roadHalfWidth + sideWalkWidth / 2 - 0.1);
        transform.makeScale(sideWalkScale, module.shoulder === "platform" || module.shoulder === "terminal" ? 1.18 : 0.92, 1.006);
        transform.setPosition(walkX, module.shoulder === "platform" || module.shoulder === "terminal" ? 0.13 : 0.08, z);
        this.roadBatches.walks.setMatrixAt(segmentIndex * 2 + sideIndex, transform);
        transform.makeScale(1, 1, 0.99);
        transform.setPosition(center + side * (roadHalfWidth + 0.035), 0.285, z);
        this.roadBatches.safetyLines.setMatrixAt(segmentIndex * 2 + sideIndex, transform);
      });

      [-LANE_WIDTH / 2, LANE_WIDTH / 2].forEach((x, boundaryIndex) => {
        for (let row = 0; row < 12; row += 1) {
          const index = segmentIndex * 24 + boundaryIndex * 12 + row;
          if (stageIndex === 0 && row === 0) {
            transform.makeScale(1.6, 1, SEGMENT_LENGTH / 0.82 * 0.985);
            transform.setPosition(x + center * 0.18, 0.048, z);
            this.roadBatches.laneGuides.setMatrixAt(index, transform);
          } else if (stageIndex !== 0 && !module.rail && ROUTE_LANE_MARK_MOTIFS.has(module.motif) && (row + module.variant) % 3 !== 1) {
            transform.makeTranslation(x + center * 0.18, 0.048, z - 7.25 + row * 1.32);
            this.roadBatches.laneGuides.setMatrixAt(index, transform);
          } else hide(this.roadBatches.laneGuides, index);
        }
      });

      [-1, 0, 1].forEach((lane, laneIndex) => {
        for (let row = 0; row < 4; row += 1) {
          const index = segmentIndex * 12 + laneIndex * 4 + row;
          if (!module.rail && ROUTE_LANE_MARK_MOTIFS.has(module.motif) && (module.variant + row + laneIndex) % 2 === 0) {
            transform.makeScale(0.78 + module.variant % 3 * 0.08, 1, 1);
            transform.setPosition(lane * LANE_WIDTH + center * 0.2, 0.046, z - 6.1 + row * 4.05 + ((serial + laneIndex) % 2) * 0.28);
            this.roadBatches.laneTicks.setMatrixAt(index, transform);
          } else hide(this.roadBatches.laneTicks, index);
        }
        for (let row = 0; row < 3; row += 1) {
          const index = segmentIndex * 9 + laneIndex * 3 + row;
          if (!module.rail && ROUTE_PATCH_MOTIFS.has(module.motif) && (row + laneIndex + module.variant) % 3 !== 1) {
            const patchX = lane * LANE_WIDTH + center * 0.3 + (((serial + row + laneIndex) % 3) - 1) * 0.34;
            const patchZ = z - 5.7 + row * 5.15 + laneIndex * 0.42;
            transform.makeRotationY(((serial * 3 + laneIndex + row) % 5 - 2) * 0.075);
            transform.scale(scale.set(0.82 + module.variant % 3 * 0.08, 1, 0.86 + row * 0.05));
            transform.setPosition(patchX, 0.034, patchZ);
            this.roadBatches.roadPatches.setMatrixAt(index, transform);
          } else hide(this.roadBatches.roadPatches, index);
        }
        const utilityIndex = segmentIndex * 3 + laneIndex;
        if (!module.rail && ROUTE_UTILITY_MOTIFS.has(module.motif) && (serial + laneIndex) % 4 === 0) {
          transform.makeTranslation(lane * LANE_WIDTH + center * 0.22, 0.052, z + 3.2 - laneIndex * 4.35);
          this.roadBatches.manholes.setMatrixAt(utilityIndex, transform);
        } else hide(this.roadBatches.manholes, utilityIndex);
      });

      for (let row = 0; row < 5; row += 1) {
        const index = segmentIndex * 5 + row;
        const crossing = module.motif === "crossing" || module.motif === "threshold" && serial % 3 === 0;
        if (crossing) {
          transform.makeScale(module.widthScale * 0.9, 1, module.motif === "threshold" ? 0.68 : 1);
          transform.setPosition(center, 0.052, z - 1.45 + row * (module.motif === "threshold" ? 0.92 : 0.72));
          this.roadBatches.crosswalks.setMatrixAt(index, transform);
        } else hide(this.roadBatches.crosswalks, index);
      }

      [-1, 1].forEach((side, sideIndex) => {
        for (let row = 0; row < 2; row += 1) {
          const index = segmentIndex * 4 + sideIndex * 2 + row;
          if (!module.rail && ROUTE_DRAIN_MOTIFS.has(module.motif)) {
            transform.makeScale(module.motif === "drain" ? 1.35 : 0.9, 1, module.motif === "drain" ? 1.5 : 1);
            transform.setPosition(center + side * (roadHalfWidth - 0.35), 0.046, z - 4.3 + row * 8.5 + serial % 2 * 0.8);
            this.roadBatches.drains.setMatrixAt(index, transform);
          } else hide(this.roadBatches.drains, index);
        }
        for (let row = 0; row < 4; row += 1) {
          const postIndex = segmentIndex * 8 + sideIndex * 4 + row;
          const postZ = z - 6 + row * 4.15 + sideIndex * 0.5;
          const postVisible = ROUTE_LIT_SHOULDERS.has(module.shoulder) || (row + serial + sideIndex) % 3 === 0;
          if (postVisible) {
            const postX = center + side * (roadHalfWidth + Math.max(0.18, walkWidth - 0.38));
            transform.makeTranslation(postX, 0.54, postZ);
            this.roadBatches.edgePosts.setMatrixAt(postIndex, transform);
            transform.makeScale(module.shoulder === "stage" || module.shoulder === "cinema" ? 1.35 : 1, 1, 1);
            transform.setPosition(postX, 0.92, postZ);
            this.roadBatches.edgePostLights.setMatrixAt(postIndex, transform);
          } else {
            hide(this.roadBatches.edgePosts, postIndex);
            hide(this.roadBatches.edgePostLights, postIndex);
          }
        }
        for (let row = 0; row < 2; row += 1) {
          const index = segmentIndex * 4 + sideIndex * 2 + row;
          const planterZ = z - 5.15 + row * 9.7 + sideIndex * 1.1;
          const planterVisible = ROUTE_PLANTED_SHOULDERS.has(module.shoulder) && (serial + row * 2 + sideIndex) % 3 !== 1;
          const planterX = center + side * (roadHalfWidth + walkWidth - 0.18 + row * 0.08);
          if (planterVisible) {
            transform.makeTranslation(planterX, 0.54, planterZ);
            this.roadBatches.planterBases.setMatrixAt(index, transform);
            transform.makeScale(0.84 + (serial + row) % 3 * 0.08, 0.92 + sideIndex * 0.07, 0.84 + row * 0.08);
            transform.setPosition(planterX, 1.15, planterZ);
            this.roadBatches.planterLeaves.setMatrixAt(index, transform);
          } else {
            hide(this.roadBatches.planterBases, index);
            hide(this.roadBatches.planterLeaves, index);
          }
        }
      });

      for (let row = 0; row < 6; row += 1) {
        const index = segmentIndex * 6 + row;
        const bandZ = z - 6.4 + row * 2.55;
        let bandX = center;
        let bandY = 0.058;
        let bandWidth = roadWidth * 0.84;
        let bandDepth = 0.055;
        let bandRotation = 0;
        if (["stone", "leaf", "cobble"].includes(module.motif)) {
          bandX += (row % 3 - 1) * LANE_WIDTH;
          bandWidth = 1.45 + (module.variant + row) % 3 * 0.34;
          bandDepth = module.motif === "cobble" ? 0.42 : 0.11;
          bandRotation = (row % 3 - 1) * (module.motif === "leaf" ? 0.32 : 0.08);
        } else if (["bookspine", "pulse", "checker"].includes(module.motif)) {
          bandX += (row % 3 - 1) * LANE_WIDTH;
          bandWidth = module.motif === "pulse" ? 0.34 + row % 2 * 0.22 : 1.85;
          bandDepth = module.motif === "bookspine" ? 0.78 + row % 3 * 0.28 : 0.48 + row % 2 * 0.34;
        } else if (["tactile", "terminal"].includes(module.motif)) {
          bandX += (row % 2 ? 1 : -1) * (roadHalfWidth - 0.42);
          bandWidth = 0.18;
          bandDepth = 1.85;
        } else if (module.motif === "marquee") {
          bandWidth = roadWidth * 0.62;
          bandDepth = 0.055;
          bandRotation = (row - 2.5) * 0.13;
        } else if (["boardwalk", "detour", "steps", "memory"].includes(module.motif)) {
          bandWidth = roadWidth * (module.motif === "memory" ? 0.94 - row * 0.035 : 0.96);
          bandDepth = module.motif === "steps" ? 0.3 : 0.065;
          bandRotation = module.motif === "detour" ? (row % 2 ? 0.16 : -0.16) : 0;
          bandY += module.motif === "steps" ? row * 0.004 : 0;
        } else if (["drain", "dryline"].includes(module.motif)) {
          bandX += module.motif === "drain" ? (row % 2 ? 1 : -1) * (roadHalfWidth - 0.52) : 0;
          bandWidth = module.motif === "drain" ? 0.42 : roadWidth * 0.36;
          bandDepth = module.motif === "drain" ? 1.3 : 0.12;
        } else if (module.motif === "grid") {
          bandWidth = row % 2 ? 0.12 : roadWidth * 0.9;
          bandDepth = row % 2 ? 2.25 : 0.1;
          bandX += row % 2 ? (row - 2.5) * 1.45 : 0;
        } else if (module.motif === "threshold") {
          bandWidth = roadWidth * (0.88 - row * 0.075);
          bandDepth = 0.18;
        } else if (module.motif === "rail") {
          bandX += (row % 3 - 1) * LANE_WIDTH;
          bandWidth = 1.4;
          bandDepth = 0.055;
        } else {
          bandWidth = roadWidth * 0.72;
          bandDepth = 0.07;
          bandRotation = (row % 2 ? 1 : -1) * 0.08;
        }
        transform.makeRotationY(bandRotation);
        transform.scale(scale.set(bandWidth, 1, bandDepth));
        transform.setPosition(bandX, bandY, bandZ);
        this.roadBatches.themeBands.setMatrixAt(index, transform);

        const motifVisible = ROUTE_MOTIF_INSTANCES.has(module.motif);
        if (motifVisible) {
          const motifScale = module.motif === "groove" ? 0.72 + row * 0.2 : module.motif === "wave" ? 0.5 + row % 3 * 0.28 : 0.3 + (module.variant + row) % 4 * 0.11;
          const motifX = module.motif === "tactile" || module.motif === "terminal"
            ? center + (row % 2 ? 1 : -1) * (roadHalfWidth - 0.45)
            : center + (row % 3 - 1) * LANE_WIDTH + Math.sin(serial + row) * 0.22;
          transform.makeScale(module.motif === "wave" ? motifScale * 2.4 : motifScale, 1, module.motif === "groove" ? motifScale : motifScale * 0.62);
          transform.setPosition(motifX, 0.066, bandZ + 0.64);
          this.roadBatches.themeMotifs.setMatrixAt(index, transform);
        } else hide(this.roadBatches.themeMotifs, index);
      }
    });
    this.roadBatchList.forEach((batch) => {
      batch.instanceMatrix.needsUpdate = true;
    });
    const activeModule = routeModuleAt(stageIndex, phaseIndex, 0);
    this.canvas.setAttribute("data-road-module", activeModule.id);
    this.canvas.setAttribute("data-road-surface-family", activeModule.surface);
    this.canvas.setAttribute("data-road-module-cycle", String(Math.max(0, roadCycle)));
    this.canvas.setAttribute("data-road-rail", String(railRoute));
  }

  rebuildDecor() {
    const config = this.stageConfig || STAGE_CONFIGS[this.stageIndex];
    const phase = this.routePhase || 0;
    const preserveCenterSightline = this.stageIndex === 1;
    this.roadSegments.forEach((segment, index) => {
      const oldDecor = segment.userData.decor;
      segment.remove(oldDecor);
      disposeObject(oldDecor);
      const decor = new THREE.Group();
      const module = routeModuleAt(this.stageIndex, phase, index);
      decor.name = `route-${module.id}-${module.variant}`;
      if (this.stageIndex === 0) {
        decor.userData.trackClearance = true;
        decor.userData.routeModuleId = module.id;
        decor.userData.routeSurfaceFamily = module.surface;
        segment.add(decor);
        segment.userData.decor = decor;
        return;
      }
      const spanningType = config.props.find((type) => type === "tunnel" || type === "terminal" || type === "overpass");
      if (!preserveCenterSightline && index < 10 && spanningType && index % 7 === 3) {
        const spanning = createProp(spanningType, config.accent, index + this.stageIndex);
        spanning.position.set(0, 0.18, 0);
        spanning.userData.overheadClearance = TRACK_CLEARANCE.overheadY;
        decor.add(spanning);
      }
      if (index < 10) {
        const tracksideProps = PHASE_TRACKSIDE_PROPS[this.stageIndex]?.[phase]
          || STAGE_TRACKSIDE_PROPS[this.stageIndex]
          || STAGE_TRACKSIDE_PROPS[0];
        [-1, 1].forEach((side, sideIndex) => {
          const type = tracksideProps[(module.variant + index + sideIndex * 2) % tracksideProps.length];
          const prop = createProp(type, config.accent, index * 7 + sideIndex * 3 + this.stageIndex + phase * 11);
          const compact = ["lamp", "signal", "tree", "bench", "warning"].includes(type);
          prop.scale.setScalar((compact ? 0.86 : 0.74 + (index % 3) * 0.035) * (preserveCenterSightline ? 0.82 : 1));
          prop.position.y = 0.18;
          prop.rotation.y = type === "railing" ? 0 : side < 0 ? Math.PI / 2 : -Math.PI / 2;
          fitTracksideObject(prop, side, side * ((preserveCenterSightline ? 6.7 : 5.95) + (index % 3) * 0.28), sideIndex ? -2.8 : 2.4);
          decor.add(prop);
        });
      }
      if (!preserveCenterSightline && index % Math.max(4, 6 - phase) === 0) {
        const gantry = createGantry(config.accent, this.stageIndex === 5);
        gantry.position.z = -4.8;
        gantry.userData.overheadClearance = TRACK_CLEARANCE.overheadY;
        decor.add(gantry);
      }
      if (!preserveCenterSightline && index < 10 && index % 5 === (4 - phase + 5) % 5) {
        const stageSpan = createStageSpan(this.stageIndex, config.accent, index);
        stageSpan.position.z = 3.4;
        stageSpan.userData.overheadClearance = TRACK_CLEARANCE.overheadY;
        decor.add(stageSpan);
      }
      if (!preserveCenterSightline && index === 9) {
        const districtGate = createDistrictGateway(config);
        districtGate.scale.setScalar(0.72);
        districtGate.position.set(0, 0.18, -3.8);
        districtGate.userData.overheadClearance = TRACK_CLEARANCE.overheadY;
        decor.add(districtGate);
      }
      decor.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(decor);
      decor.userData.minZ = bounds.isEmpty() ? 0 : bounds.min.z;
      decor.userData.maxZ = bounds.isEmpty() ? 0 : bounds.max.z;
      decor.userData.trackClearance = true;
      decor.userData.routeModuleId = module.id;
      decor.userData.routeSurfaceFamily = module.surface;
      segment.add(decor);
      segment.userData.decor = decor;
    });
  }

  buildWeather() {
    this.worldParticleTextures = this.stageVisualConfigs.map((config) => makeWorldParticleTexture(config.world.particles.kind, config.accent));
    const rainCount = 420;
    const rainPositions = new Float32Array(rainCount * 2 * 3);
    for (let index = 0; index < rainCount; index += 1) {
      const x = ((index * 73) % 1000) / 1000 * 19 - 9.5;
      const y = ((index * 193) % 1000) / 1000 * 14;
      const z = -((index * 157) % 1000) / 1000 * 58 + 8;
      const offset = index * 6;
      rainPositions[offset] = x;
      rainPositions[offset + 1] = y;
      rainPositions[offset + 2] = z;
      rainPositions[offset + 3] = x - 0.08;
      rainPositions[offset + 4] = y - 0.72;
      rainPositions[offset + 5] = z + 0.04;
    }
    const rainGeometry = new THREE.BufferGeometry();
    rainGeometry.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
    this.rain = new THREE.LineSegments(rainGeometry, new THREE.LineBasicMaterial({ color: 0xc7e5eb, transparent: true, opacity: 0, depthWrite: false }));
    this.rain.frustumCulled = false;
    this.scene.add(this.rain);

    const ambientCount = 180;
    const ambientPositions = new Float32Array(ambientCount * 3);
    for (let index = 0; index < ambientCount; index += 1) {
      ambientPositions[index * 3] = ((index * 47) % 997) / 997 * 18 - 9;
      ambientPositions[index * 3 + 1] = ((index * 83) % 991) / 991 * 7 + 0.6;
      ambientPositions[index * 3 + 2] = -((index * 137) % 983) / 983 * 64 + 8;
    }
    const ambientGeometry = new THREE.BufferGeometry();
    ambientGeometry.setAttribute("position", new THREE.BufferAttribute(ambientPositions, 3));
    this.ambientParticles = new THREE.Points(ambientGeometry, new THREE.PointsMaterial({
      map: this.worldParticleTextures[0],
      color: STAGE_CONFIGS[0].accent,
      size: 0.13,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    }));
    this.ambientParticles.frustumCulled = false;
    this.scene.add(this.ambientParticles);

    const streakCount = 58;
    const streakPositions = new Float32Array(streakCount * 2 * 3);
    for (let index = 0; index < streakCount; index += 1) {
      const x = ((index * 59) % 1000) / 1000 * 11 - 5.5;
      const y = ((index * 113) % 1000) / 1000 * 5 + 0.5;
      const z = -((index * 181) % 1000) / 1000 * 34 + 7;
      const offset = index * 6;
      streakPositions[offset] = x;
      streakPositions[offset + 1] = y;
      streakPositions[offset + 2] = z;
      streakPositions[offset + 3] = x;
      streakPositions[offset + 4] = y;
      streakPositions[offset + 5] = z + 1.2;
    }
    const streakGeometry = new THREE.BufferGeometry();
    streakGeometry.setAttribute("position", new THREE.BufferAttribute(streakPositions, 3));
    this.speedStreaks = new THREE.LineSegments(streakGeometry, new THREE.LineBasicMaterial({ color: 0xdaf6ef, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.speedStreaks.frustumCulled = false;
    this.scene.add(this.speedStreaks);
  }

  setPowerupAccent(config) {
    const visuals = this.powerupVisuals;
    if (!visuals) return;
    visuals.magnet.material.color.setHex(POWERUP_COLORS.magnet);
    visuals.shield.shellMaterial.color.setHex(POWERUP_COLORS.shield);
    visuals.shield.ringMaterial.color.copy(new THREE.Color(config.accent).lerp(new THREE.Color(0xe9fbff), 0.78));
    visuals.multiplier.afterimages[0].material.color.setHex(POWERUP_COLORS.multiplier);
    visuals.multiplier.afterimages[1].material.color.setHex(config.accent);
    visuals.multiplier.scorePulseMaterial.color.copy(new THREE.Color(config.accent).lerp(new THREE.Color(POWERUP_COLORS.multiplier), 0.58));
    visuals.overdrive.speedWaveMaterial.color.setHex(POWERUP_COLORS.overdrive);
    visuals.overdrive.edgeFlowMaterial.color.copy(new THREE.Color(config.accent).lerp(new THREE.Color(0xfff0a1), 0.68));
    visuals.storyWorld.roadMaterial.color.setHex(config.accent);
    visuals.storyWorld.localWeatherMaterial.color.setHex(config.accent);
    visuals.storyWorld.light.color.setHex(config.accent);
    visuals.synergy.materials[0].color.setHex(config.accent);
    visuals.synergy.light.color.setHex(config.accent);
  }

  syncPowerupState(powerups, delta) {
    const hasSnapshot = readPowerupSnapshot(powerups, this.powerupSnapshot);
    POWERUP_TYPES.forEach((type) => {
      const eventState = this.powerupEvents[type];
      eventState.remaining = Math.max(0, eventState.remaining - delta);
      const active = eventState.remaining > 0 || (hasSnapshot && this.powerupSnapshot[type]);
      this.powerupTargets[type] = active ? 1 : 0;
      this.powerupStrengths[type] = damp(this.powerupStrengths[type], this.powerupTargets[type], active ? 15 : 8, delta);
    });
  }

  startPowerup(detail = {}) {
    const type = normalizePowerup(detail.powerup ?? detail);
    if (!type) return;
    const duration = powerupDuration(detail.duration ?? detail.remaining ?? detail.timeLeft, 6);
    const eventState = this.powerupEvents[type];
    eventState.duration = duration;
    eventState.remaining = Math.max(eventState.remaining, duration);
    this.powerupTargets[type] = 1;
    this.powerupStrengths[type] = Math.max(this.powerupStrengths[type], 0.2);
    if (type === "shield") {
      this.flash = Math.max(this.flash, 0.12);
      this.flashMaterial.color.setHex(POWERUP_COLORS.shield);
    } else if (type === "multiplier") {
      this.scorePulse = 1;
    } else if (type === "overdrive") {
      this.speedPulse = Math.max(this.speedPulse, 1.1);
    }
  }

  endPowerup(detail = {}) {
    const type = normalizePowerup(detail.powerup ?? detail);
    if (!type) return;
    this.powerupEvents[type].remaining = 0;
    this.powerupTargets[type] = 0;
  }

  triggerShieldBlock(detail = {}) {
    const slot = this.powerupEffectPool[this.powerupEffectCursor % this.powerupEffectPool.length];
    this.powerupEffectCursor += 1;
    const lane = Number(detail.lane ?? detail.entity?.lane);
    const sourceZ = Number(detail.z ?? detail.entity?.z);
    const effectX = Number.isFinite(lane) ? lane * LANE_WIDTH : this.currentLaneX;
    const effectZ = Number.isFinite(sourceZ)
      ? PLAYER_Z + (COLLISION_Z - sourceZ) * WORLD_Z_SCALE
      : PLAYER_Z - 0.12;
    slot.life = slot.duration;
    slot.group.visible = true;
    slot.group.position.set(effectX, 1.18, effectZ);
    slot.ripple.rotation.set(0, 0, Number(detail.side) * 0.12 || 0);
    slot.ripple.scale.setScalar(0.72);
    slot.ripple.material.opacity = 0.92;
    slot.shards.count = 12;
    slot.shards.material.opacity = 0.84;
    for (let index = 0; index < 12; index += 1) {
      const angle = index / 12 * Math.PI * 2 + (index % 2) * 0.22;
      const offset = index * 3;
      slot.positions[offset] = 0;
      slot.positions[offset + 1] = 0;
      slot.positions[offset + 2] = 0;
      slot.velocities[offset] = Math.cos(angle) * (0.85 + (index % 3) * 0.18);
      slot.velocities[offset + 1] = Math.sin(angle) * 0.72 + 0.28;
      slot.velocities[offset + 2] = 0.28 + (index % 4) * 0.11;
    }
    this.powerupStrengths.shield = Math.max(this.powerupStrengths.shield, 0.72);
    this.shake = Math.max(this.shake, 0.2);
    this.flash = Math.max(this.flash, 0.16);
    this.flashMaterial.color.setHex(POWERUP_COLORS.shield);
  }

  triggerStoryWorld(interaction = {}) {
    const item = interaction.item || interaction.storyItem || interaction.collectible || interaction;
    const world = interaction.world && typeof interaction.world === "object" ? interaction.world : {};
    const gameplay = interaction.gameplay && typeof interaction.gameplay === "object" ? interaction.gameplay : {};
    const character = interaction.character && typeof interaction.character === "object" ? interaction.character : {};
    const gameplayPowerup = normalizePowerup(gameplay.effect);
    const semanticKind = String(item?.kind || world.changeType || interaction.changeType || gameplay.effect || "memory").toLowerCase();
    let kind = semanticKind;
    if (/rain|shelter|canopy|storm|steam|cocoa/.test(semanticKind)) kind = "umbrella";
    else if (/petal|flower|green|growth|plant|bloom/.test(semanticKind)) kind = "plant";
    else if (/groove|record|concert|rhythm|credit/.test(semanticKind)) kind = "record";
    else if (/light|beacon|door|key|guard|homeward/.test(semanticKind)) kind = "lamp";
    const config = this.stageConfig || STAGE_CONFIGS[this.stageIndex];
    const color = storyPropColor(item, POWERUP_COLORS[gameplayPowerup] || config.accent);
    const lane = Number(interaction.lane ?? item?.lane);
    const sourceZ = Number(interaction.z ?? item?.z);
    const group = this.powerupVisuals.storyWorld.group;
    group.position.set(
      Number.isFinite(lane) ? lane * LANE_WIDTH : this.currentLaneX,
      0,
      Number.isFinite(sourceZ) ? PLAYER_Z + (COLLISION_Z - sourceZ) * WORLD_Z_SCALE : PLAYER_Z - 4.2
    );
    const state = this.storyWorldState;
    state.duration = powerupDuration(interaction.duration ?? world.duration ?? gameplay.durationMs, 2.8);
    state.life = state.duration;
    state.elapsed = 0;
    state.intensity = clamp(Math.max(Number(world.intensity) || 0, Number(character.intensity) || 0, Number(interaction.intensity) || 0.3), 0.3, 1);
    state.kind = kind;
    const characterCue = `${character.immediateAction || character.action || ""} ${character.emotion || ""}`;
    state.gesture = /冲刺|加快|快速|重拍|长步|连续变线/.test(characterCue)
      ? "surge"
      : /护住|稳住|托住|抱稳|握紧|贴近|压低|挡雨/.test(characterCue)
        ? "protect"
        : /递出|抬高|举起|展开|伸手|指向/.test(characterCue)
          ? "reach"
          : /侧身|换手|绕开|切入|转弯|调整/.test(characterCue)
            ? "weave"
            : "focus";
    state.emotion = String(character.emotion || "");
    state.color = color;
    this.powerupVisuals.storyWorld.roadMaterial.color.setHex(color);
    this.powerupVisuals.storyWorld.localWeatherMaterial.color.setHex(color);
    this.powerupVisuals.storyWorld.light.color.setHex(color);
    this.itemPulse = { kind, color, life: state.duration, duration: state.duration };
  }

  triggerStorySynergy(interaction = {}) {
    const item = interaction.item || interaction.storyItem || interaction;
    const world = interaction.world && typeof interaction.world === "object" ? interaction.world : {};
    const gameplayPowerup = normalizePowerup(interaction.gameplay?.effect);
    const config = this.stageConfig || STAGE_CONFIGS[this.stageIndex];
    const color = storyPropColor(item, POWERUP_COLORS[gameplayPowerup] || config.accent);
    const lane = Number(interaction.lane ?? item?.lane);
    const sourceZ = Number(interaction.z ?? item?.z);
    const group = this.powerupVisuals.synergy.group;
    group.position.set(
      Number.isFinite(lane) ? lane * LANE_WIDTH : this.currentLaneX,
      0,
      Number.isFinite(sourceZ) ? PLAYER_Z + (COLLISION_Z - sourceZ) * WORLD_Z_SCALE : PLAYER_Z - 2.2
    );
    const state = this.synergyState;
    state.duration = powerupDuration(interaction.duration, 0.82);
    state.life = state.duration;
    state.elapsed = 0;
    state.intensity = clamp((Number(world.intensity) || 0.7) + Math.min(0.2, (world.synergyChanges?.length || 0) * 0.05), 0.4, 1);
    state.color = color;
    this.powerupVisuals.synergy.materials[0].color.setHex(color);
    this.powerupVisuals.synergy.light.color.setHex(color);
    this.flash = Math.max(this.flash, 0.34);
    this.flashMaterial.color.setHex(color);
    this.shake = Math.max(this.shake, 0.24);
    this.speedPulse = Math.max(this.speedPulse, 1.18);
    this.scorePulse = 1;
  }

  updatePowerupVisuals(delta, time, speed, arriving) {
    const visuals = this.powerupVisuals;
    const scratch = visuals.scratch;
    const cinematicPov = this.stageIndex === 0 && !arriving;
    const enabled = arriving ? 0 : 1;
    const magnetStrength = this.powerupStrengths.magnet * enabled;
    const shieldStrength = this.powerupStrengths.shield * enabled;
    const multiplierStrength = this.powerupStrengths.multiplier * enabled;
    const overdriveStrength = this.powerupStrengths.overdrive * enabled;

    const magnetActive = magnetStrength > 0.01;
    visuals.magnet.group.visible = magnetActive && !cinematicPov;
    if (magnetActive) {
      visuals.magnet.group.position.set(this.currentLaneX, 1.05, PLAYER_Z - 0.16);
      visuals.magnet.material.opacity = magnetStrength * (0.18 + Math.sin(time * 8) * 0.035);
      visuals.magnet.arcs.forEach((arc, index) => {
        arc.rotation.z = -Math.PI * 0.74 + index * 0.08 + Math.sin(time * 2.8 + index) * 0.09;
        arc.rotation.y = Math.sin(time * 3.4 + index * 0.8) * 0.12;
      });
    }

    const shieldActive = shieldStrength > 0.01;
    visuals.shield.group.visible = shieldActive && !cinematicPov;
    if (shieldActive) {
      visuals.shield.group.position.set(this.currentLaneX, 0, PLAYER_Z - 0.02);
      const shieldPulse = 1 + Math.sin(time * 5.4) * 0.018 * shieldStrength;
      visuals.shield.shell.scale.set(0.84 * shieldPulse, 1.42 * shieldPulse, 0.68 * shieldPulse);
      visuals.shield.shellMaterial.opacity = shieldStrength * 0.12;
      visuals.shield.ringMaterial.opacity = shieldStrength * (0.28 + Math.sin(time * 7.2) * 0.055);
      visuals.shield.rings.forEach((ring, index) => {
        ring.rotation.z = time * (index ? -0.72 : 0.82);
      });
    }

    this.scorePulse = Math.max(0, this.scorePulse - delta * 2.5);
    const multiplierActive = multiplierStrength > 0.01;
    visuals.multiplier.group.visible = multiplierActive && !cinematicPov;
    if (multiplierActive) {
      visuals.multiplier.afterimages.forEach((afterimage, index) => {
        afterimage.position.set(
          this.currentLaneX - this.lateralVelocity * (0.045 + index * 0.035),
          0.04 + index * 0.025,
          PLAYER_Z + 0.32 + index * 0.32
        );
        afterimage.scale.setScalar(1 + index * 0.035);
        afterimage.material.opacity = multiplierStrength * (index ? 0.13 : 0.22) * (0.82 + Math.sin(time * 9 - index) * 0.18);
      });
      const scoreBeat = 1 - ((time * 2.25) % 1);
      const scoreStrength = Math.max(this.scorePulse, scoreBeat * 0.58) * multiplierStrength;
      visuals.multiplier.scorePulseMaterial.opacity = scoreStrength * 0.34;
      visuals.multiplier.scorePulses.forEach((pulse, index) => {
        pulse.position.set(this.currentLaneX, 1.1 + index * 0.28, PLAYER_Z + 0.08 + index * 0.08);
        pulse.scale.setScalar(0.64 + (1 - scoreBeat) * (1.15 + index * 0.3));
        pulse.rotation.z = time * (index ? -0.9 : 1.1);
      });
    }

    const overdriveActive = overdriveStrength > 0.01;
    visuals.overdrive.group.visible = overdriveActive && !cinematicPov;
    visuals.overdrive.speedWaveMaterial.opacity = overdriveStrength * 0.24;
    visuals.overdrive.edgeFlowMaterial.opacity = overdriveStrength * 0.62;
    visuals.overdrive.speedWaves.count = overdriveActive && !cinematicPov ? 6 : 0;
    visuals.overdrive.edgeFlow.count = overdriveActive && !cinematicPov ? 20 : 0;
    if (overdriveActive) {
      scratch.euler.set(-Math.PI / 2, 0, 0);
      scratch.quaternion.setFromEuler(scratch.euler);
      for (let index = 0; index < 6; index += 1) {
        const travel = (time * Math.max(speed, 10) * 1.55 + index * 5.7) % 34;
        scratch.position.set(0, 0.035, -27 + travel);
        scratch.scale.set(3.2 + index * 0.08, 1.22 + overdriveStrength * 0.35, 1);
        scratch.matrix.compose(scratch.position, scratch.quaternion, scratch.scale);
        visuals.overdrive.speedWaves.setMatrixAt(index, scratch.matrix);
      }
      visuals.overdrive.speedWaves.instanceMatrix.needsUpdate = true;
      scratch.quaternion.identity();
      for (let index = 0; index < 20; index += 1) {
        const row = Math.floor(index / 2);
        const travel = (time * Math.max(speed, 10) * 2.05 + row * 3.8) % 38;
        scratch.position.set(index % 2 ? 4.18 : -4.18, 0.045, -30 + travel);
        scratch.scale.set(1, 1, 1 + overdriveStrength * 1.8);
        scratch.matrix.compose(scratch.position, scratch.quaternion, scratch.scale);
        visuals.overdrive.edgeFlow.setMatrixAt(index, scratch.matrix);
      }
      visuals.overdrive.edgeFlow.instanceMatrix.needsUpdate = true;
    }

    const storyState = this.storyWorldState;
    storyState.life = Math.max(0, storyState.life - delta);
    storyState.elapsed += storyState.life > 0 ? delta : 0;
    const storyEnvelope = storyState.life > 0
      ? clamp(storyState.elapsed / 0.2, 0, 1) * clamp(storyState.life / 0.7, 0, 1) * storyState.intensity
      : 0;
    this.storyWorldInfluence = storyEnvelope;
    const storyActive = storyEnvelope > 0.001 && !arriving;
    visuals.storyWorld.group.visible = storyActive && !cinematicPov;
    visuals.storyWorld.roadPatches.count = storyActive && !cinematicPov ? 5 : 0;
    visuals.storyWorld.roadMaterial.opacity = storyEnvelope * 0.32;
    if (storyActive) {
      scratch.euler.set(-Math.PI / 2, 0, 0);
      scratch.quaternion.setFromEuler(scratch.euler);
      for (let index = 0; index < 5; index += 1) {
        const pulse = (storyState.elapsed * 1.8 + index * 0.19) % 1;
        scratch.position.set((index - 2) * 0.28, 0.04, (index - 2) * 1.18);
        scratch.scale.setScalar(0.72 + pulse * 2.35);
        scratch.matrix.compose(scratch.position, scratch.quaternion, scratch.scale);
        visuals.storyWorld.roadPatches.setMatrixAt(index, scratch.matrix);
      }
      visuals.storyWorld.roadPatches.instanceMatrix.needsUpdate = true;
    }
    visuals.storyWorld.localWeatherMaterial.opacity = storyEnvelope * (storyState.kind === "umbrella" ? 0.16 : 0.58);
    visuals.storyWorld.localWeather.rotation.y = time * (storyState.kind === "record" ? 1.2 : 0.34);
    visuals.storyWorld.localWeather.position.y = Math.sin(time * 2.6) * 0.12;
    visuals.storyWorld.light.intensity = storyEnvelope * 11;

    const synergyState = this.synergyState;
    synergyState.life = Math.max(0, synergyState.life - delta);
    synergyState.elapsed += synergyState.life > 0 ? delta : 0;
    const synergyEnvelope = synergyState.life > 0
      ? clamp(synergyState.elapsed / 0.09, 0, 1) * clamp(synergyState.life / 0.38, 0, 1) * synergyState.intensity
      : 0;
    this.synergyInfluence = synergyEnvelope;
    const synergyActive = synergyEnvelope > 0.001 && !arriving;
    visuals.synergy.group.visible = synergyActive && !cinematicPov;
    if (synergyActive) {
      visuals.synergy.waves.forEach((wave, index) => {
        const progress = clamp(synergyState.elapsed / synergyState.duration, 0, 1);
        wave.scale.setScalar(0.58 + progress * (index ? 3.8 : 5.2));
        wave.rotation.z = time * (index ? -2.2 : 1.7);
        wave.material.opacity = synergyEnvelope * (index ? 0.5 : 0.72);
      });
    }
    visuals.synergy.light.intensity = synergyEnvelope * 22;

    this.powerupEffectPool.forEach((slot, slotIndex) => {
      if (slot.life <= 0) return;
      if (cinematicPov) slot.group.visible = false;
      slot.life = Math.max(0, slot.life - delta);
      const progress = 1 - slot.life / slot.duration;
      slot.ripple.scale.setScalar(0.72 + progress * 3.2);
      slot.ripple.material.opacity = (1 - progress) * 0.92;
      slot.shards.material.opacity = (1 - progress) * 0.84;
      for (let index = 0; index < 12; index += 1) {
        const offset = index * 3;
        slot.positions[offset] += slot.velocities[offset] * delta;
        slot.positions[offset + 1] += slot.velocities[offset + 1] * delta;
        slot.positions[offset + 2] += slot.velocities[offset + 2] * delta;
        slot.velocities[offset + 1] -= delta * 1.4;
        scratch.position.fromArray(slot.positions, offset);
        scratch.euler.set(time * 5 + index, time * 3.2 + index * 0.7, slotIndex * 0.4 + index);
        scratch.quaternion.setFromEuler(scratch.euler);
        scratch.scale.setScalar(Math.max(0.01, (1 - progress) * (0.76 + (index % 3) * 0.12)));
        scratch.matrix.compose(scratch.position, scratch.quaternion, scratch.scale);
        slot.shards.setMatrixAt(index, scratch.matrix);
      }
      slot.shards.instanceMatrix.needsUpdate = true;
      if (slot.life <= 0) {
        slot.group.visible = false;
        slot.shards.count = 0;
      }
    });

    const config = this.stageConfig || STAGE_CONFIGS[this.stageIndex];
    const baseEnvironment = ["neon", "rain", "storm", "starlight"].includes(config.weather) ? 0.9 : 0.72;
    this.scene.environmentIntensity = baseEnvironment + overdriveStrength * 0.08 + storyEnvelope * 0.1 + synergyEnvelope * 0.18;
    this.edgeLight.intensity = config.world.lighting.edgeIntensity + overdriveStrength * 3.6 + synergyEnvelope * 2.4;
  }

  beginStageIntro(detail = {}) {
    const requested = detail.stageIndex ?? detail.index ?? (Number.isFinite(Number(detail.stage)) ? Number(detail.stage) - 1 : this.stageIndex);
    const stageIndex = clamp(Math.trunc(Number(requested) || 0), 0, STAGE_CONFIGS.length - 1);
    const stageContent = detail.stageContent || detail.content || (
      detail.world || detail.theme || detail.sceneMood || detail.roadDesign || detail.obstacleDesign ? detail : null
    );
    if (stageIndex !== this.stageIndex || stageContent) this.setStage(stageIndex, Boolean(detail.immediate), stageContent);
    const config = this.stageVisualConfigs[stageIndex] || resolveStageVisualConfig(stageIndex, stageContent);
    const duration = clamp(Number(detail.duration) || Number(detail.durationMs) / 1000 || Number(detail.openingPerformance?.durationMs) / 1000 || 2.4, 0.6, 8);
    this.stageIntroState.active = true;
    this.stageIntroState.elapsed = 0;
    this.stageIntroState.duration = duration;
    this.stageIntroState.stageIndex = stageIndex;
    this.stageIntroState.intensity = clamp(Number(detail.intensity) || 1, 0.2, 1.4);
    this.stageIntroState.beatIndex = 0;
    this.stageIntroState.beatElapsed = 0;
    this.stageIntroState.cameraCue = config.visual?.introCueSequence?.[0] || "street-wide";
    this.stageIntroState.actionCue = introCameraCue(this.stageIntroState.cameraCue).action;
    const visuals = this.stageIntroVisual;
    visuals.root.visible = stageIndex !== 0;
    visuals.root.scale.setScalar(0.01);
    visuals.token.geometry = createStageTokenGeometry(stageIndex);
    visuals.tokenMaterial.color.setHex(STAGE_TOKEN_COLORS[stageIndex] || 0xffffff);
    visuals.tokenMaterial.emissive.setHex(config.accent);
    visuals.rings.forEach((ring) => ring.material.color.setHex(config.accent));
    visuals.rays.forEach((ray, index) => ray.material.color.setHex(index % 2 ? config.accent : config.theme.highlight));
    visuals.particles.material.color.setHex(config.accent);
    visuals.light.color.setHex(config.accent);
    this.canvas.setAttribute("data-stage-intro", String(stageIndex + 1));
    return this.snapshot();
  }

  stageIntro(detail = {}) {
    return this.beginStageIntro(detail);
  }

  stageIntroBeat(detail = {}) {
    if (!this.stageIntroState.active) return;
    const beatIndex = clamp(Math.trunc(Number(detail.beatIndex ?? detail.currentBeat?.index) || 0), 0, 8);
    const config = this.stageVisualConfigs[this.stageIntroState.stageIndex] || this.stageConfig;
    const cueSequence = config?.visual?.introCueSequence || [];
    const cameraCue = detail.cameraCue || detail.currentBeat?.cameraCue || cueSequence[beatIndex % Math.max(1, cueSequence.length)] || "runner-follow";
    this.stageIntroState.beatIndex = beatIndex;
    this.stageIntroState.beatElapsed = 0;
    this.stageIntroState.cameraCue = cameraCue;
    this.stageIntroState.actionCue = detail.actionCue || detail.currentBeat?.actionCue || introCameraCue(cameraCue).action;
    this.stageIntroState.intensity = Math.min(1.4, Math.max(this.stageIntroState.intensity, 1 + beatIndex * 0.08));
    this.stageIntroVisual.rings.forEach((ring, index) => {
      ring.scale.setScalar(0.72 + index * 0.12);
      ring.material.opacity = 0.82 - index * 0.14;
    });
    this.stageIntroVisual.light.intensity = 22;
    this.flash = Math.max(this.flash, 0.12 + beatIndex * 0.035);
  }

  endStageIntro() {
    this.stageIntroState.active = false;
    this.stageIntroState.elapsed = 0;
    this.stageIntroState.intensity = 0;
    this.stageIntroVisual.root.visible = false;
    this.canvas.removeAttribute("data-stage-intro");
  }

  updateStageIntroVisual(delta, time) {
    const state = this.stageIntroState;
    if (!state.active) return;
    state.elapsed += delta;
    state.beatElapsed += delta;
    const progress = clamp(state.elapsed / state.duration, 0, 1);
    const enter = clamp(progress / 0.2, 0, 1);
    const leave = clamp((1 - progress) / 0.28, 0, 1);
    const envelope = enter * enter * (3 - enter * 2) * leave * leave * (3 - leave * 2) * state.intensity;
    const visuals = this.stageIntroVisual;
    visuals.root.scale.setScalar(0.72 + enter * 0.28 + Math.sin(progress * Math.PI) * 0.08);
    visuals.root.position.x = Math.sin(progress * Math.PI) * (state.stageIndex % 2 ? -0.24 : 0.24);
    visuals.token.rotation.y = time * 1.4;
    visuals.token.rotation.z = Math.sin(time * 1.8) * 0.08;
    visuals.tokenMaterial.opacity = envelope;
    visuals.tokenMaterial.emissiveIntensity = 1.8 + envelope * 3.6;
    visuals.rings.forEach((ring, index) => {
      ring.rotation.z = time * (index % 2 ? -0.72 : 0.54) + index;
      ring.scale.setScalar(0.7 + progress * (1.15 + index * 0.2));
      ring.material.opacity = envelope * (0.72 - index * 0.14);
    });
    visuals.rays.forEach((ray, index) => {
      ray.scale.y = 0.45 + progress * (1.1 + index % 3 * 0.2);
      ray.material.opacity = envelope * (0.18 + index % 2 * 0.08);
    });
    visuals.particles.rotation.z = time * 0.12;
    visuals.particles.material.opacity = envelope * 0.76;
    visuals.particles.material.size = 0.13 + envelope * 0.12;
    visuals.light.intensity = envelope * 18;
    if (progress >= 1) this.endStageIntro();
  }

  setStatusVisual(status = "normal", detail = {}) {
    const candidate = typeof status === "object" ? status.mode || status.status || status.state : status;
    const normalized = /fail|failed|failure/.test(String(candidate).toLowerCase())
      ? "failed"
      : /low|critical|danger|weak/.test(String(candidate).toLowerCase()) ? "low" : "normal";
    const state = this.statusVisualState;
    state.mode = normalized;
    state.target = normalized === "normal" ? 0 : clamp(Number(detail.intensity) || (normalized === "failed" ? 1 : 0.68), 0.15, 1);
    state.condition = clamp(Number(detail.condition ?? detail.value ?? state.condition) || 0, 0, 100);
    const color = normalized === "failed" ? 0xff514f : normalized === "low" ? 0xffa45e : 0xffffff;
    this.statusVisuals.vignetteMaterial.color.setHex(color);
    this.statusVisuals.rings.forEach((ring) => ring.material.color.setHex(color));
    this.statusVisuals.guideLight.color.setHex(color);
    this.canvas.setAttribute("data-visual-status", normalized);
    return this.snapshot();
  }

  setLowStateVisual(active = true, detail = {}) {
    return this.setStatusVisual(active ? "low" : "normal", detail);
  }

  setDanger(band = "steady", condition = 100) {
    const mode = band === "failed" ? "failed" : ["danger", "critical"].includes(band) ? "low" : "normal";
    return this.setStatusVisual(mode, { condition, status: band, intensity: band === "critical" ? 0.92 : 0.68 });
  }

  setFailureVisual(active = true, detail = {}) {
    return this.setStatusVisual(active ? "failed" : "normal", detail);
  }

  showFailure(detail = {}) {
    return this.setFailureVisual(true, detail);
  }

  clearFailure() {
    return this.clearStatusVisual();
  }

  clearStatusVisual() {
    return this.setStatusVisual("normal", { condition: 100 });
  }

  syncStatusVisual(runState, explicitStatus) {
    const condition = clamp(Number(runState.condition ?? runState.heartbeat ?? 100), 0, 100);
    const explicitMode = typeof explicitStatus === "object"
      ? explicitStatus.mode || explicitStatus.status || explicitStatus.state
      : explicitStatus;
    const mode = explicitMode || (runState.status === "failed" ? "failed" : condition <= LOW_STATE_THRESHOLD ? "low" : "normal");
    const normalized = /fail/.test(String(mode).toLowerCase()) ? "failed" : /low|critical|danger|weak/.test(String(mode).toLowerCase()) ? "low" : "normal";
    if (normalized !== this.statusVisualState.mode) this.setStatusVisual(normalized, { condition, ...(objectValue(explicitStatus)) });
    else this.statusVisualState.condition = condition;
  }

  updateStatusVisual(delta, time, arriving) {
    const state = this.statusVisualState;
    state.strength = damp(state.strength, arriving ? 0 : state.target, state.mode === "failed" ? 5.5 : 3.2, delta);
    const urgency = 1 - state.condition / 100;
    state.pulse = Math.max(0, Math.sin(time * (state.mode === "failed" ? 4.2 : 2.6))) * state.strength;
    const visible = state.strength > 0.002;
    const worldVisible = visible && this.stageIndex !== 0;
    this.statusVisuals.root.visible = worldVisible;
    this.statusVisuals.vignette.visible = worldVisible;
    this.statusVisuals.root.position.set(this.currentLaneX, 0.035, PLAYER_Z + 0.04);
    this.statusVisuals.vignetteMaterial.opacity = state.strength * (state.mode === "failed" ? 0.56 : 0.28) * (0.72 + state.pulse * 0.28);
    this.statusVisuals.rings.forEach((ring, index) => {
      const phase = (time * (0.62 + index * 0.12) + index * 0.28) % 1;
      ring.scale.setScalar(0.72 + phase * (2.1 + urgency));
      ring.rotation.z = time * (index % 2 ? -0.46 : 0.38) + index;
      ring.material.opacity = state.strength * (1 - phase) * (0.48 - index * 0.07);
    });
    this.statusVisuals.guideLight.intensity = worldVisible ? state.strength * (2.2 + state.pulse * 4.5) : 0;
  }

  preloadBackdrops() {
    this.stageVisualConfigs.forEach((config, index) => {
      this.textureLoader.load(config.asset, (texture) => {
        if (this.disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        const imageAspect = texture.image.width / texture.image.height;
        const arrivalTexture = texture.clone();
        arrivalTexture.colorSpace = THREE.SRGBColorSpace;
        arrivalTexture.minFilter = THREE.LinearFilter;
        arrivalTexture.magFilter = THREE.LinearFilter;
        arrivalTexture.matrixAutoUpdate = false;
        const arrivalAspect = 17.2 / 27;
        if (imageAspect > arrivalAspect) {
          arrivalTexture.repeat.set(arrivalAspect / imageAspect, 1);
          arrivalTexture.offset.set((1 - arrivalTexture.repeat.x) / 2, 0);
        } else {
          arrivalTexture.repeat.set(1, imageAspect / arrivalAspect);
          arrivalTexture.offset.set(0, (1 - arrivalTexture.repeat.y) / 2);
        }
        arrivalTexture.updateMatrix();
        arrivalTexture.needsUpdate = true;
        const planeAspect = 76 / 136;
        texture.matrixAutoUpdate = false;
        if (imageAspect > planeAspect) {
          texture.repeat.set(planeAspect / imageAspect, 1);
          texture.offset.set((1 - texture.repeat.x) / 2, 0);
        } else {
          texture.repeat.set(1, imageAspect / planeAspect);
          texture.offset.set(0, 1 - texture.repeat.y);
        }
        texture.repeat.y *= 0.82;
        texture.offset.y = 1 - texture.repeat.y;
        texture.updateMatrix();
        this.stageTextures[index] = texture;
        this.arrivalStageTextures[index] = arrivalTexture;
        if (this.arrivalData?.stageIndex === index) {
          this.arrivalBackdropMaterial.map = arrivalTexture;
          this.arrivalBackdropMaterial.needsUpdate = true;
        }
        if (index === this.stageIndex) this.activateBackdrop(index, this.stageIndex === 0 && this.backdropMaterials[0].map === null);
      });
    });
  }

  activateBackdrop(index, immediate = false) {
    const texture = this.stageTextures[index];
    if (!texture) return;
    if (immediate) {
      this.backdropMaterials[this.activeBackdrop].map = texture;
      this.backdropMaterials[this.activeBackdrop].opacity = BACKDROP_OPACITY;
      this.backdropMaterials[this.activeBackdrop].needsUpdate = true;
      return;
    }
    const next = 1 - this.activeBackdrop;
    this.backdropMaterials[next].map = texture;
    this.backdropMaterials[next].opacity = 0;
    this.backdropMaterials[next].needsUpdate = true;
    this.backdropBlend = 0;
  }

  ensureRoadTexture(stageIndex, phaseIndex) {
    const safeStage = clamp(Math.trunc(Number(stageIndex) || 0), 0, STAGE_CONFIGS.length - 1);
    const safePhase = clamp(Math.trunc(Number(phaseIndex) || 0), 0, 2);
    if (!this.roadTextures[safeStage][safePhase]) {
      this.roadTextures[safeStage][safePhase] = makeRoadTexture(safeStage, safePhase);
    }
    return this.roadTextures[safeStage][safePhase];
  }

  prepareRoadTextures(stageIndex) {
    const safeStage = clamp(Math.trunc(Number(stageIndex) || 0), 0, STAGE_CONFIGS.length - 1);
    [0, 1, 2].forEach((phaseIndex) => this.ensureRoadTexture(safeStage, phaseIndex));
    this.roadTextures.forEach((textures, textureStage) => textures.forEach((texture, phaseIndex) => {
      const keepCurrentStage = textureStage === safeStage;
      const keepNextPreview = textureStage === safeStage + 1 && phaseIndex === 0;
      if (texture && !keepCurrentStage && !keepNextPreview) {
        texture.dispose();
        textures[phaseIndex] = null;
      }
    }));
    const nextStage = safeStage + 1;
    if (nextStage >= STAGE_CONFIGS.length || this.roadTextures[nextStage][0]) return;
    const preload = () => {
      if (!this.disposed && this.stageIndex === safeStage) this.ensureRoadTexture(nextStage, 0);
    };
    if (typeof requestIdleCallback === "function") requestIdleCallback(preload, { timeout: 1200 });
    else setTimeout(preload, 80);
  }

  setStage(index, immediate = false, explicitStage = null) {
    const nextIndex = clamp(Math.trunc(index), 0, STAGE_CONFIGS.length - 1);
    const stageChanged = nextIndex !== this.stageIndex;
    const hasStructuredOverride = Boolean(explicitStage && (
      explicitStage.world || explicitStage.theme || explicitStage.sceneMood || explicitStage.timeWeather
      || explicitStage.colorPalette || explicitStage.landmarks || explicitStage.roadDesign || explicitStage.obstacleDesign
    ));
    const structuredContentChanged = hasStructuredOverride && explicitStage !== this.stageContentRef;
    if (!stageChanged && !immediate && !hasStructuredOverride) return;
    if (stageChanged || structuredContentChanged) this.resetEntityPoolForStage(nextIndex);
    this.stageIndex = nextIndex;
    if (stageChanged) {
      this.routePhase = 0;
      this.phaseContentRef = null;
      this.stageElapsed = 0;
    }
    const config = resolveStageVisualConfig(this.stageIndex, explicitStage);
    this.stageContentRef = contentStageAt(this.stageIndex, explicitStage);
    this.stageVisualConfigs[this.stageIndex] = config;
    this.stageConfig = config;
    this.selectStageRoadMaterials();
    if (structuredContentChanged) {
      const previousWorld = this.stageWorlds[this.stageIndex];
      const previousRoadProfiles = this.stageRoadProfiles[this.stageIndex];
      this.scene.remove(previousWorld);
      previousRoadProfiles.forEach((profile) => this.roadBaseGroup.remove(profile));
      disposeObject(previousWorld);
      previousRoadProfiles.forEach(disposeObject);
      this.stageWorlds[this.stageIndex] = createStageWorld(config, this.stageIndex);
      this.stageRoadProfiles[this.stageIndex] = [0, 1, 2].map((phaseIndex) => createStageRoadProfile(config, this.stageIndex, phaseIndex));
      this.scene.add(this.stageWorlds[this.stageIndex]);
      this.roadBaseGroup.add(...this.stageRoadProfiles[this.stageIndex]);
      this.worldParticleTextures[this.stageIndex]?.dispose();
      this.worldParticleTextures[this.stageIndex] = makeWorldParticleTexture(config.world.particles.kind, config.accent);
    }
    this.targetBackground.setHex(config.sky);
    this.targetFog.setHex(config.fog);
    this.targetFogDensity = config.fogDensity * FOG_SCALE;
    const stageShadows = Boolean(this.qualityProfile?.shadows && this.stageIndex !== 0 && !this.mobilePerformance);
    this.renderer.shadowMap.enabled = stageShadows;
    this.keyLight.castShadow = stageShadows;
    this.targetExposure = this.stageIndex === 0 ? 1.06 : config.weather === "storm" ? 0.94 : config.weather === "starlight" ? 1.24 : config.weather === "neon" ? 1.19 : 1.18;
    this.hemisphere.color.setHex(config.ambient);
    this.hemisphere.groundColor.setHex(config.ground);
    this.hemisphere.intensity = this.stageIndex === 0 ? 1.48 : 1.65;
    this.keyLight.color.setHex(config.key);
    this.keyLight.intensity = config.world.lighting.keyIntensity;
    if (Array.isArray(config.world.lighting.keyPosition)) this.keyLight.position.fromArray(config.world.lighting.keyPosition);
    this.edgeLight.color.setHex(config.accent);
    this.edgeLight.intensity = config.world.lighting.edgeIntensity;
    if (Array.isArray(config.world.lighting.edgePosition)) this.edgeLight.position.fromArray(config.world.lighting.edgePosition);
    this.warmLight.color.setHex(config.accent);
    this.warmLight.intensity = config.world.lighting.warmIntensity;
    if (Array.isArray(config.world.lighting.warmPosition)) this.warmLightBasePosition.fromArray(config.world.lighting.warmPosition);
    this.warmLight.position.copy(this.warmLightBasePosition);
    if (this.stageIndex === 0) {
      this.keyLight.color.setHex(0xfff1d2);
      this.keyLight.intensity = 3.15;
      this.edgeLight.intensity = 0.9;
      this.warmLight.intensity = 5.8;
    }
    const wetStage = ["after-rain", "rain", "storm"].includes(config.weather);
    const surfaceSettings = ROAD_SURFACE_SETTINGS[config.world.road.material] || ROAD_SURFACE_SETTINGS[wetStage ? "wet-asphalt" : "dry-asphalt"];
    const activeRoute = routeModuleAt(this.stageIndex, this.routePhase, 0);
    const routeAccent = routeAccentTone(activeRoute, config.accent);
    const shoulderTone = routeShoulderTone(activeRoute, config.curb);
    this.roadMaterial.color.copy(new THREE.Color(config.road).lerp(new THREE.Color(0xffffff), 0.78));
    this.prepareRoadTextures(this.stageIndex);
    this.roadTexture = this.ensureRoadTexture(this.stageIndex, this.routePhase);
    this.applyStageRoadSurfaceMaps();
    if (this.roadMaterial.isMeshPhysicalMaterial) {
      this.roadMaterial.roughness = clamp(Number(config.world.road.roughness) || surfaceSettings.roughness, 0.08, 1);
      this.roadMaterial.metalness = clamp(Number(config.world.road.metalness) || surfaceSettings.metalness, 0, 0.9);
      this.roadMaterial.clearcoat = clamp(Number(config.world.road.clearcoat) || surfaceSettings.clearcoat, 0, 1);
      this.roadMaterial.clearcoatRoughness = clamp(Number(config.world.road.clearcoatRoughness) || surfaceSettings.clearcoatRoughness, 0.05, 1);
    }
    this.curbMaterial.color.copy(new THREE.Color(shoulderTone).lerp(new THREE.Color(routeAccent), 0.08));
    this.platformMaterial.color.copy(new THREE.Color(shoulderTone).lerp(new THREE.Color(0xffffff), 0.12));
    this.sleeperMaterial.color.copy(new THREE.Color(config.road).lerp(new THREE.Color(0x4c3428), 0.38).multiplyScalar(0.72));
    this.railMaterial.emissive.copy(new THREE.Color(config.accent).multiplyScalar(0.055));
    this.railMaterial.emissiveIntensity = 0.42;
    this.powerRailMaterial.color.copy(new THREE.Color(config.accent).multiplyScalar(0.42));
    this.powerRailMaterial.emissive.setHex(config.accent);
    this.powerRailMaterial.emissiveIntensity = 0.16;
    this.safetyLineMaterial.color.copy(new THREE.Color(config.accent).lerp(new THREE.Color(0xf0cf58), 0.55));
    this.safetyLineMaterial.emissive.copy(new THREE.Color(config.accent).multiplyScalar(0.42));
    this.laneGuideMaterial.color.copy(new THREE.Color(config.accent).lerp(new THREE.Color(0xffffff), 0.72));
    this.laneGuideMaterial.emissive.setHex(config.accent);
    this.roadMarkMaterial.color.copy(new THREE.Color(config.curb).lerp(new THREE.Color(0xffffff), 0.55));
    this.roadMarkMaterial.emissive.copy(new THREE.Color(config.accent).multiplyScalar(0.22));
    this.routeBandMaterial.color.copy(new THREE.Color(routeAccent).lerp(new THREE.Color(config.theme.landmark), 0.28));
    this.routeBandMaterial.emissive.setHex(routeAccent);
    this.routeMotifMaterial.color.copy(new THREE.Color(routeAccent).lerp(new THREE.Color(0xffffff), 0.44));
    this.routeMotifMaterial.emissive.copy(new THREE.Color(routeAccent).multiplyScalar(0.58));
    this.roadInsetMaterial.color.copy(new THREE.Color(config.road).multiplyScalar(0.48));
    this.roadPatchMaterial.color.copy(new THREE.Color(config.road).lerp(new THREE.Color(config.ground), 0.36).multiplyScalar(0.8));
    this.roadUtilityMaterial.color.copy(new THREE.Color(config.road).lerp(new THREE.Color(config.curb), 0.42).multiplyScalar(0.62));
    this.streetFurnitureMaterial.color.copy(new THREE.Color(config.curb).lerp(new THREE.Color(config.road), 0.62).multiplyScalar(0.72));
    this.streetGlowMaterial.color.setHex(config.accent);
    this.streetGlowMaterial.emissive.setHex(config.accent);
    this.streetPlanterMaterial.color.copy(new THREE.Color(config.curb).lerp(new THREE.Color(config.ground), 0.74));
    this.streetFoliageMaterial.color.copy(new THREE.Color(0x638f67).lerp(new THREE.Color(config.accent), 0.1));
    this.groundMaterial.color.setHex(config.ground);
    this.campusRoadShadow.visible = this.stageIndex === 0;
    [this.roadMaterial, this.platformMaterial, this.safetyLineMaterial, this.laneGuideMaterial]
      .forEach((depthMaterial) => setCampusDepthFade(depthMaterial, false));
    this.platformMaterial.map = this.stageIndex === 0 ? null : this.platformTexture;
    this.platformMaterial.needsUpdate = true;
    if (this.stageIndex === 0) {
      this.roadMaterial.color.setHex(0xffffff);
      this.curbMaterial.color.setHex(0xc7d0cc);
      this.platformMaterial.color.setHex(0xe0e4e1);
      this.safetyLineMaterial.color.setHex(0xeef1ec);
      this.safetyLineMaterial.emissive.setHex(0x000000);
      this.laneGuideMaterial.color.setHex(0xf7f8f2);
      this.laneGuideMaterial.emissive.setHex(0x000000);
      this.laneGuideMaterial.opacity = 0.72;
      this.roadMarkMaterial.color.setHex(0xf4f5ef);
      this.roadMarkMaterial.emissive.setHex(0x000000);
      this.groundMaterial.color.setHex(0xd3ddd5);
    }
    const railRoute = activeRoute.rail;
    if (this.roadBatches) {
      this.roadBatches.sleepers.visible = railRoute;
      this.roadBatches.rails.visible = railRoute;
      this.roadBatches.thirdRails.visible = railRoute;
      this.roadBatches.safetyLines.visible = !railRoute;
      this.roadBatches.laneGuides.visible = !railRoute;
      this.roadBatches.laneTicks.visible = !railRoute;
      this.roadBatches.crosswalks.visible = !railRoute;
      this.roadBatches.roadPatches.visible = !railRoute;
      this.roadBatches.manholes.visible = !railRoute;
      this.roadBatches.walks.visible = this.stageIndex !== 0;
      this.roadBatches.themeBands.visible = true;
      this.roadBatches.themeMotifs.visible = true;
    }
    this.ambientParticles.material.color.setHex(config.accent);
    this.ambientParticles.material.map = this.worldParticleTextures[this.stageIndex] || this.particleTexture;
    this.ambientParticles.material.blending = ["leaf-drips", "paper-pages"].includes(config.world.particles.kind)
      ? THREE.NormalBlending
      : THREE.AdditiveBlending;
    this.ambientParticles.material.needsUpdate = true;
    this.playerTrail.material.color.setHex(config.accent);
    this.landingRing.material.color.setHex(config.accent);
    const collectibleColor = STAGE_COLLECTIBLE_COLORS[this.stageIndex] || config.accent;
    const tokenColor = STAGE_TOKEN_COLORS[this.stageIndex] || 0xffffff;
    this.collectibleBatches.rims.material.color.copy(new THREE.Color(collectibleColor).lerp(new THREE.Color(0xffffff), 0.28));
    this.collectibleBatches.rims.material.emissive.setHex(collectibleColor);
    this.collectibleBatches.hearts.geometry = createStageTokenGeometry(this.stageIndex);
    this.collectibleBatches.hearts.material.color.setHex(tokenColor);
    this.collectibleBatches.hearts.material.emissive.setHex(tokenColor);
    this.collectibleBatches.glows.material.color.setHex(collectibleColor);
    this.collectibleBatches.pickupTrail.material.color.setHex(collectibleColor);
    this.collectibleBatches.campusWisps.material.color.setHex(this.stageIndex === 0 ? 0xffd889 : collectibleColor);
    this.setPowerupAccent(config);
    this.skyDome.userData.uniforms.topColor.value.setHex(config.skyTop);
    this.skyDome.userData.uniforms.bottomColor.value.setHex(config.skyBottom);
    this.skyDome.userData.uniforms.accentColor.value.setHex(config.accent);
    this.skyDome.visible = true;
    this.canvas.setAttribute("data-campus-world", this.stageIndex === 0 ? "authored-toon-3d" : "stage-world");
    this.canvas.setAttribute("data-campus-backdrop-sampling", this.stageIndex === 0 ? "off" : "not-applicable");
    this.canvas.setAttribute("data-campus-render-style", this.stageIndex === 0 ? "ink-toon-baked" : "stage-default");
    this.canvas.setAttribute("data-campus-realtime-shadows", this.stageIndex === 0 ? "off" : "profile");
    this.canvas.setAttribute("data-campus-scene-language", this.stageIndex === 0 ? "rain-arcade-camphor-library" : "not-applicable");
    this.scene.environmentIntensity = clamp(Number(config.world.lighting.environmentIntensity) || (["neon", "rain", "storm", "starlight"].includes(config.weather) ? 0.9 : 0.72), 0.35, 1.3);
    this.runnerFillLight.color.copy(new THREE.Color(config.accent).lerp(new THREE.Color(0xffffff), 0.74));
    this.stageWorlds.forEach((world, worldIndex) => { world.visible = worldIndex === this.stageIndex; });
    this.stageRoadProfiles.forEach((profiles, profileStageIndex) => profiles.forEach((profile, profilePhaseIndex) => {
      profile.visible = profileStageIndex !== 0 && profileStageIndex === this.stageIndex && profilePhaseIndex === this.routePhase;
    }));
    this.activeStageWorld = this.stageWorlds[this.stageIndex];
    if (this.stageIndex === 0) {
      this.activeStageWorld.userData.setCampusPhase?.(this.routePhase);
      this.canvas.setAttribute("data-campus-phase-model", ["rain-arcade", "camphor-vending", "library-crossing"][this.routePhase]);
    }
    const activeDistricts = this.premiumDistricts || this.metroDistricts;
    this.metroDistricts.forEach((district, districtIndex) => {
      district.visible = this.stageIndex !== 0 && !this.premiumDistricts && districtIndex === this.stageIndex;
    });
    this.premiumDistricts?.forEach((district, districtIndex) => {
      district.visible = this.stageIndex !== 0 && districtIndex === this.stageIndex;
    });
    this.metroSkyline = activeDistricts[this.stageIndex];
    if (this.metroSkyline.userData.buildings) {
      this.metroSkyline.userData.buildings.material.color.copy(new THREE.Color(config.ground).lerp(new THREE.Color(config.skyTop), 0.2));
    }
    this.metroSkyline.userData.windowLights?.material.color.setHex(config.accent);
    this.ambientTrains.forEach((train, trainIndex) => {
      train.visible = this.stageIndex !== 0;
      train.traverse((child) => {
        if (child.isSprite && child.material?.color) child.material.color.setHex(config.accent);
      });
      train.position.x = (trainIndex ? 1 : -1) * 7.15;
    });
    this.activateBackdrop(this.stageIndex, immediate);
    this.updateRoadBatches(0);
    this.rebuildDecor();
    this.canvas.setAttribute("data-world-scene", config.world.scene);
    this.canvas.setAttribute("data-road-geometry", config.world.road.geometry);
    this.canvas.setAttribute("data-obstacle-style", config.world.obstacles.style);
    this.canvas.setAttribute("data-particle-style", config.world.particles.kind);
    this.canvas.setAttribute("data-horizon-style", config.world.horizon.kind);
    this.setDirectorAct(this.stageIndex, this.routePhase, this.phaseContentRef, true);
    this.syncQualityVisibility(false);
    if (immediate) {
      this.scene.background.copy(this.targetBackground);
      this.scene.fog.color.copy(this.targetFog);
      this.scene.fog.density = this.targetFogDensity;
      this.renderer.toneMappingExposure = this.targetExposure;
    }
  }

  setStageContent(stageContent, immediate = true) {
    this.setStage(this.stageIndex, immediate, stageContent);
    return this.snapshot();
  }

  setRoutePhase(value, phaseContent = null) {
    const nextPhase = clamp(Math.trunc(Number(value) || 0), 0, 2);
    const contentChanged = Boolean(phaseContent && phaseContent !== this.phaseContentRef);
    if (nextPhase === this.routePhase && !contentChanged) return;
    this.routePhase = nextPhase;
    this.phaseContentRef = phaseContent || this.phaseContentRef;
    if (this.stageIndex === 0) this.stageWorlds[0]?.userData.setCampusPhase?.(nextPhase);
    const config = this.stageConfig || STAGE_CONFIGS[this.stageIndex];
    this.roadTexture = this.ensureRoadTexture(this.stageIndex, nextPhase);
    this.applyStageRoadSurfaceMaps();
    const activeRoute = routeModuleAt(this.stageIndex, nextPhase, 0);
    const routeAccent = routeAccentTone(activeRoute, config.accent);
    const shoulderTone = routeShoulderTone(activeRoute, config.curb);
    this.roadMaterial.color.copy(new THREE.Color(config.road).lerp(new THREE.Color(0xffffff), 0.78));
    this.curbMaterial.color.copy(new THREE.Color(shoulderTone).lerp(new THREE.Color(routeAccent), 0.08));
    this.platformMaterial.color.copy(new THREE.Color(shoulderTone).lerp(new THREE.Color(0xffffff), 0.12));
    this.platformMaterial.map = this.stageIndex === 0 ? null : this.platformTexture;
    this.platformMaterial.needsUpdate = true;
    this.routeBandMaterial.color.copy(new THREE.Color(routeAccent).lerp(new THREE.Color(config.theme.landmark), 0.28));
    this.routeBandMaterial.emissive.setHex(routeAccent);
    this.routeMotifMaterial.color.copy(new THREE.Color(routeAccent).lerp(new THREE.Color(0xffffff), 0.44));
    this.routeMotifMaterial.emissive.copy(new THREE.Color(routeAccent).multiplyScalar(0.58));
    const visual = objectValue(this.phaseContentRef?.visual);
    const materialKey = ROAD_SURFACE_SETTINGS[visual.roadMaterialKey]
      ? visual.roadMaterialKey
      : config.visual?.roadMaterialKey;
    const surface = ROAD_SURFACE_SETTINGS[materialKey] || ROAD_SURFACE_SETTINGS["dry-asphalt"];
    const phaseWarmth = nextPhase * 0.055;
    if (this.roadMaterial.isMeshPhysicalMaterial) {
      this.roadMaterial.roughness = clamp(surface.roughness - phaseWarmth, 0.08, 1);
      this.roadMaterial.metalness = clamp(surface.metalness + nextPhase * 0.025, 0, 0.9);
      this.roadMaterial.clearcoat = clamp(surface.clearcoat + nextPhase * 0.06, 0, 1);
      this.roadMaterial.clearcoatRoughness = clamp(surface.clearcoatRoughness - nextPhase * 0.025, 0.05, 1);
    }
    this.laneGuideMaterial.opacity = 0.6 + nextPhase * 0.08;
    this.laneGuideMaterial.emissiveIntensity = 0.24 + nextPhase * 0.13;
    this.roadMarkMaterial.opacity = 0.46 + nextPhase * 0.08;
    this.routeBandMaterial.opacity = 0.42 + nextPhase * 0.05;
    if (this.stageIndex === 0) {
      this.roadMaterial.color.setHex(0xffffff);
      this.curbMaterial.color.setHex(0xc7d0cc);
      this.platformMaterial.color.setHex(0xe0e4e1);
      this.laneGuideMaterial.color.setHex(0xf7f8f2);
      this.laneGuideMaterial.emissive.setHex(0x000000);
      this.laneGuideMaterial.opacity = 0.72;
    }
    this.routeBandMaterial.emissiveIntensity = 0.28 + nextPhase * 0.13;
    this.routeMotifMaterial.opacity = 0.28 + nextPhase * 0.045;
    this.collectibleBatches.hearts.geometry = createPhaseTokenGeometry(this.stageIndex, nextPhase);
    const collectibleKey = visual.collectibleVisualKey || config.visual?.collectibleVisualKeys?.[nextPhase] || "stage-token";
    const phaseStyle = collectibleVisualStyle(collectibleKey, this.stageIndex, nextPhase);
    this.collectibleBatches.glows.material.color.setHex(phaseStyle.color);
    this.collectibleBatches.pickupTrail.material.color.setHex(phaseStyle.color);
    this.collectibleBatches.campusWisps.material.color.setHex(this.stageIndex === 0 ? 0xffd889 : phaseStyle.color);
    this.canvas.setAttribute("data-route-phase", String(nextPhase + 1));
    if (this.stageIndex === 0) this.canvas.setAttribute("data-campus-phase-model", ["rain-arcade", "camphor-vending", "library-crossing"][nextPhase]);
    this.canvas.setAttribute("data-phase-world", visual.worldKey || this.phaseContentRef?.id || `phase-${nextPhase + 1}`);
    this.canvas.setAttribute("data-collectible-style", collectibleKey);
    this.stageRoadProfiles.forEach((profiles, profileStageIndex) => profiles.forEach((profile, profilePhaseIndex) => {
      profile.visible = profileStageIndex !== 0 && profileStageIndex === this.stageIndex && profilePhaseIndex === nextPhase;
    }));
    this.updateRoadBatches(0);
    this.rebuildDecor();
    this.setDirectorAct(this.stageIndex, nextPhase, this.phaseContentRef, true);
    this.syncQualityVisibility(Boolean(this.arrivalData));
  }

  setDirectorAct(stageIndex, actIndex, phaseContent = null, immediate = false) {
    if (!this.directorState || !this.directorVisualRig) return;
    const state = this.directorState;
    const profile = actDirectionAt(stageIndex, actIndex, phaseContent);
    state.stageIndex = clamp(Math.trunc(Number(stageIndex) || 0), 0, ACT_VISUAL_DIRECTIONS.length - 1);
    state.actIndex = clamp(Math.trunc(Number(actIndex) || 0), 0, 2);
    state.act = profile;
    state.elapsed = 0;
    state.revealLife = immediate ? 0 : 1.1;
    state.revealStrength = immediate ? 0 : 1;
    const camera = profile.camera;
    state.camera.x = Number(camera[0]) || 0;
    state.camera.y = Number(camera[1]) || 5.2;
    state.camera.z = Number(camera[2]) || 10.4;
    state.camera.lookY = Number(camera[3]) || 0.7;
    state.camera.lookZ = Number(camera[4]) || -17;
    state.camera.fov = Math.max(55, Number(camera[5]) || 58);
    state.camera.maxLaneOffset = 0.35;
    state.backgroundTarget.copy(this.targetBackground).lerp(this.directorScratchColor.setHex(profile.tint), profile.tintMix);
    state.fogTarget.copy(this.targetFog).lerp(this.directorScratchColor.setHex(profile.tint), profile.tintMix * 0.46);
    state.accentTarget.setHex((this.stageConfig || STAGE_CONFIGS[state.stageIndex]).accent);
    if (state.stageIndex === 0) {
      const campusPhases = [
        { background: 0x8ba7ad, fog: 0xc7d6d0, top: 0x557f91, bottom: 0xe0ded0, key: 0xe8f2e5, edge: 0x83c7c2 },
        { background: 0x91bdba, fog: 0xd2dfc6, top: 0x5a9fb3, bottom: 0xf0dda5, key: 0xffe3a1, edge: 0x8dd4bd },
        { background: 0xb2b8a8, fog: 0xe1d7bd, top: 0x7694a1, bottom: 0xf1bd82, key: 0xffd29a, edge: 0xef8170 }
      ];
      const campusPhase = campusPhases[state.actIndex];
      state.backgroundTarget.setHex(campusPhase.background);
      state.fogTarget.setHex(campusPhase.fog);
      this.skyDome.userData.uniforms.topColor.value.setHex(campusPhase.top);
      this.skyDome.userData.uniforms.bottomColor.value.setHex(campusPhase.bottom);
      this.keyLight.color.setHex(campusPhase.key);
      this.edgeLight.color.setHex(campusPhase.edge);
    }
    configureDirectorVisualRig(this.directorVisualRig, profile, state.accentTarget.getHex());
    this.configureRelationshipPresence({ mode: profile.relation }, true);
    const config = this.stageConfig || STAGE_CONFIGS[state.stageIndex];
    const activeRoute = routeModuleAt(state.stageIndex, state.actIndex, 0);
    const neutralRoad = new THREE.Color(config.road).lerp(new THREE.Color(0xffffff), 0.78);
    this.roadMaterial.color.copy(neutralRoad.lerp(this.directorScratchColor.setHex(profile.tint), profile.tintMix * 0.1));
    if (state.stageIndex === 0) this.roadMaterial.color.setHex([0x919a95, 0x87958a, 0xa09c8d][state.actIndex]);
    this.platformMaterial.color.copy(new THREE.Color(routeShoulderTone(activeRoute, config.curb)).lerp(new THREE.Color(0xffffff), 0.12));
    this.canvas.setAttribute("data-director-act", profile.id);
    this.canvas.setAttribute("data-route-topology", profile.topology);
    this.canvas.setAttribute("data-visible-goal", profile.goal);
    this.canvas.setAttribute("data-camera-rig", profile.cameraRig);
  }

  configureRelationshipPresence(detail = {}, fromAct = false) {
    if (!this.directorState) return;
    const mode = String(detail.mode || detail.relationshipMode || detail.key || this.directorState.act?.relation || "absent");
    const defaults = relationshipMode(mode);
    const previous = this.directorState.relationship || RELATIONSHIP_MODES.absent;
    this.directorState.relationship = {
      ...defaults,
      visible: this.directorState.stageIndex > 0 && (detail.visible === true || (detail.visible !== false && defaults.visible)),
      lane: clamp(Number(detail.lane ?? defaults.lane), -1.35, 1.35),
      z: clamp(Number(detail.z ?? defaults.z), -18, -2.4),
      action: detail.action || defaults.action,
      weight: detail.weight || defaults.weight,
      duration: Math.max(0, Number(detail.durationMs || detail.duration || 0) / (detail.durationMs ? 1000 : 1)),
      source: fromAct ? "act" : "command"
    };
    if (!fromAct && previous.key === mode && detail.restart !== true) this.directorState.relationshipStrength = Math.max(this.directorState.relationshipStrength, 0.35);
    this.canvas.setAttribute("data-relationship-presence", mode);
  }

  applyDirectorCommand(command = {}) {
    if (!command || typeof command !== "object") return this.snapshot();
    const state = this.directorState;
    const id = String(command.id || "");
    const stamp = id ? directorCommandStamp(id, command.channel || "scene") : null;
    if (id && state.processedCommandIds.has(id)) return this.snapshot();
    if (stamp && stamp.ordinal <= (state.commandHighWater.get(stamp.scope) || 0)) return this.snapshot();
    if (id) {
      state.processedCommandIds.add(id);
      if (stamp) state.commandHighWater.set(stamp.scope, stamp.ordinal);
    }
    const op = String(command.op || command.type || "");
    const payload = objectValue(command.payload || command.detail);
    const duration = Math.max(0, Number(command.durationMs ?? payload.durationMs) || 0) / 1000;
    if (op === "set-stage") {
      const stageIndex = clamp(Math.trunc(Number(payload.stageIndex) || 0), 0, STAGE_CONFIGS.length - 1);
      this.setStage(stageIndex, false, payload.stageContent || null);
      if (this.routePhase !== 0 || payload.phaseDefinition) this.setRoutePhase(0, payload.phaseDefinition || null);
      else this.setDirectorAct(this.stageIndex, 0, null, false);
    } else if (op === "set-act" || op === "reenter-act") {
      const stageIndex = Number.isFinite(Number(payload.stageIndex)) ? Number(payload.stageIndex) : this.stageIndex;
      const actIndex = Number.isFinite(Number(payload.actIndex)) ? Number(payload.actIndex) : this.routePhase;
      if (stageIndex !== this.stageIndex) this.setStage(stageIndex, false, payload.stageContent || null);
      const phaseContent = payload.phaseDefinition || payload.act || payload.segment || null;
      const nextAct = clamp(Math.trunc(Number(actIndex) || 0), 0, 2);
      if (nextAct !== this.routePhase || phaseContent) this.setRoutePhase(nextAct, phaseContent);
      else this.setDirectorAct(this.stageIndex, nextAct, this.phaseContentRef, false);
    } else if (op === "reveal" || op === "item-response") {
      state.revealLife = duration || 1.05;
      state.revealStrength = 1;
      state.camera.maxLaneOffset = clamp(Number(payload.maxLaneOffset) || 0.35, 0, 0.35);
      state.camera.fov = Math.max(55, Number(payload.minFov) || state.camera.fov);
    } else if (op === "physical-consequence" || op === "pause" || op === "repair-window-closed") {
      state.consequenceOutcome = payload.outcome || (op === "physical-consequence" ? "clean" : "strained");
      state.consequenceLife = duration || 0.9;
      state.consequenceStrength = 1;
      if (state.consequenceOutcome === "strained") {
        this.shake = Math.max(this.shake, 0.22);
        this.speedPulse = Math.min(this.speedPulse, 0.18);
      } else {
        this.speedPulse = Math.max(this.speedPulse, 0.58);
      }
    } else if (op === "recover") {
      state.recoverLife = duration || 1.1;
      state.recoverStrength = 1;
      state.consequenceLife = 0;
      state.consequenceStrength = 0;
      this.speedPulse = Math.max(this.speedPulse, 0.42);
    } else if (op === "relationship-presence") {
      this.configureRelationshipPresence({ ...payload, durationMs: command.durationMs ?? payload.durationMs });
    } else if (op === "semantic-beat" || op === "semantic-gate-complete") {
      state.semanticLife = duration || (op === "semantic-gate-complete" ? 1.8 : 0.92);
      state.semanticStrength = 1;
      state.semanticOutcome = op === "semantic-gate-complete" ? "complete" : "matched";
      state.semanticStep = String(payload.semanticStep || payload.semanticKey || command.key || "");
      state.semanticMatched = Math.max(0, Number(payload.matched) || 0);
      state.semanticRequired = Math.max(state.semanticMatched, Number(payload.required) || 0);
      state.revealLife = Math.max(state.revealLife, state.semanticLife);
      state.revealStrength = Math.max(state.revealStrength, op === "semantic-gate-complete" ? 1 : 0.72);
      if (payload.relationshipMode) this.configureRelationshipPresence({ mode: payload.relationshipMode }, false);
      if (op === "semantic-gate-complete") {
        state.recoverLife = Math.max(state.recoverLife, state.semanticLife);
        state.recoverStrength = 1;
        this.speedPulse = Math.max(this.speedPulse, 0.82);
      }
    } else if (op === "semantic-hold") {
      state.semanticLife = duration || 0.76;
      state.semanticStrength = 1;
      state.semanticOutcome = "hold";
      state.semanticStep = String(payload.expected || payload.semanticKey || command.key || "");
      state.consequenceOutcome = "strained";
      state.consequenceLife = Math.max(state.consequenceLife, state.semanticLife);
      state.consequenceStrength = 1;
      this.shake = Math.max(this.shake, 0.12);
    } else if (op === "stage-gate-pending") {
      state.gatePendingLife = duration || 1.2;
      state.gatePendingStrength = 1;
      state.semanticOutcome = "pending";
      state.semanticStep = String(payload.missing?.[0] || command.key || "");
    } else if (op === "branch-shift") {
      const axis = String(payload.axis || command.key || "attention");
      state.branch.axis = BRANCH_COLORS[axis] ? axis : "attention";
      state.branch.itemId = payload.itemId || null;
      state.branch.worldEffect = payload.worldEffect || null;
      state.branch.target = 1;
      state.branch.color.setHex(BRANCH_COLORS[state.branch.axis]);
      state.revealLife = Math.max(state.revealLife, duration || 1.2);
      state.revealStrength = Math.max(state.revealStrength, 0.7);
    } else if (op === "use-item") {
      state.revealLife = duration || 1.5;
      state.revealStrength = 0.78;
    }
    return this.snapshot();
  }

  applyQualityProfile(key, force = false) {
    const requested = QUALITY_PROFILES.findIndex((profile) => profile.key === key);
    let nextIndex = requested >= 0 ? requested : this.qualityProfileIndex;
    if (this.mobilePerformance && nextIndex < QUALITY_PROFILES.length - 1) nextIndex = QUALITY_PROFILES.length - 1;
    if (!force && nextIndex === this.qualityProfileIndex) return;
    this.qualityProfileIndex = nextIndex;
    this.qualityProfile = QUALITY_PROFILES[nextIndex];
    const profile = this.qualityProfile;
    const stageShadows = profile.shadows && this.stageIndex !== 0 && !this.mobilePerformance;
    this.renderer.shadowMap.enabled = stageShadows;
    this.keyLight.castShadow = stageShadows;
    this.keyLight.shadow.mapSize.set(this.mobilePerformance ? 512 : 1024, this.mobilePerformance ? 512 : 1024);
    applyCharacterRenderQuality(this.player, profile.key === "performance", stageShadows);
    applyCharacterRenderQuality(this.companion, profile.key === "performance", stageShadows);
    this.entityObjects.forEach((object) => applyEntityQuality(object, profile.entityMeshBudget));
    this.rain.geometry.setDrawRange(0, Math.floor(420 * 2 * profile.particleScale));
    this.ambientParticles.geometry.setDrawRange(0, Math.floor(180 * profile.particleScale));
    this.canvas.setAttribute("data-render-quality", profile.key);
    this.canvas.setAttribute("data-render-target-calls", String(profile.targetDrawCalls));
    this.syncQualityVisibility(Boolean(this.arrivalData));
  }

  syncQualityVisibility(arriving = false) {
    const profile = this.qualityProfile || QUALITY_PROFILES[1];
    const premiumStageAllowed = !this.mobilePerformance && this.stageIndex !== 0 && this.stageIndex !== 4;
    const usePremium = Boolean(profile.premiumCity && premiumStageAllowed && this.premiumDistricts?.length);
    const suppressFallback = this.mobilePerformance || profile.premiumCity;
    for (let index = 0; index < this.metroDistricts.length; index += 1) {
      this.metroDistricts[index].visible = !arriving && !usePremium && !suppressFallback && index === this.stageIndex;
    }
    if (this.premiumDistricts) {
      for (let index = 0; index < this.premiumDistricts.length; index += 1) {
        this.premiumDistricts[index].visible = !arriving && usePremium && index === this.stageIndex;
      }
    }
    const districtSet = usePremium ? this.premiumDistricts : this.metroDistricts;
    this.metroSkyline = districtSet?.[this.stageIndex] || this.metroDistricts[this.stageIndex];
    const activeRoute = routeModuleAt(this.stageIndex, this.routePhase, 0);
    const railRoute = activeRoute.rail;
    const layers = this.activeStageWorld?.userData.layers || [];
    const visibleWorldLayers = this.stageIndex === 0
      ? 3
      : railRoute && profile.key === "performance" ? 1 : profile.worldLayers;
    for (let index = 0; index < layers.length; index += 1) {
      layers[index].group.visible = !arriving && index >= layers.length - visibleWorldLayers;
    }
    if (this.roadBatches) {
      const detail = profile.roadDetail;
      const campusStage = this.stageIndex === 0;
      this.roadBatches.ballast.visible = !arriving;
      this.roadBatches.walks.visible = !campusStage && !arriving;
      this.roadBatches.sleepers.visible = !arriving && railRoute && detail > 0;
      this.roadBatches.rails.visible = !arriving && railRoute;
      this.roadBatches.thirdRails.visible = !arriving && railRoute && detail > 0;
      this.roadBatches.safetyLines.visible = !campusStage && !arriving && !railRoute;
      this.roadBatches.laneGuides.visible = !arriving && !railRoute && (campusStage || ROUTE_LANE_MARK_MOTIFS.has(activeRoute.motif));
      this.roadBatches.laneTicks.visible = !campusStage && !arriving && !railRoute && detail > 0 && ROUTE_LANE_MARK_MOTIFS.has(activeRoute.motif);
      this.roadBatches.crosswalks.visible = !arriving && !railRoute && detail > 0 && ["crossing", "threshold"].includes(activeRoute.motif);
      this.roadBatches.drains.visible = !arriving && !railRoute && detail > 1 && (campusStage || ROUTE_DRAIN_MOTIFS.has(activeRoute.motif));
      this.roadBatches.roadPatches.visible = !arriving && !railRoute && detail > 0 && !campusStage && ROUTE_PATCH_MOTIFS.has(activeRoute.motif);
      this.roadBatches.manholes.visible = !arriving && !railRoute && detail > 1 && (campusStage || ROUTE_UTILITY_MOTIFS.has(activeRoute.motif));
      this.roadBatches.edgePosts.visible = !campusStage && !arriving && detail > 0;
      this.roadBatches.edgePostLights.visible = !campusStage && !arriving && detail > 0;
      this.roadBatches.planterBases.visible = !campusStage && !arriving && detail > 0 && ROUTE_PLANTED_SHOULDERS.has(activeRoute.shoulder);
      this.roadBatches.planterLeaves.visible = !campusStage && !arriving && detail > 0 && ROUTE_PLANTED_SHOULDERS.has(activeRoute.shoulder);
      this.roadBatches.themeBands.visible = !campusStage && !arriving;
      this.roadBatches.themeMotifs.visible = !campusStage && !arriving && detail > 0 && ROUTE_MOTIF_INSTANCES.has(activeRoute.motif);
    }
    this.canvas.setAttribute("data-secondary-world-layers", String(visibleWorldLayers));
    this.canvas.setAttribute("data-mobile-shadows", String(Boolean(profile.shadows)));
  }

  updateRelationshipPresence(delta, time, speed, arriving, introActive) {
    const state = this.directorState;
    const relation = state.relationship;
    const relationAvailable = !arriving && !introActive && state.stageIndex > 0 && relation.visible;
    state.relationshipStrength = damp(state.relationshipStrength, relationAvailable ? 1 : 0, relationAvailable ? 4.8 : 7, delta);
    if (!relationAvailable) {
      if (!arriving) this.companion.visible = false;
      this.directorVisualRig.relationshipParcel.visible = false;
      this.directorVisualRig.sharedObstacle.visible = false;
      return false;
    }
    this.companion.visible = true;
    const mode = relation.key;
    const shoulderSide = relation.lane === 0 ? (this.currentLaneX > 0 ? -1 : 1) : Math.sign(relation.lane);
    let targetX = shoulderSide * COMPANION_SHOULDER_X;
    let targetZ = relation.z;
    if (mode === "yield-right") targetX += Math.sin(Math.min(1, state.elapsed / 2.2) * Math.PI) * 0.86;
    if (mode === "misalign-left") targetZ -= Math.min(4.4, state.elapsed * 0.22);
    if (mode === "missed-right") targetZ -= Math.min(2.5, state.elapsed * 0.28);
    if (mode === "listen-left") targetZ += Math.sin(Math.min(1, state.elapsed / 2.4) * Math.PI) * 0.8;
    if (mode === "home-together") {
      const togetherSide = this.currentLaneX > 0.8 ? -1 : 1;
      targetX = clamp(this.currentLaneX + togetherSide * 1.48, -COMPANION_SHOULDER_X, COMPANION_SHOULDER_X);
    }
    targetX += shoulderSide * this.companionHazardProximity * 0.82;
    targetZ -= this.companionHazardProximity * 2.4;
    if (state.semanticOutcome === "hold" && state.semanticStrength > 0.05) targetZ -= state.semanticStrength * 1.35;
    if (state.semanticOutcome === "complete" && state.semanticStrength > 0.05) targetZ += state.semanticStrength * 0.72;
    this.companion.position.x = damp(this.companion.position.x, targetX, 4.8, delta);
    this.companion.position.z = damp(this.companion.position.z, targetZ, 4.2, delta);
    const facesPlayer = RELATION_FACE_PLAYER.has(mode);
    this.companion.rotation.y = damp(this.companion.rotation.y, facesPlayer ? (targetX > this.currentLaneX ? -0.42 : 0.42) : 0, 4.6, delta);
    const relationAction = facesPlayer || relation.action === "idle" || state.semanticOutcome === "hold" && state.semanticStrength > 0.05
      ? "idle"
      : relation.action || "run";
    if (this.companion.userData.modelRunner) animateRiggedRunner(this.companion, delta, relationAction, 0, relationAction === "run" ? speed / 18 : 0.08, 0, 0);
    else animateCharacter(this.companion, time, relationAction, 0, relationAction === "run" ? speed / 18 : 0.04, 1.3, 0, 0);
    const rig = this.directorVisualRig;
    const showParcel = relation.weight !== "none" || state.semanticStrength > 0.2;
    rig.relationshipParcel.visible = showParcel;
    if (showParcel) {
      const handoff = relation.weight === "handoff" || state.semanticOutcome === "complete"
        ? clamp((state.elapsed - 0.8) / 2.2 + state.semanticStrength * 0.22, 0, 1)
        : relation.weight === "companion" ? 0 : 0.5;
      rig.relationshipParcel.position.set(
        THREE.MathUtils.lerp(this.companion.position.x + 0.42, this.player.position.x + 0.48, handoff),
        0.92 + Math.sin(time * 6.4) * 0.025,
        THREE.MathUtils.lerp(this.companion.position.z + 0.08, this.player.position.z + 0.06, handoff)
      );
      rig.relationshipParcel.rotation.set(-0.08, Math.PI * handoff, Math.sin(time * 5.8) * 0.025);
    }
    rig.sharedObstacle.visible = relation.weight === "shared" && RELATION_SHARED_MODES.has(mode);
    if (rig.sharedObstacle.visible) {
      const clear = mode === "clear-obstacle" ? clamp((state.elapsed - 1.1) / 2.4 + state.recoverStrength * 0.4, 0, 1) : 1;
      rig.sharedObstacle.position.set(THREE.MathUtils.lerp(0, 4.2, clear), 0.72, -5.3);
      rig.sharedObstacle.rotation.y = clear * 0.72;
      rig.sharedObstacle.rotation.z = -0.12 + clear * 0.46;
    }
    return true;
  }

  updateDirectorVisual(delta, time, distance, arriving, relationshipVisible) {
    const state = this.directorState;
    const rig = this.directorVisualRig;
    const cadence = clamp(Number(state.act.cadence) || 4, 2.2, 7);
    const cadenceRate = Math.PI * 2 / cadence;
    const cadencePhase = (state.elapsed * cadenceRate) % (Math.PI * 2);
    const cadencePulse = 0.5 + 0.5 * Math.sin(cadencePhase);
    this.cadencePhase = cadencePhase;
    state.revealLife = Math.max(0, state.revealLife - delta);
    state.consequenceLife = Math.max(0, state.consequenceLife - delta);
    state.recoverLife = Math.max(0, state.recoverLife - delta);
    state.semanticLife = Math.max(0, state.semanticLife - delta);
    state.gatePendingLife = Math.max(0, state.gatePendingLife - delta);
    state.revealStrength = damp(state.revealStrength, state.revealLife > 0 ? 1 : 0, state.revealLife > 0 ? 6 : 2.8, delta);
    state.consequenceStrength = damp(state.consequenceStrength, state.consequenceLife > 0 ? 1 : 0, state.consequenceLife > 0 ? 8 : 3.5, delta);
    state.recoverStrength = damp(state.recoverStrength, state.recoverLife > 0 ? 1 : 0, state.recoverLife > 0 ? 7 : 3, delta);
    state.semanticStrength = damp(state.semanticStrength, state.semanticLife > 0 ? 1 : 0, state.semanticLife > 0 ? 9 : 3.2, delta);
    state.gatePendingStrength = damp(state.gatePendingStrength, state.gatePendingLife > 0 ? 1 : 0, state.gatePendingLife > 0 ? 8 : 2.8, delta);
    state.branch.strength = damp(state.branch.strength, state.branch.target, 1.8, delta);
    rig.root.visible = !arriving && this.stageIndex !== 0;
    rig.routeRoot.position.z = (distance * WORLD_Z_SCALE * (0.6 + 0.56 / cadence)) % 4.45;
    rig.goalAnchor.position.y = 1.55 + cadencePulse * 0.13;
    rig.goalCore.scale.setScalar(0.84 + cadencePulse * 0.22 + state.revealStrength * 0.42 + state.semanticStrength * 0.16);
    rig.goalHalo.rotation.z = cadencePhase * 0.32;
    rig.goalHalo.material.opacity = 0.3 + state.revealStrength * 0.38 + cadencePulse * 0.1;
    rig.materials.contourMaterial.emissiveIntensity = 0.78 + state.revealStrength * 1.2 + state.recoverStrength * 0.72
      + state.semanticStrength * 0.64 - state.gatePendingStrength * 0.18;
    rig.materials.inlayMaterial.opacity = 0.32 + state.revealStrength * 0.18;
    const effect = Math.max(state.consequenceStrength, state.recoverStrength);
    rig.materials.consequenceMaterial.color.setHex(state.consequenceOutcome === "strained" && state.recoverStrength < 0.1 ? 0xff766d : 0xffd487);
    rig.materials.consequenceMaterial.opacity = effect * 0.58;
    const dummy = rig.dummy;
    for (let index = 0; index < 10; index += 1) {
      const phase = (state.elapsed / cadence * (1.4 + index * 0.045) + index * 0.11) % 1;
      dummy.position.set(this.currentLaneX, 0.07 + index * 0.002, PLAYER_Z - phase * 7.8);
      dummy.rotation.set(Math.PI / 2, 0, index * 0.28);
      dummy.scale.setScalar(effect > 0.01 ? 0.7 + phase * (2.2 + index * 0.08) : 0.001);
      dummy.updateMatrix();
      rig.consequenceRings.setMatrixAt(index, dummy.matrix);
    }
    rig.consequenceRings.instanceMatrix.needsUpdate = true;
    const linkVisible = relationshipVisible && RELATION_LINK_MODES.has(state.relationship.key);
    rig.materials.relationshipMaterial.opacity = linkVisible ? 0.34 + cadencePulse * 0.14 : 0;
    for (let index = 0; index < 14; index += 1) {
      const ratio = (index + 1) / 15;
      dummy.position.set(
        THREE.MathUtils.lerp(this.player.position.x, this.companion.position.x, ratio),
        0.62 + Math.sin(ratio * Math.PI) * 0.48,
        THREE.MathUtils.lerp(this.player.position.z, this.companion.position.z, ratio)
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(linkVisible ? 0.68 + Math.sin(cadencePhase + index * 0.7) * 0.18 : 0.001);
      dummy.updateMatrix();
      rig.relationshipBeads.setMatrixAt(index, dummy.matrix);
    }
    rig.relationshipBeads.instanceMatrix.needsUpdate = true;
    rig.materials.branchMaterial.color.copy(state.branch.color);
    rig.materials.branchMaterial.opacity = state.branch.strength * (0.24 + cadencePulse * 0.22);
    rig.branchMarkers.rotation.y = Math.sin(cadencePhase * 0.5) * 0.06;
    rig.branchMarkers.position.z = (distance * WORLD_Z_SCALE * 0.32) % (6.2 + cadence * 0.18);
    const branchMix = state.branch.strength * 0.56;
    this.streetGlowMaterial.color.copy(state.accentTarget).lerp(state.branch.color, branchMix);
    this.streetGlowMaterial.emissive.copy(this.streetGlowMaterial.color);
    this.laneGuideMaterial.emissive.copy(state.accentTarget).lerp(state.branch.color, branchMix * 0.7);
    this.ambientParticles.material.color.copy(state.accentTarget).lerp(state.branch.color, branchMix * 0.72);
  }

  resize(width, height, devicePixelRatio = 1) {
    const cssWidth = Math.max(1, Number(width) || 720);
    const cssHeight = Math.max(1, Number(height) || 1280);
    this.mobilePerformance = cssWidth <= 800 && cssHeight >= 1000 && cssHeight > cssWidth;
    if (this.mobilePerformance && this.qualityProfileIndex < QUALITY_PROFILES.length - 1) {
      this.applyQualityProfile("performance");
    }
    const pixelBudgetRatio = Math.sqrt(MAX_RENDER_PIXELS / (cssWidth * cssHeight));
    this.cssWidth = cssWidth;
    this.cssHeight = cssHeight;
    this.maxPixelRatio = clamp(Math.min(Number(devicePixelRatio) || 1, 2, pixelBudgetRatio), 1, 2);
    const ratio = clamp(this.pixelRatio || this.maxPixelRatio, 1, this.maxPixelRatio);
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(cssWidth, cssHeight, false);
    this.camera.aspect = cssWidth / cssHeight;
    this.camera.updateProjectionMatrix();
    this.pixelRatio = ratio;
  }

  syncRoad(distance) {
    const worldDistance = Math.max(0, distance * WORLD_Z_SCALE);
    const roadCycle = Math.floor(worldDistance / SEGMENT_LENGTH);
    const offset = worldDistance % SEGMENT_LENGTH;
    const decorStride = this.qualityProfile?.decorStride ?? 2;
    const railRoute = routeModuleAt(this.stageIndex, this.routePhase, 0).rail;
    const performanceRouteStride = this.qualityProfile?.key === "performance" && this.stageIndex === 3
      ? Math.max(5, decorStride)
      : decorStride;
    const effectiveDecorStride = railRoute && this.qualityProfile?.key === "performance"
      ? Math.max(7, performanceRouteStride)
      : performanceRouteStride;
    const cadence = this.directorState?.act?.cadence || 4;
    const cadenceStride = Math.max(1, Math.round(cadence / 2.2));
    if (roadCycle !== this.roadCycle) {
      this.roadCycle = roadCycle;
      this.canvas.setAttribute("data-road-module-cycle", String(roadCycle));
    }
    this.roadBaseGroup.position.z = offset;
    for (let index = 0; index < this.roadSegments.length; index += 1) {
      const segment = this.roadSegments[index];
      let z = 7 - index * SEGMENT_LENGTH + offset;
      if (z > 14) z -= SEGMENT_COUNT * SEGMENT_LENGTH;
      segment.position.z = z;
      const decor = segment.userData.decor;
      decor.visible = effectiveDecorStride > 0
        && index % Math.max(effectiveDecorStride, cadenceStride) === 0
        && decorBoundsVisible(z, decor.userData.minZ, decor.userData.maxZ);
    }
    this.roadTexture.offset.y = -(distance * 0.011) % 1;
  }

  resetEntityPoolForStage(nextStage) {
    this.poolGeneration += 1;
    this.entityObjects.forEach((object) => {
      this.scene.remove(object);
      disposeObject(object);
    });
    this.entityObjects.clear();
    this.entityPool.forEach((bucket) => bucket.forEach((object) => disposeObject(object)));
    this.entityPool.clear();
    this.collectibleBatches.rims.count = 0;
    this.collectibleBatches.hearts.count = 0;
    this.collectibleBatches.glows.geometry.setDrawRange(0, 0);
    this.collectibleBatches.pickupTrail.geometry.setDrawRange(0, 0);
    this.storyFocus = 0;
    this.storyFocusTarget = 0;
    this.canvas.setAttribute("data-pool-stage", String(nextStage + 1));
    this.canvas.setAttribute("data-pool-generation", String(this.poolGeneration));
  }

  acquireEntity(entity, config) {
    const signature = `${this.stageIndex}:${entity.type}:${entity.itemId || entity.data?.itemId || entity.subtype || entity.avoid || entity.cue || "default"}:${Number(entity.variant) % 2}`;
    const bucket = this.entityPool.get(signature);
    let object = bucket?.pop();
    while (object && (object.userData.poolStage !== this.stageIndex || object.userData.poolGeneration !== this.poolGeneration)) {
      disposeObject(object);
      object = bucket?.pop();
    }
    if (!object) {
      if (entity.type === "collectible") object = createCollectible(this.stageIndex, config.accent, this.particleTexture);
      else if (entity.type === "story-item" || entity.type === "route-choice") {
        const storyItem = {
          id: entity.itemId || entity.data?.itemId,
          kind: entity.data?.kind,
          color: entity.data?.color
        };
        object = this.stageIndex === 0
          ? createCampusStoryToken(storyItem, config.accent, this.particleTexture)
          : createStoryProp(storyItem, config.accent, this.particleTexture, false);
      }
      else if (entity.type === "obstacle") object = createObstacle(this.stageIndex, entity.avoid, config.accent, entity.subtype, entity.variant);
      else object = createCollectible(this.stageIndex, config.accent, this.particleTexture);
      object.userData.poolKey = signature;
      object.userData.sharedTexture = entity.type === "obstacle" ? null : this.particleTexture;
      object.userData.poolStage = this.stageIndex;
      object.userData.poolGeneration = this.poolGeneration;
      if (this.stageIndex === 0 && (entity.type === "story-item" || entity.type === "route-choice")) {
        if (object.userData.markerRing) object.userData.markerRing.visible = false;
        if (object.userData.markerOrbit) object.userData.markerOrbit.visible = false;
        if (object.userData.approachRibbon) object.userData.approachRibbon.visible = false;
        object.userData.campusStoryItem = true;
      }
      capturePoolBaseline(object);
      if (entity.type === "obstacle") prepareEntityQuality(object);
    } else {
      resetPooledObject(object);
    }
    if (entity.type === "obstacle") applyEntityQuality(object, this.qualityProfile.entityMeshBudget);
    object.visible = true;
    object.userData.entityType = entity.type;
    object.userData.entitySubtype = entity.subtype || null;
    if (entity.type === "obstacle") object.userData.obstacleStyle = config.world.obstacles.style;
    this.scene.add(object);
    return object;
  }

  recycleEntity(object) {
    this.scene.remove(object);
    resetPooledObject(object);
    const key = object.userData.poolKey || "misc";
    const bucket = this.entityPool.get(key) || [];
    const belongsToCurrentPool = object.userData.poolStage === this.stageIndex
      && object.userData.poolGeneration === this.poolGeneration;
    if (belongsToCurrentPool && bucket.length < ENTITY_POOL_LIMIT) {
      bucket.push(object);
      this.entityPool.set(key, bucket);
    } else {
      disposeObject(object);
    }
  }

  syncEntities(entities, time, delta = 1 / 60) {
    const activeIds = this.activeEntityIds;
    activeIds.clear();
    const config = this.stageConfig || STAGE_CONFIGS[this.stageIndex];
    const batches = this.collectibleBatches;
    const glowPositions = batches.glows.geometry.attributes.position.array;
    const trailPositions = batches.pickupTrail.geometry.attributes.position.array;
    const campusWispPositions = batches.campusWisps.geometry.attributes.position.array;
    let collectibleCount = 0;
    let storyFocusTarget = 0;
    let companionHazard = 0;
    const relationLane = Number(this.directorState.relationship?.lane) || 0;
    const companionSide = relationLane === 0 ? (this.currentLaneX > 0 ? -1 : 1) : Math.sign(relationLane);
    const companionSafetyX = companionSide * COMPANION_SHOULDER_X;
    for (let entityIndex = 0; entityIndex < entities.length; entityIndex += 1) {
      const entity = entities[entityIndex];
      if (!entity.active) continue;
      if (entity.type === "collectible") {
        if (collectibleCount >= batches.capacity) continue;
        const baseX = (Number(entity.lane) || 0) * LANE_WIDTH;
        let x = baseX;
        let z = PLAYER_Z + (COLLISION_Z - (Number(entity.z) || 0)) * WORLD_Z_SCALE;
        let y = 1.12 + (Number(entity.height) || 0) + Math.sin(time * 4.5 + entity.id) * 0.1;
        const magnetReach = clamp((z + 13.5) / (PLAYER_Z + 13.5), 0, 1);
        const magnetBend = (this.powerupStrengths?.magnet || 0) * magnetReach * magnetReach * (3 - 2 * magnetReach);
        if (magnetBend > 0.001) {
          x = THREE.MathUtils.lerp(baseX, this.currentLaneX, magnetBend);
          y += Math.sin(magnetReach * Math.PI) * 0.86 * this.powerupStrengths.magnet + magnetBend * 0.12;
          z += magnetBend * 0.42;
        }
        const collectibleKind = entity.data?.collectibleKind || entity.data?.powerupTrail || "stage-token";
        const entityPhase = Number.isFinite(Number(entity.data?.phase)) ? Number(entity.data.phase) : this.routePhase;
        const style = collectibleVisualStyle(collectibleKind, this.stageIndex, entityPhase);
        this.collectiblePosition.set(x, y, z);
        this.collectibleEuler.set(
          0,
          Math.sin(time * 1.7 + entity.id) * 0.18,
          Math.sin(time * 1.2 + entity.id) * 0.08 + (this.currentLaneX - baseX) * magnetBend * 0.09 + style.tilt
        );
        this.collectibleQuaternion.setFromEuler(this.collectibleEuler);
        this.collectibleScale.set(0.54 * style.scaleX, 0.54 * style.scaleY, 0.54);
        this.collectibleMatrix.compose(this.collectiblePosition, this.collectibleQuaternion, this.collectibleScale);
        batches.rims.setMatrixAt(collectibleCount, this.collectibleMatrix);
        batches.hearts.setMatrixAt(collectibleCount, this.collectibleMatrix);
        this.collectibleColor.setHex(style.color);
        batches.rims.setColorAt(collectibleCount, this.collectibleColor);
        batches.hearts.setColorAt(collectibleCount, this.collectibleColor);
        glowPositions[collectibleCount * 3] = x;
        glowPositions[collectibleCount * 3 + 1] = y;
        glowPositions[collectibleCount * 3 + 2] = z - 0.05;
        for (let wispIndex = 0; wispIndex < 3; wispIndex += 1) {
          const wispOffset = (collectibleCount * 3 + wispIndex) * 3;
          const wispPhase = time * (1.15 + wispIndex * 0.17) + entity.id * 0.73 + wispIndex * Math.PI * 0.66;
          const wispRadius = 0.1 + wispIndex * 0.055;
          campusWispPositions[wispOffset] = x + Math.cos(wispPhase) * wispRadius;
          campusWispPositions[wispOffset + 1] = y + (wispIndex - 1) * 0.15 + Math.sin(wispPhase * 1.3) * 0.075;
          campusWispPositions[wispOffset + 2] = z + Math.sin(wispPhase) * 0.08 - wispIndex * 0.025;
        }
        for (let trailIndex = 0; trailIndex < 2; trailIndex += 1) {
          const offset = (collectibleCount * 2 + trailIndex) * 3;
          trailPositions[offset] = x + (trailIndex ? 0.08 : -0.08);
          trailPositions[offset + 1] = y - 0.3 - trailIndex * 0.18;
          trailPositions[offset + 2] = z + 0.04 + trailIndex * 0.08;
        }
        collectibleCount += 1;
        continue;
      }
      activeIds.add(entity.id);
      let object = this.entityObjects.get(entity.id);
      if (!object) {
        object = this.acquireEntity(entity, config);
        this.entityObjects.set(entity.id, object);
      }
      object.position.x = entity.lane * LANE_WIDTH;
      object.position.z = PLAYER_Z + (COLLISION_Z - entity.z) * WORLD_Z_SCALE;
      const storyItem = entity.type === "story-item" || entity.type === "route-choice";
      const inRenderRange = storyItem || (object.position.z >= -this.qualityProfile.entityRange && object.position.z <= 11);
      object.visible = inRenderRange;
      if (entity.type === "obstacle") {
        const sideDistance = Math.abs(object.position.x - companionSafetyX);
        const depthDistance = Math.abs(object.position.z - this.companion.position.z);
        if (sideDistance < 2.15 && depthDistance < COMPANION_HAZARD_Z) {
          companionHazard = Math.max(companionHazard, (1 - sideDistance / 2.15) * (1 - depthDistance / COMPANION_HAZARD_Z));
        }
      }
      if (!inRenderRange) continue;
      object.position.y = storyItem ? 1.06 + (Number(entity.height) || 0) + Math.sin(time * 4.2 + entity.id) * 0.09 : 0;
      if (storyItem) {
        const proximity = clamp((object.position.z + 9.5) / (PLAYER_Z + 9.5), 0, 1);
        const alignment = clamp(1 - Math.abs(object.position.x - this.currentLaneX) / (LANE_WIDTH * 0.72), 0, 1);
        const focus = proximity * (0.22 + alignment * 0.78);
        storyFocusTarget = Math.max(storyFocusTarget, focus);
        object.rotation.y = Math.sin(time * 1.25 + entity.id) * 0.24;
        object.rotation.z = Math.sin(time * 1.8 + entity.id) * 0.045;
        object.scale.setScalar(1.24 + focus * 0.22);
        if (object.userData.halo) {
          object.userData.halo.material.opacity = 0.4 + focus * 0.36 + Math.sin(time * 5 + entity.id) * 0.1;
          object.userData.halo.scale.setScalar(1 + focus * 0.34);
        }
        if (object.userData.markerRing) {
          object.userData.markerRing.rotation.z = time * 0.8 + entity.lane * 0.7;
          object.userData.markerRing.material.opacity = 0.3 + focus * 0.45 + Math.sin(time * 4.2 + entity.id) * 0.1;
          object.userData.markerRing.scale.setScalar(0.86 + focus * 0.42);
        }
        if (object.userData.markerOrbit) {
          object.userData.markerOrbit.rotation.y = time * 0.72 + entity.id * 0.24;
          object.userData.markerOrbit.scale.setScalar(0.9 + focus * 0.28);
          const orbits = object.userData.markerOrbit.children;
          for (let orbitIndex = 0; orbitIndex < orbits.length; orbitIndex += 1) {
            const orbit = orbits[orbitIndex];
            orbit.rotation.y += 0.008 * orbit.userData.spin;
            orbit.material.opacity = (0.26 + focus * 0.28) * (orbit.userData.spin > 0 ? 1 : 0.78);
          }
        }
        if (object.userData.approachRibbon) {
          const ribbons = object.userData.approachRibbon.children;
          for (let ribbonIndex = 0; ribbonIndex < ribbons.length; ribbonIndex += 1) {
            const ribbon = ribbons[ribbonIndex];
            ribbon.material.opacity = 0.08 + focus * (ribbon.userData.phase ? 0.32 : 0.46);
            ribbon.position.x = Math.sin(time * 2.7 + ribbon.userData.phase) * (0.025 + focus * 0.04);
          }
        }
        if (object.userData.approachComets) {
          const comets = object.userData.approachComets.children;
          for (let cometIndex = 0; cometIndex < comets.length; cometIndex += 1) {
            const comet = comets[cometIndex];
            const travel = (time * (0.55 + focus * 1.1) + comet.userData.offset) % 1;
            const angle = travel * Math.PI * 2 + entity.id * 0.17;
            comet.position.set(
              Math.sin(angle) * (0.38 + focus * 0.16),
              -0.7 + travel * 1.65,
              0.25 + Math.cos(angle) * 0.22
            );
            comet.material.opacity = (0.24 + focus * 0.62) * Math.sin(travel * Math.PI);
            comet.scale.setScalar(0.14 + focus * 0.14 + Math.sin(travel * Math.PI) * 0.08);
          }
        }
      }
      if (object.userData.kind === "train") object.rotation.z = Math.sin(time * 7 + entity.id) * 0.0025;
      if (object.userData.kind === "service-cart") object.rotation.y = Math.sin(time * 5.4 + entity.id) * 0.012;
      const campusEffect = object.userData.campusEffect;
      if (campusEffect?.kind === "puddle" || campusEffect?.kind === "root-puddle") {
        campusEffect.puddleMaterial.uniforms.uTime.value = time + entity.id * 0.17;
        campusEffect.glint.material.opacity = 0.25 + Math.sin(time * 2.1 + entity.id) * 0.07;
        campusEffect.glint.position.x = Math.sin(time * 0.48 + entity.id) * 0.22;
      } else if (campusEffect?.kind === "student-stream") {
        object.rotation.z = Math.sin(time * 4.2 + entity.id) * 0.012;
      } else if (campusEffect?.kind === "delivery-rail") {
        campusEffect.warning.emissiveIntensity = 0.35 + Math.max(0, Math.sin(time * 5.2 + entity.id)) * 0.42;
      } else if (campusEffect?.kind === "leaf-gust") {
        const leafDummy = campusEffect.leafDummy;
        for (let index = 0; index < campusEffect.leafBases.length; index += 1) {
          const base = campusEffect.leafBases[index];
          const phase = time * (1.9 + index % 4 * 0.08) + index * 0.63 + entity.id * 0.11;
          leafDummy.position.set(
            base.x + Math.sin(phase) * 0.13,
            base.y + Math.cos(phase * 1.27) * 0.1,
            base.z + Math.sin(phase * 0.74) * 0.09
          );
          leafDummy.rotation.set(phase * 0.28, base.phase * 0.61 + phase * 0.22, -0.72 + base.phase * 0.23 + Math.sin(phase) * 0.34);
          leafDummy.scale.setScalar(base.scale * (0.94 + Math.sin(phase * 0.82) * 0.06));
          leafDummy.updateMatrix();
          campusEffect.leaves.setMatrixAt(index, leafDummy.matrix);
        }
        campusEffect.leaves.instanceMatrix.needsUpdate = true;
        for (let index = 0; index < campusEffect.wakes.length; index += 1) {
          const wake = campusEffect.wakes[index];
          wake.position.x = (index - 1) * 0.42 + Math.sin(time * 0.82 + index) * 0.16;
          wake.material.opacity = 0.1 + index * 0.028 + Math.sin(time * 1.2 + index) * 0.025;
        }
      } else if (campusEffect?.kind === "canopy") {
        const canopySide = Number(entity.lane) === 0 ? (entity.id % 2 ? -1 : 1) : Math.sign(Number(entity.lane));
        campusEffect.canopy.scale.x = canopySide;
        campusEffect.canopy.position.x = canopySide * 1.12;
        campusEffect.canopy.rotation.z = Math.sin(time * 0.86 + entity.id) * 0.012;
        campusEffect.canopy.rotation.y = Math.sin(time * 0.62 + entity.id * 0.4) * 0.018;
        campusEffect.canopy.position.y = campusEffect.baseY + Math.sin(time * 0.72 + entity.id) * 0.018;
        campusEffect.droplets.material.opacity = 0.42 + Math.sin(time * 2.4 + entity.id) * 0.16;
      }
      const warningBeacons = object.userData.warningBeacons;
      for (let beaconIndex = 0; beaconIndex < (warningBeacons?.length || 0); beaconIndex += 1) {
        const beacon = warningBeacons[beaconIndex];
        const pulse = 2.8 + Math.max(0, Math.sin(time * 8.5 + beaconIndex * Math.PI)) * 4;
        beacon.material.emissiveIntensity = pulse;
      }
      const headlights = object.userData.headlights;
      for (let headlightIndex = 0; headlightIndex < (headlights?.length || 0); headlightIndex += 1) {
        const headlight = headlights[headlightIndex];
        if (headlight.material?.opacity !== undefined) headlight.material.opacity = 0.58 + Math.sin(time * 4 + headlightIndex) * 0.12;
      }
    }
    this.companionHazardProximity = damp(this.companionHazardProximity, companionHazard, companionHazard > this.companionHazardProximity ? 12 : 4.5, delta);
    const campusCollectibles = this.stageIndex === 0;
    batches.rims.count = campusCollectibles ? 0 : collectibleCount;
    batches.rims.instanceMatrix.needsUpdate = true;
    if (batches.rims.instanceColor) batches.rims.instanceColor.needsUpdate = true;
    batches.hearts.count = campusCollectibles ? 0 : collectibleCount;
    batches.hearts.instanceMatrix.needsUpdate = true;
    if (batches.hearts.instanceColor) batches.hearts.instanceColor.needsUpdate = true;
    batches.glows.geometry.setDrawRange(0, collectibleCount);
    batches.glows.geometry.attributes.position.needsUpdate = true;
    batches.glows.material.opacity = campusCollectibles ? 0.64 + Math.sin(time * 3.2) * 0.08 : 0.32 + Math.sin(time * 4.8) * 0.07;
    batches.glows.material.size = (campusCollectibles ? 0.24 : 0.36) + (this.powerupStrengths?.magnet || 0) * 0.08;
    batches.pickupTrail.geometry.setDrawRange(0, collectibleCount * 2);
    batches.pickupTrail.geometry.attributes.position.needsUpdate = true;
    batches.pickupTrail.material.size = (campusCollectibles ? 0.09 : 0.14) + (this.powerupStrengths?.magnet || 0) * 0.07;
    batches.campusWisps.geometry.setDrawRange(0, campusCollectibles ? collectibleCount * 3 : 0);
    batches.campusWisps.geometry.attributes.position.needsUpdate = true;
    batches.campusWisps.material.opacity = 0.72 + Math.sin(time * 2.8) * 0.12;
    batches.campusWisps.material.size = 0.24 + this.flow * 0.035;
    this.storyFocusTarget = Math.max(storyFocusTarget, this.choiceWindowState.strength * 0.86);
    for (const [id, object] of this.entityObjects) {
      if (activeIds.has(id)) continue;
      this.recycleEntity(object);
      this.entityObjects.delete(id);
    }
  }

  updateWeather(delta, time, speed, combo) {
    const config = this.stageConfig || STAGE_CONFIGS[this.stageIndex];
    const weatherProfile = config.world.weather;
    const particleProfile = config.world.particles;
    const fallbackRain = config.weather === "storm" ? 0.56 : config.weather === "rain" ? 0.38 : config.weather === "after-rain" ? 0.045 : 0;
    const targetRain = Number.isFinite(Number(weatherProfile.rain)) ? clamp(Number(weatherProfile.rain), 0, 0.8) : fallbackRain;
    const rainy = targetRain > 0.001;
    this.rain.material.opacity = damp(this.rain.material.opacity, targetRain, 3.5, delta);
    if (rainy) {
      const positions = this.rain.geometry.attributes.position.array;
      const stormStrength = weatherProfile.kind === "violent-storm" || config.weather === "storm" ? 1 : 0;
      const fall = (13 + stormStrength * 7) * delta;
      const rainWind = (Number(weatherProfile.wind) || 0.7) * delta;
      for (let index = 0; index < positions.length; index += 6) {
        positions[index + 1] -= fall;
        positions[index + 4] -= fall;
        positions[index] -= rainWind;
        positions[index + 3] -= rainWind;
        if (positions[index + 1] < 0.1) {
          const lift = 12 + ((index * 17) % 30) / 10;
          positions[index + 1] += lift;
          positions[index + 4] += lift;
        }
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }
    const ambientTarget = clamp(Number(particleProfile.opacity) || (config.weather === "starlight" ? 0.74 : 0.32), 0.04, 0.84);
    this.ambientParticles.material.opacity = damp(this.ambientParticles.material.opacity, ambientTarget, 2.8, delta);
    this.ambientParticles.material.size = clamp(Number(particleProfile.size) || 0.13, 0.06, 0.3);
    const ambientPositions = this.ambientParticles.geometry.attributes.position.array;
    const particleKind = particleProfile.kind;
    for (let offset = 0; offset < ambientPositions.length; offset += 3) {
      const seed = offset / 3;
      if (particleKind === "leaf-drips") {
        ambientPositions[offset] += Math.sin(time * 0.8 + seed) * delta * 0.22;
        ambientPositions[offset + 1] -= delta * 0.34;
      } else if (particleKind === "paper-pages") {
        ambientPositions[offset] += (0.34 + Math.sin(time + seed) * 0.18) * delta;
        ambientPositions[offset + 1] += Math.sin(time * 1.4 + seed * 0.7) * delta * 0.18;
      } else if (particleKind === "neon-dust") {
        ambientPositions[offset + 1] += Math.sin(time * 2.2 + seed) * delta * 0.16;
        ambientPositions[offset + 2] += delta * 0.24;
      } else if (particleKind === "lantern-embers") {
        ambientPositions[offset] += Math.sin(time * 1.5 + seed) * delta * 0.12;
        ambientPositions[offset + 1] += delta * 0.42;
      } else if (particleKind === "kitchen-steam") {
        ambientPositions[offset] += Math.sin(time * 0.7 + seed) * delta * 0.1;
        ambientPositions[offset + 1] += delta * 0.28;
      } else if (particleKind === "storm-spray") {
        ambientPositions[offset] -= delta * (2.1 + (seed % 5) * 0.18);
        ambientPositions[offset + 1] -= delta * 0.46;
      } else {
        ambientPositions[offset + 1] += delta * 0.06;
        ambientPositions[offset + 2] += delta * 0.1;
      }
      if (ambientPositions[offset] < -9.5) ambientPositions[offset] += 19;
      if (ambientPositions[offset] > 9.5) ambientPositions[offset] -= 19;
      if (ambientPositions[offset + 1] < 0.35) ambientPositions[offset + 1] += 7.2;
      if (ambientPositions[offset + 1] > 8.2) ambientPositions[offset + 1] -= 7.2;
      if (ambientPositions[offset + 2] > 8) ambientPositions[offset + 2] -= 72;
    }
    this.ambientParticles.geometry.attributes.position.needsUpdate = true;
    this.ambientParticles.rotation.y = particleKind === "storm-spray" ? -0.18 : time * 0.004;
    this.ambientParticles.position.y = Math.sin(time * 0.24) * (particleKind === "kitchen-steam" ? 0.42 : 0.16);
    const streakTarget = clamp(
      (speed - 11) / 15 + combo * 0.022 + this.speedPulse * 0.32 + this.flow * 0.5 + this.powerupStrengths.overdrive * 0.56,
      0,
      0.9
    );
    this.speedStreaks.material.opacity = damp(this.speedStreaks.material.opacity, streakTarget, 5, delta);
    this.speedStreaks.scale.z = 1 + this.flow * 1.4 + this.powerupStrengths.overdrive * 1.1;
    this.speedStreaks.position.z = (time * speed * 0.85) % 8;
    if (this.storyWorldInfluence > 0) {
      if (this.storyWorldState.kind === "umbrella") this.rain.material.opacity *= 1 - this.storyWorldInfluence * 0.76;
      this.ambientParticles.material.opacity = Math.min(0.82, this.ambientParticles.material.opacity + this.storyWorldInfluence * 0.2);
      if (PLANT_STORY_KINDS.has(this.storyWorldState.kind)) {
        this.ambientParticles.material.size = Math.max(this.ambientParticles.material.size, 0.2 + this.storyWorldInfluence * 0.08);
      }
    }
  }

  updateDistrictWorld(delta, time, distance, speed) {
    const config = this.stageConfig || STAGE_CONFIGS[this.stageIndex];
    if (this.stageIndex === 0) this.activeStageWorld?.userData.updateCampusWorld?.(time, distance, this.routePhase);
    const cadence = clamp(Number(this.directorState.act.cadence) || 4, 2.2, 7);
    const cadenceMotion = clamp(4.2 / cadence, 0.68, 1.7);
    this.skyDome.userData.uniforms.time.value = time;
    const windowLights = this.metroSkyline.userData.windowLights;
    if (windowLights) windowLights.material.opacity = 0.5 + Math.sin(time * 0.7) * 0.12;
    if (this.metroSkyline.userData.premium) {
      const spacing = this.metroSkyline.userData.spacing || 8;
      this.metroSkyline.position.z = (distance * WORLD_Z_SCALE * 0.46) % spacing;
      this.metroSkyline.position.x = Math.sin(distance * 0.008) * 0.14;
    } else {
      this.metroSkyline.position.z = (distance * 0.055) % 6;
    }
    for (let index = 0; index < this.ambientTrains.length; index += 1) {
      const train = this.ambientTrains[index];
      const direction = index ? 1 : -1;
      train.position.z += delta * speed * cadenceMotion * (index ? 0.72 : 1.02);
      train.position.y = 0.04 + Math.sin(this.cadencePhase + index * Math.PI) * 0.012;
      if (train.position.z > 15) train.position.z = -92 - index * 24;
      train.rotation.y = direction > 0 ? 0 : Math.PI;
      train.visible = !this.mobilePerformance && (config.routeStyle === "metro" || config.routeStyle === "terminal")
        && (this.qualityProfileIndex < 2 || index === 0);
    }
    const nightFactor = DARK_WEATHER_KINDS.has(config.weather) ? 1 : 0.72;
    if (windowLights) windowLights.material.size = 0.24 + nightFactor * 0.1;
    this.camera.updateMatrixWorld(true);
    this.camera.matrixWorldInverse.copy(this.camera.matrixWorld).invert();
    this.projectionViewMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.viewFrustum.setFromProjectionMatrix(this.projectionViewMatrix);
    const scenery = this.activeStageWorld?.userData.scenery || [];
    for (let index = 0; index < scenery.length; index += 1) {
      const entry = scenery[index];
      if (!entry.object.parent?.visible) {
        entry.object.visible = false;
        continue;
      }
      const travel = (distance * WORLD_Z_SCALE * entry.parallax) % entry.span;
      let z = entry.baseZ + travel;
      const nearLimit = entry.nearLimit ?? (entry.side === 0 ? TRACK_CLEARANCE.decorNearZ - entry.nearOffset : TRACK_CLEARANCE.cameraZ);
      while (z > nearLimit) z -= entry.span;
      entry.object.position.z = z;
      entry.object.position.x = entry.baseX + Math.sin(this.cadencePhase * 0.35 + index) * entry.drift;
      const streetscapeArt = entry.object.userData.streetscapeArt;
      if (streetscapeArt?.card?.material) {
        const approach = clamp((z + 28) / 18, 0, 1);
        const departure = 1 - clamp((z - 2) / 5.5, 0, 1);
        streetscapeArt.card.material.opacity = streetscapeArt.card.material.map ? approach * departure : 0;
      }
      entry.sphere.center.copy(entry.centerOffset).add(entry.object.position);
      const campusPhaseMask = entry.object.userData.campusPhaseMask;
      const campusPhaseVisible = !Array.isArray(campusPhaseMask) || campusPhaseMask.includes(this.routePhase);
      const stageTwoSightlineClear = this.stageIndex !== 1 || (entry.side !== 0 && Math.abs(entry.baseX) >= 6.2);
      const sideClear = stageTwoSightlineClear && (entry.side === 0 || Math.abs(entry.object.userData.trackClearance?.innerEdge || entry.baseX) >= TRACK_CLEARANCE.halfWidth);
      const depthClear = !entry.depthCull || entry.side !== 0 || decorBoundsVisible(z, entry.farOffset, entry.nearOffset);
      entry.object.visible = campusPhaseVisible && sideClear && depthClear && this.viewFrustum.intersectsSphere(entry.sphere);
    }
  }

  updateBackdrops(delta) {
    if (this.backdropBlend >= 1) return;
    this.backdropBlend = clamp(this.backdropBlend + delta / 1.25, 0, 1);
    const next = 1 - this.activeBackdrop;
    const smooth = this.backdropBlend * this.backdropBlend * (3 - 2 * this.backdropBlend);
    this.backdropMaterials[this.activeBackdrop].opacity = BACKDROP_OPACITY * (1 - smooth);
    this.backdropMaterials[next].opacity = BACKDROP_OPACITY * smooth;
    if (this.backdropBlend >= 1) this.activeBackdrop = next;
  }

  updateBursts(delta) {
    let burstWrite = 0;
    for (let burstIndex = 0; burstIndex < this.bursts.length; burstIndex += 1) {
      const burst = this.bursts[burstIndex];
      burst.life -= delta;
      const positions = burst.points.geometry.attributes.position.array;
      for (let index = 0; index < burst.count; index += 1) {
        positions[index * 3] += burst.velocities[index * 3] * delta;
        positions[index * 3 + 1] += burst.velocities[index * 3 + 1] * delta;
        positions[index * 3 + 2] += burst.velocities[index * 3 + 2] * delta;
        burst.velocities[index * 3 + 1] -= 1.2 * delta;
      }
      burst.points.geometry.attributes.position.needsUpdate = true;
      burst.points.material.opacity = clamp(burst.life / burst.duration, 0, 1);
      burst.points.material.size = 0.12 + (1 - burst.life / burst.duration) * 0.08;
      if (burst.life > 0) {
        this.bursts[burstWrite] = burst;
        burstWrite += 1;
      } else {
        burst.points.visible = false;
        burst.points.geometry.setDrawRange(0, 0);
      }
    }
    this.bursts.length = burstWrite;
    let ringWrite = 0;
    for (let ringIndex = 0; ringIndex < this.rings.length; ringIndex += 1) {
      const ring = this.rings[ringIndex];
      ring.life -= delta;
      const progress = 1 - clamp(ring.life / ring.duration, 0, 1);
      ring.mesh.scale.setScalar(ring.baseScale * (0.65 + progress * 2.15));
      ring.mesh.material.opacity = (1 - progress) * 0.82;
      ring.mesh.rotation.z += delta * ring.spin;
      if (ring.life > 0) {
        this.rings[ringWrite] = ring;
        ringWrite += 1;
      } else {
        ring.mesh.visible = false;
      }
    }
    this.rings.length = ringWrite;
  }

  spawnPickupSequence(detail) {
    if (!detail?.item) return;
    const color = storyPropColor(detail.item, (this.stageConfig || STAGE_CONFIGS[this.stageIndex]).accent);
    const prop = createStoryProp(detail.item, color, null, true);
    const aura = createPickupAura(detail.item.kind, color, this.particleTexture);
    aura.userData.sharedTexture = this.particleTexture;
    const laneX = (Number(detail.lane) || 0) * LANE_WIDTH;
    const start = new THREE.Vector3(laneX, 1.18, PLAYER_Z - 1.15);
    const side = laneX >= this.currentLaneX ? 1 : -1;
    const control = new THREE.Vector3((laneX + this.currentLaneX) * 0.5 + side * 0.72, 2.62, PLAYER_Z - 0.42);
    const end = new THREE.Vector3(this.currentLaneX + 0.6, 1.04, PLAYER_Z + 0.12);
    const bridge = createPickupBridge(start, control, end, color, this.particleTexture);
    prop.position.copy(start);
    prop.scale.setScalar(0.92);
    aura.position.copy(start);
    this.scene.add(bridge, aura, prop);
    this.pickupSequences.push({
      prop,
      aura,
      bridge,
      item: detail.item,
      start,
      control,
      end,
      elapsed: 0,
      duration: ["camera", "photo", "umbrella", "record", "key"].includes(detail.item.kind) ? 1.34 : 1.12,
      color
    });
    this.itemPulse = { kind: detail.item.kind, color, life: 2.15, duration: 2.15 };
    this.speedPulse = Math.max(this.speedPulse, 1.28);
    this.shake = Math.max(this.shake, 0.12);
    if (["camera", "photo"].includes(detail.item.kind)) {
      this.flash = Math.max(this.flash, 0.68);
      this.flashMaterial.color.setHex(0xfff7df);
    }
  }

  updatePickupSequences(delta, time) {
    let writeIndex = 0;
    for (let sequenceIndex = 0; sequenceIndex < this.pickupSequences.length; sequenceIndex += 1) {
      const sequence = this.pickupSequences[sequenceIndex];
      sequence.elapsed += delta;
      const ratio = clamp(sequence.elapsed / sequence.duration, 0, 1);
      const travel = clamp(ratio / 0.78, 0, 1);
      const eased = 1 - Math.pow(1 - travel, 3);
      quadraticPoint(sequence.prop.position, sequence.start, sequence.control, sequence.end, eased);
      sequence.prop.rotation.y += delta * (4.2 + ratio * 4.8);
      sequence.prop.rotation.z = Math.sin(ratio * Math.PI * 2.6) * 0.24;
      const propScale = ratio < 0.7 ? 0.92 + Math.sin(ratio / 0.7 * Math.PI) * 0.34 : 0.92 * (1 - (ratio - 0.7) / 0.3);
      sequence.prop.scale.setScalar(Math.max(0.001, propScale));

      const auraProgress = clamp(ratio / 0.84, 0, 1);
      sequence.aura.position.lerpVectors(sequence.start, sequence.end, auraProgress * 0.34);
      sequence.aura.rotation.y += delta * 1.45;
      sequence.aura.rotation.z = Math.sin(time * 2.8) * 0.1;
      sequence.aura.scale.setScalar(0.56 + Math.sin(auraProgress * Math.PI) * 0.46 + auraProgress * 0.1);
      sequence.aura.children.forEach((child, index) => {
        if (child.userData.spin) child.rotation.y += delta * child.userData.spin;
        if (child.userData.pulseOffset !== undefined) {
          const pulse = clamp((ratio - child.userData.pulseOffset) * 2.4, 0, 1);
          child.scale.setScalar(0.55 + pulse * 1.7);
        }
      });
      sequence.aura.userData.motif?.children?.forEach((child, index) => {
        child.rotation.z += delta * (child.userData.spin || (index % 2 ? -0.7 : 0.7));
      });
      const fade = ratio < 0.72 ? 1 : 1 - (ratio - 0.72) / 0.28;
      sequence.aura.userData.fadeMaterials.forEach((entry) => {
        entry.opacity = (entry.userData.maxOpacity ?? 0.72) * clamp(fade, 0, 1);
      });
      const bridgeFade = ratio < 0.62
        ? Math.sin(clamp(ratio / 0.62, 0, 1) * Math.PI * 0.5)
        : 1 - (ratio - 0.62) / 0.38;
      sequence.bridge.userData.materials.forEach((entry) => {
        entry.opacity = (entry.userData.maxOpacity ?? 0.6) * clamp(bridgeFade, 0, 1);
      });
      sequence.bridge.userData.glints.forEach((glint) => {
        const glintProgress = clamp(ratio * 1.55 - glint.userData.offset * 0.7, 0, 1);
        quadraticPoint(glint.position, sequence.start, sequence.control, sequence.end, glintProgress);
        const glintFade = Math.sin(glintProgress * Math.PI) * clamp(1 - Math.max(0, ratio - 0.72) / 0.28, 0, 1);
        glint.material.opacity = glintFade * 0.82;
        glint.scale.setScalar(0.14 + glintFade * 0.22);
      });
      const impactProgress = clamp((ratio - 0.58) / 0.28, 0, 1);
      sequence.bridge.userData.impact.scale.setScalar(0.55 + impactProgress * 3.1);
      sequence.bridge.userData.impact.material.opacity = Math.sin(impactProgress * Math.PI) * 0.88;
      if (ratio >= 0.76) {
        const carried = this.carriedItems.find((entry) => entry.item.id === sequence.item.id);
        if (carried?.pending) {
          carried.pending = false;
          carried.prop.visible = true;
        }
      }
      if (ratio < 1) {
        this.pickupSequences[writeIndex] = sequence;
        writeIndex += 1;
      } else {
        this.scene.remove(sequence.prop, sequence.aura, sequence.bridge);
        disposeObject(sequence.prop);
        disposeObject(sequence.aura);
        disposeObject(sequence.bridge);
      }
    }
    this.pickupSequences.length = writeIndex;
  }

  carry(item) {
    if (!item?.id || this.carriedItems.some((entry) => entry.item.id === item.id)) return;
    const prop = createStoryProp(item, (this.stageConfig || STAGE_CONFIGS[this.stageIndex]).accent, null, true);
    prop.userData.carried = true;
    const pending = this.pickupSequences.some((sequence) => sequence.item.id === item.id);
    prop.visible = !pending;
    this.carryGroup.add(prop);
    this.carriedItems.push({ item: { ...item }, prop, pending });
    while (this.carriedItems.length > 3) {
      const removed = this.carriedItems.shift();
      this.carryGroup.remove(removed.prop);
      disposeObject(removed.prop);
    }
    this.carriedItems.forEach((entry, index, list) => {
      const offset = index - (list.length - 1) / 2;
      entry.prop.position.set(offset * 0.16, 0.13 + (index % 2) * 0.045, 0.02 - index * 0.018);
      entry.prop.rotation.set(-0.12, offset * 0.16, offset * -0.08);
      entry.prop.scale.setScalar(entry.item.kind === "umbrella" ? 0.2 : entry.item.kind === "flower" ? 0.27 : 0.24);
    });
  }

  clearCarry() {
    this.carriedItems.forEach((entry) => {
      this.carryGroup.remove(entry.prop);
      disposeObject(entry.prop);
    });
    this.carriedItems.length = 0;
  }

  beginArrival(data) {
    this.endArrival();
    this.arrivalData = { ...data };
    this.arrivalProgress = 0;
    const arrivalConfig = this.stageVisualConfigs[data.stageIndex] || resolveStageVisualConfig(data.stageIndex);
    this.arrivalSet = createRendezvousSet(data.stageIndex, arrivalConfig.accent, data.items);
    this.scene.add(this.arrivalSet);
    this.arrivalBackdropMaterial.map = this.arrivalStageTextures[data.stageIndex] || this.stageTextures[data.stageIndex] || null;
    this.arrivalBackdropMaterial.opacity = 0;
    this.arrivalBackdropMaterial.needsUpdate = true;
    this.arrivalBackdrop.visible = true;
    this.companion.visible = true;
    this.flash = Math.max(this.flash, 0.16);
    this.flashMaterial.color.setHex(arrivalConfig.accent);
  }

  endArrival() {
    if (this.arrivalSet) {
      this.scene.remove(this.arrivalSet);
      disposeObject(this.arrivalSet);
    }
    this.arrivalSet = null;
    this.arrivalData = null;
    this.arrivalProgress = 0;
    this.arrivalBackdrop.visible = false;
    this.arrivalBackdropMaterial.opacity = 0;
    this.companion.visible = false;
    this.companion.position.set(-2.7, 0, -19);
    this.companion.rotation.set(0, 0, 0);
  }

  effect(type, detail = {}) {
    if (!detail || typeof detail !== "object") detail = {};
    if (type === "stage-intro") {
      this.beginStageIntro(detail);
      return;
    }
    if (type === "failure" || type === "failed") {
      this.setFailureVisual(detail.active !== false, detail);
      return;
    }
    if (type === "low-state" || type === "critical-state") {
      this.setLowStateVisual(detail.active !== false, detail);
      return;
    }
    if (type === "status-visual") {
      this.setStatusVisual(detail.mode || detail.status || "normal", detail);
      return;
    }
    if (type === "choice-window") {
      const duration = powerupDuration(detail.duration ?? detail.windowMs, 1.15);
      this.choiceWindowState.life = duration;
      this.choiceWindowState.duration = duration;
      this.choiceWindowState.lane = clamp(Number(detail.lane) || 0, -1, 1);
      this.choiceWindowState.strength = 1;
      this.directorState.revealLife = Math.max(this.directorState.revealLife, duration);
      this.directorState.revealStrength = Math.max(this.directorState.revealStrength, 0.72);
      this.speedPulse = Math.max(this.speedPulse, 0.28);
    }
    if (type === "arrival-interaction") {
      const duration = detail.completed ? 1.4 : 0.78;
      this.arrivalInteractionState.life = duration;
      this.arrivalInteractionState.duration = duration;
      this.arrivalInteractionState.strength = 1;
      this.arrivalInteractionState.outcome = detail.outcome || "clean";
      this.arrivalInteractionState.completed = Boolean(detail.completed);
      if (detail.outcome === "strained") {
        this.shake = Math.max(this.shake, 0.14);
        this.flash = Math.max(this.flash, 0.12);
        this.flashMaterial.color.setHex(0xff756e);
      } else {
        this.speedPulse = Math.max(this.speedPulse, detail.completed ? 0.9 : 0.36);
        this.flash = Math.max(this.flash, detail.completed ? 0.42 : 0.18);
        this.flashMaterial.color.setHex(detail.completed ? 0xfff2c4 : (this.stageConfig || STAGE_CONFIGS[this.stageIndex]).accent);
      }
      return;
    }
    if (type === "powerup-start") {
      this.startPowerup(detail);
      return;
    }
    if (type === "powerup-end") {
      this.endPowerup(detail);
      return;
    }
    if (type === "shield-block") {
      this.triggerShieldBlock(detail);
      return;
    }
    if (type === "story-world") {
      this.triggerStoryWorld(detail);
      return;
    }
    if (type === "story-synergy") {
      this.triggerStorySynergy(detail);
      return;
    }
    if (type === "miss") {
      this.shake = Math.max(this.shake, 0.82);
      this.flash = Math.max(this.flash, 0.34);
      this.flashMaterial.color.setHex(0xff5d58);
    }
    if (type === "stage") {
      this.flash = Math.max(this.flash, 0.5);
      this.flashMaterial.color.setHex((this.stageConfig || STAGE_CONFIGS[this.stageIndex]).accent);
      return;
    }
    if (type === "story-missed") {
      this.speedPulse = Math.max(this.speedPulse, 0.16);
      return;
    }
    if (type === "story-pickup") this.spawnPickupSequence(detail);
    if (type === "energy") this.speedPulse = Math.max(this.speedPulse, 0.36);
    if (this.powerupStrengths.multiplier > 0.05 && ["perfect", "energy", "story-pickup", "dodge"].includes(type)) {
      this.scorePulse = 1;
    }
    if (type === "near-miss") {
      this.shake = Math.max(this.shake, 0.26);
      this.speedPulse = Math.max(this.speedPulse, 1);
    } else if (type === "dodge") {
      this.speedPulse = Math.max(this.speedPulse, 0.62);
    }
    const activeAccent = (this.stageConfig || STAGE_CONFIGS[this.stageIndex]).accent;
    const storyColor = detail.item ? storyPropColor(detail.item, activeAccent) : activeAccent;
    const count = type === "story-pickup" ? 54 : type === "perfect" ? 38 : type === "near-miss" ? 32 : type === "miss" ? 34 : type === "energy" ? 16 : 20;
    const burst = this.transientEffects.bursts[this.burstPoolCursor % this.transientEffects.bursts.length];
    this.burstPoolCursor += 1;
    const activeBurstIndex = this.bursts.indexOf(burst);
    if (activeBurstIndex >= 0) this.bursts.splice(activeBurstIndex, 1);
    const positions = burst.positions;
    const velocities = burst.velocities;
    for (let index = 0; index < count; index += 1) {
      const angle = index / count * Math.PI * 2;
      const spread = (type === "story-pickup" ? 0.56 : type === "miss" ? 0.72 : 0.35) + (index % 5) * 0.08;
      const spiral = type === "story-pickup" ? index / count * 0.52 : 0;
      positions[index * 3] = Math.cos(angle) * spiral;
      positions[index * 3 + 1] = spiral * 0.6;
      positions[index * 3 + 2] = Math.sin(angle) * spiral;
      velocities[index * 3] = Math.cos(angle + (type === "story-pickup" ? 0.72 : 0)) * spread;
      velocities[index * 3 + 1] = 0.55 + (index % 7) * 0.09;
      velocities[index * 3 + 2] = Math.sin(angle + (type === "story-pickup" ? 0.72 : 0)) * spread;
    }
    const effectX = (detail.lane || 0) * LANE_WIDTH;
    const effectZ = PLAYER_Z + (COLLISION_Z - (detail.z || COLLISION_Z)) * WORLD_Z_SCALE;
    burst.count = count;
    burst.life = 0.85;
    burst.duration = 0.85;
    burst.points.position.set(effectX, type === "dodge" ? 0.75 : 1.25, effectZ);
    burst.points.material.color.setHex(type === "story-pickup" ? storyColor : activeAccent);
    burst.points.material.opacity = 1;
    burst.points.geometry.setDrawRange(0, count);
    burst.points.geometry.attributes.position.needsUpdate = true;
    burst.points.visible = true;
    this.bursts.push(burst);
    if (this.stageIndex !== 0 && ["dodge", "near-miss", "perfect", "story-pickup", "energy"].includes(type)) {
      const ringSlot = this.transientEffects.rings[this.ringPoolCursor % this.transientEffects.rings.length];
      this.ringPoolCursor += 1;
      const activeRingIndex = this.rings.indexOf(ringSlot);
      if (activeRingIndex >= 0) this.rings.splice(activeRingIndex, 1);
      ringSlot.life = 0.48;
      ringSlot.duration = 0.48;
      ringSlot.spin = type === "near-miss" ? 4 : 1.6;
      ringSlot.baseScale = 1;
      ringSlot.mesh.position.set(effectX, type === "dodge" ? 0.72 : 1.2, effectZ);
      ringSlot.mesh.rotation.set(Math.PI / 2, 0, 0);
      ringSlot.mesh.scale.setScalar(1);
      ringSlot.mesh.material.color.setHex(type === "near-miss" ? 0xffd169 : type === "story-pickup" ? storyColor : type === "energy" ? 0xf9ef9a : activeAccent);
      ringSlot.mesh.material.opacity = 0.82;
      ringSlot.mesh.visible = true;
      this.rings.push(ringSlot);
      if (type === "story-pickup") {
        const orbitSlot = this.transientEffects.rings[this.ringPoolCursor % this.transientEffects.rings.length];
        this.ringPoolCursor += 1;
        const activeOrbitIndex = this.rings.indexOf(orbitSlot);
        if (activeOrbitIndex >= 0) this.rings.splice(activeOrbitIndex, 1);
        orbitSlot.life = 0.66;
        orbitSlot.duration = 0.66;
        orbitSlot.spin = -2.4;
        orbitSlot.baseScale = 1.55;
        orbitSlot.mesh.position.copy(ringSlot.mesh.position);
        orbitSlot.mesh.rotation.set(Math.PI / 2 + 0.4, 0.55, 0.2);
        orbitSlot.mesh.scale.setScalar(orbitSlot.baseScale);
        orbitSlot.mesh.material.color.setHex(storyColor);
        orbitSlot.mesh.material.opacity = 0.82;
        orbitSlot.mesh.visible = true;
        this.rings.push(orbitSlot);
        this.speedPulse = Math.max(this.speedPulse, 0.42);
      }
    }
  }

  render(frame = {}) {
    const time = Number(frame.time) || 0;
    const delta = clamp(this.lastTime ? time - this.lastTime : 1 / 60, 1 / 240, 0.05);
    this.lastTime = time;
    this.frameAverage = damp(this.frameAverage, delta, 1.5, delta);
    this.flow = damp(this.flow, clamp(Number(frame.flow) || 0, 0, 1), 4.8, delta);
    this.storyFocus = damp(this.storyFocus, this.storyFocusTarget, 9, delta);
    this.choiceWindowState.life = Math.max(0, this.choiceWindowState.life - delta);
    this.choiceWindowState.strength = damp(this.choiceWindowState.strength, this.choiceWindowState.life > 0 ? 1 : 0, this.choiceWindowState.life > 0 ? 10 : 4, delta);
    this.arrivalInteractionState.life = Math.max(0, this.arrivalInteractionState.life - delta);
    this.arrivalInteractionState.strength = damp(this.arrivalInteractionState.strength, this.arrivalInteractionState.life > 0 ? 1 : 0, this.arrivalInteractionState.life > 0 ? 10 : 4, delta);
    this.qualityElapsed += delta;
    this.stageElapsed += delta;
    const requestedStage = Number.isFinite(Number(frame.stageIndex)) ? clamp(Math.trunc(Number(frame.stageIndex)), 0, STAGE_CONFIGS.length - 1) : this.stageIndex;
    const frameStageContent = frame.stageContent || (frame.stage?.world || frame.stage?.theme ? frame.stage : null);
    const stageChanged = requestedStage !== this.stageIndex;
    if (stageChanged) this.setStage(requestedStage, false, frameStageContent);
    else if (frameStageContent && frameStageContent !== this.stageContentRef) this.setStage(requestedStage, true, frameStageContent);
    const enteringIntro = ["intro", "stage-intro"].includes(frame.mode) && frame.mode !== this.lastRenderMode;
    if ((stageChanged && frame.mode !== "arrival") || enteringIntro) {
      this.beginStageIntro({
        stageIndex: requestedStage,
        duration: Number(frame.stageIntro?.duration) || Number(frame.stageIntro?.openingPerformance?.durationMs) / 1000 || 2.4,
        intensity: frame.stageIntro?.intensity || 1
      });
    }
    this.lastRenderMode = frame.mode || "";
    const framePhaseContent = frame.phaseDefinition || null;
    if (Number.isFinite(Number(frame.routePhase)) && (
      Number(frame.routePhase) !== this.routePhase || framePhaseContent !== this.phaseContentRef
    )) this.setRoutePhase(frame.routePhase, framePhaseContent);
    if (frame.arrival && !this.arrivalData) this.beginArrival(frame.arrival);
    if (!frame.arrival && this.arrivalData && frame.mode !== "arrival") this.endArrival();
    const motion = frame.motion || {};
    const runState = frame.runState || {};
    this.syncStatusVisual(runState, frame.visualStatus || frame.statusVisual);
    const speed = Number(motion.speed) || 10.5;
    const distance = Number(motion.distance) || 0;
    this.syncPowerupState(motion.powerups, delta);
    const introDistance = frame.mode === "intro" ? time * 5.2 : 0;
    this.currentDistance = distance + introDistance;
    this.syncRoad(this.currentDistance);
    this.syncEntities(motion.entities || [], time, delta);

    const arriving = frame.mode === "arrival" && Boolean(frame.arrival);
    const introActive = frame.mode === "stage-intro" && this.stageIntroState.active;
    const campusThirdPerson = this.stageIndex === 0 && !arriving;
    const introCue = introCameraCue(this.stageIntroState.cameraCue);
    const arrivalProgress = arriving ? clamp(Number(frame.arrival.progress) || 0, 0, 1) : 0;
    this.arrivalProgress = arrivalProgress;
    const arrivalEase = arrivalProgress * arrivalProgress * (3 - arrivalProgress * 2);
    this.roadGroup.visible = !arriving;
    this.ground.visible = !arriving && this.stageIndex !== 0;
    if (this.activeStageWorld) this.activeStageWorld.visible = !arriving;
    this.syncQualityVisibility(arriving);
    if (arriving) this.stageIntroVisual.root.visible = false;
    this.backdrops.forEach((backdrop) => { backdrop.visible = !arriving; });
    this.arrivalBackdrop.visible = arriving;
    this.arrivalBackdropMaterial.opacity = arriving ? Math.min(0.86, arrivalProgress * 2.4) : 0;
    this.arrivalBackdrop.scale.setScalar(arriving ? 1.035 - arrivalEase * 0.055 : 1);
    this.arrivalBackdrop.position.x = arriving ? Math.sin(arrivalProgress * Math.PI) * (this.stageIndex % 2 ? -0.24 : 0.24) : 0;
    const lanePosition = Number.isFinite(Number(motion.lanePosition)) ? Number(motion.lanePosition) : Number(motion.lane) || 0;
    const targetPlayerX = arriving ? -0.66 : introActive && introCue.action === "idle" ? 0 : lanePosition * LANE_WIDTH;
    this.previousLaneX = this.currentLaneX;
    this.currentLaneX = damp(this.currentLaneX, targetPlayerX, arriving ? 4.8 : 28, delta);
    this.lateralVelocity = damp(this.lateralVelocity, (this.currentLaneX - this.previousLaneX) / Math.max(delta, 1 / 120) / LANE_WIDTH, 18, delta);
    this.player.position.x = this.currentLaneX;
    this.player.position.z = arriving ? damp(this.player.position.z, -0.12, 2.8, delta) : PLAYER_Z;
    this.player.visible = true;
    this.playerTrail.visible = !arriving;
    this.landingRing.visible = !arriving;
    this.canvas.setAttribute("data-camera-language", campusThirdPerson ? "campus-character-follow" : "character-follow");
    this.updateStageIntroVisual(delta, time);
    this.updateStatusVisual(delta, time, arriving);
    const stumble = clamp((Number(motion.stumbleTime) || 0) / 0.62, 0, 1);
    const vertical = Number(motion.vertical) || 0;
    if (this.previousVertical > 0.16 && vertical <= 0.025 && motion.action !== "jump") {
      this.landingPulse = 1;
      this.shake = Math.max(this.shake, 0.12);
    }
    this.previousVertical = vertical;
    const playerAction = arriving && arrivalProgress > 0.26
      ? "idle"
      : introActive ? this.stageIntroState.actionCue || introCue.action : motion.action || "run";
    if (this.player.userData.modelRunner) {
      animateRiggedRunner(this.player, delta, playerAction, arriving ? 0 : vertical, arriving ? 0.12 : speed / 17, arriving ? 0 : this.lateralVelocity, arriving ? 0 : stumble);
    } else {
      animateCharacter(this.player, time, playerAction, arriving ? 0 : vertical, arriving ? 0.05 : speed / 17, 0, arriving ? 0 : this.lateralVelocity, arriving ? 0 : stumble);
    }
    updateRunnerFootTrail(this.playerTrail, this.player, time, arriving ? Math.max(1, speed * (1 - arrivalProgress * 1.2)) : speed, delta);
    this.playerTrail.material.opacity = damp(this.playerTrail.material.opacity, arriving ? Math.max(0, 0.38 - arrivalProgress) : 0.5 + this.flow * 0.42, 6, delta);
    this.playerTrail.material.size = 0.13 + this.flow * 0.09;
    this.landingPulse = Math.max(0, this.landingPulse - delta * 2.8);
    const landingProgress = 1 - this.landingPulse;
    this.landingRing.position.x = this.currentLaneX;
    this.landingRing.scale.setScalar(0.7 + landingProgress * 2.5);
    this.landingRing.material.opacity = this.landingPulse * 0.72;
    this.updatePowerupVisuals(delta, time, speed, arriving);

    const config = this.stageConfig || STAGE_CONFIGS[this.stageIndex];
    this.directorState.elapsed += delta;
    const relationshipVisible = this.updateRelationshipPresence(delta, time, speed, arriving, introActive);
    this.companion.visible = arriving || relationshipVisible;
    if (arriving) {
      const arrivalInteraction = this.arrivalInteractionState.strength;
      const meetingX = 0.66 - (this.arrivalInteractionState.completed ? arrivalInteraction * 0.12 : 0);
      const meetingZ = -0.2;
      this.companion.position.x = damp(this.companion.position.x, meetingX, 5.2, delta);
      this.companion.position.z = damp(this.companion.position.z, meetingZ, 5.2, delta);
      this.player.rotation.y = damp(this.player.rotation.y, Math.PI * 1.32, 4.6, delta);
      this.companion.rotation.y = damp(this.companion.rotation.y, Math.PI * 0.68, 4.6, delta);
      if (this.companion.userData.modelRunner) animateRiggedRunner(this.companion, delta, "idle", 0, 0.1, 0, 0);
      else animateCharacter(this.companion, time, "idle", 0, 0.04, 1.2, 0, 0);
      const arrivalAnimated = this.arrivalSet?.userData.animated || [];
      for (let index = 0; index < arrivalAnimated.length; index += 1) {
        const light = arrivalAnimated[index];
        if (light.material?.emissiveIntensity !== undefined) light.material.emissiveIntensity = 2.2 + Math.sin(time * 2.8 + index) * 0.8;
        if (light.material?.opacity !== undefined) light.material.opacity = 0.68 + Math.sin(time * 2.1 + index) * 0.12;
      }
      if (this.arrivalSet?.userData.keyLight) this.arrivalSet.userData.keyLight.intensity = 8 + Math.sin(time * 1.4) * 1.5 + arrivalInteraction * 5.5;
      const itemDisplay = this.arrivalSet?.userData.itemDisplay;
      const arrivalEntries = itemDisplay?.userData.entries || [];
      for (let index = 0; index < arrivalEntries.length; index += 1) {
        const entry = arrivalEntries[index];
        const reveal = clamp((arrivalProgress - 0.4 - entry.revealOrder * 0.055) / 0.18, 0, 1);
        const bounce = 1 + Math.sin(reveal * Math.PI) * 0.22;
        const baseScale = entry.item.kind === "umbrella" ? 0.78 : entry.item.kind === "flower" ? 0.72 : 0.62;
        entry.prop.scale.setScalar(Math.max(0.001, reveal * baseScale * bounce));
        entry.prop.rotation.y += delta * (0.18 + index * 0.06);
        entry.halo.scale.setScalar(Math.max(0.001, reveal * (1.2 + index * 0.08)));
        entry.halo.material.opacity = reveal * (0.22 + Math.sin(time * 2.8 + index) * 0.08);
      }
      if (itemDisplay?.userData.handoffArc) {
        itemDisplay.userData.handoffArc.material.opacity = Math.min(0.9,
          Math.sin(clamp((arrivalProgress - 0.22) / 0.52, 0, 1) * Math.PI) * 0.66 + arrivalInteraction * 0.28);
      }
      if (itemDisplay?.userData.sparkles) {
        itemDisplay.userData.sparkles.material.opacity = clamp((arrivalProgress - 0.38) * 2.6, 0, 0.72) * (0.78 + Math.sin(time * 2.3) * 0.18);
        itemDisplay.userData.sparkles.rotation.y = time * 0.12;
      }
      if (itemDisplay?.userData.interactionFx) {
        const fxReveal = Math.max(clamp((arrivalProgress - 0.42) / 0.2, 0, 1), arrivalInteraction * 0.82);
        const cameraPulse = ["camera", "photo"].includes(itemDisplay.userData.featuredKind)
          ? Math.max(0, 1 - Math.abs(fxReveal - 0.45) * 2.2)
          : 0.72 + Math.sin(time * 3.1) * 0.18;
        const fxMaterials = itemDisplay.userData.fxMaterials;
        for (let index = 0; index < fxMaterials.length; index += 1) {
          fxMaterials[index].material.opacity = fxReveal * fxMaterials[index].maxOpacity * cameraPulse;
        }
        itemDisplay.userData.interactionFx.scale.setScalar(0.82 + fxReveal * 0.18);
        itemDisplay.userData.interactionFx.rotation.z = MUSIC_STORY_KINDS.has(itemDisplay.userData.featuredKind) || LIGHT_STORY_KINDS.has(itemDisplay.userData.featuredKind)
          ? time * 0.18
          : Math.sin(time * 0.8) * 0.025;
        if (itemDisplay.userData.fxLight) itemDisplay.userData.fxLight.intensity = fxReveal * (5.5 + Math.sin(time * 3.2) * 1.2);
      }
    } else {
      this.player.rotation.y = damp(this.player.rotation.y, 0, 8, delta);
    }
    this.updateDirectorVisual(delta, time, this.currentDistance, arriving, relationshipVisible);

    if (!arriving && this.storyWorldInfluence > 0.001) {
      const gestureStrength = this.storyWorldInfluence;
      const gestureBeat = Math.sin(time * (this.storyWorldState.gesture === "surge" ? 11 : 5.6));
      if (this.storyWorldState.gesture === "surge") {
        this.player.rotation.x -= gestureStrength * 0.095;
        this.player.rotation.z += gestureBeat * gestureStrength * 0.025;
      } else if (this.storyWorldState.gesture === "protect") {
        this.player.rotation.x += gestureStrength * 0.045;
        this.player.rotation.z -= gestureStrength * 0.055;
      } else if (this.storyWorldState.gesture === "reach") {
        this.player.rotation.y += gestureStrength * 0.09;
        this.player.rotation.z += gestureBeat * gestureStrength * 0.035;
      } else if (this.storyWorldState.gesture === "weave") {
        this.player.rotation.z += gestureBeat * gestureStrength * 0.075;
      } else {
        this.player.rotation.x -= gestureStrength * 0.025;
      }
    }

    if (this.carriedItems.length) {
      const transfer = clamp((arrivalProgress - 0.34) / 0.34, 0, 1);
      const transferEase = transfer * transfer * (3 - transfer * 2);
      const carryX = arriving ? THREE.MathUtils.lerp(this.player.position.x + 0.62, this.companion.position.x - 0.42, transferEase) : this.player.position.x + 0.62;
      const carryY = arriving ? 1.02 + Math.sin(transferEase * Math.PI) * 0.42 : this.player.position.y + 0.86 + Math.sin(time * 9.4) * 0.025;
      const carryZ = arriving ? THREE.MathUtils.lerp(this.player.position.z + 0.03, this.companion.position.z + 0.18, transferEase) : this.player.position.z + 0.03;
      this.carryGroup.position.set(carryX, carryY, carryZ);
      this.carryGroup.rotation.set(0, arriving ? Math.PI * transferEase : -0.14, arriving ? 0 : -0.06 + Math.sin(time * 9.4) * 0.018);
      if (this.carryRig?.userData.clasp) this.carryRig.userData.clasp.material.emissiveIntensity = 0.55 + this.flow * 1.2 + Math.sin(time * 4.6) * 0.12;
      this.carryGroup.visible = !arriving || arrivalProgress < 0.88;
    } else {
      this.carryGroup.visible = false;
    }

    const introWeave = introActive && String(this.stageIntroState.cameraCue).includes("weave")
      ? Math.sin(this.stageIntroState.beatElapsed * 1.8) * 0.48
      : 0;
    const baseCameraTargetX = arriving
      ? (this.stageIndex % 2 ? -1.15 : 1.15) * arrivalEase
      : introActive ? introCue.x + introWeave : this.currentLaneX * 0.42 + (this.stageIndex >= 4 ? 0.08 : 0);
    const directorCamera = this.directorState.camera;
    const directorCameraBlend = arriving || introActive ? 0 : 0.42 + this.directorState.revealStrength * 0.48;
    const directedCameraX = clamp(directorCamera.x + this.currentLaneX * 0.18, -directorCamera.maxLaneOffset * LANE_WIDTH, directorCamera.maxLaneOffset * LANE_WIDTH);
    const cameraTargetX = campusThirdPerson
      ? this.currentLaneX * 0.58 + directedCameraX * 0.06
      : THREE.MathUtils.lerp(baseCameraTargetX, directedCameraX, directorCameraBlend);
    const cadenceCamera = Math.sin(this.cadencePhase) * (0.012 + this.directorState.revealStrength * 0.014);
    const cameraBob = frame.mode === "playing"
      ? Math.sin(time * (9.2 + speed * 0.12)) * (0.025 + this.flow * 0.018) + cadenceCamera
      : Math.sin(time * 0.8) * 0.018;
    const shakeX = (Math.sin(time * 83) + Math.sin(time * 41)) * this.shake * 0.07;
    const shakeY = Math.sin(time * 67) * this.shake * 0.055;
    const statusStrength = this.statusVisualState.strength;
    this.camera.position.x = damp(this.camera.position.x, cameraTargetX, arriving ? 2.8 : 6, delta) + shakeX;
    this.camera.position.y = damp(
      this.camera.position.y,
      arriving
        ? 3.78 + cameraBob
        : campusThirdPerson ? 4.62 + vertical * 0.08 - (motion.action === "slide" ? 0.16 : 0) + cameraBob
        : introActive ? introCue.y + cameraBob : THREE.MathUtils.lerp(
          5.16 - (motion.action === "slide" ? 0.2 : 0) - this.flow * 0.08 - statusStrength * 0.1,
          directorCamera.y,
          directorCameraBlend
        ) + cameraBob,
      arriving ? 3.2 : introActive ? 4.8 : 9,
      delta
    ) + shakeY;
    this.camera.position.z = damp(
      this.camera.position.z,
      arriving ? 8.4 : campusThirdPerson ? 9.55 + this.flow * 0.18 - this.powerupStrengths.overdrive * 0.28
        : introActive ? introCue.z : THREE.MathUtils.lerp(
        motion.action === "slide" ? 10.86 : 10.42 + this.flow * 0.28 - this.powerupStrengths.overdrive * 0.42,
        directorCamera.z,
        directorCameraBlend
      ),
      arriving ? 2.8 : introActive ? 4.6 : 6.5,
      delta
    );
    this.camera.fov = damp(
      this.camera.fov,
      arriving
        ? 52
        : campusThirdPerson ? 56 + clamp((speed - 10) * 0.34, 0, 5.2) + this.flow * 2.6
        : introActive ? introCue.fov
        : Math.max(55, THREE.MathUtils.lerp(
          58.5 + clamp((speed - 10) * 0.48, 0, 7.4) + this.speedPulse * 1.8 + this.flow * 4.6
            + this.storyFocus * 1.35 + this.powerupStrengths.overdrive * 1.8 + this.synergyInfluence * 1.2 + statusStrength * 1.15,
          directorCamera.fov,
          directorCameraBlend
        )),
      arriving ? 3 : 6,
      delta
    );
    this.camera.updateProjectionMatrix();
    if (arriving) this.camera.lookAt(0.02, 1.38, -0.72);
    else if (campusThirdPerson) {
      this.camera.lookAt(this.currentLaneX * 0.42, 0.92 + vertical * 0.12, -18.6 - this.flow * 2);
      this.camera.rotation.z += clamp(-this.lateralVelocity * (0.016 + this.flow * 0.01), -0.058, 0.058);
    }
    else if (introActive) this.camera.lookAt(this.currentLaneX * 0.16, introCue.lookY, introCue.lookZ);
    else {
      this.camera.lookAt(
        THREE.MathUtils.lerp(this.currentLaneX * 0.34, this.currentLaneX * 0.12, directorCameraBlend),
        THREE.MathUtils.lerp(0.62, directorCamera.lookY, directorCameraBlend),
        THREE.MathUtils.lerp(-15.8 - this.flow * 3.2 - this.powerupStrengths.overdrive * 1.4, directorCamera.lookZ, directorCameraBlend)
      );
      this.camera.rotation.z += clamp(-this.lateralVelocity * (0.018 + this.flow * 0.012), -0.075, 0.075);
    }
    this.shake = Math.max(0, this.shake - delta * 2.8);
    this.flash = Math.max(0, this.flash - delta * 1.8);
    this.flashMaterial.opacity = this.flash;
    this.speedPulse = Math.max(0, this.speedPulse - delta * 2.4);

    const directorAct = this.directorState.act;
    this.scene.background.lerp(this.directorState.backgroundTarget, 1 - Math.exp(-2.2 * delta));
    this.scene.fog.color.lerp(this.directorState.fogTarget, 1 - Math.exp(-2.2 * delta));
    this.scene.fog.density = damp(this.scene.fog.density, this.targetFogDensity * directorAct.fog, 2.5, delta);
    const itemPulseStrength = this.itemPulse ? clamp(this.itemPulse.life / this.itemPulse.duration, 0, 1) : 0;
    this.renderer.toneMappingExposure = damp(
      this.renderer.toneMappingExposure,
      this.targetExposure + (directorAct.edge - 1) * 0.08 + this.flow * 0.08 + itemPulseStrength * 0.045 + this.synergyInfluence * 0.12
        - statusStrength * (this.statusVisualState.mode === "failed" ? 0.24 : 0.08),
      2.8,
      delta
    );
    this.keyLight.intensity = (arriving ? 2.35 : config.weather === "storm" && time % 8.8 < 0.1 ? 8.5 : config.world.lighting.keyIntensity * directorAct.edge)
      + this.synergyInfluence * 4.5 - statusStrength * 0.65;
    this.warmLight.intensity = arriving
      ? 7.5
      : config.world.lighting.warmIntensity * (0.84 + directorAct.edge * 0.16) + this.flow * 8 + itemPulseStrength * 12 + this.storyFocus * 6
        + this.storyWorldInfluence * 6 + this.synergyInfluence * 8 + this.directorState.recoverStrength * 5;
    if (this.itemPulse) this.warmLight.color.lerp(this.directorScratchColor.setHex(this.itemPulse.color), 1 - Math.exp(-8 * delta));
    else this.warmLight.color.lerp(this.directorState.accentTarget, 1 - Math.exp(-4 * delta));
    this.runnerFillLight.intensity = arriving ? 4.8 : 8.5 + this.flow * 4.5;
    this.warmLight.position.x = this.warmLightBasePosition.x + Math.sin(time * 0.18) * (config.weather === "neon" ? 2.6 : 1.2);

    this.updateDistrictWorld(delta, time, this.currentDistance, speed);
    this.updateWeather(delta, time, speed, Number(runState.combo) || 0);
    this.rain.material.opacity *= directorAct.rain;
    this.ambientParticles.material.opacity *= this.qualityProfile.particleScale;
    if (this.itemPulse) {
      const pulse = clamp(this.itemPulse.life / this.itemPulse.duration, 0, 1);
      if (this.itemPulse.kind === "umbrella") this.rain.material.opacity *= 1 - pulse * 0.68;
      if (MUSIC_STORY_KINDS.has(this.itemPulse.kind)) {
        this.ambientParticles.scale.setScalar(1 + Math.sin(time * 8) * pulse * 0.18);
        this.speedStreaks.material.opacity = Math.min(0.82, this.speedStreaks.material.opacity + pulse * 0.15);
      } else this.ambientParticles.scale.setScalar(1);
      if (LIGHT_STORY_KINDS.has(this.itemPulse.kind)) {
        this.powerRailMaterial.emissiveIntensity = 0.16 + pulse * 2.4;
        this.laneGuideMaterial.emissiveIntensity = 0.28 + pulse * 1.8;
      }
      if (PLANT_STORY_KINDS.has(this.itemPulse.kind)) this.ambientParticles.material.size = Math.max(this.ambientParticles.material.size, 0.16 + pulse * 0.1);
    } else {
      this.ambientParticles.scale.setScalar(1);
      this.powerRailMaterial.emissiveIntensity = damp(this.powerRailMaterial.emissiveIntensity, 0.16, 4, delta);
      this.laneGuideMaterial.emissiveIntensity = damp(this.laneGuideMaterial.emissiveIntensity, 0.28, 4, delta);
    }
    if (arriving) {
      this.ambientTrains.forEach((train) => { train.visible = false; });
      this.speedStreaks.material.opacity = 0;
    }
    this.updateBackdrops(delta);
    this.updateBursts(delta);
    this.updatePickupSequences(delta, time);
    if (this.itemPulse) {
      this.itemPulse.life -= delta;
      if (this.itemPulse.life <= 0) this.itemPulse = null;
    }
    this.renderer.render(this.scene, this.camera);
    if (this.qualityElapsed >= 2.5) {
      const currentRatio = this.renderer.getPixelRatio();
      const estimatedFps = 1 / Math.max(this.frameAverage, 1 / 120);
      const drawCalls = this.renderer.info.render.calls;
      const profile = this.qualityProfile;
      const overloaded = estimatedFps < 48 || drawCalls > profile.targetDrawCalls + 12;
      const comfortablyUnderBudget = estimatedFps > 57 && drawCalls < profile.targetDrawCalls - 14;
      this.qualityGoodWindows = comfortablyUnderBudget ? this.qualityGoodWindows + 1 : 0;
      if (overloaded && this.qualityProfileIndex < QUALITY_PROFILES.length - 1) {
        this.applyQualityProfile(QUALITY_PROFILES[this.qualityProfileIndex + 1].key);
        this.qualityGoodWindows = 0;
      } else if (!this.mobilePerformance && this.qualityGoodWindows >= 4 && this.qualityProfileIndex > 0) {
        this.applyQualityProfile(QUALITY_PROFILES[this.qualityProfileIndex - 1].key);
        this.qualityGoodWindows = 0;
      }
      const nextRatio = clamp(
        currentRatio + (estimatedFps < 48 ? -0.12 : estimatedFps > 57 ? 0.08 : 0),
        1,
        this.maxPixelRatio
      );
      if (Math.abs(nextRatio - currentRatio) >= 0.05) {
        this.renderer.setPixelRatio(nextRatio);
        this.renderer.setSize(this.cssWidth, this.cssHeight, false);
        this.pixelRatio = nextRatio;
      }
      this.canvas.setAttribute("data-render-fps", String(Math.round(estimatedFps)));
      this.qualityElapsed = 0;
    }
    this.canvas.setAttribute("data-render-calls", String(this.renderer.info.render.calls));
    this.canvas.setAttribute("data-render-triangles", String(this.renderer.info.render.triangles));
    this.canvas.setAttribute("data-render-stage", String(this.stageIndex + 1));
    return this.updateFrameSnapshot(this.frameSnapshot);
  }

  updateFrameSnapshot(target) {
    let pooledPowerupEffects = 0;
    for (let index = 0; index < this.powerupEffectPool.length; index += 1) {
      if (this.powerupEffectPool[index].life > 0) pooledPowerupEffects += 1;
    }
    target.ready = true;
    target.stageIndex = this.stageIndex;
    target.webgl = true;
    target.pixelRatio = this.pixelRatio || 1;
    target.width = this.canvas.width;
    target.height = this.canvas.height;
    target.entities = this.entityObjects.size;
    target.bursts = this.bursts.length;
    target.rings = this.rings.length;
    target.pickupSequences = this.pickupSequences.length;
    target.flow = this.flow;
    target.storyFocus = this.storyFocus;
    target.powerups.magnet = this.powerupStrengths.magnet;
    target.powerups.shield = this.powerupStrengths.shield;
    target.powerups.multiplier = this.powerupStrengths.multiplier;
    target.powerups.overdrive = this.powerupStrengths.overdrive;
    target.storyWorld = this.storyWorldInfluence;
    target.synergy = this.synergyInfluence;
    target.pooledPowerupEffects = pooledPowerupEffects;
    target.drawCalls = this.renderer.info.render.calls;
    target.triangles = this.renderer.info.render.triangles;
    target.rainOpacity = this.rain.material.opacity;
    target.carriedItems.length = this.carriedItems.length;
    for (let index = 0; index < this.carriedItems.length; index += 1) target.carriedItems[index] = this.carriedItems[index].item.id;
    target.rendezvousVisible = this.companion.visible;
    target.arrivalProgress = this.arrivalProgress;
    target.routePhase = this.routePhase;
    target.worldScene = this.stageConfig?.world.scene;
    target.roadGeometry = this.stageConfig?.world.road.geometry;
    target.particleStyle = this.stageConfig?.world.particles.kind;
    target.directorAct = this.directorState.act.id;
    target.routeTopology = this.directorState.act.topology;
    target.visibleGoal = this.directorState.act.goal;
    target.cameraRig = this.directorState.act.cameraRig;
    target.relationshipPresence = this.directorState.relationship.key;
    target.qualityProfile = this.qualityProfile.key;
    target.targetDrawCalls = this.qualityProfile.targetDrawCalls;
    target.poolGeneration = this.poolGeneration;
    target.stageIntro = this.stageIntroState.active;
    target.visualStatus = this.statusVisualState.mode;
    target.statusStrength = this.statusVisualState.strength;
    return target;
  }

  snapshot() {
    const current = this.updateFrameSnapshot(this.frameSnapshot);
    return { ...current, powerups: { ...current.powerups }, carriedItems: current.carriedItems.slice() };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.runnerLoadToken += 1;
    this.cityLoadToken += 1;
    this.campusMaterialLoadToken += 1;
    this.campusArtLoadToken += 1;
    this.endArrival();
    this.clearCarry();
    this.pickupSequences.length = 0;
    this.bursts.length = 0;
    this.rings.length = 0;
    this.entityObjects.clear();
    for (const bucket of this.entityPool.values()) {
      for (let index = 0; index < bucket.length; index += 1) disposeObject(bucket[index]);
    }
    this.entityPool.clear();
    disposeObject(this.scene);
    for (let index = 0; index < this.loadedCitySources.length; index += 1) disposeObject(this.loadedCitySources[index]);
    this.loadedCitySources.length = 0;
    const detachedTextures = [
      ...this.roadTextures.flat(),
      this.platformTexture,
      this.particleTexture,
      this.environmentTexture,
      this.campusCanopyTexture,
      this.campusSkyTexture,
      this.campusFacadeTexture,
      this.campusFlowerbedTexture,
      this.campusLeftLandmarkTexture,
      this.campusRightLandmarkTexture,
      this.campusLeftStreetscapeTexture,
      this.campusRightStreetscapeTexture,
      this.campusRoadShadowTexture,
      ...this.worldParticleTextures,
      ...this.stageTextures,
      ...this.arrivalStageTextures
    ];
    const disposedTextures = new Set();
    for (let index = 0; index < detachedTextures.length; index += 1) {
      const texture = detachedTextures[index];
      if (!texture?.isTexture || disposedTextures.has(texture) || SHARED_TEXTURES.has(texture)) continue;
      disposedTextures.add(texture);
      texture.dispose();
    }
    this.renderer.renderLists?.dispose();
    this.renderer.dispose();
    this.scene.clear();
  }
}

const api = Object.freeze({
  version: "three-0.185.1-rendezvous-runner-v3",
  stageAssets: Object.freeze(STAGE_CONFIGS.map((_, index) => resolveStageVisualConfig(index).asset)),
  worldProfiles: Object.freeze(STAGE_CONFIGS.map((stage) => Object.freeze({
    scene: stage.world.scene,
    roadGeometry: stage.world.road.geometry,
    obstacleStyle: stage.world.obstacles.style,
    particleStyle: stage.world.particles.kind,
    horizonStyle: stage.world.horizon.kind
  }))),
  create(canvas) {
    return new CinematicRunnerRenderer(canvas);
  }
});

window.RunnerLoveVisuals = api;
window.dispatchEvent(new Event("runner-love-visuals-ready"));
