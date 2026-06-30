# Personal Academic Homepage Design

Date: 2026-06-30
Repository: `shanxixiaoyong/shanxixiaoyong.github.io`
Target URL: `https://shanxixiaoyong.github.io/`

## Goal

Build a public personal academic homepage for Liu Yong / Yong Liu on GitHub Pages. The site should present academic work, patents, and selected background information in a polished but restrained style. The previous expired custom domain must not be used.

## Confirmed Decisions

- Deploy from the existing `shanxixiaoyong.github.io` GitHub Pages repository.
- Remove `CNAME`; use the GitHub Pages URL directly.
- Use a bilingual presentation: Chinese prose as the main narrative, English for paper titles, venues, keywords, and link labels.
- Public contact information: email, GitHub, ORCID, DOI/patent links. Do not publish phone number, address, or QR code from the CV.
- ORCID: `https://orcid.org/0000-0002-7584-2953`, provided and confirmed by the user. It is a contact/profile link, not the sole proof of publication ownership.
- Use a pure static single-page implementation: no build step, no framework dependency.
- Visual direction: "image-rich research homepage" with restrained academic styling.
- Show all papers and patents, but label each item accurately by status.

## Content Scope

The site will show:

1. A hero section with name, affiliation context, research summary, and contact links.
2. Research focus modules for:
   - Fundus image AI and self-supervised medical vision.
   - Piezoelectric touch/force sensing and machine learning.
   - Wearable health, child/myopia risk assessment, and intelligent sensing systems.
3. A publications section containing published papers, conference papers, preprints, and under-review manuscripts, each with explicit status labels.
4. A patents section containing granted, published, and filed patents, each with explicit status labels.
5. A concise education and honors section extracted from the CV without private contact details.
6. A footer with GitHub Pages URL, ORCID, email, and last-updated date.

## Status Label Rules

### Publications

- `Published`: journal article or formally published paper with DOI/publisher page.
- `Conference`: formally published conference paper with DOI/publisher page.
- `Preprint`: arXiv, Research Square, or similar preprint record.
- `Under Review`: manuscript listed by the CV/user but not publicly accepted.
- Unknown or low-confidence items may be displayed only if the user supplied them, and must carry a non-final status.

### Patents

- `Granted / 已授权`: granted patent record, typically with a `B` publication in Chinese patent records.
- `Published / 已公开`: published patent application, typically with an `A` publication.
- `Filed / 已受理`: user/CV-provided filing with no public publication link found yet.
- If no public link is available, the source should be marked as CV/user-provided rather than external verification.

## Seed Publication List

This list is the starting dataset for implementation and final verification.

1. **Diagnosis of Multiple Fundus Disorders Amidst a Scarcity of Medical Experts Via Self-Supervised Machine Learning**
   - Status: Published
   - Venue: IEEE Internet of Things Journal
   - Year: 2024/2025 publication record to verify on final publisher page
   - DOI: `10.1109/JIOT.2024.3463185`
   - Authors from Crossref: Yong Liu, Mengtian Kang, Shuo Gao, Chi Zhang, Ying Liu, Shiming Li, Yue Qi, Arokia Nathan, Wenjun Xu, Chenyu Tang, Edoardo Occhipinti, Mayinuer Yusufu, Ningli Wang, Weiling Bai, Luigi Occhipinti

2. **SSVT: Self-Supervised Vision Transformer For Eye Disease Diagnosis Based On Fundus Images**
   - Status: Conference
   - Venue: 2024 IEEE International Symposium on Biomedical Imaging (ISBI)
   - Year: 2024
   - DOI: `10.1109/ISBI56570.2024.10635531`
   - Authors from Crossref: Jiaqi Wang, Mengtian Kang, Yong Liu, Chi Zhang, Ying Liu, Shiming Li, Yue Qi, Wenjun Xu, Chenyu Tang, Edoardo Occhipinti, Mayinuer Yusufu, Ningli Wang, Weiling Bai, Shuo Gao, Luigi G. Occhipinti

3. **Rectified Artificial Neural Networks for Long-Term Force Sensing in Piezoelectric Touch Panels**
   - Status: Published
   - Venue: Electronics
   - Year: 2025
   - DOI: `10.3390/electronics14102081`
   - Authors from Crossref: Yong Liu, Xuemeng Li, Weihao Ma, Hongbei Meng, Shuo Gao

4. **Ensemble Learning-Based Technique for Force Classifications in Piezoelectric Touch Panels**
   - Status: Published
   - Venue: IEEE Sensors Journal
   - Year: 2020
   - DOI: `10.1109/JSEN.2020.2987768`
   - Authors from Crossref: Yong Liu, Shuo Gao, Anbiao Huang, Jie Zhu, Lijun Xu, Arokia Nathan

5. **Detecting multiple fundus diseases across diverse populations and image sources via a label-free self-supervised vision transformer model**
   - Status: Under Review, unless implementation-time verification finds a public accepted version.
   - Source: CV.
   - Handling: include with clear `Under Review` status unless a more final public status is verified.

Additional publications outside the CV should be searched using combinations of name, BUAA/Beihang affiliation, email, coauthors, and research topics. Add only after a source-quality check.

## Seed Patent List

This list is the starting dataset for implementation and final verification.

1. **触摸力度识别方法及其模型的训练方法、装置和电子系统**
   - Status: Granted / 已授权
   - Candidate records: `CN111061394A`, `CN111061394B`
   - Source: Google Patents candidate record and CV.

2. **近视风险评估方法、装置及穿戴设备**
   - Status: Granted / 已授权
   - Candidate records: `CN115137314A`, `CN115137314B`
   - Source: Google Patents candidate record and CV.

3. **一种基于肌力检测的手部动作识别方法及其模型的训练方法、装置和电子系统**
   - Status: Published / 已公开 unless a granted record is found.
   - Candidate record: `CN115905803A`
   - Source: Google Patents candidate record and CV.

4. **一种儿童身体机能发育评估系统及其评估模型的训练方法**
   - Status: Filed / 已受理 or Published if a public record is confirmed.
   - Candidate public snippet: Patent9 search result shows title variant "一种儿童身体机能发育评估系统及方法" and inventors including 高硕、刘勇、王嘉琪、赵子贺、胡岩松、梁爱民、梁树立、刘小梅、庞红、王鸿源、宋婷婷.
   - Source: CV and public search snippet. Needs final public record/number verification.

## Visual Design

The page should feel like a clear research portfolio, not a marketing landing page.

- Base colors: white, near-white, graphite text, muted blue-green, and muted copper accents.
- Typography: readable system fonts with stable sizing; no viewport-scaled font sizes.
- Hero: two-column desktop layout with textual identity on the left and a custom abstract research diagram on the right.
- Research focus: three visual modules with compact custom graphics.
- Publication cards: left-side diagram/thumbnail, right-side metadata, links, and bilingual summary.
- Patent cards: more compact cards with status, number, role, and source link.
- Mobile: single-column layout, sticky lightweight anchor navigation, no overlapping text.

Use self-drawn SVG/HTML diagrams rather than copying publisher figures. Candidate diagrams:

- Fundus AI: retinal-image tile grid -> self-supervised encoder -> multi-disease outputs.
- Touch sensing: piezoelectric waveform -> feature extraction -> force class prediction.
- Wearable health: sensor device -> signal model -> risk/assessment output.

## Technical Design

Files:

- `index.html`: complete static single-page site and structured data arrays.
- `assets/`: generated SVGs, icons, and any static images.
- `README.md`: repository/site description.
- `CNAME`: remove.

Data structures:

- `publications`: array of paper/manuscript objects with `title`, `authors`, `year`, `venue`, `status`, `links`, `summaryZh`, `summaryEn`, and optional `visual`.
- `patents`: array of patent objects with `title`, `status`, `numbers`, `role`, `applicants`, `links`, and `summaryZh`.

No build step is required. The site should work by opening `index.html` or serving the folder through a static server.

## Verification Plan

Before publishing:

1. Verify DOI links, publisher links, patent links, ORCID, GitHub link, and email link.
2. Render the site locally at desktop and mobile widths.
3. Check that no phone number, home address, QR code, or expired custom domain remains.
4. Confirm that each paper and patent status label matches the source evidence.
5. Run basic HTML/CSS smoke checks and a browser screenshot check.
6. Commit and push to `master`.
7. Verify `https://shanxixiaoyong.github.io/` after GitHub Pages updates.

## Open Items For Implementation

- Complete the final paper/patent source sweep.
- Verify final IEEE IoTJ volume/issue/pages from the publisher page.
- Find the public record number for the child physical-function development assessment patent, if available.
- Confirm final public wording for the under-review Nature Biomedical Engineering manuscript while keeping it listed as `Under Review`.
