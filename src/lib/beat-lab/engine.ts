/**
 * Ghostlink Strudel island.
 *
 * Dynamic-imported only from the expanded tile (never homepage critical path).
 * Samples: dirt-samples (github) + tidal-drum-machines (strudel.cc map +
 * geikha/tidal-drum-machines WAV base) — reliable CORS from GitHub Pages.
 */

export type StrudelModule = typeof import("@strudel/web");

/** Repl instance returned by `initStrudel` (scheduler + evaluate). */
export type StrudelRepl = {
  scheduler: { now: () => number };
  evaluate: (
    code: string,
    autostart?: boolean,
    hushBeforeEval?: boolean,
  ) => Promise<unknown>;
};

let strudelMod: StrudelModule | null = null;
let strudelRepl: StrudelRepl | null = null;
let initPromise: Promise<StrudelModule> | null = null;
let disposed = false;
/** Audio mute only. Transport uses AudioContext.currentTime, so we never suspend to mute. */
let audioMuted = true;

/**
 * Strudel's transpiler rewrites `slider(n)` → `sliderWithID(id, n)`.
 * The REPL UI normally provides that helper; this embed does not.
 * Return the authored value so patterns evaluate and the channel can live.
 */
function installSliderPolyfill(): void {
  const sliderWithID = (
    _id: unknown,
    value: number,
    _min?: number,
    _max?: number,
  ) => value;
  const scope = globalThis as typeof globalThis & {
    sliderWithID?: typeof sliderWithID;
    slider?: (value: number, min?: number, max?: number) => number;
  };
  scope.sliderWithID = sliderWithID;
  scope.slider = (value: number) => value;
}

const DIRT_SAMPLES = "github:tidalcycles/dirt-samples";
const DRUM_MACHINES_JSON = "https://strudel.cc/tidal-drum-machines.json";
const DRUM_MACHINES_BASE =
  "github:geikha/tidal-drum-machines/main/machines/";

async function loadAndInit(): Promise<StrudelModule> {
  const mod = await import("@strudel/web");
  installSliderPolyfill();
  strudelRepl = (await mod.initStrudel({
    prebake: async () => {
      // Default drum/texture samples (bd, sd, hh, jazz, insect, …).
      await mod.samples(DIRT_SAMPLES);
      // Banked machines for .bank("RolandTR909") etc.
      await mod.samples(DRUM_MACHINES_JSON, DRUM_MACHINES_BASE);
    },
  })) as StrudelRepl;
  if (typeof mod.evalScope === "function") {
    await mod.evalScope({
      sliderWithID: (
        _id: unknown,
        value: number,
        _min?: number,
        _max?: number,
      ) => value,
      slider: (value: number) => value,
    });
  }
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

export async function evaluateCode(
  code: string,
  options?: { hushBeforeEval?: boolean },
): Promise<void> {
  await ensureStrudel();
  if (disposed) return;
  const hushFirst = options?.hushBeforeEval ?? true;
  if (strudelRepl) {
    await strudelRepl.evaluate(code, true, hushFirst);
    // hush/eval can recreate the output graph; keep the mute gain applied.
    if (strudelMod) applyMasterGain(strudelMod);
    return;
  }
  const mod = strudelMod;
  if (!mod) return;
  await mod.evaluate(code);
}

/** Current Strudel cycle (transport). Returns 0 when scheduler is idle. */
export async function getTransportCycle(): Promise<number> {
  await ensureStrudel();
  try {
    return strudelRepl?.scheduler.now() ?? 0;
  } catch {
    return 0;
  }
}

export function hush(): void {
  try {
    strudelMod?.hush();
  } catch {
    /* repl may not be ready */
  }
}

function applyMasterGain(mod: StrudelModule): void {
  const ctx = mod.getAudioContext();
  const gain = mod.getSuperdoughAudioController?.()?.output?.destinationGain;
  if (!gain) return;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(audioMuted ? 0 : 1, now);
}

/**
 * Mute is gain-only. Suspending the AudioContext freezes `currentTime`,
 * which is the Strudel transport clock — that would pause sections while muted.
 * Resume even when muted so the living channel keeps advancing in silence.
 */
export async function setMuted(muted: boolean): Promise<void> {
  audioMuted = muted;
  try {
    const mod = strudelMod ?? (await ensureStrudel());
    const ctx = mod.getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    applyMasterGain(mod);
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
