"use client";

/**
 * Blocking inline script that still hydrates without React's client-render
 * warning. Server HTML uses `text/javascript` so the browser runs it before
 * paint; the client tree uses `text/plain` so React does not treat it as an
 * executable script. See Next.js "Preventing flash before hydration".
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
