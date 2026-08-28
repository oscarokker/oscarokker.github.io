"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useCursorLabelOptional } from "@/hooks/useCursorLabel";

export interface TileSourceRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface UseTileExpandOptions {
  /** When false, `open` is a no-op (e.g. music tile without a video). */
  enabled?: boolean;
  /** Intro expand records the click point for the morph origin. */
  capturePointer?: boolean;
}

export function useTileExpand({
  enabled = true,
  capturePointer = false,
}: UseTileExpandOptions = {}) {
  const tileRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [sourceRect, setSourceRect] = useState<TileSourceRect | null>(null);
  const [openingPointer, setOpeningPointer] = useState<{
    clientX: number;
    clientY: number;
  } | null>(null);
  const cursor = useCursorLabelOptional();
  const setLabelSuppressed = cursor?.setLabelSuppressed;
  const clearCursorLabel = cursor?.clearCursorLabel;

  const getTileShell = useCallback((): HTMLElement | null => {
    return tileRef.current?.closest(".tile-card") as HTMLElement | null;
  }, []);

  const measureSourceRect = useCallback((): TileSourceRect | null => {
    const el = getTileShell() ?? tileRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  }, [getTileShell]);

  const setShellHidden = useCallback(
    (hidden: boolean) => {
      const shell = getTileShell();
      if (!shell) return;
      shell.style.visibility = hidden ? "hidden" : "";
    },
    [getTileShell],
  );

  const open = useCallback(
    (event?: ReactMouseEvent<HTMLDivElement>) => {
      if (!enabled) return;
      const rect = measureSourceRect();
      if (!rect) return;
      if (capturePointer) {
        if (event) {
          setOpeningPointer({ clientX: event.clientX, clientY: event.clientY });
        } else {
          setOpeningPointer(null);
        }
      }
      setSourceRect(rect);
      setMounted(true);
      setVisible(true);
      setLabelSuppressed?.(true);
      clearCursorLabel?.();
    },
    [
      enabled,
      capturePointer,
      measureSourceRect,
      setLabelSuppressed,
      clearCursorLabel,
    ],
  );

  const handleMorphReady = useCallback(() => {
    setShellHidden(true);
  }, [setShellHidden]);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const handleExitComplete = useCallback(() => {
    setMounted(false);
    setVisible(false);
    setSourceRect(null);
    setOpeningPointer(null);
    setShellHidden(false);
    setLabelSuppressed?.(false);
  }, [setShellHidden, setLabelSuppressed]);

  useEffect(() => {
    if (mounted) return;
    setShellHidden(false);
  }, [mounted, setShellHidden]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    },
    [open],
  );

  return {
    tileRef,
    mounted,
    visible,
    sourceRect,
    openingPointer,
    measureSourceRect,
    open,
    close,
    handleMorphReady,
    handleExitComplete,
    handleKeyDown,
  };
}
