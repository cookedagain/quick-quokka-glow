import { useEffect, useRef, useState } from "react";
import { useRebass } from "@/hooks/use-rebass";
import { computePeaks } from "@/lib/audio/waveform";

type DragMode = "none" | "start" | "end" | "seek";

export const WaveformEditor = () => {
  const {
    buffer,
    cropStart,
    cropEnd,
    setCrop,
    zoom,
    pan,
    playhead,
    setPlayhead,
    seekTo,
  } = useRebass();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 200 });
  const dragRef = useRef<DragMode>("none");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const duration = buffer?.duration ?? 1;
  const visible = duration / zoom;
  const viewStart = Math.max(0, Math.min(pan, duration - visible));
  const viewEnd = viewStart + visible;

  const timeToX = (t: number) => ((t - viewStart) / visible) * size.w;
  const xToTime = (x: number) => viewStart + (x / size.w) * visible;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !buffer) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size.w, size.h);

    const mid = size.h / 2;
    const channel = buffer.getChannelData(0);
    const startSample = Math.floor(viewStart * buffer.sampleRate);
    const endSample = Math.floor(viewEnd * buffer.sampleRate);
    const peaks = computePeaks(channel, startSample, endSample, size.w);

    const selX0 = Math.max(0, timeToX(cropStart));
    const selX1 = Math.min(size.w, timeToX(cropEnd));
    ctx.fillStyle = "rgba(167,139,250,0.10)";
    ctx.fillRect(selX0, 0, selX1 - selX0, size.h);

    const grad = ctx.createLinearGradient(0, 0, 0, size.h);
    grad.addColorStop(0, "rgba(34,211,238,0.9)");
    grad.addColorStop(0.5, "rgba(167,139,250,0.9)");
    grad.addColorStop(1, "rgba(34,211,238,0.9)");
    ctx.fillStyle = grad;
    for (let x = 0; x < size.w; x++) {
      const p = peaks[x];
      if (!p) continue;
      const yMax = mid - p.max * mid * 0.92;
      const yMin = mid - p.min * mid * 0.92;
      ctx.fillRect(x, yMax, 1, Math.max(1, yMin - yMax));
    }

    ctx.fillStyle = "rgba(167,139,250,0.95)";
    ctx.fillRect(selX0 - 1, 0, 2, size.h);
    ctx.fillRect(selX1 - 1, 0, 2, size.h);

    ctx.fillStyle = "rgba(34,211,238,1)";
    ctx.fillRect(selX0 - 4, mid - 20, 8, 40);
    ctx.fillRect(selX1 - 4, mid - 20, 8, 40);

    const phX = timeToX(playhead);
    if (phX >= 0 && phX <= size.w) {
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillRect(phX - 1, 0, 2, size.h);
    }
  }, [
    buffer,
    size,
    zoom,
    pan,
    cropStart,
    cropEnd,
    playhead,
    viewStart,
    viewEnd,
    visible,
  ]);

  const getTime = (clientX: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return xToTime(clientX - rect.left);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!buffer) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const t = getTime(e.clientX);
    const handleTolPx = 22;
    const handleTol = (handleTolPx / size.w) * visible;

    if (Math.abs(t - cropStart) < handleTol) {
      dragRef.current = "start";
      return;
    }

    if (Math.abs(t - cropEnd) < handleTol) {
      dragRef.current = "end";
      return;
    }

    dragRef.current = "seek";
    setPlayhead(Math.max(0, Math.min(duration, t)));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current === "none" || !buffer) return;

    const t = Math.max(0, Math.min(duration, getTime(e.clientX)));
    if (dragRef.current === "start") {
      setCrop(Math.min(t, cropEnd - 0.02), cropEnd);
    } else if (dragRef.current === "end") {
      setCrop(cropStart, Math.max(t, cropStart + 0.02));
    } else if (dragRef.current === "seek") {
      setPlayhead(t);
    }
  };

  const onPointerUp = async (e: React.PointerEvent) => {
    if (!buffer) {
      dragRef.current = "none";
      return;
    }

    const mode = dragRef.current;
    dragRef.current = "none";

    if (mode !== "seek") return;

    const t = Math.max(0, Math.min(duration, getTime(e.clientX)));
    setPlayhead(t);

    await seekTo(t);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-48 w-full overflow-hidden rounded-2xl border border-border bg-secondary/40 md:h-56"
    >
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h }}
        className="touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragRef.current = "none";
        }}
      />
    </div>
  );
};