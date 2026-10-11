import type { CaseStudy } from "@/data/case-studies";

type CaseStudyModules = [
  typeof import("@/data/case-studies"),
  typeof import("@/components/case-studies/CaseStudiesArticle"),
];

type CaseStudyArticleComponent = CaseStudyModules[1]["CaseStudyArticle"];

let modulesPromise: Promise<CaseStudyModules> | null = null;
let modulesCache: CaseStudyModules | null = null;

/**
 * Client-only loader for case-study copy and the article component.
 * Dynamic imports keep that module out of the shared layout chunk; the
 * case-study route still imports the same modules directly.
 * The resolved modules are cached so the morph can render on the same tick
 * the covering card starts to lift.
 */
export function loadCaseStudyContent(): Promise<CaseStudyModules> {
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import("@/data/case-studies"),
      import("@/components/case-studies/CaseStudiesArticle"),
    ]).then((loaded) => {
      modulesCache = loaded;
      return loaded;
    });
  }
  return modulesPromise;
}

export function readLoadedCaseStudy(slug: string): {
  study: CaseStudy;
  Article: CaseStudyArticleComponent;
} | null {
  if (!modulesCache) return null;
  const study = modulesCache[0].getCaseStudy(slug);
  if (!study) return null;
  return { study, Article: modulesCache[1].CaseStudyArticle };
}
