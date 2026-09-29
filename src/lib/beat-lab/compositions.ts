export type CompositionId =
  | "neo-trance"
  | "botanica"
  | "utopia-os"
  | "breakcore";

export interface Composition {
  id: CompositionId;
  /** World tab label. */
  name: string;
  /** Default groove-level Strudel (Reset track / legacy). */
  source: string;
}

/** Static mini-notation teaser for the collapsed face — not live audio. */
export const TEASER_NOTATION = 's("bd sd hh")';

export const COMPOSITIONS: Composition[] = [
  {
    id: "neo-trance",
    name: "neo.trance",
    source: `setcpm(138/4)

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
    id: "botanica",
    name: "botanica",
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
    id: "utopia-os",
    name: "utopiaOS",
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
    id: "breakcore",
    name: "break(core)",
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
