"use client";

import { useCallback, useRef } from "react";
import type { TileData, FilterCategory } from "@/lib/types";
import { CaseStudyTile } from "@/components/tiles/CaseStudyTile";
import {
  IntroTile,
  QuoteTile,
  SocialTile,
  MusicTile,
  CvTile,
  LogoTile,
  PhotoStackTile,
} from "@/components/tiles/TileContent";
import { DuolingoTile } from "@/components/tiles/DuolingoTile";
import { getCaseStudy } from "@/data/case-studies";
import { accentClass } from "@/lib/accent";
import { spawnTileClickRipple, removeRipple } from "@/lib/clickRipple";
import { usePointerGesture } from "@/hooks/usePointerGesture";

interface TileProps {
  tile: TileData;
  isActive: boolean;
  sortOrder: number;
}

interface CursorMeta {
  label: string;
  accent?: string;
}

function getCursorMeta(tile: TileData): CursorMeta | null {
  switch (tile.variant) {
    case "intro":
      return { label: "Expand to learn more about me" };
    case "cv":
      return { label: "Download my CV", accent: tile.props.accent };
    case "social":
      if (tile.props.copyValue) {
        return { label: "Click to copy my email address 📨", accent: tile.props.accent };
      }
      if (tile.props.label === "LinkedIn") {
        return { label: "Connect with me on LinkedIn 🤝", accent: tile.props.accent };
      }
      return {
        label: `Open ${tile.props.label}`,
        accent: tile.props.accent,
      };
    case "case-study": {
      if (tile.props.comingSoon) return null;
      const study = getCaseStudy(tile.props.slug);
      return {
        label: study?.headline ?? `Open ${tile.props.title}`,
        accent: tile.props.accent,
      };
    }
    case "music":
      if (tile.props.youtubeId) {
        return {
          label: tile.props.videoTitle
            ? `Play ${tile.props.videoTitle}`
            : "Watch video",
          accent: tile.props.accent,
        };
      }
      return {
        label: `${tile.props.subtitle} — ${tile.props.title}`,
        accent: tile.props.accent,
      };
    case "quote":
      return tile.props.cursorLabel
        ? { label: tile.props.cursorLabel }
        : null;
    case "duolingo":
      return {
        label: "I'm relearning German 🇩🇪\nFollow me on Duolingo",
        accent: tile.props.accent,
      };
    case "logo":
      return {
        label: tile.props.label ?? tile.props.alt,
        accent: tile.props.accent,
      };
    case "photo-stack":
      return {
        label: "Expand to see my Himalayan photos 🏔️",
        accent: tile.props.accent,
      };
  }
}

function TileContent({ tile }: { tile: TileData }) {
  switch (tile.variant) {
    case "intro":
      return <IntroTile {...tile.props} />;
    case "case-study":
      return <CaseStudyTile {...tile.props} />;
    case "quote":
      return <QuoteTile {...tile.props} />;
    case "social":
      return <SocialTile {...tile.props} />;
    case "music":
      return <MusicTile {...tile.props} />;
    case "cv":
      return <CvTile {...tile.props} />;
    case "duolingo":
      return <DuolingoTile {...tile.props} />;
    case "logo":
      return <LogoTile {...tile.props} />;
    case "photo-stack":
      return <PhotoStackTile {...tile.props} />;
  }
}

function tileAccent(tile: TileData): string | undefined {
  return "accent" in tile.props ? tile.props.accent : undefined;
}

function isComingSoonCaseStudy(tile: TileData): boolean {
  return tile.variant === "case-study" && Boolean(tile.props.comingSoon);
}

function isInteractiveTile(tile: TileData): boolean {
  if (isComingSoonCaseStudy(tile)) return false;
  return true;
}

export function Tile({ tile, isActive, sortOrder }: TileProps) {
  const comingSoon = isComingSoonCaseStudy(tile);
  // Filter match stays on the slot (FLIP / packing). Coming-soon cards are
  // always visually + interactively inactive, even when the filter matches.
  const cardActive = isActive && !comingSoon;
  const className = [
    "tile-card",
    accentClass(tileAccent(tile)),
    tile.variant === "logo" ? "tile-card--logo" : null,
    tile.variant === "photo-stack" ? "tile-card--photo-stack" : null,
  ]
    .filter(Boolean)
    .join(" ");
  const cursor = cardActive ? getCursorMeta(tile) : null;
  const activeRippleRef = useRef<HTMLElement | null>(null);

  const { pointerHandlers } = usePointerGesture({
    onPointerDownImmediate: useCallback(
      (event: React.PointerEvent<HTMLElement>) => {
        if (!cardActive) return;
        activeRippleRef.current = spawnTileClickRipple(event.currentTarget, event);
      },
      [cardActive],
    ),
    onDragStart: useCallback(() => {
      if (activeRippleRef.current) {
        removeRipple(activeRippleRef.current);
        activeRippleRef.current = null;
      }
    }, []),
    onTap: useCallback(() => {
      // Ripple already spawned in onPointerDownImmediate
      activeRippleRef.current = null;
    }, []),
  });

  return (
    <div
      className={`tile-slot tile-size-${tile.size}`}
      data-grid-order={sortOrder}
      data-active={isActive}
      inert={!isActive || undefined}
    >
      <article
        className={className}
        data-active={cardActive}
        data-coming-soon={comingSoon ? "true" : undefined}
        {...pointerHandlers}
        {...(comingSoon ? { "aria-disabled": "true" } : {})}
        {...(cursor
          ? {
              "data-cursor-label": cursor.label,
              ...(cursor.accent
                ? { "data-cursor-accent": cursor.accent }
                : {}),
            }
          : {})}
      >
        <TileContent tile={tile} />
      </article>
    </div>
  );
}

export function tileMatchesFilter(
  tile: TileData,
  filter: FilterCategory,
): boolean {
  return filter === "all" || tile.categories.includes(filter);
}
