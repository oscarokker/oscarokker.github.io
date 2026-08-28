/** Named cursor glyphs. Add a key + asset here, then a matching CSS hotspot. */
export type CursorMode = "default" | "text";

export const CURSOR_MODE_ASSETS: Record<
  CursorMode,
  { src: string; width: number; height: number }
> = {
  default: { src: "/cursor.svg", width: 16, height: 16 },
  text: { src: "/cursor-text-selector.svg", width: 16, height: 16 },
};

/** Readable text hosts — I-beam only when the pointer is over glyphs in these. */
const TEXT_HOST_SELECTOR =
  "p, h1, h2, h3, h4, h5, h6, li, blockquote, figcaption, label, td, th";

/** Chrome that keeps the arrow (and any tooltip), even if it contains text. */
const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "[role='button']",
  "input",
  "textarea",
  "select",
  "summary",
  ".nav-pill",
  ".nav-pill-button",
  ".intro-chrome-icon-btn",
].join(", ");

function caretNodeAt(x: number, y: number): Node | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node } | null;
  };
  if (typeof doc.caretPositionFromPoint === "function") {
    return doc.caretPositionFromPoint(x, y)?.offsetNode ?? null;
  }
  if (typeof document.caretRangeFromPoint === "function") {
    return document.caretRangeFromPoint(x, y)?.startContainer ?? null;
  }
  return null;
}

function isPointOverTextGlyphs(x: number, y: number, textNode: Text): boolean {
  if (!textNode.data.trim()) return false;
  const range = document.createRange();
  range.selectNodeContents(textNode);
  for (const rect of range.getClientRects()) {
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return true;
    }
  }
  return false;
}

/** Resolve mode from the element under the pointer (not event.target). */
export function resolveCursorMode(x: number, y: number): CursorMode {
  const hit = document.elementFromPoint(x, y);
  if (!hit || hit.closest(".custom-cursor")) return "default";
  if (hit.closest(INTERACTIVE_SELECTOR)) return "default";

  const host = hit.closest(TEXT_HOST_SELECTOR);
  if (!host) return "default";

  const caret = caretNodeAt(x, y);
  if (!(caret instanceof Text) || !host.contains(caret)) return "default";
  if (caret.parentElement?.closest(INTERACTIVE_SELECTOR)) return "default";
  if (!isPointOverTextGlyphs(x, y, caret)) return "default";

  return "text";
}
