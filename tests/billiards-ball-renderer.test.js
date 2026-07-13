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
  assert.equal((source.match(/Object\.freeze\(\{key:"/g) || []).length, 16, "every ball should have a dedicated world material");
  assert.match(source, /roughness:n\.roughness,metalness:n\.metalness/);
  assert.match(source, /emissive:n\.emissive\|\|n\.primary/);
  assert.match(source, /emissiveIntensity:Math\.max\(n\.emissiveIntensity\|\|0,t===0\?\.06:\.11\)/);
  assert.ok(source.includes("billiards-hemisphere-fill"));
  assert.ok(source.includes("billiards-key-light"));
  assert.ok(source.includes("billiards-warm-rim-light"));
  assert.ok(source.includes("independent-shadow"));
  assert.ok(/fillText\(String\([\w$]+\)/.test(source), "number glyphs must be painted into the texture");
  assert.match(source, /bbrPaintStyleTexture\(a,e,o\)/);
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

test("defines and code-draws a distinct restrained motif for each object ball", () => {
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

test("keeps a high-contrast world badge painted over every object-ball texture", () => {
  const textureStart = source.indexOf("function Cm(");
  const textureEnd = source.indexOf("function Rm(", textureStart);
  const textureSource = source.slice(textureStart, textureEnd);
  const artworkCall = textureSource.indexOf("bbrPaintStyleTexture(");
  const badgeCall = textureSource.indexOf("bbrDrawWorldBadge(");

  assert.ok(artworkCall > 0 && badgeCall > artworkCall, "number badges must be painted after world artwork");
  assert.equal((textureSource.match(/bbrDrawWorldBadge\(a,/g) || []).length, 2, "both hemispheres need a readable badge");
  assert.match(textureSource, /let c=Yn\*\.132/);
  assert.match(source, /font="800 "\+\(s>9\?58:67\)\+"px Arial, sans-serif"/);
  assert.match(source, /imageSmoothingQuality="high"/);
  assert.match(source, /shadowMaterial\.opacity=\.46\*Vi/);
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
