"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { CustomCursor } from "@/components/CustomCursor";
import { Header } from "@/components/Header";
import { AsciiWaveBackground } from "@/components/AsciiWaveBackground";
import { CaseStudyMorphOverlay } from "@/components/case-studies/CaseStudiesMorphOverlay";
import { CaseStudyTransitionProvider, useCaseStudyTransition } from "@/components/case-studies/CaseStudiesTransition";
import {
  loadCaseStudyContent,
  readLoadedCaseStudy,
} from "@/data/load-case-study";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { MusicPlayer } from "@/components/MusicPlayer";
import {
  HeaderVisibilityProvider,
  useHeaderVisibility,
} from "@/hooks/useHeaderVisibility";
import type { FilterCategory } from "@/lib/types";
import {
  FILTER_QUERY_KEY,
  parseFilterParam,
  rememberPortfolioFilter,
} from "@/lib/portfolio-filter";
import { withBasePath } from "@/lib/base-path";
import { usePathname } from "next/navigation";

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function filterFromLocation(): FilterCategory {
  return parseFilterParam(
    new URLSearchParams(window.location.search).get(FILTER_QUERY_KEY),
  );
}

function InDocumentCaseStudyLayer() {
  const { inDocumentSlug } = useCaseStudyTransition();
  const [ticket, setTicket] = useState(0);
  const ready = inDocumentSlug ? readLoadedCaseStudy(inDocumentSlug) : null;

  useEffect(() => {
    if (!inDocumentSlug || readLoadedCaseStudy(inDocumentSlug)) return;
    let cancelled = false;
    loadCaseStudyContent().then(() => {
      if (!cancelled) setTicket((n) => n + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [inDocumentSlug, ticket]);

  if (!inDocumentSlug || !ready) return null;

  const { study, Article } = ready;
  return (
    <div key={ticket} className="case-study-in-document-layer">
      <Article study={study} />
    </div>
  );
}

function homeHrefForFilter(filter: FilterCategory): string {
  return filter === "all" ? "/" : `/?${FILTER_QUERY_KEY}=${filter}`;
}

function ShellChrome({ children }: { children: React.ReactNode }) {
  const headerVisible = useHeaderVisibility();
  const pathname = usePathname();
  const isHome = pathname === "/";
  
  const activeFilter = useSyncExternalStore(
    subscribeToLocation,
    filterFromLocation,
    () => "all" as FilterCategory,
  );

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
      <AsciiWaveBackground />
      <Header 
        visible={headerVisible} 
        activeFilter={isHome ? activeFilter : undefined}
        onFilterChange={isHome ? onFilterChange : undefined}
      />
      {children}
      <InDocumentCaseStudyLayer />
      <CaseStudyMorphOverlay />
      <MusicPlayer />
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CustomCursor>
      <MusicPlayerProvider>
        <CaseStudyTransitionProvider>
          <HeaderVisibilityProvider>
            <ShellChrome>{children}</ShellChrome>
          </HeaderVisibilityProvider>
        </CaseStudyTransitionProvider>
      </MusicPlayerProvider>
    </CustomCursor>
  );
}
