(function () {
  "use strict";

  const rules = window.RunnerLoveRules;
  const engineApi = window.RunnerLoveEngine;
  const content = window.RunnerLoveContent;
  const directorApi = window.RunnerLoveDirector;
  if (!rules || !engineApi || !content || !directorApi) return;

  const $ = (selector) => document.querySelector(selector);
  const root = $("#runner-love");
  const canvas = $("#runner-canvas");
  if (!canvas) return;

  const SAVE_KEY = "runner-love-tonight-v5";
  const VIEW = Object.freeze({ width: 720, height: 1280 });

  const PATTERN_BLUEPRINTS = Object.freeze([
    Object.freeze({ id: "street-vault", choiceZ: 31, obstacles: [
      { lane: 0, z: 10, avoid: "jump", form: "barrier" },
      { lane: -1, z: 21, avoid: "switch", form: "service-cart", rewardNearMiss: true },
      { lane: 1, z: 43, avoid: "slide", form: "signal-gate" }
    ] }),
    Object.freeze({ id: "closing-route", choiceZ: 35, obstacles: [
      { lane: -1, z: 11, avoid: "slide", form: "signal-gate" },
      { lane: 1, z: 11, avoid: "slide", form: "signal-gate" },
      { lane: 0, z: 24, avoid: "jump", form: "barrier" },
      { lane: -1, z: 48, avoid: "switch", form: "service-cart", rewardNearMiss: true }
    ] }),
    Object.freeze({ id: "city-slalom", choiceZ: 39, obstacles: [
      { lane: 1, z: 9, avoid: "switch", form: "service-cart", rewardNearMiss: true },
      { lane: 0, z: 20, avoid: "slide", form: "signal-gate" },
      { lane: -1, z: 29, avoid: "jump", form: "barrier" },
      { lane: 1, z: 51, avoid: "switch", form: "service-cart" }
    ] }),
    Object.freeze({ id: "station-rush", choiceZ: 33, obstacles: [
      { lane: -1, z: 12, avoid: "switch", form: "train", rewardNearMiss: true },
      { lane: 0, z: 12, avoid: "switch", form: "train", rewardNearMiss: true },
      { lane: 1, z: 24, avoid: "jump", form: "barrier" },
      { lane: 0, z: 47, avoid: "slide", form: "signal-gate" }
    ] }),
    Object.freeze({ id: "market-weave", choiceZ: 37, obstacles: [
      { lane: 0, z: 10, avoid: "switch", form: "service-cart", rewardNearMiss: true },
      { lane: 1, z: 22, avoid: "jump", form: "barrier" },
      { lane: -1, z: 29, avoid: "slide", form: "signal-gate" },
      { lane: 0, z: 50, avoid: "jump", form: "barrier" }
    ] }),
    Object.freeze({ id: "underpass-hop", choiceZ: 41, obstacles: [
      { lane: -1, z: 9, avoid: "jump", form: "barrier" },
      { lane: 0, z: 20, avoid: "switch", form: "service-cart", rewardNearMiss: true },
      { lane: 1, z: 31, avoid: "slide", form: "signal-gate" },
      { lane: -1, z: 52, avoid: "switch", form: "service-cart" }
    ] }),
    Object.freeze({ id: "delivery-crossing", choiceZ: 34, obstacles: [
      { lane: 1, z: 10, avoid: "jump", form: "barrier" },
      { lane: -1, z: 18, avoid: "switch", form: "service-cart", rewardNearMiss: true },
      { lane: 0, z: 28, avoid: "slide", form: "signal-gate" },
      { lane: 1, z: 46, avoid: "switch", form: "service-cart" }
    ] }),
    Object.freeze({ id: "festival-gates", choiceZ: 38, obstacles: [
      { lane: -1, z: 11, avoid: "slide", form: "signal-gate" },
      { lane: 0, z: 22, avoid: "jump", form: "barrier" },
      { lane: 1, z: 33, avoid: "switch", form: "service-cart", rewardNearMiss: true },
      { lane: 0, z: 51, avoid: "slide", form: "signal-gate" }
    ] }),
    Object.freeze({ id: "river-curve", choiceZ: 36, obstacles: [
      { lane: 0, z: 9, avoid: "jump", form: "barrier" },
      { lane: 1, z: 18, avoid: "switch", form: "service-cart" },
      { lane: -1, z: 30, avoid: "switch", form: "service-cart", rewardNearMiss: true },
      { lane: 1, z: 49, avoid: "slide", form: "signal-gate" }
    ] }),
    Object.freeze({ id: "late-platform", choiceZ: 43, obstacles: [
      { lane: 1, z: 12, avoid: "switch", form: "train", rewardNearMiss: true },
      { lane: -1, z: 23, avoid: "jump", form: "barrier" },
      { lane: 0, z: 34, avoid: "slide", form: "signal-gate" },
      { lane: -1, z: 54, avoid: "switch", form: "train", rewardNearMiss: true }
    ] })
  ]);

  const STAGE_OBSTACLE_FORMS = Object.freeze([
    Object.freeze({ barrier: "barrier", cart: "service-cart", gate: "signal-gate", train: "service-cart" }),
    Object.freeze({ barrier: "barrier", cart: "service-cart", gate: "signal-gate", train: "service-cart" }),
    Object.freeze({ barrier: "barrier", cart: "service-cart", gate: "signal-gate", train: "train" }),
    Object.freeze({ barrier: "barrier", cart: "service-cart", gate: "signal-gate", train: "service-cart" }),
    Object.freeze({ barrier: "barrier", cart: "service-cart", gate: "signal-gate", train: "service-cart" }),
    Object.freeze({ barrier: "barrier", cart: "service-cart", gate: "signal-gate", train: "train" }),
    Object.freeze({ barrier: "barrier", cart: "service-cart", gate: "signal-gate", train: "train" })
  ]);

  const POWERUP_META = Object.freeze({
    magnet: Object.freeze({ glyph: "◎", label: "磁吸", color: "#66e5ff" }),
    shield: Object.freeze({ glyph: "▱", label: "护跑", color: "#9fffc8" }),
    multiplier: Object.freeze({ glyph: "×2", label: "双倍", color: "#ffd36b" }),
    overdrive: Object.freeze({ glyph: "»", label: "跃迁", color: "#ff7f6b" })
  });
  const ARCADE_POWERUP_ORDER = Object.freeze(["magnet", "shield", "multiplier", "overdrive"]);
  const ONBOARDING_ACTIONS = Object.freeze(["jump", "switch", "slide"]);
  const SPEED_LABELS = Object.freeze(["起跑", "加速", "疾行", "冲刺", "极速"]);
  const STAGE_RUNTIME_FALLBACKS = Object.freeze([
    Object.freeze({ chapter: "第一章 · 雨后再遇", introTitle: "香樟路尽头，她也停下了脚步", tone: "雨后校园", phases: Object.freeze([
      Object.freeze({ venue: "旧教学楼雨廊", worldCue: "下课铃、逐间熄灭的教室与散开的放学人潮", collectibleKinds: Object.freeze(["message-pulse", "photo-corner", "bell-echo"]), obstacleForms: Object.freeze(["departing-student-stream", "umbrella-rack", "corridor-column"]) }),
      Object.freeze({ venue: "香樟太阳雨", worldCue: "叶尖滴水、树根积水与售货机冷白灯", collectibleKinds: Object.freeze(["ginkgo-note", "rain-glint", "warm-can"]), obstacleForms: Object.freeze(["camphor-root-puddle", "bicycle", "low-canopy"]) }),
      Object.freeze({ venue: "图书馆路口", worldCue: "钟楼、红灯倒计时、送书车与屋檐下的人影", collectibleKinds: Object.freeze(["crosswalk-light", "umbrella-drop", "citrus-spark"]), obstacleForms: Object.freeze(["departing-student-stream", "library-delivery-rail", "bicycle"]) })
    ]) }),
    Object.freeze({ chapter: "第二章 · 话题有了回声", introTitle: "沿着河堤，把昨晚没聊完的话继续下去", tone: "晨雾书店", phases: Object.freeze([
      Object.freeze({ venue: "河堤", worldCue: "薄雾河面与晨跑步道", collectibleKinds: Object.freeze(["music-note", "river-postcard", "soda-bubble"]), obstacleForms: Object.freeze(["bicycle", "bench", "puddle"]) }),
      Object.freeze({ venue: "唱片店", worldCue: "旋转唱片与窄巷橱窗", collectibleKinds: Object.freeze(["vinyl-groove", "headphone-beat", "album-star"]), obstacleForms: Object.freeze(["record-crate", "awning", "service-cart"]) }),
      Object.freeze({ venue: "桥下书店", worldCue: "旧书架与暖色纸页", collectibleKinds: Object.freeze(["paperback-page", "coffee-steam", "cat-paw"]), obstacleForms: Object.freeze(["book-cart", "low-shelf", "bicycle"]) })
    ]) }),
    Object.freeze({ chapter: "第三章 · 准时赴约", introTitle: "七点四十之前，穿过整座亮起的城", tone: "霓虹站前", phases: Object.freeze([
      Object.freeze({ venue: "站前街", worldCue: "晚高峰车灯与电子路牌", collectibleKinds: Object.freeze(["clock-tick", "message-pulse", "ticket-stub"]), obstacleForms: Object.freeze(["service-cart", "signal-gate", "crowd"]) }),
      Object.freeze({ venue: "地铁站", worldCue: "列车风压与站台灯带", collectibleKinds: Object.freeze(["metro-token", "platform-light", "last-train-pass"]), obstacleForms: Object.freeze(["train", "signal-gate", "luggage"]) }),
      Object.freeze({ venue: "旧城电影院", worldCue: "雨雾灯牌与红色幕光", collectibleKinds: Object.freeze(["cinema-ticket", "film-frame", "coffee-pair"]), obstacleForms: Object.freeze(["poster-stand", "barrier", "awning"]) })
    ]) }),
    Object.freeze({ chapter: "第四章 · 今晚不急着结束", introTitle: "电影散场后，夜色才刚刚开始", tone: "夜市河岸", phases: Object.freeze([
      Object.freeze({ venue: "夜市", worldCue: "烟火摊位与流动灯笼", collectibleKinds: Object.freeze(["snack-spark", "lantern-glow", "gift-ribbon"]), obstacleForms: Object.freeze(["stall", "crowd", "service-cart"]) }),
      Object.freeze({ venue: "音乐广场", worldCue: "舞台光束与跃动节拍", collectibleKinds: Object.freeze(["wristband-beat", "music-wave", "camera-flash"]), obstacleForms: Object.freeze(["speaker-stack", "signal-gate", "barrier"]) }),
      Object.freeze({ venue: "河岸长椅", worldCue: "水面倒影与安静晚风", collectibleKinds: Object.freeze(["river-star", "photo-light", "camp-lamp"]), obstacleForms: Object.freeze(["bench", "railing", "awning"]) })
    ]) }),
    Object.freeze({ chapter: "第五章 · 日常也会发光", introTitle: "这一次，目的地是一盏为你留着的灯", tone: "清晨生活", phases: Object.freeze([
      Object.freeze({ venue: "早餐店", worldCue: "蒸汽玻璃与晨间招牌", collectibleKinds: Object.freeze(["bread-warmth", "breakfast-bag", "morning-note"]), obstacleForms: Object.freeze(["delivery-cart", "awning", "crowd"]) }),
      Object.freeze({ venue: "清晨市场", worldCue: "鲜蔬棚架与穿行小巷", collectibleKinds: Object.freeze(["grocery-leaf", "recipe-note", "market-token"]), obstacleForms: Object.freeze(["grocery-crate", "service-cart", "low-shelf"]) }),
      Object.freeze({ venue: "亮灯的厨房", worldCue: "住宅街树影与窗灯", collectibleKinds: Object.freeze(["brass-key", "plant-leaf", "window-lamp"]), obstacleForms: Object.freeze(["bicycle", "delivery-cart", "barrier"]) })
    ]) }),
    Object.freeze({ chapter: "第六章 · 穿过没有说清的雨", introTitle: "风雨把路分开，但见面仍是唯一方向", tone: "暴雨高架", phases: Object.freeze([
      Object.freeze({ venue: "高架桥", worldCue: "侧风、雨幕与疾驰车影", collectibleKinds: Object.freeze(["rain-shard", "resolve-light", "dry-towel"]), obstacleForms: Object.freeze(["maintenance", "puddle", "barrier"]) }),
      Object.freeze({ venue: "封路街口", worldCue: "红色警灯与改道标志", collectibleKinds: Object.freeze(["folded-note", "signal-fragment", "warm-cocoa"]), obstacleForms: Object.freeze(["warning", "service-cart", "signal-gate"]) }),
      Object.freeze({ venue: "河桥雨棚", worldCue: "桥下水雾与渐近人影", collectibleKinds: Object.freeze(["mended-ticket", "white-flower", "shelter-light"]), obstacleForms: Object.freeze(["puddle", "railing", "awning"]) })
    ]) }),
    Object.freeze({ chapter: "第七章 · 向有灯的地方", introTitle: "天快亮了，这条路终于通向同一个以后", tone: "黎明归途", phases: Object.freeze([
      Object.freeze({ venue: "黎明站台", worldCue: "列车晨雾与远行广播", collectibleKinds: Object.freeze(["travel-map", "dawn-ticket", "luggage-tag"]), obstacleForms: Object.freeze(["train", "luggage", "signal-gate"]) }),
      Object.freeze({ venue: "熟悉长街", worldCue: "一路亮起的店铺与树影", collectibleKinds: Object.freeze(["shared-photo", "street-memory", "morning-bread"]), obstacleForms: Object.freeze(["delivery-cart", "bicycle", "barrier"]) }),
      Object.freeze({ venue: "有灯的家", worldCue: "晨光门廊与温暖窗格", collectibleKinds: Object.freeze(["home-key", "window-lamp", "new-leaf"]), obstacleForms: Object.freeze(["luggage", "garden-gate", "awning"]) })
    ]) })
  ]);

  const ui = {
    intro: $("[data-intro]"), result: $("[data-result]"), arrival: $("[data-arrival]"), toast: $("[data-toast]"),
    stageIntro: $("[data-stage-intro]"), stageIntroChapter: $("[data-stage-intro-index]"),
    stageIntroTitle: $("[data-stage-intro-name]"), stageIntroScene: $("[data-stage-intro-place]"),
    stageIntroCopy: $("[data-stage-intro-copy]"), stageIntroObjective: $("[data-stage-intro-motive]"),
    stageIntroTime: $("[data-stage-intro-time]"), stageIntroWeather: $("[data-stage-intro-weather]"),
    stageIntroProgress: $("[data-stage-intro-progress]"),
    danger: $("[data-danger]"), dangerLabel: $("[data-danger-label]"), dangerValue: $("[data-danger-value]"), dangerCopy: $("[data-danger-copy]"),
    failure: $("[data-failure]"), failureKicker: $("[data-failure-kicker]"), failureTitle: $("[data-failure-title]"),
    failureCopy: $("[data-failure-copy]"), failureCheckpointPanel: $("[data-failure-checkpoint-panel]"),
    failureCheckpoint: $("[data-failure-checkpoint]"), failureProgress: $("[data-failure-progress]"),
    failureProgressFill: $("[data-failure-progress-fill]"), failureCheckpointCopy: $("[data-failure-checkpoint-copy]"),
    stageKicker: $("[data-stage-kicker]"), stageName: $("[data-stage-name]"), condition: $("[data-condition]"),
    conditionFill: $("[data-condition-fill]"), progress: $("[data-progress]"), progressFill: $("[data-progress-fill]"),
    combo: $("[data-combo]"), stageTrack: $("[data-stage-track]"), announcer: $("[data-announcer]"),
    savedRun: $("[data-saved-run]"), cargo: $("[data-cargo]"), destination: $("[data-destination]"),
    speedState: $("[data-speed-state]"), speedLabel: $("[data-speed-label]"), speedFill: $("[data-speed-fill]"),
    powerupRack: $("[data-powerup-rack]"),
    routeMessage: $("[data-route-message]"), routeCopy: $("[data-route-copy]"), routeTime: $("[data-route-time]"),
    arrivalKicker: $("[data-arrival-kicker]"), arrivalTitle: $("[data-arrival-title]"), arrivalCopy: $("[data-arrival-copy]"),
    arrivalAction: $("[data-arrival-action]"),
    grade: $("[data-grade]"), endingTitle: $("[data-ending-title]"), endingCopy: $("[data-ending-copy]"),
    completion: $("[data-stat-completion]"), accuracy: $("[data-stat-accuracy]"), resultItems: $("[data-stat-items]"),
    relationship: $("[data-stat-relationship]"), resultCollisions: $("[data-stat-collisions]"), score: $("[data-score]"), distance: $("[data-distance]"),
    newGamePlus: $("[data-new-game-plus]"), retry: $("[data-retry]")
  };
  const STORY_ACTS = Object.freeze([
    Object.freeze({ id: "approach", label: "第一幕 · 靠近", start: 0, end: 2 }),
    Object.freeze({ id: "together", label: "第二幕 · 同行与错位", start: 3, end: 4 }),
    Object.freeze({ id: "commitment", label: "第三幕 · 倾听与共同承担", start: 5, end: 6 })
  ]);
  const storyActForStage = (stageIndex) => STORY_ACTS.find((act) => stageIndex >= act.start && stageIndex <= act.end) || STORY_ACTS[0];
  const ARRIVAL_INTERACTIONS = Object.freeze({
    5: Object.freeze({
      sequence: Object.freeze(["slide", "right"]),
      prompts: Object.freeze(["下滑，先把脚步慢下来", "右滑，和她一起移开落水链"]),
      completed: "雨水改道，两个人终于站进同一片干燥处"
    }),
    6: Object.freeze({
      sequence: Object.freeze(["left", "right", "jump"]),
      prompts: Object.freeze(["左滑，转动左侧门锁", "右滑，转动右侧门锁", "上滑，一起跨过门槛"]),
      completed: "两道锁分别亮起，中央门缝迎来晨光"
    })
  });
  const RELATIONSHIP_ENDING_CODAS = Object.freeze({
    attentive: "窗边灯先亮起来，因为你们已经学会在对方开口前看见需要。",
    supportive: "行李在门前完成最后一次换手，谁都不必独自承担以后。",
    restorative: "雨声退远，两道锁分别转动；修复不是回到从前，而是重新决定怎样并肩。",
    balanced: "两条跑线保留各自方向，又在门槛前自然汇成同一步。",
    unwritten: "晨光越过门槛，这段关系仍等着由下一次行动写下。"
  });

  class CityRunAudio {
    constructor() {
      this.context = null;
      this.master = null;
      this.ambience = null;
      this.melody = null;
      this.noiseBuffer = null;
      this.started = false;
      this.stepClock = 0;
      this.musicClock = 0;
      this.stepSide = 1;
      this.stageNumber = 1;
    }

    start() {
      if (this.started) {
        if (this.context?.state === "suspended") this.context.resume();
        return;
      }
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      const compressor = this.context.createDynamicsCompressor();
      compressor.threshold.value = -17;
      compressor.knee.value = 16;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.008;
      compressor.release.value = 0.24;
      this.master = this.context.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(compressor);
      compressor.connect(this.context.destination);
      this.ambience = this.context.createGain();
      this.melody = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 760;
      this.ambience.connect(filter);
      this.melody.connect(filter);
      filter.connect(this.master);
      this.ambience.gain.value = 0.055;
      this.melody.gain.value = 0.028;
      [[82.41, this.ambience, "sine"], [164.81, this.melody, "triangle"]].forEach(([frequency, gain, type]) => {
        const oscillator = this.context.createOscillator();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        oscillator.start();
      });
      this.noiseBuffer = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * 0.34), this.context.sampleRate);
      const noise = this.noiseBuffer.getChannelData(0);
      for (let index = 0; index < noise.length; index += 1) noise[index] = (Math.random() * 2 - 1) * (1 - index / noise.length);
      this.started = true;
    }

    setStage(stageNumber, condition) {
      if (!this.context) return;
      this.stageNumber = stageNumber;
      const at = this.context.currentTime;
      this.melody.gain.setTargetAtTime(0.018 + stageNumber * 0.005 + condition / 10000, at, 0.5);
    }

    noise(duration, frequency, volume, delay = 0, pan = 0) {
      if (!this.context || !this.noiseBuffer || !this.master) return;
      const source = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      const startAt = this.context.currentTime + delay;
      source.buffer = this.noiseBuffer;
      filter.type = "bandpass";
      filter.frequency.value = frequency;
      filter.Q.value = 0.9;
      gain.gain.setValueAtTime(Math.max(0.001, volume), startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
      source.connect(filter);
      filter.connect(gain);
      if (this.context.createStereoPanner) {
        const panner = this.context.createStereoPanner();
        panner.pan.value = pan;
        gain.connect(panner);
        panner.connect(this.master);
      } else gain.connect(this.master);
      source.start(startAt);
      source.stop(startAt + duration + 0.02);
    }

    tone(frequency, duration, volume, delay = 0, type = "sine") {
      if (!this.context || !this.master) return;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const at = this.context.currentTime + delay;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(Math.max(0.001, volume), at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
      oscillator.connect(gain);
      gain.connect(this.master);
      oscillator.start(at);
      oscillator.stop(at + duration + 0.02);
    }

    action(name) {
      if (!this.context) return;
      if (name === "left" || name === "right") this.noise(0.14, 910, 0.04, 0, name === "left" ? -0.45 : 0.45);
      else if (name === "jump") { this.noise(0.2, 1280, 0.055); this.tone(392, 0.12, 0.035); }
      else if (name === "slide") this.noise(0.3, 390, 0.068);
    }

    cue(name, kind) {
      if (!this.context) return;
      if (name === "miss") {
        this.tone(104, 0.28, 0.085, 0, "sawtooth");
        this.noise(0.24, 150, 0.075);
        return;
      }
      if (name === "arrival") {
        [392, 493.88, 659.25, 783.99].forEach((note, index) => this.tone(note, 0.5, 0.065 - index * 0.006, index * 0.08, "sine"));
        return;
      }
      const kindNotes = { book: 523.25, record: 440, drink: 659.25, coffee: 659.25, ticket: 587.33, umbrella: 493.88, flower: 698.46, camera: 783.99, key: 880, plant: 554.37, map: 622.25 };
      const frequency = kindNotes[kind] || (name === "perfect" ? 880 : 659.25);
      this.tone(frequency, name === "perfect" ? 0.28 : 0.18, name === "perfect" ? 0.09 : 0.065, 0, "sine");
      if (name === "perfect") this.tone(frequency * 1.5, 0.24, 0.045, 0.055, "triangle");
    }

    tick(delta, speed, active, arrival) {
      if (!this.context || !active) return;
      this.stepClock -= delta;
      this.musicClock -= delta;
      if (!arrival && this.stepClock <= 0) {
        this.stepSide *= -1;
        this.noise(0.07, 165 + Math.min(100, speed * 4), 0.03, 0, this.stepSide * 0.16);
        this.stepClock = Math.max(0.18, 0.34 - speed * 0.005);
      }
      if (this.musicClock <= 0) {
        const progressions = [[261.63, 329.63, 392], [293.66, 369.99, 440], [329.63, 415.3, 493.88]];
        const chord = progressions[(this.stageNumber - 1) % progressions.length];
        const note = chord[Math.floor(this.context.currentTime * 1.7) % chord.length];
        this.tone(note, arrival ? 0.52 : 0.24, arrival ? 0.035 : 0.015, 0, "triangle");
        this.musicClock = arrival ? 0.34 : 0.48;
      }
    }

    toggle() {
      this.start();
      if (!this.context) return false;
      if (this.context.state === "running") this.context.suspend();
      else this.context.resume();
      return this.context.state !== "running";
    }
    suspend() { if (this.context?.state === "running") this.context.suspend(); }
    resume() { if (this.started && this.context?.state === "suspended") this.context.resume(); }
  }

  const audio = window.RunnerLoveAudio?.create?.() || new CityRunAudio();
  let runState = rules.createRunState();
  let motion = createMotion();
  let director = directorApi.createDirector();
  let mode = "intro";
  let pausedStage = null;
  let lastFrameAt = performance.now();
  let frameHandle = 0;
  let spawnClock = 0;
  let patternCursor = 0;
  let beatClock = 0;
  let visualTime = 0;
  let toastTimer = 0;
  let routeMessageTimer = 0;
  let pointerStart = null;
  let visualRuntime = null;
  let visualFailure = null;
  let completionSaved = false;
  let arrivalElapsed = 0;
  let arrivalDuration = 0;
  let arrivalData = null;
  let stageIntroElapsed = 0;
  let stageIntroDuration = 0;
  let stageIntroData = null;
  let stageIntroBeat = -1;
  let routePhase = -1;
  let flowEnergy = 0;
  let flowPeak = 0;
  let arcadeCombo = 0;
  let arcadeBest = 0;
  let arcadePickupChain = 0;
  let arcadeRewardTier = 0;
  let storyEchoes = [];
  let lastSpeedTier = -1;
  let lastConditionBand = "steady";
  let powerupHudSignature = "";
  let deferredDirectorCommands = [];
  let checkpointRuntime = null;
  let preserveRuntimeThroughIntro = false;
  let arrivalInteraction = null;
  let runPrimed = false;
  const stageExperienceCache = new Map();

  function createMotion(snapshot = null) {
    const instance = engineApi.createEngine({
      seed: "tonight-see-you-2026",
      duration: 3600,
      finaleSeconds: 0,
      manualStages: true,
      startSpeed: 17.2,
      maxSpeed: 36,
      acceleration: 0.082,
      laneChangeDuration: 0.11,
      jumpDuration: 0.66,
      jumpHeight: 2,
      slideDuration: 0.52,
      collisionSpeedLoss: 2.8,
      moduleLength: 42,
      spawnAhead: 120,
      stages: content.STAGES.map((stage, index) => ({
        id: stage.id,
        from: index / 7,
        modules: content.ROAD_MODULES.filter((item) => item.stage === stage.order).map((item) => item.id)
      }))
    });
    if (snapshot && typeof snapshot === "object") {
      const restored = clone(snapshot);
      Object.keys(instance.state).forEach((key) => { delete instance.state[key]; });
      Object.assign(instance.state, restored);
      instance.state.events = [];
      instance.state.inputQueue = [];
    }
    return instance;
  }

  function ensureVisualRuntime() {
    if (visualRuntime || visualFailure || !window.RunnerLoveVisuals) return visualRuntime;
    try {
      visualRuntime = window.RunnerLoveVisuals.create(canvas);
      root?.setAttribute("data-renderer", "webgl");
      configureCanvas();
      if (deferredDirectorCommands.length) {
        deferredDirectorCommands.forEach((command) => visualRuntime?.applyDirectorCommand?.(command));
        deferredDirectorCommands = [];
      }
    } catch (error) {
      visualFailure = error;
      root?.setAttribute("data-renderer", "static");
      console.error(error);
    }
    return visualRuntime;
  }

  function safeLoad() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? rules.loadSave(JSON.parse(raw)) : null;
    } catch (_) {
      return null;
    }
  }

  function persist() {
    if (runState.status === "completed" && completionSaved) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(rules.createSave(runState, safeLoad())));
      if (runState.status === "completed") completionSaved = true;
    } catch (_) {}
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function currentStageIndex() { return Math.min(runState.stageIndex, content.STAGES.length - 1); }
  function visualStageIndex() { return pausedStage === null ? currentStageIndex() : pausedStage; }
  function currentStage() { return content.STAGES[currentStageIndex()]; }
  function show(node, visible) { if (node) node.hidden = !visible; }
  function announce(text) { if (ui.announcer) ui.announcer.textContent = text; }

  function storySnapshotFromRun(state = runState) {
    return state?.story?.director || state?.storyState?.director || state?.story?.snapshot || state?.story || null;
  }

  function storyEnvelope(state = runState) {
    return state?.story || state?.storyState || {};
  }

  function schedulerSnapshot() {
    return {
      spawnClock,
      beatClock,
      patternCursor,
      routePhase,
      flowEnergy,
      flowPeak,
      arcadeCombo,
      arcadeBest,
      arcadePickupChain,
      arcadeRewardTier,
      storyEchoes: clone(storyEchoes),
      lastSpeedTier,
      runPrimed
    };
  }

  function restoreScheduler(saved = {}) {
    spawnClock = Math.max(0, Number(saved.spawnClock) || 0);
    beatClock = Math.max(0, Number(saved.beatClock) || 0);
    patternCursor = Math.max(0, Math.trunc(Number(saved.patternCursor) || 0));
    routePhase = Math.max(-1, Math.min(2, Math.trunc(Number(saved.routePhase) || 0)));
    flowEnergy = Math.max(0, Math.min(100, Number(saved.flowEnergy) || 0));
    flowPeak = Math.max(flowEnergy, Number(saved.flowPeak) || 0);
    arcadeCombo = Math.max(0, Math.trunc(Number(saved.arcadeCombo) || 0));
    arcadeBest = Math.max(arcadeCombo, Math.trunc(Number(saved.arcadeBest) || 0));
    arcadePickupChain = Math.max(0, Math.trunc(Number(saved.arcadePickupChain) || 0));
    arcadeRewardTier = Math.max(0, Math.trunc(Number(saved.arcadeRewardTier) || 0));
    storyEchoes = Array.isArray(saved.storyEchoes) ? clone(saved.storyEchoes) : [];
    lastSpeedTier = Number.isFinite(Number(saved.lastSpeedTier)) ? Number(saved.lastSpeedTier) : -1;
    runPrimed = Boolean(saved.runPrimed);
  }

  function commitDirectorState(checkpoint = false, stageStart = false) {
    if (!rules.commitStoryState) return;
    const runtime = clone(motion.state);
    const directorState = director.snapshot();
    runState = rules.commitStoryState(runState, {
      ...directorState,
      worldState: {
        ...(directorState.worldState || {}),
        runtime: runtime ? clone(runtime) : null,
        scheduler: schedulerSnapshot(),
        patternCursor,
        routePhase
      }
    }, { checkpoint, stageStart });
    if (checkpoint) checkpointRuntime = runtime;
  }

  function applyDirectorCommands(commands) {
    (commands || []).forEach((command) => {
      if (["scene", "camera"].includes(command.channel)) {
        if (visualRuntime?.applyDirectorCommand) visualRuntime.applyDirectorCommand(command);
        else deferredDirectorCommands.push(command);
      }
      if (command.channel === "audio") audio.applyDirectorCommand?.(command);
      if (command.channel === "gameplay") {
        if (command.op === "settle") motion.pace?.(command.payload.paceScale || 0.76, command.durationMs / 1000);
        else if (["rush", "cadence", "sync", "carry", "handoff"].includes(command.op)) {
          motion.boost?.(Math.max(0.25, Number(command.payload.speedBoost) || 0.55), command.durationMs / 1000);
        }
      }
      if (command.channel === "rules" && command.op === "progress" && runState.status === "playing") {
        applyMoment({
          outcome: command.payload.outcome || "good",
          kind: command.key,
          itemId: command.payload.itemId,
          choiceId: command.payload.decisionId,
          inputSeq: command.payload.inputSeq,
          nodeId: command.payload.nodeId,
          causeId: command.payload.causeId
        });
      }
    });
  }

  function recordDirectorFact(fact) {
    const definition = rules.STAGES[currentStageIndex()];
    const commands = director.ingest({
      ...fact,
      stageProgress: runState.stage.progress,
      stageTarget: definition.target
    }, { elapsed: runState.stage.elapsed });
    applyDirectorCommands(commands);
    commitDirectorState(false);
    return commands;
  }

  function haptic(pattern) {
    try { navigator.vibrate?.(pattern); } catch (_) {}
  }

  function addFlow(amount) {
    flowEnergy = Math.max(0, Math.min(100, flowEnergy + amount));
    flowPeak = Math.max(flowPeak, flowEnergy);
    audio.setFlow?.(flowEnergy / 100);
  }

  function effectiveCombo() {
    return Math.max(Number(runState.combo) || 0, arcadeCombo);
  }

  function updateComboHud() {
    const combo = effectiveCombo();
    if (ui.combo) ui.combo.textContent = combo > 1 ? `连贯 ×${combo}` : "";
    root?.setAttribute("data-arcade-combo", String(arcadeCombo));
  }

  function powerupOptions(type) {
    if (type === "magnet") return { duration: 7.5, laneRange: 1 };
    if (type === "shield") return { duration: 10 };
    if (type === "multiplier") return { duration: 7.5, factor: 2 };
    return { duration: 3.4, speedBoost: 8.5 };
  }

  function activateArcadePowerup(type, earned = false) {
    const meta = POWERUP_META[type];
    if (!meta) return;
    motion.activatePowerup?.(type, powerupOptions(type));
    addFlow(type === "overdrive" ? 24 : 16);
    visualRuntime?.effect("perfect", { lane: motion.state.lane, z: 1.2, powerup: type });
    toast(earned ? `连贯奖励 · ${meta.label}` : `${meta.label}已启动`, 1250);
    haptic(type === "overdrive" ? [12, 18, 12, 24, 18] : [9, 16, 10]);
  }

  function addArcadeCombo(amount = 1) {
    arcadeCombo = Math.min(99, arcadeCombo + Math.max(0, Math.trunc(Number(amount) || 0)));
    arcadeBest = Math.max(arcadeBest, arcadeCombo);
    const rewardTier = Math.floor(arcadeCombo / 8);
    if (rewardTier > arcadeRewardTier) {
      arcadeRewardTier = rewardTier;
      activateArcadePowerup(ARCADE_POWERUP_ORDER[(rewardTier - 1) % ARCADE_POWERUP_ORDER.length], true);
    }
    updateComboHud();
  }

  function breakArcadeCombo() {
    arcadeCombo = 0;
    arcadePickupChain = 0;
    arcadeRewardTier = 0;
    updateComboHud();
  }

  function toast(text, duration = 1150) {
    if (!ui.toast) return;
    ui.toast.textContent = text;
    ui.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { ui.toast.hidden = true; }, duration);
  }

  function showRouteMessage(stage, duration = 2800) {
    if (!ui.routeMessage || !ui.routeCopy) return;
    const clock = ["18:12", "10:06", "19:21", "21:44", "08:03", "22:17", "06:38"][stage.order - 1] || "NOW";
    if (ui.routeTime) ui.routeTime.textContent = clock;
    ui.routeCopy.textContent = stage.opening;
    ui.routeMessage.hidden = false;
    clearTimeout(routeMessageTimer);
    routeMessageTimer = setTimeout(() => { ui.routeMessage.hidden = true; }, duration);
  }

  function getStageExperience(stageIndex = currentStageIndex()) {
    if (stageExperienceCache.has(stageIndex)) return stageExperienceCache.get(stageIndex);
    const fallback = STAGE_RUNTIME_FALLBACKS[Math.max(0, Math.min(STAGE_RUNTIME_FALLBACKS.length - 1, stageIndex))];
    const blueprint = content.getStageBlueprint?.(stageIndex + 1) || null;
    const authored = content.getStageExperience?.(stageIndex + 1) || content.STAGE_EXPERIENCES?.[stageIndex] || blueprint || {};
    const stage = content.STAGES[stageIndex];
    const blueprintPhases = blueprint?.segments?.map((segment, phaseIndex) => {
      const collectionPhase = blueprint.collectionPlan?.phases?.[phaseIndex] || {};
      const combinationIds = new Set(segment.obstacleCombinationIds || []);
      const combinations = blueprint.obstacleDesign?.combinations?.filter((entry) => combinationIds.has(entry.id)) || [];
      const obstacleIds = [...new Set(combinations.flatMap((entry) => entry.obstacleIds || []))];
      const obstacles = blueprint.obstacleDesign?.obstacles?.filter((entry) => obstacleIds.includes(entry.id)) || [];
      return {
        id: segment.id,
        venue: segment.name,
        worldCue: `${segment.storyBeat} ${segment.worldChange}`,
        storyBeat: segment.storyBeat,
        worldChange: segment.worldChange,
        transition: segment.transition,
        roadChange: segment.roadChange,
        landmarkIds: segment.landmarkIds || [],
        propIds: segment.propIds || [],
        visual: segment.visual || null,
        director: segment.director || null,
        material: segment.visual?.roadMaterialKey || blueprint.visual?.roadMaterialKey || blueprint.world?.roadDesign?.material,
        collectibleVisualKey: segment.visual?.collectibleVisualKey || null,
        collectibleKinds: collectionPhase.items?.map((item) => item.kind) || fallback.phases[phaseIndex].collectibleKinds,
        itemIds: collectionPhase.itemIds || segment.collectibleItemIds,
        obstacleForms: obstacles.map((entry) => entry.id),
        obstacleSemantics: obstacles,
        obstacleCombinations: combinations,
        props: collectionPhase.props || []
      };
    });
    const phases = Array.isArray(authored.phases) && authored.phases.length >= 3
      ? authored.phases
      : blueprintPhases?.length >= 3 ? blueprintPhases : fallback.phases;
    const performance = blueprint?.openingPerformance || authored.openingPerformance;
    const performanceLines = performance?.beats?.map((beat) => beat.line || beat.action).filter(Boolean) || [];
    const resolved = {
      ...fallback,
      ...authored,
      chapter: authored.chapter || fallback.chapter,
      introTitle: authored.introTitle || blueprint?.story?.continuity?.chapterTurn || authored.title || fallback.introTitle,
      introCopy: authored.introCopy || authored.opening || [performance?.trigger, ...performanceLines].filter(Boolean).join(" ") || stage.opening,
      objective: authored.objective || stage.objective,
      tone: authored.tone || blueprint?.world?.sceneMood?.location || stage.scene || fallback.tone,
      weather: authored.weather || blueprint?.world?.timeWeather?.progression || stage.weather,
      palette: authored.palette || blueprint?.world?.colorPalette?.description || stage.palette,
      blueprint,
      openingPerformance: performance,
      phases
    };
    stageExperienceCache.set(stageIndex, resolved);
    return resolved;
  }

  function getPhaseExperience(stageIndex = currentStageIndex(), phase = routePhase) {
    const experience = getStageExperience(stageIndex);
    return experience.phases[Math.max(0, Math.min(2, Number.isFinite(phase) ? phase : 0))] || experience.phases[0];
  }

  function clearStageWorld() {
    motion.clearEntities?.({ modules: true });
    if (!motion.clearEntities) {
      motion.state.entities.length = 0;
      motion.state.events.length = 0;
      motion.state.inputQueue.length = 0;
    }
    storyEchoes.length = 0;
    visualRuntime?.resetRoute?.(currentStageIndex());
  }

  function conditionBand(value = runState.condition) {
    if (value === runState.condition && ["steady", "strained", "danger", "critical", "failed"].includes(runState.conditionBand)) return runState.conditionBand;
    if (rules.getConditionStatus) return rules.getConditionStatus(value).id;
    if (value <= 0) return "failed";
    if (value <= 15) return "critical";
    if (value <= 35) return "danger";
    if (value <= 60) return "strained";
    return "steady";
  }

  function updateConditionFeedback(force = false) {
    const band = conditionBand();
    root?.setAttribute("data-condition-band", band);
    if (!force && band === lastConditionBand) return;
    lastConditionBand = band;
    const messages = {
      steady: "呼吸稳定，继续向前",
      strained: "连续碰撞会让这段路提前结束",
      danger: "心跳已经很乱，下一次失误会更危险",
      critical: "只剩最后一点坚持，先稳住脚步",
      failed: "心跳归零，这一程暂时停下"
    };
    const labels = { steady: "状态稳定", strained: "状态吃紧", danger: "进入危险", critical: "濒临失约", failed: "本程中断" };
    if (ui.danger) {
      ui.danger.setAttribute("data-level", band === "critical" || band === "failed" ? "critical" : "low");
      ui.danger.hidden = !["danger", "critical", "failed"].includes(band);
    }
    if (ui.dangerLabel) ui.dangerLabel.textContent = labels[band];
    if (ui.dangerValue) ui.dangerValue.textContent = String(Math.max(0, Math.round(runState.condition)));
    if (ui.dangerCopy) ui.dangerCopy.textContent = messages[band];
    if (visualRuntime?.setDanger) visualRuntime.setDanger(band, runState.condition);
    else visualRuntime?.setLowStateVisual?.(!["steady", "strained"].includes(band), { condition: runState.condition, status: band });
    audio.setDanger?.(band, runState.condition);
    if (!force && mode === "playing" && band !== "steady") {
      toast(messages[band], band === "critical" ? 2100 : 1650);
      haptic(band === "critical" ? [28, 22, 28] : [18, 30, 12]);
    }
  }

  function beginStageIntro(reason = "next") {
    const stageIndex = currentStageIndex();
    const stage = content.STAGES[stageIndex];
    const experience = getStageExperience(stageIndex);
    const storyAct = storyActForStage(stageIndex);
    clearTimeout(routeMessageTimer);
    show(ui.routeMessage, false);
    show(ui.stageIntro, false);
    syncMotionStage(false);
    if (!preserveRuntimeThroughIntro) {
      clearStageWorld();
      routePhase = 0;
    }
    stageIntroElapsed = 0;
    stageIntroDuration = reason === "retry"
      ? 3.4
      : Math.max(4.6, Math.min(7.2, Number(experience.openingPerformance?.durationMs) / 1000 || (reason === "resume" ? 3.8 : 4.6)));
    stageIntroBeat = -1;
    const clock = ["18:12", "10:06", "19:21", "21:44", "08:03", "22:17", "06:38"][stageIndex] || "NOW";
    stageIntroData = {
      stageIndex,
      stageId: stage.id,
      reason,
      chapter: experience.chapter,
      title: stage.name,
      storyTitle: experience.introTitle,
      scene: `${experience.tone} · ${experience.weather}`,
      copy: `${experience.introTitle}。${experience.introCopy}`,
      objective: experience.objective,
      palette: experience.palette,
      openingPerformance: experience.openingPerformance || null,
      currentBeat: null,
      progress: 0
    };
    applyDirectorCommands(director.enterStage({ stageIndex, stageId: stage.id, actIndex: 0, elapsed: runState.stage.elapsed }));
    const introPhase = Math.max(0, routePhase);
    const openingAct = experience.blueprint?.segments?.[introPhase] || experience.phases?.[introPhase] || experience.blueprint?.segments?.[0] || experience.phases?.[0];
    applyDirectorCommands(director.enterAct({
      actIndex: introPhase,
      actId: openingAct?.id,
      visual: openingAct?.visual,
      director: openingAct?.director,
      force: true
    }));
    commitDirectorState(false, runState.stage.progress === 0 && runState.checkpointSnapshot?.kind === "stage-start");
    mode = "stage-intro";
    root?.setAttribute("data-stage", String(stageIndex + 1));
    root?.setAttribute("data-story-act", storyAct.id);
    root?.setAttribute("data-stage-intro-reason", reason);
    root?.style?.setProperty?.("--stage-intro-duration", `${Math.round(stageIntroDuration * 1000)}ms`);
    if (ui.stageIntroChapter) ui.stageIntroChapter.textContent = `${storyAct.label} · 第${"一二三四五六七"[stageIndex]}程`;
    if (ui.stageIntroTitle) ui.stageIntroTitle.textContent = stage.name;
    if (ui.stageIntroScene) ui.stageIntroScene.textContent = stage.scene;
    if (ui.stageIntroTime) {
      ui.stageIntroTime.textContent = clock;
      ui.stageIntroTime.setAttribute("datetime", clock);
    }
    if (ui.stageIntroWeather) ui.stageIntroWeather.textContent = experience.weather;
    if (ui.stageIntroCopy) ui.stageIntroCopy.textContent = experience.openingPerformance?.trigger || `${experience.introTitle}。${experience.introCopy}`;
    if (ui.stageIntroObjective) ui.stageIntroObjective.textContent = experience.objective;
    show(ui.stageIntro, true);
    show(ui.result, false);
    show(ui.intro, false);
    visualRuntime?.beginStageIntro?.({
      ...stageIntroData,
      stageContent: experience.blueprint || content.STAGES[stageIndex]
    });
    audio.stageIntro?.(stageIntroData);
    updateStageIntroPerformance(true);
    updateHud();
    updateConditionFeedback(true);
    announce(`${experience.chapter}，${experience.introTitle}`);
    return stageIntroData;
  }

  function updateStageIntroPerformance(force = false) {
    if (!stageIntroData) return;
    const beats = stageIntroData.openingPerformance?.beats || [];
    if (!beats.length) return;
    const elapsedMs = stageIntroElapsed * 1000;
    let nextBeat = 0;
    for (let index = 1; index < beats.length; index += 1) {
      if (elapsedMs >= beats[index].atMs) nextBeat = index;
    }
    if (!force && nextBeat === stageIntroBeat) return;
    stageIntroBeat = nextBeat;
    const beat = beats[nextBeat];
    stageIntroData.currentBeat = { ...beat, index: nextBeat };
    if (ui.stageIntroCopy) ui.stageIntroCopy.textContent = [beat.action, beat.line].filter(Boolean).join(" ");
    visualRuntime?.stageIntroBeat?.({ ...stageIntroData, beat, beatIndex: nextBeat });
    audio.stageBeat?.({ ...stageIntroData, beat, beatIndex: nextBeat });
    if (!force && beat.line) announce(beat.line);
  }

  function finishStageIntro() {
    if (mode !== "stage-intro") return false;
    show(ui.stageIntro, false);
    visualRuntime?.endStageIntro?.();
    stageIntroElapsed = 0;
    stageIntroDuration = 0;
    stageIntroData = null;
    stageIntroBeat = -1;
    syncMotionStage(false);
    if (!preserveRuntimeThroughIntro) {
      clearStageWorld();
      spawnClock = 0;
      beatClock = 0;
    }
    preserveRuntimeThroughIntro = false;
    // The run begins as soon as the opening performance clears. Requiring a
    // first gesture to prime the clock made the scene look frozen and caused
    // early swipes to be consumed without visible feedback on touch screens.
    runPrimed = true;
    mode = "playing";
    updateHud();
    showRouteMessage(currentStage(), 1800);
    announce(`${getPhaseExperience().venue}，出发`);
    return true;
  }

  function syncMotionStage(emitChange) {
    const index = currentStageIndex();
    if (emitChange) motion.syncStage(index);
    else motion.seekStage(index);
  }

  function updateCargoHud() {
    if (!ui.cargo) return;
    const items = runState.stage.items.slice(-3).map((id) => content.getItem(id));
    ui.cargo.innerHTML = "";
    items.forEach((item) => {
      const node = document.createElement("span");
      node.textContent = item.name;
      node.setAttribute("data-kind", item.kind);
      ui.cargo.appendChild(node);
    });
    ui.cargo.hidden = items.length === 0;
  }

  function updateRunFeedback() {
    const speedTier = Math.max(0, Math.min(4, Math.trunc(Number(motion.state.speedTier) || 0)));
    const speedProgress = motion.state.powerups?.overdrive?.active
      ? 1
      : Math.max(0.02, Math.min(1, Number(motion.state.speedProgress) || 0));
    if (ui.speedState) ui.speedState.setAttribute("data-tier", String(speedTier));
    if (ui.speedLabel) ui.speedLabel.textContent = SPEED_LABELS[speedTier];
    if (ui.speedFill) ui.speedFill.style.transform = `scaleX(${speedProgress})`;
    updateComboHud();

    const activePowerups = Object.entries(motion.state.powerups || {})
      .filter(([, powerup]) => powerup?.active && Number(powerup.remaining) > 0)
      .map(([type, powerup]) => {
        const remaining = Number(powerup.remaining) || 0;
        const duration = Math.max(remaining, Number(powerup.duration) || remaining || 1);
        return { type, remaining, progress: Math.max(0, Math.min(1, remaining / duration)) };
      });
    const signature = activePowerups.map(({ type, remaining }) => `${type}:${Math.ceil(remaining * 4)}`).join("|");
    if (!ui.powerupRack || signature === powerupHudSignature) return;
    powerupHudSignature = signature;
    ui.powerupRack.innerHTML = "";
    activePowerups.forEach(({ type, progress }) => {
      const meta = POWERUP_META[type];
      if (!meta) return;
      const chip = document.createElement("span");
      chip.className = "powerup-chip";
      chip.style.setProperty("--powerup-color", meta.color);
      chip.style.setProperty("--powerup-progress", `${Math.round(progress * 100)}%`);
      chip.innerHTML = `<i>${meta.glyph}</i><b>${meta.label}</b>`;
      ui.powerupRack.appendChild(chip);
    });
  }

  function signalSpeedTier() {
    const nextTier = Math.max(0, Math.min(4, Math.trunc(Number(motion.state.speedTier) || 0)));
    if (motion.state.powerups?.overdrive?.active) return;
    if (lastSpeedTier >= 0 && nextTier > lastSpeedTier && mode === "playing") {
      const labels = ["", "城市节拍正在提速", "风景开始向后流动", "脚步进入冲刺节奏", "此刻只管向前"];
      toast(labels[nextTier], 1250);
      visualRuntime?.effect("energy", { lane: motion.state.lane, z: 1.4, speedTier: nextTier });
      audio.powerup?.("overdrive", "sustain");
      addFlow(5 + nextTier * 2);
      haptic(nextTier >= 3 ? [7, 18, 9] : 7);
    }
    lastSpeedTier = nextTier;
  }

  function updateRoutePhase(force = false) {
    const definition = rules.STAGES[currentStageIndex()];
    const progressRatio = runState.stage.progress / Math.max(1, definition.target);
    const phases = getStageExperience(currentStageIndex()).blueprint?.segments || getStageExperience(currentStageIndex()).phases;
    let nextPhase = 0;
    for (let index = 1; index < Math.min(3, phases.length); index += 1) {
      const threshold = Number(phases[index]?.progress?.[0]);
      if (progressRatio >= (Number.isFinite(threshold) ? threshold : index / 3)) nextPhase = index;
    }
    if (!force && nextPhase === routePhase) return;
    routePhase = nextPhase;
    const route = content.getRoute(currentStageIndex() + 1);
    const venue = route.venues[nextPhase] || currentStage().destination;
    if (ui.destination) ui.destination.textContent = nextPhase === 2 ? `接近 ${currentStage().destination}` : `途经 ${venue}`;
    root?.setAttribute("data-route-phase", String(nextPhase + 1));
    const phase = getPhaseExperience(currentStageIndex(), nextPhase);
    visualRuntime?.setRoutePhase?.(nextPhase, phase);
    applyDirectorCommands(director.enterAct({
      actIndex: nextPhase,
      actId: phase.id,
      visual: phase.visual,
      director: phase.director
    }));
    commitDirectorState(false);
    if (!force && mode === "playing") toast(venue, 1500);
  }

  function syncCarryFromState() {
    visualRuntime?.clearCarry?.();
    runState.stage.items.slice(-3).forEach((id) => visualRuntime?.carry?.(content.getItem(id)));
  }

  function updateHud() {
    const index = currentStageIndex();
    const stage = content.STAGES[index];
    const definition = rules.STAGES[index];
    const storyAct = storyActForStage(index);
    root?.setAttribute("data-stage", String(index + 1));
    root?.setAttribute("data-story-act", storyAct.id);
    if (ui.stageKicker) ui.stageKicker.textContent = `${storyAct.label} · 第${"一二三四五六七"[index]}程`;
    if (ui.stageName) ui.stageName.textContent = stage.destination;
    if (ui.destination) ui.destination.textContent = `去 ${stage.destination}`;
    if (ui.condition) ui.condition.textContent = runState.condition;
    if (ui.conditionFill) ui.conditionFill.style.transform = `scaleX(${runState.condition / 100})`;
    updateConditionFeedback();
    const current = runState.status === "completed" ? definition.target : runState.stage.progress;
    if (ui.progress) ui.progress.textContent = `${current} / ${definition.target}`;
    if (ui.progressFill) ui.progressFill.style.transform = `scaleX(${Math.min(1, current / definition.target)})`;
    updateComboHud();
    if (ui.stageTrack) Array.from(ui.stageTrack.children).forEach((item, itemIndex) => {
      item.classList.toggle("is-done", itemIndex < runState.stageIndex);
      item.classList.toggle("is-current", itemIndex === index);
    });
    const save = safeLoad();
    show(ui.newGamePlus, Boolean(save?.profile?.newGamePlusUnlocked));
    updateCargoHud();
    updateRoutePhase(routePhase < 0);
    audio.setStage(index + 1, runState.condition, effectiveCombo());
  }

  function reset(newGamePlus) {
    runState = rules.createRunState({ newGamePlus: Boolean(newGamePlus) });
    motion = createMotion();
    director = directorApi.createDirector();
    mode = "intro";
    pausedStage = null;
    spawnClock = 0;
    patternCursor = 0;
    beatClock = 0;
    arrivalElapsed = 0;
    arrivalDuration = 0;
    arrivalData = null;
    arrivalInteraction = null;
    stageIntroElapsed = 0;
    stageIntroDuration = 0;
    stageIntroData = null;
    stageIntroBeat = -1;
    routePhase = -1;
    flowEnergy = 0;
    flowPeak = 0;
    arcadeCombo = 0;
    arcadeBest = 0;
    arcadePickupChain = 0;
    arcadeRewardTier = 0;
    storyEchoes = [];
    lastSpeedTier = -1;
    lastConditionBand = "steady";
    powerupHudSignature = "";
    deferredDirectorCommands = [];
    checkpointRuntime = null;
    preserveRuntimeThroughIntro = false;
    runPrimed = false;
    completionSaved = false;
    clearTimeout(routeMessageTimer);
    show(ui.routeMessage, false);
    show(ui.arrival, false);
    show(ui.stageIntro, false);
    show(ui.failure, false);
    show(ui.result, false);
    show(ui.intro, true);
    visualRuntime?.clearCarry?.();
    updateHud();
    updateRunFeedback();
    return snapshot();
  }

  function start(saved, immediate = false) {
    audio.start();
    if (saved?.run?.status === "playing") runState = saved.run;
    const savedStory = storyEnvelope(runState);
    const restoredRuntime = saved?.run?.status === "playing" ? savedStory.worldState?.runtime || null : null;
    director = directorApi.createDirector({ state: storySnapshotFromRun(runState) });
    motion = createMotion(restoredRuntime);
    checkpointRuntime = runState?.checkpointSnapshot?.story?.worldState?.runtime || restoredRuntime;
    if (restoredRuntime) {
      restoreScheduler(savedStory.worldState?.scheduler || savedStory.worldState);
      preserveRuntimeThroughIntro = true;
    }
    syncMotionStage(false);
    show(ui.intro, false);
    show(ui.result, false);
    show(ui.failure, false);
    updateRunFeedback();
    syncCarryFromState();
    beginStageIntro(saved?.run?.status === "playing" ? "resume" : "start");
    if (immediate) finishStageIntro();
  }

  function updateArrivalPrompt() {
    if (!ui.arrivalAction || !arrivalInteraction) return;
    const active = arrivalInteraction.prompted && !arrivalInteraction.completed;
    ui.arrivalAction.hidden = !active;
    if (active) ui.arrivalAction.textContent = arrivalInteraction.prompts[arrivalInteraction.step];
  }

  function handleArrivalInput(action) {
    if (!arrivalInteraction || arrivalInteraction.completed || !arrivalInteraction.prompted) return false;
    const expected = arrivalInteraction.sequence[arrivalInteraction.step];
    if (action !== expected) {
      visualRuntime?.effect("arrival-interaction", { outcome: "strained", action, expected, stageIndex: pausedStage });
      audio.cue("near-miss");
      haptic(8);
      return false;
    }
    arrivalInteraction.step += 1;
    const completed = arrivalInteraction.step >= arrivalInteraction.sequence.length;
    arrivalInteraction.completed = completed;
    visualRuntime?.effect("arrival-interaction", {
      outcome: "clean",
      action,
      step: arrivalInteraction.step,
      total: arrivalInteraction.sequence.length,
      completed,
      stageIndex: pausedStage
    });
    visualRuntime?.applyDirectorCommand?.({
      id: `arrival:${pausedStage}:${arrivalInteraction.step}`,
      channel: "scene",
      op: completed ? "semantic-gate-complete" : "semantic-beat",
      key: completed ? "arrival-complete" : "arrival-step",
      durationMs: completed ? 1600 : 850,
      payload: { stageIndex: pausedStage, actIndex: 2, completed, semanticStep: action }
    });
    audio.action(action);
    audio.cue(completed ? "arrival" : "perfect");
    haptic(completed ? [12, 28, 18] : 10);
    if (completed) announce(arrivalInteraction.completedCopy);
    updateArrivalPrompt();
    return true;
  }

  function input(action) {
    if (mode === "arrival") return handleArrivalInput(action);
    if (mode !== "playing") return false;
    runPrimed = true;
    motion.input(action);
    audio.start();
    audio.action(action);
    return true;
  }

  function obstacleSubtype(stageIndex, form, themedForm) {
    if (themedForm && !["barrier", "service-cart", "signal-gate", "train"].includes(themedForm)) return themedForm;
    const mapping = STAGE_OBSTACLE_FORMS[stageIndex] || STAGE_OBSTACLE_FORMS[0];
    if (form === "train") return mapping.train;
    if (form === "service-cart") return mapping.cart;
    if (form === "signal-gate") return mapping.gate;
    return mapping.barrier;
  }

  function spawnPattern() {
    if (mode !== "playing") return false;
    const activeAhead = motion.state.entities.filter((entity) => entity.active && entity.z > 8);
    if (activeAhead.length > 72) return false;
    const farthest = activeAhead.reduce((maximum, entity) => Math.max(maximum, entity.z), 0);
    if (farthest > 92) return false;
    const stageIndex = currentStageIndex();
    const phaseIndex = Math.max(0, routePhase);
    const experience = getStageExperience(stageIndex);
    const phase = getPhaseExperience(stageIndex, phaseIndex);
    const directorPlan = director.planPattern({
      ordinal: patternCursor,
      currentLane: motion.state.lane,
      actIndex: phaseIndex
    });
    const semanticBlueprints = phase.obstacleCombinations?.map((combination, combinationIndex) => ({
      id: combination.id,
      choiceZ: 43,
      obstacles: (combination.obstacleIds || []).map((obstacleId, obstacleIndex) => {
        const semantic = phase.obstacleSemantics?.find((entry) => entry.id === obstacleId) || {};
        const avoid = semantic.response === "slide" ? "slide" : semantic.response === "jump" ? "jump" : "switch";
        return {
          lane: [-1, 1, 0][(patternCursor + obstacleIndex + combinationIndex) % 3],
          z: 10 + obstacleIndex * 12,
          avoid,
          form: avoid === "slide" ? "signal-gate" : avoid === "jump" ? "barrier" : "service-cart",
          themeForm: obstacleId,
          rewardNearMiss: avoid === "switch"
        };
      })
    })).filter((entry) => entry.obstacles.length);
    const authoredPatterns = Array.isArray(phase.patterns)
      ? phase.patterns
      : Array.isArray(experience.patterns?.[phaseIndex]) ? experience.patterns[phaseIndex] : semanticBlueprints;
    const candidates = authoredPatterns?.filter((entry) => Array.isArray(entry?.obstacles) && entry.obstacles.length) || PATTERN_BLUEPRINTS;
    const blueprint = candidates[(patternCursor + stageIndex * 2 + phaseIndex) % candidates.length];
    const onboardingAction = stageIndex === 0 && patternCursor < ONBOARDING_ACTIONS.length
      ? ONBOARDING_ACTIONS[patternCursor]
      : null;
    const firstAction = onboardingAction || directorPlan.action;
    const baseZ = Math.max(onboardingAction ? 36 : 31, motion.state.speed * 1.42, farthest + 10);
    const rowSpacing = Math.max(11.8, motion.state.speed * 0.62);
    const zRows = [...new Set(blueprint.obstacles.map((entry) => Number(entry.z) || 0))].sort((left, right) => left - right);
    const patternId = `${content.STAGES[stageIndex].id}-${blueprint.id}-${patternCursor}`;
    blueprint.obstacles.forEach((spec, row) => {
      const rowOrdinal = Math.max(0, zRows.indexOf(Number(spec.z) || 0));
      const requiredAction = rowOrdinal === 0 ? firstAction : spec.avoid;
      const matchingRow = blueprint.obstacles.filter((entry) => entry.z === spec.z);
      if (rowOrdinal === 0 && matchingRow[0] !== spec) return;
      const occupiedLanes = new Set(matchingRow.map((entry) => entry.lane));
      const candidateLanes = [-1, 0, 1].filter((lane) => !occupiedLanes.has(lane));
      const primaryLane = rowOrdinal === 0 ? motion.state.lane : spec.lane;
      const pairedLane = rowOrdinal > 0 && matchingRow.length === 1 && row % 2 === patternCursor % 2
        ? candidateLanes[(patternCursor + row + stageIndex) % candidateLanes.length]
        : null;
      [primaryLane, pairedLane].filter((lane) => lane !== null).forEach((lane, laneIndex) => {
        const themedForms = phase.obstacleForms || phase.obstacles || [];
        const themedForm = spec.themeForm || themedForms[(patternCursor + row + laneIndex) % Math.max(1, themedForms.length)];
        const form = requiredAction === "slide" ? "signal-gate" : requiredAction === "jump" ? "barrier" : "service-cart";
        const subtype = obstacleSubtype(stageIndex, form, themedForm);
        motion.spawn({
          type: "obstacle",
          lane,
          z: baseZ + rowOrdinal * rowSpacing,
          avoid: requiredAction,
          subtype,
          variant: (patternCursor + row + stageIndex + laneIndex) % 5,
          rewardNearMiss: requiredAction === "switch" || Boolean(spec.rewardNearMiss),
          patternId,
          momentId: `${patternId}-obstacle-${row}-${laneIndex}`,
          data: {
            venue: phase.venue || content.getRoute(stageIndex + 1).venues[phaseIndex],
            stageId: content.STAGES[stageIndex].id,
            stageIndex,
            phase: phaseIndex,
            actId: phase.id,
            causeId: directorPlan.causeId,
            nodeId: `${directorPlan.causeId}:action`,
            choicePending: directorPlan.choiceDue,
            requiredAction,
            semanticStep: directorPlan.semanticStep,
            semanticKey: directorPlan.semanticKey,
            relationshipMode: directorPlan.relationshipMode,
            worldCue: phase.worldCue,
            themeForm: themedForm || subtype,
            material: phase.material || experience.material || experience.tone
          }
        });
      });
    });

    const collectibleKinds = phase.collectibleKinds || phase.collectibles || ["stage-token"];
    const switchLane = directorPlan.collectibleLanes.find((lane) => lane !== motion.state.lane)
      ?? (motion.state.lane === 0 ? (patternCursor % 2 ? -1 : 1) : 0);
    const tokenCount = 12;
    for (let tokenIndex = 0; tokenIndex < tokenCount; tokenIndex += 1) {
      const guideProgress = tokenIndex / (tokenCount - 1);
      const lane = firstAction === "switch" && tokenIndex >= 4 ? switchLane : motion.state.lane;
      const jumpArc = firstAction === "jump"
        ? Math.max(0, Math.sin(Math.PI * Math.max(0, Math.min(1, (guideProgress - 0.16) / 0.72)))) * 1.12
        : 0;
      const collectibleKind = collectibleKinds[(patternCursor + tokenIndex) % collectibleKinds.length];
      motion.spawn({
        type: "collectible",
        lane,
        z: baseZ - 13 + tokenIndex * 2.15,
        points: 4 + stageIndex,
        patternId,
        row: tokenIndex,
        height: jumpArc,
        arc: jumpArc,
        data: {
          collectibleKind,
          stageId: content.STAGES[stageIndex].id,
          stageIndex,
          phase: phaseIndex,
          venue: phase.venue,
          worldCue: phase.worldCue,
          color: phase.collectibleColor || experience.collectibleColor || null
        }
      });
    }

    const allItemIds = content.STAGE_ITEM_IDS[stageIndex];
    const authoredItemIds = phase.itemIds || phase.storyItemIds;
    const third = Math.max(1, Math.ceil(allItemIds.length / 3));
    const phaseItemIds = allItemIds.slice(phaseIndex * third, Math.min(allItemIds.length, (phaseIndex + 1) * third));
    const itemIds = Array.isArray(authoredItemIds) && authoredItemIds.length ? authoredItemIds : phaseItemIds.length ? phaseItemIds : allItemIds;
    const choiceGroup = `${patternId}-route`;
    const obstacleExitZ = baseZ + Math.max(1, zRows.length) * rowSpacing;
    if ((patternCursor + 1) % 4 === 0) {
      const powerupType = ARCADE_POWERUP_ORDER[Math.floor(patternCursor / 4) % ARCADE_POWERUP_ORDER.length];
      const powerupLane = directorPlan.collectibleLanes[(patternCursor + stageIndex) % directorPlan.collectibleLanes.length] ?? motion.state.lane;
      motion.spawn({
        type: "powerup",
        lane: powerupLane,
        z: obstacleExitZ + 6,
        points: 20,
        patternId,
        label: POWERUP_META[powerupType].label,
        data: {
          powerupPickup: powerupType,
          stageIndex,
          phase: phaseIndex,
          venue: phase.venue
        }
      });
    }
    const choiceZ = obstacleExitZ + 17;
    directorPlan.choiceLanes.forEach((lane, laneOffset) => {
      const itemId = itemIds[(patternCursor + laneOffset + stageIndex) % itemIds.length];
      const item = content.getItem(itemId);
      const interactionProfile = content.getInteractionProfile(itemId);
      motion.spawn({
        type: "route-choice",
        lane,
        z: choiceZ,
        itemId,
        choiceGroup,
        choiceId: `${choiceGroup}-${itemId}`,
        patternId,
        points: 12 + stageIndex * 2,
        interaction: item.action,
        label: item.name,
        data: {
          itemId,
          choiceGroup,
          choiceId: `${choiceGroup}-${itemId}`,
          interaction: item.action,
          kind: item.kind,
          color: item.color,
          label: item.name,
          line: item.line,
          stageId: content.STAGES[stageIndex].id,
          stageIndex,
          phase: phaseIndex,
          actId: phase.id,
          decisionId: choiceGroup,
          alternatives: directorPlan.choiceLanes.map((_, alternativeIndex) => itemIds[(patternCursor + alternativeIndex + stageIndex) % itemIds.length]),
          inputSeqAtSpawn: motion.state.inputSeq,
          causeId: directorPlan.causeId,
          nodeId: `${directorPlan.causeId}:choice`,
          venue: phase.venue,
          worldCue: phase.worldCue,
          interactionProfile,
          semanticStep: directorPlan.semanticStep,
          semanticKey: directorPlan.semanticKey,
          relationshipMode: directorPlan.relationshipMode
        }
      });
    });
    patternCursor += 1;
    return true;
  }

  function applyMoment(moment) {
    if (runState.status !== "playing") return;
    const before = runState.stageIndex;
    const beforeProgress = runState.stage.progress;
    const definition = rules.STAGES[before];
    const beforeItems = runState.stage.items.slice();
    runState = rules.recordMoment(runState, moment);
    const checkpointReached = before === runState.stageIndex
      && beforeProgress < definition.checkpoint
      && runState.stage.progress >= definition.checkpoint;
    commitDirectorState(checkpointReached);
    updateHud();
    persist();
    if (runState.status === "failed") {
      showFailure();
      return;
    }
    if (runState.stageIndex !== before || runState.status === "completed") {
      const record = runState.stageRecords.find((item) => item.id === rules.STAGES[before].id);
      const commands = director.ingest({ id: `stage-complete:${before}:${runState.totalAttempts}`, type: "stage-completed", stageIndex: before });
      applyDirectorCommands(commands);
      beginArrival(before, record?.items?.length ? record.items : beforeItems, director.selectArrival());
    }
  }

  function collectStoryItem(entity) {
    const item = content.getItem(entity.itemId || entity.data?.itemId);
    const input = motion.state.lastInput;
    const choiceWindowOpenedAt = Number(entity.data?.choiceWindowOpenedAt);
    const inputSeqAtWindow = Number(entity.data?.inputSeqAtWindow);
    const intentional = Boolean(input
      && Number.isFinite(choiceWindowOpenedAt)
      && input.seq > (Number.isFinite(inputSeqAtWindow) ? inputSeqAtWindow : Number(entity.data?.inputSeqAtSpawn) || 0)
      && ["left", "right"].includes(input.action)
      && input.time >= choiceWindowOpenedAt
      && motion.state.elapsed - input.time <= 1.35
      && Math.abs(motion.state.lanePosition - entity.lane) < 0.42);
    if (!intentional) {
      recordDirectorFact({
        id: `choice-passive:${entity.choiceGroup || entity.id}`,
        type: "route-choice-missed",
        decisionId: entity.data?.decisionId || entity.choiceGroup,
        nodeId: entity.data?.nodeId,
        inputSeq: input?.seq || 0
      });
      return;
    }
    const outcome = input.seq === (Number.isFinite(inputSeqAtWindow) ? inputSeqAtWindow : 0) + 1
      && motion.state.elapsed - input.time <= 0.8 ? "perfect" : "good";
    const interaction = content.resolveCollectionInteraction({
      itemId: item.id,
      collectedItemIds: runState.collectedItems,
      combo: runState.combo + 1,
      stageIndex: currentStageIndex()
    });
    const effect = currentStageIndex() === 5 && interaction.gameplay.effect === "overdrive"
      ? "shield"
      : interaction.gameplay.effect;
    const duration = interaction.gameplay.durationMs / 1000;
    const powerupOptions = { duration };
    if (effect === "magnet") powerupOptions.laneRange = 1;
    if (effect === "multiplier") powerupOptions.factor = interaction.gameplay.multiplier.scoreMultiplier;
    if (effect === "overdrive") powerupOptions.speedBoost = Math.max(2.4, (interaction.gameplay.overdrive.speedMultiplier - 1) * 12);
    const presentation = { ...interaction, item, lane: entity.lane, z: entity.z, duration };

    motion.activatePowerup?.(effect, powerupOptions);
    visualRuntime?.effect("story-pickup", { ...entity, item, interaction });
    visualRuntime?.effect("story-world", presentation);
    visualRuntime?.carry?.(item);
    audio.cue(outcome, item.kind);
    audio.interaction?.(interaction);
    if (interaction.synergy.active.length) {
      visualRuntime?.effect("story-synergy", presentation);
      addFlow(12 + interaction.synergy.active.length * 4);
      haptic([10, 20, 12, 28, 16]);
    }
    spawnInteractionTrail(effect, interaction.gameplay.strength);
    scheduleStoryEchoes(interaction, item);
    addArcadeCombo(2);
    addFlow(outcome === "perfect" ? 24 : 17);
    haptic(outcome === "perfect" ? [12, 22, 16] : 12);
    announce(interaction.narrative.currentEvent);
    recordDirectorFact({
      id: `choice:${entity.choiceId || entity.id}`,
      type: "route-choice",
      decisionId: entity.data?.decisionId || entity.choiceGroup,
      itemId: item.id,
      alternatives: entity.data?.alternatives || [],
      resolution: outcome === "perfect" ? "clean" : "recovered",
      quality: outcome,
      worldEffect: getPhaseExperience().director?.worldState || getPhaseExperience().worldChange,
      gesture: getPhaseExperience().director?.storyVerb,
      musicCue: getPhaseExperience().director?.rhythm,
      relationshipAxis: item.relationshipAxis,
      semanticStep: entity.data?.semanticStep,
      semanticKey: entity.data?.semanticKey,
      inputSeq: input.seq,
      nodeId: entity.data?.nodeId,
      causeId: entity.data?.causeId
    });
  }

  function spawnInteractionTrail(effect, strength) {
    const count = effect === "magnet" ? 9 : effect === "multiplier" ? 8 : effect === "overdrive" ? 10 : 7;
    const baseZ = 11;
    for (let index = 0; index < count; index += 1) {
      const lane = effect === "magnet"
        ? [-1, 1, 0][index % 3]
        : effect === "multiplier"
          ? [-1, 0, 1, 0][index % 4]
          : effect === "shield"
            ? [motion.state.lane, motion.state.lane, -motion.state.lane || 1][index % 3]
            : motion.state.lane;
      motion.spawn({
        type: "collectible",
        lane,
        z: baseZ + index * (effect === "overdrive" ? 2.45 : 2.9),
        points: Math.round(5 + Number(strength || 0) * 7),
        arc: effect === "magnet" ? Math.sin(index * 1.2) * 0.42 : effect === "multiplier" ? (index % 2) * 0.32 : 0,
        data: { powerupTrail: effect }
      });
    }
  }

  function scheduleStoryEchoes(interaction, item) {
    const lines = interaction.narrative.laterEchoes.filter(Boolean).slice(0, interaction.synergy.active.length ? 2 : 1);
    lines.forEach((line, index) => {
      storyEchoes.push({
        atDistance: motion.state.distance + 46 + index * 28,
        line,
        item,
        interaction
      });
    });
    storyEchoes.sort((left, right) => left.atDistance - right.atDistance);
    if (storyEchoes.length > 6) storyEchoes.splice(6);
  }

  function processStoryEchoes() {
    if (!storyEchoes.length || motion.state.distance < storyEchoes[0].atDistance) return;
    const echo = storyEchoes.shift();
    const interaction = {
      ...echo.interaction,
      item: echo.item,
      duration: 1.9,
      world: { ...echo.interaction.world, intensity: Math.max(0.35, echo.interaction.world.intensity * 0.58) },
      music: { ...echo.interaction.music, intensity: Math.max(0.3, echo.interaction.music.intensity * 0.52) },
      synergy: { ...echo.interaction.synergy, active: [] }
    };
    visualRuntime?.effect("story-world", interaction);
    audio.interaction?.(interaction);
    announce(echo.line);
  }

  function handleMotionEvents(events) {
    events.forEach((event) => {
      if (event.type === "collect") {
        if (["story-item", "route-choice"].includes(event.entity.type)) collectStoryItem(event.entity);
        else if (event.entity.type === "powerup") {
          const type = event.entity.data?.powerupPickup;
          activateArcadePowerup(type, false);
          addArcadeCombo(2);
          visualRuntime?.effect("story-pickup", { ...event.entity, powerup: type });
          audio.cue("perfect");
        }
        else if (event.entity.type === "collectible") {
          const magnetPickup = event.source === "magnet";
          arcadePickupChain += 1;
          if (arcadePickupChain % 4 === 0) addArcadeCombo(1);
          addFlow((magnetPickup ? 10 : 7) + Math.min(5, runState.combo));
          motion.boost?.(0.7, 0.72);
          visualRuntime?.effect("energy", { ...event.entity, source: event.source, multiplier: event.multiplier });
          audio.cue("energy");
          if (magnetPickup) audio.powerup?.("magnet", "sustain");
          if (event.multiplier > 1) audio.powerup?.("multiplier", "sustain");
          haptic(5);
        }
      } else if (event.type === "choice-window") {
        visualRuntime?.effect("choice-window", event.entity);
        audio.cue("choice");
        haptic(4);
      } else if (event.type === "powerup-start") {
        visualRuntime?.effect("powerup-start", event);
        audio.powerup?.(event.powerup, "start");
      } else if (event.type === "powerup-end") {
        visualRuntime?.effect("powerup-end", event);
        audio.powerup?.(event.powerup, "end");
      } else if (event.type === "shield-block") {
        visualRuntime?.effect("shield-block", event);
        audio.powerup?.("shield", "block");
        addFlow(9);
        haptic([18, 24, 9]);
        toast("守护替你接住了这次碰撞", 1300);
      } else if (event.type === "collision") {
        breakArcadeCombo();
        visualRuntime?.effect("miss", event.entity);
        audio.cue("miss");
        addFlow(-42);
        haptic([42, 24, 34]);
        toast("脚步乱了一下", 900);
        recordDirectorFact({
          id: `collision:${event.seq}`,
          type: "obstacle-hit",
          causeId: event.entity.data?.causeId || event.entity.patternId || event.entity.id,
          nodeId: event.entity.data?.nodeId,
          inputSeq: event.inputSeq,
          severity: event.entity.subtype === "train" ? "heavy" : "normal",
          semanticStep: event.entity.data?.semanticStep,
          semanticKey: event.entity.data?.semanticKey,
          action: event.input?.action
        });
        applyMoment({ outcome: "miss", kind: "collision" });
      } else if (event.type === "dodge") {
        addArcadeCombo(1);
        visualRuntime?.effect("dodge", event.entity);
        audio.cue("good");
        addFlow(9);
        haptic(8);
        recordDirectorFact({
          id: `dodge:${event.seq}`,
          type: "obstacle-dodged",
          causeId: event.entity.data?.causeId || event.entity.patternId || event.entity.id,
          nodeId: event.entity.data?.nodeId,
          patternId: event.entity.patternId,
          action: event.action,
          inputSeq: event.inputSeq,
          semanticStep: event.entity.data?.semanticStep,
          semanticKey: event.entity.data?.semanticKey,
          choicePending: Boolean(event.entity.data?.choicePending)
        });
      } else if (event.type === "near-miss") {
        addArcadeCombo(2);
        visualRuntime?.effect("near-miss", event.entity);
        audio.cue("near-miss");
        addFlow(15);
        haptic([8, 14, 8]);
        if (runState.status === "playing") runState = rules.recordNearMiss(runState);
        const intentional = event.entity.avoid === "switch"
          && ["left", "right"].includes(event.input?.action)
          && event.time - Number(event.input?.time || -10) <= 0.72;
        recordDirectorFact({
          id: `near:${event.seq}`,
          type: "near-miss",
          causeId: event.entity.data?.causeId || event.entity.patternId || event.entity.id,
          nodeId: event.entity.data?.nodeId,
          patternId: event.entity.patternId,
          action: event.input?.action,
          inputSeq: event.inputSeq,
          intentional,
          semanticStep: event.entity.data?.semanticStep,
          semanticKey: event.entity.data?.semanticKey,
          choicePending: Boolean(event.entity.data?.choicePending)
        });
        updateHud();
      } else if (event.type === "story-missed") {
        visualRuntime?.effect("story-missed", event.entity);
        recordDirectorFact({
          id: `story-missed:${event.entity.choiceGroup || event.entity.id}`,
          type: "route-choice-missed",
          decisionId: event.entity.data?.decisionId || event.entity.choiceGroup,
          nodeId: event.entity.data?.nodeId,
          inputSeq: motion.state.inputSeq
        });
      }
    });
  }

  function beginArrival(stageIndex, itemIds, directorArrival = director.selectArrival()) {
    pausedStage = stageIndex;
    const authoredItems = directorArrival.featuredItemId
      ? [directorArrival.featuredItemId]
      : itemIds;
    arrivalData = content.selectArrival({
      stage: stageIndex + 1,
      itemIds: authoredItems.length ? authoredItems : itemIds,
      seed: `${stageIndex}-${directorArrival.featuredItemId || "arrival"}-${Object.keys(directorArrival.decisions || {}).join("|")}`
    });
    const featuredItem = content.getItem(arrivalData.itemId);
    const supportingItems = itemIds.filter((id) => id !== featuredItem.id).slice(-2).map((id) => content.getItem(id));
    const stagedItems = supportingItems.length > 1
      ? [supportingItems[0], featuredItem, supportingItems[1]]
      : supportingItems.length ? [featuredItem, supportingItems[0]] : [featuredItem];
    arrivalData = {
      ...arrivalData,
      stageIndex,
      itemIds: itemIds.slice(),
      items: stagedItems,
      director: directorArrival,
      relationshipTail: directorArrival.tail,
      final: runState.status === "completed"
    };
    arrivalDuration = arrivalData.durationMs / 1000;
    arrivalElapsed = 0;
    const interactionDefinition = ARRIVAL_INTERACTIONS[stageIndex];
    arrivalInteraction = interactionDefinition ? {
      sequence: interactionDefinition.sequence.slice(),
      prompts: interactionDefinition.prompts.slice(),
      completedCopy: interactionDefinition.completed,
      step: 0,
      prompted: false,
      completed: false,
      holdAt: arrivalDuration * 0.56
    } : null;
    mode = "arrival";
    clearTimeout(routeMessageTimer);
    show(ui.routeMessage, false);
    show(ui.stageIntro, false);
    motion.state.entities.length = 0;
    const storyAct = storyActForStage(stageIndex);
    root?.setAttribute("data-story-act", storyAct.id);
    if (ui.stageKicker) ui.stageKicker.textContent = `${storyAct.label} · 第${"一二三四五六七"[stageIndex]}程`;
    if (ui.stageName) ui.stageName.textContent = arrivalData.venue;
    if (ui.arrivalKicker) ui.arrivalKicker.textContent = arrivalData.venue;
    if (ui.arrivalTitle) ui.arrivalTitle.textContent = arrivalData.itemName;
    if (ui.arrivalCopy) ui.arrivalCopy.textContent = arrivalData.line;
    if (ui.arrivalAction) ui.arrivalAction.hidden = true;
    show(ui.arrival, true);
    root?.setAttribute("data-arrival-stage", String(stageIndex + 1));
    visualRuntime?.beginArrival?.(arrivalData);
    audio.cue("arrival", content.getItem(arrivalData.itemId).kind);
    announce(`${arrivalData.venue}，${arrivalData.line}`);
  }

  function finishArrival() {
    if (mode !== "arrival") return;
    const completed = runState.status === "completed";
    show(ui.arrival, false);
    visualRuntime?.endArrival?.();
    visualRuntime?.clearCarry?.();
    arrivalElapsed = 0;
    arrivalDuration = 0;
    arrivalData = null;
    arrivalInteraction = null;
    if (ui.arrivalAction) ui.arrivalAction.hidden = true;
    pausedStage = null;
    if (completed) {
      showResult();
      return;
    }
    beginStageIntro("next");
  }

  function showFailure() {
    mode = "failure";
    clearStageWorld();
    const rating = rules.calculateRating(runState, false);
    if (ui.grade) ui.grade.textContent = "—";
    if (ui.endingTitle) ui.endingTitle.textContent = runState.ending;
    const stage = currentStage();
    const failure = runState.failure || {};
    const definition = rules.STAGES[currentStageIndex()];
    const checkpointReached = Boolean(failure.stage?.checkpointReached ?? runState.checkpoints.includes(definition.id));
    const failureCopy = checkpointReached
      ? `在${stage.scene}连续失去节奏，心跳归零。最近的路口已经记录，调整呼吸后可以从这里继续。`
      : `在${stage.scene}连续碰撞，心跳归零。这一程会从开头重新开始。`;
    if (ui.endingCopy) ui.endingCopy.textContent = failureCopy;
    if (ui.failureKicker) ui.failureKicker.textContent = `${stage.name} · 奔跑中断`;
    if (ui.failureTitle) ui.failureTitle.textContent = checkpointReached ? "这次停在半路" : "这次停在路上";
    if (ui.failureCopy) ui.failureCopy.textContent = failure.message ? `${failure.message}。${failureCopy}` : failureCopy;
    if (ui.failureCheckpoint) ui.failureCheckpoint.textContent = checkpointReached ? `${getPhaseExperience(currentStageIndex(), 1).venue}检查点` : `${getPhaseExperience(currentStageIndex(), 0).venue}起点`;
    if (ui.failureProgress) ui.failureProgress.textContent = `${runState.stage.progress} / ${definition.target}`;
    if (ui.failureProgressFill) ui.failureProgressFill.style.transform = `scaleX(${Math.min(1, runState.stage.progress / definition.target)})`;
    if (ui.failureCheckpointCopy) ui.failureCheckpointCopy.textContent = checkpointReached ? "已走过的半程会保留" : "这一程将从开头重新开始";
    show(ui.failureCheckpointPanel, true);
    show(ui.danger, false);
    fillStats(rating);
    show(ui.retry, true);
    show(ui.result, false);
    show(ui.failure, true);
    show(ui.stageIntro, false);
    const failureVisual = { stageIndex: currentStageIndex(), stage, checkpointReached, condition: runState.condition };
    if (visualRuntime?.showFailure) visualRuntime.showFailure(failureVisual);
    else visualRuntime?.setFailureVisual?.(true, failureVisual);
    audio.failure?.({ stageIndex: currentStageIndex(), checkpointReached });
    haptic([55, 45, 70]);
    announce(`${stage.name}，心跳归零。${checkpointReached ? "可以从检查点继续" : "准备后重新出发"}`);
    persist();
  }

  function fillStats(rating) {
    if (ui.completion) ui.completion.textContent = `${rating.completion}%`;
    if (ui.accuracy) ui.accuracy.textContent = `${rating.accuracy}%`;
    if (ui.resultItems) ui.resultItems.textContent = String(rating.items);
    if (ui.relationship) ui.relationship.textContent = runState.relationshipStyle?.label || "尚未定型";
    if (ui.resultCollisions) ui.resultCollisions.textContent = String(rating.collisions);
  }

  function showResult() {
    mode = "result";
    const rating = rules.calculateRating(runState, true);
    const ending = content.getEnding(rating.grade);
    if (ui.grade) ui.grade.textContent = rating.grade;
    if (ui.endingTitle) ui.endingTitle.textContent = ending.title;
    const relationshipId = runState.relationshipStyle?.id || "unwritten";
    if (ui.endingCopy) ui.endingCopy.textContent = `${ending.line} ${ending.coda} ${RELATIONSHIP_ENDING_CODAS[relationshipId] || RELATIONSHIP_ENDING_CODAS.unwritten}`;
    fillStats(rating);
    show(ui.retry, false);
    show(ui.failure, false);
    show(ui.result, true);
    persist();
    announce(`${rating.grade}级，${ending.title}`);
  }

  function resumeFailedStage(useCheckpoint = true) {
    if (mode !== "failure" || runState.status !== "failed") return;
    runState = rules.retryFromCheckpoint(runState);
    if (!useCheckpoint) {
      runState = clone(runState);
      runState.condition = 100;
      runState.heartbeat = 100;
      runState.conditionBand = "steady";
      runState.stage.progress = 0;
      runState.stage.elapsed = 0;
      runState.stage.attempts = 0;
      runState.stage.perfect = 0;
      runState.stage.misses = 0;
      runState.stage.items = [];
      runState.stage.choices = [];
      runState.checkpoints = runState.checkpoints.filter((id) => id !== rules.STAGES[currentStageIndex()].id);
    }
    const savedStory = storyEnvelope(runState);
    const restoredRuntime = useCheckpoint ? savedStory.worldState?.runtime || checkpointRuntime : null;
    director = directorApi.createDirector({ state: useCheckpoint ? storySnapshotFromRun(runState) : null });
    motion = createMotion(restoredRuntime);
    if (restoredRuntime) {
      restoreScheduler(savedStory.worldState?.scheduler || savedStory.worldState);
      preserveRuntimeThroughIntro = true;
    } else {
      spawnClock = 0;
      beatClock = 0;
      flowEnergy = 0;
      flowPeak = 0;
      arcadeCombo = 0;
      arcadePickupChain = 0;
      arcadeRewardTier = 0;
      storyEchoes = [];
      lastSpeedTier = -1;
    }
    syncMotionStage(false);
    pausedStage = null;
    show(ui.result, false);
    show(ui.failure, false);
    lastConditionBand = conditionBand();
    powerupHudSignature = "";
    visualRuntime?.clearCarry?.();
    syncCarryFromState();
    if (visualRuntime?.clearFailure) visualRuntime.clearFailure();
    else visualRuntime?.clearStatusVisual?.();
    applyDirectorCommands(director.ingest({ id: `retry:${runState.retryCount}`, type: "retry" }));
    persist();
    beginStageIntro("retry");
  }
  function retryStage() { resumeFailedStage(true); }
  function restartStage() { resumeFailedStage(false); }

  function advanceRulesTime(seconds) {
    if (mode !== "playing" || runState.status !== "playing") return;
    runState = rules.advanceTime(runState, seconds);
  }

  function update(seconds) {
    visualTime += seconds;
    beatClock += seconds;
    if (mode === "stage-intro") {
      stageIntroElapsed = Math.min(stageIntroDuration, stageIntroElapsed + seconds);
      if (stageIntroData) stageIntroData.progress = Math.min(1, stageIntroElapsed / Math.max(0.001, stageIntroDuration));
      updateStageIntroPerformance();
      audio.tick(seconds, 0, true, true, 0, motion.state.speedTier);
      if (stageIntroElapsed >= stageIntroDuration) finishStageIntro();
      return;
    }
    if (mode === "arrival") {
      if (arrivalInteraction && !arrivalInteraction.completed) {
        arrivalElapsed = Math.min(arrivalInteraction.holdAt, arrivalElapsed + seconds);
        if (!arrivalInteraction.prompted && arrivalElapsed >= arrivalInteraction.holdAt) {
          arrivalInteraction.prompted = true;
          updateArrivalPrompt();
          announce(arrivalInteraction.prompts[0]);
          haptic(7);
        }
      } else {
        arrivalElapsed = Math.min(arrivalDuration, arrivalElapsed + seconds);
      }
      audio.tick(seconds, 0, true, true, flowEnergy / 100, motion.state.speedTier);
      if (arrivalElapsed >= arrivalDuration) finishArrival();
      return;
    }
    if (mode !== "playing") return;
    if (!runPrimed) {
      audio.tick(seconds, 0, true, false, 0, motion.state.speedTier);
      return;
    }
    flowEnergy = Math.max(0, flowEnergy - seconds * (flowEnergy > 72 ? 3.2 : 1.35));
    spawnClock -= seconds;
    if (spawnClock <= 0) {
      const spawned = spawnPattern();
      const speedRatio = Math.max(0, Math.min(1,
        (motion.state.speed - motion.state.config.startSpeed)
        / Math.max(1, motion.state.config.maxSpeed - motion.state.config.startSpeed)));
      spawnClock = spawned
        ? Math.max(1.72, 2.82 - speedRatio * 1.02 + (patternCursor % 3) * 0.08)
        : 0.12;
    }
    motion.step(seconds);
    handleMotionEvents(motion.drainEvents());
    const timedCommands = director.tick(seconds);
    if (timedCommands.length) {
      applyDirectorCommands(timedCommands);
      commitDirectorState(false);
    }
    signalSpeedTier();
    processStoryEchoes();
    updateRunFeedback();
    audio.tick(seconds, motion.state.speed, true, false, flowEnergy / 100, motion.state.speedTier);
    Object.entries(motion.state.powerups || {}).forEach(([type, powerup]) => {
      if (powerup?.active) audio.powerup?.(type, "sustain");
    });
    if (mode === "playing") {
      syncMotionStage(false);
      advanceRulesTime(seconds);
      updateRoutePhase();
    }
    if (ui.score) ui.score.textContent = String(Math.round(motion.state.score + motion.state.distance + runState.successfulMoments * 40));
    if (ui.distance) ui.distance.textContent = `${Math.floor(motion.state.distance)}m`;
  }

  function render() {
    root?.setAttribute("data-state", mode);
    root?.setAttribute("data-flow", flowEnergy >= 70 ? "rush" : flowEnergy >= 35 ? "warm" : "calm");
    root?.style?.setProperty?.("--flow-intensity", String(flowEnergy / 100));
    root?.style?.setProperty?.("--speed-aura-opacity", String(Math.min(0.68, 0.12 + Math.max(0, motion.state.speed - 13) * 0.022 + flowEnergy * 0.0032)));
    const visual = ensureVisualRuntime();
    if (!visual) return;
    visual.render({
      time: visualTime,
      stageIndex: visualStageIndex(),
      stageDefinition: getStageExperience(visualStageIndex()).blueprint || content.STAGES[visualStageIndex()],
      stageContent: getStageExperience(visualStageIndex()).blueprint || content.STAGES[visualStageIndex()],
      phaseDefinition: getPhaseExperience(visualStageIndex(), routePhase),
      mode,
      motion: motion.state,
      runState,
      flow: flowEnergy / 100,
      arrival: arrivalData ? {
        ...arrivalData,
        progress: Math.min(1, arrivalElapsed / Math.max(0.001, arrivalDuration))
      } : null,
      stageIntro: stageIntroData ? { ...stageIntroData } : null,
      routePhase
    });
  }

  function frame(now) {
    const delta = Math.min(0.05, Math.max(0, (now - lastFrameAt) / 1000));
    lastFrameAt = now;
    update(delta);
    render();
    frameHandle = requestAnimationFrame(frame);
  }

  function configureCanvas() {
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { width: VIEW.width, height: VIEW.height };
    const width = Math.max(1, rect.width || VIEW.width);
    const height = Math.max(1, rect.height || VIEW.height);
    if (visualRuntime) visualRuntime.resize(width, height, Number(window.devicePixelRatio) || 1);
    else { canvas.width = VIEW.width; canvas.height = VIEW.height; }
  }

  function gestureThreshold() {
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { width: VIEW.width, height: VIEW.height };
    return Math.max(14, Math.min(32, Math.min(rect.width || VIEW.width, rect.height || VIEW.height) * 0.045));
  }

  function mapKey(key) {
    return ({ ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowUp: "jump", w: "jump", W: "jump", " ": "jump", ArrowDown: "slide", s: "slide", S: "slide" })[key];
  }

  document.addEventListener("keydown", (event) => {
    const action = mapKey(event.key);
    if (!action) return;
    event.preventDefault();
    input(action);
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (pointerStart !== null) return;
    event.preventDefault();
    pointerStart = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      handled: false
    };
    if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
    audio.start();
  }, { passive: false });

  canvas.addEventListener("pointermove", (event) => {
    if (!pointerStart || pointerStart.handled || event.pointerId !== pointerStart.id) return;
    event.preventDefault();
    pointerStart.lastX = event.clientX;
    pointerStart.lastY = event.clientY;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    if (Math.hypot(dx, dy) < gestureThreshold()) return;
    pointerStart.handled = true;
    input(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "jump" : "slide"));
  }, { passive: false });

  canvas.addEventListener("pointerup", (event) => {
    if (!pointerStart || event.pointerId !== pointerStart.id) return;
    event.preventDefault();
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    const distance = Math.hypot(dx, dy);
    if (!pointerStart.handled) {
      const action = distance < gestureThreshold() ? "jump" : Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "jump" : "slide");
      input(action);
    }
    pointerStart = null;
  }, { passive: false });
  canvas.addEventListener("pointercancel", (event) => { if (pointerStart?.id === event.pointerId) pointerStart = null; });
  canvas.addEventListener("lostpointercapture", (event) => { if (pointerStart?.id === event.pointerId) pointerStart = null; });

  const bind = (selector, event, handler) => {
    const node = $(selector);
    if (node) node.addEventListener(event, handler);
  };
  bind("[data-start]", "click", () => start(undefined, true));
  bind("[data-continue]", "click", () => start(safeLoad(), true));
  bind("[data-new-run]", "click", () => { reset(); start(undefined, true); });
  bind("[data-restart]", "click", () => { reset(Boolean(safeLoad()?.profile?.newGamePlusUnlocked)); start(undefined, true); });
  bind("[data-retry]", "click", retryStage);
  bind("[data-failure-retry]", "click", retryStage);
  bind("[data-failure-restart]", "click", restartStage);
  bind("[data-stage-intro-skip]", "click", finishStageIntro);
  bind("[data-new-game-plus]", "click", () => { const save = safeLoad(); if (save && rules.canStartNewGamePlus(save)) { reset(true); start(undefined, true); } });
  bind("[data-sound]", "click", (event) => {
    const muted = audio.toggle();
    event.currentTarget.textContent = muted ? "♩" : "♪";
    event.currentTarget.setAttribute("aria-label", muted ? "开启声音" : "关闭声音");
  });

  window.addEventListener("runner-love-visuals-ready", () => { ensureVisualRuntime(); configureCanvas(); render(); });
  function pauseRuntime() {
    cancelAnimationFrame(frameHandle);
    frameHandle = 0;
    audio.suspend();
    pointerStart = null;
  }
  function resumeRuntime() {
    if (document.hidden || frameHandle) return;
    lastFrameAt = performance.now();
    audio.resume();
    frameHandle = requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden) pauseRuntime(); else resumeRuntime(); });
  window.addEventListener("pagehide", () => { persist(); pauseRuntime(); });
  window.addEventListener("pageshow", resumeRuntime);
  window.addEventListener("resize", () => { configureCanvas(); render(); });

  function debugStep(milliseconds) {
    const seconds = Math.max(0, Number(milliseconds) || 0) / 1000;
    for (let left = seconds; left > 1e-9; left -= 0.05) update(Math.min(0.05, left));
    render();
    return snapshot();
  }
  function completeStage(outcome = "perfect") {
    if (mode === "stage-intro") finishStageIntro();
    const index = runState.stageIndex;
    while (runState.status === "playing" && runState.stageIndex === index) {
      const itemId = content.STAGE_ITEM_IDS[index][runState.stage.progress % content.STAGE_ITEM_IDS[index].length];
      applyMoment({ outcome, kind: "story-item", itemId, choiceId: `debug-${index}-${runState.stage.progress}` });
    }
    return snapshot();
  }
  function finishArrivalDebug() {
    if (mode !== "arrival") return false;
    arrivalElapsed = arrivalDuration;
    finishArrival();
    return true;
  }
  function finishStageIntroDebug() { return finishStageIntro(); }
  function failDebug(kind = "collision") {
    if (mode === "stage-intro") finishStageIntro();
    while (runState.status === "playing") applyMoment({ outcome: "miss", kind });
    return snapshot();
  }
  function snapshot() {
    return {
      mode,
      pausedStage,
      conditionBand: conditionBand(),
          stageIntro: stageIntroData ? clone(stageIntroData) : null,
          arrival: arrivalData ? clone(arrivalData) : null,
          arrivalInteraction: arrivalInteraction ? clone(arrivalInteraction) : null,
          runState: clone(runState),
          director: clone(director.snapshot()),
          routePhase,
          scheduler: schedulerSnapshot(),
      arcade: {
        combo: arcadeCombo,
        best: arcadeBest,
        pickupChain: arcadePickupChain,
        rewardTier: arcadeRewardTier
      },
      motion: {
        stageIndex: motion.state.stageIndex,
        stage: motion.state.stage,
        lane: motion.state.lane,
        lanePosition: motion.state.lanePosition,
        action: motion.state.action,
        distance: motion.state.distance,
        speed: motion.state.speed,
        score: motion.state.score,
        collected: motion.state.collected,
        speedProgress: motion.state.speedProgress,
        speedTier: motion.state.speedTier,
        powerups: clone(motion.state.powerups),
        stumbleTime: motion.state.stumbleTime,
        dodges: motion.state.dodges,
        nearMisses: motion.state.nearMisses,
        entities: clone(motion.state.entities),
        routeChoices: clone(motion.state.routeChoices)
      },
      visual: visualRuntime?.snapshot?.() || { ready: false, webgl: false, error: visualFailure ? String(visualFailure.message || visualFailure) : null },
      saved: safeLoad()
    };
  }

  window.__runnerLoveDebug = Object.freeze({
    snapshot,
    reset,
    start: () => start(),
    step: debugStep,
    input,
    spawn: (spec) => motion.spawn(spec),
    powerup: (type, options) => motion.activatePowerup(type, options),
    moment: applyMoment,
    fact: recordDirectorFact,
    beat: (outcome) => applyMoment({ outcome }),
    completeStage,
    finishStageIntro: finishStageIntroDebug,
    finishArrival: finishArrivalDebug,
    fail: failDebug,
    retry: retryStage,
    save: persist
  });

  const visualAuditParams = typeof URLSearchParams === "function" && typeof location === "object"
    ? new URLSearchParams(location.search)
    : null;
  const visualAuditEnabled = Boolean(visualAuditParams
    && ["localhost", "127.0.0.1"].includes(location.hostname)
    && visualAuditParams.has("visual-stage"));
  if (visualAuditEnabled) {
    const auditStage = Math.max(0, Math.min(content.STAGES.length - 1, Number(visualAuditParams.get("visual-stage")) - 1 || 0));
    const auditPhase = Math.max(0, Math.min(2, Number(visualAuditParams.get("visual-phase")) - 1 || 0));
    setTimeout(() => {
      reset(false);
      start();
      finishStageIntro();
      for (let stageIndex = 0; stageIndex < auditStage; stageIndex += 1) {
        completeStage("perfect");
        finishArrivalDebug();
        finishStageIntroDebug();
      }
      const definition = rules.STAGES[currentStageIndex()];
      const phases = getStageExperience(currentStageIndex()).blueprint?.segments || getStageExperience(currentStageIndex()).phases;
      const threshold = auditPhase === 0 ? 0 : Number(phases[auditPhase]?.progress?.[0]) || auditPhase / 3;
      const desiredProgress = Math.ceil(definition.target * threshold);
      while (runState.status === "playing" && runState.stage.progress < desiredProgress) {
        const itemIds = content.STAGE_ITEM_IDS[currentStageIndex()];
        const itemId = itemIds[runState.stage.progress % itemIds.length];
        applyMoment({ outcome: "perfect", kind: "story-item", itemId, choiceId: `visual-audit-${runState.stage.progress}` });
      }
      root?.setAttribute("data-visual-audit", `${auditStage + 1}-${auditPhase + 1}`);
      render();
    }, 60);
  }

  const saved = safeLoad();
  configureCanvas();
  start(saved?.run?.status === "playing" ? saved : undefined, true);
  render();
  frameHandle = requestAnimationFrame(frame);
})();
