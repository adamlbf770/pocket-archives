"use client";

import { useEffect } from "react";

/**
 * Gives detail screens a local back destination even when they were opened
 * directly from a message, search result, or a mobile browser shortcut.
 */
export function useMobileReturn(fallback: string) {
  useEffect(() => {
    const marker = `pocket-archives-return-${Date.now()}`;
    const currentState =
      window.history.state && typeof window.history.state === "object"
        ? window.history.state
        : {};

    window.history.pushState(
      { ...currentState, pocketArchivesReturn: marker },
      "",
      window.location.href,
    );

    let returning = false;
    const returnInsideSite = () => {
      if (returning) return;
      returning = true;
      window.location.replace(fallback);
    };

    window.addEventListener("popstate", returnInsideSite);
    return () => window.removeEventListener("popstate", returnInsideSite);
  }, [fallback]);
}
