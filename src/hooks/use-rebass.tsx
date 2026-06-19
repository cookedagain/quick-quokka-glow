import React, { createContext, useCallback, useContext, useState } from "react";
import { DEFAULT_SETTINGS, RebassSettings } from "@/lib/audio/types";
import { showSuccess } from "@/utils/toast";
import { useLatestRef } from "./rebass/useLatestRef";
import { useAudioFile } from "./rebass/useAudioFile";
import { useTransport } from "./rebass/useTransport";
import { useRenderer } from "./rebass/useRenderer";
import { usePresets, SavedPreset } from "./rebass/usePresets";

interface RebassContextValue {
  file: File | null;
  buffer: AudioBuffer | null;
  isDecoding: boolean;
  isPlaying: boolean;
  isRendering: boolean;
  settings: RebassSettings;
  cropStart: number;
  cropEnd: number;
  zoom: number;
  pan: number;
  loop: boolean;
  playhead: number;
  userPresets: SavedPreset[];
  loadFile: (f: File) => Promise<void>;
  updateSettings: (p: Partial<RebassSettings>) => void;
  applyPreset: (p: Partial<RebassSettings>) => void;
  savePreset: (name: string) => void;
  applyUserPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  setCrop: (start: number, end: number) => void;
  setZoom: (z: number) => void;
  setPan: (p: number) => void;
  setLoop: (l: boolean) => void;
  setPlayhead: (t: number) => void;
  preview: () => Promise<void>;
  stop: () => void;
  reset: () => void;
  download: () => Promise<void>;
}

const RebassContext = createContext<RebassContextValue | null>(null);

export function RebassProvider({ children }: { children: React.ReactNode }) {
  const { file, buffer, isDecoding, decode } = useAudioFile();

  const [settings, setSettings] = useState<RebassSettings>(DEFAULT_SETTINGS);
  const [cropStart, setCropStart] = useState(0);
  const [cropEnd, setCropEnd] = useState(0);
  const [zoom, setZoomState] = useState(1);
  const [pan, setPan] = useState(0);
  const [loop, setLoop] = useState(false);

  const { presets, save, remove } = usePresets();

  // Latest-value refs for use inside the audio engine callbacks.
  const settingsRef = useLatestRef(settings);
  const cropRef = useLatestRef({ start: cropStart, end: cropEnd });
  const loopRef = useLatestRef(loop);

  const engineRefs = { settingsRef, cropRef, loopRef };

  const { isPlaying, playhead, setPlayhead, preview, stop } = useTransport(
    buffer,
    engineRefs,
  );
  const { isRendering, download } = useRenderer(buffer, file, {
    settingsRef,
    cropRef,
  });

  const updateSettings = useCallback((p: Partial<RebassSettings>) => {
    setSettings((prev) => ({ ...prev, ...p }));
  }, []);

  const applyPreset = useCallback((p: Partial<RebassSettings>) => {
    setSettings((prev) => ({ ...prev, ...p }));
    showSuccess("Preset applied.");
  }, []);

  const savePreset = useCallback(
    (name: string) => {
      save(name, settings);
      showSuccess("Preset saved.");
    },
    [save, settings],
  );

  const applyUserPreset = useCallback(
    (id: string) => {
      const found = presets.find((p) => p.id === id);
      if (found) {
        setSettings(found.settings);
        showSuccess(`Loaded "${found.name}".`);
      }
    },
    [presets],
  );

  const setCrop = useCallback((start: number, end: number) => {
    setCropStart(Math.max(0, start));
    setCropEnd(end);
  }, []);

  const setZoom = useCallback(
    (z: number) => {
      const clamped = Math.max(1, Math.min(40, z));
      setZoomState(clamped);
      if (buffer) {
        const visible = buffer.duration / clamped;
        const maxPan = Math.max(0, buffer.duration - visible);
        setPan((p) => Math.min(p, maxPan));
      }
    },
    [buffer],
  );

  const loadFile = useCallback(
    async (f: File) => {
      stop();
      const buf = await decode(f);
      if (!buf) return;
      setCropStart(0);
      setCropEnd(buf.duration);
      setZoomState(1);
      setPan(0);
      setPlayhead(0);
      setLoop(false);
    },
    [stop, decode, setPlayhead],
  );

  const reset = useCallback(() => {
    stop();
    setSettings(DEFAULT_SETTINGS);
    if (buffer) {
      setCropStart(0);
      setCropEnd(buffer.duration);
    }
    setZoomState(1);
    setPan(0);
    setLoop(false);
    setPlayhead(0);
    showSuccess("Settings reset.");
  }, [buffer, stop, setPlayhead]);

  const value: RebassContextValue = {
    file,
    buffer,
    isDecoding,
    isPlaying,
    isRendering,
    settings,
    cropStart,
    cropEnd,
    zoom,
    pan,
    loop,
    playhead,
    userPresets: presets,
    loadFile,
    updateSettings,
    applyPreset,
    savePreset,
    applyUserPreset,
    deletePreset: remove,
    setCrop,
    setZoom,
    setPan,
    setLoop,
    setPlayhead,
    preview,
    stop,
    reset,
    download,
  };

  return (
    <RebassContext.Provider value={value}>{children}</RebassContext.Provider>
  );
}

export function useRebass() {
  const ctx = useContext(RebassContext);
  if (!ctx) throw new Error("useRebass must be used within a RebassProvider");
  return ctx;
}