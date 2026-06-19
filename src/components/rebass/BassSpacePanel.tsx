import { Waves } from "lucide-react";
import { PanelCard } from "./PanelCard";
import { LabeledSlider } from "./LabeledSlider";
import { useRebass } from "@/hooks/use-rebass";

export const BassSpacePanel = () => {
  const { settings, updateSettings } = useRebass();
  return (
    <PanelCard title="Bass & Space" icon={Waves}>
      <div className="space-y-4">
        <LabeledSlider
          label="Bass boost"
          value={settings.bassBoost}
          min={0}
          max={18}
          step={0.5}
          onChange={(v) => updateSettings({ bassBoost: v })}
          format={(v) => `${v.toFixed(1)} dB`}
        />
        <LabeledSlider
          label="Reverb mix"
          value={settings.reverbMix}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => updateSettings({ reverbMix: v })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <LabeledSlider
          label="Reverb room size"
          value={settings.reverbRoomSize}
          min={0.3}
          max={5}
          step={0.1}
          onChange={(v) => updateSettings({ reverbRoomSize: v })}
          format={(v) => `${v.toFixed(1)}s`}
        />
        <LabeledSlider
          label="Echo mix"
          value={settings.echoMix}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => updateSettings({ echoMix: v })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <LabeledSlider
          label="Echo time"
          value={settings.echoTime}
          min={0.05}
          max={1}
          step={0.01}
          onChange={(v) => updateSettings({ echoTime: v })}
          format={(v) => `${Math.round(v * 1000)}ms`}
        />
        <LabeledSlider
          label="Echo feedback"
          value={settings.echoFeedback}
          min={0}
          max={0.9}
          step={0.01}
          onChange={(v) => updateSettings({ echoFeedback: v })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </div>
    </PanelCard>
  );
};