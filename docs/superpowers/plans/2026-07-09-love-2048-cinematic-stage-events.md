# Love 2048 Cinematic Stage Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix blocked-swipe tile generation and expand Love 2048 into a cinematic, stage-rich romance 2048 experience.

**Architecture:** Keep the existing static page and `run2048()` entry point. Add testable validation to `tools/validate-love-2048.mjs`, update only Love 2048 logic in `assets/games.js`, and add centered cinematic overlay/mood styles in `assets/world.css`.

**Tech Stack:** Static HTML, vanilla JavaScript, CSS animations, existing GitHub Pages deployment.

## Global Constraints

- Primary target viewport is `430 x 932 CSS px`.
- Gameplay remains pure 2048: swipe, equal-number merge, new tile generation.
- New tile generation after a blocked swipe must prefer the top row when empty space exists.
- No resource meters, no special event cells, no extra action buttons.
- Frontend must not include implementation notes, requirements, or planning text.

---

### Task 1: Red Validator

**Files:**
- Modify: `tools/validate-love-2048.mjs`

**Interfaces:**
- Consumes: `game-2048.html`, `assets/games.js`, `assets/world.css`, `tools/validate-site.mjs`.
- Produces: static and behavior-oriented checks for the requested Love 2048 behavior.

- [ ] Add failing expectations for `addFromTop`, `spawnOnBlockedInput`, `showSceneOverlay`, `sceneOverlayTimer`, `love-scene-overlay`, expanded stage labels, and dense early scene pools.
- [ ] Add a validator check that early scene arrays have at least eight event objects.
- [ ] Run `node tools/validate-love-2048.mjs` and confirm it fails on the current implementation.

### Task 2: Movement And Stage Engine

**Files:**
- Modify: `assets/games.js`

**Interfaces:**
- Consumes: existing helper APIs `setScore`, `setStatus`, `button`, `triggerBoardEffect`, `triggerCellEffect`, `enableSwipe`, and `keyHandler`.
- Produces: `addFromTop()`, `spawnOnBlockedInput`, expanded `tileStory`, expanded `narrativeScenes`, and pure 2048 movement.

- [ ] Replace random-only tile generation with `addFromTop()`: choose a random empty cell in row 0 first, then fall back to all empty cells.
- [ ] Change `move(dir)` so `boardSignature() === before` still spawns when `emptyIndices().length > 0`.
- [ ] Expand `tileStory` to the new stage line through `4194304 长久相爱`.
- [ ] Expand `narrativeScenes` so early values have eight or more scene variants and later values remain stage-appropriate.
- [ ] Keep controls to `重遇` and `回忆`.

### Task 3: Central Cinematic Story

**Files:**
- Modify: `assets/games.js`
- Modify: `assets/world.css`

**Interfaces:**
- Consumes: selected merge scene from Task 2.
- Produces: `.love-scene-overlay`, `showSceneOverlay(scene)`, stronger mood backgrounds, and board particle styles.

- [ ] Add `sceneOverlayTimer` state and `showSceneOverlay(scene)` that appends a centered, non-interactive story overlay to the board.
- [ ] Call `showSceneOverlay(featured.scene)` immediately after a merge.
- [ ] Style `.love-scene-overlay` with stage, title, and detailed line content centered over the board.
- [ ] Add stage mood classes for campus, chat, cafe, rain, street, home, starlight, and vow atmospheres.

### Task 4: Verification And Deployment

**Files:**
- Modify: none unless checks reveal defects.

**Interfaces:**
- Consumes: local static files and GitHub Pages.
- Produces: verified public page.

- [ ] Run syntax and validators:

```bash
node --check assets/games.js
node --check assets/world.js
node --check tools/validate-love-2048.mjs
node tools/validate-love-2048.mjs
node tools/validate-site.mjs
git diff --check
```

- [ ] Run browser verification at `430 x 932`: start a local server, open `game-2048.html`, swipe until a merge occurs, verify centered story overlay, no horizontal overflow, no console errors.
- [ ] Commit and push to `master`.
- [ ] Poll GitHub Pages until the latest build is `built`, then curl cache-busted HTML, JS, and CSS markers from `https://shanxixiaoyong.github.io/`.
