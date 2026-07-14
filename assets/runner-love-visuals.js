import * as THREE from "./vendor/three-0.185.1.module.min.js";

const STAGE_CONFIGS = Object.freeze([
  {
    id: "first-sight",
    asset: "assets/runner-scenes/01-encounter.jpg",
    sky: 0x8ba0a0,
    fog: 0x758b85,
    fogDensity: 0.012,
    key: 0xffcf8d,
    ambient: 0xbcd7cf,
    ground: 0x1b2623,
    road: 0xa4ada8,
    curb: 0x9a9b8b,
    accent: 0xf0bd72,
    weather: "after-rain",
    props: ["campus", "lamp", "signal", "graffiti"],
    companion: { x: -2.7, z: -19 }
  },
  {
    id: "familiar-steps",
    asset: "assets/runner-scenes/02-familiar.jpg",
    sky: 0xaac5c8,
    fog: 0x91afb0,
    fogDensity: 0.009,
    key: 0xffe5ad,
    ambient: 0xd5ece6,
    ground: 0x263735,
    road: 0x9eaaa9,
    curb: 0x9baaaa,
    accent: 0x8fd6ca,
    weather: "breeze",
    props: ["station", "railing", "bench", "tree"],
    companion: { x: 2.35, z: -6.5 }
  },
  {
    id: "closer-signals",
    asset: "assets/runner-scenes/03-ambiguous.jpg",
    sky: 0x394756,
    fog: 0x314250,
    fogDensity: 0.014,
    key: 0xffa66f,
    ambient: 0x7cc7d3,
    ground: 0x171d25,
    road: 0x7f8a96,
    curb: 0x646f79,
    accent: 0x6ed6e0,
    weather: "neon",
    props: ["building", "cafe", "neon-sign", "signal"],
    companion: { x: 2.15, z: -2.7 }
  },
  {
    id: "spoken-heart",
    asset: "assets/love-scenes/rain-night.webp",
    sky: 0x263846,
    fog: 0x233846,
    fogDensity: 0.018,
    key: 0xffa777,
    ambient: 0x85aeca,
    ground: 0x141c23,
    road: 0x788991,
    curb: 0x536674,
    accent: 0xef8291,
    weather: "rain",
    props: ["tunnel", "lamp", "shelter", "graffiti"],
    companion: { x: 1.95, z: -1 }
  },
  {
    id: "shared-days",
    asset: "assets/runner-scenes/02-familiar.jpg",
    sky: 0x8e9f91,
    fog: 0x83978f,
    fogDensity: 0.008,
    key: 0xffdf9f,
    ambient: 0xd7dec4,
    ground: 0x38483c,
    road: 0x899792,
    curb: 0x8c998c,
    accent: 0xf3bd62,
    weather: "warm",
    props: ["market", "station", "home", "tree"],
    companion: { x: 1.82, z: 0 }
  },
  {
    id: "rough-weather",
    asset: "assets/love-scenes/rain-night.webp",
    sky: 0x4a525e,
    fog: 0x424b56,
    fogDensity: 0.022,
    key: 0xc3d0db,
    ambient: 0x8497ab,
    ground: 0x20262c,
    road: 0x7d858b,
    curb: 0x646b71,
    accent: 0xd85f5d,
    weather: "storm",
    props: ["maintenance", "warning", "signal", "tunnel"],
    companion: { x: 2.45, z: -1.2 }
  },
  {
    id: "toward-home",
    asset: "assets/love-scenes/starlight-vow.webp",
    sky: 0x222946,
    fog: 0x29304b,
    fogDensity: 0.008,
    key: 0xffd791,
    ambient: 0xaab7df,
    ground: 0x18212c,
    road: 0x718092,
    curb: 0x72798a,
    accent: 0xf0c46f,
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
const PLAYER_Z = 2.15;
const COLLISION_Z = 0.85;
const FOG_SCALE = 0.68;
const MAX_RENDER_PIXELS = 1_850_000;

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
    context.fillStyle = "#777b78";
    context.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 32) {
      context.fillStyle = y % 64 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.08)";
      context.fillRect(0, y, width, 2);
    }
    context.fillStyle = "#d2bb54";
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
  const leafMaterial = material(new THREE.Color(accent).lerp(new THREE.Color(0x315d49), 0.72), { roughness: 0.96 });
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
  const skin = material(options.skin, { roughness: 0.72 });
  const cloth = material(options.cloth, { roughness: 0.58 });
  const clothDark = material(options.clothDark, { roughness: 0.68 });
  const hair = material(options.hair, { roughness: 0.96 });
  const shoeMaterial = material(0xf4f0e8, { roughness: 0.42 });
  const soleMaterial = material(0x24292d, { roughness: 0.76 });
  const detailMaterial = material(options.accent || 0xf2c96d, { emissive: options.accent || 0xf2c96d, emissiveIntensity: 0.35, roughness: 0.48 });

  const pelvis = mesh(new THREE.CapsuleGeometry(0.27, 0.24, 5, 12), clothDark, true);
  pelvis.scale.set(1.04, 0.78, 0.86);
  pelvis.position.y = 0.98;
  const torso = mesh(new THREE.CapsuleGeometry(0.34, 0.48, 6, 14), cloth, true);
  torso.scale.set(options.feminine ? 0.9 : 1.02, 1, 0.82);
  torso.position.y = 1.5;
  torso.rotation.z = options.feminine ? 0.015 : -0.015;
  const neck = mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.18, 10), skin, true);
  neck.position.y = 2.02;
  const head = mesh(new THREE.SphereGeometry(0.285, 22, 18), skin, true);
  head.scale.set(0.94, 1.08, 0.96);
  head.position.y = 2.28;
  const hairCap = mesh(new THREE.SphereGeometry(0.3, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.63), hair, true);
  hairCap.position.set(0, 2.37, 0.012);
  hairCap.rotation.x = -0.08;
  root.add(pelvis, torso, neck, head, hairCap);

  const collar = mesh(new THREE.TorusGeometry(0.23, 0.045, 8, 24), clothDark, true);
  collar.scale.set(1, 0.8, 1);
  collar.position.y = 1.92;
  collar.rotation.x = Math.PI / 2;
  const hood = mesh(new THREE.TorusGeometry(0.28, 0.075, 8, 24, Math.PI * 1.55), clothDark, true);
  hood.position.set(0, 1.91, 0.17);
  hood.rotation.set(Math.PI / 2, 0, -Math.PI * 0.77);
  const backpack = mesh(new THREE.CapsuleGeometry(0.25, 0.34, 5, 12), clothDark, true);
  backpack.scale.set(0.88, 1.12, 0.42);
  backpack.position.set(0, 1.49, 0.37);
  const backpackPanel = mesh(new THREE.BoxGeometry(0.34, 0.36, 0.045), detailMaterial, true);
  backpackPanel.position.set(0, 1.47, 0.545);
  const zipper = mesh(new THREE.BoxGeometry(0.025, 0.42, 0.022), detailMaterial);
  zipper.position.set(0, 1.52, -0.293);
  root.add(collar, hood, backpack, backpackPanel, zipper);

  [-1, 1].forEach((side) => {
    const ear = mesh(new THREE.SphereGeometry(0.055, 10, 8), skin, true);
    ear.scale.set(0.58, 1, 0.66);
    ear.position.set(side * 0.272, 2.28, 0);
    root.add(ear);
    const strap = mesh(new THREE.TorusGeometry(0.33, 0.025, 6, 22, Math.PI * 0.72), detailMaterial);
    strap.position.set(side * 0.16, 1.55, 0.31);
    strap.rotation.set(Math.PI / 2, 0, side > 0 ? 1.92 : -0.35);
    root.add(strap);
  });

  const fringe = mesh(new THREE.BoxGeometry(0.38, 0.12, 0.08), hair, true);
  fringe.position.set(0, 2.48, -0.205);
  fringe.rotation.x = -0.22;
  root.add(fringe);

  if (options.feminine) {
    const ponytailPivot = new THREE.Group();
    ponytailPivot.position.set(0, 2.38, 0.19);
    const ponytail = mesh(new THREE.CapsuleGeometry(0.11, 0.3, 5, 10), hair, true);
    ponytail.position.y = -0.22;
    ponytail.rotation.z = 0.12;
    ponytailPivot.add(ponytail);
    root.add(ponytailPivot);
    root.userData.ponytail = ponytailPivot;
  }

  const leftArm = createLimb(cloth, 0.48, 0.43, 0.095);
  const rightArm = createLimb(cloth, 0.48, 0.43, 0.095);
  leftArm.position.set(-0.39, 1.8, 0);
  rightArm.position.set(0.39, 1.8, 0);
  const leftLeg = createLimb(clothDark, 0.62, 0.6, 0.13);
  const rightLeg = createLimb(clothDark, 0.62, 0.6, 0.13);
  leftLeg.position.set(-0.18, 1.02, 0);
  rightLeg.position.set(0.18, 1.02, 0);
  [leftArm, rightArm].forEach((arm) => {
    const hand = mesh(new THREE.SphereGeometry(0.095, 10, 8), skin, true);
    hand.position.y = -0.44;
    arm.userData.joint.add(hand);
  });
  [leftLeg, rightLeg].forEach((leg, index) => {
    const knee = mesh(new THREE.SphereGeometry(0.12, 10, 8), clothDark, true);
    leg.userData.joint.add(knee);
    const shoe = mesh(new THREE.BoxGeometry(0.23, 0.14, 0.46), shoeMaterial, true);
    shoe.position.set(0, -0.6, -0.11);
    shoe.rotation.x = 0.08;
    const sole = mesh(new THREE.BoxGeometry(0.245, 0.055, 0.49), soleMaterial, true);
    sole.position.set(0, -0.685, -0.105);
    leg.userData.joint.add(shoe, sole);
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
  root.userData.parts = { pelvis, torso, head, hairCap, backpack, leftArm, rightArm, leftLeg, rightLeg, shadow };
  root.userData.baseScale = options.scale || 1;
  root.scale.setScalar(root.userData.baseScale);
  return root;
}

function animateCharacter(character, time, action, vertical, intensity, phaseOffset = 0, lateral = 0, stumble = 0) {
  const parts = character.userData.parts;
  const phase = time * (8.8 + intensity * 2.2) + phaseOffset;
  const stride = Math.sin(phase);
  const rebound = Math.abs(Math.cos(phase)) * 0.065;
  const strideScale = 0.78 + intensity * 0.18;
  parts.leftArm.rotation.x = stride * 0.84 * strideScale;
  parts.rightArm.rotation.x = -stride * 0.84 * strideScale;
  parts.leftLeg.rotation.x = -stride * 0.92 * strideScale;
  parts.rightLeg.rotation.x = stride * 0.92 * strideScale;
  parts.leftLeg.userData.joint.rotation.x = Math.max(0, stride) * 1.05;
  parts.rightLeg.userData.joint.rotation.x = Math.max(0, -stride) * 1.05;
  parts.leftArm.userData.joint.rotation.x = -0.2 - Math.max(0, -stride) * 0.56;
  parts.rightArm.userData.joint.rotation.x = -0.2 - Math.max(0, stride) * 0.56;
  parts.pelvis.rotation.y = stride * 0.09;
  parts.torso.rotation.y = -stride * 0.06;
  parts.torso.rotation.z = -stride * 0.028;
  parts.head.rotation.z = stride * 0.015;
  character.rotation.x = 0.045;
  character.rotation.z = clamp(-lateral * 0.13, -0.2, 0.2);
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

function createCollectible(stageIndex, accent, particleTexture) {
  const group = new THREE.Group();
  const glowMaterial = material(accent, { emissive: accent, emissiveIntensity: 3.8, roughness: 0.24, metalness: 0.15 });
  const glassMaterial = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false });
  const halo = mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 32), glassMaterial);
  halo.rotation.x = Math.PI / 2;
  group.add(halo);

  if (stageIndex === 0) {
    const drop = mesh(new THREE.SphereGeometry(0.19, 16, 12), glowMaterial);
    drop.scale.set(0.72, 1.25, 0.72);
    const tip = mesh(new THREE.ConeGeometry(0.13, 0.28, 14), glowMaterial);
    tip.position.y = 0.24;
    group.add(drop, tip);
  } else if (stageIndex === 1) {
    const ear = mesh(new THREE.TorusGeometry(0.21, 0.06, 8, 24, Math.PI * 1.55), glowMaterial);
    ear.rotation.z = -0.7;
    const bud = mesh(new THREE.SphereGeometry(0.095, 12, 8), glowMaterial);
    bud.position.set(0.17, -0.16, 0);
    group.add(ear, bud);
  } else if (stageIndex === 2) {
    const ticket = mesh(new THREE.BoxGeometry(0.52, 0.32, 0.055), glowMaterial);
    const notch = mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 18), glassMaterial);
    notch.position.x = 0.13;
    group.add(ticket, notch);
  } else if (stageIndex === 3) {
    const note = mesh(new THREE.BoxGeometry(0.48, 0.36, 0.05), glowMaterial);
    note.rotation.z = -0.08;
    const fold = mesh(new THREE.BoxGeometry(0.34, 0.025, 0.065), glassMaterial);
    fold.position.set(0, 0.02, 0.05);
    fold.rotation.z = 0.5;
    group.add(note, fold);
  } else if (stageIndex === 4) {
    const ring = mesh(new THREE.TorusGeometry(0.18, 0.055, 9, 24), glowMaterial);
    ring.position.x = -0.16;
    const stem = mesh(new THREE.BoxGeometry(0.42, 0.075, 0.075), glowMaterial);
    stem.position.x = 0.17;
    const tooth = mesh(new THREE.BoxGeometry(0.08, 0.18, 0.075), glowMaterial);
    tooth.position.set(0.34, -0.08, 0);
    group.add(ring, stem, tooth);
  } else if (stageIndex === 5) {
    const knot = mesh(new THREE.TorusKnotGeometry(0.24, 0.055, 52, 8, 2, 3), glowMaterial);
    knot.scale.setScalar(0.88);
    group.add(knot);
  } else {
    const seal = mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.1, 28), glowMaterial);
    seal.rotation.x = Math.PI / 2;
    const center = new THREE.Sprite(new THREE.SpriteMaterial({ map: particleTexture, color: 0xfff4cf, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    center.position.z = 0.09;
    center.scale.set(0.45, 0.45, 1);
    group.add(seal, center);
  }
  return group;
}

function createTrain(accent, variant = 0) {
  const group = new THREE.Group();
  const bodyColor = variant % 2 ? 0xe5e7e4 : 0xd4d9d7;
  const bodyMaterial = material(bodyColor, { roughness: 0.34, metalness: 0.36 });
  const dark = material(0x172027, { roughness: 0.28, metalness: 0.54 });
  const stripe = material(accent, { emissive: accent, emissiveIntensity: 0.42, roughness: 0.38 });
  const body = mesh(new THREE.BoxGeometry(1.92, 2.72, 5.75), bodyMaterial, true);
  body.position.y = 1.62;
  const roof = mesh(new THREE.BoxGeometry(1.78, 0.26, 5.45), dark, true);
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
  group.add(windshield);
  [-0.58, 0.58].forEach((x) => {
    const lamp = mesh(new THREE.CircleGeometry(0.13, 18), material(0xfff1bc, { emissive: 0xffe29a, emissiveIntensity: 6, roughness: 0.12 }));
    lamp.position.set(x, 1.25, 3.19);
    group.add(lamp);
  });
  [-0.68, 0.68].forEach((x) => {
    [-1.85, 1.7].forEach((z) => {
      const wheel = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.18, 16), dark, true);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.34, z);
      group.add(wheel);
    });
  });
  const destinationTexture = makeSignTexture(variant % 2 ? "EXPRESS" : "CITY", accent);
  const destination = mesh(new THREE.PlaneGeometry(0.92, 0.3), new THREE.MeshBasicMaterial({ map: destinationTexture }));
  destination.position.set(0, 2.82, 3.2);
  group.add(destination);
  group.userData.kind = "train";
  return group;
}

function createJumpBarrier(accent) {
  const group = new THREE.Group();
  const steel = material(0x3b4245, { roughness: 0.4, metalness: 0.58 });
  const boardTexture = makeSignTexture("JUMP", accent);
  const board = mesh(new THREE.BoxGeometry(2.05, 0.72, 0.2), material(accent, { emissive: accent, emissiveIntensity: 0.24, roughness: 0.58 }), true);
  board.position.y = 0.72;
  const face = mesh(new THREE.PlaneGeometry(1.8, 0.5), new THREE.MeshBasicMaterial({ map: boardTexture }));
  face.position.set(0, 0.72, 0.105);
  group.add(board, face);
  [-0.78, 0.78].forEach((x) => {
    const leg = mesh(new THREE.BoxGeometry(0.11, 1.05, 0.16), steel, true);
    leg.position.set(x, 0.5, 0);
    const foot = mesh(new THREE.BoxGeometry(0.42, 0.1, 0.52), steel, true);
    foot.position.set(x, 0.08, 0);
    const beacon = mesh(new THREE.SphereGeometry(0.095, 12, 8), material(0xffc44d, { emissive: 0xff9c2f, emissiveIntensity: 4.5, roughness: 0.2 }));
    beacon.position.set(x, 1.18, 0);
    group.add(leg, foot, beacon);
  });
  group.userData.kind = "barrier";
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
  const warningTexture = makeSignTexture("DUCK", accent);
  const beam = mesh(new THREE.BoxGeometry(2.22, 0.58, 0.22), material(accent, { emissive: accent, emissiveIntensity: 0.7, roughness: 0.44 }), true);
  beam.position.y = 1.92;
  const face = mesh(new THREE.PlaneGeometry(1.92, 0.42), new THREE.MeshBasicMaterial({ map: warningTexture }));
  face.position.set(0, 1.92, 0.116);
  group.add(beam, face);
  group.userData.kind = "signal-gate";
  return group;
}

function createServiceCart(accent) {
  const group = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(1.75, 1.18, 2.2), material(0xe0b842, { roughness: 0.46, metalness: 0.18 }), true);
  body.position.y = 0.82;
  const cabin = mesh(new THREE.BoxGeometry(1.58, 0.85, 1.05), material(0x54636b, { roughness: 0.28, metalness: 0.35 }), true);
  cabin.position.set(0, 1.56, 0.34);
  const glass = mesh(new THREE.PlaneGeometry(1.2, 0.52), material(0x7bbac8, { emissive: accent, emissiveIntensity: 0.12, roughness: 0.1 }));
  glass.position.set(0, 1.6, 0.88);
  group.add(body, cabin, glass);
  [-0.66, 0.66].forEach((x) => {
    [-0.65, 0.65].forEach((z) => {
      const wheel = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 14), material(0x202326, { roughness: 0.78 }), true);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.32, z);
      group.add(wheel);
    });
  });
  group.userData.kind = "service-cart";
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
    this.scene.fog = new THREE.FogExp2(STAGE_CONFIGS[0].fog, STAGE_CONFIGS[0].fogDensity * FOG_SCALE);
    this.camera = new THREE.PerspectiveCamera(55, 9 / 16, 0.1, 280);
    this.camera.position.set(0, 4.35, 9.45);
    this.camera.lookAt(0, 1.35, -18);
    this.scene.add(this.camera);

    this.textureLoader = new THREE.TextureLoader();
    this.roadTexture = makeRoadTexture();
    this.platformTexture = makePlatformTexture();
    this.particleTexture = makeParticleTexture();
    this.stageTextures = Array(STAGE_CONFIGS.length).fill(null);
    this.backdropMaterials = [0, 1].map(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, fog: false, color: 0xffffff }));
    this.backdrops = this.backdropMaterials.map((backdropMaterial, index) => {
      const backdrop = mesh(new THREE.PlaneGeometry(128, 76), backdropMaterial);
      backdrop.position.set(0, 21, -126 - index * 0.2);
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
    this.scene.add(this.hemisphere, this.keyLight, this.edgeLight, this.warmLight);

    this.groundMaterial = material(STAGE_CONFIGS[0].ground, { roughness: 1 });
    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: this.roadTexture,
      color: new THREE.Color(STAGE_CONFIGS[0].road).multiplyScalar(0.5),
      roughness: 0.94,
      metalness: 0.02
    });
    this.curbMaterial = material(STAGE_CONFIGS[0].curb, { roughness: 0.88 });
    this.platformMaterial = new THREE.MeshStandardMaterial({ map: this.platformTexture, color: STAGE_CONFIGS[0].curb, roughness: 0.8, metalness: 0.04 });
    this.railMaterial = material(0xc6d1d2, { roughness: 0.23, metalness: 0.92 });
    this.railSideMaterial = material(0x596165, { roughness: 0.5, metalness: 0.72 });
    this.sleeperMaterial = material(0x4a3b31, { roughness: 0.96 });
    this.powerRailMaterial = material(STAGE_CONFIGS[0].accent, { emissive: STAGE_CONFIGS[0].accent, emissiveIntensity: 0.36, roughness: 0.42 });
    this.safetyLineMaterial = material(0xe3c953, { emissive: 0x8b7224, emissiveIntensity: 0.28, roughness: 0.62 });
    this.ground = mesh(new THREE.PlaneGeometry(86, 410), this.groundMaterial, false, true);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.set(0, -0.075, -120);
    this.scene.add(this.ground);

    this.roadSegments = [];
    this.roadGroup = new THREE.Group();
    this.scene.add(this.roadGroup);
    this.buildRoad();

    this.player = createCharacter({ skin: 0xc98c6b, cloth: 0x1d7378, clothDark: 0x173d47, hair: 0x24201f, accent: 0xf2ca65, feminine: false, scale: 1.04 });
    this.companion = createCharacter({ skin: 0xe0ad8c, cloth: 0xc95362, clothDark: 0x763346, hair: 0x2b211f, accent: 0xffd28c, feminine: true, scale: 0.94 });
    this.player.position.set(0, 0, PLAYER_Z);
    this.companion.position.set(-2.7, 0, -19);
    this.scene.add(this.player, this.companion);

    this.entityObjects = new Map();
    this.entityPool = new Map();
    this.bursts = [];
    this.rings = [];
    this.shake = 0;
    this.flash = 0;
    this.speedPulse = 0;
    this.lastTime = 0;
    this.stageIndex = -1;
    this.stageElapsed = 0;
    this.currentDistance = 0;
    this.currentLaneX = 0;
    this.previousLaneX = 0;
    this.lateralVelocity = 0;
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
  }

  buildRoad() {
    const transform = new THREE.Matrix4();
    for (let index = 0; index < SEGMENT_COUNT; index += 1) {
      const segment = new THREE.Group();
      const ballast = mesh(new THREE.BoxGeometry(ROAD_WIDTH, 0.2, SEGMENT_LENGTH), this.roadMaterial, false, true);
      ballast.position.y = -0.08;
      segment.add(ballast);

      const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(1.95, 0.11, 0.24), this.sleeperMaterial, 42);
      sleepers.receiveShadow = true;
      sleepers.castShadow = false;
      let sleeperIndex = 0;
      [-1, 0, 1].forEach((lane) => {
        for (let row = 0; row < 14; row += 1) {
          transform.makeTranslation(lane * LANE_WIDTH, 0.065, -7.45 + row * 1.14);
          sleepers.setMatrixAt(sleeperIndex, transform);
          sleeperIndex += 1;
        }
      });
      sleepers.instanceMatrix.needsUpdate = true;
      segment.add(sleepers);

      const rails = new THREE.InstancedMesh(new THREE.BoxGeometry(0.085, 0.105, SEGMENT_LENGTH), this.railMaterial, 6);
      rails.castShadow = false;
      rails.receiveShadow = true;
      let railIndex = 0;
      [-1, 0, 1].forEach((lane) => {
        [-0.53, 0.53].forEach((offset) => {
          transform.makeTranslation(lane * LANE_WIDTH + offset, 0.155, 0);
          rails.setMatrixAt(railIndex, transform);
          railIndex += 1;
        });
      });
      rails.instanceMatrix.needsUpdate = true;
      segment.add(rails);

      const thirdRails = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.075, SEGMENT_LENGTH), this.powerRailMaterial, 3);
      [-1, 0, 1].forEach((lane, laneIndex) => {
        transform.makeTranslation(lane * LANE_WIDTH + 0.82, 0.12, 0);
        thirdRails.setMatrixAt(laneIndex, transform);
      });
      thirdRails.instanceMatrix.needsUpdate = true;
      segment.add(thirdRails);

      const walks = new THREE.InstancedMesh(new THREE.BoxGeometry(2.45, 0.34, SEGMENT_LENGTH), this.platformMaterial, 2);
      transform.makeTranslation(-5.7, 0.1, 0);
      walks.setMatrixAt(0, transform);
      transform.makeTranslation(5.7, 0.1, 0);
      walks.setMatrixAt(1, transform);
      walks.instanceMatrix.needsUpdate = true;
      walks.receiveShadow = true;
      const safetyLines = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.025, SEGMENT_LENGTH), this.safetyLineMaterial, 2);
      transform.makeTranslation(-4.46, 0.3, 0);
      safetyLines.setMatrixAt(0, transform);
      transform.makeTranslation(4.46, 0.3, 0);
      safetyLines.setMatrixAt(1, transform);
      safetyLines.instanceMatrix.needsUpdate = true;
      segment.add(walks, safetyLines);

      const decor = new THREE.Group();
      decor.name = "decor";
      segment.add(decor);
      segment.userData.decor = decor;
      this.roadSegments.push(segment);
      this.roadGroup.add(segment);
    }
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
      } else if (index < 10) {
        const requestedType = config.props[index % config.props.length];
        const sideSafe = (type) => ["tunnel", "terminal", "overpass"].includes(type) ? "lamp" : type;
        const side = index % 2 ? 1 : -1;
        const type = sideSafe(requestedType);
        const prop = createProp(type, config.accent, index * 5 + this.stageIndex);
        prop.position.set(side * (6.25 + (index % 3) * 0.38), 0.18, index % 3 === 0 ? -2.4 : 2.2);
        prop.rotation.y = type === "railing" ? 0 : side < 0 ? Math.PI / 2 : -Math.PI / 2;
        decor.add(prop);
      }
      if (index % 6 === 0) {
        const gantry = createGantry(config.accent, this.stageIndex === 5);
        gantry.position.z = -4.8;
        decor.add(gantry);
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
        const planeAspect = 118 / 70;
        texture.matrixAutoUpdate = false;
        if (imageAspect > planeAspect) {
          texture.repeat.set(planeAspect / imageAspect, 1);
          texture.offset.set((1 - texture.repeat.x) / 2, 0);
        } else {
          texture.repeat.set(1, imageAspect / planeAspect);
          texture.offset.set(0, 1 - texture.repeat.y);
        }
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
      this.backdropMaterials[this.activeBackdrop].opacity = 0.24;
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
    this.targetExposure = config.weather === "storm" ? 0.86 : config.weather === "starlight" ? 1.18 : 1.06;
    this.hemisphere.color.setHex(config.ambient);
    this.hemisphere.groundColor.setHex(config.ground);
    this.keyLight.color.setHex(config.key);
    this.edgeLight.color.setHex(config.accent);
    this.warmLight.color.setHex(config.accent);
    this.roadMaterial.color.copy(new THREE.Color(config.road).multiplyScalar(0.52));
    this.roadMaterial.roughness = ["after-rain", "rain", "storm"].includes(config.weather) ? 0.58 : 0.9;
    this.curbMaterial.color.setHex(config.curb);
    this.platformMaterial.color.copy(new THREE.Color(config.curb).multiplyScalar(0.82));
    this.powerRailMaterial.color.setHex(config.accent);
    this.powerRailMaterial.emissive.setHex(config.accent);
    this.safetyLineMaterial.color.copy(new THREE.Color(config.accent).lerp(new THREE.Color(0xf0cf58), 0.55));
    this.safetyLineMaterial.emissive.copy(new THREE.Color(config.accent).multiplyScalar(0.42));
    this.groundMaterial.color.setHex(config.ground);
    this.ambientParticles.material.color.setHex(config.accent);
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
    const ratio = clamp(Math.min(Number(devicePixelRatio) || 1, 2, pixelBudgetRatio), 1, 2);
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(cssWidth, cssHeight, false);
    this.camera.aspect = cssWidth / cssHeight;
    this.camera.updateProjectionMatrix();
    this.pixelRatio = ratio;
  }

  syncRoad(distance) {
    const offset = (distance * WORLD_Z_SCALE) % SEGMENT_LENGTH;
    this.roadSegments.forEach((segment, index) => {
      let z = 7 - index * SEGMENT_LENGTH + offset;
      if (z > 14) z -= SEGMENT_COUNT * SEGMENT_LENGTH;
      segment.position.z = z;
      segment.userData.decor.visible = z < 4.8;
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
    entities.forEach((entity) => {
      if (!entity.active) return;
      activeIds.add(entity.id);
      let object = this.entityObjects.get(entity.id);
      if (!object) {
        object = this.acquireEntity(entity, config);
        this.entityObjects.set(entity.id, object);
      }
      object.position.x = entity.lane * LANE_WIDTH;
      object.position.z = PLAYER_Z + (COLLISION_Z - entity.z) * WORLD_Z_SCALE;
      if (entity.type === "collectible") {
        object.position.y = 1.22 + (Number(entity.height) || 0) + Math.sin(time * 4.5 + entity.id) * 0.12;
        object.rotation.y = time * 1.7 + entity.id;
        object.rotation.z = Math.sin(time * 1.2 + entity.id) * 0.12;
      } else {
        object.position.y = 0;
        if (object.userData.kind === "train") object.rotation.z = Math.sin(time * 7 + entity.id) * 0.0025;
        if (object.userData.kind === "service-cart") object.rotation.y = Math.sin(time * 5.4 + entity.id) * 0.012;
      }
    });
    this.entityObjects.forEach((object, id) => {
      if (activeIds.has(id)) return;
      this.recycleEntity(object);
      this.entityObjects.delete(id);
    });
  }

  updateWeather(delta, time, speed, combo) {
    const config = STAGE_CONFIGS[this.stageIndex];
    const rainy = config.weather === "rain" || config.weather === "storm" || config.weather === "after-rain";
    const targetRain = config.weather === "storm" ? 0.62 : config.weather === "rain" ? 0.42 : config.weather === "after-rain" ? 0.1 : 0;
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

  updateBackdrops(delta) {
    if (this.backdropBlend >= 1) return;
    this.backdropBlend = clamp(this.backdropBlend + delta / 1.25, 0, 1);
    const next = 1 - this.activeBackdrop;
    const smooth = this.backdropBlend * this.backdropBlend * (3 - 2 * this.backdropBlend);
    this.backdropMaterials[this.activeBackdrop].opacity = 0.24 * (1 - smooth);
    this.backdropMaterials[next].opacity = 0.24 * smooth;
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
    animateCharacter(this.player, time, motion.action || "run", Number(motion.vertical) || 0, speed / 17, 0, this.lateralVelocity, stumble);

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
    animateCharacter(this.companion, time, companionAction, companionAction === "jump" ? 0.75 : 0, speed / 17, 0.9, 0, 0);
    this.companion.rotation.y = this.stageIndex === 0 ? -0.08 : 0;

    const cameraTargetX = this.currentLaneX * 0.48 + (this.stageIndex >= 4 ? 0.1 : 0);
    const cameraBob = frame.mode === "playing" ? Math.sin(time * 8.5) * 0.035 : Math.sin(time * 0.8) * 0.025;
    const shakeX = (Math.sin(time * 83) + Math.sin(time * 41)) * this.shake * 0.07;
    const shakeY = Math.sin(time * 67) * this.shake * 0.055;
    this.camera.position.x = damp(this.camera.position.x, cameraTargetX, 6, delta) + shakeX;
    this.camera.position.y = damp(this.camera.position.y, 4.18 + cameraBob - (motion.action === "slide" ? 0.16 : 0), 8, delta) + shakeY;
    this.camera.position.z = damp(this.camera.position.z, motion.action === "slide" ? 9.72 : 9.45, 5, delta);
    this.camera.fov = damp(this.camera.fov, 54 + clamp((speed - 10) * 0.42, 0, 4.5) + this.speedPulse * 1.4, 4, delta);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.currentLaneX * 0.38, 1.42, -20.5);
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

    this.updateWeather(delta, time, speed, Number(runState.combo) || 0);
    this.updateBackdrops(delta);
    this.updateBursts(delta);
    this.renderer.render(this.scene, this.camera);
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
    this.entityObjects.forEach((object) => disposeObject(object));
    this.entityPool.forEach((bucket) => bucket.forEach((object) => disposeObject(object)));
    this.renderer.dispose();
    this.roadTexture.dispose();
    this.particleTexture.dispose();
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
