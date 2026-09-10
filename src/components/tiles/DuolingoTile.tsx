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

/**
 * Cubic Bézier easing function.
 * Evaluates a cubic Bézier curve defined by control points (x1, y1, x2, y2)
 * for a given progress value x (0 to 1), returning the eased y value.
 *
 * Uses Newton-Raphson iteration to solve for t given x, then computes y(t).
 */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    // Solve for t using Newton-Raphson
    let t = x;
    for (let i = 0; i < 8; i++) {
      const xT = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
      const dxT = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
      
      if (Math.abs(dxT) < 1e-6) break;
      t -= (xT - x) / dxT;
    }

    // Calculate y from t
    return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  };
}

function useAnimatedCounter(
  target: number | null,
  duration = 1600
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
      // Skip animation, jump to target immediately
      // Intentionally synchronous for instant UI update
      // eslint-disable-next-line
      setDisplayValue(target);
      return;
    }

    // Show 0 immediately, then animate to target
    // Intentionally synchronous for instant UI update
    // eslint-disable-next-line
    setDisplayValue(0);

    // Animate from 0 to target
    let startTime: number | null = null;
    const startValue = 0;
    const ease = cubicBezier(0.16, 1, 0.3, 1);

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const eased = ease(progress);

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
