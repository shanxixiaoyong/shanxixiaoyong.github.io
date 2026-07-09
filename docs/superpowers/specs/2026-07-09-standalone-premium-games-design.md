# Standalone Premium Games Design

**Goal:** Split the arcade from a shared game page into standalone game pages that feel like individual game products.

**Public Structure:**
- `index.html` links directly to every game page.
- `games.html` becomes a visual game lobby, not a playable integrated arcade.
- Each game has its own page file and opens directly into that game.

**Game Pages:**
- `game-tetris.html`
- `game-2048.html`
- `game-mines.html`
- `game-sudoku.html`
- `game-snake.html`
- `game-bubble.html`
- `game-suika.html`
- `game-jump.html`
- `game-tower.html`
- `game-cards.html`

**Runtime Approach:** Keep one shared JavaScript runtime for maintainability, but render exactly one selected game when a page declares `#solo-game[data-game]`. The old multi-game menu remains only for legacy logic if needed, while public `games.html` no longer contains a playable board.

**Visual Approach:** Add a standalone game shell with page-specific atmosphere, hero art, HUD, and control layout. Each game still uses its own theme class and board style, but the page surrounding the board must not look like a generic website card.

**Verification:** Static validation must require every standalone page, direct homepage links, standalone runtime tokens, and absence of `#game-board` from `games.html`. Browser checks must load each page directly on desktop and mobile.
