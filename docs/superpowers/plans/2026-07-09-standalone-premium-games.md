# Standalone Premium Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build direct, standalone game pages from the homepage with richer page-level game presentation.

**Architecture:** Reuse the existing game runtime, add solo-page mode through `#solo-game[data-game]`, convert `games.html` into a lobby, add ten standalone HTML pages, and extend CSS for full-screen game pages.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node validation script, Chrome headless verification.

## Global Constraints

- Public frontend must not contain internal requirements, implementation notes, or conversation text.
- `games.html` must not render all games in one playable page.
- Homepage must directly link to all ten standalone game pages.
- Each standalone page must contain exactly one game runtime target.
- No side touch-pad or global direction panel.
- GitHub Pages URL remains `https://shanxixiaoyong.github.io/`.

---

### Task 1: Static Guardrails

**Files:**
- Modify: `tools/validate-site.mjs`

**Interfaces:**
- Consumes: HTML/CSS/JS files.
- Produces: failing checks until standalone pages and homepage links exist.

- [ ] Require ten `game-*.html` files.
- [ ] Require homepage direct links to all ten game pages.
- [ ] Require `games.html` to omit `id="game-board"` and include lobby links.
- [ ] Require `assets/games.js` to include solo-game mode tokens.

### Task 2: Runtime Solo Mode

**Files:**
- Modify: `assets/games.js`

**Interfaces:**
- Consumes: `#solo-game[data-game]` and existing game control IDs.
- Produces: one selected game rendered on each standalone page.

- [ ] Support `gameHub || soloGame`.
- [ ] Render menu only when `#game-menu` exists.
- [ ] Select the game from `#solo-game[data-game]`.
- [ ] Keep best scores and direct touch/keyboard input working.

### Task 3: HTML Pages and Entrypoints

**Files:**
- Modify: `index.html`
- Replace: `games.html`
- Create: ten `game-*.html` pages.

**Interfaces:**
- Consumes: solo-mode runtime.
- Produces: direct public routes to each game.

- [ ] Add a homepage game gateway with ten direct links.
- [ ] Convert `games.html` to a non-playable lobby grid.
- [ ] Add standalone game pages with shared required runtime IDs.

### Task 4: Premium Solo CSS

**Files:**
- Modify: `assets/world.css`

**Interfaces:**
- Consumes: solo page classes and existing board classes.
- Produces: immersive game pages with mobile-first touch layout.

- [ ] Add `.solo-game-page` base.
- [ ] Add per-theme atmosphere and game layout refinements.
- [ ] Ensure mobile pages have no horizontal overflow and no fixed side controls.

### Task 5: Verification and Deploy

**Files:**
- Modify only if checks find defects.

**Interfaces:**
- Consumes: built static site.
- Produces: committed and deployed GitHub Pages update.

- [ ] Run syntax and validation commands.
- [ ] Browser-check homepage direct links, lobby, and every standalone game.
- [ ] Commit, push, poll public deployment, and verify public pages.
