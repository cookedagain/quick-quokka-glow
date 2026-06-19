import React, { createContext, useCallback, useContext, useState } from "react";
import { DEFAULT_SETTINGS, RebassSettings } from "@/lib/audio/types";
import { showSuccess } from "@/utils/toast";
import { useLatestRef } from "./rebass/useLatestRef";
import { useAudioFile } from "./rebass/useAudioFile";
import { useTransport } from "./rebass/useTransport";
import { useRenderer } from "./rebass/useRenderer";

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
  loadFile: (f: File) => Promise<void>;
  updateSettings: (p: Partial<RebassSettings>) => void;
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
    loadFile,
    updateSettings,
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