#!/usr/bin/env node
/**
 * YouTube player bind races against a YT stub (not real media playback).
 *
 * Covers: first open with cached API; close+reopen same track; second track;
 * fast switch; close during delayed iframe_api; play/pause via onStateChange.
 * Delayed-iframe-after-cached-API is proven in src/lib/bind-youtube-player.test.ts.
 *
 *   node scripts/optional-loading/playwright-youtube-player.mjs
 */
import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = path.resolve(process.argv[2] ?? path.join(repoRoot, "out"));
const evidenceDir = path.join(repoRoot, "scripts/optional-loading/evidence");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const FEEL_ALIVE = '[aria-label="Botanica. Activate to play Feel Alive."]';
const MOONLIT = '[aria-label="Moonlit. Activate to play Moonlit."]';
const FEEL_ALIVE_ID = "SLBmsHOsuLU";
const MOONLIT_ID = "H-DNcJ-KnTE";

async function startStaticServer() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
      let rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\//, "");
      let file = path.join(outDir, rel);
      if ((await stat(file).catch(() => null))?.isDirectory()) {
        file = path.join(file, "index.html");
      }
      const buf = await readFile(file);
      const ext = path.extname(file);
      res.writeHead(200, { "content-type": MIME[ext] ?? "application/octet-stream" });
      res.end(buf);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return { server, origin: `http://127.0.0.1:${port}` };
}

function ytStubInitScript() {
  return () => {
    window.__ytLog = { constructs: [], destroys: 0, stateEvents: [] };
    window.__ytLastPlayer = null;
    window.YT = {
      PlayerState: {
        UNSTARTED: -1,
        ENDED: 0,
        PLAYING: 1,
        PAUSED: 2,
        BUFFERING: 3,
        CUED: 5,
      },
      Player: function Player(el, opts) {
        const src = el && (el.src || (el.getAttribute && el.getAttribute("src")) || "");
        window.__ytLog.constructs.push({ src: String(src), t: Date.now() });
        this._onStateChange = opts && opts.events && opts.events.onStateChange;
        this.destroy = () => {
          window.__ytLog.destroys += 1;
        };
        this.getPlayerState = () =>
          window.__ytLog.lastState === undefined ? 1 : window.__ytLog.lastState;
        this.playVideo = () => {
          window.__ytLog.lastState = 1;
          window.__ytLog.stateEvents.push(1);
          if (this._onStateChange) this._onStateChange({ data: 1 });
        };
        this.pauseVideo = () => {
          window.__ytLog.lastState = 2;
          window.__ytLog.stateEvents.push(2);
          if (this._onStateChange) this._onStateChange({ data: 2 });
        };
        window.__ytLastPlayer = this;
        queueMicrotask(() => {
          window.__ytLog.lastState = 1;
          window.__ytLog.stateEvents.push(1);
          if (this._onStateChange) this._onStateChange({ data: 1 });
        });
      },
    };
    window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {};
  };
}

async function mockYoutubeMedia(page) {
  await page.route("https://www.youtube-nocookie.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<html><body>mock youtube embed</body></html>",
    });
  });
  await page.route("https://www.youtube.com/s/player/**", (route) => route.abort());
  await page.route("https://i.ytimg.com/**", (route) => route.abort());
}

async function waitForConstructs(page, min, timeout = 10_000) {
  await page.waitForFunction(
    (n) => (window.__ytLog && window.__ytLog.constructs && window.__ytLog.constructs.length) >= n,
    min,
    { timeout },
  );
}

async function readLog(page) {
  return page.evaluate(() => ({
    constructs: (window.__ytLog && window.__ytLog.constructs) || [],
    destroys: (window.__ytLog && window.__ytLog.destroys) || 0,
    stateEvents: (window.__ytLog && window.__ytLog.stateEvents) || [],
    lastState: window.__ytLog && window.__ytLog.lastState,
  }));
}

async function fullyCloseMusic(page) {
  for (let i = 0; i < 4; i += 1) {
    const open = await page.locator(".music-expanded-root, .music-mini-root").count();
    if (!open) return;
    const miniClose = page.locator(".music-mini-close");
    if (await miniClose.count()) {
      await miniClose.click({ force: true }).catch(() => {});
    } else {
      await page.keyboard.press("Escape");
    }
    await page.waitForTimeout(250);
  }
}

async function attachIdleNetwork(page, log) {
  page.on("request", (req) => {
    const url = req.url();
    log.push({ url, type: "request" });
  });
}

await mkdir(evidenceDir, { recursive: true });
const { server, origin } = await startStaticServer();
const browser = await chromium.launch();
const report = { origin, scenarios: {} };

try {
  // Cold idle must not fetch iframe_api / widgetapi even without the YT stub.
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const log = [];
    attachIdleNetwork(page, log);
    await page.goto(origin + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    report.scenarios.coldIdle = {
      iframeApi: log.filter((e) => e.url.includes("iframe_api")).length,
      widgetapi: log.filter((e) => e.url.includes("widgetapi")).length,
      expanded: log.filter((e) => e.url.includes("beat-lab-expanded")).length,
      strudel: log.filter((e) => /strudel/i.test(e.url) && e.url.endsWith(".js")).length,
    };
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.addInitScript(ytStubInitScript());
    await mockYoutubeMedia(page);
    await page.goto(origin + "/", { waitUntil: "networkidle" });

    await page.locator(FEEL_ALIVE).click();
    await page.waitForSelector(".music-expanded-root", { timeout: 10_000 });
    await waitForConstructs(page, 1);
    const firstOpen = await readLog(page);
    report.scenarios.firstTrackOpen = {
      constructs: firstOpen.constructs.length,
      srcHasFeelAlive: firstOpen.constructs.some((c) => c.src.includes(FEEL_ALIVE_ID)),
      iframe: await page.locator(".music-expanded-root iframe").count(),
      stateEvents: firstOpen.stateEvents,
    };

    await fullyCloseMusic(page);
    await page.waitForTimeout(400);
    await page.locator(FEEL_ALIVE).click();
    await page.waitForSelector(".music-expanded-root", { timeout: 10_000 });
    await waitForConstructs(page, 2);
    const reopened = await readLog(page);
    report.scenarios.closeAndReopenSameTrack = {
      constructs: reopened.constructs.length,
      lastSrcHasFeelAlive: String(reopened.constructs.at(-1)?.src || "").includes(FEEL_ALIVE_ID),
      destroys: reopened.destroys,
    };

    await fullyCloseMusic(page);
    await page.waitForTimeout(400);
    await page.locator(MOONLIT).click();
    await page.waitForSelector(".music-expanded-root", { timeout: 10_000 });
    await waitForConstructs(page, 3);
    const second = await readLog(page);
    report.scenarios.secondTrackAfterCachedApi = {
      constructs: second.constructs.length,
      lastSrcHasMoonlit: String(second.constructs.at(-1)?.src || "").includes(MOONLIT_ID),
      distinctIds: [...new Set(second.constructs.map((c) => {
        const match = String(c.src).match(/embed\/([^?]+)/);
        return match ? match[1] : c.src;
      }))],
    };
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.addInitScript(ytStubInitScript());
    await mockYoutubeMedia(page);
    await page.goto(origin + "/", { waitUntil: "networkidle" });
    await page.locator(FEEL_ALIVE).click();
    await page.waitForSelector(".music-expanded-root iframe", { timeout: 10_000 });
    // Overlay covers the grid; dispatch on the tile so playTrack still races the in-flight bind.
    await page.locator(MOONLIT).evaluate((el) => el.click());
    await page.waitForFunction(
      (id) =>
        (window.__ytLog?.constructs || []).some((c) => String(c.src).includes(id)),
      MOONLIT_ID,
      { timeout: 10_000 },
    );
    const fast = await readLog(page);
    report.scenarios.fastSwitch = {
      constructs: fast.constructs.length,
      destroys: fast.destroys,
      lastSrcHasMoonlit: String(fast.constructs.at(-1)?.src || "").includes(MOONLIT_ID),
      anyMoonlit: fast.constructs.some((c) => c.src.includes(MOONLIT_ID)),
    };
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__ytPlayerConstructs = 0;
    });
    await page.route("https://www.youtube.com/iframe_api**", async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: "text/javascript",
        body: `window.YT = { Player: function(){ window.__ytPlayerConstructs = (window.__ytPlayerConstructs||0)+1; this.destroy=function(){}; this.getPlayerState=function(){return 1}; }, PlayerState:{UNSTARTED:-1,ENDED:0,PLAYING:1,PAUSED:2,BUFFERING:3,CUED:5} }; if (typeof window.onYouTubeIframeAPIReady==='function') window.onYouTubeIframeAPIReady();`,
      });
    });
    await mockYoutubeMedia(page);
    await page.goto(origin + "/", { waitUntil: "networkidle" });
    await page.locator(FEEL_ALIVE).click();
    await page.waitForSelector(".music-expanded-root", { timeout: 10_000 });
    await page.waitForTimeout(200);
    await fullyCloseMusic(page);
    await page.waitForTimeout(2800);
    report.scenarios.closeDuringApiLoad = {
      playerConstructsAfterClose: await page.evaluate(() => window.__ytPlayerConstructs ?? 0),
      musicRoot: await page.locator(".music-expanded-root, .music-mini-root").count(),
    };
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    const page = await context.newPage();
    await page.addInitScript(ytStubInitScript());
    await mockYoutubeMedia(page);
    await page.goto(origin + "/", { waitUntil: "networkidle" });
    await page.locator(FEEL_ALIVE).tap();
    await page.waitForSelector(".music-expanded-root", { timeout: 10_000 });
    await waitForConstructs(page, 1);
    await page.locator('[aria-label="Minimize Feel Alive"]').tap();
    await page.waitForSelector(".mobile-music-button", { timeout: 10_000 });
    const afterPlay = await page.locator(".mobile-music-button").getAttribute("aria-label");
    await page.locator(".mobile-music-button").tap();
    await page.waitForTimeout(200);
    const afterPause = await page.locator(".mobile-music-button").getAttribute("aria-label");
    await page.locator(".mobile-music-button").tap();
    await page.waitForTimeout(200);
    const afterResume = await page.locator(".mobile-music-button").getAttribute("aria-label");
    const log = await readLog(page);
    report.scenarios.playPauseStateTracking = {
      constructs: log.constructs.length,
      stateEvents: log.stateEvents,
      afterPlay,
      afterPause,
      afterResume,
    };
    await context.close();
  }
} catch (error) {
  report.error = String(error);
  if (error instanceof Error) report.errorStack = error.stack;
  console.error(error);
} finally {
  await browser.close();
  server.close();
}

const outPath = path.join(evidenceDir, "youtube-player-bind.json");
await writeFile(outPath, JSON.stringify(report, null, 2) + "\n");
console.log("Wrote", outPath);
console.log(JSON.stringify({
  coldIdle: report.scenarios.coldIdle,
  firstTrackOpen: report.scenarios.firstTrackOpen,
  closeAndReopenSameTrack: report.scenarios.closeAndReopenSameTrack,
  secondTrackAfterCachedApi: report.scenarios.secondTrackAfterCachedApi,
  fastSwitch: report.scenarios.fastSwitch,
  closeDuringApiLoad: report.scenarios.closeDuringApiLoad,
  playPauseStateTracking: report.scenarios.playPauseStateTracking,
  error: report.error ?? null,
}, null, 2));

if (report.error) process.exit(1);

const idle = report.scenarios.coldIdle;
if (!idle || idle.iframeApi !== 0 || idle.widgetapi !== 0 || idle.expanded !== 0 || idle.strudel !== 0) {
  console.error("cold idle optional-loading guarantee failed", idle);
  process.exit(1);
}
if ((report.scenarios.firstTrackOpen?.constructs ?? 0) < 1) {
  console.error("first track did not construct YT.Player");
  process.exit(1);
}
if ((report.scenarios.closeAndReopenSameTrack?.constructs ?? 0) < 2) {
  console.error("reopen same track did not construct a second YT.Player");
  process.exit(1);
}
if (!report.scenarios.secondTrackAfterCachedApi?.lastSrcHasMoonlit) {
  console.error("second track did not construct YT.Player for Moonlit");
  process.exit(1);
}
if (!report.scenarios.fastSwitch?.anyMoonlit) {
  console.error("fast switch did not construct YT.Player for Moonlit");
  process.exit(1);
}
if (report.scenarios.closeDuringApiLoad?.playerConstructsAfterClose !== 0) {
  console.error("close during API load constructed YT.Player");
  process.exit(1);
}
const pp = report.scenarios.playPauseStateTracking;
if (
  !pp ||
  pp.afterPlay !== "Pause music" ||
  pp.afterPause !== "Play music" ||
  pp.afterResume !== "Pause music"
) {
  console.error("play/pause aria-label tracking failed", pp);
  process.exit(1);
}
