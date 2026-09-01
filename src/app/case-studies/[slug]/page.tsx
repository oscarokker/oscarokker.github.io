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

  const canonicalUrl = `https://oscarrode.com/case-studies/${slug}/`;
  const coverImage = `/case-studies/${study.cover}-cover.png`;

  return {
    title: study.title,
    description: study.intro,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: study.title,
      description: study.intro,
      type: "article",
      url: canonicalUrl,
      siteName: "Oscar Rode Portfolio",
      images: [
        {
          url: coverImage,
          alt: study.coverLabel,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: study.title,
      description: study.intro,
      images: [coverImage],
    },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: study.headline,
    description: study.intro,
    url: `https://oscarrode.com/case-studies/${slug}/`,
    author: {
      "@type": "Person",
      name: "Oscar Rode",
      url: "https://oscarrode.com/",
    },
    datePublished: "2024-01-01",
    image: `https://oscarrode.com/case-studies/${study.cover}-cover.png`,
    publisher: {
      "@type": "Person",
      name: "Oscar Rode",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CaseStudyArticle study={study} />
    </>
  );
}
