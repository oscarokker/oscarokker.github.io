"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { accentClass } from "@/lib/accent";
import { withBasePath } from "@/lib/base-path";

interface CaseStudyFaceProps {
  accent?: string;
  coverSrc?: string;
  coverVideoSrc?: string;
  coverPosterSrc?: string;
}

function CoverVideo({
  src,
  poster,
}: {
  src: string;
  poster?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeSrc, setActiveSrc] = useState<string | undefined>(undefined);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const videoSrc = withBasePath(src);
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting) {
        setActiveSrc((current) => current ?? videoSrc);
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;
    if (!inView) {
      video.pause();
      return;
    }
    const play = () => {
      void video.play().catch(() => {});
    };
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      play();
      return;
    }
    video.addEventListener("canplay", play);
    return () => video.removeEventListener("canplay", play);
  }, [activeSrc, inView]);

  return (
    <div ref={wrapRef} className="case-study-face-cover-wrap" aria-hidden>
      <video
        ref={videoRef}
        src={activeSrc}
        poster={poster ? withBasePath(poster) : undefined}
        muted
        loop
        playsInline
        preload={activeSrc ? "auto" : "none"}
        className="case-study-face-cover"
      />
    </div>
  );
}

export function CaseStudyFace({
  accent,
  coverSrc,
  coverVideoSrc,
  coverPosterSrc,
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

  const shouldShowVideo = coverVideoSrc && !prefersReducedMotion;
  const imageSrc = coverPosterSrc || coverSrc;

  return (
    <div
      className={`tile-card-inner case-study-face relative ${accentClass(accent)} h-full ${hasCover ? "case-study-face--cover" : ""}`}
    >
      {hasCover ? (
        shouldShowVideo ? (
          <CoverVideo src={coverVideoSrc} poster={coverPosterSrc || coverSrc} />
        ) : imageSrc ? (
          <div className="case-study-face-cover-wrap" aria-hidden>
            <Image
              src={withBasePath(imageSrc)}
              alt=""
              fill
              sizes="(max-width: 680px) 50vw, 280px"
              className="case-study-face-cover"
            />
          </div>
        ) : null
      ) : (
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            background:
              "linear-gradient(135deg, var(--tile-accent) 0%, transparent 60%)",
          }}
        />
      )}
    </div>
  );
}
