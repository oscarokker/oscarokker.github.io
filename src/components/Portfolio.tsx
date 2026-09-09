"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { FilterCategory } from "@/lib/types";
import { tiles } from "@/data/tiles";
import { NavBar } from "@/components/NavBar";
import { Tile, tileMatchesFilter } from "@/components/Tile";
import { useHeaderVisibility } from "@/hooks/useHeaderVisibility";
import { useDevice } from "@/hooks/useDevice";
import { tileGridOrder, useTileGridFlip } from "@/hooks/useTileGridFlip";
import {
  FILTER_QUERY_KEY,
  homeHrefForFilter,
  parseFilterParam,
  rememberPortfolioFilter,
} from "@/lib/portfolio-filter";
import { withBasePath } from "@/lib/base-path";

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function filterFromLocation(): FilterCategory {
  return parseFilterParam(
    new URLSearchParams(window.location.search).get(FILTER_QUERY_KEY),
  );
}

export function Portfolio({
  initialFilter,
}: {
  initialFilter: FilterCategory;
}) {
  const activeFilter = useSyncExternalStore(
    subscribeToLocation,
    filterFromLocation,
    () => initialFilter,
  );
  const device = useDevice();
  const headerVisible = useHeaderVisibility();
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Track entrance animation completion
  const [entranceDone, setEntranceDone] = useState(false);
  const [entranceStates, setEntranceStates] = useState<Record<string, "visible" | null>>({});

  useTileGridFlip(gridRef, activeFilter);

  useEffect(() => {
    rememberPortfolioFilter(activeFilter);
  }, [activeFilter]);

  // Trigger staggered entrance animation on first mount only
  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      // Skip animation entirely, mark as done immediately
      setEntranceDone(true);
      return;
    }

    // Stagger the reveal: 70ms per tile, capped to keep total choreography within ~1.0-1.2s
    const STAGGER_DELAY = 70;
    const ANIMATION_DURATION = 550;
    const TILE_START_OFFSET = 80; // Chrome starts first; tiles begin 80ms later
    const TARGET_TOTAL_DURATION = 1100; // Target ~1.1s total (range 1.0-1.2s)
    const MAX_TOTAL_DURATION = 1400; // Hard cap at 1.4s
    
    // Calculate if we need to compress stagger
    const uncappedTotal = TILE_START_OFFSET + tiles.length * STAGGER_DELAY + ANIMATION_DURATION;
    const actualStagger = uncappedTotal > MAX_TOTAL_DURATION
      ? Math.max(10, (TARGET_TOTAL_DURATION - TILE_START_OFFSET - ANIMATION_DURATION) / tiles.length)
      : STAGGER_DELAY;
    
    tiles.forEach((tile, index) => {
      setTimeout(() => {
        setEntranceStates((prev) => ({
          ...prev,
          [tile.id]: "visible",
        }));
      }, TILE_START_OFFSET + index * actualStagger);
    });

    // Mark entrance as done after all animations complete
    const totalDuration = TILE_START_OFFSET + tiles.length * actualStagger + ANIMATION_DURATION;
    setTimeout(() => {
      setEntranceDone(true);
    }, totalDuration);
  }, []);

  const onFilterChange = useCallback((filter: FilterCategory) => {
    rememberPortfolioFilter(filter);
    window.history.replaceState(
      null,
      "",
      withBasePath(homeHrefForFilter(filter)),
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  return (
    <>
      <NavBar
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        visible={headerVisible}
      />
      <main className="portfolio-main" data-device={device}>
        <div
          ref={gridRef}
          className="tile-grid"
          role="list"
          data-entrance-done={entranceDone || undefined}
        >
          {tiles.map((tile, index) => {
            const isActive = tileMatchesFilter(tile, activeFilter);
            const entranceState = entranceStates[tile.id];
            return (
              <Tile
                key={tile.id}
                tile={tile}
                isActive={isActive}
                sortOrder={tileGridOrder(index, isActive, activeFilter)}
                entranceState={entranceState}
              />
            );
          })}
        </div>
      </main>
    </>
  );
}
