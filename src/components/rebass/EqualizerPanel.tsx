import { SlidersVertical } from "lucide-react";
import { PanelCard } from "./PanelCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useRebass } from "@/hooks/use-rebass";
import { EQ_FREQUENCIES, EQ_PRESETS } from "@/lib/audio/types";

const freqLabel = (f: number) => (f >= 1000 ? `${f / 1000}k` : `${f}`);

export const EqualizerPanel = () => {
  const { settings, updateSettings } = useRebass();

  const setBand = (i: number, v: number) => {
    const eq = [...settings.eq];
    eq[i] = v;
    updateSettings({ eq });
  };

  return (
    <PanelCard title="Equalizer" icon={SlidersVertical}>
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.keys(EQ_PRESETS).map((name) => (
          <Button
            key={name}
            size="sm"
            variant="secondary"
            className="h-7 rounded-lg text-xs"
            onClick={() => updateSettings({ eq: [...EQ_PRESETS[name]] })}
          >
            {name}
          </Button>
        ))}
      </div>
      <div className="flex justify-between gap-1">
        {EQ_FREQUENCIES.map((freq, i) => (
          <div key={freq} className="flex flex-1 flex-col items-center gap-2">
            <div className="h-28">
              <Slider
                orientation="vertical"
                value={[settings.eq[i]]}
                min={-12}
                max={12}
                step={1}
                className="h-full"
                onValueChange={(v) => setBand(i, v[0])}
              />
            </div>
            <span className="font-mono text-[10px] text-neon">
              {settings.eq[i] > 0 ? "+" : ""}
              {settings.eq[i]}
            </span>
            <span className="text-[9px] text-muted-foreground">
              {freqLabel(freq)}
            </span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
};