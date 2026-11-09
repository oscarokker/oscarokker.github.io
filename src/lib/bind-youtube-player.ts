import {
  ensureYoutubeIframeApi,
  type YoutubeIframeApi,
  type YoutubePlayer,
} from "./youtube-iframe-api.ts";

export type BindYoutubePlayerOptions = {
  getIframe: () => HTMLIFrameElement | null | undefined;
  signal: AbortSignal;
  events?: {
    onStateChange?: (event: { data: number }) => void;
  };
  ensureApi?: () => Promise<YoutubeIframeApi>;
  schedule?: (callback: () => void) => void;
};

export function defaultBindSchedule(callback: () => void): void {
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(callback);
    return;
  }
  setTimeout(callback, 0);
}

/**
 * Resolve when `getIframe()` returns an element, or `null` if `signal` aborts.
 * Needed because a cached `ensureYoutubeIframeApi()` can resolve before React
 * commits the youtube-nocookie iframe (second track, reopen, fast switch).
 */
export function waitForIframe(
  getIframe: () => HTMLIFrameElement | null | undefined,
  signal: AbortSignal,
  schedule: (callback: () => void) => void = defaultBindSchedule,
): Promise<HTMLIFrameElement | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: HTMLIFrameElement | null) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      resolve(value);
    };
    const onAbort = () => finish(null);
    if (signal.aborted) {
      finish(null);
      return;
    }
    signal.addEventListener("abort", onAbort);
    const tick = () => {
      if (signal.aborted) {
        finish(null);
        return;
      }
      const iframe = getIframe() ?? null;
      if (iframe) {
        finish(iframe);
        return;
      }
      schedule(tick);
    };
    tick();
  });
}

export async function bindYoutubePlayer(
  options: BindYoutubePlayerOptions,
): Promise<YoutubePlayer | null> {
  const {
    getIframe,
    signal,
    events,
    ensureApi = ensureYoutubeIframeApi,
    schedule = defaultBindSchedule,
  } = options;

  if (signal.aborted) return null;

  let api: YoutubeIframeApi;
  try {
    api = await ensureApi();
  } catch (error) {
    if (signal.aborted) return null;
    throw error;
  }

  if (signal.aborted) return null;

  const iframe = await waitForIframe(getIframe, signal, schedule);
  if (!iframe || signal.aborted) return null;

  let player: YoutubePlayer;
  try {
    player = new api.Player(iframe, {
      events: {
        onStateChange: (event) => {
          if (signal.aborted) return;
          events?.onStateChange?.(event);
        },
      },
    });
  } catch (error) {
    if (signal.aborted) return null;
    throw error;
  }

  if (signal.aborted) {
    try {
      player.destroy?.();
    } catch {
      // Player may already be tearing down with the iframe.
    }
    return null;
  }

  return player;
}
