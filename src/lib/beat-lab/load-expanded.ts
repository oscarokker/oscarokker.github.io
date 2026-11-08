/**
 * Ghostlink expanded shell — demand-loaded on first open (or intent prefetch).
 * Keep this off the homepage critical path; do not idle-timer preload.
 */

import type { ComponentType } from "react";
import type { BeatLabTileExpandedProps } from "@/components/tiles/BeatLabTileExpanded";

export type BeatLabExpandedComponent = ComponentType<BeatLabTileExpandedProps>;

let loadPromise: Promise<BeatLabExpandedComponent> | null = null;

export function loadBeatLabExpanded(): Promise<BeatLabExpandedComponent> {
  if (!loadPromise) {
    loadPromise = import(
      /* webpackChunkName: "beat-lab-expanded" */
      "@/components/tiles/BeatLabTileExpanded"
    )
      .then((mod) => mod.BeatLabTileExpanded)
      .catch((error: unknown) => {
        loadPromise = null;
        throw error;
      });
  }
  return loadPromise;
}

/** Intent prefetch (hover / focus / pointerdown). Same promise as first open. */
export function prefetchBeatLabExpanded(): void {
  void loadBeatLabExpanded().catch(() => {
    /* next explicit open retries */
  });
}
