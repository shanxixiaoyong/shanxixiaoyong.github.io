# Academic Homepage Editorial Rebuild

## Objective

Replace the accumulated card-based academic homepage with a publication-led research folio. The academic record remains unchanged: all six publications, four patents, local paper figures, summaries, links, affiliations, education, full-score courses, honors, ORCID, GitHub, email, five visual systems, bilingual switching, and mobile section progress must remain available.

The rebuild must feel structurally new. It cannot be achieved by changing colors, radii, shadows, or column counts on the existing hero and card grid.

## Chosen Direction

Three directions were considered:

1. **Research folio**: an asymmetric editorial cover followed by long-form project spreads, a patent ledger, and a concise CV timeline. This is the selected default because it gives the real paper figures and research record visual authority without turning the page into a marketing site.
2. **Immersive exhibition**: full-screen figures and sparse captions. This has stronger visual impact but is less efficient for reading titles, authors, venues, and patent metadata.
3. **Academic database**: a dense searchable index. This is useful for scanning but too utilitarian as the primary public identity.

The selected system combines the editorial confidence of the first direction with the scanability of the third. The exhibition treatment becomes one of the alternate visual systems.

## Information Architecture

### Floating navigation

The old full-width sticky bar is removed. A compact floating header contains identity, section links, a style menu, language switching, and a return to the personal world. It occupies no full-width colored band. On mobile, section links move to a translucent bottom progress dock so the content remains centered.

### Cover

The first viewport reads like a research folio cover rather than a profile card. It contains:

- a large bilingual name lockup;
- a concise research statement;
- three contact links;
- one uncropped representative evidence plate with full-screen inspection;
- both current affiliations as typographic credits;
- a visible continuation into the first research chapter.

The cover does not display publication or patent counts. It does not include explanatory notes about website requirements.

### Research tracks

The three research areas become numbered horizontal tracks. Each track pairs a concise argument with a compact keyword line. They are not standalone cards, and paper figures remain concentrated in the publication record instead of being repeated as decorative thumbnails.

### Publications

Each paper becomes an editorial spread with a large year marker, full uncropped figure, title, venue, highlighted author name, summary, and source links. The six records alternate visual weight and image/text position in the default system. Images remain `object-fit: contain` and open in an accessible lightbox for detailed inspection.

### Patents

Patents become a ruled ledger. Every row has a persistent sequence number, legal status, title, publication number, role, summary, and links. This section favors comparison and scanning rather than another image-card grid.

### Profile

Education and work form a continuous timeline. Full-score courses form a typographic matrix. Honors form an unboxed list headed exactly `Honors`, without years. Professional skills remain excluded.

### Contact close

The footer becomes a restrained contact close with the email as the primary action, followed by ORCID, GitHub, and a return to the personal world. It does not repeat implementation notes.

## Five Layout Systems

The same semantic content supports five genuinely different compositions:

1. **Folio (`classic`)**: asymmetric ink-and-paper cover, numbered chapters, alternating publication spreads, teal and vermilion signals.
2. **Manuscript (`journal`)**: narrow serif reading measure, margin notes, ruled references, footnote-like image plates, oxblood annotations.
3. **Grid (`minimal`)**: Swiss typographic grid, black/white/vermilion palette, oversized indices, dense bibliography rows, grayscale figures until focus or hover.
4. **Signal (`lab`)**: dark instrument surface, monospace metadata, channel-like research tracks, two-column publication monitor, cyan with warm signal accents.
5. **Cinema (`gallery`)**: image-led exhibition, oversized figure stages, alternating captions, ultramarine and coral accents, minimal chrome.

Changing themes must alter layout, typography, image scale, spacing rhythm, navigation treatment, and record composition. It must not merely replace CSS variables.

## Responsive Contract

- Primary mobile reference: 430 x 932 CSS pixels, representing a common high-density 1.5K-class phone.
- Desktop reference: 1440 x 1000 CSS pixels.
- No horizontal overflow at either reference.
- The mobile cover must show identity, research statement, a meaningful part of the figure composition, and a hint of the next chapter without an oversized empty forehead.
- The bottom section dock must remain compact, centered, translucent, and clear of actionable content.
- Publication figures must remain fully visible; no content-bearing figure may be cropped for decoration.
- Text cannot overlap controls, figures, or subsequent sections.

## Motion and Interaction

- Use one lightweight scroll-progress transform and IntersectionObserver-based reveal states.
- Avoid animated blur, large filters, and continuous decorative motion.
- Respect `prefers-reduced-motion`.
- Theme and language selections persist in local storage.
- Figure inspection uses a native dialog, closes with its close control, backdrop click, or Escape, and preserves the original image path.
- External links open in a new tab with `noopener`.

## Implementation Boundaries

- `home.html` becomes a compact semantic shell with static Chinese fallback content.
- `assets/academic-v2.css` becomes the only academic visual system; the legacy inline stylesheet is removed.
- `assets/academic.js` owns bilingual strings, publication and patent records, rendering, preferences, progress, reveal behavior, navigation, and figure inspection.
- `tools/validate-site.mjs` is updated to assert the new structural contracts while retaining all content and forbidden-copy checks.

## Acceptance Criteria

- The page no longer contains the old full-width header, generic hero/profile card, focus-card grid, publication-card list, patent-card grid, or nested card visual language.
- All academic content and source links remain present in Chinese and English modes.
- The five themes are visibly different at 430 x 932 and 1440 x 1000.
- Mobile progress, language switching, theme switching, external links, and image lightbox work.
- Images resolve locally and render with `object-fit: contain`.
- Console logs contain no errors or warnings during the tested flows.
- Static validation, JavaScript syntax checks, link checks, and browser visual checks pass before deployment.
