"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_PREFERENCES } from "@/lib/defaults";
import { loadPreferences, savePreferences } from "@/lib/db";
import { toDateInputValue, toTimeInputValue } from "@/lib/format";
import type { Preferences } from "@/types";

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);
  const dirty = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void loadPreferences()
      .then((saved) => {
        if (cancelled || dirty.current) return;
        const now = new Date();
        const merged: Preferences = {
          ...DEFAULT_PREFERENCES,
          ...saved,
          stamp: { ...DEFAULT_PREFERENCES.stamp, ...saved?.stamp },
          dateTime: { ...DEFAULT_PREFERENCES.dateTime, ...saved?.dateTime },
        };
        if (!merged.dateTime.manualDate) merged.dateTime.manualDate = toDateInputValue(now);
        if (!merged.dateTime.manualTime) merged.dateTime.manualTime = toTimeInputValue(now);
        setPreferences(merged);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !dirty.current) return;
    const timer = window.setTimeout(() => {
      void savePreferences(preferences).catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [preferences, ready]);

  const update = (patch: Partial<Preferences> | ((current: Preferences) => Preferences)) => {
    dirty.current = true;
    setPreferences((current) => (typeof patch === "function" ? patch(current) : { ...current, ...patch }));
  };

  const replace = (next: Preferences) => {
    dirty.current = false;
    setPreferences(next);
  };

  return { preferences, update, replace, ready };
}
