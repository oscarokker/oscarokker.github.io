import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyArticle } from "@/components/case-studies/CaseStudiesArticle";
import {
  getCaseStudy,
  getPublishedCaseStudySlugs,
  isComingSoonCaseStudy,
} from "@/data/case-studies";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedCaseStudySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study || isComingSoonCaseStudy(slug)) return { title: "Case study" };

  return {
    title: study.title,
    description: study.intro,
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study || isComingSoonCaseStudy(slug)) notFound();

  return <CaseStudyArticle study={study} />;
}
