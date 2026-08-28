"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type TransitionEvent as ReactTransitionEvent,
} from "react";
import { createPortal } from "react-dom";
import { accentClass } from "@/lib/accent";
import { withBasePath } from "@/lib/base-path";
import { spawnClickRipple } from "@/lib/clickRipple";
import { lockBodyScroll } from "@/lib/lockBodyScroll";
import { MinimizeIcon } from "@/components/ChromeIcons";

export interface IntroSourceRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface IntroTileExpandedProps {
  name: string;
  bio: string;
  paragraphs: string[];
  imageSrc?: string;
  visible: boolean;
  sourceRect: IntroSourceRect;
  getSourceRect: () => IntroSourceRect | null;
  openingPointer?: { clientX: number; clientY: number } | null;
  onClose: () => void;
  onExitComplete: () => void;
  onMorphReady: () => void;
}

interface MorphRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getPagePadding(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--page-padding")
    .trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 24;
}

function getGridWidthPx(): number {
  const grid = document.querySelector(".tile-grid");
  if (grid instanceof HTMLElement && grid.clientWidth > 0) {
    return grid.clientWidth;
  }
  // Fallback when grid is unmounted: parse desktop px or resolve calc via probe
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--grid-width")
    .trim();
  const parsed = Number.parseFloat(raw);
  if (Number.isFinite(parsed) && !raw.startsWith("calc")) {
    return parsed;
  }
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;visibility:hidden;width:var(--grid-width);pointer-events:none";
  document.body.appendChild(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width > 0 ? width : 1024;
}

function getExpandedTargetWidth(): number {
  // 80% of the active grid width (desktop fixed or mobile fluid)
  return getGridWidthPx() * 0.8;
}

function getExpandedCardWidth(): number {
  const padding = Math.max(24, getPagePadding());
  return Math.min(getExpandedTargetWidth(), window.innerWidth - padding * 2);
}

function lockFaceWidths(
  card: HTMLElement,
  collapsed: Pick<MorphRect, "width" | "height">,
  expandedWidth: number,
) {
  card.style.setProperty("--intro-collapsed-width", `${collapsed.width}px`);
  card.style.setProperty("--intro-collapsed-height", `${collapsed.height}px`);
  card.style.setProperty("--intro-expanded-width", `${expandedWidth}px`);
}

function measureExpandedTarget(card: HTMLElement): MorphRect {
  const padding = Math.max(24, getPagePadding());
  const maxHeight = Math.min(window.innerHeight * 0.88, 760);
  const width = getExpandedCardWidth();

  const previous = {
    transition: card.style.transition,
    top: card.style.top,
    left: card.style.left,
    width: card.style.width,
    height: card.style.height,
    maxHeight: card.style.maxHeight,
  };

  card.style.transition = "none";
  card.style.width = `${width}px`;
  card.style.height = "auto";
  card.style.maxHeight = `${maxHeight}px`;
  card.style.setProperty("--intro-expanded-width", `${width}px`);
  card.dataset.expanded = "true";
  // Force layout with expanded styles applied
  const height = Math.min(Math.max(card.scrollHeight, 320), maxHeight);
  const left = Math.max(padding, (window.innerWidth - width) / 2);
  const top = Math.max(padding, (window.innerHeight - height) / 2);

  card.style.transition = previous.transition;
  card.style.top = previous.top;
  card.style.left = previous.left;
  card.style.width = previous.width;
  card.style.height = previous.height;
  card.style.maxHeight = previous.maxHeight;
  card.dataset.expanded = "false";
  // Flush reset before the animated frame
  void card.offsetHeight;

  return { top, left, width, height };
}

export function IntroTileExpanded({
  name,
  bio,
  paragraphs,
  imageSrc,
  visible,
  sourceRect,
  getSourceRect,
  openingPointer,
  onClose,
  onExitComplete,
  onMorphReady,
}: IntroTileExpandedProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const exitDone = useRef(false);
  const hasOpened = useRef(false);
  const morphRectRef = useRef<MorphRect>(sourceRect);
  const expandedRef = useRef(false);
  const phaseRef = useRef<"enter" | "open" | "exit">("enter");
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const applyRect = useCallback((rect: MorphRect, expanded: boolean) => {
    const card = dialogRef.current;
    if (!card) return;
    morphRectRef.current = rect;
    expandedRef.current = expanded;
    card.style.top = `${rect.top}px`;
    card.style.left = `${rect.left}px`;
    card.style.width = `${rect.width}px`;
    card.style.height = `${rect.height}px`;
    card.dataset.expanded = expanded ? "true" : "false";
  }, []);

  const finishExit = useCallback(() => {
    if (exitDone.current) return;
    exitDone.current = true;
    previouslyFocused.current?.focus?.();
    onExitComplete();
  }, [onExitComplete]);

  // Enter: place at source rect, then FLIP to expanded target
  useLayoutEffect(() => {
    const card = dialogRef.current;
    if (!card) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    exitDone.current = false;
    phaseRef.current = "enter";

    applyRect(sourceRect, false);
    lockFaceWidths(card, sourceRect, getExpandedCardWidth());
    card.style.transition = "none";
    onMorphReady();

    if (prefersReducedMotion()) {
      const target = measureExpandedTarget(card);
      lockFaceWidths(card, sourceRect, target.width);
      applyRect(target, true);
      phaseRef.current = "open";
      hasOpened.current = true;
      window.requestAnimationFrame(() => closeRef.current?.focus());
      return;
    }

    const target = measureExpandedTarget(card);
    lockFaceWidths(card, sourceRect, target.width);
    applyRect(sourceRect, false);

    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        if (!visibleRef.current || phaseRef.current === "exit") return;
        card.style.transition = "";
        applyRect(target, true);
        phaseRef.current = "open";
        hasOpened.current = true;
        closeRef.current?.focus();
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [applyRect, onMorphReady, sourceRect]);

  useLayoutEffect(() => {
    if (!openingPointer) return;
    spawnClickRipple(dialogRef.current, openingPointer);
  }, [openingPointer]);

  useEffect(() => lockBodyScroll(), []);

  // Exit: reverse FLIP back to current grid slot
  useEffect(() => {
    if (visible) {
      hasOpened.current = true;
      exitDone.current = false;
      return;
    }

    if (phaseRef.current === "enter" || !hasOpened.current) {
      finishExit();
      return;
    }

    const card = dialogRef.current;
    if (!card) {
      finishExit();
      return;
    }

    phaseRef.current = "exit";
    const origin = getSourceRect() ?? sourceRect;
    lockFaceWidths(card, origin, morphRectRef.current.width);

    if (prefersReducedMotion()) {
      applyRect(origin, false);
      finishExit();
      return;
    }

    // Ensure we're transitioning from the open state
    card.style.transition = "";
    applyRect(origin, false);

    const timeout = window.setTimeout(finishExit, 650);
    return () => window.clearTimeout(timeout);
  }, [visible, applyRect, finishExit, getSourceRect, sourceRect]);

  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, onClose]);

  const handleTransitionEnd = useCallback(
    (event: ReactTransitionEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      if (phaseRef.current !== "exit") return;
      if (
        event.propertyName !== "top" &&
        event.propertyName !== "width" &&
        event.propertyName !== "height" &&
        event.propertyName !== "left"
      ) {
        return;
      }
      finishExit();
    },
    [finishExit],
  );

  const handleBackdropClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onClose();
    },
    [onClose],
  );

  const handleCardKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  const handleCardClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      if (event.target instanceof Element && event.target.closest("button")) {
        return;
      }
      spawnClickRipple(dialogRef.current, event);
    },
    [],
  );

  const cardStyle = {
    top: sourceRect.top,
    left: sourceRect.left,
    width: sourceRect.width,
    height: sourceRect.height,
    "--intro-collapsed-width": `${sourceRect.width}px`,
    "--intro-collapsed-height": `${sourceRect.height}px`,
  } as CSSProperties;

  return createPortal(
    <div
      className="intro-expanded-root intro-about-expanded-root"
      data-visible={visible ? "true" : "false"}
    >
      <button
        type="button"
        className="intro-expanded-backdrop"
        aria-label="Close about Oscar"
        onClick={handleBackdropClick}
        tabIndex={-1}
      />

      <div
        ref={dialogRef}
        className={`intro-morph-card ${accentClass()}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-expanded="false"
        style={cardStyle}
        onKeyDown={handleCardKeyDown}
        onTransitionEnd={handleTransitionEnd}
        onClick={handleCardClick}
      >
        <button
          ref={closeRef}
          type="button"
          className="intro-chrome-icon-btn intro-expanded-minimize"
          aria-label="Minimize about Oscar"
          onClick={onClose}
          tabIndex={visible ? 0 : -1}
        >
          <MinimizeIcon />
        </button>

        <div className="intro-morph-collapsed" aria-hidden>
          <div className="intro-tile-avatar" aria-hidden={!imageSrc}>
            {imageSrc ? (
              <Image
                src={withBasePath(imageSrc)}
                alt=""
                fill
                sizes="160px"
                className="intro-tile-avatar-image"
                priority
              />
            ) : (
              <span className="intro-tile-avatar-placeholder">{initials}</span>
            )}
          </div>
          <div className="intro-tile-content">
            <div>
              <p className="text-display text-[var(--color-text-primary)] m-0 mb-2">
                {name}
              </p>
              <p className="text-body text-[var(--color-text-secondary)] m-0">
                {bio}
              </p>
            </div>
          </div>
        </div>

        <div className="intro-morph-expanded">
          <div className="intro-morph-expanded-avatar" aria-hidden={!imageSrc}>
            {imageSrc ? (
              <Image
                src={withBasePath(imageSrc)}
                alt={name}
                fill
                sizes="(max-width: 560px) 140px, 128px"
                className="intro-tile-avatar-image"
                priority
              />
            ) : (
              <span className="intro-tile-avatar-placeholder">{initials}</span>
            )}
          </div>
          <div className="intro-morph-expanded-copy">
            <h2
              id={titleId}
              className="intro-morph-name text-display text-[var(--color-text-primary)] m-0"
            >
              {name}
            </h2>
            <div className="intro-morph-paragraphs intro-expanded-paragraphs">
              {paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="text-body text-[var(--color-text-secondary)] m-0"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
