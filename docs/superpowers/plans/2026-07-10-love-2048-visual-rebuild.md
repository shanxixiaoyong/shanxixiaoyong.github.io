# Love 2048 Visual Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the standalone Love 2048 visual and interaction layer into a polished mobile game without changing its pure-2048 rules or story content.

**Architecture:** Keep state and relationship orchestration in `run2048()`, add a dedicated fail-soft canvas atmosphere module, and isolate all new standalone styling in a Love 2048 stylesheet. Extend the line solver with source/destination motion records so rendered feedback follows real moves instead of replaying generic entry animation.

**Tech Stack:** Static HTML, vanilla JavaScript, SVG heart markup, Canvas 2D, CSS animations, GitHub Pages.

## Global Constraints

- Primary target viewport is `430 x 932 CSS px`.
- Gameplay stays pure 2048 and keeps blocked-input tile spawning.
- Detailed event text remains nonblocking danmaku; effects never lock swipe input.
- Only `重遇` and `回忆` are action buttons.
- No external image URLs or generated image used as the playable background.
- Other games and personal-site pages must not be visually changed.
- Frontend must not expose implementation requirements or planning notes.

---

### Task 1: Visual Contract Tests

**Files:**
- Modify: `tools/validate-love-2048.mjs`

**Interfaces:**
- Consumes: `game-2048.html`, `assets/games.js`, `assets/love-2048-vfx.js`, `assets/love-2048.css`.
- Produces: failing checks for the dedicated visual files, motion model, canvas API, cinematic markup, touch feedback, and reduced-motion fallback.

- [ ] Add file reads and expectations for `Love2048Vfx`, `createLoveVfx`, `setMood`, `burst`, `celebrate`, `destroy`, `playTileMotion`, `love-motion-ghost`, `love-swipe-trace`, `love-cinematic-scene`, `heart-bevel`, `tile-glyph`, `tile-label`, and `prefers-reduced-motion`.
- [ ] Run `node --check tools/validate-love-2048.mjs && node tools/validate-love-2048.mjs` and confirm failure is caused by the missing visual rebuild markers.

### Task 2: Canvas Atmosphere

**Files:**
- Create: `assets/love-2048-vfx.js`
- Modify: `game-2048.html`

**Interfaces:**
- Produces: `window.Love2048Vfx.createLoveVfx(options)` returning `{ setMood(mood), burst(options), celebrate(options), destroy() }`.
- Consumes: viewport dimensions, board destination coordinates, scene mood, tone, and reduced-motion preference.

- [ ] Implement one fixed `canvas.love-vfx-canvas` with DPR capped at `1.5`, resize cleanup, bounded ambient particles, and requestAnimationFrame suspension when no particles need drawing.
- [ ] Implement mood renderers for petals/dust, rain, starlight, and warm fireflies plus local merge bursts and larger first-stage celebrations.
- [ ] Load the module before `assets/games.js` and keep initialization fail-soft.
- [ ] Run the validator and confirm only later visual markers still fail.

### Task 3: Real Movement And Interaction Feedback

**Files:**
- Modify: `assets/games.js`
- Modify: `assets/love-2048.css`

**Interfaces:**
- Extends: `slideLine(line)` with `motions: Array<{ source, destination, value, merged }>`.
- Produces: `playTileMotion(motions)`, `showSwipeTrace(dir)`, and `enableLoveTouchFeedback()`.
- Consumes: existing numeric `tiles`, destination cells, merge scene, and board geometry.

- [ ] Extend the line solver to preserve source slots and emit deterministic source/destination motion records without changing resulting numeric cells.
- [ ] Add a failing solver assertion for one slide, one merge, and one double merge, then run it and observe the expected failure before implementation.
- [ ] Render short-lived `.love-motion-ghost` hearts from source to destination and clean them before accepting the next visual sequence.
- [ ] Add destination settle classes, localized merge burst coordinates, swipe light trace, touch sheen, and directional blocked-swipe rebound.
- [ ] Ensure `render()` no longer applies arrival animation to every occupied tile.

### Task 4: Heart And Board Modeling

**Files:**
- Modify: `assets/games.js`
- Modify: `assets/love-2048.css`

**Interfaces:**
- Consumes: `romanceTile(value)` colors and labels.
- Produces: symmetric multi-layer SVG heart markup and stable tile typography for all stage values.

- [ ] Replace the current heart markup with halo, shadow, main enamel, bevel, inner glow, highlight, rim, and spark layers.
- [ ] Replace generic tile text tags with `.tile-glyph`, `.tile-number`, and `.tile-label`; calculate a digit class so large values fit without hiding the number.
- [ ] Rebalance `tileStory` palettes across garnet, coral, rose, amber, violet, moonlit blue, teal, emerald, champagne, and pearl stages.
- [ ] Model the board as a restrained dark-glass case, make empty wells clearly recessed, and keep all hearts centered within stable cell geometry.

### Task 5: Mobile Shell And Cinematic Reveal

**Files:**
- Modify: `game-2048.html`
- Modify: `assets/games.js`
- Modify: `assets/love-2048.css`

**Interfaces:**
- Consumes: current scene and `isFirstStageReveal`.
- Produces: standalone mobile HUD, narrative sheet, `.love-cinematic-scene`, and mood data on the page.

- [ ] Reshape the `430 x 932` layout so the HUD, dominant board, story sheet, and controls form one game surface rather than stacked website cards.
- [ ] Rebuild the first-stage reveal with mood-specific aura/orbit/copy layers and call the canvas `celebrate` API.
- [ ] Keep regular title bloom short and detailed text in danmaku lanes outside the board.
- [ ] Add `prefers-reduced-motion` rules that preserve readable state changes while disabling continuous particles, long travel, and large zooms.

### Task 6: Verification And Deployment

**Files:**
- Modify: none unless verification reveals defects.

**Interfaces:**
- Consumes: local static site and GitHub Pages.
- Produces: verified public Love 2048 page.

- [ ] Run `node --check assets/love-2048-vfx.js`, `node --check assets/games.js`, `node --check tools/validate-love-2048.mjs`, `node tools/validate-love-2048.mjs`, `node tools/validate-site.mjs`, and `git diff --check`.
- [ ] In a `430 x 932` browser viewport, verify initial composition, repeated swipes, blocked-input spawn, real motion ghosts, merge effects, first-stage cinematic effects, danmaku position, memory drawer, no horizontal overflow, and no console errors.
- [ ] Inspect a screenshot and iterate on any overlap, illegible number, weak contrast, or excessive ornamentation.
- [ ] Commit, push `master`, wait for Pages deployment, then verify cache-busted public HTML, CSS, and JavaScript markers.
