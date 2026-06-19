import { useCallback, useEffect, useState } from "react";
import type { RebassSettings } from "@/lib/audio/types";

export interface SavedPreset {
  id: string;
  name: string;
  settings: RebassSettings;
}

const KEY = "rebass.presets.v1";

function load(): SavedPreset[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedPreset[]) : [];
  } catch {
    return [];
  }
}

export function usePresets() {
  const [presets, setPresets] = useState<SavedPreset[]>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(presets));
    } catch {
      // storage unavailable — ignore
    }
  }, [presets]);

  const save = useCallback((name: string, settings: RebassSettings) => {
    const preset: SavedPreset = {
      id: `${Date.now()}`,
      name: name.trim() || "Untitled",
      settings,
    };
    setPresets((prev) => [preset, ...prev]);
  }, []);

  const remove = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { presets, save, remove };
}