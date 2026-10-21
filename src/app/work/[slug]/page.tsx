import type { Metadata } from "next";
import { WorkSlugRedirect } from "./work-slug-redirect";
import { getCaseStudySlugs } from "@/data/case-studies";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCaseStudySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    alternates: {
      canonical: `https://oscarrode.com/case-studies/${slug}/`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function WorkSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=/case-studies/${slug}/`} />
      <WorkSlugRedirect slug={slug} />
    </>
  );
}
