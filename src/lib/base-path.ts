/**
 * GitHub project Pages subpath, e.g. "/oscar-rode-portfolio".
 * Empty for local `next dev` (site at "/") and for user/org Pages or a custom domain.
 * Keep in sync with `basePath` in next.config.ts (`NEXT_PUBLIC_BASE_PATH`).
 */
export function getBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!raw || raw === "/") return "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

/** Prefix a root-relative URL. Leave absolute and already-prefixed paths alone. */
export function withBasePath(href: string): string {
  const base = getBasePath();
  if (!base) return href;
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("//") ||
    href.startsWith("data:") ||
    href.startsWith("blob:")
  ) {
    return href;
  }
  if (href.startsWith(base + "/") || href === base) return href;
  if (!href.startsWith("/")) return href;
  return `${base}${href}`;
}

/** Strip `basePath` from `window.location.pathname` so it matches App Router paths. */
export function stripBasePath(pathname: string): string {
  const base = getBasePath();
  const raw = pathname || "/";
  if (!base) return raw;
  if (raw === base || raw === `${base}/`) return "/";
  if (raw.startsWith(`${base}/`)) {
    const stripped = raw.slice(base.length);
    return stripped.startsWith("/") ? stripped : `/${stripped}`;
  }
  return raw;
}
