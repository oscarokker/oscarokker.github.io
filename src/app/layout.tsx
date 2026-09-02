import type { Metadata, Viewport } from "next";
import { Lora, Open_Sans } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { InlineScript } from "@/components/InlineScript";
import { ThemeProvider } from "@/components/ThemeProvider";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { CASE_STUDY_BOOT_SCRIPT } from "@/lib/case-study-href";
import "./globals.css";

const SITE_TITLE = "Oscar Rode · Design Portfolio";
const SITE_DESCRIPTION =
  "Portfolio of Oscar Rode, UX/UI Designer specializing in Human-AI interaction and product design. Based in Copenhagen, Denmark. Co-founder and UX designer of CheapVoyage, an AI-driven conversational travel planner.";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

const openSans = Open_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://oscarrode.com"),
  title: {
    default: SITE_TITLE,
    template: "%s · Oscar Rode",
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "en_GB",
    url: "https://oscarrode.com/",
    siteName: "Oscar Rode · Design Portfolio",
    images: [
      {
        url: "/oscar-rode-profile-picture.png",
        width: 800,
        height: 800,
        alt: "Oscar Rode",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/oscar-rode-profile-picture.png"],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F0EEE6" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0C14" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${openSans.variable} h-full antialiased`}
      suppressHydrationWarning
      data-theme="light"
      data-scroll-behavior="smooth"
    >
      <head>
        <InlineScript html={THEME_INIT_SCRIPT} />
        <InlineScript html={CASE_STUDY_BOOT_SCRIPT} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
