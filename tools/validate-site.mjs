import { readFileSync, existsSync, statSync } from "node:fs";

const standaloneGamePages = [
  "game-tetris.html",
  "game-2048.html",
  "game-mines.html",
  "game-sudoku.html",
  "game-snake.html",
  "game-bubble.html",
  "game-suika.html",
  "game-jump.html",
  "game-tower.html",
  "game-cards.html"
];

const siteFiles = [
  "index.html",
  "home.html",
  "knowledge.html",
  "tools.html",
  "games.html",
  ...standaloneGamePages,
  "assets/world.css",
  "assets/academic-v2.css",
  "assets/world.js",
  "assets/games.js",
  "data/knowledge.json",
  "tools/sync-obsidian.mjs"
];

for (const file of siteFiles) {
  if (!existsSync(file)) {
    console.error(`Missing site file: ${file}`);
    process.exit(1);
  }
}

const html = siteFiles.map((file) => readFileSync(file, "utf8")).join("\n");
const pageHtml = ["index.html", "home.html", "knowledge.html", "tools.html", "games.html", ...standaloneGamePages]
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");
const indexHtml = readFileSync("index.html", "utf8");
const homeHtml = readFileSync("home.html", "utf8");
const gamesHtml = readFileSync("games.html", "utf8");
const knowledge = JSON.parse(readFileSync("data/knowledge.json", "utf8"));
const readme = readFileSync("README.md", "utf8");
const gamesScript = readFileSync("assets/games.js", "utf8");
const worldCss = readFileSync("assets/world.css", "utf8");
const academicCss = readFileSync("assets/academic-v2.css", "utf8");

const required = [
  "刘勇",
  "Yong Liu",
  "个人天地",
  'href="home.html"',
  'href="knowledge.html"',
  'href="tools.html"',
  'href="games.html"',
  "个人知识库",
  "个人小工具箱",
  "游戏厅",
  "knowledge-search",
  "text-input",
  "citation-form",
  "game-hub",
  "game-menu",
  "game-board",
  "game-controls",
  "arcade-app",
  "arcade-playfield",
  "arcade-hud",
  "俄罗斯方块",
  "2048",
  "扫雷",
  "数独",
  "贪吃蛇",
  "泡泡龙",
  "合成大西瓜",
  "跳一跳",
  "塔防",
  "肉鸽卡牌",
  "unit-output",
  "log-output",
  "data/knowledge.json",
  "sync-obsidian",
  "assets/world.css",
  "assets/academic-v2.css",
  "assets/world.js",
  "assets/games.js",
  "0000-0002-7584-2953",
  "Diagnosis of Multiple Fundus Disorders",
  "SSVT: Self-Supervised Vision Transformer",
  "Rectified Artificial Neural Networks",
  "Ensemble Learning-Based Technique",
  "陆空基信息感知与控制全国重点实验室",
  "National Key Laboratory of Land and Air Based Information Perception and Control",
  "西安现代控制技术研究所",
  "Xi’an Modern Control Technology Research Institute",
  '<link rel="icon" type="image/svg+xml" href="favicon.svg?v=yl-20260630">',
  '<link rel="icon" type="image/png" sizes="512x512" href="favicon.png?v=yl-20260630">',
  '<body data-theme="classic">',
  '<select class="theme-select" id="theme-select"',
  '<button type="button" data-lang="zh"',
  '<button type="button" data-lang="en"',
  'value="classic"',
  'value="journal"',
  'value="minimal"',
  'value="lab"',
  'value="gallery"',
  'body[data-theme="journal"]',
  'body[data-theme="minimal"]',
  'body[data-theme="lab"]',
  'body[data-theme="gallery"]',
  'body[data-theme="journal"] .paper-card::before',
  'body[data-theme="minimal"] .paper-visual',
  'body[data-theme="lab"] .paper-list',
  'body[data-theme="lab"] .patent-grid',
  'body[data-theme="gallery"] .paper-card:first-child',
  'body[data-theme="journal"] .mobile-section-rail',
  'body[data-theme="minimal"] .rail-dot',
  'body[data-theme="gallery"] .hero-inner > div:first-child',
  'body[data-theme="lab"] .mobile-section-rail',
  '<link rel="stylesheet" href="assets/academic-v2.css?v=academic-20260710d">',
  'class="hero-research-strip"',
  'class="hero-figure hero-figure--vision"',
  'class="hero-figure hero-figure--touch"',
  'class="hero-figure hero-figure--health"',
  'Theme layout systems',
  'Academic homepage of Yong Liu',
  '当前单位',
  '教育与课程',
  '更新日期：2026-07-10',
  'Intelligent Health Systems From Medical Imaging to Tactile Sensing',
  'Journal and Conference Publications',
  'Patents and Intellectual Property',
  'Education and Honors',
  'readPreference(storageKeys.theme',
  'writePreference(storageKeys.lang',
  'applyTheme(currentTheme)',
  'applyLanguage(currentLanguage)',
  "mobile-section-rail",
  "本科：北京航空航天大学",
  "硕士：北京航空航天大学",
  "毕业后进入陆空基信息感知与控制全国重点实验室、西安现代控制技术研究所工作",
  "满分课程：工科数学分析、线性代数、复变函数、概率统计、电路分析、大学物理",
  "<h3>Honors</h3>",
  "北京市工程设计表达竞赛一等奖",
  "北航优秀研究生",
  "北航优秀毕业生",
  "北航优秀学生干部",
  "北航优秀生",
  "北航三好学生",
  "触摸力度识别方法",
  "近视风险评估方法",
  "一种基于肌力检测的手部动作识别方法",
  "一种儿童身体机能发育评估系统",
  "https://shanxixiaoyong.github.io/"
];

const forbidden = [
  "AWS S3 Bucket Browser",
  "www.asdzlab.top",
  "Nature Biomedical",
  "Detecting multiple fundus diseases",
  "Under Review",
  "Source:",
  "CV listed",
  "Publication metadata",
  "Visual map",
  "主页采用",
  "全部成果",
  "专业技能",
  "熟悉 Python",
  "Selected Honors",
  "hero-facts",
  "manuscripts",
  "15229069670",
  "北京市海淀区花园路街道大运村公寓",
  "扫描二维码",
  "后续可以",
  "后续新增",
  "全部前端",
  "不需要后端",
  "不需要登录",
  "无登录",
  "无网络请求",
  "页面加载后",
  "GitHub Pages 静态托管",
  "刷新页面即可",
  "不追踪数据",
  "不替代正式",
  "只需要按",
  "根页面只承担"
];

const forbiddenPageOnly = [
  "面向公开访问",
  "个人入口",
  "从本地 Obsidian",
  "本地 Markdown",
  "公开索引",
  "适合公开浏览",
  "原始私有工作区",
  "打开页面即可",
  "即时需求",
  "GitHub Pages 个人学术主页",
  "Academic homepage on GitHub Pages",
  "Vault Index",
  "四个入口",
  "各司其职",
  "空间结构",
  "展示面",
  "积累面",
  "交互面",
  "快速回到",
  "分区呈现",
  "在这里各自成区",
  "可探索",
  'id="touch-pad"',
  "data-touch"
];

const forbiddenKnowledge = [
  "source-note",
  "source-index",
  "Implementation Plan",
  "Personal Academic Homepage",
  "Yong Liu Academic Homepage",
  "GitHub Pages",
  "Codex",
  "ChatGPT",
  "MOC -",
  "Current State",
  "Guardrails",
  "Review Log",
  "需求",
  "要求",
  "实现计划",
  "实现规格"
];

const requiredAssets = [
  "favicon.svg",
  "favicon.png",
  "favicon.ico",
  "assets/world/portal-home.svg",
  "assets/world/portal-knowledge.svg",
  "assets/world/portal-tools.svg",
  "assets/world/portal-games.svg",
  "assets/academic-v2.css",
  "assets/world/workspace-grid.svg",
  "assets/world/vault-map.svg",
  "assets/world/tool-console.svg",
  "assets/papers/rectified-ann.jpg",
  "assets/papers/fundus-disorders.png",
  "assets/papers/ssvt.png",
  "assets/papers/multimodal-stroke.jpg",
  "assets/papers/force-touch.png",
  "assets/papers/ensemble-force.png",
  "assets/game-art/tetris-forge-ui.jpg",
  "assets/game-art/ember-2048-ui.jpg",
  "assets/game-art/sonar-mines-ui.jpg",
  "assets/game-art/ink-sudoku-ui.jpg",
  "assets/game-art/neon-snake-ui.jpg",
  "assets/game-art/tide-bubble-ui.jpg",
  "assets/game-art/orchard-suika-ui.jpg",
  "assets/game-art/lunar-jump-ui.jpg",
  "assets/game-art/canyon-tower-ui.jpg",
  "assets/game-art/starship-cards-ui.jpg"
];

const distinctGameChecks = [
  { theme: "block-forge", board: "board-tetris-forge", mechanic: "tetrisGhostCells", css: ".board-tetris-forge" },
  { theme: "love-2048", board: "board-love-2048", mechanic: "narrativeScenes", css: ".board-love-2048" },
  { theme: "sonar-mines", board: "board-sonar-mines", mechanic: "firstSafeOpen", css: ".board-sonar-mines" },
  { theme: "ink-sudoku", board: "board-ink-sudoku", mechanic: "conflictMarks", css: ".board-ink-sudoku" },
  { theme: "neon-snake", board: "board-neon-snake", mechanic: "portalWrap", css: ".board-neon-snake" },
  { theme: "tide-bubble", board: "board-tide-bubble", mechanic: "tideDrops", css: ".board-tide-bubble" },
  { theme: "orchard-suika", board: "board-orchard-suika", mechanic: "chainCombo", css: ".board-orchard-suika" },
  { theme: "lunar-jump", board: "board-lunar-jump", mechanic: "landingArc", css: ".board-lunar-jump" },
  { theme: "canyon-tower", board: "board-canyon-tower", mechanic: "towerTypes", css: ".board-canyon-tower" },
  { theme: "starship-cards", board: "board-starship-cards", mechanic: "energyCards", css: ".board-starship-cards" }
];

const standaloneGameChecks = [
  { file: "game-tetris.html", href: 'href="game-tetris.html"', id: "tetris", title: "熔炉方块" },
  { file: "game-2048.html", href: 'href="game-2048.html"', id: "merge2048", title: "桃花心动 2048" },
  { file: "game-mines.html", href: 'href="game-mines.html"', id: "mines", title: "声呐扫雷" },
  { file: "game-sudoku.html", href: 'href="game-sudoku.html"', id: "sudoku", title: "墨格数独" },
  { file: "game-snake.html", href: 'href="game-snake.html"', id: "snake", title: "霓虹列车" },
  { file: "game-bubble.html", href: 'href="game-bubble.html"', id: "bubble", title: "潮汐泡泡" },
  { file: "game-suika.html", href: 'href="game-suika.html"', id: "suika", title: "重力果园" },
  { file: "game-jump.html", href: 'href="game-jump.html"', id: "jump", title: "月面跳台" },
  { file: "game-tower.html", href: 'href="game-tower.html"', id: "tower", title: "峡谷塔防" },
  { file: "game-cards.html", href: 'href="game-cards.html"', id: "cards", title: "星舰卡牌" }
];

const requiredLinks = [
  "https://orcid.org/0000-0002-7584-2953",
  "https://github.com/shanxixiaoyong",
  "mailto:yongliu@buaa.edu.cn",
  "https://doi.org/10.1109/JIOT.2024.3463185",
  "https://doi.org/10.1109/ISBI56570.2024.10635531",
  "https://doi.org/10.3390/electronics14102081",
  "https://doi.org/10.1109/JSEN.2020.2987768",
  "https://doi.org/10.1002/adsr.202200055",
  "https://doi.org/10.1002/sdtp.14367",
  "https://patents.google.com/patent/CN111061394B/zh",
  "https://patents.google.com/patent/CN115137314B/zh",
  "https://patents.google.com/patent/CN115905803A/zh"
];

const failures = [];

const academicThemeContracts = [
  'body[data-theme="classic"] .hero-research-strip',
  'body[data-theme="journal"] .hero-research-strip',
  'body[data-theme="minimal"] .hero-research-strip',
  'body[data-theme="lab"] .hero-research-strip',
  'body[data-theme="gallery"] .hero-research-strip',
  'body[data-theme="gallery"] .hero-figure--vision',
  '@media (max-width: 620px)',
  'object-fit: contain',
  'prefers-reduced-motion'
];

for (const token of academicThemeContracts) {
  if (!academicCss.includes(token)) {
    failures.push(`Academic visual system missing contract: ${token}`);
  }
}

if ((homeHtml.match(/class="hero-figure /g) || []).length !== 3) {
  failures.push("Academic hero must contain exactly three local research figures");
}

for (const text of required) {
  if (!html.includes(text) && !readme.includes(text)) {
    failures.push(`Missing required text: ${text}`);
  }
}

for (const text of forbidden) {
  if (pageHtml.includes(text) || readme.includes(text)) {
    failures.push(`Forbidden text still present: ${text}`);
  }
}

for (const text of forbiddenPageOnly) {
  if (pageHtml.includes(text)) {
    failures.push(`Frontend implementation/request copy still present: ${text}`);
  }
}

if (!Array.isArray(knowledge) || knowledge.length < 20) {
  failures.push("Public knowledge base must include a meaningful set of curated notes");
}

const knowledgeText = JSON.stringify(knowledge);
for (const text of forbiddenKnowledge) {
  if (knowledgeText.includes(text)) {
    failures.push(`Internal knowledge-base text still present: ${text}`);
  }
}

for (const link of requiredLinks) {
  if (!html.includes(link) && !readme.includes(link)) {
    failures.push(`Missing required link: ${link}`);
  }
}

if (existsSync("CNAME")) {
  failures.push("CNAME must be removed for github.io-only deployment");
}

for (const asset of requiredAssets) {
  const cssRelativeAsset = asset.startsWith("assets/") ? asset.slice("assets/".length) : asset;
  const referencedInPages = html.includes(asset) || html.includes(cssRelativeAsset);
  const isPaperAsset = asset.startsWith("assets/papers/");
  if (!referencedInPages && !isPaperAsset) {
    failures.push(`Missing required asset reference: ${asset}`);
  }
  if (!existsSync(asset)) {
    failures.push(`Missing required asset file: ${asset}`);
  } else if (asset.startsWith("assets/game-art/") && statSync(asset).size < 100000) {
    failures.push(`Generated game art file is unexpectedly small: ${asset}`);
  }
}

for (const item of distinctGameChecks) {
  for (const token of [item.theme, item.board, item.mechanic]) {
    if (!gamesScript.includes(token)) {
      failures.push(`Game runtime missing distinct game token: ${token}`);
    }
  }
  if (!worldCss.includes(item.css)) {
    failures.push(`Game stylesheet missing distinct board selector: ${item.css}`);
  }
}

if (gamesHtml.includes('id="game-board"') || gamesHtml.includes('id="game-hub"')) {
  failures.push("games.html must be a lobby, not the integrated playable game page");
}

for (const item of standaloneGameChecks) {
  if (!indexHtml.includes(item.href)) {
    failures.push(`Homepage missing direct game link: ${item.href}`);
  }
  if (!gamesHtml.includes(item.href)) {
    failures.push(`Game lobby missing standalone game link: ${item.href}`);
  }
  const fileHtml = readFileSync(item.file, "utf8");
  if (!fileHtml.includes('class="solo-game-page') || !fileHtml.includes('id="solo-game"')) {
    failures.push(`${item.file} must use standalone solo game shell`);
  }
  if (!fileHtml.includes(`data-game="${item.id}"`)) {
    failures.push(`${item.file} missing data-game="${item.id}"`);
  }
  if (!fileHtml.includes(item.title)) {
    failures.push(`${item.file} missing game title: ${item.title}`);
  }
}

for (const token of ["soloGame", "dataset.game", "solo-game-page"]) {
  if (!gamesScript.includes(token) && !worldCss.includes(token)) {
    failures.push(`Standalone game runtime/style missing token: ${token}`);
  }
}

for (const file of ["index.html", "knowledge.html", "tools.html", "games.html", ...standaloneGamePages]) {
  const fileHtml = readFileSync(file, "utf8");
  if (fileHtml.includes("assets/papers/")) {
    failures.push(`${file} must not use paper figures outside the academic homepage`);
  }
}

if (existsSync("assets/papers/multimodal-stroke.png")) {
  failures.push("Cloudflare challenge screenshot asset must not be kept");
}

if (!html.includes('<script type="application/ld+json">')) {
  failures.push("Missing JSON-LD Person metadata");
}

const externalImageMatch = html.match(/<img\b[^>]*\bsrc=["']https?:\/\//i);
if (externalImageMatch) {
  failures.push("Images must be served from local repository assets, not external image URLs");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Site validation passed");
