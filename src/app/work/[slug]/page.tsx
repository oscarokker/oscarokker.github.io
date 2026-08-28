import { notFound } from "next/navigation";
import { WorkSlugRedirect } from "./work-slug-redirect";
import {
  getPublishedCaseStudySlugs,
  isComingSoonCaseStudy,
} from "@/data/case-studies";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedCaseStudySlugs().map((slug) => ({ slug }));
}

export default async function WorkSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (isComingSoonCaseStudy(slug)) notFound();

  return <WorkSlugRedirect slug={slug} />;
}
