"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { isChristmasSeason } from "@/shared/branding/christmasSeason";

const ChristmasContext = createContext(false);

function subscribe(onChange: () => void) {
  // Recheck open tabs at midnight, after sleep, and on return to the page.
  // Ecuador uses UTC-5 year-round; schedule the next local date boundary.
  let timer: ReturnType<typeof setTimeout>;
  const update = () => {
    clearTimeout(timer);
    onChange();
    const now = Date.now();
    const day = 86_400_000;
    const ecuadorOffset = 5 * 60 * 60 * 1000;
    const nextMidnight = Math.floor((now - ecuadorOffset) / day) * day + day + ecuadorOffset;
    timer = setTimeout(update, nextMidnight - now + 100);
  };
  update();
  window.addEventListener("focus", update);
  document.addEventListener("visibilitychange", update);
  return () => {
    clearTimeout(timer);
    window.removeEventListener("focus", update);
    document.removeEventListener("visibilitychange", update);
  };
}

export function SeasonalBrandingProvider({ initialActive, children }: {
  initialActive: boolean;
  children: React.ReactNode;
}) {
  const active = useSyncExternalStore(subscribe, isChristmasSeason, () => initialActive);
  return <ChristmasContext.Provider value={active}>{children}</ChristmasContext.Provider>;
}

export function useChristmasSeason() {
  return useContext(ChristmasContext);
}
