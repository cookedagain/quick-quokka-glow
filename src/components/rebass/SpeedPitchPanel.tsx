import { Gauge } from "lucide-react";
import { PanelCard } from "./PanelCard";
import { LabeledSlider } from "./LabeledSlider";
import { Switch } from "@/components/ui/switch";
import { useRebass } from "@/hooks/use-rebass";

export const SpeedPitchPanel = () => {
  const { settings, updateSettings } = useRebass();
  return (
    <PanelCard title="Speed & Pitch" icon={Gauge}>
      <div className="space-y-4">
        <LabeledSlider
          label="Speed (slowed / sped up)"
          value={settings.speed}
          min={0.5}
          max={1.5}
          step={0.01}
          onChange={(v) => updateSettings({ speed: v })}
          format={(v) => `${v.toFixed(2)}x`}
        />
        <LabeledSlider
          label="Pitch (semitones)"
          value={settings.pitch}
          min={-12}
          max={12}
          step={1}
          onChange={(v) => updateSettings({ pitch: v })}
          format={(v) => `${v > 0 ? "+" : ""}${v}`}
        />
        <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2.5">
          <div>
            <p className="text-xs font-medium">Lock pitch to speed</p>
            <p className="text-[11px] text-muted-foreground">
              Classic slowed sound
            </p>
          </div>
          <Switch
            checked={settings.lockPitchToSpeed}
            onCheckedChange={(c) => updateSettings({ lockPitchToSpeed: c })}
          />
        </div>
      </div>
    </PanelCard>
  );
};