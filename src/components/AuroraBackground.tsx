"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { isCaseStudyPath } from "@/lib/case-study-href";

export function AuroraBackground() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const visible = theme === "dark" && !isCaseStudyPath(pathname);

  return (
    <div
      className="aurora-bg"
      data-visible={visible ? "true" : "false"}
      aria-hidden
    />
  );
}
