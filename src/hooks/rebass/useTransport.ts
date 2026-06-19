import { useCallback, useEffect, useRef, useState } from "react";
import { buildGraph } from "@/lib/audio/graph";
import { createAudioContext } from "@/lib/audio/context";
import { showError } from "@/utils/toast";
import type { EngineRefs } from "./types";

export function useTransport(
  buffer: AudioBuffer | null,
  { settingsRef, cropRef, loopRef }: EngineRefs,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOriginal, setIsOriginal] = useState(false);
  const [playhead, setPlayhead] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const oscRef = useRef<OscillatorNode[]>([]);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const playingRef = useRef(false);
  const bypassRef = useRef(false);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = createAudioContext();
    return ctxRef.current;
  }, []);

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
    setIsOriginal(false);
  }, []);

  const animate = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !playingRef.current) return;
    const s = settingsRef.current;
    const { start, end } = cropRef.current;
    const speed = bypassRef.current ? 1 : s.speed;
    const elapsed = ctx.currentTime - startTimeRef.current;
    const srcElapsed = elapsed * speed;
    const len = Math.max(0.0001, end - start);
    const pos = loopRef.current
      ? start + (srcElapsed % len)
      : Math.min(end, start + srcElapsed);
    setPlayhead(pos);
    rafRef.current = requestAnimationFrame(animate);
  }, [settingsRef, cropRef, loopRef]);

  const startPlayback = useCallback(
    async (fromTime: number, bypass = false) => {
      if (!buffer) return;
      stop();
      const ctx = ensureCtx();
      await ctx.resume();
      const s = settingsRef.current;
      const { start, end } = cropRef.current;
      const seekTime = Math.max(start, Math.min(end, fromTime));
      const remainingDuration = Math.max(0.02, end - seekTime);

      if (end - start < 0.02) {
        showError("Selection is too short to preview.");
        return;
      }

      bypassRef.current = bypass;
      const startTime = ctx.currentTime + 0.06;
      startTimeRef.current = startTime;

      const { source, oscillators } = buildGraph(ctx, buffer, s, {
        cropStart: start,
        cropEnd: end,
        loop: loopRef.current,
        applyFades: !loopRef.current && !bypass,
        startTime,
        bypass,
      });

      if (loopRef.current) {
        source.start(startTime, seekTime);
      } else {
        source.start(startTime, seekTime, remainingDuration);
      }
      oscillators.forEach((o) => o.start(startTime));

      source.onended = () => {
        if (!loopRef.current) stop();
      };

      sourceRef.current = source;
      oscRef.current = oscillators;
      playingRef.current = true;
      setIsPlaying(true);
      setIsOriginal(bypass);
      setPlayhead(seekTime);
      rafRef.current = requestAnimationFrame(animate);
    },
    [buffer, stop, animate, ensureCtx, settingsRef, cropRef, loopRef],
  );

  const preview = useCallback(
    async (bypass = false) => {
      const { start } = cropRef.current;
      await startPlayback(start, bypass);
    },
    [cropRef, startPlayback],
  );

  const seekTo = useCallback(
    async (time: number) => {
      const { start, end } = cropRef.current;
      const seekTime = Math.max(start, Math.min(end, time));
      setPlayhead(seekTime);

      if (!playingRef.current) return;

      await startPlayback(seekTime, bypassRef.current);
    },
    [cropRef, startPlayback],
  );

  useEffect(() => () => stop(), [stop]);

  return {
    isPlaying,
    isOriginal,
    playhead,
    setPlayhead,
    preview,
    seekTo,
    stop,
  };
}