"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { accentClass } from "@/lib/accent";
import { withBasePath } from "@/lib/base-path";
import { duolingoProfileUrl, type DuolingoStats } from "@/lib/duolingo";
import { ExternalLinkIcon } from "@/components/ChromeIcons";

interface DuolingoTileProps {
  username: string;
  userId: number;
  accent?: string;
}

function useAnimatedCounter(
  target: number | null,
  duration = 800
): number | null {
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Cancel any ongoing animation
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (target === null) {
      return;
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Skip animation, jump to target
      rafRef.current = requestAnimationFrame(() => {
        setDisplayValue(target);
      });
      return;
    }

    // Animate from 0 to target
    let startTime: number | null = null;
    const startValue = 0;

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic easing
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = Math.round(startValue + (target - startValue) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, duration]);

  return displayValue;
}

export function DuolingoTile({ username, userId, accent }: DuolingoTileProps) {
  const [stats, setStats] = useState<DuolingoStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(withBasePath("/api/duolingo.json"));
        if (!response.ok) throw new Error("fetch failed");
        const data = (await response.json()) as DuolingoStats;
        if (typeof data.streak !== "number") throw new Error("invalid stats");
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const animatedStreak = useAnimatedCounter(stats?.streak ?? null);

  const profileUrl = stats?.profileUrl ?? duolingoProfileUrl(userId);
  const streakLabel = stats
    ? `${stats.streak} day streak`
    : failed
      ? "Streak unavailable"
      : "Loading streak";

  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`tile-card-inner duolingo-tile no-underline h-full ${accentClass(accent)}`}
      aria-label={`Duolingo profile ${username}, ${streakLabel}`}
    >
      <span className="intro-chrome-icon-btn intro-tile-expand" aria-hidden>
        <ExternalLinkIcon />
      </span>
      <div className="duolingo-streak">
        <Image
          src={withBasePath("/duolingo-streak-fire.svg")}
          alt=""
          width={48}
          height={48}
          className="duolingo-streak-flame"
          aria-hidden
          unoptimized
        />
        <span className="duolingo-streak-value" aria-hidden>
          {animatedStreak !== null
            ? animatedStreak
            : failed
              ? "—"
              : "···"}
        </span>
        {/* Announce final value only, not every animation tick */}
        <span className="sr-only" aria-live="polite">
          {stats ? `${stats.streak} day streak` : ""}
        </span>
      </div>

      <div className="duolingo-character">
        <Image
          src={withBasePath("/duolingo-oscar.svg")}
          alt=""
          width={192}
          height={192}
          className="duolingo-character-image"
          unoptimized
        />
      </div>
      <Image
        src={withBasePath("/duolingo-icon.svg")}
        alt=""
        width={48}
        height={48}
        className="duolingo-app-icon"
        unoptimized
        style={{ borderRadius: "16px" }}
      />
    </a>
  );
}
