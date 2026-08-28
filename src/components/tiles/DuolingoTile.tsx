"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { accentClass } from "@/lib/accent";
import { withBasePath } from "@/lib/base-path";
import { duolingoProfileUrl, type DuolingoStats } from "@/lib/duolingo";
import { ExternalLinkIcon } from "@/components/ChromeIcons";

interface DuolingoTileProps {
  username: string;
  userId: number;
  accent?: string;
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
      <div className="duolingo-streak" aria-live="polite">
        <Image
          src={withBasePath("/duolingo-streak-fire.svg")}
          alt=""
          width={48}
          height={48}
          className="duolingo-streak-flame"
          aria-hidden
          unoptimized
        />
        <span className="duolingo-streak-value">
          {stats ? stats.streak : failed ? "—" : "···"}
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
