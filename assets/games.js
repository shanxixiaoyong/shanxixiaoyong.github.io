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
      tagline: "滑动牵手，合并心意，每次升级翻开一段随机故事。",
      feature: "Stage / Story / Bloom",
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
    let bestValue = 2;
    let seenStageValues = new Set([2]);
    let lastMergeCells = [];
    let lastSpawnCell = -1;
    let lastMoveDir = "start";
    let loveTempo = 1;
    let storyLog = [];
    let currentScene = null;
    let memoryOpen = false;
    let moodTimer = 0;
    let sceneBloomTimer = 0;
    let stageCelebrationTimer = 0;
    let sceneDanmakuTimers = [];
    let sceneDanmakuLane = 0;
    let tileMotionTimer = 0;
    let swipeTraceTimer = 0;
    let touchFeedbackTimer = 0;
    let bumpTimer = 0;
    let lastMotionTargets = [];
    const spawnOnBlockedInput = true;

    const loveVfxFactory = window.Love2048Vfx?.createLoveVfx;
    const loveVfx = loveVfxFactory
      ? window.Love2048Vfx.createLoveVfx({ root: document.body, mood: "meet" })
      : { setMood() {}, burst() {}, celebrate() {}, destroy() {} };

    const tileStory = [
      [2, "✦", "初见", "#ef6f91", "#741739", "#ff9cb4", "#ffe4e9"],
      [4, "⌁", "记住", "#f47a6e", "#76242d", "#ffad82", "#ffe8cf"],
      [8, "♡", "有好感", "#dda147", "#704017", "#ffd171", "#fff0bd"],
      [16, "✧", "试探", "#e54d60", "#711726", "#ff7987", "#ffdce0"],
      [32, "…", "暧昧", "#d94178", "#611532", "#ff70a5", "#ffd6e5"],
      [64, "○", "约见", "#af558b", "#4c1e43", "#e582ba", "#f7d8e9"],
      [128, "◉", "第一次约会", "#3f8fc0", "#173e60", "#76c8e5", "#daf3ff"],
      [256, "↗", "频繁联系", "#2f9a89", "#164e49", "#6dd4bd", "#d9fff4"],
      [512, "☾", "心照不宣", "#6069b5", "#2a3066", "#959ee4", "#e8eaff"],
      [1024, "✉", "告白前夜", "#bd6d72", "#592637", "#f09ba1", "#ffe1df"],
      [2048, "♥", "确认关系", "#d62f49", "#630d20", "#ff6073", "#ffe7c8"],
      [4096, "✹", "热恋期", "#d87931", "#682d15", "#ffad59", "#fff0cb"],
      [8192, "◇", "磨合期", "#4e7097", "#1d304c", "#80a9cf", "#dceaff"],
      [16384, "∞", "稳定相处", "#3b8a68", "#164d3c", "#68c08f", "#ddf8e8"],
      [32768, "◌", "见过朋友", "#366caf", "#173662", "#65a0e0", "#e0efff"],
      [65536, "⌁", "共同旅行", "#df6d55", "#6e2a24", "#ff9a78", "#ffe3d5"],
      [131072, "⌂", "同居日常", "#845da1", "#3d2753", "#b58ad0", "#f0e4fa"],
      [262144, "◎", "见过家人", "#d1982e", "#6d4714", "#f2c45a", "#fff0bd"],
      [524288, "⌘", "谈及婚姻", "#b99647", "#5a461d", "#e6c66b", "#fff1c6"],
      [1048576, "◈", "求婚时刻", "#d7bc6c", "#6b531f", "#f4db8b", "#fff7d8"],
      [2097152, "✦", "婚礼之前", "#d4a0ae", "#684052", "#f1c4cc", "#fff0e9"],
      [4194304, "∞", "长久相爱", "#b8c3df", "#3c466e", "#e8b8d0", "#fff7d5"]
    ];

    const narrativeScenes = {
      2: [
        { title: "雨停便利店", line: "你们同时站在门口等雨小，檐下的灯把沉默照得很柔软。谁都没有先走，好像都在等一句可以继续的话。", mood: "meet", effect: "love-petal", tone: "meet" },
        { title: "图书馆错拿书", line: "两只手同时碰到同一本书，书脊轻轻歪了一下。你们把书推来推去，最后都笑了。", mood: "campus", effect: "love-petal", tone: "campus" },
        { title: "地铁对视", line: "车厢忽然一晃，你扶住把手，目光刚好撞上 TA 的笑意。下一站很快到了，你却觉得这一秒很长。", mood: "street", effect: "love-story", tone: "street" },
        { title: "朋友聚会", line: "热闹里每个人都在说话，你却记住了那个安静听别人讲完的人。离开时，TA 的名字留在了你的脑海里。", mood: "meet", effect: "love-story", tone: "meet" },
        { title: "楼下晚风", line: "一句普通的问候被晚风吹得很轻，你们站在路灯下多聊了两句。后来你才发现自己记住了那天的温度。", mood: "street", effect: "love-petal", tone: "street" },
        { title: "排队买奶茶", line: "前面的人很多，你们聊起菜单上奇怪的新品。原本无聊的队伍，突然变得不太想前进。", mood: "cafe", effect: "love-story", tone: "date" },
        { title: "借伞的人", line: "雨落得很急，TA 把伞往你这边挪了一点。你说谢谢时，声音比平时小。", mood: "rain", effect: "love-petal", tone: "rain" },
        { title: "电梯一层", line: "电梯门打开又关上，你们只一起站了一层楼。可那短短几十秒，像一段故事的第一页。", mood: "meet", effect: "love-story", tone: "meet" }
      ],
      4: [
        { title: "记住名字", line: "你第二次听见 TA 的名字时，没有再问是哪两个字。这个小小的准确，让对方抬头看了你一眼。", mood: "campus", effect: "love-story", tone: "campus" },
        { title: "记住口味", line: "TA 随口说不太喝冰的，你却在点单时自然改成了温的。对方愣了一下，笑得很轻。", mood: "cafe", effect: "love-petal", tone: "date" },
        { title: "记住座位", line: "你开始知道 TA 常坐在哪个角落。路过时没打扰，只是脚步慢了一点。", mood: "campus", effect: "love-story", tone: "campus" },
        { title: "记住伞柄", line: "人群里那么多把伞，你先看见了那一把。你甚至还没看见人，心里已经有了答案。", mood: "rain", effect: "love-petal", tone: "rain" },
        { title: "记住笑点", line: "别人讲到一半，你已经知道 TA 会在哪一句笑出来。果然下一秒，TA 笑得眼睛弯了一下。", mood: "meet", effect: "love-story", tone: "meet" },
        { title: "记住路线", line: "你发现自己绕了一小段路，只为了可能碰见 TA。没有碰见也没关系，心情还是亮了一点。", mood: "street", effect: "love-petal", tone: "street" },
        { title: "记住歌单", line: "耳机里响起 TA 分享过的歌，你第一次认真听完了副歌。歌词忽然变得像在替你说话。", mood: "starlight", effect: "love-starlight", tone: "chat" },
        { title: "记住小事", line: "TA 提过的一件小烦恼，你隔天问了一句后来怎么样。那不是客套，是你真的放在了心上。", mood: "chat", effect: "love-story", tone: "chat" }
      ],
      8: [
        { title: "等消息", line: "手机亮了一下，你比想象中更快拿起来。看到不是 TA 的时候，又假装自己只是随便看一眼。", mood: "chat", effect: "love-story", tone: "chat" },
        { title: "点赞停留", line: "一个普通动态，你看了不止一遍。拇指悬在屏幕上，像在犹豫要不要留下一个太明显的信号。", mood: "chat", effect: "love-story", tone: "chat" },
        { title: "偶遇绕路", line: "明明不顺路，还是想从那边经过。真的遇见时，你又装作只是刚好路过。", mood: "street", effect: "love-petal", tone: "street" },
        { title: "小心试探", line: "一句玩笑话里藏着一点认真，说出口后你假装看别处。TA 接得很自然，你松了口气。", mood: "chat", effect: "love-story", tone: "chat" },
        { title: "帮忙占座", line: "你提前把旁边的位置留出来，理由找得很普通。TA 坐下时，你突然觉得今天的课没那么长。", mood: "campus", effect: "love-petal", tone: "campus" },
        { title: "同款咖啡", line: "你点了和 TA 一样的口味，说只是想试试。第一口其实有点苦，但你没有后悔。", mood: "cafe", effect: "love-story", tone: "date" },
        { title: "雨后同行", line: "雨停后地面还有水光，你们并肩绕开同一处积水。短短一段路，被你走得很慢。", mood: "rain", effect: "love-petal", tone: "rain" },
        { title: "晚风回复", line: "TA 的回复隔了很久才来，你却没有生气。你发现自己已经开始为对方找很多温柔的理由。", mood: "starlight", effect: "love-starlight", tone: "chat" }
      ],
      16: [
        { title: "正在输入", line: "那几个字闪了又停，心也跟着停了一下。你盯着聊天框，像在等一场小小的烟花。", mood: "chat", effect: "love-story", tone: "chat" },
        { title: "晚安多一秒", line: "晚安发出后，你们都没有立刻退出聊天。屏幕暗下去以前，又多了一句没什么意义却很甜的话。", mood: "chat", effect: "love-petal", tone: "chat" },
        { title: "表情包互传", line: "奇怪的是，连无聊都变得好玩。一个很傻的表情包，被你们反复发了好几轮。", mood: "chat", effect: "love-story", tone: "chat" },
        { title: "深夜长聊", line: "窗外安静下来，聊天框还亮着。你们从今天聊到小时候，又绕回明天要吃什么。", mood: "starlight", effect: "love-starlight", tone: "chat" },
        { title: "约饭试探", line: "一句“改天一起吃饭”变得不像客套。你们都没有追问是哪天，却都记住了这句话。", mood: "cafe", effect: "love-petal", tone: "date" },
        { title: "撤回之后", line: "TA 撤回了一句话，你没有问。过了一会儿，TA 又发来一句更认真也更笨拙的话。", mood: "chat", effect: "love-story", tone: "chat" },
        { title: "共享歌单", line: "你们把歌一首首发给对方，像在交换一点不敢明说的心情。某句歌词被同时截图。", mood: "starlight", effect: "love-starlight", tone: "chat" },
        { title: "语音三十秒", line: "一段三十秒的语音，你反复听了两遍。TA 的笑声在耳机里显得比文字更近。", mood: "chat", effect: "love-petal", tone: "chat" }
      ],
      32: [
        { title: "消息置顶", line: "你没有告诉 TA，但那个聊天框已经被悄悄放到最上面。每次打开手机，它都像一个小小的期待。", mood: "chat", effect: "love-story", tone: "chat" },
        { title: "雨夜电话", line: "外面下着雨，你们没有急着挂电话。很多话没有重点，却都像在慢慢靠近。", mood: "rain", effect: "love-starlight", tone: "rain" },
        { title: "错过末班", line: "你们聊到差点错过末班车，站台风很大。TA 说下次早点走，你却听出下次这两个字。", mood: "street", effect: "love-story", tone: "street" },
        { title: "生日零点", line: "你卡着零点发出祝福，字数删了又删。TA 回得很快，说你是第一个。", mood: "starlight", effect: "love-starlight", tone: "chat" },
        { title: "照片存下", line: "那张随手拍的合照其实有点糊，你还是保存了。相册里第一次多了一个不能随便删的人。", mood: "date", effect: "love-petal", tone: "date" },
        { title: "借口见面", line: "你们都找了一个不太高明的借口，只为了把线上聊天搬到现实里。见面时谁也没有拆穿。", mood: "cafe", effect: "love-story", tone: "date" },
        { title: "暧昧沉默", line: "沉默突然不再尴尬，反而像一段只属于你们的暗号。你们并肩走着，谁也没有急着说话。", mood: "street", effect: "love-petal", tone: "street" },
        { title: "朋友起哄", line: "有人开玩笑说你们很熟，你们同时笑了一下。那一瞬间，空气里的答案比玩笑更明显。", mood: "meet", effect: "love-story", tone: "meet" }
      ],
      64: [
        { title: "咖啡馆", line: "杯子轻碰，暖灯落在桌面上。你们终于不只是聊天记录里的两个人。", mood: "cafe", effect: "love-petal", tone: "date" },
        { title: "书店角落", line: "翻页声很轻，连沉默都不尴尬。你们站在同一排书架前，交换了很小声的推荐。", mood: "campus", effect: "love-story", tone: "campus" },
        { title: "下班等候", line: "TA 出来时一眼看见你，脚步明显快了一点。你把热饮递过去，说刚好顺路。", mood: "street", effect: "love-petal", tone: "street" },
        { title: "公园长椅", line: "风吹过树影，你们聊到天色暗下来。路灯亮起的时候，谁也没有提回去。", mood: "date", effect: "love-story", tone: "date" },
        { title: "夜市灯火", line: "人群很吵，你却听得清 TA 说话。你们分着一份小吃，笑得像已经认识很久。", mood: "street", effect: "love-starlight", tone: "street" },
        { title: "展览门口", line: "你们在一幅画前停得很久，解释各自看到的东西。差异没有拉开距离，反而多了话题。", mood: "date", effect: "love-story", tone: "date" },
        { title: "雨天共享伞", line: "伞不算大，距离却刚刚好。肩膀偶尔碰到时，你们都没有往外躲。", mood: "rain", effect: "love-petal", tone: "rain" },
        { title: "街角告别", line: "这次见面结束得太快，告别被你们拉长了好几次。走出几步后，你忍不住回头。", mood: "street", effect: "love-story", tone: "street" }
      ],
      128: [
        { title: "电影散场", line: "电影一般，但散场后的路走得很慢。真正被记住的不是剧情，是你们在路灯下讨论它的样子。", mood: "street", effect: "love-story", tone: "date" },
        { title: "晚餐靠窗", line: "你们坐在靠窗的位置，城市的光落在杯沿。点菜时互相让来让去，最后点了都想吃的。", mood: "cafe", effect: "love-petal", tone: "date" },
        { title: "雨天共享伞", line: "雨比预报来得早，你们挤在同一把伞下。走到门口时，两个人都慢了半步。", mood: "rain", effect: "love-petal", tone: "rain" },
        { title: "夜市灯火", line: "摊位的灯一盏盏亮起来，你们在人群里交换手里的小吃。那天的热闹后来变成一张很亮的回忆。", mood: "street", effect: "love-starlight", tone: "street" },
        { title: "公园长椅", line: "你们坐在长椅上看人来人往，说了很多没有结论的话。可是离开时，心里都更确定了一点。", mood: "date", effect: "love-story", tone: "date" },
        { title: "书店角落", line: "TA 把一本书递给你，说这本应该适合你。你接过时忽然觉得，被理解原来这么具体。", mood: "campus", effect: "love-petal", tone: "campus" },
        { title: "天台晚风", line: "城市很远，眼前的人很近。你们聊到风变凉，还是舍不得结束这次见面。", mood: "starlight", effect: "love-starlight", tone: "date" },
        { title: "散步回程", line: "导航显示只剩几分钟，你们却又绕了一条路。每一个红绿灯都像在帮你们多留一会儿。", mood: "street", effect: "love-story", tone: "street" }
      ],
      256: [
        { title: "每天早安", line: "早安不再是礼貌，而像一天开始时的确认。你们都知道，有个人醒来后会想到自己。", mood: "chat", effect: "love-story", tone: "chat" },
        { title: "午休碎片", line: "短短十分钟午休，TA 也会发来今天的小事。你们把生活切成很多碎片，一点点递给对方。", mood: "chat", effect: "love-petal", tone: "chat" },
        { title: "下雨提醒", line: "天气预报弹出来时，你先想到的是提醒 TA 带伞。消息发出后，对方回了一个很乖的收到。", mood: "rain", effect: "love-petal", tone: "rain" },
        { title: "共同日历", line: "你们开始认真对齐空闲时间。那些本来普通的日期，被标记后忽然有了期待。", mood: "home", effect: "love-story", tone: "home" },
        { title: "视频通话", line: "屏幕里的光照着两张有点疲惫的脸。你们没有说什么大事，只是陪彼此把一天收尾。", mood: "starlight", effect: "love-starlight", tone: "chat" },
        { title: "城市另一端", line: "隔着很远的路，你们还是讲起同一场雨。距离没有消失，但它不再让人慌。", mood: "street", effect: "love-story", tone: "street" }
      ],
      512: [
        { title: "不用明说", line: "TA 递过来的是你刚想拿的东西。你们都笑了，因为有些默契已经不用解释。", mood: "home", effect: "love-petal", tone: "home" },
        { title: "座位自然留出", line: "聚会时 TA 身边的空位像是默认留给你。你走过去坐下，所有人都很自然。", mood: "meet", effect: "love-story", tone: "meet" },
        { title: "眼神接住", line: "人群里你只看了 TA 一眼，TA 就知道你想离开一下。被懂得的感觉，比被关注更安稳。", mood: "street", effect: "love-petal", tone: "street" },
        { title: "同一把伞", line: "这次不用再问要不要一起走，伞已经自动往你这边倾斜。雨声像给你们留出的背景。", mood: "rain", effect: "love-petal", tone: "rain" },
        { title: "各自忙碌", line: "你们坐在同一张桌前做自己的事，偶尔抬头笑一下。没有一直说话，也没有觉得疏远。", mood: "cafe", effect: "love-story", tone: "date" },
        { title: "夜路并肩", line: "路灯把影子拉得很长，你们走得很慢。很多话没说出口，但都好像已经被听见。", mood: "starlight", effect: "love-starlight", tone: "street" }
      ],
      1024: [
        { title: "删了又写", line: "那句关键的话在输入框里来回改了很多遍。你第一次觉得，勇气原来会卡在发送键前。", mood: "chat", effect: "love-story", tone: "chat" },
        { title: "花店门口", line: "你在花店外站了很久，不确定哪一束才不显得太夸张。最后选的那束有点歪，但心意很认真。", mood: "cafe", effect: "love-petal", tone: "date" },
        { title: "朋友助攻", line: "朋友故意把你们留在一起，你们都看破了却没有拒绝。空气里多了一点被推着往前的勇气。", mood: "meet", effect: "love-story", tone: "meet" },
        { title: "路口红灯", line: "红灯很长，长到足够把心里的话排好顺序。你看着倒计时，决定绿灯前开口。", mood: "street", effect: "love-starlight", tone: "street" },
        { title: "告白前夜", line: "你提前想了很多句，最后发现最想说的其实很简单。夜里很安静，心跳却像提前到了明天。", mood: "starlight", effect: "love-starlight", tone: "chat" },
        { title: "未发送草稿", line: "草稿箱里躺着一段长长的话，你反复读到每个标点都熟悉。明天，它也许就不再只是草稿。", mood: "chat", effect: "love-story", tone: "chat" }
      ],
      2048: [
        { title: "路口告白", line: "你终于把话说完，声音没有想象中平稳。TA 没有立刻回答，只是先牵住了你的手。", mood: "street", effect: "love-petal", tone: "street" },
        { title: "花束递出", line: "花束有点歪，包装纸也被你攥皱了。TA 接过去时笑了，说你紧张得太明显。", mood: "cafe", effect: "love-petal", tone: "date" },
        { title: "聊天记录", line: "那句“我们试试看吧”停在屏幕中央。你盯着它看了很久，像确认一件刚刚发生的奇迹。", mood: "chat", effect: "love-story", tone: "chat" },
        { title: "牵手确认", line: "没有夸张台词，只是手没有再松开。街上的风很普通，却把这一天吹得很特别。", mood: "street", effect: "love-petal", tone: "street" },
        { title: "双向奔赴", line: "这一次，不是你一个人在靠近。你们终于把同样的心意说出口，故事从暗号变成约定。", mood: "vow", effect: "love-starlight", tone: "vow" },
        { title: "第一张合照", line: "你们拍了确认关系后的第一张照片，角度不完美，笑却很真。相册从这一刻开始有了新的分类。", mood: "date", effect: "love-story", tone: "date" }
      ],
      4096: [
        { title: "烟花夜", line: "烟花亮起时，你们同时看向对方。世界被照亮的一秒里，TA 的眼睛比天空更近。", mood: "starlight", effect: "love-starlight", tone: "date" },
        { title: "旅行车票", line: "目的地不重要，一起出发比较重要。车票夹在书里，像一张未来的书签。", mood: "street", effect: "love-story", tone: "street" },
        { title: "拥抱重逢", line: "见面前的路都显得太长，直到 TA 站在出口向你招手。拥抱发生得很自然，像终于把空缺补上。", mood: "date", effect: "love-petal", tone: "date" },
        { title: "纪念小物", line: "一个不起眼的小东西，被认真收好。它没有价格感，却像给热恋留下的一枚坐标。", mood: "home", effect: "love-story", tone: "home" }
      ],
      8192: [
        { title: "雨窗沉默", line: "你们第一次不知道该先说什么。雨水顺着玻璃往下滑，像把情绪也拖得很慢。", mood: "rain", effect: "love-story", tone: "rain" },
        { title: "小争执", line: "吵的不是那件小事，而是没说出口的在意。沉默之后，你们都意识到不能只靠猜。", mood: "rain", effect: "love-story", tone: "rain" },
        { title: "道歉消息", line: "删删改改很久，最后只发出一句真心话。TA 回得不快，但回来的那一刻，空气松了一点。", mood: "chat", effect: "love-petal", tone: "chat" },
        { title: "重新靠近", line: "不是没有分歧，是没有转身离开。你们坐下来慢慢说，把尖锐的话磨成能被理解的样子。", mood: "home", effect: "love-petal", tone: "home" }
      ],
      16384: [
        { title: "深夜长谈", line: "真正的问题被慢慢摊开，没有谁急着赢。你们第一次把理解放在了情绪前面。", mood: "starlight", effect: "love-starlight", tone: "chat" },
        { title: "共享伞", line: "这次不是浪漫，是一种被照顾的安心。雨很密，但你知道自己不会被落下。", mood: "rain", effect: "love-petal", tone: "rain" },
        { title: "低谷陪伴", line: "没有解决一切，但没有让对方一个人。很多爱不是答案，而是陪你一起等答案出现。", mood: "home", effect: "love-story", tone: "home" },
        { title: "日常确认", line: "你们不再用热烈证明喜欢，而是在一件件小事里确认彼此。稳定不是变淡，是终于安心。", mood: "home", effect: "love-petal", tone: "home" }
      ],
      32768: [
        { title: "朋友局公开", line: "TA 很自然地把你介绍给朋友，语气里有一点不藏的骄傲。你坐在人群里，忽然有了位置感。", mood: "meet", effect: "love-story", tone: "meet" },
        { title: "被朋友调侃", line: "朋友们起哄时，你们都没有急着否认。那种默认，比任何解释都更甜。", mood: "date", effect: "love-petal", tone: "date" },
        { title: "照顾社交", line: "TA 会在陌生话题里自然把你带进来。你不用努力证明什么，因为有人已经站在你这边。", mood: "home", effect: "love-story", tone: "home" },
        { title: "散场牵手", line: "聚会散场后，你们走在最后。热闹褪去，手心里的温度反而更清楚。", mood: "street", effect: "love-starlight", tone: "street" }
      ],
      65536: [
        { title: "第一段旅程", line: "行李箱轮子碾过站台，你们因为路线吵了一小会儿，又因为一碗热汤和好。旅行把喜欢照得更真实。", mood: "street", effect: "love-story", tone: "street" },
        { title: "海边日落", line: "风把头发吹乱，你们拍了很多不好看的照片。可每一张都像在说，当时真的很快乐。", mood: "starlight", effect: "love-starlight", tone: "date" },
        { title: "酒店小灯", line: "陌生城市的房间亮着小灯，你们摊开第二天的地图。未来计划第一次变得像可以触摸的纸。", mood: "home", effect: "love-petal", tone: "home" },
        { title: "迷路之后", line: "导航把你们带进一条安静小巷。迷路没有坏掉这天，反而让你们多了一段只有彼此知道的路。", mood: "street", effect: "love-story", tone: "street" }
      ],
      131072: [
        { title: "同一把钥匙", line: "门打开时，灯已经亮着。生活不再只是见面，而是有人在同一个屋檐下等你回来。", mood: "home", effect: "love-story", tone: "home" },
        { title: "早餐热气", line: "平淡的一天，从给对方留一份早餐开始。蒸汽升起来时，爱变成了可以吃下去的温度。", mood: "home", effect: "love-petal", tone: "home" },
        { title: "阳台植物", line: "你们一起养活了一盆小小的绿意。它长得不快，却让日子有了可被观察的变化。", mood: "home", effect: "love-petal", tone: "home" },
        { title: "家的灯", line: "夜里回来时，远处有灯，身边有人。你第一次觉得家不是地址，而是一种确定的抵达。", mood: "home", effect: "love-starlight", tone: "home" }
      ],
      262144: [
        { title: "家人饭桌", line: "饭桌上有些问题问得直接，TA 在桌下轻轻碰了碰你的手。那一下让你知道，自己不是一个人在应对。", mood: "home", effect: "love-story", tone: "home" },
        { title: "长辈红包", line: "长辈把红包塞过来时，你们都有点不好意思。礼节背后，是关系被认真看见。", mood: "vow", effect: "love-petal", tone: "vow" },
        { title: "厨房帮忙", line: "你们在厨房里笨手笨脚地洗菜，偶尔对视一笑。进入对方家庭的方式，原来也可以这么具体。", mood: "home", effect: "love-story", tone: "home" },
        { title: "离开后的路", line: "从家里出来后，你们都松了一口气，又忍不住笑。紧张过去，牵手变得比来时更稳。", mood: "street", effect: "love-starlight", tone: "street" }
      ],
      524288: [
        { title: "未来计划", line: "你们把城市、工作、家庭和自由都摊开来讲。不是每个答案都一样，但你们愿意一起找重叠的部分。", mood: "starlight", effect: "love-starlight", tone: "vow" },
        { title: "婚姻不是终点", line: "谈到婚姻时，你们没有只聊仪式，也聊柴米油盐和坏情绪。浪漫没有消失，只是长出了骨架。", mood: "home", effect: "love-story", tone: "home" },
        { title: "共同账户", line: "你们开始认真记录开销和计划。那些数字不再冰冷，因为背后是一段要一起负责的生活。", mood: "home", effect: "love-petal", tone: "home" },
        { title: "地图标记", line: "地图上被圈起很多地方，有想去的城市，也有可能生活的城市。未来不再抽象，它有了路线。", mood: "starlight", effect: "love-starlight", tone: "street" }
      ],
      1048576: [
        { title: "戒指口袋", line: "戒指在口袋里小小地硌着你，提醒你每一步都是真的。TA 还不知道，今晚的风会记住这件事。", mood: "vow", effect: "love-starlight", tone: "vow" },
        { title: "求婚时刻", line: "你说得没有排练时流利，甚至有一点颤。可 TA 眼睛红起来的时候，你知道最重要的话已经到了。", mood: "vow", effect: "love-starlight", tone: "vow" },
        { title: "朋友欢呼", line: "身边的人开始欢呼，你们却只看见彼此。那一瞬间很吵，也很安静。", mood: "starlight", effect: "love-petal", tone: "vow" },
        { title: "答应以后", line: "戒指戴上去后，你们都笑得有点傻。未来突然变得很大，又因为牵着手而不再吓人。", mood: "vow", effect: "love-starlight", tone: "vow" }
      ],
      2097152: [
        { title: "婚礼之前", line: "请柬、座位表、衣服和时间表把你们弄得手忙脚乱。忙乱里偶尔抬头，你们还是会笑。", mood: "vow", effect: "love-story", tone: "vow" },
        { title: "试穿礼服", line: "镜子里的样子有点陌生，身边的人却熟悉得让人安心。你们突然意识到，很多路真的走到了这里。", mood: "vow", effect: "love-starlight", tone: "vow" },
        { title: "誓词草稿", line: "誓词写了很多版，最后留下的都是朴素的句子。因为最深的承诺，往往不需要太花哨。", mood: "starlight", effect: "love-starlight", tone: "vow" },
        { title: "前夜灯光", line: "婚礼前夜，灯光很暖，你们没有说太多话。只是一起坐着，就已经像一种回答。", mood: "home", effect: "love-petal", tone: "home" }
      ],
      4194304: [
        { title: "长久相爱", line: "很多年后，你们依然会因为小事争执，也会在晚饭后一起散步。爱没有停在某一天，而是继续生活。", mood: "home", effect: "love-starlight", tone: "home" },
        { title: "相册翻页", line: "每一页都不是完美，却都真实。那些靠近、争执、和好，终于长成了你们自己的答案。", mood: "starlight", effect: "love-starlight", tone: "vow" },
        { title: "慢慢回家", line: "步子变慢之后，等待也变成一种浪漫。你们还是会为对方留灯，像很久以前那样。", mood: "home", effect: "love-petal", tone: "home" },
        { title: "一生的故事", line: "这不是童话结尾，也不是游戏终点。只是下一页开始前，你们又一次选择并肩往前走。", mood: "vow", effect: "love-starlight", tone: "vow" }
      ]
    };

    const moodClasses = ["mood-meet", "mood-campus", "mood-chat", "mood-date", "mood-cafe", "mood-rain", "mood-street", "mood-home", "mood-starlight", "mood-vow"];

    board.style.setProperty("--cols", size);
    board.style.setProperty("--rows", size);

    function emptyIndices() {
      return tiles.map((value, index) => value ? -1 : index).filter((index) => index >= 0);
    }

    function boardSignature() {
      return tiles.join(",");
    }

    function addFromTop(value = Math.random() > 0.88 ? 4 : 2) {
      const empty = emptyIndices();
      if (!empty.length) return -1;
      const topEmpty = tiles.slice(0, size)
        .map((cell, index) => cell ? -1 : index)
        .filter((index) => index >= 0);
      const candidates = topEmpty.length ? topEmpty : empty;
      const index = candidates[Math.floor(Math.random() * candidates.length)];
      tiles[index] = value;
      return index;
    }

    function romanceTile(value) {
      if (!value) return { glyph: "", label: "", rank: 0, color: "transparent", deep: "transparent", accent: "transparent", rim: "transparent" };
      let selected = tileStory[0];
      for (const item of tileStory) {
        if (value >= item[0]) selected = item;
      }
      const rank = Math.max(1, Math.min(tileStory.length, Math.round(Math.log2(value))));
      return { value, glyph: selected[1], label: selected[2], rank, color: selected[3], deep: selected[4], accent: selected[5], rim: selected[6] };
    }

    function maxTile() {
      return tiles.reduce((best, value) => Math.max(best, value || 0), 0);
    }

    function pickMergeScene(nextValue) {
      const finalStage = tileStory[tileStory.length - 1][0];
      const pool = narrativeScenes[nextValue] || narrativeScenes[finalStage];
      const tile = romanceTile(nextValue);
      const base = pool[Math.floor(Math.random() * pool.length)];
      return { ...base, value: nextValue, stage: tile.label, glyph: tile.glyph };
    }

    function applyMood(scene) {
      clearTimeout(moodTimer);
      for (const name of moodClasses) board.classList.remove(name);
      if (scene?.mood) {
        board.classList.add("mood-" + scene.mood);
        loveVfx.setMood(scene.mood);
      }
      moodTimer = window.setTimeout(() => {
        for (const name of moodClasses) board.classList.remove(name);
      }, 2800);
    }

    function pushStory(scene) {
      currentScene = scene;
      storyLog = [scene, ...storyLog].slice(0, 10);
      applyMood(scene);
    }

    function rememberScene(scene) {
      const variants = [
        {
          title: "还记得 · " + scene.title,
          line: "还记得之前的「" + scene.title + "」吗？" + scene.line
        },
        {
          title: "回忆 · " + scene.title,
          line: "回忆又翻到「" + scene.title + "」那一页：" + scene.line
        }
      ];
      const picked = variants[Math.floor(Math.random() * variants.length)];
      return { ...scene, title: picked.title, line: picked.line, memory: true };
    }

    function renderStoryCard() {
      const top = romanceTile(maxTile());
      const scene = currentScene || {
        stage: "开始",
        title: "滑动牵手",
        line: "合并相同数字，每一次升级都会翻开一页新的恋爱片段。",
        glyph: "♡"
      };
      const memories = memoryOpen ? '<div class="love-memory-drawer">' + (storyLog.length ? storyLog.map((item) => '<p><b>' + escapeText(item.stage) + ' · ' + escapeText(item.title) + '</b><span>' + escapeText(item.line) + '</span></p>').join("") : '<p><b>暂无回忆</b><span>先合成一次，故事会留在这里。</span></p>') + '</div>' : "";
      return '<div class="love-story-card">'
        + '<div class="love-story-kicker"><span>当前最高 ' + (top.value || 2) + ' · ' + escapeText(top.label || "初见") + '</span></div>'
        + '<h3>' + escapeText(scene.glyph || "♡") + ' ' + escapeText(scene.stage) + ' · ' + escapeText(scene.title) + '</h3>'
        + '<p>' + escapeText(scene.line) + '</p>'
        + '</div>' + memories;
    }

    function slideLine(line) {
      const values = line
        .map((value, source) => ({ value, source }))
        .filter((entry) => entry.value);
      const result = [];
      const mergedSlots = [];
      const mergedValues = [];
      const motions = [];
      let merged = 0;
      for (let i = 0; i < values.length; i += 1) {
        const destination = result.length;
        if (values[i + 1] && values[i].value === values[i + 1].value) {
          const nextValue = values[i].value * 2;
          result.push(nextValue);
          mergedSlots.push(destination);
          mergedValues.push(nextValue);
          merged += nextValue;
          motions.push(
            { source: values[i].source, destination, value: values[i].value, merged: true },
            { source: values[i + 1].source, destination, value: values[i + 1].value, merged: true }
          );
          i += 1;
        } else {
          result.push(values[i].value);
          motions.push({ source: values[i].source, destination, value: values[i].value, merged: false });
        }
      }
      while (result.length < size) result.push(0);
      return { cells: result, merged, mergedSlots, mergedValues, motions };
    }

    function canMove() {
      if (emptyIndices().length) return true;
      for (let i = 0; i < tiles.length; i += 1) {
        const col = i % size;
        const row = Math.floor(i / size);
        if (col < size - 1 && tiles[i] === tiles[i + 1]) return true;
        if (row < size - 1 && tiles[i] === tiles[i + size]) return true;
      }
      return false;
    }

    function playScene(scene, cellIndex, isFirstStageReveal = false) {
      triggerBoardEffect("love-story", { duration: 920 });
      triggerCellEffect(scene.effect, cellIndex, size, size, { duration: 940 });
      const target = board.querySelector('[data-index="' + cellIndex + '"]');
      const targetRect = target?.getBoundingClientRect();
      loveVfx.burst({
        x: targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth / 2,
        y: targetRect ? targetRect.top + targetRect.height / 2 : window.innerHeight / 2,
        mood: scene.mood,
        tone: scene.tone,
        count: isFirstStageReveal ? 28 : 18
      });
      showSceneBloom(scene);
      showSceneDanmaku(scene, isFirstStageReveal);
      if (isFirstStageReveal) showStageCelebration(scene);
    }

    function showSceneBloom(scene) {
      clearTimeout(sceneBloomTimer);
      board.querySelector(".love-scene-bloom")?.remove();
      const item = document.createElement("div");
      item.className = "love-scene-bloom";
      item.setAttribute("aria-hidden", "true");
      item.dataset.tone = scene.tone || scene.mood || "story";
      item.innerHTML = '<span>' + escapeText(scene.stage) + '</span>'
        + '<strong>' + escapeText(scene.glyph || "♡") + ' ' + escapeText(scene.title) + '</strong>';
      board.append(item);
      sceneBloomTimer = window.setTimeout(() => item.remove(), 760);
    }

    function showStageCelebration(scene) {
      clearTimeout(stageCelebrationTimer);
      document.querySelector(".love-stage-celebration")?.remove();
      const item = document.createElement("div");
      item.className = "love-stage-celebration love-cinematic-scene";
      item.setAttribute("aria-hidden", "true");
      item.dataset.tone = scene.tone || scene.mood || "story";
      item.dataset.mood = scene.mood || "meet";
      item.innerHTML = '<div class="cinematic-veil"></div>'
        + '<div class="cinematic-orbit"><i>' + escapeText(scene.glyph || "♡") + '</i></div>'
        + '<div class="cinematic-copy"><span>初次抵达 · ' + escapeText(scene.stage) + '</span>'
        + '<strong>' + escapeText(scene.title) + '</strong></div>';
      document.body.append(item);
      loveVfx.celebrate({ mood: scene.mood, tone: scene.tone });
      stageCelebrationTimer = window.setTimeout(() => item.remove(), 1080);
    }

    function clearSceneDanmaku() {
      sceneDanmakuTimers.forEach((timer) => clearTimeout(timer));
      sceneDanmakuTimers = [];
      document.querySelector(".love-scene-danmaku-layer")?.remove();
    }

    function danmakuLanes() {
      const rect = board.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 932;
      const controlsRect = controls?.getBoundingClientRect();
      const lowerStart = Math.max(rect.bottom + 32, (controlsRect?.bottom || rect.bottom) + 24);
      const lower = [lowerStart, lowerStart + 42, lowerStart + 84]
        .filter((lane) => lane < vh - 52);
      const upper = rect.top > 168 ? [rect.top - 86, rect.top - 44] : [];
      const candidates = [...lower, ...upper].map((lane) => Math.max(56, Math.min(vh - 64, lane)));
      const safeLanes = candidates.filter((lane, index, list) => {
        const outsideBoard = lane < rect.top - 28 || lane > rect.bottom + 18;
        return outsideBoard && list.indexOf(lane) === index;
      });
      return safeLanes.length ? safeLanes : [Math.max(56, Math.min(vh - 96, rect.bottom + 34))];
    }

    function showSceneDanmaku(scene, isFirstStageReveal = false) {
      let layer = document.querySelector(".love-scene-danmaku-layer");
      if (!layer) {
        layer = document.createElement("div");
        layer.className = "love-scene-danmaku-layer";
        layer.setAttribute("aria-hidden", "true");
        document.body.append(layer);
      }
      const lanes = danmakuLanes();
      const lines = isFirstStageReveal
        ? [scene.glyph + " " + scene.stage + " · " + scene.title, scene.line]
        : [scene.line];
      lines.forEach((text, index) => {
        const item = document.createElement("div");
        item.className = "love-scene-danmaku" + (isFirstStageReveal ? " is-milestone" : "");
        item.dataset.tone = scene.tone || scene.mood || "story";
        item.textContent = text;
        const lane = lanes.length ? lanes[(sceneDanmakuLane + index) % lanes.length] : 120 + index * 42;
        const duration = Math.min(9800, Math.max(6200, 5200 + text.length * 95));
        item.style.setProperty("--danmaku-y", lane + "px");
        item.style.setProperty("--danmaku-duration", duration + "ms");
        layer.append(item);
        const timer = window.setTimeout(() => {
          item.remove();
          sceneDanmakuTimers = sceneDanmakuTimers.filter((entry) => entry !== timer);
          if (!layer.children.length) layer.remove();
        }, duration + 260);
        sceneDanmakuTimers.push(timer);
      });
      sceneDanmakuLane += 1;
    }

    function playTileMotion(motions) {
      clearTimeout(tileMotionTimer);
      board.querySelector(".love-motion-layer")?.remove();
      const activeMotions = motions.filter((motion) => motion.from !== motion.to || motion.merged);
      if (!activeMotions.length) return;

      const cells = [...board.querySelectorAll(".merge-cell")];
      const boardRect = board.getBoundingClientRect();
      const layer = document.createElement("div");
      layer.className = "love-motion-layer";
      layer.setAttribute("aria-hidden", "true");

      activeMotions.forEach((motion, index) => {
        const fromRect = cells[motion.from]?.getBoundingClientRect();
        const toRect = cells[motion.to]?.getBoundingClientRect();
        if (!fromRect || !toRect) return;
        const ghost = document.createElement("span");
        const tile = romanceTile(motion.value);
        ghost.className = "love-motion-ghost" + (motion.merged ? " is-merge-ghost" : "");
        ghost.dataset.rank = String(tile.rank);
        ghost.style.cssText = "--tile:" + tile.color
          + ";--tile-deep:" + tile.deep
          + ";--tile-accent:" + tile.accent
          + ";--tile-rim:" + tile.rim
          + ";--rank:" + tile.rank
          + ";--ghost-x:" + (fromRect.left - boardRect.left) + "px"
          + ";--ghost-y:" + (fromRect.top - boardRect.top) + "px"
          + ";--ghost-w:" + fromRect.width + "px"
          + ";--ghost-h:" + fromRect.height + "px"
          + ";--ghost-dx:" + (toRect.left - fromRect.left) + "px"
          + ";--ghost-dy:" + (toRect.top - fromRect.top) + "px"
          + ";--ghost-delay:" + (motion.merged ? (index % 2) * 8 : 0) + "ms";
        ghost.innerHTML = tileContentMarkup(motion.value, "ghost-" + index + "-" + Date.now());
        layer.append(ghost);
      });

      board.append(layer);
      tileMotionTimer = window.setTimeout(() => layer.remove(), 280);
    }

    function showSwipeTrace(dir) {
      clearTimeout(swipeTraceTimer);
      board.querySelector(".love-swipe-trace")?.remove();
      const trace = document.createElement("span");
      trace.className = "love-swipe-trace is-" + dir;
      trace.setAttribute("aria-hidden", "true");
      trace.innerHTML = "<i></i>";
      board.append(trace);
      swipeTraceTimer = window.setTimeout(() => trace.remove(), 420);
    }

    function showBlockedBump(dir) {
      clearTimeout(bumpTimer);
      board.dataset.bump = dir;
      board.classList.remove("is-bumped");
      void board.offsetWidth;
      board.classList.add("is-bumped");
      bumpTimer = window.setTimeout(() => board.classList.remove("is-bumped"), 320);
    }

    function enableLoveTouchFeedback() {
      let active = false;
      let startX = 0;
      let startY = 0;

      const updateTouchPosition = (event) => {
        const rect = board.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100));
        const y = Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100));
        board.style.setProperty("--touch-x", x.toFixed(2) + "%");
        board.style.setProperty("--touch-y", y.toFixed(2) + "%");
      };

      const down = (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        active = true;
        startX = event.clientX;
        startY = event.clientY;
        updateTouchPosition(event);
        board.classList.add("is-touching");
      };

      const moveTouch = (event) => {
        if (!active) return;
        updateTouchPosition(event);
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        board.style.setProperty("--drag-x", Math.max(-1, Math.min(1, dx / 90)).toFixed(3));
        board.style.setProperty("--drag-y", Math.max(-1, Math.min(1, dy / 90)).toFixed(3));
        board.classList.toggle("is-dragging", Math.hypot(dx, dy) > 8);
      };

      const up = () => {
        if (!active) return;
        active = false;
        board.classList.remove("is-touching", "is-dragging");
        board.style.setProperty("--drag-x", "0");
        board.style.setProperty("--drag-y", "0");
        clearTimeout(touchFeedbackTimer);
        board.classList.add("is-touch-release");
        touchFeedbackTimer = window.setTimeout(() => board.classList.remove("is-touch-release"), 280);
      };

      board.addEventListener("pointerdown", down, { passive: true });
      window.addEventListener("pointermove", moveTouch, { passive: true });
      window.addEventListener("pointerup", up, { passive: true });
      window.addEventListener("pointercancel", up, { passive: true });
      return () => {
        board.removeEventListener("pointerdown", down);
        window.removeEventListener("pointermove", moveTouch);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
    }

    function move(dir) {
      const before = boardSignature();
      let mergedThisMove = 0;
      const mergedCells = [];
      const mergeScenes = [];
      const tileMotions = [];
      showSwipeTrace(dir);
      for (let i = 0; i < size; i += 1) {
        const rawIndices = [];
        for (let j = 0; j < size; j += 1) {
          const idx = dir === "left" || dir === "right" ? i * size + j : j * size + i;
          rawIndices.push(idx);
        }
        const orientedIndices = dir === "right" || dir === "down" ? rawIndices.slice().reverse() : rawIndices;
        const shifted = slideLine(orientedIndices.map((idx) => tiles[idx]));
        mergedThisMove += shifted.merged;
        shifted.motions.forEach((motion) => {
          tileMotions.push({
            from: orientedIndices[motion.source],
            to: orientedIndices[motion.destination],
            value: motion.value,
            merged: motion.merged
          });
        });
        for (let j = 0; j < size; j += 1) tiles[orientedIndices[j]] = shifted.cells[j];
        shifted.mergedSlots.forEach((slot, index) => {
          const cellIndex = orientedIndices[slot];
          const nextValue = shifted.mergedValues[index];
          mergedCells.push(cellIndex);
          mergeScenes.push({ cellIndex, nextValue, scene: pickMergeScene(nextValue) });
        });
      }

      if (boardSignature() === before) {
        lastMergeCells = [];
        lastMotionTargets = [];
        lastMoveDir = dir;
        lastSpawnCell = spawnOnBlockedInput && emptyIndices().length ? addFromTop() : -1;
        render();
        if (lastSpawnCell >= 0) triggerCellEffect("love-top-spawn", lastSpawnCell, size, size, { duration: 620 });
        else {
          showBlockedBump(dir);
          triggerBoardEffect("love-bump", { duration: 360 });
        }
        return;
      }

      lastMoveDir = dir;
      lastMergeCells = mergedCells;
      lastMotionTargets = [...new Set(tileMotions
        .filter((motion) => motion.from !== motion.to || motion.merged)
        .map((motion) => motion.to))];
      lastSpawnCell = addFromTop();
      let featured = null;
      if (mergedThisMove) {
        points += mergedThisMove;
        loveTempo = Math.max(0.58, 1 - Math.min(5, mergedCells.length) * 0.06);
        featured = mergeScenes.sort((a, b) => b.nextValue - a.nextValue)[0];
        if (featured) {
          const isFirstStageReveal = featured.nextValue > bestValue && !seenStageValues.has(featured.nextValue);
          if (!isFirstStageReveal && seenStageValues.has(featured.nextValue)) featured.scene = rememberScene(featured.scene);
          featured.isFirstStageReveal = isFirstStageReveal;
          bestValue = Math.max(bestValue, featured.nextValue);
          seenStageValues.add(featured.nextValue);
          pushStory(featured.scene);
        }
      } else {
        loveTempo = 1;
      }
      render();
      playTileMotion(tileMotions);
      if (featured) playScene(featured.scene, featured.cellIndex, featured.isFirstStageReveal);
      if (!mergedThisMove && lastSpawnCell >= 0) triggerCellEffect("love-top-spawn", lastSpawnCell, size, size, { duration: 620 });
    }

    function toggleMemory() {
      memoryOpen = !memoryOpen;
      render();
    }

    function heartMarkup(index) {
      const uid = "love-heart-" + String(index).replace(/[^a-zA-Z0-9_-]/g, "-");
      const path = "M50 87C44 79 7 59 7 32C7 15 20 5 35 8C43 9 48 15 50 22C52 15 57 9 65 8C80 5 93 15 93 32C93 59 56 79 50 87Z";
      return '<svg class="heart-core" viewBox="0 0 100 94" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true">'
        + '<defs><linearGradient id="' + uid + '-fill" x1="19" y1="9" x2="82" y2="88" gradientUnits="userSpaceOnUse">'
        + '<stop class="heart-stop-light" offset="0"></stop><stop class="heart-stop-mid" offset="0.48"></stop><stop class="heart-stop-deep" offset="1"></stop></linearGradient>'
        + '<radialGradient id="' + uid + '-glow" cx="32%" cy="22%" r="68%"><stop class="heart-glow-light" offset="0"></stop><stop class="heart-glow-clear" offset="1"></stop></radialGradient>'
        + '<linearGradient id="' + uid + '-bevel" x1="22" y1="8" x2="74" y2="88" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="rgba(255,255,255,.78)"></stop><stop offset=".42" stop-color="rgba(255,255,255,.06)"></stop><stop offset="1" stop-color="rgba(255,214,151,.36)"></stop></linearGradient></defs>'
        + '<path class="heart-aura" d="' + path + '"></path>'
        + '<path class="heart-shadow" d="' + path + '"></path>'
        + '<path class="heart-main" fill="url(#' + uid + '-fill)" d="' + path + '"></path>'
        + '<path class="heart-bevel" stroke="url(#' + uid + '-bevel)" d="M50 81C42 72 14 55 14 33C14 21 23 13 34 14C43 15 48 23 50 29C52 23 57 15 66 14C77 13 86 21 86 33C86 55 58 72 50 81Z"></path>'
        + '<path class="heart-glow" fill="url(#' + uid + '-glow)" d="' + path + '"></path>'
        + '<path class="heart-rim" d="' + path + '"></path>'
        + '<path class="heart-gloss" d="M26 18C19 22 17 30 19 37C21 43 25 47 31 50C27 39 30 28 39 21C34 17 30 16 26 18Z"></path>'
        + '<path class="heart-highlight" d="M31 15C38 13 44 18 47 24"></path>'
        + '<circle class="heart-spark" cx="70" cy="21" r="2.8"></circle><circle class="heart-spark is-small" cx="77" cy="30" r="1.55"></circle></svg>';
    }

    function tileContentMarkup(value, key) {
      const tile = romanceTile(value);
      const digits = String(value).length;
      return heartMarkup(key)
        + '<span class="tile-glyph">' + tile.glyph + '</span>'
        + '<em class="tile-number digits-' + digits + '">' + value + '</em>'
        + '<small class="tile-label">' + escapeText(tile.label) + '</small>';
    }

    function render() {
      const moveVectors = { left: ["-1", "0"], right: ["1", "0"], up: ["0", "-1"], down: ["0", "1"], start: ["0", "0"] };
      const [moveX, moveY] = moveVectors[lastMoveDir] || moveVectors.start;
      const mergeSet = new Set(lastMergeCells);
      const motionTargetSet = new Set(lastMotionTargets);
      const top = romanceTile(maxTile());
      bestValue = Math.max(bestValue, top.value || 2);
      board.style.setProperty("--affinity-alpha", Math.min(0.62, Math.log2(Math.max(2, bestValue)) / 18).toFixed(3));
      board.style.setProperty("--meet-alpha", Math.min(0.58, storyLog.length / 12).toFixed(3));
      board.style.setProperty("--trust-alpha", Math.min(0.62, Math.log2(Math.max(2, bestValue)) / 16).toFixed(3));
      board.style.setProperty("--tempo", loveTempo.toFixed(2));
      board.style.setProperty("--move-x", moveX);
      board.style.setProperty("--move-y", moveY);
      board.dataset.move = lastMoveDir;
      board.dataset.showPhase = top.label;
      board.classList.toggle("is-accelerated", lastMergeCells.length >= 2);
      board.classList.toggle("is-vow-ready", bestValue >= 2048);
      board.classList.remove("is-date-ready", "is-duo-mode", "is-chapter-mode");
      board.innerHTML = tiles.map((value, index) => {
        const tile = romanceTile(value);
        const hot = value && value >= 128 ? "is-hot" : "";
        const collision = mergeSet.has(index) ? "is-collision" : "";
        const newborn = index === lastSpawnCell ? "is-new is-top-spawn" : "";
        const movingTarget = motionTargetSet.has(index) ? "is-motion-target" : "";
        const vowTile = value && value >= 1024 ? "is-vow" : "";
        const digits = value ? String(value).length : 0;
        const style = value ? ' style="--tile:' + tile.color + ';--tile-deep:' + tile.deep + ';--tile-accent:' + tile.accent + ';--tile-rim:' + tile.rim + ';--rank:' + tile.rank + ';--digits:' + digits + ';"' : "";
        const content = value ? tileContentMarkup(value, index) : "";
        return '<span class="merge-cell love-tile v' + (value || 0) + ' ' + hot + ' ' + collision + ' ' + newborn + ' ' + movingTarget + ' ' + vowTile + '" data-index="' + index + '" data-value="' + (value || "") + '" data-rank="' + tile.rank + '" data-digits="' + digits + '" data-romance="' + escapeText(tile.label) + '"' + style + '>' + content + '</span>';
      }).join("");
      setScore(points);
      setStatus(canMove() ? "滑动合并相同爱心，推进下一段关系" : "棋盘已满，点重遇再开始一段故事");
      meta.innerHTML = renderStoryCard();
    }

    function restart() {
      clearTimeout(moodTimer);
      clearTimeout(sceneBloomTimer);
      clearTimeout(stageCelebrationTimer);
      clearTimeout(tileMotionTimer);
      clearTimeout(swipeTraceTimer);
      clearTimeout(touchFeedbackTimer);
      clearTimeout(bumpTimer);
      board.querySelector(".love-scene-bloom")?.remove();
      board.querySelector(".love-motion-layer")?.remove();
      board.querySelector(".love-swipe-trace")?.remove();
      document.querySelector(".love-stage-celebration")?.remove();
      clearSceneDanmaku();
      for (const name of moodClasses) board.classList.remove(name);
      tiles = Array(size * size).fill(0);
      points = 0;
      bestValue = 2;
      seenStageValues = new Set([2]);
      sceneDanmakuLane = 0;
      lastMoveDir = "start";
      lastMergeCells = [];
      lastMotionTargets = [];
      lastSpawnCell = -1;
      loveTempo = 1;
      storyLog = [];
      currentScene = pickMergeScene(2);
      memoryOpen = false;
      applyMood(currentScene);
      addFromTop();
      lastSpawnCell = addFromTop();
      render();
    }

    const restartControl = button("重遇", restart, true);
    restartControl.innerHTML = '<span aria-hidden="true">↻</span><span>重遇</span>';
    const memoryControl = button("回忆", toggleMemory);
    memoryControl.innerHTML = '<span aria-hidden="true">▤</span><span>回忆</span>';
    restart();
    const offKey = keyHandler({ ArrowLeft: () => move("left"), ArrowRight: () => move("right"), ArrowUp: () => move("up"), ArrowDown: () => move("down") });
    const offSwipe = enableSwipe({ left: () => move("left"), right: () => move("right"), up: () => move("up"), down: () => move("down") });
    const offTouchFeedback = enableLoveTouchFeedback();
    return () => {
      clearTimeout(moodTimer);
      clearTimeout(sceneBloomTimer);
      clearTimeout(stageCelebrationTimer);
      clearTimeout(tileMotionTimer);
      clearTimeout(swipeTraceTimer);
      clearTimeout(touchFeedbackTimer);
      clearTimeout(bumpTimer);
      document.querySelector(".love-stage-celebration")?.remove();
      clearSceneDanmaku();
      loveVfx.destroy();
      offKey();
      offSwipe();
      offTouchFeedback();
    };
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
