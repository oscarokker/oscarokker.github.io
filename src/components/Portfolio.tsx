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

    // Stagger the reveal: ~50ms per tile in reading order
    const STAGGER_DELAY = 50;
    
    tiles.forEach((tile, index) => {
      setTimeout(() => {
        setEntranceStates((prev) => ({
          ...prev,
          [tile.id]: "visible",
        }));
      }, index * STAGGER_DELAY);
    });

    // Mark entrance as done after all animations complete
    const totalDuration = tiles.length * STAGGER_DELAY + 300; // stagger + transition duration
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
