const RIPPLE_CLASS = "social-ripple";

export function spawnClickRipple(
  host: HTMLElement | null | undefined,
  point: { clientX: number; clientY: number },
): HTMLElement | null {
  if (!host) return null;

  const rect = host.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = RIPPLE_CLASS;
  ripple.style.left = `${point.clientX - rect.left}px`;
  ripple.style.top = `${point.clientY - rect.top}px`;
  host.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  return ripple;
}

/** Remove a ripple element immediately. */
export function removeRipple(ripple: HTMLElement | null) {
  if (!ripple || !ripple.parentNode) return;
  ripple.remove();
}

/** Ripple on a grid tile’s inner surface so chrome icons stay above it. */
export function spawnTileClickRipple(
  card: HTMLElement | null | undefined,
  point: { clientX: number; clientY: number },
): HTMLElement | null {
  if (!card) return null;
  const host =
    card.querySelector<HTMLElement>(".tile-card-inner") ?? card;
  return spawnClickRipple(host, point);
}
