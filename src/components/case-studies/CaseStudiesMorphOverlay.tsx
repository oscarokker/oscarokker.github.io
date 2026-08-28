"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type TransitionEvent as ReactTransitionEvent,
} from "react";
import { createPortal } from "react-dom";
import { CaseStudyFace } from "@/components/case-studies/CaseStudiesFace";
import {
  useCaseStudyTransitionOptional,
  viewportRect,
  type MorphRect,
} from "@/components/case-studies/CaseStudiesTransition";
import { accentClass } from "@/lib/accent";
import { spawnClickRipple } from "@/lib/clickRipple";

function applyRect(card: HTMLElement, rect: MorphRect) {
  card.style.top = `${rect.top}px`;
  card.style.left = `${rect.left}px`;
  card.style.width = `${rect.width}px`;
  card.style.height = `${rect.height}px`;
}

export function CaseStudyMorphOverlay() {
  const transition = useCaseStudyTransitionOptional();
  const cardRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(transition?.phase ?? "idle");
  const openingRippleKeyRef = useRef<string | null>(null);
  const completeExpand = transition?.completeExpand;
  const completeCollapse = transition?.completeCollapse;

  phaseRef.current = transition?.phase ?? "idle";

  useLayoutEffect(() => {
    const card = cardRef.current;
    const snapshot = transition?.snapshot;
    const phase = transition?.phase;
    if (!card || !snapshot || !phase || phase === "idle") return;

    if (phase === "expanding") {
      applyRect(card, snapshot.sourceRect);
      card.dataset.expanded = "false";
      card.style.transition = "none";
      void card.offsetHeight;

      const target = viewportRect();
      let raf2 = 0;
      const raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => {
          card.style.transition = "";
          applyRect(card, target);
          card.dataset.expanded = "true";
        });
      });

      return () => {
        window.cancelAnimationFrame(raf1);
        window.cancelAnimationFrame(raf2);
      };
    }

    if (phase === "covering") {
      card.style.transition = "none";
      applyRect(card, viewportRect());
      card.dataset.expanded = "true";
      void card.offsetHeight;
      card.style.transition = "";
      return;
    }

    if (phase === "revealing") {
      applyRect(card, viewportRect());
      card.dataset.expanded = "true";
      return;
    }

    if (phase === "collapsing") {
      card.style.transition = "none";
      applyRect(card, viewportRect());
      card.dataset.expanded = "true";
      void card.offsetHeight;

      let raf2 = 0;
      const raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => {
          card.style.transition = "";
          applyRect(card, snapshot.sourceRect);
          card.dataset.expanded = "false";
        });
      });

      return () => {
        window.cancelAnimationFrame(raf1);
        window.cancelAnimationFrame(raf2);
      };
    }
  }, [transition?.phase, transition?.snapshot]);

  useLayoutEffect(() => {
    const phase = transition?.phase;
    const snapshot = transition?.snapshot;
    const card = cardRef.current;
    if (phase === "idle" || !snapshot) {
      openingRippleKeyRef.current = null;
      return;
    }
    if (!card || !snapshot.pointer) return;
    if (phase !== "expanding" && phase !== "covering") return;

    const key = `${snapshot.slug}:${snapshot.pointer.clientX}:${snapshot.pointer.clientY}`;
    if (openingRippleKeyRef.current === key) return;
    openingRippleKeyRef.current = key;
    spawnClickRipple(card, snapshot.pointer);
  }, [transition?.phase, transition?.snapshot]);

  useEffect(() => {
    if (transition?.phase === "expanding") {
      const timeout = window.setTimeout(() => completeExpand?.(), 650);
      return () => window.clearTimeout(timeout);
    }

    if (transition?.phase === "collapsing") {
      const timeout = window.setTimeout(() => completeCollapse?.(), 650);
      return () => window.clearTimeout(timeout);
    }
  }, [completeCollapse, completeExpand, transition?.phase]);

  const handleTransitionEnd = useCallback(
    (event: ReactTransitionEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      if (
        event.propertyName !== "top" &&
        event.propertyName !== "left" &&
        event.propertyName !== "width" &&
        event.propertyName !== "height"
      ) {
        return;
      }

      if (phaseRef.current === "expanding") {
        completeExpand?.();
        return;
      }

      if (phaseRef.current === "collapsing") {
        completeCollapse?.();
      }
    },
    [completeCollapse, completeExpand],
  );

  const handleClick = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    spawnClickRipple(cardRef.current, event);
  }, []);

  if (!transition || transition.phase === "idle" || !transition.snapshot) {
    return null;
  }

  if (typeof document === "undefined") return null;

  const { snapshot, phase } = transition;
  const initial =
    phase === "expanding" ? snapshot.sourceRect : viewportRect();
  const cardStyle: CSSProperties = {
    top: initial.top,
    left: initial.left,
    width: initial.width,
    height: initial.height,
  };

  return createPortal(
    <div
      className="case-study-morph-root"
      data-phase={phase}
      aria-hidden
    >
      <div
        ref={cardRef}
        className={`case-study-morph-card ${accentClass(snapshot.accent)}`}
        data-expanded={phase === "expanding" ? "false" : "true"}
        style={cardStyle}
        onTransitionEnd={handleTransitionEnd}
        onClick={handleClick}
      >
        <CaseStudyFace
          title={snapshot.title}
          accent={snapshot.accent}
          coverSrc={snapshot.coverSrc}
          comingSoon={snapshot.comingSoon}
        />
      </div>
    </div>,
    document.body,
  );
}
