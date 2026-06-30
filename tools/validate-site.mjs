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
  "触摸力度识别方法",
  "近视风险评估方法",
  "一种基于肌力检测的手部动作识别方法",
  "一种儿童身体机能发育评估系统",
  "https://shanxixiaoyong.github.io/"
];

const forbidden = [
  "AWS S3 Bucket Browser",
  "www.asdzlab.top",
  "15229069670",
  "北京市海淀区花园路街道大运村公寓",
  "扫描二维码"
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

if (!html.includes('<script type="application/ld+json">')) {
  failures.push("Missing JSON-LD Person metadata");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Site validation passed");
