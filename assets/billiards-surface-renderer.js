(function (global) {
  "use strict";

  const MATERIAL_INDEX = Object.freeze({
    lava: 0, galaxy: 1, circuit: 2, amethyst: 3, ink: 4,
    gold: 5, amber: 6, emerald: 7, burgundy: 8, eclipse: 9,
    "solar-porcelain": 10, abyss: 11, "crimson-storm": 12,
    copper: 13, "jade-mist": 14, "rose-quartz": 15
  });
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
    uniform sampler2D uPreviousBase;
    uniform sampler2D uField;
    uniform vec2 uBaseTexel;
    uniform vec2 uFieldTexel;
    uniform float uTime;
    uniform float uEnergy;
    uniform float uBlast;
    uniform float uBlastProgress;
    uniform vec2 uBlastOrigin;
    uniform float uTransitionActive;
    uniform float uTransitionProgress;
    uniform float uAspect;
    uniform vec2 uTransitionOrigin;
    uniform vec3 uTransitionColor;
    uniform int uMaterial;
    in vec2 vUv;
    out vec4 outColor;

    vec4 fieldAt(vec2 uv) {
      return texture(uField, clamp(uv, vec2(0.002), vec2(0.998)));
    }

    vec3 baseAt(vec2 uv) {
      return texture(uBase, clamp(uv, vec2(0.001), vec2(0.999))).rgb;
    }

    vec3 previousBaseAt(vec2 uv) {
      return texture(uPreviousBase, clamp(uv, vec2(0.001), vec2(0.999))).rgb;
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

    float hash21(vec2 point) {
      point = fract(point * vec2(123.34, 456.21));
      point += dot(point, point + 45.32);
      return fract(point.x * point.y);
    }

    float softNoise(vec2 point) {
      vec2 cell = floor(point);
      vec2 local = fract(point);
      local = local * local * (3.0 - 2.0 * local);
      return mix(
        mix(hash21(cell), hash21(cell + vec2(1.0, 0.0)), local.x),
        mix(hash21(cell + vec2(0.0, 1.0)), hash21(cell + vec2(1.0)), local.x),
        local.y
      );
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
      float influence = clamp(slope * 5.6 + abs(height - broadHeight) * 1.08
        + abs(broadHeight) * 0.36 + pigment * 0.78 + uBlast * 0.22, 0.0, 1.0);
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
        uv += heatFlow * (0.02 + influence * 0.066);
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
        uv += stellarFlow * (0.06 + influence * 0.148) + gradient * 0.027;
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
        uv += circuitFlow * (0.074 + charge * 0.116) + gradient * 0.018;
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
        uv += iceFlow * (0.031 + influence * 0.096) + refractDirection * broadHeight * 0.005;
        float fracture = smoothstep(0.018, 0.21, pigmentEdge * 3.2 + slope * 1.18);
        vec2 spectralShift = refractDirection * fracture * 0.007;
        color = chromaticSample(uv, spectralShift);
        float baseValue = luminance(color);
        vec3 edgeSample = baseAt(uv + uBaseTexel * 2.0) - baseAt(uv - uBaseTexel * 2.0);
        float existingIce = smoothstep(0.18, 0.72, baseValue + length(edgeSample) * 1.8);
        float facetPulse = 0.72 + 0.28 * sin(time * 2.9 + height * 11.0);
        color *= 1.0 + existingIce * fracture * facetPulse * 0.52;
        color += vec3(0.32, 0.08, 0.52) * existingIce * influence * 0.16;
        color = max(color, original * (0.78 - influence * 0.06));
      } else if (uMaterial == 4) {
        vec2 curl = vec2(-gradient.y, gradient.x) + pigmentGradient * 0.42;
        vec2 brushFlow = mix(curl, guidedFlow + detailTangent * broadHeight * 0.16, 0.58 + detailStrength * 0.24);
        uv += brushFlow * (0.066 + pigment * 0.162) + gradient * 0.026;
        vec2 spread = normalize(curl + vec2(0.0001)) * (0.004 + pigment * 0.016);
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
      } else if (uMaterial == 5) {
        vec2 solarFlow = mix(gradient, guidedFlow + detailTangent * height * 0.24, 0.72);
        uv += solarFlow * (0.029 + influence * 0.086);
        vec3 base = baseAt(uv);
        float existingGold = smoothstep(0.06, 0.58, base.r * 0.78 + base.g * 0.42 - base.b * 0.5);
        float pulse = 0.7 + 0.3 * sin(time * 2.6 + height * 10.0);
        color = base + vec3(1.0, 0.62, 0.08) * existingGold * influence * pulse * 0.54;
        color *= 1.0 + existingGold * pigment * vec3(0.18, 0.09, -0.02);
      } else if (uMaterial == 6) {
        vec3 original = baseAt(vUv);
        vec2 viscousCurl = vec2(-gradient.y, gradient.x) * (0.72 + pigment * 0.48);
        vec2 amberFlow = mix(viscousCurl, guidedFlow, 0.46 + detailStrength * 0.3);
        uv += amberFlow * (0.061 + influence * 0.154) + gradient * 0.023;
        vec2 spread = normalize(amberFlow + vec2(0.0001)) * (0.003 + influence * 0.009);
        color = (baseAt(uv) * 2.0 + baseAt(uv + spread) + baseAt(uv - spread)) * 0.25;
        float existingAmber = smoothstep(0.08, 0.62, color.r * 0.7 + color.g * 0.16 - color.b * 0.42);
        color += vec3(1.0, 0.38, 0.02) * existingAmber * influence * 0.34;
        color = max(color, original * (0.76 - influence * 0.05));
      } else if (uMaterial == 7) {
        vec3 original = baseAt(vUv);
        vec2 tide = mix(vec2(-gradient.y, gradient.x), guidedFlow, 0.62 + detailStrength * 0.24);
        uv += tide * (0.055 + influence * 0.146) + gradient * 0.026;
        vec2 spectralShift = normalize(tide + vec2(0.0001)) * influence * 0.0045;
        color = chromaticSample(uv, spectralShift);
        float existingEmerald = smoothstep(0.05, 0.58, color.g * 0.82 - color.r * 0.22 - color.b * 0.08);
        float caustic = 0.68 + 0.32 * sin(time * 2.1 + broadHeight * 12.0);
        color += vec3(0.08, 0.94, 0.48) * existingEmerald * influence * caustic * 0.28;
        color = max(color, original * (0.78 - influence * 0.04));
      } else if (uMaterial == 8) {
        vec3 original = baseAt(vUv);
        vec2 crystalFlow = mix(gradient, guidedFlow, 0.64 + detailStrength * 0.26);
        uv += crystalFlow * (0.041 + influence * 0.12);
        vec2 spectralShift = normalize(crystalFlow + vec2(0.0001)) * influence * 0.0042;
        color = chromaticSample(uv, spectralShift);
        float existingRuby = smoothstep(0.04, 0.52, color.r * 0.8 - color.g * 0.36 - color.b * 0.12);
        float crystalPulse = 0.74 + 0.26 * sin(time * 3.2 + height * 9.0);
        color += vec3(0.82, 0.04, 0.18) * existingRuby * influence * crystalPulse * 0.34;
        color = max(color, original * (0.8 - influence * 0.05));
      } else if (uMaterial == 9) {
        vec2 centerDelta = (vUv - vec2(0.5)) * vec2(uAspect, 1.0);
        vec2 orbit = normalize(vec2(-centerDelta.y, centerDelta.x) + vec2(0.0001));
        vec2 lensFlow = orbit * (height * 0.06 + pigment * 0.026) + guidedFlow * 0.78;
        uv += lensFlow * (0.075 + influence * 0.13) + gradient * 0.025;
        vec2 spectralShift = orbit * influence * 0.009;
        color = chromaticSample(uv, spectralShift);
        float voidTone = smoothstep(0.12, 0.7, 1.0 - luminance(color));
        float corona = smoothstep(0.12, 0.78, color.r + color.b * 0.68 - color.g * 0.44);
        color *= 0.93 - voidTone * influence * 0.2;
        color += vec3(0.8, 0.36, 1.0) * corona * influence * 0.16;
        color += vec3(1.0, 0.64, 0.2) * pigmentEdge * (0.18 + influence * 0.42);
      } else if (uMaterial == 10) {
        vec2 porcelainFlow = mix(gradient, guidedFlow, 0.76 + detailStrength * 0.16);
        uv += porcelainFlow * (0.028 + influence * 0.074);
        vec3 original = baseAt(vUv);
        color = baseAt(uv);
        float veins = smoothstep(0.1, 0.58, color.r * 0.58 + color.g * 0.34 - color.b * 0.3);
        float glaze = 0.74 + 0.26 * sin(time * 1.7 + broadHeight * 10.0);
        color += vec3(1.0, 0.67, 0.16) * veins * influence * glaze * 0.28;
        color = max(color, original * 0.82);
      } else if (uMaterial == 11) {
        vec3 original = baseAt(vUv);
        vec2 currentFlow = mix(vec2(-gradient.y, gradient.x), guidedFlow, 0.66 + detailStrength * 0.2);
        uv += currentFlow * (0.072 + influence * 0.17) + gradient * 0.034;
        vec2 causticShift = normalize(currentFlow + vec2(0.0001)) * influence * 0.0055;
        color = chromaticSample(uv, causticShift);
        float cyan = smoothstep(0.06, 0.56, color.b * 0.76 + color.g * 0.42 - color.r * 0.28);
        float caustic = 0.66 + 0.34 * sin(time * 2.45 + broadHeight * 13.0);
        color += vec3(0.02, 0.56, 1.0) * cyan * influence * caustic * 0.3;
        color = max(color, original * (0.76 - influence * 0.04));
      } else if (uMaterial == 12) {
        vec2 stormFlow = mix(gradient, guidedFlow + detailTangent * height * 0.28, 0.56 + detailStrength * 0.25);
        uv += stormFlow * (0.045 + influence * 0.12);
        color = baseAt(uv);
        float charge = smoothstep(0.02, 0.36, pigmentEdge * 2.8 + slope * 1.5 + pigment * 0.46);
        float pulse = 0.54 + 0.46 * sin(time * 6.1 + height * 15.0);
        color += vec3(1.0, 0.08, 0.12) * charge * (0.28 + pulse * 0.44);
        color *= 1.0 + vec3(0.22, -0.035, -0.035) * influence;
      } else if (uMaterial == 13) {
        vec3 original = baseAt(vUv);
        vec2 metalCurl = mix(vec2(-gradient.y, gradient.x), guidedFlow, 0.5 + detailStrength * 0.34);
        uv += metalCurl * (0.062 + influence * 0.154) + gradient * 0.018;
        vec2 spread = normalize(metalCurl + vec2(0.0001)) * (0.0025 + influence * 0.007);
        color = (baseAt(uv) * 2.0 + baseAt(uv + spread) + baseAt(uv - spread)) * 0.25;
        float copperGlow = smoothstep(0.05, 0.58, color.r * 0.78 + color.g * 0.15 - color.b * 0.46);
        color += vec3(1.0, 0.28, 0.035) * copperGlow * influence * 0.34;
        color = max(color, original * 0.76);
      } else if (uMaterial == 14) {
        vec3 original = baseAt(vUv);
        vec2 mistFlow = mix(vec2(-gradient.y, gradient.x) + pigmentGradient * 0.34, guidedFlow, 0.7);
        uv += mistFlow * (0.06 + influence * 0.15) + gradient * 0.022;
        color = baseAt(uv);
        float jade = smoothstep(0.04, 0.56, color.g * 0.76 - color.r * 0.2 - color.b * 0.04);
        float breath = 0.72 + 0.28 * sin(time * 1.55 + broadHeight * 9.0);
        color += vec3(0.24, 0.88, 0.58) * jade * influence * breath * 0.24;
        color = max(color, original * (0.79 - influence * 0.04));
      } else {
        vec3 original = baseAt(vUv);
        vec2 quartzFlow = mix(gradient, guidedFlow, 0.68 + detailStrength * 0.24);
        uv += quartzFlow * (0.044 + influence * 0.126);
        vec2 spectralShift = normalize(quartzFlow + vec2(0.0001)) * influence * 0.006;
        color = chromaticSample(uv, spectralShift);
        float rose = smoothstep(0.05, 0.56, color.r * 0.72 + color.b * 0.18 - color.g * 0.28);
        float pearl = 0.7 + 0.3 * sin(time * 2.7 + height * 10.0);
        color += vec3(1.0, 0.24, 0.5) * rose * influence * pearl * 0.24;
        color = max(color, original * 0.79);
      }

      if (uTransitionActive > 0.5) {
        vec2 transitionDelta = (vUv - uTransitionOrigin) * vec2(uAspect, 1.0);
        float transitionDistance = length(transitionDelta);
        float transitionAngle = atan(transitionDelta.y, transitionDelta.x);
        float transitionEase = smoothstep(0.0, 1.0, uTransitionProgress);
        float coarseFlow = softNoise(vUv * vec2(4.2, 7.4) + vec2(time * 0.11, -time * 0.075));
        float middleFlow = softNoise(vUv * vec2(10.0, 17.0) + vec2(-time * 0.16, time * 0.1));
        float fineFlow = softNoise(vUv * vec2(25.0, 43.0) + vec2(time * 0.23, time * 0.16));
        float boundaryNoise = sin(transitionAngle * 3.0 + time * 1.3 + float(uMaterial)) * 0.058
          + sin(transitionAngle * 7.0 - time * 0.9 + height * 6.0) * 0.026
          + (coarseFlow - 0.5) * 0.19
          + (middleFlow - 0.5) * 0.085
          + (fineFlow - 0.5) * 0.024
          + broadHeight * 0.025;
        float radius = mix(-0.028, 1.34, transitionEase);
        float signedDistance = transitionDistance + boundaryNoise - radius;
        float reveal = 1.0 - smoothstep(-0.09, 0.052, signedDistance);
        float tendrilField = softNoise(
          vUv * vec2(18.0, 31.0)
            + vec2(cos(transitionAngle), sin(transitionAngle)) * 2.4
            + vec2(-time * 0.18, time * 0.24)
        );
        float tendril = smoothstep(0.68, 0.94, tendrilField + middleFlow * 0.16)
          * smoothstep(-0.12, 0.025, signedDistance)
          * (1.0 - smoothstep(0.025, 0.22, signedDistance));
        reveal = max(reveal, tendril * (0.62 + (1.0 - uTransitionProgress) * 0.28));
        vec2 radial = normalize(transitionDelta + vec2(0.0001));
        vec2 tangent = vec2(-radial.y, radial.x);
        vec2 lens = (radial * sin(signedDistance * 62.0 - time * 4.2)
          + tangent * sin(transitionAngle * 5.0 + time * 1.7 + coarseFlow * 4.0))
          * exp(-abs(signedDistance) * 16.0) * 0.018;
        vec3 previous = previousBaseAt(vUv + gradient * 0.012 - lens);
        color = mix(previous, color, clamp(reveal, 0.0, 1.0));
        float boundary = exp(-pow(abs(signedDistance) / 0.052, 2.0)) * (0.58 + middleFlow * 0.42);
        float echo = exp(-pow(abs(signedDistance + 0.095) / 0.028, 2.0)) * (0.5 + fineFlow * 0.5);
        float sparkCell = hash21(floor(vUv * vec2(170.0, 300.0)) + floor(time * 24.0));
        float sparks = step(0.97, sparkCell) * exp(-abs(signedDistance) * 20.0);
        float glowLife = 1.0 - smoothstep(0.82, 1.0, uTransitionProgress);
        vec3 edgeColor = uMaterial == 4 ? vec3(0.84, 0.88, 0.83) : uTransitionColor;
        color += edgeColor * (boundary * (0.5 + influence * 0.34) + echo * 0.24 + sparks * 0.68) * glowLife;
        if (uMaterial == 4) color *= 1.0 - boundary * 0.16;
        if (uMaterial == 9) {
          color += vec3(0.98, 0.55, 0.16) * boundary * glowLife * 0.46;
          color += vec3(0.55, 0.24, 1.0) * echo * glowLife * 0.4;
        }
      }

      if (uBlast > 0.001) {
        vec2 blastDelta = (vUv - uBlastOrigin) * vec2(uAspect, 1.0);
        float blastDistance = length(blastDelta);
        vec2 blastRadial = normalize(blastDelta + vec2(0.0001));
        vec2 blastTangent = vec2(-blastRadial.y, blastRadial.x);
        float blastAngle = atan(blastDelta.y, blastDelta.x);
        float turbulence = softNoise(vUv * vec2(7.0, 12.0) + vec2(time * 0.14, -time * 0.1));
        float filamentNoise = softNoise(vUv * vec2(19.0, 34.0) + vec2(-time * 0.22, time * 0.16));
        float collapse = smoothstep(0.0, 0.26, uBlastProgress);
        float release = 1.0 - smoothstep(0.78, 1.0, uBlastProgress);
        float coronaRadius = mix(0.018, 0.82, smoothstep(0.02, 0.76, uBlastProgress));
        float warp = exp(-blastDistance * (2.8 + collapse * 4.2)) * uBlast * release * 0.46;
        float spiral = sin(blastAngle * 4.0 - blastDistance * 30.0 + time * 2.0 + turbulence * 5.5);
        vec2 warpedUv = vUv
          + blastTangent * warp * (0.03 + 0.01 * spiral)
          - blastRadial * warp * (0.007 + turbulence * 0.007);
        vec3 lensed = chromaticSample(warpedUv, blastTangent * warp * 0.0035);
        color = mix(color, lensed, clamp(warp * 1.25, 0.0, 0.38));
        float core = 1.0 - smoothstep(0.008, 0.105 + uBlastProgress * 0.055, blastDistance);
        float raggedEdge = (turbulence - 0.5) * (0.018 + uBlastProgress * 0.012);
        float corona = exp(-pow(abs(blastDistance + raggedEdge - coronaRadius) / (0.014 + uBlastProgress * 0.012), 2.0));
        float filamentWave = 0.5 + 0.5 * sin(
          blastAngle * 5.0 - blastDistance * 36.0 + time * 2.35 + turbulence * 6.0
        );
        float textureLight = smoothstep(0.16, 0.76, luminance(lensed) + detailStrength * 0.72);
        float filaments = smoothstep(0.9, 0.995, filamentWave + (filamentNoise - 0.5) * 0.2)
          * (1.0 - smoothstep(0.08, 1.05, blastDistance))
          * smoothstep(0.035, 0.15, blastDistance)
          * textureLight;
        float violetFlow = smoothstep(0.91, 0.998, 0.5 + 0.5 * sin(
          blastAngle * 3.0 + blastDistance * 24.0 - time * 1.8 + filamentNoise * 4.0
        )) * (1.0 - smoothstep(0.04, 0.92, blastDistance)) * textureLight;
        float climax = exp(-pow((uBlastProgress - 0.59) / 0.13, 2.0));
        color *= 1.0 - core * uBlast * 0.94;
        color *= 1.0 + textureLight * uBlast * (0.26 + climax * 0.86);
        color += vec3(1.0, 0.61, 0.15) * (corona * 1.08 + filaments * 0.16) * uBlast;
        color += vec3(0.54, 0.2, 1.0) * (violetFlow * 0.13 + filaments * 0.08) * uBlast;
        color += mix(color, vec3(1.0, 0.82, 0.48), 0.22)
          * textureLight * textureLight * climax * uBlast * 0.38;
        color += vec3(1.0, 0.88, 0.58) * climax * exp(-blastDistance * 4.8) * uBlast * 0.16;
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
      previousBase: gl.getUniformLocation(program, "uPreviousBase"),
      field: gl.getUniformLocation(program, "uField"),
      baseTexel: gl.getUniformLocation(program, "uBaseTexel"),
      fieldTexel: gl.getUniformLocation(program, "uFieldTexel"),
      time: gl.getUniformLocation(program, "uTime"),
      energy: gl.getUniformLocation(program, "uEnergy"),
      blast: gl.getUniformLocation(program, "uBlast"),
      blastProgress: gl.getUniformLocation(program, "uBlastProgress"),
      blastOrigin: gl.getUniformLocation(program, "uBlastOrigin"),
      transitionActive: gl.getUniformLocation(program, "uTransitionActive"),
      transitionProgress: gl.getUniformLocation(program, "uTransitionProgress"),
      transitionOrigin: gl.getUniformLocation(program, "uTransitionOrigin"),
      transitionColor: gl.getUniformLocation(program, "uTransitionColor"),
      aspect: gl.getUniformLocation(program, "uAspect"),
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
    const previousBaseTexture = gl.createTexture();
    const fieldTexture = gl.createTexture();
    configureTexture(gl, baseTexture);
    configureTexture(gl, previousBaseTexture);
    configureTexture(gl, fieldTexture);
    let baseSource = null;
    let previousBaseSource = null;
    let fieldPixels = null;
    let fieldWidth = 0;
    let fieldHeight = 0;
    let fieldRevision = null;
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

    function uploadPreviousBase(source) {
      if (!source || source === previousBaseSource) return;
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, previousBaseTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      previousBaseSource = source;
    }

    function uploadField(current, pigment, width, height, revision) {
      const dimensionsChanged = !fieldPixels || fieldWidth !== width || fieldHeight !== height;
      if (!dimensionsChanged && revision != null && revision === fieldRevision) return;
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
      fieldRevision = revision ?? null;
    }

    function render(frame) {
      if (!active || !frame?.base || !frame.current || !frame.pigment) return null;
      try {
        resize(frame.width, frame.height);
        uploadBase(frame.base);
        uploadPreviousBase(frame.previousBase || frame.base);
        uploadField(frame.current, frame.pigment, frame.fieldWidth, frame.fieldHeight, frame.fieldRevision);
        gl.useProgram(program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, baseTexture);
        gl.uniform1i(uniforms.base, 0);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, previousBaseTexture);
        gl.uniform1i(uniforms.previousBase, 2);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
        gl.uniform1i(uniforms.field, 1);
        gl.uniform2f(uniforms.baseTexel, 1 / canvas.width, 1 / canvas.height);
        gl.uniform2f(uniforms.fieldTexel, 1 / frame.fieldWidth, 1 / frame.fieldHeight);
        gl.uniform1f(uniforms.time, (frame.time || 0) * 0.001);
        gl.uniform1f(uniforms.energy, Math.max(0, Math.min(1, frame.energy || 0)));
        gl.uniform1f(uniforms.blast, Math.max(0, Math.min(1, frame.blast || 0)));
        gl.uniform1f(uniforms.blastProgress, Math.max(0, Math.min(1, frame.blastProgress || 0)));
        gl.uniform2f(uniforms.blastOrigin, frame.blastOriginX ?? 0.5, frame.blastOriginY ?? 0.5);
        const transition = frame.transition;
        gl.uniform1f(uniforms.transitionActive, transition ? 1 : 0);
        gl.uniform1f(uniforms.transitionProgress, Math.max(0, Math.min(1, transition?.progress || 0)));
        gl.uniform2f(uniforms.transitionOrigin, transition?.originX ?? 0.5, transition?.originY ?? 0.5);
        gl.uniform3f(uniforms.transitionColor,
          transition?.color?.[0] ?? 1,
          transition?.color?.[1] ?? 1,
          transition?.color?.[2] ?? 1);
        gl.uniform1f(uniforms.aspect, canvas.width / canvas.height);
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
        gl.deleteTexture(previousBaseTexture);
        gl.deleteTexture(fieldTexture);
        gl.deleteBuffer(vertexBuffer);
        gl.deleteProgram(program);
      }
    });
  }

  global.BilliardsSurfaceRenderer = Object.freeze({ create });
})(window);
