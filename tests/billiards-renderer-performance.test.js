const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const ballSource = fs.readFileSync(path.join(root, "assets/billiards-ball-renderer.js"), "utf8");
const surfaceSource = fs.readFileSync(path.join(root, "assets/billiards-surface-renderer.js"), "utf8");

function createRecordingWebGL2() {
  const calls = Object.create(null);
  const record = (name, result) => (...args) => {
    calls[name] = (calls[name] || 0) + 1;
    return typeof result === "function" ? result(...args) : result;
  };
  let resourceId = 0;
  const resource = (type) => ({ type, id: ++resourceId });
  const gl = {
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    COMPILE_STATUS: 0x8b81,
    LINK_STATUS: 0x8b82,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88e4,
    FLOAT: 0x1406,
    TEXTURE_2D: 0x0de1,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    LINEAR: 0x2601,
    CLAMP_TO_EDGE: 0x812f,
    TEXTURE0: 0x84c0,
    TEXTURE1: 0x84c1,
    TEXTURE2: 0x84c2,
    UNPACK_FLIP_Y_WEBGL: 0x9240,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    TRIANGLES: 0x0004,
    createShader: record("createShader", () => resource("shader")),
    shaderSource: record("shaderSource"),
    compileShader: record("compileShader"),
    getShaderParameter: record("getShaderParameter", true),
    getShaderInfoLog: record("getShaderInfoLog", ""),
    deleteShader: record("deleteShader"),
    createProgram: record("createProgram", () => resource("program")),
    attachShader: record("attachShader"),
    linkProgram: record("linkProgram"),
    getProgramParameter: record("getProgramParameter", true),
    getProgramInfoLog: record("getProgramInfoLog", ""),
    deleteProgram: record("deleteProgram"),
    getAttribLocation: record("getAttribLocation", 0),
    getUniformLocation: record("getUniformLocation", (program, name) => name),
    createBuffer: record("createBuffer", () => resource("buffer")),
    bindBuffer: record("bindBuffer"),
    bufferData: record("bufferData"),
    enableVertexAttribArray: record("enableVertexAttribArray"),
    vertexAttribPointer: record("vertexAttribPointer"),
    createTexture: record("createTexture", () => resource("texture")),
    bindTexture: record("bindTexture"),
    texParameteri: record("texParameteri"),
    useProgram: record("useProgram"),
    activeTexture: record("activeTexture"),
    pixelStorei: record("pixelStorei"),
    texImage2D: record("texImage2D"),
    texSubImage2D: record("texSubImage2D"),
    viewport: record("viewport"),
    uniform1f: record("uniform1f"),
    uniform1i: record("uniform1i"),
    uniform2f: record("uniform2f"),
    uniform3f: record("uniform3f"),
    uniform1fv: record("uniform1fv"),
    uniform2fv: record("uniform2fv"),
    uniform3fv: record("uniform3fv"),
    drawArrays: record("drawArrays"),
    deleteTexture: record("deleteTexture"),
    deleteBuffer: record("deleteBuffer")
  };
  const canvas = {
    width: 300,
    height: 150,
    getContext(name) {
      assert.equal(name, "webgl2");
      return gl;
    }
  };
  return { calls, canvas, gl };
}

function loadSurfaceRenderer(recording) {
  const window = {};
  const document = {
    createElement(name) {
      assert.equal(name, "canvas");
      return recording.canvas;
    }
  };
  vm.runInNewContext(surfaceSource, { window }, { filename: "billiards-surface-renderer.js" });
  return window.BilliardsSurfaceRenderer.create({ document });
}

test("ball renderer caches stable state and updates matrices explicitly", () => {
  const customSource = ballSource.slice(ballSource.indexOf("var Tm="));
  const motifSource = customSource.slice(
    customSource.indexOf("setMotifs("),
    customSource.indexOf("resize(", customSource.indexOf("setMotifs("))
  );

  assert.match(customSource, /function bbrBallStateHash\(/);
  assert.match(customSource, /this\.syncRevision=0/);
  assert.match(customSource, /if\(x===c\.stateHash&&c\.hasPosition\)continue/);
  assert.match(customSource, /this\.sceneRevision=1,this\.renderedRevision=0/);
  assert.match(customSource, /if\(this\.renderedRevision===this\.sceneRevision\)return!0/);
  assert.match(customSource, /if\(!o&&!c\)return this/);
  assert.ok((customSource.match(/matrixAutoUpdate=!1/g) || []).length >= 7);
  assert.doesNotMatch(motifSource, /material\.needsUpdate/);
  assert.match(customSource, /this\.sphereGeometry=new [\w$]+\(this\.ballRadius,40,24\)/);
  assert.match(customSource, /zi=768;/);
  assert.match(customSource, /Yn=384;/);
});

test("surface renderer reuses a motionless frame without resize, upload, or draw", () => {
  const recording = createRecordingWebGL2();
  const renderer = loadSurfaceRenderer(recording);
  assert.ok(renderer);

  const base = {};
  const current = new Float32Array(4);
  const pigment = new Float32Array(4);
  const frame = {
    base,
    current,
    pigment,
    fieldRevision: 1,
    fieldWidth: 2,
    fieldHeight: 2,
    width: 320,
    height: 640,
    time: 1000,
    energy: 0,
    blast: 0,
    transition: null,
    materialId: "ink"
  };

  assert.equal(renderer.render(frame), recording.canvas);
  assert.equal(recording.calls.viewport, 1);
  assert.equal(recording.calls.texImage2D, 3);
  assert.equal(recording.calls.texSubImage2D || 0, 0);
  assert.equal(recording.calls.drawArrays, 1);

  frame.time = 2000;
  assert.equal(renderer.render(frame), recording.canvas);
  assert.equal(recording.calls.viewport, 1, "stable dimensions must not reset the drawing buffer");
  assert.equal(recording.calls.texImage2D, 3, "stable sources must stay resident on the GPU");
  assert.equal(recording.calls.texSubImage2D || 0, 0);
  assert.equal(recording.calls.drawArrays, 1, "time alone must not redraw a motionless field");

  current[0] = 1.6;
  frame.fieldRevision = 2;
  frame.time = 3000;
  renderer.render(frame);
  assert.equal(recording.calls.texSubImage2D, 1);
  assert.equal(recording.calls.drawArrays, 2);

  current[0] += 0.00001;
  frame.fieldRevision = 3;
  frame.time = 4000;
  renderer.render(frame);
  assert.equal(recording.calls.texSubImage2D, 1, "sub-byte field changes must not re-upload identical texels");
  assert.equal(recording.calls.drawArrays, 2, "identical GPU-visible state must reuse the prior frame");

  frame.energy = 0.5;
  frame.time = 5000;
  renderer.render(frame);
  assert.equal(recording.calls.drawArrays, 3);
  renderer.render(frame);
  assert.equal(recording.calls.drawArrays, 3, "an identical dynamic timestamp must not draw twice");
  frame.time = 5100;
  renderer.render(frame);
  assert.equal(recording.calls.drawArrays, 4, "active displacement still advances with time");
  assert.equal(recording.calls.texSubImage2D, 1, "animation uniforms must not force texture uploads");

  frame.energy = 0;
  frame.width = 321;
  renderer.render(frame);
  assert.equal(recording.calls.viewport, 2);
  assert.equal(recording.calls.drawArrays, 5, "a resized drawing buffer must be repainted once");
});

test("surface source revisions upload mutable artwork only when requested", () => {
  const recording = createRecordingWebGL2();
  const renderer = loadSurfaceRenderer(recording);
  const base = {};
  const frame = {
    base,
    previousBase: base,
    baseRevision: 1,
    previousBaseRevision: 1,
    current: new Float32Array(4),
    pigment: new Float32Array(4),
    fieldRevision: 1,
    fieldWidth: 2,
    fieldHeight: 2,
    width: 320,
    height: 640,
    materialId: "ink"
  };

  renderer.render(frame);
  assert.equal(recording.calls.texImage2D, 3);
  renderer.render(frame);
  assert.equal(recording.calls.texImage2D, 3);

  frame.baseRevision = 2;
  frame.previousBaseRevision = 2;
  renderer.render(frame);
  assert.equal(recording.calls.texImage2D, 5);
  assert.equal(recording.calls.drawArrays, 2);
});
