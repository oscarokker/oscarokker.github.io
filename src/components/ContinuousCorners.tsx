"use client";

import { useEffect } from "react";
import { getSvgPath } from "@/vendor/figma-squircle";
import {
  CONTINUOUS_CORNER_SELECTORS,
  CORNER_SMOOTHING,
  pathToMaskImage,
  readCornerRadiusPx,
  shouldSkipContinuousCorners,
} from "@/lib/continuous-corners";

function supportsNativeSquircle(): boolean {
  try {
    return typeof CSS !== "undefined" && CSS.supports("corner-shape", "squircle") === true;
  } catch {
    return false;
  }
}

function applyMask(el: HTMLElement) {
  const styles = getComputedStyle(el);
  if (shouldSkipContinuousCorners(styles)) {
    clearMask(el);
    return;
  }

  const width = el.clientWidth;
  const height = el.clientHeight;
  if (width < 2 || height < 2) return;

  const cornerRadius = readCornerRadiusPx(styles);
  const path = getSvgPath({
    width,
    height,
    cornerRadius,
    cornerSmoothing: CORNER_SMOOTHING,
    preserveSmoothing: true,
  });
  const mask = pathToMaskImage(path, width, height);
  el.style.webkitMaskImage = mask;
  el.style.maskImage = mask;
  el.style.webkitMaskSize = "100% 100%";
  el.style.maskSize = "100% 100%";
  el.style.webkitMaskRepeat = "no-repeat";
  el.style.maskRepeat = "no-repeat";
  el.dataset.continuousCornersApplied = "true";
}

function clearMask(el: HTMLElement) {
  el.style.removeProperty("mask-image");
  el.style.removeProperty("-webkit-mask-image");
  el.style.removeProperty("mask-size");
  el.style.removeProperty("-webkit-mask-size");
  el.style.removeProperty("mask-repeat");
  el.style.removeProperty("-webkit-mask-repeat");
  delete el.dataset.continuousCornersApplied;
}

/**
 * Progressive enhancement for continuous corners at 60% smoothing.
 * Native CSS `corner-shape: squircle` is preferred; otherwise figma-squircle
 * SVG masks match Figma’s Corner smoothing geometry.
 */
export function ContinuousCorners() {
  useEffect(() => {
    if (supportsNativeSquircle()) return;

    const elements = new Set<HTMLElement>();

    const track = (el: HTMLElement) => {
      elements.add(el);
      applyMask(el);
      ro.observe(el);
    };

    const scan = (root: ParentNode = document) => {
      root.querySelectorAll(CONTINUOUS_CORNER_SELECTORS).forEach((node) => {
        if (node instanceof HTMLElement) track(node);
      });
    };

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target instanceof HTMLElement) applyMask(entry.target);
      }
    });

    scan();

    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(CONTINUOUS_CORNER_SELECTORS)) track(node);
          node.querySelectorAll(CONTINUOUS_CORNER_SELECTORS).forEach((child) => {
            if (child instanceof HTMLElement) track(child);
          });
        });
      }
    });

    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      ro.disconnect();
      elements.forEach(clearMask);
    };
  }, []);

  return null;
}
