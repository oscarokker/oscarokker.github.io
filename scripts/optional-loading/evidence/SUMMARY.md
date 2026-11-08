# Optional-loading evidence (Mosaic, 2026-11-08)

Baseline: `main` `07bba5d`. Changed: this branch’s production `out/` after `npm run build`.

## Policy

Demand-load YouTube IFrame API and the expanded Ghostlink shell. Intent-prefetch the **same-origin** Ghostlink shell on hover/focus/pointerdown of the Ghostlink tile only. Do **not** idle-timer preload, and do **not** prefetch `@strudel/web` (already ~211 KB gzip) or YouTube’s third-party `iframe_api` / `www-widgetapi.js`.

## Bundles (home HTML-referenced JS)

| | raw | gzip |
|---|---:|---:|
| Baseline | 743 618 | 231 156 |
| Changed | 709 510 | 221 783 |
| Delta | **−34 108** | **−9 373** |

Page chunk: 76 998 / 24 320 gzip → ~42 KB / ~14.6 KB gzip. Expanded UI strings (`Loading Strudel…`, Unmute, neo.trance, …) moved to `beat-lab-expanded.*.js` (10 506 gzip), **not** in `index.html`. `@strudel/web` stays in `cee746ab.*.js` (~211 KB gzip), still not HTML-referenced.

`iframe_api` remains a **string** in a home chunk (the loader URL). Idle home does **not** fetch it.

Reproduce: `node scripts/optional-loading/analyze-bundles.mjs out changed`

## Network (Playwright Chromium, static `out/`)

| Scenario | Result |
|---|---|
| Desktop idle 2.5s | 0 `iframe_api`, 0 `www-widgetapi.js`, 0 expanded chunk, 0 Strudel |
| Mobile idle | same |
| Hover Ghostlink | 1× `beat-lab-expanded` chunk; overlay not opened |
| Click after hover | 0 extra expanded chunk (cached); Strudel + samples + JetBrains Mono load |
| Reopen | 0 extra JS |
| Cold click (400ms chunk delay) | expanded + Strudel; overlay opens (~836ms) |
| Close during delayed chunk, then CheapVoyage | expanded root **0**; case-study title/assets load |
| Chunk abort then retry | first click stays collapsed; second click opens |
| Concurrent double-click | **1** expanded chunk request |
| Open Feel Alive | `iframe_api` + `www-widgetapi.js` + youtube-nocookie embed |
| Close during delayed `iframe_api` | `YT.Player` constructs **0** after close |
| API abort then retry | next open injects again |

JSON: `playwright-network.json`. Screenshots: `desktop-idle.png`, `desktop-ghostlink-open.png`, `desktop-music-open.png`, `mobile-idle.png`, `mobile-ghostlink-open.png`.

## Honest limits

- Headless embed of Feel Alive returned YouTube’s “This video is unavailable” (127.0.0.1 origin / bot player). That does **not** prove real YouTube media playback. It **does** prove the parent page requests `iframe_api` only after a YouTube tile is opened, and that the iframe `src` is the existing youtube-nocookie autoplay URL.
- In-flight script downloads cannot always be aborted; close-during-load must not *use* them (no `YT.Player`, no Ghostlink overlay after cancel).
- Both live music tiles have a `youtubeId`. Tiles without one never call `playTrack`, so they never start the API.
- `npm run lint` already reports pre-existing errors elsewhere; new files in this change lint clean.
