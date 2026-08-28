"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CursorIcon = "email" | "external" | "phone" | "copy";

export interface CursorLabelConfig {
  text: string;
  /** Named tile accent (e.g. "coral") or any CSS color */
  accent?: string;
  icon?: CursorIcon;
}

interface CursorContextValue {
  label: CursorLabelConfig | null;
  /** When true, floating tooltip is hidden (cursor arrow still shows) */
  labelSuppressed: boolean;
  setCursorLabel: (label: CursorLabelConfig | null) => void;
  clearCursorLabel: () => void;
  setLabelSuppressed: (suppressed: boolean) => void;
}

const CursorContext = createContext<CursorContextValue | null>(null);

export function CursorProvider({ children }: { children: ReactNode }) {
  const [label, setLabel] = useState<CursorLabelConfig | null>(null);
  const [labelSuppressed, setLabelSuppressed] = useState(false);

  const setCursorLabel = useCallback((next: CursorLabelConfig | null) => {
    setLabel(next);
  }, []);

  const clearCursorLabel = useCallback(() => {
    setLabel(null);
  }, []);

  const value = useMemo(
    () => ({
      label,
      labelSuppressed,
      setCursorLabel,
      clearCursorLabel,
      setLabelSuppressed,
    }),
    [label, labelSuppressed, setCursorLabel, clearCursorLabel],
  );

  return (
    <CursorContext.Provider value={value}>{children}</CursorContext.Provider>
  );
}

export function useCursorLabel() {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error("useCursorLabel must be used within CursorProvider");
  }
  return context;
}

/** Optional hook — returns null outside provider (safe for shared components) */
export function useCursorLabelOptional() {
  return useContext(CursorContext);
}

const NAMED_ACCENTS = new Set([
  "coral",
  "blue",
  "violet",
  "indigo",
  "teal",
  "amber",
  "rose",
  "green",
  "orange",
  "sky",
]);

export function resolveCursorAccent(accent?: string): string {
  if (!accent) return "var(--color-accent)";
  if (NAMED_ACCENTS.has(accent)) {
    return `var(--color-tile-${accent})`;
  }
  return accent;
}
