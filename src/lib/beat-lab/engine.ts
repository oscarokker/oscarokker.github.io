import type { BeatId, BeatPattern } from "@/lib/beat-lab/patterns";
import {
  DEFAULT_BPM,
  MAX_BPM,
  MIN_BPM,
  STEP_COUNT,
  patternById,
} from "@/lib/beat-lab/patterns";

type ToneModule = typeof import("tone");

export type BeatLabPlayState = "idle" | "loading" | "ready" | "playing";

/**
 * Client-only Tone.js island for the Beat lab tile.
 * Dynamic-import Tone on first use; never call Tone.start() except inside Play.
 */
export class BeatLabEngine {
  private tone: ToneModule | null = null;
  private loadPromise: Promise<ToneModule> | null = null;
  private kick: InstanceType<ToneModule["MembraneSynth"]> | null = null;
  private hats: InstanceType<ToneModule["MetalSynth"]> | null = null;
  private bass: InstanceType<ToneModule["MonoSynth"]> | null = null;
  private melody: InstanceType<ToneModule["Synth"]> | null = null;
  private fill: InstanceType<ToneModule["MembraneSynth"]> | null = null;
  private sequence: import("tone").Sequence<number> | null = null;
  private activeBeat: BeatId = "kick";
  private steps: boolean[] = patternById("kick").steps.slice();
  private notes: (string | null)[] | undefined = patternById("kick").notes?.slice();
  private defaultNote = patternById("kick").defaultNote;
  private bpm = DEFAULT_BPM;
  private muted = false;
  private disposed = false;
  private playing = false;

  get isPlaying(): boolean {
    return this.playing;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  get currentBpm(): number {
    return this.bpm;
  }

  async preload(): Promise<void> {
    if (this.disposed) return;
    await this.ensureTone();
  }

  private async ensureTone(): Promise<ToneModule> {
    if (this.tone) return this.tone;
    if (!this.loadPromise) {
      this.loadPromise = import("tone").then((mod) => {
        this.tone = mod;
        return mod;
      });
    }
    return this.loadPromise;
  }

  private buildGraph(Tone: ToneModule): void {
    if (this.kick) return;

    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 4,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.28, sustain: 0, release: 0.08 },
    }).toDestination();

    this.hats = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.08, release: 0.02 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).toDestination();
    this.hats.volume.value = -18;

    this.bass = new Tone.MonoSynth({
      oscillator: { type: "square" },
      filter: { Q: 2, type: "lowpass", rolloff: -24 },
      envelope: { attack: 0.01, decay: 0.18, sustain: 0.2, release: 0.12 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.12,
        sustain: 0.2,
        release: 0.12,
        baseFrequency: 80,
        octaves: 2.2,
      },
    }).toDestination();
    this.bass.volume.value = -8;

    this.melody = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.15, release: 0.3 },
    }).toDestination();
    this.melody.volume.value = -12;

    this.fill = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 2.5,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.08 },
    }).toDestination();
    this.fill.volume.value = -6;

    Tone.getDestination().mute = this.muted;
  }

  private rebuildSequence(Tone: ToneModule): void {
    this.sequence?.dispose();
    const indices = Array.from({ length: STEP_COUNT }, (_, i) => i);
    const sequence = new Tone.Sequence(
      (time, stepIndex) => {
        if (typeof stepIndex !== "number") return;
        if (!this.steps[stepIndex]) return;
        const note =
          this.notes?.[stepIndex] ?? this.defaultNote ?? "C2";
        this.triggerStep(this.activeBeat, note, time);
      },
      indices,
      "16n",
    );
    sequence.loop = true;
    this.sequence = sequence;
  }

  private triggerStep(beat: BeatId, note: string, time: number): void {
    switch (beat) {
      case "kick":
        this.kick?.triggerAttackRelease(note, "8n", time);
        break;
      case "hats":
        this.hats?.triggerAttackRelease(note, "16n", time, 0.6);
        break;
      case "bass":
        this.bass?.triggerAttackRelease(note, "8n", time);
        break;
      case "melody":
        this.melody?.triggerAttackRelease(note, "8n", time);
        break;
      case "fill":
        this.fill?.triggerAttackRelease(note, "16n", time);
        break;
    }
  }

  setBeat(pattern: BeatPattern, steps: boolean[]): void {
    this.activeBeat = pattern.id;
    this.steps = steps.slice(0, STEP_COUNT);
    while (this.steps.length < STEP_COUNT) this.steps.push(false);
    this.notes = pattern.notes?.slice();
    this.defaultNote = pattern.defaultNote;
  }

  setSteps(steps: boolean[]): void {
    this.steps = steps.slice(0, STEP_COUNT);
    while (this.steps.length < STEP_COUNT) this.steps.push(false);
  }

  setTempo(bpm: number): void {
    const clamped = Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
    this.bpm = clamped;
    if (this.tone && !this.disposed) {
      this.tone.getTransport().bpm.value = clamped;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.tone && !this.disposed) {
      this.tone.getDestination().mute = muted;
    }
  }

  /**
   * Must be called from a user-gesture handler (Play click).
   * Unlocks AudioContext via Tone.start() inside that gesture.
   */
  async play(): Promise<void> {
    if (this.disposed) return;
    const Tone = await this.ensureTone();
    this.buildGraph(Tone);
    this.rebuildSequence(Tone);

    await Tone.start();

    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel(0);
    transport.position = 0;
    transport.bpm.value = this.bpm;
    Tone.getDestination().mute = this.muted;

    this.sequence?.start(0);
    transport.start();
    this.playing = true;
  }

  stop(): void {
    if (!this.tone || this.disposed) {
      this.playing = false;
      return;
    }
    const Tone = this.tone;
    try {
      this.sequence?.stop(0);
    } catch {
      /* already stopped */
    }
    try {
      Tone.getTransport().stop();
      Tone.getTransport().cancel(0);
      Tone.getTransport().position = 0;
    } catch {
      /* ignore */
    }
    this.playing = false;
  }

  /**
   * Full teardown: stop Transport, dispose nodes, suspend AudioContext.
   * Safe to call on close / visibility hidden / unmount.
   */
  async teardown(): Promise<void> {
    this.playing = false;
    if (!this.tone) return;
    const Tone = this.tone;

    try {
      this.sequence?.stop(0);
      this.sequence?.dispose();
    } catch {
      /* ignore */
    }
    this.sequence = null;

    try {
      Tone.getTransport().stop();
      Tone.getTransport().cancel(0);
    } catch {
      /* ignore */
    }

    for (const node of [
      this.kick,
      this.hats,
      this.bass,
      this.melody,
      this.fill,
    ]) {
      try {
        node?.dispose();
      } catch {
        /* ignore */
      }
    }
    this.kick = null;
    this.hats = null;
    this.bass = null;
    this.melody = null;
    this.fill = null;

    try {
      Tone.getDestination().mute = false;
    } catch {
      /* ignore */
    }

    try {
      const ctx = Tone.getContext();
      if (ctx.state === "closed") return;
      const raw = ctx.rawContext as AudioContext;
      if (typeof raw.suspend === "function") {
        await raw.suspend();
      }
    } catch {
      /* ignore */
    }
  }

  markDisposed(): void {
    this.disposed = true;
  }
}
