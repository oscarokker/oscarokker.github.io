# oscarrode.com — Style Reference
> playful bento portfolio on warm parchment (and midnight amber)

**Theme:** light + dark (first-class pair)  
**Living document:** update when the live site changes; Kern (design) proposes, Mosaic (code) confirms tokens match CSS. Oscar can ask anytime for improvements.

Oscar Rode’s portfolio is a personal UX/UI surface — not a SaaS landing page. Visitors should quickly see the design work, the case studies, and who he is to work with. The system is a **bento tile grid** on a warm off-white parchment in light mode, and a deep indigo canvas with a soft amber edge glow in dark mode. Display type is an editorial serif (Lora); UI and body are a calm sans (Open Sans). Soft rounded tiles, pill filters, and quiet elevation make the grid feel tactile and slightly playful without becoming loud. Case-study pages are a quieter editorial column: product figures and looping demos finish the sentence above them — they never decorate.

This file is the contract for future design and implementation. Prefer these tokens over inventing new colors, radii, or type roles.

---

## Tokens — Colors

### Surfaces (light)

| Name | Value | Token | Role |
|------|-------|-------|------|
| Parchment | `#f0eee6` | `--color-bg` | Page canvas — warm paper, not pure white |
| Elevated Paper | `#faf9f5` | `--color-bg-elevated` | Tile/card faces, elevated chrome |
| Muted Paper | `#ebebe6` | `--color-bg-muted` | Nested quiet surfaces |
| Nav Glass | `rgba(255,255,255,0.4)` light / `rgba(30,30,28,0.78)` dark | `--color-bg-nav` | Filter pill / nav frosted fill |
| Nav Active | `#ffffff` light / `rgba(245,245,241,0.1)` dark | `--color-bg-nav-active` | Active filter thumb |

### Surfaces (dark)

| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Indigo | `#0d0c14` | `--color-bg` | Dark canvas; amber glow lives at the edges, not as a fill |
| Elevated Night | `#211f33` | `--color-bg-elevated` | Elevated cards/tiles in dark |
| Muted Night | `#2a2a28` | `--color-bg-muted` | Nested dark surfaces |
| Nav Night | `#1e1e1cc7` | `--color-bg-nav` | Dark nav glass |

### Text

| Name | Light | Dark | Token | Role |
|------|-------|------|-------|------|
| Primary | `#292929` | `#fafafa` | `--color-text-primary` | Body, headings, tile titles |
| Secondary | `#5c5c58` | `#a8a8a2` | `--color-text-secondary` | Supporting copy, **case-study figure captions** |
| Tertiary | `#8a8a84` | `#737370` | `--color-text-tertiary` | Metadata, quiet labels |
| Inverse | `#f5f5f1` | `#1a1a18` | `--color-text-inverse` | Text on inverse fills |

### Accents & tile chroma

| Name | Light | Dark | Token | Role |
|------|-------|------|-------|------|
| Forest Accent | `#2d4a3e` | `#6db89a` | `--color-accent` | Soft brand accent / soft fills (`--color-accent-soft`) |
| Highlight | `#2409d6` | `#8573ff` | `--color-highlight` | Rare emphasis (not a second brand color flood) |
| Tile Teal | `#2a9d8f` / `#4bb8a8` | `--color-tile-teal` | Default work/case accents |
| Tile Violet | `#7c5cbf` / `#9b7fd4` | `--color-tile-violet` | Spotify / secondary work |
| Tile Indigo | `#4f5bd5` / `#7278e0` | `--color-tile-indigo` | Thesis / research |
| Tile Amber / Coral / Rose / … | see CSS | `--color-tile-*` | Personality tiles — use sparingly; grid should not become a rainbow |

**Border / overlay:** `--color-border`, `--color-border-strong`, `--color-overlay-dim`, `--color-overlay-scrim`, `--color-shadow` — hairline, not heavy chrome.

---

## Tokens — Typography

### Lora — Display / editorial serif · `--font-lora`
- **Role:** Name, case-study headlines, quote tiles, display moments
- **Weights:** display/H1–H2 typically **600**; H3 **500** — medium, not black; do not shout with heavy bold on parchment
- **Tracking:** slightly negative at larger sizes (`--text-display-tracking: -0.02em`, H1 `-0.015em`, H2 `-0.01em`)
- **Substitute:** Georgia, ui-serif

### Open Sans — Body / UI · `--font-body` / `--font-sans`
- **Role:** Body, labels, nav pills, captions, case-study prose
- **Substitute:** system-ui, sans-serif

### Type scale (CSS already live)

| Role | Token size | Leading | Tracking |
|------|------------|---------|----------|
| display | `clamp(2rem, 4vw, 2.75rem)` | 1.15 | -0.02em |
| h1 | `clamp(1.5rem, 2.5vw, 2rem)` | 1.2 | -0.015em |
| h2 | `clamp(1.125rem, 1.8vw, 1.375rem)` | 1.3 | -0.01em |
| h3 | `1.125rem` | 1.4 | -0.005em |
| body-lg | `1.125rem` | 1.5 | — |
| body | `1rem` | 1.5 | — |
| body-sm / label / caption | `0.875rem` | 1.45–1.5 | labels `0.04em` |

Hierarchy comes from **size + serif/sans pairing**, not from many weights.

---

## Tokens — Spacing & Shape

**Base:** prefer 4px rhythm; page padding `clamp(16px, 4vw, 32px)` · `--page-padding`  
**Grid:** `--grid-columns: 4` on tablet+desktop; **2** on mobile (`html[data-device=mobile]` ≤767px). `--grid-width: 1020px` (mobile fluid: `min(1020px, max(320px, …))`), `--grid-gap: 20px`, `--site-max-width: 1440px`  
**Nav height:** `--nav-height: 48px` (mobile: two rows — logo/theme, then filters)

### Border radius

| Element | Value | Token / rule |
|---------|-------|----------------|
| Small chrome | `12px` | `--radius-sm` |
| Medium chrome | `20px` | `--radius-md` |
| Tiles | `calc(var(--grid-gap) * 1.25)` (~25px) | `--tile-radius` |
| Pills / thumbs | `9999px` | `--radius-full` |
| **Case-study figures & videos** | **`24px`** | Always — matches portfolio stills (Rayo-quiet figures) |

### Elevation

Tiles use soft dual shadows: `--shadow-tile`, hover `--shadow-tile-hover`, press `--shadow-tile-pressed`, elevated `--shadow-tile-elevated`. Dark mode deepens key/ambient. Do not invent hard drop shadows on case-study prose cards.

### Motion

| Token | Value | Use |
|-------|-------|-----|
| `--transition-fast` | 0.15s | Micro chrome |
| `--transition-press` | 0.16s | Tap/press |
| `--transition-base` | 0.35s | Default |
| `--transition-slow` | 0.55s | Larger morphs |
| `--transition-tile-flip` | 0.6s | Filter reflow |
| `--transition-theme` | 0.35s | Light/dark |
| `--transition-reading` | 0.42s | Detailed/Summary folds |

Respect `prefers-reduced-motion`. On coarse pointers, hide custom cursor / hover-only labels.

---

## Components (portfolio-specific)

### Bento tile
Rounded `--tile-radius`, elevated paper fill, soft `--shadow-tile`. Sizes `1x1` / `2x1` / `1x2` / `2x2` on the 4-col grid. Accents via `--color-tile-*`. Inactive (filtered) tiles: hide on mobile; do not leave dim ghosts that eat taps.

### Filter pill (nav)
Frosted pill, sliding thumb, labels **All / Work / About / Side Quests** (Music is folded into Side Quests). Mobile: own row under logo+theme; chips ≥44px tall; pill may scroll horizontally — never cover logo/theme.

### Theme toggle
≥44×44 hit target. Light parchment ↔ midnight indigo with amber edge character in dark.

### Case-study article
Centered column ~680px. Structure: Role → Impact → Problem → decision beats → Result. Detailed/Summary toggle sticky **below** header chrome (scroll-padding accounts for two-row mobile header).

### Case-study figure / video
- Media: `border-radius: 24px`; overflow hidden on the frame.
- Caption: **centered**, color `--color-text-secondary` (light gray, not near-black), `margin-top: 12px`.
- Rule: every figure **finishes the sentence above it** — cut orphan media.
- Phone carousels (Source Insights): one phone + peek on mobile; plain gallery stacks for research stills (CheapVoyage beat 1) — never reuse phone-row for non-phone artifacts.
- Demo video: muted, `playsInline`, `loop`, autoplay, no chrome, full column width when used.

### Music (mobile)
48×48 round note/pause FAB, bottom-right + safe-area. Iframe 1×1 in-view, opacity 0, pointer-events none — never block the grid.

### Modals / galleries (About, Himalaya)
Close control ≥44×44, above content, not under images/text.

### Coming-soon tiles
Visible but not fake-tappable: `aria-disabled`, no press scale, default cursor.

---

## Do’s and Don’ts

### Do
- Keep parchment (light) and midnight indigo (dark) as the only canvases; let amber glow stay atmospheric in dark, not a brand flood
- Pair Lora display with Open Sans body; tighten tracking only at display/heading sizes
- Use pill geometry for filters and reading toggles; soft tile radius for bento cards; **24px** for case-study media
- Center figure captions in secondary gray with 12px gap under media
- Design for mobile thumbs: 44×44 minimum, two-row header, hide filtered tiles, no hover-only labels
- Write case studies as decision beats with figures that prove the beat
- Prefer existing `--color-tile-*` accents over inventing one-off hexes

### Don’t
- Don’t set the light canvas to pure `#ffffff` — parchment is the signature
- Don’t cover logo/theme with the filter pill on small viewports
- Don’t leave case-study media with square corners or near-black left-aligned captions
- Don’t put research stills into the Source Insights phone-row carousel
- Don’t let the music iframe intercept taps
- Don’t add SaaS marketing chrome (pricing tables, multi CTA pill pairs) that fights the personal bento
- Don’t introduce a third typeface without updating this file and the CSS together

---

## Surfaces

| Level | Light | Dark | Purpose |
|-------|-------|------|---------|
| 0 Canvas | Parchment `#f0eee6` | Midnight `#0d0c14` | Page |
| 1 Elevated | `#faf9f5` | `#211f33` | Tiles, cards |
| 2 Muted | `#ebebe6` | `#2a2a28` | Nested quiet |
| 3 Nav glass | translucent white | translucent night | Pills |
| 4 Overlay | dim/scrim tokens | dim/scrim tokens | Modals |

---

## Imagery & motion language

- **Home:** photography and product UI live *inside* tiles (music covers, trek photos, case covers) — the grid is the composition.
- **Case studies:** product shots, research artifacts, short looping demos. No stock lifestyle filler.
- **Personality:** side quests (Himalaya, Duolingo, music) are allowed; Work filter must still surface real case studies first.
- **Dark mode:** distinctive — indigo field + amber edge. Preserve it; don’t flatten to generic gray dark mode.

---

## Layout

- Home: centered bento, max site width 1440px, grid 1020px / 4 columns (2 on mobile ≤767).
- Case study: single column ~680px, generous vertical rhythm, sticky reading toggle clear of copy.
- Mobile-first chrome: logo | theme on row 1; filters on row 2; safe-area insets on FAB and header.

---

## Inconsistencies to watch (living audit)

Call these out when found; fix in CSS + this file together:

1. Case-study media missing `24px` radius  
2. Captions left-aligned or using primary (near-black) color  
3. Caption gap ≠ 12px  
4. Filter pill overlapping logo/theme on ~390px  
5. Hover labels appearing on touch devices  
6. Phone-row used for non-phone figures  
7. Mini-player iframe blocking clicks  
8. Coming-soon tiles behaving like buttons  
9. Light mode drifting to pure white canvas  
10. New hex accents not in `--color-tile-*` / token tables  

---

## Agent prompt guide (quick)

- Canvas light: `#f0eee6` · dark: `#0d0c14`  
- Text primary / secondary / tertiary as tokens above  
- Serif headlines (Lora), sans body (Open Sans)  
- Tiles: soft shadow + `--tile-radius` · Filters: pill `9999px`  
- Case figures: 24px radius · caption centered secondary · mt 12px  
- Mobile: 44×44 targets · two-row header · music = round note FAB  

### Example prompts
1. **Home tile:** Elevated paper card, tile radius, soft dual shadow, optional teal accent edge, serif title + sans meta.  
2. **Case figure:** Image/video 24px radius; caption centered, `--color-text-secondary`, margin-top 12px.  
3. **Filter pill:** Frosted nav fill, active thumb, 44px min height on mobile, horizontal scroll if needed.  

---

## Alignment

| Role | Owns |
|------|------|
| **Kern** | Taste, Do/Don’t, inconsistency callouts, proposed token changes |
| **Mosaic** | CSS variables, component implementation, PR to keep DESIGN.md ↔ code true |
| **Oscar** | Personality, which projects define “who I am to work with,” veto / evolve the living doc |

**Sources informing this draft (Refero patterns, not clones):**

| Refero style | Borrowed pattern | Explicitly skipped |
|--------------|------------------|--------------------|
| Steep | Editorial restraint, ~24px cards, rare accent | Peach SaaS palette |
| Dala | Dark as a material; hierarchy via scale | Particle hero, ultra-light body |
| Air | Imagery carries emotion; chrome stays light | Compressed/cursive display cuts |
| Apple (España) | Generous air; surface bands over heavy borders | SF Pro / Apple blue / zero-shadow dogma |
| Dayos | Warm non-white canvas; floating nav pill | Condensed all-caps brutalism |
| MindMarket | Cream paper + soft radii + pill nav | 50px sticker radii; Inter-only display |
| Seline | Whisper headlines; one soft elevation system | Cyan SaaS CTA; 10px product cards |
| monopo saigon | Pill vs quiet chrome binary | Sharp 0px cards; iridescent hero |
| Ditto | Serif + sans pairing; 24px cards; full pills | Highlighter yellow CTA flood |

**Authority is the live oscarrode.com CSS**, not the references. Full extract notes: `refero-audit.md` + `site-tokens.md` beside this file.

When this file and the CSS disagree, update both in the same change.

---

## Living sync (Mosaic, 2026-09-09)

- Case-study figure CSS already matches this contract (`24px` radius; caption centered, `--color-text-secondary`, `margin-top: 12px`) via PR #34.
- Verified tokens against live `src/app/globals.css` on main; filter labels and mobile breakpoint corrected above to match code.
