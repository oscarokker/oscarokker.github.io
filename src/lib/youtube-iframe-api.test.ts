import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  ensureYoutubeIframeApi,
  setYoutubeIframeApiHostForTests,
  YOUTUBE_IFRAME_API_SRC,
} from "./youtube-iframe-api.ts";

type FakePlayer = { destroy?: () => void };

function createHost() {
  const listeners = new Map<string, Set<EventListener>>();
  const scripts: { src: string; el: FakeScript }[] = [];

  class FakeScript {
    src = "";
    addEventListener(type: string, listener: EventListener) {
      const set = listeners.get(type) ?? new Set();
      set.add(listener);
      listeners.set(type, set);
    }
    remove() {
      const i = scripts.findIndex((row) => row.el === this);
      if (i >= 0) scripts.splice(i, 1);
    }
    dispatch(type: string) {
      for (const listener of listeners.get(type) ?? []) {
        listener(new Event(type));
      }
    }
  }

  const headChildren: FakeScript[] = [];
  const host = {
    YT: undefined as
      | {
          Player: new () => FakePlayer;
          PlayerState: { PLAYING: number };
        }
      | undefined,
    onYouTubeIframeAPIReady: undefined as (() => void) | undefined,
    document: {
      querySelector(selector: string) {
        if (!selector.includes("iframe_api")) return null;
        return scripts[0]?.el ?? null;
      },
      createElement(tag: string) {
        assert.equal(tag, "script");
        return new FakeScript();
      },
      getElementsByTagName(tag: string) {
        if (tag !== "script") return [];
        return scripts.map((row) => row.el);
      },
      head: {
        appendChild(el: FakeScript) {
          headChildren.push(el);
          scripts.push({ src: el.src, el });
          return el;
        },
      },
      documentElement: {
        appendChild(el: FakeScript) {
          scripts.push({ src: el.src, el });
          return el;
        },
      },
    },
    scripts,
    headChildren,
    FakeScript,
  };

  return host;
}

afterEach(() => {
  setYoutubeIframeApiHostForTests(null);
});

test("does not inject iframe_api until ensureYoutubeIframeApi is called", () => {
  const fake = createHost();
  setYoutubeIframeApiHostForTests(fake as never);
  assert.equal(fake.scripts.length, 0);
});

test("injects iframe_api once and dedupes concurrent callers", async () => {
  const fake = createHost();
  setYoutubeIframeApiHostForTests(fake as never);

  const first = ensureYoutubeIframeApi();
  const second = ensureYoutubeIframeApi();
  assert.equal(first, second);
  assert.equal(fake.scripts.length, 1);
  assert.equal(fake.scripts[0]?.el.src, YOUTUBE_IFRAME_API_SRC);

  class Player {}
  fake.YT = { Player, PlayerState: { PLAYING: 1 } };
  fake.onYouTubeIframeAPIReady?.();

  const api = await first;
  assert.equal(api.Player, Player);
  assert.equal(await second, api);
});

test("failed load clears the cache so the next open retries", async () => {
  const fake = createHost();
  setYoutubeIframeApiHostForTests(fake as never);

  const first = ensureYoutubeIframeApi();
  const tag = fake.scripts[0]?.el;
  assert.ok(tag);
  tag.dispatch("error");

  await assert.rejects(first, /Failed to load YouTube IFrame API/);
  assert.equal(fake.scripts.length, 0);

  const retry = ensureYoutubeIframeApi();
  assert.notEqual(retry, first);
  assert.equal(fake.scripts.length, 1);

  class Player {}
  fake.YT = { Player, PlayerState: { PLAYING: 1 } };
  fake.onYouTubeIframeAPIReady?.();
  const api = await retry;
  assert.equal(api.Player, Player);
});

test("resolves immediately when YT.Player is already present", async () => {
  const fake = createHost();
  class Player {}
  fake.YT = { Player, PlayerState: { PLAYING: 1 } };
  setYoutubeIframeApiHostForTests(fake as never);

  const api = await ensureYoutubeIframeApi();
  assert.equal(api.Player, Player);
  assert.equal(fake.scripts.length, 0);
});
