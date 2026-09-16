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
  cover?: CaseStudyCoverId;
  src?: string;
  images?: { src: string; alt: string }[];
  layout?: "phones" | "gallery";
  videoSrc?: string;
  poster?: string;
  caption: string;
  label?: string;
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
      "Budget Europe travel is a maze of tabs and forms. We built CheapVoyage 1.0 as a warmer way to find affordable routes — then Google landed on a similar surface, and we pivoted to CheapVoyage 2.0: a conversational planner so finding a cheaper route feels like asking a friend, not filling out a form.",
    role: "Co-Founder and UX Designer. I owned research, brand, the design system, and the React/Vite frontend. My two co-founders — deep in data science and software — owned backend, databases, scraping, and the search engine. My job was to translate what was technically possible into something travellers would actually use.",
    cover: "voyage",
    coverLabel: "CheapVoyage chat planner",
    impact: [
      {
        icon: "chat-circle",
        title: "Seamless trip planning",
        body: "One conversational thread instead of multi-step forms — people could go from intent to a comparable set of routes without leaving the chat.",
      },
      {
        icon: "money",
        title: "Unconventional cheaper options",
        body: "Price and transfer pain were weighed equally — a slower train could win when it was the smarter trade, not only when it was the cheapest flight.",
      },
      {
        icon: "scales",
        title: "Easy flight and train comparison",
        body: "Every suggestion showed the source itinerary — the model assisted without hiding how the answer was built.",
      },
    ],
    sections: [
      {
        heading: "Problem",
        variant: "detailed",
        paragraphs: [
          {
            text: "Budget travel across Europe usually means tab-hopping between airlines, train operators, and comparison sites. People know roughly when they want to go, but not which combination of modes will actually be cheapest or least painful. Existing planners either lock you into a destination too early or dump a wall of fares — neither matches how people actually plan: tentatively, with constraints that change mid-sentence.",
          },
          {
            text: "Building a startup is not the usual UX/UI brief — and that is the point. Affordable travel is a wicked problem: product, tech, business model, and brand all pull on each other, and the designer's job is to hold that tension long enough to make something people can actually use.",
            variant: "detailed",
          },
        ],
        figure: {
          src: "/case-studies/cheapvoyage/problem-lean-canvas.jpg",
          caption: "Business frame for a wicked startup problem — not the hero of the story.",
        },
      },
      {
        heading: "Know the traveller",
        paragraphs: [
          {
            text: "Backpackers often plan a trip start→finish; digital nomads plan fluidly mid-trip — long stays, then the next country by flight, train, ferry, or bus. We designed to cut that overhead for flexible travellers.",
          },
          {
            text: "We fell in love with the problem before the product. I mapped how people search for, choose, and order travel online — then dug into choosing: what they compare, what wins, what's merely nice to have.",
            variant: "detailed",
          },
          {
            text: "Affordability beat convenience. A stable connection along the route mattered for people working from the road. And the planning styles split: many backpackers map a trip start→finish; digital nomads often plan fluidly mid-trip — long stays, then decide the next country by flight, train, ferry, or bus. The goal became clear: cut that overhead for flexible travellers.",
            variant: "detailed",
          },
          {
            text: "The customer canvas filled the traveller first. The value-proposition side stayed empty on purpose — we knew who we were designing for before we locked the offer.",
            variant: "detailed",
          },
        ],
        figure: {
          images: [
            { src: "/case-studies/cheapvoyage/beat1-question-map.jpg", alt: "Question map circling the choosing phase" },
            { src: "/case-studies/cheapvoyage/beat1-customer-canvas.jpg", alt: "Customer canvas with traveller mapped and value proposition left blank" },
          ],
          caption: "Traveller mapped first; the offer side left blank on purpose. Pink layover sticky = untested hypothesis only.",
        },
      },
      {
        heading: "CheapVoyage 1.0",
        variant: "detailed",
        paragraphs: [
          {
            text: "Dark mint with a \"hack the system\" vibe read clever to us and cold to travellers. It was the wrong fantasy: beating the algorithm, not going somewhere. We shifted to warm orange and teal, paper texture, a modern-analog feel. The bird with a leaf-wing became our mark: flight without losing trust. That component system became version 1.0, which we built in React/Vite.",
          },
        ],
        figure: {
          images: [
            { src: "/case-studies/cheapvoyage/beat3-moodboard.jpg", alt: "CheapVoyage 1.0 moodboard with warm materials" },
            { src: "/case-studies/cheapvoyage/beat2-components-1.0.jpg", alt: "CheapVoyage 1.0 shipped component system" },
          ],
          caption: "Adventure with trust — then a shipped component system.",
          label: "1.0",
        },
      },
      {
        heading: "The pivot",
        paragraphs: [
          {
            text: "By spring 2025 we were still on a fare-grid path. In summer 2025 Google Flights launched Flight Deals — essentially what we were building. Three founders cannot win that arms race.",
          },
          {
            text: "We couldn't win on a fare grid. We chose conversation.",
          },
          {
            text: "The deeper reframe: planning overhead for lifestyle travel, especially for nomads mid-trip. CheapVoyage 2.0 lightens planning itself — finding a cheaper route becomes a conversation, not a second job.",
            variant: "detailed",
          },
        ],
      },
      {
        heading: "Conversation instead of forms",
        paragraphs: [
          {
            text: "Version 2.0 introduced a conversational interface: where you are, where you're going, how long, flights or trains. Lightness over information dump. The complexity stayed in the system.",
          },
        ],
        figure: {
          src: "/case-studies/cheapvoyage/beat6-where-to-next.jpg",
          caption: "Constraints in conversation, not a form.",
          label: "2.0",
        },
      },
      {
        heading: "Europe in one thread",
        paragraphs: [
          {
            text: "We scoped to Europe, where rail is a real alternative. Fly versus train lived in one conversational thread, including sustainability — not only price. One conversation could hold a whole loop — Copenhagen to Paris to Amsterdam and back — then land as inspectable legs with both plane and train options per segment. No city/date form; no locked destination until you were ready.",
          },
          {
            text: "Every suggestion pointed at a concrete itinerary. The model composed options; it was not the source of truth. No false precision. No locked destination until the traveller was ready.",
            variant: "detailed",
          },
        ],
        figure: {
          videoSrc: "/case-studies/cheapvoyage/beat7-8-demo.mp4",
          poster: "/case-studies/cheapvoyage/beat7-8-poster.jpg",
          caption: "Model composes; the itinerary stays inspectable.",
          label: "2.0",
        },
      },
    ],
    result: {
      paragraphs: [
        "Working proof of concept, tested with nomads, backpackers, and young travellers. Qualitative feedback confirmed reduced planning overhead. Remaining work is data coverage and freshness — not another UI layer.",
        "Don't out-search Google. Out-ease the planning.",
      ],
    },
  },
  {
    slug: "spotify-podcasts",
    tileId: "case-study-2",
    title: "AI Sources for Spotify Podcasts",
    accent: "violet",
    headline: "Designing Source Insights to Add Nuance After a Health Podcast",
    intro:
      "Health-curious listeners often finish a longevity episode with a claim still ringing in their ear and no way to sit with it. Source Insights is a post-podcast layer inside Spotify: each claim from the episode can be opened, then read against the host's own sources and against supporting and opposing sources the model found. The AI does not score the claim. It makes the disagreement visible.",
    role: "UX Designer — group project at ITU Copenhagen",
    cover: "podcasts",
    coverLabel: "Source Insights on a Spotify episode page",
    impact: [
      {
        icon: "sparkle",
        title: "Claims, not a recap",
        body: "Isolated statements are what go wrong in a health podcast, not the episode as a whole. The interface extracts four to six claims from the transcript and audio so uncertainty shows up where it actually lives.",
      },
      {
        icon: "scales",
        title: "Support and contradiction in the same card",
        body: "Every claim carries the creator's sources, supporting sources, and opposing sources. Medical evidence disagrees; the UI is honest about that instead of picking a winner.",
      },
      {
        icon: "headphones",
        title: "After listening, not over it",
        body: "People listen while cooking, commuting, training. The module waits under the episode description so the podcast can stay a podcast.",
      },
    ],
    sections: [
      {
        heading: "Problem",
        variant: "detailed",
        paragraphs: [
          { text: "Lang Levetid sits in a high-stakes corner of Spotify: health and longevity, where a casual sentence can sound like medical advice. Evidence-oriented listeners did not want a system that called claims true or false. They wanted context they could use to form their own view." },
          { text: "They also listen while doing something else. A mid-episode interruption would fight the medium. The gap is after the credits: unanswered claims, no sources in reach, and a share button sitting right there." },
        ],
      },
      {
        heading: "Approach",
        paragraphs: [
          { text: "I placed Source Insights on the episode page, under the description, as a collapsible module in Spotify's own grammar. Open it and you get four to six claims. Open a claim and you get a short plain-language restatement, then three stacks: the creator's sources, supporting sources, opposing sources. Open a source and you can leave for the original, or stay for a short AI summary of what it actually found." },
          { text: "No green, no red, no true/false. Colour that usually means correct would make the model look like a referee. Creator sources stay distinct from model-found ones, so origin is always visible.", variant: "detailed" },
          { text: "The interaction is optional and a little slow on purpose: each expand is a pause before a conclusion.", variant: "detailed" },
        ],
        figure: {
          images: [
            {
              src: "/case-studies/spotify-phone-1-claims.png",
              alt: "Source Insights with the first claim expanded.",
            },
            {
              src: "/case-studies/spotify-phone-2-sources.png",
              alt: "A claim opened into creator, supporting, and opposing sources.",
            },
            {
              src: "/case-studies/spotify-phone-3-summary.png",
              alt: "An AI summary of a source under a claim.",
            },
          ],
          layout: "phones",
          caption: "A claim opens into creator, supporting, and opposing sources — disagreement stays in the episode, not in a separate fact-check product.",
        },
      },
      {
        heading: "After, not during",
        variant: "detailed",
        paragraphs: [
          { text: "The design space split cleanly into interventions during listening and interventions after. Interviews said people listen alongside other activities, so real-time claim validation would be a poke in the ear." },
          { text: "We tried putting creator sources into the transcript anyway. Testers got lost and the reading flow broke. We pulled them out. Source Insights waits until the episode is over, which is when the evidence-oriented listener actually wants to go looking." },
        ],
      },
      {
        heading: "The model is not a referee",
        variant: "detailed",
        paragraphs: [
          { text: "Generative output can be incomplete, contested, or overconfident. The interface treats that as a design material, not a bug to hide." },
          { text: "Each insight therefore carries supporting and opposing sources. There are no truth labels and no traffic-light colours, so the model cannot pretend to have judged the claim. Testing still found \"supporting\" and \"opposing\" themselves unclear — we added an explanation rather than a verdict." },
          { text: "What the primary listener needed was not a score. It was a way to see disagreement, then decide." },
        ],
      },
    ],
    result: {
      paragraphs: [
        "Source Insights shipped as a high-fidelity Spotify markup: claim-level context after listening, sources you can inspect, summaries that make a paper skimmable. What remains is not another UI layer. It is discoverability (testers missed the module on a familiar episode page), clearer language for the source categories, and better criteria for which papers an evidence-oriented listener actually wants.",
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
