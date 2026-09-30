/**
 * Ghostlink expanded shell geometry.
 * Device bands match src/lib/device.ts: mobile ≤767, tablet 768–1279, desktop ≥1280.
 * Sizes are stage targets (not content shrinkwrap). Width/height use CSS vw / dvh pixels.
 */

export interface GhostlinkShellRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type GhostlinkShellMode = "mobile" | "tablet" | "desktop";

export const GHOSTLINK_MOBILE_MAX = 767;
export const GHOSTLINK_TABLET_MAX = 1279;
/** Site max content width. Desktop shell never exceeds this. */
export const GHOSTLINK_DESKTOP_MAX_WIDTH = 1440;
/** Short-laptop floor so the IDE is not crushed. Clamped to the guttered viewport. */
export const GHOSTLINK_MIN_HEIGHT = 520;

export function ghostlinkShellMode(breakpointWidth: number): GhostlinkShellMode {
  if (breakpointWidth <= GHOSTLINK_MOBILE_MAX) return "mobile";
  if (breakpointWidth <= GHOSTLINK_TABLET_MAX) return "tablet";
  return "desktop";
}

export function measureGhostlinkShell(input: {
  /** Used px of `100vw`. */
  vw: number;
  /** Used px of `100dvh`. */
  dvh: number;
  /** `window.innerWidth` — same source as `data-device`. */
  breakpointWidth: number;
  pagePadding: number;
  portrait: boolean;
}): GhostlinkShellRect {
  const mode = ghostlinkShellMode(input.breakpointWidth);
  const { vw, dvh } = input;

  if (mode === "mobile") {
    return { top: 0, left: 0, width: vw, height: dvh };
  }

  const gutter =
    mode === "tablet"
      ? input.portrait
        ? 20
        : 24
      : Math.max(24, input.pagePadding);

  const available = Math.max(0, dvh - gutter * 2);
  const width =
    mode === "desktop"
      ? Math.min(GHOSTLINK_DESKTOP_MAX_WIDTH, Math.max(0, vw - gutter * 2))
      : Math.max(0, vw - gutter * 2);

  const ratio = mode === "desktop" ? 0.8 : 0.88;
  const target = Math.min(dvh * ratio, available);
  const floor =
    mode === "desktop" ? Math.min(GHOSTLINK_MIN_HEIGHT, available) : target;
  const height = Math.min(available, Math.max(target, floor));

  return {
    top: Math.max(0, (dvh - height) / 2),
    left: Math.max(0, (vw - width) / 2),
    width,
    height,
  };
}
