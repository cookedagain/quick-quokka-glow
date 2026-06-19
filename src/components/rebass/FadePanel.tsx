import { TrendingUp } from "lucide-react";
import { PanelCard } from "./PanelCard";
import { LabeledSlider } from "./LabeledSlider";
import { useRebass } from "@/hooks/use-rebass";

export const FadePanel = () => {
  const { settings, updateSettings } = useRebass();
  return (
    <PanelCard title="Fades" icon={TrendingUp}>
      <div className="space-y-4">
        <LabeledSlider
          label="Fade in"
          value={settings.fadeIn}
          min={0}
          max={5}
          step={0.1}
          onChange={(v) => updateSettings({ fadeIn: v })}
          format={(v) => `${v.toFixed(1)}s`}
        />
        <LabeledSlider
          label="Fade out"
          value={settings.fadeOut}
          min={0}
          max={5}
          step={0.1}
          onChange={(v) => updateSettings({ fadeOut: v })}
          format={(v) => `${v.toFixed(1)}s`}
        />
        <p className="text-[11px] text-muted-foreground">
          Fades apply to the exported file and non-looped previews.
        </p>
      </div>
    </PanelCard>
  );
};