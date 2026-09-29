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
import {
  MinimizeIcon,
  VolumeOffIcon,
  VolumeOnIcon,
} from "@/components/ChromeIcons";
import { BeatLabCodeEditor } from "@/components/tiles/beat-lab/BeatLabCodeEditor";
import { BeatLabSectionTimeline } from "@/components/tiles/beat-lab/BeatLabSectionTimeline";
import { BeatLabWorldBackground } from "@/components/tiles/beat-lab/BeatLabWorldBackground";
import { accentClass } from "@/lib/accent";
import {
  COMPOSITIONS,
  type CompositionId,
} from "@/lib/beat-lab/compositions";
import { ensureJetBrainsMono } from "@/lib/beat-lab/load-jetbrains-mono";
import { WORLDS, worldById } from "@/lib/beat-lab/worlds";
import {
  ensureStrudel,
  evaluateCode,
  getTransportCycle,
  setMuted,
  teardown,
} from "@/lib/beat-lab/engine";
import { applyGhostRewrite, shouldAdvanceSection } from "@/lib/beat-lab/ghost-writer";
import {
  commitSectionEdit,
  effectiveSectionSource,
  loadPersistedSectionEdits,
  type SectionEditMap,
} from "@/lib/beat-lab/session-edits";
import {
  defaultSectionSource,
  sectionsFor,
  type SectionId,
  type SongSection,
} from "@/lib/beat-lab/sections";
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
  return Math.min(window.innerWidth * 0.92, 1120, window.innerWidth - padding * 2);
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
  const height = Math.min(Math.max(card.scrollHeight, 520), maxHeight);
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

const ERROR_HINT =
  "Couldn't run this pattern — check the code and press Ctrl/⌘+Enter.";

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
  const muteRef = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const livingSessionRef = useRef(false);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const exitDone = useRef(false);
  const hasOpened = useRef(false);
  const morphRectRef = useRef<MorphRect>(sourceRect);
  const expandedRef = useRef(false);
  const phaseRef = useRef<"enter" | "open" | "exit">("enter");
  const visibleRef = useRef(visible);
  const playingRef = useRef(false);
  const editorValueRef = useRef("");
  const activeIdRef = useRef<CompositionId>("neo-trance");
  const sectionIndexRef = useRef(0);
  const sectionStartCycleRef = useRef(0);
  const committedSourceRef = useRef("");
  const ghostApplyRef = useRef(false);
  const transportTimerRef = useRef(0);

  const [activeId, setActiveId] = useState<CompositionId>("neo-trance");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [sectionEdits, setSectionEdits] = useState<SectionEditMap>(() =>
    loadPersistedSectionEdits(),
  );
  const [editorValue, setEditorValue] = useState(() =>
    effectiveSectionSource(
      "neo-trance",
      "intro",
      defaultSectionSource,
      loadPersistedSectionEdits(),
    ),
  );
  const [playing, setPlaying] = useState(false);
  /** Default muted so expand can auto-start under autoplay policies; unmute is explicit. */
  const [muted, setMutedState] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loopInSection, setLoopInSection] = useState({ current: 0, total: 6 });
  const [ghostCue, setGhostCue] = useState<string | null>(null);
  const [pendingGhostSection, setPendingGhostSection] = useState<number | null>(
    null,
  );
  const [sectionHasUserEdit, setSectionHasUserEdit] = useState(false);
  const sectionEditsRef = useRef<SectionEditMap>(sectionEdits);

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
    sectionIndexRef.current = sectionIndex;
  }, [sectionIndex]);
  useEffect(() => {
    sectionEditsRef.current = sectionEdits;
  }, [sectionEdits]);
  const currentSection = (): SongSection =>
    sectionsFor(activeIdRef.current)[sectionIndexRef.current] ??
    sectionsFor(activeIdRef.current)[0];

  const resolveSectionSource = useCallback(
    (compositionId: CompositionId, sectionId: SectionId) =>
      effectiveSectionSource(
        compositionId,
        sectionId,
        defaultSectionSource,
        sectionEditsRef.current,
      ),
    [],
  );

  const syncUserEditFlag = useCallback(
    (compositionId: CompositionId, sectionId: SectionId) => {
      const key = `${compositionId}:${sectionId}`;
      setSectionHasUserEdit(Boolean(sectionEditsRef.current[key]));
    },
    [],
  );

  useEffect(() => {
    const section = currentSection();
    syncUserEditFlag(activeId, section.id);
    setLoopInSection({ current: 0, total: section.loops });
  }, [activeId, sectionIndex, syncUserEditFlag]);

  const teardownAudio = useCallback(async () => {
    setPlaying(false);
    setError(null);
    await teardown();
  }, []);

  // Preload Strudel + JetBrains Mono on first expand (not homepage critical path).
  useEffect(() => {
    let cancelled = false;
    void ensureJetBrainsMono();
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
        (muteRef.current ?? closeRef.current)?.focus({ preventScroll: true });
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
        muteRef.current?.focus({ preventScroll: true });
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


  const isEditorDirty = useCallback(() => {
    return editorValueRef.current !== committedSourceRef.current;
  }, []);

  const runEvaluate = useCallback(
    async (code: string, options?: { hushBeforeEval?: boolean }) => {
      setBusy(true);
      setError(null);
      try {
        await evaluateCode(code, {
          hushBeforeEval: options?.hushBeforeEval ?? true,
        });
        setPlaying(true);
        setReady(true);
      } catch {
        setError(ERROR_HINT);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const writeEditorFromGhost = useCallback(
    async (source: string, sectionLabel: string) => {
      if (ghostApplyRef.current) return;
      ghostApplyRef.current = true;
      setGhostCue(`Ghost · ${sectionLabel}`);
      try {
        await applyGhostRewrite(
          source,
          (value) => {
            setEditorValue(value);
            editorValueRef.current = value;
          },
          { reducedMotion: prefersReducedMotion() },
        );
        committedSourceRef.current = source;
      } finally {
        ghostApplyRef.current = false;
        window.setTimeout(() => setGhostCue(null), 2400);
      }
    },
    [],
  );

  const applyPendingGhostIfAny = useCallback(async () => {
    if (pendingGhostSection === null) return;
    const sections = sectionsFor(activeIdRef.current);
    const section = sections[pendingGhostSection];
    if (!section) {
      setPendingGhostSection(null);
      return;
    }
    const source = resolveSectionSource(activeIdRef.current, section.id);
    setPendingGhostSection(null);
    setGhostCue(null);
    await writeEditorFromGhost(source, section.label);
  }, [pendingGhostSection, resolveSectionSource, writeEditorFromGhost]);

  const advanceToSection = useCallback(
    async (nextIndex: number, options?: { skipEditor?: boolean }) => {
      const compositionId = activeIdRef.current;
      const sections = sectionsFor(compositionId);
      const section = sections[nextIndex];
      if (!section) return;

      const source = resolveSectionSource(compositionId, section.id);
      sectionStartCycleRef.current = await getTransportCycle();
      setSectionIndex(nextIndex);
      setLoopInSection({ current: 0, total: section.loops });
      syncUserEditFlag(compositionId, section.id);

      await runEvaluate(source, { hushBeforeEval: false });

      if (options?.skipEditor) return;

      // Defer editor rewrite whenever the buffer differs from the last ghost commit.
      if (isEditorDirty()) {
        setPendingGhostSection(nextIndex);
        setGhostCue(`Ghost waiting · ${section.label}`);
        return;
      }
      await writeEditorFromGhost(source, section.label);
    },
    [
      isEditorDirty,
      resolveSectionSource,
      runEvaluate,
      syncUserEditFlag,
      writeEditorFromGhost,
    ],
  );

  useEffect(() => {
    if (!playing) {
      if (transportTimerRef.current) {
        window.clearTimeout(transportTimerRef.current);
        transportTimerRef.current = 0;
      }
      return;
    }

    let cancelled = false;

    const tick = async () => {
      if (cancelled || !playingRef.current) return;
      const sections = sectionsFor(activeIdRef.current);
      const idx = sectionIndexRef.current;
      const section = sections[idx];
      if (!section) return;

      const now = await getTransportCycle();
      const completed = Math.max(
        0,
        Math.floor(now - sectionStartCycleRef.current),
      );
      setLoopInSection({
        current: Math.min(completed, section.loops),
        total: section.loops,
      });

      if (
        shouldAdvanceSection(
          now,
          sectionStartCycleRef.current,
          section.loops,
        )
      ) {
        const nextIdx = (idx + 1) % sections.length;
        await advanceToSection(nextIdx);
      }

      if (!cancelled && playingRef.current) {
        transportTimerRef.current = window.setTimeout(tick, 140);
      }
    };

    transportTimerRef.current = window.setTimeout(tick, 140);
    return () => {
      cancelled = true;
      if (transportTimerRef.current) {
        window.clearTimeout(transportTimerRef.current);
        transportTimerRef.current = 0;
      }
    };
  }, [playing, advanceToSection]);

  const commitCurrentSection = useCallback((source: string) => {
    const section = currentSection();
    const next = commitSectionEdit(
      sectionEditsRef.current,
      activeIdRef.current,
      section.id,
      source,
    );
    setSectionEdits(next);
    committedSourceRef.current = source;
    setSectionHasUserEdit(true);
    setGhostCue("Your edit saved for this section");
    window.setTimeout(() => setGhostCue(null), 2800);
  }, []);

  const startLivingChannel = useCallback(async () => {
    if (busy) return;
    if (isEditorDirty()) {
      commitCurrentSection(editorValueRef.current);
    }
    const compositionId = activeIdRef.current;
    setSectionIndex(0);
    sectionIndexRef.current = 0;
    const section = sectionsFor(compositionId)[0];
    const code = resolveSectionSource(compositionId, section.id);
    await runEvaluate(code, { hushBeforeEval: true });
    sectionStartCycleRef.current = await getTransportCycle();
    setLoopInSection({ current: 0, total: section.loops });
    await writeEditorFromGhost(code, section.label);
  }, [
    busy,
    commitCurrentSection,
    isEditorDirty,
    resolveSectionSource,
    runEvaluate,
    writeEditorFromGhost,
  ]);

  // Visibility / tab hidden → hush (no ghost audio while backgrounded).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void teardownAudio();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [teardownAudio]);

  // Auto-start the living world on expand; teardown when leaving it.
  useEffect(() => {
    if (!visible) {
      livingSessionRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hush + clear playing on close
      void teardownAudio();
      return;
    }

    if (!ready || livingSessionRef.current) return;
    livingSessionRef.current = true;
    void (async () => {
      await setMuted(true);
      setMutedState(true);
      await startLivingChannel();
    })();
  }, [visible, ready, teardownAudio, startLivingChannel]);

  const handleUpdate = useCallback(async () => {
    if (busy || !livingSessionRef.current) return;
    commitCurrentSection(editorValue);
    setPendingGhostSection(null);
    setGhostCue(null);
    await runEvaluate(editorValue, { hushBeforeEval: false });
  }, [busy, editorValue, commitCurrentSection, runEvaluate]);

  const handleMuteToggle = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      void setMuted(next);
      return next;
    });
  }, []);

  const handleTabSelect = useCallback(
    (id: CompositionId) => {
      if (id === activeIdRef.current) return;
      const leavingSection = currentSection();
      let edits = sectionEditsRef.current;
      if (isEditorDirty()) {
        edits = commitSectionEdit(
          edits,
          activeIdRef.current,
          leavingSection.id,
          editorValueRef.current,
        );
        setSectionEdits(edits);
      }
      setActiveId(id);
      setSectionIndex(0);
      sectionIndexRef.current = 0;
      const section = sectionsFor(id)[0];
      const nextCode = effectiveSectionSource(
        id,
        section.id,
        defaultSectionSource,
        edits,
      );
      setEditorValue(nextCode);
      editorValueRef.current = nextCode;
      committedSourceRef.current = nextCode;
      syncUserEditFlag(id, section.id);
      setLoopInSection({ current: 0, total: section.loops });
      setPendingGhostSection(null);
      setGhostCue(null);
      setError(null);
      if (livingSessionRef.current) {
        void runEvaluate(nextCode, { hushBeforeEval: false }).then(async () => {
          sectionStartCycleRef.current = await getTransportCycle();
        });
      }
    },
    [isEditorDirty, runEvaluate, syncUserEditFlag],
  );

  // Ctrl/Cmd+Enter = commit co-creation while the channel plays.
  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key === "Enter") {
        event.preventDefault();
        void handleUpdate();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, handleUpdate]);

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
          <span className="text-label beat-lab-tile-kicker">Ghostlink</span>
          <h2 className="text-h2 m-0 beat-lab-tile-title">{title}</h2>
        </div>

        <div ref={morphBodyRef} className="beat-lab-morph-body">
          <h2 id={titleId} className="beat-lab-sr-only">
            {title}
          </h2>
          <p className="beat-lab-sr-only">{description}</p>

          <div
            className="beat-lab-shell"
            data-world={activeId}
            data-muted={muted ? "true" : "false"}
          >
            <BeatLabWorldBackground worldId={activeId} active={visible} />

            <div className="beat-lab-shell-hud">
              <header className="beat-lab-top-bar">
                <div
                  className="beat-lab-tabs"
                  role="tablist"
                  aria-label="Worlds"
                >
                  {WORLDS.map((world) => {
                    const selected = world.id === activeId;
                    const composition = COMPOSITIONS.find(
                      (c) => c.id === world.id,
                    );
                    if (!composition) return null;
                    return (
                      <button
                        key={world.id}
                        type="button"
                        role="tab"
                        id={`beat-lab-tab-${world.id}`}
                        aria-selected={selected}
                        aria-controls="beat-lab-editor-panel"
                        tabIndex={selected ? 0 : -1}
                        className={`beat-lab-tab${selected ? " is-active" : ""}`}
                        onClick={() => handleTabSelect(world.id)}
                      >
                        {world.label}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="beat-lab-top-actions"
                  role="group"
                  aria-label="Audio and minimize"
                >
                  <button
                    ref={muteRef}
                    type="button"
                    className="beat-lab-icon-btn"
                    onClick={handleMuteToggle}
                    aria-pressed={muted}
                    aria-label={
                      muted
                        ? "Unmute — hear the world"
                        : "Mute — the world keeps playing"
                    }
                  >
                    {muted ? <VolumeOffIcon /> : <VolumeOnIcon />}
                  </button>
                  <button
                    ref={closeRef}
                    type="button"
                    className="beat-lab-icon-btn beat-lab-close"
                    aria-label={`Close ${title}`}
                    onClick={onClose}
                    tabIndex={visible ? 0 : -1}
                  >
                    <MinimizeIcon />
                  </button>
                </div>
              </header>

              <div
                id="beat-lab-editor-panel"
                role="tabpanel"
                aria-labelledby={`beat-lab-tab-${activeId}`}
                className="beat-lab-main"
              >
                <div className="beat-lab-editor-col">
                  <label className="beat-lab-editor-label" htmlFor={editorId}>
                    {worldById(activeId).label} ·{" "}
                    {sectionsFor(activeId)[sectionIndex]?.label ?? "section"}
                  </label>

                  {ghostCue || sectionHasUserEdit ? (
                    <p
                      className="text-body-sm m-0 beat-lab-ghost-cue"
                      role="status"
                    >
                      {ghostCue ??
                        (sectionHasUserEdit
                          ? "Your edit remembered for this section"
                          : null)}
                    </p>
                  ) : null}

                  <BeatLabCodeEditor
                    id={editorId}
                    value={editorValue}
                    textareaRef={editorRef}
                    playing={playing}
                    muted={muted}
                    onChange={(next) => {
                      setEditorValue(next);
                      editorValueRef.current = next;
                      setError(null);
                    }}
                    onBlur={() => {
                      void applyPendingGhostIfAny();
                    }}
                    describedBy={
                      error ? "beat-lab-error beat-lab-shortcuts" : "beat-lab-shortcuts"
                    }
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

                  <p
                    id="beat-lab-shortcuts"
                    className="text-body-sm m-0 beat-lab-shortcuts"
                  >
                    Ctrl/⌘+Enter update · co-write with the ghost while the world plays
                    {playing ? (
                      <span className="beat-lab-loop-progress">
                        {" "}
                        · loop {loopInSection.current}/{loopInSection.total}
                      </span>
                    ) : ready ? (
                      <span className="beat-lab-loop-progress"> · tuning in…</span>
                    ) : null}
                  </p>

                  {!ready ? (
                    <p
                      className="text-body-sm m-0 beat-lab-status"
                      aria-live="polite"
                    >
                      Loading Strudel…
                    </p>
                  ) : null}

                  <p className="text-body-sm m-0 beat-lab-credit">
                    Strudel (AGPL) · patterns by Oscar Rode
                  </p>
                </div>

                <div className="beat-lab-world-mark" aria-hidden>
                  <span className="beat-lab-world-mark-line1">
                    {worldById(activeId).mark.line1}
                  </span>
                  {worldById(activeId).mark.line2 ? (
                    <span className="beat-lab-world-mark-line2">
                      {worldById(activeId).mark.line2}
                    </span>
                  ) : null}
                </div>
              </div>

              <BeatLabSectionTimeline
                sections={sectionsFor(activeId)}
                sectionIndex={sectionIndex}
                loopCurrent={loopInSection.current}
                loopTotal={loopInSection.total}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
