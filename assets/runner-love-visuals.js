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
    props: ["tree", "lamp", "campus"],
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
    props: ["railing", "bench", "tree"],
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
    props: ["building", "cafe", "shelter"],
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
    props: ["overpass", "lamp", "shelter"],
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
    props: ["market", "home", "tree"],
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
    props: ["railing", "warning", "lamp"],
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
    props: ["home", "lamp", "tree"],
    companion: { x: 1.55, z: 0.25 }
  }
]);

const SEGMENT_LENGTH = 18;
const SEGMENT_COUNT = 14;
const ROAD_WIDTH = 8.4;
const LANE_WIDTH = 2.25;
const MAX_RENDER_PIXELS = 2_100_000;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function damp(current, target, smoothing, delta) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * delta));
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose?.();
    if (child.material && child.userData.disposeMaterial) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose?.());
    }
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

function makeRoadTexture() {
  const texture = canvasTexture(256, 512, (context, width, height) => {
    context.fillStyle = "#737a77";
    context.fillRect(0, 0, width, height);
    let seed = 971;
    for (let index = 0; index < 5400; index += 1) {
      seed = (seed * 48271) % 2147483647;
      const x = seed % width;
      seed = (seed * 48271) % 2147483647;
      const y = seed % height;
      const shade = 70 + (seed % 42);
      context.fillStyle = `rgba(${shade},${shade + 3},${shade + 1},${0.08 + (seed % 13) / 100})`;
      context.fillRect(x, y, 1 + (seed % 2), 1 + ((seed >> 2) % 2));
    }
    context.strokeStyle = "rgba(212,220,214,.12)";
    context.lineWidth = 1;
    for (let y = 34; y < height; y += 73) {
      context.beginPath();
      context.moveTo(0, y);
      context.bezierCurveTo(width * 0.25, y + 5, width * 0.64, y - 3, width, y + 2);
      context.stroke();
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 5);
  return texture;
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
  const skin = material(options.skin, { roughness: 0.82 });
  const cloth = material(options.cloth, { roughness: 0.76 });
  const clothDark = material(options.clothDark, { roughness: 0.8 });
  const hair = material(options.hair, { roughness: 0.96 });
  const shoeMaterial = material(0xf0eee7, { roughness: 0.56 });

  const pelvis = mesh(new THREE.SphereGeometry(0.3, 14, 10), clothDark, true);
  pelvis.scale.set(1, 0.68, 0.78);
  pelvis.position.y = 0.92;
  const torso = mesh(new THREE.CylinderGeometry(0.27, 0.36, 0.78, 12), cloth, true);
  torso.position.y = 1.42;
  torso.rotation.z = options.feminine ? 0.015 : -0.015;
  const neck = mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.18, 10), skin, true);
  neck.position.y = 1.91;
  const head = mesh(new THREE.SphereGeometry(0.25, 18, 14), skin, true);
  head.position.y = 2.16;
  const hairCap = mesh(new THREE.SphereGeometry(0.262, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), hair, true);
  hairCap.position.set(0, 2.22, 0);
  hairCap.rotation.x = -0.08;
  root.add(pelvis, torso, neck, head, hairCap);

  const collar = mesh(new THREE.TorusGeometry(0.205, 0.035, 8, 22), clothDark, true);
  collar.position.y = 1.79;
  collar.rotation.x = Math.PI / 2;
  const backPanel = mesh(new THREE.BoxGeometry(0.34, 0.42, 0.045), clothDark, true);
  backPanel.position.set(0, 1.43, 0.33);
  backPanel.rotation.x = -0.05;
  root.add(collar, backPanel);

  if (options.feminine) {
    const ponytail = mesh(new THREE.SphereGeometry(0.14, 12, 10), hair, true);
    ponytail.scale.set(0.82, 1.42, 0.82);
    ponytail.position.set(0, 2.12, 0.22);
    root.add(ponytail);
  }

  const leftArm = createLimb(cloth, 0.48, 0.44, 0.085);
  const rightArm = createLimb(cloth, 0.48, 0.44, 0.085);
  leftArm.position.set(-0.34, 1.72, 0);
  rightArm.position.set(0.34, 1.72, 0);
  const leftLeg = createLimb(clothDark, 0.61, 0.58, 0.115);
  const rightLeg = createLimb(clothDark, 0.61, 0.58, 0.115);
  leftLeg.position.set(-0.17, 0.94, 0);
  rightLeg.position.set(0.17, 0.94, 0);
  [leftArm, rightArm].forEach((arm) => {
    const hand = mesh(new THREE.SphereGeometry(0.095, 10, 8), skin, true);
    hand.position.y = -0.46;
    arm.userData.joint.add(hand);
  });
  [leftLeg, rightLeg].forEach((leg, index) => {
    const knee = mesh(new THREE.SphereGeometry(0.12, 10, 8), clothDark, true);
    leg.userData.joint.add(knee);
    const shoe = mesh(new THREE.BoxGeometry(0.2, 0.12, 0.42), shoeMaterial, true);
    shoe.position.set(0, -0.59, -0.1);
    shoe.rotation.x = 0.12;
    leg.userData.joint.add(shoe);
    leg.userData.shoe = shoe;
    leg.userData.side = index ? 1 : -1;
  });
  root.add(leftArm, rightArm, leftLeg, rightLeg);

  const shadow = mesh(
    new THREE.CircleGeometry(0.62, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.24, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.018;
  root.add(shadow);
  root.userData.parts = { torso, head, hairCap, leftArm, rightArm, leftLeg, rightLeg, shadow };
  return root;
}

function animateCharacter(character, time, action, vertical, intensity, phaseOffset = 0) {
  const parts = character.userData.parts;
  const phase = time * (8.4 + intensity * 1.5) + phaseOffset;
  const stride = Math.sin(phase);
  const rebound = Math.abs(Math.cos(phase)) * 0.055;
  parts.leftArm.rotation.x = stride * 0.78;
  parts.rightArm.rotation.x = -stride * 0.78;
  parts.leftLeg.rotation.x = -stride * 0.86;
  parts.rightLeg.rotation.x = stride * 0.86;
  parts.leftLeg.userData.joint.rotation.x = Math.max(0, stride) * 0.9;
  parts.rightLeg.userData.joint.rotation.x = Math.max(0, -stride) * 0.9;
  parts.leftArm.userData.joint.rotation.x = -0.25 - Math.max(0, -stride) * 0.5;
  parts.rightArm.userData.joint.rotation.x = -0.25 - Math.max(0, stride) * 0.5;
  parts.torso.rotation.z = -stride * 0.035;
  parts.head.rotation.z = stride * 0.018;
  character.rotation.x = 0;
  character.scale.setScalar(1);
  character.position.y = rebound + vertical * 0.72;
  parts.shadow.material.opacity = clamp(0.24 - vertical * 0.11, 0.08, 0.24);
  parts.shadow.scale.setScalar(1 + vertical * 0.2);

  if (action === "jump") {
    parts.leftLeg.rotation.x = -0.48;
    parts.rightLeg.rotation.x = 0.34;
    parts.leftLeg.userData.joint.rotation.x = 1.15;
    parts.rightLeg.userData.joint.rotation.x = 0.92;
    parts.leftArm.rotation.x = 0.72;
    parts.rightArm.rotation.x = 0.46;
  } else if (action === "slide") {
    character.position.y = 0.12;
    character.rotation.x = -0.78;
    character.scale.set(1, 0.84, 1);
    parts.leftLeg.rotation.x = -1.12;
    parts.rightLeg.rotation.x = -0.82;
    parts.leftArm.rotation.x = 0.72;
    parts.rightArm.rotation.x = 0.46;
  }
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

function createObstacle(stageIndex, avoid, accent) {
  const group = new THREE.Group();
  if (avoid === "slide") {
    const frameMaterial = material(0x41494c, { roughness: 0.42, metalness: 0.48 });
    [-1.05, 1.05].forEach((x) => {
      const post = mesh(new THREE.BoxGeometry(0.12, 2.1, 0.12), frameMaterial);
      post.position.set(x, 1.05, 0);
      group.add(post);
    });
    const banner = mesh(new THREE.BoxGeometry(2.35, 0.62, 0.14), material(accent, { emissive: accent, emissiveIntensity: 0.32, roughness: 0.6 }));
    banner.position.y = 1.68;
    group.add(banner);
  } else if (stageIndex === 0 || stageIndex === 3 || stageIndex === 5) {
    const puddle = mesh(new THREE.CircleGeometry(0.95, 32), material(0x86b2bd, { transparent: true, opacity: 0.48, roughness: 0.12, metalness: 0.16, depthWrite: false, side: THREE.DoubleSide }));
    puddle.rotation.x = -Math.PI / 2;
    puddle.scale.set(1.3, 0.62, 1);
    puddle.position.y = 0.025;
    group.add(puddle);
    [0, 1, 2].forEach((index) => {
      const ripple = mesh(new THREE.TorusGeometry(0.32 + index * 0.17, 0.014, 5, 28), new THREE.MeshBasicMaterial({ color: 0xbde8ec, transparent: true, opacity: 0.42 - index * 0.08, depthWrite: false }));
      ripple.rotation.x = Math.PI / 2;
      ripple.position.y = 0.035;
      group.add(ripple);
    });
  } else {
    const boardMaterial = material(accent, { roughness: 0.62 });
    const frameMaterial = material(0x3a3e40, { roughness: 0.45, metalness: 0.45 });
    const board = mesh(new THREE.BoxGeometry(2.15, 0.56, 0.18), boardMaterial, true);
    board.position.y = 0.78;
    [-0.82, 0.82].forEach((x) => {
      const leg = mesh(new THREE.BoxGeometry(0.12, 0.86, 0.12), frameMaterial, true);
      leg.position.set(x, 0.43, 0);
      group.add(leg);
    });
    group.add(board);
  }
  return group;
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
    this.scene.fog = new THREE.FogExp2(STAGE_CONFIGS[0].fog, STAGE_CONFIGS[0].fogDensity);
    this.camera = new THREE.PerspectiveCamera(48, 9 / 16, 0.1, 260);
    this.camera.position.set(0, 4.65, 9.4);
    this.camera.lookAt(0, 1.4, -19);
    this.scene.add(this.camera);

    this.textureLoader = new THREE.TextureLoader();
    this.roadTexture = makeRoadTexture();
    this.particleTexture = makeParticleTexture();
    this.stageTextures = Array(STAGE_CONFIGS.length).fill(null);
    this.backdropMaterials = [0, 1].map(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, fog: false, color: 0xffffff }));
    this.backdrops = this.backdropMaterials.map((backdropMaterial, index) => {
      const backdrop = mesh(new THREE.PlaneGeometry(118, 70), backdropMaterial);
      backdrop.position.set(0, 20, -118 - index * 0.2);
      backdrop.renderOrder = -4 + index;
      this.scene.add(backdrop);
      return backdrop;
    });
    this.activeBackdrop = 0;
    this.backdropBlend = 1;

    this.hemisphere = new THREE.HemisphereLight(0xcfe8e2, 0x1d2925, 1.8);
    this.keyLight = new THREE.DirectionalLight(STAGE_CONFIGS[0].key, 3.3);
    this.keyLight.position.set(-8, 14, 8);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(768, 768);
    this.keyLight.shadow.camera.left = -8;
    this.keyLight.shadow.camera.right = 8;
    this.keyLight.shadow.camera.top = 12;
    this.keyLight.shadow.camera.bottom = -3;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 42;
    this.keyLight.shadow.bias = -0.0008;
    this.edgeLight = new THREE.DirectionalLight(0x8fcbd4, 1.4);
    this.edgeLight.position.set(8, 7, -4);
    this.warmLight = new THREE.PointLight(STAGE_CONFIGS[0].accent, 16, 25, 2);
    this.warmLight.position.set(0, 4.4, -4);
    this.scene.add(this.hemisphere, this.keyLight, this.edgeLight, this.warmLight);

    this.groundMaterial = material(STAGE_CONFIGS[0].ground, { roughness: 1 });
    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: this.roadTexture,
      color: STAGE_CONFIGS[0].road,
      roughness: 0.62,
      metalness: 0.06
    });
    this.curbMaterial = material(STAGE_CONFIGS[0].curb, { roughness: 0.92 });
    this.laneMaterial = material(0xe9dfc8, { emissive: 0x6f6655, emissiveIntensity: 0.18, roughness: 0.68 });
    this.ground = mesh(new THREE.PlaneGeometry(86, 410), this.groundMaterial, false, true);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.set(0, -0.075, -120);
    this.scene.add(this.ground);

    this.roadSegments = [];
    this.roadGroup = new THREE.Group();
    this.scene.add(this.roadGroup);
    this.buildRoad();

    this.player = createCharacter({ skin: 0xc98c6b, cloth: 0x315f63, clothDark: 0x1e3d42, hair: 0x24201f, feminine: false });
    this.companion = createCharacter({ skin: 0xe0ad8c, cloth: 0xb9525b, clothDark: 0x793a47, hair: 0x2b211f, feminine: true });
    this.player.position.set(0, 0, 2.15);
    this.companion.position.set(-2.7, 0, -19);
    this.scene.add(this.player, this.companion);

    this.entityObjects = new Map();
    this.bursts = [];
    this.shake = 0;
    this.flash = 0;
    this.lastTime = 0;
    this.stageIndex = -1;
    this.stageElapsed = 0;
    this.currentDistance = 0;
    this.currentLaneX = 0;
    this.targetExposure = 1.08;
    this.targetBackground = new THREE.Color(STAGE_CONFIGS[0].sky);
    this.targetFog = new THREE.Color(STAGE_CONFIGS[0].fog);
    this.targetFogDensity = STAGE_CONFIGS[0].fogDensity;

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
    for (let index = 0; index < SEGMENT_COUNT; index += 1) {
      const segment = new THREE.Group();
      const road = mesh(new THREE.PlaneGeometry(ROAD_WIDTH, SEGMENT_LENGTH), this.roadMaterial, false, true);
      road.rotation.x = -Math.PI / 2;
      road.position.y = 0;
      const leftWalk = mesh(new THREE.BoxGeometry(2.55, 0.22, SEGMENT_LENGTH), this.curbMaterial, false, true);
      const rightWalk = leftWalk.clone();
      leftWalk.position.set(-5.48, 0.08, 0);
      rightWalk.position.set(5.48, 0.08, 0);
      segment.add(road, leftWalk, rightWalk);
      [-LANE_WIDTH / 2, LANE_WIDTH / 2].forEach((x) => {
        for (let dash = 0; dash < 5; dash += 1) {
          const mark = mesh(new THREE.BoxGeometry(0.055, 0.018, 1.5), this.laneMaterial);
          mark.position.set(x, 0.024, -6.5 + dash * 3.25);
          segment.add(mark);
        }
      });
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
      const requestedLeftType = config.props[index % config.props.length];
      const requestedRightType = config.props[(index + 1) % config.props.length];
      const leftType = requestedLeftType === "overpass" && index % 6 !== 0 ? "lamp" : requestedLeftType;
      const rightType = requestedRightType === "overpass" && index % 6 !== 0 ? "lamp" : requestedRightType;
      const left = createProp(leftType, config.accent, index * 3 + this.stageIndex);
      const right = createProp(rightType, config.accent, index * 5 + this.stageIndex + 1);
      const leftX = -6.2 - (index % 3) * 0.6;
      const rightX = 6.2 + ((index + 1) % 3) * 0.6;
      left.position.set(leftX, 0.18, (index % 2 ? -2.8 : 2.2));
      right.position.set(rightX, 0.18, (index % 2 ? 2.6 : -2.4));
      left.rotation.y = Math.PI / 2;
      right.rotation.y = -Math.PI / 2;
      if (leftType === "railing") left.rotation.y = 0;
      if (rightType === "railing") right.rotation.y = 0;
      if (leftType === "overpass") { left.position.x = 0; left.rotation.y = 0; }
      if (rightType === "overpass") { right.position.x = 0; right.rotation.y = 0; }
      decor.add(left, right);
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
      this.backdropMaterials[this.activeBackdrop].opacity = 0.38;
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
    this.targetFogDensity = config.fogDensity;
    this.targetExposure = config.weather === "storm" ? 0.86 : config.weather === "starlight" ? 1.18 : 1.06;
    this.hemisphere.color.setHex(config.ambient);
    this.hemisphere.groundColor.setHex(config.ground);
    this.keyLight.color.setHex(config.key);
    this.edgeLight.color.setHex(config.accent);
    this.warmLight.color.setHex(config.accent);
    this.roadMaterial.color.setHex(config.road);
    this.roadMaterial.roughness = ["after-rain", "rain", "storm"].includes(config.weather) ? 0.36 : 0.68;
    this.curbMaterial.color.setHex(config.curb);
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
    const offset = (distance * 1.55) % SEGMENT_LENGTH;
    this.roadSegments.forEach((segment, index) => {
      let z = 7 - index * SEGMENT_LENGTH + offset;
      if (z > 14) z -= SEGMENT_COUNT * SEGMENT_LENGTH;
      segment.position.z = z;
    });
    this.roadTexture.offset.y = -(distance * 0.011) % 1;
  }

  syncEntities(entities, time) {
    const activeIds = new Set();
    const config = STAGE_CONFIGS[this.stageIndex];
    entities.forEach((entity) => {
      if (!entity.active) return;
      activeIds.add(entity.id);
      let object = this.entityObjects.get(entity.id);
      if (!object) {
        if (entity.type === "collectible") object = createCollectible(this.stageIndex, config.accent, this.particleTexture);
        else if (entity.type === "obstacle") object = createObstacle(this.stageIndex, entity.avoid, config.accent);
        else object = createCompanionCue(entity.cue, config.accent);
        object.userData.entityType = entity.type;
        this.entityObjects.set(entity.id, object);
        this.scene.add(object);
      }
      object.position.x = entity.lane * LANE_WIDTH;
      object.position.z = 1.2 - entity.z * 1.72;
      if (entity.type === "collectible") {
        object.position.y = 1.25 + Math.sin(time * 4.5 + entity.id) * 0.12;
        object.rotation.y = time * 1.7 + entity.id;
        object.rotation.z = Math.sin(time * 1.2 + entity.id) * 0.12;
      } else {
        object.position.y = 0;
      }
    });
    this.entityObjects.forEach((object, id) => {
      if (activeIds.has(id)) return;
      this.scene.remove(object);
      disposeObject(object);
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
    const streakTarget = clamp((speed - 11) / 17 + combo * 0.025, 0, 0.26);
    this.speedStreaks.material.opacity = damp(this.speedStreaks.material.opacity, streakTarget, 5, delta);
    this.speedStreaks.position.z = (time * speed * 0.85) % 8;
  }

  updateBackdrops(delta) {
    if (this.backdropBlend >= 1) return;
    this.backdropBlend = clamp(this.backdropBlend + delta / 1.25, 0, 1);
    const next = 1 - this.activeBackdrop;
    const smooth = this.backdropBlend * this.backdropBlend * (3 - 2 * this.backdropBlend);
    this.backdropMaterials[this.activeBackdrop].opacity = 0.38 * (1 - smooth);
    this.backdropMaterials[next].opacity = 0.38 * smooth;
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
  }

  effect(type, detail = {}) {
    if (type === "miss") {
      this.shake = Math.max(this.shake, 0.72);
      this.flash = Math.max(this.flash, 0.42);
      this.flashMaterial.color.setHex(0xff5d58);
      return;
    }
    if (type === "stage") {
      this.flash = Math.max(this.flash, 0.5);
      this.flashMaterial.color.setHex(STAGE_CONFIGS[this.stageIndex].accent);
      return;
    }
    const count = type === "perfect" || type === "companion-sync" ? 30 : 18;
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
    points.position.set((detail.lane || 0) * LANE_WIDTH, 1.25, 1.2 - (detail.z || 0) * 1.72);
    this.scene.add(points);
    this.bursts.push({ points, velocities, life: 0.85, duration: 0.85 });
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

    const targetPlayerX = (Number(motion.lane) || 0) * LANE_WIDTH;
    this.currentLaneX = damp(this.currentLaneX, targetPlayerX, 12, delta);
    this.player.position.x = this.currentLaneX;
    this.player.position.z = 2.15;
    animateCharacter(this.player, time, motion.action || "run", Number(motion.vertical) || 0, speed / 17);

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
    animateCharacter(this.companion, time, companionAction, companionAction === "jump" ? 0.75 : 0, speed / 17, 0.9);
    this.companion.rotation.y = this.stageIndex === 0 ? -0.08 : 0;

    const cameraTargetX = this.currentLaneX * 0.28 + (this.stageIndex >= 4 ? 0.13 : 0);
    const cameraBob = frame.mode === "playing" ? Math.sin(time * 8.5) * 0.035 : Math.sin(time * 0.8) * 0.025;
    const shakeX = (Math.sin(time * 83) + Math.sin(time * 41)) * this.shake * 0.07;
    const shakeY = Math.sin(time * 67) * this.shake * 0.055;
    this.camera.position.x = damp(this.camera.position.x, cameraTargetX, 6, delta) + shakeX;
    this.camera.position.y = damp(this.camera.position.y, 4.65 + cameraBob, 8, delta) + shakeY;
    this.camera.position.z = damp(this.camera.position.z, motion.action === "slide" ? 9.75 : 9.4, 5, delta);
    this.camera.fov = damp(this.camera.fov, 47 + clamp((speed - 10) * 0.55, 0, 5), 3, delta);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.currentLaneX * 0.16, 1.35, -19.5);
    this.shake = Math.max(0, this.shake - delta * 2.8);
    this.flash = Math.max(0, this.flash - delta * 1.8);
    this.flashMaterial.opacity = this.flash;

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
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      rainOpacity: this.rain.material.opacity,
      companion: { x: this.companion.position.x, z: this.companion.position.z }
    };
  }

  dispose() {
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
