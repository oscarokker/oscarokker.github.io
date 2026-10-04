import type { MetadataRoute } from "next";
import { getCaseStudySlugs } from "@/data/case-studies";

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

  const publishedSlugs = getCaseStudySlugs();
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
