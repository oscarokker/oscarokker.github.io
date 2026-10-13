import type { FilterCategory } from "@/lib/types";

export const FILTER_QUERY_KEY = "filter";
export const FILTER_STORAGE_KEY = "portfolio-filter";

const FILTERS: readonly FilterCategory[] = [
  "all",
  "work",
  "about",
  "side-quests",
];

export function isFilterCategory(
  value: string | null | undefined,
): value is FilterCategory {
  return !!value && (FILTERS as readonly string[]).includes(value);
}

export function parseFilterParam(
  value: string | string[] | null | undefined,
): FilterCategory {
  const raw = Array.isArray(value) ? value[0] : value;
  // Map legacy "music" filter to "side-quests" for backwards compatibility
  if (raw === "music") {
    return "side-quests";
  }
  return isFilterCategory(raw) ? raw : "all";
}

export function homeHrefForFilter(filter: FilterCategory): string {
  return filter === "all" ? "/" : `/?${FILTER_QUERY_KEY}=${filter}`;
}

export function rememberPortfolioFilter(filter: FilterCategory) {
  try {
    sessionStorage.setItem(FILTER_STORAGE_KEY, filter);
  } catch {
    // ignore quota / privacy mode
  }
}

export function readPortfolioFilter(): FilterCategory {
  try {
    const stored = sessionStorage.getItem(FILTER_STORAGE_KEY);
    // Map legacy "music" filter to "side-quests" for backwards compatibility
    if (stored === "music") {
      return "side-quests";
    }
    return parseFilterParam(stored);
  } catch {
    return "all";
  }
}

/**
 * Blocking <head> script. Sets `data-portfolio-filter` before first paint so
 * CSS can hide non-matching tiles. No-JS leaves the attribute unset and every
 * tile visible. Must stay in sync with parseFilterParam (including legacy
 * "music"). Does not touch history.
 */
export const PORTFOLIO_FILTER_BOOT_SCRIPT = `(function(){try{var raw=new URLSearchParams(location.search).get("${FILTER_QUERY_KEY}");if(raw==="music")raw="side-quests";if(raw==="work"||raw==="about"||raw==="side-quests"){document.documentElement.setAttribute("data-portfolio-filter",raw)}}catch(e){}})()`;
