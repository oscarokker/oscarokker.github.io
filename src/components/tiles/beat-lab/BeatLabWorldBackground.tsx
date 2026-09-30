"use client";

import { useEffect, useRef } from "react";
import type { CompositionId } from "@/lib/beat-lab/compositions";

interface BeatLabWorldBackgroundProps {
  worldId: CompositionId;
  active: boolean;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function BeatLabWorldBackground({
  worldId,
  active,
}: BeatLabWorldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    let t = 0;

    const shell = canvas.parentElement ?? canvas;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = shell.getBoundingClientRect();
      const width = Math.floor(rect.width * dpr);
      const height = Math.floor(rect.height * dpr);
      // The shell can still be tiny on the first layout frame of the morph.
      // Don't lock a 1×1 bitmap; ResizeObserver retries once it has a real box.
      if (width < 2 || height < 2) return false;
      if (canvas.width === width && canvas.height === height) return true;
      canvas.width = width;
      canvas.height = height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };

    const paintNeoTrance = (w: number, h: number, time: number) => {
      const g = ctx.createRadialGradient(
        w * 0.35,
        h * 0.45,
        0,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.75,
      );
      g.addColorStop(0, "#1a6bff");
      g.addColorStop(0.35, "#0a1224");
      g.addColorStop(1, "#05070f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 6; i++) {
        const angle = time * 0.00015 + i * 1.05;
        const cx = w * 0.5 + Math.cos(angle) * w * 0.12;
        const cy = h * 0.5 + Math.sin(angle * 1.3) * h * 0.1;
        const beam = ctx.createLinearGradient(cx, cy, w, h * 0.2);
        beam.addColorStop(0, "rgba(61, 224, 255, 0.35)");
        beam.addColorStop(1, "rgba(61, 224, 255, 0)");
        ctx.strokeStyle = beam;
        ctx.lineWidth = 2 + i * 0.4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(w * 0.95, h * (0.15 + i * 0.08));
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const paintBotanica = (w: number, h: number, time: number) => {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#7ec8e3");
      sky.addColorStop(0.45, "#f7f9f4");
      sky.addColorStop(1, "#3fa34d");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      if (!reduced) {
        ctx.fillStyle = "rgba(63, 163, 77, 0.12)";
        for (let i = 0; i < 12; i++) {
          const x = ((time * 0.02 + i * 80) % (w + 80)) - 40;
          ctx.fillRect(x, h * 0.55, 2, h * 0.45);
        }
      }
    };

    const paintUtopia = (w: number, h: number, time: number) => {
      const sky = ctx.createLinearGradient(0, 0, w, h);
      sky.addColorStop(0, "#6ee7ff");
      sky.addColorStop(0.5, "#4ba3f0");
      sky.addColorStop(1, "#f5f8fc");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(11, 13, 18, 0.15)";
      ctx.lineWidth = 1;
      const rot = reduced ? 0 : time * 0.0002;
      for (let i = 0; i < 8; i++) {
        const a = rot + (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2);
        ctx.lineTo(w / 2 + Math.cos(a) * w * 0.45, h / 2 + Math.sin(a) * h * 0.35);
        ctx.stroke();
      }
    };

    const paintBreakcore = (w: number, h: number, time: number) => {
      ctx.fillStyle = "#07040a";
      ctx.fillRect(0, 0, w, h);
      const count = 900;
      for (let i = 0; i < count; i++) {
        const x = (i * 17) % w;
        const y = (i * 31 + (reduced ? 0 : time * 0.04)) % h;
        ctx.fillStyle = i % 7 === 0 ? "rgba(255, 43, 214, 0.35)" : "rgba(242, 240, 245, 0.06)";
        ctx.fillRect(x, y, 1, 1);
      }
      if (!reduced && Math.floor(time / 1200) % 5 === 0) {
        ctx.fillStyle = "rgba(92, 225, 255, 0.08)";
        ctx.fillRect(0, (time * 0.15) % h, w, 3);
      }
    };

    const painters: Record<
      CompositionId,
      (w: number, h: number, time: number) => void
    > = {
      "neo-trance": paintNeoTrance,
      botanica: paintBotanica,
      "utopia-os": paintUtopia,
      breakcore: paintBreakcore,
    };

    const paint = painters[worldId] ?? paintNeoTrance;

    const draw = (time: number) => {
      const w = shell.clientWidth;
      const h = shell.clientHeight;
      if (w < 2 || h < 2) return;
      paint(w, h, time);
    };

    const paintNow = () => {
      if (!resize()) return;
      draw(reduced ? 0 : t);
    };

    paintNow();

    const tick = (now: number) => {
      if (document.hidden || !active) return;
      if (!reduced) {
        t = now;
        draw(t);
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    if (!reduced) {
      rafRef.current = window.requestAnimationFrame(tick);
    }

    const observer = new ResizeObserver(() => {
      paintNow();
    });
    observer.observe(shell);

    const onResize = () => {
      paintNow();
    };
    window.addEventListener("resize", onResize);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [worldId, active]);

  return (
    <canvas
      ref={canvasRef}
      className="beat-lab-world-bg"
      aria-hidden
      data-world-bg={worldId}
    />
  );
}
