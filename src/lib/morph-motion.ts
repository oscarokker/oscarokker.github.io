/**
 * Shared enter/exit helpers for the homepage tile morph.
 * The tween is a layout animation of top/left/width/height. Two details keep
 * it from looking like a pop:
 * - After clearing an inline `transition: none`, flush layout before writing
 *   the target rect so the from-value is committed.
 * - Pause continuous-corner mask rebuilds for the duration so ResizeObserver
 *   is not swapping SVG masks on every frame.
 */

const MORPH_GEOMETRY = new Set(["top", "left", "width", "height"]);

const PAUSE_ATTR = "data-corner-morph";

type RefreshListener = (root: HTMLElement) => void;

const refreshListeners = new Set<RefreshListener>();

export function isMorphGeometryTransition(propertyName: string): boolean {
  return MORPH_GEOMETRY.has(propertyName);
}

export function isCornerMorphPaused(el: HTMLElement): boolean {
  return el.closest(`[${PAUSE_ATTR}="pause"]`) !== null;
}

export function subscribeCornerMorphRefresh(
  listener: RefreshListener,
): () => void {
  refreshListeners.add(listener);
  return () => {
    refreshListeners.delete(listener);
  };
}

/** Drop an inline transition suppress, commit the from-rect, then write the target. */
export function armTransitionThen(
  el: HTMLElement,
  writeTarget: () => void,
): void {
  el.style.removeProperty("transition");
  void el.offsetHeight;
  writeTarget();
}

export function pauseCornerMorph(el: HTMLElement): void {
  el.setAttribute(PAUSE_ATTR, "pause");
}

export function resumeCornerMorph(
  el: HTMLElement | null | undefined,
): void {
  if (!el || el.getAttribute(PAUSE_ATTR) !== "pause") return;
  el.removeAttribute(PAUSE_ATTR);
  if (!el.isConnected) return;
  refreshListeners.forEach((listener) => listener(el));
}

/**
 * Start a layout tween: pause mask rebuilds, arm the transition, write the
 * target. Returns a fallback timer that resumes masks if `transitionend`
 * never fires. Clear it when the geometry transition ends.
 */
export function commitMorphTarget(
  el: HTMLElement,
  writeTarget: () => void,
  settleMs: number,
): number {
  pauseCornerMorph(el);
  armTransitionThen(el, writeTarget);
  return window.setTimeout(() => resumeCornerMorph(el), settleMs);
}
