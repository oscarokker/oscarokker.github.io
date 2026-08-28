"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { caseStudyHref } from "@/lib/case-study-href";

export function WorkSlugRedirect({ slug }: { slug: string }) {
  const router = useRouter();
  const href = caseStudyHref(slug);

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return (
    <main className="case-study-page">
      <div className="case-study-page-inner">
        <p className="case-study-intro">
          <Link href={href}>Continue to the case study</Link>
        </p>
      </div>
    </main>
  );
}
