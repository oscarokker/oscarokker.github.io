import Image from "next/image";
import type { CaseStudyCoverId } from "@/data/case-studies";
import { withBasePath, withSrcSet } from "@/lib/base-path";

interface CaseStudyCoverProps {
  id: CaseStudyCoverId;
  label: string;
}

const COVER_PHOTOS: Partial<
  Record<
    CaseStudyCoverId,
    {
      src: string;
      width: number;
      height: number;
      srcSet?: { src: string; width: number }[];
    }
  >
> = {
  voyage: {
    // Source is 1440px wide, so the 2x file stops there (no upscale).
    src: "/case-studies/cheapvoyage-picture-1-900.webp",
    srcSet: [
      { src: "/case-studies/cheapvoyage-picture-1-900.webp", width: 900 },
      { src: "/case-studies/cheapvoyage-picture-1-1440.webp", width: 1440 },
    ],
    width: 1440,
    height: 1024,
  },
  podcasts: {
    src: "/case-studies/spotify-source-insights-cover.webp",
    width: 1360,
    height: 1554,
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
          photo.srcSet ? (
            // Native img: static export serves public files as-is, so next/image
            // cannot emit this width pair.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={withBasePath(photo.src)}
              srcSet={withSrcSet(photo.srcSet)}
              sizes="(max-width: 680px) 100vw, 680px"
              alt={label}
              width={photo.width}
              height={photo.height}
              loading="lazy"
              decoding="async"
              className="case-study-cover-photo"
              style={{
                width: "100%",
                height: "auto",
                aspectRatio: `${photo.width} / ${photo.height}`,
              }}
            />
          ) : (
            <Image
              src={withBasePath(photo.src)}
              alt={label}
              width={photo.width}
              height={photo.height}
              sizes="(max-width: 680px) 100vw, 680px"
              className="case-study-cover-photo"
              style={{ width: "100%", height: "auto" }}
            />
          )
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

