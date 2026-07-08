const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

$("#year")?.replaceChildren(String(new Date().getFullYear()));

function setupKnowledgeSearch() {
  const input = $("#knowledge-search");
  const buttons = $$(".knowledge-filter");
  const cards = $$(".knowledge-card");
  if (!input || !cards.length) return;

  let active = "all";

  function apply() {
    const query = input.value.trim().toLowerCase();
    cards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      const group = card.dataset.group || "";
      const matchesQuery = !query || text.includes(query);
      const matchesGroup = active === "all" || group === active;
      card.hidden = !(matchesQuery && matchesGroup);
    });
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
  apply();
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

setupKnowledgeSearch();
setupTextAnalyzer();
setupCitationBuilder();
setupCountdown();
setupFocusTimer();
setupMemoryGame();
setupReactionGame();
