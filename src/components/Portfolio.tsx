"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
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

  useTileGridFlip(gridRef, activeFilter);

  useEffect(() => {
    rememberPortfolioFilter(activeFilter);
  }, [activeFilter]);

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
            return (
              <Tile
                key={tile.id}
                tile={tile}
                isActive={isActive}
                sortOrder={tileGridOrder(index, isActive, activeFilter)}
              />
            );
          })}
        </div>
      </main>
    </>
  );
}
