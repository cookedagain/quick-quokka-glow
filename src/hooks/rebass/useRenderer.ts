import { useCallback, useState } from "react";
import { buildGraph } from "@/lib/audio/graph";
import { encodeWav } from "@/lib/audio/wavEncoder";
import { showError, showSuccess } from "@/utils/toast";
import type { EngineRefs } from "./types";

type RendererRefs = Pick<EngineRefs, "settingsRef" | "cropRef">;

export function useRenderer(
  buffer: AudioBuffer | null,
  file: File | null,
  { settingsRef, cropRef }: RendererRefs,
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
      const rendered = await renderSelection();
      if (!rendered) {
        showError("Selection is too short to render.");
        return;
      }
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
    } catch {
      showError("Rendering failed. Try a shorter selection.");
    } finally {
      setIsRendering(false);
    }
  }, [buffer, file, cropRef, renderSelection]);

  return { isRendering, download, renderSelection };
}