/**
 * Beat lab Strudel island.
 *
 * Dynamic-imported only from the expanded tile (never homepage critical path).
 * Samples: dirt-samples (github) + tidal-drum-machines (strudel.cc map +
 * geikha/tidal-drum-machines WAV base) — reliable CORS from GitHub Pages.
 */

export type StrudelModule = typeof import("@strudel/web");

let strudelMod: StrudelModule | null = null;
let initPromise: Promise<StrudelModule> | null = null;
let disposed = false;

const DIRT_SAMPLES = "github:tidalcycles/dirt-samples";
const DRUM_MACHINES_JSON = "https://strudel.cc/tidal-drum-machines.json";
const DRUM_MACHINES_BASE =
  "github:geikha/tidal-drum-machines/main/machines/";

async function loadAndInit(): Promise<StrudelModule> {
  const mod = await import("@strudel/web");
  await mod.initStrudel({
    prebake: async () => {
      // Default drum/texture samples (bd, sd, hh, jazz, insect, …).
      await mod.samples(DIRT_SAMPLES);
      // Banked machines for .bank("RolandTR909") etc.
      await mod.samples(DRUM_MACHINES_JSON, DRUM_MACHINES_BASE);
    },
  });
  return mod;
}

/** Load @strudel/web + samples once. Safe to call from expand (no sound). */
export async function ensureStrudel(): Promise<StrudelModule> {
  if (disposed) {
    disposed = false;
  }
  if (strudelMod) return strudelMod;
  if (!initPromise) {
    initPromise = loadAndInit()
      .then((mod) => {
        strudelMod = mod;
        return mod;
      })
      .catch((err) => {
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
}

export async function evaluateCode(code: string): Promise<void> {
  const mod = await ensureStrudel();
  if (disposed) return;
  await mod.evaluate(code);
}

export function hush(): void {
  try {
    strudelMod?.hush();
  } catch {
    /* repl may not be ready */
  }
}

export async function setMuted(muted: boolean): Promise<void> {
  try {
    const mod = strudelMod ?? (await ensureStrudel());
    const ctx = mod.getAudioContext();
    if (muted) {
      if (ctx.state === "running") await ctx.suspend();
    } else if (ctx.state === "suspended") {
      await ctx.resume();
    }
  } catch {
    /* ignore */
  }
}

/** Hard teardown — hush + suspend context. No ghost audio. */
export async function teardown(): Promise<void> {
  disposed = true;
  try {
    strudelMod?.hush();
  } catch {
    /* ignore */
  }
  try {
    const ctx = strudelMod?.getAudioContext?.();
    if (ctx && ctx.state === "running") {
      await ctx.suspend();
    }
  } catch {
    /* ignore */
  }
}

export function markDisposed(): void {
  disposed = true;
}

/** Documented sample strategy for PR / DESIGN. */
export const SAMPLE_STRATEGY = {
  dirt: DIRT_SAMPLES,
  drumsJson: DRUM_MACHINES_JSON,
  drumsBase: DRUM_MACHINES_BASE,
} as const;
