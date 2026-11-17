"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { ExpandIcon } from "@/components/ChromeIcons";
import { useTileExpand } from "@/hooks/useTileExpand";
import { accentClass } from "@/lib/accent";
import {
  loadBeatLabExpanded,
  prefetchBeatLabExpanded,
  type BeatLabExpandedComponent,
} from "@/lib/beat-lab/load-expanded";
import { TEASER_NOTATION } from "@/lib/beat-lab/teaser";

interface BeatLabTileProps {
  title: string;
  description: string;
  accent?: string;
}

export function BeatLabTile({ title, description, accent }: BeatLabTileProps) {
  const {
    tileRef,
    mounted,
    visible,
    sourceRect,
    measureSourceRect,
    open,
    close,
    handleMorphReady,
    handleExitComplete,
  } = useTileExpand();
  const [Expanded, setExpanded] = useState<BeatLabExpandedComponent | null>(
    null,
  );
  const expandedRef = useRef<BeatLabExpandedComponent | null>(null);
  const openGenerationRef = useRef(0);
  const aliveRef = useRef(true);

  const cacheExpanded = useCallback((Comp: BeatLabExpandedComponent) => {
    expandedRef.current = Comp;
    setExpanded(() => Comp);
  }, []);

  const prefetch = useCallback(() => {
    prefetchBeatLabExpanded();
    void loadBeatLabExpanded()
      .then((Comp) => {
        if (!aliveRef.current) return;
        cacheExpanded(Comp);
      })
      .catch(() => {
        /* next explicit open retries */
      });
  }, [cacheExpanded]);

  const requestOpen = useCallback(
    async (event?: ReactMouseEvent<HTMLElement>) => {
      const generation = ++openGenerationRef.current;
      try {
        const Comp = expandedRef.current ?? (await loadBeatLabExpanded());
        if (openGenerationRef.current !== generation) return;
        cacheExpanded(Comp);
        open(event);
      } catch {
        /* stay collapsed; next activate retries */
      }
    },
    [cacheExpanded, open],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        void requestOpen();
      }
    },
    [requestOpen],
  );

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      openGenerationRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (mounted) return;
    const onPointerDownCapture = (event: PointerEvent) => {
      const tile = tileRef.current;
      if (tile && event.target instanceof Node && tile.contains(event.target)) {
        return;
      }
      openGenerationRef.current += 1;
    };
    document.addEventListener("pointerdown", onPointerDownCapture, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
    };
  }, [mounted, tileRef]);

  return (
    <>
      <div
        ref={tileRef}
        className={`tile-card-inner beat-lab-tile beat-lab-tile--expandable ${accentClass(accent)} h-full`}
        role="button"
        tabIndex={mounted ? -1 : 0}
        aria-expanded={mounted}
        aria-haspopup="dialog"
        aria-label={`${title}. ${description} Activate to open.`}
        onClick={mounted ? undefined : () => void requestOpen()}
        onKeyDown={mounted ? undefined : onKeyDown}
        onPointerEnter={prefetch}
        onFocus={prefetch}
        onPointerDown={prefetch}
      >
        <span
          className="intro-chrome-icon-btn intro-tile-expand"
          aria-hidden="true"
        >
          <ExpandIcon />
        </span>

        <h2 className="text-h2 m-0 beat-lab-tile-title">{title}</h2>
        <p className="text-body-sm m-0 beat-lab-tile-desc">{description}</p>

        <div className="beat-lab-teaser" aria-hidden="true">
          <code className="beat-lab-teaser-code">{TEASER_NOTATION}</code>
        </div>
      </div>

      {mounted && sourceRect && Expanded && (
        <Expanded
          title={title}
          description={description}
          accent={accent}
          visible={visible}
          sourceRect={sourceRect}
          getSourceRect={measureSourceRect}
          onClose={close}
          onExitComplete={handleExitComplete}
          onMorphReady={handleMorphReady}
        />
      )}
    </>
  );
}
