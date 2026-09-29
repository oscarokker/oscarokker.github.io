"use client";

import { useMemo } from "react";
import type { SongSection } from "@/lib/beat-lab/sections";

interface BeatLabSectionTimelineProps {
  sections: SongSection[];
  sectionIndex: number;
  loopCurrent: number;
  loopTotal: number;
}

export function BeatLabSectionTimeline({
  sections,
  sectionIndex,
  loopCurrent,
  loopTotal,
}: BeatLabSectionTimelineProps) {
  const totalLoops = useMemo(
    () => sections.reduce((sum, s) => sum + s.loops, 0),
    [sections],
  );

  const progressUnits = useMemo(() => {
    let before = 0;
    for (let i = 0; i < sectionIndex; i++) {
      before += sections[i]?.loops ?? 0;
    }
    const section = sections[sectionIndex];
    const inSection =
      section && loopTotal > 0
        ? Math.min(loopCurrent / loopTotal, 1) * section.loops
        : 0;
    return before + inSection;
  }, [sections, sectionIndex, loopCurrent, loopTotal]);

  const fillPct =
    totalLoops > 0 ? Math.min(100, (progressUnits / totalLoops) * 100) : 0;

  return (
    <div
      className="beat-lab-timeline"
      role="group"
      aria-label="Song sections (read-only, auto-advance)"
    >
      <div className="beat-lab-timeline-track">
        <div
          className="beat-lab-timeline-fill"
          style={{ width: `${fillPct}%` }}
          aria-hidden
        />
        <div className="beat-lab-timeline-segments">
          {sections.map((section, index) => {
            const flex = section.loops;
            const active = index === sectionIndex;
            return (
              <div
                key={`${section.id}-${index}`}
                className={`beat-lab-timeline-segment${active ? " is-active" : ""}`}
                style={{ flexGrow: flex, flexBasis: 0 }}
              >
                <span className="beat-lab-timeline-label">{section.label}</span>
              </div>
            );
          })}
        </div>
        <div
          className="beat-lab-timeline-playhead"
          style={{ left: `${fillPct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
