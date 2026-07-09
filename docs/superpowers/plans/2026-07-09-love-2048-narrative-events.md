# Love 2048 Narrative Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the relationship-management 2048 implementation with a pure 2048 game whose romance depth comes from randomized merge story events and polished mobile-first effects.

**Architecture:** Keep the existing single-page static site and `run2048()` entry point. Rewrite only the Love 2048 game logic inside `assets/games.js`, add mobile-first Love 2048 story styles in `assets/world.css`, and update `tools/validate-love-2048.mjs` to enforce the simplified narrative model.

**Tech Stack:** Static HTML, vanilla JavaScript, CSS animations, existing GitHub Pages deployment.

## Global Constraints

- Primary target viewport is `430 × 932 CSS px`.
- The game must be directly playable by swiping; no special rule explanation is required.
- Only pure 2048 movement and equal-number merges affect gameplay.
- Romance systems are presentation-only: stage labels, randomized event text, mood classes, particles, and story log.
- Frontend must not include implementation notes, requirements, or planning text.

---

### Task 1: Validator Red State

**Files:**
- Modify: `tools/validate-love-2048.mjs`

**Interfaces:**
- Consumes: current HTML, JS, CSS files.
- Produces: validator expectations for the simplified narrative model.

- [ ] **Step 1: Add failing expectations**

Replace management-system expectations with checks for:

```js
["2048 has narrative scene pools", files.js, "const narrativeScenes"],
["2048 picks random merge scenes", files.js, "function pickMergeScene"],
["2048 renders a story card", files.js, "renderStoryCard"],
["2048 stores story log", files.js, "let storyLog = []"],
["2048 applies mood classes", files.js, "applyMood"],
["2048 keeps only restart and memory controls", files.js, 'button("重遇"'],
["2048 has memory log control", files.js, 'button("回忆"'],
["2048 removed trust resource", files.js, "let trust =", true],
["2048 removed communication resource", files.js, "let communication =", true],
["2048 removed freshness resource", files.js, "let freshness =", true],
["2048 removed special event cells", files.js, "event-cell", true],
["CSS styles narrative card", files.css, ".love-story-card"],
["CSS styles merge mood classes", files.css, ".board-love-2048.mood-date"],
["CSS styles mobile love layout", files.css, "body.solo-game-2048 .solo-stage"]
```

- [ ] **Step 2: Run validator to verify failure**

Run:

```bash
node tools/validate-love-2048.mjs
```

Expected: FAIL because `narrativeScenes`, `pickMergeScene`, and story card styles do not yet exist, and old resource systems still exist.

### Task 2: Pure 2048 Narrative Engine

**Files:**
- Modify: `assets/games.js`

**Interfaces:**
- Consumes: existing helpers `setScore`, `setStatus`, `setMeta`, `button`, `triggerBoardEffect`, `triggerCellEffect`, `enableSwipe`, `keyHandler`.
- Produces: a `run2048()` implementation with `narrativeScenes`, `pickMergeScene(value)`, `applyMood(scene)`, `renderStoryCard()`, and pure 2048 movement.

- [ ] **Step 1: Rewrite Love 2048 state**

Use only:

```js
let tiles = [];
let points = 0;
let bestValue = 2;
let lastMergeCells = [];
let lastSpawnCell = -1;
let lastMoveDir = "start";
let storyLog = [];
let currentScene = null;
let moodTimer = 0;
```

- [ ] **Step 2: Implement scene picking**

Create `narrativeScenes` keyed by merge destination value. Each key from `4` through `2048` has at least five scenes, with `title`, `line`, `mood`, and `effect`.

- [ ] **Step 3: Implement pure line sliding**

`slideLine(line)` must only merge adjacent equal numbers. No event cells, resource checks, or special interactions remain.

- [ ] **Step 4: Trigger narrative on merge**

For each successful merge, call `pickMergeScene(nextValue)`, update `currentScene`, append to `storyLog`, apply mood, and trigger board/cell effects.

- [ ] **Step 5: Simplify controls**

Create only:

```js
button("重遇", restart, true);
button("回忆", toggleMemory);
```

### Task 3: Mobile-First Story UI

**Files:**
- Modify: `assets/world.css`

**Interfaces:**
- Consumes: rendered classes `.love-story-card`, `.love-memory-drawer`, `.mood-*`, `.effect-love-story`.
- Produces: a 430 × 932 optimized layout and merge effects.

- [ ] **Step 1: Make Love 2048 single-column mobile-first**

At `body.solo-game-2048`, make `.solo-stage` a single column. Keep the board above the panel on mobile, center the board, and keep controls compact.

- [ ] **Step 2: Style story card**

Create `.love-story-card` with compact title, line, and progress text. It should fit below the board without causing horizontal overflow.

- [ ] **Step 3: Style mood classes**

Add stage mood variants:

```css
.board-love-2048.mood-meet {}
.board-love-2048.mood-chat {}
.board-love-2048.mood-date {}
.board-love-2048.mood-rain {}
.board-love-2048.mood-home {}
.board-love-2048.mood-starlight {}
```

- [ ] **Step 4: Style story effects**

Add `.effect-love-story`, `.effect-love-petal`, `.effect-love-starlight`, and keyframes for scene bloom.

### Task 4: Verification and Deployment

**Files:**
- Modify: none unless verification reveals defects.

**Interfaces:**
- Consumes: local static files and GitHub Pages build.
- Produces: verified public URL.

- [ ] **Step 1: Run static checks**

Run:

```bash
node --check assets/games.js
node --check assets/world.js
node --check tools/validate-love-2048.mjs
node tools/validate-love-2048.mjs
node tools/validate-site.mjs
git diff --check
```

Expected: all commands pass.

- [ ] **Step 2: Browser check at 430 × 932**

Start a local server, open `game-2048.html`, set viewport to `430 × 932`, swipe several times, and verify no console errors or horizontal overflow.

- [ ] **Step 3: Commit and push**

Run:

```bash
git add assets/games.js assets/world.css tools/validate-love-2048.mjs docs/superpowers/specs/2026-07-09-love-2048-narrative-events-design.md docs/superpowers/plans/2026-07-09-love-2048-narrative-events.md
git commit -m "Simplify love 2048 into narrative merges"
git push origin master
```

- [ ] **Step 4: Public verification**

Poll GitHub Pages until latest build is `built`, then curl `https://shanxixiaoyong.github.io/game-2048.html` and cache-busted JS/CSS to verify the new narrative markers are served.
