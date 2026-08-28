const RIPPLE_CLASS = "social-ripple";

export function spawnClickRipple(
  host: HTMLElement | null | undefined,
  point: { clientX: number; clientY: number },
) {
  if (!host) return;

  const rect = host.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = RIPPLE_CLASS;
  ripple.style.left = `${point.clientX - rect.left}px`;
  ripple.style.top = `${point.clientY - rect.top}px`;
  host.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
}

/** Ripple on a grid tile’s inner surface so chrome icons stay above it. */
export function spawnTileClickRipple(
  card: HTMLElement | null | undefined,
  point: { clientX: number; clientY: number },
) {
  if (!card) return;
  const host =
    card.querySelector<HTMLElement>(".tile-card-inner") ?? card;
  spawnClickRipple(host, point);
}
