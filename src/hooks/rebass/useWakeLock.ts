import { useEffect } from "react";

type WakeLockSentinelLike = {
  release: () => Promise<void>;
};

export function useWakeLock(active: boolean) {
  useEffect(() => {
    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
        };
        if (active && nav.wakeLock) {
          sentinel = await nav.wakeLock.request("screen");
        }
      } catch {
        // Wake lock not available — ignore silently.
      }
    };

    if (active) request();

    const onVisibility = () => {
      if (active && document.visibilityState === "visible" && !cancelled) {
        request();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}