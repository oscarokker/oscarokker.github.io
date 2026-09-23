"use client";

import { ExpandIcon } from "@/components/ChromeIcons";
import { BeatLabTileExpanded } from "@/components/tiles/BeatLabTileExpanded";
import { useTileExpand } from "@/hooks/useTileExpand";
import { accentClass } from "@/lib/accent";
import { TEASER_NOTATION } from "@/lib/beat-lab/compositions";

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
    handleKeyDown,
  } = useTileExpand();

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
        onClick={mounted ? undefined : open}
        onKeyDown={mounted ? undefined : handleKeyDown}
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

      {mounted && sourceRect && (
        <BeatLabTileExpanded
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
