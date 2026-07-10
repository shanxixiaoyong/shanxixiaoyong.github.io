# Love 2048 Milestone Cinematics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trigger a detailed scene-matched full-screen event only when a new highest relationship stage is first merged, while making ordinary swipes and repeated merges substantially smoother.

**Architecture:** `assets/games.js` separates milestone discovery from repeated-merge feedback and keeps board cells persistent. `assets/love-2048.css` owns the cinematic/backdrop presentation and lightweight movement layers. `assets/love-2048-vfx.js` becomes burst-on-demand instead of continuously animating. Local WebP backdrops live under `assets/love-scenes/`.

**Tech Stack:** Vanilla JavaScript, CSS animations, Canvas 2D, local WebP assets, Node static validators, GitHub Pages.

## Global Constraints

- Target viewport is 430 x 932 CSS pixels.
- A repeated stage must never create narrative text or a full-screen event.
- A milestone cinematic must contain the full event description and remain pointer-transparent.
- No external image URLs or runtime dependencies.
- Preserve blocked-input top spawning and all existing 2048 merge semantics.

---

### Task 1: Behavioral Contracts

**Files:**
- Modify: `tools/validate-love-2048.mjs`

**Interfaces:**
- Consumes: source text from `assets/games.js`, `assets/love-2048.css`, and `assets/love-2048-vfx.js`.
- Produces: failing static/runtime checks for milestone-only narrative behavior and persistent rendering.

- [ ] Add expectations for `pickMilestoneScene`, `playMilestoneScene`, `playRepeatMerge`, `sceneBackdropKey`, `ensureBoardCells`, `renderBoardCells`, `scheduleTouchFrame`, and `ambient: false`.
- [ ] Add forbidden checks for `showSceneDanmaku`, `rememberScene`, per-move `showSwipeTrace(dir)`, and unconditional `pickMergeScene(nextValue)` inside line processing.
- [ ] Assert the cinematic markup includes `scene.line` and `data-backdrop`.
- [ ] Run `node tools/validate-love-2048.mjs`; expect failure on the first missing contract.

### Task 2: Scene Backdrops

**Files:**
- Create: `assets/love-scenes/rain-night.webp`
- Create: `assets/love-scenes/cafe-evening.webp`
- Create: `assets/love-scenes/campus-library.webp`
- Create: `assets/love-scenes/city-night.webp`
- Create: `assets/love-scenes/warm-home.webp`
- Create: `assets/love-scenes/starlight-vow.webp`

**Interfaces:**
- Produces: six portrait, text-free, local cinematic backdrops addressed by the keys `rain`, `cafe`, `campus`, `city`, `home`, and `starlight`.

- [ ] Generate six consistent environment-focused romantic visual-novel backdrops with clear central text space.
- [ ] Convert each selected image to a mobile-sized WebP and keep each file reasonably compressed.
- [ ] Inspect all outputs for readable central negative space, no text, and no watermark.

### Task 3: Milestone-Only Narrative Flow

**Files:**
- Modify: `assets/games.js`

**Interfaces:**
- Produces: `pickMilestoneScene(value)`, `sceneBackdropKey(scene)`, `playMilestoneScene(scene, cellIndex)`, and `playRepeatMerge(cellIndex, value)`.

- [ ] Select the highest merge result before creating any narrative scene.
- [ ] Treat `nextValue > bestValue && !seenStageValues.has(nextValue)` as the only milestone condition.
- [ ] On milestones, update `bestValue`, `seenStageValues`, story state, mood, and memory exactly once, then call `playMilestoneScene`.
- [ ] On repeats, call only `playRepeatMerge` with no narrative selection or mutation.
- [ ] Remove bloom/danmaku/remember code and their timers from restart and teardown.
- [ ] Run `node tools/validate-love-2048.mjs`; expect milestone contracts to pass.

### Task 4: Persistent Board and Smooth Touch Input

**Files:**
- Modify: `assets/games.js`
- Modify: `assets/love-2048.css`

**Interfaces:**
- Produces: persistent `cellNodes`, dimension-keyed motion geometry, lightweight motion ghosts, and RAF-throttled touch feedback.

- [ ] Build 16 cell nodes once with `ensureBoardCells()`.
- [ ] Update values/classes/styles in `renderBoardCells()` and only replace heart markup when `data-value` changes.
- [ ] Cache cell positions relative to the board and reuse them in `playTileMotion()` until dimensions change.
- [ ] Replace full jewel ghost markup with a one-path SVG heart and number.
- [ ] Remove per-move swipe-trace creation.
- [ ] Cache the pointer-down board rectangle and coalesce pointer moves in `scheduleTouchFrame()`.
- [ ] Set dragging transitions to `none` and keep transforms on a composited layer.

### Task 5: On-Demand VFX and Cinematic Styling

**Files:**
- Modify: `assets/love-2048-vfx.js`
- Modify: `assets/love-2048.css`
- Modify: `game-2048.html`

**Interfaces:**
- Consumes: backdrop key and scene text from `playMilestoneScene`.
- Produces: six scene families, complete centered narrative copy, short repeated-merge sparkle, and demand-driven particles.

- [ ] Disable ambient spawning unless `options.ambient === true`.
- [ ] Lower DPR/particle ceilings and keep celebration particles bounded.
- [ ] Style `.cinematic-backdrop`, `.cinematic-atmosphere`, and `.cinematic-copy p` for a 2.6-second scene.
- [ ] Map each `data-backdrop` value to one local WebP asset and matching CSS lighting/weather.
- [ ] Add a lightweight `.effect-love-merge` effect.
- [ ] Bump Love 2048 asset query versions in `game-2048.html`.

### Task 6: Verification and Publication

**Files:**
- Verify: all modified files and public GitHub Pages output.

**Interfaces:**
- Produces: tested commit on `master` and a verified public game URL.

- [ ] Run `node --check assets/games.js`, `node --check assets/love-2048-vfx.js`, `node tools/validate-love-2048.mjs`, `node tools/validate-site.mjs`, and `git diff --check`.
- [ ] At 430 x 932, verify first milestone creates one cinematic with backdrop and full line; repeat merge creates none.
- [ ] Run rapid swipe sequences and confirm no overflow, duplicate layers, console errors, or stuck touch transforms.
- [ ] Commit, push `master`, wait for GitHub Pages `built`, and verify the public game loads the new versioned assets.

