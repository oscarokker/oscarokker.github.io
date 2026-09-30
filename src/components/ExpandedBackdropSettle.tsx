"use client";

import { useEffect } from "react";

/**
 * Backdrop blur is requested in CSS, but Chrome often composites an empty
 * layer when `backdrop-filter` is applied on the same frame the overlay mounts
 * (or when opacity / @starting-style animates the filter). The page then looks
 * dim and sharp.
 *
 * After the overlay has painted, build the filter from a tiny non-zero blur
 * (so the backdrop actually samples the page) and transition to the shared
 * `--expanded-backdrop-blur` token. Opacity on the backdrop is never animated.
 * Reduced motion skips that transition and still settles on the token.
 */
function blurToken(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--expanded-backdrop-blur")
    .trim();
  return raw || "20px";
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function rootOf(el: HTMLElement): HTMLElement | null {
  const root = el.closest(".intro-expanded-root");
  return root instanceof HTMLElement ? root : null;
}

function isLive(el: HTMLElement): boolean {
  const root = rootOf(el);
  if (!root || root.dataset.visible !== "true") return false;
  if (root.classList.contains("music-player-mini-mode")) return false;
  return true;
}

function clearInlineFilter(el: HTMLElement) {
  el.style.removeProperty("transition");
  el.style.removeProperty("backdrop-filter");
  el.style.removeProperty("-webkit-backdrop-filter");
  delete el.dataset.blurArmed;
}

function applyBlur(el: HTMLElement, value: string) {
  el.style.setProperty("backdrop-filter", value);
  el.style.setProperty("-webkit-backdrop-filter", value);
}

function tokenPx(): number {
  const parsed = Number.parseFloat(blurToken());
  return Number.isFinite(parsed) ? parsed : 20;
}

function arm(el: HTMLElement) {
  if (el.dataset.blurArmed === "true") return;
  el.dataset.blurArmed = "true";

  const target = tokenPx();
  if (prefersReducedMotion()) {
    applyBlur(el, `blur(${target}px)`);
    return;
  }

  // A non-zero blur first so the backdrop layer samples the page, then step the
  // radius directly. CSS transitions of backdrop-filter stay stuck on blur(0).
  const start = performance.now();
  const duration = 350;
  applyBlur(el, "blur(0.5px)");

  const step = (now: number) => {
    if (!el.isConnected || !isLive(el)) {
      clearInlineFilter(el);
      return;
    }
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    const px = 0.5 + (target - 0.5) * eased;
    applyBlur(el, t < 1 ? `blur(${px.toFixed(2)}px)` : `blur(${target}px)`);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function ExpandedBackdropSettle() {
  useEffect(() => {
    const sync = () => {
      document.querySelectorAll<HTMLElement>(".intro-expanded-backdrop").forEach((el) => {
        if (!isLive(el)) {
          if (el.dataset.blurArmed === "true") clearInlineFilter(el);
          return;
        }
        arm(el);
      });
    };

    const mo = new MutationObserver(sync);
    mo.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-visible", "class"],
    });
    sync();

    return () => mo.disconnect();
  }, []);

  return null;
}
