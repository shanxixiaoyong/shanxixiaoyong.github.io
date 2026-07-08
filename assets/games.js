const gameHub = document.querySelector("#game-hub");

if (gameHub) {
  const menu = document.querySelector("#game-menu");
  const title = document.querySelector("#game-title");
  const kind = document.querySelector("#game-kind");
  const score = document.querySelector("#game-score");
  const status = document.querySelector("#game-status");
  const board = document.querySelector("#game-board");
  const controls = document.querySelector("#game-controls");
  const meta = document.querySelector("#game-meta");
  const touchPad = document.querySelector("#touch-pad");
  let cleanup = () => {};
  let activeId = "";
  let touchActions = {};
  let metaItems = [];

  const games = [
    { id: "tetris", name: "俄罗斯方块", kind: "Blocks", run: runTetris },
    { id: "merge2048", name: "2048", kind: "Numbers", run: run2048 },
    { id: "mines", name: "扫雷", kind: "Logic", run: runMines },
    { id: "sudoku", name: "数独", kind: "Logic", run: runSudoku },
    { id: "snake", name: "贪吃蛇", kind: "Arcade", run: runSnake },
    { id: "bubble", name: "泡泡龙", kind: "Shooter", run: runBubble },
    { id: "suika", name: "合成大西瓜", kind: "Merge", run: runSuika },
    { id: "jump", name: "跳一跳", kind: "Timing", run: runJump },
    { id: "tower", name: "塔防", kind: "Strategy", run: runTower },
    { id: "cards", name: "肉鸽卡牌", kind: "Cards", run: runCards }
  ];

  const colors = ["#2f6b58", "#315f8a", "#9a6a42", "#6b7d43", "#8c4f64", "#5a6f96", "#b27d40"];

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

  function escapeText(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function setTouchActions(actions = {}) {
    touchActions = actions;
    touchPad?.querySelectorAll("button").forEach((item) => {
      item.disabled = !touchActions[item.dataset.touch];
      item.classList.toggle("is-disabled", item.disabled);
    });
  }

  touchPad?.addEventListener("pointerdown", (event) => {
    const item = event.target.closest("button[data-touch]");
    if (!item || item.disabled) return;
    event.preventDefault();
    touchActions[item.dataset.touch]?.();
  });

  function enableSwipe(actions) {
    let startX = 0;
    let startY = 0;
    const down = (event) => {
      startX = event.clientX;
      startY = event.clientY;
    };
    const up = (event) => {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
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

  function interval(fn, ms) {
    const id = setInterval(fn, ms);
    return () => clearInterval(id);
  }

  function resetStage(game) {
    cleanup();
    cleanup = () => {};
    activeId = game.id;
    title.textContent = game.name;
    kind.textContent = game.kind;
    setScore(0);
    setStatus("");
    setMeta([]);
    setTouchActions({});
    board.innerHTML = "";
    controls.innerHTML = "";
    board.className = `arcade-board is-${game.id}`;
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
    item.innerHTML = `<span>${game.kind}</span><strong>${game.name}</strong>`;
    item.addEventListener("click", () => resetStage(game));
    menu.append(item);
  });

  resetStage(games[0]);

  function runTetris() {
    const width = 10;
    const height = 20;
    const shapes = [
      [[1, 1, 1, 1]],
      [[1, 1], [1, 1]],
      [[0, 1, 0], [1, 1, 1]],
      [[1, 0, 0], [1, 1, 1]],
      [[0, 0, 1], [1, 1, 1]],
      [[1, 1, 0], [0, 1, 1]],
      [[0, 1, 1], [1, 1, 0]]
    ];
    let grid = Array.from({ length: height }, () => Array(width).fill(0));
    let piece;
    let points = 0;
    let over = false;
    let paused = false;

    board.style.setProperty("--cols", width);
    board.style.setProperty("--rows", height);

    function makePiece() {
      const shape = shapes[Math.floor(Math.random() * shapes.length)].map((row) => [...row]);
      return { shape, x: 3, y: 0, color: 1 + Math.floor(Math.random() * colors.length) };
    }

    function collides(next) {
      return next.shape.some((row, y) => row.some((value, x) => {
        if (!value) return false;
        const nx = next.x + x;
        const ny = next.y + y;
        return nx < 0 || nx >= width || ny >= height || (ny >= 0 && grid[ny][nx]);
      }));
    }

    function rotate() {
      const shape = piece.shape[0].map((_, x) => piece.shape.map((row) => row[x]).reverse());
      const next = { ...piece, shape };
      if (!collides(next)) piece = next;
      render();
    }

    function move(dx, dy) {
      const next = { ...piece, x: piece.x + dx, y: piece.y + dy };
      if (!collides(next)) {
        piece = next;
        render();
        return true;
      }
      if (dy) lock();
      return false;
    }

    function lock() {
      piece.shape.forEach((row, y) => row.forEach((value, x) => {
        if (value && piece.y + y >= 0) grid[piece.y + y][piece.x + x] = piece.color;
      }));
      grid = grid.filter((row) => row.some((value) => !value));
      const cleared = height - grid.length;
      while (grid.length < height) grid.unshift(Array(width).fill(0));
      points += cleared ? [0, 100, 300, 500, 800][cleared] : 10;
      piece = makePiece();
      if (collides(piece)) {
        over = true;
        setStatus("Game Over");
      }
      render();
    }

    function render() {
      const view = grid.map((row) => [...row]);
      piece.shape.forEach((row, y) => row.forEach((value, x) => {
        if (value && piece.y + y >= 0) view[piece.y + y][piece.x + x] = piece.color;
      }));
      board.innerHTML = view.flat().map((value) => `<span class="arcade-cell" style="${value ? `--cell:${colors[value - 1]}` : ""}"></span>`).join("");
      setScore(points);
    }

    function tick() {
      if (!over && !paused) move(0, 1);
    }

    function restart() {
      grid = Array.from({ length: height }, () => Array(width).fill(0));
      points = 0;
      over = false;
      paused = false;
      piece = makePiece();
      setStatus("Swipe / Tap");
      setMeta(["Swipe", "Rotate", "Drop"]);
      render();
    }

    function pause() {
      paused = !paused;
      setStatus(paused ? "Paused" : "Swipe / Tap");
    }

    button("左", () => move(-1, 0));
    button("旋转", rotate, true);
    button("右", () => move(1, 0));
    button("下落", () => move(0, 1));
    button("暂停", pause);
    button("重开", restart);
    restart();
    setTouchActions({ left: () => move(-1, 0), right: () => move(1, 0), down: () => move(0, 1), up: rotate, action: rotate });
    const offKey = keyHandler({ ArrowLeft: () => move(-1, 0), ArrowRight: () => move(1, 0), ArrowDown: () => move(0, 1), ArrowUp: rotate, " ": pause });
    const offSwipe = enableSwipe({ left: () => move(-1, 0), right: () => move(1, 0), down: () => move(0, 1), up: rotate });
    const offTimer = interval(tick, 560);
    return () => { offKey(); offSwipe(); offTimer(); };
  }

  function run2048() {
    const size = 4;
    let tiles = [];
    let points = 0;
    board.style.setProperty("--cols", size);
    board.style.setProperty("--rows", size);

    function add() {
      const empty = tiles.map((v, i) => v ? -1 : i).filter((i) => i >= 0);
      if (!empty.length) return;
      tiles[empty[Math.floor(Math.random() * empty.length)]] = Math.random() > 0.88 ? 4 : 2;
    }

    function slideLine(line) {
      const values = line.filter(Boolean);
      for (let i = 0; i < values.length - 1; i += 1) {
        if (values[i] === values[i + 1]) {
          values[i] *= 2;
          points += values[i];
          values.splice(i + 1, 1);
        }
      }
      while (values.length < size) values.push(0);
      return values;
    }

    function move(dir) {
      const before = tiles.join(",");
      for (let i = 0; i < size; i += 1) {
        const line = [];
        for (let j = 0; j < size; j += 1) {
          const idx = dir === "left" || dir === "right" ? i * size + j : j * size + i;
          line.push(tiles[idx]);
        }
        const shifted = slideLine(dir === "right" || dir === "down" ? line.reverse() : line);
        const result = dir === "right" || dir === "down" ? shifted.reverse() : shifted;
        for (let j = 0; j < size; j += 1) {
          const idx = dir === "left" || dir === "right" ? i * size + j : j * size + i;
          tiles[idx] = result[j];
        }
      }
      if (tiles.join(",") !== before) add();
      render();
    }

    function render() {
      board.innerHTML = tiles.map((value) => `<span class="merge-cell v${value || 0}">${value || ""}</span>`).join("");
      setScore(points);
    }

    function restart() {
      tiles = Array(size * size).fill(0);
      points = 0;
      add();
      add();
      setStatus("Swipe");
      setMeta(["Swipe", "Merge", "Best saved"]);
      render();
    }

    button("左", () => move("left"));
    button("上", () => move("up"), true);
    button("下", () => move("down"));
    button("右", () => move("right"));
    button("重开", restart);
    restart();
    setTouchActions({ left: () => move("left"), right: () => move("right"), up: () => move("up"), down: () => move("down") });
    const offKey = keyHandler({ ArrowLeft: () => move("left"), ArrowRight: () => move("right"), ArrowUp: () => move("up"), ArrowDown: () => move("down") });
    const offSwipe = enableSwipe({ left: () => move("left"), right: () => move("right"), up: () => move("up"), down: () => move("down") });
    return () => { offKey(); offSwipe(); };
  }

  function runMines() {
    const width = 9;
    const mines = 10;
    let cells = [];
    let flagMode = false;
    let ended = false;
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

    function reveal(i) {
      if (ended || cells[i].open || cells[i].flag) return;
      cells[i].open = true;
      if (cells[i].mine) {
        ended = true;
        cells.forEach((c) => { if (c.mine) c.open = true; });
        setStatus("Boom");
      } else if (!cells[i].near) {
        neighbors(i).forEach(reveal);
      }
      render();
    }

    function click(i) {
      if (flagMode) cells[i].flag = !cells[i].flag;
      else reveal(i);
      if (!ended && cells.filter((c) => !c.mine && c.open).length === width * width - mines) {
        ended = true;
        setStatus("Clear");
      }
      render();
    }

    function render() {
      board.innerHTML = "";
      cells.forEach((item, i) => {
        const b = cell(`mine-cell ${item.open ? "is-open" : ""}`, item.open ? (item.mine ? "×" : item.near || "") : item.flag ? "⚑" : "");
        b.addEventListener("click", () => click(i));
        board.append(b);
      });
      setScore(cells.filter((c) => c.flag).length);
    }

    function restart() {
      ended = false;
      cells = Array.from({ length: width * width }, () => ({ mine: false, open: false, flag: false, near: 0 }));
      let placed = 0;
      while (placed < mines) {
        const i = Math.floor(Math.random() * cells.length);
        if (!cells[i].mine) {
          cells[i].mine = true;
          placed += 1;
        }
      }
      cells.forEach((c, i) => c.near = neighbors(i).filter((n) => cells[n].mine).length);
      setStatus("扫雷");
      setMeta(["Tap open", "Action flag", `${mines} mines`]);
      render();
    }

    button("翻开", () => { flagMode = false; setStatus("翻开"); }, true);
    button("旗子", () => { flagMode = true; setStatus("旗子"); });
    button("重开", restart);
    restart();
    setTouchActions({ action: () => { flagMode = !flagMode; setStatus(flagMode ? "旗子" : "翻开"); } });
    return () => {};
  }

  function runSudoku() {
    const puzzle = "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const answer = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";
    let values = puzzle.split("").map(Number);
    let selected = 0;
    board.style.setProperty("--cols", 9);
    board.style.setProperty("--rows", 9);

    function render() {
      board.innerHTML = "";
      values.forEach((value, i) => {
        const fixed = puzzle[i] !== "0";
        const b = cell(`sudoku-cell ${fixed ? "is-fixed" : ""} ${selected === i ? "is-selected" : ""}`, value || "");
        b.addEventListener("click", () => { selected = i; render(); });
        board.append(b);
      });
      setScore(values.filter(Boolean).length);
      if (values.join("") === answer) setStatus("Solved");
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
    button("重开", () => { values = puzzle.split("").map(Number); selected = 0; setStatus("数独"); render(); });
    setStatus("数独");
    setMeta(["Select", "Number pad", "Classic"]);
    render();
    setTouchActions({ left: () => select(-1, 0), right: () => select(1, 0), up: () => select(0, -1), down: () => select(0, 1), action: () => put(0) });
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
    const size = 16;
    let snake;
    let dir;
    let food;
    let points;
    let dead;
    let paused;
    board.style.setProperty("--cols", size);
    board.style.setProperty("--rows", size);

    function placeFood() {
      do food = Math.floor(Math.random() * size * size);
      while (snake.includes(food));
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
      const next = dir === "left" ? head - 1 : dir === "right" ? head + 1 : dir === "up" ? head - size : head + size;
      if ((dir === "left" && x === 0) || (dir === "right" && x === size - 1) || (dir === "up" && y === 0) || (dir === "down" && y === size - 1) || snake.includes(next)) {
        dead = true;
        setStatus("Game Over");
        return;
      }
      snake.unshift(next);
      if (next === food) {
        points += 10;
        placeFood();
      } else {
        snake.pop();
      }
      render();
    }

    function render() {
      const set = new Set(snake);
      board.innerHTML = Array.from({ length: size * size }, (_, i) => `<span class="snake-cell ${set.has(i) ? "is-snake" : i === food ? "is-food" : ""}"></span>`).join("");
      setScore(points);
    }

    function restart() {
      snake = [34, 33, 32];
      dir = "right";
      points = 0;
      dead = false;
      paused = false;
      placeFood();
      setStatus("Swipe");
      setMeta(["Swipe", "Food +10", "No walls"]);
      render();
    }

    function pause() {
      paused = !paused;
      setStatus(paused ? "Paused" : "Swipe");
    }

    button("左", () => turn("left"));
    button("上", () => turn("up"), true);
    button("下", () => turn("down"));
    button("右", () => turn("right"));
    button("暂停", pause);
    button("重开", restart);
    restart();
    setTouchActions({ left: () => turn("left"), right: () => turn("right"), up: () => turn("up"), down: () => turn("down"), action: pause });
    const offKey = keyHandler({ ArrowLeft: () => turn("left"), ArrowRight: () => turn("right"), ArrowUp: () => turn("up"), ArrowDown: () => turn("down"), " ": pause });
    const offSwipe = enableSwipe({ left: () => turn("left"), right: () => turn("right"), up: () => turn("up"), down: () => turn("down") });
    const offTimer = interval(tick, 180);
    return () => { offKey(); offSwipe(); offTimer(); };
  }

  function runBubble() {
    const rows = 9;
    const cols = 9;
    let bubbles = [];
    let current = 0;
    let points = 0;
    let aim = 4;
    board.style.setProperty("--cols", cols);
    board.style.setProperty("--rows", rows + 1);

    function cluster(start, color, seen = new Set()) {
      if (start < 0 || start >= rows * cols || seen.has(start) || bubbles[start] !== color) return seen;
      seen.add(start);
      const x = start % cols;
      const n = [start - cols, start + cols, x ? start - 1 : -1, x < cols - 1 ? start + 1 : -1];
      n.forEach((i) => cluster(i, color, seen));
      return seen;
    }

    function shoot(col = aim) {
      for (let r = rows - 1; r >= 0; r -= 1) {
        const i = r * cols + col;
        if (!bubbles[i]) {
          bubbles[i] = current;
          const group = cluster(i, current);
          if (group.size >= 3) {
            group.forEach((idx) => bubbles[idx] = 0);
            points += group.size * 10;
          }
          current = 1 + Math.floor(Math.random() * 5);
          render();
          return;
        }
      }
      setStatus("Blocked");
    }

    function moveAim(delta) {
      aim = Math.max(0, Math.min(cols - 1, aim + delta));
      render();
    }

    function render() {
      board.innerHTML = "";
      bubbles.forEach((value) => board.insertAdjacentHTML("beforeend", `<span class="bubble-cell" style="${value ? `--cell:${colors[value]}` : ""}"></span>`));
      for (let c = 0; c < cols; c += 1) {
        const b = cell(`bubble-launch ${c === aim ? "is-aim" : ""}`, c === aim ? "●" : "");
        b.style.setProperty("--cell", colors[current]);
        b.addEventListener("click", () => shoot(c));
        board.append(b);
      }
      setScore(points);
      setStatus(`Aim ${aim + 1}`);
      setMeta(["Match 3", "Aim", "Shoot"]);
    }

    function restart() {
      points = 0;
      current = 1 + Math.floor(Math.random() * 5);
      bubbles = Array.from({ length: rows * cols }, (_, i) => Math.floor(i / cols) < 3 ? 1 + Math.floor(Math.random() * 5) : 0);
      render();
    }

    button("左", () => moveAim(-1));
    button("发射", () => shoot(), true);
    button("右", () => moveAim(1));
    button("重开", restart);
    restart();
    setTouchActions({ left: () => moveAim(-1), right: () => moveAim(1), action: () => shoot() });
    return keyHandler({ ArrowLeft: () => moveAim(-1), ArrowRight: () => moveAim(1), " ": () => shoot(), Enter: () => shoot() });
  }

  function runSuika() {
    const rows = 9;
    const cols = 6;
    let grid = [];
    let next = 1;
    let points = 0;
    let aim = 2;
    board.style.setProperty("--cols", cols);
    board.style.setProperty("--rows", rows);

    function settle() {
      for (let c = 0; c < cols; c += 1) {
        const stack = [];
        for (let r = rows - 1; r >= 0; r -= 1) if (grid[r][c]) stack.push(grid[r][c]);
        for (let r = rows - 1; r >= 0; r -= 1) grid[r][c] = stack[rows - 1 - r] || 0;
      }
    }

    function merge() {
      let changed = false;
      for (let r = rows - 1; r > 0; r -= 1) for (let c = 0; c < cols; c += 1) {
        if (grid[r][c] && grid[r][c] === grid[r - 1][c]) {
          grid[r][c] += 1;
          grid[r - 1][c] = 0;
          points += grid[r][c] * 20;
          changed = true;
        }
      }
      if (changed) {
        settle();
        merge();
      }
    }

    function drop(col) {
      const r = grid.findLastIndex((row) => !row[col]);
      if (r < 0) {
        setStatus("Full");
        return;
      }
      grid[r][col] = next;
      next = 1 + Math.floor(Math.random() * 3);
      merge();
      render();
    }

    function moveAim(delta) {
      aim = Math.max(0, Math.min(cols - 1, aim + delta));
      render();
    }

    function render() {
      board.innerHTML = "";
      grid.flat().forEach((value, index) => board.insertAdjacentHTML("beforeend", `<button class="fruit-cell ${index % cols === aim ? "is-aim" : ""}" style="${value ? `--cell:${colors[value % colors.length]}` : ""}">${value ? "●" : ""}</button>`));
      board.querySelectorAll(".fruit-cell").forEach((item, i) => item.addEventListener("click", () => drop(i % cols)));
      setScore(points);
      setStatus(`Next ${next} · Col ${aim + 1}`);
      setMeta(["Merge", "Drop", "Chain"]);
    }

    function restart() {
      grid = Array.from({ length: rows }, () => Array(cols).fill(0));
      points = 0;
      next = 1;
      aim = 2;
      render();
    }

    button("左", () => moveAim(-1));
    button("投放", () => drop(aim), true);
    button("右", () => moveAim(1));
    button("重开", restart);
    restart();
    setTouchActions({ left: () => moveAim(-1), right: () => moveAim(1), action: () => drop(aim) });
    return keyHandler({ ArrowLeft: () => moveAim(-1), ArrowRight: () => moveAim(1), " ": () => drop(aim), Enter: () => drop(aim), "1": () => drop(0), "2": () => drop(1), "3": () => drop(2), "4": () => drop(3), "5": () => drop(4), "6": () => drop(5) });
  }

  function runJump() {
    let platform = 110;
    let power = 0;
    let points = 0;
    let charging = false;
    let chargeTimer = null;
    board.classList.add("jump-board");

    function render() {
      board.innerHTML = `<div class="jump-track"><span class="jump-player" style="left:${platform}px"></span><span class="jump-target" style="left:${300 + (points % 4) * 48}px"></span></div>`;
      setScore(points);
      setStatus(`Power ${power}`);
      setMeta(["Hold", "Release", "Streak"]);
    }

    function charge() {
      charging = true;
      power = Math.min(120, power + 12);
      render();
    }

    function startCharge() {
      clearInterval(chargeTimer);
      charge();
      chargeTimer = setInterval(charge, 90);
    }

    function jump() {
      clearInterval(chargeTimer);
      chargeTimer = null;
      const target = 300 + (points % 4) * 48;
      const landing = platform + power * 2.15;
      const hit = Math.abs(landing - target) < 42;
      points = hit ? points + 1 : 0;
      platform = hit ? target : 110;
      power = 0;
      charging = false;
      render();
    }

    button("蓄力", startCharge, true);
    button("跳", jump);
    button("重开", () => { platform = 110; power = 0; points = 0; render(); });
    board.addEventListener("pointerdown", startCharge);
    board.addEventListener("pointerup", jump);
    setTouchActions({ action: () => (power > 70 ? jump() : charge()), up: charge, down: jump });
    render();
    const offKey = keyHandler({ " ": () => charging ? jump() : charge(), Enter: jump });
    return () => {
      clearInterval(chargeTimer);
      board.removeEventListener("pointerdown", startCharge);
      board.removeEventListener("pointerup", jump);
      offKey();
    };
  }

  function runTower() {
    const cols = 10;
    const rows = 7;
    const path = [30, 31, 32, 33, 23, 13, 14, 15, 16, 26, 36, 46, 47, 48, 49];
    let towers = new Set();
    let enemies = [];
    let lives = 10;
    let coins = 60;
    let wave = 0;
    board.style.setProperty("--cols", cols);
    board.style.setProperty("--rows", rows);

    function place(i) {
      if (path.includes(i) || towers.has(i) || coins < 20) return;
      towers.add(i);
      coins -= 20;
      render();
    }

    function spawn() {
      wave += 1;
      for (let i = 0; i < 3 + wave; i += 1) enemies.push({ step: -i * 2, hp: 2 + wave });
      render();
    }

    function tick() {
      enemies.forEach((enemy) => enemy.step += 1);
      enemies = enemies.filter((enemy) => {
        if (enemy.step >= path.length) {
          lives -= 1;
          return false;
        }
        return enemy.hp > 0;
      });
      towers.forEach((tower) => {
        const tx = tower % cols;
        const ty = Math.floor(tower / cols);
        const target = enemies.find((enemy) => {
          const pos = path[enemy.step];
          if (pos === undefined) return false;
          return Math.abs(pos % cols - tx) + Math.abs(Math.floor(pos / cols) - ty) <= 2;
        });
        if (target) {
          target.hp -= 1;
          if (target.hp <= 0) coins += 6;
        }
      });
      if (lives <= 0) setStatus("Game Over");
      render();
    }

    function render() {
      const enemyCells = new Map(enemies.filter((e) => path[e.step] !== undefined).map((e) => [path[e.step], e.hp]));
      board.innerHTML = "";
      for (let i = 0; i < cols * rows; i += 1) {
        const b = cell(`tower-cell ${path.includes(i) ? "is-path" : ""} ${towers.has(i) ? "is-tower" : ""} ${enemyCells.has(i) ? "is-enemy" : ""}`, towers.has(i) ? "▲" : enemyCells.has(i) ? "●" : "");
        b.addEventListener("click", () => place(i));
        board.append(b);
      }
      setScore(`${coins} / ${lives}`);
      setStatus(`Wave ${wave}`);
      setMeta(["Place towers", "Wave", "Lives"]);
    }

    function restart() {
      towers = new Set();
      enemies = [];
      lives = 10;
      coins = 60;
      wave = 0;
      render();
    }

    button("出怪", spawn, true);
    button("重开", restart);
    restart();
    setTouchActions({ action: spawn });
    const offTimer = interval(tick, 850);
    return offTimer;
  }

  function runCards() {
    let hp = 30;
    let block = 0;
    let enemy = 24;
    let enemyAtk = 6;
    let points = 0;
    let hand = [];
    const deck = [
      { name: "Strike", cost: 1, play: () => { enemy -= 6; points += 6; } },
      { name: "Guard", cost: 1, play: () => { block += 7; } },
      { name: "Heal", cost: 1, play: () => { hp = Math.min(30, hp + 4); } },
      { name: "Heavy", cost: 2, play: () => { enemy -= 12; points += 12; } },
      { name: "Focus", cost: 0, play: () => { block += 3; points += 2; } }
    ];

    function draw() {
      hand = Array.from({ length: 4 }, () => deck[Math.floor(Math.random() * deck.length)]);
      block = 0;
      setMeta(["Tap cards", "Block", "Enemy turn"]);
      render();
    }

    function enemyTurn() {
      hp -= Math.max(0, enemyAtk - block);
      if (enemy <= 0) {
        enemy = 18 + Math.floor(points / 12);
        enemyAtk = 5 + Math.floor(points / 35);
        points += 25;
      }
      if (hp <= 0) setStatus("Game Over");
      else draw();
    }

    function play(i) {
      if (hp <= 0) return;
      hand[i].play();
      hand.splice(i, 1);
      if (enemy <= 0) enemyTurn();
      render();
    }

    function render() {
      board.innerHTML = `<div class="card-battle"><div><strong>HP ${hp}</strong><span>Block ${block}</span></div><div><strong>Enemy ${Math.max(0, enemy)}</strong><span>Attack ${enemyAtk}</span></div></div><div class="card-hand"></div>`;
      const handBox = board.querySelector(".card-hand");
      hand.forEach((cardItem, i) => {
        const b = cell("rogue-card", cardItem.name);
        b.addEventListener("click", () => play(i));
        handBox.append(b);
      });
      setScore(points);
      setStatus("Cards");
    }

    button("结束回合", enemyTurn, true);
    button("重开", () => { hp = 30; enemy = 24; enemyAtk = 6; points = 0; draw(); });
    setTouchActions({ action: enemyTurn });
    draw();
    return () => {};
  }
}
