import Image from "next/image";
import type { CaseStudyCoverId } from "@/data/case-studies";
import { withBasePath } from "@/lib/base-path";

interface CaseStudyCoverProps {
  id: CaseStudyCoverId;
  label: string;
}

const COVER_PHOTOS: Partial<
  Record<CaseStudyCoverId, { src: string; width: number; height: number }>
> = {
  voyage: {
    src: "/case-studies/cheapvoyage-picture-1.png",
    width: 1440,
    height: 1024,
  },
  podcasts: {
    src: "/case-studies/spotify-source-insights-cover.png",
    width: 1792,
    height: 2048,
  },
};

export function CaseStudyCover({ id, label }: CaseStudyCoverProps) {
  const photo = COVER_PHOTOS[id];

  return (
    <figure className="case-study-cover">
      <div
        className={`case-study-cover-stage case-study-cover-stage--${id}${
          photo ? " case-study-cover-stage--photo" : ""
        }`}
      >
        {photo ? (
          <Image
            src={withBasePath(photo.src)}
            alt={label}
            width={photo.width}
            height={photo.height}
            sizes="(max-width: 680px) 100vw, 680px"
            className="case-study-cover-photo"
            style={{ width: "100%", height: "auto" }}
          />
        ) : null}
        {id === "podcasts" ? <PodcastArt /> : null}
        {id === "thesis" ? <ThesisArt /> : null}
        {id === "music" ? <MusicArt /> : null}
      </div>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}

function PodcastArt() {
  const shows = [
    { title: "Long form", tone: "violet" },
    { title: "Field notes", tone: "amber" },
    { title: "Late night", tone: "teal" },
    { title: "Interview", tone: "rose" },
    { title: "Daily", tone: "blue" },
    { title: "Archive", tone: "orange" },
  ];

  return (
    <div className="cover-podcasts">
      <p className="cover-podcasts-kicker">For You</p>
      <div className="cover-podcasts-grid">
        {shows.map((show) => (
          <div
            key={show.title}
            className={`cover-podcast-tile cover-podcast-tile--${show.tone}`}
          >
            <span>{show.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThesisArt() {
  return (
    <div className="cover-thesis">
      <div className="cover-thesis-grid">
        {Array.from({ length: 48 }, (_, index) => (
          <span
            key={index}
            className="cover-thesis-cell"
            data-author={
              index % 7 === 0 ? "model" : index % 5 === 0 ? "blend" : "human"
            }
          />
        ))}
      </div>
      <div className="cover-thesis-ghost" aria-hidden />
    </div>
  );
}

function MusicArt() {
  return (
    <div className="cover-music">
      <div className="cover-music-plugin">
        <div className="cover-music-chrome" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="cover-music-body">
          <div className="cover-music-tracks">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="cover-music-track">
                <span className="cover-music-wave" data-lane={index} />
              </div>
            ))}
          </div>
          <div className="cover-music-chat">
            <span className="cover-music-bubble cover-music-bubble--user" />
            <span className="cover-music-bubble cover-music-bubble--ai" />
            <span className="cover-music-bubble cover-music-bubble--user cover-music-bubble--short" />
          </div>
        </div>
      </div>
    </div>
  );
}
