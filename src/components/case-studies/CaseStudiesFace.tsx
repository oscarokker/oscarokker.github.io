"use client";

import { useLayoutEffect, useState } from "react";
import Image from "next/image";
import { accentClass } from "@/lib/accent";
import { withBasePath } from "@/lib/base-path";

interface CaseStudyFaceProps {
  accent?: string;
  coverSrc?: string;
  coverVideoSrc?: string;
  coverPosterSrc?: string;
  comingSoon?: boolean;
}

export function CaseStudyFace({
  accent,
  coverSrc,
  coverVideoSrc,
  coverPosterSrc,
  comingSoon,
}: CaseStudyFaceProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const hasCover = coverSrc || coverVideoSrc || coverPosterSrc;

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Use video if available and motion is not reduced
  const shouldShowVideo = coverVideoSrc && !prefersReducedMotion;
  const imageSrc = coverPosterSrc || coverSrc;

  return (
    <div
      className={`tile-card-inner case-study-face relative ${accentClass(accent)} h-full ${hasCover ? "case-study-face--cover" : ""} ${!hasCover && comingSoon ? "justify-center items-center" : ""}`}
    >
      {hasCover ? (
        <div className="case-study-face-cover-wrap" aria-hidden>
          {shouldShowVideo ? (
            <video
              src={withBasePath(coverVideoSrc)}
              poster={coverPosterSrc ? withBasePath(coverPosterSrc) : undefined}
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
              className="case-study-face-cover"
            />
          ) : imageSrc ? (
            <Image
              src={withBasePath(imageSrc)}
              alt=""
              fill
              sizes="(max-width: 680px) 50vw, 280px"
              className="case-study-face-cover"
            />
          ) : null}
        </div>
      ) : (
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            background:
              "linear-gradient(135deg, var(--tile-accent) 0%, transparent 60%)",
          }}
        />
      )}
      {!hasCover && comingSoon ? (
        <div className="relative z-[2]">
          <p className="case-study-coming-soon text-caption m-0 text-[var(--color-text-primary)]">
            coming soon
          </p>
        </div>
      ) : null}
    </div>
  );
}
