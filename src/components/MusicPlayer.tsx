"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type TransitionEvent as ReactTransitionEvent,
} from "react";
import { createPortal } from "react-dom";
import { accentClass } from "@/lib/accent";
import { withBasePath } from "@/lib/base-path";
import { lockBodyScroll } from "@/lib/lockBodyScroll";
import { MinimizeIcon } from "@/components/ChromeIcons";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

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

interface MorphRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function measureExpandedTarget(card: HTMLElement): MorphRect {
  const padding = Math.max(24, getPagePadding());
  const width = getExpandedTargetWidth(padding);
  const maxHeight = window.innerHeight - padding * 2;

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
  card.dataset.expanded = "true";
  const height = Math.min(Math.max(card.scrollHeight, 280), maxHeight);
  const left = Math.max(padding, (window.innerWidth - width) / 2);
  const top = Math.max(padding, (window.innerHeight - height) / 2);

  card.style.transition = previous.transition;
  card.style.top = previous.top;
  card.style.left = previous.left;
  card.style.width = previous.width;
  card.style.height = previous.height;
  card.style.maxHeight = previous.maxHeight;
  card.dataset.expanded = "false";
  void card.offsetHeight;

  return { top, left, width, height };
}

function getMiniTargetRect(): MorphRect {
  const padding = Math.max(16, getPagePadding());
  const width = Math.min(280, window.innerWidth - padding * 2);
  const height = Math.round(width * (9 / 16)); // 16:9 aspect ratio
  const left = window.innerWidth - width - padding;
  const top = window.innerHeight - height - padding;
  return { top, left, width, height };
}

function youtubeEmbedSrc(youtubeId: string, startSeconds?: number): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    autoplay: "1",
    enablejsapi: "1",
  });
  if (startSeconds && startSeconds > 0) {
    params.set("start", String(Math.floor(startSeconds)));
  }
  if (typeof window !== "undefined") {
    params.set("origin", window.location.origin);
  }
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`;
}

const CloseIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 4L4 12M4 4L12 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export function MusicPlayer() {
  const {
    currentTrack,
    playerState,
    sourceRect,
    dockToMini,
    stopPlayer,
    expandPlayer,
  } = useMusicPlayer();

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const minimizeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const morphRectRef = useRef<MorphRect | null>(null);
  const expandedRef = useRef(false);
  const phaseRef = useRef<"enter" | "open" | "exit" | "docked">("enter");
  const hasStartedRef = useRef(false);
  const iframeReadyRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);
  // Start as true - assume autoplay works. API will update if paused/ended.
  const [isYouTubePlaying, setIsYouTubePlaying] = useState(true);
  const isMiniRef = useRef(false);

  const visible = playerState !== "hidden";
  const isExpanded = playerState === "expanded";
  const isMini = playerState === "mini";
  isMiniRef.current = isMini;

  // Reset all state when player is stopped
  useEffect(() => {
    if (playerState === "hidden") {
      phaseRef.current = "enter";
      iframeReadyRef.current = false;
      hasStartedRef.current = false;
      morphRectRef.current = null;
      expandedRef.current = false;
      
      // Destroy YouTube player instance
      if (ytPlayerRef.current?.destroy) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {
          // Ignore errors during cleanup
        }
        ytPlayerRef.current = null;
      }
      
      // Clear datasets
      const card = dialogRef.current;
      if (card) {
        delete card.dataset.expanded;
        delete card.dataset.mini;
      }
    }
  }, [playerState]);

  const track = currentTrack;
  const heading = track?.videoTitle ?? track?.title ?? "";
  const iframeTitle = track?.videoArtist
    ? `${heading} by ${track.videoArtist}`
    : heading;

  const embedSrc = useMemo(() => {
    if (!track?.youtubeId) return "";
    // Only include startSeconds on first load
    const useStartSeconds = !hasStartedRef.current;
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
    }
    // Reset playing flag for new track (assume autoplay)
    setIsYouTubePlaying(true);
    return youtubeEmbedSrc(
      track.youtubeId,
      useStartSeconds ? track.startSeconds : undefined,
    );
  }, [track?.youtubeId, track?.startSeconds]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check if API is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      return;
    }

    // Load the API if not already present
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize YouTube Player once per track
  useEffect(() => {
    if (!track?.youtubeId) return;
    if (ytPlayerRef.current) return; // Already initialized for this track

    const initPlayer = () => {
      if (!(window as any).YT?.Player || !iframeRef.current) {
        setTimeout(initPlayer, 100);
        return;
      }

      try {
        ytPlayerRef.current = new (window as any).YT.Player(iframeRef.current, {
          events: {
            onStateChange: (event: any) => {
              const YT = (window as any).YT;
              const state = event.data;
              
              // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
              const playing = state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING;
              setIsYouTubePlaying(playing);
              
              // If paused or ended while in mini mode, stop the player
              if (isMiniRef.current && (state === YT.PlayerState.PAUSED || state === YT.PlayerState.ENDED)) {
                stopPlayer();
              }
            },
          },
        });
      } catch (error) {
        console.error("Failed to initialize YouTube player:", error);
      }
    };

    // Give iframe time to be ready
    setTimeout(initPlayer, 500);

    return () => {
      // Only destroy when track changes or component unmounts (not on expanded↔mini)
      if (ytPlayerRef.current?.destroy) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {
          // Ignore errors during cleanup
        }
        ytPlayerRef.current = null;
      }
    };
  }, [track?.youtubeId, stopPlayer]);

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
    card.dataset.mini = isMini ? "true" : "false";
  }, [isMini]);

  useLayoutEffect(() => {
    if (!visible || !sourceRect || !track) return;

    const card = dialogRef.current;
    if (!card) return;

    if (phaseRef.current === "docked" && isExpanded) {
      // Expanding from mini
      phaseRef.current = "enter";
      const target = measureExpandedTarget(card);

      if (prefersReducedMotion()) {
        applyRect(target, true);
        phaseRef.current = "open";
        return;
      }

      card.style.transition = "";
      applyRect(target, true);
      phaseRef.current = "open";
      return;
    }

    if (phaseRef.current !== "enter") return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    phaseRef.current = "enter";

    applyRect(sourceRect, false);
    card.style.transition = "none";

    if (prefersReducedMotion()) {
      if (isMini) {
        const miniRect = getMiniTargetRect();
        applyRect(miniRect, false);
        phaseRef.current = "docked";
      } else {
        const target = measureExpandedTarget(card);
        applyRect(target, true);
        phaseRef.current = "open";
      }
      window.requestAnimationFrame(() => minimizeRef.current?.focus());
      return;
    }

    const target = isExpanded
      ? measureExpandedTarget(card)
      : getMiniTargetRect();

    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        if (!visible || phaseRef.current === "exit") return;
        card.style.transition = "";
        applyRect(target, isExpanded);
        phaseRef.current = isExpanded ? "open" : "docked";
        if (isExpanded) {
          minimizeRef.current?.focus();
        }
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [visible, sourceRect, track, isExpanded, isMini, applyRect]);

  useEffect(() => {
    if (!visible || !track) return;

    if (isMini && phaseRef.current === "open") {
      // Docking from expanded
      const card = dialogRef.current;
      if (!card) return;

      const miniRect = getMiniTargetRect();

      if (prefersReducedMotion()) {
        applyRect(miniRect, false);
        phaseRef.current = "docked";
        return;
      }

      card.style.transition = "";
      applyRect(miniRect, false);
      phaseRef.current = "docked";
    }
  }, [isMini, visible, track, applyRect]);

  useEffect(() => {
    if (!isExpanded) return;

    const onResize = () => {
      if (phaseRef.current !== "open") return;
      const card = dialogRef.current;
      if (!card) return;
      const previousTransition = card.style.transition;
      card.style.transition = "none";
      applyRect(measureExpandedTarget(card), true);
      void card.offsetHeight;
      card.style.transition = previousTransition;
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isExpanded, applyRect]);

  useEffect(() => {
    if (!isMini) return;

    const onResize = () => {
      if (phaseRef.current !== "docked") return;
      const card = dialogRef.current;
      if (!card) return;
      const previousTransition = card.style.transition;
      card.style.transition = "none";
      applyRect(getMiniTargetRect(), false);
      void card.offsetHeight;
      card.style.transition = previousTransition;
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isMini, applyRect]);

  useEffect(() => {
    if (isExpanded) {
      return lockBodyScroll();
    }
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        // If already paused/ended, stop. Else dock to mini and let iframe continue.
        if (!isYouTubePlaying) {
          stopPlayer();
        } else {
          dockToMini();
        }
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
  }, [isExpanded, dockToMini, isYouTubePlaying, stopPlayer]);

  const handleBackdropClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (isExpanded) {
        // If already paused/ended, stop. Else dock to mini and let iframe continue.
        if (!isYouTubePlaying) {
          stopPlayer();
        } else {
          dockToMini();
        }
      }
    },
    [isExpanded, dockToMini, isYouTubePlaying, stopPlayer],
  );

  const handleMinimize = useCallback(() => {
    // If already paused/ended, stop. Else dock to mini and let iframe continue.
    if (!isYouTubePlaying) {
      stopPlayer();
    } else {
      dockToMini();
    }
  }, [dockToMini, isYouTubePlaying, stopPlayer]);

  const handleClose = useCallback(() => {
    stopPlayer();
  }, [stopPlayer]);

  const handleMiniClick = useCallback(() => {
    if (isMini) {
      expandPlayer();
    }
  }, [isMini, expandPlayer]);

  const togglePlayPause = useCallback(() => {
    if (!ytPlayerRef.current) return;
    try {
      const playerState = ytPlayerRef.current.getPlayerState?.();
      const YT = (window as any).YT;
      if (playerState === YT?.PlayerState?.PLAYING) {
        ytPlayerRef.current.pauseVideo();
      } else {
        ytPlayerRef.current.playVideo();
      }
    } catch (error) {
      console.error("Failed to toggle play/pause:", error);
    }
  }, []);

  const handleCardKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape" && isExpanded) {
        event.stopPropagation();
        // If already paused/ended, stop. Else dock to mini and let iframe continue.
        if (!isYouTubePlaying) {
          stopPlayer();
        } else {
          dockToMini();
        }
      }
    },
    [isExpanded, dockToMini, isYouTubePlaying, stopPlayer],
  );

  if (!track || !sourceRect) return null;
  // Only unmount when hidden (real stop). Keep mounted for expanded and mini.
  if (playerState === "hidden") return null;

  const cardStyle: CSSProperties = {
    top: sourceRect.top,
    left: sourceRect.left,
    width: sourceRect.width,
    height: sourceRect.height,
  };

  return createPortal(
    <>
      <div
        className={`intro-expanded-root music-expanded-root ${isMini ? "music-player-mini-mode" : ""}`}
        data-visible={(isExpanded || isMini) ? "true" : "false"}
      >
        {isExpanded && (
          <button
            type="button"
            className="intro-expanded-backdrop"
            aria-label={`Close ${heading}`}
            onClick={handleBackdropClick}
            tabIndex={-1}
          />
        )}

      <div
        ref={dialogRef}
        className={`music-morph-card ${track.coverSrc ? "music-tile--cover" : ""} ${accentClass(track.accent)}`}
        role={isMini ? "region" : "dialog"}
        aria-modal={isExpanded ? "true" : undefined}
        aria-label={heading}
        data-expanded={isExpanded ? "true" : "false"}
        data-mini={isMini ? "true" : "false"}
        style={cardStyle}
        onKeyDown={handleCardKeyDown}
        onClick={isMini ? handleMiniClick : undefined}
      >
        {track.coverSrc ? (
          <div
            className="music-tile-cover-wrap music-morph-cover"
            aria-hidden
            style={{ backgroundImage: `url("${withBasePath(track.coverSrc)}")` }}
          />
        ) : null}

        {isExpanded && (
          <button
            ref={minimizeRef}
            type="button"
            className="intro-chrome-icon-btn intro-expanded-minimize"
            aria-label={`Minimize ${heading}`}
            onClick={handleMinimize}
            tabIndex={0}
          >
            <MinimizeIcon />
          </button>
        )}

        {isMini && (
          <button
            ref={closeRef}
            type="button"
            className="intro-chrome-icon-btn music-mini-close"
            aria-label={`Stop ${heading}`}
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            tabIndex={0}
          >
            <CloseIcon />
          </button>
        )}

        <div className="music-morph-collapsed" aria-hidden>
          {track.coverSrc ? null : (
            <>
              <div
                className="music-tile-orb"
                style={{ backgroundColor: "var(--tile-accent)" }}
              />
              <span
                className="text-label mb-3 relative z-[2]"
                style={{ color: "var(--tile-accent)" }}
              >
                {track.subtitle}
              </span>
              <h2 className="text-h2 m-0 mb-2 relative z-[2] text-[var(--color-text-primary)]">
                {track.title}
              </h2>
              <p className="text-body-sm m-0 relative z-[2] text-[var(--color-text-secondary)]">
                {track.description}
              </p>
            </>
          )}
        </div>

        <div className="music-morph-body">
          <div className="music-morph-player">
            {embedSrc ? (
              <iframe
                ref={iframeRef}
                key={track.youtubeId}
                src={embedSrc}
                title={iframeTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={() => {
                  iframeReadyRef.current = true;
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
      </div>

      {/* Mobile music control button */}
      {isMini && (
        <button
          type="button"
          className="mobile-music-button"
          aria-label={isYouTubePlaying ? "Pause music" : "Play music"}
          onClick={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
          data-playing={isYouTubePlaying ? "true" : "false"}
        >
          {isYouTubePlaying ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.5 11.5L9.5 12.5C9.5 13.6046 10.3954 14.5 11.5 14.5L12.5 14.5C13.6046 14.5 14.5 13.6046 14.5 12.5L14.5 11.5C14.5 10.3954 13.6046 9.5 12.5 9.5L11.5 9.5C10.3954 9.5 9.5 10.3954 9.5 11.5Z" />
              <path d="M10 8C10 7.44772 10.4477 7 11 7L13 7C13.5523 7 14 7.44772 14 8L14 16C14 16.5523 13.5523 17 13 17L11 17C10.4477 17 10 16.5523 10 16L10 8Z" fill="currentColor" />
            </svg>
          )}
        </button>
      )}
    </>,
    document.body,
  );
}
