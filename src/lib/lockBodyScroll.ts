const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
  "Spacebar",
]);

let lockCount = 0;
let touchStartY = 0;
let touchStartX = 0;

function isRootScroller(el: Element): boolean {
  return el === document.documentElement || el === document.body;
}

function overflowAllowsScroll(value: string): boolean {
  return value === "auto" || value === "scroll" || value === "overlay";
}

function canElementScroll(
  el: Element,
  deltaX: number,
  deltaY: number,
): boolean {
  if (!(el instanceof HTMLElement)) return false;

  const style = getComputedStyle(el);
  const canY =
    overflowAllowsScroll(style.overflowY) && el.scrollHeight > el.clientHeight;
  const canX =
    overflowAllowsScroll(style.overflowX) && el.scrollWidth > el.clientWidth;

  if (deltaY !== 0 && canY) {
    const max = el.scrollHeight - el.clientHeight;
    if (deltaY < 0) return el.scrollTop > 0;
    return el.scrollTop < max - 1;
  }

  if (deltaX !== 0 && canX) {
    const max = el.scrollWidth - el.clientWidth;
    if (deltaX < 0) return el.scrollLeft > 0;
    return el.scrollLeft < max - 1;
  }

  if (deltaX === 0 && deltaY === 0) return canY || canX;
  return false;
}

function eventAllowsScroll(
  target: EventTarget | null,
  deltaX: number,
  deltaY: number,
): boolean {
  let el = target instanceof Element ? target : null;
  while (el && !isRootScroller(el)) {
    if (canElementScroll(el, deltaX, deltaY)) return true;
    el = el.parentElement;
  }
  return false;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function onWheel(event: WheelEvent) {
  if (eventAllowsScroll(event.target, event.deltaX, event.deltaY)) return;
  event.preventDefault();
}

function onTouchStart(event: TouchEvent) {
  const touch = event.touches[0];
  if (!touch) return;
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}

function onTouchMove(event: TouchEvent) {
  const touch = event.touches[0];
  if (!touch) return;
  const deltaX = touchStartX - touch.clientX;
  const deltaY = touchStartY - touch.clientY;
  if (eventAllowsScroll(event.target, deltaX, deltaY)) return;
  event.preventDefault();
}

function onKeyDown(event: KeyboardEvent) {
  if (!SCROLL_KEYS.has(event.key)) return;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (isEditableTarget(event.target)) return;
  if (event.key === " " && event.target instanceof HTMLElement) {
    const interactive = event.target.closest(
      "button, [href], [role='button'], summary",
    );
    if (interactive) return;
  }

  const deltaY =
    event.key === "ArrowUp" || event.key === "PageUp" || event.key === "Home"
      ? -1
      : 1;
  const deltaX =
    event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
  if (eventAllowsScroll(event.target, deltaX, deltaY)) return;
  event.preventDefault();
}

/**
 * Prevent background page scroll while keeping the document scrollbar gutter.
 * Nested overlay scrollers (intro, Himalaya gallery, case study) still scroll.
 */
export function lockBodyScroll(): () => void {
  if (typeof document === "undefined") return () => {};

  const html = document.documentElement;
  lockCount += 1;
  if (lockCount === 1) {
    html.setAttribute("data-scroll-locked", "");
    document.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("keydown", onKeyDown);
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount > 0) return;

    html.removeAttribute("data-scroll-locked");
    document.removeEventListener("wheel", onWheel);
    document.removeEventListener("touchstart", onTouchStart);
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("keydown", onKeyDown);
  };
}
