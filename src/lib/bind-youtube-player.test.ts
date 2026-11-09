import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bindYoutubePlayer,
  waitForIframe,
} from "./bind-youtube-player.ts";
import type { YoutubeIframeApi, YoutubePlayer } from "./youtube-iframe-api.ts";

type ConstructRecord = { iframe: unknown };

function createApi(constructs: ConstructRecord[], players: YoutubePlayer[] = []) {
  const handlers: Array<((event: { data: number }) => void) | undefined> = [];
  const api = {
    PlayerState: {
      UNSTARTED: -1,
      ENDED: 0,
      PLAYING: 1,
      PAUSED: 2,
      BUFFERING: 3,
      CUED: 5,
    },
    Player: class {
      destroyCount = 0;
      constructor(iframe: unknown, options?: { events?: { onStateChange?: (event: { data: number }) => void } }) {
        constructs.push({ iframe });
        handlers.push(options?.events?.onStateChange);
        players.push(this);
      }
      destroy() {
        this.destroyCount += 1;
      }
      getPlayerState() {
        return 1;
      }
      playVideo() {
        handlers.at(-1)?.({ data: 1 });
      }
      pauseVideo() {
        handlers.at(-1)?.({ data: 2 });
      }
    },
  } as unknown as YoutubeIframeApi;
  return { api, handlers, players };
}

/** The 524c6ae MusicPlayer init: await API, then give up if the iframe is not committed yet. */
async function previousInitGiveUpIfIframeMissing(
  getIframe: () => { src?: string } | null,
  ensureApi: () => Promise<YoutubeIframeApi>,
): Promise<YoutubePlayer | null> {
  const YT = await ensureApi();
  const iframe = getIframe();
  if (!iframe) return null;
  return new YT.Player(iframe as HTMLIFrameElement);
}

test("regression: cached API + late iframe used to skip YT.Player", async () => {
  const constructs: ConstructRecord[] = [];
  const { api } = createApi(constructs);
  let iframe: { src: string } | null = null;
  const player = await previousInitGiveUpIfIframeMissing(
    () => iframe,
    async () => api,
  );
  iframe = { src: "https://www.youtube-nocookie.com/embed/abc" };
  assert.equal(player, null);
  assert.equal(constructs.length, 0);
});

test("first open: slow API, iframe already mounted", async () => {
  const constructs: ConstructRecord[] = [];
  const { api } = createApi(constructs);
  const iframe = { src: "https://www.youtube-nocookie.com/embed/first" };
  let releaseApi!: (value: YoutubeIframeApi) => void;
  const ensureApi = () =>
    new Promise<YoutubeIframeApi>((resolve) => {
      releaseApi = resolve;
    });
  const ac = new AbortController();
  const pending = bindYoutubePlayer({
    getIframe: () => iframe as HTMLIFrameElement,
    signal: ac.signal,
    ensureApi,
  });
  await Promise.resolve();
  assert.equal(constructs.length, 0);
  releaseApi(api);
  const player = await pending;
  assert.ok(player);
  assert.equal(constructs.length, 1);
  assert.equal(constructs[0]?.iframe, iframe);
});

test("cached API + delayed iframe still constructs (reopen / second track race)", async () => {
  const constructs: ConstructRecord[] = [];
  const { api } = createApi(constructs);
  let iframe: { src: string } | null = null;
  const queued: Array<() => void> = [];
  const ac = new AbortController();
  const pending = bindYoutubePlayer({
    getIframe: () => iframe as HTMLIFrameElement | null,
    signal: ac.signal,
    ensureApi: async () => api,
    schedule: (callback) => queued.push(callback),
  });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(constructs.length, 0, "must not construct before the iframe exists");
  assert.ok(queued.length >= 1, "must schedule a retry while the iframe is missing");
  iframe = { src: "https://www.youtube-nocookie.com/embed/second" };
  queued.shift()?.();
  const player = await pending;
  assert.ok(player);
  assert.equal(constructs.length, 1);
  assert.equal(constructs[0]?.iframe, iframe);
});

test("close and reopen same iframe identity: second bind constructs again", async () => {
  const constructs: ConstructRecord[] = [];
  const { api } = createApi(constructs);
  const iframe = { src: "https://www.youtube-nocookie.com/embed/same" };
  const firstAbort = new AbortController();
  const first = await bindYoutubePlayer({
    getIframe: () => iframe as HTMLIFrameElement,
    signal: firstAbort.signal,
    ensureApi: async () => api,
  });
  assert.ok(first);
  firstAbort.abort();
  first?.destroy?.();

  const secondAbort = new AbortController();
  const second = await bindYoutubePlayer({
    getIframe: () => iframe as HTMLIFrameElement,
    signal: secondAbort.signal,
    ensureApi: async () => api,
  });
  assert.ok(second);
  assert.equal(constructs.length, 2);
  secondAbort.abort();
});

test("open a second track after API is cached: each iframe gets a Player", async () => {
  const constructs: ConstructRecord[] = [];
  const { api } = createApi(constructs);
  const feelAlive = { src: "https://www.youtube-nocookie.com/embed/3JZ_D3ELwOQ" };
  const moonlit = { src: "https://www.youtube-nocookie.com/embed/H-DNcJ-KnTE" };
  const firstAbort = new AbortController();
  await bindYoutubePlayer({
    getIframe: () => feelAlive as HTMLIFrameElement,
    signal: firstAbort.signal,
    ensureApi: async () => api,
  });
  firstAbort.abort();

  const secondAbort = new AbortController();
  await bindYoutubePlayer({
    getIframe: () => moonlit as HTMLIFrameElement,
    signal: secondAbort.signal,
    ensureApi: async () => api,
  });
  assert.equal(constructs.length, 2);
  assert.equal(constructs[0]?.iframe, feelAlive);
  assert.equal(constructs[1]?.iframe, moonlit);
  secondAbort.abort();
});

test("fast switch: abort in-flight bind, later track still constructs", async () => {
  const constructs: ConstructRecord[] = [];
  const { api } = createApi(constructs);
  let iframe: { src: string } | null = null;
  const queued: Array<() => void> = [];
  const firstAbort = new AbortController();
  const firstBind = bindYoutubePlayer({
    getIframe: () => iframe as HTMLIFrameElement | null,
    signal: firstAbort.signal,
    ensureApi: async () => api,
    schedule: (callback) => queued.push(callback),
  });
  await Promise.resolve();
  await Promise.resolve();
  firstAbort.abort();
  queued.shift()?.();
  assert.equal(await firstBind, null);
  assert.equal(constructs.length, 0);

  iframe = { src: "https://www.youtube-nocookie.com/embed/H-DNcJ-KnTE" };
  const secondAbort = new AbortController();
  const second = await bindYoutubePlayer({
    getIframe: () => iframe as HTMLIFrameElement,
    signal: secondAbort.signal,
    ensureApi: async () => api,
  });
  assert.ok(second);
  assert.equal(constructs.length, 1);
  secondAbort.abort();
});

test("close during API load: YT.Player never constructs", async () => {
  const constructs: ConstructRecord[] = [];
  const { api } = createApi(constructs);
  const iframe = { src: "https://www.youtube-nocookie.com/embed/abc" };
  let releaseApi!: (value: YoutubeIframeApi) => void;
  const ensureApi = () =>
    new Promise<YoutubeIframeApi>((resolve) => {
      releaseApi = resolve;
    });
  const ac = new AbortController();
  const pending = bindYoutubePlayer({
    getIframe: () => iframe as HTMLIFrameElement,
    signal: ac.signal,
    ensureApi,
  });
  ac.abort();
  releaseApi(api);
  assert.equal(await pending, null);
  assert.equal(constructs.length, 0);
});

test("abort after construct destroys the Player and returns null", async () => {
  const constructs: ConstructRecord[] = [];
  const players: Array<YoutubePlayer & { destroyCount: number }> = [];
  const ac = new AbortController();
  const api = {
    PlayerState: {
      UNSTARTED: -1,
      ENDED: 0,
      PLAYING: 1,
      PAUSED: 2,
      BUFFERING: 3,
      CUED: 5,
    },
    Player: class {
      destroyCount = 0;
      constructor(iframe: unknown) {
        constructs.push({ iframe });
        players.push(this);
        ac.abort();
      }
      destroy() {
        this.destroyCount += 1;
      }
    },
  } as unknown as YoutubeIframeApi;
  const iframe = { src: "https://www.youtube-nocookie.com/embed/abc" };
  const player = await bindYoutubePlayer({
    getIframe: () => iframe as HTMLIFrameElement,
    signal: ac.signal,
    ensureApi: async () => api,
  });
  assert.equal(player, null);
  assert.equal(constructs.length, 1);
  assert.equal(players[0]?.destroyCount, 1);
});

test("waitForIframe: abort while waiting resolves null without spinning forever", async () => {
  const ac = new AbortController();
  const queued: Array<() => void> = [];
  const pending = waitForIframe(
    () => null,
    ac.signal,
    (callback) => queued.push(callback),
  );
  assert.equal(queued.length, 1);
  ac.abort();
  assert.equal(await pending, null);
});

test("play/pause state tracking: stub Player wires onStateChange", async () => {
  const constructs: ConstructRecord[] = [];
  const { api, handlers, players } = createApi(constructs);
  const iframe = { src: "https://www.youtube-nocookie.com/embed/abc" };
  const states: number[] = [];
  const ac = new AbortController();
  const player = await bindYoutubePlayer({
    getIframe: () => iframe as HTMLIFrameElement,
    signal: ac.signal,
    ensureApi: async () => api,
    events: {
      onStateChange: (event) => {
        states.push(event.data);
      },
    },
  });
  assert.ok(player);
  assert.equal(typeof handlers[0], "function");
  handlers[0]?.({ data: 1 });
  handlers[0]?.({ data: 3 });
  handlers[0]?.({ data: 2 });
  players[0]?.playVideo?.();
  players[0]?.pauseVideo?.();
  assert.deepEqual(states, [1, 3, 2, 1, 2]);
  ac.abort();
  handlers[0]?.({ data: 1 });
  assert.deepEqual(states, [1, 3, 2, 1, 2], "aborted bind must drop state-change events");
});
