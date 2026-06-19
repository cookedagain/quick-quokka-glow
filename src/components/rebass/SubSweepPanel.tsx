import { useEffect, useRef, useState } from "react";
import { Radar, Play, Square } from "lucide-react";
import { PanelCard } from "./PanelCard";
import { LabeledSlider } from "./LabeledSlider";
import { Button } from "@/components/ui/button";
import { startSweep, type SweepHandle } from "@/lib/audio/sweep";

export const SubSweepPanel = () => {
  const [startFreq, setStartFreq] = useState(20);
  const [endFreq, setEndFreq] = useState(120);
  const [duration, setDuration] = useState(8);
  const [level, setLevel] = useState(0.4);
  const [playing, setPlaying] = useState(false);
  const [currentFreq, setCurrentFreq] = useState(startFreq);
  const handleRef = useRef<SweepHandle | null>(null);

  const stop = () => {
    handleRef.current?.stop();
    handleRef.current = null;
    setPlaying(false);
  };

  const start = () => {
    stop();
    handleRef.current = startSweep({
      startFreq,
      endFreq,
      duration,
      loop: true,
      gain: level,
      onTick: (f) => setCurrentFreq(f),
      onEnded: () => setPlaying(false),
    });
    setPlaying(true);
  };

  useEffect(() => () => handleRef.current?.stop(), []);

  return (
    <PanelCard title="Sub Sweep" icon={Radar}>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Sweeps a sine tone across the low end to find where your sub rattles or
        drops off. Start quiet and raise the level carefully.
      </p>

      <div className="mb-4 flex items-center justify-center rounded-xl bg-secondary/50 py-4">
        <span className="font-mono text-3xl text-neon">
          {Math.round(currentFreq)}
          <span className="ml-1 text-sm text-muted-foreground">Hz</span>
        </span>
      </div>

      <div className="space-y-4">
        <LabeledSlider
          label="Start frequency"
          value={startFreq}
          min={10}
          max={200}
          step={1}
          onChange={setStartFreq}
          format={(v) => `${v} Hz`}
        />
        <LabeledSlider
          label="End frequency"
          value={endFreq}
          min={20}
          max={300}
          step={1}
          onChange={setEndFreq}
          format={(v) => `${v} Hz`}
        />
        <LabeledSlider
          label="Sweep time"
          value={duration}
          min={2}
          max={30}
          step={1}
          onChange={setDuration}
          format={(v) => `${v}s`}
        />
        <LabeledSlider
          label="Level"
          value={level}
          min={0.05}
          max={1}
          step={0.05}
          onChange={setLevel}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </div>

      <Button
        onClick={() => (playing ? stop() : start())}
        className="mt-4 h-10 w-full rounded-xl bg-neon text-accent-foreground hover:bg-neon/90 glow-cyan"
      >
        {playing ? (
          <>
            <Square className="mr-2 h-4 w-4" /> Stop sweep
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" /> Start sweep
          </>
        )}
      </Button>
    </PanelCard>
  );
};