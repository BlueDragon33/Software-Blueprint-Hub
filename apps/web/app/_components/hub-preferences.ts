"use client";

import { useEffect, useState } from "react";

export type HubLanguage = "vi" | "en";
export type HubDensity = "comfortable" | "compact";
const LANGUAGE_KEY = "blueprint:hub:language";
const DENSITY_KEY = "blueprint:hub:density";
export const PREFERENCES_EVENT = "blueprint-hub-preferences-changed";

export function useHubPreferences() {
  const [language, setLanguageState] = useState<HubLanguage>("vi");
  const [density, setDensityState] = useState<HubDensity>("comfortable");

  useEffect(() => {
    const sync = () => {
      try {
        setLanguageState(window.localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "vi");
        setDensityState(window.localStorage.getItem(DENSITY_KEY) === "compact" ? "compact" : "comfortable");
      } catch {
        // Strict browser storage policies must not prevent UI access.
      }
    };
    sync();
    window.addEventListener(PREFERENCES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PREFERENCES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setLanguage = (next: HubLanguage) => {
    setLanguageState(next);
    try { window.localStorage.setItem(LANGUAGE_KEY, next); } catch { /* ephemeral */ }
    window.dispatchEvent(new Event(PREFERENCES_EVENT));
  };
  const setDensity = (next: HubDensity) => {
    setDensityState(next);
    try { window.localStorage.setItem(DENSITY_KEY, next); } catch { /* ephemeral */ }
    window.dispatchEvent(new Event(PREFERENCES_EVENT));
  };
  return { language, density, setLanguage, setDensity };
}
