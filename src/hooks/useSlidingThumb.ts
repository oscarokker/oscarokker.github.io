"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const THUMB_TRANSITION_MS = 350;
const THUMB_TRANSITION_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const STRETCH_NEAR = 1.08;
const STRETCH_FAR = 1.16;
const STRETCH_FAR_PX = 320;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stretchPeak(deltaX: number): number {
  const t = Math.min(1, Math.abs(deltaX) / STRETCH_FAR_PX);
  return STRETCH_NEAR + (STRETCH_FAR - STRETCH_NEAR) * t;
}

function measureActiveThumb(container: HTMLDivElement) {
  const active = container.querySelector<HTMLButtonElement>(
    ".nav-pill-button[data-active='true']",
  );
  if (!active) return null;
  return { x: active.offsetLeft, width: active.offsetWidth };
}

export function useSlidingThumb(activeKey: string | number | boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevBoxRef = useRef({ x: 0, width: 0 });
  const thumbReadyRef = useRef(false);
  const stretchAnimRef = useRef<Animation | null>(null);
  const [thumb, setThumb] = useState({ x: 0, width: 0 });
  const [thumbReady, setThumbReady] = useState(false);

  const playStretch = useCallback((deltaX: number) => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion()) return;

    const surface = container.querySelector<HTMLElement>(
      ".nav-pill-thumb-surface",
    );
    if (!surface) return;

    stretchAnimRef.current?.cancel();
    stretchAnimRef.current = surface.animate(
      [
        { transform: "scaleX(1)" },
        { transform: `scaleX(${stretchPeak(deltaX)})`, offset: 0.32 },
        { transform: "scaleX(1)" },
      ],
      {
        duration: THUMB_TRANSITION_MS,
        easing: THUMB_TRANSITION_EASE,
      },
    );
  }, []);

  const updateThumb = useCallback((opts?: { stretch?: boolean }) => {
    const container = containerRef.current;
    if (!container) return;
    const next = measureActiveThumb(container);
    if (!next) return;

    const prev = prevBoxRef.current;
    const moved = next.x !== prev.x || next.width !== prev.width;
    prevBoxRef.current = next;
    setThumb(next);

    if (opts?.stretch && moved && thumbReadyRef.current) {
      playStretch(next.x - prev.x);
    }
  }, [playStretch]);

  useLayoutEffect(() => {
    updateThumb({ stretch: true });
  }, [activeKey, updateThumb]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onResize = () => updateThumb();
    const frame = window.requestAnimationFrame(() => {
      thumbReadyRef.current = true;
      setThumbReady(true);
    });
    const observer = new ResizeObserver(onResize);
    observer.observe(container);
    for (const button of container.querySelectorAll(".nav-pill-button")) {
      observer.observe(button);
    }
    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      stretchAnimRef.current?.cancel();
    };
  }, [updateThumb]);

  return { containerRef, thumb, thumbReady };
}
