# Optional-loading evidence (Mosaic, 2026-11-09)

Baseline: `main` `07bba5d`. Changed: this branch’s production `out/` after `npm run build`.

## Policy

Demand-load YouTube IFrame API and the expanded Ghostlink shell. Intent-prefetch the **same-origin** Ghostlink shell on hover/focus/pointerdown of the Ghostlink tile only. Do **not** idle-timer preload, and do **not** prefetch `@strudel/web` (already ~211 KB gzip) or YouTube’s third-party `iframe_api` / `www-widgetapi.js`.

## Bundles (home HTML-referenced JS)

| | raw | gzip |
|---|---:|---:|
| Baseline | 743 618 | 231 156 |
| Changed | 710 343 | 222 075 |
| Delta | **−33 275** | **−9 081** |

Page chunk: `page-fcc7148336e64c92.js` 42 181 / 14 627 gzip. Expanded UI strings (`Loading Strudel…`, Unmute, neo.trance, …) stay in `beat-lab-expanded.*.js` (10 506 gzip), **not** in `index.html`. `@strudel/web` stays in `cee746ab.*.js` (~211 KB gzip), still not HTML-referenced.

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
| Cold click (400ms chunk delay) | expanded + Strudel; overlay opens |
| Close during delayed chunk, then CheapVoyage | expanded root **0**; case-study title/assets load |
| Chunk abort then retry | first click stays collapsed; second click opens |
| Concurrent double-click | **1** expanded chunk request |
| Open Feel Alive | `iframe_api` + `www-widgetapi.js` + youtube-nocookie embed |
| Close during delayed `iframe_api` | `YT.Player` constructs **0** after close |
| API abort then retry | next open injects again |

JSON: `playwright-network.json`. Screenshots: `desktop-idle.png`, `desktop-ghostlink-open.png`, `desktop-music-open.png`, `mobile-idle.png`, `mobile-ghostlink-open.png`.

## MusicPlayer iframe-timing (Proof review of 524c6ae)

**Root cause: confirmed.** After `await ensureYoutubeIframeApi()`, init returned if `iframeRef.current` was null and never retried. A cached API resolves on a microtask, which can beat the youtube-nocookie iframe commit. Hide also destroyed `YT.Player` without re-running init on reopen (same `youtubeId`), so close→reopen and second-track/fast-switch could leave play/pause/progress unwired.

**Fix:** `bindYoutubePlayer` waits for the iframe (rAF / `setTimeout(0)`) with `AbortSignal`; MusicPlayer binds only while the overlay is visible and aborts/destroys on close. No idle `iframe_api` inject. `playTrack` still kicks the API on user open only.

| Scenario | Result |
|---|---|
| Unit: old early-return + delayed iframe | `YT.Player` constructs **0** (the regression) |
| Unit: cached API, iframe mounted late | constructs **1** after the delayed mount |
| Unit: first open (slow API, iframe ready) | constructs **1** |
| Unit: close+reopen / second track / fast switch | each bind constructs; abort skips in-flight |
| Unit: close during API load | constructs **0** |
| Unit: abort after construct | destroy **1**, return null |
| Unit: play/pause via stub `onStateChange` | PLAYING / BUFFERING / PAUSED forwarded; dropped after abort |
| Playwright cold idle (no YT stub) | 0 `iframe_api` / widgetapi / expanded / Strudel |
| Playwright first track (API pre-cached) | 1 construct, Feel Alive (`SLBmsHOsuLU`) |
| Playwright close and reopen same track | 2 constructs |
| Playwright second track after cache | 3rd construct is Moonlit (`H-DNcJ-KnTE`) |
| Playwright fast switch | last construct Moonlit; prior player destroyed |
| Playwright close during delayed `iframe_api` | constructs **0** |
| Playwright play/pause (mobile FAB + stub) | `Pause music` → `Play music` → `Pause music`; state events `[1, 2, 1]` |

Delayed-iframe-after-cached-API is exercised in `src/lib/bind-youtube-player.test.ts` with an injectable scheduler (React’s commit-then-effect happy path often hides the race in the browser). Playwright uses a `window.YT` stub so these prove **Player construction and state wiring**, not real YouTube media playback.

JSON: `youtube-player-bind.json`. Reproduce: `node scripts/optional-loading/playwright-youtube-player.mjs` and `npm run test:optional-loading`.

## Honest limits

- Headless embed of Feel Alive returned YouTube’s “This video is unavailable” (127.0.0.1 origin / bot player) when the real iframe_api is used. That does **not** prove real YouTube media playback. It **does** prove the parent page requests `iframe_api` only after a YouTube tile is opened, and that the iframe `src` is the existing youtube-nocookie autoplay URL.
- In-flight script downloads cannot always be aborted; close-during-load must not *use* them (no `YT.Player`, no Ghostlink overlay after cancel).
- Both live music tiles have a `youtubeId`. Tiles without one never call `playTrack`, so they never start the API.
- `npm run lint` already reports pre-existing errors elsewhere; new files in this change lint clean.
