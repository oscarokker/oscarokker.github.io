"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { FilterCategory } from "@/lib/types";
import { tiles } from "@/data/tiles";
import { NavBar } from "@/components/NavBar";
import { Tile, tileMatchesFilter } from "@/components/Tile";
import { useHeaderVisibility } from "@/hooks/useHeaderVisibility";
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
  const headerVisible = useHeaderVisibility();
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Track first mount for entrance animation (only animate on initial load)
  const hasAnimatedRef = useRef(false);
  const [entranceStates, setEntranceStates] = useState<Record<string, "animating" | "visible" | null>>({});

  useTileGridFlip(gridRef, activeFilter);

  useEffect(() => {
    rememberPortfolioFilter(activeFilter);
  }, [activeFilter]);

  // Trigger staggered entrance animation on first mount only
  useEffect(() => {
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      // Skip animation entirely
      return;
    }

    // Initialize all tiles as "animating"
    const initialStates: Record<string, "animating" | "visible" | null> = {};
    tiles.forEach((tile) => {
      initialStates[tile.id] = "animating";
    });
    setEntranceStates(initialStates);

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
      <main className="portfolio-main">
        <div ref={gridRef} className="tile-grid" role="list">
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
