(function () {
  "use strict";

  let activeEngine = null;

  const moodPalettes = {
    meet: ["#ffb3c8", "#ffd58a", "#fff4df"],
    campus: ["#ffd5b1", "#f4a7bb", "#fff0d0"],
    chat: ["#b9d9ff", "#ef9fca", "#fff4da"],
    date: ["#ffad95", "#f85f82", "#ffe29b"],
    cafe: ["#e8a374", "#f4a2ac", "#ffdba0"],
    rain: ["#a8cdf7", "#d8eaff", "#efabc7"],
    street: ["#ffbc73", "#9cc7f8", "#ed7e9b"],
    home: ["#ffc873", "#f29a86", "#fff0c7"],
    starlight: ["#d6e4ff", "#ffdda1", "#db9fca"],
    vow: ["#ffe590", "#ff9dbd", "#f6ecff"]
  };

  function createLoveVfx(options = {}) {
    activeEngine?.destroy();

    const root = options.root || document.body;
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canvas = document.createElement("canvas");
    canvas.className = "love-vfx-canvas";
    canvas.setAttribute("aria-hidden", "true");
    root.append(canvas);

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      canvas.remove();
      return {
        setMood() {},
        burst() {},
        celebrate() {},
        destroy() {}
      };
    }

    let width = 1;
    let height = 1;
    let dpr = 1;
    let mood = "meet";
    let particles = [];
    let frame = 0;
    let lastTime = 0;
    let ambientTimer = 0;
    let destroyed = false;

    function resize() {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function paletteFor(value = mood) {
      return moodPalettes[value] || moodPalettes.meet;
    }

    function randomColor(value = mood) {
      const palette = paletteFor(value);
      return palette[Math.floor(Math.random() * palette.length)];
    }

    function particleKind(value = mood) {
      if (value === "rain") return "rain";
      if (value === "starlight" || value === "vow" || value === "chat") return "star";
      if (value === "home" || value === "cafe") return "mote";
      return "petal";
    }

    function addParticle(config = {}) {
      if (particles.length >= 72) return;
      const kind = config.kind || particleKind(config.mood || mood);
      const life = config.life || (kind === "rain" ? 1150 : 1700 + Math.random() * 1500);
      particles.push({
        kind,
        x: config.x ?? Math.random() * width,
        y: config.y ?? -24,
        vx: config.vx ?? ((Math.random() - 0.5) * (kind === "rain" ? 46 : 18)),
        vy: config.vy ?? (kind === "rain" ? 270 + Math.random() * 150 : 20 + Math.random() * 34),
        gravity: config.gravity ?? (kind === "petal" ? 8 : 0),
        drag: config.drag ?? 0.986,
        size: config.size ?? (kind === "rain" ? 16 + Math.random() * 20 : 2.2 + Math.random() * 5.2),
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 2.1,
        color: config.color || randomColor(config.mood || mood),
        age: 0,
        life,
        alpha: config.alpha ?? (0.35 + Math.random() * 0.5)
      });
      scheduleFrame();
    }

    function spawnAmbient() {
      window.clearTimeout(ambientTimer);
      if (destroyed || reducedQuery.matches || document.hidden) return;
      const available = Math.max(0, 22 - particles.length);
      const count = Math.min(3, available);
      for (let i = 0; i < count; i += 1) {
        const kind = particleKind();
        addParticle({
          kind,
          x: Math.random() * width,
          y: kind === "star" || kind === "mote" ? Math.random() * height * 0.82 : -20,
          vx: kind === "rain" ? -28 - Math.random() * 24 : (Math.random() - 0.5) * 12,
          vy: kind === "star" || kind === "mote" ? -4 + Math.random() * 10 : undefined,
          life: 2600 + Math.random() * 3400,
          alpha: kind === "rain" ? 0.24 : 0.28 + Math.random() * 0.38
        });
      }
      ambientTimer = window.setTimeout(spawnAmbient, mood === "rain" ? 480 : 760);
    }

    function drawPetal(item, alpha) {
      context.save();
      context.translate(item.x, item.y);
      context.rotate(item.rotation);
      context.scale(1, 0.72 + Math.sin(item.rotation) * 0.16);
      context.fillStyle = item.color;
      context.globalAlpha = alpha;
      context.beginPath();
      context.moveTo(0, -item.size);
      context.bezierCurveTo(item.size * 0.9, -item.size * 0.55, item.size * 0.72, item.size * 0.7, 0, item.size);
      context.bezierCurveTo(-item.size * 0.72, item.size * 0.7, -item.size * 0.9, -item.size * 0.55, 0, -item.size);
      context.fill();
      context.restore();
    }

    function drawStar(item, alpha) {
      const pulse = 0.55 + Math.sin(item.age * 0.009 + item.rotation) * 0.45;
      context.save();
      context.translate(item.x, item.y);
      context.rotate(item.rotation * 0.24);
      context.strokeStyle = item.color;
      context.globalAlpha = alpha * pulse;
      context.lineWidth = Math.max(0.7, item.size * 0.15);
      context.shadowBlur = item.size * 2.4;
      context.shadowColor = item.color;
      context.beginPath();
      context.moveTo(-item.size, 0);
      context.lineTo(item.size, 0);
      context.moveTo(0, -item.size);
      context.lineTo(0, item.size);
      context.stroke();
      context.restore();
    }

    function drawMote(item, alpha) {
      context.save();
      context.globalAlpha = alpha;
      context.fillStyle = item.color;
      context.shadowBlur = item.size * 4;
      context.shadowColor = item.color;
      context.beginPath();
      context.arc(item.x, item.y, Math.max(0.8, item.size * 0.34), 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    function drawRain(item, alpha) {
      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = item.color;
      context.lineWidth = 0.75;
      context.beginPath();
      context.moveTo(item.x, item.y);
      context.lineTo(item.x + item.vx * 0.055, item.y - item.size);
      context.stroke();
      context.restore();
    }

    function render(time) {
      frame = 0;
      if (destroyed || document.hidden) return;
      const delta = Math.min(34, Math.max(10, time - (lastTime || time))) / 1000;
      lastTime = time;
      context.clearRect(0, 0, width, height);

      particles = particles.filter((item) => {
        item.age += delta * 1000;
        if (item.age >= item.life) return false;
        item.vx *= item.drag;
        item.vy = item.vy * item.drag + item.gravity * delta;
        item.x += item.vx * delta;
        item.y += item.vy * delta;
        item.rotation += item.spin * delta;
        const progress = item.age / item.life;
        const fade = Math.min(1, progress * 6) * Math.min(1, (1 - progress) * 4);
        const alpha = item.alpha * fade;
        if (item.kind === "rain") drawRain(item, alpha);
        else if (item.kind === "star") drawStar(item, alpha);
        else if (item.kind === "mote") drawMote(item, alpha);
        else drawPetal(item, alpha);
        return item.y < height + 60 && item.x > -80 && item.x < width + 80;
      });

      if (particles.length) scheduleFrame();
    }

    function scheduleFrame() {
      if (!frame && !destroyed && !document.hidden) frame = window.requestAnimationFrame(render);
    }

    function setMood(nextMood = "meet") {
      mood = moodPalettes[nextMood] ? nextMood : "meet";
      root.dataset.loveMood = mood;
      particles = particles.slice(-10);
      spawnAmbient();
    }

    function burst(config = {}) {
      const effectMood = config.mood || config.tone || mood;
      const count = reducedQuery.matches ? 5 : Math.min(30, config.count || 18);
      const x = Number.isFinite(config.x) ? config.x : width / 2;
      const y = Number.isFinite(config.y) ? config.y : height / 2;
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 42 + Math.random() * 150;
        addParticle({
          kind: i % 5 === 0 ? "star" : particleKind(effectMood),
          mood: effectMood,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 18,
          gravity: effectMood === "rain" ? 92 : 26,
          drag: 0.972,
          size: 3 + Math.random() * 6,
          life: 720 + Math.random() * 720,
          alpha: 0.55 + Math.random() * 0.4
        });
      }
    }

    function celebrate(config = {}) {
      const effectMood = config.mood || config.tone || mood;
      const count = reducedQuery.matches ? 10 : 52;
      for (let i = 0; i < count; i += 1) {
        const edge = i % 4;
        const x = edge === 0 ? Math.random() * width : edge === 1 ? -16 : edge === 2 ? width + 16 : Math.random() * width;
        const y = edge === 0 ? height + 20 : edge === 3 ? -20 : Math.random() * height;
        const targetX = width * (0.3 + Math.random() * 0.4);
        const targetY = height * (0.28 + Math.random() * 0.38);
        addParticle({
          kind: i % 4 === 0 ? "star" : particleKind(effectMood),
          mood: effectMood,
          x,
          y,
          vx: (targetX - x) * (0.22 + Math.random() * 0.12),
          vy: (targetY - y) * (0.22 + Math.random() * 0.12),
          gravity: effectMood === "rain" ? 42 : 7,
          drag: 0.981,
          size: 3 + Math.random() * 8,
          life: 1050 + Math.random() * 1250,
          alpha: 0.58 + Math.random() * 0.4
        });
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        window.clearTimeout(ambientTimer);
      } else {
        lastTime = 0;
        spawnAmbient();
        scheduleFrame();
      }
    }

    function onMotionChange() {
      if (reducedQuery.matches) {
        window.clearTimeout(ambientTimer);
        particles = [];
        context.clearRect(0, 0, width, height);
      } else {
        spawnAmbient();
      }
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(ambientTimer);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedQuery.removeEventListener?.("change", onMotionChange);
      particles = [];
      canvas.remove();
      delete root.dataset.loveMood;
      if (activeEngine === api) activeEngine = null;
    }

    const api = { setMood, burst, celebrate, destroy };
    activeEngine = api;
    resize();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedQuery.addEventListener?.("change", onMotionChange);
    setMood(options.mood || "meet");
    return api;
  }

  window.Love2048Vfx = { createLoveVfx };
})();
