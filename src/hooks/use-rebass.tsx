import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { DEFAULT_SETTINGS, RebassSettings } from "@/lib/audio/types";
import { showSuccess } from "@/utils/toast";
import { useLatestRef } from "./rebass/useLatestRef";
import { useAudioFile } from "./rebass/useAudioFile";
import { useTransport } from "./rebass/useTransport";
import { useRenderer } from "./rebass/useRenderer";
import { usePresets, SavedPreset } from "./rebass/usePresets";
import { useWakeLock } from "./rebass/useWakeLock";
import { buildShareUrl, readSettingsFromUrl } from "@/lib/audio/share";

interface RebassContextValue {
  file: File | null;
  buffer: AudioBuffer | null;
  isDecoding: boolean;
  isPlaying: boolean;
  isOriginal: boolean;
  isRendering: boolean;
  settings: RebassSettings;
  cropStart: number;
  cropEnd: number;
  zoom: number;
  pan: number;
  loop: boolean;
  playhead: number;
  replaceStart: number;
  replaceEnd: number;
  appendLoopToEnd: boolean;
  userPresets: SavedPreset[];
  loadFile: (f: File) => Promise<void>;
  updateSettings: (p: Partial<RebassSettings>) => void;
  applyPreset: (p: Partial<RebassSettings>) => void;
  savePreset: (name: string) => void;
  applyUserPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  setCrop: (start: number, end: number) => void;
  setLoopPoints: (start: number, end: number) => void;
  setLoopStartFromPlayhead: () => void;
  setLoopEndFromPlayhead: () => void;
  setReplaceRange: (start: number, end: number) => void;
  setReplaceStartFromPlayhead: () => void;
  setReplaceEndFromPlayhead: () => void;
  setAppendLoopToEnd: (enabled: boolean) => void;
  setZoom: (z: number) => void;
  setPan: (p: number) => void;
  setLoop: (l: boolean) => void;
  setPlayhead: (t: number) => void;
  preview: (bypass?: boolean) => Promise<void>;
  seekTo: (time: number) => Promise<void>;
  stop: () => void;
  reset: () => void;
  download: () => Promise<void>;
  renderSelection: () => Promise<AudioBuffer | null>;
  shareSettings: () => void;
}

const RebassContext = createContext<RebassContextValue | null>(null);

export function RebassProvider({ children }: { children: React.ReactNode }) {
  const { file, buffer, isDecoding, decode } = useAudioFile();

  const [settings, setSettings] = useState<RebassSettings>(
    () => readSettingsFromUrl() ?? DEFAULT_SETTINGS,
  );
  const [cropStart, setCropStart] = useState(0);
  const [cropEnd, setCropEnd] = useState(0);
  const [replaceStart, setReplaceStart] = useState(0);
  const [replaceEnd, setReplaceEnd] = useState(0);
  const [appendLoopToEnd, setAppendLoopToEnd] = useState(false);
  const [zoom, setZoomState] = useState(1);
  const [pan, setPan] = useState(0);
  const [loop, setLoop] = useState(false);

  const { presets, save, remove } = usePresets();

  const settingsRef = useLatestRef(settings);
  const cropRef = useLatestRef({ start: cropStart, end: cropEnd });
  const loopRef = useLatestRef(loop);
  const replaceRef = useLatestRef({ start: replaceStart, end: replaceEnd });
  const appendLoopToEndRef = useLatestRef(appendLoopToEnd);

  const engineRefs = { settingsRef, cropRef, loopRef };

  const {
    isPlaying,
    isOriginal,
    playhead,
    setPlayhead,
    preview,
    seekTo,
    stop,
  } = useTransport(buffer, engineRefs);
  const { isRendering, download, renderSelection } = useRenderer(buffer, file, {
    settingsRef,
    cropRef,
    replaceRef,
    appendLoopToEndRef,
  });

  useWakeLock(isPlaying);

  useEffect(() => {
    if (readSettingsFromUrl()) {
      showSuccess("Loaded shared settings from link.");
    }
  }, []);

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

  const shareSettings = useCallback(() => {
    const url = buildShareUrl(settings);
    navigator.clipboard
      ?.writeText(url)
      .then(() => showSuccess("Share link copied to clipboard!"))
      .catch(() => {
        window.prompt("Copy this share link:", url);
      });
  }, [settings]);

  const setCrop = useCallback((start: number, end: number) => {
    setCropStart(Math.max(0, start));
    setCropEnd(end);
  }, []);

  const setLoopPoints = useCallback(
    (start: number, end: number) => {
      if (!buffer) return;
      const safeStart = Math.max(0, Math.min(buffer.duration, start));
      const safeEnd = Math.max(safeStart + 0.02, Math.min(buffer.duration, end));
      setCropStart(safeStart);
      setCropEnd(safeEnd);
    },
    [buffer],
  );

  const setLoopStartFromPlayhead = useCallback(() => {
    if (!buffer) return;
    const safeStart = Math.max(0, Math.min(playhead, cropEnd - 0.02));
    setCropStart(safeStart);
    showSuccess("Loop A set from playhead.");
  }, [buffer, playhead, cropEnd]);

  const setLoopEndFromPlayhead = useCallback(() => {
    if (!buffer) return;
    const safeEnd = Math.max(cropStart + 0.02, Math.min(playhead, buffer.duration));
    setCropEnd(safeEnd);
    showSuccess("Loop B set from playhead.");
  }, [buffer, playhead, cropStart]);

  const setReplaceRange = useCallback(
    (start: number, end: number) => {
      if (!buffer) return;
      const safeStart = Math.max(0, Math.min(buffer.duration, start));
      const safeEnd = Math.max(safeStart + 0.02, Math.min(buffer.duration, end));
      setReplaceStart(safeStart);
      setReplaceEnd(safeEnd);
    },
    [buffer],
  );

  const setReplaceStartFromPlayhead = useCallback(() => {
    if (!buffer) return;
    const safeStart = Math.max(0, Math.min(playhead, replaceEnd - 0.02));
    setReplaceStart(safeStart);
    showSuccess("Cut start set from playhead.");
  }, [buffer, playhead, replaceEnd]);

  const setReplaceEndFromPlayhead = useCallback(() => {
    if (!buffer) return;
    const safeEnd = Math.max(replaceStart + 0.02, Math.min(playhead, buffer.duration));
    setReplaceEnd(safeEnd);
    showSuccess("Cut end set from playhead.");
  }, [buffer, playhead, replaceStart]);

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
      setReplaceStart(Math.max(0, buf.duration - Math.min(8, buf.duration)));
      setReplaceEnd(buf.duration);
      setAppendLoopToEnd(false);
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
      setReplaceStart(Math.max(0, buffer.duration - Math.min(8, buffer.duration)));
      setReplaceEnd(buffer.duration);
    }
    setAppendLoopToEnd(false);
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
    isOriginal,
    isRendering,
    settings,
    cropStart,
    cropEnd,
    zoom,
    pan,
    loop,
    playhead,
    replaceStart,
    replaceEnd,
    appendLoopToEnd,
    userPresets: presets,
    loadFile,
    updateSettings,
    applyPreset,
    savePreset,
    applyUserPreset,
    deletePreset: remove,
    setCrop,
    setLoopPoints,
    setLoopStartFromPlayhead,
    setLoopEndFromPlayhead,
    setReplaceRange,
    setReplaceStartFromPlayhead,
    setReplaceEndFromPlayhead,
    setAppendLoopToEnd,
    setZoom,
    setPan,
    setLoop,
    setPlayhead,
    preview,
    seekTo,
    stop,
    reset,
    download,
    renderSelection,
    shareSettings,
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