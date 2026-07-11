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

test("builds equirectangular numbered textures, physically lit sphere materials, and separate shadows", () => {
  for (const type of [
    "SphereGeometry", "MeshStandardMaterial",
    "HemisphereLight", "DirectionalLight", "PointLight", "OrthographicCamera"
  ]) {
    assert.ok(source.includes(`\"${type}\"`), `missing bundled Three type ${type}`);
  }
  assert.ok(source.includes("isCanvasTexture=!0"), "missing bundled CanvasTexture runtime");
  assert.ok(/this\.sphereGeometry=new [\w$]+\(this\.ballRadius,32,16\),this\.shadowGeometry=new [\w$]+\(1,48\)/.test(source));
  assert.equal((source.match(/antialias:!1/g) || []).length, 2, "the high-DPR ball layer should not spend frames on multisampling");
  assert.ok(source.includes("equirectangular-map"));
  assert.ok(source.includes("roughness:.19,metalness:0"));
  assert.ok(source.includes("billiards-hemisphere-fill"));
  assert.ok(source.includes("billiards-key-light"));
  assert.ok(source.includes("billiards-warm-rim-light"));
  assert.ok(source.includes("independent-shadow"));
  assert.ok(/fillText\(String\([\w$]+\)/.test(source), "number glyphs must be painted into the texture");
  assert.ok(/=[\w$]+>8,[\w$]+="#f5f0e7"/.test(source), "stripe balls must use a distinct latitudinal map");
});

test("exposes the frame-driven API with an orthographic transparent WebGL2 renderer", () => {
  assert.ok(source.includes('getContext("webgl2"'));
  assert.ok(source.includes("this.renderer.setClearColor(0,0)"));
  assert.ok(/window\.BilliardsBallRenderer=Object\.freeze\(\{create:[\w$]+\}\)/.test(source));
  const layerSource = source.slice(source.indexOf("A 2D canvas is required for billiards ball textures"));
  for (const method of ["resize", "sync", "render", "dispose"]) {
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
  assert.equal(typeof fallback.render, "function");
  assert.equal(typeof fallback.dispose, "function");
});
