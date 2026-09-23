export type BeatId = "kick" | "hats" | "bass" | "melody" | "fill";

export interface BeatPattern {
  id: BeatId;
  name: string;
  /** 16 boolean steps (one bar of 16ths). */
  steps: boolean[];
  /** Optional note per active step (Tone note names). Falls back to defaultNote. */
  notes?: (string | null)[];
  defaultNote: string;
  /** Constrained snippet shown in “View pattern”. */
  snippet: string;
}

export const STEP_COUNT = 16;
export const DEFAULT_BPM = 108;
export const MIN_BPM = 80;
export const MAX_BPM = 140;

/** Static teaser for the collapsed tile face (first 8 of Kick). */
export const TEASER_STEPS = [true, false, false, false, true, false, false, false] as const;

export const BEAT_PATTERNS: BeatPattern[] = [
  {
    id: "kick",
    name: "Kick",
    defaultNote: "C1",
    steps: [
      true, false, false, false,
      true, false, false, true,
      false, false, true, false,
      true, false, false, false,
    ],
    snippet: `// Kick — 16th steps
const kick = [1,0,0,0, 1,0,0,1, 0,0,1,0, 1,0,0,0]
Transport.bpm = 108
MembraneSynth.triggerAttackRelease("C1", "8n")`,
  },
  {
    id: "hats",
    name: "Hats",
    defaultNote: "C3",
    steps: [
      false, false, true, false,
      false, false, true, false,
      false, false, true, false,
      false, true, true, false,
    ],
    snippet: `// Hats — closed metal ticks
const hats = [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,1,1,0]
MetalSynth.triggerAttackRelease("16n")`,
  },
  {
    id: "bass",
    name: "Bass",
    defaultNote: "C2",
    steps: [
      true, false, false, true,
      false, false, true, false,
      false, true, false, false,
      true, false, false, false,
    ],
    notes: [
      "C2", null, null, "G1",
      null, null, "A#1", null,
      null, "G1", null, null,
      "C2", null, null, null,
    ],
    snippet: `// Bass — mono pulse
const bass = [
  "C2", null, null, "G1",
  null, null, "A#1", null,
  null, "G1", null, null,
  "C2", null, null, null,
]
MonoSynth.triggerAttackRelease(note, "8n")`,
  },
  {
    id: "melody",
    name: "Melody",
    defaultNote: "G4",
    steps: [
      true, false, true, false,
      false, true, false, false,
      true, false, false, true,
      false, true, false, false,
    ],
    notes: [
      "G4", null, "A#4", null,
      null, "C5", null, null,
      "A#4", null, null, "G4",
      null, "F4", null, null,
    ],
    snippet: `// Melody — soft triangle lead
const melody = [
  "G4", null, "A#4", null,
  null, "C5", null, null,
  "A#4", null, null, "G4",
  null, "F4", null, null,
]
Synth.triggerAttackRelease(note, "8n")`,
  },
  {
    id: "fill",
    name: "Fill",
    defaultNote: "D2",
    steps: [
      true, true, false, true,
      false, true, true, false,
      true, false, true, true,
      true, true, true, true,
    ],
    notes: [
      "D2", "F2", null, "A2",
      null, "D2", "F2", null,
      "A2", null, "C3", "D3",
      "F3", "A3", "C4", "D4",
    ],
    snippet: `// Fill — rising tom roll into bar end
const fill = [
  "D2","F2",null,"A2",
  null,"D2","F2",null,
  "A2",null,"C3","D3",
  "F3","A3","C4","D4",
]
MembraneSynth.triggerAttackRelease(note, "16n")`,
  },
];

export function cloneSteps(steps: boolean[]): boolean[] {
  return steps.slice();
}

export function patternById(id: BeatId): BeatPattern {
  const found = BEAT_PATTERNS.find((p) => p.id === id);
  if (!found) return BEAT_PATTERNS[0];
  return found;
}
