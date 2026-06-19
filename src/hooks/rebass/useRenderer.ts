import { useCallback, useState } from "react";
import { buildGraph } from "@/lib/audio/graph";
import { encodeWav } from "@/lib/audio/wavEncoder";
import { showError, showSuccess } from "@/utils/toast";
import type { EngineRefs } from "./types";

type RendererRefs = Pick<EngineRefs, "settingsRef" | "cropRef"> & {
  replaceRef: { current: { start: number; end: number } };
  appendLoopToEndRef: { current: boolean };
};

function copyChannelSlice(
  source: Float32Array,
  target: Float32Array,
  sourceStart: number,
  sourceEnd: number,
  targetStart: number,
) {
  const slice = source.subarray(sourceStart, sourceEnd);
  target.set(slice, targetStart);
  return slice.length;
}

function stitchBuffers(
  ctx: OfflineAudioContext,
  original: AudioBuffer,
  loopBuffer: AudioBuffer,
  replaceStart: number,
  replaceEnd: number,
): AudioBuffer {
  const sampleRate = original.sampleRate;
  const replaceStartSample = Math.max(0, Math.floor(replaceStart * sampleRate));
  const replaceEndSample = Math.max(
    replaceStartSample,
    Math.floor(replaceEnd * sampleRate),
  );

  const beforeLength = replaceStartSample;
  const afterLength = Math.max(0, original.length - replaceEndSample);
  const totalLength = beforeLength + afterLength + loopBuffer.length;

  const stitched = ctx.createBuffer(
    Math.max(original.numberOfChannels, loopBuffer.numberOfChannels),
    totalLength,
    sampleRate,
  );

  for (let channel = 0; channel < stitched.numberOfChannels; channel++) {
    const target = stitched.getChannelData(channel);
    const originalChannel =
      original.getChannelData(Math.min(channel, original.numberOfChannels - 1));
    const loopChannel =
      loopBuffer.getChannelData(Math.min(channel, loopBuffer.numberOfChannels - 1));

    let offset = 0;
    offset += copyChannelSlice(originalChannel, target, 0, replaceStartSample, offset);
    offset += copyChannelSlice(
      originalChannel,
      target,
      replaceEndSample,
      original.length,
      offset,
    );
    copyChannelSlice(loopChannel, target, 0, loopBuffer.length, offset);
  }

  return stitched;
}

export function useRenderer(
  buffer: AudioBuffer | null,
  file: File | null,
  { settingsRef, cropRef, replaceRef, appendLoopToEndRef }: RendererRefs,
) {
  const [isRendering, setIsRendering] = useState(false);

  const renderSelection = useCallback(async (): Promise<AudioBuffer | null> => {
    if (!buffer) return null;
    const s = settingsRef.current;
    const { start, end } = cropRef.current;
    if (end - start < 0.02) return null;

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

    return offline.startRendering();
  }, [buffer, settingsRef, cropRef]);

  const download = useCallback(async () => {
    if (!buffer) return;
    const { start, end } = cropRef.current;
    if (end - start < 0.02) {
      showError("Selection is too short to render.");
      return;
    }

    setIsRendering(true);
    try {
      const renderedLoop = await renderSelection();
      if (!renderedLoop) {
        showError("Selection is too short to render.");
        return;
      }

      let finalBuffer = renderedLoop;

      if (appendLoopToEndRef.current) {
        const offline = new OfflineAudioContext(
          Math.max(buffer.numberOfChannels, renderedLoop.numberOfChannels),
          Math.max(buffer.length, 1),
          buffer.sampleRate,
        );
        const { start: replaceStart, end: replaceEnd } = replaceRef.current;
        finalBuffer = stitchBuffers(
          offline,
          buffer,
          renderedLoop,
          replaceStart,
          replaceEnd,
        );
      }

      const blob = encodeWav(finalBuffer);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = file?.name?.replace(/\.[^.]+$/, "") ?? "rebass";
      a.href = url;
      a.download = `${base}-rebass.wav`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showSuccess(
        appendLoopToEndRef.current
          ? "Exported with the loop appended to the end."
          : "Rendered & downloaded your WAV!",
      );
    } catch {
      showError("Rendering failed. Try a shorter selection.");
    } finally {
      setIsRendering(false);
    }
  }, [buffer, file, cropRef, renderSelection, replaceRef, appendLoopToEndRef]);

  return { isRendering, download, renderSelection };
}