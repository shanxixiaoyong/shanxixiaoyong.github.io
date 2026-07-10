import { existsSync, readFileSync } from "node:fs";

const files = ["home.html", "assets/academic-v2.css", "assets/academic.js"];
const failures = [];

for (const file of files) {
  if (!existsSync(file)) {
    failures.push(`Missing academic homepage file: ${file}`);
  }
}

const html = existsSync("home.html") ? readFileSync("home.html", "utf8") : "";
const css = existsSync("assets/academic-v2.css") ? readFileSync("assets/academic-v2.css", "utf8") : "";
const script = existsSync("assets/academic.js") ? readFileSync("assets/academic.js", "utf8") : "";
const combined = `${html}\n${css}\n${script}`;

const requiredHtml = [
  'class="folio-header"',
  'class="cover"',
  'class="research-track-list"',
  'id="publication-list"',
  'class="patent-ledger"',
  'class="profile-timeline',
  'class="mobile-progress"',
  'class="figure-dialog"',
  'src="assets/academic.js?v=academic-20260710e"'
];

const forbiddenHtml = [
  'class="site-header"',
  'class="hero-inner"',
  'class="focus-grid"',
  'class="paper-card"',
  'class="patent-card"',
  'class="affiliation-card"',
  '<style>'
];

const requiredScript = [
  "const publications = [",
  "const patents = [",
  "const uiText =",
  "function applyTheme",
  "function applyLanguage",
  "function renderPublications",
  "function renderPatents",
  "function updateSectionProgress",
  '"homepage-theme-v3"',
  '"homepage-language-v3"'
];

const requiredCss = [
  'body[data-theme="classic"]',
  'body[data-theme="journal"]',
  'body[data-theme="minimal"]',
  'body[data-theme="lab"]',
  'body[data-theme="gallery"]',
  'body[data-theme="journal"] .publication-spread',
  'body[data-theme="minimal"] .publication-spread',
  'body[data-theme="lab"] .publication-list',
  'body[data-theme="gallery"] .publication-spread',
  "object-fit: contain",
  "@media (max-width: 720px)",
  "@media (prefers-reduced-motion: reduce)"
];

const requiredContent = [
  "刘勇",
  "Yong Liu",
  "0000-0002-7584-2953",
  "yongliu@buaa.edu.cn",
  "陆空基信息感知与控制全国重点实验室",
  "National Key Laboratory of Land and Air Based Information Perception and Control",
  "西安现代控制技术研究所",
  "Xi’an Modern Control Technology Research Institute",
  "Rectified Artificial Neural Networks for Long-Term Force Sensing in Piezoelectric Touch Panels",
  "Diagnosis of Multiple Fundus Disorders Amidst a Scarcity of Medical Experts Via Self-Supervised Machine Learning",
  "SSVT: Self-Supervised Vision Transformer For Eye Disease Diagnosis Based On Fundus Images",
  "Multimodal Sensing in Stroke Motor Rehabilitation",
  "Force Touch and Machine Learning Based Smart Sensing Techniques for Interactive Displays",
  "Ensemble Learning-Based Technique for Force Classifications in Piezoelectric Touch Panels",
  "触摸力度识别方法及其模型的训练方法、装置和电子系统",
  "近视风险评估方法、装置及穿戴设备",
  "一种基于肌力检测的手部动作识别方法及其模型的训练方法、装置和电子系统",
  "一种儿童身体机能发育评估系统及其评估模型的训练方法",
  "本科",
  "硕士",
  "北京航空航天大学",
  "满分课程：工科数学分析、线性代数、复变函数、概率统计、电路分析、大学物理",
  "北京市工程设计表达竞赛一等奖",
  "北航优秀研究生",
  "北航优秀毕业生",
  "北航优秀学生干部",
  "北航优秀生",
  "北航三好学生"
];

const requiredLinks = [
  "https://doi.org/10.3390/electronics14102081",
  "https://doi.org/10.1109/JIOT.2024.3463185",
  "https://doi.org/10.1109/ISBI56570.2024.10635531",
  "https://doi.org/10.1002/adsr.202200055",
  "https://doi.org/10.1002/sdtp.14367",
  "https://doi.org/10.1109/JSEN.2020.2987768",
  "https://doi.org/10.21203/rs.3.rs-3115583/v1",
  "https://doi.org/10.48550/arXiv.2404.13386",
  "https://patents.google.com/patent/CN111061394A/zh",
  "https://patents.google.com/patent/CN111061394B/zh",
  "https://patents.google.com/patent/CN115137314A/zh",
  "https://patents.google.com/patent/CN115137314B/zh",
  "https://patents.google.com/patent/CN115905803A/zh"
];

for (const token of requiredHtml) {
  if (!html.includes(token)) failures.push(`Missing homepage structure: ${token}`);
}

for (const token of forbiddenHtml) {
  if (html.includes(token)) failures.push(`Legacy homepage structure remains: ${token}`);
}

for (const token of requiredScript) {
  if (!script.includes(token)) failures.push(`Missing academic script contract: ${token}`);
}

for (const token of requiredCss) {
  if (!css.includes(token)) failures.push(`Missing academic style contract: ${token}`);
}

for (const token of [...requiredContent, ...requiredLinks]) {
  if (!combined.includes(token)) failures.push(`Missing academic content: ${token}`);
}

const publicationBlock = script.split("const publications = [")[1]?.split("const patents = [")[0] || "";
const patentBlock = script.split("const patents = [")[1]?.split("const statusText =")[0] || "";
const publicationTitles = publicationBlock.match(/^\s{6}title: "/gm) || [];
const patentTitles = patentBlock.match(/^\s{6}title: "/gm) || [];
if (publicationTitles.length !== 6) failures.push(`Expected 6 publication records, found ${publicationTitles.length}`);
if (patentTitles.length !== 4) failures.push(`Expected 4 patent records, found ${patentTitles.length}`);

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}

console.log("Academic homepage validation passed");
