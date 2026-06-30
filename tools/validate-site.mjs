import { readFileSync, existsSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const readme = readFileSync("README.md", "utf8");

const required = [
  "刘勇",
  "Yong Liu",
  "0000-0002-7584-2953",
  "Diagnosis of Multiple Fundus Disorders",
  "SSVT: Self-Supervised Vision Transformer",
  "Rectified Artificial Neural Networks",
  "Ensemble Learning-Based Technique",
  "陆空基信息感知与控制全国重点实验室",
  "National Key Laboratory of Land and Air Based Information Perception and Control",
  "西安现代控制技术研究所",
  "Xi’an Modern Control Technology Research Institute",
  '<link rel="icon" type="image/png" href="favicon.png">',
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
  "扫描二维码"
];

const requiredAssets = [
  "favicon.png",
  "favicon.ico",
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
  if (html.includes(text) || readme.includes(text)) {
    failures.push(`Forbidden text still present: ${text}`);
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
  if (!html.includes(asset)) {
    failures.push(`Missing required asset reference: ${asset}`);
  }
  if (!existsSync(asset)) {
    failures.push(`Missing required asset file: ${asset}`);
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
