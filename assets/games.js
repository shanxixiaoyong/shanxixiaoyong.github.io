const soloGame = document.querySelector("#solo-game");

if (soloGame) {
  const title = document.querySelector("#game-title");
  const kind = document.querySelector("#game-kind");
  const score = document.querySelector("#game-score");
  const status = document.querySelector("#game-status");
  const board = document.querySelector("#game-board");
  const controls = document.querySelector("#game-controls");
  const meta = document.querySelector("#game-meta");
  let cleanup = () => {};
  let activeId = "";
  let metaItems = [];

  const games = [
    {
      id: "merge2048",
      name: "心动2048",
      kind: "Love",
      theme: "love-2048",
      boardClass: "board-love-2048",
      tagline: "滑动牵手，合并心意，每次升级翻开一段随机故事。",
      feature: "Stage / Story / Bloom",
      run: run2048
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
    const isLoveBoard = board.classList.contains("board-love-2048");
    const effectLimit = options.effectLimit || (isLoveBoard ? 4 : Number.POSITIVE_INFINITY);
    if (Number.isFinite(effectLimit)) {
      const activeEffects = [...board.querySelectorAll(":scope > .board-effect")];
      activeEffects.slice(0, Math.max(0, activeEffects.length - effectLimit + 1)).forEach((effect) => effect.remove());
    }
    const item = document.createElement("span");
    item.className = `board-effect effect-${name}`;
    item.setAttribute("aria-hidden", "true");
    if (Number.isFinite(options.x)) item.style.setProperty("--fx-x", `${options.x}%`);
    if (Number.isFinite(options.y)) item.style.setProperty("--fx-y", `${options.y}%`);
    if (options.text) item.textContent = options.text;
    const duration = options.duration || 760;
    board.append(item);
    window.setTimeout(() => item.remove(), duration);
    if (!isLoveBoard) {
      const fxClass = `fx-${name}`;
      board.classList.remove(fxClass);
      void board.offsetWidth;
      board.classList.add(fxClass);
      window.setTimeout(() => board.classList.remove(fxClass), duration);
    }
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

  function resetStage(game) {
    cleanup();
    cleanup = () => {};
    activeId = game.id;
    document.body.dataset.arcadeTheme = game.theme;
    title.textContent = game.name;
    kind.textContent = game.kind;
    setScore(0);
    setStatus(game.tagline);
    setMeta([game.feature]);
    board.innerHTML = "";
    controls.innerHTML = "";
    board.removeAttribute("style");
    board.className = `arcade-board is-${game.id} ${game.boardClass}`;
    board.dataset.theme = game.theme;
    cleanup = game.run();
    board.focus({ preventScroll: true });
  }

  resetStage(games.find((game) => game.id === soloGame?.dataset.game) || games[0]);

  function run2048() {
    const engine = window.Love2048Engine;
    if (!engine) throw new Error("Love2048Engine is required for Love 2048");
    const { TILE } = engine;
    const size = 5;
    let tiles = [];
    let points = 0;
    let bestValue = 2;
    let seenStageValues = new Set([2]);
    let directorState = engine.createDirectorState();
    let miracleUsed = false;
    let milestoneGraceTurns = 0;
    let lastMergeCells = [];
    let lastSpawnCell = -1;
    let storyLog = [];
    let currentScene = null;
    let memoryOpen = false;
    let moodTimer = 0;
    let stageCelebrationTimer = 0;
    let tileMotionTimer = 0;
    let bumpTimer = 0;
    let lastMotionTargets = [];
    let cellNodes = [];
    let motionGeometry = null;
    let storyRenderKey = "";
    let renderedScore = -1;
    const spawnOnBlockedInput = true;

    const loveVfxFactory = window.Love2048Vfx?.createLoveVfx;
    const loveVfx = loveVfxFactory
      ? window.Love2048Vfx.createLoveVfx({ root: document.body, mood: "meet", ambient: false })
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

    function isOrdinaryTile(value) {
      return typeof value === "number" && value > 0;
    }

    function hasFateTile() {
      return tiles.some((value) => value === TILE.FATE || value === TILE.DESTINY);
    }

    function conflictCracks(value) {
      if (value === TILE.CONFLICT_2) return 2;
      if (value === TILE.CONFLICT_1) return 1;
      return 0;
    }

    function hasConflictTile() {
      return tiles.some((value) => conflictCracks(value) > 0);
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
      return tiles.reduce((best, value) => isOrdinaryTile(value) ? Math.max(best, value) : best, 0);
    }

    function pickMilestoneScene(nextValue) {
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
      storyRenderKey = "";
      applyMood(scene);
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

    const sceneBackdropSources = [
      "assets/love-scenes/rain-night.webp",
      "assets/love-scenes/cafe-evening.webp",
      "assets/love-scenes/campus-library.webp",
      "assets/love-scenes/city-night.webp",
      "assets/love-scenes/warm-home.webp",
      "assets/love-scenes/starlight-vow.webp"
    ];

    function preloadSceneBackdrops() {
      const load = () => sceneBackdropSources.forEach((source) => {
        const image = new Image();
        image.decoding = "async";
        image.src = source;
      });
      if ("requestIdleCallback" in window) window.requestIdleCallback(load, { timeout: 700 });
      else window.setTimeout(load, 80);
    }

    function sceneBackdropKey(scene) {
      const text = `${scene?.title || ""} ${scene?.line || ""}`;
      if (/雨|伞|rain|storm/i.test(text) || scene?.mood === "rain") return "rain";
      if (/咖啡|奶茶|晚餐|甜点|花店|cafe/i.test(text) || scene?.mood === "cafe") return "cafe";
      if (/图书|书店|校园|上课|座位|毕业|library|campus/i.test(text) || scene?.mood === "campus") return "campus";
      if (/家|同居|厨房|钥匙|拖鞋|阳台|日常|home/i.test(text) || scene?.mood === "home") return "home";
      if (/婚|求婚|戒指|誓|未来|星|烟花|月|天台|纪念|vow|star/i.test(text) || ["starlight", "vow"].includes(scene?.mood)) return "starlight";
      return "city";
    }

    function playMilestoneScene(scene, cellIndex) {
      triggerBoardEffect("love-story", { duration: 840 });
      triggerCellEffect(scene.effect, cellIndex, size, size, { duration: 860 });
      const target = board.querySelector('[data-index="' + cellIndex + '"]');
      const targetRect = target?.getBoundingClientRect();
      loveVfx.burst({
        x: targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth / 2,
        y: targetRect ? targetRect.top + targetRect.height / 2 : window.innerHeight / 2,
        mood: scene.mood,
        tone: scene.tone,
        count: 20
      });
      clearTimeout(stageCelebrationTimer);
      document.querySelector(".love-stage-celebration")?.remove();
      const item = document.createElement("div");
      item.className = "love-stage-celebration love-cinematic-scene";
      item.setAttribute("role", "status");
      item.setAttribute("aria-live", "polite");
      item.setAttribute("aria-atomic", "true");
      item.dataset.tone = scene.tone || scene.mood || "story";
      item.dataset.mood = scene.mood || "meet";
      item.setAttribute("data-backdrop", sceneBackdropKey(scene));
      item.innerHTML = '<div class="cinematic-backdrop"></div>'
        + '<div class="cinematic-atmosphere"><i></i><i></i><i></i></div>'
        + '<div class="cinematic-copy"><span>首次解锁 · ' + escapeText(scene.stage) + '</span>'
        + '<strong><i>' + escapeText(scene.glyph || "♡") + '</i>' + escapeText(scene.title) + '</strong>'
        + '<p>' + escapeText(scene.line) + '</p></div>'
        + '<div class="cinematic-timeline"></div>';
      document.body.append(item);
      loveVfx.celebrate({ mood: scene.mood, tone: scene.tone });
      stageCelebrationTimer = window.setTimeout(() => item.remove(), 2680);
    }

    function playRepeatMerge(cellIndex) {
      triggerCellEffect("love-merge", cellIndex, size, size, { duration: 260 });
    }

    function playTileMotion(motions) {
      clearTimeout(tileMotionTimer);
      board.querySelector(".love-motion-layer")?.remove();
      const activeMotions = motions.filter((motion) => motion.from !== motion.to);
      if (!activeMotions.length) return;

      const geometry = boardMotionGeometry();
      const layer = document.createElement("div");
      layer.className = "love-motion-layer";
      layer.setAttribute("aria-hidden", "true");

      activeMotions.forEach((motion, index) => {
        const fromRect = geometry[motion.from];
        const toRect = geometry[motion.to];
        if (!fromRect || !toRect) return;
        const special = specialTile(motion.value);
        if (!special && !isOrdinaryTile(motion.value)) return;
        const ghost = document.createElement("span");
        const tile = isOrdinaryTile(motion.value) ? romanceTile(motion.value) : null;
        ghost.className = [
          "love-motion-ghost",
          motion.merged ? "is-merge-ghost" : "",
          special?.className || ""
        ].filter(Boolean).join(" ");
        ghost.dataset.rank = String(tile?.rank || 0);
        if (special?.kind === "fate") ghost.dataset.special = "fate";
        if (special?.kind === "conflict") ghost.dataset.special = "conflict";
        ghost.style.cssText = (tile ? "--tile:" + tile.color
          + ";--tile-deep:" + tile.deep
          + ";--tile-accent:" + tile.accent
          + ";--tile-rim:" + tile.rim
          + ";--rank:" + tile.rank + ";" : "")
          + "--ghost-x:" + fromRect.x + "px"
          + ";--ghost-y:" + fromRect.y + "px"
          + ";--ghost-w:" + fromRect.width + "px"
          + ";--ghost-h:" + fromRect.height + "px"
          + ";--ghost-dx:" + (toRect.x - fromRect.x) + "px"
          + ";--ghost-dy:" + (toRect.y - fromRect.y) + "px"
          + ";--ghost-delay:" + (motion.merged ? (index % 2) * 8 : 0) + "ms";
        ghost.innerHTML = motionGhostMarkup(motion.value);
        layer.append(ghost);
      });

      board.append(layer);
      tileMotionTimer = window.setTimeout(() => layer.remove(), 190);
    }

    function showBlockedBump(dir) {
      clearTimeout(bumpTimer);
      board.dataset.bump = dir;
      board.classList.remove("is-bumped");
      window.requestAnimationFrame(() => board.classList.add("is-bumped"));
      bumpTimer = window.setTimeout(() => board.classList.remove("is-bumped"), 320);
    }

    function resolveDestinyTiles() {
      const destinyIndex = tiles.indexOf(TILE.DESTINY);
      if (destinyIndex < 0) return null;
      const result = engine.resolveDestiny(tiles, { miracleUsed });
      tiles = result.tiles;
      miracleUsed = result.state.miracleUsed;
      directorState = {
        ...directorState,
        fatePhase: "none",
        secondFateTurns: 0
      };
      if (isOrdinaryTile(result.upgradedValue)) points += result.upgradedValue;
      return {
        ...result,
        effectIndex: result.upgradedIndex >= 0 ? result.upgradedIndex : destinyIndex,
        effectName: result.miracle ? "miracle" : "destiny"
      };
    }

    function resolveFateDeadlock() {
      if (engine.canMove(tiles, size)) return null;
      const fateIndices = tiles
        .map((value, index) => value === TILE.FATE ? index : -1)
        .filter((index) => index >= 0);
      if (!fateIndices.length) return null;
      tiles = tiles.map((value) => value === TILE.FATE ? 0 : value);
      tiles[fateIndices[0]] = TILE.DESTINY;
      return resolveDestinyTiles();
    }

    function repairConflictAfterMerges(ordinaryMergeCount) {
      if (ordinaryMergeCount <= 0) return null;
      const beforeIndex = tiles.findIndex((value) => conflictCracks(value) > 0);
      if (beforeIndex < 0) return null;
      const beforeCracks = conflictCracks(tiles[beforeIndex]);
      tiles = engine.repairConflict(tiles, ordinaryMergeCount).tiles;
      const afterIndex = tiles.findIndex((value) => conflictCracks(value) > 0);
      const afterCracks = afterIndex >= 0 ? conflictCracks(tiles[afterIndex]) : 0;
      if (afterCracks === beforeCracks) return null;
      return { index: afterIndex >= 0 ? afterIndex : beforeIndex };
    }

    function registerStageResults(results) {
      const ordinaryResults = results.filter((result) => isOrdinaryTile(result.nextValue));
      if (!ordinaryResults.length) return null;
      const featured = ordinaryResults.slice().sort((left, right) => right.nextValue - left.nextValue)[0];
      const isFirstStageReveal = featured.nextValue > bestValue && !seenStageValues.has(featured.nextValue);
      bestValue = Math.max(bestValue, featured.nextValue);
      ordinaryResults.forEach((result) => seenStageValues.add(result.nextValue));
      if (isFirstStageReveal) {
        milestoneGraceTurns = 8;
        return { kind: "milestone", ...featured };
      }
      return { kind: "repeat", ...featured };
    }

    function preferStageEvent(current, next) {
      if (!next) return current;
      if (!current || next.kind === "milestone") return next;
      return current;
    }

    function prepareStageEvent(event) {
      if (!event || event.kind !== "milestone") return event;
      const scene = pickMilestoneScene(event.nextValue);
      pushStory(scene);
      return { ...event, scene };
    }

    function playStageEvent(event) {
      if (!event) return;
      if (event.kind === "milestone") playMilestoneScene(event.scene, event.cellIndex);
      else if (event.source === "merge") playRepeatMerge(event.cellIndex);
    }

    function playResolutionEffect(result) {
      if (!result) return;
      if (result.effectName === "miracle") {
        triggerCellEffect("love-miracle", result.effectIndex, size, size, { duration: 920 });
      } else {
        triggerCellEffect("love-destiny", result.effectIndex, size, size, { duration: 640 });
      }
    }

    function move(dir) {
      const before = boardSignature();
      const fateSequenceWasActive = directorState.fatePhase !== "none" || hasFateTile();
      let mergedThisMove = 0;
      let ordinaryMergeCount = 0;
      const mergedCells = [];
      const mergeResults = [];
      const tileMotions = [];
      for (let i = 0; i < size; i += 1) {
        const rawIndices = [];
        for (let j = 0; j < size; j += 1) {
          const idx = dir === "left" || dir === "right" ? i * size + j : j * size + i;
          rawIndices.push(idx);
        }
        const orientedIndices = dir === "right" || dir === "down" ? rawIndices.slice().reverse() : rawIndices;
        const shifted = engine.slideLine(orientedIndices.map((idx) => tiles[idx]), size);
        mergedThisMove += shifted.merged;
        ordinaryMergeCount += shifted.ordinaryMergeCount;
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
          if (isOrdinaryTile(nextValue)) mergeResults.push({ cellIndex, nextValue, source: "merge" });
        });
      }

      if (boardSignature() === before) {
        lastMergeCells = [];
        lastMotionTargets = [];
        lastSpawnCell = spawnOnBlockedInput && emptyIndices().length ? addFromTop() : -1;
        const safetyResolution = resolveFateDeadlock();
        const stageEvent = prepareStageEvent(safetyResolution && isOrdinaryTile(safetyResolution.upgradedValue)
          ? registerStageResults([{
            cellIndex: safetyResolution.upgradedIndex,
            nextValue: safetyResolution.upgradedValue,
            source: "destiny"
          }])
          : null);
        render();
        playResolutionEffect(safetyResolution);
        playStageEvent(stageEvent);
        if (lastSpawnCell < 0 && !safetyResolution) {
          showBlockedBump(dir);
          triggerBoardEffect("love-bump", { duration: 360 });
        }
        return;
      }

      lastMergeCells = mergedCells;
      lastMotionTargets = [...new Set(tileMotions
        .filter((motion) => motion.from !== motion.to || motion.merged)
        .map((motion) => motion.to))];
      milestoneGraceTurns = Math.max(0, milestoneGraceTurns - 1);
      points += mergedThisMove;

      const destinyResolution = resolveDestinyTiles();
      if (destinyResolution && isOrdinaryTile(destinyResolution.upgradedValue)) {
        mergeResults.push({
          cellIndex: destinyResolution.upgradedIndex,
          nextValue: destinyResolution.upgradedValue,
          source: "destiny"
        });
      }
      const reconcileEffect = repairConflictAfterMerges(ordinaryMergeCount);
      let stageEvent = registerStageResults(mergeResults);
      if (stageEvent?.kind === "milestone" && !fateSequenceWasActive) {
        directorState = { ...directorState, firstFateTurns: 0 };
      }

      const spawn = engine.chooseSpawn(directorState, {
        highestTile: maxTile(),
        emptyCount: emptyIndices().length,
        ordinaryMergeCount,
        inputBlocked: false,
        fateActive: hasFateTile(),
        conflictActive: hasConflictTile(),
        milestoneGraceTurns
      });
      directorState = spawn.state;
      const spawnValue = spawn.kind === "fate"
        ? TILE.FATE
        : spawn.kind === "conflict" ? TILE.CONFLICT_2 : undefined;
      lastSpawnCell = addFromTop(spawnValue);

      const safetyResolution = resolveFateDeadlock();
      if (safetyResolution && isOrdinaryTile(safetyResolution.upgradedValue)) {
        stageEvent = preferStageEvent(stageEvent, registerStageResults([{
          cellIndex: safetyResolution.upgradedIndex,
          nextValue: safetyResolution.upgradedValue,
          source: "destiny"
        }]));
      }
      stageEvent = prepareStageEvent(stageEvent);

      render();
      playTileMotion(tileMotions);
      playResolutionEffect(destinyResolution);
      playResolutionEffect(safetyResolution);
      if (reconcileEffect) {
        triggerCellEffect("love-reconcile", reconcileEffect.index, size, size, { duration: 560 });
      }
      if (spawn.kind === "conflict" && lastSpawnCell >= 0) {
        triggerCellEffect("love-conflict", lastSpawnCell, size, size, { duration: 620 });
      }
      playStageEvent(stageEvent);
    }

    function toggleMemory() {
      memoryOpen = !memoryOpen;
      storyRenderKey = "";
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

    function specialTile(value) {
      if (value === TILE.FATE || value === TILE.DESTINY) {
        return { kind: "fate", className: "is-fate", label: "命运碎片" };
      }
      const cracks = conflictCracks(value);
      if (cracks) return { kind: "conflict", className: "is-conflict", label: "心结", cracks };
      return null;
    }

    function specialTileMarkup(value) {
      const special = specialTile(value);
      if (special?.kind === "fate") {
        return '<span class="special-heart fate-hearts" data-special="fate" aria-hidden="true"><i></i><i></i></span>'
          + '<small class="tile-label">' + escapeText(special.label) + '</small>';
      }
      if (special?.kind === "conflict") {
        return '<span class="special-heart conflict-heart" data-special="conflict" aria-hidden="true"></span>'
          + '<em class="conflict-crack-count" data-cracks="' + special.cracks + '">' + special.cracks + '</em>'
          + '<small class="tile-label">' + escapeText(special.label) + '</small>';
      }
      return "";
    }

    function motionGhostMarkup(value) {
      if (specialTile(value)) return specialTileMarkup(value);
      const heartPath = "M50 87C44 79 7 59 7 32C7 15 20 5 35 8C43 9 48 15 50 22C52 15 57 9 65 8C80 5 93 15 93 32C93 59 56 79 50 87Z";
      return '<svg class="motion-heart" viewBox="0 0 100 94" aria-hidden="true"><path d="' + heartPath + '"></path></svg>'
        + '<em class="motion-number">' + value + '</em>';
    }

    function clearTileStyle(item) {
      for (const property of ["--tile", "--tile-deep", "--tile-accent", "--tile-rim", "--rank", "--digits"]) {
        item.style.removeProperty(property);
      }
    }

    function ensureBoardCells() {
      if (cellNodes.length === size * size && cellNodes.every((item) => item.parentElement === board)) return cellNodes;
      const fragment = document.createDocumentFragment();
      cellNodes = Array.from({ length: size * size }, (_, index) => {
        const item = document.createElement("span");
        item.className = "merge-cell love-tile v0";
        item.dataset.index = String(index);
        item.dataset.renderValue = "0";
        item.dataset.value = "";
        item.dataset.rank = "0";
        item.dataset.digits = "0";
        item.dataset.romance = "";
        fragment.append(item);
        return item;
      });
      board.replaceChildren(fragment);
      motionGeometry = null;
      return cellNodes;
    }

    function boardMotionGeometry() {
      const cells = ensureBoardCells();
      const key = `${board.clientWidth}x${board.clientHeight}`;
      if (!motionGeometry || motionGeometry.key !== key) {
        motionGeometry = {
          key,
          cells: cells.map((item) => ({
            x: item.offsetLeft,
            y: item.offsetTop,
            width: item.offsetWidth,
            height: item.offsetHeight
          }))
        };
      }
      return motionGeometry.cells;
    }

    function renderBoardCells(mergeSet, motionTargetSet) {
      ensureBoardCells().forEach((item, index) => {
        const value = tiles[index];
        const ordinary = isOrdinaryTile(value);
        const special = specialTile(value);
        const tile = ordinary ? romanceTile(value) : null;
        const digits = ordinary ? String(value).length : 0;
        const classes = [
          "merge-cell",
          "love-tile",
          ordinary ? `v${value}` : "v0",
          ordinary && value >= 128 ? "is-hot" : "",
          special?.className || "",
          mergeSet.has(index) ? "is-collision" : "",
          index === lastSpawnCell ? "is-new is-top-spawn" : "",
          motionTargetSet.has(index) ? "is-motion-target" : "",
          ordinary && value >= 1024 ? "is-vow" : ""
        ].filter(Boolean).join(" ");

        item.className = classes;
        item.dataset.value = value ? String(value) : "";
        item.dataset.rank = String(tile?.rank || 0);
        item.dataset.digits = String(digits);
        item.setAttribute("data-romance", tile?.label || special?.label || "");
        if (special?.kind === "fate") item.dataset.special = "fate";
        else if (special?.kind === "conflict") item.dataset.special = "conflict";
        else delete item.dataset.special;

        if (item.dataset.renderValue === String(value)) return;
        item.dataset.renderValue = String(value);
        if (!value) {
          item.replaceChildren();
          clearTileStyle(item);
          return;
        }
        if (special) {
          clearTileStyle(item);
          item.innerHTML = specialTileMarkup(value);
          return;
        }
        item.style.setProperty("--tile", tile.color);
        item.style.setProperty("--tile-deep", tile.deep);
        item.style.setProperty("--tile-accent", tile.accent);
        item.style.setProperty("--tile-rim", tile.rim);
        item.style.setProperty("--rank", tile.rank);
        item.style.setProperty("--digits", digits);
        item.innerHTML = tileContentMarkup(value, index);
      });
    }

    function render() {
      const mergeSet = new Set(lastMergeCells);
      const motionTargetSet = new Set(lastMotionTargets);
      const top = romanceTile(maxTile());
      bestValue = Math.max(bestValue, top.value || 2);
      board.style.setProperty("--affinity-alpha", Math.min(0.62, Math.log2(Math.max(2, bestValue)) / 18).toFixed(3));
      board.style.setProperty("--meet-alpha", Math.min(0.58, storyLog.length / 12).toFixed(3));
      board.style.setProperty("--trust-alpha", Math.min(0.62, Math.log2(Math.max(2, bestValue)) / 16).toFixed(3));
      board.dataset.showPhase = top.label;
      board.classList.toggle("is-vow-ready", bestValue >= 2048);
      board.classList.remove("is-date-ready", "is-duo-mode", "is-chapter-mode");
      renderBoardCells(mergeSet, motionTargetSet);
      const scoreChanged = renderedScore !== points;
      if (scoreChanged) {
        renderedScore = points;
        setScore(points);
      }
      setStatus(engine.canMove(tiles, size) ? "滑动合并相同爱心，推进下一段关系" : "棋盘已满，点重遇再开始一段故事");
      const nextStoryRenderKey = [bestValue, currentScene?.title, memoryOpen, storyLog.length].join("|");
      if (scoreChanged || storyRenderKey !== nextStoryRenderKey) {
        meta.innerHTML = renderStoryCard();
        storyRenderKey = nextStoryRenderKey;
      }
    }

    function restart() {
      clearTimeout(moodTimer);
      clearTimeout(stageCelebrationTimer);
      clearTimeout(tileMotionTimer);
      clearTimeout(bumpTimer);
      board.querySelectorAll(":scope > .board-effect, :scope > .love-motion-layer").forEach((item) => item.remove());
      document.querySelector(".love-stage-celebration")?.remove();
      for (const name of moodClasses) board.classList.remove(name);
      tiles = Array(size * size).fill(0);
      points = 0;
      bestValue = 2;
      seenStageValues = new Set([2]);
      directorState = engine.createDirectorState();
      miracleUsed = false;
      milestoneGraceTurns = 0;
      lastMergeCells = [];
      lastMotionTargets = [];
      lastSpawnCell = -1;
      storyLog = [];
      currentScene = pickMilestoneScene(2);
      memoryOpen = false;
      renderedScore = -1;
      storyRenderKey = "";
      applyMood(currentScene);
      addFromTop();
      lastSpawnCell = addFromTop();
      render();
    }

    const restartControl = button("重遇", restart, true);
    restartControl.innerHTML = '<span aria-hidden="true">↻</span><span>重遇</span>';
    const memoryControl = button("回忆", toggleMemory);
    memoryControl.innerHTML = '<span aria-hidden="true">▤</span><span>回忆</span>';
    preloadSceneBackdrops();
    restart();
    const offKey = keyHandler({ ArrowLeft: () => move("left"), ArrowRight: () => move("right"), ArrowUp: () => move("up"), ArrowDown: () => move("down") });
    const offSwipe = enableSwipe({ left: () => move("left"), right: () => move("right"), up: () => move("up"), down: () => move("down") });
    return () => {
      clearTimeout(moodTimer);
      clearTimeout(stageCelebrationTimer);
      clearTimeout(tileMotionTimer);
      clearTimeout(bumpTimer);
      document.querySelector(".love-stage-celebration")?.remove();
      board.querySelectorAll(":scope > .board-effect, :scope > .love-motion-layer").forEach((item) => item.remove());
      loveVfx.destroy();
      offKey();
      offSwipe();
    };
  }

}
