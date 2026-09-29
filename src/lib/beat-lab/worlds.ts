import type { CompositionId } from "@/lib/beat-lab/compositions";

export interface WorldMark {
  line1: string;
  line2?: string;
}

export interface WorldConfig {
  id: CompositionId;
  /** Tab label (mock spelling). */
  label: string;
  mark: WorldMark;
}

export const WORLDS: WorldConfig[] = [
  {
    id: "neo-trance",
    label: "neo.trance",
    mark: { line1: "HYPERTRANCE", line2: "SAMPLEPACK" },
  },
  {
    id: "botanica",
    label: "botanica",
    mark: { line1: "botanica", line2: "infinite meadow" },
  },
  {
    id: "utopia-os",
    label: "utopiaOS",
    mark: { line1: "utopia", line2: ".os" },
  },
  {
    id: "breakcore",
    label: "break(core)",
    mark: { line1: "break", line2: "(core)" },
  },
];

export function worldById(id: CompositionId): WorldConfig {
  return WORLDS.find((w) => w.id === id) ?? WORLDS[0];
}
