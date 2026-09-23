# oscarrode.com — Style Reference
> playful bento portfolio on warm parchment (and midnight amber)

**Theme:** light + dark (first-class pair)  
**Living document:** update when the live site changes; Kern (design) proposes, Mosaic (code) confirms tokens match CSS. Oscar can ask anytime for improvements.

Oscar Rode's portfolio is a personal UX/UI surface — not a SaaS landing page. Visitors should quickly see the design work, the case studies, and who he is to work with. The system is a **bento tile grid** on a warm off-white parchment in light mode, and a deep indigo canvas with a soft amber edge glow in dark mode. Display and body both use Satoshi, a warm geometric grotesk with rounded terminals — hierarchy comes from weight + size. Soft rounded tiles, pill filters, and quiet elevation make the grid feel tactile and slightly playful without becoming loud. Case-study pages are a quieter editorial column: product figures and looping demos finish the sentence above them — they never decorate.

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

### Satoshi — sole family · `--font-satoshi` / `--font-sans` / `--font-body`
- **Source:** Fontshare (ITF Free Font License) — self-host WOFF2 via next/font/local. Not Google Fonts.
- **Why:** Warm geometric grotesk with rounded terminals — matches Phosphor softness; hierarchy from weight + size (no Lora/Open Sans split).
- **Ship weights:** variable 300–900 (or static 400 · 500 · 700 · 900). Map old 600→700, 800→900.
- **Fallback:** system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif

### Rare exception: Nunito Sans for Duolingo streak counter · `--font-nunito`
- **Source:** Google Fonts via next/font/google — weights 800, 900 only.
- **Why:** Stand-in for proprietary Duolingo Sans (only served from Duolingo's CDN). Nunito Sans is a visually compatible free alternative.
- **Scope:** Applied **only** to `.duolingo-streak-value` (the streak number). All other Duolingo tile text, the flame icon, and the rest of the site remain Satoshi.
- **Fallback:** system-ui, sans-serif

### Role → weight lock
Display/name/case hero 900; H1 600; H2/tile titles 700; H3 500; body/body-lg 400; labels/captions/nav 500; Duolingo streak 900.

Keep existing size/leading/tracking scale; family becomes Satoshi everywhere.

**Do:** one family sitewide; retire/alias --font-lora/--font-serif.  
**Don't:** keep Lora for quotes; load from Google; leave 600/800 unmapped.

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

**Base:** prefer 4px rhythm; page padding `24px` · `--page-padding`  
**Grid:** `--grid-columns: 4` on tablet+desktop; **2** on mobile (`html[data-device=mobile]` / `@media (max-width: 767px)`). Max `1020px` (4×240 + 3×20), fluid shrink with 24px side margins; `--grid-gap: 20px` (mobile `16px`); `--site-max-width: 1440px`  
**Nav height:** `--nav-height: 48px` (mobile: two rows — logo/theme, then filters)

### Border radius

| Element | Value | Token / rule |
|---------|-------|----------------|
| Small chrome | `12px` | `--radius-sm` |
| Medium chrome | `20px` | `--radius-md` |
| Tiles | `calc(var(--grid-gap) * 1.4)` (28px desktop/tablet; ~22.4px mobile) | `--tile-radius` |
| Pills / thumbs | `9999px` | `--radius-full` |
| **Case-study figures & videos** | **`24px`** | Always — matches portfolio stills (Rayo-quiet figures) |

**Continuous corner smoothing:** **`60%`** (`--corner-smoothing: 0.6`) — Apple / Figma iOS preset (squircles), sitewide on soft-radius chrome (tiles, morph cards, case-study media, cover art). Native CSS `corner-shape: squircle` where supported; `figma-squircle` SVG-mask polyfill (`ContinuousCorners`) elsewhere. **Do** keep radius magnitudes; change the curve. **Don’t** apply continuous smoothing to pills (`9999px`) or perfect circles (`50%`).

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

#### Home "bento assemble" intro

Feel: the site assembles itself saying hi. Pleasant; almost want to refresh. Never blocks use. Total choreography ~1.0–1.2s (hard range 0.8–1.4s).

**Per tile (home grid only on full load/refresh):**

| Prop | From | To |
|---|---|---|
| opacity | 0 | 1 |
| transform | translateY(20px) | translateY(0) |
| filter | blur(6px) | blur(0) |

- **Duration per tile:** 0.55s
- **Ease:** `cubic-bezier(0.16, 1, 0.3, 1)` — matches `--transition-tile-flip` / reading
- **Stagger:** 0.07s between consecutive tiles, row-major top→bottom. Overlap. Cap total stagger so more tiles don't push past ~1.2s total choreography.

**Chrome:** Header (logo + theme) and desktop/tablet filter pill **assemble from above** — same opacity/blur/ease as tiles, but `translateY(-20px)` (from top instead of bottom).

| Prop | From | To |
|---|---|---|
| opacity | 0 | 1 |
| transform | translateY(-20px) | translateY(0) |
| filter | blur(6px) | blur(0) |

- **Duration:** 0.55s
- **Ease:** `cubic-bezier(0.16, 1, 0.3, 1)` — matches tiles
- **Stagger:** Header (logo + theme) at 0ms; top filter pill at ~70ms; tiles start at 80ms — chrome leads by a hair
- **Mobile bottom filter bar:** opacity + blur only; **no** translateY (don't animate as if from top when it sits at bottom)

**Must:**
- `pointer-events` normal during animation — no interaction gate
- `prefers-reduced-motion: reduce` → final state immediately
- clear `will-change` after animation completes
- no percent loader / full-screen trap / bounce springs

Don't re-run the full intro on every client filter change (optional lighter reflow later — out of scope).

---

Respect `prefers-reduced-motion`. On coarse pointers, hide custom cursor / hover-only labels.

---

## Components (portfolio-specific)

### Bento tile
Rounded `--tile-radius`, elevated paper fill, soft `--shadow-tile`. Sizes `1x1` / `2x1` / `1x2` / `2x2` on the 4-col grid. Accents via `--color-tile-*`. Inactive (filtered) tiles: hide on mobile; do not leave dim ghosts that eat taps.

### Filter pill (nav)
Frosted pill, sliding thumb, labels **All / Work / About / Side Quests** (Music is folded into Side Quests). Mobile: floating frosted pill docked at **bottom** (logo+theme stay top); chips ≥44px tall; main content padding clears the pill — never cover logo/theme.

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

## Do's and Don'ts

### Do
- Keep parchment (light) and midnight indigo (dark) as the only canvases; let amber glow stay atmospheric in dark, not a brand flood
- Use Satoshi for all type; hierarchy from weight (400/500/700/900) + size, not multiple families
- Use pill geometry for filters and reading toggles; soft tile radius for bento cards; **24px** for case-study media
- Center figure captions in secondary gray with 12px gap under media
- Design for mobile thumbs: 44×44 minimum, two-row header, hide filtered tiles, no hover-only labels
- Write case studies as decision beats with figures that prove the beat
- Prefer existing `--color-tile-*` accents over inventing one-off hexes
- Keep Beat lab audio off until Play; tear down Tone on close (no ghost transport / mini-dock)

### Don't
- Don't set the light canvas to pure `#ffffff` — parchment is the signature
- Don't cover logo/theme with the filter pill on small viewports
- Don't leave case-study media with square corners or near-black left-aligned captions
- Don't put research stills into the Source Insights phone-row carousel
- Don't let the music iframe intercept taps
- Don't add SaaS marketing chrome (pricing tables, multi CTA pill pairs) that fights the personal bento
- Don't introduce a second typeface or load from Google Fonts — Satoshi is self-hosted and covers all roles
- Don't put Tone.js on the homepage critical path or leave Transport running after Beat lab closes
- Don't wire Beat lab into the YouTube MusicPlayer mini-dock

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

### Dark-mode ASCII wave (homepage canvas)

Replaces `.aurora-bg` on the **dark homepage only**. Light parchment + paper grain unchanged. Hidden on case-study routes (same gate as the old aurora).

**Intent:** Ambient "built" texture behind the bento — slow wave / breath, readable in tile gaps and page margins. Tiles stay opaque elevated night (`#211f33`); the field must never compete with tile content or frosted nav.

| Param | Lock |
|-------|------|
| Stack | Fixed full-viewport `<canvas>`, `z-index: -1`, `pointer-events: none` |
| Engine | Custom Canvas 2D (no Three/OGL v1). Multi-sine / plasma field (Pantoine-style), **not** Matrix rain |
| Clear | Midnight `#0d0c14` (or transparent over body bg) |
| Glyph color | Cool near-white troughs → tip mix with highlight `#8573ff` (≤~40% at peaks). No glow/`shadowBlur` |
| Canvas opacity | **0.15** start (range 0.12–0.20) |
| Charset | Soft short ramp `" .·:-=+*#"` (or classic `" .:-=+*#%"`). **Reject** katakana / `01` rain / block-heavy carpets |
| Cell size | Desktop **16px**; mobile **18px** (fewer cells; ambient layer) |
| Speed | Leisurely — ~0.35× typical demo speed (aurora was a 30s drift) |
| FPS | Cap **15** desktop; **12** mobile; cancel RAF when `document.hidden` (restart on visible) |
| Perf | Glyph atlas + `drawImage` (no per-cell `fillText`); DPR capped at **1**; color buckets for tint |
| Pointer | **Off** by default (or ≤0.25 influence, fine pointer only) |
| Reduced motion | Static single frame (or still soft field) — no continuous animation |
| Grain | Drop stacked aurora grain, or keep ≤ half prior strength — ASCII already textures |

**Do:** Leave ~30–50% cells empty/near-empty so midnight air shows; fade with `--transition-theme` like aurora; destroy RAF on light theme / case study / unmount.  
**Don't:** Vertical digital rain; neon green; interactive tech-demo ripples; animate under case studies; run at uncapped 120Hz RAF; put ASCII in the DOM/`<pre>` for screen readers.

---

## Imagery & motion language

- **Home:** photography and product UI live *inside* tiles (music covers, trek photos, case covers) — the grid is the composition.
- **Case studies:** product shots, research artifacts, short looping demos. No stock lifestyle filler.
- **Personality:** side quests (Himalaya, Duolingo, music, Beat lab) are allowed; Work filter must still surface real case studies first.
- **Beat lab expandable:** Tone.js island (dynamic-import on first expand); hybrid step sequencer + “View pattern”; Play unlocks AudioContext; Transport stop + dispose + `AudioContext.suspend()` on close / tab hidden — separate from YouTube music tiles / MusicPlayer dock. Prefer violet/indigo `--color-tile-*`. No autoplay on expand; no “live coding” claim for sequencer UI.
- **Dark mode:** distinctive — indigo field + ASCII wave texture. Preserve it; don't flatten to generic gray dark mode.

---

## Layout

- Home: centered bento, max site width 1440px, grid max 1020px (fluid shrink, 24px side margins) / 4 columns (2 on mobile ≤767).
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
- Satoshi for all type: 900 display/hero, 600 H1, 700 H2, 500 H3/labels, 400 body
- Tiles: soft shadow + `--tile-radius` · Filters: pill `9999px`  
- Case figures: 24px radius · caption centered secondary · mt 12px  
- Mobile: 44×44 targets · two-row header · music = round note FAB  

### Example prompts
1. **Home tile:** Elevated paper card, tile radius, soft dual shadow, optional teal accent edge, Satoshi title (700) + meta (500).  
2. **Case figure:** Image/video 24px radius; caption centered, `--color-text-secondary`, margin-top 12px.  
3. **Filter pill:** Frosted nav fill, active thumb, 44px min height on mobile, horizontal scroll if needed.  

---

## Alignment

| Role | Owns |
|------|------|
| **Kern** | Taste, Do/Don't, inconsistency callouts, proposed token changes |
| **Mosaic** | CSS variables, component implementation, PR to keep DESIGN.md ↔ code true |
| **Oscar** | Personality, which projects define "who I am to work with," veto / evolve the living doc |

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
