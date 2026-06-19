import { createAudioContext } from "./context";

export interface SweepHandle {
  stop: () => void;
}

export interface SweepOptions {
  startFreq: number;
  endFreq: number;
  duration: number;
  loop: boolean;
  gain: number;
  onTick?: (freq: number) => void;
  onEnded?: () => void;
}

export function startSweep(opts: SweepOptions): SweepHandle {
  const ctx = createAudioContext();
  ctx.resume();

  const osc = ctx.createOscillator();
  osc.type = "sine";

  const gain = ctx.createGain();
  gain.gain.value = 0.0001;

  osc.connect(gain);
  gain.connect(ctx.destination);

  let stopped = false;
  let rafId: number | null = null;
  const now = ctx.currentTime;

  const schedule = (t0: number) => {
    osc.frequency.setValueAtTime(opts.startFreq, t0);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, opts.endFreq),
      t0 + opts.duration,
    );
    // Click-free envelope.
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(opts.gain, t0 + 0.05);
    gain.gain.setValueAtTime(opts.gain, t0 + opts.duration - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.duration);
  };

  schedule(now);
  osc.start(now);

  const startedAt = now;

  const tick = () => {
    if (stopped) return;
    const elapsed = (ctx.currentTime - startedAt) % opts.duration;
    const ratio = elapsed / opts.duration;
    const freq =
      opts.startFreq * Math.pow(opts.endFreq / opts.startFreq, ratio);
    opts.onTick?.(freq);
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    try {
      osc.stop();
    } catch {
      // already stopped
    }
    osc.disconnect();
    gain.disconnect();
    ctx.close();
    opts.onEnded?.();
  };

  if (opts.loop) {
    // Reschedule the ramp each cycle.
    const interval = setInterval(() => {
      if (stopped) {
        clearInterval(interval);
        return;
      }
      schedule(ctx.currentTime);
    }, opts.duration * 1000);
    const origCleanup = cleanup;
    return {
      stop: () => {
        clearInterval(interval);
        origCleanup();
      },
    };
  }

  osc.stop(now + opts.duration);
  osc.onended = cleanup;

  return { stop: cleanup };
}