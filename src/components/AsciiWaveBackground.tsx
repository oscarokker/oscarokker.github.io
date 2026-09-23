"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { isCaseStudyPath } from "@/lib/case-study-href";

/** Soft ramp — keep in sync with DESIGN.md */
const CHARSET = " .·:-=+*#";
const COLOR_BUCKETS = 8;
const MAX_PEAK_MIX = 0.4;
const BASE_R = 220;
const BASE_G = 220;
const BASE_B = 230;
const PEAK_R = 133;
const PEAK_G = 115;
const PEAK_B = 255;
const CLEAR = "#0d0c14";
/** Ambient layer: ASCII upscales fine; avoid retina fillText cost. */
const DPR_CAP = 1;

export function AsciiWaveBackground() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const visible = theme === "dark" && !isCaseStudyPath(pathname);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let cols = 0;
    let rows = 0;
    let cellSize = 16;
    let frameInterval = 1000 / 15;
    let atlas: HTMLCanvasElement | null = null;
    let lastFrameTime = 0;
    let running = false;

    const buildAtlas = (size: number): HTMLCanvasElement | null => {
      const glyphCount = CHARSET.length;
      const atlasCanvas = document.createElement("canvas");
      atlasCanvas.width = Math.max(1, Math.floor(glyphCount * size * dpr));
      atlasCanvas.height = Math.max(1, Math.floor(COLOR_BUCKETS * size * dpr));
      const actx = atlasCanvas.getContext("2d");
      if (!actx) return null;

      actx.setTransform(dpr, 0, 0, dpr, 0, 0);
      actx.font = `${size - 2}px monospace`;
      actx.textAlign = "center";
      actx.textBaseline = "middle";

      for (let bucket = 0; bucket < COLOR_BUCKETS; bucket++) {
        const peakMix =
          COLOR_BUCKETS <= 1
            ? 0
            : (bucket / (COLOR_BUCKETS - 1)) * MAX_PEAK_MIX;
        const r = Math.round(BASE_R + (PEAK_R - BASE_R) * peakMix);
        const g = Math.round(BASE_G + (PEAK_G - BASE_G) * peakMix);
        const b = Math.round(BASE_B + (PEAK_B - BASE_B) * peakMix);
        actx.fillStyle = `rgb(${r}, ${g}, ${b})`;

        for (let i = 0; i < glyphCount; i++) {
          const ch = CHARSET[i];
          if (ch === " ") continue;
          const x = i * size + size / 2;
          const y = bucket * size + size / 2;
          actx.fillText(ch, x, y);
        }
      }

      return atlasCanvas;
    };

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width <= 767;
      cellSize = isMobile ? 18 : 16;
      const targetFps = isMobile ? 12 : 15;
      frameInterval = 1000 / targetFps;
      cols = Math.ceil(width / cellSize);
      rows = Math.ceil(height / cellSize);
      canvas.width = Math.max(1, Math.floor(cols * cellSize * dpr));
      canvas.height = Math.max(1, Math.floor(rows * cellSize * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // Reset transform each resize (avoid cumulative scale).
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      atlas = buildAtlas(cellSize);
    };

    const wave = (x: number, y: number, time: number): number => {
      const speed = 0.35;
      const scale1 = 0.08;
      const scale2 = 0.05;
      const scale3 = 0.12;

      const wave1 =
        Math.sin(x * scale1 + time * speed) *
        Math.cos(y * scale1 - time * speed * 0.7);
      const wave2 =
        Math.sin(x * scale2 - y * scale2 + time * speed * 1.3) * 0.7;
      const wave3 =
        Math.cos(x * scale3 - y * scale3 + time * speed * 0.5) * 0.5;

      return (wave1 + wave2 + wave3) / 2.5;
    };

    const render = () => {
      if (!atlas) return;

      ctx.fillStyle = CLEAR;
      ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);

      const srcCell = cellSize * dpr;
      const charsetLen = CHARSET.length;
      const bucketDenom = COLOR_BUCKETS <= 1 ? 1 : COLOR_BUCKETS - 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const value = wave(col, row, timeRef.current);
          const normalizedValue = (value + 1) / 2;
          if (normalizedValue < 0.3) continue;

          const charIndex = Math.floor(normalizedValue * (charsetLen - 1));
          const clampedIndex = Math.max(0, Math.min(charIndex, charsetLen - 1));
          if (CHARSET[clampedIndex] === " ") continue;

          const peakMix = Math.pow(normalizedValue, 1.5) * MAX_PEAK_MIX;
          const bucket = Math.min(
            COLOR_BUCKETS - 1,
            Math.round((peakMix / MAX_PEAK_MIX) * bucketDenom)
          );

          const sx = clampedIndex * srcCell;
          const sy = bucket * srcCell;
          const dx = col * cellSize;
          const dy = row * cellSize;
          ctx.drawImage(
            atlas,
            sx,
            sy,
            srcCell,
            srcCell,
            dx,
            dy,
            cellSize,
            cellSize
          );
        }
      }
    };

    const stopLoop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      running = false;
    };

    const animate = (currentTime: number) => {
      if (document.hidden) {
        stopLoop();
        return;
      }

      if (currentTime - lastFrameTime >= frameInterval) {
        if (!prefersReducedMotion) {
          timeRef.current += 0.016;
        }
        render();
        lastFrameTime = currentTime;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    const startLoop = () => {
      if (prefersReducedMotion || running || document.hidden) return;
      running = true;
      lastFrameTime = 0;
      rafRef.current = requestAnimationFrame(animate);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else if (!prefersReducedMotion) {
        startLoop();
      }
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);

    if (prefersReducedMotion) {
      timeRef.current = 0;
      render();
    } else {
      startLoop();
    }

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopLoop();
    };
  }, [visible]);

  return (
    <canvas
      ref={canvasRef}
      className="ascii-wave-bg"
      data-visible={visible ? "true" : "false"}
      aria-hidden
    />
  );
}
