const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const bundlePath = path.join(root, "assets/billiards-ball-renderer.js");
const licensePath = path.join(root, "assets/vendor/three-0.185.1.LICENSE.txt");
const source = fs.readFileSync(bundlePath, "utf8");
const license = fs.readFileSync(licensePath, "utf8");
const expectedMotifKeys = [
  "raindrop", "coffee", "ticket", "camera", "streetlamp",
  "earphones", "cat", "heart", "sunset", "gift",
  "message", "transit", "star", "umbrella", "homeward"
];
const expectedStyleKeys = [
  "ink", "galaxy", "lava", "ice", "matrix", "wind", "arcane", "rhythm",
  "codex", "chrono", "city", "thunder", "aurora", "station", "tide", "quantum"
];
const expectedCueKeys = [
  "seal", "orbit", "fissure", "facet", "circuit", "gust", "sigil", "pulse",
  "folio", "dial", "skyline", "bolt", "ribbon", "rail", "wave", "halo"
];

function sourceBetween(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `missing source range ${startMarker} -> ${endMarker}`);
  return source.slice(start, end);
}

function loadProfiles() {
  const profileSource = sourceBetween("var BBR_STYLE_PROFILES=", "function bbrStyleFor(");
  const sandbox = {};
  vm.runInNewContext(`${profileSource};this.profiles=BBR_STYLE_PROFILES;`, sandbox);
  return Array.from(sandbox.profiles, (profile) => ({ ...profile }));
}

function createRecordingContext() {
  const calls = [];
  const gradient = () => ({
    addColorStop(...args) {
      calls.push(["addColorStop", ...args]);
    }
  });
  const context = new Proxy({}, {
    get(target, property) {
      if (property === "createLinearGradient" || property === "createRadialGradient") {
        return (...args) => {
          calls.push([property, ...args]);
          return gradient();
        };
      }
      target[property] ||= (...args) => calls.push([property, ...args]);
      return target[property];
    },
    set(target, property, value) {
      calls.push(["set", property, value]);
      target[property] = value;
      return true;
    }
  });
  return { calls, context };
}

test("ships a minified official Three r185 runtime without an external Three dependency", () => {
  assert.ok(source.startsWith("/*! BilliardsBallRenderer | Three.js r185 |"));
  assert.ok(fs.statSync(bundlePath).size < 600_000, "the minified IIFE should stay below 600 KB");
  assert.ok(/\(\(\)=>\{var [\w$]+="185";/.test(source), "missing the bundled r185 revision");
  assert.ok(source.includes("THREE.WebGLRenderer"), "missing the bundled WebGLRenderer runtime");
  assert.ok(!/\bimport\s+[^;]+\s+from\s+["']three["']/.test(source));
  assert.ok(!/\brequire\(["']three["']\)/.test(source));
  assert.match(license, /MIT License/);
  assert.match(license, /three\.js authors/);
});

test("uses a world-space rolling quaternion derived from continuous table displacement", () => {
  const rollingFormula = /function ([\w$]+)\(([\w$]+),([\w$]+),([\w$]+),([\w$]+)\)\{if\(!\2\.hasPosition\)[\s\S]{0,300}?let ([\w$]+)=\3-\2\.lastX,([\w$]+)=\4-\2\.lastY,([\w$]+)=Math\.hypot\(\6,\7\);[\s\S]{0,200}?\2\.rollAxis\.set\(\7,-\6,0\)\.normalize\(\),\2\.rollStep\.setFromAxisAngle\(\2\.rollAxis,\8\/\5\),\2\.quaternion\.premultiply\(\2\.rollStep\)\.normalize\(\)/;
  assert.ok(rollingFormula.test(source), "missing axis=(dy,-dx,0), angle=distance/radius quaternion accumulation");
  assert.ok(/([\w$]+)\.mesh\.quaternion\.set\(-\1\.quaternion\.x,\1\.quaternion\.y,-\1\.quaternion\.z,\1\.quaternion\.w\)/.test(source));
});

test("builds high-resolution world textures, physically lit spheres, and separate shadows", () => {
  for (const type of [
    "SphereGeometry", "MeshStandardMaterial",
    "HemisphereLight", "DirectionalLight", "PointLight", "OrthographicCamera"
  ]) {
    assert.ok(source.includes(`\"${type}\"`), `missing bundled Three type ${type}`);
  }
  assert.ok(source.includes("isCanvasTexture=!0"), "missing bundled CanvasTexture runtime");
  assert.match(source, /zi=768;/);
  assert.match(source, /Yn=384;/);
  assert.ok(/this\.sphereGeometry=new [\w$]+\(this\.ballRadius,40,24\),this\.shadowGeometry=new [\w$]+\(1,48\)/.test(source));
  assert.equal((source.match(/antialias:!1/g) || []).length, 2, "the high-DPR ball layer should not spend frames on multisampling");
  assert.ok(source.includes("equirectangular-map"));
  assert.equal(loadProfiles().length, 16, "every ball should have a dedicated world material");
  assert.match(source, /roughness:n\.roughness,metalness:n\.metalness/);
  assert.match(source, /emissive:n\.emissive\|\|"#000000"/);
  assert.match(source, /emissiveIntensity:Math\.min\(n\.emissiveIntensity\|\|0,\.04\)/);
  assert.ok(source.includes("billiards-hemisphere-fill"));
  assert.ok(source.includes("billiards-key-light"));
  assert.ok(source.includes("billiards-warm-rim-light"));
  assert.ok(source.includes("independent-shadow"));
  assert.ok(/fillText\(String\([\w$]+\)/.test(source), "number glyphs must be painted into the texture");
  assert.match(source, /bbrPaintStyleTexture\(a,e,o,n\)/);
  assert.doesNotMatch(source.slice(source.indexOf("function Cm("), source.indexOf("function Rm(")), /stripe|>8/);
});

test("exposes the frame-driven API with an orthographic transparent WebGL2 renderer", () => {
  assert.ok(source.includes('getContext("webgl2"'));
  assert.ok(source.includes("this.renderer.setClearColor(0,0)"));
  assert.ok(/window\.BilliardsBallRenderer=Object\.freeze\(\{create:[\w$]+,motifs:BBR_MOTIF_DEFINITIONS\}\)/.test(source));
  const layerSource = source.slice(source.indexOf("A 2D canvas is required for billiards ball textures"));
  for (const method of ["resize", "sync", "setMotifs", "render", "dispose"]) {
    assert.ok(new RegExp(`${method}\\(`).test(layerSource), `missing ${method} instance method`);
  }
  assert.ok(!/setAnimationLoop|requestAnimationFrame/.test(layerSource), "the layer must remain frame-driven");
});

test("keeps sixteen scene materials distinct while capping shine and glow", () => {
  const profiles = loadProfiles();
  assert.deepEqual(profiles.map(({ key }) => key), expectedStyleKeys);
  assert.deepEqual(profiles.map(({ cue }) => cue), expectedCueKeys);
  assert.equal(new Set(profiles.map(({ cue }) => cue)).size, 16);

  for (const profile of profiles) {
    assert.match(profile.base, /^#[\da-f]{6}$/i, `${profile.key} is missing a base color`);
    assert.match(profile.deep, /^#[\da-f]{6}$/i, `${profile.key} is missing an edge color`);
    assert.match(profile.accent, /^#[\da-f]{6}$/i, `${profile.key} is missing a cue color`);
    assert.ok(profile.roughness >= 0.2 && profile.roughness <= 0.38, `${profile.key} roughness is outside the restrained PBR range`);
    assert.ok(profile.metalness >= 0 && profile.metalness <= 0.12, `${profile.key} metalness is too strong for a billiards ball`);
    assert.ok((profile.emissiveIntensity || 0) <= 0.04, `${profile.key} emissive intensity is too strong`);
  }
});

test("paints one low-frequency material cue per scene without random texture noise", () => {
  const cueSource = sourceBetween("function bbrPaintMaterialCue(", "function bbrPaintStyleTexture(");
  assert.doesNotMatch(cueSource, /\b(?:for|while)\s*\(/, "material cues must not use repeated full-map patterns");
  assert.doesNotMatch(cueSource, /Math\.random|bbrSeededRandom|globalCompositeOperation|shadowBlur/);

  const sandbox = {};
  vm.runInNewContext(`var zi=768,Yn=384;${cueSource};this.paintCue=bbrPaintMaterialCue;`, sandbox);
  const signatures = new Set();
  const pathOperations = new Set(["moveTo", "lineTo", "bezierCurveTo", "quadraticCurveTo", "arc", "ellipse", "rect", "closePath"]);

  for (const profile of loadProfiles()) {
    const { calls, context } = createRecordingContext();
    assert.equal(sandbox.paintCue(context, profile), true, `${profile.key} cue was not painted`);
    assert.equal(calls.filter(([operation]) => operation === "stroke" || operation === "fill").length, 1, `${profile.key} should paint one cue path`);
    assert.ok(calls.some(([operation, property, value]) => operation === "set" && property === "globalAlpha" && value === 0.24));
    assert.ok(Math.max(...calls.filter(([operation, property]) => operation === "set" && property === "lineWidth").map(([, , value]) => value)) <= 18);
    signatures.add(JSON.stringify(calls.filter(([operation]) => pathOperations.has(operation))));
  }
  assert.equal(signatures.size, 16, "each scene needs a distinct low-frequency cue shape");

  const unknown = createRecordingContext();
  assert.equal(sandbox.paintCue(unknown.context, { cue: "unknown", accent: "#fff" }), false);
  assert.equal(unknown.calls.filter(([operation]) => operation === "stroke").length, 0);
});

test("uses the supplied ball color as a stable foreground band", () => {
  const artworkSource = sourceBetween("function bbrPaintBackground(", "function bbrDrawWorldBadge(");
  assert.doesNotMatch(artworkSource, /\b(?:for|while)\s*\(/);
  assert.doesNotMatch(artworkSource, /Math\.random|bbrSeededRandom|globalCompositeOperation|shadowBlur/);
  assert.match(artworkSource, /bbrPaintBallBand\(i,t,n\)/);
  assert.match(artworkSource, /t===0\|\|bbrPaintMaterialCue\(i,e\)/);

  const bandSource = sourceBetween("function bbrPaintBallBand(", "function bbrPaintMaterialCue(");
  const sandbox = {};
  vm.runInNewContext(`var zi=768,Yn=384;${bandSource};this.paintBand=bbrPaintBallBand;`, sandbox);
  const painted = createRecordingContext();
  sandbox.paintBand(painted.context, 9, "#123456");
  assert.ok(painted.calls.some(([operation, property, value]) => operation === "set" && property === "fillStyle" && value === "#123456"));
  assert.equal(painted.calls.filter(([operation]) => operation === "fillRect").length, 2);
  assert.equal(painted.calls.filter(([operation]) => operation === "stroke").length, 2, "the color band needs dark and light edge separation");

  const cueBall = createRecordingContext();
  sandbox.paintBand(cueBall.context, 0, "#123456");
  assert.equal(cueBall.calls.length, 0, "the cue ball should keep its clean light shell");
});

function loadApi() {
  const window = {};
  vm.runInNewContext(source, {
    window,
    console,
    performance,
    setTimeout,
    clearTimeout
  }, { filename: "billiards-ball-renderer.js" });
  return window.BilliardsBallRenderer;
}

test("keeps the optional narrative motif catalog API intact", () => {
  const api = loadApi();
  const definitions = Array.from(api.motifs, ({ number, key }) => ({ number, key }));
  assert.deepEqual(definitions, expectedMotifKeys.map((key, index) => ({ number: index + 1, key })));
  assert.ok(Object.isFrozen(api.motifs));
  assert.ok(api.motifs.every(Object.isFrozen));

  const shapeStart = source.indexOf("function bbrDrawMotifShape(");
  const shapeEnd = source.indexOf("function bbrDrawMotif(", shapeStart);
  assert.ok(shapeStart > 0 && shapeEnd > shapeStart, "missing motif path renderer");
  const shapeSource = source.slice(shapeStart, shapeEnd);
  assert.doesNotMatch(shapeSource, /drawImage|Image\(|createImageBitmap/, "motifs must not use external images");

  const sandbox = {};
  vm.runInNewContext(`${shapeSource};this.drawMotifShape=bbrDrawMotifShape;`, sandbox);
  const signatures = new Set();
  for (const key of expectedMotifKeys) {
    const calls = [];
    const context = new Proxy({}, {
      get(target, property) {
        target[property] ||= (...args) => calls.push([property, ...args]);
        return target[property];
      }
    });
    assert.equal(sandbox.drawMotifShape(context, key), true, `missing ${key} motif`);
    assert.ok(calls.some(([operation]) => operation === "stroke" || operation === "fill"), `${key} is not painted`);
    signatures.add(JSON.stringify(calls));
  }
  assert.equal(signatures.size, 15, "each ball must have a visually distinct path definition");
  assert.equal(sandbox.drawMotifShape(new Proxy({}, { get: () => () => {} }), "unknown"), false);
});

test("paints high-contrast white number badges above every object-ball texture", () => {
  const textureStart = source.indexOf("function Cm(");
  const textureEnd = source.indexOf("function Rm(", textureStart);
  const textureSource = source.slice(textureStart, textureEnd);
  const artworkCall = textureSource.indexOf("bbrPaintStyleTexture(");
  const badgeCall = textureSource.indexOf("bbrDrawWorldBadge(");

  assert.ok(artworkCall > 0 && badgeCall > artworkCall, "number badges must be painted after world artwork");
  assert.equal((textureSource.match(/bbrDrawWorldBadge\(a,/g) || []).length, 2, "both hemispheres need a readable badge");
  assert.match(textureSource, /let c=Yn\*\.14/);
  assert.match(source, /font="900 "\+\(s>9\?60:70\)\+"px Arial, sans-serif"/);
  assert.match(source, /imageSmoothingQuality="high"/);
  assert.match(source, /shadowMaterial\.opacity=\.46\*Vi/);

  const badgeSource = sourceBetween("function bbrDrawWorldBadge(", "function bbrDrawCueSeal(");
  const sandbox = {};
  vm.runInNewContext(`${badgeSource};this.drawBadge=bbrDrawWorldBadge;`, sandbox);
  const painted = createRecordingContext();
  sandbox.drawBadge(painted.context, 192, 192, 54, 12, { accent: "#789abc" });

  const assignments = painted.calls.filter(([operation]) => operation === "set");
  assert.ok(assignments.some(([, property, value]) => property === "fillStyle" && value === "#fffdf7"));
  assert.ok(assignments.some(([, property, value]) => property === "fillStyle" && value === "#111416"));
  assert.ok(assignments.some(([, property, value]) => property === "strokeStyle" && value === "rgba(13,17,19,.9)"));
  assert.ok(assignments.some(([, property, value]) => property === "lineWidth" && value === 6));
  assert.ok(assignments.some(([, property, value]) => property === "shadowColor" && value === "rgba(0,0,0,.5)"));
  assert.ok(assignments.some(([, property, value]) => property === "shadowBlur" && value === 8));
  assert.ok(painted.calls.some(([operation, value]) => operation === "fillText" && value === "12"));
});

test("returns a complete non-throwing fallback when WebGL2 is unavailable", () => {
  const api = loadApi();
  assert.equal(typeof api?.create, "function");

  let requestedContext = null;
  const fallback = api.create({
    canvas: {
      getContext(name) {
        requestedContext = name;
        return null;
      }
    },
    worldWidth: 720,
    worldHeight: 1440,
    ballRadius: 14.85,
    colors: {}
  });

  assert.equal(requestedContext, "webgl2");
  assert.equal(fallback.supported, false);
  assert.doesNotThrow(() => fallback.resize(360, 720, 3));
  assert.doesNotThrow(() => fallback.sync([{ number: 1, x: 10, y: 20 }]));
  assert.equal(fallback.setMotifs({ enabled: false }), fallback);
  assert.equal(fallback.render(), false);
  assert.doesNotThrow(() => fallback.dispose());
});

test("contains creation failures and still returns the fallback API", () => {
  const api = loadApi();
  assert.doesNotThrow(() => api.create());
  const fallback = api.create({
    canvas: {
      getContext() {
        throw new Error("context creation failed");
      }
    }
  });
  assert.equal(fallback.supported, false);
  assert.equal(typeof fallback.resize, "function");
  assert.equal(typeof fallback.sync, "function");
  assert.equal(typeof fallback.setMotifs, "function");
  assert.equal(typeof fallback.render, "function");
  assert.equal(typeof fallback.dispose, "function");
});
