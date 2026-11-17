/**
 * YouTube IFrame API — demand-loaded only when a YouTube track is opened.
 * Do not inject on MusicPlayer mount / idle home. widgetapi.js follows iframe_api.
 */

export const YOUTUBE_IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

/** Public IFrame API PlayerState numbers — used so bind/state tracking does not need `window.YT`. */
export const YOUTUBE_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

export type YoutubePlayer = {
  destroy?: () => void;
  getPlayerState?: () => number;
  playVideo?: () => void;
  pauseVideo?: () => void;
};

export type YoutubeIframeApi = {
  Player: new (
    element: HTMLElement | string,
    options?: {
      events?: {
        onStateChange?: (event: { data: number }) => void;
      };
    },
  ) => YoutubePlayer;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
};

type YoutubeHost = {
  YT?: YoutubeIframeApi;
  onYouTubeIframeAPIReady?: () => void;
  document: Document;
};

let loadPromise: Promise<YoutubeIframeApi> | null = null;
let testHost: YoutubeHost | null = null;

function host(): YoutubeHost {
  if (testHost) return testHost;
  if (typeof window === "undefined") {
    throw new Error("YouTube IFrame API is browser-only");
  }
  return window as Window & YoutubeHost;
}

/** Tests only — swap the window/document and drop any in-flight cache. */
export function setYoutubeIframeApiHostForTests(next: YoutubeHost | null): void {
  testHost = next;
  loadPromise = null;
}

export function ensureYoutubeIframeApi(): Promise<YoutubeIframeApi> {
  const env = host();
  if (env.YT?.Player) return Promise.resolve(env.YT);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<YoutubeIframeApi>((resolve, reject) => {
    const succeed = () => {
      const api = env.YT;
      if (!api?.Player) return false;
      resolve(api);
      return true;
    };

    if (succeed()) return;

    const previousReady = env.onYouTubeIframeAPIReady;
    env.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (!succeed()) {
        fail(new Error("YouTube IFrame API ready without YT.Player"));
      }
    };

    function fail(error: Error) {
      loadPromise = null;
      reject(error);
    }

    const doc = env.document;
    let tag = doc.querySelector<HTMLScriptElement>(
      `script[src="${YOUTUBE_IFRAME_API_SRC}"]`,
    );

    if (!tag) {
      tag = doc.createElement("script");
      tag.src = YOUTUBE_IFRAME_API_SRC;
      tag.addEventListener(
        "error",
        () => {
          tag?.remove();
          fail(new Error("Failed to load YouTube IFrame API"));
        },
        { once: true },
      );
      const firstScript = doc.getElementsByTagName("script")[0];
      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(tag, firstScript);
      } else {
        (doc.head ?? doc.documentElement).appendChild(tag);
      }
    } else {
      tag.addEventListener(
        "error",
        () => {
          fail(new Error("Failed to load YouTube IFrame API"));
        },
        { once: true },
      );
    }
  });

  return loadPromise;
}
