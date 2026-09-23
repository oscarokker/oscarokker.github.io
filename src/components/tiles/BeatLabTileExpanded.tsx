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
  type TransitionEvent as ReactTransitionEvent,
} from "react";
import { createPortal } from "react-dom";
import { MinimizeIcon } from "@/components/ChromeIcons";
import { accentClass } from "@/lib/accent";
import {
  COMPOSITIONS,
  compositionById,
  initialSourceMap,
  type CompositionId,
} from "@/lib/beat-lab/compositions";
import {
  ensureStrudel,
  evaluateCode,
  hush,
  setMuted,
  teardown,
} from "@/lib/beat-lab/engine";
import { lockBodyScroll } from "@/lib/lockBodyScroll";

export interface BeatLabSourceRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface BeatLabTileExpandedProps {
  title: string;
  description: string;
  accent?: string;
  visible: boolean;
  sourceRect: BeatLabSourceRect;
  getSourceRect: () => BeatLabSourceRect | null;
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

function getExpandedTargetWidth(padding: number): number {
  return Math.min(window.innerWidth * 0.8, window.innerWidth - padding * 2);
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
  void card.offsetHeight;

  return { top, left, width, height };
}

const ERROR_HINT = "Couldn't run this pattern — check the code and try Update.";

export function BeatLabTileExpanded({
  title,
  description,
  accent,
  visible,
  sourceRect,
  getSourceRect,
  onClose,
  onExitComplete,
  onMorphReady,
}: BeatLabTileExpandedProps) {
  const titleId = useId();
  const editorId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const morphBodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const exitDone = useRef(false);
  const hasOpened = useRef(false);
  const morphRectRef = useRef<MorphRect>(sourceRect);
  const expandedRef = useRef(false);
  const phaseRef = useRef<"enter" | "open" | "exit">("enter");
  const visibleRef = useRef(visible);
  const playingRef = useRef(false);
  const editorValueRef = useRef("");
  const activeIdRef = useRef<CompositionId>("house");
  const sourceMapRef = useRef<Record<CompositionId, string>>(initialSourceMap());

  const [activeId, setActiveId] = useState<CompositionId>("house");
  const [sourceMap, setSourceMap] = useState(() => initialSourceMap());
  const [editorValue, setEditorValue] = useState(
    () => initialSourceMap().house,
  );
  const [playing, setPlaying] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(() => {
    editorValueRef.current = editorValue;
  }, [editorValue]);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);
  useEffect(() => {
    sourceMapRef.current = sourceMap;
  }, [sourceMap]);

  const teardownAudio = useCallback(async () => {
    setPlaying(false);
    setError(null);
    await teardown();
  }, []);

  // Preload Strudel on first expand (not homepage critical path). No sound.
  useEffect(() => {
    let cancelled = false;
    ensureStrudel()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        /* Play surfaces failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Hard teardown on unmount.
  useEffect(() => {
    return () => {
      void teardown();
    };
  }, []);

  // Visibility / tab hidden → hush (no ghost audio).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void teardownAudio();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [teardownAudio]);

  // Stop audio as soon as close begins (before morph exit finishes).
  useEffect(() => {
    if (!visible) {
      // Intentional lifecycle teardown (matches prior Tone island).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hush + clear playing on close
      void teardownAudio();
    }
  }, [visible, teardownAudio]);

  const scrollExpandedPanelToTop = useCallback(() => {
    morphBodyRef.current?.scrollTo(0, 0);
  }, []);

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
      const target = measureExpandedTarget(card);
      applyRect(target, true);
      phaseRef.current = "open";
      hasOpened.current = true;
      window.requestAnimationFrame(() => {
        scrollExpandedPanelToTop();
        (playRef.current ?? closeRef.current)?.focus({ preventScroll: true });
      });
      return;
    }

    const target = measureExpandedTarget(card);
    applyRect(sourceRect, false);

    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        if (!visibleRef.current || phaseRef.current === "exit") return;
        card.style.transition = "";
        applyRect(target, true);
        phaseRef.current = "open";
        hasOpened.current = true;
        scrollExpandedPanelToTop();
        playRef.current?.focus({ preventScroll: true });
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [applyRect, onMorphReady, scrollExpandedPanelToTop, sourceRect]);

  useEffect(() => {
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
  }, [applyRect]);

  useEffect(() => lockBodyScroll(), []);

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

    const timeout = window.setTimeout(finishExit, 560);
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
      if (
        event.propertyName !== "top" &&
        event.propertyName !== "width" &&
        event.propertyName !== "height" &&
        event.propertyName !== "left"
      ) {
        return;
      }
      if (phaseRef.current === "open" && expandedRef.current) {
        scrollExpandedPanelToTop();
        return;
      }
      if (phaseRef.current !== "exit") return;
      finishExit();
    },
    [finishExit, scrollExpandedPanelToTop],
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


  const runEvaluate = useCallback(async (code: string) => {
    setBusy(true);
    setError(null);
    try {
      await evaluateCode(code);
      setPlaying(true);
      setReady(true);
    } catch {
      setError(ERROR_HINT);
    } finally {
      setBusy(false);
    }
  }, []);

  const handlePlay = useCallback(async () => {
    if (busy) return;
    setSourceMap((prev) => ({ ...prev, [activeId]: editorValue }));
    await runEvaluate(editorValue);
  }, [busy, activeId, editorValue, runEvaluate]);

  const handleUpdate = useCallback(async () => {
    if (busy || !playing) return;
    setSourceMap((prev) => ({ ...prev, [activeId]: editorValue }));
    await runEvaluate(editorValue);
  }, [busy, playing, activeId, editorValue, runEvaluate]);

  const handleStop = useCallback(() => {
    hush();
    setPlaying(false);
    setError(null);
  }, []);

  const handleMuteToggle = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      void setMuted(next);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    const authored = compositionById(activeId).source;
    setEditorValue(authored);
    setSourceMap((prev) => ({ ...prev, [activeId]: authored }));
    setError(null);
    if (playingRef.current) {
      void runEvaluate(authored);
    }
  }, [activeId, runEvaluate]);

  const handleTabSelect = useCallback(
    (id: CompositionId) => {
      if (id === activeIdRef.current) return;
      const leaving = activeIdRef.current;
      const leavingCode = editorValueRef.current;
      const nextMap = {
        ...sourceMapRef.current,
        [leaving]: leavingCode,
      };
      setSourceMap(nextMap);
      const nextCode = nextMap[id] ?? compositionById(id).source;
      setActiveId(id);
      setEditorValue(nextCode);
      setError(null);
      if (playingRef.current) {
        void runEvaluate(nextCode);
      }
    },
    [runEvaluate],
  );

  // Ctrl/Cmd+Enter = Play/Update, Ctrl/Cmd+. = Stop (Esc handled below).
  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key === "Enter") {
        event.preventDefault();
        if (playingRef.current) {
          void handleUpdate();
        } else {
          void handlePlay();
        }
        return;
      }

      if (mod && event.key === ".") {
        event.preventDefault();
        handleStop();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, handlePlay, handleUpdate, handleStop]);

  const cardStyle: CSSProperties = {
    top: sourceRect.top,
    left: sourceRect.left,
    width: sourceRect.width,
    height: sourceRect.height,
  };

  return createPortal(
    <div
      className="intro-expanded-root beat-lab-expanded-root"
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
        className={`beat-lab-morph-card ${accentClass(accent)}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-expanded="false"
        style={cardStyle}
        onKeyDown={handleCardKeyDown}
        onTransitionEnd={handleTransitionEnd}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="beat-lab-morph-collapsed" aria-hidden>
          <span className="text-label beat-lab-tile-kicker">Beat lab</span>
          <h2 className="text-h2 m-0 beat-lab-tile-title">{title}</h2>
        </div>

        <div ref={morphBodyRef} className="beat-lab-morph-body">
          <header className="beat-lab-toolbar">
            <div className="beat-lab-toolbar-copy">
              <h2 id={titleId} className="text-h2 m-0 beat-lab-expanded-title">
                Beat lab · Strudel
              </h2>
              <p className="text-body-sm m-0 beat-lab-expanded-desc">
                {description}
              </p>
            </div>

            <div
              className="beat-lab-toolbar-actions"
              role="group"
              aria-label="Transport"
            >
              <button
                ref={playRef}
                type="button"
                className="beat-lab-btn beat-lab-btn--primary"
                onClick={handlePlay}
                disabled={busy}
                aria-pressed={playing}
                aria-label={playing ? "Playing — restart pattern" : "Play"}
              >
                {busy ? "…" : playing ? "Playing" : "Play"}
              </button>
              <button
                type="button"
                className="beat-lab-btn"
                onClick={handleUpdate}
                disabled={busy || !playing}
                aria-label="Update — re-evaluate editor while playing"
              >
                Update
              </button>
              <button
                type="button"
                className="beat-lab-btn"
                onClick={handleStop}
                aria-label="Stop"
              >
                Stop
              </button>
              <button
                type="button"
                className="beat-lab-btn"
                onClick={handleMuteToggle}
                aria-pressed={muted}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? "Unmute" : "Mute"}
              </button>
              <button
                ref={closeRef}
                type="button"
                className="intro-chrome-icon-btn intro-expanded-minimize beat-lab-close"
                aria-label={`Close ${title}`}
                onClick={onClose}
                tabIndex={visible ? 0 : -1}
              >
                <MinimizeIcon />
              </button>
            </div>
          </header>

          <div
            className="beat-lab-tabs"
            role="tablist"
            aria-label="Compositions"
          >
            {COMPOSITIONS.map((composition) => {
              const selected = composition.id === activeId;
              return (
                <button
                  key={composition.id}
                  type="button"
                  role="tab"
                  id={`beat-lab-tab-${composition.id}`}
                  aria-selected={selected}
                  aria-controls="beat-lab-editor-panel"
                  tabIndex={selected ? 0 : -1}
                  className={`beat-lab-tab${selected ? " is-active" : ""}`}
                  onClick={() => handleTabSelect(composition.id)}
                >
                  {composition.name}
                </button>
              );
            })}
          </div>

          <div
            id="beat-lab-editor-panel"
            role="tabpanel"
            aria-labelledby={`beat-lab-tab-${activeId}`}
            className="beat-lab-panel"
          >
            <label className="beat-lab-editor-label" htmlFor={editorId}>
              {compositionById(activeId).name} pattern
            </label>
            <textarea
              ref={editorRef}
              id={editorId}
              className="beat-lab-editor"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              value={editorValue}
              onChange={(event) => {
                setEditorValue(event.target.value);
                setError(null);
              }}
              aria-describedby={
                error
                  ? "beat-lab-error"
                  : "beat-lab-shortcuts beat-lab-helpers"
              }
            />

            <div
              className={`beat-lab-cycle${playing && !muted ? " is-playing" : ""}`}
              aria-hidden
            />

            {error ? (
              <p
                id="beat-lab-error"
                className="text-body-sm m-0 beat-lab-error"
                role="status"
              >
                {error}
              </p>
            ) : null}

            <div className="beat-lab-editor-footer">
              <p
                id="beat-lab-shortcuts"
                className="text-body-sm m-0 beat-lab-shortcuts"
              >
                Ctrl/⌘+Enter play or update · Ctrl/⌘+. stop
              </p>
              <button
                type="button"
                className="beat-lab-btn beat-lab-btn--ghost"
                onClick={handleReset}
              >
                Reset composition
              </button>
            </div>

            <div id="beat-lab-helpers" className="beat-lab-helpers">
              <p className="text-body-sm m-0 beat-lab-helpers-lead">
                Mini-notation cheat sheet
              </p>
              <ul className="beat-lab-chips" aria-label="Mini-notation symbols">
                <li>
                  <span className="beat-lab-chip">
                    <code>Space</code> = sequence
                  </span>
                </li>
                <li>
                  <span className="beat-lab-chip">
                    <code>*</code> = faster
                  </span>
                </li>
                <li>
                  <span className="beat-lab-chip">
                    <code>~/−</code> = rest
                  </span>
                </li>
                <li>
                  <span className="beat-lab-chip">
                    <code>,</code> = parallel
                  </span>
                </li>
              </ul>
              <a
                className="beat-lab-workshop-link"
                href="https://strudel.cc/workshop/first-sounds/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more on strudel.cc
              </a>
            </div>

            <p className="text-body-sm m-0 beat-lab-credit">
              Built with Strudel (AGPL) · patterns by Oscar Rode
            </p>

            {!ready ? (
              <p className="text-body-sm m-0 beat-lab-status" aria-live="polite">
                Loading Strudel…
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
