let loadPromise: Promise<void> | null = null;

/** Lazy-load JetBrains Mono on first Ghostlink expand (not homepage critical path). */
export function ensureJetBrainsMono(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = import("@fontsource/jetbrains-mono/400.css")
    .then(() => import("@fontsource/jetbrains-mono/500.css"))
    .then(() => undefined);
  return loadPromise;
}
