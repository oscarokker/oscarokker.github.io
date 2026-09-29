import type { CompositionId } from "@/lib/beat-lab/compositions";

export type SectionId =
  | "intro"
  | "build-up"
  | "chorus-1"
  | "breakdown"
  | "chorus-2"
  | "bridge"
  | "chorus-3"
  | "outro"
  | "groove"
  | "build"
  | "drop";

export interface SongSection {
  id: SectionId;
  label: string;
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

const ACID_ENV = `register('acidenv', (x, pat) => pat.lpf(100)
  .lpenv(x * 9).lps(.2).lpd(.12)
)`;

const NEO_TRANSE_SECTIONS: SongSection[] = [
  {
    id: "intro",
    label: "intro",
    loops: 8,
    source: `setcpm(136/4)

${ACID_ENV}

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
    id: "build-up",
    label: "build-up",
    loops: 8,
    source: `setcpm(136/4)

${ACID_ENV}

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
    id: "chorus-1",
    label: "chorus",
    loops: 10,
    source: `setcpm(136/4)

${ACID_ENV}

$: n("<0 4 0 9 7>*16".add("<7 _ _ 6 5 _ _ 6>*2")).scale("g:minor").trans(-12)
  .o(3).s("sawtooth").acidenv(slider(0.85))
  .delay(.6).pan(rand)
  ._pianoroll()

$: n("<7 _ _ 6 5 _ <5 3> <6 4>>*2").scale("g:minor").trans(-24)
  .detune(rand)
  .o(4).s("sawtooth").acidenv(slider(0.75))
  ._pianoroll()

$: sound("rd rd <rd hh> rd").acidenv(slider(0.88))
  .delay(0.32)

$_: s("hh:9!2").fit().o(8)

$: s("bd:2!4")
  .duck("3:4:5:6")
  .duckdepth(.8)
  .duckattack(.16)`,
  },
  {
    id: "breakdown",
    label: "breakdown",
    loops: 8,
    source: `setcpm(136/4)

${ACID_ENV}

$: n("<0 4>*8").scale("g:minor").trans(-12)
  .o(3).s("sawtooth").acidenv(slider(0.3))
  .delay(.8).pan(rand)

$: s("white!4").att(.6).o(6).acidenv(slider(0.35))

$: sound("rd - rd -").acidenv(slider(0.45))
  .delay(0.4)`,
  },
  {
    id: "chorus-2",
    label: "chorus",
    loops: 10,
    source: `setcpm(136/4)

${ACID_ENV}

$: n("<0 4 0 9 7>*16".add("<7 _ _ 6 5 _ _ 6>*2")).scale("g:minor").trans(-12)
  .o(3).s("sawtooth").acidenv(slider(0.92))
  .delay(.6).pan(rand)
  ._pianoroll()

$: n("<7 _ _ 6 5 _ <5 3> <6 4>>*2").scale("g:minor").trans(-24)
  .detune(rand)
  .o(4).s("sawtooth").acidenv(slider(0.82))
  ._pianoroll()

$: sound("rd rd <rd hh> rd").acidenv(slider(0.9))
  .delay(0.32)

$: s("bd:2!4")
  .duck("3:4:5:6")
  .duckdepth(.8)
  .duckattack(.16)`,
  },
  {
    id: "bridge",
    label: "bridge",
    loops: 8,
    source: `setcpm(136/4)

${ACID_ENV}

$: n("<7 _ _ 6 5 _ <5 3> <6 4>>*2").scale("g:minor").trans(-24)
  .detune(rand)
  .o(4).s("sawtooth").acidenv(slider(0.55))
  .delay(.5)

$: sound("rd - <rd hh> -").acidenv(slider(0.6))
  .delay(0.45)

$_: s("hh:9!2").fit().o(8)`,
  },
  {
    id: "chorus-3",
    label: "chorus",
    loops: 10,
    source: `setcpm(136/4)

${ACID_ENV}

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
    label: "outro",
    loops: 8,
    source: `setcpm(136/4)

${ACID_ENV}

$: n("<0 4>*8").scale("g:minor").trans(-12)
  .o(3).s("sawtooth").acidenv(slider(0.25))
  .delay(.8).pan(rand)

$: s("white!4").att(.6).o(6).acidenv(slider(0.3))

$: sound("rd - rd -").acidenv(slider(0.5))
  .delay(0.4)`,
  },
];

const BOTANICA_SECTIONS: SongSection[] = [
  {
    id: "intro",
    label: "intro",
    loops: 6,
    source: `setcpm(100/2)
s("wind")`,
  },
  {
    id: "build-up",
    label: "build-up",
    loops: 8,
    source: `setcpm(100/2)
s(\`jazz*2,
insect [crow metal] - -,
- space:4 - space:1,
- wind\`)`,
  },
  {
    id: "chorus-1",
    label: "chorus",
    loops: 8,
    source: `setcpm(100/2)
s(\`jazz*4,
insect*2 [crow metal] - -,
- space:4 - space:1,
wind\`)`,
  },
  {
    id: "breakdown",
    label: "breakdown",
    loops: 6,
    source: `setcpm(100/2)
s("space:4, wind, jazz")`,
  },
  {
    id: "outro",
    label: "outro",
    loops: 6,
    source: `setcpm(100/2)
s("space:4, wind")`,
  },
];

const UTOPIA_SECTIONS: SongSection[] = [
  {
    id: "intro",
    label: "intro",
    loops: 6,
    source: `setcpm(90/4)
sound(\`
[hh hh -  - ] [hh -  hh - ] [hh -  hh - ] [hh -  hh - ]
\`)`,
  },
  {
    id: "build-up",
    label: "build-up",
    loops: 8,
    source: `setcpm(90/4)
sound(\`
[-  -  oh - ] [-  -  -  - ] [-  -  -  - ] [-  -  -  - ],
[hh hh -  - ] [hh -  hh - ] [hh -  hh - ] [hh -  hh - ],
[-  -  -  - ] [cp -  -  - ] [-  -  -  - ] [cp -  -  - ],
[bd -  -  - ] [-  -  -  bd] [-  -  bd - ] [-  -  -  bd]
\`)`,
  },
  {
    id: "chorus-1",
    label: "chorus",
    loops: 8,
    source: `setcpm(90/4)
sound(\`
[-  -  oh - ] [oh -  -  - ] [-  -  oh - ] [-  -  -  - ],
[hh hh hh hh] [hh hh hh hh] [hh hh hh hh] [hh hh hh hh],
[cp -  -  - ] [cp -  cp - ] [-  -  cp - ] [cp -  -  - ],
[bd -  -  - ] [bd -  -  bd] [bd -  bd - ] [bd -  -  bd]
\`)`,
  },
  {
    id: "bridge",
    label: "bridge",
    loops: 6,
    source: `setcpm(90/4)
sound(\`
[-  -  oh - ] [-  -  -  - ] [-  -  -  - ] [-  -  -  - ],
[hh hh -  - ] [hh -  hh - ] [hh -  hh - ] [hh -  hh - ],
[cp -  -  - ] [cp -  -  - ] [cp -  -  - ] [cp -  -  - ],
[bd -  -  - ] [-  -  -  bd] [-  -  bd - ] [-  -  -  bd]
\`)`,
  },
  {
    id: "outro",
    label: "outro",
    loops: 6,
    source: `setcpm(90/4)
sound(\`
[-  -  -  - ] [-  -  -  - ] [-  -  -  - ] [-  -  -  - ],
[hh -  -  - ] [-  -  hh - ] [-  -  -  - ] [-  -  hh - ],
[-  -  -  - ] [-  -  -  - ] [-  -  -  - ] [-  -  -  - ],
[bd -  -  - ] [-  -  -  - ] [-  -  -  - ] [-  -  -  - ]
\`)`,
  },
];

const BREAKCORE_SECTIONS: SongSection[] = [
  {
    id: "intro",
    label: "intro",
    loops: 6,
    source: `setcpm(100/4)
sound("bd*4").bank("RolandTR505")`,
  },
  {
    id: "build-up",
    label: "build-up",
    loops: 8,
    source: `setcpm(100/4)
sound("[bd sd]*2, hh*8").bank("RolandTR505")`,
  },
  {
    id: "chorus-1",
    label: "chorus",
    loops: 8,
    source: `setcpm(120/2)
sound("bd sd, hh*8, perc*2, perc:1*4")
.bank("RolandCompurhythm1000")`,
  },
  {
    id: "breakdown",
    label: "breakdown",
    loops: 6,
    source: `setcpm(100/4)
sound("[bd sd sd]*2, hh*4").bank("RolandTR505")`,
  },
  {
    id: "outro",
    label: "outro",
    loops: 6,
    source: `setcpm(100/4)
sound("bd*4, hh*4").bank("RolandTR505")`,
  },
];

export const SECTIONAL_SCORES: Record<CompositionId, SectionalScore> = {
  "neo-trance": { compositionId: "neo-trance", sections: NEO_TRANSE_SECTIONS },
  botanica: { compositionId: "botanica", sections: BOTANICA_SECTIONS },
  "utopia-os": { compositionId: "utopia-os", sections: UTOPIA_SECTIONS },
  breakcore: { compositionId: "breakcore", sections: BREAKCORE_SECTIONS },
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

export function authoredGrooveSource(compositionId: CompositionId): string {
  const sections = sectionsFor(compositionId);
  const chorus = sections.find((s) => s.id.startsWith("chorus"));
  if (chorus) return chorus.source;
  const groove = sections.find((s) => s.id === "groove" || s.id === "build-up");
  return groove?.source ?? sections[0].source;
}

export function totalSectionLoops(compositionId: CompositionId): number {
  return sectionsFor(compositionId).reduce((sum, s) => sum + s.loops, 0);
}
