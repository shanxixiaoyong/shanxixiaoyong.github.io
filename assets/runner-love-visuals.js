import * as THREE from "./vendor/three-0.185.1.module.min.js";
import { GLTFLoader } from "./vendor/three-addons/GLTFLoader.js";

const STAGE_CONFIGS = Object.freeze([
  {
    id: "first-sight",
    district: "campus-line",
    asset: "assets/love-scenes/campus-library.webp",
    sky: 0x70bfd0,
    skyTop: 0x3a92ae,
    skyBottom: 0xf6c982,
    fog: 0x79aeb2,
    fogDensity: 0.007,
    key: 0xffcf8d,
    ambient: 0xbcd7cf,
    ground: 0x14272a,
    road: 0x607276,
    curb: 0xbab49f,
    accent: 0xffc454,
    weather: "after-rain",
    routeStyle: "promenade",
    destination: "library-crossing",
    props: ["campus", "lamp", "signal", "graffiti"]
  },
  {
    id: "familiar-steps",
    district: "glass-station",
    asset: "assets/love-scenes/cafe-evening.webp",
    sky: 0x72c8d2,
    skyTop: 0x3791a7,
    skyBottom: 0xc8f2e6,
    fog: 0x82b8bd,
    fogDensity: 0.006,
    key: 0xffe5ad,
    ambient: 0xd5ece6,
    ground: 0x183235,
    road: 0x546d70,
    curb: 0xa9c8c3,
    accent: 0x61e0ca,
    weather: "breeze",
    routeStyle: "riverside",
    destination: "bridge-bookstore",
    props: ["station", "railing", "bench", "tree"]
  },
  {
    id: "closer-signals",
    district: "neon-river",
    asset: "assets/love-scenes/city-night.webp",
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
    props: ["building", "cafe", "neon-sign", "signal"]
  },
  {
    id: "spoken-heart",
    district: "date-market",
    asset: "assets/love-scenes/rain-night.webp",
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
    props: ["tunnel", "lamp", "shelter", "graffiti"]
  },
  {
    id: "shared-days",
    district: "home-quarter",
    asset: "assets/love-scenes/warm-home.webp",
    sky: 0x5e8f93,
    skyTop: 0x3c6974,
    skyBottom: 0xf0bd7e,
    fog: 0x6f9690,
    fogDensity: 0.006,
    key: 0xffdf9f,
    ambient: 0xd7dec4,
    ground: 0x213a31,
    road: 0x586d65,
    curb: 0xa8a58c,
    accent: 0xffbf4f,
    weather: "warm",
    routeStyle: "neighborhood",
    destination: "warm-kitchen",
    props: ["market", "station", "home", "tree"]
  },
  {
    id: "rough-weather",
    district: "storm-bridge",
    asset: "assets/love-scenes/rain-night.webp",
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
    props: ["maintenance", "warning", "signal", "tunnel"]
  },
  {
    id: "toward-home",
    district: "sunrise-terminal",
    asset: "assets/love-scenes/starlight-vow.webp",
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
    props: ["terminal", "home", "lamp", "tree"]
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
const BACKDROP_OPACITY = 0.13;
const STAGE_COLLECTIBLE_COLORS = Object.freeze([0xffc34d, 0x68ead3, 0x67e8ff, 0xff6688, 0xffb74f, 0xff6a70, 0xffd85a]);
const STAGE_TOKEN_COLORS = Object.freeze([0xff5f72, 0xf4fff9, 0xffe1a0, 0xfff4e6, 0xfff0a6, 0xffedf0, 0xffffff]);
const STAGE_TRACKSIDE_PROPS = Object.freeze([
  Object.freeze(["tree", "lamp", "bench", "signal"]),
  Object.freeze(["shelter", "railing", "lamp", "bench"]),
  Object.freeze(["neon-sign", "signal", "lamp", "railing"]),
  Object.freeze(["shelter", "lamp", "neon-sign", "bench"]),
  Object.freeze(["tree", "bench", "lamp", "railing"]),
  Object.freeze(["warning", "signal", "railing", "lamp"]),
  Object.freeze(["lamp", "tree", "railing", "shelter"])
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

function disposeObject(object) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  object.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    if (!child.material || child.userData.sharedMaterial) return;
    (Array.isArray(child.material) ? child.material : [child.material]).forEach((item) => materials.add(item));
  });
  materials.forEach((item) => {
    if (item.map && item.map !== object.userData.sharedTexture) textures.add(item.map);
    item.dispose?.();
  });
  textures.forEach((item) => item.dispose?.());
  geometries.forEach((item) => { if (!SHARED_GEOMETRIES.has(item)) item.dispose?.(); });
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
const roundedGeometryCache = new Map();
let heartGeometry = null;
const stageTokenGeometryCache = new Map();

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
  return toonGradientTexture;
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
    if (sourceIndex === 8) sourceMaterial.color.setHex(0xffffff);
    else sourceMaterial.color.lerp(tint, 0.18);
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
      position.set(
        side * (isTree ? 6.7 + sideVariation : isTank ? 8.4 + sideVariation * 0.4 : layout.offset + sideVariation),
        -0.04,
        -8 - row * layout.spacing - sourceSlot * 1.45
      );
      rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), side > 0 ? -Math.PI / 2 : Math.PI / 2);
      transform.compose(position, rotation, scale);
      instances.setMatrixAt(index, transform);
      const instanceTint = isTree
        ? new THREE.Color(0x74af62).lerp(new THREE.Color(config.accent), 0.08 + (index % 3) * 0.025)
        : new THREE.Color(0xffffff)
          .lerp(tint, 0.16)
          .lerp(new THREE.Color(index % 3 === 0 ? 0xffffff : 0xc2cad0), index % 3 === 0 ? 0.06 : 0.04);
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
  return group;
}

function createDistrictGateway(config) {
  const group = new THREE.Group();
  const frameMaterial = material(0x15252e, { roughness: 0.3, metalness: 0.82 });
  const edgeMaterial = material(config.accent, { emissive: config.accent, emissiveIntensity: 1.8, roughness: 0.22, metalness: 0.48 });
  const label = DISTRICT_LABELS[config.district] || "CITY RUN";
  const labelTexture = makeSignTexture(label, config.accent);
  [-4.72, 4.72].forEach((x) => {
    const post = mesh(new THREE.BoxGeometry(0.16, 5.7, 0.22), frameMaterial);
    post.position.set(x, 2.85, 0);
    const edge = mesh(new THREE.BoxGeometry(0.035, 5.42, 0.235), edgeMaterial);
    edge.position.set(x - Math.sign(x) * 0.075, 2.8, 0.01);
    group.add(post, edge);
  });
  const bridge = mesh(new THREE.BoxGeometry(9.62, 0.16, 0.24), frameMaterial);
  bridge.position.y = 5.65;
  const bridgeGlow = mesh(new THREE.BoxGeometry(9.36, 0.035, 0.26), edgeMaterial);
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

function makeRoadTexture() {
  const texture = canvasTexture(512, 512, (context, width, height) => {
    context.fillStyle = "#343a3a";
    context.fillRect(0, 0, width, height);
    let seed = 971;
    for (let index = 0; index < 7200; index += 1) {
      seed = (seed * 48271) % 2147483647;
      const x = seed % width;
      seed = (seed * 48271) % 2147483647;
      const y = seed % height;
      const shade = 44 + (seed % 58);
      const warm = seed % 7 === 0 ? 10 : 0;
      context.fillStyle = `rgba(${shade + warm},${shade + 4},${shade + 2},${0.22 + (seed % 31) / 100})`;
      const stone = 1 + (seed % 4);
      context.fillRect(x, y, stone, Math.max(1, stone - 1));
    }
    const sheen = context.createLinearGradient(0, 0, width, 0);
    sheen.addColorStop(0, "rgba(255,255,255,.02)");
    sheen.addColorStop(0.5, "rgba(198,226,221,.09)");
    sheen.addColorStop(1, "rgba(0,0,0,.08)");
    context.fillStyle = sheen;
    context.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 64) {
      context.fillStyle = "rgba(7,10,11,.13)";
      context.fillRect(0, y, width, 2);
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.25, 3.5);
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
  const leafMaterial = material(new THREE.Color(accent).lerp(new THREE.Color(0x2d6b50), 0.86), { roughness: 0.92 });
  [[0, 2.75, 0, 0.95], [-0.5, 2.45, 0.05, 0.72], [0.48, 2.5, -0.08, 0.78]].forEach(([x, y, z, scale]) => {
    const crown = mesh(new THREE.IcosahedronGeometry(scale, 1), leafMaterial);
    crown.position.set(x, y, z);
    group.add(crown);
  });
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
    const rib = mesh(new THREE.TorusGeometry(5.35, 0.08, 8, 40, Math.PI), archMaterial);
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
  [-5.05, 5.05].forEach((x) => {
    const height = compact ? 5.35 : 6.2;
    const post = mesh(new THREE.BoxGeometry(0.16, height, 0.16), steel);
    post.position.set(x, height / 2, 0);
    group.add(post);
  });
  const beamY = compact ? 5.2 : 6.05;
  const beam = mesh(new THREE.BoxGeometry(10.3, 0.15, 0.18), steel);
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
      const arch = mesh(new THREE.TorusGeometry(5.15, 0.065 + index * 0.012, 8, 42, Math.PI), index % 2 ? steel : glow);
      arch.position.set(0, 0.18, -index * 0.34);
      group.add(arch);
    }
    const signTexture = makeSignTexture(stageIndex === 6 ? "SUNRISE" : "NIGHT LINE", accent);
    const sign = mesh(new THREE.PlaneGeometry(2.25, 0.62), new THREE.MeshBasicMaterial({ map: signTexture }));
    sign.position.set(0, 4.75, 0.08);
    group.add(sign);
  } else if (stageIndex === 3 || stageIndex === 4) {
    const cable = mesh(new THREE.CylinderGeometry(0.022, 0.022, 10.2, 6), steel);
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
      bulb.position.set(-4.45 + index * 1.11, 4.56 - Math.sin(index / 8 * Math.PI) * 0.38, 0);
      group.add(bulb);
    }
  } else if (stageIndex === 5) {
    const top = mesh(new THREE.BoxGeometry(10.5, 0.16, 0.22), steel);
    top.position.y = 5.32;
    group.add(top);
    for (let index = -4; index <= 4; index += 2) {
      const brace = mesh(new THREE.BoxGeometry(2.6, 0.08, 0.12), index === 0 ? glow : steel);
      brace.position.set(index * 0.9, 4.34, 0);
      brace.rotation.z = (index / 2 + seed) % 2 ? 0.72 : -0.72;
      group.add(brace);
    }
  } else {
    const top = mesh(new THREE.BoxGeometry(10.4, 0.11, 0.16), steel);
    top.position.y = 5.18;
    const highlight = mesh(new THREE.BoxGeometry(10.1, 0.025, 0.18), glow);
    highlight.position.y = 5.08;
    group.add(top, highlight);
    [-4.85, 4.85].forEach((x) => {
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
      child.material = Array.isArray(child.material)
        ? child.material.map(convertMaterial)
        : convertMaterial(child.material);
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
  return { capacity, rims, hearts, glows, pickupTrail };
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

function createJumpBarrier(accent) {
  const group = new THREE.Group();
  const steel = material(0x3b4245, { roughness: 0.4, metalness: 0.58 });
  const stripeTexture = makeWarningStripeTexture(accent);
  const board = mesh(new THREE.BoxGeometry(2.05, 0.72, 0.2), material(0x31383d, { roughness: 0.5, metalness: 0.36 }), true);
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

function createSignalGate(accent) {
  const group = new THREE.Group();
  const steel = material(0x2d363c, { roughness: 0.36, metalness: 0.72 });
  [-1.02, 1.02].forEach((x) => {
    const post = mesh(new THREE.BoxGeometry(0.12, 2.45, 0.16), steel, true);
    post.position.set(x, 1.22, 0);
    const foot = mesh(new THREE.BoxGeometry(0.46, 0.1, 0.5), steel, true);
    foot.position.set(x, 0.06, 0);
    group.add(post, foot);
  });
  const warningTexture = makeWarningStripeTexture(accent);
  const beam = mesh(new THREE.BoxGeometry(2.22, 0.58, 0.22), material(0x252d33, { roughness: 0.44, metalness: 0.52 }), true);
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

function createServiceCart(accent) {
  const group = new THREE.Group();
  const stripeTexture = makeWarningStripeTexture(accent);
  const body = mesh(roundedPanelGeometry(1.75, 1.18, 2.2, 0.16), material(0xe0b842, { roughness: 0.46, metalness: 0.18 }), true);
  body.position.y = 0.82;
  const cabin = mesh(roundedPanelGeometry(1.58, 0.85, 1.05, 0.12), material(0x54636b, { roughness: 0.28, metalness: 0.35 }), true);
  cabin.position.set(0, 1.56, 0.34);
  const glass = mesh(new THREE.PlaneGeometry(1.2, 0.52), material(0x7bbac8, { emissive: accent, emissiveIntensity: 0.32, roughness: 0.1 }));
  glass.position.set(0, 1.6, 0.88);
  const bumper = mesh(new THREE.PlaneGeometry(1.42, 0.3), new THREE.MeshBasicMaterial({ map: stripeTexture }));
  bumper.position.set(0, 0.64, 1.115);
  const warningBeacons = [];
  [-0.52, 0.52].forEach((x) => {
    const beacon = mesh(new THREE.SphereGeometry(0.105, 12, 8), material(accent, { emissive: accent, emissiveIntensity: 5, roughness: 0.16 }));
    beacon.position.set(x, 2.05, 0.34);
    warningBeacons.push(beacon);
    group.add(beacon);
  });
  group.add(body, cabin, glass, bumper);
  [-0.66, 0.66].forEach((x) => {
    [-0.65, 0.65].forEach((z) => {
      const wheel = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 14), material(0x202326, { roughness: 0.78 }), true);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.32, z);
      group.add(wheel);
    });
  });
  group.userData.kind = "service-cart";
  group.userData.warningBeacons = warningBeacons;
  return group;
}

function createObstacle(stageIndex, avoid, accent, subtype = null, variant = 0) {
  if (subtype === "train") return createTrain(accent, variant);
  if (subtype === "service-cart") return createServiceCart(accent);
  if (subtype === "signal-gate" || avoid === "slide") return createSignalGate(accent);
  if (subtype === "barrier" || avoid === "jump") return createJumpBarrier(accent);
  return createServiceCart(accent);
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

class CinematicRunnerRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.canvas.setAttribute("data-three-version", "0.185.1");
    this.canvas.setAttribute("data-render-quality", "arcade");
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
    this.roadTexture = makeRoadTexture();
    this.platformTexture = makePlatformTexture();
    this.particleTexture = makeParticleTexture();
    this.stageTextures = Array(STAGE_CONFIGS.length).fill(null);
    this.arrivalStageTextures = Array(STAGE_CONFIGS.length).fill(null);
    this.backdropMaterials = [0, 1].map(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, fog: false, color: 0xffffff }));
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
    this.runnerFillLight = new THREE.PointLight(0xffe8cc, 8.5, 14, 2);
    this.runnerFillLight.position.set(-2.8, 3.2, -4.2);
    this.camera.add(this.runnerFillLight);
    this.scene.add(this.hemisphere, this.keyLight, this.edgeLight, this.warmLight);

    this.groundMaterial = material(STAGE_CONFIGS[0].ground, { roughness: 1 });
    this.roadMaterial = new THREE.MeshPhysicalMaterial({
      map: this.roadTexture,
      color: new THREE.Color(STAGE_CONFIGS[0].road).lerp(new THREE.Color(0xffffff), 0.16),
      roughness: 0.66,
      metalness: 0.04,
      clearcoat: 0.28,
      clearcoatRoughness: 0.42,
      envMapIntensity: 0.72
    });
    this.curbMaterial = material(STAGE_CONFIGS[0].curb, { roughness: 0.88 });
    this.platformMaterial = new THREE.MeshStandardMaterial({ map: this.platformTexture, color: 0x687475, roughness: 0.7, metalness: 0.08, envMapIntensity: 0.52 });
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
    this.ground = mesh(new THREE.PlaneGeometry(86, 410), this.groundMaterial, false, true);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.set(0, -0.075, -120);
    this.scene.add(this.ground);

    this.roadSegments = [];
    this.roadGroup = new THREE.Group();
    this.scene.add(this.roadGroup);
    this.buildRoad();

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
    this.collectibleBatches = createCollectibleBatches(this.particleTexture, STAGE_COLLECTIBLE_COLORS[0]);
    this.collectibleMatrix = new THREE.Matrix4();
    this.collectibleQuaternion = new THREE.Quaternion();
    this.collectibleEuler = new THREE.Euler();
    this.collectibleScale = new THREE.Vector3(0.54, 0.54, 0.54);
    this.collectiblePosition = new THREE.Vector3();
    this.scene.add(this.collectibleBatches.glows, this.collectibleBatches.pickupTrail, this.collectibleBatches.rims, this.collectibleBatches.hearts);
    this.bursts = [];
    this.rings = [];
    this.pickupSequences = [];
    this.itemPulse = null;
    this.flow = 0;
    this.storyFocus = 0;
    this.storyFocusTarget = 0;
    this.shake = 0;
    this.flash = 0;
    this.speedPulse = 0;
    this.lastTime = 0;
    this.frameAverage = 1 / 60;
    this.qualityElapsed = 0;
    this.cssWidth = 1;
    this.cssHeight = 1;
    this.maxPixelRatio = 1;
    this.stageIndex = -1;
    this.routePhase = 0;
    this.stageElapsed = 0;
    this.currentDistance = 0;
    this.currentLaneX = 0;
    this.previousLaneX = 0;
    this.lateralVelocity = 0;
    this.previousVertical = 0;
    this.landingPulse = 0;
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
    this.preloadBackdrops();
    this.setStage(0, true);
    this.modelLoader = new GLTFLoader();
    this.disposed = false;
    this.loadRiggedCharacters();
    this.loadPremiumCity();
  }

  loadRiggedCharacters() {
    Promise.all([
      this.modelLoader.loadAsync("assets/runner-models/runner-player.glb"),
      this.modelLoader.loadAsync("assets/runner-models/runner-companion.glb"),
      this.modelLoader.loadAsync("assets/runner-models/runner-motion.glb")
    ])
      .then(([playerGltf, companionGltf, motionGltf]) => {
        if (this.disposed) return;
        const riggedPlayer = createRiggedRunner(playerGltf, {
          height: 2.72,
          accent: 0xff7866,
          widthScale: 0.84,
          depthScale: 0.88,
          rotationY: 0,
          fashion: false
        }, motionGltf.animations);
        const riggedCompanion = createRiggedRunner(companionGltf, {
          height: 2.62,
          accent: 0xff668f,
          companion: true,
          widthScale: 0.87,
          depthScale: 0.9,
          rotationY: 0,
          fashion: false
        }, motionGltf.animations);
        riggedPlayer.position.copy(this.player.position);
        riggedCompanion.position.copy(this.companion.position);
        riggedCompanion.visible = Boolean(this.arrivalData);
        const oldPlayer = this.player;
        const oldCompanion = this.companion;
        this.scene.remove(oldPlayer, oldCompanion);
        disposeObject(oldPlayer);
        disposeObject(oldCompanion);
        this.player = riggedPlayer;
        this.companion = riggedCompanion;
        this.scene.add(this.player, this.companion);
        this.canvas.setAttribute("data-runner-model", "rg-poly-rigged");
      })
      .catch((error) => {
        console.error("Unable to initialize rigged runner models", error);
        this.canvas.setAttribute("data-runner-model", "procedural-fallback");
        this.canvas.setAttribute("data-runner-model-error", error?.message || "unknown");
      });
  }

  loadPremiumCity() {
    this.modelLoader.loadAsync("assets/runner-models/runner-city.glb")
      .then((cityGltf) => {
        if (this.disposed) return;
        const cityAssets = cityGltf.scenes.map((scene) => extractCityAsset(scene));
        const premiumDistricts = STAGE_CONFIGS.map((config, stageIndex) => {
          const district = createPremiumDistrict(config, stageIndex, cityAssets);
          district.visible = stageIndex === this.stageIndex;
          return district;
        });
        this.premiumDistricts = premiumDistricts;
        this.metroDistricts.forEach((district) => { district.visible = false; });
        this.scene.add(...premiumDistricts);
        this.setStage(this.stageIndex, true);
        this.canvas.setAttribute("data-city-model", "kenney-instanced");
      })
      .catch(() => {
        this.canvas.setAttribute("data-city-model", "procedural-fallback");
      });
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
      planterLeaves: new THREE.InstancedMesh(new THREE.SphereGeometry(0.47, 9, 7), this.streetFoliageMaterial, SEGMENT_COUNT * 4)
    };
    Object.values(this.roadBatches).forEach((batch) => {
      batch.instanceMatrix.setUsage(THREE.StaticDrawUsage);
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

  updateRoadBatches() {
    const transform = new THREE.Matrix4();
    this.roadSegments.forEach((segment, segmentIndex) => {
      const z = 7 - segmentIndex * SEGMENT_LENGTH;
      transform.makeTranslation(0, -0.08, z);
      this.roadBatches.ballast.setMatrixAt(segmentIndex, transform);
      let sleeperOffset = segmentIndex * 42;
      [-1, 0, 1].forEach((lane) => {
        for (let row = 0; row < 14; row += 1) {
          transform.makeTranslation(lane * LANE_WIDTH, 0.065, z - 7.45 + row * 1.14);
          this.roadBatches.sleepers.setMatrixAt(sleeperOffset, transform);
          sleeperOffset += 1;
        }
      });
      let railOffset = segmentIndex * 6;
      [-1, 0, 1].forEach((lane) => {
        [-0.53, 0.53].forEach((railX) => {
          transform.makeTranslation(lane * LANE_WIDTH + railX, 0.155, z);
          this.roadBatches.rails.setMatrixAt(railOffset, transform);
          railOffset += 1;
        });
      });
      [-1, 0, 1].forEach((lane, laneIndex) => {
        transform.makeTranslation(lane * LANE_WIDTH + 0.82, 0.12, z);
        this.roadBatches.thirdRails.setMatrixAt(segmentIndex * 3 + laneIndex, transform);
      });
      [-1, 1].forEach((side, sideIndex) => {
        transform.makeTranslation(side * 5.7, 0.1, z);
        this.roadBatches.walks.setMatrixAt(segmentIndex * 2 + sideIndex, transform);
        transform.makeTranslation(side * 4.46, 0.3, z);
        this.roadBatches.safetyLines.setMatrixAt(segmentIndex * 2 + sideIndex, transform);
      });
      [-LANE_WIDTH / 2, LANE_WIDTH / 2].forEach((x, boundaryIndex) => {
        for (let row = 0; row < 12; row += 1) {
          transform.makeTranslation(x, 0.048, z - 7.25 + row * 1.32);
          this.roadBatches.laneGuides.setMatrixAt(segmentIndex * 24 + boundaryIndex * 12 + row, transform);
        }
      });
      [-1, 0, 1].forEach((lane, laneIndex) => {
        for (let row = 0; row < 4; row += 1) {
          transform.makeTranslation(lane * LANE_WIDTH, 0.046, z - 6.1 + row * 4.05 + ((segmentIndex + laneIndex) % 2) * 0.28);
          this.roadBatches.laneTicks.setMatrixAt(segmentIndex * 12 + laneIndex * 4 + row, transform);
        }
        for (let row = 0; row < 3; row += 1) {
          const patchX = lane * LANE_WIDTH + (((segmentIndex + row + laneIndex) % 3) - 1) * 0.34;
          const patchZ = z - 5.7 + row * 5.15 + laneIndex * 0.42;
          transform.makeRotationY(((segmentIndex * 3 + laneIndex + row) % 5 - 2) * 0.075);
          transform.setPosition(patchX, 0.034, patchZ);
          this.roadBatches.roadPatches.setMatrixAt(segmentIndex * 9 + laneIndex * 3 + row, transform);
        }
        if ((segmentIndex + laneIndex) % 3 === 0) {
          transform.makeTranslation(lane * LANE_WIDTH + (laneIndex - 1) * 0.28, 0.052, z + 3.2 - laneIndex * 4.35);
        } else {
          transform.makeScale(0, 0, 0);
        }
        this.roadBatches.manholes.setMatrixAt(segmentIndex * 3 + laneIndex, transform);
      });
      for (let row = 0; row < 5; row += 1) {
        if (segmentIndex % 3 === 1) transform.makeTranslation(0, 0.052, z - 1.45 + row * 0.72);
        else transform.makeScale(0, 0, 0);
        this.roadBatches.crosswalks.setMatrixAt(segmentIndex * 5 + row, transform);
      }
      [-1, 1].forEach((side, sideIndex) => {
        for (let row = 0; row < 2; row += 1) {
          transform.makeTranslation(side * 4.05, 0.046, z - 4.3 + row * 8.5 + (segmentIndex % 2) * 0.8);
          this.roadBatches.drains.setMatrixAt(segmentIndex * 4 + sideIndex * 2 + row, transform);
        }
        for (let row = 0; row < 4; row += 1) {
          const postZ = z - 6 + row * 4.15 + sideIndex * 0.5;
          transform.makeTranslation(side * 4.56, 0.54, postZ);
          this.roadBatches.edgePosts.setMatrixAt(segmentIndex * 8 + sideIndex * 4 + row, transform);
          transform.makeTranslation(side * 4.56, 0.92, postZ);
          this.roadBatches.edgePostLights.setMatrixAt(segmentIndex * 8 + sideIndex * 4 + row, transform);
        }
        for (let row = 0; row < 2; row += 1) {
          const planterZ = z - 5.15 + row * 9.7 + sideIndex * 1.1;
          transform.makeTranslation(side * 5.18, 0.54, planterZ);
          this.roadBatches.planterBases.setMatrixAt(segmentIndex * 4 + sideIndex * 2 + row, transform);
          transform.makeTranslation(side * 5.18, 1.15, planterZ);
          this.roadBatches.planterLeaves.setMatrixAt(segmentIndex * 4 + sideIndex * 2 + row, transform);
        }
      });
    });
    Object.values(this.roadBatches).forEach((batch) => {
      batch.instanceMatrix.needsUpdate = true;
    });
  }

  rebuildDecor() {
    const config = STAGE_CONFIGS[this.stageIndex];
    const phase = this.routePhase || 0;
    this.roadSegments.forEach((segment, index) => {
      const oldDecor = segment.userData.decor;
      segment.remove(oldDecor);
      disposeObject(oldDecor);
      const decor = new THREE.Group();
      const spanningType = config.props.find((type) => type === "tunnel" || type === "terminal" || type === "overpass");
      if (index < 10 && spanningType && index % 7 === 3) {
        const spanning = createProp(spanningType, config.accent, index + this.stageIndex);
        spanning.position.set(0, 0.18, 0);
        decor.add(spanning);
      }
      if (index < 10) {
        const tracksideProps = STAGE_TRACKSIDE_PROPS[this.stageIndex] || STAGE_TRACKSIDE_PROPS[0];
        [-1, 1].forEach((side, sideIndex) => {
          const type = tracksideProps[(index + sideIndex * 2 + phase) % tracksideProps.length];
          const prop = createProp(type, config.accent, index * 7 + sideIndex * 3 + this.stageIndex + phase * 11);
          const compact = ["lamp", "signal", "tree", "bench", "warning"].includes(type);
          prop.scale.setScalar(compact ? 0.86 : 0.74 + (index % 3) * 0.035);
          prop.position.set(side * (5.95 + (index % 3) * 0.28), 0.18, sideIndex ? -2.8 : 2.4);
          prop.rotation.y = type === "railing" ? 0 : side < 0 ? Math.PI / 2 : -Math.PI / 2;
          decor.add(prop);
        });
      }
      if (index % Math.max(4, 6 - phase) === 0) {
        const gantry = createGantry(config.accent, this.stageIndex === 5);
        gantry.position.z = -4.8;
        decor.add(gantry);
      }
      if (index < 10 && index % 5 === (4 - phase + 5) % 5) {
        const stageSpan = createStageSpan(this.stageIndex, config.accent, index);
        stageSpan.position.z = 3.4;
        decor.add(stageSpan);
      }
      if (index === 9) {
        const districtGate = createDistrictGateway(config);
        districtGate.scale.setScalar(0.72);
        districtGate.position.set(0, 0.18, -3.8);
        decor.add(districtGate);
      }
      segment.add(decor);
      segment.userData.decor = decor;
    });
  }

  buildWeather() {
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
      map: this.particleTexture,
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
    const config = STAGE_CONFIGS[this.stageIndex];
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
    const config = STAGE_CONFIGS[this.stageIndex];
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
    const enabled = arriving ? 0 : 1;
    const magnetStrength = this.powerupStrengths.magnet * enabled;
    const shieldStrength = this.powerupStrengths.shield * enabled;
    const multiplierStrength = this.powerupStrengths.multiplier * enabled;
    const overdriveStrength = this.powerupStrengths.overdrive * enabled;

    const magnetActive = magnetStrength > 0.01;
    visuals.magnet.group.visible = magnetActive;
    if (magnetActive) {
      visuals.magnet.group.position.set(this.currentLaneX, 1.05, PLAYER_Z - 0.16);
      visuals.magnet.material.opacity = magnetStrength * (0.18 + Math.sin(time * 8) * 0.035);
      visuals.magnet.arcs.forEach((arc, index) => {
        arc.rotation.z = -Math.PI * 0.74 + index * 0.08 + Math.sin(time * 2.8 + index) * 0.09;
        arc.rotation.y = Math.sin(time * 3.4 + index * 0.8) * 0.12;
      });
    }

    const shieldActive = shieldStrength > 0.01;
    visuals.shield.group.visible = shieldActive;
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
    visuals.multiplier.group.visible = multiplierActive;
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
    visuals.overdrive.group.visible = overdriveActive;
    visuals.overdrive.speedWaveMaterial.opacity = overdriveStrength * 0.24;
    visuals.overdrive.edgeFlowMaterial.opacity = overdriveStrength * 0.62;
    visuals.overdrive.speedWaves.count = overdriveActive ? 6 : 0;
    visuals.overdrive.edgeFlow.count = overdriveActive ? 20 : 0;
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
    visuals.storyWorld.group.visible = storyActive;
    visuals.storyWorld.roadPatches.count = storyActive ? 5 : 0;
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
    visuals.synergy.group.visible = synergyActive;
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

    const config = STAGE_CONFIGS[this.stageIndex];
    const baseEnvironment = ["neon", "rain", "storm", "starlight"].includes(config.weather) ? 0.9 : 0.72;
    this.scene.environmentIntensity = baseEnvironment + overdriveStrength * 0.08 + storyEnvelope * 0.1 + synergyEnvelope * 0.18;
    this.edgeLight.intensity = 1.75 + overdriveStrength * 3.6 + synergyEnvelope * 2.4;
  }

  preloadBackdrops() {
    STAGE_CONFIGS.forEach((config, index) => {
      this.textureLoader.load(config.asset, (texture) => {
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
        texture.repeat.y *= 0.68;
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

  setStage(index, immediate = false) {
    const nextIndex = clamp(Math.trunc(index), 0, STAGE_CONFIGS.length - 1);
    if (nextIndex === this.stageIndex && !immediate) return;
    this.stageIndex = nextIndex;
    this.routePhase = 0;
    this.stageElapsed = 0;
    const config = STAGE_CONFIGS[this.stageIndex];
    this.targetBackground.setHex(config.sky);
    this.targetFog.setHex(config.fog);
    this.targetFogDensity = config.fogDensity * FOG_SCALE;
    this.targetExposure = config.weather === "storm" ? 0.94 : config.weather === "starlight" ? 1.24 : config.weather === "neon" ? 1.19 : 1.18;
    this.hemisphere.color.setHex(config.ambient);
    this.hemisphere.groundColor.setHex(config.ground);
    this.keyLight.color.setHex(config.key);
    this.edgeLight.color.setHex(config.accent);
    this.warmLight.color.setHex(config.accent);
    const wetStage = ["after-rain", "rain", "storm"].includes(config.weather);
    this.roadMaterial.color.copy(new THREE.Color(config.road).lerp(new THREE.Color(0xffffff), 0.16));
    this.roadMaterial.roughness = wetStage ? 0.42 : 0.72;
    this.roadMaterial.clearcoat = wetStage ? 0.52 : 0.2;
    this.roadMaterial.clearcoatRoughness = wetStage ? 0.26 : 0.5;
    this.curbMaterial.color.setHex(config.curb);
    this.platformMaterial.color.copy(new THREE.Color(config.curb).lerp(new THREE.Color(config.road), 0.62).multiplyScalar(0.82));
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
    this.roadInsetMaterial.color.copy(new THREE.Color(config.road).multiplyScalar(0.48));
    this.roadPatchMaterial.color.copy(new THREE.Color(config.road).lerp(new THREE.Color(config.ground), 0.36).multiplyScalar(0.8));
    this.roadUtilityMaterial.color.copy(new THREE.Color(config.road).lerp(new THREE.Color(config.curb), 0.42).multiplyScalar(0.62));
    this.streetFurnitureMaterial.color.copy(new THREE.Color(config.curb).lerp(new THREE.Color(config.road), 0.62).multiplyScalar(0.72));
    this.streetGlowMaterial.color.setHex(config.accent);
    this.streetGlowMaterial.emissive.setHex(config.accent);
    this.streetPlanterMaterial.color.copy(new THREE.Color(config.curb).lerp(new THREE.Color(config.ground), 0.74));
    this.streetFoliageMaterial.color.copy(new THREE.Color(0x638f67).lerp(new THREE.Color(config.accent), 0.1));
    this.groundMaterial.color.setHex(config.ground);
    const railRoute = config.routeStyle === "metro" || config.routeStyle === "terminal";
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
      this.roadBatches.walks.visible = true;
    }
    this.ambientParticles.material.color.setHex(config.accent);
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
    this.setPowerupAccent(config);
    this.skyDome.userData.uniforms.topColor.value.setHex(config.skyTop);
    this.skyDome.userData.uniforms.bottomColor.value.setHex(config.skyBottom);
    this.skyDome.userData.uniforms.accentColor.value.setHex(config.accent);
    this.scene.environmentIntensity = ["neon", "rain", "storm", "starlight"].includes(config.weather) ? 0.9 : 0.72;
    this.runnerFillLight.color.copy(new THREE.Color(config.accent).lerp(new THREE.Color(0xffffff), 0.74));
    const activeDistricts = this.premiumDistricts || this.metroDistricts;
    this.metroDistricts.forEach((district, districtIndex) => {
      district.visible = !this.premiumDistricts && districtIndex === this.stageIndex;
    });
    this.premiumDistricts?.forEach((district, districtIndex) => {
      district.visible = districtIndex === this.stageIndex;
    });
    this.metroSkyline = activeDistricts[this.stageIndex];
    if (this.metroSkyline.userData.buildings) {
      this.metroSkyline.userData.buildings.material.color.copy(new THREE.Color(config.ground).lerp(new THREE.Color(config.skyTop), 0.2));
    }
    this.metroSkyline.userData.windowLights?.material.color.setHex(config.accent);
    this.ambientTrains.forEach((train, trainIndex) => {
      train.traverse((child) => {
        if (child.isSprite && child.material?.color) child.material.color.setHex(config.accent);
      });
      train.position.x = (trainIndex ? 1 : -1) * 7.15;
    });
    this.activateBackdrop(this.stageIndex, immediate);
    this.rebuildDecor();
    if (immediate) {
      this.scene.background.copy(this.targetBackground);
      this.scene.fog.color.copy(this.targetFog);
      this.scene.fog.density = this.targetFogDensity;
      this.renderer.toneMappingExposure = this.targetExposure;
    }
  }

  setRoutePhase(value) {
    const nextPhase = clamp(Math.trunc(Number(value) || 0), 0, 2);
    if (nextPhase === this.routePhase) return;
    this.routePhase = nextPhase;
    this.laneGuideMaterial.opacity = 0.6 + nextPhase * 0.08;
    this.rebuildDecor();
  }

  resize(width, height, devicePixelRatio = 1) {
    const cssWidth = Math.max(1, Number(width) || 720);
    const cssHeight = Math.max(1, Number(height) || 1280);
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
    const offset = (distance * WORLD_Z_SCALE) % SEGMENT_LENGTH;
    this.roadBaseGroup.position.z = offset;
    this.roadSegments.forEach((segment, index) => {
      let z = 7 - index * SEGMENT_LENGTH + offset;
      if (z > 14) z -= SEGMENT_COUNT * SEGMENT_LENGTH;
      segment.position.z = z;
      segment.userData.decor.visible = z < 4.8 && z > -58;
    });
    this.roadTexture.offset.y = -(distance * 0.011) % 1;
  }

  acquireEntity(entity, config) {
    const signature = `${this.stageIndex}:${entity.type}:${entity.itemId || entity.data?.itemId || entity.subtype || entity.avoid || entity.cue || "default"}:${Number(entity.variant) % 2}`;
    const bucket = this.entityPool.get(signature);
    let object = bucket?.pop();
    if (!object) {
      if (entity.type === "collectible") object = createCollectible(this.stageIndex, config.accent, this.particleTexture);
      else if (entity.type === "story-item" || entity.type === "route-choice") object = createStoryProp({
        id: entity.itemId || entity.data?.itemId,
        kind: entity.data?.kind,
        color: entity.data?.color
      }, config.accent, this.particleTexture, false);
      else if (entity.type === "obstacle") object = createObstacle(this.stageIndex, entity.avoid, config.accent, entity.subtype, entity.variant);
      else object = createCollectible(this.stageIndex, config.accent, this.particleTexture);
      object.userData.poolKey = signature;
      object.userData.sharedTexture = entity.type === "obstacle" ? null : this.particleTexture;
    }
    object.visible = true;
    object.userData.entityType = entity.type;
    object.userData.entitySubtype = entity.subtype || null;
    this.scene.add(object);
    return object;
  }

  recycleEntity(object) {
    this.scene.remove(object);
    object.visible = false;
    const key = object.userData.poolKey || "misc";
    const bucket = this.entityPool.get(key) || [];
    if (bucket.length < 5) {
      bucket.push(object);
      this.entityPool.set(key, bucket);
    } else {
      disposeObject(object);
    }
  }

  syncEntities(entities, time) {
    const activeIds = new Set();
    const config = STAGE_CONFIGS[this.stageIndex];
    const batches = this.collectibleBatches;
    const glowPositions = batches.glows.geometry.attributes.position.array;
    const trailPositions = batches.pickupTrail.geometry.attributes.position.array;
    let collectibleCount = 0;
    let storyFocusTarget = 0;
    entities.forEach((entity) => {
      if (!entity.active) return;
      if (entity.type === "collectible") {
        if (collectibleCount >= batches.capacity) return;
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
        this.collectiblePosition.set(x, y, z);
        this.collectibleEuler.set(
          0,
          Math.sin(time * 1.7 + entity.id) * 0.18,
          Math.sin(time * 1.2 + entity.id) * 0.08 + (this.currentLaneX - baseX) * magnetBend * 0.09
        );
        this.collectibleQuaternion.setFromEuler(this.collectibleEuler);
        this.collectibleMatrix.compose(this.collectiblePosition, this.collectibleQuaternion, this.collectibleScale);
        batches.rims.setMatrixAt(collectibleCount, this.collectibleMatrix);
        batches.hearts.setMatrixAt(collectibleCount, this.collectibleMatrix);
        glowPositions[collectibleCount * 3] = x;
        glowPositions[collectibleCount * 3 + 1] = y;
        glowPositions[collectibleCount * 3 + 2] = z - 0.05;
        for (let trailIndex = 0; trailIndex < 2; trailIndex += 1) {
          const offset = (collectibleCount * 2 + trailIndex) * 3;
          trailPositions[offset] = x + (trailIndex ? 0.08 : -0.08);
          trailPositions[offset + 1] = y - 0.3 - trailIndex * 0.18;
          trailPositions[offset + 2] = z + 0.04 + trailIndex * 0.08;
        }
        collectibleCount += 1;
        return;
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
          object.userData.markerOrbit.children.forEach((orbit) => {
            orbit.rotation.y += 0.008 * orbit.userData.spin;
            orbit.material.opacity = (0.26 + focus * 0.28) * (orbit.userData.spin > 0 ? 1 : 0.78);
          });
        }
        if (object.userData.approachRibbon) {
          object.userData.approachRibbon.children.forEach((ribbon) => {
            ribbon.material.opacity = 0.08 + focus * (ribbon.userData.phase ? 0.32 : 0.46);
            ribbon.position.x = Math.sin(time * 2.7 + ribbon.userData.phase) * (0.025 + focus * 0.04);
          });
        }
        if (object.userData.approachComets) {
          object.userData.approachComets.children.forEach((comet) => {
            const travel = (time * (0.55 + focus * 1.1) + comet.userData.offset) % 1;
            const angle = travel * Math.PI * 2 + entity.id * 0.17;
            comet.position.set(
              Math.sin(angle) * (0.38 + focus * 0.16),
              -0.7 + travel * 1.65,
              0.25 + Math.cos(angle) * 0.22
            );
            comet.material.opacity = (0.24 + focus * 0.62) * Math.sin(travel * Math.PI);
            comet.scale.setScalar(0.14 + focus * 0.14 + Math.sin(travel * Math.PI) * 0.08);
          });
        }
      }
      if (object.userData.kind === "train") object.rotation.z = Math.sin(time * 7 + entity.id) * 0.0025;
      if (object.userData.kind === "service-cart") object.rotation.y = Math.sin(time * 5.4 + entity.id) * 0.012;
      object.userData.warningBeacons?.forEach((beacon, beaconIndex) => {
        const pulse = 2.8 + Math.max(0, Math.sin(time * 8.5 + beaconIndex * Math.PI)) * 4;
        beacon.material.emissiveIntensity = pulse;
      });
      object.userData.headlights?.forEach((headlight, headlightIndex) => {
        if (headlight.material?.opacity !== undefined) headlight.material.opacity = 0.58 + Math.sin(time * 4 + headlightIndex) * 0.12;
      });
    });
    batches.rims.count = collectibleCount;
    batches.rims.instanceMatrix.needsUpdate = true;
    batches.hearts.count = collectibleCount;
    batches.hearts.instanceMatrix.needsUpdate = true;
    batches.glows.geometry.setDrawRange(0, collectibleCount);
    batches.glows.geometry.attributes.position.needsUpdate = true;
    batches.glows.material.opacity = 0.32 + Math.sin(time * 4.8) * 0.07;
    batches.glows.material.size = 0.36 + (this.powerupStrengths?.magnet || 0) * 0.08;
    batches.pickupTrail.geometry.setDrawRange(0, collectibleCount * 2);
    batches.pickupTrail.geometry.attributes.position.needsUpdate = true;
    batches.pickupTrail.material.size = 0.14 + (this.powerupStrengths?.magnet || 0) * 0.07;
    this.storyFocusTarget = storyFocusTarget;
    this.entityObjects.forEach((object, id) => {
      if (activeIds.has(id)) return;
      this.recycleEntity(object);
      this.entityObjects.delete(id);
    });
  }

  updateWeather(delta, time, speed, combo) {
    const config = STAGE_CONFIGS[this.stageIndex];
    const rainy = config.weather === "rain" || config.weather === "storm" || config.weather === "after-rain";
    const targetRain = config.weather === "storm" ? 0.56 : config.weather === "rain" ? 0.38 : config.weather === "after-rain" ? 0.045 : 0;
    this.rain.material.opacity = damp(this.rain.material.opacity, targetRain, 3.5, delta);
    if (rainy) {
      const positions = this.rain.geometry.attributes.position.array;
      const fall = (config.weather === "storm" ? 18 : 13) * delta;
      for (let index = 0; index < positions.length; index += 6) {
        positions[index + 1] -= fall;
        positions[index + 4] -= fall;
        positions[index] -= (config.weather === "storm" ? 3.2 : 0.7) * delta;
        positions[index + 3] -= (config.weather === "storm" ? 3.2 : 0.7) * delta;
        if (positions[index + 1] < 0.1) {
          const lift = 12 + ((index * 17) % 30) / 10;
          positions[index + 1] += lift;
          positions[index + 4] += lift;
        }
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }
    const ambientTarget = config.weather === "storm" ? 0.08 : config.weather === "rain" ? 0.12 : config.weather === "starlight" ? 0.74 : 0.32;
    this.ambientParticles.material.opacity = damp(this.ambientParticles.material.opacity, ambientTarget, 2.8, delta);
    this.ambientParticles.material.size = config.weather === "starlight" ? 0.2 : 0.11;
    this.ambientParticles.rotation.y = time * 0.012;
    this.ambientParticles.position.y = Math.sin(time * 0.24) * 0.28;
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
      if (["flower", "plant"].includes(this.storyWorldState.kind)) {
        this.ambientParticles.material.size = Math.max(this.ambientParticles.material.size, 0.2 + this.storyWorldInfluence * 0.08);
      }
    }
  }

  updateDistrictWorld(delta, time, distance, speed) {
    const config = STAGE_CONFIGS[this.stageIndex];
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
    this.ambientTrains.forEach((train, index) => {
      const direction = index ? 1 : -1;
      train.position.z += delta * speed * (index ? 0.72 : 1.02);
      train.position.y = 0.04 + Math.sin(time * 4.4 + index) * 0.012;
      if (train.position.z > 15) train.position.z = -92 - index * 24;
      train.rotation.y = direction > 0 ? 0 : Math.PI;
      train.visible = config.routeStyle === "metro" || config.routeStyle === "terminal";
    });
    const nightFactor = ["neon", "rain", "storm", "starlight"].includes(config.weather) ? 1 : 0.72;
    if (windowLights) windowLights.material.size = 0.24 + nightFactor * 0.1;
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
    this.bursts = this.bursts.filter((burst) => {
      burst.life -= delta;
      const positions = burst.points.geometry.attributes.position.array;
      for (let index = 0; index < positions.length / 3; index += 1) {
        positions[index * 3] += burst.velocities[index * 3] * delta;
        positions[index * 3 + 1] += burst.velocities[index * 3 + 1] * delta;
        positions[index * 3 + 2] += burst.velocities[index * 3 + 2] * delta;
        burst.velocities[index * 3 + 1] -= 1.2 * delta;
      }
      burst.points.geometry.attributes.position.needsUpdate = true;
      burst.points.material.opacity = clamp(burst.life / burst.duration, 0, 1);
      burst.points.material.size = 0.12 + (1 - burst.life / burst.duration) * 0.08;
      if (burst.life > 0) return true;
      this.scene.remove(burst.points);
      burst.points.geometry.dispose();
      burst.points.material.dispose();
      return false;
    });
    this.rings = this.rings.filter((ring) => {
      ring.life -= delta;
      const progress = 1 - clamp(ring.life / ring.duration, 0, 1);
      ring.mesh.scale.setScalar(0.65 + progress * 2.15);
      ring.mesh.material.opacity = (1 - progress) * 0.82;
      ring.mesh.rotation.z += delta * ring.spin;
      if (ring.life > 0) return true;
      this.scene.remove(ring.mesh);
      ring.mesh.geometry.dispose();
      ring.mesh.material.dispose();
      return false;
    });
  }

  spawnPickupSequence(detail) {
    if (!detail?.item) return;
    const color = storyPropColor(detail.item, STAGE_CONFIGS[this.stageIndex].accent);
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
    this.pickupSequences = this.pickupSequences.filter((sequence) => {
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
      if (ratio < 1) return true;
      this.scene.remove(sequence.prop, sequence.aura, sequence.bridge);
      disposeObject(sequence.prop);
      disposeObject(sequence.aura);
      disposeObject(sequence.bridge);
      return false;
    });
  }

  carry(item) {
    if (!item?.id || this.carriedItems.some((entry) => entry.item.id === item.id)) return;
    const prop = createStoryProp(item, STAGE_CONFIGS[this.stageIndex].accent, null, true);
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
    this.arrivalSet = createRendezvousSet(data.stageIndex, STAGE_CONFIGS[data.stageIndex].accent, data.items);
    this.scene.add(this.arrivalSet);
    this.arrivalBackdropMaterial.map = this.arrivalStageTextures[data.stageIndex] || this.stageTextures[data.stageIndex] || null;
    this.arrivalBackdropMaterial.opacity = 0;
    this.arrivalBackdropMaterial.needsUpdate = true;
    this.arrivalBackdrop.visible = true;
    this.companion.visible = true;
    this.flash = Math.max(this.flash, 0.16);
    this.flashMaterial.color.setHex(STAGE_CONFIGS[data.stageIndex].accent);
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
      this.flashMaterial.color.setHex(STAGE_CONFIGS[this.stageIndex].accent);
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
    const storyColor = detail.item ? storyPropColor(detail.item, STAGE_CONFIGS[this.stageIndex].accent) : STAGE_CONFIGS[this.stageIndex].accent;
    const count = type === "story-pickup" ? 54 : type === "perfect" ? 38 : type === "near-miss" ? 32 : type === "miss" ? 34 : type === "energy" ? 16 : 20;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
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
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pointMaterial = new THREE.PointsMaterial({
      map: this.particleTexture,
      color: type === "story-pickup" ? storyColor : STAGE_CONFIGS[this.stageIndex].accent,
      size: 0.16,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geometry, pointMaterial);
    const effectX = (detail.lane || 0) * LANE_WIDTH;
    const effectZ = PLAYER_Z + (COLLISION_Z - (detail.z || COLLISION_Z)) * WORLD_Z_SCALE;
    points.position.set(effectX, type === "dodge" ? 0.75 : 1.25, effectZ);
    this.scene.add(points);
    this.bursts.push({ points, velocities, life: 0.85, duration: 0.85 });
    if (["dodge", "near-miss", "perfect", "story-pickup", "energy"].includes(type)) {
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: type === "near-miss" ? 0xffd169 : type === "story-pickup" ? storyColor : type === "energy" ? 0xf9ef9a : STAGE_CONFIGS[this.stageIndex].accent,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const ring = mesh(new THREE.TorusGeometry(0.45, 0.035, 8, 36), ringMaterial);
      ring.position.set(effectX, type === "dodge" ? 0.72 : 1.2, effectZ);
      ring.rotation.x = Math.PI / 2;
      this.scene.add(ring);
      this.rings.push({ mesh: ring, life: 0.48, duration: 0.48, spin: type === "near-miss" ? 4 : 1.6 });
      if (type === "story-pickup") {
        const orbit = mesh(new THREE.TorusGeometry(0.7, 0.026, 8, 44), ringMaterial.clone());
        orbit.position.copy(ring.position);
        orbit.rotation.set(Math.PI / 2 + 0.4, 0.55, 0.2);
        this.scene.add(orbit);
        this.rings.push({ mesh: orbit, life: 0.66, duration: 0.66, spin: -2.4 });
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
    this.qualityElapsed += delta;
    this.stageElapsed += delta;
    if (frame.stageIndex !== this.stageIndex) this.setStage(frame.stageIndex);
    if (Number.isFinite(Number(frame.routePhase)) && Number(frame.routePhase) !== this.routePhase) this.setRoutePhase(frame.routePhase);
    if (frame.arrival && !this.arrivalData) this.beginArrival(frame.arrival);
    if (!frame.arrival && this.arrivalData && frame.mode !== "arrival") this.endArrival();
    const motion = frame.motion || {};
    const runState = frame.runState || {};
    const speed = Number(motion.speed) || 10.5;
    const distance = Number(motion.distance) || 0;
    this.syncPowerupState(motion.powerups, delta);
    const introDistance = frame.mode === "intro" ? time * 5.2 : 0;
    this.currentDistance = distance + introDistance;
    this.syncRoad(this.currentDistance);
    this.syncEntities(motion.entities || [], time);

    const arriving = frame.mode === "arrival" && Boolean(frame.arrival);
    const arrivalProgress = arriving ? clamp(Number(frame.arrival.progress) || 0, 0, 1) : 0;
    this.arrivalProgress = arrivalProgress;
    const arrivalEase = arrivalProgress * arrivalProgress * (3 - arrivalProgress * 2);
    this.roadGroup.visible = !arriving;
    this.ground.visible = !arriving;
    this.backdrops.forEach((backdrop) => { backdrop.visible = !arriving; });
    this.arrivalBackdrop.visible = arriving;
    this.arrivalBackdropMaterial.opacity = arriving ? Math.min(0.86, arrivalProgress * 2.4) : 0;
    this.arrivalBackdrop.scale.setScalar(arriving ? 1.035 - arrivalEase * 0.055 : 1);
    this.arrivalBackdrop.position.x = arriving ? Math.sin(arrivalProgress * Math.PI) * (this.stageIndex % 2 ? -0.24 : 0.24) : 0;
    const lanePosition = Number.isFinite(Number(motion.lanePosition)) ? Number(motion.lanePosition) : Number(motion.lane) || 0;
    const targetPlayerX = arriving ? -0.66 : lanePosition * LANE_WIDTH;
    this.previousLaneX = this.currentLaneX;
    this.currentLaneX = damp(this.currentLaneX, targetPlayerX, arriving ? 4.8 : 28, delta);
    this.lateralVelocity = damp(this.lateralVelocity, (this.currentLaneX - this.previousLaneX) / Math.max(delta, 1 / 120) / LANE_WIDTH, 18, delta);
    this.player.position.x = this.currentLaneX;
    this.player.position.z = arriving ? damp(this.player.position.z, -0.12, 2.8, delta) : PLAYER_Z;
    const stumble = clamp((Number(motion.stumbleTime) || 0) / 0.62, 0, 1);
    const vertical = Number(motion.vertical) || 0;
    if (this.previousVertical > 0.16 && vertical <= 0.025 && motion.action !== "jump") {
      this.landingPulse = 1;
      this.shake = Math.max(this.shake, 0.12);
    }
    this.previousVertical = vertical;
    const playerAction = arriving && arrivalProgress > 0.26 ? "idle" : motion.action || "run";
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

    const config = STAGE_CONFIGS[this.stageIndex];
    this.companion.visible = arriving;
    if (arriving) {
      const meetingX = 0.66;
      const meetingZ = -0.2;
      this.companion.position.x = damp(this.companion.position.x, meetingX, 5.2, delta);
      this.companion.position.z = damp(this.companion.position.z, meetingZ, 5.2, delta);
      this.player.rotation.y = damp(this.player.rotation.y, Math.PI * 1.32, 4.6, delta);
      this.companion.rotation.y = damp(this.companion.rotation.y, Math.PI * 0.68, 4.6, delta);
      if (this.companion.userData.modelRunner) animateRiggedRunner(this.companion, delta, "idle", 0, 0.1, 0, 0);
      else animateCharacter(this.companion, time, "idle", 0, 0.04, 1.2, 0, 0);
      this.arrivalSet?.userData.animated?.forEach((light, index) => {
        if (light.material?.emissiveIntensity !== undefined) light.material.emissiveIntensity = 2.2 + Math.sin(time * 2.8 + index) * 0.8;
        if (light.material?.opacity !== undefined) light.material.opacity = 0.68 + Math.sin(time * 2.1 + index) * 0.12;
      });
      if (this.arrivalSet?.userData.keyLight) this.arrivalSet.userData.keyLight.intensity = 8 + Math.sin(time * 1.4) * 1.5;
      const itemDisplay = this.arrivalSet?.userData.itemDisplay;
      itemDisplay?.userData.entries?.forEach((entry, index) => {
        const reveal = clamp((arrivalProgress - 0.4 - entry.revealOrder * 0.055) / 0.18, 0, 1);
        const bounce = 1 + Math.sin(reveal * Math.PI) * 0.22;
        const baseScale = entry.item.kind === "umbrella" ? 0.78 : entry.item.kind === "flower" ? 0.72 : 0.62;
        entry.prop.scale.setScalar(Math.max(0.001, reveal * baseScale * bounce));
        entry.prop.rotation.y += delta * (0.18 + index * 0.06);
        entry.halo.scale.setScalar(Math.max(0.001, reveal * (1.2 + index * 0.08)));
        entry.halo.material.opacity = reveal * (0.22 + Math.sin(time * 2.8 + index) * 0.08);
      });
      if (itemDisplay?.userData.handoffArc) {
        itemDisplay.userData.handoffArc.material.opacity = Math.sin(clamp((arrivalProgress - 0.22) / 0.52, 0, 1) * Math.PI) * 0.66;
      }
      if (itemDisplay?.userData.sparkles) {
        itemDisplay.userData.sparkles.material.opacity = clamp((arrivalProgress - 0.38) * 2.6, 0, 0.72) * (0.78 + Math.sin(time * 2.3) * 0.18);
        itemDisplay.userData.sparkles.rotation.y = time * 0.12;
      }
      if (itemDisplay?.userData.interactionFx) {
        const fxReveal = clamp((arrivalProgress - 0.42) / 0.2, 0, 1);
        const cameraPulse = ["camera", "photo"].includes(itemDisplay.userData.featuredKind)
          ? Math.max(0, 1 - Math.abs(fxReveal - 0.45) * 2.2)
          : 0.72 + Math.sin(time * 3.1) * 0.18;
        itemDisplay.userData.fxMaterials.forEach((entry) => {
          entry.material.opacity = fxReveal * entry.maxOpacity * cameraPulse;
        });
        itemDisplay.userData.interactionFx.scale.setScalar(0.82 + fxReveal * 0.18);
        itemDisplay.userData.interactionFx.rotation.z = ["record", "wristband", "key", "lamp"].includes(itemDisplay.userData.featuredKind)
          ? time * 0.18
          : Math.sin(time * 0.8) * 0.025;
        if (itemDisplay.userData.fxLight) itemDisplay.userData.fxLight.intensity = fxReveal * (5.5 + Math.sin(time * 3.2) * 1.2);
      }
    } else {
      this.player.rotation.y = damp(this.player.rotation.y, 0, 8, delta);
    }

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

    const cameraTargetX = arriving ? (this.stageIndex % 2 ? -1.15 : 1.15) * arrivalEase : this.currentLaneX * 0.42 + (this.stageIndex >= 4 ? 0.08 : 0);
    const cameraBob = frame.mode === "playing" ? Math.sin(time * (9.2 + speed * 0.12)) * (0.025 + this.flow * 0.018) : Math.sin(time * 0.8) * 0.018;
    const shakeX = (Math.sin(time * 83) + Math.sin(time * 41)) * this.shake * 0.07;
    const shakeY = Math.sin(time * 67) * this.shake * 0.055;
    this.camera.position.x = damp(this.camera.position.x, cameraTargetX, arriving ? 2.8 : 6, delta) + shakeX;
    this.camera.position.y = damp(this.camera.position.y, arriving ? 3.78 + cameraBob : 5.16 + cameraBob - (motion.action === "slide" ? 0.2 : 0) - this.flow * 0.08, arriving ? 3.2 : 9, delta) + shakeY;
    this.camera.position.z = damp(
      this.camera.position.z,
      arriving ? 8.4 : motion.action === "slide" ? 10.86 : 10.42 + this.flow * 0.28 - this.powerupStrengths.overdrive * 0.42,
      arriving ? 2.8 : 6.5,
      delta
    );
    this.camera.fov = damp(
      this.camera.fov,
      arriving
        ? 52
        : 58.5 + clamp((speed - 10) * 0.48, 0, 7.4) + this.speedPulse * 1.8 + this.flow * 4.6
          + this.storyFocus * 1.35 + this.powerupStrengths.overdrive * 1.8 + this.synergyInfluence * 1.2,
      arriving ? 3 : 6,
      delta
    );
    this.camera.updateProjectionMatrix();
    if (arriving) this.camera.lookAt(0.02, 1.38, -0.72);
    else {
      this.camera.lookAt(this.currentLaneX * 0.34, 0.62, -15.8 - this.flow * 3.2 - this.powerupStrengths.overdrive * 1.4);
      this.camera.rotation.z += clamp(-this.lateralVelocity * (0.018 + this.flow * 0.012), -0.075, 0.075);
    }
    this.shake = Math.max(0, this.shake - delta * 2.8);
    this.flash = Math.max(0, this.flash - delta * 1.8);
    this.flashMaterial.opacity = this.flash;
    this.speedPulse = Math.max(0, this.speedPulse - delta * 2.4);

    this.scene.background.lerp(this.targetBackground, 1 - Math.exp(-2.2 * delta));
    this.scene.fog.color.lerp(this.targetFog, 1 - Math.exp(-2.2 * delta));
    this.scene.fog.density = damp(this.scene.fog.density, this.targetFogDensity, 2.5, delta);
    const itemPulseStrength = this.itemPulse ? clamp(this.itemPulse.life / this.itemPulse.duration, 0, 1) : 0;
    this.renderer.toneMappingExposure = damp(
      this.renderer.toneMappingExposure,
      this.targetExposure + this.flow * 0.08 + itemPulseStrength * 0.045 + this.synergyInfluence * 0.12,
      2.8,
      delta
    );
    this.keyLight.intensity = (arriving ? 2.35 : config.weather === "storm" && time % 8.8 < 0.1 ? 8.5 : 3.15) + this.synergyInfluence * 4.5;
    this.warmLight.intensity = arriving
      ? 7.5
      : (this.stageIndex >= 3 ? 21 : 14) + this.flow * 8 + itemPulseStrength * 12 + this.storyFocus * 6
        + this.storyWorldInfluence * 6 + this.synergyInfluence * 8;
    if (this.itemPulse) this.warmLight.color.lerp(new THREE.Color(this.itemPulse.color), 1 - Math.exp(-8 * delta));
    else this.warmLight.color.lerp(new THREE.Color(config.accent), 1 - Math.exp(-4 * delta));
    this.runnerFillLight.intensity = arriving ? 4.8 : 8.5 + this.flow * 4.5;
    this.warmLight.position.x = Math.sin(time * 0.18) * 2;

    this.updateDistrictWorld(delta, time, this.currentDistance, speed);
    this.updateWeather(delta, time, speed, Number(runState.combo) || 0);
    if (this.itemPulse) {
      const pulse = clamp(this.itemPulse.life / this.itemPulse.duration, 0, 1);
      if (this.itemPulse.kind === "umbrella") this.rain.material.opacity *= 1 - pulse * 0.68;
      if (["record", "wristband"].includes(this.itemPulse.kind)) {
        this.ambientParticles.scale.setScalar(1 + Math.sin(time * 8) * pulse * 0.18);
        this.speedStreaks.material.opacity = Math.min(0.82, this.speedStreaks.material.opacity + pulse * 0.15);
      } else this.ambientParticles.scale.setScalar(1);
      if (["key", "lamp"].includes(this.itemPulse.kind)) {
        this.powerRailMaterial.emissiveIntensity = 0.16 + pulse * 2.4;
        this.laneGuideMaterial.emissiveIntensity = 0.28 + pulse * 1.8;
      }
      if (["flower", "plant"].includes(this.itemPulse.kind)) this.ambientParticles.material.size = Math.max(this.ambientParticles.material.size, 0.16 + pulse * 0.1);
    } else {
      this.ambientParticles.scale.setScalar(1);
      this.powerRailMaterial.emissiveIntensity = damp(this.powerRailMaterial.emissiveIntensity, 0.16, 4, delta);
      this.laneGuideMaterial.emissiveIntensity = damp(this.laneGuideMaterial.emissiveIntensity, 0.28, 4, delta);
    }
    if (arriving) {
      this.metroDistricts.forEach((district) => { district.visible = false; });
      this.premiumDistricts?.forEach((district) => { district.visible = false; });
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
    return this.snapshot();
  }

  snapshot() {
    return {
      ready: true,
      stageIndex: this.stageIndex,
      webgl: true,
      pixelRatio: this.pixelRatio || 1,
      width: this.canvas.width,
      height: this.canvas.height,
      entities: this.entityObjects.size,
      bursts: this.bursts.length,
      rings: this.rings.length,
      pickupSequences: this.pickupSequences.length,
      flow: this.flow,
      storyFocus: this.storyFocus,
      powerups: { ...this.powerupStrengths },
      storyWorld: this.storyWorldInfluence,
      synergy: this.synergyInfluence,
      pooledPowerupEffects: this.powerupEffectPool.filter((slot) => slot.life > 0).length,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      rainOpacity: this.rain.material.opacity,
      carriedItems: this.carriedItems.map((entry) => entry.item.id),
      rendezvousVisible: this.companion.visible,
      arrivalProgress: this.arrivalProgress,
      routePhase: this.routePhase
    };
  }

  dispose() {
    this.disposed = true;
    this.endArrival();
    this.clearCarry();
    this.pickupSequences.forEach((sequence) => {
      this.scene.remove(sequence.prop, sequence.aura, sequence.bridge);
      disposeObject(sequence.prop);
      disposeObject(sequence.aura);
      disposeObject(sequence.bridge);
    });
    this.pickupSequences.length = 0;
    this.entityObjects.forEach((object) => disposeObject(object));
    this.entityPool.forEach((bucket) => bucket.forEach((object) => disposeObject(object)));
    this.scene.remove(this.powerupVisuals.root);
    disposeObject(this.powerupVisuals.root);
    this.renderer.dispose();
    this.roadTexture.dispose();
    this.platformTexture.dispose();
    this.particleTexture.dispose();
    this.environmentTexture.dispose();
    this.stageTextures.forEach((texture) => texture?.dispose());
    this.arrivalStageTextures.forEach((texture) => texture?.dispose());
  }
}

const api = Object.freeze({
  version: "three-0.185.1-rendezvous-runner-v2",
  stageAssets: Object.freeze(STAGE_CONFIGS.map((stage) => stage.asset)),
  create(canvas) {
    return new CinematicRunnerRenderer(canvas);
  }
});

window.RunnerLoveVisuals = api;
window.dispatchEvent(new Event("runner-love-visuals-ready"));
