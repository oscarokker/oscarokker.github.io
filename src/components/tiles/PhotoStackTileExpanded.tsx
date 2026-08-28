"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
  type TransitionEvent as ReactTransitionEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  getPlaceholderTone,
  PhotoStackPreview,
} from "@/components/tiles/PhotoMedia";
import { DownloadIcon, MinimizeIcon } from "@/components/ChromeIcons";
import { albumCaptionFromPhotoSrc } from "@/lib/album-folder-label";
import { withBasePath } from "@/lib/base-path";
import { lockBodyScroll } from "@/lib/lockBodyScroll";
import {
  GALLERY_PHOTO_SIZES,
  optimizedPhotoSrc,
  optimizedPhotoSrcSet,
} from "@/lib/photo-src";

export interface PhotoStackSourceRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface PhotoStackTileExpandedProps {
  title: string;
  images: string[];
  listingUrl?: string;
  visible: boolean;
  sourceRect: PhotoStackSourceRect;
  getSourceRect: () => PhotoStackSourceRect | null;
  onClose: () => void;
  onExitComplete: () => void;
  onMorphReady: () => void;
}

const INITIAL_EAGER_COUNT = 6;

interface MorphRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function filenameFromSrc(src: string): string {
  const path = src.split(/[?#]/, 1)[0] ?? src;
  const slash = path.lastIndexOf("/");
  const name = slash >= 0 ? path.slice(slash + 1) : path;
  if (!name) return "photograph.jpg";
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
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

function getExpandedTargetWidth(padding: number): number {
  return Math.min(window.innerWidth * 0.8, window.innerWidth - padding * 2);
}

function measureExpandedTarget(): MorphRect {
  const padding = Math.max(24, getPagePadding());
  const width = getExpandedTargetWidth(padding);
  const vh = window.innerHeight;
  // Viewport-relative height so the gallery is usable before images load.
  // Prefer 75vh, clamped to 60–80vh and kept inside page padding.
  const height = Math.min(
    Math.max(vh * 0.75, vh * 0.6),
    Math.min(vh * 0.8, vh - padding * 2),
  );
  const left = Math.max(padding, (window.innerWidth - width) / 2);
  const top = Math.max(padding, (vh - height) / 2);

  return { top, left, width, height };
}

function splitGalleryColumns(images: string[]): [string[], string[]] {
  const left: string[] = [];
  const right: string[] = [];
  images.forEach((src, index) => {
    if (index % 2 === 0) left.push(src);
    else right.push(src);
  });
  return [left, right];
}

function decodePhotoSrc(src: string): string {
  try {
    return decodeURIComponent(src);
  } catch {
    return src;
  }
}

function mergeGallerySources(preview: string[], listed: string[]): string[] {
  const seen = new Set(preview.map(decodePhotoSrc));
  const merged = [...preview];
  for (const src of listed) {
    const decoded = decodePhotoSrc(src);
    if (seen.has(decoded)) continue;
    seen.add(decoded);
    merged.push(src);
  }
  return merged;
}

export function PhotoStackTileExpanded({
  title,
  images,
  listingUrl,
  visible,
  sourceRect,
  getSourceRect,
  onClose,
  onExitComplete,
  onMorphReady,
}: PhotoStackTileExpandedProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const exitDone = useRef(false);
  const hasOpened = useRef(false);
  const morphRectRef = useRef<MorphRect>(sourceRect);
  const expandedRef = useRef(false);
  const phaseRef = useRef<"enter" | "open" | "exit">("enter");
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const scrollIdleTimeout = useRef(0);
  const [galleryActive, setGalleryActive] = useState(false);
  const [galleryImages, setGalleryImages] = useState(images);
  const [leftColumn, rightColumn] = splitGalleryColumns(galleryImages);

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
    setGalleryActive((current) => (current === expanded ? current : expanded));
  }, []);

  const finishExit = useCallback(() => {
    if (exitDone.current) return;
    exitDone.current = true;
    previouslyFocused.current?.focus?.();
    onExitComplete();
  }, [onExitComplete]);

  useLayoutEffect(() => {
    const card = dialogRef.current;
    if (!card) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    exitDone.current = false;
    phaseRef.current = "enter";

    applyRect(sourceRect, false);
    card.style.transition = "none";
    onMorphReady();

    if (prefersReducedMotion()) {
      const target = measureExpandedTarget();
      applyRect(target, true);
      phaseRef.current = "open";
      hasOpened.current = true;
      window.requestAnimationFrame(() => closeRef.current?.focus());
      return;
    }

    const target = measureExpandedTarget();
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

  useEffect(() => {
    const onResize = () => {
      if (phaseRef.current !== "open") return;
      const card = dialogRef.current;
      if (!card) return;
      const previousTransition = card.style.transition;
      card.style.transition = "none";
      applyRect(measureExpandedTarget(), true);
      void card.offsetHeight;
      card.style.transition = previousTransition;
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [applyRect]);

  useEffect(() => lockBodyScroll(), []);

  useEffect(() => {
    if (!listingUrl) {
      setGalleryImages(images);
      return;
    }

    const url = listingUrl;
    let cancelled = false;

    async function loadListing() {
      try {
        const response = await fetch(withBasePath(url));
        if (!response.ok) throw new Error("listing failed");
        const data = (await response.json()) as { photos?: string[] };
        if (cancelled) return;
        setGalleryImages(mergeGallerySources(images, data.photos ?? []));
      } catch {
        if (!cancelled) setGalleryImages(images);
      }
    }

    void loadListing();
    return () => {
      cancelled = true;
    };
  }, [images, listingUrl]);

  useEffect(() => {
    const card = dialogRef.current;
    const scroller = scrollRef.current;
    const track = scrollbarRef.current;
    const thumb = thumbRef.current;
    if (!card || !scroller || !track || !thumb) return;

    const updateOverlayThumb = () => {
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      const overflow = scrollHeight - clientHeight;
      const trackHeight = track.clientHeight;

      if (overflow <= 0 || trackHeight <= 0) {
        thumb.style.height = "0px";
        thumb.style.transform = "translateY(0)";
        return false;
      }

      const thumbHeight = Math.max(32, (clientHeight / scrollHeight) * trackHeight);
      const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
      const thumbTop = (scrollTop / overflow) * maxThumbTop;
      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translateY(${thumbTop}px)`;
      return true;
    };

    const onScroll = () => {
      const canScroll = updateOverlayThumb();
      if (!canScroll) {
        card.classList.remove("is-scrolling");
        return;
      }

      card.classList.add("is-scrolling");
      window.clearTimeout(scrollIdleTimeout.current);
      scrollIdleTimeout.current = window.setTimeout(() => {
        card.classList.remove("is-scrolling");
      }, 800);
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      updateOverlayThumb();
    });
    resizeObserver.observe(scroller);
    const gallery = scroller.querySelector(".photo-gallery");
    if (gallery) resizeObserver.observe(gallery);

    updateOverlayThumb();

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
      window.clearTimeout(scrollIdleTimeout.current);
      card.classList.remove("is-scrolling");
    };
  }, []);

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

    if (prefersReducedMotion()) {
      applyRect(origin, false);
      finishExit();
      return;
    }

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

  const cardStyle: CSSProperties = {
    top: sourceRect.top,
    left: sourceRect.left,
    width: sourceRect.width,
    height: sourceRect.height,
  };

  return createPortal(
    <div
      className="intro-expanded-root photo-stack-expanded-root"
      data-visible={visible ? "true" : "false"}
    >
      <button
        type="button"
        className="intro-expanded-backdrop"
        aria-label={`Close ${title}`}
        onClick={handleBackdropClick}
        tabIndex={-1}
      />

      <div
        ref={dialogRef}
        className="photo-stack-morph-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-expanded="false"
        style={cardStyle}
        onKeyDown={handleCardKeyDown}
        onTransitionEnd={handleTransitionEnd}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          ref={scrollbarRef}
          className="photo-stack-morph-scrollbar"
          aria-hidden
        >
          <div
            ref={thumbRef}
            className="photo-stack-morph-scrollbar-thumb"
          />
        </div>

        <button
          ref={closeRef}
          type="button"
          className="intro-chrome-icon-btn intro-expanded-minimize"
          aria-label={`Minimize ${title}`}
          onClick={onClose}
          tabIndex={visible ? 0 : -1}
        >
          <MinimizeIcon />
        </button>

        <div ref={scrollRef} className="photo-stack-morph-scroll">
          <div className="photo-stack-morph-collapsed" aria-hidden>
            <PhotoStackPreview title={title} images={images} />
          </div>

          <div className="photo-stack-morph-body">
            <div className="photo-stack-gallery-chrome">
              <h2 id={titleId} className="photo-stack-gallery-title text-h2 m-0">
                {title}
              </h2>
            </div>
            <div className="photo-gallery">
              <div className="photo-gallery-col">
                {leftColumn.map((src, index) => (
                  <GalleryPhoto
                    key={src}
                    src={src}
                    alt={`${title} ${index * 2 + 1}`}
                    enabled={galleryActive}
                    priority={index * 2 < INITIAL_EAGER_COUNT}
                    rootRef={scrollRef}
                  />
                ))}
              </div>
              <div className="photo-gallery-col">
                {rightColumn.map((src, index) => (
                  <GalleryPhoto
                    key={src}
                    src={src}
                    alt={`${title} ${index * 2 + 2}`}
                    enabled={galleryActive}
                    priority={index * 2 + 1 < INITIAL_EAGER_COUNT}
                    rootRef={scrollRef}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function GalleryPhoto({
  src,
  alt,
  enabled,
  priority,
  rootRef,
}: {
  src: string;
  alt: string;
  enabled: boolean;
  priority: boolean;
  rootRef: RefObject<HTMLDivElement | null>;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(priority);
  const shouldLoad = enabled && (priority || inView);
  const tone = getPlaceholderTone(src);
  const caption = albumCaptionFromPhotoSrc(src);

  useEffect(() => {
    if (!enabled || priority || inView) return;
    const node = itemRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
        }
      },
      {
        root: rootRef.current,
        rootMargin: "400px 0px",
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, inView, priority, rootRef]);

  if (tone) {
    return (
      <div className="photo-gallery-item photo-gallery-item--placeholder">
        <div
          className={`photo-media-placeholder photo-media-placeholder--${tone}`}
          role="img"
          aria-label={alt}
        />
      </div>
    );
  }

  return (
    <div ref={itemRef} className="photo-gallery-item">
      {shouldLoad ? (
        <>
          {/* Native img so the browser uses each file's intrinsic aspect ratio. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="photo-gallery-image"
            src={optimizedPhotoSrc(src)}
            srcSet={optimizedPhotoSrcSet(src)}
            sizes={GALLERY_PHOTO_SIZES}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
          />
          <div className="photo-gallery-hover-chrome">
            {caption ? (
              <span className="photo-gallery-caption">{caption}</span>
            ) : null}
            <a
              className="intro-chrome-icon-btn photo-gallery-download"
              href={withBasePath(src)}
              download={filenameFromSrc(src)}
              aria-label="Download photograph"
              onClick={(event) => event.stopPropagation()}
            >
              <DownloadIcon />
            </a>
          </div>
        </>
      ) : (
        <div className="photo-gallery-skeleton" aria-hidden />
      )}
    </div>
  );
}
