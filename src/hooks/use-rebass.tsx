import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { decodeFile } from "@/lib/audio/decode";
import { buildGraph } from "@/lib/audio/graph";
import { encodeWav } from "@/lib/audio/wavEncoder";
import { DEFAULT_SETTINGS, RebassSettings } from "@/lib/audio/types";
import { showError, showSuccess } from "@/utils/toast";

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
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [settings, setSettings] = useState<RebassSettings>(DEFAULT_SETTINGS);
  const [cropStart, setCropStart] = useState(0);
  const [cropEnd, setCropEnd] = useState(0);
  const [zoom, setZoomState] = useState(1);
  const [pan, setPan] = useState(0);
  const [loop, setLoop] = useState(false);
  const [playhead, setPlayhead] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const oscRef = useRef<OscillatorNode[]>([]);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

  // refs to read latest values inside rAF / callbacks
  const settingsRef = useRef(settings);
  const cropRef = useRef({ start: cropStart, end: cropEnd });
  const loopRef = useRef(loop);
  const playingRef = useRef(false);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    cropRef.current = { start: cropStart, end: cropEnd };
  }, [cropStart, cropEnd]);
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  const stop = useCallback(() => {
    playingRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (sourceRef.current) {
      try {
        sourceRef.current.onended = null;
        sourceRef.current.stop();
      } catch {
        // already stopped
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    oscRef.current.forEach((o) => {
      try {
        o.stop();
      } catch {
        // ignore
      }
      o.disconnect();
    });
    oscRef.current = [];
    setIsPlaying(false);
  }, []);

  const updateSettings = useCallback((p: Partial<RebassSettings>) => {
    setSettings((prev) => ({ ...prev, ...p }));
  }, []);

  const setCrop = useCallback((start: number, end: number) => {
    setCropStart(Math.max(0, start));
    setCropEnd(end);
  }, []);

  const ensureCtx = () => {
    if (!ctxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  };

  const animate = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !playingRef.current) return;
    const s = settingsRef.current;
    const { start, end } = cropRef.current;
    const elapsed = ctx.currentTime - startTimeRef.current;
    const srcElapsed = elapsed * s.speed;
    const len = Math.max(0.0001, end - start);
    let pos: number;
    if (loopRef.current) {
      pos = start + (srcElapsed % len);
    } else {
      pos = Math.min(end, start + srcElapsed);
    }
    setPlayhead(pos);
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  const preview = useCallback(async () => {
    if (!buffer) return;
    stop();
    const ctx = ensureCtx();
    await ctx.resume();
    const s = settingsRef.current;
    const { start, end } = cropRef.current;
    if (end - start < 0.02) {
      showError("Selection is too short to preview.");
      return;
    }
    const startTime = ctx.currentTime + 0.06;
    startTimeRef.current = startTime;

    const { source, oscillators } = buildGraph(ctx, buffer, s, {
      cropStart: start,
      cropEnd: end,
      loop: loopRef.current,
      applyFades: !loopRef.current,
      startTime,
    });

    if (loopRef.current) {
      source.start(startTime, start);
    } else {
      source.start(startTime, start, end - start);
    }
    oscillators.forEach((o) => o.start(startTime));

    source.onended = () => {
      if (!loopRef.current) stop();
    };

    sourceRef.current = source;
    oscRef.current = oscillators;
    playingRef.current = true;
    setIsPlaying(true);
    setPlayhead(start);
    rafRef.current = requestAnimationFrame(animate);
  }, [buffer, stop, animate]);

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
      setIsDecoding(true);
      try {
        const buf = await decodeFile(f);
        setFile(f);
        setBuffer(buf);
        setCropStart(0);
        setCropEnd(buf.duration);
        setZoomState(1);
        setPan(0);
        setPlayhead(0);
        setLoop(false);
        showSuccess(`Loaded "${f.name}"`);
      } catch (e) {
        showError(
          "Could not decode audio from this file. Try a different audio or video file.",
        );
      } finally {
        setIsDecoding(false);
      }
    },
    [stop],
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
  }, [buffer, stop]);

  const download = useCallback(async () => {
    if (!buffer) return;
    const s = settingsRef.current;
    const { start, end } = cropRef.current;
    if (end - start < 0.02) {
      showError("Selection is too short to render.");
      return;
    }
    setIsRendering(true);
    try {
      const realDur = (end - start) / s.speed;
      const reverbTail = s.reverbMix > 0 ? s.reverbRoomSize + 0.5 : 0;
      const echoTail =
        s.echoMix > 0
          ? Math.min(4, s.echoTime / (1 - Math.min(0.95, s.echoFeedback)))
          : 0;
      const tail = Math.max(reverbTail, echoTail);
      const sampleRate = buffer.sampleRate;
      const length = Math.ceil(sampleRate * (realDur + tail));

      const offline = new OfflineAudioContext(2, length, sampleRate);
      const { source, oscillators } = buildGraph(offline, buffer, s, {
        cropStart: start,
        cropEnd: end,
        loop: false,
        applyFades: true,
        startTime: 0,
      });
      source.start(0, start, end - start);
      oscillators.forEach((o) => o.start(0));

      const rendered = await offline.startRendering();
      const blob = encodeWav(rendered);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = file?.name?.replace(/\.[^.]+$/, "") ?? "rebass";
      a.href = url;
      a.download = `${base}-rebass.wav`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showSuccess("Rendered & downloaded your WAV!");
    } catch (e) {
      showError("Rendering failed. Try a shorter selection.");
    } finally {
      setIsRendering(false);
    }
  }, [buffer, file]);

  useEffect(() => () => stop(), [stop]);

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

export function useRI'll re-output the hook file completely to ensure it's whole, then continue with the components.

<dyad-write path="src/hooks/use-rebass.tsx" description="Central editor state, transport controls and offline rendering.">
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { decodeFile } from "@/lib/audio/decode";
import { buildGraph } from "@/lib/audio/graph";
import { encodeWav } from "@/lib/audio/wavEncoder";
import { DEFAULT_SETTINGS, RebassSettings } from "@/lib/audio/types";
import { showError, showSuccess } from "@/utils/toast";

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
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [settings, setSettings] = useState<RebassSettings>(DEFAULT_SETTINGS);
  const [cropStart, setCropStart] = useState(0);
  const [cropEnd, setCropEnd] = useState(0);
  const [zoom, setZoomState] = useState(1);
  const [pan, setPan] = useState(0);
  const [loop, setLoop] = useState(false);
  const [playhead, setPlayhead] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const oscRef = useRef<OscillatorNode[]>([]);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

  // refs to read latest values inside rAF / callbacks
  const settingsRef = useRef(settings);
  const cropRef = useRef({ start: cropStart, end: cropEnd });
  const loopRef = useRef(loop);
  const playingRef = useRef(false);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    cropRef.current = { start: cropStart, end: cropEnd };
  }, [cropStart, cropEnd]);
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  const stop = useCallback(() => {
    playingRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (sourceRef.current) {
      try {
        sourceRef.current.onended = null;
        sourceRef.current.stop();
      } catch {
        // already stopped
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    oscRef.current.forEach((o) => {
      try {
        o.stop();
      } catch {
        // ignore
      }
      o.disconnect();
    });
    oscRef.current = [];
    setIsPlaying(false);
  }, []);

  const updateSettings = useCallback((p: Partial<RebassSettings>) => {
    setSettings((prev) => ({ ...prev, ...p }));
  }, []);

  const setCrop = useCallback((start: number, end: number) => {
    setCropStart(Math.max(0, start));
    setCropEnd(end);
  }, []);

  const ensureCtx = () => {
    if (!ctxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  };

  const animate = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !playingRef.current) return;
    const s = settingsRef.current;
    const { start, end } = cropRef.current;
    const elapsed = ctx.currentTime - startTimeRef.current;
    const srcElapsed = elapsed * s.speed;
    const len = Math.max(0.0001, end - start);
    let pos: number;
    if (loopRef.current) {
      pos = start + (srcElapsed % len);
    } else {
      pos = Math.min(end, start + srcElapsed);
    }
    setPlayhead(pos);
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  const preview = useCallback(async () => {
    if (!buffer) return;
    stop();
    const ctx = ensureCtx();
    await ctx.resume();
    const s = settingsRef.current;
    const { start, end } = cropRef.current;
    if (end - start < 0.02) {
      showError("Selection is too short to preview.");
      return;
    }
    const startTime = ctx.currentTime + 0.06;
    startTimeRef.current = startTime;

    const { source, oscillators } = buildGraph(ctx, buffer, s, {
      cropStart: start,
      cropEnd: end,
      loop: loopRef.current,
      applyFades: !loopRef.current,
      startTime,
    });

    if (loopRef.current) {
      source.start(startTime, start);
    } else {
      source.start(startTime, start, end - start);
    }
    oscillators.forEach((o) => o.start(startTime));

    source.onended = () => {
      if (!loopRef.current) stop();
    };

    sourceRef.current = source;
    oscRef.current = oscillators;
    playingRef.current = true;
    setIsPlaying(true);
    setPlayhead(start);
    rafRef.current = requestAnimationFrame(animate);
  }, [buffer, stop, animate]);

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
      setIsDecoding(true);
      try {
        const buf = await decodeFile(f);
        setFile(f);
        setBuffer(buf);
        setCropStart(0);
        setCropEnd(buf.duration);
        setZoomState(1);
        setPan(0);
        setPlayhead(0);
        setLoop(false);
        showSuccess(`Loaded "${f.name}"`);
      } catch (e) {
        showError(
          "Could not decode audio from this file. Try a different audio or video file.",
        );
      } finally {
        setIsDecoding(false);
      }
    },
    [stop],
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
  }, [buffer, stop]);

  const download = useCallback(async () => {
    if (!buffer) return;
    const s = settingsRef.current;
    const { start, end } = cropRef.current;
    if (end - start < 0.02) {
      showError("Selection is too short to render.");
      return;
    }
    setIsRendering(true);
    try {
      const realDur = (end - start) / s.speed;
      const reverbTail = s.reverbMix > 0 ? s.reverbRoomSize + 0.5 : 0;
      const echoTail =
        s.echoMix > 0
          ? Math.min(4, s.echoTime / (1 - Math.min(0.95, s.echoFeedback)))
          : 0;
      const tail = Math.max(reverbTail, echoTail);
      const sampleRate = buffer.sampleRate;
      const length = Math.ceil(sampleRate * (realDur + tail));

      const offline = new OfflineAudioContext(2, length, sampleRate);
      const { source, oscillators } = buildGraph(offline, buffer, s, {
        cropStart: start,
        cropEnd: end,
        loop: false,
        applyFades: true,
        startTime: 0,
      });
      source.start(0, start, end - start);
      oscillators.forEach((o) => o.start(0));

      const rendered = await offline.startRendering();
      const blob = encodeWav(rendered);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = file?.name?.replace(/\.[^.]+$/, "") ?? "rebass";
      a.href = url;
      a.download = `${base}-rebass.wav`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showSuccess("Rendered & downloaded your WAV!");
    } catch (e) {
      showError("Rendering failed. Try a shorter selection.");
    } finally {
      setIsRendering(false);
    }
  }, [buffer, file]);

  useEffect(() => () => stop(), [stop]);

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