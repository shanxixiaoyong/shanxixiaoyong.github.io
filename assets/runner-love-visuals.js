import * as THREE from "./vendor/three-0.185.1.module.min.js";
import { GLTFLoader } from "./vendor/three-addons/GLTFLoader.js";

const STAGE_CONFIGS = Object.freeze([
  {
    id: "first-sight",
    district: "campus-line",
    asset: "assets/runner-scenes/01-encounter.jpg",
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
    props: ["campus", "lamp", "signal", "graffiti"],
    companion: { x: -2.7, z: -19 }
  },
  {
    id: "familiar-steps",
    district: "glass-station",
    asset: "assets/runner-scenes/02-familiar.jpg",
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
    props: ["station", "railing", "bench", "tree"],
    companion: { x: 2.35, z: -6.5 }
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
    props: ["building", "cafe", "neon-sign", "signal"],
    companion: { x: 2.15, z: -2.7 }
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
    props: ["tunnel", "lamp", "shelter", "graffiti"],
    companion: { x: 1.95, z: -1 }
  },
  {
    id: "shared-days",
    district: "home-quarter",
    asset: "assets/runner-scenes/02-familiar.jpg",
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
    props: ["market", "station", "home", "tree"],
    companion: { x: 1.82, z: 0 }
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
    props: ["maintenance", "warning", "signal", "tunnel"],
    companion: { x: 2.45, z: -1.2 }
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
    props: ["terminal", "home", "lamp", "tree"],
    companion: { x: 1.55, z: 0.25 }
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
const BACKDROP_OPACITY = 0.055;
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function damp(current, target, smoothing, delta) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * delta));
}

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
  geometries.forEach((item) => item.dispose?.());
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
  roundedGeometryCache.set(key, geometry);
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
  return heartGeometry;
}

function createStageTokenGeometry(stageIndex) {
  if (stageTokenGeometryCache.has(stageIndex)) return stageTokenGeometryCache.get(stageIndex);
  if (stageIndex === 0) {
    const geometry = createHeartGeometry().clone();
    geometry.scale(0.52, 0.52, 0.72);
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
  stageTokenGeometryCache.set(stageIndex, geometry);
  return geometry;
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

  if (action === "jump") {
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

function createRiggedRunner(gltf, options, animationClips = gltf.animations) {
  const wrapper = new THREE.Group();
  const model = gltf.scene;
  model.rotation.y = Math.PI;
  model.traverse((child) => {
    if (child.name === "Sword") child.visible = false;
    if (!child.isMesh && !child.isSkinnedMesh) return;
    child.geometry = smoothGeometryNormals(child.geometry);
    child.castShadow = true;
    child.receiveShadow = true;
    if (child.material) {
      child.material = child.material.clone();
      const materialName = child.material.name || "";
      options.recolor?.forEach(([pattern, color]) => {
        if (pattern.test(materialName)) child.material.color.setHex(color);
      });
      child.material.roughness = Math.max(0.38, child.material.roughness ?? 0.58);
      child.material.metalness = Math.min(0.26, child.material.metalness ?? 0.08);
    }
  });
  const initialBox = new THREE.Box3().setFromObject(model);
  const naturalHeight = Math.max(0.01, initialBox.max.y - initialBox.min.y);
  model.scale.setScalar((options.height || 2.72) / naturalHeight);
  const scaledBox = new THREE.Box3().setFromObject(model);
  model.position.y = -scaledBox.min.y;
  wrapper.add(model);

  if (options.backpack) {
    const packMaterial = material(options.backpack, { roughness: 0.38, metalness: 0.08 });
    const trimMaterial = material(options.backpackTrim || 0xffd04f, {
      emissive: options.backpackTrim || 0xffd04f,
      emissiveIntensity: 0.38,
      roughness: 0.24
    });
    const backpack = mesh(roundedPanelGeometry(0.58, 0.72, 0.25, 0.13), packMaterial, true);
    backpack.position.set(0, 1.5, 0.28);
    const patch = mesh(roundedPanelGeometry(0.34, 0.18, 0.035, 0.06), trimMaterial, true);
    patch.position.set(0, 1.56, 0.425);
    wrapper.add(backpack, patch);
    wrapper.userData.backpack = backpack;
  }

  const shadow = mesh(
    new THREE.CircleGeometry(0.58, 28),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.27, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.018;
  wrapper.add(shadow);

  const mixer = new THREE.AnimationMixer(model);
  const availableTargets = new Set();
  model.traverse((child) => availableTargets.add(THREE.PropertyBinding.sanitizeNodeName(child.name)));
  const findClip = (suffix) => {
    const sourceClip = animationClips.find((clip) => clip.name.endsWith(`|${suffix}`));
    const clip = sourceClip.clone();
    clip.tracks = clip.tracks.filter((track) => {
      const target = track.name.split(".", 1)[0];
      return !["Body", "PTL", "PTR"].includes(target) && availableTargets.has(target);
    });
    return clip;
  };
  const actions = {
    idle: mixer.clipAction(findClip("Idle_Neutral")),
    run: mixer.clipAction(findClip("Run")),
    slide: mixer.clipAction(findClip("Roll")),
    stumble: mixer.clipAction(findClip("HitRecieve"))
  };
  Object.values(actions).forEach((runnerAction) => {
    runnerAction.enabled = true;
    runnerAction.setEffectiveWeight(1);
  });
  actions.run.play();
  wrapper.userData.modelRunner = { model, mixer, actions, currentAction: "run", shadow };
  return wrapper;
}

function animateRiggedRunner(character, delta, action, vertical, intensity, lateral = 0, stumble = 0) {
  const runner = character.userData.modelRunner;
  const nextAction = stumble > 0.15 ? "stumble" : action === "slide" ? "slide" : "run";
  if (nextAction !== runner.currentAction) {
    const previous = runner.actions[runner.currentAction];
    const next = runner.actions[nextAction];
    previous?.fadeOut(0.12);
    next?.reset().fadeIn(0.12).play();
    runner.currentAction = nextAction;
  }
  runner.actions.run.setEffectiveTimeScale(clamp(0.82 + intensity * 0.22, 0.9, 1.45));
  runner.actions.slide.setEffectiveTimeScale(1.18);
  runner.mixer.update(delta);
  character.position.y = vertical * 0.72 + (action === "slide" ? 0.03 : 0);
  character.rotation.x = action === "slide" ? -0.05 : 0.035;
  character.rotation.z = clamp(-lateral * 0.09, -0.16, 0.16);
  runner.shadow.material.opacity = clamp(0.27 - vertical * 0.11, 0.08, 0.27);
  runner.shadow.scale.setScalar(1 + vertical * 0.24);
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

function createCompanionCue(cue, accent) {
  const group = new THREE.Group();
  const cueMaterial = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  if (cue === "jump") {
    const arc = mesh(new THREE.TorusGeometry(0.58, 0.055, 8, 30, Math.PI), cueMaterial);
    arc.rotation.z = Math.PI;
    arc.position.y = 0.34;
    group.add(arc);
  } else {
    const ribbon = mesh(new THREE.PlaneGeometry(1.35, 0.18), cueMaterial);
    ribbon.rotation.x = -Math.PI / 2;
    ribbon.position.y = 0.04;
    group.add(ribbon);
  }
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
    this.scene.add(this.playerTrail, this.landingRing, this.player, this.companion);

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
          height: 2.86,
          recolor: [[/Red_Dark/i, 0x202c47], [/LightBlue/i, 0x1466a8], [/White/i, 0xff6347]],
          backpack: 0x163f72,
          backpackTrim: 0xffd34e
        }, motionGltf.animations);
        const riggedCompanion = createRiggedRunner(companionGltf, {
          height: 2.68,
          recolor: [[/Orange/i, 0xffbd4a], [/Grey/i, 0x58418e], [/White/i, 0xff5f88]]
        }, motionGltf.animations);
        riggedPlayer.position.copy(this.player.position);
        riggedCompanion.position.copy(this.companion.position);
        this.fallbackPlayer = this.player;
        this.fallbackCompanion = this.companion;
        this.scene.remove(this.player, this.companion);
        this.player = riggedPlayer;
        this.companion = riggedCompanion;
        this.scene.add(this.player, this.companion);
        this.canvas.setAttribute("data-runner-model", "rigged");
      })
      .catch(() => {
        this.canvas.setAttribute("data-runner-model", "procedural-fallback");
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
      safetyLines: new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.025, SEGMENT_LENGTH), this.safetyLineMaterial, SEGMENT_COUNT * 2)
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
    });
    Object.values(this.roadBatches).forEach((batch) => {
      batch.instanceMatrix.needsUpdate = true;
    });
  }

  rebuildDecor() {
    const config = STAGE_CONFIGS[this.stageIndex];
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
          const type = tracksideProps[(index + sideIndex * 2) % tracksideProps.length];
          const prop = createProp(type, config.accent, index * 7 + sideIndex * 3 + this.stageIndex);
          const compact = ["lamp", "signal", "tree", "bench", "warning"].includes(type);
          prop.scale.setScalar(compact ? 0.86 : 0.74 + (index % 3) * 0.035);
          prop.position.set(side * (5.95 + (index % 3) * 0.28), 0.18, sideIndex ? -2.8 : 2.4);
          prop.rotation.y = type === "railing" ? 0 : side < 0 ? Math.PI / 2 : -Math.PI / 2;
          decor.add(prop);
        });
      }
      if (index % 6 === 0) {
        const gantry = createGantry(config.accent, this.stageIndex === 5);
        gantry.position.z = -4.8;
        decor.add(gantry);
      }
      if (index < 10 && index % 5 === 4) {
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

  preloadBackdrops() {
    STAGE_CONFIGS.forEach((config, index) => {
      this.textureLoader.load(config.asset, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        const imageAspect = texture.image.width / texture.image.height;
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
    this.groundMaterial.color.setHex(config.ground);
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
    const signature = `${this.stageIndex}:${entity.type}:${entity.subtype || entity.avoid || entity.cue || "default"}:${Number(entity.variant) % 2}`;
    const bucket = this.entityPool.get(signature);
    let object = bucket?.pop();
    if (!object) {
      if (entity.type === "collectible") object = createCollectible(this.stageIndex, config.accent, this.particleTexture);
      else if (entity.type === "obstacle") object = createObstacle(this.stageIndex, entity.avoid, config.accent, entity.subtype, entity.variant);
      else object = createCompanionCue(entity.cue, config.accent);
      object.userData.poolKey = signature;
      object.userData.sharedTexture = entity.type === "collectible" ? this.particleTexture : null;
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
    entities.forEach((entity) => {
      if (!entity.active) return;
      if (entity.type === "collectible") {
        if (collectibleCount >= batches.capacity) return;
        const x = entity.lane * LANE_WIDTH;
        const z = PLAYER_Z + (COLLISION_Z - entity.z) * WORLD_Z_SCALE;
        const y = 1.12 + (Number(entity.height) || 0) + Math.sin(time * 4.5 + entity.id) * 0.1;
        this.collectiblePosition.set(x, y, z);
        this.collectibleEuler.set(0, Math.sin(time * 1.7 + entity.id) * 0.18, Math.sin(time * 1.2 + entity.id) * 0.08);
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
      object.position.y = 0;
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
    batches.pickupTrail.geometry.setDrawRange(0, collectibleCount * 2);
    batches.pickupTrail.geometry.attributes.position.needsUpdate = true;
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
    const streakTarget = clamp((speed - 11) / 17 + combo * 0.025 + this.speedPulse * 0.28, 0, 0.42);
    this.speedStreaks.material.opacity = damp(this.speedStreaks.material.opacity, streakTarget, 5, delta);
    this.speedStreaks.position.z = (time * speed * 0.85) % 8;
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
      train.visible = this.stageIndex > 0 || index === 0;
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

  effect(type, detail = {}) {
    if (type === "miss") {
      this.shake = Math.max(this.shake, 0.82);
      this.flash = Math.max(this.flash, 0.34);
      this.flashMaterial.color.setHex(0xff5d58);
      return;
    }
    if (type === "stage") {
      this.flash = Math.max(this.flash, 0.5);
      this.flashMaterial.color.setHex(STAGE_CONFIGS[this.stageIndex].accent);
      return;
    }
    if (type === "near-miss") {
      this.shake = Math.max(this.shake, 0.26);
      this.speedPulse = Math.max(this.speedPulse, 1);
    } else if (type === "dodge") {
      this.speedPulse = Math.max(this.speedPulse, 0.62);
    }
    const count = type === "perfect" || type === "companion-sync" ? 34 : type === "near-miss" ? 26 : 20;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const angle = index / count * Math.PI * 2;
      const spread = 0.35 + (index % 5) * 0.08;
      positions[index * 3] = 0;
      positions[index * 3 + 1] = 0;
      positions[index * 3 + 2] = 0;
      velocities[index * 3] = Math.cos(angle) * spread;
      velocities[index * 3 + 1] = 0.55 + (index % 7) * 0.09;
      velocities[index * 3 + 2] = Math.sin(angle) * spread;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pointMaterial = new THREE.PointsMaterial({
      map: this.particleTexture,
      color: type === "companion-sync" ? 0x9ff1df : STAGE_CONFIGS[this.stageIndex].accent,
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
    if (["dodge", "near-miss", "perfect", "companion-sync"].includes(type)) {
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: type === "near-miss" ? 0xffd169 : type === "companion-sync" ? 0x9ff1df : STAGE_CONFIGS[this.stageIndex].accent,
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
    }
  }

  render(frame = {}) {
    const time = Number(frame.time) || 0;
    const delta = clamp(this.lastTime ? time - this.lastTime : 1 / 60, 1 / 240, 0.05);
    this.lastTime = time;
    this.frameAverage = damp(this.frameAverage, delta, 1.5, delta);
    this.qualityElapsed += delta;
    this.stageElapsed += delta;
    if (frame.stageIndex !== this.stageIndex) this.setStage(frame.stageIndex);
    const motion = frame.motion || {};
    const runState = frame.runState || {};
    const speed = Number(motion.speed) || 10.5;
    const distance = Number(motion.distance) || 0;
    const introDistance = frame.mode === "intro" ? time * 5.2 : 0;
    this.currentDistance = distance + introDistance;
    this.syncRoad(this.currentDistance);
    this.syncEntities(motion.entities || [], time);

    const lanePosition = Number.isFinite(Number(motion.lanePosition)) ? Number(motion.lanePosition) : Number(motion.lane) || 0;
    const targetPlayerX = lanePosition * LANE_WIDTH;
    this.previousLaneX = this.currentLaneX;
    this.currentLaneX = damp(this.currentLaneX, targetPlayerX, 28, delta);
    this.lateralVelocity = damp(this.lateralVelocity, (this.currentLaneX - this.previousLaneX) / Math.max(delta, 1 / 120) / LANE_WIDTH, 18, delta);
    this.player.position.x = this.currentLaneX;
    this.player.position.z = PLAYER_Z;
    const stumble = clamp((Number(motion.stumbleTime) || 0) / 0.62, 0, 1);
    const vertical = Number(motion.vertical) || 0;
    if (this.previousVertical > 0.16 && vertical <= 0.025 && motion.action !== "jump") {
      this.landingPulse = 1;
      this.shake = Math.max(this.shake, 0.12);
    }
    this.previousVertical = vertical;
    if (this.player.userData.modelRunner) {
      animateRiggedRunner(this.player, delta, motion.action || "run", vertical, speed / 17, this.lateralVelocity, stumble);
    } else {
      animateCharacter(this.player, time, motion.action || "run", vertical, speed / 17, 0, this.lateralVelocity, stumble);
    }
    updateRunnerFootTrail(this.playerTrail, this.player, time, speed, delta);
    this.landingPulse = Math.max(0, this.landingPulse - delta * 2.8);
    const landingProgress = 1 - this.landingPulse;
    this.landingRing.position.x = this.currentLaneX;
    this.landingRing.scale.setScalar(0.7 + landingProgress * 2.5);
    this.landingRing.material.opacity = this.landingPulse * 0.72;

    const config = STAGE_CONFIGS[this.stageIndex];
    const heartbeat = Number(runState.heartbeat) || 60;
    let companionX = config.companion.x;
    let companionZ = config.companion.z;
    if (this.stageIndex === 5) {
      const distanceFactor = clamp((72 - heartbeat) / 34, 0, 1);
      companionX += distanceFactor * 1.35;
      companionZ -= distanceFactor * 1.8;
    }
    this.companion.position.x = damp(this.companion.position.x, companionX, 2.9, delta);
    this.companion.position.z = damp(this.companion.position.z, companionZ, 2.9, delta);
    const companionCue = motion.companion?.cue?.action;
    const companionAction = companionCue === "jump" || companionCue === "slide" ? companionCue : "run";
    if (this.companion.userData.modelRunner) {
      animateRiggedRunner(this.companion, delta, companionAction, companionAction === "jump" ? 0.75 : 0, speed / 17, 0, 0);
    } else {
      animateCharacter(this.companion, time, companionAction, companionAction === "jump" ? 0.75 : 0, speed / 17, 0.9, 0, 0);
    }
    this.companion.rotation.y = this.stageIndex === 0 ? -0.08 : 0;

    const cameraTargetX = this.currentLaneX * 0.42 + (this.stageIndex >= 4 ? 0.08 : 0);
    const cameraBob = frame.mode === "playing" ? Math.sin(time * 8.5) * 0.026 : Math.sin(time * 0.8) * 0.018;
    const shakeX = (Math.sin(time * 83) + Math.sin(time * 41)) * this.shake * 0.07;
    const shakeY = Math.sin(time * 67) * this.shake * 0.055;
    this.camera.position.x = damp(this.camera.position.x, cameraTargetX, 6, delta) + shakeX;
    this.camera.position.y = damp(this.camera.position.y, 5.02 + cameraBob - (motion.action === "slide" ? 0.16 : 0), 8, delta) + shakeY;
    this.camera.position.z = damp(this.camera.position.z, motion.action === "slide" ? 10.02 : 9.72, 5, delta);
    this.camera.fov = damp(this.camera.fov, 57 + clamp((speed - 10) * 0.42, 0, 5.4) + this.speedPulse * 1.35, 4, delta);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.currentLaneX * 0.33, 0.58, -13.8);
    this.camera.rotation.z += clamp(-this.lateralVelocity * 0.014, -0.045, 0.045);
    this.shake = Math.max(0, this.shake - delta * 2.8);
    this.flash = Math.max(0, this.flash - delta * 1.8);
    this.flashMaterial.opacity = this.flash;
    this.speedPulse = Math.max(0, this.speedPulse - delta * 2.4);

    this.scene.background.lerp(this.targetBackground, 1 - Math.exp(-2.2 * delta));
    this.scene.fog.color.lerp(this.targetFog, 1 - Math.exp(-2.2 * delta));
    this.scene.fog.density = damp(this.scene.fog.density, this.targetFogDensity, 2.5, delta);
    this.renderer.toneMappingExposure = damp(this.renderer.toneMappingExposure, this.targetExposure, 2.2, delta);
    this.keyLight.intensity = config.weather === "storm" && time % 8.8 < 0.1 ? 8.5 : 3.15;
    this.warmLight.intensity = this.stageIndex >= 3 ? 21 : 14;
    this.warmLight.position.x = Math.sin(time * 0.18) * 2;

    this.updateDistrictWorld(delta, time, this.currentDistance, speed);
    this.updateWeather(delta, time, speed, Number(runState.combo) || 0);
    this.updateBackdrops(delta);
    this.updateBursts(delta);
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
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      rainOpacity: this.rain.material.opacity,
      companion: { x: this.companion.position.x, z: this.companion.position.z }
    };
  }

  dispose() {
    this.disposed = true;
    this.entityObjects.forEach((object) => disposeObject(object));
    this.entityPool.forEach((bucket) => bucket.forEach((object) => disposeObject(object)));
    this.renderer.dispose();
    this.roadTexture.dispose();
    this.platformTexture.dispose();
    this.particleTexture.dispose();
    this.environmentTexture.dispose();
    this.stageTextures.forEach((texture) => texture?.dispose());
  }
}

const api = Object.freeze({
  version: "three-0.185.1-cinematic-runner",
  stageAssets: Object.freeze(STAGE_CONFIGS.map((stage) => stage.asset)),
  create(canvas) {
    return new CinematicRunnerRenderer(canvas);
  }
});

window.RunnerLoveVisuals = api;
window.dispatchEvent(new Event("runner-love-visuals-ready"));
