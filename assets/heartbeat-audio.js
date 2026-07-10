(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Love2048Audio = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const STORAGE_KEY = "yl-heartbeat-2048-sound";
  const EPSILON = 0.0001;
  const MASTER_LEVEL = 0.72;
  const MERGE_SCALE = [0, 2, 4, 7, 9];
  const UNLOCK_EVENTS = ["pointerdown", "touchstart", "keydown"];
  const MOOD_PROFILES = {
    meet: { offset: 0, chord: [0, 4, 7, 9], progression: [0, 9, 5, 7] },
    campus: { offset: 2, chord: [0, 4, 7, 11], progression: [0, 5, 9, 7] },
    chat: { offset: 4, chord: [0, 3, 7, 10], progression: [0, 8, 3, 10] },
    date: { offset: 5, chord: [0, 4, 7, 11], progression: [0, 9, 5, 7] },
    cafe: { offset: 5, chord: [0, 4, 7, 9], progression: [0, 5, 9, 7] },
    rain: { offset: 2, chord: [0, 3, 7, 10], progression: [0, 8, 3, 10] },
    street: { offset: 7, chord: [0, 4, 7, 9], progression: [0, 9, 5, 7] },
    home: { offset: 0, chord: [0, 4, 7, 11], progression: [0, 5, 9, 7] },
    starlight: { offset: 4, chord: [0, 4, 7, 11], progression: [0, 9, 5, 7] },
    vow: { offset: 5, chord: [0, 4, 7, 11], progression: [0, 5, 9, 7] }
  };

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function midiToFrequency(midi) {
    return 440 * (2 ** ((midi - 69) / 12));
  }

  function mergeFrequency(value) {
    const numeric = Math.max(2, Number(value) || 2);
    const rank = Math.max(1, Math.round(Math.log2(numeric)));
    const scaleIndex = rank - 1;
    const midi = 52 + Math.floor(scaleIndex / MERGE_SCALE.length) * 12
      + MERGE_SCALE[scaleIndex % MERGE_SCALE.length];
    return Number(midiToFrequency(midi).toFixed(3));
  }

  function readEnabled(storage) {
    try {
      return storage?.getItem(STORAGE_KEY) !== "off";
    } catch {
      return true;
    }
  }

  function writeEnabled(storage, enabled) {
    try {
      storage?.setItem(STORAGE_KEY, enabled ? "on" : "off");
    } catch {
      // Storage can be unavailable in private browsing; audio remains usable for the session.
    }
  }

  function createHeartbeatAudio(options = {}) {
    const hostWindow = options.window || (typeof window !== "undefined" ? window : null);
    const documentRef = options.document || hostWindow?.document || null;
    let storage = options.storage || null;
    if (!storage) {
      try {
        storage = hostWindow?.localStorage || null;
      } catch {
        storage = null;
      }
    }
    const AudioContextClass = options.AudioContext
      || hostWindow?.AudioContext
      || hostWindow?.webkitAudioContext
      || null;
    const timerHost = options.timerHost || hostWindow || globalThis;
    const setIntervalFn = timerHost.setInterval?.bind(timerHost) || setInterval;
    const clearIntervalFn = timerHost.clearInterval?.bind(timerHost) || clearInterval;
    const ambientWanted = options.ambient !== false;

    let supported = typeof AudioContextClass === "function";
    let enabled = readEnabled(storage);
    let destroyed = false;
    let context = null;
    let masterGain = null;
    let musicGain = null;
    let effectsGain = null;
    let outputNode = null;
    let schedulerTimer = null;
    let nextBarTime = 0;
    let chordIndex = 0;
    let stageValue = 2;
    let mood = "meet";
    let unlockPromise = null;
    let unlocked = false;
    let primed = false;
    let unlockArmed = false;
    let lifecyclePaused = Boolean(documentRef?.hidden);
    let lastBlockedAt = Number.NEGATIVE_INFINITY;
    const activeSources = new Set();
    const playedStageMotifs = new Set();

    function setParam(param, value, time = context?.currentTime || 0) {
      if (!param) return;
      if (typeof param.setValueAtTime === "function") param.setValueAtTime(value, time);
      else param.value = value;
    }

    function rampParam(param, value, time) {
      if (!param) return;
      if (typeof param.exponentialRampToValueAtTime === "function" && value > 0) {
        param.exponentialRampToValueAtTime(value, time);
      } else if (typeof param.linearRampToValueAtTime === "function") {
        param.linearRampToValueAtTime(value, time);
      } else {
        param.value = value;
      }
    }

    function setCompressorParam(name, value) {
      setParam(outputNode?.[name], value);
    }

    function createGraph() {
      if (context || destroyed || !supported) return context;
      try {
        context = new AudioContextClass({ latencyHint: "interactive" });
      } catch {
        try {
          context = new AudioContextClass();
        } catch {
          supported = false;
          return null;
        }
      }

      masterGain = context.createGain();
      musicGain = context.createGain();
      effectsGain = context.createGain();
      outputNode = typeof context.createDynamicsCompressor === "function"
        ? context.createDynamicsCompressor()
        : null;
      setParam(masterGain.gain, EPSILON);
      setParam(musicGain.gain, 0.17);
      setParam(effectsGain.gain, 0.58);
      musicGain.connect(masterGain);
      effectsGain.connect(masterGain);

      if (outputNode) {
        setCompressorParam("threshold", -20);
        setCompressorParam("knee", 18);
        setCompressorParam("ratio", 5);
        setCompressorParam("attack", 0.008);
        setCompressorParam("release", 0.22);
        masterGain.connect(outputNode);
        outputNode.connect(context.destination);
      } else {
        masterGain.connect(context.destination);
      }
      return context;
    }

    function disconnectNode(node) {
      try {
        node?.disconnect?.();
      } catch {
        // A node may already have been disconnected by its onended handler.
      }
    }

    function ignorePromise(result) {
      result?.catch?.(() => {});
    }

    function releaseSource(record) {
      if (!activeSources.delete(record)) return;
      record.nodes.forEach(disconnectNode);
    }

    function startSource(source, nodes, startAt, stopAt) {
      const record = { source, nodes: [source, ...nodes] };
      activeSources.add(record);
      source.onended = () => releaseSource(record);
      try {
        source.start(startAt);
        source.stop(stopAt);
      } catch {
        releaseSource(record);
      }
    }

    function stopSources() {
      [...activeSources].forEach((record) => {
        record.source.onended = null;
        try {
          record.source.stop();
        } catch {
          // Scheduled sources can already be stopped when lifecycle events race.
        }
        releaseSource(record);
      });
    }

    function canSchedule() {
      return Boolean(context && enabled && !destroyed && !lifecyclePaused);
    }

    function scheduleTone(frequency, startAt, duration, level, config = {}) {
      if (!canSchedule() || !Number.isFinite(frequency)) return false;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const filter = typeof context.createBiquadFilter === "function"
        ? context.createBiquadFilter()
        : null;
      const safeFrequency = clamp(frequency, 36, 5200);
      const safeDuration = clamp(duration, 0.035, 8);
      const endAt = startAt + safeDuration;
      const attackAt = startAt + Math.min(0.08, safeDuration * 0.24);
      const releaseAt = startAt + safeDuration * 0.7;

      oscillator.type = config.type || "sine";
      setParam(oscillator.frequency, safeFrequency, startAt);
      if (Number.isFinite(config.glideTo)) {
        rampParam(oscillator.frequency, clamp(config.glideTo, 36, 5200), endAt);
      }
      if (Number.isFinite(config.detune)) setParam(oscillator.detune, config.detune, startAt);

      setParam(envelope.gain, EPSILON, startAt);
      rampParam(envelope.gain, Math.max(EPSILON, level), attackAt);
      setParam(envelope.gain, Math.max(EPSILON, level * 0.82), releaseAt);
      rampParam(envelope.gain, EPSILON, endAt);

      if (filter) {
        filter.type = config.filterType || "lowpass";
        setParam(filter.frequency, config.filterFrequency || 2400, startAt);
        setParam(filter.Q, config.filterQ || 0.7, startAt);
        oscillator.connect(filter);
        filter.connect(envelope);
      } else {
        oscillator.connect(envelope);
      }
      envelope.connect(config.bus || effectsGain);
      startSource(oscillator, filter ? [filter, envelope] : [envelope], startAt, endAt + 0.025);
      return true;
    }

    function primeContext() {
      if (primed || !context) return;
      primed = true;
      const oscillator = context.createOscillator();
      const silence = context.createGain();
      const now = context.currentTime;
      setParam(silence.gain, 0, now);
      oscillator.connect(silence);
      silence.connect(masterGain);
      startSource(oscillator, [silence], now, now + 0.012);
    }

    function currentRank() {
      return Math.max(1, Math.round(Math.log2(Math.max(2, stageValue))));
    }

    function ambientSettings() {
      const rank = currentRank();
      const profile = MOOD_PROFILES[mood] || MOOD_PROFILES.meet;
      return {
        rank,
        profile,
        rootMidi: 47 + profile.offset + Math.min(5, Math.floor((rank - 1) / 4)),
        bpm: 58 + Math.min(12, rank) * 0.72
      };
    }

    function scheduleHeartbeat(when, beat, rank) {
      const level = 0.026 + Math.min(0.012, rank * 0.0008);
      scheduleTone(58, when + beat * 0.08, 0.14, level, {
        type: "sine",
        glideTo: 46,
        filterFrequency: 210,
        bus: musicGain
      });
      scheduleTone(54, when + beat * 0.38, 0.1, level * 0.72, {
        type: "sine",
        glideTo: 44,
        filterFrequency: 190,
        bus: musicGain
      });
    }

    function scheduleAmbientBar(when) {
      const settings = ambientSettings();
      const beat = 60 / settings.bpm;
      const duration = beat * 4;
      const progression = settings.profile.progression;
      const chordRoot = settings.rootMidi + progression[chordIndex % progression.length];
      const chord = settings.profile.chord;
      const padLevel = 0.012 + Math.min(0.009, settings.rank * 0.00055);
      const filterFrequency = 1000 + Math.min(1500, settings.rank * 90);

      scheduleTone(midiToFrequency(chordRoot - 12), when, duration * 0.94, padLevel * 1.15, {
        type: "sine",
        filterFrequency: 620,
        bus: musicGain
      });
      chord.slice(0, settings.rank >= 8 ? 4 : 3).forEach((interval, index) => {
        scheduleTone(midiToFrequency(chordRoot + interval), when + index * 0.018, duration * 0.91, padLevel, {
          type: index % 2 ? "triangle" : "sine",
          detune: index === 2 ? 3 : 0,
          filterFrequency,
          bus: musicGain
        });
      });

      if (settings.rank >= 4) {
        const arpeggio = settings.rank >= 10 ? [0, 2, 1, 3] : [0, 2];
        arpeggio.forEach((chordIndexValue, index) => {
          scheduleTone(
            midiToFrequency(chordRoot + chord[chordIndexValue] + 12),
            when + beat * (0.72 + index * (settings.rank >= 10 ? 0.76 : 1.55)),
            beat * 0.74,
            padLevel * 0.68,
            { type: "sine", filterFrequency: 2800, bus: musicGain }
          );
        });
      }

      scheduleHeartbeat(when, beat, settings.rank);
      chordIndex += 1;
      return duration;
    }

    function runAmbientScheduler() {
      if (!ambientWanted || !unlocked || context?.state !== "running" || !canSchedule()) return;
      const now = context.currentTime;
      if (nextBarTime <= now) nextBarTime = now + 0.06;
      const horizon = now + 4.2;
      let scheduledBars = 0;
      while (nextBarTime < horizon && scheduledBars < 2) {
        nextBarTime += scheduleAmbientBar(nextBarTime);
        scheduledBars += 1;
      }
    }

    function startScheduler() {
      if (!ambientWanted || schedulerTimer !== null || !unlocked || context?.state !== "running") return;
      runAmbientScheduler();
      schedulerTimer = setIntervalFn(runAmbientScheduler, 1400);
    }

    function stopScheduler() {
      if (schedulerTimer !== null) clearIntervalFn(schedulerTimer);
      schedulerTimer = null;
      nextBarTime = 0;
    }

    function raiseMaster() {
      if (!masterGain || !context) return;
      const now = context.currentTime;
      masterGain.gain.cancelScheduledValues?.(now);
      setParam(masterGain.gain, Math.max(EPSILON, masterGain.gain.value || EPSILON), now);
      rampParam(masterGain.gain, MASTER_LEVEL, now + 0.08);
    }

    function lowerMaster() {
      if (!masterGain || !context) return;
      const now = context.currentTime;
      masterGain.gain.cancelScheduledValues?.(now);
      setParam(masterGain.gain, EPSILON, now);
    }

    function disarmUnlock() {
      if (!unlockArmed || !documentRef) return;
      UNLOCK_EVENTS.forEach((eventName) => {
        documentRef.removeEventListener(eventName, onFirstGesture, true);
      });
      unlockArmed = false;
    }

    function armUnlock() {
      if (unlockArmed || destroyed || !supported || !documentRef) return;
      UNLOCK_EVENTS.forEach((eventName) => {
        documentRef.addEventListener(eventName, onFirstGesture, { capture: true, passive: true });
      });
      unlockArmed = true;
    }

    function unlock() {
      if (destroyed || !enabled || !supported || lifecyclePaused) return Promise.resolve(false);
      if (unlockPromise) return unlockPromise;
      const audioContext = createGraph();
      if (!audioContext) return Promise.resolve(false);
      primeContext();

      let resumeResult;
      try {
        resumeResult = audioContext.state === "running" ? undefined : audioContext.resume();
      } catch {
        resumeResult = Promise.reject(new Error("AudioContext resume failed"));
      }
      unlockPromise = Promise.resolve(resumeResult).then(() => {
        unlockPromise = null;
        if (destroyed || audioContext.state !== "running") return false;
        unlocked = true;
        disarmUnlock();
        if (!enabled || lifecyclePaused || documentRef?.hidden) {
          ignorePromise(audioContext.suspend?.());
          return false;
        }
        raiseMaster();
        startScheduler();
        return true;
      }).catch(() => {
        unlockPromise = null;
        armUnlock();
        return false;
      });
      return unlockPromise;
    }

    function onFirstGesture() {
      if (enabled) void unlock();
    }

    function suspendForLifecycle() {
      lifecyclePaused = true;
      stopScheduler();
      stopSources();
      lowerMaster();
      try {
        ignorePromise(context?.suspend?.());
      } catch {
        // The context may already be closing as the page leaves.
      }
    }

    function resumeFromLifecycle() {
      lifecyclePaused = Boolean(documentRef?.hidden);
      if (lifecyclePaused || !enabled || !unlocked || !context || destroyed) return Promise.resolve(false);
      let resumeResult;
      try {
        resumeResult = context.state === "running" ? undefined : context.resume();
      } catch {
        return Promise.resolve(false);
      }
      return Promise.resolve(resumeResult).then(() => {
        if (destroyed || context.state !== "running") return false;
        raiseMaster();
        startScheduler();
        return true;
      }).catch(() => false);
    }

    function onVisibilityChange() {
      if (documentRef?.hidden) suspendForLifecycle();
      else void resumeFromLifecycle();
    }

    function onPageHide(event) {
      if (event?.persisted) suspendForLifecycle();
      else destroy();
    }

    function onPageShow() {
      lifecyclePaused = Boolean(documentRef?.hidden);
      void resumeFromLifecycle();
    }

    function setEnabled(nextEnabled) {
      const next = Boolean(nextEnabled);
      if (destroyed) return false;
      enabled = next;
      writeEnabled(storage, enabled);
      if (!enabled) {
        stopScheduler();
        stopSources();
        lowerMaster();
        try {
          ignorePromise(context?.suspend?.());
        } catch {
          // The context can be interrupted by the browser while toggling.
        }
      } else {
        armUnlock();
        void unlock();
      }
      return enabled;
    }

    function cueMerge(payload = {}) {
      if (!canSchedule()) return;
      const values = Array.isArray(payload.values)
        ? payload.values.filter((value) => Number(value) > 0).slice(0, 4)
        : [Number(payload.value)].filter((value) => value > 0);
      if (!values.length) return;
      const combo = Math.max(values.length, Number(payload.combo) || 1);
      const now = context.currentTime + 0.012;
      values.forEach((value, index) => {
        const frequency = mergeFrequency(value);
        scheduleTone(frequency, now + index * 0.038, 0.2, 0.075, {
          type: "triangle",
          filterFrequency: 3300
        });
        scheduleTone(frequency * 2, now + 0.018 + index * 0.038, 0.11, 0.026, {
          type: "sine",
          filterFrequency: 4200
        });
      });

      if (combo > 1) {
        const root = mergeFrequency(Math.max(...values));
        const flourish = combo >= 4 ? [1, 1.25, 1.5, 2] : [1, 1.25, 1.5];
        flourish.forEach((ratio, index) => {
          scheduleTone(root * ratio, now + 0.11 + index * 0.072, 0.19, 0.04, {
            type: "sine",
            filterFrequency: 4600
          });
        });
      }
    }

    function cueBlocked() {
      if (!canSchedule()) return;
      const now = context.currentTime;
      if (now - lastBlockedAt < 0.22) return;
      lastBlockedAt = now;
      scheduleTone(92, now + 0.006, 0.075, 0.025, {
        type: "sine",
        glideTo: 74,
        filterFrequency: 260
      });
    }

    function cueDestiny(kind = "spawn") {
      if (!canSchedule()) return;
      const now = context.currentTime + 0.018;
      const notes = kind === "reveal"
        ? [523.251, 659.255, 783.991, 1046.502]
        : [659.255, 987.767];
      notes.forEach((frequency, index) => {
        scheduleTone(frequency, now + index * (kind === "reveal" ? 0.1 : 0.13), 0.3, 0.045, {
          type: "sine",
          filterFrequency: 4900
        });
      });
    }

    function cueConflict(kind = "entry", remaining = 0) {
      if (!canSchedule()) return;
      const now = context.currentTime + 0.012;
      if (kind === "resolve") {
        [261.626, 329.628, 391.995, 523.251].forEach((frequency, index) => {
          scheduleTone(frequency, now + index * 0.095, 0.34, 0.044, {
            type: index % 2 ? "triangle" : "sine",
            filterFrequency: 3600
          });
        });
        return;
      }
      if (kind === "loosen") {
        const lift = clamp(5 - Number(remaining || 0), 0, 4);
        scheduleTone(196 * (2 ** (lift / 12)), now, 0.13, 0.034, {
          type: "triangle",
          glideTo: 246.942 * (2 ** (lift / 12)),
          filterFrequency: 1500
        });
        return;
      }
      scheduleTone(146.832, now, 0.48, 0.042, {
        type: "triangle",
        glideTo: 130.813,
        filterFrequency: 720
      });
      scheduleTone(174.614, now + 0.045, 0.42, 0.027, {
        type: "sine",
        glideTo: 155.563,
        filterFrequency: 880
      });
    }

    function cueStage(value) {
      const numeric = Math.max(2, Number(value) || 2);
      if (!canSchedule() || playedStageMotifs.has(numeric)) return;
      playedStageMotifs.add(numeric);
      const rootFrequency = clamp(mergeFrequency(numeric) / 2, 220, 880);
      const now = context.currentTime + 0.07;
      [1, 1.25, 1.5, 2].forEach((ratio, index) => {
        scheduleTone(rootFrequency * ratio, now + index * 0.145, 0.42, 0.052, {
          type: index % 2 ? "triangle" : "sine",
          filterFrequency: 4400
        });
      });
      scheduleTone(rootFrequency / 2, now, 0.82, 0.028, {
        type: "sine",
        filterFrequency: 720
      });
    }

    function setStage(value) {
      const numeric = Number(value);
      if (Number.isFinite(numeric) && numeric >= 2) stageValue = numeric;
    }

    function setMood(nextMood) {
      mood = MOOD_PROFILES[nextMood] ? nextMood : "meet";
    }

    function resetJourney() {
      playedStageMotifs.clear();
      stageValue = 2;
      mood = "meet";
      chordIndex = 0;
      lastBlockedAt = Number.NEGATIVE_INFINITY;
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      disarmUnlock();
      documentRef?.removeEventListener?.("visibilitychange", onVisibilityChange);
      hostWindow?.removeEventListener?.("pagehide", onPageHide);
      hostWindow?.removeEventListener?.("pageshow", onPageShow);
      stopScheduler();
      stopSources();
      [musicGain, effectsGain, masterGain, outputNode].forEach(disconnectNode);
      try {
        ignorePromise(context?.close?.());
      } catch {
        // Closing is best-effort during navigation and game teardown.
      }
      context = null;
      masterGain = null;
      musicGain = null;
      effectsGain = null;
      outputNode = null;
    }

    if (supported) {
      armUnlock();
      documentRef?.addEventListener?.("visibilitychange", onVisibilityChange);
      hostWindow?.addEventListener?.("pagehide", onPageHide);
      hostWindow?.addEventListener?.("pageshow", onPageShow);
    }

    return Object.freeze({
      isSupported: () => supported,
      isEnabled: () => enabled,
      setEnabled,
      toggle: () => setEnabled(!enabled),
      unlock,
      suspend: suspendForLifecycle,
      resume: resumeFromLifecycle,
      setStage,
      setMood,
      cueMerge,
      cueBlocked,
      cueDestiny,
      cueConflict,
      cueStage,
      resetJourney,
      destroy
    });
  }

  return Object.freeze({ STORAGE_KEY, mergeFrequency, createHeartbeatAudio });
});
