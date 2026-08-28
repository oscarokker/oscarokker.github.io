"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import type { FilterCategory } from "@/lib/types";

/** Keep in sync with `--transition-tile-flip` in globals.css */
const FLIP_MS = 600;
const FLIP_TRANSITION = "transform var(--transition-tile-flip)";
const GRID_HEIGHT_TRANSITION = "height var(--transition-tile-flip)";
const UNMATCHED_ORDER_OFFSET = 1000;

/** Rest unmatched / grayed. Matching rest is CSS `2`; flying matches bump to `3`. */
const Z_UNMATCHED = "1";
const Z_MATCHING_FLIP = "3";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clearFlipInline(slot: HTMLElement) {
  slot.style.transform = "";
  slot.style.transition = "";
  slot.style.willChange = "";
  slot.style.zIndex = "";
}

function slotIsActive(slot: HTMLElement): boolean {
  return slot.dataset.active === "true";
}

function clearGridHeight(grid: HTMLElement) {
  grid.style.height = "";
  grid.style.transition = "";
  grid.style.overflow = "";
  grid.style.overflowAnchor = "";
}

function applySlotOrder(slots: HTMLElement[]) {
  for (const slot of slots) {
    const order = slot.dataset.gridOrder;
    if (order != null && order !== "") {
      slot.style.order = order;
    }
  }
}

/**
 * Matches keep source index (lower `order`). Unmatched get index + 1000 so
 * they pack after, still in original relative order. `all` uses source index.
 */
export function tileGridOrder(
  index: number,
  isMatch: boolean,
  filter: FilterCategory,
): number {
  if (filter === "all") return index;
  return isMatch ? index : index + UNMATCHED_ORDER_OFFSET;
}

/**
 * FLIP-reorder homepage tiles when the nav filter changes. All slots stay in
 * grid flow (no hide / absolute). Transform runs on `.tile-slot`; press scale
 * and ripple stay on inner `.tile-card`.
 */
export function useTileGridFlip(
  gridRef: RefObject<HTMLElement | null>,
  filterKey: string,
) {
  const initializedRef = useRef(false);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const slots = [
      ...grid.querySelectorAll<HTMLElement>(":scope > .tile-slot"),
    ];
    if (slots.length === 0) return;

    const reduced = prefersReducedMotion();
    const initialized = initializedRef.current;

    if (!initialized || reduced) {
      for (const slot of slots) clearFlipInline(slot);
      applySlotOrder(slots);
      clearGridHeight(grid);
      initializedRef.current = true;
      return;
    }

    const firstRects = new Map<HTMLElement, DOMRect>();
    for (const slot of slots) {
      firstRects.set(slot, slot.getBoundingClientRect());
    }
    const firstHeight = grid.getBoundingClientRect().height;

    applySlotOrder(slots);
    grid.style.transition = "none";
    grid.style.height = "";
    void grid.offsetWidth;

    const inversions = new Map<HTMLElement, { dx: number; dy: number }>();
    for (const slot of slots) {
      const first = firstRects.get(slot);
      if (!first) continue;
      const last = slot.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      inversions.set(slot, { dx, dy });
    }

    const lastHeight = Math.max(
      grid.scrollHeight,
      grid.getBoundingClientRect().height,
    );
    const heightDelta = Math.abs(firstHeight - lastHeight) >= 0.5;

    if (inversions.size === 0 && !heightDelta) {
      for (const slot of slots) clearFlipInline(slot);
      clearGridHeight(grid);
      return;
    }

    for (const slot of slots) {
      const invert = inversions.get(slot);
      const active = slotIsActive(slot);
      slot.style.transition = "none";
      slot.style.zIndex = active
        ? invert
          ? Z_MATCHING_FLIP
          : ""
        : Z_UNMATCHED;
      slot.style.willChange = invert ? "transform" : "";
      slot.style.transform = invert
        ? `translate(${invert.dx}px, ${invert.dy}px)`
        : "";
    }

    if (heightDelta) {
      grid.style.overflow = "visible";
      grid.style.height = `${firstHeight}px`;
    }
    grid.style.overflowAnchor = "none";

    void grid.offsetWidth;

    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        if (heightDelta) {
          grid.style.transition = GRID_HEIGHT_TRANSITION;
          grid.style.height = `${lastHeight}px`;
        }

        for (const slot of slots) {
          if (!inversions.has(slot)) {
            clearFlipInline(slot);
            continue;
          }
          slot.style.transition = FLIP_TRANSITION;
          slot.style.transform = "none";
        }
      });
    });

    const finish = () => {
      for (const slot of slots) clearFlipInline(slot);
      clearGridHeight(grid);
    };

    const finishTimer = window.setTimeout(finish, FLIP_MS + 80);

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(finishTimer);
      finish();
    };
  }, [filterKey, gridRef]);
}
