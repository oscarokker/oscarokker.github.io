import { Portfolio } from "@/components/Portfolio";

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
