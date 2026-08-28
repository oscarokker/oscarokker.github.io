"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { usePathname } from "next/navigation";
import { useCursorLabelOptional } from "@/hooks/useCursorLabel";
import {
  CASE_STUDY_FROM_GRID_KEY,
  CASE_STUDY_PENDING_COLLAPSE_KEY,
  CASE_STUDY_PENDING_OPEN_KEY,
  CASE_STUDY_SNAPSHOT_KEY,
  caseStudyHref,
  caseStudySlugFromPath,
  isCaseStudyPath,
  isHomePath,
} from "@/lib/case-study-href";
import { stripBasePath, withBasePath } from "@/lib/base-path";
import {
  homeHrefForFilter,
  readPortfolioFilter,
} from "@/lib/portfolio-filter";
import { lockBodyScroll } from "@/lib/lockBodyScroll";

export interface MorphRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface CaseStudySnapshot {
  slug: string;
  title: string;
  subtitle: string;
  accent?: string;
  coverSrc?: string;
  comingSoon?: boolean;
  sourceRect: MorphRect;
  pointer?: { clientX: number; clientY: number };
}

export type CaseStudyPhase =
  | "idle"
  | "expanding"
  | "covering"
  | "revealing"
  | "collapsing";

interface CaseStudyTransitionValue {
  phase: CaseStudyPhase;
  snapshot: CaseStudySnapshot | null;
  openFromTile: (snapshot: CaseStudySnapshot) => void;
  notifyPageReady: (slug: string) => void;
  completeExpand: () => void;
  completeCollapse: () => void;
  closeToGrid: () => void;
  registerTile: (slug: string, element: HTMLElement | null) => void;
}

interface BootTransition {
  phase: CaseStudyPhase;
  snapshot: CaseStudySnapshot | null;
  pendingCollapse: boolean;
}

const CaseStudyTransitionContext =
  createContext<CaseStudyTransitionValue | null>(null);

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function locationPath(): string {
  return stripBasePath(window.location.pathname);
}

function persistSnapshot(snapshot: CaseStudySnapshot) {
  try {
    sessionStorage.setItem(
      CASE_STUDY_SNAPSHOT_KEY,
      JSON.stringify({
        slug: snapshot.slug,
        title: snapshot.title,
        subtitle: snapshot.subtitle,
        accent: snapshot.accent,
        coverSrc: snapshot.coverSrc,
        comingSoon: snapshot.comingSoon,
        sourceRect: snapshot.sourceRect,
      }),
    );
    sessionStorage.setItem(CASE_STUDY_FROM_GRID_KEY, snapshot.slug);
  } catch {
    // ignore quota / privacy mode
  }
}

function readSnapshot(): CaseStudySnapshot | null {
  try {
    const raw = sessionStorage.getItem(CASE_STUDY_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CaseStudySnapshot;
    if (!parsed?.slug || !parsed.sourceRect) return null;
    return parsed;
  } catch {
    return null;
  }
}

function openedFromGrid(slug: string | null | undefined): boolean {
  if (!slug) return false;
  try {
    return sessionStorage.getItem(CASE_STUDY_FROM_GRID_KEY) === slug;
  } catch {
    return false;
  }
}

function markPendingCollapse() {
  try {
    sessionStorage.setItem(CASE_STUDY_PENDING_COLLAPSE_KEY, "1");
  } catch {
    // ignore
  }
}

function markPendingOpen(slug: string) {
  try {
    sessionStorage.setItem(CASE_STUDY_PENDING_OPEN_KEY, slug);
  } catch {
    // ignore
  }
}

function readPendingOpen(): string | null {
  try {
    return sessionStorage.getItem(CASE_STUDY_PENDING_OPEN_KEY);
  } catch {
    return null;
  }
}

function clearPendingOpen() {
  try {
    sessionStorage.removeItem(CASE_STUDY_PENDING_OPEN_KEY);
  } catch {
    // ignore
  }
}

function consumePendingCollapse(): boolean {
  try {
    const pending =
      sessionStorage.getItem(CASE_STUDY_PENDING_COLLAPSE_KEY) === "1";
    if (pending) sessionStorage.removeItem(CASE_STUDY_PENDING_COLLAPSE_KEY);
    return pending;
  } catch {
    return false;
  }
}

function peekPendingCollapse(): boolean {
  try {
    return sessionStorage.getItem(CASE_STUDY_PENDING_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function clearPendingCollapse() {
  try {
    sessionStorage.removeItem(CASE_STUDY_PENDING_COLLAPSE_KEY);
  } catch {
    // ignore
  }
}

function clearBootCover() {
  document.documentElement.removeAttribute("data-case-study-boot");
}

export function viewportRect(): MorphRect {
  return {
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function rectFromElement(element: HTMLElement): MorphRect {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function readPendingTransition(): BootTransition {
  if (typeof window === "undefined") {
    return { phase: "idle", snapshot: null, pendingCollapse: false };
  }

  const path = locationPath();
  const snapshot = readSnapshot();

  if (isCaseStudyPath(path) && snapshot) {
    const slug = caseStudySlugFromPath(path);
    if (slug && snapshot.slug === slug && readPendingOpen() === slug) {
      return { phase: "covering", snapshot, pendingCollapse: false };
    }
  }

  if (!isCaseStudyPath(path) && snapshot && peekPendingCollapse()) {
    return {
      phase: "covering",
      snapshot: { ...snapshot, sourceRect: viewportRect() },
      pendingCollapse: true,
    };
  }

  return { phase: "idle", snapshot: null, pendingCollapse: false };
}

export function CaseStudyTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const cursor = useCursorLabelOptional();
  // Hydrate as idle so SSR HTML matches the first client render. SessionStorage
  // boot (cover overlay, pending collapse) is applied in useLayoutEffect.
  const [phase, setPhase] = useState<CaseStudyPhase>("idle");
  const [snapshot, setSnapshot] = useState<CaseStudySnapshot | null>(null);
  const tilesRef = useRef(new Map<string, HTMLElement>());
  const lastSnapshotRef = useRef<CaseStudySnapshot | null>(null);
  const pendingCollapseRef = useRef(false);
  const didBootRef = useRef(false);
  const didAssignOpenRef = useRef(false);
  const prevPathRef = useRef(pathname);
  const restoredPathRef = useRef<string | null>(null);
  const revealTimeoutRef = useRef(0);
  const coverFallbackRef = useRef(0);
  const homeNavFallbackRef = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const setLabelSuppressed = cursor?.setLabelSuppressed;
  const clearCursorLabel = cursor?.clearCursorLabel;

  const hideTile = useCallback((slug: string, hidden: boolean) => {
    const tile = tilesRef.current.get(slug);
    if (!tile) return;
    tile.style.visibility = hidden ? "hidden" : "";
  }, []);

  const measureOrigin = useCallback(
    (slug: string, fallback: MorphRect): MorphRect => {
      const tile = tilesRef.current.get(slug);
      return tile ? rectFromElement(tile) : fallback;
    },
    [],
  );

  const registerTile = useCallback(
    (slug: string, element: HTMLElement | null) => {
      if (element) {
        tilesRef.current.set(slug, element);
      } else {
        tilesRef.current.delete(slug);
      }
    },
    [],
  );

  const beginCollapse = useCallback(
    (current: CaseStudySnapshot) => {
      if (phaseRef.current === "collapsing") return;
      pendingCollapseRef.current = true;
      clearPendingCollapse();
      hideTile(current.slug, true);
      lastSnapshotRef.current = current;
      persistSnapshot(current);
      setLabelSuppressed?.(true);
      if (phaseRef.current !== "covering") {
        setSnapshot({
          ...current,
          sourceRect: viewportRect(),
        });
        setPhase("covering");
        return;
      }
      const origin = measureOrigin(current.slug, current.sourceRect);
      const next = { ...current, sourceRect: origin };
      lastSnapshotRef.current = next;
      persistSnapshot(next);
      setSnapshot(next);
      setPhase("collapsing");
    },
    [hideTile, measureOrigin, setLabelSuppressed],
  );

  const openFromTile = useCallback(
    (next: CaseStudySnapshot) => {
      lastSnapshotRef.current = next;
      pendingCollapseRef.current = false;
      didAssignOpenRef.current = false;
      persistSnapshot(next);
      markPendingOpen(next.slug);
      setSnapshot(next);
      hideTile(next.slug, true);
      setLabelSuppressed?.(true);
      clearCursorLabel?.();

      const href = withBasePath(caseStudyHref(next.slug));
      // Static export (`serve out` / GitHub Pages): App Router client
      // navigations abort (HEAD + segment .txt). Don't start router.push —
      // it cancels the document load. Morph, then assign the HTML page.
      if (prefersReducedMotion()) {
        flushSync(() => setPhase("covering"));
        window.scrollTo({ top: 0, behavior: "instant" });
        window.location.assign(href);
        return;
      }

      setPhase("expanding");
    },
    [clearCursorLabel, hideTile, setLabelSuppressed],
  );

  const completeExpand = useCallback(() => {
    const current = lastSnapshotRef.current;
    if (!current || pendingCollapseRef.current) return;
    if (phaseRef.current !== "expanding") return;
    flushSync(() => setPhase("covering"));
    window.scrollTo({ top: 0, behavior: "instant" });

    if (isCaseStudyPath(locationPath())) return;
    if (didAssignOpenRef.current) return;

    const href = withBasePath(caseStudyHref(current.slug));
    markPendingOpen(current.slug);
    didAssignOpenRef.current = true;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (pendingCollapseRef.current) return;
        if (phaseRef.current !== "covering") return;
        if (isCaseStudyPath(locationPath())) return;
        window.location.assign(href);
      });
    });
  }, []);

  const notifyPageReady = useCallback(
    (slug: string) => {
      if (pendingCollapseRef.current) return;
      const current = lastSnapshotRef.current;
      if (current?.slug !== slug) return;
      if (phaseRef.current !== "covering") return;

      clearPendingOpen();
      setPhase("revealing");
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = window.setTimeout(
        () => {
          setPhase("idle");
          setSnapshot(null);
          setLabelSuppressed?.(false);
          clearBootCover();
        },
        prefersReducedMotion() ? 0 : 280,
      );
    },
    [setLabelSuppressed],
  );

  const completeCollapse = useCallback(() => {
    const slug = lastSnapshotRef.current?.slug;
    if (slug) hideTile(slug, false);
    pendingCollapseRef.current = false;
    clearPendingCollapse();
    if (slug && openedFromGrid(slug)) {
      markPendingOpen(slug);
    }
    setPhase("idle");
    setSnapshot(null);
    setLabelSuppressed?.(false);
    clearBootCover();
  }, [hideTile, setLabelSuppressed]);

  const closeToGrid = useCallback(() => {
    if (pendingCollapseRef.current) return;

    const homeHref = homeHrefForFilter(readPortfolioFilter());
    const current = snapshot ?? lastSnapshotRef.current ?? readSnapshot();
    const slug =
      current?.slug ?? caseStudySlugFromPath(locationPath()) ?? undefined;

    const goHome = () => {
      markPendingCollapse();
      clearPendingOpen();
      if (openedFromGrid(slug) && window.history.length > 1) {
        const cancelFallback = () => {
          window.clearTimeout(homeNavFallbackRef.current);
          window.removeEventListener("pagehide", cancelFallback);
        };
        window.addEventListener("pagehide", cancelFallback);
        window.history.back();
        window.clearTimeout(homeNavFallbackRef.current);
        homeNavFallbackRef.current = window.setTimeout(() => {
          window.removeEventListener("pagehide", cancelFallback);
          if (isCaseStudyPath(locationPath())) {
            window.location.assign(withBasePath(homeHref));
          }
        }, 1500);
        return;
      }
      window.location.assign(withBasePath(homeHref));
    };

    if (!current) {
      goHome();
      return;
    }

    pendingCollapseRef.current = true;
    lastSnapshotRef.current = current;
    persistSnapshot(current);
    setLabelSuppressed?.(true);
    clearCursorLabel?.();

    if (prefersReducedMotion()) {
      setPhase("idle");
      setSnapshot(null);
      hideTile(current.slug, false);
      setLabelSuppressed?.(false);
      goHome();
      return;
    }

    flushSync(() => {
      setSnapshot({
        ...current,
        sourceRect: viewportRect(),
      });
      setPhase("covering");
    });
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        goHome();
      });
    });
  }, [clearCursorLabel, hideTile, setLabelSuppressed, snapshot]);

  useEffect(() => {
    return () => {
      window.clearTimeout(revealTimeoutRef.current);
      window.clearTimeout(coverFallbackRef.current);
      window.clearTimeout(homeNavFallbackRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (didBootRef.current) return;
    didBootRef.current = true;
    const boot = readPendingTransition();
    lastSnapshotRef.current = boot.snapshot;
    pendingCollapseRef.current = boot.pendingCollapse;
    if (boot.phase === "idle") return;
    setSnapshot(boot.snapshot);
    setPhase(boot.phase);
    setLabelSuppressed?.(true);
  }, [setLabelSuppressed]);

  useLayoutEffect(() => {
    if (
      phase === "covering" ||
      phase === "collapsing" ||
      phase === "expanding" ||
      phase === "revealing"
    ) {
      clearBootCover();
    }
  }, [phase]);

  useLayoutEffect(() => {
    if (phase !== "covering" || pendingCollapseRef.current) return;
    if (!isCaseStudyPath(pathname)) return;
    const slug = caseStudySlugFromPath(pathname);
    const current = lastSnapshotRef.current ?? readSnapshot();
    if (!slug || !current || current.slug !== slug) return;
    lastSnapshotRef.current = current;
    notifyPageReady(slug);
  }, [notifyPageReady, pathname, phase]);

  useLayoutEffect(() => {
    if (phase !== "covering" || !pendingCollapseRef.current) return;
    if (!isHomePath(pathname)) return;
    const current = lastSnapshotRef.current ?? readSnapshot();
    if (!current) return;
    hideTile(current.slug, true);
    const origin = measureOrigin(current.slug, current.sourceRect);
    const next = { ...current, sourceRect: origin };
    lastSnapshotRef.current = next;
    persistSnapshot(next);
    setSnapshot(next);
    setPhase("collapsing");
  }, [hideTile, measureOrigin, pathname, phase]);

  useEffect(() => {
    if (phase !== "covering" && phase !== "expanding") {
      window.clearTimeout(coverFallbackRef.current);
      return;
    }
    if (pendingCollapseRef.current) {
      window.clearTimeout(coverFallbackRef.current);
      return;
    }

    const slug = lastSnapshotRef.current?.slug;
    if (!slug) return;
    if (isCaseStudyPath(locationPath())) return;

    window.clearTimeout(coverFallbackRef.current);
    coverFallbackRef.current = window.setTimeout(() => {
      if (phaseRef.current !== "covering" && phaseRef.current !== "expanding") {
        return;
      }
      if (pendingCollapseRef.current) return;
      if (isCaseStudyPath(locationPath())) return;
      if (didAssignOpenRef.current) return;
      didAssignOpenRef.current = true;
      markPendingOpen(slug);
      window.location.assign(withBasePath(caseStudyHref(slug)));
    }, 1600);

    return () => window.clearTimeout(coverFallbackRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase !== "idle") return;
    for (const tile of tilesRef.current.values()) {
      tile.style.visibility = "";
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "expanding") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeToGrid();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeToGrid, phase]);

  useLayoutEffect(() => {
    const previous = prevPathRef.current;
    prevPathRef.current = pathname;

    const wasCaseStudy = isCaseStudyPath(previous);
    const isHome = isHomePath(pathname);
    const isCaseStudy = isCaseStudyPath(pathname);

    if (restoredPathRef.current !== pathname) {
      restoredPathRef.current = pathname;

      if (isCaseStudy) {
        clearPendingCollapse();
        const slug = caseStudySlugFromPath(pathname);
        const stored = lastSnapshotRef.current ?? readSnapshot();
        const pendingOpen = slug ? readPendingOpen() === slug : false;
        if (stored && slug && stored.slug === slug && pendingOpen) {
          lastSnapshotRef.current = stored;
          pendingCollapseRef.current = false;
          setSnapshot(stored);
          setPhase("covering");
          setLabelSuppressed?.(true);
          return;
        }
      }

      if (isHome && phase === "idle") {
        const stored = lastSnapshotRef.current ?? readSnapshot();
        if (stored && (pendingCollapseRef.current || consumePendingCollapse())) {
          beginCollapse(stored);
          return;
        }
      }
    }

    const current = lastSnapshotRef.current;

    if (
      isHome &&
      pendingCollapseRef.current &&
      (phase === "covering" || phase === "revealing") &&
      current
    ) {
      beginCollapse(current);
      return;
    }

    if (wasCaseStudy && isHome && phase === "idle" && current) {
      beginCollapse(current);
    }
  }, [beginCollapse, pathname, phase, setLabelSuppressed]);

  useEffect(() => {
    if (!isCaseStudyPath(pathname)) return;

    const onPageHide = () => {
      const current = lastSnapshotRef.current ?? readSnapshot();
      if (current) persistSnapshot(current);
      markPendingCollapse();
      clearPendingOpen();
    };

    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [pathname]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      const current = lastSnapshotRef.current ?? readSnapshot();
      if (!current) return;

      if (isHomePath(pathname)) {
        const pending = peekPendingCollapse() || pendingCollapseRef.current;
        if (
          phaseRef.current === "covering" ||
          phaseRef.current === "expanding" ||
          phaseRef.current === "revealing" ||
          (pending && phaseRef.current === "idle")
        ) {
          beginCollapse(current);
        }
        return;
      }

      if (!isCaseStudyPath(pathname)) return;

      pendingCollapseRef.current = false;
      lastSnapshotRef.current = current;
      setSnapshot(current);
      setLabelSuppressed?.(true);
      if (phaseRef.current === "covering") {
        notifyPageReady(current.slug);
      } else {
        setPhase("covering");
      }
    };

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [beginCollapse, notifyPageReady, pathname, setLabelSuppressed]);

  useEffect(() => {
    if (phase === "idle") return;
    return lockBodyScroll();
  }, [phase]);

  const value = useMemo<CaseStudyTransitionValue>(
    () => ({
      phase,
      snapshot,
      openFromTile,
      notifyPageReady,
      completeExpand,
      completeCollapse,
      closeToGrid,
      registerTile,
    }),
    [
      phase,
      snapshot,
      openFromTile,
      notifyPageReady,
      completeExpand,
      completeCollapse,
      closeToGrid,
      registerTile,
    ],
  );

  return (
    <CaseStudyTransitionContext.Provider value={value}>
      {children}
    </CaseStudyTransitionContext.Provider>
  );
}

export function useCaseStudyTransition() {
  const context = useContext(CaseStudyTransitionContext);
  if (!context) {
    throw new Error(
      "useCaseStudyTransition must be used within CaseStudyTransitionProvider",
    );
  }
  return context;
}

export function useCaseStudyTransitionOptional() {
  return useContext(CaseStudyTransitionContext);
}
