export type CaseStudyCoverId = "voyage" | "podcasts";

export type CaseStudyBlockVariant = "detailed";

export type CaseStudyImpactIconId =
  | "lightning"
  | "money"
  | "scales"
  | "sparkle"
  | "headphones"
  | "chat-circle";

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
    role: "Co-Founder and UX Designer. I owned research, brand, the design system, and the React/Vite frontend. My two co-founders — deep in data science and software — owned backend, databases, scraping, and the search engine. My job was to translate what was technically possible into something travellers would actually use — including saying no when a technical option would make the product harder to trust.",
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
        title: "Easy flight/train comparison",
        body: "Every suggestion showed the source itinerary — the model assisted without hiding how the answer was built.",
      },
    ],
    sections: [
      {
        heading: "Problem",
        paragraphs: [
          {
            text: "Budget travel across Europe usually means tab-hopping between airlines, train operators, and comparison sites. People know roughly when they want to go, but not which combination of modes will actually be cheapest or least painful. Existing planners either lock you into a destination too early or dump a wall of fares — neither matches how people actually plan: tentatively, with constraints that change mid-sentence.",
          },
          {
            text: "Building a startup is not the usual UX/UI brief — and that is the point. Affordable travel is a wicked problem: product, tech, business model, and brand all pull on each other. I chose to hold that tension in the design process rather than pretend UX lived in a silo — otherwise we would have shipped a pretty search grid that ignored how the company had to survive.",
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
            text: "We fell in love with the problem before the product. I mapped how people search for, choose, and order travel online — then dug into choosing, not searching or checkout. Searching was noisy and site-specific; ordering was hard to observe without a real purchase. Choosing was where preference showed up: time spent comparing, which factors won, what was merely nice to have.",
            variant: "detailed",
          },
          {
            text: "Affordability beat convenience. A stable connection along the route mattered for people working from the road. And the planning styles split: many backpackers map a trip start→finish; digital nomads often plan fluidly mid-trip — long stays, then decide the next country by flight, train, ferry, or bus. That split mattered for product shape later: a tool that only helped \"book the whole tour upfront\" would miss the nomad.",
            variant: "detailed",
          },
          {
            text: "I chose to fill the customer canvas before the value proposition. The offer side stayed empty on purpose — a design decision against jumping to features. Untested ideas (like whether layovers could feel like a gain) stayed marked as hypotheses, not requirements.",
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
        paragraphs: [
          {
            text: "CheapVoyage 1.0 started as the wrong fantasy — dark mint \"hack the system\" — then became a warm, trusted product system we actually shipped in React/Vite.",
          },
          {
            text: "Dark mint with a \"hack the system\" vibe read clever to us and cold to travellers. I chose against that direction once research made the miss obvious: we were signalling fare-gaming, not going somewhere. Clever-for-founders is not the same as usable-for-travellers.",
            variant: "detailed",
          },
          {
            text: "We rebuilt around adventure and affordability with quiet trust: warm orange and teal, paper texture, modern-analog. The bird with a leaf-wing was a deliberate tradeoff — flight and lightness without adrenaline cosplay, so safety and openness could sit in one mark. Then I pushed past mood boards into a real component system: states, interactions, consistency across flows. I implemented that system in React/Vite while my co-founders owned backend and data — so design intent and frontend behavior stayed one conversation, not a handoff document.",
            variant: "detailed",
          },
          {
            text: "CheapVoyage 1.0 was a shipped product chapter, not a brand exercise. The limit of 1.0 was already visible: even with the right mood, we were still competing as a search surface.",
            variant: "detailed",
          },
        ],
        figure: {
          images: [
            { src: "/case-studies/cheapvoyage/beat3-moodboard.jpg", alt: "Warm analog moodboard with orange, teal, and paper textures" },
            { src: "/case-studies/cheapvoyage/beat2-components-1.0.jpg", alt: "Warm component system with states and interactions" },
          ],
          label: "1.0",
          caption: "Adventure with trust — then a shipped component system.",
        },
      },
      {
        heading: "The pivot",
        paragraphs: [
          {
            text: "We couldn't win on a fare grid. We chose conversation.",
          },
          {
            text: "By spring 2025 we were still on a fare-grid path. In summer 2025 Google Flights launched Flight Deals — essentially the surface we were building. Three founders cannot win an arms race against Google on that UI pattern.",
            variant: "detailed",
          },
          {
            text: "The competitive shock forced a product decision, not a rebrand. We could have doubled down on \"slightly different search\" — better filters, nicer cards, more modes. We chose not to. Differentiation had to be the experience of planning itself.",
            variant: "detailed",
          },
          {
            text: "The deeper reframe: the burden isn't finding one cheap ticket. It's months of lifestyle travel as a second job — especially for digital nomads deciding the next country mid-trip. CheapVoyage 2.0 had to lighten planning, not sharpen the grid.",
            variant: "detailed",
          },
        ],
      },
      {
        heading: "Conversation instead of forms",
        paragraphs: [
          {
            text: "CheapVoyage 2.0 puts constraints in conversation — not a city/date form — so planning stays light and editable.",
          },
          {
            text: "I chose a conversational interface over another advanced form. Forms force travellers to know too much too early: exact cities, exact dates, exact modes. Conversation lets intent arrive incomplete — where you are, where you might go, for how long, flights or trains — and stay editable mid-thread.",
            variant: "detailed",
          },
          {
            text: "Lightness was a hard constraint, not decoration. Every chrome addition competed with the traveller's mental load. Complexity had to stay in the system: routing, comparisons, data freshness — not in the UI's demand for perfect inputs. \"Where to next?\" is the product promise in one line: forward motion without a locked itinerary.",
            variant: "detailed",
          },
        ],
        figure: {
          src: "/case-studies/cheapvoyage/beat6-where-to-next.jpg",
          label: "2.0",
          caption: "Constraints in conversation, not a form.",
        },
      },
      {
        heading: "Europe in one thread",
        paragraphs: [
          {
            text: "Europe in one thread: flights and trains together, multi-city loops, every suggestion inspectable — the model composes, it isn't the source of truth.",
          },
          {
            text: "I scoped to Europe on purpose. Intercontinental ambition looked impressive and made the product worse: weaker rail, messier data, and a promise we couldn't keep as three founders. Europe is where our users already were and where rail is a real alternative, not a novelty.",
            variant: "detailed",
          },
          {
            text: "Fly versus train had to live in one thread, including sustainability beside price — otherwise \"cheapest flight\" would always win by default. One conversation can hold a whole loop (Copenhagen → Paris → Amsterdam → back) and land as inspectable legs with plane and train options per segment.",
            variant: "detailed",
          },
          {
            text: "Inspectability was the trust decision. Magical chat that hides the itinerary fails the first time a price or connection is wrong. I treated the model as a compositor, not a source of truth: every suggestion points at a concrete itinerary; no false precision; no locked destination until the traveller is ready. People forgive a slower answer if they can see why it was chosen.",
            variant: "detailed",
          },
        ],
        figure: {
          videoSrc: "/case-studies/cheapvoyage/beat7-8-demo.mp4",
          poster: "/case-studies/cheapvoyage/beat7-8-poster.jpg",
          label: "2.0",
          caption: "Model composes; the itinerary stays inspectable.",
        },
      },
    ],
    result: {
      paragraphs: [
        "Shipped as a working proof-of-concept conversational planner for affordable Europe routes: one thread, inspectable cards, quieter than booking forms. We tested with nomads, backpackers, and young travellers; qualitative feedback showed reduced planning overhead when constraints stayed editable mid-thread.",
        "Remaining work is data coverage and freshness — not another UI layer.",
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
  }
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
