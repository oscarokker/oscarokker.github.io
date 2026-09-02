"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";
import { useCaseStudyTransitionOptional } from "@/components/case-studies/CaseStudiesTransition";
import { isCaseStudyPath } from "@/lib/case-study-href";
import { useTheme } from "@/components/ThemeProvider";
import { useCursorLabelOptional } from "@/hooks/useCursorLabel";

interface HeaderProps {
  visible?: boolean;
}

export function Header({ visible = true }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const cursor = useCursorLabelOptional();
  const setCursorLabel = cursor?.setCursorLabel;
  const themeToggleRef = useRef<HTMLButtonElement>(null);
  const cursorLabel = `Switch to ${theme === "light" ? "dark" : "light"} mode`;
  const themeToggleLabel = "Toggle color theme";
  const pathname = usePathname();
  const caseStudyTransition = useCaseStudyTransitionOptional();
  const phase = caseStudyTransition?.phase ?? "idle";
  const insideCaseStudy =
    isCaseStudyPath(pathname) ||
    phase === "expanding" ||
    phase === "covering" ||
    phase === "revealing";

  const handleHomeClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!themeToggleRef.current?.matches(":hover")) return;
    setCursorLabel?.({ text: cursorLabel });
  }, [cursorLabel, setCursorLabel]);

  if (insideCaseStudy) {
    return null;
  }

  return (
    <header
      className="site-header fixed top-0 left-0 right-0 z-50 pointer-events-none"
      data-visible={visible ? "true" : "false"}
      inert={!visible || undefined}
    >
      <div className="site-header-inner">
        <Link
          href="/"
          className={
            visible
              ? "pointer-events-auto inline-flex items-center no-underline shrink-0 header-logo-link"
              : "inline-flex items-center no-underline shrink-0 header-logo-link"
          }
          aria-label="Oscar Rode home"
          onClick={handleHomeClick}
        >
          <span className="inline-flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="header-logo block size-8"
              aria-label="Oscar Rode logo"
            >
              <path d="M3.5 32C9.5 30 29.3425 22.5 42.58 0L24.62 41.5C26.7325 32 25.2325 32.5 3.5 32Z" fill="currentColor"/>
              <path d="M60.5 32C54.5 34 34.6575 41.5 21.42 64L39.38 22.5C37.2675 32 38.7675 31.5 60.5 32Z" fill="currentColor"/>
            </svg>
          </span>
        </Link>

        <div
          className={
            visible ? "pointer-events-auto flex items-center" : "flex items-center"
          }
        >
          <button
            ref={themeToggleRef}
            type="button"
            onClick={toggleTheme}
            aria-label={themeToggleLabel}
            data-cursor-label={cursorLabel}
            className="intro-chrome-icon-btn theme-toggle-btn"
          >
            <span className="theme-toggle-icon" data-icon="sun" aria-hidden>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </span>
            <span className="theme-toggle-icon" data-icon="moon" aria-hidden>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
