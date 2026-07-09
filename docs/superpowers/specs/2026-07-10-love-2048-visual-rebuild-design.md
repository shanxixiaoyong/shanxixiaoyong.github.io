# Love 2048 Visual Rebuild Design

## Goal

Rebuild the standalone `桃花心动 2048` screen into a cohesive mobile game at `430 x 932 CSS px`. Preserve the current pure-2048 rules, relationship stages, random story events, nonblocking title flash, and danmaku narrative while upgrading the board model, tile material, movement, interaction feedback, ambient scene, and first-stage full-screen reveal.

## Chosen Direction

Three approaches were considered:

1. A CSS reskin would be fast but would leave the current redraw-based movement and generic card layout intact.
2. A bitmap-heavy scene could look rich in a still image but would repeat the earlier failure mode where a background illustration does not improve the playable layer.
3. Code-native materials plus a lightweight canvas atmosphere creates a real game surface: the hearts, wells, movement ghosts, collisions, gesture trail, and cinematic layers all respond to play. This is the selected approach.

The generated concept image is a material and lighting reference only. It is not shipped as a page background.

## Visual Language

- Base palette: black cherry, smoked glass, garnet, coral, champagne gold, pearl, with small moonlit cyan accents.
- The screen must not read as a monochrome pink website or a collection of stacked cards.
- The board is a dark glass keepsake case with a restrained metallic rim and sixteen recessed wells.
- Occupied tiles are symmetrical enamel-gem hearts with bevel, rim light, inner glow, cast shadow, and stage-specific saturated color.
- Tile numbers remain the strongest element. Each heart shows one number only, with a small glyph crest and a compact stage label.
- Early and late relationship stages use visibly different palettes, not progressively lighter versions of the same pink.

## Mobile Composition

- The game occupies one `430 x 932` portrait viewport with safe-area padding and no horizontal overflow.
- The compact HUD contains the back action, game identity, and score.
- The board is the dominant object, centered at roughly `402 x 402` CSS pixels on the target viewport.
- The narrative area becomes a quiet glass sheet directly below the board instead of a separate oversized website panel.
- `重遇` and `回忆` remain the only action buttons.
- The board and narrative remain usable if the viewport height is slightly shorter; page scrolling is allowed as a fallback, but the target viewport should not have a large empty forehead or tail.

## Motion Model

- Static tiles must not replay an arrival animation on every swipe.
- Each slide records source and destination cells. Short-lived visual ghosts travel along those paths in about `180-230ms` while the numeric board updates immediately.
- Two source ghosts converge for a merge; the destination heart settles with a restrained squash, halo, and particle burst.
- New tiles fall from the top with a quick soft landing.
- Pointer contact adds a subtle board response and updates a localized touch sheen.
- Each swipe emits a directional light trace. Blocked swipes produce a small edge rebound rather than a generic central flash.
- Fast repeated swipes remain accepted; effects are disposable and never lock input.

## Scene And Full-Screen Effects

- A single fixed canvas, capped to a modest device pixel ratio and particle count, renders ambient petals, dust, rain, fireflies, or starlight according to the current scene mood.
- Normal merges trigger a localized burst at the destination heart plus the existing short center title flash.
- First discovery of a higher relationship stage triggers a `900-1150ms` full-screen cinematic reveal with mood-specific color, particle behavior, orbit/ring geometry, and short stage/title copy.
- Detailed event text remains in nonblocking danmaku lanes outside the board.
- All effect layers use `pointer-events: none` and honor `prefers-reduced-motion`.

## Architecture

- `assets/games.js` keeps game state, relationship content, motion records, and DOM event orchestration inside `run2048()`.
- `assets/love-2048-vfx.js` owns the canvas lifecycle and exposes `setMood`, `burst`, `celebrate`, and `destroy` through `window.Love2048Vfx`.
- `assets/love-2048.css` owns only the standalone Love 2048 visual system and overrides the shared arcade shell without changing other games.
- `game-2048.html` loads the dedicated CSS and canvas module before `assets/games.js`.

If the optional canvas module cannot initialize, the numeric game, DOM motion, CSS bloom, story card, and controls must still work.

## Acceptance Criteria

- Pure 2048 behavior and blocked-input spawning remain unchanged.
- Static tiles do not animate as newly arrived after an unrelated swipe.
- A valid slide produces directional tile motion; a merge produces converging motion and a destination collision effect.
- The page has one noninteractive canvas atmosphere and no externally hosted image dependency.
- First-stage and normal-stage effects remain nonblocking.
- At `430 x 932`, the board is centered, all sixteen wells are visible, numbers and labels fit, controls are reachable, and no element overlaps incoherently.
- Reduced-motion mode disables continuous and large movement while preserving state feedback.
- Static validators, JavaScript syntax checks, browser interaction checks, and console inspection pass before deployment.
