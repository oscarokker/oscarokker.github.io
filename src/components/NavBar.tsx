"use client";

import type { FilterCategory } from "@/lib/types";
import { filters } from "@/data/tiles";
import { useHoverThumb } from "@/hooks/useHoverThumb";
import { useSlidingThumb } from "@/hooks/useSlidingThumb";

interface NavBarProps {
  activeFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  visible?: boolean;
}

export function NavBar({
  activeFilter,
  onFilterChange,
  visible = true,
}: NavBarProps) {
  const { containerRef, thumb, thumbReady } = useSlidingThumb(activeFilter);
  const { hoverThumb, hoverVisible, hoverSnap } = useHoverThumb(
    containerRef,
    activeFilter,
  );

  return (
    <nav
      className="site-nav fixed top-4 left-1/2 z-50 pointer-events-auto"
      aria-label="Portfolio filters"
      data-visible={visible ? "true" : "false"}
      inert={!visible || undefined}
    >
      <div
        ref={containerRef}
        className="nav-pill"
        data-thumb-ready={thumbReady ? "true" : "false"}
        data-hover-visible={hoverVisible ? "true" : "false"}
        data-hover-snap={hoverSnap ? "true" : "false"}
      >
        <span
          className="nav-pill-hover-thumb"
          aria-hidden
          style={{
            transform: `translateX(${hoverThumb.x}px)`,
            width: hoverThumb.width,
          }}
        />
        <span
          className="nav-pill-thumb"
          aria-hidden
          style={{
            transform: `translateX(${thumb.x}px)`,
            width: thumb.width,
          }}
        >
          <span className="nav-pill-thumb-surface" />
        </span>
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className="nav-pill-button"
            data-active={activeFilter === filter.id}
            aria-pressed={activeFilter === filter.id}
            onPointerDown={(event) => {
              if (event.button !== 0 || filter.id === activeFilter) return;
              event.preventDefault();
              onFilterChange(filter.id);
            }}
            onClick={(event) => {
              // Pointer already handled above. Ignore the follow-up click so a
              // FLIP/layout shift cannot retarget it onto a neighboring pill.
              if (event.detail !== 0) {
                event.preventDefault();
                return;
              }
              if (filter.id === activeFilter) return;
              onFilterChange(filter.id);
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
