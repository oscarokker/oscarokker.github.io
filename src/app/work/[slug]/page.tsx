import { WorkSlugRedirect } from "./work-slug-redirect";
import { getCaseStudySlugs } from "@/data/case-studies";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCaseStudySlugs().map((slug) => ({ slug }));
}

export default async function WorkSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <WorkSlugRedirect slug={slug} />;
}
