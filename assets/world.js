const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

$("#year")?.replaceChildren(String(new Date().getFullYear()));

function setText(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function asTags(value) {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(/[,\s]+/)
    .map((item) => item.replace(/^#/, "").trim())
    .filter(Boolean);
}

function setupKnowledgeSearch() {
  const input = $("#knowledge-search");
  const buttons = $$(".knowledge-filter");
  const list = $("#knowledge-list");
  if (!input || !list) return;

  let active = "all";
  let notes = [];

  function groupLabel(group) {
    return {
      research: "研究",
      method: "方法",
      writing: "写作",
      reading: "阅读",
      tools: "工具",
      project: "项目"
    }[group] || "笔记";
  }

  function normalizeGroup(note) {
    const text = `${note.group || ""} ${note.path || ""} ${note.source || ""} ${asTags(note.tags).join(" ")}`.toLowerCase();
    if (/tool|automation|script|工具|自动化|codex|skill/.test(text)) return "tools";
    if (/project|vpos|项目/.test(text)) return "project";
    if (/read|reading|literature|文献|阅读|survey/.test(text)) return "reading";
    if (/paper|writing|论文|写作|submission|review/.test(text)) return "writing";
    if (/method|experiment|算法|方法|实验|metric|model/.test(text)) return "method";
    return note.group || "research";
  }

  function renderCards(items) {
    if (!items.length) {
      list.innerHTML = `
        <article class="content-card knowledge-card">
          <div class="knowledge-meta"><span>Empty</span><span>Search</span></div>
          <h3>没有匹配条目</h3>
          <p>换一个关键词或主题筛选。</p>
        </article>
      `;
      return;
    }

    list.innerHTML = items.slice(0, 80).map((note) => {
      const group = normalizeGroup(note);
      const tags = asTags(note.tags).slice(0, 5);
      return `
        <article class="content-card knowledge-card" data-group="${escapeHtml(group)}">
          <div class="knowledge-meta">
            <span>${escapeHtml(groupLabel(group))}</span>
            <span>${escapeHtml(note.type || note.source || "Note")}</span>
            <span>${escapeHtml(note.updated || "")}</span>
          </div>
          <h3>${escapeHtml(note.title)}</h3>
          <p>${escapeHtml(note.excerpt)}</p>
          <div class="knowledge-path">${escapeHtml(note.path || note.source || "")}</div>
          <div class="tag-row">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        </article>
      `;
    }).join("");
  }

  function updateStats(visible) {
    setText("#knowledge-total", String(notes.length));
    setText("#knowledge-visible", String(visible));
    setText("#knowledge-groups", String(new Set(notes.map(normalizeGroup)).size));
    setText("#knowledge-updated", notes[0]?.updated || "-");
  }

  function apply() {
    const query = input.value.trim().toLowerCase();
    const visible = notes.filter((note) => {
      const group = normalizeGroup(note);
      const text = [
        note.title,
        note.excerpt,
        note.type,
        note.source,
        note.path,
        ...asTags(note.tags)
      ].join(" ").toLowerCase();
      const matchesQuery = !query || text.includes(query);
      const matchesGroup = active === "all" || group === active;
      return matchesQuery && matchesGroup;
    });
    renderCards(visible);
    updateStats(visible.length);
    buttons.forEach((button) => {
      button.classList.toggle("primary", button.dataset.group === active);
    });
  }

  input.addEventListener("input", apply);
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      active = button.dataset.group || "all";
      apply();
    });
  });

  fetch("data/knowledge.json")
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      notes = Array.isArray(data) ? data : [];
      apply();
    })
    .catch(() => {
      list.innerHTML = `
        <article class="content-card knowledge-card">
          <div class="knowledge-meta"><span>Index</span><span>Unavailable</span></div>
          <h3>知识库索引暂不可用</h3>
          <p>请稍后再试。</p>
        </article>
      `;
    });
}

function setupTextAnalyzer() {
  const input = $("#text-input");
  const output = $("#text-stats");
  if (!input || !output) return;

  function render() {
    const value = input.value;
    const noSpace = value.replace(/\s/g, "");
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    const cnChars = (value.match(/[\u4e00-\u9fa5]/g) || []).length;
    const minutes = Math.max(1, Math.round((words + cnChars / 2) / 220));
    output.innerHTML = `
      <div class="stat"><strong>${value.length}</strong><span>总字符</span></div>
      <div class="stat"><strong>${noSpace.length}</strong><span>非空字符</span></div>
      <div class="stat"><strong>${words}</strong><span>英文词数</span></div>
      <div class="stat"><strong>${minutes}</strong><span>阅读分钟</span></div>
    `;
  }

  input.addEventListener("input", render);
  render();
}

function setupCitationBuilder() {
  const form = $("#citation-form");
  const output = $("#citation-output");
  if (!form || !output) return;

  function val(name) {
    return (form.elements[name]?.value || "").trim();
  }

  function render(event) {
    event?.preventDefault();
    const authors = val("authors") || "Author";
    const title = val("title") || "Paper title";
    const venue = val("venue") || "Venue";
    const year = val("year") || new Date().getFullYear();
    const doi = val("doi");
    const doiText = doi ? ` DOI: ${doi}.` : "";
    output.textContent = `${authors}. ${title}[J/CP]. ${venue}, ${year}.${doiText}`;
  }

  form.addEventListener("submit", render);
  form.addEventListener("input", render);
  render();
}

function setupCountdown() {
  const dateInput = $("#deadline-date");
  const titleInput = $("#deadline-title");
  const output = $("#deadline-output");
  if (!dateInput || !output) return;

  function render() {
    if (!dateInput.value) {
      output.textContent = "选择日期后显示剩余天数。";
      return;
    }
    const today = new Date();
    const target = new Date(`${dateInput.value}T00:00:00`);
    today.setHours(0, 0, 0, 0);
    const days = Math.round((target - today) / 86400000);
    const name = titleInput.value.trim() || "目标日期";
    if (days > 0) output.textContent = `${name} 还有 ${days} 天。`;
    else if (days === 0) output.textContent = `${name} 就是今天。`;
    else output.textContent = `${name} 已过去 ${Math.abs(days)} 天。`;
  }

  dateInput.addEventListener("input", render);
  titleInput?.addEventListener("input", render);
  render();
}

function setupFocusTimer() {
  const minutesInput = $("#focus-minutes");
  const start = $("#focus-start");
  const reset = $("#focus-reset");
  const output = $("#focus-output");
  if (!minutesInput || !start || !reset || !output) return;

  let timer = null;
  let seconds = Number(minutesInput.value || 25) * 60;

  function format(value) {
    const m = String(Math.floor(value / 60)).padStart(2, "0");
    const s = String(value % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function render() {
    output.textContent = format(seconds);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    start.textContent = "开始";
  }

  minutesInput.addEventListener("input", () => {
    stop();
    seconds = Math.max(1, Number(minutesInput.value || 25)) * 60;
    render();
  });

  start.addEventListener("click", () => {
    if (timer) {
      stop();
      return;
    }
    start.textContent = "暂停";
    timer = setInterval(() => {
      seconds = Math.max(0, seconds - 1);
      render();
      if (seconds === 0) stop();
    }, 1000);
  });

  reset.addEventListener("click", () => {
    stop();
    seconds = Math.max(1, Number(minutesInput.value || 25)) * 60;
    render();
  });

  render();
}

function setupUnitConverter() {
  const value = $("#unit-value");
  const type = $("#unit-type");
  const output = $("#unit-output");
  if (!value || !type || !output) return;

  function render() {
    const n = Number(value.value || 0);
    const mode = type.value;
    if (mode === "mm-inch") {
      output.textContent = `${n} mm = ${(n / 25.4).toFixed(4)} in\n${n} in = ${(n * 25.4).toFixed(2)} mm`;
    } else if (mode === "cm-inch") {
      output.textContent = `${n} cm = ${(n / 2.54).toFixed(4)} in\n${n} in = ${(n * 2.54).toFixed(2)} cm`;
    } else {
      const pxToMm = n / 300 * 25.4;
      const mmToPx = n / 25.4 * 300;
      output.textContent = `${n} px @300dpi = ${pxToMm.toFixed(2)} mm\n${n} mm @300dpi = ${Math.round(mmToPx)} px`;
    }
  }

  value.addEventListener("input", render);
  type.addEventListener("change", render);
  render();
}

function setupExperimentLog() {
  const task = $("#log-task");
  const data = $("#log-data");
  const metric = $("#log-metric");
  const finding = $("#log-finding");
  const output = $("#log-output");
  const copy = $("#copy-log");
  if (!task || !data || !metric || !finding || !output) return;

  function render() {
    output.textContent = [
      `Task: ${task.value.trim() || "-"}`,
      `Data: ${data.value.trim() || "-"}`,
      `Metric: ${metric.value.trim() || "-"}`,
      `Finding: ${finding.value.trim() || "-"}`
    ].join("\n");
  }

  [task, data, metric, finding].forEach((input) => input.addEventListener("input", render));
  copy?.addEventListener("click", async () => {
    await navigator.clipboard?.writeText(output.textContent);
    copy.textContent = "已复制";
    setTimeout(() => {
      copy.textContent = "复制片段";
    }, 1200);
  });
  render();
}

function setupMemoryGame() {
  const board = $("#memory-board");
  const movesOut = $("#memory-moves");
  const reset = $("#memory-reset");
  if (!board || !movesOut || !reset) return;

  const values = ["AI", "CV", "ML", "KB", "PX", "VR"];
  let cards = [];
  let open = [];
  let moves = 0;
  let locked = false;

  function shuffle(items) {
    return items
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((item) => item.value);
  }

  function render() {
    board.innerHTML = "";
    cards.forEach((card, index) => {
      const button = document.createElement("button");
      button.className = "memory-card";
      button.type = "button";
      button.textContent = card.value;
      button.setAttribute("aria-label", card.open || card.matched ? card.value : "hidden card");
      button.classList.toggle("is-open", card.open);
      button.classList.toggle("is-matched", card.matched);
      button.addEventListener("click", () => flip(index));
      board.append(button);
    });
    movesOut.textContent = `步数 ${moves}`;
  }

  function flip(index) {
    if (locked || cards[index].open || cards[index].matched) return;
    cards[index].open = true;
    open.push(index);
    if (open.length === 2) {
      moves += 1;
      const [a, b] = open;
      if (cards[a].value === cards[b].value) {
        cards[a].matched = true;
        cards[b].matched = true;
        open = [];
      } else {
        locked = true;
        setTimeout(() => {
          cards[a].open = false;
          cards[b].open = false;
          open = [];
          locked = false;
          render();
        }, 620);
      }
    }
    render();
  }

  function startGame() {
    cards = shuffle([...values, ...values]).map((value) => ({ value, open: false, matched: false }));
    open = [];
    moves = 0;
    locked = false;
    render();
  }

  reset.addEventListener("click", startGame);
  startGame();
}

function setupReactionGame() {
  const pad = $("#reaction-pad");
  const start = $("#reaction-start");
  const output = $("#reaction-output");
  if (!pad || !start || !output) return;

  let state = "idle";
  let readyAt = 0;
  let timeout = null;
  let best = null;

  function reset() {
    clearTimeout(timeout);
    state = "idle";
    pad.className = "reaction-pad";
    pad.textContent = "准备区";
    output.textContent = best ? `最好成绩 ${best} ms` : "尚无成绩";
  }

  start.addEventListener("click", () => {
    reset();
    state = "waiting";
    pad.classList.add("is-waiting");
    pad.textContent = "等待";
    const delay = 900 + Math.round(Math.random() * 1800);
    timeout = setTimeout(() => {
      state = "ready";
      readyAt = Date.now();
      pad.className = "reaction-pad is-ready";
      pad.textContent = "现在";
    }, delay);
  });

  pad.addEventListener("click", () => {
    if (state === "waiting") {
      output.textContent = "提前了，重新开始。";
      reset();
      return;
    }
    if (state !== "ready") return;
    const score = Date.now() - readyAt;
    best = best === null ? score : Math.min(best, score);
    output.textContent = `本次 ${score} ms，最好 ${best} ms`;
    state = "idle";
    pad.className = "reaction-pad";
    pad.textContent = "准备区";
  });

  reset();
}

function setupNumberGame() {
  const board = $("#number-board");
  const reset = $("#number-reset");
  const status = $("#number-status");
  if (!board || !reset || !status) return;

  let tiles = [];
  let moves = 0;

  function isSolved(values) {
    return values.slice(0, 8).every((value, index) => value === index + 1) && values[8] === 0;
  }

  function neighbors(index) {
    const row = Math.floor(index / 3);
    const col = index % 3;
    return [
      row > 0 ? index - 3 : -1,
      row < 2 ? index + 3 : -1,
      col > 0 ? index - 1 : -1,
      col < 2 ? index + 1 : -1
    ].filter((item) => item >= 0);
  }

  function render() {
    board.innerHTML = "";
    tiles.forEach((value, index) => {
      const button = document.createElement("button");
      button.className = value === 0 ? "number-tile is-empty" : "number-tile";
      button.type = "button";
      button.textContent = value === 0 ? "" : String(value);
      button.setAttribute("aria-label", value === 0 ? "empty" : `tile ${value}`);
      button.addEventListener("click", () => move(index));
      board.append(button);
    });
    status.textContent = isSolved(tiles) ? `完成，用步 ${moves}` : `步数 ${moves}`;
  }

  function move(index) {
    const empty = tiles.indexOf(0);
    if (!neighbors(index).includes(empty)) return;
    [tiles[index], tiles[empty]] = [tiles[empty], tiles[index]];
    moves += 1;
    render();
  }

  function shuffleBoard() {
    tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    moves = 0;
    for (let i = 0; i < 80; i += 1) {
      const empty = tiles.indexOf(0);
      const next = neighbors(empty)[Math.floor(Math.random() * neighbors(empty).length)];
      [tiles[next], tiles[empty]] = [tiles[empty], tiles[next]];
    }
    render();
  }

  reset.addEventListener("click", shuffleBoard);
  shuffleBoard();
}

setupKnowledgeSearch();
setupTextAnalyzer();
setupCitationBuilder();
setupCountdown();
setupFocusTimer();
setupUnitConverter();
setupExperimentLog();
setupMemoryGame();
setupReactionGame();
setupNumberGame();
