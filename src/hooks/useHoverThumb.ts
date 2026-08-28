"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";

function isUnselectedButton(button: HTMLButtonElement) {
  return button.dataset.active !== "true";
}

function measureButton(button: HTMLButtonElement) {
  return { x: button.offsetLeft, width: button.offsetWidth };
}

export function useHoverThumb(
  containerRef: RefObject<HTMLDivElement | null>,
  activeKey: string | number | boolean,
) {
  const pointerTargetRef = useRef<HTMLButtonElement | null>(null);
  const focusTargetRef = useRef<HTMLButtonElement | null>(null);
  const visibleRef = useRef(false);
  const rafRef = useRef(0);
  const [hoverThumb, setHoverThumb] = useState({ x: 0, width: 0 });
  const [hoverVisible, setHoverVisible] = useState(false);
  const [hoverSnap, setHoverSnap] = useState(false);

  const hide = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    visibleRef.current = false;
    setHoverVisible(false);
    setHoverSnap(false);
  }, []);

  const showAt = useCallback((button: HTMLButtonElement) => {
    const next = measureButton(button);

    if (visibleRef.current) {
      setHoverThumb(next);
      setHoverVisible(true);
      return;
    }

    // Paint at the target box with opacity 0 first, so the enter fade does
    // not also slide from the last (or 0,0) geometry.
    flushSync(() => {
      setHoverThumb(next);
      setHoverSnap(true);
      setHoverVisible(false);
    });
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        visibleRef.current = true;
        setHoverSnap(false);
        setHoverVisible(true);
      });
    });
  }, []);

  const apply = useCallback(() => {
    const pointer = pointerTargetRef.current;
    if (pointer?.isConnected && isUnselectedButton(pointer)) {
      showAt(pointer);
      return;
    }

    const focus = focusTargetRef.current;
    if (
      focus?.isConnected &&
      isUnselectedButton(focus) &&
      focus.matches(":focus-visible")
    ) {
      showAt(focus);
      return;
    }

    hide();
  }, [hide, showAt]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerOver = (event: PointerEvent) => {
      const button = (event.target as Element | null)?.closest(
        ".nav-pill-button",
      );
      if (!(button instanceof HTMLButtonElement) || !container.contains(button)) {
        return;
      }
      pointerTargetRef.current = button;
      apply();
    };

    const onPointerLeave = () => {
      pointerTargetRef.current = null;
      apply();
    };

    const onFocusIn = (event: FocusEvent) => {
      const button = event.target;
      if (
        !(button instanceof HTMLButtonElement) ||
        !button.classList.contains("nav-pill-button")
      ) {
        return;
      }
      focusTargetRef.current = button;
      apply();
    };

    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && container.contains(next)) return;
      focusTargetRef.current = null;
      apply();
    };

    const onResize = () => {
      const target =
        pointerTargetRef.current?.isConnected &&
        isUnselectedButton(pointerTargetRef.current)
          ? pointerTargetRef.current
          : focusTargetRef.current?.isConnected &&
              isUnselectedButton(focusTargetRef.current)
            ? focusTargetRef.current
            : null;
      if (!target || !visibleRef.current) return;
      setHoverThumb(measureButton(target));
    };

    pointerTargetRef.current =
      container.querySelector<HTMLButtonElement>(".nav-pill-button:hover");
    const focused = container.querySelector<HTMLButtonElement>(
      ".nav-pill-button:focus-visible",
    );
    if (focused) focusTargetRef.current = focused;
    apply();

    container.addEventListener("pointerover", onPointerOver);
    container.addEventListener("pointerleave", onPointerLeave);
    container.addEventListener("focusin", onFocusIn);
    container.addEventListener("focusout", onFocusOut);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      container.removeEventListener("pointerover", onPointerOver);
      container.removeEventListener("pointerleave", onPointerLeave);
      container.removeEventListener("focusin", onFocusIn);
      container.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("resize", onResize);
    };
  }, [activeKey, apply, containerRef]);

  return { hoverThumb, hoverVisible, hoverSnap };
}
