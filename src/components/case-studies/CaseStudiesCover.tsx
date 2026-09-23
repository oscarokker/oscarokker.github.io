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
        ) : (
          <>
            {id === "podcasts" ? <PodcastArt /> : null}
          </>
        )}
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

