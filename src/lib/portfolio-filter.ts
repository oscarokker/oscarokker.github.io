import type { FilterCategory } from "@/lib/types";

export const FILTER_QUERY_KEY = "filter";
export const FILTER_STORAGE_KEY = "portfolio-filter";

const FILTERS: readonly FilterCategory[] = [
  "all",
  "work",
  "music",
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
    return parseFilterParam(sessionStorage.getItem(FILTER_STORAGE_KEY));
  } catch {
    return "all";
  }
}
