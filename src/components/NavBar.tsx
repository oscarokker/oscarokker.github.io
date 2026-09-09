"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { FilterCategory } from "@/lib/types";
import { filters } from "@/data/tiles";
import { useHoverThumb } from "@/hooks/useHoverThumb";
import { useSlidingThumb } from "@/hooks/useSlidingThumb";
import { usePointerGesture } from "@/hooks/usePointerGesture";
import { useDevice } from "@/hooks/useDevice";

interface NavBarProps {
  activeFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  visible?: boolean;
}

interface FilterButtonProps {
  filterId: FilterCategory;
  label: string;
  isActive: boolean;
  onFilterChange: (filter: FilterCategory) => void;
}

function FilterButton({
  filterId,
  label,
  isActive,
  onFilterChange,
}: FilterButtonProps) {
  const { pointerHandlers } = usePointerGesture({
    onTap: useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        if (isActive) return;
        event.preventDefault();
        onFilterChange(filterId);
      },
      [isActive, filterId, onFilterChange],
    ),
  });

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      // Keyboard Enter synthesizes click (detail 0) without pointer gesture.
      if (event.detail === 0) {
        if (isActive) return;
        onFilterChange(filterId);
        return;
      }
      // Otherwise pointer already handled above. Ignore the follow-up click so a
      // FLIP/layout shift cannot retarget it onto a neighboring pill.
      event.preventDefault();
    },
    [isActive, filterId, onFilterChange],
  );

  return (
    <button
      type="button"
      className="nav-pill-button"
      data-active={isActive}
      aria-pressed={isActive}
      {...pointerHandlers}
      onClick={handleClick}
    >
      {label}
    </button>
  );
}

export function NavBar({
  activeFilter,
  onFilterChange,
  visible = true,
}: NavBarProps) {
  const device = useDevice();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { containerRef, thumb, thumbReady } = useSlidingThumb(activeFilter);
  const { hoverThumb, hoverVisible, hoverSnap } = useHoverThumb(
    containerRef,
    activeFilter,
  );
  
  const [entranceState, setEntranceState] = useState<"pending" | "visible" | "done">("pending");
  
  // Trigger entrance animation on home page first mount
  useEffect(() => {
    if (!isHome) {
      setEntranceState("done");
      return;
    }
    
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setEntranceState("done");
      return;
    }
    
    // Start chrome entrance ~100ms before first tile (or ~half the tile delay)
    const chromeDelay = 0; // Start immediately, tiles start at index * 70ms
    const chromeAnimDuration = 400;
    
    const showTimer = setTimeout(() => {
      setEntranceState("visible");
    }, chromeDelay);
    
    const doneTimer = setTimeout(() => {
      setEntranceState("done");
    }, chromeDelay + chromeAnimDuration);
    
    return () => {
      clearTimeout(showTimer);
      clearTimeout(doneTimer);
    };
  }, [isHome]);

  return (
    <nav
      className="site-nav fixed top-4 left-1/2 z-50 pointer-events-auto"
      aria-label="Portfolio filters"
      data-visible={visible ? "true" : "false"}
      data-device={device}
      data-entrance-pending={isHome && entranceState === "pending" ? true : undefined}
      data-entrance-visible={isHome && entranceState === "visible" ? true : undefined}
      data-entrance-done={isHome && entranceState === "done" ? true : undefined}
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
          <FilterButton
            key={filter.id}
            filterId={filter.id}
            label={filter.label}
            isActive={activeFilter === filter.id}
            onFilterChange={onFilterChange}
          />
        ))}
      </div>
    </nav>
  );
}
