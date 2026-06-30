# Personal Academic Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current S3 browser page with a public bilingual academic homepage at `https://shanxixiaoyong.github.io/`.

**Architecture:** Build a framework-free static site. Keep all profile, publication, and patent data in structured JavaScript arrays inside `index.html`, render cards with small helper functions, and use inline SVG/HTML diagrams for the image-rich research style.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, SVG, GitHub Pages.

---

## File Structure

- Modify: `index.html` - full single-page academic homepage, styles, structured data, and rendering logic.
- Modify: `README.md` - repository description and public URL.
- Delete: `CNAME` - expired custom domain must not be used.
- Keep: `favicon.ico`, `logo.png` - existing small assets may remain, but the page must not depend on the old S3 browser template.
- Create: `tools/validate-site.mjs` - local smoke test for expected content, privacy exclusions, and key links.

### Task 1: Add Static Site Smoke Test

**Files:**
- Create: `tools/validate-site.mjs`

- [ ] **Step 1: Create a failing validator**

Create `tools/validate-site.mjs` with checks that fail against the existing S3 browser page:

```js
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

if (!html.includes("<script type=\"application/ld+json\">")) {
  failures.push("Missing JSON-LD Person metadata");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Site validation passed");
```

- [ ] **Step 2: Run validator and verify it fails**

Run: `node tools/validate-site.mjs`
Expected: FAIL with missing personal homepage content and forbidden old S3 text.

### Task 2: Replace Homepage

**Files:**
- Modify: `index.html`
- Delete: `CNAME`

- [ ] **Step 1: Replace `index.html`**

Write a single-page bilingual academic homepage with sections: hero, research focus, publications, patents, education/honors, and footer. Include structured arrays named `publications` and `patents`, self-drawn SVG/HTML diagrams, status labels, and JSON-LD.

- [ ] **Step 2: Remove expired domain**

Delete `CNAME`.

- [ ] **Step 3: Run validator**

Run: `node tools/validate-site.mjs`
Expected: PASS.

### Task 3: Update Repository Description

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README**

Write a concise README describing the academic homepage, public URL, and no-build static setup.

- [ ] **Step 2: Run validator**

Run: `node tools/validate-site.mjs`
Expected: PASS.

### Task 4: Browser Verification And Publish

**Files:**
- No additional planned files.

- [ ] **Step 1: Serve locally**

Run: `python3 -m http.server 8000`
Expected: server starts at `http://localhost:8000/`.

- [ ] **Step 2: Verify desktop and mobile layouts**

Use browser automation or screenshots at desktop and mobile widths. Expected: page renders nonblank, content is readable, no private phone/address text appears, and no old S3 template appears.

- [ ] **Step 3: Commit implementation**

Run:

```bash
git add index.html README.md tools/validate-site.mjs CNAME docs/superpowers/plans/2026-06-30-personal-academic-homepage-implementation.md
git commit -m "Build academic personal homepage"
```

Expected: commit succeeds.

- [ ] **Step 4: Push to GitHub Pages**

Run: `git push origin master`
Expected: push succeeds and GitHub Pages begins serving the new page.

- [ ] **Step 5: Verify published URL**

Open `https://shanxixiaoyong.github.io/` after deployment. Expected: the new academic homepage is visible.
