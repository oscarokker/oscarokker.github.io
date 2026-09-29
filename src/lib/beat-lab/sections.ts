import type { CompositionId } from "@/lib/beat-lab/compositions";

export type SectionId = "intro" | "groove" | "build" | "drop" | "outro";

export interface SongSection {
  id: SectionId;
  /** UI label (genre-flavored but utilitarian). */
  label: string;
  /** Strudel cycles (loops) before auto-advance while playing. */
  loops: number;
  source: string;
}

export interface SectionalScore {
  compositionId: CompositionId;
  sections: SongSection[];
}

export function sectionEditKey(
  compositionId: CompositionId,
  sectionId: SectionId,
): string {
  return `${compositionId}:${sectionId}`;
}

const HOUSE_SECTIONS: SongSection[] = [
  {
    id: "intro",
    label: "Intro",
    loops: 6,
    source: `// House — intro (kick only)
sound("bd*4").bank("RolandTR909")`,
  },
  {
    id: "groove",
    label: "Groove",
    loops: 8,
    source: `// Classic house — workshop TR909
sound("bd*4, [- cp]*2, [- hh]*4").bank("RolandTR909")`,
  },
  {
    id: "build",
    label: "Build",
    loops: 6,
    source: `// House — build (open hat + clap)
sound("bd*4, cp*2, hh*8").bank("RolandTR909")`,
  },
  {
    id: "drop",
    label: "Drop",
    loops: 8,
    source: `// House — drop (full pattern, busier hats)
sound("bd*4, cp*2, hh*16").bank("RolandTR909")`,
  },
  {
    id: "outro",
    label: "Outro",
    loops: 6,
    source: `// House — outro (kick + sparse hat)
sound("bd*4, [- - - hh]*2").bank("RolandTR909")`,
  },
];

const ROCK_SECTIONS: SongSection[] = [
  {
    id: "intro",
    label: "Intro",
    loops: 6,
    source: `// Rock — intro (kick pulse)
setcpm(100/4)
sound("bd*4").bank("RolandTR505")`,
  },
  {
    id: "groove",
    label: "Groove",
    loops: 8,
    source: `// Basic rock beat — workshop TR505
setcpm(100/4)
sound("[bd sd]*2, hh*8").bank("RolandTR505")`,
  },
  {
    id: "build",
    label: "Build",
    loops: 6,
    source: `// Rock — build (snare rolls in)
setcpm(100/4)
sound("[bd sd sd]*2, hh*8").bank("RolandTR505")`,
  },
  {
    id: "drop",
    label: "Drop",
    loops: 8,
    source: `// Rock — drop (full kit)
setcpm(100/4)
sound("[bd sd]*2, hh*16, [- cp]*2").bank("RolandTR505")`,
  },
  {
    id: "outro",
    label: "Outro",
    loops: 6,
    source: `// Rock — outro (kick + hat)
setcpm(100/4)
sound("bd*4, hh*4").bank("RolandTR505")`,
  },
];

const FIRECRACKER_SECTIONS: SongSection[] = [
  {
    id: "intro",
    label: "Intro",
    loops: 6,
    source: `// Firecracker — intro
setcpm(120/2)
sound("bd sd").bank("RolandCompurhythm1000")`,
  },
  {
    id: "groove",
    label: "Groove",
    loops: 8,
    source: `// YMO Firecracker spirit — workshop
setcpm(120/2)
sound("bd sd, - - - hh - hh - -, - perc - perc:1*2")
.bank("RolandCompurhythm1000")`,
  },
  {
    id: "build",
    label: "Build",
    loops: 6,
    source: `// Firecracker — build (denser hats)
setcpm(120/2)
sound("bd sd, hh*4, - perc - perc:1*2")
.bank("RolandCompurhythm1000")`,
  },
  {
    id: "drop",
    label: "Drop",
    loops: 8,
    source: `// Firecracker — drop (full)
setcpm(120/2)
sound("bd sd, hh*8, perc*2, perc:1*4")
.bank("RolandCompurhythm1000")`,
  },
  {
    id: "outro",
    label: "Outro",
    loops: 6,
    source: `// Firecracker — outro
setcpm(120/2)
sound("bd - bd -, hh*2")
.bank("RolandCompurhythm1000")`,
  },
];

const SIXTEEN_SECTIONS: SongSection[] = [
  {
    id: "intro",
    label: "Intro",
    loops: 6,
    source: `// Sixteen — intro (hats only)
setcpm(90/4)
sound(\`
[hh hh -  - ] [hh -  hh - ] [hh -  hh - ] [hh -  hh - ]
\`)`,
  },
  {
    id: "groove",
    label: "Groove",
    loops: 8,
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
    id: "build",
    label: "Build",
    loops: 6,
    source: `// Sixteen — build (add claps)
setcpm(90/4)
sound(\`
[-  -  oh - ] [-  -  -  - ] [-  -  -  - ] [-  -  -  - ],
[hh hh -  - ] [hh -  hh - ] [hh -  hh - ] [hh -  hh - ],
[cp -  -  - ] [cp -  -  - ] [cp -  -  - ] [cp -  -  - ],
[bd -  -  - ] [-  -  -  bd] [-  -  bd - ] [-  -  -  bd]
\`)`,
  },
  {
    id: "drop",
    label: "Drop",
    loops: 8,
    source: `// Sixteen — drop (full grid)
setcpm(90/4)
sound(\`
[-  -  oh - ] [oh -  -  - ] [-  -  oh - ] [-  -  -  - ],
[hh hh hh hh] [hh hh hh hh] [hh hh hh hh] [hh hh hh hh],
[cp -  -  - ] [cp -  cp - ] [-  -  cp - ] [cp -  -  - ],
[bd -  -  - ] [bd -  -  bd] [bd -  bd - ] [bd -  -  bd]
\`)`,
  },
  {
    id: "outro",
    label: "Outro",
    loops: 6,
    source: `// Sixteen — outro
setcpm(90/4)
sound(\`
[-  -  -  - ] [-  -  -  - ] [-  -  -  - ] [-  -  -  - ],
[hh -  -  - ] [-  -  hh - ] [-  -  -  - ] [-  -  hh - ],
[-  -  -  - ] [-  -  -  - ] [-  -  -  - ] [-  -  -  - ],
[bd -  -  - ] [-  -  -  - ] [-  -  -  - ] [-  -  -  - ]
\`)`,
  },
];

const TEXTURE_SECTIONS: SongSection[] = [
  {
    id: "intro",
    label: "Intro",
    loops: 6,
    source: `// Texture — intro (wind)
setcpm(100/2)
s("wind")`,
  },
  {
    id: "groove",
    label: "Groove",
    loops: 8,
    source: `// Not your average drums — workshop
setcpm(100/2)
s(\`jazz*2,
insect [crow metal] - -,
- space:4 - space:1,
- wind\`)`,
  },
  {
    id: "build",
    label: "Build",
    loops: 6,
    source: `// Texture — build (more insect)
setcpm(100/2)
s(\`jazz*4,
insect*2 [crow metal] - -,
- space:4 - space:1,
wind\`)`,
  },
  {
    id: "drop",
    label: "Drop",
    loops: 8,
    source: `// Texture — drop (full stack)
setcpm(100/2)
s(\`jazz*4,
insect*2 crow metal*2,
space:4 space:1,
wind*2\`)`,
  },
  {
    id: "outro",
    label: "Outro",
    loops: 6,
    source: `// Texture — outro
setcpm(100/2)
s("space:4, wind")`,
  },
];

const TRANCE_SECTIONS: SongSection[] = [
  {
    id: "intro",
    label: "Intro",
    loops: 8,
    source: `setcpm(132/4)

register('acidenv', (x, pat) => pat.lpf(100)
  .lpenv(x * 9).lps(.2).lpd(.12)
)

$: n("<0 4 0 9>*8".add("<7 _ _ 6>*2")).scale("g:minor").trans(-12)
  .o(3).s("sawtooth").acidenv(slider(0.35))
  .delay(.6).pan(rand)

$: s("white!4").att(.4).o(6).acidenv(slider(0.4))

$: s("bd:2!4")
  .duck("3:4:5:6")
  .duckdepth(.8)
  .duckattack(.16)`,
  },
  {
    id: "groove",
    label: "Groove",
    loops: 10,
    source: `setcpm(132/4)

register('acidenv', (x, pat) => pat.lpf(100)
  .lpenv(x * 9).lps(.2).lpd(.12)
)

$: n("<0 4 0 9 7>*16".add("<7 _ _ 6 5 _ _ 6>*2")).scale("g:minor").trans(-12)
  .o(3).s("sawtooth").acidenv(slider(0.65))
  .delay(.6).pan(rand)

$: sound("rd rd <rd hh> rd").acidenv(slider(0.7))
  .delay(0.32)

$: s("bd:2!4")
  .duck("3:4:5:6")
  .duckdepth(.8)
  .duckattack(.16)`,
  },
  {
    id: "build",
    label: "Build",
    loops: 8,
    source: `setcpm(132/4)

register('acidenv', (x, pat) => pat.lpf(100)
  .lpenv(x * 9).lps(.2).lpd(.12)
)

$: n("<0 4 0 9 7>*16".add("<7 _ _ 6 5 _ _ 6>*2")).scale("g:minor").trans(-12)
  .o(3).s("sawtooth").acidenv(slider(0.85))
  .delay(.6).pan(rand)

$: n("<7 _ _ 6 5 _ <5 3> <6 4>>*2").scale("g:minor").trans(-24)
  .detune(rand)
  .o(4).s("sawtooth").acidenv(slider(0.75))

$: sound("rd rd <rd hh> rd").acidenv(slider(0.88))
  .delay(0.32)

$_: s("hh:9!2").fit().o(8)

$: s("bd:2!4")
  .duck("3:4:5:6")
  .duckdepth(.8)
  .duckattack(.16)`,
  },
  {
    id: "drop",
    label: "Drop",
    loops: 10,
    source: `setcpm(132/4)

register('acidenv', (x, pat) => pat.lpf(100)
  .lpenv(x * 9).lps(.2).lpd(.12)
)

$: n("<0 4 0 9 7>*16".add("<7 _ _ 6 5 _ _ 6>*2")).scale("g:minor").trans(-12)
  .o(3).s("sawtooth").acidenv(slider(1))
  .delay(.6).pan(rand)
  ._pianoroll()

$: n("<7 _ _ 6 5 _ <5 3> <6 4>>*2").scale("g:minor").trans(-24)
  .detune(rand)
  .o(4).s("sawtooth").acidenv(slider(1))
  ._pianoroll()

$: s("white!4").att(.4).o(6).acidenv(slider(0.8))

$: sound("rd rd <rd hh> rd").acidenv(slider(0.96))
  .delay(0.32)
  ._scope()

$_: s("hh:9!2").fit().o(8)

$: s("bd:2!4")
  .duck("3:4:5:6")
  .duckdepth(.8)
  .duckattack(.16)
  ._scope()`,
  },
  {
    id: "outro",
    label: "Outro",
    loops: 8,
    source: `setcpm(132/4)

register('acidenv', (x, pat) => pat.lpf(100)
  .lpenv(x * 9).lps(.2).lpd(.12)
)

$: n("<0 4>*8").scale("g:minor").trans(-12)
  .o(3).s("sawtooth").acidenv(slider(0.25))
  .delay(.8).pan(rand)

$: s("white!4").att(.6).o(6).acidenv(slider(0.3))

$: sound("rd - rd -").acidenv(slider(0.5))
  .delay(0.4)`,
  },
];

export const SECTIONAL_SCORES: Record<CompositionId, SectionalScore> = {
  house: { compositionId: "house", sections: HOUSE_SECTIONS },
  rock: { compositionId: "rock", sections: ROCK_SECTIONS },
  firecracker: { compositionId: "firecracker", sections: FIRECRACKER_SECTIONS },
  sixteen: { compositionId: "sixteen", sections: SIXTEEN_SECTIONS },
  weird: { compositionId: "weird", sections: TEXTURE_SECTIONS },
  trance: { compositionId: "trance", sections: TRANCE_SECTIONS },
};

export function sectionsFor(compositionId: CompositionId): SongSection[] {
  return SECTIONAL_SCORES[compositionId].sections;
}

export function defaultSectionSource(
  compositionId: CompositionId,
  sectionId: SectionId,
): string {
  const section = sectionsFor(compositionId).find((s) => s.id === sectionId);
  return section?.source ?? sectionsFor(compositionId)[0].source;
}

/** Authored “full” pattern — groove section (Reset track / legacy tab default). */
export function authoredGrooveSource(compositionId: CompositionId): string {
  return defaultSectionSource(compositionId, "groove");
}
