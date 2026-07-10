# Academic Homepage Editorial Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic card-based academic page with a publication-led research folio while retaining every verified academic record, link, language, and display mode.

**Architecture:** `home.html` becomes a compact semantic shell, `assets/academic.js` owns structured bilingual data and interactions, and `assets/academic-v2.css` becomes the only visual layer. Five `data-theme` values reuse the semantic content but apply structurally different grid, typography, imagery, and navigation systems.

**Tech Stack:** Static HTML5, modern CSS, vanilla JavaScript, native `<dialog>`, IntersectionObserver, GitHub Pages.

## Global Constraints

- Preserve all six publications, four patents, local paper figures, source links, affiliations, education, full-score courses, honors, ORCID, GitHub, and email.
- Keep `classic`, `journal`, `minimal`, `lab`, and `gallery` as persisted theme values.
- Keep Chinese and English switching with local-storage persistence.
- Target 430 x 932 CSS pixels on mobile and 1440 x 1000 CSS pixels on desktop.
- Use original local paper figures with `object-fit: contain`; never replace them with generated diagrams.
- Do not place implementation requirements, private notes, or conversational instructions in visible page copy.
- Do not restore professional skills, years on honors, publication counts in the cover, or the removed Nature Biomedical item.
- Respect `prefers-reduced-motion` and avoid continuous filters or decorative animation loops.

---

### Task 1: Encode the new structural contract

**Files:**
- Create: `tools/validate-academic-homepage.mjs`
- Modify: `tools/validate-site.mjs`

**Interfaces:**
- Consumes: repository files `home.html`, `assets/academic-v2.css`, and `assets/academic.js`.
- Produces: a zero-exit validation command that asserts the editorial structure, content inventory, theme selectors, and absence of legacy card markup.

- [ ] **Step 1: Write the failing structural validator**

The validator must assert tokens such as:

```js
const requiredHtml = [
  'class="folio-header"',
  'class="cover"',
  'class="research-track-list"',
  'id="publication-list"',
  'class="patent-ledger"',
  'class="profile-timeline"',
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
```

It must also assert six publication objects, four patent objects, five explicit theme layout blocks, both languages, all required DOI and patent URLs, and all forbidden public copy already covered by `validate-site.mjs`.

- [ ] **Step 2: Run the validator and confirm RED**

Run: `node tools/validate-academic-homepage.mjs`

Expected: non-zero exit naming missing `folio-header` and legacy markup still present.

- [ ] **Step 3: Remove obsolete exact-version and old-layout assertions from the broad validator**

Replace old `paper-card`/`hero-research-strip` theme checks with the new stylesheet/script version, semantic chapter classes, and `assets/academic.js` asset requirement. Retain all academic-content and forbidden-copy assertions.

### Task 2: Rebuild the semantic shell and data renderer

**Files:**
- Replace: `home.html`
- Create: `assets/academic.js`

**Interfaces:**
- Consumes: existing publication/patent arrays and `uiText` content from `home.html`.
- Produces: `applyTheme(theme)`, `applyLanguage(lang)`, `renderPublications()`, `renderPatents()`, `updateSectionProgress()`, and native figure-dialog behavior.

- [ ] **Step 1: Replace the accumulated document shell**

Create a concise document with this section order:

```html
<header class="folio-header">...</header>
<nav class="mobile-progress">...</nav>
<main id="main">
  <section class="cover" id="top">...</section>
  <section class="chapter research-chapter" id="focus">...</section>
  <section class="chapter publication-chapter" id="publications">...</section>
  <section class="chapter patent-chapter" id="patents">...</section>
  <section class="chapter profile-chapter" id="profile">...</section>
</main>
<footer class="contact-close" id="contact">...</footer>
<dialog class="figure-dialog" id="figure-dialog">...</dialog>
```

Keep static Chinese fallback text for the cover, affiliations, research tracks, profile, and footer. Leave publication and patent list containers for structured rendering.

- [ ] **Step 2: Move structured data and bilingual text into `assets/academic.js`**

Retain all current record fields and add only presentation metadata:

```js
const publications = [{
  title: "...",
  venue: "...",
  year: "2025",
  authors: ["Yong Liu"],
  summaryZh: "...",
  summaryEn: "...",
  image: "assets/papers/...",
  links: [{ label: "DOI", url: "..." }]
}];
```

Render publications as `.publication-spread` and patents as `.patent-entry`. Use an escaped string helper for dynamic text fields before assigning `innerHTML`.

- [ ] **Step 3: Implement state and bilingual updates**

Use versioned keys so the rebuilt default is deterministic:

```js
const storageKeys = {
  theme: "homepage-theme-v3",
  lang: "homepage-language-v3"
};
```

`applyLanguage` updates metadata, visible static fields, research tracks, profile lists, navigation labels, dialog labels, and re-renders both dynamic lists. `applyTheme` changes `body.dataset.theme`, synchronizes the menu, and persists the value.

- [ ] **Step 4: Implement progress, reveals, mobile menu, and figure inspection**

Use one passive scroll listener with `requestAnimationFrame` for `--page-progress`. Use IntersectionObserver only to toggle `.is-visible`. Figure buttons populate and open the native dialog; close button, backdrop click, and Escape must work without page navigation.

- [ ] **Step 5: Run syntax and structural validation**

Run:

```bash
node --check assets/academic.js
node tools/validate-academic-homepage.mjs
```

Expected: JavaScript syntax passes; structural validator may still report missing CSS theme contracts until Task 3.

### Task 3: Build the editorial visual systems

**Files:**
- Replace: `assets/academic-v2.css`

**Interfaces:**
- Consumes: semantic class names from Task 2 and `body[data-theme]`.
- Produces: complete layouts for `classic`, `journal`, `minimal`, `lab`, and `gallery` at mobile and desktop references.

- [ ] **Step 1: Establish shared foundations and the Folio default**

Define neutral surfaces plus teal, vermilion, and blue accents. Build a floating header, asymmetric cover, staggered uncropped figure plates, numbered chapter heads, horizontal research tracks, alternating publication spreads, ruled patent ledger, timeline, course matrix, honors wall, and compact contact close. Use borders and typography for hierarchy rather than floating section cards.

- [ ] **Step 2: Add four structurally different theme layouts**

Each theme block must alter multiple layout contracts:

```css
body[data-theme="journal"] .publication-spread { /* narrow text-first reference entry */ }
body[data-theme="minimal"] .publication-spread { /* 12-column bibliography row */ }
body[data-theme="lab"] .publication-list { /* two-column monitor */ }
body[data-theme="gallery"] .publication-spread { /* image-led exhibition stage */ }
```

Also change cover composition, navigation treatment, research-track layout, patent treatment, typography, and image scale for every theme.

- [ ] **Step 3: Implement the 430 x 932 mobile composition**

At `max-width: 720px`, keep the content width aligned to 18px margins, hide desktop chapter links, display the bottom progress dock, keep controls within the viewport, use stable figure aspect ratios, and ensure the first chapter peeks below the cover. Add bottom padding so the dock never obscures links.

- [ ] **Step 4: Add accessible motion and interaction states**

Add restrained reveal transitions, link underlines, figure zoom feedback, active progress indicators, and dialog transitions. Disable nonessential transitions in `prefers-reduced-motion`.

- [ ] **Step 5: Run all static validators**

Run:

```bash
node tools/validate-academic-homepage.mjs
node tools/validate-site.mjs
git diff --check
```

Expected: all commands exit zero.

### Task 4: Browser visual and interaction verification

**Files:**
- Modify as defects are found: `home.html`, `assets/academic-v2.css`, `assets/academic.js`

**Interfaces:**
- Consumes: completed local static site.
- Produces: verified screenshots and interaction results at both target viewports.

- [ ] **Step 1: Start a local server**

Run: `python3 -m http.server 8765`

Expected: local page available at `http://127.0.0.1:8765/home.html`.

- [ ] **Step 2: Verify 430 x 932**

For all five themes, capture the first viewport and a publication viewport. Check `scrollWidth <= innerWidth`, header/control bounds, bottom-dock overlap, image containment, text wrapping, and visible difference in publication layout. Test one language switch, one theme switch, progress navigation, and one figure dialog.

- [ ] **Step 3: Verify 1440 x 1000**

For all five themes, capture the first viewport and inspect publication/patent/profile sections. Confirm no nested cards, no oversized empty region, no cropped paper figures, and no text/control overlap.

- [ ] **Step 4: Check runtime diagnostics**

Read browser console logs and verify zero errors or warnings. Inspect failed resources and confirm all local paper assets return successfully.

### Task 5: Publish and verify GitHub Pages

**Files:**
- Modify: `README.md` only if the implementation moves academic data out of `home.html`.

**Interfaces:**
- Consumes: verified working tree.
- Produces: public GitHub Pages build matching the pushed commit.

- [ ] **Step 1: Update repository documentation**

Change the README architecture sentence to state that publication and patent records live in `assets/academic.js`.

- [ ] **Step 2: Re-run release checks**

Run JavaScript checks, both validators, `git diff --check`, and `git status --short`.

- [ ] **Step 3: Commit and push**

Commit the coherent rebuild and push `master` to `origin`.

- [ ] **Step 4: Verify the Pages build and public page**

Confirm the GitHub Pages API reports `built` for the pushed commit. Load `https://shanxixiaoyong.github.io/home.html?v=<short-commit>`, repeat the mobile smoke interaction, and confirm the deployed stylesheet and script cache versions.
