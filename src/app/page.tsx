import type { Metadata, ResolvingMetadata } from "next";
import { Portfolio } from "@/components/Portfolio";
import "./ghostlink.css";

const HOME_SHARE_IMAGE = "https://oscarrode.com/og/home-og.png";

export async function generateMetadata(
  _props: PageProps<"/">,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const previous = await parent;
  const title = previous.title?.absolute || "Oscar Rode · Design Portfolio";

  return {
    openGraph: {
      ...previous.openGraph,
      images: [
        {
          url: HOME_SHARE_IMAGE,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      ...previous.twitter,
      card: "summary_large_image",
      images: [HOME_SHARE_IMAGE],
    },
  };
}

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": "https://oscarrode.com/#person",
        name: "Oscar Rode",
        jobTitle: "UX Designer",
        url: "https://oscarrode.com/",
        image: "https://oscarrode.com/oscar-rode-profile-picture.png",
        sameAs: ["https://www.linkedin.com/in/oscarrode/"],
        email: "oscarrode99@gmail.com",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Copenhagen",
          addressCountry: "DK",
        },
        knowsAbout: [
          "UX Design",
          "UI Design",
          "Human-AI Interaction",
          "Product Design",
          "Conversational AI",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://oscarrode.com/#website",
        url: "https://oscarrode.com/",
        name: "Oscar Rode Portfolio",
        description:
          "Portfolio of Oscar Rode, UX/UI Designer specializing in Human-AI interaction and product design.",
        author: {
          "@id": "https://oscarrode.com/#person",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Portfolio initialFilter="all" />
    </>
  );
}
