# Academic Homepage Visual Rebuild

## Objective

Rebuild `home.html` as a restrained, publication-led academic portfolio while preserving all existing bilingual content, publication and patent data, local paper figures, links, affiliations, education, honors, theme persistence, and mobile section progress.

## Shared visual rules

- Use real local paper figures as the primary visual material. Never crop away figure content.
- Remove the oversized empty hero area and generic stacked-card appearance.
- Keep the header compact and translucent, with the page content visually centered beneath it.
- Use editorial rules, whitespace, numbering, and typography for hierarchy; cards are limited to repeated records.
- Keep section widths aligned with the affiliation area.
- Keep controls compact, accessible, and keyboard usable.
- On mobile, use one deliberate 430 x 932 layout with a floating section-progress dock.

## Five layout systems

### Atlas (`classic`)

An asymmetric research atlas. The hero combines identity, affiliation, and a three-figure evidence strip. Research focus is an unframed three-column index, and publications use wide visual records.

### Journal (`journal`)

A serif paper-like reading layout. Content follows a narrow single-column measure, affiliations become a ruled masthead, figures sit as plate thumbnails, and publications are sequentially numbered entries.

### Index (`minimal`)

A high-density black-and-white research index. The name and introduction use a split grid, focus areas become compact rows, images are grayscale until hover, and publications read like a bibliography table.

### Console (`lab`)

A dark instrument-console layout using charcoal, cyan, and warm signal accents. Hero content, figures, and affiliations occupy explicit grid zones; publication records form a two-column monitoring wall on desktop and a single stream on mobile.

### Exhibition (`gallery`)

A bright visual exhibition. Research figures dominate an asymmetric mosaic, identity overlays the composition without a card, and publication records alternate large image-led arrangements.

## Responsive behavior

- Desktop reference: 1440 x 1000.
- Mobile reference: 430 x 932.
- No horizontal overflow at either reference size.
- Mobile text remains readable without reducing the page to a scaled desktop view.
- Publication images use stable aspect ratios and `object-fit: contain`.
- The bottom progress dock remains visible, compact, and does not cover actionable content.
- Theme and language controls stay available without dominating the header.

## Acceptance criteria

- All five themes visibly change layout, spacing rhythm, typography, imagery treatment, and color system.
- The first desktop viewport contains identity, affiliation context, and real research imagery, with a hint of the next section.
- The mobile first viewport is composed specifically for touch and has no oversized empty regions.
- Chinese and English switching updates all existing dynamic content.
- All current publication, patent, profile, and external-link data remain present.
- Static validation and browser checks pass before publishing to GitHub Pages.
