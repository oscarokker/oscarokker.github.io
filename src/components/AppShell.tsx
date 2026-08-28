"use client";

import { CustomCursor } from "@/components/CustomCursor";
import { Header } from "@/components/Header";
import { StarfieldBackground } from "@/components/StarfieldBackground";
import { CaseStudyMorphOverlay } from "@/components/case-studies/CaseStudiesMorphOverlay";
import { CaseStudyTransitionProvider } from "@/components/case-studies/CaseStudiesTransition";
import {
  HeaderVisibilityProvider,
  useHeaderVisibility,
} from "@/hooks/useHeaderVisibility";

function ShellChrome({ children }: { children: React.ReactNode }) {
  const headerVisible = useHeaderVisibility();

  return (
    <>
      <StarfieldBackground />
      <Header visible={headerVisible} />
      {children}
      <CaseStudyMorphOverlay />
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CustomCursor>
      <CaseStudyTransitionProvider>
        <HeaderVisibilityProvider>
          <ShellChrome>{children}</ShellChrome>
        </HeaderVisibilityProvider>
      </CaseStudyTransitionProvider>
    </CustomCursor>
  );
}
