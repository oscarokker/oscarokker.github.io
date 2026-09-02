"use client";

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

function ShellChrome({ children }: { children: React.ReactNode }) {
  const headerVisible = useHeaderVisibility();

  return (
    <>
      <AuroraBackground />
      <Header visible={headerVisible} />
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
