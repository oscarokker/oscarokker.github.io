import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/AppShell";
import { InlineScript } from "@/components/InlineScript";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ContinuousCorners } from "@/components/ContinuousCorners";
import { ExpandedBackdropSettle } from "@/components/ExpandedBackdropSettle";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { CASE_STUDY_BOOT_SCRIPT } from "@/lib/case-study-href";
import { READING_BOOT_SCRIPT } from "@/lib/reading-mode";
import { PORTFOLIO_FILTER_BOOT_SCRIPT } from "@/lib/portfolio-filter";
import { DEVICE_INIT_SCRIPT } from "@/lib/device";
import "./globals.css";

const SITE_TITLE = "Oscar Rode · Design Portfolio";
const seoDescription =
  "UI/UX designer in Copenhagen who turns complexity into clarity. Case studies in human-AI interaction, including CheapVoyage, a conversational travel planner.";

const satoshi = localFont({
  src: "../fonts/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  display: "swap",
  weight: "300 900",
});

const nunitoSans = localFont({
  src: "../fonts/NunitoSans-latin.woff2",
  variable: "--font-nunito",
  display: "swap",
  weight: "200 1000",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://oscarrode.com"),
  title: {
    default: SITE_TITLE,
    template: "%s · Oscar Rode",
  },
  description: seoDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_TITLE,
    description: seoDescription,
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
    description: seoDescription,
    images: ["/oscar-rode-profile-picture.png"],
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
      className={`${satoshi.variable} ${nunitoSans.variable} h-full antialiased`}
      suppressHydrationWarning
      data-theme="light"
      data-scroll-behavior="smooth"
    >
      <head>
        <InlineScript html={THEME_INIT_SCRIPT} />
        <InlineScript html={DEVICE_INIT_SCRIPT} />
        <InlineScript html={CASE_STUDY_BOOT_SCRIPT} />
        <InlineScript html={READING_BOOT_SCRIPT} />
        <InlineScript html={PORTFOLIO_FILTER_BOOT_SCRIPT} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <ContinuousCorners />
          <ExpandedBackdropSettle />
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
