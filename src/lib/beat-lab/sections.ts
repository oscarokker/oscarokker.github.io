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
    source: `setcpm(138/4)

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
    source: `setcpm(138/4)

${ACID_ENV}

$: n("<0 4 0 9 7>*16".add("<7 _ _ 6 5 _ _ 6>*2")).scale("g:minor").trans(-12)
  .o(3).s("sawtooth").acidenv(slider(0.65))
  .delay(.6).pan(rand)

$: sound("rd rd <rd hh> rd").bank("RolandTR909").acidenv(slider(0.7))
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
    source: `setcpm(138/4)

${ACID_ENV}

$: n("<0 4 0 9 7>*16".add("<7 _ _ 6 5 _ _ 6>*2")).scale("g:minor").trans(-12)
  .o(3).s("sawtooth").acidenv(slider(0.85))
  .delay(.6).pan(rand)
  ._pianoroll()

$: n("<7 _ _ 6 5 _ <5 3> <6 4>>*2").scale("g:minor").trans(-24)
  .detune(rand)
  .o(4).s("sawtooth").acidenv(slider(0.75))
  ._pianoroll()

$: sound("rd rd <rd hh> rd").bank("RolandTR909").acidenv(slider(0.88))
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
    source: `setcpm(138/4)

${ACID_ENV}

$: n("<0 4>*8").scale("g:minor").trans(-12)
  .o(3).s("sawtooth").acidenv(slider(0.3))
  .delay(.8).pan(rand)

$: s("white!4").att(.6).o(6).acidenv(slider(0.35))

$: sound("rd - rd -").bank("RolandTR909").acidenv(slider(0.45))
  .delay(0.4)

$: s("bd:2!4")
  .gain(0.42)
  .lpf(700)
  .duck("3:4:5:6")
  .duckdepth(.45)
  .duckattack(.2)`,
  },
  {
    id: "chorus-2",
    label: "chorus",
    loops: 10,
    source: `setcpm(138/4)

${ACID_ENV}

$: n("<0 4 0 9 7>*16".add("<7 _ _ 6 5 _ _ 6>*2")).scale("g:minor").trans(-12)
  .o(3).s("sawtooth").acidenv(slider(0.92))
  .delay(.6).pan(rand)
  ._pianoroll()

$: n("<7 _ _ 6 5 _ <5 3> <6 4>>*2").scale("g:minor").trans(-24)
  .detune(rand)
  .o(4).s("sawtooth").acidenv(slider(0.82))
  ._pianoroll()

$: sound("rd rd <rd hh> rd").bank("RolandTR909").acidenv(slider(0.9))
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
    source: `setcpm(138/4)

${ACID_ENV}

$: n("<7 _ _ 6 5 _ <5 3> <6 4>>*2").scale("g:minor").trans(-24)
  .detune(rand)
  .o(4).s("sawtooth").acidenv(slider(0.55))
  .delay(.5)

$: sound("rd - <rd hh> -").bank("RolandTR909").acidenv(slider(0.6))
  .delay(0.45)

$_: s("hh:9!2").fit().o(8)

$: s("bd:2!4")
  .gain(0.5)
  .lpf(900)
  .duck("3:4:5:6")
  .duckdepth(.55)
  .duckattack(.18)`,
  },
  {
    id: "chorus-3",
    label: "chorus",
    loops: 10,
    source: `setcpm(138/4)

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

$: sound("rd rd <rd hh> rd").bank("RolandTR909").acidenv(slider(0.96))
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
    source: `setcpm(138/4)

${ACID_ENV}

$: n("<0 4>*8").scale("g:minor").trans(-12)
  .o(3).s("sawtooth").acidenv(slider(0.25))
  .delay(.8).pan(rand)

$: s("white!4").att(.6).o(6).acidenv(slider(0.3))

$: sound("rd - rd -").bank("RolandTR909").acidenv(slider(0.5))
  .delay(0.4)

$: s("bd:2!4")
  .gain(0.36)
  .lpf(650)
  .duck("3:4:5:6")
  .duckdepth(.4)
  .duckattack(.22)`,
  },
];

const BOTANICA_SECTIONS: SongSection[] = [
  {
    id: "intro",
    label: "intro",
    loops: 8,
    source: `// botanica · intro — soft floor + wind crumbs
setcpm(104/4)

$: s("bd*4")
  .gain(0.28)
  .lpf(600)
  .room(0.25)

$: s("wind")
  .gain(0.32).room(0.7).roomsize(4)

$: n("~ 0 ~ ~ 4 ~ 2 ~ ~ ~ 7 ~ 0")
  .scale("F4:major")
  .s("piano")
  .gain(0.45)
  .crush(4)
  .room(0.5)
  .delay(0.25)
  .pan(rand)
  .speed("<1 1 0.97 1.03>")

$: s("~ ~ insect ~")
  .gain(0.16).room(0.4)`,
  },
  {
    id: "build-up",
    label: "build-up",
    loops: 8,
    source: `// botanica · build — chops over floor
setcpm(104/4)

$: s("bd*4")
  .gain(0.38)
  .lpf(750)
  .room(0.28)

$: s("wind, ~ space:4 ~")
  .gain(0.28).room(0.65)

$: n("<~ 0 4 ~ 2 7 ~ 0 ~ 5 2 ~ 4 ~ 0 9>*2")
  .scale("F4:major")
  .s("piano")
  .gain(0.55)
  .crush(3)
  .coarse(4)
  .room(0.45)
  .delay(0.35)
  .pan(rand)
  .speed("<1 1.5 0.75 1 2 1 0.5 1>")

$: n("~ ~ <0 2> ~ ~ <4 ~> ~")
  .scale("F5:major")
  .s("gm_epiano1")
  .gain(0.25)
  .room(0.7)
  .delay(0.4)

$: s("insect [crow ~] - -, ~ metal ~ ~")
  .gain(0.18).room(0.35)

$: s("~ hh ~ hh")
  .gain(0.1).room(0.2)`,
  },
  {
    id: "chorus-1",
    label: "chorus",
    loops: 10,
    source: `// botanica · chorus — meadow clarity on 4OTF
setcpm(104/4)

$: s("bd*4")
  .gain(0.48)
  .lpf(900)
  .room(0.3)

$: n("<0 2 4 0>/2")
  .scale("F3:major")
  .s("gm_pad_warm")
  .attack(0.4)
  .release(1.2)
  .gain(0.35)
  .room(0.85)
  .roomsize(6)

$: n("<0 ~ 2 4 ~ 7 4 2, ~ 4 ~ 9 ~ 7 ~ 4>")
  .scale("F4:major")
  .s("piano")
  .gain(0.6)
  .room(0.55)
  .delay(0.3)
  .pan(sine.range(-0.4,0.4))

$: n("<~ 4 7 9 7 4>/2")
  .scale("F5:major")
  .s("gm_epiano1")
  .gain(0.28)
  .room(0.7)
  .delay(0.45)

$: s("wind")
  .gain(0.2).room(0.6)

$: s("~ hh:9 ~ hh:9")
  .gain(0.14).room(0.25)`,
  },
  {
    id: "breakdown",
    label: "breakdown",
    loops: 6,
    source: `// botanica · breakdown — quiet floor
setcpm(104/4)

$: s("bd*4")
  .gain(0.3)
  .lpf(550)
  .room(0.3)

$: s("wind, space:4")
  .gain(0.3).room(0.75)

$: n("~ 0 ~ 4 ~ ~ 2 ~")
  .scale("F4:major")
  .s("piano")
  .gain(0.4)
  .crush(5)
  .room(0.6)
  .delay(0.4)
  .pan(rand)

$: n("<0 4>/4")
  .scale("F3:major")
  .s("gm_pad_warm")
  .attack(0.6)
  .gain(0.22)
  .room(0.9)`,
  },
  {
    id: "outro",
    label: "outro",
    loops: 6,
    source: `// botanica · outro — dissolve, floor still there
setcpm(104/4)

$: s("bd*4")
  .gain(0.22)
  .lpf(500)
  .room(0.35)

$: s("wind")
  .gain(0.26).room(0.8)

$: n("~ ~ 0 ~ ~ 4 ~ ~")
  .scale("F4:major")
  .s("piano")
  .gain(0.3)
  .room(0.7)
  .delay(0.5)

$: n("<0>/4")
  .scale("F3:major")
  .s("gm_pad_warm")
  .attack(0.8)
  .gain(0.18)
  .room(0.95)`,
  },
];

const UTOPIA_SECTIONS: SongSection[] = [
  {
    id: "intro",
    label: "intro",
    loops: 6,
    source: `// utopiaOS · intro — heaven grid, soft floor
setcpm(122/4)

$: s("bd*4")
  .gain(0.36)
  .lpf(800)
  .room(0.2)

$: s("hh*4")
  .gain(0.2)
  .hpf(6500)
  .room(0.12)

$: n("<0 4 7 11>/2")
  .scale("C5:major")
  .s("triangle")
  .gain(0.16)
  .room(0.55)
  .delay(0.28)`,
  },
  {
    id: "build-up",
    label: "build-up",
    loops: 8,
    source: `// utopiaOS · build — grid locks
setcpm(122/4)

$: s("bd*4")
  .gain(0.55)
  .lpf(1400)
  .room(0.16)

$: s("~ hh ~ hh")
  .gain(0.3)
  .hpf(7000)

$: s("~ cp ~ cp")
  .gain(0.26)
  .room(0.22)

$: n("<0 4 7 11>*2")
  .scale("C4:major")
  .s("square")
  .gain(0.14)
  .lpf(2000)
  .room(0.4)
  .delay(0.18)`,
  },
  {
    id: "chorus-1",
    label: "chorus",
    loops: 8,
    source: `// utopiaOS · chorus — virtual heaven
setcpm(122/4)

$: s("bd*4")
  .gain(0.72)
  .room(0.14)

$: s("hh*8")
  .gain(0.28)
  .hpf(8000)

$: s("~ cp ~ cp")
  .gain(0.4)
  .room(0.18)

$: s("~ ~ 808oh ~")
  .gain(0.2)
  .room(0.32)

$: n("<[0,4,7] [0,4,9] [2,5,9] [0,4,7]>")
  .scale("C4:major")
  .s("triangle")
  .gain(0.26)
  .attack(0.01)
  .release(0.22)
  .room(0.42)
  .delay(0.16)`,
  },
  {
    id: "bridge",
    label: "bridge",
    loops: 6,
    source: `// utopiaOS · bridge — soft heaven, floor stays
setcpm(122/4)

$: s("bd*4")
  .gain(0.4)
  .lpf(700)
  .room(0.28)

$: s("hh ~ hh ~")
  .gain(0.16)
  .hpf(6500)

$: s("~ cp ~ ~")
  .gain(0.18)
  .room(0.28)

$: n("<0 4 7 11>/2")
  .scale("C4:major")
  .s("sine")
  .gain(0.2)
  .attack(0.18)
  .release(0.6)
  .room(0.7)`,
  },
  {
    id: "outro",
    label: "outro",
    loops: 6,
    source: `// utopiaOS · outro — grid fades, floor stays
setcpm(122/4)

$: s("bd*4")
  .gain(0.3)
  .lpf(650)
  .room(0.26)

$: s("~ hh ~ ~")
  .gain(0.12)
  .hpf(7000)

$: n("~ 0 ~ 4 ~ 7 ~ 2")
  .scale("C5:major")
  .s("triangle")
  .gain(0.15)
  .room(0.6)
  .delay(0.35)`,
  },
];

const BREAKCORE_SECTIONS: SongSection[] = [
  {
    id: "intro",
    label: "intro",
    loops: 6,
    source: `// break(core) · intro — floor + amen crumbs
setcpm(174/4)

$: s("bd*4")
  .gain(0.7)
  .lpf(1600)

$: s("amencutup ~ amencutup ~")
  .n("<0 8 16 24>")
  .gain(0.4)
  .speed("<1 1.5 0.75 2>")
  .crush(3)
  .room(0.12)

$: s("hh*4")
  .gain(0.24)
  .hpf(5000)`,
  },
  {
    id: "build-up",
    label: "build-up",
    loops: 8,
    source: `// break(core) · build — chops gather on the floor
setcpm(174/4)

$: s("bd*4")
  .gain(0.85)

$: s("amencutup*4")
  .n("<0 4 9 14 19 24 28 3>")
  .gain(0.5)
  .speed("<1 2 1 0.5 1.5 1 2 1>")
  .crush(5)
  .coarse(4)
  .pan(rand)

$: s("hh*8")
  .gain(0.32)
  .hpf(6000)

$: s("~ sd ~ [sd sd]")
  .gain(0.55)
  .speed("<1 1 1.4 0.8>")`,
  },
  {
    id: "chorus-1",
    label: "chorus",
    loops: 8,
    source: `// break(core) · chorus — densest stack
setcpm(174/4)

$: s("bd*4")
  .gain(1)

$: s("amencutup*8")
  .n("<0 2 5 9 13 17 21 25 29 6 11 16>")
  .gain(0.62)
  .speed("<1 2 1.5 [2 4] 0.5 1 2 1.25>")
  .crush(6)
  .coarse(6)
  .pan(rand)
  .room(0.1)

$: s("hh*16")
  .gain(0.28)
  .hpf(7000)
  .speed("<1 1 2 1>")

$: s("~ sd [sd sd] <sd [sd*4]>")
  .gain(0.7)
  .speed("<0.8 1.4 1 1.8>")
  .crush(4)

$: s("white*8")
  .gain(0.07)
  .hpf(4000)
  .crush(8)`,
  },
  {
    id: "breakdown",
    label: "breakdown",
    loops: 6,
    source: `// break(core) · breakdown — quiet floor, still chopping
setcpm(174/4)

$: s("bd*4")
  .gain(0.48)
  .lpf(900)

$: s("amencutup*2")
  .n("<0 10 20 30>")
  .gain(0.35)
  .speed("<1 0.5 2 1>")
  .crush(4)
  .room(0.32)

$: s("~ hh ~ hh")
  .gain(0.16)
  .hpf(6000)

$: s("white ~ ~ white")
  .gain(0.05)
  .hpf(5000)`,
  },
  {
    id: "outro",
    label: "outro",
    loops: 6,
    source: `// break(core) · outro — floor outlasts the chops
setcpm(174/4)

$: s("bd*4")
  .gain(0.55)
  .lpf(1100)

$: s("amencutup ~ ~ amencutup")
  .n("<4 12 20 28>")
  .gain(0.3)
  .speed("<1 1.5 0.75 2>")
  .crush(5)
  .room(0.4)
  .delay(0.22)

$: s("~ hh ~ ~")
  .gain(0.14)
  .hpf(6000)`,
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
