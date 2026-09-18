/** Sitewide Apple / Figma continuous-corner lock (iOS preset). */
export const CORNER_SMOOTHING = 0.6;

/**
 * Soft-radius surfaces (not pills / perfect circles).
 * Keep in sync with globals.css `@supports (corner-shape: squircle)` list.
 */
export const CONTINUOUS_CORNER_SELECTORS = [
  ".tile-card",
  ".photo-stack-morph-card",
  ".music-morph-card",
  ".music-morph-player",
  ".intro-morph-card",
  ".case-study-morph-card",
  ".case-study-cover-stage",
  ".case-study-cover-photo",
  ".case-study-phone-img",
  ".case-study-gallery-img",
  ".case-study-figure-label",
  ".cover-podcast-tile",
  ".cover-thesis-ghost",
  ".cover-music-plugin",
  ".cover-music-track",
  ".cover-music-chat",
  ".cover-music-bubble--ai",
  ".custom-cursor-label[data-multiline=\"true\"]",
  "[data-continuous-corners]",
].join(", ");

export function pathToMaskImage(path: string, width: number, height: number): string {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><path fill="black" d="${path}"/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export function readCornerRadiusPx(styles: CSSStyleDeclaration): number {
  const raw = styles.borderTopLeftRadius || styles.borderRadius || "0";
  const match = raw.match(/([0-9.]+)px/);
  if (!match) return 0;
  return parseFloat(match[1]);
}

export function shouldSkipContinuousCorners(styles: CSSStyleDeclaration): boolean {
  const radius = styles.borderTopLeftRadius || styles.borderRadius || "";
  if (radius.includes("%") && /50\s*%/.test(radius)) return true;
  if (radius.includes("999")) return true;
  return readCornerRadiusPx(styles) < 1;
}
