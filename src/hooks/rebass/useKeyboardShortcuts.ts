import { useEffect } from "react";
import { useRebass } from "@/hooks/use-rebass";

export function useKeyboardShortcuts() {
  const {
    isPlaying,
    preview,
    stop,
    loop,
    setLoop,
    download,
    shareSettings,
    cropStart,
    cropEnd,
    setCrop,
    buffer,
  } = useRebass();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const dur = buffer?.duration ?? 0;
      const nudge = e.shiftKey ? 1 : 0.1;

      switch (e.key) {
        case " ":
          e.preventDefault();
          isPlaying ? stop() : preview(false);
          break;
        case "o":
        case "O":
          e.preventDefault();
          isPlaying ? stop() : preview(true);
          break;
        case "l":
        case "L":
          e.preventDefault();
          setLoop(!loop);
          break;
        case "d":
        case "D":
          e.preventDefault();
          download();
          break;
        case "s":
        case "S":
          e.preventDefault();
          shareSettings();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.altKey) {
            setCrop(cropStart, Math.max(cropStart + 0.02, cropEnd - nudge));
          } else {
            setCrop(Math.max(0, cropStart - nudge), cropEnd);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.altKey) {
            setCrop(cropStart, Math.min(dur, cropEnd + nudge));
          } else {
            setCrop(Math.min(cropEnd - 0.02, cropStart + nudge), cropEnd);
          }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    isPlaying,
    preview,
    stop,
    loop,
    setLoop,
    download,
    shareSettings,
    cropStart,
    cropEnd,
    setCrop,
    buffer,
  ]);
}