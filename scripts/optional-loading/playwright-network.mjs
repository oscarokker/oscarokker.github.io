#!/usr/bin/env node
/**
 * Browser evidence for optional YouTube + Ghostlink loading.
 * Serves the static export, records idle vs first-open vs close/reopen.
 *
 *   node scripts/optional-loading/playwright-network.mjs
 *
 * Requires Playwright Chromium (`npx playwright install chromium`).
 * Simulated YouTube/widgetapi responses prove request boundaries, not real playback.
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

function classify(url) {
  const u = url.split("?")[0];
  if (u.includes("youtube.com/iframe_api") || u.includes("youtube.com/iframe_api")) return "youtube-iframe-api";
  if (u.includes("www-widgetapi") || u.includes("widgetapi.js")) return "youtube-widgetapi";
  if (u.includes("youtube.com") || u.includes("youtube-nocookie.com") || u.includes("ytimg.com") || u.includes("ggpht.com")) {
    return "youtube-other";
  }
  if (u.includes("beat-lab-expanded") || /beat-lab-expanded/.test(u)) return "beat-lab-expanded-chunk";
  if (/cee746ab|strudel/i.test(u) && u.endsWith(".js")) return "strudel-chunk";
  if (u.includes("jetbrains")) return "jetbrains-mono";
  if (u.includes("/ghostlink/samples/")) return "ghostlink-sample";
  if (u.includes("/_next/static/chunks/") && u.endsWith(".js")) return "next-chunk";
  return "other";
}

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

async function closeGhostlink(page) {
  await page.waitForSelector(".beat-lab-expanded-root .beat-lab-close", {
    timeout: 10_000,
  });
  await page.evaluate(() => {
    const btn = document.querySelector(".beat-lab-expanded-root .beat-lab-close");
    if (btn instanceof HTMLElement) btn.click();
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await page.waitForFunction(() => {
    const root = document.querySelector(".beat-lab-expanded-root");
    return !root || root.getAttribute("data-visible") === "false";
  }, { timeout: 10_000 });
  await page.waitForSelector(".beat-lab-expanded-root", {
    state: "detached",
    timeout: 10_000,
  });
}

async function closeMusic(page) {
  const miniClose = page.locator(".music-mini-close");
  if (await miniClose.count()) {
    await miniClose.click();
  } else {
    const stop = page.locator('.music-expanded-root button[aria-label^="Stop "]');
    if (await stop.count()) await stop.click();
    else await page.keyboard.press("Escape");
  }
  await page.waitForTimeout(600);
  if (await page.locator(".music-mini-close").count()) {
    await page.locator(".music-mini-close").click();
  }
  await page.waitForSelector(".music-expanded-root", {
    state: "detached",
    timeout: 10_000,
  }).catch(() => {});
}

function attachNetwork(page, log) {
  page.on("request", (req) => {
    log.push({
      at: Date.now(),
      type: "request",
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
      class: classify(req.url()),
    });
  });
  page.on("requestfailed", (req) => {
    log.push({
      at: Date.now(),
      type: "failed",
      url: req.url(),
      failure: req.failure()?.errorText ?? "failed",
      class: classify(req.url()),
    });
  });
}

function sliceLog(log, start, end) {
  return log.filter((row) => row.at >= start && row.at <= end);
}

function summarize(entries) {
  const byClass = {};
  for (const row of entries) {
    if (row.type !== "request") continue;
    byClass[row.class] = (byClass[row.class] ?? 0) + 1;
  }
  return {
    byClass,
    youtubeIframeApi: entries.filter((e) => e.class === "youtube-iframe-api" && e.type === "request").map((e) => e.url),
    youtubeWidgetapi: entries.filter((e) => e.class === "youtube-widgetapi" && e.type === "request").map((e) => e.url),
    beatLabExpanded: entries.filter((e) => e.class === "beat-lab-expanded-chunk" && e.type === "request").map((e) => e.url),
    strudel: entries.filter((e) => e.class === "strudel-chunk" && e.type === "request").map((e) => e.url),
    urls: entries.filter((e) => e.type === "request").map((e) => e.url),
  };
}

const { server, origin } = await startStaticServer();
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = { origin, generatedAt: new Date().toISOString(), scenarios: {} };

try {
  // --- Desktop idle + Ghostlink + music ---
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const log = [];
    attachNetwork(page, log);

    const idleStart = Date.now();
    await page.goto(origin + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    const idleEnd = Date.now();
    await page.screenshot({
      path: path.join(evidenceDir, "desktop-idle.png"),
      fullPage: true,
    });
    report.scenarios.desktopIdle = {
      ...summarize(sliceLog(log, idleStart, idleEnd)),
      title: await page.title(),
      ghostlinkTile: await page.locator(".beat-lab-tile").count(),
      expandedRoot: await page.locator(".beat-lab-expanded-root").count(),
      musicDialog: await page.locator(".music-expanded-root").count(),
    };

    // Intent prefetch: hover Ghostlink, do not click.
    const hoverStart = Date.now();
    await page.locator('[data-cursor-label="Enter Ghostlink"]').hover();
    await page.waitForTimeout(1200);
    const hoverEnd = Date.now();
    report.scenarios.desktopGhostlinkHoverPrefetch = {
      ...summarize(sliceLog(log, hoverStart, hoverEnd)),
      expandedRoot: await page.locator(".beat-lab-expanded-root").count(),
    };

    const openStart = Date.now();
    await page.locator(".beat-lab-tile").click();
    await page.waitForSelector(".beat-lab-expanded-root", { timeout: 15_000 });
    await page.waitForTimeout(1500);
    const openEnd = Date.now();
    await page.screenshot({
      path: path.join(evidenceDir, "desktop-ghostlink-open.png"),
    });
    report.scenarios.desktopGhostlinkFirstOpen = {
      ...summarize(sliceLog(log, openStart, openEnd)),
      expandedRoot: await page.locator(".beat-lab-expanded-root").count(),
      loadingStrudel: await page.getByText("Loading Strudel…").count(),
      worlds: await page.getByRole("tablist", { name: "Worlds" }).count(),
    };

    await closeGhostlink(page);
    const reopenStart = Date.now();
    await page.locator(".beat-lab-tile").click();
    await page.waitForSelector(".beat-lab-expanded-root", { timeout: 10_000 });
    await page.waitForTimeout(800);
    const reopenEnd = Date.now();
    report.scenarios.desktopGhostlinkReopen = {
      ...summarize(sliceLog(log, reopenStart, reopenEnd)),
      expandedRoot: await page.locator(".beat-lab-expanded-root").count(),
    };
    await closeGhostlink(page);

    const musicStart = Date.now();
    await page.locator('[aria-label="Botanica. Activate to play Feel Alive."]').click();
    await page.waitForSelector(".music-expanded-root", { timeout: 10_000 });
    await page.waitForTimeout(2000);
    const musicEnd = Date.now();
    await page.screenshot({ path: path.join(evidenceDir, "desktop-music-open.png") });
    report.scenarios.desktopMusicFirstOpen = {
      ...summarize(sliceLog(log, musicStart, musicEnd)),
      iframeCount: await page.locator(".music-expanded-root iframe").count(),
      iframeSrc: await page.locator(".music-expanded-root iframe").getAttribute("src"),
    };

    await closeMusic(page);
    await context.close();
  }

  // --- Cold Ghostlink first open (no hover prefetch), Slow 3G-ish ---
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const log = [];
    attachNetwork(page, log);
    await page.route("**/*beat-lab-expanded*", async (route) => {
      await new Promise((r) => setTimeout(r, 400));
      await route.continue();
    });
    await page.goto(origin + "/", { waitUntil: "networkidle" });
    const coldStart = Date.now();
    await page.locator(".beat-lab-tile").click();
    await page.waitForSelector(".beat-lab-expanded-root", { timeout: 15_000 });
    const coldEnd = Date.now();
    report.scenarios.desktopGhostlinkColdOpen = {
      ...summarize(sliceLog(log, coldStart, coldEnd)),
      openMs: coldEnd - coldStart,
      expandedRoot: await page.locator(".beat-lab-expanded-root").count(),
      worlds: await page.getByRole("tablist", { name: "Worlds" }).count(),
    };
    await closeGhostlink(page);
    await context.close();
  }

  // --- Close during delayed Ghostlink chunk ---
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const log = [];
    attachNetwork(page, log);
    let expandedChunkHits = 0;
    await page.route("**/*beat-lab-expanded*", async (route) => {
      expandedChunkHits += 1;
      await new Promise((r) => setTimeout(r, 2500));
      await route.continue();
    });
    await page.goto(origin + "/", { waitUntil: "networkidle" });
    const clickStart = Date.now();
    await page.locator(".beat-lab-tile").click();
    await page.waitForTimeout(200);
    // Click elsewhere (CheapVoyage) before the delayed chunk arrives.
    await page.locator('[data-cursor-label="Open CheapVoyage"]').click({ timeout: 5000 });
    await page.waitForTimeout(3000);
    const after = Date.now();
    report.scenarios.closeDuringGhostlinkChunk = {
      ...summarize(sliceLog(log, clickStart, after)),
      expandedChunkHits,
      expandedRoot: await page.locator(".beat-lab-expanded-root").count(),
      cheapVoyageOpen: await page.locator(".case-study-in-document-layer, .case-study-morph, [aria-label='Back to portfolio']").count(),
    };
    await context.close();
  }

  // --- Ghostlink load failure then retry ---
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const log = [];
    attachNetwork(page, log);
    let failOnce = true;
    await page.route("**/*beat-lab-expanded*", async (route) => {
      if (failOnce) {
        failOnce = false;
        await route.abort("failed");
        return;
      }
      await route.continue();
    });
    await page.goto(origin + "/", { waitUntil: "networkidle" });
    await page.locator(".beat-lab-tile").click();
    await page.waitForTimeout(800);
    const afterFail = {
      expandedRoot: await page.locator(".beat-lab-expanded-root").count(),
      tileExpanded: await page.locator('.beat-lab-tile[aria-expanded="true"]').count(),
    };
    await page.locator(".beat-lab-tile").click();
    await page.waitForSelector(".beat-lab-expanded-root", { timeout: 15_000 });
    report.scenarios.ghostlinkFailThenRetry = {
      afterFail,
      afterRetryExpandedRoot: await page.locator(".beat-lab-expanded-root").count(),
      requests: summarize(log),
    };
    await context.close();
  }

  // --- YouTube API fail then retry; close during API load ---
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const log = [];
    attachNetwork(page, log);
    let apiFails = 1;
    await page.route("https://www.youtube.com/iframe_api**", async (route) => {
      if (apiFails > 0) {
        apiFails -= 1;
        await route.abort("failed");
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "text/javascript",
        body: `window.YT = window.YT || { Player: function(){ this.destroy=function(){}; this.getPlayerState=function(){return 1}; this.playVideo=function(){}; this.pauseVideo=function(){}; }, PlayerState:{UNSTARTED:-1,ENDED:0,PLAYING:1,PAUSED:2,BUFFERING:3,CUED:5} }; if (typeof window.onYouTubeIframeAPIReady==='function') window.onYouTubeIframeAPIReady();`,
      });
    });
    await page.route("https://www.youtube.com/s/player/**", (route) => route.abort());
    await page.route("https://www.youtube-nocookie.com/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>mock youtube embed</body></html>",
      });
    });

    await page.goto(origin + "/", { waitUntil: "networkidle" });
    const idleYoutube = summarize(log);
    await page.locator('[aria-label="Botanica. Activate to play Feel Alive."]').click();
    await page.waitForSelector(".music-expanded-root", { timeout: 10_000 });
    await page.waitForTimeout(800);
    const afterFirst = {
      iframe: await page.locator(".music-expanded-root iframe").count(),
      apiRequests: log.filter((e) => e.class === "youtube-iframe-api").length,
    };
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    // Close may dock to mini if "playing"; force stop via mini close if needed.
    if (await page.locator(".music-expanded-root").count()) {
      const miniClose = page.locator(".music-mini-close");
      if (await miniClose.count()) await miniClose.click();
      else await page.keyboard.press("Escape");
    }
    await page.waitForTimeout(400);
    await page.locator('[aria-label="Botanica. Activate to play Feel Alive."]').click();
    await page.waitForSelector(".music-expanded-root", { timeout: 10_000 });
    await page.waitForTimeout(800);
    report.scenarios.youtubeFailThenRetry = {
      idleYoutubeApi: idleYoutube.youtubeIframeApi,
      afterFirst,
      afterRetryApiRequests: log.filter((e) => e.class === "youtube-iframe-api").length,
      note: "iframe_api is stubbed after the first abort; this does not prove real YouTube playback.",
    };
    await context.close();
  }

  // --- Close during delayed iframe_api ---
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const log = [];
    attachNetwork(page, log);
    let playerConstructs = 0;
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
    await page.route("https://www.youtube-nocookie.com/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "text/html", body: "<html></html>" });
    });
    await page.goto(origin + "/", { waitUntil: "networkidle" });
    await page.locator('[aria-label="Botanica. Activate to play Feel Alive."]').click();
    await page.waitForSelector(".music-expanded-root", { timeout: 10_000 });
    await page.waitForTimeout(200);
    await page.keyboard.press("Escape");
    if (await page.locator(".music-mini-close").count()) {
      await page.locator(".music-mini-close").click();
    }
    await page.waitForTimeout(2800);
    playerConstructs = await page.evaluate(() => window.__ytPlayerConstructs ?? 0);
    report.scenarios.closeDuringYoutubeApi = {
      playerConstructsAfterClose: playerConstructs,
      musicRoot: await page.locator(".music-expanded-root").count(),
      apiRequests: log.filter((e) => e.class === "youtube-iframe-api" && e.type === "request").length,
      note: "In-flight iframe_api download cannot always be aborted; YT.Player must not construct after close.",
    };
    await context.close();
  }

  // --- Concurrent Ghostlink opens / slow 3G first open ---
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const log = [];
    attachNetwork(page, log);
    let chunkRequests = 0;
    await page.route("**/*beat-lab-expanded*", async (route) => {
      chunkRequests += 1;
      await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });
    await page.goto(origin + "/", { waitUntil: "networkidle" });
    await Promise.all([
      page.locator(".beat-lab-tile").click(),
      page.locator(".beat-lab-tile").click(),
    ]);
    await page.waitForSelector(".beat-lab-expanded-root", { timeout: 15_000 });
    report.scenarios.concurrentGhostlinkOpen = {
      expandedChunkRequests: chunkRequests,
      expandedRoot: await page.locator(".beat-lab-expanded-root").count(),
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
    const log = [];
    attachNetwork(page, log);
    await page.goto(origin + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(evidenceDir, "mobile-idle.png"), fullPage: true });
    report.scenarios.mobileIdle = {
      ...summarize(log),
      ghostlinkTile: await page.locator(".beat-lab-tile").count(),
    };
    await page.locator(".beat-lab-tile").tap();
    await page.waitForSelector(".beat-lab-expanded-root", { timeout: 15_000 });
    await page.screenshot({ path: path.join(evidenceDir, "mobile-ghostlink-open.png") });
    report.scenarios.mobileGhostlinkOpen = {
      expandedRoot: await page.locator(".beat-lab-expanded-root").count(),
      unmute: await page.getByRole("button", { name: "Unmute — hear the world" }).count(),
    };
    await context.close();
  }

  // Case study navigation still works
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(origin + "/", { waitUntil: "networkidle" });
    await page.locator('[data-cursor-label="Open CheapVoyage"]').click();
    await page.waitForTimeout(1500);
    report.scenarios.caseStudyNavigation = {
      title: await page.title(),
      back: await page.getByRole("button", { name: /Back to portfolio/i }).count(),
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

const outPath = path.join(evidenceDir, "playwright-network.json");
await writeFile(outPath, JSON.stringify(report, null, 2) + "\n");
console.log("Wrote", outPath);
console.log(JSON.stringify({
  desktopIdleYoutube: report.scenarios.desktopIdle?.youtubeIframeApi,
  desktopIdleWidget: report.scenarios.desktopIdle?.youtubeWidgetapi,
  desktopIdleExpanded: report.scenarios.desktopIdle?.beatLabExpanded,
  desktopIdleStrudel: report.scenarios.desktopIdle?.strudel,
  hoverExpanded: report.scenarios.desktopGhostlinkHoverPrefetch?.beatLabExpanded,
  firstOpenExpanded: report.scenarios.desktopGhostlinkFirstOpen?.beatLabExpanded,
  reopenExpanded: report.scenarios.desktopGhostlinkReopen?.beatLabExpanded,
  musicApi: report.scenarios.desktopMusicFirstOpen?.youtubeIframeApi,
  closeDuringChunkRoot: report.scenarios.closeDuringGhostlinkChunk?.expandedRoot,
  failRetry: report.scenarios.ghostlinkFailThenRetry?.afterRetryExpandedRoot,
  ytConstructs: report.scenarios.closeDuringYoutubeApi?.playerConstructsAfterClose,
  concurrentChunks: report.scenarios.concurrentGhostlinkOpen?.expandedChunkRequests,
}, null, 2));
