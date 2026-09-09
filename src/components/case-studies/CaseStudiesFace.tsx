import Image from "next/image";
import { accentClass } from "@/lib/accent";
import { withBasePath } from "@/lib/base-path";

interface CaseStudyFaceProps {
  accent?: string;
  coverSrc?: string;
  comingSoon?: boolean;
}

export function CaseStudyFace({
  accent,
  coverSrc,
  comingSoon,
}: CaseStudyFaceProps) {
  return (
    <div
      className={`tile-card-inner case-study-face relative ${accentClass(accent)} h-full ${coverSrc ? "case-study-face--cover" : ""} ${!coverSrc && comingSoon ? "justify-center items-center" : ""}`}
    >
      {coverSrc ? (
        <div className="case-study-face-cover-wrap" aria-hidden>
          <Image
            src={withBasePath(coverSrc)}
            alt=""
            fill
            sizes="(max-width: 680px) 50vw, 280px"
            className="case-study-face-cover"
          />
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
      {!coverSrc && comingSoon ? (
        <div className="relative z-[2]">
          <p className="case-study-coming-soon text-caption m-0 text-[var(--color-text-primary)]">
            coming soon
          </p>
        </div>
      ) : null}
    </div>
  );
}
