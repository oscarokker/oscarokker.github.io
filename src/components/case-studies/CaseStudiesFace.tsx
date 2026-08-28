import Image from "next/image";
import { accentClass } from "@/lib/accent";
import { withBasePath } from "@/lib/base-path";

interface CaseStudyFaceProps {
  title: string;
  accent?: string;
  coverSrc?: string;
  comingSoon?: boolean;
}

export function CaseStudyFace({
  title,
  accent,
  coverSrc,
  comingSoon,
}: CaseStudyFaceProps) {
  return (
    <div
      className={`tile-card-inner case-study-face relative justify-end ${accentClass(accent)} h-full ${coverSrc ? "case-study-face--cover" : ""}`}
    >
      {coverSrc ? (
        <>
          <div className="case-study-face-cover-wrap" aria-hidden>
            <Image
              src={withBasePath(coverSrc)}
              alt=""
              fill
              sizes="(max-width: 680px) 50vw, 280px"
              className="case-study-face-cover"
            />
          </div>
          <div className="case-study-face-scrim" />
        </>
      ) : (
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            background:
              "linear-gradient(135deg, var(--tile-accent) 0%, transparent 60%)",
          }}
        />
      )}
      <div className="relative z-[2]">
        <h2
          className={`text-h1 m-0 ${coverSrc ? "" : "text-[var(--color-text-primary)]"}`}
        >
          {title}
        </h2>
        {comingSoon ? (
          <p
            className={`case-study-coming-soon text-caption m-0 mt-1 ${coverSrc ? "" : "text-[var(--color-text-primary)]"}`}
          >
            coming soon
          </p>
        ) : null}
      </div>
    </div>
  );
}
