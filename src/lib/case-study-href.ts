/** Case study URLs. Must include a trailing slash: `output: "export"` + `trailingSlash`. */
export function caseStudyHref(slug: string): string {
  return `/case-studies/${slug}/`;
}

export function isCaseStudyPath(pathname: string): boolean {
  return pathname === "/case-studies" || pathname.startsWith("/case-studies/");
}

export function isHomePath(pathname: string): boolean {
  return pathname === "/" || pathname === "";
}

export function caseStudySlugFromPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const index = parts.indexOf("case-studies");
  const slug = index === -1 ? undefined : parts[index + 1];
  if (!slug) return null;
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export const CASE_STUDY_SNAPSHOT_KEY = "case-study-snapshot";
export const CASE_STUDY_FROM_GRID_KEY = "case-study-from-grid";
export const CASE_STUDY_PENDING_COLLAPSE_KEY = "case-study-pending-collapse";
export const CASE_STUDY_PENDING_OPEN_KEY = "case-study-pending-open";

/**
 * Blocking <head> script so the destination document's first paint is already
 * covered. Must stay in sync with the sessionStorage keys above.
 */
export const CASE_STUDY_BOOT_SCRIPT = `(function(){try{var p=location.pathname;var snap=sessionStorage.getItem("${CASE_STUDY_SNAPSHOT_KEY}");var pendingOpen=sessionStorage.getItem("${CASE_STUDY_PENDING_OPEN_KEY}");var pendingClose=sessionStorage.getItem("${CASE_STUDY_PENDING_COLLAPSE_KEY}");var isCase=p.indexOf("/case-studies/")!==-1;if(isCase&&snap&&pendingOpen){document.documentElement.setAttribute("data-case-study-boot","cover")}else if(!isCase&&pendingClose==="1"&&snap){document.documentElement.setAttribute("data-case-study-boot","cover")}}catch(e){}})()`;