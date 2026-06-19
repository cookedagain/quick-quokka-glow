import { useCallback, useEffect, useRef, useState } from "react";
import { buildGraph } from "@/lib/audio/graph";
import { createAudioContext } from "@/lib/audio/context";
import { showError } from "@/utils/toast";
import type { EngineRefs } from "./types";

interface PlaybackWindow {
  start: number;
  end: number;
  loopStart: number;
  loopEnd: number;
}

const MIN_PLAYABLE_SECONDS = 0.02;

export function useTransport(
  buffer: AudioBuffer | null,
  { settingsRef, cropRef, loopRef }: EngineRefs,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOriginal, setIsOriginal] = useState(false);
  const [playhead, setPlayheadState] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const oscRef = useRef<OscillatorNode[]>([]);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const playheadRef = useRef(0);
  const playingRef = useRef(false);
  const bypassRef = useRef(false);
  const playbackWindowRef = useRef<PlaybackWindow>({
    start: 0,
    end: 0,
    loopStart: 0,
    loopEnd: 0,
  });

  const setPlayhead = useCallback((time: number) => {
    playheadRef.current = time;
    setPlayheadState(time);
  }, []);

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
    const speed = bypassRef.current ? 1 : s.speed;
    const elapsed = Math.max(0, ctx.currentTime - startTimeRef.current);
    const srcElapsed = elapsed * speed;
    const win = playbackWindowRef.current;

    const pos = loopRef.current
      ? win.loopStart + ((win.start - win.loopStart + srcElapsed) % Math.max(0.0001, win.loopEnd - win.loopStart))
      : Math.min(win.end, win.start + srcElapsed);

    setPlayhead(pos);
    rafRef.current = requestAnimationFrame(animate);
  }, [settingsRef, loopRef, setPlayhead]);

  const startPlayback = useCallback(
    async (fromTime: number, bypass = false) => {
      if (!buffer) return;

      const { start: cropStart, end: cropEnd } = cropRef.current;
      const duration = buffer.duration;
      const cropDuration = cropEnd - cropStart;

      if (cropDuration < MIN_PLAYABLE_SECONDS) {
        showError("Selection is too short to preview.");
        return;
      }

      const loop = loopRef.current;
      const isInsideCrop = fromTime >= cropStart && fromTime < cropEnd;
      const targetStart = loop ? cropStart : 0;
      const playbackEnd = loop || isInsideCrop ? cropEnd : duration;
      const maxSeek = Math.max(targetStart, playbackEnd - MIN_PLAYABLE_SECONDS);
      const seekTime = Math.max(targetStart, Math.min(maxSeek, fromTime));
      const sourceDuration = Math.max(
        MIN_PLAYABLE_SECONDS,
        playbackEnd - seekTime,
      );

      stop();

      const ctx = ensureCtx();
      await ctx.resume();
      const s = settingsRef.current;
      bypassRef.current = bypass;

      const startTime = ctx.currentTime + 0.06;
      startTimeRef.current = startTime;
      playbackWindowRef.current = {
        start: seekTime,
        end: playbackEnd,
        loopStart: cropStart,
        loopEnd: cropEnd,
      };

      const { source, oscillators } = buildGraph(ctx, buffer, s, {
        cropStart: loop ? cropStart : seekTime,
        cropEnd: playbackEnd,
        loop,
        applyFades: !loop && !bypass,
        startTime,
        bypass,
      });

      if (loop) {
        source.start(startTime, seekTime);
      } else {
        source.start(startTime, seekTime, sourceDuration);
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
    [
      buffer,
      cropRef,
      loopRef,
      stop,
      ensureCtx,
      settingsRef,
      setPlayhead,
      animate,
    ],
  );

  const preview = useCallback(
    async (bypass = false) => {
      const { start, end } = cropRef.current;
      const current = playheadRef.current;
      const fromTime = current >= start && current < end ? current : start;
      await startPlayback(fromTime, bypass);
    },
    [cropRef, startPlayback],
  );

  const seekTo = useCallback(
    async (time: number) => {
      if (!buffer) return;

      const { start, end } = cropRef.current;
      const loop = loopRef.current;
      const targetStart = loop ? start : 0;
      const targetEnd = loop ? end : buffer.duration;
      const maxSeek = Math.max(targetStart, targetEnd - MIN_PLAYABLE_SECONDS);
      const seekTime = Math.max(targetStart, Math.min(maxSeek, time));

      setPlayhead(seekTime);

      if (!playingRef.current) return;

      await startPlayback(seekTime, bypassRef.current);
    },
    [buffer, cropRef, loopRef, setPlayhead, startPlayback],
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
