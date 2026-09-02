"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { CaseStudyFace } from "@/components/case-studies/CaseStudiesFace";
import { caseStudyHref } from "@/lib/case-study-href";
import { withBasePath } from "@/lib/base-path";
import {
  rectFromElement,
  useCaseStudyTransition,
} from "@/components/case-studies/CaseStudiesTransition";
import { ExpandIcon } from "@/components/ChromeIcons";
import { usePointerGesture } from "@/hooks/usePointerGesture";

interface CaseStudyTileProps {
  title: string;
  subtitle: string;
  slug: string;
  accent?: string;
  coverSrc?: string;
  comingSoon?: boolean;
}

function isModifiedClick(event: {
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function CaseStudyTile({
  title,
  subtitle,
  slug,
  accent,
  coverSrc,
  comingSoon,
}: CaseStudyTileProps) {
  const tileRef = useRef<HTMLAnchorElement>(null);
  const { openFromTile, registerTile, phase, snapshot } =
    useCaseStudyTransition();
  const isBusy = snapshot?.slug === slug && phase !== "idle";
  const href = caseStudyHref(slug);

  useLayoutEffect(() => {
    if (comingSoon) return;
    const shell = tileRef.current?.closest(".tile-card") as HTMLElement | null;
    registerTile(slug, shell);
    return () => registerTile(slug, null);
  }, [comingSoon, registerTile, slug]);

  const open = useCallback(
    (event?: { clientX: number; clientY: number }) => {
      const shell =
        (tileRef.current?.closest(".tile-card") as HTMLElement | null) ??
        tileRef.current;
      if (!shell) return;
      openFromTile({
        slug,
        title,
        subtitle,
        accent,
        coverSrc,
        sourceRect: rectFromElement(shell),
        pointer: event
          ? { clientX: event.clientX, clientY: event.clientY }
          : undefined,
      });
    },
    [accent, coverSrc, openFromTile, slug, subtitle, title],
  );

  const { pointerHandlers } = usePointerGesture({
    onTap: useCallback(
      (event: React.PointerEvent<HTMLAnchorElement>) => {
        if (isBusy || isModifiedClick(event)) return;
        open(event);
      },
      [isBusy, open],
    ),
  });

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLAnchorElement>) => {
      if (event.button !== 0 || isModifiedClick(event)) return;
      event.preventDefault();
      // Keyboard Enter synthesizes click (detail 0) without pointer gesture.
      if (event.detail === 0) open();
    },
    [open],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLAnchorElement>) => {
      if (event.key === " ") {
        event.preventDefault();
        tileRef.current?.click();
      }
    },
    [],
  );

  const face = (
    <CaseStudyFace
      title={title}
      accent={accent}
      coverSrc={coverSrc}
      comingSoon={comingSoon}
    />
  );

  if (comingSoon) {
    return <div className="case-study-tile">{face}</div>;
  }

  return (
    <a
      ref={tileRef}
      href={withBasePath(href)}
      className="case-study-tile case-study-tile--expandable"
      aria-expanded={isBusy}
      aria-label={`${title}. Open case study.`}
      {...pointerHandlers}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className="intro-chrome-icon-btn intro-tile-expand" aria-hidden>
        <ExpandIcon />
      </span>
      {face}
    </a>
  );
}
