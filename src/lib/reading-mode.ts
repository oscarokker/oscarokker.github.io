export type ReadingMode = "detailed" | "summary";

export const READING_QUERY_KEY = "reading";

export function parseReadingParam(
  value: string | null | undefined,
): ReadingMode | null {
  return value === "summary" || value === "detailed" ? value : null;
}

/** Detailed when the param is missing or not one of the two modes. */
export function readReadingMode(): ReadingMode {
  if (typeof window === "undefined") return "detailed";
  const raw = new URLSearchParams(window.location.search).get(READING_QUERY_KEY);
  return parseReadingParam(raw) ?? "detailed";
}

/** Update the current history entry. Does not push a new one. */
export function writeReadingMode(mode: ReadingMode) {
  const url = new URL(window.location.href);
  if (url.searchParams.get(READING_QUERY_KEY) === mode) return;
  url.searchParams.set(READING_QUERY_KEY, mode);
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

/**
 * Blocking <head> script so summary/detailed is applied before first paint.
 * Must stay in sync with parseReadingParam. Detailed stays the default when
 * the param is absent — this script only stamps a recognized value.
 */
export const READING_BOOT_SCRIPT = `(function(){try{var r=new URLSearchParams(location.search).get("${READING_QUERY_KEY}");if(r==="summary"||r==="detailed"){document.documentElement.setAttribute("data-reading",r)}}catch(e){}})()`;
