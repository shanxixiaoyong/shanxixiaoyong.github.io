const gameHub = document.querySelector("#game-hub");
const soloGame = document.querySelector("#solo-game");

if (gameHub || soloGame) {
  const menu = document.querySelector("#game-menu");
  const title = document.querySelector("#game-title");
  const heading = document.querySelector("#arcade-heading");
  const kind = document.querySelector("#game-kind");
  const score = document.querySelector("#game-score");
  const status = document.querySelector("#game-status");
  const board = document.querySelector("#game-board");
  const controls = document.querySelector("#game-controls");
  const meta = document.querySelector("#game-meta");
  let cleanup = () => {};
  let activeId = "";
  let metaItems = [];

  const colors = ["#70d6b2", "#7ab7ff", "#ffc15e", "#ff7a90", "#9d8cff", "#61d8ff", "#f4f1bb", "#d08cff"];
  const fruitIcons = ["", "🍒", "🍊", "🍋", "🍎", "🍇", "🍉", "🌕"];

  const games = [
    {
      id: "tetris",
      name: "熔炉方块",
      kind: "Blocks",
      theme: "block-forge",
      boardClass: "board-tetris-forge",
      tagline: "幽影落点、暂存槽和周期上涌的压力线。",
      feature: "Ghost / Hold / Surge",
      run: runTetris
    },
    {
      id: "merge2048",
      name: "桃花心动 2048",
      kind: "Love",
      theme: "love-2048",
      boardClass: "board-love-2048",
      tagline: "滑动牵手，合并心意，桃花会随连击盛放。",
      feature: "Affinity / Bloom / Vow",
      run: run2048
    },
    {
      id: "mines",
      name: "声呐扫雷",
      kind: "Logic",
      theme: "sonar-mines",
      boardClass: "board-sonar-mines",
      tagline: "首点安全，长按插旗，数字像声呐一样扩散。",
      feature: "Safe first tap / Sonar",
      run: runMines
    },
    {
      id: "sudoku",
      name: "墨格数独",
      kind: "Logic",
      theme: "ink-sudoku",
      boardClass: "board-ink-sudoku",
      tagline: "纸面高亮同行同列同宫，冲突会直接显影。",
      feature: "Focus lines / Conflict",
      run: runSudoku
    },
    {
      id: "snake",
      name: "霓虹列车",
      kind: "Arcade",
      theme: "neon-snake",
      boardClass: "board-neon-snake",
      tagline: "边界变成传送门，连吃会让列车加速。",
      feature: "Portal / Combo",
      run: runSnake
    },
    {
      id: "bubble",
      name: "潮汐泡泡",
      kind: "Shooter",
      theme: "tide-bubble",
      boardClass: "board-tide-bubble",
      tagline: "每五发潮水下压一层，提前看准下一颗。",
      feature: "Tide / Preview",
      run: runBubble
    },
    {
      id: "suika",
      name: "重力果园 · 合成大西瓜",
      kind: "Merge",
      theme: "orchard-suika",
      boardClass: "board-orchard-suika",
      tagline: "水果会坠落、相邻会连锁合成，越靠近警戒线越紧张。",
      feature: "Gravity / Chain",
      run: runSuika
    },
    {
      id: "jump",
      name: "月面跳台 · 跳一跳",
      kind: "Timing",
      theme: "lunar-jump",
      boardClass: "board-lunar-jump",
      tagline: "按住蓄力，松手起跳，落点平台会缓慢漂移。",
      feature: "Charge / Drift",
      run: runJump
    },
    {
      id: "tower",
      name: "峡谷塔防",
      kind: "Strategy",
      theme: "canyon-tower",
      boardClass: "board-canyon-tower",
      tagline: "炮塔和冰塔互补，敌人沿峡谷路线推进。",
      feature: "Cannon / Frost",
      run: runTower
    },
    {
      id: "cards",
      name: "星舰卡牌 · 肉鸽卡牌",
      kind: "Cards",
      theme: "starship-cards",
      boardClass: "board-starship-cards",
      tagline: "能量、护盾、敌方意图和抽牌节奏构成一局小战斗。",
      feature: "Energy / Intent",
      run: runCards
    }
  ];

  function escapeText(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function setScore(value) {
    score.textContent = String(value);
    const numeric = Number.parseInt(String(value), 10);
    if (!activeId || !Number.isFinite(numeric)) return;
    const key = `yl-arcade-best-${activeId}`;
    const best = Number(localStorage.getItem(key) || 0);
    if (numeric > best) localStorage.setItem(key, String(numeric));
    renderMeta();
  }

  function setStatus(value) {
    status.textContent = value;
  }

  function renderMeta() {
    if (!meta) return;
    const best = activeId ? Number(localStorage.getItem(`yl-arcade-best-${activeId}`) || 0) : 0;
    const items = best ? [`Best ${best}`, ...metaItems] : metaItems;
    meta.innerHTML = items.map((item) => `<span>${escapeText(item)}</span>`).join("");
  }

  function setMeta(items = []) {
    metaItems = items;
    renderMeta();
  }

  function button(label, action, primary = false) {
    const item = document.createElement("button");
    item.type = "button";
    item.textContent = label;
    item.className = primary ? "primary" : "";
    item.addEventListener("click", action);
    controls.append(item);
    return item;
  }

  function cell(className, text = "") {
    const item = document.createElement("button");
    item.type = "button";
    item.className = className;
    item.textContent = text;
    return item;
  }

  function keyHandler(map) {
    const handler = (event) => {
      const action = map[event.key];
      if (!action) return;
      event.preventDefault();
      action();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }

  function triggerBoardEffect(name, options = {}) {
    if (!board) return;
    const item = document.createElement("span");
    item.className = `board-effect effect-${name}`;
    item.setAttribute("aria-hidden", "true");
    if (Number.isFinite(options.x)) item.style.setProperty("--fx-x", `${options.x}%`);
    if (Number.isFinite(options.y)) item.style.setProperty("--fx-y", `${options.y}%`);
    if (options.text) item.textContent = options.text;
    const duration = options.duration || 760;
    board.append(item);
    window.setTimeout(() => item.remove(), duration);
    const fxClass = `fx-${name}`;
    board.classList.remove(fxClass);
    void board.offsetWidth;
    board.classList.add(fxClass);
    window.setTimeout(() => board.classList.remove(fxClass), duration);
  }

  function triggerCellEffect(name, index, cols, rows, options = {}) {
    const x = ((index % cols) + 0.5) / cols * 100;
    const y = (Math.floor(index / cols) + 0.5) / rows * 100;
    triggerBoardEffect(name, { ...options, x, y });
  }

  function enableSwipe(actions, threshold = 28) {
    let startX = 0;
    let startY = 0;
    const down = (event) => {
      startX = event.clientX;
      startY = event.clientY;
    };
    const up = (event) => {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
      if (Math.abs(dx) > Math.abs(dy)) (dx > 0 ? actions.right : actions.left)?.();
      else (dy > 0 ? actions.down : actions.up)?.();
    };
    board.addEventListener("pointerdown", down);
    board.addEventListener("pointerup", up);
    return () => {
      board.removeEventListener("pointerdown", down);
      board.removeEventListener("pointerup", up);
    };
  }

  function enableTap(action) {
    let startX = 0;
    let startY = 0;
    const down = (event) => {
      startX = event.clientX;
      startY = event.clientY;
    };
    const up = (event) => {
      if (Math.hypot(event.clientX - startX, event.clientY - startY) < 18) action(event);
    };
    board.addEventListener("pointerdown", down);
    board.addEventListener("pointerup", up);
    return () => {
      board.removeEventListener("pointerdown", down);
      board.removeEventListener("pointerup", up);
    };
  }

  function resetStage(game) {
    cleanup();
    cleanup = () => {};
    activeId = game.id;
    document.body.dataset.arcadeTheme = game.theme;
    title.textContent = game.name;
    if (heading) heading.textContent = game.name;
    kind.textContent = game.kind;
    setScore(0);
    setStatus(game.tagline);
    setMeta([game.feature]);
    board.innerHTML = "";
    controls.innerHTML = "";
    board.removeAttribute("style");
    board.className = `arcade-board is-${game.id} ${game.boardClass}`;
    board.dataset.theme = game.theme;
    menu?.querySelectorAll("button").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.game === game.id);
    });
    cleanup = game.run();
    board.focus({ preventScroll: true });
  }

  if (menu) {
    games.forEach((game) => {
      const item = document.createElement("button");
      item.type = "button";
      item.dataset.game = game.id;
      item.innerHTML = `<span>${escapeText(game.kind)}</span><strong>${escapeText(game.name)}</strong><em>${escapeText(game.feature)}</em>`;
      item.addEventListener("click", () => resetStage(game));
      menu.append(item);
    });
  }

  resetStage(games.find((game) => game.id === soloGame?.dataset.game) || games[0]);

  function runTetris() {
    const width = 10;
    const height = 20;
    const shapes = [
      { name: "I", shape: [[1, 1, 1, 1]] },
      { name: "O", shape: [[1, 1], [1, 1]] },
      { name: "T", shape: [[0, 1, 0], [1, 1, 1]] },
      { name: "L", shape: [[1, 0, 0], [1, 1, 1]] },
      { name: "J", shape: [[0, 0, 1], [1, 1, 1]] },
      { name: "S", shape: [[1, 1, 0], [0, 1, 1]] },
      { name: "Z", shape: [[0, 1, 1], [1, 1, 0]] }
    ];
    let grid;
    let piece;
    let nextPiece;
    let holdPiece = null;
    let holdUsed = false;
    let points = 0;
    let locks = 0;
    let paused = false;
    let over = false;

    board.style.setProperty("--cols", width);
    board.style.setProperty("--rows", height);

    function makePiece() {
      const base = shapes[Math.floor(Math.random() * shapes.length)];
      return {
        name: base.name,
        shape: base.shape.map((row) => [...row]),
        x: Math.floor(width / 2) - 2,
        y: 0,
        color: 1 + Math.floor(Math.random() * colors.length)
      };
    }

    function collides(test) {
      return test.shape.some((row, y) => row.some((value, x) => {
        if (!value) return false;
        const nx = test.x + x;
        const ny = test.y + y;
        return nx < 0 || nx >= width || ny >= height || (ny >= 0 && grid[ny][nx]);
      }));
    }

    function tetrisGhostCells() {
      const ghost = { ...piece, y: piece.y };
      while (!collides({ ...ghost, y: ghost.y + 1 })) ghost.y += 1;
      const cells = new Set();
      ghost.shape.forEach((row, y) => row.forEach((value, x) => {
        if (value && ghost.y + y >= 0) cells.add((ghost.y + y) * width + ghost.x + x);
      }));
      return cells;
    }

    function rotate() {
      if (over || paused) return;
      const shape = piece.shape[0].map((_, x) => piece.shape.map((row) => row[x]).reverse());
      const options = [0, -1, 1, -2, 2].map((dx) => ({ ...piece, x: piece.x + dx, shape }));
      const next = options.find((candidate) => !collides(candidate));
      if (next) piece = next;
      render();
    }

    function move(dx, dy) {
      if (over || paused) return false;
      const next = { ...piece, x: piece.x + dx, y: piece.y + dy };
      if (!collides(next)) {
        piece = next;
        render();
        return true;
      }
      if (dy) lock();
      return false;
    }

    function swapHold() {
      if (over || paused || holdUsed) return;
      holdUsed = true;
      const incoming = holdPiece;
      holdPiece = { ...piece, x: Math.floor(width / 2) - 2, y: 0 };
      piece = incoming ? { ...incoming, x: Math.floor(width / 2) - 2, y: 0 } : nextPiece;
      if (!incoming) nextPiece = makePiece();
      setStatus("Hold locked until next piece");
      render();
      triggerBoardEffect("forge-hold", { duration: 620 });
    }

    function applySurge() {
      grid.shift();
      const hole = Math.floor(Math.random() * width);
      grid.push(Array.from({ length: width }, (_, i) => i === hole ? 0 : 8));
      setStatus("Surge line rises");
    }

    function lock() {
      piece.shape.forEach((row, y) => row.forEach((value, x) => {
        if (value && piece.y + y >= 0) grid[piece.y + y][piece.x + x] = piece.color;
      }));
      const before = grid.length;
      grid = grid.filter((row) => row.some((value) => !value));
      const cleared = before - grid.length;
      while (grid.length < height) grid.unshift(Array(width).fill(0));
      points += cleared ? [0, 120, 360, 720, 1200][cleared] : 14;
      locks += 1;
      const surged = locks % 6 === 0;
      if (surged) applySurge();
      piece = nextPiece;
      nextPiece = makePiece();
      holdUsed = false;
      if (collides(piece)) {
        over = true;
        setStatus("Game Over");
      }
      render();
      if (cleared) triggerBoardEffect("forge-clear", { text: `+${cleared}`, duration: 820 });
      else triggerBoardEffect("forge-lock", { duration: 520 });
      if (surged) triggerBoardEffect("forge-surge", { duration: 920 });
    }

    function hardDrop() {
      if (over || paused) return;
      while (move(0, 1)) points += 2;
      render();
      triggerBoardEffect("forge-drop", { duration: 460 });
    }

    function render() {
      const ghost = tetrisGhostCells();
      const active = new Set();
      const view = grid.map((row) => [...row]);
      piece.shape.forEach((row, y) => row.forEach((value, x) => {
        if (!value || piece.y + y < 0) return;
        const index = (piece.y + y) * width + piece.x + x;
        active.add(index);
        view[piece.y + y][piece.x + x] = piece.color;
      }));
      board.innerHTML = view.flat().map((value, index) => {
        const classes = ["block-cell"];
        if (ghost.has(index) && !active.has(index)) classes.push("is-ghost");
        if (active.has(index)) classes.push("is-active");
        if (value === 8) classes.push("is-surge");
        const style = value ? ` style="--cell:${value === 8 ? "#d25a4b" : colors[(value - 1) % colors.length]}"` : "";
        return `<span class="${classes.join(" ")}"${style}></span>`;
      }).join("");
      setScore(points);
      setMeta([`Hold ${holdPiece?.name || "empty"}`, `Next ${nextPiece.name}`, `Surge ${6 - (locks % 6)}`]);
    }

    function tick() {
      if (!over && !paused) move(0, 1);
    }

    function restart() {
      grid = Array.from({ length: height }, () => Array(width).fill(0));
      piece = makePiece();
      nextPiece = makePiece();
      holdPiece = null;
      holdUsed = false;
      points = 0;
      locks = 0;
      paused = false;
      over = false;
      setStatus("Swipe move · tap rotate");
      render();
    }

    button("暂存", swapHold, true);
    button("暂停", () => { paused = !paused; setStatus(paused ? "Paused" : "Swipe move · tap rotate"); });
    button("重开", restart);
    restart();
    const offKey = keyHandler({
      ArrowLeft: () => move(-1, 0),
      ArrowRight: () => move(1, 0),
      ArrowDown: () => move(0, 1),
      ArrowUp: rotate,
      " ": hardDrop,
      c: swapHold,
      C: swapHold
    });
    const offSwipe = enableSwipe({ left: () => move(-1, 0), right: () => move(1, 0), down: hardDrop, up: rotate });
    const offTap = enableTap(rotate);
    const timer = setInterval(tick, 540);
    return () => { offKey(); offSwipe(); offTap(); clearInterval(timer); };
  }

  function run2048() {
    const size = 4;
    let tiles = [];
    let points = 0;
    let affinity = 0;
    let bloomChain = 0;
    let vowReady = false;
    let lastMergeCells = [];
    let lastSpawnCell = -1;
    let lastMoveDir = "start";
    let loveTempo = 1;

    const tileStory = [
      [2, "♡", "初遇", "#ffd7e5", "#bc486f"],
      [4, "❀", "桃信", "#ffc8df", "#bf5777"],
      [8, "💌", "告白", "#ffb4d2", "#c94d78"],
      [16, "💕", "牵手", "#ffa2c7", "#bb416d"],
      [32, "🌸", "花雨", "#ff91ba", "#a93565"],
      [64, "💗", "热恋", "#ff7fae", "#95315d"],
      [128, "💞", "相守", "#ff6da2", "#862a55"],
      [256, "💖", "心约", "#ff5d98", "#7e2651"],
      [512, "🌙", "良夜", "#eaa6ff", "#65306d"],
      [1024, "💍", "誓约", "#ffd27a", "#8a5722"],
      [2048, "💘", "永恒", "#fff0a8", "#8f5b2f"]
    ];

    board.style.setProperty("--cols", size);
    board.style.setProperty("--rows", size);

    function add(value = Math.random() > 0.88 ? 4 : 2) {
      const empty = tiles.map((v, i) => v ? -1 : i).filter((i) => i >= 0);
      if (!empty.length) return -1;
      const index = empty[Math.floor(Math.random() * empty.length)];
      tiles[index] = value;
      return index;
    }

    function romanceTile(value) {
      if (!value) return { glyph: "", label: "", rank: 0, color: "transparent", deep: "transparent" };
      let selected = tileStory[0];
      for (const item of tileStory) {
        if (value >= item[0]) selected = item;
      }
      const rank = Math.max(1, Math.min(tileStory.length, Math.round(Math.log2(value))));
      return {
        glyph: selected[1],
        label: selected[2],
        rank,
        color: selected[3],
        deep: selected[4]
      };
    }

    function slideLine(line) {
      const values = line.filter(Boolean);
      const result = [];
      const mergedSlots = [];
      let merged = 0;
      for (let i = 0; i < values.length; i += 1) {
        if (values[i] && values[i] === values[i + 1]) {
          const nextValue = values[i] * 2;
          result.push(nextValue);
          mergedSlots.push(result.length - 1);
          merged += nextValue;
          i += 1;
        } else {
          result.push(values[i]);
        }
      }
      while (result.length < size) result.push(0);
      return { values: result, merged, mergedSlots };
    }

    function canMove() {
      if (tiles.some((value) => !value)) return true;
      for (let i = 0; i < tiles.length; i += 1) {
        const col = i % size;
        const row = Math.floor(i / size);
        if (col < size - 1 && tiles[i] === tiles[i + 1]) return true;
        if (row < size - 1 && tiles[i] === tiles[i + size]) return true;
      }
      return false;
    }

    function move(dir) {
      const before = tiles.join(",");
      let mergedThisMove = 0;
      const mergedCells = [];
      for (let i = 0; i < size; i += 1) {
        const rawIndices = [];
        for (let j = 0; j < size; j += 1) {
          const idx = dir === "left" || dir === "right" ? i * size + j : j * size + i;
          rawIndices.push(idx);
        }
        const orientedIndices = dir === "right" || dir === "down" ? rawIndices.slice().reverse() : rawIndices;
        const input = orientedIndices.map((idx) => tiles[idx]);
        const shifted = slideLine(input);
        mergedThisMove += shifted.merged;
        for (const slot of shifted.mergedSlots) mergedCells.push(orientedIndices[slot]);
        for (let j = 0; j < size; j += 1) {
          tiles[orientedIndices[j]] = shifted.values[j];
        }
      }
      if (tiles.join(",") !== before) {
        lastMoveDir = dir;
        lastMergeCells = mergedCells;
        if (mergedThisMove) {
          bloomChain += 1;
          affinity = Math.min(100, affinity + 18 + bloomChain * 6 + Math.min(14, Math.floor(Math.log2(mergedThisMove))));
          loveTempo = Math.max(0.58, 1 - bloomChain * 0.055);
          points += Math.round(mergedThisMove * (1 + Math.min(bloomChain, 6) * 0.22));
          if (affinity >= 100) vowReady = true;
        } else {
          bloomChain = 0;
          affinity = Math.max(0, affinity - 6);
          loveTempo = 1;
        }
        lastSpawnCell = add();
      } else {
        lastMoveDir = dir;
        lastMergeCells = [];
        setStatus("轻轻碰撞，换个方向牵手");
        triggerBoardEffect("love-bump", { duration: 420 });
      }
      render();
      if (mergedThisMove) {
        triggerBoardEffect("love-merge", { text: `×${bloomChain}`, duration: 860 });
        for (const index of mergedCells.slice(0, 4)) {
          triggerCellEffect("love-collision", index, size, size, { duration: 680 });
        }
      }
    }

    function vow() {
      if (!vowReady) {
        setStatus("心动值未满，继续合并积攒桃花");
        triggerBoardEffect("love-bump", { duration: 420 });
        return;
      }
      const small = tiles
        .map((value, index) => ({ value, index }))
        .filter((item) => item.value)
        .sort((a, b) => a.value - b.value)[0];
      if (small) {
        tiles[small.index] *= 2;
        points += tiles[small.index] * 2;
        lastMergeCells = [small.index];
      }
      affinity = 0;
      bloomChain = 0;
      loveTempo = 1;
      vowReady = false;
      lastMoveDir = "vow";
      render();
      setStatus("誓约绽放，最小心意翻倍");
      triggerBoardEffect("love-vow", { text: "♡", duration: 2200 });
    }

    function render() {
      const moveVectors = {
        left: ["-1", "0"],
        right: ["1", "0"],
        up: ["0", "-1"],
        down: ["0", "1"],
        vow: ["0", "0"],
        start: ["0", "0"]
      };
      const [moveX, moveY] = moveVectors[lastMoveDir] || moveVectors.start;
      const mergeSet = new Set(lastMergeCells);
      board.style.setProperty("--affinity", affinity);
      board.style.setProperty("--affinity-alpha", Math.min(0.62, affinity / 150).toFixed(3));
      board.style.setProperty("--tempo", loveTempo.toFixed(2));
      board.style.setProperty("--move-x", moveX);
      board.style.setProperty("--move-y", moveY);
      board.classList.toggle("is-accelerated", bloomChain >= 2);
      board.classList.toggle("is-vow-ready", vowReady);
      board.dataset.move = lastMoveDir;
      board.innerHTML = tiles.map((value, index) => {
        const tile = romanceTile(value);
        const hot = value && value >= 128 ? "is-hot" : "";
        const collision = mergeSet.has(index) ? "is-collision" : "";
        const newborn = index === lastSpawnCell ? "is-new" : "";
        const vowTile = value && value >= 1024 ? "is-vow" : "";
        const style = value ? ` style="--tile:${tile.color};--tile-deep:${tile.deep};--rank:${tile.rank};"` : "";
        const content = value ? `<b>${tile.glyph}</b><small>${escapeText(tile.label)}</small><em>${value}</em>` : "";
        return `<span class="merge-cell love-tile v${value || 0} ${hot} ${collision} ${newborn} ${vowTile}" data-value="${value || ""}" data-rank="${tile.rank}" data-romance="${escapeText(tile.label)}"${style}>${content}</span>`;
      }).join("");
      setScore(points);
      if (!canMove()) {
        setStatus("花局已满，点重遇重新开始");
      } else {
        setStatus(vowReady ? "心动值已满，点誓约让最小心意翻倍" : `心动值 ${affinity}% · ${bloomChain ? `桃花连击 ×${bloomChain}` : "滑动牵手"}`);
      }
      setMeta([`心动 ${affinity}%`, bloomChain ? `连击 ${bloomChain}` : "等待相遇", vowReady ? "誓约可用" : `加速 ${loveTempo.toFixed(2)}x`]);
    }

    function restart() {
      tiles = Array(size * size).fill(0);
      points = 0;
      affinity = 0;
      bloomChain = 0;
      loveTempo = 1;
      vowReady = false;
      lastMoveDir = "start";
      lastMergeCells = [];
      add();
      lastSpawnCell = add();
      render();
    }

    button("誓约", vow, true);
    button("重遇", restart);
    restart();
    const offKey = keyHandler({ ArrowLeft: () => move("left"), ArrowRight: () => move("right"), ArrowUp: () => move("up"), ArrowDown: () => move("down"), " ": vow });
    const offSwipe = enableSwipe({ left: () => move("left"), right: () => move("right"), up: () => move("up"), down: () => move("down") });
    return () => { offKey(); offSwipe(); };
  }

  function runMines() {
    const width = 9;
    const mineCount = 12;
    let cells = [];
    let flagMode = false;
    let ended = false;
    let firstSafeOpen = false;
    let lastOpen = -1;

    board.style.setProperty("--cols", width);
    board.style.setProperty("--rows", width);

    function neighbors(i) {
      const x = i % width;
      const y = Math.floor(i / width);
      const out = [];
      for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < width) out.push(ny * width + nx);
      }
      return out;
    }

    function refreshNumbers() {
      cells.forEach((c, i) => c.near = neighbors(i).filter((n) => cells[n].mine).length);
    }

    function relocateMine(from) {
      const target = cells.findIndex((item, i) => i !== from && !item.mine);
      if (target >= 0) {
        cells[from].mine = false;
        cells[target].mine = true;
        refreshNumbers();
      }
    }

    function reveal(i, cascade = false) {
      if (ended || cells[i].open || cells[i].flag) return;
      if (!firstSafeOpen) {
        firstSafeOpen = true;
        if (cells[i].mine) relocateMine(i);
      }
      lastOpen = i;
      cells[i].open = true;
      if (cells[i].mine) {
        ended = true;
        cells.forEach((c) => { if (c.mine) c.open = true; });
        setStatus("Signal lost");
      } else if (!cells[i].near) {
        neighbors(i).forEach((n) => reveal(n, true));
      }
      if (!ended && cells.filter((c) => !c.mine && c.open).length === width * width - mineCount) {
        ended = true;
        setStatus("Field clear");
      }
      render();
      if (!cascade) triggerCellEffect(cells[i].mine ? "sonar-mine" : "sonar-ping", i, width, width, { duration: 900 });
    }

    function toggleFlag(i) {
      if (ended || cells[i].open) return;
      cells[i].flag = !cells[i].flag;
      render();
      triggerCellEffect("sonar-flag", i, width, width, { duration: 520 });
    }

    function render() {
      board.innerHTML = "";
      cells.forEach((item, i) => {
        const classes = [
          "mine-cell",
          item.open ? "is-open" : "",
          item.flag ? "is-flagged" : "",
          item.open && i === lastOpen ? "is-pulse" : "",
          item.open && item.near ? `near-${item.near}` : ""
        ].filter(Boolean).join(" ");
        const label = item.open ? (item.mine ? "×" : item.near || "") : item.flag ? "⚑" : "";
        const b = cell(classes, label);
        let longPress = false;
        let timer = null;
        b.addEventListener("pointerdown", () => {
          longPress = false;
          timer = setTimeout(() => {
            longPress = true;
            toggleFlag(i);
          }, 420);
        });
        b.addEventListener("pointerup", (event) => {
          clearTimeout(timer);
          if (longPress) {
            event.preventDefault();
            event.stopPropagation();
          }
        });
        b.addEventListener("pointercancel", () => clearTimeout(timer));
        b.addEventListener("contextmenu", (event) => event.preventDefault());
        b.addEventListener("click", () => {
          if (longPress) return;
          if (flagMode) toggleFlag(i);
          else reveal(i);
        });
        board.append(b);
      });
      if (lastOpen >= 0) {
        const ping = document.createElement("span");
        ping.className = "board-effect effect-sonar-ping";
        ping.setAttribute("aria-hidden", "true");
        ping.style.setProperty("--fx-x", `${((lastOpen % width) + 0.5) / width * 100}%`);
        ping.style.setProperty("--fx-y", `${(Math.floor(lastOpen / width) + 0.5) / width * 100}%`);
        board.append(ping);
      }
      setScore(cells.filter((c) => c.flag).length);
      setMeta([firstSafeOpen ? "First tap safe" : "First tap protected", "Long press flag", `${mineCount} signals`]);
    }

    function restart() {
      cells = Array.from({ length: width * width }, () => ({ mine: false, open: false, flag: false, near: 0 }));
      let placed = 0;
      while (placed < mineCount) {
        const i = Math.floor(Math.random() * cells.length);
        if (!cells[i].mine) {
          cells[i].mine = true;
          placed += 1;
        }
      }
      refreshNumbers();
      flagMode = false;
      ended = false;
      firstSafeOpen = false;
      lastOpen = -1;
      setStatus("Tap to scan");
      render();
    }

    button("扫描", () => { flagMode = false; setStatus("Scan mode"); }, true);
    button("插旗", () => { flagMode = true; setStatus("Flag mode"); });
    button("重开", restart);
    restart();
    return () => {};
  }

  function runSudoku() {
    const puzzle = "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const answer = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";
    let values = puzzle.split("").map(Number);
    let selected = 0;

    board.style.setProperty("--cols", 9);
    board.style.setProperty("--rows", 9);

    function related(i) {
      const x = i % 9;
      const y = Math.floor(i / 9);
      const boxX = Math.floor(x / 3) * 3;
      const boxY = Math.floor(y / 3) * 3;
      const set = new Set();
      for (let n = 0; n < 9; n += 1) {
        set.add(y * 9 + n);
        set.add(n * 9 + x);
      }
      for (let dy = 0; dy < 3; dy += 1) for (let dx = 0; dx < 3; dx += 1) set.add((boxY + dy) * 9 + boxX + dx);
      return set;
    }

    function conflictMarks() {
      const conflicts = new Set();
      for (let i = 0; i < values.length; i += 1) {
        if (!values[i]) continue;
        for (const j of related(i)) {
          if (i !== j && values[j] === values[i]) {
            conflicts.add(i);
            conflicts.add(j);
          }
        }
      }
      return conflicts;
    }

    function render() {
      const focus = related(selected);
      const conflicts = conflictMarks();
      const selectedValue = values[selected];
      board.innerHTML = "";
      values.forEach((value, i) => {
        const fixed = puzzle[i] !== "0";
        const classes = [
          "sudoku-cell",
          fixed ? "is-fixed" : "",
          selected === i ? "is-selected" : "",
          focus.has(i) ? "is-related" : "",
          selectedValue && value === selectedValue ? "is-same" : "",
          conflicts.has(i) ? "is-conflict" : ""
        ].filter(Boolean).join(" ");
        const b = cell(classes, value || "");
        b.addEventListener("click", () => {
          selected = i;
          render();
          triggerCellEffect("ink-focus", i, 9, 9, { duration: 620 });
        });
        board.append(b);
      });
      const conflictCount = conflicts.size;
      setScore(values.filter(Boolean).length);
      setStatus(values.join("") === answer ? "Solved" : conflictCount ? `${conflictCount} conflicts` : "Clean grid");
      setMeta(["Focus lines", conflictCount ? "Conflict visible" : "No conflict", `${values.filter(Boolean).length}/81`]);
    }

    function put(n) {
      if (puzzle[selected] === "0") values[selected] = n;
      render();
      const conflicts = conflictMarks();
      triggerCellEffect(conflicts.has(selected) ? "ink-conflict" : "ink-mark", selected, 9, 9, { duration: 680 });
      if (values.join("") === answer) triggerBoardEffect("ink-solve", { duration: 1000 });
    }

    function select(dx, dy) {
      const x = selected % 9;
      const y = Math.floor(selected / 9);
      selected = Math.max(0, Math.min(8, y + dy)) * 9 + Math.max(0, Math.min(8, x + dx));
      render();
      triggerCellEffect("ink-focus", selected, 9, 9, { duration: 420 });
    }

    for (let i = 1; i <= 9; i += 1) button(String(i), () => put(i), i === 1);
    button("清空", () => put(0));
    button("重开", () => { values = puzzle.split("").map(Number); selected = 0; render(); });
    render();
    return keyHandler({
      ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [String(i + 1), () => put(i + 1)])),
      "0": () => put(0),
      Backspace: () => put(0),
      Delete: () => put(0),
      ArrowLeft: () => select(-1, 0),
      ArrowRight: () => select(1, 0),
      ArrowUp: () => select(0, -1),
      ArrowDown: () => select(0, 1)
    });
  }

  function runSnake() {
    const size = 17;
    let snake;
    let dir;
    let food;
    let points;
    let combo;
    let dead;
    let paused;
    let timer = null;

    board.style.setProperty("--cols", size);
    board.style.setProperty("--rows", size);

    function portalWrap(x, y) {
      return ((y + size) % size) * size + ((x + size) % size);
    }

    function placeFood() {
      do {
        food = {
          index: Math.floor(Math.random() * size * size),
          pulse: Math.random() > 0.74
        };
      } while (snake.includes(food.index));
    }

    function turn(next) {
      const blocked = { left: "right", right: "left", up: "down", down: "up" };
      if (blocked[dir] !== next) dir = next;
    }

    function tick() {
      if (dead || paused) return;
      const head = snake[0];
      const x = head % size;
      const y = Math.floor(head / size);
      const next = dir === "left" ? portalWrap(x - 1, y) : dir === "right" ? portalWrap(x + 1, y) : dir === "up" ? portalWrap(x, y - 1) : portalWrap(x, y + 1);
      if (snake.includes(next)) {
        dead = true;
        setStatus("Train derailed");
        render();
        triggerCellEffect("neon-crash", next, size, size, { duration: 980 });
        return;
      }
      let ate = false;
      snake.unshift(next);
      if (next === food.index) {
        ate = true;
        combo += 1;
        points += food.pulse ? 25 + combo * 4 : 10 + combo * 2;
        placeFood();
      } else {
        combo = Math.max(0, combo - 1);
        snake.pop();
      }
      render();
      if (ate) triggerCellEffect("neon-eat", next, size, size, { text: `+${combo}`, duration: 720 });
    }

    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        tick();
        schedule();
      }, Math.max(70, 180 - combo * 10));
    }

    function render() {
      const set = new Set(snake);
      board.innerHTML = Array.from({ length: size * size }, (_, i) => {
        const edge = i < size || i >= size * (size - 1) || i % size === 0 || i % size === size - 1;
        const segment = snake.indexOf(i);
        const classes = [
          "snake-cell",
          set.has(i) ? "is-snake" : "",
          snake[0] === i ? "is-head" : "",
          segment === snake.length - 1 ? "is-tail" : "",
          food.index === i ? "is-food" : "",
          food.index === i && food.pulse ? "is-pulse-food" : "",
          edge ? "is-portal" : ""
        ].filter(Boolean).join(" ");
        const style = segment >= 0
          ? ` style="--segment:${segment};--snake-size:${snake.length};--snake-hue:${165 + Math.min(segment, 12) * 8};--snake-scale:${Math.max(0.84, 1 - Math.min(segment, 8) * 0.018).toFixed(3)}"`
          : "";
        return `<span class="${classes}"${style}></span>`;
      }).join("");
      setScore(points);
      setStatus(dead ? "Train derailed" : paused ? "Paused" : `Combo ${combo}`);
      setMeta(["Portal edges", `Combo ${combo}`, food.pulse ? "Pulse food" : "Core food"]);
    }

    function restart() {
      snake = [portalWrap(4, 8), portalWrap(3, 8), portalWrap(2, 8)];
      dir = "right";
      points = 0;
      combo = 0;
      dead = false;
      paused = false;
      placeFood();
      render();
    }

    function pause() {
      paused = !paused;
      render();
    }

    button("暂停", pause, true);
    button("重开", restart);
    restart();
    schedule();
    const offKey = keyHandler({ ArrowLeft: () => turn("left"), ArrowRight: () => turn("right"), ArrowUp: () => turn("up"), ArrowDown: () => turn("down"), " ": pause });
    const offSwipe = enableSwipe({ left: () => turn("left"), right: () => turn("right"), up: () => turn("up"), down: () => turn("down") });
    return () => { clearTimeout(timer); offKey(); offSwipe(); };
  }

  function runBubble() {
    const rows = 10;
    const cols = 9;
    let bubbles = [];
    let current = 1;
    let next = 2;
    let points = 0;
    let aim = 4;
    let shots = 0;
    let tideLevel = 0;

    board.style.setProperty("--cols", cols);
    board.style.setProperty("--rows", rows + 1);

    function cluster(start, color, seen = new Set()) {
      if (start < 0 || start >= rows * cols || seen.has(start) || bubbles[start] !== color) return seen;
      seen.add(start);
      const x = start % cols;
      const neighbors = [start - cols, start + cols, x ? start - 1 : -1, x < cols - 1 ? start + 1 : -1];
      neighbors.forEach((i) => cluster(i, color, seen));
      return seen;
    }

    function tideDrops() {
      bubbles.splice((rows - 1) * cols, cols);
      bubbles.unshift(...Array.from({ length: cols }, () => 1 + Math.floor(Math.random() * 5)));
      tideLevel += 1;
      if (bubbles.slice((rows - 1) * cols).some(Boolean)) setStatus("Tide is high");
    }

    function shoot(col = aim) {
      let placedIndex = -1;
      let popped = 0;
      let tide = false;
      for (let r = rows - 1; r >= 0; r -= 1) {
        const i = r * cols + col;
        if (!bubbles[i]) {
          bubbles[i] = current;
          placedIndex = i;
          const group = cluster(i, current);
          if (group.size >= 3) {
            group.forEach((idx) => bubbles[idx] = 0);
            points += group.size * 12;
            popped = group.size;
            setStatus(`Pop ${group.size}`);
          }
          current = next;
          next = 1 + Math.floor(Math.random() * 5);
          shots += 1;
          if (shots % 5 === 0) {
            tide = true;
            tideDrops();
          }
          render();
          triggerCellEffect("bubble-shot", (rows * cols) + col, cols, rows + 1, { duration: 560 });
          if (popped) triggerCellEffect("bubble-pop", placedIndex, cols, rows + 1, { text: `×${popped}`, duration: 920 });
          if (tide) triggerBoardEffect("bubble-tide", { duration: 860 });
          return;
        }
      }
      setStatus("Column blocked");
      triggerCellEffect("bubble-block", (rows * cols) + col, cols, rows + 1, { duration: 520 });
    }

    function moveAim(delta) {
      aim = Math.max(0, Math.min(cols - 1, aim + delta));
      render();
    }

    function render() {
      board.innerHTML = "";
      bubbles.forEach((value) => {
        board.insertAdjacentHTML("beforeend", `<span class="bubble-cell ${value ? "is-filled" : ""}" style="${value ? `--cell:${colors[value]}` : ""}"></span>`);
      });
      for (let c = 0; c < cols; c += 1) {
        const b = cell(`bubble-launch ${c === aim ? "is-aim" : ""}`, c === aim ? "●" : "");
        b.style.setProperty("--cell", colors[current]);
        b.addEventListener("click", () => shoot(c));
        board.append(b);
      }
      const ray = document.createElement("span");
      ray.className = "bubble-aim-ray";
      ray.setAttribute("aria-hidden", "true");
      ray.style.setProperty("--aim", aim);
      ray.style.setProperty("--cols", cols);
      ray.style.setProperty("--aim-left", `${((aim + 0.5) / cols * 100).toFixed(2)}%`);
      ray.style.setProperty("--cell", colors[current]);
      board.append(ray);
      setScore(points);
      setMeta([`Next ${next}`, `Tide ${5 - (shots % 5)}`, `Rows ${tideLevel}`]);
    }

    function restart() {
      points = 0;
      shots = 0;
      tideLevel = 0;
      current = 1 + Math.floor(Math.random() * 5);
      next = 1 + Math.floor(Math.random() * 5);
      bubbles = Array.from({ length: rows * cols }, (_, i) => Math.floor(i / cols) < 3 ? 1 + Math.floor(Math.random() * 5) : 0);
      setStatus("Tap a lane");
      render();
    }

    button("重开", restart, true);
    restart();
    const offKey = keyHandler({ ArrowLeft: () => moveAim(-1), ArrowRight: () => moveAim(1), " ": () => shoot(), Enter: () => shoot() });
    return offKey;
  }

  function runSuika() {
    const rows = 9;
    const cols = 6;
    let grid = [];
    let next = 1;
    let points = 0;
    let aim = 2;
    let chainCombo = 0;
    let lastMergeIndex = -1;

    board.style.setProperty("--cols", cols);
    board.style.setProperty("--rows", rows);

    function settle() {
      for (let c = 0; c < cols; c += 1) {
        const stack = [];
        for (let r = rows - 1; r >= 0; r -= 1) if (grid[r][c]) stack.push(grid[r][c]);
        for (let r = rows - 1; r >= 0; r -= 1) grid[r][c] = stack[rows - 1 - r] || 0;
      }
    }

    function mergeOnce() {
      for (let r = rows - 1; r >= 0; r -= 1) for (let c = 0; c < cols; c += 1) {
        const value = grid[r][c];
        if (!value) continue;
        const pairs = [[r, c + 1], [r - 1, c]];
        const pair = pairs.find(([nr, nc]) => nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === value);
        if (pair) {
          const [nr, nc] = pair;
          grid[r][c] = Math.min(value + 1, fruitIcons.length - 1);
          grid[nr][nc] = 0;
          lastMergeIndex = r * cols + c;
          chainCombo += 1;
          points += grid[r][c] * 24 * chainCombo;
          settle();
          return true;
        }
      }
      return false;
    }

    function resolveChains() {
      chainCombo = 0;
      while (mergeOnce()) {
        if (chainCombo > 12) break;
      }
    }

    function drop(col) {
      const r = grid.findLastIndex((row) => !row[col]);
      if (r < 0) {
        setStatus("Orchard full");
        triggerCellEffect("suika-danger", col, cols, rows, { duration: 680 });
        return;
      }
      grid[r][col] = next;
      next = 1 + Math.floor(Math.random() * 3);
      settle();
      resolveChains();
      render();
      triggerCellEffect("suika-drop", r * cols + col, cols, rows, { duration: 620 });
      if (chainCombo) triggerCellEffect("suika-chain", lastMergeIndex, cols, rows, { text: `×${chainCombo}`, duration: 920 });
    }

    function moveAim(delta) {
      aim = Math.max(0, Math.min(cols - 1, aim + delta));
      render();
    }

    function render() {
      board.innerHTML = "";
      grid.flat().forEach((value, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const b = cell(`fruit-cell ${col === aim ? "is-aim" : ""} ${row <= 1 ? "is-danger" : ""}`, value ? fruitIcons[value] : "");
        if (value) b.style.setProperty("--cell", colors[value % colors.length]);
        b.addEventListener("click", () => drop(col));
        board.append(b);
      });
      const dropper = document.createElement("span");
      dropper.className = "fruit-dropper";
      dropper.setAttribute("aria-hidden", "true");
      dropper.style.setProperty("--aim", aim);
      dropper.style.setProperty("--cols", cols);
      dropper.style.setProperty("--aim-left", `${((aim + 0.5) / cols * 100).toFixed(2)}%`);
      dropper.textContent = fruitIcons[next];
      board.append(dropper);
      setScore(points);
      setStatus(chainCombo ? `Chain ×${chainCombo}` : `Next ${fruitIcons[next]}`);
      setMeta([`Next ${fruitIcons[next]}`, chainCombo ? `Chain ${chainCombo}` : "Find pairs", "Danger line"]);
    }

    function restart() {
      grid = Array.from({ length: rows }, () => Array(cols).fill(0));
      next = 1;
      points = 0;
      aim = 2;
      chainCombo = 0;
      render();
    }

    button("重开", restart, true);
    restart();
    return keyHandler({ ArrowLeft: () => moveAim(-1), ArrowRight: () => moveAim(1), " ": () => drop(aim), Enter: () => drop(aim), "1": () => drop(0), "2": () => drop(1), "3": () => drop(2), "4": () => drop(3), "5": () => drop(4), "6": () => drop(5) });
  }

  function runJump() {
    let platformRatio = 0.14;
    let targetRatio = 0.58;
    let power = 0;
    let points = 0;
    let streak = 0;
    let drift = 1;
    let charging = false;
    let chargeTimer = null;
    let driftTimer = null;

    function sceneWidth() {
      return Math.max(280, board.getBoundingClientRect().width || 560);
    }

    function clampRatio(value) {
      return Math.max(0.12, Math.min(0.88, value));
    }

    function ratioToX(value) {
      return Math.round(clampRatio(value) * sceneWidth());
    }

    function landingArc() {
      const jumpSpan = power / 145;
      return ratioToX(platformRatio + jumpSpan);
    }

    function render() {
      const landing = landingArc();
      const platform = ratioToX(platformRatio);
      const target = ratioToX(targetRatio);
      board.classList.toggle("is-charging", charging);
      board.innerHTML = `
        <div class="jump-scene">
          <div class="jump-stars"></div>
          <span class="jump-arc" style="--from:${platform}px;--to:${landing}px"></span>
          <span class="jump-player" style="left:${platform}px"></span>
          <span class="jump-target" style="left:${target}px"></span>
          <span class="jump-landing" style="left:${landing}px"></span>
          <span class="jump-power" style="width:${Math.min(100, power)}%"></span>
        </div>
      `;
      setScore(points);
      setStatus(charging ? `Power ${power}` : `Streak ${streak}`);
      setMeta(["Hold and release", `Drift ${drift > 0 ? "→" : "←"}`, `Streak ${streak}`]);
    }

    function startCharge() {
      charging = true;
      clearInterval(chargeTimer);
      chargeTimer = setInterval(() => {
        power = Math.min(120, power + 6);
        render();
      }, 70);
    }

    function jump() {
      if (!charging && !power) return;
      clearInterval(chargeTimer);
      const hit = Math.abs((platformRatio + power / 145) - targetRatio) < 0.08;
      streak = hit ? streak + 1 : 0;
      points = hit ? points + 10 + streak * 4 : Math.max(0, points - 5);
      platformRatio = hit ? targetRatio : 0.14;
      targetRatio = hit ? 0.34 + Math.random() * 0.42 : 0.58;
      power = 0;
      charging = false;
      setStatus(hit ? "Clean landing" : "Missed");
      render();
      triggerBoardEffect(hit ? "lunar-hit" : "lunar-miss", { duration: 780 });
    }

    function driftTarget() {
      targetRatio += drift * (0.003 + Math.min(streak, 6) * 0.00045);
      if (targetRatio > 0.86 || targetRatio < 0.28) drift *= -1;
      targetRatio = clampRatio(targetRatio);
      render();
    }

    function restart() {
      platformRatio = 0.14;
      targetRatio = 0.58;
      power = 0;
      points = 0;
      streak = 0;
      drift = 1;
      charging = false;
      render();
    }

    button("重开", restart, true);
    board.addEventListener("pointerdown", startCharge);
    board.addEventListener("pointerup", jump);
    board.addEventListener("pointercancel", jump);
    driftTimer = setInterval(driftTarget, 140);
    render();
    const offKey = keyHandler({ " ": () => charging ? jump() : startCharge(), Enter: jump });
    return () => {
      clearInterval(chargeTimer);
      clearInterval(driftTimer);
      board.removeEventListener("pointerdown", startCharge);
      board.removeEventListener("pointerup", jump);
      board.removeEventListener("pointercancel", jump);
      offKey();
    };
  }

  function runTower() {
    const cols = 10;
    const rows = 7;
    const path = [30, 31, 32, 33, 23, 13, 14, 15, 16, 26, 36, 46, 47, 48, 49];
    const towerTypes = {
      cannon: { label: "A", cost: 24, range: 2, damage: 2 },
      frost: { label: "F", cost: 18, range: 2, damage: 1 }
    };
    let selectedType = "cannon";
    let towers = new Map();
    let enemies = [];
    let lives = 10;
    let coins = 74;
    let wave = 0;
    let lastShots = [];

    board.style.setProperty("--cols", cols);
    board.style.setProperty("--rows", rows);

    function place(i) {
      if (path.includes(i) || towers.has(i)) return;
      const type = towerTypes[selectedType];
      if (coins < type.cost) {
        setStatus("Not enough coins");
        return;
      }
      towers.set(i, selectedType);
      coins -= type.cost;
      render();
      triggerCellEffect(selectedType === "frost" ? "tower-frost" : "tower-build", i, cols, rows, { duration: 660 });
    }

    function spawn() {
      wave += 1;
      for (let i = 0; i < 4 + wave; i += 1) enemies.push({ step: -i * 2, hp: 4 + wave, slow: 0 });
      setStatus(`Wave ${wave}`);
      render();
      triggerBoardEffect("tower-wave", { duration: 820 });
    }

    function tick() {
      lastShots = [];
      enemies.forEach((enemy) => {
        if (enemy.slow > 0) enemy.slow -= 1;
        else enemy.step += 1;
      });
      enemies = enemies.filter((enemy) => {
        if (enemy.step >= path.length) {
          lives -= 1;
          return false;
        }
        return enemy.hp > 0;
      });
      towers.forEach((typeName, tower) => {
        const type = towerTypes[typeName];
        const tx = tower % cols;
        const ty = Math.floor(tower / cols);
        const targetEnemy = enemies.find((enemy) => {
          const pos = path[enemy.step];
          if (pos === undefined) return false;
          return Math.abs(pos % cols - tx) + Math.abs(Math.floor(pos / cols) - ty) <= type.range;
        });
        if (targetEnemy) {
          const targetPos = path[targetEnemy.step];
          const fromX = ((tower % cols) + 0.5) / cols * 100;
          const fromY = (Math.floor(tower / cols) + 0.5) / rows * 100;
          const toX = ((targetPos % cols) + 0.5) / cols * 100;
          const toY = (Math.floor(targetPos / cols) + 0.5) / rows * 100;
          lastShots.push({
            from: tower,
            to: targetPos,
            type: typeName,
            x1: fromX,
            y1: fromY,
            x2: toX,
            y2: toY,
            len: Math.hypot(toX - fromX, toY - fromY),
            angle: Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI
          });
          targetEnemy.hp -= type.damage;
          if (typeName === "frost") targetEnemy.slow = 1;
          if (targetEnemy.hp <= 0) coins += typeName === "frost" ? 7 : 9;
        }
      });
      if (lives <= 0) setStatus("Base lost");
      render();
      if (lastShots.length) triggerBoardEffect("tower-volley", { duration: 680 });
    }

    function render() {
      const enemyCells = new Map(enemies.filter((e) => path[e.step] !== undefined).map((e) => [path[e.step], e]));
      board.innerHTML = "";
      for (let i = 0; i < cols * rows; i += 1) {
        const enemy = enemyCells.get(i);
        const typeName = towers.get(i);
        const classes = [
          "tower-cell",
          path.includes(i) ? "is-path" : "",
          typeName ? `is-tower is-${typeName}` : "",
          enemy ? "is-enemy" : ""
        ].filter(Boolean).join(" ");
        const label = typeName ? towerTypes[typeName].label : enemy ? Math.max(1, enemy.hp) : "";
        const b = cell(classes, label);
        b.addEventListener("click", () => place(i));
        board.append(b);
      }
      lastShots.forEach((shot) => {
        const fx = document.createElement("span");
        fx.className = `tower-projectile is-${shot.type}`;
        fx.setAttribute("aria-hidden", "true");
        fx.style.setProperty("--x1", `${shot.x1}%`);
        fx.style.setProperty("--y1", `${shot.y1}%`);
        fx.style.setProperty("--x2", `${shot.x2}%`);
        fx.style.setProperty("--y2", `${shot.y2}%`);
        fx.style.setProperty("--len", `${shot.len}%`);
        fx.style.setProperty("--angle", `${shot.angle}deg`);
        board.append(fx);
      });
      setScore(`${coins}/${lives}`);
      setMeta([`Mode ${selectedType}`, `Wave ${wave}`, `Lives ${lives}`]);
    }

    function restart() {
      selectedType = "cannon";
      towers = new Map();
      enemies = [];
      lastShots = [];
      lives = 10;
      coins = 74;
      wave = 0;
      setStatus("Place towers");
      render();
    }

    button("炮塔", () => { selectedType = "cannon"; setStatus("Cannon selected"); render(); }, true);
    button("冰塔", () => { selectedType = "frost"; setStatus("Frost selected"); render(); });
    button("出怪", spawn);
    button("重开", restart);
    restart();
    const timer = setInterval(tick, 760);
    return () => clearInterval(timer);
  }

  function runCards() {
    let hp = 36;
    let shield = 0;
    let enemy = 34;
    let enemyAtk = 7;
    let energyCards = 3;
    let points = 0;
    let round = 1;
    let hand = [];
    const deck = [
      { name: "Pulse", cost: 1, type: "attack", text: "6 dmg", play: () => { enemy -= 6; points += 6; } },
      { name: "Shield", cost: 1, type: "guard", text: "7 block", play: () => { shield += 7; } },
      { name: "Repair", cost: 1, type: "tech", text: "+5 hp", play: () => { hp = Math.min(36, hp + 5); } },
      { name: "Lance", cost: 2, type: "attack", text: "13 dmg", play: () => { enemy -= 13; points += 13; } },
      { name: "Overclock", cost: 0, type: "tech", text: "+1 energy", play: () => { energyCards += 1; points += 2; } },
      { name: "Jam", cost: 1, type: "guard", text: "-3 intent", play: () => { enemyAtk = Math.max(2, enemyAtk - 3); } }
    ];

    function draw(count = 4) {
      hand = Array.from({ length: count }, () => deck[Math.floor(Math.random() * deck.length)]);
      shield = 0;
      energyCards = 3;
      render();
    }

    function nextEnemy() {
      enemy = 26 + round * 5;
      enemyAtk = 6 + Math.floor(round * 1.5);
      round += 1;
    }

    function enemyTurn() {
      if (hp <= 0) return;
      hp -= Math.max(0, enemyAtk - shield);
      if (enemy <= 0) {
        points += 28 + round * 4;
        nextEnemy();
      } else {
        enemyAtk += Math.random() > 0.55 ? 2 : 0;
      }
      if (hp <= 0) setStatus("Ship disabled");
      draw();
      triggerBoardEffect("card-hit", { duration: 760 });
    }

    function play(i) {
      const cardItem = hand[i];
      if (!cardItem || hp <= 0) return;
      if (cardItem.cost > energyCards) {
        setStatus("Not enough energy");
        return;
      }
      energyCards -= cardItem.cost;
      cardItem.play();
      hand.splice(i, 1);
      if (enemy <= 0) {
        points += 28 + round * 4;
        nextEnemy();
        draw(5);
        setStatus("Enemy down");
        triggerBoardEffect("card-burst", { duration: 860 });
      } else {
        render();
        triggerBoardEffect("card-play", { duration: 640 });
      }
    }

    function render() {
      board.innerHTML = `
        <div class="starfield"></div>
        <div class="card-battle">
          <div class="ship-panel"><span>Hull</span><strong>${hp}</strong><small>Shield ${shield}</small></div>
          <div class="enemy-panel"><span>Hostile</span><strong>${Math.max(0, enemy)}</strong><small>Intent ${enemyAtk}</small></div>
          <div class="energy-panel"><span>Energy</span><strong>${energyCards}</strong><small>Round ${round}</small></div>
        </div>
        <div class="card-hand"></div>
      `;
      const handBox = board.querySelector(".card-hand");
      hand.forEach((cardItem, i) => {
        const b = cell(`rogue-card is-${cardItem.type}`, "");
        b.innerHTML = `<span>${cardItem.cost}</span><strong>${escapeText(cardItem.name)}</strong><small>${escapeText(cardItem.text)}</small>`;
        b.addEventListener("click", () => play(i));
        handBox.append(b);
      });
      setScore(points);
      setStatus(hp <= 0 ? "Ship disabled" : `Intent ${enemyAtk}`);
      setMeta([`Energy ${energyCards}`, `Shield ${shield}`, `Round ${round}`]);
    }

    button("结束回合", enemyTurn, true);
    button("重开", () => { hp = 36; shield = 0; enemy = 34; enemyAtk = 7; points = 0; round = 1; draw(); });
    draw();
    return () => {};
  }
}
