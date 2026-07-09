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
    let events = [];
    let eventAges = [];
    let points = 0;
    let affinity = 0;
    let trust = 54;
    let communication = 4;
    let freshness = 68;
    let bloomChain = 0;
    let vowReady = false;
    let meetMeter = 0;
    let dateReady = false;
    let episode = 1;
    let dateCount = 0;
    let turn = 0;
    let spaceStreak = 0;
    let memoryCount = 0;
    let endingUnlocked = false;
    let duoMode = false;
    let chapterMode = false;
    let duoSide = 0;
    let lastMergeCells = [];
    let featuredCells = [];
    let lastSpawnCell = -1;
    let lastSpawnFromTop = false;
    let lastMoveDir = "start";
    let loveTempo = 1;
    let showMoment = "观察室：等待第一位嘉宾入场";
    let lastMemory = "";
    let seenStages = new Set();
    const meetGoal = 4;
    const negativeEvents = new Set(["misunderstanding", "coldWar", "busy", "distance", "future", "flatness", "anxiety", "disagreement"]);

    const tileStory = [
      [2, "👋", "初见", "#ffd7e5", "#bc486f", "#ff8db8", "#fff1f7", "你们第一次注意到彼此"],
      [4, "💓", "有好感", "#ffc8df", "#bf5777", "#ff73ac", "#ffe1ef", "好像有点在意 TA"],
      [8, "💬", "暧昧", "#ffb4d2", "#c94d78", "#ff5c9d", "#ffd4e7", "消息来得刚刚好"],
      [16, "☕", "第一次约会", "#ffa2c7", "#bb416d", "#ff477f", "#ffc4dc", "第一次正式见面"],
      [32, "🌹", "确认关系", "#ff91ba", "#a93565", "#ff346e", "#ffb5d2", "你们决定试试看"],
      [64, "🎆", "热恋期", "#ff7fae", "#95315d", "#ff2c73", "#ffa4cc", "世界都变成粉色了"],
      [128, "🧩", "磨合期", "#ff6da2", "#862a55", "#f82483", "#ff94c4", "喜欢是真的，分歧也是真的"],
      [256, "🤝", "信任建立", "#ff5d98", "#7e2651", "#ec1d79", "#ff83bb", "你们开始真的理解彼此"],
      [512, "🔑", "共同生活", "#eaa6ff", "#65306d", "#ad62ff", "#f2d0ff", "爱情进入日常"],
      [1024, "🗺️", "未来计划", "#ffd27a", "#8a5722", "#ffb02e", "#fff1b8", "你们开始讨论以后"],
      [2048, "💘", "双向奔赴", "#fff0a8", "#8f5b2f", "#ffcf4f", "#fff9d0", "这不是终点，是一起走下去"],
      [4096, "📷", "十年纪念", "#ffe19c", "#91531e", "#ffb538", "#fff3c4", "回忆已经长成一座小小的家"],
      [8192, "🌌", "白发相册", "#ded5ff", "#4f3f89", "#9d8cff", "#f4efff", "一生的故事还在翻页"]
    ];

    board.style.setProperty("--cols", size);
    board.style.setProperty("--rows", size);

    const relationshipEvents = {
      communication: { glyph: "💬", label: "沟通", tone: "positive", hint: "认真把话说清楚" },
      surprise: { glyph: "🎁", label: "惊喜", tone: "positive", hint: "给日常一点闪光" },
      misunderstanding: { glyph: "❔", label: "误会", tone: "negative", hint: "不说清楚会变冷" },
      coldWar: { glyph: "🧊", label: "冷战", tone: "negative", hint: "占住相处空间" },
      anniversary: { glyph: "🗓️", label: "纪念日", tone: "timed", hint: "别错过认真庆祝" },
      busy: { glyph: "💼", label: "忙碌期", tone: "negative", hint: "现实压力挤进来" },
      memory: { glyph: "📷", label: "回忆", tone: "memory", hint: "过去的好会保护现在" },
      distance: { glyph: "🚄", label: "异地", tone: "negative", hint: "距离需要计划来靠近" },
      future: { glyph: "🧭", label: "未来分歧", tone: "negative", hint: "期待需要一起对齐" },
      flatness: { glyph: "📱", label: "平淡", tone: "negative", hint: "日常不能只剩惯性" },
      anxiety: { glyph: "…", label: "不安", tone: "negative", hint: "猜测正在变大" },
      disagreement: { glyph: "🧩", label: "分歧", tone: "negative", hint: "不同不是敌人" }
    };

    function clamp(value, min = 0, max = 100) {
      return Math.max(min, Math.min(max, value));
    }

    function emptyIndices() {
      return tiles.map((value, index) => value || events[index] ? -1 : index).filter((index) => index >= 0);
    }

    function getCell(index) {
      if (events[index]) return { event: events[index], age: eventAges[index] || 0 };
      if (tiles[index]) return { value: tiles[index] };
      return null;
    }

    function setCell(index, cell) {
      if (!cell) {
        tiles[index] = 0;
        events[index] = "";
        eventAges[index] = 0;
        return;
      }
      if (cell.event) {
        tiles[index] = 0;
        events[index] = cell.event;
        eventAges[index] = cell.age || 0;
        return;
      }
      tiles[index] = cell.value || 0;
      events[index] = "";
      eventAges[index] = 0;
    }

    function boardSignature() {
      return tiles.join(",") + "|" + events.join(",") + "|" + eventAges.join(",");
    }

    function add(value = Math.random() > 0.88 ? 4 : 2) {
      const empty = emptyIndices();
      if (!empty.length) return -1;
      const index = empty[Math.floor(Math.random() * empty.length)];
      setCell(index, { value });
      return index;
    }

    function addFromTop(value = Math.random() > 0.88 ? 4 : 2) {
      for (let row = 0; row < size; row += 1) {
        const empties = [];
        for (let col = 0; col < size; col += 1) {
          const index = row * size + col;
          if (!tiles[index] && !events[index]) empties.push(index);
        }
        if (empties.length) {
          const index = empties[Math.floor(Math.random() * empties.length)];
          setCell(index, { value });
          return index;
        }
      }
      return -1;
    }

    function addEvent(type, preferTop = false) {
      const empty = emptyIndices();
      if (!empty.length) return -1;
      let pool = empty;
      if (preferTop) {
        const topRows = empty.filter((index) => index < size * 2);
        if (topRows.length) pool = topRows;
      }
      const index = pool[Math.floor(Math.random() * pool.length)];
      setCell(index, { event: type, age: 0 });
      return index;
    }

    function romanceTile(value) {
      if (!value) return { glyph: "", label: "", rank: 0, color: "transparent", deep: "transparent", accent: "transparent", rim: "transparent" };
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
        deep: selected[4],
        accent: selected[5],
        rim: selected[6],
        memory: selected[7]
      };
    }

    function maxTile() {
      return tiles.reduce((best, value) => Math.max(best, value || 0), 0);
    }

    function phaseName() {
      if (vowReady) return "终选夜";
      if (endingUnlocked) return "关系结局";
      if (chapterMode && maxTile() >= 512) return "未来章";
      if (chapterMode && maxTile() >= 128) return "磨合章";
      if (chapterMode && maxTile() >= 32) return "热恋章";
      if (dateReady) return "约会局";
      if (affinity >= 70) return "心动互选";
      if (meetMeter >= 2) return "相遇观察";
      return "嘉宾入场";
    }

    function collectMeet(amount, moment) {
      meetMeter = Math.min(meetGoal, meetMeter + amount);
      if (meetMeter >= meetGoal || bloomChain >= 2) dateReady = true;
      showMoment = `观察室：${moment}`;
    }

    function recordMemory(text) {
      memoryCount = Math.min(9, memoryCount + 1);
      lastMemory = text;
      showMoment = `回忆相册：${text}`;
    }

    function canResolvePair(a, b) {
      if (!a || !b) return false;
      if (a.value && b.value) return a.value === b.value;
      const typeA = a.event;
      const typeB = b.event;
      if (typeA === "communication" && (b.value || negativeEvents.has(typeB))) return true;
      if (typeB === "communication" && (a.value || negativeEvents.has(typeA))) return true;
      if (typeA === "surprise" && (b.value || typeB === "flatness")) return true;
      if (typeB === "surprise" && (a.value || typeA === "flatness")) return true;
      if (typeA === "memory" && negativeEvents.has(typeB)) return true;
      if (typeB === "memory" && negativeEvents.has(typeA)) return true;
      if (typeA === "anniversary" && b.value && b.value >= 64) return true;
      if (typeB === "anniversary" && a.value && a.value >= 64) return true;
      if (typeA === "busy" && b.value && b.value >= 256) return true;
      if (typeB === "busy" && a.value && a.value >= 256) return true;
      if (typeA === typeB && typeA === "misunderstanding") return true;
      if (typeA === typeB && typeA === "communication") return true;
      if (typeA === typeB && typeA === "surprise") return true;
      return false;
    }

    function resolvePair(a, b) {
      if (!canResolvePair(a, b)) return null;
      if (a.value && b.value) {
        const nextValue = a.value * 2;
        const tile = romanceTile(nextValue);
        affinity = clamp(affinity + 12 + Math.min(18, Math.round(Math.log2(nextValue))));
        trust = clamp(trust + (nextValue >= 128 ? 4 : 2));
        communication = clamp(communication + (nextValue >= 16 ? 2 : 1), 0, 18);
        freshness = clamp(freshness + (bloomChain >= 1 ? 4 : 2));
        if (!seenStages.has(nextValue)) {
          seenStages.add(nextValue);
          recordMemory(`${tile.label}：${tile.memory}`);
        }
        return { cell: { value: nextValue }, score: nextValue, label: tile.label };
      }

      const eventCell = a.event ? a : b;
      const other = a.event ? b : a;
      const event = eventCell.event;

      if (event === "communication" && other.value) {
        trust = clamp(trust + 8);
        communication = clamp(communication + 1, 0, 18);
        recordMemory(`${romanceTile(other.value).label}里，你们把话说开了`);
        return { cell: { value: other.value }, score: other.value, label: "沟通" };
      }
      if (event === "surprise" && other.value) {
        const nextValue = other.value * 2;
        affinity = clamp(affinity + 18);
        freshness = clamp(freshness + 18);
        recordMemory(`${romanceTile(other.value).label}里出现了一次小惊喜`);
        return { cell: { value: nextValue }, score: nextValue, label: "惊喜" };
      }
      if (event === "memory" && other.event && negativeEvents.has(other.event)) {
        trust = clamp(trust + 10);
        communication = clamp(communication + 2, 0, 18);
        recordMemory("想起一起走过的路，你们愿意再好好聊一次");
        return { cell: { event: "communication", age: 0 }, score: 16, label: "回忆" };
      }
      if (event === "communication" && other.event && negativeEvents.has(other.event)) {
        trust = clamp(trust + (other.event === "coldWar" ? 14 : 9));
        communication = clamp(communication + 2, 0, 18);
        freshness = clamp(freshness + 4);
        recordMemory("你们没有猜来猜去，而是坐下来认真听对方说完");
        return { cell: { event: "memory", age: 0 }, score: 24, label: "理解" };
      }
      if (event === "surprise" && other.event === "flatness") {
        freshness = clamp(freshness + 22);
        affinity = clamp(affinity + 12);
        return { cell: { event: "memory", age: 0 }, score: 18, label: "新鲜感" };
      }
      if (event === "anniversary" && other.value && other.value >= 64) {
        trust = clamp(trust + 12);
        freshness = clamp(freshness + 16);
        affinity = clamp(affinity + 16);
        recordMemory("你们认真准备了纪念日，后来每次想起都还会笑");
        return { cell: { event: "memory", age: 0 }, score: other.value, label: "纪念日" };
      }
      if (event === "busy" && other.value && other.value >= 256) {
        trust = clamp(trust + 14);
        communication = clamp(communication + 4, 0, 18);
        recordMemory("现实很忙，但你们没有把对方排除在计划之外");
        return { cell: { value: other.value }, score: other.value, label: "共同成长" };
      }
      if (a.event === "misunderstanding" && b.event === "misunderstanding") {
        trust = clamp(trust - 8);
        return { cell: { event: "coldWar", age: 0 }, score: 0, label: "冷战" };
      }
      if (a.event === "communication" && b.event === "communication") {
        trust = clamp(trust + 6);
        communication = clamp(communication + 3, 0, 18);
        return { cell: { value: 8 }, score: 8, label: "长谈" };
      }
      if (a.event === "surprise" && b.event === "surprise") {
        freshness = clamp(freshness + 18);
        return { cell: { value: 16 }, score: 16, label: "难忘约会" };
      }
      return null;
    }

    function slideLine(cells) {
      const values = cells.filter(Boolean);
      const result = [];
      const mergedSlots = [];
      const eventSlots = [];
      let merged = 0;
      const labels = [];
      for (let i = 0; i < values.length; i += 1) {
        const resolved = values[i + 1] ? resolvePair(values[i], values[i + 1]) : null;
        if (resolved) {
          result.push(resolved.cell);
          mergedSlots.push(result.length - 1);
          if (resolved.cell?.event) eventSlots.push(result.length - 1);
          merged += resolved.score || 0;
          labels.push(resolved.label);
          i += 1;
        } else {
          result.push(values[i]);
        }
      }
      while (result.length < size) result.push(null);
      return { cells: result, merged, mergedSlots, eventSlots, labels };
    }

    function canMove() {
      if (emptyIndices().length) return true;
      if (dateReady || vowReady || (communication > 0 && events.some((event) => negativeEvents.has(event)))) return true;
      for (let i = 0; i < tiles.length; i += 1) {
        const col = i % size;
        const row = Math.floor(i / size);
        const current = getCell(i);
        const right = getCell(i + 1);
        const down = getCell(i + size);
        if (col < size - 1 && current?.event !== "coldWar" && right?.event !== "coldWar" && canResolvePair(current, right)) return true;
        if (row < size - 1 && current?.event !== "coldWar" && down?.event !== "coldWar" && canResolvePair(current, down)) return true;
      }
      return false;
    }

    function emptyCount() {
      return emptyIndices().length;
    }

    function ageEvents() {
      for (let i = 0; i < events.length; i += 1) {
        if (!events[i]) continue;
        eventAges[i] = (eventAges[i] || 0) + 1;
        if (events[i] === "misunderstanding" && eventAges[i] >= 5) {
          events[i] = "coldWar";
          eventAges[i] = 0;
          trust = clamp(trust - 10);
          showMoment = "观察室：误会拖得太久，空气冷了下来";
        } else if (events[i] === "anniversary" && eventAges[i] >= 5) {
          events[i] = "misunderstanding";
          eventAges[i] = 0;
          trust = clamp(trust - 6);
          freshness = clamp(freshness - 8);
          showMoment = "观察室：纪念日被错过，失落悄悄留下";
        } else if (events[i] === "busy" && eventAges[i] % 3 === 0) {
          freshness = clamp(freshness - 4);
        } else if (events[i] === "coldWar" && eventAges[i] % 2 === 0) {
          trust = clamp(trust - 4);
          communication = clamp(communication - 1, 0, 18);
        }
      }
    }

    function spawnRelationshipEvent(forceType = "") {
      const empty = emptyIndices();
      if (!empty.length) return -1;
      let type = forceType;
      const top = maxTile();
      if (!type) {
        if (turn > 0 && turn % 18 === 0) type = "anniversary";
        else if (top >= 1024 && Math.random() < 0.32) type = "future";
        else if (top >= 256 && Math.random() < 0.25) type = "distance";
        else if (trust < 36 && Math.random() < 0.5) type = "misunderstanding";
        else if (freshness < 34 && Math.random() < 0.5) type = "flatness";
        else if (communication < 2 && Math.random() < 0.35) type = "anxiety";
        else {
          const pool = [
            "communication",
            "surprise",
            "memory",
            "busy",
            top >= 128 ? "misunderstanding" : "communication",
            top >= 512 ? "future" : "surprise"
          ];
          type = pool[Math.floor(Math.random() * pool.length)];
        }
      }
      const index = addEvent(type, true);
      if (index >= 0) {
        featuredCells = [index];
        showMoment = `观察室：${relationshipEvents[type]?.label || "事件"}出现，关系经营进入新一轮选择`;
      }
      return index;
    }

    function updateSpaceReward() {
      if (emptyCount() >= 4) {
        spaceStreak += 1;
      } else {
        spaceStreak = 0;
      }
      if (spaceStreak >= 3) {
        spaceStreak = 0;
        trust = clamp(trust + 5);
        freshness = clamp(freshness + 7);
        communication = clamp(communication + 1, 0, 18);
        showMoment = "观察室：舒服的距离让关系有了呼吸感";
        if (emptyIndices().length) spawnRelationshipEvent("memory");
      }
    }

    function afterTurn(mergedThisMove, labels = []) {
      turn += 1;
      ageEvents();
      updateSpaceReward();
      if (mergedThisMove) {
        collectMeet(bloomChain >= 2 ? 2 : 1, `${labels[0] || "关系"}推进，心跳连击亮起`);
        if (bloomChain >= 3 && emptyIndices().length) spawnRelationshipEvent("surprise");
      }
      if (!mergedThisMove) {
        freshness = clamp(freshness - 3);
        if (freshness < 30 && emptyIndices().length && Math.random() < 0.28) spawnRelationshipEvent("flatness");
      }
      if ((turn % 7 === 0 || trust < 32 || freshness < 28) && emptyIndices().length) {
        spawnRelationshipEvent();
      }
      if (affinity >= 100 || maxTile() >= 1024) vowReady = true;
      if (meetMeter >= meetGoal || bloomChain >= 2) dateReady = true;
      if (maxTile() >= 2048 && !endingUnlocked) {
        endingUnlocked = true;
        showMoment = `结局：${endingName()}。${endingLine()}`;
        triggerBoardEffect("love-ending", { text: endingName(), duration: 1800 });
      }
    }

    function move(dir) {
      const before = boardSignature();
      let mergedThisMove = 0;
      const mergedCells = [];
      const mergeLabels = [];
      let topSpawned = false;
      let bumped = false;
      featuredCells = [];
      for (let i = 0; i < size; i += 1) {
        const rawIndices = [];
        for (let j = 0; j < size; j += 1) {
          const idx = dir === "left" || dir === "right" ? i * size + j : j * size + i;
          rawIndices.push(idx);
        }
        const orientedIndices = dir === "right" || dir === "down" ? rawIndices.slice().reverse() : rawIndices;
        let cursor = 0;
        while (cursor < size) {
          if (events[orientedIndices[cursor]] === "coldWar") {
            cursor += 1;
            continue;
          }
          const segmentIndices = [];
          while (cursor < size && events[orientedIndices[cursor]] !== "coldWar") {
            segmentIndices.push(orientedIndices[cursor]);
            cursor += 1;
          }
          const shifted = slideLine(segmentIndices.map((idx) => getCell(idx)));
          mergedThisMove += shifted.merged;
          for (const slot of shifted.mergedSlots) mergedCells.push(segmentIndices[slot]);
          for (const label of shifted.labels) mergeLabels.push(label);
          for (let j = 0; j < segmentIndices.length; j += 1) {
            setCell(segmentIndices[j], shifted.cells[j]);
          }
        }
      }
      if (boardSignature() !== before) {
        lastMoveDir = dir;
        lastMergeCells = mergedCells;
        lastSpawnFromTop = false;
        if (mergedThisMove) {
          bloomChain += 1;
          loveTempo = Math.max(0.58, 1 - bloomChain * 0.055);
          points += Math.round(mergedThisMove * (1 + Math.min(bloomChain, 6) * 0.22));
          featuredCells = mergedCells.slice(0, 4);
          if (bloomChain >= 2) showMoment = "观察室：连续心动触发约会机会";
        } else {
          bloomChain = 0;
          affinity = clamp(affinity - 4);
          loveTempo = 1;
        }
        afterTurn(mergedThisMove, mergeLabels);
        lastSpawnCell = Math.random() < 0.16 ? spawnRelationshipEvent() : add();
        if (!mergedThisMove && lastSpawnCell >= 0) {
          featuredCells = [lastSpawnCell];
          collectMeet(1, "新事件入场，关系线重新洗牌");
        }
      } else {
        lastMoveDir = dir;
        lastMergeCells = [];
        if (emptyIndices().length && Math.random() < 0.35) {
          lastSpawnCell = spawnRelationshipEvent("communication");
        } else {
          lastSpawnCell = addFromTop();
        }
        lastSpawnFromTop = lastSpawnCell >= 0;
        topSpawned = lastSpawnFromTop;
        bumped = !topSpawned;
        if (topSpawned) {
          featuredCells = [lastSpawnCell];
          collectMeet(2, "顶端空降新嘉宾，粉红任务开启");
          afterTurn(0, []);
        }
      }
      if (duoMode && boardSignature() !== before) {
        duoSide = 1 - duoSide;
        trust = clamp(trust + (mergedThisMove ? 2 : 0));
      }
      render();
      if (topSpawned) {
        setStatus("顶端飘来一颗新心，继续牵手");
        triggerCellEffect("love-top-spawn", lastSpawnCell, size, size, { duration: 760 });
      } else if (bumped) {
        setStatus("轻轻碰撞，换个方向牵手");
        triggerBoardEffect("love-bump", { duration: 420 });
      }
      if (mergedThisMove) {
        triggerBoardEffect("love-merge", { text: `×${bloomChain}`, duration: 860 });
        for (const index of mergedCells.slice(0, 4)) {
          triggerCellEffect("love-collision", index, size, size, { duration: 680 });
        }
      }
    }

    function communicate() {
      const target = events.findIndex((event) => negativeEvents.has(event));
      if (target < 0) {
        communication = clamp(communication + 2, 0, 18);
        trust = clamp(trust + 4);
        const index = spawnRelationshipEvent("communication");
        featuredCells = index >= 0 ? [index] : [];
        showMoment = "观察室：没有大矛盾的时候也愿意沟通，是关系变稳的开始";
      } else if (communication > 0) {
        communication = clamp(communication - 1, 0, 18);
        events[target] = "memory";
        eventAges[target] = 0;
        trust = clamp(trust + 12);
        freshness = clamp(freshness + 3);
        featuredCells = [target];
        recordMemory("你们把卡住的话题说清楚了");
      } else {
        setStatus("沟通值不足，先创造一次长谈机会");
        triggerBoardEffect("love-bump", { duration: 420 });
        return;
      }
      render();
      triggerBoardEffect("love-communication", { text: "沟通", duration: 980 });
    }

    function date() {
      if (!dateReady) {
        setStatus(`相遇值 ${meetMeter}/${meetGoal}，再制造一点心动`);
        triggerBoardEffect("love-bump", { duration: 420 });
        return;
      }
      const pick = tiles
        .map((value, index) => ({ value, index }))
        .filter((item) => item.value)
        .sort((a, b) => a.value - b.value || a.index - b.index)[0];
      if (!pick) return;
      tiles[pick.index] *= 2;
      points += tiles[pick.index] * 2;
      affinity = clamp(affinity + 26 + dateCount * 3);
      trust = clamp(trust + 8);
      communication = clamp(communication + 2, 0, 18);
      freshness = clamp(freshness + 16);
      meetMeter = 0;
      dateReady = false;
      dateCount += 1;
      episode += 1;
      bloomChain = Math.max(1, bloomChain);
      loveTempo = Math.max(0.62, loveTempo - 0.07);
      if (affinity >= 100) vowReady = true;
      lastMoveDir = "date";
      lastMergeCells = [pick.index];
      featuredCells = [pick.index];
      lastSpawnCell = -1;
      lastSpawnFromTop = false;
      const stage = romanceTile(tiles[pick.index]).label;
      showMoment = `观察室：第${episode}期约会成局，${stage}关系升温`;
      render();
      setStatus(`第${episode}期约会成局，${stage}升温`);
      triggerBoardEffect("love-date", { text: "约会", duration: 1280 });
      triggerCellEffect("love-date", pick.index, size, size, { duration: 980 });
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
        featuredCells = [small.index];
      }
      affinity = 0;
      trust = clamp(trust + 12);
      communication = clamp(communication + 3, 0, 18);
      freshness = clamp(freshness + 8);
      bloomChain = 0;
      meetMeter = 0;
      dateReady = false;
      episode += 1;
      loveTempo = 1;
      vowReady = false;
      lastMoveDir = "vow";
      showMoment = `观察室：第${episode}期终选夜落幕，誓约正式绽放`;
      render();
      setStatus("誓约绽放，最小心意翻倍");
      triggerBoardEffect("love-vow", { text: "♡", duration: 2200 });
    }

    function realTask() {
      trust = clamp(trust + 5);
      communication = clamp(communication + 2, 0, 18);
      freshness = clamp(freshness + 7);
      recordMemory("真实任务：今天问对方一个最近认真在意的小问题");
      const index = spawnRelationshipEvent("memory");
      featuredCells = index >= 0 ? [index] : [];
      render();
      triggerBoardEffect("love-communication", { text: "任务", duration: 980 });
    }

    function toggleDuo() {
      duoMode = !duoMode;
      showMoment = duoMode ? "默契挑战：两个人轮流选择方向，行动与回应都算数" : "观察室：回到单人关系经营";
      render();
    }

    function toggleChapter() {
      chapterMode = !chapterMode;
      showMoment = chapterMode ? "章节模式：遇见、暧昧、告白、磨合、现实、未来依次展开" : "观察室：回到无尽经营";
      render();
    }

    function endingName() {
      if (maxTile() >= 2048 && trust >= 70 && communication >= 8 && freshness >= 55) return "双向奔赴";
      if (maxTile() >= 2048 && trust >= 76) return "细水长流";
      if (memoryCount >= 5 && trust < 46) return "差一点";
      if (communication >= 10 && trust < 52) return "好好告别";
      return "共同未来";
    }

    function endingLine() {
      const ending = endingName();
      if (ending === "双向奔赴") return "你们没有变成完美的人，但变成了更愿意理解彼此的人。";
      if (ending === "细水长流") return "没有每天轰轰烈烈，但每次回头，TA 都在那里。";
      if (ending === "差一点") return "你们曾经很认真地靠近过，只是那时还不太会爱。";
      if (ending === "好好告别") return "你们没有继续走下去，但终于学会了把话说清楚。";
      return "你们开始认真讨论以后，也愿意一起找答案。";
    }

    function heartMarkup(index) {
      const uid = `love-heart-${index}`;
      return `<svg class="heart-core" viewBox="0 0 100 92" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true"><defs><linearGradient id="${uid}-fill" x1="20" y1="10" x2="82" y2="86" gradientUnits="userSpaceOnUse"><stop class="heart-stop-light" offset="0"></stop><stop class="heart-stop-mid" offset="0.48"></stop><stop class="heart-stop-deep" offset="1"></stop></linearGradient><radialGradient id="${uid}-glow" cx="34%" cy="25%" r="58%"><stop class="heart-glow-light" offset="0"></stop><stop class="heart-glow-clear" offset="1"></stop></radialGradient></defs><path class="heart-shadow" d="M50 84C45 77 17 61 9 41C2 24 13 8 30 8C40 8 47 14 50 22C53 14 60 8 70 8C87 8 98 24 91 41C83 61 55 77 50 84Z"></path><path class="heart-main" fill="url(#${uid}-fill)" d="M50 84C45 77 17 61 9 41C2 24 13 8 30 8C40 8 47 14 50 22C53 14 60 8 70 8C87 8 98 24 91 41C83 61 55 77 50 84Z"></path><path class="heart-glow" fill="url(#${uid}-glow)" d="M50 84C45 77 17 61 9 41C2 24 13 8 30 8C40 8 47 14 50 22C53 14 60 8 70 8C87 8 98 24 91 41C83 61 55 77 50 84Z"></path><path class="heart-rim" d="M50 84C45 77 17 61 9 41C2 24 13 8 30 8C40 8 47 14 50 22C53 14 60 8 70 8C87 8 98 24 91 41C83 61 55 77 50 84Z"></path><path class="heart-gloss" d="M29 18C20 19 15 26 16 35C17 42 23 48 31 51C26 43 28 30 38 23C35 20 32 18 29 18Z"></path><circle class="heart-spark" cx="68" cy="21" r="3.2"></circle><circle class="heart-spark is-small" cx="76" cy="31" r="1.9"></circle></svg>`;
    }

    function render() {
      const moveVectors = {
        left: ["-1", "0"],
        right: ["1", "0"],
        up: ["0", "-1"],
        down: ["0", "1"],
        date: ["0", "0"],
        vow: ["0", "0"],
        start: ["0", "0"]
      };
      const [moveX, moveY] = moveVectors[lastMoveDir] || moveVectors.start;
      const mergeSet = new Set(lastMergeCells);
      const featureSet = new Set(featuredCells);
      board.style.setProperty("--affinity", affinity);
      board.style.setProperty("--affinity-alpha", Math.min(0.62, affinity / 150).toFixed(3));
      board.style.setProperty("--meet-alpha", Math.min(0.58, meetMeter / (meetGoal + 2)).toFixed(3));
      board.style.setProperty("--trust-alpha", Math.min(0.62, trust / 150).toFixed(3));
      board.style.setProperty("--tempo", loveTempo.toFixed(2));
      board.style.setProperty("--move-x", moveX);
      board.style.setProperty("--move-y", moveY);
      board.classList.toggle("is-accelerated", bloomChain >= 2);
      board.classList.toggle("is-vow-ready", vowReady);
      board.classList.toggle("is-date-ready", dateReady);
      board.classList.toggle("is-duo-mode", duoMode);
      board.classList.toggle("is-chapter-mode", chapterMode);
      board.dataset.move = lastMoveDir;
      board.dataset.showPhase = phaseName();
      board.innerHTML = tiles.map((value, index) => {
        const event = events[index];
        if (event) {
          const info = relationshipEvents[event] || relationshipEvents.communication;
          const negative = negativeEvents.has(event) ? "event-negative" : "";
          const memory = event === "memory" ? "event-memory" : "";
          const featured = featureSet.has(index) ? "is-featured" : "";
          const age = eventAges[index] || 0;
          return `<span class="merge-cell event-cell event-${event} ${negative} ${memory} ${featured}" data-event="${event}" data-age="${age}"><b>${info.glyph}</b><em class="tile-number">${escapeText(info.label)}</em><small>${escapeText(info.hint)}</small></span>`;
        }
        const tile = romanceTile(value);
        const hot = value && value >= 128 ? "is-hot" : "";
        const collision = mergeSet.has(index) ? "is-collision" : "";
        const featured = featureSet.has(index) ? "is-featured" : "";
        const newborn = index === lastSpawnCell ? "is-new" : "";
        const topSpawn = lastSpawnFromTop && index === lastSpawnCell ? "is-top-spawn" : "";
        const vowTile = value && value >= 1024 ? "is-vow" : "";
        const style = value ? ` style="--tile:${tile.color};--tile-deep:${tile.deep};--tile-accent:${tile.accent};--tile-rim:${tile.rim};--rank:${tile.rank};"` : "";
        const content = value ? `${heartMarkup(index)}<b>${tile.glyph}</b><em class="tile-number">${value}</em><small>${escapeText(tile.label)}</small>` : "";
        return `<span class="merge-cell love-tile v${value || 0} ${hot} ${collision} ${featured} ${newborn} ${topSpawn} ${vowTile}" data-value="${value || ""}" data-rank="${tile.rank}" data-romance="${escapeText(tile.label)}"${style}>${content}</span>`;
      }).join("");
      setScore(points);
      if (!canMove()) {
        setStatus(`关系空间被情绪填满：${memoryCount ? endingLine() : "你们需要重遇，重新留出相处余地"}`);
      } else {
        setStatus(vowReady ? `${showMoment} · 点誓约进入终选夜` : dateReady ? `${showMoment} · 点约会推进关系` : `${showMoment} · 相遇 ${meetMeter}/${meetGoal}`);
      }
      setMeta([
        "关系经营",
        chapterMode ? `章节 ${phaseName()}` : `第${episode}期`,
        duoMode ? (duoSide ? "回应方" : "行动方") : `心动 ${affinity}%`,
        `信任 ${trust}`,
        `沟通 ${communication}`,
        `新鲜感 ${freshness}`,
        dateReady ? "约会可用" : `相遇 ${meetMeter}/${meetGoal}`,
        vowReady ? "誓约可用" : `回忆 ${memoryCount}`
      ]);
    }

    function restart() {
      tiles = Array(size * size).fill(0);
      events = Array(size * size).fill("");
      eventAges = Array(size * size).fill(0);
      points = 0;
      affinity = 0;
      trust = 54;
      communication = 4;
      freshness = 68;
      bloomChain = 0;
      loveTempo = 1;
      vowReady = false;
      meetMeter = 0;
      dateReady = false;
      episode = 1;
      dateCount = 0;
      turn = 0;
      spaceStreak = 0;
      memoryCount = 0;
      endingUnlocked = false;
      seenStages = new Set();
      lastMoveDir = "start";
      lastMergeCells = [];
      featuredCells = [];
      lastSpawnFromTop = false;
      showMoment = "观察室：等待第一位嘉宾入场";
      add();
      lastSpawnCell = add();
      featuredCells = [lastSpawnCell];
      render();
    }

    button("沟通", communicate, true);
    button("约会", date, true);
    button("誓约", vow, true);
    button("章节", toggleChapter);
    button("双人", toggleDuo);
    button("任务", realTask);
    button("重遇", restart);
    restart();
    const offKey = keyHandler({ ArrowLeft: () => move("left"), ArrowRight: () => move("right"), ArrowUp: () => move("up"), ArrowDown: () => move("down"), " ": vow, c: communicate, C: communicate, d: date, D: date });
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
