"use client";

import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import Image from "next/image";
import { CaseStudyCover } from "@/components/case-studies/CaseStudiesCover";
import { useCaseStudyTransition } from "@/components/case-studies/CaseStudiesTransition";
import { MinimizeIcon } from "@/components/ChromeIcons";
import { CaseStudyImpactIcon } from "@/components/case-studies/CaseStudiesImpactIcon";
import type { CaseStudy, CaseStudyBlockVariant } from "@/data/case-studies";
import { useSlidingThumb } from "@/hooks/useSlidingThumb";
import { accentClass } from "@/lib/accent";
import { withBasePath } from "@/lib/base-path";

interface CaseStudyArticleProps {
  study: CaseStudy;
}

type ReadingMode = "detailed" | "summary";

/** Keep in sync with `--transition-reading` in globals.css */
const READING_FOLD_MS = 420;

function detailedAttr(variant?: CaseStudyBlockVariant) {
  return variant === "detailed" ? true : undefined;
}

function maybeReadingFold(
  fold: boolean,
  open: boolean,
  key: string,
  child: ReactElement,
) {
  if (!fold) {
    return cloneElement(child, { key });
  }

  return (
    <ReadingFold key={key} open={open}>
      {child}
    </ReadingFold>
  );
}

function ReadingFold({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  const [concealed, setConcealed] = useState(!open);

  useLayoutEffect(() => {
    if (open) {
      setConcealed(false);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setConcealed(true);
      return;
    }

    const id = window.setTimeout(() => setConcealed(true), READING_FOLD_MS);
    return () => window.clearTimeout(id);
  }, [open]);

  return (
    <div
      className="reading-fold"
      data-open={open ? "true" : "false"}
      inert={concealed || undefined}
      aria-hidden={concealed || undefined}
    >
      <div className="reading-fold-clip">{children}</div>
    </div>
  );
}

export function CaseStudyArticle({ study }: CaseStudyArticleProps) {
  const titleId = useId();
  const detailedTabId = `${titleId}-tab-detailed`;
  const summaryTabId = `${titleId}-tab-summary`;
  const bodyId = `${titleId}-body`;
  const { phase, snapshot, notifyPageReady, closeToGrid } =
    useCaseStudyTransition();
  const fromMorph = snapshot?.slug === study.slug && phase !== "idle";
  const [revealed, setRevealed] = useState(
    () => phase === "idle" && snapshot?.slug !== study.slug,
  );
  const [mode, setMode] = useState<ReadingMode>("detailed");
  const { containerRef: toggleRef, thumb, thumbReady } = useSlidingThumb(mode);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    notifyPageReady(study.slug);
  }, [notifyPageReady, phase, study.slug]);

  useLayoutEffect(() => {
    if (phase === "expanding" || phase === "covering") {
      setRevealed(false);
      return;
    }
    if (phase === "revealing") {
      const frame = window.requestAnimationFrame(() => setRevealed(true));
      return () => window.cancelAnimationFrame(frame);
    }
    setRevealed(!fromMorph);
  }, [fromMorph, phase]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeToGrid();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeToGrid]);

  const handleMode = useCallback((next: ReadingMode) => {
    setMode(next);
  }, []);

  return (
    <article
      className={`case-study-page ${accentClass(study.accent)}`}
      data-from-morph={fromMorph ? "true" : "false"}
      data-revealed={revealed ? "true" : "false"}
      data-reading-mode={mode}
      aria-labelledby={titleId}
    >
      <div className="case-study-collapse-slot">
        <button
          type="button"
          className="intro-chrome-icon-btn case-study-collapse"
          aria-label="Close case study"
          onClick={closeToGrid}
        >
          <MinimizeIcon />
        </button>
      </div>
      <div className="case-study-page-inner">
        <div className="case-study-hero">
          <CaseStudyCover id={study.cover} label={study.coverLabel} />
        </div>

        <div
          ref={toggleRef}
          className="nav-pill case-study-toggle"
          role="tablist"
          aria-label="Reading length"
          data-thumb-ready={thumbReady ? "true" : "false"}
        >
          <span
            className="case-study-toggle-thumb"
            aria-hidden
            style={{
              transform: `translateX(${thumb.x}px)`,
              width: thumb.width,
            }}
          >
            <span className="nav-pill-thumb-surface" />
          </span>
          <button
            type="button"
            id={detailedTabId}
            className="nav-pill-button"
            role="tab"
            aria-selected={mode === "detailed"}
            aria-controls={bodyId}
            data-active={mode === "detailed"}
            onPointerDown={(event) => {
              if (event.button !== 0 || mode === "detailed") return;
              event.preventDefault();
              handleMode("detailed");
            }}
            onClick={(event) => {
              if (event.detail !== 0) {
                event.preventDefault();
                return;
              }
              handleMode("detailed");
            }}
          >
            Detailed
          </button>
          <button
            type="button"
            id={summaryTabId}
            className="nav-pill-button"
            role="tab"
            aria-selected={mode === "summary"}
            aria-controls={bodyId}
            data-active={mode === "summary"}
            onPointerDown={(event) => {
              if (event.button !== 0 || mode === "summary") return;
              event.preventDefault();
              handleMode("summary");
            }}
            onClick={(event) => {
              if (event.detail !== 0) {
                event.preventDefault();
                return;
              }
              handleMode("summary");
            }}
          >
            Summary
          </button>
        </div>

        <div className="case-study-reading">
          <header className="case-study-header">
            <h1 id={titleId} className="case-study-headline">
              {study.headline}
            </h1>
          </header>

          <div
            id={bodyId}
            className="case-study-body"
            role="tabpanel"
            aria-labelledby={
              mode === "detailed" ? detailedTabId : summaryTabId
            }
          >
            <p className="case-study-intro">{study.intro}</p>

            <section className="case-study-section">
              <h2>My role</h2>
              <p>{study.role}</p>
            </section>

            <section className="case-study-section">
              <h2>Impact</h2>
              <ul className="case-study-impact">
                {study.impact.map((item) => (
                  <li key={item.title}>
                    <span className="case-study-impact-icon" aria-hidden>
                      <CaseStudyImpactIcon id={item.icon} />
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {study.sections.map((section) => {
              const inner = (
                <>
                  <h2>{section.heading}</h2>
                  {section.paragraphs.map((paragraph, index) =>
                    maybeReadingFold(
                      paragraph.variant === "detailed" &&
                        section.variant !== "detailed",
                      mode === "detailed",
                      `${section.heading}-${index}`,
                      <p data-detailed={detailedAttr(paragraph.variant)}>
                        {paragraph.text}
                      </p>,
                    ),
                  )}
                  {section.figure ? (
                    <div className="case-study-inline-figure">
                      {section.figure.images ? (
                        <div className="case-study-phone-row">
                          {section.figure.images.map((img, idx) => (
                            <Image
                              key={img.src}
                              src={withBasePath(img.src)}
                              alt={img.alt}
                              width={1206}
                              height={2622}
                              sizes="(max-width: 680px) 30vw, 200px"
                              className="case-study-phone-img"
                              style={{ width: "100%", height: "auto" }}
                            />
                          ))}
                        </div>
                      ) : section.figure.src ? (
                        <Image
                          src={withBasePath(section.figure.src)}
                          alt={section.figure.caption}
                          width={1204}
                          height={928}
                          sizes="(max-width: 680px) 100vw, 680px"
                          className="case-study-cover-photo"
                          style={{ width: "100%", height: "auto" }}
                        />
                      ) : section.figure.cover ? (
                        <CaseStudyCover
                          id={section.figure.cover}
                          label={section.figure.caption}
                        />
                      ) : null}
                      <p className="case-study-caption">{section.figure.caption}</p>
                    </div>
                  ) : null}
                </>
              );

              return maybeReadingFold(
                section.variant === "detailed",
                mode === "detailed",
                section.heading,
                <section
                  className="case-study-section"
                  data-detailed={detailedAttr(section.variant)}
                >
                  {inner}
                </section>,
              );
            })}
          </div>
        </div>

        <section className="case-study-section">
          <h2>{study.result.heading ?? "Result"}</h2>
          {study.result.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </section>
      </div>
    </article>
  );
}
