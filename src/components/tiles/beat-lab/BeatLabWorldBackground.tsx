"use client";

import { useEffect, useRef } from "react";
import { BeatLabNeoTranceVideo } from "@/components/tiles/beat-lab/BeatLabNeoTranceVideo";
import type { CompositionId } from "@/lib/beat-lab/compositions";

type CanvasWorldId = Exclude<CompositionId, "neo-trance">;

interface BeatLabWorldBackgroundProps {
  worldId: CompositionId;
  active: boolean;
}

export function BeatLabWorldBackground({
  worldId,
  active,
}: BeatLabWorldBackgroundProps) {
  if (worldId === "neo-trance") {
    return <BeatLabNeoTranceVideo active={active} />;
  }
  return <BeatLabCanvasWorldBackground worldId={worldId} active={active} />;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function BeatLabCanvasWorldBackground({
  worldId,
  active,
}: {
  worldId: CanvasWorldId;
  active: boolean;
}) {
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
      CanvasWorldId,
      (w: number, h: number, time: number) => void
    > = {
      botanica: paintBotanica,
      "utopia-os": paintUtopia,
      breakcore: paintBreakcore,
    };

    const paint = painters[worldId];

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
