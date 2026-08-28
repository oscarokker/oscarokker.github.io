export type CaseStudyCoverId = "voyage" | "podcasts" | "thesis" | "music";

export type CaseStudyBlockVariant = "detailed";

export type CaseStudyImpactIconId =
  | "lightning"
  | "money"
  | "scales"
  | "sparkle"
  | "headphones"
  | "game-controller"
  | "map"
  | "arrows-clockwise"
  | "chat-circle"
  | "sliders"
  | "waveform";

export interface CaseStudyImpact {
  icon: CaseStudyImpactIconId;
  title: string;
  body: string;
}

export interface CaseStudyFigure {
  cover: CaseStudyCoverId;
  caption: string;
}

export interface CaseStudyParagraph {
  text: string;
  variant?: CaseStudyBlockVariant;
}

export interface CaseStudySection {
  heading: string;
  variant?: CaseStudyBlockVariant;
  paragraphs: CaseStudyParagraph[];
  figure?: CaseStudyFigure;
}

export interface CaseStudyResult {
  heading?: string;
  paragraphs: string[];
}

export interface CaseStudy {
  slug: string;
  tileId: string;
  title: string;
  headline: string;
  intro: string;
  role: string;
  accent?: string;
  cover: CaseStudyCoverId;
  coverLabel: string;
  impact: CaseStudyImpact[];
  sections: CaseStudySection[];
  result: CaseStudyResult;
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "cheap-voyage",
    tileId: "case-study-1",
    title: "CheapVoyage",
    accent: "teal",
    headline: "Designing a Conversational Interface to Make Travel Planning Easy",
    intro:
      "CheapVoyage is an AI-driven travel planner that surfaces affordable flights and trains across Europe through a chat interface. I designed and built the product end-to-end so that finding a cheaper route feels like asking a knowledgeable friend — not filling out a form.",
    role: "Co-Founder and UX Designer",
    cover: "voyage",
    coverLabel: "CheapVoyage chat planner",
    impact: [
      {
        icon: "lightning",
        title: "Seamless Trip Planning",
        body: "A single conversational thread replaced multi-step search forms, so people could go from intent to a comparable set of routes without leaving the chat.",
      },
      {
        icon: "money",
        title: "Unconventional Cheaper Options",
        body: "The interface privileges price and transfer pain equally — so a slower train can win when it is the smarter trade, not only the cheapest flight.",
      },
      {
        icon: "scales",
        title: "Easy Comparison of Flight and Train Options",
        body: "Suggestions stay inspectable: every recommendation shows the source itinerary, so the model assists without hiding how the answer was built.",
      },
    ],
    sections: [
      {
        heading: "Problem",
        variant: "detailed",
        paragraphs: [
          {
            text: "Booking Europe on a budget usually means tab-hopping between airlines, train operators, and comparison sites. People know roughly when they want to go, but not which combination of modes will actually be cheapest or least painful.",
          },
          {
            text: "Existing planners either assume a destination is already decided, or they dump a wall of fares. Neither matches how people actually plan: tentatively, with constraints that change mid-sentence.",
          },
        ],
      },
      {
        heading: "Approach",
        paragraphs: [
          {
            text: "I designed a chat-first planner where constraints arrive in natural language — dates, cities, a budget, a willingness to overnight on a train — and the system returns comparable itineraries instead of a single booked ticket.",
          },
          {
            text: "The visual language stays quiet: a pale canvas, a compact route card, and a transcript that can be edited. The AI is present as a collaborator in the thread, not as a mascot or a modal.",
            variant: "detailed",
          },
        ],
        figure: {
          cover: "voyage",
          caption:
            "Route cards sit in the same thread as the question, so comparison never leaves the conversation.",
        },
      },
      {
        heading: "CheapVoyage 1.0",
        variant: "detailed",
        paragraphs: [
          {
            text: "People forgive a slower answer if they can see why it was chosen. Hiding the itinerary behind a chat bubble made the product feel magical for a moment and untrustworthy the next.",
          },
          {
            text: "The design work was as much about what the model should not say: no false precision on prices, no locked destination until the traveller is ready.",
          },
        ],
      },
      {
        heading: "The Data Problem",
        variant: "detailed",
        paragraphs: [
          {
            text: "Europe's cheapest path is rarely in one catalog. Airline fares, rail operators, and overnight trains update on different clocks, so a chat answer can sound sure and still be stale.",
          },
          {
            text: "I treated the model as a compositor, not a source of truth: every suggestion had to point back at a concrete itinerary, and prices stayed ranges until a live quote could confirm them.",
          },
        ],
      },
    ],
    result: {
      paragraphs: [
        "CheapVoyage shipped as a working conversational planner: one thread for constraints, inspectable route cards, and a quieter visual language than booking forms. The remaining work is coverage and freshness of the underlying data — not another layer of UI.",
      ],
    },
  },
  {
    slug: "spotify-podcasts",
    tileId: "case-study-2",
    title: "AI Sources for Spotify Podcasts",
    accent: "violet",
    headline: "Streamlining how podcast recommendations explain themselves",
    intro:
      "This project explores how Spotify could surface the sources behind AI-shaped podcast recommendations — so a For You row feels authored, not arbitrary. The work focuses on provenance, scanability, and a listening flow that still feels like Spotify.",
    role: "Design and prototyping.",
    cover: "podcasts",
    coverLabel: "Podcast For You grid",
    impact: [
      {
        icon: "lightning",
        title: "Faster sense-making",
        body: "Each show tile can reveal why it appeared — a topic, a host, a previous listen — without opening a separate explainability panel.",
      },
      {
        icon: "sparkle",
        title: "Always up-to-date by default",
        body: "Artwork and metadata stay live from the catalog, so provenance UI never depends on stale, manually exported screenshots.",
      },
      {
        icon: "headphones",
        title: "Listening stays primary",
        body: "Sources are secondary information: visible on demand, quiet by default, never competing with play.",
      },
    ],
    sections: [
      {
        heading: "The problem",
        variant: "detailed",
        paragraphs: [
          {
            text: "Recommendation rows are easy to tap and hard to trust. When an algorithm inserts a new show into For You, listeners have no lightweight way to ask: why this, and based on what?",
          },
          {
            text: "Heavy explainability patterns — long side sheets, model dumps, citation lists — break the lean, visual grammar of a podcast client.",
          },
        ],
      },
      {
        heading: "The approach",
        paragraphs: [
          {
            text: "I treated provenance as a caption, not a destination. A For You grid keeps the artwork-first language of podcast apps; a short source line can expand inline when someone wants the trail.",
          },
          {
            text: "The prototype pulls show metadata as a live catalog rather than frozen mock art, so the UI stays honest as titles and covers change.",
            variant: "detailed",
          },
        ],
        figure: {
          cover: "podcasts",
          caption:
            "Artwork stays the hero. Source hints sit underneath, in the same rhythm as a show title.",
        },
      },
      {
        heading: "What I learned",
        variant: "detailed",
        paragraphs: [
          {
            text: "Listeners did not want a full audit log. They wanted one credible reason, in language that sounds like a friend: because you followed this host, because you finished that series.",
          },
          {
            text: "If the reason is wrong even once, the whole row feels broken. Provenance UI raises the cost of a bad recommendation — which is a feature, not a bug.",
          },
        ],
      },
    ],
    result: {
      paragraphs: [
        "Provenance stayed inside the For You grammar instead of becoming a separate explainability product. In reviews, one credible reason outperformed a full audit log — and a single wrong reason made the whole row feel broken, which is the right kind of pressure on the recommender.",
      ],
    },
  },
  {
    slug: "co-creative-level-design",
    tileId: "masters-thesis-co-creative-level-design",
    title: "Master's Thesis on Co-Creative Level Design",
    accent: "indigo",
    headline: "Prototyping mixed-initiative co-creation for game levels",
    intro:
      "My master's work explores how level designers and generative models can share a canvas without either side taking over. The prototypes test mixed-initiative workflows: the designer steers, the model proposes, and authorship stays visible in the map.",
    role: "Research, interaction design, and prototyping.",
    cover: "thesis",
    coverLabel: "Co-creative level canvas",
    impact: [
      {
        icon: "game-controller",
        title: "Initiative stays with the designer",
        body: "Generation is a proposal, not a commit. Designers can accept, reject, or partial-blend a suggestion without resetting the level.",
      },
      {
        icon: "map",
        title: "Authorship on the map",
        body: "Tiles remember who placed them — human, model, or hybrid — so credit and control remain readable during playtest.",
      },
      {
        icon: "arrows-clockwise",
        title: "Tight iteration loops",
        body: "Local regenerations replace full-level rolls, which kept designers in flow instead of waiting on a new world.",
      },
    ],
    sections: [
      {
        heading: "The problem",
        variant: "detailed",
        paragraphs: [
          {
            text: "Most GenAI level tools still behave like slot machines: prompt, wait, receive a whole map. That is a poor match for how designers actually work — locally, iteratively, and with a strong sense of authorship.",
          },
          {
            text: "If the model overwrites too much, designers disengage. If it does too little, it is a clipart drawer. The interesting space is mixed initiative.",
          },
        ],
      },
      {
        heading: "The approach",
        paragraphs: [
          {
            text: "I prototyped a canvas where selection defines the model's jurisdiction. Generate into a region, not the whole level. Suggestions render as ghosts until the designer stamps them in.",
          },
          {
            text: "A quiet authorship overlay — human, model, blended — made it possible to talk about control in critiques without opening a hidden history panel.",
            variant: "detailed",
          },
        ],
        figure: {
          cover: "thesis",
          caption:
            "Ghosted proposals sit on the live map. Nothing commits until the designer stamps a region in.",
        },
      },
      {
        heading: "What I learned",
        variant: "detailed",
        paragraphs: [
          {
            text: "Designers wanted the model to be opinionated inside the selection and silent outside it. Leaky generations destroyed trust faster than bland ones.",
          },
          {
            text: "Visible authorship changed the conversation: people argued about the blend, not about whether AI was 'allowed' in the pipeline.",
          },
        ],
      },
    ],
    result: {
      paragraphs: [
        "Designers stayed in control when generation was scoped to a selection and stayed ghosted until stamped. Visible authorship shifted critique from whether AI belonged in the pipeline to how the blend should read on the map.",
      ],
    },
  },
  {
    slug: "co-creative-music-production",
    tileId: "music-production",
    title: "Co-Creative AI in Music Production",
    accent: "teal",
    headline: "Keeping conversational co-creation inside the DAW",
    intro:
      "This bachelor's project explores plugin interfaces inside DAWs so hobbyist producers can co-create with a conversational AI — without leaving the session for a chatbot in a browser tab.",
    role: "Bachelor's project — interaction design and prototyping.",
    cover: "music",
    coverLabel: "DAW plugin with a conversational co-creator",
    impact: [
      {
        icon: "sliders",
        title: "The plugin stays in the session",
        body: "Co-creation lives as a DAW plugin, so producers keep their timeline, meters, and muscle memory. The AI does not pull them into a separate app.",
      },
      {
        icon: "chat-circle",
        title: "Talk instead of hunt parameters",
        body: "A conversational thread sits beside the controls: ask for a warmer pad, a simpler drum pattern, a quieter sidechain — then hear the change on the same track.",
      },
      {
        icon: "waveform",
        title: "Hobbyist-scale, not a studio suite",
        body: "The interface assumes a bedroom producer, not a scoring stage. Fewer knobs, more intelligible suggestions, and an undo that feels like a take, not a crash.",
      },
    ],
    sections: [
      {
        heading: "The problem",
        variant: "detailed",
        paragraphs: [
          {
            text: "Most generative music tools still live outside the DAW: a website, a prompt box, a download, then import. Hobbyist producers lose the loop they already have — play, listen, tweak — and authorship becomes a file drop.",
          },
          {
            text: "Inside plugins, the opposite problem appears: walls of parameters that assume you already know what a filter envelope is. Conversational AI could help, but only if it does not replace the mixer with a chat window.",
          },
        ],
      },
      {
        heading: "The approach",
        paragraphs: [
          {
            text: "I designed plugin surfaces where the conversation is a lane in the instrument, not a modal over it. Requests land as automation and clip changes the producer can still grab, mute, or rewrite by hand.",
          },
          {
            text: "The AI is mixed-initiative: it proposes, the producer commits. A suggestion that cannot be inspected is not a suggestion — it is a take-over.",
            variant: "detailed",
          },
        ],
        figure: {
          cover: "music",
          caption:
            "Chat sits beside the plugin controls. The timeline stays the source of truth.",
        },
      },
      {
        heading: "What I learned",
        variant: "detailed",
        paragraphs: [
          {
            text: "Hobbyists did not want the model to finish the song. They wanted it to get them unstuck on a bar, a sound, a mix decision — then get out of the way.",
          },
          {
            text: "If the plugin wrote clips they could not edit, trust collapsed. If it only talked, it was a tutorial. The useful middle was a proposal that already looked like their project: a region, a preset, a handful of automations.",
          },
        ],
      },
    ],
    result: {
      paragraphs: [
        "The work argued for co-creation as a plugin grammar, not a destination website: conversation beside controls, suggestions as editable regions, and the DAW remaining the place where the track actually lives.",
      ],
    },
  },
];

import { tiles } from "@/data/tiles";
import type { CaseStudyTileData } from "@/lib/types";

const caseStudiesBySlug = new Map(
  caseStudies.map((study) => [study.slug, study]),
);

const comingSoonSlugs = new Set(
  tiles
    .filter(
      (tile): tile is CaseStudyTileData => tile.variant === "case-study",
    )
    .filter((tile) => tile.props.comingSoon)
    .map((tile) => tile.props.slug),
);

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudiesBySlug.get(slug);
}

export function getCaseStudySlugs(): string[] {
  return caseStudies.map((study) => study.slug);
}

export function isComingSoonCaseStudy(slug: string): boolean {
  return comingSoonSlugs.has(slug);
}

/** Slugs that get a public `/case-studies/[slug]` page in the static export. */
export function getPublishedCaseStudySlugs(): string[] {
  return getCaseStudySlugs().filter((slug) => !isComingSoonCaseStudy(slug));
}
