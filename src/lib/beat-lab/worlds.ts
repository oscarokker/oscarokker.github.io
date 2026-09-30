import type { CompositionId } from "@/lib/beat-lab/compositions";

export interface WorldConfig {
  id: CompositionId;
  /** Tab label (mock spelling). */
  label: string;
}

export const WORLDS: WorldConfig[] = [
  {
    id: "neo-trance",
    label: "neo.trance",
  },
  {
    id: "botanica",
    label: "botanica",
  },
  {
    id: "utopia-os",
    label: "utopiaOS",
  },
  {
    id: "breakcore",
    label: "break(core)",
  },
];
