import { readFileSync, existsSync } from "node:fs";

const siteFiles = [
  "index.html",
  "home.html",
  "knowledge.html",
  "tools.html",
  "games.html",
  "assets/world.css",
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
const pageHtml = ["index.html", "home.html", "knowledge.html", "tools.html", "games.html"]
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");
const knowledge = JSON.parse(readFileSync("data/knowledge.json", "utf8"));
const readme = readFileSync("README.md", "utf8");

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
  'Theme layout systems',
  'Academic homepage of Yong Liu',
  '当前单位',
  '教育与课程',
  '更新日期：2026-06-30',
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
  "assets/world/workspace-grid.svg",
  "assets/world/vault-map.svg",
  "assets/world/tool-console.svg",
  "assets/papers/rectified-ann.jpg",
  "assets/papers/fundus-disorders.png",
  "assets/papers/ssvt.png",
  "assets/papers/multimodal-stroke.jpg",
  "assets/papers/force-touch.png",
  "assets/papers/ensemble-force.png"
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
  const referencedInPages = html.includes(asset);
  const isPaperAsset = asset.startsWith("assets/papers/");
  if (!referencedInPages && !isPaperAsset) {
    failures.push(`Missing required asset reference: ${asset}`);
  }
  if (!existsSync(asset)) {
    failures.push(`Missing required asset file: ${asset}`);
  }
}

for (const file of ["index.html", "knowledge.html", "tools.html", "games.html"]) {
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
