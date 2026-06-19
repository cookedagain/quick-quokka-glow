import { useState } from "react";
import { Activity, Loader2, Wand2 } from "lucide-react";
import { PanelCard } from "./PanelCard";
import { Button } from "@/components/ui/button";
import { useRebass } from "@/hooks/use-rebass";
import { computeLoudness, gainForTarget } from "@/lib/audio/loudness";
import { showError, showSuccess } from "@/utils/toast";

const TARGET_LUFS = -14;

export const LoudnessPanel = () => {
  const { renderSelection, settings, updateSettings } = useRebass();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ lufs: number; peakDb: number } | null>(
    null,
  );

  const measure = async () => {
    setBusy(true);
    try {
      const buf = await renderSelection();
      if (!buf) {
        showError("Selection is too short to analyze.");
        return;
      }
      const l = computeLoudness(buf);
      setResult({ lufs: l.lufs, peakDb: l.peakDb });
    } finally {
      setBusy(false);
    }
  };

  const normalize = async () => {
    setBusy(true);
    try {
      const buf = await renderSelection();
      if (!buf) {
        showError("Selection is too short to normalize.");
        return;
      }
      const l = computeLoudness(buf);
      const factor = gainForTarget(l.lufs, TARGET_LUFS);
      const newGain = Math.max(0, Math.min(2, settings.gain * factor));
      updateSettings({ gain: newGain });
      setResult({ lufs: l.lufs, peakDb: l.peakDb });
      showSuccess(`Normalized toward ${TARGET_LUFS} LUFS.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelCard title="Loudness" icon={Activity}>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Approximate loudness of your processed selection. Normalize aims for{" "}
        {TARGET_LUFS} LUFS — handy when A/B-ing against the original.
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-secondary/50 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Loudness
          </p>
          <p className="font-mono text-lg text-neon">
            {result && isFinite(result.lufs)
              ? `${result.lufs.toFixed(1)}`
              : "—"}
            <span className="ml-1 text-xs text-muted-foreground">LUFS</span>
          </p>
        </div>
        <div className="rounded-xl bg-secondary/50 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            True peak
          </p>
          <p className="font-mono text-lg text-neon">
            {result && isFinite(result.peakDb)
              ? `${result.peakDb.toFixed(1)}`
              : "—"}
            <span className="ml-1 text-xs text-muted-foreground">dB</span>
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="h-9 flex-1 rounded-xl"
          onClick={measure}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Activity className="mr-2 h-4 w-4" />
          )}
          Measure
        </Button>
        <Button
          className="h-9 flex-1 rounded-xl bg-neon-violet text-primary-foreground hover:bg-neon-violet/90"
          onClick={normalize}
          disabled={busy}
        >
          <Wand2 className="mr-2 h-4 w-4" /> Normalize
        </Button>
      </div>
    </PanelCard>
  );
};