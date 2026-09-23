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
import { BeatLabEngine } from "@/lib/beat-lab/engine";
import {
  BEAT_PATTERNS,
  DEFAULT_BPM,
  MAX_BPM,
  MIN_BPM,
  STEP_COUNT,
  type BeatId,
  type BeatPattern,
  cloneSteps,
  patternById,
} from "@/lib/beat-lab/patterns";
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

function initialStepMap(): Record<BeatId, boolean[]> {
  const map = {} as Record<BeatId, boolean[]>;
  for (const pattern of BEAT_PATTERNS) {
    map[pattern.id] = cloneSteps(pattern.steps);
  }
  return map;
}

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const exitDone = useRef(false);
  const hasOpened = useRef(false);
  const morphRectRef = useRef<MorphRect>(sourceRect);
  const expandedRef = useRef(false);
  const phaseRef = useRef<"enter" | "open" | "exit">("enter");
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const engineRef = useRef<BeatLabEngine | null>(null);

  const [activeBeat, setActiveBeat] = useState<BeatId>("kick");
  const [stepMap, setStepMap] = useState<Record<BeatId, boolean[]>>(initialStepMap);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [toneReady, setToneReady] = useState(false);
  const [playBusy, setPlayBusy] = useState(false);
  const [patternOpen, setPatternOpen] = useState(false);
  const activePattern: BeatPattern = patternById(activeBeat);
  const steps = stepMap[activeBeat] ?? activePattern.steps;

  const ensureEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new BeatLabEngine();
    }
    return engineRef.current;
  }, []);

  const syncEnginePattern = useCallback(
    (beat: BeatId, nextSteps: boolean[]) => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.setBeat(patternById(beat), nextSteps);
    },
    [],
  );

  const teardownAudio = useCallback(async () => {
    setPlaying(false);
    const engine = engineRef.current;
    if (!engine) return;
    engine.stop();
    await engine.teardown();
  }, []);

  // Preload Tone on first expand (not homepage critical path). No sound.
  useEffect(() => {
    let cancelled = false;
    const engine = ensureEngine();
    engine
      .preload()
      .then(() => {
        if (!cancelled) setToneReady(true);
      })
      .catch(() => {
        /* Tone failed to load — Play will surface busy/disabled state */
      });
    syncEnginePattern(activeBeat, stepMap[activeBeat] ?? patternById(activeBeat).steps);
    engine.setTempo(bpm);
    engine.setMuted(muted);

    return () => {
      cancelled = true;
    };
    // Only on mount of expanded portal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hard teardown on close / unmount.
  useEffect(() => {
    return () => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.markDisposed();
      void engine.teardown();
      engineRef.current = null;
    };
  }, []);

  // Visibility / tab hidden → stop + suspend (no ghost audio).
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
      void teardownAudio();
    }
  }, [visible, teardownAudio]);

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
      window.requestAnimationFrame(() => { (playRef.current ?? closeRef.current)?.focus(); });
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
        playRef.current?.focus();
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

  const handlePlay = useCallback(async () => {
    if (playBusy) return;
    setPlayBusy(true);
    try {
      const engine = ensureEngine();
      syncEnginePattern(activeBeat, steps);
      engine.setTempo(bpm);
      engine.setMuted(muted);
      await engine.play();
      setPlaying(true);
      setToneReady(true);
    } catch {
      setPlaying(false);
    } finally {
      setPlayBusy(false);
    }
  }, [
    playBusy,
    ensureEngine,
    syncEnginePattern,
    activeBeat,
    steps,
    bpm,
    muted,
  ]);

  const handleStop = useCallback(() => {
    const engine = engineRef.current;
    engine?.stop();
    setPlaying(false);
  }, []);

  const handleMuteToggle = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      engineRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const handleBeatSelect = useCallback(
    (id: BeatId) => {
      setActiveBeat(id);
      const nextSteps = stepMap[id] ?? cloneSteps(patternById(id).steps);
      syncEnginePattern(id, nextSteps);
      setPatternOpen(false);
      },
    [stepMap, syncEnginePattern],
  );

  const handleStepToggle = useCallback(
    (index: number) => {
      setStepMap((prev) => {
        const current = prev[activeBeat] ?? cloneSteps(patternById(activeBeat).steps);
        const next = current.slice();
        next[index] = !next[index];
        syncEnginePattern(activeBeat, next);
        return { ...prev, [activeBeat]: next };
      });
    },
    [activeBeat, syncEnginePattern],
  );

  const handleBpmChange = useCallback((value: number) => {
    const clamped = Math.min(MAX_BPM, Math.max(MIN_BPM, value));
    setBpm(clamped);
    engineRef.current?.setTempo(clamped);
  }, []);

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

        <div className="beat-lab-morph-body">
          <header className="beat-lab-toolbar">
            <div className="beat-lab-toolbar-copy">
              <h2 id={titleId} className="text-h2 m-0 beat-lab-expanded-title">
                {title}
              </h2>
              <p className="text-body-sm m-0 beat-lab-expanded-desc">{description}</p>
            </div>

            <div className="beat-lab-toolbar-actions" role="group" aria-label="Transport">
              <button
                ref={playRef}
                type="button"
                className="beat-lab-btn beat-lab-btn--primary"
                onClick={handlePlay}
                disabled={playBusy}
                aria-pressed={playing}
                aria-label={playing ? "Playing — restart beat" : "Play beat"}
              >
                {playBusy ? "…" : playing ? "Playing" : "Play"}
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
                type="button"
                className="beat-lab-btn"
                onClick={handleStop}
                aria-label="Stop"
              >
                Stop
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
            aria-label="Beats"
          >
            {BEAT_PATTERNS.map((pattern) => {
              const selected = pattern.id === activeBeat;
              return (
                <button
                  key={pattern.id}
                  type="button"
                  role="tab"
                  id={`beat-lab-tab-${pattern.id}`}
                  aria-selected={selected}
                  aria-controls="beat-lab-sequencer-panel"
                  tabIndex={selected ? 0 : -1}
                  className={`beat-lab-tab${selected ? " is-active" : ""}`}
                  onClick={() => handleBeatSelect(pattern.id)}
                >
                  {pattern.name}
                </button>
              );
            })}
          </div>

          <div
            id="beat-lab-sequencer-panel"
            role="tabpanel"
            aria-labelledby={`beat-lab-tab-${activeBeat}`}
            className="beat-lab-panel"
          >
            <div
              className="beat-lab-sequencer"
              role="group"
              aria-label={`${activePattern.name} step sequencer`}
            >
              {Array.from({ length: STEP_COUNT }, (_, index) => {
                const on = Boolean(steps[index]);
                return (
                  <button
                    key={index}
                    type="button"
                    className={["beat-lab-step", on ? "is-on" : ""]
                      .filter(Boolean)
                      .join(" ")}
                    aria-pressed={on}
                    aria-label={`Step ${index + 1}${on ? ", on" : ", off"}`}
                    onClick={() => handleStepToggle(index)}
                  />
                );
              })}
            </div>

            <div className="beat-lab-tempo">
              <label className="beat-lab-tempo-label" htmlFor="beat-lab-tempo">
                Tempo
              </label>
              <input
                id="beat-lab-tempo"
                className="beat-lab-tempo-range"
                type="range"
                min={MIN_BPM}
                max={MAX_BPM}
                step={1}
                value={bpm}
                onChange={(event) => handleBpmChange(Number(event.target.value))}
                aria-valuemin={MIN_BPM}
                aria-valuemax={MAX_BPM}
                aria-valuenow={bpm}
                aria-valuetext={`${bpm} beats per minute`}
              />
              <span className="beat-lab-tempo-value" aria-hidden>
                {bpm}
              </span>
            </div>

            <details
              className="beat-lab-pattern"
              open={patternOpen}
              onToggle={(event) =>
                setPatternOpen((event.target as HTMLDetailsElement).open)
              }
            >
              <summary className="beat-lab-pattern-summary">View pattern</summary>
              <pre className="beat-lab-pattern-code" tabIndex={0}>
                {activePattern.snippet}
              </pre>
            </details>

            {!toneReady && (
              <p className="text-body-sm m-0 beat-lab-status" aria-live="polite">
                Loading audio engine…
              </p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
