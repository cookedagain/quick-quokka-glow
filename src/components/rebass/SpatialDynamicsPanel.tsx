import { Orbit } from "lucide-react";
import { PanelCard } from "./PanelCard";
import { LabeledSlider } from "./LabeledSlider";
import { useRebass } from "@/hooks/use-rebass";

export const SpatialDynamicsPanel = () => {
  const { settings, updateSettings } = useRebass();
  return (
    <PanelCard title="Spatial & Dynamics" icon={Orbit}>
      <div className="space-y-4">
        <LabeledSlider
          label="8D depth"
          value={settings.panDepth}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => updateSettings({ panDepth: v })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <LabeledSlider
          label="8D rate"
          value={settings.panRate}
          min={0.05}
          max={2}
          step={0.05}
          onChange={(v) => updateSettings({ panRate: v })}
          format={(v) => `${v.toFixed(2)} Hz`}
        />
        <LabeledSlider
          label="Stereo pan"
          value={settings.stereoPan}
          min={-1}
          max={1}
          step={0.01}
          onChange={(v) => updateSettings({ stereoPan: v })}
          format={(v) =>
            v === 0 ? "C" : v < 0 ? `L${Math.round(-v * 100)}` : `R${Math.round(v * 100)}`
          }
        />
        <LabeledSlider
          label="Volume / gain"
          value={settings.gain}
          min={0}
          max={2}
          step={0.01}
          onChange={(v) => updateSettings({ gain: v })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </div>
    </PanelCard>
  );
};