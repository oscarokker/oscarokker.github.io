"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  CursorProvider,
  resolveCursorAccent,
  useCursorLabel,
  type CursorIcon,
  type CursorLabelConfig,
} from "@/hooks/useCursorLabel";
import {
  CURSOR_MODE_ASSETS,
  resolveCursorMode,
  type CursorMode,
} from "@/lib/cursor-modes";
import { withBasePath } from "@/lib/base-path";

/** Matches `--cursor-label-offset-*` (below-right of the pointer). */
const LABEL_OFFSET_X = 20;
const LABEL_OFFSET_Y = 20;
/** Keep the full chip inside the viewport. */
const LABEL_VIEWPORT_INSET = 10;

/** Arrow stays nearly glued to the pointer; slight smoothing kills sub-pixel jitter. */
const ARROW_FOLLOW = 0.55;
/** Exponential smoothing (~230ms time constant at 60fps). Trails with a fluid follow, not glued. */
const LABEL_FOLLOW = 0.07;

/** Typewriter: ~40% slower than 22/180/420 so the label is readable, not rushed. */
const TYPE_MS_PER_CHAR = 31;
const TYPE_MIN_MS = 250;
const TYPE_MAX_MS = 590;

function typewriterDuration(length: number): number {
  if (length <= 0) return 0;
  return Math.min(TYPE_MAX_MS, Math.max(TYPE_MIN_MS, length * TYPE_MS_PER_CHAR));
}

function clampLabelToViewport(
  cursorX: number,
  cursorY: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const viewport = window.visualViewport;
  const viewLeft = viewport?.offsetLeft ?? 0;
  const viewTop = viewport?.offsetTop ?? 0;
  const viewWidth = viewport?.width ?? window.innerWidth;
  const viewHeight = viewport?.height ?? window.innerHeight;

  const minX = viewLeft + LABEL_VIEWPORT_INSET;
  const minY = viewTop + LABEL_VIEWPORT_INSET;
  const maxX = viewLeft + viewWidth - LABEL_VIEWPORT_INSET;
  const maxY = viewTop + viewHeight - LABEL_VIEWPORT_INSET;

  let x = cursorX + LABEL_OFFSET_X;
  if (width > 0 && x + width > maxX) {
    x = cursorX - LABEL_OFFSET_X - width;
  }
  if (width > 0) {
    const maxLeft = maxX - width;
    x = Math.min(Math.max(x, minX), Math.max(minX, maxLeft));
  }

  let y = cursorY + LABEL_OFFSET_Y;
  if (height > 0 && y + height > maxY) {
    y = cursorY - LABEL_OFFSET_Y - height;
  }
  if (height > 0) {
    const maxTop = maxY - height;
    y = Math.min(Math.max(y, minY), Math.max(minY, maxTop));
  }

  return { x, y };
}

function LabelLines({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, index) => (
        <span key={index} className="custom-cursor-label-line">
          {line}
        </span>
      ))}
    </>
  );
}

function CursorGlyph({
  mode,
  className,
}: {
  mode: CursorMode;
  className: string;
}) {
  const asset = CURSOR_MODE_ASSETS[mode];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny fixed overlay; avoid next/image layout
    <img
      className={className}
      src={withBasePath(asset.src)}
      alt=""
      width={asset.width}
      height={asset.height}
      draggable={false}
      aria-hidden
    />
  );
}

function CursorGlyphStack() {
  return (
    <div className="custom-cursor-glyph-stack">
      <CursorGlyph
        mode="default"
        className="custom-cursor-glyph custom-cursor-glyph--default"
      />
      <CursorGlyph
        mode="text"
        className="custom-cursor-glyph custom-cursor-glyph--text"
      />
    </div>
  );
}

function CursorIconGlyph({ icon }: { icon: CursorIcon }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (icon) {
    case "email":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 7 9-7" />
        </svg>
      );
    case "external":
      return (
        <svg {...common}>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.36 1.77.7 2.61a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.47-1.27a2 2 0 0 1 2.11-.45c.84.34 1.71.58 2.61.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case "copy":
      return (
        <svg {...common}>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );
    default:
      return null;
  }
}

function readLabelFromTarget(target: EventTarget | null): CursorLabelConfig | null {
  if (!(target instanceof Element)) return null;
  const el = target.closest<HTMLElement>("[data-cursor-label]");
  if (!el) return null;
  const text = el.dataset.cursorLabel?.trim();
  if (!text) return null;
  const accent = el.dataset.cursorAccent?.trim() || undefined;
  const icon = el.dataset.cursorIcon?.trim() as CursorIcon | undefined;
  return {
    text,
    accent,
    icon: icon || undefined,
  };
}

function CustomCursorInner() {
  const { label, labelSuppressed, setCursorLabel, clearCursorLabel } =
    useCursorLabel();

  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const cursorRef = useRef<HTMLDivElement>(null);
  const labelFollowRef = useRef<HTMLDivElement>(null);
  const labelChipRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const rendered = useRef({ x: 0, y: 0 });
  const labelPos = useRef({ x: 0, y: 0 });
  const labelSize = useRef({ width: 0, height: 0 });
  const labelReady = useRef(false);
  const labelHasPos = useRef(false);
  const showLabelRef = useRef(false);
  const rafId = useRef<number | null>(null);
  const typeRafId = useRef<number | null>(null);
  const heldLabelRef = useRef<CursorLabelConfig | null>(null);
  const hoveringInteractive = useRef(false);

  const [typedText, setTypedText] = useState("");
  const [labelWrapped, setLabelWrapped] = useState(false);
  const [cursorMode, setCursorMode] = useState<CursorMode>("default");
  const cursorModeRef = useRef<CursorMode>("default");

  const applyTransform = useCallback((x: number, y: number) => {
    const node = cursorRef.current;
    if (!node) return;
    node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const applyLabelFollow = useCallback((x: number, y: number) => {
    const node = labelFollowRef.current;
    if (!node) return;
    node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const measureLabelChip = useCallback(() => {
    const chip = labelChipRef.current;
    if (!chip) return;
    labelSize.current.width = chip.offsetWidth;
    labelSize.current.height = chip.offsetHeight;

    const styles = getComputedStyle(chip);
    const padY =
      (parseFloat(styles.paddingTop) || 0) +
      (parseFloat(styles.paddingBottom) || 0);
    const lineHeight = parseFloat(styles.lineHeight) || 20;
    const hasBreak = Boolean(heldLabelRef.current?.text?.includes("\n"));
    const wrapped = hasBreak || chip.offsetHeight > padY + lineHeight * 1.45;
    setLabelWrapped((prev) => (prev === wrapped ? prev : wrapped));
  }, []);

  const labelTarget = useCallback(() => {
    return clampLabelToViewport(
      pos.current.x,
      pos.current.y,
      labelSize.current.width,
      labelSize.current.height,
    );
  }, []);

  const snapLabelToCursor = useCallback(() => {
    const target = labelTarget();
    labelPos.current.x = target.x;
    labelPos.current.y = target.y;
    labelReady.current = true;
    labelHasPos.current = true;
    applyLabelFollow(
      labelPos.current.x - rendered.current.x - LABEL_OFFSET_X,
      labelPos.current.y - rendered.current.y - LABEL_OFFSET_Y,
    );
  }, [applyLabelFollow, labelTarget]);

  const tick = useCallback(() => {
    const arrowSmooth = reducedMotion ? 1 : ARROW_FOLLOW;
    const labelSmooth = reducedMotion ? 1 : LABEL_FOLLOW;

    rendered.current.x += (pos.current.x - rendered.current.x) * arrowSmooth;
    rendered.current.y += (pos.current.y - rendered.current.y) * arrowSmooth;
    applyTransform(rendered.current.x, rendered.current.y);

    if (showLabelRef.current) {
      const target = labelTarget();
      if (!labelReady.current) {
        labelPos.current.x = target.x;
        labelPos.current.y = target.y;
        labelReady.current = true;
      } else {
        labelPos.current.x += (target.x - labelPos.current.x) * labelSmooth;
        labelPos.current.y += (target.y - labelPos.current.y) * labelSmooth;
      }
      labelHasPos.current = true;
    }

    // World-space follow: lerp while shown, freeze while fading so the nested
    // chip doesn't ride the snappy arrow.
    if (labelHasPos.current) {
      applyLabelFollow(
        labelPos.current.x - rendered.current.x - LABEL_OFFSET_X,
        labelPos.current.y - rendered.current.y - LABEL_OFFSET_Y,
      );
    }

    const dx = Math.abs(pos.current.x - rendered.current.x);
    const dy = Math.abs(pos.current.y - rendered.current.y);
    const followTarget = showLabelRef.current ? labelTarget() : null;
    const ldx = followTarget
      ? Math.abs(followTarget.x - labelPos.current.x)
      : 0;
    const ldy = followTarget
      ? Math.abs(followTarget.y - labelPos.current.y)
      : 0;

    if (dx > 0.05 || dy > 0.05 || ldx > 0.05 || ldy > 0.05) {
      rafId.current = requestAnimationFrame(tick);
    } else {
      rendered.current.x = pos.current.x;
      rendered.current.y = pos.current.y;
      applyTransform(rendered.current.x, rendered.current.y);
      if (followTarget) {
        labelPos.current.x = followTarget.x;
        labelPos.current.y = followTarget.y;
      }
      if (labelHasPos.current) {
        applyLabelFollow(
          labelPos.current.x - rendered.current.x - LABEL_OFFSET_X,
          labelPos.current.y - rendered.current.y - LABEL_OFFSET_Y,
        );
      }
      rafId.current = null;
    }
  }, [applyLabelFollow, applyTransform, labelTarget, reducedMotion]);

  const scheduleTick = useCallback(() => {
    if (rafId.current != null) return;
    rafId.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    const fineQuery = window.matchMedia("(pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      setEnabled(fineQuery.matches);
      setReducedMotion(motionQuery.matches);
    };
    sync();

    fineQuery.addEventListener("change", sync);
    motionQuery.addEventListener("change", sync);
    return () => {
      fineQuery.removeEventListener("change", sync);
      motionQuery.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("custom-cursor-active", enabled);
    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pos.current.x = event.clientX;
      pos.current.y = event.clientY;
      setVisible(true);
      scheduleTick();

      const nextMode = resolveCursorMode(event.clientX, event.clientY);
      if (nextMode !== cursorModeRef.current) {
        cursorModeRef.current = nextMode;
        setCursorMode(nextMode);
      }

      // Keep data-attribute labels in sync while moving between tiles
      if (!hoveringInteractive.current) {
        const next = readLabelFromTarget(event.target);
        if (next) setCursorLabel(next);
      }
    };

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const next = readLabelFromTarget(event.target);
      if (next) {
        hoveringInteractive.current = true;
        setCursorLabel(next);
      }
    };

    const onPointerOut = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const from = event.target;
      const to = event.relatedTarget;
      if (!(from instanceof Element)) return;

      const labeled = from.closest("[data-cursor-label]");
      if (!labeled) return;
      if (to instanceof Node && labeled.contains(to)) return;

      hoveringInteractive.current = false;
      // If moving onto another labeled element, pointerover will set the next label
      const next = readLabelFromTarget(to);
      if (next) {
        hoveringInteractive.current = true;
        setCursorLabel(next);
      } else {
        clearCursorLabel();
      }
    };

    const onLeaveWindow = () => {
      setVisible(false);
      hoveringInteractive.current = false;
      cursorModeRef.current = "default";
      setCursorMode("default");
      clearCursorLabel();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver, true);
    document.addEventListener("pointerout", onPointerOut, true);
    document.addEventListener("mouseleave", onLeaveWindow);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver, true);
      document.removeEventListener("pointerout", onPointerOut, true);
      document.removeEventListener("mouseleave", onLeaveWindow);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      if (typeRafId.current != null) cancelAnimationFrame(typeRafId.current);
    };
  }, [enabled, scheduleTick, setCursorLabel, clearCursorLabel]);

  const showLabel = Boolean(label?.text) && !labelSuppressed && visible;
  showLabelRef.current = showLabel;

  if (label?.text) heldLabelRef.current = label;
  const visualLabel = label ?? heldLabelRef.current;

  useLayoutEffect(() => {
    setLabelWrapped(Boolean(visualLabel?.text?.includes("\n")));
  }, [visualLabel?.text]);

  useLayoutEffect(() => {
    if (!enabled) return;
    const chip = labelChipRef.current;
    if (!chip) return;

    const updateSize = () => {
      measureLabelChip();
      scheduleTick();
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(chip);
    window.addEventListener("resize", updateSize);
    window.visualViewport?.addEventListener("resize", updateSize);
    window.visualViewport?.addEventListener("scroll", updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
      window.visualViewport?.removeEventListener("resize", updateSize);
      window.visualViewport?.removeEventListener("scroll", updateSize);
    };
  }, [enabled, measureLabelChip, scheduleTick]);

  useLayoutEffect(() => {
    if (!showLabel) {
      labelReady.current = false;
      return;
    }
    measureLabelChip();
    if (!labelReady.current) snapLabelToCursor();
    scheduleTick();
  }, [showLabel, scheduleTick, snapLabelToCursor, measureLabelChip, typedText]);

  useLayoutEffect(() => {
    const cancelType = () => {
      if (typeRafId.current != null) {
        cancelAnimationFrame(typeRafId.current);
        typeRafId.current = null;
      }
    };

    if (!showLabel) {
      cancelType();
      return cancelType;
    }

    const full = label?.text ?? "";
    if (reducedMotion || full.length === 0) {
      setTypedText(full);
      return cancelType;
    }

    const duration = typewriterDuration(full.length);
    const startedAt = performance.now();
    setTypedText("");

    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const count = t >= 1 ? full.length : Math.ceil(t * full.length);
      setTypedText(full.slice(0, count));
      if (t < 1) {
        typeRafId.current = requestAnimationFrame(step);
      } else {
        typeRafId.current = null;
      }
    };

    typeRafId.current = requestAnimationFrame(step);
    return cancelType;
  }, [showLabel, label?.text, reducedMotion]);

  if (!enabled) return null;

  const labelStyle = {
    "--cursor-label-bg": resolveCursorAccent(visualLabel?.accent),
  } as CSSProperties;

  return (
    <div
      ref={cursorRef}
      className="custom-cursor"
      data-visible={visible}
      data-label={showLabel ? "true" : "false"}
      data-mode={cursorMode}
      aria-hidden
    >
      <CursorGlyphStack />
      <div ref={labelFollowRef} className="custom-cursor-label-follow">
        <div
          ref={labelChipRef}
          className="custom-cursor-label"
          data-visible={showLabel ? "true" : "false"}
          data-multiline={
            labelWrapped || visualLabel?.text?.includes("\n") ? "true" : "false"
          }
          style={labelStyle}
        >
          {visualLabel?.icon ? (
            <span className="custom-cursor-label-icon">
              <CursorIconGlyph icon={visualLabel.icon} />
            </span>
          ) : null}
          <span className="custom-cursor-label-text">
            <LabelLines text={typedText} />
          </span>
        </div>
      </div>
    </div>
  );
}

/** Global custom cursor + provider for imperative label control */
export function CustomCursor({ children }: { children?: React.ReactNode }) {
  return (
    <CursorProvider>
      {children}
      <CustomCursorInner />
    </CursorProvider>
  );
}

export type { CursorLabelConfig, CursorIcon, CursorMode };
