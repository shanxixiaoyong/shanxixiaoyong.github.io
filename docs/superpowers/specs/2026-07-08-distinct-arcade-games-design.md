# Distinct Arcade Games Design

**Goal:** Rebuild the arcade so each game feels like a separate small game, not a shared demo template.

**User-facing constraint:** The live frontend must not contain implementation notes, requirements, or conversation-derived instructions. It may contain normal game names, status text, and concise play hints.

**Architecture:** Keep the static GitHub Pages structure. `games.html` remains the entry page. `assets/games.js` owns game state and rendering. `assets/world.css` owns the arcade shell plus game-specific visual systems. `tools/validate-site.mjs` protects against regressions with static checks.

**Game Direction:**
- Tetris: forged block stack with ghost landing, hold slot, next preview, and periodic surge pressure.
- 2048: molten number board with streak charge and a banked score multiplier.
- Minesweeper: sonar field with guaranteed safe first tap, long-press flags, and revealed-signal styling.
- Sudoku: paper-and-ink puzzle desk with row/column/box highlighting and conflict feedback.
- Snake: neon transit loop with wraparound portals, combo food, and speed pressure.
- Bubble: tide shooter with next bubble preview, shot counter, and row pressure.
- Suika: gravity orchard with fruit icons, combo chains, and a danger line.
- Jump: lunar jump stage with press-and-release power, moving landing pad, and streak scoring.
- Tower Defense: canyon route with two tower types, visible enemy HP, and wave pressure.
- Roguelite Cards: tactical card table with energy, enemy intent, card effects, and round progression.

**Testing:** Add static validation for game registry metadata, unique theme/class tokens, and frontend forbidden-copy guardrails. Use browser checks for desktop, mobile, and high-resolution mobile dimensions.
