"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const NEAR_TOP_PX = 120;
const MIN_DELTA_PX = 10;

const HeaderVisibilityContext = createContext<boolean | null>(null);

function useHeaderVisibilityState() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const update = () => {
      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY;

      if (scrollY <= NEAR_TOP_PX) {
        setVisible(true);
      } else if (Math.abs(delta) > MIN_DELTA_PX) {
        setVisible(delta < 0);
      }

      lastScrollY = scrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return visible;
}

export function HeaderVisibilityProvider({ children }: { children: ReactNode }) {
  const visible = useHeaderVisibilityState();
  return (
    <HeaderVisibilityContext.Provider value={visible}>
      {children}
    </HeaderVisibilityContext.Provider>
  );
}

export function useHeaderVisibility() {
  const value = useContext(HeaderVisibilityContext);
  if (value === null) {
    throw new Error(
      "useHeaderVisibility must be used within HeaderVisibilityProvider",
    );
  }
  return value;
}
