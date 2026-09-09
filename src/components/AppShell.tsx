"use client";

import { useCallback, useSyncExternalStore } from "react";
import { CustomCursor } from "@/components/CustomCursor";
import { Header } from "@/components/Header";
import { AuroraBackground } from "@/components/AuroraBackground";
import { CaseStudyMorphOverlay } from "@/components/case-studies/CaseStudiesMorphOverlay";
import { CaseStudyTransitionProvider, useCaseStudyTransition } from "@/components/case-studies/CaseStudiesTransition";
import { CaseStudyArticle } from "@/components/case-studies/CaseStudiesArticle";
import { getCaseStudy } from "@/data/case-studies";
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
  
  if (!inDocumentSlug) return null;
  
  const study = getCaseStudy(inDocumentSlug);
  if (!study) return null;
  
  return (
    <div className="case-study-in-document-layer">
      <CaseStudyArticle study={study} />
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
      <AuroraBackground />
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
