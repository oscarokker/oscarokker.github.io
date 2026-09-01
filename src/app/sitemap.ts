import type { MetadataRoute } from "next";
import { getPublishedCaseStudySlugs } from "@/data/case-studies";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://oscarrode.com";

  // Homepage
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
  ];

  // Published case studies only (excludes coming-soon)
  const publishedSlugs = getPublishedCaseStudySlugs();
  for (const slug of publishedSlugs) {
    routes.push({
      url: `${baseUrl}/case-studies/${slug}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return routes;
}
