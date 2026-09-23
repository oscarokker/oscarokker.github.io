export type CompositionId =
  | "house"
  | "rock"
  | "firecracker"
  | "sixteen"
  | "weird";

export interface Composition {
  id: CompositionId;
  /** Studio nickname shown on the tab. */
  name: string;
  /** Workshop-derived placeholder Strudel source (Oscar finals later). */
  source: string;
}

/** Static mini-notation teaser for the collapsed face — not live audio. */
export const TEASER_NOTATION = 's("bd sd hh")';

/**
 * Five compositions — workshop placeholders from
 * https://strudel.cc/workshop/first-sounds/
 * Oscar owns final strings; Reset restores these.
 */
export const COMPOSITIONS: Composition[] = [
  {
    id: "house",
    name: "House",
    source: `// Classic house — workshop TR909
sound("bd*4, [- cp]*2, [- hh]*4").bank("RolandTR909")`,
  },
  {
    id: "rock",
    name: "Rock",
    source: `// Basic rock beat — workshop TR505
setcpm(100/4)
sound("[bd sd]*2, hh*8").bank("RolandTR505")`,
  },
  {
    id: "firecracker",
    name: "Firecracker",
    source: `// YMO Firecracker spirit — workshop
setcpm(120/2)
sound("bd sd, - - - hh - hh - -, - perc - perc:1*2")
.bank("RolandCompurhythm1000")`,
  },
  {
    id: "sixteen",
    name: "Sixteen",
    source: `// 16-step sequencer imitation — workshop
setcpm(90/4)
sound(\`
[-  -  oh - ] [-  -  -  - ] [-  -  -  - ] [-  -  -  - ],
[hh hh -  - ] [hh -  hh - ] [hh -  hh - ] [hh -  hh - ],
[-  -  -  - ] [cp -  -  - ] [-  -  -  - ] [cp -  -  - ],
[bd -  -  - ] [-  -  -  bd] [-  -  bd - ] [-  -  -  bd]
\`)`,
  },
  {
    id: "weird",
    name: "Texture",
    source: `// Not your average drums — workshop
setcpm(100/2)
s(\`jazz*2,
insect [crow metal] - -,
- space:4 - space:1,
- wind\`)`,
  },
];

export function compositionById(id: CompositionId): Composition {
  return COMPOSITIONS.find((c) => c.id === id) ?? COMPOSITIONS[0];
}

export function initialSourceMap(): Record<CompositionId, string> {
  const map = {} as Record<CompositionId, string>;
  for (const c of COMPOSITIONS) {
    map[c.id] = c.source;
  }
  return map;
}
