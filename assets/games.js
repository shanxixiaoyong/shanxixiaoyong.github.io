const gameHub = document.querySelector("#game-hub");

if (gameHub) {
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
      name: "熔核 2048",
      kind: "Numbers",
      theme: "ember-2048",
      boardClass: "board-ember-2048",
      tagline: "连续合并会升温，满能量可触发一次淬火。",
      feature: "Streak / Heat / Temper",
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
    menu.querySelectorAll("button").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.game === game.id);
    });
    cleanup = game.run();
    board.focus({ preventScroll: true });
  }

  games.forEach((game) => {
    const item = document.createElement("button");
    item.type = "button";
    item.dataset.game = game.id;
    item.innerHTML = `<span>${escapeText(game.kind)}</span><strong>${escapeText(game.name)}</strong><em>${escapeText(game.feature)}</em>`;
    item.addEventListener("click", () => resetStage(game));
    menu.append(item);
  });

  resetStage(games[0]);

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
      if (locks % 6 === 0) applySurge();
      piece = nextPiece;
      nextPiece = makePiece();
      holdUsed = false;
      if (collides(piece)) {
        over = true;
        setStatus("Game Over");
      }
      render();
    }

    function hardDrop() {
      if (over || paused) return;
      while (move(0, 1)) points += 2;
      render();
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
    let heat = 0;
    let mergeStreak = 0;
    let temperReady = false;

    board.style.setProperty("--cols", size);
    board.style.setProperty("--rows", size);

    function add(value = Math.random() > 0.88 ? 4 : 2) {
      const empty = tiles.map((v, i) => v ? -1 : i).filter((i) => i >= 0);
      if (!empty.length) return;
      tiles[empty[Math.floor(Math.random() * empty.length)]] = value;
    }

    function slideLine(line) {
      const values = line.filter(Boolean);
      let merged = 0;
      for (let i = 0; i < values.length - 1; i += 1) {
        if (values[i] === values[i + 1]) {
          values[i] *= 2;
          merged += values[i];
          values.splice(i + 1, 1);
        }
      }
      while (values.length < size) values.push(0);
      return { values, merged };
    }

    function move(dir) {
      const before = tiles.join(",");
      let mergedThisMove = 0;
      for (let i = 0; i < size; i += 1) {
        const line = [];
        for (let j = 0; j < size; j += 1) {
          const idx = dir === "left" || dir === "right" ? i * size + j : j * size + i;
          line.push(tiles[idx]);
        }
        const input = dir === "right" || dir === "down" ? line.reverse() : line;
        const shifted = slideLine(input);
        const result = dir === "right" || dir === "down" ? shifted.values.reverse() : shifted.values;
        mergedThisMove += shifted.merged;
        for (let j = 0; j < size; j += 1) {
          const idx = dir === "left" || dir === "right" ? i * size + j : j * size + i;
          tiles[idx] = result[j];
        }
      }
      if (tiles.join(",") !== before) {
        if (mergedThisMove) {
          mergeStreak += 1;
          heat = Math.min(100, heat + 18 + mergeStreak * 5);
          points += Math.round(mergedThisMove * (1 + Math.min(mergeStreak, 5) * 0.18));
          if (heat >= 100) temperReady = true;
        } else {
          mergeStreak = 0;
          heat = Math.max(0, heat - 8);
        }
        add();
      }
      render();
    }

    function temper() {
      if (!temperReady) return;
      const small = tiles
        .map((value, index) => ({ value, index }))
        .filter((item) => item.value)
        .sort((a, b) => a.value - b.value)[0];
      if (small) {
        tiles[small.index] *= 2;
        points += tiles[small.index];
      }
      heat = 0;
      temperReady = false;
      setStatus("Tempered lowest tile");
      render();
    }

    function render() {
      board.innerHTML = tiles.map((value) => {
        const hot = value && value >= 128 ? "is-hot" : "";
        return `<span class="merge-cell v${value || 0} ${hot}" data-value="${value || ""}">${value || ""}</span>`;
      }).join("");
      setScore(points);
      setStatus(temperReady ? "Heat full · tap Temper" : `Heat ${heat}%`);
      setMeta([`Streak ${mergeStreak}`, `Heat ${heat}%`, temperReady ? "Temper ready" : "Build heat"]);
    }

    function restart() {
      tiles = Array(size * size).fill(0);
      points = 0;
      heat = 0;
      mergeStreak = 0;
      temperReady = false;
      add();
      add();
      render();
    }

    button("淬火", temper, true);
    button("重开", restart);
    restart();
    const offKey = keyHandler({ ArrowLeft: () => move("left"), ArrowRight: () => move("right"), ArrowUp: () => move("up"), ArrowDown: () => move("down"), " ": temper });
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

    function reveal(i) {
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
        neighbors(i).forEach(reveal);
      }
      if (!ended && cells.filter((c) => !c.mine && c.open).length === width * width - mineCount) {
        ended = true;
        setStatus("Field clear");
      }
      render();
    }

    function toggleFlag(i) {
      if (ended || cells[i].open) return;
      cells[i].flag = !cells[i].flag;
      render();
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
        b.addEventListener("click", () => { selected = i; render(); });
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
    }

    function select(dx, dy) {
      const x = selected % 9;
      const y = Math.floor(selected / 9);
      selected = Math.max(0, Math.min(8, y + dy)) * 9 + Math.max(0, Math.min(8, x + dx));
      render();
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
        return;
      }
      snake.unshift(next);
      if (next === food.index) {
        combo += 1;
        points += food.pulse ? 25 + combo * 4 : 10 + combo * 2;
        placeFood();
      } else {
        combo = Math.max(0, combo - 1);
        snake.pop();
      }
      render();
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
        const classes = [
          "snake-cell",
          set.has(i) ? "is-snake" : "",
          snake[0] === i ? "is-head" : "",
          food.index === i ? "is-food" : "",
          food.index === i && food.pulse ? "is-pulse-food" : "",
          edge ? "is-portal" : ""
        ].filter(Boolean).join(" ");
        return `<span class="${classes}"></span>`;
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
      for (let r = rows - 1; r >= 0; r -= 1) {
        const i = r * cols + col;
        if (!bubbles[i]) {
          bubbles[i] = current;
          const group = cluster(i, current);
          if (group.size >= 3) {
            group.forEach((idx) => bubbles[idx] = 0);
            points += group.size * 12;
            setStatus(`Pop ${group.size}`);
          }
          current = next;
          next = 1 + Math.floor(Math.random() * 5);
          shots += 1;
          if (shots % 5 === 0) tideDrops();
          render();
          return;
        }
      }
      setStatus("Column blocked");
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
        return;
      }
      grid[r][col] = next;
      next = 1 + Math.floor(Math.random() * 3);
      settle();
      resolveChains();
      render();
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
      board.innerHTML = `
        <div class="jump-scene">
          <div class="jump-stars"></div>
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
    }

    function spawn() {
      wave += 1;
      for (let i = 0; i < 4 + wave; i += 1) enemies.push({ step: -i * 2, hp: 4 + wave, slow: 0 });
      setStatus(`Wave ${wave}`);
      render();
    }

    function tick() {
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
          targetEnemy.hp -= type.damage;
          if (typeName === "frost") targetEnemy.slow = 1;
          if (targetEnemy.hp <= 0) coins += typeName === "frost" ? 7 : 9;
        }
      });
      if (lives <= 0) setStatus("Base lost");
      render();
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
      setScore(`${coins}/${lives}`);
      setMeta([`Mode ${selectedType}`, `Wave ${wave}`, `Lives ${lives}`]);
    }

    function restart() {
      selectedType = "cannon";
      towers = new Map();
      enemies = [];
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
      } else {
        render();
      }
    }

    function render() {
      board.innerHTML = `
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
