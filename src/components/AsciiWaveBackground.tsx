"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { isCaseStudyPath } from "@/lib/case-study-href";

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

    const charset = " .·:-=+*#";
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let cols = 0;
    let rows = 0;
    let cellSize = 14;
    let frameInterval = 1000 / 22;

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width <= 767;
      cellSize = isMobile ? 16 : 14;
      const targetFps = isMobile ? 16 : 22;
      frameInterval = 1000 / targetFps;
      cols = Math.ceil(width / cellSize);
      rows = Math.ceil(height / cellSize);
      canvas.width = cols * cellSize * dpr;
      canvas.height = rows * cellSize * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);
    let lastFrameTime = 0;
    let paused = false;

    const onVisibilityChange = () => {
      paused = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const wave = (x: number, y: number, time: number): number => {
      const speed = 0.35;
      const scale1 = 0.08;
      const scale2 = 0.05;
      const scale3 = 0.12;

      const wave1 =
        Math.sin(x * scale1 + time * speed) * Math.cos(y * scale1 - time * speed * 0.7);
      const wave2 =
        Math.sin((x * scale2 - y * scale2) + time * speed * 1.3) * 0.7;
      const wave3 =
        Math.cos(x * scale3 - y * scale3 + time * speed * 0.5) * 0.5;

      return (wave1 + wave2 + wave3) / 2.5;
    };

    const render = () => {
      ctx.fillStyle = "#0d0c14";
      ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);

      ctx.font = `${cellSize - 2}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * cellSize + cellSize / 2;
          const y = row * cellSize + cellSize / 2;

          const value = wave(col, row, timeRef.current);
          const normalizedValue = (value + 1) / 2;

          if (normalizedValue < 0.3) continue;

          const charIndex = Math.floor(normalizedValue * (charset.length - 1));
          const char = charset[Math.max(0, Math.min(charIndex, charset.length - 1))];

          if (char === " ") continue;

          const peakMix = Math.pow(normalizedValue, 1.5) * 0.4;
          const baseR = 220;
          const baseG = 220;
          const baseB = 230;
          const peakR = 133;
          const peakG = 115;
          const peakB = 255;

          const r = Math.round(baseR + (peakR - baseR) * peakMix);
          const g = Math.round(baseG + (peakG - baseG) * peakMix);
          const b = Math.round(baseB + (peakB - baseB) * peakMix);

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillText(char, x, y);
        }
      }
    };

    const animate = (currentTime: number) => {
      if (!paused) {
        if (currentTime - lastFrameTime >= frameInterval) {
          if (!prefersReducedMotion) {
            timeRef.current += 0.016;
          }
          render();
          lastFrameTime = currentTime;
        }
      }

      if (!prefersReducedMotion) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    if (prefersReducedMotion) {
      timeRef.current = 0;
      render();
    } else {
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
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
