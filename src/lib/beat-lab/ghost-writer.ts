/**
 * Applies ghost rewrites to the editor (instant or short typewriter).
 */

export interface GhostApplyOptions {
  reducedMotion: boolean;
  onProgress?: (partial: string) => void;
}

export async function applyGhostRewrite(
  target: string,
  apply: (value: string) => void,
  options: GhostApplyOptions,
): Promise<void> {
  if (options.reducedMotion || target.length < 24) {
    apply(target);
    return;
  }

  const chunk = Math.max(12, Math.floor(target.length / 28));
  let i = 0;
  apply(target.slice(0, Math.min(chunk, target.length)));

  await new Promise<void>((resolve) => {
    const step = () => {
      i += chunk;
      if (i >= target.length) {
        apply(target);
        resolve();
        return;
      }
      const partial = target.slice(0, i);
      apply(partial);
      options.onProgress?.(partial);
      window.setTimeout(step, 12);
    };
    window.setTimeout(step, 12);
  });
}

export function cyclesCompletedInSection(
  nowCycle: number,
  sectionStartCycle: number,
): number {
  const elapsed = nowCycle - sectionStartCycle;
  if (!Number.isFinite(elapsed) || elapsed < 0) return 0;
  return Math.floor(elapsed);
}

export function shouldAdvanceSection(
  nowCycle: number,
  sectionStartCycle: number,
  loopsRequired: number,
): boolean {
  return cyclesCompletedInSection(nowCycle, sectionStartCycle) >= loopsRequired;
}
