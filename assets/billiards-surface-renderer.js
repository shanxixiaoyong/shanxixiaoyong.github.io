(function (global) {
  "use strict";

  const MATERIAL_INDEX = Object.freeze({ lava: 0, galaxy: 1, circuit: 2, ice: 3, ink: 4 });
  const VERTEX_SOURCE = `#version 300 es
    in vec2 aPosition;
    out vec2 vUv;
    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;
  const FRAGMENT_SOURCE = `#version 300 es
    precision highp float;

    uniform sampler2D uBase;
    uniform sampler2D uField;
    uniform vec2 uBaseTexel;
    uniform vec2 uFieldTexel;
    uniform float uTime;
    uniform float uEnergy;
    uniform float uBlast;
    uniform int uMaterial;
    in vec2 vUv;
    out vec4 outColor;

    vec4 fieldAt(vec2 uv) {
      return texture(uField, clamp(uv, vec2(0.002), vec2(0.998)));
    }

    vec3 baseAt(vec2 uv) {
      return texture(uBase, clamp(uv, vec2(0.001), vec2(0.999))).rgb;
    }

    float luminance(vec3 color) {
      return dot(color, vec3(0.2126, 0.7152, 0.0722));
    }

    vec3 chromaticSample(vec2 uv, vec2 shift) {
      float red = texture(uBase, clamp(uv + shift, vec2(0.001), vec2(0.999))).r;
      float green = texture(uBase, clamp(uv, vec2(0.001), vec2(0.999))).g;
      float blue = texture(uBase, clamp(uv - shift, vec2(0.001), vec2(0.999))).b;
      return vec3(red, green, blue);
    }

    void main() {
      vec4 field = fieldAt(vUv);
      float height = field.r * 2.0 - 1.0;
      float pigment = field.g;
      float leftHeight = fieldAt(vUv - vec2(uFieldTexel.x, 0.0)).r * 2.0 - 1.0;
      float rightHeight = fieldAt(vUv + vec2(uFieldTexel.x, 0.0)).r * 2.0 - 1.0;
      float downHeight = fieldAt(vUv - vec2(0.0, uFieldTexel.y)).r * 2.0 - 1.0;
      float upHeight = fieldAt(vUv + vec2(0.0, uFieldTexel.y)).r * 2.0 - 1.0;
      vec2 gradient = vec2(rightHeight - leftHeight, upHeight - downHeight);
      float leftPigment = fieldAt(vUv - vec2(uFieldTexel.x, 0.0)).g;
      float rightPigment = fieldAt(vUv + vec2(uFieldTexel.x, 0.0)).g;
      float downPigment = fieldAt(vUv - vec2(0.0, uFieldTexel.y)).g;
      float upPigment = fieldAt(vUv + vec2(0.0, uFieldTexel.y)).g;
      vec2 pigmentGradient = vec2(rightPigment - leftPigment, upPigment - downPigment);
      float slope = length(gradient);
      float pigmentEdge = length(pigmentGradient);
      vec4 wideField = (fieldAt(vUv + vec2(uFieldTexel.x * 2.6, 0.0))
        + fieldAt(vUv - vec2(uFieldTexel.x * 2.6, 0.0))
        + fieldAt(vUv + vec2(0.0, uFieldTexel.y * 2.6))
        + fieldAt(vUv - vec2(0.0, uFieldTexel.y * 2.6))) * 0.25;
      float broadHeight = wideField.r * 2.0 - 1.0;
      float influence = clamp(slope * 4.4 + abs(height - broadHeight) * 0.9
        + abs(broadHeight) * 0.28 + pigment * 0.64 + uBlast, 0.0, 1.0);
      float time = uTime;
      vec2 uv = vUv;
      vec3 color;
      vec2 detailOffset = uBaseTexel * 3.0;
      float detailLeft = luminance(baseAt(vUv - vec2(detailOffset.x, 0.0)));
      float detailRight = luminance(baseAt(vUv + vec2(detailOffset.x, 0.0)));
      float detailDown = luminance(baseAt(vUv - vec2(0.0, detailOffset.y)));
      float detailUp = luminance(baseAt(vUv + vec2(0.0, detailOffset.y)));
      vec2 detailGradient = vec2(detailRight - detailLeft, detailUp - detailDown);
      vec2 detailTangent = normalize(vec2(-detailGradient.y, detailGradient.x) + vec2(0.0001));
      float detailStrength = clamp(length(detailGradient) * 4.8, 0.0, 1.0);
      vec2 guidedFlow = detailTangent * dot(gradient, detailTangent);

      if (uMaterial == 0) {
        vec2 heatFlow = mix(gradient, guidedFlow, 0.62 + detailStrength * 0.24)
          + detailTangent * height * detailStrength * 0.18;
        uv += heatFlow * (0.012 + influence * 0.036);
        vec3 base = baseAt(uv);
        float existingLava = smoothstep(0.08, 0.54, base.r - base.g * 0.58 - base.b * 0.22);
        float lavaPulse = 0.72 + 0.28 * sin(time * 2.2 + height * 8.0);
        float heat = existingLava * influence * (0.45 + pigment * 0.38 + uEnergy * 0.3) * lavaPulse;
        color = base + vec3(1.0, 0.27, 0.018) * heat * 0.58;
        color *= 1.0 + existingLava * influence * vec3(0.17, 0.045, -0.018);
      } else if (uMaterial == 1) {
        vec3 original = baseAt(vUv);
        vec2 swirl = vec2(-gradient.y, gradient.x);
        vec2 stellarFlow = mix(swirl, guidedFlow + detailTangent * height * 0.12, 0.42 + detailStrength * 0.32);
        uv += stellarFlow * (0.04 + influence * 0.098) + gradient * 0.018;
        vec2 spectralShift = normalize(swirl + vec2(0.0001)) * influence * 0.0065;
        color = chromaticSample(uv, spectralShift);
        float value = max(color.r, max(color.g, color.b));
        float chroma = value - min(color.r, min(color.g, color.b));
        float existingNebula = smoothstep(0.1, 0.62, value + chroma * 0.9);
        float lensPulse = 0.82 + 0.18 * sin(time * 1.05 + broadHeight * 8.0);
        color *= 1.0 + existingNebula * influence * lensPulse * 0.34;
        color += color * existingNebula * pigment * 0.16;
        color = max(color, original * (0.74 - influence * 0.05));
      } else if (uMaterial == 2) {
        float linkedPigment = max(pigment,
          max(fieldAt(vUv + detailTangent * uFieldTexel * 7.0).g,
            fieldAt(vUv - detailTangent * uFieldTexel * 7.0).g) * 0.78);
        float charge = smoothstep(0.025, 0.5, pigmentEdge * 2.6 + slope * 1.6
          + linkedPigment * 0.46 + abs(broadHeight) * 0.18);
        vec2 dominant = abs(detailTangent.x) > abs(detailTangent.y)
          ? vec2(detailTangent.x, 0.0) : vec2(0.0, detailTangent.y);
        vec2 circuitFlow = dominant * dot(gradient, dominant);
        uv += circuitFlow * (0.052 + charge * 0.078) + gradient * 0.01;
        vec2 spectralShift = normalize(dominant + vec2(0.0001)) * charge * 0.0048;
        color = chromaticSample(uv, spectralShift);
        float value = max(color.r, max(color.g, color.b));
        float chroma = value - min(color.r, min(color.g, color.b));
        float existingCircuit = smoothstep(0.13, 0.7, value * 0.68 + chroma * 0.94);
        float linePulse = 0.6 + 0.4 * sin(time * 8.0 - broadHeight * 13.0);
        color *= 1.0 + existingCircuit * charge * (0.46 + linePulse * 0.58);
        color += color * existingCircuit * pigment * 0.25;
      } else if (uMaterial == 3) {
        vec3 original = baseAt(vUv);
        vec2 refractDirection = normalize(gradient + pigmentGradient * 0.7 + vec2(0.0001));
        vec2 iceFlow = mix(gradient, guidedFlow, 0.56 + detailStrength * 0.28);
        uv += iceFlow * (0.018 + influence * 0.058) + refractDirection * broadHeight * 0.003;
        float fracture = smoothstep(0.018, 0.21, pigmentEdge * 3.2 + slope * 1.18);
        vec2 spectralShift = refractDirection * fracture * 0.007;
        color = chromaticSample(uv, spectralShift);
        float baseValue = luminance(color);
        vec3 edgeSample = baseAt(uv + uBaseTexel * 2.0) - baseAt(uv - uBaseTexel * 2.0);
        float existingIce = smoothstep(0.24, 0.78, baseValue + length(edgeSample) * 1.8);
        float facetPulse = 0.72 + 0.28 * sin(time * 2.9 + height * 11.0);
        color *= 1.0 + existingIce * fracture * facetPulse * 0.52;
        color += color * existingIce * influence * 0.2;
        color = max(color, original * (0.78 - influence * 0.06));
      } else {
        vec2 curl = vec2(-gradient.y, gradient.x) + pigmentGradient * 0.42;
        vec2 brushFlow = mix(curl, guidedFlow + detailTangent * broadHeight * 0.16, 0.58 + detailStrength * 0.24);
        uv += brushFlow * (0.045 + pigment * 0.1) + gradient * 0.016;
        vec2 spread = normalize(curl + vec2(0.0001)) * (0.003 + pigment * 0.013);
        vec3 center = baseAt(uv);
        vec3 wet = center;
        wet += baseAt(uv + spread);
        wet += baseAt(uv - spread);
        wet += baseAt(uv + vec2(-spread.y, spread.x));
        wet += baseAt(uv - vec2(-spread.y, spread.x));
        wet *= 0.2;
        float inkDensity = smoothstep(0.13, 0.82, 1.0 - luminance(center));
        float wetness = smoothstep(0.04, 0.78, pigment + influence * 0.38);
        color = mix(center, wet, wetness * (0.68 + inkDensity * 0.24));
        color *= 1.0 - inkDensity * wetness * 0.32;
        color += color * (1.0 - inkDensity) * influence * 0.035;
      }

      float vignette = smoothstep(0.92, 0.3, length((vUv - 0.5) * vec2(1.15, 0.72)));
      color *= 0.88 + vignette * 0.12;
      outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `;

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || "Surface shader compilation failed";
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  function createProgram(gl) {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SOURCE);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) || "Surface program linking failed";
      gl.deleteProgram(program);
      throw new Error(message);
    }
    return program;
  }

  function configureTexture(gl, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  function create(options = {}) {
    const documentRef = options.document || global.document;
    if (!documentRef?.createElement) return null;
    const canvas = documentRef.createElement("canvas");
    const gl = canvas.getContext?.("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance"
    });
    if (!gl) return null;

    let program;
    try {
      program = createProgram(gl);
    } catch (error) {
      return null;
    }

    const position = gl.getAttribLocation(program, "aPosition");
    const uniforms = {
      base: gl.getUniformLocation(program, "uBase"),
      field: gl.getUniformLocation(program, "uField"),
      baseTexel: gl.getUniformLocation(program, "uBaseTexel"),
      fieldTexel: gl.getUniformLocation(program, "uFieldTexel"),
      time: gl.getUniformLocation(program, "uTime"),
      energy: gl.getUniformLocation(program, "uEnergy"),
      blast: gl.getUniformLocation(program, "uBlast"),
      material: gl.getUniformLocation(program, "uMaterial")
    };
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const baseTexture = gl.createTexture();
    const fieldTexture = gl.createTexture();
    configureTexture(gl, baseTexture);
    configureTexture(gl, fieldTexture);
    let baseSource = null;
    let fieldPixels = null;
    let fieldWidth = 0;
    let fieldHeight = 0;
    let active = true;

    function resize(width, height) {
      const nextWidth = Math.max(2, Math.round(width));
      const nextHeight = Math.max(2, Math.round(height));
      if (canvas.width === nextWidth && canvas.height === nextHeight) return;
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      gl.viewport(0, 0, nextWidth, nextHeight);
    }

    function uploadBase(source) {
      if (!source || source === baseSource) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, baseTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      baseSource = source;
    }

    function uploadField(current, pigment, width, height) {
      const dimensionsChanged = !fieldPixels || fieldWidth !== width || fieldHeight !== height;
      if (dimensionsChanged) {
        fieldWidth = width;
        fieldHeight = height;
        fieldPixels = new Uint8Array(width * height * 4);
      }
      for (let y = 0; y < height; y += 1) {
        const destinationY = height - 1 - y;
        for (let x = 0; x < width; x += 1) {
          const sourceIndex = y * width + x;
          const destination = (destinationY * width + x) * 4;
          const heightValue = Math.max(-1, Math.min(1, (current[sourceIndex] || 0) / 3.2));
          fieldPixels[destination] = Math.round((heightValue * 0.5 + 0.5) * 255);
          fieldPixels[destination + 1] = Math.round(Math.max(0, Math.min(1, pigment[sourceIndex] || 0)) * 255);
          fieldPixels[destination + 2] = 0;
          fieldPixels[destination + 3] = 255;
        }
      }
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      if (dimensionsChanged) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, fieldPixels);
      } else {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, fieldPixels);
      }
    }

    function render(frame) {
      if (!active || !frame?.base || !frame.current || !frame.pigment) return null;
      try {
        resize(frame.width, frame.height);
        uploadBase(frame.base);
        uploadField(frame.current, frame.pigment, frame.fieldWidth, frame.fieldHeight);
        gl.useProgram(program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, baseTexture);
        gl.uniform1i(uniforms.base, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
        gl.uniform1i(uniforms.field, 1);
        gl.uniform2f(uniforms.baseTexel, 1 / canvas.width, 1 / canvas.height);
        gl.uniform2f(uniforms.fieldTexel, 1 / frame.fieldWidth, 1 / frame.fieldHeight);
        gl.uniform1f(uniforms.time, (frame.time || 0) * 0.001);
        gl.uniform1f(uniforms.energy, Math.max(0, Math.min(1, frame.energy || 0)));
        gl.uniform1f(uniforms.blast, Math.max(0, Math.min(1, frame.blast || 0)));
        gl.uniform1i(uniforms.material, MATERIAL_INDEX[frame.materialId] ?? 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        return canvas;
      } catch (error) {
        active = false;
        return null;
      }
    }

    return Object.freeze({
      canvas,
      render,
      snapshot() {
        return Object.freeze({ active, width: canvas.width, height: canvas.height, fieldWidth, fieldHeight });
      },
      destroy() {
        active = false;
        gl.deleteTexture(baseTexture);
        gl.deleteTexture(fieldTexture);
        gl.deleteBuffer(vertexBuffer);
        gl.deleteProgram(program);
      }
    });
  }

  global.BilliardsSurfaceRenderer = Object.freeze({ create });
})(window);
