import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="case-study-page">
      <div className="case-study-page-inner">
        <header className="case-study-header">
          <h1 className="case-study-headline">Page not found</h1>
        </header>
        <p className="case-study-intro">
          That route isn&apos;t part of this portfolio.
        </p>
        <p>
          <Link href="/" className="not-found-home">
            Back to the grid
          </Link>
        </p>
      </div>
    </main>
  );
}
